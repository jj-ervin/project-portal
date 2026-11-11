'use strict';

const {stat} = require('node:fs/promises');
const {join} = require('node:path');

const REQUIRED_FILES = Object.freeze([
  'server.mjs', 'chat-service.mjs', 'ollama.mjs', 'model.mjs',
  'agent-runs.mjs', 'agent-runs-ui.js', 'agent-manager-model.js', 'agent-manager-ui.js',
  'git-status.mjs', 'ide-launch.mjs', 'bootdog-workflow.mjs',
  'workflow-ui/index.html', 'workflow-ui/app.js', 'workflow-ui/style.css',
  'index.html', 'app.mjs', 'chat-client.mjs', 'styles.css',
  'node_modules/@cockpit/gui/src/workbenchUI.js',
  'node_modules/@cockpit/gui/src/tabbedExplorerUI.js',
  'node_modules/@cockpit/gui/src/cockpitGUI.css'
]);

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForFiles(root, files = REQUIRED_FILES, {timeoutMs = 30000, intervalMs = 200, stableMs = 400} = {}) {
  const deadline = Date.now() + timeoutMs;
  let previous = '', stableSince = 0, missing = files;
  while (Date.now() <= deadline) {
    const sizes = [];
    missing = [];
    for (const file of files) {
      try {
        const info = await stat(join(root, file));
        if (!info.isFile() || info.size === 0) missing.push(file);
        else sizes.push(`${file}:${info.size}`);
      } catch { missing.push(file); }
    }
    const signature = sizes.join('|');
    if (!missing.length) {
      if (signature !== previous) stableSince = Date.now();
      else if (Date.now() - stableSince >= stableMs) return;
    }
    previous = signature;
    await pause(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
  }
  throw new Error(`The portable app did not finish unpacking: ${missing.join(', ') || 'files were still changing'}.`);
}

function startupMessage(error, port) {
  const details = String(error?.message || error);
  if (/EADDRINUSE/.test(details)) return `Port ${port} is already in use. Close the other local server and try again.`;
  if (/ERR_MODULE_NOT_FOUND|did not finish unpacking/.test(details)) return 'The portable app files are incomplete. Close other ProPro launchers and try again.';
  return `The local server could not start. ${details.slice(0, 500)}`;
}

module.exports = {REQUIRED_FILES, waitForFiles, startupMessage, pause};
