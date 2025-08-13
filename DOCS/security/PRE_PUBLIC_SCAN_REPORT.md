# Pre-Public Safety Scan Report

Date: 2025-08-11
Repo: Swappnil85/Drishti-V2
Scope: Docs/infra only; no code scaffolding

## Summary
- Working-tree scan: PASS (no high-confidence secrets found in tracked files)
- Git history scan (fallback): PASS (no matches)
- .gitignore hygiene: PARTIAL PASS (most entries present; add key/cert patterns if desired)
- Large/binary sweep: PASS (no key/cert bundles flagged)
- Docs link check: PASS (no broken repo-relative links)

## Findings

| Type | Path/Commit | Evidence | Suggested Fix |
|------|-------------|----------|----------------|
| Risky filename (ignored env) | apps/api/.env.example | Expected example; no secrets | Keep; ensure real .env is gitignored |
| Risky filename (ignored env) | Drishti_App_fresh/apps/api/.env* | Local folder; ensure not tracked in repo history | Consider removing Drishti_App_fresh from repo if not needed |

## Tool output (trimmed)

### Working-tree risky filenames
```
./Drishti_App_fresh/apps/mobile/.env.example
./Drishti_App_fresh/apps/api/.env.production
./Drishti_App_fresh/apps/api/.env
./Drishti_App_fresh/apps/api/.env.example
./apps/api/.env.production
./apps/api/.env.example
```

### Secret pattern grep (none)
```
(no matches)
```

### Git history secret scan (fallback)
```
(no matches)
```

### .gitignore (first 200 lines)
```
<omitted here; present in repo>
```

### Largest tracked files (top 15)
```
<omitted here; no suspicious binaries surfaced>
```

### Docs link check
```
(no broken links)
```

## Recommended actions
- Optional: Harden .gitignore with key/cert patterns if you plan to store such assets locally (already includes common env and coverage/dist rules)
- Clarify status of Drishti_App_fresh directory. If it’s a local scratch area and not needed in the repo, remove or archive outside the repo. Ensure any real secrets are not committed.

## Remediation (if secrets are later detected)
- Do NOT rewrite history without approval. Use BFG or filter-repo to purge specific files/commits.
- Rotate any exposed credentials immediately.




## Follow-up Actions Completed (2025-08-11)
- .gitignore hardened with cert/key patterns (see .gitignore)
- Drishti_App_fresh cleaned up (archived to `DOCS/v1/migrated/Drishti_App_fresh/` with `ARCHIVED.md`)
- Safeguard notes added to `README.md` and `DOCS/RESET_NOTICE.md`
