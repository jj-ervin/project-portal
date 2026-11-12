import {test,expect} from '@playwright/test';
import axe from 'axe-core';

test('Neon Current previews, applies, persists and keeps project data separate',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  const projectData = await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'));
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Settings'}).click();
  await expect(page.getByRole('heading',{name:'Themes'})).toBeVisible();
  await page.getByRole('radio',{name:/Neon Current/}).check();
  await expect(page.locator('html')).toHaveAttribute('data-propro-theme','neon-current');
  await expect(page.locator('.site-header')).toHaveCSS('background-color','rgb(0, 56, 118)');
  await expect(page.locator('#content')).toHaveCSS('background-color','rgb(245, 245, 245)');
  await expect(page.locator('.theme-preview__active')).toHaveCSS('background-color','rgb(0, 255, 255)');
  await page.getByRole('button',{name:'Cancel preview'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-propro-theme','refined-balanced');
  await page.getByRole('radio',{name:/Neon Current/}).check();
  await page.getByRole('button',{name:'Apply theme'}).click();
  await expect(page.getByRole('status').filter({hasText:'Neon Current applied and saved'})).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-propro-theme','neon-current');
  await expect(page.locator('.site-header')).toHaveCSS('background-color','rgb(0, 56, 118)');
  expect(await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'))).toBe(projectData);
  await page.getByRole('button',{name:'New project'}).first().click();
  await page.getByRole('dialog',{name:'Create project'}).getByLabel('Project name').fill('Neon workspace');
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Neon workspace'}).first()).toBeVisible();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Home'}).click();
  await expect(page.locator('.project-card').first()).toHaveCSS('background-color','rgb(255, 255, 255)');
  await page.screenshot({path:'.scratch/neon-current-home-1280.png',fullPage:true});
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Settings'}).click();
  await expect(page.getByRole('radio',{name:/Neon Current/})).toBeChecked();
  await page.screenshot({path:'.scratch/neon-current-1280.png',fullPage:true});
  const violations=await page.evaluate(source=>{const script=document.createElement('script');script.textContent=source;document.head.appendChild(script);return window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(result=>result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)})));},axe.source);
  expect(violations).toEqual([]);
});

test('theme selector remains usable in a narrow workspace',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Settings'}).click();
  await page.getByRole('radio',{name:/Neon Current/}).check();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'.scratch/neon-current-390.png',fullPage:true});
});
