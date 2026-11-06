# External portals in ProPro — first integration slice

## User goal
A project can reference its own external website or authenticated portal. ProPro remains a standalone universal project workspace; it does not own the external application's account, permissions, data or workflows.

## Current implementation
- Open a project, select **Links**, enter a descriptive title and absolute HTTP(S) URL, then **Add entry**.
- Select **Open site** to navigate in a new tab; the external site handles authentication.
- Pin the link to Home for quick access, where **Open site** is also available.
- Existing title-only links continue to load. No URL is fabricated for them.
- Export/import retains link URLs in the current version-1 project JSON schema.
- No new account, iframe, cookie sharing, API access, cross-app session or portal runtime is introduced.

## Governance Commons example
Create or select a *Governance Commons* project and add a link titled *GC Portal*. Use the portal's actual reachable address, not an assumed production URL. The GC Portal repository currently documents a loopback-only pilot at `http://127.0.0.1:4177` when running on the same machine. Its hosted URL and identity federation are **not** enabled by this change. The public site `https://governancecommons.org` is distinct from that private portal.

## Boundaries
- Portal Kit remains a separately evaluated potential platform; this slice does not depend on it.
- Observatory Core continues to own its evidence and publication contracts.
- Governance Commons Portal remains responsible for its own authenticated workflows and authorization.
- ProPro stores only a user-entered link and title locally. Do not put login secrets or bearer tokens in a URL.

## Acceptance checklist
- [ ] Node test suite passes: `npm test`
- [ ] Playwright browser suite passes: `npm run test:browser`
- [ ] Browser review: add portal URL, open it, pin it, refresh, and reopen from Home
- [ ] Import older version-1 projects with title-only links without data loss
- [ ] Verify keyboard access, new-tab announcement, and small viewport behavior
- [ ] Verify a malicious URL is rejected during import and data entry
- [ ] Confirm no login, remote data or cross-application authorization claims are made

## Follow-on, separately approved
First complete the GC Portal dashboard usability and secure hosting acceptance. Only then evaluate a versioned, scoped API integration for authenticated cards or status views; cross-app login and write operations are **not** part of the first slice.
