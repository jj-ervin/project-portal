# ProPro-002 — First working workspace

Status: implementation prototype; not production-ready.

## Run
Open repository root `index.html` in a modern browser, or serve the repository directory with `python -m http.server 8000` and visit http://localhost:8000. The latter is recommended for consistent browser storage behavior. No dependencies, server, account or GitHub connection required.

## Implemented
- Create, rename and switch projects.
- Attach multiple construction/research/freelance/development/creative/business capability labels to a project.
- Add and remove tasks, resources, evidence and links as simple titled entries.
- Browser-local persistence with JSON export/import (import replaces current local data after confirmation).
- Responsive two-column/one-column layout, visible focus indicators, semantic controls and status announcements.
- Specialized capability tabs explicitly identify themselves as not implemented rather than pretending to be functional.

## Not yet implemented
Portfolio hierarchy, rich typed relationships, file uploads, permissions, multi-user collaboration, offline synchronization, full specialist editors, tests, AI or connectors. Browser storage is per-origin and may be cleared; export backups are essential. No user data should be treated as confidential on a shared browser.

## Manual acceptance checklist (not yet executed)
- [ ] Create a construction project and enable Research; switch capability tabs.
- [ ] Add a task, resource, evidence entry and link; reload and confirm persistence.
- [ ] Export, clear browser storage, import and confirm all records return.
- [ ] Create a freelance project and a research project without external accounts.
- [ ] Use keyboard-only navigation and test mobile layout at 375px.
- [ ] Inspect for accessibility and data validation failures.

## Next implementation milestone
Add actual portfolios and typed cross-project relationships, then implement domain-specific views using the shared model. Add automated browser tests before claiming production readiness.
