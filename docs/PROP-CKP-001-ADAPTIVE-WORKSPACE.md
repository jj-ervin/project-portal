# PROP-CKP-001 — Cockpit GUI integration and adaptive UX contract

Status: **Approved UX direction; implementation pending repository-grounded audit**  
Date: 2026-11-04  
Consumer: ProPro (project-portal)  
Candidate shared UI: cockpit-gui; verify cockpit-tab and cockpit-web responsibilities before coding.

## Product decision

ProPro adopts **C — Adaptive Workspace**. The default experience is a welcoming, spacious project and portfolio dashboard. Advanced multi-panel and IDE-like tools are progressively available, never mandatory. ProPro is a universal project manager, not primarily a Git/repository manager. Construction, research, freelance, creative, business, personal, and software projects are first-class and may be combined.

## Six required UX principles

1. **Recognition over recall:** clearly labeled, visible navigation and actions; users need not memorize commands.
2. **Progressive disclosure:** simple default, advanced functionality revealed when relevant or requested.
3. **Consistent interaction:** shared behaviors for cards, menus, tabs, dialogs, keyboard navigation, and panels.
4. **Flexible project models:** mixed project types; optional domain workflows; no forced software/Git semantics.
5. **Visual acceptance from day one:** real rendered browser review and representative task testing at every milestone.
6. **Adaptive presentation:** users choose information density and layout without losing data, context, or functionality.

## Dashboard visual baseline

- Default: **large, spacious, rounded project tiles**; suggested 12–16 px corner radius, subject to shared design tokens.
- Comfortable card padding, readable project names, recognizable icons, status, optional progress, clear actions.
- Whole-card primary activation with accessible focus, hover, selected and disabled states. Nested actions must not cause accidental card activation.
- Responsive, non-overlapping content and no unintended horizontal page scrolling.
- Do not impose dense IDE chrome on users managing ordinary projects.

## Collection view modes

| Mode | Intent | Required presentation |
| --- | --- | --- |
| Large | Default, approachable dashboard | Large rounded cards with descriptive metadata and status |
| Mini | Maximize overview | Minimized tiles, retaining project identity and activation |
| Grid | Balanced density | Medium cards, core metadata and actions |
| List | Fast scanning | Rows with sortable/filterable metadata and actions |

**Separate concepts:** collection-wide Mini mode and minimizing one individual tile. A user may collapse selected tiles while others remain expanded. Preserve per-tile expanded/collapsed state where meaningful.

Shared requirements:
- Switch modes without changing project data, selection, filters, grouping, or available actions.
- Preserve scroll position where practical; avoid disorienting jumps.
- Remember view preference per collection/workspace; allow a user default and explicit reset.
- Sorting, filtering, grouping and accessible keyboard operation work in every mode.
- Responsive behavior may change column count, but must not silently replace a user's chosen mode without a clear reason.
- Generic layout/view-switching primitives belong in cockpit-gui only after verifying existing exports; ProPro owns project-specific card content, data, preferences and domain actions.
- Future reuse across portfolios, assets, documents, tasks and other collections must not force project-specific semantics into shared UI.

## Integration boundaries

1. ProPro consumes a versioned Cockpit GUI package; do not copy its source or imitate it as a substitute for integration.
2. ProPro owns projects, portfolios, workflows, records, permissions and domain models.
3. Cockpit GUI owns generic shell, components, navigation presentation, accessibility, layout styling and design tokens.
4. Verify Cockpit Tab's real responsibilities before assigning tab lifecycle, docking, layout persistence or composition to it.
5. Portable Studio remains an independent reference consumer, not a source of ProPro application code.
6. Generic gaps should be proposed upstream; avoid duplicate shared UI implementations.
7. Basic ProPro workflows must work without GitHub, AI, a terminal or developer configuration.
8. Changes to shared components require consumer regression checks.

## Workspace presentations

- **Simple:** prominent dashboard and basic project actions, minimal chrome.
- **Standard:** persistent navigation and spacious primary workspace.
- **Advanced:** optional tabs, inspectors, split panels and specialist tools.

These are presentations of the **same application and domain state**, not separate products. Switching must preserve work and context. Users retain explicit control; avoid unexpected automatic rearrangement. A user-level layout preference may be overridden per workspace or project.

## Visual and interaction acceptance gates

Evidence must include screenshots and browser interaction checks at **375, 768, 1280, and 1920 px** (plus any discovered breakpoints), with light/dark themes where supported.

- [ ] Real Cockpit GUI package is consumed, with dependency/version documented.
- [ ] Large rounded tiles match approved visual direction; Mini, Grid, List are usable.
- [ ] Individual card minimize/restore is distinct from collection view switching.
- [ ] Selection, sort, filter, grouping, navigation and actions remain consistent across views.
- [ ] No clipping, overlapping controls, lost content, broken focus, or unintended page scrolling.
- [ ] First-time user can identify project creation and reopen an existing project without instruction.
- [ ] Keyboard navigation, visible focus, accessible names/states and applicable WCAG 2.2 AA criteria are checked.
- [ ] Panel hide/restore and mode changes preserve active project and unsaved-work safeguards.
- [ ] ProPro works without Git or Portable Studio.
- [ ] Portable Studio and shared package regressions are checked where integration changes affect them.
- [ ] Screenshots and task-based browser observations are attached to review; test counts alone do not constitute visual acceptance.

## Bounded milestones

- **PROP-CKP-001A — Audit:** inspect actual ProPro, cockpit-gui, cockpit-tab, cockpit-web and Portable Studio state; produce package/API and ownership matrix, gaps and recommended minimal integration. No speculative refactor.
- **PROP-CKP-001B — Minimal consumer:** integrate the actual package into a runnable ProPro portfolio view with project navigation and representative fixtures. No specialist modules yet.
- **PROP-CKP-001C — UX validation:** verify all four collection views, individual minimization, adaptive presentations, responsiveness, accessibility and cross-consumer regressions.

## Non-goals for initial integration

No full IDE, agent execution environment, complex docking engine, mandatory Git integration, domain-specific construction/research implementation, payment processing, or duplicate UI framework.

## Decision log

2026-11-04: Approved C Adaptive Workspace; large rounded dashboard tiles; Large/Mini/Grid/List; per-tile minimization; all six UX principles; Cockpit GUI reuse subject to audit. This document specifies the desired contract, **not a claim that these features are already implemented**.
