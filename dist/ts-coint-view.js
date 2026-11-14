/* Experiment05 拓展视图：协整与 ECM（L14 第一节）。挂在时间序列工作台内。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CointMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.CointMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#tsCointControls');
  if(!host){host=document.createElement('section');host.id='tsCointControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('协整检验参数','Cointegration settings'))}</h3>
    <p class="lab-note">${K.esc(t('两条对数价格序列共享一个随机趋势；价差是否平稳，决定水平回归是不是伪回归。','Two log price series share a stochastic trend; whether the spread is stationary decides whether the level regression is spurious.'))}</p>
    ${K.select({id:'kind',zh:'情景',en:'Scenario',value:p.kind,options:[['coint','协整（价差均值回复）','Cointegrated (mean-reverting spread)'],['spurious','伪回归（价差随机游走）','Spurious (random-walk spread)']]})}
    ${K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:100,max:1200,step:50})}
    ${K.field({id:'phi',zh:'价差 AR(1) 系数 φ',en:'Spread AR(1) coefficient φ',value:p.phi,min:.5,max:.99,step:.01})}
    ${K.field({id:'beta',zh:'真实协整系数 β',en:'True cointegrating β',value:p.beta,min:.5,max:2,step:.05})}
    ${K.field({id:'lag',zh:'ADF/ECM 滞后阶数',en:'ADF/ECM lag order',value:p.lag,min:1,max:6,step:1})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：伪回归情景下水平回归的 t 值应该很大还是很小？','Predict first: in the spurious case, should the level regression t-statistic be large or small?'],
      ['把 φ 调到 0.98，观察价差 ADF 与 ECM 的 γ 如何一起变弱。','Set φ to 0.98 and watch the spread ADF and the ECM gamma weaken together.'],
      ['切换两种情景，说明为什么"高 R²"不能证明协整。','Switch scenarios and explain why a high R² does not establish cointegration.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#tsCointControls').querySelectorAll('input,select')){
    const id=el.id.replace(/^lab-/,'');
    if(el.tagName==='SELECT'){next[id]=el.value;continue;}
    const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const p=state.p;
  const host=$('#chartHost').querySelector('#tsPlot')?$('#tsPlot'):document.querySelector('#tsPlot');
  const plot=host||$('#chartHost');
  plot.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=plot.querySelector('.svg-host');
  plot.querySelector('h3').textContent=t('协整价差与 ±2σ 带','Cointegrating spread with ±2σ bands');
  try{
    const q=M().run(p);state.last=q;
    const sd=Math.sqrt(q.spread.reduce((s,v)=>s+v*v,0)/q.spread.length);
    K.chart(svg,{xLabel:['观测','Observation'],yLabel:['价差 u','Spread u'],yZero:true,
      series:[{type:'line',points:q.spread.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 个观测：价差 ${d[1].toFixed(4)}`,'Observation '+Math.round(d[0])+': spread '+d[1].toFixed(4)]}],
      refs:[{axis:'y',value:2*sd,color:'#b5816f',dash:true},{axis:'y',value:-2*sd,color:'#b5816f',dash:true},{axis:'y',value:0,color:'#9aa7b0',dash:false}],
      aria:['协整价差','Cointegrating spread']});
    K.metrics([['价差 ADF τ','Spread ADF τ',q.adfU.tau.toFixed(2)],['β̂','β̂',q.fit.b.toFixed(3)],['ECM γ','ECM γ',q.ecm.gamma.toFixed(3)]]);
    K.legend([['价差','Spread','#6689a8',false],['±2σ','±2σ','#b5816f',true],['零均值','Zero','#9aa7b0',false]]);
    K.details(K.table([['检验','Test'],['τ / 估计','Statistic'],['5% 临界值','5% critical']],[
      ['ADF x',q.adfX.tau.toFixed(2),q.adfX.crit[5].toFixed(2)],
      ['ADF y',q.adfY.tau.toFixed(2),q.adfY.crit[5].toFixed(2)],
      [t('ADF 价差（E-G）','ADF spread (E-G)'),q.adfU.tau.toFixed(2),q.adfU.crit[5].toFixed(2)],
      [t('协整系数 β̂','Cointegrating β̂'),q.fit.b.toFixed(4),'—'],
      [t('ECM γ','ECM γ'),q.ecm.gamma.toFixed(4),'—'],
      [t('ECM t 值','ECM t-stat'),q.ecm.t.toFixed(2),'—'],
      [t('半衰期（期）','Half-life (periods)'),Number.isFinite(q.ecm.halfLife)?q.ecm.halfLife.toFixed(2):'—','—'],
      [t('水平回归 R²','Level-regression R²'),q.fit.r2.toFixed(3),'—']])+
      `<p class="chart-note">${K.esc(t('结论：','Verdict: '))}${K.esc(q.adfU.reject?t('价差平稳，水平回归可作为协整关系；ECM 的 γ<0 表示偏离被逐步纠正。','The spread is stationary, so the level regression can be read as a cointegrating relation; a negative ECM gamma means deviations are corrected gradually.')
        :t('价差非平稳，水平回归很可能是伪回归；R² 高、t 值大都不能作为协整证据。','The spread is non-stationary, so the level regression is likely spurious; a high R² or a large t does not establish cointegration.'))}${K.esc(t(' E-G 临界值比普通 ADF 更负（约 −3.34），因为价差本身是估计出来的。',' The E-G critical value is more negative than the ordinary ADF one (about -3.34) because the spread is estimated.',' '))}</p>`);
    $('#validation').textContent='';
    state.built=M().build(p,q,K.lang());
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,onBuilt}){
  controls();
  const host=$('#tsCointControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.CointView={render,state};
})();
