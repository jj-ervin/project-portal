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

The composer now offers keyboard-operable `#` capability tags, `@` project references and `/` informational command suggestions. Suggestions use only local project data and the two informational previews. No CLI execution, web search, file search, AI provider or file transmission was added. The GUI package and ProPro remain independent through the versioned tarball boundary. Pointer and keyboard resizing, reload restoration, reset, and 390px bottom-dock reflow were exercised in the browser. Drag docking, arbitrary panel placement and detached windows remain open.

### Panel controls in the top bar — 2026-11-05

Owner visual feedback moved placement and visibility out of the conversation pane and into a compact top-bar icon group modeled on familiar editor layout controls. The group toggles the primary sidebar, bottom conversation panel and right conversation panel; a neighboring layout control restores the default arrangement. Each icon has an accessible name, tooltip, keyboard focus and pressed state. Clicking an active bottom/right icon hides that panel; clicking it again restores that placement. The pane header now contains only its identity. Updated 390px, 1280px and bottom-docked captures verify the layout, while the browser suite checks the controls and narrow-width fit.

### Tabbed utility pane and side swap — 2026-11-05

The conversation pane now contains four keyboard-accessible views: Conversation, CLI scratchpad, Problems and Notes. The CLI scratchpad previews `/help` and `/status` locally and cannot execute commands. Problems reports local project-data loading state; Notes save separately from version 1 project records in browser storage. Tab choice also persists separately. The top Layout menu swaps the left and right side panes; the same context pane can still occupy the bottom. Top bar icons toggle whichever panel occupies their region. The private Cockpit GUI `0.1.2` package owns layout, resize and persistence while ProPro owns the view content. Running captures include `docs/screenshots/propro-docked-1280.png` and `docs/screenshots/propro-swapped-1280.png`; browser tests cover tab selection, reload, side swap, resize labels, local-only command behavior, data preservation and automated accessibility checks.

This slice does not connect a system terminal, email, calendar or external widget. Those need explicit provider, permission and persistence contracts before pinning. Arbitrary placement of every view into every region, drag reorder and detached windows remain future work.

Package provenance: Cockpit GUI source commit `35ec769ea4e74d8357fad4d75b735ee9d97fe669`; private `vendor/cockpit-gui-0.1.2.tgz` SHA-256 `bc0eff3c72e8f9997b91c63c15e241c154f525b9374c1baa81703fca2850cc1a`. The npm lock pins its integrity. This is a local package candidate, not a publication or release.

### Center editor and viewer tabs — 2026-11-05

Owner clarification separates the central work area from the movable surrounding panes. ProPro shows Home as the center dashboard view; opening a project activates its own center tab. Open CLI creates a separate local command-preview tab without relocating or replacing the bottom panel. Open file accepts local text, Markdown, selected code formats and PDF for a read-only center preview. Text is inserted as text, never executed or interpreted as HTML; PDFs use a browser object URL that is revoked when the tab closes. File contents are held only for this page session, with no upload or project-data mutation. Tabs support selection, close actions and keyboard arrow/Home/End navigation. Project records retain their version 1 schema. `docs/screenshots/propro-editor-tabs-1280.png` and `docs/screenshots/propro-editor-tabs-390.png` are running captures. Browser checks cover project tabs, CLI draft retention between tabs, local file display, script-text non-execution, close behavior, narrow layout and project-data isolation.

The left activity rail, expandable Explorer, bottom utility panel and right conversation panel remain separate from center work tabs. This slice does not provide a live terminal, writable document editor, connected agent session or web-page tab; those require host session/file/provider contracts, save and recovery rules, and permission review. The previous tabbed utility panel is still a panel view, not the implementation of the main editor area.

### Home returns to the dashboard view — 2026-11-05

The owner clarified that Home is the center dashboard destination, not a permanent editor tab. The default dashboard and Home activity now hide the center tab strip. Open project, CLI and local-file tabs stay in memory and a Resume work action restores the most recent work tab. Open dashboard as tab is an explicit option; using Home afterward returns to the untabbed dashboard. Current dashboard customization includes card view choices and per-card minimization; arbitrary home widgets and saved dashboard arrangements remain future work. A 390px browser check found and fixed a host responsive layout defect when Explorer was hidden: center content and the conversation pane now stack without overlapping the activity rail. The running `propro-home-no-explorer-390.png` capture records that state.

### Workspace rail and Home pins — 2026-11-05

The activity rail now distinguishes Home from Workspace. Home shows the dashboard view without the editor strip; Workspace resumes the last open work tab, or shows an empty work view when none exists. This keeps project/CLI/file tabs separate from the surrounding panes. The optional dashboard-as-tab control remains. A later preference may choose a startup destination, but no extra global mode switch is needed for this slice.

Home pins are browser-local preferences in `propro-home-pins-v1`, separate from version 1 project records and the view/layout preferences. A project card or project entry can be pinned; the dashboard renders up to 30 pinned items and each project/entry opens a center tab. Resources, Evidence and Links are title-based project entries here, not uploaded binary assets or external integrations. The optional Workspace activity chart is calculated from locally saved task/resource/evidence/link counts and updates when records change. It is labeled as local data and is not a live feed. Invalid targets disappear from the rendered pins; removed entries and replaced projects are pruned from saved pins. Running captures at `docs/screenshots/propro-pinned-home-1280.png` and `docs/screenshots/propro-pinned-home-390.png` verify the populated dashboard. Browser checks cover pin persistence, entry-tab opening, Workspace navigation, project-data isolation, count accuracy, narrow reflow and automated accessibility rules.

Future widget and live-data adapters need an explicit source identity, freshness/refresh state, permissions, loading/error/stale states, and a safe action contract. Pinning a feature or tool must not trigger execution. Current pinned entry tabs expose the local record and a project link; they are not document or asset viewers.

### Independent bottom tools correction — 2026-11-05

Owner review corrected the earlier pane interpretation above: the bottom layout button must open a distinct bottom region, not move Conversation out of the right pane. ProPro now keeps the composer and conversation content in the side pane while CLI scratchpad, Problems and Notes occupy tabs in `#bottom-panel`. The top controls independently toggle the right side pane and bottom tools. The bottom height can be resized by pointer or keyboard and its visibility, height and selected tool persist separately from version 1 project data. The side-swap action still exchanges Conversation and Explorer; it does not turn either into the bottom pane. A saved legacy bottom-docked conversation layout is moved back to the right when loaded and opens the new bottom region.

The running capture `docs/screenshots/propro-bottom-tools-1280.png` shows both panes open together. Browser checks cover simultaneous visibility, separate toggles, resize, reload, reset, narrow layout, local command preview, notes and accessibility. This is a ProPro host slice using the private Cockpit GUI `0.1.2` side-pane package; a reusable bottom-region API remains to be promoted into that package. The earlier description of four tabs inside Conversation and context docking to the bottom is superseded by this correction.

## Reusable bottom slot adoption — 2026-11-05

Cockpit GUI `0.1.3` promotes the independent bottom region into an optional package slot. ProPro supplies the host-owned `#bottom-panel` and its CLI scratchpad, Problems and Notes views; the package now owns bottom visibility, height, resize separator and persistence through the existing workbench layout key. The side Conversation pane and composer remain independent. ProPro migrates previously saved `propro-bottom-pane-v1` settings into the shared layout on first load, while the package migrates a legacy bottom-docked context to right placement with bottom tools open. The earlier host-owned sizing and visibility implementation has been removed.

The private packed artifact is `vendor/cockpit-gui-0.1.3.tgz` from Cockpit GUI source commit `96ffa2fc6d787f76eae4a58fdca790cf95a2b11e`, with SHA-256 `b6e9370c9c1787935546b25147aa4a495e955f86991ad5c82eb6fc0c59374969`; npm lock pins its integrity. Cockpit GUI unit, package and browser tests pass; ProPro browser tests cover independent panes, pointer/keyboard resizing, reload/reset, migration, narrow reflow and accessibility. This is a private local package candidate, not a publication or release.
