const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

test('All apps links are consistent, mobile-safe, and preserve prayer state', async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHROME_CHANNEL || 'chrome' });
  fs.mkdirSync('/tmp/all-apps-review', { recursive: true });
  const paths = ['rosary-v2', 'tiny-signs', 'baby-playbook', 'model_usage', 'rosary-analytics', 'archive/baby-signs', 'archive/little-signs'];
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    for (const path of paths) {
      for (const width of [320, 360, 390, 430, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('http://127.0.0.1:8080/' + path + '/');
        const link = page.getByRole('link', { name: 'All apps', exact: true });
        await link.waitFor();
        assert.equal(await link.count(), 1, path);
        assert.equal(await link.evaluate(el => new URL(el.href).pathname), '/');
        const box = await link.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, path + ' touch target');
        assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height < 220, path + ' reachable header');
        assert.equal(await link.evaluate(el => getComputedStyle(el).borderRadius), '8px');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, path + ' width ' + width);
        await link.focus();
        assert.equal(await link.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
        if (width === 320 || width === 390) await page.screenshot({ path: '/tmp/all-apps-review/' + path.replaceAll('/', '-') + '-' + width + '.png' });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:8080/rosary-v2/');
    await page.locator('#start-btn').click();
    await page.keyboard.press('ArrowRight');
    const before = await page.locator('#dock-progress').textContent();
    await page.locator('#mobile-menu-btn').click();
    await page.getByRole('link', { name: 'All apps', exact: true }).click();
    await page.waitForURL('http://127.0.0.1:8080/');
    await page.goto('http://127.0.0.1:8080/rosary-v2/');
    await page.locator('#resume-btn').click();
    assert.equal(await page.locator('#dock-progress').textContent(), before);
    await page.getByRole('button', { name: 'Exit prayer', exact: true }).click();
    assert.ok(await page.locator('#screen-setup').isVisible());
    await page.getByRole('link', { name: 'All apps', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('http://127.0.0.1:8080/');
  } finally { await browser.close(); }
});
