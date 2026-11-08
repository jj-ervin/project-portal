# ProPro

**Universal Project & Portfolio Platform**

> One place to manage the work you do, however you work.

ProPro is an adaptable project portal for construction, research, freelance, creative, business, personal and software projects. Project capabilities can be combined; GitHub and AI are optional integrations, not prerequisites.

**Current stage:** runnable local dashboard candidate on `feature/propro-002-first-workspace`; review and human visual acceptance remain open.

Current portfolio follow-up (November 7, 2026): the active checkout adds a browser-local portfolio creation, rename, membership, Home filtering, and Explorer grouping candidate. Existing version 1 project records remain compatible. See [portfolio scope and data contract](docs/PORTFOLIO-SLICE.md). Owner acceptance is still open; this note supersedes the feature-branch wording above for the current checkout and does not declare a release.

Pane follow-up (November 7, 2026): desktop pane resizing now redistributes a fixed window height and the input starts compact. The right pane connects to real, read-only Codex conversations with saved native session history, independent drafts and Local Search switching. See [agent conversations](docs/AGENT-CONVERSATIONS.md). [Pane workflow proposals](docs/PANE-WORKFLOWS.md) retain the future Lasso workspace, real terminal, and optional media ideas; the bottom CLI scratchpad remains command preview.

- [Product charter](docs/PRODUCT-CHARTER.md)
- [ProPro-001 scope and exit criteria](docs/PROPRO-001.md)

Development strategy: **A → C** — start with universal portfolio visibility and management, then expand toward integrated specialist workspaces. Keep the MVP small and evaluate existing solutions before committing to a stack.

## Run the dashboard

Ollama follow-up (November 8, 2026): the right pane now connects to installed local models, with a model selector, streaming replies, persistent history and independent drafts alongside Codex. See [Ollama conversations](docs/OLLAMA-CONVERSATIONS.md). Ollama currently has chat and selected-project context only, with no file or command tools.

Use Node 22 or newer and run `npm ci` once to install the pinned local Cockpit GUI package. Then either open `index.html` directly or run `npm start` and visit http://localhost:8000. The app works offline after installation. Project data stays in the browser under the original `propro-project-portal-v1` key. A `file://` page and `http://localhost:8000` have separate browser storage; use Export JSON and Import JSON to move projects between them.

Run `npm test` and `npm run test:browser` for model, browser, accessibility and viewport checks. See [PROP-CKP-001B implementation record](docs/PROP-CKP-001B-IMPLEMENTATION.md) for ownership, provenance and open acceptance gates.
