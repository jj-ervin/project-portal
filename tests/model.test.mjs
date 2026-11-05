import test from 'node:test';
import assert from 'node:assert/strict';
import '../model.mjs';
const {emptyData, newProject, validateData, readPrefs} = globalThis.ProProModel;
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
