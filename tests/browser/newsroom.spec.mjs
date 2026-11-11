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
