import test from 'node:test';
import assert from 'node:assert/strict';
import '../model.mjs';
const {emptyData, newProject, validateData, readPrefs} = globalThis.ProProModel;
const {newPortfolio, assignPortfolio, portfolios} = globalThis.ProProModel;
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
test('legacy records remain unchanged and portfolios are optional',()=>{
 const legacy={version:1,projects:[newProject('old','Existing',['Research'])]};legacy.projects[0].evidence.push({id:'proof',title:'Original evidence'});const before=JSON.stringify(legacy);assert.equal(validateData(legacy),legacy);assert.equal(JSON.stringify(legacy),before);assert.deepEqual(portfolios(legacy),[]);
});
test('portfolio creation, membership, rename and unassignment round-trip with all domains',()=>{
 const data={version:1,portfolios:[newPortfolio('pf','Work')],projects:['Construction','Research','Creative','Development','Business','Personal'].map((cap,i)=>newProject(String(i),cap,[cap]))};
 for(const p of data.projects)assignPortfolio(data,p.id,'pf');data.portfolios[0].name='Renamed';const copy=validateData(JSON.parse(JSON.stringify(data)));assert.equal(copy.portfolios[0].version,1);assert.equal(copy.portfolios[0].name,'Renamed');assert(copy.projects.every(p=>p.portfolioId==='pf'));assignPortfolio(copy,'0',null);assert.equal(copy.projects[0].portfolioId,null);validateData(copy);
});
test('duplicate, malformed and unsupported portfolio records fail closed',()=>{
 for(const record of [{version:2,id:'pf',name:'Bad'},{version:1,id:'',name:'Bad'},{version:1,id:'pf',name:' '},{version:1,id:'pf',name:'x'.repeat(201)}])assert.throws(()=>validateData({version:1,projects:[],portfolios:[record]}),/Invalid portfolio/);
 assert.throws(()=>validateData({version:1,projects:[],portfolios:[newPortfolio('same','A'),newPortfolio('same','B')]}),/Invalid portfolio/);
 assert.throws(()=>validateData({version:1,projects:[],portfolios:{}}),/Invalid portfolios/);
});
test('dangling membership is rejected without changing original project data',()=>{
 const data={version:1,projects:[newProject('p','One')],portfolios:[newPortfolio('pf','Work')]};assert.throws(()=>assignPortfolio(data,'p','missing'),/Invalid portfolio membership/);assert.equal(data.projects[0].portfolioId,undefined);assert.throws(()=>assignPortfolio(data,'missing','pf'));const bad=structuredClone(data);bad.projects[0].portfolioId='missing';assert.throws(()=>validateData(bad),/Invalid portfolio membership/);assert.equal(data.projects[0].portfolioId,undefined);
});
