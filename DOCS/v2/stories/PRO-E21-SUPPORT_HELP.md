# E21 — Support & Help Center (Pro enablement)

### E21-S1: FAQ Content System
**Acceptance Criteria**
- Markdown‑based FAQs with categories and anchors; offline cached.
**Telemetry:** `faq_view {{ topic }}`.

### E21-S2: Searchable Help
**Acceptance Criteria**
- Local search across FAQ titles and content; highlights and anchors to sections.
**Telemetry:** `faq_search {{ query }}`.

### E21-S3: Contact Form (Email/Webhook)
**Acceptance Criteria**
- Users submit a ticket with category, device, app version; success/fail states; respects offline (queues send).
**Data Contract**
```json
{ "category":"billing|bug|idea","message":"...", "appVersion":"1.1.0", "device":"..." }
```
**Telemetry:** `support_ticket_submit {{ category }}`, `support_ticket_error {{ code }}`.

### E21-S4: Pro SLA Indicator
**Acceptance Criteria**
- If user is Pro, show “Priority support: <target SLA>” on contact screen.
**Telemetry:** `support_pro_sla_view`.

### E21-S5: Quick Feedback (Thumbs/Comment)
**Acceptance Criteria**
- Inline “Was this helpful?” on FAQs; collect short comment.
**Telemetry:** `faq_feedback {{ helpful }}`.

### E21-S6: Offline Help Fallback
**Acceptance Criteria**
- If fully offline, show cached FAQs and queue contact drafts for later send.

---

## Cross‑Cutting NFRs (apply to all Pro stories)
- **Privacy & Security:** No PII in analytics; AI pipeline redacts; keys never leave device; TLS+pinning for any network.
- **Performance:** p95 interaction < 1s; background jobs cooperative with OS.
- **Accessibility:** WCAG 2.1 AA; screen reader labels; 44px targets.
- **Observability:** Success/error events for every networked action; crash traces tied to app version/build.
- **Entitlements:** Clear gating; graceful paywall prompts; never lose local data when trials expire.

---

## Assumptions & Interfaces (subject to change)
- **Sync backend** is a thin store for encrypted blobs + op logs; no server‑side reads of cleartext.
- **Advisor** uses small prompts and deterministic helpers for math; no financial advice or product recommendations.
- **Insights** are computed locally; cloud compute is **not** required for MVP+Pro v1.
- **Templates** ship as JSON; remote config may add new templates later.
- **Help Center** can start as email/webhook and later integrate a ticketing system.

---

## Acceptance Checklist for Pro Stories
- AC pass including error/empty/loading + a11y states.
- Telemetry present for success/error/CTA events.
- No new P0/P1 defects; unit tests for logic; device manual checks.
