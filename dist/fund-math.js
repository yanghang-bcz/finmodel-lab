/* Experiment12 · fund performance: single-factor metrics, market timing,
   Treynor-Black and factor attribution on one deterministic synthetic fund. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.FundMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({months:60,alpha:.0035,beta:1.05,timing:.45,mktPremium:.006,mktVol:.045,idio:.025,rf:.002,seed:20261114,aversion:2.5});
const views=[['metrics','单因素绩效','Single-factor metrics'],['timing','选股与择时','Selection and timing'],['tb','Treynor-Black','Treynor-Black'],['attr','收益归因','Attribution'],['ai','AI 归因审查','AI attribution review']];
function check(p){
  if(!Number.isInteger(p.months)||p.months<36||p.months>240)throw Error('月份数须为 36–240 的整数。');
  if(!(p.beta>0&&p.beta<3))throw Error('Beta 须在 0 与 3 之间。');
  if(!(p.idio>0))throw Error('特质波动率必须为正。');
  if(!(p.rf>-.01&&p.rf<.02))throw Error('无风险月利率须在 −1% 与 2% 之间。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
let cache=new Map();
function sample(p){
  check(p);
  const key=[p.months,p.alpha,p.beta,p.timing,p.idio,p.rf,p.seed].join('|');
  if(cache.has(key))return cache.get(key);
  const rng=S.prng(p.seed),mkt=[],fund=[],rf=[];
  for(let t=0;t<p.months;t++){
    const m=p.mktPremium+p.mktVol*rng.normal();
    const x=m-p.rf,up=Math.max(0,x);
    mkt.push(m);rf.push(p.rf);
    fund.push(p.rf+p.alpha+p.beta*x+p.timing*up+p.idio*rng.normal());
  }
  const out={mkt,fund,rf,T:p.months};
  cache.set(key,out);if(cache.size>6)cache.clear();
  return out;
}
const daily={} ;
function metrics(p){
  const d=sample(p),x=d.mkt.map((m,i)=>m-d.rf[i]),y=d.fund.map((f,i)=>f-d.rf[i]);
  const fit=S.ols(y,[x],{names:['mkt']});
  const alpha=fit.beta[0],beta=fit.beta[1],alphaT=fit.t[0],betaT=fit.t[1];
  const meanFund=S.mean(d.fund),sdFund=S.sd(d.fund),meanMkt=S.mean(d.mkt),sdMkt=S.sd(d.mkt);
  const mdd=S.maxDrawdown(d.fund);
  const down=d.fund.filter(v=>v<0),downSd=down.length>1?S.sd(down):NaN;
  const annual=v=>(1+v)**12-1;
  return{d,alpha,beta,alphaT,betaT,trackError:S.sd(fit.resid),r2:fit.r2,
    fund:{mean:meanFund,sd:sdFund,ann:annual(meanFund),vol:sdFund*Math.sqrt(12),sharpe:(meanFund-p.rf)/(sdFund||1)*Math.sqrt(12)},
    bench:{mean:meanMkt,sd:sdMkt,ann:annual(meanMkt),vol:sdMkt*Math.sqrt(12),sharpe:(meanMkt-p.rf)/(sdMkt||1)*Math.sqrt(12)},
    excess:S.mean(d.fund)-S.mean(d.mkt),treynor:(meanFund-p.rf)/beta,ir:(meanFund-meanMkt)/(S.sd(fit.resid)||1),
    mdd:mdd.mdd,calmar:(mdd.mdd!==0?annual(meanFund)/(-mdd.mdd):NaN),sortino:downSd>0?(meanFund-p.rf)/downSd*Math.sqrt(12):NaN,
    nav:S.growth(d.fund).map((v,i)=>v),navBench:S.growth(d.mkt),dd:drawdownPath(d.fund),monthly:d.fund};
}
function drawdownPath(r){
  let nav=1,peak=1;return r.map(v=>{nav*=1+v;peak=Math.max(peak,nav);return nav/peak-1;});
}
function timing(p){
  const d=sample(p),x=d.mkt.map((m,i)=>m-d.rf[i]),y=d.fund.map((f,i)=>f-d.rf[i]);
  const tm=S.ols(y,[x,x.map(v=>v*v)],{names:['x','x2']});
  const hm=S.ols(y,[x,x.map(v=>Math.max(0,v))],{names:['x','xpos']});
  const capm=S.ols(y,[x],{names:['mkt']});
  const down=x.filter(v=>v<0),up=x.filter(v=>v>=0);
  const fundDown=d.fund.filter((_,i)=>x[i]<0),fundUp=d.fund.filter((_,i)=>x[i]>=0);
  /* HM: a positive coefficient on max(0, x) means beta rises in up markets. */
  return{tm:{alpha:tm.beta[0],alphaT:tm.t[0],beta:tm.beta[1],gamma:tm.beta[2],gammaT:tm.t[2],r2:tm.r2},
    hm:{alpha:hm.beta[0],alphaT:hm.t[0],beta:hm.beta[1],gamma:hm.beta[2],gammaT:hm.t[2],r2:hm.r2},
    capm:{alpha:capm.beta[0],beta:capm.beta[1],r2:capm.r2},
    up:{n:up.length,mean:S.mean(up),fund:S.mean(fundUp)},down:{n:down.length,mean:S.mean(down),fund:S.mean(fundDown)},
    true:{alpha:p.alpha,timing:p.timing,beta:p.beta},
    scatter:x.map((v,i)=>({x:v,y:y[i]})),T:p.months};
}
function treynorBlack(p){
  const m=metrics(p),d=m.d;
  /* Active portfolio: the fund's alpha with its idiosyncratic risk. */
  const sigmaE=m.trackError,alpha=m.alpha;
  const appraisal=alpha/sigmaE;
  const sigmaA2=(m.beta**2)*(m.bench.sd**2)+sigmaE**2;
  const wActive=(alpha/sigmaA2)/(S.mean(ex)/S.sd(ex)**2);
  const wStar=wActive/(1+wActive);
  const mk=d.mkt,ex=mk.map(v=>v-p.rf);
  const combo=d.fund.map((f,i)=>wStar*f+(1-wStar)*mk[i]);
  const comboEx=combo.map((v,i)=>v-d.rf[i]);
  const sharpe=v=>S.mean(v)/S.sd(v)*Math.sqrt(12);
  const betaCombo=wStar*m.beta+(1-wStar);
  return{appraisal,wActive,wStar,betaCombo,
    sharpeMarket:sharpe(ex),sharpeCombo:sharpe(comboEx),sharpeFund:m.fund.sharpe,
    activeWeightPct:wStar,aversion:p.aversion,
    riskAverseWeight:(S.mean(ex)/p.aversion)/S.sd(ex)**2,
    alpha,sigmaE,comboNav:S.growth(combo),marketNav:S.growth(mk)};
}
function attribution(p){
  const m=metrics(p),d=m.d,months=12;
  const x=d.mkt.map((v,i)=>v-d.rf[i]),meanEx=S.mean(x);
  const total=S.mean(d.fund)-S.mean(d.rf);
  const factorPart=m.beta*meanEx,alphaPart=m.alpha,residual=total-factorPart-alphaPart;
  return{total:total*months,factor:factorPart*months,alpha:alphaPart*months,residual:residual*months,
    beta:m.beta,alphaMonthly:m.alpha,alphaT:m.alphaT,avgExcess:meanEx,
    parts:[[ '市场暴露','Market exposure',factorPart*months],['选择能力','Selection (alpha)',alphaPart*months],['残差','Residual',residual*months]]};
}
function aiReview(p){
  check(p);
  const m=metrics(p),t=timing(p),a=attribution(p);
  const claims=[
    {key:'sharpe',zh:'“基金夏普高于基准，说明经理具备择时能力。”',en:'"The fund Sharpe is above the benchmark, so the manager has timing skill."',
     verdict:['错误推断','Invalid inference'],
     why:['夏普只比较风险调整后的收益，不识别收益来自选股、择时还是杠杆。择时要看 TM/HM 的二次项或上行项系数。',
          'Sharpe compares risk-adjusted returns only; it cannot tell selection, timing or leverage apart. Timing needs the quadratic or up-market coefficient in TM/HM.'],
     evidence:['选股与择时','Selection and timing'],
     numbers:[`夏普 ${m.fund.sharpe.toFixed(2)} vs 基准 ${m.bench.sharpe.toFixed(2)}；HM 择时系数 ${t.hm.gamma.toFixed(2)}（t=${t.hm.gammaT.toFixed(2)}）`,`Sharpe ${m.fund.sharpe.toFixed(2)} vs benchmark ${m.bench.sharpe.toFixed(2)}; HM timing ${t.hm.gamma.toFixed(2)} (t=${t.hm.gammaT.toFixed(2)})`]},
    {key:'alpha',zh:'“月度 α 为正且显著，可线性外推为未来年化收益。”',en:'"A positive, significant monthly alpha can be extrapolated to an annual return."',
     verdict:['过度外推','Over-extrapolation'],
     why:['α 是样本内的回归截距，含估计误差，且在线性 CAPM 下会把择时收益误记为选股能力。区间估计与样本外检验才决定能否外推。',
          'Alpha is an in-sample intercept with estimation error, and a linear CAPM misattributes timing payoff to selection. Only an interval and an out-of-sample check justify extrapolation.'],
     evidence:['单因素绩效','Single-factor metrics'],
     numbers:[`α=${(m.alpha*100).toFixed(3)}%/月，t=${m.alphaT.toFixed(2)}，复合年化≈${(((1+m.alpha)**12-1)*100).toFixed(2)}%（未扣费用）`,`α=${(m.alpha*100).toFixed(3)}%/month, t=${m.alphaT.toFixed(2)}, CAGR≈${(((1+m.alpha)**12-1)*100).toFixed(2)}% (before fees)`]},
    {key:'attr',zh:'“归因显示选择能力贡献为正，全部归功于经理。”',en:'"Attribution shows a positive selection contribution, all thanks to the manager."',
     verdict:['把恒等式当因果','Identity read as causation'],
     why:['收益归因是会计恒等式，三部分相加必然等于总额；残差为零不证明模型完整。市场暴露部分依赖 β 估计，择时收益仍混在 α 里。',
          'Return attribution is an accounting identity: the three parts must add to the total, and a zero residual does not prove the model is complete. The market part depends on an estimated beta, and timing payoff is still inside alpha.'],
     evidence:['收益归因','Attribution'],
     numbers:[`市场 ${(a.factor*100).toFixed(2)}%、选择 ${(a.parts[1][2]*100).toFixed(2)}%、残差 ${(a.parts[2][2]*100).toFixed(2)}%（年化）`,`market ${(a.factor*100).toFixed(2)}%, selection ${(a.parts[1][2]*100).toFixed(2)}%, residual ${(a.parts[2][2]*100).toFixed(2)}% (annualised)`]}
  ];
  const checklist=[
    {zh:'先问"这个指标能识别什么"，再问"数值大不大"',en:'Ask what the metric identifies before asking whether it is large',pass:true},
    {zh:'α 与择时系数要一起看，不能只报其中一个',en:'Read alpha together with the timing coefficient, never one alone',pass:true},
    {zh:'样本内显著不等于样本外可用',en:'In-sample significance is not out-of-sample usability',pass:true},
    {zh:'归因三项相加是恒等式，不是因果分解',en:'Attribution adds up by identity, not by causation',pass:true},
    {zh:'任何 AI 摘要都要能指回具体表格与假设',en:'Every AI summary must point back to a concrete table and assumption',pass:true}
  ];
  return{m,t,a,claims,checklist,checked:claims.length,corrected:claims.filter(c=>c.verdict[0]!=='通过').length};
}
return{defaults,views,check,sample,metrics,timing,treynorBlack,attribution,aiReview,drawdownPath};
});
