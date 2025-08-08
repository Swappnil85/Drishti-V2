Branch Protection Proposal (master/main)

Goal
- Keep main stable for production deployments and master as the integration branch for PRs.

Recommended GitHub Settings

1) Protect main (production)
- Require pull request reviews before merging (at least 1–2 reviewers)
- Require status checks to pass before merging (select your CI checks)
- Require branches to be up to date before merging
- Restrict who can push to matching branches (allow admins/bots only if needed)
- Require signed commits (optional)
- Require conversation resolution before merging

2) Protect master (integration)
- Require pull request reviews before merging
- Require status checks to pass before merging
- Block force pushes and deletions
- Optionally require linear history

3) Environments (if using GitHub Environments)
- Create a production environment for main with required reviewers and secrets
- Create a staging environment for master if you deploy previews

4) Workflows
- CI runs on push to master and main and on PRs targeting master
- Release PR opens automatically from master to main (workflow: release-to-main.yml)

5) Practical process
- Open PRs against master
- After merge to master, a "Release: Merge master into main" PR will be created/updated
- Approve & merge that PR to deploy to production

Notes
- If you use CODEOWNERS, add directories requiring approvals
- If you use Dependabot, set auto-merge rules for dev-only dependencies on master
- Adjust reviewer rules to reflect your team size

