# ADR-001 — Build versus adopt (provisional)

Status: PROPOSED, not accepted. Date: 2026-11-04.

## Context
ProPro must work for construction, research, freelance, creative, personal and software projects, including combinations. It must not depend on GitHub or AI. Existing portfolio tools must not acquire duplicate ownership.

## Options
A. Extend a software developer portal such as Backstage. Strong software catalog; may impose software-first abstractions.
B. Adopt/extend a general PM platform such as Plane or OpenProject. Mature workflows; validate extensibility, licensing, offline needs and data ownership.
C. Build a small universal project core and integrate specialized tools as optional adapters. Maximum model control, higher implementation and maintenance burden.
D. Hybrid: use a general PM backend and custom ProPro experience. May reduce implementation effort but creates dependency and licensing risks.

## Provisional recommendation
Run a small domain-model and workflow prototype independent of vendor selection. Do not select C simply because it sounds flexible; benchmark B and D against concrete workflows first. Treat Backstage as a potential optional software connector, not the universal core, unless tests contradict this.

## Acceptance evidence needed
Three end-to-end workflows (construction, research, freelance), export/import fidelity, access isolation, relationship graph semantics, customization without code, usability and accessibility, deployment/maintenance costs, licensing and migration plan. Compare at least two candidate implementations.

## Decision
DEFERRED until hands-on benchmark and existing-system audit. No production architecture selected.
