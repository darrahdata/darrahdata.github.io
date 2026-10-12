const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const rosaryReference=require('node:fs').readFileSync(require('node:path').join(__dirname,'../rosary-v2/index.html'),'utf8');
const canonicalMysteries=[...rosaryReference.matchAll(/\{type:'(?:First|Second|Third|Fourth|Fifth) (Joyful|Sorrowful|Luminous|Glorious) Mystery',name:'([^']+)',scripture:'([^']+)',citation:'([^']+)',image:'[^']+'\}/g)].map(([,set,title,scripture,citation])=>({set,title,scripture,citation}));
const base=process.env.OCIA_URL||'http://127.0.0.1:8080/ocia/';
const engine=process.env.OCIA_BROWSER==='webkit'?webkit:chromium;
const options=engine===chromium?{channel:'chrome'}:{};
async function browserTest(run){const browser=await engine.launch(options);try{await run(browser);}finally{await browser.close();}}
async function landingReady(page){await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();}
async function prayers(page){await page.getByRole('button',{name:'Prayers',exact:true}).click();await page.getByRole('button',{name:'Pray Together',exact:true}).waitFor();}
async function open(page){await page.goto(base,{waitUntil:'domcontentloaded'});await landingReady(page);await prayers(page);}
async function beginPrayerSet(page,title){
  await page.getByRole('button',{name:'Begin Prayer',exact:true}).waitFor();
  assert.equal(await page.locator('#reader-title').textContent(),title);
  await page.getByRole('button',{name:'Begin Prayer',exact:true}).click();
}
async function openClass(page){
  await page.getByRole('button',{name:'My Prayers',exact:true}).click();
  const prepare=page.getByRole('button',{name:'Create Prayer Set',exact:true});
  if(await prepare.isVisible())await prepare.click();
}
async function saveClass(page,name){
  const title=await page.locator('#class-title').inputValue();
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).click();
  await page.locator('#saved-set-name').waitFor();
  assert.equal(await page.locator('#dialog-title').textContent(),'Save Your Prayer Set');
  if(title.trim())assert.equal(await page.getByRole('dialog').getByRole('textbox',{name:'Prayer Set Name',exact:true}).inputValue(),title.trim());
  if(name!==undefined)await page.locator('#saved-set-name').fill(name);
  await page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true}).click();
  await page.getByRole('heading',{name:'Prayer Set Saved — Ready to Share',exact:true}).waitFor();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  assert.equal(await page.locator('.share-caption').textContent(),`${saved.title} · ${saved.ids.length} Pages`);
  assert.equal(await page.locator('.qr svg').count(),1);
  const link=await page.locator('#share-url').inputValue();
  const expected=[1,saved.title,saved.ids];
  if(saved.updatedAt)expected.push(saved.createdBy||'',saved.createdAt||'',saved.updatedAt);
  else if(saved.createdAt)expected.push(saved.createdBy||'',saved.createdAt);
  else if(saved.createdBy)expected.push(saved.createdBy);
  assert.deepEqual(JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8')),expected);
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
  await page.waitForFunction(()=>document.activeElement?.dataset.action==='share');
  return link;
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page should scroll horizontally');}
async function beads(page,total,current){
  assert.equal(await page.locator('.repeat-beads').getAttribute('aria-hidden'),'true','The numeric count supplies the accessible progress');
  const states=await page.locator('.repeat-beads .prayer-bead').evaluateAll(elements=>elements.map(el=>({done:el.classList.contains('done'),current:el.classList.contains('current')})));
  assert.deepEqual(states,Array.from({length:total},(_,index)=>({done:index<current-1,current:index===current-1})));
  assert.equal(await page.locator('.repeat-progress').textContent(),`${current} of ${total}`);
}

test('mobile and desktop navigation, all mystery sets, long creed and safe bottom dock',()=>browserTest(async browser=>{
  assert.equal(canonicalMysteries.length,20,'The reference contains all twenty scriptural mysteries');
  for(const [width,height] of [[320,700],[360,780],[390,844],[430,932],[768,1024],[1280,900]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await open(page);await noOverflow(page);
    for(const name of ['Daily Prayer','Other Prayers'])assert.equal(await page.getByRole('heading',{name,exact:true}).isVisible(),true);
    assert.equal(await page.locator('.primary-nav').getByRole('button',{name:'Mysteries',exact:true}).count(),0);
    assert.equal(await page.locator('.mystery-library').getByRole('heading',{name:'Mysteries of the Rosary',exact:true}).isVisible(),true);
    for(const name of ['Joyful','Luminous','Sorrowful','Glorious']){
      await page.locator('.chapter').filter({hasText:name}).click();
      assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
      assert.equal(await page.locator('.prayer-row').count(),5);
      const expectedMysteries=canonicalMysteries.filter(item=>item.set===name);
      assert.equal(expectedMysteries.length,5);
      await page.getByRole('button',{name:'Reflect on All Five',exact:true}).click();
      for(let i=0;i<5;i++){
        const expected=expectedMysteries[i];
        assert.equal(await page.locator('#reader-title').textContent(),expected.title);
        assert.equal(await page.locator('.mystery-scripture p').textContent(),expected.scripture);
        assert.equal(await page.locator('.mystery-scripture cite').textContent(),expected.citation);
        assert.equal(await page.locator('.mystery-scripture').evaluate(el=>el.tagName),'BLOCKQUOTE');
        assert.equal(await page.locator('#prayer-text, .desire, .reading-help, .reader-topline, .repeat-beads').count(),0,'Mystery pages show the source scripture and artwork without prayer beads or extra meditations');
        assert.equal(await page.locator('.mystery-image img').count(),1);
        assert.ok(await page.evaluate(()=>document.querySelector('.mystery-scripture').getBoundingClientRect().bottom<=document.querySelector('.mystery-image').getBoundingClientRect().top),'Scripture precedes the artwork');
        await page.locator('.mystery-image img').scrollIntoViewIfNeeded();
        await page.waitForFunction(()=>{const image=document.querySelector('.mystery-image img');return image.complete&&image.naturalWidth>0;});
        await noOverflow(page);
        await page.getByRole('button',{name:i===4?'Finish':'Next',exact:true}).click().catch(error=>{
          error.message+=`\nMystery Reader: ${width}×${height}, ${name}, Page ${i+1} of 5`;
          throw error;
        });
      }
      assert.equal(await page.locator('h1').textContent(),'Prayer Complete');
      await page.getByRole('button',{name:'Done',exact:true}).click();
      await page.getByRole('button',{name:'All Mysteries',exact:true}).click();
      assert.equal(await page.locator('.mystery-library .chapter').count(),4);
      assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
    }
    await page.getByRole('button',{name:'Prayers',exact:true}).click();
    await page.locator('[data-action="read-item"][data-id="niceneCreed"]').click();
    await page.addStyleTag({content:':root{font-size:175%}'});
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await noOverflow(page);
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top));
    await page.setViewportSize({width:height,height:width});await noOverflow(page);
    await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).click();
    await page.getByRole('button',{name:'The Mass',exact:true}).click();
    assert.equal(await page.locator('.mass-section').count(),4);
    const creed=page.getByRole('heading',{name:'Nicene Creed',exact:true});
    await creed.scrollIntoViewIfNeeded();await noOverflow(page);
    assert.ok(await creed.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Mass headings remain readable below navigation at enlarged text sizes');
    assert.deepEqual(errors,[]);await context.close();
  }
}));

test('instructor ordering, immutable shared links, reading, resume and completion',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await open(page);
  await openClass(page);
  await page.locator('#class-title').fill('María’s OCIA class');await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
  await page.locator('#picker-search').fill('Annunciation');
  await page.locator('#picker-results button').click();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Move The Annunciation Earlier',exact:true}).click();
  await page.getByRole('combobox',{name:'Repetitions of Our Father',exact:true}).selectOption('2');
  assert.equal(await page.locator('.step').count(),6);
  assert.match(await page.locator('.builder-tools').textContent(),/7 \/ 32 Pages/);
  await saveClass(page);
  await page.reload();await page.getByRole('button',{name:'My Prayers',exact:true}).click();
  assert.equal(await page.locator('#class-title').inputValue(),'María’s OCIA class');
  await saveClass(page);assert.equal(await page.locator('.saved-row').count(),1);
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).click();
  const link=await page.locator('#share-url').inputValue();assert.ok(link.includes('#class='));
  assert.equal(await page.locator('.qr svg').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.dataset.action),'share');
  await page.locator('#class-title').fill('Changed later');
  const learner=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
  await learner.goto(link);await learner.locator('#reader-title').waitFor();
  await beginPrayerSet(learner,'María’s OCIA class');
  assert.equal(await learner.locator('.session-name, .set-metadata').count(),0,'Prayer pages keep set information on the opening pane');
  assert.equal(await learner.locator('#reader-title').textContent(),'Sign of the Cross');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  await learner.reload();await learner.locator('#reader-title').waitFor();
  assert.equal(await learner.locator('#reader-title').textContent(),'Come, Holy Spirit');
  await learner.getByRole('button',{name:'Contents',exact:true}).click();
  await learner.locator('[data-action="jump"][data-index="4"]').click();
  assert.equal(await learner.locator('#reader-title').textContent(),'Glory Be');
  await learner.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).click();
  await learner.reload();await landingReady(learner);await prayers(learner);await learner.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await learner.locator('#reader-title').textContent(),'Glory Be');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  assert.equal(await learner.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
  await learner.getByRole('button',{name:'Next',exact:true}).click();
  await learner.getByRole('button',{name:'Finish',exact:true}).click();
  assert.equal(await learner.locator('h1').textContent(),'Prayer Complete');
  await learner.close();await page.close();
}));

test('class repetition counts keep one row, persist, share and read every prayer in order',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});await open(page);await openClass(page);
  const draftIds=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).ids);
  await page.locator('#class-title').fill('A decade together');
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
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
  assert.match(await page.locator('.builder-tools').textContent(),/12 \/ 32 Pages/);
  await noOverflow(page);
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('2');
  assert.deepEqual(await draftIds(),['ourFather','hailMary','hailMary','gloryBe']);
  await page.reload();await openClass(page);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'2');
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('10');
  await saveClass(page);
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).click();
  const link=await page.locator('#share-url').inputValue();
  const payload=JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url').toString('utf8'));
  const createdAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).createdAt);
  assert.match(createdAt,/^\d{4}-\d{2}-\d{2}T/);
  const updatedAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).updatedAt);
  assert.deepEqual(payload,[1,'A decade together',expected,'',createdAt,updatedAt]);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  await beginPrayerSet(page,'A decade together');
  const titles=[];
  for(let i=0;i<expected.length;i++){
    titles.push(await page.locator('#reader-title').textContent());
    assert.equal(await page.locator('.reader-progress > span').textContent(),`${i+1} of 12`);
    if(expected[i]==='hailMary')await beads(page,10,i);
    else assert.equal(await page.locator('.repeat-progress, .repeat-beads').count(),0,'Single prayers do not show repetition progress');
    await noOverflow(page);
    await page.getByRole('button',{name:i===expected.length-1?'Finish':'Next',exact:true}).click();
  }
  assert.deepEqual(titles,['Lord’s Prayer (Our Father)',...Array(10).fill('Hail Mary'),'Glory Be']);
  assert.equal(await page.locator('h1').textContent(),'Prayer Complete');
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await page.getByRole('button',{name:'Move Hail Mary Earlier',exact:true}).click();
  assert.deepEqual(await draftIds(),[...Array(10).fill('hailMary'),'ourFather','gloryBe']);
  assert.equal(await page.locator('.step').count(),3);
  assert.equal(await page.getByRole('button',{name:'Move Hail Mary Earlier',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Move Hail Mary Later',exact:true}).click();
  assert.deepEqual(await draftIds(),expected);
  await page.getByRole('button',{name:'Remove Hail Mary',exact:true}).click();
  assert.deepEqual(await draftIds(),['ourFather','gloryBe']);
  assert.equal(await page.locator('.step').count(),2);
  await page.locator('.saved-row [data-action="load"]').click();
  assert.deepEqual(await draftIds(),expected);
  assert.equal(await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).inputValue(),'10');
  await page.getByRole('combobox',{name:'Repetitions of Hail Mary',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
  await page.locator('#picker-search').fill('Our Father');
  await page.locator('#picker-results [data-action="add"][data-id="ourFather"]').click();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('.saved-row [data-action="load"]').click();
  assert.deepEqual(await draftIds(),expected,'Editing a draft must not change the saved copy');
  const learner=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
  await learner.goto(link);await learner.locator('#reader-title').waitFor();
  await beginPrayerSet(learner,'A decade together');
  await learner.getByRole('button',{name:'Contents',exact:true}).click();
  assert.equal(await learner.locator('[data-action="jump"]').count(),12);
  assert.equal(await learner.locator('[data-action="jump"]').filter({hasText:'Hail Mary'}).count(),10);
  await noOverflow(learner);await learner.close();await page.close();
}));

test('custom prayer sets open with separate title and creation details, then resume content without metadata',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'America/Los_Angeles'});
  const ids=['joyful-1','ourFather',...Array(10).fill('hailMary'),'gloryBe','fatima'];
  const set={version:1,title:'OCIA Class',ids,createdBy:'Rhoda',createdAt:'2026-10-13',updatedAt:'2026-10-13'};
  const link=base+'#class='+Buffer.from(JSON.stringify([1,set.title,ids,set.createdBy,set.createdAt,set.updatedAt])).toString('base64url');
  await page.goto(link);await page.getByRole('button',{name:'Begin Prayer',exact:true}).waitFor();
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  assert.match(await page.locator('.reader-intro .creator-name').textContent(),/^Created By:? Rhoda$/);
  assert.equal(await page.locator('.reader-intro time.creation-date').textContent(),'Date Created: October 13, 2026');
  assert.equal(await page.locator('.reader-intro time.creation-date').getAttribute('datetime'),set.createdAt);
  const lines=await page.locator('.reader-intro #reader-title, .reader-intro .creator-name, .reader-intro time.creation-date').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
  assert.equal(lines.length,3);
  assert.ok(lines[1].top>=lines[0].bottom&&lines[2].top>=lines[1].bottom,'The title, creator, and creation date each occupy their own line');
  assert.equal(await page.locator('.updated-date, #prayer-text, .reader-progress progress').count(),0);
  assert.doesNotMatch(await page.locator('main').textContent(),/Last Updated/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-resume')).index),-1);
  await noOverflow(page);
  await page.reload();await page.getByRole('button',{name:'Begin Prayer',exact:true}).waitFor();
  assert.equal(await page.locator('#reader-title').textContent(),set.title,'Reloading the opening pane preserves it');
  await beginPrayerSet(page,set.title);
  assert.equal(await page.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
  assert.equal(await page.locator('.reader-progress > span').textContent(),'1 of 14','The opening pane is not counted as a prayer');
  assert.equal(await page.locator('.session-name, .set-metadata').count(),0);
  await page.getByRole('button',{name:'Next',exact:true}).tap();
  await page.reload();await page.locator('#reader-title').waitFor();
  assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)','Reloading a prayer resumes that prayer');
  assert.equal(await page.getByRole('button',{name:'Begin Prayer',exact:true}).count(),0);
  assert.equal(await page.locator('.session-name, .set-metadata').count(),0);
  await page.getByRole('button',{name:'Previous',exact:true}).tap();
  await page.getByRole('button',{name:'Previous',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').textContent(),set.title);
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  assert.equal(await page.locator('[data-action="jump"]').count(),14);
  await page.locator('[data-action="jump"][data-index="3"]').tap();
  assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary');
  assert.equal(await page.locator('.repeat-progress').textContent(),'2 of 10');
  assert.equal(await page.getByRole('button',{name:'Begin Prayer',exact:true}).count(),0,'Contents opens the selected prayer directly');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-sets'))[0].set),set,'Viewing preserves both stored timestamps');
  await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).tap();
  await page.evaluate(()=>localStorage.removeItem('ocia-resume'));
  await page.reload();await landingReady(page);
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  await page.locator('[data-action="read-saved"]').tap();
  await beginPrayerSet(page,set.title);
  assert.equal(await page.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
  await page.close();
}));

test('prayer beads follow consecutive runs, Contents and resume, and wrap 32 repetitions at enlarged text',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const ids=['hailMary','hailMary','ourFather','hailMary','hailMary','hailMary','joyful-1','joyful-1'];
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'Separate Prayer Runs',ids])).toString('base64url');
  await page.goto(link);await beginPrayerSet(page,'Separate Prayer Runs');
  await beads(page,2,1);
  await page.getByRole('button',{name:'Next',exact:true}).tap();await beads(page,2,2);
  await page.getByRole('button',{name:'Next',exact:true}).tap();
  assert.equal(await page.locator('.repeat-beads, .repeat-progress').count(),0,'A single prayer breaks the bead sequence');
  await page.getByRole('button',{name:'Next',exact:true}).tap();await beads(page,3,1);
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  await page.locator('[data-action="jump"][data-index="5"]').tap();await beads(page,3,3);
  await page.reload();await page.locator('#reader-title').waitFor();await beads(page,3,3);
  await page.getByRole('button',{name:'Previous',exact:true}).tap();await beads(page,3,2);
  await page.getByRole('button',{name:'Next',exact:true}).tap();await beads(page,3,3);
  await page.getByRole('button',{name:'Next',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
  assert.equal(await page.locator('.repeat-progress').textContent(),'1 of 2');
  assert.equal(await page.locator('.repeat-beads').count(),0,'Repeated mystery pages never receive prayer beads');
  const longest=base+'#class='+Buffer.from(JSON.stringify([1,'Thirty-Two Prayers',Array(32).fill('hailMary')])).toString('base64url');
  await page.goto(longest);await beginPrayerSet(page,'Thirty-Two Prayers');
  await page.addStyleTag({content:':root{font-size:200%}'});
  await beads(page,32,1);await noOverflow(page);
  const positions=await page.locator('.repeat-beads .prayer-bead').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top};}));
  assert.ok(positions.every(position=>position.left>=0&&position.right<=320),'Every bead stays within the phone width');
  assert.ok(new Set(positions.map(position=>position.top)).size>1,'Long bead sequences wrap into readable rows');
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  await page.locator('[data-action="jump"][data-index="31"]').tap();await beads(page,32,32);
  await page.getByRole('button',{name:'Previous',exact:true}).tap();await beads(page,32,31);
  await noOverflow(page);await page.close();
}));

test('saved QR sharing preserves the current draft and downloads a PNG before and after reload',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});await open(page);await openClass(page);
  const title='10/13/2026 OCIA';
  const tenHailMarys=Array(10).fill('hailMary');
  const expected=['joyful-1','ourFather',...tenHailMarys,'gloryBe','fatima'];
  await page.locator('#class-title').fill(title);
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
  for(const [id,name,count] of [['joyful-1','Annunciation',1],['ourFather','Our Father',1],['hailMary','Hail Mary',10],['gloryBe','Glory Be',1],['fatima','Fatima',1]]){
    await page.locator('#picker-count').selectOption(String(count));
    await page.locator('#picker-search').fill(name);
    await page.locator(`#picker-results [data-action="add"][data-id="${id}"]`).click();
  }
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const savedLink=await saveClass(page);
  const createdAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).createdAt);
  assert.match(createdAt,/^\d{4}-\d{2}-\d{2}T/);
  const updatedAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).updatedAt);
  assert.deepEqual(JSON.parse(Buffer.from(new URL(savedLink).hash.slice(7),'base64url').toString('utf8')),[1,title,expected,'',createdAt,updatedAt]);
  await page.getByRole('button',{name:'New Prayer Set',exact:true}).click();
  await page.getByRole('button',{name:'Start New Prayer Set',exact:true}).click();
  await page.locator('#class-title').fill('An unfinished class');
  await page.locator('#starter').selectOption('opening');
  const currentDraft=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')));
  const savedSets=await page.evaluate(()=>localStorage.getItem('ocia-sets'));
  assert.equal(currentDraft.savedId,null);
  const currentSteps=await page.locator('.step').count();
  for(const reload of [false,true]){
    if(reload){await page.reload();await openClass(page);}
    const savedShare=page.getByRole('button',{name:`Share QR for ${title}`,exact:true});
    assert.equal(await savedShare.textContent(),'Share QR');
    await savedShare.click();
    assert.equal(await page.locator('#dialog-title').textContent(),'Share This Prayer Set');
    assert.equal(await page.locator('.share-caption').textContent(),`${title} · 14 Pages`);
    assert.equal(await page.locator('.qr svg').count(),1);
    assert.equal(await page.locator('#share-url').inputValue(),savedLink);
    assert.equal(await page.getByRole('button',{name:'Copy Link',exact:true}).isVisible(),true);
    assert.equal(await page.getByRole('button',{name:'Print',exact:true}).isVisible(),true);
    await noOverflow(page);
    if(!reload){
      const downloadEvent=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download QR',exact:true}).click();
      const download=await downloadEvent;
      assert.equal(await download.failure(),null);
      assert.equal(download.suggestedFilename(),'10-13-2026-ocia-qr.png');
      const stream=await download.createReadStream();
      const chunks=[];for await(const chunk of stream)chunks.push(chunk);
      const png=Buffer.concat(chunks);
      assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
      assert.ok(png.readUInt32BE(16)>=512,'The QR image should have enough resolution to share');
      assert.equal(png.readUInt32BE(16),png.readUInt32BE(20),'The QR image should be square');
    }
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(await page.locator('#class-title').inputValue(),'An unfinished class');
    assert.equal(await page.locator('.step').count(),currentSteps);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft'))),currentDraft);
    assert.equal(await page.evaluate(()=>localStorage.getItem('ocia-sets')),savedSets);
    await noOverflow(page);
  }
  await page.close();
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
    await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
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
    await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).click();
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
  await page.getByRole('button',{name:'Move Hail Mary Earlier',exact:true}).nth(1).click();
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
  assert.match(await page.locator('#dialog-title').textContent(),/Could Not Open/);
  await page.keyboard.press('Escape');await openClass(page);
  await page.locator('#class-title').fill('<img src=x onerror=alert(1)>');await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  assert.equal(await page.locator('#reader-title img').count(),0);
  await beginPrayerSet(page,'<img src=x onerror=alert(1)>');
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
  await open(page);await page.getByRole('button',{name:'Pray Together',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
  await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).click();
  await openClass(page);await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Share / QR Code',exact:true}).click();assert.equal(await page.locator('.qr svg').count(),1);await page.close();
}));

test('class readers follow browser text size, ignore old preferences and never use speech synthesis',()=>browserTest(async browser=>{
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'Quiet Prayer Class',['cross','ourFather','fatima']])).toString('base64url');
  let defaultPrayerSize;
  for(const oldPreferences of [null,{size:1.75,voice:'Previously Selected Voice'}]){
    const page=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});
    await page.addInitScript(preferences=>{
      if(preferences)localStorage.setItem('ocia-preferences',JSON.stringify(preferences));
      window.speechCalls=[];
      window.SpeechSynthesisUtterance=class{constructor(){window.speechCalls.push('utterance');}};
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
        getVoices:()=>{window.speechCalls.push('getVoices');return [];},
        speak:()=>window.speechCalls.push('speak'),
        cancel:()=>window.speechCalls.push('cancel')
      }});
    },oldPreferences);
    await page.goto(link);await page.locator('#reader-title').waitFor();
    await beginPrayerSet(page,'Quiet Prayer Class');
    assert.equal(await page.getByRole('button',{name:/Read Aloud|Reading Settings/}).count(),0);
    assert.equal(await page.locator('#audio-button, #text-size, #reading-voice').count(),0);
    assert.equal(await page.locator('.reader-topline, .reading-help').count(),0,'The reader shows the prayer without category or explanatory notes');
    assert.equal(await page.getByText('About This Prayer',{exact:true}).count(),0);
    const prayerSize=await page.locator('#prayer-text').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    if(oldPreferences)assert.equal(prayerSize,defaultPrayerSize,'Old in-app text preferences must not override the reader');
    else defaultPrayerSize=prayerSize;
    const rootSize=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
    await page.addStyleTag({content:`:root{font-size:${rootSize*2}px}`});
    const enlargedSize=await page.locator('#prayer-text').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    assert.ok(enlargedSize>=prayerSize*1.95,'Prayer text must grow with the browser font setting');
    await noOverflow(page);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top));
    await page.getByRole('button',{name:'Contents',exact:true}).click();
    assert.equal(await page.locator('#text-size, #reading-voice').count(),0);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.speechCalls),[],'Available speech APIs must not be invoked, including on close');
    await page.reload();await landingReady(page);await prayers(page);await page.getByRole('button',{name:'Continue',exact:true}).click();
    assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
    assert.equal(await page.getByRole('button',{name:/Read Aloud|Reading Settings/}).count(),0);
    assert.equal(await page.locator('#prayer-text').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),defaultPrayerSize);
    assert.deepEqual(await page.evaluate(()=>window.speechCalls),[]);
    await page.close();
  }
}));

test('prayer readers show the correct Everyone, Leader and Response parts on a phone',()=>browserTest(async browser=>{
  const prayerIds=['cross','apostlesCreed','niceneCreed','ourFather','hailMary','gloryBe','gloria','comeHolySpirit','hailHolyQueen','rosaryCollect','graceBeforeMeals','guardianAngel','stMichael','actOfContrition','fatima'];
  const splitPrayers={
    ourFather:[
      'Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven.',
      'Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.'
    ],
    hailMary:[
      'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.',
      'Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.'
    ]
  };
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'Class Responses',prayerIds])).toString('base64url');
  await page.goto(link);await page.locator('#reader-title').waitFor();
  await beginPrayerSet(page,'Class Responses');
  for(const [index,id] of prayerIds.entries()){
    const roles=await page.locator('#prayer-text .prayer-role').allTextContents();
    if(id==='fatima')assert.deepEqual(roles,['Everyone:']);
    else if(['hailHolyQueen','rosaryCollect'].includes(id))assert.deepEqual(roles,['Everyone:','Leader:','Response:']);
    else{
      assert.equal(roles[0],'Leader:',`${id} starts with the leader`);
      assert.ok(roles.includes('Response:'),`${id} provides the response`);
      assert.ok(roles.every(role=>['Leader:','Response:'].includes(role)),`${id} uses clear participation labels`);
    }
    for(const label of await page.locator('#prayer-text .prayer-role').all())assert.equal(await label.isVisible(),true);
    const words=await page.locator('#prayer-text .prayer-words').allTextContents();
    assert.equal(words.length,roles.length);
    assert.ok(words.every(text=>text.trim().length>0),`${id} has words for each part`);
    if(id==='fatima'){
      assert.deepEqual(words,['O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those who are in most need of Your mercy. Amen.']);
      assert.equal(await page.locator('#prayer-text q.prayer-words').count(),1,'Everyone reads the complete prayer together');
    }
    if(id==='hailHolyQueen')assert.deepEqual(words.slice(1),['Queen of the Most Holy Rosary, pray for us.','That we may be made worthy of the promises of Christ.']);
    if(id==='rosaryCollect')assert.deepEqual(words.slice(1),['May the divine assistance remain always with us.','May the souls of the faithful departed through the mercy of God rest in peace. Amen.']);
    if(splitPrayers[id]){
      assert.deepEqual(roles,['Leader:','Response:']);
      assert.deepEqual(words,splitPrayers[id]);
    }
    if(id==='ourFather')assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
    assert.equal(await page.locator('.reader-topline, .reading-help, .mystery-image, .desire').count(),0);
    await noOverflow(page);
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top),`${id} can be read fully above the navigation`);
    await page.getByRole('button',{name:index===prayerIds.length-1?'Finish':'Next',exact:true}).tap();
  }
  assert.equal(await page.locator('h1').textContent(),'Prayer Complete');
  assert.equal(await page.getByText('You’ve completed these prayers.',{exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'Review Prayer Set',exact:true}).tap();
  assert.equal(await page.locator('[data-action=jump]').count(),prayerIds.length);
  await page.getByRole('button',{name:'Close',exact:true}).tap();
  await page.getByRole('button',{name:'Pray Again',exact:true}).tap();
  await beginPrayerSet(page,'Class Responses');
  assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  await page.locator('[data-action=jump]').last().tap();
  await page.getByRole('button',{name:'Finish',exact:true}).tap();
  await page.getByRole('button',{name:'Done',exact:true}).tap();
  assert.equal(await page.locator('#reader-title').count(),0);
  assert.equal(await page.getByRole('button',{name:'My Prayers',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('heading',{name:'Saved Prayer Sets',exact:true}).isVisible(),true);
  await page.close();
}));

test('How to Use is the first tab and default landing with working first steps on a phone',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await page.goto(base,{waitUntil:'domcontentloaded'});await landingReady(page);
  assert.deepEqual(await page.locator('.primary-nav button span').allTextContents(),['How to Use','Prayers','My Prayers','The Mass']);
  assert.equal(await page.getByRole('button',{name:'How to Use',exact:true}).getAttribute('aria-current'),'page');
  for(const name of ['Open Your Prayer Set','Follow Along','Find a Prayer','Create a Prayer Set','Adjust Text Size'])assert.equal(await page.getByRole('heading',{name,exact:true}).isVisible(),true);
  const help=await page.locator('main').textContent();
  assert.match(help,/Use Prayers for individual prayers and Mysteries of the Rosary\./);
  for(const instruction of [/Use your phone or browser’s text-size settings/,/Follow the Leader, Response, or Everyone labels\./,/Tap Next with the group/,/choose repetitions/,/opens and saves in My Prayers on this device/])assert.match(help,instruction);
  await noOverflow(page);
  await page.getByRole('button',{name:'Browse Prayers',exact:true}).tap();
  assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('h1').textContent(),'Begin With Essentials');
  assert.equal(await page.getByRole('heading',{name:'Questions You Can Ask Here',exact:true}).count(),0);
  assert.equal(await page.getByRole('heading',{name:'A Place to Begin.',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Pray Together',exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'How to Use',exact:true}).tap();
  await page.getByRole('button',{name:'Create Prayer Set',exact:true}).tap();
  assert.equal(await page.getByRole('button',{name:'My Prayers',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('textbox',{name:'Prayer Set Name',exact:true}).isVisible(),true);
  assert.equal(await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).isVisible(),true);
  await noOverflow(page);await page.close();
}));

test('students browse without editing controls; saved sets use a simple default or chosen name',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700}});await open(page);
  assert.equal(await page.locator('.brand').textContent(),'OCIA Prayer Companion');
  assert.equal(await page.locator('[data-action="add"]').count(),0);
  await page.locator('[data-action="read-item"][data-id="cross"] svg').click();
  assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await page.getByRole('button',{name:'Close Prayer and Save Place',exact:true}).click();
  await page.locator('.mystery-library .chapter').first().click();
  assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('[data-action="add"], [data-action="add-mysteries"]').count(),0);
  await page.getByRole('button',{name:'Prayers',exact:true}).click();
  assert.equal(await page.getByRole('heading',{name:'Begin With Essentials',exact:true}).isVisible(),true);
  assert.equal(await page.locator('.mystery-library .chapter').count(),4,'The Prayers tab returns from a mystery group to the whole library');
  await page.getByRole('button',{name:'My Prayers',exact:true}).click();
  assert.equal(await page.locator('#class-title').count(),0);
  await page.getByRole('button',{name:'Create Prayer Set',exact:true}).click();
  const first=await page.locator('#class-title').inputValue();assert.equal(first,'My Prayer Set');
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
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).click();
  assert.equal(await page.getByRole('dialog').getByRole('textbox',{name:'Prayer Set Name',exact:true}).inputValue(),'Tuesday OCIA');
  await page.locator('#saved-set-name').fill('Cancelled name');await noOverflow(page);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.locator('#class-title').inputValue(),'Tuesday OCIA');
  assert.match(await page.locator('.saved-row').textContent(),/Tuesday OCIA/);
  assert.doesNotMatch(await page.locator('.saved-row').textContent(),/Cancelled name/);
  assert.equal(await page.locator('.saved-row').count(),1);
  await saveClass(page);
  assert.equal(await page.locator('.saved-row').count(),1);
  await page.getByRole('button',{name:'New Prayer Set',exact:true}).click();
  await page.getByRole('button',{name:'Start New Prayer Set',exact:true}).click();
  assert.equal(await page.locator('#class-title').inputValue(),'My Prayer Set');
  assert.match(await page.locator('.saved-row').textContent(),/Tuesday OCIA/);
  await page.getByRole('button',{name:'All My Prayers',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'My Prayers',exact:true}).click();
  assert.equal(await page.locator('#class-title').count(),0);await page.close();
}));

test('Mass guide shows a single visible form with priest cues and congregation responses on phones',()=>browserTest(async browser=>{
  const page=await browser.newPage({viewport:{width:320,height:700},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await open(page);
  await page.getByRole('button',{name:'The Mass',exact:true}).tap();
  assert.equal(await page.locator('h1').textContent(),'The Mass');
  assert.equal(await page.locator('.mass-section').count(),4);
  assert.equal(await page.locator('.mass-part').count(),25);
  assert.equal(await page.locator('main details, main select').count(),0,'The Mass can be followed without opening dropdowns or choosing forms');
  assert.equal(await page.locator('.mass-form').count(),25);
  assert.equal(await page.locator('.mass-pending').count(),0,'The leaflet responses are complete');
  for(const card of await page.locator('.mass-part').all()){
    assert.ok((await card.locator('.mass-when').textContent()).trim().length>0,'Each Mass part explains when it is used');
    if(!['mass-part-homily','mass-part-psalm'].includes(await card.getAttribute('id')))assert.equal(await card.locator('.mass-form').isVisible(),true);
  }
  for(const id of ['gloria','creed'])assert.equal(await page.locator(`#mass-part-${id} .mass-when`).textContent(),'On Certain Days');
  assert.match(await page.locator('#mass-part-homily').textContent(),/no spoken response/i);
  assert.equal(await page.locator('#mass-part-homily .mass-turn').count(),0);
  await page.getByRole('link',{name:'3. Liturgy of the Eucharist',exact:true}).tap();
  assert.equal(new URL(page.url()).hash,'#mass-offer');
  assert.equal(await page.locator('button[data-view="mass"]').getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('link',{name:/Official Mass guide/}).count(),0);
  assert.match(await page.locator('#mass-part-universal [data-role=response] .mass-prayer').first().textContent(),/Hear our prayer/);
  assert.match(await page.locator('#mass-part-gloria [data-role=response] .mass-prayer').textContent(),/Glory to God in the highest/);
  assert.match(await page.locator('#mass-form-creed [data-role=response] .mass-prayer').textContent(),/consubstantial/);
  assert.doesNotMatch(await page.locator('#mass-form-creed').textContent(),/communion of saints/,'Only the selected Nicene Creed is shown');
  const confiteor=page.locator('#mass-form-penitential [data-role=response] .mass-prayer').first();
  assert.match((await confiteor.innerText()).replace(/\s+/g,' '),/I confess to almighty God and to you, my brothers and sisters, that I have greatly sinned/);
  assert.match((await confiteor.innerText()).replace(/\s+/g,' '),/and you, my brothers and sisters, to pray for me to the Lord our God\.$/);
  assert.equal(await page.locator('#mass-form-penitential .prayer-direction').textContent(),'(Tap your chest.)');
  assert.doesNotMatch((await page.locator('#mass-form-penitential q').allTextContents()).join(' '),/Tap your chest/,'Actions are separate from quoted spoken words');
  assert.doesNotMatch(await page.locator('#mass-part-lords-prayer [data-role=response] .mass-prayer').first().textContent(),/Amen\.$/);
  assert.match(await page.locator('#mass-part-lords-prayer [data-role=response] .mass-prayer').last().textContent(),/For the kingdom/);
  for(const [id,text] of [['holy',/Holy, Holy, Holy Lord God of hosts/],['memorial',/We proclaim your Death, O Lord/],['lamb',/grant us peace/],['invitation',/Lord, I am not worthy/]])assert.match(await page.locator(`#mass-part-${id} [data-role=response] .mass-prayer`).textContent(),text);
  assert.equal(await page.locator('#mass-part-peace .mass-turn[data-role=response]').count(),2,'The invitation to exchange peace has no invented verbal response');
  for(const words of await page.locator('.mass-prayer').all())assert.ok((await words.textContent()).trim().length>0,'Every quoted turn has spoken words');
  assert.ok(await page.locator('.mass-turn[data-role=leader] q.prayer-words').count()>0,'The actual priest cues are quoted');
  assert.ok(await page.locator('.mass-turn[data-role=response] q.prayer-words').count()>0,'The congregation responses are quoted');
  for(const role of ['leader','response']){
    for(const label of await page.locator(`.mass-turn[data-role=${role}] .prayer-role-${role}`).all())assert.match(await label.textContent(),new RegExp(role==='leader'?'^Leader':'^Response'));
  }
  assert.equal(await page.locator('.mass-cue q').count(),0,'Stage directions are not quoted as speech');
  await noOverflow(page);
  await page.addStyleTag({content:':root{font-size:175%}'});await noOverflow(page);
  await page.locator('#mass-part-dismissal').scrollIntoViewIfNeeded();
  assert.match(await page.locator('#mass-part-dismissal [data-role=response] .mass-prayer').textContent(),/Thanks be to God\./);
  assert.doesNotMatch(await page.locator('#mass-part-dismissal').textContent(),/Double Alleluia/);
  await page.getByRole('button',{name:'Prayers',exact:true}).tap();
  await page.getByRole('button',{name:'The Mass',exact:true}).tap();
  assert.equal(await page.locator('main details, main select').count(),0);
  await page.reload();await page.getByRole('button',{name:'The Mass',exact:true}).tap();
  assert.equal(await page.locator('main details, main select').count(),0);
  await page.getByRole('button',{name:'Prayers',exact:true}).tap();
  await page.locator('[data-action="read-item"][data-id="ourFather"]').tap();
  assert.match(await page.locator('#prayer-text').textContent(),/Amen\.$/);await page.close();
}));
