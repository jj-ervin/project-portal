# Portfolio vertical slice

Date: November 7, 2026. Implementation candidate; owner acceptance remains open.

## Approved scope

Create and rename browser-local portfolios, assign or remove project membership, show portfolio grouping on Home and in Projects Explorer, and preserve existing project data through reload and export/import. Research, construction, freelance, creative, development, business, and personal work use the shared model. No external account or provider is required.

## Data contract

The existing `propro-project-portal-v1` storage key and top-level version 1 remain unchanged. Legacy documents without portfolios are valid and are not rewritten on load. Portfolios use the additive `portfolios` array with records `{version: 1, id, name}`. Projects may carry `portfolioId`; absent or null means unassigned. Membership references must resolve to a portfolio in the same document. The internal `__unassigned__` selector value is reserved and not a valid portfolio ID.

Validation rejects unsupported portfolio versions, malformed names/IDs, duplicate portfolio IDs, invalid portfolio arrays and dangling membership. Import validates the complete document before offering replacement. Export includes the original project entries and all portfolio/membership fields. This slice supports one portfolio per project; hierarchy, multiple membership, typed cross-project relationships, roles, permissions, and synchronization are outside its scope.

## Interface

Home provides portfolio creation, renaming, project counts, and All/Unassigned/portfolio filtering. Project Overview provides membership assignment and removal. New projects created while viewing a portfolio inherit that portfolio. Projects Explorer uses portfolio parent nodes and an Unassigned group; documents without portfolios retain the previous flat project tree. Portfolio names are plain text and escaped before rendering. Portfolio grouping is organizational and does not establish personal/professional access isolation.

## Acceptance evidence

Model and browser coverage checks legacy preservation, multi-domain membership, malformed data, rename, reload, JSON export/import, removal back to Unassigned, Explorer grouping, keyboard creation, narrow reflow, and automated accessibility rules. Current test results are recorded in the execution record. Automated checks do not establish human acceptance, complete accessibility conformance, or release readiness.

Verified locally: 6 model tests and the full 14-test Chromium browser suite pass. The two portfolio browser tests also pass after the final display-text correction. Desktop and phone captures are `docs/screenshots/propro-portfolios-1280.png` and `docs/screenshots/propro-portfolios-390.png`; the regression suite refreshed its existing reference captures. Reflow and automated axe checks pass at the suite's phone, tablet, and desktop widths.

Repository-guidance validation remains blocked independently of application tests: `validate-planning.ps1` rejects the existing nested `bootdog/DEV-PLAN.md` heading; `validate-review-grammar.ps1` finds no project-local review grammar or agent instruction file; and the project-target zero-trust audit has no local GC-AUDIT registry. These checks were run, not passed. No governance/tooling changes or release claims are included in this slice.

## Open review

Owner review of the running portfolio workflow and task-based usability remains required before closing the approved milestone. No ECO/eOS or operating-system capabilities were added. Cockpit GUI's packaged component boundary is unchanged.
