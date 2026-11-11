(function () {
  'use strict';
  const model=window.ProProAgentManagerModel;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let state;
  try { state=model.normalize(JSON.parse(localStorage.getItem(model.KEY))); } catch { state=model.initial(); }
  let probe=null, status='Checking local providers…', host=null;
  const agents=()=>[...model.AGENTS,...state.agents];
  const save=()=>{try { localStorage.setItem(model.KEY,JSON.stringify(state)); status='Agent Manager settings saved in this browser.'; } catch { status='Could not save Agent Manager settings in this browser.'; } render();};
  function render(root=host) {
    if (!root) return;
    host=root;
    const providerCards=model.PROVIDERS.map(provider=>{
      const availability=model.availability(provider.id,probe);
      return `<article class="manager-card"><div class="manager-card-head"><h3>${esc(provider.name)}</h3><span class="manager-state">${esc(availability.status)}</span></div><p>${esc(provider.connection)}</p><p class="muted">${esc(availability.detail)} · ${esc(provider.cost)}</p><p class="muted">${esc(model.profileFit(provider.id,state.profile))}</p><label class="manager-check"><input type="checkbox" data-provider="${provider.id}" ${state.enabled[provider.id]?'checked':''}> Include in my registry</label>${provider.id==='claude'?`<details><summary>Proposed role fit</summary><ul>${model.ROLES.map(role=>`<li>${esc(role)}: ${esc(model.CLAUDE_ROLE_FIT[role])}</li>`).join('')}</ul></details>`:''}${['codex','ollama'].includes(provider.id)?`<button type="button" data-chat="${provider.id}">Open ${esc(provider.name)} chat</button>`:''}</article>`;
    }).join('');
    const roleRows=model.ROLES.map(role=>{
      const selected=agents().find(agent=>agent.id===state.assignments[role]);
      const issue=model.assignmentIssue(selected,state,probe);
      return `<label class="manager-role"><span>${esc(role)}</span><select data-role="${esc(role)}" aria-label="Agent for ${esc(role)}"><option value="">Unassigned</option>${agents().map(agent=>`<option value="${esc(agent.id)}" ${state.assignments[role]===agent.id?'selected':''}>${esc(agent.name)} · ${esc(model.PROVIDERS.find(p=>p.id===agent.providerId)?.name)}</option>`).join('')}</select>${issue?`<small>${esc(issue)}</small>`:''}</label>`;
    }).join('');
    const agentRows=agents().map(agent=>`<li><strong>${esc(agent.name)}</strong><span>${esc(model.PROVIDERS.find(p=>p.id===agent.providerId)?.name)} · ${esc(agent.source)}</span>${agent.id.startsWith('custom:')?`<button type="button" data-remove-agent="${esc(agent.id)}" aria-label="Remove ${esc(agent.name)}">Remove</button>`:''}</li>`).join('');
    root.innerHTML=`<div class="manager-head"><p class="eyebrow">PROPRO / SHARED TOOLS</p><h2 id="agent-manager-heading" tabindex="-1">Agent Manager</h2><p>Plan who can cover each role. Assignments do not start agents, sync sessions, or grant execution access.</p></div><div class="manager-toolbar"><label>Execution profile <select id="manager-profile">${model.PROFILES.map(profile=>`<option value="${profile}" ${state.profile===profile?'selected':''}>${profile}</option>`).join('')}</select></label><button type="button" id="manager-refresh">Refresh local status</button></div><p class="manager-note">Profiles guide manual choices only. Free-Only considers downloaded local Ollama models; zero-cost operation is not guaranteed. Hybrid and Premium do not route automatically or enforce spending limits.</p><p id="manager-status" role="status" aria-live="polite">${esc(status)}</p><section aria-label="Provider registry"><h3>Providers</h3><div class="manager-grid">${providerCards}</div></section><section aria-label="Agent registry"><h3>Agent registry</h3><p class="muted">Catalog entries are research or integration references. A checked provider is a preference, not proof that it is installed, signed in, or runnable.</p><ul class="manager-agents">${agentRows}</ul><form id="manager-add-agent" class="manager-add"><label>Agent name <input name="name" maxlength="100" required></label><label>Provider <select name="providerId">${model.PROVIDERS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><button type="submit">Add agent</button></form></section><section aria-label="Shared role mapping"><h3>Shared 12-role mapping</h3><p class="muted">Assignments are planning preferences. An unavailable provider remains unavailable even when assigned.</p><div class="manager-roles">${roleRows}</div></section>`;
  }
  function renderStatusRefresh() {
    const form=host?.querySelector('#manager-add-agent');
    const draft=form ? {name:form.elements.name.value,providerId:form.elements.providerId.value,focused:form.contains(document.activeElement) ? document.activeElement.name : null} : null;
    render();
    if (draft && host) {
      const next=host.querySelector('#manager-add-agent');
      next.elements.name.value=draft.name;
      next.elements.providerId.value=draft.providerId;
      if (draft.focused) next.elements[draft.focused]?.focus();
    }
  }
  async function refresh() {
    status='Checking local providers…'; renderStatusRefresh();
    try { const response=await fetch('/api/agent-manager/status',{cache:'no-store'}); if(!response.ok)throw Error(); probe=await response.json(); status='Local status refreshed. Account access and successful runs are not verified.'; }
    catch { probe=null; status='Local status unavailable. Start ProPro with npm start to inspect provider availability.'; }
    renderStatusRefresh();
  }
  document.addEventListener('change',event=>{
    if (!host?.contains(event.target)) return;
    if(event.target.id==='manager-profile'){state.profile=event.target.value;save();}
    if(event.target.dataset.provider){state.enabled[event.target.dataset.provider]=event.target.checked;save();}
    if(event.target.dataset.role){state.assignments[event.target.dataset.role]=event.target.value||null;save();}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='manager-add-agent')return;
    event.preventDefault();
    const form=event.target, name=form.elements.name.value.trim(), providerId=form.elements.providerId.value;
    if(!name||!model.PROVIDERS.some(p=>p.id===providerId))return;
    state.agents.push({id:'custom:'+crypto.randomUUID(),name:name.slice(0,100),providerId,source:'Added in this browser'});
    save();
  });
  document.addEventListener('click',event=>{
    if(!host?.contains(event.target))return;
    if(event.target.id==='manager-refresh')refresh();
    const remove=event.target.closest('[data-remove-agent]');
    if(remove){state.agents=state.agents.filter(agent=>agent.id!==remove.dataset.removeAgent);for(const role of model.ROLES)if(state.assignments[role]===remove.dataset.removeAgent)state.assignments[role]=null;save();}
    const chat=event.target.closest('[data-chat]');
    if(chat){document.querySelector('[aria-label="Workspace activities"] button[aria-label="Conversation"]')?.click();document.getElementById('environment-'+chat.dataset.chat)?.click();}
  });
  window.ProProAgentManager={render,refresh};
  refresh();
})();
