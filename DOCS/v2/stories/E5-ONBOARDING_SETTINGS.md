# E5 — Onboarding, Profile & Settings

**Batch-1 complete via PR #34 (2025-08-17)**

### E5-S1: Onboarding Flow (5 steps + Resume) ✅ DONE

**Status:** DONE (2025-08-17) - [PR #34](https://github.com/Swappnil85/Drishti-V2/pull/34) - Merge SHA: f72a3ed

**Context:** Fast path to value; resumable.
**Acceptance Criteria**

- Steps: Welcome → Currency → Privacy Mode → Sample Data (optional) → Done.
- Progress indicator; can skip non-critical steps; resume after app relaunch.
  **Telemetry:** `onboarding_start`, `onboarding_step {{ step }}`, `onboarding_complete`.
  **Perf:** Full flow ≤ 3 minutes.
  **Test Notes:** Kill app mid-flow; resumes to last step.

**UAT Notes:**

- ✅ Fresh launch shows onboarding Step 1 deterministically (no tabs flicker)
- ✅ "Get Started" advances steps reliably on mobile + web
- ✅ Boot gate implemented in RootNavigator with loading→onboarding→app state machine
- ✅ Onboarding completion sets flag and navigates to MainTabs
- ✅ Mobile: Expo Go exp://10.0.0.36:8082 | Web: http://localhost:19008

### E5-S2: Currency & Locale Preference ✅ DONE

**Status:** DONE (2025-08-17) - [PR #34](https://github.com/Swappnil85/Drishti-V2/pull/34) - Merge SHA: f72a3ed

**Acceptance Criteria**

- Choose currency (default AUD). Persists to profile.
  **Data Contract**

```ts
interface Profile {{ currency: string; theme: "system"|"light"|"dark"; privacyLocalOnly: boolean }}
```

**Telemetry:** `pref_currency_set {{ currency }}`.

**UAT Notes:**

- ✅ Settings shows enhanced QA tools: "Reset Onboarding (QA)" + "Reset ALL Preferences (QA)"
- ✅ Tri-state reduced motion controls: Use System / Force ON / Default OFF
- ✅ Web dark mode contrast fixed with explicit text colors (AA compliance)
- ✅ Reset Onboarding clears flags and immediately navigates to onboarding
- ✅ Reset ALL Preferences clears everything (onboarding + theme + profile)

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
