# ProPro

**Universal Project & Portfolio Platform**

> One place to manage the work you do, however you work.

ProPro is an adaptable project portal for construction, research, freelance, creative, business, personal and software projects. Project capabilities can be combined; GitHub and AI are optional integrations, not prerequisites.

**Current stage:** runnable local dashboard candidate on `feature/propro-002-first-workspace`; review and human visual acceptance remain open.

Current portfolio follow-up (November 7, 2026): the active checkout adds a browser-local portfolio creation, rename, membership, Home filtering, and Explorer grouping candidate. Existing version 1 project records remain compatible. See [portfolio scope and data contract](docs/PORTFOLIO-SLICE.md). Owner acceptance is still open; this note supersedes the feature-branch wording above for the current checkout and does not declare a release.

Pane follow-up (November 7, 2026): the conversation composer is contained above the bottom panel while context content scrolls independently. [Pane workflow proposals](docs/PANE-WORKFLOWS.md) preserve the suggested agent tabs, internal-assistant role, Lasso workspace, real terminal, and optional media utilities. These integrations are proposals; the current right pane remains local search and the CLI scratchpad remains command preview.

- [Product charter](docs/PRODUCT-CHARTER.md)
- [ProPro-001 scope and exit criteria](docs/PROPRO-001.md)

Development strategy: **A → C** — start with universal portfolio visibility and management, then expand toward integrated specialist workspaces. Keep the MVP small and evaluate existing solutions before committing to a stack.

## Run the dashboard

Use Node 22 or newer and run `npm ci` once to install the pinned local Cockpit GUI package. Then either open `index.html` directly or run `npm start` and visit http://localhost:8000. The app works offline after installation. Project data stays in the browser under the original `propro-project-portal-v1` key. A `file://` page and `http://localhost:8000` have separate browser storage; use Export JSON and Import JSON to move projects between them.

Run `npm test` and `npm run test:browser` for model, browser, accessibility and viewport checks. See [PROP-CKP-001B implementation record](docs/PROP-CKP-001B-IMPLEMENTATION.md) for ownership, provenance and open acceptance gates.
