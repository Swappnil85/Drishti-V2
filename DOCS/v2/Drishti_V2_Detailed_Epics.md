Drishti_V2 — Detailed Epics (Final Planning Set)
Last updated: 2025-08-12 (AET)
# Purpose
This document enumerates all Drishti_V2 epics with concise scope, outcomes, acceptance criteria, telemetry, and dependencies. It is the single source of truth for MVP build and Pro/post-MVP planning. User stories will be authored against these epics.
# Legend
Tier: MVP, Pro, Add-on.  Status: DONE, Planned.  DoD: Definition of Done.
# MVP Scope (High-Level)
- Navigation & Core UI, Onboarding & Settings, Accounts (manual + CSV import), Net Worth & 12‑mo calc engine, Goals (up to 2),
  Basic Scenario (1 active), Data Viz & A11y, Telemetry, Privacy/Security hardening, Export/Sharing, Paywall/IAP, Store readiness.
# Non-Goals (MVP)
- Bank sync, money movement, advanced multi-year scenarios, cloud sync by default (opt-in post-MVP), PDF/JPG→Excel (separate experiment), B2B features, complex budgeting modules.
# Epic Details
## E1. Project Infrastructure & Tooling  —  Tier: - | Status: DONE
Problem / Context: We need a fast, reliable development baseline to ship MVP in 6–8 weeks.
Objectives / Outcomes:
• Stable monorepo with CI checks (lint, type, tests).
• Mobile app scaffold (Expo RN), API scaffold, shared utils.
• Rapid local dev + reproducible builds.
In Scope:
• Repo structure, CI pipeline, testing harness, env handling.
• TypeScript strict mode, ESLint/Prettier, Jest.
• Automated PR templates and code owners.
Definition of Done (DoD):
• Clean install & build on CI from a fresh clone.
• All checks pass; template PR merged successfully.
KPIs / Telemetry:
• CI success rate ≥ 95%, mean PR cycle time ↓ 20% vs baseline.
Dependencies: None
Risks & Mitigations:
• Tooling drift; mitigate with pinned versions and renovate.
## E2. Core Security & Authentication  —  Tier: - | Status: DONE
Problem / Context: Authenticate users securely on mobile with least friction.
Objectives / Outcomes:
• User can sign in/out and restore session securely.
• Biometric/PIN re-lock for local privacy.
In Scope:
• Email/Apple/Google sign-in, token refresh, secure storage.
• Biometric/PIN lock, session timeout settings.
Definition of Done (DoD):
• Auth happy-path + failure/timeout flows validated on device.
• No secrets committed; OWASP mobile auth checks pass.
KPIs / Telemetry:
• Sign-in success rate ≥ 98%, auth crash rate ≈ 0.
Dependencies: E1
Risks & Mitigations:
• Platform provider changes; mitigate with SDK version pinning.
## E3. Core Data Models & Local DB  —  Tier: - | Status: DONE
Problem / Context: We need reliable offline-first storage with simple sync readiness.
Objectives / Outcomes:
• Normalized models for User, Account, Balance, Goal, Scenario.
• Deterministic updates and conflict-safe IDs.
In Scope:
• SQLite/WatermelonDB schema, migrations, seed fixtures.
• Local encryption hooks (see E13).
Definition of Done (DoD):
• Cold start < 1.5s with DB init; migrations idempotent.
KPIs / Telemetry:
• Read/write latency p95 < 20ms on mid-tier Android.
Dependencies: E1
Risks & Mitigations:
• Schema churn; mitigate with story AC discipline and migrations.
## E4. Navigation & Core UI Framework  —  Tier: MVP | Status: Planned
Problem / Context: We need a predictable app shell so later features ‘snap in’.
Objectives / Outcomes:
• Bottom tabs (Home/Dashboard, Accounts, Plan/Goals, Scenarios, Settings).
• Unified theming (light/dark), a11y tokens, haptics, skeleton/empty/error patterns.
In Scope:
• Navigation stacks & transitions, header patterns, modals/sheets.
• Theme system, spacing/typography scale, icon set.
• Global loading/empty/error components.
Definition of Done (DoD):
• Tab switch < 300ms p95; accessible controls (44px targets).
• Dark/light parity, TalkBack/VoiceOver labels verified.
KPIs / Telemetry:
• Funnel drop-off on onboarding < 10%; UI crash-free sessions ≥ 99.5%.
Dependencies: E1
Risks & Mitigations:
• Design drift; mitigate with tokens and shared components.
## E5. Onboarding, Profile & Settings  —  Tier: MVP | Status: Planned
Problem / Context: New users need a fast start and private-by-default configuration.
Objectives / Outcomes:
• Resumable 5-screen onboarding (intro, currency, privacy, sample data, done).
• Profile with currency (AUD default), theme, privacy toggles.
In Scope:
• Onboarding flow & persistence, profile edit screen.
• Local-only mode toggle and security settings.
Definition of Done (DoD):
• Full onboarding ≤ 3 minutes; resume after app kill.
• Settings persist across restarts; analytics events fired.
KPIs / Telemetry:
• Onboarding completion ≥ 80%; return day‑2 ≥ 40%.
Dependencies: E4, E2, E3
Risks & Mitigations:
• Too many steps; mitigate with skippable non-critical screens.
## E6. Accounts: Manual + CSV Import  —  Tier: MVP | Status: Planned
Problem / Context: Users must load balances quickly without bank-sync complexity.
Objectives / Outcomes:
• Create/edit/delete accounts (cash/savings/debt/asset).
• CSV import for balances with preview, validation, and mapping.
In Scope:
• Account list/detail, balance history table, currency support.
• CSV parser, column mapping, duplicate detection, error handling.
Definition of Done (DoD):
• Import 200 rows < 5s on mid-tier device; clear success/fail report.
• Net worth recompute triggers instantly (see E7).
KPIs / Telemetry:
• 1st session import rate ≥ 30%; import success ≥ 95%.
Dependencies: E3, E4, E7, E10
Risks & Mitigations:
• CSV variants; mitigate with flexible mapping & saved presets.
## E7. Net Worth & Calc Engine (12‑month)  —  Tier: MVP | Status: Planned
Problem / Context: Provide an at-a-glance picture and short‑term projection.
Objectives / Outcomes:
• Current net worth and 12‑month baseline projection.
• Reactive updates on account/goal changes.
In Scope:
• Deterministic aggregation, baseline rules, caching.
• Public calc utilities with unit tests.
Definition of Done (DoD):
• Recompute ≤ 200ms on change; sparkline < 500ms render.
• Results consistent across cold/warm starts.
KPIs / Telemetry:
• Dashboard render p95 < 900ms; unit test coverage ≥ 80% for calc.
Dependencies: E3
Risks & Mitigations:
• Edge‑case rounding; mitigate with currency-safe math utilities.
## E8. Goals (Free tier: up to 2)  —  Tier: MVP | Status: Planned
Problem / Context: Users need tangible targets to drive habit formation.
Objectives / Outcomes:
• Create goals with amount/date; progress %, milestones (25/50/75/100).
• Optional link to accounts for auto progress.
In Scope:
• Goal CRUD, progress calc, badge system, notifications (local).
Definition of Done (DoD):
• Instant progress after balance change; a11y labels complete.
KPIs / Telemetry:
• Goal creation rate ≥ 50% of new users; milestone completion growth WoW.
Dependencies: E3, E4, E7, E10
Risks & Mitigations:
• Over‑notification; mitigate with frequency caps and user control.
## E9. Scenario Planner (Basic)  —  Tier: MVP | Status: Planned
Problem / Context: Show impact of simple changes without overwhelming users.
Objectives / Outcomes:
• One active scenario with savings-rate/income/expense deltas and optional lump sum.
• Delta vs baseline for 12‑month window.
In Scope:
• Scenario input UI, quick presets (+5% savings, +A$100/mo, etc.).
• Comparison view and revert-to-baseline.
Definition of Done (DoD):
• Recompute ≤ 300ms; undo within 1 tap; state persisted locally.
KPIs / Telemetry:
• Scenario usage ≥ 25% of active users; retention lift among users who run a scenario.
Dependencies: E7, E4, E3
Risks & Mitigations:
• Model misunderstanding; mitigate with inline explanations.
## E10. Data Visualization & Accessibility  —  Tier: MVP | Status: Planned
Problem / Context: Charts and tables must be legible, performant, and accessible.
Objectives / Outcomes:
• Net worth sparkline, goal progress visuals, accessible tooltips/tables.
• Dark/light palettes, large touch targets, screen reader support.
In Scope:
• Chart components, a11y pass, motion reduction for prefers-reduced-motion.
Definition of Done (DoD):
• A11y audit pass (WCAG AA basics); tooltip readable in dark mode.
KPIs / Telemetry:
• Chart interaction errors ≈ 0; UX bug rate < target threshold.
Dependencies: E4
Risks & Mitigations:
• Performance on low-end devices; mitigate with simplified rendering.
## E11. Monetization & Entitlements  —  Tier: MVP | Status: Planned
Problem / Context: Convert value into revenue sustainably and ethically.
Objectives / Outcomes:
• Paywall with plans (monthly/yearly), restore purchases.
• Feature gating: Free (3 accounts / 1 scenario / 2 goals).
In Scope:
• IAP integration, receipt validation endpoint, entitlement checks.
Definition of Done (DoD):
• Instant unlock after purchase; restore works across reinstalls.
KPIs / Telemetry:
• Paywall view→purchase ≥ industry baseline; churn < target.
Dependencies: E4, E3, E12
Risks & Mitigations:
• Store review delays; mitigate with phased rollout and clean receipts.
## E12. Telemetry & Observability  —  Tier: MVP | Status: Planned
Problem / Context: We need privacy-safe insights to tune conversion and reliability.
Objectives / Outcomes:
• Anon events for onboarding, paywall funnel, CSV import, crashes.
• Ops health checks and log scrubbing.
In Scope:
• Event schema, buffering, retry, minimal PII policy, crash reporting.
Definition of Done (DoD):
• Dashboard with key events visible; sample traces validated.
KPIs / Telemetry:
• Event delivery success ≥ 99%; crash-free sessions ≥ 99.5%.
Dependencies: E1, E4
Risks & Mitigations:
• Over-instrumentation; mitigate with schema review and sampling.
## E13. Privacy & Security Hardening  —  Tier: MVP | Status: Planned
Problem / Context: Finance data requires strong local protections and safe defaults.
Objectives / Outcomes:
• Local DB encryption, certificate pinning, secure storage routines.
• Privacy copy and controls users can trust.
In Scope:
• Crypto hooks, jailbreak/root detection, TLS-only, secret scanning.
Definition of Done (DoD):
• OWASP mobile checks pass; pre-release security review complete.
KPIs / Telemetry:
• Security bugs escaping to prod = 0; time to patch critical < 48h.
Dependencies: E2, E3, E1
Risks & Mitigations:
• Complexity on older devices; mitigate with capability checks.
## E14. Export & Sharing  —  Tier: MVP | Status: Planned
Problem / Context: Users need their data portable for spreadsheets and advice sessions.
Objectives / Outcomes:
• CSV export for accounts, goals; native share sheet integration.
In Scope:
• Schema-accurate exports, date/locale formatting, file naming.
Definition of Done (DoD):
• Exports match spec; a11y labels for share actions.
KPIs / Telemetry:
• Export success ≥ 99%; support tickets on export ≈ 0.
Dependencies: E3, E4
Risks & Mitigations:
• Timezone/locale edge cases; mitigate with consistent formatting rules.
## E15. Cloud Sync (Opt-in Module)  —  Tier: Pro add-on | Status: Planned
Problem / Context: Some users want multi-device continuity without compromising privacy.
Objectives / Outcomes:
• Encrypted blob push/pull with conflict resolution and background retry.
• Clear last-sync timestamp and manual sync controls.
In Scope:
• Sync service adapter, delta protocol, retry/backoff, error UX.
Definition of Done (DoD):
• Offline-first preserved; corruption tests pass; user can fully opt out.
KPIs / Telemetry:
• Sync success ≥ 99%; mean conflict resolution < 2s.
Dependencies: E3, E13
Risks & Mitigations:
• Data consistency; mitigate with append-only log and checksums.
## E16. AI Goal Advisor  —  Tier: Pro | Status: Planned
Problem / Context: Users need nudges and scenario hints grounded in their context.
Objectives / Outcomes:
• 3 in-context suggestions with one‑tap apply/undo; safe prompt redaction.
• Measurable engagement lift on goals and scenarios.
In Scope:
• Advisor prompt pipeline, guardrails, explainability microcopy.
Definition of Done (DoD):
• Suggestion accuracy validated on fixtures; undo is lossless.
KPIs / Telemetry:
• Click‑through rate ≥ target; session length/retention lift observed.
Dependencies: E8, E9, E7, E12, E13
Risks & Mitigations:
• Hallucinations; mitigate with deterministic data shaping + disclaimers.
## E17. Store Readiness & Release Ops  —  Tier: MVP | Status: Planned
Problem / Context: We need a clean path to TestFlight/beta and GA with store approval.
Objectives / Outcomes:
• Store listings/screenshots, release notes, phased rollout plan.
• Crash monitoring and rollback procedures.
In Scope:
• TestFlight/Internal testing setup, review checklists, pricing live.
Definition of Done (DoD):
• App approved; GA milestone met; post-launch watch checklist active.
KPIs / Telemetry:
• Time-to-approve within target; crash-free sessions ≥ 99.5% at GA.
Dependencies: E11, E12, E13, E10
Risks & Mitigations:
• Rejection risk; mitigate with compliance checklist dry‑runs.
## E18. Advanced Scenario Planner  —  Tier: Pro | Status: Planned
Problem / Context: Power users want multi-year, multi-scenario what‑ifs.
Objectives / Outcomes:
• Multiple scenarios, 3–5 year horizon, inflation/compounding toggles.
In Scope:
• Scenario library, comparison views, export/share summary.
Definition of Done (DoD):
• Model tests cover edge cases; UI stays responsive on larger ranges.
KPIs / Telemetry:
• Pro conversion among scenario users; scenario retention lift.
Dependencies: E9, E7, E10
Risks & Mitigations:
• Complexity creep; mitigate with progressive disclosure UI.
## E19. Premium Insights  —  Tier: Pro | Status: Planned
Problem / Context: Users want plain-language summaries and trends without spreadsheets.
Objectives / Outcomes:
• Monthly digest: trends, anomalies, category breakdowns; shareable.
In Scope:
• Aggregation jobs, insights templates, export to PDF/CSV.
Definition of Done (DoD):
• Summaries accurate on fixtures; noise controls to avoid false alerts.
KPIs / Telemetry:
• Monthly digest open rate; share rate; churn impact.
Dependencies: E12, E7, E6, E8
Risks & Mitigations:
• False positives; mitigate with thresholds and user tuning.
## E20. Goal Templates Pack  —  Tier: Add-on | Status: Planned
Problem / Context: Many users share common goal archetypes and want quick setup.
Objectives / Outcomes:
• Templates for FIRE, First Home, Debt Snowball, Travel with sensible defaults.
In Scope:
• Template definitions, one‑tap apply, edit after create.
Definition of Done (DoD):
• Template creates a valid goal in < 5s; editable immediately.
KPIs / Telemetry:
• Template usage rate; goal completion lift vs non-template users.
Dependencies: E8, E7
Risks & Mitigations:
• Over‑opinionated defaults; mitigate with clear editing affordances.
## E21. Support & Help Center  —  Tier: Pro enablement | Status: Planned
Problem / Context: Pro users expect timely help and basic self‑serve answers.
Objectives / Outcomes:
• In‑app FAQs and contact form; internal SLA tracking for Pro.
In Scope:
• FAQ content, search, contact flow, ticket handoff (email/Slack).
Definition of Done (DoD):
• Contact forms deliver reliably; FAQ covers top 10 issues.
KPIs / Telemetry:
• Median first response time meets SLA; self‑serve resolution ≥ 40%.
Dependencies: E12
Risks & Mitigations:
• Support load spikes; mitigate with macros and FAQ iteration.