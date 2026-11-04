# OpenProject candidate assessment — evidence pass 2

Date: 2026-11-04. Status: official-documentation review, NOT hands-on evaluation.

## Confirmed capabilities
- Work package API supports typed relations, attachments, custom-field schemas and work-package updates: https://www.openproject.org/docs/api/endpoints/work-packages/
- Relation API supports relates, blocks, requires, includes, precedes and other directed relations: https://www.openproject.org/docs/api/endpoints/relations/
- Work package types and custom fields can be enabled per project, with administrative setup: https://www.openproject.org/docs/user-guide/projects/project-settings/work-packages/
- Work package exports include CSV, XLS, PDF and Atom variants, but this does **not** prove full-fidelity portfolio round-trip: https://www.openproject.org/docs/user-guide/work-packages/exporting/
- OpenProject documents API v3, MCP and a BIM-focused BCF API; the API is not complete for all resources: https://www.openproject.org/docs/api/

## Consequences for ProPro
OpenProject already offers substantial configurable PM semantics. We must not claim that typed relationships, project-specific fields or construction integrations are missing. Its extensibility merits a serious adopt/extend trial. The ProPro-specific question is whether one project can combine domain workflows naturally without custom administrative complexity or vendor-bound export.

## Tests to run (not yet performed)
1. Build a porch project with measurements, supplier references, material estimate and permit/inspection tasks.
2. Build a research project with questions, sources, methods, findings and citation provenance.
3. Build a freelance client project with deliverables, approvals and restricted client visibility.
4. Export and reimport each scenario, preserving IDs, relationships, permissions, evidence and attachments.
5. Time setup, task completion and mobile navigation; document license/tier constraints.

## Decision impact
ADR-001 remains PROPOSED. OpenProject is a credible baseline, not a selected foundation. Next compare Plane with the same rubric and audit existing portfolio-control/DCP ownership before implementation.
