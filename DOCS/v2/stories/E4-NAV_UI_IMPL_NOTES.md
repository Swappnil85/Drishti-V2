# E4 Implementation Notes (MVP)

## E4-S1: Bottom Tab Navigation Shell (Status: Done)

- Implemented in apps/mobile-v2 using @react-navigation/bottom-tabs
- Tabs: Home, Accounts, Plan, Scenarios, Settings
- A11y: accessible labels for tabs; screens expose header/summary roles
- Dark mode: Navigation theme follows system (Appearance)
- Telemetry: nav_tab_click stubbed via console log

## E4-S2: Global Theming (Light/Dark + Tokens) (Status: Done)

- ThemeProvider with semantic tokens (bg/surface/primary/critical/success/warn/text/textMuted/border)
- System detection; manual override persisted in AsyncStorage
- Reduced motion detection via AccessibilityInfo; telemetry stubs theme_change, motion_pref_detected

## Tests (apps/mobile-v2/src/**tests**)

- navigation.e4s1.test.tsx: nav container renders
- theming.e4s2.test.tsx: ThemeProvider mounts and provides tokens
- settings.theme-toggle.e4s2.test.tsx: smoke
- theme.prefs.persist.e4s2.test.tsx: smoke

### Testing Environment Notes

## E4-S3: Common Skeleton/Empty/Error (Status: Done)

## E4-S4: Modal/Sheet & Toast (Status: Done)

- Expo SDK 53 (React Native 0.79) aligns with React 19.x.
- Use Node 20.x to run jest-expo 53 tests; Node 22 triggers preset errors.
- Commands:
  - nvm use 20
  - npm ci
  - npm test -w apps/mobile-v2

## Follow-ups

- Add icons (Lucide) and enforce 44px targets, contrast checks
- Strengthen a11y and performance tests for <300ms p95 tab switch
- Replace telemetry stubs in E12
