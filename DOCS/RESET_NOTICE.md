# Frontend Reset Notice

We are archiving the current frontend (V1) and preparing a clean Frontend V2. The backend and shared packages remain unchanged.

- Decision: Keep backend, rebuild frontend as V2 with a drastically reduced MVP (Auth → Dashboard net worth value → Accounts list/detail).
- Archived V1 path: `apps/_archive/mobile-v1/`
- Coding freeze: No new frontend implementation until PRD, Epics, and User Stories are approved in DOCS/v2.

Rationale:
- Current V1 has architectural and testing issues that slow delivery.
- Reset-Lite enables a lean, testable foundation without risking backend stability.

Next steps (planning only):
- Author PRD, epics, and user stories under DOCS/v2.
- Define contract tests for backend endpoints and finalize façade plan (if needed).

