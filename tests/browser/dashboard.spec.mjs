import {test, expect} from '@playwright/test';
import axe from 'axe-core';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

test('opening index.html directly loads the styled dashboard and its actions', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.getByRole('group',{name:'View'}).getByRole('button',{name:'Large tiles'})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#workbench')).toHaveCSS('display','grid');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Direct file project');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Direct file project'}).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('refined workspace searches locally, previews commands and keeps project data intact', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('complementary',{name:'Conversation and search'})).toBeVisible();
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Research sample');
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Research').check();
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await page.getByRole('button',{name:'Open Research sample'}).click();
  await expect(page.getByRole('heading',{name:'Research sample',level:2})).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('propro-project-portal-v1'));
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Search'}).click();
  await expect(page.getByLabel('Search projects')).toBeFocused();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Conversation'}).click();
  await expect(page.getByLabel('Ask or search workspace')).toBeFocused();
  await page.getByLabel('Ask or search workspace').fill('#Re');
  await page.getByLabel('Ask or search workspace').press('ArrowDown');
  await page.locator('#composer-suggestions').getByRole('button',{name:'#Research'}).press('Enter');
  await expect(page.getByLabel('Ask or search workspace')).toHaveValue('#Research ');
  await page.getByLabel('Ask or search workspace').fill('#Research');
  await page.getByRole('button',{name:'Search workspace'}).click();
  await expect(page.locator('#composer-results')).toContainText('1 local result');
  await page.getByLabel('Ask or search workspace').fill('/status');
  await page.getByRole('button',{name:'Search workspace'}).click();
  await expect(page.locator('#composer-results')).toContainText('No CLI connection');
  await page.locator('#composer-files').setInputFiles({name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('local context')});
  await expect(page.getByRole('button',{name:'Remove notes.txt'})).toBeVisible();
  await page.getByRole('button',{name:'Remove notes.txt'}).click();
  await expect(page.getByRole('button',{name:'Remove notes.txt'})).toHaveCount(0);
  await page.getByLabel('Search projects').fill('missing');
  await expect(page.getByText('No projects match that search')).toBeVisible();
  await page.getByRole('button',{name:'Home'}).click();
  await expect(page.locator('#detail')).toBeEmpty();
  await expect(page.locator('#dashboard-heading')).toBeFocused();
  await expect(page.getByLabel('Search projects')).toHaveValue('');
  await page.getByRole('button',{name:'Toggle right panel'}).click();
  await expect(page.getByRole('complementary',{name:'Conversation and search'})).toBeHidden();
  await page.getByRole('button',{name:'Toggle right panel'}).click();
  await expect(page.getByRole('complementary',{name:'Conversation and search'})).toBeVisible();
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('propro-project-portal-v1'))).toBe(before);
});

test('conversation docks to bottom, resizes, restores, and resets without changing projects', async ({page}) => {
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Docking sample');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  const before = await page.evaluate(() => localStorage.getItem('propro-project-portal-v1'));
  await page.getByRole('button',{name:'Toggle bottom panel'}).click();
  await expect(page.locator('#workbench')).toHaveClass(/context-bottom/);
  await expect(page.getByRole('button',{name:'Toggle bottom panel'})).toHaveAttribute('aria-pressed','true');
  const separator = page.getByRole('separator',{name:'Resize bottom panel'});
  await expect(separator).toHaveAttribute('aria-orientation','horizontal');
  await separator.focus();
  await separator.press('ArrowUp');
  await expect(page.locator('#workbench')).toHaveCSS('--cockpit-context-height','256px');
  const grip = await separator.boundingBox();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2 - 30);
  await page.mouse.up();
  await expect(page.locator('#workbench')).toHaveCSS('--cockpit-context-height','286px');
  await page.screenshot({path:'docs/screenshots/propro-docked-1280.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#context')).toBeVisible();
  for (const id of ['toggle-explorer','dock-bottom','dock-right']) {
    const button = page.locator('#' + id);
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  await expect(page.locator('#dock-context')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({width:1280,height:800});
  await page.reload();
  await expect(page.locator('#workbench')).toHaveClass(/context-bottom/);
  await expect(page.locator('#workbench')).toHaveCSS('--cockpit-context-height','286px');
  await page.getByRole('button',{name:'Toggle primary sidebar'}).click();
  await expect(page.locator('#explorer')).toBeHidden();
  await page.getByRole('button',{name:'Toggle bottom panel'}).click();
  await expect(page.locator('#context')).toBeHidden();
  await page.getByRole('button',{name:'Toggle bottom panel'}).click();
  await expect(page.locator('#context')).toBeVisible();
  await page.reload();
  await expect(page.locator('#explorer')).toBeHidden();
  await page.getByLabel('Workspace layout').click();
  await page.getByRole('button',{name:'Restore default layout'}).click();
  await expect(page.locator('#workbench')).not.toHaveClass(/context-bottom/);
  await expect(page.locator('#explorer')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('propro-project-portal-v1'))).toBe(before);
});

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
    const layoutButton = page.getByRole('group',{name:'View'}).getByRole('button',{name:`${mode} tiles`});
    await expect(layoutButton.locator('svg')).toHaveCount(1);
    await layoutButton.click();
    await expect(layoutButton).toHaveAttribute('aria-pressed','true');
    await expect(layoutButton).toHaveCSS('background-color','rgb(67, 89, 169)');
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
  await expect(page.getByRole('group',{name:'View'}).getByRole('button',{name:'Large tiles'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Open Garden'}).click();
  await page.getByRole('group',{name:'Project sections'}).getByRole('button',{name:'Tasks'}).click();
  await expect(page.getByRole('region',{name:'Selected project'}).getByText('Plant seeds')).toBeVisible();
});

test('existing version 1 data loads and malformed import leaves it intact', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('propro-project-portal-v1', JSON.stringify({version:1,projects:[{id:'old',name:'Legacy',capabilities:['Business'],items:[],resources:[],evidence:[],links:[]}]})));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Legacy'})).toBeVisible();
  await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{oops')});
  await expect(page.locator('#message')).toContainText('Import failed');
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
  for (const {width,height} of [{width:375,height:900},{width:390,height:844},{width:768,height:900},{width:1280,height:800},{width:1440,height:900},{width:1920,height:900}]) {
    await page.setViewportSize({width,height});
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('propro-project-portal-v1', JSON.stringify({version:1,projects:[
      {id:'a',name:'Neighborhood garden',capabilities:['Construction','Research'],items:[{id:'t',title:'Site survey'}],resources:[],evidence:[],links:[]},
      {id:'b',name:'Client portfolio',capabilities:['Freelance','Creative'],items:[],resources:[],evidence:[],links:[]},
      {id:'c',name:'Community science',capabilities:['Research'],items:[],resources:[],evidence:[],links:[]}
    ]})));
    await page.reload();
    await page.getByRole('group',{name:'View'}).getByRole('button',{name:'Large tiles'}).click();
    await page.screenshot({path:`docs/screenshots/propro-${width}.png`,fullPage:true});
    for (const mode of ['Large','Mini','Grid','List']) {
      await page.getByRole('group',{name:'View'}).getByRole('button',{name:`${mode} tiles`}).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width} in ${mode}`).toBe(true);
    }
    const violations = await page.evaluate(source => { const script=document.createElement('script'); script.textContent=source; document.head.appendChild(script); return window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(x=>x.violations.map(v=>({id:v.id, targets:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))); }, axe.source);
    expect(violations, `axe at ${width}`).toEqual([]);
  }
});
