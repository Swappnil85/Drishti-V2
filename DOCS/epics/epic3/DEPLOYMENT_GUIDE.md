# Epic 3: Core Data Models & Local Database - Deployment Guide

## Overview

This deployment guide covers the implementation of **Epic 3: Core Data Models & Local Database**, which establishes the foundational data infrastructure for the Drishti FIRE application. This epic introduces offline-first data management, bank-level encryption, and comprehensive financial data models.

## Prerequisites

### Environment Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **React Native**: v0.72.0 or higher
- **Expo SDK**: v49.0.0 or higher
- **TypeScript**: v5.0.0 or higher

### Required Access
- Database administrator access for schema deployment
- Mobile app deployment permissions
- API server deployment access
- Environment configuration access

### Security Requirements
- Hardware Security Module (HSM) access for production
- Secure key storage infrastructure
- Biometric authentication capabilities
- TLS 1.3 certificates for API endpoints

## Pre-Deployment Checklist

### Database Preparation
- [ ] PostgreSQL server configured and accessible
- [ ] Database user with appropriate permissions created
- [ ] Backup of existing database (if applicable)
- [ ] Database connection string configured
- [ ] SSL/TLS encryption enabled for database connections

### API Server Preparation
- [ ] Environment variables configured
- [ ] JWT secret keys generated and stored securely
- [ ] Rate limiting configuration reviewed
- [ ] CORS settings configured for mobile app
- [ ] Logging and monitoring systems ready

### Mobile App Preparation
- [ ] Expo development environment configured
- [ ] Device testing environment prepared
- [ ] Biometric authentication tested on target devices
- [ ] Secure storage capabilities verified
- [ ] Network connectivity scenarios tested

## Database Migration Scripts

### Core Tables Creation

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    provider VARCHAR(50) DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial accounts table
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'retirement', 'credit', 'loan', 'other')),
    institution VARCHAR(255),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD')),
    interest_rate DECIMAL(5,4),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Financial goals table
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('savings', 'retirement', 'debt_payoff', 'emergency_fund', 'investment', 'other')),
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Scenarios table
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assumptions JSONB DEFAULT '{}',
    projections JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_financial_accounts_user_id ON financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_type ON financial_accounts(account_type);
CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_financial_goals_type ON financial_goals(goal_type);
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX idx_scenarios_default ON scenarios(user_id, is_default) WHERE is_default = TRUE;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Backend Deployment

### 1. Environment Configuration

```bash
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/drishti_db
DATABASE_SSL=true

# JWT configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# API configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=exp://your-expo-app-url

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2. API Server Deployment

```bash
# Install dependencies
cd apps/api
npm install --production

# Run database migrations
npm run migrate

# Build the application
npm run build

# Start the production server
npm run start:prod
```

### 3. API Health Check

```bash
# Verify API is running
curl -X GET http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-02T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## Mobile App Deployment

### 1. WatermelonDB Configuration

```typescript
// apps/mobile/src/database/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { User, FinancialAccount, FinancialGoal, Scenario } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'drishti_db',
  jsi: true, // Performance optimization
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [User, FinancialAccount, FinancialGoal, Scenario],
});
```

### 2. Encryption Service Configuration

```typescript
// apps/mobile/src/services/encryption/config.ts
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-256-GCM',
  keyLength: 32, // 256 bits
  ivLength: 12,  // 96 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
  saltLength: 32, // 256 bits
  keyRotationDays: 90,
};
```

### 3. Mobile App Build

```bash
# Install dependencies
cd apps/mobile
npm install

# Configure environment
cp .env.example .env.production

# Build for production
eas build --platform all --profile production

# Or for development
expo start --tunnel
```

## Security Configuration

### 1. Encryption Key Management

```typescript
// Production key management setup
const keyManager = KeyManager.getInstance();

// Initialize with hardware-backed storage
await keyManager.initialize({
  useHardwareBackedStorage: true,
  requireBiometricAuth: true,
  keyRotationEnabled: true,
  backupEnabled: true,
});
```

### 2. Biometric Authentication Setup

```typescript
// Configure biometric authentication
import * as LocalAuthentication from 'expo-local-authentication';

const biometricConfig = {
  promptMessage: 'Authenticate to access your financial data',
  fallbackLabel: 'Use Passcode',
  disableDeviceFallback: false,
  requireConfirmation: true,
};
```

### 3. Security Audit Configuration

```typescript
// Enable comprehensive security auditing
const auditService = SecurityAuditService.getInstance();

await auditService.configure({
  logLevel: 'info',
  retentionDays: 90,
  alertThresholds: {
    failedAttempts: 5,
    suspiciousActivity: 10,
    dataAccess: 100,
  },
  exportEnabled: true,
});
```

## Feature Flags

### Epic 3 Feature Configuration

```typescript
// Feature flags for Epic 3
export const EPIC3_FEATURES = {
  // Core features
  OFFLINE_MODE: true,
  DATA_ENCRYPTION: true,
  BIOMETRIC_AUTH: true,
  
  // Advanced features
  KEY_ROTATION: true,
  SECURITY_AUDIT: true,
  PERFORMANCE_MONITORING: true,
  
  // Experimental features
  ADVANCED_SYNC: false,
  REAL_TIME_COLLABORATION: false,
};
```

## Post-Deployment Verification

### 1. Database Verification

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'financial_accounts', 'financial_goals', 'scenarios');

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('users', 'financial_accounts', 'financial_goals', 'scenarios');

-- Test basic operations
INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');
SELECT * FROM users WHERE email = 'test@example.com';
DELETE FROM users WHERE email = 'test@example.com';
```

### 2. API Endpoint Testing

```bash
# Test authentication endpoint
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test financial accounts endpoint
curl -X GET http://localhost:3000/financial/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test financial goals endpoint
curl -X GET http://localhost:3000/financial/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Mobile App Testing

```typescript
// Test database connectivity
const testDatabaseConnection = async () => {
  try {
    const userCount = await database.get('users').query().fetchCount();
    console.log('Database connected, user count:', userCount);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Test encryption service
const testEncryption = async () => {
  try {
    const encryptionService = EncryptionService.getInstance();
    const testData = 'sensitive financial data';
    const encrypted = await encryptionService.encryptData(testData, 'test');
    const decrypted = await encryptionService.decryptData(encrypted.value, 'test');
    return testData === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
};
```

## Performance Monitoring

### Key Metrics to Monitor

- **Database Performance**:
  - Query response time: <50ms for local queries
  - Connection pool utilization: <80%
  - Index usage efficiency: >90%

- **API Performance**:
  - Response time: <200ms for 95th percentile
  - Throughput: >1000 requests/minute
  - Error rate: <1%

- **Mobile App Performance**:
  - App launch time: <2s
  - Encryption/decryption time: <100ms
  - Sync time: <3s for incremental sync

- **Security Metrics**:
  - Failed authentication attempts
  - Encryption key rotation success rate
  - Security audit log completeness

## Monitoring and Alerts

### Database Monitoring

```sql
-- Monitor database performance
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('users', 'financial_accounts', 'financial_goals', 'scenarios');

-- Monitor active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

### Application Monitoring

```typescript
// Performance monitoring setup
const performanceMonitor = {
  trackDatabaseQuery: (query: string, duration: number) => {
    if (duration > 100) {
      console.warn(`Slow query detected: ${query} (${duration}ms)`);
    }
  },
  
  trackEncryptionOperation: (operation: string, duration: number) => {
    if (duration > 200) {
      console.warn(`Slow encryption operation: ${operation} (${duration}ms)`);
    }
  },
  
  trackSyncOperation: (syncType: string, duration: number, recordCount: number) => {
    console.info(`Sync completed: ${syncType}, ${recordCount} records, ${duration}ms`);
  },
};
```

## Rollback Procedures

### Database Rollback

```sql
-- Rollback database changes
BEGIN;

-- Drop Epic 3 tables in reverse order
DROP TABLE IF EXISTS scenarios;
DROP TABLE IF EXISTS financial_goals;
DROP TABLE IF EXISTS financial_accounts;
-- Note: Keep users table if it existed before Epic 3

-- Drop indexes
DROP INDEX IF EXISTS idx_financial_accounts_user_id;
DROP INDEX IF EXISTS idx_financial_accounts_type;
DROP INDEX IF EXISTS idx_financial_goals_user_id;
DROP INDEX IF EXISTS idx_financial_goals_type;
DROP INDEX IF EXISTS idx_scenarios_user_id;
DROP INDEX IF EXISTS idx_scenarios_default;

-- Drop triggers
DROP TRIGGER IF EXISTS update_financial_accounts_updated_at ON financial_accounts;
DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON financial_goals;
DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;

COMMIT;
```

### API Rollback

```bash
# Stop current API server
pm2 stop drishti-api

# Restore previous version
git checkout previous-stable-tag
npm install
npm run build

# Restart with previous version
pm2 start drishti-api
```

### Mobile App Rollback

```bash
# Revert to previous app version
eas build --platform all --profile production --clear-cache

# Or rollback specific commits
git revert HEAD~3..HEAD
expo publish --release-channel production-rollback
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection string format
   - Ensure SSL certificates are valid
   - Verify firewall settings

2. **Encryption Key Issues**
   - Check device biometric capabilities
   - Verify secure storage permissions
   - Test key generation and storage
   - Check hardware security module availability

3. **Sync Issues**
   - Verify network connectivity
   - Check API authentication
   - Monitor sync queue status
   - Validate data consistency

4. **Performance Issues**
   - Monitor database query performance
   - Check encryption operation timing
   - Verify index usage
   - Monitor memory usage

### Debug Commands

```bash
# Check API logs
tail -f /var/log/drishti-api.log

# Monitor database connections
psql -d drishti_db -c "SELECT * FROM pg_stat_activity;"

# Test mobile app database
expo start --tunnel --dev-client
```

## Support Contacts

- **Technical Lead**: [technical-lead@drishti.com](mailto:technical-lead@drishti.com)
- **Database Administrator**: [dba@drishti.com](mailto:dba@drishti.com)
- **Security Team**: [security@drishti.com](mailto:security@drishti.com)
- **DevOps Team**: [devops@drishti.com](mailto:devops@drishti.com)
- **On-Call Support**: [oncall@drishti.com](mailto:oncall@drishti.com)

## Deployment History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0 | 2025-01-02 | Initial Epic 3 deployment | DevOps Team |
| 1.0.1 | TBD | Performance optimizations | TBD |
| 1.1.0 | TBD | Enhanced security features | TBD |

---

**Note**: This deployment guide should be reviewed and updated with each Epic 3 release. Always test deployments in a staging environment before production deployment.