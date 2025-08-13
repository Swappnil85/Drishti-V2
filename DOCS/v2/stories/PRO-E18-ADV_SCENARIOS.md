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
