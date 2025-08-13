# Drishti_V2 — User Stories Index
_Generated: 2025-08-12 (AET)_

## Files

- [E10 — Data Visualization & Accessibility](E10-DATA_VIZ_A11Y.md)
- [E11 — Monetization & Entitlements](E11-MONETIZATION.md)
- [E12 — Telemetry & Observability](E12-TELEMETRY.md)
- [E13 — Privacy & Security Hardening](E13-PRIVACY_SECURITY.md)
- [E14 — Export & Sharing](E14-EXPORT.md)
- [E17 — Store Readiness & Release Ops](E17-STORE_RELEASE_OPS.md)
- [E4 — Navigation & Core UI Framework](E4-NAV_UI.md)
- [E5 — Onboarding, Profile & Settings](E5-ONBOARDING_SETTINGS.md)
- [E6 — Accounts: Manual + CSV Import](E6-ACCOUNTS_CSV.md)
- [E7 — Net Worth & Calc Engine (12‑month)](E7-NET_WORTH_ENGINE.md)
- [E8 — Goals (Free tier: up to 2)](E8-GOALS.md)
- [E9 — Scenario Planner (Basic)](E9-SCENARIOS_BASIC.md)
- [E15 — Cloud Sync (Opt‑in Module, Pro add‑on)](PRO-E15-CLOUD_SYNC.md)
- [E16 — AI Goal Advisor (Pro)](PRO-E16-AI_GOAL_ADVISOR.md)
- [E18 — Advanced Scenario Planner (Pro)](PRO-E18-ADV_SCENARIOS.md)
- [E19 — Premium Insights (Pro)](PRO-E19-PREMIUM_INSIGHTS.md)
- [E20 — Goal Templates Pack (Add‑on)](PRO-E20-GOAL_TEMPLATES.md)
- [E21 — Support & Help Center (Pro enablement)](PRO-E21-SUPPORT_HELP.md)

## Conventions
- Story IDs are stable (e.g., `E6-S8`).
- Each epic file contains Acceptance Criteria, Data Contracts, Telemetry, A11y/Perf, and Test Notes where applicable.
- Changes to assumptions must update both the epic file and this index.

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

## Cross‑Cutting NFRs (apply to all Pro stories)
- **Privacy & Security:** No PII in analytics; AI pipeline redacts; keys never leave device; TLS+pinning for any network.
- **Performance:** p95 interaction < 1s; background jobs cooperative with OS.
- **Accessibility:** WCAG 2.1 AA; screen reader labels; 44px targets.
- **Observability:** Success/error events for every networked action; crash traces tied to app version/build.
- **Entitlements:** Clear gating; graceful paywall prompts; never lose local data when trials expire.

---

## Assumptions & Interfaces (subject to change)
- **Sync backend** is a thin store for encrypted blobs + op logs; no server‑side reads of cleartext.
- **Advisor** uses small prompts and deterministic helpers for math; no financial advice or product recommendations.
- **Insights** are computed locally; cloud compute is **not** required for MVP+Pro v1.
- **Templates** ship as JSON; remote config may add new templates later.
- **Help Center** can start as email/webhook and later integrate a ticketing system.

---

## Acceptance Checklist for Pro Stories
- AC pass including error/empty/loading + a11y states.
- Telemetry present for success/error/CTA events.
- No new P0/P1 defects; unit tests for logic; device manual checks.