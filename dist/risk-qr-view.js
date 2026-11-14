/* Experiment07 拓展视图：分位数回归 VaR（7.2）。挂在风险工作台内。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.RiskQRMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.RiskQRMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#riskQRControls');
  if(!host){host=document.createElement('section');host.id='riskQRControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('分位数回归参数','Quantile-regression parameters'))}</h3>
    <p class="lab-note">${K.esc(t('直接用滞后收益、绝对滞后收益与对数 EWMA 波动率解释条件分位数；τ=1−α 时拟合值就是条件 VaR。','The conditional quantile is explained by the lagged return, its absolute value and log EWMA volatility; at τ = 1−α the fitted value is the conditional VaR.'))}</p>
    ${K.field({id:'alpha',zh:'置信水平 α',en:'Confidence level α',value:p.alpha,min:.9,max:.999,step:.001})}
    ${K.field({id:'N',zh:'名义本金（元）',en:'Notional (CNY)',value:p.N,min:1,max:1e9,step:1e4})}
    ${K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:200,max:2000,step:50})}
    ${K.field({id:'aiTrain',zh:'训练期比例',en:'Training share',value:p.aiTrain,min:.5,max:.85,step:.01})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：分位数回归的 VaR 曲线应该比 EWMA 更平滑还是更跳跃？','Predict first: should the quantile-regression VaR be smoother or jumpier than EWMA?'],
      ['把 α 从 95% 调到 99%，观察超限次数与 Kupiec 结论如何变化。','Move α from 95% to 99% and watch the exceedances and the Kupiec verdict.'],
      ['改变训练比例，比较条件分位数的稳定性。','Change the training share and compare the stability of the conditional quantile.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#riskQRControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,''),v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const p=state.p,host=$('#riskPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=host.querySelector('.svg-host');
  host.querySelector('h3').textContent=t('条件 VaR 与已实现损失','Conditional VaR and realised losses');
  try{
    const q=M().run(p);state.last=q;
    const step=Math.max(1,Math.floor(q.n/300));
    K.chart(svg,{xLabel:['样本外第几天','Out-of-sample day'],yLabel:['损失（元）','Loss (CNY)'],
      yTickFormat:v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:0}),
      series:[{type:'line',points:q.loss.map((v,i)=>[i+1,v]),color:'#9aa7b0',width:1.3},
        {type:'line',points:q.VaR.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 天：QR-VaR ${Number(d[1]).toFixed(0)} 元`,'Day '+Math.round(d[0])+': QR-VaR '+Number(d[1]).toFixed(0)]},
        {type:'line',points:q.ewma.varPath.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],
      aria:['QR-VaR 与损失','QR-VaR and losses']});
    K.metrics([['QR 超限 / 有效','QR hits',`${q.hits} / ${q.n}`],['Kupiec p（QR）','Kupiec p (QR)',Number.isFinite(q.kupiec.p)?q.kupiec.p.toFixed(3):'—'],['平均 VaR（元）','Mean VaR',Number(q.meanVaR).toFixed(0)]]);
    K.legend([['实际损失','Realised loss','#9aa7b0',false],['分位数回归 VaR','Quantile-regression VaR','#6689a8',false],['EWMA 正态 VaR','EWMA-normal VaR','#9b88ac',true]]);
    K.details(K.table([['模型','Model'],['超限/有效','Hit / valid'],['Kupiec p','Kupiec p'],['平均 VaR（元）','Mean VaR'],['平均 ES（元）','Mean ES']],[
      [t('分位数回归','Quantile regression'),`${q.hits} / ${q.n}`,Number.isFinite(q.kupiec.p)?q.kupiec.p.toFixed(3):'—',Number(q.meanVaR).toFixed(0),Number(q.meanES).toFixed(0)],
      [t('EWMA 正态','EWMA-normal'),`${q.ewma.hits} / ${q.ewma.n}`,Number.isFinite(q.ewma.kupiec.p)?q.ewma.kupiec.p.toFixed(3):'—',Number(q.ewma.meanVaR).toFixed(0),Number(q.ewma.meanES).toFixed(0)]])+
      `<p class="chart-note">${K.esc(t('系数（截距、滞后收益、绝对滞后收益、对数波动率）：','Coefficients (intercept, lagged return, |lagged return|, log volatility): '))}${q.beta.map(v=>v.toFixed(4)).join(', ')}`+
      ` ${K.esc(t('训练期 ','training period '))}${q.trainN}${K.esc(t(' 个观测；Kupiec 只检验无条件覆盖。',' observations; Kupiec tests unconditional coverage only.'))}</p>`);
    $('#validation').textContent='';
    state.built=M().build(p,q,K.lang());
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,mode,onBuilt}){
  state.mode=mode;
  controls();
  const host=$('#riskQRControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.RiskQRView={render,state};
})();
