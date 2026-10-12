const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
async function run(check){const browser=await engine.launch(engine===chromium?{channel:'chrome'}:{});try{await check(browser);}finally{await browser.close();}}
async function phone(browser){return browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});}
async function fits(page){assert.deepEqual(await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth})),{viewport:320,page:320},'Creator names must fit the phone without zooming out');}
function payload(link){return JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8'));}
async function prepare(page){
  await page.goto(base);await page.getByRole('button',{name:'My Class',exact:true}).tap();
  const button=page.getByRole('button',{name:'Prepare a Class',exact:true});
  if(await button.isVisible())await button.tap();
  await page.locator('#class-creator').waitFor();
}
async function savedSets(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-sets')||'[]'));}
async function closeDialog(page){await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();}
async function save(page,creator){
  await page.getByRole('button',{name:'Save Set',exact:true}).tap();
  await page.locator('#saved-set-creator').waitFor();
  if(creator!==undefined)await page.locator('#saved-set-creator').fill(creator);
  await page.getByRole('dialog').getByRole('button',{name:'Save Set',exact:true}).tap();
  await page.getByRole('heading',{name:'Class Saved — Ready to Share',exact:true}).waitFor();
  return page.locator('#share-url').inputValue();
}

test('Created By is optional and blank values preserve legacy class links exactly',()=>run(async browser=>{
  const page=await phone(browser);await prepare(page);
  assert.equal(await page.locator('#class-creator').inputValue(),'');
  assert.equal(await page.locator('#class-creator').getAttribute('required'),null);
  await page.locator('#class-title').fill('Optional Creator');await page.locator('#starter').selectOption('opening');
  await page.locator('#class-creator').fill('   ');
  const link=await save(page,'   ');
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  assert.deepEqual(payload(link),[1,'Optional Creator',draft.ids]);
  assert.equal(new URL(link).hash,'#class='+Buffer.from(JSON.stringify([1,'Optional Creator',draft.ids])).toString('base64url'));
  assert.equal(await page.locator('.share-creator').count(),0);await fits(page);
  const learner=await phone(browser);await learner.goto(link);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator').count(),0);
  assert.equal((await savedSets(learner)).length,1);
  assert.equal((await savedSets(learner))[0].set.createdBy,undefined);
  await fits(learner);await page.close();await learner.close();
}));

test('creator attribution persists, auto-saves for learners, and edited links retain their original creators',()=>run(async browser=>{
  const page=await phone(browser);await prepare(page);
  await page.locator('#class-title').fill('Tuesday OCIA');await page.locator('#starter').selectOption('opening');
  await page.locator('#class-creator').fill('John');await page.reload();
  await page.getByRole('button',{name:'My Class',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),'John');
  await page.getByRole('button',{name:'Save Set',exact:true}).tap();
  assert.equal(await page.locator('#saved-set-creator').inputValue(),'John');
  await page.locator('#saved-set-creator').fill('  María & John  ');
  await page.getByRole('dialog').getByRole('button',{name:'Save Set',exact:true}).tap();
  await page.locator('.share-creator').waitFor();
  assert.equal(await page.locator('.share-creator').textContent(),'Created By María & John');
  const original=await page.locator('#share-url').inputValue();
  assert.equal(payload(original)[3],'María & John');await fits(page);await closeDialog(page);
  assert.equal(await page.locator('#class-creator').inputValue(),'María & John');
  assert.equal((await savedSets(page))[0].set.createdBy,'María & John');
  await page.reload();await page.getByRole('button',{name:'My Class',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),'María & John');
  await page.locator('#class-creator').fill('OCIA Team');
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).tap();
  const revised=await page.locator('#share-url').inputValue();
  assert.notEqual(revised,original);assert.deepEqual(payload(revised),[...payload(original).slice(0,3),'OCIA Team']);
  assert.equal((await savedSets(page))[0].set.createdBy,'María & John','Editing a draft does not mutate its saved snapshot');
  const learner=await phone(browser);await learner.goto(original);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator').textContent(),'Created By María & John');
  assert.equal((await savedSets(learner))[0].set.createdBy,'María & John');
  await learner.reload();await learner.locator('#reader-title').waitFor();assert.equal((await savedSets(learner)).length,1);
  await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await learner.getByRole('button',{name:'My Class',exact:true}).tap();
  assert.match(await learner.locator('.saved-row').textContent(),/Created By María & John/);await fits(learner);
  await learner.goto(revised);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator').textContent(),'Created By OCIA Team');
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
  await page.getByRole('button',{name:'My Class',exact:true}).tap();
  assert.equal(await page.locator('#class-creator').inputValue(),hostile);
  const link=await save(page);
  assert.equal(await page.locator('.share-creator').textContent(),'Created By '+hostile);
  assert.equal(await page.locator('.share-creator img').count(),0);assert.equal(payload(link)[3],hostile);await fits(page);
  const learner=await phone(browser);await learner.goto(link);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.class-creator').textContent(),'Created By '+hostile);
  assert.equal(await learner.locator('.class-creator img').count(),0);
  assert.equal(await learner.evaluate(()=>window.creatorInjected),undefined);await fits(learner);
  await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await learner.getByRole('button',{name:'My Class',exact:true}).tap();
  assert.ok((await learner.locator('.saved-row').textContent()).includes('Created By '+hostile));
  assert.equal(await learner.locator('.saved-row img').count(),0);await fits(learner);
  await page.close();await learner.close();
}));
