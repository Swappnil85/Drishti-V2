import { query, transaction } from '../db/connection';
import { jwtService, JWTPayload, TokenPair } from './jwt';
import { emailAuthService } from './providers/email';
import { sessionService, CreateSessionData } from './session';
// Error handling imports will be used in future iterations
// import { AuthErrors, UserErrors, ValidationErrors, logError } from '../utils/errors';

// User interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  password_hash?: string;
  oauth_provider?: 'google' | 'apple' | 'email';
  oauth_id?: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires_at?: Date;
  is_active: boolean;
  last_login_at?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Authentication result
export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  sessionId?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

// Session context for authentication
export interface SessionContext {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Registration data
export interface RegisterData {
  email: string;
  name: string;
  password?: string | undefined;
  provider: 'email' | 'google' | 'apple';
  providerId?: string | undefined;
  avatarUrl?: string | undefined;
}

// Login data
export interface LoginData {
  email: string;
  password?: string;
  provider: 'email' | 'google' | 'apple';
  providerId?: string;
}

// Authentication service
export class AuthService {
  // Register new user
  async register(
    data: RegisterData,
    sessionContext?: SessionContext
  ): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Validate password for email registration
      if (data.provider === 'email' && data.password) {
        const passwordValidation = emailAuthService.validatePassword(
          data.password
        );
        if (!passwordValidation.isValid) {
          return {
            success: false,
            error: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
          };
        }
      }

      // Create user in transaction
      const user = await transaction(async client => {
        let passwordHash: string | undefined;
        let emailVerificationToken: string | undefined;
        let emailVerificationExpiresAt: Date | undefined;

        // Hash password for email registration
        if (data.provider === 'email' && data.password) {
          passwordHash = await emailAuthService.hashPassword(data.password);

          // Generate email verification token
          const verification =
            emailAuthService.generateEmailVerificationToken();
          emailVerificationToken = verification.token;
          emailVerificationExpiresAt = verification.expiresAt;
        }

        // Insert user
        const result = await client.query(
          `
          INSERT INTO users (
            email, name, avatar_url, password_hash, oauth_provider, oauth_id,
            email_verified, email_verification_token, email_verification_expires_at,
            is_active, failed_login_attempts, preferences
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `,
          [
            data.email,
            data.name,
            data.avatarUrl || null,
            passwordHash || null,
            data.provider === 'email' ? null : data.provider,
            data.providerId || null,
            data.provider !== 'email', // OAuth users are pre-verified
            emailVerificationToken || null,
            emailVerificationExpiresAt || null,
            true,
            0,
            JSON.stringify({}),
          ]
        );

        return result.rows[0] as User;
      });

      // Send email verification for email registrations
      if (data.provider === 'email' && user.email_verification_token) {
        try {
          await emailAuthService.sendEmailVerification(
            user.email,
            user.name,
            user.email_verification_token
          );
        } catch (error) {
          console.error('[Auth] Failed to send verification email:', error);
          // Don't fail registration if email sending fails
        }
      }

      // Generate tokens and create session for OAuth users (they're pre-verified)
      let tokens: TokenPair | undefined;
      let sessionId: string | undefined;

      if (data.provider !== 'email') {
        const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
          userId: user.id,
          email: user.email,
          name: user.name,
          provider: data.provider,
        };
        tokens = jwtService.generateTokenPair(payload);

        // Create session
        const sessionData: CreateSessionData = {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          deviceInfo: sessionContext?.deviceInfo,
          ipAddress: sessionContext?.ipAddress,
          userAgent: sessionContext?.userAgent,
        };
        const session = await sessionService.createSession(sessionData);
        sessionId = session.sessionId;

        // Update last login
        await this.updateLastLogin(user.id);
      }

      const result: AuthResult = {
        success: true,
        user,
        requiresEmailVerification: data.provider === 'email',
      };

      if (tokens) {
        result.tokens = tokens;
      }

      if (sessionId) {
        result.sessionId = sessionId;
      }

      return result;
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  }

  // Login user
  async login(
    data: LoginData,
    sessionContext?: SessionContext
  ): Promise<AuthResult> {
    try {
      const user = await this.getUserByEmail(data.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check if account is locked
      if (user.locked_until && user.locked_until > new Date()) {
        const unlockTime = user.locked_until.toLocaleString();
        return {
          success: false,
          error: `Account is locked until ${unlockTime}`,
        };
      }

      // Check if account is active
      if (!user.is_active) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        };
      }

      // Verify credentials based on provider
      let credentialsValid = false;

      if (data.provider === 'email' && data.password) {
        if (!user.password_hash) {
          return {
            success: false,
            error: 'This account uses OAuth authentication',
          };
        }
        credentialsValid = await emailAuthService.verifyPassword(
          data.password,
          user.password_hash
        );
      } else if (data.provider === 'google' || data.provider === 'apple') {
        credentialsValid =
          user.oauth_provider === data.provider &&
          user.oauth_id === data.providerId;
      }

      if (!credentialsValid) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(user.id);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Check email verification for email users
      if (data.provider === 'email' && !user.email_verified) {
        return {
          success: false,
          error: 'Please verify your email address before logging in',
          requiresEmailVerification: true,
        };
      }

      // Reset failed login attempts and update last login
      await this.resetFailedLoginAttempts(user.id);
      await this.updateLastLogin(user.id);

      // Generate tokens
      const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: data.provider,
      };
      const tokens = jwtService.generateTokenPair(payload);

      // Create session
      const sessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo: sessionContext?.deviceInfo,
        ipAddress: sessionContext?.ipAddress,
        userAgent: sessionContext?.userAgent,
      };
      const session = await sessionService.createSession(sessionData);

      return {
        success: true,
        user,
        tokens,
        sessionId: session.sessionId,
      };
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  // Update last login
  private async updateLastLogin(userId: string): Promise<void> {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [
      userId,
    ]);
  }

  // Increment failed login attempts
  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await query(
      `
      UPDATE users 
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
          ELSE locked_until
        END
      WHERE id = $1
    `,
      [userId]
    );
  }

  // Reset failed login attempts
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await query(
      `
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL 
      WHERE id = $1
    `,
      [userId]
    );
  }

  // Verify email
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const result = await query<User>(
        `
        SELECT * FROM users 
        WHERE email_verification_token = $1 
        AND email_verification_expires_at > NOW()
      `,
        [token]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid or expired verification token',
        };
      }

      const user = result.rows[0];

      // Update user as verified
      await query(
        `
        UPDATE users 
        SET 
          email_verified = true,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
        WHERE id = $1
      `,
        [user.id]
      );

      // Generate tokens
      const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: 'email',
      };
      const tokens = jwtService.generateTokenPair(payload);

      return {
        success: true,
        user: { ...user, email_verified: true },
        tokens,
      };
    } catch (error) {
      console.error('[Auth] Email verification failed:', error);
      return {
        success: false,
        error: 'Email verification failed. Please try again.',
      };
    }
  }

  // Refresh tokens
  async refreshTokens(
    refreshToken: string,
    sessionContext?: SessionContext
  ): Promise<AuthResult> {
    try {
      // Validate session first
      const sessionValidation =
        await sessionService.validateSession(refreshToken);

      if (!sessionValidation.isValid || !sessionValidation.session) {
        return {
          success: false,
          error: sessionValidation.error || 'Invalid session',
        };
      }

      const user = await this.getUserById(sessionValidation.session.userId);

      if (!user || !user.is_active) {
        // Revoke the session if user is inactive
        await sessionService.revokeSession(sessionValidation.session.sessionId);
        return {
          success: false,
          error: 'User account is inactive',
        };
      }

      // Generate new tokens
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: user.oauth_provider || 'email',
      };
      const tokens = jwtService.generateTokenPair(tokenPayload);

      // Update session with new refresh token
      await sessionService.revokeSession(sessionValidation.session.sessionId);

      const newSessionData: CreateSessionData = {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        deviceInfo:
          sessionContext?.deviceInfo || sessionValidation.session.deviceInfo,
        ipAddress:
          sessionContext?.ipAddress || sessionValidation.session.ipAddress,
        userAgent:
          sessionContext?.userAgent || sessionValidation.session.userAgent,
      };
      const newSession = await sessionService.createSession(newSessionData);

      return {
        success: true,
        user,
        tokens,
        sessionId: newSession.sessionId,
      };
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      return {
        success: false,
        error: 'Invalid refresh token',
      };
    }
  }

  // Logout user (revoke session)
  async logout(
    refreshToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sessionService.revokeSessionByToken(refreshToken);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      return {
        success: false,
        error: 'Failed to logout',
      };
    }
  }

  // Logout from all devices
  async logoutAllDevices(
    userId: string,
    exceptSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await sessionService.revokeAllUserSessions(userId, exceptSessionId);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Logout all devices failed:', error);
      return {
        success: false,
        error: 'Failed to logout from all devices',
      };
    }
  }

  // Get user sessions
  async getUserSessions(userId: string) {
    return sessionService.getUserSessions(userId);
  }

  // Get session statistics
  async getSessionStats(userId?: string) {
    return sessionService.getSessionStats(userId);
  }

  // Check for suspicious activity
  async checkSuspiciousActivity(userId: string) {
    return sessionService.checkSuspiciousActivity(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
