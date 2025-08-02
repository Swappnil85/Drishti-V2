# API Endpoints

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /auth/login
Authenticate user and return tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

## User Management Endpoints

### GET /users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "preferences": {
      "language": "en",
      "voiceEnabled": true
    }
  }
}
```

### PUT /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "preferences": {
    "language": "es",
    "voiceEnabled": false
  }
}
```

## File Management Endpoints

### POST /files/upload
Upload a file for analysis.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
```
file: <binary_data>
metadata: {
  "description": "Optional description",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "uuid",
      "filename": "generated_filename.jpg",
      "originalFilename": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "width": 1920,
      "height": 1080
    }
  }
}
```

### GET /files/:id
Get file metadata.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /files/:id
Delete a file.

**Headers:** `Authorization: Bearer <token>`

## Visual Analysis Endpoints

### POST /analysis/analyze
Analyze an uploaded file with AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fileId": "uuid",
  "options": {
    "includeObjects": true,
    "includeText": true,
    "includeColors": false,
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "uuid",
      "description": "A person walking in a park with trees and a blue sky",
      "confidence": 0.95,
      "tags": ["person", "park", "trees", "outdoor"],
      "objects": [
        {
          "name": "person",
          "confidence": 0.98,
          "boundingBox": {
            "x": 100,
            "y": 150,
            "width": 200,
            "height": 400
          }
        }
      ],
      "text": [
        {
          "content": "Park Entrance",
          "confidence": 0.92,
          "boundingBox": {
            "x": 50,
            "y": 50,
            "width": 150,
            "height": 30
          }
        }
      ]
    }
  }
}
```

### GET /analysis/history
Get user's analysis history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (default: created_at)
- `order` (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "analyses": [
      {
        "id": "uuid",
        "description": "Analysis description",
        "confidence": 0.95,
        "tags": ["tag1", "tag2"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /analysis/:id
Get specific analysis details.

**Headers:** `Authorization: Bearer <token>`

### DELETE /analysis/:id
Delete an analysis.

**Headers:** `Authorization: Bearer <token>`

## Health & Status Endpoints

### GET /health
Basic health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### GET /health/detailed
Detailed health check including dependencies.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "ok",
    "aiServices": "ok",
    "fileStorage": "ok"
  },
  "metrics": {
    "uptime": 86400,
    "memoryUsage": "45%",
    "cpuUsage": "12%"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z",
  "details": {
    "field": "Specific field error"
  }
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **429**: Too Many Requests
- **500**: Internal Server Error
