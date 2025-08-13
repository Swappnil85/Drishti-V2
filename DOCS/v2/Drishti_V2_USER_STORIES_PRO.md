# Drishti_V2 — Pro & Post‑MVP User Stories (E15–E21)
_Last updated: 2025-08-12 (AET)_

This document contains **agent‑ready stories** for the remaining epics beyond MVP: **E15 Cloud Sync (opt‑in), E16 AI Goal Advisor, E18 Advanced Scenario Planner, E19 Premium Insights, E20 Goal Templates Pack, E21 Support & Help Center**. 
Each story includes Acceptance Criteria (Gherkin style), Data Contracts, Telemetry, A11y/Perf targets, and Test Notes. These are designed to slot in after MVP stabilisation.

> **Guardrails:** Privacy-first, offline‑first baseline, deterministic math for finances, explainable AI, and clear entitlements. Pro features must not degrade Free UX.

---

## Story Template (for reference)
**Story ID & Title**  
**Context:** Why this matters and dependencies.  
**Acceptance Criteria (Given/When/Then):** Functional + loading/empty/error + a11y.  
**Data Contract:** Request/Response, interfaces, and examples.  
**Telemetry:** Event names & properties.  
**Perf/A11y:** Targets (p95, WCAG).  
**Test Notes:** Unit/UX/manual checks.

---

# E15 — Cloud Sync (Opt‑in Module, Pro add‑on)

### E15-S1: Sync Opt‑in & Settings
**Context:** Users explicitly enable sync; default remains local‑only.  
**Acceptance Criteria**
- **Given** I am Pro, **when** I open Settings → Sync, **then** I can enable “Cloud Sync (encrypted)” with an explainer and link to Privacy.
- **Given** sync is enabled, **then** a status row shows last sync time, device name, and manual “Sync Now” button.
- **Given** I disable sync, **then** the device stops exchanging data and offers to delete the remote copy.
**Telemetry:** `sync_optin_enabled/disabled`, `sync_settings_view`.
**Test Notes:** Verify opt‑in persists through relaunch; verify Free users see upsell.

### E15-S2: First‑Time Initialization (Encrypted Blob)
**Acceptance Criteria**
- On enable, app derives a per‑user key (from platform secure storage) and creates an encrypted snapshot blob for upload.
- Upload success displays last sync time; network errors show retry.
**Data Contract**
```json
{
  "deviceId": "uuid",
  "snapshotVersion": 1,
  "cipher": "XChaCha20-Poly1305",
  "payload": "base64", 
  "hash": "sha256-hex"
}
```
**Telemetry:** `sync_init_start/success/error`.
**Perf:** Snapshot creation p95 < 800ms on mid‑tier device.

### E15-S3: Delta Upload
**Acceptance Criteria**
- Local changes recorded as append‑only ops; batch upload with backoff.
- Server acknowledges with new `serverVersion` and returns rejected ops if any.
**Data Contract**
```json
{ "ops":[{"id":"...","ts":123456,"entity":"account|goal|scenario|balance","op":"upsert|delete","body":{}}] }
```
**Telemetry:** `sync_upload_batch {{ count }}`, `sync_upload_error {{ code }}`.

### E15-S4: Delta Download & Merge
**Acceptance Criteria**
- Client requests changes since `serverVersion`; merges deterministically.
- Unknown entity or older schema versions are ignored with warnings.
**Telemetry:** `sync_download_batch {{ count }}`.

### E15-S5: Conflict Resolution Policy
**Acceptance Criteria**
- CRDT‑lite: newer `ts` wins per field; tie‑break on deviceId order; deletes tombstone for 30 days.
- Conflicts surfaced in a non‑blocking “Sync Review” list.
**Telemetry:** `sync_conflict_detected {{ entity }}`.
**Test Notes:** Simulate concurrent edits on two devices.

### E15-S6: Background Sync & Retry
**Acceptance Criteria**
- Sync runs on app foreground and periodically in background (OS‑friendly interval).
- Exponential backoff on failures; battery/network aware.
**Telemetry:** `sync_background_cycle`, `sync_backoff_step`.

### E15-S7: Manual “Sync Now” & Status
**Acceptance Criteria**
- Tapping “Sync Now” triggers immediate upload/download and shows transient toast.
**Telemetry:** `sync_manual_trigger`.

### E15-S8: Device List & Last Sync
**Acceptance Criteria**
- View linked devices with last‑seen timestamp; option to revoke a device.
**Telemetry:** `sync_device_revoked`.

### E15-S9: Remote Copy Reset
**Acceptance Criteria**
- User can wipe remote state (keeps local data) with confirmation and undo within 10 minutes (grace window).
**Telemetry:** `sync_remote_reset`.

### E15-S10: Security Posture
**Acceptance Criteria**
- Keys never leave device; server stores only encrypted blobs and op logs.
- TLS + cert pinning required; fails closed if pin mismatch.
**Test Notes:** Negative tests for MITM and key loss scenarios.

---

# E16 — AI Goal Advisor (Pro)

### E16-S1: Context Builder & Redaction
**Context:** Construct a minimal, safe prompt strictly from local data.  
**Acceptance Criteria**
- Context includes: goals, balances, net‑worth baseline, 90‑day deltas; excludes names/emails/PII.
- Redaction verified by unit tests; max token budget enforced.
**Telemetry:** `ai_context_built {{ tokens }}`.

### E16-S2: Generate ≤3 Suggestions
**Acceptance Criteria**
- System requests up to 3 concise suggestions with an estimated impact (time to goal, delta vs baseline) and confidence (low/med/high).
- Empty state if no meaningful suggestions.
**Data Contract (internal)**
```json
[{"title":"Cut $50/mo","impactMonths":-2,"confidence":"med","action":"increase_savings","params":{"amount":50}}]
```
**Telemetry:** `ai_suggestions_shown {{ count }}`.

### E16-S3: One‑Tap Apply & Undo
**Acceptance Criteria**
- Tapping a suggestion creates/edits the related goal/scenario; an inline diff shows the change; undo fully reverts.
**Telemetry:** `ai_apply_clicked {{ action }}`, `ai_apply_undo`.

### E16-S4: Explainability
**Acceptance Criteria**
- “Why this suggestion?” reveals the inputs used and simple math behind the impact estimate.
**Telemetry:** `ai_explain_open`.

### E16-S5: Guardrails & Safety
**Acceptance Criteria**
- No prescriptive financial advice; use neutral language and disclaimers.
- Hard caps on changes (e.g., savings rate ±0–50%); never suggest credit products.
**Test Notes:** Red team prompts; ensure no PII leaks.

### E16-S6: A/B Enablement & Telemetry
**Acceptance Criteria**
- Feature flag for advisor; record CTR, apply rate, undo rate, and next‑day retention deltas.
**Telemetry:** `ai_flag_variant`, `ai_ctr`, `ai_apply_rate`.

### E16-S7: Offline/No‑AI Fallback
**Acceptance Criteria**
- If AI unavailable, show deterministic “Tips” derived from baseline heuristics.

---

# E18 — Advanced Scenario Planner (Pro)

### E18-S1: Multi‑Scenario Library (CRUD)
**Acceptance Criteria**
- Create, duplicate, archive scenarios; tag and rename.
- No limit for Pro; Free remains 1 (gated).
**Telemetry:** `scenario_lib_create/duplicate/archive`.

### E18-S2: 3–5 Year Projection Model
**Acceptance Criteria**
- Toggle inflation (default 2–3%) and compounding (monthly); supports step changes and one‑off events.
**Data Contract**
```ts
interface ScenarioAdvanced {{ years: 3|4|5; inflationPct?: number; compounding: "monthly"|"quarterly"; events: Event[] }}
```
**Telemetry:** `scenario_advanced_generated {{ years }}`.

### E18-S3: Comparison Matrix & Overlay
**Acceptance Criteria**
- Compare up to 3 scenarios; table (key metrics) + overlay chart; export summary.
**Telemetry:** `scenario_compare_view`.

### E18-S4: Export Scenario Summary (PDF/CSV)
**Acceptance Criteria**
- Shareable summary with assumptions, key outcomes, and month‑12/year‑3 deltas.
**Telemetry:** `scenario_export {{ format }}`.

### E18-S5: Performance on Large Ranges
**Acceptance Criteria**
- Render p95 < 900ms for 60 data points per series; virtualize where needed.

### E18-S6: Unit Tests & Edge Cases
**Acceptance Criteria**
- Negative balances, variable income, large lump sums, currency mixes covered.

---

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

# E20 — Goal Templates Pack (Add‑on)

### E20-S1: Template Definitions
**Acceptance Criteria**
- Templates: FIRE, First Home, Debt Snowball, Travel; each defines defaults (target, horizon, linked types).
**Data Contract**
```json
{ "id":"debt_snowball","title":"Debt Snowball","defaults":{"targetMonths":12,"linkedTypes":["debt"]} }
```

### E20-S2: Catalog UI & Preview
**Acceptance Criteria**
- Gallery with short descriptions and preview of resulting goal; accessible list/grid.

### E20-S3: One‑Tap Apply & Edit
**Acceptance Criteria**
- Creates a valid goal in < 5s; user can adjust immediately.
**Telemetry:** `template_apply {{ id }}`.

### E20-S4: Entitlement & Pricing
**Acceptance Criteria**
- Pack included in Pro; otherwise purchasable as add‑on (if enabled).
**Telemetry:** `template_entitlement_block`.

### E20-S5: Localisation & Copy
**Acceptance Criteria**
- Copy ready for future localisation; avoid region‑specific assumptions.

---

# E21 — Support & Help Center (Pro enablement)

### E21-S1: FAQ Content System
**Acceptance Criteria**
- Markdown‑based FAQs with categories and anchors; offline cached.
**Telemetry:** `faq_view {{ topic }}`.

### E21-S2: Searchable Help
**Acceptance Criteria**
- Local search across FAQ titles and content; highlights and anchors to sections.
**Telemetry:** `faq_search {{ query }}`.

### E21-S3: Contact Form (Email/Webhook)
**Acceptance Criteria**
- Users submit a ticket with category, device, app version; success/fail states; respects offline (queues send).
**Data Contract**
```json
{ "category":"billing|bug|idea","message":"...", "appVersion":"1.1.0", "device":"..." }
```
**Telemetry:** `support_ticket_submit {{ category }}`, `support_ticket_error {{ code }}`.

### E21-S4: Pro SLA Indicator
**Acceptance Criteria**
- If user is Pro, show “Priority support: <target SLA>” on contact screen.
**Telemetry:** `support_pro_sla_view`.

### E21-S5: Quick Feedback (Thumbs/Comment)
**Acceptance Criteria**
- Inline “Was this helpful?” on FAQs; collect short comment.
**Telemetry:** `faq_feedback {{ helpful }}`.

### E21-S6: Offline Help Fallback
**Acceptance Criteria**
- If fully offline, show cached FAQs and queue contact drafts for later send.

---

## Cross‑Cutting NFRs (apply to all Pro stories)
- **Privacy & Security:** No PII in analytics; AI pipeline redacts; keys never leave device; TLS+pinning for any network.
- **Performance:** p95 interaction < 1s; background jobs cooperative with OS.
- **Accessibility:** WCAG 2.1 AA; screen reader labels; 44px targets.
- **Observability:** Success/error events for every networked action; crash traces tied to app version/build.
- **Entitlements:** Clear gating; graceful paywall prompts; never lose local data when trials expire.

---

## Assumptions & Interfaces (subject to change)
- **Sync backend** is a thin store for encrypted blobs + op logs; no server‑side reads of cleartext.
- **Advisor** uses small prompts and deterministic helpers for math; no financial advice or product recommendations.
- **Insights** are computed locally; cloud compute is **not** required for MVP+Pro v1.
- **Templates** ship as JSON; remote config may add new templates later.
- **Help Center** can start as email/webhook and later integrate a ticketing system.

---

## Acceptance Checklist for Pro Stories
- AC pass including error/empty/loading + a11y states.
- Telemetry present for success/error/CTA events.
- No new P0/P1 defects; unit tests for logic; device manual checks.
