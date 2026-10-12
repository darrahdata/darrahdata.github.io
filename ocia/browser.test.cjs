const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
const options=engine===chromium?{channel:'chrome'}:{};
async function browserTest(run){const browser=await engine.launch(options);try{await run(browser);}finally{await browser.close();}}
async function open(page){await page.goto(base);await page.getByRole('button',{name:'Pray together',exact:true}).waitFor();}
async function openClass(page){
  await page.getByRole('button',{name:'My Class',exact:true}).click();
  const prepare=page.getByRole('button',{name:'Prepare a class',exact:true});
  if(await prepare.isVisible())await prepare.click();
}
async function saveClass(page,name){
  const title=await page.locator('#class-title').inputValue();
  await page.getByRole('button',{name:'Save set',exact:true}).click();
  await page.locator('#saved-set-name').waitFor();
  assert.equal(await page.locator('#dialog-title').textContent(),'Save your class set');
  if(title.trim())assert.equal(await page.getByRole('textbox',{name:'Set name',exact:true}).inputValue(),title.trim());
  if(name!==undefined)await page.locator('#saved-set-name').fill(name);
  await page.getByRole('dialog').getByRole('button',{name:'Save set',exact:true}).click();
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='save');
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page should scroll horizontally');}

test('mobile and desktop navigation, all mystery sets, long creed and safe bottom dock',()=>browserTest(async browser=>{
  for(const [width,height] of [[320,700],[360,780],[390,844],[430,932],[768,1024],[1280,900]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await open(page);await noOverflow(page);
    await page.getByRole('button',{name:'Mysteries',exact:true}).click();
    for(const name of ['Joyful','Luminous','Sorrowful','Glorious']){
      await page.locator('.chapter').filter({hasText:name}).click();
      assert.equal(await page.locator('.prayer-row').count(),5);
      await page.getByRole('button',{name:'Reflect on all five',exact:true}).click();
      for(let i=0;i<5;i++){
        await page.locator('.mystery-image').evaluate(img=>img.decode());
        assert.ok(await page.locator('.mystery-image').evaluate(img=>img.naturalWidth>0));
        await noOverflow(page);
        await page.getByRole('button',{name:i===4?'Finish':'Next',exact:true}).click();
      }
      assert.equal(await page.locator('h1').textContent(),'A moment to be still.');
      await page.getByRole('button',{name:'Return to library',exact:true}).click();
      await page.getByRole('button',{name:'All mysteries',exact:true}).click();
    }
    await page.getByRole('button',{name:'Prayers',exact:true}).click();
    await page.locator('[data-action="read-item"][data-id="niceneCreed"]').click();
    await page.getByRole('button',{name:'Reading settings',exact:true}).click();
    await page.locator('#text-size').selectOption('1.75');await page.keyboard.press('Escape');
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await noOverflow(page);
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top));
    await page.setViewportSize({width:height,height:width});await noOverflow(page);
    await page.getByRole('button',{name:'Close prayer and save place',exact:true}).click();
    await page.getByRole('button',{name:'The Mass',exact:true}).click();
    assert.equal(await page.locator('.mass-section').count(),4);
    await page.getByText('Profession of faith',{exact:true}).click();await noOverflow(page);
    assert.match(await page.locator('.notice').textContent(),/not a complete worship aid/);
    assert.deepEqual(errors,[]);await context.close();
  }
}));

test('instructor ordering, immutable shared links, reading, resume and completion',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await open(page);
  await openClass(page);
  await page.locator('#class-title').fill('María’s OCIA class');await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Add prayer or mystery',exact:true}).click();
  await page.locator('#picker-search').fill('Annunciation');
  await page.locator('#picker-results button').click();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Move The Annunciation earlier',exact:true}).click();
  await page.getByRole('combobox',{name:'Repetitions of Our Father',exact:true}).selectOption('2');
  assert.equal(await page.locator('.step').count(),6);
  assert.match(await page.locator('.builder-tools').textContent(),/7 \/ 32 pages/);
  await saveClass(page);
  await page.reload();await page.getByRole('button',{name:'My Class',exact:true}).click();
  assert.equal(await page.locator('#class-title').inputValue(),'María’s OCIA class');
  await saveClass(page);assert.equal(await page.locator('.saved-row').count(),1);
  await page.getByRole('button',{name:'Share class',exact:true}).click();
  const link=await page.locator('#share-url').inputValue();assert.ok(link.includes('#class='));
  assert.equal(await page.locator('.qr svg').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'share');
  await page.locator('#class-title').fill('Changed later');
  const learner=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
  await learner.goto(link);await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('.session-title').textContent(),'María’s OCIA class');
  assert.equal(await learner.locator('#reader-title').textContent(),'Sign of the Cross');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  await learner.reload();await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('#reader-title').textContent(),'Come, Holy Spirit');
  await learner.getByRole('button',{name:'Contents',exact:true}).click();
  await learner.locator('[data-action="jump"][data-index="4"]').click();
  assert.equal(await learner.locator('#reader-title').textContent(),'Glory Be');
  await learner.getByRole('button',{name:'Close prayer and save place',exact:true}).click();
  await learner.reload();await learner.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await learner.locator('#reader-title').textContent(),'Glory Be');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  assert.equal(await learner.locator('#reader-title').textContent(),'The Annunciation');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  await learner.getByRole('button',{name:'Finish',exact:true}).click();
  assert.equal(await learner.locator('h1').textContent(),'A moment to be still.');
  await learner.close();await page.close();
}));

test('class repetition counts keep one row, persist, share and read every prayer in order',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});await open(page);await openClass(page);
  const draftIds=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
  await page.locator('#class-title').fill('A decade together');
  await page.getByRole('button',{name:'Add prayer or mystery',exact:true}).click();
  assert.equal(await page.getByRole('combobox',{name:'Repetitions',exact:true}).inputValue(),'1');
  for(const [id,name,count] of [['ourFather','Our Father',1],['hailMary','Hail Mary',10],['gloryBe','Glory Be',1]]){
    await page.locator('#picker-count').selectOption(String(count));
    await page.locator('#picker-search').fill(name);
    await noOverflow(page);
    await page.locator(`#picker-results [data-action="add"][data-id="${id}"]`).click();
  }
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const expected=['ourFather',...Array(10).fill('hailMary'),'gloryBe'];
  assert.deepEqual(await draftIds(),expected);
  assert.equal(await page.locator('.step').count(),3);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'10');
  assert.equal(await page.getByRole('button',{name:/^Repeat /}).count(),0);
  assert.match(await page.locator('.builder-tools').textContent(),/12 \/ 32 pages/);
  await noOverflow(page);
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('2');
  assert.deepEqual(await draftIds(),['ourFather','hailMary','hailMary','gloryBe']);
  await page.reload();await openClass(page);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'2');
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('10');
  await saveClass(page);
  await page.getByRole('button',{name:'Share class',exact:true}).click();
  const link=await page.locator('#share-url').inputValue();
  const payload=JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8'));
  assert.deepEqual(payload,[1,'A decade together',expected]);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  const titles=[];
  for(let i=0;i<expected.length;i++){
    titles.push(await page.locator('#reader-title').textContent());
    assert.equal(await page.locator('.reader-progress > span').textContent(),`${i+1} of 12`);
    await noOverflow(page);
    await page.getByRole('button',{name:i===expected.length-1?'Finish':'Next',exact:true}).click();
  }
  assert.deepEqual(titles,['Our Father',...Array(10).fill('Hail Mary'),'Glory Be']);
  assert.equal(await page.locator('h1').textContent(),'A moment to be still.');
  await page.getByRole('button',{name:'Return to library',exact:true}).click();
  await page.getByRole('button',{name:'Move Hail Mary earlier',exact:true}).click();
  assert.deepEqual(await draftIds(),[...Array(10).fill('hailMary'),'ourFather','gloryBe']);
  assert.equal(await page.locator('.step').count(),3);
  assert.equal(await page.getByRole('button',{name:'Move Hail Mary earlier',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Move Hail Mary later',exact:true}).click();
  assert.deepEqual(await draftIds(),expected);
  await page.getByRole('button',{name:'Remove Hail Mary',exact:true}).click();
  assert.deepEqual(await draftIds(),['ourFather','gloryBe']);
  assert.equal(await page.locator('.step').count(),2);
  await page.locator('.saved-row [data-action="load"]').click();
  assert.deepEqual(await draftIds(),expected);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'10');
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Add prayer or mystery',exact:true}).click();
  await page.locator('#picker-search').fill('Our Father');
  await page.locator('#picker-results [data-action="add"][data-id="ourFather"]').click();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('.saved-row [data-action="load"]').click();
  assert.deepEqual(await draftIds(),expected,'Editing a draft must not change the saved copy');
  const learner=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
  await learner.goto(link);await learner.locator('#reader-title').waitFor();
  await learner.getByRole('button',{name:'Contents',exact:true}).click();
  assert.equal(await learner.locator('[data-action="jump"]').count(),12);
  assert.equal(await learner.locator('[data-action="jump"]').filter({hasText:'Hail Mary'}).count(),10);
  await noOverflow(learner);await learner.close();await page.close();
}));

test('repetitions respect the 32-page limit on narrow and desktop screens',()=>browserTest(async browser=>{
  for(const [width,height] of [[320,700],[1280,900]]){
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    await page.addInitScript(()=>{
      localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Nearly full class',ids:['ourFather',...Array(30).fill('hailMary')]}));
      localStorage.setItem('ocia-builder-open','true');
    });
    await open(page);await openClass(page);
    const draftIds=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
    const counts=label=>page.getByRole('combobox',{name:label,exact:true}).locator('option').evaluateAll(options=>options.map(option=>Number(option.value)));
    assert.deepEqual(await counts('Repetitions of Our Father'),[1,2]);
    assert.deepEqual(await counts('Repetitions of Hail Mary'),Array.from({length:31},(_,i)=>i+1));
    await noOverflow(page);
    await page.getByRole('button',{name:'Add prayer or mystery',exact:true}).click();
    assert.deepEqual(await counts('Repetitions'),[1]);
    await page.locator('#picker-search').fill('Glory Be');
    await page.locator('#picker-results [data-action="add"][data-id="gloryBe"]').click();
    await noOverflow(page);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    assert.equal((await draftIds()).length,32);
    assert.equal(await page.locator('.step').count(),3);
    assert.deepEqual(await counts('Repetitions of Our Father'),[1]);
    assert.deepEqual(await counts('Repetitions of Hail Mary'),Array.from({length:30},(_,i)=>i+1));
    await page.locator('#starter').selectOption('opening');
    assert.equal((await draftIds()).length,32);
    await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('28');
    assert.equal((await draftIds()).length,30);
    await page.getByRole('button',{name:'Add prayer or mystery',exact:true}).click();
    assert.deepEqual(await counts('Repetitions'),[1,2]);
    await page.locator('#picker-count').selectOption('2');
    await page.locator('#picker-search').fill('Glory Be');
    await page.locator('#picker-results [data-action="add"][data-id="gloryBe"]').click();
    await page.getByRole('button',{name:'Close',exact:true}).click();
    assert.equal((await draftIds()).length,32);
    assert.equal(await page.locator('.step').count(),3);
    assert.equal(await page.getByRole('combobox',{name:'Repetitions of Glory Be',exact:true}).inputValue(),'3');
    await noOverflow(page);await page.close();
  }
}));

test('separated repetitions stay distinct and merge only when moved together',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    localStorage.setItem('ocia-draft',JSON.stringify({version:1,title:'Separate decades',ids:['hailMary','hailMary','ourFather','hailMary','hailMary','hailMary','gloryBe']}));
    localStorage.setItem('ocia-builder-open','true');
  });
  await open(page);await openClass(page);
  const draftIds=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
  assert.equal(await page.locator('.step').count(),4);
  const hailMaryCounts=page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true});
  assert.equal(await hailMaryCounts.nth(0).inputValue(),'2');
  assert.equal(await hailMaryCounts.nth(1).inputValue(),'3');
  await hailMaryCounts.nth(1).selectOption('4');
  assert.deepEqual(await draftIds(),['hailMary','hailMary','ourFather',...Array(4).fill('hailMary'),'gloryBe']);
  await page.getByRole('button',{name:'Move Hail Mary earlier',exact:true}).nth(1).click();
  assert.deepEqual(await draftIds(),[...Array(6).fill('hailMary'),'ourFather','gloryBe']);
  assert.equal(await page.locator('.step').count(),3);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'6');
  await page.getByRole('button',{name:'Remove Hail Mary',exact:true}).click();
  assert.deepEqual(await draftIds(),['ourFather','gloryBe']);
  await noOverflow(page);await page.close();
}));

test('invalid links, hostile titles, modal focus and keyboard navigation are safe',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(base+'#class=broken');await page.getByRole('dialog').waitFor();
  assert.match(await page.locator('#dialog-title').textContent(),/could not open/);
  await page.keyboard.press('Escape');await openClass(page);
  await page.locator('#class-title').fill('<img src=x onerror=alert(1)>');await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  assert.equal(await page.locator('.session-title img').count(),0);
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#reader-title').textContent(),'Come, Holy Spirit');
  await page.getByRole('button',{name:'Contents',exact:true}).click();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#reader-title').textContent(),'Come, Holy Spirit');
  for(let i=0;i<12;i++)await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),true);
  await page.keyboard.press('Escape');await page.keyboard.press('ArrowRight');
  // The focused Contents control keeps arrow keys from changing pages.
  assert.equal(await page.locator('#reader-title').textContent(),'Come, Holy Spirit');
  await page.close();
}));

test('blocked storage does not prevent praying or sharing',()=>browserTest(async browser=>{
  const page=await browser.newPage();
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked');};Storage.prototype.setItem=()=>{throw Error('blocked');};});
  await open(page);await page.getByRole('button',{name:'Pray together',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('#reader-title').textContent(),'Our Father');
  await page.getByRole('button',{name:'Close prayer and save place',exact:true}).click();
  await openClass(page);await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Share class',exact:true}).click();assert.equal(await page.locator('.qr svg').count(),1);await page.close();
}));

test('read-aloud stops on navigation and stale callbacks cannot affect the current prayer',()=>browserTest(async browser=>{
  const page=await browser.newPage();
  await page.addInitScript(()=>{
    window.spoken=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],speak:value=>window.spoken.push(value),cancel:()=>{}}});
  });
  await open(page);await page.getByRole('button',{name:'Pray together',exact:true}).click();
  await page.getByRole('button',{name:'Read aloud',exact:true}).click();
  assert.match(await page.evaluate(()=>spoken[0].text),/In the name of the Father/);
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:'Read aloud',exact:true}).click();
  await page.evaluate(()=>{spoken[0].onend();spoken[0].onerror();});
  assert.equal(await page.locator('#audio-button').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#reader-title').textContent(),'Our Father');
  await page.getByRole('button',{name:'Close prayer and save place',exact:true}).click();
  await page.evaluate(()=>spoken[1].onend());assert.ok(await page.getByRole('button',{name:'Pray together',exact:true}).isVisible());await page.close();
}));

test('students browse without editing controls; saved sets use a date or chosen name',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700}});await open(page);
  assert.equal(await page.locator('.brand').textContent(),'OCIA');
  assert.equal(await page.locator('[data-action="add"]').count(),0);
  await page.locator('[data-action="read-item"][data-id="cross"] svg').click();
  assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await page.getByRole('button',{name:'Close prayer and save place',exact:true}).click();
  await page.getByRole('button',{name:'Mysteries',exact:true}).click();
  await page.locator('.chapter').first().click();
  assert.equal(await page.locator('[data-action="add"], [data-action="add-mysteries"]').count(),0);
  await page.getByRole('button',{name:'My Class',exact:true}).click();
  assert.equal(await page.locator('#class-title').count(),0);
  await page.getByRole('button',{name:'Prepare a class',exact:true}).click();
  const first=await page.locator('#class-title').inputValue();assert.match(first,/^[A-Za-z]+ \d{1,2}, \d{4}$/);
  await page.reload();await openClass(page);
  assert.equal(await page.locator('#class-title').inputValue(),first);
  await page.locator('#starter').selectOption('opening');
  await saveClass(page);
  assert.ok((await page.locator('.saved-row').textContent()).includes(first));
  await saveClass(page,'Tuesday OCIA');
  assert.equal(await page.locator('#class-title').inputValue(),'Tuesday OCIA');
  assert.equal(await page.locator('.saved-row').count(),1);
  await page.reload();await openClass(page);
  assert.equal(await page.locator('#class-title').inputValue(),'Tuesday OCIA');
  await page.getByRole('button',{name:'Save set',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Set name',exact:true}).inputValue(),'Tuesday OCIA');
  await page.locator('#saved-set-name').fill('Cancelled name');await noOverflow(page);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.locator('#class-title').inputValue(),'Tuesday OCIA');
  assert.match(await page.locator('.saved-row').textContent(),/Tuesday OCIA/);
  assert.doesNotMatch(await page.locator('.saved-row').textContent(),/Cancelled name/);
  assert.equal(await page.locator('.saved-row').count(),1);
  await saveClass(page);
  assert.equal(await page.locator('.saved-row').count(),1);
  await page.getByRole('button',{name:'New set',exact:true}).click();
  await page.getByRole('button',{name:'Start new set',exact:true}).click();
  assert.match(await page.locator('#class-title').inputValue(),/^[A-Za-z]+ \d{1,2}, \d{4}$/);
  assert.match(await page.locator('.saved-row').textContent(),/Tuesday OCIA/);
  await page.getByRole('button',{name:'Class overview',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'My Class',exact:true}).click();
  assert.equal(await page.locator('#class-title').count(),0);await page.close();
}));

test('Mass guide starts collapsed, opens inline, changes only the chosen form, and fits small screens',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700}});await open(page);
  await page.getByRole('button',{name:'The Mass',exact:true}).click();
  assert.equal(await page.locator('.mass-part').count(),14);
  assert.equal(await page.locator('.mass-part[open]').count(),0);
  await page.getByRole('link',{name:'3. We give thanks',exact:true}).click();
  assert.equal(new URL(page.url()).hash,'#mass-offer');
  assert.equal(await page.locator('button[data-view="mass"]').getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('link',{name:/Official Mass guide/}).count(),0);
  assert.match(await page.locator('#mass-part-universal .mass-prayer').first().textContent(),/Lord, hear our prayer/);
  assert.match(await page.locator('#mass-part-gloria .mass-prayer').textContent(),/Glory to God in the highest/);
  assert.match(await page.locator('#mass-form-creed .mass-prayer').textContent(),/consubstantial/);
  await page.locator('#mass-part-creed summary').click();
  await page.locator('#mass-choice-creed').selectOption('apostles');
  assert.match(await page.locator('#mass-form-creed .mass-prayer').textContent(),/communion of saints/);
  assert.doesNotMatch(await page.locator('#mass-form-creed').textContent(),/consubstantial/);
  assert.equal(await page.locator('#mass-part-creed').evaluate(el=>el.open),true);
  assert.equal(await page.locator('#mass-part-gloria').evaluate(el=>el.open),false);
  await page.locator('#mass-part-penitential summary').click();
  assert.equal(await page.locator('#mass-form-penitential .mass-pending').count(),0);
  assert.match(await page.locator('#mass-form-penitential .mass-prayer').first().innerText(),/I confess to the Almighty God/);
  assert.match(await page.locator('#mass-form-penitential .mass-prayer').first().innerText(),/\(Tap your chest\.\)/);
  assert.match(await page.locator('#mass-form-penitential .mass-prayer').first().innerText(),/Lord our God\. Amen\.$/);
  assert.doesNotMatch(await page.locator('#mass-part-lords-prayer .mass-prayer').textContent(),/Amen\.$/);
  for(const select of await page.locator('[data-mass-option]').all()){
    const part=select.locator('..');
    if(!await part.evaluate(el=>el.open))await part.locator('summary').click();
    for(const value of await select.locator('option').evaluateAll(options=>options.map(option=>option.value))){
      await select.selectOption(value);await noOverflow(page);
    }
  }
  await page.getByRole('button',{name:'Prayers',exact:true}).click();
  assert.equal(await page.locator('details[open]').count(),0);
  await page.getByRole('button',{name:'The Mass',exact:true}).click();
  assert.equal(await page.locator('.mass-part[open]').count(),0);
  await page.reload();
  await page.getByRole('button',{name:'The Mass',exact:true}).click();
  assert.equal(await page.locator('.mass-part[open]').count(),0);
  await page.getByRole('button',{name:'Prayers',exact:true}).click();
  await page.locator('[data-action="read-item"][data-id="ourFather"]').click();
  assert.match(await page.locator('#prayer-text').textContent(),/Amen\.$/);await page.close();
}));
