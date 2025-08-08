# Epic 13 — Certificate Pinning Plan

This plan documents our staged approach to achieving secure API communication with certificate pinning on mobile.

## Stage 1 (Implemented): Guards + Logging
- Enforce HTTPS scheme and host allowlist in mobile ApiService
- Add server endpoint POST /security/pinning/violation to record attempted violations
- Document allowed hosts and dev exception rules

## Stage 2 (Pending Approval): Native Pinning
- Add react-native-ssl-pinning (axios-ssl-pinning) with Expo prebuild/config plugin
- Configure public key pinning with at least two pins (current + backup)
- Rotation process: monitor cert changes, update pins ahead of expiration, release app update with overlap
- Violation handling: user-facing error, optional retry with backup pin; log to backend

## Stage 3: Monitoring & Automation
- Backend TLS hardening & certificate monitoring alerts (extend existing monitoring services)
- Automated CT log checks and cron-based alerting (docs + optional job)
- CI checks to ensure pin set freshness

## Rollback Strategy
- Feature flag to disable strict pinning in emergencies
- Graceful degradation to request-signing fallback if needed (doc only)

## Risks & Mitigations
- Pin rotation lag: maintain backup pin and alerting
- Dev friction: clear dev host exceptions and documentation
- Network edge cases: informative UX and retry guidance

