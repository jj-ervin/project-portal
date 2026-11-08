# ProPro local desktop app

Status: Windows local candidate. This packages the existing ProPro project, task, resource and conversation UI in a desktop window. It does not deploy the future signed-in web app or connect to Governance Commons editorial authority.

From `C:\dev\project-portal`, run `npm ci` and `npm run desktop` for development. Run `npm run desktop:package` to build a portable Windows x64 executable under `release/`. Do not copy the executable alone until its packaged files and launch have been checked; the portable target bundles its runtime.

The app starts its own loopback server on `127.0.0.1:8765` and keeps that port fixed so browser storage retains the same origin between launches. ProPro's desktop profile stores project records in Electron's application data directory; agent conversation history is stored there as `agents.json`. An existing browser profile is separate. Use Export JSON in the browser and Import JSON in the desktop app to move project records. Import replaces the desktop profile's current projects only after confirmation, so export a backup first.

The app allows external HTTP(S) links to open through the operating system. Node integration and renderer process access to local files are disabled. Local file, folder and application resources still use the existing explicit Open action and Windows loopback route. Port 8765 must be free; the app stops with an error if it is occupied. One desktop instance is allowed at a time.

On a portable first launch, ProPro waits for its extracted server and UI files to appear and settle before starting the local server. If extraction remains incomplete, close any other ProPro launcher and try again. A port conflict is reported separately from an incomplete bundle.

Tasks can also hold an explicit work destination and expose **Open next action** or **Open work**. A Governance Commons task may point to the separately running local Portal at `http://127.0.0.1:4177/`; this is a navigation link, not an editorial integration or publication permission.

This is a local application shell around existing functionality, not proof of production security, an installer, cloud sync, accounts, website publication or GC News workflow integration. Human first-run usability, installer/signing, data recovery, and web-host design remain open.
