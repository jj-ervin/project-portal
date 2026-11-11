import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readGitStatus} from '../git-status.mjs';

const folder=resolve('.');
const connection={kind:'folder',locator:folder};

test('Git status reads only the linked repository root with optional locks disabled',async()=>{
  const calls=[];
  const execute=async(command,args,options)=>{
    calls.push({command,args,options});
    return {stdout:calls.length===1 ? folder+'\n' : '## main...origin/main\n M app.mjs\n?? new.txt\n'};
  };
  const result=await readGitStatus(connection,{execute,platform:'win32'});
  assert.equal(result.branch,'main...origin/main');
  assert.deepEqual(result.changes,[' M app.mjs','?? new.txt']);
  assert.deepEqual(calls.map(call=>call.args.at(0)),['-C','-C']);
  assert.ok(calls.every(call=>call.options.env.GIT_OPTIONAL_LOCKS==='0'));
  assert.ok(calls[1].args.includes('core.fsmonitor=false'));
});

test('Git status rejects a subfolder and non-folder connections',async()=>{
  await assert.rejects(readGitStatus({kind:'url',locator:'https://example.com'},{platform:'win32'}),{status:400});
  await assert.rejects(readGitStatus(connection,{platform:'win32',execute:async()=>({stdout:resolve('..')+'\n'})}),{status:400});
});
