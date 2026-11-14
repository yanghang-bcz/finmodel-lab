/* Experiment09 拓展 · 高阶矩 CAPM（课件 9.1 advanced CAPM）。
   二阶矩 CAPM 之外加入协偏度（coskewness）与协峰度（cokurtosis）因子，
   用横截面回归比较 2/3/4 阶矩模型的解释力。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.CAPMHMMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({assets:30,months:120,seed:20261114,rf:.02/12,gamma3:.35,gamma4:.25,nSteps:12,buttons:null});
function check(p){
  if(!Number.isInteger(p.assets)||p.assets<8||p.assets>60)throw Error('资产数须为 8–60 的整数。');
  if(!Number.isInteger(p.months)||p.months<60||p.months>300)throw Error('月份数须为 60–300 的整数。');
  if(!(p.gamma3>=0&&p.gamma3<=1.5))throw Error('协偏度溢价系数须在 0 与 1.5 之间。');
  if(!(p.gamma4>=-1&&p.gamma4<=1.5))throw Error('协峰度溢价系数须在 −1 与 1.5 之间。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
/* 市场收益带跳跃（产生非零三、四阶矩），资产收益 = β·市场 + 高阶矩暴露 + 噪声。 */
function panel(p){
  check(p);
  const rng=S.prng(p.seed),T=p.months,N=p.assets,mkt=[];
  for(let t=0;t<T;t++){
    const jump=rng()<.06?(rng()<.5?-1:1)*2.2:1;
    mkt.push(.006+.045*rng.normal()*jump);
  }
  const muM=S.mean(mkt),sdM=S.sd(mkt);
  const m2=mkt.map(v=>(v-muM)**2),m3=mkt.map(v=>(v-muM)**3);
  const beta=[],coskew=[],cokurt=[],alpha=[],rets=[];
  for(let i=0;i<N;i++){
    beta.push(.6+.8*rng());
    coskew.push((rng()-.5)*1.2);
    cokurt.push((rng()-.5)*1.2);
    alpha.push(p.gamma3*coskew[i]*1e-3+p.gamma4*cokurt[i]*1e-3+(rng()-.5)*4e-4);
    const row=[];
    for(let t=0;t<T;t++)row.push(p.rf+alpha[i]+beta[i]*(mkt[t]-p.rf)+.012*rng.normal());
    rets.push(row);
  }
  /* 特征：协偏度 = E[(r_i-μ_i)(r_m-μ_m)²]/σ_m³；协峰度 = E[(r_i-μ_i)(r_m-μ_m)³]/σ_m⁴ */
  const feats=rets.map((row,i)=>{
    const mu=S.mean(row),dev=row.map(v=>v-mu);
    return{beta:beta[i],
      coskew:dev.reduce((s,v,t)=>s+v*m2[t],0)/T/(sdM**3),
      cokurt:dev.reduce((s,v,t)=>s+v*m3[t],0)/T/(sdM**4)};
  });
  const meanEx=rets.map(row=>S.mean(row)-p.rf);
  return{mkt,rets,feats,meanEx,beta,trueAlpha:alpha,T,N,gamma3:p.gamma3,gamma4:p.gamma4};
}
const z=v=>{const m=S.mean(v),sd=S.sd(v);return v.map(x=>sd>0?(x-m)/sd:0);};
function crossSection(p){
  const d=panel(p);
  const b=z(d.feats.map(f=>f.beta)),cs=z(d.feats.map(f=>f.coskew)),ck=z(d.feats.map(f=>f.cokurt));
  const y=d.meanEx;
  const m2=S.ols(y,[b],{names:['beta']});
  const m3=S.ols(y,[b,cs],{names:['beta','coskew']});
  const m4=S.ols(y,[b,cs,ck],{names:['beta','coskew','cokurt']});
  const pack=(f,label)=>({label,lambda:f.beta.slice(1),t:f.t.slice(1),p:f.p.slice(1),r2:f.r2,adjR2:f.adjR2,intercept:f.beta[0],fitted:f.fitted,resid:f.resid,n:f.n});
  return{...d,models:[pack(m2,'2'),pack(m3,'3'),pack(m4,'4')],
    scatter2:d.meanEx.map((v,i)=>({x:b[i],y:v,fitted:m2.fitted[i]})),
    featsZ:{b,cs,ck}};
}
/* ---------- 二叉树（CRR）定价，附在本视图便于对照连续时间解 ---------- */
function binomial(p,opts={}){
  check(p);
  const kind=opts.kind==='put'?'put':'call',american=opts.american!==false;
  const S0=100,K=100,T=1,r=.05,sigma=.2,steps=Math.max(1,Math.min(60,p.nSteps||12));
  const payoff=price=>kind==='put'?Math.max(0,K-price):Math.max(0,price-K);
  const dt=T/steps,u=Math.exp(sigma*Math.sqrt(dt)),dn=1/u,disc=Math.exp(-r*dt);
  const pu=(Math.exp(r*dt)-dn)/(u-dn);
  const tree=[];
  for(let i=0;i<=steps;i++){
    const row=[];
    for(let j=0;j<=i;j++){const price=S0*u**j*dn**(i-j);row.push({price,payoff:payoff(price)});}
    tree.push(row);
  }
  const euro=tree[steps].map(n=>n.payoff),amer=tree[steps].map(n=>n.payoff);
  for(let i=steps-1;i>=0;i--){
    for(let j=0;j<=i;j++){const hold=disc*(pu*euro[j+1]+(1-pu)*euro[j]);euro[j]=hold;}
    for(let j=0;j<=i;j++){const hold=disc*(pu*amer[j+1]+(1-pu)*amer[j]);amer[j]=american?Math.max(hold,tree[i][j].payoff):hold;}
  }
  const bs=(s0,KK,tt,rr,sg,kind2)=>{
    const d1=(Math.log(s0/KK)+(rr+sg*sg/2)*tt)/(sg*Math.sqrt(tt)),d2=d1-sg*Math.sqrt(tt);
    return kind2==='put'?KK*Math.exp(-rr*tt)*S.normalCdf(-d2)-s0*S.normalCdf(-d1):s0*S.normalCdf(d1)-KK*Math.exp(-rr*tt)*S.normalCdf(d2);};
  const bsPrice=bs(S0,K,T,r,sigma,kind);
  const priceAt=k=>{
    const dtk=T/k,u2=Math.exp(sigma*Math.sqrt(dtk)),d2=1/u2,p2=(Math.exp(r*dtk)-d2)/(u2-d2),disc2=Math.exp(-r*dtk);
    let v=[];for(let j=0;j<=k;j++){const price=S0*u2**j*d2**(k-j);v.push(payoff(price));}
    for(let t=k-1;t>=0;t--){for(let j=0;j<=t;j++){const hold=disc2*(p2*v[j+1]+(1-p2)*v[j]);v[j]=american?Math.max(hold,payoff(S0*u2**j*d2**(t-j))):hold;}}
    return v[0];};
  const conv=Array.from({length:Math.min(60,steps)},(_,i)=>({k:i+1,price:priceAt(i+1)}));
  return{S0,K,T,r,sigma,steps,u,dn,pu,tree,euro:euro[0],amer:amer[0],bs:bsPrice,error:euro[0]-bsPrice,conv,
    kind,american,americanPremium:amer[0]-euro[0]};
}
function build(view,p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  if(view==='hm'){
    add('data',T('特征与平均超额收益','Characteristics and mean excess returns'),
      ['# Experiment 09.1 | higher-moment CAPM | base R only',
       T('# 页面由月度收益计算的特征：beta、协偏度、协峰度，以及平均超额收益','# Characteristics computed from monthly returns on the page: beta, coskewness, cokurtosis, plus mean excess return'),
       `beta <- c(${q.feats.map(f=>num(Number(f.beta.toFixed(8)))).join(', ')})`,
       `coskew <- c(${q.feats.map(f=>num(Number(f.coskew.toFixed(8)))).join(', ')})`,
       `cokurt <- c(${q.feats.map(f=>num(Number(f.cokurt.toFixed(8)))).join(', ')})`,
       `mean_ex <- c(${q.meanEx.map(v=>num(Number(v.toFixed(10)))).join(', ')})`,
       `gamma3 <- ${num(p.gamma3)}; gamma4 <- ${num(p.gamma4)}`,
       'stopifnot(length(beta) == length(mean_ex))'],
      T('特征由同一段月度收益直接计算后内嵌，脚本从横截面回归开始复现；这样避免内嵌整个 30×120 的收益矩阵。','The characteristics are computed from the same monthly returns and then embedded so the script can reproduce the cross-section without carrying the whole 30×120 return matrix.'));
    add('cross',T('横截面三步回归','Three cross-sectional regressions'),
      [T('# 把 beta、协偏度、协峰度分别标准化后逐步加入回归','# Standardise beta, coskewness and cokurtosis, then add them one at a time'),
       'z <- function(v) (v - mean(v)) / sd(v)',
       'm2 <- lm(mean_ex ~ z(beta))',
       'm3 <- lm(mean_ex ~ z(beta) + z(coskew))',
       'm4 <- lm(mean_ex ~ z(beta) + z(coskew) + z(cokurt))',
       'print(summary(m2)$r.squared)',
       'print(summary(m3)$r.squared)',
       'print(summary(m4)$r.squared)',
       'print(summary(m4)$coefficients)'],
      T('加入高阶矩后 R² 上升是常见的；但横截面样本只有几十个资产，自由度损失很快，不能只凭 R² 选模型。','R² usually rises when higher moments are added; with only a few dozen assets the degrees of freedom fall fast, so R² alone cannot choose the model.'),
      String.raw`\bar r_i=\gamma_0+\gamma_1\hat\beta_i+\gamma_2\widehat{coskew}_i+\gamma_3\widehat{cokurt}_i+u_i`);
  } else {
    add('tree',T('CRR 二叉树定价','CRR binomial pricing'),
      ['# Experiment 09.3 | binomial tree | base R only',
       `S0 <- ${num(q.S0)}; K <- ${num(q.K)}; T <- ${num(q.T)}; r <- ${num(q.r)}; sigma <- ${num(q.sigma)}; steps <- ${q.steps}L`,
       `kind <- "${q.kind}"; american <- ${q.american?'TRUE':'FALSE'}`,
       'dt <- T/steps; u <- exp(sigma*sqrt(dt)); d <- 1/u',
       'p <- (exp(r*dt) - d)/(u - d); disc <- exp(-r*dt)',
       T('# 终端层：欧式与美式都用同一组到期收益','# Terminal layer: European and American share the same payoff'),
       'payoff <- function(price) if (kind == "put") pmax(0, K - price) else pmax(0, price - K)',
       'euro <- sapply(0:steps, function(j) payoff(S0*u^j*d^(steps-j)))',
       'amer <- euro',
       'for (i in (steps-1):0) {',
       '  euro <- disc*(p*euro[-1] + (1-p)*euro[-length(euro)])',
       '  hold <- disc*(p*amer[-1] + (1-p)*amer[-length(amer)])',
       '  amer <- if (american) pmax(hold, sapply(0:i, function(j) payoff(S0*u^j*d^(i-j)))) else hold',
       '}',
       'cat("European:", euro, " American:", amer, "\n")',
       T('# 与 Black-Scholes 连续时间解比较：步数越多越接近','# Compare with the continuous-time Black-Scholes value: more steps, closer price'),
       'd1 <- (log(S0/K) + (r + sigma^2/2)*T)/(sigma*sqrt(T)); d2 <- d1 - sigma*sqrt(T)',
       'bs <- if (kind == "put") K*exp(-r*T)*pnorm(-d2) - S0*pnorm(-d1) else S0*pnorm(d1) - K*exp(-r*T)*pnorm(d2)',
       'cat("Black-Scholes:", bs, " error:", euro - bs, "\n")'],
      T('二叉树是风险中性定价的离散版本；美式期权在每个节点比较"继续持有"与"立即行权"。','The binomial tree is a discrete risk-neutral pricing model; an American option compares continuation with immediate exercise at each node.'),
      String.raw`C_0=e^{-r\Delta t}\left[pC_u+(1-p)C_d\right],\quad p=\frac{e^{r\Delta t}-d}{u-d}`);
    add('conv',T('步数收敛','Convergence in steps'),
      [`steps_grid <- c(${q.conv.map(c=>c.k).join(', ')})`,
       'price <- sapply(steps_grid, function(k) {',
       '  dt2 <- T/k; u2 <- exp(sigma*sqrt(dt2)); d2 <- 1/u2',
       '  p2 <- (exp(r*dt2) - d2)/(u2 - d2); disc2 <- exp(-r*dt2)',
       '  v <- sapply(0:k, function(j) payoff(S0*u2^j*d2^(k-j)))',
       '  for (i in (k-1):0) {',
       '    hold <- disc2*(p2*v[-1] + (1-p2)*v[-length(v)])',
       '    v <- if (american) pmax(hold, sapply(0:i, function(j) payoff(S0*u2^j*d2^(i-j)))) else hold',
       '  }',
       '  v',
       '})',
       'print(data.frame(steps = steps_grid, price = price, error = price - bs))'],
      T('收敛不是单调的：步数的奇偶会改变期权到期时是否"恰好"落在执行价附近。','Convergence is not monotone: whether the ladder straddles the strike depends on the parity of the step count.'));
  }
  return{blocks,code:'# FinModel Lab | Experiment 09 family | extension\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,panel,crossSection,binomial,build};
});
