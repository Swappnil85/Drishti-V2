import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT configuration
export interface JWTConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  provider: 'email' | 'google' | 'apple';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Refresh token payload
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Get JWT configuration from environment
export const getJWTConfig = (): JWTConfig => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    // Generate secure secrets if not provided (for development)
    const generatedAccessSecret = crypto.randomBytes(64).toString('hex');
    const generatedRefreshSecret = crypto.randomBytes(64).toString('hex');

    console.warn(
      '[JWT] JWT secrets not found in environment variables. Using generated secrets.'
    );
    console.warn(
      '[JWT] For production, set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables.'
    );

    return {
      accessTokenSecret: generatedAccessSecret,
      refreshTokenSecret: generatedRefreshSecret,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: process.env.JWT_ISSUER || 'drishti-api',
      audience: process.env.JWT_AUDIENCE || 'drishti-app',
    };
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'drishti-api',
    audience: process.env.JWT_AUDIENCE || 'drishti-app',
  };
};

// JWT service class
export class JWTService {
  private config: JWTConfig;

  constructor() {
    this.config = getJWTConfig();
  }

  // Generate access token
  generateAccessToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>
  ): string {
    const options: any = {
      expiresIn: this.config.accessTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
    };
    return jwt.sign(payload, this.config.accessTokenSecret, options);
  }

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    const tokenId = crypto.randomUUID();
    const payload: RefreshTokenPayload = {
      userId,
      tokenId,
    };

    const options: any = {
      expiresIn: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience,
    };
    return jwt.sign(payload, this.config.refreshTokenSecret, options);
  }

  // Generate token pair
  generateTokenPair(
    userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>
  ): TokenPair {
    const accessToken = this.generateAccessToken(userPayload);
    const refreshToken = this.generateRefreshToken(userPayload.userId);

    // Calculate expiry time in seconds
    const expiresIn = this.parseExpiryToSeconds(this.config.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  // Verify access token
  verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.config.accessTokenSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.config.refreshTokenSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  // Parse expiry string to seconds
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 60 * 60;
      case 'd':
        return num * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  // Get token expiry time
  getTokenExpiry(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return expiry < new Date();
  }
}

// Export singleton instance
export const jwtService = new JWTService();
