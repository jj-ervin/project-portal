import {test,expect} from '@playwright/test';

test('Bootdog has separate four-pane workflow layout and source readers',async({page})=>{
  await page.goto('/workflow/');
  await expect(page.getByRole('heading',{name:'Project workflow'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Reader'})).toBeVisible();
  await expect(page.getByText('Last passed gate')).toBeVisible();
  await page.getByRole('button',{name:'Delivery Gate'}).click();
  await expect(page.locator('.checklist input')).toHaveCount(4);
  await page.getByRole('button',{name:'Gaps',exact:true}).click();
  await expect(page.getByText('Open items for')).toBeVisible();
  await page.getByRole('button',{name:'Roadmap',exact:true}).click();
  await expect(page.getByText('C · Specialist workspaces')).toBeVisible();
  await page.getByRole('button',{name:'File',exact:true}).click();
  await page.getByRole('button',{name:'Product charter'}).click();
  await expect(page.getByText('read-only preview')).toBeVisible();
  await page.getByRole('button',{name:'☰ Explorer'}).click();
  await expect(page.locator('#explorer')).toBeHidden();
});

test('checklist remains staged until local save confirmation',async({page,request})=>{
  await page.goto('/workflow/');
  await page.getByRole('button',{name:'Delivery Gate'}).click();
  const before=(await (await request.get('/api/bootdog')).json()).state;
  await page.locator('.checklist input').first().setChecked(!before.done[0]);
  expect((await (await request.get('/api/bootdog')).json()).state).toEqual(before);
  await page.getByRole('button',{name:'Review local save'}).click();
  expect((await (await request.get('/api/bootdog')).json()).state).toEqual(before);
  await page.getByRole('button',{name:'Confirm local save'}).click();
  await expect(page.getByText('Saved locally.')).toBeVisible();
  const after=(await (await request.get('/api/bootdog')).json()).state;
  expect(after.done[0]).toBe(!before.done[0]);
});

test('chat input and reader stay separate on desktop and explorer starts collapsed on phone',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/workflow/');
  await page.getByRole('button',{name:'Conversation',exact:true}).click();
  await expect(page.getByRole('tablist',{name:'Input views'})).toBeVisible();
  await page.getByRole('button',{name:'Notes',exact:true}).click();
  await expect(page.getByLabel('Local notes')).toBeVisible();
  await page.getByRole('button',{name:'Codex',exact:true}).click();
  await expect(page.getByRole('button',{name:'Send to Codex'})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.locator('#explorer')).toBeHidden();
  await expect(page.getByRole('heading',{name:'Project workflow'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
