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

- Human owner acceptance of the actual running UI and task-based usability review.
- Screen-reader, physical touch, zoom/magnification and operating-system high-contrast checks. Automated axe checks do not establish full WCAG conformance.
- Firefox viewport and axe checks need a working resize in this Windows Playwright environment.
- Generic Cockpit GUI collection API requires a second distinct consumer, compatibility review, package/version decision and approval before promotion. This implementation makes no new Cockpit GUI API claim.
- Rights/provenance review before any public distribution; no merge, release or publication in this work.
