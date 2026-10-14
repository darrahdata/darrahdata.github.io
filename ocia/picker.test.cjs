const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;

async function run(check){
  const browser=await engine.launch(engine===chromium?{channel:'chrome'}:{});
  try{await check(browser);}finally{await browser.close();}
}
async function builder(browser,ids=[]){
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  if(ids.length)await page.addInitScript(ids=>{
    localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Picker Test',ids}));
    localStorage.setItem('ocia-builder-open','true');
  },ids);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  const create=page.getByRole('button',{name:'Create Prayer Set',exact:true});
  if(await create.isVisible())await create.tap();
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).waitFor();
  return page;
}
async function picker(page){
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).tap();
  await page.locator('#picker-results button').first().waitFor();
}
const row=(page,id)=>page.locator(`#picker-results button[data-id="${id}"]`);
const draft=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
async function positions(page,id,expected){
  assert.deepEqual(await row(page,id).locator('.picker-position').allTextContents(),expected,`${id} shows its grouped order and repetitions`);
  assert.equal(await row(page,id).evaluate(el=>el.matches('.is-added')||el.parentElement.matches('.is-added')),true);
  assert.match(await row(page,id).locator('.picker-selection').textContent(),/In Your Set:/);
  assert.match(await row(page,id).textContent(),/Add Again/);
}
async function add(page,id,count){
  if(count!==undefined)await page.locator('#picker-count').selectOption(String(count));
  await row(page,id).tap();
}
async function settled(page){
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}
async function review(page){
  await page.locator('[data-action="review-set"]').tap();
  await page.waitForFunction(()=>!document.querySelector('dialog').open&&document.activeElement?.matches('.step-list'));
}

test('picker positions match grouped order through repeated additions, persistence, reordering and removal',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);
  assert.equal(await page.locator('#picker-status').getAttribute('role'),'status');
  await add(page,'ourFather',1);await positions(page,'ourFather',['1']);
  await add(page,'hailMary',10);await positions(page,'hailMary',['2 ×10']);
  assert.match(await page.locator('#picker-status').textContent(),/Hail Mary/);
  await add(page,'hailMary',2);await positions(page,'hailMary',['2 ×12']);
  assert.match(await page.locator('#picker-status').textContent(),/Hail Mary ×12/,'Repeated additions announce the updated total for the group');
  assert.equal(await page.locator('#picker-count').inputValue(),'2','The chosen repetition count is retained');
  await add(page,'gloryBe',1);await positions(page,'gloryBe',['3']);
  await add(page,'hailMary');await positions(page,'hailMary',['2 ×12','4']);
  assert.equal(await page.locator('#picker-summary').textContent(),'4 Items · 15 / 32 Pages');
  const expected=['ourFather',...Array(12).fill('hailMary'),'gloryBe','hailMary'];
  assert.deepEqual(await draft(page),expected);
  await review(page);assert.equal(await page.locator('.step').count(),4);
  await page.reload();await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();await picker(page);
  await positions(page,'hailMary',['2 ×12','4']);await positions(page,'gloryBe',['3']);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='picker');
  await page.getByRole('button',{name:'Move Glory Be Earlier',exact:true}).tap();
  await picker(page);await positions(page,'gloryBe',['2']);await positions(page,'hailMary',['3 ×13']);
  await review(page);await page.getByRole('button',{name:'Remove Glory Be',exact:true}).tap();
  await picker(page);await positions(page,'hailMary',['2 ×13']);
  assert.equal(await row(page,'gloryBe').locator('.picker-position').count(),0);
  assert.equal(await page.locator('#picker-summary').textContent(),'2 Items · 14 / 32 Pages');
  assert.deepEqual(await draft(page),['ourFather',...Array(13).fill('hailMary')]);
  await page.close();
}));

test('picker preserves search, count, focused row and scroll while announcing each addition inside the dialog',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);
  await page.locator('#picker-search').fill('Hail');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'picker-search');
  await page.locator('#picker-count').selectOption('3');
  assert.match(await row(page,'hailMary').getAttribute('aria-label'),/Hail Mary/);
  assert.match(await row(page,'hailMary').getAttribute('aria-label'),/3/,'The accessible add name includes the current repetition count');
  await add(page,'hailMary');
  assert.equal(await page.locator('#picker-search').inputValue(),'Hail');
  assert.equal(await page.locator('#picker-count').inputValue(),'3');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'hailMary');
  await positions(page,'hailMary',['1 ×3']);
  assert.equal(await page.locator('dialog #picker-status').isVisible(),true);
  assert.match(await page.locator('#picker-status').textContent(),/Hail Mary/);
  await page.locator('#picker-count').selectOption('2');
  assert.match(await row(page,'hailMary').getAttribute('aria-label'),/2/,'Changing repetitions updates the add action');
  await page.locator('#picker-search').fill('');
  await settled(page);
  await row(page,'comeHolySpirit').scrollIntoViewIfNeeded();
  const before=await page.locator('dialog').evaluate(el=>el.scrollTop);
  assert.ok(before>0,'This addition exercises a scrolled picker');
  await add(page,'comeHolySpirit');await settled(page);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'comeHolySpirit');
  const after=await page.locator('dialog').evaluate(el=>el.scrollTop);
  assert.ok(Math.abs(after-before)<=1,`Adding keeps picker scroll position (${before} → ${after})`);
  assert.match(await page.locator('#picker-status').textContent(),/Come, Holy Spirit/);
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='picker');
  assert.deepEqual(await draft(page),[...Array(3).fill('hailMary'),...Array(2).fill('comeHolySpirit')]);
  await page.close();
}));

test('full picker keeps numbered selections visible and moves focus to Review Set',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);
  const resultCount=await page.locator('#picker-results button').count();
  await add(page,'ourFather',31);await positions(page,'ourFather',['1 ×31']);
  assert.equal(await page.locator('#picker-count').inputValue(),'1','Repetitions are bounded by the one remaining page');
  await add(page,'hailMary');
  assert.equal(await page.locator('#picker-results button').count(),resultCount,'Capacity must not remove the numbered results');
  await positions(page,'ourFather',['1 ×31']);await positions(page,'hailMary',['2']);
  assert.equal(await page.locator('#picker-results button:enabled').count(),0);
  assert.equal(await page.locator('#picker-count').isDisabled(),true);
  assert.equal(await page.locator('#picker-summary').textContent(),'2 Items · 32 / 32 Pages');
  assert.match(await page.locator('#picker-status').textContent(),/set is full/i,'Capacity feedback is inside the dialog');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'review-set');
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('dialog').open&&document.activeElement?.matches('.step-list'));
  assert.equal((await draft(page)).length,32);await picker(page);
  await positions(page,'ourFather',['1 ×31']);await positions(page,'hailMary',['2']);
  assert.equal(await page.locator('#picker-results button:enabled').count(),0);
  await page.close();
}));

test('picker position chips and review action remain usable at 200 percent text on a 320px phone',()=>run(async browser=>{
  const ids=Array.from({length:20},(_,index)=>index%2?'gloryBe':'hailMary');
  const page=await builder(browser,ids);
  await page.addStyleTag({content:':root{font-size:200%!important}'});
  await picker(page);await page.locator('#picker-search').fill('Hail Mary');await settled(page);
  await positions(page,'hailMary',Array.from({length:10},(_,index)=>String(index*2+1)));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
  assert.ok(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),'The enlarged picker has no horizontal scrolling');
  assert.ok(await row(page,'hailMary').locator('small').evaluate(el=>el.getBoundingClientRect().height<=parseFloat(getComputedStyle(el).lineHeight)+1),'The category word Essentials stays intact at enlarged text');
  const chipRects=await row(page,'hailMary').locator('.picker-position').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right};}));
  assert.ok(chipRects.every(r=>r.left>=0&&r.right<=320),'All order chips wrap within the phone');
  await page.locator('dialog').evaluate(el=>el.scrollTop=el.scrollHeight);await settled(page);
  const button=page.locator('[data-action="review-set"]');
  assert.ok(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=48&&r.height>=48&&r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Review Set remains a visible and tappable action');
  await review(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
  await page.close();
}));
