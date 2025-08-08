# Data Processing Register

This register documents Drishti's data processing activities.

## 1. Controllers and Processors
- Controller: Drishti
- Processors: (list vendors with purpose, DPA link)

## 2. Data Categories
- Identification: id, email, name
- Usage: sessions (ip, user-agent, activity timestamps)
- Product data: financial accounts, goals, scenarios

## 3. Purposes of Processing
- Provide and improve service
- Authentication and security
- Analytics (opt-in)
- Compliance with legal obligations

## 4. Lawful Bases
- Contract (service delivery)
- Legitimate interests (security, service improvement)
- Consent (analytics, marketing)

## 5. Data Retention
- Accounts/goals/scenarios: per retention policy; soft-deleted on erasure
- Sessions: per security policy
- Consent: audit history retained for compliance

## 6. Data Transfers
- Regions: (document hosting regions)
- Mechanisms: SCCs/DPF as applicable

## 7. Security Measures
- TLS with certificate pinning on mobile
- Encryption in transit; encryption at rest (DB/volumes)
- Access controls, least privilege
- Monitoring and alerting (violations, cert freshness)

## 8. Data Subject Rights
- Endpoints: /privacy/export, /privacy/delete, /privacy/consent
- Response SLAs: (define internal targets)

## 9. Incident Response
- Contact: security@drishti.app (example)
- Steps: detect -> contain -> notify -> remediate -> review

## 10. Reviews
- Review frequency: quarterly
- Owners: Security/Compliance

