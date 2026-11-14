/* Experiment01 · R software basics. Deterministic teaching objects for the
   six language parts: workspace, data structures, indexing/NA, computation
   (function + loop + Monte Carlo), base graphics, packages, and the AI review
   checklist. Nothing here is a market quote; every series is synthetic. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.RBasicMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({struct:'data.frame',length:8,rows:2,naAt:2,n:120,seed:20261114,mu:.004,sigma:.045,bins:20,kind:'hist',draws:200,step:1,na:1});
const BASE=[3.2,1.5,4.0,2.7,3.9,2.2,3.3,2.9,2.4,4.4,2.0,3.6,1.8,4.2,3.0,2.6,3.5,4.1,2.3,3.7,2.8,4.3,3.1,2.5];
const BASE_RET=[.012,-.004,.021,.008];
function check(p){
  if(!Number.isInteger(p.length)||p.length<4||p.length>24)throw Error('向量长度须为 4 到 24 之间的整数。');
  if(!Number.isInteger(p.rows)||p.rows<1||p.rows>=p.length)throw Error('矩阵行数须为 1 到长度−1 之间的整数。');
  if(!Number.isInteger(p.naAt)||p.naAt<1||p.naAt>p.length)throw Error('缺失值位置须落在向量范围内。');
  if(!Number.isInteger(p.n)||p.n<20||p.n>1200)throw Error('样本量须为 20 到 1200 之间的整数。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1 到 99999999 之间的整数。');
  if(!(p.sigma>0))throw Error('标准差必须为正。');
  if(!Number.isInteger(p.bins)||p.bins<4||p.bins>40)throw Error('直方图分组须为 4 到 40 之间的整数。');
  if(!Number.isInteger(p.draws)||p.draws<10||p.draws>1000)throw Error('重复次数须为 10 到 1000 之间的整数。');
  if(!Number.isInteger(p.na)||p.na<1||p.na>3)throw Error('缺失值个数须为 1 到 3。');
  return true;
}
/* 1. workspace: the session workflow the script follows. */
const STEPS=[['读入数据','Read the data'],['检查结构','Inspect structure'],['清洗与变换','Clean and transform'],['估计模型','Estimate'],['诊断','Diagnose'],['输出与绘图','Output and plot']];
const WORKSPACE={dirs:['data','R','output','figures'],seed:20261114,files:['R/01-read.R','R/02-clean.R','R/03-model.R','R/04-plot.R']};
function workspace(p){
  const step=Math.min(5,Math.max(0,(p.step|0)-1));
  return{step,steps:STEPS,dirs:WORKSPACE.dirs,files:WORKSPACE.files,seed:WORKSPACE.seed,
    seedState:[211,457,733,911],objects:[
      {name:'d_prices',class:'data.frame',dim:'240 × 3',note:['原始数据只读','Raw input stays read-only']},
      {name:'d_ret',class:'data.frame',dim:'239 × 3',note:['清洗后收益','Cleaned returns']},
      {name:'fit_arma',class:'list',dim:'p = 1, q = 1',note:['模型对象','Fitted model']}
    ]};
}
/* 2. data structures: one vector feeds every container. */
function structures(p){
  check(p);
  const v=BASE.slice(0,p.length),rows=p.rows,cols=Math.ceil(v.length/rows),cells=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c;if(i<v.length)cells.push({r,c,i,value:v[i]});}
  const months=['2026-01-31','2026-02-28','2026-03-31','2026-04-30'];
  const df=months.map((date,k)=>({date,ret:BASE_RET[k],price:Number((100*BASE_RET.slice(0,k+1).reduce((a,b)=>a*(1+b),1)).toFixed(4))}));
  const list=[{key:'name',type:'character',value:'"股票A"'},{key:'ret',type:'numeric',length:v.length,value:'c('+v.join(', ')+')'},{key:'meta',type:'list',length:2,value:'list(n = '+v.length+', src = "synthetic")'}];
  return{vector:v,rows,cols,cells,df,list,
    frameCols:[{name:'date',type:'Date'},{name:'ret',type:'numeric'},{name:'price',type:'numeric'}],
    types:{vector:'double',matrix:'double + dim',list:'list',dataframe:'list + class'}};
}
/* 3. indexing and missing values: NA propagates unless handled explicitly. */
function indexing(p){
  check(p);
  const stride=Math.max(1,Math.floor(p.length/p.na)),naIdx=new Set(Array.from({length:p.na},(_,k)=>((p.naAt-1+k*stride)%p.length)+1));
  const v=[];
  for(let i=0;i<p.length;i++)v.push(naIdx.has(i+1)?null:Number(BASE[i%BASE.length].toFixed(2)));
  const clean=v.filter(x=>x!==null);
  const meanWithNa=v.some(x=>x===null)?null:S.mean(clean);
  const meanNaRm=S.mean(clean);
  const filled=v.map(x=>x===null?S.quantile(clean,.5):x);
  const threshold=clean.length?Number(S.quantile(clean,.6).toFixed(2)):0;
  return{vector:v,naIdx:[...naIdx],clean,meanWithNa,meanNaRm,filled,median:S.quantile(clean,.5),sum:S.sum(clean),n:p.length,naCount:p.na,
    above:clean.filter(x=>x>threshold).length,threshold,
    rules:[['x[2]','x[2]',['取第 2 个元素','Element 2']],['x[-2]','x[-2]',['删除第 2 个元素','Drop element 2']],['x[x > 4]','x[x > 4]',['逻辑索引：保留大于 4 的元素','Logical index: keep values above 4']],['which(is.na(x))','which(is.na(x))',['返回缺失位置','Positions of missing values']]]};
}
/* 4. computation: a loop, its vectorised twin, and a Monte-Carlo convergence path. */
function monteCarlo(p){
  check(p);
  const rng=S.prng(p.seed),draws=[];
  for(let b=0;b<p.draws;b++){let total=0;for(let i=0;i<p.n;i++)total+=rng.normal(p.mu,p.sigma);draws.push(total/p.n);}
  const running=[],band=[];let total=0;
  draws.forEach((v,i)=>{total+=v;const b=i+1;running.push(total/b);band.push(1.96*p.sigma/Math.sqrt(b*p.n));});
  const se=p.sigma/Math.sqrt(p.n),cover=running.filter((v,i)=>Math.abs(v-p.mu)<=band[i]).length;
  return{draws,running,band,mu:p.mu,sigma:p.sigma,n:p.n,draws_n:p.draws,se,
    final:running[running.length-1],coverage:cover/running.length,
    loopCost:p.n*p.draws,vectorCalls:p.draws};
}
/* 5. base graphics on one fixed synthetic return series. */
function graphicsData(p){
  check(p);
  const rng=S.prng(20261114),r=Array.from({length:p.n},()=>rng.normal(p.mu,p.sigma));
  const lo=Math.min(...r),hi=Math.max(...r),bins=[];const width=(hi-lo)/p.bins||1e-9;
  for(let i=0;i<p.bins;i++)bins.push({x:lo+width*(i+.5),y:0,lo:lo+width*i,hi:lo+width*(i+1)});
  for(const v of r){const k=Math.min(p.bins-1,Math.max(0,Math.floor((v-lo)/width)));bins[k].y++;}
  const density=bins.map(b=>({x:b.x,y:S.normalPdf((b.x-S.mean(r))/S.sd(r))*r.length*width/S.sd(r)}));
  const s=S.sorted(r),qq=s.map((v,i)=>({x:S.normalInv((i+.5)/s.length),y:v}));
  const q1=S.quantile(r,.25),q3=S.quantile(r,.75),iqr=q3-q1;
  return{returns:r,bins,density,qq,mean:S.mean(r),sd:S.sd(r),skew:S.skew(r),kurt:S.kurtosis(r),
    five:{min:s[0],q1,median:S.quantile(r,.5),q3,max:s[s.length-1]},
    fences:{lo:q1-1.5*iqr,hi:q3+1.5*iqr},outliers:r.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr).length,
    series:r.map((v,i)=>({x:i+1,y:v}))};
}
/* 6. package management: what is loaded, what is declared, what is checked. */
const PACKAGES=[
  {name:'stats',role:['均值、回归、分布函数','means, regression, distributions'],base:true,used:['mean()','lm()','rnorm()']},
  {name:'graphics',role:['基础绘图','Base graphics'],base:true,used:['plot()','hist()','abline()']},
  {name:'utils',role:['read.csv、head、str','read.csv, head, str'],base:true,used:['read.csv()','str()']},
  {name:'zoo',role:['不规则日期序列（需安装）','Irregular date series (extra install)'],base:false,used:['zoo()']},
  {name:'PerformanceAnalytics',role:['绩效指标（需安装）','Performance metrics (extra install)'],base:false,used:['SharpeRatio()']}
];
/* 7. AI-assisted programming: generated code is a draft that must be reviewed. */
const AI_REVIEW=[
  {key:'na',zh:'缺失值：生成代码默认 na.rm = FALSE，遇到 NA 会返回 NA。',en:'Missing values: generated code leaves na.rm = FALSE, so any NA yields NA.'},
  {key:'unit',zh:'量纲：把日频收益直接乘 252 当年化，但没有确认频率与复利口径。',en:'Units: daily returns are multiplied by 252 without checking frequency or compounding.'},
  {key:'path',zh:'可移植性：出现本机绝对路径，换一台电脑就无法运行。',en:'Portability: an absolute local path appears, so the script breaks on another machine.'},
  {key:'name',zh:'命名：用 T / F 作变量名会与 TRUE / FALSE 冲突。',en:'Naming: T / F as variable names collide with TRUE / FALSE.'},
  {key:'check',zh:'验证：计算后没有检查长度、类型或取值范围。',en:'Validation: nothing checks length, type or value range after computing.'}
];
const AI_DRAFT=[['# AI 生成草稿（未经审查）','# AI draft (not reviewed)'],['ann_return <- function(r) mean(r) * 252','ann_return <- function(r) mean(r) * 252'],['r <- read.csv("C:/Users/me/Desktop/returns.csv")$ret','r <- read.csv("C:/Users/me/Desktop/returns.csv")$ret'],['T <- ann_return(r)','T <- ann_return(r)'],['print(T)','print(T)']];
function ai(p){
  const r=[.012,NaN,-.004,.021],pure=S.mean(r.filter(v=>Number.isFinite(v)));
  const annual=pure*252,monthly=pure*12;
  const fixed=[
    ['# 审查后的版本：显式声明缺失处理与年化口径','# Reviewed version: missing values and the annualisation basis are explicit'],
    ['ann_return <- function(r, periods = 252) {','ann_return <- function(r, periods = 252) {'],
    ['  stopifnot(is.numeric(r), periods > 0)','  stopifnot(is.numeric(r), periods > 0)'],
    ['  if (all(is.na(r))) return(NA_real_)','  if (all(is.na(r))) return(NA_real_)'],
    ['  mean(r, na.rm = TRUE) * periods','  mean(r, na.rm = TRUE) * periods'],
    ['}','}'],
    ['r <- c(0.012, NA, -0.004, 0.021)','r <- c(0.012, NA, -0.004, 0.021)'],
    ['ann_return(r)                 # '+annual.toFixed(6),'ann_return(r)                 # '+annual.toFixed(6)],
    ['ann_return(r, periods = 12)   # '+monthly.toFixed(6),'ann_return(r, periods = 12)   # '+monthly.toFixed(6)]
  ];
  return{draft:AI_DRAFT,fixed,review:AI_REVIEW,r:r.map(v=>Number.isFinite(v)?v:null),naive:NaN,pure,
    annual,monthly,checks:AI_REVIEW.length};
}
const views=[['env','工作环境','Workspace'],['struct','数据结构','Data structures'],['index','索引与缺失值','Indexing and NA'],['func','编程计算','Computation'],['plot','图形制作','Base graphics'],['pkg','程序包管理','Packages'],['ai','AI 辅助编程','AI-assisted coding']];
return{defaults,check,STEPS,workspace,structures,indexing,monteCarlo,graphicsData,ai,PACKAGES,AI_REVIEW,views,BASE,BASE_RET};});
