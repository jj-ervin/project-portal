(function () {
'use strict';
const root = document.getElementById('corral-root');
if (!root) return;
const KEY = 'propro-corral-v1';
const id = () => (globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
const blank = () => ({id:id(),title:'New exploration',objective:'',scope:'',constraints:'',nextActions:'',estimate:'',references:[],links:[],notes:'',updatedAt:new Date().toISOString()});
let sessions = [], active = null;
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (raw.version === 1 && Array.isArray(raw.sessions)) {
    sessions = raw.sessions.filter(s => s && typeof s.id === 'string' && typeof s.title === 'string').slice(0,100).map(s => ({
      ...blank(),...s,
      references:Array.isArray(s.references) ? s.references.slice(0,50).filter(r => r && typeof r.name === 'string') : [],
      links:Array.isArray(s.links) ? s.links.slice(0,50).filter(r => typeof r === 'string') : []
    }));
    active = raw.active;
  }
} catch {}
if (!sessions.length) sessions.push(blank());
if (!sessions.some(s => s.id === active)) active = sessions[0].id;
const current = () => sessions.find(s => s.id === active);
function persist() {
  current().updatedAt = new Date().toISOString();
  try { localStorage.setItem(KEY,JSON.stringify({version:1,active,sessions})); status.textContent = 'Saved locally'; }
  catch { status.textContent = 'Storage full or unavailable — export your handoff now'; }
}
root.innerHTML = `<div class="corral-shell">
  <div class="corral-row"><label for="corral-session">Exploration</label><select id="corral-session"></select><button id="corral-new" type="button">New</button></div>
  <p class="corral-muted">Optional organizational intake. Works without AI. No files are uploaded or read.</p>
  <label>Title<input id="corral-title" maxlength="200"></label>
  <label>Notes / initial thought<textarea id="corral-notes" rows="3" maxlength="12000" placeholder="What are you trying to figure out?"></textarea></label>
  <div class="corral-drop" id="corral-drop" tabindex="0">Drop files or images here to record their names (not contents). <label>Choose files<input id="corral-files" type="file" multiple></label></div>
  <ul id="corral-references"></ul>
  <div class="corral-row"><label for="corral-link">Web/resource link</label><input id="corral-link" type="url" placeholder="https://example.org"><button id="corral-add-link" type="button">Add</button></div>
  <ul id="corral-links"></ul>
  <div class="corral-fields">
  <label>Objective<textarea id="corral-objective" rows="2" maxlength="4000"></textarea></label>
  <label>Scope / proposed organization<textarea id="corral-scope" rows="2" maxlength="4000"></textarea></label>
  <label>Constraints / open questions<textarea id="corral-constraints" rows="2" maxlength="4000"></textarea></label>
  <label>Next actions (up to three recommended)<textarea id="corral-nextActions" rows="3" maxlength="4000"></textarea></label>
  <label>Effort / timeline estimate and assumptions<textarea id="corral-estimate" rows="2" maxlength="4000"></textarea></label>
  </div>
  <div class="corral-row"><button id="corral-copy" type="button">Copy handoff</button><button id="corral-download" type="button">Export JSON</button><span id="corral-status" role="status" aria-live="polite"></span></div>
</div>`;
const $ = x => root.querySelector('#corral-'+x);
const status = $('status');
const fields=['title','notes','objective','scope','constraints','nextActions','estimate'];
function textNode(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}
function listRender(name,values,formatter,remove){
 const ul=$(name);ul.replaceChildren();
 values.forEach((v,i)=>{const li=document.createElement('li');li.append(textNode('span',formatter(v)));
 const b=textNode('button','Remove');b.type='button';b.setAttribute('aria-label','Remove '+formatter(v));b.addEventListener('click',()=>{remove(i);persist();render();});li.append(b);ul.append(li);});
}
function render(){
 const select=$('session');select.replaceChildren();
 sessions.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.title||'Untitled';select.append(o);});select.value=active;
 fields.forEach(k=>$(k).value=current()[k]||'');
 listRender('references',current().references,r=>r.name+' ('+r.size+' bytes; reference only)',i=>current().references.splice(i,1));
 listRender('links',current().links,x=>x,i=>current().links.splice(i,1));
}
fields.forEach(k=>$(k).addEventListener('input',()=>{current()[k]=$(k).value;if(k==='title')$('session').selectedOptions[0].textContent=current().title||'Untitled';persist();}));
$('session').addEventListener('change',()=>{active=$('session').value;persist();render();});
$('new').addEventListener('click',()=>{sessions.unshift(blank());active=sessions[0].id;persist();render();$('title').focus();});
function addFiles(files){
 const target=current().references;
 for(const file of [...files].slice(0,50-target.length)){target.push({name:file.name.slice(0,255),size:file.size,type:file.type||'',lastModified:file.lastModified});}
 persist();render();
}
$('files').addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});
const drop=$('drop');
drop.addEventListener('dragover',e=>{e.preventDefault();});
drop.addEventListener('drop',e=>{e.preventDefault();if(e.dataTransfer?.files?.length)addFiles(e.dataTransfer.files);});
$('add-link').addEventListener('click',()=>{
 try {const url=new URL($('link').value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error();if(current().links.length>=50)throw Error();current().links.push(url.href);$('link').value='';persist();render();}
 catch {status.textContent='Enter a valid HTTP(S) link (maximum 50)';}
});
function handoff(){
 const s=current();return {schema:'propro.corral.handoff.v0.1',title:s.title,objective:s.objective,notes:s.notes,scope:s.scope,constraints:s.constraints,proposedNextActions:s.nextActions,estimateAndAssumptions:s.estimate,references:s.references.map(r=>({name:r.name,size:r.size,type:r.type,contentAvailable:false})),links:s.links,notice:'References are metadata only. No file content, tool access or execution permissions are granted.'};
}
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(handoff(),null,2));status.textContent='Handoff copied';}catch{status.textContent='Clipboard unavailable; use Export JSON';}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(handoff(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='corral-handoff.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();
})();
