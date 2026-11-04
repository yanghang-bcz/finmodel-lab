/* Live Chrome acceptance. Requires the FinModel preview and Playwright. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const M = require('../dist/timeseries-math');
const L = require('../dist/timeseries-lstm');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.FINMODEL_URL || 'http://127.0.0.1:8765';
const root = path.resolve(__dirname, '..');
const out = process.env.FINMODEL_TEST_OUT || path.join(__dirname, 'experiment05');
const manifest = require('../dist/build-manifest.json');
const desktop = [[1920,1080],[1440,900],[1366,768]];
const ids = ['station','arma','var','compare'];
const route = '/experiments.html?model=timeseries';
const online = ['04','05','06','07','08','09','11'];
const checks = [], errors = [], screenshots = [], builds = [], rFiles = [];
const browserOptions = {channel:'chrome',headless:true};
const permissions = ['clipboard-read','clipboard-write'];
fs.mkdirSync(out,{recursive:true});
function pass(name) { checks.push(name); console.log('PASS',name); }
function near(x,y,tol=1e-10) { assert(Math.abs(x-y)<=tol, String(x)+' vs '+String(y)); }
function csv(file, text) { return {name:file+'.csv',mimeType:'text/csv',buffer:Buffer.from(text)}; }
function uploadSeries(n, columns, badDate=false) {
  return ['date,'+columns.join(','),...M.transform(M.generate(),'log').rows.slice(0,n).map((r,i) => {
    const day=new Date(Date.UTC(2024,0,1+(badDate&&i===3?i-1:i))).toISOString().slice(0,10);
    return [day,...r.slice(0,columns.length)].join(',');
  }).reverse()].join('\n');
}
function rowsMatch(page, v) {
  return page.locator('#catalogDialog .course-row').evaluateAll(elements => elements.map(el => ({
    number:el.dataset.number, online:el.dataset.online, href:el.getAttribute('href'), current:el.getAttribute('aria-current'), disabled:!!el.disabled
  }))).then(rows => {
    assert.deepEqual(rows.map(r=>r.number),Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')));
    assert.deepEqual(rows.filter(r=>r.online==='true').map(r=>r.number),online);
    assert(rows.filter(r=>r.online==='false').every(r=>r.disabled&&!r.href));
    assert.equal(rows.find(r=>r.number==='05').href,'experiments.html?model=timeseries');
    assert.equal(rows.find(r=>r.current==='page').number,v);
  });
}
async function fonts(page) {
  await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>[...document.fonts].some(f=>f.status==='loaded')));
}
async function shot(page, file) {
  await fonts(page);
  await page.screenshot({path:path.join(out,file+'.png'),animations:'disabled'});
  screenshots.push(file+'.png');
}
async function layout(page, where) {
  const result=await page.evaluate(()=>{
    const $=s=>document.querySelector(s), rect=s=>$(s).getBoundingClientRect().toJSON();
    return {page:document.documentElement.scrollWidth,inner:innerWidth,height:innerHeight,
      copy:rect('#copy'),code:rect('#code'),controls:rect('#tsControls'),chart:rect('#tsPlot svg'),model:rect('.model-panel')};
  });
  assert(result.page<=result.inner,where+' document horizontal overflow');
  assert(result.copy.bottom<=result.height,where+' copy offscreen');
  assert(result.code.height>=105,where+' R pane too short');
  assert(result.chart.x>=result.model.x&&result.chart.right<=result.model.right+1,where+' chart horizontal clipping');
  assert(result.chart.height>=180&&result.chart.bottom<=result.model.bottom+1,where+' chart vertical clipping');
  assert(result.controls.bottom<result.chart.top,where+' controls overlap plot');
  return result;
}
async function runLab(page) {
  const requests=[], responses=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
  page.on('response',r=>responses.push({url:r.url(),status:r.status()}));
  const $=s=>page.locator(s), snap=()=>page.evaluate(()=>TimeSeriesLab.snapshot());
  const num=async(id,n)=>{await $('#ts-'+id).fill(String(n));await $('#ts-'+id).press('Tab');};
  const change=(id,v)=>$('#ts-'+id).selectOption(String(v));
  const tab=async id=>{
    await $('[data-ts-view='+id+']').click();
    assert.equal((await snap()).view,id);
    await $('.model-panel').evaluate(el=>el.scrollTop=0);
    await page.mouse.move(200,35);
  };
  const copy=async(name,needle)=>{
    await $('#copy').click();
    const actual=await page.evaluate(()=>navigator.clipboard.readText());
    assert.equal(actual,(await snap()).script);
    assert(actual.includes(needle));
    fs.writeFileSync(path.join(out,name+'.R'),actual);
    const run=spawnSync('Rscript',['--vanilla',path.join(out,name+'.R')],{
      encoding:'utf8',env:{...process.env,FINMODEL_R_PLOT:path.join(out,name+'.pdf')}
    });
    assert.equal(run.status,0,run.stderr||String(run.error));
    fs.writeFileSync(path.join(out,name+'.log'),run.stdout+run.stderr);
    rFiles.push(name+'.R');
  };
  const upload=async(name,source,target,extra=[])=>{
    await $('#tsFile').setInputFiles(csv(name,source));
    await $('#tsTarget').waitFor();
    await $('#tsDate').selectOption('date');
    if(target)await $('#tsTarget').selectOption(target);
    for(const i of extra)await $('[data-csv-column="'+i+'"]').check();
    await $('#tsKind').selectOption('log');
    await $('#tsImport').click();
  };
  await page.goto(base+route);
  await fonts(page);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.finmodelBuild),manifest.buildId);
  const served=await page.request.get(base+'/build-manifest.json');
  assert.equal((await served.json()).buildId,manifest.buildId);
  for(const [file,hash] of Object.entries(manifest.assets)) {
    const response=await page.request.get(base+'/'+file);
    assert(response.ok(),file);
    assert.equal(createHash('sha256').update(await response.body()).digest('hex'),hash,file);
  }
  builds.push(manifest.buildId);
  assert.equal(await $('[data-code-mode=full]').getAttribute('aria-pressed'),'true');
  const initial=await snap(), source=JSON.stringify(initial.data), transformed=M.transform(initial.data,'log');
  assert.equal(initial.data.rows.length,721);
  assert.equal(initial.last.adfReject,true);
  assert.equal(initial.last.kpssReject,false);
  near(initial.last.tau,-12.269125851174728);
  near(initial.last.kpss,.3120649015018533);
  await shot(page,'01-station-1440');
  await change('form','price');
  assert.equal((await snap()).last.adfReject,false);
  assert((await snap()).script.includes('Y <- raw'));
  await change('form','simple');
  assert((await snap()).script.includes('/raw[-nrow(raw)'));
  await change('form','log');
  await change('adf','trend');
  await num('adfLag',5);
  await change('kpss','trend');
  let s=await snap();
  assert.equal(s.last.critical,-3.41);
  assert.equal(s.last.kCritical,.146);
  assert(s.script.includes('"trend" , 5L'));
  for(const chart of ['acf','pacf']) {
    await change('stationChart',chart);
    assert.equal(await $('#tsPlot svg').count(),1);
    assert.equal(await $('#tsPlot [data-point]').count(),24);
  }
  await copy('copied-station','pacf(y');
  pass('价格、简单和对数收益、ADF、KPSS、ACF/PACF、R 脚本');
  const tip=$('#tsTip'), point=$('#tsPlot [data-point]').nth(5);
  await point.hover();
  assert.equal(await tip.getAttribute('data-state'),'preview');
  await page.mouse.move(195,25);
  assert(!await tip.isVisible());
  await point.click();
  await page.mouse.move(195,25);
  assert.equal(await tip.getAttribute('data-state'),'pinned');
  await page.keyboard.press('Escape');
  assert(!await tip.isVisible());
  await point.click();
  await tip.locator('button').click();
  assert(!await tip.isVisible());
  await point.click();
  await tab('arma');
  assert(!await tip.isVisible());
  assert.equal(JSON.stringify((await snap()).data),source);
  pass('悬停消失、点击固定、Esc、关闭键、切换清除');

  s=await snap();
  assert.equal(s.last.q.fit.p,1);
  assert.equal(s.last.q.fit.q,1);
  await num('p',0);await num('q',0);
  assert.equal((await snap()).last.q.fit.p,0);
  assert.equal((await snap()).last.q.fit.q,0);
  await num('horizon',1);
  assert.equal((await snap()).last.forecast.length,1);
  await change('armaMode','auto');
  await change('armaIC','BIC');
  await num('horizon',10);
  s=await snap();
  assert.deepEqual([s.last.q.fit.p,s.last.q.fit.q],[1,0]);
  assert.equal(s.last.q.candidates.length,16);
  assert(s.last.forecast[9].hi95-s.last.forecast[9].lo95>s.last.forecast[0].hi95-s.last.forecast[0].lo95);
  near(s.last.forecast[0].value,.008196739497531063,1e-8);
  await shot(page,'02-arma-1440');
  for(const c of ['criteria','residual','resacf']) {
    await change('armaChart',c);
    assert.equal(await $('#tsPlot svg').count(),1);
  }
  assert((await $('#details').innerText()).includes('Ljung–Box'));
  assert((await snap()).last.test.p>0 && (await snap()).last.test.p<1);
  await copy('copied-arma','Box.test');
  pass('ARMA 手动与自动定阶、候选、Ljung–Box、一与十期预测和区间');

  await tab('var');
  const first=await snap();
  assert(first.last.max<1);
  assert(first.last.tests.find(v=>v.from===0&&v.to===1).p<.001);
  assert(first.last.tests.find(v=>v.from===1&&v.to===0).p>.05);
  await num('varLag',2);
  assert.equal((await snap()).last.q.fit.p,2);
  assert.equal((await snap()).last.forecast[0].length,2);
  await $('#inputs [data-list=vars][value="2"]').check();
  assert.equal((await snap()).last.forecast[0].length,3);
  await $('#inputs [data-list=vars][value="2"]').uncheck();
  await change('varMode','auto');
  await change('varIC','HQ');
  await change('varChart','criteria');
  assert.equal((await snap()).last.q.candidates.length,5);
  await change('varIC','BIC');
  await change('varChart','granger');
  await $('[data-direction="1,0"]').click();
  assert.equal((await snap()).opt.from,1);
  assert((await $('#details').innerText()).includes('行业 → 市场'));
  await shot(page,'03-var-granger-1440');
  await copy('copied-var','pf(F,p,fit$df');
  await change('varChart','forecast');
  await shot(page,'03-var-forecast-1440');
  assert.equal(JSON.stringify((await snap()).data),source);
  pass('VAR 一阶、二阶、三变量、共同定阶样本、稳定性、双向 Granger、联合预测');

  await tab('compare');
  s=await snap();
  assert.equal(s.last.model.version,'exp05-lstm-1');
  assert.equal(s.last.model.bestEpoch,10);
  assert.deepEqual([s.last.nt,s.last.nv,s.last.actual.length],[504,612,108]);
  assert.deepEqual(Object.keys(s.last.models),['Naive','ARMA','VAR','LSTM']);
  for(const [name,m] of Object.entries(s.last.models)) {
    assert.equal(m.prediction.length,s.last.actual.length,name);
    const e=m.prediction.map((v,i)=>v-s.last.actual[i]);
    near(m.rmse,Math.sqrt(e.reduce((sum,v)=>sum+v*v,0)/e.length));
    near(m.mae,e.reduce((sum,v)=>sum+Math.abs(v),0)/e.length);
  }
  near(s.last.models.Naive.prediction[0],transformed.rows[611][0]);
  near(s.last.models.LSTM.prediction[0],L.predict(transformed.rows,612,s.last.model));
  await shot(page,'04-compare-1440');
  for(const c of ['mae','prediction','errors','loss']) {
    await change('compareChart',c);
    assert.equal(await $('#tsPlot svg').count(),1);
  }
  await copy('copied-four-models','predictions$LSTM');
  await change('compareChart','rmse');
  await $('#tsCodeNav [data-block=lstm]').click();
  const pane=await page.evaluate(()=>({code:document.querySelector('#code').scrollTop,model:document.querySelector('.model-panel').scrollTop,page:scrollY}));
  assert(pane.code>200);assert.equal(pane.model,0);assert.equal(pane.page,0);
  await $('#code [data-block=lstm]').filter({hasText:'memory <- plogis'}).click();
  assert((await $('#explanation').innerText()).includes('遗忘门'));
  assert.equal(await $('#explanation .katex').count(),1);
  await $('[data-code-mode=basic]').click();
  assert.equal(await $('#code .logic-block').count(),1);
  await $('#copy').click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),(await snap()).script);
  await $('[data-code-mode=full]').click();
  pass('四模型共同 108 期、两误差指标、默认真实权重、图表、独立代码滚动与公式');

  await $('#tsData').evaluate(el=>el.open=true);
  const file=uploadSeries(145,['other','chosen','factor']);
  await upload('explicit-target',file,null);
  assert.equal(JSON.stringify((await snap()).data),source);
  await $('#tsTarget').selectOption('chosen');
  await $('[data-csv-column="1"]').check();
  await $('[data-csv-column="3"]').check();
  const networkStart=requests.length;
  await $('#tsImport').click();
  s=await snap();
  assert.deepEqual(s.data.names,['chosen','other','factor']);
  assert.equal(s.data.rows.length,145);
  assert.equal(s.data.dates[0],'2024-01-01');
  assert(s.data.warnings.some(w=>w.includes('排序')));
  assert(s.last.models.LSTM.error);
  assert(!s.script.includes('predictions$LSTM'));
  assert(requests.slice(networkStart).every(r=>r.method==='GET'&&r.url.startsWith(base)));
  await shot(page,'05-csv-data');
  await $('#tsTrain').click();
  await page.waitForFunction(()=>!!TimeSeriesLab.snapshot().last?.models.LSTM?.prediction);
  s=await snap();
  assert(s.last.model.curve.length>1);
  assert(s.last.model.bestEpoch>0);
  assert.equal(s.last.model.nt,Math.floor(145*.7));
  assert.equal(s.last.models.LSTM.prediction.length,s.last.actual.length);
  await copy('copied-csv-trained','predictions$LSTM');
  await upload('bad-date',uploadSeries(145,['other','chosen','factor'],true),'chosen',[1]);
  assert((await $('#tsDataError').innerText()).includes('重复日期'));
  assert.deepEqual((await snap()).data,s.data);
  await upload('one-variable',uploadSeries(60,['target']),'target');
  s=await snap();
  assert(s.last.models.VAR.error&&s.last.models.LSTM.error);
  await $('#inputs details').filter({hasText:'LSTM 输入与训练'}).evaluate(el=>el.open=true);
  await num('window',32);
  await $('#tsTrain').click();
  await page.waitForFunction(()=>TimeSeriesLab.snapshot().status.startsWith('训练失败'));
  assert((await snap()).last.models.LSTM.error.includes('训练失败'));
  assert(!(await snap()).script.includes('predictions$LSTM'));
  await tab('var');
  assert.equal((await snap()).last,null);
  assert(await $('#copy').isDisabled());
  await $('#reset').click();
  assert.equal(JSON.stringify((await snap()).data),source);
  await tab('compare');
  assert((await snap()).last.models.LSTM.prediction);
  await page.evaluate(()=>{document.querySelector('#tsTrain').click();document.querySelector('#tsCancel').click();});
  assert.equal((await snap()).status,'训练已取消。');
  assert((await snap()).last.models.LSTM.error);
  await $('#reset').click();
  pass('CSV 明确目标与日期对齐、训练 Worker、坏文件保留确认样本、新数据失效、单列与训练失败、取消、复位');

  await $('#catalog').click();
  await rowsMatch(page,'05');
  await $('.course-row[data-number="09"]').click();
  await page.waitForURL('**/experiments.html?model=capm');
  await page.goBack();
  await page.waitForFunction(()=>document.body.dataset.model==='timeseries');
  await page.goForward();
  await page.waitForFunction(()=>document.body.dataset.model==='capm');
  await page.goBack();
  await page.reload();
  await page.waitForFunction(()=>!!window.TimeSeriesLab);
  assert.equal((await snap()).view,'station');
  assert.equal(JSON.stringify((await snap()).data),source);
  assert(!await $('#tsTip').isVisible());
  pass('目录顺序、可用性、CAPM 导航、前进后退、刷新');

  for(const [width,height] of desktop) {
    await page.setViewportSize({width,height});
    for(const id of ids) {
      await tab(id);
      await layout(page,id+' '+width+'×'+height);
      await shot(page,id+'-'+width+'x'+height);
    }
    await $('#projector').click();
    assert.equal(await $('#projector').getAttribute('aria-pressed'),'true');
    await layout(page,'投屏 '+width+'×'+height);
    if(width===1366)await shot(page,'projector-1366x768');
    await $('#projector').click();
  }
  assert.deepEqual(requests.filter(r=>r.method!=='GET'),[]);
  assert.deepEqual(responses.filter(r=>r.status>=400),[]);
  pass('1920×1080、1440×900、1366×768 和投屏布局，浏览器全程无上传和失败资源');
}
async function zoom() {
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'finmodel05-zoom-'));
  const zc=await chromium.launchPersistentContext(profile,{...browserOptions,viewport:{width:1366,height:768}});
  try {
    const settings=await zc.newPage();
    await settings.goto('chrome://settings/appearance');
    await settings.locator('#zoomLevel').selectOption('1.25');
    const p=await zc.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    await p.goto(base+route);
    assert.equal(await p.evaluate(()=>devicePixelRatio),1.25);
    assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).zoom),'1');
    for(const id of ids) {
      await p.locator('[data-ts-view='+id+']').click();
      await p.locator('.model-panel').evaluate(el=>el.scrollTop=0);
      await layout(p,'125% '+id);
      await shot(p,'zoom125-'+id);
    }
    pass('Chrome 原生浏览器 125% 缩放下四视图');
  } finally {
    await zc.close();
    fs.rmSync(profile,{recursive:true,force:true});
  }
}
(async()=>{
  const browser=await chromium.launch(browserOptions);
  const context=await browser.newContext({viewport:{width:1440,height:900},permissions});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  try {
    await runLab(page);
    await zoom();
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({chrome:browser.version(),builds,checks,errors,screenshots,rFiles},null,2)+'\n');
  } catch(error) {
    await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
    fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({builds,checks,errors,error:error.stack},null,2)+'\n');
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
