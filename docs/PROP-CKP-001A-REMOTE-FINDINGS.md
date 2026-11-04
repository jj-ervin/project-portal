# PROP-CKP-001A — Initial remote compatibility findings

Date: 2026-11-04. Scope: **GitHub remote read only**; not a local working-tree audit, not browser acceptance.

## Verified source observations

| Capability | cockpit-gui main | feature/ckp-gui-007-workbench |
| --- | --- | --- |
| `@cockpit/gui/workspace` | Exported | Exported |
| `@cockpit/gui/workbench` | Not exported | Exported as candidate |
| `@cockpit/gui/styles.css` | Exported | Exported |
| Generic card / collection export | Not advertised | Not advertised |
| Package status | `0.1.0`, private | `0.1.0`, private |

On the workbench branch, `docs/PACKAGE-CONTRACTS.md` documents `createWorkbenchUI({document, layout, explorer, content, context, ...})`. The host owns its slots and application data. The workbench provides activity rail, accessible resizable separators, optional injected width persistence, and panel visibility API. It does **not** claim split editors, docking, full UX acceptance, or project-domain behavior.

## Implications for ProPro

1. Prefer composing ProPro's portfolio dashboard inside the existing candidate workbench's host-owned `content` slot.
2. Do not duplicate activity rail, panel resizing or generic navigation where the candidate workbench already covers them.
3. The approved Large/Mini/Grid/List and individual-card minimization system is **not** a verified shared package API. Treat it as a new candidate generic capability, subject to testing in multiple consumers.
4. ProPro owns the card's project content, state, filtering, sorting and persistence. Cockpit GUI should own only generic view mechanics.
5. The workbench branch is not assumed merged or accepted. Confirm PR state, CI, actual source and Portable Studio compatibility before selecting a package ref.
6. Do not conflate Cockpit GUI with Cockpit Tab. Inspect Cockpit Tab before assigning tab lifecycle or docking responsibilities.
7. Existing private distribution and rights/provenance gates remain unchanged.

## Audit still required

- Inspect `src/workbenchUI.js`, CSS and browser tests in full.
- Inspect Portable Studio's actual dependency pin and current workbench consumption.
- Verify current PR status, branch ancestry and package test results.
- Inspect ProPro's current implementation/build setup and Cockpit Tab contracts.
- Produce a dependency/ownership matrix and runnable minimal-consumer plan.

This is an incremental evidence note, not approval to merge or publish.

## Source-level workbench review (additional verification)

Inspected `src/workbenchUI.js` and `tests/workbenchUI.test.js` on `feature/ckp-gui-007-workbench`:

- Factory requires host-provided `document`, `layout`, `explorer`, `content`, `context`. It inserts a nav activity rail and two resize separators into the layout.
- Custom `activities` and `onActivity(id)` are supported, so ProPro can supply portfolio-oriented labels without modifying generic code.
- The frozen API is `activate(id)`, `widths()`, `setPanelVisible(panel, visible)`, `panelVisible(panel)`.
- Optional injected storage persists **panel widths only**, not panel visibility or project-level layout mode. ProPro must not assume full workspace preference persistence.
- Unit tests cover activity selection, keyboard resize/width persistence, independent panel hide/restore, and invalid panel names.
- **Potential integration risk to verify in real browser:** pointer resizing and narrow viewport behavior; the inspected unit tests do not establish visual correctness. The factory has no `destroy()` API; confirm lifecycle expectations before dynamic remounting.
- Workbench's default activity labels include creative-specific terms (Documents, Assets), but consumer-supplied activities provide an escape hatch. ProPro should explicitly pass its own navigation definitions.
- There is no card collection or view-mode implementation in this source. Do not mistake panel visibility for individual project-tile minimization.

**ProPro minimum integration mapping:** `layout` = outer Cockpit shell; `explorer` = project/portfolio navigation; `content` = dashboard and project views; `context` = optional inspector. Domain-specific cards remain ProPro-owned until a generic collection primitive is approved.

No runtime tests were executed in this remote source review.
