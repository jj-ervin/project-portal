# Right-pane agent conversations

Current follow-up, November 8, 2026: Ollama is also connected, with downloaded-model selection and separate persistent conversations and drafts. See [local Ollama conversations](OLLAMA-CONVERSATIONS.md) for the implemented scope and current verification counts. The original Codex implementation record below remains applicable to Codex.

Date: November 7, 2026. Local implementation candidate; owner review remains open.

## Current connection

Codex is the first real agent environment. It runs through the locally installed Codex CLI and its existing account sign-in. No API key is stored in a browser or accepted through these routes. Local Search remains a separate environment. Claude is displayed as unavailable because no local Claude installation or configured adapter was verified. Lasso and a real terminal remain separate future work.

The connection uses `codex exec` for the first turn and `codex exec resume <explicit-thread-id>` thereafter. Commands always select the read-only sandbox, disable approvals, and ignore user configuration to avoid inheriting writable defaults or connectors. There is no `--last` lookup, shared provider history, hidden execution agent, or write-enabled mode. The reporting pattern follows the [official Codex command reference](https://learn.chatgpt.com/docs/developer-commands#codex-exec).

## Session and context boundaries

The Node server saves conversation metadata, native Codex thread identity, messages, status, and timestamps in ignored `.propro/agents.json`. Writes are serialized and replaced atomically; corrupt storage fails closed. Native Codex history also persists in the user's CLI storage. Sessions survive browser reload and server restart. Interrupted turns remain visible and can be continued with a new message. One turn runs at a time; stop, timeout, failure, and message/session limits are explicit.

Only the selected project name, capabilities, and up to 20 task titles (500 characters each) are supplied from browser project records. No selected project means no project record is attached. The assistant may inspect relevant project source and Git in this checkout under the read-only CLI policy; the prompt excludes credentials, unrelated personal files, `.propro`, Bootdog, and other repositories. Reading scope is a prompt constraint, not per-folder read isolation. Project writes, arbitrary command execution, uploads, remote fetching, and external connectors are not enabled. Browser-selected documents and attachments are not sent by this adapter.

Agent history is private local runtime data for the current OS user, not an encrypted multi-user account store or a personal/professional authorization boundary. The server binds only to loopback, validates Host and POST Origin, bounds JSON bodies, and exposes an explicit route allowlist. It does not serve `.propro` or arbitrary files. Provider output renders as escaped text. Existing project records retain their original storage contract.

## Interface

The right pane has Local Search and Codex environment tabs, a saved-conversation selector, New chat and Stop controls, a transcript, progress/error status, and a compact input. Drafts and selected environment/conversation persist separately in browser storage. Switching environments or conversations preserves drafts. The tab labeled Claude is disabled and does not simulate a connection. Codex uses the selected-project indicator in its status line. Existing local-search suggestions and command previews remain unchanged in Local Search.

The desktop shell uses a fixed viewport height. The bottom pane's requested height is clamped through the existing Cockpit GUI public API to leave a usable upper pane. Resizing redistributes the existing height; it does not increase page length. The composer starts at one line, with bounded manual growth, instead of occupying a large conversation area. Narrow screens retain the existing stacked-pane presentation.

## Verification

A real two-turn Codex conversation was exercised through the browser: a first turn stored a verification word, the browser reloaded, and the resumed native session returned that word on the next turn. Unit tests verify persistence, explicit native identity, concurrent-turn rejection, cancellation, failure preservation, restart recovery, corruption handling, and read-only invocation. Browser checks verify restored history, independent drafts, conversation/environment switching, project-data preservation, accessibility, compact composer sizing, and absence of page growth when resizing the bottom panel.

Browser tests use a separate runtime history file under ignored `test-results/`; mocked provider responses do not invoke paid agent runs or alter the user's conversation store. Existing project-model and workspace regression suites remain required. Passing automated checks does not close owner visual acceptance or establish full accessibility conformance.

Verified results: 13 unit tests and all 16 Chromium browser tests pass. A real native two-turn conversation survived browser reload, remembered its verification word, and remained available after a server restart. HTTP checks reject foreign POST origins, invalid request bodies, and direct access to private conversation storage. Repository-guidance findings recorded by the earlier portfolio slice remain separate and unresolved.
