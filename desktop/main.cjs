'use strict';

const {app, BrowserWindow, dialog, shell} = require('electron');
const {spawn} = require('node:child_process');
const {join} = require('node:path');
const {waitForFiles, startupMessage, pause} = require('./startup.cjs');

const PORT = 8765;
const URL = `http://127.0.0.1:${PORT}/`;
let server;
let window;

if (!app.requestSingleInstanceLock()) app.quit();
else app.on('second-instance', () => {
  if (window?.isMinimized()) window.restore();
  window?.focus();
});

function startServerOnce() {
  return new Promise((resolve, reject) => {
    const script = join(__dirname, '..', 'server.mjs');
    const child = spawn(process.execPath, [script], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: String(PORT),
        PROPRO_CHAT_STORE: join(app.getPath('userData'), 'agents.json')
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
    let settled = false;
    let errors = '';
    let output = '';
    const timer = setTimeout(() => finish(new Error('The local server did not start in time.')), 15000);
    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) { child.kill(); reject(error); }
      else resolve(child);
    }
    child.stdout.on('data', chunk => {
      output = (output + String(chunk)).slice(-2000);
      if (output.includes(`ProPro running at http://localhost:${PORT}`)) finish();
    });
    child.stderr.on('data', chunk => { errors = (errors + String(chunk)).slice(-2000); });
    child.once('error', finish);
    child.once('exit', code => finish(new Error(`The local server stopped (${code}). ${errors}`)));
  });
}

async function startServer() {
  await waitForFiles(join(__dirname, '..'));
  const deadline = Date.now() + 15000;
  for (;;) {
    try { return await startServerOnce(); }
    catch (error) {
      if (!/ERR_MODULE_NOT_FOUND|ENOENT/.test(String(error.message)) || Date.now() >= deadline) throw error;
      await pause(300);
    }
  }
}

function openWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 375,
    minHeight: 600,
    title: 'ProPro',
    webPreferences: {nodeIntegration: false, contextIsolation: true, sandbox: true}
  });
  window.setMenuBarVisibility(false);
  window.webContents.setWindowOpenHandler(({url}) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return {action: 'deny'};
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== URL) event.preventDefault();
  });
  window.loadURL(URL);
}

app.whenReady().then(async () => {
  try {
    server = await startServer();
    openWindow();
  } catch (error) {
    console.error(error);
    dialog.showErrorBox('ProPro could not start', startupMessage(error, PORT));
    app.quit();
  }
});
app.on('before-quit', () => { server?.kill(); });
app.on('window-all-closed', () => app.quit());
