import {test,expect} from '@playwright/test';
test('conversation composer stays contained above bottom tools while its content scrolls',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('/');await page.getByRole('button',{name:'Toggle bottom panel'}).click();
 await page.evaluate(()=>{const target=document.querySelector('#composer-results');for(let i=0;i<35;i++){const p=document.createElement('p');p.textContent='Workspace context and conversation result '+i;target.append(p)}});
 const grip=page.getByRole('separator',{name:'Resize bottom panel'});
 for(const {width,height,max} of [{width:1440,height:900,max:false},{width:1280,height:800,max:false},{width:1280,height:720,max:true}]){
  await page.setViewportSize({width,height});await grip.focus();await grip.press(max?'End':'Home');
  const pane=await page.locator('#context').boundingBox(),composer=await page.locator('#composer').boundingBox(),bottom=await page.locator('#bottom-panel').boundingBox();
  expect(composer.y).toBeGreaterThanOrEqual(pane.y);expect(composer.y+composer.height).toBeLessThanOrEqual(pane.y+pane.height+1);expect(composer.y+composer.height).toBeLessThanOrEqual(bottom.y+1);
  const before=composer.y;const scroll=await page.locator('.context-content').evaluate(el=>{el.scrollTop=el.scrollHeight;return {top:el.scrollTop,scrollHeight:el.scrollHeight,height:el.clientHeight}});expect(scroll.top).toBeGreaterThan(0);expect(scroll.scrollHeight).toBeGreaterThan(scroll.height);expect((await page.locator('#composer').boundingBox()).y).toBeCloseTo(before,0);
 }
 await page.getByLabel('Ask or search workspace').fill('search draft survives layout changes');await page.getByRole('button',{name:'Toggle bottom panel'}).click();await expect(page.getByLabel('Ask or search workspace')).toHaveValue('search draft survives layout changes');
 await page.getByLabel('Workspace layout').click();await page.getByRole('button',{name:'Swap left and right panes',exact:true}).click();await page.getByRole('button',{name:'Toggle bottom panel'}).click();
 const pane=await page.locator('#context').boundingBox(),composer=await page.locator('#composer').boundingBox();expect(composer.y+composer.height).toBeLessThanOrEqual(pane.y+pane.height+1);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await expect(page.getByLabel('Ask or search workspace')).toBeVisible();
});
