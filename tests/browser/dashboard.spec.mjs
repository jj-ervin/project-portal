import {test, expect} from '@playwright/test';
import axe from 'axe-core';
import {mkdir} from 'node:fs/promises';

test('project actions and independent card state survive mode changes and reload', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Garden');
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Research').check();
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Workshop');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('button',{name:'Minimize Garden'}).click();
  for (const mode of ['Mini','Grid','List','Large']) {
    const layoutButton = page.getByRole('group',{name:'Tile layout'}).getByRole('button',{name:`${mode} tiles`});
    await expect(layoutButton.locator('svg')).toHaveCount(1);
    await layoutButton.click();
    await expect(layoutButton).toHaveAttribute('aria-pressed','true');
    await expect(layoutButton).toHaveCSS('background-color','rgb(32, 90, 157)');
    await expect(page.getByRole('button',{name:'Expand Garden'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Minimize Workshop'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Workshop',level:2})).toBeVisible();
  }
  await page.getByRole('button',{name:'Open Garden'}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Tasks'}).click();
  await page.getByLabel('New tasks entry').fill('Plant seeds');
  await page.getByRole('button',{name:'Add entry'}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Expand Garden'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Tile layout'}).getByRole('button',{name:'Large tiles'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Open Garden'}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Tasks'}).click();
  await expect(page.getByText('Plant seeds')).toBeVisible();
});

test('existing version 1 data loads and malformed import leaves it intact', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('propro-project-portal-v1', JSON.stringify({version:1,projects:[{id:'old',name:'Legacy',capabilities:['Business'],items:[],resources:[],evidence:[],links:[]}]})));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Legacy'})).toBeVisible();
  await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{oops')});
  await expect(page.getByRole('status')).toContainText('Import failed');
  await expect(page.getByRole('heading',{name:'Legacy'})).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('propro-project-portal-v1')).projects[0].name)).toBe('Legacy');
});

test('valid import requires explicit replacement and cancellation preserves records', async ({page}) => {
  await page.goto('/');
  const file = {name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,projects:[{id:'restored',name:'Restored',capabilities:[],items:[],resources:[],evidence:[],links:[]}]}))};
  await page.locator('#import').setInputFiles(file);
  await page.getByRole('button',{name:'Cancel'}).click();
  await expect(page.getByRole('heading',{name:'Restored'})).toHaveCount(0);
  await page.locator('#import').setInputFiles(file);
  await page.getByRole('button',{name:'Replace projects'}).click();
  await expect(page.getByRole('heading',{name:'Restored'})).toBeVisible();
});

test('responsive screenshots, no overflow, and axe checks', async ({page}) => {
  await mkdir('docs/screenshots',{recursive:true});
  for (const width of [375,768,1280,1920]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('propro-project-portal-v1', JSON.stringify({version:1,projects:[
      {id:'a',name:'Neighborhood garden',capabilities:['Construction','Research'],items:[{id:'t',title:'Site survey'}],resources:[],evidence:[],links:[]},
      {id:'b',name:'Client portfolio',capabilities:['Freelance','Creative'],items:[],resources:[],evidence:[],links:[]},
      {id:'c',name:'Community science',capabilities:['Research'],items:[],resources:[],evidence:[],links:[]}
    ]})));
    await page.reload();
    await page.getByRole('group',{name:'Tile layout'}).getByRole('button',{name:'Large tiles'}).click();
    await page.screenshot({path:`docs/screenshots/propro-${width}.png`,fullPage:true});
    for (const mode of ['Large','Mini','Grid','List']) {
      await page.getByRole('group',{name:'Tile layout'}).getByRole('button',{name:`${mode} tiles`}).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width} in ${mode}`).toBe(true);
    }
    const violations = await page.evaluate(source => { const script=document.createElement('script'); script.textContent=source; document.head.appendChild(script); return window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(x=>x.violations.map(v=>({id:v.id, targets:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))); }, axe.source);
    expect(violations, `axe at ${width}`).toEqual([]);
  }
});
