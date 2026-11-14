/* Shared statistics core for the five course-foundation labs (01/02/03/10/12).
   Base-R-compatible conventions: sample variance (n-1), type-7 quantiles,
   adjusted sample skewness/kurtosis (e1071 type 2), classical OLS inference. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LabStats=api;})(this,()=>{
'use strict';
const sum=a=>a.reduce((s,v)=>s+v,0);
const mean=a=>sum(a)/a.length;
function variance(a,ddof=1){if(a.length-ddof<=0)return NaN;const m=mean(a);return sum(a.map(v=>(v-m)**2))/(a.length-ddof);}
const sd=(a,ddof=1)=>Math.sqrt(variance(a,ddof));
function sorted(a){return [...a].sort((x,y)=>x-y);}
/* R quantile(type=7): h=(n-1)p+1, linear interpolation. */
function quantile(a,p){if(!a.length||!Number.isFinite(p))return NaN;if(p<0||p>1)throw Error('分位数概率须在0与1之间。');const x=sorted(a),h=(x.length-1)*p,lo=Math.floor(h),hi=Math.min(lo+1,x.length-1),w=h-lo;return x[lo]+(x[hi]-x[lo])*w;}
/* e1071 type 2, equivalently G1 = n/((n-1)(n-2)) * sum(z^3). */
function skew(a){const n=a.length;if(n<3)return NaN;const m=mean(a),s=sd(a);if(!(s>0))return NaN;return n/((n-1)*(n-2))*sum(a.map(v=>((v-m)/s)**3));}
/* Unbiased excess kurtosis G2 = n(n+1)S4/((n-1)(n-2)(n-3)) - 3(n-1)/(n-2). */
function kurtosis(a){const n=a.length;if(n<4)return NaN;const m=mean(a),s=sd(a);if(!(s>0))return NaN;return n*(n+1)/((n-1)*(n-2)*(n-3))*sum(a.map(v=>((v-m)/s)**4))-3*(n-1)/(n-2);}
function corr(x,y){if(x.length!==y.length)throw Error('相关系数要求等长向量。');const mx=mean(x),my=mean(y);let sxy=0,sxx=0,syy=0;for(let i=0;i<x.length;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)**2;syy+=(y[i]-my)**2;}if(!(sxx>0)||!(syy>0))return NaN;return sxy/Math.sqrt(sxx*syy);}
/* Average ranks with ties (1-based), the input to Spearman. */
function rank(a){const idx=a.map((v,i)=>i).sort((i,j)=>a[i]-a[j]),r=Array(a.length);for(let k=0;k<idx.length;){let e=k;while(e+1<idx.length&&a[idx[e+1]]===a[idx[k]])e++;const v=(k+e)/2+1;for(let t=k;t<=e;t++)r[idx[t]]=v;k=e+1;}return r;}
const spearman=(x,y)=>corr(rank(x),rank(y));
/* Lanczos log-gamma + regularised incomplete beta: t and F tails. */
function lg(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);z--;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function cf(a,b,x){const tiny=1e-300;let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<tiny)d=tiny;d=1/d;let h=d;for(let m=1;m<300;m++){for(const aa of [m*(b-m)*x/((a+2*m-1)*(a+2*m)),-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1))]){d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const delta=d*c;h*=delta;if(aa<0&&Math.abs(delta-1)<3e-14)return h;}}return h;}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const v=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?v*cf(a,b,x)/a:1-v*cf(b,a,1-x)/b;}
/* Two-sided p value for a t statistic. */
function tPvalue(t,df){if(!Number.isFinite(t)||!(df>0))return NaN;return Math.max(0,Math.min(1,ibeta(df/(df+t*t),df/2,.5)));}
function tCdf(t,df){const p=1-ibeta(df/(df+t*t),df/2,.5)/2;return t>=0?p:1-p;}
const gammaFn=z=>Math.exp(lg(z));
/* Regularised upper incomplete gamma Q(a,x) — chi-square tail for any df. */
function gammaUpper(a,x){if(!(x>=0))return NaN;if(x===0)return 1;if(x<a+1){/* series for P(a,x) */let ap=a,del=1/a,s=del;for(let n=1;n<500;n++){ap++;del*=x/ap;s+=del;if(Math.abs(del)<Math.abs(s)*1e-15)break;}return Math.max(0,Math.min(1,1-s*Math.exp(-x+a*Math.log(x)-lg(a))));}/* continued fraction for Q(a,x) */const tiny=1e-300;let b=x+1-a,c=1/tiny,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<tiny)d=tiny;c=b+an/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-15)break;}return Math.max(0,Math.min(1,Math.exp(-x+a*Math.log(x)-lg(a))*h));}
function chi2Pvalue(x,df){if(!(x>=0)||!(df>0))return NaN;return gammaUpper(df/2,x/2);}
function normalCdf(z){if(!Number.isFinite(z))return z>0?1:z<0?0:NaN;const t=1/(1+.2316419*Math.abs(z)),d=.3989422804014327*Math.exp(-z*z/2),p=d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return z>=0?1-p:p;}
function normalPdf(z){return Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);}
/* Acklam's inverse normal CDF, |relative error| < 1.15e-9. */
function normalInv(p){if(!(p>0&&p<1))throw Error('正态分位数概率须严格位于0与1之间。');const a=[-3.969683028665376e1,2.209460984245205e2,-2.759285104469687e2,1.383577518672690e2,-3.066479806614716e1,2.506628277459239],b=[-5.447609879822406e1,1.615858368580409e2,-1.556989798598866e2,6.680131188771972e1,-1.328068155288572e1],c=[-7.784894002430293e-3,-3.223964580411365e-1,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[7.784695709041462e-3,3.224671290700398e-1,2.445134137142996,3.754408661907416],pl=.02425;let q,r;if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}if(p<=1-pl){q=p-.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
/* Jarque-Bera: chi-square with two degrees of freedom. */
function jarqueBera(a){const n=a.length,jb=n/6*(skew(a)**2+kurtosis(a)**2/4);return{jb,p:chi2Pvalue(jb,2),skew:skew(a),kurt:kurtosis(a)};}
/* Classical OLS: columns are regressors, intercept added unless disabled. */
function solve(A,b){const n=A.length,M=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<n;i++){let piv=i;for(let j=i+1;j<n;j++)if(Math.abs(M[j][i])>Math.abs(M[piv][i]))piv=j;if(Math.abs(M[piv][i])<1e-12)throw Error('设计矩阵奇异：存在完全共线的解释变量，请删除其中一列。');[M[i],M[piv]]=[M[piv],M[i]];const p=M[i][i];for(let j=i;j<=n;j++)M[i][j]/=p;for(let r=0;r<n;r++)if(r!==i){const f=M[r][i];if(f)for(let j=i;j<=n;j++)M[r][j]-=f*M[i][j];}}return M.map(r=>r[n]);}
function inverse(A){return A.map((_,i)=>solve(A,A.map((__,j)=>j===i?1:0)));}
function ols(y,cols,{intercept=true,names=null}={}){const n=y.length,k=cols.length;if(!n||cols.some(c=>c.length!==n))throw Error('回归要求所有变量等长。');if(n<=k+(intercept?1:0))throw Error(`样本数 ${n} 不足以估计 ${k+(intercept?1:0)} 个参数。`);const X=cols.map(c=>c.slice());const nm=(names||cols.map((_,i)=>'x'+(i+1))).slice();if(intercept){X.unshift(Array(n).fill(1));nm.unshift('(Intercept)');}const npar=X.length,T=Array.from({length:npar},(_,i)=>Array.from({length:npar},(_,j)=>sum(X[i].map((v,t)=>v*X[j][t])))),b=Array(npar).fill(0),yy=y.map(v=>v);for(let i=0;i<npar;i++)b[i]=sum(X[i].map((v,t)=>v*yy[t]));const beta=solve(T,b),fitted=Array(n).fill(0);for(let i=0;i<npar;i++)for(let t=0;t<n;t++)fitted[t]+=beta[i]*X[i][t];const resid=y.map((v,i)=>v-fitted[i]),sse=sum(resid.map(v=>v*v)),my=mean(y),sst=sum(y.map(v=>(v-my)**2)),df=n-npar,sigma2=sse/df,inv=inverse(T),se=inv.map((row,i)=>Math.sqrt(Math.max(0,row[i]*sigma2))),tval=beta.map((v,i)=>se[i]>0?v/se[i]:NaN),pv=tval.map(t=>tPvalue(t,df));return{beta,se,t:tval,p:pv,fitted,resid,sse,sst,df,n,npar,r2:sst>0?1-sse/sst:NaN,adjR2:sst>0?1-(1-sse/sst)*(n-1)/df:NaN,sigma:Math.sqrt(sigma2),names:nm,X};}
/* Regress y on one x with intercept; returns the slope's t test too. */
const ols1=(y,x)=>ols(y,[x],{names:['x']});
/* Maximum drawdown of a simple-return series, on the cumulative NAV path. */
function maxDrawdown(r,rf=0){let nav=1,peak=1,worst=0,start=0,end=0,peakAt=0;const path=[1];for(let i=0;i<r.length;i++){nav*=1+r[i];path.push(nav);if(nav>peak){peak=nav;peakAt=i+1;}const dd=nav/peak-1;if(dd<worst){worst=dd;start=peakAt;end=i+1;}}return{nav:path,mdd:worst,start,end,peak,terminal:nav,annualised:r.length?(nav**(1/r.length)-1):NaN};}
/* Deterministic PRNG (mulberry32) so every lab and its R twin agree. */
function prng(seed=1){let a=seed>>>0;const next=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};next.range=(lo,hi)=>lo+(hi-lo)*next();next.normal=(m=0,s=1)=>{let u=0,v=0;while(u<=1e-12)u=next();while(v<=1e-12)v=next();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};return next;}
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
/* Round to a fixed number of significant digits for reporting. */
const sig=(v,d=6)=>Number.isFinite(v)?Number(v.toPrecision(d)):NaN;
/* 100*(1+r) style growth index used by every performance table. */
const growth=rs=>{let v=1;return rs.map(r=>v*=1+r);};
return{sum,mean,variance,sd,quantile,sorted,skew,kurtosis,corr,rank,spearman,lg,ibeta,tPvalue,tCdf,chi2Pvalue,gammaUpper,gammaFn,normalCdf,normalPdf,normalInv,jarqueBera,ols,ols1,inverse,solve,maxDrawdown,prng,clamp,sig,growth};});
