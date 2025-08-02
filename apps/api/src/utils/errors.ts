// Structured error handling system for secure error responses

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',

  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // OAuth errors
  OAUTH_PROVIDER_ERROR = 'OAUTH_PROVIDER_ERROR',
  OAUTH_STATE_MISMATCH = 'OAUTH_STATE_MISMATCH',
  OAUTH_CODE_INVALID = 'OAUTH_CODE_INVALID',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',

  // Security errors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: Record<string, any> | undefined;
  timestamp: string;
  requestId?: string | undefined;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details?: Record<string, any> | undefined;
  public readonly timestamp: string;
  public readonly requestId?: string | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    details?: Record<string, any> | undefined,
    requestId?: string | undefined
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Ensure the stack trace points to where the error was thrown
    Error.captureStackTrace(this, AppError);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      details: this.details || undefined,
      timestamp: this.timestamp,
      requestId: this.requestId || undefined,
    };
  }

  // Create user-safe response object
  toUserResponse(): {
    success: false;
    error: string;
    code: ErrorCode;
    details?: Record<string, any> | undefined;
  } {
    return {
      success: false,
      error: this.userMessage,
      code: this.code,
      details: this.details || undefined,
    };
  }
}

// Predefined error factory functions
export const AuthErrors = {
  invalidCredentials: (requestId?: string) =>
    new AppError(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password provided',
      'Invalid email or password',
      401,
      undefined,
      requestId
    ),

  accountLocked: (unlockTime?: Date, requestId?: string) =>
    new AppError(
      ErrorCode.ACCOUNT_LOCKED,
      `Account locked until ${unlockTime?.toISOString()}`,
      unlockTime
        ? `Account is locked. Try again after ${unlockTime.toLocaleString()}`
        : 'Account is temporarily locked due to multiple failed login attempts',
      423,
      { unlockTime: unlockTime?.toISOString() },
      requestId
    ),

  emailNotVerified: (requestId?: string) =>
    new AppError(
      ErrorCode.EMAIL_NOT_VERIFIED,
      'Email address not verified',
      'Please verify your email address before logging in',
      403,
      undefined,
      requestId
    ),

  accountInactive: (requestId?: string) =>
    new AppError(
      ErrorCode.ACCOUNT_INACTIVE,
      'User account is inactive',
      'Your account has been deactivated. Please contact support.',
      403,
      undefined,
      requestId
    ),

  tokenExpired: (requestId?: string) =>
    new AppError(
      ErrorCode.TOKEN_EXPIRED,
      'Authentication token has expired',
      'Your session has expired. Please log in again.',
      401,
      undefined,
      requestId
    ),

  tokenInvalid: (requestId?: string) =>
    new AppError(
      ErrorCode.TOKEN_INVALID,
      'Invalid authentication token',
      'Invalid authentication token. Please log in again.',
      401,
      undefined,
      requestId
    ),

  sessionExpired: (requestId?: string) =>
    new AppError(
      ErrorCode.SESSION_EXPIRED,
      'Session has expired',
      'Your session has expired. Please log in again.',
      401,
      undefined,
      requestId
    ),

  sessionInvalid: (requestId?: string) =>
    new AppError(
      ErrorCode.SESSION_INVALID,
      'Invalid session',
      'Invalid session. Please log in again.',
      401,
      undefined,
      requestId
    ),
};

export const ValidationErrors = {
  validationFailed: (details: Record<string, any>, requestId?: string) =>
    new AppError(
      ErrorCode.VALIDATION_FAILED,
      'Input validation failed',
      'Please check your input and try again',
      400,
      details,
      requestId
    ),

  invalidInput: (field: string, requestId?: string) =>
    new AppError(
      ErrorCode.INVALID_INPUT,
      `Invalid input for field: ${field}`,
      `Invalid ${field}. Please check your input.`,
      400,
      { field },
      requestId
    ),

  missingRequiredField: (field: string, requestId?: string) =>
    new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing required field: ${field}`,
      `${field} is required`,
      400,
      { field },
      requestId
    ),
};

export const RateLimitErrors = {
  rateLimitExceeded: (retryAfter?: number, requestId?: string) =>
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      retryAfter
        ? `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
        : 'Too many requests. Please try again later.',
      429,
      { retryAfter },
      requestId
    ),

  tooManyRequests: (requestId?: string) =>
    new AppError(
      ErrorCode.TOO_MANY_REQUESTS,
      'Too many requests from this IP',
      'Too many requests. Please try again later.',
      429,
      undefined,
      requestId
    ),
};

export const OAuthErrors = {
  providerError: (provider: string, error: string, requestId?: string) =>
    new AppError(
      ErrorCode.OAUTH_PROVIDER_ERROR,
      `OAuth provider error: ${provider} - ${error}`,
      `Authentication with ${provider} failed. Please try again.`,
      502,
      { provider, originalError: error },
      requestId
    ),

  stateMismatch: (requestId?: string) =>
    new AppError(
      ErrorCode.OAUTH_STATE_MISMATCH,
      'OAuth state parameter mismatch',
      'Authentication failed due to security check. Please try again.',
      400,
      undefined,
      requestId
    ),

  invalidCode: (requestId?: string) =>
    new AppError(
      ErrorCode.OAUTH_CODE_INVALID,
      'Invalid OAuth authorization code',
      'Authentication failed. Please try again.',
      400,
      undefined,
      requestId
    ),
};

export const SystemErrors = {
  internalServerError: (originalError?: Error, requestId?: string) =>
    new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      originalError?.message || 'Internal server error',
      'An unexpected error occurred. Please try again later.',
      500,
      process.env.NODE_ENV === 'development'
        ? { originalError: originalError?.stack }
        : undefined,
      requestId
    ),

  databaseError: (originalError?: Error, requestId?: string) =>
    new AppError(
      ErrorCode.DATABASE_ERROR,
      originalError?.message || 'Database operation failed',
      'A database error occurred. Please try again later.',
      500,
      process.env.NODE_ENV === 'development'
        ? { originalError: originalError?.stack }
        : undefined,
      requestId
    ),

  externalServiceError: (
    service: string,
    originalError?: Error,
    requestId?: string
  ) =>
    new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service} - ${originalError?.message}`,
      'An external service is currently unavailable. Please try again later.',
      502,
      {
        service,
        originalError:
          process.env.NODE_ENV === 'development'
            ? originalError?.stack
            : undefined,
      },
      requestId
    ),
};

export const UserErrors = {
  userNotFound: (requestId?: string) =>
    new AppError(
      ErrorCode.USER_NOT_FOUND,
      'User not found',
      'User account not found',
      404,
      undefined,
      requestId
    ),

  userAlreadyExists: (requestId?: string) =>
    new AppError(
      ErrorCode.USER_ALREADY_EXISTS,
      'User already exists',
      'An account with this email already exists',
      409,
      undefined,
      requestId
    ),

  emailAlreadyExists: (requestId?: string) =>
    new AppError(
      ErrorCode.EMAIL_ALREADY_EXISTS,
      'Email already exists',
      'An account with this email already exists',
      409,
      undefined,
      requestId
    ),
};

export const SecurityErrors = {
  suspiciousActivity: (details: Record<string, any>, requestId?: string) =>
    new AppError(
      ErrorCode.SUSPICIOUS_ACTIVITY,
      'Suspicious activity detected',
      'Suspicious activity detected. Your account has been temporarily restricted.',
      403,
      details,
      requestId
    ),

  securityViolation: (violation: string, requestId?: string) =>
    new AppError(
      ErrorCode.SECURITY_VIOLATION,
      `Security violation: ${violation}`,
      'Security violation detected. Access denied.',
      403,
      { violation },
      requestId
    ),

  csrfTokenInvalid: (requestId?: string) =>
    new AppError(
      ErrorCode.CSRF_TOKEN_INVALID,
      'CSRF token invalid or missing',
      'Security token invalid. Please refresh the page and try again.',
      403,
      undefined,
      requestId
    ),
};

// Error logging utility
export const logError = (
  error: Error | AppError,
  context?: Record<string, any>
) => {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as any,
    context,
  };

  if (error instanceof AppError) {
    logData.error = {
      ...logData.error,
      code: error.code,
      statusCode: error.statusCode,
      userMessage: error.userMessage,
      details: error.details,
      requestId: error.requestId,
    };
  }

  // In production, you would send this to your logging service
  console.error('[ERROR]', JSON.stringify(logData, null, 2));
};

// Error handler middleware for Fastify
export const errorHandler = (error: Error, request: any, reply: any) => {
  // Generate request ID if not present
  const requestId = request.id || Math.random().toString(36).substring(2, 15);

  if (error instanceof AppError) {
    logError(error, { requestId, url: request.url, method: request.method });
    return reply.code(error.statusCode).send(error.toUserResponse());
  }

  // Handle validation errors from Zod
  if (error.name === 'ZodError') {
    const validationError = ValidationErrors.validationFailed(
      { errors: (error as any).errors },
      requestId
    );
    logError(validationError, {
      requestId,
      url: request.url,
      method: request.method,
    });
    return reply
      .code(validationError.statusCode)
      .send(validationError.toUserResponse());
  }

  // Handle unknown errors
  const systemError = SystemErrors.internalServerError(error, requestId);
  logError(systemError, {
    requestId,
    url: request.url,
    method: request.method,
  });
  return reply.code(systemError.statusCode).send(systemError.toUserResponse());
};
