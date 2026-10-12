const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
const ids=['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima'];
const classURL=base+'#class='+Buffer.from(JSON.stringify([1,'10/13/2026 OCIA',ids])).toString('base64url');
async function run(check){const browser=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{await check(browser);}finally{await browser.close();}}
async function phone(browser,width=320,height=568){return browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});}
async function fits(page){
  assert.deepEqual(await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth})),{viewport:page.viewportSize().width,page:page.viewportSize().width},'A phone must not zoom out to conceal overflowing content');
}
async function tapTargets(page,root='main'){
  const small=await page.locator(root).locator('button,input,select,summary').evaluateAll(elements=>elements.filter(el=>el.getClientRects().length).filter(el=>{const r=el.getBoundingClientRect();return r.width<47.5||r.height<47.5;}).map(el=>el.getAttribute('aria-label')||el.textContent));
  assert.deepEqual(small,[],'Touch controls should be at least 48px');
}
async function closeStaysVisible(page){
  await page.locator('dialog').evaluate(el=>el.scrollTop=el.scrollHeight);
  const close=page.getByRole('dialog').getByRole('button',{name:'Close',exact:true});
  const rect=await close.boundingBox();
  assert.ok(rect.y>=0&&rect.y+rect.height<=page.viewportSize().height,'Close stays on screen after scrolling a long dialog');
  // The center must actually receive a tap, not be hidden beneath another control.
  assert.ok(await close.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
  await close.tap();
  assert.equal(await page.locator('dialog').evaluate(el=>el.open),false);
}

test('phone class links show readable first content, count all ten prayers, and resume after rotation',()=>run(async browser=>{
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[667,375],[844,390]]){
    const page=await phone(browser,width,height);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(classURL);await page.locator('#reader-title').waitFor();await page.evaluate(()=>document.fonts.ready);
    await page.locator('.mystery-image').evaluate(img=>img.decode());
    assert.equal(await page.locator('#reader-title').textContent(),'The Annunciation');
    await fits(page);await tapTargets(page);
    assert.ok(await page.evaluate(()=>{const text=document.querySelector('#prayer-text');return text.getBoundingClientRect().top+parseFloat(getComputedStyle(text).lineHeight)<=document.querySelector('.reader-dock').getBoundingClientRect().top+1;}),'The first line of the meditation is visible above the phone navigation');
    await page.getByRole('button',{name:'Next',exact:true}).tap();
    assert.equal(await page.locator('#reader-title').textContent(),'Our Father');
    assert.equal(await page.locator('.repeat-progress').count(),0);
    await page.getByRole('button',{name:'Next',exact:true}).tap();
    for(let repeat=1;repeat<=10;repeat++){
      assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary');
      assert.equal(await page.locator('.repeat-progress').textContent(),`Prayer ${repeat} of 10`);
      if(repeat===5){await page.reload();await page.locator('#reader-title').waitFor();assert.equal(await page.locator('.repeat-progress').textContent(),'Prayer 5 of 10');}
      await page.getByRole('button',{name:'Next',exact:true}).tap();
    }
    assert.equal(await page.locator('#reader-title').textContent(),'Glory Be');
    assert.equal(await page.locator('.repeat-progress').count(),0);
    await page.getByRole('button',{name:'Previous',exact:true}).tap();
    assert.equal(await page.locator('.repeat-progress').textContent(),'Prayer 10 of 10');
    await page.setViewportSize({width:height,height:width});await fits(page);
    await page.getByRole('button',{name:'Reading Settings',exact:true}).tap();
    await page.locator('#text-size').selectOption('1.75');await closeStaysVisible(page);
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top),'End of the prayer can be scrolled fully above navigation');
    await page.getByRole('button',{name:'Contents',exact:true}).tap();await closeStaysVisible(page);
    assert.deepEqual(errors,[]);await page.close();
  }
}));

test('phone class preparation keeps picker and QR dismissal within tap reach',()=>run(async browser=>{
  const page=await phone(browser);await page.goto(base);await page.getByRole('button',{name:'My Class',exact:true}).tap();
  await page.getByRole('button',{name:'Prepare a Class',exact:true}).tap();
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).tap();
  assert.notEqual(await page.evaluate(()=>document.activeElement.id),'picker-search','Touch users can browse without opening the keyboard automatically');
  await fits(page);await tapTargets(page,'dialog');await closeStaysVisible(page);
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).tap();
  await page.locator('#picker-search').fill('Hail Mary');await page.locator('#picker-count').selectOption('10');
  await page.locator('[data-action="add"][data-id="hailMary"]').tap();await closeStaysVisible(page);
  assert.equal(await page.locator('.step-count').inputValue(),'10');await fits(page);await tapTargets(page);
  await page.getByRole('button',{name:'Save Set',exact:true}).tap();
  await page.locator('#saved-set-name').fill('Phone Class');
  await page.getByRole('dialog').getByRole('button',{name:'Save Set',exact:true}).tap();
  await page.getByRole('heading',{name:'Class Saved — Ready to Share',exact:true}).waitFor();
  assert.ok(await page.locator('#share-url').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
  const link=await page.locator('#share-url').inputValue();
  assert.deepEqual(JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url')),[1,'Phone Class',Array(10).fill('hailMary')]);
  await fits(page);await tapTargets(page,'dialog');await closeStaysVisible(page);await page.close();
}));

test('200 percent text stays on a narrow phone with usable navigation',()=>run(async browser=>{
  const page=await phone(browser);await page.goto(base);await page.locator('[data-action=essentials]').waitFor();
  await page.addStyleTag({content:':root{font-size:200%}'});await page.evaluate(()=>document.fonts.ready);
  await fits(page);
  for(const button of await page.locator('.primary-nav button').all()){
    assert.ok(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  await page.locator('[data-action=essentials]').tap();await fits(page);
  const dock=await page.locator('.reader-dock').boundingBox();assert.ok(dock.height<page.viewportSize().height/3,'Enlarged navigation must leave room to read');
  for(const button of await page.locator('.reader-dock button').all()){
    const r=await button.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=320&&r.y+r.height<=568);
    assert.ok(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  await page.getByRole('button',{name:'Next',exact:true}).tap();assert.equal(await page.locator('#reader-title').textContent(),'Our Father');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  assert.ok(await page.evaluate(()=>document.querySelector('.reading-help').getBoundingClientRect().bottom<=document.querySelector('.reader-dock').getBoundingClientRect().top));
  await page.getByRole('button',{name:'Previous',exact:true}).tap();assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await page.close();
}));
