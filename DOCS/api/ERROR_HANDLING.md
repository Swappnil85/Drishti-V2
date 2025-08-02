# Error Handling

## Overview

The Drishti API implements comprehensive error handling to provide meaningful feedback to clients while maintaining security and system stability.

## Error Response Format

### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  timestamp: string;       // ISO 8601 timestamp
  requestId?: string;      // Unique request identifier
  details?: object;        // Additional error details
}
```

### Example Error Response
```json
{
  "success": false,
  "error": "Validation failed for request body",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "req_123456789",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

## HTTP Status Codes

### Success Codes (2xx)
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return

### Client Error Codes (4xx)
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service error
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Upstream service timeout

## Error Categories

### Validation Errors
```typescript
enum ValidationError {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_RANGE = 'INVALID_RANGE'
}
```

### Authentication Errors
```typescript
enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

### File Upload Errors
```typescript
enum FileError {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PROCESSING_FAILED = 'PROCESSING_FAILED'
}
```

### AI Service Errors
```typescript
enum AIError {
  SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION'
}
```

## Error Handling Implementation

### Global Error Handler
```typescript
// Global error handler for Fastify
fastify.setErrorHandler(async (error, request, reply) => {
  const requestId = request.id;
  
  // Log error with context
  request.log.error({
    error: error.message,
    stack: error.stack,
    requestId,
    url: request.url,
    method: request.method,
    userId: request.user?.id
  });

  // Determine error type and response
  if (error.validation) {
    return reply.code(422).send({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      requestId,
      details: formatValidationErrors(error.validation)
    });
  }

  if (error.statusCode === 401) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  // Default server error
  return reply.code(500).send({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId
  });
});
```

### Custom Error Classes
```typescript
class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: object;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: object
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(message: string, details: object) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}
```

## Client-Side Error Handling

### Error Handling Hook (React Native)
```typescript
interface UseErrorHandlerReturn {
  handleError: (error: any) => void;
  showError: (message: string) => void;
  clearError: () => void;
}

const useErrorHandler = (): UseErrorHandlerReturn => {
  const showToast = useToast();

  const handleError = (error: any) => {
    if (error.response?.data?.error) {
      showToast.error(error.response.data.error);
    } else if (error.message) {
      showToast.error(error.message);
    } else {
      showToast.error('An unexpected error occurred');
    }

    // Log error for debugging
    console.error('Error:', error);
  };

  const showError = (message: string) => {
    showToast.error(message);
  };

  const clearError = () => {
    showToast.clear();
  };

  return { handleError, showError, clearError };
};
```

### API Error Interceptor
```typescript
// Axios response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response?.data?.code) {
      // Handle specific error codes
      switch (response.data.code) {
        case 'TOKEN_EXPIRED':
          return handleTokenRefresh(error);
        case 'PERMISSION_DENIED':
          navigateToUnauthorized();
          break;
        case 'VALIDATION_ERROR':
          handleValidationError(response.data.details);
          break;
        default:
          handleGenericError(response.data.error);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Error Logging

### Structured Logging
```typescript
// Error logging with context
const logError = (error: Error, context: object) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  });
};
```

### Error Monitoring
- **Sentry Integration**: Real-time error tracking (future)
- **Log Aggregation**: Centralized log collection
- **Alerting**: Critical error notifications
- **Metrics**: Error rate monitoring

## Testing Error Scenarios

### Unit Tests
```typescript
describe('Error Handling', () => {
  test('should return validation error for invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe('VALIDATION_ERROR');
  });
});
```

### Integration Tests
- Network failure scenarios
- Service unavailability
- Rate limiting behavior
- Authentication edge cases

## Error Recovery Strategies

### Retry Logic
```typescript
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Circuit Breaker Pattern
- Prevent cascading failures
- Automatic service recovery
- Fallback mechanisms
- Health check integration
