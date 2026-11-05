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
let filterQuery = '';
let attachments = [];
let composerSuggestions = [];
let workspaceTabs = [{id:'home',kind:'home',title:'Home'}];
let activeWorkspaceTab = 'home';
const workbench = window.CockpitWorkbenchUI({document, layout: $('workbench'), explorer: $('explorer'), content: $('content'), context: $('context'), storage: localStorage, storageKey: 'propro-workbench-widths-v1', activities: [
  {id:'home',label:'Home',glyph:'⌂'}, {id:'projects',label:'Projects',glyph:'▤'},
  {id:'search',label:'Search',glyph:'⌕'}, {id:'conversation',label:'Conversation',glyph:'✦'}
], initialActivity:'home', onActivity: id => {
  workbench.activate(id);
  if (id === 'home') { detailTab = 'Overview'; filterQuery = ''; $('global-search').value = ''; activateWorkspaceTab('home'); $('dashboard-heading').focus(); }
  if (id === 'projects') { workbench.setPanelVisible('explorer', true); syncLayoutControls(); activateWorkspaceTab('home'); (document.querySelector('.nav-project') || document.querySelector('.explorer-head button')).focus(); }
  if (id === 'search') { activateWorkspaceTab('home'); $('global-search').focus(); }
  if (id === 'conversation') { workbench.setPanelVisible('context', true); activateUtilityTab('conversation'); syncLayoutControls(); $('composer-input').focus(); }
}});
function syncLayoutControls() {
  const explorerVisible = workbench.panelVisible('explorer');
  const contextVisible = workbench.panelVisible('context');
  const dock = workbench.contextDock();
  const left = $('toggle-explorer');
  left.setAttribute('aria-label', dock === 'left' ? 'Toggle left panel' : 'Toggle primary sidebar');
  left.setAttribute('title', dock === 'left' ? 'Toggle left panel' : 'Toggle primary sidebar');
  left.setAttribute('aria-controls', dock === 'left' ? 'context' : 'explorer');
  left.setAttribute('aria-pressed', String(dock === 'left' ? contextVisible : explorerVisible));
  $('dock-right').setAttribute('aria-controls', dock === 'left' ? 'explorer' : 'context');
  $('dock-right').setAttribute('aria-pressed', String(dock === 'left' ? explorerVisible : contextVisible && dock === 'right'));
  $('dock-bottom').setAttribute('aria-pressed', String(contextVisible && dock === 'bottom'));
}
syncLayoutControls();
const utilityTabs = ['conversation', 'terminal', 'problems', 'notes'];
const utilityLabels = {conversation:'Conversation', terminal:'CLI scratchpad', problems:'Problems', notes:'Notes'};
const tabStrip = document.createElement('div');
tabStrip.className = 'utility-tabs';
tabStrip.setAttribute('role', 'tablist');
tabStrip.setAttribute('aria-label', 'Panel views');
for (const id of utilityTabs) {
  const button = document.createElement('button');
  button.type = 'button'; button.id = `utility-tab-${id}`;
  button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', `utility-${id}`);
  button.textContent = utilityLabels[id];
  tabStrip.append(button);
}
const conversationView = document.createElement('div');
conversationView.id = 'utility-conversation'; conversationView.className = 'utility-view conversation-view';
conversationView.setAttribute('role', 'tabpanel'); conversationView.setAttribute('aria-labelledby', 'utility-tab-conversation');
conversationView.append($('context').querySelector('.context-content'), $('composer'));
$('context').append(tabStrip, conversationView);
const extraViews = {
  terminal: '<p class="context-eyebrow">LOCAL COMMAND PREVIEW</p><h3>CLI scratchpad</h3><p>Try /help or /status. Nothing runs on your computer.</p><form id="scratch-form"><label for="scratch-input">Command</label><div class="scratch-row"><input id="scratch-input" autocomplete="off" placeholder="/help"><button type="submit">Preview</button></div></form><output id="scratch-output" role="status" aria-live="polite"></output>',
  problems: '<p class="context-eyebrow">WORKSPACE STATUS</p><h3>Problems</h3><p id="problem-summary"></p>',
  notes: '<p class="context-eyebrow">LOCAL SCRATCH NOTES</p><h3>Notes</h3><label for="panel-notes">Saved in this browser</label><textarea id="panel-notes" rows="8" placeholder="Keep a quick note here…"></textarea>'
};
for (const id of ['terminal', 'problems', 'notes']) {
  const panel = document.createElement('section');
  panel.id = `utility-${id}`; panel.className = 'utility-view utility-extra';
  panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `utility-tab-${id}`);
  panel.innerHTML = extraViews[id]; $('context').append(panel);
}
const utilityTabKey = 'propro-panel-tab-v1';
function activateUtilityTab(id) {
  if (!utilityTabs.includes(id)) id = 'conversation';
  for (const name of utilityTabs) {
    const active = name === id;
    $(`utility-tab-${name}`).setAttribute('aria-selected', String(active));
    $(`utility-tab-${name}`).tabIndex = active ? 0 : -1;
    $(`utility-${name}`).hidden = !active;
  }
  if (id === 'problems') $('problem-summary').textContent = loadError ? 'Saved project data could not be read. Import a valid backup before editing.' : 'No project data problems detected. This view does not inspect external services.';
  try { localStorage.setItem(utilityTabKey, id); } catch {}
}
let initialUtilityTab = 'conversation';
try { initialUtilityTab = localStorage.getItem(utilityTabKey) || 'conversation'; } catch {}
activateUtilityTab(initialUtilityTab);
tabStrip.addEventListener('click', event => { const tab = event.target.closest('[role="tab"]'); if (tab) activateUtilityTab(tab.id.replace('utility-tab-', '')); });
tabStrip.addEventListener('keydown', event => {
  const current = utilityTabs.findIndex(id => $(`utility-tab-${id}`) === document.activeElement);
  if (current < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? utilityTabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + utilityTabs.length) % utilityTabs.length;
  activateUtilityTab(utilityTabs[next]); $(`utility-tab-${utilityTabs[next]}`).focus();
});
$('scratch-form').addEventListener('submit', event => {
  event.preventDefault();
  const command = $('scratch-input').value.trim();
  $('scratch-output').textContent = command === '/help' ? 'Available previews: /help and /status. No commands are executed.' : command === '/status' ? `${data.projects.length} local projects. No terminal connection is active.` : command ? `${command} is not connected. Nothing was executed.` : 'Enter /help or /status.';
});
try { $('panel-notes').value = localStorage.getItem('propro-panel-notes-v1') || ''; } catch {}
$('panel-notes').addEventListener('input', () => { try { localStorage.setItem('propro-panel-notes-v1', $('panel-notes').value); } catch { notice('Could not save the note in this browser.'); } });
const swapButton = document.createElement('button');
swapButton.id = 'swap-side-panes'; swapButton.type = 'button'; swapButton.textContent = 'Swap left and right panes';
$('reset-layout').before(swapButton);
swapButton.addEventListener('click', () => { workbench.dockContext(workbench.contextDock() === 'left' ? 'right' : 'left'); syncLayoutControls(); $('layout-menu').open = false; });

// Center tabs represent work items. Side and bottom panes keep their own layout state.
const center = $('content');
const dashboardView = document.createElement('div');
dashboardView.id = 'dashboard-view';
for (const child of [...center.children]) if (child.id !== 'detail') dashboardView.append(child);
const workspaceExtra = document.createElement('section');
workspaceExtra.id = 'workspace-extra'; workspaceExtra.setAttribute('aria-label', 'Open workspace item');
const editorTabs = document.createElement('div');
editorTabs.className = 'editor-tabs';
editorTabs.innerHTML = '<div id="editor-tab-list" role="tablist" aria-label="Open workspace tabs"></div><div class="editor-actions"><button id="open-cli-tab" type="button">Open CLI</button><label class="open-file-button">Open file<input id="open-workspace-file" type="file" accept=".md,.txt,.json,.js,.ts,.css,.html,.pdf,text/plain,text/markdown,application/pdf"></label></div>';
center.append(editorTabs, dashboardView, $('detail'), workspaceExtra);
function workspaceTab(id) { return workspaceTabs.find(tab => tab.id === id); }
function openProjectTab(id) {
  const project = data.projects.find(item => item.id === id);
  if (!project) return;
  const tabId = `project:${id}`;
  if (!workspaceTab(tabId)) workspaceTabs.push({id:tabId,kind:'project',projectId:id});
  activateWorkspaceTab(tabId);
}
function openCliTab() {
  if (!workspaceTab('cli')) workspaceTabs.push({id:'cli',kind:'cli',title:'CLI scratchpad'});
  activateWorkspaceTab('cli');
}
function activateWorkspaceTab(id) {
  const tab = workspaceTab(id) || workspaceTabs[0];
  activeWorkspaceTab = tab.id;
  selected = tab.kind === 'project' ? tab.projectId : null;
  render();
}
function closeWorkspaceTab(id) {
  if (id === 'home') return;
  const index = workspaceTabs.findIndex(tab => tab.id === id);
  const tab = workspaceTabs[index];
  if (!tab) return;
  if (tab.url) URL.revokeObjectURL(tab.url);
  workspaceTabs.splice(index, 1);
  if (activeWorkspaceTab === id) activateWorkspaceTab(workspaceTabs[Math.max(0,index - 1)].id);
  else renderWorkspaceTabs();
}
function renderWorkspaceTabs() {
  const list = $('editor-tab-list');
  list.innerHTML = '';
  for (const tab of workspaceTabs) {
    const group = document.createElement('div'); group.className = 'editor-tab-item';
    const button = document.createElement('button');
    button.type = 'button'; button.setAttribute('role','tab');
    button.dataset.workspaceTab = tab.id;
    button.setAttribute('aria-selected',String(tab.id === activeWorkspaceTab));
    button.setAttribute('aria-controls',tab.kind === 'home' ? 'dashboard-view' : tab.kind === 'project' ? 'detail' : 'workspace-extra');
    button.tabIndex = tab.id === activeWorkspaceTab ? 0 : -1;
    button.textContent = tab.kind === 'project' ? (data.projects.find(p => p.id === tab.projectId)?.name || 'Project') : tab.title;
    group.append(button);
    if (tab.id !== 'home') {
      const close = document.createElement('button'); close.type = 'button'; close.className = 'close-editor-tab';
      close.dataset.closeWorkspaceTab = tab.id; close.setAttribute('aria-label',`Close ${button.textContent} tab`); close.textContent = '×';
      group.append(close);
    }
    list.append(group);
  }
  dashboardView.hidden = activeWorkspaceTab !== 'home';
  $('detail').hidden = workspaceTab(activeWorkspaceTab)?.kind !== 'project';
  workspaceExtra.hidden = !['cli','file'].includes(workspaceTab(activeWorkspaceTab)?.kind);
  const active = workspaceTab(activeWorkspaceTab);
  workspaceExtra.replaceChildren();
  if (active?.kind === 'cli') {
    workspaceExtra.innerHTML = '<p class="eyebrow">WORKSPACE / CLI</p><h2>CLI scratchpad</h2><p class="muted">Preview local informational commands. Nothing runs on your computer.</p><form id="workspace-cli-form"><label for="workspace-cli-input">Command</label><div class="scratch-row"><input id="workspace-cli-input" placeholder="/help" autocomplete="off"><button type="submit">Preview</button></div></form><output id="workspace-cli-output" role="status" aria-live="polite"></output>';
    $('workspace-cli-input').value = active.commandDraft || '';
    $('workspace-cli-output').textContent = active.commandOutput || '';
  } else if (active?.kind === 'file') {
    const heading = document.createElement('h2'); heading.textContent = active.title;
    const note = document.createElement('p'); note.className = 'muted'; note.textContent = 'Local read-only preview · This file stays in this browser tab.';
    workspaceExtra.append(heading,note);
    if (active.fileType === 'pdf') {
      const viewer = document.createElement('iframe'); viewer.title = `PDF preview: ${active.title}`; viewer.src = active.url; viewer.className = 'workspace-pdf'; workspaceExtra.append(viewer);
    } else {
      const code = document.createElement('pre'); code.className = 'workspace-text'; code.textContent = active.content; workspaceExtra.append(code);
    }
  }
}
function commandPreview(command) {
  return command === '/help' ? 'Available previews: /help and /status. No commands are executed.' : command === '/status' ? `${data.projects.length} local projects. No terminal connection is active.` : command ? `${command} is not connected. Nothing was executed.` : 'Enter /help or /status.';
}
$('editor-tab-list').addEventListener('click', event => {
  const close = event.target.closest('[data-close-workspace-tab]');
  if (close) { closeWorkspaceTab(close.dataset.closeWorkspaceTab); return; }
  const tab = event.target.closest('[data-workspace-tab]');
  if (tab) activateWorkspaceTab(tab.dataset.workspaceTab);
});
$('editor-tab-list').addEventListener('keydown', event => {
  const tabs = [...$('editor-tab-list').querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(document.activeElement);
  if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  activateWorkspaceTab(tabs[next].dataset.workspaceTab);
  $('editor-tab-list').querySelectorAll('[role="tab"]')[next].focus();
});
$('open-cli-tab').addEventListener('click', openCliTab);
$('open-workspace-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  const pdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (file.size > (pdf ? 10_000_000 : 2_000_000)) { notice('This file is too large for a local preview.'); return; }
  if (!pdf && !/\.(md|txt|json|js|ts|css|html)$/i.test(file.name)) { notice('Choose a text, Markdown, code or PDF file.'); return; }
  try {
    const tab = {id:`file:${uid()}`,kind:'file',title:file.name,fileType:pdf ? 'pdf' : 'text'};
    if (pdf) tab.url = URL.createObjectURL(file); else tab.content = await file.text();
    workspaceTabs.push(tab); activateWorkspaceTab(tab.id);
  } catch { notice('Could not open that local file.'); }
});
workspaceExtra.addEventListener('submit', event => {
  if (event.target.id !== 'workspace-cli-form') return;
  event.preventDefault();
  const output = commandPreview($('workspace-cli-input').value.trim());
  workspaceTab('cli').commandOutput = output;
  $('workspace-cli-output').textContent = output;
});
workspaceExtra.addEventListener('input', event => { if (event.target.id === 'workspace-cli-input') workspaceTab('cli').commandDraft = event.target.value; });

function matchesProject(project, query) {
  const text = [project.name, ...project.capabilities, ...['items','resources','evidence','links'].flatMap(key => project[key].map(item => item.title))].join(' ').toLowerCase();
  return text.includes(query);
}
function projectSummary(project) {
  const count = project.items.length + project.resources.length + project.evidence.length + project.links.length;
  return `${count} ${count === 1 ? 'entry' : 'entries'} · ${project.capabilities.join(', ') || 'No capability labels'}`;
}
function renderAttachments() {
  $('composer-attachments').innerHTML = attachments.map((file, index) => `<span class="attachment-chip">${esc(file.name)} <button type="button" data-attachment="${index}" aria-label="Remove ${esc(file.name)}">×</button></span>`).join('');
}
function renderComposerSuggestions() {
  const match = $('composer-input').value.match(/(?:^|\s)([#@/])([^\s]*)$/);
  composerSuggestions = [];
  if (match) {
    const needle = match[2].toLowerCase();
    const candidates = match[1] === '#' ? CAPS.map(cap => '#' + cap) :
      match[1] === '@' ? data.projects.map(project => '@' + project.name) : ['/help','/status'];
    composerSuggestions = candidates.filter(value => value.toLowerCase().slice(1).startsWith(needle)).slice(0,6);
  }
  $('composer-suggestions').innerHTML = composerSuggestions.map((value,index) => `<button type="button" data-suggestion="${index}">${esc(value)}</button>`).join('');
}
function chooseComposerSuggestion(index) {
  const value = composerSuggestions[index];
  if (!value) return;
  $('composer-input').value = $('composer-input').value.replace(/(?:^|\s)[#@/][^\s]*$/, match => (match.startsWith(' ') ? ' ' : '') + value + ' ');
  composerSuggestions = [];
  $('composer-suggestions').innerHTML = '';
  $('composer-input').focus();
}
function showComposerResult(message, projects = []) {
  $('composer-results').innerHTML = `<p>${esc(message)}</p>${projects.length ? `<ul>${projects.map(project => `<li><button type="button" data-select="${esc(project.id)}">${esc(project.name)}</button><small>${esc(projectSummary(project))}</small></li>`).join('')}</ul>` : ''}`;
}

function notice(message) { $('message').textContent = message; }
function saveData() { if (loadError) { notice('Saved data could not be read. Import a valid backup before changing projects.'); return; } try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); render(); notice('Saved locally.'); } catch { notice('Could not save. Export a backup and check browser storage.'); } }
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { notice('View preference could not be saved.'); } }
function current() { return data.projects.find(p => p.id === selected); }
function select(id) { detailTab = 'Overview'; openProjectTab(id); $('detail-heading')?.focus(); }
function render() {
  const p = current();
  const visibleProjects = filterQuery ? data.projects.filter(x => matchesProject(x, filterQuery)) : data.projects;
  const entries = data.projects.reduce((total, x) => total + x.items.length + x.resources.length + x.evidence.length + x.links.length, 0);
  $('project-count').textContent = filterQuery ? `${visibleProjects.length} matching projects` : 'Projects, activity and current work in one place.';
  $('overview-stats').innerHTML = `<div><strong>${data.projects.length}</strong><span>Projects</span></div><div><strong>${data.projects.reduce((n,x)=>n+x.items.length,0)}</strong><span>Tasks</span></div><div><strong>${entries}</strong><span>Total entries</span></div>`;
  $('section-count').textContent = `${visibleProjects.length} shown`;
  $('context-project').textContent = p ? p.name : 'All projects';
  $('project-nav').innerHTML = visibleProjects.map(x => `<button type="button" class="nav-project" data-select="${esc(x.id)}" aria-current="${x.id === selected ? 'true':'false'}"><span aria-hidden="true">▤</span>${esc(x.name)}</button>`).join('') || `<p class="muted">${filterQuery ? 'No matches.' : 'No projects yet.'}</p>`;
  document.querySelectorAll('button[data-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.mode === prefs.mode)); });
  $('cards').dataset.mode = prefs.mode;
  $('cards').innerHTML = visibleProjects.map(x => {
    const minimized = prefs.minimized.includes(x.id);
    const count = x.items.length + x.resources.length + x.evidence.length + x.links.length;
    return `<article class="project-card${minimized ? ' minimized':''}" data-selected="${x.id === selected}"><div class="card-main"><div class="card-copy"><span class="card-kicker">PROJECT</span><h3>${esc(x.name)}</h3><p class="card-summary">${x.capabilities.length ? x.capabilities.map(esc).join(' · ') : 'Any kind of work'} · ${count} ${count === 1 ? 'entry':'entries'}</p></div><div class="card-actions"><button type="button" data-select="${esc(x.id)}" aria-label="Open ${esc(x.name)}">Open</button><button type="button" data-minimize="${esc(x.id)}" aria-label="${minimized ? 'Expand':'Minimize'} ${esc(x.name)}" aria-pressed="${minimized}">${minimized ? 'Expand':'Minimize'}</button></div></div>${minimized ? '' : `<div class="card-meta"><span>${x.items.length} tasks</span><span>${x.resources.length} resources</span><span>${x.evidence.length} evidence</span><span>${x.links.length} links</span></div>`}</article>`;
  }).join('') || `<div class="empty"><h3>${filterQuery ? 'No projects match that search' : 'Make room for your next project'}</h3><p>${filterQuery ? 'Try another term or clear search.' : 'Start with a name. Add capabilities whenever you need them.'}</p>${filterQuery ? '' : `<button class="primary" type="button" data-new ${loadError ? 'disabled':''}>New project</button>`}</div>`;
  const recent = visibleProjects.flatMap(project => ['items','resources','evidence','links'].flatMap(key => project[key].slice(-2).map(item => ({project, item, type:{items:'Task',resources:'Resource',evidence:'Evidence',links:'Link'}[key]})))).slice(0,4);
  $('recent-work').innerHTML = recent.length ? `<div class="section-head"><h3>Recent work</h3><span>${recent.length} entries</span></div><ul>${recent.map(x => `<li><span class="recent-kind">${x.type}</span><span>${esc(x.item.title)}</span><button type="button" data-select="${esc(x.project.id)}">${esc(x.project.name)}</button></li>`).join('')}</ul>` : '';
  $('detail').innerHTML = p ? detailHTML(p) : '';
  renderWorkspaceTabs();
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
$('global-search').addEventListener('input', e => { filterQuery = e.target.value.trim().toLowerCase(); if (activeWorkspaceTab !== 'home') activateWorkspaceTab('home'); else render(); });
document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); $('global-search').focus(); } });
$('toggle-explorer').addEventListener('click', () => { const panel = workbench.contextDock() === 'left' ? 'context' : 'explorer'; workbench.setPanelVisible(panel, !workbench.panelVisible(panel)); syncLayoutControls(); });
for (const position of ['right','bottom']) $('dock-' + position).addEventListener('click', () => {
  if (position === 'right' && workbench.contextDock() === 'left') {
    workbench.setPanelVisible('explorer', !workbench.panelVisible('explorer'));
    syncLayoutControls(); return;
  }
  const active = workbench.panelVisible('context') && workbench.contextDock() === position;
  if (active) workbench.setPanelVisible('context', false);
  else { workbench.dockContext(position); workbench.setPanelVisible('context', true); }
  syncLayoutControls();
});
$('reset-layout').addEventListener('click', () => { workbench.resetLayout(); syncLayoutControls(); notice('Default layout restored.'); });
$('composer-files').addEventListener('change', e => { attachments.push(...e.target.files); e.target.value = ''; renderAttachments(); showComposerResult(`${attachments.length} attachment${attachments.length === 1 ? '' : 's'} selected locally. No files have been uploaded.`); });
$('composer-input').addEventListener('input', renderComposerSuggestions);
$('composer-input').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' && composerSuggestions.length) { e.preventDefault(); $('composer-suggestions').querySelector('button')?.focus(); }
  if (e.key === 'Escape') { composerSuggestions = []; $('composer-suggestions').innerHTML = ''; }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('composer').requestSubmit(); }
});
$('composer-suggestions').addEventListener('keydown', e => {
  const buttons = [...$('composer-suggestions').querySelectorAll('button')];
  const index = buttons.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); buttons[(index + 1) % buttons.length]?.focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); (index <= 0 ? $('composer-input') : buttons[index - 1]).focus(); }
  if (e.key === 'Escape') { composerSuggestions = []; $('composer-suggestions').innerHTML = ''; $('composer-input').focus(); }
});
$('composer-suggestions').addEventListener('click', e => { const button = e.target.closest('button[data-suggestion]'); if (button) chooseComposerSuggestion(Number(button.dataset.suggestion)); });
$('composer').addEventListener('submit', e => {
  e.preventDefault();
  composerSuggestions = []; $('composer-suggestions').innerHTML = '';
  const query = $('composer-input').value.trim();
  if (!query) { showComposerResult('Enter a project, entry, #tag, @project or /help.'); return; }
  if (query.startsWith('/')) {
    showComposerResult(query === '/help' ? 'Available local previews: /help and /status. Commands are not executed here.' : query === '/status' ? `${data.projects.length} projects saved in this browser. No CLI connection is active.` : `Command ${query} is not connected. Nothing was executed.`);
    return;
  }
  const scope = $('composer-scope').value;
  const term = query.replace(/^[@#]/, '').toLowerCase();
  const projects = data.projects.filter(project => {
    const names = project.name.toLowerCase().includes(term);
    const tags = project.capabilities.some(cap => cap.toLowerCase().includes(term));
    const entries = ['items','resources','evidence','links'].some(key => project[key].some(item => item.title.toLowerCase().includes(term)));
    return query.startsWith('@') ? names : query.startsWith('#') ? tags : scope === 'projects' ? names : scope === 'entries' ? entries : names || tags || entries;
  });
  showComposerResult(`${projects.length} local result${projects.length === 1 ? '' : 's'} for “${query}”.`, projects);
});
document.addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.dataset.new !== undefined || button.id === 'new-project') { $('project-dialog').showModal(); $('project-form').elements.name.focus(); }
  if (button.dataset.mode && MODES.includes(button.dataset.mode)) { prefs.mode = button.dataset.mode; savePrefs(); render(); }
  if (button.dataset.select) select(button.dataset.select);
  if (button.dataset.minimize) { const id = button.dataset.minimize; prefs.minimized = prefs.minimized.includes(id) ? prefs.minimized.filter(x => x !== id) : [...prefs.minimized, id]; savePrefs(); render(); document.querySelector(`[data-minimize="${CSS.escape(id)}"]`)?.focus(); }
  if (button.dataset.tab) { detailTab = button.dataset.tab; render(); document.querySelector(`[data-tab="${CSS.escape(detailTab)}"]`)?.focus(); }
  if (button.dataset.remove) { const p = current(), key = button.dataset.kind; if (p && ['items','resources','evidence','links'].includes(key)) { p[key] = p[key].filter(x => x.id !== button.dataset.remove); saveData(); } }
  if (button.dataset.attachment !== undefined) { attachments.splice(Number(button.dataset.attachment), 1); renderAttachments(); showComposerResult('Attachment removed. No files have been uploaded.'); }
});
document.addEventListener('submit', e => {
  const form = e.target;
  if (!['project-form','rename-form','caps-form','entry-form'].includes(form.id)) return;
  e.preventDefault();
  if (form.id === 'project-form') { const name = form.elements.name.value.trim(); if (!name) return; const p = newProject(uid(), name.slice(0,200), [...form.querySelectorAll('input[name="cap"]:checked')].map(x => x.value)); data.projects.push(p); detailTab = 'Overview'; openProjectTab(p.id); saveData(); form.reset(); $('project-dialog').close(); notice('Project created and saved locally.'); $('detail-heading')?.focus(); }
  if (form.id === 'rename-form') { const name = form.elements.name.value.trim(); if (name && current()) { current().name = name.slice(0,200); saveData(); notice('Project renamed.'); } }
  if (form.id === 'caps-form' && current()) { current().capabilities = [...form.querySelectorAll('input:checked')].map(x => x.value); saveData(); }
  if (form.id === 'entry-form' && current()) { const key = {Tasks:'items',Resources:'resources',Evidence:'evidence',Links:'links'}[detailTab], title = form.elements.title.value.trim(); if (key && title) { current()[key].push({id:uid(),title}); saveData(); } }
});
$('cancel-project').onclick = () => $('project-dialog').close();
$('export').onclick = () => { const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'propro-projects.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Exported project backup.'); };
$('import').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; try { if (file.size > 5_000_000) throw Error('File too large'); pendingImport = validateData(JSON.parse(await file.text())); $('import-dialog').showModal(); } catch (error) { pendingImport = null; notice('Import failed: ' + error.message); } };
$('cancel-import').onclick = () => { pendingImport = null; $('import-dialog').close(); };
$('import-dialog').addEventListener('close', () => { if (!$('import-dialog').open) pendingImport = null; });
$('confirm-import').onclick = () => { if (!pendingImport) return; data = pendingImport; pendingImport = null; loadError = false; $('new-project').disabled = false; for (const tab of workspaceTabs) if (tab.url) URL.revokeObjectURL(tab.url); workspaceTabs = [workspaceTabs[0]]; activeWorkspaceTab = 'home'; selected = null; detailTab = 'Overview'; prefs = readPrefs(JSON.stringify(prefs), data.projects.map(p => p.id)); saveData(); savePrefs(); $('import-dialog').close(); notice('Imported project backup.'); };
render();
if (loadError) { $('new-project').disabled = true; notice('Saved data could not be read. Import a valid backup; existing browser data was left untouched.'); }
