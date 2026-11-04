# ProPro-001 — Discovery, competitive analysis and architecture

Status: planned; no implementation authorized by this document.

## Objective
Deliver an evidence-supported build/adopt recommendation and a tightly scoped universal-project MVP specification, without creating another competing control plane.

## Workstreams
1. Competitor evaluation: GitHub Projects, Plane, Backstage, OpenProject and relevant freelancer/construction/research tools. Compare workflows, extensibility, pricing, data portability and verified gaps; record sources and dates.
2. User research: test workflows with solo freelancer, construction project manager/DIY builder, researcher and multi-repository developer. Distinguish assumptions from observations.
3. Existing-system audit: inspect Portfolio Control, DCP/DXP, Cockpit GUI, Marlin and Governance Commons for reusable interfaces, ownership boundaries and actual implementation maturity. Do not presume integration readiness.
4. Domain model: define stable IDs, project/portfolio/workspace distinction, typed relationships, composable capabilities, access boundaries, provenance and versioned export.
5. Experience design: information architecture, onboarding, adaptive views, mobile/desktop responsive prototype, accessibility and explicit visual acceptance criteria.
6. Architecture decision: evaluate adoption/extension versus standalone build; document tradeoffs, integration contracts, migration risks and ADRs.
7. MVP plan: smallest usable vertical slice, tests, milestones, non-goals and measurable exit criteria.

## Required deliverables
- docs/research/competitive-matrix.md with dated source links and confidence
- docs/research/user-workflows.md with observations and assumptions
- docs/architecture/domain-model.md with entities, relations and examples
- docs/architecture/integration-boundaries.md with verified reuse evidence
- docs/design/experience-spec.md with accessibility and visual acceptance criteria
- docs/decisions/ADR-001-build-vs-adopt.md
- docs/MVP-SCOPE.md with release tests

These paths are planned deliverables, not yet completed documents.

## Exit criteria
Demonstrate three distinct project scenarios (construction, research, freelance), an evidence-backed competitive comparison, a documented decision on build versus adopt, a testable model and a visually reviewable prototype. Resolve overlaps with existing systems before code implementation.

## Change control
Changes to mission, universal model, scope, or product ownership require an explicit recorded decision explaining alternatives and migration effects. New features must show user value and MVP impact.
