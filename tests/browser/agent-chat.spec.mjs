import {test,expect} from '@playwright/test';
import axe from 'axe-core';
test('Codex environment restores history and independent drafts without changing project records',async({page})=>{
 const store=[];let sequence=0;
 await page.route('**/api/chat/**',async route=>{const req=route.request(),url=new URL(req.url());let value,status=200;const data=req.postDataJSON();
 if(url.pathname==='/api/chat/sessions'&&req.method()==='GET')value=store;
 else if(url.pathname==='/api/chat/sessions'){value={id:'session-'+(++sequence),title:'New conversation',status:'idle',messages:[],updatedAt:String(sequence)};store.unshift(value);status=201}
 else if(url.pathname==='/api/chat/session')value=store.find(s=>s.id===url.searchParams.get('id'));
 else if(url.pathname==='/api/chat/send'){value=store.find(s=>s.id===data.sessionId);value.messages.push({role:'user',text:data.message},{role:'assistant',text:'Connected reply'});value.title=data.message;value.updatedAt=String(Date.now());status=202}
 else if(url.pathname==='/api/chat/stop'){value=store.find(s=>s.id===data.sessionId);value.status='cancelled';value.progress='Stopped'}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.setViewportSize({width:1280,height:800});await page.goto('/');
 const original=await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'));
 await page.getByRole('tab',{name:'Codex',exact:true}).click();await page.getByRole('textbox',{name:'Message Codex',exact:true}).fill('Hello connected agent');await page.getByRole('button',{name:'Send to Codex',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Codex',exact:true})).toContainText('Connected reply');
 await page.getByRole('textbox',{name:'Message Codex',exact:true}).fill('Unsent agent draft');await page.getByRole('tab',{name:'Local search',exact:true}).click();await page.getByLabel('Ask or search workspace').fill('Search draft');await page.getByRole('tab',{name:'Codex',exact:true}).click();await expect(page.getByRole('textbox',{name:'Message Codex',exact:true})).toHaveValue('Unsent agent draft');
 await page.reload();await expect(page.getByRole('tabpanel',{name:'Codex',exact:true})).toContainText('Connected reply');await expect(page.getByRole('textbox',{name:'Message Codex',exact:true})).toHaveValue('Unsent agent draft');await page.getByRole('tab',{name:'Local search',exact:true}).click();await expect(page.getByLabel('Ask or search workspace')).toHaveValue('Search draft');
 await page.getByRole('tab',{name:'Codex',exact:true}).click();await page.getByRole('button',{name:'New chat',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Codex',exact:true})).not.toContainText('Connected reply');await page.getByLabel('Codex conversation').selectOption('session-1');await expect(page.getByRole('tabpanel',{name:'Codex',exact:true})).toContainText('Connected reply');
 await page.addScriptTag({content:axe.source});expect(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations)).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'))).toBe(original);
});
