import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError, ZodSchema } from 'zod';
import {
  securityMonitor,
  SecurityEventType,
  SecuritySeverity,
} from '../services/monitoring/SecurityMonitor';

/**
 * Validation Middleware for Fastify
 * Provides comprehensive request validation with security monitoring
 */

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  skipOnError?: boolean;
  sanitize?: boolean;
}

/**
 * Create validation middleware for Fastify routes
 */
export function validateRequest(options: ValidationOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validationResults: Record<string, any> = {};
      const errors: Record<string, string[]> = {};

      // Validate request body
      if (options.body && request.body) {
        try {
          validationResults.body = options.body.parse(request.body);
          request.body = validationResults.body;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.body = formatZodErrors(error);
          } else {
            errors.body = ['Invalid request body format'];
          }
        }
      }

      // Validate query parameters
      if (options.query && request.query) {
        try {
          validationResults.query = options.query.parse(request.query);
          request.query = validationResults.query;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.query = formatZodErrors(error);
          } else {
            errors.query = ['Invalid query parameters'];
          }
        }
      }

      // Validate route parameters
      if (options.params && request.params) {
        try {
          validationResults.params = options.params.parse(request.params);
          request.params = validationResults.params;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.params = formatZodErrors(error);
          } else {
            errors.params = ['Invalid route parameters'];
          }
        }
      }

      // Validate headers
      if (options.headers && request.headers) {
        try {
          validationResults.headers = options.headers.parse(request.headers);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.headers = formatZodErrors(error);
          } else {
            errors.headers = ['Invalid request headers'];
          }
        }
      }

      // Check if there are validation errors
      if (Object.keys(errors).length > 0) {
        // Log security event for suspicious validation failures
        const suspiciousPatterns = detectSuspiciousValidationFailures(
          errors,
          request
        );
        if (suspiciousPatterns.length > 0) {
          securityMonitor.recordSuspiciousActivity(
            'validation_failure',
            {
              errors,
              suspiciousPatterns,
              url: request.url,
              method: request.method,
              userAgent: request.headers['user-agent'],
            },
            {
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] as string,
              userId: (request as any).user?.id,
            }
          );
        }

        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }

      // Sanitize data if requested
      if (options.sanitize) {
        sanitizeValidatedData(validationResults);
      }
    } catch (error) {
      // Log unexpected validation errors
      console.error('Validation middleware error:', error);

      securityMonitor.recordEvent(
        SecurityEventType.SYSTEM_ERROR,
        SecuritySeverity.HIGH,
        {
          error:
            error instanceof Error ? error.message : 'Unknown validation error',
          url: request.url,
          method: request.method,
        }
      );

      if (!options.skipOnError) {
        return reply.code(500).send({
          success: false,
          error: 'Internal validation error',
          code: 'VALIDATION_SYSTEM_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    }
  };
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}

/**
 * Detect suspicious validation failure patterns
 */
function detectSuspiciousValidationFailures(
  errors: Record<string, string[]>,
  request: FastifyRequest
): string[] {
  const suspiciousPatterns: string[] = [];

  // Check for SQL injection attempts
  const allErrors = Object.values(errors).flat().join(' ').toLowerCase();
  if (
    allErrors.includes('union') ||
    allErrors.includes('select') ||
    allErrors.includes('drop') ||
    allErrors.includes('insert')
  ) {
    suspiciousPatterns.push('sql_injection_attempt');
  }

  // Check for XSS attempts
  if (
    allErrors.includes('<script') ||
    allErrors.includes('javascript:') ||
    allErrors.includes('onerror') ||
    allErrors.includes('onload')
  ) {
    suspiciousPatterns.push('xss_attempt');
  }

  // Check for path traversal attempts
  if (allErrors.includes('../') || allErrors.includes('..\\')) {
    suspiciousPatterns.push('path_traversal_attempt');
  }

  // Check for excessive validation failures (potential fuzzing)
  const totalErrors = Object.values(errors).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  if (totalErrors > 10) {
    suspiciousPatterns.push('excessive_validation_failures');
  }

  // Check for unusual user agent patterns
  const userAgent = request.headers['user-agent'] as string;
  if (
    !userAgent ||
    userAgent.includes('bot') ||
    userAgent.includes('crawler') ||
    userAgent.includes('scanner')
  ) {
    suspiciousPatterns.push('suspicious_user_agent');
  }

  return suspiciousPatterns;
}

/**
 * Sanitize validated data to prevent XSS and other attacks
 */
function sanitizeValidatedData(data: Record<string, any>): void {
  function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Remove potentially dangerous HTML tags and scripts
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    } else if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    } else if (value && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  }

  for (const [key, value] of Object.entries(data)) {
    data[key] = sanitizeValue(value);
  }
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitized = email.toLowerCase().trim();

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    errors.push('Invalid email format');
  }

  // Length validation
  if (sanitized.length < 5) {
    errors.push('Email must be at least 5 characters');
  }
  if (sanitized.length > 254) {
    errors.push('Email must not exceed 254 characters');
  }

  // Check for suspicious patterns
  if (sanitized.includes('..') || sanitized.includes('@@')) {
    errors.push('Email contains invalid patterns');
  }

  // Domain validation
  const domain = sanitized.split('@')[1];
  if (
    domain &&
    (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..'))
  ) {
    errors.push('Invalid email domain');
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: number;
  errors: string[];
} {
  const errors: string[] = [];
  let strength = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    strength += 2;
  } else {
    strength += 1;
  }

  // Character variety checks
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strength += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strength += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    strength += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push(
      'Password must contain at least one special character (@$!%*?&)'
    );
  } else {
    strength += 1;
  }

  // Common password checks
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    strength = Math.max(0, strength - 2);
  }

  // Sequential character check
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push('Password should not contain sequential characters');
    strength = Math.max(0, strength - 1);
  }

  // Repeated character check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    strength = Math.max(0, strength - 1);
  }

  return {
    isValid: errors.length === 0,
    strength: Math.min(5, strength), // Cap at 5
    errors,
  };
}

/**
 * Validate currency amounts
 */
export function validateCurrencyAmount(amount: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Number.isFinite(amount)) {
    errors.push('Amount must be a valid number');
  }

  if (amount < -999999999.99) {
    errors.push('Amount is too small');
  }

  if (amount > 999999999.99) {
    errors.push('Amount is too large');
  }

  // Check for more than 2 decimal places
  if (Math.round(amount * 100) !== amount * 100) {
    errors.push('Amount must have at most 2 decimal places');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    errors.push('Invalid UUID format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting validation middleware
 */
export function validateRateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this client
    const clientRequests = requests.get(clientId) || [];

    // Remove old requests outside the window
    const recentRequests = clientRequests.filter(
      timestamp => timestamp > windowStart
    );

    // Check if rate limit exceeded
    if (recentRequests.length >= maxRequests) {
      securityMonitor.recordRateLimitExceeded(
        clientId,
        request.url,
        recentRequests.length
      );

      return reply.code(429).send({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(clientId, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      for (const [key, timestamps] of requests.entries()) {
        const filtered = timestamps.filter(ts => ts > windowStart);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
    }
  };
}
