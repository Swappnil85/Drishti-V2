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
