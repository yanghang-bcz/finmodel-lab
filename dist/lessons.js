(function(root){
'use strict';
const pct=n=>(n*100).toFixed(2)+'%',f=n=>Number(n.toPrecision(12)).toString(),literal=n=>n.toString();
function build(p,m){const b=1-p.w,q=m.current;
const step=(id,lines,title,summary,formula,calculation,result,target=id,extra={})=>({id,lines,title,summary,formula,calculation,result,target,...extra});
const steps = [
step('setup',['# 实验08：两资产均值—方差组合'],'模型设定','用同一期限的收益率与标准差，比较两资产组合；参数是教学假设。','w₁ + w₂ = 1；0 ≤ w₁, w₂ ≤ 1','','不允许卖空；金额占比合计 100%。','all'),
step('returns',[`mu <- c(A = ${literal(p.mu1)}, B = ${literal(p.mu2)})`],'定义两资产预期收益率','向量 mu 保存收益预期；百分数在 R 中写成小数。','μ₁, μ₂',`μ₁ = ${f(p.mu1)}；μ₂ = ${f(p.mu2)}`,`A ${pct(p.mu1)} / B ${pct(p.mu2)}`,'returns'),
step('volatility',[`s <- c(A = ${literal(p.s1)}, B = ${literal(p.s2)})`],'定义两资产标准差','标准差衡量波动幅度；两项资产的标准差不能直接加权得到组合风险。','σ₁ ≥ 0；σ₂ ≥ 0',`σ₁ = ${f(p.s1)}；σ₂ = ${f(p.s2)}`,`A ${pct(p.s1)} / B ${pct(p.s2)}`,'volatility'),
step('correlation',[`rho <- ${literal(p.rho)}`],'定义相关系数','ρ 决定共同波动的方向与强度，进入方差中的协方差项。','Cov(A, B) = σ₁σ₂ρ',`${f(p.s1)} × ${f(p.s2)} × ${f(p.rho)} = ${f(p.s1*p.s2*p.rho)}`,'相关性降低时，内部组合的协方差贡献下降。','correlation'),
step('weights',[`w1 <- ${literal(p.w)}`, 'w2 <- 1 - w1'],'分配投资组合权重','A 的权重变化时，B 自动补足，全部资金始终分配完毕。','w₂ = 1 − w₁',`1 − ${f(p.w)} = ${f(b)}`,`A ${pct(p.w)} / B ${pct(b)}`,'allocation'),
step('mean',['rp <- w1*mu[1] + w2*mu[2]'],'计算投资组合预期收益率','按投资权重对两只资产的预期收益率加权平均。','E(Rp) = w₁μ₁ + w₂μ₂',`${f(p.w)} × ${f(p.mu1)} + ${f(b)} × ${f(p.mu2)} = ${f(q.mean)}`,`结果：${pct(q.mean)}`,'return'),
step('variance',['vp <- w1^2*s[1]^2 +','      w2^2*s[2]^2 +','      2*w1*w2*s[1]*s[2]*rho'],'计算投资组合方差','方差由两项资产自身项和协方差项组成；逐项代入，再求和与开平方。','Var(Rp) = w₁²σ₁² + w₂²σ₂² + 2w₁w₂σ₁σ₂ρ','',`方差 ${f(q.variance)} → 标准差 ${pct(q.sd)}`,'risk',{terms:q.terms,termCalculations:[`${f(p.w)}² × ${f(p.s1)}²`,`${f(b)}² × ${f(p.s2)}²`,`2 × ${f(p.w)} × ${f(b)} × ${f(p.s1)} × ${f(p.s2)} × ${f(p.rho)}`],economic:q.terms[2]<0?'负协方差抵消部分风险；总方差仍非负。':q.terms[2]===0?'协方差贡献为零，当前风险来自两项自身贡献。':'正协方差增加共同波动风险；降低 ρ 可减小这一项。'}),
step('sd',['sp <- sqrt(vp)'],'由方差得到组合标准差','对方差开平方，得到与收益率同量纲、可直观比较的风险。','σp = √Var(Rp)',`√${f(q.variance)} = ${f(q.sd)}`,`组合风险：${pct(q.sd)}`,'risk'),
step('curvature',['d <- (s[1]-s[2])^2 +','     2*s[1]*s[2]*(1-rho)'],'判断风险是否随权重变化','d 是方差的二次项系数；使用非负等价式避免退化附近的相减误差。','d = σ₁² + σ₂² − 2σ₁σ₂ρ',`d = ${f(m.D)}`,m.flat?'方差恒定：所有权重均为最小方差解。':'d > 0：方差为凸二次函数。','minimum'),
step('minimum',['mv <- if (d == 0) {','  as.numeric(mu[1] >= mu[2])','} else {','  max(0, min(1,','    (s[2]*(s[2]-s[1]) +','     s[1]*s[2]*(1-rho))/d))','}'],'求最小方差组合',m.flat?'所有权重均有相同方差；仅为绘图选取收益更高的端点作为代表，不是唯一解。':'对方差函数求导，再将权重限制在 [0, 1]，满足不卖空约束。','w* = clip[(σ₂² − σ₁σ₂ρ) / d]',m.flat?'d = 0；最小方差权重不唯一。':`A ${pct(m.mv)} / B ${pct(1-m.mv)}`,`最小标准差：${pct(m.minimum.sd)}`,'minimum'),
step('weightsGrid',['w <- sort(unique(c(','  seq(0, 1, 0.0025), mv)))'],'枚举可行组合','枚举非负权重，并加入精确的最小方差点，避免采样遗漏拐点。','0 ≤ w ≤ 1',`共 ${m.points.length} 个不重复的可行权重`,'曲线为采样点连线。','curve'),
step('curveMean',['ret <- w*mu[1] + (1-w)*mu[2]'],'计算曲线的收益坐标','同一条收益公式应用于全部可行权重，构成图表的纵坐标。','E(Rp(w)) = wμ₁ + (1−w)μ₂','',`当前收益：${pct(q.mean)}`,'return'),
step('curveRisk',['vol <- sqrt(','  (w*s[1]-(1-w)*s[2])^2 +','  2*w*(1-w)*s[1]*s[2]*(1+rho))'],'计算曲线的风险坐标','用代数等价的非负形式生成全部权重的标准差，避免完全负相关时的数值抵消。','σp(w) = √[(wσ₁−(1−w)σ₂)² + 2w(1−w)σ₁σ₂(1+ρ)]','',`当前标准差：${pct(q.sd)}`,'risk'),
step('efficient',[`eff <- ${m.equal?(m.flat?'rep(TRUE, length(w))':'abs(w-mv) < 1e-10'):m.flat?`abs(w-${p.mu1>p.mu2?1:0}) < 1e-10`:`w ${p.mu1>p.mu2?'>=':'<='} mv ${p.mu1>p.mu2?'-':'+'} 1e-10`}`],'识别有效部分','有效组合不被其他组合支配：无法在不增加风险的前提下提高收益，或在不降低收益的前提下降低风险。','风险不高且收益不低，至少一项严格改善 → 支配',m.equal?(m.flat?'风险收益完全一致，所有权重等价。':'收益相同，仅最小风险位置有效。'):m.flat?'风险恒定，仅最高收益端点有效。':'取从最小方差点通向高收益端点的一段。',`当前组合${m.efficient(p.w)?'位于有效部分':'可被有效组合改善'}`,'efficient'),
step('plot',['plot(vol, ret, type="l",','  col="grey70", xlab="Risk (SD)",','  ylab="Expected return")'],'绘制全部可行组合','横轴为组合标准差，纵轴为预期收益；灰线连接全部可行组合。','横轴 σp；纵轴 E(Rp)','','数值使用小数，网页坐标转换为百分数。','curve'),
step('highlight',['lines(vol[eff], ret[eff],','  col="seagreen", lwd=3)','points(vol[eff], ret[eff],','  col="seagreen", pch=16, cex=.3)'],'绘制有效部分','绿色突出有效组合；退化为单点时仍通过 points 显示。','有效部分 ⊆ 全部可行组合','','相同收益取最小风险；相同风险取最高收益。','efficient'),
step('current',['points(sp, rp, pch=19,','  col="steelblue", cex=1.4)'],'标记当前投资组合','权重变化移动当前点；收益、标准差或相关系数变化会改变可行集。','当前坐标 = (σp, E(Rp))',`(${pct(q.sd)}, ${pct(q.mean)})`,`A ${pct(p.w)} / B ${pct(b)}`,'current'),
step('output',['print(c(return=rp,','  variance=vp, sd=sp))'],'输出当前计算结果','在基础 R 或 RStudio 整体运行代码，获得与网页一致的结果。','收益 / 方差 / 标准差',`${f(q.mean)} / ${f(q.variance)} / ${f(q.sd)}`,'方差以小数原值输出，不作为百分比。','all')
];
// Keep engineering decisions in the generator. Only expose a financial identity
// when the current inputs make direct subtraction lose the near-zero result.
const raw=q.terms.reduce((a,b)=>a+b,0),scale=(p.w*p.s1+b*p.s2)**2;
if(p.rho===-1 || (scale>0&&raw<=scale*1e-12)){
 const index=steps.findIndex(s=>s.id==='sd');
 steps.splice(index,0,step('boundaryVariance',[
 'vp <- (w1*s[1] - w2*s[2])^2 +',
 '      2*w1*w2*s[1]*s[2]*(1+rho)'],
 '边界情形：抵消后的方差','完全负相关或风险接近抵消时，采用同一公式的非负等价式。完全负相关时，组合风险为两资产加权波动之差的绝对值。',
 'Var(Rp) = (w₁σ₁−w₂σ₂)² + 2w₁w₂σ₁σ₂(1+ρ)', '',`方差 ${f(q.variance)}`,'risk'));
}
return steps;}
function code(steps){return steps.flatMap(s=>s.lines).join('\n');}
root.FinLessons={build,code,pct,f};if(typeof module!=='undefined')module.exports=root.FinLessons;
})(typeof window!=='undefined'?window:globalThis);
