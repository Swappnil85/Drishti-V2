> This is the current Drishti V2 source of truth. Changes here govern implementation.

# Frontend V2 – Epics (MVP)

## V2-01 Foundations
- Objective: Establish app shell, token storage, API client adapter, baseline testing hooks.
- Definition of Done:
  - App shell routes/screens defined on paper; no code yet.
  - Token storage model and refresh logic specified.
  - API client adapter contract drafted, error mapping table documented.
  - Test strategy (RTL + basic E2E), CI smoke outline in docs.
- Acceptance Criteria:
  - Docs: adapter interface and error taxonomy, storage schema, navigation map.
  - Checklists for testing and CI hooks.
- Non-Goals: Implementing UI or network code.

## V2-02 Auth
- Objective: Reliable sign-in/out and session renewal.
- DoD:
  - Flows documented: sign-in, token store/renew, sign-out, error states.
  - Edge cases: 401/403 handling, network failure, invalid token.
- Acceptance Criteria:
  - Explicit flow charts and state table in USER_STORIES.md.
  - Test cases list for happy/sad paths.
- Non-Goals: Social login, multi-factor beyond minimal dev path.

## V2-03 Dashboard (Net Worth RO)
- Objective: Read-only net worth display with deltas and sparkline (if data).
- DoD:
  - Data shape documented; empty/loading/error specs.
  - A11y labels and formatting rules documented.
- Acceptance Criteria:
  - Net worth value, daily/weekly delta, optional 12-month sparkline.
  - Clear placeholders for empty state; error retry guidance.
- Non-Goals: Drill-downs, editing, advanced charts.

## V2-04 Accounts (List/Detail RO)
- Objective: Read-only accounts list and detail.
- DoD:
  - Pagination/filter behavior documented; sorting rules defined.
  - Detail fields: name, balance, last updated; a11y & formatting notes.
- Acceptance Criteria:
  - List stable ordering; detail matches backend fields.
  - Loading/empty/error states with copy.
- Non-Goals: Mutations, create/update/delete, offline.

## Epic labels
- v2-01-foundations
- v2-02-auth
- v2-03-dashboard
- v2-04-accounts

