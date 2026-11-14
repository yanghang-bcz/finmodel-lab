/* Experiment04 拓展 · 经济计量分析（课件 4+5 第二节）：二元选择、聚类、因子分析。
   全部为确定性合成数据；Base R 用 glm / kmeans / prcomp 复现。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.RegEconMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({n:200,seed:20261114,b0:-.4,b1:1.6,noise:.7,k:3,points:90,factors:5,obs:160,kappa:.8});
function check(p){
  if(!Number.isInteger(p.n)||p.n<80||p.n>800)throw Error('二元选择的样本量须为 80–800 的整数。');
  if(!Number.isInteger(p.k)||p.k<2||p.k>5)throw Error('聚类数须为 2–5。');
  if(!Number.isInteger(p.points)||p.points<40||p.points>300)throw Error('聚类样本量须为 40–300 的整数。');
  if(!Number.isInteger(p.factors)||p.factors<3||p.factors>8)throw Error('因子分析的变量数须为 3–8。');
  if(!Number.isInteger(p.obs)||p.obs<60||p.obs>400)throw Error('因子分析的样本量须为 60–400 的整数。');
  if(!(p.kappa>=0&&p.kappa<1))throw Error('公共因子强度须在 0 与 1 之间。');
  return true;
}
/* ---------- 1. 二元选择：logit / probit（Newton-Raphson） ---------- */
function binaryData(p){
  const rng=S.prng(p.seed),rows=[];
  for(let i=0;i<p.n;i++){
    const x=-2+4*rng();
    const eta=p.b0+p.b1*x+p.noise*rng.normal();
    rows.push({x,y:eta>0?1:0,eta});
  }
  return rows;
}
const pnorm=z=>S.normalCdf(z),dpnorm=z=>S.normalPdf(z);
function fitBinary(rows,link){
  const X=rows.map(r=>[1,r.x]),y=rows.map(r=>r.y);
  let beta=[0,0];
  for(let it=0;it<60;it++){
    const H=[[0,0],[0,0]],g=[0,0];
    let ll=0;
    for(let i=0;i<X.length;i++){
      const eta=X[i][0]*beta[0]+X[i][1]*beta[1];
      const F=link==='logit'?1/(1+Math.exp(-eta)):pnorm(eta);
      const f=link==='logit'?F*(1-F):dpnorm(eta);
      const w=Math.max(1e-10,f*f/Math.max(1e-10,F*(1-F)));
      ll+=y[i]*Math.log(Math.max(1e-12,F))+(1-y[i])*Math.log(Math.max(1e-12,1-F));
      for(let a=0;a<2;a++){g[a]+=(y[i]-F)*X[i][a]*(f/Math.max(1e-10,F*(1-F)));for(let b=0;b<2;b++)H[a][b]+=w*X[i][a]*X[i][b];}
    }
    const delta=S.solve(H,g.map(v=>v));
    beta=beta.map((v,i)=>v+delta[i]);
    if(Math.max(...delta.map(Math.abs))<1e-10)break;
  }
  const fitted=rows.map(r=>{const eta=beta[0]+beta[1]*r.x;return link==='logit'?1/(1+Math.exp(-eta)):pnorm(eta);});
  const ll=rows.reduce((s,r,i)=>s+r.y*Math.log(Math.max(1e-12,fitted[i]))+(1-r.y)*Math.log(Math.max(1e-12,1-fitted[i])),0);
  const ybar=S.mean(rows.map(r=>r.y));
  const ll0=rows.length*(ybar*Math.log(Math.max(1e-12,ybar))+(1-ybar)*Math.log(Math.max(1e-12,1-ybar)));
  const hit=rows.filter((r,i)=>(fitted[i]>=.5?1:0)===r.y).length/rows.length;
  return{beta,fitted,ll,mcfadden:1-ll/ll0,hit,n:rows.length,pseudoR2:1-ll/ll0,
    curve:Array.from({length:41},(_,i)=>{const x=-2+4*i/40;const eta=beta[0]+beta[1]*x;return{x,p:link==='logit'?1/(1+Math.exp(-eta)):pnorm(eta)};})};
}
function binary(p){check(p);const rows=binaryData(p);return{rows,logit:fitBinary(rows,'logit'),probit:fitBinary(rows,'probit')};}
/* ---------- 2. 聚类：k-means（确定性初始化） ---------- */
function clusterData(p){
  const rng=S.prng(p.seed+7),centers=[[-1.2,-.6],[1.1,.2],[.2,1.4],[-.8,1.2],[1.4,-1.1]],rows=[];
  for(let i=0;i<p.points;i++){
    const c=centers[i%Math.min(p.k,centers.length)];
    rows.push({x:c[0]+.45*rng.normal(),y:c[1]+.45*rng.normal(),truth:i%Math.min(p.k,centers.length)});
  }
  return rows;
}
function kmeans(rows,k){
  const sorted=[...rows].sort((a,b)=>a.x-b.x||a.y-b.y);
  let centroids=Array.from({length:k},(_,i)=>sorted[Math.floor((i+.5)*sorted.length/k)]).map(r=>[r.x,r.y]);
  let assign=new Array(rows.length).fill(-1),iters=0,changed=true;
  while(changed&&iters<50){
    changed=false;
    rows.forEach((r,i)=>{
      let best=0,bd=Infinity;
      centroids.forEach((c,j)=>{const d=(r.x-c[0])**2+(r.y-c[1])**2;if(d<bd-1e-12){bd=d;best=j;}});
      if(assign[i]!==best){assign[i]=best;changed=true;}
    });
    centroids=Array.from({length:k},(_,j)=>{
      const pts=rows.filter((_,i)=>assign[i]===j);
      return pts.length?[S.mean(pts.map(r=>r.x)),S.mean(pts.map(r=>r.y))]:centroids[j];
    });
    iters++;
  }
  const wss=rows.reduce((s,r,i)=>s+(r.x-centroids[assign[i]][0])**2+(r.y-centroids[assign[i]][1])**2,0);
  return{assign,centroids,iters,wss,
    counts:Array.from({length:k},(_,j)=>assign.filter(a=>a===j).length)};
}
function cluster(p){check(p);const rows=clusterData(p);return{rows,...kmeans(rows,p.k),k:p.k};}
/* ---------- 3. 因子分析：主成分（Jacobi 特征分解） ---------- */
function factorData(p){
  const rng=S.prng(p.seed+13),k=p.factors,loadings=Array.from({length:k},(_,j)=>Array.from({length:2},(_,i)=>(rng()-.5)*1.6));
  const rows=[];
  for(let t=0;t<p.obs;t++){
    const f=[rng.normal(),rng.normal()];
    const row=[];
    for(let j=0;j<k;j++)row.push(p.kappa*(loadings[j][0]*f[0]+loadings[j][1]*f[1])+Math.sqrt(1-p.kappa*p.kappa)*rng.normal());
    rows.push(row);
  }
  return{rows,loadings,k};
}
function corrMatrix(rows){
  const k=rows[0].length,cols=Array.from({length:k},(_,j)=>rows.map(r=>r[j]));
  const C=Array.from({length:k},()=>Array(k).fill(0));
  for(let a=0;a<k;a++)for(let b=0;b<k;b++)C[a][b]=a===b?1:S.corr(cols[a],cols[b]);
  return{cols,C};
}
function jacobiEigen(A){
  const n=A.length,V=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
  let B=A.map(r=>r.slice());
  for(let sweep=0;sweep<100;sweep++){
    let off=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=B[i][j]*B[i][j];
    if(off<1e-14)break;
    for(let p2=0;p2<n;p2++)for(let q=p2+1;q<n;q++){
      if(Math.abs(B[p2][q])<1e-15)continue;
      const theta=(B[q][q]-B[p2][p2])/(2*B[p2][q]);
      const t=(theta>=0?1:-1)/(Math.abs(theta)+Math.sqrt(theta*theta+1));
      const c=1/Math.sqrt(t*t+1),s=t*c;
      for(let i=0;i<n;i++){
        const bip=B[i][p2],biq=B[i][q];
        B[i][p2]=c*bip-s*biq;B[i][q]=s*bip+c*biq;
      }
      for(let i=0;i<n;i++){
        const bpi=B[p2][i],bqi=B[q][i];
        B[p2][i]=c*bpi-s*bqi;B[q][i]=s*bpi+c*bqi;
      }
      for(let i=0;i<n;i++){
        const vip=V[i][p2],viq=V[i][q];
        V[i][p2]=c*vip-s*viq;V[i][q]=s*vip+c*viq;
      }
    }
  }
  const pairs=Array.from({length:n},(_,i)=>({value:B[i][i],vector:V.map(r=>r[i])})).sort((a,b)=>b.value-a.value);
  return pairs;
}
function factors(p){
  check(p);
  const d=factorData(p),{C}=corrMatrix(d.rows),eig=jacobiEigen(C);
  const total=S.sum(eig.map(e=>Math.max(0,e.value)));
  const explained=eig.map(e=>total>0?Math.max(0,e.value)/total:0);
  const cumulative=explained.reduce((acc,v,i)=>{acc.push((acc[i-1]||0)+v);return acc;},[]);
  return{corr:C,loadings:eig.map(e=>e.vector.map(v=>v*Math.sqrt(Math.max(0,e.value)))),
    eigenvalues:eig.map(e=>e.value),explained,cumulative,n:p.obs,k:p.factors,trueKappa:p.kappa,d};
}
/* ---------- 4. R 脚本 ---------- */
function build(view,p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:Array.isArray(code)?code:String(code).split('\n'),explain,formula});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(8)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  if(view==='logit'){
    add('data',T('二元选择数据','Binary-choice data'),
      ['# Experiment 04.2 | binary choice | base R only',
       T('# 合成数据：y 取 0/1，x 为解释变量；真实系数已标注在页面','# Synthetic data: y is 0/1 and x the regressor; the true coefficients are printed on the page'),
       `x <- ${vec(q.rows.map(r=>r.x))}`,`y <- c(${q.rows.map(r=>r.y).join(', ')})`,
       'stopifnot(length(x) == length(y), all(y %in% c(0, 1)))'],
      T('二元选择模型估计的是 P(y=1|x)，不是 y 本身的线性回归；普通 OLS 会给出越界概率。','A binary-choice model estimates P(y=1|x) rather than a linear regression on y; plain OLS can predict probabilities outside [0,1].'));
    add('fit',T('Logit 与 Probit 极大似然','Logit and probit maximum likelihood'),
      ['logit <- glm(y ~ x, family = binomial(link = "logit"))',
       'probit <- glm(y ~ x, family = binomial(link = "probit"))',
       'print(summary(logit)$coefficients)',
       'print(summary(probit)$coefficients)',
       T('# McFadden 伪 R²：1 − 对数似然/仅截距似然','# McFadden pseudo R2: 1 - logLik / logLik(null)'),
       'print(c(mcfadden = 1 - as.numeric(logLik(logit)) / as.numeric(logLik(update(logit, . ~ 1)))))'],
      T('Probit 用正态分布函数、Logit 用逻辑函数；两者系数不能直接比较，需换算边际效应。','Probit uses the normal CDF and logit the logistic one; their coefficients are not directly comparable and need marginal effects.'),
      String.raw`P(y=1\mid x)=F(\beta_0+\beta_1x)`);
    add('plot',T('拟合概率曲线','Fitted probability curve'),
      ['grid <- seq(min(x), max(x), length.out = 100)',
       'p_logit <- predict(logit, newdata = data.frame(x = grid), type = "response")',
       'p_probit <- predict(probit, newdata = data.frame(x = grid), type = "response")',
       'plot(grid, p_logit, type = "l", ylim = c(0,1), xlab = "x", ylab = "P(y = 1)")',
       'lines(grid, p_probit, lty = 2)',
       'points(x, y, pch = 20, col = "grey60")'],
      T('两条曲线在中部接近、尾部不同；用样本外的 x 比较两者，才能看出模型差异。','The two curves are close in the middle and differ in the tails; compare them at out-of-sample x to see the difference.'));
  }
  if(view==='kmeans'){
    add('data',T('聚类数据','Clustering data'),
      ['# Experiment 04.2 | clustering | base R only',
       `d <- data.frame(x = ${vec(q.rows.map(r=>r.x))},`,
       `  y = ${vec(q.rows.map(r=>r.y))})`,
       'dim(d)'],
      T('聚类没有"标签"，只根据距离把观测分组；组数由使用者事先给定。','Clustering has no labels: observations are grouped by distance and the number of groups is chosen in advance.'));
    add('fit',T('k-means 迭代','k-means iterations'),
      [T('# 用页面的初始中心，保证迭代路径一致；实际使用时应多起点','# Start from the page centres so the iteration path matches; in practice use several starts'),
       `centers0 <- matrix(c(${q.centroids.map(c=>num(c[0])+', '+num(c[1])).join(', ')}), ncol = 2, byrow = TRUE)`,
       'km <- kmeans(d, centers = centers0, iter.max = 50)',
       'print(km$centers)','print(km$size)','print(km$withinss)','cat("total within SS:", km$tot.withinss, "\\n")'],
      T('k-means 交替执行"分配到最近中心"和"重算中心"；结果依赖初始中心，因此需要多次起点或固定种子。','k-means alternates assignment and re-centring; the result depends on the initial centres, so use several starts or a fixed seed.'));
    add('plot',T('聚类结果','Cluster assignments'),
      ['plot(d$x, d$y, col = km$cluster + 1, pch = 19, xlab = "x", ylab = "y")',
       'points(km$centers, pch = 4, cex = 2, lwd = 2)'],
      T('叉号是中心；同一组数据的组数改变，分组与组内平方和都会改变。','Crosses are the centres; changing the number of groups changes both the partition and the within-cluster sum of squares.'));
  }
  if(view==='pca'){
    add('data',T('多变量数据','Multivariate data'),
      ['# Experiment 04.2 | factor analysis | base R only',
       T('# 与页面逐项一致的观测矩阵（每行一个观测，每列一个变量）','# Observation matrix identical to the page (one row per observation, one column per variable)'),
       `X <- matrix(${vec(q.d.rows.flat())}, ncol = ${p.factors}, byrow = TRUE)`,
       'dim(X)'],
      T('观测变量由两个公共因子加特质误差生成；因子分析要找回"共同变动"的结构。','Observed variables are generated from two common factors plus idiosyncratic noise; factor analysis recovers the common structure.'));
    add('pca',T('主成分与方差解释','Principal components and explained variance'),
      ['pca <- prcomp(X, scale. = TRUE)',
       'print(summary(pca))',
       'print(pca$rotation[, 1:2])',
       'print(pca$sdev^2 / sum(pca$sdev^2))'],
      T('特征值给出每个主成分解释的方差比例；碎石图拐点提示保留几个因子。','Eigenvalues give the variance share of each component; the scree-plot elbow suggests how many factors to keep.'));
    add('plot',T('碎石图','Scree plot'),
      ['plot(pca, type = "lines", main = "Scree plot")'],
      T('碎石图只描述样本内的方差结构，不检验因子个数，也不保证因子有经济含义。','The scree plot describes in-sample variance structure only; it neither tests the number of factors nor guarantees an economic interpretation.'));
  }
  return{blocks,code:'# FinModel Lab | Experiment 04.2 | econometrics\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,binary,cluster,factors,build};
});
