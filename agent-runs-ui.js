(function () {
  'use strict';
  const panel=document.getElementById('utility-runs');
  const form=document.getElementById('agent-run-form');
  const folderSelect=document.getElementById('agent-run-folder');
  const status=document.getElementById('agent-run-status');
  const list=document.getElementById('agent-run-list');
  const detail=document.getElementById('agent-run-detail');
  const instructions=document.getElementById('agent-run-instructions');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let signature='',runs=[],selectedRun=null,timer=null;
  async function api(path,method='GET',value){
    const response=await fetch('/api/runs'+path,{method,headers:value?{'content-type':'application/json'}:undefined,body:value?JSON.stringify(value):undefined});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||'Agent run unavailable');
    return result;
  }
  function contextChanged(){
    const context=window.ProProRunContext?.();
    const next=JSON.stringify([context?.id,context?.folders]);
    if(next===signature)return;
    signature=next;
    const previous=folderSelect.value;
    folderSelect.innerHTML=context?.folders.length ? context.folders.map(folder=>`<option value="${esc(folder.id)}">${esc(folder.title)} · ${esc(folder.connection.locator)}</option>`).join('') : '<option value="">No linked folder</option>';
    if(context?.folders.some(folder=>folder.id===previous))folderSelect.value=previous;
    folderSelect.disabled=!context?.folders.length;
    form.querySelector('button').disabled=!context?.folders.length;
    status.textContent=context ? context.folders.length ? 'Ready for an explicit read-only run.' : 'Add a local folder in this project’s Resources.' : 'Select a project to start a run.';
  }
  function render(){
    list.innerHTML=runs.length ? runs.map(run=>`<li><button type="button" data-run-id="${esc(run.id)}" aria-current="${selectedRun?.id===run.id}">${esc(run.projectName)} · ${esc(run.instructions)} · ${esc(run.status)}</button></li>`).join('') : '<li>No saved runs.</li>';
    if(!selectedRun){detail.innerHTML='<p class="muted">Select a run to see its result.</p>';return;}
    const run=selectedRun;
    detail.innerHTML=`<h4>${esc(run.projectName)} · ${esc(run.status)}</h4><p>${esc(run.folder)}</p><p>${esc(run.progress)}</p><p>Started ${esc(run.createdAt)}</p>${run.status==='running'?`<button type="button" id="agent-run-stop">Stop run</button>`:''}<details open><summary>Instructions and result</summary><p>${esc(run.instructions)}</p><pre>${esc(run.output||'No result yet.')}</pre></details>`;
  }
  async function refresh(){
    clearTimeout(timer);
    try{
      runs=await api('');
      const id=selectedRun?.id||runs[0]?.id;
      selectedRun=id?await api('/item?id='+encodeURIComponent(id)):null;
      render();
      if(runs.some(run=>run.status==='running'))timer=setTimeout(refresh,1000);
    }catch(error){status.textContent=error.message;timer=setTimeout(refresh,3000)}
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const context=window.ProProRunContext?.();
    const folder=context?.folders.find(item=>item.id===folderSelect.value);
    if(!context||!folder){status.textContent='Select a project with a linked folder.';return;}
    const message=instructions.value.trim();
    if(!message)return;
    form.querySelector('button').disabled=true;
    status.textContent='Starting read-only Codex…';
    try{
      selectedRun=await api('','POST',{projectId:context.id,projectName:context.name,connection:folder.connection,instructions:message});
      instructions.value='';
      status.textContent='Run started. Its result will be saved locally.';
      await refresh();
    }catch(error){status.textContent=error.message}
    finally{contextChanged();form.querySelector('button').disabled=!window.ProProRunContext?.()?.folders.length;}
  });
  list.addEventListener('click',async event=>{
    const button=event.target.closest('[data-run-id]');if(!button)return;
    try{selectedRun=await api('/item?id='+encodeURIComponent(button.dataset.runId));render();}catch(error){status.textContent=error.message}
  });
  detail.addEventListener('click',async event=>{
    if(event.target.id!=='agent-run-stop'||!selectedRun)return;
    try{selectedRun=await api('/stop','POST',{id:selectedRun.id});status.textContent='Run stopped.';await refresh();}catch(error){status.textContent=error.message}
  });
  window.ProProAgentRuns={activate:refresh,contextChanged};
  contextChanged();
  if(!panel.hidden)refresh();
})();
