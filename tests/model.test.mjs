import test from 'node:test';
import assert from 'node:assert/strict';
import '../model.mjs';
const {emptyData, newProject, validateData, readPrefs} = globalThis.ProProModel;
const {newPortfolio, assignPortfolio, portfolios, validateConnection} = globalThis.ProProModel;
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
test('connected resources preserve version 1 exports and reject unsafe destinations',()=>{
 const data=emptyData();const project=newProject('p','Work');data.projects.push(project);
 project.resources.push({id:'r',title:'Plan',connection:validateConnection({kind:'url',locator:'https://example.com/plan'})});
 project.resources.push({id:'f',title:'Folder',connection:validateConnection({kind:'folder',locator:'C:\\Work\\Plans'})});
 assert.equal(validateData(JSON.parse(JSON.stringify(data))).projects[0].resources.length,2);
 for(const connection of [{kind:'url',locator:'javascript:alert(1)'},{kind:'url',locator:'https://user:pass@example.com/'},{kind:'file',locator:'notes.txt'},{kind:'application',locator:'C:\\Work\\notes.txt'},{kind:'file',locator:'C:\\Work\\bad\nname'}])assert.throws(()=>validateConnection(connection));
 project.resources[0].connection={kind:'url',locator:'file:///C:/secret'};
 assert.throws(()=>validateData(data),/Invalid resource URL/);
});
test('task associations and completion round-trip without changing legacy records',()=>{
 const legacy=newProject('old','Legacy');delete legacy.milestones;delete legacy.deliverables;legacy.items.push({id:'t0',title:'Existing task'});
 const data={version:1,projects:[legacy,newProject('new','Current')]};
 data.projects[1].milestones.push({id:'m1',title:'Review'});
 data.projects[1].deliverables.push({id:'d1',title:'Report'});
 data.projects[1].items.push({id:'t1',title:'Draft',completed:true,milestoneId:'m1',deliverableId:'d1'});
 const copy=validateData(JSON.parse(JSON.stringify(data)));
 assert.deepEqual(copy.projects[0],legacy);
 assert.equal(copy.projects[1].items[0].completed,true);
 for(const change of [task=>task.completed='yes',task=>task.milestoneId='missing',task=>task.deliverableId='missing']) {
   const bad=structuredClone(data);change(bad.projects[1].items[0]);assert.throws(()=>validateData(bad),/Invalid task/);
 }
});
test('task work destinations use the existing connection contract in version 1',()=>{
 const data=emptyData(), project=newProject('p','Research');data.projects.push(project);
 project.items.push({id:'t',title:'Draft',connection:validateConnection({kind:'url',locator:'http://127.0.0.1:4177/'})});
 assert.equal(validateData(JSON.parse(JSON.stringify(data))).projects[0].items[0].connection.locator,'http://127.0.0.1:4177/');
 project.items[0].connection={kind:'url',locator:'javascript:alert(1)'};
 assert.throws(()=>validateData(data),/Invalid resource URL/);
});
