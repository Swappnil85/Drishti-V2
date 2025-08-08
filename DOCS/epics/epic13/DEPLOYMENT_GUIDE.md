# Epic 13 Deployment Guide

## Prerequisites
- DATABASE_URL configured
- REDIS_URL configured for Bull queues
- Production cert/public-key assets supplied to mobile projects
- Google/Apple attestation credentials prepared (if enabling attestation)

## Steps
1. Run DB migrations
   - `npm run db:migrate --workspace=apps/api`
2. Configure background jobs
   - Ensure REDIS_URL is set and reachable
   - Verify logs show retention/certificate jobs scheduled
3. Mobile certificate pinning
   - Add assets as per DOCS/mobile/CERT_ASSETS_README.md
   - Update PinningConfig.certIds
4. Device integrity (optional)
   - Set GOOGLE_PLAY_INTEGRITY_ENABLED / APPLE_DEVICECHECK_ENABLED and credentials
   - Enable EXPO_PUBLIC_DEVICE_ATTESTATION_ENABLED in mobile
5. Monitoring
   - Configure alerts for cert freshness and security violations
   - Optionally integrate SIEM/TI feeds (Epic 13.5)

## Validation
- Run API/unit tests and security scan
- Exercise /privacy/export (json,csv,pdf,zip)
- Test /privacy/consent and verify consent_audit rows
- Check /admin/security/dashboard metrics
- Validate certificate freshness endpoint & scheduled job logs

