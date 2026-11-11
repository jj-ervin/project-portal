# Bootdog workflow surface

Run ProPro's local server with `npm start` and open `/workflow/` (normally `http://localhost:8000/workflow/`). This is a separate Bootdog page backed by the existing ProPro server, not a tab in ProPro's dashboard.

- Center: Overview, Delivery Gate, Gaps, Roadmap for the current ProPro candidate.
- Right: read-only saved SITREPs from the existing nested Bootdog snapshot folder, ProPro conversation history, and selected document previews.
- Bottom: explicit-send Codex and Ollama input tabs, plus browser-local notes. Sending includes the selected SITREP, gate, checklist and local Git summary as context. Codex remains read-only; Ollama has no file tools.
- Left: collapsible Files, Git, and browser-local Projects views. Files are limited to four named project documents. Projects are visible only when saved on the same browser origin.

The checklist alone writes `.propro/bootdog-workflow.json`, after a second confirmation click. Checkmarks record user progress but do not verify a gate. Git reads are local and do not fetch remote state. SITREPs are saved historical reports and may describe an older commit. This page does not connect ProPro's Git Explorer or add an arbitrary filesystem editor.

Next: owner layout and task-flow review; confirm the current gate/checklist against the intended version; then decide whether the bounded checklist needs a project-specific data contract.
