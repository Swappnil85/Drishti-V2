# Drishti_V2 — Build Documentation

_Last updated: 2025-08-12 (AET)_

## Purpose
This README is the **local index** for Drishti_V2 build documentation.  
It reflects the files currently in this `DOCS/v2/` folder. Older PRDs, epics, and stories have been superseded.

---

## 📂 Core Planning Docs (current)

| File | Purpose |
|------|---------|
| **Drishti_V2_Detailed_Epics.docx** / **EPICS.md** | Final definition of all epics (E1–E21) with scope, DoD, dependencies, KPIs, and risks. |
| **Drishti_V2_Master_PRD_2025-08-12.docx** / **PRD.md** | Master PRD for V2 (functional + non‑functional requirements). |
| **Drishti_V2 - MVP Feature Tree .pdf** / **FEATURE_TREE.md** | Visual map of MVP features, pricing tiers, and differentiation. |

---

## 📂 User Stories (agent working set)

The `stories/` folder contains **per‑epic Markdown files** (agent‑ready).  
- Open the epic you’re working on (e.g., `E4-NAV_UI.md`) and implement stories top‑to‑bottom.  
- `USER_STORIES.md` inside `stories/` is the index + conventions + shared NFRs.  
- `stories_manifest.json` is machine‑readable (for issue automation).

**Compiled references (searchable only):**  
- **Drishti_V2_USER_STORIES_MVP.md** — _reference only_ (all MVP stories in one file).  
- **Drishti_V2_USER_STORIES_PRO.md** — _reference only_ (all Pro/Post‑MVP stories).  

> Devs should work from `stories/*.md` files, not the compiled reference docs.

---

## 🔁 Recommended MVP Build Order
1. **E4** — Nav UI & Core Layout  
2. **E5** — Onboarding & Settings  
3. **E6** — Accounts & CSV Import  
4. **E7** — Net Worth Engine  
5. **E8** — Goals  
6. **E9** — Scenarios (Basic)  
7. **E10** — Data Viz & A11y  
8. **E11** — Monetization  
9. **E12** — Telemetry  
10. **E13** — Privacy & Security  
11. **E14** — Export/Share  
12. **E17** — Store Release Ops

---

## 🗑️ Deprecated (safe to remove or archive)
- `PRD.md` (old) — replaced by **Drishti_V2_Master_PRD_2025-08-12.docx**.  
- `EPICS.md` (old) — replaced by **Drishti_V2_Detailed_Epics.docx**.  
- `USER_STORIES.md` (old) — replaced by `stories/` + compiled references above.

> Prefer archiving to `DOCS/_archive/v2-legacy/` to keep history.

---

## ❓ Other docs in repo — keep or archive?

| File | Keep? | Rationale |
|------|------|-----------|
| **ARCHITECTURE.md** | **Keep if current**; otherwise archive. | Should describe V2 app architecture (modules, data flow, local DB, encryption, entitlement gates). If it references deprecated systems (e.g., bank sync) or V1 tech, archive. |
| **CUTOVER_PLAN.md** | **Keep if you’re planning a V1→V2 transition**; else archive. | Useful when dates/environments and rollback are active. If V2 is greenfield or cutover is done, archive. |
| **PARITY_CHECKLIST.md** | **Keep if tracking feature parity with V1**; else archive. | If parity is not a goal for V2, or checklist is stale, archive. |

---

## ✅ Maintenance
- Update this README whenever files in `DOCS/v2/` change.  
- Archive stale documents rather than deleting when possible.  
- Keep story IDs stable (`E{epic}-S{#}`) and update `stories_manifest.json` if stories move.  
