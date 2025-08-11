> This is the current Drishti V2 source of truth. Changes here govern implementation.

# Frontend V2 – Product Requirements (PRD)

## Goals
- Ship a reduced, reliable MVP fast with a clean foundation
- Keep backend contracts unchanged; add a thin client adapter only
- Establish a testable baseline (unit + smoke) with clear accessibility and error states

## Non-Goals
- No mutations beyond sign-in/sign-out
- No offline/WatermelonDB for MVP
- No advanced charts, exports, or bulk account operations

## MVP Scope
- Auth & session: sign-in (dev path OK), token store/renew, sign-out, error states
- Dashboard: Net worth card (value, daily/weekly delta, 12-month sparkline if data; loading/empty/error; accessible labels)
- Accounts: List (pagination/filter) and read-only detail (name, balance, last updated)
- Settings (MVP): sign-out, theme toggle

## Assumptions
- Backend APIs are stable for ≥ 4–6 weeks
- Online-only is acceptable for MVP
- Currency: USD returned by backend for MVP (multi-currency later)
- Accessibility: basic screen reader labels and roles required

## Constraints
- No frontend scaffolding until this PRD and Epics are approved
- Keep code confined to apps/mobile-v2/ only after approval; no backend changes
- Testing must reach ≥ 80% on new code when we start implementing

## Acceptance Criteria
- Auth: successful sign-in with stored token and automatic refresh; proper 401 handling and sign-out
- Dashboard: shows total net worth with delta; sparkline for 12 months if data else caption; loading/empty/error states covered
- Accounts: paginated list with stable ordering; read-only detail shows name, balance, last updated
- Settings: sign-out and theme toggle persist across app restarts
- A11y: labels on interactive elements; color contrast within theme tokens

## Risks
- Backend shape inconsistencies (numbers vs strings) → mitigated in client adapter
- Scope creep from deferred features → enforce parity checklist
- Timeline impact if offline or mutations are pulled into MVP

## Out-of-Scope
- Streaks & Wins, Quick Actions/mutations, Offline sync, Exports, Advanced charts

## Metrics / Success
- MVP shipped within 4–6 weeks from implementation start
- Crash-free sessions ≥ 99% (post-ship)
- ≥ 80% test coverage on V2 codebase

## Rollout
- Parallel development; V1 stays archived
- Internal UAT; staged release with rollback plan (see Cutover)

## Open Questions
1. Do we require offline read for Accounts in MVP?
2. Which auth method for dev login (email+password vs OTP vs stub)?
3. Is multi-currency display required in MVP or locked to USD?
4. Do we need analytics/telemetry in MVP (if yes, which provider)?
5. What minimum OS versions do we target for mobile?
6. Any compliance items (pinning/device integrity) mandated for MVP?
7. Should the sparkline period be fixed (12 months) or configurable?
8. Are there SLA/SLOs to surface for error messaging (rate limits, retry-after)?

