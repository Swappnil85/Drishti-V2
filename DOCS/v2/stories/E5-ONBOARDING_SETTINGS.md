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
