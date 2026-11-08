(function (root) {
'use strict';
// The same model is used by the local file page and the Node test suite.
const DATA_KEY = 'propro-project-portal-v1';
const PREF_KEY = 'propro-dashboard-prefs-v1';
const CAPS = ['Construction', 'Research', 'Freelance', 'Development', 'Creative', 'Business', 'Personal'];
const MODES = ['large', 'mini', 'grid', 'list'];
const RESOURCE_KINDS = ['file', 'folder', 'url', 'application'];
function validateConnection(connection) {
  if (!connection || !RESOURCE_KINDS.includes(connection.kind) || typeof connection.locator !== 'string' || connection.locator.length > 2048 || /[\u0000-\u001f\u007f]/.test(connection.locator)) throw Error('Invalid resource connection');
  if (connection.kind === 'url') {
    let url; try { url = new URL(connection.locator); } catch { throw Error('Invalid resource URL'); }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw Error('Invalid resource URL');
  } else if (!/^[a-zA-Z]:\\[^\r\n]+$/.test(connection.locator)) throw Error('Use an absolute Windows path');
  if (connection.kind === 'application' && !/\.(exe|lnk)$/i.test(connection.locator)) throw Error('Use an .exe or .lnk application');
  if (Object.keys(connection).some(key => !['kind','locator'].includes(key))) throw Error('Invalid resource connection');
  return connection;
}
const emptyData = () => ({version: 1, projects: []});
const newProject = (id, name, capabilities = []) => ({id, name, capabilities, items: [], resources: [], evidence: [], links: []});
const newPortfolio = (id, name) => ({version:1, id, name});
const portfolios = data => data.portfolios || [];
function assignPortfolio(data, projectId, portfolioId) {
  const project = data.projects.find(p => p.id === projectId);
  if (!project || (portfolioId !== null && !portfolios(data).some(p => p.id === portfolioId))) throw Error('Invalid portfolio membership');
  project.portfolioId = portfolioId;
}
function validateData(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.projects) || value.projects.length > 500) throw Error('Unsupported project file');
  const portfolioIds = new Set();
  if (value.portfolios !== undefined) {
    if (!Array.isArray(value.portfolios) || value.portfolios.length > 500) throw Error('Invalid portfolios');
    for (const p of value.portfolios) {
      if (!p || p.version !== 1 || typeof p.id !== 'string' || !p.id.trim() || p.id === '__unassigned__' || p.id.length > 200 || portfolioIds.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200) throw Error('Invalid portfolio');
      portfolioIds.add(p.id);
    }
  }
  const ids = new Set();
  for (const p of value.projects) {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200 || !Array.isArray(p.capabilities) || !p.capabilities.every(c => CAPS.includes(c)) || !['items','resources','evidence','links'].every(k => Array.isArray(p[k]))) throw Error('Invalid project data');
    ids.add(p.id);
    if (p.portfolioId !== undefined && p.portfolioId !== null && !portfolioIds.has(p.portfolioId)) throw Error('Invalid portfolio membership');
    for (const key of ['items','resources','evidence','links']) {
      if (p[key].length > 1000 || !p[key].every(x => x && typeof x.id === 'string' && x.id && typeof x.title === 'string' && x.title.length <= 1000)) throw Error('Invalid ' + key);
      if (key === 'resources') for (const entry of p[key]) if (entry.connection !== undefined) validateConnection(entry.connection);
    }
  }
  return value;
}
function readPrefs(raw, ids = []) {
  let p; try { p = JSON.parse(raw || '{}') || {}; } catch { p = {}; }
  const valid = new Set(ids);
  return {mode: MODES.includes(p.mode) ? p.mode : 'large', minimized: Array.isArray(p.minimized) ? [...new Set(p.minimized.filter(id => valid.has(id)))] : []};
}
root.ProProModel = Object.freeze({DATA_KEY, PREF_KEY, CAPS, MODES, RESOURCE_KINDS, validateConnection, emptyData, newProject, newPortfolio, portfolios, assignPortfolio, validateData, readPrefs});
})(globalThis);
