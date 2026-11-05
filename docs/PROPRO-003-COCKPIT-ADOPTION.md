# PROPRO-003 — Cockpit GUI adoption and workspace UX

Status: proposed; implementation not yet completed. This document defines an implementation gate, not a claim of successful integration.

## Verified source inventory (2026-11-04)

- `jj-ervin/cockpit-gui` README and `docs/PACKAGE-CONTRACTS.md`: private `@cockpit/gui@0.1.0` exports `@cockpit/gui/workspace` (`createWorkspaceUI`), `@cockpit/gui/styles.css`, and command-palette UI. The workspace provides accessible tabs, keyboard navigation and panel-state presentation. It is **not** a complete VS Code-style application shell, file explorer, or persistent layout manager.
- `jj-ervin/cockpit-core`: default-branch README currently contains only a title; do not assume a ready runtime integration contract.
- `jj-ervin/project-portal`: PROPRO-002 prototype is a single static `index.html`, storing project data locally. The New Project form has been exercised by the owner; other interactions and persistence require testing.

## Architecture decision (proposed)

ProPro owns portfolio/project domain objects, persistence, resources, tasks, relationships, and project-specific capability panels. Cockpit GUI owns reusable workspace tab/panel behavior and shared component styles. Host-specific explorer tree, activity rail, resize handles, layout persistence, command routing, and project-specific editors remain **ProPro host features** until a demonstrated cross-product need justifies moving them to Cockpit GUI. Avoid importing Cockpit's private `src/` internals or copying code. Do not depend on unfinished Cockpit Core APIs.

## Implementation sequence

1. Preserve existing user data and current localStorage key/schema; add an export/restore check before migration. No destructive reset.
2. Add a proper package-based app build (Node >=22) and install the **private, integrity-pinned** Cockpit GUI 0.1.0 package artifact according to its tested consumer adoption approach; never rely on a public npm release, sibling source imports, or a mutable latest tag. Confirm artifact availability and license/provenance constraints before use.
3. Integrate `createWorkspaceUI` with host-owned tab and panel roots. Adapt ProPro project sections to stable IDs and explicit `onNavigate` host callbacks. Test that state survives navigation.
4. Build VS Code-inspired application framing: left activity rail, project explorer, central document/tab area, status bar, optional secondary panel. Keep projects navigable without a command palette. No deceptive nonfunctional icons.
5. Add in-page Create/Rename/Import confirmation flows and keyboard-accessible explorer; no `prompt()`/`confirm()` dependencies.
6. Verify keyboard navigation, focus, reflow, small-screen behavior, and real browser workflows. Keep PR in draft until tests and visual evidence exist.

## Visual acceptance criteria

- Desktop 1440x900: clear rail/explorer/editor/status regions, aligned spacing, legible hierarchy, no clipped labels, no dead controls.
- Laptop 1280x720: editor remains usable with sidebar visible; explorer width adjustable by mouse and keyboard or a clearly accessible equivalent.
- Mobile 390x844: navigation collapses deliberately; editor remains reachable; no horizontal page overflow.
- Open two project sections; active tab and panel remain synchronized. Close/reopen behavior must be explicitly designed, not simulated by dead close icons.
- Keyboard: visible focus; tab/arrow-key navigation per Cockpit contract; project explorer operable without a pointer; Escape closes transient dialogs.
- Project creation, rename, task creation, capability changes, export/import and reload persistence tested against a sample project. Test malformed imports and cancellations without data loss.
- Before merge, capture actual screenshots at all three sizes and record pass/fail for every criterion. Mockups alone do not satisfy acceptance.

## Exit gate

Do not declare PROPRO-003 complete without a reproducible install, actual Cockpit GUI package integration, passing tests, screenshots, and owner acceptance of the running UI. Keep the existing PROPRO-002 prototype working until replacement is verified.

## PROP-CKP-001B local implementation note (2026-11-05)

The minimal dashboard candidate, its tested package integration, and its still-open human acceptance gates are recorded in `docs/PROP-CKP-001B-IMPLEMENTATION.md`. The original version 1 data key/schema is retained, and the active feature branch now serves the dashboard through `npm start`. This note does not close PROPRO-003 or approve merge/publication.
