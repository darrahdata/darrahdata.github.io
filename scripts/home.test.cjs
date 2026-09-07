const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('homepage is responsive, accessible by keyboard, and links to existing apps', async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || 'chrome' });
  fs.mkdirSync('/tmp/home-review', { recursive: true });
  try {
    const page = await browser.newPage();
    for (const width of [320, 360, 390, 430, 768, 1280]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto('http://127.0.0.1:8080/');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow at ' + width);
      assert.deepEqual(await page.locator('a').evaluateAll(links => links.filter(link => !link.classList.contains('skip-link') && link.getBoundingClientRect().height < 44).map(link => link.textContent)), []);
      assert.equal(await page.locator('main h1').count(), 0);
      assert.equal(await page.locator('h1').count(), 1);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: '/tmp/home-review/home-' + width + '.png', fullPage: true });
    }
    for (const link of await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => !href.startsWith('#') && !href.startsWith('http')))) {
      assert.equal((await page.request.get(new URL(link, page.url()).href)).status(), 200, link);
    }
    await page.goto('http://127.0.0.1:8080/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    await page.getByRole('link', { name: 'Data', exact: true }).click();
    assert.equal(new URL(page.url()).hash, '#data');
    assert.equal(await page.getByRole('link', { name: 'Open Little Signs' }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Open Baby Signs' }).count(), 0);
    await page.goto('http://127.0.0.1:8080/baby-signs/#startpath');
    await page.waitForURL('**/archive/baby-signs/#startpath');
    await page.getByRole('searchbox', { name: 'Search signs' }).fill('milk');
    assert.ok(await page.locator('#grid').innerText().then(text => /milk/i.test(text)));
    await page.goto('http://127.0.0.1:8080/little-signs/#/today');
    await page.waitForURL('**/archive/little-signs/#/today');
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Create my plan', exact: true }).click();
    await page.getByRole('link', { name: 'Learn', exact: true }).click();
    await page.locator('.grid-list .sign-card').first().waitFor();
  } finally { await browser.close(); }
});
