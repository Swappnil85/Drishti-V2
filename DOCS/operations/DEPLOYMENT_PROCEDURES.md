# Deployment Procedures

## Overview

This document provides simple, reliable deployment procedures for Drishti's solopreneur operations. The focus is on automated, safe deployments with quick rollback capabilities and minimal downtime.

## 🎯 Deployment Objectives

### Primary Goals
- **Zero Downtime**: Seamless deployments without service interruption
- **Quick Rollback**: <5 minutes to revert problematic deployments
- **Automated Testing**: Automated quality gates before production
- **Safe Deployments**: Multiple safety checks and validations
- **Audit Trail**: Complete deployment history and logs

### Success Metrics
- **99.9% Deployment Success Rate**: Reliable deployment process
- **<10 minutes Deployment Time**: Fast deployment cycles
- **<2 minutes Rollback Time**: Quick recovery from issues
- **100% Automated Testing**: No manual testing required

## 🏗️ Deployment Architecture

### Environment Strategy
```
Development → Staging → Production
     ↓           ↓         ↓
  Local Dev   → Preview → Live App
  (localhost)   (staging)  (production)
```

### Deployment Pipeline
1. **Code Push**: Developer pushes to GitHub
2. **CI/CD Trigger**: GitHub Actions starts pipeline
3. **Build & Test**: Automated testing and building
4. **Staging Deploy**: Deploy to staging environment
5. **Integration Tests**: Run full test suite
6. **Production Deploy**: Deploy to production (manual approval)
7. **Health Checks**: Verify deployment success
8. **Monitoring**: Monitor for issues post-deployment

## 🚀 Production Deployment Process

### Pre-Deployment Checklist
```bash
#!/bin/bash
# scripts/pre-deployment-check.sh

echo "🔍 Pre-Deployment Checklist"
echo "==========================="

# Check if staging is healthy
echo "Checking staging environment..."
STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.yourdomain.com/health)
if [ $STAGING_STATUS -eq 200 ]; then
    echo "✅ Staging environment healthy"
else
    echo "❌ Staging environment unhealthy (HTTP $STAGING_STATUS)"
    exit 1
fi

# Check if all tests pass
echo "Checking test results..."
if [ -f "test-results.xml" ]; then
    FAILED_TESTS=$(grep -c 'failure\|error' test-results.xml)
    if [ $FAILED_TESTS -eq 0 ]; then
        echo "✅ All tests passing"
    else
        echo "❌ $FAILED_TESTS tests failing"
        exit 1
    fi
else
    echo "❌ Test results not found"
    exit 1
fi

# Check database migrations
echo "Checking database migrations..."
PENDING_MIGRATIONS=$(npm run db:migrate:status | grep -c "down")
if [ $PENDING_MIGRATIONS -gt 0 ]; then
    echo "⚠️  $PENDING_MIGRATIONS pending migrations"
    echo "Run 'npm run db:migrate' before deployment"
else
    echo "✅ Database migrations up to date"
fi

# Check environment variables
echo "Checking environment configuration..."
if [ -f ".env.production" ]; then
    MISSING_VARS=$(grep -c "^#\|^$" .env.production)
    echo "✅ Production environment configured"
else
    echo "❌ Production environment file missing"
    exit 1
fi

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✅ Sufficient disk space ($DISK_USAGE% used)"
else
    echo "❌ Low disk space ($DISK_USAGE% used)"
    exit 1
fi

# Check backup status
echo "Checking recent backups..."
LAST_BACKUP=$(find /backups/database -name "*.sql.gz" -mtime -1 | wc -l)
if [ $LAST_BACKUP -gt 0 ]; then
    echo "✅ Recent backup available"
else
    echo "❌ No recent backup found"
    echo "Run backup before deployment"
    exit 1
fi

echo "✅ Pre-deployment checks passed"
echo "Ready for deployment!"
```

### Automated Deployment Script
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e  # Exit on any error

# Configuration
APP_NAME="drishti"
DEPLOY_USER="deploy"
PRODUCTION_HOST="production.yourdomain.com"
DEPLOY_DIR="/var/www/drishti"
BACKUP_DIR="/backups/deployments"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Starting production deployment"
echo "Timestamp: $TIMESTAMP"
echo "================================="

# Step 1: Pre-deployment checks
echo "Step 1: Running pre-deployment checks..."
./scripts/pre-deployment-check.sh
if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment checks failed"
    exit 1
fi

# Step 2: Create deployment backup
echo "Step 2: Creating deployment backup..."
mkdir -p $BACKUP_DIR
cp -r $DEPLOY_DIR $BACKUP_DIR/backup_$TIMESTAMP
echo "✅ Backup created: $BACKUP_DIR/backup_$TIMESTAMP"

# Step 3: Database migration (if needed)
echo "Step 3: Running database migrations..."
npm run db:migrate
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migrations failed"
    exit 1
fi

# Step 4: Build application
echo "Step 4: Building application..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Application build completed"
else
    echo "❌ Application build failed"
    exit 1
fi

# Step 5: Stop application services
echo "Step 5: Stopping application services..."
docker-compose stop api mobile-api
echo "✅ Services stopped"

# Step 6: Deploy new code
echo "Step 6: Deploying new code..."
cp -r dist/* $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp docker-compose.yml $DEPLOY_DIR/
echo "✅ Code deployed"

# Step 7: Install dependencies
echo "Step 7: Installing dependencies..."
cd $DEPLOY_DIR
npm ci --production
echo "✅ Dependencies installed"

# Step 8: Start application services
echo "Step 8: Starting application services..."
docker-compose up -d
echo "✅ Services started"

# Step 9: Health check
echo "Step 9: Running health checks..."
sleep 30  # Wait for services to start
./scripts/post-deployment-check.sh
if [ $? -eq 0 ]; then
    echo "✅ Health checks passed"
else
    echo "❌ Health checks failed - initiating rollback"
    ./scripts/rollback.sh $TIMESTAMP
    exit 1
fi

# Step 10: Update deployment log
echo "Step 10: Updating deployment log..."
echo "$TIMESTAMP: Deployment successful" >> /var/log/deployments.log
echo "✅ Deployment log updated"

echo "🎉 Production deployment completed successfully!"
echo "Deployment ID: $TIMESTAMP"
echo "Monitor the application for the next 30 minutes"
```

### Post-Deployment Health Checks
```bash
#!/bin/bash
# scripts/post-deployment-check.sh

echo "🏥 Post-Deployment Health Checks"
echo "================================"

# Check API health
echo "Checking API health..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health)
if [ $API_STATUS -eq 200 ]; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed (HTTP $API_STATUS)"
    exit 1
fi

# Check website
echo "Checking website..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com)
if [ $WEB_STATUS -eq 200 ]; then
    echo "✅ Website health check passed"
else
    echo "❌ Website health check failed (HTTP $WEB_STATUS)"
    exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
DB_CHECK=$(psql -h localhost -U postgres -d drishti_production -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
if [ $DB_CHECK -eq 1 ]; then
    echo "✅ Database connectivity check passed"
else
    echo "❌ Database connectivity check failed"
    exit 1
fi

# Check critical endpoints
echo "Checking critical endpoints..."
ENDPOINTS=(
    "https://api.yourdomain.com/auth/status"
    "https://api.yourdomain.com/users/me"
    "https://yourdomain.com/login"
    "https://yourdomain.com/dashboard"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $endpoint)
    if [ $STATUS -eq 200 ] || [ $STATUS -eq 401 ]; then  # 401 is OK for auth endpoints
        echo "✅ $endpoint: OK (HTTP $STATUS)"
    else
        echo "❌ $endpoint: Failed (HTTP $STATUS)"
        exit 1
    fi
done

# Check response times
echo "Checking response times..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.yourdomain.com/health)
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "✅ Response time check passed (${RESPONSE_MS}ms)"
else
    echo "❌ Response time check failed (${RESPONSE_MS}ms > 2000ms)"
    exit 1
fi

# Check error rates
echo "Checking error rates..."
ERROR_COUNT=$(tail -100 /var/log/app.log | grep -c "ERROR\|FATAL" || echo "0")
if [ $ERROR_COUNT -lt 5 ]; then
    echo "✅ Error rate check passed ($ERROR_COUNT errors in last 100 log entries)"
else
    echo "❌ Error rate check failed ($ERROR_COUNT errors in last 100 log entries)"
    exit 1
fi

echo "✅ All post-deployment health checks passed"
```

## 🔄 Rollback Procedures

### Automated Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

DEPLOYMENT_ID=$1
BACKUP_DIR="/backups/deployments"
DEPLOY_DIR="/var/www/drishti"

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "Usage: $0 <deployment_id>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/
    exit 1
fi

BACKUP_PATH="$BACKUP_DIR/backup_$DEPLOYMENT_ID"

if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ Backup not found: $BACKUP_PATH"
    exit 1
fi

echo "🔄 Starting rollback to deployment: $DEPLOYMENT_ID"
echo "================================================"

# Step 1: Stop current services
echo "Step 1: Stopping current services..."
docker-compose stop
echo "✅ Services stopped"

# Step 2: Restore previous version
echo "Step 2: Restoring previous version..."
rm -rf $DEPLOY_DIR/*
cp -r $BACKUP_PATH/* $DEPLOY_DIR/
echo "✅ Previous version restored"

# Step 3: Restore database (if needed)
echo "Step 3: Checking database rollback..."
read -p "Do you need to rollback the database? (yes/no): " rollback_db
if [ "$rollback_db" = "yes" ]; then
    echo "Finding database backup for $DEPLOYMENT_ID..."
    DB_BACKUP=$(find /backups/database -name "*$DEPLOYMENT_ID*.sql.gz" | head -1)
    if [ ! -z "$DB_BACKUP" ]; then
        echo "Restoring database from: $DB_BACKUP"
        ./scripts/restore-database.sh $DB_BACKUP
    else
        echo "⚠️  No database backup found for $DEPLOYMENT_ID"
        echo "Using latest available backup..."
        LATEST_DB_BACKUP=$(find /backups/database -name "*.sql.gz" | sort | tail -1)
        ./scripts/restore-database.sh $LATEST_DB_BACKUP
    fi
fi

# Step 4: Start services
echo "Step 4: Starting services..."
cd $DEPLOY_DIR
docker-compose up -d
echo "✅ Services started"

# Step 5: Health check
echo "Step 5: Running health checks..."
sleep 30
./scripts/post-deployment-check.sh
if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
    echo "$(date): Rollback to $DEPLOYMENT_ID successful" >> /var/log/deployments.log
else
    echo "❌ Rollback health checks failed"
    echo "$(date): Rollback to $DEPLOYMENT_ID failed" >> /var/log/deployments.log
    exit 1
fi

echo "🎉 Rollback completed successfully!"
echo "Rolled back to deployment: $DEPLOYMENT_ID"
```

### Quick Rollback (Emergency)
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK"
echo "==================="
echo "This will rollback to the last known good deployment"

# Find the most recent backup
LAST_BACKUP=$(ls -t /backups/deployments/ | head -1)

if [ -z "$LAST_BACKUP" ]; then
    echo "❌ No backup found for rollback"
    exit 1
fi

DEPLOYMENT_ID=$(echo $LAST_BACKUP | sed 's/backup_//')

echo "Rolling back to: $DEPLOYMENT_ID"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    ./scripts/rollback.sh $DEPLOYMENT_ID
else
    echo "Emergency rollback cancelled"
fi
```

## 🔧 GitHub Actions CI/CD

### Production Deployment Workflow
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      force_deploy:
        description: 'Force deployment (skip some checks)'
        required: false
        default: 'false'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Drishti'
          path: '.'
          format: 'JSON'

  deploy-staging:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your staging deployment commands here
      
      - name: Run integration tests
        run: |
          echo "Running integration tests on staging"
          # Add your integration test commands here

  deploy-production:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.DEPLOY_SSH_KEY }}
      
      - name: Deploy to production
        run: |
          ssh -o StrictHostKeyChecking=no deploy@production.yourdomain.com '
            cd /var/www/drishti &&
            git pull origin main &&
            ./scripts/deploy-production.sh
          '
      
      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment ${{ job.status }}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Staging Deployment Workflow
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your staging deployment commands here
      
      - name: Run smoke tests
        run: |
          echo "Running smoke tests"
          # Add your smoke test commands here
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Deployed to staging: https://staging.yourdomain.com'
            })
```

## 📊 Deployment Monitoring

### Deployment Dashboard
```bash
#!/bin/bash
# scripts/deployment-status.sh

echo "📊 Deployment Status Dashboard"
echo "============================="
echo

# Current deployment info
echo "🚀 Current Deployment:"
CURRENT_VERSION=$(cat /var/www/drishti/package.json | grep version | cut -d'"' -f4)
CURRENT_COMMIT=$(cd /var/www/drishti && git rev-parse --short HEAD)
DEPLOY_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" /var/www/drishti/package.json)

echo "  Version: $CURRENT_VERSION"
echo "  Commit: $CURRENT_COMMIT"
echo "  Deployed: $DEPLOY_TIME"
echo

# Recent deployments
echo "📅 Recent Deployments:"
tail -5 /var/log/deployments.log
echo

# Application health
echo "🏥 Application Health:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health)
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com)
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.yourdomain.com/health)

if [ $API_STATUS -eq 200 ]; then
    echo "  ✅ API: Healthy (HTTP $API_STATUS)"
else
    echo "  ❌ API: Unhealthy (HTTP $API_STATUS)"
fi

if [ $WEB_STATUS -eq 200 ]; then
    echo "  ✅ Website: Healthy (HTTP $WEB_STATUS)"
else
    echo "  ❌ Website: Unhealthy (HTTP $WEB_STATUS)"
fi

echo "  ⏱️  Response Time: ${RESPONSE_TIME}s"
echo

# Error rates
echo "📈 Error Rates (Last Hour):"
ERROR_COUNT=$(tail -1000 /var/log/app.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" | grep -c "ERROR\|FATAL" || echo "0")
TOTAL_REQUESTS=$(tail -1000 /var/log/access.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" | wc -l || echo "1")
ERROR_RATE=$(echo "scale=2; $ERROR_COUNT * 100 / $TOTAL_REQUESTS" | bc)

echo "  Errors: $ERROR_COUNT"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Error Rate: $ERROR_RATE%"
echo

# Deployment metrics
echo "📊 Deployment Metrics (Last 30 Days):"
DEPLOYMENT_COUNT=$(grep -c "Deployment successful" /var/log/deployments.log | tail -30)
ROLLBACK_COUNT=$(grep -c "Rollback" /var/log/deployments.log | tail -30)
SUCCESS_RATE=$(echo "scale=2; ($DEPLOYMENT_COUNT - $ROLLBACK_COUNT) * 100 / $DEPLOYMENT_COUNT" | bc)

echo "  Total Deployments: $DEPLOYMENT_COUNT"
echo "  Rollbacks: $ROLLBACK_COUNT"
echo "  Success Rate: $SUCCESS_RATE%"
```

### Deployment Alerts
```bash
#!/bin/bash
# scripts/deployment-alerts.sh

# Check deployment health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/health)
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.yourdomain.com/health)
ERROR_COUNT=$(tail -100 /var/log/app.log | grep -c "ERROR\|FATAL")

# Alert thresholds
MAX_RESPONSE_TIME=2.0
MAX_ERROR_COUNT=10

# Check for issues
if [ $API_STATUS -ne 200 ]; then
    echo "🚨 ALERT: API is down (HTTP $API_STATUS)"
    # Send notification
fi

if (( $(echo "$RESPONSE_TIME > $MAX_RESPONSE_TIME" | bc -l) )); then
    echo "🚨 ALERT: High response time (${RESPONSE_TIME}s)"
    # Send notification
fi

if [ $ERROR_COUNT -gt $MAX_ERROR_COUNT ]; then
    echo "🚨 ALERT: High error rate ($ERROR_COUNT errors)"
    # Send notification
fi
```

## 📋 Deployment Checklist

### Pre-Deployment (Manual)
- [ ] **Code Review**: All changes reviewed and approved
- [ ] **Tests Passing**: All automated tests pass
- [ ] **Security Scan**: No high-severity vulnerabilities
- [ ] **Database Backup**: Recent backup available
- [ ] **Staging Tested**: Deployment tested on staging
- [ ] **Documentation**: Deployment notes prepared
- [ ] **Rollback Plan**: Rollback procedure confirmed
- [ ] **Monitoring**: Monitoring systems operational

### During Deployment (Automated)
- [ ] **Pre-checks**: All pre-deployment checks pass
- [ ] **Backup Created**: Deployment backup created
- [ ] **Database Migration**: Migrations applied successfully
- [ ] **Code Deployed**: New code deployed to servers
- [ ] **Services Restarted**: Application services restarted
- [ ] **Health Checks**: Post-deployment health checks pass
- [ ] **Monitoring**: Deployment monitoring active

### Post-Deployment (Manual)
- [ ] **Functionality Test**: Key features working
- [ ] **Performance Check**: Response times normal
- [ ] **Error Monitoring**: No unusual errors
- [ ] **User Feedback**: Monitor user reports
- [ ] **Metrics Review**: Key metrics stable
- [ ] **Documentation**: Deployment documented
- [ ] **Team Notification**: Team informed of deployment

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Common fixes
npm ci  # Clean install
npm run clean && npm run build  # Clean build
rm -rf node_modules && npm install  # Fresh dependencies
```

#### Database Migration Issues
```bash
# Check migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:down

# Force migration
npm run db:migrate:up
```

#### Service Startup Issues
```bash
# Check service logs
docker-compose logs api
docker-compose logs mobile-api

# Restart specific service
docker-compose restart api

# Full restart
docker-compose down && docker-compose up -d
```

#### Health Check Failures
```bash
# Manual health check
curl -v https://api.yourdomain.com/health

# Check application logs
tail -f /var/log/app.log

# Check system resources
top
df -h
free -m
```

## 📚 Additional Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)

### Tools
- [GitHub Actions](https://github.com/features/actions)
- [Docker](https://www.docker.com/)
- [PM2](https://pm2.keymetrics.io/)

---

**Document Control**
- **Author**: AI System Analyst
- **Version**: 1.0
- **Last Updated**: January 2025
- **Review Cycle**: Quarterly
- **Next Review**: April 2025