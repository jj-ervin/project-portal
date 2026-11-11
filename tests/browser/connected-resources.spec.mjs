import {test, expect} from '@playwright/test';

test('project resources link, pin, open and survive reload', async ({page}) => {
  const url = `http://127.0.0.1:${process.env.PORT || 8000}/`;
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Resource project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Resources'}).click();
  await page.getByLabel('New resources entry').fill('Project website');
  await page.getByLabel('Destination type').selectOption('url');
  await page.getByLabel('URL or absolute Windows path').fill(url);
  await page.getByRole('button',{name:'Add entry'}).click();
  const resource = page.locator('.entry-list li').filter({hasText:'Project website'});
  await expect(resource).toContainText(url);
  const popupPromise = page.waitForEvent('popup');
  await resource.getByRole('button',{name:'Open Project website'}).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(url);
  await popup.close();
  await resource.getByRole('button',{name:'Pin Project website to Home'}).click();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('propro-project-portal-v1')));
  expect(saved.projects[0].resources[0].connection).toEqual({kind:'url',locator:url});
  await expect(page.getByRole('heading',{name:'Project website'})).toBeVisible();
  await page.getByRole('button',{name:'Open Project website'}).click();
  await expect(page.getByRole('heading',{name:'Project website'})).toBeVisible();
});

test('local opening rejects a foreign origin and reports a missing path', async ({page,request}) => {
  const rejected = await request.post('/api/resources/open',{data:{kind:'file',locator:'C:\\missing.txt'},headers:{origin:'https://example.com'}});
  expect(rejected.status()).toBe(403);
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Local project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Resources'}).click();
  await page.getByLabel('New resources entry').fill('Missing file');
  await page.getByLabel('Destination type').selectOption('file');
  await page.getByLabel('URL or absolute Windows path').fill('C:\\missing.txt');
  await page.getByRole('button',{name:'Add entry'}).click();
  await page.getByRole('button',{name:'Open Missing file'}).click();
  await expect(page.locator('#message')).toContainText('Resource was not found');
});

test('linked folder offers explicit VS Code launch without opening an editor during verification',async({page,request})=>{
  const origin=`http://127.0.0.1:${process.env.PORT||8000}`;
  expect((await request.post('/api/ide/vscode/open',{data:{kind:'folder',locator:'C:\\missing-propro-folder'},headers:{origin:'https://example.com'}})).status()).toBe(403);
  expect((await request.post('/api/ide/vscode/open',{data:{kind:'folder',locator:'C:\\missing-propro-folder'},headers:{origin}})).status()).toBe(404);
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Editor project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Resources'}).click();
  await page.getByLabel('New resources entry').fill('Repository folder');
  await page.getByLabel('Destination type').selectOption('folder');
  await page.getByLabel('URL or absolute Windows path').fill('C:\\dev\\project-portal');
  await page.getByRole('button',{name:'Add entry'}).click();
  let sent;
  await page.route('**/api/ide/vscode/open',async route=>{
    sent=route.request().postDataJSON();
    await route.fulfill({json:{opened:true}});
  });
  await page.getByRole('button',{name:'Open Repository folder in VS Code'}).click();
  await expect(page.locator('#message')).toContainText('Opening Repository folder in VS Code');
  expect(sent).toEqual({kind:'folder',locator:'C:\\dev\\project-portal'});
});
