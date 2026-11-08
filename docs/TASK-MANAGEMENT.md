# Task management slice

Status: implemented on 2026-11-08; owner usability and visual acceptance remain open.

Tasks continue to live in each project's `items` array under the `propro-project-portal-v1` localStorage key and version 1 JSON export. Existing `{id,title}` tasks are treated as open. New tasks may add `completed` (boolean), `milestoneId`, and `deliverableId` (project-local IDs or null). Project-local `milestones` and `deliverables` are optional arrays of `{id,title}`. Validation rejects invalid completion values and dangling associations before an import replaces saved data. No migration or reset is required.

In the Tasks section, users can add, edit, complete, reopen, and remove tasks; create milestones and deliverables; and associate either with a task during creation or editing. The first open task is shown as the next action. Progress is the count of completed tasks over all tasks, shown in the project and Tasks views. This is an ordered list, not a priority or commitment inference.

The slice does not implement milestone or deliverable editing, deadlines, dependencies, typed project relationships, scenarios for construction/research/freelance, PARA, E4, I4, or A4. Those remain separate product decisions. Owner task-based usability, visual and screen-reader review, and a distributable installer remain MVP gates. Automated axe checks and responsive screenshots do not close those human review gates.
