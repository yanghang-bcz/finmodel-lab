/* Experiment07 · AI risk forecasting core (no DOM).
   Same target (next-day simple return), same information set (all inputs are
   lagged), the same out-of-sample window and the same Kupiec check as every
   other VaR method on the page. Both models are deterministic given the seed. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats,typeof module==='object'?require('./risk-math'):root.RiskMath);if(typeof module==='object')module.exports=api;else root.RiskAIMath=api;})(this,(S,Risk)=>{
'use strict';
const DEFAULTS={alpha:.95,N:1e6,aiTrees:60,aiDepth:4,aiLeaf:8,aiMtry:3,aiWindow:8,aiHidden:4,aiEpochs:16,aiSeed:2024,aiTrain:.7};
const FEATURES=[['r1','滞后 1 期收益','Lagged return 1'],['r2','滞后 2 期收益','Lagged return 2'],['abs1','滞后 1 期绝对收益','|return| one period back'],['sq1','滞后 1 期平方收益','Squared return one period back'],['vol','EWMA 日波动率（λ=0.94）','EWMA daily volatility (λ=0.94)']];
function check(p,t=(zh)=>zh){
  const fail=(zh,en)=>{throw Error(t(zh,en));};
  if(!(p.alpha>0&&p.alpha<1))fail('置信水平须在0与1之间。','The confidence level must lie strictly between 0 and 1.');
  if(!(p.N>0&&p.N<=1e12))fail('名义本金须为正且不超过 1e12 元。','The notional must be positive and at most 1e12 CNY.');
  if(!Number.isInteger(p.aiTrees)||p.aiTrees<10||p.aiTrees>300)fail('树的数量须为 10–300 的整数。','The number of trees must be an integer between 10 and 300.');
  if(!Number.isInteger(p.aiDepth)||p.aiDepth<2||p.aiDepth>8)fail('树的深度须为 2–8 的整数。','Tree depth must be an integer between 2 and 8.');
  if(!Number.isInteger(p.aiLeaf)||p.aiLeaf<4||p.aiLeaf>60)fail('叶最小样本须为 4–60 的整数。','Minimum leaf size must be an integer between 4 and 60.');
  if(!Number.isInteger(p.aiMtry)||p.aiMtry<1||p.aiMtry>5)fail('每次分裂的候选特征数须为 1–5。','Features per split must be an integer between 1 and 5.');
  if(!Number.isInteger(p.aiWindow)||p.aiWindow<4||p.aiWindow>20)fail('输入窗口须为 4–20。','The input window must be between 4 and 20.');
  if(!Number.isInteger(p.aiHidden)||p.aiHidden<4||p.aiHidden>12)fail('隐藏单元须为 4–12。','Hidden units must be between 4 and 12.');
  if(!Number.isInteger(p.aiEpochs)||p.aiEpochs<2||p.aiEpochs>40)fail('训练轮数须为 2–40。','Epochs must be between 2 and 40.');
  if(!(p.aiTrain>=.5&&p.aiTrain<=.85))fail('训练比例须为 0.50–0.85。','The training share must be between 0.50 and 0.85.');
  if(!Number.isInteger(p.aiSeed)||p.aiSeed<1||p.aiSeed>99999999)fail('随机种子须为 1–99999999 的整数。','The seed must be an integer between 1 and 99999999.');
  return true;
}
/* Teaching sample for the AI view: GARCH(1,1) volatility clustering with
   occasional jumps, drawn from a fixed seed so R and the page agree. The
   fixed modular series used by the other five views contains a deterministic
   cycle that a tree would memorise, which would fake predictability. */
function sample(p){
  const n=Math.min(2000,Math.max(150,p.n||250)),rng=S.prng(p.aiSeed||DEFAULTS.aiSeed);
  const a=.10,b=.85,target=(p.scale||.011)**2,omega=target*(1-a-b);
  let v=target;const r=[];
  for(let i=0;i<n;i++){
    v=omega+a*(r.length?r[i-1]**2:target)+b*v;
    const jump=rng()<.012?2.6:1;
    r.push((p.mu||0)+Math.sqrt(v)*rng.normal(0,1)*jump);
  }
  return r;
}
/* Five lagged inputs; every one is observed strictly before the target day. */
function design(R){
  const out=[];let v=null;const lambda=.94;
  for(let i=2;i<R.length;i++){
    if(v===null){let s=0;for(let j=0;j<i;j++)s+=R[j]*R[j];v=s/i;}
    else v=lambda*v+(1-lambda)*R[i-1]*R[i-1];
    out.push({t:i,r:R[i],vol:Math.sqrt(v),x:[R[i-1],R[i-2],Math.abs(R[i-1]),R[i-1]*R[i-1],Math.sqrt(v)]});
  }
  return out;
}
/* Regression tree whose leaves keep the empirical (1−α) quantile of the
   in-bag target, so the forecast is a conditional quantile, not a mean. */
function buildTree(rows,{depth,leaf,mtry,alpha},rng){
  const y=rows.map(r=>r.r),q=1-alpha;
  const summarise=idx=>{
    const v=idx.map(i=>y[i]).sort((a,b)=>a-b);
    return{leaf:true,vals:v,value:v.reduce((s,x)=>s+x,0)/v.length,size:v.length};
  };
  function node(idx,d){
    const mean=idx.reduce((s,i)=>s+y[i],0)/idx.length;
    if(d>=depth||idx.length<2*leaf)return summarise(idx);
    let best=null;
    const picks=[];
    while(picks.length<Math.min(mtry,5)){const f=Math.floor(rng()*5);if(!picks.includes(f))picks.push(f);}
    for(const f of picks){
      const vals=idx.map(i=>rows[i].x[f]).sort((a,b)=>a-b);
      for(let k=1;k<=6;k++){
        const cut=vals[Math.min(vals.length-1,Math.floor(vals.length*k/7))];
        const left=idx.filter(i=>rows[i].x[f]<=cut),right=idx.filter(i=>rows[i].x[f]>cut);
        if(left.length<leaf||right.length<leaf)continue;
        const ml=left.reduce((s,i)=>s+y[i],0)/left.length,mr=right.reduce((s,i)=>s+y[i],0)/right.length;
        const sse=left.reduce((s,i)=>s+(y[i]-ml)**2,0)+right.reduce((s,i)=>s+(y[i]-mr)**2,0);
        if(!best||sse<best.sse)best={f,cut,sse,left,right};
      }
    }
    if(!best)return summarise(idx);
    return{leaf:false,f:best.f,cut:best.cut,left:node(best.left,d+1),right:node(best.right,d+1),mean};
  }
  return node(rows.map((_,i)=>i),0);
}
const treeLeaf=(node,x)=>node.leaf?node:(x[node.f]<=node.cut?treeLeaf(node.left,x):treeLeaf(node.right,x));
function forest(train,opts,rng){
  const trees=[];
  for(let b=0;b<opts.trees;b++){
    const s=Array.from({length:train.length},()=>train[Math.floor(rng()*train.length)]);
    trees.push(buildTree(s,opts,rng));
  }
  return trees;
}
/* Kupiec unconditional-coverage LR test (chi-square with one degree of freedom). */
function kupiec(x,n,p0){
  if(!(n>0)||x<0||x>n)return{LR:NaN,p:NaN,x,n,p0,ph:NaN};
  const ph=x/n;
  if(ph===0||ph===1)return{LR:NaN,p:NaN,x,n,p0,ph};
  const LR=2*(x*Math.log(ph/p0)+(n-x)*Math.log((1-ph)/(1-p0)));
  return{LR,p:S.chi2Pvalue(LR,1),x,n,p0,ph};
}
/* Calibration of one VaR/ES path against the realised losses. */
function calibrate(loss,varPath,esPath,p){
  const x=loss.filter((l,i)=>l>varPath[i]).length;
  const over=loss.map((l,i)=>l>varPath[i]?l-esPath[i]:null).filter(v=>v!==null);
  return{kupiec:kupiec(x,loss.length,1-p.alpha),hits:x,n:loss.length,meanVaR:S.mean(varPath),meanES:S.mean(esPath),
    esCount:over.length,esBias:over.length?S.mean(over):NaN,varPath,esPath};
}
function run(p,provided,{LSTM=null,t=(zh,en)=>zh}={}){
  check(p,t);
  const R=provided||sample(p);
  const rows=design(R);
  if(rows.length<120)throw Error(t('样本不足：AI 风险预测至少需要 120 个可构造特征的观测。','Not enough data: AI risk forecasting needs at least 120 feature observations.'));
  const n=rows.length,nt=Math.floor(n*p.aiTrain),test=rows.slice(nt);
  if(test.length<40)throw Error(t('测试期不足 40 个观测，请降低训练比例或增加样本。','The test window needs at least 40 observations; lower the training share or add data.'));
  const rng=S.prng(p.aiSeed);
  const trees=forest(rows.slice(0,nt),{trees:p.aiTrees,depth:p.aiDepth,leaf:p.aiLeaf,mtry:p.aiMtry,alpha:p.alpha},rng);
  /* Meinshausen aggregation: pool the leaf samples of every tree and take the
     empirical quantile of the mixture, not the average of per-tree quantiles. */
  const pooled=test.map(r=>{const all=[];for(const tr of trees)all.push(...treeLeaf(tr,r.x).vals);return all;});
  const qRF=pooled.map(a=>S.quantile(a,1-p.alpha));
  const tailRF=pooled.map(a=>{const q=S.quantile(a,1-p.alpha);const tail=a.filter(v=>v<=q);return tail.length?S.mean(tail):q;});
  const actual=test.map(r=>r.r),loss=actual.map(r=>-p.N*r);
  const rf=calibrate(loss,qRF.map(q=>-p.N*q),tailRF.map(q=>-p.N*q),p);
  rf.meanForecast=S.mean(qRF);rf.leaf=pooled[0]?pooled[0].length:0;rf.rmse=Math.sqrt(S.mean(actual.map((r,i)=>(r-qRF[i])**2)));
  rf.mae=S.mean(actual.map((r,i)=>Math.abs(r-qRF[i])));
  /* LSTM: conditional mean from the network, EWMA scale, standardised residual quantile. */
  let lstm=null,lstmError=null;
  try{
    if(!LSTM)throw Error(t('当前页面未加载 LSTM 训练模块。','The LSTM trainer is not loaded on this page.'));
    const data=R.map(r=>[r]),trainN=Math.min(nt,n-6);
    const model=LSTM.training(data,{target:0,features:[0],nt:trainN,nv:n,window:p.aiWindow,hidden:p.aiHidden,epochs:p.aiEpochs,seed:p.aiSeed});
    const lambda=.94;let v=null;const vol=[];
    for(let i=0;i<n;i++){if(v===null){let s=0;for(let j=0;j<=i;j++)s+=R[j]*R[j];v=s/(i+1);}else v=lambda*v+(1-lambda)*R[i-1]*R[i-1];vol.push(Math.sqrt(v));}
    const start=Math.max(2,p.aiWindow),mu=[],muIdx=[];
    for(let i=start;i<n;i++){mu.push(LSTM.predict(data,i,model));muIdx.push(i);}
    const muTest=[],z=[];
    for(let i=0;i<mu.length;i++){const idx=muIdx[i];if(idx>=nt)muTest.push(mu[i]);if(vol[idx]>0)z.push((R[idx]-mu[i])/vol[idx]);}
    const zq=S.quantile(z,1-p.alpha),ztail=z.filter(v2=>v2<=zq);
    const zTailMean=ztail.length?S.mean(ztail):zq;
    const varPath=[],esPath=[];
    for(let i=0;i<muTest.length;i++){const idx=nt+i;varPath.push(-p.N*(muTest[i]+vol[idx]*zq));esPath.push(-p.N*(muTest[i]+vol[idx]*zTailMean));}
    lstm={model,varPath,esPath,zq,zTailMean,...calibrate(loss,varPath,esPath,p)};
    lstm.meanForecast=S.mean(muTest);lstm.rmse=Math.sqrt(S.mean(actual.map((r,i)=>(r-muTest[i])**2)));
  }catch(e){lstmError=e.message;}
  /* EWMA-normal baseline on exactly the same days, α and notional. */
  const k0=Math.max(20,Math.min(nt,120)),ew=Risk.ewma(R,p.alpha,p.N,.94,k0);
  const varE=[],esE=[];
  for(let i=nt;i<n;i++){varE.push(ew.VaR[i+2]);esE.push(ew.ES[i+2]);}
  const ewma=calibrate(loss,varE,esE,p);
  ewmaVar=ewma;
  return{R,rows,nt,n,test,pred:qRF,actual,trees,rf,lstm,lstmError,ewma,vol:rows.map(r=>r.vol)};
}
let ewmaVar=null;
return{DEFAULTS,FEATURES,check,sample,design,buildTree,forest,kupiec,calibrate,run};});
