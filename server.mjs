import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createChatService} from './chat-service.mjs';
import './model.mjs';
const runFile = promisify(execFile);
const root = dirname(fileURLToPath(import.meta.url));
const chat = await createChatService({file:process.env.PROPRO_CHAT_STORE||join(root,'.propro','agents.json'),cwd:root});
const routes = new Map([
  ['/', ['index.html','text/html']], ['/index.html', ['index.html','text/html']],
  ['/styles.css', ['styles.css','text/css']], ['/app.mjs', ['app.mjs','text/javascript']], ['/model.mjs', ['model.mjs','text/javascript']],
  ['/chat-client.mjs',['chat-client.mjs','text/javascript']],
  ['/node_modules/@cockpit/gui/src/workbenchUI.js', ['node_modules/@cockpit/gui/src/workbenchUI.js','text/javascript']],
  ['/node_modules/@cockpit/gui/src/tabbedExplorerUI.js', ['node_modules/@cockpit/gui/src/tabbedExplorerUI.js','text/javascript']],
  ['/node_modules/@cockpit/gui/src/cockpitGUI.css', ['node_modules/@cockpit/gui/src/cockpitGUI.css','text/css']]
]);
const port = Number(process.env.PORT || 8000);
const server=createServer(async (req, res) => {
  const url=new URL(req.url,'http://localhost');
  const json=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))};
  if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||''))return json({error:'Host not allowed'},403);
  if(url.pathname==='/api/resources/open') {
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    if(req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    if(process.platform!=='win32')return json({error:'Local opening requires Windows'},501);
    try {
      req.setEncoding('utf8');let body='',size=0;
      for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>4096)return json({error:'Request too large'},413);body+=chunk}
      const connection=globalThis.ProProModel.validateConnection(JSON.parse(body));
      if(connection.kind==='url')return json({error:'Open URLs in the browser'},400);
      const info=await stat(connection.locator);
      if(connection.kind==='folder' ? !info.isDirectory() : !info.isFile())return json({error:'Resource type does not match path'},400);
      await runFile('powershell.exe',['-NoProfile','-NonInteractive','-File',join(root,'open-resource.ps1'),connection.locator],{windowsHide:true,timeout:10000});
      return json({opened:true});
    } catch(error) {return json({error:error.code==='ENOENT'?'Resource was not found':'Could not open this resource'},400)}
  }
  if(url.pathname.startsWith('/api/chat/')){try{
    if(req.method==='POST'&&req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    if(req.method==='GET'&&url.pathname==='/api/chat/sessions')return json(chat.list(url.searchParams.get('environment')||'codex'));
    if(req.method==='GET'&&url.pathname==='/api/chat/session')return json(chat.get(url.searchParams.get('id')));
    if(req.method==='GET'&&url.pathname==='/api/chat/ollama')return json(await chat.models());
    if(req.method==='POST'){req.setEncoding('utf8');let text='',size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>65536)return json({error:'Request too large'},413);text+=chunk}let body;try{body=text.trim()?JSON.parse(text):{};if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return json({error:'Invalid request'},400)}
      if(url.pathname==='/api/chat/sessions')return json(await chat.create({environment:body.environment,model:body.model}),201);
      if(url.pathname==='/api/chat/send')return json(await chat.send(body.sessionId,body.message,body.context),202);
      if(url.pathname==='/api/chat/stop')return json(await chat.cancel(body.sessionId));
    }return json({error:'Not found'},404);
  }catch(error){return json({error:error.status?error.message:'Conversation service unavailable.'},error.status||500)}}
  if(req.method!=='GET'){res.writeHead(405);res.end('Method not allowed');return}
  const route = routes.get(url.pathname);
  if (!route) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(join(root, route[0]));
    res.writeHead(200, {'content-type': route[1] + '; charset=utf-8', 'x-content-type-options':'nosniff'}); res.end(body);
  } catch { res.writeHead(500); res.end('Asset unavailable. Run npm ci.'); }
}).listen(port,'127.0.0.1', () => console.log(`ProPro running at http://localhost:${port}`));
process.once('SIGINT',async()=>{await chat.stop();server.close(()=>process.exit(0))});
process.once('SIGTERM',async()=>{await chat.stop();server.close(()=>process.exit(0))});
