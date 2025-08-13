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
