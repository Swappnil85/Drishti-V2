# E13 — Privacy & Security Hardening

### E13-S1: Local DB Encryption
**Acceptance Criteria**
- Encrypt SQLite/WatermelonDB at rest; key in secure storage.
**Telemetry:** `db_encryption_enabled`.

### E13-S2: App Lock (PIN/Biometrics)
**Dependencies:** E5.  
**Acceptance Criteria**
- Lock after inactivity; unlock by PIN/biometric.
**Telemetry:** `app_locked`, `app_unlocked`.

### E13-S3: Certificate Pinning & TLS-Only
**Acceptance Criteria**
- Reject non-TLS; pin to backend cert (MVP: single pin).

### E13-S4: Root/Jailbreak Detection
**Acceptance Criteria**
- Detect and warn; allow continue with reduced guarantees for MVP.

### E13-S5: Secrets Hygiene & CI Scan
**Acceptance Criteria**
- CI job for secret scanning; env var audit; no secrets in repo.

### E13-S6: Privacy Copy & Settings
**Acceptance Criteria**
- Clear privacy statement; links from onboarding and settings.

---
