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
    if(!localStorage.getItem('ocia-draft')){
      localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Picker Test',ids}));
      localStorage.setItem('ocia-builder-open','true');
    }
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
const row=(page,id)=>page.locator(`#picker-results [data-action="add"][data-id="${id}"]`);
const steps=(page,id)=>page.locator(`#picker-results .picker-step[data-id="${id}"]`);
const step=(page,id,start)=>page.locator(`#picker-results .picker-step[data-id="${id}"][data-index="${start}"]`);
const control=(page,id,start,action)=>step(page,id,start).locator(`[data-action="picker-${action}"]`);
const draft=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
async function positions(page,id,expected){
  const cards=steps(page,id);
  assert.equal(await cards.count(),expected.length,`${id} has a separate card for each occurrence in the set`);
  for(let i=0;i<expected.length;i++){
    const [position,count]=expected[i],card=cards.nth(i);
    assert.equal(await card.locator('.picker-step-number').textContent(),`Step ${position}`,`${id} shows its grouped position`);
    assert.equal(await card.locator('.picker-step-count > span').textContent(),`Pray ${count} ${count===1?'Time':'Times'}`,`${id} spells out how often to pray`);
    assert.match(await card.textContent(),/Remove Step/);
  }
  if(expected.length)assert.match(await row(page,id).textContent(),/Add Again/);
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
async function noOverflow(page){
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
  assert.ok(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),'The picker has no horizontal scrolling');
}
async function focusIs(page,action,start){
  await page.waitForFunction(({action,start})=>{
    const active=document.activeElement;
    return active?.dataset.action===`picker-${action}`&&Number(active.closest('.picker-step')?.dataset.index)===start&&!active.disabled;
  },{action,start});
}

test('clear labels distinguish grouped order from prayer counts through additions and reordering',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);
  assert.equal(await page.locator('#picker-status').getAttribute('role'),'status');
  await add(page,'ourFather',1);await positions(page,'ourFather',[[1,1]]);
  await add(page,'hailMary',10);await positions(page,'hailMary',[[2,10]]);
  assert.match(await page.locator('#picker-status').textContent(),/Hail Mary/);
  await add(page,'hailMary',2);await positions(page,'hailMary',[[2,12]]);
  assert.match(await page.locator('#picker-status').textContent(),/12/,'Repeated additions announce the updated total');
  assert.equal(await page.locator('#picker-count').inputValue(),'2','The chosen add count is retained');
  await add(page,'gloryBe',1);await positions(page,'gloryBe',[[3,1]]);
  await add(page,'hailMary');await positions(page,'hailMary',[[2,12],[4,1]]);
  assert.match(await page.locator('#picker-summary').textContent(),/4 (?:Items|Steps) · 15 \/ 32 Pages/);
  assert.deepEqual(await draft(page),['ourFather',...Array(12).fill('hailMary'),'gloryBe','hailMary']);
  assert.equal(await page.locator('#picker-results button button').count(),0,'Edit actions are not nested inside Add buttons');
  await review(page);assert.equal(await page.locator('.step').count(),4);
  await page.getByRole('button',{name:'Move Glory Be Earlier',exact:true}).tap();
  await picker(page);await positions(page,'gloryBe',[[2,1]]);await positions(page,'hailMary',[[3,13]]);
  await review(page);await page.getByRole('button',{name:'Remove Glory Be',exact:true}).tap();
  await picker(page);await positions(page,'hailMary',[[2,13]]);await positions(page,'gloryBe',[]);
  assert.deepEqual(await draft(page),['ourFather',...Array(13).fill('hailMary')]);
  await page.close();
}));

test('editing and removing one occurrence leaves the other intact; Undo, reload and share preserve the exact set',()=>run(async browser=>{
  const original=['ourFather',...Array(3).fill('hailMary'),'gloryBe',...Array(2).fill('hailMary')];
  const page=await builder(browser,original);await picker(page);await page.locator('#picker-search').fill('Hail Mary');
  await positions(page,'hailMary',[[2,3],[4,2]]);
  await control(page,'hailMary',1,'more').tap();
  await positions(page,'hailMary',[[2,4],[4,2]]);
  await control(page,'hailMary',6,'less').tap();
  await positions(page,'hailMary',[[2,4],[4,1]]);
  assert.equal(await control(page,'hailMary',6,'less').isDisabled(),true,'One prayer stays in the set until Remove Step is used');
  const edited=['ourFather',...Array(4).fill('hailMary'),'gloryBe','hailMary'];
  assert.deepEqual(await draft(page),edited);
  await control(page,'hailMary',1,'remove').tap();
  assert.deepEqual(await draft(page),['ourFather','gloryBe','hailMary']);
  await positions(page,'hailMary',[[3,1]]);
  assert.match(await page.locator('#picker-feedback').textContent(),/Hail Mary.*Step 2/i,'Removal identifies the prayer and former position');
  await page.locator('[data-action="picker-undo"]').tap();
  assert.deepEqual(await draft(page),edited);await positions(page,'hailMary',[[2,4],[4,1]]);
  await review(page);
  await page.reload();await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();await picker(page);
  await positions(page,'hailMary',[[2,4],[4,1]]);assert.deepEqual(await draft(page),edited);
  await review(page);await page.getByRole('button',{name:'Share / QR Code',exact:true}).tap();
  const link=await page.locator('#share-url').inputValue();
  const payload=JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8'));
  assert.deepEqual(payload[2],edited,'The QR link preserves edited counts and separate occurrences');
  await page.close();
}));

test('Undo restores both groups when removing a separating prayer merges adjacent repeats',()=>run(async browser=>{
  const original=[...Array(2).fill('hailMary'),'gloryBe',...Array(3).fill('hailMary')];
  const page=await builder(browser,original);await picker(page);
  await control(page,'gloryBe',2,'remove').tap();
  await positions(page,'hailMary',[[1,5]]);assert.deepEqual(await draft(page),Array(5).fill('hailMary'));
  await page.locator('[data-action="picker-undo"]').tap();
  assert.deepEqual(await draft(page),original);
  await positions(page,'hailMary',[[1,2],[3,3]]);await positions(page,'gloryBe',[[2,1]]);
  await control(page,'gloryBe',2,'remove').tap();
  await control(page,'hailMary',0,'more').tap();
  assert.equal(await page.locator('[data-action="picker-undo"]').isVisible(),false,'A new edit clears obsolete Undo so it cannot overwrite later work');
  assert.deepEqual(await draft(page),Array(6).fill('hailMary'));
  await control(page,'hailMary',0,'remove').tap();
  assert.equal(await page.locator('[data-action="review-set"]').isDisabled(),true);
  assert.deepEqual(await draft(page),[]);
  await page.locator('[data-action="picker-undo"]').tap();
  assert.deepEqual(await draft(page),Array(6).fill('hailMary'));
  await control(page,'hailMary',0,'remove').tap();
  await add(page,'ourFather',1);
  assert.equal(await page.locator('[data-action="picker-undo"]').isVisible(),false,'Adding a new prayer also clears obsolete Undo');
  assert.deepEqual(await draft(page),['ourFather']);
  await page.close();
}));

test('keyboard focus remains on an enabled repeat control at minimum and maximum counts',()=>run(async browser=>{
  const page=await builder(browser,['hailMary','hailMary']);await picker(page);
  await control(page,'hailMary',0,'less').focus();await page.keyboard.press('Enter');
  assert.deepEqual(await draft(page),['hailMary']);
  assert.equal(await control(page,'hailMary',0,'less').isDisabled(),true);
  await focusIs(page,'more',0);
  await page.keyboard.press('Enter');
  assert.deepEqual(await draft(page),['hailMary','hailMary']);await focusIs(page,'more',0);
  await add(page,'ourFather',29);
  await control(page,'hailMary',0,'more').focus();await page.keyboard.press('Enter');
  assert.equal((await draft(page)).length,32);
  assert.equal(await control(page,'hailMary',0,'more').isDisabled(),true);await focusIs(page,'less',0);
  await page.keyboard.press('Enter');assert.equal((await draft(page)).length,31);await focusIs(page,'less',0);
  await page.close();
}));

test('a full picker keeps selected steps editable and re-enables additions after reducing or removing',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);
  const resultCount=await page.locator('#picker-results [data-action="add"]').count();
  await add(page,'ourFather',31);await positions(page,'ourFather',[[1,31]]);
  assert.equal(await page.locator('#picker-count').inputValue(),'1');await add(page,'hailMary');
  assert.equal(await page.locator('#picker-results [data-action="add"]').count(),resultCount);
  await positions(page,'ourFather',[[1,31]]);await positions(page,'hailMary',[[2,1]]);
  assert.equal(await page.locator('#picker-results [data-action="add"]:enabled').count(),0);
  assert.equal(await page.locator('[data-action="picker-more"]:enabled').count(),0);
  assert.equal(await page.locator('[data-action="picker-remove"]:enabled').count(),2);
  assert.equal(await page.locator('#picker-count').isDisabled(),true);
  assert.match(await page.locator('#picker-summary').textContent(),/2 (?:Items|Steps) · 32 \/ 32 Pages/);
  assert.match(await page.locator('#picker-status').textContent(),/set is full/i);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'review-set');
  await control(page,'ourFather',0,'less').tap();
  assert.equal((await draft(page)).length,31);
  assert.equal(await control(page,'hailMary',30,'more').isEnabled(),true);
  assert.equal(await row(page,'gloryBe').isEnabled(),true);assert.equal(await page.locator('#picker-count').isEnabled(),true);
  await control(page,'hailMary',30,'more').tap();assert.equal((await draft(page)).length,32);
  await control(page,'hailMary',30,'remove').tap();assert.equal((await draft(page)).length,30);
  assert.equal(await row(page,'gloryBe').isEnabled(),true);
  await page.close();
}));

test('search and count stay stable while picker actions announce updates inside the dialog',()=>run(async browser=>{
  const page=await builder(browser);await picker(page);await page.locator('#picker-search').fill('Hail');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'picker-search');
  await page.locator('#picker-count').selectOption('3');
  assert.match(await row(page,'hailMary').getAttribute('aria-label'),/Hail Mary/);
  assert.match(await row(page,'hailMary').getAttribute('aria-label'),/3/);
  await add(page,'hailMary');
  assert.equal(await page.locator('#picker-search').inputValue(),'Hail');
  assert.equal(await page.locator('#picker-count').inputValue(),'3');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'hailMary');
  await positions(page,'hailMary',[[1,3]]);assert.equal(await page.locator('dialog #picker-status').isVisible(),true);
  await control(page,'hailMary',0,'more').tap();
  assert.equal(await page.locator('#picker-search').inputValue(),'Hail');
  assert.match(await page.locator('#picker-status').textContent(),/Hail Mary/);
  assert.match(await page.locator('#picker-status').textContent(),/4/);
  await page.locator('#picker-count').selectOption('2');assert.match(await row(page,'hailMary').getAttribute('aria-label'),/2/);
  await page.locator('#picker-search').fill('');await settled(page);
  await row(page,'comeHolySpirit').scrollIntoViewIfNeeded();
  const before=await page.locator('dialog').evaluate(el=>el.scrollTop);assert.ok(before>0);
  await add(page,'comeHolySpirit');await settled(page);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'comeHolySpirit');
  const after=await page.locator('dialog').evaluate(el=>el.scrollTop);
  assert.ok(Math.abs(after-before)<=1,`Adding keeps picker scroll position (${before} → ${after})`);
  assert.match(await page.locator('#picker-status').textContent(),/Come, Holy Spirit/);
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='picker');
  assert.deepEqual(await draft(page),[...Array(4).fill('hailMary'),...Array(2).fill('comeHolySpirit')]);
  await page.close();
}));

test('clear labels, count controls, Remove and Undo fit a 320px phone at 200 percent text',()=>run(async browser=>{
  const ids=Array.from({length:10},(_,index)=>index%2?'gloryBe':'hailMary');
  const page=await builder(browser,ids);await page.addStyleTag({content:':root{font-size:200%!important}'});
  await picker(page);await page.locator('#picker-search').fill('Hail Mary');await settled(page);
  await positions(page,'hailMary',Array.from({length:5},(_,index)=>[index*2+1,1]));await noOverflow(page);
  const bounds=await steps(page,'hailMary').evaluateAll(cards=>cards.map(card=>{
    const r=card.getBoundingClientRect();
    return {left:r.left,right:r.right,buttons:[...card.querySelectorAll('button')].map(button=>{
      const b=button.getBoundingClientRect();return {width:b.width,height:b.height,left:b.left,right:b.right,name:button.getAttribute('aria-label')||button.textContent.trim()};
    })};
  }));
  assert.ok(bounds.every(card=>card.left>=0&&card.right<=320),'Every selected occurrence fits within the phone');
  assert.ok(bounds.every(card=>card.buttons.every(button=>button.width>=48&&button.height>=48&&button.left>=card.left&&button.right<=card.right&&button.name)),'Every count and Remove control has a named 48px touch target within its card');
  await control(page,'hailMary',0,'more').tap();await positions(page,'hailMary',[[1,2],[3,1],[5,1],[7,1],[9,1]]);
  await control(page,'hailMary',0,'remove').tap();await noOverflow(page);
  assert.ok(await page.locator('.picker-footer').evaluate(el=>{
    const footer=el.getBoundingClientRect(),dialog=el.closest('dialog').getBoundingClientRect();
    return getComputedStyle(el).position!=='sticky'||footer.height<dialog.height*.65;
  }),'Wrapped removal feedback must not turn a sticky footer into an overlay covering most of the dialog');
  const remainingPlus=steps(page,'hailMary').first().locator('[data-action="picker-more"]');
  await remainingPlus.scrollIntoViewIfNeeded();await settled(page);
  assert.ok(await remainingPlus.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
  }),'A remaining count control can still be reached after removal feedback appears');
  const undo=page.locator('[data-action="picker-undo"]');
  await undo.scrollIntoViewIfNeeded();await settled(page);
  assert.ok(await undo.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return r.width>=48&&r.height>=48&&r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
  }),'Undo remains visible and tappable after enlarged removal feedback wraps');
  await undo.tap();await positions(page,'hailMary',[[1,2],[3,1],[5,1],[7,1],[9,1]]);await noOverflow(page);
  await page.locator('dialog').evaluate(el=>el.scrollTop=el.scrollHeight);await settled(page);
  const button=page.locator('[data-action="review-set"]');
  assert.ok(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>=48&&r.height>=48&&r.top>=0&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Review Set remains visible and tappable');
  await review(page);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
  await page.close();
}));
