# Connected Resources — MVP architecture and verification

Date: November 8, 2026. This records the approved provider-neutral direction and the implemented Level 1 slice. It does not declare a release.

## Contract and levels

A project owns its resource references. A resource is a display title plus an optional `connection` containing `{kind, locator}`. The destination is a reference to work owned elsewhere; ProPro does not copy the file or claim authority over it. The optional field keeps existing title-only entries and version 1 JSON exports valid. Import validates every connected destination before replacing saved projects.

| Level | Scope | State |
| --- | --- | --- |
| 1 | Link, pin, and explicitly open local files, folders, URLs, and Windows applications associated with projects. | Implemented in the browser-local project model and Home pins. Local paths require the Windows loopback server. |
| 2 | Browse and search connected cloud resources, beginning with Google Drive and OneDrive. | Planned; no provider connection, credential storage, or cloud API is present. |
| 3 | Preview or edit a resource only where the owning provider supports the capability and the user grants it. | Planned; the existing one-session local file preview is separate from connected resource editing. |

Planned provider coverage includes Google Docs, Google Sheets, Microsoft Excel, OneNote, Jupyter notebooks, Notion, and Obsidian. A provider adapter should identify its account, resource ID, supported operations, and canonical open target. Capabilities are checked per resource; naming an application does not imply that ProPro can preview or edit its content. A URL reference can point to a document today, but that is only Level 1 opening.

## Account boundary

The MVP has no cloud accounts. Future provider connections must be scoped by provider plus distinct account identity and an explicit personal or professional profile. Credentials, browse/search indexes, recent items, and cached previews must remain within that account profile by default. Cross-profile search, sharing, or moving a project reference requires an explicit user action and must not silently merge results. Browser-local project records are currently in one storage origin; they are organizational records, not an account isolation boundary. A real multi-account release needs a storage and authorization design before Level 2 is enabled.

## Implemented behavior

Resources are added from a project's Resources section with a title, destination type, and locator. Title-only records remain available. URLs are restricted to HTTP(S) without embedded credentials; local locators must be absolute drive paths, and application locators end in `.exe` or `.lnk`. The Open control and a pinned Home card open the same destination. URLs open in a new browser tab. Local targets are checked for existence and type, then opened by Windows through a same-origin POST to the loopback server. The route rejects cross-origin requests and does not accept commands or arbitrary shell text. On a direct `file://` page, local opening reports that `npm start` is needed. Existing local read-only file preview remains a session-only feature.

No resource contents are read by ProPro when opening a connected destination. A selected application can still execute with the current Windows user's permissions; opening is always an explicit click.

## Windows setup and remaining MVP blockers

Use Node 22 or newer in `C:\dev\project-portal`, run `npm ci`, then `npm start` and open the displayed loopback URL. The app is a local web app, not a packaged Windows installer. `open-resource.ps1` uses Windows PowerShell `Start-Process` and file associations. Opening a path depends on the local file existing and a suitable Windows application being installed. This action has automated validation for request origin, invalid/missing paths, and browser behavior, but successful launch of each file association and application type still needs manual Windows acceptance.

Remaining MVP blockers: there is no distributable installer or desktop shortcut; owner visual and task-based acceptance remain open; and the broader charter's task/milestone/deliverable, typed project relationship, and scenario gates are not complete. Cloud browsing, account isolation implementation, and provider previews/edits are later levels rather than MVP blockers for this Level 1 slice. The project also has pre-existing governance validator gaps recorded in `PORTFOLIO-SLICE.md`.

## Verification on November 8, 2026

On Windows with Node 24.14.1 and npm 11.14.1, `npm ci` completed from the lockfile, `npm test` passed 20 tests, and the complete Chromium Playwright suite passed 19 tests using an alternate local port because port 8000 was already occupied. The browser checks cover resource creation, URL opening, pin persistence, and rejection of a foreign origin or missing local path. Launching a real local document, folder, or application was left for manual acceptance; the automated suite does not open programs on the user's desktop.

The repository-level `validate-planning.ps1` check still fails on the existing nested `bootdog/DEV-PLAN.md` heading (E2 and E4, plus two warnings). No planning file was rewritten for this resource slice.
