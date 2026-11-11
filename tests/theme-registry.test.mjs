import {test} from 'node:test';
import assert from 'node:assert/strict';
import themeManager from '../theme-registry.js';

test('versioned registry validates complete semantic tokens and unique identities', () => {
  assert.equal(themeManager.registry.version,1);
  assert.deepEqual(themeManager.registry.themes.map(theme => theme.id),['refined-balanced','neon-current']);
  assert.equal(themeManager.resolveTheme('neon-current').tokens.accent,'#00FFFF');
  assert.equal(themeManager.resolveTheme('neon-current').tokens.notification,'#FF4F81');
  assert.throws(() => themeManager.validateRegistry([{id:'custom',name:'Incomplete',tokens:{}}]),/Invalid canvas token/);
  assert.throws(() => themeManager.validateRegistry([themeManager.registry.themes[0],themeManager.registry.themes[0]]),/Invalid theme identity/);
});

test('theme preference is versioned and unknown themes return to the default', () => {
  const items = new Map();
  const storage = {setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)};
  themeManager.savePreference(storage,'neon-current');
  assert.equal(themeManager.readPreference(storage.getItem(themeManager.STORAGE_KEY)),'neon-current');
  assert.equal(themeManager.readPreference('{broken'),'refined-balanced');
  assert.equal(themeManager.readPreference(JSON.stringify({version:2,themeId:'neon-current'})),'refined-balanced');
  assert.equal(themeManager.readPreference(JSON.stringify({version:1,themeId:'missing'})),'refined-balanced');
});

test('an additional theme uses the same tokens and becomes selectable', () => {
  const entry = themeManager.registerTheme({id:'example-theme',name:'Example theme',description:'Extension proof',tokens:{...themeManager.resolveTheme('neon-current').tokens,accent:'#AABBCC'}});
  assert.equal(themeManager.resolveTheme('example-theme'),entry);
  assert.equal(entry.tokens.accent,'#AABBCC');
  assert.throws(() => themeManager.registerTheme(entry),/Invalid theme identity/);
});

test('switching themes updates document tokens and Cockpit contract', () => {
  const styles = new Map();
  const document = {documentElement:{dataset:{},style:{setProperty:(key,value)=>styles.set(key,value)}}};
  themeManager.applyTheme(document,'neon-current');
  assert.equal(document.documentElement.dataset.proproTheme,'neon-current');
  assert.equal(styles.get('--theme-accent'),'#00FFFF');
  assert.equal(styles.get('--cockpit-border'),'#D0D4D8');
  themeManager.applyTheme(document,'refined-balanced');
  assert.equal(styles.get('--theme-accent'),'#4359A9');
});
