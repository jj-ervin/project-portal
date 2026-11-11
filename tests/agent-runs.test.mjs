import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createAgentRuns,runPrompt} from '../agent-runs.mjs';

const folder=resolve('.');
const request={projectId:'project-one',projectName:'Example project',connection:{kind:'folder',locator:folder},instructions:'Summarize the repository state'};
async function fixture(t,runner){await mkdir('.scratch',{recursive:true});const dir=await mkdtemp('.scratch/runs-');t.after(()=>rm(dir,{recursive:true,force:true}));const file=join(dir,'runs.json');return {file,service:await createAgentRuns({file,runner})};}
async function settle(service,id){for(let i=0;i<40&&service.get(id).status==='running';i++)await new Promise(resolve=>setTimeout(resolve,5));await service.flush();}

test('read-only run saves project association, result, and restart history',async t=>{
  const calls=[];
  const {file,service}=await fixture(t,options=>{calls.push(options);return {promise:Promise.resolve('Observed three files.'),cancel(){}}});
  const started=await service.start(request);
  assert.equal(started.status,'running');
  assert.equal(calls[0].cwd,folder);
  assert.match(calls[0].prompt,/read-only ProPro project run/);
  assert.match(runPrompt('Check status','Example'),/Do not edit files/);
  await settle(service,started.id);
  assert.equal(service.get(started.id).status,'succeeded');
  assert.equal(service.get(started.id).output,'Observed three files.');
  assert.equal(service.list()[0].projectId,'project-one');
  assert.equal((await createAgentRuns({file,runner:()=>{throw Error('Should not run')}})).get(started.id).output,'Observed three files.');
});

test('run cancellation blocks late results and validates working directory',async t=>{
  let finish,cancelled=false;
  const {service}=await fixture(t,()=>({promise:new Promise(resolve=>{finish=resolve}),cancel(){cancelled=true}}));
  await assert.rejects(service.start({...request,connection:{kind:'url',locator:'https://example.com'}}),{status:400});
  await assert.rejects(service.start({...request,connection:{kind:'folder',locator:'C:\\missing-propro-run-folder'}}),{status:404});
  const started=await service.start(request);
  await assert.rejects(service.start(request),{status:409});
  await service.cancel(started.id);
  finish('Late result');
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(cancelled,true);
  assert.equal(service.get(started.id).status,'cancelled');
  assert.equal(service.get(started.id).output,'');
});

test('interrupted runs survive restart and corrupt history fails closed',async t=>{
  const {file,service}=await fixture(t,()=>({promise:new Promise(()=>{}),cancel(){}}));
  const started=await service.start(request);
  const restored=await createAgentRuns({file,runner:()=>{throw Error('Should not run')}});
  assert.equal(restored.get(started.id).status,'interrupted');
  await writeFile(file,'broken');
  await assert.rejects(createAgentRuns({file}));
  assert.equal(await readFile(file,'utf8'),'broken');
});
