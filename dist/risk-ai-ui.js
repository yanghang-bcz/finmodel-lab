/* Experiment07 · AI risk forecasting view (random forest + LSTM).
   Renders into the shared workbench panes and returns the R blocks so the
   existing code pane, navigation and copy button keep working unchanged. */
(()=>{'use strict';
const K=window.LabKit,A=()=>window.RiskAIMath,t=(zh,en)=>K.t(zh,en),$=s=>document.querySelector(s);
const esc=s=>K.esc(s),fmt=(v,d=2)=>Number.isFinite(v)?Number(v).toFixed(d):'—',pct=v=>Number.isFinite(v)?(v*100).toFixed(2)+'%':'—';
const money=v=>Number.isFinite(v)?Number(v).toLocaleString('en-US',{maximumFractionDigits:0}):'—';
const state={ai:{...A().DEFAULTS},built:null,last:null};
function controls(){
  let host=document.querySelector('#riskAIControls');
  const fresh=!host;
  if(fresh){host=document.createElement('section');host.id='riskAIControls';$('#inputs').append(host);}
  host.innerHTML=`<h3>${esc(t('AI 风险预测参数','AI risk parameters'))}</h3>
    <p class="lab-note">${esc(t('目标与其余视图一致：下一期简单收益的损失分位数；所有输入都只用目标日之前的信息，并用同一段样本外窗口检验。','Same target as every other view: the next-period loss quantile. All inputs use only information available before the target day, and every model is checked on the same out-of-sample window.'))}</p>
    ${K.field({id:'aiTrees',zh:'树的数量',en:'Number of trees',value:60,min:10,max:300,step:1})}
    ${K.field({id:'aiDepth',zh:'树深度',en:'Tree depth',value:4,min:2,max:8,step:1})}
    ${K.field({id:'aiLeaf',zh:'叶最小样本',en:'Minimum leaf size',value:8,min:4,max:60,step:1})}
    ${K.field({id:'aiMtry',zh:'每次分裂候选特征',en:'Features per split',value:3,min:1,max:5,step:1})}
    ${K.field({id:'aiWindow',zh:'LSTM 输入窗口',en:'LSTM input window',value:8,min:4,max:20,step:1})}
    ${K.field({id:'aiHidden',zh:'LSTM 隐藏单元',en:'LSTM hidden units',value:4,min:4,max:12,step:1})}
    ${K.field({id:'aiEpochs',zh:'LSTM 训练轮数',en:'LSTM epochs',value:16,min:2,max:40,step:1})}
    ${K.field({id:'aiTrain',zh:'训练期比例',en:'Training share',value:.7,min:.5,max:.85,step:.01})}
    ${K.field({id:'aiSeed',zh:'模拟与训练种子',en:'Simulation and training seed',value:2024,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：随机森林的 VaR 应该比 EWMA 更保守还是更宽松？','Predict first: should the forest VaR be more or less conservative than EWMA?'],
      ['固定种子，只改树的数量或深度，观察 Kupiec 结论会不会翻转。','Hold the seed, change only the number of trees or the depth, and see whether the Kupiec verdict flips.'],
      ['把种子改成 7031，比较同一网格下两种设定的超限次数。','Change the seed to 7031 and compare exceedance counts at the same settings.']])}`;
  if(fresh){
    host.addEventListener('input',()=>{const p=read();if(p){state.ai={...state.ai,...p};draw();}});
    host.addEventListener('change',()=>{const p=read();if(p){state.ai={...state.ai,...p};draw();}});
  }
  syncValues();
  return host;
}
function read(){
  const out={};
  for(const key of Object.keys(A().DEFAULTS)){
    if(['alpha','N'].includes(key))continue;
    const el=$('#lab-'+key);if(!el)continue;
    const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    out[key]=v;
  }
  return out;
}
function syncValues(){
  for(const [key,v] of Object.entries(state.ai)){
    const el=$('#lab-'+key);if(el&&document.activeElement!==el)el.value=v;
  }
}
function syncControls(){
  const host=controls();
  for(const [key,v] of Object.entries(state.ai)){
    const el=$('#lab-'+key);if(el&&document.activeElement!==el)el.value=v;
  }
  return host;
}
function draw(){
  const base=state.base||{};
  const p={...base,...state.ai};
  const host=$('#riskPlot')||document.querySelector('#chartHost');
  host.id='riskPlot';
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  try{
    const q=A().run(p,state.provided||null,{LSTM:window.TimeSeriesLSTM,t});
    state.q=q;
    $('#validation').textContent='';
    $('#copy').disabled=false;
    $('#graphKind').textContent=t('AI 模型 · 同日样本外比较','AI models · same out-of-sample window');
    const rf=q.rf,lstm=q.lstm,ew=q.ewma;
    K.metrics([['超限 / 有效预测（随机森林）','Exceedances (forest)',`${rf.hits} / ${rf.n}`],['Kupiec p（随机森林）','Kupiec p (forest)',fmt(rf.kupiec.p,3)],['平均 VaR（元）','Mean VaR (CNY)',money(rf.meanVaR)]]);
    const labels=q.test.map(r=>String(r.t+1));
    const series=[
      {type:'line',points:q.test.map((r,i)=>[i+1,-p.N*r.r]),color:'#9aa7b0',width:1.4,tip:d=>[`第 ${Math.round(d[0])} 日损失 ${money(-d[1])} 元`,'Loss '+money(-d[1])+' CNY on day '+Math.round(d[0])]},
      {type:'line',points:ew.varPath.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true},
      {type:'line',points:rf.varPath.map((v,i)=>[i+1,v]),color:'#6689a8'},
      ...(lstm?[{type:'line',points:lstm.varPath.map((v,i)=>[i+1,v]),color:'#659b8a',dash:true}]:[])
    ];
    host.querySelector('h3').textContent=t('样本外损失与三种 VaR','Out-of-sample losses against three VaR paths');
    K.chart(host.querySelector('.svg-host'),{series,xLabel:['测试期第几天','Test day'],yLabel:['损失（元）','Loss (CNY)'],
      yTickFormat:v=>money(v),xTickFormat:v=>String(Math.round(v)),aria:['损失与VaR','Losses and VaR']});
    K.legend([['实际损失','Realised loss','#9aa7b0',false],['EWMA 正态 VaR','EWMA-normal VaR','#9b88ac',true],['随机森林 VaR','Forest VaR','#6689a8',false],...(lstm?[['LSTM+EWMA 尺度 VaR','LSTM with EWMA scale','#659b8a',true]]:[])]);
    const rows=[[t('EWMA 正态','EWMA-normal'),ew],...(lstm?[[t('LSTM + EWMA 尺度','LSTM + EWMA scale'),lstm]]:[]),[t('随机森林','Random forest'),rf]].map(([name,r])=>[name,`${r.hits} / ${r.n}`,fmt(r.kupiec.p,3),money(r.meanVaR),money(r.meanES),Number.isFinite(r.esBias)?money(r.esBias):'—']);
    K.details(K.table([['模型','Model'],['超限/有效','Hit / valid'],['Kupiec p','Kupiec p'],['平均 VaR（元）','Mean VaR'],['平均 ES（元）','Mean ES'],['ES 偏差（元）','ES bias']],rows)+
      `<p class="chart-note">${esc(t('随机森林直接估计（1−α）条件分位；LSTM 预测条件均值，再乘 EWMA 尺度与标准化残差分位。两者与 EWMA 使用同一段样本、同一置信水平与同一天。','The forest estimates the (1−α) conditional quantile directly; the LSTM forecasts the conditional mean and scales it by EWMA volatility and a standardised-residual quantile. All three use the same sample, confidence level and days as EWMA.'))}</p>`+
      `<details><summary>${esc(t('方法、假设与不能说的话','Method, assumptions and what cannot be claimed'))}</summary><p>${esc(t('教学样本由固定种子生成：GARCH(1,1) 波动聚集加偶发跳跃，因此它是随机而非确定性的；其余五个视图使用的固定模数序列含确定性周期，树模型会记住它而不是学到风险动态，所以本视图单独设定样本并在页面注明。','The teaching sample is generated from a fixed seed: GARCH(1,1) volatility clustering plus occasional jumps, so it is stochastic rather than deterministic. The fixed modular series used by the other five views contains a deterministic cycle that a tree would memorise instead of learning risk dynamics, so this view sets its own sample and says so.'))}</p><p>${esc(t('树的数量、深度与种子都会改变超限次数：这说明尾部估计本身有抽样不确定性。单次 Kupiec 不拒绝，不等于模型已被证明准确；不拒绝也不等于可以用于真实头寸限额。','The number of trees, the depth and the seed all change the exceedance count, which shows that the tail estimate itself carries sampling uncertainty. A Kupiec test that fails to reject does not prove the model is accurate, and it does not license real position limits.'))}</p></details>`+
      (lstm?'':`<p class="chart-note">${esc(q.lstmError||'')}</p>`));
    state.built={blocks:window.RiskAICode.build(p,q,state.mode||'full',K.lang()).blocks,script:window.RiskAICode.build(p,q,state.mode||'full',K.lang()).script};
    return state.built;
  }catch(e){
    state.built=null;
    $('#validation').textContent=e.message;
    $('#metrics').innerHTML='';$('#legend').innerHTML='';
    K.details(`<p role="alert">${esc(e.message)}</p>`);
    host.querySelector('.svg-host').innerHTML='';
    return null;
  }
}
function render({base,provided,mode,selected}){
  state.base=base;state.provided=provided;state.mode=mode;
  const cur=document.querySelector('#riskAIControls')?read():null;
  if(cur)state.ai={...state.ai,...cur};
  const host=syncControls();
  $('#riskViews')?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView==='ai')));
  for(const id of ['#riskMethods','#riskChartModes','#riskDynamicModels','#riskExplore','#riskData','#riskAdvanced','#riskGarchFields','#riskBackModelField','#riskGarchModeField']){
    const el=$(id);if(el)el.hidden=true;
  }
  const inputs=$('#inputs');
  for(const child of inputs.children)if(child!==host)child.hidden=true;
  host.hidden=false;
  const root=host.querySelector('h3');if(root)root.textContent=t('AI 风险预测参数','AI risk parameters');
  const out=draw();
  if(!out)return {blocks:[],script:''};
  return out;
}
window.RiskAIView={render,state};
})();
