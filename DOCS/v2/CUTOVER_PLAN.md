# Frontend V2 – Cutover Plan

## Strategy (Strangler)
- Keep backend as-is; V2 clients progressively route to new screens.
- Feature flags gate user exposure.

## Feature Flags
- v2_auth_enabled, v2_dashboard_enabled, v2_accounts_enabled
- Flags documented; owners TBD.

## UAT Plan
- Internal testers verify Auth/Dashboard/Accounts read-only flows.
- Accessibility spot-check with screen readers.

## Rollback Steps
- Toggle off feature flags.
- Revert to prior release bundle.

## Release Checklist
- [ ] All MVP epics/stories closed
- [ ] A11y review complete
- [ ] Smoke tests green
- [ ] Crash-free sessions target set
- [ ] Docs updated (PRD/EPICS/Stories)
