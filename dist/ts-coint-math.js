/* Experiment05 拓展 · 协整与误差校正模型（课件 L14 第一节）。
   E-G 两步法 + ADF + ECM；数据为确定性合成的"共同趋势 + 均值回复价差"。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.CointMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({n:400,seed:20261114,beta:1,mu:0,phi:.85,sigU:.02,sigX:.012,kind:'coint',lag:1});
const CRIT={none:{1:-2.58,5:-1.95,10:-1.62},drift:{1:-3.43,5:-2.86,10:-2.57},trend:{1:-3.96,5:-3.41,10:-3.12},eg:{1:-3.90,5:-3.34,10:-3.04}};
function check(p){
  if(!Number.isInteger(p.n)||p.n<100||p.n>1200)throw Error('样本量须为 100–1200 的整数。');
  if(!(p.phi>0&&p.phi<1))throw Error('价差自回归系数 φ 须在 0 与 1 之间（φ=1 表示不协整）。');
  if(!(p.sigU>0&&p.sigX>0))throw Error('两个新息的标准差必须为正。');
  if(!['coint','spurious'].includes(p.kind))throw Error('情景只能是"协整"或"伪回归"。');
  if(!Number.isInteger(p.lag)||p.lag<1||p.lag>6)throw Error('ADF 与 ECM 的滞后阶数须为 1–6。');
  return true;
}
function generate(p){
  check(p);
  const rng=S.prng(p.seed),n=p.n,x=[0],y=[0];let u=0;
  for(let t=1;t<n;t++){
    x.push(x[t-1]+p.sigX*rng.normal()+(p.mu||0));
    if(p.kind==='spurious')u+=p.sigU*rng.normal();          /* 随机游走价差：伪回归 */
    else u=p.phi*u+p.sigU*rng.normal();
    y.push(p.beta*x[t]+u);
  }
  return{x,y,u,n:p.n};
}
/* OLS：y = a + b x + u */
function ols(y,x){
  const n=y.length,mx=S.mean(x),my=S.mean(y);
  const sxx=S.sum(x.map(v=>(v-mx)**2)),sxy=S.sum(x.map((v,i)=>(v-mx)*(y[i]-my)));
  const b=sxy/sxx,a=my-b*mx,res=y.map((v,i)=>v-a-b*x[i]);
  const se=Math.sqrt(S.sum(res.map(v=>v*v))/(n-2)/sxx);
  return{a,b,se,res,t:(b-0)/se,r2:1-S.sum(res.map(v=>v*v))/S.sum(y.map(v=>(v-my)**2))};
}
/* ADF：Δy_t = c + γ y_{t-1} + Σ δ_i Δy_{t-i}，报告 τ 与临界值 */
function adf(y,lag=1,type='drift'){
  const d=[];for(let t=1;t<y.length;t++)d.push(y[t]-y[t-1]);
  const rows=[];
  for(let t=lag;t<d.length;t++){
    const row=[1,y[t]];              /* y[t] 对应 y_{t} 水平项（差分 d[t] = y_{t+1}-y_t） */
    for(let j=1;j<=lag;j++)row.push(d[t-j]);
    rows.push({x:row,y:d[t]});
  }
  const k=rows[0].x.length,X=rows.map(r=>r.x),Y=rows.map(r=>r.y);
  const fit=S.ols(Y,Array.from({length:k-1},(_,j)=>X.map(r=>r[j+1])),{names:['y','d']});
  const tau=fit.t[1],crit=CRIT[type];
  return{tau,lag,n:rows.length,crit,res:fit.resid,coef:fit.beta,se:fit.se,
    reject:tau<crit[5],ci:{lo:crit[5]}};
}
/* ECM：Δy_t = c + γ u_{t-1} + φ Δy_{t-1} + θ Δx_{t-1} + e */
function ecm(x,y,lag=1){
  const dx=[],dy=[],rows=[];
  for(let t=1;t<y.length;t++){dx.push(x[t]-x[t-1]);dy.push(y[t]-y[t-1]);}
  const fit0=ols(y,x),u=fit0.res;
  for(let t=lag;t<dy.length;t++){
    const row=[1,u[t-1+1]];         /* u 的索引与差分对齐：用 u_{t} 对应 dy[t] 的前一期 */
    for(let j=1;j<=lag;j++)row.push(dy[t-j]);
    for(let j=1;j<=lag;j++)row.push(dx[t-j]);
    rows.push({x:row,y:dy[t]});
  }
  const X=rows.map(r=>r.x),Y=rows.map(r=>r.y),k=X[0].length;
  const fit=S.ols(Y,Array.from({length:k-1},(_,j)=>X.map(r=>r[j+1])),{names:['u','dy','dx']});
  const gamma=fit.beta[1],seGamma=fit.se[1];
  const halfLife=gamma<0&&gamma>-1?Math.log(.5)/Math.log(1+gamma):NaN;
  return{gamma,se:seGamma,t:fit.t[1],p:fit.p[1],coef:fit.beta,halfLife,r2:fit.r2,n:rows.length,
    alpha:fit0.a,beta:fit0.b};
}
function run(p){
  check(p);
  const d=generate(p),x=d.x,y=d.y;
  const adfX=adf(x,p.lag,'drift'),adfY=adf(y,p.lag,'drift'),adfU=adf(ols(y,x).res,p.lag,'eg');
  const fit=ols(y,x),ecmFit=ecm(x,y,p.lag);
  return{...d,adfX,adfY,adfU,fit,ecm:ecmFit,
    spread:fit.res,trueBeta:p.beta,
    conclusion:{cointegrated:adfU.reject,spurious:p.kind==='spurious'}};
}
function build(p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(id,title,text,code)=>blocks.push({id,title,text,code:(Array.isArray(code)?code.join('\n'):String(code)).trim()});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  add('cdata',T('数据 / Data','Data'),T('两条对数价格序列：共同随机趋势 + 均值回复价差（或伪回归情景）。','Two log price series: a common stochastic trend plus a mean-reverting spread, or a spurious-regression scenario.'),
    ['# FinModel Lab | Experiment 05.5 | cointegration | Base R, no extra packages.',
     `# ${p.kind==='coint'?'cointegrated pair':'random-walk spread (spurious regression)'}`,
     `x <- ${vec(q.x)}`,`y <- ${vec(q.y)}`,`n <- length(x)`,`lag <- ${p.lag}L`,
     'stopifnot(n >= 100, length(y) == n)']);
  add('ceg',T('E-G 两步法 / Engle-Granger','Engle-Granger two-step'),T('第一步做水平回归得到价差，第二步对价差做 ADF；临界值不能用普通 t 表。','Step one regresses the levels to get the spread; step two runs ADF on it with its own critical values.'),
    ['fit <- lm(y ~ x)','u <- resid(fit)','print(summary(fit)$coefficients)',
     'adf_u <- function(u, lag) {','  d <- diff(u); n <- length(d)',
     '  X <- cbind(1, u[(lag + 1L):(length(u) - 1L)])',
     '  for (j in seq_len(lag)) X <- cbind(X, d[(lag + 1L - j):(length(d) - j)])',
     '  f <- lm.fit(X, d[(lag + 1L):n])',
     '  s2 <- sum(f$residuals^2)/f$df.residual',
     '  vc <- chol2inv(qr.R(f$qr))*s2',
     '  tau <- f$coefficients[2]/sqrt(vc[2, 2])',
     '  c(tau = unname(tau), n = f$df.residual + ncol(X))','}',
     'print(adf_u(u, lag))',
     '# Engle-Granger 5% critical value (with constant, two variables) is about -3.34.']);
  add('cecm',T('误差校正模型 / ECM','Error-correction model (ECM)'),T('把价差放回差分方程：γ<0 表示偏离会在下一期被部分纠正；半衰期 = ln(0.5)/ln(1+γ)。','Put the spread back into the differenced equation: a negative gamma means deviations are partly corrected next period; half-life = ln(0.5)/ln(1+gamma).'),
    ['d1 <- diff(y)','x1 <- diff(x)',
     'ecm_data <- data.frame(d1 = d1[2:length(d1)], u1 = u[2:(length(u) - 1)], l1 = d1[1:(length(d1) - 1)])',
     'e <- lm(d1 ~ u1 + l1, data = ecm_data)','print(summary(e)$coefficients)',
     'gamma <- coef(e)[2]','cat("half-life:", log(0.5)/log(1 + gamma), "\\n")',
     'plot(u, type = "l", xlab = "t", ylab = "spread", main = "Cointegrating residual")',
     'abline(h = 0, lty = 2)']);
  return{blocks,script:'# FinModel Lab | Experiment 05.5 | cointegration\n\n'+blocks.map(b=>b.code).join('\n\n')+'\n'};
}
return{defaults,check,generate,ols,adf,ecm,run,build,CRIT};
});
