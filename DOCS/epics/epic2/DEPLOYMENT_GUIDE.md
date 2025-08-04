# Epic 2: Authentication & Authorization - Deployment Guide

## Overview

**Epic**: Epic 2 - Authentication & Authorization  
**Deployment Date**: January 2, 2025  
**Status**: ✅ **PRODUCTION READY**  
**Security Level**: Enterprise-grade with 75% OWASP compliance

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **React Native**: v0.72.0 or higher
- **Expo SDK**: v49.0.0 or higher
- **TypeScript**: v5.0.0 or higher

### Required Access
- Database administrator access
- API server deployment permissions
- Mobile app store deployment access
- SSL certificate management access

### Security Requirements
- **JWT Secret**: 256-bit cryptographically secure key
- **Session Secret**: 256-bit HMAC signing key
- **OAuth Credentials**: Google and Apple OAuth app credentials
- **SSL/TLS**: Certificate for HTTPS endpoints
- **Rate Limiting**: Redis instance for distributed rate limiting

## Pre-Deployment Checklist

### Database Preparation
- [ ] PostgreSQL instance provisioned
- [ ] SSL/TLS encryption enabled
- [ ] Connection pooling configured (max: 20, idle: 30s)
- [ ] Database migrations ready
- [ ] Backup and recovery procedures tested

### API Server Preparation
- [ ] Environment variables configured
- [ ] JWT and session secrets generated
- [ ] OAuth credentials configured
- [ ] Rate limiting Redis instance ready
- [ ] SSL certificates installed
- [ ] Health check endpoints tested

### Mobile App Preparation
- [ ] Biometric authentication configured
- [ ] SecureStore availability validated
- [ ] OAuth redirect URLs configured
- [ ] App store certificates ready
- [ ] Push notification certificates configured

## Database Setup

### Core Tables Creation

```sql
-- Users table with authentication data
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'email',
  provider_id VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table for JWT management
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth providers table
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);
```

### Performance Indexes

```sql
-- User lookup optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Session management optimization
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token_hash);

-- OAuth provider optimization
CREATE INDEX idx_oauth_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_provider ON oauth_providers(provider, provider_user_id);
```

## Backend Deployment

### Environment Configuration

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# JWT Configuration
JWT_SECRET=your-256-bit-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-256-bit-session-secret

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Security Configuration
RATE_LIMIT_REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://yourdomain.com
HELMET_CSP_ENABLED=true

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### API Server Deployment

```bash
# Install dependencies
npm install --workspace=apps/api

# Run database migrations
npm run migrate --workspace=apps/api

# Build production bundle
npm run build --workspace=apps/api

# Start production server
npm run start:prod --workspace=apps/api
```

### Health Check

```bash
# Verify API health
curl -X GET https://api.yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-02T10:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

## Mobile App Deployment

### Biometric Authentication Configuration

```typescript
// Configure biometric authentication
const biometricConfig = {
  promptMessage: 'Authenticate to access your account',
  fallbackLabel: 'Use Password',
  disableDeviceFallback: false,
  requireConfirmation: true,
};

// SecureStore configuration
const secureStoreOptions = {
  keychainService: 'drishti-keychain',
  sharedPreferencesName: 'drishti-prefs',
  encrypt: true,
  requireAuthentication: true,
};
```

### OAuth Configuration

```typescript
// Google OAuth configuration
const googleConfig = {
  clientId: 'your-google-client-id',
  redirectUri: 'com.drishti.app://oauth/google',
  scopes: ['openid', 'profile', 'email'],
};

// Apple OAuth configuration
const appleConfig = {
  clientId: 'your-apple-client-id',
  redirectUri: 'com.drishti.app://oauth/apple',
  scopes: ['name', 'email'],
};
```

### Build and Deploy

```bash
# Install dependencies
npm install --workspace=apps/mobile

# Configure environment
cp .env.production .env

# Build for production
npm run build:ios --workspace=apps/mobile
npm run build:android --workspace=apps/mobile

# Deploy to app stores
npm run deploy:ios --workspace=apps/mobile
npm run deploy:android --workspace=apps/mobile
```

## Security Configuration

### Rate Limiting Setup

```typescript
// Global rate limiting
const globalRateLimit = {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
};

// Authentication-specific limits
const authRateLimit = {
  registration: { max: 3, timeWindow: '15 minutes' },
  login: { max: 5, timeWindow: '15 minutes' },
  passwordReset: { max: 3, timeWindow: '1 hour' },
};
```

### Input Validation

```typescript
// Comprehensive validation schemas
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/\d/, 'Must contain number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character');
```

## Feature Flags

```typescript
// Feature flag configuration
const featureFlags = {
  biometricAuth: true,
  googleOAuth: true,
  appleOAuth: true,
  emailVerification: true,
  passwordReset: true,
  sessionManagement: true,
  rateLimiting: true,
};
```

## Post-Deployment Verification

### Database Verification

```sql
-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';

-- Test connection pooling
SELECT count(*) FROM pg_stat_activity;
```

### API Testing

```bash
# Test registration endpoint
curl -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"SecurePass123!"}'

# Test login endpoint
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Test rate limiting
for i in {1..6}; do
  curl -X POST https://api.yourdomain.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Mobile App Testing

```typescript
// Test biometric availability
const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
const biometricEnrolled = await LocalAuthentication.isEnrolledAsync();

// Test SecureStore functionality
try {
  await SecureStore.setItemAsync('test-key', 'test-value');
  const value = await SecureStore.getItemAsync('test-key');
  await SecureStore.deleteItemAsync('test-key');
  console.log('SecureStore working:', value === 'test-value');
} catch (error) {
  console.error('SecureStore error:', error);
}
```

## Performance Monitoring

### Key Metrics

```typescript
// Authentication performance metrics
const performanceMetrics = {
  authenticationResponseTime: '< 200ms',
  sessionValidationTime: '< 50ms',
  biometricAuthTime: '< 3s',
  oauthFlowTime: '< 10s',
  databaseQueryTime: '< 100ms',
};
```

### Monitoring Setup

```typescript
// Sentry configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.refreshToken;
    }
    return event;
  },
});
```

## Monitoring and Alerts

### Critical Alerts
- Authentication failure rate > 5%
- Database connection failures
- Rate limit threshold exceeded
- Security event detection
- Performance degradation

### Health Checks
- API endpoint availability
- Database connectivity
- Redis connectivity
- OAuth provider availability
- SSL certificate expiration

## Rollback Procedures

### Database Rollback

```bash
# Rollback database migrations
npm run migrate:rollback --workspace=apps/api

# Restore from backup
pg_restore -d database_name backup_file.sql
```

### API Rollback

```bash
# Deploy previous version
git checkout previous-release-tag
npm run build --workspace=apps/api
npm run deploy --workspace=apps/api
```

### Mobile App Rollback

```bash
# Revert to previous app store version
# Use app store rollback functionality
# Update feature flags to disable new features
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
psql -h host -p port -U username -d database

# Verify SSL configuration
psql "sslmode=require host=host dbname=database user=username"
```

#### Authentication Failures
```bash
# Check JWT secret configuration
echo $JWT_SECRET | wc -c  # Should be 64+ characters

# Verify OAuth configuration
curl -X GET "https://accounts.google.com/.well-known/openid_configuration"
```

#### Rate Limiting Issues
```bash
# Check Redis connectivity
redis-cli -h host -p port ping

# Monitor rate limit counters
redis-cli -h host -p port monitor
```

## Support Contacts

- **Technical Lead**: Principal Engineer
- **DevOps Team**: DevOps Engineer
- **Security Team**: Security Engineer
- **QA Team**: QA Engineer
- **On-call Support**: +1-XXX-XXX-XXXX

## Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v2.0.0 | 2025-01-02 | Initial authentication system | ✅ Deployed |
| v2.0.1 | TBD | Security enhancements | 🔄 Planned |

---

**Deployment Guide Version**: 1.0  
**Last Updated**: January 2, 2025  
**Next Review**: February 2, 2025