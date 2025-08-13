Drishti V2 — Master PRD (Post-PDF→Excel MVP)
# High-Level Overview
Drishti V2 - Post-PDF→Excel MVP PRD
1. Introduction
This PRD defines the scope, requirements, and success criteria for the Drishti V2 MVP following the strategic decision to drop PDF/JPG→Excel as the core monetization driver. The app will focus on privacy-first, manual and CSV-import financial planning with scenario forecasting, goal tracking, and AI-assisted insights.
2. Goals & Non-Goals
Goals
- Deliver a privacy-first finance app with manual and CSV-based data input.
- Enable simple and advanced scenario planning for net worth projection.
- Provide goal tracking with milestone progress.
- Differentiate with niche targeting (FIRE, freelancers, expats, privacy-conscious users).
- Introduce a freemium model with clear upgrade incentives.
Non-Goals
- No bank sync or credential-based data aggregation.
- No PDF/JPG→Excel as a core paid feature.
- No full-scale accounting or budgeting features beyond projections and goals.
3. MVP Scope
Free Tier
• Net Worth Overview (manual entry, CSV import)
• Dashboard with 12-month net worth sparkline
• 3 accounts max
• 1 active scenario (12-month projection)
• 2 active goals (milestones, finish date)
• Privacy Mode (on-device only, biometric/PIN lock)
• CSV export
Pro Tier
• Unlimited accounts, goals, and scenarios
• Advanced Scenario Planner (multi-scenario, 3–5 year forecast)
• AI Goal Advisor (personalized recommendations)
• Premium Insights (monthly trend report)
• Custom Goal Templates (FIRE, First Home, Debt Snowball, Travel)
• Cloud Sync & Multi-Device Access
• Priority Support
4. Monetization Strategy
• Free tier for acquisition and trust-building
• Pro Monthly: A$5.99; Pro Annual: A$59.99 (2 months free)
• Add-on Goal Packs: A$3.99 one-off
• Cloud Sync Add-on: A$1.99/month
5. Assumptions
- Target users value privacy and are comfortable with manual entry.
- AI insights and scenario planning create a clear upgrade path.
- CSV import/export satisfies power users and reduces churn.
- Cloud sync will be an optional, paid feature to avoid privacy objections.
6. Success Metrics
- 20%+ of active users upgrade to Pro within 90 days.
- Free-to-Pro conversion rate ≥ 3% within first 30 days.
- Retention D30: ≥ 40% for Pro, ≥ 20% for Free.
- NPS ≥ 40 among Pro users.
7. Acceptance Criteria
- Users can create, edit, and delete accounts, scenarios, and goals.
- CSV import supports at least balance history for accounts.
- Scenario planner calculates projections based on editable parameters.
- Privacy mode enforces on-device-only data storage.
- Pro features are gated behind subscription or add-on purchase.
- AI Goal Advisor returns relevant, contextual suggestions.
8. Non-Functional Requirements
- Accessibility: WCAG AA compliance.
- Performance: All screens load within 1s on target devices.
- Security: No credentials stored; local data encrypted at rest.
- Observability: Basic logging and crash reporting.
9. Cutover Plan
1. Complete feature development as per MVP scope.
2. Beta release to controlled group.
3. Monitor metrics and feedback for 2–4 weeks.
4. Full public release with app store optimization.
5. Post-launch marketing push targeting FIRE, freelancer, and expat communities.

# Detailed Execution Plan
Drishti V2 — Post-PDF→Excel MVP PRD
1. Executive Summary
We are dropping generic PDF/JPG→Excel as a core paid pillar. The MVP focuses on privacy-first planning: manual/CSV input, scenario forecasting, and goals.
Monetization is via a Pro plan (unlimited accounts/scenarios, advanced forecasting, AI Goal Advisor) with optional add-ons (goal packs, cloud sync).
Scope is intentionally small: Auth, Dashboard (net worth + 12‑month sparkline), Accounts (manual + CSV), Basic Scenario + Goals (limited), and gating for Pro.
Non-goals for MVP: bank sync, budgets, complex analytics, bulk imports, desktop companion.
Definition of Done: App store–ready build, WCAG AA, ≤1s perceived load, clear paywall, and telemetry for conversion/retention.
2. Problem & Goals
Problem: Most consumer finance apps either demand bank logins or drown users in categories and budgets. Many users want a simple, private way to track net worth and forecast goals without connecting a bank.
Goals
Deliver a privacy-first personal finance app that works with minimal input.
Make planning tangible with scenario forecasting and goal milestones.
Create a clean upgrade path to Pro with clear value (longer horizon, multi-scenarios, insights).
Non-Goals (MVP)
No bank credential aggregation or open banking.
No generic PDF/JPG→Excel converter as a paid core.
No full budgeting, bill pay, or money movement.
No admin/multi-tenant tools.
3. Personas & JTBD (condensed)
Privacy‑first saver (AU): Wants to forecast savings and track net worth without giving bank credentials.
Freelancer/contractor: Lumpy income; needs simple targets and cash runway view.
FIRE‑minded planner: Wants quick scenarios for savings rate and time to goal.
Top Jobs-to-be-Done
“Help me see where my net worth will be in 12 months if I change my savings rate.”
“Help me track progress toward a goal without connecting a bank.”
“Help me decide which scenario gets me to a target date sooner.”
4. MVP Scope (functional)
Free Tier
Accounts: create/edit/delete with type (cash, savings, debt, asset); starting balance; optional CSV import for balance history.
Dashboard: total net worth; 12‑month sparkline; last updated date; empty/loading/error states.
Scenario Planner (Basic): 1 active scenario; change savings rate/income/expense deltas; 12‑month projection with simple assumptions.
Goals: up to 2 active goals; target amount/date; milestone %; estimated finish date; progress badges.
Privacy Mode: on‑device storage; biometric/PIN lock; clear privacy copy.
Export: CSV export of accounts and goals.
Pro Tier (paid)
Unlimited accounts, goals, and scenarios.
Advanced Scenario Planner: multiple scenarios tabbed side‑by‑side; horizon 3–5 years; basic compounding and inflation assumptions.
AI Goal Advisor: small, in‑context suggestions (e.g., “+A$50/mo accelerates goal by 2 months”).
Premium Insights: monthly text summary of trends/anomalies with share/export.
Cloud Sync (optional add‑on): encrypted backup & restore; off by default.
Priority support.
5. Acceptance Criteria (per area)
5.1 Accounts
User can add an account with: name, type (cash, savings, debt, asset), opening balance, currency (AUD default).
User can edit/delete accounts; deleting updates net worth immediately.
CSV import accepts: date, balance columns; validates headers; previews parsed rows; imports ≥ 200 rows under 5s on mid‑range device.
Empty state shows guided action (“Add your first account”).
Error state shows actionable message; no raw stack traces.
5.2 Dashboard
Net worth value updates in ≤200ms after account changes (perceived).
12‑month sparkline renders with accessible tooltip; supports light/dark.
Loading skeletons for graph and cards (≤800ms).
A11y: all interactive elements keyboard navigable; minimum 44px touch targets.
5.3 Scenario Planner (Basic)
User can create 1 scenario; editing parameters updates projection instantly (≤300ms).
Inputs: savings rate delta (%), income delta, expense delta; optional one‑off lump sum.
Output: 12‑month projected net worth line; summary card with month‑12 delta vs baseline.
Scenario can be toggled active/inactive; deleting restores baseline view.
5.4 Goals
User can create up to 2 goals (Free) with target amount/date; links to an account (optional).
Progress % auto‑calculates from selected accounts’ balances if linked; otherwise manual.
System estimates finish date based on current savings rate; shows variance vs target.
Goal badges appear at 25/50/75/100%; shareable text summary (copy to clipboard).
5.5 Pro Gating & Payments
Attempting to exceed free limits triggers paywall modal with monthly/annual options.
Successful purchase unlocks immediately; restores on reinstall via “Restore Purchases”.
Paywall copy clearly lists benefits and price in AUD; links to T&Cs/Privacy.
5.6 Cloud Sync (Add‑on)
When enabled, data is encrypted before transport; user sees last sync timestamp.
Offline‑first: app works without network; background sync retries with exponential backoff.
User can export a local encrypted backup file without enabling cloud.
5.7 AI Goal Advisor (Pro)
Generates ≤3 concise suggestions contextual to the current goal or scenario.
Includes a one‑tap action to apply a suggestion (e.g., +A$50/mo) and re‑project.
All prompts redact PII; no account names or balances are logged in telemetry.
6. Monetization & Pricing
Free: 3 accounts, 1 scenario, 2 goals, CSV export, on‑device only.
Pro Monthly A$5.99 / Annual A$59.99 (2 months free).
Add‑on: Goal Template Pack A$3.99 (one‑off).
Add‑on: Cloud Sync A$1.99/mo (optional).
7. Data Model (textual overview)
Account {id, name, type, currency, balanceHistory[{date, balance}] }
Goal {id, name, targetAmount, targetDate, linkedAccountIds[], progressMode: manual|linked }
Scenario {id, name, params{ deltaSavings%, deltaIncome, deltaExpenses, lumpSum }, horizonMonths }
User {id, subscriptionTier, settings{ privacyMode, currency, theme }, syncEnabled? }
8. API Surface (MVP, stub for add‑ons)
The core app runs on‑device. API is minimal for auth, purchases, telemetry, and optional sync.
openapi: 3.0.3
info:
  title: Drishti MVP API
  version: 0.1.0
paths:
  /healthz:
    get:
      summary: Liveness/Readiness
      responses: { '200': { description: OK } }
  /auth/token:
    post:
      summary: Exchange platform receipt for session
      requestBody: { required: true }
      responses: { '200': { description: OK } }
  /subscriptions/verify:
    post:
      summary: Verify Apple/Google receipts and return entitlements
      responses: { '200': { description: OK } }
  /telemetry/events:
    post:
      summary: Anonymous usage events (no PII)
      responses: { '204': { description: No Content } }
  /sync:
    get: { summary: Pull encrypted user blob, responses: { '200': { description: OK } } }
    post: { summary: Push encrypted user blob, responses: { '204': { description: No Content } } }
9. Telemetry (anon, opt‑in per region as required)
conversion_start, conversion_complete (scenario/goal creation)
paywall_view, paywall_click (plan), purchase_success, purchase_restore
export_share (email/drive), csv_import_attempt/success
scenario_edit_applied, ai_advice_shown/clicked
app_start, screen_view (dashboard/accounts/scenario/goals)
10. Non‑Functional Requirements
Accessibility: WCAG AA; VoiceOver/TalkBack labels; color‑contrast passes.
Performance: cold start ≤2s on mid‑range device; screen transitions ≤1s; interactions <100ms.
Security: no secrets in code; local DB encrypted; network via TLS; least‑privileged tokens.
Observability: health checks; minimal, privacy‑safe logs; crash reporting enabled.
11. Release Plan & Cutover
Internal alpha (Week 5): feature complete; test CSV import and projections.
Closed beta (Week 7): TestFlight/Internal App Sharing to 10–20 users; collect metrics.
Public launch (Week 8): app store listings, pricing live, marketing to FIRE/freelancer groups.
Post‑launch: 2‑week hardening; evaluate Pro conversion and retention.
12. Risks & Mitigations
Perceived value without bank sync → Emphasize privacy + scenarios; make manual input delightful.
AI advice quality varies → Start small, constrain prompts, add quick apply/undo.
CSV imports messy → Strict header validation + preview + clear error guidance.
13. Definition of Done (MVP)
All Acceptance Criteria in §5 met; smoke tests pass on iOS & Android.
App meets NFRs in §10; a11y audit completed; no secrets in repo.
Paywall and purchase flows verified on both stores; restore works.
Telemetry events captured and visible in dashboard; basic KPIs defined.
Appendix A — Feature Stack & Revenue Ladder (text)
Free → Pro is the primary path. Optional add‑ons branch from Pro. Free: 3 accounts, 1 scenario, 2 goals, CSV export, on‑device only. Pro: unlimited accounts/scenarios, advanced planner (3–5 yrs), AI Goal Advisor, Premium Insights. Add‑ons: Goal Template Pack (A$3.99 one‑off), Cloud Sync (A$1.99/mo).