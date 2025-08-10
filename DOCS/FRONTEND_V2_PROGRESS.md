## Frontend V2 Progress & Checklist

Updated: August 2025

### Scope
Track progress on adapting DOCS/Design_Update to RN app and wiring backend.

### Completed
- RFC: DOCS/Frontend_V2_Integration_RFC.md created
- Backend: Net Worth endpoints implemented with tests
  - GET /v2/financial/networth/summary
  - GET /v2/financial/networth/trends
- Mobile: Home screen spike updated (Offline banner, NetWorthDashboard, Quick Actions)
- Mobile: Hooks created and integrated
  - useNetWorthSummary (wired to API with offline fallback)
  - useNetWorthTrends (client hook to new trends endpoint)
- Mobile: NetWorthDashboard uses useNetWorthSummary
- Mobile: Added HomeStreaksWins component (local heuristics) on Home

### In Progress
- Wire NetWorthTrendsChart to useNetWorthTrends and feed HomeStreaksWins actual monthly data

### Pending
- Accounts: Wire list/detail to /v2/financial/accounts; small 12m chart
- Plan & Scenarios: Hook to goals and scenarios endpoints; add projections call
- Settings: Add "sun" palette per DOCS/Screenshots; palette toggle
- Tests: RTL tests for hooks/components; API tests; restore coverage toward 80%

### Notes
- Visual guidance from DOCS/Screenshots; adjust palette for contrast
- Offline: hooks fall back to NetWorthService; ensure graceful UI when offline
- Security: API calls include Authorization header; pinning guard enforced

