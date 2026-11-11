import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createWorkflow,checks} from '../bootdog-workflow.mjs';

test('workflow writes only after an explicit save and rejects stale edits',async()=>{
  await mkdir('.scratch',{recursive:true});
  const root=await mkdtemp('.scratch/propro-bootdog-');
  try {
    const file=join(root,'.propro','bootdog-workflow.json');
    const workflow=createWorkflow({root,stateFile:file});
    const initial=await workflow.read();
    assert.equal(initial.state.revision,0);
    assert.equal(initial.gaps.length,checks.length);
    const saved=await workflow.save({version:1,revision:0,done:checks.map((_,i)=>i===0)});
    assert.equal(saved.revision,1);
    assert.deepEqual(JSON.parse(await readFile(file,'utf8')),saved);
    await assert.rejects(workflow.save({version:1,revision:0,done:checks.map(()=>true)}),{status:409});
    await assert.rejects(workflow.save({version:1,revision:1,done:['yes']}),/Invalid workflow state/);
  } finally {await rm(root,{recursive:true,force:true})}
});
