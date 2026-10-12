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
async function beads(page,current){
  assert.equal(await page.locator('.repeat-beads').getAttribute('aria-hidden'),'true');
  assert.deepEqual(await page.locator('.repeat-beads .prayer-bead').evaluateAll(elements=>elements.map(el=>({done:el.classList.contains('done'),current:el.classList.contains('current')}))),Array.from({length:10},(_,index)=>({done:index<current-1,current:index===current-1})));
}
async function readingPoint(page,selector,side){
  const element=page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  return element.evaluate((el,side)=>{const r=el.getBoundingClientRect();const dock=document.querySelector('.reader-dock').getBoundingClientRect();return {x:r.left+r.width*(side==='left'?.25:.75),y:Math.max(r.top+4,Math.min(r.top+r.height/2,dock.top-12))};},side);
}
async function tapReading(page,selector,side){const point=await readingPoint(page,selector,side);await page.touchscreen.tap(point.x,point.y);}
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
    assert.equal(await page.locator('#reader-title').textContent(),'10/13/2026 OCIA');
    await page.getByRole('button',{name:'Begin Prayer',exact:true}).tap();
    assert.equal(await page.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
    assert.equal(await page.locator('.mystery-scripture p').textContent(),'“Behold the handmaid of the Lord; be it done to me according to thy word.”');
    assert.equal(await page.locator('.mystery-scripture cite').textContent(),'(Luke 1:38)');
    assert.equal(await page.locator('#prayer-text, .desire, .reading-help, .reader-topline, .session-name, .set-metadata').count(),0);
    assert.equal(await page.locator('.mystery-image img').count(),1);
    await fits(page);await tapTargets(page);
    assert.ok(await page.evaluate(()=>{const title=document.querySelector('#reader-title');return title.getBoundingClientRect().top+parseFloat(getComputedStyle(title).lineHeight)<=document.querySelector('.reader-dock').getBoundingClientRect().top+1;}),'The first line of the mystery title is visible above the phone navigation');
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await page.evaluate(()=>document.querySelector('#reader-title').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top),'The full mystery title can be read above navigation');
    await page.locator('.mystery-image img').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const image=document.querySelector('.mystery-image img');return image.complete&&image.naturalWidth>0;});
    await fits(page);
    await page.getByRole('button',{name:'Next',exact:true}).tap();
    assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
    assert.ok(await page.evaluate(()=>{const text=document.querySelector('#prayer-text');return text.getBoundingClientRect().top+parseFloat(getComputedStyle(text).lineHeight)<=document.querySelector('.reader-dock').getBoundingClientRect().top+1;}),'The first line of the prayer is visible above the phone navigation');
    assert.equal(await page.locator('.repeat-progress, .repeat-beads').count(),0);
    await page.getByRole('button',{name:'Next',exact:true}).tap();
    for(let repeat=1;repeat<=10;repeat++){
      assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary');
      assert.equal(await page.locator('.repeat-progress').textContent(),`${repeat} of 10`);
      await beads(page,repeat);
      if(repeat===5){await page.reload();await page.locator('#reader-title').waitFor();assert.equal(await page.locator('.repeat-progress').textContent(),'5 of 10');}
      if(repeat===5)await beads(page,5);
      await page.getByRole('button',{name:'Next',exact:true}).tap();
    }
    assert.equal(await page.locator('#reader-title').textContent(),'Glory Be');
    assert.equal(await page.locator('.repeat-progress, .repeat-beads').count(),0);
    await page.getByRole('button',{name:'Previous',exact:true}).tap();
    assert.equal(await page.locator('.repeat-progress').textContent(),'10 of 10');
    await beads(page,10);
    await page.setViewportSize({width:height,height:width});await fits(page);
    await page.addStyleTag({content:':root{font-size:175%}'});await fits(page);
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<document.querySelector('.reader-dock').getBoundingClientRect().top),'End of the prayer can be scrolled fully above navigation');
    await page.getByRole('button',{name:'Contents',exact:true}).tap();await closeStaysVisible(page);
    assert.deepEqual(errors,[]);await page.close();
  }
}));

test('phone class preparation keeps picker and QR dismissal within tap reach',()=>run(async browser=>{
  const page=await phone(browser);await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  await page.getByRole('button',{name:'Create Prayer Set',exact:true}).tap();
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).tap();
  assert.notEqual(await page.evaluate(()=>document.activeElement.id),'picker-search','Touch users can browse without opening the keyboard automatically');
  await fits(page);await tapTargets(page,'dialog');await closeStaysVisible(page);
  await page.getByRole('button',{name:'Add Prayer or Mystery',exact:true}).tap();
  await page.locator('#picker-search').fill('Hail Mary');await page.locator('#picker-count').selectOption('10');
  await page.locator('[data-action="add"][data-id="hailMary"]').tap();await closeStaysVisible(page);
  assert.equal(await page.locator('.step-count').inputValue(),'10');await fits(page);await tapTargets(page);
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.locator('#saved-set-name').fill('Phone Class');
  await page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  await page.getByRole('heading',{name:'Prayer Set Saved — Ready to Share',exact:true}).waitFor();
  assert.ok(await page.locator('#share-url').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
  const link=await page.locator('#share-url').inputValue();
  const createdAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).createdAt);
  assert.match(createdAt,/^\d{4}-\d{2}-\d{2}T/);
  const updatedAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('ocia-draft')).updatedAt);
  assert.deepEqual(JSON.parse(Buffer.from(new URL(link).hash.slice(7),'base64url')),[1,'Phone Class',Array(10).fill('hailMary'),'',createdAt,updatedAt]);
  await fits(page);await tapTargets(page,'dialog');await closeStaysVisible(page);await page.close();
}));

test('200 percent text keeps save fields, the full QR and download reachable beneath a long dialog title',()=>run(async browser=>{
  const page=await phone(browser,320,568);
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await page.addStyleTag({content:':root{font-size:200%}'});
  await page.evaluate(()=>document.fonts.ready);
  const hittable=async(locator,label)=>assert.ok(await locator.evaluate(el=>{
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    return r.top>=0&&r.bottom<=innerHeight&&x>=0&&x<=innerWidth&&el.contains(document.elementFromPoint(x,y));
  }),`${label} must remain visible and receive a tap`);
  const close=()=>page.getByRole('dialog').getByRole('button',{name:'Close',exact:true});
  await page.getByRole('button',{name:'My Prayers',exact:true}).tap();
  await page.getByRole('button',{name:'Create Prayer Set',exact:true}).tap();
  await page.locator('#starter').selectOption('opening');
  await page.getByRole('button',{name:'Save Prayer Set',exact:true}).tap();
  const name=page.locator('#saved-set-name');await name.waitFor();
  await hittable(name,'The focused prayer set name');await hittable(close(),'Close beside the save title');
  await name.tap();await name.fill('Enlarged Text Prayer Set');
  const save=page.getByRole('dialog').getByRole('button',{name:'Save Prayer Set',exact:true});
  await save.scrollIntoViewIfNeeded();await hittable(save,'Save Prayer Set');await hittable(close(),'Close after scrolling the save form');
  await save.tap();
  await page.getByRole('heading',{name:'Prayer Set Saved — Ready to Share',exact:true}).waitFor();
  await hittable(close(),'Close beside the saved title');
  await page.locator('.qr').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  assert.ok(await page.locator('.qr').evaluate(el=>{
    const r=el.getBoundingClientRect(),d=document.querySelector('dialog').getBoundingClientRect();
    if(r.top<Math.max(0,d.top)||r.bottom>Math.min(innerHeight,d.bottom)||r.left<d.left||r.right>d.right)return false;
    return [.05,.5,.95].every(x=>[.05,.5,.95].every(y=>el.contains(document.elementFromPoint(r.left+r.width*x,r.top+r.height*y))));
  }),'The entire QR must fit on screen without being covered by the dialog title or Close');
  await hittable(close(),'Close while viewing the QR');
  const download=page.getByRole('button',{name:'Download QR',exact:true});
  await download.scrollIntoViewIfNeeded();await hittable(download,'Download QR');await hittable(close(),'Close at the sharing actions');
  const downloaded=page.waitForEvent('download');await download.tap();
  const file=await downloaded;assert.equal(await file.failure(),null);assert.equal(file.suggestedFilename(),'enlarged-text-prayer-set-qr.png');
  await fits(page);await close().tap();
  assert.equal(await page.locator('dialog').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#class-title').inputValue(),'Enlarged Text Prayer Set');
  await page.close();
}));

test('200 percent text stays on a narrow phone with usable navigation',()=>run(async browser=>{
  const page=await phone(browser);await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();await page.getByRole('button',{name:'Prayers',exact:true}).tap();await page.locator('[data-action=essentials]').waitFor();
  await page.addStyleTag({content:':root{font-size:200%}'});await page.evaluate(()=>document.fonts.ready);
  await fits(page);
  for(const button of await page.locator('.primary-nav button').all()){
    assert.ok(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  assert.equal(await page.locator('.mystery-library').getByRole('heading',{name:'Mysteries of the Rosary',exact:true}).isVisible(),true);
  await page.locator('.mystery-library .chapter').first().tap();await fits(page);
  assert.equal(await page.getByRole('button',{name:'Prayers',exact:true}).getAttribute('aria-current'),'page');
  await page.getByRole('button',{name:'All Mysteries',exact:true}).tap();
  assert.equal(await page.locator('.mystery-library .chapter').count(),4);
  await fits(page);
  await page.locator('[data-action=essentials]').tap();await fits(page);
  const dock=await page.locator('.reader-dock').boundingBox();assert.ok(dock.height<page.viewportSize().height/3,'Enlarged navigation must leave room to read');
  for(const button of await page.locator('.reader-dock button').all()){
    const r=await button.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=320&&r.y+r.height<=568);
    assert.ok(await button.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  }
  await page.getByRole('button',{name:'Next',exact:true}).tap();assert.equal(await page.locator('#reader-title').textContent(),'Lord’s Prayer (Our Father)');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  assert.ok(await page.evaluate(()=>document.querySelector('#prayer-text').getBoundingClientRect().bottom<=document.querySelector('.reader-dock').getBoundingClientRect().top));
  await page.getByRole('button',{name:'Previous',exact:true}).tap();assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await page.close();
}));

test('phone navigation keeps four equal tabs or a balanced two-by-two layout as text and viewport sizes change',()=>run(async browser=>{
  const page=await phone(browser);const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&/ResizeObserver/i.test(message.text()))errors.push(message.text());});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  async function layout(columns){
    await page.waitForFunction(expected=>getComputedStyle(document.querySelector('.primary-nav')).gridTemplateColumns.split(' ').length===expected,columns);
    const buttons=await page.locator('.primary-nav button').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:Math.round(r.top),width:r.width,clipped:el.scrollWidth>el.clientWidth+1};}));
    assert.equal(buttons.length,4);
    const rows=[...new Set(buttons.map(button=>button.top))].map(top=>buttons.filter(button=>button.top===top).length);
    assert.deepEqual(rows,columns===4?[4]:[2,2],'Four tabs stay balanced, never three tabs above a single tab');
    assert.ok(Math.max(...buttons.map(button=>button.width))-Math.min(...buttons.map(button=>button.width))<=1,'Tabs have equal widths');
    assert.ok(buttons.every(button=>button.left>=0&&button.right<=page.viewportSize().width&&!button.clipped),'Every tab and its label fit the viewport');
    await fits(page);
  }
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(()=>document.documentElement.style.fontSize='100%');await layout(4);
    for(const size of [150,175,200]){
      await page.evaluate(size=>document.documentElement.style.fontSize=`${size}%`,size);
      await layout(width===430&&size===150?4:2);
    }
    await page.setViewportSize({width:800,height:844});await layout(4);
    await page.setViewportSize({width,height:844});await layout(2);
    await page.evaluate(()=>document.documentElement.style.fontSize='100%');await layout(4);
  }
  assert.deepEqual(errors,[],'Responsive navigation must not produce ResizeObserver loops or page errors');
  await page.close();
}));

test('mystery pages fit complete scripture and uncropped artwork on phones and scale accessibly',()=>run(async browser=>{
  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../rosary-v2/index.html'),'utf8');
  const mysteries=[...source.matchAll(/\{type:'(First|Second|Third|Fourth|Fifth) (Joyful|Sorrowful|Luminous|Glorious) Mystery',name:'([^']+)',scripture:'([^']+)',citation:'([^']+)',image:'[^']+'\}/g)].map(([,ordinal,set,title,scripture,citation])=>({id:`${set.toLowerCase()}-${['First','Second','Third','Fourth','Fifth'].indexOf(ordinal)+1}`,title,scripture,citation}));
  assert.equal(mysteries.length,20);
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'All Twenty Mysteries',mysteries.map(item=>item.id)])).toString('base64url');
  let normalTextSizes;
  for(const [width,height,size,fitWithoutScrolling] of [[375,667,100,true],[390,844,100,true],[430,932,100,true],[320,568,100,false],[667,375,100,false],[390,844,200,false]]){
    const page=await phone(browser,width,height);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(link);await page.getByRole('button',{name:'Begin Prayer',exact:true}).waitFor();
    if(size!==100){
      const defaultRootSize=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
      await page.addStyleTag({content:`:root{font-size:${defaultRootSize*size/100}px}`});
    }
    await page.getByRole('button',{name:'Begin Prayer',exact:true}).tap();await page.evaluate(()=>document.fonts.ready);
    const textSizes=await page.locator('#reader-title, .mystery-scripture p, .mystery-scripture cite').evaluateAll(elements=>elements.map(el=>parseFloat(getComputedStyle(el).fontSize)));
    if(width===390&&size===100)normalTextSizes=textSizes;
    if(size===200)assert.ok(textSizes.every((value,index)=>value>=normalTextSizes[index]*1.95),'Titles, scripture and references grow with the user’s text size');
    for(const [index,mystery] of mysteries.entries()){
      const context=`${width}×${height} at ${size}%: ${mystery.title}`;
      assert.equal(await page.locator('#reader-title').textContent(),mystery.title,context);
      assert.equal(await page.locator('.mystery-scripture p').textContent(),mystery.scripture,context);
      assert.equal(await page.locator('.mystery-scripture cite').textContent(),mystery.citation,context);
      await page.waitForFunction(()=>{const image=document.querySelector('.mystery-image img');return image.complete&&image.naturalWidth>0&&image.naturalHeight>0;});
      await fits(page);
      const image=await page.locator('.mystery-image img').evaluate(el=>{const r=el.getBoundingClientRect();return {height:r.height,width:r.width,fit:getComputedStyle(el).objectFit};});
      assert.ok(image.height>=159.5&&image.width>0,`${context}: artwork retains a useful minimum size`);
      assert.equal(image.fit,'contain',`${context}: the whole image is shown without cropping`);
      if(fitWithoutScrolling){
        assert.equal(await page.evaluate(()=>scrollY),0,`${context}: no scrolling is required`);
        const bounds=await page.evaluate(()=>{const dock=document.querySelector('.reader-dock').getBoundingClientRect();return [...document.querySelectorAll('#reader-title, .mystery-scripture p, .mystery-scripture cite, .mystery-image img')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,dockTop:dock.top};});});
        assert.ok(bounds.every(rect=>rect.top>=0&&rect.bottom<=rect.dockTop+1),`${context}: the complete title, scripture, reference and artwork fit above the controls`);
      }else{
        for(const selector of ['#reader-title','.mystery-scripture p','.mystery-scripture cite','.mystery-image img']){
          const content=page.locator(selector);
          await content.evaluate(el=>el.scrollIntoView({block:'start'}));
          assert.ok(await content.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=-1&&r.top<document.querySelector('.reader-dock').getBoundingClientRect().top;}),`${context}: the beginning of ${selector} is reachable`);
          await content.evaluate(el=>{const bottom=el.getBoundingClientRect().bottom;const dock=document.querySelector('.reader-dock').getBoundingClientRect().top;scrollTo(0,scrollY+bottom-dock+8);});
          assert.ok(await content.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.bottom<=document.querySelector('.reader-dock').getBoundingClientRect().top+1;}),`${context}: the end of ${selector} is reachable above the controls`);
        }
      }
      if(index<mysteries.length-1)await page.getByRole('button',{name:'Next',exact:true}).tap();
    }
    assert.deepEqual(errors,[]);await page.close();
  }
}));

test('reader side taps turn mystery text and artwork, blank prayer space and repeated beads without double-turning controls',()=>run(async browser=>{
  const page=await phone(browser,390,844);
  const readingIds=['joyful-1','cross','hailMary','hailMary','hailMary','gloryBe'];
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'Tap Through Prayer',readingIds])).toString('base64url');
  await page.goto(link);await page.getByRole('button',{name:'Begin Prayer',exact:true}).waitFor();
  await page.locator('#reader-title').tap();
  assert.equal(await page.locator('#reader-title').textContent(),'Tap Through Prayer','The opening pane remains button-only');
  await page.getByRole('button',{name:'Begin Prayer',exact:true}).tap();
  await tapReading(page,'.mystery-scripture','right');
  assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  await tapReading(page,'#reader-title','left');
  assert.equal(await page.locator('#reader-title').textContent(),'The First Joyful Mystery: The Annunciation of the Lord.');
  await tapReading(page,'.mystery-image img','right');
  assert.equal(await page.locator('#reader-title').textContent(),'Sign of the Cross');
  const blank=await page.evaluate(()=>{const article=document.querySelector('article').getBoundingClientRect();const dock=document.querySelector('.reader-dock').getBoundingClientRect();return {x:innerWidth*.8,y:(article.bottom+dock.top)/2,height:dock.top-article.bottom};});
  assert.ok(blank.height>20,'The short prayer leaves blank reading space above the dock');
  await page.touchscreen.tap(blank.x,blank.y);
  async function repetition(current){
    assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary');
    assert.equal(await page.locator('.repeat-progress').textContent(),`${current} of 3`);
    assert.equal(await page.locator('.prayer-bead').count(),3);
    assert.equal(await page.locator('.prayer-bead.done').count(),current-1);
    assert.equal(await page.locator('.prayer-bead.current').evaluate(el=>[...el.parentElement.children].indexOf(el)),current-1);
  }
  await repetition(1);
  await tapReading(page,'#prayer-text','right');await repetition(2);
  await tapReading(page,'#prayer-text','right');await repetition(3);
  await tapReading(page,'#prayer-text','left');await repetition(2);
  await page.getByRole('button',{name:'Next',exact:true}).tap();await repetition(3);
  await page.getByRole('button',{name:'Previous',exact:true}).tap();await repetition(2);
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  await page.locator('#dialog-title').tap();
  assert.equal(await page.locator('dialog').evaluate(el=>el.open),true);
  await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).tap();await repetition(2);
  await page.getByRole('button',{name:'Contents',exact:true}).tap();
  await page.locator('[data-action="jump"][data-index="0"]').tap();
  await tapReading(page,'#reader-title','left');
  assert.equal(await page.locator('#reader-title').textContent(),'Tap Through Prayer','Left from the first custom prayer returns to its opening pane');
  await page.close();
  const desktop=await browser.newPage({viewport:{width:900,height:900},reducedMotion:'reduce'});
  await desktop.goto(base);await desktop.getByRole('heading',{name:'How to Use',exact:true}).waitFor();
  await desktop.getByRole('button',{name:'Prayers',exact:true}).click();
  await desktop.locator('[data-action="read-item"][data-id="cross"]').click();
  let point=await readingPoint(desktop,'#reader-title','left');await desktop.mouse.click(point.x,point.y);
  assert.equal(await desktop.locator('#reader-title').textContent(),'Sign of the Cross','Left stays at the first individual prayer');
  point=await readingPoint(desktop,'#reader-title','right');await desktop.mouse.click(point.x,point.y);
  assert.equal(await desktop.locator('h1').textContent(),'Prayer Complete','Right finishes the last prayer');
  await desktop.locator('h1').click();assert.equal(await desktop.locator('h1').textContent(),'Prayer Complete');
  await desktop.close();
}));

test('reader side taps leave scrolling, dragging, selected text, long presses and multiple touches alone',()=>run(async browser=>{
  const page=await phone(browser,390,844);
  const link=base+'#class='+Buffer.from(JSON.stringify([1,'Read Without Accidental Turns',['niceneCreed','hailMary']])).toString('base64url');
  await page.goto(link);await page.getByRole('button',{name:'Begin Prayer',exact:true}).tap();
  const unchanged=async()=>assert.equal(await page.locator('#reader-title').textContent(),'Nicene Creed');
  let point=await readingPoint(page,'#reader-title','right');
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();await unchanged();
  point=await readingPoint(page,'#reader-title','right');
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-80,point.y+40,{steps:8});await page.mouse.up();await unchanged();
  await page.evaluate(()=>getSelection().removeAllRanges());
  point=await readingPoint(page,'#reader-title','right');
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  if(engine===webkit)await page.evaluate(()=>scrollTo(0,300));
  else await page.mouse.wheel(0,300);
  await page.waitForFunction(()=>scrollY>100);await page.mouse.up();await unchanged();
  point=await readingPoint(page,'#reader-title','right');
  await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.querySelector('#prayer-text .prayer-words'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);});
  await page.touchscreen.tap(point.x,point.y);await unchanged();
  await page.evaluate(()=>getSelection().removeAllRanges());
  for(const mode of ['multiple','cancel','move-away-and-back']){
    point=await readingPoint(page,'#reader-title','right');
    await page.evaluate(({point,mode})=>{
      const article=document.querySelector('article');
      const fire=(target,type,id=81,primary=true,extra={})=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',isPrimary:primary,button:0,buttons:type==='pointerup'?0:1,clientX:point.x,clientY:point.y,...extra}));
      fire(article,'pointerdown');
      if(mode==='multiple'){fire(document.body,'pointerdown',82,false);fire(document.body,'pointerup',82,false);}
      if(mode==='cancel')fire(article,'pointercancel');
      if(mode==='move-away-and-back'){fire(article,'pointermove',81,true,{clientX:point.x-50});fire(article,'pointermove');}
      fire(article,'pointerup');
      article.dispatchEvent(new MouseEvent('click',{bubbles:true,button:0,detail:1,clientX:point.x,clientY:point.y}));
    },{point,mode});
    await unchanged();
  }
  await tapReading(page,'#reader-title','right');
  assert.equal(await page.locator('#reader-title').textContent(),'Hail Mary','A fresh ordinary tap still works after canceled gestures');
  await page.close();
}));
