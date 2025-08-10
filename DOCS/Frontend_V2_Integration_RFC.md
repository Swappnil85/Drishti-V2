## Drishti Frontend V2 Integration RFC

### Summary

This RFC documents how we will adapt the proposed UI in DOCS/Design_Update to the existing React Native (Expo) mobile app and wire it to the Fastify backend. It maps web-only libraries to mobile equivalents, defines new backend endpoints, outlines a phased plan, testing strategy, acceptance criteria, and references visual guidance from DOCS/Screenshots.

### References

- UI prototype source: DOCS/Design_Update
- Visual references: DOCS/Screenshots (use for colors, spacing, typography cues)
- Mobile app: apps/mobile (Expo + React Native + Reanimated + victory-native + RN Vector Icons)
- Backend: apps/api (Fastify + TypeScript)

---

## 1) Design → Implementation Mapping

- Tailwind-like classes → React Native StyleSheet + ThemeContext (existing)
- recharts → victory-native (Line chart with target line; enlarge touch radius for mobile tooltips)
- framer-motion → React Native Reanimated transitions (screen crossfade/slide)
- lucide-react → react-native-vector-icons (Ionicons set already used in tabs)

Screens mapping (from prototype → RN):

- Home → Dashboard: NetWorthCard (+12m chart), Streaks & Wins, Quick Actions, Offline banner
- Accounts: AccountsList + AccountDetail (+small 12m chart)
- Plan: Contribution slider + feasibility meter
- Scenarios: Scenarios list + Compare (calculate projections)
- Settings: Security, Connectivity (offline), Palette/Theme toggles

Navigation

- Use existing MainTabNavigator: Dashboard, Accounts, Goals (Plan), Scenarios, Settings

State/Services

- Offline: apps/mobile/src/services/sync/OfflineService.ts
- Biometrics: apps/mobile/src/services/auth/BiometricService.ts
- Security/Pinning: apps/mobile/src/services/api/PinnedAxios.ts + security services
- Local data: WatermelonDB; NetWorthService provides derived metrics

---

## 2) Backend Integration

Use existing endpoints and add focused Net Worth endpoints.

Existing

- Accounts
  - GET /v2/financial/accounts
  - GET /v2/financial/accounts/:id
  - POST/PUT/DELETE for creation/updates
- Goals (Plan)
  - GET/POST/PUT /v2/financial/goals
- Scenarios
  - GET/POST/PUT/DELETE /v2/financial/scenarios
  - POST /v2/financial/scenarios/:scenarioId/calculate

New (implemented now)

- GET /v2/financial/networth/summary
  - Returns: { total_assets, total_liabilities, net_worth, accounts_by_type }
- GET /v2/financial/networth/trends?months=12
  - Returns: [{ month: 'Jan', value: number, target?: number }]

Notes

- Auth: All routes behind JWT (Fastify preHandler already in financial.ts)
- Offline: Mobile falls back to NetWorthService (local) when offline or endpoints unavailable

---

## 3) Data Contracts (Minimal)

Net Worth Summary

- total_assets: number
- total_liabilities: number
- net_worth: number
- accounts_by_type: Record<string, { count: number; balance: number }>

Net Worth Trends (12 months)

- month: string (Jan..Dec)
- value: number | null (actuals; null for future months)
- target: number (optional, for target line)

Accounts List Item

- { id, name, account_type, institution, balance, currency, is_active }

Goal (Plan primary)

- { id, name, target_amount, target_date, monthly_contribution, status }

Scenario

- { id, name, parameters, projections?: {...} }

---

## 4) Theming & Visuals

- Source visual guidance from DOCS/Screenshots; replicate layout, spacings, typographic scale, and iconography
- Extend ThemeContext with a "sun" palette (light yellow variant) used in the prototype
  - sun.palette guidance (from screenshots): background: #ffff00 where appropriate; adjust contrast for text & borders
- Keep existing dark theme; support toggling in Settings
- Component primitives: Card, Section, RingProgress (RN implementation), Tab styling consistent with screenshots

Accessibility

- Ensure adequate contrast in "sun" palette
- Larger tap targets for chart points and quick actions
- Screen reader labels on important UI controls

---

## 5) Phased Plan

Phase 0: RFC + tokens

- Document mapping (this RFC) and define initial theme tokens from screenshots

Phase 1: Dashboard (Home) spike

- Build NetWorthCard with victory-native chart (Actual vs Target)
- Add Offline banner, Streaks & Wins (local heuristics), Quick Actions
- Hooks: useNetWorthSummary + useNetWorthTrends implemented in mobile and integrated with NetWorthDashboard

Phase 2: Accounts

- Wire AccountsList/Detail to /v2/financial/accounts
- Add small 12m account chart (computed client-side initially)

Phase 3: Plan & Scenarios

- Plan: Hook to goals API; implement contribution slider + feasibility indicator
- Scenarios: List + Compare (calculate projections)

Phase 4: Net Worth API

- Implement GET /v2/financial/networth/summary and /trends with tests (DONE)
- Wire Dashboard chart and summary to server endpoints (fallback to local) (IN PROGRESS)

Phase 5: Settings integration & polish

- Security toggles (biometrics, auto-lock), Offline toggle, Theme/Palette

Phase 6: QA, tests, docs, PR

- Raise coverage and finalize docs/PR

---

## 6) Testing Strategy (toward 80% coverage)

Mobile (Jest + @testing-library/react-native)

- Dashboard components (NetWorthCard, Streaks & Wins, Quick Actions)
- Accounts list/data hooks; Settings toggles
- Theme toggling and palette rendering

API (Jest + Supertest)

- Net worth endpoints (summary, trends): happy paths, validation, auth failures
- Regression around auth guards for financial routes

---

## 7) Risks & Mitigations

- Web-only libs from prototype: mitigated by RN equivalents (victory-native, Reanimated, vector-icons)
- No persisted balance history: start with derived trends; add history schema later if needed
- Performance on charts: use memoization, limit point counts, compact tooltips
- Visual match to screenshots: implement palette tokens and spacing scale early; iterate with screenshots open

---

## 8) Acceptance Criteria

- Home (Dashboard) mirrors prototype: net worth card + 12m chart, target line, larger tap targets, offline banner, streaks & quick actions
- Accounts list/detail wired to API; detail shows small chart
- Plan screen: slider + feasibility states
- Scenarios: list + compare, calls calculate
- Settings: security, offline, theme/palette working
- New net worth endpoints implemented and tested; Dashboard uses them when online
- Accessibility: tappable areas and labels adjusted for mobile
- Documentation updated; tests added; coverage trending toward 80%

---

## 9) Decisions (from stakeholder)

- Implement Net Worth server endpoints now (not just client-side derivation)
- Streaks & Wins: Begin with local heuristics now; plan small Achievements API next phase if needed
- Visual tokens guided by DOCS/Screenshots

---

## 10) Progress & Pending

- DONE: Backend net worth endpoints (summary, trends) + tests
- DONE: Dashboard Home spike updated with Offline banner, NetWorthDashboard, and Quick Actions
- DONE: Implemented useNetWorthSummary/useNetWorthTrends hooks; integrated summary into NetWorthDashboard
- DONE: Wired NetWorthTrendsChart to useNetWorthTrends; Home Streaks & Wins uses computed monthly changes
- DONE: Accounts details wired to API; Accounts list local-first with server refresh and reconciliation
- DONE: Sparkline component + useAccountSparkline hook (reads BalanceHistory, with fallback)
- DONE: Settings “sun” palette implemented with toggle
- DONE: Initial tests (Net Worth hooks, Streaks & Wins, AccountSparkline, Settings)
- PENDING: Expand reconciliation tests; per-account trend data; coverage toward 80%

---

## 11) Immediate Next Steps

- Expand tests for reconciliation and Dashboard components; track coverage
- Polish sun palette according to DOCS/Screenshots and contrast guidelines
- Evaluate backend support for per-account trends; otherwise enhance local history capture
