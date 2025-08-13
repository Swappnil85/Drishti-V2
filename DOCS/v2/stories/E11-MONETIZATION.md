# E11 — Monetization & Entitlements

### E11-S1: Paywall Screen
**Acceptance Criteria**
- Shows Monthly/Annual plans in AUD; lists benefits (unlimited accounts/scenarios, extended projections, premium insights when live).
- “Restore Purchases” present; links to Terms/Privacy.
**Telemetry:** `paywall_view`, `paywall_cta_click {{ plan }}`.

### E11-S2: IAP Purchase Flow (iOS/Android)
**Acceptance Criteria**
- Successful purchase unlocks immediately; errors show retry/help.
**Telemetry:** `purchase_success {{ plan }}`, `purchase_error {{ code }}`.

### E11-S3: Receipt Validation Endpoint (Backend Spec)
**Acceptance Criteria**
- POST `/iap/verify` with platform, receipt; returns `{{ valid, entitlements[], expiresAt }}`.
**Data Contract**
```json
{{
  "platform": "ios|android",
  "receipt": "base64",
  "appVersion": "1.0.0"
}}
```
**Telemetry:** `receipt_verify_request`, `receipt_verify_result {{ valid }}`.

### E11-S4: Entitlement Middleware
**Acceptance Criteria**
- Centralized check gates: accounts>3, goals>2, scenarios>1.
**Telemetry:** `entitlement_check {{ feature, result }}`.

### E11-S5: Restore Purchases
**Acceptance Criteria**
- One-tap restore; shows confirmation and new expiry if applicable.

### E11-S6: Price/Copy Config
**Acceptance Criteria**
- Prices and benefits are remotely configurable (static JSON for MVP).

### E11-S7: Paywall Trigger Points
**Acceptance Criteria**
- Triggered when exceeding limits and via Settings → Upgrade.

---
