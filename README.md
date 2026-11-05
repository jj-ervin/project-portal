# ProPro

**Universal Project & Portfolio Platform**

> One place to manage the work you do, however you work.

ProPro is an adaptable project portal for construction, research, freelance, creative, business, personal and software projects. Project capabilities can be combined; GitHub and AI are optional integrations, not prerequisites.

**Current stage:** runnable local dashboard candidate on `feature/propro-002-first-workspace`; review and human visual acceptance remain open.

- [Product charter](docs/PRODUCT-CHARTER.md)
- [ProPro-001 scope and exit criteria](docs/PROPRO-001.md)

Development strategy: **A → C** — start with universal portfolio visibility and management, then expand toward integrated specialist workspaces. Keep the MVP small and evaluate existing solutions before committing to a stack.

## Run the dashboard

Use Node 22 or newer. Run `npm ci`, then `npm start` and open http://localhost:8000. The app uses a local, integrity-pinned Cockpit GUI package artifact. No account or network connection is needed after installation. Project data stays in the browser under the original `propro-project-portal-v1` key. Export JSON backups before changing browsers or origins.

Run `npm test` and `npm run test:browser` for model, browser, accessibility and viewport checks. See [PROP-CKP-001B implementation record](docs/PROP-CKP-001B-IMPLEMENTATION.md) for ownership, provenance and open acceptance gates.
