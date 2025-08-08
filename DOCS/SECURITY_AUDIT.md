# Security Audit & Monitoring Guide

## Overview

This document outlines the security audit tools and monitoring capabilities implemented in Drishti.

## Security Audit Scripts

### npm run security:audit

Runs automated security vulnerability scanning with configurable severity thresholds.

```bash
# Run with default threshold (high)
npm run security:audit

# Run with custom threshold
MAX_SECURITY_SEVERITY=moderate npm run security:audit
```

**Severity Levels:**
- `info` (0) - Informational
- `low` (1) - Low risk
- `moderate` (2) - Moderate risk  
- `high` (3) - High risk (default threshold)
- `critical` (4) - Critical risk

**Exit Codes:**
- `0` - No blocking vulnerabilities found
- `1` - Blocking vulnerabilities found or audit failed

### npm run security:scan

Comprehensive security scan that runs both `npm audit` and the custom security audit script.

## Security Monitoring Endpoints

### GET /monitoring/security/violations

Returns summary of recent security violations including certificate pinning failures.

**Query Parameters:**
- `hours` (optional) - Time window in hours (default: 24)

**Response:**
```json
{
  "success": true,
  "hours": 24,
  "total": 15,
  "pinning": 3
}
```

### GET /monitoring/security/certificates/freshness

Returns certificate expiration information for monitoring certificate renewal needs.

**Query Parameters:**
- `host` (optional) - Target host (default: api.drishti.app)

**Response:**
```json
{
  "success": true,
  "host": "api.drishti.app",
  "daysRemaining": 45,
  "info": {
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_to": "2024-12-31T23:59:59.000Z",
    "fingerprint256": "..."
  }
}
```

## Background Jobs

### Retention Processing

Automated data retention processing runs daily at 2 AM UTC when Redis is configured.

**Environment Variables:**
- `REDIS_URL` - Redis connection string (required for background jobs)
- `ENABLE_BACKGROUND_JOBS` - Set to `false` to disable (default: enabled if Redis available)

**Manual Trigger:**
```bash
curl -X POST http://localhost:3000/privacy/retention/run \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Audit
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run security:audit
        env:
          MAX_SECURITY_SEVERITY: high
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run security:audit
if [ $? -ne 0 ]; then
  echo "Security audit failed. Commit blocked."
  exit 1
fi
```

## Security Configuration

### Certificate Pinning

Mobile app supports certificate pinning with the following configuration:

**Environment Variables:**
- `EXPO_PUBLIC_USE_PINNED_CLIENT=true` - Enable pinned transport
- `EXPO_PUBLIC_API_URL` - API base URL for violation reporting

**Certificate Assets:**
Place certificate files in mobile app assets and reference via `PinningConfig.certIds`.

### Admin Endpoints

Security monitoring endpoints require admin authentication:

**Headers:**
- `Authorization: Bearer <admin-jwt-token>`

**Admin API Key:**
- `x-admin-key: <ADMIN_API_KEY>` (for retention endpoints)

## Monitoring Dashboard Integration

Security metrics are exposed in Prometheus format at `/monitoring/metrics/prometheus` for integration with monitoring systems like Grafana.

**Key Metrics:**
- `drishti_health_status` - Overall system health
- `drishti_active_alerts` - Number of active security alerts
- `drishti_memory_usage_bytes` - Memory utilization
- `drishti_uptime_seconds` - Application uptime

## Best Practices

1. **Regular Audits**: Run security audits in CI/CD pipeline
2. **Threshold Management**: Set appropriate severity thresholds for your environment
3. **Certificate Monitoring**: Monitor certificate expiration 30+ days in advance
4. **Violation Tracking**: Review security violations regularly
5. **Background Jobs**: Ensure Redis is configured for automated retention processing
6. **Access Control**: Restrict admin endpoints to authorized personnel only

## Troubleshooting

### Common Issues

**Bull Queue Connection Errors:**
- Verify Redis is running and accessible
- Check `REDIS_URL` environment variable
- Ensure network connectivity to Redis instance

**Certificate Pinning Failures:**
- Verify certificate assets are bundled correctly
- Check `PinningConfig.certIds` matches actual certificate files
- Ensure HTTPS endpoints are accessible

**Audit Script Failures:**
- Check Node.js version compatibility
- Verify npm audit can run successfully
- Review audit output for parsing errors

For additional support, check the monitoring endpoints for detailed error information.
