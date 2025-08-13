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
