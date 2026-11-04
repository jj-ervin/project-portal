# Universal domain model — working proposal v0.1

Status: research proposal, not final schema. Product: ProPro. Repository: project-portal.

## Identity and boundaries
- **Workspace**: tenancy and permission boundary, owned by an individual or organization.
- **Portfolio**: grouping/view of projects; portfolios may be nested only if validated as necessary.
- **Project**: durable unit of intended work with goal, lifecycle and owner. It is not synonymous with a repository, client, contract or folder.
- **Capability**: optional behavior attached to a project; a project can have many capabilities simultaneously.
- **Resource**: reference to an external or internal asset, person, file, repository, equipment or material.
- **Work item**: task, milestone or deliverable, each with distinct semantics.
- **Relationship**: typed directed link between projects or resources, with evidence and provenance.
- **Decision**: rationale, alternatives, authority, date and related evidence.
- **Evidence**: source reference, observation, artifact or test result; record confidence and origin.

## Proposed minimum entities
Workspace(id,name); Portfolio(id,workspace_id,name); Project(id,workspace_id,name,description,status,owner_id,created_at,updated_at); PortfolioMembership(portfolio_id,project_id); CapabilityAssignment(project_id,capability_key,configuration_version); WorkItem(id,project_id,kind,title,status,assignee_id,due_at); Relation(id,source_type,source_id,predicate,target_type,target_id,evidence_id); Resource(id,workspace_id,kind,uri,metadata); ProjectResource(project_id,resource_id,role); Decision(id,project_id,summary,rationale,authority,recorded_at); Evidence(id,source_uri,source_kind,observed_at,confidence); Activity(id,actor_id,action,target_id,occurred_at).

## Candidate relationship vocabulary
DEPENDS_ON, BLOCKS, IMPLEMENTS, INFORMS, PRODUCES, DOCUMENTS, SHARES_RESOURCE_WITH, RELATED_TO. Each type needs defined direction and validation; no unqualified inference of causality.

## Example project compositions
1. **Trailer porch**: Construction + Research + Budget. Research evidence about materials informs a decision, which links to a material resource and work item.
2. **Research study**: Research + Publication. Source records and methods support findings and a publishable deliverable.
3. **Freelance website**: Freelance + Software + Creative. Client relationship, scoped deliverables, review decisions, repository resource and payment tracking reference.

## Invariants
- A project exists without GitHub, AI, or any external connector.
- Projects can have multiple capabilities; capability removal must not silently erase project history.
- Cross-workspace access requires explicit authorization; client portals must not expose private notes or unrelated projects.
- Every relationship must be inspectable and editable, with source and timestamp.
- Imported external IDs are namespaced; do not reuse a GitHub repo ID as a ProPro project ID.
- Export preserves project identity, relationship types, data version, and provenance where authorized.
- Keep payment processing, construction safety certification, and research ethics approval outside the MVP; track references and statuses without claiming authority.

## Open decisions
Portfolio nesting; status taxonomy; work-item hierarchy; local-first synchronization and conflict resolution; schema migration/versioning; access model; attachments storage; search architecture; relationship cardinality; export format. Validate against users and existing components before locking down.
