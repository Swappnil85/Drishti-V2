# Drishti API Documentation

## Introduction

The Drishti API is a comprehensive RESTful service built with Fastify that provides endpoints for authentication, user management, financial planning, file uploads, and AI-powered visual analysis. The API follows OpenAPI 3.0 specification and includes comprehensive documentation via Swagger UI.

> **📋 Note for Epic Documents**: This is the central API documentation. Epic documents should reference this file instead of duplicating API information. See [API Reference Template](../_templates/API_REFERENCE.md) for guidance.

## Base URL

- **Development**: `http://localhost:3001`
- **Staging**: `https://api-staging.drishti.app`
- **Production**: `https://api.drishti.app`

## API Principles

### RESTful Design
- Resource-based URLs
- HTTP methods for operations (GET, POST, PUT, DELETE)
- Consistent response formats
- Proper HTTP status codes

### Response Format
All API responses follow a consistent structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}
```

### Error Handling
- Consistent error response format
- Meaningful error messages
- Proper HTTP status codes
- Error tracking and logging

## Authentication

### JWT Tokens
- **Access Token**: 24-hour expiry, used for API requests
- **Refresh Token**: 7-day expiry, used to obtain new access tokens
- **Header Format**: `Authorization: Bearer <token>`

### Protected Routes
Most endpoints require authentication. Public endpoints include:
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `GET /health` - System health check
- `GET /health/db` - Database health check
- `GET /docs` - API documentation (Swagger UI)
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/google/callback` - Google OAuth callback

## Rate Limiting

### Default Limits
- **General API**: 100 requests per minute per IP
- **File Upload**: 10 requests per minute per user
- **AI Analysis**: 5 requests per minute per user

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## File Upload

### Supported Formats
- **Images**: JPEG, PNG, WebP
- **Videos**: MP4, MOV (future)
- **Size Limit**: 10MB per file

### Upload Process
1. Client requests upload URL
2. Server validates file metadata
3. Client uploads file to designated endpoint
4. Server processes and stores file
5. Server returns file metadata and analysis

## API Categories

### Core System APIs
- **[Authentication](./ENDPOINTS.md#authentication-endpoints)** - User registration, login, OAuth
- **[User Management](./ENDPOINTS.md#user-management-endpoints)** - Profile management, preferences
- **[Health & Status](./ENDPOINTS.md#health--status-endpoints)** - System monitoring

### Business Logic APIs
- **[Financial Planning](../epics/epic3/API_DOCUMENTATION_EPIC3.md)** - Accounts, goals, scenarios (Epic 3)
- **[File Management](./ENDPOINTS.md#file-management-endpoints)** - Upload, storage, metadata
- **[Visual Analysis](./ENDPOINTS.md#visual-analysis-endpoints)** - AI-powered image analysis

### Epic-Specific APIs
- **Epic 1**: Foundation APIs (health checks, basic CRUD)
- **Epic 2**: Authentication and security APIs
- **Epic 3**: Financial planning APIs (comprehensive)
- **Epic 4**: Navigation and UI framework APIs

## Pagination

### Query Parameters
```
?page=1&limit=20&sort=created_at&order=desc
```

### Response Format
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
```

## API Versioning

### Strategy
- URL-based versioning: `/v1/`, `/v2/`
- Current version: `v1`
- Backward compatibility maintained for at least 6 months

### Version Headers
```
API-Version: 1.0
Supported-Versions: 1.0, 1.1
```

## Content Types

### Request Content Types
- `application/json` - JSON data
- `multipart/form-data` - File uploads
- `application/x-www-form-urlencoded` - Form data

### Response Content Types
- `application/json` - All API responses
- `image/*` - File downloads (future)

## CORS Configuration

### Allowed Origins
- Development: `http://localhost:*`
- Production: Specific domain whitelist

### Allowed Methods
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

### Allowed Headers
- `Content-Type`, `Authorization`, `X-Requested-With`

## API Documentation

### Interactive Documentation
- **Swagger UI**: Available at `/docs`
- **OpenAPI Spec**: Available at `/docs/json`
- **Postman Collection**: Exportable collection (future)

### Documentation Standards
- Complete endpoint documentation
- Request/response examples
- Error code documentation
- Authentication requirements clearly marked

## Performance Considerations

### Response Times
- **Target**: < 200ms for simple queries
- **File Upload**: < 5s for 10MB files
- **AI Analysis**: < 30s for complex analysis

### Caching Strategy
- **Static Assets**: CDN caching (future)
- **API Responses**: Redis caching for expensive queries (future)
- **Database**: Query optimization and indexing

## Monitoring & Observability

### Health Checks
- **Basic Health**: `GET /health`
- **Database Health**: `GET /health/db`
- **AI Services Health**: `GET /health/ai`

### Metrics
- Request/response times
- Error rates
- Authentication success/failure rates
- File upload success rates

### Logging
- Structured JSON logging
- Request/response logging
- Error logging with stack traces
- Security event logging
