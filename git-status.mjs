import {stat} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';

const run = promisify(execFile);

export async function readGitStatus(connection, {execute=run, platform=process.platform}={}) {
  if (platform !== 'win32') throw Object.assign(Error('Local Git status requires Windows'), {status:501});
  if (connection?.kind !== 'folder') throw Object.assign(Error('Link a local repository folder'), {status:400});
  const folder = connection.locator;
  let info;
  try { info = await stat(folder); } catch { throw Object.assign(Error('Folder was not found'), {status:404}); }
  if (!info.isDirectory()) throw Object.assign(Error('Resource is not a folder'), {status:400});
  const options = {windowsHide:true, timeout:5000, maxBuffer:65536, env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}};
  let root;
  try { root = (await execute('git',['-C',folder,'rev-parse','--show-toplevel'],options)).stdout.trim(); }
  catch { throw Object.assign(Error('Folder is not a Git repository or Git is unavailable'), {status:400}); }
  if (resolve(root).toLowerCase() !== resolve(folder).toLowerCase()) throw Object.assign(Error('Link the repository root folder'), {status:400});
  let output;
  try { output = (await execute('git',['-C',folder,'-c','core.fsmonitor=false','status','--short','--branch','--untracked-files=normal'],options)).stdout; }
  catch { throw Object.assign(Error('Could not read Git status'), {status:503}); }
  const lines = output.trimEnd().split(/\r?\n/);
  return {root, branch:lines[0]?.startsWith('## ') ? lines[0].slice(3) : 'Unknown branch', changes:lines.slice(1,101), truncated:lines.length>101};
}
