# Local Ollama conversations

Implemented November 8, 2026. Run ProPro with `npm start`, start the installed Ollama service, and choose Ollama in the right pane. Refresh models checks localhost:11434 for downloaded local GGUF models. No model download, cloud model connection, API key, or service installation happens through this interface.

The model selector starts a separate conversation when the model changes. Each saved conversation retains its original model. Codex and Ollama have separate conversation lists, selected sessions and drafts. Existing Codex storage remains compatible. Full completed history is saved in ignored `.propro/agents.json`; browser reload and server restart preserve it. This remains local data for the current OS user, rather than an encrypted account or enforced personal/professional boundary.

Ollama gets recent conversation text (up to 10,000 characters) and selected-project context (up to 3,500 serialized characters). It receives no file contents, attachments, filesystem, terminal, Git, web or project-editing tools. The request stays on the fixed loopback Ollama endpoint, refuses redirects and supplies no execution tools. Context limits apply to model input, not the stored transcript. ECO/eOS and operating-system scope remain excluded.

Replies stream into the pane while running and become saved assistant messages only when the stream completes. Stop aborts inference. Offline service, missing model, incomplete stream and model failures preserve earlier history and show a status. Refresh models enables recovery after starting Ollama. One turn runs at a time across providers. A saved conversation whose model is absent remains readable; selecting another model starts a separate conversation.

The default request uses a 4,096-token context window and a 512-token reply limit, with a ten-minute timeout. Speed depends on the model and hardware. The verified installed `llama3.1:latest` 8B model runs on this machine's CPU; no new model was downloaded.

Verification: 19 unit tests and 17 Chromium browser tests passed, covering provider/model isolation, drafts, reload, offline recovery, cancellation, stream errors, accessibility and existing workspace/layout flows. A real local two-turn conversation returned `Ollama connected.` and then recalled `cedar` from saved history after the browser reload and server restart. Automated checks do not replace owner visual acceptance or establish full accessibility conformance. Existing repository guidance/registry findings remain separate release gates.
