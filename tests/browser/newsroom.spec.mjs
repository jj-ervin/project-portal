import {test,expect} from '@playwright/test';

test('real RSS discovery reaches Newsroom and triage survives reload',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await expect(page.getByRole('heading',{name:'Newsroom'})).toBeVisible();
  await expect(page.locator('.newsroom-day')).toHaveCount(6);
  await expect(page.locator('.newsroom-day').first()).toContainText('to review');
  const card=page.locator('.newsroom-card').filter({has:page.locator('.newsroom-meta').filter({hasText:'rss'})}).first();
  await expect(card.getByRole('link')).toBeVisible({timeout:30000});
  await page.screenshot({path:'.scratch/newsroom-day-tiles.png',fullPage:true});
  expect(await card.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  await page.getByRole('button',{name:'Basic'}).click();
  await expect(card.locator('p')).toHaveCount(0);
  await page.getByRole('button',{name:'Detailed'}).click();
  await expect(card.locator('.newsroom-detail')).toContainText('First discovered:');
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

test('a named research pull can be saved and edited',async({page})=>{
  const name=`Client policy watch ${Date.now()}`;
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await page.getByRole('button',{name:'Pull Manager'}).click();
  const create=page.getByRole('region',{name:'Create news pull'});
  await create.getByRole('textbox',{name:'Name'}).fill(name);
  await create.getByRole('textbox',{name:'Topic, research, or client'}).fill('Client A');
  await create.getByRole('textbox',{name:'Feed URLs or search query'}).fill('https://example.org/policy.xml');
  await create.getByRole('button',{name:'Save pull'}).click();
  const saved=page.locator('.newsroom-pull').filter({has:page.getByRole('heading',{name})});
  await expect(saved.getByRole('textbox',{name:'Topic, research, or client'})).toHaveValue('Client A');
  await saved.getByRole('textbox',{name:'Topic, research, or client'}).fill('Client B');
  await saved.getByRole('button',{name:'Save changes'}).click();
  await page.reload();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Newsroom'}).click();
  await page.getByRole('button',{name:'Pull Manager'}).click();
  await expect(page.locator('.newsroom-pull').filter({has:page.getByRole('heading',{name})}).getByRole('textbox',{name:'Topic, research, or client'})).toHaveValue('Client B');
});
