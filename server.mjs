import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createChatService} from './chat-service.mjs';
import {createWorkflow} from './bootdog-workflow.mjs';
import {readGitStatus} from './git-status.mjs';
import {openInVSCode} from './ide-launch.mjs';
import {createAgentRuns} from './agent-runs.mjs';
import {NewsroomDiscovery} from '@governancecommons/observatory-core/src/discovery/newsroom.mjs';
import './model.mjs';
const runFile = promisify(execFile);
const root = dirname(fileURLToPath(import.meta.url));
const chat = await createChatService({file:process.env.PROPRO_CHAT_STORE||join(root,'.propro','agents.json'),cwd:root});
const runs = await createAgentRuns({file:process.env.PROPRO_RUN_STORE||join(root,'.propro','runs.json')});
const newsroom = await NewsroomDiscovery.open(process.env.PROPRO_NEWSROOM_STORE||join(root,'.propro','newsroom.json'));
if (!newsroom.providers().find(p=>p.id==='rss')?.status.lastSuccess) void newsroom.collect('rss').catch(error=>console.error('Newsroom first collection:',error.message));
const rssPoll=setInterval(()=>{if(newsroom.providers().find(p=>p.id==='rss')?.enabled)void newsroom.collect('rss').catch(error=>console.error('Newsroom RSS poll:',error.message));},30*60*1000);
rssPoll.unref();
const workflow = createWorkflow({root,...(process.env.PROPRO_BOOTDOG_STORE?{stateFile:process.env.PROPRO_BOOTDOG_STORE}:{})});
const workflowFiles=new Map([['README.md','README.md'],['Product charter','docs/PRODUCT-CHARTER.md'],['Implementation record','docs/PROP-CKP-001B-IMPLEMENTATION.md'],['Workspace plan','docs/PROPRO-002.md']]);
const reportsDir=join(root,'bootdog','work','sitreps');
const routes = new Map([
  ['/', ['index.html','text/html']], ['/index.html', ['index.html','text/html']],
  ['/styles.css', ['styles.css','text/css']], ['/themes.css', ['themes.css','text/css']], ['/theme-registry.js', ['theme-registry.js','text/javascript']], ['/app.mjs', ['app.mjs','text/javascript']], ['/model.mjs', ['model.mjs','text/javascript']],
  ['/chat-client.mjs',['chat-client.mjs','text/javascript']],
  ['/newsroom-ui.js',['newsroom-ui.js','text/javascript']],
  ['/agent-manager-model.js',['agent-manager-model.js','text/javascript']], ['/agent-manager-ui.js',['agent-manager-ui.js','text/javascript']],
  ['/agent-runs-ui.js',['agent-runs-ui.js','text/javascript']],
  ['/workflow/',['workflow-ui/index.html','text/html']], ['/workflow/index.html',['workflow-ui/index.html','text/html']], ['/workflow/app.js',['workflow-ui/app.js','text/javascript']], ['/workflow/style.css',['workflow-ui/style.css','text/css']],
  ['/node_modules/@cockpit/gui/src/workbenchUI.js', ['node_modules/@cockpit/gui/src/workbenchUI.js','text/javascript']],
  ['/node_modules/@cockpit/gui/src/tabbedExplorerUI.js', ['node_modules/@cockpit/gui/src/tabbedExplorerUI.js','text/javascript']],
  ['/node_modules/@cockpit/gui/src/cockpitGUI.css', ['node_modules/@cockpit/gui/src/cockpitGUI.css','text/css']]
]);
const port = Number(process.env.PORT || 8000);
const server=createServer(async (req, res) => {
  const url=new URL(req.url,'http://localhost');
  const json=(data,status=200)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))};
  if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||''))return json({error:'Host not allowed'},403);
  if(url.pathname.startsWith('/api/newsroom/')) {try {
    if(req.method==='GET'&&url.pathname==='/api/newsroom/articles')return json(newsroom.list());
    if(req.method==='GET'&&url.pathname==='/api/newsroom/providers')return json(newsroom.providers());
    if(req.method!=='POST'||req.headers.origin!==`http://${req.headers.host}`)return json({error:'Method or origin not allowed'},403);
    req.setEncoding('utf8');let body='',size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>200000)return json({error:'Request too large'},413);body+=chunk}
    const input=JSON.parse(body||'{}');
    if(url.pathname==='/api/newsroom/triage')return json(await newsroom.triage(input.id,input.decision));
    if(url.pathname==='/api/newsroom/provider')return json(await newsroom.configure(input));
    if(url.pathname==='/api/newsroom/collect')return json(await newsroom.collect(input.id));
    if(url.pathname==='/api/newsroom/import')return json(await newsroom.importBriefing(input));
    return json({error:'Not found'},404);
  }catch(error){return json({error:String(error.message||'Newsroom error').slice(0,300)},error instanceof TypeError?400:500)}}
  if(url.pathname==='/api/agent-manager/status') {
    if(req.method!=='GET')return json({error:'Method not allowed'},405);
    let installed=false;
    try { await runFile('codex',['--version'],{windowsHide:true,timeout:3000}); installed=true; } catch {}
    const local=await chat.models();
    return json({codex:{installed},ollama:{available:local.available,models:local.models.length},claude:{installed:false}});
  }
  if(url.pathname==='/api/bootdog') {try {
    if(req.method==='GET')return json(await workflow.read());
    if(req.method!=='PUT')return json({error:'Method not allowed'},405);
    if(req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>4096)return json({error:'Request too large'},413);body+=chunk.toString()}
    const saved=await workflow.save(JSON.parse(body));return json(saved);
  }catch(error){return json({error:error.status?error.message:'Could not read or save local workflow.'},error.status||500)}}
  if(url.pathname==='/api/bootdog/file'&&req.method==='GET') {const path=workflowFiles.get(url.searchParams.get('name'));if(!path)return json({error:'File not available'},404);try{return json({name:url.searchParams.get('name'),path,text:(await readFile(join(root,path),'utf8')).slice(0,200000)})}catch{return json({error:'File unavailable'},404)}}
  if(url.pathname==='/api/bootdog/reports'&&req.method==='GET') {try{const ids=(await readdir(reportsDir)).filter(name=>/^\d{4}-\d\d-\d\dT[\d.\-Z]+\.json$/.test(name)).sort().reverse().slice(0,30);return json(ids)}catch{return json([])}}
  if(url.pathname==='/api/bootdog/report'&&req.method==='GET') {const id=url.searchParams.get('id');if(!id||!/^\d{4}-\d\d-\d\dT[\d.\-Z]+\.json$/.test(id))return json({error:'Invalid report'},400);try{const report=JSON.parse(await readFile(join(reportsDir,id),'utf8'));return json({id,title:report.title,generatedAt:report.generatedAt,head:report.head,narrative:report.narrative||'',notes:report.notes||[]})}catch{return json({error:'Report unavailable'},404)}}
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
  if(url.pathname==='/api/git/status') {
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    if(req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    try {
      req.setEncoding('utf8');let body='',size=0;
      for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>4096)return json({error:'Request too large'},413);body+=chunk}
      const connection=globalThis.ProProModel.validateConnection(JSON.parse(body));
      return json(await readGitStatus(connection));
    } catch(error) {return json({error:error.status?error.message:'Could not read Git status'},error.status||400)}
  }
  if(url.pathname==='/api/ide/vscode/open') {
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    if(req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    try {
      req.setEncoding('utf8');let body='',size=0;
      for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>4096)return json({error:'Request too large'},413);body+=chunk}
      const connection=globalThis.ProProModel.validateConnection(JSON.parse(body));
      return json(await openInVSCode(connection));
    } catch(error) {return json({error:error.status?error.message:'Could not open VS Code'},error.status||400)}
  }
  if(url.pathname.startsWith('/api/runs')) {try {
    if(req.method==='GET'&&url.pathname==='/api/runs')return json(runs.list());
    if(req.method==='GET'&&url.pathname==='/api/runs/item')return json(runs.get(url.searchParams.get('id')));
    if(req.method!=='POST'||!['/api/runs','/api/runs/stop'].includes(url.pathname))return json({error:'Method not allowed'},405);
    if(req.headers.origin!==`http://${req.headers.host}`)return json({error:'Origin not allowed'},403);
    req.setEncoding('utf8');let body='',size=0;
    for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>16384)return json({error:'Request too large'},413);body+=chunk}
    let input;try{input=JSON.parse(body);if(!input||typeof input!=='object'||Array.isArray(input))throw Error()}catch{return json({error:'Invalid request'},400)}
    if(url.pathname==='/api/runs')return json(await runs.start(input),202);
    return json(await runs.cancel(input.id));
  }catch(error){return json({error:error.status?error.message:'Agent run unavailable.'},error.status||500)}}
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
process.once('SIGINT',async()=>{await Promise.all([chat.stop(),runs.stop()]);server.close(()=>process.exit(0))});
process.once('SIGTERM',async()=>{await Promise.all([chat.stop(),runs.stop()]);server.close(()=>process.exit(0))});
