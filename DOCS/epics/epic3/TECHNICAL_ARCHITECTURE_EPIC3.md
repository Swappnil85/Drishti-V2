# Epic 3: Core Data Models & Local Database - Technical Architecture

## Overview
This document outlines the technical architecture for Epic 3, which implements the core financial data models, local database infrastructure, and API services for the Drishti financial planning application.

## Architecture Principles
- **Offline-First**: Mobile app functions without network connectivity
- **Data Consistency**: Robust synchronization between local and remote data
- **Type Safety**: Full TypeScript coverage across all layers
- **Security**: JWT authentication and input validation throughout
- **Scalability**: Designed to handle growing user base and data volume

## System Architecture

### High-Level Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Backend API   │    │   PostgreSQL    │
│  (React Native) │◄──►│  (Node.js)      │◄──►│   Database      │
│   WatermelonDB  │    │   Fastify       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Design

### PostgreSQL Schema (Backend)
```sql
-- Core entity tables
users                 -- User accounts and profiles
financial_accounts    -- User's financial accounts (checking, savings, etc.)
financial_goals      -- User's financial goals and targets
scenarios            -- Financial planning scenarios
scenario_goals       -- Many-to-many relationship between scenarios and goals

-- Supporting tables
account_transactions -- Transaction history for accounts
goal_progress       -- Progress tracking for goals
sync_status         -- Synchronization state tracking
user_sessions       -- Session management
```

### WatermelonDB Schema (Mobile)
- **Offline-first** local database using SQLite
- **Reactive** queries with automatic UI updates
- **Sync-ready** with conflict resolution capabilities
- **Type-safe** models with TypeScript decorators

## Data Models

### Core Entities

#### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  is_active: boolean;
  provider: 'email' | 'google' | 'apple';
  created_at: string;
  updated_at: string;
}
```

#### Financial Account
```typescript
interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment' | 'retirement' | 'credit' | 'loan' | 'other';
  institution?: string;
  balance: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
  interest_rate?: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}
```

#### Financial Goal
```typescript
interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  goal_type: 'savings' | 'retirement' | 'debt_payoff' | 'emergency_fund' | 'investment' | 'other';
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  description?: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}
```

#### Scenario
```typescript
interface Scenario {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  assumptions: ScenarioAssumptions;
  projections: ScenarioProjections;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}
```

## API Architecture

### Backend Services (Node.js/Fastify)

#### Service Layer Pattern
```typescript
// Service classes handle business logic
FinancialAccountService
FinancialGoalService
ScenarioService
```

## 🔌 API Implementation

### Financial API Architecture
**Complete API Documentation**: See [Epic 3 Financial API Documentation](./API_DOCUMENTATION_EPIC3.md) for detailed endpoint specifications.

**Core API Integration**: All endpoints follow standard patterns defined in [API Overview](../../api/API_OVERVIEW.md):
- RESTful design principles
- JWT authentication middleware
- Standard response formats
- Comprehensive error handling
- Rate limiting and security

### API Endpoint Categories
- **Authentication**: Standard auth endpoints (see [Auth API](../../api/ENDPOINTS.md#authentication-endpoints))
- **Financial Accounts**: CRUD operations for user accounts
- **Financial Goals**: Goal management and progress tracking
- **Financial Scenarios**: Planning scenarios and projections

### Epic 3 API Features
- **Zod Schema Validation**: Input validation for financial data
- **Business Logic**: Complex financial calculations
- **Data Relationships**: Account-Goal-Scenario associations
- **Performance Optimization**: Efficient query patterns

### Authentication & Security
- **JWT Tokens**: Access and refresh token pattern
- **Password Security**: Bcrypt hashing with salt
- **Input Validation**: Zod schemas for all endpoints
- **Rate Limiting**: Prevent abuse and brute force attacks
- **CORS**: Configured for mobile app domains

## Mobile Architecture (React Native)

### WatermelonDB Integration
```typescript
// Database setup
const database = new Database({
  adapter: new SQLiteAdapter({
    schema,
    jsi: true, // Performance optimization
  }),
  modelClasses: [User, FinancialAccount, FinancialGoal, Scenario],
});
```

### Model Relationships
```typescript
// User has many financial accounts, goals, and scenarios
@children('financial_accounts') financialAccounts
@children('financial_goals') financialGoals  
@children('scenarios') scenarios

// Accounts belong to user
@relation('users', 'user_id') user
```

### Offline-First Strategy
1. **Local Operations**: All CRUD operations work offline
2. **Sync Queue**: Changes queued for synchronization
3. **Conflict Resolution**: Last-write-wins with user override option
4. **Incremental Sync**: Only sync changed data

## Data Validation

### Shared Validation (Zod Schemas)
```typescript
// Consistent validation across API and mobile
const createFinancialAccountSchema = z.object({
  name: z.string().min(1).max(255),
  account_type: z.enum(ACCOUNT_TYPES),
  balance: z.number().min(0),
  currency: z.enum(CURRENCIES),
  // ... additional fields
});
```

### Client-Side Validation
- **Real-time**: Validate as user types
- **Form Submission**: Comprehensive validation before API calls
- **Type Safety**: TypeScript ensures correct data types

## Synchronization Strategy

### Sync Process Flow
1. **Change Detection**: Track local modifications
2. **Conflict Detection**: Compare timestamps and checksums
3. **Merge Strategy**: Apply business rules for conflicts
4. **Batch Operations**: Sync multiple changes efficiently
5. **Error Recovery**: Handle network failures gracefully

### Sync Status Tracking
```typescript
interface SyncStatus {
  entity_type: string;
  last_sync: number;
  pending_changes: number;
  sync_in_progress: boolean;
  last_error?: string;
}
```

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexing on frequently queried fields
- **Query Optimization**: Efficient joins and filtering
- **Connection Pooling**: Manage database connections
- **Caching**: Redis for frequently accessed data

### Mobile Performance
- **Lazy Loading**: Load data as needed
- **Virtual Lists**: Handle large datasets efficiently
- **Background Sync**: Sync during app idle time
- **Memory Management**: Proper cleanup of observers

## Security Architecture

### Data Protection
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Local Storage**: Secure storage for sensitive data
- **Biometric Authentication**: Optional biometric login

### Access Control
- **User Isolation**: Users can only access their own data
- **Role-Based Access**: Future support for different user roles
- **API Rate Limiting**: Prevent abuse
- **Input Sanitization**: Prevent injection attacks

## Error Handling

### API Error Responses
```typescript
interface ApiError {
  success: false;
  error: string;
  details?: any;
  code?: string;
}
```

### Mobile Error Handling
- **Network Errors**: Graceful offline mode
- **Validation Errors**: User-friendly messages
- **Sync Conflicts**: User-guided resolution
- **App Crashes**: Error reporting and recovery

## Monitoring & Logging

### Backend Monitoring
- **API Performance**: Response times and error rates
- **Database Performance**: Query execution times
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage patterns and feature adoption

### Mobile Monitoring
- **Crash Reporting**: Automatic crash detection
- **Performance Metrics**: App startup and operation times
- **Sync Success Rates**: Monitor synchronization health
- **User Experience**: Track user interactions

## Deployment Architecture

### Backend Deployment
- **Containerization**: Docker containers for consistency
- **Load Balancing**: Handle multiple concurrent users
- **Database Migrations**: Automated schema updates
- **Environment Management**: Separate dev/staging/production

### Mobile Deployment
- **App Store Distribution**: iOS App Store and Google Play
- **Over-the-Air Updates**: CodePush for rapid updates
- **Feature Flags**: Gradual feature rollouts
- **A/B Testing**: Test different user experiences

## Future Scalability

### Horizontal Scaling
- **Microservices**: Split services as needed
- **Database Sharding**: Partition data by user
- **CDN Integration**: Global content delivery
- **Caching Layers**: Multiple levels of caching

### Feature Extensions
- **Real-time Updates**: WebSocket connections
- **Advanced Analytics**: Machine learning insights
- **Third-party Integrations**: Bank and investment APIs
- **Multi-platform**: Web and desktop applications
