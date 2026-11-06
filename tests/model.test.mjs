import test from 'node:test';
import assert from 'node:assert/strict';
import '../model.mjs';
const {emptyData, newProject, validateData, readPrefs, portalUrl} = globalThis.ProProModel;
test('version 1 projects remain valid and preferences stay separate', () => {
  const p = newProject('p1','Research and renovation',['Research','Construction']);
  p.items.push({id:'i1',title:'Visit site'});
  const data = emptyData(); data.projects.push(p);
  assert.equal(validateData(data), data);
  assert.deepEqual(readPrefs('{"mode":"list","minimized":["p1","missing","p1"]}', ['p1']), {mode:'list',minimized:['p1']});
  assert.equal(readPrefs('bad json', ['p1']).mode, 'large');
  assert.equal(readPrefs('null', ['p1']).mode, 'large');
  assert.equal(data.projects[0].items[0].title, 'Visit site');
});
test('invalid import cannot replace current data', () => {
  assert.throws(() => validateData({version:2,projects:[]}), /Unsupported/);
  assert.throws(() => validateData({version:1,projects:[newProject('same','One'),newProject('same','Two')]}), /Invalid/);
});

test('external portal links retain optional legacy data and reject unsafe URLs', () => {
  assert.equal(portalUrl('https://governancecommons.org/login'), 'https://governancecommons.org/login');
  assert.equal(portalUrl('http://127.0.0.1:4177/'), 'http://127.0.0.1:4177/');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:secret@example.org/', '/relative']) {
    assert.equal(portalUrl(value), null);
  }
  const p = newProject('gc','Governance Commons');
  p.links.push({id:'portal',title:'GC Portal',url:'https://governancecommons.org/login'});
  p.links.push({id:'legacy',title:'Historical link without URL'});
  assert.equal(validateData({version:1,projects:[p]}).projects[0].links.length,2);
  p.links[0].url='javascript:alert(1)';
  assert.throws(() => validateData({version:1,projects:[p]}), /Invalid links/);
});
