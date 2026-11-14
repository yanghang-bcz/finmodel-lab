/* Experiment12 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=FundMath,C=FundCode;
const LAB={
  id:'fund',cls:'fund-lab',global:'FundLab',
  views:M.views,
  defaults:()=>({...M.defaults}),
  check:p=>M.check(p),
  params(p,view,K){
    let h=K.field({id:'months',zh:'月份数',en:'Months',value:p.months,min:36,max:240,step:12})+
      K.field({id:'alpha',zh:'真实月度 alpha',en:'True monthly alpha',value:p.alpha,min:-.01,max:.02,step:.0005})+
      K.field({id:'beta',zh:'真实 beta',en:'True beta',value:p.beta,min:.1,max:2.5,step:.05})+
      K.field({id:'timing',zh:'真实择时能力',en:'True timing ability',value:p.timing,min:-1,max:1.5,step:.05})+
      K.field({id:'idio',zh:'特质波动率',en:'Idiosyncratic volatility',value:p.idio,min:.005,max:.06,step:.005})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
    if(view==='tb')h+=K.field({id:'aversion',zh:'风险厌恶系数（参考）',en:'Risk aversion (reference)',value:p.aversion,min:.5,max:10,step:.5});
    return h;
  },
  question(view){return {
    metrics:['同样的超额收益，用 Sharpe 与 Treynor 排名会不同吗？','Can Sharpe and Treynor rank the same excess return differently?'],
    timing:['"涨得多、跌得少"是选股还是择时？如何用回归区分？','Is "more up, less down" selection or timing, and how does a regression tell them apart?'],
    tb:['给定 alpha 与特质风险，主动组合应该占多少？','Given alpha and idiosyncratic risk, how large should the active position be?'],
    attr:['基金的差超额收益里，多少来自市场，多少来自经理？','How much of the fund excess return comes from the market and how much from the manager?'],
    ai:['AI 写的绩效归因摘要，哪句话必须改？','Which sentence in the AI attribution summary must be changed?']
  }[view];},
  summary(view){return {
    metrics:[['Sharpe','Sharpe'],['Treynor','Treynor'],['Jensen α','Jensen α']],
    timing:[['TM 回归','TM regression'],['HM 回归','HM regression'],['截距与择时相关','Intercept and timing correlate']],
    tb:[['主动权重','Active weight'],['评估比率','Appraisal ratio'],['依赖 α 稳定性','Depends on α stability']],
    attr:[['三部分相加','Parts add up'],['残差为恒等式','Residual is an identity'],['不是因果','Not causal']],
    ai:[['断言可检验','Claims must be testable'],['指回表格','Point back to a table'],['留痕','Record the review']]
  }[view];},
  assumptions(view){return {
    metrics:['合成基金的 alpha、beta 与择时能力由固定参数设定，页面会显示真值。Sharpe 用总风险、Treynor 用系统性风险、Jensen α 是回归截距；年化一律用复合，未扣费用与税。','The synthetic fund alpha, beta and timing ability are fixed parameters whose true values are shown. Sharpe uses total risk, Treynor systematic risk and Jensen alpha is a regression intercept; annualisation compounds and ignores fees and taxes.'],
    timing:['择时模型检验 beta 是否随市场状态变化：TM 用二次项，HM 用上行收益项。截距与择时项高度相关，短样本下难以分离，正系数也不等于可复制的择时能力。','Timing models test whether beta changes with the market state: TM uses a quadratic term and HM an up-market term. The intercept and the timing term are highly correlated and hard to separate in short samples; a positive coefficient is not replicable timing skill.'],
    tb:['Treynor-Black 用 alpha 与主动组合方差构造权重，再与市场组合混合。它把估计出来的 alpha 当作已知真值，忽略估计误差；alpha 不稳定时权重会被放大。','Treynor-Black forms weights from alpha and active-portfolio variance, then blends with the market. It treats the estimated alpha as known and ignores estimation error, so unstable alphas produce extreme weights.'],
    attr:['收益归因把超额收益分解为市场暴露、选择能力与残差；三部分按构造相加等于总额，残差恒为零并不证明模型完整。归因是会计恒等式，不是因果解释。','Attribution splits excess return into market exposure, selection and residual; the parts add to the total by construction, and a zero residual does not prove the model is complete. Attribution is an accounting identity, not a causal explanation.'],
    ai:['本视图给出三段典型的 AI 摘要断言，并逐条指回具体表格与数字：夏普不能识别择时、显著 α 不能线性外推、归因恒等式不等于因果。审查结论是"改哪句话、依据哪张表"，不是"AI 对不对"。','This view lists three typical AI-summary claims and maps each back to a concrete table and number: Sharpe cannot identify timing, a significant alpha cannot be extrapolated, and an attribution identity is not causation. The output is which sentence changes and which table supports it — not a verdict on the AI.']
  }[view];},
  compute(p,view){
    if(view==='ai')return M.aiReview(p);
    if(view==='metrics')return M.metrics(p);
    if(view==='timing')return M.timing(p);
    if(view==='tb')return M.treynorBlack(p);
    return M.attribution(p);
  },
  chartTitle(q,p,view){return {
    metrics:['基金与基准的累计净值','Cumulative net asset value of fund and benchmark'],
    timing:['超额收益与市场超额收益','Excess return against the market excess return'],
    tb:['主动组合权重','Active-portfolio weight'],
    attr:['超额收益分解（年化）','Excess-return decomposition (annualised)'],
    ai:['AI 摘要的审查流程','Review flow for the AI summary']
  }[view];},
  metrics(q,p,view,K){
    if(view==='metrics')return K.metrics([['Sharpe（基金）','Sharpe (fund)',q.fund.sharpe.toFixed(2)],['Treynor','Treynor',q.treynor.toFixed(3)],['Jensen α（月度）','Jensen α (monthly)',K.pct(q.alpha,3)]]);
    if(view==='timing')return K.metrics([['HM 择时系数','HM timing',q.hm.gamma.toFixed(3)],['HM t 值','HM t-stat',q.hm.gammaT.toFixed(2)],['真实择时','True timing',q.true.timing.toFixed(2)]]);
    if(view==='tb')return K.metrics([['主动权重 w*','Active weight w*',K.pct(q.wStar,1)],['组合 Sharpe','Combined Sharpe',q.sharpeCombo.toFixed(2)],['市场 Sharpe','Market Sharpe',q.sharpeMarket.toFixed(2)]]);
    if(view==='ai')return K.metrics([['断言数','Claims',String(q.checked)],['需修改','Must change',String(q.corrected)],['清单项','Checklist',String(q.checklist.length)]]);
    return K.metrics([['总超额（年化）','Total excess (annual)',K.pct(q.total)],['市场部分','Market part',K.pct(q.factor)],['选择部分','Selection part',K.pct(q.parts[1][2])]]);
  },
  legend(q,p,view,K){
    if(view==='metrics')return K.legend([['基金净值','Fund NAV','#6689a8',false],['基准净值','Benchmark NAV','#9b88ac',true]]);
    if(view==='timing')return K.legend([['月度观测','Monthly observations','#6689a8',false],['上行期拟合','Up-market fit','#659b8a',true]]);
    if(view==='tb')return K.legend([['组合净值','Combined NAV','#6689a8',false],['市场净值','Market NAV','#9b88ac',true]]);
    return K.legend([['市场暴露','Market','#6689a8',false],['选择能力','Selection','#659b8a',false],['残差','Residual','#b5bfcc',false]]);
  },
  chart(q,p,view,{svgHost,K}){
    if(view==='metrics'){
      return K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['累计净值','Cumulative NAV'],
        series:[{type:'line',points:q.nav.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 月基金净值 ${d[1].toFixed(3)}`,'Month '+Math.round(d[0])+': fund NAV '+d[1].toFixed(3)]},
          {type:'line',points:q.navBench.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],aria:['净值曲线','NAV curves']});
    }
    if(view==='timing'){
      return K.chart(svgHost(),{xLabel:['市场超额收益','Market excess return'],yLabel:['基金超额收益','Fund excess return'],yZero:true,
        series:[{type:'scatter',points:q.scatter.map(s=>[s.x,s.y]),color:'#6689a8',radius:3,tip:d=>[`x=${K.pct(d[0])}；y=${K.pct(d[1])}`,'x='+K.pct(d[0])+'; y='+K.pct(d[1])]},
          {type:'line',points:[[Math.min(...q.scatter.map(s=>s.x)),q.tm.alpha+q.tm.beta*Math.min(...q.scatter.map(s=>s.x))],[Math.max(...q.scatter.map(s=>s.x)),q.tm.alpha+q.tm.beta*Math.max(...q.scatter.map(s=>s.x))]],color:'#659b8a',dash:true}],
        aria:['择时散点','Timing scatter']});
    }
    if(view==='tb'){
      return K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['累计净值','Cumulative NAV'],
        series:[{type:'line',points:q.comboNav.map((v,i)=>[i+1,v]),color:'#6689a8'},{type:'line',points:q.marketNav.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],
        aria:['组合净值','Combined NAV']});
    }
    if(view==='ai'){
      return K.flow(svgHost(),[
        ['生成摘要','Draft summary','3 claims'],
        ['拆成断言','Split into claims','testable'],
        ['指回表格','Map to tables','evidence'],
        ['修正措辞','Correct wording','4 items'],
        ['留痕','Record','report']],1);
    }
    return K.chart(svgHost(),{yZero:true,xLabel:['归因项','Attribution part'],yLabel:['年化超额收益','Annualised excess'],
      xTickFormat:v=>[K.t('市场','Market'),K.t('选择','Selection'),K.t('残差','Residual')][Math.round(v)-1],
      series:[{type:'bar',points:q.parts.map((r,i)=>[i+1,r[2]]),color:'#6689a8',gap:.55,tip:d=>[`${K.t(...q.parts[Math.round(d[0])-1].slice(0,2))}：${K.pct(d[1])}`,`${K.t(...q.parts[Math.round(d[0])-1].slice(0,2))}: ${K.pct(d[1])}`]}],
      aria:['收益归因','Return attribution']});
  },
  details(q,p,view,K){
    if(view==='metrics')return K.table([['指标','Metric'],['基金','Fund'],['基准','Benchmark']],[
      [K.t('年化收益','Annualised return'),K.pct(q.fund.ann),K.pct(q.bench.ann)],
      [K.t('年化波动率','Annualised volatility'),K.pct(q.fund.vol),K.pct(q.bench.vol)],
      ['Sharpe',q.fund.sharpe.toFixed(3),q.bench.sharpe.toFixed(3)],
      [K.t('Beta','Beta'),q.beta.toFixed(3),'1.000'],
      [K.t('跟踪误差','Tracking error'),K.pct(q.trackError),'—'],
      ['Jensen α',K.pct(q.alpha,3),'—'],
      [K.t('信息比率 IR','Information ratio'),q.ir.toFixed(3),'—'],
      [K.t('最大回撤','Maximum drawdown'),K.pct(q.mdd),'—'],
      ['Calmar',q.calmar.toFixed(2),'—']]);
    if(view==='timing')return K.table([['模型','Model'],['截距（月度）','Intercept (monthly)'],['t 值','t-stat'],['择时系数','Timing coefficient'],['择时 t','Timing t']],[
      ['CAPM',K.pct(q.capm.alpha,3),'—','—','—'],
      ['TM',K.pct(q.tm.alpha,3),q.tm.alphaT.toFixed(2),q.tm.gamma.toFixed(3),q.tm.gammaT.toFixed(2)],
      ['HM',K.pct(q.hm.alpha,3),q.hm.alphaT.toFixed(2),q.hm.gamma.toFixed(3),q.hm.gammaT.toFixed(2)]])+
      `<p class="chart-note">${K.esc(K.t('真实 alpha ','True alpha '))}${K.pct(q.true.alpha,3)}${K.esc(K.t('，真实择时 ','; true timing '))}${q.true.timing}${K.esc(K.t('。线性 CAPM 把择时收益误记为 alpha。','. A linear CAPM misattributes timing payoff to alpha.'))}</p>`;
    if(view==='tb')return K.table([['项目','Item'],['数值','Value']],[
      [K.t('评估比率 α/σ(e)','Appraisal ratio'),q.appraisal.toFixed(3)],[K.t('主动组合权重 w_A','Active weight w_A'),q.wActive.toFixed(3)],
      [K.t('混合后权重 w*','Blended weight w*'),K.pct(q.wStar,1)],[K.t('组合 Beta','Combined beta'),q.betaCombo.toFixed(3)],
      [K.t('组合 Sharpe','Combined Sharpe'),q.sharpeCombo.toFixed(3)],[K.t('市场 Sharpe','Market Sharpe'),q.sharpeMarket.toFixed(3)]]);
    if(view==='ai'){
      return K.table([['AI 断言','AI claim'],['结论','Verdict'],['为什么','Why'],['证据/数字','Evidence']],
        q.claims.map(c=>[K.t(c.zh,c.en),K.t(c.verdict[0],c.verdict[1]),K.t(c.why[0],c.why[1]),K.t(c.numbers[0],c.numbers[1])]))+
        `<p class="chart-note">${K.esc(K.t('清单：','Checklist: '))}${q.checklist.map(x=>K.esc(K.t(x.zh,x.en))).join(' · ')}</p>`;
    }
    return K.table([['归因项','Part'],['年化贡献','Annualised']],q.parts.map(r=>[K.t(r[0],r[1]),K.pct(r[2])]).concat([[K.t('合计','Total'),K.pct(q.total)]]));
  },
  graphKind(view){return {ai:['AI 归因审查','AI attribution review'],metrics:['基金绩效','Fund performance'],timing:['选股与择时','Selection and timing'],tb:['Treynor-Black','Treynor-Black'],attr:['收益归因','Attribution']}[view];},
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  teacher:['四节对应大纲的"基金绩效、单因素整体绩效、选股与择时能力、投资组合策略、Treynor-Black、预测准确性、资产配置与基金经理行为"。建议先用 Sharpe/Treynor/α 三口径排名，再用 TM/HM 分离择时，最后做 Treynor-Black 与归因。强调所有指标都基于同一段合成数据，不能外推。',
    'The four sections follow the syllabus: fund performance, single-factor metrics, stock selection and market timing, portfolio strategy, Treynor-Black, forecast accuracy, asset allocation and manager behaviour. Rank by Sharpe, Treynor and alpha first, then separate timing with TM and HM, and finish with Treynor-Black and attribution. Stress that every metric uses the same synthetic sample and cannot be extrapolated.'],
  help:['页面不执行 R；每节生成可整段运行的基础 R 脚本并内嵌同一份合成月度序列。右上角可切换中文/English，数值与脚本保持一致。','The page does not run R; each section generates a standalone base-R script with the same synthetic monthly series embedded. The language switch keeps numbers and scripts identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：年化收益、波动率、Sharpe、Treynor、Jensen α、IR、最大回撤与 Calmar；再核对 TM/HM 的截距与择时系数，最后核对 Treynor-Black 权重与归因三项之和。','Create a new R Script and run it. Check the annualised return, volatility, Sharpe, Treynor, Jensen alpha, IR, maximum drawdown and Calmar; then the TM/HM intercepts and timing coefficients; finally the Treynor-Black weights and the sum of the three attribution parts.'],
  fileName:'experiment12-fund-performance.R'
};
window.FundWorkbench={mount:()=>LabRunner.mount(LAB)};
})();
