/* Experiment08 拓展面板：切点组合、均值-CVaR 与高阶矩。挂在双资产/多资产模式旁边。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.PortfolioAdvMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.PortfolioAdvMath.defaults},built:null,q:null};
function mount(){
  if(document.getElementById('advWorkspace'))return;
  const nav=$('.portfolio-modes');if(!nav)return;
  const btn=document.createElement('button');btn.id='advMode';btn.type='button';btn.textContent=t('切点与 CVaR','Tangency & CVaR');
  nav.insertBefore(btn,nav.querySelector('span')||null);
  const panel=document.createElement('section');panel.id='advWorkspace';panel.className='workspace adv-workspace';panel.hidden=true;
  panel.innerHTML=`<article class="panel code-panel"><div class="panel-head"><h2 id="advCodeTitle">${K.esc(t('R 代码','R code'))}</h2><button type="button" id="advCopy">${K.esc(t('复制完整 R 代码','Copy full R code'))}</button></div><div class="code-regions" style="--code-fr:100fr;--explain-fr:0fr"><div id="advCode"></div></div></article>
    <article class="panel model-panel"><div class="panel-head"><h2 id="advViewTitle">${K.esc(t('组合视图','Portfolio view'))}</h2><span id="advKind">${K.esc(t('三资产 · 网格','Three assets · grid'))}</span></div>
      <div id="advMetrics" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 16px;padding:2px 16px 12px"></div>
      <div class="chart-host single-chart" style="flex:1;min-height:320px;margin:0 14px"><div class="chart-frame" style="display:flex;flex-direction:column;min-height:0"><h3 id="advChartTitle"></h3><div class="svg-host" id="advChart" style="flex:1;min-height:280px"></div></div></div>
      <div id="advLegend" class="legend"></div>
      <div id="advDetails" class="model-details"></div></article>
    <section class="panel parameters"><div class="panel-head"><h2 id="advParamTitle">${K.esc(t('参数','Parameters'))}</h2><button type="button" id="advReset">${K.esc(t('恢复默认','Reset'))}</button></div>
      <div class="parameters-scroll"><div id="advControls"></div><p id="advValidation" role="status"></p>
      <div id="advTasks"></div></div></section>`;
  const anchor=document.getElementById('multiWorkspace')||document.getElementById('workspace');
  anchor.after(panel);
  const dual=document.getElementById('dualMode'),multi=document.getElementById('multiMode');
  const hide=()=>{panel.hidden=true;btn.setAttribute('aria-pressed','false');};
  for(const b of [dual,multi])if(b){const old=b.onclick;b.onclick=e=>{hide();if(old)old.call(b,e);};}
  btn.onclick=()=>{
    panel.hidden=false;
    document.getElementById('workspace').hidden=true;
    const m=document.getElementById('multiWorkspace');if(m)m.hidden=true;
    btn.setAttribute('aria-pressed','true');
    for(const b of [dual,multi])if(b)b.setAttribute('aria-pressed','false');
    renderControls();compute();
  };
  panel.addEventListener('input',()=>{if(read())compute();});
  panel.addEventListener('change',()=>{if(read())compute();});
  document.getElementById('advReset').onclick=()=>{state.p={...M().defaults};renderControls();compute();};
  document.getElementById('advCopy').onclick=async()=>{const code=state.built?state.built.code:'';try{await navigator.clipboard.writeText(code);document.getElementById('advCopy').textContent=t('已复制','Copied');}catch{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([code],{type:'text/plain;charset=utf-8'}));a.href=u;a.download='experiment08-tangency-cvar.R';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}};
  const refresh=()=>{
    btn.textContent=t('切点与 CVaR','Tangency & CVaR');
    const set=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
    set('advCodeTitle',t('R 代码','R code'));set('advViewTitle',t('组合视图','Portfolio view'));set('advParamTitle',t('参数','Parameters'));
    set('advCopy',t('复制完整 R 代码','Copy full R code'));set('advReset',t('恢复默认','Reset'));
    const kind=document.getElementById('advKind');if(kind)kind.textContent=t('三资产 · 网格','Three assets · grid');
    const tasks=document.getElementById('advTasks');
    if(tasks)tasks.innerHTML=K.tasks([['先预测：最大夏普组合是否也是最小 CVaR 组合？','Predict first: is the maximum-Sharpe portfolio also the minimum-CVaR one?'],
      ['把置信水平从 95% 调到 99%，观察 CVaR 与最优权重如何变化。','Move the confidence level from 95% to 99% and watch CVaR and the optimal weights change.'],
      ['改变相关系数，说明为什么切点权重对估计误差非常敏感。','Change the correlations and explain why tangency weights are so sensitive to estimation error.']]);
  };
  refresh();
  K.onLang(()=>{refresh();if(!panel.hidden){renderControls();compute();}});
  renderControls();
}
function renderControls(){
  const p=state.p;
  document.getElementById('advControls').innerHTML=
    K.field({id:'alpha',zh:'CVaR 置信水平',en:'CVaR confidence',value:p.alpha,min:.9,max:.999,step:.005})+
    K.field({id:'rf',zh:'无风险月利率',en:'Risk-free (monthly)',value:p.rf,min:-.01,max:.02,step:.0005})+
    K.field({id:'months',zh:'样本月数',en:'Months',value:p.months,min:120,max:600,step:12})+
    K.field({id:'step',zh:'权重网格步长',en:'Weight grid step',value:p.step,min:.01,max:.2,step:.01})+
    K.field({id:'rho12',zh:'ρ(A,B)',en:'ρ(A,B)',value:p.rho12,min:-.95,max:.95,step:.05})+
    K.field({id:'rho13',zh:'ρ(A,C)',en:'ρ(A,C)',value:p.rho13,min:-.95,max:.95,step:.05})+
    K.field({id:'rho23',zh:'ρ(B,C)',en:'ρ(B,C)',value:p.rho23,min:-.95,max:.95,step:.05})+
    K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
}
function read(){
  const next={...state.p};
  for(const el of document.querySelectorAll('#advControls input')){
    const id=el.id.replace(/^lab-/,''),v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){document.getElementById('advValidation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){document.getElementById('advValidation').textContent=e.message;return null;}
  state.p=next;document.getElementById('advValidation').textContent='';return next;
}
function compute(){
  const p=state.p;
  try{
    const q=M().analyse(p);state.q=q;
    state.built=M().build(p,q,K.lang());
    const grid=q.grid;
    document.getElementById('advChartTitle').textContent=t('均值—标准差网格、有效前沿与三类最优组合','Mean–volatility grid, efficient frontier and three optima');
    K.chart(document.getElementById('advChart'),{xLabel:['日/月波动率 σ','Volatility σ'],yLabel:['期望收益 μ','Expected return'],
      xTickFormat:v=>K.pct(v,1),yTickFormat:v=>K.pct(v,2),
      series:[{type:'scatter',points:grid.map(g=>[g.sd,g.mean]),color:'#cfd8de',radius:1.8,opacity:.7},
        {type:'line',points:q.frontier.map(g=>[g.sd,g.mean]),color:'#659b8a',width:2.2},
        {type:'scatter',points:[[q.tan.sd,q.tan.mean]],color:'#6689a8',radius:7,tip:()=>[`切点组合：μ ${K.pct(q.tan.mean,2)}，σ ${K.pct(q.tan.sd,2)}`,`Tangency: μ ${K.pct(q.tan.mean,2)}, σ ${K.pct(q.tan.sd,2)}`]},
        {type:'scatter',points:[[q.minCVaR.sd,q.minCVaR.mean]],color:'#b5816f',radius:6,tip:()=>[`最小 CVaR：${K.pct(q.minCVaR.es95,2)}`,'Minimum CVaR: '+K.pct(q.minCVaR.es95,2)]},
        {type:'scatter',points:[[q.maxSkew.sd,q.maxSkew.mean]],color:'#9b88ac',radius:6,tip:()=>[`最大偏度：${q.maxSkew.skew.toFixed(3)}`,'Maximum skew: '+q.maxSkew.skew.toFixed(3)]}],
      aria:['组合网格与最优','Portfolio grid and optima']});
    const wf=w=>w.map(v=>K.pct(v,0)).join(' / ');
    document.getElementById('advMetrics').innerHTML=[
      [t('切点权重 A/B/C','Tangency weights'),wf(q.wTan)],
      [t('切点夏普','Tangency Sharpe'),q.tan.sharpe.toFixed(3)],
      [t('最小 CVaR','Minimum CVaR'),K.pct(q.minCVaR.es95,2)]]
      .map(([z,v])=>`<div style="min-width:0"><span style="display:block;font-size:11px;color:var(--muted)">${K.esc(z)}</span><b style="font:20px/1.5 var(--font-number);font-weight:500;overflow-wrap:anywhere">${K.esc(v)}</b></div>`).join('');
    document.getElementById('advLegend').innerHTML=[['全部可行组合','All feasible','#cfd8de',false],['有效前沿','Efficient frontier','#659b8a',false],['切点组合','Tangency','#6689a8',false],['最小 CVaR','Min CVaR','#b5816f',false],['最大偏度','Max skew','#9b88ac',false]]
      .map(([z,e,c,d])=>`<span><i style="--legend-color:${c};--legend-style:${d?'dashed':'solid'}"></i>${K.esc(t(z,e))}</span>`).join('');
    document.getElementById('advDetails').innerHTML=K.table([['组合','Portfolio'],['权重 A/B/C','Weights'],['μ','μ'],['σ','σ'],['夏普','Sharpe'],['CVaR','CVaR'],['偏度','Skew']],[
      [t('切点（解析）','Tangency'),wf(q.wTan),K.pct(q.tan.mean,2),K.pct(q.tan.sd,2),q.tan.sharpe.toFixed(3),K.pct(q.tan.es95,2),q.tan.skew.toFixed(2)],
      [t('网格最大夏普','Grid max Sharpe'),wf(q.maxSharpe.w),K.pct(q.maxSharpe.mean,2),K.pct(q.maxSharpe.sd,2),q.maxSharpe.sharpe.toFixed(3),K.pct(q.maxSharpe.es95,2),q.maxSharpe.skew.toFixed(2)],
      [t('最小 CVaR','Min CVaR'),wf(q.minCVaR.w),K.pct(q.minCVaR.mean,2),K.pct(q.minCVaR.sd,2),q.minCVaR.sharpe.toFixed(3),K.pct(q.minCVaR.es95,2),q.minCVaR.skew.toFixed(2)],
      [t('最大偏度','Max skew'),wf(q.maxSkew.w),K.pct(q.maxSkew.mean,2),K.pct(q.maxSkew.sd,2),q.maxSkew.sharpe.toFixed(3),K.pct(q.maxSkew.es95,2),q.maxSkew.skew.toFixed(2)]])+
      `<p class="chart-note">${K.esc(t('切点权重来自样本均值与样本协方差 Σ⁻¹(μ−rf)；网格上的"最大夏普"只是离散步长下的近似，两者可能相差几个百分点。最大夏普、最小 CVaR 与最大偏度通常不是同一个组合。','Tangency weights use the sample mean and covariance, Σ⁻¹(μ−rf); the grid maximum-Sharpe value is only a discrete approximation and can differ by a few points. Maximum Sharpe, minimum CVaR and maximum skewness are usually different portfolios.'))}</p>`;
    renderCode();
  }catch(e){document.getElementById('advValidation').textContent=e.message;}
}
function colorize(line){
  if(window.WorkbenchUI&&typeof WorkbenchUI.colorCode==='function')return WorkbenchUI.colorCode(line);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return esc(line).replace(/(#.*$)/,'<span class="syntax-comment">$1</span>');
}
function renderCode(){
  const b=state.built;if(!b)return;
  let n=0;
  document.getElementById('advCode').innerHTML=b.blocks.map(bl=>`<section class="logic-block">${bl.lines.map(l=>`<div class="code-line" style="cursor:default;min-width:100%;width:max-content"><span class="num">${++n}</span><code>${colorize(l)}</code></div>`).join('')}</section>`).join('');
  document.getElementById('advCode').style.cssText='overflow:auto;height:100%;padding:8px 0';
}
window.PortfolioAdvView={mount,state};
const boot=()=>{try{mount();}catch(e){console.error(e);}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
/* 多资产面板可能在加载后再创建模式导航，这里轮询等待，最多 8 秒。 */
let tries=0;const wait=()=>{if(document.getElementById('advMode'))return;boot();if(++tries<40)setTimeout(wait,200);};
setTimeout(wait,200);
})();
