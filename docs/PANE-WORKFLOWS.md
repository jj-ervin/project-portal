# Pane workflows

Status: proposed product direction for owner review, November 7, 2026. Only the conversation containment correction is implemented by this change.

## Current behavior

The right pane currently provides local project/entry search, tag/reference suggestions, attachment selection without upload, and informational command previews. It is not yet an AI conversation or an internal project assistant. The bottom pane currently contains a CLI scratchpad that previews commands, local data-loading problems, and browser-local notes. It is not a terminal.

## Proposed roles

| Area | Primary purpose | Useful surfaces |
| --- | --- | --- |
| Center | Work being edited or reviewed | Project records, portfolios, documents, deliverables, evidence |
| Right | Focused conversation with one selected agent environment | Independent Codex / Claude / other connected agent sessions; project context; proposed actions and approval requests |
| Bottom | Work running alongside the conversation and its results | Terminal sessions; agent jobs and logs; test/build results; Lasso multi-agent comparison, consensus, merge, and plan-role workspace |

Agent tabs should represent actual connected environments, not misleading provider names attached to an unconnected text box. Each environment needs explicit session identity, context, connection status, and conversation history. Changing tabs must preserve drafts and state. A compact Lasso session could also be selectable on the right; opening its full workspace below must observe the same session rather than dispatch a second copy of the task.

## Conversation versus internal assistant

A conversation is the interaction surface. An internal project assistant is a role with project knowledge and explicitly authorized tools. They can use the same agent connection and session system. A chat-only connection may discuss a project without changing it; an assistant can propose and, when authorized, perform project operations. These permissions must be visible and independent of where the UI is docked. A second hidden autonomous assistant is not implied.

## Lasso evidence and boundary

Read-only source inspection: `C:/dev/lasso/README.md` describes existing CLI dispatch, saved sessions, export, and Parallel/Merge/Consensus/Plan-Role modes. `extension/src/extension.js` describes its VS Code sidebar and editor hosts embedding the same existing frontend. This supports evaluating a bounded integration, not claiming ProPro compatibility or authorizing code transfer.

Before integration, confirm the supported embedding/session interface, authentication, dispatch permissions, session persistence, and source/licensing boundary. Preserve Lasso's ownership of multi-agent coordination and ProPro's ownership of project records. Lasso's adjacent eco references do not expand ProPro into ECO/eOS or establish a dependency on that runtime.

## Suggested implementation order

1. Correct conversation containment and independent content scrolling (implemented; regression test added).
2. Define and connect one real right-pane agent environment, with persistent session and draft state; then add switching between independently connected agents.
3. Define local terminal access as a separately authorized execution capability, with real sessions, working-directory identity, stop controls, and reconnect behavior. Keep command preview labeled until then.
4. Integrate an existing Lasso session view in the bottom pane while a right-pane conversation remains active; evaluate compact right-pane access to that same session.
5. Add job/output/approval views as real workflows require them. Preserve the existing Notes capability; do not add more decorative placeholder tabs.

Media playback or Spotify can be an optional dockable utility later. They do not belong in standalone MVP acceptance gates. Dock location, media control, and provider integrations must remain optional.

## Layout correction

The context body can shrink and scroll independently; the composer stays inside the context pane. Textarea and attachment growth are bounded. A maximized bottom panel retains a usable top conversation row; short desktop windows may scroll the page instead of allowing panes to overlap. Narrow screens retain stacked panes. No Cockpit GUI package or Lasso source was changed.

Verified locally: the new browser regression reproduced the original composer overflow before the fix and passes afterward. It checks containment, independent content scrolling, maximum bottom height, laptop/desktop sizes, swapped side panes, draft preservation on pane toggles, and narrow reflow. All 6 model tests and 15 Chromium browser tests pass, including automated axe checks. The scrolling context region is keyboard-focusable and labeled. Existing bottom-panel reference captures were refreshed. Source inspection of Lasso is not an integration test or a compatibility claim.
