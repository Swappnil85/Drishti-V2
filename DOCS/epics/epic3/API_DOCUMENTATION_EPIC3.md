# Epic 3: Financial API Documentation

## Overview
This document provides comprehensive API documentation for the financial planning endpoints implemented in Epic 3.

## Base URL
```
Development: http://localhost:3001
Production: https://api.drishti.app
```

## Authentication
All financial endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": { ... } // Optional validation details
}
```

## Financial Accounts API

### Create Financial Account
**POST** `/financial/accounts`

Creates a new financial account for the authenticated user.

#### Request Body
```json
{
  "name": "My Checking Account",
  "account_type": "checking",
  "institution": "Bank of America",
  "balance": 5000.00,
  "currency": "USD",
  "interest_rate": 0.01,
  "metadata": {
    "account_number": "****1234",
    "routing_number": "123456789"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "user_id": "user-uuid",
    "name": "My Checking Account",
    "account_type": "checking",
    "institution": "Bank of America",
    "balance": 5000.00,
    "currency": "USD",
    "interest_rate": 0.01,
    "is_active": true,
    "metadata": { ... },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Financial account created successfully"
}
```

### List Financial Accounts
**GET** `/financial/accounts`

Retrieves all financial accounts for the authenticated user with pagination and filtering.

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `accountType` (string, optional): Filter by account type
- `isActive` (boolean, optional): Filter by active status
- `institution` (string, optional): Filter by institution name

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-string",
      "name": "My Checking Account",
      "account_type": "checking",
      "balance": 5000.00,
      // ... other fields
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### Get Financial Account
**GET** `/financial/accounts/:accountId`

Retrieves a specific financial account by ID.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "My Checking Account",
    // ... full account details
  }
}
```

### Update Financial Account
**PUT** `/financial/accounts/:accountId`

Updates an existing financial account.

#### Request Body
```json
{
  "name": "Updated Account Name",
  "balance": 5500.00,
  "metadata": {
    "notes": "Updated account information"
  }
}
```

### Delete Financial Account
**DELETE** `/financial/accounts/:accountId`

Soft deletes a financial account (sets `is_active` to false).

#### Response
```json
{
  "success": true,
  "message": "Financial account deleted successfully"
}
```

### Get Account Summary
**GET** `/financial/accounts/summary`

Retrieves a summary of all user's financial accounts.

#### Response
```json
{
  "success": true,
  "data": {
    "total_assets": 25000.00,
    "total_liabilities": 5000.00,
    "net_worth": 20000.00,
    "accounts_by_type": {
      "checking": { "count": 2, "balance": 8000.00 },
      "savings": { "count": 1, "balance": 15000.00 },
      "credit": { "count": 1, "balance": -2000.00 }
    }
  }
}
```

## Financial Goals API

### Create Financial Goal
**POST** `/financial/goals`

Creates a new financial goal for the authenticated user.

#### Request Body
```json
{
  "name": "Emergency Fund",
  "goal_type": "emergency_fund",
  "target_amount": 10000.00,
  "current_amount": 2000.00,
  "target_date": "2024-12-31",
  "priority": 1,
  "description": "6 months of expenses",
  "metadata": {
    "monthly_target": 500.00
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "user_id": "user-uuid",
    "name": "Emergency Fund",
    "goal_type": "emergency_fund",
    "target_amount": 10000.00,
    "current_amount": 2000.00,
    "target_date": "2024-12-31",
    "priority": 1,
    "description": "6 months of expenses",
    "is_active": true,
    "metadata": { ... },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Financial goal created successfully"
}
```

### List Financial Goals
**GET** `/financial/goals`

Retrieves all financial goals for the authenticated user.

#### Query Parameters
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page
- `goalType` (string, optional): Filter by goal type
- `isActive` (boolean, optional): Filter by active status
- `priority` (number, optional): Filter by priority level

### Update Financial Goal
**PUT** `/financial/goals/:goalId`

Updates an existing financial goal.

### Delete Financial Goal
**DELETE** `/financial/goals/:goalId`

Soft deletes a financial goal.

### Get Goal Summary
**GET** `/financial/goals/summary`

Retrieves a summary of all user's financial goals.

#### Response
```json
{
  "success": true,
  "data": {
    "total_goals": 5,
    "active_goals": 4,
    "completed_goals": 1,
    "total_target_amount": 50000.00,
    "total_current_amount": 25000.00,
    "overall_progress_percentage": 50.0,
    "goals_by_type": {
      "emergency_fund": {
        "count": 1,
        "target_amount": 10000.00,
        "current_amount": 8000.00
      }
    }
  }
}
```

## Scenarios API

### Create Scenario
**POST** `/financial/scenarios`

Creates a new financial planning scenario.

#### Request Body
```json
{
  "name": "Conservative Plan",
  "description": "Conservative financial planning scenario",
  "assumptions": {
    "inflation_rate": 0.03,
    "market_return": 0.07,
    "savings_rate": 0.20,
    "retirement_age": 65,
    "life_expectancy": 85
  },
  "is_default": false
}
```

### List Scenarios
**GET** `/financial/scenarios`

Retrieves all scenarios for the authenticated user.

### Get Default Scenario
**GET** `/financial/scenarios/default`

Retrieves the user's default scenario.

### Update Scenario
**PUT** `/financial/scenarios/:scenarioId`

Updates an existing scenario.

### Calculate Scenario Projections
**POST** `/financial/scenarios/:scenarioId/calculate`

Calculates financial projections for a scenario.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "scenario-uuid",
    "projections": {
      "retirement_savings": 1500000.00,
      "monthly_retirement_income": 5000.00,
      "net_worth_projection": [
        { "year": 2024, "amount": 100000 },
        { "year": 2025, "amount": 120000 }
      ],
      "calculated_at": "2024-01-01T00:00:00Z"
    }
  },
  "message": "Scenario projections calculated successfully"
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Application Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND_ERROR` - Resource not found
- `DUPLICATE_ERROR` - Resource already exists
- `DATABASE_ERROR` - Database operation failed

## Rate Limiting
- **Account Creation**: 10 requests per minute
- **Goal Creation**: 10 requests per minute
- **Scenario Creation**: 5 requests per minute
- **General Endpoints**: 100 requests per minute

## Data Types

### Account Types
- `checking` - Checking Account
- `savings` - Savings Account
- `investment` - Investment Account
- `retirement` - Retirement Account
- `credit` - Credit Card
- `loan` - Loan Account
- `other` - Other Account Type

### Goal Types
- `savings` - General Savings Goal
- `retirement` - Retirement Planning
- `debt_payoff` - Debt Payoff Goal
- `emergency_fund` - Emergency Fund
- `investment` - Investment Goal
- `other` - Other Goal Type

### Currencies
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `JPY` - Japanese Yen
- `CAD` - Canadian Dollar
- `AUD` - Australian Dollar

### Priority Levels
- `1` - Highest Priority
- `2` - High Priority
- `3` - Medium Priority
- `4` - Low Priority
- `5` - Lowest Priority

## Examples

### Complete Account Management Flow
```bash
# 1. Create account
curl -X POST http://localhost:3001/financial/accounts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency Savings",
    "account_type": "savings",
    "balance": 5000.00,
    "currency": "USD"
  }'

# 2. List accounts
curl -X GET http://localhost:3001/financial/accounts \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. Update account
curl -X PUT http://localhost:3001/financial/accounts/$ACCOUNT_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"balance": 5500.00}'

# 4. Get account summary
curl -X GET http://localhost:3001/financial/accounts/summary \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## SDK Integration
For mobile app integration, use the generated TypeScript client or the WatermelonDB models for offline-first functionality.
