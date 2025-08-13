# Drishti Documentation Index

_Last updated: 2025-08-13 (AET)_

## Purpose
This README is the **master index** for all project documentation.  
It covers **current V2 planning & build docs**, archived V1 material, governance/security, and supporting references.

---

## 📂 Current Build — Drishti_V2

> Start here: **[V2 Local Index](./v2/README.md)** — per‑epic stories, PRD/Epics/Feature Tree in both `.md` and originals.

### Planning & Scope
- **Detailed Epics:** [EPICS.md](./v2/EPICS.md) / [Drishti_V2_Detailed_Epics.docx](./v2/Drishti_V2_Detailed_Epics.docx) — Single source of truth for all epics (MVP, Pro, Add‑on).  
- **PRD:** [PRD.md](./v2/PRD.md) / [Drishti_V2_Master_PRD_2025-08-12.docx](./v2/Drishti_V2_Master_PRD_2025-08-12.docx) — Functional + non‑functional requirements across tiers.  
- **MVP Feature Tree:** [FEATURE_TREE.md](./v2/FEATURE_TREE.md) / [PDF](./v2/Drishti_V2%20-%20MVP%20Feature%20Tree%20.pdf) — Visual breakdown of MVP feature set.
- **User Stories (per‑epic working set):** [stories/USER_STORIES.md](./v2/stories/USER_STORIES.md) — index + conventions + NFRs.  
  - Compiled references for search: [MVP](./v2/Drishti_V2_USER_STORIES_MVP.md), [Pro/Post‑MVP](./v2/Drishti_V2_USER_STORIES_PRO.md).

### Supporting Docs
- [Planning Context Discovery](./v2/Drishti_V2_Planning_Context_Discovery_2025-08-11.docx) — Repo state, scope confirmation, non‑goals.  
- [Competitor Pricing Analysis](./v2/Drishti_V2_Competitor_Pricing_2025-08-12.csv) — Price/features comparison (global scope).

---

## 📂 Archived — Drishti_V1
- Located in `DOCS/v1/migrated/`.  
- Kept for historical context; **do not use for V2 build**.  
- Includes: V1 PRD, user stories, completion log.

---

## 📂 Governance & Security
- [GOVERNANCE.md](./GOVERNANCE.md) — Decision‑making, approvals, branching rules.  
- [SECURITY.md](./SECURITY.md) — Secure coding, scanning, vulnerability handling.  
- [PRE_PUBLIC_SCAN_REPORT.md](./SECURITY/PRE_PUBLIC_SCAN_REPORT.md) — Last security audit before repo was made public.

---

## 🔍 How to Use This Index
- **New contributors:** Start with **Detailed Epics**, then read **MVP User Stories** (per‑epic files under `DOCS/v2/stories/`).  
- **Agents/automation:** Execute from the **per‑epic story files**; use PRD/Epics for requirements context.  
- **Product decisions:** See **Planning Context Discovery** for scope & non‑goals.  
- **Market references:** Use **Competitor Pricing** for pricing/feature comparisons.

---

## ✅ Maintenance Rules
1. **Update this README** whenever a doc is added, renamed, or replaced.  
2. Keep **only the latest version** of each planning doc in `DOCS/v2/`.  
3. If a doc becomes obsolete, move it to `DOCS/v2/archive/` (or `DOCS/_archive/v2-legacy/`) with a short `ARCHIVED.md`.  
4. (Tip) Add to `.gitattributes` to avoid noisy diffs:  
