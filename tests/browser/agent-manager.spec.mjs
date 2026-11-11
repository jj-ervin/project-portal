import {test,expect} from '@playwright/test';
import axe from 'axe-core';

test('Agent Manager saves profiles, provider choices, custom agents and role mapping without changing projects',async({page})=>{
  await page.goto('/');
  const before=await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'));
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Agent Manager'}).click();
  await expect(page.getByRole('heading',{name:'Agent Manager'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Open workspace item'}).getByRole('heading',{name:'Claude Code'})).toBeVisible();
  await expect(page.locator('.manager-card').filter({has:page.getByRole('heading',{name:'Claude Code'})}).locator('.manager-state')).toHaveText('Catalog only');
  await page.getByLabel('Execution profile').selectOption('Free-Only');
  await expect(page.getByText('Excluded: zero-cost eligibility unverified').first()).toBeVisible();
  await page.getByLabel('Include in my registry').last().check();
  await page.getByLabel('Agent name').fill('Research helper');
  await page.getByRole('button',{name:'Add agent'}).click();
  await page.getByLabel('Agent for Academic Literature Analyst').selectOption({label:'Research helper · Codex'});
  await page.reload();
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Agent Manager'}).click();
  await expect(page.getByLabel('Execution profile')).toHaveValue('Free-Only');
  await expect(page.getByLabel('Agent for Academic Literature Analyst')).toHaveValue(/custom:/);
  await expect(page.getByLabel('Include in my registry').last()).toBeChecked();
  await expect(page.getByText('Zero-cost eligibility unverified').first()).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('propro-project-portal-v1'))).toBe(before);
  await page.getByRole('button',{name:'Remove Research helper'}).click();
  await expect(page.getByLabel('Agent for Academic Literature Analyst')).toHaveValue('');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const violations=await page.evaluate(source=>{const script=document.createElement('script');script.textContent=source;document.head.appendChild(script);return window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}).then(result=>result.violations.map(item=>item.id));},axe.source);
  expect(violations).toEqual([]);
});

test('provider status refresh preserves an unfinished custom agent',async({page})=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/agent-manager/status',async route=>{
    await gate;
    await route.fulfill({json:{codex:{installed:false},ollama:{available:false,models:0},claude:{installed:false}}});
  });
  await page.goto('/');
  await page.getByRole('navigation',{name:'Workspace activities'}).getByRole('button',{name:'Agent Manager'}).click();
  await page.getByLabel('Agent name').fill('Draft helper');
  release();
  await expect(page.locator('#manager-status')).toContainText('Local status refreshed');
  await expect(page.getByLabel('Agent name')).toHaveValue('Draft helper');
  await page.getByRole('button',{name:'Add agent'}).click();
  await expect(page.getByRole('button',{name:'Remove Draft helper'})).toBeVisible();
});
