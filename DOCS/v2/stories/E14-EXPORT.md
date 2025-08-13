# E14 — Export & Sharing

### E14-S1: Export Accounts to CSV
**Acceptance Criteria**
- Exports schema: accountId, name, type, currency, latestBalance, asOf.
**Telemetry:** `export_accounts_csv`.

### E14-S2: Export Goals to CSV
**Acceptance Criteria**
- Exports: goalId, title, targetAmount, targetDate, progressPct, linkedAccounts[].

### E14-S3: System Share Sheet
**Acceptance Criteria**
- Share exported file via OS share; accessible labels.

### E14-S4: Locale & File Naming
**Acceptance Criteria**
- Filename pattern `drishti-{entity}-{YYYYMMDD}.csv`; numbers/date localized.

---
