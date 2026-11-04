const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
const M=require('../dist/timeseries-math');
const outDir=process.env.FINMODEL_TEST_OUT||path.join(__dirname,'ui-i18n');
fs.mkdirSync(outDir,{recursive:true});
const url=process.env.FINMODEL_URL||'http://127.0.0.1:8765';
async function scan(p) {
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
  return p.evaluate(()=>{
    const visible=e=>e?.getClientRects().length && !e.closest('[hidden],[data-fml-skip],.fml-lang');
    const set=new Set(), add=s=>{if(s&&/\p{Script=Han}/u.test(s))set.add(s.trim());};
    add(document.title);
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(w.nextNode()){const n=w.currentNode,e=n.parentElement;if((visible(e)||e?.tagName==='OPTION'&&visible(e.closest('select'))) && !e.closest('script,style'))add(n.nodeValue);}
    for(const e of document.querySelectorAll('[aria-label],[title],[placeholder],[aria-valuetext]'))if(visible(e))for(const a of ['aria-label','title','placeholder','aria-valuetext'])add(e.getAttribute(a));
    return [...set];
  });
}
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});
 const failures=[];
 p.on('pageerror',e=>failures.push(e.message));
 const out={};
 try{
 for(const model of ['regression','timeseries','garch','var','portfolio','capm','bs']){
   const route=model==='portfolio'?'/index.html':'/experiments.html?model='+model;
   await p.goto(url+route);
   await p.evaluate(()=>FinModelI18n.set('en'));
   const values=new Set();
   const computeState=()=>p.evaluate(()=>JSON.stringify({
     reg:window.RegLab?.snapshot(),port:window.PortfolioMultiLab?.getState(),
     vol:window.VolLab?.snapshot?.(),risk:window.RiskLab?.snapshot?.(),capm:window.CAPMLab?.snapshot?.()
   }));
   const translate=lang=>p.locator('.fml-lang [data-lang='+lang+']').click();
   assert.equal(await p.locator('html').getAttribute('lang'),'en');
   async function collect(){for(const s of await scan(p))values.add(s);}
   await collect();
   const initial=await computeState();
   await translate('zh');
   assert.equal(await computeState(),initial);
   assert.equal(await p.locator('html').getAttribute('lang'),'zh-CN');
   await translate('en');
   assert.equal(await computeState(),initial);
   for(const id of ['#help','#teacher','#catalog','#catalogHeader','#rStudioPractice']){
     const e=p.locator(id);if(!await e.isVisible())continue;
     await e.click();await collect();await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
   }
   const selector='[data-ts-view],[data-reg-view],#regControls button,[data-risk-method],[data-risk-chart],[data-vchart],[data-capm-view],[data-bs-module],[data-module],[data-capm-view],[data-risk-view],[data-vol-view]';
   const buttons=await p.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,attrs:[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])})).filter(e=>e.attrs.length));
   for(const item of buttons){const e=p.locator(item.tag+item.attrs.map(([k,v])=>'['+k+'='+JSON.stringify(v)+']').join('')).first();if(!await e.isVisible())continue;await e.click().catch(()=>{});await collect();
    await p.locator('#details details:not([open]), #inputs details:not([open]), #tsData:not([open]), #regData:not([open]), #volData:not([open]), #riskData:not([open]), #assumptionDetails:not([open]), #multiData:not([open])').evaluateAll(els=>els.forEach(e=>e.open=true));
    await collect();
    if(model==='timeseries'){
      const state=()=>p.evaluate(()=>JSON.stringify(TimeSeriesLab.snapshot()));
      const before=await state();
      await translate('zh');
      assert.equal(await state(),before,'Chinese switch preserves numerical state and R script');
      await translate('en');
      assert.equal(await state(),before,'English switch preserves numerical state and R script');
      const select=p.locator('#tsControls select');
      for(const opt of await select.locator('option').evaluateAll(es=>es.map(e=>e.value))){await select.selectOption(opt);await collect();await p.locator('#details details').evaluateAll(els=>els.forEach(e=>e.open=true));await collect();}
      for(const [k,v] of [['data-block','data'],['data-block','adf'],['data-block','kpss'],['data-block','arma'],['data-block','granger'],['data-block','lstm']]){
        const btn=p.locator('#tsCodeNav ['+k+'='+v+']'); if(await btn.isVisible()){await btn.click();await collect();}
      }
      const point=p.locator('#tsPlot [data-point]').first(); if(await point.isVisible()){await point.focus();await collect();}
    }
   }
   if(model==='timeseries') {
     const go=k=>p.locator('[data-ts-view='+k+']').click();
     const val=async(k,v)=>p.locator('#ts-'+k).selectOption(v);
     const snap=()=>p.evaluate(()=>TimeSeriesLab.snapshot());
     const shot=name=>p.screenshot({path:path.join(outDir,name+'.png')});
     await go('var');
     await val('varChart','forecast');
     await shot('var-en');
     await translate('zh');await shot('var-zh');await translate('en');
     const group=p.locator('fieldset.ts-choice').first(), chips=group.getByRole('checkbox');
     assert.equal(await chips.count(),3);
     assert.equal(await group.locator('input:checked').count(),2);
     await chips.nth(2).focus();await p.keyboard.press('Space');
     assert.deepEqual((await snap()).opt.vars,[0,1,2]);
     assert.equal((await snap()).last.q.fit.m,3);
     assert.match((await snap()).script,/columns <- c\(1, 2, 3\)/);
     assert.equal(await p.evaluate(()=>document.activeElement.value),'2');
     await val('varChart','granger');
     assert.equal(await p.locator('[data-direction]').count(),6);
     for(const [direction,card] of (await p.locator('[data-direction]').all()).entries()){
       assert.match(await card.locator('b').innerText(),/^p = [-.\de]+$/i);
       await card.click();await collect();
     }
     await shot('granger-en');
     await chips.nth(2).uncheck();await chips.nth(1).uncheck();
     assert.equal((await snap()).last,null);
     assert.equal(await p.locator('#copy').isDisabled(),true);
     await collect();
     await translate('zh');assert.match(await p.locator('#validation').innerText(),/至少两个/);
     await translate('en');assert.match(await p.locator('#validation').innerText(),/at least two/);
     await p.locator('#reset').click();
     await go('compare');
     const defaultState=JSON.stringify(await snap());
     await translate('zh');await translate('en');assert.equal(JSON.stringify(await snap()),defaultState);
     await shot('compare-en');
     await p.locator('#tsData').evaluate(e=>e.open=true);
     const upload=async bad=>{
       const d=M.transform(M.generate(),'log');
       const lines=['Date,Asset A,Asset B',...d.rows.slice(0,88).map((r,i)=>[
         new Date(Date.UTC(2025,0,(bad&&i===5?4:i)+1)).toISOString().slice(0,10),r[0],r[1]].join(','))];
       await p.locator('#tsFile').setInputFiles({name:'example.csv',mimeType:'text/csv',buffer:Buffer.from(lines.join('\n'))});
       await p.locator('#tsDate').selectOption('Date');await p.locator('#tsTarget').selectOption('Asset A');
       await p.locator('[data-csv-column="2"]').check();
       await p.locator('#tsKind').selectOption('log');
       await p.locator('#tsImport').click();await collect();
     };
     await upload(true);assert.match(await p.locator('#tsDataError').innerText(),/Duplicate date/);
     await upload(false);assert.equal((await snap()).data.rows.length,88);
     assert.match((await snap()).script,/Asset A/);
     assert.match((await snap()).last.models.LSTM.error,/没有匹配权重/);
     const current=JSON.stringify(await snap());
     await translate('zh');await translate('en');assert.equal(JSON.stringify(await snap()),current);
     await p.locator('#tsData').evaluate(e=>e.open=false);
     await p.locator('#tsTrain').click();
     await p.waitForFunction(()=>TimeSeriesLab.snapshot().last?.models.LSTM?.prediction);
     const trained=JSON.stringify(await snap());
     await translate('zh');await translate('en');assert.equal(JSON.stringify(await snap()),trained);
     await collect();
     await p.locator('#details details').evaluateAll(es=>es.forEach(e=>e.open=true));
     await collect();
     await shot('trained-csv-en');
     await p.locator('#inputs details').filter({hasText:'LSTM Inputs and Training'}).evaluate(e=>e.open=true);
     const features=await p.locator('[data-list=features]:checked').evaluateAll(inputs=>inputs.map(input=>input.value));
     for (const value of features) await p.locator('[data-list=features][value="'+value+'"]').uncheck();
     await p.locator('#tsTrain').click();
     assert.match(await p.locator('#tsTrainStatus').innerText(),/Training failed/);
     assert.equal((await snap()).last.models.LSTM.prediction,undefined);
     await collect();
   }
   out[model]=[...values];
   console.log(model,values.size+' untranslated product strings');
 }
   assert.deepEqual(failures,[]);
   const profile=fs.mkdtempSync(path.join(os.tmpdir(),'finmodel-i18n-zoom-'));
   const z=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:1366,height:768}});
   try {
     const config=await z.newPage();await config.goto('chrome://settings/appearance');
     await config.locator('#zoomLevel').selectOption('1.25');
     const zoom=await z.newPage();await zoom.goto(url+'/experiments.html?model=timeseries');
     await zoom.locator('.fml-lang [data-lang=en]').click();await zoom.locator('[data-ts-view=var]').click();
     assert.equal(await zoom.evaluate(()=>devicePixelRatio),1.25);
     const size=await zoom.locator('.ts-chips').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,height:el.offsetHeight}));
     assert(size.scroll<=size.width+1 && size.height<=130,JSON.stringify(size));
     await zoom.screenshot({path:path.join(outDir,'var-en-125.png')});
     out.zoom125=await scan(zoom);
   } finally { await z.close();fs.rmSync(profile,{force:true,recursive:true}); }
 }finally{
   fs.writeFileSync(path.join(outDir,'residual.json'),JSON.stringify(out,null,2));
   await b.close();
 }
 for(const [model,issues] of Object.entries(out))assert.deepEqual(issues,[],model+' residual Han text');
})().catch(e=>{console.error(e);process.exitCode=1;});
