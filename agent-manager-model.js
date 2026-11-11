// Agent Manager configuration is browser-local and separate from project records.
(function (root) {
  'use strict';
  const KEY = 'propro-agent-manager-v1';
  const ROLES = Object.freeze([
    'General Coordinator', 'Project Planner', 'Software Engineer', 'Repository Maintenance',
    'Research Discovery', 'Academic Literature Analyst', 'Technical Documentation Writer',
    'Creative Author', 'Manuscript Editor', 'Knowledge Librarian', 'Workflow Automation',
    'Local Model Provider'
  ]);
  const PROFILES = Object.freeze(['Free-Only', 'Hybrid', 'Premium', 'Custom']);
  const PROVIDERS = Object.freeze([
    {id:'codex', name:'Codex', connection:'ProPro read-only conversation adapter', cost:'Cost and entitlement unknown'},
    {id:'ollama', name:'Ollama', connection:'ProPro local conversation adapter', cost:'Local inference; hardware and electricity costs remain'},
    {id:'claude', name:'Claude Code', connection:'Catalog only; no ProPro adapter', cost:'Cost and entitlement unknown'}
  ]);
  const AGENTS = Object.freeze([
    {id:'codex', name:'Codex', providerId:'codex', source:'Current ProPro integration'},
    {id:'ollama', name:'Ollama local model', providerId:'ollama', source:'Current ProPro integration'},
    {id:'claude-code', name:'Claude Code', providerId:'claude', source:'Approved design proposal; not connected'}
  ]);
  const CLAUDE_ROLE_FIT = Object.freeze({
    'General Coordinator':'Conditional', 'Project Planner':'Strong', 'Software Engineer':'Strong',
    'Repository Maintenance':'Strong', 'Research Discovery':'Conditional',
    'Academic Literature Analyst':'Conditional', 'Technical Documentation Writer':'Strong',
    'Creative Author':'Secondary', 'Manuscript Editor':'Secondary',
    'Knowledge Librarian':'Conditional', 'Workflow Automation':'Strong',
    'Local Model Provider':'Not applicable'
  });
  const initial = () => ({version:1, profile:'Hybrid', enabled:{codex:true,ollama:true,claude:false}, agents:[], assignments:Object.fromEntries(ROLES.map(role=>[role,null]))});
  const cleanText = (value,max=100) => typeof value==='string' ? value.trim().slice(0,max) : '';
  function normalize(input) {
    const result=initial();
    if (!input || typeof input!=='object' || Array.isArray(input) || input.version!==1) return result;
    if (PROFILES.includes(input.profile)) result.profile=input.profile;
    for (const provider of PROVIDERS) if (typeof input.enabled?.[provider.id]==='boolean') result.enabled[provider.id]=input.enabled[provider.id];
    if (Array.isArray(input.agents)) result.agents=input.agents.slice(0,50).flatMap(agent=>{
      if (!agent || typeof agent!=='object' || !/^custom:[a-f\d-]{36}$/i.test(agent.id) || !PROVIDERS.some(p=>p.id===agent.providerId)) return [];
      const name=cleanText(agent.name); return name?[{id:agent.id,name,providerId:agent.providerId,source:'Added in this browser'}]:[];
    }).filter((agent,index,all)=>all.findIndex(x=>x.id===agent.id)===index);
    const ids=new Set([...AGENTS,...result.agents].map(agent=>agent.id));
    for (const role of ROLES) if (ids.has(input.assignments?.[role])) result.assignments[role]=input.assignments[role];
    return result;
  }
  function availability(providerId,probe) {
    const item=probe?.[providerId];
    if (providerId==='ollama' && item?.available && item.models>0) return {status:'Local model available to try',detail:`${item.models} downloaded local model${item.models===1?'':'s'}; successful inference unverified`};
    if (providerId==='ollama' && item?.available) return {status:'Configured, no model',detail:'Download a local chat model to run'};
    if (providerId==='codex' && item?.installed) return {status:'Installed, account unverified',detail:'ProPro adapter exists; a successful turn is needed to verify access'};
    if (providerId==='codex') return {status:'Adapter available, installation unverified',detail:'Install and sign in to Codex to use chat'};
    return {status:'Catalog only',detail:'No ProPro adapter or session connection'};
  }
  function profileFit(providerId,profile) {
    if (profile==='Free-Only') return providerId==='ollama'?'Local candidate; check model and device costs':'Excluded: zero-cost eligibility unverified';
    if (profile==='Custom') return 'Manual selection only';
    if (profile==='Hybrid') return providerId==='ollama'?'Local candidate':'Manual escalation only';
    return 'Manual selection only; pricing unverified';
  }
  function assignmentIssue(agent,state,probe) {
    if (!agent) return '';
    if (!state.enabled[agent.providerId]) return 'Provider excluded from your registry';
    if (state.profile==='Free-Only' && agent.providerId!=='ollama') return 'Zero-cost eligibility unverified';
    if (agent.providerId==='claude') return 'Catalog only; no ProPro adapter';
    if (agent.providerId==='ollama' && !(probe?.ollama?.available && probe.ollama.models>0)) return 'No verified downloaded local model';
    if (agent.providerId==='codex' && !probe?.codex?.installed) return 'Codex installation unverified';
    if (agent.providerId==='codex') return 'Account access unverified';
    return '';
  }
  const api={KEY,ROLES,PROFILES,PROVIDERS,AGENTS,CLAUDE_ROLE_FIT,initial,normalize,availability,profileFit,assignmentIssue};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  root.ProProAgentManagerModel=api;
})(globalThis);
