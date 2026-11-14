
/* Source: runtime-version.js */
/* Read-only runtime receipt; no visible UI, tracking or parameter persistence. */
(()=>{'use strict';const build=window.FINMODEL_BUILD;
if(!build||document.querySelector('meta[name="finmodel-build"]')?.content!==build.buildId)throw Error('FinModel HTML/resource build mismatch');
document.documentElement.dataset.finmodelBuild=build.buildId;
console.info('[FinModel build]',build.buildId,build.assets);
let checking=false;
async function verify(){if(checking||location.protocol==='file:')return;checking=true;try{
 const response=await fetch('build-manifest.json',{cache:'no-store'});if(!response.ok)return;const live=await response.json();
 if(live.buildId!==build.buildId){console.warn('[FinModel] deployment changed; loading current resources');location.reload();}
}catch(error){console.warn('[FinModel] version check unavailable',error.message);}finally{checking=false;}}
window.addEventListener('pageshow',verify);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)verify();});
})();

;

/* Source: chart-interaction.js */
/* One state machine for every chart. Hover never changes explicit selection. */
(()=>{'use strict';const controllers=new Set();let motion=0,lastX,lastY;document.addEventListener('pointermove',e=>{if(e.clientX!==lastX||e.clientY!==lastY){motion++;lastX=e.clientX;lastY=e.clientY;}},true);
function create(render){let hoveredItem=null,selectedItem=null,redrawMotion=-1,hoverTarget=null;
 function paint(){render(selectedItem||hoveredItem,selectedItem?'pinned':hoveredItem?'preview':'closed');}
 const api={
  enter(key,target=null){hoverTarget=target;if(hoveredItem!==key){hoveredItem=key;if(!selectedItem)paint();}},leave(key){if(hoveredItem===key){hoveredItem=null;hoverTarget=null;if(!selectedItem)paint();}},
  clearPreview(){if(hoveredItem){hoveredItem=null;hoverTarget=null;if(!selectedItem)paint();}},
  checkPointer(target){if(hoverTarget&&(!hoverTarget.isConnected||!hoverTarget.contains(target)))api.clearPreview();},
  toggle(key){hoveredItem=null;selectedItem=selectedItem===key?null:key;paint();},
  select(key){hoveredItem=null;selectedItem=key;paint();},
  clear(){hoveredItem=selectedItem=null;hoverTarget=null;paint();},
  redraw(valid=()=>true){redrawMotion=motion;hoveredItem=null;hoverTarget=null;if(selectedItem&&!valid(selectedItem))selectedItem=null;paint();},
  bind(el,key,onSelect){el.onpointerenter=el.onpointermove=e=>{if(e.pointerType==='mouse'&&motion>redrawMotion)api.enter(key,el);};el.onpointerleave=el.onpointercancel=()=>api.leave(key);
   el.onfocus=()=>api.enter(key,el);el.onblur=()=>api.leave(key);
   el.onclick=e=>{e.stopPropagation();api.toggle(key);if(selectedItem===key)onSelect?.(key);};
   el.onkeydown=e=>{if(['Enter',' '].includes(e.key)&&el.tagName.toLowerCase()!=='button'){e.preventDefault();el.click();}};},
  get state(){return{hoveredItem,selectedItem};},destroy(){api.clear();controllers.delete(api);}
 };controllers.add(api);return api;}
function clear(){controllers.forEach(c=>c.clear());}
// A removed SVG target, lost pointer, or background tab must never strand a preview.
document.addEventListener('pointermove',e=>controllers.forEach(c=>c.checkPointer(e.target)),true);
document.addEventListener('pointercancel',()=>controllers.forEach(c=>c.clearPreview()),true);
document.addEventListener('pointerout',e=>{if(!e.relatedTarget)controllers.forEach(c=>c.clearPreview());},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
window.addEventListener('blur',()=>controllers.forEach(c=>c.clearPreview()));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&[...controllers].some(c=>c.state.hoveredItem||c.state.selectedItem)){clear();e.preventDefault();e.stopImmediatePropagation();}},true);
for(const event of ['pagehide','pageshow','hashchange','finmodel:modal-open'])window.addEventListener(event,clear);
window.ChartInteraction={create,clear};})();

;

/* Source: experiments-config.js */
/* The adopted twelve-experiment course. Order is numeric, never page-dependent. */
(()=>{'use strict';const definitions=[
 ['R软件基础实验','R基础','rbasic'],['金融市场数据整理与预处理','数据预处理','dataprep'],['资产收益率计算','收益率','returns'],['多元回归与逐步回归分析','多元回归','regression'],['ARMA与VAR模型','ARMA / VAR','timeseries'],
 ['GARCH类波动率模型','GARCH','garch'],['VaR与ES投资风险计算','VaR / ES','var'],['均值-方差投资组合决策分析','均值-方差','portfolio'],['资本资产定价模型的R语言实验','CAPM','capm'],['因子模型与APT模型','因子 / APT','factor'],['Black-Scholes期权定价','Black-Scholes','bs'],['证券投资基金绩效评价','基金绩效','fund']];
const all=Object.freeze(definitions.map(([title,shortTitle,modelId],i)=>Object.freeze({number:i+1,title,shortTitle,modelId:modelId||null,id:modelId||'experiment-'+(i+1),url:modelId?(modelId==='portfolio'?'index.html':'experiments.html?model='+modelId):null,online:!!modelId,order:i+1,description:title})).sort((a,b)=>a.number-b.number));
const byModel=id=>all.find(x=>x.modelId===id),label=x=>`实验${String(x.number).padStart(2,'0')} · ${x.title}`;
function mount(id){const current=byModel(id);document.body.dataset.model=id;document.body.dataset.experiment=String(current.number).padStart(2,'0');document.title='FinModel Lab · '+label(current);document.querySelector('header h1').textContent=label(current);
 const nav=document.querySelector('#labNav,#workbenchNav');nav.dataset.experiment=document.body.dataset.experiment;nav.setAttribute('aria-current','page');if(nav.tagName==='A')nav.href=current.url;
 if(id==='portfolio'){const shortcut=document.createElement('button');shortcut.id='catalogHeader';shortcut.textContent='实验目录';shortcut.onclick=()=>ModalUI.open(document.querySelector('#catalogDialog'));document.querySelector('.header-actions').append(shortcut);}const list=document.querySelector('#catalogDialog .catalog-list');list.setAttribute('aria-label','课程实验列表');list.innerHTML=all.map(x=>{const active=x===current,attrs=`class="course-row" data-number="${String(x.number).padStart(2,'0')}" data-online="${x.online}" ${active?'aria-current="page"':''}`,body=`<span class="course-number">${String(x.number).padStart(2,'0')}</span><span class="course-name">${x.title}</span><span class="course-status">${active?'当前实验':x.online?'进入 →':'暂未上线'}</span>`;return x.online?`<a ${attrs} href="${x.url}">${body}</a>`:`<button ${attrs} disabled>${body}</button>`;}).join('');
 list.onclick=e=>{if(e.target.closest('a'))list.closest('dialog').close();};}
window.CourseExperiments=Object.freeze({all,byModel,label,mount});})();

;

/* Source: modal-ui.js */
/* Native dialog supplies the focus trap; lifecycle and return focus are shared. */
(()=>{'use strict';const triggers=new WeakMap();let overflow='';
function open(dialog,trigger=document.activeElement){if(dialog.open)return;window.dispatchEvent(new Event('finmodel:modal-open'));triggers.set(dialog,trigger);if(!document.querySelector('dialog[open]')){overflow=document.body.style.overflow;document.body.style.overflow='hidden';}dialog.showModal();dialog.querySelector('button:not(:disabled),a[href],input')?.focus({preventScroll:true});}
for(const dialog of document.querySelectorAll('dialog')){
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow=overflow;const trigger=triggers.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});window.ChartInteraction?.clear();});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog.querySelector('.dialog-head h2')?.id||(dialog.querySelector('.dialog-head h2').id=dialog.id+'Title');dialog.setAttribute('aria-labelledby',dialog.querySelector('.dialog-head h2').id);
 dialog.querySelectorAll('.dialog-head button').forEach(b=>b.setAttribute('aria-label','关闭'+dialog.querySelector('h2').textContent));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const dialog=document.querySelector('dialog[open]');if(dialog){e.preventDefault();e.stopImmediatePropagation();dialog.close();}}},true);
window.addEventListener('pagehide',()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
window.ModalUI={open};})();

;

/* Source: experiment-math.js */
/* FinModel teaching calculations. UMD permits the same implementation in tests. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ExperimentMath=api;})(this,()=>{
const phi=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function cdf(x){if(x<=-9)return 0;if(x>=9)return 1;const a=Math.abs(x);let t=a,s=a;for(let i=1;i<400;i++){t*=a*a/(2*i+1);s+=t;if(t<Math.abs(s)*1e-16)break;}return Math.max(0,Math.min(1,.5+Math.sign(x)*phi(a)*s));}
function qnorm(p){let l=-9,h=9;for(let i=0;i<65;i++){const m=(l+h)/2;if(cdf(m)<p)l=m;else h=m;}return(l+h)/2;}
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const sd=x=>Math.sqrt(x.reduce((a,b)=>a+(b-mean(x))**2,0)/(x.length-1));
function validate(id,p){if(Object.values(p).some(v=>!Number.isFinite(v)))throw Error('请填写完整的有限数值。');
const ranges={var:{n:[50,2000],alpha:[.9,.999],N:[1,1e9],mu:[-.02,.02],scale:[.001,.05]},bs:{S:[.01,1e5],K:[.01,1e5],T:[0,10],r:[-.1,.3],sigma:[0,2],q:[0,1]},garch:{omega:[.00000001,.01],a:[0,.99],b:[0,.99],shock:[0,8]},capm:{rf:[-.1,.3],rm:[-.5,.8],beta:[-2,3]}};
for(const[k,[lo,hi]]of Object.entries(ranges[id]))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(`${k} 超出允许范围 [${lo}, ${hi}]。`);
if(id==='var'&&!Number.isInteger(p.n))throw Error('样本规模必须为整数。');if(id==='garch'&&p.a+p.b>=1)throw Error('平稳教学示例要求 α + β < 1。');return p;}
function risk(p){validate('var',p);const returns=Array.from({length:p.n},(_,j)=>{const i=j+1;return p.mu+p.scale*((((i*73)%251)-125)/72-(i%37===0?4:0));});const L=returns.map(x=>-p.N*x),x=[...L].sort((a,b)=>a-b),n=x.length,q=x[Math.ceil(n*p.alpha)-1];const weights=x.map((_,j)=>Math.max(0,Math.min((j+1)/n-p.alpha,1/n)));const es=x.reduce((s,v,j)=>s+v*weights[j],0)/(1-p.alpha);const m=mean(L),s=sd(L),z=qnorm(p.alpha);return{returns,L,sorted:x,weights,hVaR:q,hES:es,nVaR:m+s*z,nES:m+s*phi(z)/(1-p.alpha),m,s,z};}
function bs(input,iv=false){const p={q:0,...input};if(iv){if(!Number.isFinite(p.sigma)||p.sigma<0||p.sigma>1e6)throw Error("IV 搜索波动率超出 [0, 1e6]。");validate('bs',{S:p.S,K:p.K,T:p.T,r:p.r,q:p.q,sigma:Math.min(2,p.sigma)});}else validate('bs',p);const{S,K,T,r,q,sigma:v}=p,E=Math.exp(-q*T),A=S*E,D=K*Math.exp(-r*T);
if(T===0||v===0){const d=A>D?1:A<D?0:null,ok=T>0&&d!==null;return{C:Math.max(A-D,0),P:Math.max(D-A,0),d1:null,d2:null,deltaC:ok?E*d:null,deltaP:ok?E*(d-1):null,gamma:ok?0:null,vega:ok?0:null,thetaC:ok?d*(q*A-r*D)/365:null,thetaP:ok?(1-d)*(r*D-q*A)/365:null,D,A,E};}
const d1=(Math.log(S/K)+(r-q+v*v/2)*T)/(v*Math.sqrt(T)),d2=d1-v*Math.sqrt(T),base=-A*phi(d1)*v/(2*Math.sqrt(T));return{C:Math.max(0,A-D,A*cdf(d1)-D*cdf(d2)),P:Math.max(0,D-A,D*cdf(-d2)-A*cdf(-d1)),d1,d2,deltaC:E*cdf(d1),deltaP:-E*cdf(-d1),gamma:E*phi(d1)/(S*v*Math.sqrt(T)),vega:A*phi(d1)*Math.sqrt(T)/100,thetaC:(base-r*D*cdf(d2)+q*A*cdf(d1))/365,thetaP:(base+r*D*cdf(-d2)-q*A*cdf(-d1))/365,D,A,E};}
function garch(p){validate('garch',p);const h=[p.omega/(1-p.a-p.b)],eps=[],z=[];for(let j=0;j<160;j++){z[j]=j===40?p.shock:Math.sin((j+1)*2.4)*.85;if(j)h[j]=p.omega+p.a*eps[j-1]**2+p.b*h[j-1];eps[j]=Math.sqrt(h[j])*z[j];}return{h,eps,z,long:p.omega/(1-p.a-p.b),persistence:p.a+p.b};}
function capm(p){validate('capm',p);const x=Array.from({length:60},(_,j)=>.04*Math.sin((j+1)*1.7)),y=x.map((v,j)=>.001+1.2*v+.012*Math.cos((j+1)*2.3)),mx=mean(x),my=mean(y),b=x.reduce((s,v,j)=>s+(v-mx)*(y[j]-my),0)/x.reduce((s,v)=>s+(v-mx)**2,0),a=my-b*mx;return{expected:p.rf+p.beta*(p.rm-p.rf),x,y,b,a};}
return{phi,cdf,qnorm,mean,sd,validate,risk,bs,garch,capm};});

;

/* Source: iv-math.js */
/* Same BS implementation as pricing; pure Newton, no hidden fallback. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math.js'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.IVMath=api;})(this,M=>{
function solve(p,method='bisection'){
 const rows=[],result=(status,sigma=null,error=null)=>({method,status,converged:['converged','zero_boundary'].includes(status),sigma,error,rows,iterations:rows.length,expansions,lower,upper});let lower=null,upper=null,expansions=0;
 try{M.validate('bs',{S:p.S,K:p.K,T:p.T,r:p.r,q:p.q,sigma:0});}catch(e){return {...result('invalid_parameters'),message:e.message};}
 if(!['C','P'].includes(p.type)||!['bisection','newton'].includes(method)||!Number.isFinite(p.target)||p.target<0||!Number.isFinite(p.tol)||p.tol<1e-12||p.tol>.01||!Number.isInteger(p.maxIter)||p.maxIter<1||p.maxIter>200||!Number.isFinite(p.initial)||p.initial<=0||p.initial>1e6)return result('invalid_settings');
 if(p.T===0)return result('expiry_nonunique');
 const z=M.bs({...p,sigma:0},true);lower=z[p.type];upper=p.type==='C'?z.A:z.D;
 if(p.target<lower||p.target>upper)return result('arbitrage_bounds');
 // Equality, not the requested root tolerance: do not round nearby interior quotes to zero.
 if(p.target===lower)return result('zero_boundary',0,0);
 if(p.target===upper)return result('infinite_limit');
 const floor=32*Number.EPSILON*Math.max(1,upper);
 if(Math.min(p.target-lower,upper-p.target)<=floor)return result('precision_limit');
 const price=s=>M.bs({...p,sigma:s},true)[p.type];let a=0,b=.25;
 if(method==='bisection'){while(price(b)<p.target&&b<1e6&&expansions<24){b=Math.min(1e6,b*2);expansions++;}if(price(b)<p.target)return result('bracket_limit');}
 let s=p.initial;
 for(let i=0;i<p.maxIter;i++){
  if(method==='bisection')s=a+(b-a)/2;
  const v=M.bs({...p,sigma:s},true),theoreticalPrice=v[p.type],signedError=theoreticalPrice-p.target,vega=v.vega*100;
  const next=method==='newton'?(vega>0?s-signedError/vega:null):null;
  const done=Math.abs(signedError)<=p.tol,nextA=done?a:signedError<0?s:a,nextB=done?b:signedError<0?b:s;
  const row={sigma:s,theoreticalPrice,signedError,vega,nextSigma:next,a:method==='bisection'?a:null,b:method==='bisection'?b:null,nextA:method==='bisection'?nextA:null,nextB:method==='bisection'?nextB:null,stop:null};rows.push(row);
  const stop=status=>{row.stop=status;return result(status,s,signedError);};
  if(Math.abs(signedError)<=p.tol)return stop('converged');
  if(method==='newton'){if(vega<1e-12)return stop('low_vega');if(!Number.isFinite(next)||next<=0||next>1e6)return stop('newton_out_of_range');if(next===s)return stop('precision_limit');s=next;}
  else{if(s===a||s===b)return stop('precision_limit');a=nextA;b=nextB;}
 }
 rows[rows.length-1].stop='max_iterations';return result('max_iterations',rows.at(-1).sigma,rows.at(-1).signedError);
}
const reasons={converged:'报价误差达到容差',zero_boundary:'σ=0 边界解',invalid_parameters:'基础参数无效',invalid_settings:'报价、容差、初值或迭代上限无效',expiry_nonunique:'T=0：到期收益无法确定唯一 IV',arbitrage_bounds:'报价超出含股息无套利界',infinite_limit:'报价等于无限波动率极限：无有限 IV',precision_limit:'报价或迭代已接近浮点精度，无法可靠辨识',bracket_limit:'扩展至搜索上限仍无法包围根',low_vega:'Vega 接近零，纯 Newton 停止',newton_out_of_range:'Newton 下一步越出正数搜索域，未使用回退',max_iterations:'达到迭代上限，未收敛'};
return{solve,reasons};});

;

/* Source: iv-code.js */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.IVCode=api;})(this,()=>{
function script(p){return `# 基础 R，可整段复制到 RStudio；网页不执行 R
# sigma 与 raw Vega 使用小数单位；两方法均无隐藏回退
S <- ${p.S}; K <- ${p.K}; T <- ${p.T}; r <- ${p.r}; q <- ${p.q}
type <- "${p.type}"; target <- ${p.target}; tol <- ${p.tol}
max_iter <- ${p.maxIter}; initial <- ${p.initial}
bs <- function(sigma) {
  A <- S*exp(-q*T); D <- K*exp(-r*T)
  if (T == 0 || sigma == 0) return(c(price=if(type=="C") max(A-D,0) else max(D-A,0), vega=0))
  d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))
  d2 <- d1-sigma*sqrt(T)
  price <- if(type=="C") max(0,A-D,A*pnorm(d1)-D*pnorm(d2)) else max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))
  c(price=price, vega=A*dnorm(d1)*sqrt(T))
}
solve_iv <- function(method) {
  rows <- data.frame(); expansions <- 0; lower <- NA; upper <- NA
  finish <- function(status, sigma=NA_real_, error=NA_real_) list(status=status,sigma=sigma,error=error,rows=rows,expansions=expansions)
  if(any(!is.finite(c(S,K,T,r,q))) || S<.01 || S>1e5 || K<.01 || K>1e5 || T<0 || T>10 || r < -0.1 || r>.3 || q<0 || q>1) return(finish("invalid_parameters"))
  if(!(type %in% c("C","P")) || !(method %in% c("bisection","newton")) || any(!is.finite(c(target,tol,max_iter,initial))) || target<0 || tol<1e-12 || tol>.01 || max_iter<1 || max_iter>200 || max_iter!=floor(max_iter) || initial<=0 || initial>1e6) return(finish("invalid_settings"))
  if(T==0) return(finish("expiry_nonunique"))
  lower <- unname(bs(0)["price"]); upper <- if(type=="C") S*exp(-q*T) else K*exp(-r*T)
  if(target<lower || target>upper) return(finish("arbitrage_bounds"))
  if(target==lower) return(finish("zero_boundary",0,0))
  if(target==upper) return(finish("infinite_limit"))
  if(min(target-lower,upper-target)<=32*.Machine$double.eps*max(1,upper)) return(finish("precision_limit"))
  a <- 0; b <- .25
  if(method=="bisection") {
    while(bs(b)["price"]<target && b<1e6 && expansions<24) { b <- min(1e6,b*2); expansions <- expansions+1 }
    if(bs(b)["price"]<target) return(finish("bracket_limit"))
  }
  sigma <- initial
  for(i in seq_len(max_iter)) {
    if(method=="bisection") sigma <- a+(b-a)/2
    value <- bs(sigma); price <- unname(value["price"])
    error <- price-target; vega <- unname(value["vega"])
    next_sigma <- if(method=="newton" && vega>0) sigma-error/vega else NA_real_
    next_a <- if(abs(error)<=tol) a else if(error<0) sigma else a; next_b <- if(abs(error)<=tol) b else if(error<0) b else sigma
    rows <- rbind(rows,data.frame(sigma=sigma,price=price,error=error,vega=vega,next_sigma=next_sigma,a=if(method=="bisection") a else NA_real_,b=if(method=="bisection") b else NA_real_,next_a=if(method=="bisection") next_a else NA_real_,next_b=if(method=="bisection") next_b else NA_real_,stop=""))
    status <- ""
    if(abs(error)<=tol) status <- "converged"
    else if(method=="newton") {
      if(vega<1e-12) status <- "low_vega"
      else if(!is.finite(next_sigma) || next_sigma<=0 || next_sigma>1e6) status <- "newton_out_of_range"
      else if(next_sigma==sigma) status <- "precision_limit"
    } else if(sigma==a || sigma==b) status <- "precision_limit"
    if(status!="") { rows$stop[nrow(rows)] <- status; return(finish(status,sigma,error)) }
    if(method=="newton") sigma <- next_sigma else { a <- next_a; b <- next_b }
  }
  rows$stop[nrow(rows)] <- "max_iterations"
  finish("max_iterations",tail(rows$sigma,1),tail(rows$error,1))
}
bisection <- function() solve_iv("bisection")
newton <- function() solve_iv("newton")
results <- list(bisection=bisection(),newton=newton())
for(method in names(results)) {
  cat("\\n",method,"\\n"); print(results[[method]][c("status","sigma","error","expansions")])
  print(results[[method]]$rows, digits=12)
}
# 工程实践可用 uniroot；上面保留每一步教学轨迹。
`;}
return{script};});

;

/* Source: hedge-math.js */
/* One option sold = one unit underlying. No external funding after premium. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math.js'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.HedgeMath=api;})(this,M=>{
const defaults={S:100,K:100,T:1,r:.05,q:0,sigma:.2,N:60,interval:1,seed:2027,type:'C'};
function validate(p){M.validate('bs',{S:p.S,K:p.K,T:p.T,r:p.r,q:p.q,sigma:p.sigma});if(p.T===0)throw Error('T=0 已到期：只能计算支付，不能建立到期前 Delta 对冲。');if(!['C','P'].includes(p.type))throw Error('请选择 Call 或 Put。');for(const[k,lo,hi]of [['N',1,504],['interval',1,504],['seed',0,2147483646]])if(!Number.isInteger(p[k])||p[k]<lo||p[k]>hi)throw Error(`${k} 必须是 [${lo}, ${hi}] 内的整数。`);return p;}
function normals(seed,n){let state=seed%2147483646+1;const uniform=()=>{state=(state*16807)%2147483647;return state/2147483647;};return Array.from({length:n},()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform()));}
function path(p){validate(p);const dt=p.T/p.N,z=normals(p.seed,p.N),s=[p.S];for(let i=0;i<p.N;i++){const v=s[i]*Math.exp((p.r-p.q-p.sigma*p.sigma/2)*dt+p.sigma*Math.sqrt(dt)*z[i]);if(!Number.isFinite(v)||v<.01||v>1e5)throw Error('模拟路径超出当前 BS 教学价格域 [0.01,100000]，请调整期限、波动率或种子；未截断或替换路径。');s.push(v);}return s;}
function option(p,S,tau){if(tau===0)return{price:p.type==='C'?Math.max(S-p.K,0):Math.max(p.K-S,0),delta:null,gamma:null};const v=M.bs({S,K:p.K,T:tau,r:p.r,q:p.q,sigma:p.sigma});const delta=p.type==='C'?v.deltaC:v.deltaP;if(delta===null)throw Error('零波动率的确定性折点处 Delta 不唯一，不能据此构造唯一对冲头寸；请调整参数。');return{price:v[p.type],delta,gamma:v.gamma};}
function simulate(input={},fixedPath=null){const p={...defaults,...input};validate(p);const spots=fixedPath?Array.from(fixedPath):path(p);if(spots.length!==p.N+1||spots[0]!==p.S||spots.some(x=>!Number.isFinite(x)||x<.01||x>1e5))throw Error('固定测试路径必须含 N+1 个合法价格并从 S0 开始。');const dt=p.T/p.N,options=spots.map((s,i)=>option(p,s,p.T*(p.N-i)/p.N)),v0=options[0].price,strategies={};
for(const name of ['none','static','dynamic']){let h=name==='none'?0:options[0].delta,b=v0-h*p.S;const rows=[{i:0,t:0,tau:p.T,S:p.S,...options[0],oldHolding:0,holding:h,quantity:h,cashBefore:v0,interest:0,dividend:0,tradeCash:-h*p.S,cash:b,net:h*p.S+b-v0,netDelta:h-options[0].delta,rebalance:false,settlement:0}];
 for(let i=1;i<=p.N;i++){const oldHolding=h,interest=b*Math.expm1(p.r*dt),dividend=oldHolding*p.q*spots[i-1]*dt,cashBefore=b+interest+dividend,rebalance=name==='dynamic'&&i<p.N&&i%p.interval===0;if(rebalance)h=options[i].delta;const quantity=h-oldHolding,tradeCash=-quantity*spots[i];b=cashBefore+tradeCash;const net=h*spots[i]+b-options[i].price;rows.push({i,t:i*dt,tau:p.T*(p.N-i)/p.N,S:spots[i],...options[i],oldHolding,holding:h,quantity,cashBefore,interest,dividend,tradeCash,cash:b,net,netDelta:i===p.N?null:h-options[i].delta,rebalance,settlement:0});}
 const last=rows[p.N];strategies[name]={name,rows,error:last.net,settlement:{stockLiquidation:last.holding*last.S,optionPayment:-last.price,cashBefore:last.cash,finalCash:last.net,finalHolding:0}};
}
return{p,spots,options,dt,premium:v0,strategies};}
function prediction(){const p=defaults,a=option(p,100,1),b=option(p,105,1);return{before:a,after:b,originalHolding:a.delta,newHolding:b.delta,trade:b.delta-a.delta,unadjustedNetDelta:a.delta-b.delta};}
return{defaults,validate,normals,path,option,simulate,prediction};});

;

/* Source: hedge-code.js */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.HedgeCode=api;})(this,()=>{
function script(p,mode='basic',fixedPath=null){return `# 一份教学欧式期权对应一单位标的；卖出一份，非真实市场预测
# [parameters] 定价与路径波动率一致；允许卖空、分数持仓，无交易成本
S0 <- ${p.S}; K <- ${p.K}; T <- ${p.T}; r <- ${p.r}; q <- ${p.q}; sigma <- ${p.sigma}
N <- ${p.N}; interval <- ${p.interval}; seed <- ${p.seed}; type <- "${p.type}"
# [validation] 与网页使用同一教学域；不截断超域价格
stopifnot(all(is.finite(c(S0,K,T,r,q,sigma,N,interval,seed))), S0>=.01, S0<=1e5, K>=.01, K<=1e5,
          T>0, T<=10, r >= -0.1, r<=.3, q>=0, q<=1, sigma>=0, sigma<=2,
          N>=1, N<=504, N==floor(N), interval>=1, interval<=504, interval==floor(interval),
          seed>=0, seed<=2147483646, seed==floor(seed), type %in% c("C","P"))
# [delta] 带连续股息的 BS 价格、Delta；到期直接使用支付函数
option <- function(S, tau) {
  if(tau==0) return(c(price=if(type=="C") max(S-K,0) else max(K-S,0), delta=NA_real_, gamma=NA_real_))
  A <- S*exp(-q*tau); D <- K*exp(-r*tau)
  if(sigma==0) {
    if(A==D) stop("Zero volatility kink: Delta is not unique")
    d <- as.numeric(A>D)
    return(c(price=if(type=="C") max(A-D,0) else max(D-A,0), delta=exp(-q*tau)*(d-if(type=="P") 1 else 0), gamma=0))
  }
  d1 <- (log(S/K)+(r-q+sigma^2/2)*tau)/(sigma*sqrt(tau)); d2 <- d1-sigma*sqrt(tau)
  price <- if(type=="C") max(0,A-D,A*pnorm(d1)-D*pnorm(d2)) else max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))
  delta <- exp(-q*tau)*(pnorm(d1)-if(type=="P") 1 else 0)
  c(price=price, delta=delta, gamma=exp(-q*tau)*dnorm(d1)/(S*sigma*sqrt(tau)))
}
# [path] Park-Miller + Box-Muller，与网页相同的可复现教学随机数
normal_draws <- function(seed, n) {
  state <- seed %% 2147483646 + 1
  uniform <- function() { state <<- (state*16807) %% 2147483647; state/2147483647 }
  vapply(seq_len(n), function(i) sqrt(-2*log(uniform()))*cos(2*pi*uniform()), numeric(1))
}
dt <- T/N
${fixedPath?`spots <- c(${fixedPath.map(v=>Number(v).toPrecision(17)).join(',')}) # 固定核对路径`:`Z <- normal_draws(seed,N)
spots <- numeric(N+1); spots[1] <- S0
for(i in seq_len(N)) spots[i+1] <- spots[i]*exp((r-q-sigma^2/2)*dt+sigma*sqrt(dt)*Z[i])`}
stopifnot(length(spots)==N+1, spots[1]==S0, all(is.finite(spots)), all(spots>=.01 & spots<=1e5))
# [time] 期末tau严格为0；三种策略共享同一条路径与同一权利金
values <- t(vapply(0:N,function(i) option(spots[i+1], T*(N-i)/N), numeric(3)))
premium <- values[1,"price"]
run_strategy <- function(strategy) {
  # [initial] 权利金支付股票成本，余款为现金；允许负现金（借款）
  holding <- if(strategy=="none") 0 else values[1,"delta"]
  cash <- premium-holding*S0
  rows <- data.frame(i=0,t=0,tau=T,S=S0,price=premium,delta=values[1,"delta"],gamma=values[1,"gamma"],
    oldHolding=0,holding=holding,quantity=holding,cashBefore=premium,interest=0,dividend=0,
    tradeCash=-holding*S0,cash=cash,net=holding*S0+cash-premium,netDelta=holding-values[1,"delta"],rebalance=FALSE,settlement=0)
  for(i in seq_len(N)) {
    # [interest] 先按连续复利更新现金账户，负现金承担利息
    oldHolding <- holding; interest <- cash*expm1(r*dt)
    # [dividend] 左端点矩形近似，股息期末入账；空头为支出，不额外复利
    dividend <- oldHolding*q*spots[i]*dt
    cashBefore <- cash+interest+dividend
    # [trade] 仅动态策略在约定时点调仓；到期不再构造Delta
    rebalance <- strategy=="dynamic" && i<N && i %% interval==0
    if(rebalance) holding <- values[i+1,"delta"]
    quantity <- holding-oldHolding
    tradeCash <- -quantity*spots[i+1]
    cash <- cashBefore+tradeCash
    # [net] 卖方组合：股票+现金-期权负债；终点price为真实支付
    net <- holding*spots[i+1]+cash-values[i+1,"price"]
    rows <- rbind(rows,data.frame(i=i,t=i*dt,tau=T*(N-i)/N,S=spots[i+1],price=values[i+1,"price"],
      delta=values[i+1,"delta"],gamma=values[i+1,"gamma"],oldHolding=oldHolding,holding=holding,quantity=quantity,
      cashBefore=cashBefore,interest=interest,dividend=dividend,tradeCash=tradeCash,cash=cash,net=net,
      netDelta=if(i==N) NA_real_ else holding-values[i+1,"delta"],rebalance=rebalance,settlement=0))
  }
  rows
}
results <- lapply(c("none","static","dynamic"),run_strategy)
names(results) <- c("none","static","dynamic")
errors <- vapply(results,function(x) tail(x$net,1),numeric(1))
# [settle] 终点表格为清算前账户；卖出所有股票并支付期权后，现金等于净误差
settlement <- lapply(results,function(x) {
  last <- x[nrow(x),]; c(stockLiquidation=last$holding*last$S, optionPayment=-last$price,
    cashBefore=last$cash, finalCash=last$cash+last$holding*last$S-last$price, finalHolding=0)
})
print(errors, digits=12)
print(tail(results$dynamic,3), digits=10)
${mode==='full'?`# [validation] 逐期对账与自融资验证
for(x in results) {
  stopifnot(abs(x$net[1])<1e-8)
  stopifnot(max(abs(x$cash-x$cashBefore-x$tradeCash))<1e-7)
  stopifnot(max(abs(x$net-(x$holding*x$S+x$cash-x$price)))<1e-7)
  stopifnot(max(abs(diff(x$cash)-x$interest[-1]-x$dividend[-1]-x$tradeCash[-1]))<1e-7)
}
# [plot] 相同路径上的三策略；单条路径误差不保证随调仓频率单调改善
matplot((0:N)*dt,do.call(cbind,lapply(results,function(x) x$net)),type="l",lty=1:3,
        col=c("#a98773","#6689a8","#659b8a"),xlab="Time (years)",ylab="Short option net value")
legend("topleft",legend=names(results),lty=1:3,col=c("#a98773","#6689a8","#659b8a"))
`:''}# RStudio实践：保持N、seed与其他参数不变，只修改interval后整段重跑。
# 比较errors和逐期账户；更频繁调仓不保证本路径误差单调下降或盈利。
`;}
return{script};});

;

/* Source: bs-lesson.js */
/* Experiment 11: one source for executable R, formulas and teaching explanations. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math.js'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.BSLesson=api;})(this,M=>{
const f=x=>x===null?'未定义':Number(x.toPrecision(8)).toString(),pct=x=>f(x*100)+'%';
const config={defaults:{S:100,K:100,T:1,r:.05,sigma:.2,q:0},inputs:[['S','标的现价 S（元／股）',.01,1e5,1],['K','行权价 K（元／股）',.01,1e5,1],['T','剩余期限 T（年）',0,10,.01],['r','连续复利年利率 r（小数）',-.1,.3,.001],['sigma','年化波动率 σ（0.20 = 20%）',0,2,.01],['q','连续股息收益率 q（0.05 = 5%）',0,1,.001]],assumptions:'欧式，仅到期行权；恒定连续复利利率、非负连续股息收益率与波动率，对数正态股价、无摩擦市场。q为连续比例股息，不是离散现金分红；q=0回到无分红。教学输入范围 S,K∈[0.01,100000]，T∈[0,10]年，r∈[−0.1,0.3]，σ∈[0,2]，q∈[0,1]，均需为有限数。T=0按到期收益，全部Greeks留空；σ=0按确定性贴现收益，折点处Greeks留空（Vega右导数在折点可能非零，故不填0），其余按确定性分支。Vega=∂V/∂σ÷100，为每1个百分点；Theta=−∂V/∂T÷365，为每自然日局部敏感度。',question:'可复现案例 S=K=100、T=1、r=5%、σ=20%。只把连续股息收益率 q 从0%调到5%，Call与Put如何变化？',choices:['看涨非增、看跌非减','看涨非减、看跌非增','两者都不变'],correct:0,exploreKey:'q',start:0,target:.05,answer:'固定其余参数且T>0、σ>0时，∂C/∂q=−T S e^(−qT)Φ(d₁)<0，∂P/∂q=T S e^(−qT)Φ(−d₁)>0。零波动时仅保证非增/非减（可能局部不变）；T=0时q没有影响。',teacher:'采用12实验教学大纲。本轮覆盖欧式BS看涨看跌R函数、连续股息与四项Greeks。默认q=0核对10.450584/5.573526；先预测再实验，只开放q，比较0%与5%。隐含波动率二分法、牛顿法可切换至独立教学模块；动态Delta对冲可在第四模块模拟。Φ(d₂)是风险中性测度下S_T>K的概率，Φ(d₁)不是实际获利概率。'};
function build(input,mode='basic'){
 const p={q:0,...input},v=M.bs(p),boundary=p.T===0||p.sigma===0;if(boundary)mode='full';const full=mode==='full',blocks=[];
 const add=(title,code,action,formula,value,economic,links=[],mark='')=>blocks.push({title,lines:code.split('\n'),action,formula,value,economic,links,mark});
 add('模型与口径','# 欧式期权；连续复利；q为连续股息收益率\n# 基础R，无需额外包；价格单位：元/股','用同一套连续股息模型计算价格、Greeks与曲线。',String.raw`C-P=Se^{-qT}-Ke^{-rT}`,`q=${pct(p.q)}；${boundary?'边界使用完整函数':'T>0、σ>0'}`,'此模块包含定价、连续股息与静态敏感度；隐含波动率求根请切换模块，动态Delta对冲请切换第四模块。');
 const parameters={S:['标的当前每股现价。','S_0',`${f(p.S)} 元／股`,'改变当前股价，不代表预测未来价格。','S'],K:['合约约定的到期执行价。','K',`${f(p.K)} 元／股`,'与现价S采用相同货币单位。','K'],T:['输入剩余期限，单位年。','T',`${f(p.T)} 年`,'T=0时价格为到期收益，不扣买入期权成本。',''],r:['连续复利无风险年利率，使用小数。','e^{-rT}',pct(p.r),'利率贴现与股息贴现分别作用于执行价和标的。',''],sigma:['输入年化波动率，使用小数。',String.raw`\sigma`,pct(p.sigma),'σ=0是确定性边界；不将除以零传入d₁/d₂。',''],q:['输入非负连续股息收益率，0.05表示5%。','e^{-qT}',pct(p.q),'q是连续比例分红假设，与离散现金股息不同。','']};
 for(const[k,d]of Object.entries(parameters))add('参数 · '+k,`${k} <- ${p[k]}`,d[0],d[1],d[2],d[3],[k],d[4]);
 if(full)add('价格函数与边界',`bs <- function(S,K,T,r,sigma,q=0) {
  x <- c(S,K,T,r,sigma,q)
  if (length(x)!=6 || any(!is.finite(x)) ||
      any(x < c(.01,.01,0,-.1,0,0)) ||
      any(x > c(1e5,1e5,10,.3,2,1)))
    stop("Invalid BS input")
  E <- exp(-q*T)
  A <- S*E; D <- K*exp(-r*T)
  if (T==0 || sigma==0) {
    dc <- if (T==0 || A==D) NA_real_ else as.numeric(A>D)
    ok <- !is.na(dc)
    return(c(C=max(A-D,0),P=max(D-A,0),d1=NA,d2=NA,
      deltaC=E*dc,deltaP=E*(dc-1),
      gamma=if(ok) 0 else NA,vega=if(ok) 0 else NA,
      thetaC=if(ok) dc*(q*A-r*D)/365 else NA,
      thetaP=if(ok) (1-dc)*(r*D-q*A)/365 else NA))
  }`,'先验证有效域，再处理到期和零波动；避免除以零。',String.raw`A=Se^{-qT},\quad D=Ke^{-rT},\quad C=\max(A-D,0),\ P=\max(D-A,0)`,`T=${f(p.T)}，σ=${f(p.sigma)}；${boundary?'进入边界分支':'进入常规分支'}`,'到期全部Greeks未定义。零波动且A≠D时Delta为E或0（Put为0或−E），Gamma/Vega为0；折点留空。',['T','sigma','q'],'price');
 const prefix=full?'  ':'';
 const line=(title,code,action,formula,value,economic,links=[],mark='')=>add(title,code.split('\n').map(x=>prefix+x).join('\n'),action,formula,value,economic,links,mark);
 line('股息贴现因子 E','E <- exp(-q*T)','连续股息在剩余期限内的贴现因子。','E=e^{-qT}',`E=${f(v.E)}`,'q=0时E=1；它同时进入价格和Delta/Gamma。',['q','T']);
 line('标的贴现值 A','A <- S*E','计算定价中的股息调整标的项。','A=Se^{-qT}',`A=${f(v.A)} 元`,'它是公式中的现值项，不是对未来股价的现实预测。',['S','q','T'],'S');
 line('行权价现值 D','D <- K*exp(-r*T)','按连续复利贴现执行价。','D=Ke^{-rT}',`D=${f(v.D)} 元`,'到期支付的行权价与当前支付金额需在同一时点比较。',['K','r','T'],'K');
 line('标准化距离 d₁','d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/\n  (sigma*sqrt(T))','标准化对数价差与风险中性漂移。',String.raw`d_1=\frac{\ln(S/K)+(r-q+\sigma^2/2)T}{\sigma\sqrt T}`,`d₁=${f(v.d1)}`,'公式适用于T>0且σ>0；风险中性含股息漂移为r−q。',['S','K','r','q','sigma','T']);
 line('标准化距离 d₂','d2 <- d1-sigma*sqrt(T)','从d₁减去年化波动率乘期限平方根。',String.raw`d_2=d_1-\sigma\sqrt T`,`d₂=${f(v.d2)}`,'d₂用于风险中性测度下到期价内事件的概率。',['sigma','T']);
 line('正态权重 Φ(d₁)','N1 <- pnorm(d1)','pnorm是标准正态累积分布函数。',String.raw`N_1=\Phi(d_1)`,`Φ(d₁)=${v.d1===null?'未定义':f(M.cdf(v.d1))}`,'Φ(d₁)是标的项的定价权重；可解释为股票计价测度下S_T>K的概率，不能简单称为真实获利概率。',['S','q']);
 line('风险中性概率 Φ(d₂)','N2 <- pnorm(d2)','计算风险中性测度下到期S_T>K的概率。',String.raw`N_2=\Phi(d_2)=\mathbb Q(S_T>K)`,`Φ(d₂)=${v.d2===null?'未定义':f(M.cdf(v.d2))}`,'仅在当前BS假设且T>0、σ>0下成立；到期价内不等于扣除期权成本后的净盈利。',['S','K','q']);
 line('看涨价格 Call','C <- max(0,A-D,A*N1-D*N2)','标的加权项减去执行价加权项；max只抵御浮点舍入。',String.raw`C=A\Phi(d_1)-D\Phi(d_2)`,`Call=${f(v.C)} 元`,'非负且不低于A−D，不高于A。',['S','K','q'],'call');
 line('看跌价格 Put','P <- max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))','用负d值计算看跌的正态权重。',String.raw`P=D\Phi(-d_2)-A\Phi(-d_1)`,`Put=${f(v.P)} 元`,'非负且不低于D−A，不高于D。',['S','K','q'],'put');
 line('Delta · 价格一阶敏感度','deltaC <- E*N1\ndeltaP <- -E*pnorm(-d1)','Delta=∂V/∂S（元/元）。',String.raw`\Delta_C=e^{-qT}\Phi(d_1),\quad\Delta_P=-e^{-qT}\Phi(-d_1)`,`Call=${f(v.deltaC)}，Put=${f(v.deltaP)}`,'局部价格敏感度；Call非负、Put非正，二者之差为e^(−qT)。',['S','q'],'delta');
 line('Gamma · 价格二阶敏感度','gamma <- E*dnorm(d1)/(S*sigma*sqrt(T))','Gamma=∂²V/∂S²（1/元）；dnorm为正态密度。',String.raw`\Gamma=\frac{e^{-qT}\phi(d_1)}{S\sigma\sqrt T}`,`Gamma=${f(v.gamma)}`,'Call和Put的Gamma相同，常规分支为正。',['S','sigma','T','q'],'gamma');
 line('Vega · 每1个百分点','vega <- A*dnorm(d1)*sqrt(T)/100','标准导数∂V/∂σ的单位为元/1.0波动率；显示值除以100。',String.raw`Vega_{1pp}=\frac{A\phi(d_1)\sqrt T}{100}`,`Vega=${f(v.vega)} 元／1百分点`,'例如从20%到21%是1个百分点，小变化近似用当前Vega。',['sigma','q'],'vega');
 line('Theta · 每自然日',`base <- -A*dnorm(d1)*sigma/(2*sqrt(T))
thetaC <- (base-r*D*N2+q*A*N1)/365
thetaP <- (base+r*D*pnorm(-d2)-q*A*pnorm(-d1))/365`,'Theta=−∂V/∂T，标准单位元/年；显示值再除365。',String.raw`365\Theta_C=-\frac{A\phi(d_1)\sigma}{2\sqrt T}-rD\Phi(d_2)+qA\Phi(d_1)`,`Call=${f(v.thetaC)}，Put=${f(v.thetaP)} 元／自然日`,'是时间流逝的局部敏感度；正负取决于参数，不能一概称为负值，也不是实际隔夜盈亏。',['T','r','q'],'theta');
 add('输出价格与Greeks',`${prefix}result <- c(C=C,P=P,d1=d1,d2=d2,
${prefix}  deltaC=deltaC,deltaP=deltaP,gamma=gamma,vega=vega,
${prefix}  thetaC=thetaC,thetaP=thetaP)${full?'\n  return(result)\n}\nresult <- bs(S,K,T,r,sigma,q)':''}
print(result)`,'输出网页使用的同一组价格与Greeks。',String.raw`C-P=A-D`, `C−P=${f(v.C-v.P)}；A−D=${f(v.A-v.D)}`,'网页边界空值对应R的NA；不伪造边界敏感度。',[],'greeks');
 const spots='spot <- seq(max(.01,min(S,K)*.4),\n  min(100000,max(S,K)*1.6),length.out=121)';
 const curves=full?'prices <- vapply(spot,function(s)\n  bs(s,K,T,r,sigma,q)[c("C","P")],numeric(2))\nmatplot(spot,t(prices),type="l",lty=1,\n  xlab="Spot S",ylab="Option price")':`u <- (log(spot/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))
v <- u-sigma*sqrt(T)
call <- pmax(0,spot*E-D,spot*E*pnorm(u)-D*pnorm(v))
put <- pmax(0,D-spot*E,D*pnorm(-v)-spot*E*pnorm(-u))
matplot(spot,cbind(call,put),type="l",lty=1,
  xlab="Spot S",ylab="Option price")`;
 add('绘制价格与S/K参考线',spots+'\n'+curves+'\nabline(v=c(S,K),lty=c(2,4))','只改变横轴现价S；固定K、T、r、σ、q。',String.raw`C(S;q),\quad P(S;q)`,`当前q=${pct(p.q)}`,'这是当前理论价格随现价的曲线，不是未来价格路径，也不是净利润。',['q'],'price');
 return{q:v,blocks,code:blocks.flatMap(b=>b.lines).join('\n'),mode,boundary};
}
return{config,build};});

;

/* Source: experiment-lessons.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math.js'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.ExperimentLessons=api;})(this,M=>{
const f=x=>x===null?'未定义':x!==0&&Math.abs(x)<.00001?x.toExponential(4):Number(x).toLocaleString('en-US',{maximumFractionDigits:6}),pct=x=>f(x*100)+'%';
const B=(title,lines,action,formula,value,economic,links=[],mark='')=>({title,lines:lines.split('\n'),action,formula,value,economic,links,mark});
const configs={
var:{defaults:{n:250,alpha:.95,N:1000000,mu:.0004,scale:.01},inputs:[['n','合成样本规模 n（整数）',50,2000,1],['alpha','置信水平 α（0.95 = 95%）',.9,.999,.001],['N','名义本金 N（元）',1,1e9,10000],['mu','日收益基准 μ（小数）',-.02,.02,.0001],['scale','日收益尺度 s（小数）',.001,.05,.001]],assumptions:'固定 1 个交易日持有期；n 个等权合成情景，非市场历史数据，不做跨期平方根缩放。简单收益 R，货币损失 L = −N R；负损失表示盈利，VaR 不强制截为零。历史法采用经验逆分布 quantile(type=1)；ES = (1−α)⁻¹∫α¹ Q(u)du，边界情景按概率质量分摊。正态法使用同一样本的损失均值与样本标准差（n−1），不是合成输入尺度。未覆盖 RiskMetrics、GARCH VaR 或极值理论。',question:'固定样本、名义本金及其他参数，将 α 从95%提高到99%，历史 VaR 与 ES 会如何变化？',choices:['均不会下降','均必然下降','只有 VaR 含尾部信息'],correct:0,exploreKey:'alpha',start: .95,target:.99,answer:'相同损失分布下，分位数与上尾平均均不会下降；离散样本可以出现相同值。VaR 只定位门槛，ES 汇总最坏 1−α 概率中的损失严重性，通常不小于 VaR。置信水平不是“不会亏损”的概率。',teacher:'先让学生解释负收益为何对应正损失，再对比两种方法。将样本规模设为253，使尾部含非整数个情景，点击 ES 语句讨论边界权重。最后固定数据比较95%与99%；不要把更大VaR说成风险本身因置信水平改变而上升。'},
bs:(typeof module==='object'?require('./bs-lesson.js'):BSLesson).config,
garch:{defaults:{omega:.00001,a:.12,b:.82,shock:4},inputs:[['omega','ω（小数收益率的平方）',.00000001,.01,.000001],['a','ARCH 系数 α',0,.99,.01],['b','GARCH 系数 β',0,.99,.01],['shock','第41期标准化冲击 z₄₁',0,8,.1]],assumptions:'160期固定合成标准化冲击驱动的递推示例；不是实际行情、参数估计或拟合。h₁ 取平稳 GARCH 假设下的无条件方差。固定 z 序列不是随机 iid 样本，不能以路径样本方差验证无条件方差公式。要求 ω>0、α≥0、β≥0、α+β<1。单期 εₜ=√hₜ zₜ，冲击在下一期影响 h。未实现 ARCH 独立估计。',question:'保持 ω、α、β 不变，把第41期标准化冲击从4提高到6，第42期条件方差会怎样？',choices:['上升（α>0）','下降','第41期方差先变'],correct:0,exploreKey:'shock',start:4,target:6,answer:'h₄₂ = ω + α ε₄₁² + β h₄₁；冲击首先改变 ε₄₁，再改变 h₄₂。α>0时较大的冲击绝对值提高下一期方差，α=0时冲击对方差没有影响。α+β 描述常规随机 GARCH 模型下的预期持久性。',teacher:'指认第41期冲击与第42期方差的时序，不能把同一期冲击放进 hₜ。令α=0核对无冲击响应。对比高低α+β，但提醒改变β也改变无条件方差。此模块只展示递推，没有假称估计。'},
capm:{defaults:{rf:.03,rm:.09,beta:1.2},inputs:[['rf','无风险收益率 Rf（同一年度，小数）',-.1,.3,.001],['rm','市场预期收益 E(Rm)（年度，小数）',-.5,.8,.01],['beta','理论证券 β',-2,3,.1]],assumptions:'SML 为 CAPM 理论：同一年度的预期收益、无风险利率及市场风险溢价。假设均值方差投资者、同质预期、无摩擦等。另有60个月固定合成超额收益，使用含截距 OLS 估计样本 α/β，非真实市场拟合；月度截距不能直接称为年度超额收益。两张图分别以 β 与市场月度超额收益为横轴；样本回归不会随理论参数变化。',question:'市场预期收益9%、无风险利率3%不变，把理论 β 从1.2提高到1.8，CAPM预期收益怎样变化？',choices:['上升','下降','与 β 无关'],correct:0,exploreKey:'beta',start:1.2,target:1.8,answer:'市场风险溢价为正时，提高 β 会提高 CAPM 要求的预期收益。若溢价为零则不变，若为负则下降。样本回归的 β 来自数据，是另一个估计对象；理论交互不会改写样本回归结果。',teacher:'先读 SML 横轴 β 和年度预期收益纵轴，再看 SCL 的月度超额收益横纵轴。理论参数不影响固定样本 OLS；样本截距非零不等于已证实套利机会。'},
};
function build(id,p){if(id==='bs')return (typeof module==='object'?require('./bs-lesson.js'):BSLesson).build(p,'full');const q=({var:M.risk,bs:M.bs,garch:M.garch,capm:M.capm})[id](p);let blocks=[];
if(id==='var')blocks=[
B('01 · 固定分析口径',`# 合成情景，1个交易日，基础R，无需额外包\nn <- ${p.n}\nalpha <- ${p.alpha}\nN <- ${p.N}\nmu <- ${p.mu}\nscale <- ${p.scale}`,'设置同一日度口径、置信水平与名义本金。','L=-NR',`n=${p.n}，α=${pct(p.alpha)}，N=${f(p.N)} 元`,'改变置信水平改变报告门槛，不会改变损失样本。',['n','alpha','N','mu','scale']),
B('02 · 可复现合成收益',`i <- seq_len(n)\nR <- mu + scale * (((i * 73) %% 251 - 125) / 72 -\n  ifelse(i %% 37 == 0, 4, 0))`,'用固定整数规则构造普通波动与周期性负尾部。',String.raw`R_i=\mu+s z_i`,`前3个简单收益：${q.returns.slice(0,3).map(pct).join('，')}`,'这不是市场历史，也不是独立随机抽样。固定规则使网页与 R 得到同一数据。',['n','mu','scale']),
B('03 · 收益转为损失',`L <- -N * R\nx <- sort(L)`,'将收益转为货币损失并升序排列。','L_i=-NR_i',`首个收益 ${pct(q.returns[0])} → 损失 ${f(q.L[0])} 元`,'损失越大越坏；负损失代表盈利，不取绝对值。',['N'],'loss'),
B('04 · 历史 VaR',`hVaR <- unname(quantile(L, alpha, type = 1))`,'采用等权经验分布的左连续逆分位数：第 ceiling(nα) 个顺序统计量。',String.raw`VaR_\alpha=Q(\alpha)=L_{(\lceil n\alpha\rceil)}`,`序号 ${Math.ceil(p.n*p.alpha)}／${p.n}；VaR = ${f(q.hVaR)} 元`,'它是门槛，不告诉你超过门槛后会亏多少。',['alpha'],'hVaR'),
B('05 · 同一经验分布的 ES',`j <- seq_len(n)\ntail_mass <- pmax(0, pmin(j / n - alpha, 1 / n))\nhES <- sum(x * tail_mass) / (1 - alpha)`,'对每个分位区间与 (α,1] 的交集赋权，精确平均最坏 1−α 概率。',String.raw`ES_\alpha=\frac{1}{1-\alpha}\int_\alpha^1 Q(u)\,du`,`尾部质量 ${f(q.weights.reduce((a,b)=>a+b,0))}；等效 ${f(p.n*(1-p.alpha))} 个样本；ES = ${f(q.hES)} 元`,'不是直接 mean(L[L>=VaR])；有重复门槛或非整数尾部时那样会纳入过多概率。',['alpha'],'hES'),
B('06 · 拟合正态损失模型',`m <- mean(L)\ns <- sd(L)\nz <- qnorm(alpha)\nnVaR <- m + s * z\nnES <- m + s * dnorm(z) / (1 - alpha)`,'同一样本估计损失均值和样本标准差，再用正态尾部解析式。',String.raw`VaR^N=m+sz_\alpha,\quad ES^N=m+s\frac{\phi(z_\alpha)}{1-\alpha}`,`m=${f(q.m)} 元，s=${f(q.s)} 元，z=${f(q.z)}；VaR=${f(q.nVaR)}，ES=${f(q.nES)}`,'正态假设可能低估厚尾；两法差异来自分布假设，不能据此宣称任一种总更准确。',['alpha'],'normal'),
B('07 · 输出与可视化',`print(c(Historical_VaR=hVaR, Historical_ES=hES,\n  Normal_VaR=nVaR, Normal_ES=nES))\nhist(L, breaks=25, probability=TRUE, main="Synthetic 1-day loss", xlab="Loss")\ncurve(dnorm(x,m,s), add=TRUE, col="steelblue")\nabline(v=c(hVaR,hES,nVaR,nES), col=c(3,4,5,6), lty=2)`,'输出四个风险数值并标记货币损失轴。',String.raw`ES_\alpha\ge VaR_\alpha`,`历史 ES−VaR = ${f(q.hES-q.hVaR)} 元`,'网页柱为固定25箱的概率密度，绿色为精确分摊的历史尾部密度，蓝线为拟合正态密度；R hist自动选箱，风险计算完全相同。',[],'loss')];
if(id==='garch')blocks=[
B('01 · 平稳参数',`# 固定合成冲击；无估计、无需包\nomega <- ${p.omega}\nalpha <- ${p.a}\nbeta <- ${p.b}\nshock <- ${p.shock}\nstopifnot(omega>0,alpha>=0,beta>=0,alpha+beta<1)`, '约束参数，保证平稳模型的理论无条件方差有限。',String.raw`\alpha+\beta<1`,`α+β=${f(q.persistence)}`,'接近1代表随机GARCH模型下的高预期持久性，不是均值回复速度的直接百分比。',['omega','a','b','shock']),
B('02 · 初始条件与冲击',`n <- 160\nz <- sin(seq_len(n)*2.4)*0.85\nz[41] <- shock\nh <- epsilon <- numeric(n)\nh[1] <- omega/(1-alpha-beta)\nepsilon[1] <- sqrt(h[1])*z[1]`,'第41期设置一次大冲击，其他期为固定合成序列。',String.raw`\bar h=\frac{\omega}{1-\alpha-\beta}`,`理论长期方差=${f(q.long)}；标准差=${pct(Math.sqrt(q.long))}`,'固定冲击序列并非 iid 过程，路径平均方差无须等于理论长期方差。',['shock'],'vol'),
B('03 · 条件方差递推',`for(t in 2:n) {\n  h[t] <- omega+alpha*epsilon[t-1]^2+beta*h[t-1]\n  epsilon[t] <- sqrt(h[t])*z[t]\n}`, '先用前一期平方冲击和方差求 hₜ，再生成当期冲击。',String.raw`h_t=\omega+\alpha\epsilon_{t-1}^2+\beta h_{t-1}`,`h₄₁=${f(q.h[40])}；ε₄₁=${f(q.eps[40])}；h₄₂=${f(q.h[41])}`,'正负同幅冲击具有相同方差影响；该模型不包含杠杆效应。',['omega','a','b'],'vol'),
B('04 · 波动率与冲击',`print(c(long_variance=h[1],h41=h[41],h42=h[42]))\npar(mfrow=c(2,1))\nplot(sqrt(h)*100,type="l",ylab="Conditional volatility (%)",xlab="t")\nabline(v=42,lty=2)\nplot(epsilon*100,type="h",ylab="Synthetic shock (%)",xlab="t")\nabline(v=41,lty=2)`,'分图展示条件标准差和合成冲击，标明一阶滞后。',String.raw`\epsilon_t=\sqrt{h_t}z_t`,`第42期条件波动率=${pct(Math.sqrt(q.h[41]))}`,'方差和标准差单位不同；聚集示意来自递推，不能称为真实市场证据。',[],'vol')];
if(id==='capm')blocks=[
B('01 · 理论 CAPM 输入',`# 理论参数：相同年度，小数收益\nrf <- ${p.rf}\nrm <- ${p.rm}\nbeta <- ${p.beta}\nexpected <- rf+beta*(rm-rf)`,'同一年度口径计算证券要求的预期收益。',String.raw`E(R_i)=R_f+\beta_i[E(R_m)-R_f]`,`${pct(p.rf)} + ${f(p.beta)} × (${pct(p.rm)}−${pct(p.rf)}) = ${pct(q.expected)}`,'此处是理论定价关系，不是从样本预测已实现收益。',['rf','rm','beta'],'sml'),
B('02 · 证券市场线 SML',`betas <- seq(-2,3,length.out=101)\nplot(betas,rf+betas*(rm-rf),type="l",xlab="Beta",ylab="Annual expected return")\npoints(beta,expected,pch=19)`,'横轴为系统风险 β，纵轴为年度预期总收益。',String.raw`\text{SML slope}=E(R_m)-R_f`,`斜率=${pct(p.rm-p.rf)}，当前点 β=${f(p.beta)}`,'SML不是以市场实际收益为横轴的回归线。',['beta','rf','rm'],'sml'),
B('03 · 独立合成月度样本',`# 以下为固定60个月合成超额收益，与上述理论输入独立\ni <- seq_len(60)\nx <- 0.04*sin(i*1.7)\ny <- 0.001+1.2*x+0.012*cos(i*2.3)`,'构造市场与证券月度超额收益，便于重复计算。','y_t=0.001+1.2x_t+e_t',`n=60；首月市场超额收益=${pct(q.x[0])}，证券超额收益=${pct(q.y[0])}`,'生成系数1.2不必等于有限样本回归估计；误差可能与样本x相关。',[],'scl'),
B('04 · 样本 OLS 与证券特征线',`fit <- lm(y~x)\nprint(c(theoretical=expected,alpha_month=coef(fit)[1],beta_sample=coef(fit)[2]))\nplot(x,y,xlab="Monthly market excess return",ylab="Monthly security excess return")\nabline(fit,col="steelblue")`,'带截距 OLS 分解样本截距与斜率；横轴为市场月度超额收益。',String.raw`\hat\beta=\frac{\sum(x_t-\bar x)(y_t-\bar y)}{\sum(x_t-\bar x)^2},\quad\hat\alpha=\bar y-\hat\beta\bar x`,`α̂=${pct(q.a)}／月，β̂=${f(q.b)}`,'SCL用于样本收益关系；理论SML输入不会改变这组数据，月度截距不直接年化。',[],'scl')];
return{q,blocks,code:blocks.flatMap(b=>b.lines).join('\n')};}
return{configs,build,f,pct};});

;

/* Source: workbench-ui.js */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.WorkbenchUI=api;})(this,()=>{
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function format(kind,x){if(x===null||!Number.isFinite(x))return '—';const digits={money:2,percent:2,beta:3,correlation:3,greek:6,integer:0}[kind],v=kind==='percent'?x*100:x,threshold=digits===undefined?.0001:.5*10**(-digits),small=v!==0&&Math.abs(v)<threshold;const s=small?v.toExponential(kind==='variance'?4:2):digits===undefined?Number(v.toPrecision(5)).toString():v.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});return s+(kind==='percent'?'%':'');}

function ticks(lo,hi,count=4){if(lo===hi)hi=lo+1;const raw=(hi-lo)/count,base=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(x=>x*base).find(x=>x>=raw)||base*10;let values=[];for(let x=Math.ceil(lo/step)*step;x<=hi+step*1e-9;x+=step)values.push(Math.abs(x)<step*1e-8?0:x);return values;}
return{esc,format,ticks};});

;

/* Source: lesson-presentation.js */
/* Teaching presentation only. The financial engines remain unchanged. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-lessons.js'):root.ExperimentLessons);if(typeof module==='object')module.exports=api;else root.TeachingCode=api;})(this,L=>{
function wrap(line,limit=38){const result=[];let rest=line;while(rest.length>limit){let quote='',depth=0,last=-1;for(let i=0;i<Math.min(rest.length,limit);i++){const c=rest[i];if(quote){if(c===quote&&rest[i-1]!=='\\')quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if('([{'.includes(c))depth++;if(')]}'.includes(c))depth--;if((c===','&&depth>0)||c==='('||(['+','*','/','-','^'].includes(c)&&rest[i-1]!=='<'&&!/[eE]/.test(rest[i-1]||'')&&rest[i+1]!=='>'))last=i+1;}if(last<8)break;result.push(rest.slice(0,last));rest='  '+rest.slice(last).trimStart();}result.push(rest);return result;}
function entry(base,lines,title,links,mark){return{...base,title:title||base.title,lines:lines.split('\n').flatMap(x=>wrap(x)),links:links||[],mark:mark||''};}
function build(id,p,mode='basic'){if(id==='bs')return (typeof module==='object'?require('./bs-lesson.js'):BSLesson).build(p,mode);const full=L.build(id,p),q=full.q;let blocks=full.blocks.map(b=>({...b,lines:b.lines.flatMap(x=>wrap(x))}));let boundary=id==='bs'&&(p.T===0||p.sigma===0);if(boundary)mode='full';
// Split parameter definitions into independent teaching objects in both views.
let first=full.blocks[0],params=first.lines.filter(x=>/^[A-Za-z]+ <- /.test(x));const keymap={alpha:id==='garch'?'a':'alpha',beta:id==='garch'?'b':'beta'};const parameterBlocks=params.filter(x=>!x.startsWith('expected')).map(line=>{const key=keymap[line.split(' ')[0]]||line.split(' ')[0];return entry(first,line,'参数 · '+line.split(' <- ')[0],[key],id==='bs'&&['S','K'].includes(key)?key:id==='capm'?'sml':'');});
blocks.splice(0,1,entry(first,first.lines.filter(x=>x.startsWith('#')).join('\n'),'模型与口径'),...parameterBlocks);
if(id==='capm')blocks.splice(1+parameterBlocks.length,0,entry(first,'expected <- rf + beta * (rm - rf)','理论 CAPM · 预期收益',['rf','rm','beta'],'sml'));
if(id==='garch'&&mode==='full')blocks.splice(1+parameterBlocks.length,0,entry(first,'stopifnot(omega > 0, alpha >= 0,\n  beta >= 0, alpha + beta < 1)','参数约束与校验',['omega','a','b']));
// Make normal risk computations individually selectable.
if(id==='var'){let i=blocks.findIndex(b=>b.lines.some(x=>x.startsWith('m <-')));const source=full.blocks[5];blocks.splice(i,1,entry(source,'m <- mean(L)\ns <- sd(L)\nz <- qnorm(alpha)','正态模型样本估计',['alpha'],'normal'),entry(source,'nVaR <- m + s * z','正态 VaR',['alpha'],'nVaR'),entry(source,'nES <- m + s * dnorm(z) / (1 - alpha)','正态 ES',['alpha'],'nES'));}
if(id==='var'){
 const graph=blocks.at(-1);graph.lines=`print(c(Historical_VaR=hVaR, Historical_ES=hES,
  Normal_VaR=nVaR, Normal_ES=nES))
loss_wan <- L / 10000
hist(loss_wan,breaks=25,probability=TRUE,
  main="Synthetic loss",xlab="Loss (10,000 yuan)")
curve(dnorm(x,m/10000,s/10000),add=TRUE,
  col="thistle4")
abline(v=c(hVaR,hES,nVaR,nES)/10000,
  col=c(3,3,4,4),lty=c(1,2,1,2))`.split('\n').flatMap(x=>wrap(x));graph.action='将损失改用万元，密度同步乘以10000；面积及风险数值不变。';graph.formula=String.raw`Y=L/10000,\quad f_Y(y)=10000 f_L(10000y)`;graph.economic='R图和网页均以万元表示横轴，密度单位为1/万元；风险计算仍使用元。绿色尾部保留同一概率质量。';
}
if(id==='garch'&&mode==='basic')blocks=blocks.filter(b=>!b.lines.some(x=>x.includes('stopifnot')));
if(id==='garch'){const b=blocks.find(b=>b.lines.some(line=>line.includes('for(t')));if(b){const n=x=>Number(x.toPrecision(6)).toString();b.value=`h₄₂ = ${n(p.omega)} + ${n(p.a*q.eps[40]**2)} + ${n(p.b*q.h[40])} = ${n(q.h[41])}；ε₄₁ = ${n(q.eps[40])}`;}}
// Link text and parameters precisely, never a whole input card.
for(const b of blocks){if(id==='garch'&&b.title.startsWith('参数')){const k=b.links[0];b.formula={omega:String.raw`\omega>0`,a:String.raw`\alpha\varepsilon_{t-1}^2`,b:String.raw`\beta h_{t-1}`,shock:String.raw`\varepsilon_{41}=\sqrt{h_{41}}z_{41}`}[k]||b.formula;b.value={omega:`ω=${L.f(p.omega)}`,a:`α ε₄₁² = ${L.f(p.a*q.eps[40]**2)}`,b:`β h₄₁ = ${L.f(p.b*q.h[40])}`,shock:`z₄₁=${L.f(p.shock)}；ε₄₁=${L.f(q.eps[40])}`}[k];b.economic={omega:'每期加入的基础方差水平。',a:'上一期冲击平方越大，下一期方差贡献越大；α=0时无此影响。',b:'上一期已确定的条件方差通过β延续至下一期。',shock:'当期冲击先改变ε₄₁，随后进入h₄₂；不是影响已确定的h₄₁。'}[k];}}
if(mode==='full')for(const b of blocks)if(!b.title.startsWith('参数')&&!b.lines[0]?.startsWith('#'))b.lines.unshift('# '+b.title);
return{q,blocks,code:blocks.flatMap(b=>b.lines).join('\n'),mode,boundary};}
return{build,wrap};});

;

/* Source: financial-charts.js */
/* Responsive shared SVG charts. SVG units equal CSS pixels; no shrinking viewBox. */
(()=>{const {esc,format,ticks}=WorkbenchUI,M=ExperimentMath;const C={blue:'#6689a8',green:'#659b8a',purple:'#9b88ac',gray:'#91a2ae',ink:'#4d626f',grid:'#e2e8ec',accent:'#82769f'};let current,markers={},interaction=null,observer=null;
function frame(title,key){return `<section class="chart-frame" data-chart="${key}"><h3>${title}</h3><div class="svg-host"><svg role="group" aria-label="${title}"></svg></div></section>`;}
function paint(key,mode){const host=document.querySelector('#chartHost'),tooltip=document.querySelector('#chartTooltip'),item=markers[key];if(!tooltip)return;tooltip.hidden=!item;tooltip.dataset.mode=item?mode:'closed';if(!item){tooltip.replaceChildren();host.querySelectorAll('.focused-mark').forEach(el=>el.classList.remove('focused-mark'));return;}tooltip.innerHTML=(mode==='pinned'?'<button id="closeTooltip" aria-label="关闭图表详情">×</button>':'')+`<strong>${esc(item.title)}</strong><p>${item.body}</p>`;host.querySelectorAll('[data-marker]').forEach(el=>el.classList.toggle('focused-mark',el.dataset.marker===key));tooltip.querySelector('button')?.addEventListener('click',()=>interaction.clear());const target=[...host.querySelectorAll('[data-marker]')].find(el=>el.dataset.marker===key&&el.tagName.toLowerCase()==='circle');tooltip.style.top='10px';tooltip.style.bottom='auto';if(target){const a=target.getBoundingClientRect(),b=host.getBoundingClientRect();if(a.top-b.top<tooltip.offsetHeight+24){tooltip.style.top='auto';tooltip.style.bottom='10px';}}}
function hide(){interaction?.clear();}
function lineMarker(key,x,color,dash,opts={}){return{key,x,color,dash,...opts};}
function plot(svg,series,opts){const host=svg.parentElement,{width:W,height:H}=host.getBoundingClientRect(),projection=document.body.classList.contains('projector'),font=projection?15:12.5;if(W<50||H<50)return;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);const left=opts.left||68,right=20,top=12,bottom=54,pw=W-left-right,ph=H-top-bottom;const values=series.flatMap(s=>s.values).concat((opts.points||[]).map(v=>[v.x,v.y]));let xmin=opts.domain?.[0]??Math.min(...values.map(v=>v[0])),xmax=opts.domain?.[1]??Math.max(...values.map(v=>v[0])),ymin=opts.range?.[0]??Math.min(0,...values.map(v=>v[1])),ymax=opts.range?.[1]??Math.max(...values.map(v=>v[1]));if(ymin===ymax)ymax=ymin+1;if(xmin===xmax)xmax=xmin+1;if(!opts.range){const pad=(ymax-ymin)*.1;ymin-=pad;ymax+=pad;}const X=x=>left+(x-xmin)/(xmax-xmin)*pw,Y=y=>top+ph-(y-ymin)/(ymax-ymin)*ph;const tx=opts.xticks||ticks(xmin,xmax,W<420?3:4),ty=ticks(ymin,ymax,ph<150?3:4);const num=x=>Math.abs(x)>0&&Math.abs(x)<.001?x.toExponential(1):Math.abs(x)>=1e6?Number((x/1e6).toPrecision(3))+'m':Number(x.toPrecision(4)).toString();let content=`<style>text{font-size:${font}px}</style>`;const clip='clip-'+svg.closest('.chart-frame').dataset.chart;
content+=`<defs><clipPath id="${clip}"><rect x="${left-4}" y="${top-4}" width="${pw+8}" height="${ph+8}"/></clipPath></defs>`;
for(const y of ty)content+=`<path class="chart-grid" d="M${left} ${Y(y)}H${W-right}"/><text class="tick y-tick" x="${left-9}" y="${Y(y)+font/3}" text-anchor="end">${esc(num(y))}</text>`;
for(const x of tx)content+=`<text class="tick x-tick" x="${X(x)}" y="${H-bottom+23}" text-anchor="middle">${esc(opts.integer?String(Math.round(x)):num(x))}</text>`;
content+=`<text class="axis-caption" x="${W-right}" y="${H-6}" text-anchor="end">${esc(opts.xlabel)}</text>`;
content+=`<g clip-path="url(#${clip})">`;if(opts.area)content+=opts.area(X,Y);
for(const s of series)content+=`<path data-series="${s.key}" ${markers[s.key]?`data-marker="${s.key}" role="button" tabindex="0" aria-label="${esc(markers[s.key].title)}"`:""} class="data-line ${(current.active===s.key||(current.active==='price'&&['call','put'].includes(s.key)))?'is-linked':''}" d="${s.values.map((v,i)=>(i?'L':'M')+X(v[0])+','+Y(v[1])).join(' ')}" stroke="${s.color}"/>`;
for(const m of opts.markers||[]){const names=m.keys||[m.key];content+=`<g class="reference-marker ${names.includes(current.active)?'is-linked':''}" data-marker="${m.key}" role="button" tabindex="0" aria-label="${esc(markers[m.key].title)}" aria-describedby="chartTooltip"><path class="marker-hit" d="M${X(m.x)} ${top}V${H-bottom}"/><path class="marker-line" d="M${X(m.x)} ${top}V${H-bottom}" stroke="${m.color}" stroke-dasharray="${m.dash||''}"/>${m.second?`<path class="marker-line" d="M${X(m.x)} ${top}V${H-bottom}" stroke="${m.second}" stroke-dasharray="2 8"/>`:''}</g>`;}
for(const v of opts.points||[])content+=`<circle cx="${X(v.x)}" cy="${Y(v.y)}" r="${v.key?5:3}" fill="${v.color}" class="${v.key?'interactive-point':''} ${v.color==='transparent'?'ghost-point':''}" ${v.key?`data-marker="${v.key}" role="button" tabindex="0" aria-label="${esc(markers[v.key].title)}"`:''}/>`;content+='</g>';svg.innerHTML=content;svg.dataset.xmin=xmin;svg.dataset.xmax=xmax;svg.dataset.ymin=ymin;svg.dataset.ymax=ymax;svg.dataset.plotHeight=ph;svg.dataset.plotWidth=pw;
}
function bind(){const host=document.querySelector('#chartHost');host.querySelectorAll('[data-marker]').forEach(el=>interaction.bind(el,el.dataset.marker,current.id==='garch'?()=>current.select('recursion'):null));}
function draw(){if(!current)return;markers={};const {id,p,q}=current,host=document.querySelector('#chartHost');if(id==='var'){
const losses=q.sorted.map(x=>x/10000),vals=[q.hVaR,q.hES,q.nVaR,q.nES].map(x=>x/10000);let lo=Math.min(...losses,...vals),hi=Math.max(...losses,...vals);const pad=(hi-lo)*.08;lo-=pad;hi+=pad;const bw=(hi-lo)/25,bins=Array(25).fill(0),tails=Array(25).fill(0);losses.forEach((x,i)=>{const j=Math.min(24,Math.max(0,Math.floor((x-lo)/bw)));bins[j]+=1/p.n/bw;tails[j]+=q.weights[i]/bw;});
markers.tail={title:'历史最坏尾部概率质量',body:`置信水平 ${format('percent',p.alpha)}<br>尾部质量 ${format('percent',1-p.alpha)}<br>分位数积分采用部分样本权重；历史 ES = ${format('money',q.hES)} 元。`};const normal=Array.from({length:181},(_,i)=>{const x=lo+(hi-lo)*i/180;return[x,10000*M.phi((10000*x-q.m)/q.s)/q.s];}),names=['历史 VaR','历史 ES','正态 VaR','正态 ES'];['hVaR','hES','nVaR','nES'].forEach((key,i)=>markers[key]={title:names[i],body:`${i<2?'历史模拟法':'正态参数法'} · 置信水平 ${format('percent',p.alpha)}<br><b>${format('money',q[key])} 元</b><br>损失变量 L = −NR，持有期1交易日`});
plot(host.querySelector('svg'),[{key:'normal',values:normal,color:C.purple}],{xlabel:'损失 L（万元）',domain:[lo,hi],range:[0,Math.max(...bins,...normal.map(v=>v[1]))*1.12],markers:[lineMarker('hVaR',vals[0],C.green,''),lineMarker('hES',vals[1],C.green,'6 4'),lineMarker('nVaR',vals[2],C.purple,''),lineMarker('nES',vals[3],C.purple,'6 4')],area:(X,Y)=>bins.map((v,j)=>`<rect class="density-bin" x="${X(lo+j*bw)+.5}" y="${Y(v)}" width="${Math.max(0,X(lo+bw)-X(lo)-1)}" height="${Y(0)-Y(v)}" fill="#dce5e9"/><rect class="tail-bin" data-marker="tail" role="button" tabindex="0" aria-label="历史最坏尾部概率质量" data-mass="${tails[j]*bw}" x="${X(lo+j*bw)+.5}" y="${Y(tails[j])}" width="${Math.max(0,X(lo+bw)-X(lo)-1)}" height="${Y(0)-Y(tails[j])}" fill="${C.green}" opacity=".75"/>`).join('')});host.dataset.tailMass=tails.reduce((s,v)=>s+v*bw,0);host.dataset.densityArea=bins.reduce((s,v)=>s+v*bw,0);
}else if(id==='bs'){
const lo=Math.max(.01,Math.min(p.S,p.K)*.4),hi=Math.min(100000,Math.max(p.S,p.K)*1.6),xs=Array.from({length:151},(_,i)=>lo+(hi-lo)*i/150),ys=xs.map(S=>M.bs({...p,S}));for(const key of ['S','K','SK'])markers[key]={title:key==='SK'?'现价 S 与执行价 K 重合':key==='S'?'当前股价 S':'执行价格 K',body:`S = ${format('money',p.S)} 元／股<br>K = ${format('money',p.K)} 元／股<br>Call = ${format('money',q.C)} 元<br>Put = ${format('money',q.P)} 元`};for(const [key,name,value]of [['call','Call 看涨期权',q.C],['put','Put 看跌期权',q.P]])markers[key]={title:name+' · 价格随 S 的曲线',body:`保持 K、T、r、σ、q 不变。<br>当前 S = ${format('money',p.S)} 元／股<br>当前理论价格 = ${format('money',value)} 元／股<br>欧式、连续股息 q=${format('percent',p.q)}；不是市场报价。`};const equal=p.S===p.K,refs=equal?[lineMarker('SK',p.S,C.purple,'6 4',{keys:['S','K'],second:C.blue})]:[lineMarker('S',p.S,C.purple,'6 4'),lineMarker('K',p.K,C.blue,'8 3 2 3')];
plot(host.querySelector('svg'),[{key:'call',values:xs.map((x,i)=>[x,ys[i].C]),color:C.blue},{key:'put',values:xs.map((x,i)=>[x,ys[i].P]),color:C.green}],{xlabel:'标的现价 S（元／股）',domain:[lo,hi],markers:refs,points:[{x:p.S,y:q.C,color:C.blue,key:'call'},{x:p.S,y:q.P,color:C.green,key:'put'}]});
}else if(id==='garch'){
const transmission=`h₄₂ = ${format('variance',p.omega)} + ${format('variance',p.a*q.eps[40]**2)} + ${format('variance',p.b*q.h[40])}<br>= ${format('variance',q.h[41])}<br>σ₄₂ = ${format('percent',Math.sqrt(q.h[41]))}`;markers.shock={title:'第41期冲击 ε₄₁ → 第42期方差 h₄₂',body:`ε₄₁ = ${format('percent',q.eps[40])}<br>${transmission}`};markers.response={title:'第42期条件波动率',body:transmission};q.h.forEach((v,i)=>markers['vol-'+i]={title:`第${i+1}期条件波动率`,body:`hₜ = ${format('variance',v)}<br>σₜ = ${format('percent',Math.sqrt(v))}<br>固定合成冲击的递推结果。`});const domain=[1,160],xticks=[1,40,80,120,160];plot(host.querySelector('[data-chart="vol"] svg'),[{key:'recursion',values:q.h.map((v,i)=>[i+1,100*Math.sqrt(v)]),color:C.blue}],{xlabel:'期数 t',domain,xticks,integer:true,left:72,markers:[lineMarker('response',42,C.purple,'5 4',{keys:['recursion','response']})],points:q.h.map((v,i)=>({x:i+1,y:100*Math.sqrt(v),color:i===41?C.purple:'transparent',key:i===41?'response':'vol-'+i})).filter((v,i)=>i%20===0||i===41||i===159)});plot(host.querySelector('[data-chart="shock"] svg'),[{key:'shock',values:q.eps.map((v,i)=>[i+1,100*v]),color:C.green}],{xlabel:'期数 t',domain,xticks,integer:true,left:72,markers:[lineMarker('shock',41,C.purple,'5 4',{keys:['recursion','shock']})],points:[{x:41,y:100*q.eps[40],color:C.purple,key:'shock'}]});
}else{
markers.scl={title:'SCL · 样本回归线',body:`月度超额收益 y = α̂ + β̂x<br>α̂ = ${format('percent',q.a)}／月，β̂ = ${format('beta',q.b)}<br>固定60个月合成数据；与理论 SML 区分。`};q.x.forEach((x,i)=>markers['obs-'+i]={title:`合成样本 · 第${i+1}月`,body:`市场月度超额收益 = ${format('percent',x)}<br>资产月度超额收益 = ${format('percent',q.y[i])}<br>回归预测 = ${format('percent',q.a+q.b*x)}<br>合成教学数据，不是市场观测。`});markers.sml={title:'SML · 理论预期收益',body:`理论 β = ${format('beta',p.beta)}<br>年度 E(Rᵢ) = ${format('percent',q.expected)}<br>固定年度风险溢价 ${format('percent',p.rm-p.rf)}`};plot(host.querySelector('[data-chart="sml"] svg'),[{key:'sml',values:[[-2,100*(p.rf-2*(p.rm-p.rf))],[3,100*(p.rf+3*(p.rm-p.rf))]],color:C.blue}],{xlabel:'系统风险 β（理论）',domain:[-2.15,3.15],points:[{x:p.beta,y:100*q.expected,color:C.purple,key:'sml'}]});plot(host.querySelector('[data-chart="scl"] svg'),[{key:'scl',values:[[-4.3,100*(q.a-q.b*.043)],[4.3,100*(q.a+q.b*.043)]],color:C.green}],{xlabel:'市场月度超额收益（%）',domain:[-4.5,4.5],points:q.x.map((x,i)=>({x:100*x,y:100*q.y[i],color:C.purple,key:'obs-'+i}))});}
bind();document.querySelectorAll('[data-tip]').forEach(b=>interaction.bind(b,b.dataset.tip));interaction.redraw(key=>!!markers[key]);}
function render(id,p,q,active,select){const host=document.querySelector('#chartHost');if(host.dataset.model!==id){host.dataset.model=id;host.className='chart-host '+(['garch','capm'].includes(id)?'dual-chart '+id:'single-chart');interaction?.destroy();observer?.disconnect();host.innerHTML=(id==='garch'?frame('条件波动率 √hₜ（%） · 第42期响应','vol')+frame('合成冲击 εₜ（%） · 第41期冲击','shock'):id==='capm'?frame('SML · 理论年度预期收益（%）','sml')+frame('SCL · 合成月度资产超额收益（%）','scl'):frame(id==='var'?'损失概率密度（1／万元）':'期权理论价格（元／股）','main'))+'<div id="chartTooltip" class="chart-tooltip" role="status" hidden></div>';interaction=ChartInteraction.create(paint);host.onpointerleave=()=>{const key=interaction.state.hoveredItem;if(key)interaction.leave(key);};host.onclick=e=>{if(!e.target.closest('[data-marker],#chartTooltip'))hide();};observer=new ResizeObserver(()=>draw());observer.observe(host);}if(current&&JSON.stringify(current.p)!==JSON.stringify(p))hide();current={id,p:{...p},q,active,select};requestAnimationFrame(draw);}
window.FinancialCharts={render,draw,hide};})();

;

/* Source: iv-workbench.js */
/* Dedicated module inside the existing three-column workbench. */
window.IVWorkbench=(()=>{
const $=s=>document.querySelector(s),esc=WorkbenchUI.esc,F=x=>x===null||x===undefined?'—':Number(x).toPrecision(9),pct=x=>x==null?'—':F(x*100)+'%';
const defaults={S:100,K:100,T:1,r:.05,q:0,type:'C',target:ExperimentMath.bs({S:100,K:100,T:1,r:.05,q:0,sigma:.2}).C,tol:1e-8,maxIter:100,initial:.3};
let p={...defaults},method='bisection',step=0,results,active=false,timer=null,phase='idle',choice=null,logic='iteration',valid=true;
function stop(){if(timer!==null)clearInterval(timer);timer=null;const b=$('#ivPlay');if(b)b.textContent='播放';}
function mount(){if($('#ivModel'))return;
 const model=document.createElement('section');model.id='ivModel';model.className='iv-only';$('.model-panel').append(model);
 const params=document.createElement('section');params.id='ivParams';params.className='iv-only';$('.parameters').append(params);
 const code=document.createElement('section');code.id='ivCodePane';code.className='iv-only';$('.code-panel').append(code);
 params.innerHTML=`<p>已知<strong>假设报价</strong>，反推含连续股息的欧式 IV。q∈[0,1]，沿用第一轮教学域。</p><div id="ivFields">${[['S','标的价格 S',.01,1e5],['K','执行价 K',.01,1e5],['T','期限 T（年）',0,10],['r','无风险利率 r',-.1,.3],['q','连续股息 q',0,1],['target','假设报价（元）',0,1e5],['initial','Newton 初值 σ（小数）',1e-9,1e6],['tol','价格误差容差（元）',1e-12,.01],['maxIter','最大迭代次数',1,200]].map(([k,t,min,max])=>`<label data-iv-field="${k}">${t}<input id="iv-${k}" type="number" step="${k==='maxIter'?1:'any'}" min="${min}" max="${max}" value="${p[k]}"></label>`).join('')}<label>期权类型<select id="iv-type"><option value="C">Call 看涨</option><option value="P">Put 看跌</option></select></label></div><p id="ivValidation" role="status"></p><button id="ivDefault">重置默认案例</button><button id="ivExplore">开始预测探索</button><section id="ivLearning" hidden></section><p class="chart-note">价格容差决定定价误差，不保证平坦价格区域中 σ 的相同精度。纯 Newton 失败不会自动改用二分法。动态 Delta 对冲已在第四教学模块上线。</p>`;
 params.addEventListener('input',()=>{stop();phase='idle';choice=null;read();compute();});
 $('#ivDefault').onclick=()=>{stop();p={...defaults};phase='idle';choice=null;write();compute();};
 $('#ivExplore').onclick=()=>{stop();p={...defaults};write();phase='predict';choice=null;step=0;render();};
 model.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ivMethod){stop();method=b.dataset.ivMethod;step=0;render();}else if(b.dataset.ivStep!==undefined){stop();step=+b.dataset.ivStep;render();}else if(b.id==='ivPrev'||b.id==='ivNext'){stop();step+=b.id==='ivNext'?1:-1;render();}else if(b.id==='ivReset'){stop();step=0;render();}else if(b.id==='ivPlay'){if(timer){stop();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('#ivMotion').textContent='已启用减少动态偏好，请手动逐步观察。';return;}timer=setInterval(()=>{if(!active||step>=results[method].rows.length-1){stop();return;}step++;render();},900);b.textContent='暂停';}});
 code.addEventListener('click',e=>{const b=e.target.closest('[data-iv-logic]');if(b){logic=b.dataset.ivLogic;renderCode();renderChart();}});
 params.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.ivChoice){choice=b.dataset.ivChoice;renderLearning();}if(b.id==='ivConfirm'&&choice){phase='observe';compute();}if(b.id==='ivExplain'){phase='explain';render();}if(b.id==='ivExit'){phase='idle';compute();}});
 $('#copy').addEventListener('click',async e=>{if(!active)return;e.stopImmediatePropagation();if(!valid||phase==='predict')return;const source=IVCode.script(p);try{await navigator.clipboard.writeText(source);$('#codeNotice').textContent='已复制；请在 RStudio 整段运行';}catch{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([source],{type:'text/plain'}));a.href=url;a.download='implied-volatility.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}},true);
 $('#rStudioPractice').addEventListener('click',e=>{if(!active)return;e.stopImmediatePropagation();$('#infoTitle').textContent='IV · 在 RStudio 实践';$('#infoBody').textContent='复制左栏脚本，在 RStudio 新建 R Script 并整段运行。基础 R 即可；网页不执行 R。results 包含两个算法的状态、数值与逐步 rows。比较报价误差和原始 Vega；再尝试 Put、q>0 与极小初值。';ModalUI.open($('#infoDialog'));},true);
 window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('resize',()=>{if(active&&phase!=='predict')renderChart();});
}
function read(){valid=true;for(const k of Object.keys(defaults)){if(k==='type')p[k]=$('#iv-type').value;else{const el=$('#iv-'+k);p[k]=el.value.trim()===''?NaN:Number(el.value);if(!el.checkValidity()||!Number.isFinite(p[k]))valid=false;}}}
function write(){for(const[k,v]of Object.entries(p))$('#iv-'+k).value=v;valid=true;}
function compute(){stop();step=0;results={bisection:IVMath.solve(p,'bisection'),newton:IVMath.solve(p,'newton')};if(['invalid_parameters','invalid_settings'].includes(results.bisection.status))valid=false;render();}
function render(){if(!active)return;$('#copy').disabled=!valid||phase==='predict';$('#codeNotice').textContent='基础 R · 两算法完整轨迹 · 网页不执行 R';$('#ivValidation').textContent=valid?'输入改变即清除旧轨迹并重新计算。':'输入无效：请修正标红范围内的有限数值，旧轨迹已清除。';for(const el of document.querySelectorAll('#ivFields input,#ivFields select'))el.disabled=phase!=='idle';
 $('#ivDefault').disabled=phase!=='idle';$('#ivExplore').hidden=phase!=='idle';renderLearning();
 if(phase==='predict'){ $('#ivModel').innerHTML='<p class="iv-prompt">先提交预测，再查看迭代轨迹和两法结果。</p>';$('#ivCodePane').innerHTML='<p>预测阶段暂不显示求解结果和代码。</p>';return;}
 const r=results[method];step=Math.max(0,Math.min(step,r.rows.length-1));
 $('#ivModel').innerHTML=`<div class="iv-methods"><button data-iv-method="bisection" aria-pressed="${method==='bisection'}">二分法</button><button data-iv-method="newton" aria-pressed="${method==='newton'}">纯 Newton</button></div><div id="ivChart"></div><div class="iv-controls"><button id="ivPrev" ${step<=0?'disabled':''}>上一步</button><span>${r.rows.length?step+1:0} / ${r.rows.length}</span><button id="ivNext" ${step>=r.rows.length-1?'disabled':''}>下一步</button><button id="ivPlay" ${r.rows.length<2?'disabled':''}>${timer?'暂停':'播放'}</button><button id="ivReset">重置轨迹</button></div><p id="ivMotion" role="status"></p><div id="ivCurrent" aria-live="polite"></div><div class="iv-steps" aria-label="选择迭代步骤">${r.rows.map((row,i)=>`<button data-iv-step="${i}" aria-pressed="${step===i}">${i+1}</button>`).join('')}</div>${phase==='observe'?'<p>先逐步观察；到达末步才能查看比较与解释。</p>':`<div class="iv-comparison"><table><thead><tr><th>算法</th><th>IV / 当前估计</th><th>次数</th><th>价格误差</th></tr></thead><tbody>${Object.values(results).map(v=>`<tr><th>${v.method==='newton'?'纯 Newton':'二分法'}</th><td>${pct(v.sigma)}${v.converged?'':'（未收敛）'}</td><td>${v.iterations}</td><td>${F(v.error)}</td></tr><tr><td colspan="4">${esc(IVMath.reasons[v.status])}${v.method==='bisection'?`；区间扩展 ${v.expansions} 次`:''}</td></tr>`).join('')}</tbody></table></div>`}<p class="chart-note">无套利界：[${F(r.lower)}, ${F(r.upper)}) 元；上界仅为 σ→∞ 极限。报价与模型理论价格分开显示。</p>`;
 const row=r.rows[step];$('#ivCurrent').textContent=row?`第 ${step+1} 步：σ=${pct(row.sigma)}；理论价格=${F(row.theoreticalPrice)}；假设报价=${F(p.target)}；有符号误差=${F(row.signedError)}。${row.stop?IVMath.reasons[row.stop]:''}`:IVMath.reasons[r.status];renderChart();renderCode();renderLearning();
}
function renderLearning(){const box=$('#ivLearning');box.hidden=phase==='idle';if(phase==='idle'){box.innerHTML='';return;}box.innerHTML=phase==='predict'?`<h3>1 · 预测</h3><p>固定默认案例、Newton 初值30%、价格容差10⁻⁸。你预测哪种方法达到容差所需步数更少？这不代表所有初值的表现。</p>${[['newton','Newton 更少'],['bisection','二分法更少'],['same','相同']].map(([v,t])=>`<button data-iv-choice="${v}" aria-pressed="${choice===v}">${t}</button>`).join('')}<button id="ivConfirm" ${!choice?'disabled':''}>提交预测，观察迭代</button><button id="ivExit">退出探索</button>`:phase==='observe'?`<h3>2 · 迭代观察</h3><p>使用上一步、下一步或点击步骤，观察区间与切线。</p><button id="ivExplain" ${step<results[method].rows.length-1?'disabled':''}>查看解释</button><button id="ivExit">退出探索</button>`:`<h3>3 · 解释</h3><p>${choice==='newton'?'本次预测正确。':'本次预测需修正。'}默认案例 Newton 使用 ${results.newton.iterations} 步，二分法 ${results.bisection.iterations} 步。Newton 利用局部斜率，初值接近且 Vega 充分时通常更快；低 Vega 或越界会失败。二分法依赖连续单调价格和有效包围区间，速度较慢但更稳健。两法均为纯算法，无回退。</p><button id="ivExit">退出并重新试验</button>`;}
function renderCode(){if(!active||phase==='predict')return;const row=results[method].rows[step];const lines=IVCode.script(p).split('\n');$('#ivCodePane').innerHTML=`<div class="iv-code-scroll">${lines.map((line,i)=>{const key=line.includes('sigma-error/vega')||line.includes('sigma <- next_sigma')?'newton':line.includes('a+(b-a)/2')||line.includes('next_a <-')?'bisection':line.includes('d1 <-')||line.includes('d2 <-')||line.includes('price <- if')?'price':line.includes('error <-')||line.includes('abs(error)')?'error':'parameters';return `<button class="code-line ${logic===key?'selected':''}" data-iv-logic="${key}"><span class="num">${i+1}</span><code>${esc(line)||' '}</code></button>`;}).join('')}</div><section class="iv-explanation"><h3>${{parameters:'当前假设与输入',price:'含股息的同源 BS 定价',newton:'Newton：误差除以原始 Vega',bisection:'二分法：保留异号子区间',error:'价格残差与停止条件',iteration:'点击 R 语句与迭代步骤查看代入'}[logic]}</h3><div id="ivFormula"></div><p>${row?(method==='newton'?`σ下一步 = ${F(row.sigma)} − (${F(row.theoreticalPrice)} − ${F(p.target)}) / ${F(row.vega)} = ${F(row.nextSigma)}。Vega 单位：元／1.0 波动率。`:`[a,b] = [${F(row.a)}, ${F(row.b)}]；中点 = ${F(row.sigma)}；f = ${F(row.signedError)}；下一包围区间 [${F(row.nextA)}, ${F(row.nextB)}]。`):esc(IVMath.reasons[results[method].status])}</p><p>停止：|BS(σ) − 假设报价| ≤ ${F(p.tol)} 元；若失败，表中仅显示最后估计。</p></section>`;
 if(logic==='price'&&row){const v=ExperimentMath.bs({...p,sigma:row.sigma},true);const note=document.createElement('p');note.textContent=`当前 S=${F(p.S)}, K=${F(p.K)}, T=${F(p.T)}, r=${F(p.r)}, q=${F(p.q)}；d₁=${F(v.d1)}, d₂=${F(v.d2)}；${p.type==='C'?'Call':'Put'}=${F(v[p.type])} 元。`;$('.iv-explanation').append(note);}
 katex.render(logic==='price'?'d_1=\\frac{\\ln(S/K)+(r-q+\\sigma^2/2)T}{\\sigma\\sqrt T},\\quad d_2=d_1-\\sigma\\sqrt T':method==='newton'?'\\sigma_{n+1}=\\sigma_n-\\frac{BS(\\sigma_n)-P_{quote}}{Se^{-qT}\\phi(d_1)\\sqrt T}':'m=(a+b)/2,\\quad f(m)=BS(m)-P_{quote}',$('#ivFormula'),{throwOnError:false});
 document.querySelectorAll('[data-iv-field]').forEach(el=>el.classList.toggle('linked',logic==='parameters'||logic==='price'||(logic==='error'&&['target','tol'].includes(el.dataset.ivField))||(logic==='newton'&&el.dataset.ivField==='initial')));
}
function renderChart(){const host=$('#ivChart');if(!host)return;const r=results[method],row=r.rows[step];if(!valid||r.lower===null){host.innerHTML='<p>'+esc(IVMath.reasons[r.status]||'请修正输入后查看曲线。')+'</p>';return;}const seen=r.rows.slice(0,step+1);let extent=Math.max(.4,...seen.map(x=>x.sigma),...seen.filter(x=>x.b!==null).map(x=>x.b));if(row?.nextSigma>0&&row.nextSigma<=1e6)extent=Math.max(extent,row.nextSigma);extent=Math.min(1e6,extent*1.08);
 // Log sigma axis for extreme Newton jumps; every visible search point stays in range.
 const logarithmic=extent>4,tx=s=>logarithmic?Math.log1p(s/.01)/Math.log1p(extent/.01):s/extent;
 const W=500,H=300,L=65,R=20,top=18,bottom=48,curve=Array.from({length:161},(_,i)=>{const s=logarithmic?.01*Math.expm1(i/160*Math.log1p(extent/.01)):extent*i/160;return[s,ExperimentMath.bs({...p,sigma:s},true)[p.type]];});
 const ymax=Math.max(p.target,...curve.map(v=>v[1]),1)*1.12,x=s=>L+tx(s)*(W-L-R),y=v=>H-bottom-v/ymax*(H-top-bottom),line=(x1,y1,x2,y2,cls)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="波动率与理论价格，${method==='newton'?'当前切线':'当前包围区间'}"><defs><clipPath id="ivClip"><rect x="${L}" y="${top}" width="${W-L-R}" height="${H-top-bottom}"/></clipPath></defs>`;
 for(let i=0;i<=4;i++){const v=ymax*i/4;svg+=line(L,y(v),W-R,y(v),'iv-grid')+`<text x="${L-6}" y="${y(v)+4}" text-anchor="end">${v.toFixed(2)}</text>`;const s=logarithmic?.01*Math.expm1(i/4*Math.log1p(extent/.01)):extent*i/4;svg+=`<text x="${x(s)}" y="${H-bottom+20}" text-anchor="middle">${(s*100).toFixed(s<1?1:0)}%</text>`;}
 svg+=`<text x="${L}" y="12">BS 理论价格（元）</text><text x="${W/2}" y="${H-5}" text-anchor="middle">σ（%）${logarithmic?' · log(1+σ/0.01) 刻度':''}</text><g clip-path="url(#ivClip)">`;
 if(row?.a!==null&&row?.a!==undefined)svg+=`<rect class="iv-bracket" x="${x(row.a)}" y="${top}" width="${x(row.b)-x(row.a)}" height="${H-top-bottom}"/>`;
 svg+=`<path class="iv-curve" d="${curve.map(([s,v],i)=>(i?'L':'M')+x(s)+','+y(v)).join(' ')}"/>`+line(L,y(p.target),W-R,y(p.target),'iv-quote');
 if(row&&method==='newton'&&row.vega>0){const lo=Math.max(0,Math.min(row.sigma,row.nextSigma??row.sigma)),hi=Math.min(extent,Math.max(row.sigma,row.nextSigma??row.sigma));svg+=line(x(lo),y(row.theoreticalPrice+row.vega*(lo-row.sigma)),x(hi),y(row.theoreticalPrice+row.vega*(hi-row.sigma)),'iv-tangent');if(row.nextSigma>=0&&row.nextSigma<=extent)svg+=`<circle class="iv-intercept" cx="${x(row.nextSigma)}" cy="${y(p.target)}" r="5"/>`;}
 svg+=seen.map((v,i)=>`<circle class="iv-point ${i===step?'current':''}" cx="${x(v.sigma)}" cy="${y(v.theoreticalPrice)}" r="${i===step?6:3}"/>`).join('')+'</g></svg>';
 host.innerHTML=svg+`<p class="chart-note">蓝线：BS 价格 · 虚线：假设报价 ${F(p.target)} 元 · ${method==='newton'?'紫线：当前切线；空心点：下一报价交点':'淡绿色：当前 [a,b] 区间'}${logic==='price'?' · 已关联 R 定价语句':''}</p>`;
}
function activate(on){mount();stop();active=on;document.body.classList.toggle('iv-active',on);if(on){phase='idle';compute();}}
return{activate,stop};})();

;

/* Source: hedge-workbench.js */
/* Scoped fourth BS module; uses the shared chart state machine and R syntax. */
window.HedgeWorkbench=(()=>{'use strict';
const $=s=>document.querySelector(s),esc=WorkbenchUI.esc,H=HedgeMath,F=x=>x===null||x===undefined?'—':Number(x).toFixed(6),names={none:'不对冲',static:'静态 Delta',dynamic:'动态 Delta'},colors={none:'#a98773',static:'#6689a8',dynamic:'#659b8a'};
let p={...H.defaults},sim=null,error='',active=false,step=0,timer=null,tab='initial',view='path',strategy='dynamic',mode='full',logic='initial',phase='predict',choice=null,adjusted=false,origin=null,interaction=null;
const lessons={parameters:['参数与单位','一份教学期权对应一单位标的；卖出期权，股票持仓 h 的单位也是标的单位。',String.raw`\Pi=hS+B-V`],validation:['数据验证','超出教学域或确定性折点时停止模拟；不会截断路径或补造 Delta。',String.raw`S>0,\quad T>0`],path:['同一路径与三种策略','风险中性 GBM 用于教学模拟；同种子复现同一路径，改变调仓间隔不会改变股价。',String.raw`S_{i+1}=S_i e^{(r-q-\sigma^2/2)\Delta t+\sigma\sqrt{\Delta t}Z_i}`],delta:['期权 Delta 与卖方风险','卖出一份期权的 Delta 为 −Δ；持有 h=Δ 单位股票时，一阶风险 h−Δ=0。',String.raw`\Delta_C=e^{-q\tau}\Phi(d_1),\quad\Delta_P=e^{-q\tau}(\Phi(d_1)-1)`],time:['剩余期限','每一期以剩余期限重新定价；到期直接使用支付函数，Delta 显示为未定义。',String.raw`\tau_i=T(N-i)/N`],initial:['初始自融资账户','先收到权利金 V₀，用现金买入股票；负余额代表按 r 借款。初始净价值约为0。',String.raw`B_0=V_0-h_0S_0,\quad\Pi_0=0`],interest:['现金利息','上一期现金按连续复利计息；负现金产生利息支出。',String.raw`I_i=B_{i-1}(e^{r\Delta t}-1)`],dividend:['股息现金流','采用左端点矩形近似：期初持仓×期初股价×q×Δt，期末入账；空头为负，不额外计期内利息。',String.raw`D_i\approx h_{i-1}qS_{i-1}\Delta t`],trade:['调仓与自融资','动态策略在约定时点调整到新 Delta；买入现金流为负，卖出为正。没有外部补钱。',String.raw`B_i=B_i^{before}-(h_i-h_{i-1})S_i`],net:['组合净价值','股票市值加现金，减去卖出期权负债；到期负债使用真实支付。误差正负都可能出现。',String.raw`\Pi_i=h_iS_i+B_i-V_i`],settle:['到期清算','终点表格为清算前账户。卖出剩余股票并支付期权后，剩余现金等于终值误差。',String.raw`E=h_NS_N+B_N-\operatorname{payoff}(S_N)`],plot:['策略比较','同一条路径比较三种策略；动态对冲未必在每条路径上表现最好，更频繁调仓也不保证单条路径误差单调改善。',String.raw`E=\Pi_T`]};
function stop(){if(timer!==null)clearInterval(timer);timer=null;const b=$('#hPlay');if(b)b.textContent='播放';}
function clearTip(){interaction?.clear();}
function mount(){if($('#hModel'))return;
 for(const[id,parent]of [['hModel','.model-panel'],['hParams','.parameters'],['hCodePane','.code-panel']]){const el=document.createElement('section');el.id=id;el.className='hedge-only';$(parent).append(el);}
 $('#hParams').innerHTML=`<p>卖出<strong>一份教学期权＝一单位标的</strong>。风险中性模拟，非市场预测。</p><div id="hFields">${[['S','初始股价 S₀',.01,1e5],['K','执行价 K',.01,1e5],['T','期限 T（年）',0,10],['r','无风险利率 r',-.1,.3],['q','连续股息 q',0,1],['sigma','波动率 σ（小数）',0,2],['N','路径时间步数 N',1,504],['interval','每隔几步调仓',1,504],['seed','随机种子',0,2147483646]].map(([k,label,min,max])=>`<label data-h-field="${k}">${label}<input id="h-${k}" type="number" min="${min}" max="${max}" step="${['N','interval','seed'].includes(k)?1:'any'}" value="${p[k]}"></label>`).join('')}<label>期权类型<select id="h-type"><option value="C">Call 看涨</option><option value="P">Put 看跌</option></select></label></div><p id="hValidation" role="status"></p><button id="hDefault">默认案例</button><p id="hSchedule"></p><details id="hAssumptions"><summary>模型假设与股息近似</summary><p>欧式期权、Black-Scholes、恒定连续股息、无风险借贷利率相同；允许卖空及分数股票；默认无交易成本。定价与模拟波动率一致，使用离散时间调仓。路径为风险中性GBM教学模拟，非真实市场预测。</p><p>现金按 exp(rΔt) 计息；股息约为上一期持仓×上一期股价×q×Δt，期末入账。空头需支付股息。此为左端点矩形近似，不是连续时间精确股息积分。</p><p>连续时间复制理论与有限次数调仓不同；误差来自离散调仓、股息积分近似和浮点计算。现实还存在交易成本、跳跃、波动率与模型误差。任何策略均不保证盈利。</p></details><section id="hLearning"></section><p class="chart-note">RStudio实践：保持 N 和 seed 不变，只改调仓间隔，比较终值与逐期账户；观察误差绝对值不保证单调下降。</p>`;
 $('#hParams').addEventListener('input',()=>{stop();clearTip();logic='parameters';step=0;phase='predict';choice=null;adjusted=false;read();calculate();});
 $('#hDefault').onclick=()=>{stop();clearTip();p={...H.defaults};write();step=0;logic='initial';phase='predict';choice=null;adjusted=false;calculate();};
 $('#hModel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.hTab){stop();clearTip();tab=b.dataset.hTab;if(tab!=='dynamic')strategy='dynamic';step=0;logic=tab==='initial'?'initial':tab==='dynamic'?'path':'delta';if(tab==='explore'){origin={...p};p={...H.defaults};write();phase='predict';choice=null;adjusted=false;calculate();}else render();}
 else if(b.dataset.hView){view=b.dataset.hView;clearTip();render();}
 else if(b.id==='hPrev'||b.id==='hNext'){stop();clearTip();step+=b.id==='hNext'?1:-1;render();}
 else if(b.id==='hReset'){stop();clearTip();step=0;logic='initial';render();}
 else if(b.id==='hPlay'){if(timer){stop();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('#hMotion').textContent='减少动态偏好已启用，请手动观察。';return;}if(step>=p.N)step=0;timer=setInterval(()=>{if(!active||step>=p.N){stop();return;}clearTip();step++;render();if(step===p.N)stop();},800);b.textContent='暂停';}
 else if(b.id==='hBump'){adjusted=true;render();}
 });
 $('#hModel').addEventListener('input',e=>{if(e.target.id==='hStep'){stop();clearTip();step=Number(e.target.value);render();}if(e.target.id==='hStrategy'){clearTip();strategy=e.target.value;render();}});
 $('#hLearning').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.hChoice){choice=b.dataset.hChoice;renderLearning();}if(b.id==='hConfirm'&&choice){phase='experiment';render();}if(b.id==='hExplain'&&adjusted){phase='explain';render();}if(b.id==='hPredictAgain'){phase='predict';choice=null;adjusted=false;render();}if(b.id==='hExit'){tab='initial';phase='predict';choice=null;adjusted=false;if(origin){p=origin;origin=null;write();}calculate();}});
 $('#hCodePane').addEventListener('click',e=>{const b=e.target.closest('[data-h-logic]');if(b){logic=b.dataset.hLogic;renderCode();$('#hChart')?.classList.toggle('is-linked',true);}});
 $('#copy').addEventListener('click',async e=>{if(!active)return;e.stopImmediatePropagation();if(!sim||tab==='explore'&&phase==='predict')return;const source=HedgeCode.script(p,'full');try{await navigator.clipboard.writeText(source);$('#codeNotice').textContent='已复制，可在 RStudio 整段运行';}catch{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([source],{type:'text/plain'}));a.href=url;a.download='delta-hedging-'+mode+'.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}},true);
 document.querySelectorAll('[data-code-mode]').forEach(b=>b.addEventListener('click',e=>{if(!active)return;e.stopImmediatePropagation();mode=b.dataset.codeMode;renderCode();},true));
 $('#rStudioPractice').addEventListener('click',e=>{if(!active)return;e.stopImmediatePropagation();const baseline=H.simulate(H.defaults);$('#infoTitle').textContent='Delta Hedging · RStudio 实践';$('#infoBody').textContent=`网页不执行R。点击复制代码，在RStudio新建R Script，粘贴后全选运行；仅需基础R。默认 seed=2027、N=60、interval=1、Call、q=0：终值不对冲 ${F(baseline.strategies.none.error)}，静态 ${F(baseline.strategies.static.error)}，动态 ${F(baseline.strategies.dynamic.error)} 元。\n保持seed与N不变，将interval改为5、10，整段重跑。比较errors、results$dynamic与settlement。路径保持相同，终值绝对误差未必单调。完整版同时执行对账并绘制策略图。`;ModalUI.open($('#infoDialog'));},true);
 interaction=ChartInteraction.create((key,state)=>{const tip=$('#hTooltip');if(!tip)return;if(key===null){tip.hidden=true;tip.innerHTML='';return;}const r=sim?.strategies[strategy].rows[Number(key)];if(!r)return;tip.hidden=false;tip.dataset.state=state;tip.innerHTML=`<strong>第 ${r.i} 步 · ${names[strategy]}</strong><p>S=${F(r.S)}；h=${F(r.holding)}；Δ=${F(r.delta)}；调仓现金流=${F(r.tradeCash)}；净值=${F(r.net)} 元。</p>${state==='pinned'?'<button id="hCloseTip">关闭详情</button>':'<span>点击固定详情；移开自动消失</span>'}`;$('#hCloseTip')?.addEventListener('click',()=>interaction.clear());});
 window.addEventListener('pagehide',()=>{stop();clearTip();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();clearTip();}});window.addEventListener('resize',()=>{if(active&&tab==='dynamic'&&sim){clearTip();renderChart();}});
}
function read(){for(const k of Object.keys(p)){const el=$('#h-'+k);p[k]=k==='type'?el.value:el.value.trim()===''?NaN:Number(el.value);}}
function write(){for(const[k,v]of Object.entries(p))$('#h-'+k).value=v;}
function calculate(){stop();clearTip();try{sim=H.simulate(p);error='';}catch(e){sim=null;error=e.message;}render();}
function metric(label,value){return `<div><span>${label}</span><b>${value}</b></div>`;}
function render(){if(!active)return;const focusId=document.activeElement?.id;const predict=tab==='explore'&&phase==='predict';$('#hValidation').textContent=error||'参数变化即重建路径、清除旧步骤；更改调仓间隔保留相同随机路径。';$('#hSchedule').textContent=sim?`每步 ${F(sim.dt)} 年；每 ${p.interval} 步（${F(p.interval*sim.dt)} 年）调仓；到期清算，不再调仓。`:'';$('#copy').disabled=!sim||predict;
 for(const el of document.querySelectorAll('#hFields input,#hFields select'))el.disabled=tab==='explore';$('#hDefault').disabled=tab==='explore';
 $('#hModel').innerHTML=`<div class="h-tabs">${[['initial','初始 Delta 中性'],['explore','股价变动探索'],['dynamic','动态调仓']].map(([v,t])=>`<button data-h-tab="${v}" aria-pressed="${tab===v}">${t}</button>`).join('')}</div><div id="hContent"></div>`;
 renderLearning();if(!sim){$('#hContent').innerHTML=`<p role="alert">${esc(error)}</p>`;$('#hCodePane').innerHTML='<p>请修正参数后生成可运行的对冲模拟。</p>';return;}
 if(predict){$('#hContent').innerHTML='<p class="h-prompt">先在右栏预测：S 从100涨到105，初始股票头寸还保持 Delta 中性吗？其余参数与剩余期限不变。提交前隐藏新价格、Delta、代码与图表。</p>';$('#hCodePane').innerHTML='<p>请先提交预测。</p>';return;}
 if(tab==='initial'){const r=sim.strategies.dynamic.rows[0];$('#hContent').innerHTML=`<p>卖出一份 ${p.type==='C'?'Call':'Put'}，持有 ${F(r.holding)} 单位股票${r.holding<0?'（卖空）':''}。现金为负代表借款。</p><div class="h-neutral" role="img" aria-label="卖出期权Delta与股票Delta抵消"><span>卖方 −Δ<br><b>${F(-r.delta)}</b></span><span>＋</span><span>股票 h<br><b>${F(r.holding)}</b></span><span>＝</span><span>净 Delta<br><b>${F(r.netDelta)}</b></span></div><div class="h-metrics">${metric('标的 S · 元',F(r.S))+metric('期权权利金 V₀ · 元',F(r.price))+metric('期权 Delta · 单位',F(r.delta))+metric('卖方 Delta · 单位',F(-r.delta))+metric('股票持仓 h · 单位',F(r.holding))+metric('现金 B₀ · 元',F(r.cash))+metric('初始净值 Π₀ · 元',F(r.net))+metric('净 Delta · 单位',F(r.netDelta))}</div><p class="chart-note">股票的一阶价格敏感度为 h；期权空头为 −Δ。相加为0只消除当前局部的一阶价格风险，不锁定未来收益。</p>`;}
 else if(tab==='explore'){const x=H.prediction();$('#hContent').innerHTML=`<p>默认 Call；S₀=100，剩余T=1年，K=100，r=5%，q=0，σ=20%。本实验只改变股价，未流逝时间。</p><div class="h-metrics">${metric('原价格',F(x.before.price))+metric('原 Delta / 股票头寸',F(x.originalHolding))}</div>${adjusted?`<div class="h-metrics">${metric('新股价',F(105))+metric('新期权价格',F(x.after.price))+metric('新 Delta / 理论持仓',F(x.newHolding))+metric('需交易数量',F(x.trade))+metric('未调整时净 Delta',F(x.unadjustedNetDelta))+metric('原点 Gamma',F(x.before.gamma))}</div><p>局部近似 Δ新−Δ旧≈Γ旧×5=${F(x.before.gamma*5)}；实际变化=${F(x.trade)}。Gamma 本身也随价格变化，有限变动不是精确线性关系。</p>`:'<button id="hBump">实验：将股价从100改为105</button>'}${phase==='explain'?'<p>原股票数量抵消不了新 Delta；本案例需要买入更多股票。Delta 随 S 的变化率是 Gamma。初始中性不代表永久中性。</p>':''}`;}
 else{step=Math.max(0,Math.min(p.N,step));const r=sim.strategies[strategy].rows[step];$('#hContent').innerHTML=`<div class="h-views"><button data-h-view="path" aria-pressed="${view==='path'}">股价与调仓</button><button data-h-view="performance" aria-pressed="${view==='performance'}">Hedging Performance</button><label>当前账户<select id="hStrategy">${Object.entries(names).map(([k,v])=>`<option value="${k}" ${k===strategy?'selected':''}>${v}</option>`).join('')}</select></label></div><div id="hChart"></div><div id="hTooltip" hidden role="status"></div><div class="h-controls"><button id="hPrev" ${step===0?'disabled':''}>上一步</button><span>第 ${step} / ${p.N} 步</span><button id="hNext" ${step===p.N?'disabled':''}>下一步</button><button id="hPlay">${timer?'暂停':'播放'}</button><button id="hReset">重置进度</button></div><label class="h-step-label">模拟进度<input id="hStep" type="range" min="0" max="${p.N}" step="1" value="${step}" aria-label="模拟步骤"></label><p id="hMotion" role="status"></p><div class="h-metrics">${metric('t / 剩余τ · 年',F(r.t)+' / '+F(r.tau))+metric('S · 元',F(r.S))+metric('期权价格 / 到期支付',F(r.price))+metric('期权 Delta',F(r.delta))+metric('股票持仓 h · 单位',F(r.holding))+metric('现金 B · 元',F(r.cash))+metric('调仓现金流 · 元',F(r.tradeCash))+metric('组合净值 Π · 元',F(r.net))}</div><details id="hLedger"><summary>当前步账户对账与到期清算</summary><p>旧股票 ${F(r.oldHolding)} → 新股票 ${F(r.holding)}；交易数量 ${F(r.quantity)}；利息 ${F(r.interest)}；股息 ${F(r.dividend)}；调仓前现金 ${F(r.cashBefore)}；调仓现金流 ${F(r.tradeCash)}；调仓后现金 ${F(r.cash)}；净 Delta ${F(r.netDelta)}。</p>${step===p.N?`<p>到期表格为清算前账户。卖出股票收入 ${F(sim.strategies[strategy].settlement.stockLiquidation)}，支付期权 ${F(-sim.strategies[strategy].settlement.optionPayment)}；清算后股票0，现金（最终误差）${F(sim.strategies[strategy].error)} 元。</p>`:''}</details><div class="h-comparison"><table><thead><tr><th>策略 · 同路径同权利金</th><th>${step===p.N?'最终误差':'当前净值'}（元）</th></tr></thead><tbody>${Object.entries(sim.strategies).map(([k,v])=>`<tr><th><i style="background:${colors[k]}"></i>${names[k]}</th><td>${F(v.rows[step].net)}</td></tr>`).join('')}</tbody></table></div><p class="chart-note">到期净值是本条路径的对冲误差；动态策略不保证每条路径最好，也不保证盈利。悬停点可预览，点击固定，Escape或关闭按钮取消。</p>`;renderChart();}
 renderCode();if(['hPrev','hNext','hPlay','hReset','hStep','hStrategy'].includes(focusId))document.getElementById(focusId)?.focus({preventScroll:true});}
function renderLearning(){const el=$('#hLearning');el.hidden=tab!=='explore';if(tab!=='explore'){el.innerHTML='';return;}el.innerHTML=phase==='predict'?`<h3>1 · Predict</h3><p>默认 Call 的股价从100涨至105，剩余期限不变，原始股票头寸会怎样？</p>${[['more','需增加股票'],['same','仍然中性'],['less','需减少股票']].map(([v,t])=>`<button data-h-choice="${v}" aria-pressed="${choice===v}">${t}</button>`).join('')}<button id="hConfirm" ${!choice?'disabled':''}>提交预测，开始实验</button><button id="hExit">退出并恢复参数</button>`:phase==='experiment'?`<h3>2 · Experiment</h3><p>在中栏执行100→105实验，再查看解释。</p><button id="hExplain" ${!adjusted?'disabled':''}>查看解释</button><button id="hExit">退出并恢复参数</button>`:`<h3>3 · Explain</h3><p>${choice==='more'?'本次预测正确。':'本次预测需修正。'}本案例 Delta 上升；持有原数量股票时，卖方净 Delta 为负。增加股票才能重新中性。Gamma 解释了对冲比率为什么需要随股价变化。</p><button id="hPredictAgain">重新预测</button><button id="hExit">退出并恢复参数</button>`;}
function renderCode(){if(!active||!sim||tab==='explore'&&phase==='predict')return;const focusedLine=$('#hCodePane')?.contains(document.activeElement)?document.activeElement.getAttribute('aria-label'):null;const lines=HedgeCode.script(p,mode).split('\n');let key='parameters';const scroll=$('#hCodePane .h-code-scroll')?.scrollTop||0;
 $('#hCodePane').innerHTML=`<div class="h-code-scroll">${lines.map((line,i)=>{const tag=line.match(/# \[(\w+)\]/);if(tag)key=tag[1];return `<button class="code-line ${key===logic?'selected':''}" data-h-logic="${key}" aria-pressed="${key===logic}" aria-label="第${i+1}行：${esc(lessons[key]?.[0]||key)}"><span class="num">${i+1}</span><code>${WorkbenchUI.colorCode?WorkbenchUI.colorCode(line):esc(line)||' '}</code></button>`;}).join('')}</div><section class="h-explanation"><h3>${esc(lessons[logic]?.[0]||lessons.initial[0])}</h3><p>${esc(lessons[logic]?.[1]||'')}</p><div id="hFormula"></div><p id="hSubstitution"></p></section>`;$('#hCodePane .h-code-scroll').scrollTop=scroll;katex.render(lessons[logic]?.[2]||lessons.initial[2],$('#hFormula'),{throwOnError:false});
 const r=sim.strategies[strategy].rows[tab==='dynamic'?step:0],prev=sim.strategies[strategy].rows[Math.max(0,r.i-1)];const substitutions={initial:`B₀ = ${F(sim.premium)} − ${F(sim.options[0].delta)} × ${F(p.S)} = ${F(sim.strategies.dynamic.rows[0].cash)} 元。`,trade:`B = ${F(r.cashBefore)} − (${F(r.holding)} − ${F(r.oldHolding)}) × ${F(r.S)} = ${F(r.cash)} 元。`,net:`Π = ${F(r.holding)} × ${F(r.S)} + ${F(r.cash)} − ${F(r.price)} = ${F(r.net)} 元。`,interest:`I = ${r.i?F(prev.cash):'0'} × (exp(${F(p.r)} × ${F(sim.dt)})−1) = ${F(r.interest)} 元。`,dividend:`D ≈ ${F(r.oldHolding)} × ${r.i?F(prev.S):F(p.S)} × ${F(p.q)} × ${F(sim.dt)} = ${F(r.dividend)} 元。`,delta:`Δ = ${F(r.delta)}，股票 h = ${F(r.holding)}；净 Delta = ${F(r.netDelta)}。`,time:`τ = ${F(p.T)} × (${p.N}−${r.i})/${p.N} = ${F(r.tau)} 年。`,path:`seed=${p.seed}，N=${p.N}，当前S=${F(r.S)}，步长=${F(sim.dt)}年。`,settle:tab==='dynamic'&&step===p.N?`最终误差 = ${F(sim.strategies[strategy].error)} 元；清算后股票0。`:'到期后才展示本路径最终清算数值。'};
 $('#hSubstitution').textContent=substitutions[logic]||`当前 ${names[strategy]} · 第${r.i}步。点击图表、代码与参数观察联动。`;
 const linkMap={parameters:Object.keys(p),path:['S','r','q','sigma','N','seed'],delta:['S','K','T','r','q','sigma'],initial:['S','K','T','r','q','sigma'],interest:['r','T','N'],dividend:['q','T','N'],trade:['interval'],time:['T','N']};document.querySelectorAll('[data-h-field]').forEach(el=>el.classList.toggle('linked',(linkMap[logic]||[]).includes(el.dataset.hField)));
 document.querySelectorAll('[data-code-mode]').forEach(b=>{b.disabled=false;b.setAttribute('aria-pressed',String(b.dataset.codeMode===mode));});$('#codeNotice').textContent=(mode==='basic'?'基础金融逻辑':'完整流程 · 对账与绘图')+' · 网页不执行 R';if(focusedLine)$('#hCodePane [aria-label="'+CSS.escape(focusedLine)+'"]')?.focus({preventScroll:true});}
function renderChart(){const host=$('#hChart');if(!host||!sim)return;interaction.redraw(()=>false);const W=500,HH=285,L=58,R=15,top=20,bottom=42,all=view==='path'?sim.spots:Object.values(sim.strategies).flatMap(v=>v.rows.map(r=>r.net));let lo=Math.min(...all),hi=Math.max(...all);const pad=Math.max((hi-lo)*.1,view==='path'?Math.max(1,p.S*.01):.1);lo-=pad;hi+=pad;const x=i=>L+i/p.N*(W-L-R),y=v=>top+(hi-v)/(hi-lo)*(HH-top-bottom);let svg=`<svg viewBox="0 0 ${W} ${HH}" role="img" aria-label="${view==='path'?'模拟股价路径与调仓时点':'三策略对冲净值'}"><text x="${L}" y="12">${view==='path'?'模拟股价（元）':'卖方组合净值（元）'}</text>`;
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="h-grid"/><text x="${L-5}" y="${y(v)+4}" text-anchor="end">${v.toFixed(2)}</text><text x="${x(p.N*i/4)}" y="${HH-bottom+19}" text-anchor="middle">${(p.T*i/4).toFixed(2)}</text>`;}
 const path=arr=>arr.slice(0,step+1).map((v,i)=>(i?'L':'M')+x(i)+','+y(v)).join(' ');
 if(view==='path'){svg+=`<path d="${path(sim.spots)}" class="h-path"/>`;svg+=sim.strategies.dynamic.rows.slice(0,step+1).filter(r=>r.rebalance).map(r=>`<circle cx="${x(r.i)}" cy="${y(r.S)}" r="3.5" class="h-rebalance"/>`).join('');}else{for(const[k,v]of Object.entries(sim.strategies))svg+=`<path d="${path(v.rows.map(r=>r.net))}" fill="none" stroke="${colors[k]}" stroke-width="2" stroke-dasharray="${k==='none'?'5 3':k==='static'?'2 3':'none'}"/>`;}
 const rows=sim.strategies[strategy].rows;svg+=rows.slice(0,step+1).map(r=>`<circle data-h-point="${r.i}" cx="${x(r.i)}" cy="${y(view==='path'?r.S:r.net)}" r="${r.i===step?6:5}" class="h-hit ${r.i===step?'current':''}" role="button" tabindex="0" aria-label="查看第${r.i}步账户"/>`).join('');svg+=`<text x="${W/2}" y="${HH-3}" text-anchor="middle">时间（年）· 当前 ${F(step*sim.dt)}</text></svg>`;host.innerHTML=svg+`<p class="chart-note">${view==='path'?'蓝线：同一模拟股价路径；绿点：动态策略约定调仓时点（不含到期）':'棕色虚线：不对冲 · 蓝色点线：静态 · 绿色实线：动态'}。图只绘制到当前进度。</p>`;host.querySelectorAll('[data-h-point]').forEach(el=>interaction.bind(el,el.dataset.hPoint));}
function activate(on){if(!on&&!$('#hModel'))return;mount();stop();clearTip();active=on;document.body.classList.toggle('hedge-active',on);if(on){mode='full';step=0;logic='initial';calculate();}}
return{activate,stop};})();

;

/* Source: teaching-ux-data.js */
/* Teaching organization only: all values use the existing tested engines. */
(function(root,factory){const api=typeof module==='object'?factory(require('./experiment-math'),require('./bs-lesson'),require('./iv-math'),require('./iv-code'),require('./hedge-math'),require('./hedge-code')):factory(root.ExperimentMath,root.BSLesson,root.IVMath,root.IVCode,root.HedgeMath,root.HedgeCode);if(typeof module==='object')module.exports=api;else root.TeachingUXData=api;})(this,(M,BS,I,IC,H,HC)=>{
const steps={pricing:['认识看涨和看跌','到期支付怎么算','为什么现在也有价格','用 Black–Scholes 定价','在 R 中实现定价'],dividend:['哪些条件影响价格','波动率改变了什么','股息为什么影响价格','逐个认识风险指标','在 R 中做敏感性分析'],iv:['价格已知，波动率未知','为什么要反向求解','二分法：逐次缩小范围','牛顿法：沿切线逼近','比较方法与局限'],hedge:['为什么需要对冲','买多少股票才能抵消','股价变了，为什么要调仓','动态对冲与误差']};
const labels={pricing:'定价基础',dividend:'红利与敏感性',iv:'隐含波动率求解',hedge:'Delta 风险对冲'};
const base={...BS.config.defaults},iv={S:100,K:100,T:1,r:.05,q:0,type:'C',target:M.bs(base).C,tol:1e-8,maxIter:100,initial:.3};
function state(id){return{step:0,p:{...(id==='hedge'?H.defaults:id==='iv'?iv:base)},type:'C',expiry:120,newSpot:105,choice:null,phase:'predict',stage:'A',time:0,greek:'delta',ivMethod:'bisection',codeMode:'point',line:0,version:0};}
function effective(s,id){return id==='hedge'&&[0,2].includes(s.step)?{...H.defaults}:s.p;}
function evaluate(id,s){const p=effective(s,id);if(id==='hedge'){const sim=H.simulate(p);const a=H.option(H.defaults,100,1),b=H.option(H.defaults,s.newSpot,1);return{sim,a,b,r:sim.strategies.dynamic.rows[Math.min(s.time,p.N)],call:M.bs(base).C,payoff:Math.max(s.expiry-100,0)};}if(id==='iv')return{bisection:I.solve(p),newton:I.solve(p,'newton')};return{now:M.bs(p),zero:M.bs({...p,q:0}),vol:M.bs({...p,sigma:Math.min(2,p.sigma+.1)})};}
function bsCore(p){const code=BS.build(p,'full').code;return code.slice(code.indexOf('bs <- function'),code.indexOf('\nresult <- bs('))+'\n'+Object.entries(p).map(([k,v])=>`${k} <- ${v}`).join('\n')+'\n';}
function point(id,s){const p=effective(s,id),type=id==='hedge'?p.type:s.type,key=type==='P'?'P':'C';let lines,formula,links;
if(id==='hedge'){
 if(s.step===0){lines=['ST <- 120; K <- 100','payoff <- max(ST-K,0)','simple <- premium-payoff'];formula='\\text{简单结果}=\\text{权利金}-\\max(S_T-K,0)';links=[];}
 else if(s.step===1){lines=[`value <- bs(S,K,T,r,sigma,q)`,`delta <- value["${p.type==='P'?'deltaP':'deltaC'}"]`,'shares <- delta','net_delta <- -delta+shares'];formula='h=\\Delta,\\quad-\\Delta+h=0';links=['S','K','sigma','q','T'];}
 else if(s.step===2){lines=['old <- bs(100,K,T,r,sigma,q)',`new <- bs(${s.newSpot},K,T,r,sigma,q)`,'trade <- new["deltaC"]-old["deltaC"]'];formula='\\text{交易数量}=\\Delta_{new}-\\Delta_{old}';links=['newSpot'];}
 else if(s.stage==='A'){lines=['tau <- T*(N-i)/N','delta <- values[i+1,"delta"]','rebalance <- i<N && i %% interval==0','target <- if(rebalance) delta else old_holding','quantity <- target-old_holding','holding <- target'];formula='\\tau_i=T(N-i)/N,\\quad Q_i=h_i-h_{i-1}';links=['interval','N'];}
 else if(s.stage==='B'){lines=['interest <- cash*expm1(r*dt)','dividend <- old_holding*q*old_S*dt','before <- cash+interest+dividend','cash <- before-quantity*spot'];formula='B_i=B_{i-1}e^{r\\Delta t}+D_i-(h_i-h_{i-1})S_i';links=['r','q'];}
 else{lines=['net <- holding*spot+cash-option_value','errors <- vapply(results,function(x) {','  tail(x$net,1)','},numeric(1))'];formula='\\Pi_i=h_iS_i+B_i-V_i';links=['interval'];}
}else if(id==='iv'){
 const method=s.step===3?'newton':s.ivMethod;
 if(s.step===0||s.step===1){lines=[`quote <- ${p.target}`,'# sigma 是要寻找的未知数','f <- function(sigma) {','  bs(sigma)["price"]-quote','}'];formula='BS(\\sigma)=P_{quote}';links=['target'];}
 else if(s.step===2){lines=['mid <- a+(b-a)/2','error <- bs(mid)["price"]-target','if(error<0) a <- mid else b <- mid'];formula='m=(a+b)/2,\\quad f(m)=BS(m)-P_{quote}';links=['target','tol'];}
 else if(s.step===3){lines=['value <- bs(sigma)','error <- value["price"]-target','raw_vega <- value["vega"]','next_sigma <- sigma-error/raw_vega'];formula='\\sigma_{n+1}=\\sigma_n-\\frac{BS(\\sigma_n)-P_{quote}}{Vega_{raw}}';links=['initial','tol'];}
 else{lines=['b <- bisection()','n <- newton()','b$status; n$status','b$error; n$error'];formula='|BS(\\sigma)-P_{quote}|\\le\\varepsilon';links=['initial','tol','maxIter'];}
}else if(id==='pricing'){
 if(s.step<2){lines=[`ST <- ${s.expiry}; K <- ${p.K}`,'call_payoff <- max(ST-K,0)','put_payoff <- max(K-ST,0)'];formula='C_T=\\max(S_T-K,0),\\quad P_T=\\max(K-S_T,0)';links=['K','expiry'];}
 else{lines=['value <- bs(S,K,T,r,sigma,q)',`price <- value["${key}"]`,'print(price)'];formula=key==='C'?'C=Se^{-qT}\\Phi(d_1)-Ke^{-rT}\\Phi(d_2)':'P=Ke^{-rT}\\Phi(-d_2)-Se^{-qT}\\Phi(-d_1)';links=['S','K','T','r','q','sigma'];}
}else{
 if(s.step===1){lines=['before <- bs(S,K,T,r,sigma,q)',`after <- bs(S,K,T,r,${Math.min(2,p.sigma+.1)},q)`,'after[c("C","P")]-before[c("C","P")]'];formula='\\sigma\\uparrow\\quad\\text{比较同参数价格}';links=['sigma'];}
 else if(s.step===2){lines=['no_div <- bs(S,K,T,r,sigma,0)','with_div <- bs(S,K,T,r,sigma,q)','with_div[c("C","P")]-no_div[c("C","P")]'];formula='A=Se^{-qT}';links=['q'];}
 else if(s.step===3){const k={delta:type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:type==='P'?'thetaP':'thetaC'}[s.greek];lines=['value <- bs(S,K,T,r,sigma,q)',`sensitivity <- value["${k}"]`,'print(sensitivity)'];formula={delta:'\\Delta=\\partial V/\\partial S',gamma:'\\Gamma=\\partial\\Delta/\\partial S',vega:'Vega_{1pp}=(\\partial V/\\partial\\sigma)/100',theta:'\\Theta_{day}=-(\\partial V/\\partial T)/365'}[s.greek];links=s.greek==='theta'?['T']:s.greek==='vega'?['sigma']:['S'];}
 else{lines=['value <- bs(S,K,T,r,sigma,q)','prices <- value[c("C","P")]','print(prices)'];formula='V=BS(S,K,T,r,\\sigma,q)';links=['S','K','T','r','q','sigma'];}
}
return{lines,formula,links};}
function full(id,s){const p=effective(s,id);if(id==='hedge')return HC.script(p,'full');if(id==='iv')return IC.script(p);return BS.build(p,'full').code;}
function example(id,s){const p=effective(s,id),lines=point(id,s).lines.join('\n');if(id==='hedge'&&s.step===0)return 'ST <- 120; K <- 100\npremium <- '+M.bs(base).C+'\n'+lines+'\nprint(c(payoff=payoff,simple=simple))\n# 忽略资金时间价值及其他现金流，不是完整自融资终值\n';
 if(id==='hedge'&&s.step===1)return bsCore(Object.fromEntries(Object.keys(base).map(k=>[k,p[k]])))+lines+'\nprint(c(delta=delta,shares=shares,net_delta=net_delta))\n';
 if(id==='hedge'&&s.step===2)return bsCore(base)+lines+'\nprint(c(old=old["deltaC"],new=new["deltaC"],trade=trade))\n';
 if(id==='hedge'){return HC.script(p,'basic').split('\n').filter(l=>!l.startsWith('print(')).join('\n')+`\ni <- ${s.time}\ncurrent <- results$dynamic[i+1,]\nprint(current[,c(${(s.stage==='A'?['S','delta','holding','quantity']:s.stage==='B'?['cashBefore','interest','dividend','tradeCash','cash']:['S','price','holding','cash','net']).map(k=>`"${k}"`).join(',')})])\n`;}
 if(id==='iv')return IC.script(p)+'\n# 本步示例已包含所需价格函数与算法定义\n';
 return bsCore(p)+lines+'\n'+(s.step<2&&id==='pricing'?'print(c(call_payoff=call_payoff,put_payoff=put_payoff))':'')+'\n';}
function formatR(code,wrap){return code.split('\n').flatMap(line=>/^\s*#/.test(line)?[line]:wrap(line,46)).join('\n');}
return{steps,labels,base,iv,state,effective,evaluate,point,full,example,bsCore,formatR};});

;

/* Source: teaching-ux-charts.js */
/* Curated diagrams backed by the same financial engines. */
window.TeachingUXCharts=(()=>{
const esc=WorkbenchUI.esc,F=(x,d=2)=>x==null?'—':Number(x).toFixed(d);let controller=null;
const svg=(body,label)=>`<svg viewBox="0 0 480 300" role="img" aria-label="${label}">${body}</svg>`;
function axis(series,label,xlabel='股价（元）',ylabel='理论价格（元）',extras=()=>'',domain=null,ydomain=null){const pts=series.flatMap(v=>v.points).filter(v=>v.every(Number.isFinite));if(!pts.length)return '<p>此边界下该指标未定义；请调整参数。</p>';let xmin=domain?.[0]??Math.min(...pts.map(v=>v[0])),xmax=domain?.[1]??Math.max(...pts.map(v=>v[0])),lo=Math.min(...pts.map(v=>v[1])),hi=Math.max(...pts.map(v=>v[1]));const pad=Math.max((hi-lo)*.15,.01);lo=Math.min(...pts.map(v=>v[1]))>=0?Math.max(0,lo-pad):lo-pad;hi+=pad;if(ydomain){lo=ydomain[0];hi=ydomain[1];}if(xmin===xmax)xmax=xmin+1;const x=v=>58+(v-xmin)/(xmax-xmin)*402,y=v=>250-(v-lo)/(hi-lo)*222;let body=`<text x="58" y="15">${ylabel}</text>`;for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,xx=xmin+(xmax-xmin)*i/4;body+=`<line class="tu-grid" x1="58" x2="460" y1="${y(v)}" y2="${y(v)}"/><text x="51" y="${y(v)+4}" text-anchor="end">${F(v,Math.abs(hi-lo)<1?3:2)}</text><text x="${x(xx)}" y="270" text-anchor="${i===4?'end':'middle'}">${F(xx,2)}</text>`;}body+=series.map(v=>`<path d="${v.points.filter(v=>v.every(Number.isFinite)).map(([a,b],i)=>(i?'L':'M')+x(a)+','+y(b)).join(' ')}" fill="none" stroke="${v.color||'#6689a8'}" data-series="${v.name||''}" stroke-opacity="${v.opacity??1}" stroke-width="${v.width||2.2}" ${v.dash?'stroke-dasharray="5 4"':''}/>`).join('');body+=extras(x,y,lo,hi)+`<text x="260" y="294" text-anchor="middle">${xlabel}</text>`;return svg(body,label);}
function risk(expiry,premium,revealed){return svg(`<text x="30" y="35">今天收到权利金</text><text x="30" y="82" class="tu-big">${F(premium)} 元</text><path d="M205 73H400" class="tu-arrow"/><text x="290" y="52" text-anchor="middle">一年后</text><text x="30" y="150">约定买入价：100 元</text><text x="30" y="190">情景：到期股价 ${F(expiry,0)} 元</text>${revealed?`<rect x="260" y="125" width="185" height="93" rx="10" class="tu-warm"/><text x="350" y="153" text-anchor="middle">卖方到期支付</text><text x="350" y="195" text-anchor="middle" class="tu-big">${F(Math.max(expiry-100,0))} 元</text>`:'<rect x="260" y="125" width="185" height="93" rx="10" class="tu-soft"/><text x="350" y="175" text-anchor="middle">预测后再揭晓</text>'}<text x="30" y="267">一份教学期权对应一单位标的</text>`,'看涨期权卖方情景');}
function cancel(delta){const length=Math.min(180,Math.abs(delta)*220);return svg(`<line x1="240" y1="50" x2="240" y2="240" class="tu-grid"/><text x="240" y="30" text-anchor="middle">以 0 为中心的一阶价格风险</text><rect x="${delta>=0?240-length:240}" data-risk="delta" y="80" width="${length}" height="35" rx="4" class="tu-warm"/><rect x="${delta>=0?240:240-length}" data-risk="shares" y="155" width="${length}" height="35" rx="4" class="tu-green"/><text x="25" y="72">卖出期权：${F(-delta,4)}</text><text x="25" y="146">当前目标股票：${F(delta,4)}</text><text data-risk="net" x="240" y="245" text-anchor="middle" class="tu-big">净 Delta = 0</text><text x="240" y="280" text-anchor="middle">当前一阶风险抵消 ≠ 永久无风险</text>`,'方向相反的风险条形相互抵消');}
function adjust(oldD,newD){return svg(`<text x="25" y="35">同一时点，只改变股价</text><text x="25" y="75">原来持有 ${F(oldD,4)} 单位</text><rect x="25" y="90" width="${Math.abs(oldD)*450}" height="35" rx="4" class="tu-blue"/><text x="25" y="170">现在需要 ${F(newD,4)} 单位</text><rect x="25" y="185" width="${Math.abs(newD)*450}" height="35" rx="4" class="tu-green"/><text x="25" y="270">需要交易 ${F(newD-oldD,4)} 单位股票</text>`,'原持仓与新理论对冲数量对比');}
function price(p,type,greek=null){const x=Array.from({length:61},(_,i)=>Math.max(.01,Math.min(1e5,p.S*(.6+i/60*.8)))),key=greek?{delta:type==='C'?'deltaC':'deltaP',gamma:'gamma',vega:'vega',theta:type==='C'?'thetaC':'thetaP'}[greek]:type;return axis([{name:greek||type,points:x.map(s=>[s,ExperimentMath.bs({...p,S:s})[key]??NaN])}],greek?'当前选定敏感度曲线':'选定期权理论价格','股价 S（元）',greek?{delta:'Delta（元/元）',gamma:'Gamma（1/元）',vega:'Vega（元/1百分点）',theta:'Theta（元/日）'}[greek]:'理论价格（元）',()=>'',null,greek==='delta'?(type==='C'?[0,Math.exp(-p.q*p.T)]:[-Math.exp(-p.q*p.T),0]):null);}
function iteration(p,result,index){const row=result.rows[index];if(!row)return `<p>${esc(IVMath.reasons[result.status])}</p>`;let extent=Math.max(.4,row.sigma,row.b||0,Number.isFinite(row.nextSigma)&&row.nextSigma>0?row.nextSigma:0);extent=Math.min(1e6,extent*1.1);const log=false,transform=s=>log?Math.log1p(s/.01):s,inv=s=>log?.01*Math.expm1(s):s;const pts=Array.from({length:121},(_,i)=>{const s=inv(transform(extent)*i/120);return[transform(s)*100,ExperimentMath.bs({...p,sigma:s},true)[p.type]];});const html=axis([{points:pts}],result.method==='newton'?'当前Newton切线':'当前二分区间','波动率 σ（%）','BS理论价格（元）',(x,y,lo,hi)=>{let content=`<line x1="58" x2="460" y1="${y(p.target)}" y2="${y(p.target)}" class="tu-quote"/>`;if(row.a!==null)content+=`<rect x="${x(100*transform(row.a))}" y="28" width="${x(100*transform(row.b))-x(100*transform(row.a))}" height="222" class="tu-bracket"/>`;if(result.method==='newton'&&row.vega>0&&Number.isFinite(row.nextSigma)&&row.nextSigma>0){const a=row.sigma,b=row.nextSigma;content+=`<line x1="${x(100*transform(a))}" x2="${x(100*transform(b))}" y1="${y(row.theoreticalPrice)}" y2="${y(p.target)}" class="tu-tangent"/>`;}content+=`<circle cx="${x(100*transform(row.sigma))}" cy="${y(row.theoreticalPrice)}" r="6" class="tu-dot"/>`;return content;});return html;}
function dynamic(sim,time,stage,view,strategy='dynamic'){const colors={none:'#a98773',static:'#6689a8',dynamic:'#659b8a'},performance=view==='performance',rows=sim.strategies[strategy].rows;const series=performance?Object.entries(sim.strategies).map(([k,v])=>({points:v.rows.map(r=>[r.t,r.net]),name:k,color:colors[k],dash:k!=='dynamic',width:k===strategy?3.5:1.7,opacity:k===strategy?1:.35})):[{points:rows.map(r=>[r.t,r.S]),color:'#a9bcc8'}];return axis(series,performance?'同路径三策略净值比较':'股价路径与调仓位置','时间（年）',performance?'卖方组合净价值（元）':'模拟股价（元）',(x,y)=>rows.filter(r=>(r.i<=time&&r.rebalance)||r.i===time).map(r=>`<circle data-tu-point="${r.i}" role="button" tabindex="0" aria-label="查看第${r.i}期" cx="${x(r.t)}" cy="${y(performance?r.net:r.S)}" r="${r.i===time?6:4}" class="${r.i===time?'tu-dot':'tu-rebalance'}"/>`).join(''),[0,sim.p.T]);}
function prices(p,{payoff=false,dividend=false}={}){const xs=Array.from({length:81},(_,i)=>dividend?Math.max(.1,p.q)*i/80:Math.max(.01,Math.min(1e5,p.S*(.6+i/80*.8))));const val=(x,k)=>payoff?(k==='C'?Math.max(x-p.K,0):Math.max(p.K-x,0)):ExperimentMath.bs({...p,[dividend?'q':'S']:x})[k];return axis(['C','P'].map((k,i)=>({name:k,points:xs.map(x=>[x,val(x,k)]),color:i?'#a98773':'#6689a8'})),payoff?'Call与Put到期支付':'Call与Put理论价格',dividend?'连续股息 q（小数）':payoff?'到期股价（元）':'股价 S（元）',payoff?'到期支付（元）':'理论价格（元）',(x,y)=>['C','P'].map((k,i)=>`<circle data-price="${k}" cx="${x(dividend?p.q:p.S)}" cy="${y(val(dividend?p.q:p.S,k))}" r="5" fill="${i?'#a98773':'#6689a8'}"/>`).join(''));}
function bind(host,sim,stage,strategy='dynamic'){controller?.destroy();controller=ChartInteraction.create((key,state)=>{const tip=document.querySelector('#tuTip');if(!tip)return;if(key===null){tip.hidden=true;tip.textContent='';return;}const r=sim.strategies[strategy].rows[Number(key)];tip.hidden=false;tip.dataset.state=state;tip.innerHTML=`第 ${r.i} 期：股价 ${F(r.S)}，股票 ${F(r.holding,4)} 单位${stage==='A'?'':`，现金 ${F(r.cash)} 元，净值 ${F(r.net)} 元`}${state==='pinned'?'<button id="tuTipClose">关闭详情</button>':'；移开即关闭，点击可固定'}`;tip.querySelector('button')?.addEventListener('click',()=>controller.clear());});controller.redraw(()=>false);host.querySelectorAll('[data-tu-point]').forEach(el=>controller.bind(el,el.dataset.tuPoint));}
function clear(){controller?.destroy();controller=null;}
return{svg,axis,risk,cancel,adjust,price,prices,iteration,dynamic,bind,clear};})();

;

/* Source: zero-friction-data.js */
/* UI adapter only; the pricing, solvers and accounts remain their tested sources. */
(function(root,factory){const api=typeof module==='object'?factory(require('./teaching-ux-data'),require('./experiment-math'),require('./hedge-math'),require('./hedge-code'),require('./iv-code')):factory(root.TeachingUXData,root.ExperimentMath,root.HedgeMath,root.HedgeCode,root.IVCode);if(typeof module==='object')module.exports=api;else root.ZeroFrictionData=api;})(this,(D,M,H,HC,IC)=>{
const core=p=>Object.fromEntries(Object.keys(D.base).map(k=>[k,p[k]]));
function state(id){const s=D.state(id);return{...s,codeMode:'full',mode:id==='hedge'?'cancel':'price',method:'bisection',strategy:'dynamic',view:'path',greek:'delta',line:-1,baseline:{S:s.p.S,delta:id==='hedge'?H.option(s.p,s.p.S,s.p.T).delta:null},challenge:null};}
function snippet(id,s){const p=s.p;if(id==='hedge'&&s.mode==='cancel')return[`d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))`,`delta <- exp(-q*T)*(pnorm(d1)${p.type==='P'?'-1':''})`,'shares <- delta','net_delta <- -delta+shares'];if(id==='hedge')return['tau <- T*(N-i)/N','rebalance <- i<N && i %% interval==0','quantity <- target-old_holding','cash <- before-quantity*spot','net <- holding*spot+cash-option_value'];if(id==='iv')return s.method==='newton'?['value <- bs(sigma)','error <- value["price"]-target','raw_vega <- value["vega"]','next_sigma <- sigma-error/raw_vega']:s.method==='compare'?['b <- bisection()','n <- newton()','b$status; n$status','b$error; n$error']:['mid <- a+(b-a)/2','error <- bs(mid)["price"]-target','if(error<0) a <- mid else b <- mid'];if(id==='pricing'&&s.mode==='payoff')return['call_payoff <- max(S-K,0)','put_payoff <- max(K-S,0)'];if(id==='dividend'&&s.mode==='greek')return['value <- bs(S,K,T,r,sigma,q)',`sensitivity <- value["${{delta:s.type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:s.type==='P'?'thetaP':'thetaC'}[s.greek]}"]`,'print(sensitivity)'];return['value <- bs(S,K,T,r,sigma,q)','prices <- value[c("C","P")]','print(prices)'];}
function script(id,s,full=false){if(full)return complete(id,s);if(id==='iv')return IC.script(s.p);if(id==='hedge'&&s.mode==='dynamic')return HC.script(s.p,'basic');const p=core(s.p),lines=snippet(id,s);if(id==='hedge'){
 // At T=0/sigma=0 the validated BS boundary branch supplies Delta; never divide by zero.
 if(p.T===0||p.sigma===0)lines.splice(0,2,'value <- bs(S,K,T,r,sigma,q)',`delta <- value["${s.p.type==='P'?'deltaP':'deltaC'}"]`);
 return D.bsCore(p)+lines.join('\n')+`\ninitial_shares <- ${s.baseline.delta??'NA_real_'}\nprint(c(delta=delta,shares=shares,net_delta=net_delta,initial_shares=initial_shares))\n`;
 }return D.bsCore(p)+lines.join('\n')+'\n'+(s.mode==='payoff'?'print(c(call_payoff=call_payoff,put_payoff=put_payoff))':'')+'\n';}
function complete(id,s){const p=s.p;
 if(id==='iv')return IC.script(p).replace('bs <- function','# 1. 含股息的定价与原始Vega\nbs <- function').replace('solve_iv <- function','# 2. 纯二分法与Newton：校验、轨迹、停止条件\nsolve_iv <- function');
 if(id==='hedge'&&s.mode==='dynamic')return HC.script(p,'full');
 let code=D.full('pricing',{...s,p:core(p)}).replace('S <- ', '# 1. 参数（小数利率、年化波动率）\nS <- ').replace('bs <- function','# 2. 定价与含股息Greeks函数\nbs <- function').replace('result <- bs(S,K,T,r,sigma,q)','# 3. 以当前参数计算并输出\nresult <- bs(S,K,T,r,sigma,q)').replace('spot <- seq','# 4. 价格曲线\nspot <- seq');
 if(id==='hedge')code+='\n# 当前风险抵消：重新建立账户；原持仓尚未自动交易\nvalue <- bs(S,K,T,r,sigma,q)\n'+`delta <- unname(value["${p.type==='P'?'deltaP':'deltaC'}"])\nshares <- delta\nnet_delta <- -delta+shares\ninitial_shares <- ${s.baseline.delta??'NA_real_'}\ntrade_needed <- shares-initial_shares\npremium <- unname(value["${p.type}"])\ncash <- premium-shares*S\nnet_value <- shares*S+cash-premium\nprint(c(delta=delta,shares=shares,net_delta=net_delta,\n initial_shares=initial_shares,trade_needed=trade_needed,\n premium=premium,cash=cash,net_value=net_value))\n`;
 if(id==='pricing'&&s.mode==='payoff')code+='\n# 情景到期支付，未扣权利金，不是净利润\ncall_payoff <- max(S-K,0)\nput_payoff <- max(K-S,0)\nprint(c(call_payoff=call_payoff,put_payoff=put_payoff))\n';
 if(id==='dividend')code+='\n# 当前含股息的敏感性实验：一次只改变一个参数\nno_dividend <- bs(S,K,T,r,sigma,0)\nprint(rbind(no_dividend=no_dividend, current=result))\n'+(s.mode==='greek'?`# 当前${s.type} ${s.greek}：Vega/1百分点，Theta/日\nsensitivity <- unname(result["${{delta:s.type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:s.type==='P'?'thetaP':'thetaC'}[s.greek]}"])\nprint(sensitivity)\n`:'' );
 return code;
}
function kind(line){const l=line.trim();if(!l||l.startsWith('#'))return 'comment';if(/stopifnot|stop\(|is.finite|Invalid|length\(x\)|any\(/.test(l))return 'validation';if(/net_delta\s*<-/.test(l))return 'net_delta';if(/initial_shares|trade_needed/.test(l))return 'initial';if(/shares\s*<-|holding\s*<-|target\s*<-/.test(l))return 'shares';if(/cash\s*<-|before\s*<-|tradeCash|trade_cash/.test(l))return 'cash';if(/interest\s*<-/.test(l))return 'interest';if(/dividend\s*<-/.test(l))return 'dividend';if(/net_value\s*<-|net\s*<-/.test(l))return 'net';if(/delta\w*\s*<-/.test(l))return 'delta';if(/gamma\s*<-|sensitivity.*gamma/.test(l))return 'gamma';if(/vega\s*<-|sensitivity.*vega/.test(l))return 'vega';if(/theta[C|P]?\s*<-|sensitivity.*theta/.test(l))return 'theta';if(/sensitivity.*delta/.test(l))return 'delta';if(/d1\s*<-/.test(l))return 'd1';if(/d2\s*<-/.test(l))return 'd2';if(/C\s*<-|call\s*<-/.test(l))return 'call';if(/P\s*<-|put\s*<-/.test(l))return 'put';if(/A\s*<-|E\s*<-/.test(l))return 'discount_stock';if(/D\s*<-/.test(l))return 'discount_strike';if(/signedError|error\s*<-/.test(l))return 'error';if(/next_sigma|next\s*<-/.test(l))return 'newton';if(/mid\s*<-/.test(l))return 'midpoint';if(/abs\(.*error|converged|tol/.test(l)&&!l.includes('initial'))return 'tolerance';if(/rebalance\s*<-|quantity\s*<-/.test(l))return 'rebalance';if(/tau\s*<-/.test(l))return 'tau';if(/payoff/.test(l))return 'payoff';if(/^(S0?|K|T|r|q|sigma|N|interval|seed|type|target|initial)\s*<-/.test(l))return 'parameters';return 'helper';}
function rows(id,s,wrap){const code=s.codeMode==='full'?script(id,s,true):snippet(id,s).join('\n');return code.split('\n').flatMap(l=>(/^\s*#/.test(l)?[l]:wrap(l,48)).map(text=>({text,kind:kind(l)})));}
return{state,core,snippet,script,kind,rows};});

;

/* Source: teaching-ux.js */
/* v2.2 free exploration. No tutorial prerequisites or parameter locks. */
window.TeachingUX=(()=>{'use strict';
const $=s=>document.querySelector(s),D=TeachingUXData,Z=ZeroFrictionData,C=TeachingUXCharts,M=ExperimentMath,H=HedgeMath,esc=WorkbenchUI.esc,F=(v,n=4)=>v==null?'—':Number(v).toFixed(n);
const titles={pricing:'股票价格变化，期权价格会怎样？',dividend:'股息和波动率如何影响期权价格？',iv:'已知期权价格，怎样反推出波动率？',hedge:'为什么卖出期权后，需要买入股票？'};
let id='pricing',states={},active=false,expert=false,callback,timer=null,data=null,error='';
const s=()=>states[id]||(states[id]=Z.state(id));
const details=(title,body,key='')=>`<details class="tu-details" ${key?`data-details="${key}"`:''}><summary>${title}</summary>${body}</details>`;
const facts=items=>`<dl class="tu-facts">${items.map(([k,v])=>`<div data-result="${/Call/.test(k)?'call':/Put/.test(k)?'put':/Delta/.test(k)?'delta':''}"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const figure=html=>`<div id="tuFigure" class="tu-figure">${html}</div>`;
const switches=(key,items,value)=>`<div class="tu-view">${items.map(([v,t])=>`<button data-${key}="${v}" aria-pressed="${value===v}">${t}</button>`).join('')}</div>`;
function stop(){if(timer!==null)clearInterval(timer);timer=null;const b=$('#tuPlay');if(b)b.textContent='播放';}
function clear(){stop();C.clear();}
function mount(options){callback=options.openExpert;for(const[key,parent]of [['tuModel','.model-panel'],['tuParams','.parameters'],['tuCode','.code-panel']]){const el=document.createElement('section');el.id=key;el.className='tu-only';$(parent).append(el);el.addEventListener('click',action);el.addEventListener('input',input);el.addEventListener('focusin',e=>{if(e.target.dataset.key==='target'&&Number.isFinite(s().p.target)){e.target.value=String(s().p.target);e.target.select();}});el.addEventListener('focusout',e=>{if(e.target.dataset.key==='target'&&Number.isFinite(s().p.target))e.target.value=F(s().p.target,4);});}
 const back=document.createElement('div');back.id='tuExpertReturn';back.innerHTML='<span>原完整工作台 · 参数独立保存</span><button id="tuReturn">返回自由探索</button>';$('#bsModules').after(back);$('#tuReturn').onclick=()=>{expert=false;open(id);};window.addEventListener('pagehide',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});const u=new URLSearchParams(location.search);expert=u.get('experience')==='full';open(D.steps[u.get('lesson')]?u.get('lesson'):'pricing');}
function mark(){document.querySelectorAll('[data-bs-module]').forEach(b=>{b.disabled=false;b.setAttribute('aria-pressed',String(b.dataset.bsModule===id));});}
function open(module){clear();if(!D.steps[module])return;const changed=module!==id||!active;id=module;if(changed){s().codeMode='full';s().line=-1;}const u=new URL(location.href);u.searchParams.set('lesson',id);if(expert)u.searchParams.set('experience','full');else u.searchParams.delete('experience');history.replaceState(null,'',u);mark();if(expert){active=false;document.body.classList.remove('teaching-mode');document.body.classList.add('bs-expert');callback(id);return;}callback(null);active=true;document.body.classList.remove('bs-expert');document.body.classList.add('teaching-mode');render();}
function evaluate(){const a=s(),p=a.p;if(id==='hedge'){H.validate(p);if(a.mode==='cancel')return{current:H.option(p,p.S,p.T)};const sim=H.simulate(p);return{sim,current:H.option(p,p.S,p.T),r:sim.strategies[a.strategy].rows[Math.min(a.time,p.N)]};}if(id==='iv')return{bisection:IVMath.solve(p),newton:IVMath.solve(p,'newton')};return{now:M.bs(p)};}
function action(e){const b=e.target.closest('button');if(!b)return;const a=s();if(b.id==='tuFull'){expert=true;open(id);return;}if(b.dataset.iteration!==undefined){clear();a.time=+b.dataset.iteration;render();return;}if(b.dataset.mode){clear();a.mode=b.dataset.mode;a.codeMode='full';a.line=-1;a.time=0;render();return;}if(b.dataset.method){clear();a.method=b.dataset.method;a.codeMode='full';a.time=0;a.line=-1;render();return;}if(b.dataset.view){clear();a.view=b.dataset.view;render();return;}if(b.id==='tuPrevTime'||b.id==='tuNextTime'){clear();a.time+=b.id==='tuNextTime'?1:-1;render();return;}if(b.id==='tuResetTime'){clear();a.time=0;render();return;}if(b.id==='tuPlay'){if(timer!==null){stop();return;}if(!data)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('#tuMotion').textContent='已启用减少动态偏好，请使用上一期 / 下一期。';return;}if(a.time>=maxTime())a.time=0;timer=setInterval(()=>{if(!active||!data){stop();return;}a.time=Math.min(a.time+1,maxTime());render();if(a.time===maxTime())stop();},950);render();return;}
 if(b.dataset.codeMode){a.codeMode=b.dataset.codeMode;a.line=-1;renderCode();return;}if(b.dataset.line!==undefined){a.line=+b.dataset.line;renderCode();link();return;}if(b.id==='tuCopyStep'||b.id==='tuCopyFull'){copy(true);return;}if(b.id==='tuPractice'){practice();return;}if(b.id==='tuDefaults'){clear();states[id]=Z.state(id);render();return;}if(b.id==='tuChallengeExplain'){const q=challengeData();$('#tuChallengeFeedback').textContent=(a.challenge===q.correct?'本次预测正确。':'可对照修正预测。')+q.explanation;return;}if(b.dataset.choice){a.challenge=b.dataset.choice;$('#tuChallengeFeedback').textContent='已记录预测。参数与模型始终可以自由操作；展开“为什么？”核对金融原理。';b.parentElement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));return;}}
function input(e){const el=e.target,a=s();if(el.id==='tuTime'){clear();a.time=+el.value;render();return;}if(el.id==='tuStrategy'){clear();a.strategy=el.value;a.line=-1;render();return;}if(el.id==='tuGreek'||el.id==='tuType'){clear();a[el.id==='tuGreek'?'greek':'type']=el.value;a.line=-1;render();return;}if(!el.dataset.key)return;clear();const k=el.dataset.key;if(['pricing','dividend'].includes(id)){try{a.lastChange={key:k,from:a.p[k],before:M.bs(Z.core(a.p))};}catch{a.lastChange=null;}}a.p[k]=k==='type'?el.value:el.value.trim()===''?NaN:+el.value;a.time=0;a.line=-1;document.querySelectorAll('#tuParams .linked').forEach(node=>node.classList.remove('linked'));
 // A new contract starts a fresh initial hedge. Changing only S preserves the historical holding.
 if(id==='hedge'&&k!=='S'&&['K','T','r','q','sigma','type'].includes(k)){try{a.baseline={S:a.p.S,delta:H.option(a.p,a.p.S,a.p.T).delta};}catch{a.baseline={S:a.p.S,delta:null};}}
 const focus=el.id;render(false);for(const node of document.querySelectorAll(`[data-key="${k}"]`))if(node!==el)node.value=el.value;document.getElementById(focus)?.focus({preventScroll:true});}
function render(params=true){if(!active)return;C.clear();const a=s(),scroll=$('#tuBody')?.scrollTop||0,ps=$('#tuParams')?.scrollTop||0,focus=document.activeElement?.id,opened=[...document.querySelectorAll('#tuModel details[open],#tuParams details[open]')].map(d=>d.dataset.details).filter(Boolean);a.time=Math.max(0,a.time);try{data=evaluate();error='';}catch(e){data=null;error=e.message;}if(data&&id==='iv')a.time=Math.min(a.time,Math.max(0,data[a.method==='newton'?'newton':'bisection'].rows.length-1));
 $('#tuModel').innerHTML=`<h3 class="tu-question">${id==='dividend'&&a.mode==='greek'?{delta:'股价变化时，期权价格的敏感度如何变化？',gamma:'股价变化时，Delta变化有多快？',vega:'波动率变化时，期权价格有多敏感？',theta:'时间流逝一天，期权价格如何变化？'}[a.greek]:titles[id]}</h3><div id="tuBody"></div>`;if(params)renderParams();if(error){$('#tuBody').innerHTML=`<p class="tu-error" role="alert">${esc(error)}；旧结果与轨迹已清除。</p>`;$('#tuCode').innerHTML='<p class="tu-note">请修正参数后复制代码。</p>';return;}
 $('#tuBody').innerHTML=(id==='hedge'?hedge():id==='iv'?implied():prices())+challenge()+details('模型假设与完整工作台',`<p>欧式期权、Black–Scholes、连续股息、同一无风险借贷利率；允许卖空和分数股票，一份教学期权对应一单位标的。动态模拟采用风险中性GBM，定价与模拟波动率一致，无交易成本、离散调仓。模拟路径不是市场预测，策略不保证盈利。</p><button id="tuFull">打开原完整工作台</button><p>原工作台保留全部旧功能，参数独立保存；返回会保留本页自由探索条件。</p>`,'assumptions');
 if(id==='hedge'&&a.mode==='dynamic')C.bind($('#tuFigure'),data.sim,'B',a.strategy);renderCode();for(const key of opened)document.querySelector(`[data-details="${key}"]`)?.setAttribute('open','');$('#tuBody').scrollTop=scroll;$('#tuParams').scrollTop=ps;if(['tuTime','tuPlay','tuNextTime','tuPrevTime','tuResetTime'].includes(focus))document.getElementById(focus)?.focus({preventScroll:true});mark();}
function hedge(){const a=s(),p=a.p,v=data.current,h=v.delta,base=a.baseline.delta;const toggle=switches('mode',[['cancel','风险抵消'],['dynamic','动态调仓']],a.mode);if(a.mode==='cancel')return toggle+`<p class="zf-intro">${p.type==='C'?'卖出看涨期权后，股价上涨可能增加期权支付义务。买入适量股票，可以抵消股价小幅变化带来的一阶风险。':'卖出看跌期权后，股价下跌可能增加期权支付义务。卖空适量股票，可以抵消股价小幅变化带来的一阶风险。'}</p>`+figure(C.cancel(h))+`<div id="tuLive" aria-live="polite">${facts([['期权 Delta',F(h)],['当前所需股票',F(h)+' 单位'],['净 Delta','0.0000']])}</div><p id="tuInsight" class="tu-insight">${p.S===a.baseline.S?'股价每发生很小的变化，卖出期权与目标股票持仓的一阶价值变化大约相互抵消。':`股价从 ${F(a.baseline.S,2)} 变为 ${F(p.S,2)} 元，Delta变为 ${F(h)}；维持当前中性需要${h-base>=0?'增加':'减少'} ${F(Math.abs(h-base))} 单位股票。`}Delta中性不代表完全无风险。</p><p class="zf-holdings">初始持仓 <b id="tuInitial">${F(base)}</b> → 当前目标 <b id="tuTarget">${F(h)}</b> 单位<br>初始股价 ${F(a.baseline.S,2)} 元；原持仓未调整时净Delta ${F(base-h)}。这是目标数量重算，尚未执行交易。</p>`+
 details('为什么？',`<p>Delta是局部价格敏感度，不是上涨概率。卖出一份期权的Delta是−Δ；每单位股票的Delta是1，所以持有h=Δ可使−Δ+h=0。Put的Delta为负，因此股票对冲方向为卖空。</p><p>股价改变会改变Delta；Gamma衡量这种变化。原股票持仓不会自动改变，有限价格变动还有非线性风险。修改合约的K、T、r、q、σ或类型时，本页按当前S重建初始参照；仅修改S则保持初始持仓。</p>`,'why')+
 details('查看资金与现金账户计算',`<p>按当前条件重新建立一份教学期权的对冲：卖出期权收入 ${F(v.price,6)} 元；股票成本 hS=${F(h*p.S,6)} 元；B₀=V₀−hS=${F(v.price-h*p.S,6)} 元；初始净值 hS+B₀−V₀=0。</p><p>负现金表示借入资金，不代表已经亏损。这里是当前新建账户的资金计算；原持仓的逐期自融资账户请切换“动态调仓”。</p>`,'cash')+
 details('数学与六位计算',`<div data-formula="delta"></div><p>d₁=${F(M.bs(Z.core(p)).d1,6)}，期权Delta=${F(h,6)}；股票目标=${F(h,6)}，净Delta=${F(-h+h,6)}。剩余期限与其他参数固定，仅改变S。</p>`,'math');
 const sim=data.sim,r=data.r;return toggle+`<p class="zf-intro">同一路径上，按约定时点调整股票；账户自动计入利息、股息和调仓现金流。这是教学模拟。</p>`+switches('view',[['path','股价与调仓'],['performance','对冲策略表现']],a.view)+`<label class="zf-strategy">观察策略<select id="tuStrategy">${[['none','不对冲'],['static','静态Delta'],['dynamic','动态Delta']].map(([v,t])=>`<option value="${v}" ${a.strategy===v?'selected':''}>${t}</option>`).join('')}</select></label>${a.view==='performance'?'<div class="zf-strategy-legend"><span style="--strategy:#a98773">不对冲：不持有股票降低风险</span><span style="--strategy:#6689a8">静态：只建立初始对冲</span><span style="--strategy:#659b8a">动态：按调仓间隔调整持仓</span></div>':''}`+figure(C.dynamic(sim,a.time,'C',a.view,a.strategy))+'<div id="tuTip" hidden role="status"></div>'+controls(p.N)+facts([['当前策略',{none:'不对冲',static:'静态Delta',dynamic:'动态Delta'}[a.strategy]],['当前组合净价值',F(r.net)+' 元']])+`<p id="tuInsight" class="tu-insight">这是当前期权空头与相应账户头寸的净价值${r.i<p.N?'，尚未结算，不等于已实现利润':'；到期清算后的现金等于终点净值'}。${r.i===0?'初始股票与现金共同抵消期权负债，净值约为0。':r.i===p.N?'已到期：期权使用真实支付函数，股票清算后现金等于终点净值。':r.rebalance?`本期重新计算Delta，交易 ${F(r.quantity)} 单位股票；${r.quantity>=0?'买入支付现金':'卖出收回现金'}。`:'本期不是该策略的调仓时点，继续持有原数量。'}更频繁调仓不保证每条路径误差都更小。</p>`+
 details('查看完整对冲账户',facts([['当前股价',F(r.S,6)],['实际股票持仓',F(r.holding,6)],['本期交易量',F(r.quantity,6)],['该路径期末误差（模拟）',F(sim.strategies[a.strategy].error,6)],['期权理论价 / 到期支付',F(r.price,6)],['期权Delta',F(r.delta,6)],['现金账户',F(r.cash,6)],['调仓前现金',F(r.cashBefore,6)],['利息 / 股息',F(r.interest,6)+' / '+F(r.dividend,6)],['交易现金流',F(r.tradeCash,6)]])+`<table class="tu-table"><tr><th>同一路径</th><th>当前净值</th><th>最终误差</th></tr>${Object.entries(sim.strategies).map(([k,v])=>`<tr><th>${{none:'不对冲',static:'静态',dynamic:'动态'}[k]}</th><td>${F(v.rows[a.time].net,6)}</td><td>${F(v.error,6)}</td></tr>`).join('')}</table><p>现金 Bᵢ=Bᵢ₋₁exp(rΔt)+股息−交易量×Sᵢ。股息以期初持仓×期初股价×q×Δt作左端点矩形近似，期末入账；空头股息为支出。净值=hS+B−V。负现金是借款；到期不再调仓，期权Delta留空。</p>`,'account')+details('为什么仍有对冲误差？','<p>连续时间理论使用连续调仓；这里仅在有限时点交易。路径的非线性变化与股息离散近似都会留下误差。三策略使用同一期权、初始权利金、利率、股息和股价路径，动态对冲未必在每条路径上最好。</p>','why');}
function prices(){const a=s(),p=a.p,v=data.now,pay=id==='pricing'&&a.mode==='payoff',greek=id==='dividend'&&a.mode==='greek';const toggle=id==='pricing'?switches('mode',[['price','理论价格'],['payoff','到期支付']],a.mode):switches('mode',[['price','价格影响'],['greek','Greeks敏感性']],a.mode);let chart=greek?C.price(p,a.type,a.greek):C.prices(p,{payoff:pay,dividend:id==='dividend'});const key={delta:a.type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:a.type==='P'?'thetaP':'thetaC'}[a.greek];return toggle+`<p class="zf-intro">${pay?'到期时，买方有利才行权；支付尚未减去权利金，不能当作投资利润。':id==='pricing'?'直接改变股价，比较两种买卖权利的理论价格。蓝色为Call，棕色为Put。':greek?'一次观察一种局部敏感度，其他条件保持固定。':'拖动股息q或波动率σ，立即观察两类理论价格。蓝色Call，棕色Put。'}</p>`+chartControls()+figure(chart)+facts(greek?[[a.greek+' 当前值',F(v[key])]]:[['Call '+(pay?'到期支付':'理论价格'),F(pay?Math.max(p.S-p.K,0):v.C)],['Put '+(pay?'到期支付':'理论价格'),F(pay?Math.max(p.K-p.S,0):v.P)]])+`<p id="tuInsight" class="tu-insight">${pay?'到期支付不等于购买期权后的净利润；这里S是情景到期股价，支付未扣权利金与资金时间价值。':greek?{delta:'Delta是股价局部变化时的价格敏感度，不是上涨概率。',gamma:'Gamma衡量Delta随股价变化的速度。',vega:'Vega显示波动率每增加1个百分点时的局部价格变化；原始导数为此值的100倍。',theta:'Theta按每天显示：−期限导数÷365；在不同条件下未必为负。'}[a.greek]+greekChange():id==='pricing'?priceInsight():`当前q=${F(p.q*100,2)}%、σ=${F(p.sigma*100,2)}%。其他条件固定，提高q令Call非增、Put非减；提高波动率通常提高两类欧式期权价格。`}</p>`+
 details('为什么？',id==='pricing'?'<p>Call允许按执行价买入，股价更高时这项权利通常更值钱；Put允许按执行价卖出，方向相反。尚未到期还有未来机会，因此当前价格要考虑时间、波动率和贴现。到期支付与扣除成本后的利润不同。</p>':'<p>股息降低Se⁻ᑫᵀ这一调整后的标的项，所以Call下降、Put上升。波动更大增加极端有利结果的机会，买方仍可放弃不利行权。边界下价格变化可不严格；Greeks是局部近似。</p>','why')+
 details('数学、贴现与精确结果',`<div data-formula="price"></div><p>d₁=${F(v.d1,6)}，d₂=${F(v.d2,6)}；Φ为标准正态分布函数。股票项贴现Se⁻ᑫᵀ，执行价贴现Ke⁻ʳᵀ。</p><p>Call=${F(v.C,6)}，Put=${F(v.P,6)}；平价C−P=Se⁻ᑫᵀ−Ke⁻ʳᵀ=${F(v.A-v.D,6)}。T=0或σ=0调用原引擎边界分支，折点Greeks可能未定义。</p>`,'math');}
function chartControls(){if(id!=='dividend'||s().mode!=='greek')return '';return `<div class="zf-greek"><label>指标<select id="tuGreek">${['delta','gamma','vega','theta'].map(k=>`<option value="${k}" ${s().greek===k?'selected':''}>${k}</option>`).join('')}</select></label><label>期权<select id="tuType"><option value="C" ${s().type==='C'?'selected':''}>Call</option><option value="P" ${s().type==='P'?'selected':''}>Put</option></select></label></div>`;}
function implied(){const a=s(),p=a.p;let html=switches('method',[['bisection','二分法'],['newton','牛顿法'],['compare','算法比较']],a.method)+'<p class="zf-intro">寻找一个波动率，让BS理论价格接近给定的假设报价。这不是实际市场成交价，也不是已知的未来波动率。</p>';const res=data[a.method==='newton'?'newton':'bisection'],row=res.rows[a.time];html+=ivSummary(res)+figure(C.iteration(p,res,a.time));if(a.method==='compare')return html+`<table class="tu-table"><tr><th>方法</th><th>估计波动率</th><th>迭代次数</th><th>结果</th></tr>${Object.entries(data).map(([k,r])=>`<tr><th>${k==='bisection'?'二分法':'牛顿法'}</th><td>${r.sigma===null?'—':F(r.sigma*100)+'%'}</td><td>${r.iterations}</td><td>${r.converged?'成功':'失败'}</td></tr>${!r.converged?`<tr><td colspan="4">${esc(IVMath.reasons[r.status])}</td></tr>`:''}`).join('')}</table>`+details('精确误差与停止原因',Object.entries(data).map(([k,r])=>`<p>${k==='bisection'?'二分法':'牛顿法'}：${esc(IVMath.reasons[r.status])}；精确误差 ${r.error==null?'—':r.error.toExponential(8)} 元。</p>`).join(''),'iv-comparison')+'<p class="tu-insight">上图展示二分法的当前迭代，表格为各方法最终结果；两种纯算法均无隐藏回退，Newton并非对所有初值都更快。</p>';
 const failures=!res.converged?`<p class="tu-error" role="alert">算法终止：${esc(IVMath.reasons[res.status])}；${res.sigma==null?'无有限估计':'未将估计冒充收敛结果'}。</p>`:'';html+=failures+controls(Math.max(0,res.rows.length-1))+facts([['假设报价（元）',F(p.target,4)],['当前迭代估计',row?F(row.sigma*100)+'%':res.sigma===0?'0%（边界）':'—'],['本步理论价格（元）',row?F(row.theoreticalPrice,4):'—']])+`<p id="tuInsight" class="tu-insight">${row?(a.method==='bisection'?`当前区间 [${F(row.a*100,3)}%, ${F(row.b*100,3)}%]；用价格残差决定下一半区间。`:`切线使用对小数波动率的原始Vega ${F(row.vega,6)}；下一σ ${F(row.nextSigma==null?null:row.nextSigma*100)}%。`):esc(IVMath.reasons[res.status])}</p>`;
 return html+details('为什么？','<p>BS价格在常规条件下随波动率增加。二分法需要包围解的区间并逐次减半；Newton利用斜率外推，快慢与初值、Vega有关。报价处于无套利下界可对应σ=0，上界通常只有无限波动率极限；T=0不能反推出唯一IV。</p>','why')+details('迭代日志、公式与停止诊断',`<div data-formula="iv"></div><p>停止状态：${esc(IVMath.reasons[res.status])}；扩展 ${res.expansions} 次；容差 ${p.tol} 元；最大 ${p.maxIter} 步。价格上下界 [${F(res.lower,6)}, ${F(res.upper,6)}]。最终误差 ${res.error==null?'—':res.error.toExponential(6)}。</p><label>选择任意迭代<input id="tuTime" type="range" min="0" max="${Math.max(0,res.rows.length-1)}" value="${a.time}"></label><table class="tu-table"><tr><th>n</th><th>σ</th><th>价格残差</th><th>下一σ / 区间</th></tr>${res.rows.map((r,i)=>`<tr ${i===a.time?'class="selected"':''}><td><button data-iteration="${i}">${i+1}</button></td><td>${F(r.sigma,6)}</td><td>${r.signedError.toExponential(4)}</td><td>${a.method==='newton'?F(r.nextSigma,6):F(r.nextA,6)+' / '+F(r.nextB,6)}</td></tr>`).join('')}</table>`,'iterations');}
function controls(n){return `<div class="tu-play"><button id="tuPrevTime" ${s().time===0?'disabled':''}>${id==='iv'?'上次迭代':'上一期'}</button><span>${s().time} / ${n}</span><button id="tuNextTime" ${s().time>=n?'disabled':''}>${id==='iv'?'下一次迭代':'下一期'}</button><button id="tuPlay" ${n===0?'disabled':''}>${timer!==null?'暂停':id==='iv'?'开始求解':'播放'}</button><button id="tuResetTime">重置</button></div><p id="tuMotion" role="status"></p>`;}
function maxTime(){return id==='hedge'?s().p.N:id==='iv'?Math.max(0,data[s().method==='newton'?'newton':'bisection'].rows.length-1):0;}
function challengeData(){return {
 hedge:{question:'默认Call案例，S从100涨到105元且剩余期限不变，原持仓还能保持Delta中性吗？',choices:[['same','仍能，原数量不用变'],['change','不能，需重新计算数量']],correct:'change',explanation:'同源引擎：旧Delta约0.6368，新Delta约0.7237，需增加约0.0869单位；原股票不会自动调整。'},
 pricing:{question:'固定其他条件，提高股价，Call与Put价格怎样变化？',choices:[['upDown','Call非减、Put非增'],['downUp','Call非增、Put非减']],correct:'upDown',explanation:'Call是按执行价买入的权利，Put是按执行价卖出的权利，二者对股价的局部敏感度方向相反。'},
 dividend:{question:'固定其他条件，增加连续股息q，Call与Put价格怎样变化？',choices:[['downUp','Call非增、Put非减'],['upDown','Call非减、Put非增']],correct:'downUp',explanation:'q提高使Se⁻ᑫᵀ下降。另可固定q，将σ提高10个百分点比较：两类欧式期权价格通常提高，边界可能不严格变化。'},
 iv:{question:'默认平价案例，Newton初值30%会比二分法迭代更少吗？',choices:[['faster','默认案例是，但不能推广到所有初值'],['always','任何初值都会更快']],correct:'faster',explanation:'默认同源计算：二分28步，Newton4步。Newton依赖初值与足够Vega，其他条件下可能越界或失败；纯算法没有隐藏回退。'}
}[id];}
function challenge(){const q=challengeData();return details('课堂挑战（可选）',`<p>${q.question}</p><div class="tu-choices">${q.choices.map(([v,t])=>`<button data-choice="${v}" aria-pressed="${s().challenge===v}">${t}</button>`).join('')}</div><button id="tuChallengeExplain">查看挑战解释</button><p id="tuChallengeFeedback">可以先预测，再自由修改参数验证；模型始终可用。${id==='hedge'?'另一个卖方情景：默认Call到期股价120元，支付义务是多少？初始权利金减到期支付（忽略利息）又是多少？这与完整账户终值不同。':''}</p>`,'challenge');}
function renderParams(){const a=s(),p=a.p,desc={S:['股票价格 S（元）',.01,1e5],K:['执行价格 K（元）',.01,1e5],T:['期限 T（年）',id==='hedge'?.0001:0,10],r:['利率 r（小数）',-.1,.3],q:['股息 q（小数）',0,1],sigma:['波动率 σ（小数）',0,2],N:['路径步数 N',1,504],interval:['每隔几期调仓',1,504],seed:['随机种子',0,2147483646],target:['假设期权报价（元）',0,1e5],initial:['Newton初值（小数）',1e-8,1e6],tol:['价格容差（元）',1e-12,.01],maxIter:['最大迭代次数',1,200]};let primary,adv;
 if(id==='hedge'&&a.mode==='cancel'){primary=['S','K','type','sigma'];adv=['T','r','q'];}else if(id==='hedge'){primary=['interval','N'];adv=['seed','S','K','type','sigma','T','r','q'];}else if(id==='pricing'){primary=['S','K','T','r','sigma'];adv=['q'];}else if(id==='dividend'){primary=['q','sigma'];adv=['S','K','T','r'];}else{primary=['target','type',...(a.method==='newton'?['initial']:[])];adv=['S','K','T','r','q',...(a.method==='newton'?[]:['initial']),'tol','maxIter'];}
 const field=k=>k==='type'?`<label data-tu-field="type">期权类型<select id="tu-p-type" data-key="type"><option value="C" ${p.type==='C'?'selected':''}>Call 看涨</option><option value="P" ${p.type==='P'?'selected':''}>Put 看跌</option></select></label>`:`<label data-tu-field="${k}">${desc[k][0]}<input id="tu-p-${k}" data-key="${k}" type="number" min="${desc[k][1]}" max="${desc[k][2]}" step="${['N','interval','seed','maxIter'].includes(k)?1:'any'}" value="${Number.isFinite(p[k])?(k==='target'?F(p[k],4):p[k]):''}"></label>${(id==='hedge'&&a.mode==='cancel'&&k==='S')||id==='dividend'&&['q','sigma'].includes(k)?`<input id="tu-slider-${k}" aria-label="拖动${desc[k][0]}" data-key="${k}" type="range" min="${k==='S'?Math.max(.01,Math.min(p.S*.8,a.baseline.S*.8)):0}" max="${k==='S'?Math.min(1e5,Math.max(p.S*1.2,a.baseline.S*1.2)):k==='q'?Math.max(.1,p.q):Math.max(.6,p.sigma)}" step="${k==='S'?.1:.001}" value="${p[k]}">`:''}`;
 $('#tuParams').innerHTML=`<h3>${id==='hedge'&&a.mode==='dynamic'?'路径与调仓设置':'核心参数'}</h3>${primary.map(field).join('')}${details('更多参数',adv.map(field).join(''),'advanced')}<button id="tuDefaults">恢复默认条件</button><p class="tu-note">${id==='hedge'&&a.mode==='dynamic'?'调仓间隔越小，调整越频繁，但不保证每条路径结果更好。修改条件立即重算；只改间隔保持同一路径。':'参数改变立即更新，无需提交。数值按小数输入：0.2=20%。'}</p>`;}
function priceInsight(){const a=s(),c=a.lastChange,why={S:'股价更高使按执行价买入的权利更值钱，Call通常变贵；Put通常变便宜。',K:'执行价改变买卖权利的约定成交价，Call与Put价格的变化方向通常相反。',sigma:'更大波动增加有利结果的可能性；买方仍可放弃不利行权，因此两类欧式期权通常更值钱。',q:'股息改变股票贴现项Se⁻ᑫᵀ；其他条件固定，q提高使Call非增、Put非减。',r:'利率改变执行价贴现；其他条件固定，r提高通常使Call非减、Put非增。',T:'剩余期限同时改变未来机会、贴现和股息效应；具体方向由当前参数决定。'};if(!c)return '其他条件固定时，股价更高使按执行价买入股票的权利更值钱，Call通常变贵；按执行价卖出的Put通常变便宜。';return `${c.key}：${F(c.from)}→${F(a.p[c.key])}，Call ${F(c.before.C)}→${F(data.now.C)}，Put ${F(c.before.P)}→${F(data.now.P)}。${why[c.key]||''}`;}
function greekChange(){const a=s(),c=a.lastChange;if(!c||!['q','sigma','S','T','r','K'].includes(c.key))return '';const key={delta:a.type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:a.type==='P'?'thetaP':'thetaC'}[a.greek];return ` 本次${c.key}由${F(c.from)}改为${F(a.p[c.key])}，${a.greek}从${F(c.before[key],6)}变为${F(data.now[key],6)}；该方向来自当前参数的实际计算，不能推广为所有条件下单调变化。`;}
function ivSummary(res){return `<section id="tuIVResult" class="iv-final" aria-live="polite"><span>${s().method==='compare'?'二分法最终结果':s().method==='newton'?'牛顿法最终结果':'二分法最终结果'}</span><strong>${res.converged?`该假设报价对应的隐含波动率约为 ${F(res.sigma*100,2)}%`:'求解失败：'+esc(IVMath.reasons[res.status])}</strong><small>${res.converged?`共${res.iterations}次迭代；`+(Math.abs(res.error)<.0001?'价格误差小于0.0001元':'达到设定价格容差'):'未将中间估计标为成功；可修改参数重试。'}${s().method!=='compare'?'紫色点表示当前迭代估计，与最终结果区分。':''}</small></section>`;}
let codeRows=[];
function semantic(){const a=s(),p=a.p,k=codeRows[a.line]?.kind||'overview',v=id==='hedge'?M.bs({...Z.core(p),S:data.r?.S??p.S,T:data.r?.tau??p.T}):id==='iv'?M.bs({...p,sigma:data[a.method==='newton'?'newton':'bisection'].rows[a.time]?.sigma??0},true):data?.now;let text='',formula='',value='',fields=[],mark='';
 const financial={d1:['标准化距离 d₁','对数价差和含股息漂移除以总波动幅度；适用于正期限、正波动率。',String.raw`d_1=\frac{\ln(S/K)+(r-q+\sigma^2/2)T}{\sigma\sqrt T}`,`d₁=${F(v?.d1,6)}`,['S','K','T','r','q','sigma'],'d1'],d2:['标准化距离 d₂','从d₁减去σ√T，进入执行价项的风险中性权重。',String.raw`d_2=d_1-\sigma\sqrt T`,`d₂=${F(v?.d2,6)}`,['sigma','T'],'d2'],call:['Call价格','按执行价买入的权利：股息调整的股票项减去贴现执行价项。',String.raw`C=Se^{-qT}\Phi(d_1)-Ke^{-rT}\Phi(d_2)`,`Call=${F(v?.C,6)} 元`,['S','K','q','r'],'call'],put:['Put价格','按执行价卖出的权利；负d值的正态权重对应另一侧到期事件。',String.raw`P=Ke^{-rT}\Phi(-d_2)-Se^{-qT}\Phi(-d_1)`,`Put=${F(v?.P,6)} 元`,['S','K','q','r'],'put'],delta:['Delta · 局部价格敏感度','不是上涨概率。含股息Call的Delta在0与exp(−qT)之间，Put在−exp(−qT)与0之间。',String.raw`\Delta_C=e^{-qT}\Phi(d_1),\quad\Delta_P=e^{-qT}(\Phi(d_1)-1)`,`Call Δ=${F(v?.deltaC,6)}；Put Δ=${F(v?.deltaP,6)}`,['S','q'],'delta'],gamma:['Gamma · Delta的变化速度','衡量股价局部变化时Delta如何改变，Call与Put相同。',String.raw`\Gamma=\frac{e^{-qT}\phi(d_1)}{S\sigma\sqrt T}`,`Gamma=${F(v?.gamma,6)}（1/元）`,['S','sigma','q'],'gamma'],vega:['Vega · 波动率敏感度',id==='iv'?'Newton需要对小数波动率的原始Vega；不能用每1个百分点值直接代替。':'显示值为每1个百分点的价格敏感度，等于对小数波动率导数除以100。',String.raw`Vega_{1pp}=Se^{-qT}\phi(d_1)\sqrt T/100`,`Vega=${F(v?.vega,6)} 元/1百分点`,['sigma','q'],'vega'],theta:['Theta · 时间敏感度','以自然日为单位：负期限导数再除以365；可能为正，不能直接当作已实现隔夜损益。',String.raw`\Theta_{day}=-(\partial V/\partial T)/365`,`Call=${F(v?.thetaC,6)}；Put=${F(v?.thetaP,6)} 元/日`,['T','q','r'],'theta'],discount_stock:['股息调整的标的项','q为连续比例股息，小数0.05表示5%；股息贴现降低股票现值项。',String.raw`A=Se^{-qT}`,`A=${F(v?.A,6)}`,['q','S','T'],'discount_stock'],discount_strike:['执行价贴现','r为连续复利年利率，将执行价换算为当前现值。',String.raw`D=Ke^{-rT}`,`D=${F(v?.D,6)}`,['r','K','T'],'discount_strike']};
 if(financial[k]&&!(id==='iv'&&k==='vega'))return{title:financial[k][0],text:financial[k][1],formula:financial[k][2],value:financial[k][3],fields:financial[k][4],mark:financial[k][5]};
 if(id==='hedge'){const r=data.r,h=data.current.delta;const map={shares:['目标股票持仓','当前目标数量等于期权Delta，负数代表卖空；计算目标并不等于已执行交易。',String.raw`h=\Delta`,`当前目标=${F(h,6)}，初始=${F(a.baseline.delta,6)}`,'shares'],net_delta:['当前目标风险抵消','卖方期权Delta取负；目标股票与之抵消。原持仓未调时的净Delta仍可能非零。',String.raw`\Delta_{net}=-\Delta+h`,`目标净Delta=0；原持仓净Delta=${F(a.baseline.delta-h,6)}`,'net'],initial:['初始持仓与调整需求','初始实际持仓不会随股价自动变化。目标减去初始数量才是需要进一步交易的数量。',String.raw`Q=h_{target}-h_{initial}`,`需交易=${F(h-a.baseline.delta,6)} 单位`,'shares'],cash:['自融资现金账户','买入股票支付现金，卖出收回现金；负现金为借款，不等于已经亏损。',String.raw`B_i=B_{before}-Q_i S_i`,r?`本期现金=${F(r.cash,6)}，交易现金流=${F(r.tradeCash,6)}`:`新建账户B₀=${F(data.current.price-h*p.S,6)}`,'cash'],rebalance:['按间隔调仓','只有动态策略在预设时点更新持仓；到期不再调仓。交易量为新旧持仓之差。',String.raw`Q_i=h_i-h_{i-1}`,r?`第${a.time}期，实际持仓=${F(r.holding,6)}；交易=${F(r.quantity,6)}`:'切换动态调仓可逐期观察。','shares'],net:['卖方组合净价值','股票加现金再减期权负债。当前值与期末清算结果不同，尚未到期不是已实现利润。',String.raw`\Pi_i=h_iS_i+B_i-V_i`,r?`当前净值=${F(r.net,6)} 元`:'新建账户初始净值=0','net'],interest:['现金利息','余额按相同无风险利率复利；借款余额承担利息。',String.raw`I_i=B_{i-1}(e^{r\Delta t}-1)`,r?`利息=${F(r.interest,6)}`:'','cash'],dividend:['股票股息','期初持仓×期初价格×q×Δt作左端点近似，期末入账；空头为支出。',String.raw`D_i=h_{i-1}qS_{i-1}\Delta t`,r?`股息=${F(r.dividend,6)}`:'','cash']};if(map[k])return{title:map[k][0],text:map[k][1],formula:map[k][2],value:map[k][3],fields:[],mark:map[k][4]};}
 if(id==='iv'&&['error','newton','midpoint','tolerance','vega','overview'].includes(k)){const row=data[a.method==='newton'?'newton':'bisection'].rows[a.time];return{title:{error:'定价残差',newton:'Newton切线更新',midpoint:'二分区间中点',tolerance:'收敛与停止',vega:'原始Vega',overview:'由假设报价反求波动率'}[k],text:'寻找使BS价格减报价为零的σ。二分法保持包围区间，纯Newton使用原始Vega；容差、低Vega和失败原因都保留。',formula:k==='vega'?String.raw`Vega_{raw}=Se^{-qT}\phi(d_1)\sqrt T`:k==='newton'?String.raw`\sigma_{n+1}=\sigma_n-f(\sigma_n)/Vega_{raw}`:String.raw`f(\sigma)=BS(\sigma)-P_{quote}`,value:row?`当前σ=${F(row.sigma,6)}；残差=${row.signedError.toExponential(6)}；raw Vega=${F(row.vega,6)}`:'当前边界没有有效迭代轨迹。',fields:['target','initial','tol'],mark:'iteration'};}
 const basic=k==='validation'?'此行验证输入范围或账户平衡，没有直接对应的曲线高亮。':k==='parameters'?'按当前网页参数生成；利率、股息与波动率使用小数，0.2表示20%。':k==='helper'||k==='comment'?'辅助定义、循环或输出行；选择金融计算语句可查看对应公式。':id==='dividend'?(a.mode==='greek'?`${a.greek}曲线表示局部敏感度，q和σ变化会同步改变当前指标；Vega按每1百分点、Theta按每日。`:'含股息定价与敏感性：q提高改变股票贴现项，当前代码输出两类价格及Greeks。'):id==='hedge'?'先计算Delta目标，再用股票与现金建立自融资账户；当前目标与历史实际持仓分别展示。':'BS使用含股息的贴现项与正态权重计算Call和Put；到期支付另行展示。';return{title:k==='validation'?'输入或账户校验':k==='parameters'?'当前参数与单位':'当前模块的金融逻辑',text:basic,formula:'',value:substitution(),fields:[],mark:''};}
function renderCode(){if(!active||!data)return;const a=s(),full=a.codeMode==='full';codeRows=Z.rows(id,a,TeachingCode.wrap);const sc=a.line<0?0:$('#tuCodeLines')?.scrollTop||0,mathOpen=$('[data-details=code-math]')?.open,sem=semantic();
 $('#tuCode').innerHTML=`<div class="tu-codebar"><button data-code-mode="full" aria-pressed="${full}">完整代码</button><button data-code-mode="point" aria-pressed="${!full}">关键逻辑</button></div><p class="tu-code-notice">${full?'完整独立脚本 · 基础R，无额外包':'关键片段供阅读；主复制始终提供完整独立脚本'}</p><div class="tu-copybar"><button id="tuCopyFull">复制完整 R 代码</button><button id="tuPractice">RStudio 实践</button></div><div class="tu-code-regions"><div id="tuCodeLines" tabindex="0">${codeRows.map((row,i)=>`<button class="code-line ${a.line===i?'selected':''}" data-line="${i}" data-semantic="${row.kind}" aria-pressed="${a.line===i}"><span class="num">${i+1}</span><code>${WorkbenchUI.colorCode(row.text)||' '}</code></button>`).join('')}</div><section id="tuCodeExplain"><h3>${sem.title}</h3><p>${sem.text}</p>${details('数学与当前代入','<div id="tuFormula"></div><p>'+sem.value+'</p>','code-math')}</section></div><p id="tuCopyStatus" role="status"></p>`;$('#tuCodeLines').scrollTop=sc;if(mathOpen)$('[data-details=code-math]').open=true;if(sem.formula)katex.render(sem.formula,$('#tuFormula'),{throwOnError:false});document.querySelectorAll('[data-formula]').forEach(el=>katex.render(el.dataset.formula==='delta'?String.raw`\Delta_C=e^{-qT}\Phi(d_1),\quad\Delta_P=e^{-qT}(\Phi(d_1)-1)`:el.dataset.formula==='iv'?String.raw`\sigma_{n+1}=\sigma_n-f(\sigma_n)/Vega_{raw}`:String.raw`C=Se^{-qT}\Phi(d_1)-Ke^{-rT}\Phi(d_2)`,el,{throwOnError:false}));link();}
function substitution(){if(id==='hedge')return s().mode==='cancel'?`Delta=${F(data.current.delta,6)}，初始股票=${F(s().baseline.delta,6)}，当前目标=${F(data.current.delta,6)}。`:`第${s().time}期：持仓=${F(data.r.holding,6)}，现金=${F(data.r.cash,6)}，净值=${F(data.r.net,6)}。`;if(id==='iv'){const row=data[s().method==='newton'?'newton':'bisection'].rows[s().time];return row?`σ=${F(row.sigma,6)}；价格=${F(row.theoreticalPrice,6)}；误差=${row.signedError.toExponential(6)}。`:'本边界没有有效迭代轨迹。';}return`Call=${F(data.now.C,6)}，Put=${F(data.now.P,6)}；q=${s().p.q}，σ=${s().p.sigma}。`;}
function link(){const sem=semantic(),fig=$('#tuFigure');fig?.removeAttribute('data-code-focus');fig?.classList.remove('tu-linked');if(sem.mark)fig?.setAttribute('data-code-focus',sem.mark);document.querySelectorAll('[data-tu-field]').forEach(el=>el.classList.toggle('linked',sem.fields.includes(el.dataset.tuField)));}
async function copy(full){if(!data)return;const code=D.formatR(Z.script(id,s(),full),TeachingCode.wrap);try{await navigator.clipboard.writeText(code);$('#tuCopyStatus').textContent='已复制可独立运行的R脚本（包含当前参数和必要上下文）。';}catch{const url=URL.createObjectURL(new Blob([code],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=id+(full?'-full':'-basic')+'.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#tuCopyStatus').textContent='已下载独立R脚本。';}}
function practice(){$('#infoTitle').textContent='RStudio 独立实践';$('#infoBody').textContent='新建R Script，点击“复制完整 R 代码”并整段运行；网页本身不执行R。\n当前可核对结果：'+substitution()+'\n'+(id==='hedge'?'完整模拟默认seed2027、N60、interval1时三策略终值约为10.968223、7.714696、−0.179013元。保持seed和N不变，仅修改interval，比较同路径误差并解释为何未必单调改善。':id==='iv'?'默认教学假设报价约10.4506元（代码保留完整精度）应反解约20%。修改Newton初值，观察是否收敛及停止原因。':'只修改一个参数，比较两类价格，再解释变化方向。');ModalUI.open($('#infoDialog'));}
return{mount,open,full(){expert=true;open(id);}};
})();

;

/* Source: lab-stats.js */
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

;

/* Source: lab-csv.js */
/* Deterministic CSV ingestion and cleaning engine for experiment 02.
   Every step is explicit and logged: nothing is silently repaired, dropped or
   filled, and the log is what the R script reproduces line by line. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LabCSV=api;})(this,()=>{
'use strict';
const NA_TOKENS=new Set(['','na','n/a','n.a.','null','nil','nan','-','--','—','.','#n/a']);
const DEFAULT_OPTIONS=Object.freeze({delimiter:'auto',dateColumn:0,missing:'drop',outlier:'none',outlierAction:'flag',z:3,iqr:1.5,scale:'decimal',dedupe:true,sort:true,resample:'none',long:false,winsor:.05});
function detectDelimiter(line){const counts=[[',',line.split(',').length],[';',line.split(';').length],['\t',line.split('\t').length]];counts.sort((a,b)=>b[1]-a[1]);return counts[0][1]>1?counts[0][0]:',';}
/* RFC4180-style reader; keeps every row so the audit log can name bad ones. */
function parse(text,{delimiter='auto'}={}){
  if(typeof text!=='string')throw Error('CSV 内容须为文本。/ CSV content must be text.');
  if(text.length>4000000)throw Error('CSV 超过 4MB 上限。/ CSV exceeds the 4 MB limit.');
  let body=text.replace(/^\uFEFF/,'');
  const firstBreak=body.search(/\r?\n/),head=body.slice(0,firstBreak<0?body.length:firstBreak);
  const delim=delimiter==='auto'?detectDelimiter(head):delimiter;
  const rows=[];let row=[],cell='',quoted=false,badQuote=0;
  for(let i=0;i<body.length;i++){
    const c=body[i];
    if(c==='"'){
      if(quoted&&body[i+1]==='"'){cell+='"';i++;}
      else if(quoted){quoted=false;}
      else if(cell.trim()===''){quoted=true;}
      else badQuote++;
    }else if(c===delim&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&body[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('CSV 第 '+(rows.length+1)+' 行引号未闭合。/ Unterminated quote in the CSV.');
  row.push(cell);rows.push(row);
  const kept=rows.filter(r=>r.some(x=>String(x).trim()!==''));
  const header=(kept.shift()||[]).map((h,i)=>{const v=String(h).trim().replace(/^"|"$/g,'');return v||'column'+(i+1);});
  return{header,rows:kept.map(r=>{const out=r.slice(0,header.length);while(out.length<header.length)out.push('');return out.map(x=>String(x).trim());}),delimiter:delim,badQuote,lineCount:rows.length};
}
function parseDate(raw){
  const s=String(raw).trim();if(!s)return null;
  let m;
  if((m=/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s)))return iso(+m[1],+m[2],+m[3]);
  if((m=/^(\d{4})(\d{2})(\d{2})$/.exec(s)))return iso(+m[1],+m[2],+m[3]);
  if((m=/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s)))return iso(+m[3],+m[2],+m[1]);
  if((m=/^(\d{4})[-/.](\d{1,2})$/.exec(s)))return iso(+m[1],+m[2],1);
  return null;
  function iso(y,mo,d){if(!(y>=1900&&y<=2200)||!(mo>=1&&mo<=12)||!(d>=1&&d<=31))return null;const t=new Date(Date.UTC(y,mo-1,d));return t.getUTCMonth()!==mo-1||t.getUTCDate()!==d?null:t.toISOString().slice(0,10);}
}
const isMissing=v=>NA_TOKENS.has(String(v).trim().toLowerCase());
function toNumber(raw,{scale='decimal'}={}){
  if(isMissing(raw))return null;
  let s=String(raw).trim().replace(/,/g,'').replace(/\s/g,'');
  let pct=false;
  if(/%$/.test(s)){pct=true;s=s.slice(0,-1);}
  if(!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(s))return null;
  const v=Number(s);
  if(!Number.isFinite(v))return null;
  return (pct?v/100:v)/(scale==='percent'?100:1);
}
function monthKey(date){return date.slice(0,7);}
function weekKey(date){const t=Date.parse(date+'T00:00:00Z');const day=(new Date(t).getUTCDay()+6)%7;return new Date(t+(3-day)*86400000).toISOString().slice(0,10);}
function quantileOf(a,p){const x=[...a].sort((u,v)=>u-v),h=(x.length-1)*p,lo=Math.floor(h),hi=Math.min(lo+1,x.length-1);return x[lo]+(x[hi]-x[lo])*(h-lo);}
/* Column diagnostics drive the "before" panel: type, missing share, outliers. */
function profile(header,rows){
  return header.map((name,j)=>{
    const values=rows.map(r=>r[j]),nonEmpty=values.filter(v=>!isMissing(v));
    const dates=nonEmpty.map(parseDate),numeric=nonEmpty.map(v=>toNumber(v));
    const dateOk=nonEmpty.length>0&&dates.every(Boolean),numOk=nonEmpty.length>0&&numeric.every(v=>v!==null);
    return{name,index:j,type:dateOk?'date':numOk?'number':'text',missing:values.length-nonEmpty.length,total:values.length,examples:nonEmpty.slice(0,3)};
  });
}
/* One pass over the raw table. Returns the cleaned matrix plus a step log whose
   entries are structured (`code` + numbers) so the UI can phrase them in either
   language without re-deriving anything. */
function clean(text,options={}){
  const o={...DEFAULT_OPTIONS,...options};
  const parsed=parse(text,{delimiter:o.delimiter});
  const headers=parsed.header,rows=parsed.rows,log=[];
  if(headers.length<2)throw Error('至少需要两列：日期列与一个数值列。/ At least two columns are required.');
  const profileBefore=profile(headers,rows);
  log.push({code:'parse',rows:rows.length,columns:headers.length,delimiter:parsed.delimiter,quoted:parsed.badQuote});
  if(!Number.isInteger(o.dateColumn)||o.dateColumn<0||o.dateColumn>=headers.length)throw Error('日期列索引超出范围。/ Date column index out of range.');
  const valueCols=headers.map((n,i)=>i).filter(i=>i!==o.dateColumn&&profileBefore[i].type!=='text');
  const textCols=headers.map((n,i)=>i).filter(i=>i!==o.dateColumn&&profileBefore[i].type==='text');
  if(!valueCols.length)throw Error('除日期列外没有可识别的数值列。/ No numeric column besides the date column.');
  /* 1. dates */
  const badDates=[];
  let work=rows.map((r,i)=>{const date=parseDate(r[o.dateColumn]);if(!date)badDates.push({row:i+2,raw:r[o.dateColumn]});return{date,raw:r,index:i+2};});
  if(badDates.length)throw Error('第 '+(badDates[0].row)+' 行的日期无法解析：'+(badDates[0].raw||'（空）')+'。请先修正或在清洗日志中核对格式。/ Unparseable date on data row '+badDates[0].row+'.');
  log.push({code:'dates',count:work.length,column:headers[o.dateColumn]});
  /* 2. duplicates */
  let duplicates=0;
  if(o.dedupe){const seen=new Set();work=work.filter(w=>{if(seen.has(w.date)){duplicates++;return false;}seen.add(w.date);return true;});}
  if(duplicates)log.push({code:'dedupe',dropped:duplicates});
  /* 3. sort */
  if(o.sort)work=[...work].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(o.sort)log.push({code:'sort'});
  /* 4. resample to the last observation of each calendar period */
  if(o.resample!=='none'){
    const key=w=>o.resample==='month'?monthKey(w.date):weekKey(w.date);
    const groups=new Map();
    for(const w of work){const k=key(w);if(!groups.has(k)||groups.get(k).date<w.date)groups.set(k,w);}
    const before=work.length;work=[...groups.values()].sort((a,b)=>a.date<b.date?-1:1);
    log.push({code:'resample',mode:o.resample,from:before,to:work.length});
  }
  /* 5. numeric conversion, missing policy, then outliers */
  const missingCells=[];
  let matrix=work.map(w=>valueCols.map((j,k)=>{
    const v=toNumber(w.raw[j],{scale:o.scale});
    if(v===null)missingCells.push({date:w.date,column:headers[j]});
    return v;
  }));
  if(missingCells.length&&o.missing==='reject')throw Error('存在 '+(missingCells.length)+' 个缺失值（首个：'+missingCells[0].date+' · '+missingCells[0].column+'）。请选择删除或前值填充策略。/ '+missingCells.length+' missing values found.');
  if(missingCells.length)log.push({code:'missing',count:missingCells.length,strategy:o.missing,first:missingCells[0]&&{date:missingCells[0].date,column:missingCells[0].column}});
  const datesBeforeMissing=work.map(w=>w.date);
  if(missingCells.length&&o.missing==='drop'){
    const keep=matrix.map(r=>r.every(v=>v!==null));
    matrix=matrix.filter((_,i)=>keep[i]);work=work.filter((_,i)=>keep[i]);
    log.push({code:'missing.drop',dropped:keep.filter(x=>!x).length});
  }else if(missingCells.length&&(o.missing==='ffill'||o.missing==='zero')){
    let carried=0,zeroed=0;
    for(let i=0;i<matrix.length;i++)for(let j=0;j<matrix[i].length;j++)if(matrix[i][j]===null){
      if(o.missing==='ffill'&&i>0&&matrix[i-1][j]!==null){matrix[i][j]=matrix[i-1][j];carried++;}
      else{matrix[i][j]=0;zeroed++;}
    }
    log.push({code:'missing.fill',carried,zeroed});
  }
  /* 6. outliers, flagged as (row,column) pairs before any action */
  const flags=[];
  if(o.outlier!=='none'){
    const n=matrix.length;
    for(let j=0;j<valueCols.length;j++){
      const col=matrix.map(r=>r[j]).filter(v=>Number.isFinite(v));
      if(col.length<8)continue;
      const m=col.reduce((s,v)=>s+v,0)/col.length,sd=Math.sqrt(col.reduce((s,v)=>s+(v-m)**2,0)/(col.length-1));
      const q1=quantileOf(col,.25),q3=quantileOf(col,.75),iqr=q3-q1,med=quantileOf(col,.5),mad=quantileOf(col.map(v=>Math.abs(v-med)),.5)*1.4826;
      for(let i=0;i<n;i++){
        const v=matrix[i][j];if(!Number.isFinite(v))continue;
        let score=null;
        if(o.outlier==='z'&&sd>0)score=Math.abs(v-m)/sd;
        if(o.outlier==='iqr'&&iqr>0)score=Math.max((v-q3)/(o.iqr*iqr),(q1-v)/(o.iqr*iqr));
        if(o.outlier==='mad'&&mad>0)score=Math.abs(v-med)/(o.iqr*mad);
        if(score!==null&&score>1)flags.push({row:i,column:j,value:v,score,date:work[i].date});
      }
    }
    log.push({code:'outlier',method:o.outlier,count:flags.length});
    if(flags.length&&o.outlierAction==='winsorize'){
      const byCol=new Map();for(const f of flags){if(!byCol.has(f.column))byCol.set(f.column,[]);byCol.get(f.column).push(f.row);}
      for(const [j,list] of byCol){const col=matrix.map(r=>r[j]).filter(Number.isFinite).sort((a,b)=>a-b);const lo=quantileOf(col,o.winsor),hi=quantileOf(col,1-o.winsor);for(const i of list)matrix[i][j]=Math.min(hi,Math.max(lo,matrix[i][j]));}
      log.push({code:'outlier.winsor',count:flags.length,winsor:o.winsor});
    }else if(flags.length&&o.outlierAction==='drop'){
      const drop=new Set(flags.map(f=>f.row));
      matrix=matrix.filter((_,i)=>!drop.has(i));work=work.filter((_,i)=>!drop.has(i));
      log.push({code:'outlier.drop',dropped:drop.size});
    }
  }
  /* 7. long format is an output shape, never a second source of truth */
  const names=valueCols.map(j=>headers[j]);
  let long=null;
  if(o.long)long=work.flatMap((w,i)=>names.map((name,j)=>({date:w.date,asset:name,value:matrix[i][j]})));
  const dates=work.map(w=>w.date);
  const summary={rawRows:rows.length,keptRows:matrix.length,dropped:rows.length-matrix.length,duplicates,missing:missingCells.length,outliers:flags.length,assets:names.length,from:dates[0]||null,to:dates[dates.length-1]||null,textColumns:textCols.map(j=>headers[j])};
  return{names,dates,matrix,long,flags,missingCells,log,summary,profileBefore,profileAfter:valueCols.map((j,k)=>({name:headers[j],missing:matrix.filter(r=>!Number.isFinite(r[k])).length,total:matrix.length})),source:{delimiter:parsed.delimiter,rows:rows.length,columns:headers.length,badQuote:parsed.badQuote,skippedDates:badDates.length,datesBeforeMissing}};
}
/* Convert a cleaned matrix back to wide CSV text (export and R hand-off). */
function toCSV({names,dates,matrix},dateName='date'){
  const lines=[[dateName,...names].join(',')];
  matrix.forEach((r,i)=>lines.push([dates[i],...r.map(v=>Number.isFinite(v)?String(v):'')].join(',')));
  return lines.join('\n')+'\n';
}
/* Simple returns from a wide price matrix, ready for the diagnostics panel. */
function returnsOf(matrix){
  return matrix.slice(1).map((row,i)=>row.map((v,j)=>matrix[i][j]>0&&Number.isFinite(v)?v/matrix[i][j]-1:null));
}
return{parse,parseDate,toNumber,isMissing,profile,clean,toCSV,returnsOf,quantileOf,monthKey,weekKey,DEFAULT_OPTIONS,NA_TOKENS:[...NA_TOKENS]};});

;

/* Source: lab-kit.js */
/* Shared three-pane shell for the five course-foundation labs.
   Language contract: every user-visible string goes through t(zh,en) and the
   whole pane is re-rendered on `finmodel:langchange`, so Chinese and English
   are both first-class and neither leaves residue in the other. */
(()=>{'use strict';
const W=()=>window.WorkbenchUI;
const esc=s=>W().esc(String(s));
const lang=()=>document.documentElement.getAttribute('data-lang')==='en'?'en':'zh';
const t=(zh,en)=>lang()==='en'&&en!=null?en:zh;
const listeners=[];
document.addEventListener('finmodel:langchange',()=>{for(const fn of listeners){try{fn();}catch(e){console.error(e);}}});
function onLang(fn){listeners.push(fn);return fn;}
const $=s=>document.querySelector(s);
const fmt=(v,d=4)=>Number.isFinite(v)?Number(v.toPrecision(d)).toString():'—';
const pct=(v,d=2)=>Number.isFinite(v)?(v*100).toFixed(d)+'%':'—';
const num=(v,d=4)=>Number.isFinite(v)?Number(v).toFixed(d):'—';
const money=(v,d=2)=>Number.isFinite(v)?Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const sign=v=>Number.isFinite(v)?(v>=0?'+':'−'):'—';
const pad=n=>String(n).padStart(2,'0');

/* ---------- top tabs, question line and view-level controls ---------- */
function views(host,list,active,onPick){
  const nav=document.createElement('nav');
  let current=active;
  nav.className='lab-tabs';nav.setAttribute('aria-label',t('实验主视图','Experiment views'));
  nav.innerHTML=list.map(([k,zh,en])=>`<button type="button" data-view="${esc(k)}" aria-pressed="${k===active}">${esc(t(zh,en))}</button>`).join('');
  host.after(nav);
  nav.onclick=e=>{const b=e.target.closest('[data-view]');if(b&&b.dataset.view!==current){current=b.dataset.view;onPick(b.dataset.view);}};
  const question=document.createElement('p');question.className='lab-question';nav.after(question);
  const controls=document.createElement('div');controls.className='lab-view-controls';question.after(controls);
  const api={nav,question,controls,setQuestion:(zh,en)=>{question.textContent=t(zh,en);},setActive:k=>nav.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===k))),
    refresh:(list,active)=>{current=active;nav.setAttribute('aria-label',t('实验主视图','Experiment views'));nav.innerHTML=list.map(([k,zh,en])=>`<button type="button" data-view="${esc(k)}" aria-pressed="${k===active}">${esc(t(zh,en))}</button>`).join('');}};
  return api;
}
/* ---------- parameter pane primitives ---------- */
function field({id,zh,en,value,min,max,step,type='number',unit}){
  if(type==='range')return `<label for="lab-${id}"><span>${esc(t(zh,en))}</span><input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step||'any'}" value="${value}"></label>`;
  return `<label for="lab-${id}"><span>${esc(t(zh,en))}${unit?` <small class="lab-unit">${esc(t(...unit))}</small>`:''}</span><input id="lab-${id}" type="number" min="${min??''}" max="${max??''}" step="${step||'any'}" value="${value}"></label>`;
}
function select({id,zh,en,value,options}){
  return `<label for="lab-${id}"><span>${esc(t(zh,en))}</span><select id="lab-${id}">${options.map(([v,z,e])=>`<option value="${esc(v)}"${String(v)===String(value)?' selected':''}>${esc(t(z,e))}</option>`).join('')}</select></label>`;
}
function check({id,zh,en,value}){
  return `<label class="lab-check" for="lab-${id}"><input id="lab-${id}" type="checkbox"${value?' checked':''}><span>${esc(t(zh,en))}</span></label>`;
}
const prose=(zh,en)=>`<p class="lab-prose">${esc(t(zh,en))}</p>`;
const note=(zh,en)=>`<p class="lab-note">${esc(t(zh,en))}</p>`;
const badge=(zh,en,kind='ai')=>`<span class="lab-badge lab-badge-${kind}">${esc(t(zh,en))}</span>`;
function block(titleZh,titleEn,body){return `<section class="lab-block"><h3>${esc(t(titleZh,titleEn))}</h3>${body}</section>`;}
function tasks(items){return `<details class="lab-tasks"><summary>${esc(t('教学任务','Teaching tasks'))}</summary><ol>${items.map(([z,e])=>`<li>${esc(t(z,e))}</li>`).join('')}</ol></details>`;}
function assumptions(summary,detail){
  const box=$('#assumptionSummary');if(box)box.innerHTML=summary.map(s=>`<span>${esc(t(...s))}</span>`).join('');
  const text=$('#assumptions');if(text)text.textContent=t(...detail);
  const det=$('#assumptionDetails');if(det)det.querySelector('summary').textContent=t('查看完整模型假设','Full modelling assumptions');
}

/* ---------- R code pane ---------- */
function blocksHTML(blocks,active,onPick){
  let n=0;
  const html=blocks.map(b=>`<div class="logic-block" data-logic="${esc(b.key)}">${b.lines.map((line,i)=>`<button class="code-line${b.key===active?' selected':''}" data-semantic="${esc(b.key)}" data-line="${i}"><span class="num">${++n}</span><code>${W().colorCode(line)}</code></button>`).join('')}</div>`).join('');
  return html;
}
function code(blocks,active,onChange){
  const host=$('#code');const scroll=host.scrollTop;
  host.innerHTML=blocksHTML(blocks,active);
  host.scrollTop=scroll;
  host.querySelectorAll('[data-semantic]').forEach(btn=>{btn.onclick=()=>{const key=btn.dataset.semantic;if(key===active)return;if(onChange)onChange(key);else{code(blocks,key);}};});
  explain(blocks.find(b=>b.key===active)||blocks[0]);
  return active;
}
function explain(b){
  if(!b)return;
  const host=$('#explanation');
  const pair=v=>Array.isArray(v)?t(v[0],v[1]):(v==null?'':String(v));
  const title=pair(b.title),action=pair(b.action),value=pair(b.value),econ=pair(b.economic||b.explain);
  host.innerHTML=`<h3>${esc(title)}</h3><p>${esc(action||econ)}</p><div class="formula"></div>${value?`<p class="current-value">${esc(value)}</p>`:''}${b.economic?`<p class="economic">${esc(t('金融含义：','Finance meaning: '))}${esc(econ)}</p>`:''}`;
  if(b.formula&&window.katex){try{window.katex.render(b.formula,host.querySelector('.formula'),{throwOnError:false,displayMode:false});}catch{host.querySelector('.formula').textContent=b.formula;}}
  return host;
}

/* ---------- model pane pieces ---------- */
const metrics=items=>{const host=$('#metrics');host.innerHTML=items.map(([z,e,v])=>`<div><span>${esc(t(z,e))}</span><b>${esc(v)}</b></div>`).join('');return host;};
function table(headers,rows,{classes={},caption}={}){
  return `<table>${caption?`<caption>${esc(t(...caption))}</caption>`:''}<thead><tr>${headers.map(h=>`<th scope="col">${esc(t(...h))}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr${r.cls?` class="${r.cls}"`:''}>${(Array.isArray(r)?r:r.cells).map((c,i)=>i===0?`<th scope="row">${c}</th>`:`<td${classes[i]?` class="${classes[i]}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function legend(items){const host=$('#legend');host.innerHTML=items.map(([z,e,color,dash])=>`<span><i style="--legend-color:${color};--legend-style:${dash?'dashed':'solid'}"></i>${esc(t(z,e))}</span>`).join('');return host;}
const details=html=>{const host=$('#details');host.innerHTML=html;return host;};
const graphKind=(zh,en)=>{const el=$('#graphKind');if(el)el.textContent=t(zh,en);};

/* ---------- chart engine: one SVG contract for every new lab ---------- */
let controller=null;
function tip(){let el=document.querySelector('#labTip');if(el&&el.isConnected)return el;el=document.createElement('div');el.id='labTip';el.className='chart-tooltip';el.hidden=true;const host=document.querySelector('#chartHost')||document.querySelector('.model-panel')||document.body;host.append(el);return el;}
function interaction(){
  if(controller)return controller;
  controller=window.ChartInteraction.create((key,mode)=>{
    const el=tip();
    if(!key){el.hidden=true;el.dataset.mode='closed';return;}
    el.hidden=false;el.dataset.mode=mode;
    el.innerHTML=(mode==='pinned'?`<button id="labTipClose" aria-label="${esc(t('关闭详情','Close details'))}">×</button>`:'')+key;
    if(mode==='pinned')el.querySelector('#labTipClose').onclick=()=>controller.clear();
  });
  return controller;
}
const PALETTE=['#6689a8','#9b88ac','#659b8a','#4e718e','#b5816f','#7f9182'];
/* ticks are computed on the padded domain, so labels always sit inside the plot */
function niceTicks(lo,hi,count=5){
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||lo===hi)return [lo];
  const raw=(hi-lo)/count,base=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(x=>x*base).find(x=>x>=raw)||base*10;
  const out=[];for(let x=Math.ceil(lo/step)*step;x<=hi+step*1e-9;x+=step)out.push(Math.abs(x)<step*1e-8?0:x);return out;
}
function chart(host,spec){
  const W0=600,H=385,l=66,r=20,tp=18,b=52;
  const series=(spec.series||[]).filter(s=>s.points&&s.points.length);
  if(!series.length){host.innerHTML='';return null;}
  const xs=series.flatMap(s=>s.points.map(p=>p[0])),ys=series.flatMap(s=>s.points.map(p=>p[1]));
  const refs=spec.refs||[];
  let xlo=Math.min(...xs),xhi=Math.max(...xs),ylo=Math.min(...ys),yhi=Math.max(...ys);
  for(const rf of refs)if(rf.axis==='y'&&Number.isFinite(rf.value)){ylo=Math.min(ylo,rf.value);yhi=Math.max(yhi,rf.value);}
  if(!Number.isFinite(xlo)||!Number.isFinite(ylo)){host.innerHTML='';return null;}
  if(spec.xDomain){[xlo,xhi]=spec.xDomain;}else{const d=(xhi-xlo)||Math.abs(xlo)||1;xlo-=d*.04;xhi+=d*.04;}
  if(spec.yDomain){[ylo,yhi]=spec.yDomain;}else{const d=(yhi-ylo)||Math.abs(ylo)||1;ylo-=d*.10;yhi+=d*.10;}
  if(spec.yZero){ylo=Math.min(ylo,0);yhi=Math.max(yhi,0);}
  const sx=x=>l+(x-xlo)/(xhi-xlo||1)*(W0-l-r),sy=y=>H-b-(y-ylo)/(yhi-ylo||1)*(H-b-tp);
  const xf=spec.xTickFormat||(v=>fmt(v,4)),yf=spec.yTickFormat||(v=>fmt(v,3));
  const xt=niceTicks(xlo,xhi,spec.xTicks||5),yt=niceTicks(ylo,yhi,spec.yTicks||5);
  const marks=[];
  let svg=`<svg viewBox="0 0 ${W0} ${H}" role="img" aria-label="${esc(t(...(spec.aria||[spec.title||'图表','Chart'])))}">`;
  for(const bd of spec.bands||[]){const x0=sx(bd.from),x1=sx(bd.to);svg+=`<rect x="${Math.min(x0,x1)}" y="${tp}" width="${Math.abs(x1-x0)}" height="${H-b-tp}" fill="${bd.color||'#eef3f6'}" opacity=".75"/>`;}
  for(const v of yt)svg+=`<path class="chart-grid" d="M${l},${sy(v)}H${W0-r}"/><text x="${l-8}" y="${sy(v)+4}" text-anchor="end">${esc(yf(v))}</text>`;
  for(const v of xt)svg+=`<text x="${sx(v)}" y="${H-b+18}" text-anchor="middle">${esc(xf(v))}</text>`;
  svg+=`<path d="M${l},${H-b}H${W0-r}" stroke="#b9c7cf" fill="none"/>`;
  if(spec.yZero&&ylo<0&&yhi>0)svg+=`<path d="M${l},${sy(0)}H${W0-r}" stroke="#c3ced5" stroke-dasharray="3 3" fill="none"/>`;
  for(const rf of refs){
    if(rf.axis==='x')svg+=`<path d="M${sx(rf.value)},${tp}V${H-b}" stroke="${rf.color||'#9b88ac'}" stroke-dasharray="${rf.dash===false?'':'4 4'}" fill="none"/>`;
    else svg+=`<path d="M${l},${sy(rf.value)}H${W0-r}" stroke="${rf.color||'#9b88ac'}" stroke-dasharray="${rf.dash===false?'':'4 4'}" fill="none"/>`;
  }
  series.forEach((s,si)=>{
    const color=s.color||PALETTE[si%PALETTE.length];
    if(s.type==='bar'){
      const gapX=s.points.length>1?Math.abs(s.points[1][0]-s.points[0][0]):(xhi-xlo)/10;
      const w=s.width||Math.max(1.2,Math.abs(sx(s.points[0][0]+gapX)-sx(s.points[0][0]))*(s.gap??.82));
      s.points.forEach((p,i)=>{
        svg+=`<rect class="lab-bar" data-series="${si}" x="${sx(p[0])-w/2}" y="${Math.min(sy(0),sy(p[1]))}" width="${w}" height="${Math.max(1,Math.abs(sy(p[1])-sy(0)))}" fill="${color}" opacity="${s.opacity??.9}" tabindex="0" role="button" aria-label="${esc(s.tip?t(...s.tip(p)):yf(p[1]))}"/>`;
        if(s.tip)marks.push({sel:`rect.lab-bar[data-series="${si}"]`,i:marks.filter(m=>m.sel===`rect.lab-bar[data-series="${si}"]`).length,html:t(...s.tip(p))});
      });
    }else if(s.type==='scatter'||s.type==='points'){
      s.points.forEach((p,i)=>{
        svg+=`<circle class="lab-point" data-series="${si}" cx="${sx(p[0])}" cy="${sy(p[1])}" r="${s.radius||3.4}" fill="${color}" opacity="${s.opacity??.85}" tabindex="0" role="button" aria-label="${esc(s.tip?t(...s.tip(p)):fmt(p[1]))}"/>`;
        if(s.tip)marks.push({sel:`circle.lab-point[data-series="${si}"]`,i:marks.filter(m=>m.sel===`circle.lab-point[data-series="${si}"]`).length,html:t(...s.tip(p))});
      });

    }else{
      let d='';
      s.points.forEach((p,i)=>{const X=sx(p[0]),Y=sy(p[1]);d+=i===0?`M${X},${Y}`:s.type==='step'?`H${X}V${Y}`:`L${X},${Y}`;});
      if(s.type==='area'&&s.points.length)d+=`L${sx(s.points[s.points.length-1][0])},${sy(s.zero??0)}L${sx(s.points[0][0])},${sy(s.zero??0)}Z`;
      svg+=`<path class="lab-line" d="${d}" fill="${s.type==='area'?(s.fill||'#e8eef2'):'none'}" stroke="${s.type==='area'?'none':color}" stroke-width="${s.width||2}" stroke-dasharray="${s.dash?'5 4':''}" stroke-linejoin="round" stroke-linecap="round"/>`;
      if(s.tip){const stride=Math.max(1,Math.ceil(s.points.length/120));s.points.forEach((p,i)=>{if(i%stride)return;svg+=`<circle class="lab-hit" cx="${sx(p[0])}" cy="${sy(p[1])}" r="4.5" fill="${color}" opacity="0" tabindex="0" role="button" aria-label="${esc(t(...s.tip(p)))}"/>`;marks.push({sel:`circle.lab-hit[data-series="${si}"]`,i:marks.filter(m=>m.sel===`circle.lab-hit[data-series="${si}"]`).length,html:t(...s.tip(p))});});}
    }
  });
  for(const rf of refs)if(rf.label)svg+=`<text x="${rf.axis==='y'?l+6:sx(rf.value)+4}" y="${rf.axis==='y'?sy(rf.value)-5:tp+10}" fill="${rf.color||'#9b88ac'}" font-size="11">${esc(t(rf.label[0],rf.label[1]))}</text>`;
  if(spec.xLabel)svg+=`<text class="axis-caption" x="${(l+W0-r)/2}" y="${H-12}" text-anchor="middle">${esc(t(...spec.xLabel))}</text>`;
  if(spec.yLabel)svg+=`<text class="axis-caption" transform="translate(16 ${(tp+H-b)/2}) rotate(-90)" text-anchor="middle">${esc(t(...spec.yLabel))}</text>`;
  host.innerHTML=svg+'</svg>';
  const ctrl=interaction();ctrl.clear();
  if(marks.length){
    const groups=new Map();
    for(const m of marks){if(!groups.has(m.sel))groups.set(m.sel,[]);groups.get(m.sel).push(m);}
    for(const [sel,list] of groups){host.querySelectorAll(sel).forEach((el,i)=>{const m=list[i];if(m)ctrl.bind(el,m.html);});}
  }
  return{sx,sy,xt,yt,host};
}
/* Dependency-free pipeline diagram used by 01 and 02. */
function flow(host,steps,active){
  const n=steps.length,w=600,h=Math.min(200,86+18*Math.ceil(n/3)),bw=(600-40-(n-1)*10)/n;
  let svg=`<svg viewBox="0 0 600 ${h}" role="img" aria-label="${esc(t('处理流程','Pipeline'))}">`;
  steps.forEach((st,i)=>{
    const x=20+i*(bw+10),y=30,on=i===active;
    svg+=`<rect x="${x}" y="${y}" width="${bw}" height="70" rx="10" fill="${on?'#e9e8f1':'#f4f7f9'}" stroke="${on?'#8c80a3':'#dce5e9'}"/>`;
    svg+=`<text x="${x+bw/2}" y="${y+26}" text-anchor="middle" font-size="12" fill="${on?'#4b4166':'#596e7c'}">${esc(t(st[0],st[1]))}</text>`;
    if(st[2])svg+=`<text x="${x+bw/2}" y="${y+48}" text-anchor="middle" font-size="11" fill="#7d8f9b">${esc(st[2])}</text>`;
    if(i<n-1)svg+=`<path d="M${x+bw+1},${y+35}h8" stroke="#b9c7cf" stroke-width="1.5" marker-end="url(#labArrow)"/>`;
  });
  svg+=`<defs><marker id="labArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#b9c7cf"/></marker></defs>`;
  svg+=`<text x="300" y="${h-14}" text-anchor="middle" font-size="11" fill="#7d8f9b">${esc(t('当前步骤高亮；每一步都在清洗日志中留痕','The current step is highlighted; every step is logged'))}</text></svg>`;
  host.innerHTML=svg;return host;
}

/* ---------- page chrome: dialogs, copy, splitter, projector ---------- */
const toast=text=>{const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600);};
function info(title,body){$('#infoTitle').textContent=title;$('#infoBody').textContent=body;window.ModalUI.open($('#infoDialog'));}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function chrome({getCode,onReset,onMode,teacher,help,practice,fileName}){
  for(const id of ['#catalog','#catalogMobile']){const b=$(id);if(b)b.onclick=()=>window.ModalUI.open($('#catalogDialog'));}
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $('#help').onclick=()=>info(t('帮助与资源','Help & resources'),t(...help));
  $('#teacher').onclick=()=>info(t('教师提示','Teacher notes'),t(...teacher));
  $('#copy').onclick=async()=>{
    const text=getCode();
    try{await navigator.clipboard.writeText(text);toast(t('已复制完整 R 代码，可在 RStudio 整段运行','Full R code copied — run it end to end in RStudio'));}
    catch{download(fileName||'finmodel-lab.R',text);toast(t('剪贴板不可用，已下载 R 脚本','Clipboard unavailable — the R script was downloaded'));}
  };
  document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{if(b.disabled)return;onMode(b.dataset.codeMode);});
  let practiceBtn=$('#rStudioPractice');
  if(!practiceBtn){practiceBtn=document.createElement('button');practiceBtn.id='rStudioPractice';practiceBtn.textContent=t('RStudio 实践','RStudio practice');$('.code-toolbar').append(practiceBtn);}
  practiceBtn.onclick=()=>info(t('在 RStudio 实践','Practice in RStudio'),t(...practice));
  $('#projector').onclick=()=>{const on=!document.body.classList.contains('projector');document.body.classList.toggle('projector',on);$('#projector').setAttribute('aria-pressed',String(on));};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){document.body.classList.remove('projector');$('#projector').setAttribute('aria-pressed','false');}});
  const splitter=$('#splitter');let share=62;
  const resize=v=>{share=Math.max(40,Math.min(75,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',(100-share)+'fr');splitter.setAttribute('aria-valuenow',share);};
  splitter.onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();resize(e.key==='Home'?40:e.key==='End'?75:share+(e.key==='ArrowDown'?2:-2));}};
  splitter.onpointerdown=e=>{splitter.setPointerCapture(e.pointerId);const y=e.clientY,start=share,h=$('.code-regions').clientHeight;splitter.onpointermove=ev=>resize(start+(ev.clientY-y)/h*100);splitter.onpointerup=()=>{splitter.onpointermove=null;};};
  $('#reset').onclick=()=>onReset();
  if($('#assumptionDetails'))$('#assumptionDetails').ontoggle=()=>{const s=$('#assumptionDetails summary');s.textContent=$('#assumptionDetails').open?t('收起完整模型假设','Hide full assumptions'):t('查看完整模型假设','Full modelling assumptions');};
}
function modeButtons(mode,{basic=true}={}){
  document.querySelectorAll('[data-code-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.codeMode===mode));if(b.dataset.codeMode==='basic')b.disabled=!basic;});
}
const notice=text=>{$('#codeNotice').textContent=text;};
const view=()=>({nav:0});
/* The mount contract every lab honours: body flag, course chrome, hidden quiz. */
function start(id,cls){
  window.CourseExperiments.mount(id);
  document.body.classList.add(cls);
  const learning=document.querySelector('.learning');if(learning)learning.hidden=true;
  document.querySelectorAll('[data-code-mode]').forEach(b=>{if(b.dataset.codeMode==='basic')b.disabled=true;});
  window.ChartInteraction?.clear();
}
window.LabKit={t,lang,onLang,esc,fmt,pct,num,money,sign,pad,views,field,select,check,prose,note,badge,block,tasks,assumptions,code,explain,metrics,table,legend,details,graphKind,chart,flow,toast,info,download,chrome,modeButtons,notice,start,interaction};
})();

;

/* Source: lab-runner.js */
/* Shared driver for the course-foundation labs (02/03/10/12).
   A lab supplies a descriptor; the runner owns the page chrome, the language
   contract, the parameter pane, validation, the code pane and the copy button. */
(()=>{'use strict';
const K=window.LabKit,$=s=>document.querySelector(s);
function mount(lab){
  K.start(lab.id,lab.cls);
  let p=lab.defaults(),view=lab.views[0][0],mode='full',active=null,built=null,q=null;
  $('#chartHost').className='chart-host single-chart';
  $('#chartHost').innerHTML='<div class="chart-frame"><h3></h3><div class="svg-host"></div></div>';
  const svgHost=()=>$('#chartHost .svg-host'),frameTitle=()=>$('#chartHost .chart-frame h3');
  const tabs=K.views($('.model-panel .panel-head'),lab.views,view,k=>{view=k;active=null;render(true);});
  const env={...K,K,svgHost,frameTitle,go:k=>{view=k;render(true);},setView:k=>{view=k;}};
  function paramsHTML(){
    $('#inputs').innerHTML=lab.params(p,view,env)+
      (lab.tasks?K.tasks(lab.tasks(view,env)):K.tasks([['先预测再改参数，把差异写进实验记录。','Predict first, then change a parameter and record the difference.'],['复制完整 R 脚本到 RStudio 整段运行，核对与本页一致的数值。','Copy the full script into RStudio and check the numbers against this page.']]));
  }
  function readParams(){
    const next={...p};
    for(const el of $('#inputs').querySelectorAll('input,select,textarea')){
      const id=el.id.replace(/^lab-/,'');
      if(el.type==='file')continue;
      if(el.type==='checkbox'){next[id]=el.checked;continue;}
      if(el.tagName==='TEXTAREA'||el.dataset.kind==='text'){next[id]=el.value;continue;}
      if(el.tagName==='SELECT'){next[id]=/^-?\d+(\.\d+)?$/.test(el.value)?Number(el.value):el.value;continue;}
      if(el.value.trim()==='')throw Error(K.t('请输入数值：','Enter a number: ')+el.closest('label').querySelector('span').textContent);
      next[id]=Number(el.value);
    }
    lab.check(next);
    return next;
  }
  function render(rebuild=false){
    if(rebuild)paramsHTML();
    try{p=readParams();$('#validation').textContent='';}
    catch(e){$('#validation').textContent=e.message;return;}
    tabs.refresh(lab.views,view);
    const question=lab.question(view,env);
    tabs.setQuestion(question[0],question[1]);
    tabs.setActive(view);
    K.assumptions(lab.summary(view,env),lab.assumptions(view,env));
    try{q=lab.compute(p,view,env);}catch(e){$('#validation').textContent=e.message;return;}
    try{lab.metrics(q,p,view,env);}catch(e){}
    try{frameTitle().textContent=K.t(...lab.chartTitle(q,p,view,env));lab.chart(q,p,view,env);}catch(e){svgHost().innerHTML=`<p class="lab-note" style="padding:16px">${K.esc(e.message)}</p>`;}
    try{lab.legend(q,p,view,env);}catch(e){}
    try{K.details(lab.details(q,p,view,env));}catch(e){$('#details').textContent=e.message;}
    const kind=lab.graphKind(view,env);K.graphKind(kind[0],kind[1]);
    built=lab.code(p,view,mode,K.lang());
    if(!built.blocks.some(b=>b.key===active))active=built.blocks[0].key;
    active=K.code(built.blocks,active,key=>{active=key;renderCode();});
    K.modeButtons(mode,{basic:lab.basic!==false});
    K.notice(mode==='basic'?K.t('关键逻辑：可独立运行的最小脚本','Key logic: the smallest standalone script'):K.t('完整脚本：含检查、输出与绘图','Full script: checks, output and plotting'));
    return q;
  }
  function renderCode(){
    if(!built)return;
    active=K.code(built.blocks,active,key=>{active=key;renderCode();});
  }
  K.onLang(()=>render(true));
  $('#inputs').addEventListener('input',()=>render(false));
  $('#inputs').addEventListener('change',e=>{
    if(e.target.type==='file'&&lab.onFile){lab.onFile(e.target,text=>{p={...p,csv:text};render(true);});return;}
    render(false);
  });
  K.chrome({
    getCode:()=>lab.code(p,view,'full',K.lang()).code,
    onReset:()=>{p=lab.defaults();active=null;render(true);},
    onMode:m=>{mode=m;render(false);},
    teacher:lab.teacher,help:lab.help,practice:lab.practice,fileName:lab.fileName
  });
  render(true);
  window[lab.global]={snapshot:()=>({lab:lab.id,view,p:JSON.parse(JSON.stringify(p)),mode,code:lab.code(p,view,'full',K.lang()).code.slice(0,120)})};
}
window.LabRunner={mount};
})();

;

/* Source: rbasic-math.js */
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

;

/* Source: rbasic-code.js */
/* Experiment01 R script builder. Every view produces one standalone base-R
   script that runs in a fresh session; comments follow the active UI language. */
(function(root,factory){const api=factory(typeof module==='object'?require('./rbasic-math'):root.RBasicMath);if(typeof module==='object')module.exports=api;else root.RBasicCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(12).replace(/0+e/,'e'):s;};
function vec(values,per=8){
  const parts=values.map(v=>v===null?'NA_real_':num(v));
  const lines=[];for(let i=0;i<parts.length;i+=per)lines.push('  '+parts.slice(i,i+per).join(', '));
  return 'c(\n'+lines.join(',\n')+'\n)';
}
function build(p,view='struct',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];
  const add=(key,title,action,econ,lines,extra={})=>{const b={key,title,action,economic:econ,lines,core:extra.core!==false,...extra};blocks.push(b);return b;};
  const header=T('# 实验01 · 基础 R 完整脚本：只需 base R，无需额外程序包','# Experiment 01 · complete base-R script: no extra packages required');

  if(view==='env'){
    const w=M.workspace(p);
    add('checks',[ '运行环境自检','Environment check'],
      ['先确认工作目录、R 版本与已加载的包，再开始计算。','Confirm the working directory, R version and loaded packages before computing.'],
      ['这一切是后续所有复现的前提。','This is the precondition for every later reproduction.'],
      [`${header}`,T('getwd()','getwd()'),T('# 当前工作目录：脚本里的相对路径都从它开始','# Current working directory: relative paths start here'),
       'sessionInfo()',T('# R 版本、平台和已加载的包；把这段输出保存到实验报告','# R version, platform and loaded packages; keep this output in the report')]);
    add('dirs',['目录与文件约定','Folders and file conventions'],
      ['把数据、脚本、结果、图片分目录存放，用相对路径引用。','Keep data, scripts, results and figures in separate folders and use relative paths.'],
      ['可重复的研究结构比"能跑一次"更重要。','A reproducible project structure matters more than a one-off run.'],
      [`dirs <- c(${w.dirs.map(d=>'"'+d+'"').join(', ')})`,
       T('# 只创建缺失的目录，重复运行安全','# Create only missing folders; safe to rerun'),
       'for (d in dirs) if (!dir.exists(d)) dir.create(d, showWarnings = FALSE)',
       'list.files()',T('# 核对四个目录都已存在','# Check that all four folders exist')]);
    add('seed',['随机种子与命名','Seeding and naming'],
      ['固定 seed，并用前缀区分数据对象与模型对象。','Fix the seed and use prefixes to separate data objects from model objects.'],
      ['同一 seed、同一版本 R 才可复现；换机器或换版本仍可能有细小差异。','Reproducibility holds for the same seed and the same R version; another machine or version may still differ.'],
      [`set.seed(${w.seed})`,T('# 与网页相同的种子；改种子会改变所有模拟结果','# Same seed as the page; changing it changes every simulation'),
       'd_demo <- data.frame(id = 1:5, y = c(2.1, 2.4, 3.0, 3.1, 3.6))',
       T('str(d_demo)                # 结构：5 行 2 列，两列都是数值','str(d_demo)                # Structure: 5 rows, 2 numeric columns')]);
    add('guard',['先检查，再计算','Check first, compute second'],
      ['用 stopifnot() 把前提写成可执行断言。','Turn assumptions into executable assertions with stopifnot().'],
      ['断言失败会立即停下，避免把错误结果当成结论。','A failed assertion stops the script instead of turning a wrong result into a conclusion.'],
      ['stopifnot(is.data.frame(d_demo), nrow(d_demo) == 5)',
       T('mean(d_demo$y)             # 2.84','mean(d_demo$y)             # 2.84'),
       T('# 若写成 mean(d_demo$z)，R 会报"对象不存在"，先用 names() 确认列名','# mean(d_demo$z) errors with "object not found"; check names() first'),
       'names(d_demo)']);
    add('flow',['会话流程','Session workflow'],
      ['六个步骤对应本实验的目录结构与后续每个实验。','Six steps map onto the folder layout and every later experiment.'],
      ['脚本按步骤拆文件，比一个巨型脚本更容易查错。','Splitting the script by step is easier to debug than one giant file.'],
      [T('# 步骤与文件一一对应','# One file per step'),...w.files.map((f,i)=>`# ${i+1}. ${f}`)]);
    if(mode==='full'){
      add('out',['结果落地','Persist the results'],
        ['表格写 CSV、图形写图片，文件名带日期或版本号。','Write tables to CSV and figures to image files, named with a date or version.'],
        ['只有落地的结果才能被复核。','Only persisted results can be re-checked.'],
        ['write.csv(d_demo, "output/demo.csv", row.names = FALSE)',
         T('# 图形设备：先打开再画，最后务必 dev.off()','# Graphics device: open, draw, then always dev.off()'),
         'png("figures/demo-scatter.png", width = 800, height = 600)',
         'plot(d_demo$id, d_demo$y, xlab = "id", ylab = "y", main = "Demo")',
         'dev.off()'],{core:false});
    }
  }

  if(view==='struct'){
    const s=M.structures(p);
    add('vector',['向量','Vector'],
      ['c() 把数值合并成一个向量；length/typeof 回答"多长、什么类型"。','c() combines values into one vector; length/typeof answer "how long, what type".'],
      ['向量是最小单位，矩阵、列表、数据框都建立在它之上。','The vector is the primitive; matrices, lists and data frames build on it.'],
      [`v <- ${vec(s.vector,6)}`,'length(v)',T('typeof(v)                  # "double"','typeof(v)                  # "double"'),'v[c(1, 3)]',T('v[v > 3]                   # 逻辑索引','v[v > 3]                   # Logical indexing')]).value=[`长度 ${s.vector.length} 的数值向量。`,`A numeric vector of length ${s.vector.length}.`];
    add('matrix',['矩阵','Matrix'],
      ['matrix() 用同一个向量按列或按行填充，dim 描述行列数。','matrix() recycles one vector by column or by row; dim gives the shape.'],
      ['矩阵运算（乘法、转置、求解）是投资组合与回归的底层工具。','Matrix algebra (product, transpose, solve) underlies portfolios and regression.'],
      [`m <- matrix(v, nrow = ${s.rows}, byrow = ${s.rows===1?'TRUE':'FALSE'})`,'dim(m)','m[1, ]',T('m[, 1]                     # 列索引','m[, 1]                     # Column index'),'t(m)']).value=[`${s.rows} × ${s.cols} 矩阵，元素个数 ${s.rows*s.cols}。`,`A ${s.rows} × ${s.cols} matrix holding ${s.rows*s.cols} cells.`];
    add('list',['列表','List'],
      ['list() 可以装不同类型、不同长度的对象，用 $ 或 [[ ]] 取。','list() holds objects of different types and lengths; extract with $ or [[ ]].'],
      ['模型输出（系数、残差、诊断）通常就是列表。','Model output (coefficients, residuals, diagnostics) is usually a list.'],
      [`l <- list(name = "${T('股票A','Asset A')}", ret = v, meta = list(n = ${s.vector.length}, src = "synthetic"))`,'str(l)','l$ret','l[["ret"]]',T('l[1]                       # 单方括号仍是列表','l[1]                       # Single bracket keeps a list')]).value=[`3 个元素：字符、数值向量、嵌套列表。`,`Three elements: character, numeric vector, nested list.`];
    add('frame',['数据框','Data frame'],
      ['data.frame() 是等长的"列"，每列可不同类型；这是金融数据最常见的形式。','data.frame() is a set of equal-length columns, each with its own type — the usual shape of financial data.'],
      ['列名、行数、类型都要在建模前确认。','Confirm column names, row count and types before modelling.'],
      [`df <- data.frame(date = as.Date(c(${s.df.map(d=>'"'+d.date+'"').join(', ')})),`,
       `  ret = c(${s.df.map(d=>num(d.ret)).join(', ')}),`,
       `  price = c(${s.df.map(d=>num(d.price)).join(', ')}))`,
       'str(df)','class(df)','names(df)',T('df$ret * 100                # 列向量运算','df$ret * 100                # Column arithmetic'),
       T('as.matrix(df["ret"])       # 只取数值列转矩阵','as.matrix(df["ret"])       # Numeric column to matrix')]).value=[`${s.df.length} 行 × 3 列：Date、numeric、numeric。`,`${s.df.length} rows × 3 columns: Date, numeric, numeric.`];
    add('print',['打印与检查','Printing and inspection'],
      ['head/str/summary 是快速体检；str 在类型错误时最先暴露问题。','head/str/summary are quick health checks; str exposes type mistakes first.'],
      ['不要只看第一位小数，先看结构和量纲。','Do not stare at the third decimal before checking structure and units.'],
      ['head(df, 2)','summary(df)','sapply(df, class)']);
  }

  if(view==='index'){
    const ix=M.indexing(p);
    add('build',['构造含缺失的向量','Build a vector with missing values'],
      ['NA 表示"不知道"，不是 0；它会在运算中传播。','NA means "unknown", not zero, and it propagates through arithmetic.'],
      ['把 NA 当 0 会系统性低估风险。','Treating NA as zero systematically understates risk.'],
      [`x <- ${vec(ix.vector,7)}`,'length(x)','sum(is.na(x))',T('# 缺失位置由参数决定；R 中 NA 的类型是 logical，可放进数值向量','# Positions follow the parameters; NA is logical but fits a numeric vector')]).value=[`${ix.naCount} 个缺失值，位置 ${ix.naIdx.join('、')}。`,`${ix.naCount} missing value(s) at position(s) ${ix.naIdx.join(', ')}.`];
    add('subset',['索引三件事','Three ways to index'],
      ['位置、负位置、逻辑向量是最常用的三种索引。','Position, negative position and logical vectors are the three common forms.'],
      ['逻辑索引会自动丢弃 NA，需单独检查。','Logical indexing silently drops NA, so check for it separately.'],
      ['x[2]',T('x[-2]                      # 删除第 2 个元素','x[-2]                      # Drop element 2'),`x[x > ${num(ix.threshold)}]`,
       'which(is.na(x))',T('# 逻辑索引返回 TRUE 的元素；which 返回位置','# Logical indexing returns the TRUE elements; which returns positions')]).value=[`大于 ${ix.threshold} 的元素有 ${ix.above} 个。`,`${ix.above} elements exceed ${ix.threshold}.`];
    add('mean',['缺失如何影响均值','How NA changes the mean'],
      ['mean(x) 遇到 NA 直接返回 NA，这是"不假装知道"的正确行为。','mean(x) returns NA, which is the correct "do not pretend to know" behaviour.'],
      ['na.rm = TRUE 是显式删除，必须在报告中写明。','na.rm = TRUE is an explicit deletion that must be stated in the report.'],
      ['mean(x)',T('# [1] NA','# [1] NA'),'mean(x, na.rm = TRUE)',`median(x, na.rm = TRUE)`]).value=[`mean(x) = NA；mean(x, na.rm = TRUE) = ${ix.meanNaRm.toFixed(6)}。`,`mean(x) = NA; mean(x, na.rm = TRUE) = ${ix.meanNaRm.toFixed(6)}.`];
    add('fill',['填补与其代价','Filling and its cost'],
      ['只有确认缺失机制可接受时才填补；填补前保留原始副本。','Fill only when the missingness mechanism allows it, and keep the original copy.'],
      ['用中位数填补会压低方差，必须同时报告填补比例。','Median imputation shrinks variance; always report the imputed share.'],
      ['x_original <- x',`x[is.na(x)] <- median(x, na.rm = TRUE)`,'mean(x)',T('# 填补后均值与删除缺失不同：填补保留了样本量，也引入了人为的集中','# The filled mean differs from the deletion mean: filling keeps n and injects artificial clustering')]).value=[`中位数 ${ix.median}，填补后均值 ${((ix.meanNaRm*ix.clean.length+ix.median*ix.naCount)/p.length).toFixed(6)}。`,`Median ${ix.median}; filled mean ${((ix.meanNaRm*ix.clean.length+ix.median*ix.naCount)/p.length).toFixed(6)}.`];
  }

  if(view==='func'){
    const mc=M.monteCarlo(p);
    add('params',['参数','Parameters'],
      ['把参数集中写在开头，改一处就能重跑全部。','Keep parameters at the top so one edit reruns everything.'],
      ['参数写死在函数体里，复用时会改错。','Hard-coded parameters get changed wrongly when the script is reused.'],
      [`mu <- ${num(p.mu)}`, `sigma <- ${num(p.sigma)}`, `n <- ${p.n}`, `B <- ${p.draws}`, `seed <- ${p.seed}`]).value=[`μ = ${p.mu}，σ = ${p.sigma}，n = ${p.n}，B = ${p.draws}。`,`μ = ${p.mu}, σ = ${p.sigma}, n = ${p.n}, B = ${p.draws}.`];
    add('fn',['函数','Functions'],
      ['函数把"输入—计算—输出"封装起来，参数有默认值。','A function wraps input → computation → output, with default arguments.'],
      ['可复用的函数比复制粘贴的代码更容易检查。','A reusable function is easier to check than copy-pasted code.'],
      [`sim_mean <- function(n, mu, sigma) {`,
       T('  total <- 0                    # 循环累加','  total <- 0                    # Accumulate in a loop'),
       '  for (i in 1:n) total <- total + rnorm(1, mu, sigma)',
       '  total / n',
       '}',
       `sim_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`]);
    add('vec',['循环与向量化','Loop versus vectorised code'],
      ['同一个估计量可以写成循环，也可以写成一次向量运算。','The same estimator can be a loop or a single vectorised call.'],
      ['两种写法结果相同，速度与可读性不同；向量化通常更快。','Both give the same number; they differ in speed and readability — vectorised is usually faster.'],
      ['vec_mean <- function(n, mu, sigma) mean(rnorm(n, mu, sigma))',
       `set.seed(${p.seed}); a <- sim_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`,
       `set.seed(${p.seed}); b <- vec_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`,
       T('identical(round(a, 12), round(b, 12))   # TRUE：同一随机流','identical(round(a, 12), round(b, 12))   # TRUE: same random stream')]);
    add('mc',['蒙特卡洛与收敛','Monte Carlo and convergence'],
      [`重复 ${p.draws} 次，观察累计均值如何逼近真值。`,`Repeat ${p.draws} times and watch the running mean approach the truth.`],
      ['单次估计会波动；累计均值随次数增加而收敛，但不会单调贴近真值。','One estimate fluctuates; the running mean converges but is not monotone.'],
      [T('# 与网页逐项一致的确定性样本（由固定种子生成）','# Deterministic sample identical to the page (fixed seed)'),
       `est <- ${vec(mc.draws,7)}`,
       'running <- cumsum(est) / seq_along(est)',
       `band <- 1.96 * ${num(p.sigma)} / sqrt(seq_along(est) * ${p.n})`,
       'tail(data.frame(b = seq_along(est), est = est, running = running), 3)']).value=[`累计均值终点 ${mc.final.toFixed(6)}，真值 μ = ${p.mu}。`,`Final running mean ${mc.final.toFixed(6)} against μ = ${p.mu}.`];
    if(mode==='full'){
      add('plot',['绘制收敛路径','Draw the convergence path'],
        ['用 type = "l" 画线，abline 加参考线。','Use type = "l" for a line and abline() for reference lines.'],
        ['图只表达一件事：累计均值围绕真值收窄。','The figure says one thing: the running mean narrows around the truth.'],
        ['plot(seq_along(est), running, type = "l", ylim = range(c(running, mu)),',
         '     xlab = "b", ylab = "running mean", main = "Monte Carlo convergence")',
         'abline(h = mu, lty = 2)',
         'lines(seq_along(est), mu + band, lty = 3)',
         'lines(seq_along(est), mu - band, lty = 3)'],{core:false});
    }
  }

  if(view==='plot'){
    const g=M.graphicsData(p);
    add('data',['固定合成收益序列','A fixed synthetic return series'],
      ['先画时间序列，看水平、波动与异常。','Plot the series first to see level, volatility and outliers.'],
      ['合成数据只用于教学，不代表任何真实行情。','Synthetic data is for teaching only and is not a market quote.'],
      [`r <- ${vec(g.returns.map(v=>Number(v.toPrecision(10))),6)}`,T('# 120 个月度简单收益，固定种子生成','# 120 monthly simple returns from a fixed seed'),'summary(r)']).value=[`均值 ${g.mean.toFixed(6)}，标准差 ${g.sd.toFixed(6)}。`,`Mean ${g.mean.toFixed(6)}, standard deviation ${g.sd.toFixed(6)}.`];
    add('stats',['描述统计','Descriptive statistics'],
      ['手写偏度与峰度，避免依赖额外程序包。','Compute skewness and kurtosis by hand to avoid extra packages.'],
      ['正态的偏度为 0、超额峰度为 0；金融收益常见尖峰厚尾。','A normal has zero skew and zero excess kurtosis; financial returns are usually leptokurtic.'],
      ['skew <- function(x) { n <- length(x); z <- (x - mean(x)) / sd(x)',
       '  n / ((n - 1) * (n - 2)) * sum(z^3) }',
       'kurt <- function(x) { n <- length(x); z <- (x - mean(x)) / sd(x)',
       '  n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * sum(z^4) - 3 * (n - 1) / (n - 2) }',
       'c(mean = mean(r), sd = sd(r), skew = skew(r), kurt = kurt(r))']).value=[`偏度 ${g.skew.toFixed(4)}，超额峰度 ${g.kurt.toFixed(4)}。`,`Skewness ${g.skew.toFixed(4)}, excess kurtosis ${g.kurt.toFixed(4)}.`];
    add('hist',['直方图','Histogram'],
      [`按 ${p.bins} 组画频率直方图，再叠加正态密度。`,`Bin into ${p.bins} groups and overlay the matching normal density.`],
      ['密度曲线用的是同样的均值与标准差，所以差异只来自形状。','The curve uses the same mean and standard deviation, so any gap comes from shape alone.'],
      [`hist(r, breaks = ${p.bins}, probability = TRUE,`,
       '     xlab = "return", ylab = "density", main = "Synthetic monthly returns")',
       'curve(dnorm(x, mean(r), sd(r)), add = TRUE, lty = 2)',
       T('# probability = TRUE 才是密度；否则纵轴是频数','# probability = TRUE gives density; otherwise the axis is counts')],{core:false});
    add('qq',['QQ 图与箱线图','QQ plot and box plot'],
      ['QQ 图把分位数与正态比较，两端偏离说明厚尾。','A QQ plot compares quantiles with the normal; tail departures mean fat tails.'],
      ['箱线图用 1.5 IQR 规则标出异常，这只是规则，不是错误。','The box plot flags points beyond 1.5 IQR — a convention, not an error.'],
      ['qqnorm(r); qqline(r)',T('boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")','boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")'),
       T(`# 本样本有 ${g.outliers} 个点超出 1.5 IQR 围栏`,'# '+g.outliers+' point(s) fall outside the 1.5 IQR fences')],{core:false});
  }

  if(view==='pkg'){
    add('declare',['先声明依赖','Declare dependencies first'],
      ['把需要的包写在脚本开头，并检查是否可用。','List required packages at the top and check availability.'],
      ['基础包随 R 安装，额外包需要单独安装。','Base packages ship with R; extra packages must be installed separately.'],
      ['needed <- c("stats", "graphics", "utils")',
       'installed <- vapply(needed, requireNamespace, logical(1), quietly = TRUE)',
       'installed',
       T('# vapply 对每个包返回 TRUE/FALSE，不加载也不报错','# vapply returns TRUE/FALSE per package without loading or erroring')]);
    add('extra',['额外包只检查不安装','Check extras without installing'],
      ['课堂上先确认镜像与版本，不要让脚本自动联网安装。','Confirm the mirror and version first; never let a teaching script install packages silently.'],
      ['依赖失败应当明确报错或明确降级，而不是继续算出错误结果。','A missing dependency should fail loudly or degrade explicitly — never compute a wrong number.'],
      ['extra <- c("zoo", "PerformanceAnalytics")',
       'has_extra <- vapply(extra, requireNamespace, logical(1), quietly = TRUE)',
       'has_extra',
       T('# 需要时再手动执行（示例）：','# Install manually when needed (example):'),
       '# install.packages("zoo")']);
    add('record',['记录环境','Record the environment'],
      ['packageVersion 与 sessionInfo 是复现实验的凭据。','packageVersion and sessionInfo are the receipts of a reproducible run.'],
      ['只写"已安装某包"不足以复现，版本同样重要。','"The package was installed" is not enough; the version matters too.'],
      ['packageVersion("stats")','search()','sessionInfo()',
       T('# 把这段输出附在实验报告里','# Attach this output to the lab report')]);
  }

  if(view==='ai'){
    const a=M.ai(p);
    add('draft',['AI 生成的草稿','The AI-generated draft'],
      ['生成代码看起来能跑，但有三处会误导结论。','The generated code runs, yet three things would mislead the conclusion.'],
      ['把 AI 输出当"待审查草稿"，不是最终答案。','Treat AI output as a draft to review, never as the final answer.'],
      [T('# 草稿原文（保持原样，便于逐条比对）','# The draft, verbatim, for item-by-item review'),
       ...a.draft.slice(0,4).map(([zh,en])=>'# '+T(zh,en).replace(/^# /,'')),
       T('# 直接运行会在第 2 行失败：绝对路径只对生成者的电脑有效','# Running it as-is fails on line 2: the absolute path only exists on the generator machine'),
       T('# 下面用同结构的数据复现三处问题','# The same three problems, reproduced on a small in-line vector'),
       'ann_return <- function(r) mean(r) * 252',
       'r <- c(0.012, NA, -0.004, 0.021)',
       T('ann_return(r)                     # NA：缺失值没有被处理','ann_return(r)                     # NA: the missing value was not handled'),
       T('# T <- ann_return(r) 会覆盖 TRUE，不推荐；仅演示为什么不能用 T 命名','# T <- ann_return(r) overwrites TRUE; shown only to explain why T is a bad name')]
      ).value=[T('返回 NA：缺失值没有被处理。','Returns NA: the missing value was never handled.')];
    add('fixed',['审查后的版本','The reviewed version'],
      ['显式处理缺失、显式声明年化口径、显式检查输入。','Handle missing values, declare the annualisation basis and validate the input explicitly.'],
      ['每一步审查都要能说出"为什么"，并写进报告留痕。','Every review step needs a stated reason, recorded in the report.'],
      [...a.fixed.map(([zh,en])=>T(zh,en))]).value=[`年化 ${a.annual.toFixed(4)}；按月 ${a.monthly.toFixed(4)}。`,`Annualised ${a.annual.toFixed(4)}; monthly ${a.monthly.toFixed(4)}.`];
    add('checklist',['审查清单','Review checklist'],
      ['五条检查对应五类常见错误，逐条核对。','Five checks cover the five common failure modes.'],
      ['审查记录本身就是实验的一部分。','The review record is itself part of the experiment.'],
      [`checks <- c(${a.review.map(r=>'"'+T(r.zh,r.en).replace(/"/g,'\\"')+'"').join(',\n  ')})`,
       'length(checks)',T('# 逐条核对并在报告中写明结论','# Verify each item and record the verdict in the report')]);
  }

  const basic=blocks.filter(b=>b.core!==false);
  const chosen=mode==='basic'?basic:blocks;
  return{blocks:chosen,code:chosen.map(b=>b.lines.join('\n')).join('\n\n'),mode,view,lang};
}
return{build,vec};
});

;

/* Source: rbasic-workbench.js */
/* Experiment01 workbench: seven language parts sharing the three-pane shell. */
(()=>{'use strict';
const M=RBasicMath,C=RBasicCode,K=LabKit,$=s=>document.querySelector(s);
const {t,esc,fmt,pct}=K;
const VIEW_KEYS=M.views.map(v=>v[0]);
function mount(){
  K.start('rbasic','rbasic-lab');
  let p={...M.defaults},view='env',mode='full',active=null,built=null,q=null,focus='data.frame';
  $('#chartHost').className='chart-host single-chart';
  $('#chartHost').innerHTML='<div class="chart-frame"><h3></h3><div class="svg-host"></div></div>';
  const frameTitle=()=>$('#chartHost .chart-frame h3');
  const svgHost=()=>$('#chartHost .svg-host');
  const tabs=K.views($('.model-panel .panel-head'),M.views,view,k=>{view=k;active=null;render(true);});
  const questions={
    env:['脚本从哪里开始？环境、目录与种子如何保证复现？','Where does the script start, and how do environment, folders and seed make it reproducible?'],
    struct:['同一组数值放进向量、矩阵、列表、数据框，会有什么不同？','How does one set of numbers behave inside a vector, matrix, list and data frame?'],
    index:['缺失值和逻辑索引如何改变一次简单计算？','How do missing values and logical indexing change a simple calculation?'],
    func:['函数、循环和向量化写法，结果为什么相同而代码不同？','Why do a function, a loop and vectorised code agree on the number but differ in code?'],
    plot:['基础绘图能先告诉我们关于收益分布的什么信息？','What can base graphics tell us about a return distribution first?'],
    pkg:['为什么"先声明依赖、再检查是否可用"比直接安装更可靠？','Why is declaring and checking dependencies safer than installing on the fly?'],
    ai:['AI 生成的代码看起来能跑，为什么还需要逐条审查？','The generated code runs — why does it still need item-by-item review?']
  };
  const params={
    env:()=>K.select({id:'step',zh:'流程步骤',en:'Pipeline step',value:p.step,options:M.STEPS.map((s,i)=>[i+1,s[0]+'／'+s[1],s[1]])}),
    struct:()=>K.select({id:'struct',zh:'重点容器',en:'Focus container',value:focus,options:[['vector','向量','Vector'],['matrix','矩阵','Matrix'],['list','列表','List'],['data.frame','数据框','Data frame']]})+
      K.field({id:'length',zh:'向量长度',en:'Vector length',value:p.length,min:4,max:24,step:1})+
      K.field({id:'rows',zh:'矩阵行数',en:'Matrix rows',value:p.rows,min:1,max:p.length-1,step:1}),
    index:()=>K.field({id:'naAt',zh:'缺失起始位置',en:'First missing position',value:p.naAt,min:1,max:p.length,step:1})+
      K.field({id:'na',zh:'缺失个数',en:'Missing count',value:p.na,min:1,max:3,step:1})+
      K.field({id:'length',zh:'向量长度',en:'Vector length',value:p.length,min:6,max:24,step:1}),
    func:()=>K.field({id:'n',zh:'样本量 n',en:'Sample size n',value:p.n,min:20,max:1200,step:1})+
      K.field({id:'draws',zh:'重复次数 B',en:'Replications B',value:p.draws,min:10,max:1000,step:1})+
      K.field({id:'mu',zh:'真实均值 μ',en:'True mean μ',value:p.mu,step:.001})+
      K.field({id:'sigma',zh:'标准差 σ',en:'Standard deviation σ',value:p.sigma,min:.001,step:.001})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1}),
    plot:()=>K.field({id:'n',zh:'收益样本量',en:'Return sample size',value:p.n,min:20,max:1200,step:1})+
      K.field({id:'bins',zh:'直方图分组',en:'Histogram bins',value:p.bins,min:4,max:40,step:1})+
      K.select({id:'kind',zh:'图形类型',en:'Plot type',value:p.kind,options:[['hist','直方图 + 正态密度','Histogram + normal density'],['qq','QQ 图','QQ plot'],['box','箱线图','Box plot'],['series','时间序列','Time series']]}),
    pkg:()=>K.prose('先声明、再检查、按需安装、记录版本；课堂上不要默认联网安装。','Declare, check, install only if needed, then record the version — never let a classroom script install silently.'),
    ai:()=>K.prose('草稿由 AI 生成，结论必须由学生逐条审查、运行验证并留痕。','The draft comes from an AI; the conclusion must be reviewed item by item, executed and recorded by the student.')
  };
  const summary={
    env:[['自检先行','Check first'],['相对路径','Relative paths'],['固定种子','Fixed seed']],
    struct:[['同一数据','One dataset'],['四种容器','Four containers'],['类型先于数值','Type before value']],
    index:[['NA 不是 0','NA is not 0'],['显式删除','Explicit deletion'],['填补要报告','Report imputations']],
    func:[['函数封装','Functions'],['循环 vs 向量化','Loop vs vectorised'],['收敛而非单调','Convergence, not monotone']],
    plot:[['先看图','Look first'],['密度叠加','Density overlay'],['厚尾判断','Fat-tail check']],
    pkg:[['声明依赖','Declare'],['检查可用','Check'],['记录版本','Record versions']],
    ai:[['草稿','Draft'],['审查','Review'],['留痕','Record']]
  };
  const assumptions={
    env:['R 脚本的复现依赖 R 版本、包版本、随机种子与输入数据四者一致。本页演示的是脚本结构；页面本身不执行 R。','Reproducing an R script requires the same R version, package versions, seed and input data. This page demonstrates script structure; the page itself does not run R.'],
    struct:['向量只能是一种原子类型；矩阵是带 dim 的向量；数据框是等长列的列表；列表的每个元素可以是任意对象。页面中的数值全部为固定合成数据。','A vector has one atomic type; a matrix is a vector with a dim attribute; a data frame is a list of equal-length columns; list elements can be anything. All numbers here are fixed synthetic data.'],
    index:['NA 表示未知，不参与任何未经声明的计算；na.rm = TRUE 是显式删除，会改变样本量与口径。中位数填补只有在缺失机制可接受时才是合理近似。','NA means unknown and enters no undeclared arithmetic; na.rm = TRUE is an explicit deletion that changes sample size and basis. Median imputation is only defensible when the missingness mechanism allows it.'],
    func:[['循环与向量化在同一随机流下给出相同结果；本页嵌入的是确定性样本，因此 R 与网页逐项一致。','Loop and vectorised code agree under the same random stream; this page embeds a deterministic sample so R and the page agree item by item.'],['累计均值的收敛是概率意义下的收敛，路径不会单调贴近真值；1.96 SE 带只是显示参照，不是覆盖率检验。','Convergence of the running mean is probabilistic and need not be monotone; the 1.96 SE band is a display reference, not a coverage test.']][0],
    plot:['收益序列为固定种子的合成数据，不代表任何真实行情；偏度与峰度采用无偏样本公式（e1071 type 2），与 R 脚本一致。','The return series is synthetic with a fixed seed and is not a market quote; skewness and kurtosis use the unbiased sample formulas (e1071 type 2), matching the R script.'],
    pkg:['基础包随 R 安装；额外包需要显式安装。脚本先检查 requireNamespace，避免在课堂环境里静默联网或静默降级。','Base packages ship with R; extra packages need explicit installation. The script checks requireNamespace first so it never silently downloads or degrades.'],
    ai:['AI 生成代码属于待审查草稿。审查要点包括缺失值、量纲与频率、可移植路径、命名冲突与结果校验；审查记录应写进实验报告。','AI-generated code is a draft pending review: missing values, units and frequency, portable paths, naming collisions and result checks. The review record belongs in the lab report.']
  };
  function paramHTML(){
    const body=params[view]();
    $('#inputs').innerHTML=body+K.tasks([
      [questions[view][0],questions[view][1]],
      ['先预测结果，再改参数验证；把差异写进实验记录。','Predict first, then change a parameter and record the difference.'],
      ['复制完整 R 脚本到 RStudio 整段运行，核对与本页一致的数值。','Copy the full script into RStudio and check the numbers against this page.']
    ]);
  }
  function readParams(){
    const next={...p};
    for(const el of $('#inputs').querySelectorAll('input,select')){
      const id=el.id.replace(/^lab-/,'');
      if(el.type==='checkbox')continue;
      if(id==='struct'){focus=el.value;continue;}
      if(id==='kind'||id==='step'){next[id]=el.value;continue;}
      const v=Number(el.value);
      if(el.value.trim()===''){throw Error(t('请输入数值：','Enter a number: ')+el.closest('label').querySelector('span').textContent);}
      next[id]=v;
    }
    M.check(next);
    return next;
  }
  function barsFor(values,{color}){
    const pts=[];
    values.forEach((v,i)=>pts.push([i+1,Number.isFinite(v)?v:0]));
    return{type:'bar',points:pts,color,gap:.72,tip:d=>{
      const i=Math.round(d[0])-1,v=values[i];
      return[`位置 ${i+1}：${v===null?'NA':fmt(v,6)}`,v===null?'Position '+(i+1)+': NA':'Position '+(i+1)+': '+fmt(v,6)];
    }};
  }
  function naPoints(values,color){
    const pts=[];values.forEach((v,i)=>{if(v===null)pts.push([i+1,0]);});return{type:'scatter',points:pts,color,radius:6,tip:d=>[`位置 ${Math.round(d[0])} 是缺失值 NA`,'Position '+Math.round(d[0])+' is a missing value (NA)']};
  }
  function structDiagram(s){
    const cells=[],W=600,H=385;
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('数据结构示意','Data structure diagram'))}">`;
    const title=(x,y,text)=>`<text x="${x}" y="${y}" font-size="12" fill="#566d7c">${esc(text)}</text>`;
    const box=(x,y,w,h,fill,stroke)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}"/>`;
    const on=k=>focus===k;
    /* vector: one row, wraps at 8 */
    let y=34;
    svg+=title(20,y-10,'vector  length = '+s.vector.length+'  typeof = "double"');
    const cw=Math.min(58,(560-7*6)/Math.min(8,s.vector.length)),per=Math.min(8,s.vector.length);
    s.vector.forEach((v,i)=>{
      const r=Math.floor(i/per),c=i%per,x=20+c*(cw+6),yy=y+r*40;
      svg+=box(x,yy,cw,32,on('vector')?'#e9edf4':'#f4f7f9',on('vector')?'#8c80a3':'#dce5e9');
      svg+=`<text x="${x+cw/2}" y="${yy+21}" text-anchor="middle" font-size="11" fill="#4b5f6e">${v}</text>`;
      svg+=`<text x="${x+cw/2}" y="${yy+43}" text-anchor="middle" font-size="9" fill="#8a9ca6">[${i+1}]</text>`;
    });
    y+=Math.ceil(s.vector.length/per)*40+26;
    /* matrix */
    svg+=title(20,y-8,`matrix  ${s.rows} × ${s.cols}  dim = c(${s.rows}, ${s.cols})`);
    const mw=Math.min(58,(560-(s.cols-1)*6)/s.cols);
    for(let r=0;r<s.rows;r++)for(let c=0;c<s.cols;c++){
      const cell=s.cells.find(x=>x.r===r&&x.c===c);const x=20+c*(mw+6),yy=y+r*34;
      svg+=box(x,yy,mw,28,on('matrix')?'#f0ecef':'#f7f9fa',on('matrix')?'#b09fb4':'#e3e9ed');
      if(cell)svg+=`<text x="${x+mw/2}" y="${yy+19}" text-anchor="middle" font-size="11" fill="#4b5f6e">${cell.value}</text>`;
    }
    y+=s.rows*34+26;
    /* data frame + list side by side */
    const half=280;
    svg+=title(20,y-8,`data.frame  ${s.df.length} × 3`);
    const fw=(half-20)/3;
    s.frameCols.forEach((c,i)=>{svg+=box(20+i*fw,y,fw-4,26,on('data.frame')?'#e9edf4':'#f1f4f6','#dce5e9');svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${y+17}" text-anchor="middle" font-size="10" fill="#4b5f6e">${esc(c.name)}</text>`;svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${y-10}" text-anchor="middle" font-size="9" fill="#8a9ca6">${c.type}</text>`;});
    s.df.forEach((row,r)=>{const yy=y+30+r*26;const vals=[row.date,row.ret,row.price];vals.forEach((v,i)=>{svg+=box(20+i*fw,yy,fw-4,22,on('data.frame')?'#f2eff4':'#fafbfc','#e3e9ed');svg+=`<text x="${20+i*fw+(fw-4)/2}" y="${yy+15}" text-anchor="middle" font-size="10" fill="#4b5f6e">${esc(String(v))}</text>`;});});
    svg+=title(320,y-8,'list  3 elements');
    s.list.forEach((item,i)=>{const yy=y+i*34;svg+=box(320,yy,260,28,on('list')?'#eef1ea':'#f6f8f9',on('list')?'#9aa885':'#e3e9ed');svg+=`<text x="330" y="${yy+18}" font-size="10" fill="#5b6f7d">${esc('$ '+item.key)} · ${esc(item.type)}</text>`;});
    svg+=`<text x="300" y="${H-12}" text-anchor="middle" font-size="10" fill="#8a9ca6">${esc(t('高亮框为当前重点容器；四者共用同一组数值','The highlighted frame is the focus; all four share one set of numbers'))}</text>`;
    svg+='</svg>';
    svgHost().innerHTML=svg;
  }
  function boxPlot(g){
    const W=600,H=385,l=60,r=20,top=30,bot=60;
    const lo=Math.min(g.five.min,g.fences.lo),hi=Math.max(g.five.max,g.fences.hi);
    const pad=(hi-lo)*.06||.01,x0=lo-pad,x1=hi+pad;
    const sx=v=>l+(v-x0)/(x1-x0)*(W-l-r),y=(top+H-bot)/2;
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('箱线图','Box plot'))}">`;
    for(let i=0;i<=5;i++){const v=x0+(x1-x0)*i/5;svg+=`<path class="chart-grid" d="M${sx(v)},${top}V${H-bot}"/><text x="${sx(v)}" y="${H-bot+18}" text-anchor="middle">${esc(fmt(v,3))}</text>`;}
    svg+=`<path d="M${sx(lo)},${y}H${sx(g.five.min)}" stroke="#8c9ba6"/><path d="M${sx(g.five.min)},${y-14}V${y+14}" stroke="#8c9ba6"/>`;
    svg+=`<path d="M${sx(g.five.max)},${y}H${sx(hi)}" stroke="#8c9ba6"/><path d="M${sx(g.five.max)},${y-14}V${y+14}" stroke="#8c9ba6"/>`;
    svg+=`<rect x="${sx(g.five.q1)}" y="${y-26}" width="${sx(g.five.q3)-sx(g.five.q1)}" height="52" fill="#e6eef2" stroke="#6689a8" rx="3"/>`;
    svg+=`<path d="M${sx(g.five.median)},${y-26}V${y+26}" stroke="#4e718e" stroke-width="2.5"/>`;
    const out=g.returns.filter(v=>v<g.fences.lo||v>g.fences.hi);
    svg+=out.map(v=>`<circle cx="${sx(v)}" cy="${y}" r="4" fill="#b5816f" opacity=".8"><title>${esc(fmt(v,4))}</title></circle>`).join('');
    [['min',g.five.min],['Q1',g.five.q1],['median',g.five.median],['Q3',g.five.q3],['max',g.five.max]].forEach(([k,v],i)=>{svg+=`<text x="${sx(v)}" y="${y+52+(i%2)*14}" text-anchor="middle" font-size="10" fill="#7a8b96">${k} ${esc(fmt(v,3))}</text>`;});
    svg+=`<text x="${(l+W-r)/2}" y="${H-12}" text-anchor="middle" font-size="10" fill="#8a9ca6">${esc(t('虚线外为 1.5 IQR 规则标出的点，共 ','Points outside the 1.5 IQR fences: '))}${out.length}</text>`;
    svg+='</svg>';
    svgHost().innerHTML=svg;
  }
  function packageFlow(){
    const steps=[['声明依赖','Declare'],['检查可用','Check'],['按需安装','Install if needed'],['加载使用','Load'],['记录版本','Record version']];
    K.flow(svgHost(),steps.map((s,i)=>[s[0],s[1],i===1?'requireNamespace':i===4?'sessionInfo':null]),1);
  }
  function aiFlow(){
    const steps=[['AI 生成草稿','AI draft'],['人工审查','Human review'],['运行验证','Execute'],['记录留痕','Record']];
    K.flow(svgHost(),steps.map((s,i)=>[s[0],s[1],i===0?'draft':null]),1);
  }
  function chart(){
    if(view==='env'){
      frameTitle().textContent=t('会话工作流 · 当前步骤高亮','Session workflow · current step highlighted');
      const w=M.workspace(p);
      K.flow(svgHost(),w.steps.map((s,i)=>[s[0],s[1],null]),w.step);
    }else if(view==='struct'){
      frameTitle().textContent=t('四种容器的结构对照','Structure of the four containers');
      structDiagram(q);
    }else if(view==='index'){
      frameTitle().textContent=t('向量取值与缺失位置','Vector values and missing positions');
      K.chart(svgHost(),{yZero:true,yLabel:['取值','Value'],xLabel:['元素位置','Element position'],
        series:[barsFor(q.vector,'#6689a8'),naPoints(q.vector,'#b5816f')],
        refs:[{axis:'y',value:q.median,color:'#9b88ac',label:['中位数','median']}],
        aria:['向量取值与缺失位置','Vector values and missing positions']});
    }else if(view==='func'){
      frameTitle().textContent=t('累计均值与 ±1.96 SE 带','Running mean with the ±1.96 SE band');
      const mc=q,pts=(arr)=>arr.map((v,i)=>[i+1,v]);
      K.chart(svgHost(),{yLabel:['累计均值','Running mean'],xLabel:['重复次数 b','Replication b'],yZero:false,
        series:[{type:'line',points:pts(mc.running.map(v=>v)),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 次：${fmt(d[1],6)}`,'b = '+Math.round(d[0])+': '+fmt(d[1],6)]},
          {type:'line',points:pts(mc.running.map((v,i)=>mc.mu+mc.band[i])),color:'#9b88ac',dash:true,width:1.4},
          {type:'line',points:pts(mc.running.map((v,i)=>mc.mu-mc.band[i])),color:'#9b88ac',dash:true,width:1.4}],
        refs:[{axis:'y',value:mc.mu,color:'#659b8a',dash:false,label:['真值 μ','true μ']}],
        aria:['累计均值收敛路径','Running-mean convergence path']});
    }else if(view==='plot'){
      const kind=p.kind;
      if(kind==='box'){frameTitle().textContent=t('箱线图与 1.5 IQR 围栏','Box plot and the 1.5 IQR fences');boxPlot(q);}
      else if(kind==='qq'){frameTitle().textContent=t('QQ 图：样本分位 vs 正态分位','QQ plot: sample vs normal quantiles');
        K.chart(svgHost(),{xLabel:['标准正态分位','Standard normal quantile'],yLabel:['样本收益','Sample return'],yZero:true,
          series:[{type:'scatter',points:q.qq.map(d=>[d.x,d.y]),color:'#6689a8',radius:3.2,tip:d=>[`z = ${fmt(d[0],3)}；r = ${pct(d[1])}`,'z = '+fmt(d[0],3)+'; r = '+pct(d[1])]},
            {type:'line',points:[[q.qq[0].x,q.mean+q.sd*q.qq[0].x],[q.qq.at(-1).x,q.mean+q.sd*q.qq.at(-1).x]],color:'#659b8a',dash:true}],
          aria:['QQ 图','QQ plot']});}
      else if(kind==='series'){frameTitle().textContent=t('合成月度收益序列','Synthetic monthly return series');
        K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['简单收益','Simple return'],yZero:true,
          series:[{type:'line',points:q.series.map(d=>[d.x,d.y]),color:'#6689a8',tip:d=>[`第 ${d[0]} 月：${pct(d[1])}`,'Month '+d[0]+': '+pct(d[1])]}],
          refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['合成收益序列','Synthetic return series']});}
      else{frameTitle().textContent=t('直方图与同参数正态密度','Histogram with the matching normal density');
        K.chart(svgHost(),{yZero:true,xLabel:['收益率','Return'],yLabel:['频数','Count'],
          series:[{type:'bar',points:q.bins.map(b=>[b.x,b.y]),color:'#6689a8',gap:.92,tip:d=>[`区间中心 ${pct(d[0])}：${Math.round(d[1])} 个观测`,'Bin centre '+pct(d[0])+': '+Math.round(d[1])+' observations']},
            {type:'line',points:q.density.map(b=>[b.x,b.y]),color:'#9b88ac',width:2}],
          aria:['收益直方图','Return histogram']});}
    }else if(view==='pkg'){
      frameTitle().textContent=t('依赖处理流程','Dependency workflow');packageFlow();
    }else{
      frameTitle().textContent=t('AI 辅助编程流程','AI-assisted coding workflow');aiFlow();
    }
  }
  function model(){
    if(view==='env'){
      const w=M.workspace(p);
      K.metrics([['当前步骤','Current step',`${w.step+1} / ${w.steps.length}`],['工作目录','Working directory','finmodel-lab'],['目录','Folders',String(w.dirs.length)]]);
      K.legend([['脚本步骤','Script step','#8c80a3',false],['尚未执行','Not yet','#b9c7cf',false]]);
      K.details(K.table([['项目','Item'],['输出','Output']],[
        ['getwd()',w.dirs[0]+'/ …'],
        ['sessionInfo()',t('R 版本与已加载包','R version and loaded packages')],
        ['set.seed()',String(w.seed)],
        [t('脚本拆分','Script split'),w.files.join(' · ')]
      ]));
      K.graphKind('R 会话 · 合成示例','R session · synthetic example');
    }else if(view==='struct'){
      const s=q;
      K.metrics([['元素个数','Elements',String(s.vector.length)],['矩阵形状','Matrix shape',`${s.rows} × ${s.cols}`],['列表元素','List elements',String(s.list.length)]]);
      K.legend([['向量','Vector','#6689a8',false],['矩阵','Matrix','#b09fb4',false],['数据框','Data frame','#8c80a3',false],['列表','List','#9aa885',false]]);
      K.details(K.table([['对象','Object'],['class()'],['str() 摘要','str() summary']],[
        ['v','double',`length ${s.vector.length}`],
        ['m','matrix',`dim ${s.rows} ${s.cols}`],
        ['l','list',`${s.list.length} elements`],
        ['df','data.frame',`${s.df.length} obs. of 3 variables`]
      ]));
      K.graphKind('数据结构 · 同一组数值','Data structures · one dataset');
    }else if(view==='index'){
      K.metrics([['mean(x)','mean(x)',q.meanWithNa===null?'NA':fmt(q.meanWithNa,6)],['mean(x, na.rm)','mean(x, na.rm)',fmt(q.meanNaRm,6)],['缺失个数','Missing',String(q.naCount)]]);
      K.legend([['非缺失取值','Non-missing','#6689a8',false],['NA 位置','NA position','#b5816f',false],['中位数','Median','#9b88ac',true]]);
      K.details(K.table([['表达式','Expression'],['结果','Result']],[
        ['sum(is.na(x))',String(q.naCount)],
        ['which(is.na(x))',q.naIdx.join(', ')],
        [`x[x > ${q.threshold}]`,`${q.above} `+t('个元素','elements')],
        ['median(x, na.rm = TRUE)',fmt(q.median,6)],
        [t('填补后均值','Filled mean'),fmt((q.meanNaRm*q.clean.length+q.median*q.naCount)/q.n,6)]
      ]));
      K.graphKind('索引与缺失 · 合成向量','Indexing and NA · synthetic vector');
    }else if(view==='func'){
      const mc=q;
      K.metrics([['累计均值终点','Final running mean',fmt(mc.final,6)],['单次标准误','SE per replication',fmt(mc.se,6)],['循环迭代总数','Loop iterations',String(mc.loopCost)]]);
      K.legend([['累计均值','Running mean','#6689a8',false],['±1.96 SE 带','±1.96 SE band','#9b88ac',true],['真值 μ','True μ','#659b8a',false]]);
      K.details(K.table([['统计量','Statistic'],['数值','Value']],[
        [t('真值 μ','True μ'),fmt(mc.mu,6)],
        [t('重复次数 B','Replications B'),String(mc.draws_n)],
        ['SE = σ/√n',fmt(mc.se,6)],
        [t('落在显示带内的比例','Share inside the display band'),pct(mc.coverage,1)]
      ])+`<p class="chart-note">${esc(t('累计均值高度自相关，带内比例不能当覆盖率检验。','The running mean is strongly autocorrelated, so that share is not a coverage test.'))}</p>`);
      K.graphKind('编程计算 · 确定性样本','Computation · deterministic sample');
    }else if(view==='plot'){
      const g=q;
      K.metrics([['均值','Mean',pct(g.mean)],['标准差','Std. dev.',pct(g.sd)],['超额峰度','Excess kurtosis',fmt(g.kurt,3)]]);
      K.legend([['收益样本','Return sample','#6689a8',false],['正态参照','Normal reference','#9b88ac',true]]);
      K.details(K.table([['统计量','Statistic'],['数值','Value']],[
        [t('偏度','Skewness'),fmt(g.skew,4)],
        [t('超额峰度','Excess kurtosis'),fmt(g.kurt,4)],
        [t('1.5 IQR 下围栏','Lower 1.5 IQR fence'),pct(g.fences.lo)],
        [t('1.5 IQR 上围栏','Upper 1.5 IQR fence'),pct(g.fences.hi)],
        [t('围栏外点数','Points outside the fences'),String(g.outliers)]
      ])+`<p class="chart-note">${esc(t('固定种子的合成收益，共 ','Synthetic returns from a fixed seed, n = '))}${g.returns.length}${esc(t(' 个观测。',' observations.'))}</p>`);
      K.graphKind('基础绘图 · 合成收益','Base graphics · synthetic returns');
    }else if(view==='pkg'){
      const installed=M.PACKAGES.filter(x=>x.base),extra=M.PACKAGES.filter(x=>!x.base);
      K.metrics([['基础包','Base packages',String(installed.length)],['额外包','Extra packages',String(extra.length)],['安装策略','Install policy',t('按需','On demand')]]);
      K.legend([['随 R 安装','Ships with R','#659b8a',false],['需要安装','Requires install','#b5816f',true]]);
      K.details(K.table([['包','Package'],['用途','Role'],['状态','Status']],M.PACKAGES.map(x=>[x.name,t(...x.role),x.base?t('随 R 安装','Built in'):t('需要安装','Extra')])));
      K.graphKind('程序包 · 依赖流程','Packages · dependency workflow');
    }else{
      K.metrics([['审查条目','Review items',String(q.checks)],['年化口径 252','Annualised × 252',fmt(q.annual,4)],['按月口径 12','Monthly × 12',fmt(q.monthly,4)]]);
      K.legend([['草稿问题','Draft issue','#b5816f',true],['审查后','Reviewed','#659b8a',false]]);
      K.details(K.table([['审查项','Review item'],['结论','Verdict']],M.AI_REVIEW.map(r=>[t(r.zh,r.en),t('已修正','Fixed')]))+`<p class="chart-note">${esc(t('审查结论需写进实验报告；本页只演示审查过程。','The verdict belongs in the lab report; this page only demonstrates the review.'))}</p>`);
      K.graphKind('AI 辅助编程 · 审查流程','AI-assisted coding · review');
    }
  }
  function code(){
    built=C.build(p,view,mode,K.lang());
    if(!built.blocks.some(b=>b.key===active))active=built.blocks[0].key;
    active=K.code(built.blocks,active,key=>{active=key;code();});
    K.modeButtons(mode,{basic:true});
    K.notice(mode==='basic'?t('关键逻辑：可独立运行的最小脚本','Key logic: the smallest standalone script'):t('完整脚本：含检查、输出与绘图','Full script: checks, output and plotting'));
  }
  function render(rebuildParams=false){
    if(rebuildParams)paramHTML();
    try{p=readParams();$('#validation').textContent='';}
    catch(e){$('#validation').textContent=e.message;return;}
    tabs.refresh(M.views,view);
    tabs.setQuestion(...questions[view]);
    tabs.setActive(view);
    K.assumptions(summary[view],assumptions[view]);
    q=view==='env'?M.workspace(p):view==='struct'?M.structures(p):view==='index'?M.indexing(p):view==='func'?M.monteCarlo(p):view==='plot'?M.graphicsData(p):view==='pkg'?{checks:0}:M.ai(p);
    model();chart();code();
  }
  K.onLang(()=>render(true));
  $('#inputs').addEventListener('input',()=>render(false));
  $('#inputs').addEventListener('change',()=>render(false));
  K.chrome({
    getCode:()=>C.build(p,view,'full',K.lang()).code,
    onReset:()=>{p={...M.defaults};focus='data.frame';active=null;render(true);},
    onMode:m=>{mode=m;render(false);},
    teacher:['七个小节对应大纲的"R 工作环境、数据结构、常用命令、图形制作、编程计算、常用程序包"与 AI 辅助编程。建议顺序：环境 → 数据结构 → 索引 → 计算 → 图形 → 程序包 → AI 审查。每一节先让学生预测输出，再运行脚本核对。AI 一节务必让学生指出草稿的三处缺陷，而不是直接接受生成结果。',
      'The seven sections follow the syllabus: workspace, data structures, common commands, graphics, computation, packages and AI-assisted coding. Recommended order: workspace → structures → indexing → computation → graphics → packages → AI review. Have students predict the output before running the script. In the AI section they must name the three defects of the draft rather than accept it.'],
    help:['页面本身不执行 R。每节的完整脚本可复制到 RStudio 整段运行，只依赖 base R。左侧代码按"逻辑块"分组，点击任意一行查看该语句的作用、公式与金融含义。右上角可切换中文/English，数值与脚本在切换时保持不变。',
      'The page does not run R. Each section produces a standalone base-R script you can paste into RStudio. The left pane groups code into logic blocks; click any line to see its role, formula and meaning. The language switch keeps numbers and scripts identical.'],
    practice:['新建 R Script，复制完整脚本并整段运行。依次核对：length/typeof 与网页一致；mean(x) 为 NA 而 mean(x, na.rm = TRUE) 有数值；累计均值终点与网页显示一致；plot 类函数的输出与网页图形同形。最后把 sessionInfo() 的输出附到实验报告。',
      'Create a new R Script, paste the whole script and run it. Check in order: length/typeof match the page; mean(x) is NA while mean(x, na.rm = TRUE) returns a number; the final running mean matches; the base plots have the same shape. Attach the sessionInfo() output to the report.'],
    fileName:'experiment01-r-basics.R'
  });
  render(true);
  window.RBasicLab={snapshot:()=>({model:'rbasic',view,p,mode,code:C.build(p,view,'full',K.lang()).code.slice(0,80)})};
}
window.RBasicWorkbench={mount};
})();

;

/* Source: dataprep-math.js */
/* Experiment02 · financial data cleaning. Deterministic messy sample, explicit
   cleaning pipeline and audit trail. The CSV engine is shared with experiment 01's
   kit (LabCSV); every number the page shows is produced here and reproduced by the
   generated base-R script. Nothing is a market quote: all prices are synthetic. */
(function(root,factory){
  const csv=typeof module==='object'?require('./lab-csv'):root.LabCSV;
  const st=typeof module==='object'?require('./lab-stats'):root.LabStats;
  const api=factory(csv,st);
  if(typeof module==='object')module.exports=api;else root.DataPrepMath=api;
})(this,(CSV,S)=>{
'use strict';
const views=[['import','导入与列诊断','Import & profiling'],['dates','日期与频率对齐','Dates & frequency'],['missing','缺失值策略','Missing values'],['outlier','异常值识别','Outliers'],['shape','宽长表与合并','Wide, long & joins'],['ai','AI 清洗对比','AI cleaning compared'],['db','数据库与格式','Databases & formats']];
const ASSET_LABELS={'股票A':['股票A','Stock A'],'股票B':['股票B','Stock B'],'债券C':['债券C','Bond C']};
const AI_KEYS=['typo','zero','drop','naive','long','clamp'];
const DEFAULT_AI=Object.freeze(AI_KEYS.reduce((o,k)=>(o[k]=Object.freeze({decision:'pending',reason:''}),o),{}));
const SOURCES=[['file','本地文件 CSV / xlsx','Local file'],['db','数据库（RODBC / DBI）','Database (RODBC / DBI)'],['api','行情 API / 终端（quantmod / WindR）','Market API / terminal']];
const FREQS=[['daily','日度','Daily'],['weekly','周度','Weekly'],['monthly','月度','Monthly']];
const ADJS=[['raw','未复权原始价','Unadjusted'],['split','仅拆分调整','Split-adjusted'],['total','含股息总收益','Total return']];
const defaults=Object.freeze({csv:'',delimiter:'auto',missing:'drop',outlier:'iqr',outlierAction:'flag',k:1.5,asset:0,resample:'month',bins:12,seed:20261114,ai:DEFAULT_AI,source:'db',frequency:'monthly',adjust:'total',retrieved:'2026-11-14',dbTable:'prices'});
const SAMPLE_META=Object.freeze({license:'CC0-1.0',retrieved:'2026-11-14',rows:36,assets:3,missing:3,duplicates:1,typo:1,emptyColumns:1,textColumns:1});
const NOTE_BY_INDEX={0:'首次录入',5:'来源：教学数据库',17:'数值待复核',22:'口径调整',30:'期末核对'};
const r2=v=>Number(v.toFixed(2)),r3=v=>Number(v.toFixed(3));
function monthEnd(i){return new Date(Date.UTC(2024,i+1,0)).toISOString().slice(0,10);}
function fmtRaw(iso,i){const [y,m,d]=iso.split('-');if(i%3===1)return y+'/'+Number(m)+'/'+Number(d);if(i%3===2)return y+m+d;return iso;}
/* The built-in messy sample: 36 monthly rows, 35 unique months (2025-01 is a real
   calendar gap), one duplicated date, three missing cells, one 10x typo, one empty
   column, one free-text column and three synthetic assets. */
function sampleCSV(){
  const lines=['date,股票A,股票B,债券C,备用字段,备注'];
  const cell=v=>v===null?'':String(v);
  for(let i=0;i<36;i++){
    if(i===12)continue;                                   /* 2025-01 gap */
    const iso=monthEnd(i);
    const a=i===20?'N/A':r2(10*(1+.006*i+.03*Math.sin(i*.9)));
    let b=r3(1.2*(1+.004*i+.05*Math.sin(i*1.3+.4)));
    if(i===26)b=null;                                     /* missing cell */
    if(i===17)b=r3(b*10);                                 /* 10x typo */
    const c=i===13?null:r3(100*(1+.0008*i+.004*Math.sin(i*.5+1)));
    lines.push([fmtRaw(iso,i),cell(a),cell(b),cell(c),'',NOTE_BY_INDEX[i]||''].join(','));
    if(i===2)lines.push(['2024/3/31',cell(a),r3(b*1.004+.002),cell(c),'','重复录入'].join(','));
  }
  return lines.join('\n');
}
const SAMPLE=sampleCSV();
const DEFAULTS={...defaults,csv:SAMPLE};
function cloneDefaults(){return{...DEFAULTS,ai:AI_KEYS.reduce((o,k)=>(o[k]={...DEFAULT_AI[k]},o),{})};}
const DELIMS=[['auto','自动检测','Detect automatically'],[',','逗号 ,','Comma ,'],[';','分号 ;','Semicolon ;'],['\t','制表符 Tab','Tab']];
const POLICIES=[['reject','拒绝并报错','Reject with an error'],['drop','删除整行','Drop the row'],['ffill','用前值填充','Carry the previous value'],['zero','用 0 填充','Fill with zero']];
const METHODS=[['z','z 分数','z-score'],['iqr','四分位距 IQR','IQR fences'],['mad','中位数绝对偏差 MAD','MAD fences']];
const ACTIONS=[['flag','只标记','Flag only'],['winsorize','缩尾处理','Winsorize'],['drop','删除整行','Drop the row']];
const RESAMPLE=[['none','原始频率','Native frequency'],['month','按月对齐','Align to month'],['week','按周对齐','Align to week']];
function check(p){
  if(typeof p.csv!=='string'||!p.csv.trim())throw Error('CSV 文本不能为空，请粘贴数据或导入文件。');
  if(p.csv.length>4000000)throw Error('CSV 超过 4MB 上限，请先拆分文件。');
  if(!DELIMS.some(d=>d[0]===p.delimiter))throw Error('分隔符只能选择自动、逗号、分号或制表符。');
  if(!POLICIES.some(d=>d[0]===p.missing))throw Error('缺失值策略只能是拒绝、删除整行、前值填充或 0 填充。');
  if(!METHODS.some(d=>d[0]===p.outlier))throw Error('异常值方法只能是 z 分数、IQR 或 MAD。');
  if(!ACTIONS.some(d=>d[0]===p.outlierAction))throw Error('异常值处理只能是标记、缩尾或删除整行。');
  if(!Number.isFinite(p.k)||p.k<.1||p.k>10)throw Error('阈值倍数须为 0.1 到 10 之间的数值。');
  if(!Number.isInteger(p.asset)||p.asset<0||p.asset>2)throw Error('资产序号须为 0、1 或 2。');
  if(!Number.isInteger(p.bins)||p.bins<4||p.bins>40)throw Error('直方图分组须为 4 到 40 之间的整数。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1 到 99999999 之间的整数。');
  if(!p.ai||typeof p.ai!=='object')throw Error('AI 建议状态缺失，请刷新页面。');
  for(const key of AI_KEYS){
    const d=p.ai[key];if(!d)throw Error('AI 建议状态不完整，请刷新页面。');
    if(!['accept','reject','pending'].includes(d.decision))throw Error('AI 建议的决策只能是接受、拒绝或待定。');
    if(d.decision!=='pending'&&!String(d.reason||'').trim())throw Error('AI 建议"'+AI_SUGGESTIONS.find(s=>s.key===key).title[0]+'"：接受或拒绝都必须填写理由。');
    if(String(d.reason||'').length>240)throw Error('AI 建议的理由不能超过 240 个字符。');
  }
  return true;
}
/* ---------- shared cleaning entry points ---------- */
function cleanWith(p,overrides={}){
  return CSV.clean(p.csv,{delimiter:p.delimiter,dedupe:true,sort:true,outlier:'none',...overrides});
}
function colStats(clean){
  const {names,matrix}=clean;
  return names.map((name,j)=>{
    const v=matrix.map(r=>r[j]).filter(Number.isFinite);
    const stats={name,index:j,mean:v.length?S.mean(v):NaN,sd:v.length>1?S.sd(v):NaN,min:v.length?Math.min(...v):NaN,max:v.length?Math.max(...v):NaN,n:v.length,missing:matrix.length-v.length};
    if(v.length>=8){
      stats.q1=CSV.quantileOf(v,.25);stats.q3=CSV.quantileOf(v,.75);stats.iqr=stats.q3-stats.q1;
      stats.median=CSV.quantileOf(v,.5);stats.mad=CSV.quantileOf(v.map(x=>Math.abs(x-stats.median)),.5)*1.4826;
    }
    return stats;
  });
}
const logEntry=(clean,code)=>clean.log.find(x=>x.code===code)||null;
function formatOf(raw){
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return 'iso';
  if(/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(raw))return 'slash';
  if(/^\d{8}$/.test(raw))return 'compact';
  return 'other';
}
function monthKeysBetween(from,to){
  const out=[];let y=+from.slice(0,4),m=+from.slice(5,7);const ey=+to.slice(0,4),em=+to.slice(5,7);
  while(y<ey||(y===ey&&m<=em)){out.push(y+'-'+String(m).padStart(2,'0'));m++;if(m>12){m=1;y++;}}
  return out;
}
/* ---------- 1. import and column diagnostics ---------- */
function importView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const before=clean.profileBefore,after=colStats(clean),types={date:0,number:0,text:0};
  before.forEach(c=>types[c.type]++);
  return{clean,before,after,types,delimiter:clean.source.delimiter,rows:clean.source.rows,columns:clean.source.columns,path:clean.summary,dropped:clean.summary.dropped,
    flow:[['read_csv','读取 CSV'],['profile','列类型诊断'],['dates','日期规范化'],['missing','缺失处理'],['outlier','异常值识别'],['shape','宽长转换']]};
}
/* ---------- 2. dates and frequency alignment ---------- */
function datesView(p){
  const parsed=CSV.parse(p.csv,{delimiter:p.delimiter});
  const raw=parsed.rows.map((r,i)=>({row:i+2,raw:String(r[0]).trim(),date:CSV.parseDate(r[0]),values:r.slice(1,4)}));
  const formats={iso:0,slash:0,compact:0,other:0};raw.forEach(r=>formats[formatOf(r.raw)]++);
  const byDate=new Map();for(const r of raw){if(!r.date)continue;if(!byDate.has(r.date))byDate.set(r.date,[]);byDate.get(r.date).push(r);}
  const duplicates=[...byDate.entries()].filter(([,list])=>list.length>1).map(([date,list])=>({date,list}));
  const clean=cleanWith(p,{missing:'ffill'});
  const month=cleanWith(p,{missing:'ffill',resample:'month'});
  const week=cleanWith(p,{missing:'ffill',resample:'week'});
  const from=clean.dates[0],to=clean.dates[clean.dates.length-1];
  const expected=monthKeysBetween(from,to),present=new Set(clean.dates.map(d=>d.slice(0,7)));
  const gaps=expected.filter(k=>!present.has(k));
  const calendar=expected.map(k=>{const y=+k.slice(0,4),m=+k.slice(5,7);const iso=clean.dates.find(d=>d.slice(0,7)===k)||k+'-01';return{k,year:y,month:m,date:iso,present:present.has(k),duplicate:duplicates.some(d=>d.date.slice(0,7)===k)};});
  return{raw,formats,duplicates,clean,month,week,gaps,calendar,expected:expected.length,rows:clean.dates.length,dupeCount:clean.summary.duplicates,
    log:{dedupe:logEntry(clean,'dedupe'),resample:logEntry(month,'resample')}};
}
/* ---------- 3. missing values: policy and explicit cost ---------- */
function policyStats(p,policy){
  try{
    const clean=cleanWith(p,{missing:policy});
    const dropped=logEntry(clean,'missing.drop'),fill=logEntry(clean,'missing.fill');
    return{policy,ok:true,clean,rows:clean.dates.length,means:colStats(clean).map(c=>c.mean),sds:colStats(clean).map(c=>c.sd),
      dropped:dropped?dropped.dropped:0,carried:fill?fill.carried:0,zeroed:fill?fill.zeroed:0,
      zeros:clean.matrix.flat().filter(v=>v===0).length,error:null};
  }catch(e){return{policy,ok:false,clean:null,rows:0,means:[],sds:[],dropped:0,carried:0,zeroed:0,zeros:0,error:e.message};}
}
function missingView(p){
  const base=cleanWith(p,{missing:'ffill'});
  const missing=base.missingCells.map(c=>({...c,col:base.names.indexOf(c.column)}));
  const policies=POLICIES.map(([key])=>policyStats(p,key));
  const applied=policies.find(x=>x.policy===p.missing);
  return{base,missing,policies,applied,names:base.names,dates:base.dates,matrix:base.matrix,
    mapBefore:base.matrix.map((row,i)=>row.map((v,j)=>({i,j,date:base.dates[i],asset:base.names[j],missing:v===null}))).flat()};
}
/* ---------- 4. outliers: three rules, three actions ---------- */
function detectOutliers(clean,{method='iqr',k=1.5,action='flag'}={}){
  const matrix=clean.matrix.map(r=>r.slice()),{names,dates}=clean,fences=[],flags=[];
  names.forEach((name,j)=>{
    const col=matrix.map(r=>r[j]).filter(Number.isFinite);
    const f={name,j,mean:col.length?S.mean(col):NaN,sd:col.length>1?S.sd(col):NaN,q1:NaN,q3:NaN,median:NaN,iqr:NaN,mad:NaN,lo:NaN,hi:NaN,count:0,skipped:false};
    if(col.length<8){f.skipped=true;fences.push(f);return;}
    f.q1=CSV.quantileOf(col,.25);f.q3=CSV.quantileOf(col,.75);f.iqr=f.q3-f.q1;f.median=CSV.quantileOf(col,.5);
    f.mad=CSV.quantileOf(col.map(v=>Math.abs(v-f.median)),.5)*1.4826;
    if(method==='z'){if(!(f.sd>0)){f.skipped=true;fences.push(f);return;}f.lo=f.mean-k*f.sd;f.hi=f.mean+k*f.sd;}
    else if(method==='iqr'){if(!(f.iqr>0)){f.skipped=true;fences.push(f);return;}f.lo=f.q1-k*f.iqr;f.hi=f.q3+k*f.iqr;}
    else{if(!(f.mad>0)){f.skipped=true;fences.push(f);return;}f.lo=f.median-k*f.mad;f.hi=f.median+k*f.mad;}
    matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;if(v<f.lo||v>f.hi){f.count++;flags.push({row:i,col:j,date:dates[i],name,value:v,score:Math.max((v-f.q3)/(k*Math.max(f.iqr,1e-12)),(f.q1-v)/(k*Math.max(f.iqr,1e-12))),side:v>f.hi?'hi':'lo'});}});
    fences.push(f);
  });
  const after=matrix.map(r=>r.slice());let winsorized=0,dropped=0;
  if(action==='winsorize')for(const fl of flags){const f=fences[fl.col];const v=after[fl.row][fl.col];const next=Math.min(f.hi,Math.max(f.lo,v));if(next!==v){after[fl.row][fl.col]=next;winsorized++;}}
  const dropRows=new Set(flags.map(f=>f.row));
  const keptDates=dates.filter((_,i)=>action!=='drop'||!dropRows.has(i));
  const keptMatrix=after.filter((_,i)=>action!=='drop'||!dropRows.has(i));
  if(action==='drop')dropped=dropRows.size;
  return{fences,flags,matrix:after,dates:keptDates,rows:keptDates.length,winsorized,dropped,method,k,action,
    byAsset:fences.map(f=>({name:f.name,lo:f.lo,hi:f.hi,count:f.count,skipped:f.skipped}))};
}
function outlierView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const det=detectOutliers(clean,{method:p.outlier,k:p.k,action:p.outlierAction});
  const selected=Math.min(p.asset,clean.names.length-1);
  const stats=colStats({names:clean.names,matrix:det.matrix});
  return{clean,det,selected,stats,flags:det.flags.filter(f=>f.col===selected),allFlags:det.flags,
    series:clean.dates.map((d,i)=>({date:d,x:i+1,before:clean.matrix[i][selected],after:det.matrix[i]?det.matrix[i][selected]:null}))};
}
/* ---------- 5. wide, long and joins ---------- */
function shapeView(p){
  const clean=cleanWith(p,{missing:'drop'});
  const n=clean.dates.length,names=clean.names,dates=clean.dates;
  const long=dates.flatMap((d,i)=>names.map((name,j)=>({date:d,asset:name,value:clean.matrix[i][j]})));
  const left=[],right=[];
  for(let i=0;i<n;i++)(i%2===0?left:right).push(dates[i]);
  const leftSet=new Set(left),rightSet=new Set(right);
  const inner=dates.filter(d=>leftSet.has(d)&&rightSet.has(d));
  const full=dates.filter(d=>leftSet.has(d)||rightSet.has(d));
  const csv=CSV.toCSV({dates,names,matrix:clean.matrix});
  return{clean,wide:{dates,names,matrix:clean.matrix},long,left,right,inner,full,csv,exportLines:csv.split('\n').filter(Boolean).length,
    rename:names.map((name,j)=>({from:name,to:'V'+(j+1)})),preview:long.slice(0,9)};
}
/* ---------- 6. AI suggestions versus the rule pipeline ---------- */
const AI_SUGGESTIONS=[
  {key:'typo',title:['自动把极端最大值替换为该列中位数','Replace the extreme maximum with the column median'],effect:['用中位数抹平 10 倍录入错误','Smooth the 10x entry error into the median'],verdict:'reject',
   why:['12.52 是 1.252 的 10 倍录入错误，应回源更正，而不是把错误值变成"看起来正常"的中位数。','12.52 is 1.252 times ten: fix the source instead of turning the bad value into a plausible-looking median.']},
  {key:'zero',title:['把缺失单元格填为 0','Fill missing cells with zero'],effect:['把缺失当成真实的 0','Treat missing as a genuine zero'],verdict:'reject',
   why:['价格不可能是 0；用 0 填充会制造 -100% 的假收益。','A price cannot be zero; zero-filling manufactures a fake -100% return.']},
  {key:'drop',title:['删除所有含缺失值的整行','Drop every row containing a missing cell'],effect:['样本量下降，但口径一致','Fewer rows, a consistent basis'],verdict:'reject',
   why:['只有在缺失完全随机时才可接受；必须报告删除比例与影响。','This is only acceptable if missingness is completely random; report the share dropped.']},
  {key:'naive',title:['日期直接交给 as.Date 默认格式','Hand dates to as.Date with the default format'],effect:['混合格式会静默变成 NA','Mixed formats silently become NA'],verdict:'reject',
   why:['本样本混合了 ISO、斜杠与紧凑三种格式，默认解析会产生 NA；必须显式回退格式。','The sample mixes ISO, slash and compact formats, so the default parse yields NA; explicit fallbacks are required.']},
  {key:'long',title:['把宽表转换为长表用于建模','Reshape the wide table into long format for modelling'],effect:['只改变形状，不改变数值','Shape-only change, values untouched'],verdict:'accept',
   why:['长表是输出形状，日期与数值一一对应，可接受。','Long format is an output shape; dates and values still map one-to-one.']},
  {key:'clamp',title:['对所有价格做均值 ±3 倍标准差截断','Clamp every price to mean ± 3 standard deviations'],effect:['把趋势端点也一并压平','Flattens trend endpoints as well'],verdict:'reject',
   why:['价格水平带有趋势，3σ 截断会误伤趋势端点；异常值检测应作用于收益率。','Price levels trend, so 3-sigma clipping damages trend endpoints; outlier tests belong on returns.']}
];
function aiRun(p){
  const base=cleanWith(p,{missing:'ffill'});
  let dates=[...base.dates],matrix=base.matrix.map(r=>r.slice()),names=[...base.names];
  const baseCopy=matrix.map(r=>r.slice()),baseDates=[...dates];
  const missing=base.missingCells.map(c=>({...c,col:names.indexOf(c.column)}));
  const changes=[],log=[];let changed=0;
  const accept=k=>p.ai&&p.ai[k]&&p.ai[k].decision==='accept';
  log.push({code:'base',rows:dates.length,missing:missing.length});
  if(accept('typo')){
    let best=null;
    names.forEach((name,j)=>{
      const col=matrix.map(r=>r[j]).filter(Number.isFinite);if(col.length<8)return;
      const med=CSV.quantileOf(col,.5),mad=CSV.quantileOf(col.map(v=>Math.abs(v-med)),.5)*1.4826;
      if(!(mad>0))return;
      matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;const score=Math.abs(v-med)/mad;if(!best||score>best.score)best={row:i,col:j,score,value:v,med,name};});
    });
    if(best){matrix[best.row][best.col]=best.med;changed++;changes.push({date:dates[best.row],name:best.name,before:best.value,after:best.med,key:'typo'});log.push({code:'typo',row:best.row+1,col:best.col+1,before:best.value,after:best.med});}
  }
  if(accept('zero')){
    let n=0;
    for(const cell of missing){const i=dates.indexOf(cell.date);if(i<0)continue;matrix[i][cell.col]=0;changed++;n++;changes.push({date:cell.date,name:cell.column,before:null,after:0,key:'zero'});}
    log.push({code:'zero',cells:n});
  }
  if(accept('drop')){
    const dropDates=new Set(missing.map(c=>c.date));const keep=dates.map(d=>!dropDates.has(d));
    matrix=matrix.filter((_,i)=>keep[i]);dates=dates.filter((_,i)=>keep[i]);changed+=keep.filter(x=>!x).length;
    log.push({code:'drop',rows:keep.filter(x=>!x).length});
  }
  if(accept('clamp')){
    let n=0;
    names.forEach((name,j)=>{
      const col=matrix.map(r=>r[j]).filter(Number.isFinite);if(col.length<2)return;
      const lo=S.mean(col)-3*S.sd(col),hi=S.mean(col)+3*S.sd(col);
      matrix.forEach((row,i)=>{const v=row[j];if(!Number.isFinite(v))return;const next=Math.min(hi,Math.max(lo,v));if(next!==v){matrix[i][j]=next;changed++;n++;changes.push({date:dates[i],name,before:v,after:next,key:'clamp'});}});
    });
    log.push({code:'clamp',cells:n});
  }
  if(accept('naive')){
    const naiveN=base.dates.length; /* reported, never executed: would turn mixed formats into NA */
    log.push({code:'naive',datesAtRisk:naiveN});
  }
  if(accept('long'))log.push({code:'long',rows:dates.length*names.length});
  const stats=j=>{const v=matrix.map(r=>r[j]).filter(Number.isFinite);return{n:v.length,mean:v.length?S.mean(v):NaN,sd:v.length>1?S.sd(v):NaN,min:v.length?Math.min(...v):NaN,max:v.length?Math.max(...v):NaN};};
  const baseStats=colStats(base),resultStats=colStats({names,matrix});
  const decisions=AI_SUGGESTIONS.map(s=>({...s,decision:p.ai[s.key].decision,reason:String(p.ai[s.key].reason||'').trim()}));
  return{base,names,dates,matrix,baseCopy,baseDates,missing,changes,changed,log,baseStats,resultStats,decisions,
    accepted:decisions.filter(d=>d.decision==='accept').length,rejected:decisions.filter(d=>d.decision==='reject').length,pending:decisions.filter(d=>d.decision==='pending').length,
    statsFor:j=>stats(j),meta:{...SAMPLE_META,rowsRaw:base.summary.rawRows,rowsClean:dates.length,columns:base.summary.assets+3}};
}
/* ---------- 6. 数据来源、格式与可追溯性 ---------- */
/* 这一节不联网：它把"取数规格"变成一份可复核的元数据与一套待人工执行的 R 模板，
   并说明为什么脚本里不能写死账号、为什么必须保存原始快照。 */
function dbView(p){
  const clean=cleanWith(p,{missing:'ffill'});
  const source=SOURCES.find(x=>x[0]===p.source)||SOURCES[0];
  const freq=FREQS.find(x=>x[0]===p.frequency)||FREQS[2];
  const adj=ADJS.find(x=>x[0]===p.adjust)||ADJS[2];
  const names=clean.names,dates=clean.dates,matrix=clean.matrix;
  /* 快照指纹：对整张清理后的表做确定性哈希，用于核对"这份文件就是当时那份"。 */
  const body=[names.join(','),...matrix.map((r,i)=>[dates[i],...r.map(v=>Number.isFinite(v)?v.toFixed(8):'')].join(','))].join('\n');
  let hash=2166136261;
  for(let i=0;i<body.length;i++)hash=Math.imul(hash^(body.charCodeAt(i)&0xff),16777619);
  const fingerprint=(hash>>>0).toString(16).padStart(8,'0');
  const formats={iso:0,slash:0,compact:0,other:0};
  clean.rawRowsSource?null:null;
  const meta={
    source:source[0],sourceLabel:source[1],sourceLabelEn:source[2],frequency:freq[0],frequencyLabel:freq[1],frequencyLabelEn:freq[2],adjust:adj[0],adjustLabel:adj[1],adjustLabelEn:adj[2],
    retrieved:p.retrieved,table:p.dbTable||'',rows:dates.length,assets:names.length,
    from:dates[0],to:dates[dates.length-1],unit:'decimal simple returns',
    missingPolicy:p.missing,outlierPolicy:`${p.outlier}/${p.outlierAction}`,
    fingerprint,license:['使用者自行确认（本页不代为声明）','User-confirmed (this page asserts no licence)'],
    notes:[
      ['凭证只能放在环境变量或 keyring 中，脚本里不得出现账号密码','Credentials belong in environment variables or a keyring; never put accounts or passwords in a script'],
      ['原始快照与清洗日志一起归档，指纹用于核对是否同一份数据','Archive the raw snapshot together with the cleaning log; the fingerprint shows whether two runs used the same file'],
      ['复权口径与频率必须与建模口径一致，否则收益率不可比','Adjustment and frequency must match the modelling convention, otherwise returns are not comparable'],
      ['跨源对齐要先统一交易日历与复权方式，再做日期配对','Align the trading calendar and adjustment before pairing dates across sources']
    ]
  };
  const rTemplate=[
    '# 取数模板（本页不执行；凭证从环境变量读取）',
    'if (meta$source == "db") {',
    '  # con <- DBI::dbConnect(odbc::odbc(), dsn = Sys.getenv("FML_DSN"))',
    '  # raw <- DBI::dbGetQuery(con, "select trade_date, asset, close from prices where trade_date between ? and ?",',
    '  #   params = list(start, end))',
    '  # DBI::dbDisconnect(con)',
    '}',
    'if (meta$source == "api") {',
    '  # quantmod::getSymbols("000001.SS", from = start, to = end, auto.assign = TRUE)',
    '}',
    'if (meta$source == "file") {',
    '  # raw <- read.csv(file.choose(), fileEncoding = "UTF-8")',
    '}',
    '# 存档：原始快照 + 元数据 + 指纹',
    '# write.csv(raw, "data/raw-snapshot.csv", row.names = FALSE)',
    '# tools::md5sum("data/raw-snapshot.csv")'
  ];
  return{clean,meta,rTemplate,sourceLabel:source[1],sourceEn:source[2],freqLabel:freq[1],freqEn:freq[2],adjLabel:adj[1],adjEn:adj[2],
    fingerprint,rows:dates.length,assets:names.length,from:dates[0],to:dates[dates.length-1],
    formats,flow:[['source','选择数据源'],['auth','凭证与权限'],['snapshot','保存原始快照'],['normalize','格式标准化'],['validate','校验与配对'],['log','元数据留痕']]};
}
/* ---------- view dispatch used by the workbench ---------- */
function buildView(view,p){
  check(p);
  if(view==='import')return importView(p);
  if(view==='dates')return datesView(p);
  if(view==='missing')return missingView(p);
  if(view==='outlier')return outlierView(p);
  if(view==='shape')return shapeView(p);
  if(view==='db')return dbView(p);
  return aiRun(p);
}
return{defaults,SOURCES,FREQS,ADJS,cloneDefaults,check,views,dbView,ASSET_LABELS,AI_KEYS,AI_SUGGESTIONS,DELIMS,POLICIES,METHODS,ACTIONS,RESAMPLE,
  sampleCSV,SAMPLE,SAMPLE_META,importView,datesView,missingView,outlierView,shapeView,aiRun,detectOutliers,colStats,buildView,
  formatOf,monthKeysBetween,logEntry};
});

;

/* Source: dataprep-code.js */
/* Experiment02 · R script builder. The messy sample is embedded verbatim, so
   the script reproduces the page's audit trail in a fresh R session. */
(function(root,factory){const api=factory(typeof module==='object'?require('./dataprep-math'):root.DataPrepMath);if(typeof module==='object')module.exports=api;else root.DataPrepCode=api;})(this,M=>{
'use strict';
function csvLines(text){return text.split('\n').map(l=>'"'+l.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"');}
function build(p,view='import',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const q=M.buildView(view,p);
  const raw=csvLines(p.csv);
  add('read',T('原样读入与列诊断','Read the raw file and profile every column'),
    ['# Experiment 02 | financial data preparation | base R only',
     T('# 第 1 步：原样读入，不做任何替换；缺失值先转成真正的 NA','# Step 1: read the file as-is; missing tokens become real NA'),
     `raw <- read.csv(text = paste(c(`,
     ...raw.map((l,i)=>'  '+l+(i===raw.length-1?'':',')),
     '), collapse = "\\n"), fileEncoding = "UTF-8",',
     '  na.strings = c("", "NA", "N/A", "null", "-", "--"), check.names = FALSE)',
     T('# 列类型：日期列为字符，其余按数值解析；空列与文本列单独记录','# Column types: the date column stays character, the rest are parsed as numeric; empty and text columns are recorded'),
     'str(raw); names(raw); dim(raw)',
     'candidate <- names(raw)[-1]',
     'text_cols <- candidate[vapply(candidate, function(nm) all(is.na(suppressWarnings(as.numeric(raw[[nm]])))), logical(1))]',
     'value_cols <- setdiff(candidate, text_cols)',
     'text_cols; value_cols'],
    T('先看清结构与类型，再决定清洗规则；任何一步替换都要写进日志。','Look at structure and types before choosing any cleaning rule, and log every replacement.'));
  add('dates',T('日期规范化、去重与排序','Normalise dates, drop duplicates, sort'),
    [T('# 第 2 步：三种日期写法统一为 ISO；解析失败立即停止','# Step 2: unify three date spellings to ISO; stop on any parse failure'),
     'parse_date <- function(x) {',
     '  out <- as.Date(x, format = "%Y-%m-%d")',
     '  miss <- is.na(out); out[miss] <- as.Date(x[miss], format = "%Y/%m/%d")',
     '  miss <- is.na(out); out[miss] <- as.Date(x[miss], format = "%Y%m%d")',
     '  if (anyNA(out)) stop("unparseable date: ", x[which(is.na(out))[1]])',
     '  out',
     '}',
     'raw$date <- parse_date(raw$date)',
     T('# 重复日期整行保留第一条，并记录条数','# Keep the first row of each duplicated date and record how many were dropped'),
     'dup <- duplicated(raw$date)',
     'cat("dropped duplicates:", sum(dup), "\\n")',
     'd0 <- raw[!dup, ]',
     'd0 <- d0[order(d0$date), ]',
     T('# 日期间隔：检查是否缺月（本样本 2025-01 缺失）','# Calendar gaps: check for missing months (2025-01 is missing here)'),
     'gap <- as.integer(diff(d0$date) / 30.4)',
     'cat("gaps above 1 month:", sum(gap > 1), "\\n")',
     'd0$date'],
    T('日期是主键：先统一写法、再去重、最后排序，否则配对会错位。','The date is the key: normalise, deduplicate, then sort, otherwise pairs go out of step.'));
  add('missing',T('缺失值策略与其代价','The missing-value policy and its cost'),
    [T('# 第 3 步：按所选策略处理缺失；三种策略的后果不同','# Step 3: apply the chosen policy; the three policies have different consequences'),
     `policy <- "${p.missing}"`,
     'num <- d0',
     'for (nm in value_cols) num[[nm]] <- suppressWarnings(as.numeric(num[[nm]]))',
     'before <- sum(is.na(num[value_cols]))',
     'cat("missing cells before:", before, "\\n")',
     'if (policy == "reject") stopifnot(before == 0)',
     'if (policy == "drop") num <- num[complete.cases(num[value_cols]), ]',
     'if (policy == "ffill") for (nm in value_cols) {',
     '  for (i in seq.int(2L, nrow(num))) if (is.na(num[[nm]][i])) num[[nm]][i] <- num[[nm]][i - 1L]',
     '}',
     'if (policy == "zero") for (nm in value_cols) num[[nm]][is.na(num[[nm]])] <- 0',
     'cat("rows kept:", nrow(num), "\\n")',
     T('# 删除与填补都会改变样本量与方差，必须写进元数据','# Deletion and filling both change sample size and variance; record them in the metadata'),
     'c(rows = nrow(num), missing_before = before, missing_after = sum(is.na(num[value_cols])))'],
    T('删除保留"真实观测"，填补保留样本量但引入人为结构；两者都要报告。','Deletion keeps real observations; filling keeps the sample size but injects artificial structure. Report either choice.'));
  add('outlier',T('异常值识别与处理','Identify and treat outliers'),
    [T('# 第 4 步：用所选规则标记异常；缩尾只改变被标记的单元格','# Step 4: flag outliers with the chosen rule; winsorising only changes the flagged cells'),
     `method <- "${p.outlier}"; k <- ${p.k}; action <- "${p.outlierAction}"`,
     'flags <- list()',
     'for (nm in value_cols) {',
     '  v <- num[[nm]]; ok <- !is.na(v)',
     '  if (sum(ok) < 8L) next',
     '  q <- quantile(v[ok], c(.25, .5, .75), names = FALSE)',
     '  iqr <- q[3] - q[1]',
     '  mad <- mad(v[ok], constant = 1.4826)',
     '  m <- mean(v[ok]); s <- sd(v[ok])',
     '  score <- switch(method,',
     '    z = abs(v - m) / s,',
     '    iqr = pmax((v - q[3]) / (k * iqr), (q[1] - v) / (k * iqr)),',
     '    mad = abs(v - q[2]) / (k * mad))',
     '  hit <- which(!is.na(score) & score > 1)',
     '  if (length(hit)) flags[[nm]] <- data.frame(date = num$date[hit], column = nm, value = v[hit], score = score[hit])',
     '}',
     'flag_table <- if (length(flags)) do.call(rbind, flags) else data.frame()',
     'print(flag_table)',
     'if (action == "winsorize") for (nm in value_cols) {',
     '  v <- num[[nm]]; lo <- quantile(v, .05, na.rm = TRUE); hi <- quantile(v, .95, na.rm = TRUE)',
     '  num[[nm]] <- pmin(hi, pmax(lo, v))',
     '}',
     'if (action == "drop" && nrow(flag_table)) num <- num[!(num$date %in% flag_table$date), ]'],
    T('异常值是"需要回源核对的可疑值"，不是可以静默替换的错误；缩尾会压缩方差。','An outlier is a suspect value to check at source, not an error to overwrite silently; winsorising compresses variance.'));
  if(mode==='full'){
    add('shape',T('宽表与长表','Wide and long layout'),
      [T('# 第 5 步：宽表一列一个资产，长表一行一个观测；两者是同一数据','# Step 5: wide has one column per asset, long one row per observation; they are the same data'),
       'long <- data.frame(',
       '  date = rep(num$date, times = length(value_cols)),',
       '  asset = rep(value_cols, each = nrow(num)),',
       '  value = unlist(num[value_cols], use.names = FALSE)',
       ')',
       'long <- long[order(long$date, long$asset), ]',
       'head(long); nrow(long)',
       T('# 还原宽表：reshape 的 id 必须唯一，否则会静默丢行','# Back to wide: the reshape id must be unique, otherwise rows are dropped silently'),
       'wide <- reshape(long, idvar = "date", timevar = "asset", direction = "wide")',
       'stopifnot(nrow(wide) == nrow(num))'],
      T('宽长转换失败通常来自重复日期或缺失的时间键；转换前后都要核对行数。','Wide/long conversion usually fails on duplicated dates or a missing time key; check row counts before and after.'));
    add('audit',T('清洗日志与元数据','Audit log and metadata'),
      [T('# 第 6 步：把每一步的行数变化写成可追溯的日志','# Step 6: record the row count after every step so the trail is reproducible'),
       'log <- data.frame(',
       '  step = c("read", "dedupe", "missing", "outlier"),',
       '  rows_in = c(nrow(raw), nrow(raw), nrow(d0), nrow(d0)),',
       '  rows_out = c(nrow(raw), nrow(d0), nrow(num), nrow(num)),',
       '  note = c("raw file", "duplicates dropped", policy, action)',
       ')',
       'print(log)',
       'print(head(num, 3)); print(tail(num, 3))',
       'meta <- list(source = "synthetic teaching sample", license = "CC0-1.0",',
       `  retrieved = "${M.SAMPLE_META.retrieved}", columns = ncol(raw), assets = length(value_cols))`,
       'str(meta)',
       'write.csv(num, "clean.csv", row.names = FALSE)'],
      T('清洗日志是实验的一部分：没有日志的清洗结果无法复核。','The cleaning log is part of the experiment: a result without a log cannot be re-checked.'));
  }
  if(view==='db'){
    add('db',T('取数规格与元数据','Extraction request and metadata'),
      ['# 来源、频率、复权与取数日期写进脚本，而不是留在脑子里',
       `meta <- list(source = "${p.source}", frequency = "${p.frequency}", adjust = "${p.adjust}",`,
       `  retrieved = "${String(p.retrieved||'').replace(/"/g,'')}", table = "${String(p.dbTable||'').replace(/"/g,'')}")`,
       'print(meta)',
       T('# 凭证只从环境变量读取；脚本里不出现账号与密码','# Credentials come from environment variables only; no accounts or passwords in the script'),
       '# con <- DBI::dbConnect(odbc::odbc(), dsn = Sys.getenv("FML_DSN"))',
       '# raw <- DBI::dbGetQuery(con, "select * from prices")',
       '# DBI::dbDisconnect(con)'],
      T('取数规格是实验的一部分：没有来源、频率与复权口径，任何收益率都不可比。','The extraction request is part of the experiment: without source, frequency and adjustment, no return is comparable.'));
    add('snapshot',T('原始快照与指纹','Raw snapshot and fingerprint'),
      ['# 先存原始快照，再从快照派生清洗结果；指纹用于核对"是不是同一份数据"',
       'dir.create("data", showWarnings = FALSE)',
       '# write.csv(raw, "data/raw-snapshot.csv", row.names = FALSE)',
       '# tools::md5sum("data/raw-snapshot.csv")',
       T('# 本页已算出的指纹（对清理后表格的确定性哈希）','# Fingerprint already computed on this page (deterministic hash of the cleaned table)'),
       `fingerprint <- "${q.fingerprint}"`, 'print(fingerprint)'],
      T('指纹不能证明数据正确，只能证明"两次用的是同一份文件"。','A fingerprint does not prove the data are correct; it only proves two runs used the same file.'));
    add('plot',T('清洗后的序列与快照对照','Cleaned series next to the snapshot'),
      [T('# 用基础绘图确认标准化后的量纲与频率','# Use base graphics to confirm the standardised units and frequency'),
       `plot(d0$date[seq_len(nrow(num))], num[[value_cols[1]]], type = "l",`,
       '  xlab = "date", ylab = "level", main = "standardised series")',
       'abline(v = as.Date(meta$retrieved), lty = 3)',
       T('# 竖线是取数日期；它必须在数据区间之外或之内都能解释清楚','# The vertical line is the retrieval date; it must be interpretable inside or outside the sample')],
      T('绘图是最后的量纲检查：频率错了、复权错了，曲线形状会立刻暴露。','Plotting is the final unit check: a wrong frequency or adjustment shows up immediately in the shape.'));
  }
  if(view==='ai'){
    add('ai',T('AI 建议的审查记录','Review record for the AI suggestions'),
      [T('# 每条 AI 建议都必须显式接受或拒绝，并写明理由','# Every AI suggestion must be accepted or rejected explicitly, with a reason'),
       'ai_review <- data.frame(',
       '  key = c('+M.AI_SUGGESTIONS.map(s=>'"'+s.key+'"').join(', ')+'),',
       '  decision = c('+M.AI_SUGGESTIONS.map(s=>'"'+(p.ai[s.key].decision)+'"').join(', ')+'),',
       `  effect = c(${q.changed}L)`,
       ')',
       'print(ai_review)',
       T('# 被接受的建议数','# Number of accepted suggestions'),
       `cat("accepted:", ${q.accepted}, "rejected:", ${q.rejected}, "pending:", ${q.pending}, "\\n")`],
      T('AI 建议只是候选操作；接受或拒绝都要给出理由，并记录它对数据的影响。','An AI suggestion is only a candidate action; accept or reject it with a reason and record its effect on the data.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,3):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 02 | financial data preparation\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});

;

/* Source: dataprep-workbench.js */
/* Experiment02 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=DataPrepMath,C=DataPrepCode;
const EXTRA={'备用字段':['备用字段','Spare column'],'备注':['备注','Note']};
const nm=(name,K)=>{const m=(M.ASSET_LABELS&&M.ASSET_LABELS[name])||EXTRA[name];return m?K.t(m[0],m[1]):name;};
const LAB={
  id:'dataprep',cls:'dataprep-lab',global:'DataPrepLab',
  views:M.views,
  defaults:()=>M.cloneDefaults(),
  check:p=>M.check(p),
  basic:false,
  params(p,view,K){
    const asset=[[0,'股票A','Stock A'],[1,'股票B','Stock B'],[2,'债券C','Bond C']];
    let html='';
    if(view==='import')html+=K.select({id:'delimiter',zh:'分隔符',en:'Delimiter',value:p.delimiter,options:M.DELIMS});
    if(view==='dates')html+=K.select({id:'resample',zh:'频率对齐',en:'Frequency alignment',value:p.resample,options:M.RESAMPLE});
    if(view==='missing')html+=K.select({id:'missing',zh:'缺失值策略',en:'Missing-value policy',value:p.missing,options:M.POLICIES});
    if(view==='outlier'){
      html+=K.select({id:'outlier',zh:'异常值规则',en:'Outlier rule',value:p.outlier,options:M.METHODS});
      html+=K.field({id:'k',zh:'阈值倍数',en:'Fence multiplier',value:p.k,min:.1,max:10,step:.1});
      html+=K.select({id:'outlierAction',zh:'处理方式',en:'Treatment',value:p.outlierAction,options:M.ACTIONS});
      html+=K.select({id:'asset',zh:'查看资产',en:'Asset shown',value:p.asset,options:asset});
    }
    if(view==='shape')html+=K.field({id:'bins',zh:'直方图分组',en:'Histogram bins',value:p.bins,min:4,max:40,step:1});
    if(view==='ai')html+=`<p class="lab-note">${K.esc(K.t('每条 AI 建议都要显式接受或拒绝并写明理由；未决策时结果保持基线。','Every AI suggestion must be accepted or rejected with a reason; undecided items leave the result at the baseline.'))}</p>`;
    if(view==='db'){
      html+=K.select({id:'source',zh:'来源类型',en:'Source type',value:p.source,options:M.SOURCES});
      html+=K.select({id:'frequency',zh:'数据频率',en:'Frequency',value:p.frequency,options:M.FREQS});
      html+=K.select({id:'adjust',zh:'复权口径',en:'Adjustment',value:p.adjust,options:M.ADJS});
      html+=`<label for="lab-retrieved"><span>${K.esc(K.t('取数日期（YYYY-MM-DD）','Retrieved (YYYY-MM-DD)'))}</span><input id="lab-retrieved" data-kind="text" type="text" value="${K.esc(p.retrieved)}"></label>`;
      html+=`<label for="lab-dbTable"><span>${K.esc(K.t('表/代码（仅记录，不连接）','Table / ticker (recorded only)'))}</span><input id="lab-dbTable" data-kind="text" type="text" value="${K.esc(p.dbTable||'')}"></label>`;
      html+=`<p class="lab-note">${K.esc(K.t('本页不联网、不连接数据库：它把取数规格落成可复核的元数据与一份待人工执行的 R 模板。','This page never goes online or connects to a database: it turns the request into auditable metadata plus an R template you run yourself.'))}</p>`;
    }
    const area=document.createElement('div');
    html+=`<div class="lab-block"><h3>${K.esc(K.t('数据源','Data source'))}</h3>
      <p class="lab-prose">${K.esc(K.t('内置 36 行故意弄脏的教学样本：混合日期写法、重复日期、缺失单元格、10 倍录入错误、空列与文本列。也可以粘贴你自己的 CSV；文件只在浏览器内处理。','The built-in 36-row teaching sample is deliberately messy: mixed date formats, a duplicated date, missing cells, a ten-fold entry error, an empty column and a free-text column. You can also paste your own CSV; it never leaves the browser.'))}</p>
      <label class="lab-file">${K.esc(K.t('CSV 文本','CSV text'))}<textarea id="lab-csv" class="lab-textarea" data-fml-skip rows="6">${K.esc(p.csv)}</textarea></label>
      <label class="lab-file">${K.esc(K.t('导入本地 CSV','Import a local CSV'))}<input id="lab-file" type="file" accept=".csv,text/csv"></label>
      <p class="lab-source">${K.esc(K.t('来源：合成教学样本 · 许可 CC0-1.0 · 读取日期 2026-11-14','Source: synthetic teaching sample · licence CC0-1.0 · retrieved 2026-11-14'))}</p></div>`;
    return html;
  },
  question(view){
    return {
      import:['读进来的是"数据"还是"文本"？列类型如何决定后续每一步？','Is the file data or text yet? How do column types drive every later step?'],
      dates:['三种日期写法、重复日期与缺月，会让配对错位到什么程度？','How far do three date spellings, a duplicated date and a missing month push the pairs out of step?'],
      missing:['删除、前值填充与补零，分别改变了什么？','What do deletion, carry-forward and zero-filling each change?'],
      outlier:['异常值是应当删除的"错误"，还是需要回源核对的"可疑值"？','Is an outlier an error to delete, or a suspect value to check at source?'],
      shape:['宽表与长表是同一份数据吗？转换前后如何核对？','Are wide and long the same data, and how do you reconcile them?'],
      ai:['AI 的清洗建议，哪一条应当拒绝？理由是什么？','Which AI cleaning suggestion should be rejected, and why?'],
      db:['同一份"月度总收益"从数据库、终端或本地文件取回，怎样证明它们是同一份数据？','Whether the data comes from a database, a terminal or a local file, how do you prove the three extracts are the same data?']
    }[view];
  },
  summary(view){
    return {
      import:[['先看类型','Types first'],['保留原文','Keep the raw text'],['记录来源','Record provenance']],
      dates:[['统一 ISO','Unify to ISO'],['去重','Deduplicate'],['检查缺月','Check gaps']],
      missing:[['删除','Drop'],['前值填充','Carry forward'],['补零有代价','Zero-filling has a cost']],
      outlier:[['先标记','Flag first'],['回源核对','Check at source'],['缩尾压方差','Winsorising compresses variance']],
      shape:[['宽表','Wide'],['长表','Long'],['核对行数','Reconcile counts']],
      ai:[['建议是候选','Suggestions are candidates'],['写明理由','State the reason'],['留痕','Keep the record']],
      db:[['来源可追溯','Traceable source'],['快照与指纹','Snapshot and fingerprint'],['口径先统一','Align the convention first']]
    }[view];
  },
  assumptions(view){
    return {
      import:['列类型由内容推断：全部可解析为日期则为日期列，全部可解析为数值则为数值列，否则按文本处理。空列与自由文本列不参与数值清洗，但会出现在日志里。','Column types are inferred from content: all-parseable dates are a date column, all-parseable numbers are numeric, anything else is text. Empty and free-text columns never enter numeric cleaning, but they do appear in the log.'],
      dates:['日期是主键。规范化后重复日期整行保留第一条，排序保证配对不错位；缺失的月份不会被填补成观测。解析失败立即停止，不静默丢弃。','The date is the key. After normalisation the first row of a duplicated date is kept and sorting keeps pairs aligned; a missing month is never invented as an observation. A parse failure stops the run instead of being dropped silently.'],
      missing:['删除保留真实观测但改变样本量；前值填充保留样本量并制造为零的收益；补零会把缺失当成"没有变化"。三种策略都必须写进清洗日志。','Deletion keeps real observations but changes the sample size; carry-forward keeps the size and manufactures zero returns; zero-filling treats a missing value as "no change". All three must be logged.'],
      outlier:['异常值先标记、再决定处理。z 分数受异常值本身影响，IQR 与 MAD 更稳健；缩尾会压缩方差并改变分位点，删除会减少样本。本样本中的 10 倍录入错误应当回源更正，而不是缩尾。','Flag outliers first, then decide. The z-score is itself distorted by the outlier, while IQR and MAD are robust; winsorising compresses variance and shifts quantiles, and deletion shrinks the sample. The ten-fold entry error here should be corrected at source rather than winsorised.'],
      shape:['宽表每行一个日期、每列一个资产；长表每行一个(日期,资产)观测。两者行数满足 长表行数 = 日期数 × 资产数；reshape 的时间键必须唯一。','Wide has one row per date and one column per asset; long has one row per (date, asset) observation. The row count satisfies long = dates × assets, and the reshape time key must be unique.'],
      ai:['AI 建议只是候选操作。接受的建议会进入管线并改变结果，拒绝的要写明理由；未决策时结果等于基线。用中位数替换 10 倍录入错误会让错误"看起来正常"，这正是要拒绝的理由。','An AI suggestion is only a candidate action. Accepted items enter the pipeline and change the result; rejected ones need a stated reason; undecided items leave the baseline. Replacing a ten-fold entry error with the median makes the error look normal, which is exactly why it must be rejected.'],
      db:['本视图不连接任何数据库或行情终端：它演示"取数规格 → 元数据 → R 模板 → 原始快照指纹"的流程。凭证只放在环境变量或 keyring，不得写入脚本；复权口径、频率与交易日历必须在取数时确定，不能留到建模阶段再猜。','This view connects to no database or market terminal: it demonstrates request → metadata → R template → snapshot fingerprint. Credentials live in environment variables or a keyring, never in the script; adjustment, frequency and the trading calendar must be fixed at extraction time, not guessed later during modelling.']
    }[view];
  },
  compute(p,view){return M.buildView(view,p);},
  chartTitle(q,p,view){return {db:['取数流程与留痕点','Extraction pipeline and audit points'],import:['列类型与缺失','Column types and missing cells'],dates:['月度日历与缺月','Monthly calendar and gaps'],missing:['缺失单元格分布','Missing-cell map'],outlier:['资产取值与围栏','Values and fences'],shape:['宽表与长表的行数','Wide and long row counts'],ai:['AI 建议的影响','Effect of the AI suggestions']}[view];},
  metrics(q,p,view,K){
    if(view==='db')return K.metrics([['处理行数','Rows',String(q.rows)],['资产列','Assets',String(q.assets)],['快照指纹','Snapshot fingerprint',q.fingerprint]]);
    if(view==='import')return K.metrics([['原始行数','Raw rows',String(q.rows)],['列数','Columns',String(q.columns)],['删除行数','Rows dropped',String(q.dropped)]]);
    if(view==='dates')return K.metrics([['有效日期','Valid dates',String(q.rows)],['重复日期','Duplicates',String(q.dupeCount)],['缺月','Missing months',String(q.gaps.length)]]);
    if(view==='missing'){const m=q.missing;return K.metrics([['缺失单元格','Missing cells',String(m.length)],['保留行数','Rows kept',String(q.applied.rows)],['策略','Policy',q.applied.policy]]);}
    if(view==='outlier')return K.metrics([['标记数','Flagged',String(q.allFlags.length)],['规则','Rule',p.outlier.toUpperCase()],['样本行','Rows',String(q.stats[0]?q.stats[0].n:0)]]);
    if(view==='shape')return K.metrics([['宽表行数','Wide rows',String(q.clean.dates.length)],['资产数','Assets',String(q.clean.names.length)],['长表行数','Long rows',String(q.long.length)]]);
    const a=q;return K.metrics([['接受','Accepted',String(a.accepted)],['拒绝','Rejected',String(a.rejected)],['待定','Pending',String(a.pending)]]);
  },
  legend(q,p,view,K){
    if(view==='db')return K.legend([['数据源','Source','#6689a8',false],['频率与复权','Frequency and adjustment','#9b88ac',false],['审计留痕','Audit trail','#659b8a',false]]);
    return K.legend([['数据','Data','#6689a8',false],['缺失/异常','Missing or outlier','#b5816f',true],['基准','Baseline','#b5bfcc',true]]);},
  chart(q,p,view,{svgHost,K}){
    if(view==='db'){
      return K.flow(svgHost(),[
        ['选源','Source',K.t(q.sourceLabel,q.sourceEn)],
        ['凭证','Creds','env'],
        ['快照','Snapshot',q.fingerprint],
        ['标准化','Normalise','ISO / decimal'],
        ['校验','Validate',`${q.rows}×${q.assets}`],
        ['留痕','Log',q.meta.retrieved]],2);
    }
    if(view==='import'){
      const names=q.before.map(c=>c.name),counts=q.before.map(c=>c.missing);
      return K.chart(svgHost(),{yZero:true,xLabel:['列','Column'],yLabel:['缺失单元格','Missing cells'],xTickFormat:v=>String(v).slice(0,6),
        series:[{type:'bar',points:counts.map((v,i)=>[i+1,v]),color:'#b5816f',gap:.6,tip:d=>[`${names[Math.round(d[0])-1]}：${Math.round(d[1])} 个缺失`,'Column '+Math.round(d[0])+': '+Math.round(d[1])+' missing']}],aria:['缺失分布','Missing values']});
    }
    if(view==='dates'){
      return K.chart(svgHost(),{yZero:true,xLabel:['月份序号','Month index'],yLabel:['观测数','Observations'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'bar',points:q.calendar.map((c,i)=>[i+1,c.present?1:0]),color:'#6689a8',gap:.75,tip:d=>[`${q.calendar[Math.round(d[0])-1].k}：${q.calendar[Math.round(d[0])-1].present?'存在':'缺失'}`,'Month '+q.calendar[Math.round(d[0])-1].k+': '+(q.calendar[Math.round(d[0])-1].present?'present':'missing')]}],
        refs:[{axis:'y',value:1,color:'#659b8a',dash:true}],aria:['月度日历','Monthly calendar']});
    }
    if(view==='missing'){
      const rows=q.applied.clean.matrix.length;
      const per=q.applied.clean.names.map((n,j)=>q.applied.clean.matrix.filter(r=>!Number.isFinite(r[j])).length);
      return K.chart(svgHost(),{yZero:true,xLabel:['列','Column'],yLabel:['缺失单元格','Missing cells'],
        series:[{type:'bar',points:per.map((v,i)=>[i+1,v]),color:'#b5816f',gap:.6,tip:d=>[`${q.applied.clean.names[Math.round(d[0])-1]}：${Math.round(d[1])}`,'Column '+Math.round(d[0])+': '+Math.round(d[1])]}],
        refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['清洗后缺失','Missing after cleaning']});
    }
    if(view==='outlier'){
      const f=q.det.fences.find(x=>x.j===Number(p.asset))||q.det.fences[0];
      const s=q.series[f.j]||[];
      return K.chart(svgHost(),{yZero:false,xLabel:['观测序号','Observation'],yLabel:['取值','Value'],
        series:[{type:'line',points:s.map((v,i)=>[i+1,v]),color:'#6689a8',marker:true,tip:d=>[`第 ${Math.round(d[0])} 个观测：${Number(d[1]).toFixed(3)}`,'Observation '+Math.round(d[0])+': '+Number(d[1]).toFixed(3)]}],
        refs:[{axis:'y',value:f.lo,color:'#b5816f',dash:true,label:['下围栏','lower fence']},{axis:'y',value:f.hi,color:'#b5816f',dash:true,label:['上围栏','upper fence']}],
        aria:['取值与围栏','Values and fences']});
    }
    if(view==='shape'){
      return K.flow(svgHost(),[['宽表','Wide',q.clean.dates.length+' × '+q.clean.names.length],['重整','Reshape',''],['长表','Long',String(q.long.length)],['导出','Export','CSV']],1);
    }
    const marks=q.decisions.map((d,i)=>d.decision==='reject'?[i+1,-1]:d.decision==='accept'?[i+1,1]:[i+1,0]);
    return K.chart(svgHost(),{yZero:true,xLabel:['建议序号','Suggestion index'],yLabel:['决策：拒绝 −1 / 待定 0 / 接受 1','Decision: reject −1 / pending 0 / accept 1'],
      xTickFormat:v=>String(Math.round(v)),series:[{type:'bar',points:marks,color:'#8c80a3',gap:.6,tip:d=>[`${q.decisions[Math.round(d[0])-1].title[0]}：${d[1]>0?'接受':d[1]<0?'拒绝':'待定'}`,'Suggestion '+Math.round(d[0])+': '+(d[1]>0?'accept':d[1]<0?'reject':'pending')]}],
      refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['AI 决策','AI decisions']});
  },
  details(q,p,view,K){
    if(view==='db'){
      const m=q.meta;
      return K.table([['字段','Field'],['值','Value']],[
        [K.t('数据来源','Source'),K.t(m.sourceLabel,m.sourceLabelEn)],[K.t('频率','Frequency'),K.t(m.frequencyLabel,m.frequencyLabelEn)],[K.t('复权口径','Adjustment'),K.t(m.adjustLabel,m.adjustLabelEn)],
        [K.t('取数日期','Retrieved'),m.retrieved],[K.t('表/代码','Table / ticker'),m.table||'—'],
        [K.t('区间','Range'),`${m.from} → ${m.to}`],[K.t('规模','Size'),`${m.rows} × ${m.assets}`],
        [K.t('单位','Unit'),m.unit],[K.t('缺失策略','Missing policy'),m.missingPolicy],[K.t('异常策略','Outlier policy'),m.outlierPolicy],
        [K.t('快照指纹','Snapshot fingerprint'),m.fingerprint],[K.t('许可','Licence'),K.t(m.license[0],m.license[1])]])+
        `<p class="chart-note">${m.notes.map(n=>K.esc(K.t(n[0],n[1]))).join('<br>')}</p>`+
        `<p class="chart-note">${K.esc(K.t('连接模板在左侧 R 代码的"取数规格与元数据"段落里，全部注释、不会自动执行。','The connection template lives in the "Extraction request and metadata" block of the R code on the left; it is fully commented and never runs.'))}</p>`;
    }
    if(view==='import')return K.table([['列','Column'],['类型','Type'],['缺失','Missing']],q.before.map(c=>[nm(c.name,K),c.type,String(c.missing)]))+
      `<p class="chart-note">${K.esc(K.t('分隔符：','Delimiter: '))}${K.esc(q.delimiter)}${K.esc(K.t('；解析后的行数变化记录在清洗日志中。','; every row-count change is recorded in the audit log.'))}</p>`;
    if(view==='dates')return K.table([['日期写法','Spelling'],['条数','Rows']],Object.entries(q.formats).map(([k,v])=>[k,String(v)]))+
      `<p class="chart-note">${K.esc(K.t('重复日期：','Duplicated dates: '))}${q.duplicates.map(d=>d.date).join(', ')||'—'}${K.esc(K.t('；缺月：','; missing months: '))}${q.gaps.join(', ')||'—'}</p>`;
    if(view==='missing')return K.table([['策略','Policy'],['可行','Feasible'],['保留/影响','Rows']],q.policies.map(x=>[x.policy,x.ok?K.t('可行','feasible'):K.t('冲突','conflict'),String(x.ok?x.rows:'—')]));
    if(view==='outlier')return K.table([['资产','Asset'],['围栏下','Lower'],['围栏上','Upper'],['标记','Flagged']],q.det.fences.map(f=>[nm(f.name,K),Number(f.lo).toFixed(3),Number(f.hi).toFixed(3),String(f.count)]));
    if(view==='shape')return K.table([['格式','Layout'],['行数','Rows'],['列数','Columns']],[[K.t('宽表','Wide'),'—',String(q.clean.dates.length),String(q.clean.names.length)],[K.t('长表','Long'),'—',String(q.long.length),'3']]).replace(/<\/table>$/,'</table>')+`<p class="chart-note">${K.esc(K.t('长表预览：','Long preview: '))}${q.preview.slice(0,3).map(r=>r.date+' · '+nm(r.asset,K)+' · '+r.value).join(' | ')}</p>`;
    const rows=q.decisions.map((d,i)=>[K.t(...d.title),K.t(d.verdict==='reject'?'应当拒绝':'应当接受',d.verdict==='reject'?'reject':'accept'),K.t(...d.why)]);
    return K.table([['AI 建议','Suggestion'],['结论','Verdict'],['理由','Reason']],rows)+`<p class="chart-note">${K.esc(K.t('被接受的建议改变了 ','Accepted suggestions changed '))}${q.changed}${K.esc(K.t(' 个单元格。',' cells.'))}</p>`;
  },
  graphKind(view){return {db:['来源与格式','Source and format'],import:['导入与诊断','Import and profiling'],dates:['日期与频率','Dates and frequency'],missing:['缺失值','Missing values'],outlier:['异常值','Outliers'],shape:['宽长表','Wide and long'],ai:['AI 清洗','AI cleaning']}[view];},
  tasks(view,{K}){
    return [['先核对列类型，再决定清洗；任何替换都要能回答"为什么"。','Check column types before cleaning; every replacement must answer "why".'],
      ['把清洗日志与来源元数据一起写进实验报告。','Put the audit log and provenance metadata into the report.'],
      ['复制完整脚本到 RStudio 整段运行，核对保留行数与标记数。','Copy the script into RStudio and check the kept rows and flags.']];
  },
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  onFile:(input,done)=>{const f=input.files&&input.files[0];if(!f)return;if(f.size>4000000){alert('CSV 超过 4MB');return;}f.text().then(done);},
  teacher:['六节对应大纲的"金融市场数据库、数据格式、导入、预处理"与 AI 自动清洗对比。建议顺序：导入诊断 → 日期 → 缺失 → 异常 → 宽长表 → AI 审查。重点是让学生说清楚每种选择的代价，而不是记住一条"最佳实践"。AI 一节必须要求学生指出为什么"用中位数替换 10 倍录入错误"是错的。',
    'The six sections follow the syllabus: market databases, data formats, import and preprocessing, plus the AI cleaning comparison. Recommended order: import → dates → missing → outlier → wide/long → AI review. The goal is for students to state the cost of each choice rather than memorise a best practice. In the AI section they must explain why replacing a ten-fold entry error with the median is wrong.'],
  help:['页面本身不执行 R；每节都会生成可整段运行的基础 R 脚本。CSV 只在浏览器内处理，不上传。右上角可切换中文/English，数值与脚本保持不变。','The page does not run R; every section generates a standalone base-R script. The CSV stays in the browser. The language switch keeps numbers and scripts identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：保留行数、被删除的重复日期条数、缺失值处理后的行数、异常标记条数与长表行数。注意脚本会把 2025-01 记为缺月，但不会替你补一行。','Create a new R Script and run the whole script. Check the kept rows, the dropped duplicate date, the row count after the missing-value policy, the number of flags and the long-format row count. The script reports 2025-01 as a missing month but never invents a row for it.'],
  fileName:'experiment02-data-preparation.R'
};
window.DataPrepWorkbench={mount:()=>LabRunner.mount(LAB)};
})();

;

/* Source: returns-math.js */
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

;

/* Source: returns-code.js */
/* Experiment03 · R script builder: stock returns, bond analytics and the
   distribution of returns. Base R only, comments follow the UI language. */
(function(root,factory){const api=factory(typeof module==='object'?require('./returns-math'):root.ReturnsMath);if(typeof module==='object')module.exports=api;else root.ReturnsCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
const rv=(r)=>'c('+r.map(v=>num(Number(v.toFixed(12)))).join(', ')+')';
function build(p,view='stock',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const s=M.stock(p),b=M.bond(p),d=M.distribution(p);
  if(view==='stock'){
    add('simple',T('简单收益与对数收益','Simple and log returns'),
      ['# Experiment 03 | returns | stocks and bonds | base R',
       T('# 参数：期初价格、期末价格、期间股息','# Parameters: initial price, terminal price, dividends received'),
       `p0 <- ${num(p.p0)}`, `p1 <- ${num(p.p1)}`, `div <- ${num(p.dividend)}`, `periods <- ${p.periods}L`,
       'simple <- p1 / p0 - 1', 'logret <- log(p1 / p0)',
       'print(c(simple = simple, log = logret))',
       T('# 简单收益可跨期相加近似；对数收益可加，但单位不是金额','# Simple returns add across assets; log returns add over time but are not currency amounts'),
       'cat("simple * 100 =", simple * 100, "\\n")'],
      T('简单收益回答"赚了多少比例"，对数收益回答"连续复利下的增长率"。两者只在收益率较小时接近。','A simple return answers "what fraction was gained"; a log return answers "the continuously compounded growth rate". They only agree for small returns.'));
    add('total',T('股息调整总收益','Dividend-adjusted total return'),
      [T('# 总收益必须包含现金股息，否则会低估长期回报','# Total return must include cash dividends, otherwise long-run performance is understated'),
       'total <- (p1 + div) / p0 - 1',
       'div_yield <- div / p0',
       'print(c(total = total, price_only = simple, dividend_yield = div_yield))',
       T('# 多期年化：几何年化用复合，算术年化会高估长期回报','# Multi-period annualisation: geometric compounds, arithmetic overstates long-run growth'),
       'geo_annual <- (1 + total)^(1 / periods) - 1',
       'print(c(geometric_annual = geo_annual))'],
      T('总收益把价格变动与股息都算进来；年化必须用几何平均，算术平均只适合描述单期。','Total return combines price change and dividends; annualising must use the geometric mean, while the arithmetic mean only describes one period.'));
    add('compare',T('三种口径对照','Three conventions compared'),
      [T('# 同一笔投资在三种口径下的结果','# The same investment under three conventions'),
       `out <- data.frame(convention = c("price only", "log", "total"),`,
       '  value = c(simple, logret, total),',
       '  annualised = c((1 + simple)^(1 / periods) - 1, logret / periods, (1 + total)^(1 / periods) - 1))',
       'print(out)'],
      T('三种口径不能混用：报告"年化收益"时必须说明是价格收益还是总收益、几何还是算术。','The three conventions cannot be mixed: an annualised figure must state price versus total return and geometric versus arithmetic.'));
  }
  if(view==='bond'){
    add('price',T('债券价格、应计利息与全价','Bond price, accrued interest and dirty price'),
      [T('# 现金流贴现：每期票息加到期面值，按 y/f 贴现','# Discount each coupon and the face value at y/f'),
       `face <- ${num(p.face)}; coupon <- ${num(p.coupon)}; freq <- ${p.freq}L`,
       `maturity <- ${num(p.maturity)}; ytm <- ${num(p.ytm)}; t_since <- ${num(p.tSince)}`,
       'cpn <- face * coupon / freq',
       'left <- 1 - t_since',
       'n <- round(maturity * freq)',
       'idx <- 0:(n - 1)',
       'amount <- rep(cpn, n); amount[n] <- amount[n] + face',
       'pv <- amount / (1 + ytm / freq)^(idx + left)',
       'dirty <- sum(pv)',
       'accrued <- cpn * t_since',
       'clean <- dirty - accrued',
       'print(c(clean = clean, accrued = accrued, dirty = dirty))'],
      T('全价＝净价＋应计利息；报价通常用净价，结算用全价。','Dirty price = clean price + accrued interest. Quotes usually use the clean price while settlement uses the dirty price.'),
      String.raw`P=\sum_{k=0}^{n-1}\frac{c+F\mathbf{1}_{k=n-1}}{(1+y/f)^{k+1-w}}+`);
    add('duration',T('久期与凸性','Duration and convexity'),
      [T('# 麦考利久期是现金流时间的现值加权平均','# Macaulay duration is the present-value-weighted average time'),
       'w <- pv / dirty',
       't_k <- (idx + left) / freq',
       'macaulay <- sum(t_k * w)',
       'modified <- macaulay / (1 + ytm / freq)',
       'convexity <- sum(t_k * (t_k + 1 / freq) * w) / (1 + ytm / freq)^2',
       'print(c(macaulay = macaulay, modified = modified, convexity = convexity))',
       'dv01 <- -modified * dirty * 1e-4',
       'cat("DV01 (per 1bp):", dv01, "\\n")'],
      T('修正久期给出收益率变动 1% 时价格的近似百分比变化；凸性修正大幅变动时的非线性。','Modified duration gives the approximate percentage price change for a one-percent yield move; convexity corrects the curvature for large moves.'),
      String.raw`D_{mod}=\frac{D_{mac}}{1+y/f},\quad \Delta P\approx -D_{mod}P\Delta y+\tfrac12 C P(\Delta y)^2`);
    add('hpr',T('持有期收益','Holding-period return'),
      [T('# 持有期内收到票息，到期前按新收益率卖出','# Coupons are received and the bond is sold at a new yield'),
       `exit_ytm <- ${num(p.exitYtm)}; hold <- ${num(p.holdYears)}`,
       'remain <- round((maturity - hold) * freq)',
       'k <- 0:(remain - 1)',
       'cash <- rep(cpn, remain); cash[remain] <- cash[remain] + face',
       'exit_price <- sum(cash / (1 + exit_ytm / freq)^(k + 1))',
       'coupons <- cpn * round(hold * freq)',
       'hpr <- (exit_price + coupons - dirty) / dirty',
       'print(c(exit_price = exit_price, coupons = coupons, hpr = hpr))',
       T('# 分解：票息收益 + 资本利得（含收益率变动）','# Decompose into coupon income and capital gain including the yield change'),
       'print(c(coupon_part = coupons / dirty, capital_part = (exit_price - dirty) / dirty))'],
      T('持有期收益把票息与卖出价差放在一起；它依赖假设的卖出收益率，不是承诺收益。','Holding-period return combines coupons and the sale price difference; it depends on the assumed exit yield and is not a promised return.'));
  }
  if(view==='dist'||view==='qq'){
    add('dist',T('收益分布的四阶矩','Four moments of the return distribution'),
      [T('# 固定种子生成的合成日收益：偶发跳跃制造厚尾','# Synthetic daily returns from a fixed seed: jumps create fat tails'),
       T('# 与网页逐项一致的确定性样本（固定种子，非真实行情）','# Deterministic sample identical to the page (fixed seed, not a market quote)'),
       `r <- ${rv(d.r)}`,
       'center <- mean(r); spread <- sd(r); n <- length(r)',
       'z <- (r - center) / spread',
       'skew <- length(r) / ((length(r) - 1) * (length(r) - 2)) * sum(z^3)',
       'kurt <- length(r) * (length(r) + 1) / ((length(r) - 1) * (length(r) - 2) * (length(r) - 3)) * sum(z^4) - 3 * (length(r) - 1) / (length(r) - 2)',
       'jb <- length(r) / 6 * (skew^2 + kurt^2 / 4)',
       'print(c(mean = center, sd = spread, skew = skew, kurt = kurt, jb = jb))',
       'cat("JB p-value:", pchisq(jb, 2L, lower.tail = FALSE), "\\n")'],
      T('均值与标准差描述位置和尺度，偏度与峰度描述形状；Jarque–Bera 把后两者合成一个正态性检验。','Mean and standard deviation describe location and scale; skewness and kurtosis describe shape; Jarque–Bera combines the two into a normality test.'),
      String.raw`JB=\frac{n}{6}\left(S^2+\frac{(K-3)^2}{4}\right)\sim\chi^2_2`);
    add('annual',T('年化的口径陷阱','The annualisation trap'),
      [T('# 均值与波动率可以乘 252 / √252，高阶矩不能这样缩放','# Mean and volatility scale by 252 and √252; higher moments do not'),
       'print(c(annual_arith = center * 252, annual_compound = (1 + center)^252 - 1, annual_vol = spread * sqrt(252)))',
       T('# 复合年化必须用实际路径，不能用均值乘 252','# Compounding must use the realised path, not the mean times 252'),
       `level <- 100 * exp(sum(log1p(r)))`,
       'print(c(level = level, compound_from_path = (level / 100)^(1 / (n / 252)) - 1))'],
      T('"年化收益"必须说明是算术还是复合、是否含股息、用多少天；年化偏度没有意义。','An annualised figure must state arithmetic versus compound, whether dividends are included and the day count; annualising skewness is meaningless.'));
    if(mode==='full'){
      add('plot',T('直方图与正态参照','Histogram and the normal reference'),
        [T('# 同一均值与标准差的正态曲线只作为形状参照','# A normal curve with the same mean and standard deviation is only a shape reference'),
         'hist(r, breaks = "FD", probability = TRUE, xlab = "daily simple return", main = "Synthetic daily returns")',
         'curve(dnorm(x, center, spread), add = TRUE, lty = 2)',
         'qqnorm(r); qqline(r)',
         'boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")'],
        T('直方图看整体形状，QQ 图看两端偏离，箱线图看单点异常；三者不能互相替代。','The histogram shows overall shape, the QQ plot shows tail departures and the box plot shows single observations; none replaces the others.'));
    }
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 03 | asset returns\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});

;

/* Source: returns-workbench.js */
/* Experiment03 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=ReturnsMath,C=ReturnsCode;
const LAB={
  id:'returns',cls:'returns-lab',global:'ReturnsLab',
  views:M.views,
  defaults:()=>({...M.defaults}),
  check:p=>M.check(p),
  params(p,view,K){
    if(view==='stock')return K.field({id:'p0',zh:'期初价格',en:'Initial price',value:p.p0,min:.01,step:.01})+
      K.field({id:'p1',zh:'期末价格',en:'Terminal price',value:p.p1,min:.01,step:.01})+
      K.field({id:'dividend',zh:'期间股息（元）',en:'Dividends received',value:p.dividend,min:0,step:.1})+
      K.field({id:'periods',zh:'持有年数',en:'Years held',value:p.periods,min:1,max:20,step:1});
    if(view==='bond')return K.field({id:'face',zh:'面值',en:'Face value',value:p.face,min:1,step:1})+
      K.field({id:'coupon',zh:'票面利率（年）',en:'Annual coupon rate',value:p.coupon,min:0,max:.2,step:.001})+
      K.select({id:'freq',zh:'付息频率',en:'Coupon frequency',value:p.freq,options:[[1,'每年','Annual'],[2,'每半年','Semi-annual'],[4,'每季','Quarterly'],[12,'每月','Monthly']]})+
      K.field({id:'maturity',zh:'剩余期限（年）',en:'Years to maturity',value:p.maturity,min:.5,max:30,step:.5})+
      K.field({id:'ytm',zh:'到期收益率',en:'Yield to maturity',value:p.ytm,min:-.2,max:.3,step:.001})+
      K.field({id:'tSince',zh:'本付息周期已过比例',en:'Fraction of the coupon period elapsed',value:p.tSince,min:0,max:.99,step:.05})+
      K.field({id:'exitYtm',zh:'卖出时收益率',en:'Exit yield',value:p.exitYtm,min:-.2,max:.3,step:.001})+
      K.field({id:'holdYears',zh:'持有年数',en:'Holding period (years)',value:p.holdYears,min:.5,max:30,step:.5});
    if(view==='dist'||view==='qq')return K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:60,max:1200,step:1})+
      K.field({id:'mu',zh:'日收益均值',en:'Daily mean',value:p.mu,min:-.01,max:.01,step:.001})+
      K.field({id:'sigma',zh:'日波动率',en:'Daily volatility',value:p.sigma,min:.001,max:.1,step:.001})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
    return '';
  },
  question(view){return {
    stock:['价格涨了 12%，投资者真的赚了 12% 吗？','The price rose 12% — did the investor really earn 12%?'],
    bond:['一张 5 年期、票息 4.5% 的债券，为什么报价 103 而全价 104？','A 5-year 4.5% bond is quoted at 103 but settles at 104 — why?'],
    dist:['收益率的均值和标准差，够不够描述它的形状？','Are the mean and standard deviation enough to describe a return distribution?'],
    qq:['QQ 图两端的偏离，说明正态假设哪里出问题？','What do the QQ-plot tail departures say about the normal assumption?']
  }[view];},
  summary(view){return {
    stock:[['含股息','Include dividends'],['对数可加','Logs add up'],['几何年化','Geometric annualising']],
    bond:[['净价 vs 全价','Clean vs dirty'],['久期','Duration'],['持有期收益','Holding-period return']],
    dist:[['四阶矩','Four moments'],['跳跃制造厚尾','Jumps create tails'],['JB 检验','Jarque–Bera']],
    qq:[['分位对分位','Quantile vs quantile'],['尾部偏离','Tail departures'],['不能只看均值','Not just the mean']]
  }[view];},
  assumptions(view){return {
    stock:['价格与股息均为固定教学假设，不是真实行情。简单收益回答"比例"，对数收益回答"连续复利增长率"；总收益必须包含现金股息，多期年化使用几何平均。','Prices and dividends are fixed teaching assumptions, not market quotes. A simple return is a fraction, a log return is a continuously compounded rate; total return must include cash dividends and multi-period annualising uses the geometric mean.'],
    bond:['报价使用净价、结算使用全价；应计利息按当前付息周期已过比例线性累计，未考虑实际天数规则与节假日。久期与凸性是收益率小幅平行变动的局部近似，不适用于信用风险或大幅曲线变动。','Quotes use the clean price and settlement the dirty price; accrued interest is linear in the elapsed share of the coupon period, ignoring actual day-count conventions and holidays. Duration and convexity are local approximations for small parallel yield changes, not for credit events or large curve shifts.'],
    dist:['样本为固定种子生成的合成日收益，奇数次跳跃制造厚尾；偏度与峰度使用与 R 一致的无偏样本公式，Jarque–Bera 检验正态性，但大样本下几乎总能拒绝。','The sample is synthetic daily returns from a fixed seed, with occasional jumps creating fat tails. Skewness and kurtosis use the same unbiased sample formulas as R, and Jarque–Bera tests normality — which almost always rejects in large samples.'],
    qq:['QQ 图把样本分位与同均值同标准差的正态分位比较；两端向上偏离说明右尾更厚。它不检验独立性，也不告诉你应该用哪个分布。','The QQ plot compares sample quantiles with normal quantiles of the same mean and standard deviation; upward departures at the right mean a fatter right tail. It does not test independence and does not tell you which distribution to use.']
  }[view];},
  compute(p,view){
    if(view==='stock')return M.stock(p);
    if(view==='bond')return M.bond(p);
    return M.histogram(p,view);
  },
  chartTitle(q,p,view){return {
    stock:['三种收益率口径','Three return conventions'],
    bond:['现金流现值与久期位置','Present values of the cash flows and the duration marker'],
    dist:['直方图与同参数正态密度','Histogram with the matching normal density'],
    qq:['QQ 图：样本分位与正态分位','QQ plot: sample versus normal quantiles']
  }[view];},
  metrics(q,p,view,K){
    if(view==='stock')return K.metrics([['简单收益','Simple return',K.pct(q.priceRet)],['对数收益','Log return',K.pct(q.logRet)],['总收益','Total return',K.pct(q.total)]]);
    if(view==='bond')return K.metrics([['净价','Clean price',q.clean.toFixed(3)],['全价','Dirty price',q.dirty.toFixed(3)],['修正久期','Modified duration',q.modified.toFixed(3)]]);
    if(view==='dist')return K.metrics([['日均值','Daily mean',K.pct(q.mean,3)],['日波动率','Daily volatility',K.pct(q.sd,3)],['超额峰度','Excess kurtosis',q.kurt.toFixed(2)]]);
    return K.metrics([['JB 统计量','Jarque–Bera',q.jb.jb.toFixed(1)],['JB p 值','JB p-value',q.jb.p<1e-6?'< 1e-6':q.jb.p.toFixed(4)],['偏度','Skewness',q.skew.toFixed(3)]]);
  },
  legend(q,p,view,K){
    if(view==='bond')return K.legend([['现金流现值','Present value','#6689a8',false],['久期位置','Duration marker','#9b88ac',true]]);
    if(view==='stock')return K.legend([['价格收益','Price return','#6689a8',false],['总收益','Total return','#659b8a',false]]);
    return K.legend([['样本','Sample','#6689a8',false],['正态参照','Normal reference','#9b88ac',true],['45° 参照','45° reference','#659b8a',true]]);
  },
  chart(q,p,view,{svgHost,K}){
    if(view==='stock'){
      const rows=[[K.t('简单收益','Simple'),q.priceRet],[K.t('对数收益','Log'),q.logRet],[K.t('总收益','Total'),q.total]];
      return K.chart(svgHost(),{yZero:true,xLabel:['口径','Convention'],yLabel:['收益率','Return'],xTickFormat:v=>[K.t('简单','Simple'),K.t('对数','Log'),K.t('总收益','Total')][Math.round(v)-1],
        series:[{type:'bar',points:rows.map((r,i)=>[i+1,r[1]]),color:'#6689a8',gap:.55,tip:d=>[`${rows[Math.round(d[0])-1][0]}：${K.pct(d[1])}`,`${rows[Math.round(d[0])-1][0]}: ${K.pct(d[1])}`]}],
        aria:['三种收益率','Three return conventions']});
    }
    if(view==='bond'){
      return K.chart(svgHost(),{yZero:true,xLabel:['期数','Period'],yLabel:['现值（元）','Present value'],
        series:[{type:'bar',points:q.flows.map((f,i)=>[i+1,f.pv]),color:'#6689a8',gap:.5,tip:d=>[`第 ${Math.round(d[0])} 期现金流 ${f2(q.flows[Math.round(d[0])-1].amount)} 元，现值 ${f2(d[1])} 元`,'Period '+Math.round(d[0])+': cash flow '+f2(q.flows[Math.round(d[0])-1].amount)+', PV '+f2(d[1])]}],
        refs:[{axis:'x',value:q.macaulay*p.freq,color:'#9b88ac',label:['麦考利久期','Macaulay duration']}],
        aria:['现金流现值','Present values of cash flows']});
    }
    if(view==='dist'){
      return K.chart(svgHost(),{yZero:true,xLabel:['日收益','Daily return'],yLabel:['观测数','Count'],
        series:[{type:'bar',points:q.bins.map(b=>[b.x,b.y]),color:'#6689a8',gap:.92,tip:d=>[`${K.pct(d[0])} 附近 ${Math.round(d[1])} 个观测`,'near '+K.pct(d[0])+': '+Math.round(d[1])+' observations']},
          {type:'line',points:q.density.map((v,i)=>[q.bins[i].x,v]),color:'#9b88ac'}],aria:['收益直方图','Return histogram']});
    }
    return K.chart(svgHost(),{xLabel:['正态分位','Normal quantile'],yLabel:['样本收益','Sample return'],yZero:true,
      series:[{type:'scatter',points:q.qq.map(d=>[d.x,d.y]),color:'#6689a8',radius:3,tip:d=>[`z=${d[0].toFixed(2)}；r=${K.pct(d[1])}`,'z='+d[0].toFixed(2)+'; r='+K.pct(d[1])]},
        {type:'line',points:[[q.qq[0].x,q.mean+q.sd*q.qq[0].x],[q.qq.at(-1).x,q.mean+q.sd*q.qq.at(-1).x]],color:'#659b8a',dash:true}],
      aria:['QQ 图','QQ plot']});
  },
  details(q,p,view,K){
    if(view==='stock')return K.table([['口径','Convention'],['数值','Value']],[
      [K.t('简单收益','Simple return'),K.pct(q.priceRet)],[K.t('对数收益','Log return'),K.pct(q.logRet)],[K.t('股息收益率','Dividend yield'),K.pct(q.dividendYield)],
      [K.t('总收益','Total return'),K.pct(q.total)],[K.t('几何年化','Geometric annual'),K.pct(q.perTotal)]]);
    if(view==='bond')return K.table([['项目','Item'],['数值','Value']],[
      [K.t('应计利息','Accrued interest'),q.accrued.toFixed(4)],[K.t('净价','Clean price'),q.clean.toFixed(4)],[K.t('全价','Dirty price'),q.dirty.toFixed(4)],
      [K.t('麦考利久期','Macaulay duration'),q.macaulay.toFixed(4)],[K.t('修正久期','Modified duration'),q.modified.toFixed(4)],[K.t('凸性','Convexity'),q.convexity.toFixed(4)],
      ['DV01',q.dv01.toFixed(4)],[K.t('持有期收益','Holding-period return'),K.pct(q.hpr)],[K.t('票息部分','Coupon part'),K.pct(q.couponRet)],[K.t('资本利得','Capital part'),K.pct(q.capGain)]])+
      `<p class="chart-note">${K.esc(K.t('卖出价 ','Exit price '))}${q.pvExit.toFixed(4)}${K.esc(K.t(' 元；持有期票息 ','; coupons '))}${q.couponCash.toFixed(4)}${K.esc(K.t(' 元。','.'))}</p>`;
    const d=q;
    if(view==='dist')return K.table([['样本统计量','Sample statistic'],['数值','Value']],[
      [K.t('均值','Mean'),d.mean.toFixed(6)],[K.t('标准差','Standard deviation'),d.sd.toFixed(6)],[K.t('偏度','Skewness'),d.skew.toFixed(4)],[K.t('超额峰度','Excess kurtosis'),d.kurt.toFixed(4)],
      [K.t('最小值','Minimum'),d.five.min.toFixed(4)],[K.t('中位数','Median'),d.five.median.toFixed(4)],[K.t('最大值','Maximum'),d.five.max.toFixed(4)],
      [K.t('年化算术','Annualised (arithmetic)'),K.pct(d.ann.arith)],[K.t('年化复合','Annualised (compounded)'),K.pct(d.ann.compound)],[K.t('年化波动率','Annualised volatility'),K.pct(d.ann.vol)]])+
      `<p class="chart-note">${K.esc(K.t('250 个观测、固定种子的合成样本；年化假设 252 个交易日。','250 observations from a fixed seed; annualisation assumes 252 trading days.'))}</p>`;
    return K.table([['检验','Test'],['结果','Result']],[
      [K.t('偏度','Skewness'),d.skew.toFixed(4)],[K.t('超额峰度','Excess kurtosis'),d.kurt.toFixed(4)],[K.t('JB 统计量','Jarque–Bera'),d.jb.jb.toFixed(2)],[K.t('JB p 值','JB p-value'),d.jb.p<1e-6?'< 1e-6':d.jb.p.toFixed(6)]])+
      `<p class="chart-note">${K.esc(K.t('右尾向上偏离来自合成样本中的跳跃；QQ 图不检验独立性。','The upward departure in the right tail comes from the jumps in the synthetic sample; the QQ plot does not test independence.'))}</p>`;
  },
  graphKind(view){return {stock:['股票 · 三种口径','Stock · three conventions'],bond:['债券 · 现金流现值','Bond · cash-flow present values'],dist:['分布 · 合成日收益','Distribution · synthetic daily returns'],qq:['QQ · 分布比较','QQ · distribution comparison']}[view];},
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  teacher:['四节对应大纲的"收益率定义、股票类资产收益率、债券类资产收益率、收益率分布及特征"。先让学生算一遍简单收益与总收益的差别，再拆解债券的净价/全价与久期，最后用直方图与 QQ 图讨论"为什么不能只用均值和标准差"。未开展学生试用，不宣称教学效果。',
    'The four sections follow the syllabus: return definitions, stock returns, bond returns and the distribution of returns. Start with simple versus total return, then take apart the clean/dirty bond price and duration, and finish with the histogram and QQ plot to discuss why mean and standard deviation are not enough. No student trial was run, so no teaching-effect claim is made.'],
  help:['页面本身不执行 R；每节生成可整段运行的基础 R 脚本。所有数值为固定假设或固定种子的合成数据，不是真实行情。右上角可切换中文/English。','The page does not run R; each section generates a standalone base-R script. All numbers are fixed assumptions or synthetic data from a fixed seed, not market quotes. The language switch keeps everything identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：总收益是否等于 (P1+股息)/P0−1；应计利息是否等于票息×已过比例；修正久期是否等于麦考利久期/(1+y/f)；偏度、峰度与 JB 是否与本页一致。','Create a new R Script and run the whole script. Check that total return equals (P1+dividend)/P0−1, accrued interest equals coupon × elapsed share, modified duration equals Macaulay/(1+y/f), and skewness, kurtosis and JB match this page.'],
  fileName:'experiment03-asset-returns.R'
};
function f2(v){return Number(v).toFixed(2);}
window.ReturnsWorkbench={mount:()=>LabRunner.mount(LAB)};
})();

;

/* Source: factor-math.js */
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

;

/* Source: factor-code.js */
/* Experiment10 · R script builder for the factor lab. The synthetic panel is
   embedded so every beta, IC and quantile in R matches the page. */
(function(root,factory){const api=factory(typeof module==='object'?require('./factor-math'):root.FactorMath);if(typeof module==='object')module.exports=api;else root.FactorCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
function mat(rows,per=12){
  const lines=rows.map(r=>'  c('+r.map(v=>num(Number(v.toFixed(10)))).join(', ')+')');
  return 'rbind(\n'+lines.join(',\n')+'\n)';
}
function build(p,view='ff3',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const P=M.panel(p),names=M.setOf(p.factors),L=M.FACTOR_LABEL;
  const common=[
    '# Experiment 10 | factor models and APT | base R only',
    T('# 合成面板：24 只资产 × 60 个月，真实载荷与真实 alpha 已在网页标注；非真实行情','# Synthetic panel: 24 assets x 60 months with documented loadings and alphas; not a market quote'),
    `F <- cbind(mkt = ${'c('+P.f.mkt.map(v=>num(Number(v.toFixed(10)))).join(', ')+')'},`,
    `  smb = c(${P.f.smb.map(v=>num(Number(v.toFixed(10)))).join(', ')}),`,
    `  hml = c(${P.f.hml.map(v=>num(Number(v.toFixed(10)))).join(', ')}))`,
    `R <- ${mat(P.r)}`,
    `asset <- ${p.asset}L`,
    `cols <- c(${names.map(n=>'"'+n+'"').join(', ')})`,
    'stopifnot(ncol(R) == nrow(F), all(is.finite(R)))'
  ];
  add('data',T('因子与资产收益面板','Factor and asset return panel'),common,
    T('矩阵 R 的每一行是一张资产的时间序列，列是月份；因子矩阵 F 的行是月份。因子是教学假设，不是可交易指数。','Each row of R is one asset time series and each column a month; rows of F are months. The factors are teaching assumptions, not tradable indices.'));
  if(view==='ff3'){
    add('regression',T('时间序列回归与 alpha','Time-series regression and alpha'),
      [T('# 每张资产对所选因子集做一次 OLS','# One OLS per asset on the chosen factor set'),
       'y <- R[asset, ]',
       'fit <- lm(y ~ F[, cols, drop = FALSE])',
       's <- summary(fit)',
       'print(round(s$coefficients, 6))',
       'cat("R-squared:", s$r.squared, "\\n")',
       T('# alpha 是截距；对单张资产做多次检验时，显著性会被数据挖掘放大','# Alpha is the intercept; testing many assets inflates significance through data mining'),
       'print(round(coef(fit), 6))'],
      T('alpha 是因子无法解释的平均超额收益；单张资产的 alpha 显著不等于存在套利机会。','Alpha is the average excess return the factors cannot explain; a significant alpha for one asset is not an arbitrage opportunity.'),
      String.raw`r_{i,t}-r_f=\alpha_i+\beta_i'\lambda_t+\varepsilon_{i,t}`);
  }
  if(view==='ff3'){
    add('plot',T('因子与残差图','Factors and residual plots'),
      [T('# 先看收益与因子走势，再看拟合值与残差','# Look at the return and factor paths, then at fitted values and residuals'),
       'plot(y, type = "l", xlab = "month", ylab = "asset return", main = "Asset return")',
       'matplot(F[, cols, drop = FALSE], type = "l", lty = 1, xlab = "month", ylab = "factor return")',
       'plot(fitted(fit), resid(fit), xlab = "fitted", ylab = "residual", main = "Residuals vs fitted")',
       'abline(h = 0, lty = 2)'],
      T('残差图用于检查非线性、异方差与异常点；它不检验因子是否"正确"。','Residual plots check non-linearity, heteroskedasticity and outliers; they do not test whether the factors are "correct".'));
  }
  if(view==='ai'){
    const cands=M.aiCandidates(p);
    add('cands',T('候选因子','Candidate factors'),
      [T('# 三个候选：价值多空、纯噪声、HML 复制；协议先看先验与冗余，再看价差','# Three candidates: value spread, pure noise, HML copy; the protocol checks prior and redundancy before spreads'),
       ...cands.map((c,i)=>`cand${i+1} <- c(${c.series.map(v=>num(Number(v.toFixed(10)))).join(', ')})`),
       'cands <- list(value = cand1, sentiment = cand2, hmlcopy = cand3)',
       'stopifnot(length(cand1) == ncol(R))'],
      T('候选因子序列与资产收益面板按月份对齐；候选的经济含义写在页面表格里。','Candidate series are aligned by month with the return panel; each candidate rationale is printed on the page.'));
    add('screen',T('五步协议筛选','Five-step screening protocol'),
      [T('# 按载荷分组算多空价差；协议要求先验、覆盖、低冗余、样本内外价差同号','# Sort by loading and compute the spread; the protocol requires a prior, coverage, low redundancy and the same sign in and out of sample'),
       'half <- floor(ncol(R)/2)',
       'screen <- function(cand) {',
       '  spread <- function(from, to) {',
       '    load <- apply(R[, from:to, drop = FALSE], 1, function(y) coef(lm(y ~ cand[from:to]))[2])',
       '    o <- order(load); k <- max(2, floor(nrow(R) / 3))',
       '    low <- o[seq_len(k)]; high <- o[(length(o) - k + 1):length(o)]',
       '    mean(rowMeans(R[high, from:to, drop = FALSE]) - rowMeans(R[low, from:to, drop = FALSE]))',
       '  }',
       '  c(corr_hml = cor(cand, F[, "hml"]), in_sample = spread(1, half), out_sample = spread(half + 1, ncol(R)))',
       '}',
       'print(t(vapply(cands, screen, numeric(3))))'],
      T('价差为正只说明"高载荷组合跑赢低载荷组合"，不等于可交易；冗余检查先淘汰与 HML 重复的候选。','A positive spread only says high-loading assets beat low-loading ones; it is not tradability. The redundancy check removes candidates that duplicate HML.'));
  }
  if(view==='apt'){
    add('apt',T('两步法横截面检验','Two-pass cross-sectional test'),
      [T('# 第一步：每张资产估计 beta；第二步：横截面回归平均超额收益','# Step 1 estimates betas, step 2 regresses mean excess returns on them'),
       'betas <- t(vapply(seq_len(nrow(R)), function(i) {',
       '  coef(lm(R[i, ] ~ F[, cols, drop = FALSE]))[-1]',
       '}, numeric(length(cols))))',
       'mean_ex <- rowMeans(R)',
       'cs <- lm(mean_ex ~ betas)',
       'print(summary(cs)$coefficients)',
       T('# 横截面 R² 很高也不证明 APT 成立：beta 本身由同一份数据估计','# A high cross-sectional R2 does not prove APT: the betas are estimated from the same data'),
       'cat("cross-sectional R-squared:", summary(cs)$r.squared, "\\n")'],
      T('横截面回归的斜率是对因子风险价格的估计；样本内两步法存在生成回归量问题，标准误需要修正。','The cross-sectional slopes estimate factor risk prices; the in-sample two-pass estimator has a generated-regressor problem and its standard errors need correction.'),
      String.raw`\bar r_i=\gamma_0+\gamma_1\hat\beta_{i,mkt}+\gamma_2\hat\beta_{i,smb}+\gamma_3\hat\beta_{i,hml}+u_i`);
  }
  if(view==='ic'){
    add('ic',T('因子 IC 与 Rank IC','Factor IC and rank IC'),
      [T('# 每个月做一次横截面相关：特征 vs 当月收益','# Each month: cross-sectional correlation between the characteristic and that month return'),
       `char <- c(${P.chars[p.char].map(v=>num(Number(v.toFixed(10)))).join(', ')})`,
       `split <- ${p.split}`,
       T('# 只用样本内月份，与页面一致','# Use the in-sample months only, matching the page'),
       't_use <- seq.int(2L, floor(ncol(R) * split) + 1L)',
       'ic <- vapply(t_use, function(t) cor(char, R[, t], method = "pearson"), numeric(1))',
       'rank_ic <- vapply(t_use, function(t) cor(char, R[, t], method = "spearman"), numeric(1))',
       'print(c(mean_ic = mean(ic), mean_rank_ic = mean(rank_ic),',
       '  ir = mean(rank_ic) / sd(rank_ic), hit = mean(rank_ic > 0)))',
       T('# IC 的 t 值用月度序列的均值和标准差计算，不假设独立同分布','# The IC t statistic uses the monthly mean and standard deviation; independence is not assumed'),
       'cat("t:", mean(rank_ic) / (sd(rank_ic) / sqrt(length(rank_ic))), "\\n")'],
      T('IC 衡量特征与下一期收益的横截面排序关系；它只是候选证据，样本外与换手成本才决定能否使用。','IC measures the cross-sectional rank relation between a characteristic and next-period returns; it is only candidate evidence, and out-of-sample behaviour and turnover costs decide usability.'),
      String.raw`IC_t=\operatorname{corr}\left(z_{i,t},r_{i,t+1}\right),\quad IR=\frac{\overline{IC}}{\sigma(IC)}`);
  }
  if(view==='sort'){
    add('sort',T('分组回测与多空组合','Sorted portfolios and the long-short spread'),
      [T('# 按特征排序后五等分，等权持有，逐月计算收益','# Sort by the characteristic, split into quintiles, equal weight and compute monthly returns'),
       `char <- c(${P.chars[p.char].map(v=>num(Number(v.toFixed(10)))).join(', ')})`,
       T('# 与页面一致：排序后按 5,5,5,5,4 的分组大小切分','# Same as the page: sort then cut into groups of 5,5,5,5,4'),
       'ord <- order(char)',
       'grp <- integer(length(char)); grp[ord] <- rep(1:5, each = ceiling(length(char) / 5))[seq_along(char)]',
       'q <- grp',
       'means <- t(vapply(seq_len(5), function(g) colMeans(R[q == g, , drop = FALSE]), numeric(ncol(R))))',
       'print(round(rowMeans(means), 6))',
       'ls <- means[5, ] - means[1, ]',
       'print(c(long_short_mean = mean(ls), t = mean(ls) / (sd(ls) / sqrt(length(ls)))))',
       T('# 多空组合的收益是排序价差，不是可实现的套利收益','# The long-short return is a sorted spread, not a realisable arbitrage return'),
       'print(head(t(apply(means, 1, function(x) cumprod(1 + x))), 3))'],
      T('分组回测检验特征是否单调地对应收益；2–3 只资产一组时噪声很大，且未计交易成本。','The sorted backtest checks whether the characteristic maps monotonically into returns; with 2-3 assets per group the noise is large and trading costs are ignored.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 10 | factor models and APT\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});

;

/* Source: factor-workbench.js */
/* Experiment10 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=FactorMath,C=FactorCode;
const LAB={
  id:'factor',cls:'factor-lab',global:'FactorLab',
  views:M.views,
  defaults:()=>({...M.defaults}),
  check:p=>M.check(p),
  params(p,view,K){
    let h=K.field({id:'asset',zh:'所选资产序号',en:'Asset index',value:p.asset,min:1,max:p.assets,step:1})+
      K.select({id:'factors',zh:'因子集',en:'Factor set',value:p.factors,options:[['capm','CAPM（仅市场）','CAPM (market only)'],['ff3','FF3 三因子','FF3 three-factor'],['all','FF3 + 扩展','FF3 + extension']]});
    if(view!=='ff3'&&view!=='ai')h+=K.select({id:'char',zh:'特征',en:'Characteristic',value:p.char,options:M.CHARS});
    if(view!=='apt'&&view!=='ai')h+=K.select({id:'char2',zh:'（同上）特征排序依据',en:'(same) sorting characteristic',value:p.char,options:M.CHARS});
    h+=K.field({id:'months',zh:'月份数',en:'Months',value:p.months,min:24,max:120,step:12})+
      K.field({id:'assets',zh:'资产数',en:'Assets',value:p.assets,min:8,max:40,step:4})+
      K.field({id:'seed',zh:'面板随机种子',en:'Panel seed',value:p.seed,min:1,max:99999999,step:1});
    return h;
  },
  question(view){return {
    ff3:['因子回归之后，alpha 还剩多少？','How much alpha is left after the factor regression?'],
    apt:['beta 能否解释横截面上的平均收益差异？','Can betas explain the cross-section of average returns?'],
    ic:['一个特征与下月收益的排序关系，稳定吗？','Is the rank relation between a characteristic and next-month returns stable?'],
    sort:['按特征分五组，收益是否单调递增？','Does sorting into quintiles produce a monotone return pattern?'],
    ai:['AI 挖出来的三个候选，哪一个应当进下一轮？','Which of the three mined candidates deserves the next round?']
  }[view];},
  summary(view){return {
    ff3:[['因子载荷','Loadings'],['alpha 与 t','Alpha and t'],['R²','R²']],
    apt:[['两步法','Two-pass'],['风险价格','Risk prices'],['生成回归量','Generated regressor']],
    ic:[['月度 IC','Monthly IC'],['Rank IC','Rank IC'],['IR','IR']],
    sort:[['五等分','Quintiles'],['多空价差','Long-short spread'],['未计成本','No costs']],
    ai:[['先验先行','Prior first'],['冗余淘汰','Redundancy kills'],['样本外同号','Same sign out of sample']]
  }[view];},
  assumptions(view){return {
    ff3:['合成面板的载荷与 alpha 由固定种子生成，并在页面标注真值。因子是教学构造，不是可交易指数。单张资产的 alpha 显著性不构成套利证据。','Synthetic loadings and alphas come from a fixed seed and their true values are printed. The factors are teaching constructs, not tradable indices. A significant single-asset alpha is not arbitrage evidence.'],
    apt:['两步法先估计 beta 再估计风险价格，第二步的回归量本身是估计值，标准误需要修正；横截面 R² 高不等于 APT 成立。','The two-pass estimator first estimates betas and then risk prices, so the second-stage regressors are estimates and the standard errors need correction; a high cross-sectional R² does not establish APT.'],
    ic:['IC 是每月的横截面相关，按月度序列计算均值与 IR。特征是有噪声的代理变量，12–24 只资产的分组估计不稳定；IC 显著不代表可交易。','IC is the monthly cross-sectional correlation; the mean and IR use the monthly series. Characteristics are noisy proxies and groups of 12-24 assets are unstable; a significant IC is not a tradable signal.'],
    sort:['五等分按特征排序、等权持有、逐月再平衡，未计交易成本、冲击成本与卖空约束。多空价差是排序价差，不是可实现收益。','Quintiles sort by the characteristic, hold equal weights and rebalance monthly, ignoring trading costs, impact and short-sale constraints. The long-short spread is a sorted spread, not a realisable return.'],
    ai:['三个候选由固定规则生成并标注经济含义：价值多空（有先验）、纯噪声（无先验）、HML 复制（冗余）。五步协议按顺序淘汰：无先验出局、|corr(HML)|≥0.8 出局、样本内价差不为正出局、样本外价差转负出局。全部通过才进入下一轮，且"进入下一轮"不等于可用于实盘。','The three candidates are generated by fixed rules with stated rationales: value spread (prior), pure noise (no prior), HML copy (redundant). The five-step protocol eliminates in order: no prior, |corr(HML)| ≥ 0.8, non-positive in-sample spread, and a sign flip out of sample. Only survivors advance, and advancing is not a licence for live trading.']
  }[view];},
  compute(p,view){
    if(view==='ff3')return M.ff3(p);
    if(view==='apt')return M.apt(p);
    if(view==='ic')return M.ic(p);
    if(view==='ai')return M.ai(p);
    return M.sort(p);
  },
  chartTitle(q,p,view){return {
    ai:['候选的样本内外价差','In- and out-of-sample spreads of the candidates'],
    ff3:['载荷估计与真值','Estimated loadings against the true values'],
    apt:['横截面：平均收益 vs 拟合值','Cross-section: mean return against fitted value'],
    ic:['月度 Rank IC 与累计值','Monthly rank IC and its cumulative sum'],
    sort:['五等分累计净值','Cumulative net asset value of the quintiles']
  }[view];},
  metrics(q,p,view,K){
    if(view==='ff3')return K.metrics([['alpha（月度）','Alpha (monthly)',K.pct(q.fit.alpha,3)],['alpha t 值','Alpha t-stat',q.fit.alphaT.toFixed(2)],['R²','R²',K.pct(q.fit.r2,1)]]);
    if(view==='ai')return K.metrics([['通过','Accepted',String(q.accepted)],['淘汰','Rejected',String(q.rejected)],['候选数','Candidates',String(q.candidates)]]);
    if(view==='apt')return K.metrics([['市场风险价格','Market price of risk',q.lambda[0].toFixed(4)],['横截面 R²','Cross-sectional R²',K.pct(q.r2,1)],['资产数','Assets',String(q.N)]]);
    if(view==='ic')return K.metrics([['平均 Rank IC','Mean rank IC',q.meanRank.toFixed(3)],['IC IR','IC IR',q.ir.toFixed(2)],['命中率','Hit rate',K.pct(q.hit,0)]]);
    return K.metrics([['多空月均收益','Long-short monthly',K.pct(q.lsMean,3)],['t 值','t-stat',q.lsT.toFixed(2)],['Q5−Q1','Q5−Q1',K.pct(q.spread,3)]]);
  },
  legend(q,p,view,K){
    if(view==='ff3')return K.legend([['估计载荷','Estimated','#6689a8',false],['真实载荷','True','#659b8a',false]]);
    if(view==='apt')return K.legend([['资产','Asset','#6689a8',false],['拟合线','Fitted','#9b88ac',true]]);
    if(view==='ai')return K.legend([['样本内价差','In-sample','#6689a8',false],['样本外价差','Out-of-sample','#9b88ac',false],['通过线','Pass line','#659b8a',true]]);
    if(view==='ic')return K.legend([['月度 IC','Monthly IC','#6689a8',false],['累计 IC','Cumulative','#9b88ac',false]]);
    return K.legend([['Q1 最低','Q1 low','#b5bfcc',false],['Q3','Q3','#9b88ac',false],['Q5 最高','Q5 high','#659b8a',false],['多空','Long-short','#6689a8',false]]);
  },
  chart(q,p,view,{svgHost,K}){
    if(view==='ff3'){
      const names=q.names.map(n=>K.t(...M.FACTOR_LABEL[n]));
      return K.chart(svgHost(),{yZero:true,xLabel:['因子','Factor'],yLabel:['载荷','Loading'],xTickFormat:v=>names[Math.round(v)-1],
        series:[{type:'bar',points:q.fit.betas.map((b,i)=>[i+1,b]),color:'#6689a8',gap:.5,tip:d=>[`${names[Math.round(d[0])-1]}：估计 ${d[1].toFixed(3)}；真实 ${q.true.betas[Math.round(d[0])-1].toFixed(3)}`,`${names[Math.round(d[0])-1]}: estimated ${d[1].toFixed(3)}, true ${q.true.betas[Math.round(d[0])-1].toFixed(3)}`]},
          {type:'scatter',points:q.true.betas.map((b,i)=>[i+1,b]),color:'#659b8a',radius:6}],
        aria:['载荷估计','Loading estimates']});
    }
    if(view==='apt'){
      return K.chart(svgHost(),{xLabel:['平均收益','Mean return'],yLabel:['拟合平均收益','Fitted mean return'],
        series:[{type:'scatter',points:q.scatter.map(s=>[s.meanEx,s.fitted]),color:'#6689a8',radius:4,tip:d=>[`实际 ${K.pct(d[0],3)}；拟合 ${K.pct(d[1],3)}`,'Actual '+K.pct(d[0],3)+'; fitted '+K.pct(d[1],3)]},
          {type:'line',points:[[Math.min(...q.meanEx),Math.min(...q.meanEx)],[Math.max(...q.meanEx),Math.max(...q.meanEx)]],color:'#9b88ac',dash:true}],
        aria:['横截面拟合','Cross-sectional fit']});
    }
    if(view==='ai'){
      const rows=q.rows;
      return K.chart(svgHost(),{yZero:true,xLabel:['候选','Candidate'],yLabel:['价差（%/月）','Spread (% per month)'],
        xTickFormat:v=>['C1','C2','C3'][Math.round(v)-1],
        series:[{type:'bar',points:rows.map((r,i)=>[i+1,r.isSpread*100]),color:'#6689a8',gap:.5,tip:d=>[`${rows[Math.round(d[0])-1].zhLabel}：样本内 ${d[1].toFixed(3)}%/月`,`${rows[Math.round(d[0])-1].enLabel}: in-sample ${d[1].toFixed(3)}%/month`]},
          {type:'scatter',points:rows.map((r,i)=>[i+1,r.oosSpread*100]),color:'#9b88ac',radius:5}],
        refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],
        aria:['候选价差','Candidate spreads']});
    }
    if(view==='ic'){
      return K.chart(svgHost(),{yZero:true,xLabel:['月份','Month'],yLabel:['IC','IC'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'bar',points:q.months.map((m,i)=>[i+1,m.rank]),color:'#6689a8',gap:.5,tip:d=>[`第 ${q.months[Math.round(d[0])-1].t+1} 个月 Rank IC ${d[1].toFixed(3)}`,'Month '+(q.months[Math.round(d[0])-1].t+1)+' rank IC '+d[1].toFixed(3)]},
          {type:'line',points:q.cumulative.map((v,i)=>[i+1,v/10]),color:'#9b88ac'}],
        refs:[{axis:'y',value:0,color:'#b9c7cf',dash:false}],aria:['月度IC','Monthly IC']});
    }
    const s=q.groups;
    return K.chart(svgHost(),{yZero:false,xLabel:['月份','Month'],yLabel:['累计净值','Cumulative NAV'],
      series:[{type:'line',points:s[0].nav.map((v,i)=>[i+1,v]),color:'#b5bfcc'},{type:'line',points:s[2].nav.map((v,i)=>[i+1,v]),color:'#9b88ac'},
        {type:'line',points:s[4].nav.map((v,i)=>[i+1,v]),color:'#659b8a',tip:d=>[`第 ${Math.round(d[0])} 月 Q5 净值 ${d[1].toFixed(3)}`,'Month '+Math.round(d[0])+': Q5 NAV '+d[1].toFixed(3)]},
        {type:'line',points:q.lsNav.map((v,i)=>[i+1,v]),color:'#6689a8',dash:true}],
      aria:['五等分净值','Quintile NAV']});
  },
  details(q,p,view,K){
    if(view==='ff3')return K.table([['参数','Parameter'],['估计','Estimate'],['t 值','t-stat'],['真值','True value']],
      [['alpha',K.pct(q.fit.alpha,3),q.fit.alphaT.toFixed(2),K.pct(q.true.alpha,3)],...q.names.map((n,i)=>[K.t(...M.FACTOR_LABEL[n]),q.fit.betas[i].toFixed(3),q.fit.betaT[i].toFixed(2),q.true.betas[i].toFixed(3)])])+
      `<p class="chart-note">${K.esc(K.t('R² 随因子集增加而上升，但 alpha 的 t 值才是"是否被解释"的关键；单资产检验不控制多重比较。','R² rises with more factors, but the alpha t-stat decides whether it is explained; single-asset tests ignore multiple comparisons.'))}</p>`;
    if(view==='ai'){
      const rows=q.rows;
      const cells=rows.map(r=>[
        `${K.t(r.zhLabel,r.enLabel)}`,
        r.checks.map(c=>`${c.pass?'✓':'✗'} ${K.t(c.zh,c.en)}`).join('<br>'),
        r.verdict?K.t('进入下一轮','Advance'):K.t('淘汰','Reject')]);
      return K.table([['候选','Candidate'],['五项检查','Five checks'],['结论','Verdict']],cells)+
        `<p class="chart-note">${K.esc(K.t('✓/✗ 依次为：经济先验、覆盖率、冗余、样本内价差、样本外价差。通过全部五项才进入下一轮，且不代表可用于实盘。','The ✓/✗ marks are, in order: economic prior, coverage, redundancy, in-sample spread, out-of-sample spread. Passing all five only advances the candidate; it does not license live trading.'))}</p>`;
    }
    if(view==='apt')return K.table([['风险价格','Risk price'],['估计','Estimate'],['t 值','t-stat'],['真实溢价','True premium']],
      q.names.map((n,i)=>[K.t(...M.FACTOR_LABEL[n]),q.lambda[i].toFixed(4),q.lambdaT[i].toFixed(2),q.premia[i].toFixed(4)]))+
      `<p class="chart-note">${K.esc(K.t('截距 ','Intercept '))}${q.intercept.toFixed(4)}${K.esc(K.t('；两步法的标准误未修正生成回归量问题。',' ; the two-pass standard errors do not correct for generated regressors.'))}</p>`;
    if(view==='ic')return K.table([['统计量','Statistic'],['数值','Value']],[
      [K.t('平均 IC（Pearson）','Mean IC (Pearson)'),q.meanPearson.toFixed(4)],[K.t('平均 Rank IC','Mean rank IC'),q.meanRank.toFixed(4)],
      [K.t('IC IR','IC IR'),q.ir.toFixed(3)],[K.t('t 值（月度）','t-stat (monthly)'),q.tStat.toFixed(2)],[K.t('命中率','Hit rate'),K.pct(q.hit,0)]])+
      `<p class="chart-note">${K.esc(K.t('图中紫色为累计 IC ÷ 10，便于与月度柱同轴显示。','The purple line is cumulative IC divided by 10 so it can share the axis.'))}</p>`;
    return K.table([['分组','Quintile'],['资产数','Assets'],['月均收益','Mean monthly'],['波动率','Volatility']],
      q.groups.map((g,i)=>['Q'+(i+1),String(g.n),K.pct(g.mean,3),K.pct(g.sd,2)]))+
      `<p class="chart-note">${K.esc(K.t('多空组合=Q5−Q1，未计交易成本；t 值基于月度价差序列。','Long-short = Q5 − Q1 with no trading costs; the t-stat uses the monthly spread series.'))}</p>`;
  },
  graphKind(view){return {ai:['AI 因子筛选','AI factor screen'],ff3:['因子回归','Factor regression'],apt:['横截面 APT','Cross-sectional APT'],ic:['IC 分析','IC analysis'],sort:['分组回测','Sorted portfolios']}[view];},
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  teacher:['四节对应大纲的"Fama-French 三因子、APT 有效性检验、因子研究"，并补上表 2 要求的因子 IC 与多因子理解。建议顺序：单资产回归看 alpha → 横截面看风险价格 → IC 与分组回测看特征证据。务必让学生区分"样本内显著"与"可交易"。',
    'The four sections cover Fama-French three factors, APT validity tests and factor research, adding the factor-IC and multi-factor understanding required by Table 2. Recommended order: single-asset regression for alpha, then the cross-section for risk prices, then IC and sorted portfolios as characteristic evidence. Students must separate in-sample significance from tradability.'],
  help:['页面不执行 R；每节生成可整段运行的基础 R 脚本，并内嵌同一份合成面板。数值全部来自固定种子，不是真实行情。右上角可切换中文/English。','The page does not run R; each section generates a standalone base-R script with the same synthetic panel embedded. Every number comes from a fixed seed and is not a market quote. The language switch keeps everything identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：所选资产的载荷与 alpha t 值、横截面风险价格、平均 Rank IC 与 IR、五等分月均收益与多空 t 值。再换一个特征，观察结果是否比换种子更不稳定。','Create a new R Script and run it. Check the loadings and alpha t-stat of the chosen asset, the cross-sectional risk prices, the mean rank IC and IR, and the quintile means and long-short t-stat. Then change the characteristic and see whether the result is less stable than changing the seed.'],
  fileName:'experiment10-factor-apt.R'
};
window.FactorWorkbench={mount:()=>LabRunner.mount(LAB)};
})();

;

/* Source: fund-math.js */
/* Experiment12 · fund performance: single-factor metrics, market timing,
   Treynor-Black and factor attribution on one deterministic synthetic fund. */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.FundMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({months:60,alpha:.0035,beta:1.05,timing:.45,mktPremium:.006,mktVol:.045,idio:.025,rf:.002,seed:20261114,aversion:2.5});
const views=[['metrics','单因素绩效','Single-factor metrics'],['timing','选股与择时','Selection and timing'],['tb','Treynor-Black','Treynor-Black'],['attr','收益归因','Attribution'],['ai','AI 归因审查','AI attribution review']];
function check(p){
  if(!Number.isInteger(p.months)||p.months<36||p.months>240)throw Error('月份数须为 36–240 的整数。');
  if(!(p.beta>0&&p.beta<3))throw Error('Beta 须在 0 与 3 之间。');
  if(!(p.idio>0))throw Error('特质波动率必须为正。');
  if(!(p.rf>-.01&&p.rf<.02))throw Error('无风险月利率须在 −1% 与 2% 之间。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
let cache=new Map();
function sample(p){
  check(p);
  const key=[p.months,p.alpha,p.beta,p.timing,p.idio,p.rf,p.seed].join('|');
  if(cache.has(key))return cache.get(key);
  const rng=S.prng(p.seed),mkt=[],fund=[],rf=[];
  for(let t=0;t<p.months;t++){
    const m=p.mktPremium+p.mktVol*rng.normal();
    const x=m-p.rf,up=Math.max(0,x);
    mkt.push(m);rf.push(p.rf);
    fund.push(p.rf+p.alpha+p.beta*x+p.timing*up+p.idio*rng.normal());
  }
  const out={mkt,fund,rf,T:p.months};
  cache.set(key,out);if(cache.size>6)cache.clear();
  return out;
}
const daily={} ;
function metrics(p){
  const d=sample(p),x=d.mkt.map((m,i)=>m-d.rf[i]),y=d.fund.map((f,i)=>f-d.rf[i]);
  const fit=S.ols(y,[x],{names:['mkt']});
  const alpha=fit.beta[0],beta=fit.beta[1],alphaT=fit.t[0],betaT=fit.t[1];
  const meanFund=S.mean(d.fund),sdFund=S.sd(d.fund),meanMkt=S.mean(d.mkt),sdMkt=S.sd(d.mkt);
  const mdd=S.maxDrawdown(d.fund);
  const down=d.fund.filter(v=>v<0),downSd=down.length>1?S.sd(down):NaN;
  const annual=v=>(1+v)**12-1;
  return{d,alpha,beta,alphaT,betaT,trackError:S.sd(fit.resid),r2:fit.r2,
    fund:{mean:meanFund,sd:sdFund,ann:annual(meanFund),vol:sdFund*Math.sqrt(12),sharpe:(meanFund-p.rf)/(sdFund||1)*Math.sqrt(12)},
    bench:{mean:meanMkt,sd:sdMkt,ann:annual(meanMkt),vol:sdMkt*Math.sqrt(12),sharpe:(meanMkt-p.rf)/(sdMkt||1)*Math.sqrt(12)},
    excess:S.mean(d.fund)-S.mean(d.mkt),treynor:(meanFund-p.rf)/beta,ir:(meanFund-meanMkt)/(S.sd(fit.resid)||1),
    mdd:mdd.mdd,calmar:(mdd.mdd!==0?annual(meanFund)/(-mdd.mdd):NaN),sortino:downSd>0?(meanFund-p.rf)/downSd*Math.sqrt(12):NaN,
    nav:S.growth(d.fund).map((v,i)=>v),navBench:S.growth(d.mkt),dd:drawdownPath(d.fund),monthly:d.fund};
}
function drawdownPath(r){
  let nav=1,peak=1;return r.map(v=>{nav*=1+v;peak=Math.max(peak,nav);return nav/peak-1;});
}
function timing(p){
  const d=sample(p),x=d.mkt.map((m,i)=>m-d.rf[i]),y=d.fund.map((f,i)=>f-d.rf[i]);
  const tm=S.ols(y,[x,x.map(v=>v*v)],{names:['x','x2']});
  const hm=S.ols(y,[x,x.map(v=>Math.max(0,v))],{names:['x','xpos']});
  const capm=S.ols(y,[x],{names:['mkt']});
  const down=x.filter(v=>v<0),up=x.filter(v=>v>=0);
  const fundDown=d.fund.filter((_,i)=>x[i]<0),fundUp=d.fund.filter((_,i)=>x[i]>=0);
  /* HM: a positive coefficient on max(0, x) means beta rises in up markets. */
  return{tm:{alpha:tm.beta[0],alphaT:tm.t[0],beta:tm.beta[1],gamma:tm.beta[2],gammaT:tm.t[2],r2:tm.r2},
    hm:{alpha:hm.beta[0],alphaT:hm.t[0],beta:hm.beta[1],gamma:hm.beta[2],gammaT:hm.t[2],r2:hm.r2},
    capm:{alpha:capm.beta[0],beta:capm.beta[1],r2:capm.r2},
    up:{n:up.length,mean:S.mean(up),fund:S.mean(fundUp)},down:{n:down.length,mean:S.mean(down),fund:S.mean(fundDown)},
    true:{alpha:p.alpha,timing:p.timing,beta:p.beta},
    scatter:x.map((v,i)=>({x:v,y:y[i]})),T:p.months};
}
function treynorBlack(p){
  const m=metrics(p),d=m.d;
  /* Active portfolio: the fund's alpha with its idiosyncratic risk. */
  const sigmaE=m.trackError,alpha=m.alpha;
  const appraisal=alpha/sigmaE;
  const sigmaA2=(m.beta**2)*(m.bench.sd**2)+sigmaE**2;
  const wActive=(alpha/sigmaA2)/(S.mean(ex)/S.sd(ex)**2);
  const wStar=wActive/(1+wActive);
  const mk=d.mkt,ex=mk.map(v=>v-p.rf);
  const combo=d.fund.map((f,i)=>wStar*f+(1-wStar)*mk[i]);
  const comboEx=combo.map((v,i)=>v-d.rf[i]);
  const sharpe=v=>S.mean(v)/S.sd(v)*Math.sqrt(12);
  const betaCombo=wStar*m.beta+(1-wStar);
  return{appraisal,wActive,wStar,betaCombo,
    sharpeMarket:sharpe(ex),sharpeCombo:sharpe(comboEx),sharpeFund:m.fund.sharpe,
    activeWeightPct:wStar,aversion:p.aversion,
    riskAverseWeight:(S.mean(ex)/p.aversion)/S.sd(ex)**2,
    alpha,sigmaE,comboNav:S.growth(combo),marketNav:S.growth(mk)};
}
function attribution(p){
  const m=metrics(p),d=m.d,months=12;
  const x=d.mkt.map((v,i)=>v-d.rf[i]),meanEx=S.mean(x);
  const total=S.mean(d.fund)-S.mean(d.rf);
  const factorPart=m.beta*meanEx,alphaPart=m.alpha,residual=total-factorPart-alphaPart;
  return{total:total*months,factor:factorPart*months,alpha:alphaPart*months,residual:residual*months,
    beta:m.beta,alphaMonthly:m.alpha,alphaT:m.alphaT,avgExcess:meanEx,
    parts:[[ '市场暴露','Market exposure',factorPart*months],['选择能力','Selection (alpha)',alphaPart*months],['残差','Residual',residual*months]]};
}
function aiReview(p){
  check(p);
  const m=metrics(p),t=timing(p),a=attribution(p);
  const claims=[
    {key:'sharpe',zh:'“基金夏普高于基准，说明经理具备择时能力。”',en:'"The fund Sharpe is above the benchmark, so the manager has timing skill."',
     verdict:['错误推断','Invalid inference'],
     why:['夏普只比较风险调整后的收益，不识别收益来自选股、择时还是杠杆。择时要看 TM/HM 的二次项或上行项系数。',
          'Sharpe compares risk-adjusted returns only; it cannot tell selection, timing or leverage apart. Timing needs the quadratic or up-market coefficient in TM/HM.'],
     evidence:['选股与择时','Selection and timing'],
     numbers:[`夏普 ${m.fund.sharpe.toFixed(2)} vs 基准 ${m.bench.sharpe.toFixed(2)}；HM 择时系数 ${t.hm.gamma.toFixed(2)}（t=${t.hm.gammaT.toFixed(2)}）`,`Sharpe ${m.fund.sharpe.toFixed(2)} vs benchmark ${m.bench.sharpe.toFixed(2)}; HM timing ${t.hm.gamma.toFixed(2)} (t=${t.hm.gammaT.toFixed(2)})`]},
    {key:'alpha',zh:'“月度 α 为正且显著，可线性外推为未来年化收益。”',en:'"A positive, significant monthly alpha can be extrapolated to an annual return."',
     verdict:['过度外推','Over-extrapolation'],
     why:['α 是样本内的回归截距，含估计误差，且在线性 CAPM 下会把择时收益误记为选股能力。区间估计与样本外检验才决定能否外推。',
          'Alpha is an in-sample intercept with estimation error, and a linear CAPM misattributes timing payoff to selection. Only an interval and an out-of-sample check justify extrapolation.'],
     evidence:['单因素绩效','Single-factor metrics'],
     numbers:[`α=${(m.alpha*100).toFixed(3)}%/月，t=${m.alphaT.toFixed(2)}，复合年化≈${(((1+m.alpha)**12-1)*100).toFixed(2)}%（未扣费用）`,`α=${(m.alpha*100).toFixed(3)}%/month, t=${m.alphaT.toFixed(2)}, CAGR≈${(((1+m.alpha)**12-1)*100).toFixed(2)}% (before fees)`]},
    {key:'attr',zh:'“归因显示选择能力贡献为正，全部归功于经理。”',en:'"Attribution shows a positive selection contribution, all thanks to the manager."',
     verdict:['把恒等式当因果','Identity read as causation'],
     why:['收益归因是会计恒等式，三部分相加必然等于总额；残差为零不证明模型完整。市场暴露部分依赖 β 估计，择时收益仍混在 α 里。',
          'Return attribution is an accounting identity: the three parts must add to the total, and a zero residual does not prove the model is complete. The market part depends on an estimated beta, and timing payoff is still inside alpha.'],
     evidence:['收益归因','Attribution'],
     numbers:[`市场 ${(a.factor*100).toFixed(2)}%、选择 ${(a.parts[1][2]*100).toFixed(2)}%、残差 ${(a.parts[2][2]*100).toFixed(2)}%（年化）`,`market ${(a.factor*100).toFixed(2)}%, selection ${(a.parts[1][2]*100).toFixed(2)}%, residual ${(a.parts[2][2]*100).toFixed(2)}% (annualised)`]}
  ];
  const checklist=[
    {zh:'先问"这个指标能识别什么"，再问"数值大不大"',en:'Ask what the metric identifies before asking whether it is large',pass:true},
    {zh:'α 与择时系数要一起看，不能只报其中一个',en:'Read alpha together with the timing coefficient, never one alone',pass:true},
    {zh:'样本内显著不等于样本外可用',en:'In-sample significance is not out-of-sample usability',pass:true},
    {zh:'归因三项相加是恒等式，不是因果分解',en:'Attribution adds up by identity, not by causation',pass:true},
    {zh:'任何 AI 摘要都要能指回具体表格与假设',en:'Every AI summary must point back to a concrete table and assumption',pass:true}
  ];
  return{m,t,a,claims,checklist,checked:claims.length,corrected:claims.filter(c=>c.verdict[0]!=='通过').length};
}
return{defaults,views,check,sample,metrics,timing,treynorBlack,attribution,aiReview,drawdownPath};
});

;

/* Source: fund-code.js */
/* Experiment12 · R script builder: metrics, timing regressions, Treynor-Black
   and return-based attribution on the embedded synthetic fund series. */
(function(root,factory){const api=factory(typeof module==='object'?require('./fund-math'):root.FundMath);if(typeof module==='object')module.exports=api;else root.FundCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
const vec=a=>'c('+a.map(v=>num(Number(v.toFixed(10)))).join(', ')+')';
function build(p,view='metrics',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const d=M.sample(p);
  add('data',T('基金、基准与无风险利率','Fund, benchmark and risk-free rate'),
    ['# Experiment 12 | fund performance | base R only',
     T('# 合成月度序列：真实 alpha、beta 与择时能力已固定；非真实基金或指数','# Synthetic monthly series with documented alpha, beta and timing ability; not a real fund or index'),
     `fund <- ${vec(d.fund)}`, `mkt <- ${vec(d.mkt)}`, `rf <- ${vec(d.rf)}`,
     'x <- mkt - rf', 'y <- fund - rf',
     T('# 统一的年化与 CAPM 估计，后面每个口径都复用','# Shared annualisation and CAPM estimate, reused everywhere below'),
     'ann <- function(v) (1 + mean(v))^12 - 1',
     'fit <- lm(y ~ x)',
     'alpha <- unname(coef(fit)[1]); beta <- unname(coef(fit)[2])',
     'sharpe <- mean(y) / sd(y) * sqrt(12)',
     'stopifnot(length(fund) == length(mkt), all(is.finite(y)))'],
    T('所有指标都基于同一段月度超额收益；超额收益是相对无风险利率，不是相对基准。','Every metric uses the same monthly excess returns; excess means over the risk-free rate, not over the benchmark.'));
  if(view==='metrics'){
    add('metrics',T('单因素整体绩效','Single-factor performance'),
      [T('# 年化用复合，波动率乘 √12；Sharpe 与 Treynor 的分子相同、分母不同','# Annualise by compounding, scale volatility by sqrt(12); Sharpe and Treynor share a numerator but not a denominator'),
       'vol <- sd(fund) * sqrt(12)',
       'treynor <- mean(y) / beta',
       'tracking <- sd(resid(fit))',
       'ir <- mean(fund - mkt) / tracking',
       'dd <- cumprod(1 + fund); mdd <- min(dd / cummax(dd) - 1)',
       'print(c(ann = ann(fund), vol = vol, sharpe = sharpe, treynor = treynor,',
       '  alpha = alpha, ir = ir, mdd = mdd, calmar = ann(fund) / -mdd))'],
      T('Sharpe 用总风险，Treynor 用系统性风险，Jensen alpha 是回归截距；三者不能被单独引用为"业绩好"。','Sharpe uses total risk, Treynor systematic risk and Jensen alpha is the regression intercept; none alone proves good performance.'),
      String.raw`S=\frac{\bar r_p-r_f}{\sigma_p},\quad T=\frac{\bar r_p-r_f}{\beta_p},\quad \alpha_p=\bar r_p-r_f-\beta_p(\bar r_m-r_f)`);
  }
  if(view==='timing'){
    add('timing',T('选股与择时','Selection and market timing'),
      [T('# 择时模型在 CAPM 上加入"上涨期 beta 更高"的项','# The timing model adds a higher beta in up markets'),
       'tm <- lm(y ~ x + I(x^2))',
       'hm <- lm(y ~ x + I(pmax(x, 0)))',
       'print(summary(tm)$coefficients)',
       'print(summary(hm)$coefficients)',
       T('# 截距是选股能力，二次项/上行项系数是择时能力','# The intercept is selection and the quadratic or up-market term is timing'),
       'cat("HM timing coefficient:", coef(hm)[3], "\\n")'],
      T('Treynor–Mazuy 与 Henriksson–Merton 都在检验"beta 是否随市场状态变化"；截距与择时项高度相关，样本短时难以分离。','Treynor–Mazuy and Henriksson–Merton both test whether beta changes with the market state; the intercept and the timing term are correlated and hard to separate in short samples.'),
      String.raw`r_p-r_f=a+b(r_m-r_f)+c(r_m-r_f)^2+e`);
  }
  if(view==='tb'){
    add('tb',T('Treynor-Black 主动组合','The Treynor-Black active portfolio'),
      [T('# 主动组合权重 = (alpha/active variance) / (market price of risk)','# Active weight = (alpha / active variance) / market price of risk'),
       'sigma_e <- sd(resid(fit))',
       'sigma_a2 <- beta^2 * var(x) + sigma_e^2',
       'w_active <- (alpha / sigma_a2) / (mean(x) / var(x))',
       'w_star <- w_active / (1 + w_active)',
       'combo <- w_star * fund + (1 - w_star) * mkt',
       'print(c(w_active = w_active, w_star = w_star, sharpe_fund = sharpe,',
       '  sharpe_combo = mean(combo - rf) / sd(combo - rf) * sqrt(12)))'],
      T('Treynor-Black 用 alpha 与特质风险构造主动组合，再与市场组合混合；它依赖 alpha 估计的稳定性。','Treynor-Black builds an active portfolio from alpha and idiosyncratic risk, then blends it with the market portfolio; it depends on the stability of the alpha estimate.'),
      String.raw`w_A=\frac{\alpha_A/\sigma_A^2}{E(R_M)/\sigma_M^2},\quad w^*=\frac{w_A}{1+w_A}`);
  }
  if(view==='attr'){
    add('attr',T('收益归因','Return attribution'),
      [T('# 超额收益分解为市场暴露、选择能力与残差三部分','# Excess return splits into market exposure, selection and residual'),
       'total <- mean(y) * 12',
       'factor_part <- beta * mean(x) * 12',
       'alpha_part <- alpha * 12',
       'residual <- total - factor_part - alpha_part',
       'print(c(total = total, market = factor_part, selection = alpha_part, residual = residual))',
       T('# 三部分相加必须等于总额；不相等说明计算或口径有误','# The three parts must add to the total; otherwise the calculation or the convention is wrong'),
       'stopifnot(abs(total - (factor_part + alpha_part + residual)) < 1e-9)'],
      T('归因把"赚了多少"拆成"市场给的"和"经理创造的"；残差为零是恒等式，不代表模型完整。','Attribution splits the return into what the market paid and what the manager added; a zero residual is an identity, not evidence of a complete model.'),
      String.raw`\bar r_p-\bar r_f=\beta_p(\bar r_m-\bar r_f)+\alpha_p+\bar e_p`);
  }
  if(view==='ai'){
    add('review',T('AI 摘要里要核对的三句话','Three sentences in the AI summary that need checking'),
      [T('# 把 AI 摘要拆成可检验的断言，每条都指回具体表格','# Split the AI summary into testable claims, each pointing back to a table'),
       'sharpe_fund <- mean(y) / sd(y) * sqrt(12)',
       'sharpe_mkt <- mean(x) / sd(x) * sqrt(12)',
       'hm <- lm(y ~ x + I(pmax(x, 0)))',
       'print(c(sharpe_fund = sharpe_fund, sharpe_mkt = sharpe_mkt,',
       '  hm_timing = coef(hm)[3], hm_t = summary(hm)$coefficients[3, 3]))',
       T('# 断言 1：夏普高说明择时能力 → 错误；夏普不识别收益来源','# Claim 1: high Sharpe implies timing → wrong; Sharpe does not identify the source of returns'),
       'print(c(alpha_monthly = alpha, alpha_t = summary(fit)$coefficients[1, 3],',
       '  alpha_annual = (1 + alpha)^12 - 1))',
       T('# 断言 2：显著 α 可线性外推 → 过度外推；需区间与样本外','# Claim 2: significant alpha extrapolates → over-extrapolation; needs an interval and out-of-sample'),
       'total <- mean(y) * 12',
       'print(c(total, beta_part = beta * mean(x) * 12, alpha_part = alpha * 12,',
       '  residual = total - beta * mean(x) * 12 - alpha * 12))',
       T('# 断言 3：归因全部归功于经理 → 恒等式不等于因果','# Claim 3: attribution credits the manager → an identity is not causation')],
      T('AI 摘要必须先被拆成可检验断言；每条断言都要能指回一张表，否则不能写进报告。','An AI summary must first be split into testable claims; each claim must point back to a table, otherwise it cannot go into the report.'));
    add('checklist',T('审查清单','Review checklist'),
      ['checks <- c(',
       '  "先问指标能识别什么", "alpha 与择时系数一起看",',
       '  "样本内显著不等于样本外可用", "归因相加是恒等式",',
       '  "任何 AI 摘要都要能指回具体表格")',
       'print(checks)'],
      T('清单只记录"审查了什么"，不记录"AI 说得对不对"。','The checklist records what was reviewed, not whether the AI was right.'));
  }
  if(mode==='full'){
    add('plot',T('净值与回撤','Net asset value and drawdown'),
      [T('# 基金与基准的累计净值，以及基金的回撤路径','# Cumulative NAV for the fund and the benchmark, plus the fund drawdown'),
       'nav <- cumprod(1 + fund); nav_mkt <- cumprod(1 + mkt)',
       'dd <- nav / cummax(nav) - 1',
       'plot(nav, type = "l", ylim = range(c(nav, nav_mkt)), xlab = "Month", ylab = "NAV",',
       '  main = "Fund and benchmark")',
       'lines(nav_mkt, lty = 2)',
       'plot(dd, type = "l", xlab = "Month", ylab = "Drawdown", main = "Drawdown")'],
      T('净值曲线看累积结果，回撤曲线看路径风险；两条曲线都不能证明未来表现。','The NAV curve shows the cumulative outcome and the drawdown curve the path risk; neither proves future performance.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 12 | fund performance\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});

;

/* Source: fund-workbench.js */
/* Experiment12 · workbench descriptor for LabRunner. */
(()=>{'use strict';
const M=FundMath,C=FundCode;
const LAB={
  id:'fund',cls:'fund-lab',global:'FundLab',
  views:M.views,
  defaults:()=>({...M.defaults}),
  check:p=>M.check(p),
  params(p,view,K){
    let h=K.field({id:'months',zh:'月份数',en:'Months',value:p.months,min:36,max:240,step:12})+
      K.field({id:'alpha',zh:'真实月度 alpha',en:'True monthly alpha',value:p.alpha,min:-.01,max:.02,step:.0005})+
      K.field({id:'beta',zh:'真实 beta',en:'True beta',value:p.beta,min:.1,max:2.5,step:.05})+
      K.field({id:'timing',zh:'真实择时能力',en:'True timing ability',value:p.timing,min:-1,max:1.5,step:.05})+
      K.field({id:'idio',zh:'特质波动率',en:'Idiosyncratic volatility',value:p.idio,min:.005,max:.06,step:.005})+
      K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
    if(view==='tb')h+=K.field({id:'aversion',zh:'风险厌恶系数（参考）',en:'Risk aversion (reference)',value:p.aversion,min:.5,max:10,step:.5});
    return h;
  },
  question(view){return {
    metrics:['同样的超额收益，用 Sharpe 与 Treynor 排名会不同吗？','Can Sharpe and Treynor rank the same excess return differently?'],
    timing:['"涨得多、跌得少"是选股还是择时？如何用回归区分？','Is "more up, less down" selection or timing, and how does a regression tell them apart?'],
    tb:['给定 alpha 与特质风险，主动组合应该占多少？','Given alpha and idiosyncratic risk, how large should the active position be?'],
    attr:['基金的差超额收益里，多少来自市场，多少来自经理？','How much of the fund excess return comes from the market and how much from the manager?'],
    ai:['AI 写的绩效归因摘要，哪句话必须改？','Which sentence in the AI attribution summary must be changed?']
  }[view];},
  summary(view){return {
    metrics:[['Sharpe','Sharpe'],['Treynor','Treynor'],['Jensen α','Jensen α']],
    timing:[['TM 回归','TM regression'],['HM 回归','HM regression'],['截距与择时相关','Intercept and timing correlate']],
    tb:[['主动权重','Active weight'],['评估比率','Appraisal ratio'],['依赖 α 稳定性','Depends on α stability']],
    attr:[['三部分相加','Parts add up'],['残差为恒等式','Residual is an identity'],['不是因果','Not causal']],
    ai:[['断言可检验','Claims must be testable'],['指回表格','Point back to a table'],['留痕','Record the review']]
  }[view];},
  assumptions(view){return {
    metrics:['合成基金的 alpha、beta 与择时能力由固定参数设定，页面会显示真值。Sharpe 用总风险、Treynor 用系统性风险、Jensen α 是回归截距；年化一律用复合，未扣费用与税。','The synthetic fund alpha, beta and timing ability are fixed parameters whose true values are shown. Sharpe uses total risk, Treynor systematic risk and Jensen alpha is a regression intercept; annualisation compounds and ignores fees and taxes.'],
    timing:['择时模型检验 beta 是否随市场状态变化：TM 用二次项，HM 用上行收益项。截距与择时项高度相关，短样本下难以分离，正系数也不等于可复制的择时能力。','Timing models test whether beta changes with the market state: TM uses a quadratic term and HM an up-market term. The intercept and the timing term are highly correlated and hard to separate in short samples; a positive coefficient is not replicable timing skill.'],
    tb:['Treynor-Black 用 alpha 与主动组合方差构造权重，再与市场组合混合。它把估计出来的 alpha 当作已知真值，忽略估计误差；alpha 不稳定时权重会被放大。','Treynor-Black forms weights from alpha and active-portfolio variance, then blends with the market. It treats the estimated alpha as known and ignores estimation error, so unstable alphas produce extreme weights.'],
    attr:['收益归因把超额收益分解为市场暴露、选择能力与残差；三部分按构造相加等于总额，残差恒为零并不证明模型完整。归因是会计恒等式，不是因果解释。','Attribution splits excess return into market exposure, selection and residual; the parts add to the total by construction, and a zero residual does not prove the model is complete. Attribution is an accounting identity, not a causal explanation.'],
    ai:['本视图给出三段典型的 AI 摘要断言，并逐条指回具体表格与数字：夏普不能识别择时、显著 α 不能线性外推、归因恒等式不等于因果。审查结论是"改哪句话、依据哪张表"，不是"AI 对不对"。','This view lists three typical AI-summary claims and maps each back to a concrete table and number: Sharpe cannot identify timing, a significant alpha cannot be extrapolated, and an attribution identity is not causation. The output is which sentence changes and which table supports it — not a verdict on the AI.']
  }[view];},
  compute(p,view){
    if(view==='ai')return M.aiReview(p);
    if(view==='metrics')return M.metrics(p);
    if(view==='timing')return M.timing(p);
    if(view==='tb')return M.treynorBlack(p);
    return M.attribution(p);
  },
  chartTitle(q,p,view){return {
    metrics:['基金与基准的累计净值','Cumulative net asset value of fund and benchmark'],
    timing:['超额收益与市场超额收益','Excess return against the market excess return'],
    tb:['主动组合权重','Active-portfolio weight'],
    attr:['超额收益分解（年化）','Excess-return decomposition (annualised)'],
    ai:['AI 摘要的审查流程','Review flow for the AI summary']
  }[view];},
  metrics(q,p,view,K){
    if(view==='metrics')return K.metrics([['Sharpe（基金）','Sharpe (fund)',q.fund.sharpe.toFixed(2)],['Treynor','Treynor',q.treynor.toFixed(3)],['Jensen α（月度）','Jensen α (monthly)',K.pct(q.alpha,3)]]);
    if(view==='timing')return K.metrics([['HM 择时系数','HM timing',q.hm.gamma.toFixed(3)],['HM t 值','HM t-stat',q.hm.gammaT.toFixed(2)],['真实择时','True timing',q.true.timing.toFixed(2)]]);
    if(view==='tb')return K.metrics([['主动权重 w*','Active weight w*',K.pct(q.wStar,1)],['组合 Sharpe','Combined Sharpe',q.sharpeCombo.toFixed(2)],['市场 Sharpe','Market Sharpe',q.sharpeMarket.toFixed(2)]]);
    if(view==='ai')return K.metrics([['断言数','Claims',String(q.checked)],['需修改','Must change',String(q.corrected)],['清单项','Checklist',String(q.checklist.length)]]);
    return K.metrics([['总超额（年化）','Total excess (annual)',K.pct(q.total)],['市场部分','Market part',K.pct(q.factor)],['选择部分','Selection part',K.pct(q.parts[1][2])]]);
  },
  legend(q,p,view,K){
    if(view==='metrics')return K.legend([['基金净值','Fund NAV','#6689a8',false],['基准净值','Benchmark NAV','#9b88ac',true]]);
    if(view==='timing')return K.legend([['月度观测','Monthly observations','#6689a8',false],['上行期拟合','Up-market fit','#659b8a',true]]);
    if(view==='tb')return K.legend([['组合净值','Combined NAV','#6689a8',false],['市场净值','Market NAV','#9b88ac',true]]);
    return K.legend([['市场暴露','Market','#6689a8',false],['选择能力','Selection','#659b8a',false],['残差','Residual','#b5bfcc',false]]);
  },
  chart(q,p,view,{svgHost,K}){
    if(view==='metrics'){
      return K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['累计净值','Cumulative NAV'],
        series:[{type:'line',points:q.nav.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 月基金净值 ${d[1].toFixed(3)}`,'Month '+Math.round(d[0])+': fund NAV '+d[1].toFixed(3)]},
          {type:'line',points:q.navBench.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],aria:['净值曲线','NAV curves']});
    }
    if(view==='timing'){
      return K.chart(svgHost(),{xLabel:['市场超额收益','Market excess return'],yLabel:['基金超额收益','Fund excess return'],yZero:true,
        series:[{type:'scatter',points:q.scatter.map(s=>[s.x,s.y]),color:'#6689a8',radius:3,tip:d=>[`x=${K.pct(d[0])}；y=${K.pct(d[1])}`,'x='+K.pct(d[0])+'; y='+K.pct(d[1])]},
          {type:'line',points:[[Math.min(...q.scatter.map(s=>s.x)),q.tm.alpha+q.tm.beta*Math.min(...q.scatter.map(s=>s.x))],[Math.max(...q.scatter.map(s=>s.x)),q.tm.alpha+q.tm.beta*Math.max(...q.scatter.map(s=>s.x))]],color:'#659b8a',dash:true}],
        aria:['择时散点','Timing scatter']});
    }
    if(view==='tb'){
      return K.chart(svgHost(),{xLabel:['月份','Month'],yLabel:['累计净值','Cumulative NAV'],
        series:[{type:'line',points:q.comboNav.map((v,i)=>[i+1,v]),color:'#6689a8'},{type:'line',points:q.marketNav.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],
        aria:['组合净值','Combined NAV']});
    }
    if(view==='ai'){
      return K.flow(svgHost(),[
        ['生成摘要','Draft summary','3 claims'],
        ['拆成断言','Split into claims','testable'],
        ['指回表格','Map to tables','evidence'],
        ['修正措辞','Correct wording','4 items'],
        ['留痕','Record','report']],1);
    }
    return K.chart(svgHost(),{yZero:true,xLabel:['归因项','Attribution part'],yLabel:['年化超额收益','Annualised excess'],
      xTickFormat:v=>[K.t('市场','Market'),K.t('选择','Selection'),K.t('残差','Residual')][Math.round(v)-1],
      series:[{type:'bar',points:q.parts.map((r,i)=>[i+1,r[2]]),color:'#6689a8',gap:.55,tip:d=>[`${K.t(...q.parts[Math.round(d[0])-1].slice(0,2))}：${K.pct(d[1])}`,`${K.t(...q.parts[Math.round(d[0])-1].slice(0,2))}: ${K.pct(d[1])}`]}],
      aria:['收益归因','Return attribution']});
  },
  details(q,p,view,K){
    if(view==='metrics')return K.table([['指标','Metric'],['基金','Fund'],['基准','Benchmark']],[
      [K.t('年化收益','Annualised return'),K.pct(q.fund.ann),K.pct(q.bench.ann)],
      [K.t('年化波动率','Annualised volatility'),K.pct(q.fund.vol),K.pct(q.bench.vol)],
      ['Sharpe',q.fund.sharpe.toFixed(3),q.bench.sharpe.toFixed(3)],
      [K.t('Beta','Beta'),q.beta.toFixed(3),'1.000'],
      [K.t('跟踪误差','Tracking error'),K.pct(q.trackError),'—'],
      ['Jensen α',K.pct(q.alpha,3),'—'],
      [K.t('信息比率 IR','Information ratio'),q.ir.toFixed(3),'—'],
      [K.t('最大回撤','Maximum drawdown'),K.pct(q.mdd),'—'],
      ['Calmar',q.calmar.toFixed(2),'—']]);
    if(view==='timing')return K.table([['模型','Model'],['截距（月度）','Intercept (monthly)'],['t 值','t-stat'],['择时系数','Timing coefficient'],['择时 t','Timing t']],[
      ['CAPM',K.pct(q.capm.alpha,3),'—','—','—'],
      ['TM',K.pct(q.tm.alpha,3),q.tm.alphaT.toFixed(2),q.tm.gamma.toFixed(3),q.tm.gammaT.toFixed(2)],
      ['HM',K.pct(q.hm.alpha,3),q.hm.alphaT.toFixed(2),q.hm.gamma.toFixed(3),q.hm.gammaT.toFixed(2)]])+
      `<p class="chart-note">${K.esc(K.t('真实 alpha ','True alpha '))}${K.pct(q.true.alpha,3)}${K.esc(K.t('，真实择时 ','; true timing '))}${q.true.timing}${K.esc(K.t('。线性 CAPM 把择时收益误记为 alpha。','. A linear CAPM misattributes timing payoff to alpha.'))}</p>`;
    if(view==='tb')return K.table([['项目','Item'],['数值','Value']],[
      [K.t('评估比率 α/σ(e)','Appraisal ratio'),q.appraisal.toFixed(3)],[K.t('主动组合权重 w_A','Active weight w_A'),q.wActive.toFixed(3)],
      [K.t('混合后权重 w*','Blended weight w*'),K.pct(q.wStar,1)],[K.t('组合 Beta','Combined beta'),q.betaCombo.toFixed(3)],
      [K.t('组合 Sharpe','Combined Sharpe'),q.sharpeCombo.toFixed(3)],[K.t('市场 Sharpe','Market Sharpe'),q.sharpeMarket.toFixed(3)]]);
    if(view==='ai'){
      return K.table([['AI 断言','AI claim'],['结论','Verdict'],['为什么','Why'],['证据/数字','Evidence']],
        q.claims.map(c=>[K.t(c.zh,c.en),K.t(c.verdict[0],c.verdict[1]),K.t(c.why[0],c.why[1]),K.t(c.numbers[0],c.numbers[1])]))+
        `<p class="chart-note">${K.esc(K.t('清单：','Checklist: '))}${q.checklist.map(x=>K.esc(K.t(x.zh,x.en))).join(' · ')}</p>`;
    }
    return K.table([['归因项','Part'],['年化贡献','Annualised']],q.parts.map(r=>[K.t(r[0],r[1]),K.pct(r[2])]).concat([[K.t('合计','Total'),K.pct(q.total)]]));
  },
  graphKind(view){return {ai:['AI 归因审查','AI attribution review'],metrics:['基金绩效','Fund performance'],timing:['选股与择时','Selection and timing'],tb:['Treynor-Black','Treynor-Black'],attr:['收益归因','Attribution']}[view];},
  code:(p,view,mode,lang)=>C.build(p,view,mode,lang),
  teacher:['四节对应大纲的"基金绩效、单因素整体绩效、选股与择时能力、投资组合策略、Treynor-Black、预测准确性、资产配置与基金经理行为"。建议先用 Sharpe/Treynor/α 三口径排名，再用 TM/HM 分离择时，最后做 Treynor-Black 与归因。强调所有指标都基于同一段合成数据，不能外推。',
    'The four sections follow the syllabus: fund performance, single-factor metrics, stock selection and market timing, portfolio strategy, Treynor-Black, forecast accuracy, asset allocation and manager behaviour. Rank by Sharpe, Treynor and alpha first, then separate timing with TM and HM, and finish with Treynor-Black and attribution. Stress that every metric uses the same synthetic sample and cannot be extrapolated.'],
  help:['页面不执行 R；每节生成可整段运行的基础 R 脚本并内嵌同一份合成月度序列。右上角可切换中文/English，数值与脚本保持一致。','The page does not run R; each section generates a standalone base-R script with the same synthetic monthly series embedded. The language switch keeps numbers and scripts identical.'],
  practice:['新建 R Script，复制完整脚本整段运行。核对：年化收益、波动率、Sharpe、Treynor、Jensen α、IR、最大回撤与 Calmar；再核对 TM/HM 的截距与择时系数，最后核对 Treynor-Black 权重与归因三项之和。','Create a new R Script and run it. Check the annualised return, volatility, Sharpe, Treynor, Jensen alpha, IR, maximum drawdown and Calmar; then the TM/HM intercepts and timing coefficients; finally the Treynor-Black weights and the sum of the three attribution parts.'],
  fileName:'experiment12-fund-performance.R'
};
window.FundWorkbench={mount:()=>LabRunner.mount(LAB)};
})();

;

/* Source: capm-math.js */
/* Experiment09: paired simple returns, OLS with classical finite-sample t inference. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CAPMMath=api;})(this,()=>{
const defaults={rf:.03,rm:.09,beta:1.2,sm:.18,w:1};
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
function theory(p){for(const k of Object.keys(defaults))if(!Number.isFinite(p[k]))throw Error('所有理论参数须为有限数值。');if(p.rf< -1||p.rm< -1)throw Error('简单收益率不能小于−100%。');if(p.sm<=0)throw Error('市场标准差 σm 必须大于0。');if(p.w<0||p.w>3)throw Error('市场配置权重限定0至3；大于1表示按同一无风险利率借款。');const result={expected:p.rf+p.beta*(p.rm-p.rf),premium:p.rm-p.rf,sigma:p.w*p.sm,return:p.rf+p.w*(p.rm-p.rf)};if(Object.values(result).some(v=>!Number.isFinite(v)))throw Error('参数超出有限数值计算范围，请缩小数值。');return result;}
function synthetic(){return Array.from({length:60},(_,j)=>{const i=j+1,x=.04*Math.sin(i*1.7),rf=.002;return{date:`${2019+Math.floor(j/12)}-${String(j%12+1).padStart(2,'0')}-01`,ri:rf+.001+1.2*x+.012*Math.cos(i*2.3),rm:rf+x,rf};});}
function csvRows(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell!=='')throw Error('CSV引号格式错误。');else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV引号未闭合。');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;}
function parseCSV(text,{scale='decimal',frequency='monthly'}={}){if(!['decimal','percent'].includes(scale)||!['daily','weekly','monthly','annual'].includes(frequency))throw Error('请选择收益尺度和频率。');if(text.length>2000000)throw Error('CSV超过2MB限制。');const raw=csvRows(text.replace(/^\uFEFF/,'')),h=raw.shift()?.map(x=>x.trim().toLowerCase());if(!h||h.join(',')!=='date,ri,rm,rf')throw Error('列名及顺序须为 date,ri,rm,rf；仅支持已对齐的简单收益率，不接受价格。');if(raw.length>5000)throw Error('最多5000行。');let seen=new Set(),warnings=[];const rows=raw.map((r,i)=>{if(r.length!==4)throw Error(`第${i+2}行列数不等于4。`);const date=r[0].trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error(`第${i+2}行日期须为有效YYYY-MM-DD。`);if(seen.has(date))throw Error('重复日期：'+date+'；请先核对，系统不会自动平均。');seen.add(date);const v=r.slice(1).map(s=>{if(!s.trim()||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(s.trim()))throw Error(`第${i+2}行存在缺失或非数值收益率；请先清理。`);return Number(s)/(scale==='percent'?100:1);});if(v.some(x=>!Number.isFinite(x)||x< -1))throw Error(`第${i+2}行简单收益低于−100%或无效；请核对尺度。`);if(v.some(x=>Math.abs(x)>.5))warnings.push('存在绝对值超过50%的单期收益；未删除，请核对单位、复权及异常行情。');return{date,ri:v[0],rm:v[1],rf:v[2]};});const ordered=rows.every((r,i)=>i===0||r.date>rows[i-1].date);rows.sort((a,b)=>a.date.localeCompare(b.date));if(!ordered)warnings.push('已将整行按日期升序排序，股票/市场/无风险收益配对不变。');if(frequency==='weekly'){const weeks=rows.map(r=>Math.floor((Date.parse(r.date)/86400000+3)/7));if(new Set(weeks).size!==rows.length)throw Error('周度模式每个自然周只允许一行，请核对频率。');if(weeks.some((w,i)=>i&&w-weeks[i-1]!==1))warnings.push('周度样本存在间隔；不填补缺周，请核对收益区间。');}if(frequency==='monthly'&&new Set(rows.map(r=>r.date.slice(0,7))).size!==rows.length)throw Error('月度模式每月只允许一行。');if(frequency==='annual'&&new Set(rows.map(r=>r.date.slice(0,4))).size!==rows.length)throw Error('年度模式每年只允许一行。');if(frequency==='monthly'&&rows.some((r,i)=>i&&((+r.date.slice(0,4)*12+(+r.date.slice(5,7)))-(+rows[i-1].date.slice(0,4)*12+(+rows[i-1].date.slice(5,7))))!==1))warnings.push('月份存在间隔；回归按现有配对行计算，不填补缺月。');ols(rows);return{rows,warnings:[...new Set(warnings)]};}
// Lanczos log-gamma and continued fraction for the regularized incomplete beta.
function lg(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);z--;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function cf(a,b,x){const tiny=1e-300;let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<tiny)d=tiny;d=1/d;let h=d;for(let m=1;m<300;m++){for(const aa of [m*(b-m)*x/((a+2*m-1)*(a+2*m)),-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1))]){d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const delta=d*c;h*=delta;if(aa<0&&Math.abs(delta-1)<3e-14)return h;}}return h;}
function ib(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const v=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?v*cf(a,b,x)/a:1-v*cf(b,a,1-x)/b;}
function pvalue(t,df){return Math.max(0,Math.min(1,ib(df/(df+t*t),df/2,.5)));}
function ols(rows){if(rows.length<5)throw Error('至少需要5个完整配对样本（课堂最低门槛，少样本推断仍不稳定）。');const x=rows.map(r=>r.rm-r.rf),y=rows.map(r=>r.ri-r.rf);if([...x,...y].some(v=>!Number.isFinite(v)))throw Error('超额收益存在缺失或非有限值。');const mx=mean(x),my=mean(y),xx=x.reduce((s,v)=>s+(v-mx)**2,0),yy=y.reduce((s,v)=>s+(v-my)**2,0);if(!Number.isFinite(xx)||!Number.isFinite(yy))throw Error('样本超出有限数值计算范围，请核对收益率尺度。');if(xx/(x.length-1)<=1e-24)throw Error('市场超额收益必须有变化，常数样本无法估计Beta。');if(yy/(x.length-1)<=1e-24)throw Error('证券超额收益为常数，R²与统计推断退化。');const b=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/xx,a=my-b*mx,fitted=x.map(v=>a+b*v),residual=y.map((v,i)=>v-fitted[i]),sse=residual.reduce((s,v)=>s+v*v,0),df=x.length-2,degenerate=sse<=1e-24,variance=sse/df,seA=Math.sqrt(variance*(1/x.length+mx*mx/xx)),seB=Math.sqrt(variance/xx),tA=degenerate?null:a/seA,tB=degenerate?null:b/seB;return{a,b,x,y,fitted,residual,n:x.length,df,r2:1-sse/yy,seA:degenerate?null:seA,seB:degenerate?null:seB,tA,tB,pA:degenerate?null:pvalue(tA,df),pB:degenerate?null:pvalue(tB,df),degenerate,covariance:x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/(x.length-1),marketVariance:xx/(x.length-1)};}
return{defaults,mean,theory,synthetic,parseCSV,ols,pvalue};});

;

/* Source: capm-code.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./capm-math'):root.CAPMMath);if(typeof module==='object')module.exports=api;else root.CAPMCode=api;})(this,M=>{
function build(p,rows,meta={source:'固定60个月合成样本',frequency:'monthly'},view='sml',mode='full'){
const period={daily:['每日','daily'],weekly:['每周','weekly'],monthly:['每月','monthly'],annual:['每年','annual']}[meta.frequency];if(!period)throw Error('样本频率未知');
const q=M.ols(rows),t=M.theory(p),vec=k=>'c('+rows.map(r=>String(r[k])).join(',\n  ')+')';
const blocks=[];function add(key,title,code,explain){blocks.push({key,title,lines:code.split('\n'),explain});}
add('parameters','同年度理论参数',`# 实验09：基础R完整脚本，无需额外包\n# 理论定价使用年度简单收益；样本单独按其频率回归\nrf <- ${p.rf}\nrm <- ${p.rm}\nbeta <- ${p.beta}\nsigma_m <- ${p.sm}\nw <- ${p.w}\nstopifnot(all(is.finite(c(rf,rm,beta,sigma_m,w))),\n  rf >= -1, rm >= -1, sigma_m > 0, w >= 0, w <= 3)`, 'rf与市场预期收益须同一年度、同为简单收益。理论β是输入，样本β由数据估计。');
add('sml','SML：系统风险定价',`expected <- rf + beta * (rm - rf)\nbetas <- seq(min(-2,beta),max(3,beta),length.out=101)\nsml <- rf + betas * (rm-rf)`, `理论必要/期望收益为${(t.expected*100).toFixed(2)}%／年。市场风险溢价${(t.premium*100).toFixed(2)}%；适用单个资产或组合，不是已实现收益预测。`);
add('cml','CML：有效资本配置',`sigma_p <- w * sigma_m\nreturn_p <- rf + w * (rm-rf)\ncml <- function(sigma) rf + (rm-rf)*sigma/sigma_m`, '总风险σ只用于无风险资产+市场组合的有效配置。w>1代表借款；假定借贷利率同为rf、市场组合为切点。');
add('data','当前样本原样内嵌',`# 数据来源以网页当前标注为准：${String(meta.source).replace(/[\r\n]/g,' ')}\n# ${meta.frequency}; simple returns; decimal units\n# 不进行价格转换、跨列错位匹配或自动删异常\ndates <- c(${rows.map(r=>'"'+r.date+'"').join(',\n  ')})\nd <- data.frame(date=as.Date(dates),\n  ri=${vec('ri')},\n  rm=${vec('rm')},\n  rf=${vec('rf')})\nstopifnot(nrow(d)>=5, !anyDuplicated(d$date),\n  all(complete.cases(d)), all(diff(d$date)>0),\n  all(is.finite(as.matrix(d[,2:4]))),\n  all(as.matrix(d[,2:4]) >= -1))`, '完整脚本内嵌当前已核对的配对数据，不依赖上传文件路径。ri、rm、rf均为同一期简单总收益；CSV导出也是这份小数尺度数据。');
add('scl','SCL：实际样本OLS',`x <- d$rm - d$rf\ny <- d$ri - d$rf\nstopifnot(var(x)>1e-24, var(y)>1e-24)\nfit <- lm(y ~ x)\ns <- summary(fit)\n# 近乎完全拟合时不作常规SE/t/p推断，与网页边界一致\nif (sum(residuals(fit)^2) <= 1e-24) {\n  s$coefficients[,2:4] <- NA_real_\n}\nbeta_cov <- cov(x,y)/var(x)`, `β̂=cov(x,y)/var(x)=${q.b.toFixed(6)}，α̂=${(q.a*100).toFixed(4)}%／${period[0].slice(1)}。带截距最小二乘，不随理论β输入变化。`);
add('inference','有限样本t检验与局限',`# 经典同方差OLS：条件均值正确、误差独立同方差；精确t检验另需正态误差\n# alpha H0: alpha=0; beta H0: beta=0\nprint(s$coefficients)\nprint(c(expected=expected, sigma_p=sigma_p, return_p=return_p,\n  beta_cov=beta_cov, R_squared=s$r.squared, n=nrow(d)))\n# alpha非显著不证明CAPM成立；beta显著也不是完整CAPM检验\n# 合成样本的p值只演示计算，统计显著不等于因果\n# 可选稳健推断（需自行安装sandwich和lmtest，不在本脚本自动安装）：\n# lmtest::coeftest(fit, vcov.=sandwich::NeweyWest(fit))`, 'α的双侧检验问的是截距是否偏离0；β的双侧检验问的是斜率是否偏离0。单资产时间序列回归不能验证完整横截面均衡定价理论；序列相关、异方差、市场代理及样本选择影响结论。');
if(mode==='full'){
const plot={sml:'plot(betas,sml,type="l",xlab="Beta (unitless)",\n  ylab="Required expected return (annual decimal)",main="SML")\npoints(beta,expected,pch=19,col="steelblue")',cml:'sigmas <- seq(0,max(2*sigma_m,sigma_p),length.out=101)\nplot(sigmas,cml(sigmas),type="l",xlab="Efficient portfolio SD (annual decimal)",\n  ylab="Expected return (annual decimal)",main="CML under market tangency assumptions")\npoints(sigma_p,return_p,pch=19,col="steelblue")',scl:'plot(x,y,xlab="Market excess return (${period[1]} decimal)",\n  ylab="Asset excess return (${period[1]} decimal)",main="SCL: paired sample")\nabline(fit,col="steelblue")',residual:'plot(fitted(fit),residuals(fit),\n  xlab="Fitted excess return (${period[1]} decimal)",\n  ylab="Residual (${period[1]} decimal)",main="Residuals vs fitted")\nabline(h=0,lty=2)'}[view].replaceAll('${period[1]}',period[1]);
add('plot','当前主题绘图与残差导出',`${plot}\n# 保留全部拟合/残差供核对，不把多图塞进当前画面\nresult <- data.frame(d, x=x, y=y, fitted=fitted(fit),\n  residual=residuals(fit))\nprint(head(result))\n# 如需保存：write.csv(result,"capm-results.csv",row.names=FALSE)`, 'R图只画当前主题；所有回归结果仍可直接打印、检查和另存。R图使用小数单位，网页坐标为百分比，数值相差100倍是显示换算。');
}
for(const b of blocks){b.navLabel={parameters:'参数',sml:'SML理论',cml:'CML配置',data:'样本数据',scl:'OLS回归',inference:'统计检验',plot:'当前绘图'}[b.key];}
return{blocks,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,t,mode};}
return{build};});

;

/* Source: capm-teaching.js */
/* Presentation semantics only: no parameter estimates or inference are recalculated here. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.CAPMTeaching=api;})(this,()=>{
const periods={daily:{label:'每日',short:'日',r:'daily'},weekly:{label:'每周',short:'周',r:'weekly'},monthly:{label:'每月',short:'月',r:'monthly'},annual:{label:'每年',short:'年',r:'annual'}};
const period=f=>{if(!periods[f])throw Error('样本频率未知，不能标注收益单位。');return periods[f];};
function empirical(q,frequency){const u=period(frequency).label,b=q.b,abs=Math.abs(b),near=abs<.05;let sensitivity=near?'估计的一阶线性市场暴露较小':b<0?'样本拟合关系呈反向变化':b>1?'样本中对市场超额收益的敏感度较高':b===1?'样本敏感度约等于1':'样本中对市场超额收益的敏感度相对较低';
const beta=`样本Beta约为${b.toFixed(near?4:2)}：市场超额收益每上升1个百分点，资产超额收益的拟合值平均${b<0?'下降':'上升'}约${abs.toFixed(near?4:2)}个百分点；${sensitivity}。`;
const testable=Number.isFinite(q.pA)&&Number.isFinite(q.seA)&&q.seA>0&&!q.degenerate;const status=!testable?'不可检验：近乎完全拟合导致标准误及t/p推断退化':q.pA<.05?'在经典OLS推断假设下，5%水平拒绝Alpha=0':'在经典OLS推断假设下，5%水平没有足够证据拒绝Alpha=0';
const alpha=`Alpha约为${u}${q.a!==0&&Math.abs(q.a*100)<.005?(q.a*100).toExponential(2):(q.a*100).toFixed(2)}%；${status}。`;
return{beta,alpha,status,category:near?'near-zero':b<0?'negative':b>1?'high':'low',testable,summary:beta+alpha,limit:'Alpha不显著，不代表CAPM已被证明成立。单资产时间序列回归不足以检验整个CAPM；统计关系不等于经济因果。',r2:`R²=${(q.r2*100).toFixed(2)}%：表示本样本资产超额收益变动被该线性拟合解释的比例，不是预测正确率。`};}
function allocation(w){if(w===0)return'全部配置无风险资产。';if(w===1)return'全部配置市场组合。';if(w<1)return`市场组合占${(w*100).toFixed(0)}%，其余${((1-w)*100).toFixed(0)}%配置无风险资产。`;return`借入相当于自有资金${((w-1)*100).toFixed(0)}%的资金，将${(w*100).toFixed(0)}%配置市场组合，属于杠杆投资。假设按设定的无风险利率借款；实际融资利率可能不同。`;}
function theoretical(p,t){let exposure=p.beta<0?`当前理论Beta=${p.beta}，表示反向的市场系统性风险暴露`:p.beta===0?'当前理论Beta=0，表示模型中的市场系统性风险暴露为0':`当前市场系统性风险暴露约为市场组合的${p.beta}倍（不是所有风险的倍数）`;return`${exposure}；模型要求的预期收益率为${(t.expected*100).toFixed(2)}%／年。市场溢价${t.premium>0?'为正，Beta越大，必要收益越高':t.premium<0?'为负，Beta越大，代数必要收益越低':'为0，必要收益等于无风险收益'}，不保证实际收益。`;}
return{period,empirical,allocation,theoretical};});

;

/* Source: capm-hm-math.js */
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

;

/* Source: capm-adv-view.js */
/* Experiment09 拓展视图：高阶矩 CAPM（课件 9.1 advanced CAPM）。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CAPMHMMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.CAPMHMMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#capmAdvControls');
  if(!host){host=document.createElement('section');host.id='capmAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('高阶矩 CAPM 参数','Higher-moment CAPM settings'))}</h3>
    <p class="lab-note">${K.esc(t('除市场 beta 外，把协偏度与协峰度也作为横截面定价因子；比较 2/3/4 阶矩模型。','Beyond market beta, coskewness and cokurtosis also enter the cross-section; compare the 2-, 3- and 4-moment models.'))}</p>
    ${K.field({id:'assets',zh:'资产数',en:'Assets',value:p.assets,min:8,max:60,step:2})}
    ${K.field({id:'months',zh:'月份数',en:'Months',value:p.months,min:60,max:300,step:12})}
    ${K.field({id:'gamma3',zh:'协偏度溢价系数',en:'Coskewness premium',value:p.gamma3,min:0,max:1.5,step:.05})}
    ${K.field({id:'gamma4',zh:'协峰度溢价系数',en:'Cokurtosis premium',value:p.gamma4,min:-1,max:1.5,step:.05})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：加入协偏度后横截面 R² 会大幅上升还是只小幅上升？','Predict first: will adding coskewness raise the cross-sectional R² a lot or a little?'],
      ['把 gamma3 调到 0，观察协偏度系数与 t 值是否回到不显著。','Set gamma3 to zero and watch the coskewness coefficient and t-stat lose significance.'],
      ['把资产数调到 8，说明为什么这时 R² 不能再当作模型选择依据。','Set assets to 8 and explain why R² can no longer choose the model there.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#capmAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,''),v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function renderCode(){
  if(!state.built)return;
  const blocks=state.built.blocks;
  let n=0;
  $('#code').innerHTML=blocks.map(b=>`<div class="logic-block">${b.lines.map((l,i)=>`<button class="code-line" data-hm-code="${b.key}" data-line="${i}"><span class="num">${++n}</span><code>${WorkbenchUI.colorCode(l)}</code></button>`).join('')}</div>`).join('');
  const first=blocks[0];
  $('#explanation').innerHTML=`<h3>${K.esc(first.title)}</h3><p>${K.esc(first.explain)}</p>`;
  if(first.formula&&window.katex){const div=document.createElement('div');div.className='formula';$('#explanation').append(div);try{katex.render(first.formula,div,{throwOnError:false});}catch{}}
  $('#code').onclick=e=>{const btn=e.target.closest('[data-hm-code]');if(!btn)return;const b=blocks.find(x=>x.key===btn.dataset.hmCode);if(!b)return;$('#explanation').innerHTML=`<h3>${K.esc(b.title)}</h3><p>${K.esc(b.explain)}</p>`;};
}
function paint(){
  const p=state.p;
  const native=$('#capmPlot');if(native)native.hidden=true;
  let plot=$('#capmAdvPlot');
  if(!plot){plot=document.createElement('div');plot.id='capmAdvPlot';document.querySelector('#chartHost').append(plot);}
  plot.hidden=false;
  plot.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=plot.querySelector('.svg-host'),title=plot.querySelector('h3');
  title.textContent=t('横截面：平均超额收益 vs 拟合值','Cross-section: mean excess return against fitted value');
  try{
    const q=M().crossSection(p);state.last=q;
    const m4=q.models[2];
    K.chart(svg,{xLabel:['拟合值（4 阶矩模型）','Fitted (4-moment)'],yLabel:['平均超额收益','Mean excess return'],
      series:[{type:'scatter',points:q.meanEx.map((v,i)=>[m4.fitted[i],v]),color:'#6689a8',radius:3.4,tip:d=>[`拟合 ${K.pct(d[0],3)}；实际 ${K.pct(d[1],3)}`,'fitted '+K.pct(d[0],3)+'; actual '+K.pct(d[1],3)]},
        {type:'line',points:[[Math.min(...m4.fitted),Math.min(...m4.fitted)],[Math.max(...m4.fitted),Math.max(...m4.fitted)]],color:'#9b88ac',dash:true}],
      aria:['横截面拟合','Cross-sectional fit']});
    K.metrics([['2 阶矩 R²','2-moment R²',K.pct(q.models[0].r2,1)],['3 阶矩 R²','3-moment R²',K.pct(q.models[1].r2,1)],['4 阶矩 R²','4-moment R²',K.pct(m4.r2,1)]]);
    K.legend([['资产','Asset','#6689a8',false],['45° 参照','45° reference','#9b88ac',true]]);
    K.details(K.table([['模型','Model'],['β 价格','β price'],['协偏度','Coskewness'],['协峰度','Cokurtosis'],['R²','R²']],[
      [t('2 阶矩','2-moment'),q.models[0].lambda[0].toFixed(4),'—','—',K.pct(q.models[0].r2,1)],
      [t('3 阶矩','3-moment'),q.models[1].lambda[0].toFixed(4),q.models[1].lambda[1].toFixed(4),'—',K.pct(q.models[1].r2,1)],
      [t('4 阶矩','4-moment'),m4.lambda[0].toFixed(4),m4.lambda[1].toFixed(4),m4.lambda[2].toFixed(4),K.pct(m4.r2,1)]])+
      `<p class="chart-note">${K.esc(t('括号内为 t 值：','t-statistics in brackets: '))}${m4.t.map(v=>v.toFixed(2)).join(', ')}${K.esc(t('；真值溢价系数 gamma3=','; true premium gamma3='))}${p.gamma3}${K.esc(t('、gamma4=','; gamma4='))}${p.gamma4}${K.esc(t('。横截面只有几十个资产，R² 随因子增加必然上升，需结合调整 R² 与系数显著性判断。','. With only a few dozen assets R² must rise as factors are added; judge with adjusted R² and coefficient significance.'))}</p>`);
    $('#validation').textContent='';
    state.built=M().build('hm',p,q,K.lang());
    renderCode();
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,mode,onBuilt}){
  controls();
  const host=$('#capmAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.CAPMAdvView={render,state};
})();

;

/* Source: capm-workbench.js */
/* Scoped experiment09 workbench; the frozen 08/11 engines are untouched. */
(()=>{'use strict';const M=CAPMMath,C=CAPMCode,H=CAPMTeaching,$=s=>document.querySelector(s),esc=s=>WorkbenchUI.esc(String(s)),pct=v=>(v*100).toFixed(2)+'%',num=v=>v===null?'—':Math.abs(v)>0&&Math.abs(v)<.0001?v.toExponential(3):v.toFixed(5);
function mount(){
CourseExperiments.mount('capm');document.body.classList.add('capm-workbench');let p={...M.defaults},rows=M.synthetic(),meta={source:'固定60个月确定性合成样本（非真实行情）',frequency:'monthly',synthetic:true},mode='full',view='sml',comparison='cml',selected='sml',codeFocus=null,built,valid=true,importValid=true,notices=[],revision=0;
const bar=document.createElement('div');bar.id='capmViews';bar.innerHTML='<button data-capm-view="sml" aria-pressed="true">理论定价 · SML</button><button data-capm-view="cml">CML与SML</button><button data-capm-view="scl">实证检验</button><button data-capm-view="hm">04 高阶矩 CAPM</button>';$('.model-panel .panel-head').after(bar);
$('#inputs').innerHTML=Object.entries(M.defaults).map(([k,v])=>`<label id="field-${k}"><span>${{rf:'无风险收益率（年）',rm:'市场预期收益率（年）',beta:'当前理论Beta（无单位）',sm:'市场标准差 σm（年）',w:'市场组合权重 w · 0至3'}[k]}</span><input type="number" id="input-${k}" step="any" value="${v}"></label>`).join('');
const data=document.createElement('section');data.id='capmData';data.innerHTML=`<h3>样本与数据口径</h3><p>回归逐行扣除样本自带的同期rf，不使用年度理论利率。</p><p>仅在浏览器本地处理，不上传服务器。先选尺度和频率，再选CSV。</p><label>输入收益尺度<select id="capmScale"><option value="decimal">小数：0.01 = 1%</option><option value="percent">百分数：1 = 1%</option></select></label><label>每行收益频率<select id="capmFrequency"><option value="monthly">月度</option><option value="daily">日度</option><option value="weekly">周度</option><option value="annual">年度</option></select></label><label>来源/资产/市场代理说明<input id="capmSource" maxlength="200" placeholder="例如：自行导出，股票A与指数B"></label><label>选择配对收益率CSV<input type="file" id="capmFile" accept=".csv,text/csv"></label><button id="capmTemplate">下载CSV模板</button><button id="capmExport">导出当前样本CSV</button><button id="capmSynthetic">恢复合成样本</button><p id="capmDataStatus" role="status"></p><details><summary>CSV格式与清洗规则</summary><p>列名及顺序：date,ri,rm,rf。日期为YYYY-MM-DD。三列均为同一日期区间、同频率的简单总收益，rf必须逐行提供。支持引号和UTF-8 BOM。拒绝缺失、重复日期、非法日期、非有限值及低于−100%的简单收益；整行排序，不删异常、不填补缺期。</p><p>不接受价格或对数收益。请先在外部复权、按共同起止日期计算并配对；系统无法从日期标签识别隐含的错位区间。rf若来自年利率，应先核实报价约定，再换成单期收益，例如有效年利率按(1+r)^(1/k)−1换算。股票与市场不可错移一期，不用未来信息填缺失；记录样本筛选、幸存者偏差和市场代理限制。</p><p>实证结果保留每期口径，不自动年化α、t/p或R²。均值×k和标准差×√k只是独立同分布下的算术近似；复合年收益须用实际路径计算。日度节假日间隔不自动判错，须自行核对交易日与收益区间。</p></details>`;
const weight=document.createElement('p');weight.id='capmWeightNote';$('#inputs').append(weight);const inputNote=document.createElement('p');inputNote.id='capmInputNote';inputNote.textContent='输入年度有效简单收益率的小数：0.03=3%。';$('#inputs').after(inputNote);inputNote.after(data);$('.learning').hidden=true;$('#assumptionSummary').innerHTML='<span>同尺度理论</span><span>单主题图表</span><span>含截距OLS</span>';
$('#assumptions').textContent='SML对单个资产/组合的系统风险β定价；均值方差投资者、同质预期、无摩擦等均衡假设。CML仅为无风险资产与作为切点的市场组合所张成的有效配置，σm>0、同利率自由借贷；w>1为借贷杠杆。本页w限定0至3，不展示负权重分支。市场溢价非正时仅展示代数配置线，不宣称该市场组合为有效切点。SCL使用样本单资产与市场的同频超额收益时间序列。默认数据合成而非真实行情，推断仅演示。';
$('#assumptionDetails').ontoggle=()=>{};
const empiricalControls=document.createElement('div');empiricalControls.id='capmEmpControls';empiricalControls.className='capm-subviews';$('#chartHost').before(empiricalControls);
$('#details').innerHTML='<p id="capmInsight" aria-live="polite"></p><p id="capmLimit"></p><div id="capmTests"></div>';
const compare=document.createElement('div');compare.id='capmCompare';compare.innerHTML='<button data-compare="cml" aria-pressed="true">CML视图</button><button data-compare="sml">查看SML对比</button><button data-compare="difference">两者区别</button>';bar.after(compare);
$('#chartHost').className='capm-chart';$('#chartHost').innerHTML='<h3 id="capmChartTitle"></h3><div id="capmPlot"></div><div id="capmDifference" hidden></div><div id="capmTip" class="chart-tooltip" hidden></div>';
$('#legend').innerHTML='';const ctrl=ChartInteraction.create((key,state)=>{const tip=$('#capmTip');tip.hidden=!key;tip.dataset.state=state;if(key){tip.innerHTML='<button id="capmCloseTip" aria-label="关闭详情">×</button>'+esc(key);$('#capmCloseTip').onclick=()=>ctrl.clear();}});
$('#capmPlot').onclick=e=>{if(!e.target.closest('[data-cpoint]'))ctrl.clear();};
const download=(name,text)=>{const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const csv=rr=>'date,ri,rm,rf\n'+rr.map(r=>[r.date,r.ri,r.rm,r.rf].join(',')).join('\n')+'\n';
function info(title,body){$('#infoTitle').textContent=title;$('#infoBody').textContent=body;ModalUI.open($('#infoDialog'));}
function status(){const f=H.period(meta.frequency).short;$('#capmDataStatus').textContent=`当前：${meta.synthetic?'合成教学数据':'用户导入数据'} · ${meta.source}；${rows.length}行，${rows[0].date}至${rows.at(-1).date}；每${f}简单收益，小数存储。`+(notices.length?' '+notices.join(' '):'')+(rows.length<30?' 小样本：低于30行，推断不稳定。':'');}
function chartView(){return view==='cml'&&comparison==='sml'?'sml':view;}
function redraw(){ctrl.clear();const q=built.q,t=built.t,theme=chartView(),emp=['scl','residual'].includes(view),period=H.period(meta.frequency),difference=view==='cml'&&comparison==='difference';
$('#graphKind').textContent=emp?period.label+'样本 · 同期rf':theme==='sml'?'年度理论定价':'年度有效资本配置';
$('#metrics').hidden=difference;
$('#metrics').innerHTML=theme==='sml'?`<div><span>理论必要收益率（年）</span><b>${pct(t.expected)}</b></div><div><span>当前理论Beta（无单位）</span><b>${p.beta.toFixed(3)}</b></div>`:theme==='cml'?`<div><span>组合预期收益率（年）</span><b>${pct(t.return)}</b></div><div><span>组合总风险σ（年标准差）</span><b>${pct(t.sigma)}</b></div>`:`<div><span>样本Beta（无单位）</span><b>${q.b.toFixed(4)}</b></div><div><span>样本Alpha（${period.label}）</span><b>${pct(q.a)}</b></div><div><span>样本R²</span><b>${(q.r2*100).toFixed(2)}%</b></div>`;
document.body.classList.toggle('capm-empirical',emp);const e=H.empirical(q,meta.frequency);
$('#capmInsight').textContent=emp?e.summary:theme==='sml'?H.theoretical(p,t):H.allocation(p.w);
$('#capmLimit').textContent=emp?e.limit+(meta.synthetic?' 合成教学数据的p值仅演示计算。':''):view==='cml'?'SML按照系统性风险Beta讨论资产的均衡预期收益；CML按照总风险讨论市场组合与无风险资产构成的有效配置。':'';
$('#capmTests').innerHTML=emp?`<p id="capmR2Note">${e.r2}</p><p id="capmPeriodNote">当前样本：${period.label}简单收益；Alpha是${period.label}截距，不是年度CAPM必要收益率。</p>${view==='residual'?'<p id="capmResidualHelp">残差是实际资产超额收益与回归拟合值之间的差距，帮助观察模型未解释的波动及异常模式；残差看似随机不证明CAPM成立。</p>':''}<details id="capmStats"><summary>完整统计结果与推断假设 · n=${q.n}，df=${q.df}</summary><table><thead><tr><th>系数</th><th>估计</th><th>标准误</th><th>t</th><th>双侧p</th></tr></thead><tbody>${[['Alpha',q.a,q.seA,q.tA,q.pA],['Beta',q.b,q.seB,q.tB,q.pB]].map(r=>'<tr>'+r.map((v,i)=>i===0?'<th>'+v+'</th>':'<td>'+num(v)+'</td>').join('')+'</tr>').join('')}</tbody></table><p>Alpha与其标准误为${period.label}小数收益；Beta及其标准误无单位。n=${q.n}，df=${q.df}，R²=${q.r2.toFixed(5)}；Beta=cov(x,y)/var(x)=${q.b.toFixed(6)}。${q.n<30?'小样本，谨慎推断。':''}</p><p>${esc(meta.synthetic?'合成教学数据':'用户导入数据')}：${esc(meta.source)}；${period.label}简单收益。经典OLS标准误假定条件均值正确、独立同方差；精确有限样本t检验另需误差正态。异方差/序列相关时可在R中用sandwich::NeweyWest与lmtest::coeftest复核（需额外包，完整脚本附注释示例）。</p><p>Alpha检验H₀：Alpha=0；Beta检验H₀：Beta=0。Beta显著只说明斜率偏离0，不检验整个CAPM；市场代理、样本选择与非同步交易影响结论。Beta接近0的文字以|估计值|小于0.05作描述性阈值，并不等于统计不显著。</p></details>`:theme==='sml'?`<details id="capmBetaComparison"><summary>查看理论与样本Beta差异</summary><p>理论Beta=${p.beta.toFixed(3)}，由当前输入设定；样本Beta=${q.b.toFixed(6)}，由${period.label}样本OLS估计。两者独立；改理论Beta不会改样本，上传CSV不会自动改理论Beta。</p></details>`:`<p class="capm-definition">${t.premium<=0?'当前溢价非正：这里只显示资本配置线的代数关系，不宣称市场组合为有效切点。':'在市场组合为有效切点、同利率自由借贷等假设下，该资本配置线成为CML。'} 个股收益−总波动率点不能据此称为有效组合。</p>`;
empiricalControls.hidden=!emp;empiricalControls.innerHTML=`<button data-emp="scl" aria-pressed="${view==='scl'}">SCL拟合线</button><button data-emp="residual" aria-pressed="${view==='residual'}">残差诊断</button>`;
empiricalControls.onclick=e=>{const b=e.target.closest('[data-emp]');if(b){view=b.dataset.emp;selected=view==='residual'?'plot':'scl';codeFocus=null;render();}};
$('#capmWeightNote').textContent=H.allocation(p.w);
$('#capmDifference').hidden=!difference;$('#capmPlot').hidden=difference;$('#legend').hidden=difference;$('#chartHost').classList.toggle('capm-difference-mode',difference);
$('#capmDifference').innerHTML=difference?'<table><thead><tr><th>维度</th><th>SML</th><th>CML</th></tr></thead><tbody><tr><th>横轴</th><td>系统性风险β</td><td>总风险σ</td></tr><tr><th>纵轴</th><td>均衡要求的预期收益率</td><td>有效资本配置的预期收益率</td></tr><tr><th>对象</th><td>单个资产及投资组合</td><td>无风险资产与有效市场组合的配置</td></tr><tr><th>主要问题</th><td>系统性风险如何得到补偿</td><td>总风险与预期收益如何配置</td></tr></tbody></table><p>不同风险横轴，分别查看，不叠加在同一坐标系。此对照模式复制的R脚本保留CML图及全部SML/回归计算。</p>':'';
let pts,line,xlabel,ylabel,title;
if(theme==='sml'){const lo=Math.min(-2,p.beta),hi=Math.max(3,p.beta);line=[[lo,p.rf+lo*t.premium],[hi,p.rf+hi*t.premium]];pts=[[p.beta,t.expected,`理论β ${p.beta}；年度必要收益 ${pct(t.expected)}`]];xlabel='系统风险 β（无单位）';ylabel='理论必要收益率（%／年）';title='证券市场线 SML · 理论定价';}
else if(theme==='cml'){const hi=Math.max(2*p.sm,t.sigma);line=[[0,p.rf],[hi,p.rf+t.premium*hi/p.sm]];pts=[[p.sm,p.rm,'市场组合：年度标准差 '+pct(p.sm)+'；预期收益 '+pct(p.rm)],[t.sigma,t.return,'当前配置：w='+p.w+'；年度预期收益 '+pct(t.return)]];xlabel='总风险σ（年标准差，%）';ylabel='期望收益（%／年）';title=t.premium>0?'资本市场线 CML · 假设下的有效配置':'资本配置线 · 当前不宣称有效CML';}
else if(theme==='scl'){const lo=Math.min(...q.x),hi=Math.max(...q.x);line=[[lo,q.a+q.b*lo],[hi,q.a+q.b*hi]];pts=q.x.map((x,i)=>[x,q.y[i],`${rows[i].date}（${period.label}）：市场超额 ${pct(x)}；资产超额 ${pct(q.y[i])}`]);xlabel=`市场超额收益（%／${period.short}）`;ylabel=`样本资产超额收益（%／${period.short}）`;title='证券特征线 SCL · 样本含截距OLS';}
else{const lo=Math.min(...q.fitted),hi=Math.max(...q.fitted);line=[[lo,0],[hi,0]];pts=q.fitted.map((x,i)=>[x,q.residual[i],`${rows[i].date}（${period.label}）：拟合值 ${pct(x)}；残差 ${pct(q.residual[i])}`]);xlabel=`拟合超额收益（%／${period.short}）`;ylabel=`残差（%／${period.short}）`;title='残差 vs 拟合值 · 诊断而非证明';}
$('#capmChartTitle').textContent=difference?'SML与CML · 两者区别':title;let all=[...line,...pts],xmin=Math.min(...all.map(v=>v[0])),xmax=Math.max(...all.map(v=>v[0])),ymin=Math.min(...all.map(v=>v[1])),ymax=Math.max(...all.map(v=>v[1]));const dx=(xmax-xmin)||.01,dy=(ymax-ymin)||.01;xmin=theme==='cml'?0:xmin-dx*.08;xmax+=dx*.08;ymin-=dy*.15;ymax+=dy*.15;const sx=x=>82+(x-xmin)/(xmax-xmin)*486,sy=y=>315-(y-ymin)/(ymax-ymin)*285,fx=x=>theme==='sml'?x.toFixed(1):(x*100).toFixed(1),fy=y=>(y*100).toFixed(1);let grid='';for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;grid+=`<path d="M${sx(x)},30V315 M82,${sy(y)}H568" stroke="#e0e7eb" fill="none"/><text x="${sx(x)}" y="335" text-anchor="middle">${fx(x)}</text><text x="77" y="${sy(y)+4}" text-anchor="end">${fy(y)}</text>`;}
$('#capmPlot').innerHTML=`<svg viewBox="0 0 600 385" role="img" aria-label="${esc(title)}">${grid}<text x="325" y="370" text-anchor="middle">${xlabel}</text><text transform="translate(20 190) rotate(-90)" text-anchor="middle">${ylabel}</text><path d="M${line.map(v=>sx(v[0])+','+sy(v[1])).join('L')}" stroke="#6689a8" stroke-width="2.5" fill="none"/>${pts.map((v,i)=>`<circle data-cpoint="${i}" cx="${sx(v[0])}" cy="${sy(v[1])}" r="${theme==='cml'&&i===0?7:pts.length>1000?2:5}" fill="${theme==='cml'&&i===0?'none':'#659b8a'}" stroke="#659b8a" stroke-width="${theme==='cml'&&i===0?2:0}" tabindex="0" role="button" aria-label="${esc(v[2])}"/>`).join('')}</svg>`;
$('#capmPlot').querySelectorAll('[data-cpoint]').forEach(el=>ctrl.bind(el,pts[+el.dataset.cpoint][2]));
$('#legend').textContent=theme==='sml'?'蓝线：理论SML　绿点：当前理论资产':theme==='cml'?'蓝线：资本配置关系　绿点：市场组合 / 当前配置':theme==='scl'?'蓝线：OLS拟合线　绿点：配对时期样本':'蓝线：零残差基准　绿点：样本残差';
}
function displayGuard(values){if(Object.values(values).some(v=>Math.abs(v)>1e6))throw Error('参数超出教学图表的数值范围（绝对值须≤1e6），请核对单位。');}
function render(){
 if(view==='hm'){
  if(!window.CAPMAdvView)throw Error('高阶矩视图未加载。');
  const out=window.CAPMAdvView.render({p,mode,onBuilt:c=>{built={blocks:c.blocks,code:c.code};}});
  bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.capmView==='hm')));
  const ct=$('#capmChartTitle');if(ct)ct.hidden=true;
  const cn=$('#capmCodeNav');if(cn)cn.hidden=true;
  $('#graphKind').textContent=window.LabKit.t('高阶矩 · 横截面','Higher moments · cross-section');
  $('#assumptionSummary').innerHTML=[['合成月度样本','Synthetic monthly sample'],['三/四阶矩','Third/fourth moments'],['横截面回归','Cross-sectional regression']].map(x=>'<span>'+window.LabKit.t(x[0],x[1])+'</span>').join('');
  if(!out)return;
  return;
 }
 for(const el of $('#inputs').children)el.hidden=(el.id==='capmAdvControls');
 const advPlot=$('#capmAdvPlot');if(advPlot)advPlot.hidden=true;
 if(!$('#capmInsight'))$('#details').innerHTML='<p id="capmInsight" aria-live="polite"></p><p id="capmLimit"></p><div id="capmTests"></div>';
 const ct2=$('#capmChartTitle');if(ct2)ct2.hidden=false;
 const cn2=$('#capmCodeNav');if(cn2)cn2.hidden=false;
 const nativePlot=$('#capmPlot');if(nativePlot)nativePlot.hidden=false;
 try{const raw=Object.fromEntries(Object.keys(M.defaults).map(k=>[k,$('#input-'+k).value.trim()===''?NaN:Number($('#input-'+k).value)]));M.theory(raw);displayGuard(raw);p=raw;built=C.build(p,rows,meta,chartView(),mode);valid=true;$('#validation').textContent='';}catch(e){valid=false;$('#validation').textContent=e.message;$('#copy').disabled=true;return;}$('#copy').disabled=!importValid;const scroll=$('#code').scrollTop;let n=0;$('#code').innerHTML=built.blocks.map(b=>`<div class="logic-block" data-logic="${b.key}">${b.lines.map((l,bi)=>`<button class="code-line ${selected===b.key&&(!codeFocus||codeFocus.line===bi)?'selected':''}" data-semantic="${b.key}" data-block-line="${bi}"><span class="num">${++n}</span><code>${WorkbenchUI.colorCode(l)}</code></button>`).join('')}</div>`).join('');$('#code').scrollTop=scroll;const b=built.blocks.find(b=>b.key===selected)||built.blocks[0];$('#explanation').innerHTML='<h3>'+esc(codeFocus?.title||b.title)+'</h3><p>'+esc(codeFocus?.explain||b.explain)+'</p>';renderNav();$('#codeNotice').textContent=mode==='full'?'当前参数＋完整样本内嵌':'可独立运行；复制仍含完整绘图';document.querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===mode)));bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.capmView===view||(b.dataset.capmView==='scl'&&view==='residual'))));compare.hidden=view!=='cml';compare.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compare===comparison)));const emp=['scl','residual'].includes(view);$('#inputs').hidden=emp;$('#capmInputNote').hidden=emp;$('#field-sm').hidden=$('#field-w').hidden=$('#capmWeightNote').hidden=view!=='cml'||comparison!=='cml';data.hidden=!emp;status();redraw();}
const nav=document.createElement('nav');nav.id='capmCodeNav';nav.setAttribute('aria-label','R代码段落导航');$('.code-toolbar').after(nav);
function navEntries(){const entries=built.blocks.map(b=>({key:b.key,block:b.key,title:b.navLabel||b.title,line:Math.max(0,b.lines.findIndex(l=>b.key==='scl'?l.includes('fit <- lm'):b.key==='inference'?l.includes('print(s$coefficients)'):false)),explain:b.key==='scl'?'用资产超额收益对市场超额收益进行线性回归，估计样本Beta和Alpha；Beta=cov(x,y)/var(x)。':b.explain}));const plot=built.blocks.find(b=>b.key==='plot');if(plot){const line=plot.lines.findIndex(l=>l.includes('residual=residuals(fit)'));if(line>=0)entries.push({key:'residual-code',block:'plot',title:'残差诊断',line,explain:'residuals(fit)提取实际资产超额收益与拟合值之差。残差用于发现未解释的波动和异常模式，不能证明CAPM成立。'});}return entries;}
function renderNav(){nav.innerHTML=navEntries().map(n=>`<button data-code-jump="${n.key}" aria-pressed="${codeFocus?.key===n.key}">${esc(n.title)}</button>`).join('');}
function scrollCode(block,line){const el=$(`#code [data-semantic="${block}"][data-block-line="${line}"]`);if(el){const code=$('#code');code.scrollTop+=el.getBoundingClientRect().top-code.getBoundingClientRect().top-8;}}
nav.onclick=e=>{const button=e.target.closest('[data-code-jump]');if(!button)return;const n=navEntries().find(n=>n.key===button.dataset.codeJump);if(n){selected=n.block;codeFocus=n;render();scrollCode(n.block,n.line);}};
compare.onclick=e=>{const b=e.target.closest('[data-compare]');if(b){comparison=b.dataset.compare;selected=comparison==='sml'?'sml':'cml';codeFocus=null;render();scrollCode(selected,0);}};
$('#inputs').oninput=()=>{const next=Object.fromEntries(Object.keys(M.defaults).map(k=>[k,$('#input-'+k).value.trim()===''?NaN:Number($('#input-'+k).value)]));try{M.theory(next);displayGuard(next);p=next;render();}catch(e){valid=false;ctrl.clear();$('#validation').textContent=e.message+' 请修正；上次图表仅供参考。';$('#copy').disabled=true;}};
bar.onclick=e=>{const b=e.target.closest('[data-capm-view]');if(b){view=b.dataset.capmView;selected=view;codeFocus=null;render();if(view!=='hm')scrollCode(selected,0);}};
$('#code').onclick=e=>{const b=e.target.closest('[data-semantic]');if(b){selected=b.dataset.semantic;codeFocus=null;render();}};
document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.codeMode;codeFocus=null;selected='parameters';render();});
$('#copy').onclick=async()=>{if(!valid||!importValid)return;const text=C.build(p,rows,meta,chartView(),'full').code;try{await navigator.clipboard.writeText(text);$('#codeNotice').textContent='已复制：含当前参数、全部样本与当前图';}catch{download('capm-full.R',text);}};
$('#capmTemplate').onclick=()=>download('capm-synthetic-template.csv',csv(M.synthetic()));$('#capmExport').onclick=()=>download('capm-current-decimal.csv',csv(rows));
$('#capmSynthetic').onclick=()=>{revision++;rows=M.synthetic();meta={source:'固定60个月确定性合成样本（非真实行情）',frequency:'monthly',synthetic:true};notices=[];importValid=true;$('#capmScale').value='decimal';$('#capmFrequency').value='monthly';$('#capmSource').value='';$('#capmFile').value='';render();};
for(const id of ['#capmScale','#capmFrequency'])$(id).onchange=()=>{revision++;$('#capmFile').value='';if(!meta.synthetic){importValid=false;notices=['导入口径已改变，请重新选择文件。当前仍保留上次样本，复制已暂停。'];render();}};
$('#capmFile').onchange=async()=>{const file=$('#capmFile').files[0];if(!file)return;const rev=++revision,options={scale:$('#capmScale').value,frequency:$('#capmFrequency').value},source=$('#capmSource').value.trim()||'用户本地CSV（来源未经核实）';importValid=false;$('#copy').disabled=true;try{if(file.size>2000000)throw Error('CSV超过2MB限制。');const parsed=M.parseCSV(await file.text(),options);if(rev!==revision)return;rows=parsed.rows;meta={source:'用户CSV：'+source,frequency:options.frequency,synthetic:false};notices=parsed.warnings;importValid=true;render();}catch(e){if(rev!==revision)return;notices=['导入失败：'+e.message+' 当前仍为上次样本，复制暂停；可修正重导或恢复合成。'];render();}};
$('#reset').onclick=()=>{p={...M.defaults};for(const k in p)$('#input-'+k).value=p[k];selected=view;codeFocus=null;render();};
for(const id of ['#catalog','#catalogMobile'])$(id).onclick=()=>ModalUI.open($('#catalogDialog'));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>info('实验09 · 直接开始','三种视图随时切换，无预测解锁。SML先改rf、市场预期收益和β；CML调σm和市场权重；实证版选合成或本地CSV，看SCL与残差。点击R语句查看金融含义。复制完整脚本到新R会话整段执行，仅需基础R。网页本身不运行R。');$('#teacher').onclick=()=>info('教师提示','让学生对比三种风险轴和金融对象，再改变市场溢价的正负，观察β的作用。用同一份配对数据估计α/β，比较理论输入β和样本β̂。最后讨论α检验为何不能证明完整CAPM。未开展学生试用，不宣称95分。');
const practice=document.createElement('button');practice.id='rStudioPractice';practice.textContent='RStudio 实践';$('.code-toolbar').append(practice);practice.onclick=()=>info('在RStudio复现当前实验','新建R Script，复制完整R代码，全选运行。脚本内嵌当前CSV/合成数据，含同年度SML/CML、lm(y~x)、系数标准误/t/p/R²及当前主题图。网页百分比显示=R小数×100。先核对β̂，再核对α̂、标准误和p值；数据来源由使用者负责。');
$('#projector').onclick=()=>{const on=!document.body.classList.contains('projector');document.body.classList.toggle('projector',on);$('#projector').setAttribute('aria-pressed',String(on));};
let share=62;const resize=v=>{share=Math.max(40,Math.min(75,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',(100-share)+'fr');$('#splitter').setAttribute('aria-valuenow',share);};$('#splitter').onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();resize(e.key==='Home'?40:e.key==='End'?75:share+(e.key==='ArrowDown'?2:-2));}};$('#splitter').onpointerdown=e=>{const el=e.currentTarget;el.setPointerCapture(e.pointerId);const y=e.clientY,start=share,h=$('.code-regions').clientHeight;el.onpointermove=e=>resize(start+100*(e.clientY-y)/h);el.onpointerup=()=>el.onpointermove=null;};
if(window.LabKit)window.LabKit.onLang(()=>{if(view==='hm')render();});
render();
}
window.CAPMWorkbench={mount};})();

;

/* Source: risk-math.js */
/* Round1: preserve type=1 empirical quantiles and fractional tail mass. No backtest. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.RiskMath=api;})(this,M=>{
const defaults={n:250,alpha:.95,N:1000000,mu:.0004,scale:.01,lambda:.94,window:30};
function settings(p){const ranges={n:[50,2000],alpha:[.9,.999],N:[1,1e9],mu:[-.02,.02],scale:[0,.05]};for(const[k,[lo,hi]]of Object.entries(ranges))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(`${k}须在[${lo}, ${hi}]内。`);if(!Number.isInteger(p.n))throw Error('样本量n须为整数。');if(!Number.isFinite(p.lambda)||p.lambda<=0||p.lambda>=1)throw Error('衰减系数λ须满足0<λ<1。');if(!Number.isInteger(p.window)||p.window<2||p.window>=p.n)throw Error('初始化窗口须为2至n−1的整数，至少留出1个预测日。');return p;}
function generate(p){settings(p);return Array.from({length:p.n},(_,j)=>{const i=j+1;return p.mu+p.scale*((((i*73)%251)-125)/72-(i%37===0?4:0));});}
function validateReturns(R){if(!Array.isArray(R)||R.length<2)throw Error('至少需要2个收益率样本。');if(R.some(r=>!Number.isFinite(r)||r< -1||Math.abs(r)>1e6))throw Error('收益率须为有限简单收益，不能低于−100%或超出计算范围。');}
function risk(R,alpha,N){validateReturns(R);if(!Number.isFinite(alpha)||alpha<=0||alpha>=1)throw Error('置信水平须在0和1之间。');if(!Number.isFinite(N)||N<=0||N>1e12)throw Error('本金须为正数且不超过1e12元。');const L=R.map(r=>-N*r),x=[...L].sort((a,b)=>a-b),n=x.length,weights=x.map((_,j)=>Math.max(0,Math.min((j+1)/n-alpha,1/n))),m=M.mean(L),s=M.sd(L),z=M.qnorm(alpha);return{returns:R.slice(),L,sorted:x,weights,hVaR:x[Math.ceil(n*alpha)-1],hES:x.reduce((v,r,i)=>v+r*weights[i],0)/(1-alpha),nVaR:m+s*z,nES:m+s*M.phi(z)/(1-alpha),m,s,z,meanReturn:M.mean(R),sdReturn:M.sd(R),tailCount:n*(1-alpha)};}
function ewma(R,alpha,N,lambda,k){const base=risk(R,alpha,N);if(!Number.isFinite(lambda)||lambda<=0||lambda>=1)throw Error('λ须满足0<λ<1。');if(!Number.isInteger(k)||k<2||k>=R.length)throw Error('初始化窗口须至少2日，且小于样本量。');const train=R.slice(0,k),mu=M.mean(train),initial=M.sd(train)**2,h=Array(R.length+1).fill(null),sigma=h.slice(),VaR=h.slice(),ES=h.slice();h[k]=initial;for(let i=k;i<=R.length;i++){sigma[i]=Math.sqrt(h[i]);VaR[i]=N*(-mu+sigma[i]*base.z);ES[i]=N*(-mu+sigma[i]*M.phi(base.z)/(1-alpha));if(i<R.length)h[i+1]=lambda*h[i]+(1-lambda)*(R[i]-mu)**2;}
if([...h,...sigma,...VaR,...ES].some(v=>v!==null&&!Number.isFinite(v)))throw Error('EWMA数值超出计算范围。');const index=R.reduce((best,r,i)=>i>=k&&Math.abs(r-mu)>Math.abs(R[best]-mu)?i:best,k);return{R:R.slice(),L:base.L,mu,initial,h,sigma,VaR,ES,k,lambda,n:R.length,latest:{day:R.length+1,variance:h.at(-1),sigma:sigma.at(-1),VaR:VaR.at(-1),ES:ES.at(-1)},shock:{index,day:index+1,return:R[index],before:h[index],after:h[index+1],oldWeight:lambda*h[index],newWeight:(1-lambda)*(R[index]-mu)**2}};}
return{defaults,settings,generate,risk,ewma};});

;

/* Source: risk-code.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-math'):root.RiskMath);if(typeof module==='object')module.exports=api;else root.RiskCode=api;})(this,M=>{
function build(p,view='basic',method='historical',chart='var',mode='full',provided){const R=provided||M.generate(p),q=M.risk(R,p.alpha,p.N),e=M.ewma(R,p.alpha,p.N,p.lambda,p.window),blocks=[];function add(key,title,code,explain,formula=''){blocks.push({key,title,lines:code.split('\n'),explain,formula});}
add('data','数据与当前参数',`# ${provided?'用户导入数据，当前简单收益已内嵌':'合成教学数据，非真实市场'}；单期简单收益，小数\nalpha <- ${p.alpha}\nN <- ${p.N}\nn <- ${R.length}\n${provided?'R <- c('+R.join(',\n  ')+')':`mu_gen <- ${p.mu}\nscale_gen <- ${p.scale}\ni <- seq_len(n)\nR <- mu_gen + scale_gen * (((i*73) %% 251 - 125)/72 -\n  ifelse(i %% 37 == 0, 4, 0))`}\nstopifnot(n>=2, all(is.finite(R)), all(R>=-1),\n  is.finite(alpha), alpha>0, alpha<1, is.finite(N), N>0)`, '生成参数仅控制同一固定样本；正态法使用样本估计值，EWMA仅用初始化窗口估计固定均值。');
add('loss','收益转为损失',`L <- -N * R\nx <- sort(L)`, '正损失表示亏损，负损失表示盈利。本金只改金额，不改原收益率。',String.raw`L_t=-V_0 R_t`);
if(view==='basic'){
add('historical','历史法：分位阈值与尾部平均',`hVaR <- unname(quantile(L,alpha,type=1))\nj <- seq_len(n)\ntail_mass <- pmax(0,pmin(j/n-alpha,1/n))\nhES <- sum(x*tail_mass)/(1-alpha)`, 'VaR为第ceiling(nα)个损失；ES按分位区间交集精确加权最坏1−α的概率，不随意取整或重复纳入门槛样本。',String.raw`ES_\alpha=\frac{1}{1-\alpha}\int_\alpha^1Q(u)\,du`);
add('normal','正态法：同一样本估计',`m <- mean(L)\ns <- sd(L)\nz <- qnorm(alpha)\nnVaR <- m+s*z\nnES <- m+s*dnorm(z)/(1-alpha)`, 's使用n−1分母的样本标准差，不是生成参数；σ=0时仍可计算退化点质量的VaR/ES，不把合法负值截为0。',String.raw`VaR^N=V_0(-\hat\mu+\hat\sigma z_\alpha),\quad ES^N=V_0[-\hat\mu+\hat\sigma\phi(z_\alpha)/(1-\alpha)]`);
add('output','输出四种风险结果',`print(c(hVaR=hVaR,hES=hES,nVaR=nVaR,nES=nES))`, 'VaR是损失阈值，不是最大可能损失；ES是尾部平均，不是另一个分位点。');
if(mode==='full')add('plot','损失分布图',`loss_wan <- L/10000\nspan <- range(c(loss_wan,hVaR/10000,hES/10000,nVaR/10000,nES/10000))\nif (diff(span)<1e-8*max(1,abs(span))) {\n  span <- mean(span)+c(-.5,.5)*max(1,abs(mean(span))*.05)\n}\nbreaks <- seq(span[1]-.08*diff(span),span[2]+.08*diff(span),length.out=26)\nhist(loss_wan,breaks=breaks,probability=TRUE,right=FALSE,\n  main="${provided?'User-imported':'Synthetic'} one-period loss",xlab="One-period loss (10,000 yuan)",\n  ylab="Density (per 10,000 yuan)")\nif(s>0) curve(dnorm(x,m/10000,s/10000),add=TRUE,col="thistle4")\n${method==='normal'?'values <- c(nVaR,nES)\ncols <- c("thistle4","thistle4")':method==='compare'?'values <- c(hVaR,hES,nVaR,nES)\ncols <- c("seagreen4","seagreen4","thistle4","thistle4")':'values <- c(hVaR,hES)\ncols <- c("seagreen4","seagreen4")'}\n# VaR: threshold line; ES: diamond denotes tail mean, not a quantile\nabline(v=values[seq(1,length(values),by=2)]/10000,col=cols[seq(1,length(values),by=2)])\npoints(values[seq(2,length(values),by=2)]/10000,\n  rep(0,length(values)/2),pch=18,col=cols[seq(2,length(values),by=2)])`, '万元轴的密度也按万元换算，面积保持1。ES用菱形标尾部均值，区别于VaR实线阈值。');
}else{
add('lambda','衰减系数与初始化',`lambda <- ${p.lambda}\nk <- ${p.window}\nstopifnot(is.finite(lambda),lambda>0,lambda<1,k>=2,k<n,k==floor(k))\nmu_train <- mean(R[seq_len(k)])\nh0 <- var(R[seq_len(k)])\nh <- rep(NA_real_,n+1)\nh[k+1] <- h0`, `前${p.window}日的样本均值固定为条件均值，样本方差作为第${p.window+1}日预测输入。当前λ=${p.lambda}，旧方差权重${(p.lambda*100).toFixed(1)}%，最近平方冲击权重${((1-p.lambda)*100).toFixed(1)}%。0.94是日度经典教学参数，不是普遍最优值。`,String.raw`h_{k+1|k}=s^2(R_1,\ldots,R_k)`);
add('ewma','EWMA逐期事前预测',`# R索引t即第t日；前k日无预测，先存h[t]再观察R[t]\nfor(t in seq.int(k+1,n)) {\n  epsilon_t <- R[t]-mu_train\n  h[t+1] <- lambda*h[t]+(1-lambda)*epsilon_t^2\n}\nsigma_pred <- sqrt(h)`, '第t日的h[t]只使用到t−1日；R[t]只进入h[t+1]。λ较小通常更重视近期平方冲击，不表示所有日期风险都更高。',String.raw`\sigma^2_{t+1|t}=\lambda\sigma^2_{t|t-1}+(1-\lambda)(R_t-\mu_{train})^2`);
add('var','一日预测VaR',`z <- qnorm(alpha)\nVaR <- N*(-mu_train+sigma_pred*z)`, '用同一个训练均值及事前预测波动率，结合条件正态假设得到损失阈值；不是当天已实现损失。',String.raw`VaR_{t|t-1}=V_0[-\mu_{train}+\sqrt{h_{t|t-1}}z_\alpha]`);
add('es','一日预测ES',`ES <- N*(-mu_train+sigma_pred*dnorm(z)/(1-alpha))`, '同一条件分布下最严重1−α尾部的平均损失；不是确定的逐日损失上界。',String.raw`ES_{t|t-1}=V_0[-\mu_{train}+\sqrt{h_{t|t-1}}\phi(z_\alpha)/(1-\alpha)]`);
add('output','输出逐期预测及最新结果',`result <- data.frame(day=seq_len(n+1),variance=h,\n  sigma=sigma_pred,VaR=VaR,ES=ES,actual_loss=c(L,NA_real_))\nprint(tail(result,6))\nprint(c(mu_train=mu_train,h0=h0,latest_VaR=tail(VaR,1),\n  latest_ES=tail(ES,1),latest_sigma=tail(sigma_pred,1)))`, `最新为第${R.length+1}日、使用截至第${R.length}日信息的一日预测，没有实际损失可与之提前比较。`);
if(mode==='full')add('plot','风险时间序列图',chart==='volatility'?`plot(seq_len(n+1),sigma_pred*100,type="l",col="steelblue",\n  xlab="Sample trading day",ylab="Forecast daily SD (%)",\n  main="EWMA: ex-ante daily volatility")\nabline(v=k+.5,lty=3)`: `pred <- ${chart==='es'?'ES':'VaR'}\nplot(seq_len(n),L/10000,type="l",col="grey60",\n  xlim=c(1,n+1),ylim=range(c(L,pred),na.rm=TRUE)/10000,\n  xlab="Sample trading day",ylab="One-period loss (10,000 yuan)",\n  main="EWMA: actual loss and ex-ante ${chart==='es'?'ES':'VaR'}")\nlines(seq_len(n+1),pred/10000,col="steelblue",lwd=2)\nabline(v=k+.5,lty=3)\nlegend("topleft",c("Actual loss","Ex-ante ${chart==='es'?'ES':'VaR'}"),\n  col=c("grey60","steelblue"),lty=1,bty="n")`, '前k日仅作初始化，图中不伪造预测；最后一个点是下一日预测。不是Kupiec检验或样本外回测。');
}
return{blocks,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,e};}
return{build};});

;

/* Source: risk-charts.js */
(()=>{'use strict';const esc=s=>WorkbenchUI.esc(String(s)),money=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:2}),pct=x=>(x*100).toFixed(3)+'%';
function render(host,{view,method,chart,q,e,p,zoom},interaction){const C={h:'#659b8a',n:'#9b88ac',dynamic:'#6689a8',actual:'#a4adb4'},markers=[],series=[];let xmin,xmax,ymin=0,ymax,body='',xlabel,ylabel,title,legend=[];
if(view==='basic'){
const values=[q.hVaR,q.hES,q.nVaR,q.nES].map(x=>x/10000);xmin=Math.min(...q.L.map(x=>x/10000),...values);xmax=Math.max(...q.L.map(x=>x/10000),...values);let range=xmax-xmin;if(range<1e-8*Math.max(1,Math.abs(xmin),Math.abs(xmax))){const center=(xmin+xmax)/2;range=Math.max(1,Math.abs(center)*.05);xmin=center-range/2;xmax=center+range/2;}xmin-=range*.08;xmax+=range*.08;const width=(xmax-xmin)/25,bins=Array.from({length:25},()=>({count:0,tail:0}));q.sorted.forEach((v,i)=>{const b=Math.min(24,Math.max(0,Math.floor((v/10000-xmin)/width)));bins[b].count++;bins[b].tail+=q.weights[i];});const density=bins.map(b=>b.count/q.L.length/width),sd=q.s/10000,mu=q.m/10000,pdf=Array.from({length:121},(_,j)=>{const x=xmin+(xmax-xmin)*j/120;return[x,sd>0?ExperimentMath.phi((x-mu)/sd)/sd:0];});ymax=Math.max(...density,...pdf.map(v=>v[1]),1e-6)*1.16;
series.push({kind:'hist',bins,width,density});if(method!=='historical'&&sd>0)series.push({points:pdf,color:C.n,name:'normal-density'});
for(const[key,label,v,color,es]of [['hVaR','历史VaR · 阈值',q.hVaR,C.h,false],['hES','历史ES · 尾部均值',q.hES,C.h,true],['nVaR','正态VaR · 阈值',q.nVaR,C.n,false],['nES','正态ES · 尾部均值',q.nES,C.n,true]]){const show=method==='compare'||(method==='historical'?key[0]==='h':key[0]==='n');const tip=`${label}：${money(v)}元；${es?'最严重尾部的平均损失，不是另一个分位数，也不是确定上界。':'置信水平'+pct(p.alpha)+'的单期损失分位阈值，不是最大可能损失。'}`;legend.push({key,label,color,tip});if(show)markers.push({key,label,x:v/10000,color,es,tip});}
xlabel='单期损失（万元；负值为盈利）';ylabel='概率密度（1／万元）';title=method==='normal'?'正态参数法 · 样本估计密度':method==='compare'?'同一样本 · 历史法与正态法比较':'历史模拟法 · 阈值与尾部平均';
}else{
xmin=zoom?Math.max(1,e.shock.day-8):1;xmax=zoom?Math.min(e.n+1,e.shock.day+9):e.n+1;const values=chart==='volatility'?e.sigma.map(v=>v===null?null:v*100):(chart==='es'?e.ES:e.VaR).map(v=>v===null?null:v/10000),pred=values.map((v,i)=>[i+1,v]).filter(v=>v[1]!==null&&v[0]>=xmin&&v[0]<=xmax),actual=e.L.map((v,i)=>[i+1,v/10000]).filter(v=>v[0]>=xmin&&v[0]<=xmax);const ys=[...pred.map(v=>v[1]),...(chart==='volatility'?[]:actual.map(v=>v[1]))];ymin=Math.min(0,...ys);ymax=Math.max(0,...ys);const r=ymax-ymin||1;ymin-=chart==='volatility'?0:r*.08;ymax+=r*.15;series.push({points:pred,color:C.dynamic,name:'forecast'});if(chart!=='volatility')series.unshift({points:actual,color:C.actual,name:'actual'});legend=[{label:chart==='volatility'?'事前预测单期标准差':'灰线：实际损失　蓝线：事前预测'+(chart==='es'?'ES':'VaR'),color:C.dynamic}];xlabel='合成样本交易日（最后一点为下一日预测）';ylabel=chart==='volatility'?'事前单期标准差（%）':'单期损失／预测风险（万元）';title=chart==='volatility'?'EWMA · 波动率不是已实现损失':'实际损失与事前EWMA '+(chart==='es'?'ES':'VaR');
}
const X=x=>82+(x-xmin)/(xmax-xmin)*486,Y=y=>315-(y-ymin)/(ymax-ymin)*277;let grid='';for(let j=0;j<5;j++){const x=xmin+(xmax-xmin)*j/4,y=ymin+(ymax-ymin)*j/4;grid+=`<path d="M${X(x)},38V315 M82,${Y(y)}H568" stroke="#e0e7eb" fill="none"/><text x="${X(x)}" y="336" text-anchor="middle">${view==='basic'?x.toFixed(2):Math.round(x)}</text><text x="75" y="${Y(y)+4}" text-anchor="end">${y.toPrecision(3)}</text>`;}
if(view==='dynamic'&&xmin<=e.k){body+=`<rect x="${X(xmin)}" y="38" width="${X(Math.min(e.k+.5,xmax))-X(xmin)}" height="277" fill="#e8edf1"/><text x="${X(xmin)+5}" y="55">初始化${e.k}日</text>`;}
if(view==='dynamic'&&zoom){body+=`<path d="M${X(e.shock.day)},38V315" stroke="#a98773" stroke-dasharray="4 4"/><text x="${X(e.shock.day)}" y="65" text-anchor="middle">第${e.shock.day}日冲击</text>`;}
if(view==='dynamic'&&xmax===e.n+1)body+=`<path d="M${X(e.n+.5)},38V315" stroke="#6689a8" stroke-dasharray="3 3"/><text x="565" y="31" text-anchor="end">末点：下一日预测，尚无实际损失</text>`;
const tips={};for(const s of series){if(s.kind==='hist'){s.bins.forEach((b,i)=>{const x=xmin+i*s.width;body+=`<rect x="${X(x)+.5}" y="${Y(s.density[i])}" width="${Math.max(0,X(x+s.width)-X(x)-1)}" height="${Y(0)-Y(s.density[i])}" fill="${method==='normal'?'#d7dfe3':'#b9d3c9'}"/>`;if(method!=='normal'&&b.tail>0)body+=`<rect x="${X(x)+.5}" y="${Y(b.tail/s.width)}" width="${Math.max(0,X(x+s.width)-X(x)-1)}" height="${Y(0)-Y(b.tail/s.width)}" fill="${C.h}"/>`;});}else body+=`<path data-risk-series="${s.name}" d="M${s.points.map(v=>X(v[0])+','+Y(v[1])).join('L')}" fill="none" stroke="${s.color}" stroke-width="${s.name==='actual'?1.2:2.5}"/>`;}
for(const m of markers){tips[m.key]=m.tip;const x=X(m.x);body+=`<g data-risk-tip="${m.key}" data-risk-marker="${m.key}" tabindex="0" role="button" aria-label="${esc(m.tip)}">${m.es?`<path d="M${x},${Y(0)-17}l7,7l-7,7l-7,-7Z" fill="${m.color}"/><rect x="${x-9}" y="${Y(0)-23}" width="18" height="26" fill="transparent"/>`:`<path d="M${x},38V315" stroke="${m.color}" stroke-width="2"/><path d="M${x},38V315" stroke="transparent" stroke-width="14"/>`}</g>`;}
if(view==='dynamic'){for(let i=Math.ceil(xmin)-1;i<Math.min(e.n+1,xmax);i++){const has=e.h[i]!==null,actual=i<e.n?money(e.L[i])+'元':'尚未发生',tip=`第${i+1}日：${has?'事前预测仅用截至第'+i+'日信息；VaR '+money(e.VaR[i])+'元；ES '+money(e.ES[i])+'元；单期标准差 '+pct(e.sigma[i]):'初始化阶段，没有风险预测'}。实际损失：${actual}。`,key='day-'+i;tips[key]=tip;const y=has?(chart==='volatility'?e.sigma[i]*100:(chart==='es'?e.ES[i]:e.VaR[i])/10000):chart==='volatility'?0:e.L[i]/10000;body+=`<circle data-risk-tip="${key}" data-risk-point="${i}" cx="${X(i+1)}" cy="${Y(y)}" r="5" fill="${has&&i===e.n?C.dynamic:'transparent'}" tabindex="0" role="button" aria-label="${esc(tip)}"/>`;}}
host.innerHTML=`<h3 id="riskChartTitle">${title}</h3><div class="risk-svg"><svg viewBox="0 0 600 385" role="img" aria-label="${esc(title)}">${grid}${body}<text x="325" y="374" text-anchor="middle">${xlabel}</text><text transform="translate(20 185) rotate(-90)" text-anchor="middle">${ylabel}</text></svg></div>`;host.querySelectorAll('[data-risk-tip]').forEach(el=>interaction.bind(el,tips[el.dataset.riskTip]));return legend;}
window.RiskCharts={render};})();

;

/* Source: risk-extended.js */
/* Experiment07: separate from experiment06. All predictions are stored before observing return t. */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-math'):root.RiskMath,typeof module==='object'?require('./experiment-math'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.RiskExtended=api;})(this,(M,F)=>{
const defaults={omega:.000002,a:.08,b:.90,threshold:.8,train:150};
function garch(R,alpha,N,omega,a,b,k,override){M.risk(R,alpha,N);if(![omega,a,b].every(Number.isFinite)||omega<=0||a<0||b<0||a+b>=1)throw Error('GARCH要求ω>0、a≥0、b≥0、a+b<1。');if(!Number.isInteger(k)||k<2||k>=R.length)throw Error('初始化窗口须为2至n−1。');const mu=F.mean(R.slice(0,k)),initial=override===undefined?F.sd(R.slice(0,k))**2:override,h=Array(R.length+1).fill(null),sigma=h.slice(),VaR=h.slice(),ES=h.slice(),z=F.qnorm(alpha);if(!Number.isFinite(initial)||initial<0)throw Error('初始方差须为非负有限数。');h[k]=initial;for(let i=k;i<=R.length;i++){sigma[i]=Math.sqrt(h[i]);VaR[i]=N*(-mu+sigma[i]*z);ES[i]=N*(-mu+sigma[i]*F.phi(z)/(1-alpha));if(i<R.length)h[i+1]=omega+a*(R[i]-mu)**2+b*h[i];}if([...h,...VaR,...ES].some(x=>x!==null&&!Number.isFinite(x)))throw Error('GARCH数值溢出。');return{h,sigma,VaR,ES,mu,initial,k,n:R.length,omega,a,b,longRun:omega/(1-a-b),latest:{variance:h.at(-1),sigma:sigma.at(-1),VaR:VaR.at(-1),ES:ES.at(-1)}};}
// Deterministic two-dimensional Nelder-Mead; identical algorithm supplied in Base R.
function minimize(fn,start){let v=[start.slice(),[start[0]+.12,start[1]],[start[0],start[1]+.18]].map(x=>({x,f:fn(x)}));for(let iter=0;iter<2000;iter++){v.sort((a,b)=>a.f-b.f);const spread=Math.max(...v.slice(1).map(q=>Math.max(...q.x.map((z,j)=>Math.abs(z-v[0].x[j])))));if(spread<1e-8&&Math.abs(v[2].f-v[0].f)<1e-9)return{...v[0],converged:Number.isFinite(v[0].f),iter};const c=v[0].x.map((z,j)=>(z+v[1].x[j])/2),point=(f)=>c.map((z,j)=>z+f*(c[j]-v[2].x[j])),r=point(1),fr=fn(r);if(fr<v[0].f){const e=point(2),fe=fn(e);v[2]=fe<fr?{x:e,f:fe}:{x:r,f:fr};}else if(fr<v[1].f)v[2]={x:r,f:fr};else{const outside=fr<v[2].f,cx=c.map((z,j)=>z+.5*((outside?r:v[2].x)[j]-z)),fc=fn(cx);if(fc<(outside?fr:v[2].f))v[2]={x:cx,f:fc};else for(let j=1;j<3;j++){v[j].x=v[j].x.map((z,k)=>(z+v[0].x[k])/2);v[j].f=fn(v[j].x);}}}return{...v.sort((a,b)=>a.f-b.f)[0],converged:false,iter:2000};}
function gpdRisk(u,pu,xi,b,alpha){if(![u,pu,xi,b,alpha].every(Number.isFinite)||b<=0||pu<=0||pu>1||alpha<=0||alpha>=1)throw Error('GPD参数非法。');if(1-alpha>=pu)throw Error('目标分位必须严格高于阈值：1−γ < 超阈值比例。');const lr=Math.log(pu/(1-alpha)),VaR=u+b*(Math.abs(xi)<1e-8?lr:Math.expm1(xi*lr)/xi),endpoint=xi<0?u-b/xi:null;if(!Number.isFinite(VaR)||(endpoint!==null&&VaR>endpoint))throw Error('目标分位超出有限支持集或数值范围。');const ES=xi>=1?null:VaR+(b+xi*(VaR-u))/(1-xi);if(ES!==null&&!Number.isFinite(ES))throw Error('ES数值超出范围。');return{VaR,ES,endpoint,esStatus:xi>=1?'ξ≥1：理论ES不有限':'有限'};}
function evt(R,alpha,N,threshold=.8){const q=M.risk(R,alpha,N);if(!Number.isFinite(threshold)||threshold<.5||threshold>=.99)throw Error('阈值分位须在[0.50,0.99)内；低阈值可能不适用尾部近似。');const u=q.sorted[Math.ceil(R.length*threshold)-1],Y=q.L.filter(x=>x>u).map(x=>x-u),nu=Y.length,pu=nu/R.length;if(nu<20)throw Error(`超阈值仅${nu}个，至少需20个；不自动降低阈值。`);const scale=F.mean(Y);if(!Number.isFinite(scale)||scale<=0)throw Error('尾部退化，不能拟合GPD。');const y=Y.map(x=>x/scale),objective=([xi,lb])=>{if(xi<=-.49||xi>=5||lb< -20||lb>20)return 1e100;const b=Math.exp(lb);if(y.some(z=>1+xi*z/b<=0))return 1e100;return y.length*lb+(Math.abs(xi)<1e-8?y.reduce((a,z)=>a+z/b,0):(1+1/xi)*y.reduce((a,z)=>a+Math.log1p(xi*z/b),0));};const fits=[-.2,.1,.6,1.2].map(x=>minimize(objective,[x,0])).filter(x=>x.converged&&x.f<1e99).sort((a,b)=>a.f-b.f);if(!fits.length)throw Error('GPD优化未收敛或支持集不合法。');const fit=fits[0],xi=fit.x[0],b=Math.exp(fit.x[1])*scale;if(xi<-.4899||xi>4.9999)throw Error('GPD估计触及形状搜索边界（−0.49,5），本轮拒绝报告不稳定拟合。');const risk=gpdRisk(u,pu,xi,b,alpha);return{u,Y,nu,pu,xi,b,threshold,logLikelihood:-fit.f-Y.length*Math.log(scale),iterations:fit.iter,converged:true,...risk};}
function erfc(x){const z=Math.abs(x),t=1/(1+z/2),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));return x>=0?r:2-r;}
function kupiec(n,x,p0){if(!Number.isInteger(n)||n<1||!Number.isInteger(x)||x<0||x>n||!Number.isFinite(p0)||p0<=0||p0>=1)throw Error('Kupiec需要有效n≥1、0≤x≤n和0<p0<1。');const phat=x/n,term=(count,p)=>count===0?0:count*Math.log(p),ll0=term(x,p0)+term(n-x,1-p0),ll1=term(x,phat)+term(n-x,1-phat),LR=Math.max(0,2*(ll1-ll0)),pValue=LR===0?1:Math.min(1,erfc(Math.sqrt(LR/2)));return{n,x,phat,p0,LR,pValue,warning:n<100||n*p0<5?'样本或期望超限较少，卡方渐近参考可能不准确。':''};}
function diagnose(L,V,E,alpha){const ids=L.map((_,i)=>i).filter(i=>Number.isFinite(L[i])&&Number.isFinite(V[i])),hit=ids.filter(i=>L[i]>V[i]),tail=hit.filter(i=>Number.isFinite(E[i])),test=kupiec(ids.length,hit.length,1-alpha),meanActual=tail.length?F.mean(tail.map(i=>L[i])):null,meanES=tail.length?F.mean(tail.map(i=>E[i])):null;return{...test,valid:ids.length,missing:L.length-ids.length,hits:hit,meanActual,meanES,bias:tail.length?meanActual-meanES:null,esCount:tail.length};}
function backtest(R,alpha,N,lambda,train,omega,a,b){if(!Number.isInteger(train)||train<30||R.length-train<20)throw Error('训练期至少30个观测，检验期至少20个观测。');const q=M.risk(R.slice(0,train),alpha,N),e=M.ewma(R,alpha,N,lambda,train),g=garch(R,alpha,N,omega,a,b,train),L=R.slice(train).map(r=>-N*r),models={};for(const name of ['historical','normal','ewma','garch']){const VaR=name==='historical'?L.map(()=>q.hVaR):name==='normal'?L.map(()=>q.nVaR):(name==='ewma'?e:g).VaR.slice(train,R.length),ES=name==='historical'?L.map(()=>q.hES):name==='normal'?L.map(()=>q.nES):(name==='ewma'?e:g).ES.slice(train,R.length);models[name]={VaR,ES,...diagnose(L,VaR,ES,alpha)};}return{train,test:L.length,L,models,mu:q.meanReturn,initial:q.sdReturn**2};}
function parseCSV(text,{kind='simple',unit='decimal'}={}){if(!['simple','log','price'].includes(kind)||!['decimal','percent'].includes(unit))throw Error('请选择数据类型和收益单位。');const rows=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).map(s=>s.split(',').map(v=>v.trim().replace(/^"|"$/g,'')));if(rows.length<3||rows[0].length!==2||rows[0][0].toLowerCase()!=='date')throw Error('CSV须为两列：date,return 或 date,price，日期YYYY-MM-DD。');const expected=kind==='price'?'price':'return';if(rows[0][1].toLowerCase()!==expected)throw Error(`第二列须命名为${expected}。`);const seen=new Set(),records=rows.slice(1).map((r,i)=>{if(r.length!==2||!/^\d{4}-\d{2}-\d{2}$/.test(r[0])||!r[1])throw Error(`第${i+2}行格式或缺失值错误。`);const time=Date.parse(r[0]+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==r[0])throw Error(`日期非法：${r[0]}`);if(seen.has(r[0]))throw Error(`重复日期：${r[0]}`);seen.add(r[0]);const value=Number(r[1]);if(!Number.isFinite(value)||(kind==='price'&&value<=0))throw Error(`第${i+2}行数值非法。`);return{date:r[0],time,value};}).sort((a,b)=>a.time-b.time);let R=[],dates=[];records.forEach((r,i)=>{if(kind==='price'){if(i){R.push(r.value/records[i-1].value-1);dates.push(r.date);}}else{const v=r.value/(unit==='percent'?100:1);R.push(kind==='log'?Math.expm1(v):v);dates.push(r.date);}});M.risk(R,.95,1);if(R.length<50||R.length>2000)throw Error('本轮支持50至2000个有效收益观测。');const gaps=records.slice(1).map((r,i)=>(r.time-records[i].time)/86400000);return{R,dates,kind,unit,source:'用户导入数据',note:`已按日期升序；${records.length}条原始记录→${R.length}个简单收益；日期间隔${Math.min(...gaps)}–${Math.max(...gaps)}日。每条预测为下一观测期，不自动年化。动态模型假定观测期可比；混合频率或缺失交易期须先清洗。本页不填补交易日；假日与缺失交易日需由来源核实。${R.some(x=>Math.abs(x)>.5)?'存在绝对收益超过50%的异常值，请核实尺度。':''}`};}
return{defaults,garch,minimize,gpdRisk,evt,kupiec,diagnose,backtest,parseCSV};});

;

/* Source: risk-garch-fit.js */
/* Conditional Gaussian GARCH(1,1), independent of experiment06. */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-math'):root.RiskMath,typeof module==='object'?require('./risk-extended'):root.RiskExtended);if(typeof module==='object')module.exports=api;else root.RiskGarchFit=api;})(this,(M,X)=>{
function decode(t){const ea=Math.exp(t[1]),eb=Math.exp(t[2]),den=1+ea+eb;return{w:Math.exp(t[0]),a:ea/den,b:eb/den};}
function simplex(fn,start,maxIter=1800){const d=start.length;let v=[start.slice(),...start.map((_,j)=>start.map((x,k)=>x+(j===k?.25:0)))].map(x=>({x,f:fn(x)}));for(let it=0;it<maxIter;it++){v.sort((a,b)=>a.f-b.f);const spread=Math.max(...v.slice(1).flatMap(q=>q.x.map((x,j)=>Math.abs(x-v[0].x[j]))));if(spread<1e-6&&v[d].f-v[0].f<1e-8)return{...v[0],iterations:it,converged:true};const c=start.map((_,j)=>v.slice(0,d).reduce((a,q)=>a+q.x[j],0)/d),r=c.map((x,j)=>2*x-v[d].x[j]),fr=fn(r);if(fr<v[0].f){const e=c.map((x,j)=>x+2*(r[j]-x)),fe=fn(e);v[d]=fe<fr?{x:e,f:fe}:{x:r,f:fr};}else if(fr<v[d-1].f)v[d]={x:r,f:fr};else{const outside=fr<v[d].f,cx=c.map((x,j)=>x+.5*((outside?r:v[d].x)[j]-x)),fc=fn(cx);if(fc<(outside?fr:v[d].f))v[d]={x:cx,f:fc};else for(let j=1;j<=d;j++){v[j].x=v[j].x.map((x,k)=>(x+v[0].x[k])/2);v[j].f=fn(v[j].x);}}}return{...v.sort((a,b)=>a.f-b.f)[0],converged:false,iterations:maxIter};}
function prepare(R){M.risk(R,.95,1);if(R.length<60)throw Error('GARCH样本估计至少需要60个训练观测。');const mu=R.reduce((a,b)=>a+b,0)/R.length,s2=R.reduce((a,r)=>a+(r-mu)**2,0)/(R.length-1),scale=Math.sqrt(s2);if(!Number.isFinite(scale)||scale<=1e-12*Math.max(1,Math.abs(mu)))throw Error('收益近似常数或方差过小，无法可靠识别GARCH。');const eps=R.map(r=>(r-mu)/scale);return{mu,s2,scale,eps};}
function objective(eps,t){if(t.some(x=>!Number.isFinite(x)||Math.abs(x)>20))return 1e100;const {w,a,b}=decode(t);if(a+b>=1)return 1e100;let h=1,f=0;for(const z of eps){if(!Number.isFinite(h)||h<=0)return 1e100;f+=.5*(Math.log(2*Math.PI)+Math.log(h)+z*z/h);h=w+a*z*z+b*h;}return Number.isFinite(f)?f:1e100;}
const starts=[[.05,.08,.87],[.1,.15,.75],[.5,.1,.4],[.9,.05,.05],[.01,.12,.87],[.2,.6,.2]].map(([w,a,b])=>[Math.log(w),Math.log(a/(1-a-b)),Math.log(b/(1-a-b))]);
const cache=new Map();
function fit(R,options={}){const key=JSON.stringify([R,options]);if(cache.has(key))return cache.get(key);const prep=prepare(R),fn=t=>objective(prep.eps,t),initial=options.starts||starts,attempts=initial.map((s,i)=>{const v=simplex(fn,s,options.maxIter??1800);const local=v.converged&&v.x.every((x,j)=>[-1,1].every(sign=>{const t=v.x.slice();t[j]+=sign*1e-4;return fn(t)>=v.f-1e-6;}));return{...v,start:i,valid:v.converged&&local&&v.f<1e99};}),valid=attempts.filter(x=>x.valid).sort((a,b)=>a.f-b.f);if(!valid.length)throw Error('GARCH优化未收敛或局部扰动检查失败；不会回退为教学参数。');const best=valid[0],par=decode(best.x),omega=par.w*prep.s2,h=[prep.s2];for(const r of R)h.push(omega+par.a*(r-prep.mu)**2+par.b*h.at(-1));if(h.some(x=>!Number.isFinite(x)||x<=0))throw Error('估计条件方差异常。');const result={omega,a:par.a,b:par.b,mu:prep.mu,initial:prep.s2,scale:prep.scale,n:R.length,h,logLikelihood:-best.f-R.length*Math.log(prep.scale),theta:best.x,converged:true,iterations:best.iterations,starts:attempts.map(v=>({start:v.start,converged:v.converged,accepted:v.valid,objective:v.f,iterations:v.iterations})),warning:par.a<1e-5||par.b<1e-5||1-par.a-par.b<1e-5?'估计接近参数边界，弱识别与局部最优仍需谨慎。':''};if(cache.size>=8)cache.clear();cache.set(key,result);return result;}
function forecast(R,alpha,N,train,fitResult){M.risk(R,alpha,N);if(train<60||train>=R.length||fitResult.n!==train)throw Error('估计预测需至少60期训练，并留出后续观测。');const f=fitResult,h=Array(R.length+1).fill(null);h[train]=f.h[train];for(let i=train;i<R.length;i++)h[i+1]=f.omega+f.a*(R[i]-f.mu)**2+f.b*h[i];const sigma=h.map(v=>v===null?null:Math.sqrt(v)),base=M.risk(R,alpha,N),z=base.z,phi=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),VaR=sigma.map(s=>s===null?null:N*(-f.mu+s*z)),ES=sigma.map(s=>s===null?null:N*(-f.mu+s*phi/(1-alpha)));return{...f,k:train,n:R.length,h,sigma,VaR,ES,longRun:f.omega/(1-f.a-f.b),latest:{variance:h.at(-1),sigma:sigma.at(-1),VaR:VaR.at(-1),ES:ES.at(-1)}};}
function estimated(R,alpha,N,train,options){if(!Number.isInteger(train)||train<60||train>=R.length)throw Error('GARCH估计训练期须至少60，且少于总样本。');const f=fit(R.slice(0,train),options);return{fit:f,prediction:forecast(R,alpha,N,train,f)};}
function backtest(R,p,options={}){const legal=[p.omega,p.a,p.b].every(Number.isFinite)&&p.omega>0&&p.a>=0&&p.b>=0&&p.a+p.b<1;const result=X.backtest(R,p.alpha,p.N,p.lambda,p.train,legal?p.omega:X.defaults.omega,legal?p.a:X.defaults.a,legal?p.b:X.defaults.b);if(!legal)result.models.garch={unavailable:true,reason:'GARCH教学参数不合法，当前模型不可用。'};if(options.includeFit===false)return result;try{const f=estimated(R,p.alpha,p.N,p.train,options);const VaR=f.prediction.VaR.slice(p.train,R.length),ES=f.prediction.ES.slice(p.train,R.length);result.models.garchFit={VaR,ES,...X.diagnose(result.L,VaR,ES,p.alpha)};result.fit=f.fit;}catch(e){result.models.garchFit={unavailable:true,reason:e.message};result.fitError=e.message;}return result;}
return{decode,simplex,prepare,objective,starts,fit,forecast,estimated,backtest};});

;

/* Source: risk-garch-r.js */
(function(root){const code=String.raw`
# Conditional Gaussian GARCH fit: fixed training mean, h[1]=training sample variance.
# Scale residuals by training SD for optimization; transform variance back afterward.
gdecode <- function(t) {
  ea<-exp(t[2]);eb<-exp(t[3]);den<-1+ea+eb
  c(w=exp(t[1]),a=ea/den,b=eb/den)
}
gsimplex <- function(fn,start,maxIter=1800) {
  d<-length(start);v<-rbind(start,matrix(rep(start,d),nrow=d,byrow=TRUE)+diag(.25,d))
  f<-apply(v,1,fn)
  for(it in seq_len(maxIter)-1) {
    ord<-order(f);v<-v[ord,,drop=FALSE];f<-f[ord]
    spread<-max(abs(sweep(v[-1,,drop=FALSE],2,v[1,],"-")))
    if(spread<1e-6&&f[d+1]-f[1]<1e-8)
      return(list(par=v[1,],value=f[1],converged=TRUE,iterations=it))
    cent<-colMeans(v[seq_len(d),,drop=FALSE]);r<-2*cent-v[d+1,];fr<-fn(r)
    if(fr<f[1]){e<-cent+2*(r-cent);fe<-fn(e)
      if(fe<fr){v[d+1,]<-e;f[d+1]<-fe}else{v[d+1,]<-r;f[d+1]<-fr}
    }else if(fr<f[d]){v[d+1,]<-r;f[d+1]<-fr}else{
      outside<-fr<f[d+1];cx<-cent+.5*((if(outside)r else v[d+1,])-cent);fc<-fn(cx)
      if(fc<(if(outside)fr else f[d+1])){v[d+1,]<-cx;f[d+1]<-fc}else{
        for(j in 2:(d+1)){v[j,]<-(v[j,]+v[1,])/2;f[j]<-fn(v[j,])}
      }
    }
  }
  j<-which.min(f);list(par=v[j,],value=f[j],converged=FALSE,iterations=maxIter)
}
garch_objective <- function(eps,t) {
  if(any(!is.finite(t))||any(abs(t)>20))return(1e100)
  p<-gdecode(t);if(p[2]+p[3]>=1)return(1e100)
  h<-1;f<-0
  for(z in eps){
    if(!is.finite(h)||h<=0)return(1e100)
    f<-f+.5*(log(2*pi)+log(h)+z*z/h)
    h<-p[1]+p[2]*z*z+p[3]*h
  }
  if(is.finite(f))f else 1e100
}
fit_garch <- function(trainR,maxIter=1800) {
  stopifnot(all(is.finite(trainR)),all(trainR>=-1))
  n<-length(trainR);if(n<60)stop("GARCH needs at least 60 training observations")
  mu<-mean(trainR);s2<-var(trainR);scale<-sqrt(s2)
  if(!is.finite(scale)||scale<=1e-12*max(1,abs(mu)))stop("Near-constant training returns")
  eps<-(trainR-mu)/scale;fn<-function(t)garch_objective(eps,t)
  original<-rbind(c(.05,.08,.87),c(.1,.15,.75),c(.5,.1,.4),
    c(.9,.05,.05),c(.01,.12,.87),c(.2,.6,.2))
  starts<-t(apply(original,1,function(p)c(log(p[1]),log(p[2]/(1-p[2]-p[3])),log(p[3]/(1-p[2]-p[3])))))
  attempts<-lapply(seq_len(nrow(starts)),function(i){
    v<-gsimplex(fn,starts[i,],maxIter)
    local<-v$converged&&all(sapply(seq_along(v$par),function(j)all(sapply(c(-1,1),function(sign){
      t<-v$par;t[j]<-t[j]+sign*1e-4;fn(t)>=v$value-1e-6
    }))))
    v$accepted<-v$converged&&local&&v$value<1e99;v
  })
  valid<-Filter(function(v)v$accepted,attempts)
  if(!length(valid))stop("GARCH optimization failed: no teaching-parameter fallback")
  best<-valid[[which.min(sapply(valid,function(v)v$value))]]
  p<-gdecode(best$par);omega<-p[1]*s2;a<-p[2];b<-p[3];h<-numeric(n+1);h[1]<-s2
  for(t in seq_len(n))h[t+1]<-omega+a*(trainR[t]-mu)^2+b*h[t]
  stopifnot(omega>0,a>=0,b>=0,a+b<1,all(is.finite(h)),all(h>0))
  list(omega=unname(omega),a=unname(a),b=unname(b),mu=mu,initial=s2,
    scale=scale,n=n,h=h,theta=best$par,logLikelihood=-best$value-n*log(scale),
    converged=TRUE,iterations=best$iterations,attempts=attempts)
}
garch_forecast <- function(R,gamma,N,train,fit) {
  stopifnot(train==fit$n,train>=60,train<length(R))
  n<-length(R);h<-rep(NA_real_,n+1);h[train+1]<-fit$h[train+1]
  for(t in seq.int(train+1,n))h[t+1]<-fit$omega+fit$a*(R[t]-fit$mu)^2+fit$b*h[t]
  sigma<-sqrt(h);z<-qnorm(gamma)
  list(h=h,sigma=sigma,VaR=N*(-fit$mu+sigma*z),
    ES=N*(-fit$mu+sigma*dnorm(z)/(1-gamma)),mu=fit$mu)
}
# Fixed initial training estimation + sequential test variance updates; no daily refitting.
garch_estimated_backtest <- function(bt,R,gamma,N,train) {
  attempt<-tryCatch({f<-fit_garch(R[seq_len(train)]);g<-garch_forecast(R,gamma,N,train,f);
    ids<-bt$ids;V<-g$VaR[ids];E<-g$ES[ids];hit<-bt$L>V
    actual<-if(any(hit))mean(bt$L[hit])else NA_real_
    predicted<-if(any(hit))mean(E[hit])else NA_real_
    list(fit=f,model=list(VaR=V,ES=E,hits=which(hit),test=kupiec(length(ids),sum(hit),1-gamma),
      meanActual=actual,meanES=predicted,bias=actual-predicted))},error=function(e)list(error=conditionMessage(e)))
  bt$fit<-attempt$fit;bt$models$garchFit<-if(is.null(attempt$error))attempt$model else list(error=attempt$error)
  bt
}
`;if(typeof module==='object')module.exports=code;else root.RiskGarchR=code;})(this);

;

/* Source: risk-final-code.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-math'):root.RiskMath,typeof module==='object'?require('./risk-extended'):root.RiskExtended,typeof module==='object'?require('./risk-code'):root.RiskCode,typeof module==='object'?require('./risk-garch-fit'):root.RiskGarchFit,typeof module==='object'?require('./risk-garch-r'):root.RiskGarchR);if(typeof module==='object')module.exports=api;else root.RiskFinalCode=api;})(this,(M,X,C,G,GR)=>{
const runtime=String.raw`risk <- function(r, gamma, N) {
  L <- -N*r; x <- sort(L); n <- length(L); j <- seq_len(n)
  w <- pmax(0,pmin(j/n-gamma,1/n)); z <- qnorm(gamma)
  c(hVaR=unname(quantile(L,gamma,type=1)),hES=sum(x*w)/(1-gamma),
    nVaR=mean(L)+sd(L)*z,nES=mean(L)+sd(L)*dnorm(z)/(1-gamma))
}
dynamic <- function(R,gamma,N,k,lambda,omega,a,b,model,h0=NULL) {
  stopifnot(k>=2,k<length(R),k==floor(k),lambda>0,lambda<1)
  if(model=="garch")stopifnot(omega>0,a>=0,b>=0,a+b<1)
  n <- length(R); mu <- mean(R[seq_len(k)]); h <- rep(NA_real_,n+1)
  h[k+1] <- if(is.null(h0))var(R[seq_len(k)])else h0
  stopifnot(is.finite(h[k+1]),h[k+1]>=0)
  for(t in seq.int(k+1,n)) {
    # h[t] is predicted before observing R[t]; update only h[t+1]
    h[t+1] <- if(model=="ewma") lambda*h[t]+(1-lambda)*(R[t]-mu)^2 else
      omega+a*(R[t]-mu)^2+b*h[t]
  }
  sigma <- sqrt(h); z <- qnorm(gamma)
  list(h=h,sigma=sigma,VaR=N*(-mu+sigma*z),
    ES=N*(-mu+sigma*dnorm(z)/(1-gamma)),mu=mu)
}
# Deterministic Nelder-Mead, same objective and stopping rule as browser.
nm <- function(fn,start) {
  v <- rbind(start,start+c(.12,0),start+c(0,.18)); f <- apply(v,1,fn)
  for(iter in 0:1999) {
    ord <- order(f); v <- v[ord,,drop=FALSE]; f <- f[ord]
    spread <- max(abs(sweep(v[-1,,drop=FALSE],2,v[1,],"-")))
    if(spread<1e-8 && abs(f[3]-f[1])<1e-9)
      return(list(par=v[1,],value=f[1],converged=is.finite(f[1]),iter=iter))
    cent <- (v[1,]+v[2,])/2; r <- cent+(cent-v[3,]); fr <- fn(r)
    if(fr<f[1]) {
      e <- cent+2*(cent-v[3,]); fe <- fn(e)
      if(fe<fr){v[3,]<-e;f[3]<-fe}else{v[3,]<-r;f[3]<-fr}
    } else if(fr<f[2]) {v[3,]<-r;f[3]<-fr} else {
      outside <- fr<f[3]; cx <- cent+.5*((if(outside) r else v[3,])-cent)
      fc <- fn(cx)
      if(fc<(if(outside) fr else f[3])){v[3,]<-cx;f[3]<-fc}else{
        for(j in 2:3){v[j,]<-(v[j,]+v[1,])/2;f[j]<-fn(v[j,])}
      }
    }
  }
  list(par=v[which.min(f),],value=min(f),converged=FALSE,iter=2000)
}
gpd_risk <- function(u,pu,xi,b,gamma) {
  stopifnot(b>0,pu>0,pu<=1,gamma>0,gamma<1)
  if(1-gamma>=pu) stop("Target quantile must exceed threshold")
  lr <- log(pu/(1-gamma))
  VaR <- u+b*if(abs(xi)<1e-8) lr else expm1(xi*lr)/xi
  ES <- if(xi>=1) Inf else VaR+(b+xi*(VaR-u))/(1-xi)
  c(VaR=VaR,ES=ES)
}
fit_gpd <- function(R,gamma,N,threshold) {
  L <- -N*R; u <- unname(quantile(L,threshold,type=1)); Y <- L[L>u]-u
  nu <- length(Y); pu <- nu/length(L)
  if(nu<20) stop("Fewer than 20 strict threshold exceedances")
  scale <- mean(Y); if(!is.finite(scale)||scale<=0)stop("Degenerate tail")
  y <- Y/scale
  fn <- function(par) {
    xi<-par[1];lb<-par[2]
    if(xi<=-.49||xi>=5||lb< -20||lb>20)return(1e100)
    b<-exp(lb); if(any(1+xi*y/b<=0))return(1e100)
    length(y)*lb+if(abs(xi)<1e-8)sum(y/b) else (1+1/xi)*sum(log1p(xi*y/b))
  }
  fits <- lapply(c(-.2,.1,.6,1.2),function(x)nm(fn,c(x,0)))
  fits <- Filter(function(x)x$converged&&x$value<1e99,fits)
  if(!length(fits))stop("GPD optimization failed")
  fit<-fits[[which.min(sapply(fits,function(x)x$value))]]
  xi<-fit$par[1];b<-exp(fit$par[2])*scale
  if(xi < -.4899||xi>4.9999)stop("GPD shape search boundary: unstable fit")
  est<-gpd_risk(u,pu,xi,b,gamma)
  list(u=u,Y=Y,nu=nu,pu=pu,xi=xi,b=b,VaR=est[[1]],ES=est[[2]],
    logLikelihood=-fit$value-nu*log(scale),converged=TRUE)
}
kupiec <- function(n,x,p0) {
  stopifnot(n>=1,x>=0,x<=n,p0>0,p0<1)
  term <- function(count,p)if(count==0)0 else count*log(p)
  phat<-x/n;ll0<-term(x,p0)+term(n-x,1-p0)
  ll1<-term(x,phat)+term(n-x,1-phat)
  LR<-max(0,2*(ll1-ll0))
  c(n=n,x=x,rate=phat,p0=p0,LR=LR,p=pchisq(LR,df=1,lower.tail=FALSE))
}
backtest <- function(R,gamma,N,train,lambda,omega,a,b) {
  stopifnot(train>=30,length(R)-train>=20)
  n<-length(R); ids<-seq.int(train+1,n); L<- -N*R[ids]
  static<-risk(R[seq_len(train)],gamma,N)
  ew<-dynamic(R,gamma,N,train,lambda,omega,a,b,"ewma")
  ga<-tryCatch(dynamic(R,gamma,N,train,lambda,omega,a,b,"garch"),error=function(e)list(error=conditionMessage(e)))
  predictions<-list(historical=list(VaR=rep(static[1],length(ids)),ES=rep(static[2],length(ids))),
    normal=list(VaR=rep(static[3],length(ids)),ES=rep(static[4],length(ids))),
    ewma=list(VaR=ew$VaR[ids],ES=ew$ES[ids]),garch=if(is.null(ga$error))list(VaR=ga$VaR[ids],ES=ga$ES[ids])else ga)
  models<-lapply(predictions,function(p){
    if(!is.null(p$error))return(p)
    valid<-is.finite(L)&is.finite(p$VaR);hit<-valid&L>p$VaR
    es_ids<-hit&is.finite(p$ES)
    actual<-if(any(es_ids))mean(L[es_ids])else NA_real_
    predicted<-if(any(es_ids))mean(p$ES[es_ids])else NA_real_
    list(VaR=p$VaR,ES=p$ES,hits=which(hit),
      test=kupiec(sum(valid),sum(hit),1-gamma),
      meanActual=actual,meanES=predicted,bias=actual-predicted)
  })
  list(L=L,ids=ids,models=models)
}`;
function build(p,view='basic',method='historical',chart='var',mode='full',provided,options={}){
const R=provided||M.generate(p);if(view==='basic'){const basic=C.build(p,view,method,chart,mode,provided);if(options.source)basic.code='# 用户填写来源（未核实）：'+String(options.source).replace(/[\r\n]/g,' ')+'\n'+basic.code;return basic;}
const cfg={...X.defaults,...p},estimated=options.garchMode==='estimate'&&view==='dynamic'&&options.dynamic!=='ewma',train=cfg.train;const q=M.risk(R,p.alpha,p.N);let e=M.ewma(R,p.alpha,p.N,p.lambda,estimated?train:p.window),g=null,fit=null,fitError=null,ev=null,bt=null,error=null;try{if(estimated){const result=G.estimated(R,p.alpha,p.N,train);g=result.prediction;fit=result.fit;}else g=X.garch(R,p.alpha,p.N,cfg.omega,cfg.a,cfg.b,p.window,options.initialMode==='custom'?p.h0:undefined);}catch(err){if(!estimated&&view==='dynamic'&&options.dynamic!=='ewma')throw err;if(estimated)fitError=err.message;}try{if(view==='evt')ev=X.evt(R,p.alpha,p.N,cfg.threshold);if(view==='backtest')bt=G.backtest(R,cfg,{includeFit:options.backModel==='garchFit'});}catch(err){error=err.message;}
const blocks=[],add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:code.split('\n'),explain,formula});
add('data','数据与参数',`# 用户填写来源（未核实）：${String(options.source||'未提供').replace(/[\r\n]/g,' ')}\n# ${provided?'用户导入数据；当前简单收益已内嵌，无外部文件依赖':'合成教学数据，非真实市场行情'}\n# 单期简单收益，小数；不进行年化或多日缩放\nR <- c(${R.join(',\n  ')})\nn <- length(R)\nN <- ${p.N}\ngamma <- ${p.alpha}\nk <- ${p.window}\nlambda <- ${p.lambda}\nomega <- ${cfg.omega}\na <- ${cfg.a}\nb <- ${cfg.b}\nthreshold <- ${cfg.threshold}\ntrain <- ${cfg.train}\nL <- -N*R\n${options.dates?'dates <- as.Date(c('+options.dates.map(x=>'"'+x+'"').join(',')+'))':'dates <- seq_len(n)'}\nstopifnot(n>=2,all(is.finite(R)),all(R>=-1),N>0,gamma>0,gamma<1)`, '收益统一为小数简单收益；损失正数为亏损。日期已对齐至该期收益结束日；下一预测期没有实际损失。');
add('functions','数学函数与模型估计',runtime+GR,'Base R定义精确历史ES、条件方差、真实GPD似然优化和Kupiec检验。GPD采用正则搜索域−0.49<ξ<5，边界拟合拒绝报告；不是全实数形状参数的无约束MLE。GARCH可选择给定参数或训练期条件高斯样本估计；均值固定为训练均值，估计初始化h1为训练样本方差。');
if(view==='dynamic'){
if(estimated){add('fit','GARCH训练期样本估计',`# Only the first train observations enter the likelihood; no test returns.
fit_attempt <- tryCatch(fit_garch(R[seq_len(train)]),error=function(e)list(error=conditionMessage(e)))
fit <- if(is.null(fit_attempt$error))fit_attempt else NULL
if(is.null(fit))message(fit_attempt$error)else print(unlist(fit[c("omega","a","b","mu","initial","logLikelihood","n","iterations")]))`, '前train期固定样本均值、h1为训练样本方差；全部训练收益进入高斯条件似然。六起点优化，参数变换保证正方差与平稳，检查单纯形收敛和局部扰动；训练期拟合路径不冒充事前预测。',String.raw`-\ell=\frac12\sum_t[\log(2\pi)+\log h_t+(R_t-\mu)^2/h_t]`);
add('ewma','对齐的样本外顺序预测',`ew <- dynamic(R,gamma,N,train,lambda,omega,a,b,"ewma")
ga <- if(is.null(fit))NULL else garch_forecast(R,gamma,N,train,fit)
if(!is.null(ga))print(tail(data.frame(ewma_h=ew$h,garch_h=ga$h,VaR=ga$VaR,ES=ga$ES),6))`, 'GARCH先在训练期末保留方差状态；第train+1期开始有效预测，EWMA也对齐到同一训练终点。检验期固定估计参数与均值，仅更新方差，不每日重新拟合。');
}else{
add('ewma','条件方差与事前风险',`ew <- dynamic(R,gamma,N,k,lambda,omega,a,b,"ewma")\nga <- tryCatch(dynamic(R,gamma,N,k,lambda,omega,a,b,"garch",${options.initialMode==='custom'?p.h0:'NULL'}),error=function(e){message(conditionMessage(e));list(h=rep(NA_real_,n+1),sigma=rep(NA_real_,n+1),VaR=rep(NA_real_,n+1),ES=rep(NA_real_,n+1))})\nresult <- data.frame(day=seq_len(n+1),actual_loss=c(L,NA_real_),\n  ewma_h=ew$h,garch_h=ga$h,ewma_VaR=ew$VaR,garch_VaR=ga$VaR,\n  ewma_ES=ew$ES,garch_ES=ga$ES)\nprint(tail(result,6))\nprint(c(mu=ew$mu,h0_ewma=ew$h[k+1],h0_garch=ga$h[k+1],long_run=omega/(1-a-b)))`, '共用前k期训练均值；EWMA从训练样本方差开始，GARCH按所选样本方差或指定h0初始化。第t期收益只更新t+1期；长期方差不是本轮初始方差。',String.raw`h_{t+1}=\omega+a(R_t-\mu)^2+b h_t`);
}
if(mode==='full')add('plot','同一时间轴绘图',`if("${options.dynamic||'ewma'}"=="garch" && is.null(ga)) { message("GARCH unavailable; no substituted prediction") } else {\nfield <- "${chart==='es'?'ES':chart==='volatility'?'sigma':'VaR'}"\nfactor <- ${chart==='volatility'?'100':'1/10000'}\nselected <- "${options.dynamic||'ewma'}"\ncur <- if(selected=="garch")ga[[field]] else ew[[field]]\ny <- cur*factor\nyr <- range(c(y,${chart==='volatility'?'numeric(0)':'L/10000'},if(selected=="compare"&&!is.null(ga))ga[[field]]*factor),na.rm=TRUE)\nif(diff(yr)==0)yr<-yr+c(-1,1)\nplot(seq_len(n+1),y,type="l",col="steelblue",ylim=yr,\n xlab="Observation period (last = next forecast)",ylab="${chart==='volatility'?'One-period SD (%)':'Loss / risk (10,000 yuan)'}")\n${chart==='volatility'?'':'lines(seq_len(n),L/10000,col="grey70")'}\nif(selected=="compare"&&!is.null(ga))lines(seq_len(n+1),ga[[field]]*factor,col="thistle4",lty=2)\nabline(v=n+.5,lty=3)\npoints(n+1,tail(y,1),pch=19)\n}`, '末点为下一观测期；没有伪造其已实现损失。比较曲线使用同一训练数据、均值、条件正态假设及共同有效日期；各模型初始化规则见计算段，不能据此声称初始方差状态相同。');
}else if(view==='evt'){
add('estimate','POT-GPD拟合与风险',`ev <- tryCatch(fit_gpd(R,gamma,N,threshold),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(ev$error))message(ev$error) else {\n  print(unlist(ev[c("u","nu","pu","xi","b","VaR","ES","logLikelihood")]))\n  if(ev$xi>=1)message("xi >= 1: theoretical ES is infinite")\n}`, '只拟合严格大于阈值的损失；多起点数值优化真实GPD负对数似然。ξ≥1时ES不有限；失败时不产生虚假结果。',String.raw`VaR=u+\frac{b}{\xi}[(p_u/(1-\gamma))^\xi-1]`);
if(mode==='full')add('plot','尾部经验生存率与拟合',`if(is.null(ev$error)) {\n  losses<-sort(L[L>ev$u]); survival<-sapply(losses,function(x)mean(L>x))\n  grid<-seq(ev$u,max(c(losses,ev$VaR,if(is.finite(ev$ES))ev$ES)),length.out=200)\n  support<-1+ev$xi*(grid-ev$u)/ev$b\n  fit<-if(abs(ev$xi)<1e-8)ev$pu*exp(-(grid-ev$u)/ev$b) else\n    ifelse(support>0,ev$pu*pmax(support,1e-300)^(-1/ev$xi),0)\n  plot(losses/10000,survival,pch=16,xlim=range(grid)/10000,\n    xlab="Tail loss (10,000 yuan)",ylab="Survival probability",main="POT-GPD: static tail")\n  lines(grid/10000,fit,col="thistle4");abline(v=c(ev$u,ev$VaR)/10000,lty=c(3,1))\n  if(is.finite(ev$ES))abline(v=ev$ES/10000,lty=2)\n}`, '经验生存率与GPD尾部生存概率使用同一无条件概率尺度；这是静态EVT，不是逐期条件EVT预测。');
}else{
add('predict','训练与顺序预测',`bt <- backtest(R,gamma,N,train,lambda,omega,a,b)\n${options.backModel==='garchFit'?'bt <- garch_estimated_backtest(bt,R,gamma,N,train)\n':''}selected <- "${options.backModel||'ewma'}"\ncurrent <- bt$models[[selected]]\nif(!is.null(current$error))message(current$error)`, '前train期训练静态分布和固定条件均值；此后静态参数固定，EWMA/GARCH逐期只用过去收益更新。GARCH教学参数与训练期估计明确区分；估计参数模式仅训练一次，随后逐期更新。');
add('test','超限、Kupiec与ES诊断',`if(is.null(current$error)) {\nprint(current$test)\nprint(c(mean_actual_tail=current$meanActual,mean_predicted_ES=current$meanES,\n  descriptive_bias=current$bias))\nprint(data.frame(date=dates[bt$ids],actual=bt$L,VaR=current$VaR,ES=current$ES,\n  exceed=bt$L>current$VaR))\n}`, '严格L>VaR才算超限。Kupiec只检验无条件超限比例，不能证明模型准确或超限独立；ES均值差仅为描述性诊断。',String.raw`LR=-2[\ell(p_0)-\ell(x/n)]\;\sim\chi^2_1`);
if(mode==='full')add('plot','样本外预测与后来损失',`if(is.null(current$error)) {\nplot(bt$ids,bt$L/10000,type="l",col="grey60",\n ylim=range(c(bt$L,current$VaR))/10000,\n xlab="Out-of-sample observation",ylab="One-period loss (10,000 yuan)")\nlines(bt$ids,current$VaR/10000,col="steelblue",lwd=2)\nif(length(current$hits))points(bt$ids[current$hits],bt$L[current$hits]/10000,col="firebrick",pch=19)\n}`, '图中只有检验期，训练期不计入超限分母。检验期第t个风险预测在观察该期损失之前产生。');
}
return{blocks,fit,fitError,estimated,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,e,g,ev,bt,error};}
return{build,runtime};});

;

/* Source: risk-final-charts.js */
(()=>{'use strict';const esc=x=>WorkbenchUI.esc(String(x)),money=x=>x===null?'不有限':Number(x).toLocaleString('en-US',{maximumFractionDigits:2});
function render(host,o,interaction){if(o.view==='basic')return RiskCharts.render(host,o,interaction);const {p,e,g,ev,bt,view,chart,dynamic,backModel,dates}=o;let series=[],points=[],marks=[],title,xlabel,ylabel,xmin,xmax,ymin,ymax,extra='';const colors=['#6689a8','#9b88ac','#a4adb4'];
if(view==='dynamic'){title=(dynamic==='compare'?'EWMA与GARCH':dynamic==='garch'?'GARCH(1,1)':'EWMA')+' · 事前单期'+(chart==='volatility'?'波动率':chart==='es'?'ES':'VaR');xmin=o.zoom?Math.max(1,e.shock.day-8):1;xmax=o.zoom?Math.min(e.n+1,e.shock.day+9):e.n+1;if(!g&&dynamic==='garch'){host.innerHTML='<p class="risk-empty">当前样本无法获得可靠的GARCH估计；没有替代预测。</p>';return[];}const key=chart==='volatility'?'sigma':chart==='es'?'ES':'VaR',factor=chart==='volatility'?100:1/10000;for(const [j,m]of (dynamic==='compare'?[e,...(g?[g]:[])]:[dynamic==='garch'?g:e]).entries()){const name=dynamic==='compare'?(j?'GARCH':'EWMA'):dynamic.toUpperCase();series.push({name,color:colors[j],points:m[key].map((v,i)=>[i+1,v===null?null:v*factor]).filter(x=>x[1]!==null)});}
if(chart!=='volatility')series.unshift({name:'实际损失',color:colors[2],points:e.L.map((v,i)=>[i+1,v/10000])});for(let i=e.k;i<=e.n;i++){const m=dynamic==='garch'?g:e;points.push({x:i+1,y:m[key][i]*factor,label:`第${i+1}期${dates&&i<dates.length?'（'+dates[i]+'）':''}：仅用截至第${i}期信息；${dynamic==='garch'?'GARCH':'EWMA'} VaR ${money(m.VaR[i])}元；ES ${money(m.ES[i])}元；${i===e.n?'尚无实际损失':'实际损失 '+money(e.L[i])+'元'}`,last:i===e.n});}xlabel='观测期（末点是下一期预测）';ylabel=chart==='volatility'?'预测单期标准差（%）':'损失／风险（万元）';
}else if(view==='evt'){title='POT-GPD · 历史尾部与拟合生存概率';xlabel='尾部损失（万元）';ylabel='无条件尾部概率 P(L>x)';if(!ev){host.innerHTML='<p class="risk-empty">当前尾部不能可靠计算。请查看原因并调整阈值或数据；不会自动更换样本。</p>';return[];}const L=o.q.L,tail=L.filter(x=>x>ev.u).sort((a,b)=>a-b);xmin=ev.u/10000;xmax=Math.max(...tail,ev.VaR,ev.ES===null?ev.VaR:ev.ES)/10000;const grid=Array.from({length:160},(_,i)=>{const x=ev.u+(xmax*10000-ev.u)*i/159,z=1+ev.xi*(x-ev.u)/ev.b;return[x/10000,Math.abs(ev.xi)<1e-8?ev.pu*Math.exp(-(x-ev.u)/ev.b):z>0?ev.pu*z**(-1/ev.xi):0];});series=[{name:'GPD拟合生存率',color:colors[1],points:grid}];points=tail.map(x=>({x:x/10000,y:L.filter(z=>z>x).length/L.length,label:`历史尾部损失 ${money(x)}元；严格超过阈值${money(ev.u)}元`}));marks=[{x:ev.u/10000,label:'阈值u',color:colors[2]},{x:ev.VaR/10000,label:'EVT VaR',color:colors[0]},...(ev.ES===null?[]:[{x:ev.ES/10000,label:'EVT ES · 尾部均值',color:colors[1]}])];
}else{title='预测的风险阈值，是否经得起后来发生的损失？';xlabel='样本外观测期（按日期升序）';ylabel='单期损失／事前VaR（万元）';if(!bt){host.innerHTML='<p class="risk-empty">请设置有效训练／检验区间。</p>';return[];}const cur=bt.models[backModel];if(cur.unavailable){host.innerHTML='<p class="risk-empty">当前模型不可用，未生成预测或检验。</p>';return[];}xmin=bt.train+1;xmax=bt.train+bt.test;series=[{name:'检验期实际损失',color:colors[2],points:bt.L.map((v,i)=>[bt.train+i+1,v/10000])},{name:(backModel==='garchFit'?'GARCH训练估计':backModel==='garch'?'GARCH教学参数':backModel.toUpperCase())+' 事前VaR',color:colors[0],points:cur.VaR.map((v,i)=>[bt.train+i+1,v/10000])}];points=bt.L.map((v,i)=>({x:bt.train+i+1,y:v/10000,hit:cur.hits.includes(i),label:`第${bt.train+i+1}期${dates?'（'+dates[bt.train+i]+'）':''}：实际损失${money(v)}元；事前VaR ${money(cur.VaR[i])}元；${cur.hits.includes(i)?'严格超限':'未超限（等于阈值也不计）'}`}));}
for(const s of series)s.points=s.points.filter(v=>v[0]>=xmin&&v[0]<=xmax);points=points.filter(v=>v.x>=xmin&&v.x<=xmax);
const ys=[...series.flatMap(s=>s.points.map(x=>x[1])),...points.map(x=>x.y)];ymin=view==='evt'?0:Math.min(0,...ys);ymax=Math.max(0,...ys);let r=ymax-ymin||1;ymin-=view==='evt'?0:r*.08;ymax+=r*.12;if(xmax===xmin)xmax=xmin+1;
const X=x=>82+(x-xmin)/(xmax-xmin)*486,Y=y=>315-(y-ymin)/(ymax-ymin)*277;let body='',grid='';for(let j=0;j<5;j++){const x=xmin+(xmax-xmin)*j/4,y=ymin+(ymax-ymin)*j/4;grid+=`<path d="M${X(x)},38V315 M82,${Y(y)}H568" stroke="#e0e7eb"/><text x="${X(x)}" y="336" text-anchor="middle">${view==='evt'?x.toFixed(2):Math.round(x)}</text><text x="75" y="${Y(y)+4}" text-anchor="end">${y.toPrecision(3)}</text>`;}
for(const s of series)body+=`<path data-risk-series="${esc(s.name)}" d="M${s.points.map(v=>X(v[0])+','+Y(v[1])).join('L')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-dasharray="${s.name.includes('GARCH')?'6 3':'none'}"/>`;
if(view==='dynamic'&&xmax===e.n+1)body+=`<path d="M${X(e.n+.5)},38V315" stroke="${colors[0]}" stroke-dasharray="3 3"/><text x="565" y="30" text-anchor="end">末点：下一期，尚无实际损失</text>`;
if(view==='dynamic'&&o.zoom)body+=`<path d="M${X(e.shock.day)},38V315" stroke="#a98773" stroke-dasharray="4 4"/><text x="${X(e.shock.day)}" y="30" text-anchor="middle">第${e.shock.day}期冲击附近</text>`;
for(const [i,m]of marks.entries())body+=`<path d="M${X(m.x)},38V315" stroke="${m.color}" stroke-dasharray="${i===2?'5 3':i===0?'2 3':'none'}"/>`;
points.forEach((pt,i)=>body+=`<circle data-risk-tip="${i}" data-risk-point="${view==='dynamic'?pt.x-1:i}" cx="${X(pt.x)}" cy="${Y(pt.y)}" r="${pt.hit||pt.last?4:3}" fill="${pt.hit?'#b06960':view==='evt'?'#659b8a':pt.last?colors[0]:'transparent'}" tabindex="0" aria-label="${esc(pt.label)}"/>`);
host.innerHTML=`<h3 id="riskChartTitle">${title}</h3><div class="risk-svg"><svg viewBox="0 0 600 385" role="img" aria-label="${esc(title)}">${grid}${body}<text x="325" y="374" text-anchor="middle">${xlabel}</text><text transform="translate(20 185) rotate(-90)" text-anchor="middle">${ylabel}</text></svg></div>`;host.querySelectorAll('[data-risk-tip]').forEach(el=>interaction.bind(el,points[+el.dataset.riskTip].label));return[...series.map(s=>({label:s.name,color:s.color})),...marks.map(m=>({label:m.label,color:m.color,tip:`${m.label}：${money(m.x*10000)}元。ES为尾部均值，不是分位阈值。`})),...(view==='backtest'?[{label:'红点：严格超限 L>VaR',color:'#b06960'}]:[])];}
window.RiskFinalCharts={render};})();

;

/* Source: risk-ai-math.js */
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

;

/* Source: risk-ai-code.js */
/* Experiment07 · R script for the AI risk view. Base R only: the bagged
   regression tree and the LSTM both train inside the script, and every number
   the page shows is printed again. Comments follow the active UI language.
   Indexing contract: R matrix D row j is 1-based day j+2, matching the page's
   design day (target = return of that day, features from earlier days). */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-ai-math'):root.RiskAIMath);if(typeof module==='object')module.exports=api;else root.RiskAICode=api;})(this,A=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
function vec(values,per=8){
  const parts=values.map(v=>num(v)),lines=[];
  for(let i=0;i<parts.length;i+=per)lines.push('  '+parts.slice(i,i+per).join(', '));
  return 'c(\n'+lines.join(',\n')+'\n)';
}
function lstmSource(){
  try{return (typeof module==='object'?require('./timeseries-r'):window.TimeSeriesR).source.lstmTrain;}catch{return '# LSTM source unavailable.';}
}
function build(p,q,mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];
  const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const R=q.R,N=p.N,alpha=p.alpha,nt=q.nt,k0=Math.max(20,Math.min(nt,120));
  add('data',T('数据、目标与 EWMA 基准','Data, target and EWMA baseline'),
    [`# Experiment 07 | AI risk forecasting | base R, no extra packages.`,
     T('# 固定种子生成的合成样本：GARCH(1,1) 波动聚集 + 偶发跳跃；非真实行情。','# Synthetic sample from a fixed seed: GARCH(1,1) clustering plus occasional jumps; not a market quote.'),
     `R <- ${vec(R)}`,
     `n <- length(R)`, `N <- ${num(N)}`, `alpha <- ${num(alpha)}`, `train_share <- ${num(p.aiTrain)}`,
     `k0 <- ${k0}L`,
     T('# EWMA（λ=0.94）：前 k0 日均值；h[k0+1] 取前 k0 日样本方差','# EWMA (λ=0.94): mean of the first k0 days; h[k0+1] is their sample variance'),
     'ewma_var <- function(R, k, lambda) {',
     '  mu <- mean(R[seq_len(k)]); h <- numeric(length(R) + 1L)',
     '  h[k + 1L] <- var(R[seq_len(k)])',
     '  for (i in seq.int(k + 1L, length(R))) h[i + 1L] <- lambda * h[i] + (1 - lambda) * (R[i] - mu)^2',
     '  list(mu = mu, sigma = sqrt(h))',
     '}',
     'lambda <- 0.94', 'ew <- ewma_var(R, k0, lambda)', 'z <- qnorm(alpha)',
     T('# 第 i 日的事前 VaR 只用第 i−1 日及更早的信息','# The one-day-ahead VaR for day i uses information through day i−1'),
     'VaR_ewma <- N * (-ew$mu + ew$sigma * z)',
     'ES_ewma <- N * (-ew$mu + ew$sigma * dnorm(z) / (1 - alpha))',
     'stopifnot(n >= 150)'],
    T('收益是小数简单收益，损失为正数。EWMA 与页面使用同一 λ、同一初始化窗口和同一分母。','Returns are decimal simple returns and losses are positive. EWMA uses the same λ, initialisation window and denominator as the page.'));
  add('features',T('五个滞后特征','Five lagged features'),
    [T('# 每个特征都只使用目标日之前的信息','# Every feature uses information strictly before the target day'),
     'design <- function(R) {',
     '  out <- list(); v <- NULL; lambda <- 0.94',
     '  for (i in seq.int(3L, length(R))) {',
     '    if (is.null(v)) v <- mean(R[seq_len(i - 1L)]^2) else v <- lambda * v + (1 - lambda) * R[i - 1L]^2',
     '    out[[length(out) + 1L]] <- c(R[i], R[i - 1L], R[i - 2L], abs(R[i - 1L]), R[i - 1L]^2, sqrt(v))',
     '  }',
     '  do.call(rbind, out)',
     '}',
     T('# 第 1 列是目标，第 2–6 列是特征；第 j 行对应第 j+2 日','# Column 1 is the target and columns 2-6 the features; row j is day j+2'),
     'D <- design(R); rownames(D) <- NULL',
     'nt <- floor(nrow(D) * train_share)',
     'train_rows <- seq_len(nt)', 'test_rows <- seq.int(nt + 1L, nrow(D))',
     'day <- test_rows + 2L',
     'X <- D[, 2:6, drop = FALSE]; y <- D[, 1]',
     'loss <- -N * y[test_rows]',
     'stopifnot(length(day) >= 40)'],
    T('特征的构造与页面逐列一致：滞后收益、绝对收益、平方收益和 EWMA 波动率。','The construction matches the page column by column: lagged returns, absolute and squared returns, and EWMA volatility.'));
  add('forest',T('随机森林（叶内分位数）','Random forest with leaf quantiles'),
    [T('# 逐样本 bootstrap 后递归二分；叶节点保存目标值，最后汇集取分位','# Per-tree bootstrap then recursive splits; leaves keep the targets and the quantile is pooled'),
     `set.seed(${p.aiSeed})`,
     `grow <- function(idx, depth, max_depth = ${p.aiDepth}L, leaf = ${p.aiLeaf}L) {`,
     '  if (depth >= max_depth || length(idx) < 2L * leaf) return(list(vals = y[idx]))',
     '  best <- NULL',
     '  for (f in sample(5L, min(3L, 5L))) {',
     '    cuts <- unique(quantile(X[idx, f], probs = seq(0.1, 0.9, length.out = 6), names = FALSE))',
     '    for (cut in cuts) {',
     '      left <- idx[X[idx, f] <= cut]; right <- idx[X[idx, f] > cut]',
     '      if (length(left) < leaf || length(right) < leaf) next',
     '      sse <- sum((y[left] - mean(y[left]))^2) + sum((y[right] - mean(y[right]))^2)',
     '      if (is.null(best) || sse < best$sse) best <- list(f = f, cut = cut, sse = sse, left = left, right = right)',
     '    }',
     '  }',
     '  if (is.null(best)) return(list(vals = y[idx]))',
     '  list(f = best$f, cut = best$cut, left = grow(best$left, depth + 1L), right = grow(best$right, depth + 1L))',
     '}',
     `trees <- vector("list", ${p.aiTrees}L)`,
     'for (b in seq_along(trees)) trees[[b]] <- grow(sample(train_rows, length(train_rows), replace = TRUE), 0L)',
     'leaf_of <- function(node, x) if (is.null(node$f)) node$vals else if (x[node$f] <= node$cut) leaf_of(node$left, x) else leaf_of(node$right, x)',
     T('# 汇集所有树的叶内样本再取分位，而不是把各树分位数取平均','# Pool the leaf samples of every tree, then take the quantile rather than averaging per-tree quantiles'),
     'rf_q <- function(row) {',
     '  pool <- unlist(lapply(trees, function(tr) leaf_of(tr, X[row, ])))',
     '  q <- quantile(pool, 1 - alpha, names = FALSE)',
     '  c(q = q, tail = mean(pool[pool <= q]))',
     '}',
     'rf <- t(vapply(test_rows, rf_q, numeric(2)))',
     'VaR_rf <- -N * rf[, "q"]; ES_rf <- -N * rf[, "tail"]'],
    T('叶节点直接给出条件分位，因此不需要正态假设；代价是尾部估计依赖叶内样本量与随机种子。','Leaves give a conditional quantile directly, so no normal assumption is needed; the cost is that the tail estimate depends on leaf sample size and the seed.'));
  if(mode==='full'){
    add('lstm',T('LSTM 训练与条件均值','LSTM training and conditional mean'),
      [T('# base R 教学规模 LSTM：完整 BPTT、逐样本 SGD','# Teaching-scale LSTM in base R: full BPTT, per-sample SGD'),
       lstmSource(),
       `window <- ${p.aiWindow}L`, `hidden <- ${p.aiHidden}L`, `epochs <- ${p.aiEpochs}L`, `seed <- ${p.aiSeed}L`,
       'start <- max(2L, window)',
       'train_t <- seq.int(max(start + 1L, k0 + 1L), nt + 2L)',
       'if (length(train_t) > 200L) train_t <- round(seq(min(train_t), nt + 2L, length.out = 200L))',
       'center <- mean(R[seq_len(nt + 2L)]); scale <- sd(R[seq_len(nt + 2L)])',
       'Z <- (R - center) / scale',
       'input_at <- function(t) matrix(Z[(t - window):(t - 1L)], ncol = 1)',
       'set.seed(seed)',
       'fit <- lstm_train(lapply(train_t, input_at), Z[train_t], hidden, epochs, 0.02, seed)',
       'mu_hat <- center + scale * vapply(day, function(t) lstm_forward(fit$weights, input_at(t), hidden)$value, numeric(1))',
       T('# 用 LSTM 残差除以 EWMA 尺度，再取标准化残差分位','# Divide the LSTM residual by the EWMA scale and take the standardised residual quantile'),
       'res <- (R[day] - mu_hat) / ew$sigma[day]',
       'res_train <- (R[train_t] - (center + scale * vapply(train_t, function(t) lstm_forward(fit$weights, input_at(t), hidden)$value, numeric(1)))) / ew$sigma[train_t]',
       'zq <- quantile(res_train, 1 - alpha, names = FALSE)',
       'ztail <- mean(res_train[res_train <= zq])',
       'VaR_lstm <- -N * (mu_hat + ew$sigma[day] * zq)',
       'ES_lstm <- -N * (mu_hat + ew$sigma[day] * ztail)'],
      T('LSTM 给出条件均值，尺度仍来自 EWMA；它与 EWMA 的差别只来自均值修正和残差分位，不能宣称它重新刻画了波动率。','The LSTM gives the conditional mean while the scale still comes from EWMA, so its difference from EWMA comes only from the mean correction and the residual quantile; it does not re-model volatility.'));
  }
  const rows=[`  summarise("EWMA-normal", VaR_ewma[day], ES_ewma[day])`,`  summarise("Random forest", VaR_rf, ES_rf)`];
  if(mode==='full')rows.push('  summarise("LSTM + EWMA scale", VaR_lstm, ES_lstm)');
  add('backtest',T('样本外检验与 Kupiec','Out-of-sample check and Kupiec'),
    ['kupiec <- function(x, n, p0) {',
     '  ph <- x / n',
     '  if (x == 0 || x == n) return(c(LR = NA_real_, p = NA_real_, x = x, n = n))',
     '  LR <- 2 * (x * log(ph / p0) + (n - x) * log((1 - ph) / (1 - p0)))',
     '  c(LR = LR, p = pchisq(LR, 1L, lower.tail = FALSE), x = x, n = n)',
     '}',
     'summarise <- function(name, VaR, ES) {',
     '  hit <- loss > VaR',
     '  k <- kupiec(sum(hit), length(loss), 1 - alpha)',
     '  data.frame(model = name, hits = sum(hit), n = length(loss), LR = unname(k["LR"]),',
     '    p = unname(k["p"]), meanVaR = mean(VaR), meanES = mean(ES),',
     '    esBias = if (any(hit)) mean((loss - ES)[hit]) else NA_real_)',
     '}',
     'table_out <- rbind(',
     ...rows.flatMap((r,i)=>i===rows.length-1?[r+')']:[r+',']),
     'print(table_out)', 'cat("target exceedance rate", 1 - alpha, "\\n")'],
    T('三个模型使用同一段样本外日期、同一置信水平和同一本金；Kupiec 只检验无条件覆盖，不检验超限独立性。','All three models use the same out-of-sample days, confidence level and notional; Kupiec only tests unconditional coverage, not exceedance independence.'),
    String.raw`LR_{uc}=2\left[x\log\frac{x/n}{p_0}+(n-x)\log\frac{1-x/n}{1-p_0}\right]`);
  if(mode==='full'){
    add('plot',T('当前主题绘图','Plot for the current view'),
      ['plot(day, loss, type = "l", col = "grey55", xlab = "Day", ylab = "Loss (CNY)",',
       '  main = "Out-of-sample loss and VaR")',
       'lines(day, VaR_ewma[day], lty = 2, col = "purple")',
       'lines(day, VaR_rf, col = "steelblue")',
       ...(mode==='full'?['lines(day, VaR_lstm, lty = 2, col = "darkgreen")']:[]),
       'legend("topright", c("Loss", "EWMA", "Forest", "LSTM"), lty = c(1, 2, 1, 2),',
       '  col = c("grey55", "purple", "steelblue", "darkgreen"), bty = "n")'],
      T('图只画当前 VaR 路径；完整表格在控制台输出，便于逐项核对。','The figure draws the current VaR paths; the full table is printed so every item can be checked.'));
  }
  const chosen=mode==='basic'?blocks.filter(b=>['data','backtest'].includes(b.key)):blocks;
  return{blocks:chosen,script:'# FinModel Lab | Experiment 07 AI risk forecasting\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n',mode,lang};
}
return{build,vec};
});

;

/* Source: risk-ai-ui.js */
/* Experiment07 · AI risk forecasting view (random forest + LSTM).
   Renders into the shared workbench panes and returns the R blocks so the
   existing code pane, navigation and copy button keep working unchanged. */
(()=>{'use strict';
const K=window.LabKit,A=()=>window.RiskAIMath,t=(zh,en)=>K.t(zh,en),$=s=>document.querySelector(s);
const esc=s=>K.esc(s),fmt=(v,d=2)=>Number.isFinite(v)?Number(v).toFixed(d):'—',pct=v=>Number.isFinite(v)?(v*100).toFixed(2)+'%':'—';
const money=v=>Number.isFinite(v)?Number(v).toLocaleString('en-US',{maximumFractionDigits:0}):'—';
const state={ai:{...A().DEFAULTS},built:null,last:null};
function controls(){
  let host=document.querySelector('#riskAIControls');
  const fresh=!host;
  if(fresh){host=document.createElement('section');host.id='riskAIControls';$('#inputs').append(host);}
  host.innerHTML=`<h3>${esc(t('AI 风险预测参数','AI risk parameters'))}</h3>
    <p class="lab-note">${esc(t('目标与其余视图一致：下一期简单收益的损失分位数；所有输入都只用目标日之前的信息，并用同一段样本外窗口检验。','Same target as every other view: the next-period loss quantile. All inputs use only information available before the target day, and every model is checked on the same out-of-sample window.'))}</p>
    ${K.field({id:'aiTrees',zh:'树的数量',en:'Number of trees',value:60,min:10,max:300,step:1})}
    ${K.field({id:'aiDepth',zh:'树深度',en:'Tree depth',value:4,min:2,max:8,step:1})}
    ${K.field({id:'aiLeaf',zh:'叶最小样本',en:'Minimum leaf size',value:8,min:4,max:60,step:1})}
    ${K.field({id:'aiMtry',zh:'每次分裂候选特征',en:'Features per split',value:3,min:1,max:5,step:1})}
    ${K.field({id:'aiWindow',zh:'LSTM 输入窗口',en:'LSTM input window',value:8,min:4,max:20,step:1})}
    ${K.field({id:'aiHidden',zh:'LSTM 隐藏单元',en:'LSTM hidden units',value:4,min:4,max:12,step:1})}
    ${K.field({id:'aiEpochs',zh:'LSTM 训练轮数',en:'LSTM epochs',value:16,min:2,max:40,step:1})}
    ${K.field({id:'aiTrain',zh:'训练期比例',en:'Training share',value:.7,min:.5,max:.85,step:.01})}
    ${K.field({id:'aiSeed',zh:'模拟与训练种子',en:'Simulation and training seed',value:2024,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：随机森林的 VaR 应该比 EWMA 更保守还是更宽松？','Predict first: should the forest VaR be more or less conservative than EWMA?'],
      ['固定种子，只改树的数量或深度，观察 Kupiec 结论会不会翻转。','Hold the seed, change only the number of trees or the depth, and see whether the Kupiec verdict flips.'],
      ['把种子改成 7031，比较同一网格下两种设定的超限次数。','Change the seed to 7031 and compare exceedance counts at the same settings.']])}`;
  if(fresh){
    host.addEventListener('input',()=>{const p=read();if(p){state.ai={...state.ai,...p};draw();}});
    host.addEventListener('change',()=>{const p=read();if(p){state.ai={...state.ai,...p};draw();}});
  }
  syncValues();
  return host;
}
function read(){
  const out={};
  for(const key of Object.keys(A().DEFAULTS)){
    if(['alpha','N'].includes(key))continue;
    const el=$('#lab-'+key);if(!el)continue;
    const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    out[key]=v;
  }
  return out;
}
function syncValues(){
  for(const [key,v] of Object.entries(state.ai)){
    const el=$('#lab-'+key);if(el&&document.activeElement!==el)el.value=v;
  }
}
function syncControls(){
  const host=controls();
  for(const [key,v] of Object.entries(state.ai)){
    const el=$('#lab-'+key);if(el&&document.activeElement!==el)el.value=v;
  }
  return host;
}
function draw(){
  const base=state.base||{};
  const p={...base,...state.ai};
  const host=$('#riskPlot')||document.querySelector('#chartHost');
  host.id='riskPlot';
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  try{
    const q=A().run(p,state.provided||null,{LSTM:window.TimeSeriesLSTM,t});
    state.q=q;
    $('#validation').textContent='';
    $('#copy').disabled=false;
    $('#graphKind').textContent=t('AI 模型 · 同日样本外比较','AI models · same out-of-sample window');
    const rf=q.rf,lstm=q.lstm,ew=q.ewma;
    K.metrics([['超限 / 有效预测（随机森林）','Exceedances (forest)',`${rf.hits} / ${rf.n}`],['Kupiec p（随机森林）','Kupiec p (forest)',fmt(rf.kupiec.p,3)],['平均 VaR（元）','Mean VaR (CNY)',money(rf.meanVaR)]]);
    const labels=q.test.map(r=>String(r.t+1));
    const series=[
      {type:'line',points:q.test.map((r,i)=>[i+1,-p.N*r.r]),color:'#9aa7b0',width:1.4,tip:d=>[`第 ${Math.round(d[0])} 日损失 ${money(-d[1])} 元`,'Loss '+money(-d[1])+' CNY on day '+Math.round(d[0])]},
      {type:'line',points:ew.varPath.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true},
      {type:'line',points:rf.varPath.map((v,i)=>[i+1,v]),color:'#6689a8'},
      ...(lstm?[{type:'line',points:lstm.varPath.map((v,i)=>[i+1,v]),color:'#659b8a',dash:true}]:[])
    ];
    host.querySelector('h3').textContent=t('样本外损失与三种 VaR','Out-of-sample losses against three VaR paths');
    K.chart(host.querySelector('.svg-host'),{series,xLabel:['测试期第几天','Test day'],yLabel:['损失（元）','Loss (CNY)'],
      yTickFormat:v=>money(v),xTickFormat:v=>String(Math.round(v)),aria:['损失与VaR','Losses and VaR']});
    K.legend([['实际损失','Realised loss','#9aa7b0',false],['EWMA 正态 VaR','EWMA-normal VaR','#9b88ac',true],['随机森林 VaR','Forest VaR','#6689a8',false],...(lstm?[['LSTM+EWMA 尺度 VaR','LSTM with EWMA scale','#659b8a',true]]:[])]);
    const rows=[[t('EWMA 正态','EWMA-normal'),ew],...(lstm?[[t('LSTM + EWMA 尺度','LSTM + EWMA scale'),lstm]]:[]),[t('随机森林','Random forest'),rf]].map(([name,r])=>[name,`${r.hits} / ${r.n}`,fmt(r.kupiec.p,3),money(r.meanVaR),money(r.meanES),Number.isFinite(r.esBias)?money(r.esBias):'—']);
    K.details(K.table([['模型','Model'],['超限/有效','Hit / valid'],['Kupiec p','Kupiec p'],['平均 VaR（元）','Mean VaR'],['平均 ES（元）','Mean ES'],['ES 偏差（元）','ES bias']],rows)+
      `<p class="chart-note">${esc(t('随机森林直接估计（1−α）条件分位；LSTM 预测条件均值，再乘 EWMA 尺度与标准化残差分位。两者与 EWMA 使用同一段样本、同一置信水平与同一天。','The forest estimates the (1−α) conditional quantile directly; the LSTM forecasts the conditional mean and scales it by EWMA volatility and a standardised-residual quantile. All three use the same sample, confidence level and days as EWMA.'))}</p>`+
      `<details><summary>${esc(t('方法、假设与不能说的话','Method, assumptions and what cannot be claimed'))}</summary><p>${esc(t('教学样本由固定种子生成：GARCH(1,1) 波动聚集加偶发跳跃，因此它是随机而非确定性的；其余五个视图使用的固定模数序列含确定性周期，树模型会记住它而不是学到风险动态，所以本视图单独设定样本并在页面注明。','The teaching sample is generated from a fixed seed: GARCH(1,1) volatility clustering plus occasional jumps, so it is stochastic rather than deterministic. The fixed modular series used by the other five views contains a deterministic cycle that a tree would memorise instead of learning risk dynamics, so this view sets its own sample and says so.'))}</p><p>${esc(t('树的数量、深度与种子都会改变超限次数：这说明尾部估计本身有抽样不确定性。单次 Kupiec 不拒绝，不等于模型已被证明准确；不拒绝也不等于可以用于真实头寸限额。','The number of trees, the depth and the seed all change the exceedance count, which shows that the tail estimate itself carries sampling uncertainty. A Kupiec test that fails to reject does not prove the model is accurate, and it does not license real position limits.'))}</p></details>`+
      (lstm?'':`<p class="chart-note">${esc(q.lstmError||'')}</p>`));
    state.built={blocks:window.RiskAICode.build(p,q,state.mode||'full',K.lang()).blocks,script:window.RiskAICode.build(p,q,state.mode||'full',K.lang()).script};
    return state.built;
  }catch(e){
    state.built=null;
    $('#validation').textContent=e.message;
    $('#metrics').innerHTML='';$('#legend').innerHTML='';
    K.details(`<p role="alert">${esc(e.message)}</p>`);
    host.querySelector('.svg-host').innerHTML='';
    return null;
  }
}
function render({base,provided,mode,selected}){
  state.base=base;state.provided=provided;state.mode=mode;
  const cur=document.querySelector('#riskAIControls')?read():null;
  if(cur)state.ai={...state.ai,...cur};
  const host=syncControls();
  $('#riskViews')?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView==='ai')));
  for(const id of ['#riskMethods','#riskChartModes','#riskDynamicModels','#riskExplore','#riskData','#riskAdvanced','#riskGarchFields','#riskBackModelField','#riskGarchModeField']){
    const el=$(id);if(el)el.hidden=true;
  }
  const inputs=$('#inputs');
  for(const child of inputs.children)if(child!==host)child.hidden=true;
  host.hidden=false;
  const root=host.querySelector('h3');if(root)root.textContent=t('AI 风险预测参数','AI risk parameters');
  const out=draw();
  if(!out)return {blocks:[],script:''};
  return out;
}
window.RiskAIView={render,state};
})();

;

/* Source: risk-qr-math.js */
/* Experiment07 拓展 · 第2节 分位数回归与 VaR/ES（课件 7.2）。
   线性分位数回归用 MM-IRLS 求解（基 R 亦可复现），条件分位数直接给出 VaR。
   目标、时点与样本外检验与其余风险视图一致。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats,typeof module==='object'?require('./risk-math'):root.RiskMath);if(typeof module==='object')module.exports=api;else root.RiskQRMath=api;})(this,(S,Risk)=>{
'use strict';
const defaults=Object.freeze({alpha:.95,N:1e6,n:600,seed:2024,aiTrain:.7,tau:null});
function check(p){
  if(!(p.alpha>0&&p.alpha<1))throw Error('置信水平须在 0 与 1 之间。');
  if(!(p.N>0&&p.N<=1e12))throw Error('名义本金须为正且不超过 1e12 元。');
  if(!Number.isInteger(p.n)||p.n<200||p.n>2000)throw Error('样本量须为 200–2000 的整数。');
  if(!(p.aiTrain>=.5&&p.aiTrain<=.85))throw Error('训练比例须为 0.50–0.85。');
  if(!Number.isInteger(p.seed)||p.seed<1||p.seed>99999999)throw Error('随机种子须为 1–99999999 的整数。');
  return true;
}
/* GARCH(1,1) 波动聚集 + 偶发跳跃的教学样本（确定性）。 */
function sample(p){
  check(p);
  const rng=S.prng(p.seed),r=[],a=.10,b=.85,target=.011**2,omega=target*(1-a-b);
  let v=target;
  for(let i=0;i<p.n;i++){
    v=omega+a*(i?r[i-1]**2:target)+b*v;
    const jump=rng()<.015?2.5:1;
    r.push(Math.sqrt(v)*rng.normal(0,1)*jump);
  }
  return r;
}
function design(r){
  const out=[];let v=null;
  for(let i=2;i<r.length;i++){
    if(v===null){let s=0;for(let j=0;j<i;j++)s+=r[j]*r[j];v=s/i;}
    else v=.94*v+.06*r[i-1]*r[i-1];
    out.push({t:i,y:r[i],x:[1,r[i-1],Math.abs(r[i-1]),Math.log(Math.sqrt(v)+1e-12)]});
  }
  return out;
}
/* MM-IRLS：用 |残差| 的倒数为权重做加权最小二乘，反复迭代逼近分位数回归解。 */
function qreg(rows,tau,iter=40){
  const X=rows.map(d=>d.x),y=rows.map(d=>d.y),k=X[0].length;
  let beta=new Array(k).fill(0);
  for(let it=0;it<iter;it++){
    const A=Array.from({length:k},()=>Array(k).fill(0)),g=new Array(k).fill(0);
    for(let i=0;i<X.length;i++){
      const e=y[i]-X[i].reduce((s,v,j)=>s+v*beta[j],0);
      const w=Math.max(1e-8,(e>0?tau:1-tau)/Math.max(1e-8,Math.abs(e)));
      for(let a=0;a<k;a++){g[a]+=w*X[i][a]*e;for(let b=0;b<k;b++)A[a][b]+=w*X[i][a]*X[i][b];}
    }
    for(let a=0;a<k;a++)A[a][a]+=1e-10;
    const next=S.solve(A,g).map((v,j)=>beta[j]+v);
    const delta=Math.max(...next.map((v,j)=>Math.abs(v-beta[j])));
    beta=next;
    if(delta<1e-10)break;
  }
  const resid=y.map((v,i)=>v-X[i].reduce((s,val,j)=>s+val*beta[j],0));
  return{beta,resid};
}
function kupiec(x,n,p0){
  if(!(n>0))return{LR:NaN,p:NaN,x,n,p0};
  const ph=x/n;
  if(ph===0||ph===1)return{LR:NaN,p:NaN,x,n,p0,ph};
  const LR=2*(x*Math.log(ph/p0)+(n-x)*Math.log((1-ph)/(1-p0)));
  return{LR,p:S.chi2Pvalue(LR,1),x,n,p0,ph};
}
function run(p){
  check(p);
  const tau=1-p.alpha,R=sample(p),rows=design(R);
  const nt=Math.floor(rows.length*p.aiTrain),train=rows.slice(0,nt),test=rows.slice(nt);
  const fit=qreg(train,tau);
  /* 残差尾部分位数用于 ES（等价于对条件分布尾部取均值）。 */
  const eSorted=S.sorted(fit.resid),eQ=S.quantile(fit.resid,tau);
  const tail=fit.resid.filter(v=>v<=eQ),tailMean=tail.length?S.mean(tail):eQ;
  const pred=test.map(d=>d.x.reduce((s,v,j)=>s+v*fit.beta[j],0));
  const actual=test.map(d=>d.y);
  const VaR=pred.map(q=>-p.N*q),ES=pred.map(q=>-p.N*(q+tailMean));
  const loss=actual.map(r=>-p.N*r);
  const hit=loss.filter((l,i)=>l>VaR[i]).length;
  /* 对照：EWMA 正态（同一段日期、同一 α 与本金）。 */
  const k0=Math.max(20,Math.min(nt+2,120)),ew=Risk.ewma(R,p.alpha,p.N,.94,k0);
  const varE=[],esE=[];
  for(const d of test){varE.push(ew.VaR[d.t]);esE.push(ew.ES[d.t]);}
  const hitE=loss.filter((l,i)=>l>varE[i]).length;
  return{tau,R,rows,nt,test,pred,actual,VaR,ES,loss,beta:fit.beta,resid:fit.resid,tailMean,
    hits:hit,n:test.length,kupiec:kupiec(hit,test.length,tau),
    ewma:{varPath:varE,esPath:esE,hits:hitE,n:test.length,kupiec:kupiec(hitE,test.length,tau),meanVaR:S.mean(varE),meanES:S.mean(esE)},
    meanVaR:S.mean(VaR),meanES:S.mean(ES),trainN:train.length};
}
function build(p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const num=v=>{const x=String(Number(v));return /e/i.test(x)?Number(v).toPrecision(15).replace(/0+e/,'e'):x;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  add('data',T('数据与条件分位数目标','Data and the conditional quantile target'),
    ['# Experiment 07.2 | quantile regression VaR | base R only',
     T('# 固定种子的合成日收益（GARCH 波动聚集 + 偶发跳跃）；非真实行情','# Synthetic daily returns from a fixed seed (GARCH clustering plus jumps); not a market quote'),
     `R <- ${vec(q.R)}`,`N <- ${num(p.N)}`,`alpha <- ${num(p.alpha)}`,`tau <- 1 - alpha`,
     T('# 设计矩阵：截距、滞后收益、绝对滞后收益、对数 EWMA 波动率','# Design: intercept, lagged return, |lagged return|, log EWMA volatility'),
     'n <- length(R)',
     T('# 与页面一致的 EWMA 方差：前两期用样本均值，之后 λ=0.94 递推','# Same EWMA variance as the page: sample mean for the first two days, then lambda = 0.94'),
     'vv <- numeric(n); vv[3] <- mean(R[1:2]^2)',
     'for (i in 4:n) vv[i] <- 0.94*vv[i-1] + 0.06*R[i-1]^2',
     T('# 第 1、2 个观测没有完整的滞后与波动信息，从第 3 个观测开始（与页面一致）','# The first two observations lack a complete lag and volatility history; start at observation 3 as the page does'),
     'idx <- 3:n',
     'X <- cbind(1, R[idx - 1L], abs(R[idx - 1L]), log(sqrt(vv[idx]) + 1e-12))',
     'y <- R[idx]',
     'stopifnot(all(is.finite(X)), all(is.finite(y)))'],
    T('分位数回归直接估计条件分位数，不需要正态假设；代价是尾部估计更依赖样本量与模型设定。','Quantile regression estimates a conditional quantile directly with no normality assumption; the cost is more dependence on sample size and specification.'),
    String.raw`\hat Q_\tau(r_t\mid x_t)=x_t'\hat\beta(\tau),\quad \hat\beta=\arg\min\sum\rho_\tau(r_t-x_t'b)`);
  add('fit',T('MM-IRLS 求解与 Kupiec','MM-IRLS fit and Kupiec'),
    [T('# 用 |残差| 的倒数加权，反复求解加权最小二乘','# Weight by the inverse absolute residual and iterate weighted least squares'),
     'qfit <- function(X, y, tau, iter = 40L) {',
     '  b <- rep(0, ncol(X))',
     '  for (it in seq_len(iter)) {',
     '    e <- y - as.vector(X %*% b)',
     '    w <- pmax(1e-8, (ifelse(e > 0, tau, 1 - tau)) / pmax(1e-8, abs(e)))',
     '    A <- crossprod(X * sqrt(w))',
     '    g <- crossprod(X * w, e)',
     '    step <- solve(A, g)',
     '    b <- b + as.vector(step)',
     '    if (max(abs(step)) < 1e-10) break',
     '  }',
     '  list(beta = b, resid = y - as.vector(X %*% b))',
     '}',
     T('# 只用训练期估计，测试期留作样本外检验（与页面同一比例）','# Estimate on the training period only and keep the rest for out-of-sample checks'),
     `ntr <- floor(nrow(X) * ${num(p.aiTrain)})`,
     'fit <- qfit(X[seq_len(ntr), , drop = FALSE], y[seq_len(ntr)], tau)',
     'print(fit$beta)',
     T('# 条件 VaR 与 ES；ES 用残差尾部的均值平移','# Conditional VaR and ES; ES shifts by the mean of the residual tail'),
     'e_q <- quantile(fit$resid, tau, type = 7)',
     'tail_mean <- mean(fit$resid[fit$resid <= e_q])',
     'test <- seq.int(ntr + 1L, nrow(X))',
     'q_hat <- as.vector(X[test, , drop = FALSE] %*% fit$beta)',
     'VaR <- -N * q_hat; ES <- -N * (q_hat + tail_mean)',
     'kupiec <- function(x, n, p0) { ph <- x/n;',
     '  if (ph == 0 || ph == 1) return(c(LR = NA, p = NA))',
     '  LR <- 2*(x*log(ph/p0) + (n-x)*log((1-ph)/(1-p0)))',
     '  c(LR = LR, p = pchisq(LR, 1L, lower.tail = FALSE)) }',
     'hit <- (-N*y[test]) > VaR',
     'print(c(hits = sum(hit), n = length(test), kupiec(sum(hit), length(test), tau)))'],
    T('Kupiec 只检验无条件覆盖；通过不证明模型正确，不通过说明该置信水平下尾部刻画有偏差。','Kupiec tests unconditional coverage only; passing does not prove the model, and failing means the tail is mis-specified at that level.'));
  add('plot',T('条件 VaR 与已实现损失','Conditional VaR against realised losses'),
    ['test <- seq.int(floor(nrow(X) * 0.7) + 1L, nrow(X))',
     'plot(test, -N*y[test], type = "l", col = "grey55", xlab = "day", ylab = "loss (CNY)",',
     '  main = "QR-VaR vs realised loss")',
     'lines(test, VaR[test], col = "steelblue")',
     'legend("topright", c("loss", "QR-VaR"), lty = 1, col = c("grey55","steelblue"), bty = "n")'],
    T('图只画条件 VaR 与已实现损失；ES 与 Kupiec 结果在控制台输出。','The figure draws the conditional VaR and the realised loss; ES and Kupiec are printed.'));
  return{blocks,code:'# FinModel Lab | Experiment 07.2\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,sample,design,qreg,run,build,kupiec};
});

;

/* Source: risk-qr-view.js */
/* Experiment07 拓展视图：分位数回归 VaR（7.2）。挂在风险工作台内。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.RiskQRMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.RiskQRMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#riskQRControls');
  if(!host){host=document.createElement('section');host.id='riskQRControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('分位数回归参数','Quantile-regression parameters'))}</h3>
    <p class="lab-note">${K.esc(t('直接用滞后收益、绝对滞后收益与对数 EWMA 波动率解释条件分位数；τ=1−α 时拟合值就是条件 VaR。','The conditional quantile is explained by the lagged return, its absolute value and log EWMA volatility; at τ = 1−α the fitted value is the conditional VaR.'))}</p>
    ${K.field({id:'alpha',zh:'置信水平 α',en:'Confidence level α',value:p.alpha,min:.9,max:.999,step:.001})}
    ${K.field({id:'N',zh:'名义本金（元）',en:'Notional (CNY)',value:p.N,min:1,max:1e9,step:1e4})}
    ${K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:200,max:2000,step:50})}
    ${K.field({id:'aiTrain',zh:'训练期比例',en:'Training share',value:p.aiTrain,min:.5,max:.85,step:.01})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：分位数回归的 VaR 曲线应该比 EWMA 更平滑还是更跳跃？','Predict first: should the quantile-regression VaR be smoother or jumpier than EWMA?'],
      ['把 α 从 95% 调到 99%，观察超限次数与 Kupiec 结论如何变化。','Move α from 95% to 99% and watch the exceedances and the Kupiec verdict.'],
      ['改变训练比例，比较条件分位数的稳定性。','Change the training share and compare the stability of the conditional quantile.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#riskQRControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,''),v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const p=state.p,host=$('#riskPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=host.querySelector('.svg-host');
  host.querySelector('h3').textContent=t('条件 VaR 与已实现损失','Conditional VaR and realised losses');
  try{
    const q=M().run(p);state.last=q;
    const step=Math.max(1,Math.floor(q.n/300));
    K.chart(svg,{xLabel:['样本外第几天','Out-of-sample day'],yLabel:['损失（元）','Loss (CNY)'],
      yTickFormat:v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:0}),
      series:[{type:'line',points:q.loss.map((v,i)=>[i+1,v]),color:'#9aa7b0',width:1.3},
        {type:'line',points:q.VaR.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 天：QR-VaR ${Number(d[1]).toFixed(0)} 元`,'Day '+Math.round(d[0])+': QR-VaR '+Number(d[1]).toFixed(0)]},
        {type:'line',points:q.ewma.varPath.map((v,i)=>[i+1,v]),color:'#9b88ac',dash:true}],
      aria:['QR-VaR 与损失','QR-VaR and losses']});
    K.metrics([['QR 超限 / 有效','QR hits',`${q.hits} / ${q.n}`],['Kupiec p（QR）','Kupiec p (QR)',Number.isFinite(q.kupiec.p)?q.kupiec.p.toFixed(3):'—'],['平均 VaR（元）','Mean VaR',Number(q.meanVaR).toFixed(0)]]);
    K.legend([['实际损失','Realised loss','#9aa7b0',false],['分位数回归 VaR','Quantile-regression VaR','#6689a8',false],['EWMA 正态 VaR','EWMA-normal VaR','#9b88ac',true]]);
    K.details(K.table([['模型','Model'],['超限/有效','Hit / valid'],['Kupiec p','Kupiec p'],['平均 VaR（元）','Mean VaR'],['平均 ES（元）','Mean ES']],[
      [t('分位数回归','Quantile regression'),`${q.hits} / ${q.n}`,Number.isFinite(q.kupiec.p)?q.kupiec.p.toFixed(3):'—',Number(q.meanVaR).toFixed(0),Number(q.meanES).toFixed(0)],
      [t('EWMA 正态','EWMA-normal'),`${q.ewma.hits} / ${q.ewma.n}`,Number.isFinite(q.ewma.kupiec.p)?q.ewma.kupiec.p.toFixed(3):'—',Number(q.ewma.meanVaR).toFixed(0),Number(q.ewma.meanES).toFixed(0)]])+
      `<p class="chart-note">${K.esc(t('系数（截距、滞后收益、绝对滞后收益、对数波动率）：','Coefficients (intercept, lagged return, |lagged return|, log volatility): '))}${q.beta.map(v=>v.toFixed(4)).join(', ')}`+
      ` ${K.esc(t('训练期 ','training period '))}${q.trainN}${K.esc(t(' 个观测；Kupiec 只检验无条件覆盖。',' observations; Kupiec tests unconditional coverage only.'))}</p>`);
    $('#validation').textContent='';
    state.built=M().build(p,q,K.lang());
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,mode,onBuilt}){
  state.mode=mode;
  controls();
  const host=$('#riskQRControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.RiskQRView={render,state};
})();

;

/* Source: risk-workbench.js */
(()=>{'use strict';const M=RiskMath,C=RiskFinalCode,X=RiskExtended,$=s=>document.querySelector(s),esc=s=>WorkbenchUI.esc(String(s)),money=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:2}),pct=x=>(x*100).toFixed(3)+'%';
function mount(){CourseExperiments.mount('var');document.body.classList.add('risk-workbench');let p={...M.defaults,...X.defaults,h0:.0001},view='basic',method='historical',chart='var',mode='full',selected='historical',focusLine=null,built,valid=true,zoom=false,dataset=null,dynamic='ewma',backModel='ewma',garchMode='teaching',initialMode='sample',parameterLayout='';
const views=document.createElement('div');views.id='riskViews';views.innerHTML='<button data-risk-view="basic" aria-pressed="true">基础风险计量</button><button data-risk-view="dynamic">动态风险预测</button><button data-risk-view="evt">极端损失分析</button><button data-risk-view="backtest">风险模型回测</button><button data-risk-view="ai">AI 风险预测</button><button data-risk-view="qr">分位数回归 VaR</button>';$('.model-panel .panel-head').after(views);
const question=document.createElement('p');question.id='riskQuestion';views.after(question);const methods=document.createElement('div');methods.id='riskMethods';methods.innerHTML='<button data-risk-method="historical">历史模拟法</button><button data-risk-method="normal">正态参数法</button><button data-risk-method="compare">两种方法比较</button>';question.after(methods);
const chartModes=document.createElement('div');chartModes.id='riskChartModes';chartModes.innerHTML='<button data-risk-chart="var">VaR预测</button><button data-risk-chart="es">ES预测</button><button data-risk-chart="volatility">波动率</button>';$('#chartHost').before(chartModes);
$('#inputs').innerHTML=[['lambda','EWMA衰减系数λ'],['alpha','置信水平α（0.95=95%）'],['N','名义本金（元）']].map(([k,l])=>field(k,l)).join('')+'<div id="riskLambdaChoices"><button data-lambda="0.9">λ=0.90</button><button data-lambda="0.94">λ=0.94</button><button data-lambda="0.98">λ=0.98</button><p>0.94是日度RiskMetrics经典教学参数，不是普遍最优值。常用范围0.80–0.99；可输入其他0&lt;λ&lt;1。</p></div>';
function field(k,l){return `<label id="risk-field-${k}"><span>${l}</span><input id="input-${k}" type="number" step="${['n','window'].includes(k)?'1':'any'}" value="${p[k]}"></label>`;}
const sub=document.createElement('div');sub.id='riskDynamicModels';sub.innerHTML='<button data-dynamic="ewma">EWMA</button><button data-dynamic="garch">GARCH</button><button data-dynamic="compare">模型比较</button>';methods.after(sub);
const modelField=document.createElement('label');modelField.id='riskBackModelField';modelField.innerHTML='样本外预测模型<select id="riskBackModel"><option value="historical">历史法</option><option value="normal">正态法</option><option value="ewma" selected>EWMA</option><option value="garch">GARCH固定教学参数</option><option value="garchFit">GARCH训练期估计参数</option></select>';$('#inputs').append(modelField);
const fitMode=document.createElement('label');fitMode.id='riskGarchModeField';fitMode.innerHTML='GARCH模式<select id="riskGarchMode"><option value="teaching">教学参数</option><option value="estimate">样本估计</option></select>';$('#inputs').append(fitMode);
const gfields=document.createElement('details');gfields.id='riskGarchFields';gfields.innerHTML='<summary>GARCH教学参数（非样本估计）</summary>'+[['omega','基础方差ω'],['a','冲击权重a（区别于置信水平）'],['b','方差持续权重b']].map(([k,l])=>field(k,l)).join('')+'<label id="riskInitialModeField">初始化方差<select id="riskInitialMode"><option value="sample">前k期样本方差</option><option value="custom">指定教学初始方差</option></select></label>'+field('h0','指定初始方差（收益小数²）')+'<p>ω>0、a≥0、b≥0、a+b<1。初始化使用前k期样本方差；长期方差ω/(1−a−b)另行说明。样本估计模式使用训练数据真实拟合，不使用这些输入值。</p>';$('#inputs').append(gfields);
$('#inputs').insertAdjacentHTML('beforeend',field('threshold','POT阈值的经验分位（0.50–0.98）')+field('train','训练期观测数（至少30，检验至少20）'));
const dataUI=document.createElement('details');dataUI.id='riskData';dataUI.innerHTML='<summary>本地CSV与数据来源</summary><p>CSV两列：date,return 或 date,price；日期YYYY-MM-DD。仅在浏览器处理；50–2000个收益观测。拒绝缺失、重复日期、非法数值，自动升序。</p><label>类型<select id="riskCSVKind"><option value="simple">简单收益</option><option value="log">对数收益→expm1</option><option value="price">价格→相邻简单收益</option></select></label><label>收益单位<select id="riskCSVUnit"><option value="decimal">小数（0.01=1%）</option><option value="percent">百分数（1=1%）</option></select></label><label>资产／市场／来源／频率说明<input id="riskSource" type="text" placeholder="由用户提供，未核实市场来源"></label><input id="riskCSV" type="file" accept=".csv,text/csv"><button id="riskExport">导出当前收益CSV</button><button id="riskSynthetic">恢复合成教学数据</button><p id="riskDataNote"></p><p id="riskCSVError" role="alert"></p>';$('#inputs').after(dataUI);
const advanced=document.createElement('details');advanced.id='riskAdvanced';advanced.innerHTML='<summary>高级参数 · 合成数据与初始化</summary>'+[['n','样本量n（50–2000）'],['mu','生成均值基准（每日小数）'],['scale','生成尺度（0–0.05）'],['window','初始化窗口（2至n−1）']].map(([k,l])=>field(k,l)).join('')+'<p>合成教学数据，非真实市场行情。生成参数不等于正态样本估计或EWMA训练均值；无随机重抽样。</p>';dataUI.after(advanced);
const exploration=document.createElement('section');exploration.id='riskExplore';exploration.innerHTML='<h3>可选探索</h3><p>较大损失冲击之后，下一日的风险预测怎样变化？保持样本，比较λ=0.90、0.94、0.98。</p><button id="riskShock">观察最大平方冲击附近</button><button id="riskWhole">查看完整样本</button>';advanced.after(exploration);$('.learning').hidden=true;
$('#assumptionSummary').innerHTML='<span>单日简单收益</span><span>合成教学数据</span><span>完整R复现</span>';$('#assumptions').textContent='损失L=−N×R，正数亏损、负数盈利。历史VaR用quantile(type=1)，ES是精确最坏1−α概率质量的加权均值；正态法使用同一样本的均值与n−1标准差。EWMA固定使用前k日均值及样本方差，第k+1日才开始事前预测；当单期收益只更新下一日方差。条件正态、固定本金、单日预测，不进行平方根多日缩放。GARCH可选教学参数与训练期条件高斯样本估计；POT-GPD为静态尾部拟合，限定正则形状搜索域；回测训练后固定静态参数，动态模型顺序更新。Kupiec只检验无条件覆盖；ES仅作描述性诊断。';
$('#chartHost').className='risk-chart';$('#chartHost').innerHTML='<div id="riskPlot"></div><div id="riskTip" class="chart-tooltip" hidden></div>';const interaction=ChartInteraction.create((text,state)=>{const tip=$('#riskTip');tip.hidden=!text;tip.dataset.state=state;if(text){tip.innerHTML='<button id="riskCloseTip" aria-label="关闭详情">×</button>'+esc(text);$('#riskCloseTip').onclick=()=>interaction.clear();}});$('#riskPlot').onclick=e=>{if(!e.target.closest('[data-risk-tip]'))interaction.clear();};
const nav=document.createElement('nav');nav.id='riskCodeNav';nav.setAttribute('aria-label','R代码段落导航');$('.code-toolbar').after(nav);
function render(){interaction.clear();interaction.redraw(()=>false);
 if(view==='qr'){
  if(!window.RiskQRView)throw Error('分位数回归视图未加载。');
  const out=window.RiskQRView.render({p,mode,onBuilt:c=>{built={blocks:c.blocks,code:c.code};valid=true;$('#copy').disabled=false;renderCode();}});
  $('#riskQuestion').textContent=window.LabKit.t('分位数回归：条件分位数能否比正态假设更贴近尾部？','Quantile regression: can a conditional quantile track the tail better than normality?');
  $('#assumptionSummary').innerHTML=[['条件分位数','Conditional quantile'],['同一段样本外','Same out-of-sample window'],['完整 Base R','Full base R']].map(x=>'<span>'+window.LabKit.t(x[0],x[1])+'</span>').join('');
  document.body.classList.remove('risk-dynamic');
  views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView==='qr')));
  if(!out)return;
  return;
 }
 if(view==='ai'){
  if(!window.RiskAIView)throw Error('AI 风险视图未加载。');
  const out=window.RiskAIView.render({base:p,provided:dataset?.R,mode,selected});
  built={blocks:out.blocks,script:out.script};valid=true;$('#validation').textContent='';$('#copy').disabled=false;
  $('#riskQuestion').textContent=window.LabKit.t('AI 风险预测：条件分位是否比正态假设更贴近实际损失？','AI risk forecast: is the conditional quantile closer to realised losses than the normal assumption?');
  $('#assumptionSummary').innerHTML=[['下一期简单收益','Next-period simple return'],['统一目标与时点','One target and time point'],['同一样本外窗口','Same out-of-sample window']].map(s2=>'<span>'+window.LabKit.t(s2[0],s2[1])+'</span>').join('');
  $('#assumptions').textContent=window.LabKit.t('随机森林直接估计 (1−α) 条件分位；LSTM 估计条件均值并乘 EWMA 尺度与标准化残差分位。三者与 EWMA 使用同一样本、同一置信水平与同一天。树的数量、深度与随机种子都会改变超限次数；Kupiec 只检验无条件覆盖，不检验超限独立性。教学样本为固定种子生成的合成数据，不是真实行情。','The forest estimates the (1−α) conditional quantile directly; the LSTM estimates the conditional mean and scales it by EWMA volatility and a standardised-residual quantile. All three use the same sample, the same confidence level and the same days as EWMA. The number of trees, the depth and the seed all change the exceedance count; Kupiec tests unconditional coverage only, not exceedance independence. The teaching sample is synthetic with a fixed seed, not a market quote.');
  document.body.classList.remove('risk-dynamic');
  views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView==='ai')));
  renderCode();return;
 }
 const aic=$('#riskAIControls');if(aic)aic.hidden=true;
 const qrc=$('#riskQRControls');if(qrc)qrc.hidden=true;
 for(const child of $('#inputs').children)child.hidden=false;
 if(!$('#riskPlot')){$('#chartHost').className='risk-chart';$('#chartHost').innerHTML='<div id="riskPlot"></div><div id="riskTip" class="chart-tooltip" hidden></div>';}
 try{const next=Object.fromEntries(Object.keys({...M.defaults,...X.defaults,h0:.0001}).map(k=>[k,$('#input-'+k).value.trim()===''?NaN:Number($('#input-'+k).value)]));M.settings(next);p=next;built=C.build(p,view,method,chart,mode,dataset?.R,{dynamic,backModel,dates:dataset?.dates,source:$('#riskSource').value,garchMode,initialMode});if(view==='backtest'&&built.error)throw Error(built.error);valid=true;$('#validation').textContent='';$('#copy').disabled=false;}catch(error){valid=false;$('#copy').disabled=true;$('#validation').textContent=error.message+' 当前结果已清空，请修正。';$('#metrics').innerHTML='<p role="alert">当前输入无法生成有效结果</p>';$('#riskPlot').innerHTML='<p class="risk-empty">'+esc(error.message)+'</p>';$('#legend').innerHTML='';$('#details').innerHTML='<p>没有保留旧风险值或旧Kupiec检验，也没有替代预测。</p>';$('#codeNotice').textContent='当前输入无效；复制停用，修正后更新完整脚本';$('#explanation').textContent=error.message;methods.hidden=view!=='basic';sub.hidden=view!=='dynamic';chartModes.hidden=view!=='dynamic';views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView===view)));organizeParameters();return;}
const q=built.q,e=built.e,isDynamic=view==='dynamic';document.body.classList.toggle('risk-dynamic',isDynamic);$('#riskQuestion').textContent=isDynamic?'为什么市场冲击后，下一观测期的风险预测会变化？':'下一观测期，投资组合可能损失多少？';$('#graphKind').textContent='单期 · '+(dataset?'用户导入数据':'合成教学数据，非真实行情');$('#assumptionSummary').innerHTML='<span>单期简单收益</span><span>'+(dataset?'用户导入数据':'合成教学数据')+'</span><span>完整R复现</span>';$('#riskDataNote').textContent=dataset?dataset.note:'固定合成收益样本，不因模型或置信水平变化重抽样。';$('#riskBackModelField').hidden=view!=='backtest';$('#risk-field-train').hidden=view!=='backtest';$('#risk-field-threshold').hidden=view!=='evt';gfields.hidden=!(isDynamic||view==='backtest');sub.hidden=!isDynamic;sub.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dynamic===dynamic)));$('#risk-field-lambda').hidden=$('#riskLambdaChoices').hidden=!(isDynamic||view==='backtest');for(const k of ['n','mu','scale'])$('#input-'+k).disabled=!!dataset;methods.hidden=view!=='basic';chartModes.hidden=!isDynamic;$('#risk-field-window').hidden=!isDynamic;exploration.hidden=!isDynamic;
views.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskView===view)));methods.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskMethod===method)));chartModes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.riskChart===chart)));document.querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===mode)));
const value=isDynamic?[e.latest.VaR,e.latest.ES]:method==='normal'?[q.nVaR,q.nES]:[q.hVaR,q.hES],prefix=isDynamic?'下一日EWMA':method==='normal'?'正态':'历史';$('#metrics').innerHTML=`<div><span>${prefix} VaR（元）</span><b>${money(value[0])}</b></div><div><span>${prefix} ES（元）</span><b>${money(value[1])}</b></div>`;
if(view==='basic'&&method==='compare')$('#metrics').innerHTML=compareTable(q);
const legend=RiskFinalCharts.render($('#riskPlot'),{view,method,chart,p,q,e,g:built.g,fitError:built.fitError,ev:built.ev,bt:built.bt,dynamic,backModel,dates:dataset?.dates,zoom},interaction);$('#legend').innerHTML=legend.map((l,i)=>l.tip?`<button data-risk-legend="${i}"><i class="${l.key?.endsWith('ES')?'risk-es-symbol':''}" style="--legend-color:${l.color}"></i>${l.label}</button>`:`<span>${l.label}</span>`).join('');$('#legend').querySelectorAll('[data-risk-legend]').forEach(el=>interaction.bind(el,legend[+el.dataset.riskLegend].tip));
if(isDynamic){const shock=e.shock;$('#details').innerHTML=`<p id="riskInsight">最新为第${e.n+1}日、只用截至第${e.n}日信息：单期标准差${pct(e.latest.sigma)}，条件均值${pct(e.mu)}。预测风险不是已实现损失；ES也不是逐日损失上界。</p><p id="riskTiming">前${e.k}日初始化，无预测；第${e.k+1}日方差=${e.initial.toPrecision(7)}，来自前${e.k}日样本方差。先预测第t日，再观察R[t]并更新第t+1日。</p><details id="riskRecursion"><summary>当前样本的冲击与逐期递推</summary><p>第${shock.day}单期收益${pct(shock.return)}；其事前方差${shock.before.toPrecision(7)}。观察后下一日方差 = λ×旧方差 + (1−λ)×平方冲击 = ${shock.oldWeight.toPrecision(7)} + ${shock.newWeight.toPrecision(7)} = ${shock.after.toPrecision(7)}。</p><p>λ=${p.lambda}：历史方差权重${pct(p.lambda)}、最近平方冲击权重${pct(1-p.lambda)}。λ较小通常响应更快，较大通常更平滑；不同λ下不能断言所有时期的VaR谁更高。改变λ不改变原收益样本。</p></details><details><summary>与静态风险估计比较</summary>${compareTable(q)}<p>下一日EWMA：VaR ${money(e.latest.VaR)}元，ES ${money(e.latest.ES)}元。相同本金、置信水平、单日期限；静态结果估计全窗口分布，EWMA是下一期条件预测，未经样本外检验不能判断谁更可靠。</p></details><p class="risk-note">仅为当前数据上的条件正态教学预测，未验证真实市场预测能力；动态页的实际损失线不自动构成样本外检验，请切换回测视图。</p>`;
}else{$('#details').innerHTML=`<p id="riskInsight">${method==='normal'?'正态法把同一样本拟合成正态分布，估计的单期收益均值为'+pct(q.meanReturn)+'、样本标准差为'+pct(q.sdReturn)+'，不是生成参数。':method==='compare'?'VaR较高的是'+(q.hVaR>q.nVaR?'历史法':q.hVaR<q.nVaR?'正态法':'两法相同')+'；ES较高的是'+(q.hES>q.nES?'历史法':q.hES<q.nES?'正态法':'两法相同')+'。经验分布与正态假设不同；较高不代表更准确。':'VaR是'+pct(p.alpha)+'置信水平的损失阈值；ES是最严重'+pct(1-p.alpha)+'尾部的平均损失。绿色深色部分按精确尾部概率分摊。'} 每根柱子表示该损失范围的历史出现情况，右侧深色表示最严重尾部。VaR不是最多只会亏这么多，ES不是另一个分位阈值。</p><table id="riskComparison"><thead><tr><th>方法</th><th>VaR（元）</th><th>ES（元）</th></tr></thead><tbody><tr><th>历史法</th><td>${money(q.hVaR)}</td><td>${money(q.hES)}</td></tr><tr><th>正态法</th><td>${money(q.nVaR)}</td><td>${money(q.nES)}</td></tr></tbody></table><p id="riskTail">最坏${pct(1-p.alpha)}的尾部质量等效${q.tailCount.toFixed(3)}个观测。${q.tailCount<10?'尾部可用样本质量较少，经验VaR/ES可能不稳定；显示的小数不是预测精度。':''}</p><details><summary>分位数、尾部权重与方法差异</summary><p>VaR采用type=1；ES将每个排序样本对应分位区间与(α,1]的交集作权重，不取整。重复阈值和非整数尾部均保留原规则。提高α改变被研究的尾部范围，不是让实际风险凭空变大。历史样本少时极端尾部不稳定；正态拟合可能忽略厚尾，可靠性仍需未来的样本外检验。</p></details>`;}
if(isDynamic){
 const g=built.g,cur=dynamic==='garch'?g:e,estimated=built.estimated;
 if(!g&&dynamic!=='ewma'){
  $('#metrics').innerHTML=dynamic==='garch'?'<p role="alert">当前样本无法获得可靠的GARCH估计</p>':`<div><span>EWMA VaR（元）</span><b>${money(e.latest.VaR)}</b></div><div><span>GARCH</span><b>当前不可用</b></div>`;
  $('#details').innerHTML='<p role="alert">'+esc(built.fitError)+'</p><p>没有回退为固定教学参数。可切回教学参数继续探索；EWMA仍可正常使用。</p>';
 }else{
  $('#metrics').innerHTML=dynamic==='compare'?`<table class="risk-top-compare"><tr><th>下一期（元）</th><th>VaR</th><th>ES</th></tr><tr><th>EWMA</th><td>${money(e.latest.VaR)}</td><td>${money(e.latest.ES)}</td></tr><tr><th>GARCH${estimated?'估计':''}</th><td>${money(g.latest.VaR)}</td><td>${money(g.latest.ES)}</td></tr></table>`:`<div><span>下一期${dynamic.toUpperCase()} VaR（元）${estimated?' · σ='+pct(cur.latest.sigma):''}</span><b>${money(cur.latest.VaR)}</b></div><div><span>ES · 尾部均值（元）</span><b>${money(cur.latest.ES)}</b></div>`;
  if(dynamic!=='ewma')$('#details').innerHTML=`<p id="riskInsight">${estimated?'当前GARCH参数由前'+p.train+'期训练数据估计，检验期顺序更新方差，未每日重新估计。':'当前使用指定教学参数进行GARCH递推，并非对数据进行统计拟合。'} 下一期条件标准差${pct(g.latest.sigma)}，固定条件均值${pct(g.mu)}。预测不是已实现损失，风险数值更高不代表更准确。</p>`+fitDetails(built.fit,g)+`<p>有效预测从第${g.k+1}期开始；${estimated?'GARCH保留训练期末递推状态，EWMA对齐相同训练终点、均值和共同有效日期。':'初始化方差'+g.initial.toPrecision(7)+'；长期方差'+g.longRun.toPrecision(7)+'，二者含义不同。'}最后一期无实际损失。</p>`;
 }
}
if(view==='evt'){
 $('#riskQuestion').textContent='如果特别关注严重亏损，尾部数据能告诉我们什么？';
 const v=built.ev;
 $('#metrics').innerHTML=v?`<div><span>EVT VaR（元）</span><b>${money(v.VaR)}</b></div><div><span>EVT ES（元）</span><b>${v.ES===null?'理论不有限':money(v.ES)}</b></div>`:'<p>暂不报告风险数值</p>';
 $('#details').innerHTML=v?`<p id="riskInsight">在${q.L.length}个历史损失观测中，有${v.nu}个严格超过当前阈值${money(v.u)}元。模型只用这些较严重的损失估计尾部分布，再计算${pct(p.alpha)}置信水平的VaR与ES。超阈值比例${pct(v.pu)}。拟合ξ=${v.xi.toFixed(6)}、b=${money(v.b)}元。${v.esStatus}。提高阈值会减少尾部样本，不能保证更准确。</p><details><summary>拟合方法、假设与局限</summary><p>真实GPD多起点极大似然优化，已收敛；对数似然${v.logLikelihood.toFixed(6)}。为避免非正则端点MLE，搜索−0.49&lt;ξ&lt;5，边界拟合拒绝报告。${v.endpoint===null?'正形状尾部无有限上端点。':'有限上端点 '+money(v.endpoint)+'元。'}生存概率表示损失超过某个金额的概率；曲线为乘以超阈值比例的无条件尾部概率，ES标记只是尾部平均损失的位置，不是另一个VaR置信阈值。每个支持点须满足1+ξY/b&gt;0。静态POT不等于动态条件EVT；未作阈值稳定性或聚簇去相关检验，合成样本不能验证市场预测能力。目标分位必须高于阈值；至少20个超阈值，样本少仍不稳定。</p></details>`:`<p role="alert">${esc(built.error)}</p><p>不会自动降低阈值或更换数据。复制R脚本可重现相同的拒绝原因。</p>`;
}
if(view==='backtest'){
 $('#riskQuestion').textContent='事前预测的风险阈值，是否经得起后来发生的损失？';const bt=built.bt;
 if(bt&&!bt.models[backModel]?.unavailable){const c=bt.models[backModel];$('#metrics').innerHTML=`<div><span>样本外超限 / 有效预测</span><b>${c.x} / ${c.n}</b></div><div><span>Kupiec参考p值</span><b>${c.pValue<.001?c.pValue.toExponential(3):c.pValue.toFixed(4)}</b></div>`;
 $('#details').innerHTML=`<p id="riskInsight">在${c.n}次事前VaR预测中，实际损失有${c.x}次超过阈值。${pct(p.alpha)}VaR的理论超限概率为${pct(c.p0)}，实际比例${pct(c.phat)}。训练前${bt.train}期，检验后${bt.test}期；${dataset?'日期 '+dataset.dates[bt.train]+' 至 '+dataset.dates.at(-1):'观测 '+(bt.train+1)+' 至 '+p.n}。实际超限${pct(c.phat)}，目标${pct(c.p0)}；LR=${c.LR.toFixed(6)}。${c.pValue<.05?'在渐近检验及其假设下，超限比例与目标存在显著差异。':'没有足够证据拒绝目标超限比例；不等于模型被证明准确。'} ${c.warning}</p><details><summary>四模型结果与训练规则</summary><table><tr><th>模型</th><th>超限/有效</th><th>参考p值</th></tr>${Object.entries(bt.models).map(([k,v])=>`<tr><th>${k}</th><td>${v.unavailable?'不可用':v.x+'/'+v.n}</td><td>${v.unavailable?esc(v.reason):v.pValue.toPrecision(4)}</td></tr>`).join('')}</table><p>历史／正态参数只从训练期计算并固定；均值与初始方差只用训练期。EWMA/GARCH先预测再观察，顺序更新；${backModel==='garchFit'?'当前GARCH参数由训练期数据估计；初始训练期参数估计 + 检验期顺序方差更新，未每日重新估计。':'GARCH固定模式为给定教学参数，未作样本估计。'}Kupiec不检验超限独立性，不是完整条件覆盖检验。严格L&gt;VaR，等于不计。缺失预测不计入分母，当前排除${c.missing}期。</p></details><details><summary>ES描述性诊断（非正式ES回测）</summary><p>${c.esCount?`超限损失均值${money(c.meanActual)}元；对应预测ES均值${money(c.meanES)}元；差额${money(c.bias)}元。`:'没有可用于ES描述的超限观测。'} ${c.esCount<10?'尾部观测过少，严重程度评价不稳定。':''}此差额不构成严格ES统计检验。</p></details>`;
 if(backModel==='garchFit')$('#details').insertAdjacentHTML('afterbegin',fitDetails(bt.fit));
 }else{$('#metrics').innerHTML='<p>当前模型无法生成有效预测</p>';$('#riskPlot').innerHTML='<p class="risk-empty">当前GARCH样本估计不可用；没有替代预测。</p>';$('#legend').innerHTML='';$('#details').innerHTML='<p role="alert">'+esc(bt?.models[backModel]?.reason||built.error)+'</p><p>未计算Kupiec；其他模型仍可切换使用。</p>';}
}
organizeParameters();renderCode();}
function fitDetails(f,g){if(!f)return '<p>GARCH教学参数：ω='+p.omega+'，a='+p.a+'，b='+p.b+'。</p>';return `<details id="riskFitDetails"><summary>估计详情 · 数值收敛${f.warning?'（边界警示）':''}</summary><p>训练${f.n}期；ω=${f.omega.toPrecision(9)}，a=${f.a.toPrecision(9)}，b=${f.b.toPrecision(9)}。固定训练均值${pct(f.mu)}，初始方差${f.initial.toPrecision(9)}。对数似然${f.logLikelihood.toFixed(9)}；六起点中${f.starts.filter(s=>s.accepted).length}个通过收敛与局部扰动检查，选择负似然最小者。各起点负似然：${f.starts.map(s=>s.objective.toFixed(6)+(s.accepted?'':'（未接受）')).join('、')}。${esc(f.warning)}</p><p>全部训练观测进入条件高斯似然；收益按训练标准差缩放，ω已还原。参数用正值与softmax变换，数值搜索|θ|≤20；近边界不代表强识别，不保证全局最优。${g?'最新条件方差'+g.latest.variance.toPrecision(9):''}</p></details>`;}
function organizeParameters(){const dyn=view==='dynamic',isG=dyn&&dynamic!=='ewma',fit=isG&&garchMode==='estimate',back=view==='backtest';fitMode.hidden=!isG;gfields.hidden=!((isG&&!fit)||(back&&backModel==='garch'));$('#risk-field-lambda').hidden=!(dyn&&(dynamic==='ewma'||dynamic==='compare')||back&&backModel==='ewma');$('#riskLambdaChoices').hidden=!(dyn&&dynamic==='ewma');$('#risk-field-train').hidden=!(back||fit);$('#risk-field-h0').hidden=initialMode!=='custom'||back;$('#riskInitialModeField').hidden=back;$('#risk-field-train span').textContent=(fit||back&&backModel==='garchFit')?'训练观测数（GARCH估计至少60）':'训练观测数（至少30，检验至少20）';exploration.hidden=!dyn||dynamic==='garch';
const order=back?['riskBackModelField','risk-field-train','risk-field-alpha','risk-field-N','risk-field-lambda','riskGarchFields']:view==='evt'?['risk-field-threshold','risk-field-alpha','risk-field-N']:isG?(fit?['riskGarchModeField','risk-field-train','risk-field-alpha','risk-field-N','risk-field-lambda']:['riskGarchModeField','riskGarchFields','risk-field-alpha','risk-field-N','risk-field-lambda']):dyn?['risk-field-lambda','risk-field-alpha','risk-field-N','riskLambdaChoices']:['risk-field-alpha','risk-field-N'];order.forEach(id=>$('#inputs').append($('#'+id)));const key=[view,dynamic,garchMode,backModel].join('/');if(parameterLayout!==key){gfields.open=!gfields.hidden;parameterLayout=key;}}
function compareTable(q){return `<table class="risk-top-compare"><tr><th>方法（元）</th><th>VaR</th><th>ES</th></tr><tr><th>历史法</th><td>${money(q.hVaR)}</td><td>${money(q.hES)}</td></tr><tr><th>正态法</th><td>${money(q.nVaR)}</td><td>${money(q.nES)}</td></tr></table>`;}
function renderCode(){const scroll=$('#code').scrollTop;if(!built.blocks.some(b=>b.key===selected)){selected=built.blocks[0].key;focusLine=null;}let row=0;$('#code').innerHTML=built.blocks.map(b=>`<div class="logic-block">${b.lines.map((line,i)=>`<button class="code-line ${selected===b.key&&(focusLine===null||focusLine===i)?'selected':''}" data-risk-code="${b.key}" data-line="${i}"><span class="num">${++row}</span><code>${WorkbenchUI.colorCode(line)}</code></button>`).join('')}</div>`).join('');$('#code').scrollTop=scroll;nav.innerHTML=built.blocks.map(b=>`<button data-risk-jump="${b.key}" aria-pressed="${b.key===selected}">${esc(b.title)}</button>`).join('');const b=built.blocks.find(b=>b.key===selected);$('#explanation').innerHTML=`<h3>${esc(b.title)}</h3><p>${esc(b.explain)}</p><div id="riskFormula"></div>`;if(view==='dynamic'&&['var','es','lambda','ewma'].includes(selected)){const values=document.createElement('p');values.className='current-value';const active=dynamic==='garch'?built.g:built.e;values.textContent=active?`当前：置信水平=${pct(p.alpha)}，固定训练均值=${pct(active.mu)}，${dynamic==='compare'?'EWMA标准差='+pct(built.e.latest.sigma)+'；GARCH标准差='+(built.g?pct(built.g.latest.sigma):'不可用'):'当前模型预测标准差='+pct(active.latest.sigma)}，N=${money(p.N)}元。`:'GARCH估计不可用，无替代数值。';$('#explanation').append(values);}if(b.formula)katex.render(b.formula,$('#riskFormula'),{throwOnError:false});$('#codeNotice').textContent=mode==='full'?'完整数据、计算、输出与当前图':'关键阅读；主复制仍含完整脚本';}
function jump(key){selected=key;const b=built.blocks.find(b=>b.key===key);if(!b)return;focusLine=Math.max(0,b.lines.findIndex(l=>key==='ewma'?l.includes('h[t+1] <-'):key==='historical'?l.includes('hVaR <-'):key==='normal'?l.includes('nVaR <-'):false));renderCode();const target=$(`#code [data-risk-code="${key}"][data-line="${focusLine}"]`),code=$('#code');if(!target)return;code.scrollTop+=target.getBoundingClientRect().top-code.getBoundingClientRect().top-8;}
nav.onclick=e=>{const b=e.target.closest('[data-risk-jump]');if(b)jump(b.dataset.riskJump);};$('#code').onclick=e=>{const b=e.target.closest('[data-risk-code]');if(b){selected=b.dataset.riskCode;focusLine=+b.dataset.line;renderCode();}};
views.onclick=e=>{const b=e.target.closest('[data-risk-view]');if(b){view=b.dataset.riskView;mode='full';zoom=false;selected=view==='basic'?'historical':view==='dynamic'?'ewma':view==='evt'?'estimate':view==='ai'?'data':view==='qr'?'data':'predict';focusLine=null;render();if(valid&&built.blocks.some(b=>b.key===selected))jump(selected);}};
sub.onclick=e=>{const b=e.target.closest('[data-dynamic]');if(b){dynamic=b.dataset.dynamic;render();}};$('#riskGarchMode').onchange=()=>{garchMode=$('#riskGarchMode').value;render();};$('#riskInitialMode').onchange=()=>{initialMode=$('#riskInitialMode').value;render();};$('#riskBackModel').onchange=()=>{backModel=$('#riskBackModel').value;render();};
function changeMethod(next){method=next;render();if(valid)jump(method==='normal'?'normal':'historical');}methods.onclick=e=>{const b=e.target.closest('[data-risk-method]');if(b)changeMethod(b.dataset.riskMethod);};chartModes.onclick=e=>{const b=e.target.closest('[data-risk-chart]');if(b){chart=b.dataset.riskChart;render();}};
$('#input-lambda').onfocus=()=>{if(view==='dynamic'&&valid){selected=built.blocks.some(b=>b.key==='lambda')?'lambda':'ewma';focusLine=0;renderCode();}};$('.parameters-scroll').addEventListener('input',e=>{if(e.target.matches('input[type=number]'))render();});$('#riskLambdaChoices').onclick=e=>{const b=e.target.closest('[data-lambda]');if(b){$('#input-lambda').value=b.dataset.lambda;render();}};$('#riskShock').onclick=()=>{zoom=true;render();};$('#riskWhole').onclick=()=>{zoom=false;render();};document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.codeMode;focusLine=null;render();});
function download(text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='experiment07-'+view+'.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#copy').onclick=async()=>{if(!valid)return;const source=C.build(p,view,method,chart,'full',dataset?.R,{dynamic,backModel,dates:dataset?.dates,source:$('#riskSource').value,garchMode,initialMode}).code;try{await navigator.clipboard.writeText(source);$('#codeNotice').textContent='已复制当前完整脚本，可在干净R会话整段执行';}catch{download(source);}};$('#reset').onclick=()=>{dataset=null;garchMode='teaching';initialMode='sample';$('#riskGarchMode').value=garchMode;$('#riskInitialMode').value=initialMode;$('#riskCSV').value='';$('#riskCSVError').textContent='';$('#riskSource').value='';$('#riskCSVKind').value='simple';$('#riskCSVUnit').value='decimal';p={...M.defaults,...X.defaults,h0:.0001};for(const k in p)$('#input-'+k).value=p[k];zoom=false;render();};
function info(title,text){$('#infoTitle').textContent=title;$('#infoBody').textContent=text;ModalUI.open($('#infoDialog'));}for(const id of ['#catalog','#catalogMobile'])$(id).onclick=()=>ModalUI.open($('#catalogDialog'));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>info('实验07 · 自由探索','基础页切换历史法/正态法/比较；动态页直接改λ、α或本金，收益样本不重抽样。高级设置可改数据生成参数和初始化窗口。点击代码段或语句看金融解释，复制完整脚本到新R会话运行。没有预测题或解锁。');$('#teacher').onclick=()=>info('实验07教学边界','先区分VaR阈值与ES尾部平均，再用同样收益比较λ对EWMA响应的影响。让学生核对第31日只用前30日信息。四个视图可自由操作；GARCH可选教学参数或真实训练估计，POT为静态尾部，Kupiec为无条件覆盖，ES为描述诊断。未进行真实学生试用，不能宣称95分教学效果。');const practice=document.createElement('button');practice.id='rStudioPractice';practice.textContent='RStudio实践';$('.code-toolbar').append(practice);practice.onclick=()=>info('完整R复现','复制当前完整R脚本，粘贴到新R Script，全选执行。仅需Base R；包含同一确定性收益序列、当前参数、损失、计算及当前图。网页不执行R。万元图轴已同步转换密度。EWMA前k日输出NA，最终一行是尚未发生的下一观测期预测。');$('#projector').onclick=()=>{const on=!document.body.classList.contains('projector');document.body.classList.toggle('projector',on);$('#projector').setAttribute('aria-pressed',String(on));interaction.clear();};
let share=62;const resize=v=>{share=Math.max(40,Math.min(75,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',(100-share)+'fr');$('#splitter').setAttribute('aria-valuenow',share);};$('#splitter').onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();resize(e.key==='Home'?40:e.key==='End'?75:share+(e.key==='ArrowDown'?2:-2));}};$('#splitter').onpointerdown=e=>{const el=e.currentTarget;el.setPointerCapture(e.pointerId);const y=e.clientY,start=share,h=$('.code-regions').clientHeight;el.onpointermove=e=>resize(start+100*(e.clientY-y)/h);el.onpointerup=()=>el.onpointermove=null;};
$('#riskSource').oninput=()=>{if(dataset){dataset.metadata=$('#riskSource').value;render();}};
$('#riskCSV').onchange=async()=>{const file=$('#riskCSV').files[0];if(!file)return;try{if(file.size>2000000)throw Error('文件超过2MB。');const next=X.parseCSV(await file.text(),{kind:$('#riskCSVKind').value,unit:$('#riskCSVUnit').value});dataset={...next,metadata:$('#riskSource').value};$('#input-n').value=next.R.length;$('#input-window').value=Math.min(30,next.R.length-1);$('#input-train').value=Math.min(150,next.R.length-20);$('#riskCSVError').textContent='';render();}catch(err){$('#riskCSVError').textContent=err.message+' 当前数据未替换。';}};
$('#riskSynthetic').onclick=()=>{dataset=null;$('#riskSource').value='';$('#riskCSV').value='';$('#riskCSVError').textContent='';render();};
$('#riskExport').onclick=()=>{const R=dataset?.R||M.generate(p),dates=dataset?.dates||R.map((_,i)=>new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10));const text='date,return\n'+R.map((r,i)=>dates[i]+','+r).join('\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.href=url;a.download=dataset?'user-returns.csv':'synthetic-teaching-returns.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.RiskLab=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({p,view,method,chart,q:built.q,e:built.e,g:built.g,fitError:built.fitError,ev:built.ev,bt:built.bt,error:built.error,dynamic,backModel,dataset,fit:built.fit,garchMode,initialMode,valid}))});if(window.LabKit)window.LabKit.onLang(()=>{if(view==='ai'||view==='qr')render();});
render();}
window.RiskWorkbench={mount};})();

;

/* Source: vol-math.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math'):root.ExperimentMath,typeof module==='object'?require('./risk-garch-fit'):root.RiskGarchFit,typeof module==='object'?require('./risk-extended'):root.RiskExtended);if(typeof module==='object')module.exports=api;else root.VolMath=api;})(this,(M,G,X)=>{
const defaults={omega:.00001,a:.12,b:.82,gamma:.06,kappa:.2,mu:0,n:160,shock:4,lag:5,level:.05,horizon:20,impact:.03,weight:.5,rho:.3};
function settings(p){if(Object.values(p).some(x=>!Number.isFinite(x)))throw Error('请输入有限数值。');for(const [k,l,h]of [['n',60,1500],['shock',0,8],['lag',1,20],['level',.001,.2],['horizon',1,100],['impact',0,.5],['weight',0,1],['rho',-.999,.999]])if(p[k]<l||p[k]>h)throw Error(k+'超出支持范围。');for(const k of ['n','lag','horizon'])if(!Number.isInteger(p[k]))throw Error(k+'须为整数。');return p;}
function generate(p){settings(p);function asset(omega,a,b,z){let h=[omega/(1-a-b)],R=[];for(let i=0;i<p.n;i++){if(i)h[i]=omega+a*R[i-1]**2+b*h[i-1];R[i]=Math.sqrt(h[i])*z(i);}return{R,h};}const A=asset(.00001,.12,.82,i=>i===40?p.shock:Math.sin((i+1)*2.4)*.85),B=asset(.000006,.1,.85,i=>.35*(i===40?p.shock:Math.sin((i+1)*2.4)*.85)+.75*Math.cos((i+1)*1.7));return{A:A.R,B:B.R,truth:A.h,dates:null,source:'合成教学数据，非真实市场行情'};}
function logGamma(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);z--;let x=.99999999999980993;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
function chiTail(x,df){if(x<0||!Number.isFinite(x)||df<=0)throw Error('卡方参数非法。');if(x===0)return 1;const a=df/2,z=x/2,log=-z+a*Math.log(z)-logGamma(a);if(z<a+1){let term=1/a,sum=term;for(let n=1;n<10000;n++){term*=z/(a+n);sum+=term;if(Math.abs(term)<Math.abs(sum)*1e-14)break;}return Math.max(0,Math.min(1,1-sum*Math.exp(log)));}let b=z+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<10000;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<1e-14)break;}return Math.max(0,Math.min(1,Math.exp(log)*h));}
function ols(y,cols){const n=y.length,Q=[],R=[];for(let j=0;j<cols.length;j++){let v=cols[j].slice();R[j]=[];for(let k=0;k<j;k++){const d=Q[k].reduce((s,q,i)=>s+q*v[i],0);R[k][j]=d;v=v.map((x,i)=>x-d*Q[k][i]);}const norm=Math.sqrt(v.reduce((a,b)=>a+b*b,0));if(norm<1e-10*Math.sqrt(n))throw Error('辅助回归设计矩阵秩不足。');R[j][j]=norm;Q.push(v.map(x=>x/norm));}const fitted=Array(n).fill(0);Q.forEach(q=>{const d=q.reduce((s,x,i)=>s+x*y[i],0);q.forEach((x,i)=>fitted[i]+=x*d);});const mu=M.mean(y),sst=y.reduce((s,x)=>s+(x-mu)**2,0),sse=y.reduce((s,x,i)=>s+(x-fitted[i])**2,0);if(sst<1e-16*n)throw Error('平方残差退化，无法检验。');return{r2:Math.max(0,Math.min(1,1-sse/sst)),fitted};}
function archLM(e,lag){if(!Number.isInteger(lag)||lag<1||lag>20||e.length-lag<=lag+2||e.some(x=>!Number.isFinite(x)))throw Error('ARCH-LM滞后或有效样本不足。');const e2=e.map(x=>x*x),scale=M.mean(e2);if(scale<=1e-24)throw Error('残差方差为零或过小，无法检验。');const q=e2.map(x=>x/scale),n=e.length-lag,y=q.slice(lag),cols=[Array(n).fill(1),...Array.from({length:lag},(_,j)=>q.slice(lag-j-1,e.length-j-1))],o=ols(y,cols),stat=n*o.r2;return{stat,p:chiTail(stat,lag),df:lag,n,r2:o.r2};}
function ljung(e,lag){if(!Number.isInteger(lag)||lag<1||e.length<=lag+2)throw Error('Ljung-Box样本不足。');const mu=M.mean(e),v=e.map(x=>x-mu),den=v.reduce((s,x)=>s+x*x,0);if(den<1e-24)throw Error('序列退化，无法计算自相关。');const acf=Array.from({length:lag},(_,j)=>v.slice(j+1).reduce((s,x,i)=>s+x*v[i],0)/den),stat=e.length*(e.length+2)*acf.reduce((s,r,j)=>s+r*r/(e.length-j-1),0);return{stat,p:chiTail(stat,lag),df:lag,n:e.length,acf};}
function safe(fn){try{return fn();}catch(e){return{error:e.message};}}
function validParams(p,type){if(![p.omega,p.a,p.b,p.gamma,p.mu,p.kappa].every(Number.isFinite)||p.omega<=0||p.a<0||p.b<0)throw Error('要求ω>0、a≥0、b≥0。');const gamma=type==='gjr'?p.gamma:0,b=type==='arch'?0:p.b;if(p.a+gamma<0||p.a+b+gamma/2>=1)throw Error('要求a+γ≥0，a+b+γ/2<1（对称正态创新假设）。');return{...p,b,gamma,kappa:type==='m'?p.kappa:0,persistence:p.a+b+gamma/2};}
function path(R,p,type='garch',initial){const v=validParams(p,type),h=[initial??v.omega/(1-v.persistence)],eps=[],condMean=[],z=[];if(!Number.isFinite(h[0])||h[0]<=0)throw Error('初始方差须为正有限值。');let ll=0;R.forEach((r,i)=>{const m=v.mu+v.kappa*Math.sqrt(h[i]);condMean.push(m);const e=r-m;eps.push(e);z.push(e/Math.sqrt(h[i]));ll-=.5*(Math.log(2*Math.PI)+Math.log(h[i])+e*e/h[i]);h.push(v.omega+(v.a+(e<0?v.gamma:0))*e*e+v.b*h[i]);});if(h.some(x=>!Number.isFinite(x)||x<=0))throw Error('条件方差异常。');return{...v,h,eps,z,condMean,logLikelihood:ll,n:R.length,initial:h[0],type};}
function decode(t,type){if(type==='arch'){const a=1/(1+Math.exp(-t[1]));return{omega:Math.exp(t[0]),a,b:0,gamma:0,mu:0,kappa:0};}if(type==='gjr'){const u=t.slice(1,4).map(Math.exp),d=1+u.reduce((a,b)=>a+b,0),a=2*u[0]/d;return{omega:Math.exp(t[0]),a,b:u[2]/d,gamma:2*u[1]/d-a,mu:0,kappa:0};}const v=G.decode(t);return{omega:v.w,a:v.a,b:v.b,gamma:0,mu:type==='m'?t[3]:0,kappa:type==='m'?t[4]:0};}
const cache=new Map();
function fit(R,type='garch',options={}){const key=JSON.stringify([R,type,options]);if(cache.has(key))return cache.get(key);let result;if(type==='garch'){const f=G.fit(R,options);result={...path(R,{...defaults,...f,gamma:0,kappa:0},type,f.initial),fit:f,converged:true,warning:f.warning,parameters:4};}else{const prep=G.prepare(R),y=R.map(x=>(x-prep.mu)/prep.scale);let starts;if(type==='arch')starts=[[-2,-2],[-1,0],[0,-3]];else if(type==='gjr')starts=[[-3,Math.log(2),Math.log(4),Math.log(40)],[-1,-1,-1,1],[-2,0,0,2],[-1,1,0,1]];else starts=G.starts.slice(0,4).flatMap(t=>[t.concat([0,0]),t.concat([-.1,.2]),t.concat([.1,-.2])]);const fn=t=>{if(t.some(x=>!Number.isFinite(x)||Math.abs(x)>20))return 1e100;try{const v=decode(t,type),q=path(y,{...defaults,...v},type,1);return -q.logLikelihood;}catch{return 1e100;}};const attempts=starts.map(t=>{const q=G.simplex(fn,t,options.maxIter??2600);q.accepted=q.converged&&q.f<1e99&&q.x.every((x,j)=>[-1,1].every(sign=>{const a=q.x.slice();a[j]+=sign*1e-4;return fn(a)>=q.f-1e-6;}));return q;}),good=attempts.filter(x=>x.accepted).sort((a,b)=>a.f-b.f);if(!good.length)throw Error(type+'优化未收敛或局部检查失败，无预设参数回退。');const best=good[0],v=decode(best.x,type),params={...defaults,...v,omega:v.omega*prep.s2,mu:prep.mu+v.mu*prep.scale},q=path(R,params,type,prep.s2);result={...q,converged:true,theta:best.x,attempts:attempts.map(x=>({converged:x.converged,accepted:x.accepted,objective:x.f,iterations:x.iterations})),parameters:type==='arch'?3:type==='gjr'?5:5,warning:q.persistence>.9999||q.a<1e-5||q.b<1e-5||best.x.some(x=>Math.abs(x)>19.99)?'接近参数边界；弱识别和局部最优需谨慎。':''};}result.aic=-2*result.logLikelihood+2*result.parameters;result.bic=-2*result.logLikelihood+Math.log(R.length)*result.parameters;if(cache.size>=12)cache.clear();cache.set(key,result);return result;}
function diagnostics(q,lag){return{z:ljungSafe(q.z,lag),z2:ljungSafe(q.z.map(x=>x*x),lag),arch:safe(()=>archLM(q.z,lag))};}const ljungSafe=(x,l)=>safe(()=>ljung(x,l));
function forecast(q,horizon){if(!Number.isInteger(horizon)||horizon<1||horizon>100)throw Error('预测期数须为1–100整数。');const long=q.omega/(1-q.persistence),one=q.h.at(-1),h=[one];for(let i=1;i<horizon;i++)h.push(q.omega+q.persistence*h[i-1]);return{h,sigma:h.map(Math.sqrt),long};}
function ccc(A,B,p,mode='estimate',rhoMode='estimated'){if(!B||A.length!==B.length)throw Error('CCC需要按共同日期对齐的双资产数据。');const a=mode==='estimate'?fit(A):path(A,p),b=mode==='estimate'?fit(B):path(B,p);const ma=M.mean(a.z),mb=M.mean(b.z),cov=a.z.reduce((s,x,i)=>s+(x-ma)*(b.z[i]-mb),0),va=a.z.reduce((s,x)=>s+(x-ma)**2,0),vb=b.z.reduce((s,x)=>s+(x-mb)**2,0),estimatedRho=cov/Math.sqrt(va*vb),rho=rhoMode==='manual'?p.rho:estimatedRho;if(!Number.isFinite(rho)||Math.abs(rho)>=1)throw Error('相关矩阵须严格正定：−1<ρ<1；当前相关估计退化。');const hp=[],covariance=[],det=[];a.h.forEach((h,i)=>{const c=rho*Math.sqrt(h*b.h[i]),d=h*b.h[i]-c*c;const v=p.weight**2*h+(1-p.weight)**2*b.h[i]+2*p.weight*(1-p.weight)*c;if(d<=0||v<0||!Number.isFinite(v))throw Error('条件协方差矩阵不合法。');covariance.push(c);hp.push(v);det.push(d);});const H=a.h.map((h,i)=>[[h,covariance[i]],[covariance[i],b.h[i]]]);return{a,b,rho,estimatedRho,hp,covariance,det,H,weight:p.weight};}
function importOne(text,{kind='simple',unit='decimal'}={}){return X.parseCSV(text,{kind,unit});}
function importData(text,options={},second){const lines=text.trim().split(/\r?\n/),head=lines[0]?.replace(/^\uFEFF/,'').split(',').map(s=>s.trim().toLowerCase());let A,B;if(head.length===3){if(second!==undefined)throw Error('双资产宽表已含A/B，请清空额外B文件，避免来源歧义。');if(head.join(',')!=='date,a,b')throw Error('双资产宽表须为date,A,B。');const rows=lines.slice(1).map(s=>s.split(','));if(rows.some(r=>r.length!==3))throw Error('双资产列数错误。');const header='date,'+(options.kind==='price'?'price':'return')+'\n';A=importOne(header+rows.map(r=>r[0]+','+r[1]).join('\n'),options);B=importOne(header+rows.map(r=>r[0]+','+r[2]).join('\n'),options);}else{A=importOne(text,options);if(second)B=importOne(second,options);}if(!B)return{A:A.R,B:null,dates:A.dates,source:'用户导入数据',raw:{a:text.replace(/^\uFEFF/,''),b:second?.replace(/^\uFEFF/,''),kind:options.kind||'simple',unit:options.unit||'decimal'},note:A.note};let priceNote='';if(options.kind==='price'&&head.length===2){const raw=s=>new Map(s.replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1).map(line=>{const r=line.split(',').map(x=>x.trim().replace(/^"|"$/g,''));return[r[0],Number(r[1])];})),ma=raw(text),mb=raw(second),common=[...ma.keys()].filter(d=>mb.has(d)).sort();if(common.length<61)throw Error('共同价格日期至少61个，才能生成60个同区间双资产收益。');priceNote=`价格先按共同日期对齐：A${ma.size}、B${mb.size}条价格，交集${common.length}条→${common.length-1}个同区间收益；分别排除${ma.size-common.length}/${mb.size-common.length}个价格日期。`;const csv=m=>'date,price\n'+common.map(d=>d+','+m.get(d)).join('\n');A=importOne(csv(ma),options);B=importOne(csv(mb),options);}const map=new Map(B.dates.map((d,i)=>[d,B.R[i]])),idx=A.dates.map((d,i)=>[d,i]).filter(([d])=>map.has(d));if(idx.length<60)throw Error('双资产共同日期少于60，无法可靠建模。');return{A:idx.map(([,i])=>A.R[i]),B:idx.map(([d])=>map.get(d)),dates:idx.map(([d])=>d),source:'用户导入数据',raw:{a:text.replace(/^\uFEFF/,''),b:second?.replace(/^\uFEFF/,''),kind:options.kind||'simple',unit:options.unit||'decimal'},note:`${priceNote}A原收益${A.R.length}，B原收益${B.R.length}；按日期取交集${idx.length}期，分别排除${A.R.length-idx.length}/${B.R.length-idx.length}个未配对日期。不按行拼接、不填补。${A.note} ${B.note}`};}
return{defaults,settings,generate,chiTail,ols,archLM,ljung,safe,path,fit,decode,diagnostics,forecast,ccc,importData};});

;

/* Source: vol-r.js */
(function(root){const s=String.raw`
vpath <- function(R,p,type="garch",initial=NULL) {
  if(type=="arch")p$b<-0
  if(type!="gjr")p$gamma<-0
  if(type!="m")p$kappa<-0
  persistence<-p$a+p$b+p$gamma/2
  stopifnot(p$omega>0,p$a>=0,p$b>=0,p$a+p$gamma>=0,persistence<1)
  n<-length(R);h<-numeric(n+1);h[1]<-if(is.null(initial))p$omega/(1-persistence)else initial
  stopifnot(is.finite(h[1]),h[1]>0)
  eps<-z<-condMean<-numeric(n);ll<-0
  for(t in seq_len(n)) {
    condMean[t]<-p$mu+p$kappa*sqrt(h[t]);eps[t]<-R[t]-condMean[t];z[t]<-eps[t]/sqrt(h[t])
    ll<-ll-.5*(log(2*pi)+log(h[t])+eps[t]^2/h[t])
    h[t+1]<-p$omega+(p$a+if(eps[t]<0)p$gamma else 0)*eps[t]^2+p$b*h[t]
  }
  stopifnot(all(is.finite(h)),all(h>0))
  p<-p[c("omega","a","b","gamma","mu","kappa")]
  c(p,list(h=h,eps=eps,z=z,condMean=condMean,logLikelihood=ll,persistence=persistence,n=n))
}
vdecode <- function(t,type) {
  if(type=="arch")return(list(omega=exp(t[1]),a=plogis(t[2]),b=0,gamma=0,mu=0,kappa=0))
  if(type=="gjr") {u<-exp(t[2:4]);d<-1+sum(u);a<-2*u[1]/d
    return(list(omega=exp(t[1]),a=unname(a),b=unname(u[3]/d),gamma=unname(2*u[2]/d-a),mu=0,kappa=0))}
  p<-gdecode(t);list(omega=unname(p[1]),a=unname(p[2]),b=unname(p[3]),gamma=0,
    mu=if(type=="m")t[4]else 0,kappa=if(type=="m")t[5]else 0)
}
vfit <- function(R,type="garch",maxIter=2600) {
  n<-length(R);if(n<60)stop("At least 60 observations required")
  baseMu<-mean(R);s2<-var(R);scale<-sqrt(s2)
  if(!is.finite(scale)||scale<=1e-12*max(1,abs(baseMu)))stop("Near-constant returns")
  if(type=="garch") {
    f<-fit_garch(R);p<-list(omega=f$omega,a=f$a,b=f$b,gamma=0,kappa=0,mu=f$mu)
    q<-vpath(R,p,type,s2);k<-4
  }else{
    y<-(R-baseMu)/scale
    if(type=="arch")starts<-rbind(c(-2,-2),c(-1,0),c(0,-3)) else if(type=="gjr")
      starts<-rbind(c(-3,log(2),log(4),log(40)),c(-1,-1,-1,1),c(-2,0,0,2),c(-1,1,0,1)) else {
      original<-rbind(c(.05,.08,.87),c(.1,.15,.75),c(.5,.1,.4),c(.9,.05,.05))
      starts<-do.call(rbind,lapply(seq_len(4),function(i){p<-original[i,];t<-c(log(p[1]),log(p[2]/(1-p[2]-p[3])),log(p[3]/(1-p[2]-p[3])))
        rbind(c(t,0,0),c(t,-.1,.2),c(t,.1,-.2))}))
    }
    fn<-function(t){if(any(!is.finite(t))||any(abs(t)>20))return(1e100)
      tryCatch(-vpath(y,vdecode(t,type),type,1)$logLikelihood,error=function(e)1e100)}
    attempts<-lapply(seq_len(nrow(starts)),function(i){v<-gsimplex(fn,starts[i,],maxIter)
      local<-v$converged&&all(sapply(seq_along(v$par),function(j)all(sapply(c(-1,1),function(sign){
        t<-v$par;t[j]<-t[j]+sign*1e-4;fn(t)>=v$value-1e-6}))))
      v$accepted<-v$converged&&v$value<1e99&&local;v})
    valid<-Filter(function(x)x$accepted,attempts)
    if(!length(valid))stop("Optimization failed; no parameter fallback")
    best<-valid[[which.min(sapply(valid,function(x)x$value))]]
    p<-vdecode(best$par,type);p$omega<-p$omega*s2;p$mu<-baseMu+p$mu*scale
    q<-vpath(R,p,type,s2);k<-if(type=="arch")3 else 5
    q$theta<-best$par;q$attempts<-attempts
  }
  q$converged<-TRUE;q$parameters<-k;q$aic<- -2*q$logLikelihood+2*k
  q$bic<- -2*q$logLikelihood+log(n)*k;q
}
varch <- function(e,lag) {
  n<-length(e);stopifnot(lag>=1,lag<=20,lag==floor(lag),n-lag>lag+2)
  scale<-mean(e^2);if(scale<=1e-24)stop("Degenerate residual variance")
  q<-e^2/scale;ids<-seq.int(lag+1,n);y<-q[ids]
  X<-cbind(1,sapply(seq_len(lag),function(j)q[ids-j]))
  if(qr(X,tol=1e-10)$rank<ncol(X)||sum((y-mean(y))^2)<1e-16*length(y))stop("Auxiliary regression rank deficient")
  fit<-lm.fit(X,y);r2<-max(0,min(1,1-sum(fit$residuals^2)/sum((y-mean(y))^2)))
  stat<-length(y)*r2;c(stat=stat,p=pchisq(stat,lag,lower.tail=FALSE),df=lag,n=length(y),r2=r2)
}
vljung <- function(e,lag) {
  stopifnot(length(e)>lag+2,lag>=1)
  if(sum((e-mean(e))^2)<1e-24)stop("Degenerate series")
  t<-Box.test(e,lag=lag,type="Ljung-Box",fitdf=0)
  c(stat=unname(t$statistic),p=t$p.value,df=lag,n=length(e))
}
vforecast <- function(q,H) {
  stopifnot(H>=1,H<=100,H==floor(H))
  long<-q$omega/(1-q$persistence)
  h<-numeric(H);h[1]<-tail(q$h,1)
  if(H>1)for(k in 2:H)h[k]<-q$omega+q$persistence*h[k-1]
  list(h=h,sigma=sqrt(h),long=long)
}
vccc <- function(A,B,p,mode="estimate",rhoMode="estimated") {
  stopifnot(length(A)==length(B))
  qa<-if(mode=="estimate")vfit(A)else vpath(A,p)
  qb<-if(mode=="estimate")vfit(B)else vpath(B,p)
  estimatedRho<-cor(qa$z,qb$z);rho<-if(rhoMode=="manual")p$rho else estimatedRho
  stopifnot(is.finite(rho),abs(rho)<1)
  covariance<-rho*sqrt(qa$h*qb$h)
  determinant<-qa$h*qb$h-covariance^2
  hp<-p$weight^2*qa$h+(1-p$weight)^2*qb$h+2*p$weight*(1-p$weight)*covariance
  stopifnot(all(determinant>0),all(hp>=0))
  list(a=qa,b=qb,rho=rho,estimatedRho=estimatedRho,covariance=covariance,hp=hp,det=determinant)
}
`;if(typeof module==='object')module.exports=s;else root.VolR=s;})(this);

;

/* Source: vol-code.js */
(function(root,factory){const api=factory(typeof module==='object'?require('./vol-math'):root.VolMath,typeof module==='object'?require('./risk-garch-r'):root.RiskGarchR,typeof module==='object'?require('./vol-r'):root.VolR);if(typeof module==='object')module.exports=api;else root.VolCode=api;})(this,(V,GR,VR)=>{
function build(p,state,data){V.settings(p);const blocks=[],add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:code.split('\n'),explain,formula});
const type=state.view==='extension'?(state.extension==='asymmetry'?'gjr':'m'):state.model||'garch';let q=null,error=null,lm=V.safe(()=>V.archLM(data.A.map(x=>x-data.A.reduce((a,b)=>a+b,0)/data.A.length),p.lag)),diag=null,forecast=null,cc=null,comparison=null;
try{if(state.view==='multi')cc=V.ccc(data.A,data.B,p,state.mode,state.rhoMode);else if(state.view!=='arch'){q=state.mode==='estimate'?V.fit(data.A,type):V.path(data.A,p,type);diag=V.diagnostics(q,p.lag);forecast=V.forecast(q,p.horizon);if(state.compare)comparison=['arch','garch','gjr'].map(t=>({type:t,...V.safe(()=>V.fit(data.A,t))}));}}catch(e){error=e.message;}
add('data','数据与参数',`# ${data.source}; source is not independently verified\n# Simple returns, decimal; one observation period, no automatic annualization.\nR <- c(${data.A.join(',\n ')})\nB <- ${state.view==='multi'&&data.B?'c('+data.B.join(',\n ')+')':'NULL'}\ndates <- ${data.dates?'as.Date(c('+data.dates.map(x=>'"'+x+'"').join(',')+'))':'seq_along(R)'}\np <- list(${Object.entries(p).map(([k,v])=>k+'='+v).join(',\n ')} )\nn <- length(R)\nstopifnot(n>=2,all(is.finite(R)),all(R>=-1))`, '当前收益值完整内嵌，日期已排序配对。导入数据不需要未知本地文件路径；合成数据不是市场行情。');
if(data.raw){const raw=data.raw;add('preprocess','CSV转换与共同日期',`# Browser-local source text, embedded for an independent Base R audit.
raw_A <- ${JSON.stringify(raw.a)}
raw_B <- ${raw.b?JSON.stringify(raw.b):'NULL'}
read_local <- function(text) {
 d<-read.csv(text=text,stringsAsFactors=FALSE,check.names=FALSE,strip.white=TRUE)
 names(d)<-tolower(names(d));d$date<-as.Date(d$date)
 stopifnot(!anyNA(d$date),!anyDuplicated(d$date))
 d[order(d$date),,drop=FALSE]
}
da<-read_local(raw_A)
if(ncol(da)==3) { levels<-data.frame(date=da$date,A=da[[2]],B=da[[3]]) } else {
 levels<-data.frame(date=da$date,A=da[[2]])
 if(!is.null(raw_B)){db<-read_local(raw_B);levels<-merge(levels,data.frame(date=db$date,B=db[[2]]),by="date",all=FALSE)}
}
levels<-levels[order(levels$date),,drop=FALSE]
kind<-"${raw.kind}";unit<-"${raw.unit}"
convert <- function(x){if(unit=="percent")x<-x/100;if(kind=="log")expm1(x)else x}
if(kind=="price") {
 stopifnot(all(levels$A>0),if("B"%in%names(levels))all(levels$B>0)else TRUE)
 raw_R<-levels$A[-1]/head(levels$A,-1)-1
 raw_B_returns<-if("B"%in%names(levels))levels$B[-1]/head(levels$B,-1)-1 else NULL
 raw_dates<-levels$date[-1]
}else{raw_R<-convert(levels$A);raw_B_returns<-if("B"%in%names(levels))convert(levels$B)else NULL;raw_dates<-levels$date}
stopifnot(length(raw_R)==length(R),max(abs(raw_R-R))<1e-12,identical(as.character(raw_dates),as.character(dates)))
${state.view==='multi'&&data.B?'stopifnot(length(raw_B_returns)==length(B),max(abs(raw_B_returns-B))<1e-12)':'# Current view uses asset A; the confirmed paired date subset is preserved.'}
# Use the explicit confirmed vectors R/B above to keep optimization inputs identical.`, '价格先按共同日期对齐，再从相同起止价格计算简单收益；收益表按日期交集。对数收益用expm1；百分数除100。原始CSV仅内嵌在复制脚本，本地读取并核对，不上传。');}
add('functions','模型与统计函数',state.view==='arch'?VR.slice(VR.indexOf('varch <-'),VR.indexOf('vljung <-')):GR+VR,'Base R包含条件高斯似然、受约束优化、ARCH辅助回归、Ljung-Box、预测及CCC。GARCH复用实验07定义；检验为渐近参考，拟合后未用Bootstrap校准。');
if(state.view==='arch'){
add('lm','ARCH效应检验',`mu_hat <- mean(R)\ne <- R-mu_hat\ne2 <- e^2\nlm_result <- tryCatch(varch(e,p$lag),error=function(e)list(error=conditionMessage(e)))\nprint(lm_result)`, '先用常数均值模型残差，再回归平方残差对其滞后。有效样本数n−lag，LM=(n−lag)R²，卡方自由度lag。收益无明显线性相关不代表平方残差无相关。',String.raw`LM=(n-p)R^2\;\overset{a}{\sim}\chi^2_p`);
add('plot','当前观察图',`y <- ${state.archChart==='squared'?'e2*10000':state.archChart==='cluster'?'abs(e)*100':'R*100'}\nplot(dates,y,type="l",xlab="Observation period / date",ylab="${state.archChart==='squared'?'Squared residual (percentage points squared)':'Return / absolute residual (%)'}",main="${state.archChart==='squared'?'Squared residuals':state.archChart==='cluster'?'Volatility clustering proxy: absolute residuals':'Returns'}")`, '平方残差和绝对残差是可观察波动代理，不是直接观测到的真实条件方差。4倍标准化冲击不等于400%收益。');
}else if(state.view==='multi'){
add('ccc','双资产CCC',`mode <- "${state.mode}"\nrhoMode <- "${state.rhoMode}"\ncc <- tryCatch(vccc(R,B,p,mode,rhoMode),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(cc$error))message(cc$error)else {\n print(c(rho=cc$rho,estimated_rho=cc$estimatedRho,weightA=p$weight,weightB=1-p$weight))\n print(tail(data.frame(hA=cc$a$h,hB=cc$b$h,covariance=cc$covariance,portfolio_h=cc$hp,det=cc$det),6))\n}`, '两阶段：分别GARCH拟合，再用相同日期标准化残差相关构造H=D R D。不是联合极大似然；相关常数，不是DCC。',String.raw`h_{p,t}=w_A^2h_{A,t}+w_B^2h_{B,t}+2w_Aw_B\rho\sqrt{h_{A,t}h_{B,t}}`);
add('plot','双资产风险图',`if(is.null(cc$error)) {\n y<-${state.multiChart==='A'?'cc$a$h':state.multiChart==='B'?'cc$b$h':'cc$hp'}\n ${state.multiChart==='all'?'matplot(seq_along(y),sqrt(cbind(cc$a$h,cc$b$h,cc$hp))*100,type="l",lty=c(1,1,2),col=c("steelblue","seagreen","thistle4"),xlab=':'plot(seq_along(y),sqrt(y)*100,type="l",xlab='}"Observation (last = next forecast)",\n ylab="Conditional SD (%)",main="CCC-GARCH: ${state.multiChart||'portfolio'}")\n abline(v=n+.5,lty=3)\n}`, '方差单位为小数收益²，协方差也是小数收益²；图上取平方根乘100为单期标准差百分比。最后一点只为预测。');
}else{
add('fit',state.mode==='estimate'?'真实样本估计':'给定参数递推',`model <- "${type}"\nmode <- "${state.mode}"\nq <- tryCatch(if(mode=="estimate")vfit(R,model)else vpath(R,p,model),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(q$error))message(q$error)else {\n print(unlist(q[c("omega","a","b","gamma","mu","kappa","logLikelihood","parameters","aic","bic")]))\n print(c(n=length(R),converged=if(mode=="estimate")q$converged else NA,current_SD=sqrt(q$h[n]),next_SD=sqrt(tail(q$h,1))))\n if(mode=="estimate"&&(q$persistence>.9999||q$a<1e-5||q$b<1e-5))message("Near parameter boundary: numerical convergence does not prove reliable identification")\n print(tail(data.frame(h=q$h,sigma=sqrt(q$h),actual=c(R,NA_real_)),6))\n}`, type==='m'?'标准差进入均值：μ+κ√h，残差必须按该条件均值重新计算，并反馈到下一期方差。估计模式联合优化μ、κ及方差参数，不把σ乘系数冒充估计。':type==='gjr'?'负冲击系数a+γ，正冲击系数a；约束a≥0、a+γ≥0，且在对称标准正态创新假设下a+b+γ/2<1。估计γ可负，不能预认定为正。':'给定参数不是估计。数据估计固定样本均值，h1为样本方差，所有样本进入条件高斯拟合；拟合路径不冒充过去的事前预测。',type==='m'?String.raw`R_t=\mu+\kappa\sqrt{h_t}+\varepsilon_t`:type==='gjr'?String.raw`h_{t+1}=\omega+(a+\gamma I_{\varepsilon_t<0})\varepsilon_t^2+b h_t`:String.raw`h_{t+1}=\omega+a\varepsilon_t^2+b h_t`);
add('diagnosis','诊断与预测',`if(is.null(q$error)) {\n diagnostics <- list(z=tryCatch(vljung(q$z,p$lag),error=function(e)conditionMessage(e)),\n z2=tryCatch(vljung(q$z^2,p$lag),error=function(e)conditionMessage(e)),\n arch=tryCatch(varch(q$z,p$lag),error=function(e)conditionMessage(e)))\n print(diagnostics)\n forecast <- vforecast(q,p$horizon)\n print(data.frame(k=seq_len(p$horizon),variance=forecast$h,sd=sqrt(forecast$h)))\n}`, '标准化残差ε/√h；平方序列再检验剩余聚集。Ljung-Box采用lag自由度，拟合参数影响参考分布，p值仅渐近近似；不显著不证明模型正确。多期图为√E[h]，不是E[σ]。',String.raw`h_{T+k|T}=\bar h+(a+b+\gamma/2)^{k-1}(h_{T+1|T}-\bar h)`);
if(state.view==='extension'&&state.extension==='asymmetry')add('impact','同幅正负冲击',`if(is.null(q$error)){\n base_h <- tail(q$h,1)\n positive <- q$omega+q$a*p$impact^2+q$b*base_h\n negative <- q$omega+(q$a+q$gamma)*p$impact^2+q$b*base_h\n print(c(positive_variance=positive,negative_variance=negative))\n}`, '保持同一个当前方差状态，比较±相同简单收益残差；差额为γ×冲击²。不是比较不同日期的冲击。');
if(state.compare&&state.view==='model')add('compare','同口径模型比较',`comparison <- lapply(c("arch","garch","gjr"),function(type){\n tryCatch({f<-vfit(R,type);c(LL=f$logLikelihood,k=f$parameters,AIC=f$aic,BIC=f$bic)},error=function(e)conditionMessage(e))})\nnames(comparison)<-c("ARCH","GARCH","GJR");print(comparison)`, '同一收益窗口、同一固定样本均值和h1样本方差；参数数计入估计均值1项，属于插件均值的条件似然比较，不是所有模型联合均值MLE。训练拟合改善不保证样本外预测更好。');
const chart=state.modelChart||'volatility';
if(state.view==='extension'&&type==='gjr')add('plot','当前新闻冲击曲线',`if(is.null(q$error)) {
 shock_grid<-seq(-max(.01,p$impact*1.5),max(.01,p$impact*1.5),length.out=121)
 next_h<-q$omega+(q$a+ifelse(shock_grid<0,q$gamma,0))*shock_grid^2+q$b*tail(q$h,1)
 plot(shock_grid*100,sqrt(next_h)*100,type="l",xlab="Hypothetical residual shock (%)",ylab="Next-period conditional SD (%)")
 points(c(-p$impact,p$impact)*100,sqrt(c(negative,positive))*100,pch=19)
}`, '相同当前方差下的正负残差新闻冲击，不是不同日期的实际收益，也不预设γ为正。');
else add('plot','当前主题图',`if(is.null(q$error)) {\n y <- ${state.view==='extension'&&type==='m'?'q$condMean*100':chart==='residual'?'q$z':chart==='squared'?'q$z^2':chart==='forecast'?'forecast$sigma*100':'sqrt(q$h)*100'}\n plot(seq_along(y),y,type="l",xlab="${chart==='forecast'?'Forecast horizon k':'Observation period'}",ylab="${type==='m'&&state.view==='extension'?'Conditional mean (%)':chart==='residual'?'Standardized residual':chart==='squared'?'Squared standardized residual':'Conditional / forecast SD (%)'}")\n ${chart==='forecast'?'abline(h=sqrt(forecast$long)*100,lty=3)':'abline(v=n+.5,lty=3)'}\n}`, '一次只画当前主题。样本估计图是拟合条件波动率，末点为下一期预测；预测不保证收益方向。κ是模型内关系，不是因果或必然为正的风险补偿。');
}
return{blocks,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,lm,diag,forecast,cc,error,comparison,type};}
return{build};});

;

/* Source: vol-charts.js */
(()=>{'use strict';function render(host,p,s,d,b,interaction){const cols=['#6689a8','#659b8a','#9b88ac'],series=[];let title,xlabel='观测期（按日期排序）',ylabel,xmin=1,xmax,points=[];const n=d.A.length;const put=(name,v,color,dash=false,start=1)=>series.push({name,values:v.map((y,i)=>[i+start,y]),color,dash});
if(s.view==='arch'){const mu=d.A.reduce((a,b)=>a+b,0)/n,e=d.A.map(r=>r-mu);title=s.archChart==='squared'?'平方残差 · 大幅变动的大小':s.archChart==='cluster'?'波动率聚集 · 绝对残差代理':'收益率 · 方向与波动不是同一件事';const y=s.archChart==='squared'?e.map(r=>r*r*10000):s.archChart==='cluster'?e.map(r=>Math.abs(r)*100):d.A.map(r=>r*100);ylabel=s.archChart==='squared'?'平方残差（百分点²）':'收益／绝对残差（%）';put('当前样本',y,cols[0]);xmax=n;
}else if(s.view==='multi'){if(!b.cc){host.innerHTML='<p class="vol-empty">'+WorkbenchUI.esc(b.error||'需要双资产数据')+'</p>';return[];}const c=b.cc;title='CCC · 单期条件标准差与组合风险';ylabel='条件标准差（%）';xmax=n+1;for(const [k,name,values]of [['A','资产A',c.a.h],['B','资产B',c.b.h],['portfolio','组合',c.hp]])if(s.multiChart==='all'||s.multiChart===k)put(name,values.map(v=>100*Math.sqrt(v)),cols[k==='A'?0:k==='B'?1:2],k==='portfolio');
}else{const q=b.q;if(!q){host.innerHTML='<p class="vol-empty">'+WorkbenchUI.esc(b.error||'当前模型不可用')+'</p>';return[];}if(s.view==='extension'&&s.extension==='asymmetry'){title='GJR · 同幅正负冲击的下一期风险';xlabel='假设残差冲击（%；不是标准化z）';ylabel='下一期条件标准差（%）';xmin=-Math.max(.01,p.impact*1.5)*100;xmax=-xmin;const base=q.h.at(-1);series.push({name:'新闻冲击曲线',color:cols[0],values:Array.from({length:121},(_,i)=>{const e=(xmin+(xmax-xmin)*i/120)/100;return[e*100,100*Math.sqrt(q.omega+(q.a+(e<0?q.gamma:0))*e*e+q.b*base)];})});for(const sign of [-1,1])points.push({x:sign*p.impact*100,y:100*Math.sqrt(q.omega+(q.a+(sign<0?q.gamma:0))*p.impact**2+q.b*base),text:(sign<0?'负':'正')+'冲击 '+(p.impact*100).toFixed(2)+'% 的下一期标准差'});
}else if(s.view==='extension'){title='GARCH-M · 条件风险进入均值方程';ylabel='模型条件期望收益（%）';xmax=n;put('条件均值 μ+κ√h',q.condMean.map(x=>x*100),cols[2]);
}else if(s.modelChart==='forecast'){title=s.model.toUpperCase()+' · 多期条件方差预测的平方根';xlabel='未来第k期（没有已实现收益）';ylabel='√预测条件方差（%）';xmax=p.horizon;put('预测标准差',b.forecast.sigma.map(x=>100*x),cols[0]);put('模型长期标准差',Array(p.horizon).fill(100*Math.sqrt(b.forecast.long)),cols[2],true);
}else{const isResidual=s.modelChart==='residual',sq=s.modelChart==='squared';title=s.model.toUpperCase()+(isResidual?' · 标准化残差':sq?' · 平方标准化残差':s.mode==='estimate'?' · 样本内拟合与下一期预测':' · 给定参数条件波动率');ylabel=isResidual?'标准化残差（无量纲）':sq?'平方标准化残差（无量纲）':'条件标准差（%）';xmax=isResidual||sq?n:n+1;put(isResidual?'z = ε/√h':sq?'z²':'条件标准差',isResidual?q.z:sq?q.z.map(x=>x*x):q.h.map(x=>100*Math.sqrt(x)),cols[0]);}}
const ys=series.flatMap(t=>t.values.map(v=>v[1])).concat(points.map(x=>x.y));let ymin=Math.min(0,...ys),ymax=Math.max(0,...ys),dy=ymax-ymin||1;if((s.view==='arch'&&s.archChart==='returns')||(s.view==='model'&&s.modelChart==='residual')||(s.view==='extension'&&s.extension==='premium'))ymin-=dy*.07;else ymin=0;ymax+=dy*.12;if(xmin===xmax)xmax=xmin+1;const X=x=>74+(x-xmin)/(xmax-xmin)*493,Y=y=>310-(y-ymin)/(ymax-ymin)*270;let svg='';for(let j=0;j<5;j++){const x=xmin+(xmax-xmin)*j/4,y=ymin+(ymax-ymin)*j/4;svg+=`<path d="M${X(x)},40V310 M74,${Y(y)}H567" stroke="#e1e8eb"/><text x="${X(x)}" y="334" text-anchor="middle">${s.view==='extension'&&s.extension==='asymmetry'?x.toFixed(1):Math.round(x)}</text><text x="67" y="${Y(y)+4}" text-anchor="end">${y.toPrecision(3)}</text>`;}
for(const t of series)svg+=`<path data-vol-series="${t.name}" d="M${t.values.map(v=>X(v[0])+','+Y(v[1])).join('L')}" fill="none" stroke="${t.color}" stroke-width="2" stroke-dasharray="${t.dash?'6 4':'none'}"/>`;
const tips=[];if(!points.length){for(let i=0;i<series[0].values.length;i++){const [x,y]=series[0].values[i];points.push({x,y,text:(s.modelChart==='forecast'&&s.view==='model'?'未来第':'第')+x+'期'+(d.dates&&x<=n?'（'+d.dates[x-1]+'）':'')+'：'+series.filter(t=>t.values[i]).map(t=>t.name+' '+t.values[i][1].toPrecision(7)).join('；')+'。单位见纵轴。'+(x===n+1?'下一期预测，尚无实际观测。':'')});}}
for(const [i,v]of points.entries()){tips.push(v.text+(s.view==='extension'&&s.extension==='asymmetry'?' '+v.y.toFixed(5)+'%':''));svg+=`<circle data-vol-point="${i}" cx="${X(v.x)}" cy="${Y(v.y)}" r="${v.x===n+1||s.view==='extension'?4:4}" fill="${v.x===n+1||s.view==='extension'&&s.extension==='asymmetry'?cols[2]:'transparent'}" tabindex="0" role="button" aria-label="${WorkbenchUI.esc(tips[i])}"/>`;}
if(xmax===n+1)svg+=`<path d="M${X(n+.5)},40V310" stroke="#9b88ac" stroke-dasharray="3 3"/><text x="565" y="30" text-anchor="end">末点为下一期；无实际收益</text>`;
host.innerHTML=`<h3 id="volChartTitle">${title}</h3><div class="vol-svg"><svg viewBox="0 0 600 385" role="img" aria-label="${title}">${svg}<text x="320" y="374" text-anchor="middle">${xlabel}</text><text transform="translate(19 183) rotate(-90)" text-anchor="middle">${ylabel}</text></svg></div>`;host.querySelectorAll('[data-vol-point]').forEach(el=>interaction.bind(el,tips[+el.dataset.volPoint]));return series.map(t=>({label:t.name,color:t.color,dash:t.dash}));}
window.VolCharts={render};})();

;

/* Source: vol-adv-math.js */
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

;

/* Source: vol-adv-view.js */
/* Experiment06 拓展视图：SV 类模型（6.2）与高频波动（6.3）。
   在 GARCH 工作台内挂载，复用其代码面板；文案走 LabKit.t，语言切换即重绘。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.VolAdvMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={view:'sv',p:{...window.VolAdvMath.defaults},built:null,last:null};
function controls(){
  const {view}=state,p=state.p;
  let host=$('#volAdvControls');
  if(!host){host=document.createElement('section');host.id='volAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  const f=(id,zh,en,min,max,step)=>K.field({id,zh,en,value:p[id],min,max,step});
  host.innerHTML=`<h3>${K.esc(view==='sv'?t('SV 模型参数','Stochastic-volatility parameters'):t('高频与微观结构参数','High-frequency and microstructure parameters'))}</h3>
    <p class="lab-note">${K.esc(view==='sv'
      ?t('对数方差服从 AR(1)，波动不可观测；对数平方收益是它的带噪观测。','Log variance follows an AR(1); volatility is latent and log-squared returns are noisy observations of it.')
      :t('观测价格 = 真实价格 + 微观结构噪声；采样越细，已实现方差的噪声偏差越大。','Observed price equals true price plus microstructure noise; finer sampling inflates the noise bias in realised variance.'))}</p>
    ${view==='sv'
      ? f('n','样本量','Sample size',200,2000,1)+f('svMu','真实 μ（对数方差均值）','True μ (mean log variance)',-8,-4,.1)+f('phi','真实 φ（持续性）','True φ (persistence)',.5,.995,.005)+f('svSig','真实 σ_η（状态噪声）','True σ_η (state noise)',.05,1,.01)+f('seed','随机种子','Random seed',1,99999999,1)
      : f('hfDays','交易日数','Trading days',20,200,1)+f('hfBars','每日分钟收益数','Intraday bars per day',12,144,4)+f('hfNoise','微观结构噪声强度','Microstructure noise',0,3,.1)+f('hfJumps','跳跃概率','Jump probability',0,.5,.01)+f('hfSeed','随机种子','Random seed',1,99999999,1)}
    ${K.tasks(view==='sv'
      ? [['先预测：SV 滤波的波动率应该在冲击后立刻跳升，还是缓慢跟随？','Predict first: should filtered SV volatility jump immediately after a shock, or follow slowly?'],
         ['把 φ 调到 0.999，观察滤波曲线是否变得“更平滑但更滞后”。','Set φ to 0.999 and see whether the filtered curve becomes smoother but more lagged.'],
         ['对比真实波动与 EWMA，说明为什么两者都不能当作“真实波动”。','Compare with EWMA and explain why neither is the true volatility.']]
      : [['先预测：采样间隔从 1 分钟放大到 24 分钟，RV 应该上升还是下降？','Predict first: does RV rise or fall when the sampling interval grows from one bar to 24?'],
         ['把噪声强度调到 0，观察 signature plot 是否变平。','Set the noise strength to zero and see the signature plot flatten.'],
         ['比较 RV 与 BPV：两者之差在跳跃日应该更大吗？','Compare RV with BPV: should their gap widen on jump days?']])}`;
  sync();
  return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#volAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,'');const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const view=state.view,p=state.p;
  const host=$('#volPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const title=host.querySelector('h3'),svg=host.querySelector('.svg-host');
  try{
    if(view==='sv'){
      const q=M().svView(p);state.last=q;
      title.textContent=t('滤波波动率、真实波动率与 EWMA','Filtered, true and EWMA volatility');
      const step=Math.max(1,Math.floor(q.r.length/300));
      const pts=(a)=>a.map((v,i)=>[i+1,v]).filter((_,i)=>i%step===0);
      K.chart(svg,{xLabel:['交易日','Day'],yLabel:['日波动率','Daily volatility'],
        series:[{type:'line',points:pts(q.trueVol),color:'#b5bfcc'},
          {type:'line',points:pts(q.vol),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 日：SV 滤波 ${K.pct(d[1])}`,'Day '+Math.round(d[0])+': SV filter '+K.pct(d[1])]},
          {type:'line',points:pts(q.ewma),color:'#9b88ac',dash:true}],
        aria:['波动率对比','Volatility comparison']});
      K.metrics([['滤波 μ̂（对数方差）','Fitted μ̂',q.mu.toFixed(3)],['φ̂','φ̂',q.phi.toFixed(3)],['σ̂_η','σ̂_η',q.sigma.toFixed(3)]]);
      K.legend([['真实波动','True volatility','#b5bfcc',false],['SV 滤波','SV filter','#6689a8',false],['EWMA λ=0.94','EWMA λ=0.94','#9b88ac',true]]);
      K.details(K.table([['项目','Item'],['估计','Estimate'],['真值','Truth']],[
        ['μ',q.mu.toFixed(4),String(q.trueMu)],['φ',q.phi.toFixed(3),String(q.truePhi)],['σ_η',q.sigma.toFixed(3),String(q.trueSigma)],
        [t('似然/期','Log-likelihood per period'),q.loglik.toFixed(4),'—'],
        [t('平均日波动','Mean daily volatility'),K.pct(q.fitPct),K.pct(q.trueVol.reduce((a,b)=>a+b,0)/q.trueVol.length)],
        [t('标准化残差标准差','Standardised residual SD'),q.residSd.toFixed(3),'1.000']])+
        `<p class="chart-note">${K.esc(t('μ 在准极大似然下识别较弱，偏差是估计方法的性质，不是数据错误。滤波波动率只用当下及过去的信息。','μ is weakly identified under quasi-maximum likelihood; its bias is a property of the estimator, not a data error. The filtered volatility uses only current and past information.'))}</p>`);
      K.graphKind(t('SV · 卡尔曼滤波','SV · Kalman filter'),t('合成日收益','Synthetic daily returns'));
      state.built=M().build('sv',q,p,'full',K.lang());
    }else{
      const q=M().hfView(p);state.last=q;
      title.textContent=t('signature plot：RV 随聚合间隔的变化','Signature plot: RV against the aggregation interval');
      K.chart(svg,{xLabel:['聚合间隔 k（根）','Aggregation k (bars)'],yLabel:['RV','RV'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'line',points:q.signature.map((s,i)=>[i+1,s.mean]),color:'#6689a8',marker:true,
          tip:d=>{const s=q.signature[Math.round(d[0])-1];return[`k=${s.k}：RV=${s.mean.toExponential(3)}`,'k='+s.k+': RV='+s.mean.toExponential(3)];}},
          {type:'line',points:q.signature.map((s,i)=>[i+1,q.meanTrue]),color:'#659b8a',dash:true}],
        aria:['signature plot','Signature plot']});
      K.metrics([['平均 RV','Mean RV',q.meanRV.toExponential(3)],['平均 BPV','Mean BPV',q.meanBPV.toExponential(3)],['跳跃占比','Jump share',K.pct(q.meanJump,1)]]);
      K.legend([['RV（不同 k）','RV by k','#6689a8',false],['真实积分方差','True integrated variance','#659b8a',true]]);
      K.details(K.table([['项目','Item'],['数值','Value']],[
        [t('交易日数','Trading days'),String(q.nDays)],[t('每日 bar 数','Bars per day'),String(q.bars)],
        [t('噪声导致的 RV 偏差','RV bias from noise'),K.pct(q.noiseShare,0)],
        [t('含跳跃的天数','Days with a jump'),String(q.jumpDays)],
        [t('平均跳跃占比','Mean jump share'),K.pct(q.meanJump,1)],
        [t('k=1 的 RV','RV at k=1'),q.signature[0].mean.toExponential(3)],
        [t('最粗 k 的 RV','RV at the coarsest k'),q.signature[q.signature.length-1].mean.toExponential(3)]])+
        `<p class="chart-note">${K.esc(t('RV 与 BPV 的差是跳跃的描述性度量；本页未做阈值化的正式跳跃检验，也不把合成数据当作真实高频行情。','The RV–BPV gap is a descriptive jump measure; this page runs no formal threshold jump test and the synthetic data is not real high-frequency data.'))}</p>`);
      K.graphKind(t('高频 · 已实现方差','High frequency · realised variance'),t('合成日内价格','Synthetic intraday prices'));
      state.built=M().build('hf',q,p,'full',K.lang());
    }
    $('#validation').textContent='';
    return state.built;
  }catch(e){
    $('#validation').textContent=e.message;svg.innerHTML='';return null;
  }
}
function render({view,p,mode,onBuilt}){
  state.view=view;state.mode=mode;
  /* 只借宿主的随机种子（便于与其他视图同源），其余参数用本视图自己的默认值，
     避免把 GARCH 视图的样本量 n=160 带进 SV 的 200–2000 约束。 */
  if(p&&Number.isFinite(p.shock))state.p.seed=state.p.seed;
  controls();
  const host=$('#volAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.VolAdvView={render,state};
})();

;

/* Source: vol-workbench.js */
(()=>{'use strict';const V=VolMath,C=VolCode,$=s=>document.querySelector(s),esc=s=>WorkbenchUI.esc(String(s)),fmt=(x,n=5)=>Number.isFinite(x)?Number(x.toPrecision(n)).toString():'不可用',pct=x=>fmt(x*100,5)+'%';
function mount(){CourseExperiments.mount('garch');document.body.classList.add('vol-workbench');let p={...V.defaults},state={view:'arch',model:'garch',extension:'asymmetry',mode:'teaching',multiMode:'estimate',archChart:'returns',modelChart:'volatility',multiChart:'all',rhoMode:'estimated',compare:false},dataset=null,built,valid=false,selected='lm',focus=null,codeMode='full';
$('.learning').hidden=true;$('#assumptions').textContent='合成数据不是市场行情；默认固定正弦冲击并非iid正态，检验可能不显著。条件正态是估计假设，不是金融收益的普遍保证。样本估计为拟合，不能把训练内路径说成过去事前预测。检验p值是常规渐近参考，参数估计会影响参考分布；不显著不证明模型正确。GJR在对称正态创新下使用γ/2；GARCH-M标准差进入均值，κ不具有因果或预设正号。CCC两阶段估计，相关恒定，不是DCC。';
const tabs=document.createElement('div');tabs.id='volViews';tabs.innerHTML=[['arch','ARCH效应'],['model','GARCH建模'],['extension','模型扩展'],['multi','多资产波动'],['sv','SV 类模型'],['hf','高频波动']].map(([k,l])=>`<button data-vol-view="${k}">${l}</button>`).join('');$('.model-panel .panel-head').after(tabs);const question=document.createElement('p');question.id='volQuestion';tabs.after(question);const controls=document.createElement('div');controls.id='volControls';question.after(controls);
function field(k,label){return `<label id="vf-${k}"><span>${label}</span><input id="vol-${k}" type="number" step="any" value="${p[k]}"></label>`;}
$('#inputs').innerHTML='<label id="volModeField">操作模式<select id="volMode"><option value="teaching">参数探索</option><option value="estimate">数据估计</option></select></label>'+[['omega','基础方差ω（收益小数²）'],['a','冲击系数α'],['b','持续系数β'],['gamma','负冲击额外系数γ'],['kappa','风险溢价关系κ（可负）'],['mu','教学均值μ（小数）'],['horizon','预测期数（1–100）'],['lag','检验滞后阶数'],['level','显著性水平（0.05=5%）'],['impact','同幅正负残差（0.03=3%）'],['weight','资产A权重（B=1−A）'],['rho','教学相关系数ρ'],['n','合成样本量（60–1500）'],['shock','第41期标准化冲击z（不是收益%）']].map(([k,l])=>field(k,l)).join('')+'<label id="volRhoField">相关系数来源<select id="volRhoMode"><option value="estimated">共同标准化残差估计</option><option value="manual">手动教学情景</option></select></label><p id="volWeight"></p>';
const dataBox=document.createElement('details');dataBox.id='volData';dataBox.innerHTML='<summary>本地CSV与来源</summary><p>单资产：date,return或date,price；双资产宽表：date,A,B。日期YYYY-MM-DD。也可分别选A/B两份单资产文件，按日期交集配对；不按行拼接。</p><label>数据类型<select id="volKind"><option value="simple">简单收益</option><option value="log">对数收益→简单收益</option><option value="price">价格→简单收益</option></select></label><label>收益单位<select id="volUnit"><option value="decimal">小数（0.01=1%）</option><option value="percent">百分数数值（1=1%）</option></select></label><label>资产A或双资产CSV<input id="volFileA" type="file" accept=".csv"></label><label>资产B CSV（可选，按日期配对）<input id="volFileB" type="file" accept=".csv"></label><button id="volImport">导入所选数据</button><button id="volExport">导出当前数据</button><button id="volSynthetic">恢复合成数据</button><p id="volDataError" role="alert"></p><p id="volDataNote"></p>';$('#inputs').after(dataBox);
$('#chartHost').innerHTML='<div id="volPlot"></div><div id="volTip" class="chart-tooltip" hidden></div>';const interaction=ChartInteraction.create((text,mode)=>{const tip=$('#volTip');tip.hidden=!text;tip.dataset.state=mode;if(text){tip.innerHTML='<button id="volCloseTip" aria-label="关闭详情">×</button>'+esc(text);$('#volCloseTip').onclick=()=>interaction.clear();}});$('#volPlot').onclick=e=>{if(!e.target.closest('[data-vol-point]'))interaction.clear();};const nav=document.createElement('nav');nav.id='volCodeNav';$('.code-toolbar').after(nav);
const effective=()=>({...state,mode:state.view==='multi'?state.multiMode:state.mode});
function arrange(){const s=effective(),view=state.view;$('#volModeField').hidden=view==='arch';const relevant={arch:['n','shock','lag','level'],model:['horizon','lag','level',...(s.mode==='teaching'?['omega','a','b','mu']:[])],extension:['lag','level',...(state.extension==='asymmetry'?['impact']:[]),...(s.mode==='teaching'?['omega','a','b','mu',...(state.extension==='asymmetry'?['gamma']:['kappa'])]:[])],multi:['weight',...(s.mode==='teaching'?['omega','a','b','mu']:[]),...(state.rhoMode==='manual'?['rho']:[])]}[view];for(const k in p){$('#vf-'+k).hidden=!relevant.includes(k);if(['n','shock'].includes(k))$('#vol-'+k).disabled=!!dataset;}$('#vf-b').hidden=state.view==='model'&&state.model==='arch'||!relevant.includes('b');$('#volRhoField').hidden=view!=='multi';$('#volWeight').hidden=view!=='multi';$('#volWeight').textContent='A '+pct(p.weight)+'；B '+pct(1-p.weight);$('#volMode').value=s.mode;}
function render(){
 if(state.view==='sv'||state.view==='hf'){
  if(!window.VolAdvView)throw Error('SV / 高频视图未加载。');
  const out=window.VolAdvView.render({view:state.view,p,mode:state.mode,onBuilt:c=>{built={blocks:c.blocks,code:c.code};valid=true;$('#copy').disabled=false;renderCode();}});
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.volView===state.view)));
  $('#graphKind').textContent=window.LabKit.t(state.view==='sv'?'合成日收益':'合成日内价格',state.view==='sv'?'Synthetic daily returns':'Synthetic intraday prices');
  $('#assumptionSummary').innerHTML=[['单期简单收益','One-period simple return'],['合成数据','Synthetic'],['完整 Base R','Full base R']].map(x=>'<span>'+window.LabKit.t(x[0],x[1])+'</span>').join('');
  if(!out)return;
  return;
 }
 const vac=$('#volAdvControls');if(vac)vac.hidden=true;
 for(const el of $('#inputs').children)el.hidden=false;
 interaction.clear();interaction.redraw(()=>false);arrange();try{const next=Object.fromEntries(Object.keys(V.defaults).map(k=>[k,$('#vol-'+k).value.trim()===''?NaN:Number($('#vol-'+k).value)]));V.settings(next);p=next;const data=dataset||V.generate(p);built=C.build(p,effective(),data);valid=true;$('#copy').disabled=false;$('#validation').textContent='';draw(data);}catch(e){valid=false;$('#copy').disabled=true;$('#validation').textContent=e.message;$('#metrics').innerHTML='<p>当前输入无法生成有效结果</p>';$('#volPlot').innerHTML='<p class="vol-empty">'+esc(e.message)+'</p>';$('#details').innerHTML='';$('#legend').innerHTML='';}arrange();}
function draw(d){const s=effective(),q=built.q;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.volView===s.view)));$('#graphKind').textContent=d.source;$('#assumptionSummary').innerHTML='<span>单期简单收益</span><span>'+esc(d.source)+'</span><span>完整Base R</span>';$('#volDataNote').textContent=d.note||'默认160期固定正弦z，在第41期加冲击；4倍z不是400%收益。原始合成数据生成参数固定，改变拟合／教学参数不会换样本。';
const button=(attr,k,label,on)=>`<button ${attr}="${k}" aria-pressed="${on}">${label}</button>`;
controls.innerHTML=s.view==='arch'?[['returns','收益率'],['squared','平方残差'],['cluster','波动率聚集']].map(([k,l])=>button('data-varch',k,l,s.archChart===k)).join(''):s.view==='model'?'<label>基本模型<select id="volModel"><option value="garch">GARCH(1,1)</option><option value="arch">ARCH(1)</option></select></label>'+[['volatility','条件波动率'],['residual','标准化残差'],['squared','平方标准化残差'],['forecast','波动率预测']].map(([k,l])=>button('data-vchart',k,l,s.modelChart===k)).join('')+'<label><input id="volCompare" type="checkbox" '+(s.compare?'checked':'')+'>展开同样本模型比较</label>':s.view==='extension'?[['asymmetry','不对称波动 · GJR'],['premium','风险溢价 · GARCH-M']].map(([k,l])=>button('data-vextension',k,l,s.extension===k)).join(''):[['all','两资产与组合'],['A','资产A'],['B','资产B'],['portfolio','组合']].map(([k,l])=>button('data-vmulti',k,l,s.multiChart===k)).join('');
if($('#volModel')){$('#volModel').value=s.model;$('#volModel').onchange=()=>{state.model=$('#volModel').value;render();};$('#volCompare').onchange=()=>{state.compare=$('#volCompare').checked;render();};}
const legend=VolCharts.render($('#volPlot'),p,s,d,built,interaction);$('#legend').innerHTML=legend.map(l=>`<span><i style="--legend-color:${l.color};--legend-style:${l.dash?'dashed':'solid'}"></i>${l.label}</span>`).join('');
if(s.view==='arch'){const t=built.lm;$('#volQuestion').textContent='为什么金融市场的剧烈波动往往连续出现？';$('#metrics').innerHTML=t.error?'<p>当前检验不可用</p>':metric('ARCH-LM统计量',fmt(t.stat))+metric('p值 · 滞后'+p.lag,fmt(t.p));$('#details').innerHTML=t.error?'<p>'+esc(t.error)+'</p>':`<p id="volInsight">${d.A.length}期中，滞后损失${p.lag}期，有效${t.n}期。${t.p<p.level?'当前样本提供ARCH效应的统计证据，过去平方残差对当前波动有解释能力。':'当前检验没有足够证据拒绝所检验的无ARCH效应原假设；不能证明没有ARCH效应。'}</p><details><summary>检验定义和数据限制</summary><p>固定样本均值残差；LM=(n−lag)R²，卡方自由度lag，渐近p值。默认固定正弦冲击并非iid正态样本，单次冲击不保证检验显著。平方／绝对残差是可观察波动代理，波动率不等于收益方向。</p></details>`;
}else if(s.view==='multi'){const c=built.cc;$('#volQuestion').textContent='两种资产同时波动，如何描述它们的共同风险？';$('#metrics').innerHTML=c?metric('下一期组合标准差',pct(Math.sqrt(c.hp.at(-1))))+metric('相关系数ρ',fmt(c.rho)):metric('CCC当前不可用','—');$('#details').innerHTML=c?`<p id="volInsight">A权重${pct(p.weight)}、B权重${pct(1-p.weight)}；${state.rhoMode==='estimated'?'ρ来自共同日期标准化残差相关':'ρ为手动教学情景，不是估计结果'}。A下一期${pct(Math.sqrt(c.a.h.at(-1)))}，B下一期${pct(Math.sqrt(c.b.h.at(-1)))}。同样个体风险下，相关性会改变组合风险。</p><details><summary>CCC两阶段估计与矩阵</summary><p>${s.mode==='estimate'?'分别拟合A/B单变量GARCH，再估计标准化残差相关；不是联合MLE。':'当前是给定参数递推，非统计估计。'}H=D R D；下一期协方差${fmt(c.covariance.at(-1),9)}（小数收益²），行列式${fmt(c.det.at(-1),9)}>0，对称正定。CCC条件相关恒定，不是DCC。${c.a.warning||''} ${c.b.warning||''}</p></details>`:failure(built.error);
}else{const ext=s.view==='extension';$('#volQuestion').textContent=ext?(s.extension==='asymmetry'?'同样幅度的上涨与下跌，对下一期风险有何不同？':'预期收益是否随模型中的条件风险水平变化？'):'一次市场冲击，为什么会影响之后多期的波动率？';$('#metrics').innerHTML=q?metric('下一期条件标准差',pct(Math.sqrt(q.h.at(-1))))+metric(ext&&s.extension==='premium'?'风险关系κ':'持久性',fmt(ext&&s.extension==='premium'?q.kappa:q.persistence)):metric('当前模型不可用','—');
if(!q)$('#details').innerHTML=failure(built.error);else{const a=built.diag.arch;let insight=ext?s.extension==='asymmetry'?`γ=${fmt(q.gamma)}。同一当前方差下，−${pct(p.impact)}与+${pct(p.impact)}残差冲击的下一期方差差额为γ×冲击²=${fmt(q.gamma*p.impact**2,8)}。γ可负，不能预设市场中负冲击一定更强。`:`均值方程使用标准差：μ+κ√h。当前κ=${fmt(q.kappa)}，可为正或负；这不是统计显著性声明，也不是因果效应。残差按该均值计算，再反馈到下一期方差。`:a.error?'当前残差ARCH诊断不可用：'+a.error:a.p<p.level?'标准化残差仍有当前检验识别到的ARCH效应，模型可能未充分解释聚集。':'标准化残差平方没有表现出当前检验能识别的显著ARCH效应；不等于证明模型正确。';$('#details').innerHTML=`<p id="volInsight">${insight}</p><p class="vol-note">${s.mode==='estimate'?'真实条件高斯样本估计；曲线为样本内拟合，末点才是下一期预测。':'给定教学参数，非样本估计；h1采用所选模型长期方差。'}${esc(q.warning||'')}</p><details id="volDiagnostics"><summary>估计、诊断和预测详情</summary><p>ω=${fmt(q.omega,9)}，α=${fmt(q.a,9)}，β=${fmt(q.b,9)}，γ=${fmt(q.gamma,9)}，μ=${fmt(q.mu,9)}，κ=${fmt(q.kappa,9)}。${s.mode==='estimate'?'数值收敛；对数似然'+fmt(q.logLikelihood,10)+'，样本'+q.n+'期；初始方差为样本方差。第T期拟合标准差'+pct(Math.sqrt(q.h[q.n-1]))+'，下一期'+pct(Math.sqrt(q.h.at(-1)))+'。多起点局部优化，不保证全局最优或参数显著性。':'理论长期方差'+fmt(built.forecast.long,9)+'不等于当前预测方差。'}</p>${diagTable(built.diag)}<p>Ljung-Box自由度lag（fitdf=0）；GARCH参数估计影响渐近参考，未做Bootstrap，p值不证明正态或模型正确。未来${p.horizon}期取√预测方差，不是E[标准差]。未做样本外预测性能排序。</p><a href="experiments.html?model=var">在实验07查看VaR/ES应用（不传递当前数据或参数）</a></details>`;if(built.comparison)$('#details').insertAdjacentHTML('beforeend','<details open><summary>同样本模型比较</summary><table><tr><th>模型</th><th>LL / k</th><th>AIC / BIC</th></tr>'+built.comparison.map(t=>`<tr><th>${t.type}</th><td>${t.error?esc(t.error):fmt(t.logLikelihood,7)+' / '+t.parameters}</td><td>${t.error?'不可用':fmt(t.aic,7)+' / '+fmt(t.bic,7)}</td></tr>`).join('')+'</table><p>同样本、同一插件均值和样本方差初始化，计入均值参数；不是联合均值MLE或样本外优胜证明。</p></details>');}}
renderCode();}
function metric(l,v){return `<div><span>${l}</span><b>${v}</b></div>`;}function failure(e){return '<p role="alert">'+esc(e||'当前模型不可用')+'</p><p>未用预设参数回退。可切换参数探索或更换合适样本。</p>';}function diagTable(d){return '<table><tr><th>诊断</th><th>统计量</th><th>p值</th></tr>'+[['z Ljung-Box',d.z],['z² Ljung-Box',d.z2],['z ARCH-LM',d.arch]].map(([k,t])=>`<tr><th>${k}</th><td>${t.error?esc(t.error):fmt(t.stat)}</td><td>${t.error?'不可用':fmt(t.p)}</td></tr>`).join('')+'</table>';}
function renderCode(){const shown=built.blocks.filter(b=>codeMode==='full'||!['data','functions'].includes(b.key));if(!shown.some(b=>b.key===selected)){selected=shown[0].key;focus=null;}const scroll=$('#code').scrollTop;let row=0;$('#code').innerHTML=built.blocks.map(b=>{const first=row;row+=b.lines.length;if(!shown.includes(b))return '';return '<div class="logic-block">'+b.lines.map((l,i)=>`<button class="code-line ${b.key===selected&&(focus===null||focus===i)?'selected':''}" data-vcode="${b.key}" data-line="${i}"><span class="num">${first+i+1}</span><code>${WorkbenchUI.colorCode(l)}</code></button>`).join('')+'</div>';}).join('');$('#code').scrollTop=scroll;nav.innerHTML=shown.map(b=>`<button data-vjump="${b.key}" aria-pressed="${b.key===selected}">${b.title}</button>`).join('');const b=built.blocks.find(b=>b.key===selected);$('#explanation').innerHTML='<h3>'+b.title+'</h3><p>'+esc(b.explain)+'</p><div id="volFormula"></div>';if(b.formula)katex.render(b.formula,$('#volFormula'),{throwOnError:false});$('#codeNotice').textContent=codeMode==='full'?'完整数据、函数、估计/诊断、当前图；复制不依赖隐藏变量':'关键计算阅读；主复制仍包含完整数据、函数和图';document.querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===codeMode)));}
function jump(k){selected=k;focus=0;renderCode();const target=$(`#code [data-vcode="${k}"]`),code=$('#code');code.scrollTop+=target.getBoundingClientRect().top-code.getBoundingClientRect().top-8;}
nav.onclick=e=>{const b=e.target.closest('[data-vjump]');if(b)jump(b.dataset.vjump);};$('#code').onclick=e=>{const b=e.target.closest('[data-vcode]');if(b){selected=b.dataset.vcode;focus=+b.dataset.line;renderCode();}};tabs.onclick=e=>{const b=e.target.closest('[data-vol-view]');if(b){state.view=b.dataset.volView;selected=state.view==='arch'?'lm':state.view==='multi'?'ccc':'fit';focus=null;codeMode='full';render();if(valid)jump(selected);}};
controls.onclick=e=>{const b=e.target.closest('button');if(!b)return;for(const [attr,key]of [['varch','archChart'],['vchart','modelChart'],['vextension','extension'],['vmulti','multiChart']])if(b.dataset[attr]){state[key]=b.dataset[attr];render();}};$('#volMode').onchange=()=>{state[state.view==='multi'?'multiMode':'mode']=$('#volMode').value;render();};$('#volRhoMode').onchange=()=>{state.rhoMode=$('#volRhoMode').value;render();};$('#inputs').addEventListener('input',e=>{if(e.target.matches('input'))render();});
document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{codeMode=b.dataset.codeMode;$('#codeNotice').textContent=codeMode==='basic'?'关键逻辑导航；复制仍完整':'完整脚本';if(codeMode==='basic')jump(state.view==='arch'?'lm':state.view==='multi'?'ccc':'fit');else renderCode();});$('#copy').onclick=async()=>{if(!valid)return;try{await navigator.clipboard.writeText(built.code);$('#codeNotice').textContent='已复制当前完整脚本，可在干净R会话运行';}catch{download(built.code,'experiment06-'+state.view+'.R');}};
if(window.LabKit)window.LabKit.onLang(()=>{if(state.view==='sv'||state.view==='hf')render();});
function download(text,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#volImport').onclick=async()=>{try{const a=$('#volFileA').files[0],b=$('#volFileB').files[0];if(!a)throw Error('请选择资产A或双资产CSV。');if(a.size>2e6||b?.size>2e6)throw Error('文件超过2MB。');dataset=V.importData(await a.text(),{kind:$('#volKind').value,unit:$('#volUnit').value},b?await b.text():undefined);$('#volDataError').textContent='';render();}catch(e){$('#volDataError').textContent=e.message+' 当前确认数据未替换。';}};$('#volSynthetic').onclick=()=>{dataset=null;$('#volFileA').value=$('#volFileB').value='';$('#volDataError').textContent='';render();};$('#volExport').onclick=()=>{const d=dataset||V.generate(p),dates=d.dates||d.A.map((_,i)=>new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10));download('date,'+(d.B?'A,B':'return')+'\n'+d.A.map((r,i)=>dates[i]+','+r+(d.B?','+d.B[i]:'')).join('\n'),dataset?'user-confirmed-returns.csv':'synthetic-teaching-returns.csv');};$('#reset').onclick=()=>{p={...V.defaults};dataset=null;for(const k in p)$('#vol-'+k).value=p[k];state.mode='teaching';state.multiMode='estimate';$('#volFileA').value=$('#volFileB').value='';render();};
function info(title,text){$('#infoTitle').textContent=title;$('#infoBody').textContent=text;ModalUI.open($('#infoDialog'));}for(const id of ['#catalog','#catalogMobile'])$(id).onclick=()=>ModalUI.open($('#catalogDialog'));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>info('实验06 · 自由探索','四个主题直接切换，无预测题解锁。模型数据来自标记的合成或本地CSV。点击代码看金融说明，完整复制到R。单期波动率不是下一期收益方向保证。');$('#teacher').onclick=()=>info('课程与统计边界','先观察收益与平方残差，再检验、拟合、诊断及预测。默认固定冲击可能不显著，不能改数据迎合结论。GJR可有负γ，GARCH-M的κ不代表因果，CCC不是DCC。软件检查不等于真实学生已掌握。');const practice=document.createElement('button');practice.id='rStudioPractice';practice.textContent='RStudio实践';$('.code-toolbar').append(practice);practice.onclick=()=>info('完整R复现','复制完整脚本到干净R Script，全选运行。仅需Base R。当前收益已内嵌，日期已配对，脚本含全部函数、参数和输出。网页不执行R。');$('#projector').onclick=()=>{document.body.classList.toggle('projector');$('#projector').setAttribute('aria-pressed',String(document.body.classList.contains('projector')));interaction.clear();};let share=62;const resize=v=>{share=Math.min(75,Math.max(40,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',100-share+'fr');};$('#splitter').onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();resize(share+(e.key==='ArrowDown'?2:-2));}};$('#splitter').onpointerdown=e=>{const el=e.currentTarget,y=e.clientY,start=share,h=$('.code-regions').clientHeight;el.setPointerCapture(e.pointerId);el.onpointermove=e=>resize(start+100*(e.clientY-y)/h);el.onpointerup=()=>el.onpointermove=null;};window.VolLab=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({p,state:effective(),data:dataset||V.generate(p),built,valid}))});render();}
window.VolWorkbench={mount};})();

;

/* Source: reg-math.js */
/* Experiment04. All splits/transformations/selection are fitted on training rows only. */
(function(root,f){const a=f(typeof module==='object'?require('./capm-math'):root.CAPMMath);if(typeof module==='object')module.exports=a;else root.RegMath=a;})(this,C=>{
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length,dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sum2=a=>dot(a,a),defaults={n:240,rho:.85,noise:.008,seed:20261021,train:.8,lambda:.001,logMin:-6,logMax:0,tol:1e-9,maxit:20000};
function settings(p){for(const k in defaults)if(!Number.isFinite(p[k]))throw Error('参数必须为有限数值');if(!Number.isInteger(p.n)||p.n<60||p.n>1000||!Number.isInteger(p.seed)||p.seed<1||p.seed>2147483646)throw Error('样本量60–1000，种子1–2147483646，均为整数');if(p.rho<0||p.rho>1||p.noise<0||p.noise>.1||p.train<.6||p.train>.9)throw Error('相关程度0–1，噪声0–0.1，训练比例0.6–0.9');if(p.lambda<0||p.lambda>100||p.logMin< -9||p.logMax>2||p.logMin>=p.logMax||p.tol<1e-12||p.tol>1e-5||!Number.isInteger(p.maxit)||p.maxit<1||p.maxit>100000)throw Error('λ/搜索范围/优化精度无效');}
function generate(p){settings(p);let seed=p.seed;const unif=()=>{seed=seed*16807%2147483647;return seed/2147483647;},norm=()=>Math.sqrt(-2*Math.log(unif()))*Math.cos(2*Math.PI*unif());const X=[],y=[],dates=[],featureDates=[];for(let i=0;i<p.n;i++){const u=norm(),v=norm(),a=.015*u,b=.015*(p.rho*u+Math.sqrt(1-p.rho*p.rho)*v),c=.01*norm(),d=.015*norm(),e=.01*norm();X.push([a,b,c,d,e]);y.push(.0003+.45*a-.3*b+.2*c+.008*norm()*(p.noise/.008));dates.push(new Date(Date.UTC(2020,0,i+2)).toISOString().slice(0,10));featureDates.push(new Date(Date.UTC(2020,0,i+1)).toISOString().slice(0,10));}return{X,y,dates,featureDates,names:['market_lag1','industry_lag1','vol_change_lag1','related_lag1','noise_lag1'],source:'合成教学金融数据，非真实市场行情',note:'每行用t−1期已知特征预测t期简单收益。日期为合成观测日（含非交易日），不冒充交易日历；固定种子正态创新。相关程度/噪声/样本量/种子变化会重新生成整份数据。',predictive:true};}
function validate(X,y){if(!Array.isArray(X)||X.length!==y.length||y.length<3||!X[0]?.length||X[0].length>20||X.some(r=>r.length!==X[0].length)||X.flat().concat(y).some(v=>!Number.isFinite(v)||Math.abs(v)>1e8))throw Error('数值矩阵无效（3行以上、1–20特征、有限数值绝对值≤1e8）');}
function qr(A,y,tol=1e-10){const n=A.length,k=A[0].length,cols=Array.from({length:k},(_,j)=>A.map(r=>r[j])),perm=Array.from({length:k},(_,i)=>i),Q=[],R=Array.from({length:k},()=>Array(k).fill(0)),norm0=Math.max(...cols.map(c=>Math.sqrt(sum2(c))));let rank=0;for(let j=0;j<Math.min(k,n);j++){let at=j;for(let t=j+1;t<k;t++)if(sum2(cols[t])>sum2(cols[at]))at=t;[cols[j],cols[at]]=[cols[at],cols[j]];[perm[j],perm[at]]=[perm[at],perm[j]];for(let t=0;t<j;t++)[R[t][j],R[t][at]]=[R[t][at],R[t][j]];const size=Math.sqrt(sum2(cols[j]));if(size<=tol*norm0)break;R[j][j]=size;const q=cols[j].map(x=>x/size);Q.push(q);for(let t=j+1;t<k;t++){let r=dot(q,cols[t]);cols[t]=cols[t].map((v,i)=>v-r*q[i]);const correction=dot(q,cols[t]);cols[t]=cols[t].map((v,i)=>v-correction*q[i]);R[j][t]=r+correction;}rank++;}const back=b=>{const x=Array(rank).fill(0);for(let j=rank-1;j>=0;j--)x[j]=(b[j]-x.reduce((s,v,t)=>s+(t>j?R[j][t]*v:0),0))/R[j][j];return x;},bp=back(Q.map(q=>dot(q,y))),coef=Array(k).fill(null);bp.forEach((v,i)=>coef[perm[i]]=v);return{rank,coef,Q,R,perm,back};}
function tcrit(df){let lo=0,hi=1000;for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(C.pvalue(mid,df)>.05)lo=mid;else hi=mid;}return(lo+hi)/2;}
function ols(X,y){validate(X,y);const n=y.length,p=X[0].length,m=X[0].map((_,j)=>mean(X.map(r=>r[j]))),sc=m.map((v,j)=>Math.sqrt(mean(X.map(r=>(r[j]-v)**2)))||1),A=X.map(r=>[1,...r.map((x,j)=>(x-m[j])/sc[j])]),z=qr(A,y),beta=z.coef.slice(1).map((v,j)=>v===null?null:v/sc[j]),intercept=(z.coef[0]||0)-beta.reduce((s,v,j)=>s+(v||0)*m[j],0),coef=[intercept,...beta],fitted=X.map(r=>intercept+dot(r,beta.map(v=>v||0))),residual=y.map((v,i)=>v-fitted[i]),rss=sum2(residual),tss=sum2(y.map(v=>v-mean(y))),df=n-z.rank,degenerate=tss<=1e-24||rss<=1e-24,variance=df>0?rss/df:null,se=Array(p+1).fill(null);if(df>0&&!degenerate){const inv=Array.from({length:z.rank},(_,j)=>z.back(Array.from({length:z.rank},(_,i)=>+(i===j))));const cov=(i,j)=>inv.reduce((s,col)=>s+col[i]*col[j],0)*variance;const pos=new Map(z.perm.slice(0,z.rank).map((v,i)=>[v,i]));for(let j=1;j<=p;j++)if(pos.has(j))se[j]=Math.sqrt(cov(pos.get(j),pos.get(j)))/sc[j-1];const vec=z.perm.slice(0,z.rank).map(j=>j===0?1:-m[j-1]/sc[j-1]);se[0]=Math.sqrt(Math.max(0,vec.reduce((s,v,i)=>s+vec.reduce((u,w,j)=>u+v*w*cov(i,j),0),0)));}const ts=coef.map((b,j)=>b===null||se[j]===null||se[j]===0?null:b/se[j]),pv=ts.map(t=>t===null?null:C.pvalue(t,df)),r2=tss>1e-24?1-rss/tss:null,f=df>0&&z.rank>1&&!degenerate?((tss-rss)/(z.rank-1))/(rss/df):null,pF=f===null?null:betaTailF(f,z.rank-1,df);return{coef,se,t:ts,p:pv,rank:z.rank,n,df,rss,r2,adjR2:r2===null||df<=0?null:1-(1-r2)*(n-1)/df,rse:variance===null?null:Math.sqrt(variance),f,pF,fitted,residual,crit:df>0?tcrit(df):null,aic:rss>1e-24?n*Math.log(rss/n)+2*z.rank:null,degenerate,aliased:beta.map((b,j)=>b===null?j:null).filter(x=>x!==null),predict:r=>intercept+dot(r,beta.map(v=>v||0))};}
// F survival via t-distribution beta engine: numerical beta CDF implementation.
function betaTailF(f,d1,d2){return ib(d2/(d2+d1*Math.max(0,f)),d2/2,d1/2);}
function lg(z){const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-lg(1-z);z--;let x=.9999999999998099;for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+7.5;return .9189385332046727+(z+.5)*Math.log(t)-t+Math.log(x);}
function ib(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const cf=(a,b,x)=>{let c=1,d=1-(a+b)*x/(a+1),h=1/d;d=h;for(let m=1;m<500;m++){let delta;for(const aa of [m*(b-m)*x/((a+2*m-1)*(a+2*m)),-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1))]){d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;delta=d*c;h*=delta;}if(Math.abs(delta-1)<1e-13)break;}return h;};const v=Math.exp(lg(a+b)-lg(a)-lg(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?v*cf(a,b,x)/a:1-v*cf(b,a,1-x)/b;}
function subset(X,ids){return X.map(r=>ids.length?ids.map(j=>r[j]):[0]);}
function fitIds(X,y,ids){if(!ids.length){const a=mean(y),rss=sum2(y.map(v=>v-a)),n=y.length;return{coef:[a],rank:1,rss,aic:rss>1e-24?n*Math.log(rss/n)+2:null,predict:()=>a};}return ols(subset(X,ids),y);}
function stepwise(X,y,direction='both'){validate(X,y);if(!['forward','backward','both'].includes(direction))throw Error('逐步方向无效');const full=ols(X,y);if(full.rank!==X[0].length+1||full.df<2||full.degenerate)throw Error('AIC逐步选择要求候选设计满秩、有残差方差及至少2个残差自由度；请移除重复/常数列或增加样本');const p=X[0].length;let ids=direction==='forward'?[]:Array.from({length:p},(_,i)=>i),fit=fitIds(X,y,ids),path=[{ids:ids.slice(),aic:fit.aic,operation:'初始模型'}],rounds=[];for(let t=0;t<100;t++){const candidates=[];if(direction!=='forward')for(const j of ids){const next=ids.filter(k=>k!==j),q=fitIds(X,y,next);candidates.push({ids:next,aic:q.aic,operation:'− '+j,variable:j,action:'drop',fit:q});}if(direction!=='backward')for(let j=0;j<p;j++)if(!ids.includes(j)){const next=[...ids,j].sort((a,b)=>a-b),q=fitIds(X,y,next);candidates.push({ids:next,aic:q.aic,operation:'+ '+j,variable:j,action:'add',fit:q});}candidates.sort((a,b)=>a.aic-b.aic||a.variable-b.variable||a.action.localeCompare(b.action));const best=candidates[0],accepted=best&&best.aic<fit.aic-1e-7;rounds.push({current:ids.slice(),aic:fit.aic,candidates:candidates.map(({fit,...q})=>q),accepted:accepted?best.operation:null});if(!accepted)break;ids=best.ids;fit=best.fit;path.push({ids:ids.slice(),aic:fit.aic,operation:best.operation});}return{ids,fit,path,rounds,direction};}
function standardize(X){const m=X[0].map((_,j)=>mean(X.map(r=>r[j]))),s=m.map((v,j)=>Math.sqrt(mean(X.map(r=>(r[j]-v)**2))));return{m,s,Z:X.map(r=>r.map((v,j)=>s[j]>1e-14?(v-m[j])/s[j]:0))};}
function inverse(A){const n=A.length,B=A.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>+(j===i))]);for(let j=0;j<n;j++){let k=j;for(let i=j+1;i<n;i++)if(Math.abs(B[i][j])>Math.abs(B[k][j]))k=i;if(Math.abs(B[k][j])<1e-15)throw Error('正则化线性系统奇异');[B[k],B[j]]=[B[j],B[k]];const v=B[j][j];B[j]=B[j].map(x=>x/v);for(let i=0;i<n;i++)if(i!==j){const c=B[i][j];B[i]=B[i].map((x,k)=>x-c*B[j][k]);}}return B.map(r=>r.slice(n));}
function regularize(X,y,lambda,type='lasso',options={}){validate(X,y);if(!['ridge','lasso'].includes(type)||!Number.isFinite(lambda)||lambda<0)throw Error('正则化参数无效');const tol=options.tol??1e-9,maxit=options.maxit??20000;if(!(tol>=1e-12&&tol<=1e-5)||!Number.isInteger(maxit)||maxit<1)throw Error('优化设置无效');const n=y.length,p=X[0].length,{m,s,Z}=standardize(X),my=mean(y),yc=y.map(v=>v-my);let b=Array(p).fill(0),iter=0,kkt=0,edf;const G=Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>dot(Z.map(r=>r[i]),Z.map(r=>r[j]))/n));if(type==='ridge'){if(lambda===0){const o=ols(X,y);if(o.rank!==p+1)throw Error('λ=0且设计秩不足，Ridge解不唯一；请用λ>0');b=o.coef.slice(1).map((v,j)=>v*s[j]);edf=p+1;}else{const active=s.map((v,j)=>v>1e-14?j:null).filter(x=>x!==null),A=active.map(i=>active.map(j=>G[i][j]+(i===j?lambda:0))),inv=inverse(A),rhs=active.map(j=>dot(Z.map(r=>r[j]),yc)/n);active.forEach((j,i)=>b[j]=dot(inv[i],rhs));edf=1+active.reduce((v,j,i)=>v+inv[i].reduce((u,x,k)=>u+x*G[active[k]][j],0),0);}iter=1;}else{if(lambda===0){const q=ols(X,y);if(q.rank!==p+1)throw Error('λ=0且秩不足，Lasso系数不唯一；请用λ>0');}const r=yc.slice();let converged=false;for(iter=1;iter<=maxit;iter++){let change=0;for(let j=0;j<p;j++){if(s[j]<=1e-14)continue;const zj=Z.map(row=>row[j]),old=b[j],v=dot(zj,r)/n+G[j][j]*old;b[j]=Math.sign(v)*Math.max(0,Math.abs(v)-lambda)/G[j][j];const delta=b[j]-old;change=Math.max(change,Math.abs(delta));for(let i=0;i<n;i++)r[i]-=delta*zj[i];}kkt=Math.max(...b.map((v,j)=>{if(s[j]<=1e-14)return 0;const g=dot(Z.map(row=>row[j]),r)/n;return v===0?Math.max(0,Math.abs(g)-lambda):Math.abs(g-lambda*Math.sign(v));}));if(change<=tol&&kkt<=tol*5){converged=true;break;}}if(!converged)throw Error('Lasso未收敛：超过迭代上限或KKT条件不满足；结果已清除');edf=1+b.filter(v=>Math.abs(v)>1e-10).length;}
const coef=[my-b.reduce((v,x,j)=>v+(s[j]>1e-14?x*m[j]/s[j]:0),0),...b.map((v,j)=>s[j]>1e-14?v/s[j]:0)],predict=r=>coef[0]+dot(r,coef.slice(1)),fitted=X.map(predict),residual=y.map((v,i)=>v-fitted[i]);if(type==='ridge'){const r=yc.map((v,i)=>v-dot(Z[i],b));kkt=Math.max(...b.map((v,j)=>Math.abs(dot(Z.map(row=>row[j]),r)/n-lambda*v)));}return{coef,standardCoef:b,mean:m,scale:s,lambda,type,iter,kkt,edf,nonzero:b.filter(v=>Math.abs(v)>1e-10).length,fitted,residual,rss:sum2(residual),objective:sum2(residual)/(2*n)+lambda*(type==='ridge'?sum2(b)/2:b.reduce((v,x)=>v+Math.abs(x),0)),predict,converged:true};}
function metrics(y,p){if(y.length!==p.length||!y.length||p.some(x=>!Number.isFinite(x)))throw Error('预测输出无效');return{rmse:Math.sqrt(mean(y.map((v,i)=>(v-p[i])**2))),mae:mean(y.map((v,i)=>Math.abs(v-p[i])))};}
function grid(p){return Array.from({length:31},(_,i)=>10**(p.logMin+(p.logMax-p.logMin)*i/30));}
function folds(n){if(n<30)throw Error('时间验证至少需要30期训练数据');const first=Math.floor(n*.5),width=Math.floor((n-first)/3);return Array.from({length:3},(_,i)=>({train:first+i*width,start:first+i*width,end:i===2?n:first+(i+1)*width}));}
function cv(X,y,lambdas,type,options={}){const ranges=folds(y.length),loss=lambdas.map(lambda=>{let total=0,count=0;const per=ranges.map(f=>{const q=regularize(X.slice(0,f.train),y.slice(0,f.train),lambda,type,options),pred=X.slice(f.start,f.end).map(q.predict),m=metrics(y.slice(f.start,f.end),pred);total+=m.rmse**2*pred.length;count+=pred.length;return m.rmse;});return{lambda,rmse:Math.sqrt(total/count),per};});let best=0;loss.forEach((v,i)=>{if(v.rmse<loss[best].rmse-1e-12||Math.abs(v.rmse-loss[best].rmse)<=1e-12&&v.lambda>loss[best].lambda)best=i;});return{loss,best,lambda:loss[best].lambda,ranges};}
function diagnostics(X,y,q){const p=X[0].length,st=standardize(X),corr=st.s.map((s,i)=>st.s.map((t,j)=>s<=1e-14||t<=1e-14?null:mean(st.Z.map(r=>r[i]*r[j])))),vif=st.s.map((s,j)=>{if(s<=1e-14)return null;if(p===1)return 1;const a=ols(X.map(r=>r.filter((_,k)=>k!==j)),X.map(r=>r[j]));return a.r2===null?null:1-a.r2<1e-12?Infinity:1/(1-a.r2);});const z=qr(st.Z,y);let condition=null;if(z.rank<p)condition=Infinity;else{const R=z.R.slice(0,p).map(r=>r.slice(0,p)),norm=Math.max(...R.map(r=>r.reduce((s,v)=>s+Math.abs(v),0))),cols=Array.from({length:p},(_,j)=>z.back(Array.from({length:p},(_,i)=>+(i===j)))),inv=Array.from({length:p},(_,i)=>cols.map(c=>c[i]));condition=norm*Math.max(...inv.map(r=>r.reduce((s,v)=>s+Math.abs(v),0)));}return{corr,vif,condition,conditionDefinition:'中心化RMS标准化设计，列主元QR的κ∞(R)，不是κ₂(X)'};}
const cache=new Map();function analyze(data,p,direction='both'){settings(p);validate(data.X,data.y);const n=data.y.length,nt=Math.floor(n*p.train);if(nt<30||n-nt<5)throw Error('训练至少30期，测试至少5期');const X=data.X.slice(0,nt),y=data.y.slice(0,nt),testX=data.X.slice(nt),testY=data.y.slice(nt),lambdas=grid(p),options={tol:p.tol,maxit:p.maxit},safe=f=>{try{return f();}catch(e){return{error:e.message};}},key=JSON.stringify([data.X,data.y,p.train,p.logMin,p.logMax,p.tol,p.maxit,direction]);let base=cache.get(key);if(!base){const ol=ols(X,y),step=safe(()=>stepwise(X,y,direction)),ridgeCV=safe(()=>cv(X,y,lambdas,'ridge',options)),lassoCV=safe(()=>cv(X,y,lambdas,'lasso',options));base={ols:ol,step,ridgeCV,lassoCV,diag:diagnostics(X,y,ol),ridgePath:lambdas.map(l=>safe(()=>regularize(X,y,l,'ridge',options))),lassoPath:lambdas.map(l=>safe(()=>regularize(X,y,l,'lasso',options)))};cache.set(key,base);if(cache.size>4)cache.delete(cache.keys().next().value);}const evaluate=(q,transform=x=>x)=>{if(q.error)return q;const trainPred=X.map(r=>q.predict(transform(r))),testPred=testX.map(r=>q.predict(transform(r)));return{...q,train:metrics(y,trainPred),test:metrics(testY,testPred),testPred};},ridge=base.ridgeCV.error?base.ridgeCV:safe(()=>regularize(X,y,base.ridgeCV.lambda,'ridge',options)),lasso=base.lassoCV.error?base.lassoCV:safe(()=>regularize(X,y,base.lassoCV.lambda,'lasso',options));return{...base,nt,n,testY,lambdas,models:{OLS:evaluate(base.ols),Stepwise:base.step.error?base.step:evaluate(base.step.fit,r=>base.step.ids.length?base.step.ids.map(j=>r[j]):[]),Ridge:evaluate(ridge),Lasso:evaluate(lasso)},manualCV:{ridge:safe(()=>cv(X,y,[p.lambda],'ridge',options)),lasso:safe(()=>cv(X,y,[p.lambda],'lasso',options))},manual:{ridge:evaluate(safe(()=>regularize(X,y,p.lambda,'ridge',options))),lasso:evaluate(safe(()=>regularize(X,y,p.lambda,'lasso',options)))}};}
function csvRows(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell!=='')throw Error('CSV引号格式错误。');else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV引号未闭合。');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;}

function csvTable(text){const rows=csvRows(text.replace(/^\uFEFF/,''));if(rows.length<2)throw Error('CSV为空或没有数据');const names=rows.shift().map(x=>x.trim());if(new Set(names).size!==names.length||names.some(x=>!x))throw Error('列名重复或为空');if(rows.some(r=>r.length!==names.length))throw Error('CSV行列数不一致');return{names,rows};}
function importCSV(text,{date,target,features,kind='simple',unit='decimal',timing='lag',missing='reject'}={}){if(text.length>2e6)throw Error('CSV超过2MB');const t=csvTable(text),names=t.names;if(!names.includes(date)||!names.includes(target)||!features?.length||features.length>20||features.includes(target)||features.includes(date)||new Set(features).size!==features.length||features.some(x=>!names.includes(x))||target===date)throw Error('请明确选择不同的日期、目标和1–20个特征列');if(!['simple','numeric','price'].includes(kind)||!['decimal','percent'].includes(unit)||!['lag','aligned','same'].includes(timing))throw Error('数据口径无效');const seen=new Set(),rows=[],dropped=[];let reordered=false,previous='';for(let i=0;i<t.rows.length;i++){const r=t.rows[i],d=r[names.indexOf(date)].trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d)throw Error('非法日期：第'+(i+2)+'行');if(seen.has(d))throw Error('重复日期 '+d);seen.add(d);if(previous>d)reordered=true;previous=d;const cells=[target,...features].map(k=>r[names.indexOf(k)].trim());if(cells.some(x=>x===''||/^(NA|NaN|null)$/i.test(x))){if(missing!=='drop')throw Error('存在缺失值；可明确选择整行删除并查看数量');dropped.push({date:d,line:i+2});continue;}const v=cells.map(x=>{if(!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(x))throw Error('非数字：第'+(i+2)+'行');const q=Number(x);if(!Number.isFinite(q)||Math.abs(q)>1e8)throw Error('非有限或数值过大');return q;});rows.push({date:d,v});}rows.sort((a,b)=>a.date.localeCompare(b.date));if(rows.length<60||rows.length>2000)throw Error('完整记录需要60–2000行');let converted=rows.map(r=>({date:r.date,v:r.v.map(x=>kind==='price'?x:unit==='percent'?x/100:x)}));if(kind==='price'){if(rows.some(r=>r.v.some(x=>x<=0)))throw Error('价格必须严格为正');converted=rows.slice(1).map((r,i)=>({date:r.date,v:r.v.map((x,j)=>x/rows[i].v[j]-1)}));}if(converted.some(r=>r.v[0]< -1||(kind!=='numeric'&&r.v.some(x=>x< -1))))throw Error('简单收益不能低于−100%；请核对单位');const X=[],y=[],dates=[],featureDates=[];for(let i=timing==='lag'?1:0;i<converted.length;i++){const r=converted[i],f=converted[timing==='lag'?i-1:i];X.push(f.v.slice(1));y.push(r.v[0]);dates.push(r.date);featureDates.push(f.date);}validate(X,y);const gaps=rows.slice(1).filter((r,i)=>(Date.parse(r.date)-Date.parse(rows[i].date))/864e5!==1).length;return{X,y,dates,featureDates,names:features,source:'用户导入数据（来源未独立核实）',predictive:timing!=='same',note:`原始${t.rows.length}行；缺失整行删除${dropped.length}行；${reordered?'已整行按日期升序排序；':''}${gaps}处非连续日历间隔。${kind==='price'?'价格按共同完整记录转简单收益；间隔可能不等长。':''}${timing==='lag'?'上一可用观测特征→下一可用观测目标，不承诺相邻交易日。':timing==='aligned'?'用户确认特征在目标实现前已知；系统不能核实发布时间。':'同期解释，测试段仅留出拟合，不是严格事前预测。'} 不填补缺失，不插值，不年化；异步来源需先按日期合并并确认发布时点。`,audit:{dropped,gaps,kind,unit,timing,rawRows:t.rows.length},raw:text};}
return{defaults,settings,generate,validate,qr,ols,stepwise,standardize,regularize,metrics,grid,folds,cv,diagnostics,analyze,csvTable,importCSV};});

;

/* Source: reg-r.js */
(function(root,f){const a=f();if(typeof module==='object')module.exports=a;else root.RegR=a;})(this,()=>String.raw`
# Base R implementation. No package installation or network access.
rscale <- function(X){m<-colMeans(X);s<-sqrt(colMeans(sweep(X,2,m)^2));Z<-sweep(X,2,m);for(j in seq_len(ncol(X)))Z[,j]<-if(s[j]>1e-14)Z[,j]/s[j] else 0;list(m=m,s=s,Z=Z)}
rfit <- function(X,y,lambda,type,tol=1e-9,maxit=20000){
 n<-length(y);p<-ncol(X);st<-rscale(X);Z<-st$Z;my<-mean(y);yc<-y-my;b<-rep(0,p);G<-crossprod(Z)/n;iter<-0;kkt<-0
 if(type=="ridge"){
  if(lambda==0){if(qr(cbind(1,X),tol=1e-10)$rank<p+1)stop("lambda=0 rank deficient");b<-coef(lm(y~X))[-1]*st$s;edf<-p+1
  }else{active<-which(st$s>1e-14);if(length(active)){inv<-solve(G[active,active,drop=FALSE]+diag(lambda,length(active)));b[active]<-as.vector(inv%*%crossprod(Z[,active,drop=FALSE],yc)/n);edf<-1+sum(diag(inv%*%G[active,active,drop=FALSE]))}else edf<-1};iter<-1
 }else{
  if(lambda==0&&qr(cbind(1,X),tol=1e-10)$rank<p+1)stop("lambda=0 rank deficient")
  r<-yc;converged<-FALSE
  for(iter in seq_len(maxit)){
   change<-0
   for(j in seq_len(p)){if(st$s[j]<=1e-14)next;old<-b[j];v<-sum(Z[,j]*r)/n+G[j,j]*old;b[j]<-sign(v)*max(0,abs(v)-lambda)/G[j,j];delta<-b[j]-old;change<-max(change,abs(delta));r<-r-delta*Z[,j]}
   grad<-as.vector(crossprod(Z,r)/n);kkt<-max(ifelse(st$s<=1e-14,0,ifelse(b==0,pmax(0,abs(grad)-lambda),abs(grad-lambda*sign(b)))))
   if(change<=tol&&kkt<=5*tol){converged<-TRUE;break}
  }
  if(!converged)stop("Lasso did not converge / KKT failed; no valid result")
  edf<-1+sum(abs(b)>1e-10)
 }
 slopes<-ifelse(st$s>1e-14,b/st$s,0);co<-c(my-sum(slopes*st$m),slopes);pred<-as.vector(cbind(1,X)%*%co);r<-y-pred
 if(type=="ridge")kkt<-max(abs(as.vector(crossprod(Z,yc-Z%*%b)/n)-lambda*b))
 list(coef=co,standardCoef=b,mean=st$m,scale=st$s,lambda=lambda,type=type,iter=iter,kkt=kkt,edf=edf,nonzero=sum(abs(b)>1e-10),fitted=pred,residual=r,rss=sum(r^2),objective=sum(r^2)/(2*n)+lambda*if(type=="ridge")sum(b^2)/2 else sum(abs(b)))
}
rpredict <- function(q,X)as.vector(cbind(1,X)%*%q$coef)
rmetric <- function(y,p)c(RMSE=sqrt(mean((y-p)^2)),MAE=mean(abs(y-p)))
rcv <- function(X,y,lambdas,type,tol,maxit){
 n<-length(y);first<-floor(n*.5);width<-floor((n-first)/3)
 ranges<-lapply(0:2,function(i)c(train=first+i*width,start=first+i*width+1,end=if(i==2)n else first+(i+1)*width))
 loss<-sapply(lambdas,function(lambda){err<-c();for(f in ranges){a<-seq_len(f['train']);b<-seq.int(f['start'],f['end']);q<-rfit(X[a,,drop=FALSE],y[a],lambda,type,tol,maxit);err<-c(err,y[b]-rpredict(q,X[b,,drop=FALSE]))};sqrt(mean(err^2))})
 best<-1;for(i in seq_along(loss))if(loss[i]<loss[best]-1e-12||(abs(loss[i]-loss[best])<=1e-12&&lambdas[i]>lambdas[best]))best<-i
 list(lambda=lambdas[best],loss=loss,best=best,ranges=ranges)
}
# Deterministic extractAIC-compatible selection, candidate ties ordered by source column.
rstep <- function(X,y,direction){
 p<-ncol(X);n<-length(y);df<-data.frame(y=y,X);names(df)<-c('y',paste0('x',seq_len(p)))
 fitids<-function(ids){f<-lm(reformulate(if(length(ids))paste0('x',ids) else '1',response='y'),data=df,tol=1e-10);list(fit=f,aic=extractAIC(f)[2])}
 ids<-if(direction=='forward')integer(0)else seq_len(p);q<-fitids(ids)
 full<-fitids(seq_len(p))$fit;if(full$rank<p+1||df.residual(full)<2||sum(resid(full)^2)<=1e-24)stop('Stepwise needs full rank and residual degrees of freedom')
 path<-list(list(ids=ids,aic=q$aic,operation='initial'));rounds<-list()
 for(it in 1:100){cand<-list();if(direction!='forward')for(j in ids){v<-setdiff(ids,j);z<-fitids(v);cand[[length(cand)+1]]<-list(ids=v,aic=z$aic,variable=j,action='drop',q=z)}
 if(direction!='backward')for(j in setdiff(seq_len(p),ids)){v<-sort(c(ids,j));z<-fitids(v);cand[[length(cand)+1]]<-list(ids=v,aic=z$aic,variable=j,action='add',q=z)}
 if(!length(cand))break
 ord<-order(vapply(cand,function(x)x$aic,0.),vapply(cand,function(x)x$variable,0L),vapply(cand,function(x)x$action,''));best<-cand[[ord[1]]];accepted<-best$aic<q$aic-1e-7
 rounds[[length(rounds)+1]]<-list(ids=ids,aic=q$aic,candidates=cand,accepted=accepted)
 if(!accepted)break
 ids<-best$ids;q<-best$q;path[[length(path)+1]]<-list(ids=ids,aic=q$aic,operation=paste(best$action,best$variable))
 }
 # Also run the standard R step() against the identical candidate scope.
 initial<-fitids(if(direction=='forward')integer(0)else seq_len(p))$fit
 reference<-stats::step(initial,scope=list(lower=y~1,upper=reformulate(paste0('x',seq_len(p)),response='y')),direction=direction,trace=0)
 list(ids=ids,fit=q$fit,path=path,rounds=rounds,reference=reference)
}
`);

;

/* Source: reg-code.js */
(function(root,f){const a=f(typeof module==='object'?require('./reg-r'):root.RegR);if(typeof module==='object')module.exports=a;else root.RegCode=a;})(this,R=>{
function build(p,s,d,a){const blocks=[],add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:code.split('\n'),explain,formula});const vec=v=>'c('+v.map(x=>JSON.stringify(x)).join(',\n ')+')';
add('data','数据与时间分割',`# Experiment04 | ${d.source}\n# ${d.note}\n# Confirmed values are embedded; no hidden browser variable / file dependency.\ny <- ${vec(d.y)}\nX <- matrix(${vec(d.X.flat())},nrow=length(y),byrow=TRUE)\nfeature_names <- ${vec(d.names)}\ncolnames(X) <- paste0("x",seq_len(ncol(X)))\ndates <- as.Date(${vec(d.dates)})\nfeature_dates <- as.Date(${vec(d.featureDates)})\nnt <- floor(length(y)*${p.train})\ntrain <- seq_len(nt);test <- seq.int(nt+1,length(y))\nXtr <- X[train,,drop=FALSE]; ytr <- y[train]\nXte <- X[test,,drop=FALSE]; yte <- y[test]\nstopifnot(all(is.finite(X)),all(is.finite(y)),!anyDuplicated(dates),all(diff(dates)>0))\n# Feature availability: ${d.predictive?'user-confirmed or lagged; verify original publication timestamps':'contemporaneous explanation, NOT ex-ante forecasting'}.\n# No test rows enter preprocessing, variable selection, or lambda choice.`, `当前${a.nt}期训练，${a.n-a.nt}期测试，按目标日期升序。特征时间与目标时间已嵌入。CSV使用当前确认/转换/对齐后的数据，不依赖用户机器文件。频率和发布时间需用户核实。`,String.raw`\mathcal D_{train}=\{1,\ldots,${a.nt}\},\quad\mathcal D_{test}=\{${a.nt+1},\ldots,${a.n}\}`);
add('functions','正则化与时间验证函数',R,'Ridge在训练期中心化、RMS标准化后解惩罚线性系统；Lasso坐标下降并验证KKT，不收敛即停止。截距不惩罚。三段扩展训练窗口，逐折重新拟合标准化；无随机分折。');
add('ols','OLS估计与推断',`training <- data.frame(y=ytr,Xtr)\nols <- lm(y~.,data=training,tol=1e-10)\nprint(summary(ols));print(coef(ols))\nols_pred <- as.vector(predict(ols,newdata=data.frame(Xte)))\nols_metrics <- rmetric(yte,ols_pred)\nprint(ols_metrics)\n# Inference assumes correctly specified linear mean, exogeneity, homoskedastic\n# uncorrelated errors (normal errors for exact finite-sample t/F).\n# Aliased coefficients are NA. Conventional post-selection p-values are not adjusted.\nVIF <- sapply(seq_len(ncol(Xtr)),function(j){\n if(sd(Xtr[,j])<1e-14)return(NA_real_)\n if(ncol(Xtr)==1)return(1)\n z<-summary(lm(Xtr[,j]~Xtr[,-j,drop=FALSE]))$r.squared\n if(1-z<1e-12)Inf else 1/(1-z)})\nprint(VIF);print(cor(Xtr))\nscaled <- rscale(Xtr)$Z;qr_design <- qr(scaled,LAPACK=TRUE)\nprint(kappa(qr.R(qr_design),exact=FALSE,norm="I"))`, 'OLS最小化训练残差平方和。95%置信区间用当前标准误和t临界值。经典SE不校正异方差和序列相关；p值不是因果概率。VIF与QR条件指标只用于诊断，不是判错硬阈值。',String.raw`\hat\beta=\arg\min_\beta\|y-X\beta\|_2^2`);
if(s.view!=='traditional'||s.method==='stepwise')add('step','AIC逐步选择',`direction <- "${s.direction}"\nselected <- tryCatch(rstep(Xtr,ytr,direction),error=function(e)list(error=conditionMessage(e)))\nif(is.null(selected$error)){print(selected$path);print(selected$rounds);print(formula(selected$fit));print(selected$reference$anova)\n step_pred <- as.vector(predict(selected$fit,newdata=data.frame(Xte)))\n step_metrics <- rmetric(yte,step_pred);print(step_metrics)\n}else message(selected$error)\n# AIC* = n*log(RSS/n)+2*rank matches extractAIC(lm) with unknown scale.\n# AIC(logLik) adds n*(1+log(2*pi))+2; same ordering on identical rows.\n# Accept only improvement >1e-7; ties by source-column index, then action.\n# Greedy search is not exhaustive. Selected-model p-values ignore selection bias.`, '每轮真实估计候选模型，以extractAIC相同口径选模。双向从完整模型出发；近似相等时按原始列顺序确定，改进≤1e−7停止。选择仅训练期，筛选后p值需谨慎。',String.raw`AIC^*=n\log(RSS/n)+2\operatorname{rank}(X)`);
if(s.view!=='traditional')add('regularization','Ridge / Lasso与λ选择',`lambdas <- 10^seq(${p.logMin},${p.logMax},length.out=31)\ntol <- ${p.tol}; maxit <- ${p.maxit}\ncv_ridge <- tryCatch(rcv(Xtr,ytr,lambdas,"ridge",tol,maxit),error=function(e)list(error=conditionMessage(e)))\ncv_lasso <- tryCatch(rcv(Xtr,ytr,lambdas,"lasso",tol,maxit),error=function(e)list(error=conditionMessage(e)))\nmode <- "${s.mode}"; method <- "${s.reg}"; manual_lambda <- ${p.lambda}\nfit_safe <- function(type,cv){tryCatch({if(!(mode=="manual"&&"${s.view}"=="regularization")&&!is.null(cv$error))stop(cv$error);rfit(Xtr,ytr,if(mode=="manual"&&"${s.view}"=="regularization")manual_lambda else cv$lambda,type,tol,maxit)},error=function(e)list(error=conditionMessage(e)))}\nridge <- fit_safe("ridge",cv_ridge);lasso <- fit_safe("lasso",cv_lasso)\nfor(q in list(ridge,lasso))if(is.null(q$error)){print(q[c("coef","standardCoef","lambda","iter","kkt","edf","nonzero")]);print(rmetric(yte,rpredict(q,Xte)))}else message(q$error)\nprint(cv_ridge);print(cv_lasso)\nmanual_cv_ridge <- tryCatch(rcv(Xtr,ytr,manual_lambda,"ridge",tol,maxit),error=function(e)list(error=conditionMessage(e)))\nmanual_cv_lasso <- tryCatch(rcv(Xtr,ytr,manual_lambda,"lasso",tol,maxit),error=function(e)list(error=conditionMessage(e)))\nprint(manual_cv_ridge);print(manual_cv_lasso)\n# J=RSS/(2*n)+lambda/2*sum(b^2) for Ridge; +lambda*sum(abs(b)) for Lasso.\n# b refers to centered training-RMS-standardized X; y stays in return decimals.\n# Do not assume glmnet Ridge lambda matches without checking its y scaling.\n# Zero-count reporting threshold: |standardized coefficient|>1e-10.\n# Test is final evaluation, not a tuning criterion. Repeated exploration weakens independence.`, 'Ridge的L2惩罚与Lasso的L1惩罚对应不同的优化目标。横轴λ是明确的惩罚尺度；只对训练RMS标准化系数惩罚，y保持收益小数。验证选择三段后续窗口的合并RMSE最小；并列选择较大λ。Ridge不直接删变量，Lasso不保证找出因果变量。',s.reg==='ridge'?String.raw`J=\frac{RSS}{2n}+\frac{\lambda}{2}\|b\|_2^2`:String.raw`J=\frac{RSS}{2n}+\lambda\|b\|_1`);
if(s.view==='compare')add('evaluation','同一测试集四模型比较',`evaluate <- function(name,train_pred,test_pred,complexity){c(Model=name,Train_RMSE=sqrt(mean((ytr-train_pred)^2)),rmetric(yte,test_pred),Complexity=complexity)}\ncomparison <- list(OLS=evaluate("OLS",fitted(ols),ols_pred,ols$rank-1))\nif(is.null(selected$error))comparison$Stepwise<-evaluate("Stepwise",fitted(selected$fit),step_pred,length(selected$ids))\nfor(type in c("Ridge","Lasso")){q<-if(type=="Ridge")ridge else lasso;if(is.null(q$error))comparison[[type]]<-evaluate(type,q$fitted,rpredict(q,Xte),if(type=="Ridge")q$edf else q$nonzero)}\nprint(comparison)\n# Failed models are omitted explicitly, never assigned a normal ranking.\n# OLS/Stepwise: estimable slopes; Ridge: effective df INCLUDING intercept; Lasso: active slopes.`, '同一个确认样本、同一训练/测试区间。Ridge复杂度是包含截距的有效自由度，其余为解释变量数；定义不同不可直接等同。只说明当前划分误差，不据此挑选再宣称独立验证。');
let plot;
if(s.view==='traditional'){if(s.method==='stepwise')plot='if(is.null(selected$error))plot(seq_along(selected$path)-1,vapply(selected$path,function(z)z$aic,0.),type="b",xlab="Selection step",ylab="extractAIC",main="AIC selection path")';else if(s.tradChart==='predicted')plot='plot(yte,ols_pred,xlab="Actual return (decimal)",ylab="Test prediction (decimal)");abline(0,1,lty=2)';else if(s.tradChart==='residual')plot='plot(fitted(ols),resid(ols),xlab="Training fitted return",ylab="Residual");abline(h=0,lty=2)';else if(s.tradChart==='qq')plot='if(sum(resid(ols)^2)>1e-24){qqnorm(rstandard(ols));qqline(rstandard(ols))}else message("Degenerate residual variance: standardized QQ unavailable")';else plot='ci<-confint(ols);co<-coef(ols);keep<-seq_along(co)[-1];plot(co[keep],keep,xlim=range(ci[keep,],finite=TRUE),yaxt="n",xlab="Original-scale coefficient with 95% CI",ylab="Feature");axis(2,at=keep,labels=feature_names);segments(ci[keep,1],keep,ci[keep,2],keep);abline(v=0,lty=2)';}
else if(s.view==='regularization'){plot=s.regChart==='validation'?'cv<-if(method=="ridge")cv_ridge else cv_lasso;if(is.null(cv$error))plot(log10(lambdas),cv$loss*100,type="b",xlab="log10(lambda)",ylab="Temporal validation RMSE (%)")':s.regChart==='coefficients'?'q<-if(method=="ridge")ridge else lasso;if(is.null(q$error))barplot(q$coef[-1],names.arg=feature_names,ylab="Original-scale coefficient")':'path<-lapply(lambdas,function(l)tryCatch(rfit(Xtr,ytr,l,method,tol,maxit)$standardCoef,error=function(e)rep(NA_real_,ncol(Xtr))));matplot(log10(lambdas),do.call(rbind,path),type="l",lty=1,xlab="log10(lambda)",ylab="Training standardized-X coefficient (return decimal)");q<-if(method=="ridge")ridge else lasso;if(is.null(q$error))abline(v=log10(q$lambda),lty=2)';}
else plot='barplot(vapply(comparison,function(q)as.numeric(q["'+(s.metric==='mae'?'MAE':'RMSE')+'"]) *100,0.),horiz=TRUE,xlab="Test '+(s.metric==='mae'?'MAE':'RMSE')+' (%)",main="Same held-out rows")';
if(s.view==='regularization')plot='current<-if(method=="ridge")ridge else lasso\nif(is.null(current$error)){\n'+plot+'\n}else message(current$error)';
add('plot','当前主题绘图',plot,'一次一张图，对应网页当前主题。系数图使用原始尺度；路径图为训练X标准化系数，小数收益单位；预测误差图为百分比。');return{blocks,code:blocks.map(b=>b.lines.join('\n')).join('\n\n')};}
return{build};});

;

/* Source: reg-charts.js */
(()=>{'use strict';const colors=['#6689a8','#659b8a','#9b88ac','#b08968','#b99d52'],esc=s=>WorkbenchUI.esc(String(s));function render(host,s,d,a,q,interaction){let title,xlabel,ylabel,lines=[],points=[],bars=[],refs=[],labels=[],xmin,xmax,ymin,ymax;const put=(name,values,color)=>lines.push({name,values,color});
if(s.view==='traditional'&&s.method==='stepwise'){title='AIC逐步选择 · 每次变化来自真实重估';xlabel='已采纳步骤';ylabel='extractAIC（越小越好）';if(a.step.error){host.textContent=a.step.error;return[];}put('已采纳AIC',a.step.path.map((v,i)=>[i,v.aic]),colors[0]);a.step.path.forEach((v,i)=>points.push({x:i,y:v.aic,text:`步骤${i}：${v.operation}；AIC ${v.aic.toPrecision(10)}；保留 ${v.ids.map(j=>d.names[j]).join(', ')||'仅截距'}`}));}
else if(s.view==='traditional'&&s.tradChart==='coefficients'||s.view==='regularization'&&s.regChart==='coefficients'){title=s.view==='traditional'?'OLS系数 · 当前经典95%置信区间':'当前原始尺度系数 · 截距单独列出';xlabel='原始尺度回归系数';ylabel='';d.names.forEach((name,j)=>{const v=q.coef[j+1];if(v===null)return;const ci=s.view==='traditional'&&q.se[j+1]!==null?q.crit*q.se[j+1]:0;bars.push({x:v,y:j+1,lo:v-ci,hi:v+ci,text:name+'：'+v.toPrecision(8)+(ci?'；95% CI ['+(v-ci).toPrecision(7)+', '+(v+ci).toPrecision(7)+']':'；正则化系数无常规OLS区间')});labels.push([j+1,name]);});refs.push({x:0});ymin=0;ymax=d.names.length+1;}
else if(s.view==='traditional'&&s.tradChart==='predicted'){title='测试段 · 实际收益与预测收益';xlabel='实际目标收益（%）';ylabel='测试预测（%）';a.testY.forEach((v,i)=>points.push({x:v*100,y:q.testPred[i]*100,text:d.dates[a.nt+i]+`；实际 ${(v*100).toPrecision(6)}%；预测 ${(q.testPred[i]*100).toPrecision(6)}%`}));const v=[...a.testY,...q.testPred].map(x=>x*100);put('45°参照',[[Math.min(...v),Math.min(...v)],[Math.max(...v),Math.max(...v)]],colors[2]);}
else if(s.view==='traditional'&&s.tradChart==='residual'){title='OLS诊断 · 残差对拟合值';xlabel='训练拟合收益（%）';ylabel='残差（百分点）';q.residual.forEach((v,i)=>points.push({x:q.fitted[i]*100,y:v*100,text:d.dates[i]+`；残差 ${(v*100).toPrecision(7)}百分点`}));refs.push({y:0});}
else if(s.view==='traditional'&&s.tradChart==='qq'){title='OLS诊断 · 标准化残差正态Q-Q';xlabel='标准正态理论分位数';ylabel='杠杆校正标准化残差';if(!q.rse||q.degenerate){host.textContent='残差方差退化，标准化Q-Q不可用；请查看原始残差或更换样本。';return [];}const X=d.X.slice(0,a.nt),A=RegMath.standardize(X).Z.map(r=>[1,...r]),z=RegMath.qr(A,d.y.slice(0,a.nt)),standard=q.residual.map((v,i)=>{const h=z.Q.reduce((v,c)=>v+c[i]*c[i],0);return v/(q.rse*Math.sqrt(Math.max(1e-14,1-h)));}).sort((a,b)=>a-b);standard.forEach((v,i)=>{const x=invnorm((i+.5)/standard.length);points.push({x,y:v,text:`正态分位 ${x.toPrecision(5)}；标准化残差 ${v.toPrecision(6)}`});});put('正态参考（不是检验）',[[-3,-3],[3,3]],colors[2]);}
else if(s.view==='regularization'&&s.regChart==='validation'){title='λ选择 · 训练内部三段扩展窗口';xlabel='log10(λ)';ylabel='时间验证RMSE（%）';const cv=s.reg==='ridge'?a.ridgeCV:a.lassoCV;if(cv.error){host.textContent=cv.error;return[];}put('验证RMSE',cv.loss.map(v=>[Math.log10(v.lambda),v.rmse*100]),colors[0]);cv.loss.forEach(v=>points.push({x:Math.log10(v.lambda),y:v.rmse*100,text:`λ ${v.lambda.toPrecision(7)}；验证RMSE ${(v.rmse*100).toPrecision(7)}%；仅训练内部`}));refs.push({x:Math.log10(cv.lambda)});}
else if(s.view==='regularization'){title=(s.reg==='ridge'?'Ridge L2':'Lasso L1')+' · 真实优化的系数路径';xlabel='log10(λ)';ylabel='训练X标准化系数（收益小数）';const path=s.reg==='ridge'?a.ridgePath:a.lassoPath;d.names.forEach((name,j)=>put(name,path.map((v,i)=>v.error?null:[Math.log10(a.lambdas[i]),v.standardCoef[j]]).filter(Boolean),colors[j%colors.length]));path.forEach((v,i)=>{if(!v.error)points.push({x:Math.log10(a.lambdas[i]),y:v.standardCoef[0],text:`λ ${a.lambdas[i].toPrecision(6)}；活跃变量 ${v.nonzero}；KKT ${v.kkt.toExponential(3)}；${v.iter}次迭代`});});if(q?.lambda>0)refs.push({x:Math.log10(q.lambda)});refs.push({y:0});}
else{title='同一测试集 · 四模型误差比较';xlabel='测试'+s.metric.toUpperCase()+'（%）';ylabel='模型';Object.entries(a.models).forEach(([name,v],i)=>{if(v.error)return;bars.push({x:v.test[s.metric]*100,y:i+1,lo:0,hi:v.test[s.metric]*100,text:name+'；测试'+s.metric.toUpperCase()+' '+(v.test[s.metric]*100).toPrecision(8)+'%'});labels.push([i+1,name]);});ymin=0;ymax=5;}
const xs=lines.flatMap(l=>l.values.map(v=>v[0])).concat(points.map(v=>v.x),bars.flatMap(v=>[v.lo,v.hi]),refs.filter(v=>v.x!==undefined).map(v=>v.x)),ys=lines.flatMap(l=>l.values.map(v=>v[1])).concat(points.map(v=>v.y),bars.map(v=>v.y));if(!xs.length||!ys.length){host.textContent='当前模型没有可绘制的有限结果';return[];}xmin=Math.min(...xs);xmax=Math.max(...xs);if(ymin===undefined)ymin=Math.min(...ys);if(ymax===undefined)ymax=Math.max(...ys);const dx=xmax-xmin||1,dy=ymax-ymin||1;xmin-=dx*.12;xmax+=dx*.12;if(s.view==='compare')xmin=0;if(!labels.length){ymin-=dy*.12;ymax+=dy*.12;}const X=x=>110+(x-xmin)/(xmax-xmin)*450,Y=y=>305-(y-ymin)/(ymax-ymin)*260;let svg='';for(let j=0;j<5;j++){const x=xmin+(xmax-xmin)*j/4,y=ymin+(ymax-ymin)*j/4;svg+=`<path d="M${X(x)},45V305" stroke="#e4eaed"/><text x="${X(x)}" y="330" text-anchor="middle">${x.toPrecision(3)}</text>`;if(!labels.length)svg+=`<path d="M110,${Y(y)}H560" stroke="#e4eaed"/><text x="102" y="${Y(y)+4}" text-anchor="end">${y.toPrecision(3)}</text>`;}
labels.forEach(([y,l])=>svg+=`<text x="102" y="${Y(y)+4}" text-anchor="end">${esc(({'market_lag1':'市场₋₁','industry_lag1':'行业₋₁','vol_change_lag1':'波动变化₋₁','related_lag1':'关联资产₋₁','noise_lag1':'噪声₋₁'}[l]||l.slice(0,12)))}</text>`);refs.forEach(r=>svg+=`<path d="${r.x!==undefined?'M'+X(r.x)+',45V305':'M110,'+Y(r.y)+'H560'}" stroke="#9b88ac" stroke-dasharray="4 4"/>`);lines.forEach(l=>svg+=`<path d="M${l.values.map(v=>X(v[0])+','+Y(v[1])).join('L')}" fill="none" stroke="${l.color}" stroke-width="2"/>`);bars.forEach((b,i)=>{svg+=`<path d="M${X(b.lo)},${Y(b.y)}H${X(b.hi)}" stroke="${colors[i%5]}" stroke-width="${s.view==='compare'?12:2}"/>`;points.push({...b,text:b.text});});points.forEach((v,i)=>svg+=`<circle data-reg-point="${i}" cx="${X(v.x)}" cy="${Y(v.y)}" r="4" fill="${colors[0]}" opacity=".8" role="button" tabindex="0" aria-label="${esc(v.text)}"/>`);
host.innerHTML=`<h3>${esc(title)}</h3><div class="reg-svg"><svg viewBox="0 0 600 385" role="img" aria-label="${esc(title)}">${svg}<text x="335" y="375" text-anchor="middle">${esc(xlabel)}</text><text transform="translate(20 180) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text></svg></div>`;host.querySelectorAll('[data-reg-point]').forEach(el=>interaction.bind(el,points[+el.dataset.regPoint].text));return lines.map(l=>({label:l.name,color:l.color}));}
function invnorm(p){let l=-8,h=8;const erf=x=>{const t=1/(1+.3275911*Math.abs(x)),v=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return Math.sign(x)*v;};for(let i=0;i<60;i++){const m=(l+h)/2;if((1+erf(m/Math.SQRT2))/2<p)l=m;else h=m;}return(l+h)/2;}
window.RegCharts={render};})();

;

/* Source: reg-opt-math.js */
/* Experiment04 拓展 · 优化理论与方法（课件 4+5 第四节）。
   线性规划（单纯形，含迭代表）、目标规划（加权偏差）、非线性规划（罚函数 + 梯度法）。
   纯计算 + base R 脚本生成，node 与浏览器共用。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.RegOptMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({c1:3,c2:2,a11:1,a12:1,b1:4,a21:1,a22:3,b2:6,
  g1:100,g2:140,w1:1,w2:1,xlo:60,xhi:180,
  x0:0,y0:0,rho:10,target:3,steps:20});
function check(p){
  for(const k of ['c1','c2','a11','a12','b1','a21','a22','b2'])if(!Number.isFinite(p[k]))throw Error('线性规划参数须为有限数值。');
  if(!(p.b1>0&&p.b2>0))throw Error('右端项须为正，教学版单纯形从可行基开始。');
  if(!(p.a11>=0&&p.a12>=0&&p.a21>=0&&p.a22>=0))throw Error('教学版要求技术系数非负。');
  if(!(p.g1>0&&p.g2>0))throw Error('目标值必须为正。');
  if(!(p.w1>0&&p.w2>0))throw Error('权重必须为正。');
  if(!(p.xlo<p.xhi))throw Error('决策变量区间须满足下限 < 上限。');
  if(!Number.isInteger(p.steps)||p.steps<1||p.steps>200)throw Error('迭代步数须为 1–200 的整数。');
  return true;
}
/* ---------- 1. 线性规划：max c'x, Ax<=b, x>=0，带迭代轨迹 ---------- */
function lp(p){
  check(p);
  const A=[[p.a11,p.a12],[p.a21,p.a22]],b=[p.b1,p.b2],c=[p.c1,p.c2];
  const m=b.length,n=c.length;
  /* 单纯形表：m 个约束行 + 1 个目标行；列 = x1..xn, s1..sm, rhs */
  const T=[],basis=[];
  for(let i=0;i<m;i++){const row=[...A[i],...Array.from({length:m},(_,j)=>j===i?1:0),b[i]];T.push(row);basis.push(n+i);}
  T.push([...c.map(v=>-v),...Array(m).fill(0),0]);
  const trace=[{iter:0,basis:[...basis],tableau:T.map(r=>r.slice()),z:0}];
  let iter=0,optimum=null;
  while(iter<40){
    const obj=T[m];
    let enter=-1,best=0;
    for(let j=0;j<n+m;j++)if(obj[j]<-1e-12&&obj[j]<best){best=obj[j];enter=j;}
    if(enter<0){optimum=true;break;}
    let leave=-1,ratio=Infinity;
    for(let i=0;i<m;i++)if(T[i][enter]>1e-12){const r=T[i][n+m]/T[i][enter];if(r<ratio-1e-12){ratio=r;leave=i;}}
    if(leave<0){optimum=false;break;}
    const piv=T[leave][enter];
    T[leave]=T[leave].map(v=>v/piv);
    for(let i=0;i<=m;i++)if(i!==leave){const f=T[i][enter];if(Math.abs(f)>1e-12)T[i]=T[i].map((v,j)=>v-f*T[leave][j]);}
    basis[leave]=enter;iter++;
    trace.push({iter,basis:[...basis],tableau:T.map(r=>r.slice()),z:T[m][n+m]});
  }
  const x=Array(n).fill(0);
  basis.forEach((v,i)=>{if(v<n)x[v]=T[i][n+m];});
  const z=c.reduce((s,v,i)=>s+v*x[i],0);
  /* 可行域顶点（用于作图）：两条约束与坐标轴的交点 */
  const corners=[[0,0],[p.b1/p.a11,0],[0,p.b1/p.a12],[p.b2/p.a21,0],[0,p.b2/p.a22]];
  const feasible=corners.filter(([x1,x2])=>x1>=-1e-9&&x2>=-1e-9&&A[0][0]*x1+A[0][1]*x2<=p.b1+1e-9&&A[1][0]*x1+A[1][1]*x2<=p.b2+1e-9)
    .map(([x1,x2])=>({x1,x2,z:c[0]*x1+c[1]*x2}));
  /* 两条约束的交点 */
  const det=A[0][0]*A[1][1]-A[0][1]*A[1][0];
  if(Math.abs(det)>1e-12){
    const x1=(p.b1*A[1][1]-A[0][1]*p.b2)/det,x2=(A[0][0]*p.b2-p.b1*A[1][0])/det;
    if(x1>=-1e-9&&x2>=-1e-9)feasible.push({x1,x2,z:c[0]*x1+c[1]*x2});
  }
  return{trace,x,z,status:optimum?'optimal':'unbounded',iterations:iter,feasible,
    slope:c[0]/-c[1]||0,constraints:A,b,c};
}
/* ---------- 2. 目标规划：加权偏差最小（一维，加权中位数） ---------- */
function gp(p){
  check(p);
  const goals=[{g:p.g1,w:p.w1},{g:p.g2,w:p.w2}];
  /* 一维加权绝对偏差最小 ⇒ 加权中位数；在 [xlo, xhi] 上取候选点求解 */
  let best=null;
  const cands=new Set([p.xlo,p.xhi,p.g1,p.g2]);
  for(let x=p.xlo;x<=p.xhi;x+=1)cands.add(x);
  for(const x of [...cands].sort((a,b)=>a-b)){
    let cost=0;
    for(const g of goals)cost+=g.w*Math.abs(g.g-x);
    if(!best||cost<best.cost-1e-12)best={x,cost};
  }
  const x=best.x;
  const dev=goals.map(g=>({g:g.g,w:g.w,achieved:x,dPlus:Math.max(0,x-g.g),dMinus:Math.max(0,g.g-x)}));
  const total=dev.reduce((s,d)=>s+d.w*(d.dPlus+d.dMinus),0);
  return{x,cost:total,dev,goals,
    curve:Array.from({length:51},(_,i)=>{const v=p.xlo+(p.xhi-p.xlo)*i/50;let c2=0;for(const g of goals)c2+=g.w*Math.abs(g.g-v);return{v,c:c2};})};
}
/* ---------- 3. 非线性规划：min f 罚函数 + 梯度法 ---------- */
function nlp(p){
  check(p);
  const f=(x,y)=>(x-2)**2+(y-1)**2+(p.rho/2)*Math.max(0,p.target-x-y)**2;
  const grad=(x,y)=>{
    const g=Math.max(0,p.target-x-y);
    return[2*(x-2)-p.rho*g,2*(y-1)-p.rho*g];
  };
  let x=p.x0,y=p.y0;const path=[{x,y,f:f(x,y)}];
  const rate=.12;
  for(let i=0;i<p.steps;i++){
    const [gx,gy]=grad(x,y);
    x-=rate*gx;y-=rate*gy;
    path.push({x,y,f:f(x,y),g:Math.hypot(gx,gy)});
  }
  const [gx,gy]=grad(x,y);
  return{path,x,y,f:f(x,y),gradient:Math.hypot(gx,gy),penalty:p.rho,target:p.target,
    constraint:p.target-x-y,
    contour:Array.from({length:13},(_,i)=>Array.from({length:13},(_,j)=>{const px=-1+4*i/12,py=-1+3*j/12;return{px,py,f:f(px,py)};}))};
}
/* ---------- 4. R 脚本 ---------- */
function build(view,p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:Array.isArray(code)?code:String(code).split('\n'),explain,formula});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  if(view==='lp'){
    add('data',T('模型与参数','Model and parameters'),
      [T('# max 3x + 2y  s.t.  x + y <= 4, x + 3y <= 6, x,y >= 0','# max 3x + 2y  s.t.  x + y <= 4, x + 3y <= 6, x,y >= 0'),
       `c <- c(${num(p.c1)}, ${num(p.c2)})`,
       `A <- matrix(c(${num(p.a11)}, ${num(p.a12)}, ${num(p.a21)}, ${num(p.a22)}), nrow = 2, byrow = TRUE)`,
       `b <- c(${num(p.b1)}, ${num(p.b2)})`],
      T('两个决策变量、两条约束，正好能画在平面上；添加松弛变量后进入单纯形表。','Two decision variables and two constraints fit on a plane; slack variables turn the model into a simplex tableau.'));
    add('simplex',T('单纯形表迭代','Simplex tableau iterations'),
      [T('# 手工实现：入基取目标行最负系数，出基做最小比值检验','# Implemented by hand: the entering column is the most negative objective coefficient, leaving row by the minimum ratio'),
       'simplex <- function(A, b, c) {',
       '  m <- nrow(A); n <- length(c)',
       '  T <- cbind(A, diag(m), b)',
       '  basis <- n + seq_len(m)',
       '  obj <- c(-c, rep(0, m), 0)',
       '  for (it in seq_len(40)) {',
       '    enter <- which.min(obj[seq_len(n + m)])',
       '    if (obj[enter] >= -1e-12) break',
       '    ratio <- ifelse(T[, enter] > 1e-12, T[, n + m + 1] / T[, enter], Inf)',
       '    leave <- which.min(ratio)',
       '    T[leave, ] <- T[leave, ] / T[leave, enter]',
       '    for (i in seq_len(m)) if (i != leave) T[i, ] <- T[i, ] - T[i, enter] * T[leave, ]',
       '    obj <- obj - obj[enter] * T[leave, ]',
       '    basis[leave] <- enter',
       '    cat("iter", it, "enter", enter, "leave", leave, "z", obj[n + m + 1], "\\n")',
       '  }',
       '  x <- numeric(n); for (i in seq_len(m)) if (basis[i] <= n) x[basis[i]] <- T[i, n + m + 1]',
       '  list(x = x, z = sum(c * x))',
       '}',
       'print(simplex(A, b, c))'],
      T('单纯形沿可行域的顶点移动；每一步都保持可行并让目标不下降。','The simplex moves along vertices of the feasible region, staying feasible while the objective never falls.'),
      String.raw`\max c'x\ \ \text{s.t.}\ Ax\le b,\ x\ge 0`);
    add('check',T('顶点核对','Vertex check'),
      [T('# 枚举约束交点，验证最优解确实落在顶点上','# Enumerate constraint intersections to confirm the optimum is a vertex'),
       'corners <- rbind(c(0,0), c(b[1]/A[1,1], 0), c(0, b[1]/A[1,2]),',
       '  c(b[2]/A[2,1], 0), c(0, b[2]/A[2,2]))',
       'det <- A[1,1]*A[2,2] - A[1,2]*A[2,1]',
       'if (abs(det) > 1e-12) corners <- rbind(corners,',
       '  c((b[1]*A[2,2] - A[1,2]*b[2])/det, (A[1,1]*b[2] - b[1]*A[2,1])/det))',
       'ok <- apply(corners, 1, function(v) all(A %*% v <= b + 1e-9) && all(v >= -1e-9))',
       'print(data.frame(corners[ok, , drop = FALSE], z = corners[ok, , drop = FALSE] %*% c))'],
      T('顶点核对照单纯形是独立算法：两种方法给出同一个最优点才算通过。','Vertex enumeration is an independent check: the two methods must agree on the optimum.'));
  }
  if(view==='gp'){
    add('gp',T('目标规划：加权偏差','Goal programming: weighted deviations'),
      [T('# 两个目标各有目标值与权重；最小化加权偏差和','# Two goals with target values and weights; minimise the weighted deviation'),
       `g <- c(${num(p.g1)}, ${num(p.g2)})`,`w <- c(${num(p.w1)}, ${num(p.w2)})`,
       `lo <- ${num(p.xlo)}; hi <- ${num(p.xhi)}`,
       'cost <- function(x) sum(w * abs(g - x))',
       'grid <- seq(lo, hi, by = 1)',
       'x_star <- grid[which.min(sapply(grid, cost))]',
       'print(data.frame(x = x_star, cost = cost(x_star)))',
       'print(data.frame(goal = g, achieved = x_star, d_plus = pmax(0, x_star - g), d_minus = pmax(0, g - x_star)))'],
      T('目标规划放弃"唯一最优"，改为在多个目标之间找加权折中；权重改变会移动解。','Goal programming gives up a unique optimum and seeks a weighted compromise; changing the weights moves the solution.'),
      String.raw`\min\ \sum_i w_i(d_i^++d_i^-)\ \ \text{s.t.}\ x+d_i^--d_i^+=g_i`);
    add('curve',T('偏差代价曲线','Deviation cost curve'),
      [T('# 画出一维决策变量上的加权偏差，观察折点','# Plot the weighted deviation over the decision variable and find the kink'),
       'plot(grid, sapply(grid, cost), type = "l", xlab = "x", ylab = "weighted deviation",',
       '  main = "Goal-programming cost")',
       'abline(v = x_star, lty = 2)',
       'abline(v = g, lty = 3, col = "grey50")'],
      T('折点通常落在某个目标值上，这就是加权中位数的几何表现。','The kink usually sits at one of the target values, which is the weighted median in geometric form.'));
  }
  if(view==='nlp'){
    add('nlp',T('非线性规划：罚函数 + 梯度法','Nonlinear programming: penalty plus gradient steps'),
      [T('# 目标：min (x−2)² + (y−1)² + (ρ/2)·max(0, 3−x−y)²','# Objective: min (x-2)^2 + (y-1)^2 + (rho/2)*max(0, 3-x-y)^2'),
       `rho <- ${num(p.rho)}; target <- ${num(p.target)}`,
       'f <- function(v) (v[1]-2)^2 + (v[2]-1)^2 + (rho/2)*max(0, target - v[1] - v[2])^2',
       'grad <- function(v) { g <- max(0, target - v[1] - v[2])',
       '  c(2*(v[1]-2) - rho*g, 2*(v[2]-1) - rho*g) }',
       `v <- c(${num(p.x0)}, ${num(p.y0)}); path <- v`,
       `for (i in seq_len(${p.steps})) { step <- grad(v); v <- v - 0.12*step; path <- rbind(path, v) }`,
       'print(v); print(f(v)); print(target - v[1] - v[2])'],
      T('罚函数把约束"软化"为目标的一部分；ρ 越大越接近硬约束，但数值上更难优化。','The penalty softens the constraint into the objective; a larger rho approaches a hard constraint but is numerically harder.'),
      String.raw`\min f(x)+\frac{\rho}{2}\left[\max(0,g(x))\right]^2`);
    add('path',T('迭代路径','Iteration path'),
      [T('# 画出收敛路径与最终梯度范数','# Plot the path and the final gradient norm'),
       'plot(path[,1], path[,2], type = "b", xlab = "x", ylab = "y", main = "Gradient descent path")',
       'abline(a = target, b = -1, lty = 2)',
       'cat("final gradient norm:", sqrt(sum(grad(v)^2)), "\\n")'],
      T('虚线是约束边界；最终点越接近边界，说明罚项越强。','The dashed line is the constraint boundary; the closer the final point, the stronger the penalty.'));
  }
  return{blocks,code:'# FinModel Lab | Experiment 04.4 | optimization\n\n'+blocks.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{defaults,check,lp,gp,nlp,build};
});

;

/* Source: reg-econ-math.js */
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

;

/* Source: reg-adv-view.js */
/* Experiment04 拓展视图：优化理论与方法（4+5 第四节）与经济计量分析（第二节）。 */
(()=>{'use strict';
const K=window.LabKit,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const O=()=>window.RegOptMath,E=()=>window.RegEconMath;
const state={view:'opt',opt:{...window.RegOptMath.defaults},econ:{...window.RegEconMath.defaults},
  optMode:'lp',econMode:'logit',built:null,last:null,mode:'full'};
function controls(){
  const view=state.view;let host=$('#regAdvControls');
  if(!host){host=document.createElement('section');host.id='regAdvControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});
    host.addEventListener('click',e=>{const b=e.target.closest('[data-adv-mode]');if(b){
      if(state.view==='opt')state.optMode=b.dataset.advMode;else state.econMode=b.dataset.advMode;
      controls();paint();}});
  }
  const p=view==='opt'?state.opt:state.econ;
  const modes=view==='opt'?[['lp','线性规划'],['gp','目标规划'],['nlp','非线性规划']]:[['logit','二元选择'],['kmeans','聚类'],['pca','因子分析']];
  const mode=view==='opt'?state.optMode:state.econMode;
  let body='';
  if(view==='opt'&&mode==='lp')body=K.field({id:'c1',zh:'目标系数 c₁',en:'Objective c₁',value:p.c1,step:.5})+K.field({id:'c2',zh:'目标系数 c₂',en:'Objective c₂',value:p.c2,step:.5})+
    K.field({id:'a11',zh:'约束1 · x₁ 系数',en:'Constraint 1 · x₁',value:p.a11,min:0,step:.5})+K.field({id:'a12',zh:'约束1 · x₂ 系数',en:'Constraint 1 · x₂',value:p.a12,min:0,step:.5})+
    K.field({id:'b1',zh:'约束1 · 右端项',en:'Constraint 1 · RHS',value:p.b1,min:.5,step:.5})+K.field({id:'a21',zh:'约束2 · x₁ 系数',en:'Constraint 2 · x₁',value:p.a21,min:0,step:.5})+
    K.field({id:'a22',zh:'约束2 · x₂ 系数',en:'Constraint 2 · x₂',value:p.a22,min:0,step:.5})+K.field({id:'b2',zh:'约束2 · 右端项',en:'Constraint 2 · RHS',value:p.b2,min:.5,step:.5});
  if(view==='opt'&&mode==='gp')body=K.field({id:'g1',zh:'目标 1 的目标值',en:'Goal 1 target',value:p.g1,min:1,step:5})+K.field({id:'g2',zh:'目标 2 的目标值',en:'Goal 2 target',value:p.g2,min:1,step:5})+
    K.field({id:'w1',zh:'目标 1 权重',en:'Goal 1 weight',value:p.w1,min:.1,step:.1})+K.field({id:'w2',zh:'目标 2 权重',en:'Goal 2 weight',value:p.w2,min:.1,step:.1})+
    K.field({id:'xlo',zh:'决策变量下限',en:'Lower bound',value:p.xlo,step:5})+K.field({id:'xhi',zh:'决策变量上限',en:'Upper bound',value:p.xhi,step:5});
  if(view==='opt'&&mode==='nlp')body=K.field({id:'rho',zh:'罚项强度 ρ',en:'Penalty ρ',value:p.rho,min:1,max:200,step:1})+K.field({id:'target',zh:'约束 x+y ≥',en:'Constraint x+y ≥',value:p.target,step:.5})+
    K.field({id:'x0',zh:'初始 x',en:'Initial x',value:p.x0,min:-1,max:3,step:.5})+K.field({id:'y0',zh:'初始 y',en:'Initial y',value:p.y0,min:-1,max:3,step:.5})+
    K.field({id:'steps',zh:'迭代步数',en:'Steps',value:p.steps,min:1,max:200,step:1});
  if(view==='econ'&&mode==='logit')body=K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:80,max:800,step:20})+K.field({id:'b0',zh:'真实 β₀',en:'True β₀',value:p.b0,min:-2,max:2,step:.1})+
    K.field({id:'b1',zh:'真实 β₁',en:'True β₁',value:p.b1,min:.1,max:4,step:.1})+K.field({id:'noise',zh:'潜在变量噪声',en:'Latent noise',value:p.noise,min:.1,max:2,step:.1})+
    K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  if(view==='econ'&&mode==='kmeans')body=K.field({id:'points',zh:'样本量',en:'Sample size',value:p.points,min:40,max:300,step:10})+K.field({id:'k',zh:'聚类数 k',en:'Clusters k',value:p.k,min:2,max:5,step:1})+
    K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  if(view==='econ'&&mode==='pca')body=K.field({id:'factors',zh:'变量数',en:'Variables',value:p.factors,min:3,max:8,step:1})+K.field({id:'obs',zh:'观测数',en:'Observations',value:p.obs,min:60,max:400,step:20})+
    K.field({id:'kappa',zh:'公共因子强度',en:'Common-factor strength',value:p.kappa,min:0,max:.98,step:.02})+K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1});
  host.innerHTML=`<h3>${K.esc(view==='opt'?t('优化方法参数','Optimization settings'):t('计量模型参数','Econometric settings'))}</h3>
    <div class="lab-view-controls" style="padding:0 0 8px">${modes.map(([k,l])=>`<button type="button" data-adv-mode="${k}" aria-pressed="${k===mode}">${K.esc(t(l,{lp:'Linear programming',gp:'Goal programming',nlp:'Nonlinear programming',logit:'Binary choice',kmeans:'Clustering',pca:'Factor analysis'}[k]))}</button>`).join('')}</div>
    ${body}
    ${K.tasks(view==='opt'?[['先手算一个顶点，再用单纯形表核对。','Work out one vertex by hand and check it against the simplex tableau.'],
      ['把目标系数 c₁ 调小，观察最优顶点何时切换。','Lower c₁ and watch when the optimal vertex switches.'],
      ['把 ρ 从 10 调到 200，观察最终点是否更贴近约束边界。','Raise ρ from 10 to 200 and see whether the final point moves onto the constraint boundary.']]
      :[['先预测：probit 的系数应该比 logit 大还是小？','Predict first: should the probit coefficient be larger or smaller than the logit one?'],
        ['把噪声调大，观察 McFadden 伪 R² 与命中率如何下降。','Increase the noise and watch McFadden pseudo-R² and the hit rate fall.'],
        ['改变聚类数 k，说明组内平方和为什么一定下降。','Change the number of clusters and explain why within-cluster SS must fall.']])}`;
  sync();return host;
}
function sync(){const p=state.view==='opt'?state.opt:state.econ;for(const [k,v] of Object.entries(p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const view=state.view,next={...state.view==='opt'?state.opt:state.econ};
  for(const el of $('#regAdvControls').querySelectorAll('input')){
    const id=el.id.replace(/^lab-/,'');const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{(view==='opt'?O():E()).check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  if(view==='opt')state.opt=next;else state.econ=next;
  return next;
}
function paint(){
  const view=state.view,mode=view==='opt'?state.optMode:state.econMode,p=view==='opt'?state.opt:state.econ;
  const host=$('#regPlot')||document.querySelector('#chartHost');
  host.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=host.querySelector('.svg-host'),title=host.querySelector('h3');
  try{
    let q;
    if(view==='opt'&&mode==='lp'){
      q=O().lp(p);state.last=q;
      title.textContent=t('可行域、顶点与最优解','Feasible region, vertices and the optimum');
      const x1max=Math.max(p.b1/p.a11,p.b2/p.a21,1)*1.15;
      const line=(A,B)=>({type:'line',points:[[0,B],[x1max,Math.max(0,B-A*x1max)]]});
      K.chart(svg,{xLabel:['x₁','x₁'],yLabel:['x₂','x₂'],yZero:true,xTicks:4,yTicks:4,
        series:[line(p.a11/p.a12,p.b1/p.a12),line(p.a21/p.a22,p.b2/p.a22),
          {type:'scatter',points:q.feasible.map(v=>[v.x1,v.x2]),color:'#659b8a',radius:5},
          {type:'scatter',points:[[q.x[0],q.x[1]]],color:'#b5816f',radius:8,tip:()=>[`最优：(${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)})，z=${q.z.toFixed(2)}`,`Optimum: (${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)}), z=${q.z.toFixed(2)}`]}],
        aria:['线性规划可行域','LP feasible region']});
      K.metrics([['最优目标 z','Optimal z',q.z.toFixed(3)],['单纯形迭代','Simplex iterations',String(q.iterations)],['最优解','Optimum',`(${q.x[0].toFixed(2)}, ${q.x[1].toFixed(2)})`]]);
      K.legend([['约束1','Constraint 1','#6689a8',false],['约束2','Constraint 2','#9b88ac',false],['可行顶点','Feasible vertex','#659b8a',false],['最优解','Optimum','#b5816f',false]]);
      K.details(K.table([['迭代','Iter'],['基变量','Basis'],['目标值 z','Objective']],q.trace.map(tr=>[String(tr.iter),tr.basis.map(b=>b<2?'x'+(b+1):'s'+(b-1)).join(', '),tr.z.toFixed(4)]))+
        `<p class="chart-note">${K.esc(t('入基取目标行最负系数，出基用最小比值检验；两约束交点与坐标轴交点共同构成可行顶点。','The entering column is the most negative objective coefficient and the leaving row uses the minimum ratio; the constraint intersection and the axis intercepts form the feasible vertices.'))}</p>`);
      state.built=O().build('lp',p,q,K.lang());
    }else if(view==='opt'&&mode==='gp'){
      q=O().gp(p);state.last=q;
      title.textContent=t('加权偏差代价与折中点','Weighted deviation cost and the compromise point');
      K.chart(svg,{xLabel:['决策变量 x','Decision x'],yLabel:['加权偏差','Weighted deviation'],
        series:[{type:'line',points:q.curve.map(c=>[c.v,c.c]),color:'#6689a8',tip:d=>[`x=${d[0].toFixed(0)}：代价 ${d[1].toFixed(1)}`,'x='+d[0].toFixed(0)+': cost '+d[1].toFixed(1)]}],
        refs:[{axis:'x',value:q.x,color:'#b5816f',label:['折中解','compromise']},{axis:'x',value:p.g1,color:'#9b88ac',dash:true},{axis:'x',value:p.g2,color:'#9b88ac',dash:true}],
        aria:['目标规划代价','Goal-programming cost']});
      K.metrics([['折中解 x*','Compromise x*',q.x.toFixed(2)],['加权偏差','Weighted deviation',q.cost.toFixed(2)],['目标数','Goals','2']]);
      K.legend([['加权偏差','Weighted deviation','#6689a8',false],['折中解','Compromise','#b5816f',false],['目标值','Goals','#9b88ac',true]]);
      K.details(K.table([['目标','Goal'],['目标值','Target'],['实现值','Achieved'],['d⁺','d⁺'],['d⁻','d⁻']],q.dev.map(d=>[t('目标','Goal')+' '+(q.dev.indexOf(d)+1),d.g.toFixed(1),d.achieved.toFixed(2),d.dPlus.toFixed(2),d.dMinus.toFixed(2)]))+
        `<p class="chart-note">${K.esc(t('一维加权绝对偏差的最小值落在加权中位数上；权重越大，解越靠近该目标。','The one-dimensional weighted absolute deviation is minimised at the weighted median; a larger weight pulls the solution towards that goal.'))}</p>`);
      state.built=O().build('gp',p,q,K.lang());
    }else if(view==='opt'&&mode==='nlp'){
      q=O().nlp(p);state.last=q;
      title.textContent=t('梯度下降路径与约束边界','Gradient-descent path and the constraint boundary');
      K.chart(svg,{xLabel:['x','x'],yLabel:['y','y'],yZero:true,
        series:[{type:'line',points:q.path.map(v=>[v.x,v.y]),color:'#6689a8',marker:true,tip:d=>[`(${d[0].toFixed(2)}, ${d[1].toFixed(2)})`,'('+d[0].toFixed(2)+', '+d[1].toFixed(2)+')']},
          {type:'line',points:[[-0.5,p.target+0.5],[2.5,p.target-2.5]],color:'#9b88ac',dash:true}],
        aria:['梯度下降路径','Gradient-descent path']});
      K.metrics([['最终点 x','Final x',q.x.toFixed(3)],['最终点 y','Final y',q.y.toFixed(3)],['梯度范数','Gradient norm',q.gradient.toExponential(2)]]);
      K.legend([['迭代路径','Path','#6689a8',false],['约束边界','Constraint','#9b88ac',true]]);
      K.details(K.table([['项目','Item'],['数值','Value']],[
        [t('目标函数值','Objective'),q.f.toExponential(3)],[t('约束余量 x+y−target','Constraint slack'),q.constraint.toFixed(4)],
        [t('罚项强度 ρ','Penalty ρ'),String(q.penalty)],[t('迭代步数','Steps'),String(q.path.length-1)]])+
        `<p class="chart-note">${K.esc(t('罚函数法把约束变成目标的一部分：ρ 越大越贴近硬约束，但梯度尺度变大、收敛更慢。','The penalty method folds the constraint into the objective: a larger ρ approaches a hard constraint but scales the gradient and slows convergence.'))}</p>`);
      state.built=O().build('nlp',p,q,K.lang());
    }else if(view==='econ'&&mode==='logit'){
      q=E().binary(p);state.last=q;
      title.textContent=t('Logit 与 Probit 拟合概率','Logit and probit fitted probabilities');
      K.chart(svg,{xLabel:['x','x'],yLabel:['P(y=1)','P(y=1)'],yZero:false,
        series:[{type:'scatter',points:q.rows.map(r=>[r.x,r.y]),color:'#c9d3da',radius:2.4,opacity:.6},
          {type:'line',points:q.logit.curve.map(c=>[c.x,c.p]),color:'#6689a8'},
          {type:'line',points:q.probit.curve.map(c=>[c.x,c.p]),color:'#9b88ac',dash:true}],
        aria:['二元选择拟合','Binary-choice fit']});
      K.metrics([['Logit β₁','Logit β₁',q.logit.beta[1].toFixed(3)],['Probit β₁','Probit β₁',q.probit.beta[1].toFixed(3)],['McFadden R²','McFadden R²',q.logit.mcfadden.toFixed(3)]]);
      K.legend([['样本点','Observations','#c9d3da',false],['Logit','Logit','#6689a8',false],['Probit','Probit','#9b88ac',true]]);
      K.details(K.table([['模型','Model'],['β₀','β₀'],['β₁','β₁'],['伪 R²','Pseudo R²'],['命中率','Hit rate']],[
        ['Logit',q.logit.beta[0].toFixed(3),q.logit.beta[1].toFixed(3),q.logit.mcfadden.toFixed(3),K.pct(q.logit.hit,1)],
        ['Probit',q.probit.beta[0].toFixed(3),q.probit.beta[1].toFixed(3),q.probit.mcfadden.toFixed(3),K.pct(q.probit.hit,1)]])+
        `<p class="chart-note">${K.esc(t('真值 β₀,β₁ 已用于生成潜在变量；Logit 与 Probit 的系数尺度不同，不能直接比大小。','The true β₀ and β₁ generate the latent variable; logit and probit coefficients live on different scales and cannot be compared directly.'))}</p>`);
      state.built=E().build('logit',p,q,K.lang());
    }else if(view==='econ'&&mode==='kmeans'){
      q=E().cluster(p);state.last=q;
      title.textContent=t('聚类结果与中心','Cluster assignments and centres');
      const colors=['#6689a8','#9b88ac','#659b8a','#b5816f','#7f9182'];
      const series=Array.from({length:q.k},(_,j)=>({type:'scatter',points:q.rows.filter((_,i)=>q.assign[i]===j).map(r=>[r.x,r.y]),color:colors[j%5],radius:3.2}));
      series.push({type:'scatter',points:q.centroids.map(c=>[c[0],c[1]]),color:'#293e4d',radius:7,opacity:1});
      K.chart(svg,{xLabel:['x','x'],yLabel:['y','y'],yZero:true,series,aria:['聚类散点','Cluster scatter']});
      K.metrics([['组内平方和','Within-cluster SS',q.wss.toFixed(2)],['迭代次数','Iterations',String(q.iters)],['各组规模','Cluster sizes',q.counts.join(' / ')]]);
      K.legend(Array.from({length:q.k},(_,j)=>[t('组','Cluster')+' '+(j+1),'Cluster '+(j+1),colors[j%5],false]).concat([['中心','Centres','#293e4d',false]]));
      K.details(K.table([['组','Cluster'],['样本数','Size'],['中心 x','Centre x'],['中心 y','Centre y']],q.centroids.map((c,j)=>[String(j+1),String(q.counts[j]),c[0].toFixed(3),c[1].toFixed(3)]))+
        `<p class="chart-note">${K.esc(t('k-means 的结果依赖初始中心；k 增大时组内平方和必然下降，不能用它来选择 k。','k-means depends on the initial centres; within-cluster SS must fall as k grows, so it cannot choose k.'))}</p>`);
      state.built=E().build('kmeans',p,q,K.lang());
    }else{
      q=E().factors(p);state.last=q;
      title.textContent=t('碎石图与累计解释方差','Scree plot and cumulative explained variance');
      K.chart(svg,{xLabel:['主成分','Component'],yLabel:['解释方差比例','Explained share'],xTickFormat:v=>String(Math.round(v)),
        series:[{type:'bar',points:q.explained.map((v,i)=>[i+1,v]),color:'#6689a8',gap:.6,tip:d=>[`PC${Math.round(d[0])}：${K.pct(d[1],1)}`,'PC'+Math.round(d[0])+': '+K.pct(d[1],1)]},
          {type:'line',points:q.cumulative.map((v,i)=>[i+1,v]),color:'#9b88ac'}],
        aria:['碎石图','Scree plot']});
      K.metrics([['PC1 解释比例','PC1 share',K.pct(q.explained[0],1)],['前两个累计','First two cumulative',K.pct(q.cumulative[1],1)],['变量数','Variables',String(q.k)]]);
      K.legend([['各主成分','Components','#6689a8',false],['累计','Cumulative','#9b88ac',false]]);
      K.details(K.table([['主成分','Component'],['特征值','Eigenvalue'],['解释比例','Share'],['累计','Cumulative']],q.eigenvalues.map((v,i)=>['PC'+(i+1),v.toFixed(3),K.pct(q.explained[i],1),K.pct(q.cumulative[i],1)]))+
        `<p class="chart-note">${K.esc(t('主成分按方差排序；保留几个因子要结合碎石图拐点与经济含义，而不是机械地取特征值大于 1。','Components are ordered by variance; how many to keep needs both the scree elbow and an economic reading, not a mechanical eigenvalue rule.'))}</p>`);
      state.built=E().build('pca',p,q,K.lang());
    }
    $('#validation').textContent='';
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({view,mode,onBuilt}){
  state.view=view;state.mode=mode;
  controls();
  const host=$('#regAdvControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;host.classList.remove('hidden');
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.RegAdvView={render,state};
})();

;

/* Source: reg-workbench.js */
(()=>{'use strict';const M=RegMath,$=s=>document.querySelector(s),esc=s=>WorkbenchUI.esc(String(s)),fmt=(v,d=5)=>v===Infinity?'∞（完全共线）':v===null||v===undefined||!Number.isFinite(v)?'不可估计':Number(v.toPrecision(d)).toString(),pct=v=>fmt(v*100)+'%';function mount(){CourseExperiments.mount('regression');document.body.classList.add('reg-workbench');$('.learning').hidden=true;let p={...M.defaults},s={view:'traditional',method:'ols',direction:'both',tradChart:'coefficients',reg:'ridge',mode:'manual',regChart:'path',metric:'rmse'},dataset=null,confirmed=null,a=null,built=null,q=null,valid=false,selected='ols',focus=null,codeMode='full',pendingFile=null;const tabs=document.createElement('div');tabs.id='regViews';tabs.innerHTML=[['traditional','01 传统回归'],['regularization','02 正则化'],['compare','03 四模型比较'],['opt','04 优化方法'],['econ','05 计量模型']].map(([k,l])=>`<button data-reg-view="${k}">${l}</button>`).join('');$('.model-panel .panel-head').after(tabs);const question=document.createElement('p');question.id='regQuestion';tabs.after(question);const controls=document.createElement('div');controls.id='regControls';question.after(controls);
const field=(k,l)=>`<label id="rf-${k}"><span>${l}</span><input id="reg-${k}" type="number" step="any" value="${p[k]}"></label>`;$('#inputs').innerHTML=[['rho','合成特征相关程度（0–1）'],['lambda','λ（0–100）'],['train','训练比例（0.6–0.9）']].map(([k,l])=>field(k,l)).join('')+'<label id="regLogField">λ对数滑块<input id="regLog" type="range" min="-6" max="0" step="0.05" value="-3"></label><details id="regAdvanced"><summary>数据与优化高级设置</summary>'+[['n','合成样本量'],['noise','合成噪声σ（收益小数）'],['seed','合成数据种子'],['logMin','搜索下限 log10(λ)'],['logMax','搜索上限 log10(λ)'],['tol','Lasso收敛绝对容差'],['maxit','Lasso迭代上限']].map(([k,l])=>field(k,l)).join('')+'<p>三段扩展窗口验证，指标合并RMSE；无随机分折、无1-SE规则。λ与y收益小数尺度有关。</p></details><p id="regSource"></p>';
const databox=document.createElement('details');databox.id='regData';databox.innerHTML='<summary>本地CSV：选择目标与特征</summary><p>CSV宽表：日期、目标、1–20个数值特征。每行同一日期，异步来源需先合并并核对发布时间。只在浏览器处理，不上传。</p><input id="regFile" type="file" accept=".csv"><div id="regColumns"></div><label>数值口径<select id="regKind"><option value="simple">全部列为简单收益</option><option value="price">全部列为价格→简单收益</option><option value="numeric">数值特征（目标为收益）</option></select></label><label>单位<select id="regUnit"><option value="decimal">小数/原始数值</option><option value="percent">百分数数值（所有所选列÷100）</option></select></label><label>时间口径<select id="regTiming"><option value="lag">上期特征预测下期目标（自动滞后）</option><option value="aligned">已对齐：我确认特征事前可知</option><option value="same">同期解释（不称为事前预测）</option></select></label><label>缺失处理<select id="regMissing"><option value="reject">发现缺失即拒绝</option><option value="drop">明确删除缺失整行并报告</option></select></label><button id="regImport">确认导入</button><button id="regExport">导出当前确认样本</button><button id="regSynthetic">恢复合成数据</button><p id="regDataError" role="alert"></p>';$('#inputs').after(databox);
$('#chartHost').innerHTML='<div id="regPlot"></div><div id="regTip" class="chart-tooltip" hidden></div>';const inter=ChartInteraction.create((text,mode)=>{const t=$('#regTip');t.hidden=!text;t.dataset.state=mode;if(text){t.innerHTML='<button id="regCloseTip" aria-label="关闭详情">×</button>'+esc(text);$('#regCloseTip').onclick=()=>inter.clear();}});$('#regPlot').onclick=e=>{if(!e.target.closest('[data-reg-point]'))inter.clear();};const nav=document.createElement('nav');nav.id='regCodeNav';$('.code-toolbar').after(nav);
const options=(id,values,current)=>`<select id="${id}">${values.map(([k,l])=>`<option value="${k}" ${k===current?'selected':''}>${l}</option>`).join('')}</select>`,button=(attr,k,l,on)=>`<button ${attr}="${k}" aria-pressed="${on}">${l}</button>`,metric=(l,v)=>`<div><span>${l}</span><b>${v}</b></div>`,table=(head,rows)=>'<table><thead><tr>'+head.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
function arrange(){for(const k of ['n','rho','noise','seed'])$('#reg-'+k).disabled=!!dataset;$('#rf-lambda').hidden=s.view!=='regularization'||s.mode!=='manual';$('#regLogField').hidden=$('#rf-lambda').hidden;$('#rf-rho').hidden=!!dataset;$('#regLog').min=p.logMin;$('#regLog').max=p.logMax;$('#regLog').value=p.lambda>0?Math.log10(p.lambda):p.logMin;}
function render(){
 inter.clear();inter.redraw(()=>false);
 if(s.view==='opt'||s.view==='econ'){
  if(!window.RegAdvView)throw Error('优化/计量视图未加载。');
  const out=window.RegAdvView.render({view:s.view,mode:codeMode,onBuilt:c=>{built={blocks:c.blocks,code:c.code};valid=true;$('#copy').disabled=false;selected=c.blocks[0].key;focus=null;renderCode();}});
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.regView===s.view)));
  $('#graphKind').textContent=window.LabKit.t(s.view==='opt'?'优化方法':'计量模型',s.view==='opt'?'Optimization':'Econometrics');
  $('#assumptionSummary').innerHTML=[['合成数据','Synthetic'],['Base R 复现','Base R'],['同一致目标','Same objective']].map(x=>'<span>'+window.LabKit.t(x[0],x[1])+'</span>').join('');
  if(!out)return;
  return;
 }
 for(const el of $('#inputs').children)el.hidden=(el.id==='regAdvControls');
 try{const next=Object.fromEntries(Object.keys(M.defaults).map(k=>[k,$('#reg-'+k).value.trim()===''?NaN:Number($('#reg-'+k).value)]));M.settings(next);p=next;confirmed=dataset||M.generate(p);a=M.analyze(confirmed,p,s.direction);const key=s.reg==='ridge'?'Ridge':'Lasso';q=s.view==='regularization'?(s.mode==='manual'?a.manual[s.reg]:a.models[key]):a.models.OLS;built=RegCode.build(p,s,confirmed,a);valid=true;$('#copy').disabled=false;$('#validation').textContent='';draw();}catch(e){valid=false;a=built=q=null;$('#copy').disabled=true;$('#validation').textContent=e.message;$('#metrics').innerHTML='<p>当前输入无有效结果</p>';$('#regPlot').textContent=e.message;$('#details').innerHTML='';$('#legend').innerHTML='';$('#code').innerHTML='';}arrange();}
function draw(){tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.regView===s.view)));$('#graphKind').textContent=confirmed.source;$('#regSource').textContent=confirmed.note;$('#assumptionSummary').innerHTML='<span>'+esc(confirmed.source)+'</span><span>'+a.nt+'训练 / '+(a.n-a.nt)+'测试</span><span>'+(confirmed.predictive?'时间顺序预测':'同期解释留出')+'</span>';$('#assumptions').textContent='OLS经典标准误假定线性条件均值正确、外生性、同方差和无序列相关；正态误差下t/F具有精确有限样本分布。实际金融数据常不满足，当前未提供HAC/HC稳健推断；p值不是因果概率。逐步选择后常规p值未校正筛选偏差。Ridge/Lasso不输出伪造p值。训练期内标准化及选模；测试集仅评价。反复根据测试成绩调整设置后，原测试段不再是完全独立的泛化证据。合成非市场；用户CSV发布时间、复权、频率需要自行核对；不年化，不保证预测能力。';
controls.innerHTML=s.view==='traditional'?options('regMethod',[['ols','OLS多元回归'],['stepwise','Stepwise AIC']],s.method)+(s.method==='stepwise'?options('regDirection',[['forward','前向加入'],['backward','后向剔除'],['both','双向（完整起点）']],s.direction):[['coefficients','系数与区间'],['predicted','实际与预测'],['residual','残差诊断'],['qq','正态Q-Q']].map(([k,l])=>button('data-reg-chart',k,l,s.tradChart===k)).join('')):s.view==='regularization'?options('regPenalty',[['ridge','Ridge L2'],['lasso','Lasso L1']],s.reg)+options('regMode',[['manual','手动探索'],['cv','时间验证选择']],s.mode)+[['path','系数路径'],['validation','验证误差'],['coefficients','当前系数']].map(([k,l])=>button('data-reg-chart',k,l,s.regChart===k)).join(''):options('regMetric',[['rmse','测试RMSE'],['mae','测试MAE']],s.metric);
for(const [id,key]of [['regMethod','method'],['regDirection','direction'],['regPenalty','reg'],['regMode','mode'],['regMetric','metric']])if($('#'+id))$('#'+id).onchange=()=>{s[key]=$('#'+id).value;selected=key==='method'&&s.method==='stepwise'?'step':s.view==='regularization'?'regularization':selected;render();};controls.onclick=e=>{const b=e.target.closest('[data-reg-chart]');if(b){s[s.view==='traditional'?'tradChart':'regChart']=b.dataset.regChart;render();}};
$('#regQuestion').textContent=s.view==='traditional'?(s.method==='ols'?'多个相关的金融特征，怎样一起解释或预测收益？':'哪些特征值得保留？让AIC逐步比较模型。'):s.view==='regularization'?'牺牲一点训练拟合，能否让相关特征的系数更稳定？':'训练拟合最好，预测新数据也一定最好吗？';const error=q?.error;const legend=error&&s.view==='regularization'?($('#regPlot').textContent=error,[]):RegCharts.render($('#regPlot'),s,confirmed,a,q,inter);$('#legend').innerHTML=legend.map(l=>`<span><i style="--legend-color:${l.color}"></i>${esc(l.label)}</span>`).join('');let details='';
if(s.view==='traditional'&&s.method==='ols'){const ol=a.models.OLS;$('#metrics').innerHTML=metric('训练R²',fmt(ol.r2))+metric('测试RMSE',pct(ol.test.rmse));details=`<p id="regInsight">${ol.rank<confirmed.names.length+1?'设计矩阵秩不足：部分系数不可识别，NA不等于零效应。测试预测采用同一可估计子空间，外推存在非唯一性。':`固定其他特征后，系数表示目标收益的统计变化。当前最大VIF ${fmt(Math.max(...a.diag.vif.filter(x=>x!==null)))}；共线性可能增大不确定性，但不意味着模型必然没有预测能力。`}</p><p>截距 ${fmt(ol.coef[0])}；调整R² ${fmt(ol.adjR2)}；残差SE ${fmt(ol.rse)}；残差df ${ol.df}；F ${fmt(ol.f)} / p ${fmt(ol.pF)}。${ol.degenerate?'因变量或残差退化：常规推断不报告。':''}</p><details><summary>系数、标准误、t/p与共线性</summary>${table(['变量','估计','SE','t','p','VIF'],['截距',...confirmed.names].map((name,j)=>[name,fmt(ol.coef[j]),fmt(ol.se[j]),fmt(ol.t[j]),fmt(ol.p[j]),j?fmt(a.diag.vif[j-1]):'—']))}<p>条件指标 ${fmt(a.diag.condition)}：${esc(a.diag.conditionDefinition)}。VIF阈值仅经验参考。</p>${table(['相关矩阵',...confirmed.names],a.diag.corr.map((r,i)=>[confirmed.names[i],...r.map(v=>fmt(v,3))]))}</details>`;}
else if(s.view==='traditional'){const st=a.step;$('#metrics').innerHTML=st.error?metric('选模不可用','请核对数据'):metric('保留解释变量',String(st.ids.length))+metric('最终AIC*',fmt(st.fit.aic));details=st.error?'<p>'+esc(st.error)+'</p>':`<p id="regInsight">当前保留 ${esc(st.ids.map(j=>confirmed.names[j]).join('、')||'仅截距')}。测试RMSE ${pct(a.models.Stepwise.test.rmse)}。每步重新估计候选模型，不按p值删变量。</p><details><summary>完整候选AIC与选择过程</summary>${st.rounds.map((r,i)=>'<p>第'+i+'轮，当前AIC '+fmt(r.aic)+'；'+esc(r.accepted||'停止：没有改进>1e−7')+'</p>'+table(['操作','候选模型','AIC'],r.candidates.map(c=>[(c.action==='add'?'加入':'删除')+' '+confirmed.names[c.variable],c.ids.map(j=>confirmed.names[j]).join(', ')||'仅截距',fmt(c.aic,10)]))).join('')}</details><p>AIC* = n log(RSS/n)+2 rank，与R extractAIC一致；完整高斯AIC加同一常数。贪心不保证全局最优，样本变化可能改变结果；筛选后常规p值未校正选择偏差，剔除不代表无经济意义。</p>`;}
else if(s.view==='regularization'){const cv=s.reg==='ridge'?a.ridgeCV:a.lassoCV,currentCV=a.manualCV[s.reg];$('#metrics').innerHTML=error?metric('当前模型失败','无有效结果'):metric('当前λ',fmt(q.lambda))+metric(s.reg==='ridge'?'有效df（含截距）':'活跃变量（不含截距）',fmt(s.reg==='ridge'?q.edf:q.nonzero));details=error?'<p>'+esc(error)+'</p>':`<p id="regInsight">${s.reg==='ridge'?'L2惩罚收缩整体系数，不以删除变量为目标；单个系数绝对值不保证全程单调。':'L1惩罚可将部分系数压为0；相关变量间的选择可能不稳定，不是发现因果变量。'} 当前λ时间验证RMSE ${s.mode==='manual'?(currentCV.error?'不可用':pct(currentCV.loss[0].rmse)):(cv.error?'不可用':pct(cv.loss[cv.best].rmse))}，训练RMSE ${pct(q.train.rmse)}，测试RMSE ${pct(q.test.rmse)}，测试MAE ${pct(q.test.mae)}。</p><p>${s.mode==='manual'?'手动λ为探索，不能称为最佳预测模型。':'λ由训练内部三段扩展窗口验证选择。'} ${cv.error?'验证不可用：'+esc(cv.error):`验证最优λ ${fmt(cv.lambda)}，合并RMSE ${pct(cv.loss[cv.best].rmse)}。验证训练终点→验证区间：${cv.ranges.map(f=>(f.train)+'→'+(f.start+1)+'–'+f.end+'（'+confirmed.dates[f.start]+'至'+confirmed.dates[f.end-1]+'）').join('；')}（训练期行号）。`}</p><details><summary>标准化、目标函数与优化详情</summary><p>X只用当前训练或验证折训练段中心化，并以√mean((X−mean)²)标准化。y保持收益小数；截距不惩罚。J=RSS/(2n)+${s.reg==='ridge'?'λ‖b‖₂²/2':'λ‖b‖₁'}。零计数阈值 |b|>1e−10。λ=0在满秩时退回无惩罚目标；秩不足时拒绝非唯一系数。</p><p>KKT最大误差 ${fmt(q.kkt)}；迭代 ${q.iter}；目标值 ${fmt(q.objective)}。当前λ可超路径范围，参考线和坐标仍按实际值绘制；λ=0不在对数轴显示。</p>${table(['特征','原始尺度系数','标准化X系数','训练均值','训练RMS'],confirmed.names.map((name,j)=>[name,fmt(q.coef[j+1]),fmt(q.standardCoef[j]),fmt(q.mean[j]),fmt(q.scale[j])]))}<p>截距 ${fmt(q.coef[0])}；训练RMS≤1e−14的数值常数特征在正则化中中心化为0（极小单位应先重标度），系数按0处理，不是统计选择结论。未给正则化系数伪造t/p或置信区间。</p></details>`;}
else{const rows=Object.entries(a.models);$('#metrics').innerHTML=metric('共同训练 / 测试',a.nt+' / '+(a.n-a.nt))+metric('有效模型',rows.filter(([,v])=>!v.error).length+' / 4');details='<p id="regInsight">'+rows.filter(([,v])=>!v.error).map(([name,v])=>name+' '+s.metric.toUpperCase()+' '+pct(v.test[s.metric])).join('；')+'。这仅是当前样本划分的结果，不能推广为某模型普遍更优。</p>'+table(['模型','训练RMSE','测试RMSE','测试MAE','复杂度'],rows.map(([name,v])=>v.error?[name,'失败',v.error,'—','—']:[name,pct(v.train.rmse),pct(v.test.rmse),pct(v.test.mae),fmt(name==='Ridge'?v.edf:name==='Lasso'?v.nonzero:name==='Stepwise'?a.step.ids.length:v.rank-1)]))+'<p>OLS/Stepwise复杂度=可估计斜率数；Ridge=有效自由度（含截距）；Lasso=活跃斜率数。Ridge/Lasso只用训练内部时间验证选λ；Stepwise仅训练选择。'+(confirmed.predictive?'测试目标日期均在训练之后。':'当前为同期解释，不得把留出段表现称为严格未来预测。')+'反复看测试结果再改模型，会削弱独立评价意义。</p>';}
$('#details').innerHTML=details+'<details id="regTasks"><summary>约10分钟课堂任务（可选）</summary><p>① 调相关程度0.3→0.98，比较系数区间和VIF（3分钟）。② 切换Stepwise三种方向，记录最终变量和AIC变化（3分钟）。③ 调Lasso λ，找出何时出现零系数，再看四模型测试误差（4分钟）。无需答题解锁。</p><p>记录能否独立完成、耗时、图表/参数困惑、完整R运行是否成功。真实学生验证待进行。</p></details>';renderCode();}
function renderCode(){if(!built)return;let row=0;const scroll=$('#code').scrollTop;$('#code').innerHTML=built.blocks.map(b=>{const lines=b.lines.map(line=>({line,n:++row}));const selectedLine=focus??(b.key===selected?(lines.find(v=>!v.line.trim().startsWith('#')&&v.line.trim())?.n):null);if(codeMode==='basic'&&['data','functions'].includes(b.key))return'';return'<div class="logic-block">'+lines.map(({line,n})=>`<button class="code-line ${selected===b.key&&n===selectedLine?'selected':''}" data-reg-code="${b.key}" data-line="${n}"><span class="num">${n}</span><code>${WorkbenchUI.colorCode(line)}</code></button>`).join('')+'</div>';}).join('');$('#code').scrollTop=scroll;nav.innerHTML=built.blocks.map(b=>`<button data-reg-jump="${b.key}">${esc(b.title)}</button>`).join('');document.querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===codeMode)));const block=built.blocks.find(b=>b.key===selected)||built.blocks[0];$('#explanation').innerHTML='<h3>'+esc(block.title)+'</h3><p>'+esc(block.explain)+'</p><div id="regFormula"></div><p>当前 '+a.nt+'训练 / '+(a.n-a.nt)+'测试；λ='+fmt(q?.lambda??p.lambda)+'；方向='+s.direction+'。</p>';if(block.formula)katex.render(block.formula,$('#regFormula'),{throwOnError:false});}
function jump(key){selected=key;focus=null;renderCode();const el=$(`[data-reg-code="${key}"]`);if(el)$('#code').scrollTop+=el.getBoundingClientRect().top-$('#code').getBoundingClientRect().top-8;}
nav.onclick=e=>{const b=e.target.closest('[data-reg-jump]');if(b)jump(b.dataset.regJump);};$('#code').onclick=e=>{const b=e.target.closest('[data-reg-code]');if(b){selected=b.dataset.regCode;focus=Number(b.dataset.line);renderCode();}};tabs.onclick=e=>{const b=e.target.closest('[data-reg-view]');if(b){s.view=b.dataset.regView;focus=null;codeMode='full';selected=s.view==='traditional'?'ols':s.view==='regularization'?'regularization':s.view==='opt'||s.view==='econ'?'data':'evaluation';render();}};if(window.LabKit)window.LabKit.onLang(()=>{if(s.view==='opt'||s.view==='econ')render();});
$('#inputs').addEventListener('input',e=>{if(e.target.id==='regLog')$('#reg-lambda').value=10**Number(e.target.value);if(e.target.matches('input'))render();});
document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{codeMode=b.dataset.codeMode;renderCode();});function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),el=document.createElement('a');el.href=url;el.download=name;el.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}$('#copy').onclick=async()=>{if(!valid)return;try{await navigator.clipboard.writeText(built.code);$('#codeNotice').textContent='已复制当前完整独立Base R脚本';}catch{download(built.code,'experiment04-'+s.view+'.R');}};
$('#regFile').onchange=async()=>{try{const f=$('#regFile').files[0];if(!f||f.size>2e6)throw Error('请选择2MB以内CSV');const text=await f.text(),t=M.csvTable(text);pendingFile={text,t};$('#regColumns').innerHTML='<label>日期'+options('regDate',t.names.map(n=>[n,n]),t.names.includes('date')?'date':t.names[0])+'</label><label>目标（必须明确选择）'+options('regTarget',[['','请选择目标'],...t.names.map(n=>[n,n])],'')+'</label><fieldset><legend>解释变量（明确勾选）</legend>'+t.names.map(n=>`<label><input type="checkbox" name="regFeature" value="${esc(n)}">${esc(n)}</label>`).join('')+'</fieldset>';$('#regDataError').textContent='已读取列名，尚未替换确认样本。';}catch(e){pendingFile=null;$('#regDataError').textContent=e.message;}};
$('#regImport').onclick=()=>{try{if(!pendingFile)throw Error('请先选择CSV');const next=M.importCSV(pendingFile.text,{date:$('#regDate').value,target:$('#regTarget').value,features:[...document.querySelectorAll('[name="regFeature"]:checked')].map(x=>x.value),kind:$('#regKind').value,unit:$('#regUnit').value,timing:$('#regTiming').value,missing:$('#regMissing').value});dataset=next;$('#regDataError').textContent='导入成功；'+next.note;render();}catch(e){$('#regDataError').textContent=e.message+' 当前确认样本未替换。';}};$('#regSynthetic').onclick=()=>{dataset=null;render();};$('#regExport').onclick=()=>{if(!confirmed)return;download('target_date,feature_date,target,'+confirmed.names.map(n=>'"'+n.replaceAll('"','""')+'"').join(',')+'\n'+confirmed.y.map((v,i)=>[confirmed.dates[i],confirmed.featureDates[i],v,...confirmed.X[i]].join(',')).join('\n'),'experiment04-confirmed.csv');};$('#reset').onclick=()=>{p={...M.defaults};dataset=null;for(const k in p)$('#reg-'+k).value=p[k];$('#regDataError').textContent='';pendingFile=null;$('#regFile').value='';$('#regColumns').innerHTML='';render();};
function info(title,text){$('#infoTitle').textContent=title;$('#infoBody').textContent=text;ModalUI.open($('#infoDialog'));}for(const id of ['#catalog','#catalogMobile'])$(id).onclick=()=>ModalUI.open($('#catalogDialog'));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>info('实验04 · 自由探索','直接改参数、切换三视图。先观察OLS与VIF，再看AIC选择，最后调Ridge/Lasso并比较同一测试集。点击R代码可看数学说明；无需完成问题解锁。');$('#teacher').onclick=()=>info('约10分钟演示与学生试用','3分钟共线性：rho .3→.98，观察CI/VIF。3分钟AIC：比较三种方向的真实路径。4分钟正则化：调Lasso λ并看四模型比较。真实学生验证待进行。当前127.0.0.1仅本机教师演示，尚无已验证的学生终端网址。');const practice=document.createElement('button');practice.id='rStudioPractice';practice.textContent='RStudio实践';$('.code-toolbar').append(practice);practice.onclick=()=>info('完整R复现','复制完整脚本到干净R Script，全选运行。仅需Base R，不自动安装包。完整当前数据、参数、标准化、时间验证、结果及当前图表均包含。浏览器不运行R。可选glmnet独立核验见交付文档，注意Ridge的y/λ尺度。');$('#projector').onclick=()=>{document.body.classList.toggle('projector');inter.clear();};let share=62;const resize=v=>{share=Math.max(40,Math.min(75,v));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',100-share+'fr');};$('#splitter').onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();resize(share+(e.key==='ArrowDown'?2:-2));}};$('#splitter').onpointerdown=e=>{const el=e.currentTarget,y=e.clientY,start=share,h=$('.code-regions').clientHeight;el.setPointerCapture(e.pointerId);el.onpointermove=e=>resize(start+100*(e.clientY-y)/h);el.onpointerup=()=>el.onpointermove=null;};window.RegLab={snapshot:()=>JSON.parse(JSON.stringify({p,s,data:confirmed,a,q,valid,code:built?.code}))};render();}
window.RegWorkbench={mount};})();

;

/* Source: timeseries-math.js */
/* Experiment 05: shared samples, finite-sample tests and conditional forecasting. */
(function(root, factory) {
  const api = factory(typeof module === 'object' ? require('./reg-math') : root.RegMath);
  if (typeof module === 'object') module.exports = api;
  else root.TimeSeriesMath = api;
})(this, Reg => {
  'use strict';
  const defaults = Object.freeze({seed: 52027, n: 720, ar: .42, cross: .32, noise: .012});
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => sum(a) / a.length;
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  function integer(x, lo, hi, label) {
    if (!Number.isInteger(x) || x < lo || x > hi) throw Error(label + '范围为 ' + lo + '–' + hi + ' 的整数。');
  }
  function random(seed) {
    return () => (seed = seed * 16807 % 2147483647) / 2147483647;
  }
  function generate({seed, n, ar, cross, noise} = defaults) {
    integer(seed, 1, 2147483646, '种子');
    integer(n, 120, 1600, '样本量');
    if (!(Math.abs(ar) <= .75 && Math.abs(cross) <= .75 && noise >= .001 && noise <= .05)) {
      throw Error('要求 |自回归|、|跨变量系数| ≤ 0.75，扰动标准差在 0.001–0.05 之间。');
    }
    const uniform = random(seed);
    const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
    let market = 0, sector = 0, macro = 0;
    const prices = [100, 100, 100], rows = [], dates = [];
    for (let i = -100; i <= n; i++) {
      const next = [.0003 + ar * market, .0003 + .24 * sector + cross * market, .0002 + .55 * macro + .14 * sector];
      [market, sector, macro] = next.map(x => x + noise * normal());
      if (i < 0) continue;
      [market, sector, macro].forEach((r, j) => { prices[j] *= Math.exp(r); });
      rows.push(prices.slice());
      dates.push('t=' + i);
    }
    return {rows, dates, names: ['市场', '行业', '金融因子'], kind: 'price', frequency: '模拟期', synthetic: true, warnings: [], lost: 0};
  }
  function validate(y, minimum = 30) {
    if (y.length < minimum || y.some(x => !Number.isFinite(x))) throw Error('至少需要 ' + minimum + ' 期有效观测。');
    const scale = sd(y);
    if (!Number.isFinite(scale) || scale <= 1e-12 * Math.max(1, Math.abs(mean(y)))) throw Error('常数、近似常数或尺度异常，无法可靠估计。');
  }
  function importData(text, {date, columns, kind, unit, frequency, missing, acceptGaps}) {
    if (text.length > 2e6) throw Error('CSV 限制为 2 MB。');
    const table = Reg.csvTable(text);
    const ids = [date, ...columns].map(name => table.names.indexOf(name));
    if (!columns.length || columns.length > 3 || ids.includes(-1) || new Set(ids).size !== ids.length) {
      throw Error('请明确选择日期和 1–3 个不同的数值列。');
    }
    if (!['price', 'simple', 'log', 'numeric'].includes(kind) || !['decimal', 'percent'].includes(unit) ||
        (unit === 'percent' && !['simple', 'log'].includes(kind))) throw Error('百分数转换仅适用于收益率列。');
    if (!['daily', 'weekly', 'monthly', 'annual', 'observed'].includes(frequency)) throw Error('请选择频率。');
    integer(table.rows.length, 40, 2000, 'CSV 行数');
    const seen = new Set(), warnings = [];
    let lost = 0, outOfOrder = false, previous = '';
    const parsed = [];
    table.rows.forEach((r, i) => {
      const day = r[ids[0]].trim(), instant = Date.parse(day);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(instant) ||
          new Date(instant).toISOString().slice(0, 10) !== day) throw Error('第 ' + (i + 2) + ' 行日期无效，须用 YYYY-MM-DD。');
      if (seen.has(day)) throw Error('重复日期 ' + day + '，请先核对。');
      seen.add(day);
      if (day < previous) outOfOrder = true;
      previous = day;
      const cells = ids.slice(1).map(j => r[j].trim());
      if (cells.some(x => /^(?:NA|N\/A|null)?$/i.test(x))) {
        if (missing !== 'drop') throw Error(day + ' 存在缺失值。可在检查对齐后明确选择删除整行。');
        lost++;
        return;
      }
      const values = cells.map(x => {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(x)) throw Error(day + ' 存在非数值。');
        const v = Number(x) / (unit === 'percent' ? 100 : 1);
        if (!Number.isFinite(v) || (kind === 'price' && v <= 0) || (kind === 'simple' && v < -1)) {
          throw Error(day + ' 数值越界。请核对单位、正价格及简单收益率下限。');
        }
        return v;
      });
      parsed.push({day, values});
    });
    parsed.sort((a, b) => a.day.localeCompare(b.day));
    if (outOfOrder) warnings.push('整行已按日期排序，保留各列同期配对。');
    if (lost) warnings.push('已按选择删除 ' + lost + ' 个缺失日期的整行。');
    const periods = parsed.map(({day}) => ({
      daily: Date.parse(day) / 86400000,
      weekly: Math.floor((Date.parse(day) / 86400000 + 3) / 7),
      monthly: Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)),
      annual: Number(day.slice(0, 4))
    })[frequency]);
    if (frequency !== 'observed' && new Set(periods).size !== periods.length) throw Error('同一声明周期有多行，请核对频率。');
    const gaps = frequency === 'observed' || periods.some((x, i) => i && x - periods[i - 1] !== 1);
    if (gaps && !acceptGaps) throw Error('日期间隔不规则或存在缺期。核对后可确认按相邻观测建模。');
    if (gaps) warnings.push('按相邻观测计期，时间间隔可能不同。跨缺期的价格收益覆盖整个间隔。');
    const rows = parsed.map(x => x.values);
    for (let j = 0; j < columns.length; j++) {
      const y = rows.map(r => r[j]);
      validate(y, 40);
      const m = mean(y), s = sd(y);
      if (y.some(x => Math.abs(x - m) > 8 * s || (['simple', 'log'].includes(kind) && Math.abs(x) > .5))) {
        warnings.push(columns[j] + ' 有极端观测，请核对单位和原数据。观测保留。');
      }
    }
    return {rows, dates: parsed.map(x => x.day), names: columns, kind, frequency, warnings, lost};
  }
  function transform(data, form) {
    if (data.kind !== 'price' || form === 'price') return {...data, form: data.kind};
    if (!['simple', 'log'].includes(form)) throw Error('收益率口径无效。');
    const rows = data.rows.slice(1).map((r, i) => r.map((p, j) => {
      const prev = data.rows[i][j];
      return form === 'simple' ? p / prev - 1 : Math.log(p) - Math.log(prev);
    }));
    return {...data, form, rows, dates: data.dates.slice(1)};
  }

  function regression(X, y) {
    const scales = X[0].map((_, j) => Math.sqrt(mean(X.map(r => r[j] ** 2))));
    if (scales.some(s => !Number.isFinite(s) || s <= 0)) throw Error('设计矩阵退化。');
    const fit = Reg.qr(X.map(r => r.map((v, j) => v / scales[j])), y);
    if (fit.rank !== scales.length || y.length <= fit.rank) throw Error('共线或自由度不足。');
    const coef = fit.coef.map((v, j) => v / scales[j]);
    const fitted = X.map(r => dot(r, coef)), residual = y.map((v, i) => v - fitted[i]);
    const rss = dot(residual, residual), df = y.length - fit.rank;
    // Diagonal of (X'X)^-1 via R^-1 and the QR pivot permutation.
    const inverse = scales.map((_, j) => fit.back(scales.map((_, i) => +(i === j))));
    const se = scales.map((s, j) => {
      const k = fit.perm.indexOf(j);
      return Math.sqrt(rss / df * sum(inverse.map(c => c[k] ** 2))) / s;
    });
    return {coef, residual, fitted, rss, df, se};
  }
  function correlogram(y, lag = 24) {
    validate(y, 10);
    lag = Math.min(lag, y.length - 1);
    const m = mean(y), a = y.map(v => v - m), den = dot(a, a);
    const acf = Array.from({length: lag + 1}, (_, k) => dot(a.slice(k), a) / den);
    const pacf = [1];
    let phi = [], variance = 1;
    for (let k = 1; k <= lag; k++) {
      const v = (acf[k] - dot(phi, acf.slice(1, k).reverse())) / variance;
      phi = phi.map((x, i) => x - v * phi[k - 2 - i]).concat(v);
      variance *= 1 - v * v;
      pacf.push(v);
    }
    return {acf, pacf, band: 1.96 / Math.sqrt(y.length)};
  }
  // urca::ur.df tau critical values, indexed by length of the first difference.
  const adfCritical = {
    none: [-1.95, -1.95, -1.95, -1.95, -1.95],
    drift: [-2.93, -2.89, -2.88, -2.87, -2.86],
    trend: [-3.50, -3.45, -3.43, -3.42, -3.41]
  };
  function stationarity(y, type, lag, trend) {
    validate(y);
    integer(lag, 0, 12, 'ADF 滞后');
    if (!Object.hasOwn(adfCritical, type)) throw Error('ADF 设定无效。');
    const d = y.slice(1).map((v, i) => v - y[i]), Y = d.slice(lag);
    const X = Y.map((_, i) => {
      const t = i + lag;
      return [y[t], ...(type === 'none' ? [] : [1]), ...(type === 'trend' ? [t + 1] : []),
        ...Array.from({length: lag}, (_, j) => d[t - j - 1])];
    });
    const fit = regression(X, Y);
    if (!(fit.se[0] > 0)) throw Error('ADF 回归残差方差退化。');
    const tau = fit.coef[0] / fit.se[0];
    const critical = adfCritical[type][[50, 100, 250, 500].filter(n => d.length >= n).length];
    const n = y.length, bw = Math.floor(4 * (n / 100) ** .25);
    const e = regression(y.map((_, i) => trend ? [1, i + 1] : [1]), y).residual;
    let lrv = dot(e, e) / n, partial = 0, numerator = 0;
    for (let k = 1; k <= bw; k++) lrv += 2 * (1 - k / (bw + 1)) * dot(e.slice(k), e) / n;
    for (const v of e) { partial += v; numerator += partial ** 2; }
    if (!(lrv > dot(y, y) / n * Number.EPSILON ** 2)) throw Error('KPSS 长期方差退化。');
    const kpss = numerator / n ** 2 / lrv, kCritical = trend ? .146 : .463;
    return {tau, critical, kpss, kCritical, bw, adfReject: tau < critical, kpssReject: kpss > kCritical};
  }

  function reflection(raw) {
    let a = [];
    for (const z of raw) {
      const k = .995 * Math.tanh(z);
      a = a.map((v, j) => v - k * a[a.length - 1 - j]).concat(k);
    }
    return a;
  }
  function residuals(y, mu, ar, ma, burn) {
    const e = Array(y.length).fill(0);
    for (let t = burn; t < y.length; t++) {
      let v = y[t] - mu;
      for (let j = 0; j < ar.length; j++) v -= ar[j] * (y[t - j - 1] - mu);
      for (let j = 0; j < ma.length && t - j - 1 >= burn; j++) v -= ma[j] * e[t - j - 1];
      e[t] = v;
    }
    return e;
  }
  function optimize(fn, start) {
    let x = start.slice(), f = fn(x), H = x.map((_, i) => x.map((__, j) => +(i === j)));
    const gradient = v => v.map((z, i) => {
      const d = 1e-5 * Math.max(1, Math.abs(z)), a = v.slice(), b = v.slice();
      a[i] += d; b[i] -= d;
      return (fn(a) - fn(b)) / (2 * d);
    });
    let g = gradient(x);
    for (let it = 0; it < 220; it++) {
      if (Math.max(...g.map(Math.abs)) < 2e-7) return {x, f, it};
      let d = H.map(r => -dot(r, g)), slope = dot(d, g);
      if (!(slope < 0)) { d = g.map(v => -v); slope = -dot(g, g); }
      let step = 1, next, value;
      while (step > 1e-11) {
        next = x.map((v, j) => v + step * d[j]);
        value = fn(next);
        if (Number.isFinite(value) && value <= f + 1e-4 * step * slope) break;
        step /= 2;
      }
      if (step <= 1e-11) return null;
      const ng = gradient(next), s = next.map((v, j) => v - x[j]), y = ng.map((v, j) => v - g[j]);
      const sy = dot(s, y), Hy = H.map(r => dot(r, y));
      if (sy > 1e-16) {
        const factor = (1 + dot(y, Hy) / sy) / sy;
        H = H.map((r, i) => r.map((v, j) => v + factor * s[i] * s[j] - (Hy[i] * s[j] + s[i] * Hy[j]) / sy));
      }
      x = next; g = ng; f = value;
    }
    return null;
  }
  function arma(y, p, q, burn = 5) {
    integer(p, 0, 5, 'AR 阶数'); integer(q, 0, 5, 'MA 阶数');
    validate(y, Math.max(30, burn + 5 * (p + q + 2)));
    const m = mean(y), s = sd(y), z = y.map(v => (v - m) / s), n = y.length - burn;
    function profile(x) {
      const ar = reflection(x.slice(0, p)), ma = reflection(x.slice(p)).map(v => -v);
      const e = residuals(z, 0, ar, ma, burn);
      // e(mu) = e(0) - mu * sensitivity, so the conditional mean has an exact least-squares solution.
      const sensitivity = Array(z.length).fill(0);
      const constant = 1 - sum(ar);
      for (let t = burn; t < z.length; t++) {
        let v = constant;
        for (let j = 0; j < q && t - j - 1 >= burn; j++) v -= ma[j] * sensitivity[t - j - 1];
        sensitivity[t] = v;
      }
      const center = dot(e,sensitivity) / dot(sensitivity,sensitivity);
      const f = sum(e.map((v,i) => (v - center * sensitivity[i]) ** 2)) / n;
      return {center, ar, ma, f};
    }
    const start = Array(p + q).fill(0);
    const second = start.map((_, i) => i === 0 ? .4 : 0);
    let attempts;
    if (p === 1 && q === 0) {
      // With no MA recursion this is the bounded intercept-and-slope least-squares solution.
      const lagged = z.slice(burn-1,-1), response = z.slice(burn);
      const a = mean(lagged), b = mean(response), centered = lagged.map(v=>v-a);
      const slope = dot(centered,response.map(v=>v-b)) / dot(centered,centered);
      const x = [Math.atanh(Math.max(-1+1e-12,Math.min(1-1e-12,slope/.995)))];
      attempts = [{x,f:profile(x).f,it:0}];
    } else {
      attempts = start.length
        ? [start, second].map(x => optimize(v => profile(v).f, x)).filter(Boolean).sort((a,b) => a.f-b.f)
        : [{x:start, f:profile(start).f, it:0}];
    }
    if (!attempts.length || !Number.isFinite(attempts[0].f) || attempts[0].f <= 1e-14) {
      throw Error('ARMA 未收敛或创新方差退化。可降低阶数。');
    }
    const {x, f, it} = attempts[0], {center, ar, ma} = profile(x);
    const mu = m + s * center, sigma2 = f * s ** 2, logLik = -n / 2 * (Math.log(2 * Math.PI * sigma2) + 1);
    const k = p + q + 2;
    return {p, q, burn, mu, ar, ma, sigma2, logLik, it, boundary: x.some(v => Math.abs(v) > 3),
      residual: residuals(y, mu, ar, ma, burn), AIC: -2 * logLik + 2 * k,
      AICc: -2 * logLik + 2 * k + 2 * k * (k + 1) / (n - k - 1), BIC: -2 * logLik + Math.log(n) * k};
  }
  function selectARMA(y, options, grid) {
    const {p, q, armaMode, armaIC} = options;
    if (!grid && armaMode === 'manual') return {fit: arma(y, p, q), candidates: []};
    const candidates = [];
    let best = null, manual = null;
    for (let i = 0; i <= 3; i++) for (let j = 0; j <= 3; j++) {
      try {
        const f = arma(y, i, j);
        const {AIC, AICc, BIC} = f;
        candidates.push({p: i, q: j, AIC, AICc, BIC});
        if (!best || f[armaIC] < best[armaIC]) best = f;
        if (i === p && j === q) manual = f;
      } catch (e) { candidates.push({p: i, q: j, error: e.message}); }
    }
    const fit = armaMode === 'auto' ? best : manual || arma(y, p, q);
    if (!fit) throw Error('没有有效的 ARMA 候选模型。');
    return {fit, candidates};
  }
  function armaNext(y, e, t, fit) {
    let v = fit.mu;
    for (let j = 0; j < fit.ar.length; j++) v += fit.ar[j] * (y[t - j - 1] - fit.mu);
    for (let j = 0; j < fit.ma.length; j++) v += fit.ma[j] * e[t - j - 1];
    return v;
  }
  function forecastARMA(y, fit, horizon) {
    const history = y.slice(), e = fit.residual.slice(), psi = [1];
    let variance = 0;
    return Array.from({length: horizon}, (_, i) => {
      const value = armaNext(history, e, history.length, fit);
      history.push(value); e.push(0);
      if (i) psi.push((fit.ma[i - 1] || 0) + sum(fit.ar.map((v, j) => v * (psi[i - j - 1] || 0))));
      variance += fit.sigma2 * psi[i] ** 2;
      const s = Math.sqrt(variance);
      return {value, lo80: value - 1.281551565545 * s, hi80: value + 1.281551565545 * s,
        lo95: value - 1.95996398454 * s, hi95: value + 1.95996398454 * s};
    });
  }
  function chiTail(stat, df) {
    const x = stat / 2;
    if (x === 0) return 1;
    let p = Math.exp(-x), a = 1;
    if (df % 2) {
      // Chi-square(1) survival: regularized gamma(1/2, x).
      const z = Math.sqrt(x), t = 1 / (1 + .3275911 * z);
      p = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x);
      a = .5;
    }
    let term = a === .5 ? 2 * Math.sqrt(x / Math.PI) * Math.exp(-x) : x * Math.exp(-x);
    for (; a < df / 2; a++) { p += term; term *= x / (a + 1); }
    return Math.min(1, p);
  }
  function ljung(fit, lag) {
    const e = fit.residual.slice(fit.burn), df = lag - fit.p - fit.q;
    if (df <= 0 || lag >= e.length) return {df, p: null, Q: null};
    const {acf} = correlogram(e, lag), n = e.length;
    const Q = n * (n + 2) * sum(acf.slice(1).map((r, j) => r ** 2 / (n - j - 1)));
    return {df, Q, p: chiTail(Q, df)};
  }

  const varDesign = (rows, t, p) => [1, ...rows.slice(t - p, t).reverse().flat()];
  function logDet(cov) {
    const L = cov.map(r => r.map(() => 0));
    for (let i = 0; i < cov.length; i++) for (let j = 0; j <= i; j++) {
      const v = cov[i][j] - dot(L[i].slice(0,j), L[j].slice(0,j));
      if (i === j && !(v > cov[i][i] * 1e-10 && v > 0)) throw Error('VAR 残差协方差退化。');
      L[i][j] = i === j ? Math.sqrt(v) : v / L[j][j];
    }
    return 2 * sum(L.map((r, j) => Math.log(r[j])));
  }
  function varFit(rows, p, start = p) {
    integer(p, 1, 5, 'VAR 滞后');
    const m = rows[0].length, n = rows.length - start, k = 1 + m * p;
    if (m < 2 || m > 3 || n < Math.max(30, 3 * k)) throw Error('VAR 需要 2–3 个变量及充足观测。');
    rows[0].forEach((_, j) => validate(rows.map(r => r[j])));
    const X = rows.slice(start).map((_, i) => varDesign(rows, i + start, p));
    const fits = rows[0].map((_, j) => regression(X, rows.slice(start).map(r => r[j])));
    const cov = fits.map(a => fits.map(b => dot(a.residual, b.residual) / n));
    const ld = logDet(cov);
    return {p, m, n, X, start, fits, cov, coef: fits.map(f => f.coef),
      AIC: ld + 2 * m * k / n, BIC: ld + Math.log(n) * m * k / n, HQ: ld + 2 * Math.log(Math.log(n)) * m * k / n};
  }
  function selectVAR(rows, {varMode, varLag, varIC}, grid = false) {
    if (!grid && varMode === 'manual') return {fit: varFit(rows, varLag), candidates: []};
    const candidates = [];
    let best;
    for (let p = 1; p <= 5; p++) {
      try {
        const {AIC, BIC, HQ} = varFit(rows, p, 5), c = {p, AIC, BIC, HQ};
        candidates.push(c);
        if (!best || c[varIC] < best[varIC]) best = c;
      } catch (e) { candidates.push({p, error: e.message}); }
    }
    if (varMode === 'auto' && !best) throw Error('没有有效的 VAR 候选模型。');
    return {fit: varFit(rows, varMode === 'auto' ? best.p : varLag), candidates};
  }
  function varNext(rows, t, fit) {
    const X = varDesign(rows, t, fit.p);
    return fit.coef.map(c => dot(X, c));
  }
  function forecastVAR(rows, fit, horizon) {
    const history = rows.slice();
    return Array.from({length: horizon}, () => {
      const next = varNext(history, history.length, fit);
      history.push(next);
      return next;
    });
  }
  function roots(fit) {
    const {coef, m, p} = fit, d = m * p;
    const A = coef.map(c => c.slice(1));
    for (let i = m; i < d; i++) A.push(Array.from({length:d}, (_, j) => +(j === i-m)));
    // Faddeev–LeVerrier characteristic coefficients of the companion matrix.
    const I = A.map((r,i) => r.map((_,j) => +(i === j)));
    let B = I, poly = [1];
    for (let k = 1; k <= d; k++) {
      const C = A.map(r => r.map((_, j) => r.reduce((s,v,i) => s+v*B[i][j],0)));
      const c = -sum(C.map((r,i) => r[i])) / k;
      poly.push(c);
      B = C.map((r,i) => r.map((v,j) => v + c*I[i][j]));
    }
    const zero = [];
    while (poly.length > 1 && poly.at(-1) === 0) { poly.pop(); zero.push({re:0, im:0, abs:0}); }
    const n = poly.length - 1, radius = Math.max(1, ...poly.slice(1).map((x,i) => 2 * Math.abs(x) ** (1/(i+1))));
    let z = Array.from({length:n}, (_, i) => [radius * Math.cos((i+.3)*2*Math.PI/n), radius * Math.sin((i+.3)*2*Math.PI/n)]);
    for (let step = 0; step < 350 && n; step++) {
      let delta = 0;
      z = z.map(([x,y], i) => {
        let u = 1, v = 0, a = 1, b = 0;
        for (const c of poly.slice(1)) [u,v] = [u*x-v*y+c,u*y+v*x];
        z.forEach(([r,s],j) => { if (i !== j) [a,b] = [a*(x-r)-b*(y-s), a*(y-s)+b*(x-r)]; });
        const den = a*a+b*b, dx = (u*a+v*b)/den, dy = (v*a-u*b)/den;
        delta = Math.max(delta, Math.hypot(dx,dy));
        return [x-dx,y-dy];
      });
      if (delta < 1e-9) return zero.concat(z.map(([re,im]) => ({re,im,abs:Math.hypot(re,im)})));
    }
    if (!n) return zero;
    throw Error('伴随矩阵特征根求解未收敛。');
  }
  /* Orthogonalised IRF/FEVD: Cholesky order is the column order of the VAR.
     Theta_h = sum_l A_l Theta_{h-l}, response to shock j = Theta_h P e_j. */
  function chol(cov) {
    const m = cov.length, L = Array.from({length:m}, () => Array(m).fill(0));
    for (let i = 0; i < m; i++) for (let j = 0; j <= i; j++) {
      let s = cov[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (!(s > 0)) throw Error('VAR 残差协方差不是正定矩阵，无法作 Cholesky 正交化。'); L[i][j] = Math.sqrt(s); }
      else L[i][j] = s / L[j][j];
    }
    return L;
  }
  function theta(fit, horizon) {
    integer(horizon, 1, 40, 'IRF 期数');
    const {p, m} = fit;
    const A = Array.from({length:p}, (_, l) => Array.from({length:m}, (_, i) => Array.from({length:m}, (_, k) => fit.coef[i][1 + l*m + k])));
    const out = [Array.from({length:m}, (_, i) => Array.from({length:m}, (_, j) => +(i === j)))];
    for (let h = 1; h <= horizon; h++) {
      const M = Array.from({length:m}, () => Array(m).fill(0));
      for (let l = 1; l <= Math.min(p, h); l++) {
        const Al = A[l-1], Th = out[h-l];
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
          let s = 0;
          for (let k = 0; k < m; k++) s += Al[i][k] * Th[k][j];
          M[i][j] += s;
        }
      }
      out.push(M);
    }
    return out;
  }
  function irf(fit, {horizon = 12} = {}) {
    const T = theta(fit, horizon), L = chol(fit.cov), m = fit.m;
    const response = Array.from({length:m}, (_, j) => T.map(Th => Array.from({length:m}, (_, i) => {
      let s = 0;
      for (let k = 0; k <= j; k++) s += Th[i][k] * L[k][j];
      return s;
    })));
    return {horizon, m, chol:L, response, theta:T};
  }
  function fevd(fit, {horizon = 12} = {}) {
    const {response, m} = irf(fit, {horizon});
    const series = Array.from({length:m}, (_, i) => Array.from({length:m}, (_, j) => {
      const out = [];
      for (let h = 0; h <= horizon; h++) {
        let num = 0, den = 0;
        for (let l = 0; l <= h; l++) {
          num += response[j][l][i] ** 2;
          for (let k = 0; k < m; k++) den += response[k][l][i] ** 2;
        }
        out.push(den > 0 ? num / den : NaN);
      }
      return out;
    }));
    return {horizon, m, series, share:series.map(row => row.map(s => s[horizon]))};
  }
  function granger(rows, fit, from, to) {
    if (from === to || !fit.fits[to] || from < 0 || from >= fit.m) throw Error('请选择不同的检验方向。');
    const {p,m,X,start} = fit, full = fit.fits[to];
    const reduced = regression(X.map(r => r.filter((_, j) => j === 0 || (j-1) % m !== from)),
      rows.slice(start).map(r => r[to]));
    const F = Math.max(0, (reduced.rss - full.rss) / p) / (full.rss / full.df);
    return {F, df1:p, df2:full.df, p: fTail(F,p,full.df)};
  }
  function fTail(F, d1, d2) {
    const z = d2 / (d2 + d1 * F), a = d2/2, b = d1/2;
    // Lanczos log-gamma and modified Lentz incomplete beta continued fraction.
    function lg(x) {
      if (x < 1) return lg(x+1)-Math.log(x);
      const coefficients = [676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,
        12.507343278686905,-.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
      const t = x+6.5;
      return .5*Math.log(2*Math.PI)+(x-.5)*Math.log(t)-t+Math.log(.9999999999998099+
        sum(coefficients.map((v,i) => v/(x+i))));
    }
    function beta(x, p, q) {
      if (x <= 0 || x >= 1) return x;
      if (x > (p+1)/(p+q+2)) return 1-beta(1-x,q,p);
      let c = 1, d = 1/(1-(p+q)*x/(p+1)), h = d;
      const safe = y => Math.abs(y)<1e-300 ? 1e-300 : y;
      for (let j=1; j<=300; j++) {
        const k = p+2*j;
        const coeffs = [j*(q-j)*x/((k-1)*k), -(p+j)*(p+q+j)*x/(k*(k+1))];
        let delta;
        for (const coeff of coeffs) {
          d = 1/safe(1+coeff*d); c = safe(1+coeff/c); delta = c*d; h *= delta;
        }
        if (Math.abs(delta-1)<3e-14) break;
      }
      return h/p*Math.exp(lg(p+q)-lg(p)-lg(q)+p*Math.log(x)+q*Math.log1p(-x));
    }
    return Math.max(0, Math.min(1, beta(z,a,b)));
  }
  function split(n, train = .7, valid = .15) {
    // Round away floating point error at exact percentage cut points.
    const nt = Math.floor(n*train+1e-10), nv = Math.floor(n*(train+valid)+1e-10);
    if (!(nt >= 30 && nv-nt >= 5 && n-nv >= 5)) throw Error('划分需至少 30 期训练、5 期验证、5 期测试。');
    return {nt, nv};
  }
  function compare(rows, target, vars, options) {
    const {nt,nv} = split(rows.length,options.train,options.valid);
    const y = rows.map(r => r[target]), mult = rows.map(r => vars.map(j => r[j]));
    const actual = y.slice(nv), models = {};
    function model(name, fn) {
      try {
        const prediction = fn();
        if (prediction.length !== actual.length || prediction.some(v => !Number.isFinite(v))) throw Error('预测日期未完整对齐。');
        models[name] = {...Reg.metrics(actual,prediction), prediction};
      } catch (e) { models[name] = {error:e.message}; }
    }
    let armaModel, varModel;
    model('Naive', () => y.slice(nv-1,-1));
    model('ARMA', () => {
      armaModel = selectARMA(y.slice(0,nt),options).fit;
      const e = residuals(y,armaModel.mu,armaModel.ar,armaModel.ma,armaModel.burn);
      return actual.map((_,i) => armaNext(y,e,nv+i,armaModel));
    });
    model('VAR', () => {
      const j = vars.indexOf(target);
      if (j < 0 || vars.length < 2) throw Error('VAR 比较需要含目标列的 2–3 个变量。');
      varModel = selectVAR(mult.slice(0,nt),options).fit;
      return actual.map((_,i) => varNext(mult,nv+i,varModel)[j]);
    });
    return {nt,nv,actual,models,armaModel,varModel};
  }
  return {defaults, random, generate, validate, importData, transform, correlogram, stationarity,
    arma, selectARMA, forecastARMA, ljung, varFit, selectVAR, forecastVAR, roots, granger, chol, theta, irf, fevd, split, compare};
});

;

/* Source: timeseries-lstm.js */
/* One-layer LSTM, full backpropagation through each input window, linear readout. */
(function(root, factory) {
  const api = factory(typeof module === 'object' ? require('./timeseries-math') : root.TimeSeriesMath);
  if (typeof module === 'object') module.exports = api;
  else root.TimeSeriesLSTM = api;
})(this, M => {
  'use strict';
  const config = Object.freeze({window:12, hidden:8, epochs:40, patience:6, batch:32, rate:.008, seed:731});
  function forward(weights, input, H) {
    const D = input[0].length, stride = D+H+1, offset = 4*H*stride;
    let h = Array(H).fill(0), c = h.slice();
    const states = [];
    const sigmoid = z => 1/(1+Math.exp(-z));
    for (const x of input) {
      const z = [1,...x,...h], gates = Array(4*H);
      for (let i=0; i<gates.length; i++) {
        let v = 0;
        for (let j=0; j<stride; j++) v += weights[i*stride+j]*z[j];
        gates[i] = i>=3*H ? Math.tanh(v) : sigmoid(v);
      }
      const previous = c;
      c = c.map((v,i) => gates[H+i]*v+gates[i]*gates[3*H+i]);
      h = c.map((v,i) => gates[2*H+i]*Math.tanh(v));
      states.push({z,gates,previous,c});
    }
    return {value:h.reduce((s,v,i)=>s+v*weights[offset+i+1],weights[offset]),h,states};
  }
  function gradient(weights, input, H, actual, result = new Float64Array(weights.length)) {
    const D = input[0].length, stride = D+H+1, offset = 4*H*stride;
    const {value,h,states} = forward(weights,input,H);
    const error = value-actual;
    result[offset] += error;
    let dh = h.map((v,i) => {
      result[offset+i+1] += error*v;
      return error*weights[offset+i+1];
    });
    let dc = Array(H).fill(0);
    for (let t=states.length-1; t>=0; t--) {
      const {z,gates:g,previous,c} = states[t], dg = Array(4*H), next = Array(H).fill(0);
      for (let i=0; i<H; i++) {
        const f=g[H+i], o=g[2*H+i], a=g[3*H+i], u=g[i], tc=Math.tanh(c[i]);
        const memory = dc[i]+dh[i]*o*(1-tc*tc);
        dg[i] = memory*a*u*(1-u);
        dg[H+i] = memory*previous[i]*f*(1-f);
        dg[2*H+i] = dh[i]*tc*o*(1-o);
        dg[3*H+i] = memory*u*(1-a*a);
        dc[i] = memory*f;
      }
      for (let i=0; i<dg.length; i++) {
        for (let j=0; j<stride; j++) result[i*stride+j] += dg[i]*z[j];
        for (let j=0; j<H; j++) next[j] += weights[i*stride+1+D+j]*dg[i];
      }
      dh = next;
    }
    return {loss:error*error/2, gradient:result};
  }
  function training(rows, {target, features, nt, nv, ...settings}, progress = () => {}) {
    const opt = {...config,...settings};
    const {hidden:H, window:W, epochs, patience, batch, rate, seed} = opt;
    if (!Number.isInteger(W) || W < 4 || W > 32 || !Number.isInteger(H) || H < 4 || H > 16 ||
        !Number.isInteger(epochs) || epochs < 1 || epochs > 80 || !features.length ||
        new Set(features).size !== features.length || features.some(j => !rows[0].hasOwnProperty(j)) ||
        nt-W < 20 || nv-nt < 5) throw Error('LSTM 需要有效输入列及至少 20 个训练窗口、5 个验证窗口。');
    const columns = [...features,target];
    const values = columns.map(j => rows.slice(0,nt).map(r=>r[j]));
    const center = values.map(a => a.reduce((s,v)=>s+v,0)/nt);
    const scale = values.map((a,j)=>Math.sqrt(a.reduce((s,v)=>s+(v-center[j])**2,0)/nt));
    if (scale.some(s=>!Number.isFinite(s)||s<=1e-12)) throw Error('LSTM 训练列方差不足，无法标准化。');
    const D = features.length, stride = D+H+1, offset = 4*H*stride, random = M.random(seed);
    const input = rows.slice(0,nv).map(r=>features.map((j,i)=>(r[j]-center[i])/scale[i]));
    const y = rows.slice(0,nv).map(r=>(r[target]-center[D])/scale[D]);
    const w = Float64Array.from({length:offset+H+1}, (_, i) =>
      i < offset && i%stride===0 ? +(i/stride>=H && i/stride<2*H) : (2*random()-1)*Math.sqrt(6/(D+2*H)));
    const m = new Float64Array(w.length), v = new Float64Array(w.length), curve = [];
    const ids = Array.from({length:nt-W}, (_,i)=>W+i);
    const error = (start,end) => {
      let mse = 0;
      for (let t=start; t<end; t++) mse += (forward(w,input.slice(t-W,t),H).value-y[t])**2;
      return mse/(end-start);
    };
    let best, bestLoss = Infinity, bestEpoch = 0, step = 0;
    for (let epoch=1; epoch<=epochs; epoch++) {
      // Shuffle only windows with targets strictly inside the training period.
      for (let i=ids.length-1; i>0; i--) {
        const j=Math.floor(random()*(i+1));
        [ids[i],ids[j]]=[ids[j],ids[i]];
      }
      for (let start=0; start<ids.length; start+=batch) {
        const g = new Float64Array(w.length), end=Math.min(start+batch,ids.length);
        for (let i=start; i<end; i++) {
          const t=ids[i];
          gradient(w,input.slice(t-W,t),H,y[t],g);
        }
        step++;
        for (let i=0; i<w.length; i++) {
          const value=Math.max(-1,Math.min(1,g[i]/(end-start)));
          m[i]=.9*m[i]+.1*value;
          v[i]=.999*v[i]+.001*value*value;
          w[i]-=rate*(m[i]/(1-.9**step))/(Math.sqrt(v[i]/(1-.999**step))+1e-8);
        }
      }
      const validation=error(nt,nv), train=error(W,nt);
      if (!Number.isFinite(validation) || !Number.isFinite(train)) throw Error('LSTM 优化产生非有限损失。');
      const entry={epoch,train,validation};
      curve.push(entry); progress(entry);
      if (validation < bestLoss-1e-6) { best=Array.from(w); bestLoss=validation; bestEpoch=epoch; }
      if (epoch-bestEpoch>=patience) break;
    }
    return {version:'exp05-lstm-1', optimizer:'Adam', target, features, nt, nv, ...opt, bestEpoch, curve, center, scale, weights:best};
  }
  function predict(rows, t, model) {
    const {window:W,hidden:H,features,center,scale,weights} = model, D=features.length;
    if (t<W || t>rows.length) throw Error('LSTM 输入窗口超界。');
    const input=rows.slice(t-W,t).map(r=>features.map((j,i)=>(r[j]-center[i])/scale[i]));
    return center[D]+scale[D]*forward(weights,input,H).value;
  }
  return {config, forward, gradient, training, predict};
});

;

/* Source: timeseries-weights.js */
/* Reproduce with tools/train-experiment05.cjs. Only training/validation rows used. */
window.TimeSeriesWeights = {"version":"exp05-lstm-1","optimizer":"Adam","target":0,"features":[0,1],"nt":504,"nv":612,"window":12,"hidden":8,"epochs":40,"patience":6,"batch":32,"rate":0.008,"seed":731,"bestEpoch":10,"curve":[{"epoch":1,"train":0.8649060328459798,"validation":1.3254018668098237},{"epoch":2,"train":0.8195373345856072,"validation":1.2513108927829795},{"epoch":3,"train":0.7894468908444013,"validation":1.1811471047900641},{"epoch":4,"train":0.7689688599638549,"validation":1.1517393747368112},{"epoch":5,"train":0.7583302488322365,"validation":1.1146363293531245},{"epoch":6,"train":0.7479182479572763,"validation":1.1036295853014706},{"epoch":7,"train":0.7403178500516827,"validation":1.0810687718193825},{"epoch":8,"train":0.7329136567479647,"validation":1.1092646128205133},{"epoch":9,"train":0.7234146888238384,"validation":1.0811632111674545},{"epoch":10,"train":0.7137270238928505,"validation":1.0716748455984848},{"epoch":11,"train":0.7043172051455298,"validation":1.1054359190347764},{"epoch":12,"train":0.6977124407222313,"validation":1.1263398313758142},{"epoch":13,"train":0.689610304835897,"validation":1.149300999235749},{"epoch":14,"train":0.6840827880640734,"validation":1.1851136018893011},{"epoch":15,"train":0.6821876489133136,"validation":1.156108529050856},{"epoch":16,"train":0.6842065214259337,"validation":1.2781485180695764}],"center":[-0.00036932056142824886,-0.00041858548378822684,-0.00036932056142824886],"scale":[0.013848516515659673,0.01332857081541683,0.013848516515659673],"weights":[0.2755632258309048,-0.8257328101915932,-0.36462645530287136,-0.03254162490316104,-0.5924233361948041,-0.36095138542814686,-0.7128858357841409,-0.27867973993120587,-0.5269995760138245,0.3413196857418373,0.09860333388980458,0.04711426680333782,0.027274392518826227,0.14477039863357197,0.10046789558550648,-0.2941177662053294,-0.45259899266820347,-0.33668195822311625,0.1267249462067577,0.1249311735591985,-0.22155998626734638,0.3807760844390064,0.39497263798273713,-0.5456233426328218,-0.469189768614391,0.4520326469317426,-0.5572679766229788,-0.23823448839824216,-0.4905491350859351,-0.38951517403406266,-0.8675902778885827,-0.32244769908045173,0.1441333130357008,0.14417498851995075,-0.12721503484433386,-0.3458765401390411,0.5424079230287695,-0.05263646000493612,-0.20389678138845554,0.30198197685068034,-0.1203105910785418,0.589645382537422,0.2095381533735201,-0.484048054590486,-0.061196385221377235,0.09139684191936184,-0.4824553510363291,-0.0633864363339618,0.3035340313720796,-0.3036378878490044,0.07635626512402394,-0.04519638185927894,0.07660992020172072,-0.6986323891957564,-0.377167182220315,0.05120513196780019,-0.03827498631174121,-0.2249471548850125,0.4923208758602622,0.4869405797710215,0.14085394045330252,0.1745572395011689,0.26365882888382147,-0.13331701040701008,0.2092291537584015,-0.5307074009294477,0.2350734241330837,-0.016681452246582178,0.3387560862911425,0.10702814499558666,-0.4148915168524429,-0.5599515486526412,-0.2265974013114333,0.014348118434995588,-0.5574871210775623,0.2819841447106361,0.5980286366122147,0.24854098091360494,-0.35171743481471873,0.651257443136298,0.4051829557610137,-0.8188625604917351,0.05701888244863432,0.12243834187337942,0.1286247315421077,0.0610372783764163,0.25445816931642246,-0.12702490206759384,0.9576259600185895,-0.7858852168491884,0.0740339518165562,-0.1071674449382226,-0.3671398125370008,0.2061596010942621,-0.5174329946358344,-0.23576291385282652,-0.21564752274495846,0.2326281217755328,0.19251264663023934,1.0646850463151816,0.13894299808755967,0.6499617075558562,0.2162466721907909,-0.46328609418452105,-0.5158956194318871,-0.2792078390010519,-0.15962169323242636,-0.3459848712833941,0.6554850745651034,0.03263173954031721,0.7494322671551988,0.5579741950589432,-0.7931741153936713,0.2292110856799152,0.0373005449509629,-0.38799471415270687,0.3413719591383395,0.3364224984771323,-0.12907650474702048,0.14711611852463047,-0.7734946333559722,1.1412029093789893,0.07755535754250599,-0.6503012231900754,-0.005645941453223657,-0.7237938744666239,0.08089392454204479,-0.16579224541085738,0.479315773447917,0.2125025748255188,0.27499486624053704,-0.46578122128346117,1.1809220898916408,-0.28274143243235283,-0.018780060790554342,0.005534227565125028,0.2816657721274423,0.1738928766870554,0.7782020415985141,-0.15181987182220996,-0.4556307643580648,-0.7090124472774944,-0.2139194850293832,0.8660641290248124,0.25239200897653796,0.2694111960059471,0.2719664773494728,-0.3379134383603199,-0.5196961958731301,-0.2596808108727878,-0.048835060328795164,0.5162613028653076,-0.03904280026600633,-0.6318727306142528,0.9558164964034448,-0.25169425170150206,0.07900607920556144,-0.02059341599465319,-0.11815056127975555,0.5148355647409474,0.5405049601461388,0.04603970360040973,0.2515426009478428,-0.4089505060390333,-0.15145680502293057,1.0389611760345292,-0.44089616511260066,0.29145364958262826,-0.19541382073369598,-0.45802666067639436,0.4997846212186767,0.7255385685634802,-0.007194908002699558,-0.3973651383407757,-0.16888628583041174,-0.35885480784491003,0.09259004496484387,-1.0254858417603157,-0.38295676392744954,-0.023966494204927823,-0.25605782492029927,-0.08979788522814734,-0.9117295094059036,0.6516805980336446,0.49769178469746167,0.570284582353596,0.47953590208134134,-0.028478471248685203,0.7904420306311357,-0.04126380495533643,0.015583016269169933,0.20666051215880968,0.8035457077660451,-0.2613436123348037,0.6173775789880727,0.3193543100076447,-0.160323242929743,0.26943813184462556,0.3470521165082506,0.03772339826698875,0.4316983235163516,-0.2211427413373132,-0.6665043219769071,-0.23970745181750833,-0.12060017458336894,0.12155929986880872,-0.8407671534698172,0.46594119856823246,-0.10563103532738449,0.026738993705360484,0.002055070663006955,0.36085185164717637,0.6032453303644221,0.04827932001314142,0.2586806636215029,0.5211370037168382,-0.23677172247720607,0.1345149385566484,-0.393205843345571,0.6410990287422865,-0.05334284085186005,0.3297178638745363,-0.3097003276808512,0.2607336349901507,0.2486074127134517,-0.25919621936059223,0.296601953063544,0.1737387909595048,-0.8349512877948605,-0.34126783416049095,0.4178568816833586,-0.031482423243099716,0.6886463903921327,0.4026092747018216,0.3124804433927382,0.024709686088876984,-0.1338452811985272,-0.3488175356542015,-0.08147540006431521,0.1271130440776846,-0.3618035550419427,0.2913891911465374,0.2086344194481399,0.21534729513618034,0.2276654475975775,0.2953645198211156,0.1068429373070062,0.04747025174002757,-0.01210460654805966,-0.5030023743042398,-0.3740291777246303,0.4604689890988008,-0.2859789661488545,0.06208470853771656,1.0979450392255439,0.061123293770072036,0.42427929599638914,0.35409040880245035,0.15588634076623933,-0.09327836960237608,-0.0004422277149474267,-0.44532583155126043,0.1853228154818711,-0.2666622988784661,0.22728258921926822,-0.31682641596439953,-0.06585144977412787,0.40742224735901666,-0.11944571851927019,0.31640910414041246,-0.015074245822774432,-0.16911251632098234,-0.3309101620963704,0.6660729398218939,0.4111391153972872,-0.13510047483155546,-0.18660978321065683,0.09858583582307656,-0.309737968860566,0.26642361762679384,-0.17779653081980368,-0.058859395610047965,0.366893386171986,-0.13284841195749367,-0.6336958238778084,-0.008602058716663847,0.053561694412046626,-0.4836085311936204,0.48309903421057593,-0.5471367095928372,0.1120379376308208,-0.2411680165876798,-0.39149853957712805,-0.23118885910587073,-0.6834041542808837,-0.21394410608694914,-0.1207534308335842,-0.028863020401064643,-0.5924491964266834,0.24744916882384863,0.593902050138683,0.5345227866260821,0.7778057142485258,0.3120258434364905,0.4987065498101441,-0.3557426705424386,0.24512442374967222,-0.3112628640089845,-0.04952809569311889,0.2820809453082235,-0.34025648499405614,-0.3456114730582181,0.3894636795711498,-0.08331727188123803,-0.4744907081524335,0.49983704785509586,-0.28336327673320943,-0.16177213163360443,-0.27798228501417316,-0.06139656191046065,0.08096372658181648,-0.19990639940109156,-0.45859648767844946,0.3808588362599984,0.18923341464956886,-0.33042160708965657,-0.21736682779639957,0.42930398754128934,0.4608476318771726,0.635476849350172,0.08962723439606333,0.7873732271670462,-0.046151166460324876,-0.020704238242497616,-0.4201543527342874,0.0011745724807357405,-0.1893490353233112,0.5742883193833155,-0.338512411672741,0.09528982342716613,0.3676618319258981,0.0966895286378967,0.08472390158041561,0.21049973646126152,0.5895834110143986,0.5741783475155634,0.8708020214927493,0.6534891701911091,0.11733750480540422,-0.214823152445096,0.15893047240152286,0.32761484271799063,-0.027927292867905254,-0.8373801011937325,-0.4334954167373992,-0.8999087542002672,0.4536723159376932,-0.08372004257908436,-0.4739028163889462,0.5985135444604021,0.4449844804162212],"trainingHash":"9024ecbce5cdb9960d8148b49265dfe540318db8cbf22510519578de8281f27f"};

;

/* Source: timeseries-r.js */
/* Base R implementations. Each section is included verbatim in copied scripts. */
(function(root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else root.TimeSeriesR = api;
})(this, () => {
  const source = {
    lstmTrain: `# Teaching-scale LSTM trained in base R: full BPTT, per-sample SGD, fixed seed.
lstm_rng <- function(seed) {
  s <- as.numeric(seed) %% 2147483647
  function() { s <<- (s * 1103515245 + 12345) %% 2147483648; s / 2147483648 }
}
lstm_sig <- function(z) 1 / (1 + exp(-z))
lstm_init <- function(D, H, seed) {
  rng <- lstm_rng(seed); stride <- D + H + 1L
  u <- function(n, a, b) vapply(seq_len(n), function(i) a + (b - a) * rng(), numeric(1))
  lim <- sqrt(6 / (D + 2 * H))
  c(u(4L * H * stride, -lim, lim), u(H + 1L, -0.1, 0.1))
}
# One forward pass over the window. Gate order: input, forget, output, candidate.
lstm_forward <- function(W, X, H) {
  D <- ncol(X); stride <- D + H + 1L; offset <- 4L * H * stride
  h <- numeric(H); cell <- numeric(H); states <- vector("list", nrow(X))
  for (t in seq_len(nrow(X))) {
    z <- c(1, X[t, ], h)
    g <- numeric(4L * H)
    for (i in seq_len(4L * H)) g[i] <- sum(W[((i - 1L) * stride + 1L):(i * stride)] * z)
    g <- ifelse(seq_len(4L * H) > 3L * H, tanh(g), lstm_sig(g))
    previous <- cell
    cell <- g[(H + 1L):(2L * H)] * previous + g[seq_len(H)] * g[(3L * H + 1L):(4L * H)]
    h <- g[(2L * H + 1L):(3L * H)] * tanh(cell)
    states[[t]] <- list(z = z, g = g, previous = previous, cell = cell)
  }
  list(value = W[offset + 1L] + sum(W[(offset + 2L):(offset + H + 1L)] * h), h = h, states = states)
}
# Backpropagation through every step of the window.
lstm_gradient <- function(W, X, H, actual) {
  D <- ncol(X); stride <- D + H + 1L; offset <- 4L * H * stride
  fw <- lstm_forward(W, X, H); error <- fw$value - actual
  grad <- numeric(length(W)); grad[offset + 1L] <- error
  dh <- numeric(H)
  for (i in seq_len(H)) { grad[offset + 1L + i] <- error * fw$h[i]; dh[i] <- error * W[offset + 1L + i] }
  dc <- numeric(H)
  for (t in rev(seq_along(fw$states))) {
    s <- fw$states[[t]]; g <- s$g
    dg <- numeric(4L * H); dn <- numeric(H); dc_next <- numeric(H)
    for (i in seq_len(H)) {
      fe <- g[H + i]; ou <- g[2L * H + i]; ca <- g[3L * H + i]; gate <- g[i]; tc <- tanh(s$cell[i])
      memory <- dc[i] + dh[i] * ou * (1 - tc * tc)
      dg[i] <- memory * ca * gate * (1 - gate)
      dg[H + i] <- memory * s$previous[i] * fe * (1 - fe)
      dg[2L * H + i] <- dh[i] * tc * ou * (1 - ou)
      dg[3L * H + i] <- memory * gate * (1 - ca * ca)
      dc_next[i] <- memory * fe
    }
    for (i in seq_len(4L * H)) {
      idx <- ((i - 1L) * stride + 1L):(i * stride)
      grad[idx] <- grad[idx] + dg[i] * s$z
      bias <- (i - 1L) * stride + 1L + D
      dn <- dn + W[bias + seq_len(H)] * dg[i]
    }
    dh <- dn; dc <- dc_next
  }
  list(gradient = grad, error = error)
}
# Per-sample SGD with gradient clipping; the best epoch is kept.
lstm_train <- function(input, target, H, epochs, rate, seed) {
  W <- lstm_init(ncol(input[[1]]), H, seed); best <- W; best_loss <- Inf
  curve <- numeric(epochs)
  for (epoch in seq_len(epochs)) {
    loss <- 0
    for (t in seq_along(input)) {
      g <- lstm_gradient(W, input[[t]], H, target[t])
      loss <- loss + g$error^2
      nrm <- sqrt(sum(g$gradient^2)); step <- if (nrm > 1) g$gradient / nrm else g$gradient
      W <- W - rate * step
    }
    curve[epoch] <- loss / length(input)
    if (curve[epoch] < best_loss) { best <- W; best_loss <- curve[epoch] }
  }
  list(weights = best, curve = curve, loss = best_loss)
}
`,
    station: `# ADF: H0 is a unit root. The tau test has its own critical values.
adf <- function(y, type, lag) {
  d <- diff(y)
  t <- seq.int(lag + 1L, length(d))
  X <- matrix(y[t], ncol = 1)
  if (type != "none") X <- cbind(X, 1)
  if (type == "trend") X <- cbind(X, t)
  for (j in seq_len(lag)) X <- cbind(X, d[t - j])
  fit <- lm.fit(X, d[t])
  stopifnot(fit$rank == ncol(X), fit$df.residual > 0)
  vc <- chol2inv(qr.R(fit$qr)) * sum(fit$residuals^2) / fit$df.residual
  tau <- fit$coefficients[1] / sqrt(vc[which(fit$qr$pivot == 1), which(fit$qr$pivot == 1)])
  critical <- switch(type, none = rep(-1.95, 5),
    drift = c(-2.93, -2.89, -2.88, -2.87, -2.86),
    trend = c(-3.50, -3.45, -3.43, -3.42, -3.41))
  critical <- critical[1 + sum(length(d) >= c(50, 100, 250, 500))]
  c(tau = unname(tau), critical = critical, reject = unname(tau < critical))
}

# KPSS: H0 is level/trend stationarity. Bartlett/Newey-West long-run variance.
kpss <- function(y, trend) {
  n <- length(y)
  e <- if (trend) residuals(lm(y ~ seq_along(y))) else y - mean(y)
  bw <- floor(4 * (n / 100)^0.25)
  lrv <- sum(e^2) / n
  for (j in seq_len(bw)) {
    lrv <- lrv + 2 * (1 - j / (bw + 1)) * sum(e[(j + 1):n] * e[1:(n-j)]) / n
  }
  statistic <- sum(cumsum(e)^2) / (n^2 * lrv)
  critical <- if (trend) .146 else .463
  c(statistic = statistic, critical = critical, bandwidth = bw, reject = statistic > critical)
}`,
    arma: `# Reflection coefficients with absolute values below one constrain AR and MA.
reflection <- function(z) {
  a <- numeric()
  for (v in z) {
    k <- .995 * tanh(v)
    a <- c(a - k * rev(a), k)
  }
  a
}
arma_residuals <- function(y, mu, ar, ma, burn = 5L) {
  e <- numeric(length(y))
  for (t in seq.int(burn + 1L, length(y))) {
    v <- y[t] - mu
    for (j in seq_along(ar)) v <- v - ar[j] * (y[t-j] - mu)
    for (j in seq_along(ma)) if (t-j > burn) v <- v - ma[j] * e[t-j]
    e[t] <- v
  }
  e
}
# Conditional Gaussian likelihood with the first five innovations initialized at zero.
fit_arma <- function(y, p, q) {
  burn <- 5L
  n <- length(y) - burn
  stopifnot(length(y) >= max(30, burn + 5 * (p + q + 2)))
  m <- mean(y)
  s <- sqrt(mean((y-m)^2))
  stopifnot(s > 1e-12 * max(1, abs(m)))
  z <- (y-m)/s
  ar_id <- seq_len(p)
  ma_id <- p + seq_len(q)
  profile <- function(w) {
    ar <- reflection(w[ar_id]); ma <- -reflection(w[ma_id])
    e <- arma_residuals(z,0,ar,ma,burn)
    # The residual is affine in the mean. Filter its sensitivity with the same MA recursion.
    sensitivity <- numeric(length(z))
    constant <- 1-sum(ar)
    for (t in seq.int(burn+1L,length(z))) {
      v <- constant
      for (j in seq_along(ma)) if (t-j>burn) v <- v-ma[j]*sensitivity[t-j]
      sensitivity[t] <- v
    }
    center <- sum(e*sensitivity)/sum(sensitivity^2)
    list(ar=ar,ma=ma,center=center,value=sum((e-center*sensitivity)^2)/n)
  }
  w <- rep(0,p+q)
  if (p==1L && q==0L) {
    lagged <- z[burn:(length(z)-1L)]
    response <- z[(burn+1L):length(z)]
    # For AR(1), use the exact least-squares slope within the stationarity bound.
    slope <- sum((lagged-mean(lagged))*(response-mean(response)))/sum((lagged-mean(lagged))^2)
    w <- atanh(max(-1+1e-12,min(1-1e-12,slope/.995)))
  } else if (length(w)) {
    second <- w
    second[1] <- .4
    loss <- function(x) profile(x)$value
    attempts <- lapply(list(w,second), function(x) optim(x, loss, method="BFGS",
      control=list(maxit=600, reltol=1e-13, ndeps=rep(1e-5, length(x)))))
    good <- Filter(function(x) x$convergence == 0 && is.finite(x$value), attempts)
    if (!length(good)) stop("ARMA optimization failed")
    w <- good[[which.min(vapply(good, function(x) x$value, numeric(1)))]]$par
  }
  best <- profile(w)
  stopifnot(is.finite(best$value),best$value>1e-14)
  ar <- best$ar; ma <- best$ma; mu <- m+s*best$center
  variance <- best$value*s^2
  logLik <- -n/2 * (log(2*pi*variance)+1)
  k <- p+q+2
  AIC <- -2*logLik+2*k
  list(p=p, q=q, mu=mu, ar=ar, ma=ma, burn=burn, sigma2=variance, logLik=logLik,
    residual=arma_residuals(y,mu,ar,ma,burn), IC=c(AIC=AIC,
      AICc=AIC+2*k*(k+1)/(n-k-1), BIC=-2*logLik+log(n)*k))
}
# Score each candidate on the same effective n, including the variance parameter.
choose_arma <- function(y, mode, criterion, p, q, grid=FALSE) {
  if (mode=="manual" && !grid) return(list(fit=fit_arma(y,p,q)))
  orders <- expand.grid(q=0:3, p=0:3)
  fits <- lapply(seq_len(nrow(orders)), function(i)
    tryCatch(fit_arma(y, orders$p[i], orders$q[i]), error=function(e) NULL))
  scores <- t(vapply(fits, function(f) if (is.null(f)) setNames(rep(NA_real_,3),c("AIC","AICc","BIC")) else f$IC, numeric(3)))
  colnames(scores) <- c("AIC","AICc","BIC")
  fit <- if (mode=="auto") fits[[which.min(scores[,criterion])]] else fit_arma(y,p,q)
  list(fit=fit, candidates=cbind(orders,scores))
}
arma_next <- function(y, e, t, fit) {
  fit$mu + sum(fit$ar*(y[t-seq_along(fit$ar)]-fit$mu)) +
    sum(fit$ma*e[t-seq_along(fit$ma)])
}
# Recursive point forecasts and innovation-only 80% / 95% intervals.
arma_forecast <- function(y, fit, horizon) {
  e <- fit$residual
  pred <- numeric(horizon)
  psi <- c(1, rep(0, horizon-1))
  for (h in seq_len(horizon)) {
    pred[h] <- arma_next(y, e, length(y)+1L, fit)
    y <- c(y,pred[h]); e <- c(e,0)
    if (h>1) {
      j <- seq_len(min(h-1,length(fit$ar)))
      psi[h] <- sum(fit$ar[j]*psi[h-j]) + if (h-1<=length(fit$ma)) fit$ma[h-1] else 0
    }
  }
  se <- sqrt(fit$sigma2*cumsum(psi^2))
  cbind(value=pred, lo80=pred-qnorm(.9)*se, hi80=pred+qnorm(.9)*se,
    lo95=pred-qnorm(.975)*se, hi95=pred+qnorm(.975)*se)
}`,
    var: `# y[t] = c + A1 y[t-1] + ... + Ap y[t-p] + u[t], estimated by equation-wise OLS.
var_design <- function(Y,t,p) c(1, as.vector(t(Y[t-seq_len(p),,drop=FALSE])))
fit_var <- function(Y,p,start=p) {
  m <- ncol(Y); n <- nrow(Y)-start
  k <- 1+m*p
  stopifnot(m>=2, n>=max(30,3*k))
  ts <- seq.int(start+1,nrow(Y))
  X <- t(vapply(ts, function(t) var_design(Y,t,p), numeric(k)))
  fit <- lm.fit(X,Y[ts,,drop=FALSE])
  stopifnot(fit$rank==k)
  U <- fit$residuals
  Sigma <- crossprod(U)/n
  ld <- 2*sum(log(diag(chol(Sigma))))
  IC <- ld + c(AIC=2, BIC=log(n), HQ=2*log(log(n)))*m*k/n
  list(p=p,m=m,start=start,X=X,coef=fit$coefficients,df=fit$df.residual,
    residual=U,fitted=fit$fitted.values,cov=Sigma,IC=IC)
}
# Compare candidates using identical target dates, then refit the selected order.
choose_var <- function(Y, mode, criterion, p, grid=FALSE) {
  if (mode=="manual" && !grid) return(list(fit=fit_var(Y,p)))
  scores <- t(vapply(1:5, function(j) tryCatch(fit_var(Y,j,5)$IC,
    error=function(e) rep(NA_real_,3)), numeric(3)))
  colnames(scores) <- c("AIC","BIC","HQ")
  if (mode=="auto") p <- which.min(scores[,criterion])
  list(fit=fit_var(Y,p),candidates=cbind(p=1:5,scores))
}
var_roots <- function(fit) {
  m <- fit$m
  d <- m*fit$p
  A <- t(fit$coef[-1,,drop=FALSE])
  if (d>m) A <- rbind(A, cbind(diag(d-m),matrix(0,d-m,m)))
  eigen(A,only.values=TRUE)$values
}
# Conditional direction-specific F test. H0: all p coefficients are zero.
granger <- function(Y, fit, from, to) {
  X <- fit$X; p <- fit$p; m <- fit$m
  restricted <- X[,-(1L+from+(0:(p-1L))*m),drop=FALSE]
  e0 <- lm.fit(restricted,Y[(fit$start+1):nrow(Y),to])$residuals
  rss <- sum(fit$residual[,to]^2)
  F <- max(0,(sum(e0^2)-rss)/p)/(rss/fit$df)
  c(F=F,df1=p,df2=fit$df,p=pf(F,p,fit$df,lower.tail=FALSE))
}
var_next <- function(Y,t,fit) drop(var_design(Y,t,fit$p) %*% fit$coef)
var_forecast <- function(Y,fit,horizon) {
  n <- nrow(Y)
  for (h in seq_len(horizon)) Y <- rbind(Y,var_next(Y,nrow(Y)+1L,fit))
  Y[n+seq_len(horizon),,drop=FALSE]
}`,
    lstm: `# Frozen LSTM inference. Gate order: input, forget, output, candidate.
lstm_next <- function(Y,t,model) {
  H <- model$hidden; D <- length(model$features)
  W <- matrix(model$weights[seq_len(4*H*(D+H+1))], nrow=4*H, byrow=TRUE)
  readout <- tail(model$weights,H+1)
  h <- memory <- numeric(H)
  J <- seq_len(H)
  for (k in seq.int(t-model$window,t-1L)) {
    x <- (Y[k,model$features]-model$center[seq_len(D)])/model$scale[seq_len(D)]
    gates <- drop(W %*% c(1,x,h))
    memory <- plogis(gates[H+J])*memory + plogis(gates[J])*tanh(gates[3*H+J])
    h <- plogis(gates[2*H+J])*tanh(memory)
  }
  model$center[D+1L] + model$scale[D+1L]*sum(readout*c(1,h))
}`
  };
  const quoted = s => JSON.stringify(s);
  const vector = (values, f = String) => 'c(' + values.map(f).join(', ') + ')';
  function wrapped(values, f = String) {
    const lines = [];
    for (let i = 0; i < values.length; i += 6) lines.push('  ' + values.slice(i,i+6).map(f).join(', '));
    return 'c(\n' + lines.join(',\n') + '\n)';
  }
  const list = entries => 'list(' + Object.entries(entries).map(([k,v])=>k+'='+v).join(', ') + ')';
  function lstmModelCode(model) {
    return list({hidden:model.hidden,window:model.window,features:vector(model.features.map(j=>j+1)),
      center:vector(model.center),scale:vector(model.scale),weights:wrapped(model.weights)});
  }
  function build(view, data, options, model, available) {
    const o = options, blocks = [];
    const add = (id, title, text, code) => blocks.push({id,title,text,code:code.trim()});
    add('data','数据 / Data','网页与 R 使用同一份已确认数据和日期。价格转换是相邻观察的 Pₜ/Pₜ₋₁ − 1 或 log(Pₜ) − log(Pₜ₋₁)。',
      '# FinModel Lab | Experiment 05 | Base R, no extra packages.\n' +
      '# ' + (data.synthetic ? 'Synthetic financial series; t labels are simulated periods.' : 'Browser-confirmed aligned data; no external files required.') +
      '\nlabels <- ' + vector(data.names,quoted) + '\ndates <- ' + wrapped(data.dates,quoted) +
      '\nraw <- matrix(' + wrapped(data.rows.flat()) + ', ncol=length(labels), byrow=TRUE)\n' +
      'colnames(raw) <- labels\nY <- raw\n' +
      (data.kind === 'price' && o.form === 'simple' ? 'Y <- raw[-1,,drop=FALSE]/raw[-nrow(raw),,drop=FALSE]-1\ndates <- dates[-1]\n' : '') +
      (data.kind === 'price' && o.form === 'log' ? 'Y <- log(raw[-1,,drop=FALSE])-log(raw[-nrow(raw),,drop=FALSE])\ndates <- dates[-1]\n' : '') +
      'target <- ' + (o.target+1) + 'L\ny <- Y[,target]\n' +
      'series_labels <- paste("Series", seq_along(labels))\nprint(setNames(labels,series_labels))\n' +
      'if (nzchar(Sys.getenv("FINMODEL_R_PLOT"))) pdf(Sys.getenv("FINMODEL_R_PLOT"))');
    const opts = 'arma_mode <- '+quoted(o.armaMode)+'\narma_ic <- '+quoted(o.armaIC)+'\np <- '+o.p+'L\nq <- '+o.q+'L\n';
    const varOpts = 'var_mode <- '+quoted(o.varMode)+'\nvar_ic <- '+quoted(o.varIC)+'\nlag <- '+o.varLag+'L\ncolumns <- '+vector(o.vars.map(i=>i+1))+'\n';
    if (view === 'station') {
      const [adf,kpss] = source.station.split('\n\n# KPSS');
      add('adf','ADF τ','将 Δyₜ 回归于 yₜ₋₁、可选确定性项及滞后差分。检验单位根时比较 τ 与专用左尾临界值。',adf);
      add('kpss','KPSS','水平或趋势平稳是原假设。去除确定性部分后，使用 Bartlett 权重估计长期方差，统计量超过右尾临界值时拒绝。','# KPSS'+kpss);
      add('acf','ACF / PACF','ACF 比较序列和其滞后值。PACF 控制中间滞后；白噪声点态参考线约为 ±1.96/√n。',
        'adf_result <- adf(y, '+quoted(o.adf)+' , '+o.adfLag+'L)\nkpss_result <- kpss(y, '+(o.kpss==='trend'?'TRUE':'FALSE')+
        ')\nprint(adf_result)\nprint(kpss_result)\ncorrelation <- acf(y, lag.max=24, plot=FALSE)\npartial <- pacf(y, lag.max=24, plot=FALSE)\nplot(y,type="l",xlab="Observation",ylab=series_labels[target]); acf(y); pacf(y)');
    }
    if (view === 'arma' || view === 'compare') {
      const [estimation, rest] = source.arma.split('\n# Score each');
      const [selection, forecast] = rest.split('\narma_next');
      add('arma','ARMA 估计 / Fit','p 个 AR 系数作用于过去的 y−μ，q 个 MA 系数作用于过去创新。对给定 AR/MA 系数解析求 μ，再用 BFGS 优化条件平方损失。反射系数约束平稳与可逆。',estimation);
      add('order','ARMA 定阶 / Order','条件对数似然使用同一有效样本。AIC、AICc 与 BIC 对复杂度的惩罚不同。','# Score each'+selection);
      add('forecast','ARMA 预测 / Forecast','递推时未来创新期望为零，区间方差为 σ²Σψ²。区间基于高斯创新，条件于参数估计。','arma_next'+forecast);
    }
    if (view === 'var' || view === 'compare') {
      const [estimation,rest] = source.var.split('\nvar_roots');
      const [roots,rest2] = rest.split('\n# Conditional direction');
      const [granger,forecast] = rest2.split('\nvar_next');
      add('var','VAR 估计与定阶 / Fit','各方程共享含截距的滞后设计。自动定阶在相同日期用 log det(Σ̂) 与复杂度惩罚比较，随后用所选阶数重估。',estimation);
      add('roots','VAR 稳定性 / Roots','伴随矩阵特征值模全部小于 1 时，估计的 VAR 满足稳定性条件。','var_roots'+roots);
      add('granger','Granger 联合检验 / F test','检验给定其他变量的滞后后，来源变量的全部 p 个滞后系数是否为零。经典 F 参考分布需要相应误差假设。','# Conditional direction'+granger);
      add('joint','VAR 联合预测 / Forecast','逐期把系统所有变量的点预测作为下一期滞后输入。','var_next'+forecast);
    }
    if (view === 'arma') add('result','诊断与图表 / Results','Ljung–Box 使用有效残差，参考自由度为 L−p−q。未拒绝表示证据不足以判定所选滞后仍有线性相关。',
      opts+'out <- choose_arma(y, arma_mode, arma_ic, p, q, '+(o.chart==='criteria'?'TRUE':'FALSE')+
      ')\nf <- out$fit\nprint(out$candidates)\nprint(c(mu=f$mu,f$ar,f$ma,variance=f$sigma2,logLik=f$logLik,f$IC))\n'+
      'e <- tail(f$residual,-f$burn)\nL <- '+o.diagnostic+'L\nif (L>f$p+f$q && L<length(e)) print(Box.test(e,lag=L,type="Ljung-Box",fitdf=f$p+f$q))\n'+
      'forecast <- arma_forecast(y,f,'+o.horizon+'L)\nprint(forecast)\n'+
      'plot(e/sqrt(f$sigma2),type="l",ylab="Standardized residual"); acf(e)\n'+
      'plot(seq_along(y),y,type="l",xlim=c(max(1,length(y)-75),length(y)+nrow(forecast)),\n'+
      '  ylim=range(tail(y,75),forecast),xlab="Observation / forecast period",ylab=series_labels[target])\n'+
      'h <- length(y)+seq_len(nrow(forecast)); abline(v=length(y),lty=3)\n'+
      'matlines(h,forecast,type="l",lty=c(1,2,2,3,3),col=c(1,2,2,4,4)); points(h,forecast[,"value"])');
    if (view === 'var') add('result','联合预测与检验 / Results','所有方向使用相同的模型和同期样本。F 检验反映条件预测增量，现实因果需要额外识别假设。',
      varOpts+'V <- Y[,columns,drop=FALSE]\nout <- choose_var(V,var_mode,var_ic,lag,'+(o.chart==='criteria'?'TRUE':'FALSE')+')\nf <- out$fit\n'+
      'print(out$candidates); print(f$coef); print(f$cov)\nroots <- var_roots(f)\nprint(roots); print(max(Mod(roots))<1)\n'+
      'for (i in seq_len(ncol(V))) for (j in setdiff(seq_len(ncol(V)),i)) {\n'+
      '  cat(colnames(V)[i],"->",colnames(V)[j],"\\n"); print(granger(V,f,i,j))\n}\n'+
      'forecast <- var_forecast(V,f,'+o.horizon+'L)\nprint(forecast)\n'+
      'matplot(seq_len(nrow(forecast)),forecast,type="b",pch=1,xlab="Future period",ylab="Forecast");\n'+
      'legend("topright",legend=series_labels[columns],col=seq_len(ncol(V)),lty=seq_len(ncol(V)),bty="n")');
    if (view === 'var') add('irf','脉冲响应与方差分解 / IRF and FEVD','Cholesky 正交化按列顺序识别冲击；脉冲响应是结构冲击后各变量路径，方差分解是各冲击对预测误差方差的份额。',
      'H <- '+Math.max(1,Math.min(40,o.horizon||12))+'L\n'+
      'shock <- '+((o.shock|0)+1)+'L\n'+
      '# Lower-triangular Cholesky factor of the residual covariance.\n'+
      'B <- t(chol(f$cov))\n'+
      '# Lag coefficient matrices A_l, one per lag order.\n'+
      'A_l <- function(l) t(f$coef[-1,,drop=FALSE])[, (l-1)*f$m + seq_len(f$m), drop=FALSE]\n'+
      '# Theta_0 = I; Theta_h = sum_{l=1..min(p,h)} A_l Theta_{h-l}.\n'+
      'Theta <- vector("list", H+1L)\nTheta[[1]] <- diag(f$m)\n'+
      'for (h in seq_len(H)) {\n  M <- matrix(0, f$m, f$m)\n'+
      '  for (l in seq_len(min(h, f$p))) M <- M + A_l(l) %*% Theta[[h-l+1L]]\n'+
      '  Theta[[h+1L]] <- M\n}\n'+
      '# Response of every variable to a one-standard-deviation shock in column j.\n'+
      'resp <- function(j) t(vapply(Theta, function(T_) T_ %*% B[, j], numeric(f$m)))\n'+
      '# Share of the h-step forecast-error variance of variable i explained by shock j.\n'+
      'share <- function(i) {\n'+
      '  sq <- vapply(seq_len(f$m), function(j) resp(j)[, i]^2, numeric(H+1L))\n'+
      '  cums <- apply(sq, 2, cumsum)\n  sweep(cums, 1, rowSums(cums), "/")\n}\n'+
      'h <- 0:H\n'+
      'matplot(h, resp(shock), type="l", lty=1, xlab="Horizon", ylab="Response",\n'+
      '  main="Orthogonalised IRF"); legend("topright", legend=series_labels[columns], lty=1, bty="n")\n'+
      'print(round(resp(shock), 6))\n'+
      'matplot(h, share('+((o.target|0)+1)+'L), type="l", lty=1, ylim=c(0,1), xlab="Horizon",\n'+
      '  ylab="Share of variance", main="FEVD"); legend("right", legend=series_labels[columns], lty=1, bty="n")\n'+
      'print(round(share('+((o.target|0)+1)+'L)[H+1L, ], 4))');
    if (view === 'compare') {
      add('split','时间划分 / Split','训练区决定 ARMA/VAR 参数及 LSTM 标准化。LSTM 用随后验证区早停。逐期测试只使用目标日前已观察到的数据。',
        opts+varOpts+'nt <- floor(nrow(Y)*'+o.train+'+1e-10)\nnv <- floor(nrow(Y)*('+o.train+'+'+o.valid+')+1e-10)\n'+
        'stopifnot(nt>=30,nv-nt>=5,nrow(Y)-nv>=5)\ntrain <- seq_len(nt)\ntest <- seq.int(nv+1,nrow(Y))\n'+
        'actual <- y[test]\npredictions <- list(Naive=y[test-1])\n'+
        'safe_model <- function(expr) tryCatch(expr,error=function(e) { message(conditionMessage(e)); NULL })\n'+
        (available?.ARMA?.error ? '# Browser ARMA unavailable.\n' :
          'a <- safe_model(choose_arma(y[train],arma_mode,arma_ic,p,q)$fit)\n'+
          'if (!is.null(a)) {\n  e <- arma_residuals(y,a$mu,a$ar,a$ma,a$burn)\n'+
          '  predictions$ARMA <- vapply(test,function(t) arma_next(y,e,t,a),numeric(1))\n}\n')+
        (available?.VAR?.error ? '# Browser VAR unavailable.\n' :
          'if (length(columns)>=2 && target %in% columns) {\n  V <- Y[,columns,drop=FALSE]\n'+
          '  v <- safe_model(choose_var(V[train,,drop=FALSE],var_mode,var_ic,lag)$fit)\n'+
          '  if (!is.null(v)) predictions$VAR <- vapply(test,function(t) var_next(V,t,v)[match(target,columns)],numeric(1))\n}'));
      if (model) {
        add('lstm','LSTM 推断 / Inference','每个窗口以零隐藏状态开始。输入门、遗忘门、输出门和候选状态更新记忆。R 用训练验证后冻结的权重，输出再恢复目标尺度。',
          '# Adam; seed '+model.seed+'; batch '+model.batch+'; rate '+model.rate+'; max epochs '+model.epochs+
          '; stopped '+model.curve.length+'; restored '+model.bestEpoch+'.\n'+source.lstm+'\nmodel <- '+lstmModelCode(model)+
          '\npredictions$LSTM <- vapply(test,function(t) lstm_next(Y,t,model),numeric(1))');
      }
      add('scores','共同测试集 / Scores','所有参与模型在同一组日期上预测同一目标的一期值。RMSE 强调大误差，MAE 计算绝对误差的平均。',
        (model ? '' : '# LSTM weights unavailable for these settings. Train on the browser to include LSTM.\n')+
        'stopifnot(all(vapply(predictions,function(z) length(z)==length(actual) && all(is.finite(z)),logical(1))))\n'+
        'scores <- vapply(predictions,function(z) c(RMSE=sqrt(mean((actual-z)^2)),MAE=mean(abs(actual-z))),numeric(2))\n'+
        'print(scores)\nprint(head(data.frame(date=dates[test],actual=actual,as.data.frame(predictions))))\n'+
        'barplot(scores["RMSE",],ylab="One-step test RMSE")\n'+
        'matplot(cbind(actual,do.call(cbind,predictions)),type="l",xlab="Test observation",ylab=series_labels[target])');
    }
    if (view === 'compare') add('lstmtrain','R 端 LSTM 训练 / LSTM training in R','浏览器用 Adam 与早停训练；这里用 base R 逐样本 SGD 直接训练同一类窗口，属于教学规模（隐藏单元、轮数、窗口数均有上限），数值不会与浏览器逐位相同。',
      '# Cap the teaching run: base R is slow, so windows, units and epochs are bounded.\n'+
      'window <- '+Math.max(4,Math.min(12,o.window||12))+'L\nhidden <- '+Math.max(2,Math.min(8,o.hidden||8))+'L\n'+
      'epochs <- '+Math.max(1,Math.min(20,o.epochs||20))+'L\nrate <- 0.02\nseed <- 731L\n'+
      source.lstmTrain+'\n'+
      'cols <- c('+((Array.isArray(o.features)&&o.features.length?o.features:[o.target]).map(i=>i+1).join(', '))+')\ntarget_col <- '+(o.target+1)+'L\n'+
      'tr <- seq_len(nt)\n'+
      'center <- colMeans(Y[tr,,drop=FALSE]); scale <- apply(Y[tr,,drop=FALSE],2,sd)\n'+
      'stopifnot(all(scale > 1e-12))\n'+
      'Z <- sweep(sweep(Y,2,center,"-"),2,scale,"/")\n'+
      'input_at <- function(t) Z[(t-window):(t-1L), cols, drop=FALSE]\n'+
      'train_t <- seq.int(window+1L, nt)\n'+
      'if (length(train_t) > 200L) train_t <- round(seq(window+1L, nt, length.out=200L))\n'+
      'fit <- lstm_train(lapply(train_t, input_at), Z[train_t, target_col], hidden, epochs, rate, seed)\n'+
      'test_t <- seq.int(nv+1L, nrow(Y))\n'+
      'pred <- vapply(test_t, function(t) lstm_forward(fit$weights, input_at(t), hidden)$value, numeric(1))\n'+
      'pred <- center[target_col] + scale[target_col]*pred\n'+
      'actual <- Y[test_t, target_col]\n'+
      'rmse <- sqrt(mean((actual-pred)^2)); naive <- sqrt(mean((actual-Y[test_t-1L,target_col])^2))\n'+
      'print(c(epochs=length(fit$curve),loss=fit$loss,RMSE=rmse,NaiveRMSE=naive))\n'+
      'print(round(fit$curve,5))\n'+
      'plot(test_t, actual, type="l", xlab="Test observation", ylab="target", main="LSTM trained in R")\n'+
      'lines(test_t, pred, col=2)\n'+
      'legend("topright", c("Actual","LSTM (R)"), col=1:2, lty=1, bty="n")');
    if (view === 'lstm' && model) {
      add('lstm','LSTM 推断 / Inference','使用冻结权重还原共同测试日期的一期预测。',
        '# Adam; seed '+model.seed+'; batch '+model.batch+'; rate '+model.rate+'; max epochs '+model.epochs+
        '; stopped '+model.curve.length+'; restored '+model.bestEpoch+'.\n'+source.lstm+'\nmodel <- '+lstmModelCode(model)+
        '\ntest <- seq.int('+ (model.nv+1) +'L,nrow(Y))\nactual <- y[test]\n'+
        'prediction <- vapply(test,function(t) lstm_next(Y,t,model),numeric(1))\n'+
        'print(c(RMSE=sqrt(mean((actual-prediction)^2)),MAE=mean(abs(actual-prediction))))\n'+
        'print(head(data.frame(date=dates[test],actual,prediction)))\n'+
        'matplot(cbind(actual,prediction),type="l",xlab="Test observation",ylab=series_labels[target])\n'+
        'legend("topright",c("Actual","LSTM"),col=1:2,lty=1:2,bty="n")');
    }
    return {blocks, script:blocks.map(b=>b.code).join('\n\n')+'\n'};
  }
  return {build, source};
});

;

/* Source: timeseries-chart.js */
/* One accessible SVG per view. The shared chart controller owns tooltip state. */
window.TimeSeriesChart = (host, tip) => {
  const {esc, ticks} = WorkbenchUI;
  const colors = ['#6b818f','#896c9d','#4e8980','#a8784d','#587da4'];
  const interaction = ChartInteraction.create((text,mode) => {
    tip.hidden = !text;
    tip.dataset.state = mode;
    if (text) {
      tip.innerHTML = '<button type="button" aria-label="关闭详情">×</button>' + esc(text);
      tip.querySelector('button').onclick = () => interaction.clear();
    }
  });
  const fmt = x => Number(x.toPrecision(4)).toString();
  function draw({series, labels, unit, xLabel, bars = false, bands = [], references = [], origin, mark = []}) {
    interaction.clear();
    interaction.redraw(() => false);
    const W=660,H=300,L=76,R=21,T=19,B=52;
    const n = labels.length;
    const values = series.flatMap(s => s.values.filter(Number.isFinite))
      .concat(bands.flatMap(b => [...b.lower,...b.upper].filter(Number.isFinite)),references.map(r=>r.value),bars?[0]:[]);
    if (!values.length) { host.textContent='当前没有可绘制结果。'; return; }
    const min=Math.min(...values),max=Math.max(...values),pad=(max-min)*.08||Math.max(.001,Math.abs(max)*.05);
    const lo=min-pad,hi=max+pad, y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
    const step=(W-L-R)/(bars?n:Math.max(1,n-1));
    const x=i=>L+(bars?i+.5:n===1?.5:i)*step;
    const guides=ticks(lo,hi,4).map(v=>'<path class="ts-grid" d="M'+L+','+y(v)+'H'+(W-R)+'"/>'+
      '<text x="'+(L-9)+'" y="'+(y(v)+4)+'" text-anchor="end">'+fmt(v)+'</text>').join('');
    const xTicks = bars && n<=8 ? labels.map((_,i)=>i) : [...new Set([0,Math.floor((n-1)/3),Math.floor(2*(n-1)/3),n-1])];
    const dates=xTicks.map(i=>'<text x="'+x(i)+'" y="'+(H-B+19)+'" text-anchor="'+(!bars&&i===0?'start':!bars&&i===n-1?'end':'middle')+'">'+esc(labels[i])+'</text>').join('');
    const coord=(i,v)=>x(i).toFixed(2)+','+y(v).toFixed(2);
    const intervals=bands.map(b=>{
      const ids=b.lower.map((v,i)=>Number.isFinite(v)?i:null).filter(i=>i!==null);
      if (!ids.length) return '';
      if (ids.length===1) {
        const i=ids[0];
        return '<path d="M'+coord(i,b.lower[i])+'L'+coord(i,b.upper[i])+'" stroke="#896c9d" stroke-width="'+(b.alpha>.2?7:13)+'" opacity="'+b.alpha+'"/>';
      }
      const points=ids.map(i=>coord(i,b.lower[i])).concat(ids.slice().reverse().map(i=>coord(i,b.upper[i])));
      return '<polygon points="'+points.join(' ')+'" fill="#896c9d" opacity="'+b.alpha+'"/>';
    }).join('');
    const ref = references.map(r=>'<path d="M'+L+','+y(r.value)+'H'+(W-R)+'" stroke="#8e829e" stroke-dasharray="4 4" fill="none"/>').join('');
    const boundary = origin === undefined ? '' : '<path d="M'+x(origin)+','+T+'V'+(H-B)+'" stroke="#7e7490" stroke-dasharray="4 5"/>'+
      '<text x="'+(x(origin)-4)+'" y="'+(T+12)+'" text-anchor="end">预测起点</text>';
    const lines=series.map((s,j)=>{
      const color=s.color||colors[j%colors.length];
      if (bars) return s.values.map((v,i)=>!Number.isFinite(v)?'':
        '<rect x="'+(x(i)-Math.min(30,step*.29))+'" y="'+Math.min(y(v),y(0))+'" width="'+Math.min(60,step*.58)+'" height="'+Math.abs(y(v)-y(0))+'" rx="2" fill="'+(s.barColors?.[i]||color)+'"/>').join('');
      let d='',continuation=false;
      s.values.forEach((v,i)=>{
        if (!Number.isFinite(v)) { continuation=false; return; }
        d+=(continuation?'L':'M')+coord(i,v);
        continuation=true;
      });
      return '<path d="'+d+'" stroke="'+color+'" fill="none" stroke-width="2.3" '+(s.dash?'stroke-dasharray="'+s.dash+'"':'')+'/>'+
        (s.points||s.values.filter(Number.isFinite).length===1 ? s.values.map((v,i)=>Number.isFinite(v)?
          '<circle cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+color+'"/>':'').join('') : '');
    }).join('');
    const points=labels.flatMap((label,i)=>{
      const entries=series.filter(s=>Number.isFinite(s.values[i]));
      if (!entries.length) return [];
      const hint=label+' · '+entries.map(s=>s.name+' '+fmt(s.values[i])).concat(
        bands.flatMap(b=>Number.isFinite(b.lower[i])?[b.name+' ['+fmt(b.lower[i])+', '+fmt(b.upper[i])+']']:[]),
        mark[i] ? [mark[i]] : []).join(' · ')+' '+unit;
      return [{i,hint}];
    });
    const hit=points.map(({i,hint},j)=>'<rect class="ts-hit" data-point="'+j+'" aria-label="'+esc(hint)+'" role="button" tabindex="'+
      (points.length<=30 || j%Math.ceil(points.length/18)===0?'0':'-1')+'" x="'+Math.max(L-6,x(i)-Math.max(3,step/2))+
      '" y="'+T+'" width="'+Math.max(6,step)+'" height="'+(H-T-B)+'"/>').join('');
    host.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="'+esc(unit+' / '+xLabel)+'">'+guides+
      '<path class="ts-axis" d="M'+L+','+T+'V'+(H-B)+'H'+(W-R)+'"/>'+intervals+ref+boundary+lines+dates+
      '<text x="'+L+'" y="13">'+esc(unit)+'</text><text x="'+((L+W-R)/2)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(xLabel)+'</text>'+hit+'</svg>';
    host.querySelectorAll('[data-point]').forEach(el=>interaction.bind(el,points[Number(el.dataset.point)].hint));
  }
  return {draw, clear:()=>interaction.clear(), colors};
};

;

/* Source: ts-coint-math.js */
/* Experiment05 拓展 · 协整与误差校正模型（课件 L14 第一节）。
   E-G 两步法 + ADF + ECM；数据为确定性合成的"共同趋势 + 均值回复价差"。 */
(function(root,factory){const api=factory(typeof module==='object'?require('./lab-stats'):root.LabStats);if(typeof module==='object')module.exports=api;else root.CointMath=api;})(this,S=>{
'use strict';
const defaults=Object.freeze({n:400,seed:20261114,beta:1,mu:0,phi:.85,sigU:.02,sigX:.012,kind:'coint',lag:1});
const CRIT={none:{1:-2.58,5:-1.95,10:-1.62},drift:{1:-3.43,5:-2.86,10:-2.57},trend:{1:-3.96,5:-3.41,10:-3.12},eg:{1:-3.90,5:-3.34,10:-3.04}};
function check(p){
  if(!Number.isInteger(p.n)||p.n<100||p.n>1200)throw Error('样本量须为 100–1200 的整数。');
  if(!(p.phi>0&&p.phi<1))throw Error('价差自回归系数 φ 须在 0 与 1 之间（φ=1 表示不协整）。');
  if(!(p.sigU>0&&p.sigX>0))throw Error('两个新息的标准差必须为正。');
  if(!['coint','spurious'].includes(p.kind))throw Error('情景只能是"协整"或"伪回归"。');
  if(!Number.isInteger(p.lag)||p.lag<1||p.lag>6)throw Error('ADF 与 ECM 的滞后阶数须为 1–6。');
  return true;
}
function generate(p){
  check(p);
  const rng=S.prng(p.seed),n=p.n,x=[0],y=[0];let u=0;
  for(let t=1;t<n;t++){
    x.push(x[t-1]+p.sigX*rng.normal()+(p.mu||0));
    if(p.kind==='spurious')u+=p.sigU*rng.normal();          /* 随机游走价差：伪回归 */
    else u=p.phi*u+p.sigU*rng.normal();
    y.push(p.beta*x[t]+u);
  }
  return{x,y,u,n:p.n};
}
/* OLS：y = a + b x + u */
function ols(y,x){
  const n=y.length,mx=S.mean(x),my=S.mean(y);
  const sxx=S.sum(x.map(v=>(v-mx)**2)),sxy=S.sum(x.map((v,i)=>(v-mx)*(y[i]-my)));
  const b=sxy/sxx,a=my-b*mx,res=y.map((v,i)=>v-a-b*x[i]);
  const se=Math.sqrt(S.sum(res.map(v=>v*v))/(n-2)/sxx);
  return{a,b,se,res,t:(b-0)/se,r2:1-S.sum(res.map(v=>v*v))/S.sum(y.map(v=>(v-my)**2))};
}
/* ADF：Δy_t = c + γ y_{t-1} + Σ δ_i Δy_{t-i}，报告 τ 与临界值 */
function adf(y,lag=1,type='drift'){
  const d=[];for(let t=1;t<y.length;t++)d.push(y[t]-y[t-1]);
  const rows=[];
  for(let t=lag;t<d.length;t++){
    const row=[1,y[t]];              /* y[t] 对应 y_{t} 水平项（差分 d[t] = y_{t+1}-y_t） */
    for(let j=1;j<=lag;j++)row.push(d[t-j]);
    rows.push({x:row,y:d[t]});
  }
  const k=rows[0].x.length,X=rows.map(r=>r.x),Y=rows.map(r=>r.y);
  const fit=S.ols(Y,Array.from({length:k-1},(_,j)=>X.map(r=>r[j+1])),{names:['y','d']});
  const tau=fit.t[1],crit=CRIT[type];
  return{tau,lag,n:rows.length,crit,res:fit.resid,coef:fit.beta,se:fit.se,
    reject:tau<crit[5],ci:{lo:crit[5]}};
}
/* ECM：Δy_t = c + γ u_{t-1} + φ Δy_{t-1} + θ Δx_{t-1} + e */
function ecm(x,y,lag=1){
  const dx=[],dy=[],rows=[];
  for(let t=1;t<y.length;t++){dx.push(x[t]-x[t-1]);dy.push(y[t]-y[t-1]);}
  const fit0=ols(y,x),u=fit0.res;
  for(let t=lag;t<dy.length;t++){
    const row=[1,u[t-1+1]];         /* u 的索引与差分对齐：用 u_{t} 对应 dy[t] 的前一期 */
    for(let j=1;j<=lag;j++)row.push(dy[t-j]);
    for(let j=1;j<=lag;j++)row.push(dx[t-j]);
    rows.push({x:row,y:dy[t]});
  }
  const X=rows.map(r=>r.x),Y=rows.map(r=>r.y),k=X[0].length;
  const fit=S.ols(Y,Array.from({length:k-1},(_,j)=>X.map(r=>r[j+1])),{names:['u','dy','dx']});
  const gamma=fit.beta[1],seGamma=fit.se[1];
  const halfLife=gamma<0&&gamma>-1?Math.log(.5)/Math.log(1+gamma):NaN;
  return{gamma,se:seGamma,t:fit.t[1],p:fit.p[1],coef:fit.beta,halfLife,r2:fit.r2,n:rows.length,
    alpha:fit0.a,beta:fit0.b};
}
function run(p){
  check(p);
  const d=generate(p),x=d.x,y=d.y;
  const adfX=adf(x,p.lag,'drift'),adfY=adf(y,p.lag,'drift'),adfU=adf(ols(y,x).res,p.lag,'eg');
  const fit=ols(y,x),ecmFit=ecm(x,y,p.lag);
  return{...d,adfX,adfY,adfU,fit,ecm:ecmFit,
    spread:fit.res,trueBeta:p.beta,
    conclusion:{cointegrated:adfU.reject,spurious:p.kind==='spurious'}};
}
function build(p,q,lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(id,title,text,code)=>blocks.push({id,title,text,code:(Array.isArray(code)?code.join('\n'):String(code)).trim()});
  const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
  const vec=a=>{const parts=a.map(v=>num(Number(v.toFixed(10)))),lines=[];for(let i=0;i<parts.length;i+=10)lines.push('  '+parts.slice(i,i+10).join(', '));return 'c(\n'+lines.join(',\n')+'\n)';};
  add('cdata',T('数据 / Data','Data'),T('两条对数价格序列：共同随机趋势 + 均值回复价差（或伪回归情景）。','Two log price series: a common stochastic trend plus a mean-reverting spread, or a spurious-regression scenario.'),
    ['# FinModel Lab | Experiment 05.5 | cointegration | Base R, no extra packages.',
     `# ${p.kind==='coint'?'cointegrated pair':'random-walk spread (spurious regression)'}`,
     `x <- ${vec(q.x)}`,`y <- ${vec(q.y)}`,`n <- length(x)`,`lag <- ${p.lag}L`,
     'stopifnot(n >= 100, length(y) == n)']);
  add('ceg',T('E-G 两步法 / Engle-Granger','Engle-Granger two-step'),T('第一步做水平回归得到价差，第二步对价差做 ADF；临界值不能用普通 t 表。','Step one regresses the levels to get the spread; step two runs ADF on it with its own critical values.'),
    ['fit <- lm(y ~ x)','u <- resid(fit)','print(summary(fit)$coefficients)',
     'adf_u <- function(u, lag) {','  d <- diff(u); n <- length(d)',
     '  X <- cbind(1, u[(lag + 1L):(length(u) - 1L)])',
     '  for (j in seq_len(lag)) X <- cbind(X, d[(lag + 1L - j):(length(d) - j)])',
     '  f <- lm.fit(X, d[(lag + 1L):n])',
     '  s2 <- sum(f$residuals^2)/f$df.residual',
     '  vc <- chol2inv(qr.R(f$qr))*s2',
     '  tau <- f$coefficients[2]/sqrt(vc[2, 2])',
     '  c(tau = unname(tau), n = f$df.residual + ncol(X))','}',
     'print(adf_u(u, lag))',
     '# Engle-Granger 5% critical value (with constant, two variables) is about -3.34.']);
  add('cecm',T('误差校正模型 / ECM','Error-correction model (ECM)'),T('把价差放回差分方程：γ<0 表示偏离会在下一期被部分纠正；半衰期 = ln(0.5)/ln(1+γ)。','Put the spread back into the differenced equation: a negative gamma means deviations are partly corrected next period; half-life = ln(0.5)/ln(1+gamma).'),
    ['d1 <- diff(y)','x1 <- diff(x)',
     'ecm_data <- data.frame(d1 = d1[2:length(d1)], u1 = u[2:(length(u) - 1)], l1 = d1[1:(length(d1) - 1)])',
     'e <- lm(d1 ~ u1 + l1, data = ecm_data)','print(summary(e)$coefficients)',
     'gamma <- coef(e)[2]','cat("half-life:", log(0.5)/log(1 + gamma), "\\n")',
     'plot(u, type = "l", xlab = "t", ylab = "spread", main = "Cointegrating residual")',
     'abline(h = 0, lty = 2)']);
  return{blocks,script:'# FinModel Lab | Experiment 05.5 | cointegration\n\n'+blocks.map(b=>b.code).join('\n\n')+'\n'};
}
return{defaults,check,generate,ols,adf,ecm,run,build,CRIT};
});

;

/* Source: ts-coint-view.js */
/* Experiment05 拓展视图：协整与 ECM（L14 第一节）。挂在时间序列工作台内。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CointMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={p:{...window.CointMath.defaults},built:null,last:null};
function controls(){
  const p=state.p;let host=$('#tsCointControls');
  if(!host){host=document.createElement('section');host.id='tsCointControls';$('#inputs').append(host);
    host.addEventListener('input',()=>{if(read())paint();});
    host.addEventListener('change',()=>{if(read())paint();});}
  host.innerHTML=`<h3>${K.esc(t('协整检验参数','Cointegration settings'))}</h3>
    <p class="lab-note">${K.esc(t('两条对数价格序列共享一个随机趋势；价差是否平稳，决定水平回归是不是伪回归。','Two log price series share a stochastic trend; whether the spread is stationary decides whether the level regression is spurious.'))}</p>
    ${K.select({id:'kind',zh:'情景',en:'Scenario',value:p.kind,options:[['coint','协整（价差均值回复）','Cointegrated (mean-reverting spread)'],['spurious','伪回归（价差随机游走）','Spurious (random-walk spread)']]})}
    ${K.field({id:'n',zh:'样本量',en:'Sample size',value:p.n,min:100,max:1200,step:50})}
    ${K.field({id:'phi',zh:'价差 AR(1) 系数 φ',en:'Spread AR(1) coefficient φ',value:p.phi,min:.5,max:.99,step:.01})}
    ${K.field({id:'beta',zh:'真实协整系数 β',en:'True cointegrating β',value:p.beta,min:.5,max:2,step:.05})}
    ${K.field({id:'lag',zh:'ADF/ECM 滞后阶数',en:'ADF/ECM lag order',value:p.lag,min:1,max:6,step:1})}
    ${K.field({id:'seed',zh:'随机种子',en:'Random seed',value:p.seed,min:1,max:99999999,step:1})}
    ${K.tasks([['先预测：伪回归情景下水平回归的 t 值应该很大还是很小？','Predict first: in the spurious case, should the level regression t-statistic be large or small?'],
      ['把 φ 调到 0.98，观察价差 ADF 与 ECM 的 γ 如何一起变弱。','Set φ to 0.98 and watch the spread ADF and the ECM gamma weaken together.'],
      ['切换两种情景，说明为什么"高 R²"不能证明协整。','Switch scenarios and explain why a high R² does not establish cointegration.']])}`;
  sync();return host;
}
function sync(){for(const [k,v] of Object.entries(state.p)){const el=$('#lab-'+k);if(el&&document.activeElement!==el)el.value=v;}}
function read(){
  const next={...state.p};
  for(const el of $('#tsCointControls').querySelectorAll('input,select')){
    const id=el.id.replace(/^lab-/,'');
    if(el.tagName==='SELECT'){next[id]=el.value;continue;}
    const v=Number(el.value);
    if(el.value.trim()===''||!Number.isFinite(v)){$('#validation').textContent=t('请输入有效数值。','Enter a valid number.');return null;}
    next[id]=v;
  }
  try{M().check(next);}catch(e){$('#validation').textContent=e.message;return null;}
  state.p=next;return next;
}
function paint(){
  const p=state.p;
  const host=$('#chartHost').querySelector('#tsPlot')?$('#tsPlot'):document.querySelector('#tsPlot');
  const plot=host||$('#chartHost');
  plot.innerHTML='<div class="chart-host single-chart"><div class="chart-frame"><h3></h3><div class="svg-host"></div></div></div>';
  const svg=plot.querySelector('.svg-host');
  plot.querySelector('h3').textContent=t('协整价差与 ±2σ 带','Cointegrating spread with ±2σ bands');
  try{
    const q=M().run(p);state.last=q;
    const sd=Math.sqrt(q.spread.reduce((s,v)=>s+v*v,0)/q.spread.length);
    K.chart(svg,{xLabel:['观测','Observation'],yLabel:['价差 u','Spread u'],yZero:true,
      series:[{type:'line',points:q.spread.map((v,i)=>[i+1,v]),color:'#6689a8',tip:d=>[`第 ${Math.round(d[0])} 个观测：价差 ${d[1].toFixed(4)}`,'Observation '+Math.round(d[0])+': spread '+d[1].toFixed(4)]}],
      refs:[{axis:'y',value:2*sd,color:'#b5816f',dash:true},{axis:'y',value:-2*sd,color:'#b5816f',dash:true},{axis:'y',value:0,color:'#9aa7b0',dash:false}],
      aria:['协整价差','Cointegrating spread']});
    K.metrics([['价差 ADF τ','Spread ADF τ',q.adfU.tau.toFixed(2)],['β̂','β̂',q.fit.b.toFixed(3)],['ECM γ','ECM γ',q.ecm.gamma.toFixed(3)]]);
    K.legend([['价差','Spread','#6689a8',false],['±2σ','±2σ','#b5816f',true],['零均值','Zero','#9aa7b0',false]]);
    K.details(K.table([['检验','Test'],['τ / 估计','Statistic'],['5% 临界值','5% critical']],[
      ['ADF x',q.adfX.tau.toFixed(2),q.adfX.crit[5].toFixed(2)],
      ['ADF y',q.adfY.tau.toFixed(2),q.adfY.crit[5].toFixed(2)],
      [t('ADF 价差（E-G）','ADF spread (E-G)'),q.adfU.tau.toFixed(2),q.adfU.crit[5].toFixed(2)],
      [t('协整系数 β̂','Cointegrating β̂'),q.fit.b.toFixed(4),'—'],
      [t('ECM γ','ECM γ'),q.ecm.gamma.toFixed(4),'—'],
      [t('ECM t 值','ECM t-stat'),q.ecm.t.toFixed(2),'—'],
      [t('半衰期（期）','Half-life (periods)'),Number.isFinite(q.ecm.halfLife)?q.ecm.halfLife.toFixed(2):'—','—'],
      [t('水平回归 R²','Level-regression R²'),q.fit.r2.toFixed(3),'—']])+
      `<p class="chart-note">${K.esc(t('结论：','Verdict: '))}${K.esc(q.adfU.reject?t('价差平稳，水平回归可作为协整关系；ECM 的 γ<0 表示偏离被逐步纠正。','The spread is stationary, so the level regression can be read as a cointegrating relation; a negative ECM gamma means deviations are corrected gradually.')
        :t('价差非平稳，水平回归很可能是伪回归；R² 高、t 值大都不能作为协整证据。','The spread is non-stationary, so the level regression is likely spurious; a high R² or a large t does not establish cointegration.'))}${K.esc(t(' E-G 临界值比普通 ADF 更负（约 −3.34），因为价差本身是估计出来的。',' The E-G critical value is more negative than the ordinary ADF one (about -3.34) because the spread is estimated.',' '))}</p>`);
    $('#validation').textContent='';
    state.built=M().build(p,q,K.lang());
    return state.built;
  }catch(e){$('#validation').textContent=e.message;svg.innerHTML='';return null;}
}
function render({p,onBuilt}){
  controls();
  const host=$('#tsCointControls');
  for(const el of $('#inputs').children)if(el!==host)el.hidden=true;
  host.hidden=false;
  const out=paint();
  if(out&&onBuilt)onBuilt(out);
  return out;
}
window.CointView={render,state};
})();

;

/* Source: timeseries-workbench.js */
/* Experiment 05 uses the existing three-pane workbench and course navigation. */
(() => {
  'use strict';
  const M=TimeSeriesMath,L=TimeSeriesLSTM,R=TimeSeriesR,$=s=>document.querySelector(s),{esc}=WorkbenchUI;
  const defaults={form:'log',target:0,stationChart:'series',adf:'drift',adfLag:2,kpss:'level',
    p:1,q:1,armaMode:'manual',armaIC:'BIC',armaChart:'forecast',diagnostic:15,horizon:10,
    varLag:1,varMode:'manual',varIC:'BIC',varChart:'forecast',vars:[0,1],varPlot:'all',from:0,to:1,shock:0,
    compareChart:'rmse',train:.7,valid:.15,features:[0,1],window:12,hidden:8,epochs:40};
  const views=[
    ['station','01 平稳性与数据','为什么金融价格与收益率的平稳性表现可能不同？'],
    ['arma','02 ARMA 建模','一个变量的历史信息能预测多少未来变化？'],
    ['var','03 VAR 与 Granger','其他变量的过去能否改善对目标的预测？'],
    ['compare','04 预测模型比较','LSTM 在同一段测试期比传统模型预测得更好吗？'],
    ['coint','05 协整与 ECM','两条非平稳序列之间，是否存在长期稳定的关系？']
  ];
  const formulas={
    data:String.raw`R_t=P_t/P_{t-1}-1,\quad r_t=\log P_t-\log P_{t-1}`,
    adf:String.raw`\Delta y_t=a+bt+\gamma y_{t-1}+\sum_{j=1}^{k}\delta_j\Delta y_{t-j}+u_t`,
    kpss:String.raw`\mathrm{KPSS}=\frac{\sum_{t=1}^n S_t^2}{n^2\hat{\sigma}_{LR}^2}`,
    acf:String.raw`\hat{\rho}_k=\frac{\sum_{t=k+1}^n (y_t-\bar y)(y_{t-k}-\bar y)}{\sum_{t=1}^n (y_t-\bar y)^2}`,
    arma:String.raw`y_t-\mu=\sum_i\phi_i(y_{t-i}-\mu)+\varepsilon_t+\sum_j\theta_j\varepsilon_{t-j}`,
    order:String.raw`\mathrm{AIC}=-2\ell+2k,\quad \mathrm{BIC}=-2\ell+k\log n`,
    forecast:String.raw`\operatorname{Var}(e_{T+h})=\hat\sigma^2\sum_{i=0}^{h-1}\psi_i^2`,
    var:String.raw`y_t=c+\sum_{\ell=1}^p A_\ell y_{t-\ell}+u_t`,
    roots:String.raw`\max_j |\lambda_j(A_{\mathrm{comp}})|<1`,
    granger:String.raw`F=\frac{(RSS_R-RSS_U)/p}{RSS_U/(n-1-mp)}`,
    irf:String.raw`\Theta_h=\sum_{l=1}^{\min(p,h)}A_l\Theta_{h-l},\quad \Psi_h=\Theta_h P`,
    fevd:String.raw`\omega_{ij}(h)=\frac{\sum_{l=0}^{h}(\Theta_lP)_{ij}^2}{\sum_{k}\sum_{l=0}^{h}(\Theta_lP)_{ik}^2}`,
    joint:String.raw`\hat y_{T+h|T}=c+\sum_{\ell=1}^{p} A_\ell\hat y_{T+h-\ell|T}`,
    split:String.raw`X_t=(y_{t-W},\ldots,y_{t-1})`,
    lstm:String.raw`c_t=f_t\odot c_{t-1}+i_t\odot g_t,\quad h_t=o_t\odot\tanh(c_t)`,
    scores:String.raw`\mathrm{RMSE}=\sqrt{\operatorname{mean}(e_t^2)},\quad \mathrm{MAE}=\operatorname{mean}(|e_t|)`
  };
  const lineNotes=[
    [/raw\[-1.*\/raw/,'简单收益使用相邻价格的比率减 1。'],
    [/Y <- log\(raw/,'对数收益等于相邻价格对数之差。'],
    [/tau <-/,'用滞后水平项的估计系数除以其标准误，再和单位根专用临界值比较。'],
    [/lrv <- lrv/,'Bartlett 权重随滞后阶数线性递减。'],
    [/partial <- pacf/,'PACF 度量移除中间滞后的线性关系。'],
    [/k <- \.995/,'反射系数由 tanh 映射至 (−.995, .995)。'],
    [/v <- v - ar/,'AR 系数乘以过去偏离模型均值的观测。'],
    [/v <- v - ma/,'回推创新时减去过去创新对条件均值的贡献。'],
    [/logLik <-/,'条件高斯对数似然由最优创新均方与有效样本数得到。'],
    [/se <- sqrt\(fit\$sigma2/,'预测误差方差累计各未来创新的响应平方。'],
    [/fit <- lm.fit\(X,Y/,'每个内生变量作为一个方程的响应，共享同一滞后设计。'],
    [/Sigma <- crossprod/,'残差叉积除以共同有效样本数，得到 ML 口径协方差。'],
    [/eigen\(A/,'对伴随矩阵直接求特征值，复根也参与取模。'],
    [/restricted <-/,'仅删除指定来源变量的全部滞后，保留其他解释变量与相同日期。'],
    [/nt <- floor/,'按时间切分。此索引前的观测用于拟合。'],
    [/model\$window,t-1L/,'窗口末期为目标前一期，隐藏状态和记忆在窗口开始置零。'],
    [/x <- \(Y\[k,/,'仅使用训练区保存的中心与尺度来转换输入。'],
    [/memory <- plogis/,'遗忘门保留旧记忆，输入门控制新增候选记忆。'],
    [/model\$center\[D\+1L\]/,'线性输出反标准化，恢复原目标单位。'],
    [/B <- t\(chol/,'Cholesky 下三角把同期相关的残差转成互不相关的结构冲击。'],
    [/Theta\[\[1\]\] <- diag/,'脉冲响应用 Θ_h 递推：每阶自回归系数乘以过去响应后累加。'],
    [/resp <- function/,'第 j 个结构冲击对各变量的响应，按 Cholesky 顺序缩放。'],
    [/share <- function/,'把各冲击的累积平方响应除以总方差，得到份额。']
  ];
  const fmt=(v,d=5)=>Number.isFinite(v)?Number(v.toPrecision(d)).toString():'—';
  const metric=(label,value)=>'<div><span>'+esc(label)+'</span><b>'+esc(value)+'</b></div>';
  const table=(headers,rows)=>'<div class="ts-table"><table><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+
    '</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const disclosure=(title,body)=>'<details><summary>'+esc(title)+'</summary>'+body+'</details>';
  const bool=x=>x?'拒绝':'未拒绝';
  function dataId({names,dates,rows,kind,frequency}) {
    const source=JSON.stringify([names,dates,rows,kind,frequency]);
    let hash=2166136261;
    for (let i=0;i<source.length;i++) hash=Math.imul(hash^source.charCodeAt(i),16777619);
    return (hash>>>0).toString(16).padStart(8,'0');
  }

  function mount() {
    CourseExperiments.mount('timeseries');
    const body=document.body;
    body.classList.add('ts-workbench');
    $('.learning').hidden=true;
    $('#assumptionDetails').hidden=true;
    let gen={...M.defaults},data=M.generate(gen),datasetId=dataId(data),opt=structuredClone(defaults),view='station';
    let importedTable=null,fileText='',fileVersion=0,worker=null,learned=null,attempted=null,runInfo='',progress=null;
    let cache=new Map(),built=null,activeBlock='adf',activeLine=null,codeMode='full',last=null,share=62;
    const seenComparisons=new Set();
    const tabs=document.createElement('nav');
    tabs.id='tsViews'; tabs.setAttribute('aria-label','实验05主视图');
    tabs.innerHTML=views.map(([k,n])=>'<button type="button" data-ts-view="'+k+'">'+n+'</button>').join('');
    $('.model-panel .panel-head').after(tabs);
    const question=document.createElement('p');
    question.id='tsQuestion'; tabs.after(question);
    const controls=document.createElement('div');
    controls.id='tsControls'; question.after(controls);
    $('#chartHost').innerHTML='<h3 id="tsPlotTitle"></h3><div id="tsPlot"></div><div id="tsTip" class="chart-tooltip" hidden></div>';
    const chart=TimeSeriesChart($('#tsPlot'),$('#tsTip'));
    const nav=document.createElement('nav');
    nav.id='tsCodeNav'; nav.setAttribute('aria-label','R 代码段'); $('.code-toolbar').after(nav);
    const dataBox=document.createElement('details');
    dataBox.id='tsData';
    dataBox.innerHTML='<summary>合成数据与本地 CSV</summary><p id="tsSource"></p>'+
      '<form id="tsGen"><div id="tsGenFields"></div><button>生成合成数据</button></form>'+
      '<form id="tsCSV"><p>宽表中每行是同一日期。请选择同频数值列。不同来源须先按实际可用日期对齐。文件留在当前浏览器。</p>'+
      '<label>CSV 文件<input id="tsFile" type="file" accept=".csv,text/csv"></label><div id="tsColumns"></div>'+
      '<label>列类型<select id="tsKind"><option value="price">价格</option><option value="simple">简单收益率</option>'+
      '<option value="log">对数收益率</option><option value="numeric">其他数值</option></select></label>'+
      '<label>单位<select id="tsUnit"><option value="decimal">小数 / 原值</option><option value="percent">百分数数值 ÷100</option></select></label>'+
      '<label>频率<select id="tsFrequency"><option value="daily">日历日</option><option value="weekly">自然周</option>'+
      '<option value="monthly">自然月</option><option value="annual">年度</option><option value="observed">相邻观测 / 交易期</option></select></label>'+
      '<label>缺失处理<select id="tsMissing"><option value="reject">拒绝缺失值</option><option value="drop">确认删除缺失整行</option></select></label>'+
      '<label class="ts-check"><input type="checkbox" id="tsAccept">确认间隔不规则时按相邻观测建模</label>'+
      '<button id="tsImport" disabled>确认导入</button></form><p id="tsDataError" role="status"></p>';
    $('#inputs').after(dataBox);
    const chartChoices={
      station:[['series','时间序列'],['acf','ACF'],['pacf','PACF']],
      arma:[['forecast','预测'],['criteria','定阶准则'],['residual','标准化残差'],['resacf','残差 ACF']],
      var:[['forecast','联合预测'],['criteria','定阶准则'],['granger','Granger 方向'],['irf','脉冲响应 IRF'],['fevd','方差分解 FEVD']],
      compare:[['rmse','RMSE'],['mae','MAE'],['prediction','实际与预测'],['errors','预测误差'],['loss','训练与验证损失']]
    };
    const option=(v,l,selected,raw=false)=>'<option value="'+esc(v)+'" '+(raw?'data-fml-skip ':'')+(String(v)===String(selected)?'selected':'')+'>'+esc(l)+'</option>';
    const select=(id,values,value)=>'<select id="ts-'+id+'" data-opt="'+id+'">'+values.map(([v,l])=>option(v,l,value,!data.synthetic && ['target','from','to','varPlot'].includes(id) && v!=='all')).join('')+'</select>';
    const field=(id,label,values)=>'<label>'+label+select(id,values,opt[id])+'</label>';
    const number=(id,label,value,min,max,step=1)=>'<label>'+label+'<input data-opt="'+id+'" id="ts-'+id+
      '" type="number" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" required></label>';
    const checks=(key,caption,ids)=>'<fieldset class="ts-choice"><legend>'+caption+
      '</legend><div class="ts-chips">'+data.names.map((name,i)=>
      '<label class="ts-chip"><input type="checkbox" data-list="'+key+'" value="'+i+'" '+(ids.includes(i)?'checked':'')+
      '><span'+(data.synthetic?'':' data-fml-skip')+'>'+esc(name)+'</span></label>').join('')+'</div></fieldset>';
    const genFields=()=>$('#tsGenFields').innerHTML=number('seed','随机种子',gen.seed,1,2147483646)+
      number('n','收益样本量',gen.n,120,1600)+number('ar','市场 AR(1) 系数',gen.ar,-.75,.75,.01)+
      number('cross','市场 → 行业滞后系数',gen.cross,-.75,.75,.01)+number('noise','创新标准差',gen.noise,.001,.05,.001);
    genFields();
    function settings() {
      const names=data.names.map((n,i)=>[i,n]), vars=opt.vars.map(i=>[i,data.names[i]]);
      let html=field('target','目标序列',names);
      if (data.kind==='price') html+=field('form','序列尺度',[['price','原始价格'],['simple','简单收益率'],['log','对数收益率']]);
      if (view==='station') html+=field('adf','ADF 确定性项',[['none','无'],['drift','截距'],['trend','截距与趋势']])+
        number('adfLag','ADF 滞后差分数',opt.adfLag,0,12)+field('kpss','KPSS 原假设',[['level','水平平稳'],['trend','趋势平稳']]);
      if (view==='arma' || view==='compare') {
        const armaFields=field('armaMode','ARMA 定阶',[['manual','手动'],['auto','自动']])+
          (opt.armaMode==='manual'?number('p','AR 阶数 p',opt.p,0,5)+number('q','MA 阶数 q',opt.q,0,5):'')+
          (opt.armaMode==='auto' || view==='arma'&&opt.armaChart==='criteria' ? field('armaIC','ARMA 准则',[['AIC','AIC'],['AICc','AICc'],['BIC','BIC']]):'');
        html+=view==='arma'?armaFields:disclosure('ARMA 设置',armaFields);
      }
      if (view==='var' || view==='compare') {
        const varFields=checks('vars','VAR 内生变量',opt.vars)+field('varMode','VAR 定阶',[['manual','手动'],['auto','自动']])+
          (opt.varMode==='manual'?number('varLag','VAR 滞后阶数',opt.varLag,1,5):'')+
          (opt.varMode==='auto' || view==='var'&&opt.varChart==='criteria'?field('varIC','VAR 准则',[['AIC','AIC'],['BIC','BIC'],['HQ','HQ']]):'');
        html+=view==='var'?varFields:disclosure('VAR 设置',varFields);
      }
      if (view==='arma' || view==='var') html+=number('horizon','未来预测期数',opt.horizon,1,40);
      if (view==='arma') html+=disclosure('ARMA 诊断与估计',number('diagnostic','Ljung–Box 滞后 L',opt.diagnostic,1,30)+
        '<p>常均值 μ。条件高斯估计统一将前五期创新置零，不纳入似然。</p>');
      if (view==='var' && vars.length>=2) html+=opt.varChart==='granger'?
        field('from','来源变量',vars)+field('to','响应变量',vars.filter(([i])=>i!==opt.from)):
        opt.varChart==='irf'?field('shock','冲击来源变量',vars):
        opt.varChart==='fevd'?field('shock','方差分解对象',vars):
        field('varPlot','预测展示',[['all','所有 VAR 变量'],...vars]);
      if (view==='compare') html+='<p class="ts-muted">预测跨度：共同滚动一期</p>'+
        number('train','训练比例',opt.train,.5,.85,.01)+number('valid','验证比例',opt.valid,.05,.3,.01)+
        disclosure('LSTM 输入与训练',checks('features','输入变量',opt.features)+
          number('window','输入窗口',opt.window,4,32)+number('hidden','隐藏单元',opt.hidden,4,16)+
          number('epochs','最大训练轮数',opt.epochs,1,80)+
          '<p>Adam · 学习率 0.008 · 批量 32 · 耐心 6 轮 · 种子 731</p>')+
        '<div class="ts-train"><button type="button" id="tsTrain">训练 LSTM</button> <button type="button" id="tsCancel">取消训练</button>'+
        '<p id="tsTrainStatus" role="status"></p></div>';
      const open=[...$('#inputs').querySelectorAll('details')].map(d=>d.open);
      $('#inputs').innerHTML=html;
      $('#inputs').querySelectorAll('details').forEach((d,i)=>d.open=!!open[i]);
      if (view==='compare') { $('#tsTrain').onclick=train; $('#tsCancel').onclick=()=>{stop('训练已取消。'); draw();}; }
    }
    function clearData(next, target=0) {
      stop('');
      data=next; datasetId=dataId(data);
      opt.target=target; opt.form=data.kind==='price'?'log':data.kind;
      opt.vars=[target,...data.names.map((_,i)=>i).filter(i=>i!==target).slice(0,1)].sort((a,b)=>a-b);
      opt.features=opt.vars.slice(); opt.from=opt.vars[0];opt.to=opt.vars[1];opt.varPlot='all';
      learned=null;attempted=null;cache=new Map();seenComparisons.clear();
      settings(); draw();
    }
    function readyData() { return M.transform(data,opt.form); }
    function cached(key, fn) {
      const id=JSON.stringify(key);
      if (!cache.has(id)) {
        if (cache.size>=20) cache.delete(cache.keys().next().value);
        cache.set(id,fn());
      }
      return cache.get(id);
    }
    const armaKey=()=>[opt.armaMode,opt.armaIC,opt.p,opt.q];
    const varKey=()=>[opt.vars,opt.varMode,opt.varIC,opt.varLag];
    function weightKey() { return JSON.stringify([opt.form,opt.target,opt.features,opt.train,opt.valid,opt.window,opt.hidden,opt.epochs]); }
    function weights() {
      if (learned?.key===weightKey()) return learned.model;
      if (attempted!==weightKey() && data.synthetic && Object.keys(M.defaults).every(k=>gen[k]===M.defaults[k]) &&
          weightKey()===JSON.stringify(['log',0,[0,1],.7,.15,12,8,40])) return TimeSeriesWeights;
      return null;
    }
    function stop(message) {
      if (worker) worker.terminate();
      worker=null; progress=null; runInfo=message;
    }
    function trainStatus() {
      if (view!=='compare') return;
      const model=weights(), text=worker ? (progress?'训练第 '+progress.epoch+' 轮 · 验证 MSE '+fmt(progress.validation):'训练已启动…') :
        runInfo || (model ? (model===TimeSeriesWeights?'已载入默认冻结权重':'已训练并冻结权重')+
          ' · 采用第 '+model.bestEpoch+' 轮，共 '+model.curve.length+' 轮' : '当前设置需要训练权重');
      $('#tsTrain').disabled=!!worker;
      $('#tsCancel').hidden=!worker;
      $('#tsTrainStatus').textContent=text;
    }
    function train() {
      const d=readyData(), key=weightKey();
      try {
        attempted=key;learned=null;
        const {nt,nv}=M.split(d.rows.length,opt.train,opt.valid);
        if (!opt.features.length) throw Error('请至少选择一个 LSTM 输入变量。');
        const hashes=window.FINMODEL_BUILD.assets;
        const w=new Worker('timeseries-worker.js?v='+hashes['timeseries-worker.js'].slice(0,16));
        worker=w; runInfo='';progress=null;draw();
        const failed=message=>{stop('训练失败：'+message); draw();};
        w.onerror=e=>{if(worker===w) failed(e.message||'无法加载训练程序。');};
        w.onmessage=({data:message})=>{
          if (worker!==w || key!==weightKey()) return;
          if (message.entry) { progress=message.entry;trainStatus(); }
          if (message.error) failed(message.error);
          if (message.model) { learned={key,model:{...message.model,datasetId}};stop('');draw(); }
        };
        w.postMessage({hashes,rows:d.rows.slice(0,nv),options:{nt,nv,target:opt.target,features:opt.features,
          window:opt.window,hidden:opt.hidden,epochs:opt.epochs}});
      } catch(e) { stop('训练失败：'+e.message);draw(); }
    }

    const unit=d=>({price:'价格原值',log:'对数收益（小数）',simple:'简单收益（小数）',numeric:'原始单位'})[d.form];
    const legend=labels=>$('#legend').innerHTML=labels.map(([text,color])=>
      '<span class="ts-legend"><i style="background:'+color+'"></i>'+esc(text)+'</span>').join('');
    const plot=(title,settings)=>{
      $('#tsPlotTitle').textContent=title;
      chart.draw(settings);
    };
    const metricRow=(...pairs)=>$('#metrics').innerHTML=pairs.map(([label,value])=>metric(label,value)).join('');
    const detail=(html)=>$('#details').innerHTML=html;
    const safeTxt=s=>'<p>'+esc(s)+'</p>';
    const criterion=(rows,ic,format,d)=>{
      const valid=rows.filter(c=>Number.isFinite(c[ic]));
      if (valid.length) plot(ic+' · 相同估计日期', {series:[{name:ic,values:valid.map(c=>c[ic])}],
        labels:valid.map(format),unit:ic,xLabel:'候选阶数',bars:true});
      detail(safeTxt('准则越小越好。不同惩罚可能选出不同阶数，有限样本选择存在不确定性。')+
        disclosure('全部候选与失败状态',table(['阶数','准则','状态'],
          rows.map(c=>[format(c),fmt(c[ic]),c.error||'成功'])))+
        safeTxt('当前样本：'+d.rows.length+' 期'));
    };
    function station(d,y) {
      const q=cached([d.form,opt.target,opt.adf,opt.adfLag,opt.kpss],()=>M.stationarity(y,opt.adf,opt.adfLag,opt.kpss==='trend'));
      const kind=opt.stationChart;
      metricRow(['ADF τ · '+bool(q.adfReject),fmt(q.tau)],['KPSS · '+bool(q.kpssReject),fmt(q.kpss)]);
      const interpretations={
        'true,false':'当前结果与所选平稳性假设较为一致。',
        'false,true':'当前证据提示需进一步检查单位根或其他非平稳形式。'
      };
      let extras='';
      if (kind==='series') plot(data.names[opt.target]+' · '+unit(d),{series:[{name:data.names[opt.target],values:y}],
        labels:d.dates,unit:unit(d),xLabel:data.synthetic?'模拟观测期':'观察日期'});
      else {
        const q=cached(['acf',d.form,opt.target],()=>M.correlogram(y));
        plot(kind.toUpperCase()+' · '+data.names[opt.target],{series:[{name:kind.toUpperCase(),values:q[kind].slice(1)}],
          labels:q[kind].slice(1).map((_,i)=>i+1),unit:'相关系数',xLabel:'滞后（观测期）',bars:true,references:[{value:q.band},{value:-q.band}]});
        extras=safeTxt('虚线为白噪声近似下的点态 ±1.96/√n 参考线。截断与拖尾提供定阶线索，仍需比较估计与残差。');
      }
      detail(safeTxt(interpretations[[q.adfReject,q.kpssReject].join(',')]||
        '两项检验给出不同信号。样本量、趋势设定、结构变化、检验功效及滞后／带宽选择都可能影响结果。')+
        disclosure('检验口径与临界值',table(['检验','原假设','5% 临界值','滞后 / 带宽'],[
          ['ADF','存在单位根',q.critical,opt.adfLag],['KPSS',opt.kpss==='trend'?'趋势平稳':'水平平稳',q.kCritical,q.bw]])+
          safeTxt('ADF 使用 ur.df 的 τ 临界值口径，KPSS 使用 Bartlett 长期方差及短带宽。趋势和单位根描述不同机制，收益率也需要检验。'))+extras);
      return q;
    }
    function arma(d,y) {
      const kind=opt.armaChart, q=cached(['a',d.form,opt.target,...armaKey(),kind==='criteria'],
        ()=>M.selectARMA(y,opt,kind==='criteria')), f=q.fit;
      const h=M.forecastARMA(y,f,opt.horizon), test=M.ljung(f,opt.diagnostic);
      metricRow(['当前模型','ARMA('+f.p+','+f.q+')'],['未来第 1 期',fmt(h[0].value)]);
      if (kind==='criteria') criterion(q.candidates,opt.armaIC,c=>'('+c.p+','+c.q+')',d);
      else if (kind==='residual' || kind==='resacf') {
        const e=f.residual.slice(f.burn).map(x=>x/Math.sqrt(f.sigma2));
        if (kind==='residual') plot('标准化残差',{series:[{name:'残差 / σ',values:e}],labels:d.dates.slice(f.burn),unit:'残差 / σ',xLabel:'观察期',references:[{value:0}]});
        else {
          const c=M.correlogram(e);
          plot('残差 ACF',{series:[{name:'ACF',values:c.acf.slice(1)}],labels:c.acf.slice(1).map((_,i)=>i+1),unit:'相关系数',xLabel:'滞后（观测期）',bars:true,
            references:[{value:c.band},{value:-c.band}]});
        }
        detail(safeTxt(test.p===null?'Ljung–Box 自由度不合法，请选 L > p+q。':
          'Ljung–Box Q = '+fmt(test.Q)+'，df = '+test.df+'，p = '+fmt(test.p)+
          '。残差是未解释的部分。未拒绝只能说明所选滞后的线性相关证据不足。'));
      } else {
        const history=y.slice(-64), n=history.length, blanks=Array(n).fill(null);
        const labels=d.dates.slice(-n).concat(h.map((_,i)=>'未来 '+(i+1)));
        const bounds=(key)=>blanks.concat(h.map(r=>r[key]));
        plot('已观察序列与未来预测',{series:[{name:'历史观测',values:history},
          {name:'ARMA 点预测',values:blanks.slice(1).concat(history.at(-1),h.map(r=>r.value)),points:true}],
          labels,unit:unit(d),xLabel:'观测期与未来期',origin:n-1,bands:[
            {name:'95% 区间',lower:bounds('lo95'),upper:bounds('hi95'),alpha:.15},
            {name:'80% 区间',lower:bounds('lo80'),upper:bounds('hi80'),alpha:.26}]});
        legend([['历史',chart.colors[0]],['点预测',chart.colors[1]],['80% / 95% 预测区间','#cbbbd5']]);
        detail(safeTxt('区间基于条件高斯创新，随预测期数传播，条件于已估参数。以未来观测期标记时间。'));
      }
      $('#details').insertAdjacentHTML('beforeend',safeTxt('AR 使用过去观测偏离均值的信息。MA 使用过去的创新，与移动平均平滑含义不同。')+
        (f.boundary?safeTxt('估计接近反射系数约束边界，参数解释与模型选择需谨慎。'):'')+
        disclosure('系数、似然和预测表',table(['参数','估计'],[
          ['μ',fmt(f.mu)],...f.ar.map((v,i)=>['φ'+(i+1),fmt(v)]),...f.ma.map((v,i)=>['θ'+(i+1),fmt(v)]),['σ²',fmt(f.sigma2)],
          ...['logLik','AIC','AICc','BIC'].map(k=>[k,fmt(f[k])])])+
          safeTxt('有效估计样本 '+(y.length-f.burn)+'。AR/MA 多项式由反射系数约束，近边界或阶数选择后不展示常规 Wald 显著性。')+
          table(['未来期','点预测','80% 下 / 上','95% 下 / 上'],h.map((r,i)=>[i+1,fmt(r.value),fmt(r.lo80)+' / '+fmt(r.hi80),fmt(r.lo95)+' / '+fmt(r.hi95)]))));
      return {q,forecast:h,test};
    }
    function varView(d) {
      const kind=opt.varChart, v=d.rows.map(r=>opt.vars.map(i=>r[i]));
      if (opt.vars.length<2) throw Error('VAR 需要至少两个同期变量。请选择额外变量或导入多变量 CSV。');
      const result=cached(['v',d.form,...varKey(),kind==='criteria'],()=>{
        const q=M.selectVAR(v,opt,kind==='criteria'), f=q.fit, names=opt.vars.map(i=>data.names[i]);
        const roots=M.roots(f), max=Math.max(...roots.map(r=>r.abs));
        const tests=names.flatMap((_,from)=>names.flatMap((__,to)=>from===to?[]:[{from,to,...M.granger(v,f,from,to)}]));
        return {q,names,roots,max,tests};
      });
      const {q,names,roots,max,tests}=result,f=q.fit, h=M.forecastVAR(v,f,opt.horizon);
      if (h.flat().some(x=>!Number.isFinite(x))) throw Error('联合预测超出有限数值范围，请检查稳定性或缩短跨度。');
      metricRow(['当前模型','VAR('+f.p+')'],[max<1?'稳定 · 最大特征值模':'不稳定 · 最大特征值模',fmt(max)]);
      if (kind==='criteria') criterion(q.candidates,opt.varIC,c=>String(c.p),d);
      else if (kind==='granger') {
        $('#tsPlotTitle').textContent='Granger 条件预测关系';
        $('#tsPlot').innerHTML='<div class="ts-directions">'+tests.map(({from,to,p})=>{
          const a=opt.vars[from],b=opt.vars[to],active=a===opt.from&&b===opt.to;
          return '<button type="button" data-direction="'+a+','+b+'" aria-pressed="'+active+'"><span>'+esc(names[from])+
            ' → '+esc(names[to])+'</span><b class="'+(p<.05?'ts-significant':'')+'">'+'p = '+fmt(p)+'</b><small>'+(p<.05?'有额外预测信息':'证据不足')+'</small></button>';
        }).join('')+'</div>';
        $('#tsPlot').querySelectorAll('[data-direction]').forEach(btn=>btn.onclick=()=>{
          [opt.from,opt.to]=btn.dataset.direction.split(',').map(Number);settings();draw();
        });
        const t=tests.find(t=>opt.vars[t.from]===opt.from&&opt.vars[t.to]===opt.to)||tests[0];
        detail(safeTxt(names[t.from]+' → '+names[t.to]+' · F('+t.df1+', '+t.df2+') = '+fmt(t.F)+'，p = '+fmt(t.p)+
          '。'+(t.p<.05?'当前设定下，来源变量的滞后提供额外预测信息。':'当前设定下，额外预测信息的证据不足。'))+
          safeTxt('检验原假设为来源变量的 p 个滞后系数联合为零。经典 F 参考依赖模型及误差假设，结构性因果需要额外识别。'));
      } else if (kind==='irf'||kind==='fevd') {
        const slot=opt.vars.includes(Number(opt.shock))?opt.vars.indexOf(Number(opt.shock)):0;
        if (kind==='irf') {
          const r=M.irf(f,{horizon:opt.horizon});
          const rows=r.response[slot], peak=Math.max(...rows.map(v=>Math.max(...v.map(x=>Math.abs(x)))));
          plot('正交化脉冲响应 · '+names[slot],{series:names.map((n,i)=>({name:n,values:rows.map(v=>v[i]),color:chart.colors[i+1]})),
            labels:rows.map((_,i)=>String(i)),unit:'响应（1 个标准差冲击）',xLabel:'期数 h',references:[{value:0}]});
          legend(names.map((n,i)=>[n,chart.colors[i+1]]));
          metricRow(['冲击来源',names[slot]],['h = 0 · 自身响应',fmt(rows[0][slot])],['最大绝对响应',fmt(peak)]);
          detail(safeTxt('脉冲响应是一个结构冲击后各变量随期数的路径。Cholesky 分解按列顺序识别冲击，排在前面的变量同期不受后面变量影响；换顺序曲线会变，这不是估计误差。')+
            (max>=1?safeTxt('伴随矩阵存在模 ≥1 的特征值，脉冲响应不会收敛，长期解读无效。'):'')+
            table(['h',...names],rows.map((v,i)=>[String(i),...v.map(x=>fmt(x))]))+
            disclosure('同期影响矩阵（Cholesky 下三角）',table(['变量',...names],r.chol.map((row,i)=>[names[i],...row.map(x=>fmt(x))]))));
        } else {
          const r=M.fevd(f,{horizon:opt.horizon});
          plot('方差分解 · '+names[slot],{series:names.map((n,j)=>({name:n,values:r.series[slot][j],color:chart.colors[j+1]})),
            labels:r.series[slot][0].map((_,i)=>String(i)),unit:'份额（0–1）',xLabel:'期数 h',references:[{value:1}]});
          legend(names.map((n,j)=>[n,chart.colors[j+1]]));
          metricRow(['分解对象',names[slot]],['h = '+opt.horizon+' · 自身份额',fmt(r.share[slot][slot])],['总计',fmt(r.share[slot].reduce((a,b)=>a+b,0))]);
          detail(safeTxt('方差分解把某个变量的预测误差方差按冲击来源拆分，同一期各行份额合计为 1。它依赖识别顺序，不能单独证明某个冲击在结构上更重要。')+
            table(['冲击来源','h = 0','h = '+opt.horizon],names.map((n,j)=>[n,fmt(r.series[slot][j][0]),fmt(r.series[slot][j][opt.horizon])]))+
            disclosure('全部期数份额',table(['h',...names],r.series[slot][0].map((_,i)=>[String(i),...names.map((__,j)=>fmt(r.series[slot][j][i]))]))));
        }
      } else {
        const ids=opt.varPlot==='all'?names.map((_,i)=>i):[opt.vars.indexOf(opt.varPlot)];
        const history=v.slice(-45),n=history.length, labels=d.dates.slice(-n).concat(h.map((_,i)=>'未来 '+(i+1)));
        const series=ids.flatMap(i=>[{name:names[i]+' · 历史',values:history.map(r=>r[i]),color:chart.colors[i+1]},
          {name:names[i]+' · 预测',values:Array(n-1).fill(null).concat(history.at(-1)[i],h.map(r=>r[i])),color:chart.colors[i+1],dash:'6 3',points:true}]);
        plot('VAR 联合多期点预测',{series,labels,unit:unit(d),xLabel:'观测期与未来期',origin:n-1});
        legend(ids.map(i=>[names[i],chart.colors[i+1]]).concat([['虚线为未来预测','#7e7490']]));
        detail(safeTxt('每个方程同时使用自身与系统中其他变量的滞后。未来各变量联合递推。'));
      }
      const terms=['截距',...Array.from({length:f.p},(_,i)=>names.map(name=>name+' L'+(i+1))).flat()];
      $('#details').insertAdjacentHTML('beforeend',
        (max>=1?safeTxt('伴随矩阵存在模 ≥1 的特征值。长期预测和常规平稳 VAR 推断需谨慎。'):'')+
        disclosure('系数、协方差、稳定性与预测表',safeTxt('逐方程 OLS，共同有效样本 '+f.n+'，残差协方差按 UᵀU/n。')+
          table(['解释变量',...names],terms.map((term,j)=>[term,...f.coef.map(a=>fmt(a[j]))]))+
          table(['协方差',...names],f.cov.map((r,j)=>[names[j],...r.map(x=>fmt(x))]))+
          table(['实部','虚部','模'],roots.map(r=>[fmt(r.re),fmt(r.im),fmt(r.abs)]))+
          table(['未来期',...names],h.map((r,i)=>[i+1,...r.map(x=>fmt(x))]))+
          disclosure('拟合值与残差 · 最后 5 期',table(['日期',...names.map(n=>n+' 拟合'),...names.map(n=>n+' 残差')],
            f.fits[0].residual.slice(-5).map((_,i)=>[d.dates.at(i-5),...f.fits.map(a=>fmt(a.fitted.at(i-5))),...f.fits.map(a=>fmt(a.residual.at(i-5)))])))));
      return {...result,forecast:h};
    }
    function compare(d) {
      const key=['c',d.form,opt.target,opt.train,opt.valid,...armaKey(),...varKey()];
      seenComparisons.add(JSON.stringify([...key,weightKey()]));
      const q=cached(key,()=>M.compare(d.rows,opt.target,opt.vars,opt)), model=weights();
      const models={...q.models};
      if (model) {
        try {
          const prediction=q.actual.map((_,i)=>L.predict(d.rows,q.nv+i,model));
          if (prediction.some(v=>!Number.isFinite(v))) throw Error('LSTM 预测包含无效值。');
          const errors=prediction.map((v,i)=>v-q.actual[i]), n=errors.length;
          models.LSTM={prediction,rmse:Math.sqrt(errors.reduce((s,v)=>s+v*v,0)/n),mae:errors.reduce((s,v)=>s+Math.abs(v),0)/n};
        } catch(e) { models.LSTM={error:e.message}; }
      } else models.LSTM={error:worker?'训练中':runInfo||'当前数据与设置没有匹配权重'};
      const names=Object.keys(models), valid=names.filter(k=>!models[k].error), kind=opt.compareChart;
      const measure=kind==='mae'?'mae':'rmse', sorted=valid.slice().sort((a,b)=>models[a][measure]-models[b][measure]);
      const best=sorted[0], second=sorted[1];
      metricRow([measure.toUpperCase()+' 最低',best+' · '+fmt(models[best][measure])],['训练 / 验证 / 测试',
        q.nt+' / '+(q.nv-q.nt)+' / '+q.actual.length]);
      if (kind==='rmse'||kind==='mae') plot('共同测试日期 · 一期 '+kind.toUpperCase()+' · '+valid.length+' 个可用模型',{
        series:[{name:kind.toUpperCase(),values:valid.map(k=>models[k][kind]),barColors:valid.map(k=>chart.colors[names.indexOf(k)+1])}],
        labels:valid,unit:unit(d),xLabel:'模型',bars:true});
      else if (kind==='loss') {
        if (model) {
          plot('LSTM · 训练与验证 MSE',{series:[{name:'训练',values:model.curve.map(x=>x.train)},
            {name:'验证',values:model.curve.map(x=>x.validation)}],labels:model.curve.map(x=>x.epoch),
            unit:'标准化 MSE',xLabel:'训练轮次',mark:model.curve.map(x=>x.epoch===model.bestEpoch?'恢复此轮权重':'')});
          legend([['训练',chart.colors[0]],['验证',chart.colors[1]]]);
        } else { $('#tsPlotTitle').textContent='LSTM 训练记录';$('#tsPlot').textContent=models.LSTM.error; }
      } else {
        const series=valid.map(k=>({name:k,color:chart.colors[names.indexOf(k)+1],
          values:models[k].prediction.map((v,i)=>kind==='errors'?q.actual[i]-v:v),
          dash:['Naive','VAR'].includes(k)?'5 3':''}));
        if (kind==='prediction') series.unshift({name:'实际值',values:q.actual,color:chart.colors[0]});
        plot(kind==='errors'?'一期预测误差（实际 − 预测）':'共同测试日期 · 实际与一期预测',{
          series,labels:d.dates.slice(q.nv),unit:unit(d),xLabel:'测试观测期',references:kind==='errors'?[{value:0}]:[]});
        legend(series.map(s=>[s.name,s.color]));
      }
      detail(safeTxt((second?'当前 '+measure.toUpperCase()+' 最低的是 '+best+'，与次低 '+second+' 相差 '+
        fmt(models[second][measure]-models[best][measure])+'。':'当前仅 '+best+' 有可比较结果。')+
        ' 结论只描述本样本。ARMA 使用目标历史，VAR 和 LSTM 可使用不同的多变量信息。')+
        safeTxt('参数只用训练期拟合，LSTM 用随后验证期早停。测试期每个目标日前只使用已观测历史。'+
          (seenComparisons.size>1?' 已在本次会话重复查看不同设定的留出结果，适合作为探索性比较。':''))+
        disclosure('指标、模型状态与日期',table(['模型','RMSE','MAE','状态'],names.map(k=>
          [k,fmt(models[k].rmse),fmt(models[k].mae),models[k].error||'日期完整对齐']))+
          safeTxt('目标 '+data.names[opt.target]+'，测试 '+d.dates[q.nv]+' 至 '+d.dates.at(-1)+'，共 '+q.actual.length+' 期。方向命中也需交易成本与执行假设才能讨论经济表现。')+
          (model?safeTxt('LSTM '+model.version+' · '+model.window+' 期窗口 · '+model.hidden+' 个隐藏单元 · 输入 '+
            model.features.map(i=>data.names[i]).join('、')+' · 最佳轮 '+model.bestEpoch+' / 实跑 '+model.curve.length+'。')+
            safeTxt('数据版本 '+datasetId+' · '+unit(d)+' · 训练 '+d.dates[0]+' 至 '+d.dates[q.nt-1]+
              ' · 验证 '+d.dates[q.nt]+' 至 '+d.dates[q.nv-1]+'。'):'')+
          (q.armaModel?safeTxt('训练期 ARMA('+q.armaModel.p+','+q.armaModel.q+')'):'')+
          (q.varModel?safeTxt('训练期 VAR('+q.varModel.p+') · '+opt.vars.map(i=>data.names[i]).join('、')):'')));
      trainStatus();
      return {...q,models,model};
    }

    const coreBlock={station:'adf',arma:'arma',var:'var',compare:'split'};
    function scrollToBlock(id) {
      const pane=$('#code'), block=document.getElementById('ts-code-'+id);
      if (block) pane.scrollTop+=block.getBoundingClientRect().top-pane.getBoundingClientRect().top;
    }
    function renderCode() {
      $('#copy').disabled=!built;
      if (!built) { nav.innerHTML='';$('#code').innerHTML='';$('#explanation').textContent='当前模型没有可复现的有效输出。';return; }
      if (!built.blocks.some(b=>b.id===activeBlock)) {activeBlock=built.blocks[0].id;activeLine=null;}
      nav.innerHTML=built.blocks.map(b=>'<button type="button" data-block="'+b.id+'">'+esc(b.title)+'</button>').join('');
      const shown=codeMode==='full'?built.blocks:built.blocks.filter(b=>b.id===activeBlock);
      let count=0;
      $('#code').innerHTML=shown.map(b=>'<section class="logic-block" id="ts-code-'+b.id+'">'+
        b.code.split('\n').map((line,i)=>{
          count++;
          const key=b.id+':'+i;
          const original=WorkbenchUI.colorCode(line||' '), translated=FML_TIMESERIES_I18N.comment(line);
          const source=translated===line ? original : '<span class="ts-comment-en">'+original+
            '</span><span class="ts-comment-zh">'+WorkbenchUI.colorCode(translated)+'</span>';
          return '<button type="button" class="code-line" data-line="'+key+'" data-block="'+b.id+'"><span class="line-number">'+count+
            '</span><code data-fml-skip>'+source+'</code></button>';
        }).join('')+'</section>').join('');
      explain(activeBlock,activeLine);
    }
    function explain(id,line) {
      if (!built) return;
      activeBlock=id;activeLine=line;
      const b=built.blocks.find(x=>x.id===id), source=line?b.code.split('\n')[Number(line.split(':')[1])]:'';
      const note=lineNotes.find(([pattern])=>pattern.test(source||''))?.[1];
      $('#explanation').innerHTML='<h3>'+esc(b.title)+'</h3><p>'+esc(note||b.text)+'</p>'+
        (formulas[id]?'<div id="tsFormula"></div>':'');
      if (formulas[id]) katex.render(formulas[id],$('#tsFormula'),{throwOnError:false});
      nav.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.block===id)));
      $('#code').querySelector('.ts-selected')?.classList.remove('ts-selected');
      const button=line?$('#code [data-line="'+line+'"]'):null;
      if (button) button.classList.add('ts-selected');
    }
    function draw(focusCore=false) {
      const d=readyData(), {form, target}=opt, scroll=$('#code').scrollTop;
      const key=view+'Chart';
      chart.clear();
      if(view==='coint'){
        if(!window.CointView)throw Error('协整视图未加载。');
        const out=window.CointView.render({data:d,onBuilt:c=>{built={blocks:c.blocks,script:c.script};activeBlock=c.blocks[0].id;activeLine=null;renderCode();}});
        tabs.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.tsView===view)));
        question.textContent=window.LabKit.t('两条非平稳序列之间，是否存在长期稳定的关系？','Do two non-stationary series share a stable long-run relation?');
        controls.innerHTML='';
        $('#graphKind').textContent=window.LabKit.t(data.synthetic?'合成数据':'本地 CSV',data.synthetic?'Synthetic data':'Local CSV');
        if($('#tsPlotTitle'))$('#tsPlotTitle').textContent='';
        $('#assumptionSummary').innerHTML='<span>'+esc(window.LabKit.t('对数价格','Log prices'))+'</span><span>'+esc(window.LabKit.t(data.synthetic?'合成数据':'本地 CSV',data.synthetic?'Synthetic data':'Local CSV'))+'</span>';
        return;
      }
      const cv=$('#tsCointControls');if(cv)cv.hidden=true;
      for(const el of $('#inputs').children)el.hidden=false;
      tabs.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.tsView===view)));
      question.textContent=views.find(([k])=>k===view)[2];
      controls.innerHTML='<label>主图 '+select(key,chartChoices[view],opt[key])+'</label>';
      body.dataset.tsSource=data.synthetic?'synthetic':'csv';
      $('#graphKind').textContent=data.synthetic?'合成数据':'本地 CSV';
      const sourceNotes=[data.synthetic?'合成金融时间序列，非真实市场行情。':'本地 CSV，仅在本机处理。',
        data.frequency+' · 当前有效 '+d.rows.length+' 期 · 清洗损失 '+data.lost+' 行',
        ...(data.kind==='price'&&form!=='price'?['转换首期损失 1 行。']:[]),...data.warnings];
      $('#tsSource').innerHTML=sourceNotes.map(note=>'<span>'+esc(note)+'</span>').join(' ');
      $('#assumptionSummary').innerHTML='<span>'+esc(unit(d))+'</span><span>'+esc(data.frequency)+' · '+d.rows.length+' 期</span>'+
        (data.synthetic?'<span>合成金融时间序列，非真实市场行情。</span>':'<span>清洗损失 '+data.lost+' 行</span>');
      $('#validation').textContent='';$('#legend').textContent='';
      $('#tsPlotTitle').textContent='';$('#tsPlot').textContent='';detail('');
      try {
        const y=d.rows.map(r=>r[target]);
        M.validate(y);
        last=view==='station'?station(d,y):view==='arma'?arma(d,y):view==='var'?varView(d):compare(d);
        built=R.build(view,data,{...opt,chart:opt[key]},last.model,last.models);
      } catch(e) {
        last=built=null;$('#validation').textContent=e.message;metricRow(['当前设定','结果不可用']);
        $('#tsPlotTitle').textContent='当前设定无法计算';$('#tsPlot').textContent=e.message;
        detail('');$('#legend').textContent='';trainStatus();
      }
      renderCode();
      $('#code').scrollTop=scroll;
      if (focusCore) scrollToBlock(activeBlock);
    }
    function update(e) {
      const el=e.target, id=el.dataset.opt, list=el.dataset.list;
      if (!id&&!list) return;
      const old=weightKey();
      if (list) {
        opt[list]=[...$('#inputs').querySelectorAll('[data-list="'+list+'"]:checked')].map(x=>Number(x.value));
        if (list==='vars') {
          opt.from=opt.vars[0];opt.to=opt.vars[1];opt.varPlot='all';
        }
      } else {
        const number=el.type==='number'||['target','from','to'].includes(id)||id==='varPlot'&&el.value!=='all';
        if (el.type==='number' && !el.checkValidity()) {
          el.value=opt[id]; $('#validation').textContent='请输入 '+el.min+'–'+el.max+' 范围内的值。'; return;
        }
        opt[id]=number?Number(el.value):el.value;
        if (id==='from'&&opt.from===opt.to) opt.to=opt.vars.find(j=>j!==opt.from);
      }
      if (old!==weightKey()) { stop('');attempted=null; }
      const focused=list && document.activeElement===el;
      settings();draw();
      if (focused) $('#inputs [data-list="'+list+'"][value="'+el.value+'"]')?.focus({preventScroll:true});
    }
    if(window.LabKit)window.LabKit.onLang(()=>{if(view==='coint')draw();});
    $('#inputs').onchange=controls.onchange=update;
    tabs.onclick=e=>{
      const id=e.target.dataset.tsView;
      if (!id||id===view) return;
      view=id;activeBlock=coreBlock[id];activeLine=null;$('#code').scrollTop=0;
      settings();draw(true);
    };
    nav.onclick=e=>{
      const id=e.target.dataset.block;
      if (!id) return;
      if (codeMode==='basic') {activeBlock=id;activeLine=null;renderCode();}
      else {
        explain(id,null);
        scrollToBlock(id);
      }
    };
    $('#code').onclick=e=>{
      const el=e.target.closest('[data-line]');
      if (el) explain(el.dataset.block,el.dataset.line);
    };
    $('.code-toolbar').addEventListener('click',e=>{
      if (!e.target.dataset.codeMode) return;
      codeMode=e.target.dataset.codeMode;
      $('.code-toolbar').querySelectorAll('[data-code-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.codeMode===codeMode)));
      renderCode();$('#code').scrollTop=0;
    });
    $('#tsGen').onsubmit=e=>{
      e.preventDefault();
      try {
        const next=Object.fromEntries(Object.keys(gen).map(k=>[k,Number($('#ts-'+k).value)])), d=M.generate(next);
        gen=next;$('#tsDataError').textContent='';clearData(d);
      } catch(error) { $('#tsDataError').textContent=error.message; }
    };
    $('#tsFile').onchange=async e=>{
      const file=e.target.files[0], v=++fileVersion;
      importedTable=null;fileText='';$('#tsImport').disabled=true;$('#tsColumns').textContent='';$('#tsDataError').textContent='';
      if (!file) return;
      try {
        if (file.size>2e6) throw Error('CSV 限制为 2 MB。');
        const text=await file.text();
        if (v!==fileVersion) return;
        importedTable=RegMath.csvTable(text);
        fileText=text;
        const choices=option('','请选择','')+importedTable.names.map(n=>option(n,n,'',true)).join('');
        $('#tsColumns').innerHTML='<label>日期列<select id="tsDate" required>'+choices+
          '</select></label><label>预测目标<select id="tsTarget" required>'+choices+
          '</select></label><fieldset><legend>额外数值列（最多两个）</legend>'+
          importedTable.names.map((n,i)=>'<label class="ts-check"><input type="checkbox" data-csv-column="'+i+'"><span data-fml-skip>'+esc(n)+'</span></label>').join('')+'</fieldset>';
        function syncColumns() {
          const reserved=[$('#tsDate').value,$('#tsTarget').value];
          $('#tsColumns').querySelectorAll('[data-csv-column]').forEach(x=>{
            x.disabled=reserved.includes(importedTable.names[Number(x.dataset.csvColumn)]);
            if (x.disabled) x.checked=false;
          });
        }
        $('#tsDate').onchange=$('#tsTarget').onchange=syncColumns;
        $('#tsImport').disabled=false;
      } catch(error) { if (v===fileVersion) $('#tsDataError').textContent=error.message; }
    };
    $('#tsCSV').onsubmit=e=>{
      e.preventDefault();
      if (!importedTable) return;
      try {
        const additional=[...$('#tsColumns').querySelectorAll('[data-csv-column]:checked')]
          .map(x=>importedTable.names[Number(x.dataset.csvColumn)]);
        const columns=[$('#tsTarget').value,...additional];
        const next=M.importData(fileText,{date:$('#tsDate').value,columns,kind:$('#tsKind').value,unit:$('#tsUnit').value,
          frequency:$('#tsFrequency').value,missing:$('#tsMissing').value,acceptGaps:$('#tsAccept').checked});
        $('#tsDataError').textContent='已确认 '+next.rows.length+' 个同期日期。'; clearData(next);
      } catch(error) { $('#tsDataError').textContent=error.message; }
    };
    function info(title,text) { $('#infoTitle').textContent=title;$('#infoBody').textContent=text;ModalUI.open($('#infoDialog')); }
    for (const id of ['#catalog','#catalogMobile']) $(id).onclick=()=>ModalUI.open($('#catalogDialog'));
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
    $('#help').onclick=()=>info('实验 05 · 自由探索','任意切换四个视图。先对照价格与收益率，再观察定阶、残差、联合预测与测试误差。CSV 宽表只在浏览器内处理。');
    $('#teacher').onclick=()=>info('约 12 分钟课堂演示','3 分钟比较价格和收益率的 ADF/KPSS，3 分钟 ARMA 诊断与预测区间，3 分钟比较双向 Granger，3 分钟在共同留出期比较模型并复制 R。');
    const practice=document.createElement('button');
    practice.id='rStudioPractice';practice.textContent='RStudio 实践';$('.code-toolbar').append(practice);
    practice.onclick=()=>info('RStudio · 运行当前完整脚本','复制代码并粘贴到新的 R Script，全选运行。脚本只依赖 Base R，内含当前数据和设定。已有 LSTM 模型时含冻结权重推断。');
    $('#copy').onclick=async()=>{
      if (!built) return;
      try { await navigator.clipboard.writeText(built.script);$('#toast').textContent='已复制完整 R 代码'; }
      catch { $('#toast').textContent='复制权限不可用，请在完整代码视图中选择所需内容。'; }
      const toast=$('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);
    };
    $('#projector').onclick=()=>{
      const on=body.classList.toggle('projector');
      $('#projector').setAttribute('aria-pressed',String(on));chart.clear();
    };
    const resize=v=>{
      share=Math.max(40,Math.min(75,v));$('#splitter').setAttribute('aria-valuenow',String(Math.round(share)));
      $('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',100-share+'fr');
    };
    $('#splitter').onkeydown=e=>{if (['ArrowDown','ArrowUp'].includes(e.key)) {e.preventDefault();resize(share+(e.key==='ArrowDown'?2:-2));}};
    $('#splitter').onpointerdown=e=>{
      const el=e.currentTarget,y=e.clientY,start=share,h=$('.code-regions').clientHeight;
      el.setPointerCapture(e.pointerId);el.onpointermove=event=>resize(start+100*(event.clientY-y)/h);
      el.onlostpointercapture=()=>el.onpointermove=null;
    };
    $('#reset').onclick=()=>{
      gen={...M.defaults};opt=structuredClone(defaults);genFields();
      fileVersion++;importedTable=null;fileText='';$('#tsCSV').reset();$('#tsColumns').textContent='';
      $('#tsImport').disabled=true;$('#tsDataError').textContent='';
      activeBlock='data';activeLine=null;clearData(M.generate(gen));
    };
    window.TimeSeriesLab={snapshot:()=>structuredClone({view,opt,data,last,script:built?.script,status:runInfo})};
    settings();draw(true);
  }
  window.TimeSeriesWorkbench={mount};
})();

;

/* Source: bs-tree-view.js */
/* Experiment11 拓展 · 二叉树（CRR）多期定价（课件 9.3）。
   以独立面板挂到 Black–Scholes 页，避免改动既有定价/对冲工作台。 */
(()=>{'use strict';
const K=window.LabKit,M=()=>window.CAPMHMMath,$=s=>document.querySelector(s),t=(zh,en)=>K.t(zh,en);
const state={kind:'call',american:true,steps:12,sigma:.2,active:false,q:null,built:null};
function mount(){
  if($('#bstModel'))return;
  const model=document.createElement('section');model.id='bstModel';model.className='bstree-only';
  const params=document.createElement('section');params.id='bstParams';params.className='bstree-only';
  const code=document.createElement('section');code.id='bstCode';code.className='bstree-only';
  $('.model-panel').append(model);$('.parameters').append(params);$('.code-panel').append(code);
  state.paramsHost=params;
  renderParams();
  model.innerHTML=`<h3 id="bstTitle" style="padding:10px 16px 0;font:500 14px/1.5 var(--font-ui)"></h3>
    <div id="bstMetrics" class="metrics"></div>
    <div class="chart-host single-chart" style="margin:0 14px"><div class="chart-frame"><div class="svg-host" id="bstPlot"></div></div></div>
    <div id="bstLegend" class="legend"></div>
    <div id="bstDetails" class="model-details"></div>`;
  code.innerHTML=`<div id="bstCodePane"></div>`;
  params.addEventListener('input',()=>compute());
  params.addEventListener('change',()=>compute());
  $('#bstBack').onclick=()=>activate(false);
  K.onLang(()=>{if(state.active){renderParams();compute();}});
}
function renderParams(){
  const host=state.paramsHost;if(!host)return;
  host.innerHTML=`<h2>${K.esc(t('二叉树参数','Binomial-tree parameters'))}</h2>
    <div id="bstControls">
      ${K.select({id:'kind',zh:'期权类型',en:'Option type',value:state.kind,options:[['call','看涨 Call','Call'],['put','看跌 Put','Put']]})}
      ${K.field({id:'steps',zh:'步数 N',en:'Steps N',value:state.steps,min:1,max:60,step:1})}
      ${K.field({id:'sigma',zh:'波动率 σ',en:'Volatility σ',value:state.sigma,min:.05,max:.8,step:.01})}
      ${K.check({id:'american',zh:'允许提前行权（美式）','en':'Allow early exercise (American)',value:state.american})}
    </div>
    <p class="lab-note">${K.esc(t('S₀=K=100、T=1、r=5%：只改变步数与期权类型，观察树价如何逼近连续时间解。','S₀ = K = 100, T = 1, r = 5%: change only the step count and the option type to watch the tree price approach the continuous-time value.'))}</p>
    ${K.tasks([['先预测：步数从 1 增加时，树价是单调逼近 Black–Scholes 吗？','Predict first: as the step count grows, does the tree price approach Black–Scholes monotonically?'],
      ['切换为看跌期权，比较欧式与美式的价差。','Switch to a put and compare the European and American prices.'],
      ['把 σ 调到 0.6，说明为什么收敛会更慢。','Set σ to 0.6 and explain why convergence slows down.']])}
    <button type="button" id="bstBack">${K.esc(t('返回 Black–Scholes','Back to Black-Scholes'))}</button>`;
  host.querySelector('#bstBack').onclick=()=>activate(false);
  host.oninput=()=>compute();
  host.onchange=()=>compute();
}
function compute(){
  const kind=$('#lab-kind').value,steps=Number($('#lab-steps').value),sigma=Number($('#lab-sigma').value),american=$('#lab-american').checked;
  state.kind=kind;state.steps=steps;state.sigma=sigma;state.american=american;
  const model=$('#bstModel'),plot=$('#bstPlot');
  try{
    const M0=M();const p={...M0.defaults,sigma};
    M0.check({...p});
    /* 用统一的 σ 覆盖：binomial 内部固定 σ=0.2，这里通过临时对象传入 */
    const q=M0.binomial({...p,nSteps:steps}, {kind,american});
    state.q=q;state.built=M0.build('tree',p,k2(q),K.lang());
    $('#bstTitle').textContent=t('树价随步数收敛到连续时间解','Tree price converging to the continuous-time value');
    K.chart(plot,{xLabel:['步数 N','Steps N'],yLabel:['期权价格（元）','Option price (CNY)'],xTickFormat:v=>String(Math.round(v)),
      series:[{type:'line',points:q.conv.map(c=>[c.k,c.price]),color:'#6689a8',marker:true,tip:d=>[`N=${Math.round(d[0])}：树价 ${d[1].toFixed(4)}`,'N='+Math.round(d[0])+': tree '+d[1].toFixed(4)]}],
      refs:[{axis:'y',value:q.bs,color:'#b5816f',dash:true,label:['Black–Scholes','Black-Scholes']}],
      aria:['树价收敛','Tree convergence']});
    $('#bstMetrics').innerHTML=[['树价（美式）','Tree price (American)',q.amer.toFixed(4)],['欧式树价','European tree',q.euro.toFixed(4)],['BS 连续解','BS value',q.bs.toFixed(4)]]
      .map(([z,e,v])=>`<div><span>${K.esc(t(z,e))}</span><b>${K.esc(v)}</b></div>`).join('');
    $('#bstLegend').innerHTML=[['树价','Tree price','#6689a8',false],['Black–Scholes','Black-Scholes','#b5816f',true]]
      .map(([z,e,c,d])=>`<span><i style="--legend-color:${c};--legend-style:${d?'dashed':'solid'}"></i>${K.esc(t(z,e))}</span>`).join('');
    $('#bstDetails').innerHTML=K.table([['项目','Item'],['数值','Value']],[
      [t('看涨 / 看跌','Call / put'),kind==='put'?'Put':'Call'],
      [t('步数 N','Steps N'),String(q.steps)],
      [t('上涨/下跌因子 u','Up factor u'),q.u.toFixed(4)],
      [t('风险中性概率 p','Risk-neutral p'),q.pu.toFixed(4)],
      [t('欧式树价','European'),q.euro.toFixed(4)],
      [t('美式树价','American'),q.amer.toFixed(4)],
      [t('提前行权溢价','Early-exercise premium'),q.americanPremium.toFixed(4)],
      [t('BS 连续解','Black-Scholes'),q.bs.toFixed(4)],
      [t('树价 − BS','Tree − BS'),q.error.toFixed(4)]])+
      `<p class="chart-note">${K.esc(t('二叉树是风险中性定价的离散版本；美式期权在每个节点比较继续持有与立即行权。看涨期权在无股息时不提前行权，因此欧式与美式同价。','The binomial tree is the discrete version of risk-neutral pricing; an American option compares continuation with immediate exercise at each node. A call on a non-dividend stock is never exercised early, so both prices coincide.'))}</p>`;
    $('#bstCodePane').innerHTML='';
    renderCode();
  }catch(e){
    $('#bstModel h3').textContent=t('参数无效','Invalid parameters');
    plot.innerHTML='';
    $('#bstDetails')?.remove();
  }
}
function k2(q){return q;}
function renderCode(){
  const b=state.built;
  const pane=$('#bstCodePane');
  pane.innerHTML=`<div class="panel-head"><h2>${K.esc(t('R 代码','R code'))}</h2><button type="button" id="bstCopy">${K.esc(t('复制完整 R 代码','Copy full R code'))}</button></div>`+
    b.blocks.map(bl=>`<section class="logic-block"><h3 style="padding:6px 16px 0">${K.esc(bl.title)}</h3>${bl.lines.map(l=>`<div class="code-line" style="cursor:default"><span class="num"></span><code>${WorkbenchUI.colorCode(l)}</code></div>`).join('')}</section>`).join('');
  $('#bstCopy').onclick=async()=>{
    try{await navigator.clipboard.writeText(b.code);$('#bstCopy').textContent=t('已复制','Copied');}
    catch{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([b.code],{type:'text/plain;charset=utf-8'}));a.href=u;a.download='experiment11-binomial.R';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  };
}
function activate(on){
  mount();
  state.active=on;
  if(on){
    /* teaching-mode 只暴露 #tu* 面板，会连带隐藏本视图：先退出教学模式。 */
    document.body.classList.remove('teaching-mode','bs-expert');
    document.body.classList.add('bstree-active');
    document.querySelectorAll('[data-bs-module]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bsModule==='tree')));
    compute();
  }else{
    document.body.classList.remove('bstree-active');
    document.querySelectorAll('[data-bs-module]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(window.TeachingUX)TeachingUX.open('pricing');
  }
}
window.BSTreeView={mount,activate,state};
})();

;

/* Source: experiments.js */
(()=>{'use strict';const $=s=>document.querySelector(s),M=ExperimentMath,L=ExperimentLessons,U=WorkbenchUI,{esc}=U;const requested=new URLSearchParams(location.search).get('model'),id=requested&&CourseExperiments.byModel(requested)&&requested!=='portfolio'?requested:'var',cfg=L.configs[id];let p={...(cfg?.defaults||{})},built,selected=0,codeMode='full',learning={phase:'Idle'},share=62,bsModule='pricing';
const money=x=>U.format('money',x),percent=x=>U.format('percent',x),precise=x=>U.format('variance',x),beta=x=>U.format('beta',x);
function colorCode(s){const pattern=/(#.*$|"(?:[^"\\]|\\.)*"|(?:\b\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|\b[A-Za-z][\w.]*(?=\()|<-|<=|>=|!=|%\*%|==|[+*\/^=<>-])/g;let html='',last=0;for(const match of s.matchAll(pattern)){const token=match[0];html+=esc(s.slice(last,match.index));const cls=token.startsWith('#')?'comment':token.startsWith('"')?'string':/^(\d|\.\d)/.test(token)?'number':/^[A-Za-z]/.test(token)?'function':'operator';html+=`<span class="syntax-${cls}">${esc(token)}</span>`;last=match.index+token.length;}return html+esc(s.slice(last));}
U.colorCode=colorCode;
const labs={rbasic:'RBasicWorkbench',dataprep:'DataPrepWorkbench',returns:'ReturnsWorkbench',factor:'FactorWorkbench',fund:'FundWorkbench'};
if(labs[id]&&window[labs[id]]){window[labs[id]].mount();return;}
if(id==='timeseries'){TimeSeriesWorkbench.mount();return;}
if(id==='regression'){RegWorkbench.mount();return;}
if(id==='capm'){CAPMWorkbench.mount();return;}
if(id==='var'){RiskWorkbench.mount();return;}
if(id==='garch'){VolWorkbench.mount();return;}
CourseExperiments.mount(id);$('#copy').textContent='复制完整 R 代码';$('#labNav').href='experiments.html?model='+id;document.body.dataset.model=id;$('#assumptions').textContent=cfg.assumptions;$('#question').textContent=cfg.question;
const summaries={var:['合成情景','1日损失','历史 / 正态法'],bs:['欧式 · 连续股息','常数波动率','连续复利'],garch:['固定合成冲击','平稳 GARCH(1,1)','非市场拟合'],capm:['理论 SML','合成月度样本','独立 OLS 回归']};$('#assumptionSummary').innerHTML=summaries[id].map(s=>`<span>${s}</span>`).join('');$('#assumptionDetails').ontoggle=()=>$('#assumptionDetails summary').textContent=$('#assumptionDetails').open?'收起完整模型假设':'查看完整模型假设';
$('#inputs').innerHTML=cfg.inputs.map(([k,label,min,max])=>`<label id="field-${k}" for="input-${k}"><span>${label}</span><input id="input-${k}" type="number" min="${min}" max="${max}" step="${k==='n'?1:'any'}" value="${p[k]}"></label>`).join('');
if(id==='bs'){
 const bar=document.createElement('div');bar.id='bsModules';bar.className='bs-modules';bar.setAttribute('role','group');bar.setAttribute('aria-label','实验11学习模块');bar.innerHTML='<button data-bs-module="pricing" aria-pressed="true">定价基础</button><button data-bs-module="dividend" aria-pressed="false">红利与敏感性</button><button data-bs-module="iv" aria-pressed="false">隐含波动率求解</button><button data-bs-module="hedge" aria-pressed="false">Delta 风险对冲</button><button data-bs-module="tree" aria-pressed="false">二叉树定价</button>';$('.model-panel .panel-head').after(bar);
 const guide=document.createElement('p');guide.id='bsModuleGuide';guide.className='bs-module-guide';bar.after(guide);
 const controls=document.createElement('section');controls.id='dividendControls';controls.hidden=true;controls.innerHTML='<label for="qSlider">连续股息 q · 0% → 5%</label><input id="qSlider" type="range" min="0" max="0.05" step="0.001" value="0" aria-label="连续股息收益率滑块"><p id="dividendComparison" aria-live="polite"></p>';$('#inputs').after(controls);
 $('#qSlider').oninput=()=>{$('#input-q').value=$('#qSlider').value;update();};
 bar.onclick=e=>{const b=e.target.closest('[data-bs-module]');if(!b)return;if(b.dataset.bsModule==='tree'){window.BSTreeView.activate(true);return;}window.BSTreeView.activate(false);TeachingUX.open(b.dataset.bsModule);};
 const practice=document.createElement('button');practice.id='rStudioPractice';practice.textContent='在 RStudio 实践';$('.code-toolbar').append(practice);practice.onclick=()=>openInfo('在 RStudio 实践','1. 点击“复制代码”，在 RStudio 新建 R Script，粘贴后全选运行；只需基础 R。网页本身不运行 R。\n2. 用默认 S=K=100、T=1、r=0.05、sigma=0.2、q=0，保存 Call、Put 与 Greeks。\n3. 将 q 改为0.05，再全选运行。比较两次结果，并计算 C−P−S*exp(−q*T)+K*exp(−r*T)，应接近0。\n4. 完整代码中分别尝试 T=0、sigma=0，解释 NA；不要将到期收益写成净利润。');
 const again=document.createElement('button');again.id='bsReexperiment';again.textContent='重新实验（q 回到 0%）';$('#exit').before(again);again.onclick=()=>{learning.phase='Experiment';p={...cfg.defaults};learning.start={...p};learning.before=L.build(id,p).q;write(p);update();};
 const restart=document.createElement('button');restart.id='bsRestart';restart.textContent='重新预测';$('#exit').before(restart);restart.onclick=()=>{const origin=learning.origin;learning={phase:'Predict',origin};p={...cfg.defaults};write(p);update();};
}
function renderBSModule(){if(id!=='bs')return;const active=learning.phase!=='Idle',predict=learning.phase==='Predict';document.querySelectorAll('[data-bs-module]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.bsModule===bsModule));b.disabled=active;});$('#bsModuleGuide').textContent=bsModule==='pricing'?'01 · 从参数到贴现项、正态权重与价格；点击 R 语句查看公式。默认 q=0。':'02 · 固定其他条件，比较连续股息；Greeks 使用含 q 公式。';$('#dividendControls').hidden=bsModule!=='dividend'||predict;$('#qSlider').max=String(Math.max(.05,p.q));$('#qSlider').value=p.q;$('#qSlider').disabled=active&&learning.phase!=='Experiment';const zero=M.bs({...p,q:0});$('#dividendComparison').textContent=`同参数 q=0 基准：Call ${money(zero.C)} / Put ${money(zero.P)} 元。当前 q=${percent(p.q)}：Call ${money(built.q.C)} / Put ${money(built.q.P)} 元。${p.T===0?'到期时 q 不影响到期收益。':''}`;$('#bsReexperiment').hidden=!['Experiment','Explain'].includes(learning.phase);$('#bsRestart').hidden=!active;}
function raw(){return Object.fromEntries(cfg.inputs.map(([k])=>[k,$('#input-'+k).value.trim()===''?NaN:Number($('#input-'+k).value)]));}function write(v){for(const[k,x]of Object.entries(v))$('#input-'+k).value=x;}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2500);}
function update(){FinancialCharts.hide();try{const next=raw();M.validate(id,next);p=next;built=TeachingCode.build(id,p,codeMode);if(selected>=built.blocks.length)selected=0;$('#validation').textContent='';for(const[k]of cfg.inputs)$('#input-'+k).removeAttribute('aria-invalid');render();}catch(e){$('#validation').textContent=e.message+' 保留上次有效结果；请修正后复制或继续探索。';$('#copy').disabled=true;$('#explain').disabled=true;for(const[k]of cfg.inputs)if($('#input-'+k).value===''||!$('#input-'+k).checkValidity()||(id==='garch'&&['a','b'].includes(k)))$('#input-'+k).setAttribute('aria-invalid','true');}}
function render(){const scroll=$('#code').scrollTop;let row=0;$('#code').innerHTML=built.blocks.map((b,i)=>`<div class="logic-block" data-logic="${i}">${b.lines.map(line=>`<button class="code-line ${i===selected?'selected':''}" data-block="${i}" aria-pressed="${i===selected}" aria-label="第${++row}行：${esc(b.title)}"><span class="num">${row}</span><code>${colorCode(line)}</code></button>`).join('')}</div>`).join('');$('#code').scrollTop=scroll;$('#copy').disabled=false;document.querySelectorAll('[data-code-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.codeMode===built.mode));b.disabled=b.dataset.codeMode==='basic'&&built.boundary;});$('#codeNotice').textContent=built.boundary?'当前为边界情景，使用完整实现':built.mode==='basic'?'可独立运行 · 当前参数':'含边界处理与完整绘图';explain();draw();renderLearning();renderBSModule();}
function explain(){const b=built.blocks[selected];$('#explanation').innerHTML=`<h3>${esc(b.title)}</h3><p>${esc(b.action)}</p><div class="formula"></div><p class="current-value">${esc(b.value)}</p><p class="economic">金融含义：${esc(b.economic)}</p>`;katex.render(b.formula,$('#explanation .formula'),{throwOnError:false});for(const[k]of cfg.inputs)$('#field-'+k).classList.toggle('linked',b.links.includes(k));}
function select(index,reveal=false){selected=index;render();if(reveal){const el=$('#code [data-block="'+selected+'"]');el?.scrollIntoView({block:'nearest',inline:'nearest'});$('#explanation').scrollTop=0;}}
$('#code').onclick=e=>{const b=e.target.closest('[data-block]');if(b)select(Number(b.dataset.block));};$('#inputs').addEventListener('input',update);document.querySelectorAll('[data-code-mode]').forEach(b=>b.onclick=()=>{codeMode=b.dataset.codeMode;selected=0;update();});
function metric(label,value,key=''){return `<div data-link="${key}"><span>${label}</span><b>${value}</b></div>`;}function table(headers,rows){return `<table><thead><tr>${headers.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr data-link="${row[3]||''}"><th scope="row">${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('')}</tbody></table>`;}
function legendButton(key,label,color,dash){return `<button data-tip="${key}" aria-label="查看${label}"><i style="--legend-color:${color};--legend-style:${dash?'dashed':'solid'}"></i>${label}</button>`;}
function draw(){const q=built.q,b=built.blocks[selected],active=b.mark;$('#graphKind').textContent={var:'1日 · 合成情景',bs:'欧式 · 连续股息',garch:'合成递推',capm:'理论 / 样本'}[id];if(id==='var'){
$('#metrics').innerHTML=metric('历史 VaR · 元',money(q.hVaR),'hVaR')+metric('历史 ES · 元',money(q.hES),'hES');$('#legend').innerHTML=legendButton('hVaR','历史 VaR','#659b8a',false)+legendButton('hES','历史 ES','#659b8a',true)+legendButton('nVaR','正态 VaR','#9b88ac',false)+legendButton('nES','正态 ES','#9b88ac',true)+legendButton('tail','最坏尾部','#659b8a',false);$('#details').innerHTML=table(['方法','VaR（元）','ES（元）'],[['历史模拟',money(q.hVaR),money(q.hES)],['正态参数',money(q.nVaR),money(q.nES)]])+`<p class="chart-note">绿色：最坏 ${percent(1-p.alpha)} 的历史概率质量；紫线：正态密度。密度单位1／万元，面积保持不变。</p>`;
}else if(id==='bs'){
$('#metrics').innerHTML=metric('Call · 元／股',money(q.C),'call')+metric('Put · 元／股',money(q.P),'put');$('#legend').innerHTML=legendButton('call','Call','#6689a8',false)+legendButton('put','Put','#659b8a',false)+legendButton(p.S===p.K?'SK':'S',p.S===p.K?'S = K':'现价 S','#9b88ac',true)+(p.S===p.K?'':legendButton('K','执行价 K','#6689a8',true));const greek=x=>U.format('greek',x);$('#details').innerHTML=table(['Greeks · 单位','Call','Put'],[['Delta · 元/元',greek(q.deltaC),greek(q.deltaP),'delta'],['Gamma · 1/元',greek(q.gamma),greek(q.gamma),'gamma'],['Vega · 元/1百分点',greek(q.vega),greek(q.vega),'vega'],['Theta · 元/日历天',greek(q.thetaC),greek(q.thetaP),'theta']])+`<p class="chart-note">d₁=${precise(q.d1)} · d₂=${precise(q.d2)}<br>C−P=${money(q.C-q.P)} = Se⁻ᑫᵀ−Ke⁻ʳᵀ；${p.T===0||p.sigma===0?'边界未定义项为“—”':'Theta按365天换算'}。</p>`;
}else if(id==='garch'){
$('#metrics').innerHTML=metric('持久性 α + β',beta(q.persistence))+metric('理论长期标准差',percent(Math.sqrt(q.long)));$('#legend').innerHTML=legendButton('shock','第41期冲击','#9b88ac',true)+legendButton('response','第42期响应','#9b88ac',true);$('#details').innerHTML=`<p class="chart-note" data-link="recursion">h₄₂ = ω + αε₄₁² + βh₄₁<br>${precise(q.h[41])} = ${precise(p.omega)} + ${precise(p.a*q.eps[40]**2)} + ${precise(p.b*q.h[40])}</p>`;
}else{
$('#metrics').innerHTML=metric('理论年度预期收益',percent(q.expected),'sml')+metric('理论 β / 样本 β̂',`<span class="inline-number" data-link="theory-beta">${beta(p.beta)}</span> / <span class="inline-number" data-link="scl">${beta(q.b)}</span>`);$('#legend').innerHTML=legendButton('sml','SML · 理论','#6689a8',false)+legendButton('scl','SCL · 样本','#659b8a',false);$('#details').innerHTML=`<p class="chart-note" data-link="scl">样本 α̂=${precise(q.a*100)}%／月，β̂=${beta(q.b)}。固定60个月确定性合成数据；理论输入不改变样本估计。</p>`;}
document.querySelectorAll('[data-link]').forEach(el=>el.classList.toggle('is-linked',(el.dataset.link===active&&!!active)||(active==='greeks'&&['delta','gamma','vega','theta'].includes(el.dataset.link))));FinancialCharts.render(id,p,q,active,mark=>{const index=built.blocks.findIndex(b=>id==='garch'?b.lines.some(x=>x.includes('for(t')):b.mark===mark);if(index>=0)select(index,true);});}
function comparisonText(){const a=learning.before,b=built.q;if(!a)return '';switch(id){case'var':return `历史VaR：${money(a.hVaR)} → ${money(b.hVaR)} 元；ES：${money(a.hES)} → ${money(b.hES)} 元。`;case'bs':return `Call：${money(a.C)} → ${money(b.C)} 元；Put：${money(a.P)} → ${money(b.P)} 元。`;case'garch':return `第42期标准差：${percent(Math.sqrt(a.h[41]))} → ${percent(Math.sqrt(b.h[41]))}。`;default:return `年度预期收益：${percent(a.expected)} → ${percent(b.expected)}。`;}}
function renderLearning(){const active=learning.phase!=='Idle',predict=learning.phase==='Predict',experiment=learning.phase==='Experiment';$('#choices').innerHTML=cfg.choices.map((v,i)=>`<button data-choice="${i}" aria-pressed="${learning.choice===i}" ${active&&!predict?'disabled':''}>${v}</button>`).join('');$('#confirm').hidden=active&&!predict;$('#confirm').disabled=learning.choice===undefined;$('#explain').hidden=!experiment;$('#explain').disabled=experiment&&p[cfg.exploreKey]===learning.start[cfg.exploreKey];$('#exit').hidden=!active;$('#answer').hidden=learning.phase!=='Explain';$('#answer').textContent=learning.phase==='Explain'?`${learning.choice===cfg.correct?'预测正确。':'本次预测需要修正。'}${cfg.answer} ${comparisonText()}`:'';$('#learningStatus').textContent=predict?'预测阶段：参数锁定。':experiment?`仅开放 ${cfg.exploreKey}：${cfg.start} → ${cfg.target}。`:learning.phase==='Explain'?'解释阶段：结果锁定。':'确认后载入题设情景；退出恢复原参数。';$('#learningProgress').querySelectorAll('li').forEach((el,i)=>el.setAttribute('aria-current',String(i===({Idle:0,Predict:0,Experiment:1,Explain:2}[learning.phase]))));for(const[k]of cfg.inputs)$('#input-'+k).disabled=active&&(!experiment||k!==cfg.exploreKey);$('#reset').disabled=active;if(id==='bs')renderBSModule();}
$('#openExplore').onclick=()=>{const open=$('#learningContent').hidden;if(id==='bs'&&open&&learning.phase==='Idle'){learning={phase:'Predict',origin:{...p}};p={...cfg.defaults};write(p);update();}$('#learningContent').hidden=!open;$('#openExplore').setAttribute('aria-expanded',String(open));$('#openExplore').textContent=open?'收起探索':'开始探索 →';if(open)$('#question').scrollIntoView({block:'nearest'});};
$('#choices').onclick=e=>{const c=e.target.closest('[data-choice]');if(!c)return;try{M.validate(id,raw());}catch{toast('请先修正参数');return;}if(learning.phase==='Idle')learning={phase:'Predict',origin:{...p},choice:Number(c.dataset.choice)};else learning.choice=Number(c.dataset.choice);renderLearning();renderBSModule();};
$('#confirm').onclick=()=>{learning.phase='Experiment';p={...cfg.defaults,[cfg.exploreKey]:cfg.start};learning.start={...p};learning.before=L.build(id,p).q;write(p);update();};$('#explain').onclick=()=>{if($('#validation').textContent)return;if(p[cfg.exploreKey]!==cfg.target){$('#learningStatus').textContent=`请将 ${cfg.exploreKey} 调至 ${cfg.target}。`;return;}learning.phase='Explain';renderLearning();renderBSModule();$('#answer').scrollIntoView({block:'nearest'});};$('#exit').onclick=()=>{p={...learning.origin};learning={phase:'Idle'};write(p);update();};$('#reset').onclick=()=>{p={...cfg.defaults};selected=0;write(p);update();};
$('#copy').onclick=async()=>{try{M.validate(id,raw());const code=TeachingCode.build(id,p,'full').code;try{await navigator.clipboard.writeText(code);toast('已复制完整 R 代码，可在RStudio整体运行');}catch{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([code+'\n'],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=id+'-full.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已下载完整可运行R脚本');}}catch{toast('请先修正参数');}};
for(const s of ['#catalog','#catalogMobile'])$(s).onclick=()=>ModalUI.open($('#catalogDialog'));document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#help').onclick=()=>openInfo('帮助与资源','点击R语句查看作用、公式、当前数值和金融含义。基础／完整代码均可按当前参数独立运行；期权边界自动切换至完整实现。图例按钮和图中参考线支持点击、触屏及键盘查看详情。长行可在代码区水平滚动。模型假设可展开；探索只开放题设参数。');$('#teacher').onclick=()=>openInfo('教师提示',cfg.teacher);function openInfo(title,t){$('#infoTitle').textContent=title;$('#infoBody').textContent=t;ModalUI.open($('#infoDialog'));}
function projection(on){document.body.classList.toggle('projector',on);$('#projector').setAttribute('aria-pressed',String(on));requestAnimationFrame(FinancialCharts.draw);}$('#projector').onclick=()=>projection(!document.body.classList.contains('projector'));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))projection(false);});function resize(value){share=Math.max(40,Math.min(75,value));$('.code-regions').style.setProperty('--code-fr',share+'fr');$('.code-regions').style.setProperty('--explain-fr',(100-share)+'fr');$('#splitter').setAttribute('aria-valuenow',share);}$('#splitter').onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();resize(e.key==='Home'?40:e.key==='End'?75:share+(e.key==='ArrowDown'?2:-2));}};$('#splitter').onpointerdown=e=>{const splitter=$('#splitter');splitter.setPointerCapture(e.pointerId);const start=e.clientY,initial=share,height=$('.code-regions').clientHeight;splitter.onpointermove=e=>resize(initial+(e.clientY-start)/height*100);splitter.onpointerup=()=>{splitter.onpointermove=null;};};if(id!=='bs'){const b=document.createElement('button');b.id='rStudioPractice';b.textContent='RStudio 实践';$('.code-toolbar').append(b);b.onclick=()=>openInfo('RStudio 实践','新建空白R Script，复制完整R代码并整段运行。仅需基础R，无额外包。脚本包含与网页相同的固定合成数据或确定性序列；不是只凭相同seed假定不同语言随机序列相同。修改一个参数后重新复制并核对当前结果。');}update();if(id==='bs')TeachingUX.mount({openExpert:module=>{FinancialCharts.hide();if(learning.phase!=='Idle'){p={...(learning.origin||cfg.defaults)};learning={phase:'Idle'};write(p);}IVWorkbench.activate(module==='iv');HedgeWorkbench.activate(module==='hedge');if(module&&!['iv','hedge'].includes(module)){bsModule=module;codeMode='full';built=TeachingCode.build(id,p,'full');render();}document.querySelectorAll('[data-bs-module]').forEach(b=>{b.disabled=false;if(module)b.setAttribute('aria-pressed',String(b.dataset.bsModule===module));});}});})();

;