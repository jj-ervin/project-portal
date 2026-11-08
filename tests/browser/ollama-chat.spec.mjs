import {test,expect} from '@playwright/test';
import axe from 'axe-core';
test('Ollama models, history and drafts stay separate from Codex and other local models',async({page})=>{
 const store=[],models=[{name:'local:first',parameters:'small'},{name:'local:second',parameters:'small'}];let n=0,available=true;
 await page.route('**/api/chat/**',async route=>{const request=route.request(),url=new URL(request.url()),body=request.postDataJSON();let value,status=200;
  if(url.pathname==='/api/chat/ollama')value={available,models:available?models:[],message:available?'Local Ollama is available.':'Ollama is not responding. Start Ollama, then refresh models.'};
  else if(url.pathname==='/api/chat/sessions'&&request.method()==='GET')value=store.filter(s=>s.environment===(url.searchParams.get('environment')||'codex'));
  else if(url.pathname==='/api/chat/sessions'){value={id:'chat-'+(++n),environment:body.environment||'codex',model:body.model,title:'New conversation',status:'idle',messages:[],updatedAt:String(n)};store.unshift(value);status=201}
  else if(url.pathname==='/api/chat/session')value=store.find(s=>s.id===url.searchParams.get('id'));
  else if(url.pathname==='/api/chat/send'){value=store.find(s=>s.id===body.sessionId);value.messages.push({role:'user',text:body.message},{role:'assistant',text:'Reply from '+(value.model||'Codex')});value.title=body.message;value.updatedAt=String(Date.now());status=202}
  else if(url.pathname==='/api/chat/stop'){value=store.find(s=>s.id===body.sessionId);value.status='cancelled'}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.setViewportSize({width:1280,height:800});await page.goto('/');await page.getByRole('tab',{name:'Ollama',exact:true}).click();await expect(page.getByLabel('Ollama model',{exact:true})).toHaveValue('local:first');
 await page.getByRole('textbox',{name:'Message Ollama',exact:true}).fill('First local conversation');await page.getByRole('button',{name:'Send to Ollama',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Ollama',exact:true})).toContainText('Reply from local:first');await page.getByRole('textbox',{name:'Message Ollama',exact:true}).fill('Local draft');
 await page.getByRole('tab',{name:'Codex',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Codex',exact:true})).not.toContainText('First local conversation');await page.getByRole('textbox',{name:'Message Codex',exact:true}).fill('Codex draft');
 await page.getByRole('tab',{name:'Ollama',exact:true}).click();await expect(page.getByRole('textbox',{name:'Message Ollama',exact:true})).toHaveValue('Local draft');await page.getByLabel('Ollama model',{exact:true}).selectOption('local:second');await expect(page.getByRole('tabpanel',{name:'Ollama',exact:true})).not.toContainText('Reply from local:first');await expect(page.getByRole('textbox',{name:'Message Ollama',exact:true})).toHaveValue('');
 await page.getByLabel('Ollama conversation',{exact:true}).selectOption('chat-1');await expect(page.getByLabel('Ollama model',{exact:true})).toHaveValue('local:first');await expect(page.getByRole('textbox',{name:'Message Ollama',exact:true})).toHaveValue('Local draft');await page.reload();await expect(page.getByRole('tabpanel',{name:'Ollama',exact:true})).toContainText('Reply from local:first');await expect(page.getByRole('textbox',{name:'Message Ollama',exact:true})).toHaveValue('Local draft');
 available=false;await page.getByRole('button',{name:'Refresh models',exact:true}).click();await expect(page.getByRole('button',{name:'Send to Ollama',exact:true})).toBeDisabled();await expect(page.getByRole('tabpanel',{name:'Ollama',exact:true})).toContainText('Reply from local:first');available=true;await page.getByRole('button',{name:'Refresh models',exact:true}).click();await expect(page.getByRole('button',{name:'Send to Ollama',exact:true})).toBeEnabled();
 await page.addScriptTag({content:axe.source});expect(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations)).toEqual([]);
});
