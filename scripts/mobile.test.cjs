// Start the static site on port 8080. Set MOBILE_BROWSER=webkit for Safari-engine checks.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require('playwright');
const base = process.env.MOBILE_TEST_URL || 'http://127.0.0.1:8080/';
const engine = process.env.MOBILE_BROWSER || 'chromium';
const output = '/tmp/site-mobile-review';
fs.mkdirSync(output, { recursive: true });
const viewports = [[320,740],[360,760],[390,844],[430,932],[768,1024],[844,390],[1440,900]];
const launch = () => (engine === 'webkit' ? webkit : chromium).launch({ headless:true, ...(engine === 'webkit' ? {} : {channel:'chrome'}) });
const startPrayer = p => p.locator('#start-btn').click();
async function copySign(p) {
  const button=p.getByRole('button', {name:'Now copy it'});
  await reachable(button);
  await button.click();
}
const openTools = p => p.locator('.sidebar-bottom summary').click();
async function testData(page) {
  await page.route('**/model_usage/usage_data.json', route => route.fulfill({json:{entries:[]}}));
}
async function archivedProfile(p, route) {
  await p.locator('.app-main h1').waitFor();
  await p.evaluate(() => localStorage.setItem('little-signs-profile', JSON.stringify({babyStage:'expecting',interests:[],routines:[],goalMinutes:5,learningMode:'both'})));
  await p.goto(base+'archive/little-signs/?mobile-test=1#/'+route);
  await p.locator(route.startsWith('learn/') ? '.sign-lesson-page h1' : '.hero-card h1').waitFor();
}
const screens = [
  ['home', '', async p => p.locator('[data-answer]').first().waitFor()],
  ['home-answer', '', async p => p.locator('[data-answer]').first().click()],
  ['home-complete', '', async p => {
    for(let i=0;i<3;i++) {
      await p.locator('[data-answer]').first().click();
      await p.locator('[data-next]').click();
    }
    await p.locator('.challenge-review summary').click();
  }],
  ['prayer-setup', 'rosary-v2/'],
  ['prayer-reading', 'rosary-v2/', startPrayer],
  ['prayer-menu', 'rosary-v2/', async p => { await startPrayer(p); if(await p.locator('#mobile-menu-btn').isVisible()) await p.locator('#mobile-menu-btn').click(); }],
  ['tiny-home', 'tiny-signs/'], ['tiny-library', 'tiny-signs/#/signs'],
  ['tiny-watch', 'tiny-signs/#/learn/milk'], ['tiny-copy', 'tiny-signs/#/learn/milk', copySign],
  ['tiny-use', 'tiny-signs/#/learn/milk', async p => { await copySign(p); await p.getByRole('button', {name:'I practiced it'}).click(); }],
  ['tiny-practice', 'tiny-signs/#/practice'],
  ['tiny-reveal', 'tiny-signs/#/practice', async p => { await p.getByRole('button', {name:'Start practice'}).click(); await p.getByRole('button', {name:'Reveal & compare'}).click(); }],
  ['tiny-settings', 'tiny-signs/#/settings'],
  ['baby-today', 'baby-playbook/'], ['baby-guide', 'baby-playbook/#guide'],
  ['baby-care', 'baby-playbook/#care/sleep-and-the-pause'], ['baby-faith', 'baby-playbook/#faith'],
  ['baby-handoff', 'baby-playbook/#handoff'], ['baby-help', 'baby-playbook/#help'],
  ['books', 'books/'], ['book-tools', 'books/', openTools],
  ['book-detail', 'books/', async p => p.locator('.cover-button').first().click()],
  ['book-add', 'books/', async p => p.locator('#add-open').click()],
  ['book-import', 'books/', async p => { await openTools(p); await p.locator('#import-open').click(); }],
  ['usage', 'model_usage/'], ['analytics-login', 'rosary-analytics/'], ['analytics', 'rosary-analytics/?demo=1'],
  ['privacy', 'privacy/'], ['archived-baby', 'archive/baby-signs/'],
  ['archived-baby-detail', 'archive/baby-signs/', async p => p.locator('.path-tile').first().click()],
  ['archived-little', 'archive/little-signs/'],
  ['archived-little-home', 'archive/little-signs/', p => archivedProfile(p,'today')],
  ['archived-little-lesson', 'archive/little-signs/', p => archivedProfile(p,'learn/milk')],
  ['archived-nora-gate', 'archive/for-nora/']
];

async function geometry(page, label) {
  const result = await page.evaluate(() => {
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert],[hidden]') && (!el.closest('dialog') || el.closest('dialog').open);
    const name = el => (el.id || el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0,80);
    const controls = [...document.querySelectorAll('button,select,textarea,summary,input:not([type=hidden])')].filter(visible);
    const small = controls.filter(el => {
      const target = el.matches('input[type=checkbox],input[type=radio]') ? el.closest('label') || el : el;
      const rect = target.getBoundingClientRect();
      return rect.width < 43.9 || rect.height < 43.9;
    }).map(name);
    const fields = controls.filter(el => el.matches('select,textarea,input:not([type=checkbox]):not([type=radio]):not([type=range])'));
    return {
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      small,
      zoom: fields.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name)
    };
  });
  assert.equal(result.overflow, false, label + ' horizontal page overflow');
  assert.deepEqual(result.small, [], label + ' touch targets smaller than 44px');
  assert.deepEqual(result.zoom, [], label + ' fields smaller than 16px');
}

async function reachable(locator) {
  await locator.evaluate(el => el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  assert.ok(await locator.evaluate(el => {
    const r=el.getBoundingClientRect();
    const x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2));
    const y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));
    return r.top >= 0 && r.bottom <= innerHeight + 1 && el.contains(document.elementFromPoint(x,y));
  }), 'control must be reachable without an overlay covering it');
}

test(`${engine}: app screens fit phone, tablet, desktop and landscape`, {timeout:300000}, async () => {
  const browser=await launch();
  try {
    for(const [width,height] of viewports) {
      for(const [name,path,setup] of screens) {
        if(process.env.MOBILE_SCREEN && !new RegExp(process.env.MOBILE_SCREEN).test(name)) continue;
        const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce',serviceWorkers:'block'});
        const page=await context.newPage();
        await testData(page);
        const errors=[]; page.on('pageerror', e=>errors.push(e.message));
        try {
          await page.goto(base+path);
          if(path.startsWith('tiny-signs/')) await page.locator('#main-content').waitFor();
          if(path.startsWith('archive/little-signs/')) await page.locator('.app-main h1').waitFor();
          await page.evaluate(()=>document.fonts.ready);
          if(setup) await setup(page);
          await geometry(page, `${name} ${width}x${height}`);
          assert.deepEqual(errors,[],name+' runtime errors');
          if(width===320 || width===390) {
            await page.evaluate(()=>scrollTo(0,0));
            await page.screenshot({path:`${output}/${engine}-${name}-${width}.png`});
          }
        } catch(error) {
          await page.screenshot({path:`${output}/${engine}-failure-${name}-${width}.png`}).catch(()=>{});
          error.message=`${name} ${width}x${height}: ${error.message}`;
          throw error;
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
});

test(`${engine}: touch reading, dialogs, forms and chart controls remain usable`, {timeout:90000}, async () => {
  const browser=await launch();
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  const p=await context.newPage();
  await testData(p);
  try {
    await p.goto(base+'rosary-v2/'); await startPrayer(p);
    const progress=()=>p.locator('#dock-progress').textContent();
    const initial=await progress();
    await p.touchscreen.tap(195,240); assert.equal(await progress(),initial);
    await p.touchscreen.tap(386,240); assert.notEqual(await progress(),initial);
    await p.touchscreen.tap(4,240); assert.equal(await progress(),initial);
    await p.locator('#mobile-menu-btn').tap();
    await p.locator('#mobile-common-prayer-select').selectOption('hailHolyQueen');
    await p.getByRole('button',{name:'Open selected prayer'}).tap();
    await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    assert.ok(await p.evaluate(()=>document.getElementById('prayer-text').getBoundingClientRect().bottom < document.getElementById('mobile-prayer-dock').getBoundingClientRect().top));
    await p.screenshot({path:`${output}/${engine}-prayer-end.png`});
    await p.locator('#mobile-menu-btn').tap(); await p.keyboard.press('Escape');
    assert.equal(await p.evaluate(()=>document.activeElement.id),'mobile-menu-btn');

    await p.goto(base+'baby-playbook/#handoff');
    await p.locator('textarea[name=notes]').fill('Mobile layout test.');
    await p.setViewportSize({width:390,height:430});
    await reachable(p.locator('#handoff-form button[type=submit], #handoff-form button.primary'));
    await p.getByRole('button',{name:'Save handoff',exact:true}).tap();
    await p.reload(); assert.equal(await p.locator('textarea[name=notes]').inputValue(),'Mobile layout test.');
    await p.setViewportSize({width:844,height:390}); await geometry(p,'family landscape');
    await p.setViewportSize({width:390,height:844});
    await p.locator('#theme-toggle').tap(); await geometry(p,'family night mode');

    await p.goto(base+'books/'); await p.locator('.cover-button').first().tap();
    await p.locator('#book-status').selectOption('reading');
    await p.locator('#percent').fill('42');
    await p.locator('#progress-form textarea[name=notes]').fill('A local test note.');
    await p.setViewportSize({width:390,height:430});
    await reachable(p.getByRole('button',{name:'Save changes',exact:true}));
    await p.getByRole('button',{name:'Save changes',exact:true}).tap();
    if(await p.locator('#detail-dialog').isVisible()) await p.getByRole('button',{name:'Close book',exact:true}).tap();
    await p.reload(); await p.locator('.cover-button').first().tap();
    assert.equal(await p.locator('#percent').inputValue(),'42');
    assert.equal(await p.locator('#progress-form textarea[name=notes]').inputValue(),'A local test note.');
    await reachable(p.getByRole('button',{name:'Add passage',exact:true}));
    await p.getByRole('button',{name:'Close book',exact:true}).tap();

    await p.setViewportSize({width:320,height:740});
    await p.goto(base+'model_usage/');
    await p.locator('#f-input').fill('1000'); await p.locator('#f-output').fill('200');
    await p.locator('.add-btn').tap(); await p.locator('.del-btn').first().waitFor();
    await geometry(p,'usage with entries');
    await reachable(p.locator('.del-btn').first());
    await p.screenshot({path:`${output}/${engine}-usage-entry.png`});
    await p.locator('.del-btn').first().tap();
    await p.locator('.empty-state').waitFor();

    await p.goto(base+'rosary-analytics/?demo=1');
    await p.locator('#daily-chart .day').first().tap();
    assert.match(await p.locator('#daily-chart-data .chart-detail').textContent(),/visitor-days/);
    await p.locator('#daily-chart .day').first().focus(); await p.keyboard.press('ArrowRight');
    assert.ok(await p.locator('#daily-chart .day').nth(1).evaluate(el=>el===document.activeElement));
    await reachable(p.locator('#daily-chart .day').last());
    await p.locator('#daily-chart .day').last().tap();
    await p.screenshot({path:`${output}/${engine}-analytics-chart.png`});

    await p.goto(base+'tiny-signs/#/settings');
    await p.getByRole('button',{name:'Use low light',exact:true}).tap();
    await geometry(p,'tiny low-light');
    await reachable(p.getByRole('button',{name:'Reset local history',exact:true}));
    await p.setViewportSize({width:390,height:844});
    await p.goto(base+'tiny-signs/#/learn/milk');
    await copySign(p); await p.getByRole('button',{name:'I practiced it'}).tap();
    await reachable(p.getByRole('button',{name:/Next for this routine/}));
    await p.screenshot({path:`${output}/${engine}-lesson-end.png`});
  } finally { await context.close(); await browser.close(); }
});
