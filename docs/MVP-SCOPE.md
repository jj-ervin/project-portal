# MVP scope — candidate v0.1

Status: proposed, pending research and ADR-001.

## Must demonstrate
1. Create a project without any external service.
2. Create a portfolio and assign projects to it.
3. Add/remove multiple capability templates per project without data loss.
4. Track tasks, milestones and deliverables.
5. Link projects with typed, inspectable relationships.
6. Attach resource references, evidence and decisions with source/provenance.
7. Search/filter/navigate across portfolios and projects.
8. Export and reimport a complete sample portfolio with stable identifiers and preserved relationships.
9. Responsive, accessible project dashboard and detail views with real working controls.
10. Cross-project privacy boundaries and clear client-facing access restrictions before any client sharing.

## Acceptance fixtures
- Construction: porch design, measurements, materials, budget and research findings.
- Research: question, protocol, sources, evidence, findings and publication milestone.
- Freelancer: client project, scope, deliverables, review and payment-status reference.
- Software (secondary): project with multiple linked repositories, not one repository per project.

## Not MVP
Payment processing, full accounting, marketplace, code editor, CI execution, construction permit certification, lab management, autonomous AI action, broad connector marketplace or custom complex workflow engine.

## Visual acceptance
Test desktop and mobile navigation; distinguish workspace/portfolio/project/capability; keyboard and focus support; semantic labels and contrast; no nonfunctional clickable elements. Capture review evidence for each end-to-end scenario.

## Release gate
Pass all three primary scenario walkthroughs, export/import round trip, permissions tests and documented accessibility review. Targets for task completion time and defects require baseline measurement, not invented thresholds.
