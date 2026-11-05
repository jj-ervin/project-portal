import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
const routes = new Map([
  ['/', ['index.html','text/html']], ['/index.html', ['index.html','text/html']],
  ['/styles.css', ['styles.css','text/css']], ['/app.mjs', ['app.mjs','text/javascript']], ['/model.mjs', ['model.mjs','text/javascript']],
  ['/cockpit/workbench.js', ['node_modules/@cockpit/gui/src/workbenchUI.js','text/javascript']],
  ['/cockpit/styles.css', ['node_modules/@cockpit/gui/src/cockpitGUI.css','text/css']]
]);
const port = Number(process.env.PORT || 8000);
createServer(async (req, res) => {
  const route = routes.get(new URL(req.url, 'http://localhost').pathname);
  if (!route) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(join(root, route[0]));
    res.writeHead(200, {'content-type': route[1] + '; charset=utf-8', 'x-content-type-options':'nosniff'}); res.end(body);
  } catch { res.writeHead(500); res.end('Asset unavailable. Run npm ci.'); }
}).listen(port, () => console.log(`ProPro running at http://localhost:${port}`));
