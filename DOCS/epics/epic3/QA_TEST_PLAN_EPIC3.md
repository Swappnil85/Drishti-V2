# Epic 3: Core Data Models & Local Database - QA Test Plan

## Overview
This document outlines the comprehensive testing strategy for Epic 3, focusing on core financial data models, local database implementation, and API services.

## Test Scope
- Database schema validation
- API endpoint functionality
- Mobile database models (WatermelonDB)
- Data validation and error handling
- Authentication and authorization
- Offline functionality

## Test Environment Setup
- PostgreSQL database with test data
- Node.js API server running locally
- React Native mobile app with WatermelonDB
- Test user accounts with various financial scenarios

## 1. Database Schema Tests

### 1.1 Table Structure Validation
- [ ] Verify all tables are created with correct columns
- [ ] Validate foreign key relationships
- [ ] Test database constraints and indexes
- [ ] Verify default values and nullable fields

### 1.2 Data Integrity Tests
- [ ] Test cascade deletes for user accounts
- [ ] Validate unique constraints (email, scenario defaults)
- [ ] Test data type validations
- [ ] Verify timestamp auto-updates

## 2. API Endpoint Tests

### 2.1 Authentication Tests
- [ ] Valid login with correct credentials
- [ ] Invalid login attempts (wrong password, non-existent user)
- [ ] JWT token validation and expiration
- [ ] Protected route access without authentication
- [ ] Token refresh functionality

### 2.2 Financial Account API Tests
- [ ] **POST /financial/accounts** - Create new account
  - Valid account creation with all required fields
  - Invalid data validation (missing name, invalid account type)
  - Duplicate account name handling
  - Maximum field length validation
- [ ] **GET /financial/accounts** - List user accounts
  - Retrieve all accounts for authenticated user
  - Pagination functionality
  - Filtering by account type and status
  - Empty result handling
- [ ] **GET /financial/accounts/:id** - Get specific account
  - Valid account retrieval
  - Non-existent account (404 error)
  - Unauthorized access to other user's account
- [ ] **PUT /financial/accounts/:id** - Update account
  - Valid updates (name, balance, metadata)
  - Invalid data validation
  - Unauthorized update attempts
- [ ] **DELETE /financial/accounts/:id** - Soft delete account
  - Successful account deactivation
  - Unauthorized delete attempts
  - Already deleted account handling

### 2.3 Financial Goal API Tests
- [ ] **POST /financial/goals** - Create new goal
  - Valid goal creation with all fields
  - Invalid data validation (negative amounts, invalid dates)
  - Goal type validation
  - Priority validation (1-5 range)
- [ ] **GET /financial/goals** - List user goals
  - Retrieve all goals with pagination
  - Filtering by goal type and priority
  - Sorting by target date and priority
- [ ] **PUT /financial/goals/:id** - Update goal
  - Progress updates
  - Target amount modifications
  - Goal completion handling
- [ ] **DELETE /financial/goals/:id** - Soft delete goal
  - Goal deactivation
  - Associated progress data handling

### 2.4 Scenario API Tests
- [ ] **POST /financial/scenarios** - Create scenario
  - Valid scenario with assumptions
  - Default scenario handling (only one per user)
  - Assumption validation (rates, ages)
- [ ] **GET /financial/scenarios** - List scenarios
  - Default scenario identification
  - Active/inactive filtering
- [ ] **PUT /financial/scenarios/:id** - Update scenario
  - Assumption modifications
  - Default scenario switching
- [ ] **POST /financial/scenarios/:id/calculate** - Calculate projections
  - Projection calculation accuracy
  - Error handling for invalid assumptions

## 3. Mobile Database Tests (WatermelonDB)

### 3.1 Model Creation and Relationships
- [ ] User model creation and validation
- [ ] FinancialAccount model with user relationship
- [ ] FinancialGoal model with user relationship
- [ ] Scenario model with user relationship
- [ ] Cross-model relationship queries

### 3.2 Offline Functionality
- [ ] Data persistence without network
- [ ] Local CRUD operations
- [ ] Sync status tracking
- [ ] Conflict resolution strategies

### 3.3 Data Validation
- [ ] Client-side validation rules
- [ ] Type safety enforcement
- [ ] Required field validation
- [ ] Format validation (emails, currencies, dates)

## 4. Integration Tests

### 4.1 End-to-End User Flows
- [ ] **Account Creation Flow**
  1. User registers/logs in
  2. Creates first financial account
  3. Verifies account appears in list
  4. Updates account details
  5. Views account summary
- [ ] **Goal Setting Flow**
  1. User creates financial goal
  2. Sets target amount and date
  3. Adds initial progress
  4. Updates progress over time
  5. Completes goal
- [ ] **Scenario Planning Flow**
  1. User creates financial scenario
  2. Sets planning assumptions
  3. Adds goals to scenario
  4. Calculates projections
  5. Compares multiple scenarios

### 4.2 Data Synchronization
- [ ] API to mobile sync
- [ ] Mobile to API sync
- [ ] Conflict resolution
- [ ] Partial sync handling
- [ ] Network interruption recovery

## 5. Performance Tests

### 5.1 API Performance
- [ ] Response times under normal load
- [ ] Database query optimization
- [ ] Large dataset handling
- [ ] Concurrent user scenarios

### 5.2 Mobile Performance
- [ ] Local database query speed
- [ ] Memory usage with large datasets
- [ ] App startup time
- [ ] Sync performance

## 6. Security Tests

### 6.1 Authentication Security
- [ ] Password strength requirements
- [ ] JWT token security
- [ ] Session management
- [ ] Brute force protection

### 6.2 Data Access Security
- [ ] User data isolation
- [ ] SQL injection prevention
- [ ] Input sanitization
- [ ] Authorization checks

## 7. Error Handling Tests

### 7.1 API Error Responses
- [ ] Proper HTTP status codes
- [ ] Meaningful error messages
- [ ] Error logging
- [ ] Graceful degradation

### 7.2 Mobile Error Handling
- [ ] Network connectivity issues
- [ ] Database errors
- [ ] Validation failures
- [ ] User-friendly error messages

## Test Data Requirements

### Sample Users
- User with multiple accounts (checking, savings, investment)
- User with various goal types and priorities
- User with multiple scenarios
- New user with no data

### Sample Financial Data
- Different account types with realistic balances
- Goals with various target dates and amounts
- Scenarios with different assumption sets
- Historical transaction data

## Success Criteria
- [ ] All API endpoints return correct responses
- [ ] Mobile app functions offline and syncs properly
- [ ] Data validation prevents invalid entries
- [ ] Security measures protect user data
- [ ] Performance meets acceptable thresholds
- [ ] Error handling provides good user experience

## Test Execution Schedule
- **Phase 1**: Database and API testing (2 days)
- **Phase 2**: Mobile model testing (1 day)
- **Phase 3**: Integration testing (2 days)
- **Phase 4**: Performance and security testing (1 day)
- **Phase 5**: User acceptance testing (1 day)

## Risk Assessment
- **High Risk**: Data synchronization conflicts
- **Medium Risk**: Performance with large datasets
- **Low Risk**: Basic CRUD operations

## Test Tools
- **API Testing**: Postman, Jest
- **Database Testing**: PostgreSQL test scripts
- **Mobile Testing**: React Native testing library
- **Performance Testing**: Artillery, Lighthouse
- **Security Testing**: OWASP ZAP
