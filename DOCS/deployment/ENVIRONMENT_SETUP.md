# Environment Setup

## Overview

This guide covers setting up development, staging, and production environments for the Drishti application.

## Development Environment

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **PostgreSQL**: Version 15 or higher
- **Git**: Latest version
- **Expo CLI**: `npm install -g @expo/cli`

### System Requirements
- **macOS**: 10.15 or higher (for iOS development)
- **Windows**: 10 or higher
- **Linux**: Ubuntu 18.04 or equivalent
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: Minimum 20GB free space

### Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/Swappnil85/Drishti.git
cd Drishti
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

#### 3. Database Setup
```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb drishti_dev

# Create user
psql -d postgres -c "CREATE USER drishti_user WITH PASSWORD 'dev_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE drishti_dev TO drishti_user;"
```

#### 4. Environment Configuration
```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit environment variables
nano apps/api/.env
```

**Development Environment Variables:**
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# Database Configuration
DATABASE_URL=postgresql://drishti_user:dev_password@localhost:5432/drishti_dev

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production

# AI Services (Development)
OPENAI_API_KEY=your-development-openai-key
```

#### 5. Start Development Servers
```bash
# Start API backend
npm run dev --workspace=apps/api

# Start mobile app (in another terminal)
npm run dev --workspace=apps/mobile
```

### Mobile Development Setup

#### iOS Development (macOS only)
```bash
# Install Xcode from App Store
# Install iOS Simulator

# Install CocoaPods
sudo gem install cocoapods

# Install iOS dependencies
cd apps/mobile/ios && pod install
```

#### Android Development
```bash
# Install Android Studio
# Set up Android SDK and emulator

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Staging Environment

### Infrastructure
- **Server**: Cloud instance (AWS EC2, DigitalOcean, etc.)
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
- **File Storage**: Cloud storage (AWS S3, DigitalOcean Spaces)
- **Domain**: staging.drishti.com

### Deployment Process
```bash
# Build applications
npm run build

# Deploy API
docker build -t drishti-api:staging apps/api
docker push registry.com/drishti-api:staging

# Deploy to staging server
ssh staging-server "docker pull registry.com/drishti-api:staging"
ssh staging-server "docker-compose up -d"
```

### Environment Variables (Staging)
```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/drishti_staging
JWT_SECRET=staging-jwt-secret-key
CORS_ORIGIN=https://staging.drishti.com
```

## Production Environment

### Infrastructure Requirements
- **API Server**: Load-balanced instances
- **Database**: High-availability PostgreSQL cluster
- **CDN**: Content delivery network for static assets
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated backup and disaster recovery

### Security Configuration
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/drishti_prod
JWT_SECRET=super-secure-production-jwt-secret
CORS_ORIGIN=https://app.drishti.com

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/drishti.crt
SSL_KEY_PATH=/etc/ssl/private/drishti.key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
```

### Database Configuration
```sql
-- Production database setup
CREATE DATABASE drishti_prod;
CREATE USER drishti_prod_user WITH PASSWORD 'secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE drishti_prod TO drishti_prod_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Docker Configuration

### API Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --only=production

COPY apps/api ./apps/api
COPY packages ./packages
RUN npm run build --workspace=apps/api

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Docker Compose (Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: drishti_dev
      POSTGRES_USER: drishti_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://drishti_user:dev_password@postgres:5432/drishti_dev
    depends_on:
      - postgres
    volumes:
      - ./apps/api:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## Environment Variables Management

### Development
- Use `.env` files for local development
- Never commit `.env` files to version control
- Use `.env.example` as template

### Staging/Production
- Use environment variable injection
- Kubernetes secrets or Docker secrets
- Cloud provider secret management (AWS Secrets Manager, etc.)

### Required Environment Variables

#### API Backend
```env
# Required
NODE_ENV=production|staging|development
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret

# Optional
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=https://...
```

#### Mobile App
```env
# Expo configuration
EXPO_PUBLIC_API_URL=https://api.drishti.com
EXPO_PUBLIC_ENVIRONMENT=production
```

## Health Checks

### API Health Check
```typescript
// Health check endpoint
app.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      database: await checkDatabaseHealth(),
      ai: await checkAIServicesHealth()
    }
  };
  
  return health;
});
```

### Database Health Check
```typescript
const checkDatabaseHealth = async () => {
  try {
    await db.raw('SELECT 1');
    return { status: 'ok', latency: '< 10ms' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};
```

## Monitoring Setup

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **DataDog/New Relic**: Application performance monitoring
- **Custom Metrics**: Business metrics and KPIs

### Infrastructure Monitoring
- **Server Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection pool, query performance
- **Network Metrics**: Response times, error rates

### Alerting
- **Critical Errors**: Immediate notification
- **Performance Degradation**: Threshold-based alerts
- **Security Events**: Authentication failures, suspicious activity

## Backup and Recovery

### Database Backup
```bash
# Automated daily backup
pg_dump -h localhost -U drishti_user drishti_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U drishti_user drishti_prod < backup_20240101.sql
```

### File Backup
- Regular backup of uploaded files
- Cross-region replication
- Point-in-time recovery capability

### Disaster Recovery
- **RTO**: Recovery Time Objective < 4 hours
- **RPO**: Recovery Point Objective < 1 hour
- **Backup Testing**: Monthly restore testing
- **Documentation**: Detailed recovery procedures
