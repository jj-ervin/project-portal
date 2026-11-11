import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';

const run = promisify(execFile);
export const checks = [
  'Owner reviews the running UI and completes a task-based usability pass',
  'Screen reader, touch, 200% zoom, and high contrast review',
  'Firefox viewport and accessibility checks run successfully',
  'Rights and provenance reviewed before public distribution'
];
export const roadmap = [
  {title:'A · Portfolio workspace',detail:'Projects, portfolios, navigation, local persistence and export'},
  {title:'Current · v0.1 candidate gate',detail:'Finish visual and accessibility acceptance for the running workspace'},
  {title:'B · Coordination and evidence',detail:'Relationships, milestones, integrations and portfolio intelligence'},
  {title:'C · Specialist workspaces',detail:'Integrated specialist tools after the shared workspace is accepted'}
];
export function validateState(value) {
  if (!value || value.version !== 1 || typeof value.revision !== 'number' || !Number.isInteger(value.revision) || value.revision < 0 || !Array.isArray(value.done) || value.done.length !== checks.length || !value.done.every(v => typeof v === 'boolean')) throw Error('Invalid workflow state');
  return {version:1,revision:value.revision,done:value.done};
}
export function createWorkflow({root, stateFile=join(root,'.propro','bootdog-workflow.json')}) {
  async function state() {try {return validateState(JSON.parse(await readFile(stateFile,'utf8')))} catch(error) {if(error.code==='ENOENT') return {version:1,revision:0,done:checks.map(()=>false)};throw error}}
  async function git(...args) {try{return (await run('git',args,{cwd:root,timeout:5000,maxBuffer:65536})).stdout.trim()}catch{return null}}
  return {
    async read() {
      const [saved,head,branch,status,log] = await Promise.all([state(),git('rev-parse','--short','HEAD'),git('branch','--show-current'),git('status','--short'),git('log','-3','--format=%h %s')]);
      return {state:saved,gate:{last:'None verified',next:'v0.1 candidate · visual acceptance',source:'docs/PROP-CKP-001B-IMPLEMENTATION.md · Open gates'},checks,gaps:checks.filter((_,i)=>!saved.done[i]),roadmap,git:{head,branch,dirty:status===null?null:Boolean(status),recent:log?log.split('\n'):[]},source:'docs/PRODUCT-CHARTER.md · Roadmap'};
    },
    async save(input) {
      const next=validateState(input),current=await state();
      if(next.revision!==current.revision) {const error=Error('Workflow changed. Reload before saving.');error.status=409;throw error}
      const saved={...next,revision:current.revision+1};await mkdir(join(root,'.propro'),{recursive:true});await writeFile(stateFile,JSON.stringify(saved,null,2)+'\n',{flag:'w'});return saved;
    }
  };
}
