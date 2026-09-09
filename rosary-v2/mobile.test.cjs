// Start the repo's static preview on port 8080, then run node --test this file.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const url = 'http://127.0.0.1:8080/rosary-v2/';
const output = '/tmp/rosary-review';
fs.mkdirSync(output, {recursive:true});

test('responsive reading, safe navigation, preferences, resume and menu', async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROME_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHROME_CHANNEL} : {})});
  const errors = [], analytics = [];
  try {
    for (const [width,height] of [[320,700],[360,760],[390,844],[430,932],[768,1024],[1280,900]]) {
      const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if(request.url().includes('/collect')) analytics.push(request.url()); });
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => innerWidth), width);
      await page.screenshot({path:`${output}/setup-${width}.png`,fullPage:true});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByText('Reading preferences',{exact:true}).click();
      await page.locator('#guided-mode').check();
      await page.locator('#reading-size').selectOption('extra');
      await page.locator('#start-btn').click();
      const initial = await page.locator('#dock-progress').textContent();
      await page.mouse.click(width/2,200);
      assert.equal(await page.locator('#dock-progress').textContent(),initial);
      await page.mouse.click(width-4,200);
      const second = await page.locator('#dock-progress').textContent();
      assert.notEqual(second,initial);
      await page.mouse.click(4,200);
      assert.equal(await page.locator('#dock-progress').textContent(),initial);
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#dock-progress').textContent(),initial);
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#dock-progress').textContent(),second);
      await page.reload();
      await page.locator('#resume-btn').click();
      assert.equal(await page.locator('#dock-progress').textContent(),second);
      assert.equal(await page.locator('body').getAttribute('data-reading-size'),'extra');
      assert.ok(await page.locator('#next-btn').isVisible());
      await page.locator('#next-btn').click();
      assert.match(await page.locator('#dock-progress').textContent(),/Prayer 3 of/);
      if(width<=560) {
        await page.locator('#mobile-menu-btn').click();
        assert.ok(await page.locator('#mobile-menu-sheet').isVisible());
        const index = await page.locator('#dock-progress').textContent();
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#dock-progress').textContent(),index);
        await page.screenshot({path:`${output}/menu-${width}.png`});
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.id),'mobile-menu-btn');
        await page.locator('#mobile-menu-btn').click();
        await page.locator('#mobile-common-prayer-select').selectOption('hailHolyQueen');
        await page.getByRole('button',{name:'Open selected prayer'}).click();
      } else {
        await page.getByRole('button',{name:'Return to setup'}).click();
        await page.locator('details[aria-label="Common prayers"] summary').click();
        await page.locator('#common-prayer-select').selectOption('hailHolyQueen');
        await page.getByRole('button',{name:'Open prayer',exact:true}).click();
      }
      await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if(width<=560) assert.ok(await page.evaluate(() => document.getElementById('prayer-text').getBoundingClientRect().bottom < document.getElementById('mobile-prayer-dock').getBoundingClientRect().top));
      await page.screenshot({path:`${output}/long-prayer-${width}.png`,fullPage:true});
      if(width<=560) {
        await page.locator('#mobile-menu-btn').click();
        await page.locator('#menu-next-btn').click();
      } else await page.locator('#next-btn').click();
      assert.ok(await page.locator('#screen-complete').isVisible());
      await page.getByRole('button',{name:'Pray again',exact:true}).click();
      assert.equal(await page.locator('#prayer-name').textContent(),'Hail, Holy Queen');
      await context.close();
    }
    assert.deepEqual(errors,[]);
    assert.deepEqual(analytics,[]);
  } finally { await browser.close(); }
});
