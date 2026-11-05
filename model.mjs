export const DATA_KEY = 'propro-project-portal-v1';
export const PREF_KEY = 'propro-dashboard-prefs-v1';
export const CAPS = ['Construction', 'Research', 'Freelance', 'Development', 'Creative', 'Business'];
export const MODES = ['large', 'mini', 'grid', 'list'];
export const emptyData = () => ({version: 1, projects: []});
export const newProject = (id, name, capabilities = []) => ({id, name, capabilities, items: [], resources: [], evidence: [], links: []});
export function validateData(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.projects) || value.projects.length > 500) throw Error('Unsupported project file');
  const ids = new Set();
  for (const p of value.projects) {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 200 || !Array.isArray(p.capabilities) || !p.capabilities.every(c => CAPS.includes(c)) || !['items','resources','evidence','links'].every(k => Array.isArray(p[k]))) throw Error('Invalid project data');
    ids.add(p.id);
    for (const key of ['items','resources','evidence','links']) {
      if (p[key].length > 1000 || !p[key].every(x => x && typeof x.id === 'string' && x.id && typeof x.title === 'string' && x.title.length <= 1000)) throw Error('Invalid ' + key);
    }
  }
  return value;
}
export function readPrefs(raw, ids = []) {
  let p; try { p = JSON.parse(raw || '{}') || {}; } catch { p = {}; }
  const valid = new Set(ids);
  return {mode: MODES.includes(p.mode) ? p.mode : 'large', minimized: Array.isArray(p.minimized) ? [...new Set(p.minimized.filter(id => valid.has(id)))] : []};
}
