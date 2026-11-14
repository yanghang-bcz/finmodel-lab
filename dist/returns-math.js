/* Experiment03 · asset returns: stock total return, bond price/accrued/duration/
   holding-period return, and the distribution of returns. Every sample is
   synthetic and fixed by a seed; nothing here is a market quote. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.ReturnsMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({p0:100,p1:112,dividend:1.8,periods:5,sell:true,
  face:100,coupon:.045,freq:2,maturity:5,ytm:.038,exitYtm:.042,holdYears:2,tSince:.4,
  n:250,mu:.006,sigma:.045,jump:.012,seed:20261114});
const views=[['stock','股票收益率','Stock returns'],['bond','债券收益率','Bond returns'],['dist','收益率分布','Return distribution'],['qq','分布比较','Distribution comparison']];
function check(p){
  if(!(p.p0>0&&p.p1>0))throw Error('期初与期末价格必须为正。');
  if(!(p.dividend>=0))throw Error('股息必须为非负数。');
  if(!Number.isInteger(p.periods)||p.periods<1||p.periods>20)throw Error('期数须为 1–20 的整数。');
  if(!(p.face>0))throw Error('债券面值必须为正。');
  if(!(p.coupon>=0&&p.coupon<1))throw Error('票面利率须在 0 与 1 之间。');
  if(![1,2,4,12].includes(p.freq))throw Error('付息频率只能是 1、2、4、12。');
  if(!(p.maturity>0&&p.maturity<=30))throw Error('剩余期限须在 0–30 年之间。');
  if(!(p.ytm>-0.5&&p.ytm<1))throw Error('到期收益率须在 −50% 与 100% 之间。');
  if(!(p.tSince>=0&&p.tSince<1))throw Error('当前付息周期已过比例须在 [0,1) 内。');
  if(!(p.holdYears>0&&p.holdYears<=p.maturity))throw Error('持有期须为正且不超过剩余期限。');
  if(!Number.isInteger(p.n)||p.n<60||p.n>1200)throw Error('收益样本量须为 60–1200 的整数。');
  if(!(p.sigma>0))throw Error('波动率必须为正。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
/* 1. Stock returns over one holding period: simple, log and dividend-adjusted. */
function stock(p){
  check(p);
  const priceRet=p.p1/p.p0-1,logRet=Math.log(p.p1/p.p0),total=(p.p1+p.dividend)/p.p0-1;
  const per=(1+priceRet)**(1/p.periods)-1,perTotal=(1+total)**(1/p.periods)-1;
  const path=Array.from({length:p.periods+1},(_,k)=>({t:k,price:Number((p.p0*(1+per)**k).toFixed(4))}));
  return{priceRet,logRet,total,logTotal:Math.log((p.p1+p.dividend)/p.p0),dividendYield:p.dividend/p.p0,
    per,perTotal,annualSimple:(1+priceRet)**(1/p.periods)-1,annualLog:logRet/p.periods,
    geo:(Math.sqrt((1+p.p1/p.p0)*(1+p.p1/p.p0))-1),path,
    arithmetic:(priceRet+logRet)/2};
}
/* 2. Bond: clean/dirty price, accrued interest, duration, convexity, HPR. */
function bond(p){
  check(p);
  const f=p.freq,cpn=p.face*p.coupon/f,left=1-p.tSince,n=Math.max(1,Math.round(p.maturity*f));
  const periodRate=p.ytm/f;
  const flows=[];
  let dirty=0,tw=0,tw2=0;
  for(let k=0;k<n;k++){
    const t=(k+left)/f,pv=(cpn+(k===n-1?p.face:0))/(1+periodRate)**(k+left);
    dirty+=pv;tw+=t*pv;tw2+=t*(t+1/f)*pv;
    flows.push({t,amount:cpn+(k===n-1?p.face:0),pv});
  }
  const accrued=cpn*p.tSince,clean=dirty-accrued;
  const macaulay=tw/dirty,modified=macaulay/(1+periodRate),convexity=tw2/dirty/(1+periodRate)**2;
  /* Holding-period return: hold for holdYears, then sell at the exit yield. */
  const yearsLeft=Math.max(0,p.maturity-p.holdYears);
  const remainN=Math.round(yearsLeft*f);
  let couponCash=0,pvExit=0;
  for(let k=0;k<remainN;k++)pvExit+=(cpn+(k===remainN-1?p.face:0))/(1+p.exitYtm/f)**(k+1);
  if(remainN===0)pvExit=p.face;
  for(let k=0;k<Math.round(p.holdYears*f);k++)couponCash+=cpn;
  const hpr=(pvExit+couponCash-dirty)/dirty;
  const capGain=(pvExit-dirty)/dirty,couponRet=couponCash/dirty;
  return{cpn,n,dirty,clean,accrued,macaulay,modified,convexity,flows,yearsLeft,pvExit,couponCash,hpr,capGain,couponRet,
    dv01:-modified*dirty*1e-4,priceApprox:dirty*(1-modified*(p.exitYtm-p.ytm)+0.5*convexity*(p.exitYtm-p.ytm)**2),
    yieldChange:p.exitYtm-p.ytm};
}
/* 3. Synthetic return distribution with occasional jumps (fat tails). */
function sample(p){
  const rng=S.prng(p.seed),r=[];
  for(let i=0;i<p.n;i++){
    const jump=rng()<.02?3.2:1;
    r.push(p.mu+p.sigma*rng.normal(0,1)*jump);
  }
  return r;
}
function distribution(p){
  check(p);
  const r=sample(p),mean=S.mean(r),sd=S.sd(r),skew=S.skew(r),kurt=S.kurtosis(r),jb=S.jarqueBera(r);
  const sorted=S.sorted(r),n=r.length;
  const ann={arith:mean*252,compound:(1+mean)**252-1,vol:sd*Math.sqrt(252)};
  const level=100*Math.exp(S.sum(r.map(v=>Math.log1p(v))));
  return{r,mean,sd,skew,kurt,jb,ann,level,n,
    five:{min:sorted[0],q1:S.quantile(r,.25),median:S.quantile(r,.5),q3:S.quantile(r,.75),max:sorted[n-1]},
    annualFactor:252};
}
function histogram(p,view){
  const d=distribution(p),bins=Math.max(8,Math.min(30,Math.round(Math.sqrt(d.n))));
  const lo=Math.min(...d.r),hi=Math.max(...d.r),w=(hi-lo)/bins||1e-9;
  const counts=Array.from({length:bins},()=>0);
  d.r.forEach(v=>{counts[Math.min(bins-1,Math.max(0,Math.floor((v-lo)/w)))]++;});
  const centres=counts.map((_,i)=>lo+w*(i+.5));
  const density=centres.map(x=>S.normalPdf((x-d.mean)/d.sd)*d.n*w/d.sd);
  const qq=S.sorted(d.r).map((v,i)=>({x:S.normalInv((i+.5)/d.n),y:v}));
  return{d,...{bins:centres.map((x,i)=>({x,y:counts[i]})),density,qq,width:w}};
}
return{defaults,views,check,stock,bond,distribution,histogram,sample};
});
