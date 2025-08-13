# E19 — Premium Insights (Pro)

### E19-S1: Monthly Aggregation Job
**Acceptance Criteria**
- Aggregate balances and net changes by account/goal; store rolling 3/6/12‑month stats.
**Telemetry:** `insights_job_run`.

### E19-S2: Anomaly Detection
**Acceptance Criteria**
- Flag months with deltas beyond threshold (e.g., >2σ vs 6‑month mean); suppress noisy series.
**Telemetry:** `insight_anomaly_flagged`.
**Test Notes:** Synthetic fixtures for spikes/drops.

### E19-S3: Insight Cards (Templates)
**Acceptance Criteria**
- Card types: “You’re trending +X/mo”, “Goal at risk”, “Unusual drop”, “Milestone soon” with clear actions.
**Telemetry:** `insight_card_shown {{ type }}`, `insight_card_cta_click`.

### E19-S4: Monthly Digest (Shareable)
**Acceptance Criteria**
- Generate a one‑page digest (PDF/CSV) summarising key trends and actions; share sheet integration.
**Telemetry:** `insight_digest_generated/shared`.

### E19-S5: Signal Quality & Feedback
**Acceptance Criteria**
- Users can rate an insight (useful/not); low‑quality cards get suppressed.
**Telemetry:** `insight_feedback {{ useful }}`.

### E19-S6: Scheduling & Notifications
**Acceptance Criteria**
- Digest generated on the 1st of month (local time) if app opened in last 30 days; respectful notification.

---
