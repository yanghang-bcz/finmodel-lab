/* Run with node tests/experiment05-r-crosscheck.cjs [--write-examples]. Requires only Base R. */
'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const M = require('../dist/timeseries-math');
const L = require('../dist/timeseries-lstm');
const R = require('../dist/timeseries-r');
const repo = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'finmodel-exp05-r-'));
const emit = 'emit <- function(name,x) cat(paste("@@",name,paste(sprintf("%.17g",as.numeric(x)),collapse=","),sep="|"),"\\n",sep="")\n';
const maxError = {};
let rRuns = 0;
function close(label, actual, expected, absolute, relative = 0) {
  const a = [actual].flat(Infinity), b = [expected].flat(Infinity);
  assert.equal(a.length,b.length,label+' length');
  let error = 0;
  a.forEach((x,i)=>{
    const delta = Math.abs(x-b[i]);
    assert.ok(Number.isFinite(x) && Number.isFinite(b[i]) && delta<=absolute+relative*Math.abs(b[i]),
      label+' ['+i+']: '+x+' vs '+b[i]+' (error '+delta+')');
    error = Math.max(error,delta);
  });
  maxError[label] = Math.max(maxError[label] ?? 0,error);
}
function run(name, script, checks = '') {
  const file = path.join(tmp, name + '.R');
  const pdf = path.join(tmp, name + '.pdf');
  fs.writeFileSync(file,script+'\n'+emit+checks);
  const r = cp.spawnSync('Rscript',['--vanilla',file],{cwd:tmp,encoding:'utf8',timeout:90000,
    env:{...process.env,FINMODEL_R_PLOT:pdf}});
  assert.equal(r.status,0,name+' '+(r.error?.message || r.stderr));
  assert.equal(r.stderr,'',name+' emitted R warnings');
  fs.writeFileSync(path.join(tmp,name+'.log'),r.stdout);
  rRuns++;
  return Object.fromEntries(r.stdout.split('\n').filter(line=>line.startsWith('@@|')).map(line=>{
    const [,key,data] = line.split('|');
    return [key,data.split(',').filter(Boolean).map(Number)];
  }));
}
const defaults = {
  form:'log',target:0,adf:'drift',adfLag:2,kpss:'level',
  p:1,q:1,armaMode:'manual',armaIC:'BIC',diagnostic:15,horizon:10,
  varMode:'manual',varLag:1,varIC:'BIC',vars:[0,1],train:.7,valid:.15
};
global.window={};
require('../dist/timeseries-weights');
const frozen=window.TimeSeriesWeights;
delete global.window;
const synthetic=M.generate(), log=M.transform(synthetic,'log');
const y=log.rows.map(r=>r[0]);
const stationCheck=String.raw`
emit("y", y)
emit("adf", adf_result)
emit("kpss", kpss_result)
emit("acf", correlation$acf)
emit("pacf", partial$acf)
# A separate formula-interface regression and covariance-matrix computation.
adf_ref <- function(z, type, lag) {
  E <- embed(diff(z),lag+1L)
  lev <- z[seq.int(lag+1,length(z)-1L)]
  tt <- seq_along(lev)
  response <- E[,1]
  d <- data.frame(response,lev,tt)
  if (lag) d <- cbind(d, as.data.frame(E[,-1,drop=FALSE]))
  terms <- c("lev",if (type=="trend") "tt", if (lag) names(d)[-(1:3)])
  f <- reformulate(terms,response="response",intercept=type!="none")
  unname(coef(summary(lm(f,d)))["lev","t value"])
}
kpss_ref <- function(z, trend) {
  n <- length(z); m <- floor(4*(n/100)^.25)
  E <- residuals(if (trend) lm(z ~ seq_along(z)) else lm(z ~ 1))
  ac <- acf(E,lag.max=m,type="covariance",demean=FALSE,plot=FALSE)$acf
  sum(cumsum(E)^2)/(n^2*(ac[1]+sum(2*ac[-1]*(1-seq_len(m)/(m+1)))))
}
`;
function checkStation(name, data, options) {
  const o={...defaults,...options}, sample=M.transform(data,o.form), z=sample.rows.map(r=>r[o.target]);
  const stat=M.stationarity(z,o.adf,o.adfLag,o.kpss==='trend');
  const cc=M.correlogram(z);
  const trend=o.kpss==='trend'?'TRUE':'FALSE';
  const r=run(name,R.build('station',data,o).script,stationCheck+
    '\nemit("adf_ref",adf_ref(y,'+JSON.stringify(o.adf)+','+o.adfLag+'L))\n'+
    'emit("kpss_ref",kpss_ref(y,'+trend+'))\n');
  close('Transform: JS vs Base R',r.y,z,2e-14,3e-16);
  close('ADF tau: JS, copied R and lm reference',r.adf,[stat.tau,stat.critical,+stat.adfReject],2e-10);
  close('ADF tau: JS vs formula regression',r.adf_ref,stat.tau,2e-10);
  close('KPSS: JS and copied R',r.kpss,[stat.kpss,stat.kCritical,stat.bw,+stat.kpssReject],2e-10);
  close('KPSS: JS vs covariance ACF reference',r.kpss_ref,stat.kpss,2e-10);
  close('ACF: JS vs stats::acf',r.acf,cc.acf,2e-12);
  close('PACF: JS vs stats::pacf',r.pacf,cc.pacf.slice(1),2e-12);
  return stat;
}
const s1=checkStation('synthetic-simple',synthetic,{form:'simple',adf:'none',adfLag:0});
assert.equal(s1.adfReject,true);
const s2=checkStation('synthetic-log',synthetic,{});
assert.deepEqual([s2.adfReject,s2.kpssReject],[true,false]);
checkStation('synthetic-prices',synthetic,{form:'price',adf:'trend',adfLag:5,kpss:'trend'});
const random=M.random(811);
const innovations=Array.from({length:480},()=>Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random()));
function fixture(phi,trend=0) {
  let x=0;
  const rows=innovations.map((v,i)=>[(x=phi*x+v)+i*trend]);
  return {rows,dates:rows.map((_,i)=>'t='+i),names:['fixture'],kind:'numeric'};
}
const s3=checkStation('random-walk',fixture(1),{});
assert.deepEqual([s3.adfReject,s3.kpssReject],[false,true]);
const s4=checkStation('trend-stationary',fixture(.5,.14),{adf:'trend',kpss:'trend'});
assert.deepEqual([s4.adfReject,s4.kpssReject],[true,false]);
assert.throws(()=>M.stationarity(Array(50).fill(1),'drift',2,false),/常数/);
assert.throws(()=>M.stationarity([0,1,2],'drift',2,false),/30/);

const armaCheck=String.raw`
emit("order",c(f$p,f$q))
emit("coef",c(f$mu,f$ar,f$ma,f$sigma2))
emit("ic",c(f$logLik,f$IC))
emit("residual",f$residual)
emit("forecast",t(forecast))
if (L>f$p+f$q && L<length(e)) {
  b <- Box.test(e,lag=L,type="Ljung-Box",fitdf=f$p+f$q)
  emit("ljung",c(b$statistic,b$parameter,b$p.value))
}
if (!is.null(out$candidates)) emit("grid",t(out$candidates[,c("p","q","AIC","AICc","BIC")]))
if (length(f$ar)) stopifnot(all(Mod(polyroot(c(1,-f$ar)))>1))
if (length(f$ma)) stopifnot(all(Mod(polyroot(c(1,f$ma)))>1))
# Reference the native stats CSS residual recursion and independently optimized RSS.
start <- c(f$ar,f$ma,f$mu)
reference <- stats::arima(y,order=c(f$p,0,f$q),method="CSS",n.cond=f$burn,init=start,
  optim.control=list(reltol=1e-13,parscale=c(rep(1,f$p+f$q),sd(y)),ndeps=rep(1e-5,length(start))))
stopifnot(reference$code==0L,reference$n.cond==f$burn)
# Match effective n explicitly; stats::arima's reported loglik counts all observations.
conditional <- -(length(y)-f$burn)/2*(log(2*pi*reference$sigma2)+1)
emit("css",c(reference$sigma2,conditional))
emit("css_residual",tail(reference$residuals,-f$burn))
`;
function checkARMA(name,data,opts,script) {
  const o={...defaults,...opts}, yy=M.transform(data,o.form).rows.map(r=>r[o.target]);
  const {fit:f,candidates}=M.selectARMA(yy,o,o.chart==='criteria');
  const r=run(name,script||R.build('arma',data,o).script,armaCheck);
  const pred=M.forecastARMA(yy,f,o.horizon);
  const q=M.ljung(f,o.diagnostic);
  assert.deepEqual(r.order,[f.p,f.q]);
  close('ARMA fit: mu, AR, MA and variance',r.coef,[f.mu,f.ar,f.ma,f.sigma2],1e-4);
  close('ARMA conditional likelihood and IC',r.ic,[f.logLik,f.AIC,f.AICc,f.BIC],2e-5);
  close('ARMA residuals',r.residual,f.residual,3e-6);
  close('ARMA recursive means and 80/95 intervals',r.forecast,pred.map(Object.values),3e-6);
  if (q.p!==null) close('Ljung–Box: Q, df, p',r.ljung,[q.Q,q.df,q.p],3e-4);
  else assert.equal(r.ljung,undefined);
  if (candidates.length) close('ARMA candidate p,q,AIC,AICc,BIC',r.grid,
    candidates.map(c=>[c.p,c.q,c.AIC,c.AICc,c.BIC]),2e-5);
  close('stats::arima CSS variance/conditional likelihood',r.css,[f.sigma2,f.logLik],2e-5);
  close('stats::arima CSS residuals',r.css_residual,f.residual.slice(f.burn),3e-6);
  assert.deepEqual(f.residual.slice(0,f.burn),Array(f.burn).fill(0));
  assert.ok(Number.isInteger(f.it));
  assert.ok(pred.every(a=>a.lo95<a.lo80&&a.lo80<a.value&&a.value<a.hi80&&a.hi80<a.hi95));
  return {f,pred,q};
}
const ex = {};
ex.arma=R.build('arma',synthetic,{...defaults,chart:'criteria'}).script;
const defaultARMA=checkARMA('arma-default',synthetic,{chart:'criteria'},ex.arma);
assert.ok(defaultARMA.pred[1].hi95-defaultARMA.pred[1].lo95>defaultARMA.pred[0].hi95-defaultARMA.pred[0].lo95);
const whiteNoise=checkARMA('arma-white-noise',synthetic,{p:0,q:0,horizon:1});
close('ARMA(0,0) analytical mean',whiteNoise.f.mu,y.slice(5).reduce((s,v)=>s+v,0)/(y.length-5),1e-10);
checkARMA('arma-MA1',synthetic,{p:0,q:1,horizon:5,diagnostic:1});
checkARMA('arma-auto',synthetic,{armaMode:'auto'});
checkARMA('arma-order22',synthetic,{p:2,q:2});
const nearBoundary=checkARMA('arma-near-boundary',fixture(.992),{p:1,q:0});
assert.ok(nearBoundary.f.ar[0]>.95&&nearBoundary.f.ar[0]<1);
assert.throws(()=>M.arma(Array(50).fill(0),0,0),/常数/);
assert.throws(()=>M.arma(y.slice(0,40),5,5),/至少/);
assert.throws(()=>M.arma(y,6,1),/阶数/);

const varCheck=String.raw`
emit("order",f$p)
emit("coef",f$coef)
emit("cov",t(f$cov))
emit("fit",t(f$fitted))
emit("residual",t(f$residual))
emit("roots",sort(Mod(roots)))
emit("forecast",t(forecast))
if (!is.null(out$candidates)) emit("grid",t(out$candidates))
for (i in seq_len(ncol(V))) for (j in setdiff(seq_len(ncol(V)),i)) {
  emit(paste0("direction",i,j),granger(V,f,i,j))
}
`;
function checkVAR(name, data, opts, script) {
  const o={...defaults,...opts};
  const vv=M.transform(data,o.form).rows.map(r=>o.vars.map(j=>r[j]));
  const {fit:f,candidates}=M.selectVAR(vv,o,o.chart==='criteria');
  const r=run(name,script||R.build('var',data,o).script,varCheck);
  assert.deepEqual(r.order,[f.p]);
  close('VAR OLS coefficients',r.coef,f.coef,1e-10);
  close('VAR covariance',r.cov,f.cov,1e-12);
  close('VAR fitted',r.fit,f.X.map((_,i)=>f.fits.map(v=>v.fitted[i])),1e-11);
  close('VAR residual',r.residual,f.X.map((_,i)=>f.fits.map(v=>v.residual[i])),1e-11);
  close('VAR companion eigenvalue moduli',r.roots,M.roots(f).map(x=>x.abs).sort((a,b)=>a-b),2e-8);
  close('VAR joint recursive forecast',r.forecast,M.forecastVAR(vv,f,o.horizon),1e-11);
  if (candidates.length) close('VAR AIC/BIC/HQ comparable grid',r.grid,candidates.map(Object.values),2e-11);
  vv[0].forEach((_,i)=>vv[0].forEach((__,j)=>{
    if(i===j) return;
    const q=M.granger(vv,f,i,j);
    close('Granger: joint F, restrictions, df and p',r['direction'+(i+1)+(j+1)],[q.F,q.df1,q.df2,q.p],2e-9);
  }));
  return {f,r};
}
ex.var=R.build('var',synthetic,{...defaults,varMode:'auto'}).script;
const v1=checkVAR('var-default-auto',synthetic,{varMode:'auto'},ex.var);
assert.ok(v1.r.direction12[3]<.05&&v1.r.direction21[3]>.05);
checkVAR('var-two-lag-three-columns',synthetic,{vars:[0,1,2],varLag:2,chart:'criteria'});
checkVAR('var-five-lag-three-columns',synthetic,{vars:[0,1,2],varLag:5});
const unstable=M.roots({m:2,p:1,coef:[[0,1.08,0],[0,0,.4]]});
assert.ok(unstable.some(r=>r.abs>1));
const repeated=M.roots({m:2,p:1,coef:[[0,.4,.01],[0,0,.4]]});
close('VAR repeated eigenvalues',repeated.map(x=>x.abs),[.4,.4],1e-8);
assert.throws(()=>M.varFit(log.rows.slice(0,25),2),/充足/);
assert.throws(()=>M.varFit(y.map(x=>[x,x]),1),/共线/);
ex.granger=R.build('var',synthetic,defaults).script+
  '\n# Classroom exercise: the same VAR design, two separate directional restrictions.\n'+
  'forward <- granger(V,f,1,2)\nreverse <- granger(V,f,2,1)\n'+
  'print(rbind(market_to_sector=forward,sector_to_market=reverse))\n';
checkVAR('var-granger-two-directions',synthetic,{},ex.granger);

const csvDates=Array.from({length:112},(_,i)=>new Date(Date.UTC(2019,0,i+1)).toISOString().slice(0,10));
const csvText='date,market,sector\n'+csvDates.map((date,i)=>[date,...synthetic.rows[i].slice(0,2)].join(',')).join('\n');
const csvOptions={date:'date',columns:['market','sector'],kind:'price',unit:'decimal',frequency:'daily',missing:'reject'};
const csv=M.importData(csvText,csvOptions);
checkStation('csv-prices-to-simple',csv,{form:'simple',target:1,adfLag:4});
checkVAR('csv-joint-forecast',csv,{form:'simple',horizon:5});
const broken=csvText.replace('2019-02-02,','2019-02-02,,').replace(/2019-02-02,,[^,]+,/, '2019-02-02,,');
assert.throws(()=>M.importData(broken,csvOptions),/缺失/);
assert.throws(()=>M.importData(broken,{...csvOptions,missing:'drop'}),/不规则/);
const dropped=M.importData(broken,{...csvOptions,missing:'drop',acceptGaps:true});
assert.equal(dropped.lost,1);
assert.equal(M.transform(dropped,'simple').rows.length,110);
assert.throws(()=>M.importData(csvText.replace('2019-01-02','2019-01-01'),csvOptions),/重复/);
assert.throws(()=>M.importData(csvText.replace('2019-01-02','2019-02-31'),csvOptions),/日期无效/);
assert.throws(()=>M.importData(csvText.replace('2019-01-02','2018-01-02'),csvOptions),/不规则/);

ex.lstm=R.build('lstm',synthetic,defaults,frozen).script;
const lstmCheck=run('lstm-frozen',ex.lstm,'emit("prediction",prediction)\n');
const lstm=log.rows.slice(frozen.nv).map((_,i)=>L.predict(log.rows,frozen.nv+i,frozen));
close('LSTM frozen R prediction',lstmCheck.prediction,lstm,2e-14);
ex.comparison=R.build('compare',synthetic,defaults,frozen).script;
const comparison=run('four-model-comparison',ex.comparison,
  'emit("actual",actual)\nfor (name in names(predictions)) emit(name,predictions[[name]])\nemit("scores",scores)\n');
const comp=M.compare(log.rows,0,[0,1],defaults);
assert.deepEqual([comp.nt,comp.nv,y.length-comp.nv],[504,612,108]);
const scores=[];
close('Comparison actual aligned dates',comparison.actual,comp.actual,2e-14);
for (const [name,pred] of Object.entries({...Object.fromEntries(Object.entries(comp.models).map(([k,v])=>[k,v.prediction])),LSTM:lstm})) {
  close('Comparison one-step '+name,comparison[name],pred,3e-7);
  const err=pred.map((p,i)=>comp.actual[i]-p);
  scores.push(Math.sqrt(err.reduce((s,x)=>s+x*x,0)/err.length),err.reduce((s,x)=>s+Math.abs(x),0)/err.length);
}
close('Comparison RMSE/MAE',comparison.scores,scores,5e-8);
const changed=log.rows.map((r,i)=>i<comp.nv?r:r.map(x=>x+.2));
const later=M.compare(changed,0,[0,1],defaults);
for (const name of Object.keys(comp.models)) assert.equal(comp.models[name].prediction[0],later.models[name].prediction[0]);
assert.equal(lstm[0],L.predict(changed,comp.nv,frozen));
assert.ok(Object.values(later.models).every(model=>model.prediction.length===comp.actual.length));
const single=M.compare(log.rows.map(r=>[r[0]]),0,[0],defaults);
assert.ok(single.models.VAR.error && single.models.ARMA.prediction.length===comp.actual.length);

for(const [name,script] of Object.entries(ex)) {
  const file=path.join(repo,'examples','experiment05-'+name+'.R');
  if (process.argv.includes('--write-examples')) fs.writeFileSync(file,script);
  else assert.equal(fs.readFileSync(file,'utf8'),script,'Regenerate '+file);
}
const runtime=cp.spawnSync('Rscript',['--version'],{encoding:'utf8'});
const version=(runtime.stdout || runtime.stderr).trim();
const summary={status:'pass',version,rRuns,maxAbsoluteError:maxError,comparison:{train:comp.nt,validation:comp.nv-comp.nt,
  test:comp.actual.length,scores:Object.fromEntries(['Naive','ARMA','VAR','LSTM'].map((k,i)=>[k,{rmse:scores[2*i],mae:scores[2*i+1]}]))},
  defaultStation:s2,defaultVAR:{order:v1.f.p,forward:v1.r.direction12,reverse:v1.r.direction21},evidence:tmp};
fs.writeFileSync(path.join(tmp,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
