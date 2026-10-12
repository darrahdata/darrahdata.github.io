const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
const classSet=(title,ids=['ourFather','hailMary'],createdBy)=>({version:1,title,ids,...(createdBy?{createdBy}:{})});
const linkFor=set=>base+'#class='+Buffer.from(JSON.stringify([1,set.title,set.ids,...(set.createdBy?[set.createdBy]:[])])).toString('base64url');
async function run(check){const browser=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{await check(browser);}finally{await browser.close();}}
async function phone(browser){return browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});}
async function ready(page){await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();}
async function seed(page,sets=[],draft=null,builderOpen=false){
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  await page.evaluate(({sets,draft,builderOpen})=>{
    localStorage.setItem('ocia-sets',JSON.stringify(sets));
    if(draft)localStorage.setItem('ocia-draft',JSON.stringify(draft));
    localStorage.setItem('ocia-builder-open',JSON.stringify(builderOpen));
  },{sets,draft,builderOpen});
  await page.reload();await ready(page);
}
async function stored(page,key){return page.evaluate(key=>JSON.parse(localStorage.getItem('ocia-'+key)),key);}
async function openShared(page,set){await page.goto(linkFor(set));await page.locator('#reader-title').waitFor();}
async function beginPrayer(page,set,firstPrayer){
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  assert.equal((await stored(page,'resume')).index,-1);
  assert.equal((await stored(page,'resume')).withIntro,true);
  await page.getByRole('button',{name:'Begin Prayer',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').textContent(),firstPrayer);
  assert.equal((await stored(page,'resume')).index,0);
  assert.equal(await page.locator('.session-name, .class-creator').count(),0);
  assert.doesNotMatch(await page.locator('body').innerText(),/Last Updated/);
}
async function overview(page){
  if(await page.locator('[data-action="exit"]').isVisible())await page.locator('[data-action="exit"]').tap();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  await page.getByRole('heading',{name:'Saved Prayer Sets',exact:true}).waitFor();
}

test('opening a shared class saves it once, preserves the draft, and reopens from My Prayers at the remembered prayer',()=>run(async browser=>{
  const page=await phone(browser);
  const existing={id:'existing-class',set:classSet('Saved Original',['cross','gloryBe'])};
  const draft={...classSet('Unfinished Draft',['cross','fatima']),savedId:existing.id};
  await seed(page,[existing],draft,true);
  const set=classSet('10/13/2026 OCIA',['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima']);
  await openShared(page,set);
  let saved=await stored(page,'sets');
  assert.equal(saved.length,2);
  const imported=saved[0];assert.deepEqual(imported.set,set);assert.deepEqual(saved[1],existing);
  assert.deepEqual(await stored(page,'draft'),draft);
  assert.equal(await stored(page,'builder-open'),true);
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  await page.reload();await page.locator('#reader-title').waitFor();
  await beginPrayer(page,set,'The First Joyful Mystery: The Annunciation of the Lord.');
  await page.getByRole('button',{name:'Next',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
  assert.equal(await page.getByRole('button',{name:'Begin Prayer',exact:true}).count(),0);
  assert.equal(await page.locator('.session-name, .class-creator').count(),0);
  await page.reload();await page.locator('#reader-title').waitFor();
  assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
  assert.deepEqual(await stored(page,'sets'),saved);
  await overview(page);
  assert.equal(await page.locator('#class-title').count(),0);
  assert.equal(await page.locator('[data-action="read-saved"]').count(),2);
  await page.locator(`[data-action="read-saved"][data-id="${imported.id}"]`).tap();
  assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
  await overview(page);
  await page.locator('[data-action="read-saved"][data-id="existing-class"]').tap();
  await beginPrayer(page,existing.set,'Sign of the Cross');
  await overview(page);
  await page.getByRole('button',{name:`Share QR for ${set.title}`,exact:true}).tap();
  assert.equal(await page.locator('#share-url').inputValue(),linkFor(set));
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();
  await page.getByRole('button',{name:'Create Prayer Set',exact:true}).tap();
  assert.equal(await page.locator('#class-title').inputValue(),draft.title);
  assert.deepEqual(await stored(page,'draft'),draft);
  assert.equal(await stored(page,'builder-open'),true);
  assert.deepEqual(await stored(page,'sets'),saved);
  await page.close();
}));

test('repeat scans match the whole set while same-title revisions and creators remain separate',()=>run(async browser=>{
  const page=await phone(browser);
  const original=classSet('Tuesday OCIA',['ourFather']);
  const entry={id:'original',set:original};
  await seed(page,[entry]);
  await openShared(page,original);
  assert.deepEqual(await stored(page,'sets'),[entry]);
  const revised=classSet(original.title,['ourFather','hailMary']);
  await openShared(page,revised);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ocia-sets')).length===2);
  const credited=classSet(revised.title,revised.ids,'Pat');
  await openShared(page,credited);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ocia-sets')).length===3);
  const snapshots=await stored(page,'sets');
  assert.deepEqual(snapshots.map(entry=>entry.set),[credited,revised,original]);
  await page.reload();await page.locator('#reader-title').waitFor();
  assert.deepEqual(await stored(page,'sets'),snapshots);
  await overview(page);
  assert.equal(await page.locator('[data-action="read-saved"]').count(),3);
  assert.equal(await page.locator('.saved-row .class-credit').textContent(),'Created By Pat');
  await page.close();
}));

test('a full saved library keeps every snapshot, opens the new class, and saves it after space is freed',()=>run(async browser=>{
  const page=await phone(browser);
  const existing=Array.from({length:20},(_,index)=>({id:`saved-${index}`,set:classSet(`Saved ${index+1}`,['cross'])}));
  await seed(page,existing);
  const set=classSet('New Shared Class',['ourFather']);
  await openShared(page,set);
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  assert.match(await page.locator('#toast').textContent(),/20 saved prayer sets are full/);
  assert.deepEqual(await stored(page,'sets'),existing);
  await beginPrayer(page,set,'Lord’s Prayer (Our Father)');
  await openShared(page,existing[0].set);
  assert.deepEqual(await stored(page,'sets'),existing);
  assert.equal(await page.locator('#toast').isVisible(),false);
  await overview(page);
  await page.locator('[data-action="delete-saved"][data-id="saved-19"]').tap();
  await page.getByRole('button',{name:'Remove Prayer Set',exact:true}).tap();
  assert.deepEqual(await stored(page,'sets'),existing.slice(0,19));
  await openShared(page,set);
  const saved=await stored(page,'sets');assert.equal(saved.length,20);
  assert.deepEqual(saved[0].set,set);assert.deepEqual(saved.slice(1),existing.slice(0,19));
  await page.close();
}));

test('unavailable storage never claims a shared class is saved or prevents reading',()=>run(async browser=>{
  const page=await phone(browser);
  const existing={id:'existing',set:classSet('Existing Saved Class',['cross'])};
  await seed(page,[existing]);
  await page.addInitScript(()=>{
    const write=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='ocia-sets')throw new DOMException('Storage unavailable','QuotaExceededError');return write.call(this,key,value);};
  });
  await page.reload();await ready(page);
  const set=classSet('Unsaved Shared Class');
  await openShared(page,set);
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  assert.match(await page.locator('#toast').textContent(),/could not be saved on this device/);
  assert.deepEqual(await stored(page,'sets'),[existing]);
  await beginPrayer(page,set,'Lord’s Prayer (Our Father)');
  await page.getByRole('button',{name:'Next',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary');
  await overview(page);
  assert.equal(await page.locator('[data-action="read-saved"]').count(),1);
  assert.match(await page.locator('[data-action="read-saved"]').textContent(),/Existing Saved Class/);
  assert.doesNotMatch(await page.locator('.saved').textContent(),/Unsaved Shared Class/);
  await page.close();
}));

test('stale empty saved entries and invalid links do not break or alter valid imports',()=>run(async browser=>{
  const page=await phone(browser);
  const empty={id:'stale-empty',set:classSet('Stale Empty Class',[])};
  await seed(page,[empty]);
  const set=classSet('Valid Class',['hailMary']);
  await openShared(page,set);
  await beginPrayer(page,set,'Hail Mary');
  const saved=await stored(page,'sets');assert.equal(saved.length,2);
  assert.deepEqual(saved[0].set,set);assert.deepEqual(saved[1],empty);
  await page.goto(base+'#class=broken');await page.getByRole('dialog').waitFor();
  assert.match(await page.locator('#dialog-title').textContent(),/Could Not Open/);
  assert.deepEqual(await stored(page,'sets'),saved);
  await page.getByRole('dialog').getByRole('button',{name:'Browse Prayers',exact:true}).tap();
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('heading',{name:'Begin With Essentials',exact:true}).isVisible(),true);
  assert.deepEqual(await stored(page,'sets'),saved);
  await page.close();
}));
