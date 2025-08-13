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
