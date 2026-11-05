'use strict';
// Classic script loading also supports opening index.html directly from disk.
const {DATA_KEY, PREF_KEY, CAPS, MODES, emptyData, newProject, validateData, readPrefs} = globalThis.ProProModel;

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.randomUUID();
let data = emptyData(), selected = null, detailTab = 'Overview', pendingImport = null;
let loadError = false;
try { const raw = localStorage.getItem(DATA_KEY); if (raw) data = validateData(JSON.parse(raw)); }
catch { loadError = true; }
let prefs = readPrefs(localStorage.getItem(PREF_KEY), data.projects.map(p => p.id));
const workbench = window.CockpitWorkbenchUI({document, layout: $('workbench'), explorer: $('explorer'), content: $('content'), context: $('context'), storage: localStorage, storageKey: 'propro-workbench-widths-v1', activities: [{id:'projects',label:'Projects',glyph:'▤'}], initialActivity:'projects', onActivity: () => $('dashboard-heading').focus()});
workbench.setPanelVisible('context', false);

function notice(message) { $('message').textContent = message; }
function saveData() { if (loadError) { notice('Saved data could not be read. Import a valid backup before changing projects.'); return; } try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); render(); notice('Saved locally.'); } catch { notice('Could not save. Export a backup and check browser storage.'); } }
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { notice('View preference could not be saved.'); } }
function current() { return data.projects.find(p => p.id === selected); }
function select(id) { selected = id; detailTab = 'Overview'; render(); $('detail-heading')?.focus(); }
function render() {
  const p = current();
  $('project-count').textContent = `${data.projects.length} project${data.projects.length === 1 ? '' : 's'} · Choose a card to view its work`;
  $('project-nav').innerHTML = data.projects.map(x => `<button type="button" class="nav-project" data-select="${esc(x.id)}" aria-current="${x.id === selected ? 'true':'false'}">${esc(x.name)}</button>`).join('') || '<p class="muted">No projects yet.</p>';
  document.querySelectorAll('button[data-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.mode === prefs.mode)); });
  $('cards').dataset.mode = prefs.mode;
  $('cards').innerHTML = data.projects.map(x => {
    const minimized = prefs.minimized.includes(x.id);
    const count = x.items.length + x.resources.length + x.evidence.length + x.links.length;
    return `<article class="project-card${minimized ? ' minimized':''}" data-selected="${x.id === selected}"><div class="card-main"><div class="card-copy"><span class="card-kicker">PROJECT</span><h3>${esc(x.name)}</h3><p class="card-summary">${x.capabilities.length ? x.capabilities.map(esc).join(' · ') : 'Any kind of work'} · ${count} ${count === 1 ? 'entry':'entries'}</p></div><div class="card-actions"><button type="button" data-select="${esc(x.id)}" aria-label="Open ${esc(x.name)}">Open</button><button type="button" data-minimize="${esc(x.id)}" aria-label="${minimized ? 'Expand':'Minimize'} ${esc(x.name)}" aria-pressed="${minimized}">${minimized ? 'Expand':'Minimize'}</button></div></div>${minimized ? '' : `<div class="card-meta"><span>${x.items.length} tasks</span><span>${x.resources.length} resources</span><span>${x.evidence.length} evidence</span><span>${x.links.length} links</span></div>`}</article>`;
  }).join('') || `<div class="empty"><h3>Make room for your next project</h3><p>Start with a name. Add capabilities whenever you need them.</p><button class="primary" type="button" data-new ${loadError ? 'disabled':''}>New project</button></div>`;
  $('detail').innerHTML = p ? detailHTML(p) : '';
}
function detailHTML(p) {
  const tabs = ['Overview','Tasks','Resources','Evidence','Links',...p.capabilities];
  if (!tabs.includes(detailTab)) detailTab = 'Overview';
  let body;
  if (detailTab === 'Overview') body = `<p class="muted">Keep this project flexible. Capabilities help describe the work; shared entries are always available.</p><form id="caps-form"><fieldset><legend>Capabilities</legend><div class="cap-options">${CAPS.map(c => `<label><input type="checkbox" name="cap" value="${c}" ${p.capabilities.includes(c) ? 'checked':''}>${c}</label>`).join('')}</div></fieldset><button class="primary" type="submit">Save capabilities</button></form>`;
  else if (['Tasks','Resources','Evidence','Links'].includes(detailTab)) {
    const key = {Tasks:'items',Resources:'resources',Evidence:'evidence',Links:'links'}[detailTab];
    body = `<form id="entry-form" class="entry-form"><label>New ${detailTab.toLowerCase()} entry<input name="title" maxlength="1000" required></label><button class="primary" type="submit">Add entry</button></form><ul class="entry-list">${p[key].map(x => `<li><span>${esc(x.title)}</span><button type="button" data-remove="${esc(x.id)}" data-kind="${key}" aria-label="Remove ${esc(x.title)}">Remove</button></li>`).join('')}</ul>${p[key].length ? '' : '<p class="muted">No entries yet.</p>'}`;
  } else body = `<p class="muted">${esc(detailTab)} is enabled. A specialist editor is not available yet; use the shared entries above.</p>`;
  return `<section class="detail-panel" aria-label="Selected project"><div class="detail-head"><div><p class="eyebrow">Selected project</p><h2 id="detail-heading" tabindex="-1">${esc(p.name)}</h2></div><form id="rename-form" class="rename-form"><label>Rename project<input name="name" maxlength="200" required value="${esc(p.name)}"></label><button type="submit">Rename</button></form></div><div class="detail-tabs" role="group" aria-label="Project sections">${tabs.map(t => `<button type="button" data-tab="${esc(t)}" aria-pressed="${t === detailTab}">${esc(t)}</button>`).join('')}</div><div class="detail-body">${body}</div></section>`;
}
$('create-caps').innerHTML = CAPS.map(c => `<label><input type="checkbox" name="cap" value="${c}">${c}</label>`).join('');
document.addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.dataset.new !== undefined || button.id === 'new-project') { $('project-dialog').showModal(); $('project-form').elements.name.focus(); }
  if (button.dataset.mode && MODES.includes(button.dataset.mode)) { prefs.mode = button.dataset.mode; savePrefs(); render(); }
  if (button.dataset.select) select(button.dataset.select);
  if (button.dataset.minimize) { const id = button.dataset.minimize; prefs.minimized = prefs.minimized.includes(id) ? prefs.minimized.filter(x => x !== id) : [...prefs.minimized, id]; savePrefs(); render(); document.querySelector(`[data-minimize="${CSS.escape(id)}"]`)?.focus(); }
  if (button.dataset.tab) { detailTab = button.dataset.tab; render(); document.querySelector(`[data-tab="${CSS.escape(detailTab)}"]`)?.focus(); }
  if (button.dataset.remove) { const p = current(), key = button.dataset.kind; if (p && ['items','resources','evidence','links'].includes(key)) { p[key] = p[key].filter(x => x.id !== button.dataset.remove); saveData(); } }
});
document.addEventListener('submit', e => {
  const form = e.target;
  if (!['project-form','rename-form','caps-form','entry-form'].includes(form.id)) return;
  e.preventDefault();
  if (form.id === 'project-form') { const name = form.elements.name.value.trim(); if (!name) return; const p = newProject(uid(), name.slice(0,200), [...form.querySelectorAll('input[name="cap"]:checked')].map(x => x.value)); data.projects.push(p); selected = p.id; detailTab = 'Overview'; saveData(); form.reset(); $('project-dialog').close(); notice('Project created and saved locally.'); $('detail-heading')?.focus(); }
  if (form.id === 'rename-form') { const name = form.elements.name.value.trim(); if (name && current()) { current().name = name.slice(0,200); saveData(); notice('Project renamed.'); } }
  if (form.id === 'caps-form' && current()) { current().capabilities = [...form.querySelectorAll('input:checked')].map(x => x.value); saveData(); }
  if (form.id === 'entry-form' && current()) { const key = {Tasks:'items',Resources:'resources',Evidence:'evidence',Links:'links'}[detailTab], title = form.elements.title.value.trim(); if (key && title) { current()[key].push({id:uid(),title}); saveData(); } }
});
$('cancel-project').onclick = () => $('project-dialog').close();
$('export').onclick = () => { const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'propro-projects.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Exported project backup.'); };
$('import').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; try { if (file.size > 5_000_000) throw Error('File too large'); pendingImport = validateData(JSON.parse(await file.text())); $('import-dialog').showModal(); } catch (error) { pendingImport = null; notice('Import failed: ' + error.message); } };
$('cancel-import').onclick = () => { pendingImport = null; $('import-dialog').close(); };
$('import-dialog').addEventListener('close', () => { if (!$('import-dialog').open) pendingImport = null; });
$('confirm-import').onclick = () => { if (!pendingImport) return; data = pendingImport; pendingImport = null; loadError = false; $('new-project').disabled = false; selected = null; detailTab = 'Overview'; prefs = readPrefs(JSON.stringify(prefs), data.projects.map(p => p.id)); saveData(); savePrefs(); $('import-dialog').close(); notice('Imported project backup.'); };
render();
if (loadError) { $('new-project').disabled = true; notice('Saved data could not be read. Import a valid backup; existing browser data was left untouched.'); }
