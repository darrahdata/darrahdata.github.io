const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
async function run(check){const browser=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{await check(browser);}finally{await browser.close();}}
async function phone(browser,options={}){return browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce',...options});}
async function fits(page){assert.deepEqual(await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth})),{viewport:320,page:320},'Creator names must fit the phone without zooming out');}
function payload(link){return JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8'));}
async function prepare(page){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Pray Together',exact:true}).waitFor();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  const button=page.getByRole('button',{name:'Create Prayer Set',exact:true});
  if(await button.isVisible())await button.tap();
  await page.locator('#class-creator').waitFor();
}
async function savedSets(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-sets')||'[]'));}
async function closeDialog(page){await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();}
async function save(page,creator){
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.locator('#saved-set-creator').waitFor();
  if(creator!==undefined)await page.locator('#saved-set-creator').fill(creator);
  await page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.getByRole('heading',{name:'Prayer Set Saved — Ready to Share',exact:true}).waitFor();
  return page.locator('#share-url').inputValue();
}

test('Created By is optional and blank values preserve legacy class links exactly',()=>run(async browser=>{
  const page=await phone(browser);
  await page.addInitScript(()=>localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Optional Creator',ids:['cross','comeHolySpirit','ourFather','gloryBe','cross']})));
  await prepare(page);
  assert.equal(await page.locator('#class-creator').inputValue(),'');
  assert.equal(await page.locator('#class-created-at').count(),0,'Legacy sets do not display an invented creation date');
  assert.equal(await page.locator('#class-creator').getAttribute('required'),null);
  assert.equal(await page.locator('#class-title').inputValue(),'Optional Creator');
  const link=await save(page,'   ');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  assert.deepEqual(payload(link),[1,'Optional Creator',draft.ids]);
  assert.equal(new URL(link).hash,'#class='+Buffer.from(JSON.stringify([1,'Optional Creator',draft.ids])).toString('base64url'));
  assert.equal(await page.locator('.share-creator').count(),0);await fits(page);
  const learner=await phone(browser);await learner.goto(link);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator').count(),0);
  assert.equal((await savedSets(learner)).length,1);
  assert.equal((await savedSets(learner))[0].set.createdBy,undefined);
  assert.equal((await savedSets(learner))[0].set.createdAt,undefined);
  assert.equal(draft.createdAt,undefined);
  assert.equal(draft.updatedAt,undefined);
  await fits(learner);await page.close();await learner.close();
}));

test('creator attribution persists, auto-saves for learners, and edited links retain their original creators',()=>run(async browser=>{
  const page=await phone(browser);await prepare(page);
  await page.locator('#class-title').fill('Tuesday OCIA');await page.locator('#starter').selectOption('opening');
  await page.locator('#class-creator').fill('John');await page.reload();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),'John');
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  assert.equal(await page.locator('#saved-set-creator').inputValue(),'John');
  await page.locator('#saved-set-creator').fill('  María & John  ');
  await page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.locator('.share-creator').waitFor();
  assert.equal(await page.locator('.share-creator .creator-name').textContent(),'Created By María & John');
  const original=await page.locator('#share-url').inputValue();
  assert.equal(payload(original)[3],'María & John');await fits(page);await closeDialog(page);
  assert.equal(await page.locator('#class-creator').inputValue(),'María & John');
  assert.equal((await savedSets(page))[0].set.createdBy,'María & John');
  await page.reload();await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),'María & John');
  await page.locator('#class-creator').fill('OCIA Team');
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).tap();
  const revised=await page.locator('#share-url').inputValue();
  const revisedPayload=payload(original);revisedPayload[3]='OCIA Team';
  revisedPayload[5]=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).updatedAt);
  assert.ok(Date.parse(revisedPayload[5])>Date.parse(payload(original)[5]));
  assert.notEqual(revised,original);assert.deepEqual(payload(revised),revisedPayload);
  assert.equal((await savedSets(page))[0].set.createdBy,'María & John','Editing a draft does not mutate its saved snapshot');
  const learner=await phone(browser);await learner.goto(original);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator .creator-name').textContent(),'Created By María & John');
  assert.equal((await savedSets(learner))[0].set.createdBy,'María & John');
  await learner.reload();await learner.locator('#reader-title').waitFor();assert.equal((await savedSets(learner)).length,1);
  await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await learner.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.match(await learner.locator('.saved-row').textContent(),/Created By María & John/);await fits(learner);
  await learner.goto(revised);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator .creator-name').textContent(),'Created By OCIA Team');
  const received=await savedSets(learner);
  assert.equal(received.length,2,'Changing only the creator makes a distinct saved class snapshot');
  assert.deepEqual(received.map(entry=>entry.set.createdBy).sort(),['María & John','OCIA Team']);
  await fits(learner);await page.close();await learner.close();
}));

test('hostile creator names stay literal text in the editor, QR dialog, reader, and saved class',()=>run(async browser=>{
  const hostile='<img src=x onerror="window.creatorInjected=true">';
  const page=await phone(browser);await prepare(page);
  await page.locator('#class-title').fill('Literal Creator');await page.locator('#starter').selectOption('opening');
  await page.locator('#class-creator').fill(hostile);await page.reload();
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),hostile);
  const link=await save(page);
  assert.equal(await page.locator('.share-creator .creator-name').textContent(),'Created By '+hostile);
  assert.equal(await page.locator('.share-creator img').count(),0);assert.equal(payload(link)[3],hostile);await fits(page);
  const learner=await phone(browser);await learner.goto(link);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator .creator-name').textContent(),'Created By '+hostile);
  assert.equal(await learner.locator('.class-creator img').count(),0);
  assert.equal(await learner.evaluate(()=>window.creatorInjected),undefined);await fits(learner);
  await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await learner.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.ok((await learner.locator('.saved-row').textContent()).includes('Created By '+hostile));
  assert.equal(await learner.locator('.saved-row img').count(),0);await fits(learner);
  await page.close();await learner.close();
}));


test('new prayer sets keep their creation date separate from name and creator through save, sharing and edits',()=>run(async browser=>{
  const before=Date.now();
  const page=await phone(browser);await prepare(page);
  assert.equal(await page.locator('#class-title').inputValue(),'My Prayer Set');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  const createdAt=draft.createdAt;
  assert.equal(new Date(createdAt).toISOString(),createdAt);
  assert.ok(Date.parse(createdAt)>=before&&Date.parse(createdAt)<=Date.now(),'A new set records its real creation time');
  assert.equal(draft.updatedAt,createdAt);
  assert.notEqual(await page.locator('#class-updated-at').getAttribute('readonly'),null);
  const dateText=await page.evaluate(value=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(value)),createdAt);
  assert.equal(await page.locator('#class-created-at').inputValue(),dateText);
  assert.notEqual(await page.locator('#class-created-at').getAttribute('readonly'),null);
  await page.locator('#class-title').fill('Evening Prayers');
  await page.locator('#class-creator').fill('John');await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  assert.equal(await page.locator('#saved-set-name').inputValue(),'Evening Prayers');
  assert.equal(await page.locator('#saved-set-created-at').inputValue(),dateText);
  assert.notEqual(await page.locator('#saved-set-created-at').getAttribute('readonly'),null);
  assert.notEqual(await page.locator('#saved-set-updated-at').getAttribute('readonly'),null);
  await page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.getByRole('heading',{name:'Prayer Set Saved — Ready to Share',exact:true}).waitFor();
  const original=await page.locator('#share-url').inputValue();
  const firstUpdated=payload(original)[5];
  assert.ok(Date.parse(firstUpdated)>=Date.parse(createdAt));
  assert.deepEqual(payload(original).slice(3),['John',createdAt,firstUpdated]);
  assert.equal(await page.locator('.share-creator .creator-name').textContent(),'Created By John');
  assert.equal(await page.locator('.share-creator time.creation-date').getAttribute('datetime'),createdAt);
  assert.equal(await page.locator('.share-creator time.updated-date').getAttribute('datetime'),firstUpdated);
  assert.equal(await page.locator('.share-creator time.creation-date').textContent(),`Date Created: ${dateText}`);
  await fits(page);await closeDialog(page);
  assert.equal((await savedSets(page))[0].set.createdAt,createdAt);
  assert.equal(await page.locator('.saved-row time.creation-date').getAttribute('datetime'),createdAt);
  await page.reload();await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.equal(await page.locator('#class-created-at').inputValue(),dateText);
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).tap();
  assert.equal(await page.locator('#share-url').inputValue(),original,'Viewing and sharing leave both metadata dates unchanged');
  await closeDialog(page);
  assert.equal(await save(page),original,'Saving without changes keeps the original update date and share link');
  await closeDialog(page);
  await page.locator('#class-title').fill('Updated Evening Prayers');
  const revised=await save(page,'OCIA Team');
  assert.notEqual(revised,original);
  const revisedUpdated=payload(revised)[5];
  assert.ok(Date.parse(revisedUpdated)>Date.parse(firstUpdated),'Editing updates the last-updated timestamp');
  assert.deepEqual(payload(revised).slice(3),['OCIA Team',createdAt,revisedUpdated]);
  assert.equal((await savedSets(page))[0].set.createdAt,createdAt,'Renaming and editing preserve the original creation time');
  await closeDialog(page);
  await page.getByRole('button',{name:'New Prayer Set',exact:true}).tap();
  await page.getByRole('button',{name:'Start New Prayer Set',exact:true}).tap();
  assert.equal(await page.locator('#class-title').inputValue(),'My Prayer Set');
  const newer=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).createdAt);
  assert.ok(Date.parse(newer)>Date.parse(createdAt),'A new draft receives its own creation date');
  const learner=await phone(browser);await learner.goto(original);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.session-name').textContent(),'Evening Prayers');
  assert.equal(await learner.locator('.class-creator .creator-name').textContent(),'Created By John');
  assert.equal(await learner.locator('.class-creator time.creation-date').getAttribute('datetime'),createdAt);
  assert.equal(await learner.locator('.class-creator time.updated-date').getAttribute('datetime'),firstUpdated);
  assert.equal((await savedSets(learner))[0].set.createdAt,createdAt);
  await learner.reload();await learner.locator('#reader-title').waitFor();
  assert.equal((await savedSets(learner)).length,1);
  assert.equal((await savedSets(learner))[0].set.createdAt,createdAt);
  assert.equal((await savedSets(learner))[0].set.updatedAt,firstUpdated,'Reading, importing and reloading preserve the shared update date');
  await fits(learner);await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await learner.getByRole('button',{name:'My Prayers',exact:true}).tap();
  assert.equal(await learner.locator('.saved-row time.creation-date').getAttribute('datetime'),createdAt);
  await page.close();await learner.close();
}));


test('calendar-only creation and update dates display the same day across timezones and only edits change Last Updated',()=>run(async browser=>{
  const set={version:1,title:'OCIA Class',ids:['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima'],createdBy:'Rhoda',createdAt:'2026-10-13',updatedAt:'2026-10-13'};
  for(const timezoneId of ['America/Los_Angeles','Pacific/Kiritimati']){
    const page=await phone(browser,{timezoneId});
    await page.addInitScript(value=>{if(!localStorage.getItem('ocia-draft'))localStorage.setItem('ocia-draft',JSON.stringify(value));},set);
    await prepare(page);
    assert.equal(await page.locator('#class-created-at').inputValue(),'October 13, 2026');
    assert.equal(await page.locator('#class-updated-at').inputValue(),'October 13, 2026');
    const original=await save(page);
    assert.deepEqual(payload(original),[1,'OCIA Class',set.ids,'Rhoda','2026-10-13','2026-10-13']);
    assert.equal(await page.locator('.share-creator time.creation-date').textContent(),'Date Created: October 13, 2026');
    assert.equal(await page.locator('.share-creator time.updated-date').textContent(),'Last Updated: October 13, 2026');
    await closeDialog(page);
    await page.getByRole('button',{name:'Preview',exact:true}).tap();
    assert.equal(await page.locator('.class-creator time.updated-date').getAttribute('datetime'),'2026-10-13');
    await page.getByRole('button',{name:'Next',exact:true}).tap();
    await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
    const viewed=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
    assert.equal(viewed.createdAt,'2026-10-13');assert.equal(viewed.updatedAt,'2026-10-13');
    await page.locator('#class-title').fill('Edited Prayers');
    const edited=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
    assert.equal(edited.createdAt,'2026-10-13');
    assert.match(edited.updatedAt,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.equal(new Date(edited.updatedAt).toISOString(),edited.updatedAt);
    assert.equal((await savedSets(page))[0].set.updatedAt,'2026-10-13','Editing a draft does not rewrite the saved snapshot');
    await page.getByRole('button',{name:'Share QR for OCIA Class',exact:true}).tap();
    assert.equal(await page.locator('#share-url').inputValue(),original,'Previously shared metadata stays unchanged');
    await fits(page);await page.close();
  }
}));

test('editing a legacy prayer set adds Last Updated without inventing a creation date',()=>run(async browser=>{
  const page=await phone(browser);
  await page.addInitScript(()=>localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Old Prayer Set',ids:['ourFather']})));
  await prepare(page);
  assert.equal(await page.locator('#class-created-at, #class-updated-at').count(),0);
  await page.locator('#class-title').fill('Renamed Prayer Set');
  const edited=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  assert.equal(edited.createdAt,undefined);
  assert.equal(new Date(edited.updatedAt).toISOString(),edited.updatedAt);
  assert.equal(await page.locator('#class-created-at').count(),0);
  assert.equal(await page.locator('#class-updated-at').isVisible(),true);
  const link=await save(page);
  assert.deepEqual(payload(link),[1,'Renamed Prayer Set',['ourFather'],'','',edited.updatedAt]);
  assert.equal(await page.locator('.share-creator time.creation-date').count(),0);
  assert.equal(await page.locator('.share-creator time.updated-date').getAttribute('datetime'),edited.updatedAt);
  await page.close();
}));
