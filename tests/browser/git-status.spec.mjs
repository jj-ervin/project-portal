import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';

test('Git Explorer reads a selected project folder and rejects foreign origins',async({page,request})=>{
  const rejected=await request.post('/api/git/status',{data:{kind:'folder',locator:resolve('.')},headers:{origin:'https://example.com'}});
  expect(rejected.status()).toBe(403);
  const missing=await request.post('/api/git/status',{data:{kind:'folder',locator:'C:\\missing-propro-repository'},headers:{origin:`http://127.0.0.1:${process.env.PORT||8000}`}});
  expect(missing.status()).toBe(404);
  await page.goto('/');
  await page.evaluate(folder=>localStorage.setItem('propro-project-portal-v1',JSON.stringify({version:1,projects:[{
    id:'git-project',name:'Linked workspace',capabilities:[],items:[],milestones:[],deliverables:[],
    resources:[{id:'repo',title:'Local repository',connection:{kind:'folder',locator:folder}}],evidence:[],links:[]
  }]})),resolve('.'));
  await page.reload();
  await page.getByRole('button',{name:'Open Linked workspace'}).click();
  const explorer=page.locator('#tabbed-explorer');
  await explorer.getByRole('tab',{name:'Git'}).click();
  await expect(explorer.getByRole('treeitem',{name:'Local repository'})).toBeVisible();
  await explorer.getByRole('treeitem',{name:'Local repository'}).click();
  await expect(explorer.getByRole('treeitem',{name:/Branch:/})).toBeVisible();
  await expect(explorer.getByRole('status')).toContainText('Read-only status');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('propro-project-portal-v1')).projects[0].resources.length)).toBe(1);
});
