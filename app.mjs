'use strict';
// Classic script loading also supports opening index.html directly from disk.
const {DATA_KEY, PREF_KEY, CAPS, MODES, emptyData, newProject, newPortfolio, portfolios, assignPortfolio, validateData, readPrefs} = globalThis.ProProModel;

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => crypto.randomUUID();
let data = emptyData(), selected = null, detailTab = 'Overview', pendingImport = null;
let loadError = false;
try { const raw = localStorage.getItem(DATA_KEY); if (raw) data = validateData(JSON.parse(raw)); }
catch { loadError = true; }
let prefs = readPrefs(localStorage.getItem(PREF_KEY), data.projects.map(p => p.id));
let filterQuery = '';
let portfolioFilter = '', editingPortfolio = null;
let attachments = [];
let composerSuggestions = [];
let workspaceTabs = [];
let activeWorkspaceTab = 'home';
let lastWorkTab = null;
const HOME_PINS_KEY = 'propro-home-pins-v1';
let homePins = [];
try { const saved = JSON.parse(localStorage.getItem(HOME_PINS_KEY) || '[]'); if (Array.isArray(saved)) homePins = [...new Set(saved.filter(key => typeof key === 'string' && key.length < 240))].slice(0,30); } catch {}
const bottomPanel = document.createElement('section');
bottomPanel.id = 'bottom-panel'; bottomPanel.className = 'bottom-panel';
bottomPanel.setAttribute('role','region'); bottomPanel.setAttribute('aria-label','Bottom tools');
$('workbench').append(bottomPanel);
let sharedBottomSaved = false, previousBottomState = null;
try {
  sharedBottomSaved = Object.hasOwn(JSON.parse(localStorage.getItem('propro-workbench-widths-v1') || '{}'), 'bottomVisible');
  previousBottomState = JSON.parse(localStorage.getItem('propro-bottom-pane-v1') || 'null');
} catch {}
const workbench = window.CockpitWorkbenchUI({document, layout: $('workbench'), explorer: $('explorer'), content: $('content'), context: $('context'), bottom: bottomPanel, storage: localStorage, storageKey: 'propro-workbench-widths-v1', activities: [
  {id:'home',label:'Home',glyph:'⌂'}, {id:'workspace',label:'Workspace',glyph:'▣'}, {id:'projects',label:'Projects',glyph:'▤'},
  {id:'search',label:'Search',glyph:'⌕'}, {id:'conversation',label:'Conversation',glyph:'✦'}
], initialActivity:'home', onActivity: id => {
  workbench.activate(id);
  if (id === 'home') { portfolioFilter=''; detailTab = 'Overview'; filterQuery = ''; $('global-search').value = ''; activateWorkspaceTab('home'); $('dashboard-heading').focus(); }
  if (id === 'workspace') { activateWorkspaceTab(lastWorkTab || 'workspace'); ($('workspace-extra').querySelector('h2') || $('editor-tab-list').querySelector('[role="tab"]'))?.focus(); }
  if (id === 'projects') { workbench.setPanelVisible('explorer', true); syncLayoutControls(); activateWorkspaceTab('home'); explorerUI.activate('projects', true); }
  if (id === 'search') { activateWorkspaceTab('home'); $('global-search').focus(); }
  if (id === 'conversation') { workbench.setPanelVisible('context', true); syncLayoutControls(); $('composer-input').focus(); }
}});
if (!sharedBottomSaved && previousBottomState && typeof previousBottomState === 'object') {
  if (Number.isFinite(previousBottomState.height)) workbench.setBottomHeight(previousBottomState.height);
  if (typeof previousBottomState.visible === 'boolean') workbench.setPanelVisible('bottom', previousBottomState.visible);
}
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
  $('dock-bottom').setAttribute('aria-controls', 'bottom-panel');
  $('dock-bottom').setAttribute('aria-pressed', String(workbench.panelVisible('bottom')));
}
syncLayoutControls();
function projectTreeNodes() {
  const nodes = data.projects.map(project => ({
    id:`project:${project.id}`,label:project.name,icon:'▤',kind:'project',projectId:project.id,
    children:['items','resources','evidence','links'].flatMap(kind => project[kind].length ? [{
      id:`group:${project.id}:${kind}`,label:{items:'Tasks',resources:'Resources',evidence:'Evidence',links:'Links'}[kind],icon:'▸',
      children:project[kind].map(entry => ({id:`entry:${project.id}:${kind}:${entry.id}`,label:entry.title,kind:'entry',projectId:project.id,entryKind:kind,entryId:entry.id}))
    }] : [])
  }));
  if (!portfolios(data).length) return nodes;
  return [...portfolios(data).map(p => ({id:'portfolio:'+p.id,label:p.name,kind:'portfolio',portfolioId:p.id,children:nodes.filter(n => data.projects.find(x => x.id === n.projectId)?.portfolioId === p.id)})),{id:'portfolio-unassigned',label:'Unassigned',kind:'portfolio',portfolioId:'__unassigned__',children:nodes.filter(n => !data.projects.find(x => x.id === n.projectId)?.portfolioId)}];
}
function showPortfolio(id) {portfolioFilter=id;activateWorkspaceTab('home');render();$('portfolio-filter').focus();}
const explorerUI = window.CockpitTabbedExplorerUI({document, root:$('tabbed-explorer'), storage:localStorage, storageKey:'propro-tabbed-explorer-v1', tabs:[
  {id:'projects',label:'Projects',icon:'▤',provider:{getNodes:projectTreeNodes,open:node => {if(node.kind === 'portfolio')showPortfolio(node.portfolioId);if(node.kind === 'project')openProjectTab(node.projectId);if(node.kind === 'entry')openEntryTab(node.projectId,node.entryKind,node.entryId);}}},
  {id:'files',label:'Files',icon:'▣',emptyMessage:'Open a local file in the center workspace to see it here. Only files you choose can be previewed.',provider:{getNodes:() => workspaceTabs.filter(tab => tab.kind === 'file').map(tab => ({id:tab.id,label:tab.title,icon:tab.fileType === 'pdf' ? '▧' : '≡',tabId:tab.id})),open:node => activateWorkspaceTab(node.tabId)}},
  {id:'assets',label:'Assets',icon:'◇',provider:{getNodes:() => ({message:'Local project resource, evidence and link titles; no binary asset library is connected.',nodes:data.projects.flatMap(project => {
    const children = ['resources','evidence','links'].flatMap(kind => project[kind].map(entry => ({id:`asset:${project.id}:${kind}:${entry.id}`,label:entry.title,meta:{resources:'Resource',evidence:'Evidence',links:'Link'}[kind],projectId:project.id,entryKind:kind,entryId:entry.id})));
    return children.length ? [{id:`assets:${project.id}`,label:project.name,children}] : [];
  })}),open:node => { if (node.entryId) openEntryTab(node.projectId,node.entryKind,node.entryId); }}},
  {id:'git',label:'Git',icon:'⑂',unavailableMessage:'Git is not connected to this browser workspace. No repositories or changes are being read.'},
  {id:'conversations',label:'Conversations',icon:'✦',unavailableMessage:'Conversation history is not connected. This pane cannot read your chats.'}
]});
const utilityTabs = ['terminal', 'problems', 'notes'];
const utilityLabels = {terminal:'CLI scratchpad', problems:'Problems', notes:'Notes'};
const tabStrip = document.createElement('div');
tabStrip.className = 'utility-tabs';
tabStrip.setAttribute('role', 'tablist');
tabStrip.setAttribute('aria-label', 'Bottom panel views');
for (const id of utilityTabs) {
  const button = document.createElement('button');
  button.type = 'button'; button.id = `utility-tab-${id}`;
  button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', `utility-${id}`);
  button.textContent = utilityLabels[id];
  tabStrip.append(button);
}
bottomPanel.append(tabStrip);
const extraViews = {
  terminal: '<p class="context-eyebrow">LOCAL COMMAND PREVIEW</p><h3>CLI scratchpad</h3><p>Try /help or /status. Nothing runs on your computer.</p><form id="scratch-form"><label for="scratch-input">Command</label><div class="scratch-row"><input id="scratch-input" autocomplete="off" placeholder="/help"><button type="submit">Preview</button></div></form><output id="scratch-output" role="status" aria-live="polite"></output>',
  problems: '<p class="context-eyebrow">WORKSPACE STATUS</p><h3>Problems</h3><p id="problem-summary"></p>',
  notes: '<p class="context-eyebrow">LOCAL SCRATCH NOTES</p><h3>Notes</h3><label for="panel-notes">Saved in this browser</label><textarea id="panel-notes" rows="8" placeholder="Keep a quick note here…"></textarea>'
};
for (const id of ['terminal', 'problems', 'notes']) {
  const panel = document.createElement('section');
  panel.id = `utility-${id}`; panel.className = 'utility-view utility-extra';
  panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `utility-tab-${id}`);
  panel.innerHTML = extraViews[id]; bottomPanel.append(panel);
}
const utilityTabKey = 'propro-panel-tab-v1';
function activateUtilityTab(id) {
  if (!utilityTabs.includes(id)) id = 'terminal';
  for (const name of utilityTabs) {
    const active = name === id;
    $(`utility-tab-${name}`).setAttribute('aria-selected', String(active));
    $(`utility-tab-${name}`).tabIndex = active ? 0 : -1;
    $(`utility-${name}`).hidden = !active;
  }
  if (id === 'problems') $('problem-summary').textContent = loadError ? 'Saved project data could not be read. Import a valid backup before editing.' : 'No project data problems detected. This view does not inspect external services.';
  try { localStorage.setItem(utilityTabKey, id); } catch {}
}
let initialUtilityTab = 'terminal';
try { initialUtilityTab = localStorage.getItem(utilityTabKey) || 'terminal'; } catch {}
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
const homeActions = document.createElement('div');
homeActions.className = 'home-actions';
homeActions.innerHTML = '<button id="resume-work" type="button" hidden>Resume work</button><button id="pin-dashboard" type="button">Open dashboard as tab</button><button id="home-open-cli" type="button">Open CLI</button><label class="open-file-button">Open file<input id="open-home-file" type="file" accept=".md,.txt,.json,.js,.ts,.css,.html,.pdf,text/plain,text/markdown,application/pdf"></label>';
dashboardView.prepend(homeActions);
const homePinSection = document.createElement('section');
homePinSection.id = 'home-pins'; homePinSection.setAttribute('aria-label', 'Pinned to Home');
dashboardView.insertBefore(homePinSection, dashboardView.querySelector('#overview-stats').nextSibling);
const workspaceExtra = document.createElement('section');
workspaceExtra.id = 'workspace-extra'; workspaceExtra.setAttribute('aria-label', 'Open workspace item');
const editorTabs = document.createElement('div');
editorTabs.className = 'editor-tabs';
editorTabs.innerHTML = '<div id="editor-tab-list" role="tablist" aria-label="Open workspace tabs"></div><div class="editor-actions"><button id="close-active-tab" type="button" hidden>×</button><button id="open-cli-tab" type="button">Open CLI</button><label class="open-file-button">Open file<input id="open-workspace-file" type="file" accept=".md,.txt,.json,.js,.ts,.css,.html,.pdf,text/plain,text/markdown,application/pdf"></label></div>';
center.append(editorTabs, dashboardView, $('detail'), workspaceExtra);
function workspaceTab(id) { return workspaceTabs.find(tab => tab.id === id); }
function openProjectTab(id) {
  const project = data.projects.find(item => item.id === id);
  if (!project) return;
  const tabId = `project:${id}`;
  if (!workspaceTab(tabId)) workspaceTabs.push({id:tabId,kind:'project',projectId:id});
  activateWorkspaceTab(tabId);
}
function openEntryTab(projectId, kind, entryId) {
  const project = data.projects.find(item => item.id === projectId);
  const entry = project?.[kind]?.find(item => item.id === entryId);
  if (!entry) return;
  const tabId = `entry:${projectId}:${kind}:${entryId}`;
  if (!workspaceTab(tabId)) workspaceTabs.push({id:tabId,kind:'entry',projectId,entryKind:kind,entryId,title:entry.title});
  activateWorkspaceTab(tabId);
}
function openCliTab() {
  if (!workspaceTab('cli')) workspaceTabs.push({id:'cli',kind:'cli',title:'CLI scratchpad'});
  activateWorkspaceTab('cli');
}
function activateWorkspaceTab(id) {
  const tab = ['home','workspace'].includes(id) ? null : workspaceTab(id);
  activeWorkspaceTab = tab?.id || (id === 'workspace' ? 'workspace' : 'home');
  if (tab && tab.kind !== 'dashboard') lastWorkTab = tab.id;
  selected = ['project','entry'].includes(tab?.kind) ? tab.projectId : null;
  if (activeWorkspaceTab !== 'home') workbench.activate('workspace');
  render();
}
function closeWorkspaceTab(id) {
  const index = workspaceTabs.findIndex(tab => tab.id === id);
  const tab = workspaceTabs[index];
  if (!tab) return;
  if (tab.url) URL.revokeObjectURL(tab.url);
  workspaceTabs.splice(index, 1);
  if (lastWorkTab === id) lastWorkTab = workspaceTabs.findLast(item => item.kind !== 'dashboard')?.id || null;
  if (activeWorkspaceTab === id) activateWorkspaceTab(workspaceTabs[Math.max(0,index - 1)]?.id || 'home');
  else renderWorkspaceTabs();
  explorerUI.refresh();
}
function renderWorkspaceTabs() {
  const list = $('editor-tab-list');
  list.innerHTML = '';
  for (const tab of workspaceTabs) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'editor-tab-item'; button.setAttribute('role','tab');
    button.dataset.workspaceTab = tab.id;
    button.setAttribute('aria-selected',String(tab.id === activeWorkspaceTab));
    button.setAttribute('aria-controls',tab.kind === 'dashboard' ? 'dashboard-view' : tab.kind === 'project' ? 'detail' : 'workspace-extra');
    button.tabIndex = tab.id === activeWorkspaceTab ? 0 : -1;
    button.textContent = tab.kind === 'project' ? (data.projects.find(p => p.id === tab.projectId)?.name || 'Project') : tab.title;
    list.append(button);
  }
  const closeActive = $('close-active-tab'), currentTab = workspaceTab(activeWorkspaceTab);
  closeActive.hidden = !currentTab;
  if (currentTab) { closeActive.dataset.closeWorkspaceTab = currentTab.id; closeActive.setAttribute('aria-label',`Close ${list.querySelector('[aria-selected="true"]')?.textContent} tab`); }
  editorTabs.hidden = activeWorkspaceTab === 'home';
  dashboardView.hidden = activeWorkspaceTab !== 'home' && activeWorkspaceTab !== 'dashboard-tab';
  homeActions.hidden = activeWorkspaceTab !== 'home';
  $('resume-work').hidden = !lastWorkTab || !workspaceTab(lastWorkTab);
  $('pin-dashboard').textContent = workspaceTab('dashboard-tab') ? 'Show dashboard tab' : 'Open dashboard as tab';
  $('detail').hidden = workspaceTab(activeWorkspaceTab)?.kind !== 'project';
  workspaceExtra.hidden = activeWorkspaceTab !== 'workspace' && !['cli','file','entry'].includes(workspaceTab(activeWorkspaceTab)?.kind);
  const active = workspaceTab(activeWorkspaceTab);
  workspaceExtra.replaceChildren();
  if (activeWorkspaceTab === 'workspace') {
    workspaceExtra.innerHTML = '<p class="eyebrow">WORKSPACE</p><h2 tabindex="-1">Your open work</h2><p class="muted">Open a project from the Explorer, or start with a local file or CLI preview.</p>';
  } else if (active?.kind === 'cli') {
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
  } else if (active?.kind === 'entry') {
    const project = data.projects.find(item => item.id === active.projectId);
    const item = project?.[active.entryKind]?.find(value => value.id === active.entryId);
    const label = {items:'Task',resources:'Resource',evidence:'Evidence',links:'Link'}[active.entryKind];
    workspaceExtra.innerHTML = `<p class="eyebrow">${esc(label || 'ENTRY')} / ${esc(project?.name || 'Project')}</p><h2>${esc(item?.title || 'Entry unavailable')}</h2><p class="muted">${item ? 'This is a local project entry. Connected assets and document previews can be added here later.' : 'This entry is no longer in the project.'}</p><button type="button" data-select="${esc(active.projectId)}">Open project</button>`;
  }
}
function commandPreview(command) {
  return command === '/help' ? 'Available previews: /help and /status. No commands are executed.' : command === '/status' ? `${data.projects.length} local projects. No terminal connection is active.` : command ? `${command} is not connected. Nothing was executed.` : 'Enter /help or /status.';
}
$('editor-tab-list').addEventListener('click', event => {
  const tab = event.target.closest('[data-workspace-tab]');
  if (tab) activateWorkspaceTab(tab.dataset.workspaceTab);
});
$('close-active-tab').addEventListener('click', () => { const id = $('close-active-tab').dataset.closeWorkspaceTab; if (id) closeWorkspaceTab(id); });
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
$('home-open-cli').addEventListener('click', openCliTab);
$('pin-dashboard').addEventListener('click', () => {
  if (!workspaceTab('dashboard-tab')) workspaceTabs.unshift({id:'dashboard-tab',kind:'dashboard',title:'Dashboard'});
  activateWorkspaceTab('dashboard-tab');
});
$('resume-work').addEventListener('click', () => activateWorkspaceTab(lastWorkTab));
async function openWorkspaceFile(event) {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  const pdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (file.size > (pdf ? 10_000_000 : 2_000_000)) { notice('This file is too large for a local preview.'); return; }
  if (!pdf && !/\.(md|txt|json|js|ts|css|html)$/i.test(file.name)) { notice('Choose a text, Markdown, code or PDF file.'); return; }
  try {
    const tab = {id:`file:${uid()}`,kind:'file',title:file.name,fileType:pdf ? 'pdf' : 'text'};
    if (pdf) tab.url = URL.createObjectURL(file); else tab.content = await file.text();
    workspaceTabs.push(tab); activateWorkspaceTab(tab.id);
    explorerUI.refresh();
  } catch { notice('Could not open that local file.'); }
}
$('open-workspace-file').addEventListener('change', openWorkspaceFile);
$('open-home-file').addEventListener('change', openWorkspaceFile);
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
function resolveHomePin(key) {
  if (key === 'widget:work-summary') return {kind:'widget'};
  const parts = key.split(':');
  const project = data.projects.find(item => item.id === parts[1]);
  if (!project) return null;
  if (parts[0] === 'project' && parts.length === 2) return {kind:'project',project};
  if (parts[0] === 'entry' && parts.length === 4 && ['items','resources','evidence','links'].includes(parts[2])) {
    const entry = project[parts[2]].find(item => item.id === parts[3]);
    if (entry) return {kind:'entry',project,entry,entryKind:parts[2]};
  }
  return null;
}
function renderHomePins() {
  const labels = {items:'Task',resources:'Resource',evidence:'Evidence',links:'Link'};
  const cards = homePins.flatMap(key => {
    const pin = resolveHomePin(key);
    if (!pin) return [];
    if (pin.kind === 'widget') {
      const values = [
        ['Tasks', data.projects.reduce((sum,p) => sum + p.items.length,0)],
        ['Resources', data.projects.reduce((sum,p) => sum + p.resources.length,0)],
        ['Evidence', data.projects.reduce((sum,p) => sum + p.evidence.length,0)],
        ['Links', data.projects.reduce((sum,p) => sum + p.links.length,0)]
      ];
      const max = Math.max(1,...values.map(row => row[1]));
      return [`<article class="home-pin home-pin--chart"><div class="home-pin-head"><div><span class="card-kicker">LOCAL DATA</span><h4>Workspace activity</h4></div><button type="button" data-pin-home="${key}" aria-label="Unpin Workspace activity">×</button></div><div class="pin-chart">${values.map(([name,count]) => `<div><span>${name}</span><div class="pin-chart-track"><span style="width:${Math.round(count / max * 100)}%"></span></div><strong>${count}</strong></div>`).join('')}</div><p>From projects saved in this browser · updates when entries change</p></article>`];
    }
    const title = pin.kind === 'project' ? pin.project.name : pin.entry.title;
    const type = pin.kind === 'project' ? 'PROJECT' : labels[pin.entryKind].toUpperCase();
    const subtitle = pin.kind === 'project' ? projectSummary(pin.project) : pin.project.name;
    return [`<article class="home-pin"><div class="home-pin-head"><div><span class="card-kicker">${type}</span><h4>${esc(title)}</h4></div><button type="button" data-pin-home="${esc(key)}" aria-label="Unpin ${esc(title)}">×</button></div><p>${esc(subtitle)}</p><button type="button" data-open-pin="${esc(key)}">Open ${esc(title)}</button></article>`];
  });
  homePinSection.innerHTML = `<div class="section-head"><h3>Pinned to Home</h3><button type="button" data-pin-home="widget:work-summary" aria-pressed="${homePins.includes('widget:work-summary')}">${homePins.includes('widget:work-summary') ? 'Unpin data display' : 'Pin data display'}</button></div>${cards.length ? `<div class="home-pin-grid">${cards.join('')}</div>` : '<p class="muted">Pin a project or project entry for quick access.</p>'}`;
}
function toggleHomePin(key) {
  homePins = homePins.filter(item => resolveHomePin(item));
  if (!resolveHomePin(key) || (!homePins.includes(key) && homePins.length >= 30)) return;
  homePins = homePins.includes(key) ? homePins.filter(item => item !== key) : [...homePins,key];
  try { localStorage.setItem(HOME_PINS_KEY, JSON.stringify(homePins)); } catch { notice('Home pins could not be saved in this browser.'); }
  render();
}
function openHomePin(key) {
  const pin = resolveHomePin(key);
  if (pin?.kind === 'project') openProjectTab(pin.project.id);
  if (pin?.kind === 'entry') openEntryTab(pin.project.id,pin.entryKind,pin.entry.id);
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
  if(portfolioFilter && portfolioFilter!=='__unassigned__' && !portfolios(data).some(p=>p.id===portfolioFilter))portfolioFilter='';
  const scopedProjects=data.projects.filter(p => !portfolioFilter || (portfolioFilter==='__unassigned__' ? !p.portfolioId : p.portfolioId===portfolioFilter));
  const visibleProjects = filterQuery ? scopedProjects.filter(x => matchesProject(x, filterQuery)) : scopedProjects;
  renderPortfolios();
  const entries = data.projects.reduce((total, x) => total + x.items.length + x.resources.length + x.evidence.length + x.links.length, 0);
  $('project-count').textContent = filterQuery ? `${visibleProjects.length} matching projects` : 'Projects, activity and current work in one place.';
  $('overview-stats').innerHTML = `<div><strong>${data.projects.length}</strong><span>Projects</span></div><div><strong>${data.projects.reduce((n,x)=>n+x.items.length,0)}</strong><span>Tasks</span></div><div><strong>${entries}</strong><span>Total entries</span></div>`;
  $('section-count').textContent = `${visibleProjects.length} shown`;
  $('context-project').textContent = p ? p.name : 'All projects';
  document.querySelectorAll('button[data-mode]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.mode === prefs.mode)); });
  $('cards').dataset.mode = prefs.mode;
  $('cards').innerHTML = visibleProjects.map(x => {
    const minimized = prefs.minimized.includes(x.id);
    const count = x.items.length + x.resources.length + x.evidence.length + x.links.length;
    return `<article class="project-card${minimized ? ' minimized':''}" data-selected="${x.id === selected}"><div class="card-main"><div class="card-copy"><span class="card-kicker">${esc(portfolios(data).find(p=>p.id===x.portfolioId)?.name || 'Unassigned project')}</span><h3>${esc(x.name)}</h3><p class="card-summary">${x.capabilities.length ? x.capabilities.map(esc).join(' · ') : 'Any kind of work'} · ${count} ${count === 1 ? 'entry':'entries'}</p></div><div class="card-actions"><button type="button" data-select="${esc(x.id)}" aria-label="Open ${esc(x.name)}">Open</button><button type="button" data-pin-home="project:${esc(x.id)}" aria-label="${homePins.includes(`project:${x.id}`) ? `Pinned ${esc(x.name)}; unpin from Home` : `Pin ${esc(x.name)} to Home`}" aria-pressed="${homePins.includes(`project:${x.id}`)}">${homePins.includes(`project:${x.id}`) ? 'Pinned' : 'Pin'}</button><button type="button" data-minimize="${esc(x.id)}" aria-label="${minimized ? 'Expand':'Minimize'} ${esc(x.name)}" aria-pressed="${minimized}">${minimized ? 'Expand':'Minimize'}</button></div></div>${minimized ? '' : `<div class="card-meta"><span>${x.items.length} tasks</span><span>${x.resources.length} resources</span><span>${x.evidence.length} evidence</span><span>${x.links.length} links</span></div>`}</article>`;
  }).join('') || `<div class="empty"><h3>${filterQuery ? 'No projects match that search' : portfolioFilter ? 'No projects in this portfolio' : 'Make room for your next project'}</h3><p>${filterQuery ? 'Try another term or clear search.' : 'Start with a name. Add capabilities whenever you need them.'}</p>${filterQuery ? '' : `<button class="primary" type="button" data-new ${loadError ? 'disabled':''}>New project</button>`}</div>`;
  const recent = visibleProjects.flatMap(project => ['items','resources','evidence','links'].flatMap(key => project[key].slice(-2).map(item => ({project, item, type:{items:'Task',resources:'Resource',evidence:'Evidence',links:'Link'}[key]})))).slice(0,4);
  $('recent-work').innerHTML = recent.length ? `<div class="section-head"><h3>Recent work</h3><span>${recent.length} entries</span></div><ul>${recent.map(x => `<li><span class="recent-kind">${x.type}</span><span>${esc(x.item.title)}</span><button type="button" data-select="${esc(x.project.id)}">${esc(x.project.name)}</button></li>`).join('')}</ul>` : '';
  renderHomePins();
  $('detail').innerHTML = p ? detailHTML(p) : '';
  renderWorkspaceTabs();
  explorerUI.refresh();
}
function detailHTML(p) {
  const tabs = ['Overview','Tasks','Resources','Evidence','Links',...p.capabilities];
  if (!tabs.includes(detailTab)) detailTab = 'Overview';
  let body;
  if (detailTab === 'Overview') body = `<form id="membership-form" class="portfolio-membership"><label>Portfolio<select name="portfolio" aria-label="Portfolio membership"><option value="">Unassigned</option>${portfolios(data).map(portfolio=>`<option value="${esc(portfolio.id)}" ${portfolio.id===p.portfolioId?'selected':''}>${esc(portfolio.name)}</option>`).join('')}</select></label><button type="submit">Save membership</button></form><p class="muted">Keep this project flexible. Capabilities help describe the work; shared entries are always available.</p><form id="caps-form"><fieldset><legend>Capabilities</legend><div class="cap-options">${CAPS.map(c => `<label><input type="checkbox" name="cap" value="${c}" ${p.capabilities.includes(c) ? 'checked':''}>${c}</label>`).join('')}</div></fieldset><button class="primary" type="submit">Save capabilities</button></form>`;
  else if (['Tasks','Resources','Evidence','Links'].includes(detailTab)) {
    const key = {Tasks:'items',Resources:'resources',Evidence:'evidence',Links:'links'}[detailTab];
    body = `<form id="entry-form" class="entry-form"><label>New ${detailTab.toLowerCase()} entry<input name="title" maxlength="1000" required></label><button class="primary" type="submit">Add entry</button></form><ul class="entry-list">${p[key].map(x => { const pinKey = `entry:${p.id}:${key}:${x.id}`; return `<li><span>${esc(x.title)}</span><button type="button" data-pin-home="${esc(pinKey)}" aria-label="${homePins.includes(pinKey) ? `Pinned ${esc(x.title)}; unpin from Home` : `Pin ${esc(x.title)} to Home`}" aria-pressed="${homePins.includes(pinKey)}">${homePins.includes(pinKey) ? 'Pinned' : 'Pin'}</button><button type="button" data-remove="${esc(x.id)}" data-kind="${key}" aria-label="Remove ${esc(x.title)}">Remove</button></li>`; }).join('')}</ul>${p[key].length ? '' : '<p class="muted">No entries yet.</p>'}`;
  } else body = `<p class="muted">${esc(detailTab)} is enabled. A specialist editor is not available yet; use the shared entries above.</p>`;
  return `<section class="detail-panel" aria-label="Selected project"><div class="detail-head"><div><p class="eyebrow">Selected project</p><h2 id="detail-heading" tabindex="-1">${esc(p.name)}</h2></div><form id="rename-form" class="rename-form"><label>Rename project<input name="name" maxlength="200" required value="${esc(p.name)}"></label><button type="submit">Rename</button></form></div><div class="detail-tabs" role="group" aria-label="Project sections">${tabs.map(t => `<button type="button" data-tab="${esc(t)}" aria-pressed="${t === detailTab}">${esc(t)}</button>`).join('')}</div><div class="detail-body">${body}</div></section>`;
}
$('create-caps').innerHTML = CAPS.map(c => `<label><input type="checkbox" name="cap" value="${c}">${c}</label>`).join('');
$('global-search').addEventListener('input', e => { filterQuery = e.target.value.trim().toLowerCase(); if (activeWorkspaceTab !== 'home') activateWorkspaceTab('home'); else render(); });
document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); $('global-search').focus(); } });
$('toggle-explorer').addEventListener('click', () => { const panel = workbench.contextDock() === 'left' ? 'context' : 'explorer'; workbench.setPanelVisible(panel, !workbench.panelVisible(panel)); syncLayoutControls(); });
$('dock-right').addEventListener('click', () => {
  if (workbench.contextDock() === 'left') {
    workbench.setPanelVisible('explorer', !workbench.panelVisible('explorer'));
    syncLayoutControls(); return;
  }
  const active = workbench.panelVisible('context');
  if (active) workbench.setPanelVisible('context', false);
  else workbench.setPanelVisible('context', true);
  syncLayoutControls();
});
$('dock-bottom').addEventListener('click', () => { workbench.setPanelVisible('bottom', !workbench.panelVisible('bottom')); syncLayoutControls(); });
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
  if (button.dataset.pinHome) { toggleHomePin(button.dataset.pinHome); return; }
  if (button.dataset.openPin) { openHomePin(button.dataset.openPin); return; }
  if (button.dataset.mode && MODES.includes(button.dataset.mode)) { prefs.mode = button.dataset.mode; savePrefs(); render(); }
  if (button.dataset.select) select(button.dataset.select);
  if (button.dataset.minimize) { const id = button.dataset.minimize; prefs.minimized = prefs.minimized.includes(id) ? prefs.minimized.filter(x => x !== id) : [...prefs.minimized, id]; savePrefs(); render(); document.querySelector(`[data-minimize="${CSS.escape(id)}"]`)?.focus(); }
  if (button.dataset.tab) { detailTab = button.dataset.tab; render(); document.querySelector(`[data-tab="${CSS.escape(detailTab)}"]`)?.focus(); }
  if (button.dataset.remove) { const p = current(), key = button.dataset.kind; if (p && ['items','resources','evidence','links'].includes(key)) { p[key] = p[key].filter(x => x.id !== button.dataset.remove); homePins = homePins.filter(item => resolveHomePin(item)); try { localStorage.setItem(HOME_PINS_KEY,JSON.stringify(homePins)); } catch {} saveData(); } }
  if (button.dataset.attachment !== undefined) { attachments.splice(Number(button.dataset.attachment), 1); renderAttachments(); showComposerResult('Attachment removed. No files have been uploaded.'); }
});
document.addEventListener('submit', e => {
  const form = e.target;
  if (!['project-form','rename-form','caps-form','entry-form'].includes(form.id)) return;
  e.preventDefault();
  if (form.id === 'project-form') { const name = form.elements.name.value.trim(); if (!name) return; const p = newProject(uid(), name.slice(0,200), [...form.querySelectorAll('input[name="cap"]:checked')].map(x => x.value)); if(portfolioFilter && portfolioFilter!=='__unassigned__')p.portfolioId=portfolioFilter; data.projects.push(p); detailTab = 'Overview'; openProjectTab(p.id); saveData(); form.reset(); $('project-dialog').close(); notice('Project created and saved locally.'); $('detail-heading')?.focus(); }
  if (form.id === 'rename-form') { const name = form.elements.name.value.trim(); if (name && current()) { current().name = name.slice(0,200); saveData(); notice('Project renamed.'); } }
  if (form.id === 'caps-form' && current()) { current().capabilities = [...form.querySelectorAll('input:checked')].map(x => x.value); saveData(); }
  if (form.id === 'entry-form' && current()) { const key = {Tasks:'items',Resources:'resources',Evidence:'evidence',Links:'links'}[detailTab], title = form.elements.title.value.trim(); if (key && title) { current()[key].push({id:uid(),title}); saveData(); } }
});
$('cancel-project').onclick = () => $('project-dialog').close();
$('export').onclick = () => { const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'propro-projects.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Exported project backup.'); };
$('import').onchange = async e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; try { if (file.size > 5_000_000) throw Error('File too large'); pendingImport = validateData(JSON.parse(await file.text())); $('import-dialog').showModal(); } catch (error) { pendingImport = null; notice('Import failed: ' + error.message); } };
$('cancel-import').onclick = () => { pendingImport = null; $('import-dialog').close(); };
$('import-dialog').addEventListener('close', () => { if (!$('import-dialog').open) pendingImport = null; });
$('confirm-import').onclick = () => { if (!pendingImport) return; data = pendingImport; pendingImport = null; loadError = false; $('new-project').disabled = false; for (const tab of workspaceTabs) if (tab.url) URL.revokeObjectURL(tab.url); workspaceTabs = []; activeWorkspaceTab = 'home'; lastWorkTab = null; selected = null; detailTab = 'Overview'; portfolioFilter=''; homePins = homePins.filter(item => resolveHomePin(item)); try { localStorage.setItem(HOME_PINS_KEY,JSON.stringify(homePins)); } catch {} prefs = readPrefs(JSON.stringify(prefs), data.projects.map(p => p.id)); saveData(); savePrefs(); $('import-dialog').close(); notice('Imported project backup.'); };
function renderPortfolios() {
  $('portfolios-home').innerHTML=`<div class="section-head"><h3>Portfolios</h3><button type="button" id="new-portfolio" ${loadError?'disabled':''}>New portfolio</button></div><label class="portfolio-filter-label">Show projects<select id="portfolio-filter" aria-label="Show projects"><option value="">All projects</option><option value="__unassigned__" ${portfolioFilter==='__unassigned__'?'selected':''}>Unassigned</option>${portfolios(data).map(p=>`<option value="${esc(p.id)}" ${portfolioFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="portfolio-list">${portfolios(data).map(p=>`<div class="portfolio-card"><button type="button" data-portfolio="${esc(p.id)}" aria-pressed="${portfolioFilter===p.id}">${esc(p.name)} <span>${data.projects.filter(x=>x.portfolioId===p.id).length} project${data.projects.filter(x=>x.portfolioId===p.id).length===1?'':'s'}</span></button><button type="button" data-rename-portfolio="${esc(p.id)}" aria-label="Rename portfolio ${esc(p.name)}">Rename</button></div>`).join('')}</div>`;
  $('portfolio-filter').onchange=event=>{portfolioFilter=event.target.value;render();$('portfolio-filter').focus()};
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b)return;
 if(b.id==='new-portfolio'||b.dataset.renamePortfolio){if(loadError)return;editingPortfolio=b.dataset.renamePortfolio||null;$('portfolio-heading').textContent=editingPortfolio?'Rename portfolio':'Create portfolio';$('portfolio-form').elements.name.value=portfolios(data).find(p=>p.id===editingPortfolio)?.name||'';$('portfolio-dialog').showModal();$('portfolio-form').elements.name.focus()}
 if(b.dataset.portfolio)showPortfolio(b.dataset.portfolio);
});
$('cancel-portfolio').onclick=()=>$('portfolio-dialog').close();
$('portfolio-form').onsubmit=event=>{event.preventDefault();if(loadError)return;const name=event.target.elements.name.value.trim();if(!name)return;if(editingPortfolio){const p=portfolios(data).find(p=>p.id===editingPortfolio);if(!p)return;p.name=name}else{const p=newPortfolio(uid(),name);data.portfolios=[...portfolios(data),p];portfolioFilter=p.id}saveData();$('portfolio-dialog').close();$('portfolio-filter').focus();notice('Portfolio saved locally.')};
document.addEventListener('submit',event=>{if(event.target.id!=='membership-form')return;event.preventDefault();if(loadError||!current())return;assignPortfolio(data,current().id,event.target.elements.portfolio.value||null);saveData();$('membership-form')?.querySelector('select')?.focus();notice('Portfolio membership saved.')});
render();
if (loadError) { $('new-project').disabled = true; notice('Saved data could not be read. Import a valid backup; existing browser data was left untouched.'); }
// Keep the suggestion menu within the available context area as panes resize.
if (typeof ResizeObserver === 'function') {
  const composerBounds = new ResizeObserver(() => {
    const pane = $('context').getBoundingClientRect(), composer = $('composer').getBoundingClientRect();
    const header = $('context').querySelector('.context-head').getBoundingClientRect();
    $('composer-suggestions').style.maxHeight = Math.max(24, Math.floor(composer.top - pane.top - header.height - 8)) + 'px';
  });
  composerBounds.observe($('context'));
  composerBounds.observe($('composer'));
}
