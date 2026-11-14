/* Experiment10 · factor models and APT. A deterministic synthetic panel of
   12 assets x 36 months with documented FF3 loadings, documented true alphas
   and one mined characteristic. Nothing here is a market quote. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.FactorMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({months:60,assets:24,seed:20261114,asset:4,factors:'ff3',char:'value',split:.6});
const views=[['ff3','FF3 回归','FF3 regression'],['apt','横截面 APT','Cross-sectional APT'],['ic','因子 IC','Factor IC'],['sort','分组回测','Sorted portfolios'],['ai','AI 因子挖掘','AI factor mining']];
const FACTOR_LABEL={mkt:['市场','Market'],smb:['规模','Size'],hml:['价值','Value']};
const CHARS=[['value','价值（账面市值比）','Value (book-to-market)'],['size','规模（小市值）','Size (small cap)'],['mom','动量','Momentum']];
const PREMIA={mkt:.006,smb:.0025,hml:.0028};
function check(p){
  if(!Number.isInteger(p.months)||p.months<24||p.months>120)throw Error('月份数须为 24–120 的整数。');
  if(!Number.isInteger(p.assets)||p.assets<8||p.assets>40)throw Error('资产数须为 8–40 的整数。');
  if(!Number.isInteger(p.asset)||p.asset<1||p.asset>p.assets)throw Error('所选资产序号超出范围。');
  if(!['capm','ff3','all'].includes(p.factors))throw Error('因子集只能是 CAPM、FF3 或 FF3+HML 扩展。');
  if(!['value','size','mom'].includes(p.char))throw Error('特征只能是价值、规模或动量。');
  if(!(p.split>.3&&p.split<.9))throw Error('样本内比例须在 0.3 与 0.9 之间。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
function setOf(key){return key==='capm'?['mkt']:key==='ff3'?['mkt','smb','hml']:['mkt','smb','hml']; }
let cache=new Map();
function panel(p){
  check(p);
  const key=[p.months,p.assets,p.seed].join('|');
  if(cache.has(key))return cache.get(key);
  const T=p.months,N=p.assets,rng=S.prng(p.seed);
  const f={mkt:[],smb:[],hml:[]};
  for(let t=0;t<T;t++){f.mkt.push(PREMIA.mkt+.045*rng.normal());f.smb.push(PREMIA.smb+.025*rng.normal());f.hml.push(PREMIA.hml+.022*rng.normal());}
  const L={alpha:[],bm:[],sm:[],hl:[],sig:[]},r=[],chars={value:[],size:[],mom:[]};
  for(let i=0;i<N;i++){
    L.bm.push(.7+.6*rng());L.sm.push((rng()-0.5)*1.1);L.hl.push((rng()-0.5)*1.0);
    L.sig.push(.03+.02*rng());
    chars.value.push(L.hl[i]+.35*rng.normal());
    chars.size.push(-L.sm[i]+.35*rng.normal());
    chars.mom.push(.5*L.bm[i]+.4*rng.normal());
  }
  /* A characteristic-linked premium: the cross-section pays for value, size and
     momentum beyond the three factors, which is what IC and the sorts detect. */
  const z=v=>{const m=S.mean(v),sd=S.sd(v);return v.map(x=>sd>0?(x-m)/sd:0);};
  const zv=z(chars.value),zs=z(chars.size),zm=z(chars.mom);
  for(let i=0;i<N;i++){
    L.alpha.push(.0016*zv[i]+.0012*zs[i]+.0010*zm[i]+(rng()-0.5)*0.0008);
    const row=[];
    for(let t=0;t<T;t++){
      const eps=L.sig[i]*rng.normal();
      row.push(L.alpha[i]+L.bm[i]*f.mkt[t]+L.sm[i]*f.smb[t]+L.hl[i]*f.hml[t]+eps);
    }
    r.push(row);
  }
  const out={T,N,f,r,L,chars,key};
  cache.set(key,out);
  if(cache.size>4)cache.clear();
  return out;
}
const factorCols=(P,names)=>names.map(k=>P.f[k]);
function ff3(p){
  check(p);const P=panel(p),i=p.asset-1,names=setOf(p.factors);
  const fit=S.ols(P.r[i],factorCols(P,names),{names});
  const sets=['capm','ff3'].map(k=>({key:k,r2:S.ols(P.r[i],factorCols(P,setOf(k))).r2,alpha:S.ols(P.r[i],factorCols(P,setOf(k))).beta[0],alphaT:S.ols(P.r[i],factorCols(P,setOf(k))).t[0]}));
  const cross=[];
  for(let k=0;k<P.N;k++){const ff=S.ols(P.r[k],factorCols(P,names),{names});cross.push({id:'A'+String(k+1).padStart(2,'0'),alpha:ff.beta[0],alphaT:ff.t[0],r2:ff.r2});}
  const resid=fit.resid,jb=S.jarqueBera(resid);
  return{names,fit:{alpha:fit.beta[0],alphaT:fit.t[0],alphaP:fit.p[0],betas:fit.beta.slice(1),betaT:fit.t.slice(1),p:fit.p.slice(1),r2:fit.r2,adjR2:fit.adjR2,sigma:fit.sigma,df:fit.df,n:fit.n},
    true:{alpha:P.L.alpha[i],betas:names.map(k=>k==='mkt'?P.L.bm[i]:k==='smb'?P.L.sm[i]:P.L.hl[i]),sigma:P.L.sig[i]},
    sets,cross,diag:{jb:jb.jb,jbP:jb.p,skew:jb.skew,kurt:jb.kurt,n:fit.n},T:P.T,N:P.N};
}
function apt(p){
  check(p);const P=panel(p),names=setOf(p.factors),N=P.N;
  const betas=[],meanEx=[],firstT=[];
  for(let i=0;i<N;i++){const f=S.ols(P.r[i],factorCols(P,names),{names});betas.push(f.beta.slice(1));meanEx.push(S.mean(P.r[i]));firstT.push(f.t.slice(1));}
  const cols=names.map((_,j)=>betas.map(b=>b[j]));
  const cs=S.ols(meanEx,cols,{names});
  const fitted=cs.fitted,resid=cs.resid;
  const premia=names.map(k=>PREMIA[k]);
  return{names,lambda:cs.beta.slice(1),lambdaT:cs.t.slice(1),lambdaP:cs.p.slice(1),intercept:cs.beta[0],r2:cs.r2,N,
    scatter:meanEx.map((v,i)=>({i,meanEx:v,fitted:fitted[i],error:resid[i],beta:betas[i]})),
    premia,meanEx,trueSpread:premia,firstT,
    errorSum:S.sum(resid.map(v=>Math.abs(v))),T:P.T};
}
function ic(p,{inSample=true}={}){
  check(p);const P=panel(p),split=Math.floor(P.T*p.split),months=[];
  const char=P.chars[p.char];
  for(let t=1;t<P.T;t++){
    if(inSample&&t>split)break;
    if(!inSample&&t<=split)continue;
    const x=char.slice(),y=P.r.map(row=>row[t]);
    months.push({t,pearson:S.corr(x,y),rank:S.spearman(x,y)});
  }
  const rankIC=months.map(m=>m.rank),pearsonIC=months.map(m=>m.pearson);
  const meanRank=S.mean(rankIC),sdRank=S.sd(rankIC);
  let cum=0;const cumulative=rankIC.map(v=>(cum+=v));
  return{char:p.char,months,meanRank,meanPearson:S.mean(pearsonIC),ir:sdRank>0?meanRank/sdRank:NaN,
    hit:rankIC.filter(v=>v>0).length/rankIC.length,sdRank,cumulative,split,inSample,
    tStat:sdRank>0?meanRank/(sdRank/Math.sqrt(rankIC.length)):NaN};
}
function sort(p){
  check(p);const P=panel(p),char=P.chars[p.char],q=5,groups=Array.from({length:q},()=>({rets:[],members:[]}));
  const order=char.map((v,i)=>i).sort((a,b)=>char[a]-char[b]);
  const base=Math.floor(order.length/q),rem=order.length%q;
  let idx=0;
  for(let g=0;g<q;g++){const size=base+(g<rem?1:0);groups[g].members=order.slice(idx,idx+size);idx+=size;}
  for(let t=0;t<P.T;t++)groups.forEach((g,gi)=>{const rr=g.members.map(i=>P.r[i][t]);g.rets.push(rr.length?S.mean(rr):NaN);});
  const means=groups.map(g=>S.mean(g.rets)),sds=groups.map(g=>S.sd(g.rets));
  const ls=groups[0].rets.map((v,t)=>groups[q-1].rets[t]-v);
  const cum=(arr)=>{let c=1;return arr.map(v=>c*=1+v);};
  return{groups:groups.map((g,i)=>({n:g.members.length,mean:means[i],sd:sds[i],nav:cum(g.rets),rets:g.rets})),
    lsMean:S.mean(ls),lsSd:S.sd(ls),lsT:S.mean(ls)/(S.sd(ls)/Math.sqrt(ls.length)),lsNav:cum(ls),lsRets:ls,
    spread:means[4]-means[0],q,char:p.char,T:P.T,longShort:[...Array(P.T).keys()].map(t=>ls[t])};
}
/* ---------- 5. AI 因子候选筛选（可追溯协议） ---------- */
function aiCandidates(p){
  const P=panel(p),T=P.T;
  const char=P.chars.value,order=char.map((v,i)=>i).sort((a,b)=>char[a]-char[b]);
  const k=Math.max(2,Math.floor(P.N/3));
  const top=order.slice(-k),bottom=order.slice(0,k);
  const c1=[],c2=[],c3=[];
  const rng=S.prng(p.seed+99);
  for(let t=0;t<T;t++){
    const mean=a=>a.reduce((x,i)=>x+P.r[i][t],0)/a.length;
    c1.push(mean(top)-mean(bottom));
    c2.push(rng.normal());
    c3.push(P.f.hml[t]*(1+0.02*rng.normal()));
  }
  return[
    {key:'value',zh:'价值多空组合收益',en:'Value long-short return',prior:true,series:c1,
     rationale:['有经济先验：价值排序的多空收益吸收特征溢价','Economic prior: the value-sorted spread absorbs the characteristic premium']},
    {key:'sentiment',zh:'另类情绪指数',en:'Alternative sentiment index',prior:false,series:c2,
     rationale:['无经济先验：由随机数生成，用来检验协议能否拒绝偶然显著','No economic prior: pure noise, used to test whether the protocol rejects chance significance']},
    {key:'hmlcopy',zh:'换手率因子（HML 复制）',en:'Turnover factor (HML copy)',prior:true,series:c3,
     rationale:['看似有先验，但与 HML 几乎完全相关，属于冗余','Looks plausible but is almost perfectly correlated with HML']}];
}
function screenCandidate(P,cand){
  const {T,N}=P,half=Math.max(24,Math.floor(T/2));
  function spread(from,to){
    const loadings=Array.from({length:N},(_,i)=>{
      const y=P.r[i].slice(from,to),c=cand.series.slice(from,to);
      return S.ols(y,[c]).beta[1];
    });
    const order=loadings.map((v,i)=>i).sort((a,b)=>loadings[a]-loadings[b]);
    const k=Math.max(2,Math.floor(N/3));
    const low=order.slice(0,k),high=order.slice(-k);
    const mean=(list,t)=>list.reduce((x,i)=>x+P.r[i][t],0)/list.length;
    let s=0;for(let t=from;t<to;t++)s+=mean(high,t)-mean(low,t);
    return s/(to-from);
  }
  const isSpread=spread(0,half),oosSpread=spread(half,T);
  return{key:cand.key,prior:cand.prior,rationale:cand.rationale,
    corrHml:S.corr(cand.series,P.f.hml),isSpread,oosSpread,coverage:1};
}
function ai(p){
  check(p);
  const P=panel(p);
  const rows=aiCandidates(p).map(c=>{
    const s=screenCandidate(P,c);
    const checks=[
      {k:'prior',zh:'经济先验',en:'Economic prior',pass:c.prior,zhNote:c.prior?'有可陈述的机制':'仅由随机数生成',enNote:c.prior?'A stateable mechanism':'Generated from noise'},
      {k:'cover',zh:'覆盖率',en:'Coverage',pass:true,zhNote:'全部月份可得',enNote:'Available every month'},
      {k:'redund',zh:'冗余：|corr(HML)|<0.8',en:'Redundancy: |corr(HML)|<0.8',pass:Math.abs(s.corrHml)<0.8,zhNote:`corr(HML)=${s.corrHml.toFixed(3)}`,enNote:`corr(HML)=${s.corrHml.toFixed(3)}`},
      {k:'is',zh:'样本内：载荷分组的多空收益为正',en:'In-sample: the loading-sorted spread is positive',pass:s.isSpread>0,
       zhNote:`样本内价差 ${(s.isSpread*100).toFixed(3)}%/月`,enNote:`in-sample spread ${(s.isSpread*100).toFixed(3)}%/month`},
      {k:'oos',zh:'样本外：后半段价差仍为正',en:'Out-of-sample: the second-half spread stays positive',pass:s.oosSpread>0,
       zhNote:`样本外价差 ${(s.oosSpread*100).toFixed(3)}%/月`,enNote:`out-of-sample spread ${(s.oosSpread*100).toFixed(3)}%/month`}];
    return{...s,zhLabel:c.zh,enLabel:c.en,checks,passed:checks.filter(x=>x.pass).length,verdict:checks.every(x=>x.pass)};
  });
  return{rows,accepted:rows.filter(r=>r.verdict).length,rejected:rows.filter(r=>!r.verdict).length,candidates:rows.length,T:P.T,N:P.N};
}
return{defaults,views,check,panel,ff3,apt,ic,sort,ai,aiCandidates,screenCandidate,FACTOR_LABEL,CHARS,PREMIA,setOf};
});
