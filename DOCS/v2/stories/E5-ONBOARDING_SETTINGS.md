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

**Status**: DONE ✅ (2025-08-18 - Runtime patch merged)
**Acceptance Criteria**

- Manual override of system theme persists; motion reduced per OS setting.

### E5-S5: Security Settings (PIN/Biometrics enable) & App Lock UX

**Status**: DONE ✅ (2025-08-19) — merged via [PR #45](https://github.com/Swappnil85/Drishti-V2/pull/45)
**Dependencies:** E2, E13.

**Acceptance Criteria**

- [x] Set 4–6 digit PIN; enable biometric unlock if supported
- [x] App locks after inactivity (configurable 1–10 minutes)
- [x] Telemetry events captured for PIN, biometrics, auto-lock, privacy toggle
- [x] Biometric prompt at app launch/resume with PIN fallback
- [x] App Lock screen with proper authentication flow

**Implementation Details:**

- SecurityProvider (context) manages settings, lock state, and timers; services for biometrics and PIN
- PIN setup UI with 4–6 digit validation and persistence
- Biometric gating requires a PIN to be set AND `isBiometricAvailable()` to be true; web-safe fallback returns false
- Auto-lock timeout options: 1, 3, 5, 10 minutes; background/foreground hooks trigger `lock()` appropriately
- Lockout after failed PIN attempts with progressive delays and clear messaging
- Settings screen includes Security (App Lock, Biometrics, PIN, Auto-lock) and Privacy Toggle sections
- WCAG AA compliant with proper accessibility labels and minimum touch target sizes
- Comprehensive tests for security state, utilities, and QA flows (all passing)

**Telemetry**

- `security_pin_set`
- `security_bio_enabled` / `security_bio_disabled`
- `security_locked`
- `security_unlocked { method: 'pin' | 'biometric' }`
- `security_autolock_changed { minutes: 1|3|5|10 }`
- `privacy_mode_toggled { enabled: boolean }`

**Verification (SOP)**

- Lint: `npm run lint -w apps/mobile-v2`
- Typecheck: `npm run type-check -w apps/mobile-v2`
- Tests + coverage: `npm test -w apps/mobile-v2 -- --coverage` (all suites pass)
- Expo Web: `npm run -w apps/mobile-v2 start:web` → http://localhost:19008
  - Navigate to Settings → Security: verify toggles, PIN flow, biometric gating (web shows unavailable)
  - Privacy Toggle: verify state persists and telemetry event logs
- A11y: Dark/Light contrast validated (e.g., 17.9:1, 12.7:1, 18.7:1, 4.7:1)

### E5-S6: Reduced Motion Tri-State & Dark Mode Contrast

**Status**: DONE ✅ (2025-08-18 - E5-S6 merged via PR #39)

**Acceptance Criteria**

- [x] Add Reduced Motion tri-state (System / On / Off)
- [x] Persist setting in storage; System = follow OS
- [x] Ensure UI updates accordingly
- [x] Explicit dark-mode text colors for AA contrast

**Implementation Summary:**

- Implemented tri-state reduced motion control (System/On/Off) in Settings
- Added proper persistence in AsyncStorage with JSON serialization
- System mode follows OS AccessibilityInfo.isReduceMotionEnabled
- ThemeProvider manages effective reduced motion state
- WCAG AA contrast compliance validated for dark mode text colors
- All text combinations exceed 4.5:1 contrast ratio requirement
- 44 comprehensive tests added with 100% pass rate

**WCAG AA Contrast Ratios (validated):**

- Dark mode: 17.9:1, 12.7:1, 14.0:1 (all exceed 4.5:1)
- Light mode: 18.7:1, 4.7:1 (all exceed 4.5:1)

**PR**: #39 - feat(E5-S6): reduced motion tri-state & dark-mode contrast (mobile-v2)

### E5-S7: Settings Screen Information

**Acceptance Criteria**

- Version/build, T&Cs/Privacy links, contact support link (deep link stub).

### E5-S8: First-Run Nudge to Add Account

**Acceptance Criteria**

- After onboarding, if zero accounts, show CTA card on Home.
  **Telemetry:** `nudge_add_account_shown/clicked`.

---
