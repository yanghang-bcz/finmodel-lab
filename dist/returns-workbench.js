/* Experiment03 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=ReturnsMath,C=ReturnsCode;
const LAB={
  id:'returns',cls:'returns-lab',global:'ReturnsLab',
  views:M.views,
  defaults:()=>({...M.defaults}),
  check:p=>M.check(p),
  params(p,view,K){
    if(view==='stock')return K.field({id:'p0',zh:'期初价格',en:'Initial price',value:p.p0,min:.01,step:.01})+
      K.field({id:'p1',zh:'期末价格',en:'Terminal price',value:p.p1,min:.01,step:.01})+
      K.field({id:'dividend',zh:'期间股息（元）',en:'Dividends received',value:p.dividend,min:0,step:.1})+
      K.field({id:'periods',zh:'持有年数',en:'Years held',value:p.periods,min:1,max:20,step:1});
    if(view==='bond')return K.field({id:'face',zh:'面值',en:'Face value',value:p.face,min:1,step:1})+
      K.field({id:'coupon',zh:'票面利率（年）',en:'Annual coupon rate',value:p.coupon,min:0,max:.2,step:.001})+
      K.select({id:'freq',zh:'付息频率',en:'Coupon frequency',value:p.freq,options:[[1,'每年','Annual'],[2,'每半年','Semi-annual'],[4,'每季','Quarterly'],[12,'每月','Monthly']]})+
      K.field({id:'maturity',zh:'剩余期限（年）',en:'Years to maturity',value:p.maturity,min:.5,max:30,step:.5})+
      K.field({id:'ytm',zh:'到期收益率',en:'Yield to maturity',value:p.ytm,min:-.2,max:.3,step:.001})+
      K.field({id:'tSince',zh:'本付息周期已过比例',en:'Fraction of the coupon period elapsed',value:p.tSince,min:0,max:.99,step:.05})+
      K.field({id:'exitYtm',zh:'卖出时收益率',en:'Exit yield',value:p.exitYtm,min:-.2,max:.3,step:.001})+
      K.field({id:'holdYears',zh:'持有年数',en:'Holding period (years)',value:p.holdYears,min:.5,max:30,step:.5});
    if(view==='dist'||view==='qq')return K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:60,max:1200,step:1})+
      K.field({id:'mu',zh:'日收益均值',en:'Daily mean',value:p.mu,min:-.01,max:.01,step:.001})+
      K.field({id:'sigma',zh:'日波动率',en:'Daily volatility',value:p.sigma,min:.001,max:.1,step:.001})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
    return '';
  },
  question(view){return {
    stock:['价格涨了 12%，投资者真的赚了 12% 吗？','The price rose 12% — did the investor really earn 12%?'],
    bond:['一张 5 年期、票息 4.5% 的债券，为什么报价 103 而全价 104？','A 5-year 4.5% bond is quoted at 103 but settles at 104 — why?'],
    dist:['收益率的均值和标准差，够不够描述它的形状？','Are the mean and standard deviation enough to describe a return distribution?'],
    qq:['QQ 图两端的偏离，说明正态假设哪里出问题？','What do the QQ-plot tail departures say about the normal assumption?']
  }[view];},
  summary(view){return {
    stock:[['含股息','Include dividends'],['对数可加','Logs add up'],['几何年化','Geometric annualising']],
    bond:[['净价 vs 全价','Clean vs dirty'],['久期','Duration'],['持有期收益','Holding-period return']],
    dist:[['四阶矩','Four moments'],['跳跃制造厚尾','Jumps create tails'],['JB 检验','Jarque–Bera']],
    qq:[['分位对分位','Quantile vs quantile'],['尾部偏离','Tail departures'],['不能只看均值','Not just the mean']]
  }[view];},
  assumptions(view){return {
    stock:['价格与股息均为固定教学假设，不是真实行情。简单收益回答"比例"，对数收益回答"连续复利增长率"；总收益必须包含现金股息，多期年化使用几何平均。','Prices and dividends are fixed teaching assumptions, not market quotes. A simple return is a fraction, a log return is a continuously compounded rate; total return must include cash dividends and multi-period annualising uses the geometric mean.'],
    bond:['报价使用净价、结算使用全价；应计利息按当前付息周期已过比例线性累计，未考虑实际天数规则与节假日。久期与凸性是收益率小幅平行变动的局部近似，不适用于信用风险或大幅曲线变动。','Quotes use the clean price and settlement the dirty price; accrued interest is linear in the elapsed share of the coupon period, ignoring actual day-count conventions and holidays. Duration and convexity are local approximations for small parallel yield changes, not for credit events or large curve shifts.'],
    dist:['样本为固定种子生成的合成日收益，奇数次跳跃制造厚尾；偏度与峰度使用与 R 一致的无偏样本公式，Jarque–Bera 检验正态性，但大样本下几乎总能拒绝。','The sample is synthetic daily returns from a fixed seed, with occasional jumps creating fat tails. Skewness and kurtosis use the same unbiased sample formulas as R, and Jarque–Bera tests normality — which almost always rejects in large samples.'],
    qq:['QQ 图把样本分位与同均值同标准差的正态分位比较；两端向上偏离说明右尾更厚。它不检验独立性，也不告诉你应该用哪个分布。','The QQ plot compares sample quantiles with normal quantiles of the same mean and standard deviation; upward departures at the right mean a fatter right tail. It does not test independence and does not tell you which distribution to use.']
  }[view];},
  compute(p,view){
    if(view==='stock')return M.stock(p);
    if(view==='bond')return M.bond(p);
    return M.histogram(p,view);
  },
  chartTitle(q,p,view){return {
    stock:['三种收益率口径','Three return conventions'],
    bond:['现金流现值与久期位置','Present values of the cash flows and the duration marker'],
    dist:['直方图与同参数正态密度','Histogram with the matching normal density'],
    qq:['QQ 图：样本分位与正态分位','QQ plot: sample versus normal quantiles']
  }[view];},
  metrics(q,p,view,K){
    if(view==='stock')return K.metrics([['简单收益','Simple return',K.pct(q.priceRet)],['对数收益','Log return',K.pct(q.logRet)],['总收益','Total return',K.pct(q.total)]]);
    if(view==='bond')return K.metrics([['净价','Clean price',q.clean.toFixed(3)],['全价','Dirty price',q.dirty.toFixed(3)],['修正久期','Modified duration',q.modified.toFixed(3)]]);
    if(view==='dist')return K.metrics([['日均值','Daily mean',K.pct(q.mean,3)],['日波动率','Daily volatility',K.pct(q.sd,3)],['超额峰度','Excess kurtosis',q.kurt.toFixed(2)]]);
    return K.metrics([['JB 统计量','Jarque–Bera',q.jb.jb.toFixed(1)],['JB p 值','JB p-value',q.jb.p<1e-6?'< 1e-6':q.jb.p.toFixed(4)],['偏度','Skewness',q.skew.toFixed(3)]]);
  },
  legend(q,p,view,K){
    if(view==='bond')return K.legend([['现金流现值','Present value','#6689a8',false],['久期位置','Duration marker','#9b88ac',true]]);
    if(view==='stock')return K.legend([['价格收益','Price return','#6689a8',false],['总收益','Total return','#659b8a',false]]);
    return K.legend([['样本','Sample','#6689a8',false],['正态参照','Normal reference','#9b88ac',true],['45° 参照','45° reference','#659b8a',true]]);
  },
  chart(q,p,view,{svgHost,K}){
    if(view==='stock'){
      const rows=[[K.t('简单收益','Simple'),q.priceRet],[K.t('对数收益','Log'),q.logRet],[K.t('总收益','Total'),q.total]];
      return K.chart(svgHost(),{yZero:true,xLabel:['口径','Convention'],yLabel:['收益率','Return'],xTickFormat:v=>[K.t('简单','Simple'),K.t('对数','Log'),K.t('总收益','Total')][Math.round(v)-1],
        series:[{type:'bar',points:rows.map((r,i)=>[i+1,r[1]]),color:'#6689a8',gap:.55,tip:d=>[`${rows[Math.round(d[0])-1][0]}：${K.pct(d[1])}`,`${rows[Math.round(d[0])-1][0]}: ${K.pct(d[1])}`]}],
        aria:['三种收益率','Three return conventions']});
    }
    if(view==='bond'){
      return K.chart(svgHost(),{yZero:true,xLabel:['期数','Period'],yLabel:['现值（元）','Present value'],
        series:[{type:'bar',points:q.flows.map((f,i)=>[i+1,f.pv]),color:'#6689a8',gap:.5,tip:d=>[`第 ${Math.round(d[0])} 期现金流 ${f2(q.flows[Math.round(d[0])-1].amount)} 元，现值 ${f2(d[1])} 元`,'Period '+Math.round(d[0])+': cash flow '+f2(q.flows[Math.round(d[0])-1].amount)+', PV '+f2(d[1])]}],
        refs:[{axis:'x',value:q.macaulay*p.freq,color:'#9b88ac',label:['麦考利久期','Macaulay duration']}],
        aria:['现金流现值','Present values of cash flows']});
    }
    if(view==='dist'){
      return K.chart(svgHost(),{yZero:true,xLabel:['日收益','Daily return'],yLabel:['观测数','Count'],
        series:[{type:'bar',points:q.bins.map(b=>[b.x,b.y]),color:'#6689a8',gap:.92,tip:d=>[`${K.pct(d[0])} 附近 ${Math.round(d[1])} 个观测`,'near '+K.pct(d[0])+': '+Math.round(d[1])+' observations']},
          {type:'line',points:q.density.map((v,i)=>[q.bins[i].x,v]),color:'#9b88ac'}],aria:['收益直方图','Return histogram']});
    }
    return K.chart(svgHost(),{xLabel:['正态分位','Normal quantile'],yLabel:['样本收益','Sample return'],yZero:true,
      series:[{type:'scatter',points:q.qq.map(d=>[d.x,d.y]),color:'#6689a8',radius:3,tip:d=>[`z=${d[0].toFixed(2)}；r=${K.pct(d[1])}`,'z='+d[0].toFixed(2)+'; r='+K.pct(d[1])]},
        {type:'line',points:[[q.qq[0].x,q.mean+q.sd*q.qq[0].x],[q.qq.at(-1).x,q.mean+q.sd*q.qq.at(-1).x]],color:'#659b8a',dash:true}],
      aria:['QQ 图','QQ plot']});
  },
  details(q,p,view,K){
    if(view==='stock')return K.table([['口径','Convention'],['数值','Value']],[
      [K.t('简单收益','Simple return'),K.pct(q.priceRet)],[K.t('对数收益','Log return'),K.pct(q.logRet)],[K.t('股息收益率','Dividend yield'),K.pct(q.dividendYield)],
      [K.t('总收益','Total return'),K.pct(q.total)],[K.t('几何年化','Geometric annual'),K.pct(q.perTotal)]]);
    if(view==='bond')return K.table([['项目','Item'],['数值','Value']],[
      [K.t('应计利息','Accrued interest'),q.accrued.toFixed(4)],[K.t('净价','Clean price'),q.clean.toFixed(4)],[K.t('全价','Dirty price'),q.dirty.toFixed(4)],
      [K.t('麦考利久期','Macaulay duration'),q.macaulay.toFixed(4)],[K.t('修正久期','Modified duration'),q.modified.toFixed(4)],[K.t('凸性','Convexity'),q.convexity.toFixed(4)],
      ['DV01',q.dv01.toFixed(4)],[K.t('持有期收益','Holding-period return'),K.pct(q.hpr)],[K.t('票息部分','Coupon part'),K.pct(q.couponRet)],[K.t('资本利得','Capital part'),K.pct(q.capGain)]])+
      `<p class="chart-note">${K.esc(K.t('卖出价 ','Exit price '))}${q.pvExit.toFixed(4)}${K.esc(K.t(' 元；持有期票息 ','; coupons '))}${q.couponCash.toFixed(4)}${K.esc(K.t(' 元。','.'))}</p>`;
    const d=q;
    if(view==='dist')return K.table([['样本统计量','Sample statistic'],['数值','Value']],[
      [K.t('均值','Mean'),d.mean.toFixed(6)],[K.t('标准差','Standard deviation'),d.sd.toFixed(6)],[K.t('偏度','Skewness'),d.skew.toFixed(4)],[K.t('超额峰度','Excess kurtosis'),d.kurt.toFixed(4)],
      [K.t('最小值','Minimum'),d.five.min.toFixed(4)],[K.t('中位数','Median'),d.five.median.toFixed(4)],[K.t('最大值','Maximum'),d.five.max.toFixed(4)],
      [K.t('年化算术','Annualised (arithmetic)'),K.pct(d.ann.arith)],[K.t('年化复合','Annualised (compounded)'),K.pct(d.ann.compound)],[K.t('年化波动率','Annualised volatility'),K.pct(d.ann.vol)]])+
      `<p class="chart-note">${K.esc(K.t('250 个观测、固定种子的合成样本；年化假设 252 个交易日。','250 observations from a fixed seed; annualisation assumes 252 trading days.'))}</p>`;
    return K.table([['检验','Test'],['结果','Result']],[
      [K.t('偏度','Skewness'),d.skew.toFixed(4)],[K.t('超额峰度','Excess kurtosis'),d.kurt.toFixed(4)],[K.t('JB 统计量','Jarque–Bera'),d.jb.jb.toFixed(2)],[K.t('JB p 值','JB p-value'),d.jb.p<1e-6?'< 1e-6':d.jb.p.toFixed(6)]])+
      `<p class="chart-note">${K.esc(K.t('右尾向上偏离来自合成样本中的跳跃；QQ 图不检验独立性。','The upward departure in the right tail comes from the jumps in the synthetic sample; the QQ plot does not test independence.'))}</p>`;
  },
  graphKind(view){return {stock:['股票 · 三种口径','Stock · three conventions'],bond:['债券 · 现金流现值','Bond · cash-flow present values'],dist:['分布 · 合成日收益','Distribution · synthetic daily returns'],qq:['QQ · 分布比较','QQ · distribution comparison']}[view];},
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  teacher:['四节对应大纲的"收益率定义、股票类资产收益率、债券类资产收益率、收益率分布及特征"。先让学生算一遍简单收益与总收益的差别，再拆解债券的净价/全价与久期，最后用直方图与 QQ 图讨论"为什么不能只用均值和标准差"。未开展学生试用，不宣称教学效果。',
    'The four sections follow the syllabus: return definitions, stock returns, bond returns and the distribution of returns. Start with simple versus total return, then take apart the clean/dirty bond price and duration, and finish with the histogram and QQ plot to discuss why mean and standard deviation are not enough. No student trial was run, so no teaching-effect claim is made.'],
  help:['页面本身不执行 R；每节生成可整段运行的基础 R 脚本。所有数值为固定假设或固定种子的合成数据，不是真实行情。右上角可切换中文/English。','The page does not run R; each section generates a standalone base-R script. All numbers are fixed assumptions or synthetic data from a fixed seed, not market quotes. The language switch keeps everything identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：总收益是否等于 (P1+股息)/P0−1；应计利息是否等于票息×已过比例；修正久期是否等于麦考利久期/(1+y/f)；偏度、峰度与 JB 是否与本页一致。','Create a new R Script and run the whole script. Check that total return equals (P1+dividend)/P0−1, accrued interest equals coupon × elapsed share, modified duration equals Macaulay/(1+y/f), and skewness, kurtosis and JB match this page.'],
  fileName:'experiment03-asset-returns.R'
};
function f2(v){return Number(v).toFixed(2);}
window.ReturnsWorkbench={mount:()=>LabRunner.mount(LAB)};
})();
