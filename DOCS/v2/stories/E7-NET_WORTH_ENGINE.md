# E7 — Net Worth & Calc Engine (12‑month)

### E7-S1: Aggregate Current Net Worth
**Acceptance Criteria**
- Net worth = sum(assets) − sum(liabilities) at latest balance per account.
- Rounding to cents; display to 2 decimals.
**Telemetry:** `networth_recompute`.

### E7-S2: Generate 12‑Month Baseline
**Acceptance Criteria**
- If ≥2 months of history: baseline uses 3‑month rolling average delta per account.
- If insufficient history: flat line using current balance.
**Data Contract**
```ts
interface NetWorthPoint {{ month: string /* YYYY-MM */, value: number }}
```
**Telemetry:** `nw_baseline_generated {{ method:"avg3m"|"flat" }}`.

### E7-S3: Reactivity & Caching
**Acceptance Criteria**
- Changing accounts/goals triggers recompute in ≤200ms; cached results reused until invalidated.

### E7-S4: Currency-Safe Math Utilities
**Acceptance Criteria**
- Sum/multiply using integer cents to avoid FP drift; 100% unit test coverage.

### E7-S5: Delta Summary Card
**Acceptance Criteria**
- Show month‑12 delta vs month‑0; arrow up/down with a11y text.
**Telemetry:** `nw_delta_viewed`.

### E7-S6: Unit Test Suite
**Acceptance Criteria**
- Cover edge cases (no data, single account, negative balances, mixed currencies).

---
