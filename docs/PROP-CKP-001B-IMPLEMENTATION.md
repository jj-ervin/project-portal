# PROP-CKP-001B — Runnable adaptive project dashboard

Status: implemented locally for review, not accepted or published. 2026-11-05.

## Ownership and source audit

| Concern | Owner and implementation |
| --- | --- |
| Workbench activity rail, responsive panel layout, keyboard/pointer resize | Cockpit GUI `feature/ckp-gui-007-workbench` public `@cockpit/gui/workbench` export. ProPro consumes its packed artifact. |
| Generic tabs, splits and workspace lifecycle | Cockpit Tab candidate. ProPro has no tab or split requirement in this dashboard and does not consume it. |
| Project records, capabilities, tasks, resources, evidence, links, card content and actions | ProPro host; existing version 1 data contract retained. |
| Large/Mini/Grid/List, card minimization, selection, preference persistence | ProPro host candidate until the proposed generic collection API is tested in a second distinct consumer. Data and preference keys are separate. |
| Creative project documents and files | Portable Studio host; its workbench consumer remains separate and unmodified. |

The remote documentation branches `docs/prop-ckp-001-adaptive-workspace` (`d551de7`) and `docs/ckp-gui-propro-adaptive-collections` (`4089897`) were fetched and their documents recovered into the current local feature branches without switching branches or overwriting existing edits. Cockpit GUI PR #7 and ProPro PR #3 are open. Portable Studio already consumes vendored Cockpit workbench code and has no generic collection consumer yet.

## Package provenance

- Cockpit GUI source: `jj-ervin/cockpit-gui` `feature/ckp-gui-007-workbench` at `3cfc308f75884eabcb5dc5c092cbf2bb00449f81`.
- Packed private `@cockpit/gui@0.1.0` artifact: `vendor/cockpit-gui-0.1.0.tgz`, SHA-256 `34ee4ca3ce17015dee1d3db896da38c2ac632b08dc1c4cdde154f95ffdf44124`. `package-lock.json` pins npm integrity. The artifact includes the package's MIT license and public workbench/CSS exports.
- `npm ci` installs from this local artifact. `index.html` loads its assets with relative paths, so opening the file directly and using `npm start` both work after installation. `server.mjs` exposes only the assets required by the browser. No sibling checkout is needed at runtime. Browser storage is separate for the file and localhost origins; export/import is needed to transfer projects.

## Verification

- ProPro model: 2 passed. Browser: 5 passed in Chromium and 5 passed in WebKit, including direct `file://` opening, version 1 data compatibility, valid and malformed import handling, selection and card state across modes/reload, 375/768/1280/1920px overflow checks in every mode, and automated axe WCAG 2.2 AA rule checks. Microsoft Edge also loaded the direct file with the workbench grid, four icons and no page errors.
- Firefox: 3 interaction/import tests passed. The combined viewport/screenshot/axe test timed out at `page.setViewportSize` before loading the app, including on a 90-second retry. Firefox visual and axe results are unverified.
- Cockpit GUI: 12 unit, 1 package, 11 browser passed on the inspected source branch.
- Cockpit Tab: 2 unit passed, though it is not a runtime dependency.
- Portable Studio: 66 unit passed, 3 platform skips; 21 browser passed on its existing workbench consumer.
- Captured screenshots: `docs/screenshots/propro-{375,768,1280,1920}.png`. Human visual inspection found no clipping or overlap at these widths. The 375px project navigation scrolls horizontally by design.
- Direct Edge file-opening screenshot: `docs/screenshots/propro-edge-file.png` (1280px, empty state).

Follow-up presentation change: the four text layout tabs were replaced with original inline SVG icon buttons inspired by the owner's references. The selector keeps the same saved modes and exposes accessible labels, hover titles, focus outlines and `aria-pressed` state. The screenshots above reflect the icon selector.

Owner feedback on scale led to a compact spacing pass on 2026-11-05: the header, dashboard gutters and card padding were reduced, and the workbench now fits its content instead of filling a tall empty desktop region. The four requested viewport screenshots and direct Edge file screenshot were refreshed. Card content and minimum touch target sizes remain legible.

## Open gates

### Refined Adaptive Workspace slice — 2026-11-05

The host now labels the activity rail action Home and returns focus to the dashboard when it is used. Balanced is the default workspace density; Refined tightens spacing and card radius while keeping control sizes and readable type. The selector saves only `propro-workspace-density-v1`, separate from version 1 project data and existing card-mode preferences. A browser regression covers return, focus, persistence and project-data preservation. This is the first slice of the Cockpit GUI CKP-GUI-007 UX baseline; docking, multiwindow behavior and the universal composer remain planned.

Chromium verification: 2 model tests and 6 browser tests passed; the browser suite checked overflow and automated axe rules at 375, 768, 1280 and 1920px. Actual running captures were refreshed at those widths for Balanced and added at `docs/screenshots/propro-refined-1280.png` for Refined. Visual inspection of the 375px Balanced and 1280px Balanced/Refined captures found no clipped critical controls or unintended page overflow. Human visual approval and task-based usability testing are still open.


- Human owner acceptance of the actual running UI and task-based usability review.
- Screen-reader, physical touch, zoom/magnification and operating-system high-contrast checks. Automated axe checks do not establish full WCAG conformance.
- Firefox viewport and axe checks need a working resize in this Windows Playwright environment.
- Generic Cockpit GUI collection API requires a second distinct consumer, compatibility review, package/version decision and approval before promotion. This implementation makes no new Cockpit GUI API claim.
- Rights/provenance review before any public distribution; no merge, release or publication in this work.

## Refined Balanced correction — 2026-11-05

The density-selector slice above was too narrow for the adopted UX direction. It remains historical evidence, but the selector is removed from the current screen. Refined Balanced is now the default visual composition: compact top bar with global search, a four-action activity rail, project explorer, central dashboard with counts and cards, and a visible right Cockpit conversation/search pane. Home returns to the dashboard. The context pane can be hidden and restored.

The composer now performs local project, entry, `#` capability-tag and `@` project-reference search. `/help` and `/status` are informational previews only; there is no CLI execution or AI provider connection. The `+` picker holds selected files locally and lets the user remove them; it does not upload or attach them to any execution request. Web/file search, full command routing, docking, bottom panels, detached windows and customizable themes remain future milestones. Version 1 project data and the packaged Cockpit GUI boundary are unchanged.

Running screenshots are captured at 375×900, 390×844, 768×900, 1280×800, 1440×900 and 1920×900. Chromium browser checks cover the existing project flows, the new navigation/search/composer slice, overflow and automated axe accessibility checks. Human visual approval, screen-reader and task-based usability review remain open.

## Docking and composer continuation — 2026-11-05

ProPro now consumes the separately packed private Cockpit GUI `0.1.1` candidate from source commit `aec7ba63cea587e36262483cb2788d63beaf053d` in `vendor/cockpit-gui-0.1.1.tgz` (SHA-256 `c97bd6594a656b55cc3b6b357eadce3d84a13a2250093e1360c78f821c42b027`). The npm lock pins its integrity. The Layout menu can hide/show Explorer, dock the conversation pane right/bottom and restore defaults. The conversation header exposes the dock action directly. The workbench retains dimensions, position and panel visibility across reload. These controls change presentation only; they do not mutate project records. `docs/screenshots/propro-docked-1280.png` captures the running bottom-docked state.

The composer now offers keyboard-operable `#` capability tags, `@` project references and `/` informational command suggestions. Suggestions use only local project data and the two informational previews. No CLI execution, web search, file search, AI provider or file transmission was added. The GUI package and ProPro remain independent through the versioned tarball boundary. Drag docking, arbitrary panel placement and detached windows remain open.
