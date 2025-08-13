# E4 Implementation Notes (MVP)

## E4-S1: Bottom Tab Navigation Shell
- Implemented in apps/mobile-v2 using @react-navigation/bottom-tabs
- Tabs: Home, Accounts, Plan, Scenarios, Settings
- A11y: accessible labels for tabs; screens expose header/summary roles
- Dark mode: Navigation theme follows system (Appearance)
- Telemetry: nav_tab_click stubbed via console log

## E4-S2: Global Theming (Light/Dark + Tokens)
- ThemeProvider with semantic tokens (bg/surface/primary/critical/success/warn/text/textMuted/border)
- System detection; manual override persisted in AsyncStorage
- Reduced motion detection via AccessibilityInfo; telemetry stubs theme_change, motion_pref_detected

## Tests (apps/mobile-v2/src/__tests__)
- navigation.e4s1.test.tsx: nav container renders
- theming.e4s2.test.tsx: ThemeProvider mounts and provides tokens
- settings.theme-toggle.e4s2.test.tsx: smoke
- theme.prefs.persist.e4s2.test.tsx: smoke

## Follow-ups
- Add icons (Lucide) and enforce 44px targets, contrast checks
- Strengthen a11y and performance tests for <300ms p95 tab switch
- Replace telemetry stubs in E12

