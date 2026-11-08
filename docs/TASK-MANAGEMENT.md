# Task management slice

Status: implemented on 2026-11-08; owner usability and visual acceptance remain open.

Tasks continue to live in each project's `items` array under the `propro-project-portal-v1` localStorage key and version 1 JSON export. Existing `{id,title}` tasks are treated as open. New tasks may add `completed` (boolean), `milestoneId`, and `deliverableId` (project-local IDs or null). Project-local `milestones` and `deliverables` are optional arrays of `{id,title}`. Validation rejects invalid completion values and dangling associations before an import replaces saved data. No migration or reset is required.

In the Tasks section, users can add, edit, complete, reopen, and remove tasks; create milestones and deliverables; and associate either with a task during creation or editing. The first open task is shown as the next action. Progress is the count of completed tasks over all tasks, shown in the project and Tasks views. This is an ordered list, not a priority or commitment inference.

The slice does not implement milestone or deliverable editing, deadlines, dependencies, typed project relationships, scenarios for construction/research/freelance, PARA, E4, I4, or A4. Those remain separate product decisions. Owner task-based usability, visual and screen-reader review, and a distributable installer remain MVP gates. Automated axe checks and responsive screenshots do not close those human review gates.

## Open the work (2026-11-08)

Tasks may now hold the same optional `{kind,locator}` connection as project Resources. The Tasks form accepts a URL, local file, folder, or Windows application, and the first open task with a connection exposes an **Open next action** button. Each connected task also has an **Open work** button. These actions only open the referenced destination; completing a task remains a separate explicit action. Existing version 1 records and exports remain valid, while imports reject invalid connections before replacing saved data. This is a general ProPro handoff to the app that owns the work, not a second article store or approval system.

For Governance Commons, the local editorial Portal is currently at `http://127.0.0.1:4177/` when separately started and configured. It can create a candidate-backed draft and submit that revision for review. The local pilot does not yet provide end-to-end article editing, independent approval, or public website publishing from its UI. Linking a ProPro task to the Portal does not grant publication authority or prove that an article is live.

## Compact task capture (2026-11-08)

The task title and Add button now share one row. Milestone, deliverable, and work destination fields remain available behind an optional disclosure, which opens automatically when editing a task that already uses them. The task list begins higher in the project view; the underlying task records and version 1 export format are unchanged.
