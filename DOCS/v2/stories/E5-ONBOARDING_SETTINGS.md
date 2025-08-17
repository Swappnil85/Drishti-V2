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

**Status**: DONE ✅ (2025-08-17 - Runtime patch merged)

**Acceptance Criteria**

- [x] Toggle stores data only on device; disables cloud sync surfaces.
- [x] Shows explainer and link to Privacy Statement.
- [x] **Telemetry:** `privacy_local_only_enabled`.

**Implementation Details:**

- Added Privacy Mode toggle in Settings screen with confirmation dialog
- Implemented privacy statement link with placeholder content
- Created storage utilities for privacy mode preferences
- Integrated with SecurityService for enhanced security when enabled
- Added telemetry logging for privacy mode changes
- Includes WCAG AA compliant UI with proper accessibility labels

**SOP - Testing:**

- Start Expo Go with: `npm run start:go:tunnel` (QR must start with exp:// and be small)
- LAN fallback: `npm run start:go:lan`
- One-Metro rule: Only run one Metro instance at a time

**Runtime patch merged:** fix(runtime): Expo Go QR + Metro guard + SDK53 pins, validated on Expo Go and web, small exp:// QR confirmed.

### E5-S4: Theme Preference & Reduced Motion

**Status**: DONE ✅ (2025-08-17 - Runtime patch merged)
**Acceptance Criteria**

- Manual override of system theme persists; motion reduced per OS setting.

### E5-S5: Security Settings (PIN/Biometrics enable) & App Lock UX

**Status**: IN-PROGRESS ❌
**Dependencies:** E2, E13.

**Acceptance Criteria**

- [x] Set 4–6 digit PIN; enable biometric unlock if supported.
- [x] App locks after inactivity (configurable 1–10 minutes).
- [x] **Telemetry:** `pin_set`, `biometric_enabled`, `auto_lock_triggered`.
- [x] Biometric prompt at app launch/resume with PIN fallback
- [x] App Lock screen with proper authentication flow

**Implementation Details:**

- Created comprehensive security services (BiometricService, PinService, SecurityService)
- Implemented App Lock screen with biometric authentication and PIN fallback
- Added security settings section in Settings screen with toggles for:
  - App Lock enable/disable
  - Biometric authentication enable/disable
  - PIN setup (placeholder for future implementation)
  - Auto-lock timeout configuration (1-10 minutes)
- Integrated with app lifecycle for automatic locking on background/foreground
- Added proper error handling and lockout mechanisms for failed attempts
- Includes comprehensive test coverage for all security services
- WCAG AA compliant with proper accessibility labels and touch targets

**SOP - Testing:**

- Start Expo Go with: `npm run start:go:tunnel` (QR must start with exp:// and be small)
- LAN fallback: `npm run start:go:lan`
- One-Metro rule: Only run one Metro instance at a time

**Runtime patch merged:** fix(runtime): Expo Go QR + Metro guard + SDK53 pins, validated on Expo Go and web, small exp:// QR confirmed.

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
