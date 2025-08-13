# Drishti_V2 — MVP User Stories (E4–E14, E17)
_Last updated: 2025-08-12 (AET)_

This document contains the **full set of executable user stories** for the Drishti_V2 MVP. Each story includes Acceptance Criteria (Gherkin), Data Contracts, Telemetry, A11y/Perf, and Test Notes. Stories are grouped by Epic.

> **MVP Epics** covered here: **E4 Navigation & Core UI, E5 Onboarding/Settings, E6 Accounts + CSV Import, E7 Net Worth Engine, E8 Goals, E9 Scenario Planner (Basic), E10 Data Viz & A11y, E11 Monetization & Entitlements, E12 Telemetry & Observability, E13 Privacy & Security Hardening, E14 Export & Sharing, E17 Store Readiness & Release Ops.**

---

## Story Template (for reference)

**Story ID & Title**  
**Context:** Why this matters and dependencies.  
**Acceptance Criteria (Given/When/Then):** Functional + loading/empty/error + a11y.  
**Data Contract:** Request/Response, interfaces, and examples.  
**Telemetry:** Event names & properties.  
**Perf/A11y:** Targets (p95, WCAG).  
**Test Notes:** Unit/UX/manual checks.

---

# E4 — Navigation & Core UI Framework

### E4-S1: Bottom Tab Navigation Shell
**Context:** Establish the app skeleton so all features can snap in consistently.  
**Acceptance Criteria**
- **Given** the app is installed, **when** I open it, **then** I see a bottom tab bar with: Home, Accounts, Plan, Scenarios, Settings.
- **Given** I tap a tab, **when** navigation occurs, **then** the target screen loads within 300ms p95 and the active tab is highlighted.
- **Given** system is in dark mode, **then** tab bar and icons follow the theme.
- **Given** VoiceOver/TalkBack is on, **then** each tab has a readable label and role.
**Data Contract**
```ts
type TabKey = "home" | "accounts" | "plan" | "scenarios" | "settings";
interface NavState { activeTab: TabKey; }
```
**Telemetry:** `nav_tab_click {{ tab }}`.  
**Perf/A11y:** p95 tab switch < 300ms; WCAG 2.1 AA color contrast.  
**Test Notes:** Snapshot nav structure; device tests on iOS/Android; screen reader pass.

### E4-S2: Global Theming (Light/Dark + Tokens)
**Context:** Provide consistent design tokens for colors, spacing, typography, and states.  
**Acceptance Criteria**
- Token set exposes semantic roles (bg/surface/primary/critical/success/warn/text-muted, etc.).
- System theme auto-detected; manual override persists.
- Prefers-reduced-motion reduces animations >= 80%.
**Data Contract**
```ts
interface ThemePrefs {{ mode: "system"|"light"|"dark"; reducedMotion: boolean }}
```
**Telemetry:** `theme_change {{ mode }}`, `motion_pref_detected`.  
**Perf/A11y:** No jank on toggle; contrast AA+.  
**Test Notes:** Contrast checker; motion audit.

### E4-S3: Common Skeleton/Loading/Empty/Error Components
**Context:** Uniform UX for async states and empty data.  
**Acceptance Criteria**
- Components: `<Skeleton>`, `<EmptyState>`, `<ErrorState>` reusable with icon/title/cta.
- Used by Dashboard, Accounts, Goals, Scenarios.
**Telemetry:** `error_view_shown {{ screen, code }}`.  
**Test Notes:** Snapshot and RTL tests; integration usage checks.

### E4-S4: Modal/Sheet & Toast System
**Acceptance Criteria**
- Sheet supports drag-to-close and focus trapping.
- Toasts stack, auto-dismiss, accessible live region.
**Telemetry:** `toast_shown {{ kind }}`.  
**A11y:** ARIA roles & escape to close.  

### E4-S5: Haptics & Feedback
**Acceptance Criteria**
- Light haptics on primary actions and success states; none in reduced-motion.
**Test Notes:** Device-level verification.

### E4-S6: Safe Area, Insets, and Keyboard Handling
**Acceptance Criteria**
- No clipped content on devices with notches; keyboard avoids inputs properly.

### E4-S7: Global Date/Number/Currency Formatting
**Acceptance Criteria**
- AUD default; can display other currencies on Accounts.
**Data Contract**
```ts
formatCurrency(amount: number, currency: string="AUD"): string;
```

### E4-S8: Deep Link Routing (Basic)
**Acceptance Criteria**
- `drishti://paywall` opens Paywall; `drishti://accounts` opens Accounts list.
**Telemetry:** `deeplink_open {{ path }}`.

### E4-S9: Error Boundary
**Acceptance Criteria**
- Global boundary shows friendly retry UI and sends crash report.

### E4-S10: Accessibility Baseline
**Acceptance Criteria**
- 44px min touch targets, labels on controls, focus order logical.
**Test Notes:** Screen reader checklist per screen.

---

# E5 — Onboarding, Profile & Settings

### E5-S1: Onboarding Flow (5 steps + Resume)
**Context:** Fast path to value; resumable.  
**Acceptance Criteria**
- Steps: Welcome → Currency → Privacy Mode → Sample Data (optional) → Done.
- Progress indicator; can skip non-critical steps; resume after app relaunch.
**Telemetry:** `onboarding_start`, `onboarding_step {{ step }}`, `onboarding_complete`.
**Perf:** Full flow ≤ 3 minutes.  
**Test Notes:** Kill app mid-flow; resumes to last step.

### E5-S2: Currency & Locale Preference
**Acceptance Criteria**
- Choose currency (default AUD). Persists to profile.
**Data Contract**
```ts
interface Profile {{ currency: string; theme: "system"|"light"|"dark"; privacyLocalOnly: boolean }}
```
**Telemetry:** `pref_currency_set {{ currency }}`.

### E5-S3: Privacy Mode Toggle (Local-Only)
**Acceptance Criteria**
- Toggle stores data only on device; disables cloud sync surfaces.
- Shows explainer and link to Privacy Statement.
**Telemetry:** `privacy_local_only_enabled`.

### E5-S4: Theme Preference & Reduced Motion
**Acceptance Criteria**
- Manual override of system theme persists; motion reduced per OS setting.

### E5-S5: Security Settings (PIN/Biometrics enable)
**Dependencies:** E2, E13.  
**Acceptance Criteria**
- Set 4–6 digit PIN; enable biometric unlock if supported.
- App locks after inactivity (configurable 1–10 minutes).
**Telemetry:** `pin_set`, `biometric_enabled`, `auto_lock_triggered`.

### E5-S6: Manage Sample Data
**Acceptance Criteria**
- Load or clear sample data for demo; flagged in UI.
**Telemetry:** `sample_data_load`, `sample_data_clear`.

### E5-S7: Settings Screen Information
**Acceptance Criteria**
- Version/build, T&Cs/Privacy links, contact support link (deep link stub).

### E5-S8: First-Run Nudge to Add Account
**Acceptance Criteria**
- After onboarding, if zero accounts, show CTA card on Home.
**Telemetry:** `nudge_add_account_shown/clicked`.

---

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

# E8 — Goals (Free tier: up to 2)

### E8-S1: Create Goal
**Acceptance Criteria**
- Fields: title, targetAmount, targetDate, optional linked accounts (multi-select).
- Progress % auto from linked accounts; manual mode when none linked.
**Telemetry:** `goal_create`.

### E8-S2: Edit/Delete Goal & Recalc
**Acceptance Criteria**
- Edits immediately recalc progress and estimated finish date.

### E8-S3: Goal Milestones & Badges
**Acceptance Criteria**
- Badges at 25/50/75/100%; announce via accessible toast; share text.
**Telemetry:** `goal_milestone {{ pct }}`.

### E8-S4: Estimated Finish Date
**Acceptance Criteria**
- Estimate based on last 90 days avg monthly net increase of linked accounts.
- If no history, show “Insufficient data” with tips.

### E8-S5: Entitlement Check (Free limit = 2)
**Dependencies:** E11.  
**Acceptance Criteria**
- Attempt to create 3rd goal shows paywall.

### E8-S6: Notifications (Local)
**Acceptance Criteria**
- Optional monthly reminder to update balances; respects OS quiet hours.

### E8-S7: A11y/Perf
**Acceptance Criteria**
- Labels for progress; p95 goal list render < 400ms.

---

# E9 — Scenario Planner (Basic)

### E9-S1: Create One Active Scenario
**Acceptance Criteria**
- Inputs: savingsRateDelta (%), incomeDelta (+/− per month), expenseDelta (+/− per month), optional lumpSum (date, amount).
- Only one active scenario at a time; enabling replaces existing active.
**Telemetry:** `scenario_create`.

### E9-S2: Projection vs Baseline (12‑mo)
**Acceptance Criteria**
- Show overlay chart and numeric delta vs baseline.
**Telemetry:** `scenario_view_overlay`.

### E9-S3: Quick Presets
**Acceptance Criteria**
- Buttons: “+A$100/mo savings”, “+5% savings rate”, “+A$1,000 lump sum”.

### E9-S4: Apply / Revert
**Acceptance Criteria**
- One-tap apply to temporarily update dashboard; revert restores baseline.
**Telemetry:** `scenario_apply`, `scenario_revert`.

### E9-S5: Persistence
**Acceptance Criteria**
- Scenario config saved locally and restored on relaunch.

### E9-S6: Input Validation
**Acceptance Criteria**
- Guard rails: deltas between −80% and +200%; friendly error messages.

### E9-S7: A11y/Perf
**Acceptance Criteria**
- Chart remains readable in dark mode; p95 recompute ≤ 300ms.

---

# E10 — Data Visualization & Accessibility

### E10-S1: Net Worth Sparkline Component
**Acceptance Criteria**
- Renders 12 points; accessible tooltip shows month and value; works in dark mode.
**Telemetry:** `chart_hover {{ chart:"networth" }}`.

### E10-S2: Goal Progress Visualization
**Acceptance Criteria**
- Progress ring/bar with value labels; high-contrast.

### E10-S3: Accessible Tables
**Acceptance Criteria**
- Accounts/Goals tables with row headers, readable focus, and sort indicators.

### E10-S4: Motion & Haptics Preferences
**Acceptance Criteria**
- Honors reduced-motion; haptics off when reducedMotion true.

### E10-S5: Touch Targets & Gestures
**Acceptance Criteria**
- ≥44px targets; no gesture-only critical actions.

### E10-S6: Color & Contrast
**Acceptance Criteria**
- Palette passes AA; diff states (error/warn/success) distinct and labeled.

### E10-S7: A11y Audit Pass
**Acceptance Criteria**
- Manual checklist run; issues logged and fixed.

---

# E11 — Monetization & Entitlements

### E11-S1: Paywall Screen
**Acceptance Criteria**
- Shows Monthly/Annual plans in AUD; lists benefits (unlimited accounts/scenarios, extended projections, premium insights when live).
- “Restore Purchases” present; links to Terms/Privacy.
**Telemetry:** `paywall_view`, `paywall_cta_click {{ plan }}`.

### E11-S2: IAP Purchase Flow (iOS/Android)
**Acceptance Criteria**
- Successful purchase unlocks immediately; errors show retry/help.
**Telemetry:** `purchase_success {{ plan }}`, `purchase_error {{ code }}`.

### E11-S3: Receipt Validation Endpoint (Backend Spec)
**Acceptance Criteria**
- POST `/iap/verify` with platform, receipt; returns `{{ valid, entitlements[], expiresAt }}`.
**Data Contract**
```json
{{
  "platform": "ios|android",
  "receipt": "base64",
  "appVersion": "1.0.0"
}}
```
**Telemetry:** `receipt_verify_request`, `receipt_verify_result {{ valid }}`.

### E11-S4: Entitlement Middleware
**Acceptance Criteria**
- Centralized check gates: accounts>3, goals>2, scenarios>1.
**Telemetry:** `entitlement_check {{ feature, result }}`.

### E11-S5: Restore Purchases
**Acceptance Criteria**
- One-tap restore; shows confirmation and new expiry if applicable.

### E11-S6: Price/Copy Config
**Acceptance Criteria**
- Prices and benefits are remotely configurable (static JSON for MVP).

### E11-S7: Paywall Trigger Points
**Acceptance Criteria**
- Triggered when exceeding limits and via Settings → Upgrade.

---

# E12 — Telemetry & Observability

### E12-S1: Event Schema & Minimal PII Policy
**Acceptance Criteria**
- Define canonical event names and required properties; no personal data stored.
**Telemetry:** `telemetry_init`.

### E12-S2: Client Event Queue & Retry
**Acceptance Criteria**
- Buffered queue with backoff on failure; offline-safe.

### E12-S3: Crash Reporting Integration
**Acceptance Criteria**
- Initialize provider; capture unhandled errors; tie to app version/build.

### E12-S4: Funnel & Key Events
**Acceptance Criteria**
- Track: onboarding_start/complete, paywall_view/purchase_success, csv_import_*, goal_create, scenario_apply.

### E12-S5: Health Check & Logging
**Acceptance Criteria**
- Lightweight ping endpoint; redact logs; log levels.

### E12-S6: Telemetry Dashboard (Internal)
**Acceptance Criteria**
- Basic dashboard or exported logs to verify events (MVP can be console or simple file).

---

# E13 — Privacy & Security Hardening

### E13-S1: Local DB Encryption
**Acceptance Criteria**
- Encrypt SQLite/WatermelonDB at rest; key in secure storage.
**Telemetry:** `db_encryption_enabled`.

### E13-S2: App Lock (PIN/Biometrics)
**Dependencies:** E5.  
**Acceptance Criteria**
- Lock after inactivity; unlock by PIN/biometric.
**Telemetry:** `app_locked`, `app_unlocked`.

### E13-S3: Certificate Pinning & TLS-Only
**Acceptance Criteria**
- Reject non-TLS; pin to backend cert (MVP: single pin).

### E13-S4: Root/Jailbreak Detection
**Acceptance Criteria**
- Detect and warn; allow continue with reduced guarantees for MVP.

### E13-S5: Secrets Hygiene & CI Scan
**Acceptance Criteria**
- CI job for secret scanning; env var audit; no secrets in repo.

### E13-S6: Privacy Copy & Settings
**Acceptance Criteria**
- Clear privacy statement; links from onboarding and settings.

---

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

# E17 — Store Readiness & Release Ops

### E17-S1: App Store Assets & Metadata
**Acceptance Criteria**
- Title, subtitle, description, keywords, categories, privacy URL, screenshots in light/dark.
**Test Notes:** Copy review; legal review.

### E17-S2: TestFlight / Internal Testing Setup
**Acceptance Criteria**
- Build to TestFlight; invite testers; capture feedback channel.

### E17-S3: Phased Rollout Plan
**Acceptance Criteria**
- Beta → GA with dates; rollback plan documented.

### E17-S4: Store Compliance Checklist
**Acceptance Criteria**
- IAP, privacy, data collection answers consistent with app behavior.

### E17-S5: Post-Launch Observability
**Acceptance Criteria**
- Crash monitoring thresholds and on-call/notification rules for first 2 weeks.

---

## Cross-Cutting NFRs (apply to all stories)
- **Performance:** p95 screen load < 1s on target devices; background work under 16ms/frame during interactions.
- **Accessibility:** WCAG 2.1 AA for color, labels, focus order, touch targets; VoiceOver/TalkBack checks.
- **Offline-first:** All critical functions usable offline; graceful errors when network is required.
- **Privacy:** No bank credentials or sensitive PII collected; local-only mode respected.
- **Testing:** Unit tests for calc/logic; integration tests for flows; manual device checks pre-release.

---

## Open Assumptions Resolved (for MVP)
- **12‑mo baseline:** If insufficient history, use flat baseline from current month; otherwise use 3‑month average per account.
- **FX rates:** Static rate table updated with app releases (no network dependency for MVP).
- **Entitlement limits:** Free = 3 accounts, 1 scenario, 2 goals; Pro removes these limits.
- **Onboarding resume:** Persist current step to local storage and restore after kill.
- **Security timeout:** Default auto-lock 5 minutes, configurable 1–10.

> If we need to adjust any assumption, we’ll update the relevant stories’ AC and data contracts.

---

## Done-Definition for MVP Story Acceptance
- All AC pass, including loading/empty/error and a11y states.
- Telemetry events fire with correct payloads.
- No new a11y or P0/P1 bugs open.
- Unit tests (where applicable) and device manual test evidence attached.
