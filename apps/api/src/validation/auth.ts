import { z } from 'zod';

// Password validation schema with comprehensive security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  )
  .refine(password => {
    // Check for repeated characters (more than 2 in a row)
    return !/(.)\1{2,}/.test(password);
  }, 'Password cannot contain more than 2 repeated characters in a row')
  .refine(password => {
    // Check for common patterns
    const commonPatterns = [
      '123',
      'abc',
      'qwe',
      'password',
      'admin',
      '111',
      'aaa',
    ];
    return !commonPatterns.some(pattern =>
      password.toLowerCase().includes(pattern)
    );
  }, 'Password cannot contain common patterns');

// Email validation schema with comprehensive checks
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters long')
  .max(255, 'Email must be less than 255 characters long')
  .refine(email => {
    // Additional email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, 'Invalid email format')
  .refine(email => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      'script',
      'javascript',
      'vbscript',
      'onload',
      'onerror',
    ];
    return !suspiciousPatterns.some(pattern =>
      email.toLowerCase().includes(pattern)
    );
  }, 'Email contains invalid characters');

// Name validation schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters long')
  .regex(
    /^[a-zA-Z\s\-'\.]+$/,
    'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  )
  .refine(name => {
    // Check for XSS patterns
    const xssPatterns = [
      '<script',
      '</script',
      'javascript:',
      'onload=',
      'onerror=',
      'onclick=',
    ];
    return !xssPatterns.some(pattern => name.toLowerCase().includes(pattern));
  }, 'Name contains invalid characters')
  .transform(name => name.trim());

// Device info validation schema
const deviceInfoSchema = z
  .string()
  .max(500, 'Device info must be less than 500 characters')
  .optional()
  .refine(deviceInfo => {
    if (!deviceInfo) return true;
    // Check for XSS patterns
    const xssPatterns = [
      '<script',
      '</script',
      'javascript:',
      'onload=',
      'onerror=',
    ];
    return !xssPatterns.some(pattern =>
      deviceInfo.toLowerCase().includes(pattern)
    );
  }, 'Device info contains invalid characters');

// User agent validation schema
const userAgentSchema = z
  .string()
  .max(1000, 'User agent must be less than 1000 characters')
  .optional()
  .refine(userAgent => {
    if (!userAgent) return true;
    // Basic user agent format validation
    return /^[a-zA-Z0-9\s\(\)\[\]\/\.\-_,;:]+$/.test(userAgent);
  }, 'Invalid user agent format');

// Registration validation schema
export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
});

// OAuth callback validation schema
export const oauthCallbackSchema = z.object({
  code: z
    .string()
    .min(1, 'Authorization code is required')
    .max(2000, 'Authorization code too long'),
  state: z
    .string()
    .min(1, 'State parameter is required')
    .max(100, 'State parameter too long')
    .optional(),
  user: z.string().max(5000, 'User data too long').optional(), // For Apple OAuth
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .max(2000, 'Refresh token too long'),
});

// Email verification validation schema
export const emailVerificationSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .max(100, 'Verification token too long'),
});

// Session context validation schema
export const sessionContextSchema = z.object({
  deviceInfo: deviceInfoSchema,
  userAgent: userAgentSchema,
  ipAddress: z.string().ip().optional(),
});

// Password reset validation schema
export const passwordResetSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .max(100, 'Reset token too long'),
  password: passwordSchema,
});

// Update profile validation schema
export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine(data => {
    // At least one field must be provided
    return data.name !== undefined || data.email !== undefined;
  }, 'At least one field must be provided for update');

// Validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: any, reply: any) => {
    try {
      const validatedData = schema.parse(request.body);
      request.body = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

// Query parameter validation middleware factory
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (request: any, reply: any) => {
    try {
      const validatedData = schema.parse(request.query);
      request.query = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

// Headers validation middleware factory
export function validateHeaders<T>(schema: z.ZodSchema<T>) {
  return async (request: any, reply: any) => {
    try {
      const validatedData = schema.parse(request.headers);
      request.headers = { ...request.headers, ...validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Header validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

// Sanitization utilities
export const sanitizeInput = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Sanitize SQL input (basic protection)
  sql: (input: string): string => {
    return input
      .replace(/['";\\]/g, '') // Remove dangerous SQL characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments start
      .replace(/\*\//g, '') // Remove SQL block comments end
      .trim();
  },

  // Sanitize for safe logging
  log: (input: string): string => {
    return input
      .replace(/[\r\n]/g, '') // Remove line breaks
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .substring(0, 1000) // Limit length
      .trim();
  },
};

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type SessionContextInput = z.infer<typeof sessionContextSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
