/* Experiment06 拓展 · 第2节 SV 类模型与第3节 高频波动模型（课件 6.2 / 6.3）。
   SV：Harvey–Ruiz–Shephard 准极大似然（对数平方收益 + 卡尔曼滤波）。
   高频：已实现方差 RV、双幂次变差 BPV、跳跃占比与 signature plot。
   纯计算模块，可在 node 与浏览器中复用；R 脚本由 build 生成。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.VolAdvMath=api;})(this,S=>{
'use strict';
const C=Math.PI*Math.PI/2;           /* Var(log χ²_1) = π²/2 */
const E=-0.5772156649015329-Math.log(2); /* E[log χ²_1] = ψ(1/2)+log2 = -γ-log 2 */
const defaults=Object.freeze({svMu:-6,phi:.95,svSig:.25,n:800,seed:20261114,
  hfDays:60,hfBars:48,hfNoise:.6,hfJumps:.15,hfSeed:7031});
function check(p){
  if(!(p.phi>0&&p.phi<1))throw Error('持续性 φ 须在 0 与 1 之间。');
  if(!(p.svSig>0&&p.svSig<2))throw Error('状态噪声 σ_η 须为正且小于 2。');
  if(!Number.isInteger(p.n)||p.n<200||p.n>2000)throw Error('样本量须为 200–2000 的整数。');
  if(!Number.isInteger(p.hfDays)||p.hfDays<20||p.hfDays>200)throw Error('高频天数须为 20–200 的整数。');
  if(!Number.isInteger(p.hfBars)||p.hfBars<12||p.hfBars>144)throw Error('每日分钟收益数须为 12–144 的整数。');
  if(!(p.hfNoise>=0&&p.hfNoise<=5))throw Error('微观结构噪声须在 0 与 5 之间。');
  if(!(p.hfJumps>=0&&p.hfJumps<1))throw Error('跳跃概率须在 0 与 1 之间。');
  return true;
}
/* ---------- 1. SV 类模型 ---------- */
/* 模拟：h_t = μ + φ(h_{t-1}−μ) + η_t，r_t = exp(h_t/2)·ε_t（简单收益近似）。 */
function simulateSV(p){
  check(p);
  const rng=S.prng(p.seed),n=p.n,h=[],r=[];
  let x=p.svMu;
  for(let t=0;t<n;t++){
    x=p.svMu+p.phi*(x-p.svMu)+p.svSig*rng.normal();
    h.push(x);r.push(Math.exp(x/2)*rng.normal());
  }
  return{h,r};
}
/* 卡尔曼滤波：状态 α_t = h_t − μ，观测 y_t = log(r_t²) − E − μ。
   量测方差固定为 π²/2（QML），参数由网格 + 黄金分割搜索，避免依赖 optim。 */
function kalman(y,par){
  const {phi,sig}=par, q=sig*sig, n=y.length;
  let a=0,P=q/(1-phi*phi);            /* 平稳先验 */
  let loglik=0;
  const filtered=[];
  for(let t=0;t<n;t++){
    const v=y[t]-a, F=P+C;            /* 预测误差与方差 */
    if(!(F>0)||!Number.isFinite(v))return{loglik:-Infinity};
    loglik+=-0.5*(Math.log(2*Math.PI*F)+v*v/F);
    const K=P/F;                      /* 更新 */
    a=a+K*v;P=(1-K)*P;
    filtered.push(a);
    a=phi*a;P=phi*phi*P+q;            /* 预测下一步 */
  }
  return{loglik:loglik/n,filtered};
}
function fitSV(r){
  const n=r.length, y=r.map(v=>Math.log(v*v+1e-12)-E), meanY=S.mean(y), dev=y.map(v=>v-meanY);
  /* 粗网格搜索 φ、σ_η，再对 φ 做一次细化。 */
  let best=null;
  for(const phi of [.80,.85,.90,.93,.95,.97,.98,.99]){
    for(const sig of [.10,.15,.20,.25,.30,.40,.55]){
      const ll=kalman(dev,{phi,sig}).loglik;
      if(!best||ll>best.ll)best={phi,sig,ll};
    }
  }
  for(const phi of [best.phi-.02,best.phi-.01,best.phi+.01,best.phi+.02]){
    if(!(phi>0&&phi<1))continue;
    for(const sig of [best.sig*.85,best.sig*.93,best.sig,best.sig*1.07,best.sig*1.15]){
      const ll=kalman(dev,{phi,sig}).loglik;
      if(ll>best.ll)best={phi,sig,ll};
    }
  }
  const run=kalman(dev,{phi:best.phi,sig:best.sig});
  const h=run.filtered.map(a=>a+meanY);          /* α_t + μ = log 方差 */
  const vol=h.map(v=>Math.exp(v/2));
  const resid=r.map((v,i)=>v/vol[i]);
  return{mu:meanY,phi:best.phi,sigma:best.sig,loglik:best.ll,vol,fitPct:S.mean(vol),persistence:best.phi,
    sigmaEta2:best.sig*best.sig,residSd:S.sd(resid),n,
    /* 年化只用于展示：日波动 × √252 */
    annual:S.mean(vol)*Math.sqrt(252)};
}
function svView(p){
  const sim=simulateSV(p), fit=fitSV(sim.r);
  const garchLike=[];                            /* 对照：EWMA λ=0.94 */
  let v=null;
  for(let i=0;i<sim.r.length;i++){
    if(v===null){let s=0;for(let j=0;j<=i;j++)s+=sim.r[j]*sim.r[j];v=s/(i+1);}
    else v=.94*v+.06*sim.r[i-1]*sim.r[i-1];
    garchLike.push(Math.sqrt(v));
  }
  return{...fit,r:sim.r,h:sim.h,trueVol:sim.h.map(x=>Math.exp(x/2)),ewma:garchLike,
    trueMu:p.svMu,truePhi:p.phi,trueSigma:p.svSig};
}
/* ---------- 2. 高频波动模型 ---------- */
/* 模拟日内价格：真实对数价格 + 微观结构噪声（噪声加在价格上，不是收益上）。
   观测收益 = 真实收益 + η_t − η_{t-1}，因此采样越细，RV 的噪声偏差越大。 */
function simulateHF(p){
  check(p);
  const rng=S.prng(p.hfSeed),days=[],M=p.hfBars;
  let dailyVol=0.011;
  for(let d=0;d<p.hfDays;d++){
    dailyVol*=Math.exp(.20*(Math.log(.011)-Math.log(dailyVol))+.35*rng.normal()*0.6);
    const jump= rng()<p.hfJumps? (rng()<.5?-1:1)*(2+rng()*2)*dailyVol : 0;
    const jumpAt=Math.floor(rng()*M);
    const errSd=p.hfNoise*dailyVol/Math.sqrt(M);
    const trueLog=[0],obsLog=[errSd*rng.normal()];
    for(let b=0;b<M;b++){
      const inc=dailyVol/Math.sqrt(M)*rng.normal()+(b===jumpAt?jump:0);
      trueLog.push(trueLog[b]+inc);
      obsLog.push(trueLog[b+1]+errSd*rng.normal());
    }
    days.push({trueLog,obsLog,vol:dailyVol,jump:jump!==0});
  }
  return{days};
}
/* signature plot：用 k 根聚合收益计算 RV；k 越大噪声偏差越小。 */
function hfView(p){
  const sim=simulateHF(p), M=p.hfBars, days=sim.days;
  const freqs=[1,2,3,4,6,8,12,16,24].filter(v=>v<=M/2);
  const rvAt=k=>days.map(d=>{let s=0;for(let b=0;b+k<=M;b+=k){const r=d.obsLog[b+k]-d.obsLog[b];s+=r*r;}return s;});
  const signature=freqs.map(k=>({k,count:Math.floor(M/k),mean:S.mean(rvAt(k))}));
  const bars=d=>{const r=[];for(let b=0;b<M;b++)r.push(d.obsLog[b+1]-d.obsLog[b]);return r;};
  const rv=days.map(d=>bars(d).reduce((s,v)=>s+v*v,0));
  const bpv=days.map(d=>{const r=bars(d);let s=0;for(let i=1;i<r.length;i++)s+=Math.abs(r[i])*Math.abs(r[i-1]);return (Math.PI/2)*s;});
  const jumps=rv.map((v,i)=>Math.max(0,v-bpv[i]));
  const jumpShare=rv.map((v,i)=>v>0?Math.max(0,1-bpv[i]/v):NaN);
  const test=rv.map((v,i)=>bpv[i]>0?(1-bpv[i]/v)/Math.sqrt(1.06/M):NaN);
  const trueVar=days.map(d=>d.vol*d.vol);
  return{signature,rv,bpv,jumps,jumpShare,test,trueVar,days,
    meanRV:S.mean(rv),meanBPV:S.mean(bpv),meanTrue:S.mean(trueVar),meanJump:S.mean(jumpShare),
    noiseShare:S.mean(rv.map((v,i)=>v/trueVar[i]-1)),bars:M,
    jumpDays:days.filter(d=>d.jump).length,nDays:days.length,p:p.hfBars};
}
/* ---------- 3. 协同持续（向量 GARCH 的系数和） ---------- */
/* 双变量 CCC-GARCH 的持续性矩阵：Σ A + Σ B 的最大特征值决定共同的波动记忆。 */
function persistence(a1,a2,b1,b2,rho){
  const A=[[a1,0],[0,a2]],B=[[b1,0],[0,b2]];
  const M=[[A[0][0]+B[0][0],0],[0,A[1][1]+B[1][1]]];
  const rhoD=S.clamp(rho,-.999,.999);
  const S2=[[1,rhoD],[rhoD,1]];
  const M2=[[M[0][0]*S2[0][0],M[0][0]*S2[0][1]],[M[1][1]*S2[1][0],M[1][1]*S2[1][1]]];
  const tr=M2[0][0]+M2[1][1],det=M2[0][0]*M2[1][1]-M2[0][1]*M2[1][0];
  const disc=Math.max(0,tr*tr/4-det),l1=tr/2+Math.sqrt(disc),l2=tr/2-Math.sqrt(disc);
  return{common:Math.max(l1,l2),individual:[a1+b1,a2+b2],rho:rhoD,coPersist:Math.min(l1,l2)};
}
/* ---------- 4. R 脚本 ---------- */
const num=v=>{const x=String(Number(v));return /e/i.test(x)?Number(v).toPrecision(15).replace(/0+e/,'e'):x;};
function vec(a,per=10){const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=per)lines.push('  '+parts.slice(i,i+per).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';}
function build(view,q,p,mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  if(view==='sv'){
    add('data',T('数据与模型设定','Data and model setup'),
      ['# Experiment 06.2 | stochastic volatility | base R only',
       T('# 固定种子的合成日收益；r_t = exp(h_t/2) ε_t，h_t 为 AR(1) 对数方差','# Synthetic daily returns from a fixed seed; r_t = exp(h_t/2) ε_t with AR(1) log variance'),
       `r <- ${vec(q.r)}`,
       'n <- length(r)',
       T('# 对数平方收益：E[log χ²_1] = −γ − log 2','# Log-squared returns: E[log chi-square_1] = -gamma - log 2'),
       'E <- -0.5772156649 - log(2)',
       'y <- log(r^2 + 1e-12)',
       'yv <- y - E'],
      T('SV 把方差本身当作不可观测的随机过程；对数平方收益是它的带噪观测。','Stochastic volatility treats variance as a latent random process observed only through log-squared returns.'));
    add('kalman',T('卡尔曼滤波与准极大似然','Kalman filter and quasi-maximum likelihood'),
      [T('# 状态 α_t = h_t − μ；观测 y_t = α_t + 噪声，量测方差固定为 π²/2','# State alpha_t = h_t - mu; observation y_t = alpha_t + noise with measurement variance pi^2/2'),
       'kf <- function(y, phi, sig) {',
       '  q <- sig^2; C <- pi^2/2; a <- 0; P <- q/(1-phi^2); ll <- 0',
       '  filt <- numeric(length(y))',
       '  for (t in seq_along(y)) {',
       '    v <- y[t] - a; F <- P + C',
       '    if (!is.finite(v) || F <= 0) return(list(ll = -Inf))',
       '    ll <- ll - 0.5*(log(2*pi*F) + v^2/F)',
       '    K <- P/F; a <- a + K*v; P <- (1-K)*P; filt[t] <- a',
       '    a <- phi*a; P <- phi^2*P + q',
       '  }',
       '  list(ll = ll/length(y), filtered = filt)',
       '}',
       'grid <- expand.grid(phi = c(.80,.85,.90,.93,.95,.97,.98,.99),',
       '  sig = c(.10,.15,.20,.25,.30,.40,.55))',
       'grid$ll <- mapply(function(phi, sig) kf(yv - mean(yv), phi, sig)$ll, grid$phi, grid$sig)',
       'best <- grid[which.max(grid$ll), ]',
       T('# 第二轮：在最优解附近细化，与页面使用同一组候选','# Second pass: refine around the optimum with the same candidate set as the page'),
       'refine <- expand.grid(phi = best$phi + c(-.02, -.01, .01, .02),',
       '  sig = best$sig * c(.85, .93, 1, 1.07, 1.15))',
       'refine <- refine[refine$phi > 0 & refine$phi < 1, ]',
       'refine$ll <- mapply(function(phi, sig) kf(yv - mean(yv), phi, sig)$ll, refine$phi, refine$sig)',
       'if (max(refine$ll) > best$ll) best <- refine[which.max(refine$ll), ]',
       'print(best)'],
      T('参数由网格搜索得到，避免依赖 optim 的收敛细节；φ 接近 1 表示波动记忆很强。','Parameters come from a grid search rather than optim convergence; phi near one means strong volatility memory.'),
      String.raw`h_t=\mu+\phi(h_{t-1}-\mu)+\eta_t,\quad \log r_t^2=h_t+\log\varepsilon_t^2`);
    add('compare',T('与 EWMA 对照','Compare with EWMA'),
      [T('# 滤波得到的波动率与 EWMA（λ=0.94）放在同一坐标上','# Filtered volatility and EWMA (lambda = 0.94) on the same axis'),
       'run <- kf(yv - mean(yv), best$phi, best$sig)',
       'hhat <- run$filtered + mean(yv)',
       'vol_sv <- exp(hhat/2)',
       'v <- mean(r^2); vol_ewma <- numeric(n)',
       'for (i in seq_len(n)) {',
       '  vol_ewma[i] <- sqrt(v)',
       '  v <- 0.94*v + 0.06*r[i]^2',
       '}',
       'plot(vol_sv, type = "l", ylab = "daily volatility", xlab = "day", main = "SV filter vs EWMA")',
       'lines(vol_ewma, lty = 2)',
       'cat("SV mean vol:", mean(vol_sv), " EWMA mean vol:", mean(vol_ewma), "\n")'],
      T('SV 是模型内的滤波估计，EWMA 是指数加权规则；两者都不是对未来波动的保证。','The SV curve is a model-based filtered estimate and EWMA is a weighting rule; neither guarantees future volatility.'));
  } else if(view==='hf'){
    const d=q.days.slice(0,10);
    const obs=d.map(day=>day.obsLog);
    add('data',T('高频数据与观测价格','High-frequency data and observed prices'),
      ['# Experiment 06.3 | realised volatility | base R only',
       T('# 前 10 个交易日的完整观测对数价格（每行一天，每行 49 个价格点）','# Full observed log prices for the first 10 trading days (one row per day, 49 prices each)'),
       `obs <- ${'rbind(\n'+obs.map(r=>'  c('+r.map(v=>num(Number(v.toFixed(10)))).join(', ')+')').join(',\n')+'\n)'}`,
       'M <- ncol(obs) - 1L',
       'bars <- function(row) diff(row)',
       T('# 观测收益 = 真实收益 + 噪声差分，因此频率越高 RV 偏差越大','# Observed returns equal true returns plus a noise difference, so finer sampling biases RV more'),
       'r1 <- t(apply(obs, 1, bars))',
       'dim(r1)'],
      T('高频价格带有微观结构噪声：报价离散、买卖价差与延迟，都会让观测收益偏离真实收益。','High-frequency prices carry microstructure noise: discreteness, bid-ask bounce and latency all push observed returns away from the true ones.'));
    add('rv',T('已实现方差与双幂次变差','Realised variance and bipower variation'),
      [T('# RV 是平方收益之和；BPV 用相邻绝对收益的乘积，对跳跃稳健','# RV sums squared returns; BPV multiplies adjacent absolute returns and is robust to jumps'),
       'rv <- rowSums(r1^2)',
       'bpv <- (pi/2) * rowSums(abs(r1[, -1, drop = FALSE]) * abs(r1[, -ncol(r1), drop = FALSE]))',
       'jump <- pmax(0, rv - bpv)',
       'print(data.frame(day = seq_along(rv), rv = rv, bpv = bpv, jump = jump))',
       'cat("mean RV:", mean(rv), " mean BPV:", mean(bpv), " jump share:", mean(jump/rv), "\n")'],
      T('RV 把跳跃也算进方差；BPV 只累计连续变动，两者之差是跳跃部分的描述性度量。','RV counts jumps as variance; BPV accumulates only continuous variation, so their difference describes the jump part.'),
      String.raw`RV=\sum_i r_i^2,\quad BPV=\frac{\pi}{2}\sum_{i\ge2}|r_i||r_{i-1}|`);
    add('signature',T('signature plot','Signature plot'),
      [T('# 用 k 根聚合收益重算 RV：k 越大，噪声偏差越小','# Recompute RV from k-bar aggregated returns: larger k, smaller noise bias'),
       'ks <- c(1, 2, 3, 4, 6)',
       'sig <- sapply(ks, function(k) {',
       '  mean(vapply(seq_len(nrow(obs)), function(row) {',
       '    b <- obs[row, ]',
       '    sum(diff(b[seq(1, length(b), by = k)])^2)',
       '  }, numeric(1)))',
       '})',
       'print(data.frame(k = ks, rv = sig))',
       'plot(ks, sig, type = "b", xlab = "aggregation k", ylab = "RV", main = "Signature plot")'],
      T('signature plot 应当随 k 上升而下降并趋于真实积分方差；如果反而上升，通常是噪声结构设定错了。','A signature plot should fall with k towards the integrated variance; a rising plot usually means the noise structure is misspecified.'));
  } else {
    add('persist',T('协同持续','Common persistence'),
      [T('# 双变量波动过程的持续性矩阵与共同特征值','# Persistence matrix and common eigenvalue of a bivariate volatility process'),
       `A <- c(${num(p.phi)}, ${num(p.phi)})`,
       'M <- diag(A)',
       'rho <- 0.6',
       'S <- matrix(c(1, rho, rho, 1), 2, 2)',
       'P <- M %*% S',
       'ev <- eigen(P, only.values = TRUE)$values',
       'print(ev)',
       'cat("common persistence:", max(Mod(ev)), "\n")'],
      T('协同持续取决于持续性矩阵的最大特征值，而不是单个方程的参数之和。','Common persistence depends on the largest eigenvalue of the persistence matrix, not on a single equation sum.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  const body=chosen.map(b=>b.lines.join('\n')).join('\n\n');
  return{blocks:chosen,code:'# FinModel Lab | Experiment 06 extension\n\n'+body+'\n'};
}
return{defaults,check,simulateSV,kalman,fitSV,svView,simulateHF,hfView,persistence,build,C,E};
});
