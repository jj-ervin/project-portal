import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openInVSCode,vsCodeCandidates} from '../ide-launch.mjs';

test('VS Code launch uses only a detected executable and an explicit folder argument',async()=>{
  const calls=[];
  const folder='C:\\work\\project',exe='C:\\Apps\\Microsoft VS Code\\Code.exe';
  const inspect=async path=>{
    if (path===folder) return {isDirectory:()=>true};
    if (path===exe) return {isFile:()=>true};
    throw Error('missing');
  };
  const result=await openInVSCode({kind:'folder',locator:folder},{platform:'win32',candidates:['C:\\missing.exe',exe],inspect,start:async(...args)=>calls.push(args)});
  assert.deepEqual(result,{opened:true});
  assert.deepEqual(calls,[[exe,folder]]);
  assert.deepEqual(vsCodeCandidates({LOCALAPPDATA:'C:\\Users\\Example\\AppData\\Local'}),['C:\\Users\\Example\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe']);
});

test('VS Code launch rejects unsupported targets and unavailable installations',async()=>{
  const folder='C:\\work\\project';
  await assert.rejects(openInVSCode({kind:'folder',locator:folder},{platform:'linux'}),{status:501});
  await assert.rejects(openInVSCode({kind:'file',locator:folder},{platform:'win32'}),{status:400});
  await assert.rejects(openInVSCode({kind:'folder',locator:folder},{platform:'win32',inspect:async()=>{throw Error('missing')}}),{status:404});
  await assert.rejects(openInVSCode({kind:'folder',locator:folder},{platform:'win32',candidates:[],inspect:async()=>({isDirectory:()=>true})}),{status:404});
  await assert.rejects(openInVSCode({kind:'folder',locator:folder},{platform:'win32',candidates:['C:\\Code.exe'],inspect:async path=>path===folder?{isDirectory:()=>true}:{isFile:()=>true},start:async()=>{throw Error('spawn failed')}}),{status:503});
});
