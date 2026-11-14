/* Experiment08 拓展 · 切点组合、均值-CVaR 与高阶矩（教材 8.1 fPortfolio 案例 / 8.2 / 8.3）。
   三资产、固定种子的月度收益；权重网格上比较夏普、CVaR 与偏度。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.PortfolioAdvMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({months:240,seed:20261114,rf:.002,alpha:.95,step:.05,
  mu1:.008,mu2:.006,mu3:.004,sd1:.05,sd2:.04,sd3:.02,rho12:.35,rho13:.1,rho23:-.05});
function check(p){
  if(!Number.isInteger(p.months)||p.months<120||p.months>600)throw Error('月份数须为 120–600 的整数。');
  if(!(p.alpha>.9&&p.alpha<.999))throw Error('置信水平须在 0.90 与 0.999 之间。');
  if(!(p.step>=.01&&p.step<=.2))throw Error('网格步长须在 0.01 与 0.2 之间。');
  if(!(p.sd1>0&&p.sd2>0&&p.sd3>0))throw Error('波动率必须为正。');
  if([p.rho12,p.rho13,p.rho23].some(v=>v<=-1||v>=1))throw Error('相关系数须在 (−1,1) 内。');
  return true;
}
function covMatrix(p){
  const s=[p.sd1,p.sd2,p.sd3],R=[[1,p.rho12,p.rho13],[p.rho12,1,p.rho23],[p.rho13,p.rho23,1]];
  return R.map((row,i)=>row.map((v,j)=>v*s[i]*s[j]));
}
function chol(A){
  const n=A.length,L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){
    let s=A[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];
    if(i===j)L[i][j]=Math.sqrt(Math.max(0,s));else L[i][j]=L[i][j]||s/Math.max(1e-12,L[j][j]);
  }
  return L;
}
function simulate(p){
  check(p);
  const L=chol(covMatrix(p)),mu=[p.mu1,p.mu2,p.mu3],rng=S.prng(p.seed),rets=[];
  for(let t=0;t<p.months;t++){
    const z=[rng.normal(),rng.normal(),rng.normal()];
    rets.push(mu.map((m,i)=>m+L[i][0]*z[0]+L[i][1]*z[1]+L[i][2]*z[2]));
  }
  return{rets,mu,cov:covMatrix(p),names:['A','B','C']};
}
function inv3(A){
  const [a,b,c]=A[0],[d,e,f]=A[1],[g,h,i2]=A[2];
  const det=a*(e*i2-f*h)-b*(d*i2-f*g)+c*(d*h-e*g);
  if(Math.abs(det)<1e-14)throw Error('协方差矩阵奇异，请检查相关系数。');
  return[[(e*i2-f*h)/det,(c*h-b*i2)/det,(b*f-c*e)/det],
    [(f*g-d*i2)/det,(a*i2-c*g)/det,(c*d-a*f)/det],
    [(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det]];
}
const dot=(u,v)=>u.reduce((s,x,i)=>s+x*v[i],0);
const mul=(A,v)=>A.map(row=>dot(row,v));
function portfolioStats(rets,w){
  const series=rets.map(r=>dot(r,w));
  const mean=S.mean(series),sd=S.sd(series);
  const sorted=S.sorted(series),q=S.quantile(series,1-.95);
  const tail=series.filter(v=>v<=S.quantile(series,.05));
  return{mean,sd,sharpe:(mean-.002)/sd*Math.sqrt(12),skew:S.skew(series),kurt:S.kurtosis(series),
    var95:-q,es95:-(tail.length?S.mean(tail):q),series};
}
function analyse(p){
  const d=simulate(p),{rets,mu}=d;
  /* 切点权重用样本协方差（与 R 的 cov() 一致），而不是模拟所用的真实协方差。 */
  const cols=rets[0].map((_,j)=>rets.map(r=>r[j]));
  const sampleCov=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>S.sum(cols[i].map((v,t)=>(v-S.mean(cols[i]))*(cols[j][t]-S.mean(cols[j]))))/(rets.length-1)));
  const sampleMu=cols.map(c=>S.mean(c));
  const inv=inv3(sampleCov),excess=sampleMu.map(m=>m-p.rf);
  const raw=mul(inv,excess),total=S.sum(raw),wTan=raw.map(v=>v/total);
  const tan=portfolioStats(rets,wTan);
  /* 权重网格（步长 step，三资产和为 1，不许卖空） */
  const grid=[];const n=Math.round(1/p.step);
  for(let a=0;a<=n;a++)for(let b=0;b<=n-a;b++){
    const w=[a/n,b/n,(n-a-b)/n];
    const st=portfolioStats(rets,w);
    grid.push({w,...st,es95:st.es95});
  }
  /* 有效前沿：按 σ 分箱取最大 μ */
  const bins=new Map();
  for(const g of grid){const k=Math.round(g.sd*1000);const cur=bins.get(k);if(!cur||g.mean>cur.mean)bins.set(k,g);}
  const frontier=[...bins.values()].sort((x,y)=>x.sd-y.sd);
  /* 均值-CVaR：在 μ 不低于目标的组合里取 CVaR 最小 */
  const target=Math.max(...grid.map(g=>g.mean))*0.98;
  const cvarSet=grid.filter(g=>g.mean>=target);
  const minCVaR=cvarSet.reduce((best,g)=>!best||g.es95<best.es95?g:best,null);
  const maxSkew=grid.reduce((best,g)=>!best||g.skew>best.skew?g:best,null);
  const maxSharpe=grid.reduce((best,g)=>!best||g.sharpe>best.sharpe?g:best,null);
  return{...d,inv,wTan,tan,grid,frontier,target,minCVaR,maxSkew,maxSharpe,sampleMu,
    cov:sampleCov,trueCov:d.cov,vols:[p.sd1,p.sd2,p.sd3],rf:p.rf,alpha:p.alpha};
}
function build(p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:Array.isArray(code)?code:String(code).split('\n'),explain,formula});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  add('data',T('三资产月度收益','Three-asset monthly returns'),
    ['# Experiment 08.2 | tangency, mean-CVaR and higher moments | base R only',
     T('# 固定种子生成的合成月度收益；非真实行情','# Synthetic monthly returns from a fixed seed; not market quotes'),
     `A <- ${vec(q.rets.map(r=>r[0]))}`,`B <- ${vec(q.rets.map(r=>r[1]))}`,`C <- ${vec(q.rets.map(r=>r[2]))}`,
     `rf <- ${num(p.rf)}; alpha <- ${num(p.alpha)}`,
     'X <- cbind(A, B, C); mu <- colMeans(X); Sigma <- cov(X)',
     'stopifnot(nrow(X) > 100, all(is.finite(mu)))'],
    T('三资产足够画出二维前沿；权重网格用于比较夏普、CVaR 与偏度，不是求解器。','Three assets are enough to draw a two-dimensional frontier; the weight grid compares Sharpe, CVaR and skewness rather than solving an optimiser.'));
  add('tangency',T('切点组合（最大夏普）','Tangency portfolio (maximum Sharpe)'),
    [T('# 无风险资产存在时，切点权重与 Σ⁻¹(μ−rf) 成比例','# With a risk-free asset the tangency weights are proportional to Sigma^{-1}(mu - rf)'),
     'w_raw <- solve(Sigma, mu - rf)','w_tan <- w_raw / sum(w_raw)','print(w_tan)',
     'port <- as.vector(X %*% w_tan)',
     'cat("mean", mean(port), "sd", sd(port), "annualised Sharpe", mean(port - rf)/sd(port)*sqrt(12), "\\n")'],
    T('切点组合依赖均值与协方差的估计；样本均值的不确定性会让权重剧烈变化。','The tangency portfolio depends on estimated means and covariances; uncertainty in the sample mean makes the weights swing.'),
    String.raw`w_T=\frac{\Sigma^{-1}(\mu-r_f\mathbf 1)}{\mathbf 1'\Sigma^{-1}(\mu-r_f\mathbf 1)}`);
  add('cvar',T('均值-CVaR 与高阶矩','Mean-CVaR and higher moments'),
    [T('# 在均值不低于目标的组合里，找 CVaR 最小的权重','# Among portfolios with mean at least the target, find the smallest CVaR'),
     'grid <- expand.grid(a = seq(0, 1, by = 0.05), b = seq(0, 1, by = 0.05))',
     'grid <- subset(grid, a + b <= 1)','grid$c <- 1 - grid$a - grid$b',
     'stats <- t(apply(grid, 1, function(g) {',
     '  w <- c(g[1], g[2], g[3]); p <- as.vector(X %*% w)',
     '  q <- quantile(p, 1 - alpha, type = 7)',
     '  c(mean = mean(p), sd = sd(p), skew = mean((p - mean(p))^3)/sd(p)^3,',
     '    cvar = -mean(p[p <= q]))',
     '}))',
     'grid <- cbind(grid, stats)',
     `target <- ${num(q.target)}`,
     'best <- subset(grid, mean >= target)',
     'best <- best[which.min(best$cvar), ]',
     'print(best)','print(grid[which.max(grid$skew), ])'],
    T('CVaR 关注尾部平均损失，偏度关注分布不对称；最大夏普组合通常既不是最小 CVaR 也不是最大偏度。','CVaR looks at the average tail loss and skewness at asymmetry; the maximum-Sharpe portfolio is usually neither the minimum-CVaR nor the maximum-skew one.'),
    String.raw`CVaR_\alpha=\mathbb E[-r\mid r\le q_{1-\alpha}]`);
  return{blocks,code:'# FinModel Lab | Experiment 08.2 | tangency and CVaR\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,simulate,analyse,build,portfolioStats};
});
