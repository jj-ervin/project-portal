# CKP-GUI-007 — Project Portal composer consumer check

Date: 2026-11-06. Library source: `jj-ervin/cockpit-gui` commit `34fc8eabb77749dd5357c3e7151f6b9518e239f9`. The private `@cockpit/gui@0.1.5` artifact is `vendor/cockpit-gui-0.1.5.tgz`, SHA-256 `91293fb719e0c6550742b936b2b599860c08a9a44765b9a01f59bfa5c39c5d70`, pinned by the npm lockfile integrity value.

Project Portal loads the package's browser composer entry and supplies its own suggestion labels, local search, project records and command previews. The component displays local attachment names and sizes and removes them on request. It does not read file contents, upload, execute commands or alter the version 1 project storage schema.

## Evidence

- Library: 14 unit, 1 offline package-install and 12 browser tests passed.
- Project Portal: 2 model and 12 Chromium browser tests passed. The browser suite exercises Explorer selection, center tabs, composer keyboard suggestions, file attachment removal, pane resizing and persistence, local data preservation, responsive fit and axe WCAG 2.2 AA checks.
- Running screenshots at 1280×800 and 390×844: [desktop composer](screenshots/propro-composer-1280.png) and [narrow composer](screenshots/propro-composer-390.png). The browser test generated these from the served application with a sample project and a selected local file. At both widths the attachment chip and remove button are visible, and the narrow view has no horizontal page overflow. The existing responsive suite also captures 1440×900.

Functional result for this bounded workflow: PASS. Visual result: NOT TESTED by owner. Human usability and screen-reader result: NOT TESTED. The proposed CKP-GUI-007 visual acceptance gate remains open. The supplied project directory contained no UX/HCI book files for direct review; the existing design decisions and acceptance contract informed this slice. No claim is made for 200% native zoom, physical touch, detached panels or connected file, Git, chat or CLI providers.
