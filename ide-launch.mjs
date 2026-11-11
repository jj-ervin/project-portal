import {stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';

export function vsCodeCandidates(env=process.env) {
  return [
    env.LOCALAPPDATA && join(env.LOCALAPPDATA,'Programs','Microsoft VS Code','Code.exe'),
    env.ProgramFiles && join(env.ProgramFiles,'Microsoft VS Code','Code.exe'),
    env['ProgramFiles(x86)'] && join(env['ProgramFiles(x86)'],'Microsoft VS Code','Code.exe')
  ].filter(Boolean);
}

function startVSCode(executable,folder) {
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,[folder],{detached:true,stdio:'ignore',windowsHide:true});
    child.once('error',reject);
    child.once('spawn',()=>{child.unref();resolve();});
  });
}

export async function openInVSCode(connection,{platform=process.platform,candidates=vsCodeCandidates(),inspect=stat,start=startVSCode}={}) {
  if (platform!=='win32') throw Object.assign(Error('VS Code launch requires Windows'),{status:501});
  if (connection?.kind!=='folder') throw Object.assign(Error('Link a local folder to open in VS Code'),{status:400});
  let folder;
  try { folder=await inspect(connection.locator); } catch {throw Object.assign(Error('Folder was not found'),{status:404});}
  if (!folder.isDirectory()) throw Object.assign(Error('Resource is not a folder'),{status:400});
  let executable;
  for (const candidate of candidates) {
    try { if ((await inspect(candidate)).isFile()) {executable=candidate;break;} } catch {}
  }
  if (!executable) throw Object.assign(Error('VS Code is not installed in a standard Windows location'),{status:404});
  try { await start(executable,connection.locator); }
  catch { throw Object.assign(Error('Could not start VS Code'),{status:503}); }
  return {opened:true};
}
