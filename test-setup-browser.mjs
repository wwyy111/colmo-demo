// Optional UI verification: supply PLAYWRIGHT_MODULE and CHROME_EXECUTABLE if needed.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setupSequence} from './ai-1/setup-storyboard.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1292,height:994}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const manifest=JSON.parse(readFileSync('ai-1/media/setup/manifest.json'));
const shots=setupSequence(manifest);let elapsed=0;const offsets=Object.fromEntries(shots.map(s=>{const pair=[s.id,elapsed];elapsed+=s.duration;return pair;}));
const seek=async ms=>{await page.locator('#demo-progress').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},ms);await page.waitForTimeout(150);};
try{
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:8783/ai-1/');
 await page.waitForFunction(()=>document.querySelector('#scene')?.dataset.storyboard==='overview');
 await page.locator('.room-frame').hover();await page.locator('#demo-play').click();
 assert.equal(await page.locator('.terminal-label:not([hidden])').count(),7);
 assert.equal(await page.locator('#demo-narration').evaluate(e=>e.muted),false);
 for(const s of shots){
  await seek(offsets[s.id]+s.duration*.5);
  assert.equal(await page.locator('.room-frame').getAttribute('data-shot'),s.id);
  if(s.card){assert.equal(await page.locator('#scene-media .setup-card').getAttribute('data-card'),s.card);assert.ok(await page.locator('#scene-media').isVisible());}
  if(s.voice){assert.ok((await page.locator('#demo-narration').getAttribute('src')).endsWith(manifest.voices[s.voice].file));assert.equal(await page.locator('#demo-narration').evaluate(e=>e.muted),false);}
 }
 await seek(offsets.light+2000);
 const frozen=await page.locator('#scene').getAttribute('data-light');await page.waitForTimeout(350);assert.equal(await page.locator('#scene').getAttribute('data-light'),frozen);
 await page.locator('.room-frame').hover();await page.locator('#demo-play').click();await page.waitForTimeout(400);assert.notEqual(await page.locator('#scene').getAttribute('data-light'),frozen);await page.locator('#demo-play').click();
 await page.locator('#demo-sound').click();await seek(offsets.recommend);assert.equal(await page.locator('#demo-narration').evaluate(e=>e.muted),true);await page.locator('#demo-sound').click();assert.equal(await page.locator('#demo-narration').evaluate(e=>e.muted),false);
 await page.locator('#shape-select').selectOption('glass');assert.equal(await page.locator('#scene-media .butler').getAttribute('data-shape'),'glass');
 await page.locator('#visual-tabs button').first().click();
 for(let i=0;i<7;i++){await page.locator('.avatar-state-picks button').nth(i).click();assert.ok(await page.locator('#channel-content .butler.reference-motion').isVisible());}
 await page.locator('#shape-select').selectOption('line');assert.equal(await page.locator('#channel-content .butler').getAttribute('data-shape'),'line');
 await page.locator('#timeline button').nth(1).click();await page.locator('#branch-select').selectOption('conditions');
 assert.equal(await page.locator('#scene-media .setup-card dl>div').count(),3);
 await page.locator('[data-setup-action="体验可用设备"]').click();
 await seek(Number(await page.locator('#demo-progress').getAttribute('max'))-100);await page.waitForTimeout(250);
 await page.locator('[data-setup-action="确认启用"]').click();assert.ok((await page.locator('#modal-body').textContent()).includes('尚未解决'));await page.locator('#close-modal').click();
 await page.locator('#timeline button').nth(2).click();await page.locator('#branch-select').selectOption('lightFailure');await seek(3500);assert.equal(await page.locator('#scene').getAttribute('data-light'),'0.060');
 await page.locator('#timeline button').nth(1).click();await page.locator('[data-setup-action="调整方案"]').click();await page.locator('#edit-curtain').selectOption('closed');await page.locator('#setup-editor button').click();await seek(7000);assert.equal(await page.locator('#scene').getAttribute('data-curtain'),'0.030');
 await page.locator('#timeline button').nth(1).click();
 await page.locator('.room-frame').dispatchEvent('wheel',{deltaY:100});assert.ok(await page.locator('#global-nav').evaluate(e=>e.classList.contains('nav-hidden')));
 await page.locator('.detail-scroll').dispatchEvent('wheel',{deltaY:100});assert.ok(await page.locator('#global-nav').evaluate(e=>e.classList.contains('nav-hidden')));
 await page.locator('.intro').dispatchEvent('wheel',{deltaY:100});assert.ok(await page.locator('#global-nav').evaluate(e=>!e.classList.contains('nav-hidden')));await page.locator('.scene-close').click();
 for(const [width,height] of [[1920,1080],[1292,994],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const box=await page.locator('#scene-media .setup-card').boundingBox(),room=await page.locator('.room-frame').boundingBox();
  assert.ok(box.y>=room.y&&box.x>=room.x&&box.x+box.width<=room.x+room.width+1&&box.y+box.height<=room.y+room.height-60,'card must fit inside scene');
  assert.equal(await page.locator('#scene-media .setup-card dl>div:visible').count(),3);
 }
 await page.setViewportSize({width:1292,height:994});await page.locator('#channels button').nth(1).click();await page.locator('#channel-content audio').first().evaluate(a=>a.play());await page.waitForTimeout(200);assert.equal(await page.locator('#channel-content audio').first().evaluate(a=>a.paused),false);
 await page.locator('#tasks button').nth(1).click();assert.equal(await page.locator('#demo-controls').isVisible(),false);assert.equal(await page.locator('#scene-media').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: all shots, media mapping, pause/resume, sound preference, two avatar styles, exception guards, editing, wheel isolation, 3 viewports and generic tasks.');
}finally{await browser.close();}
