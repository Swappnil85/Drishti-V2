/**
 * Advanced Authentication Service
 * Enhanced security features including MFA, device fingerprinting, and role-based access
 */

import { FastifyRequest } from 'fastify';
import { jwtService } from '../../auth/jwt';
import { authService } from '../../auth/service';
import crypto from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  ipAddress: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  screenResolution?: string;
  timezone?: string;
  platform?: string;
  hash: string;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  type: 'totp' | 'sms' | 'email';
  challenge: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  level: number;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceFingerprint: DeviceFingerprint;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  mfaVerified: boolean;
  role: UserRole;
}

class AdvancedAuthService {
  private activeSessions: Map<string, SessionInfo> = new Map();
  private mfaChallenges: Map<string, MFAChallenge> = new Map();
  private deviceTrust: Map<string, boolean> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  // Default roles
  private readonly roles: Map<string, UserRole> = new Map([
    ['user', { id: 'user', name: 'User', permissions: ['read:own'], level: 1 }],
    [
      'premium',
      {
        id: 'premium',
        name: 'Premium User',
        permissions: ['read:own', 'write:own', 'export:own'],
        level: 2,
      },
    ],
    [
      'admin',
      {
        id: 'admin',
        name: 'Administrator',
        permissions: ['read:all', 'write:all', 'delete:all', 'admin:system'],
        level: 10,
      },
    ],
  ]);

  /**
   * Generate device fingerprint from request
   */
  generateDeviceFingerprint(request: FastifyRequest): DeviceFingerprint {
    const userAgent = request.headers['user-agent'] || '';
    const ipAddress = request.ip;
    const acceptLanguage = request.headers['accept-language'] || '';
    const acceptEncoding = request.headers['accept-encoding'] || '';
    const screenResolution = request.headers['x-screen-resolution'] as string;
    const timezone = request.headers['x-timezone'] as string;
    const platform = request.headers['x-platform'] as string;

    // Create hash of fingerprint components
    const fingerprintData = `${userAgent}|${ipAddress}|${acceptLanguage}|${acceptEncoding}|${screenResolution}|${timezone}|${platform}`;
    const hash = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    return {
      userAgent,
      ipAddress,
      acceptLanguage,
      acceptEncoding,
      screenResolution,
      timezone,
      platform,
      hash,
    };
  }

  /**
   * Enhanced authentication with device fingerprinting
   */
  async authenticateWithFingerprinting(request: FastifyRequest): Promise<{
    success: boolean;
    user?: any;
    session?: SessionInfo;
    requiresMFA?: boolean;
    error?: string;
  }> {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Authorization header required' };
      }

      const token = authHeader.substring(7);
      const payload = jwtService.verifyAccessToken(token);

      if (!payload) {
        return { success: false, error: 'Invalid or expired token' };
      }

      // Get user details
      const user = await authService.getUserById(payload.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate device fingerprint
      const fingerprint = this.generateDeviceFingerprint(request);

      // Check for suspicious activity
      if (this.suspiciousIPs.has(fingerprint.ipAddress)) {
        return { success: false, error: 'Access denied from suspicious IP' };
      }

      // Get or create session
      const sessionId = (payload as any).sessionId || crypto.randomUUID();
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        session = await this.createSession(user.id, fingerprint, request);
      } else {
        // Update last activity
        session.lastActivity = new Date();
        this.activeSessions.set(session.id, session);
      }

      // Check if device is trusted
      const deviceTrusted = this.deviceTrust.get(fingerprint.hash) || false;

      // Determine if MFA is required
      const requiresMFA =
        !session.mfaVerified &&
        (!deviceTrusted || this.isHighRiskActivity(request));

      return {
        success: true,
        user,
        session,
        requiresMFA,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Create new session
   */
  private async createSession(
    userId: string,
    fingerprint: DeviceFingerprint,
    request: FastifyRequest
  ): Promise<SessionInfo> {
    const sessionId = crypto.randomUUID();

    // Get user role (default to 'user')
    const userRole = this.roles.get('user')!;

    const session: SessionInfo = {
      id: sessionId,
      userId,
      deviceFingerprint: fingerprint,
      ipAddress: fingerprint.ipAddress,
      userAgent: fingerprint.userAgent,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      mfaVerified: false,
      role: userRole,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Check if activity is high risk
   */
  private isHighRiskActivity(request: FastifyRequest): boolean {
    const path = request.url;
    const method = request.method;

    // High-risk activities
    const highRiskPaths = [
      '/auth/logout-all',
      '/financial/accounts',
      '/batch/operations',
      '/admin',
    ];

    const highRiskMethods = ['DELETE', 'PUT'];

    return (
      highRiskPaths.some(riskPath => path.includes(riskPath)) ||
      highRiskMethods.includes(method)
    );
  }

  /**
   * Initiate MFA challenge
   */
  async initiateMFAChallenge(
    userId: string,
    type: 'totp' | 'sms' | 'email' = 'totp'
  ): Promise<{
    success: boolean;
    challengeId?: string;
    challenge?: string;
    error?: string;
  }> {
    try {
      const challengeId = crypto.randomUUID();
      const challenge = this.generateMFAChallenge(type);

      const mfaChallenge: MFAChallenge = {
        id: challengeId,
        userId,
        type,
        challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        maxAttempts: 3,
      };

      this.mfaChallenges.set(challengeId, mfaChallenge);

      // In a real implementation, send SMS/email here
      console.log(`MFA Challenge for user ${userId}: ${challenge}`);

      return {
        success: true,
        challengeId,
        challenge: type === 'totp' ? undefined : challenge, // Don't return TOTP secret
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to initiate MFA',
      };
    }
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFAChallenge(
    challengeId: string,
    response: string
  ): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const challenge = this.mfaChallenges.get(challengeId);
    if (!challenge) {
      return { success: false, error: 'Invalid challenge ID' };
    }

    if (new Date() > challenge.expiresAt) {
      this.mfaChallenges.delete(challengeId);
      return { success: false, error: 'Challenge expired' };
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      this.mfaChallenges.delete(challengeId);
      return { success: false, error: 'Too many attempts' };
    }

    challenge.attempts++;

    // Verify response
    const isValid = this.verifyMFAResponse(challenge, response);

    if (!isValid) {
      if (challenge.attempts >= challenge.maxAttempts) {
        this.mfaChallenges.delete(challengeId);
      }
      return { success: false, error: 'Invalid response' };
    }

    // Mark session as MFA verified
    const userSessions = Array.from(this.activeSessions.values()).filter(
      session => session.userId === challenge.userId
    );

    userSessions.forEach(session => {
      session.mfaVerified = true;
      this.activeSessions.set(session.id, session);
    });

    this.mfaChallenges.delete(challengeId);

    return {
      success: true,
      sessionId: userSessions[0]?.id,
    };
  }

  /**
   * Generate MFA challenge
   */
  private generateMFAChallenge(type: 'totp' | 'sms' | 'email'): string {
    switch (type) {
      case 'totp':
        return crypto.randomBytes(20).toString('hex');
      case 'sms':
      case 'email':
        return Math.floor(100000 + Math.random() * 900000).toString();
      default:
        throw new Error('Unsupported MFA type');
    }
  }

  /**
   * Verify MFA response
   */
  private verifyMFAResponse(
    challenge: MFAChallenge,
    response: string
  ): boolean {
    switch (challenge.type) {
      case 'totp':
        // In a real implementation, use a TOTP library
        return response.length === 6 && /^\d+$/.test(response);
      case 'sms':
      case 'email':
        return response === challenge.challenge;
      default:
        return false;
    }
  }

  /**
   * Check user permissions
   */
  hasPermission(session: SessionInfo, permission: string): boolean {
    return (
      session.role.permissions.includes(permission) ||
      session.role.permissions.includes('admin:system')
    );
  }

  /**
   * Get user role
   */
  getUserRole(roleId: string): UserRole | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Trust device
   */
  trustDevice(deviceHash: string): void {
    this.deviceTrust.set(deviceHash, true);
  }

  /**
   * Mark IP as suspicious
   */
  markIPSuspicious(ipAddress: string): void {
    this.suspiciousIPs.add(ipAddress);
  }

  /**
   * Get active sessions for user
   */
  getUserSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.userId === userId && session.isActive
    );
  }

  /**
   * Terminate session
   */
  terminateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Terminate all user sessions
   */
  terminateAllUserSessions(userId: string): number {
    const userSessions = this.getUserSessions(userId);
    userSessions.forEach(session => {
      this.terminateSession(session.id);
    });
    return userSessions.length;
  }

  /**
   * Clean up expired sessions and challenges
   */
  cleanup(): void {
    const now = new Date();

    // Clean up expired sessions (inactive for 1 hour)
    const expiredSessions = Array.from(this.activeSessions.entries()).filter(
      ([, session]) =>
        now.getTime() - session.lastActivity.getTime() > 60 * 60 * 1000
    );

    expiredSessions.forEach(([sessionId]) => {
      this.activeSessions.delete(sessionId);
    });

    // Clean up expired MFA challenges
    const expiredChallenges = Array.from(this.mfaChallenges.entries()).filter(
      ([, challenge]) => now > challenge.expiresAt
    );

    expiredChallenges.forEach(([challengeId]) => {
      this.mfaChallenges.delete(challengeId);
    });

    if (expiredSessions.length > 0 || expiredChallenges.length > 0) {
      console.log(
        `Cleaned up ${expiredSessions.length} sessions and ${expiredChallenges.length} MFA challenges`
      );
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      activeSessions: this.activeSessions.size,
      pendingMFAChallenges: this.mfaChallenges.size,
      trustedDevices: this.deviceTrust.size,
      suspiciousIPs: this.suspiciousIPs.size,
      availableRoles: Array.from(this.roles.keys()),
    };
  }
}

export const advancedAuthService = new AdvancedAuthService();

// Start cleanup interval
setInterval(
  () => {
    advancedAuthService.cleanup();
  },
  5 * 60 * 1000
); // Every 5 minutes
