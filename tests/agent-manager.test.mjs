import {createRequire} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const manager=require('../agent-manager-model.js');

test('shared roles and catalog are stable and separate from assignments',()=>{
  assert.equal(manager.ROLES.length,12);
  assert.equal(new Set(manager.ROLES).size,12);
  assert.deepEqual(manager.AGENTS.map(agent=>agent.providerId),['codex','ollama','claude']);
  assert.ok(Object.values(manager.initial().assignments).every(value=>value===null));
});

test('saved registry accepts valid custom agents and drops invalid role references',()=>{
  const id='custom:12345678-1234-1234-1234-123456789abc';
  const saved=manager.normalize({version:1,profile:'Custom',enabled:{claude:true},agents:[{id,name:'  Analyst  ',providerId:'ollama'},{id:'custom:bad',name:'Bad',providerId:'claude'}],assignments:{'Academic Literature Analyst':id,'Software Engineer':'missing'}});
  assert.equal(saved.profile,'Custom');
  assert.equal(saved.agents.length,1);
  assert.equal(saved.agents[0].name,'Analyst');
  assert.equal(saved.assignments['Academic Literature Analyst'],id);
  assert.equal(saved.assignments['Software Engineer'],null);
  assert.equal(saved.enabled.claude,true);
});

test('catalog, installation, local model, and cost fit remain distinct',()=>{
  assert.equal(manager.availability('claude',{claude:{installed:true}}).status,'Catalog only');
  assert.match(manager.availability('codex',{codex:{installed:true}}).status,/account unverified/);
  assert.equal(manager.availability('ollama',{ollama:{available:true,models:0}}).status,'Configured, no model');
  assert.equal(manager.availability('ollama',{ollama:{available:true,models:1}}).status,'Local model available to try');
  assert.equal(manager.CLAUDE_ROLE_FIT['Local Model Provider'],'Not applicable');
  assert.match(manager.profileFit('codex','Free-Only'),/Excluded/);
  assert.match(manager.profileFit('ollama','Free-Only'),/check model and device costs/);
  const state=manager.initial();
  state.profile='Free-Only';
  assert.equal(manager.assignmentIssue(manager.AGENTS[0],state,{codex:{installed:true}}),'Zero-cost eligibility unverified');
  assert.equal(manager.assignmentIssue(manager.AGENTS[1],state,{ollama:{available:true,models:1}}),'');
});
