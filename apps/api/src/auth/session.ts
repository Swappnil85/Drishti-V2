import { query } from '../db/connection';
import { jwtService } from './jwt';
import crypto from 'crypto';

// Session interfaces
export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  created_at: Date;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  isActive: boolean;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  deviceInfo?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  expiresInDays?: number;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: SessionInfo;
  error?: string;
}

// Session management service
export class SessionService {
  private static instance: SessionService;

  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Create a new session
  async createSession(data: CreateSessionData): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();
    const refreshTokenHash = this.hashToken(data.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30)); // Default 30 days

    const result = await query<Session>(
      `
      INSERT INTO sessions (
        id, user_id, refresh_token_hash, device_info, ip_address, 
        user_agent, is_active, expires_at, last_activity_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        sessionId,
        data.userId,
        refreshTokenHash,
        data.deviceInfo || null,
        data.ipAddress || null,
        data.userAgent || null,
        true,
        expiresAt,
        new Date(),
      ]
    );

    const session = result[0];
    return this.mapSessionToInfo(session);
  }

  // Validate session by refresh token
  async validateSession(
    refreshToken: string
  ): Promise<SessionValidationResult> {
    try {
      // Verify JWT token first
      const payload = jwtService.verifyRefreshToken(refreshToken);
      const refreshTokenHash = this.hashToken(refreshToken);

      // Find active session
      const result = await query<Session>(
        `
        SELECT * FROM sessions 
        WHERE refresh_token_hash = $1 
        AND user_id = $2 
        AND is_active = true 
        AND expires_at > NOW()
      `,
        [refreshTokenHash, payload.userId]
      );

      if (result.length === 0) {
        return {
          isValid: false,
          error: 'Session not found or expired',
        };
      }

      const session = result[0];

      // Update last activity
      await this.updateLastActivity(session.id);

      return {
        isValid: true,
        session: this.mapSessionToInfo(session),
      };
    } catch (error) {
      console.error('[SessionService] Session validation failed:', error);
      return {
        isValid: false,
        error: 'Invalid session token',
      };
    }
  }

  // Update session activity
  async updateLastActivity(
    sessionId: string,
    ipAddress?: string
  ): Promise<void> {
    const updateFields = ['last_activity_at = NOW()'];
    const values = [sessionId];

    if (ipAddress) {
      updateFields.push('ip_address = $2');
      values.push(ipAddress);
    }

    await query(
      `
      UPDATE sessions 
      SET ${updateFields.join(', ')}
      WHERE id = $1
    `,
      values
    );
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    await query(
      `
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `,
      [sessionId]
    );
  }

  // Revoke session by refresh token
  async revokeSessionByToken(refreshToken: string): Promise<void> {
    try {
      const refreshTokenHash = this.hashToken(refreshToken);
      await query(
        `
        UPDATE sessions 
        SET is_active = false, updated_at = NOW()
        WHERE refresh_token_hash = $1
      `,
        [refreshTokenHash]
      );
    } catch (error) {
      console.error(
        '[SessionService] Failed to revoke session by token:',
        error
      );
    }
  }

  // Revoke all sessions for a user
  async revokeAllUserSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<void> {
    let whereClause = 'user_id = $1';
    const values = [userId];

    if (exceptSessionId) {
      whereClause += ' AND id != $2';
      values.push(exceptSessionId);
    }

    await query(
      `
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE ${whereClause}
    `,
      values
    );
  }

  // Get active sessions for a user
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const result = await query<Session>(
      `
      SELECT * FROM sessions 
      WHERE user_id = $1 
      AND is_active = true 
      AND expires_at > NOW()
      ORDER BY last_activity_at DESC
    `,
      [userId]
    );

    return result.map(session => this.mapSessionToInfo(session));
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<number> {
    const result = await query(`
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE expires_at <= NOW() 
      AND is_active = true
    `);

    return result.length;
  }

  // Get session statistics
  async getSessionStats(userId?: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  }> {
    let whereClause = '';
    const values: string[] = [];

    if (userId) {
      whereClause = 'WHERE user_id = $1';
      values.push(userId);
    }

    const result = await query<{
      total_sessions: string;
      active_sessions: string;
      expired_sessions: string;
    }>(
      `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_active = true AND expires_at > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expires_at <= NOW() OR is_active = false THEN 1 END) as expired_sessions
      FROM sessions 
      ${whereClause}
    `,
      values
    );

    const stats = result[0];
    return {
      totalSessions: parseInt(stats.total_sessions, 10),
      activeSessions: parseInt(stats.active_sessions, 10),
      expiredSessions: parseInt(stats.expired_sessions, 10),
    };
  }

  // Check for suspicious activity
  async checkSuspiciousActivity(userId: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check for too many active sessions
    const sessions = await this.getUserSessions(userId);
    if (sessions.length > 10) {
      reasons.push(`Too many active sessions: ${sessions.length}`);
    }

    // Check for sessions from different locations (simplified check)
    const uniqueIPs = new Set(sessions.map(s => s.ipAddress).filter(Boolean));
    if (uniqueIPs.size > 5) {
      reasons.push(`Sessions from ${uniqueIPs.size} different IP addresses`);
    }

    // Check for rapid session creation
    const recentSessions = sessions.filter(s => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return s.createdAt > hourAgo;
    });

    if (recentSessions.length > 3) {
      reasons.push(
        `${recentSessions.length} sessions created in the last hour`
      );
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }

  // Hash refresh token for storage
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Map database session to SessionInfo
  private mapSessionToInfo(session: Session): SessionInfo {
    return {
      sessionId: session.id,
      userId: session.user_id,
      deviceInfo: session.device_info || undefined,
      ipAddress: session.ip_address || undefined,
      userAgent: session.user_agent || undefined,
      isActive: session.is_active,
      expiresAt: session.expires_at,
      lastActivityAt: session.last_activity_at,
      createdAt: session.created_at,
    };
  }

  // Refresh session (extend expiry)
  async refreshSession(
    sessionId: string,
    extendDays: number = 30
  ): Promise<void> {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + extendDays);

    await query(
      `
      UPDATE sessions 
      SET expires_at = $2, last_activity_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND is_active = true
    `,
      [sessionId, newExpiryDate]
    );
  }

  // Get session by ID
  async getSessionById(sessionId: string): Promise<SessionInfo | null> {
    const result = await query<Session>(
      `
      SELECT * FROM sessions 
      WHERE id = $1 AND is_active = true
    `,
      [sessionId]
    );

    return result.length > 0 ? this.mapSessionToInfo(result[0]) : null;
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();
