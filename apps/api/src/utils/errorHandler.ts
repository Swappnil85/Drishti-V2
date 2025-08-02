import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { securityMonitor, SecurityEventType, SecuritySeverity } from '../services/monitoring/SecurityMonitor';

/**
 * Standardized Error Handling System
 * Provides consistent error responses and proper HTTP status codes
 */

export enum ErrorCode {
  // Authentication & Authorization Errors (4xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Validation Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource Errors (4xx)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  
  // Rate Limiting & Security (4xx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Business Logic Errors (4xx)
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_OPERATION = 'INVALID_OPERATION',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // Sync & Data Errors (4xx/5xx)
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  VERSION_MISMATCH = 'VERSION_MISMATCH'
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  context?: Record<string, any>;
}

export interface StandardError {
  success: false;
  error: string;
  code: ErrorCode;
  statusCode: number;
  details?: ErrorDetails | ErrorDetails[];
  timestamp: string;
  requestId?: string;
  path?: string;
  method?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails | ErrorDetails[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: ErrorDetails | ErrorDetails[],
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error factory functions
 */
export const ErrorFactory = {
  // Authentication Errors
  unauthorized: (message = 'Authentication required') =>
    new AppError(message, ErrorCode.UNAUTHORIZED, 401),

  forbidden: (message = 'Access forbidden') =>
    new AppError(message, ErrorCode.FORBIDDEN, 403),

  invalidCredentials: (message = 'Invalid email or password') =>
    new AppError(message, ErrorCode.INVALID_CREDENTIALS, 401),

  tokenExpired: (message = 'Token has expired') =>
    new AppError(message, ErrorCode.TOKEN_EXPIRED, 401),

  tokenInvalid: (message = 'Invalid token') =>
    new AppError(message, ErrorCode.TOKEN_INVALID, 401),

  accountLocked: (message = 'Account is temporarily locked') =>
    new AppError(message, ErrorCode.ACCOUNT_LOCKED, 423),

  emailNotVerified: (message = 'Email verification required') =>
    new AppError(message, ErrorCode.EMAIL_NOT_VERIFIED, 403),

  // Validation Errors
  validationError: (message = 'Validation failed', details?: ErrorDetails[]) =>
    new AppError(message, ErrorCode.VALIDATION_ERROR, 400, details),

  invalidInput: (message = 'Invalid input provided', field?: string, value?: any) =>
    new AppError(message, ErrorCode.INVALID_INPUT, 400, { field, value }),

  missingField: (field: string) =>
    new AppError(`Missing required field: ${field}`, ErrorCode.MISSING_REQUIRED_FIELD, 400, { field }),

  invalidFormat: (field: string, expectedFormat: string) =>
    new AppError(`Invalid format for ${field}`, ErrorCode.INVALID_FORMAT, 400, { field, constraint: expectedFormat }),

  // Resource Errors
  notFound: (resource = 'Resource', id?: string) =>
    new AppError(`${resource} not found`, ErrorCode.NOT_FOUND, 404, { context: { id } }),

  alreadyExists: (resource = 'Resource', field?: string, value?: any) =>
    new AppError(`${resource} already exists`, ErrorCode.ALREADY_EXISTS, 409, { field, value }),

  conflict: (message = 'Resource conflict') =>
    new AppError(message, ErrorCode.CONFLICT, 409),

  gone: (message = 'Resource no longer available') =>
    new AppError(message, ErrorCode.GONE, 410),

  // Rate Limiting
  rateLimitExceeded: (retryAfter?: number) =>
    new AppError('Rate limit exceeded', ErrorCode.RATE_LIMIT_EXCEEDED, 429, { context: { retryAfter } }),

  tooManyRequests: (message = 'Too many requests') =>
    new AppError(message, ErrorCode.TOO_MANY_REQUESTS, 429),

  suspiciousActivity: (message = 'Suspicious activity detected') =>
    new AppError(message, ErrorCode.SUSPICIOUS_ACTIVITY, 429),

  // Server Errors
  internalError: (message = 'Internal server error', context?: Record<string, any>) =>
    new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, 500, { context }, false),

  databaseError: (message = 'Database operation failed', context?: Record<string, any>) =>
    new AppError(message, ErrorCode.DATABASE_ERROR, 500, { context }, false),

  externalServiceError: (service: string, message = 'External service unavailable') =>
    new AppError(message, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, { context: { service } }, false),

  configurationError: (message = 'Configuration error') =>
    new AppError(message, ErrorCode.CONFIGURATION_ERROR, 500, undefined, false),

  // Business Logic Errors
  insufficientFunds: (available: number, required: number) =>
    new AppError('Insufficient funds', ErrorCode.INSUFFICIENT_FUNDS, 400, { context: { available, required } }),

  invalidOperation: (operation: string, reason?: string) =>
    new AppError(`Invalid operation: ${operation}`, ErrorCode.INVALID_OPERATION, 400, { context: { operation, reason } }),

  businessRuleViolation: (rule: string, message?: string) =>
    new AppError(message || `Business rule violation: ${rule}`, ErrorCode.BUSINESS_RULE_VIOLATION, 400, { context: { rule } }),

  // Sync Errors
  syncConflict: (entity: string, id: string) =>
    new AppError('Sync conflict detected', ErrorCode.SYNC_CONFLICT, 409, { context: { entity, id } }),

  dataCorruption: (message = 'Data corruption detected') =>
    new AppError(message, ErrorCode.DATA_CORRUPTION, 500, undefined, false),

  versionMismatch: (expected: string, received: string) =>
    new AppError('Version mismatch', ErrorCode.VERSION_MISMATCH, 400, { context: { expected, received } })
};

/**
 * Global error handler for Fastify
 */
export function setupErrorHandler(fastify: any) {
  fastify.setErrorHandler(async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id || generateRequestId();
    const timestamp = new Date().toISOString();

    // Handle different types of errors
    if (error instanceof AppError) {
      // Application errors - these are expected and handled gracefully
      const response: StandardError = {
        success: false,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        timestamp,
        requestId,
        path: request.url,
        method: request.method
      };

      // Log security-related errors
      if (isSecurityError(error.code)) {
        securityMonitor.recordEvent(
          getSecurityEventType(error.code),
          getSecuritySeverity(error.statusCode),
          {
            error: error.message,
            code: error.code,
            path: request.url,
            method: request.method,
            details: error.details
          },
          {
            userId: (request as any).user?.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] as string
          }
        );
      }

      return reply.code(error.statusCode).send(response);
    }

    if (error instanceof ZodError) {
      // Zod validation errors
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        value: err.code,
        constraint: err.message
      }));

      const response: StandardError = {
        success: false,
        error: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        details,
        timestamp,
        requestId,
        path: request.url,
        method: request.method
      };

      return reply.code(400).send(response);
    }

    // Handle Fastify validation errors
    if (error.name === 'FastifyError' && (error as any).statusCode) {
      const statusCode = (error as any).statusCode;
      const response: StandardError = {
        success: false,
        error: error.message,
        code: getErrorCodeFromStatus(statusCode),
        statusCode,
        timestamp,
        requestId,
        path: request.url,
        method: request.method
      };

      return reply.code(statusCode).send(response);
    }

    // Unexpected errors - log and return generic error
    console.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      requestId,
      path: request.url,
      method: request.method,
      userId: (request as any).user?.id,
      ip: request.ip
    });

    // Record security event for unexpected errors
    securityMonitor.recordEvent(
      SecurityEventType.SYSTEM_ERROR,
      SecuritySeverity.HIGH,
      {
        error: error.message,
        path: request.url,
        method: request.method,
        stack: error.stack?.substring(0, 500) // Limit stack trace length
      },
      {
        userId: (request as any).user?.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] as string
      }
    );

    const response: StandardError = {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      timestamp,
      requestId,
      path: request.url,
      method: request.method
    };

    return reply.code(500).send(response);
  });

  // Handle 404 errors
  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const response: StandardError = {
      success: false,
      error: 'Route not found',
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      requestId: request.id || generateRequestId(),
      path: request.url,
      method: request.method
    };

    return reply.code(404).send(response);
  });
}

/**
 * Helper functions
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isSecurityError(code: ErrorCode): boolean {
  const securityCodes = [
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.INVALID_CREDENTIALS,
    ErrorCode.TOKEN_EXPIRED,
    ErrorCode.TOKEN_INVALID,
    ErrorCode.ACCOUNT_LOCKED,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    ErrorCode.TOO_MANY_REQUESTS,
    ErrorCode.SUSPICIOUS_ACTIVITY
  ];
  return securityCodes.includes(code);
}

function getSecurityEventType(code: ErrorCode): SecurityEventType {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_CREDENTIALS:
      return SecurityEventType.FAILED_LOGIN;
    case ErrorCode.ACCOUNT_LOCKED:
      return SecurityEventType.ACCOUNT_LOCKED;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.TOO_MANY_REQUESTS:
      return SecurityEventType.RATE_LIMIT_EXCEEDED;
    case ErrorCode.SUSPICIOUS_ACTIVITY:
      return SecurityEventType.SUSPICIOUS_ACTIVITY;
    case ErrorCode.TOKEN_EXPIRED:
    case ErrorCode.TOKEN_INVALID:
      return SecurityEventType.INVALID_TOKEN;
    default:
      return SecurityEventType.UNAUTHORIZED_ACCESS;
  }
}

function getSecuritySeverity(statusCode: number): SecuritySeverity {
  if (statusCode >= 500) return SecuritySeverity.HIGH;
  if (statusCode === 429) return SecuritySeverity.MEDIUM;
  if (statusCode === 401 || statusCode === 403) return SecuritySeverity.MEDIUM;
  return SecuritySeverity.LOW;
}

function getErrorCodeFromStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400: return ErrorCode.INVALID_INPUT;
    case 401: return ErrorCode.UNAUTHORIZED;
    case 403: return ErrorCode.FORBIDDEN;
    case 404: return ErrorCode.NOT_FOUND;
    case 409: return ErrorCode.CONFLICT;
    case 429: return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500: return ErrorCode.INTERNAL_SERVER_ERROR;
    default: return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (request: FastifyRequest, reply: FastifyReply) => {
    return Promise.resolve(fn(request, reply)).catch((error) => {
      throw error; // Let the global error handler deal with it
    });
  };
}
