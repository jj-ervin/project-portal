# Existing system boundaries — preliminary audit plan

Status: NOT an implementation audit. Named responsibilities below are hypotheses based on existing portfolio descriptions and must be checked against current repository code, contracts and deployed behavior.

| System | Suspected authority | ProPro boundary to validate |
|---|---|---|
| portfolio-control | Internal portfolio inventory/control plane | ProPro may consume a versioned inventory, not silently replace authority |
| DCP/DXP | Developer environment setup and control-plane contracts | ProPro should not reimplement developer lifecycle automation |
| Governance Commons | Governance policy, evidence, approvals and conformance | Optional governed integrations; ProPro core works without GC |
| Cockpit GUI | Reusable UI component/toolkit | Evaluate visual usability and portability before adoption; do not assume UX suitability |
| Marlin | Guided installation/setup | Optional future installer, not a dependency for creating a project |
| GitHub | Source repositories, issues, PRs, CI | External resources linked to ProPro projects, not universal project IDs |

## Evidence required before reuse decision
For each system: repository HEAD and release state; maintained interface/API; input/output schema; dependency graph; ownership and license; version compatibility; test results; deployment requirements; overlap/conflict; migration and rollback costs.

## Contract principle
A single authoritative owner per capability. Adapters may project/synchronize data with provenance, conflict policy and opt-in permissions. No dual writes until reconciliation and failure behavior are specified.

## Current decision
No integration selected. Do not infer that existing code has been inspected from this document.
