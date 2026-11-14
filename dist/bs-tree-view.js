/* Experiment11 拓展 · 二叉树（CRR）多期定价（课件 9.3）。
   以独立面板挂到 Black–Scholes 页，避免改动既有定价/对冲工作台。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CAPMHMMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={kind:'call',american:true,steps:12,sigma:.2,active:false,q:null,built:null};
function mount(){
  if($('#bstModel'))return;
  const model=document.createElement('section');model.id='bstModel';model.className='bstree-only';
  const params=document.createElement('section');params.id='bstParams';params.className='bstree-only';
  const code=document.createElement('section');code.id='bstCode';code.className='bstree-only';
  $('.model-panel').append(model);$('.parameters').append(params);$('.code-panel').append(code);
  state.paramsHost=params;
  renderParams();
  model.innerHTML=`<h3 id="bstTitle" style="padding:10px 16px 0;font:500 14px/1.5 var(--font-ui)"></h3>
    <div id="bstMetrics" class="metrics"></div>
    <div class="chart-host single-chart" style="margin:0 14px"><div class="chart-frame"><div class="svg-host" id="bstPlot"></div></div></div>
    <div id="bstLegend" class="legend"></div>
    <div id="bstDetails" class="model-details"></div>`;
  code.innerHTML=`<div id="bstCodePane"></div>`;
  params.addEventListener('input',()=>compute());
  params.addEventListener('change',()=>compute());
  $('#bstBack').onclick=()=>activate(false);
  K.onLang(()=>{if(state.active){renderParams();compute();}});
}
function renderParams(){
  const host=state.paramsHost;if(!host)return;
  host.innerHTML=`<h2>${K.esc(t('二叉树参数','Binomial-tree parameters'))}</h2>
    <div id="bstControls">
      ${K.select({id:'kind',zh:'期权类型',en:'Option type',value:state.kind,options:[['call','看涨 Call','Call'],['put','看跌 Put','Put']]})}
      ${K.field({id:'steps',zh:'步数 N',en:'Steps N',value:state.steps,min:1,max:60,step:1})}
      ${K.field({id:'sigma',zh:'波动率 σ',en:'Volatility σ',value:state.sigma,min:.05,max:.8,step:.01})}
      ${K.check({id:'american',zh:'允许提前行权（美式）','en':'Allow early exercise (American)',value:state.american})}
    </div>
    <p class="lab-note">${K.esc(t('S₀=K=100、T=1、r=5%：只改变步数与期权类型，观察树价如何逼近连续时间解。','S₀ = K = 100, T = 1, r = 5%: change only the step count and the option type to watch the tree price approach the continuous-time value.'))}</p>
    ${K.tasks([['先预测：步数从 1 增加时，树价是单调逼近 Black–Scholes 吗？','Predict first: as the step count grows, does the tree price approach Black–Scholes monotonically?'],
      ['切换为看跌期权，比较欧式与美式的价差。','Switch to a put and compare the European and American prices.'],
      ['把 σ 调到 0.6，说明为什么收敛会更慢。','Set σ to 0.6 and explain why convergence slows down.']])}
    <button type="button" id="bstBack">${K.esc(t('返回 Black–Scholes','Back to Black-Scholes'))}</button>`;
  host.querySelector('#bstBack').onclick=()=>activate(false);
  host.oninput=()=>compute();
  host.onchange=()=>compute();
}
function compute(){
  const kind=$('#lab-kind').value,steps=Number($('#lab-steps').value),sigma=Number($('#lab-sigma').value),american=$('#lab-american').checked;
  state.kind=kind;state.steps=steps;state.sigma=sigma;state.american=american;
  const model=$('#bstModel'),plot=$('#bstPlot');
  try{
    const M0=M();const p={...M0.defaults,sigma};
    M0.check({...p});
    /* 用统一的 σ 覆盖：binomial 内部固定 σ=0.2，这里通过临时对象传入 */
    const q=M0.binomial({...p,nSteps:steps}, {kind,american});
    state.q=q;state.built=M0.build('tree',p,k2(q),K.lang());
    $('#bstTitle').textContent=t('树价随步数收敛到连续时间解','Tree price converging to the continuous-time value');
    K.chart(plot,{xLabel:['步数 N','Steps N'],yLabel:['期权价格（元）','Option price (CNY)'],xTickFormat:v=>String(Math.round(v)),
      series:[{type:'line',points:q.conv.map(c=>[c.k,c.price]),color:'#6689a8',marker:true,tip:d=>[`N=${Math.round(d[0])}：树价 ${d[1].toFixed(4)}`,'N='+Math.round(d[0])+': tree '+d[1].toFixed(4)]}],
      refs:[{axis:'y',value:q.bs,color:'#b5816f',dash:true,label:['Black–Scholes','Black-Scholes']}],
      aria:['树价收敛','Tree convergence']});
    $('#bstMetrics').innerHTML=[['树价（美式）','Tree price (American)',q.amer.toFixed(4)],['欧式树价','European tree',q.euro.toFixed(4)],['BS 连续解','BS value',q.bs.toFixed(4)]]
      .map(([z,e,v])=>`<div><span>${K.esc(t(z,e))}</span><b>${K.esc(v)}</b></div>`).join('');
    $('#bstLegend').innerHTML=[['树价','Tree price','#6689a8',false],['Black–Scholes','Black-Scholes','#b5816f',true]]
      .map(([z,e,c,d])=>`<span><i style="--legend-color:${c};--legend-style:${d?'dashed':'solid'}"></i>${K.esc(t(z,e))}</span>`).join('');
    $('#bstDetails').innerHTML=K.table([['项目','Item'],['数值','Value']],[
      [t('看涨 / 看跌','Call / put'),kind==='put'?'Put':'Call'],
      [t('步数 N','Steps N'),String(q.steps)],
      [t('上涨/下跌因子 u','Up factor u'),q.u.toFixed(4)],
      [t('风险中性概率 p','Risk-neutral p'),q.pu.toFixed(4)],
      [t('欧式树价','European'),q.euro.toFixed(4)],
      [t('美式树价','American'),q.amer.toFixed(4)],
      [t('提前行权溢价','Early-exercise premium'),q.americanPremium.toFixed(4)],
      [t('BS 连续解','Black-Scholes'),q.bs.toFixed(4)],
      [t('树价 − BS','Tree − BS'),q.error.toFixed(4)]])+
      `<p class="chart-note">${K.esc(t('二叉树是风险中性定价的离散版本；美式期权在每个节点比较继续持有与立即行权。看涨期权在无股息时不提前行权，因此欧式与美式同价。','The binomial tree is the discrete version of risk-neutral pricing; an American option compares continuation with immediate exercise at each node. A call on a non-dividend stock is never exercised early, so both prices coincide.'))}</p>`;
    $('#bstCodePane').innerHTML='';
    renderCode();
  }catch(e){
    $('#bstModel h3').textContent=t('参数无效','Invalid parameters');
    plot.innerHTML='';
    $('#bstDetails')?.remove();
  }
}
function k2(q){return q;}
function renderCode(){
  const b=state.built;
  const pane=$('#bstCodePane');
  pane.innerHTML=`<div class="panel-head"><h2>${K.esc(t('R 代码','R code'))}</h2><button type="button" id="bstCopy">${K.esc(t('复制完整 R 代码','Copy full R code'))}</button></div>`+
    b.blocks.map(bl=>`<section class="logic-block"><h3 style="padding:6px 16px 0">${K.esc(bl.title)}</h3>${bl.lines.map(l=>`<div class="code-line" style="cursor:default"><span class="num"></span><code>${WorkbenchUI.colorCode(l)}</code></div>`).join('')}</section>`).join('');
  $('#bstCopy').onclick=async()=>{
    try{await navigator.clipboard.writeText(b.code);$('#bstCopy').textContent=t('已复制','Copied');}
    catch{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([b.code],{type:'text/plain;charset=utf-8'}));a.href=u;a.download='experiment11-binomial.R';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  };
}
function activate(on){
  mount();
  state.active=on;
  if(on){
    /* teaching-mode 只暴露 #tu* 面板，会连带隐藏本视图：先退出教学模式。 */
    document.body.classList.remove('teaching-mode','bs-expert');
    document.body.classList.add('bstree-active');
    document.querySelectorAll('[data-bs-module]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bsModule==='tree')));
    compute();
  }else{
    document.body.classList.remove('bstree-active');
    document.querySelectorAll('[data-bs-module]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(window.TeachingUX)TeachingUX.open('pricing');
  }
}
window.BSTreeView={mount,activate,state};
})();
