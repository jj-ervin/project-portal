# Unified workspace vision — ProPro

Status: product direction approved in conversation; implementation phases remain proposals.

## Product promise
ProPro is one coherent application to **do project work**, not only track it. Users should access relevant tools, documents, activities and specialized workspaces from a common project context, without being forced to manage separate apps manually. Integration is an implementation strategy, not an excuse for a fragmented experience.

## Experience requirements
- Unified navigation, search, notifications, permissions, files and project context.
- Users can combine construction, research, freelance, development, creative and business capabilities in a single project.
- Specialized views operate on shared entities and relationships; avoid duplicate data entry and inconsistent status.
- A project opens to a useful overview, with context-specific workspace tabs and tools; capability selection is editable.
- External applications may power some features, but transitions, identity, permissions, provenance, export and error handling must be coherent.
- Distinguish native tools, embedded tools and linked external tools honestly; never claim full integration when it is only a link.
- AI and automation are optional and subject to human oversight.

## Reference scenarios
**Construction**: a porch project combines measurements, plans, research, budget, material sourcing, photos, work items and inspection references.
**Freelance**: a client website combines scope, proposal, approvals, creative files, code, deliverables, expenses and invoice-status references.
**Research**: a study combines sources, notes, datasets, methodology, evidence, findings and publication workflow.
**Development**: one project links multiple repositories, build status, releases, documentation and cross-project dependencies.

## Capability maturity levels
1. Linked: opens external tool with project context where possible.
2. Connected: reads/syncs metadata through an explicit adapter and permission model.
3. Embedded: renders tool inside ProPro with consistent navigation and safe session boundaries.
4. Native: performs the work using ProPro-owned components and data.

No capability may be advertised as native or integrated merely because a URL is present. Each module must state its maturity and dependencies.

## Phased delivery
**A**: portfolio/project navigation, adaptive project dashboard, shared core, resources, tasks, relationships, files/references and export. Deliver a real usable interface.
**B**: selected specialist workspaces, collaboration, integrations, evidence and cross-project intelligence.
**C**: deeper in-app creation/execution across disciplines, modular tools, advanced automation.

## Acceptance criteria for the first UI slice
- From the dashboard, create and open each of the construction, research and freelance fixtures.
- Add two different capability modules to one project and switch views without losing context.
- Show tasks, resources, evidence and linked projects in one place, with working actions.
- Clear navigation on narrow mobile and desktop layouts, accessible labels, focus and contrast.
- No fake buttons, placeholder actions masquerading as implemented features or unexplained app redirects.
- Demonstrate save/reload and export of project state, not just static mockups.

## Architecture guardrail
Evaluate reusable engines and services for cost and maturity, but retain ProPro's unified user experience as a non-negotiable product requirement. Existing Portfolio Control, DCP/DXP, Cockpit, Governance Commons and Marlin retain their own authority unless a documented migration decision explicitly changes it.
