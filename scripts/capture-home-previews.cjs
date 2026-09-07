// Capture real app screens from the local preview; no invented usage data.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const destination=path.join(__dirname,'../assets/home');
fs.mkdirSync(destination,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROME_CHANNEL?{channel:process.env.PLAYWRIGHT_CHROME_CHANNEL}:{})});
  try {
    const context=await browser.newContext({viewport:{width:960,height:600},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:8080/rosary-v2/');
    await page.locator('#style-select').selectOption('five');
    await page.locator('#start-btn').click();
    for(let i=0;i<3;i++)await page.locator('#next-btn').click();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(destination,'rosary.jpg'),type:'jpeg',quality:88});
    await page.goto('http://127.0.0.1:8080/little-signs/');
    for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByRole('button',{name:'Create my plan',exact:true}).click();
    await page.getByRole('link',{name:'Learn',exact:true}).click();
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.grid-list .sign-card').first().waitFor();
    await page.locator('.grid-list .sign-card').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(destination,'little-signs.jpg'),type:'jpeg',quality:88});
    await page.goto('http://127.0.0.1:8080/model_usage/');
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(destination,'model-usage.jpg'),type:'jpeg',quality:88});
    console.log('Captured Rosary, Little Signs and Model Usage at 960 x 600.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
