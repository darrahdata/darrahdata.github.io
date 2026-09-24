// Run with node --test rosary-v2/runtime.test.cjs (Playwright required).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

async function fixture(run,url='http://localhost:4173/'){
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROME_CHANNEL?{channel:process.env.PLAYWRIGHT_CHROME_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];const analytics=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
    if(route.request().url()===url)return route.fulfill({contentType:'text/html',body:html});
    if(route.request().url().includes('/collect'))analytics.push(route.request().postData());
    return route.abort();
  });
  try{
    await page.goto(url);
    await run(page,analytics);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
}

test('all modes rebuild their current flow and resume without a start event',async()=>fixture(async page=>{
  const result=await page.evaluate(()=>{
    const events=[];trackUsage=(event)=>events.push(event);
    const starts=[];
    for(const mystery of Object.keys(MYSTERIES))for(const prayerStyle of ['standard','dominican'])for(const style of ['one','five','darrah'])starts.push(()=>{selectMystery(mystery);selectPrayerStyle(prayerStyle);selectStyle(style);startRosary();});
    for(const key of Object.keys(PRAYERS))starts.push(()=>startCommonPrayer(key));
    for(const key of Object.keys(CHAPLETS))starts.push(()=>startChaplet(key));
    for(const key of Object.keys(MYSTERIES))for(const index of ['all','0','4'])starts.push(()=>startMysteryStudy(`${key}:${index}`));
    return starts.map(start=>{
      start();state.index=Math.min(3,state.beads.length-1);state.intention='Remember this intention';persistSession();
      const expected=JSON.stringify(state.beads);const index=state.index;const startedAt=state.startedAt;
      showSetup();state.beads=[];state.index=0;events.length=0;resumeSavedSession();
      return expected===JSON.stringify(state.beads)&&index===state.index&&startedAt===state.startedAt&&state.intention==='Remember this intention'&&events.length===0&&screenIs('prayer');
    });
  });
  assert.ok(result.length>30);assert.ok(result.every(Boolean));
}));

test('Sacred Heart novena keeps all 17 prayers in order with read-aloud, resume and restart',async()=>fixture(async page=>{
  const result=await page.evaluate(()=>{
    const spoken=[];window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],speak:u=>spoken.push(u),cancel:()=>{}}});
    startCommonPrayer('sacredHeartNovena');
    const names=state.beads.map(bead=>bead.name);
    const texts=state.beads.map(bead=>bead.text);
    const groups=state.beads.filter(bead=>bead.groupStart).map(bead=>bead.name);
    toggleReadAloud();
    const narration=[];
    for(let i=0;i<state.beads.length;i++){
      narration.push(spoken.at(-1).text.includes(state.beads[i].text));
      if(i<state.beads.length-1)nextBead();
    }
    prevBead();showSetup();resumeSavedSession();
    const resumed=state.index===15&&state.beads.length===17&&$('prayer-name').textContent==='O Sacred Heart of Jesus';
    nextBead();nextBead();
    const completed=screenIs('complete')&&localStorage.getItem('rosary-v2-session')===null;
    restartCurrentSession();
    return {names,texts,groups,narration,resumed,completed,restarted:state.index===0&&state.beads.length===17,
      repeated:['ourFather','hailMary','gloryBe'].map(key=>texts.filter(text=>text===PRAYERS[key].text).length),
      selectors:['common-prayer-select','mobile-common-prayer-select'].map(id=>$(id).querySelectorAll('option[value="sacredHeartNovena"]').length)};
  });
  assert.deepEqual(result.names,[
    'First Petition','Our Father','Hail Mary','Glory Be','Act of Trust',
    'Second Petition','Our Father','Hail Mary','Glory Be','Act of Trust',
    'Third Petition','Our Father','Hail Mary','Glory Be','Act of Trust',
    'O Sacred Heart of Jesus','St. Joseph'
  ]);
  assert.equal(result.texts[0],'O my Jesus, You have said:\n“Truly I say to you, ask and you will receive, seek and you will find, knock and it will be opened to you.”\nBehold, I knock, I seek, and I ask for the grace of [state your intention].');
  assert.equal(result.texts[5],'O my Jesus, You have said:\n“Truly I say to you, if you ask anything of the Father in My name, He will give it to you.”\nBehold, in Your name, I ask the Father for the grace of [state your intention].');
  assert.equal(result.texts[10],'O my Jesus, You have said:\n“Truly I say to you, heaven and earth will pass away, but My words will not pass away.”\nEncouraged by Your infallible words, I now ask for the grace of [state your intention].');
  for(const index of [4,9,14])assert.equal(result.texts[index],'Sacred Heart of Jesus, I place all my trust in You.');
  assert.equal(result.texts[15],'O Sacred Heart of Jesus, for whom it is impossible not to have compassion on the afflicted, have pity on us miserable sinners and grant us the grace which we ask of You, through the Sorrowful and Immaculate Heart of Mary, Your tender Mother and ours.');
  assert.equal(result.texts[16],'St. Joseph, foster father of Jesus, pray for us.');
  assert.deepEqual(result.groups,['Second Petition','Third Petition','O Sacred Heart of Jesus']);
  assert.deepEqual(result.repeated,[3,3,3]);
  assert.deepEqual(result.selectors,[1,1]);
  assert.ok(result.narration.every(Boolean));
  assert.ok(result.resumed&&result.completed&&result.restarted);
}));

test('invalid saves are rejected, positions clamped, completion tolerates storage failure',async()=>fixture(async page=>{
  assert.equal(await page.evaluate(()=>{
    startRosary();const valid=JSON.parse(localStorage.getItem('rosary-v2-session'));
    const invalid=['null','{',JSON.stringify({...valid,index:-1}),JSON.stringify({...valid,mystery:'__proto__'}),JSON.stringify({...valid,commonPrayer:true,commonKey:'constructor'}),JSON.stringify({...valid,chaplet:true,chapletKey:'stCharbel',commonPrayer:true}),JSON.stringify({...valid,studyingMystery:true,studyMysteryKey:'joyful:99'})];
    if(invalid.some(raw=>{localStorage.setItem('rosary-v2-session',raw);return restoreSession()!==null;}))return false;
    localStorage.setItem('rosary-v2-session',JSON.stringify({...valid,index:99999}));resumeSavedSession();
    if(state.index!==state.beads.length-1)return false;
    Storage.prototype.removeItem=()=>{throw Error('blocked');};completeRosary();showSetup();
    if(!$('resume-panel').hidden)return false;
    Storage.prototype.getItem=()=>{throw Error('blocked');};Storage.prototype.setItem=()=>{throw Error('blocked');};
    startRosary();completeRosary();return screenIs('complete');
  }),true);
}));

test('local preview sends no analytics; hosted resume emits no start',async()=>{
  for(const url of ['http://localhost:4173/','http://127.0.0.1:4173/'])await fixture(async(page,analytics)=>{
    await page.evaluate(()=>{startRosary();completeRosary();});assert.deepEqual(analytics,[]);
  },url);
  await fixture(async(page,analytics)=>{
    await page.evaluate(()=>{startRosary();showSetup();resumeSavedSession();});
    await page.waitForTimeout(50);
    assert.deepEqual(analytics.map(raw=>JSON.parse(raw).event),['page_view','rosary_start']);
  },'https://rosary.example/');
  assert.match(html,/location\.protocol==='file:'/);
});

test('intention is restored, trimmed on advance, and cleared by Skip',async()=>fixture(async page=>{
  assert.equal(await page.evaluate(()=>{
    startRosary();state.index=state.beads.findIndex(bead=>bead.kind==='intention');state.intention='Saved';renderBead();
    if($('intention-input').value!=='Saved')return false;
    $('intention-input').value='  New intention  ';nextBead();if(state.intention!=='New intention')return false;
    prevBead();skipIntention();return state.intention===''&&JSON.parse(localStorage.getItem('rosary-v2-session')).intention==='';
  }),true);
}));

test('speech ignores stale callbacks and exits cleanly',async()=>fixture(async page=>{
  assert.equal(await page.evaluate(()=>{
    const spoken=[];window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],speak:u=>spoken.push(u),cancel:()=>{}}});
    startRosary();toggleReadAloud();const old=spoken[0];const start=old.onstart;const end=old.onend;const error=old.onerror;
    nextBead();setVoiceStatus('Current');start();end();error();
    if($('voice-status').textContent!=='Current'||!state.readMode)return false;
    showSetup();start();end();error();
    return !state.readMode&&state.currentUtterance===null&&!document.body.classList.contains('read-on')&&$('read-aloud-btn').getAttribute('aria-pressed')==='false';
  }),true);
}));

test('mobile dialog traps focus, restores inert state, and closes on desktop resize',async()=>fixture(async page=>{
  await page.evaluate(()=>{startRosary();$('mobile-menu-btn').focus();openMobileMenu();});
  assert.equal(await page.evaluate(()=>document.querySelector('main').inert),true);
  await page.evaluate(()=>{const items=menuFocusables();items.at(-1).focus();});
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement===menuFocusables()[0]),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement===menuFocusables().at(-1)),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>!isMobileMenuOpen()&&!document.querySelector('main').inert&&document.activeElement===$('mobile-menu-btn')),true);
  await page.evaluate(()=>openMobileMenu());await page.setViewportSize({width:1000,height:800});
  await page.waitForFunction(()=>!isMobileMenuOpen());
  assert.equal(await page.evaluate(()=>!document.querySelector('main').inert),true);
}));

test('first Saturday variant survives reload; Standard family opening uses three Hail Marys',async()=>fixture(async page=>{
  assert.equal(await page.evaluate(()=>{
    if(!isFirstSaturday(new Date(2026,7,1))||isFirstSaturday(new Date(2026,7,8))||isFirstSaturday(new Date(2026,7,2)))return false;
    if(buildDominicanBeads('joyful',true).some(bead=>bead.name==='After the Rosary'))return false;
    selectPrayerStyle('standard');
    for(const style of ['one','five']){
      selectStyle(style);startRosary();
      if(state.beads[0].text!==CHAPLET_PRAYERS.signOfCross.text||state.beads.at(-1).text!==CHAPLET_PRAYERS.signOfCross.text)return false;
    }
    selectStyle('darrah');startRosary();
    const opening=state.beads.filter(bead=>bead.group==='opening'&&bead.name==='Hail Mary');
    if(opening.length!==3||opening.some(bead=>bead.text!==PRAYERS.hailMary.text))return false;
    selectStyle('dominican');startRosary();state.firstSaturday=true;state.startedAt=new Date(2026,7,1).getTime();state.index=4;state.intention='Across reload';persistSession();return true;
  }),true);
  await page.reload();
  assert.equal(await page.evaluate(()=>{
    state.firstSaturday=false;resumeSavedSession();
    return state.firstSaturday&&state.index===4&&state.intention==='Across reload'&&state.beads[0].text.includes('reparation');
  }),true);
}));

test('legacy one/five sessions resume at the same prayer and migrate only once',async()=>fixture(async page=>{
  assert.equal(await page.evaluate(()=>{
    selectPrayerStyle('standard');
    for(const style of ['one','five'])for(const version of [undefined,1]){
      selectStyle(style);startRosary();state.index=state.beads.findIndex(bead=>bead.name==="Apostles' Creed");persistSession();
      const legacy=JSON.parse(localStorage.getItem('rosary-v2-session'));
      if(legacy.version!==3)return false;
      legacy.index--;if(version===undefined)delete legacy.version;else legacy.version=version;
      localStorage.setItem('rosary-v2-session',JSON.stringify(legacy));showSetup();
      if(!$('resume-label').textContent.endsWith('Prayer 2'))return false;
      resumeSavedSession();
      if(state.beads[state.index].name!=="Apostles' Creed"||JSON.parse(localStorage.getItem('rosary-v2-session')).version!==3)return false;
      showSetup();resumeSavedSession();if(state.index!==1)return false;
    }
    const starts=[()=>{selectStyle('darrah');startRosary();},()=>{selectStyle('dominican');startRosary();},()=>{selectStyle('one');startCommonPrayer('apostlesCreed');},()=>{selectStyle('five');startChaplet('divineMercy');},()=>startMysteryStudy('joyful:all')];
    for(const start of starts){
      start();const legacy=JSON.parse(localStorage.getItem('rosary-v2-session'));
      // Older saves encoded Dominican in style, before style and length were separated.
      if(legacy.prayerStyle==='dominican')legacy.style='dominican';
      delete legacy.version;delete legacy.prayerStyle;delete legacy.flowVersion;
      localStorage.setItem('rosary-v2-session',JSON.stringify(legacy));resumeSavedSession();if(state.index!==0)return false;
    }
    return true;
  }),true);
}));
