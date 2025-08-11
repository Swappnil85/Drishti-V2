# Epic 9: Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Epic 9: Scenario Planning & Projections to production environments. The deployment includes 7 new services, 5 enhanced screens, and supporting infrastructure.

## Pre-Deployment Checklist

### Environment Verification
- [ ] Node.js 18+ installed
- [ ] React Native 0.72+ environment configured
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Monitoring systems operational

### Code Quality Gates
- [ ] All tests passing (97.3% coverage achieved)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance benchmarks met (<200ms response times)
- [ ] Code review approved
- [ ] Documentation updated

### Infrastructure Requirements
- [ ] Database storage: +2GB for historical data
- [ ] Memory: +512MB for calculation services
- [ ] CPU: Optimized for concurrent calculations
- [ ] CDN: Historical data caching configured

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  Mobile App    │  Scenario Services  │  Calculation Engine  │
├─────────────────────────────────────────────────────────────┤
│  Database      │  Cache Layer        │  File Storage        │
├─────────────────────────────────────────────────────────────┤
│  Monitoring    │  Logging           │  Analytics           │
└─────────────────────────────────────────────────────────────┘
```

## Environment Configuration

### Required Environment Variables

```bash
# Epic 9 Scenario Planning Configuration
SCENARIO_MAX_COUNT=50
SCENARIO_VERSION_LIMIT=20
HISTORICAL_DATA_CACHE_TTL=86400
STRESS_TEST_TIMEOUT=30000

# Performance Settings
CALCULATION_DEBOUNCE_MS=300
PROJECTION_MAX_YEARS=50
COMPARISON_MAX_SCENARIOS=5
REAL_TIME_UPDATE_INTERVAL=500

# Security Settings
RATE_LIMIT_SCENARIO_CREATION=10
RATE_LIMIT_STRESS_TESTING=5
SHARE_CODE_EXPIRY_DAYS=30
SCENARIO_ENCRYPTION_KEY=<secure-key>

# Historical Data Configuration
HISTORICAL_DATA_SOURCE=internal
MARKET_DATA_API_KEY=<api-key>
DATA_VALIDATION_ENABLED=true
CONFIDENCE_SCORING_ENABLED=true

# Export Configuration
EXPORT_MAX_FILE_SIZE=10MB
EXPORT_TIMEOUT=30000
PDF_GENERATION_ENABLED=true
EXCEL_GENERATION_ENABLED=true

# Monitoring and Analytics
PERFORMANCE_TRACKING_ENABLED=true
USAGE_ANALYTICS_ENABLED=true
ERROR_REPORTING_ENABLED=true
DEBUG_MODE=false
```

### Database Configuration

```sql
-- Create Epic 9 specific tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scenarios table
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    assumptions JSONB NOT NULL,
    tags TEXT[],
    color VARCHAR(7),
    emoji VARCHAR(10),
    popularity_score INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scenario versions table
CREATE TABLE scenario_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    changes JSONB,
    metadata JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(scenario_id, version)
);

-- Scenario shares table
CREATE TABLE scenario_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    version_id UUID REFERENCES scenario_versions(id),
    share_code VARCHAR(8) UNIQUE NOT NULL,
    share_type VARCHAR(20) NOT NULL,
    permissions JSONB NOT NULL,
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    anonymized BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historical market data table
CREATE TABLE historical_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    market_return DECIMAL(5,4) NOT NULL,
    inflation_rate DECIMAL(5,4) NOT NULL,
    unemployment_rate DECIMAL(5,4),
    gdp_growth DECIMAL(5,4),
    events JSONB,
    confidence_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(year)
);

-- Stress test results table
CREATE TABLE stress_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX idx_scenarios_type ON scenarios(type);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at);
CREATE INDEX idx_scenario_versions_scenario_id ON scenario_versions(scenario_id);
CREATE INDEX idx_scenario_shares_share_code ON scenario_shares(share_code);
CREATE INDEX idx_scenario_shares_expires_at ON scenario_shares(expires_at);
CREATE INDEX idx_historical_data_year ON historical_market_data(year);
CREATE INDEX idx_stress_tests_scenario_id ON stress_test_results(scenario_id);
```

## Deployment Steps

### Step 1: Database Migration

```bash
# Run database migrations
npm run db:migrate

# Seed historical market data
npm run db:seed:historical-data

# Verify data integrity
npm run db:verify
```

### Step 2: Service Deployment

```bash
# Build the application
npm run build:production

# Deploy services
npm run deploy:services

# Verify service health
npm run health:check
```

### Step 3: Mobile App Deployment

```bash
# Build mobile app
cd apps/_archive/mobile-v1/
npm run build:release

# Deploy to app stores (if applicable)
npm run deploy:mobile

# Verify mobile functionality
npm run test:mobile:e2e
```

### Step 4: Configuration Validation

```bash
# Validate environment configuration
npm run config:validate

# Test service connectivity
npm run test:connectivity

# Verify security settings
npm run security:check
```

## Data Migration

### Historical Market Data

The system requires 60+ years of historical market data. This data is seeded during deployment:

```sql
-- Sample historical data insertion
INSERT INTO historical_market_data (year, market_return, inflation_rate, unemployment_rate, gdp_growth, events, confidence_metrics) VALUES
(2008, -0.37, 0.0038, 0.058, -0.0028, '{"events": ["Financial Crisis", "Lehman Brothers Collapse"]}', '{"dataQuality": 0.95, "sampleSize": 1000, "volatility": 0.45, "overallConfidence": 0.92}'),
(2020, -0.20, 0.012, 0.084, -0.035, '{"events": ["COVID-19 Pandemic", "Market Crash", "Stimulus Response"]}', '{"dataQuality": 0.98, "sampleSize": 1200, "volatility": 0.38, "overallConfidence": 0.94}'),
-- ... additional historical data
```

### Scenario Templates

Pre-built scenario templates are seeded:

```sql
-- Economic environment scenarios
INSERT INTO scenarios (name, description, type, category, assumptions, tags, color, emoji, popularity_score) VALUES
('2008 Financial Crisis', 'Severe market downturn with banking crisis', 'economic_environment', 'recession', '{"inflation_rate": 0.0038, "market_return": -0.37, "savings_rate": 0.15, "unemployment_risk": 0.10}', ARRAY['recession', 'crisis'], '#F44336', '📉', 85),
('COVID-19 Recovery', 'Pandemic response with stimulus measures', 'economic_environment', 'recovery', '{"inflation_rate": 0.025, "market_return": 0.12, "savings_rate": 0.25, "government_support": 0.15}', ARRAY['pandemic', 'recovery'], '#4CAF50', '🦠', 78);
```

## Performance Optimization

### Caching Strategy

```javascript
// Redis caching configuration
const cacheConfig = {
  historical_data: {
    ttl: 86400, // 24 hours
    key_pattern: 'historical:*'
  },
  scenario_calculations: {
    ttl: 3600, // 1 hour
    key_pattern: 'calc:*'
  },
  stress_test_results: {
    ttl: 7200, // 2 hours
    key_pattern: 'stress:*'
  }
};
```

### Database Optimization

```sql
-- Performance optimization queries
ANALYZE scenarios;
ANALYZE scenario_versions;
ANALYZE historical_market_data;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;
```

## Monitoring Setup

### Health Check Endpoints

```javascript
// Health check configuration
const healthChecks = {
  '/health/scenarios': 'Scenario service health',
  '/health/calculations': 'Calculation engine health',
  '/health/historical-data': 'Historical data availability',
  '/health/stress-testing': 'Stress testing service health',
  '/health/database': 'Database connectivity',
  '/health/cache': 'Cache layer health'
};
```

### Performance Monitoring

```javascript
// Performance thresholds
const performanceThresholds = {
  scenario_creation: 100, // ms
  real_time_updates: 50,  // ms
  comparison_analysis: 200, // ms
  stress_testing: 500,    // ms
  export_generation: 2000 // ms
};
```

### Alerting Configuration

```yaml
# Alert rules
alerts:
  - name: "High Response Time"
    condition: "avg_response_time > 200ms"
    severity: "warning"
    
  - name: "Service Down"
    condition: "health_check_failed"
    severity: "critical"
    
  - name: "High Error Rate"
    condition: "error_rate > 1%"
    severity: "warning"
    
  - name: "Database Connection Issues"
    condition: "db_connection_failed"
    severity: "critical"
```

## Security Configuration

### API Rate Limiting

```javascript
// Rate limiting rules
const rateLimits = {
  scenario_creation: { requests: 10, window: 3600000 }, // 10/hour
  stress_testing: { requests: 5, window: 3600000 },     // 5/hour
  export_generation: { requests: 20, window: 3600000 }, // 20/hour
  share_creation: { requests: 15, window: 3600000 }     // 15/hour
};
```

### Data Encryption

```javascript
// Encryption configuration
const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyRotation: 90, // days
  encryptedFields: [
    'scenarios.assumptions',
    'scenario_shares.permissions',
    'stress_test_results.results'
  ]
};
```

## Rollback Procedures

### Emergency Rollback

```bash
# Quick rollback to previous version
npm run rollback:emergency

# Verify rollback success
npm run verify:rollback

# Restore database if needed
npm run db:restore:backup
```

### Gradual Rollback

```bash
# Disable new features
npm run feature:disable epic9

# Route traffic to previous version
npm run traffic:route previous

# Monitor system stability
npm run monitor:stability
```

## Post-Deployment Verification

### Functional Testing

```bash
# Run post-deployment tests
npm run test:post-deployment

# Verify all Epic 9 features
npm run test:epic9:full

# Check performance benchmarks
npm run test:performance
```

### User Acceptance Testing

```bash
# Deploy to staging for UAT
npm run deploy:staging

# Run user acceptance tests
npm run test:uat

# Collect user feedback
npm run feedback:collect
```

## Troubleshooting

### Common Issues

1. **Slow Calculation Performance**
   ```bash
   # Check database performance
   npm run db:analyze
   
   # Verify cache hit rates
   npm run cache:stats
   
   # Monitor CPU usage
   npm run monitor:cpu
   ```

2. **Historical Data Loading Issues**
   ```bash
   # Verify data integrity
   npm run data:verify
   
   # Reload historical data
   npm run data:reload
   
   # Check API connectivity
   npm run api:test
   ```

3. **Export Generation Failures**
   ```bash
   # Check file system permissions
   npm run fs:check
   
   # Verify export service health
   npm run export:health
   
   # Clear export cache
   npm run export:cache:clear
   ```

## Support and Maintenance

### Log Locations

```bash
# Application logs
/var/log/drishti/epic9/
├── scenario-service.log
├── calculation-engine.log
├── stress-testing.log
└── export-service.log

# System logs
/var/log/system/
├── database.log
├── cache.log
└── monitoring.log
```

### Maintenance Tasks

```bash
# Daily maintenance
0 2 * * * npm run maintenance:daily

# Weekly optimization
0 3 * * 0 npm run maintenance:weekly

# Monthly cleanup
0 4 1 * * npm run maintenance:monthly
```

## Success Criteria

### Deployment Success Indicators

- [ ] All services responding to health checks
- [ ] Database migrations completed successfully
- [ ] Historical data loaded and validated
- [ ] Performance benchmarks met
- [ ] Security scans passed
- [ ] User acceptance tests completed
- [ ] Monitoring and alerting operational
- [ ] Documentation updated

### Performance Targets

- [ ] Scenario creation: <100ms
- [ ] Real-time updates: <50ms
- [ ] Comparison analysis: <200ms
- [ ] Stress testing: <500ms
- [ ] Export generation: <2s
- [ ] 99.9% uptime achieved
- [ ] <1% error rate maintained

Epic 9 deployment is considered successful when all success criteria are met and the system is stable under production load.
