# Epic 13: Security Hardening & Compliance - Implementation Notes

## Scope Delivered (Core)

- Privacy API endpoints:
  - GET /privacy/export (JSON/CSV; filter by types: user, accounts, goals, scenarios, sessions)
  - POST /privacy/delete (immediate anonymization or scheduled via scheduleDays)
- PrivacyService:
  - Aggregates user-related data from users, financial_accounts, financial_goals, scenarios, sessions
  - CSV export utility and JSON export wrapper with metadata
  - Deletion/anonymization transaction with receipt hash (SHA-256)
- Tests:
  - Unit tests for PrivacyService export paths

## Next Steps (Planned)

- Add PDF export using server-side generator (pending dependency approval)
- Add background job to enforce retention-based automated deletions
- Extend export portability to common interoperable format (e.g., JSON:API)
- Mobile UI actions to invoke export/delete with confirmation flows
- Admin endpoints for compliance audit logs and DSAR tracking

## Security Considerations

- Auth required via Bearer JWT for privacy endpoints
- Soft delete related to financial_* tables to preserve referential integrity
- User anonymization (email placeholder, is_active=false) + session invalidation
- Receipt hash as cryptographic proof-of-action (non-PII)

## Env/Config

- No new env vars required for core
- Optional: RETENTION_DEFAULT_DAYS in future

