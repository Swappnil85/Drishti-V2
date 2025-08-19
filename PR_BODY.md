This PR introduces a new privacy feature in the mobile-v2 application, allowing users to mask sensitive values throughout the UI.

**Summary of Changes:**
*   Added `apps/mobile-v2/src/utils/privacy.ts`
*   Added `apps/mobile-v2/src/state/privacy.ts`
*   Updated `apps/mobile-v2/src/screens/SettingsScreen.tsx` with a new Privacy section (toggle + preview)
*   Added `apps/mobile-v2/src/utils/__tests__/privacy.test.ts`

**Verification:**
*   `lint`, `type-check`, and `tests` pass for `mobile-v2`.
*   Unrelated pre-existing failures exist in `api`/`shared`.

**Accessibility:**
*   The toggle has an `accessibilityLabel`.
*   The preview text is screen-reader friendly.

**Checklist:**
*   [x] AC met
*   [x] WCAG AA verified
*   [x] Tests ≥80% coverage
*   [x] CI green for mobile-v2