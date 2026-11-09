# Corral (ProPro internal feature)

Corral is an **optional** intake, clarification, organization and handoff workspace. It is **not** an asset producer, separate product, mandatory project wizard, or task system of record.

## Repository boundary

Corral stays in `project-portal`. Reusable shell, tab and pane primitives belong in `cockpit-gui`; Corral session logic and handoff semantics belong here. Do not create a Corral repository or make ECO/eco.ai a prerequisite.

## Current first slice (draft PR #9)

- `src/corral/ui/corral.mjs`: offline bottom-pane intake, browser-local sessions, metadata-only file references, links, editable scope and handoff JSON.
- Existing `app.mjs` creates the bottom pane and tab; `index.html` loads Corral's internal UI module.
- No model calls, file content access, project writes or automatic agent execution.

## Intended module boundaries (not yet implemented)

- `session.mjs`: schema, validation, storage and session lifecycle, separate from DOM.
- `handoff.mjs`: reviewable handoff format and explicit user authorization.
- `assistant.mjs`: optional local model adapter, never a requirement for manual use.
- `knowledge/`: small, versioned organizational guidance; methods remain optional heuristics.
- `ui/`: ProPro-facing presentation, reusing Cockpit GUI components.

These are *future internal modules*, not packages or repositories. Extract only when implementation requires them; avoid premature abstraction.

## Next acceptance gate

Run Node and Playwright tests, manually verify browser persistence, file-reference handling, keyboard navigation and export. Then add synchronized right-pane view and reviewed agent handoff. Do not merge based on documentation alone.
