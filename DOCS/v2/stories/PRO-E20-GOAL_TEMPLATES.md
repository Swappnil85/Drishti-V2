# E20 — Goal Templates Pack (Add‑on)

### E20-S1: Template Definitions
**Acceptance Criteria**
- Templates: FIRE, First Home, Debt Snowball, Travel; each defines defaults (target, horizon, linked types).
**Data Contract**
```json
{ "id":"debt_snowball","title":"Debt Snowball","defaults":{"targetMonths":12,"linkedTypes":["debt"]} }
```

### E20-S2: Catalog UI & Preview
**Acceptance Criteria**
- Gallery with short descriptions and preview of resulting goal; accessible list/grid.

### E20-S3: One‑Tap Apply & Edit
**Acceptance Criteria**
- Creates a valid goal in < 5s; user can adjust immediately.
**Telemetry:** `template_apply {{ id }}`.

### E20-S4: Entitlement & Pricing
**Acceptance Criteria**
- Pack included in Pro; otherwise purchasable as add‑on (if enabled).
**Telemetry:** `template_entitlement_block`.

### E20-S5: Localisation & Copy
**Acceptance Criteria**
- Copy ready for future localisation; avoid region‑specific assumptions.

---
