import {test,expect} from '@playwright/test';
import axe from 'axe-core';

test('agent runs use a selected linked folder and show saved results and stop controls',async({page,request})=>{
  const origin=`http://127.0.0.1:${process.env.PORT||8000}`;
  expect((await request.post('/api/runs',{data:{},headers:{origin:'https://example.com'}})).status()).toBe(403);
  expect((await request.post('/api/runs',{data:{projectId:'p',projectName:'P',connection:{kind:'folder',locator:'C:\\missing-propro-run-folder'},instructions:'Inspect'},headers:{origin}})).status()).toBe(404);
  const stored=[];let submitted;
  await page.route('**/api/runs**',async route=>{
    const url=new URL(route.request().url());
    const method=route.request().method();
    if(method==='POST'&&url.pathname==='/api/runs'){
      submitted=route.request().postDataJSON();
      const run={id:`00000000-0000-4000-8000-00000000000${stored.length+1}`,provider:'codex',projectId:submitted.projectId,projectName:submitted.projectName,folder:submitted.connection.locator,instructions:submitted.instructions,status:stored.length?'running':'succeeded',progress:stored.length?'Inspecting project evidence':'Result saved',output:stored.length?'':'Repository has three files.',createdAt:'2026-11-11T00:00:00Z',updatedAt:'2026-11-11T00:00:00Z'};
      stored.unshift(run);
      return route.fulfill({status:202,json:{...run,status:'running'}});
    }
    if(method==='POST'&&url.pathname==='/api/runs/stop'){
      const run=stored.find(item=>item.id===route.request().postDataJSON().id);run.status='cancelled';run.progress='Run stopped.';
      return route.fulfill({json:run});
    }
    if(url.pathname==='/api/runs/item')return route.fulfill({json:stored.find(item=>item.id===url.searchParams.get('id'))});
    return route.fulfill({json:stored.map(({id,projectId,projectName,status,createdAt,updatedAt,progress,instructions})=>({id,projectId,projectName,status,createdAt,updatedAt,progress,instructions}))});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Run project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('button',{name:'Toggle bottom panel'}).click();
  await page.getByRole('tab',{name:'Agent runs'}).click();
  await expect(page.locator('#agent-run-status')).toContainText('Add a local folder');
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Resources'}).click();
  await page.getByLabel('New resources entry').fill('Repository');
  await page.getByLabel('Destination type').selectOption('folder');
  await page.getByLabel('URL or absolute Windows path').fill('C:\\dev\\project-portal');
  await page.getByRole('button',{name:'Add entry'}).click();
  await expect(page.locator('#agent-run-folder')).toContainText('Repository');
  const before=await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'));
  await page.getByLabel('Instructions').fill('Summarize the repository');
  await page.getByRole('button',{name:'Start read-only run'}).click();
  await expect(page.locator('#agent-run-detail')).toContainText('Repository has three files.');
  expect(submitted.connection).toEqual({kind:'folder',locator:'C:\\dev\\project-portal'});
  expect(await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'))).toBe(before);
  await page.getByLabel('Instructions').fill('Check current state');
  await page.getByRole('button',{name:'Start read-only run'}).click();
  await expect(page.getByRole('button',{name:'Stop run'})).toBeVisible();
  await page.getByRole('button',{name:'Stop run'}).click();
  await expect(page.locator('#agent-run-detail')).toContainText('cancelled');
  await page.reload();
  if(await page.locator('#bottom-panel').isHidden())await page.getByRole('button',{name:'Toggle bottom panel'}).click();
  await page.getByRole('tab',{name:'Agent runs'}).click();
  await expect(page.locator('#agent-run-list').getByRole('button')).toHaveCount(2);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const violations=await page.evaluate(source=>{const script=document.createElement('script');script.textContent=source;document.head.appendChild(script);return window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(result=>result.violations.map(item=>item.id));},axe.source);
  expect(violations).toEqual([]);
});
