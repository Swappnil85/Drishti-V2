# CI/CD Pipeline

## Overview

The Drishti project uses GitHub Actions for continuous integration and deployment, providing automated testing, building, and deployment across multiple environments.

## Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Commit    │───►│   Build     │───►│    Test     │───►│   Deploy    │
│   & Push    │    │   & Lint    │    │   & Scan    │    │   & Monitor │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## GitHub Actions Workflows

### Main CI Workflow (`.github/workflows/ci.yml`)
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run TypeScript type check
        run: npm run type-check
        
      - name: Run ESLint
        run: npm run lint
        
      - name: Check Prettier formatting
        run: npx prettier --check .
        
      - name: Build all packages
        run: npm run build
        
      - name: Run tests
        run: npm run test
        env:
          CI: true

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run security audit
        run: npm audit --audit-level=moderate
        
      - name: Check for vulnerabilities
        run: npx audit-ci --moderate
```

### Deployment Workflow (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build API
        run: npm run build --workspace=apps/api
        
      - name: Build Docker image
        run: |
          docker build -t drishti-api:${{ github.sha }} apps/api
          docker tag drishti-api:${{ github.sha }} drishti-api:latest
          
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: |
          echo "Deploy to staging"
          # Add staging deployment commands
          
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: |
          echo "Deploy to production"
          # Add production deployment commands

  deploy-mobile:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'npm'
          
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build mobile app
        run: |
          cd apps/mobile
          expo build:android --release-channel production
          expo build:ios --release-channel production
```

## Branch Strategy

### Git Flow
```
main (production)
├── develop (staging)
│   ├── feature/user-authentication
│   ├── feature/camera-integration
│   └── feature/ai-analysis
├── hotfix/critical-bug-fix
└── release/v1.1.0
```

### Branch Protection Rules
- **main**: Require PR reviews, status checks, up-to-date branches
- **develop**: Require status checks, allow force push for maintainers
- **feature/***: No restrictions, encourage frequent commits

### Merge Strategy
- **Feature → Develop**: Squash and merge
- **Develop → Main**: Merge commit (preserve history)
- **Hotfix → Main**: Merge commit with immediate deploy

## Environment-Specific Deployments

### Development
- **Trigger**: Every commit to feature branches
- **Target**: Local development environment
- **Process**: Automatic build and test

### Staging
- **Trigger**: Merge to develop branch
- **Target**: Staging environment
- **Process**: Build → Test → Deploy → Smoke tests

### Production
- **Trigger**: Merge to main branch
- **Target**: Production environment
- **Process**: Build → Test → Deploy → Health checks → Rollback on failure

## Deployment Scripts

### API Deployment
```bash
#!/bin/bash
# deploy-api.sh

set -e

echo "Starting API deployment..."

# Build application
npm run build --workspace=apps/api

# Run database migrations
npm run migrate --workspace=apps/api

# Build Docker image
docker build -t drishti-api:$BUILD_NUMBER apps/api

# Deploy to container registry
docker push registry.com/drishti-api:$BUILD_NUMBER

# Update deployment
kubectl set image deployment/drishti-api api=registry.com/drishti-api:$BUILD_NUMBER

# Wait for rollout
kubectl rollout status deployment/drishti-api

echo "API deployment completed successfully!"
```

### Mobile App Deployment
```bash
#!/bin/bash
# deploy-mobile.sh

set -e

echo "Starting mobile app deployment..."

cd apps/mobile

# Build for production
expo build:android --release-channel production
expo build:ios --release-channel production

# Submit to app stores (if configured)
# expo upload:android
# expo upload:ios

echo "Mobile app deployment completed!"
```

## Database Migrations

### Migration Strategy
```typescript
// Migration example using Drizzle
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';

const runMigrations = async () => {
  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations completed successfully!');
};
```

### Migration Workflow
1. **Development**: Create migration files
2. **Testing**: Test migrations on development database
3. **Staging**: Apply migrations to staging environment
4. **Production**: Apply migrations during deployment window

## Rollback Procedures

### API Rollback
```bash
#!/bin/bash
# rollback-api.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback-api.sh <previous_version>"
  exit 1
fi

echo "Rolling back API to version $PREVIOUS_VERSION..."

# Rollback deployment
kubectl set image deployment/drishti-api api=registry.com/drishti-api:$PREVIOUS_VERSION

# Wait for rollout
kubectl rollout status deployment/drishti-api

# Verify health
curl -f http://api.drishti.com/health || exit 1

echo "Rollback completed successfully!"
```

### Database Rollback
```sql
-- Example rollback migration
-- migrations/down/001_rollback_user_table.sql

DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

## Monitoring and Alerting

### Deployment Monitoring
```yaml
# .github/workflows/monitor-deployment.yml
name: Monitor Deployment

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check API health
        run: |
          curl -f https://api.drishti.com/health
          
      - name: Run smoke tests
        run: |
          npm run test:smoke
          
      - name: Notify team
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: "Deployment monitoring failed!"
```

### Performance Monitoring
- **Response Time**: Monitor API response times
- **Error Rate**: Track error rates and patterns
- **Resource Usage**: Monitor CPU, memory, and disk usage
- **User Experience**: Track mobile app performance metrics

## Security in CI/CD

### Secret Management
```yaml
# Using GitHub Secrets
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Security Scanning
- **Dependency Scanning**: npm audit, Snyk
- **Container Scanning**: Docker image vulnerability scanning
- **SAST**: Static application security testing
- **License Compliance**: Check for license violations

## Quality Gates

### Pre-merge Requirements
- [ ] All tests pass
- [ ] Code coverage > 80%
- [ ] No ESLint errors
- [ ] Prettier formatting applied
- [ ] TypeScript compilation successful
- [ ] Security scan passed

### Deployment Requirements
- [ ] All quality gates passed
- [ ] Manual approval for production
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Test Failures**: Verify environment variables and dependencies
3. **Deployment Failures**: Check resource availability and permissions
4. **Migration Failures**: Verify database connectivity and permissions

### Debug Commands
```bash
# Check workflow logs
gh run list --workflow=ci.yml
gh run view <run_id> --log

# Local debugging
npm run build --workspace=apps/api -- --verbose
npm run test -- --verbose
```
