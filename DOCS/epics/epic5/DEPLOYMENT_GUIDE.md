# Epic 5: User Onboarding & Profile Management - Deployment Guide

## Overview

This document provides comprehensive deployment instructions for Epic 5: User Onboarding & Profile Management system, including environment setup, deployment procedures, database migrations, and post-deployment verification steps.

## Deployment Prerequisites

### Environment Requirements

- Node.js v16.x or higher
- React Native 0.70.x
- MongoDB 5.0+
- Redis 6.2+

### Required Access

- AWS Console access (IAM role: `drishti-deployment`)
- CI/CD pipeline access (GitHub Actions)
- MongoDB Atlas admin access
- App Store Connect account (for iOS releases)
- Google Play Console access (for Android releases)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Feature flags configured
- [ ] Analytics events verified
- [ ] Accessibility compliance verified
- [ ] Database migration scripts tested
- [ ] Rollback procedures documented

### Database Migration

```sql
-- Add new fields for onboarding tracking
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_variant VARCHAR(20);
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;

-- Create profile_settings table
CREATE TABLE profile_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  privacy_level VARCHAR(20) DEFAULT 'standard',
  recommendation_enabled BOOLEAN DEFAULT TRUE,
  data_sharing_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create profile_photos table
CREATE TABLE profile_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Deployment Procedure

### 1. Backend Deployment

```bash
# Deploy API services
./scripts/deploy-epic5-api.sh --environment=production

# Run database migrations
./scripts/run-migrations.sh --epic=5 --environment=production

# Verify API health
./scripts/verify-api-health.sh --environment=production
```

### 2. Frontend Deployment

```bash
# Build and deploy mobile app updates
./scripts/deploy-epic5-mobile.sh --environment=production

# Submit to app stores
./scripts/submit-to-appstore.sh --version=2.5.0
./scripts/submit-to-playstore.sh --version=2.5.0
```

## Feature Flags

| Flag Name | Description | Default Value |
|-----------|-------------|---------------|
| `enable_new_onboarding` | Enables the new onboarding experience | `true` |
| `enable_ml_recommendations` | Enables ML-powered recommendations | `true` |
| `enable_photo_upload` | Enables profile photo upload feature | `true` |
| `enable_privacy_dashboard` | Enables the privacy dashboard | `true` |

## Rollback Procedure

In case of critical issues, follow these rollback steps:

```bash
# Rollback API deployment
./scripts/rollback-api.sh --epic=5 --environment=production

# Rollback database changes
./scripts/rollback-migrations.sh --epic=5 --environment=production

# Disable feature flags
./scripts/update-feature-flags.sh --flag=enable_new_onboarding --value=false
```

## Post-Deployment Verification

### API Health Checks

- [ ] `/health` endpoint returns 200 OK
- [ ] `/onboarding/initialize` endpoint functions correctly
- [ ] `/profile` endpoints respond with correct data
- [ ] Authentication flow works end-to-end

### Mobile App Verification

- [ ] App launches successfully on iOS and Android
- [ ] Onboarding flow can be completed
- [ ] Profile management functions work correctly
- [ ] ML recommendations appear correctly
- [ ] Photo upload works as expected

## Monitoring

### Key Metrics to Monitor

- API response times (target: <200ms)
- Onboarding completion rate (target: >80%)
- Error rates (target: <0.1%)
- Database performance (query times <50ms)
- Mobile app crash rate (target: <0.5%)

### Alerts Configuration

```yaml
# Datadog alert configuration
alerts:
  - name: epic5_api_error_rate
    query: "sum:api.errors{service:onboarding,environment:production} / sum:api.requests{service:onboarding,environment:production} * 100 > 2"
    message: "Error rate for onboarding API exceeds 2%"
    notify: ["@devops-team", "@product-team"]
  
  - name: epic5_onboarding_completion_drop
    query: "avg:onboarding.completion_rate{environment:production}.rollup(86400) < 75"
    message: "Onboarding completion rate below 75% over 24h period"
    notify: ["@product-team"]
```

## Support Contacts

- **Primary On-Call**: DevOps Team (devops@drishti.app)
- **Secondary Contact**: Backend Team Lead (backend-lead@drishti.app)
- **Product Owner**: Product Manager (product@drishti.app)

## Deployment History

| Version | Date | Deployer | Notes |
|---------|------|----------|-------|
| 2.5.0 | August 15, 2025 | DevOps Team | Initial deployment of Epic 5 |
| 2.5.1 | August 18, 2025 | DevOps Team | Hotfix for onboarding analytics |
