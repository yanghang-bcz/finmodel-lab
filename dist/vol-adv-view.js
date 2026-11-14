/* Experiment06 拓展视图：SV 类模型（6.2）与高频波动（6.3）。
   在 GARCH 工作台内挂载，复用其代码面板；文案走 LabKit.t，语言切换即重绘。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.VolAdvMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={view:'sv',p:{...window.VolAdvMath.defaults},built:null,last:null};
function controls(){
  const {view}=state,p=state.p;
  let host=$('#volAdvControls');
  if(!host){host=document.createElement('section');host.id='volAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  const f=(id,zh,en,min,max,step)=>K.field({id,zh,en,value:p[id],min,max,step});
  host.innerHTML=`<h3>${K.esc(view==='sv'?t('SV 模型参数','Stochastic-volatility parameters'):t('高频与微观结构参数','High-frequency and microstructure parameters'))}</h3>
    <p class="lab-note">${K.esc(view==='sv'
      ?t('对数方差服从 AR(1)，波动不可观测；对数平方收益是它的带噪观测。','Log variance follows an AR(1); volatility is latent and log-squared returns are noisy observations of it.')
      :t('观测价格 = 真实价格 + 微观结构噪声；采样越细，已实现方差的噪声偏差越大。','Observed price equals true price plus microstructure noise; finer sampling inflates the noise bias in realised variance.'))}</p>
    ${view==='sv'
      ? f('n','样本量','Sample size',200,2000,1)+f('svMu','真实 μ（对数方差均值）','True μ (mean log variance)',-8,-4,.1)+f('phi','真实 φ（持续性）','True φ (persistence)',.5,.995,.005)+f('svSig','真实 σ_η（状态噪声）','True σ_η (state noise)',.05,1,.01)+f('seed','随机种子','Random seed',1,99999999,1)
      : f('hfDays','交易日数','Trading days',20,200,1)+f('hfBars','每日分钟收益数','Intraday bars per day',12,144,4)+f('hfNoise','微观结构噪声强度','Microstructure noise',0,3,.1)+f('hfJumps','跳跃概率','Jump probability',0,.5,.01)+f('hfSeed','随机种子','Random seed',1,99999999,1)}
    ${K.tasks(view==='sv'
      ? [['先预测：SV 滤波的波动率应该在冲击后立刻跳升，还是缓慢跟随？','Predict first: should filtered SV volatility jump immediately after a shock, or follow slowly?'],
         ['把 φ 调到 0.999，观察滤波曲线是否变得“更平滑但更滞后”。','Set φ to 0.999 and see whether the filtered curve becomes smoother but more lagged.'],
         ['对比真实波动与 EWMA，说明为什么两者都不能当作“真实波动”。','Compare with EWMA and explain why neither is the true volatility.']]
      : [['先预测：采样间隔从 1 分钟放大到 24 分钟，RV 应该上升还是下降？','Predict first: does RV rise or fall when the sampling interval grows from one bar to 24?'],
         ['把噪声强度调到 0，观察 signature plot 是否变平。','Set the noise strength to zero and see the signature plot flatten.'],
         ['比较 RV 与 BPV：两者之差在跳跃日应该更大吗？','Compare RV with BPV: should their gap widen on jump days?']])}`;
  sync();
  return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#volAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,'');const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const view=state.view,p=state.p;
  const host=$('#volPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const title=host.querySelector('h3'),svg=host.querySelector('.svg-host');
  try{
    if(view==='sv'){
      const q=M().svView(p);state.last=q;
      title.textContent=t('滤波波动率、真实波动率与 EWMA','Filtered, true and EWMA volatility');
      const step=Math.max(1,Math.floor(q.r.length/300));
      const pts=(a)=>a.map((v,i)=>[i+1,v]).filter((_,i)=>i%step===0);
      K.chart(svg,{xLabel:['交易日','Day'],yLabel:['日波动率','Daily volatility'],
        series:[{type:'line',points:pts(q.trueVol),color:'#b5bfcc'},
          {type:'line',points:pts(q.vol),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 日：SV 滤波 ${K.pct(d[1])}`,'Day '+Math.round(d[0])+': SV filter '+K.pct(d[1])]},
          {type:'line',points:pts(q.ewma),color:'#9b88ac',dash:true}],
        aria:['波动率对比','Volatility comparison']});
      K.metrics([['滤波 μ̂（对数方差）','Fitted μ̂',q.mu.toFixed(3)],['φ̂','φ̂',q.phi.toFixed(3)],['σ̂_η','σ̂_η',q.sigma.toFixed(3)]]);
      K.legend([['真实波动','True volatility','#b5bfcc',false],['SV 滤波','SV filter','#6689a8',false],['EWMA λ=0.94','EWMA λ=0.94','#9b88ac',true]]);
      K.details(K.table([['项目','Item'],['估计','Estimate'],['真值','Truth']],[
        ['μ',q.mu.toFixed(4),String(q.trueMu)],['φ',q.phi.toFixed(3),String(q.truePhi)],['σ_η',q.sigma.toFixed(3),String(q.trueSigma)],
        [t('似然/期','Log-likelihood per period'),q.loglik.toFixed(4),'—'],
        [t('平均日波动','Mean daily volatility'),K.pct(q.fitPct),K.pct(q.trueVol.reduce((a,b)=>a+b,0)/q.trueVol.length)],
        [t('标准化残差标准差','Standardised residual SD'),q.residSd.toFixed(3),'1.000']])+
        `<p class="chart-note">${K.esc(t('μ 在准极大似然下识别较弱，偏差是估计方法的性质，不是数据错误。滤波波动率只用当下及过去的信息。','μ is weakly identified under quasi-maximum likelihood; its bias is a property of the estimator, not a data error. The filtered volatility uses only current and past information.'))}</p>`);
      K.graphKind(t('SV · 卡尔曼滤波','SV · Kalman filter'),t('合成日收益','Synthetic daily returns'));
      state.built=M().build('sv',q,p,'full',K.lang());
    }else{
      const q=M().hfView(p);state.last=q;
      title.textContent=t('signature plot：RV 随聚合间隔的变化','Signature plot: RV against the aggregation interval');
      K.chart(svg,{xLabel:['聚合间隔 k（根）','Aggregation k (bars)'],yLabel:['RV','RV'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'line',points:q.signature.map((s,i)=>[i+1,s.mean]),color:'#6689a8',marker:true,
          tip:d=>{const s=q.signature[Math.round(d[0])-1];return[`k=${s.k}：RV=${s.mean.toExponential(3)}`,'k='+s.k+': RV='+s.mean.toExponential(3)];}},
          {type:'line',points:q.signature.map((s,i)=>[i+1,q.meanTrue]),color:'#659b8a',dash:true}],
        aria:['signature plot','Signature plot']});
      K.metrics([['平均 RV','Mean RV',q.meanRV.toExponential(3)],['平均 BPV','Mean BPV',q.meanBPV.toExponential(3)],['跳跃占比','Jump share',K.pct(q.meanJump,1)]]);
      K.legend([['RV（不同 k）','RV by k','#6689a8',false],['真实积分方差','True integrated variance','#659b8a',true]]);
      K.details(K.table([['项目','Item'],['数值','Value']],[
        [t('交易日数','Trading days'),String(q.nDays)],[t('每日 bar 数','Bars per day'),String(q.bars)],
        [t('噪声导致的 RV 偏差','RV bias from noise'),K.pct(q.noiseShare,0)],
        [t('含跳跃的天数','Days with a jump'),String(q.jumpDays)],
        [t('平均跳跃占比','Mean jump share'),K.pct(q.meanJump,1)],
        [t('k=1 的 RV','RV at k=1'),q.signature[0].mean.toExponential(3)],
        [t('最粗 k 的 RV','RV at the coarsest k'),q.signature[q.signature.length-1].mean.toExponential(3)]])+
        `<p class="chart-note">${K.esc(t('RV 与 BPV 的差是跳跃的描述性度量；本页未做阈值化的正式跳跃检验，也不把合成数据当作真实高频行情。','The RV–BPV gap is a descriptive jump measure; this page runs no formal threshold jump test and the synthetic data is not real high-frequency data.'))}</p>`);
      K.graphKind(t('高频 · 已实现方差','High frequency · realised variance'),t('合成日内价格','Synthetic intraday prices'));
      state.built=M().build('hf',q,p,'full',K.lang());
    }
    $('#validation').textContent='';
    return state.built;
  }catch(e){
    $('#validation').textContent=e.message;svg.innerHTML='';return null;
  }
}
function render({view,p,mode,onBuilt}){
  state.view=view;state.mode=mode;
  /* 只借宿主的随机种子（便于与其他视图同源），其余参数用本视图自己的默认值，
     避免把 GARCH 视图的样本量 n=160 带进 SV 的 200–2000 约束。 */
  if(p&&Number.isFinite(p.shock))state.p.seed=state.p.seed;
  controls();
  const host=$('#volAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.VolAdvView={render,state};
})();
