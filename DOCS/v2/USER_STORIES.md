> This is the current Drishti V2 source of truth. Changes here govern implementation.

# Frontend V2 – MVP User Stories

## V2-01 Foundations
1) Define API client adapter contract
- As a developer, I want a documented adapter interface and error mapping so I can handle backend responses consistently.
- Acceptance:
  - Adapter methods and response shapes documented
  - Error taxonomy (network, auth, validation, server) documented with mapping
  - Validation notes: n/a (docs only)
  - A11y: n/a

2) Token storage and refresh spec
- As a developer, I need a token storage/refresh flow spec so sessions are reliable.
- Acceptance:
  - Storage schema and refresh triggers documented
  - 401/refresh failure flow documented
  - Validation: loading/error states described
  - A11y: n/a

3) Navigation map (screens/routes)
- As a developer, I want a screen+route map so we align on MVP navigation.
- Acceptance:
  - Draft map for Auth, Dashboard, Accounts List, Account Detail, Settings
  - Validation: none (docs)
  - A11y: ensure headings/roles planned

## V2-02 Auth
1) Sign-in (dev path) flow spec
- As a user, I can sign in via the dev path and start a session.
- Acceptance:
  - Inputs, validation rules, and success/failed outcomes
  - Error states for invalid creds, network fail, server error
  - Validation: loading/error states covered
  - A11y: labels for inputs, error messaging announced

2) Token renewal policy
- As a user, my session renews seamlessly until I sign out.
- Acceptance:
  - Refresh trigger thresholds and background refresh documented
  - 401 retry/redirect rules
  - Validation: simulate expired/invalid token paths
  - A11y: n/a

3) Sign-out behavior
- As a user, I can sign out and clear my session.
- Acceptance:
  - Token cleared, secure return to Auth screen
  - Post sign-out navigation and messaging
  - Validation: error state if clearing fails, retry guidance
  - A11y: focus returns to first actionable element

## V2-03 Dashboard (Net Worth RO)
1) Net worth card (value + delta)
- As a user, I see my total net worth and change (daily/weekly).
- Acceptance:
  - Value formatting, delta with direction and color token usage
  - Loading placeholder, empty state copy, error with retry guidance
  - Validation: loading/empty/error captured
  - A11y: announce value and delta; non-color cues present

2) Net worth sparkline (12-month)
- As a user, I see a 12-month sparkline when data exists.
- Acceptance:
  - Shows 12 months; hides chart if insufficient data and shows caption
  - Validation: empty/error states; loading skeleton
  - A11y: text alternative summarizing trend

3) Accessibility tokens and labels
- As a user using assistive tech, I can understand the dashboard content.
- Acceptance:
  - Labels/roles for card elements; contrast requirements noted
  - Validation: a11y notes included
  - A11y: explicit

## V2-04 Accounts (List/Detail RO)
1) Accounts list (pagination/filter)
- As a user, I can browse my accounts with basic pagination and filter.
- Acceptance:
  - Stable ordering, page size default, filter fields documented
  - Loading placeholder, empty copy, error with retry
  - Validation: loading/empty/error covered
  - A11y: list semantics and labels

2) Account detail (read-only)
- As a user, I can view details of an account.
- Acceptance:
  - Fields: name, balance, last updated
  - Loading placeholder, error copy
  - Validation: loading/error covered
  - A11y: content landmarks and labels

3) Settings: sign-out & theme toggle
- As a user, I can sign out and toggle theme.
- Acceptance:
  - Sign-out clears token; theme persists across app restarts
  - Error state guidance
  - Validation: state persistence described
  - A11y: toggle has accessible name and state

