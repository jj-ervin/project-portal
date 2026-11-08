# ProPro — Human-Centered Workflow and Four-Framework Audit

Status: research-backed design assessment; **not** an approved implementation contract.
Date: 2026-11-08.
Scope: ProPro MVP, PARA/P4, Eisenhower/E4, I4 Intent, A4 Actions, human factors and workload.

## Source and evidence status

- Inspected on GitHub `main`: `docs/PRODUCT-CHARTER.md`, `docs/PORTFOLIO-SLICE.md`, `docs/CONNECTED-RESOURCES.md`, `docs/PROPRO-003-COCKPIT-ADOPTION.md`, `docs/PROPRO-001.md`, `model.mjs`, and `README.md`.
- `docs/research/` contains 17 PDFs as of this audit; the repository interface listed their filenames and metadata but did **not** extract their text. Do not cite their conclusions as verified from these copies until contents and pages are inspected.
- Operational A4/I4 definitions here are from prior owner decisions and conversations, **not** newly verified repository canonical specifications. The relevant source-of-truth documents and version history must be located before schema commitments.
- Evidence categories must stay separate: empirical research, established external methods, owner framework decisions, product hypotheses, and usability test results.

## Framework responsibilities (provisional semantic mapping)

| Namespace | Framework | Working meaning | Primary question | Notes |
| --- | --- | --- | --- | --- |
| `p4.para` | P4 / PARA | Projects, Areas, Resources, Archives | Where does this belong? | Organization, not security boundaries. Do not confuse portfolio with PARA area or archive. |
| `e4.eisenhower` | E4 / Eisenhower | Urgency x importance; Do, Decide/Schedule, Delegate, Delete | How should I prioritize it? | Quadrant labels are derived decision aids, not permissions, commitments, or objective truth. |
| `i4.intent` | I4 / Intent | Identify → Interpret → Intend → Initiate | Have I recognized, interpreted, personally committed to, and begun this? | Explicit personal agency: urgency alone never creates commitment; transitions should remain user controlled. |
| `a4.actions` | A4 / Actions | Action, Activity, Align, Archive (latest operational formulation requiring confirmation) | What is the work's movement/readiness state? | Earlier owner discussions also used Assets in place of Align, and additional A4 vocabularies. Resolve variants before coding. |

**Namespace warning:** Earlier ECO discussions also used A4/E4/I4/P4 abbreviations for an architectural layer (Awareness, Engineering, Integration, Preservation). Never infer that those are the operational meanings above. Keep distinct qualified namespaces and provenance.

**A4 authority conflict:** Sources in previous design discussions include Action/Activity/Align/Archive, Actions/Activities/Assets/Archive, and variants describing outcomes or workflow states. The most recent owner-level account treats Align as coordination or alignment before work can advance. Do not declare a definitive enumerated type or migrate records until owner-approved canonical specification is identified.

## Current application fit

- `model.mjs` exposes `newProject()` with `items`, `resources`, `evidence`, and `links` arrays. `validateData()` checks generic item IDs and titles but does not validate a typed task lifecycle, owner commitment stages, capacity data, or framework-specific classifications.
- Portfolio support is additive; currently one portfolio membership per project. Portfolios are organizational only and **not** privacy or personal/professional security partitions.
- Connected Resources Level 1 supports link/pin/open. Cloud access and account isolation are future capabilities.
- The product charter's core tasks, milestones, deliverables, typed project relationships and end-to-end scenario gates are not all closed.
- Existing Cockpit GUI integration has explicit owner visual and usability acceptance gates.

## Research-to-design hypotheses, not validated outcomes

| Human issue | Possible design response | Initial measurable acceptance |
| --- | --- | --- |
| Difficulty identifying next step | One obvious next meaningful action per active project | Observe whether testers identify a next step without prompting. |
| Overwhelm from too much information | Progressive disclosure and concise priority view | Compare time to locate work and perceived effort across views. |
| Interruption and task resumption | Preserve project/task context, with explicit Resume action | Compare resumption time and error rate in interrupted tasks. |
| Unrealistic planning | Show planned work beside user-stated availability; permit deferral | Test whether users can spot overcommitment and revise plans. |
| Priority versus commitment confusion | Keep E4 urgency/importance separate from I4 human commitment | Test whether urgent but unaccepted work remains distinguishable. |
| Disconnected organization and execution | Use PARA organization, A4 workflow state, I4 intent, E4 priority as optional perspectives on shared records | Test navigating a work item without duplicating data across views. |

## MVP recommendation

1. **P0:** Finish and validate a minimal task/milestone/deliverable workflow using the current project model, preserving existing version-1 imports/exports and legacy records.
2. **P0:** Conduct task-based UX evaluation of orientation, capture, next action, interruption recovery, keyboard use and narrow-screen behavior; record observed evidence, not only automated test results.
3. **P1 design preparation:** Document candidate fields and transitions for P4/E4/I4/A4 in a schema proposal only. Resolve A4 canonical ambiguity and namespace collision first. Keep framework adoption optional and avoid four separate storage engines.
4. **P1:** Prototype a single priority/intent/work-state view once core tasks work, and test it against simpler alternatives.
5. **P2:** Explore capacity-aware planning and structured workload evaluation (e.g., NASA-TLX) after core UX validation. Avoid diagnosing fatigue, burnout or cognitive capacity from task counts.

## Guardrails

- Human consent and control: never automatically change commitment or delegate consequential work.
- No assumption that Eisenhower quadrant equals execution permission.
- PARA archive and A4 Archive are conceptually distinct; decide whether and how they correlate, rather than automatically synchronizing them.
- Personal/professional separation requires real authorization and storage isolation, not merely a category, view, or PARA folder.
- Avoid creating an ECO/eOS runtime, new governance layer, or research-management product for this work.
- No forced migration, destructive reset, duplicate task stores, or changes to Cockpit GUI package ownership.
- Any evidence claim derived from a PDF must cite its actual page/section after verification.
- Review redistribution/licensing of commercial PDFs before any repository visibility changes.

## Next verification

- Locate and compare the owner's canonical A4/E4/I4/P4 specification and subsequent revisions in source repositories.
- Read relevant `docs/research` PDFs locally or with a PDF-capable reader, capture exact passages/pages, and flag unverified interpretations.
- Review real ProPro task creation, persistence, navigation, and editing against this audit.
- Propose a minimal additive task contract and human usability scenarios; seek explicit approval before behavior/schema changes.
