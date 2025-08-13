# E12 — Telemetry & Observability

### E12-S1: Event Schema & Minimal PII Policy
**Acceptance Criteria**
- Define canonical event names and required properties; no personal data stored.
**Telemetry:** `telemetry_init`.

### E12-S2: Client Event Queue & Retry
**Acceptance Criteria**
- Buffered queue with backoff on failure; offline-safe.

### E12-S3: Crash Reporting Integration
**Acceptance Criteria**
- Initialize provider; capture unhandled errors; tie to app version/build.

### E12-S4: Funnel & Key Events
**Acceptance Criteria**
- Track: onboarding_start/complete, paywall_view/purchase_success, csv_import_*, goal_create, scenario_apply.

### E12-S5: Health Check & Logging
**Acceptance Criteria**
- Lightweight ping endpoint; redact logs; log levels.

### E12-S6: Telemetry Dashboard (Internal)
**Acceptance Criteria**
- Basic dashboard or exported logs to verify events (MVP can be console or simple file).

---
