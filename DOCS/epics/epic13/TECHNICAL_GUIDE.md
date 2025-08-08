# Epic 13 Technical Guide

## Services Added
- CertificateQueue: certificate freshness + CT monitoring
- RetentionScheduler: retention policy enforcement
- ExportPdfService, ExportArchiveService: PDF/ZIP outputs + manifest
- DeviceAttestationService: server attestation endpoints (placeholders)
- DeviceIntegrityEnhanced: composite scoring on mobile

## Routes
- /security/attestation/{android|ios}
- /privacy/consent/history
- /privacy/export?format=json|csv|pdf|zip
- /admin/security/dashboard, /admin/security/incident, /admin/compliance/audit

## Migrations
- consent_audit
- family_accounts, family_members

## Configuration
- CERT_MONITOR_HOST, CERT_FRESHNESS_THRESHOLD_DAYS, CT_MONITOR_ENABLED
- REDIS_URL
- GOOGLE_PLAY_INTEGRITY_ENABLED, APPLE_DEVICECHECK_ENABLED
- EXPO_PUBLIC_DEVICE_ATTESTATION_ENABLED
- USER_RETENTION_DAYS, RETENTION_GRACE_PERIOD_DAYS

