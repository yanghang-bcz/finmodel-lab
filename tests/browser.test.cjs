// Optional standalone replay; actual in-app browser evidence lives in tests/v1.8/.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.FINMODEL_URL||'http://127.0.0.1:8765');
const text=s=>page.locator(s).innerText(),phase=()=>page.locator('body').getAttribute('data-exploration');
await page.locator('#saveBaseline').click();await page.locator('#rho').fill('-.5');assert(await page.locator('#comparison').isVisible());
await page.locator('#exploreToggle').click();assert.equal(await phase(),'Predict');assert(await page.locator('#comparison').isHidden());assert.equal(await page.locator('#comparisonText').textContent(),'');
for(const id of ['w','mu1','mu2','s1','s2','rho','rhoSlider'])assert(await page.locator('#'+id).isDisabled());
await page.locator('[data-prediction="up"]').click();assert.equal(await phase(),'Predict');await page.locator('#confirmPrediction').click();assert.equal(await phase(),'Experiment');assert(await page.locator('#explainVariance').isDisabled());
await page.locator('#rho').fill('-.8');assert(await page.locator('#riskMetric #comparison').isVisible());assert(!(await text('#returnMetric')).includes('百分点'));
await page.locator('#explainVariance').click();assert.equal(await phase(),'Explain');assert.match(await text('#exploreExplanation'),/预测与实验结果不一致/);assert(await page.locator('#rho').isDisabled());
await page.locator('#reexperiment').click();assert.equal(await phase(),'Experiment');assert.equal(Number(await page.locator('#rho').inputValue()),-.5);assert(await page.locator('#comparison').isHidden());
await page.locator('#rho').fill('-.7');await page.locator('#restartExplore').click();assert.equal(await phase(),'Predict');assert.equal(await page.locator('#exploreExplanation').textContent(),'');
await page.locator('#exitExplore').click();assert.equal(await phase(),'Idle');assert.equal(Number(await page.locator('#rho').inputValue()),-.5);assert(await page.locator('#comparison').isHidden());
await page.locator('#reset').click();await page.locator('#copy').click();const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(copied.split('\n').length,38);assert(!/vp_stable|stopifnot|double.eps/.test(copied));
for(const size of [{width:1440,height:900},{width:1366,height:768},{width:1920,height:1080}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollHeight===innerHeight&&document.documentElement.scrollWidth===innerWidth));}
await page.locator('#projector').click();assert.equal(await page.locator('.code-line').first().evaluate(e=>getComputedStyle(e).fontSize),'19px');await page.locator('#projector').press('Escape');
await page.setViewportSize({width:375,height:812});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),375);
assert.deepEqual(errors,[]);await browser.close();console.log('PASS v1.8 state isolation, explicit confirmation, result placement, lifecycle, copy, responsive and projection.');
})().catch(e=>{console.error(e);process.exit(1)});
