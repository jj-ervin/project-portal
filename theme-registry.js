(function (root) {
  'use strict';
  const VERSION = 1;
  const STORAGE_KEY = 'propro-theme-preference-v1';
  const DEFAULT_ID = 'refined-balanced';
  const tokenNames = ['canvas','surface','surfaceAlt','explorer','navigation','navigationActive','navigationText','text','textStrong','muted','border','secondary','accent','accentText','attention','attentionText','notification','focus','focusOnDark','input','hover'];
  const themes = [
    {id: DEFAULT_ID, name:'Refined Balanced', description:'The original ProPro appearance.', tokens:{
      canvas:'#FBFCFE',surface:'#FFFFFF',surfaceAlt:'#F4F6FA',explorer:'#F4F6FA',navigation:'#E9EDF5',navigationActive:'#E2E8FA',navigationText:'#20283B',text:'#20283B',textStrong:'#20283B',muted:'#626D80',border:'#D9DFEB',secondary:'#4359A9',accent:'#4359A9',accentText:'#FFFFFF',attention:'#E9EDF9',attentionText:'#354C9A',notification:'#AA3030',focus:'#4059B3',focusOnDark:'#00FFFF',input:'#FFFFFF',hover:'#E9F1F9'}},
    {id:'neon-current', name:'Neon Current', description:'Deep Harbor structure with an electric current for active work.', tokens:{
      canvas:'#F5F5F5',surface:'#FFFFFF',surfaceAlt:'#F5F5F5',explorer:'#E6EBF0',navigation:'#003876',navigationActive:'#004C84',navigationText:'#FFFFFF',text:'#2C2C2C',textStrong:'#1C1C1C',muted:'#4B5967',border:'#D0D4D8',secondary:'#4A6FA5',accent:'#00FFFF',accentText:'#1C1C1C',attention:'#CCFF00',attentionText:'#1C1C1C',notification:'#FF4F81',focus:'#003876',focusOnDark:'#00FFFF',input:'#FFFFFF',hover:'#E5F7F7'}}
  ];
  function validateRegistry(entries) {
    const ids = new Set();
    for (const theme of entries) {
      if (!theme || !/^[a-z][a-z0-9-]*$/.test(theme.id) || ids.has(theme.id) || typeof theme.name !== 'string') throw new TypeError('Invalid theme identity');
      ids.add(theme.id);
      for (const name of tokenNames) if (!/^#[0-9A-Fa-f]{6}$/.test(theme.tokens?.[name] || '')) throw new TypeError(`Invalid ${name} token in ${theme.id}`);
    }
    return entries;
  }
  validateRegistry(themes);
  let registered = Object.freeze(themes.map(theme => Object.freeze({...theme,tokens:Object.freeze(theme.tokens)})));
  const registry = Object.freeze({version:VERSION, get themes() { return registered; }});
  function registerTheme(theme) {
    validateRegistry([...registered,theme]);
    const entry = Object.freeze({...theme,tokens:Object.freeze({...theme.tokens})});
    registered = Object.freeze([...registered,entry]);
    return entry;
  }
  function resolveTheme(id) { return registry.themes.find(theme => theme.id === id) || registry.themes[0]; }
  function readPreference(raw) {
    try { const saved = JSON.parse(raw); return saved?.version === VERSION ? resolveTheme(saved.themeId).id : DEFAULT_ID; }
    catch { return DEFAULT_ID; }
  }
  function applyTheme(document, id) {
    const theme = resolveTheme(id), element = document.documentElement;
    element.dataset.proproTheme = theme.id;
    element.dataset.cockpitTheme = 'light';
    for (const [name,value] of Object.entries(theme.tokens)) element.style.setProperty(`--theme-${name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)}`,value);
    element.style.setProperty('--cockpit-bg',theme.tokens.canvas);
    element.style.setProperty('--cockpit-surface',theme.tokens.surface);
    element.style.setProperty('--cockpit-surface-raised',theme.tokens.surfaceAlt);
    element.style.setProperty('--cockpit-border',theme.tokens.border);
    element.style.setProperty('--cockpit-text',theme.tokens.text);
    element.style.setProperty('--cockpit-muted',theme.tokens.muted);
    element.style.setProperty('--cockpit-accent',theme.tokens.secondary);
    element.style.setProperty('--cockpit-focus',theme.tokens.focus);
    element.style.setProperty('--ink',theme.tokens.text);
    element.style.setProperty('--muted',theme.tokens.muted);
    element.style.setProperty('--border',theme.tokens.border);
    element.style.setProperty('--blue',theme.tokens.secondary);
    return theme;
  }
  function savePreference(storage,id) {
    const theme = resolveTheme(id);
    storage.setItem(STORAGE_KEY,JSON.stringify({version:VERSION,themeId:theme.id}));
    return theme.id;
  }
  const api = Object.freeze({registry,STORAGE_KEY,DEFAULT_ID,tokenNames,resolveTheme,readPreference,applyTheme,savePreference,validateRegistry,registerTheme});
  root.ProProThemes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
