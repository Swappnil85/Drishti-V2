# Governance Checklist (Draft)

- Branch protection on `main`
  - [ ] Require PR reviews (≥1)
  - [ ] Dismiss stale reviews on new commits
  - [ ] Require status checks (TBD once CI is configured)
- Actions permissions
  - [ ] Default workflow permissions: Read
  - [ ] Disable GitHub Actions approving PRs
- Release management
  - [ ] Release naming: v2-<milestone>-<increment>
  - [ ] Tag policy: signed tags for releases; planning tags allowed (e.g., v1-frontend-final)

