import { FastifyRequest, FastifyReply } from 'fastify';
import { jwtService } from '../auth/jwt';
import { sessionService } from '../auth/session';
import { query } from '../db/connection';

// Authenticated request interface
export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
    name: string;
    provider: string;
    sessionId?: string;
  };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Enhanced authentication middleware with session validation
 */
export async function authenticateUser(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Authorization header is required',
        code: 'MISSING_TOKEN',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const payload = jwtService.verifyAccessToken(token);

    // Validate user is still active
    const userResult = await query(
      'SELECT id, email, name, is_active, locked_until FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return reply.code(401).send({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return reply.code(403).send({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return reply.code(423).send({
        success: false,
        error: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Add user info to request
    request.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      provider: payload.provider,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return reply.code(401).send({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      } else if (error.message.includes('Invalid')) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
    }

    return reply.code(401).send({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // No token provided, continue without authentication
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    // Add user info to request if token is valid
    request.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      provider: payload.provider,
    };
  } catch (error) {
    // Ignore authentication errors for optional auth
    console.warn('Optional auth failed:', error);
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key);
      }
    }

    // Get or create rate limit entry
    let rateLimitEntry = rateLimitStore.get(clientId);
    if (!rateLimitEntry || rateLimitEntry.resetTime < windowStart) {
      rateLimitEntry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(clientId, rateLimitEntry);
    }

    // Check rate limit
    if (rateLimitEntry.count >= maxRequests) {
      const retryAfter = Math.ceil((rateLimitEntry.resetTime - now) / 1000);

      reply.header('Retry-After', retryAfter.toString());
      return reply.code(429).send({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter,
      });
    }

    // Increment counter
    rateLimitEntry.count++;
  };
}

/**
 * Admin-only authentication middleware
 */
export async function requireAdmin(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // First authenticate the user
  await authenticateUser(request, reply);

  if (!request.user) {
    return; // Authentication already failed
  }

  // Check if user has admin privileges
  const userResult = await query(
    'SELECT preferences FROM users WHERE id = $1',
    [request.user.userId]
  );

  if (userResult.rows.length === 0) {
    return reply.code(403).send({
      success: false,
      error: 'Access denied',
      code: 'ACCESS_DENIED',
    });
  }

  const preferences = userResult.rows[0].preferences || {};
  if (!preferences.isAdmin) {
    return reply.code(403).send({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED',
    });
  }
}

/**
 * Security headers middleware
 */
export async function securityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Set security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // HSTS header for HTTPS
  if (request.protocol === 'https') {
    reply.header(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
}

/**
 * CORS configuration for authentication endpoints
 */
export const corsOptions = {
  origin: (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In production, replace with your actual domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      'https://your-production-domain.com',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Info'],
};

/**
 * Input sanitization middleware
 */
export async function sanitizeInput(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.body && typeof request.body === 'object') {
    sanitizeObject(request.body);
  }

  if (request.query && typeof request.query === 'object') {
    sanitizeObject(request.query);
  }
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic XSS prevention
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
