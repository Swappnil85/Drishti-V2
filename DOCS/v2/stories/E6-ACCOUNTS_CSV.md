# E6 — Accounts: Manual + CSV Import

### E6-S1: Create Account (Manual)
**Acceptance Criteria**
- Types: cash, savings, investment, property, debt (liability), other.
- Required: name, type, currency; optional: opening balance & date.
- Appears in Accounts list and affects Net Worth.
**Data Contract**
```ts
interface Account {{ id: string; name: string; type: "cash"|"savings"|"investment"|"property"|"debt"|"other"; currency: string; }}
interface BalancePoint {{ date: string; amount: number; }}
```
**Telemetry:** `account_create {{ type, currency }}`.

### E6-S2: Edit/Delete Account
**Acceptance Criteria**
- Cannot delete if used by a goal without confirmation that progress may change.
**Telemetry:** `account_delete {{ id }}`.

### E6-S3: Accounts List w/ Empty & Error States
**Acceptance Criteria**
- Sorted by impact on net worth; search/filter by type & currency.

### E6-S4: Account Detail & Balance History
**Acceptance Criteria**
- Show latest balance, 12-month history sparkline; add/edit/remove balance points.
**Telemetry:** `balance_add/edit/delete`.

### E6-S5: CSV Import — File Picker & Preview
**Acceptance Criteria**
- Accepts `.csv`; preview first 50 rows; pick column mapping for date/amount/account.
- Detects delimiter (`,`/`;`/`\t`), date formats (ISO, D/M/Y, M/D/Y). Shows validation counts.
**Telemetry:** `csv_import_start`, `csv_preview_loaded {{ rows }}`.

### E6-S6: CSV Import — Mapping & Validation
**Acceptance Criteria**
- User maps columns; app validates date parse and number parse; shows errors and allows fix.
**Telemetry:** `csv_mapping_confirmed`.

### E6-S7: CSV Import — Duplicate/Overlap Detection
**Acceptance Criteria**
- If an imported row matches existing (same date & account), mark as duplicate; allow skip/replace.
**Telemetry:** `csv_duplicates_detected {{ count }}`.

### E6-S8: CSV Import — Commit & Report
**Acceptance Criteria**
- Import 200 rows < 5s on mid-tier device; success/fail report with counts.
**Telemetry:** `csv_import_complete {{ inserted, skipped, failed }}`.

### E6-S9: Saved Mapping Presets
**Acceptance Criteria**
- Save mapping by filename/domain; auto-suggest next time.
**Telemetry:** `csv_mapping_preset_saved/used`.

### E6-S10: Multi-Currency Display
**Acceptance Criteria**
- Display native currency on account; convert to profile currency for Net Worth using static rate table (stub for MVP).
**Data Contract**
```ts
interface Rate {{ base: string; quote: string; rate: number; asOf: string }}
```
**Telemetry:** `fx_rate_used {{ pair }}`.

### E6-S11: Entitlement Checks for Free Tier
**Dependencies:** E11.  
**Acceptance Criteria**
- Free users can create up to 3 accounts; exceeding prompts paywall.
**Telemetry:** `entitlement_block {{ feature:"accounts" }}`.

### E6-S12: Accessibility & Performance
**Acceptance Criteria**
- Large tap targets; table rows readable in dark mode; p95 list render < 500ms.

---
