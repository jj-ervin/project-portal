import {test,expect} from '@playwright/test';

test('real RSS discovery reaches Newsroom and triage survives reload',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await expect(page.getByRole('heading',{name:'Newsroom'})).toBeVisible();
  const card=page.locator('.newsroom-card').first();
  await expect(card.getByRole('link')).toBeVisible({timeout:30000});
  await expect(card.locator('.newsroom-meta')).toContainText('rss');
  const url=await card.getByRole('link').getAttribute('href');
  expect(url).toMatch(/^https:\/\//);
  const headline=await card.getByRole('link').textContent();
  await card.getByRole('button',{name:'Accept'}).click();
  await expect(page.locator('.newsroom-card').filter({hasText:headline}).first()).toContainText('accept');
  await page.reload();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await expect(page.locator('.newsroom-card').filter({hasText:headline}).first()).toContainText('accept');
});

test('provider settings and structured briefing import persist',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await page.getByRole('button',{name:'Sources & Discovery'}).click();
  const openalex=page.locator('.newsroom-card').filter({has:page.getByRole('heading',{name:'OpenAlex'})});
  await openalex.getByRole('checkbox',{name:'Enabled'}).check();
  await openalex.getByRole('textbox',{name:'Research query'}).fill('AI policy');
  await openalex.getByRole('button',{name:'Save settings'}).click();
  await page.reload();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await page.getByRole('button',{name:'Sources & Discovery'}).click();
  const saved=page.locator('.newsroom-card').filter({has:page.getByRole('heading',{name:'OpenAlex'})});
  await expect(saved.getByRole('checkbox',{name:'Enabled'})).toBeChecked();
  await expect(saved.getByRole('textbox',{name:'Research query'})).toHaveValue('AI policy');
  await page.locator('[data-news-import]').setInputFiles({name:'daily.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:'gc.daily-ai-news/1',items:[{url:'https://example.org/governance-news',title:'Briefing handoff'}]}))});
  await page.getByRole('button',{name:'Inbox'}).click();
  await expect(page.getByRole('link',{name:'Briefing handoff'})).toBeVisible();
});
