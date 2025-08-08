# EPIC 13.5: Security Hardening & Compliance — Finalization

Status: 🚧 PLANNED  
Target: Post-Epic 13 production finalization

## Scope
This epic captures enhanced acceptance criteria that require production credentials/assets or third-party integrations.

## Tracks
- Certificate Pinning & TLS
  - Public key pinning with production assets
  - Threat intelligence / SIEM integration for network security monitoring
  - Live cert renewal fallback validation
- Device Integrity
  - Server-side verification (Google Play Integrity, Apple DeviceCheck/App Attest)
  - Malware detection SDK integration (or documented alternative)
- GDPR/CCPA & Compliance
  - Third-party compliance audit execution and report
- Data Export/Delete
  - Formal portability schema publication and external consumer validation
  - Family account routes/admin UX exposure

## Deliverables
- Verified production pins and rotation
- Configured SIEM/TI feeds and alerts
- Attestation verifiers wired with credentials
- Compliance audit report attached
- Published portability schema and admin UX

