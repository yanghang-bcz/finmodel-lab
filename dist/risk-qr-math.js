/* Experiment07 拓展 · 第2节 分位数回归与 VaR/ES（课件 7.2）。
   线性分位数回归用 MM-IRLS 求解（基 R 亦可复现），条件分位数直接给出 VaR。
   目标、时点与样本外检验与其余风险视图一致。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats,typeof module==='object'?require('./risk-math'):root.RiskMath);if(typeof module==='object')module.exports=api;else root.RiskQRMath=api;})(this,(S,Risk)=>{
'use strict';
const defaults=Object.freeze({alpha:.95,N:1e6,n:600,seed:2024,aiTrain:.7,tau:null});
function check(p){
  if(!(p.alpha>0&&p.alpha<1))throw Error('置信水平须在 0 与 1 之间。');
  if(!(p.N>0&&p.N<=1e12))throw Error('名义本金须为正且不超过 1e12 元。');
  if(!Number.isInteger(p.n)||p.n<200||p.n>2000)throw Error('样本量须为 200–2000 的整数。');
  if(!(p.aiTrain>=.5&&p.aiTrain<=.85))throw Error('训练比例须为 0.50–0.85。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
/* GARCH(1,1) 波动聚集 + 偶发跳跃的教学样本（确定性）。 */
function sample(p){
  check(p);
  const rng=S.prng(p.seed),r=[],a=.10,b=.85,target=.011**2,omega=target*(1-a-b);
  let v=target;
  for(let i=0;i<p.n;i++){
    v=omega+a*(i?r[i-1]**2:target)+b*v;
    const jump=rng()<.015?2.5:1;
    r.push(Math.sqrt(v)*rng.normal(0,1)*jump);
  }
  return r;
}
function design(r){
  const out=[];let v=null;
  for(let i=2;i<r.length;i++){
    if(v===null){let s=0;for(let j=0;j<i;j++)s+=r[j]*r[j];v=s/i;}
    else v=.94*v+.06*r[i-1]*r[i-1];
    out.push({t:i,y:r[i],x:[1,r[i-1],Math.abs(r[i-1]),Math.log(Math.sqrt(v)+1e-12)]});
  }
  return out;
}
/* MM-IRLS：用 |残差| 的倒数为权重做加权最小二乘，反复迭代逼近分位数回归解。 */
function qreg(rows,tau,iter=40){
  const X=rows.map(d=>d.x),y=rows.map(d=>d.y),k=X[0].length;
  let beta=new Array(k).fill(0);
  for(let it=0;it<iter;it++){
    const A=Array.from({length:k},()=>Array(k).fill(0)),g=new Array(k).fill(0);
    for(let i=0;i<X.length;i++){
      const e=y[i]-X[i].reduce((s,v,j)=>s+v*beta[j],0);
      const w=Math.max(1e-8,(e>0?tau:1-tau)/Math.max(1e-8,Math.abs(e)));
      for(let a=0;a<k;a++){g[a]+=w*X[i][a]*e;for(let b=0;b<k;b++)A[a][b]+=w*X[i][a]*X[i][b];}
    }
    for(let a=0;a<k;a++)A[a][a]+=1e-10;
    const next=S.solve(A,g).map((v,j)=>beta[j]+v);
    const delta=Math.max(...next.map((v,j)=>Math.abs(v-beta[j])));
    beta=next;
    if(delta<1e-10)break;
  }
  const resid=y.map((v,i)=>v-X[i].reduce((s,val,j)=>s+val*beta[j],0));
  return{beta,resid};
}
function kupiec(x,n,p0){
  if(!(n>0))return{LR:NaN,p:NaN,x,n,p0};
  const ph=x/n;
  if(ph===0||ph===1)return{LR:NaN,p:NaN,x,n,p0,ph};
  const LR=2*(x*Math.log(ph/p0)+(n-x)*Math.log((1-ph)/(1-p0)));
  return{LR,p:S.chi2Pvalue(LR,1),x,n,p0,ph};
}
function run(p){
  check(p);
  const tau=1-p.alpha,R=sample(p),rows=design(R);
  const nt=Math.floor(rows.length*p.aiTrain),train=rows.slice(0,nt),test=rows.slice(nt);
  const fit=qreg(train,tau);
  /* 残差尾部分位数用于 ES（等价于对条件分布尾部取均值）。 */
  const eSorted=S.sorted(fit.resid),eQ=S.quantile(fit.resid,tau);
  const tail=fit.resid.filter(v=>v<=eQ),tailMean=tail.length?S.mean(tail):eQ;
  const pred=test.map(d=>d.x.reduce((s,v,j)=>s+v*fit.beta[j],0));
  const actual=test.map(d=>d.y);
  const VaR=pred.map(q=>-p.N*q),ES=pred.map(q=>-p.N*(q+tailMean));
  const loss=actual.map(r=>-p.N*r);
  const hit=loss.filter((l,i)=>l>VaR[i]).length;
  /* 对照：EWMA 正态（同一段日期、同一 α 与本金）。 */
  const k0=Math.max(20,Math.min(nt+2,120)),ew=Risk.ewma(R,p.alpha,p.N,.94,k0);
  const varE=[],esE=[];
  for(const d of test){varE.push(ew.VaR[d.t]);esE.push(ew.ES[d.t]);}
  const hitE=loss.filter((l,i)=>l>varE[i]).length;
  return{tau,R,rows,nt,test,pred,actual,VaR,ES,loss,beta:fit.beta,resid:fit.resid,tailMean,
    hits:hit,n:test.length,kupiec:kupiec(hit,test.length,tau),
    ewma:{varPath:varE,esPath:esE,hits:hitE,n:test.length,kupiec:kupiec(hitE,test.length,tau),meanVaR:S.mean(varE),meanES:S.mean(esE)},
    meanVaR:S.mean(VaR),meanES:S.mean(ES),trainN:train.length};
}
function build(p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const num=v=>{const x=String(Number(v));return /e/i.test(x)?Number(v).toPrecision(15).replace(/0+e/,'e'):x;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  add('data',T('数据与条件分位数目标','Data and the conditional quantile target'),
    ['# Experiment 07.2 | quantile regression VaR | base R only',
     T('# 固定种子的合成日收益（GARCH 波动聚集 + 偶发跳跃）；非真实行情','# Synthetic daily returns from a fixed seed (GARCH clustering plus jumps); not a market quote'),
     `R <- ${vec(q.R)}`,`N <- ${num(p.N)}`,`alpha <- ${num(p.alpha)}`,`tau <- 1 - alpha`,
     T('# 设计矩阵：截距、滞后收益、绝对滞后收益、对数 EWMA 波动率','# Design: intercept, lagged return, |lagged return|, log EWMA volatility'),
     'n <- length(R)',
     T('# 与页面一致的 EWMA 方差：前两期用样本均值，之后 λ=0.94 递推','# Same EWMA variance as the page: sample mean for the first two days, then lambda = 0.94'),
     'vv <- numeric(n); vv[3] <- mean(R[1:2]^2)',
     'for (i in 4:n) vv[i] <- 0.94*vv[i-1] + 0.06*R[i-1]^2',
     T('# 第 1、2 个观测没有完整的滞后与波动信息，从第 3 个观测开始（与页面一致）','# The first two observations lack a complete lag and volatility history; start at observation 3 as the page does'),
     'idx <- 3:n',
     'X <- cbind(1, R[idx - 1L], abs(R[idx - 1L]), log(sqrt(vv[idx]) + 1e-12))',
     'y <- R[idx]',
     'stopifnot(all(is.finite(X)), all(is.finite(y)))'],
    T('分位数回归直接估计条件分位数，不需要正态假设；代价是尾部估计更依赖样本量与模型设定。','Quantile regression estimates a conditional quantile directly with no normality assumption; the cost is more dependence on sample size and specification.'),
    String.raw`\hat Q_\tau(r_t\mid x_t)=x_t'\hat\beta(\tau),\quad \hat\beta=\arg\min\sum\rho_\tau(r_t-x_t'b)`);
  add('fit',T('MM-IRLS 求解与 Kupiec','MM-IRLS fit and Kupiec'),
    [T('# 用 |残差| 的倒数加权，反复求解加权最小二乘','# Weight by the inverse absolute residual and iterate weighted least squares'),
     'qfit <- function(X, y, tau, iter = 40L) {',
     '  b <- rep(0, ncol(X))',
     '  for (it in seq_len(iter)) {',
     '    e <- y - as.vector(X %*% b)',
     '    w <- pmax(1e-8, (ifelse(e > 0, tau, 1 - tau)) / pmax(1e-8, abs(e)))',
     '    A <- crossprod(X * sqrt(w))',
     '    g <- crossprod(X * w, e)',
     '    step <- solve(A, g)',
     '    b <- b + as.vector(step)',
     '    if (max(abs(step)) < 1e-10) break',
     '  }',
     '  list(beta = b, resid = y - as.vector(X %*% b))',
     '}',
     T('# 只用训练期估计，测试期留作样本外检验（与页面同一比例）','# Estimate on the training period only and keep the rest for out-of-sample checks'),
     `ntr <- floor(nrow(X) * ${num(p.aiTrain)})`,
     'fit <- qfit(X[seq_len(ntr), , drop = FALSE], y[seq_len(ntr)], tau)',
     'print(fit$beta)',
     T('# 条件 VaR 与 ES；ES 用残差尾部的均值平移','# Conditional VaR and ES; ES shifts by the mean of the residual tail'),
     'e_q <- quantile(fit$resid, tau, type = 7)',
     'tail_mean <- mean(fit$resid[fit$resid <= e_q])',
     'test <- seq.int(ntr + 1L, nrow(X))',
     'q_hat <- as.vector(X[test, , drop = FALSE] %*% fit$beta)',
     'VaR <- -N * q_hat; ES <- -N * (q_hat + tail_mean)',
     'kupiec <- function(x, n, p0) { ph <- x/n;',
     '  if (ph == 0 || ph == 1) return(c(LR = NA, p = NA))',
     '  LR <- 2*(x*log(ph/p0) + (n-x)*log((1-ph)/(1-p0)))',
     '  c(LR = LR, p = pchisq(LR, 1L, lower.tail = FALSE)) }',
     'hit <- (-N*y[test]) > VaR',
     'print(c(hits = sum(hit), n = length(test), kupiec(sum(hit), length(test), tau)))'],
    T('Kupiec 只检验无条件覆盖；通过不证明模型正确，不通过说明该置信水平下尾部刻画有偏差。','Kupiec tests unconditional coverage only; passing does not prove the model, and failing means the tail is mis-specified at that level.'));
  add('plot',T('条件 VaR 与已实现损失','Conditional VaR against realised losses'),
    ['test <- seq.int(floor(nrow(X) * 0.7) + 1L, nrow(X))',
     'plot(test, -N*y[test], type = "l", col = "grey55", xlab = "day", ylab = "loss (CNY)",',
     '  main = "QR-VaR vs realised loss")',
     'lines(test, VaR[test], col = "steelblue")',
     'legend("topright", c("loss", "QR-VaR"), lty = 1, col = c("grey55","steelblue"), bty = "n")'],
    T('图只画条件 VaR 与已实现损失；ES 与 Kupiec 结果在控制台输出。','The figure draws the conditional VaR and the realised loss; ES and Kupiec are printed.'));
  return{blocks,code:'# FinModel Lab | Experiment 07.2\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,sample,design,qreg,run,build,kupiec};
});
