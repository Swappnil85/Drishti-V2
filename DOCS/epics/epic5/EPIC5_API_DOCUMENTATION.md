# Epic 5: User Onboarding & Profile Management - API Documentation

## Overview

This document provides comprehensive API documentation for the user onboarding and profile management system, including endpoints, request/response schemas, authentication requirements, and usage examples.

## Base URL

```
Production: https://api.drishti.app/v1
Development: https://dev-api.drishti.app/v1
Local: http://localhost:3000/v1
```

## Authentication

All API endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <jwt_token>
```

## Onboarding Endpoints

### Initialize Onboarding

Initialize a new onboarding session for a user.

```http
POST /onboarding/initialize
```

**Request Body:**

```json
{
  "variant": "beginner" | "intermediate" | "advanced",
  "userPreferences": {
    "experienceLevel": "beginner" | "intermediate" | "advanced",
    "primaryGoal": "fire" | "retirement" | "savings" | "investment",
    "timeHorizon": number
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "onboardingId": "string",
    "variant": "beginner",
    "currentStep": 0,
    "totalSteps": 5,
    "estimatedDuration": 300,
    "nextStepUrl": "/onboarding/step/1"
  }
}
```

### Complete Onboarding Step

Mark a specific onboarding step as completed.

```http
POST /onboarding/{onboardingId}/step/{stepNumber}/complete
```

**Request Body:**

```json
{
  "timeSpent": 45,
  "interactions": [
    {
      "type": "button_click",
      "element": "continue_button",
      "timestamp": 1691234567890
    }
  ],
  "stepData": {
    "answers": {},
    "preferences": {}
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stepCompleted": true,
    "nextStep": 2,
    "progress": 0.4,
    "recommendations": []
  }
}
```

### Get Onboarding Progress

Retrieve current onboarding progress for a user.

```http
GET /onboarding/{onboardingId}/progress
```

**Response:**

```json
{
  "success": true,
  "data": {
    "onboardingId": "string",
    "variant": "beginner",
    "currentStep": 2,
    "totalSteps": 5,
    "completedSteps": [0, 1],
    "progress": 0.4,
    "startedAt": "2025-08-03T10:00:00Z",
    "estimatedCompletion": "2025-08-03T10:15:00Z",
    "analytics": {
      "timeSpentPerStep": {
        "0": 45,
        "1": 60
      },
      "totalTimeSpent": 105
    }
  }
}
```

## Profile Management Endpoints

### Get User Profile

Retrieve complete user profile information.

```http
GET /profile
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "profilePicture": "https://...",
      "profilePictureMetadata": {
        "originalSize": 2048576,
        "compressedSize": 512000,
        "dimensions": {
          "width": 400,
          "height": 400
        },
        "uploadedAt": 1691234567890,
        "format": "jpeg"
      }
    },
    "financialInfo": {
      "totalAnnualIncome": 75000,
      "monthlyExpenses": 4000,
      "currentSavings": 25000,
      "savingsRate": 0.36,
      "fireNumber": 1000000,
      "yearsToFire": 15.2,
      "age": 33,
      "desiredRetirementAge": 50,
      "riskTolerance": "moderate"
    },
    "securitySettings": {
      "twoFactorEnabled": true,
      "biometricEnabled": true,
      "sessionTimeout": 30,
      "securityScore": 85
    },
    "privacySettings": {
      "dataCollection": {
        "analytics": true,
        "crashReporting": true,
        "locationData": false
      },
      "dataSharing": {
        "anonymizedInsights": true,
        "marketingCommunications": false
      }
    },
    "createdAt": "2025-08-01T10:00:00Z",
    "updatedAt": "2025-08-03T14:30:00Z",
    "version": 5
  }
}
```

### Update Profile

Update user profile information with change tracking.

```http
PUT /profile
```

**Request Body:**

```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Smith"
  },
  "financialInfo": {
    "totalAnnualIncome": 80000,
    "monthlyExpenses": 4200
  },
  "reason": "Annual income increase"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": {
      // Updated profile object
    },
    "changeId": "change_123456",
    "securityScore": 87,
    "recommendations": [
      {
        "id": "rec_001",
        "type": "savings_rate",
        "title": "Optimize Your Savings Rate",
        "description": "With your increased income, consider increasing your savings rate.",
        "priority": "medium"
      }
    ]
  }
}
```

### Upload Profile Picture

Upload and process a profile picture.

```http
POST /profile/picture
Content-Type: multipart/form-data
```

**Request Body:**

```
photo: <file>
options: {
  "quality": 0.8,
  "maxWidth": 400,
  "maxHeight": 400,
  "format": "jpeg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profilePictureUrl": "https://cdn.drishti.app/profiles/user123/picture.jpg",
    "metadata": {
      "originalSize": 2048576,
      "compressedSize": 512000,
      "dimensions": {
        "width": 400,
        "height": 400
      },
      "format": "jpeg",
      "uploadedAt": 1691234567890
    }
  }
}
```

### Get Profile Change History

Retrieve audit trail of profile changes.

```http
GET /profile/history?limit=20&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "id": "change_123456",
        "timestamp": "2025-08-03T14:30:00Z",
        "field": "financialInfo.totalAnnualIncome",
        "oldValue": 75000,
        "newValue": 80000,
        "reason": "Annual income increase",
        "deviceInfo": "iPhone 14 Pro, iOS 16.5"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Advanced Features Endpoints

### Get ML Recommendations

Retrieve AI-powered personalized recommendations.

```http
GET /profile/recommendations/advanced
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "ml_rec_001",
        "type": "savings_rate",
        "title": "AI-Optimized Savings Strategy",
        "description": "Our ML model suggests increasing your savings rate to 40%.",
        "rationale": "Analysis of similar profiles shows this optimizes your FIRE timeline.",
        "actionSteps": [
          "Analyze spending patterns using AI insights",
          "Implement automated savings increases",
          "Track progress with ML-powered monitoring"
        ],
        "impact": {
          "timeToFire": 12.5,
          "additionalSavings": 7500,
          "confidenceIncrease": 0.15
        },
        "priority": "high",
        "confidence": 0.88,
        "mlScore": 0.92,
        "peerComparison": {
          "userPercentile": 65,
          "averageValue": 0.32,
          "topPercentileValue": 0.55,
          "category": "Savings Rate",
          "sampleSize": 1250,
          "anonymous": true
        },
        "marketConditions": {
          "marketTrend": "neutral",
          "volatilityIndex": 22,
          "recommendedAdjustment": "Maintain long-term perspective",
          "confidenceLevel": 0.85,
          "lastUpdated": 1691234567890
        },
        "implementationTracking": {
          "started": false,
          "progress": 0,
          "milestones": [
            {
              "id": "1",
              "title": "Analyze Current Spending",
              "description": "Review last 3 months of expenses",
              "completed": false
            }
          ]
        },
        "createdAt": 1691234567890,
        "expiresAt": 1693826567890
      }
    ],
    "lastAnalysis": 1691234567890,
    "nextAnalysis": 1691320967890
  }
}
```

### Start Recommendation Implementation

Mark a recommendation as started and begin tracking implementation.

```http
POST /profile/recommendations/{recommendationId}/implement
```

**Response:**

```json
{
  "success": true,
  "data": {
    "implementationId": "impl_123456",
    "recommendation": {
      // Updated recommendation with implementation tracking
    },
    "milestones": [
      {
        "id": "1",
        "title": "Analyze Current Spending",
        "description": "Review last 3 months of expenses",
        "completed": false,
        "dueDate": "2025-08-10T00:00:00Z"
      }
    ]
  }
}
```

### Get Privacy Dashboard

Retrieve privacy dashboard with data transparency information.

```http
GET /profile/privacy/dashboard
```

**Response:**

```json
{
  "success": true,
  "data": {
    "privacyScore": 78,
    "dataCollected": [
      {
        "category": "Financial Data",
        "description": "Income, expenses, savings, and investment information",
        "purpose": "FIRE calculations and personalized recommendations",
        "frequency": "When you update your profile",
        "enabled": true,
        "required": true
      },
      {
        "category": "Usage Analytics",
        "description": "App usage patterns, feature interactions, and performance data",
        "purpose": "Improve app functionality and user experience",
        "frequency": "Continuously while using the app",
        "enabled": true,
        "required": false
      }
    ],
    "dataUsage": [
      {
        "purpose": "FIRE Calculations",
        "description": "Calculate your FIRE number, savings rate, and timeline",
        "dataTypes": ["Financial Data", "Personal Information"],
        "frequency": "Real-time when data changes"
      }
    ],
    "thirdPartySharing": [
      {
        "name": "Analytics Provider",
        "purpose": "App usage analytics and performance monitoring",
        "dataShared": ["Usage Analytics", "Device Information"],
        "privacyPolicy": "https://example.com/analytics-privacy",
        "enabled": true
      }
    ],
    "userRights": {
      "canExport": true,
      "canDelete": true,
      "canCorrect": true,
      "canRestrict": true,
      "canPortability": true
    },
    "recommendations": [
      "Consider disabling optional data collection to improve privacy",
      "Review third-party data sharing settings"
    ]
  }
}
```

### Update Privacy Settings

Update privacy and data collection preferences.

```http
PUT /profile/privacy/settings
```

**Request Body:**

```json
{
  "dataCollection": {
    "analytics": false,
    "crashReporting": true,
    "locationData": false
  },
  "dataSharing": {
    "anonymizedInsights": true,
    "marketingCommunications": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "privacyScore": 85,
    "updatedSettings": {
      // Updated privacy settings
    },
    "impactAnalysis": {
      "featuresAffected": ["Personalized recommendations", "Usage insights"],
      "dataRetentionChanges": ["Analytics data will be deleted after 30 days"]
    }
  }
}
```

### Export Profile Data

Export user data for GDPR compliance.

```http
POST /profile/export
```

**Request Body:**

```json
{
  "format": "json" | "csv",
  "includeHistory": true,
  "includeRecommendations": true,
  "includeSecurityEvents": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "exportId": "export_123456",
    "downloadUrl": "https://api.drishti.app/exports/export_123456.json",
    "expiresAt": "2025-08-10T00:00:00Z",
    "fileSize": 2048576,
    "format": "json"
  }
}
```

## Security Events Endpoints

### Get Security Events

Retrieve security event log for audit purposes.

```http
GET /profile/security/events?limit=50&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123456",
        "type": "profile_update",
        "description": "Profile information updated",
        "severity": "info",
        "timestamp": "2025-08-03T14:30:00Z",
        "deviceInfo": "iPhone 14 Pro, iOS 16.5",
        "ipAddress": "192.168.1.100",
        "location": "San Francisco, CA",
        "metadata": {
          "fieldsChanged": ["financialInfo.totalAnnualIncome"],
          "changeReason": "Annual income increase"
        }
      }
    ],
    "pagination": {
      "total": 125,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "personalInfo.email",
      "reason": "Invalid email format"
    },
    "timestamp": "2025-08-03T14:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error occurred

## Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **Profile endpoints**: 100 requests per minute
- **Onboarding endpoints**: 50 requests per minute
- **File upload endpoints**: 10 requests per minute
- **Export endpoints**: 5 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691234567
```

## Webhooks

The system supports webhooks for real-time notifications:

### Profile Update Webhook

```json
{
  "event": "profile.updated",
  "timestamp": "2025-08-03T14:30:00Z",
  "data": {
    "userId": "user_123456",
    "changeId": "change_123456",
    "fieldsChanged": ["financialInfo.totalAnnualIncome"],
    "securityScore": 87
  }
}
```

### Recommendation Generated Webhook

```json
{
  "event": "recommendation.generated",
  "timestamp": "2025-08-03T14:30:00Z",
  "data": {
    "userId": "user_123456",
    "recommendationId": "ml_rec_001",
    "type": "savings_rate",
    "priority": "high",
    "mlScore": 0.92
  }
}
```

This API documentation provides comprehensive coverage of all Epic 5 endpoints with detailed request/response examples and usage guidelines.
