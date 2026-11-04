
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
 ['R软件基础实验','R基础'],['金融市场数据整理与预处理','数据预处理'],['资产收益率计算','收益率'],['多元回归与逐步回归分析','多元回归','regression'],['ARMA与VAR模型','ARMA / VAR','timeseries'],
 ['GARCH类波动率模型','GARCH','garch'],['VaR与ES投资风险计算','VaR / ES','var'],['均值-方差投资组合决策分析','均值-方差','portfolio'],['资本资产定价模型的R语言实验','CAPM','capm'],['因子模型与APT模型','因子 / APT'],['Black-Scholes期权定价','Black-Scholes','bs'],['证券投资基金绩效评价','基金绩效']];
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

/* Source: math.js */
(function(root){
'use strict';
const ranges={w:[0,1],mu1:[-1,1],mu2:[-1,1],s1:[0,1],s2:[0,1],rho:[-1,1]};
function validate(p){return Object.keys(ranges).filter(k=>typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<ranges[k][0]||p[k]>ranges[k][1]);}
function parseInputs(raw){const p={},invalid=[];for(const k of Object.keys(ranges)){const v=raw[k];if((typeof v!=='string'&&typeof v!=='number')||String(v).trim()===''||!Number.isFinite(Number(v))){invalid.push(k);continue;}p[k]=Number(v)/(k==='rho'?1:100);}return {p,invalid:[...new Set([...invalid,...validate(p)])]};}
function checked(p){const invalid=validate(p);if(invalid.length)throw new RangeError('Invalid parameters: '+invalid.join(', '));}
function calculate(p,w){const b=1-w,terms=[w*w*p.s1*p.s1,b*b*p.s2*p.s2,2*w*b*p.s1*p.s2*p.rho];
// Equivalent nonnegative form avoids catastrophic cancellation at rho = -1.
const variance=(w*p.s1-b*p.s2)**2+2*w*b*p.s1*p.s2*(1+p.rho);
return {w,mean:w*p.mu1+b*p.mu2,variance,sd:Math.sqrt(variance),terms};}
function portfolio(p,w=p.w){checked(p);if(!Number.isFinite(w)||w<0||w>1)throw new RangeError('Invalid weight');return calculate(p,w);}
function model(p){checked(p);const D=(p.s1-p.s2)**2+2*p.s1*p.s2*(1-p.rho),flat=D===0,equal=p.mu1===p.mu2;
const mv=flat?(p.mu1>=p.mu2?1:0):Math.max(0,Math.min(1,(p.s2*(p.s2-p.s1)+p.s1*p.s2*(1-p.rho))/D));
const efficient=w=>equal?(flat||Math.abs(w-mv)<1e-10):flat?Math.abs(w-(p.mu1>p.mu2?1:0))<1e-10:(p.mu1>p.mu2?w>=mv-1e-10:w<=mv+1e-10);
const weights=[...new Set([...Array.from({length:401},(_,i)=>i/400),mv])].sort((a,b)=>a-b);
return {mv,flat,equal,D,efficient,points:weights.map(w=>({...calculate(p,w),efficient:efficient(w)})),current:calculate(p,p.w),minimum:calculate(p,mv)};}
function compareCorrelation(baseline,p){if(['w','mu1','mu2','s1','s2'].some(k=>p[k]!==baseline[k]))return {status:'changed'};
const before=portfolio(baseline),after=portfolio(p),delta=after.sd-before.sd;
const tolerance=Number.EPSILON*32*Math.max(before.sd,after.sd,1e-10);
return {status:p.rho<baseline.rho?'lowered':p.rho>baseline.rho?'raised':'waiting',before:before.sd,after:after.sd,direction:Math.abs(delta)<=tolerance?'same':delta<0?'down':'up',varianceDelta:2*p.w*(1-p.w)*p.s1*p.s2*(p.rho-baseline.rho)};}
root.FinMath={validate,parseInputs,portfolio,model,compareCorrelation};if(typeof module!=='undefined')module.exports=root.FinMath;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: chart-scale.js */
/* Viewport ranges only; the financial model remains in FinMath. */
(function(root){
'use strict';
function range(points){const xs=points.map(q=>q.sd),ys=points.map(q=>q.mean),lo=Math.min(...xs),hi=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys),xpad=hi===0?.01:Math.max((hi-lo)*.1,hi*.025),ypad=Math.max((top-bottom)*.14,.005);return{xmin:Math.max(0,lo-xpad),xmax:hi+xpad,ymin:bottom-ypad,ymax:top+ypad};}
function union(a,b){return a?{xmin:Math.min(a.xmin,b.xmin),xmax:Math.max(a.xmax,b.xmax),ymin:Math.min(a.ymin,b.ymin),ymax:Math.max(a.ymax,b.ymax)}:{...b};}
function contains(a,points){return points.every(q=>q.sd>=a.xmin&&q.sd<=a.xmax&&q.mean>=a.ymin&&q.mean<=a.ymax);}
root.FinScale={range,union,contains};if(typeof module!=='undefined')module.exports=root.FinScale;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: teaching.js */
/* Deterministic teaching helpers. Portfolio arithmetic stays in FinMath. */
(function(root){
'use strict';
const keys=['w','mu1','mu2','s1','s2','rho'];
function dominates(q,p){const rt=32*Number.EPSILON*Math.max(Math.abs(q.mean),Math.abs(p.mean),1e-300),vt=64*Number.EPSILON*Math.max(q.variance,p.variance,1e-300);return q.mean>=p.mean-rt&&q.variance<=p.variance+vt&&(q.mean>p.mean+rt||q.variance<p.variance-vt);}
function diagnosis(p){const m=FinMath.model(p),q=m.current,candidate=m.minimum;const witness=dominates(candidate,q)?candidate:null;return{efficient:!witness,witness,current:q,minimum:m.minimum,flat:m.flat,equal:m.equal,mv:m.mv,strictRiskImprovement:!!witness&&!m.flat&&witness.variance<q.variance-64*Number.EPSILON*Math.max(witness.variance,q.variance,1e-300),reason:m.flat?(m.equal?'风险收益完全相同，所有权重等价。':'方差不随权重变化，但最高预期收益端点可以支配较低收益配置。'):m.equal?'预期收益相同，最小方差位置才不被其他配置支配。':'方差关于权重为凸函数；有效部分从全局最小方差点通向高预期收益端点。'};}
function snapshot(p,label='手动设置'){return Object.freeze({params:Object.freeze({...p,wB:1-p.w}),result:FinMath.portfolio(p),label});}
function comparison(base,p){const q=FinMath.portfolio(p),changed=keys.filter(k=>base.params[k]!==p[k]);return{base,current:snapshot(p,'当前模型'),changed,multiple:changed.length>1,riskDelta:(q.sd-base.result.sd)*100};}
// Configurable teaching example bounds, NOT universal market reasonableness rules.
const exampleRange={maxAbsReturn:.30,maxVolatility:.60,highReturn:.20,lowVolatility:.05};
function notices(p,config=exampleRange){const reasons=[];for(const a of [1,2]){const name=a===1?'A':'B';if(Math.abs(p['mu'+a])>config.maxAbsReturn)reasons.push(`资产${name}收益假设超出示例范围`);if(p['s'+a]>config.maxVolatility)reasons.push(`资产${name}波动率超出示例范围`);if(p['mu'+a]>config.highReturn&&p['s'+a]<config.lowVolatility)reasons.push(`资产${name}同时采用高收益与低波动假设`);}return reasons;}
function interpretation(id,p,m){const q=m.current,nonzero=p.w>0&&p.w<1&&p.s1>0&&p.s2>0;switch(id){case 'returns':return '收益率是同一分析期的假设输入，不是已实现收益或市场预测。';case 'volatility':return '标准差衡量同一分析期的波动幅度；组合风险还取决于共同波动。';case 'weights':return 'wB=1−wA使资金全部分配；0≤wA≤1的约束同时排除卖空。';case 'mean':return '收益由资产预期收益和投资比例决定；相关系数不直接进入这条收益公式。';case 'variance':return `自身项由权重与各资产波动决定，协方差项体现共同变化。在其余参数固定、禁止卖空时，${nonzero?'降低相关系数会严格降低组合方差。':'当前存在零权重或零波动率，改变形式参数ρ不影响组合方差。'}负相关不保证风险完全消失。`;case 'sd':return '开平方将方差变回与收益率相同的量纲。标准差不是各资产标准差的简单加权平均。';case 'minimum':case 'curvature':return `全局最小方差目标是风险最低，不是收益最高或对所有偏好都最佳。${m.flat?'本例所有权重同为最小方差解；有效性仍需比较收益。':'对凸方差函数求导并考虑不卖空边界。'} 本例当前风险${(q.sd*100).toFixed(2)}%、最小风险${(m.minimum.sd*100).toFixed(2)}%；相应收益为${(q.mean*100).toFixed(2)}%与${(m.minimum.mean*100).toFixed(2)}%。${dominates(m.minimum,q)?'本例最小方差配置确实支配当前配置。':'最低风险不能被直接解读为收益也更高。'}`;case 'efficient':return '有效组合不被风险不更高且收益不更低、至少一项严格更优的可行组合支配。它表达模型内的权衡，不是现实投资选择的全部依据。';default:return '';}}
const presets=[{id:'A',name:'基础组合',purpose:'观察权重如何影响收益与风险',raw:{w:50,mu1:8,mu2:14,s1:12,s2:22,rho:.2}},{id:'B',name:'相关性实验',purpose:'固定权重，从较高相关性开始逐步降低ρ',raw:{w:50,mu1:8,mu2:14,s1:12,s2:22,rho:.8}},{id:'C',name:'非有效组合',purpose:'极端假设案例：验证更高收益、同时更低风险的支配关系',raw:{w:40,mu1:90,mu2:14,s1:12,s2:22,rho:-.77}}];
const quiz=[{question:'其他参数固定、禁止卖空时，降低相关系数对组合方差的作用是？',options:['一定严格下降','不会增加；正权重且正波动时严格下降','收益率也一定下降'],answer:1,why:'协方差项系数2wAwBσAσB非负；零权重或零波动时可以不变。',step:'variance'},{question:'w2 <- 1 - w1 的作用是？',options:['令权重合计为1，另需0≤w1≤1限制卖空','令两资产风险相同','自动寻找最高收益'],answer:0,why:'该行保证全部资金分配；不卖空还依赖权重范围约束。',step:'weights'},{question:'为什么不能直接加权两资产标准差作为组合风险？',options:['所有组合风险都相同','方差含协方差项，且标准差由总方差开平方得到','标准差不能用小数表示'],answer:1,why:'共同变化进入2wAwBσAσBρ；先合并方差，再开平方。',step:'sd'},{question:'什么情况下一个组合不是均值—方差有效组合？',options:['只要收益不是最高','只要没有等权投资','存在风险不更高、收益不更低且至少一项严格更优的可行配置'],answer:2,why:'支配必须同时比较收益与风险；最低风险也不等于最高收益。',step:'efficient'}];
root.FinTeaching={dominates,diagnosis,snapshot,comparison,notices,exampleRange,interpretation,presets,quiz};if(typeof module!=='undefined')module.exports=root.FinTeaching;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: lessons.js */
(function(root){
'use strict';
const pct=n=>(n*100).toFixed(2)+'%',f=n=>Number(n.toPrecision(12)).toString(),literal=n=>n.toString();
function build(p,m){const b=1-p.w,q=m.current;
const step=(id,lines,title,summary,formula,calculation,result,target=id,extra={})=>({id,lines,title,summary,formula,calculation,result,target,...extra});
const steps = [
step('setup',['# 实验08：两资产均值—方差组合'],'模型设定','用同一期限的收益率与标准差，比较两资产组合；参数是教学假设。','w₁ + w₂ = 1；0 ≤ w₁, w₂ ≤ 1','','不允许卖空；金额占比合计 100%。','all'),
step('returns',[`mu <- c(A = ${literal(p.mu1)}, B = ${literal(p.mu2)})`],'定义两资产预期收益率','向量 mu 保存收益预期；百分数在 R 中写成小数。','μ₁, μ₂',`μ₁ = ${f(p.mu1)}；μ₂ = ${f(p.mu2)}`,`A ${pct(p.mu1)} / B ${pct(p.mu2)}`,'returns'),
step('volatility',[`s <- c(A = ${literal(p.s1)}, B = ${literal(p.s2)})`],'定义两资产标准差','标准差衡量波动幅度；两项资产的标准差不能直接加权得到组合风险。','σ₁ ≥ 0；σ₂ ≥ 0',`σ₁ = ${f(p.s1)}；σ₂ = ${f(p.s2)}`,`A ${pct(p.s1)} / B ${pct(p.s2)}`,'volatility'),
step('correlation',[`rho <- ${literal(p.rho)}`],'定义相关系数','ρ 决定共同波动的方向与强度，进入方差中的协方差项。','Cov(A, B) = σ₁σ₂ρ',`${f(p.s1)} × ${f(p.s2)} × ${f(p.rho)} = ${f(p.s1*p.s2*p.rho)}`,'相关性降低时，内部组合的协方差贡献下降。','correlation'),
step('weights',[`w1 <- ${literal(p.w)}`, 'w2 <- 1 - w1'],'分配投资组合权重','A 的权重变化时，B 自动补足，全部资金始终分配完毕。','w₂ = 1 − w₁',`1 − ${f(p.w)} = ${f(b)}`,`A ${pct(p.w)} / B ${pct(b)}`,'allocation'),
step('mean',['rp <- w1*mu[1] + w2*mu[2]'],'计算投资组合预期收益率','按投资权重对两只资产的预期收益率加权平均。','E(Rp) = w₁μ₁ + w₂μ₂',`${f(p.w)} × ${f(p.mu1)} + ${f(b)} × ${f(p.mu2)} = ${f(q.mean)}`,`结果：${pct(q.mean)}`,'return'),
step('variance',['vp <- w1^2*s[1]^2 +','      w2^2*s[2]^2 +','      2*w1*w2*s[1]*s[2]*rho'],'计算投资组合方差','方差由两项资产自身项和协方差项组成；逐项代入，再求和与开平方。','Var(Rp) = w₁²σ₁² + w₂²σ₂² + 2w₁w₂σ₁σ₂ρ','',`方差 ${f(q.variance)} → 标准差 ${pct(q.sd)}`,'risk',{terms:q.terms,termCalculations:[`${f(p.w)}² × ${f(p.s1)}²`,`${f(b)}² × ${f(p.s2)}²`,`2 × ${f(p.w)} × ${f(b)} × ${f(p.s1)} × ${f(p.s2)} × ${f(p.rho)}`],economic:q.terms[2]<0?'负协方差抵消部分风险；总方差仍非负。':q.terms[2]===0?'协方差贡献为零，当前风险来自两项自身贡献。':'正协方差增加共同波动风险；降低 ρ 可减小这一项。'}),
step('sd',['sp <- sqrt(vp)'],'由方差得到组合标准差','对方差开平方，得到与收益率同量纲、可直观比较的风险。','σp = √Var(Rp)',`√${f(q.variance)} = ${f(q.sd)}`,`组合风险：${pct(q.sd)}`,'risk'),
step('curvature',['d <- (s[1]-s[2])^2 +','     2*s[1]*s[2]*(1-rho)'],'判断风险是否随权重变化','d 是方差的二次项系数；使用非负等价式避免退化附近的相减误差。','d = σ₁² + σ₂² − 2σ₁σ₂ρ',`d = ${f(m.D)}`,m.flat?'方差恒定：所有权重均为最小方差解。':'d > 0：方差为凸二次函数。','minimum'),
step('minimum',['mv <- if (d == 0) {','  as.numeric(mu[1] >= mu[2])','} else {','  max(0, min(1,','    (s[2]*(s[2]-s[1]) +','     s[1]*s[2]*(1-rho))/d))','}'],'求最小方差组合',m.flat?'所有权重均有相同方差；仅为绘图选取收益更高的端点作为代表，不是唯一解。':'对方差函数求导，再将权重限制在 [0, 1]，满足不卖空约束。','w* = clip[(σ₂² − σ₁σ₂ρ) / d]',m.flat?'d = 0；最小方差权重不唯一。':`A ${pct(m.mv)} / B ${pct(1-m.mv)}`,`最小标准差：${pct(m.minimum.sd)}`,'minimum'),
step('weightsGrid',['w <- sort(unique(c(','  seq(0, 1, 0.0025), mv)))'],'枚举可行组合','枚举非负权重，并加入精确的最小方差点，避免采样遗漏拐点。','0 ≤ w ≤ 1',`共 ${m.points.length} 个不重复的可行权重`,'曲线为采样点连线。','curve'),
step('curveMean',['ret <- w*mu[1] + (1-w)*mu[2]'],'计算曲线的收益坐标','同一条收益公式应用于全部可行权重，构成图表的纵坐标。','E(Rp(w)) = wμ₁ + (1−w)μ₂','',`当前收益：${pct(q.mean)}`,'return'),
step('curveRisk',['vol <- sqrt(','  (w*s[1]-(1-w)*s[2])^2 +','  2*w*(1-w)*s[1]*s[2]*(1+rho))'],'计算曲线的风险坐标','用代数等价的非负形式生成全部权重的标准差，避免完全负相关时的数值抵消。','σp(w) = √[(wσ₁−(1−w)σ₂)² + 2w(1−w)σ₁σ₂(1+ρ)]','',`当前标准差：${pct(q.sd)}`,'risk'),
step('efficient',[`eff <- ${m.equal?(m.flat?'rep(TRUE, length(w))':'abs(w-mv) < 1e-10'):m.flat?`abs(w-${p.mu1>p.mu2?1:0}) < 1e-10`:`w ${p.mu1>p.mu2?'>=':'<='} mv ${p.mu1>p.mu2?'-':'+'} 1e-10`}`],'识别有效部分','有效组合不被其他组合支配：无法在不增加风险的前提下提高收益，或在不降低收益的前提下降低风险。','风险不高且收益不低，至少一项严格改善 → 支配',m.equal?(m.flat?'风险收益完全一致，所有权重等价。':'收益相同，仅最小风险位置有效。'):m.flat?'风险恒定，仅最高收益端点有效。':'取从最小方差点通向高收益端点的一段。',`当前组合${m.efficient(p.w)?'位于有效部分':'可被有效组合改善'}`,'efficient'),
step('plot',['plot(vol, ret, type="l",','  col="grey70", xlab="Risk (SD)",','  ylab="Expected return")'],'绘制全部可行组合','横轴为组合标准差，纵轴为预期收益；灰线连接全部可行组合。','横轴 σp；纵轴 E(Rp)','','数值使用小数，网页坐标转换为百分数。','curve'),
step('highlight',['lines(vol[eff], ret[eff],','  col="seagreen", lwd=3)','points(vol[eff], ret[eff],','  col="seagreen", pch=16, cex=.3)'],'绘制有效部分','绿色突出有效组合；退化为单点时仍通过 points 显示。','有效部分 ⊆ 全部可行组合','','相同收益取最小风险；相同风险取最高收益。','efficient'),
step('current',['points(sp, rp, pch=19,','  col="steelblue", cex=1.4)'],'标记当前投资组合','权重变化移动当前点；收益、标准差或相关系数变化会改变可行集。','当前坐标 = (σp, E(Rp))',`(${pct(q.sd)}, ${pct(q.mean)})`,`A ${pct(p.w)} / B ${pct(b)}`,'current'),
step('output',['print(c(return=rp,','  variance=vp, sd=sp))'],'输出当前计算结果','在基础 R 或 RStudio 整体运行代码，获得与网页一致的结果。','收益 / 方差 / 标准差',`${f(q.mean)} / ${f(q.variance)} / ${f(q.sd)}`,'方差以小数原值输出，不作为百分比。','all')
];
// Keep engineering decisions in the generator. Only expose a financial identity
// when the current inputs make direct subtraction lose the near-zero result.
const raw=q.terms.reduce((a,b)=>a+b,0),scale=(p.w*p.s1+b*p.s2)**2;
if(p.rho===-1 || (scale>0&&raw<=scale*1e-12)){
 const index=steps.findIndex(s=>s.id==='sd');
 steps.splice(index,0,step('boundaryVariance',[
 'vp <- (w1*s[1] - w2*s[2])^2 +',
 '      2*w1*w2*s[1]*s[2]*(1+rho)'],
 '边界情形：抵消后的方差','完全负相关或风险接近抵消时，采用同一公式的非负等价式。完全负相关时，组合风险为两资产加权波动之差的绝对值。',
 'Var(Rp) = (w₁σ₁−w₂σ₂)² + 2w₁w₂σ₁σ₂(1+ρ)', '',`方差 ${f(q.variance)}`,'risk'));
}
return steps;}
function code(steps){return steps.flatMap(s=>s.lines).join('\n');}
root.FinLessons={build,code,pct,f};if(typeof module!=='undefined')module.exports=root.FinLessons;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: typography.js */
/* Presentation only. Financial calculations and R generation stay in their existing modules. */
(function(root){
'use strict';
const num=n=>FinLessons.f(n).replace(/e([+-]?\d+)/,'\\times10^{$1}');
function expression(s,p,m){const n=num,b=1-p.w;const formula={
setup:String.raw`\begin{aligned}w_1+w_2&=1\\0\leq w_1,w_2&\leq1\end{aligned}`,
returns:String.raw`\boldsymbol\mu=(\mu_1,\mu_2)`,volatility:String.raw`\sigma_1\geq0,\quad\sigma_2\geq0`,correlation:String.raw`\operatorname{Cov}(A,B)=\sigma_1\sigma_2\rho`,weights:String.raw`w_2=1-w_1`,mean:String.raw`E(R_p)=w_1\mu_1+w_2\mu_2`,
variance:String.raw`\begin{aligned}\sigma_p^2&=w_1^2\sigma_1^2+w_2^2\sigma_2^2\\&\quad+2w_1w_2\sigma_1\sigma_2\rho\end{aligned}`,
sd:String.raw`\sigma_p=\sqrt{\operatorname{Var}(R_p)}`,
curvature:String.raw`d=\sigma_1^2+\sigma_2^2-2\sigma_1\sigma_2\rho`,
minimum:String.raw`w^*=\operatorname{clip}_{[0,1]}\!\left(\frac{\sigma_2^2-\sigma_1\sigma_2\rho}{d}\right)`,weightsGrid:String.raw`0\leq w\leq1`,curveMean:String.raw`E(R_p(w))=w\mu_1+(1-w)\mu_2`,
curveRisk:String.raw`\sigma_p(w)=\sqrt{\begin{gathered}(w\sigma_1-(1-w)\sigma_2)^2\\+2w(1-w)\sigma_1\sigma_2(1+\rho)\end{gathered}}`,plot:String.raw`(x,y)=\bigl(\sigma_p,E(R_p)\bigr)`,current:String.raw`(\sigma_p,E(R_p))`,highlight:String.raw`\mathcal E\subseteq\mathcal F`,output:String.raw`\bigl(E(R_p),\sigma_p^2,\sigma_p\bigr)`};
const calculation={mean:`${n(p.w)}\\times${n(p.mu1)}+${n(b)}\\times${n(p.mu2)}=${n(m.current.mean)}`,sd:`\\sqrt{${n(m.current.variance)}}=${n(m.current.sd)}`,correlation:`${n(p.s1)}\\times${n(p.s2)}\\times(${n(p.rho)})=${n(p.s1*p.s2*p.rho)}`,weights:`1-${n(p.w)}=${n(b)}`,returns:`\\mu_1=${n(p.mu1)},\\quad\\mu_2=${n(p.mu2)}`,volatility:`\\sigma_1=${n(p.s1)},\\quad\\sigma_2=${n(p.s2)}`,curvature:`d=${n(m.D)}`};
return {formula:formula[s.id],calculation:calculation[s.id]};}
function math(tex,element){if(!tex||!element)return;try{root.katex.render(tex,element,{displayMode:false,throwOnError:true,trust:false,output:'htmlAndMathml'});element.dataset.math='katex';}catch(e){element.dataset.mathError=e.message;console.error('Formula render failed:',e.message);}}
function renderStep(el,s,p,m){el.dataset.typographyBuild='1.3.2';const expr=expression(s,p,m);math(expr.formula,el.querySelector('.formula'));math(expr.calculation,el.querySelector(':scope > .calculation'));const detailed=el.querySelectorAll('.equivalence .calculation');if(s.terms){const labels=el.querySelectorAll('.term-row > span');el.dataset.termCount=labels.length;labels.forEach((node,i)=>{node.textContent=['A 自身项 · ','B 自身项 · ','协方差项 · '][i];const span=document.createElement('span');span.className='term-math';node.append(span);math([String.raw`w_1^2\sigma_1^2`,String.raw`w_2^2\sigma_2^2`,String.raw`2w_1w_2\sigma_1\sigma_2\rho`][i],span);});const paragraph=el.querySelector('.equivalence p');if(paragraph){paragraph.replaceChildren();const identity=document.createElement('span');identity.className='equivalence-formula';paragraph.append(identity);math(String.raw`(a-b)^2+2ab(1+\rho)=a^2+b^2+2ab\rho`,identity);paragraph.append(document.createTextNode('其中 '));const definitions=document.createElement('span');definitions.className='equivalence-formula';paragraph.append(definitions);math(String.raw`a=w_1\sigma_1,\quad b=w_2\sigma_2`,definitions);paragraph.append(document.createTextNode('教学采用三项式；网页内部采用稳定等价式。内部测试负责数值校验；遇到完全负相关或接近风险抵消时，教学脚本补充等价方差公式。'));}const a=FinLessons.f(p.w),b=FinLessons.f(1-p.w),x=FinLessons.f(p.s1),y=FinLessons.f(p.s2),rho=FinLessons.f(p.rho);const lines=[`${a}^2\\times${x}^2`,`${b}^2\\times${y}^2`,`2\\times${a}\\times${b}\\times${x}\\times${y}\\times(${rho})`];detailed.forEach((node,i)=>math(`${lines[i]}=${num(s.terms[i])}`,node));}}
function observeChart(callback){const svg=document.querySelector('#chart');let pending=false;const apply=()=>{pending=false;const scale=svg.getBoundingClientRect().width/560;if(!scale)return;const projection=document.body.classList.contains('projector');const sizes={tick:projection?16:12.5,axis:projection?16:14,asset:projection?16:13,label:projection?16:13};for(const [key,value]of Object.entries(sizes))svg.style.setProperty('--chart-'+key,(value/scale)+'px');callback();};const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(apply);}};new ResizeObserver(schedule).observe(svg);new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});document.fonts.ready.then(schedule);document.fonts.addEventListener('loadingdone',schedule);schedule();}
root.FinTypography={renderStep,observeChart,expression};
})(window);

;

/* Source: exploration.js */
/* A single exploration state machine; all finance is delegated to FinMath. */
(function(root){
'use strict';
const snapshot=p=>Object.freeze({...p});
const idle=()=>({phase:'Idle',origin:null,baseline:null,baseResult:null,current:null,result:null,prediction:null,changed:false,studentSelected:false,task:'correlation'});
function start(p,origin=p,task='correlation'){FinMath.model(p);const base=snapshot(p);return{phase:'Predict',origin:snapshot(origin),baseline:base,baseResult:FinMath.portfolio(base),current:base,result:FinMath.portfolio(base),prediction:null,changed:false,studentSelected:false,task};}
function transition(s,event){switch(event.type){
case 'START':if(s.phase!=='Idle')throw Error('Use RESTART for an active session');return start(event.params,event.params,event.task||'correlation');
case 'RESTART':if(!active(s))throw Error('Cannot restart Idle');return start(event.params||s.current,s.origin,s.task);
case 'CHOOSE':if(s.phase!=='Predict'||!(s.task==='efficiency'?['yes','no']:['down','same','up']).includes(event.value))throw Error('Choose only during Predict');return{...s,prediction:event.value};
case 'CONFIRM':if(s.phase!=='Predict'||!s.prediction||(s.task==='correlation'&&s.baseline.rho<=-1))throw Error('Prediction and reducible baseline required');return{...s,phase:'Experiment',studentSelected:false};
case 'CHANGE':{if(s.phase!=='Experiment')throw Error('Parameters locked outside Experiment');const p=event.params;if((s.task==='efficiency'?['rho','mu1','mu2','s1','s2']:['w','mu1','mu2','s1','s2']).some(k=>p[k]!==s.baseline[k]))throw Error('Fixed parameters changed');if(s.task==='correlation'&&(p.rho>s.baseline.rho||p.rho< -1))throw RangeError('Only reduce correlation from baseline');const current=snapshot(p);return{...s,current,result:FinMath.portfolio(current),changed:s.task==='efficiency'?p.w!==s.baseline.w:p.rho<s.baseline.rho};}
case 'EXPLAIN':if(!canExplain(s))throw Error('Lower correlation before Explain');return{...s,phase:'Explain'};
case 'REEXPERIMENT':if(s.phase!=='Explain')throw Error('Reexperiment only after Explain');return{...s,phase:'Experiment',current:s.baseline,result:s.baseResult,changed:false,studentSelected:false};
case 'SELECT_CODE':return{...s,studentSelected:true};
case 'EXIT':return idle();
default:throw Error('Unknown exploration event');}}
const active=s=>s.phase!=='Idle',canCompare=s=>['Experiment','Explain'].includes(s.phase)&&s.changed,canExplain=s=>s.phase==='Experiment'&&s.changed;
function editable(s,key){return s.phase==='Idle'||(s.phase==='Experiment'&&key===(s.task==='efficiency'?'w':'rho'));}
root.FinExplore={idle,transition,active,canCompare,canExplain,editable};if(typeof module!=='undefined')module.exports=root.FinExplore;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: classroom-ui.js */
(function(root){
'use strict';
function mount(api){const $=s=>document.querySelector(s),T=FinTeaching,dialog=$('#classroomDialog');
$('#classroomTools').onclick=()=>ModalUI.open(dialog);
for(const b of document.querySelectorAll('[data-class-tab]'))b.onclick=()=>{document.querySelectorAll('[data-class-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('[data-class-pane]').forEach(x=>x.hidden=x.dataset.classPane!==b.dataset.classTab);};
$('#presetSelect').innerHTML=T.presets.map((p,i)=>`<option value="${i}">示例${p.id}：${p.name}</option>`).join('');const preset=()=>{$('#presetPurpose').textContent=T.presets[Number($('#presetSelect').value)].purpose;};$('#presetSelect').onchange=preset;preset();$('#loadPreset').onclick=()=>{const p=T.presets[Number($('#presetSelect').value)];api.loadPreset(p.raw,`示例${p.id}：${p.name}`);dialog.close();};
$('#quizQuestion').innerHTML=T.quiz.map((q,i)=>`<option value="${i}">问题${i+1}</option>`).join('');const question=()=>{const q=T.quiz[Number($('#quizQuestion').value)];$('#quizPrompt').textContent=q.question;$('#quizOptions').innerHTML=q.options.map((s,i)=>`<label><input type="radio" name="quizAnswer" value="${i}"> ${s}</label>`).join('');$('#quizFeedback').textContent='';$('#locateQuizCode').hidden=true;};$('#quizQuestion').onchange=question;question();$('#submitQuiz').onclick=()=>{const q=T.quiz[Number($('#quizQuestion').value)],answer=$('input[name="quizAnswer"]:checked');if(!answer){$('#quizFeedback').textContent='请先选择答案。';return;}$('#quizFeedback').textContent=`${Number(answer.value)===q.answer?'回答与原理一致。':'请结合以下原理再理解。'} 正确答案：${q.options[q.answer]}。${q.why}`;$('#locateQuizCode').hidden=false;};$('#locateQuizCode').onclick=()=>{dialog.close();api.selectStep(T.quiz[Number($('#quizQuestion').value)].step,true);};
$('#feedbackConsent').onchange=()=>{$('#feedbackFields').disabled=!$('#feedbackConsent').checked;$('#feedbackStatus').textContent='';};$('#exportFeedback').onclick=()=>{if(!$('#feedbackConsent').checked)return;if(!$('#feedbackCompletion').value){$('#feedbackStatus').textContent='请选择任务完成情况。';return;}const data={schema:'finmodel-classroom-feedback-v1',collection:'explicit local export; no automatic upload',date:new Date().toISOString().slice(0,10),completion:$('#feedbackCompletion').value,difficultCode:$('#feedbackCode').value,concept:$('#feedbackConcept').value,helpful:$('#feedbackHelpful').value,willing:$('#feedbackWilling').value};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='finmodel-anonymous-feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#feedbackStatus').textContent='已在本设备导出，没有上传。';};
}
root.FinClassroom={mount};
})(window);

;

/* Source: app.js */
'use strict';
const $=s=>document.querySelector(s);
const defaults={w:50,mu1:8,mu2:14,s1:12,s2:22,rho:.2};
const {pct,f}=FinLessons;
let portfolioCodeMode='full';
let p,m,steps,selected='mean',toastTimer,scaleKey='',detail=null,pinned=false,axes=null,axisMode="auto",axisBaseline=null,axisExpanded=false,splitRatio=.68,focusRatio=null,splitManual=false;
const T=FinTeaching;let ordinarySnapshot=null,optimizationUndo=null;
const E=FinExplore;let explore=E.idle();
const codeButtons=[];
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function colorCode(s){const pattern=/(#.*$|"(?:[^"\\]|\\.)*"|(?:\b\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?|\b[A-Za-z][\w.]*(?=\()|<-|<=|>=|!=|%\*%|==|[+*\/^=<>-])/g;let html='',last=0;for(const match of s.matchAll(pattern)){const token=match[0];html+=escapeHTML(s.slice(last,match.index));const cls=token.startsWith('#')?'comment':token.startsWith('"')?'string':/^(\d|\.\d)/.test(token)?'number':/^[A-Za-z]/.test(token)?'function':'operator';html+=`<span class="syntax-${cls}">${escapeHTML(token)}</span>`;last=match.index+token.length;}return html+escapeHTML(s.slice(last));}
function renderCode(){document.querySelectorAll('[data-portfolio-code]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.portfolioCode===portfolioCodeMode)));const shown=portfolioCodeMode==='full'?steps:steps.filter(s=>['returns','volatility','correlation','weights','mean','variance','boundaryVariance','sd','minimum','efficient','output'].includes(s.id));let i=0;for(const step of shown)for(const line of step.lines){let button=codeButtons[i];if(!button){button=document.createElement('button');button.className='code-line';button.innerHTML='<span class="num"></span><code></code>';button.addEventListener('click',()=>selectStep(button.dataset.step,true));$('#code').append(button);codeButtons.push(button);}button.dataset.step=step.id;button.querySelector('.num').textContent=String(i+1).padStart(2,'0');button.querySelector('code').innerHTML=colorCode(line);button.setAttribute('aria-label',`第${i+1}行：${step.title}`);i++;}while(codeButtons.length>i)codeButtons.pop().remove();}
function selectedStep(){return steps.find(s=>s.id===selected);}
function selectStep(id,user=false){if(user&&E.active(explore))explore=E.transition(explore,{type:'SELECT_CODE'});selected=id;if(!splitManual&&focusRatio===null)setSplit(['variance','boundaryVariance','minimum','efficient','curvature','curveRisk'].includes(id)?.55:.68);renderExplanation();renderLinks();const group=codeButtons.filter(b=>b.dataset.step===id),area=$('#code');if(group.length){const top=group[0].offsetTop-area.offsetTop,bottom=group.at(-1).offsetTop-area.offsetTop+group.at(-1).offsetHeight;if(top<area.scrollTop||bottom>area.scrollTop+area.clientHeight)area.scrollTop=Math.max(0,top-12);}$('#explanation').scrollTop=0;}
function renderExplanation(){const expanded=$('#explanation .equivalence')?.open,scroll=$('#explanation').scrollTop;const s=selectedStep();let html=`<div class="explanation-heading"><h3>${s.title}</h3><button id="focusExplanation" class="text-button" aria-pressed="${focusRatio!==null}">${focusRatio!==null?'收起解析 ↙':'展开解析 ↗'}</button></div><div class="formula">${s.formula}</div>`;
if(s.terms){html+='<div class="contributions">';for(let i=0;i<3;i++){html+=`<div class="term-row"><span class="${i===0?'asset-a':i===1?'asset-b':''}" title="${s.termCalculations[i]}">${['A 自身项 · w₁²σ₁²','B 自身项 · w₂²σ₂²','协方差项 · 2w₁w₂σ₁σ₂ρ'][i]}</span><b>${f(s.terms[i])}</b><div class="term-substitution">${s.termCalculations[i]} = ${f(s.terms[i])}</div><div class="term-bar" aria-label="${s.terms[i]<0?'负值向左':'正值向右'}"><i class="${s.terms[i]<0?'negative':''}" style="left:${s.terms[i]<0?50-Math.abs(s.terms[i])/Math.max(...s.terms.map(Math.abs),1e-300)*48:50}%;width:${Math.abs(s.terms[i])/Math.max(...s.terms.map(Math.abs),1e-300)*48}%"></i></div></div>`;}html+=`<div class="sum-result"><span class="sum-title">Portfolio Variance</span>${s.terms.map((v,i)=>(i&&v>=0?'+ ':'')+f(v)).join(' ')} = ${f(m.current.variance)}<span class="sum-title">Portfolio Risk</span>√${f(m.current.variance)} = ${pct(m.current.sd)}</div></div><p class="economic">${['Predict','Experiment'].includes(explore.phase)?'':s.economic}</p>`;}
if(s.terms&&E.canCompare(explore)){const baseline=explore.baseline,before=explore.baseResult;html+=`<div id="varianceComparison" class="variance-comparison">本次探索：${explore.task==='efficiency'?'A权重 '+pct(baseline.w)+' → '+pct(p.w):'ρ '+f(baseline.rho)+' → '+f(p.rho)}<br>协方差项 ${f(before.terms[2])} → ${f(m.current.terms[2])}<br>方差 ${f(before.variance)} → ${f(m.current.variance)}<br>风险 ${pct(before.sd)} → ${pct(m.current.sd)}（${((m.current.sd-before.sd)*100).toFixed(2)} 个百分点）</div>`;}if(!s.terms)html+=`<p class="step-note">${s.summary}</p>`;if(s.calculation&&!(explore.phase==='Predict'&&explore.task==='efficiency'&&['minimum','curvature','efficient'].includes(s.id)))html+=`<div class="calculation">${s.calculation}</div>`;html+=`<div class="result">${explore.phase==='Predict'&&explore.task==='efficiency'&&['minimum','curvature','efficient'].includes(s.id)?'先提交预测，再结合模型结果验证。':['Predict','Experiment'].includes(explore.phase)&&s.id==='correlation'?'当前协方差：'+f(p.s1*p.s2*p.rho):s.result}</div>`;if(s.terms)html+=`<details class="equivalence"><summary>展开数值代入与等价式</summary>${s.termCalculations.map((t,i)=>`<div class="calculation">${t} = ${f(s.terms[i])}</div>`).join('')}<p>(a−b)² + 2ab(1+ρ) = a² + b² + 2abρ，其中 a=w₁σ₁、b=w₂σ₂。教学代码逐项对应公式；网页内部使用非负等价式，数值校验保留在内部测试；仅遇完全负相关或接近风险抵消时，教学脚本补充相关的等价方差公式。</p></details>`;if(E.active(explore)&&['weights','mean'].includes(s.id))html+=`<p class="step-note">${explore.task==='efficiency'?(s.id==='weights'?'本次只改变权重，B由1−wA补足，其他资产假设固定。':'本次权重可变，收益可以随配置改变；相关系数和资产收益假设固定。'):(s.id==='weights'?'本次探索中资产权重固定。':'本次探索的权重与资产预期收益率固定，因此该收益计算不随 ρ 改变。')}</p>`;const interpretation=T.interpretation(s.id,p,m);if(interpretation&&(!['Predict','Experiment'].includes(explore.phase)||!['variance','minimum','curvature','efficient'].includes(s.id)))html+=`<section class="financial-interpretation"><strong>金融意义</strong><p>${interpretation}</p></section>`;if(['minimum','curvature'].includes(s.id)&&explore.phase!=='Predict')html+=`<div class="calculation">最小方差 ${f(m.minimum.variance)}；标准差 ${pct(m.minimum.sd)}<br>对应收益 ${pct(m.minimum.mean)}；A ${pct(m.mv)} / B ${pct(1-m.mv)}</div>`;$('#explanation').innerHTML=html;FinTypography.renderStep($('#explanation'),s,p,m);if(expanded&&s.terms)$('#explanation .equivalence').open=true;$('#explanation').scrollTop=scroll;
for(const button of codeButtons){const yes=button.dataset.step===selected;button.classList.toggle('selected',yes);button.setAttribute('aria-pressed',String(yes));}}
function renderLinks(){const target=selectedStep().target;const mappings={returns:['mu1','mu2'],volatility:['s1','s2'],allocation:['w'],correlation:['rho','rhoSlider'],return:['returnMetric'],risk:['riskMetric']};for(const id of ['mu1','mu2','s1','s2','w','rho','rhoSlider','returnMetric','riskMetric'])$('#'+id).classList.toggle('linked',(mappings[target]||[]).includes(id));
for(const id of ['rho','rhoSlider'])$('#'+id).classList.toggle('experiment-control',explore.phase==='Experiment'&&explore.task==='correlation');$('#riskGuide').classList.toggle('linked',target==='risk');$('#returnGuide').classList.toggle('linked',target==='return');$('#currentMarker').classList.toggle('linked',target==='current');$('#minimumMarker').classList.toggle('linked',target==='minimum');$('#efficientPath').style.strokeWidth=target==='efficient'?'4':'3';}
function revealSelectedCode(){const group=codeButtons.filter(b=>b.dataset.step===selected),area=$('#code');if(!group.length)return;const top=group[0].offsetTop-area.offsetTop,bottom=group.at(-1).offsetTop-area.offsetTop+group.at(-1).offsetHeight;if(bottom>area.scrollTop+area.clientHeight)area.scrollTop=bottom-area.clientHeight+8;if(top<area.scrollTop)area.scrollTop=Math.max(0,top-8);}
function setSplit(value){splitRatio=Math.max(.4,Math.min(.8,value));$('.code-panel').style.setProperty('--code-fr',`${splitRatio*100}fr`);$('.code-panel').style.setProperty('--explain-fr',`${(1-splitRatio)*100}fr`);setAttr('splitter',{'aria-valuenow':Math.round(splitRatio*100),'aria-valuetext':`代码 ${Math.round(splitRatio*100)}%，解析 ${Math.round((1-splitRatio)*100)}%`});requestAnimationFrame(revealSelectedCode);}
let splitting=false;
$('#splitter').addEventListener('pointerdown',e=>{if(e.button!==0)return;splitting=true;splitManual=true;focusRatio=null;$('#splitter').setPointerCapture(e.pointerId);e.preventDefault();});
$('#splitter').addEventListener('pointermove',e=>{if(!splitting)return;const code=$('#code').getBoundingClientRect(),available=$('#code').clientHeight+$('#explanation').clientHeight;setSplit((e.clientY-code.top)/available);});
function endSplit(){if(!splitting)return;splitting=false;renderExplanation();}
$('#splitter').addEventListener('pointerup',endSplit);$('#splitter').addEventListener('pointercancel',endSplit);
$('#splitter').addEventListener('keydown',e=>{const change={ArrowUp:-.05,ArrowDown:.05};if(e.key in change||e.key==='Home'||e.key==='End'){e.preventDefault();splitManual=true;focusRatio=null;setSplit(e.key==='Home'?.4:e.key==='End'?.8:splitRatio+change[e.key]);renderExplanation();}});
$('#splitter').addEventListener('dblclick',()=>{focusRatio=null;splitManual=false;setSplit(['variance','minimum','efficient','curvature','curveRisk','boundaryVariance'].includes(selected)?.55:.68);renderExplanation();});
$('#explanation').addEventListener('click',e=>{if(!e.target.closest('#focusExplanation'))return;if(focusRatio===null){focusRatio=splitRatio;setSplit(.4);}else{const restore=focusRatio;focusRatio=null;setSplit(restore);}renderExplanation();});
function read(){const raw=Object.fromEntries(Object.keys(defaults).map(id=>[id,$('#'+id).value]));const result=FinMath.parseInputs(raw);for(const id of Object.keys(defaults)){$('#'+id).setAttribute('aria-invalid',String(result.invalid.includes(id)));}if(result.invalid.length){const labels={w:'A 权重需为 0～100%',rho:'ρ 需为 −1～1',mu1:'A 收益率需为 −100～100%',mu2:'B 收益率需为 −100～100%',s1:'A 标准差需为 0～100%',s2:'B 标准差需为 0～100%'};$('#validation').textContent=result.invalid.map(id=>labels[id]).join('；')+'。保留上次有效结果。';return false;}if(E.active(explore)){try{if(explore.phase==='Experiment')E.transition(explore,{type:'CHANGE',params:result.p});else if(Object.keys(defaults).some(k=>result.p[k]!==explore.current[k]))throw Error('locked');}catch{const message=explore.phase==='Experiment'?(explore.task==='efficiency'?'本次只允许调整权重，其他资产假设固定。':`本次只允许 ρ 在 −1～${f(explore.baseline.rho)} 之间变化，其他参数固定。`):'当前阶段参数已锁定。';$('#validation').textContent=message;$('#rho').setAttribute('aria-invalid','true');return false;}}$('#validation').textContent='';p=result.p;$('#rhoSlider').value=String(p.rho);return true;}
function setAttr(id,attrs){const el=$('#'+id);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));}
function transform(id,x,y){const el=$('#'+id);el.style.removeProperty('transform');el.setAttribute('transform',`translate(${x} ${y})`);}
function draw(){pointInteraction.redraw();const all=m.points,proposed=FinScale.range(all),oldAxes=axes;
axes=axisMode==='fixed'?FinScale.union(axes,proposed):proposed;
const expanded=axisMode==='fixed'&&oldAxes&&Object.keys(axes).some(k=>axes[k]!==oldAxes[k]);if(expanded)axisExpanded=true;
$('#axisMode').textContent=axisMode==='auto'?'自动适配 ⇄':axisExpanded?'固定比较 · 已扩展':'固定比较 ⇄';$('#axisMode').setAttribute('aria-pressed',String(axisMode==='fixed'));$('#axisMode').title=axisMode==='auto'?'自动适配当前曲线；点击切换固定比较':'固定比较：共同坐标，超出时扩展；点击切换自动适配';
$('#axisStatus').textContent=axisExpanded&&axisMode==='fixed'?'新曲线超出原范围，坐标已扩展以同时容纳基准与当前曲线':axisMode==='fixed'?'固定比较使用共同坐标':'自动适配当前可行集';
const {xmin,xmax,ymin,ymax}=axes,svg=$('#chart'),rect=$('.plot-area').getBoundingClientRect(),H=rect.height/Math.max(rect.width,1)*560,bottom=H-54;
svg.setAttribute('viewBox',`0 0 560 ${H}`);setAttr('xAxisTitle',{y:H-8,x:540});const X=x=>75+(x-xmin)/(xmax-xmin)*455,Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-32);
const key=[xmin,xmax,ymin,ymax,H].join(',');if(key!==scaleKey){let grid='';for(let i=0;i<=4;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;grid+=`<path d="M${X(x)} 32 V${bottom} M75 ${Y(y)} H530" stroke="#e2e9ee" fill="none" vector-effect="non-scaling-stroke"/><text x="${X(x)}" y="${bottom+27}" text-anchor="middle">${(x*100).toFixed(1)}%</text><text x="65" y="${Y(y)+4}" text-anchor="end">${(y*100).toFixed(1)}%</text>`;}$('#grid').innerHTML=grid;scaleKey=key;}
const path=pts=>pts.map((v,i)=>`${i?'L':'M'}${X(v.sd).toFixed(4)},${Y(v.mean).toFixed(4)}`).join(' ');
const showBase=explore.phase!=='Predict'&&axisMode==='fixed'&&axisBaseline&&['mu1','mu2','s1','s2','rho'].some(k=>axisBaseline[k]!==p[k]);$('#baselinePath').toggleAttribute('hidden',!showBase);$('#baselineLegend').hidden=!showBase;setAttr('baselinePath',{d:showBase?path(FinMath.model(axisBaseline).points):''});setAttr('feasiblePath',{d:path(all)});setAttr('efficientPath',{d:path(all.filter(q=>q.efficient))});
const q=m.current,min=m.minimum,c=[X(q.sd),Y(q.mean)],v=[X(min.sd),Y(min.mean)];
setAttr('riskGuide',{d:`M${c[0]} ${c[1]} V${bottom}`});setAttr('returnGuide',{d:`M75 ${c[1]} H${c[0]}`});
transform('currentMarker',...c);transform('minimumMarker',...v);
const used=[];for(const [id,w]of[['assetA',1],['assetB',0]]){const q=FinMath.portfolio(p,w),x=X(q.sd),y=Y(q.mean);transform(id,x,y);const text=$('#'+id+' text');text.setAttribute('x','10');text.setAttribute('y',id==='assetA'?'22':'-12');if(Math.hypot(X(p.s1)-X(p.s2),Y(p.mu1)-Y(p.mu2))<45){text.setAttribute('x',id==='assetA'?'-14':'14');text.setAttribute('y',id==='assetA'?'22':'-16');}used.push({x:x+8,y:y+(id==='assetA'?8:-26),w:22,h:20});}
$('#assetA text').textContent='A';$('#assetB text').textContent=p.s1===p.s2&&p.mu1===p.mu2?'A / B':'B';if(p.s1===p.s2&&p.mu1===p.mu2)$('#assetA text').textContent='';
for(const id of ['minimumMarker'])setAttr(id,{'aria-label':m.flat?'查看最小方差组合详情，所有权重均为解':'查看最小方差组合详情'});
const cert=detail==='diagnosis'&&explore.phase!=='Predict'?T.diagnosis(p).witness:null;$('#improvementMarker').toggleAttribute('hidden',!cert);if(cert)transform('improvementMarker',X(cert.sd),Y(cert.mean));renderLinks();if(detail)renderPointDetails();}
function renderPointDetails(){const extra=['diagnosis','comparison'].includes(detail);$('.point-identities').hidden=extra;if(detail==='diagnosis'){renderDiagnosisDetails();return;}if(detail==='comparison'){renderComparisonDetails();return;}const isMin=detail==='minimum',asset=detail==='assetA'||detail==='assetB',q=asset?FinMath.portfolio(p,detail==='assetA'?1:0):isMin?m.minimum:m.current;$('#pointTitle').textContent=asset?(detail==='assetA'?'Asset A · 100%资产A':'Asset B · 100%资产B'):isMin?'Minimum Variance Portfolio':'Current Portfolio';document.querySelectorAll('.point-identities button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.point===detail)));$('#pointValues').innerHTML=`<div class="point-values"><div><span class="asset-a">Asset A</span><b>${pct(q.w)}</b></div><div><span class="asset-b">Asset B</span><b>${pct(1-q.w)}</b></div><div><span>预期收益</span><b>${pct(q.mean)}</b></div><div><span>组合方差</span><b>${f(q.variance)}</b></div><div><span>组合标准差</span><b>${pct(q.sd)}</b></div></div>`+(isMin&&m.flat?'<p>所有权重均为最小方差解。此处仅展示最高收益端点代表，非唯一最优权重。</p>':'');}
const pointInteraction=ChartInteraction.create((key,mode)=>{
 detail=key;pinned=mode==='pinned';const box=$('#pointDetails');box.dataset.mode=mode;
 box.hidden=!key||(explore.phase==='Predict'&&explore.task==='efficiency'&&key==='minimum');
 $('#closePoint').hidden=mode!=='pinned';
 if(!key){$('#pointValues').replaceChildren();$('#pointTitle').textContent='';$('#improvementMarker').setAttribute('hidden','');}
 else if(!box.hidden)renderPointDetails();
 for(const id of ['minimumMarker','currentMarker'])setAttr(id,{'aria-expanded':String(!box.hidden&&id.startsWith(key))});
});
function closePoint(){pointInteraction.clear();}
function showPoint(type,pin){if(explore.phase==='Predict'&&explore.task==='efficiency'&&['minimum','diagnosis'].includes(type)){toast('请先提交预测，再查看改进配置证明。');return;}if(pin)pointInteraction.select(type);else pointInteraction.enter(type);if(type==='diagnosis')draw();}
for(const [id,type]of [['minimumMarker','minimum'],['currentMarker','current'],['assetA','assetA'],['assetB','assetB']]){const el=$('#'+id);el.dataset.marker=type;el.setAttribute('role','button');el.setAttribute('tabindex','0');if(type.startsWith('asset'))el.setAttribute('aria-label','查看资产'+type.slice(-1)+'端点');pointInteraction.bind(el,type);}
$('#chart').onpointerleave=()=>{const key=pointInteraction.state.hoveredItem;if(key)pointInteraction.leave(key);};
$('#chart').onclick=e=>{if(!e.target.closest('[data-marker]'))closePoint();};
$('#closePoint').onclick=closePoint;
for(const button of document.querySelectorAll('[data-point]')){button.dataset.marker=button.dataset.point;pointInteraction.bind(button,button.dataset.point);}
function rawInputs(){return Object.fromEntries(Object.keys(defaults).map(id=>[id,$('#'+id).value]));}
function writeInputs(raw){for(const [id,value]of Object.entries(raw))$('#'+id).value=String(value);}
function clearComparison(){$('#endComparison').hidden=!ordinarySnapshot||E.active(explore);$('#comparison').hidden=true;$('#comparisonText').replaceChildren();$('#comparisonText').removeAttribute('title');}
function renderExploration(){const active=E.active(explore),phase=explore.phase;document.body.dataset.exploration=phase;$('#explorePanel').hidden=!active;$('#exploreToggle').setAttribute('aria-expanded',String(active));$('#exploreToggle').textContent=active?'退出并恢复':'开始探索 →';
for(const id of Object.keys(defaults))$('#'+id).disabled=!E.editable(explore,id);$('#rhoSlider').disabled=!E.editable(explore,'rho');$('#axisMode').disabled=active;$('#exploreTask').disabled=active;$('.baseline-actions').hidden=active;
const rangeMax=['Experiment','Explain'].includes(phase)&&explore.task==='correlation'?explore.baseline.rho:1;$('#rho').max=String(rangeMax);$('#rhoSlider').max=String(rangeMax);$('#rhoMid').textContent=f((rangeMax-1)/2);$('#rhoMax').textContent=rangeMax===1?'+1':f(rangeMax);
if(!active){$('#exploreFeedback').textContent='';$('#exploreExplanation').replaceChildren();$('#exploreExplanation').hidden=true;return;}
$('#exploreStage').textContent={Predict:'01 / 预测',Experiment:'02 / 实验',Explain:'03 / 解释'}[phase];document.querySelectorAll('[data-phase]').forEach(el=>el.setAttribute('aria-current',String(el.dataset.phase===phase)));
const weightTask=explore.task==='efficiency',lower=!weightTask&&explore.baseline.rho===-1;$('#exploreStart').hidden=phase!=='Predict'||!lower;$('#exploreQuestion').hidden=phase!=='Predict'||lower;$('.prediction-options').hidden=phase!=='Predict'||lower||weightTask;$('.efficiency-predictions').hidden=phase!=='Predict'||!weightTask;$('#exploreQuestion').textContent=weightTask?'是否存在预期收益率不低于当前组合、同时风险更低的可行配置？':'保持权重、收益率和标准差不变，只降低相关系数，组合风险会如何变化？';$('#confirmPrediction').hidden=phase!=='Predict'||lower;$('#confirmPrediction').disabled=!explore.prediction;
document.querySelectorAll('[data-prediction]').forEach(b=>{b.disabled=phase!=='Predict';b.setAttribute('aria-pressed',String(b.dataset.prediction===explore.prediction));});
$('#explainVariance').hidden=phase!=='Experiment';$('#explainVariance').disabled=!E.canExplain(explore);$('#reexperiment').hidden=phase!=='Explain';
const feedback=$('#exploreFeedback');if(phase==='Predict'){feedback.textContent=lower?'请明确选择使用默认参数，或退出后设置可降低的起点。':'基准：进入本轮时的当前参数。';clearComparison();}
else if(phase==='Experiment'&&weightTask)feedback.textContent='预测已记录。只调整资产A权重，B自动补足；其他假设固定。改变权重后可查看解释。';else if(phase==='Experiment')feedback.textContent=explore.changed?`预测已记录。当前 ρ=${f(p.rho)}；可继续降低，或查看实验解释。`:`请先将右侧 ρ 降到 ${f(explore.baseline.rho)} 以下，再查看实验解释。`;
else feedback.textContent='结果已固定。继续调参请先选择“重新实验”。';
if(phase==='Explain'&&weightTask){renderEfficiencyExplanation();return;}if(phase!=='Explain'){$('#exploreExplanation').replaceChildren();$('#exploreExplanation').hidden=true;return;}
const base=explore.baseline,before=explore.baseResult,q=explore.result,result=FinMath.compareCorrelation(base,explore.current),names={down:'下降',same:'不变',up:'上升'};const coef=2*base.w*(1-base.w)*base.s1*base.s2;
const rows=[['相关系数',f(base.rho),f(p.rho)],['预期收益率',pct(before.mean),pct(q.mean)],['组合方差',f(before.variance),f(q.variance)],['组合标准差',pct(before.sd),pct(q.sd)],['协方差项',f(before.terms[2]),f(q.terms[2])]];
$('#exploreExplanation').hidden=false;$('#exploreExplanation').innerHTML=`<p>你的预测：风险${names[explore.prediction]}<br>实验结果：风险${names[result.direction]}<br>${explore.prediction===result.direction?'预测正确':'预测与实验结果不一致'}</p><table class="experiment-table"><thead><tr><th>指标</th><th>调整前</th><th>调整后</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i?`<td>${v}</td>`:`<th>${v}</th>`).join('')}</tr>`).join('')}</tbody></table><p>风险变化 ${((q.sd-before.sd)*100).toFixed(2)} 个百分点。</p><div id="exploreFormula"></div><div id="exploreDerivative"></div><p>在其余参数固定、权重和标准差非负时，降低相关系数不会增加组合方差。${coef===0?'当前协方差项为零，形式参数不影响该组合风险。':'两资产权重和标准差均为正时，组合方差严格下降。'}${base.s1===0||base.s2===0?'零标准差资产的相关系数在严格统计意义上未定义；此处为协方差为零时的形式参数。':''}零风险点仍可用方差关系解释，无需使用标准差的导数。</p><pre>${escapeHTML(steps.filter(s=>['correlation','variance','boundaryVariance','sd'].includes(s.id)).flatMap(s=>s.lines).join('\n'))}</pre>`;
katex.render(String.raw`\sigma_p^2=w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2\sigma_1\sigma_2\rho`,$('#exploreFormula'),{throwOnError:false});katex.render(String.raw`\frac{\partial\sigma_p^2}{\partial\rho}=2w_1w_2\sigma_1\sigma_2\geq0`,$('#exploreDerivative'),{throwOnError:false});}
function beginExploration(){if(!read())return;const wasActive=E.active(explore),old=explore,raw=rawInputs();explore=E.transition(explore,{type:wasActive?'RESTART':'START',params:p,task:$('#exploreTask').value});explore={...explore,originInputs:wasActive?old.originInputs:raw,baselineInputs:raw,view:wasActive?old.view:{mode:axisMode,axes:axes&&{...axes},base:axisBaseline&&{...axisBaseline},expanded:axisExpanded}};
ordinarySnapshot=null;optimizationUndo=null;clearComparison();closePoint();clearTimeout(toastTimer);$('#toast').classList.remove('show');axisMode='auto';axisBaseline=null;axisExpanded=false;axes=null;update();$('#explorePanel').scrollTop=0;if(innerWidth<1024)$('#explorePanel').scrollIntoView({block:'nearest',behavior:'instant'});}
function exitExploration(keep=false){if(!E.active(explore)||(keep&&!read()))return;const previous=explore;explore=E.transition(explore,{type:'EXIT'});if(!keep)writeInputs(previous.originInputs);ordinarySnapshot=null;clearComparison();closePoint();const view=previous.view;axisMode=view.mode;axes=view.axes;axisBaseline=view.base;axisExpanded=view.expanded;p=null;update();}
const parameterNames={w:'权重',mu1:'A 收益率',mu2:'B 收益率',s1:'A 标准差',s2:'B 标准差',rho:'相关系数'};
function renderComparison(previous){$('#viewComparison').hidden=!ordinarySnapshot;if(explore.phase==='Predict'){clearComparison();return;}if(E.active(explore)){if(!E.canCompare(explore)){clearComparison();return;}}else if(!ordinarySnapshot){clearComparison();return;}
const snapshot=E.active(explore)?T.snapshot(explore.baseline,'探索开始时'):ordinarySnapshot,c=T.comparison(snapshot,p),base=snapshot.params;if(!c.changed.length){clearComparison();return;}const delta=c.riskDelta;$('#comparison').hidden=false;$('#endComparison').hidden=E.active(explore);const changedText=c.multiple?'多个参数：'+c.changed.map(k=>parameterNames[k]).join('、'):parameterNames[c.changed[0]]+' '+f(base[c.changed[0]])+' → '+f(p[c.changed[0]]);$('#comparisonText').innerHTML=`<span class="compare-numbers">${pct(snapshot.result.sd)} → ${pct(c.current.result.sd)}</span><span class="compare-delta">${delta<0?'↓':delta>0?'↑':'—'} ${Math.abs(delta).toFixed(2)} 个百分点</span><span class="compare-conditions">${changedText}</span>`;$('#comparisonText').title=`基准：${snapshot.label}；${c.changed.map(k=>parameterNames[k]+': '+f(base[k])+' → '+f(p[k])).join('；')}。多参数改变不作单因素归因。`;}
function update(){closePoint();const previous=p&&{...p};if(!read())return;if(explore.phase==='Experiment')explore=E.transition(explore,{type:'CHANGE',params:p});m=FinMath.model(p);steps=FinLessons.build(p,m).map(s=>{const title={returns:"1. 参数：同一期限，小数单位",mean:"2. 当前组合风险收益",curvature:"3. 最小方差优化（禁止卖空）",weightsGrid:"4. 可行集与有效前沿",plot:"5. 图表",output:"6. 输出"}[s.id];return title?{...s,lines:["# "+title,...s.lines]}:s;});if(!steps.some(s=>s.id===selected))selected='variance';$('#weightA').textContent=pct(p.w);$('#weightB').textContent=pct(1-p.w);$('#return').textContent=pct(m.current.mean);$('#risk').textContent=pct(m.current.sd);renderExploration();renderCode();renderExplanation();draw();renderComparison(previous);renderTeaching();$('#correlationState').textContent=p.s1===0||p.s2===0?'零波动率下，ρ 仅作形式参数；协方差为零。':p.rho>0?'正相关':p.rho<0?'负相关':'不相关（不等于统计独立）';}
for(const id of Object.keys(defaults))$('#'+id).addEventListener('input',update);$('#rhoSlider').addEventListener('input',()=>{$('#rho').value=$('#rhoSlider').value;update();});
$('#reset').onclick=()=>{explore=E.idle();ordinarySnapshot=null;optimizationUndo=null;clearComparison();axes=null;axisMode='auto';axisBaseline=null;axisExpanded=false;p=null;writeInputs(defaults);closePoint();update();toast('已恢复默认参数');};
$('#endComparison').onclick=()=>{ordinarySnapshot=null;clearComparison();$('#viewComparison').hidden=true;axisMode='auto';axisBaseline=null;axes=null;axisExpanded=false;if(detail==='comparison')closePoint();draw();};
function setAxisMode(mode){axisMode=mode;axisExpanded=false;axes=null;if(mode==='fixed'){axisBaseline={...(ordinarySnapshot?ordinarySnapshot.params:p)};axes=FinScale.union(FinScale.range(FinMath.model(axisBaseline).points),FinScale.range(m.points));}else axisBaseline=null;draw();}
$('#axisMode').onclick=()=>{if(E.active(explore))return;setAxisMode(axisMode==='auto'?'fixed':'auto');renderComparison();};
$('#copy').onclick=async()=>{if(!read()){toast('请先修正参数，再复制代码');return;}const code=FinLessons.code(steps);try{await navigator.clipboard.writeText(code);toast('代码已复制，可在 RStudio 整体运行');}catch{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([code+'\n'],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='portfolio.R';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('浏览器限制剪贴板，已下载 portfolio.R');}};
$('#exploreToggle').onclick=()=>E.active(explore)?exitExploration(false):beginExploration();$('#exitExplore').onclick=()=>exitExploration(false);$('#keepExplore').onclick=()=>exitExploration(true);$('#restartExplore').onclick=beginExploration;
$('#startRho').onclick=()=>{explore=E.idle();writeInputs(defaults);ordinarySnapshot=null;axisMode='auto';axes=null;axisBaseline=null;update();beginExploration();};
for(const button of document.querySelectorAll('[data-prediction]'))button.onclick=()=>{explore=E.transition(explore,{type:'CHOOSE',value:button.dataset.prediction});renderExploration();};
$('#confirmPrediction').onclick=()=>{explore=E.transition(explore,{type:'CONFIRM'});axisMode='fixed';axisBaseline={...explore.baseline};axisExpanded=false;axes=explore.task==='efficiency'?FinScale.range(m.points):FinScale.union(FinScale.range(m.points),FinScale.range(FinMath.model({...p,rho:-1}).points));selectStep(explore.task==='efficiency'?'weights':'correlation');update();$('#explorePanel').scrollTop=0;};
$('#explainVariance').onclick=()=>{if(!read())return;if(!E.canExplain(explore)){toast(explore.task==='efficiency'?'请先调整权重，再查看实验结果。':'请先降低相关系数，再查看实验结果。');return;}explore=E.transition(explore,{type:'EXPLAIN'});selectStep(explore.task==='efficiency'?'efficient':'variance');update();$('#explorePanel').scrollTop=0;};
$('#reexperiment').onclick=()=>{explore=E.transition(explore,{type:'REEXPERIMENT'});writeInputs(explore.baselineInputs);closePoint();clearComparison();selectStep(explore.task==='efficiency'?'weights':'correlation');update();$('#explorePanel').scrollTop=0;};
function pairTable(a,b,labels=['当前组合','改进组合']){const rows=[['Asset A',pct(a.w),pct(b.w)],['Asset B',pct(1-a.w),pct(1-b.w)],['Expected Return',pct(a.mean),pct(b.mean)],['Variance',Number(a.variance.toPrecision(6)).toString(),Number(b.variance.toPrecision(6)).toString()],['Portfolio Risk',pct(a.sd),pct(b.sd)]];return `<table class="experiment-table result-pair"><thead><tr><th>指标</th><th>${labels[0]}</th><th>${labels[1]}</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;}
function renderTeaching(){$('.explore-prompt>span').textContent=$('#exploreTask').value==='efficiency'?'试试看：风险更低的配置，可能具有更高的预期收益吗？':'试试看：降低相关系数，组合风险会如何变化？';const warnings=T.notices(p);$('#assumptionNotice').hidden=!warnings.length;$('#assumptionReasons').textContent=warnings.join('；');$('#assumptionBounds').textContent=`可配置示例范围：收益绝对值≤${pct(T.exampleRange.maxAbsReturn)}，波动率≤${pct(T.exampleRange.maxVolatility)}；高收益/低波动提示阈值为${pct(T.exampleRange.highReturn)}与${pct(T.exampleRange.lowVolatility)}。并非市场通用正常范围。`;
const d=T.diagnosis(p);$('#efficiencyStatus').disabled=explore.phase==='Predict';$('#efficiencyStatus').textContent=explore.phase==='Predict'?'提交预测后可查看组合诊断':d.efficient?'有效组合 · 查看原因':'非有效组合 · 查看改进配置';if(optimizationUndo&&optimizationUndo.after&&Object.keys(defaults).some(k=>optimizationUndo.after[k]!==p[k]))optimizationUndo=null;$('#undoImprovement').hidden=!optimizationUndo||E.active(explore);}
function renderDiagnosisDetails(){const d=T.diagnosis(p);$('#pointTitle').textContent=d.efficient?'有效组合':'非有效组合';$('#pointValues').innerHTML=d.efficient?`<p>在当前资产与不卖空约束下，不存在风险不更高、收益不更低且至少一项严格更优的配置。</p><p>${d.reason}</p>`:`<p>下列可行配置满足支配条件。它是数学证明，不是脱离风险偏好的“最佳投资”。</p>${pairTable(d.current,d.witness)}<p>支配证据：收益 ${pct(d.witness.mean)} ≥ ${pct(d.current.mean)}；风险 ${pct(d.witness.sd)} ≤ ${pct(d.current.sd)}，且至少一项严格改善。</p><p>${d.reason}</p><button id="applyImprovement" ${E.active(explore)?'disabled':''}>应用此配置</button>${E.active(explore)?'<p>探索期间保持控制变量；退出后可应用。</p>':''}`;}
function renderComparisonDetails(){if(!ordinarySnapshot)return;const c=T.comparison(ordinarySnapshot,p),labels={w:'A权重',wB:'B权重',mu1:'A收益',mu2:'B收益',s1:'A标准差',s2:'B标准差',rho:'相关系数'};const values=(key,x)=>key==='rho'?f(x):pct(x);$('#pointTitle').textContent='比较基准与当前模型';$('#pointValues').innerHTML=`<p>基准：${ordinarySnapshot.label}。${c.multiple?'本次涉及多个参数变化，不作单一因素归因。':'变化条件见下表。'}</p><table class="experiment-table"><thead><tr><th>参数</th><th>Before</th><th>After</th></tr></thead><tbody>${Object.keys(labels).map(k=>`<tr><th>${labels[k]}</th><td>${values(k,ordinarySnapshot.params[k])}</td><td>${values(k,k==='wB'?1-p.w:p[k])}</td></tr>`).join('')}</tbody></table>${pairTable(ordinarySnapshot.result,c.current.result,['基准模型','当前模型'])}`;}
$('#exploreTask').onchange=renderTeaching;
$('#saveBaseline').onclick=()=>{if(E.active(explore)||!read())return;ordinarySnapshot=T.snapshot(p,'手动设置');if(axisMode==='fixed'){axisBaseline={...p};axes=FinScale.range(m.points);axisExpanded=false;draw();}clearComparison();$('#viewComparison').hidden=false;toast('已保存完整参数与收益、方差、标准差作为比较基准');};
$('#viewComparison').onclick=()=>{if(ordinarySnapshot)showPoint('comparison',true);};$('#efficiencyStatus').onclick=()=>{if(explore.phase!=='Predict')showPoint('diagnosis',true);};
$('#pointValues').addEventListener('click',e=>{if(!e.target.closest('#applyImprovement')||E.active(explore))return;const d=T.diagnosis(p);if(!d.witness)return;optimizationUndo={raw:rawInputs(),previousBase:ordinarySnapshot,after:null};ordinarySnapshot=T.snapshot(p,'应用改进配置前');$('#w').value=String(d.witness.w*100);update();optimizationUndo.after={...p};toast('已应用可行改进配置；可撤销。它并非对所有风险偏好都最佳。');});
$('#undoImprovement').onclick=()=>{if(!optimizationUndo||E.active(explore))return;const previous=optimizationUndo;optimizationUndo=null;writeInputs(previous.raw);ordinarySnapshot=previous.previousBase;closePoint();p=null;update();toast('已撤销，恢复操作前参数');};
function renderEfficiencyExplanation(){const base=T.diagnosis(explore.baseline),current=T.diagnosis(p),exists=base.strictRiskImprovement,correct=explore.prediction===(exists?'yes':'no');$('#exploreExplanation').hidden=false;$('#exploreExplanation').innerHTML=`<p>你的预测：${explore.prediction==='yes'?'存在':'不存在'}<br>模型结论：${exists?'存在':'不存在'}满足“收益不低且风险严格更低”的可行配置。<br>${correct?'预测正确':'预测与模型结论不一致'}</p>${pairTable(explore.baseResult,explore.result,['起始组合','本次试配'])}<p>本次试配${current.efficient?'位于有效部分':'仍不是有效组合'}。问题判断针对是否存在配置，不以你是否恰好试到该配置代替数学判断。</p>${base.witness?`<p>可验证的支配配置：</p>${pairTable(base.current,base.witness,['起始组合','支配配置'])}`:'<p>当前起始组合没有可验证的严格改进配置。</p>'}<p>${base.reason}若风险恒定但收益不同，可以存在同风险更高收益配置，而没有风险严格更低的配置。有效性必须同时考察收益与风险。禁止卖空，权重合计为1。</p><pre>${escapeHTML(steps.filter(s=>['weights','mean','variance','boundaryVariance','sd','efficient'].includes(s.id)).flatMap(s=>s.lines).join('\n'))}</pre>`;}
function loadTeachingPreset(raw,name){explore=E.idle();optimizationUndo=null;ordinarySnapshot=null;axes=null;axisMode='auto';axisBaseline=null;axisExpanded=false;clearComparison();closePoint();writeInputs(raw);p=null;$('#assumptionNotice').open=false;update();toast('已加载'+name+'；参数、比较与探索已重置');}
function closeMobileNav(){$('#mobileNav').hidden=true;$('#mobileMenu').setAttribute('aria-expanded','false');}
$('#mobileMenu').onclick=()=>{const open=$('#mobileNav').hidden;$('#mobileNav').hidden=!open;$('#mobileMenu').setAttribute('aria-expanded',String(open));};
for(const b of document.querySelectorAll('[data-mobile]'))b.onclick=()=>{closeMobileNav();if(b.dataset.mobile==='catalog')ModalUI.open($('#catalogDialog'));else if(b.dataset.mobile==='help')ModalUI.open($('#helpDialog'));else workbench();};
function workbench(){closeMobileNav();for(const d of document.querySelectorAll('dialog[open]'))d.close();$('#workbenchNav').classList.add('active');$('#workbenchNav').setAttribute('aria-current','page');location.hash='workbench';window.scrollTo({top:0,behavior:'instant'});}
$('#workbenchNav').onclick=workbench;$('.brand').onclick=e=>{e.preventDefault();workbench();};$('#catalogNav').onclick=()=>ModalUI.open($('#catalogDialog'));$('#helpNav').onclick=()=>ModalUI.open($('#helpDialog'));CourseExperiments.mount('portfolio');for(const [key,label]of [['assetA','资产A端点'],['assetB','资产B端点']]){const b=document.createElement('button');b.textContent=label;b.dataset.point=key;pointInteraction.bind(b,key);$('.point-identities').append(b);const legend=document.createElement('button');legend.textContent=label;pointInteraction.bind(legend,key);$('.legend').append(legend);}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();for(const b of document.querySelectorAll('.unavailable'))b.onclick=()=>toast('该实验暂未上线，敬请期待。');
function projector(on){document.body.classList.toggle('projector',on);$('#projector').textContent=on?'退出投屏':'投屏模式';$('#projector').setAttribute('aria-pressed',String(on));}
$('#projector').onclick=()=>{closePoint();projector(!document.body.classList.contains('projector'));};document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMobileNav();closePoint();exitExploration();projector(false);}});
FinClassroom.mount({loadPreset:loadTeachingPreset,selectStep});setSplit(.68);update();
FinTypography.observeChart(()=>{if(m)draw();});

// Reading mode never changes the standalone script copied by the main action.
document.querySelectorAll('[data-portfolio-code]').forEach(b=>b.onclick=()=>{portfolioCodeMode=b.dataset.portfolioCode;renderCode();renderExplanation();});
$('#portfolioPractice').onclick=()=>{$('#portfolioRTask').textContent='在全新R会话中复制完整脚本并整段运行，仅需基础R。当前预期收益='+pct(m.current.mean)+'，标准差='+pct(m.current.sd)+'。固定资产条件，只改变权重，比较最小方差位置与有效前沿；收益和风险使用同一期限的小数单位。';ModalUI.open($('#portfolioRDialog'));};

;

/* Source: portfolio-multi-math.js */
/* Experiment 08: small convex QP, exhaustive active faces (n <= 5).
   No sampled envelope, package, network, or silent regularization. */
(function(root){'use strict';
const sum=a=>a.reduce((x,y)=>x+y,0),dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
function solve(A,b){const n=b.length,a=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[p][k]))p=i;if(Math.abs(a[p][k])<1e-12)return null;[a[p],a[k]]=[a[k],a[p]];const d=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=d;for(let i=0;i<n;i++)if(i!==k){const f=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=f*a[k][j];}}return a.map(r=>r[n]);}
function eigen(A){const a=A.map(r=>r.slice()),n=a.length;for(let k=0;k<100*n*n;k++){let p=0,q=1;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}if(Math.abs(a[p][q])<1e-14)break;const t=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(t),s=Math.sin(t),ap=a[p][p],aq=a[q][q],v=a[p][q];for(let i=0;i<n;i++)if(i!==p&&i!==q){const x=a[i][p],y=a[i][q];a[i][p]=a[p][i]=c*x-s*y;a[i][q]=a[q][i]=s*x+c*y;}a[p][p]=c*c*ap-2*s*c*v+s*s*aq;a[q][q]=s*s*ap+2*s*c*v+c*c*aq;a[p][q]=a[q][p]=0;}return a.map((r,i)=>r[i]).sort((x,y)=>x-y);}
function checkMatrix(S,n){if(!Array.isArray(S)||S.length!==n||S.some(r=>!Array.isArray(r)||r.length!==n||r.some(x=>!Number.isFinite(x))))throw Error('矩阵必须为完整的有限数值方阵。');const scale=Math.max(...S.map((r,i)=>Math.abs(r[i])),1e-30);for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(Math.abs(S[i][j]-S[j][i])>scale*1e-10)throw Error('矩阵必须对称；请同时填写上下三角。');const ev=eigen(S.map(r=>r.map(x=>x/scale)));if(ev[0]<-1e-10)throw Error('相关或协方差矩阵非半正定（PSD），请检查成对相关性。未自动修复。');return {scale,eigen:ev};}
function prepare(mu,S,ridge=false){const n=mu.length;if(n<2||n>5||mu.some(x=>!Number.isFinite(x)))throw Error('需要2至5项有限收益率。');const info=checkMatrix(S,n);if(info.eigen[0]<=1e-10&&!ridge)throw Error('协方差奇异或近奇异；请增加独立样本、修改假设，或主动勾选岭正则后重新计算。');if(info.scale===1e-30)throw Error('所有资产波动为零，无法使用此优化器。');const lambda=ridge?info.scale*1e-6:0;return {mu:mu.slice(),raw:S.map(r=>r.slice()),S:S.map((r,i)=>r.map((x,j)=>x+(i===j?lambda:0))),lambda,info};}
function covariance(s,rho){const n=s.length;if(s.some(x=>!Number.isFinite(x)||x<0))throw Error('波动率必须非负且有限。');checkMatrix(rho,n);for(let i=0;i<n;i++){if(Math.abs(rho[i][i]-1)>1e-12)throw Error('相关矩阵对角线必须为1。');if(rho[i].some(x=>Math.abs(x)>1))throw Error('相关系数必须位于[-1,1]。');}return rho.map((r,i)=>r.map((x,j)=>s[i]*x*s[j]));}
function weights(w){if(w.some(x=>!Number.isFinite(x)||x<0)||Math.abs(sum(w)-1)>1e-8)throw Error('禁止卖空：权重需非负且合计为100%。请使用“按比例归一”或手动补足。');}
function point(model,w){weights(w);if(w.length!==model.mu.length)throw Error('权重数量与资产数不一致。');const variance=dot(w,model.S.map(r=>dot(r,w)));return {w:w.slice(),mean:dot(w,model.mu),variance,sd:Math.sqrt(Math.max(0,variance))};}
function optimize(model,target=null){const {mu,S}=model,n=mu.length,lo=Math.min(...mu),hi=Math.max(...mu),span=hi-lo,scale=Math.max(...S.map((r,i)=>r[i]));if(target!==null&&(!Number.isFinite(target)||target<lo-1e-11||target>hi+1e-11))throw Error('目标收益不可行：禁止卖空时须位于资产收益的最小值与最大值之间。');const targetRow=target!==null&&span>1e-12;let best=null;
for(let mask=1;mask<(1<<n);mask++){const ids=Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i)),k=ids.length,A=[ids.map(()=>1)],b=[1];if(targetRow){A.push(ids.map(i=>(mu[i]-lo)/span));b.push((target-lo)/span);}const c=A.length;if(k<c) {if(k===1&&target!==null&&Math.abs(mu[ids[0]]-target)<1e-10){const w=Array(n).fill(0);w[ids[0]]=1;const q=point(model,w);if(!best||q.variance<best.variance-1e-14*scale)best=q;}continue;}
const K=Array.from({length:k+c},()=>Array(k+c).fill(0));for(let i=0;i<k;i++){for(let j=0;j<k;j++)K[i][j]=S[ids[i]][ids[j]]/scale;for(let j=0;j<c;j++)K[i][k+j]=K[k+j][i]=A[j][i];}const x=solve(K,[...Array(k).fill(0),...b]);if(!x||x.slice(0,k).some(v=>v< -1e-9))continue;const w=Array(n).fill(0);ids.forEach((id,i)=>w[id]=Math.max(0,x[i]));const total=sum(w);for(let i=0;i<n;i++)w[i]/=total;const q=point(model,w);if(target!==null&&Math.abs(q.mean-target)>1e-8)continue;if(!best||q.variance<best.variance-1e-14*scale)best=q;}
if(!best)throw Error('未获得可行解：请检查目标与矩阵条件。');return best;}
function frontier(model,count=61){const gmv=optimize(model),hi=Math.max(...model.mu);const length=hi-gmv.mean<1e-12?1:count;return {gmv,points:Array.from({length},(_,i)=>optimize(model,gmv.mean+(hi-gmv.mean)*(length===1?0:i/(length-1))))};}
function samples(model,count=360){let seed=8128;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};return [...model.mu.map((_,i)=>point(model,model.mu.map((_,j)=>+(i===j)))),...Array.from({length:count},()=>{let w=model.mu.map(()=>-Math.log(random()));const s=sum(w);return point(model,w.map(v=>v/s));})];}
root.PortfolioMulti={sum,dot,solve,eigen,checkMatrix,prepare,covariance,weights,point,optimize,frontier,samples};if(typeof module!=='undefined')module.exports=root.PortfolioMulti;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: portfolio-csv.js */
/* Local-only CSV ingestion. Explicit errors and complete-case policy. */
(function(root){'use strict';
function parse(text){text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,ended=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;ended=true;}else cell+=c;}else if(c==='"'){if(cell.trim()||ended)throw Error('CSV引号位置非法。');quoted=true;}else if(c===','||c==='\n'||c==='\r'){row.push(cell.trim());cell='';ended=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}}else {if(ended&&!/\s/.test(c))throw Error('引号结束后存在非法字符。');cell+=c;}}if(quoted)throw Error('CSV引号没有闭合。');if(cell||row.length){row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);}if(rows.length<3)throw Error('CSV至少需要表头和两行数据。');const headers=rows.shift();if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('列名为空或重复；请使用唯一列名。');if(rows.some(r=>r.length!==headers.length))throw Error('CSV列数不一致。只支持逗号分隔、首行列名。');return {headers,rows};}
function dateValue(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('日期必须为YYYY-MM-DD，且不能为空。');const t=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==s)throw Error('日期不存在：'+s);return t;}
function ingest(table,{date,assets,kind='price',method='simple',missing='reject',sort=false,factor=252}={}){if(assets.length<3||assets.length>5)throw Error('请选择3至5个不同资产列。');if(new Set(assets).size!==assets.length||assets.includes(date))throw Error('日期列不能兼作资产，资产列不能重复。');if(!Number.isFinite(factor)||factor<=0||factor>10000)throw Error('年化因子必须在(0,10000]。');const di=table.headers.indexOf(date),ai=assets.map(x=>table.headers.indexOf(x));if(di<0||ai.includes(-1))throw Error('所选列不存在。');let rows=table.rows.map(r=>({date:r[di],time:dateValue(r[di]),values:ai.map(i=>r[i])}));const seen=new Set();for(const r of rows){if(seen.has(r.date))throw Error('重复日期：'+r.date+'。不会自动合并。');seen.add(r.date);}const unsorted=rows.some((r,i)=>i&&r.time<rows[i-1].time);if(unsorted&&!sort)throw Error('日期未单调递增；勾选“按日期排序”后可显式排序。');if(sort)rows.sort((a,b)=>a.time-b.time);let dropped=0;rows=rows.filter(r=>{if(r.values.some(x=>x===''||/^(NA|N\/A|null)$/i.test(x))){if(missing!=='complete')throw Error('存在缺失值；可选择按整行删除并显示删除数量。');dropped++;return false;}return true;});for(const r of rows){r.values=r.values.map(x=>{if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(x)||!Number.isFinite(+x))throw Error('非数值资产值：'+x+'。收益率请用小数，不要含%符号。');return +x;});if(kind==='price'&&r.values.some(x=>x<=0))throw Error('价格必须严格为正，不能包含0或负值。');if(kind==='return'&&r.values.some(x=>x< -1))throw Error('简单收益率不能小于-1。');}
if(kind==='return'&&method==='log'&&rows.some(r=>r.values.some(x=>x<=-1)))throw Error('简单收益率为-1时不能转换为对数收益率。');
const returns=kind==='price'?rows.slice(1).map((r,i)=>r.values.map((x,j)=>method==='log'?Math.log(x/rows[i].values[j]):x/rows[i].values[j]-1)):rows.map(r=>r.values.map(x=>method==='log'?Math.log1p(x):x));if(returns.length<assets.length+2)throw Error('有效收益样本不足：至少需要资产数+2行收益；建议更长历史。');
const gaps=rows.slice(1).map((r,i)=>(r.time-rows[i].time)/86400000),sorted=gaps.slice().sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];return {names:assets.slice(),returns,dates:kind==='price'?rows.slice(1).map(r=>r.date):rows.map(r=>r.date),sourceRows:rows.length,dropped,sorted:unsorted&&sort,kind,method,factor,from:rows[0].date,to:rows.at(-1).date,medianGap:median,maxGap:Math.max(...gaps)};}
function estimate(data,factor=data.factor,rows=data.returns){const n=data.names.length,T=rows.length;if(T<n+2)throw Error('本次窗口样本不足，需要至少资产数+2行。');const mean=Array.from({length:n},(_,j)=>rows.reduce((s,r)=>s+r[j],0)/T),cov=mean.map((_,i)=>mean.map((_,j)=>rows.reduce((s,r)=>s+(r[i]-mean[i])*(r[j]-mean[j]),0)/(T-1)*factor));return {mu:mean.map(x=>x*factor),S:cov,se:cov.map((r,i)=>Math.sqrt(r[i]/T*factor)),T,factor};}
function template(){let text='date,示例A,示例B,示例C,示例D,示例E\n';let prices=[100,100,100,100,100];for(let i=0;i<65;i++){const date=new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10);prices=prices.map((x,j)=>x*(1+.0003*(j+1)+.008*Math.sin(i*(j+1)*.53+j)+.003*Math.cos(i*.91+j*2)));text+=date+','+prices.map(x=>x.toFixed(8)).join(',')+'\n';}return text;}
root.PortfolioCSV={parse,dateValue,ingest,estimate,template};if(typeof module!=='undefined')module.exports=root.PortfolioCSV;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: portfolio-multi-code.js */
/* Self-contained base R. Uploaded observations are embedded, never file paths. */
(function(root){'use strict';
const vector=a=>'c('+a.map(x=>Number(x).toString()).join(', ')+')',matrix=a=>'matrix('+vector(a.flat())+', nrow='+a.length+', byrow=TRUE)';
function build(model,w,names,context={}){const {data,factor=1,scenario='full'}=context;const s=context.manual?.s||model.raw.map((r,i)=>Math.sqrt(r[i]));const rho=context.manual?.rho||model.raw.map((r,i)=>r.map((x,j)=>s[i]*s[j]>0?x/(s[i]*s[j]):+(i===j)));let input=data?`# 用户本地CSV的清洗后收益样本；不依赖外部文件或网络\n# 已按日期对齐；${data.method==='log'?'对数':'简单'}收益；原输入${data.kind==='price'?'价格':'简单收益率'}\n# 样本范围 ${data.from} 至 ${data.to}；删除缺失行 ${data.dropped}\nobservations <- ${matrix(data.returns)}\nfactor <- ${factor}\nscenario <- "${scenario}"\nif (scenario == "first") observations <- observations[seq_len(floor(nrow(observations)/2)), , drop=FALSE]\nif (scenario == "second") observations <- observations[(floor(nrow(observations)/2)+1):nrow(observations), , drop=FALSE]\nmu <- colMeans(observations) * factor\nSigma_raw <- cov(observations) * factor\nse <- sqrt(diag(Sigma_raw) / nrow(observations) * factor)\nif (scenario == "up") mu[1] <- mu[1] + se[1]\nif (scenario == "down") mu[1] <- mu[1] - se[1]`:`# 教学假设，非真实市场数据；同一期限的小数单位\nmu <- ${vector(model.mu)}\ns <- ${vector(s)}\nrho <- ${matrix(rho)}\nSigma_raw <- diag(s) %*% rho %*% diag(s)`;
return `# 实验08：Markowitz 均值-方差决策；基础R，无额外包
# 约束：sum(w)=1, w>=0；不支持卖空、杠杆、无风险资产或交易成本
# 1. 当前参数与可复现数据
${input}
asset_names <- ${JSON.stringify(names).replace(/^\[/,'c(').replace(/\]$/,')')}
w <- ${vector(w)}
lambda <- ${model.lambda}
# 主动选择岭正则时加 lambda*I，优化目标随之改变
Sigma <- Sigma_raw + diag(lambda, length(mu))
stopifnot(length(mu) >= 2, length(mu) <= 5,
          all(w >= 0), abs(sum(w)-1) < 1e-8,
          min(eigen(Sigma, symmetric=TRUE)$values) > 0)
# 2. 收益 w^T mu；方差 w^T Sigma w；风险为方差开根号
portfolio <- function(w) {
  v <- as.numeric(t(w) %*% Sigma %*% w)
  list(w=w, mean=sum(w*mu), variance=v, sd=sqrt(max(0,v)))
}
current <- portfolio(w)
# 3. 枚举非空活跃面，求解各面的拉格朗日方程，比较全局最小值
# n<=5最多31个面；凸正定目标保证最优；采样不参与优化
optimize_portfolio <- function(target=NULL) {
  n <- length(mu); low <- min(mu); high <- max(mu)
  span <- high-low; scale <- max(diag(Sigma)); best <- NULL
  if (!is.null(target) && (target < low-1e-11 || target > high+1e-11))
    stop("Target return infeasible under long-only constraints")
  for (mask in seq_len(2^n-1)) {
    ids <- which(as.logical(intToBits(mask)[seq_len(n)]))
    k <- length(ids); A <- matrix(1, nrow=1, ncol=k); b <- 1
    if (!is.null(target) && span > 1e-12) {
      A <- rbind(A, (mu[ids]-low)/span); b <- c(1,(target-low)/span)
    }
    nc <- nrow(A)
    if (k < nc) {
      if (k == 1 && !is.null(target) && abs(mu[ids]-target) < 1e-10) {
        ww <- numeric(n); ww[ids] <- 1; q <- portfolio(ww)
        if (is.null(best) || q$variance < best$variance-1e-14*scale) best <- q
      }
      next
    }
    K <- rbind(cbind(Sigma[ids,ids,drop=FALSE]/scale,t(A)),
               cbind(A,matrix(0,nc,nc)))
    x <- tryCatch(solve(K,c(rep(0,k),b),tol=1e-12), error=function(e) NULL)
    if (is.null(x) || any(x[seq_len(k)] < -1e-9)) next
    ww <- numeric(n); ww[ids] <- pmax(0,x[seq_len(k)]); ww <- ww/sum(ww)
    q <- portfolio(ww)
    if (!is.null(target) && abs(q$mean-target)>1e-8) next
    if (is.null(best) || q$variance < best$variance-1e-14*scale) best <- q
  }
  if (is.null(best)) stop("No feasible solution")
  best
}
gmv <- optimize_portfolio()
# 4. 从GMV到最高收益端点，逐个目标收益进行真正的约束优化
n_frontier <- if (max(mu)-gmv$mean < 1e-12) 1 else 61
targets <- seq(gmv$mean,max(mu),length.out=n_frontier)
frontier <- lapply(targets, optimize_portfolio)
frontier_risk <- vapply(frontier,function(q) q$sd,numeric(1))
# 5. 仅用于展示可行集的确定性采样；不是精确边界
seed <- 8128
uniform <- function() { seed <<- (seed*16807) %% 2147483647; seed/2147483647 }
sample_w <- diag(length(mu))
for (i in seq_len(360)) {
  ww <- -log(vapply(seq_along(mu),function(j) uniform(),numeric(1)))
  sample_w <- rbind(sample_w,ww/sum(ww))
}
cloud <- lapply(seq_len(nrow(sample_w)),function(i) portfolio(sample_w[i,]))
cloud_risk <- vapply(cloud,function(q) q$sd,numeric(1))
cloud_return <- vapply(cloud,function(q) q$mean,numeric(1))
plot(cloud_risk,cloud_return,col="grey75",pch=16,cex=.45,
     xlab="Risk (SD, decimal)",ylab="Expected return (decimal)",
     xlim=range(c(cloud_risk,frontier_risk,current$sd)),
     ylim=range(c(cloud_return,targets,current$mean)))
lines(frontier_risk,targets,col="seagreen",lwd=3)
points(frontier_risk,targets,col="seagreen",pch=16,cex=.4)
points(gmv$sd,gmv$mean,col="seagreen",pch=5,cex=1.5)
points(current$sd,current$mean,col="steelblue",pch=19,cex=1.3)
legend("topleft",c("Sampled feasible points","Optimized frontier","GMV","Current"),
       col=c("grey75","seagreen","seagreen","steelblue"),pch=c(16,16,5,19),bty="n")
# 6. 核对网页；方差为小数平方，标准差使用小数
print(data.frame(asset=asset_names,current=w,gmv=gmv$w))
print(unlist(current[c("mean","variance","sd")]))
print(unlist(gmv[c("mean","variance","sd")]))
print(Sigma_raw)
# RStudio实践：改一个收益假设或权重后重跑，对比GMV与前沿。
# CSV原始价格可用 read.csv(file.choose(), check.names=FALSE) 读取；
# 确保按日期排序、完整行对齐，再按本文口径计算收益与cov()。
`;
}
root.PortfolioMultiCode={build};if(typeof module!=='undefined')module.exports=root.PortfolioMultiCode;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: portfolio-ux.js */
/* Interaction arithmetic only; the validated optimization engine is unchanged. */
(function(root){'use strict';
function values(raw){return raw.map(x=>{const s=String(x).trim();if(!s||!/^\+?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)||!Number.isFinite(+s))throw Error('权重需为有限数字，不能留空或为负数。');return +s/100;});}
const sum=a=>a.reduce((x,y)=>x+y,0);
function normalize(w){if(w.some(x=>!Number.isFinite(x)||x<0))throw Error('只可归一化非负有限权重。');const total=sum(w);if(!(total>0)||!Number.isFinite(total))throw Error('所有权重合计为0，无法归一化。');const next=w.map(x=>x/total),j=next.indexOf(Math.max(...next));next[j]+=1-sum(next);return next;}
function adjust(w,i,u){if(!Number.isFinite(u)||u<0||u>1)throw Error('便捷调整的单项权重必须在0%到100%之间。');if(w.some(x=>!Number.isFinite(x)||x<0)||Math.abs(sum(w)-1)>1e-8)throw Error('请先恢复有效权重。');const rest=sum(w.filter((_,j)=>j!==i)),remaining=1-u,fallback=rest===0&&remaining>0;const next=w.map((x,j)=>j===i?u:rest>0?x/rest*remaining:remaining/(w.length-1));const j=next.map((x,j)=>j===i?-1:x).indexOf(Math.max(...next.map((x,j)=>j===i?-1:x)));next[j]+=1-sum(next);return {w:next,fallback};}
function near(a,b){return Math.abs(a-b)<=1e-9+1e-8*Math.max(Math.abs(a),Math.abs(b));}
const same=(a,b)=>!!a&&!!b&&near(a.mean,b.mean)&&near(a.sd,b.sd);
function comparison(before,after,constraints,label){return {before:structured(before),after:structured(after),constraints:structured(constraints),label,deltaMu:after.mean-before.mean,deltaSd:after.sd-before.sd,noChange:same(before,after)};}
const structured=x=>JSON.parse(JSON.stringify(x));
function diagnosis(M,model,current,gmv){const equal=M.optimize(model,current.mean),witness=M.optimize(model,Math.max(current.mean,gmv.mean));const tolV=1e-12+1e-8*Math.max(current.variance,witness.variance),tolMu=1e-9+1e-8*Math.max(Math.abs(current.mean),Math.abs(witness.mean));return {equal,witness,dominated:witness.variance<current.variance-tolV||witness.mean>current.mean+tolMu};}
root.PortfolioUX={values,sum,normalize,adjust,near,same,comparison,diagnosis};if(typeof module!=='undefined')module.exports=root.PortfolioUX;
})(typeof window!=='undefined'?window:globalThis);

;

/* Source: portfolio-multi-ui.js */
/* Experiment08 extension mounted beside, not replacing, the mature two-asset lab. */
(()=>{'use strict';
const M=PortfolioMulti,C=PortfolioCSV,Code=PortfolioMultiCode,U=PortfolioUX,el=id=>document.getElementById(id),pct=x=>(100*x).toFixed(2)+'%',safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav=document.createElement('nav');nav.className='portfolio-modes';nav.setAttribute('aria-label','投资组合工作台模式');nav.innerHTML='<button id="dualMode" aria-pressed="true">双资产直觉</button><button id="multiMode" aria-pressed="false">多资产组合</button><span>从共同波动，到约束优化</span>';el('workspace').before(nav);
const panel=document.createElement('section');panel.id='multiWorkspace';panel.className='workspace multi-workspace';panel.hidden=true;
panel.innerHTML=`<article class="panel code-panel multi-code"><div class="panel-head"><h2>R Code</h2><button id="multiCopy">复制完整 R 代码</button></div><div class="portfolio-code-toolbar"><button id="multiFull" aria-pressed="true">完整代码</button><button id="multiBasic" aria-pressed="false">关键逻辑</button><button id="multiPractice">RStudio 实践</button></div><nav id="multiCodeNav" class="multi-code-nav" aria-label="完整R代码段落导航"><button data-code-section="params">参数</button><button data-code-section="covariance">协方差</button><button data-code-section="risk">组合风险</button><button data-code-section="gmv">GMV</button><button data-code-section="frontier">有效前沿</button></nav><div id="multiCode" aria-label="点击代码行查看解释"></div><section id="multiExplanation" class="explanation" aria-live="polite"></section></article>
<article class="panel model-panel"><div class="panel-head"><h2>Model Visualization</h2><span id="multiUnit">年化</span></div><p class="multi-question">相同的收益目标，怎样承担更少风险？</p><div class="multi-result"><span>当前组合收益 μ <b id="multiReturn">—</b></span><span>当前组合风险 σ <b id="multiRisk">—</b></span></div><div class="plot-area multi-plot"><svg id="multiChart" viewBox="0 0 600 440" role="group" aria-label="多资产风险收益平面"></svg><div id="multiTip" class="point-details" hidden></div></div><div class="legend"><span><i class="point cloud-key"></i>采样可行点 ≠ 精确边界</span><span><i class="line efficient"></i>精确优化前沿</span><button id="multiShowCurrent"><i class="multi-key current"></i>当前组合</button><button id="multiShowGMV"><i class="multi-key gmv"></i>GMV</button><button id="multiShowTarget"><i class="multi-key target"></i>目标收益组合</button><button id="multiShowBefore" hidden><i class="multi-key before"></i>调整前</button></div><p id="multiStatus" class="multi-status" aria-live="polite"></p><div class="multi-actions"><button id="multiApplyGMV">应用 GMV 权重</button><button id="multiApplyTarget">应用目标收益组合</button></div><section id="multiComparison" class="multi-comparison" aria-label="最近一次模拟配置调整前后对比" hidden></section><p id="multiChange" class="multi-change" aria-live="polite">“应用”只改变模型权重，不执行市场交易。</p><details class="multi-detail"><summary>看懂有效性与约束</summary><p>有效组合不存在风险不更高、收益不更低且至少一项严格改善的可行配置。绿色前沿只取GMV到最高收益的一段；低于GMV收益的最小方差解仍可能非有效。</p><p>当前组合来自已应用权重，不一定最优。GMV是在当前约束下风险最低的组合，但不一定是收益最高的组合。目标收益组合是指定收益下方差最低的优化结果，点击应用前不会改变当前模型权重。<br>标准模型：min wᵀΣw，约束 1ᵀw=1，w≥0；目标收益解另加 μᵀw=r。最多5资产，枚举所有非空活跃面求精确凸二次优化；曲线连接61个优化解，点间显示是插值。灰点仅为采样展示。</p><p>本版禁止卖空、不含无风险资产、不含交易成本。样本期望与协方差不等于未来真值；简单收益均值线性年化不等于复利预测，对数收益也不等于简单收益。</p></details></article>
<section class="panel parameters multi-parameters"><div class="panel-head"><h2>Parameters</h2><button id="multiReset">恢复默认</button></div><div class="multi-controls"><label>资产数量 <select id="multiN"><option>3</option><option>4</option><option>5</option></select></label><p class="period-label">禁止卖空 · 全额投资 · 无无风险资产</p><div id="multiAssumptions"></div><details id="multiMatrixDetails"><summary>完整相关矩阵 ρ 与协方差 Σ</summary><p>ρ上下三角需一致；Σ=diag(σ)ρdiag(σ)。输入只在合法且PSD时生效。</p><div id="multiRho"></div><pre id="multiSigma"></pre></details><label class="multi-check"><input id="multiRidge" type="checkbox">主动使用岭正则 λ=max(diag Σ)×10⁻⁶</label><p id="multiRidgeNote" class="period-label"></p><h3>当前权重</h3><div class="multi-weight-modes" role="group" aria-label="权重调整方式"><button id="multiEasy" aria-pressed="true">便捷调整</button><button id="multiExact" aria-pressed="false">精确输入</button></div><p id="multiWeightRule" class="period-label"></p><div id="multiWeights"></div><div class="multi-weight-actions"><b id="multiSum"></b><button id="multiNormalize">按比例归一化</button></div><p id="multiPending" role="status"></p><div class="multi-draft-actions"><button id="multiCommitWeights">应用权重草稿</button><button id="multiDiscardDraft" hidden>放弃草稿</button></div><label>目标收益（%）<input id="multiTarget" type="number" step="any" value="12"></label><p id="multiTargetNote" class="period-label"></p><p id="multiError" class="multi-error" role="alert"></p>
<details id="multiData"><summary>本地 CSV 数据实践</summary><p>只在浏览器内读取，不上传服务器或第三方；刷新即清空。复制脚本会包含清洗后收益数据，请按需保存。</p><input id="multiFile" type="file" accept=".csv,text/csv" aria-label="上传本地CSV"><button id="multiTemplate">下载合成价格示例</button><p class="period-label">示例由确定性公式生成，非真实市场数据。未内置来源与再分发许可均已核实的历史行情。</p><div id="multiImportOptions" hidden><label>日期列 <select id="multiDateColumn"></select></label><fieldset><legend>选择3至5个资产列</legend><div id="multiAssetColumns"></div></fieldset><label>输入类型 <select id="multiKind"><option value="price">价格（须自行确认复权口径）</option><option value="return">简单收益率（小数）</option></select></label><label>收益口径 <select id="multiMethod"><option value="simple">简单收益</option><option value="log">对数收益 / log1p转换</option></select></label><label>缺失处理 <select id="multiMissing"><option value="reject">拒绝并提示</option><option value="complete">删除任一资产缺失的整行</option></select></label><label class="multi-check"><input id="multiSort" type="checkbox">显式按日期升序排列</label><label>数据频率 <select id="multiFrequency"><option value="252">日度（252）</option><option value="12">月度（12）</option><option value="1">年度（1）</option><option value="365">每日含周末（365）</option></select></label><label>年化因子 <input id="multiFactor" type="number" step="any" value="252"></label><button id="multiImport">使用所选数据</button></div><p id="multiDataInfo" aria-live="polite"></p><div id="multiDataAnalysis" hidden><label>显示单位 <select id="multiDisplayUnit"><option value="annual">年化</option><option value="period">每期</option></select></label><label>估计不确定性实验 <select id="multiScenario"><option value="full">完整样本</option><option value="first">前半段估计 μ 与 Σ</option><option value="second">后半段估计 μ 与 Σ</option><option value="up">资产A均值 +1标准误</option><option value="down">资产A均值 −1标准误</option></select></label><p id="multiUncertainty"></p><button id="multiExportData">导出清洗后收益CSV</button><button id="multiManual">返回教学假设</button></div></details>
<details class="multi-challenge"><summary>可选课堂挑战</summary><p>双资产：固定σ与权重降低ρ，风险一定严格下降吗？尝试零权重，解释2w₁w₂σ₁σ₂Δρ的符号。多资产：只改一对相关性时仍须整体PSD，不能任意拼接。</p><p>数据实践：导入自己的CSV，切换前/后半段，记录GMV与前沿变化；再对A收益加减1标准误，观察权重敏感性。标准误使用独立同分布近似，忽略自相关与结构变化，不能作为收益保证。</p></details></div></section>`;
el('workspace').after(panel);
let active=false,n=3,names=[],data=null,table=null,model=null,result=null,current=null,targetPoint=null,code='',valid=false,full=true,lastApplied=null,manualInputs=null,committedWeights=[],weightDrafts=[],dirtyWeights=new Set(),weightMode='easy',selectedCodeLine=null,selectedCodeSection=null,selectedCodeKey=null;
const initialMu=[8,14,11,6,17],initialSd=[12,22,17,9,28];
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function controls(count,reset=true){n=count;names=data?data.names.slice():Array.from({length:n},(_,i)=>'资产'+String.fromCharCode(65+i));el('multiN').value=String(n);el('multiN').disabled=!!data;
el('multiAssumptions').innerHTML='<table class="assumptions multi-table"><thead><tr><th>资产</th><th>μ (%)</th><th>σ (%)</th></tr></thead><tbody>'+names.map((x,i)=>`<tr><th>${safe(x)}</th><td><input id="multiMu${i}" type="number" step="any" value="${initialMu[i]}" aria-label="${safe(x)}预期收益率" ${data?'disabled':''}></td><td><input id="multiSd${i}" type="number" step="any" value="${initialSd[i]}" aria-label="${safe(x)}波动率" ${data?'disabled':''}></td></tr>`).join('')+'</tbody></table>';
el('multiRho').innerHTML='<table class="multi-rho"><thead><tr><th>ρ</th>'+names.map((_,i)=>'<th>'+String.fromCharCode(65+i)+'</th>').join('')+'</tr></thead><tbody>'+names.map((_,i)=>'<tr><th>'+String.fromCharCode(65+i)+'</th>'+names.map((_,j)=>`<td><input id="multiRho${i}_${j}" type="number" step="any" value="${i===j?1:.2}" aria-label="相关系数${i+1},${j+1}" ${data?'disabled':''}></td>`).join('')+'</tr>').join('')+'</tbody></table>';
committedWeights=Array.from({length:n},(_,i)=>(Math.floor(100/n)+(i===0?100%n:0))/100);weightDrafts=committedWeights.map(x=>String(x*100));dirtyWeights.clear();lastApplied=null;
el('multiWeights').innerHTML=names.map((x,i)=>`<label class="multi-weight"><span>${safe(x)}</span><span class="multi-weight-input"><input id="multiW${i}" type="text" inputmode="decimal" value="${(committedWeights[i]*100).toFixed(2)}" aria-label="${safe(x)}权重百分比" autocomplete="off"><span>%</span></span></label>`).join('');
for(const input of [...el('multiAssumptions').querySelectorAll('input'),...el('multiRho').querySelectorAll('input')])input.addEventListener('input',recalculate);
for(let i=0;i<n;i++){const input=el('multiW'+i);input.onfocus=()=>{input.value=weightDrafts[i];input.dataset.start=input.value;input.select();};input.oninput=()=>{weightDrafts[i]=input.value;dirtyWeights.add(i);pendingState();};input.onblur=()=>{if(dirtyWeights.has(i))commitWeight(i);formatWeights();};input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commitWeight(i);}if(e.key==='Escape'){e.preventDefault();discardDraft();}};}
if(reset)el('multiChange').textContent='便捷调整会按明示规则分配其余权重；应用只改变模型配置，不是真实交易。';weightModeUI();}
function formatWeights(){for(let i=0;i<n;i++){const input=el('multiW'+i);if(document.activeElement===input)continue;const raw=weightDrafts[i];input.value=raw.trim()&&Number.isFinite(+raw)?(+raw).toFixed(2):raw;}}
function syncWeights(){weightDrafts=committedWeights.map(x=>String(x*100));dirtyWeights.clear();for(let i=0;i<n;i++){const input=el('multiW'+i);input.value=document.activeElement===input?weightDrafts[i]:(committedWeights[i]*100).toFixed(2);input.setAttribute('aria-invalid','false');}pendingState();}
function pendingState(){const pending=dirtyWeights.size>0;let total;try{total=U.sum(U.values(weightDrafts));}catch{}el('multiSum').textContent=(pending?'草稿合计：':'当前合计：')+(total===undefined?'待完成':pct(total));el('multiPending').textContent=pending?'权重草稿尚未应用；图表、收益、风险与R代码仍为上一次有效组合。失焦或Enter提交。':'';el('multiDiscardDraft').hidden=!pending;el('multiCommitWeights').hidden=weightMode!=='exact';el('multiCopy').disabled=!valid||pending;el('multiApplyGMV').disabled=!valid||pending;el('multiApplyTarget').disabled=!valid||pending||!targetPoint;el('multiStatus').classList.toggle('has-draft',pending);if(pending){lastApplied=null;renderComparison();}}
function weightModeUI(){el('multiEasy').setAttribute('aria-pressed',String(weightMode==='easy'));el('multiExact').setAttribute('aria-pressed',String(weightMode==='exact'));el('multiWeightRule').textContent=weightMode==='easy'?'修改一个资产权重时，其余资产按原有比例自动调整，确保合计100%。失焦或Enter提交；其余原权重全为0时平均分配。':'分别填写权重，其余资产不自动变化。合计需为100%；可按比例归一化。失焦、Enter或应用按钮提交。';pendingState();}
function discardDraft(){syncWeights();el('multiError').textContent='';el('multiChange').textContent='已放弃未应用草稿，恢复上一次有效组合的完整精度权重。';}
function commitWeight(i){if(!dirtyWeights.size){formatWeights();return;}try{let next,fallback=false;if(weightMode==='easy'){const u=U.values([weightDrafts[i]])[0],adjusted=U.adjust(committedWeights,i,u);next=adjusted.w;fallback=adjusted.fallback;}else{next=U.values(weightDrafts);if(next.some(x=>x>1)||Math.abs(U.sum(next)-1)>1e-10)throw Error('当前合计'+pct(U.sum(next))+'，请调整权重或使用归一化。');M.weights(next);}
const before=committedWeights.slice();committedWeights=next;syncWeights();recalculate();el('multiChange').textContent=(weightMode==='easy'?(fallback?'其余资产原权重全为0，已将剩余权重平均分配。':'已按原有相对比例调整其余权重。'):'已应用精确输入。')+names.map((x,j)=>x+' '+pct(before[j])+' → '+pct(next[j])).join('；');}catch(e){el('multiError').textContent=e.message+' 草稿尚未应用。';el('multiW'+i)?.setAttribute('aria-invalid','true');pendingState();}}
const num=id=>{const s=el(id).value;if(!s.trim()||!Number.isFinite(+s))throw Error('输入不能为空，且必须为有限数值。');return +s;};
const getWeights=()=>committedWeights.slice();
function context(){return {data,manual:data?null:manualInputs,factor:data?(el('multiDisplayUnit').value==='annual'?data.factor:1):1,scenario:el('multiScenario').value,target:targetPoint?.mean};}
function recalculate(options={}){if(!options.keepComparison)lastApplied=null;tip.clear();valid=false;targetPoint=null;el('multiError').textContent='';el('multiTargetNote').textContent='';try{let mu,S,estimate;
if(data){const c=context(),rows=c.scenario==='first'?data.returns.slice(0,Math.floor(data.returns.length/2)):c.scenario==='second'?data.returns.slice(Math.floor(data.returns.length/2)):data.returns;estimate=C.estimate(data,c.factor,rows);mu=estimate.mu.slice();S=estimate.S;if(c.scenario==='up')mu[0]+=estimate.se[0];if(c.scenario==='down')mu[0]-=estimate.se[0];const sd=S.map((r,i)=>Math.sqrt(r[i]));mu.forEach((x,i)=>{el('multiMu'+i).value=x*100;el('multiSd'+i).value=sd[i]*100;});S.forEach((r,i)=>r.forEach((x,j)=>el('multiRho'+i+'_'+j).value=sd[i]*sd[j]>0?x/(sd[i]*sd[j]):+(i===j)));el('multiUncertainty').textContent=`本窗口${estimate.T}个收益样本；A的均值标准误≈${pct(estimate.se[0])}（${c.factor===1?'每期':'年化'}）。前后半段同时改变均值与协方差；±标准误只改A均值，Σ保持完整样本。短样本、非平稳与异常值可使优化权重显著改变。`;
}else{mu=Array.from({length:n},(_,i)=>num('multiMu'+i)/100);const sd=Array.from({length:n},(_,i)=>num('multiSd'+i)/100),rho=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>num('multiRho'+i+'_'+j)));S=M.covariance(sd,rho);manualInputs={s:sd,rho};}
const w=getWeights(),total=M.sum(w);el('multiSum').textContent='当前合计：'+pct(total);M.weights(w);model=M.prepare(mu,S,el('multiRidge').checked);current=M.point(model,w);result=M.frontier(model);valid=true;
el('multiReturn').textContent=pct(current.mean);el('multiRisk').textContent=pct(current.sd);const unit=data?(context().factor===1?'每期':'年化'):'年化假设';el('multiUnit').textContent=unit+(data&&data.method==='log'?' · 对数收益':' · 简单收益');el('multiUnit').dataset.zh=el('multiUnit').textContent;
el('multiRidgeNote').textContent=model.lambda?`已主动使用λ=${model.lambda.toPrecision(5)}，对每项资产方差加λ；图表与R均基于正则后的Σ。`:'未使用正则；原始协方差进入优化。';
el('multiSigma').textContent='Σ 原始（小数平方）\n'+model.raw.map(r=>r.map(x=>x.toPrecision(5)).join('  ')).join('\n');
const lo=Math.min(...mu),hi=Math.max(...mu);let target;
try{target=num('multiTarget')/100;targetPoint=M.optimize(model,target);el('multiTargetNote').textContent=`可行目标 ${pct(lo)}～${pct(hi)}；${target<result.gmv.mean-1e-10?'低于GMV收益：等收益最小风险解可能被GMV支配。':'目标点位于有效部分。'}`;}catch(e){el('multiTargetNote').textContent=e.message;}
const diagnosis=U.diagnosis(M,model,current,result.gmv);
el('multiStatus').textContent=diagnosis.dominated?(diagnosis.equal.variance<current.variance-(1e-12+1e-8*current.variance)?'当前组合尚非有效：同样收益下存在风险更低的配置。':'当前组合尚非有效：存在风险不更高、收益更高的配置。'):'当前组合已位于有效前沿附近；当前假设与约束下，没有明显的同收益更低风险配置。';
code=Code.build(model,w,names,context());if(!targetPoint)code+='\n# 当前目标输入未通过可行性校验，未生成该目标的解。\n# 当前组合、GMV与有效前沿仍按上述有效资产参数独立计算。\n';if(targetPoint)code+=`\n# 当前目标收益组合（可能低于GMV收益）\ntarget_return <- ${target}\ntarget_portfolio <- optimize_portfolio(target_return)\nprint(target_portfolio)\npoints(target_portfolio$sd,target_portfolio$mean,col="#b18844",pch=19)\n`;
renderCode();renderComparison();draw();
}catch(e){el('multiError').textContent=e.message+' 当前输入尚未生效；图与代码若仍显示，为上次有效结果。';el('multiStatus').textContent='输入待修正，暂停新计算。';try{el('multiSum').textContent='合计 '+pct(M.sum(getWeights()));}catch{} }
el('multiCopy').disabled=!valid||dirtyWeights.size>0;el('multiApplyGMV').disabled=!valid;el('multiApplyTarget').disabled=!valid||!targetPoint;el('multiShowTarget').disabled=!valid||!targetPoint;el('multiChart').classList.toggle('multi-stale',!valid);pendingState();renderComparison();}
const sections={params:{label:'参数',pattern:/^# 1\./,text:'参数用小数表示；当前权重来自已提交的完整精度状态，显示两位小数不会改变金融计算。'},covariance:{label:'协方差',pattern:/^Sigma_raw <-/,text:'协方差矩阵描述不同资产收益率之间如何共同波动，是计算组合风险的重要基础。Σ=diag(σ)ρdiag(σ)，CSV模式用样本cov()。'},risk:{label:'组合风险',pattern:/^portfolio <- function/,text:'预期收益 μp=wᵀμ；方差 vp=wᵀΣw，组合风险 σp=√vp。标准差不能直接按权重相加。'},gmv:{label:'GMV',pattern:/^optimize_portfolio <- function/,text:'GMV：min wᵀΣw，满足1ᵀw=1与w≥0。枚举活跃面求精确最优；GMV在当前约束下风险最低，但不一定收益最高。'},frontier:{label:'有效前沿',pattern:/^# 4\./,text:'有效前沿从GMV到最高资产收益：加入目标收益等式 μᵀw=r，逐个求解最小方差。绿色曲线连接真实优化解，灰色采样不参与求解。'}};
function highlightLine(index,section=null,jump=false){selectedCodeLine=index;selectedCodeSection=section;const sourceLine=code.split('\n')[index];selectedCodeKey=sourceLine?.trim().match(/^[A-Za-z_.][\w.]*\s*<-/)?.[0]||sourceLine;const area=el('multiCode');area.querySelectorAll('[data-line]').forEach(x=>x.classList.toggle('selected',+x.dataset.line===index));const node=area.querySelector(`[data-line="${index}"]`);if(section){const item=sections[section];el('multiExplanation').innerHTML='<h3>'+item.label+'</h3><p>'+item.text+'</p><p>当前组合：μ '+pct(current.mean)+'；σ '+pct(current.sd)+'。</p>';}else explain(code.split('\n')[index]);if(jump&&node){area.scrollTop+=node.getBoundingClientRect().top-area.getBoundingClientRect().top-8;node.focus({preventScroll:true});}}
function renderCode(){const area=el('multiCode'),scroll=area.scrollTop,lines=code.split('\n');if(selectedCodeSection)selectedCodeLine=lines.findIndex(line=>sections[selectedCodeSection].pattern.test(line));else if(selectedCodeKey)selectedCodeLine=lines.findIndex(line=>line===selectedCodeKey||line.trim().startsWith(selectedCodeKey));el('multiFull').setAttribute('aria-pressed',String(full));el('multiBasic').setAttribute('aria-pressed',String(!full));el('multiCodeNav').hidden=!full;area.innerHTML=code.split('\n').map((line,i)=>({line,i})).filter(x=>full||/^(mu <-|Sigma_raw <-|Sigma <-|w <-|current <-|gmv <-|targets <-|frontier <-|target_return <-)|w\*mu|t\(w\)|optimize_portfolio <-/.test(x.line)).map(({line,i})=>`<button class="code-line${selectedCodeLine===i?' selected':''}" data-line="${i}"><span class="num">${String(i+1).padStart(2,'0')}</span><code>${typeof window.colorCode==='function'?window.colorCode(line):safe(line)}</code></button>`).join('');area.scrollTop=scroll;if(selectedCodeLine!==null&&selectedCodeLine>=0)highlightLine(selectedCodeLine,selectedCodeSection);else explain('');}
el('multiCodeNav').onclick=e=>{const button=e.target.closest('[data-code-section]');if(!button)return;const key=button.dataset.codeSection,index=code.split('\n').findIndex(line=>sections[key].pattern.test(line));if(index>=0){el('multiCodeNav').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));highlightLine(index,key,true);}};
function explain(line){let text='完整脚本包含当前参数或本地样本、收益与协方差计算、约束优化、可行点与有效前沿图；基础R可独立运行。点击语句查看其金融含义。';if(/Sigma|cov\(|lambda/.test(line))text='Σ的对角线是方差，非对角线是协方差。假设模式用diag(σ)ρdiag(σ)，数据模式用样本cov()；岭正则只有主动选择才加到对角线。';else if(/observations/.test(line))text='上传文件清洗后的收益矩阵直接嵌入脚本，离线且无需寻找原CSV。价格的简单或对数收益转换已在浏览器完成。';else if(/sqrt|variance|t\(w\)/.test(line))text='方差wᵀΣw包含自身风险与所有交叉协方差；开平方才得到与收益率同量纲的标准差。';else if(/mu|mean|target/.test(line))text='收益μp=wᵀμ；目标收益约束是等式μᵀw=r。禁止卖空时目标必须在资产预期收益最小与最大值之间；有效前沿只取GMV以上的收益。';else if(/optimize|mask|ids|solve|K <-|best|gmv|A <-/.test(line))text='这是约束二次优化：逐一枚举最多31个非空活跃面，解预算与目标收益的拉格朗日方程，剔除负权重，再比较方差。可行采样不参与求解GMV或有效前沿。';else if(/sample|cloud|uniform/.test(line))text='这些确定性可行样本只帮助看见可行区域，不能代表精确有效边界。绿色线来自目标收益下独立优化的解。';else if(/w <-|sum\(w\)/.test(line))text='权重非负且合计1，代表全额投入且禁止卖空。便捷调整按原有相对比例分配剩余权重；精确输入不自动改其他项。两位小数仅为显示，不替代内部完整精度。';el('multiExplanation').innerHTML='<h3>代码与当前模型</h3><p>'+text+'</p>'+(line?'<code>'+safe(line)+'</code>':'');}
el('multiCode').onclick=e=>{const b=e.target.closest('[data-line]');if(b)highlightLine(+b.dataset.line);};
const getPoint=key=>key==='gmv'?result?.gmv:key==='current'?current:key==='target'?targetPoint:key==='before'?lastApplied?.before:result?.points[Number(key.split('-')[1])];
function coincidence(q){return [['当前组合',current],['GMV组合',result?.gmv],['目标收益组合',targetPoint]].filter(([_,x])=>U.same(q,x)).map(([label])=>label);}
const tip=ChartInteraction.create((key,mode)=>{const box=el('multiTip'),q=key&&getPoint(key);box.hidden=!q;box.dataset.mode=q?mode:'closed';if(!q)return;const aliases=coincidence(q),same=aliases.length>1?aliases.join('同时也是')+'（数值容差内重合）。':'';const title={gmv:'全局最小方差组合 GMV',current:'当前组合 Current',target:'目标收益组合 Target',before:'最近一次调整前组合'}[key]||'精确优化前沿点';const meaning=key==='gmv'?'当前约束下风险最低，但不一定收益最高。':key==='target'?'目标要求 '+safe(el('multiTarget').value)+'%；这是满足目标的最低方差解，应用前不改变当前模型权重。':key==='current'?'来自已应用的权重，当前组合不一定是最优组合。':'采样点不参与精确优化。';box.innerHTML='<div class="popover-head"><strong>'+title+'</strong>'+(mode==='pinned'?'<button id="multiCloseTip" aria-label="关闭组合详情">×</button>':'')+'</div>'+(same?'<p class="multi-coincidence">'+same+'</p>':'')+'<p>'+meaning+'</p><p>预期收益 μ '+pct(q.mean)+' · 风险 σ '+pct(q.sd)+'<br>方差 '+q.variance.toPrecision(7)+'</p>'+q.w.map((x,i)=>'<div class="multi-tip-weight"><span>'+safe(names[i])+'</span><b>'+pct(x)+'</b></div>').join('');if(el('multiCloseTip'))el('multiCloseTip').onclick=()=>tip.clear();});
function renderComparison(){const host=el('multiComparison');host.hidden=!lastApplied;el('multiShowBefore').hidden=!lastApplied;if(!lastApplied){el('multiBeforeMarker')?.remove();el('multiComparisonLine')?.remove();return;}const c=lastApplied,delta=x=>(x>0?'+':'')+(100*x).toFixed(3)+' 个百分点';let text=c.noChange?'当前组合已经接近'+(c.label.includes('GMV')?'最小方差':'目标收益最小方差')+'组合，本次优化没有产生明显变化。':(c.deltaSd>1e-9?'风险增加':c.deltaSd< -1e-9?'风险下降':'风险基本不变')+'，'+(c.deltaMu>1e-9?'预期收益提高':c.deltaMu< -1e-9?'预期收益降低':'预期收益基本不变')+'；这是当前约束下的收益—风险权衡。';host.innerHTML='<table><caption>模拟配置调整（非真实交易） · '+safe(c.label)+'</caption><thead><tr><th>指标</th><th>调整前</th><th>调整后</th></tr></thead><tbody><tr><th>预期收益 μ</th><td>'+pct(c.before.mean)+'</td><td>'+pct(c.after.mean)+'</td></tr><tr><th>风险 σ</th><td>'+pct(c.before.sd)+'</td><td>'+pct(c.after.sd)+'</td></tr></tbody></table><p>Δμ '+delta(c.deltaMu)+'；Δσ '+delta(c.deltaSd)+'</p><p>'+text+'</p><details><summary>权重与约束快照</summary>'+names.map((name,i)=>'<div>'+safe(name)+'：'+pct(c.before.w[i])+' → '+pct(c.after.w[i])+'</div>').join('')+'<p>预算100%，禁止卖空，无无风险资产；λ='+c.constraints.lambda+'；'+safe(c.constraints.unit)+'。模拟配置调整，不是真实交易。</p></details>';}
function draw(){if(!active||!valid)return;tip.redraw();const cloud=M.samples(model),all=[...cloud,...result.points,current,...(targetPoint?[targetPoint]:[]),...(lastApplied?[lastApplied.before]:[])],xmin=Math.max(0,Math.min(...all.map(q=>q.sd))*.88),xmax=Math.max(...all.map(q=>q.sd))*1.08||.01,ylo=Math.min(...all.map(q=>q.mean)),yhi=Math.max(...all.map(q=>q.mean)),ypad=Math.max((yhi-ylo)*.12,.005),ymin=ylo-ypad,ymax=yhi+ypad;const box=el('multiChart').parentElement.getBoundingClientRect(),W=Math.max(260,box.width),H=Math.max(150,box.height),left=60,right=W-18,top=27,bottom=H-44,X=x=>left+(x-xmin)/(xmax-xmin)*(right-left),Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);const svg=el('multiChart');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);let html='';for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;html+=`<path d="M${X(x)} ${top} V${bottom} M${left} ${Y(y)} H${right}" stroke="#e2e9ee" fill="none"/><text class="multi-tick" x="${X(x)}" y="${bottom+19}" text-anchor="middle">${(x*100).toFixed(1)}%</text><text class="multi-tick" x="${left-8}" y="${Y(y)+4}" text-anchor="end">${(y*100).toFixed(1)}%</text>`;}const unit=(el('multiUnit').dataset.zh||el('multiUnit').textContent).split(' · ')[0];html+=`<text class="multi-axis-title" x="${left}" y="15">μ 预期收益（${safe(unit)}）</text><text class="multi-axis-title" x="${W-10}" y="${H-5}" text-anchor="end">σ 标准差（${safe(unit)}） →</text>`;html+=cloud.map(q=>`<circle cx="${X(q.sd)}" cy="${Y(q.mean)}" r="1.7" fill="#aebfc9" opacity=".45"/>`).join('');html+='<path class="multi-frontier-path" d="'+result.points.map((q,i)=>(i?'L':'M')+X(q.sd)+','+Y(q.mean)).join(' ')+'" stroke="#39856b" stroke-width="2.6" fill="none"/>';
for(let i=0;i<result.points.length;i++){const q=result.points[i];html+=`<g data-multi-point="frontier-${i}" tabindex="0" role="button" aria-label="精确前沿第${i+1}点"><circle cx="${X(q.sd)}" cy="${Y(q.mean)}" r="4" fill="transparent"/><circle cx="${X(q.sd)}" cy="${Y(q.mean)}" r="1.8" fill="#39856b"/></g>`;}
if(lastApplied){const q=lastApplied.before;html+=`<path id="multiComparisonLine" d="M${X(q.sd)} ${Y(q.mean)} L${X(current.sd)} ${Y(current.mean)}" stroke="#7b8d99" stroke-dasharray="4 3" fill="none"/><g id="multiBeforeMarker" data-multi-point="before" tabindex="0" role="button" aria-label="调整前组合"><circle cx="${X(q.sd)}" cy="${Y(q.mean)}" r="9" fill="transparent"/><circle cx="${X(q.sd)}" cy="${Y(q.mean)}" r="5.5" fill="white" stroke="#7b8d99" stroke-width="1.7"/></g>`;}
const main=[['gmv',result.gmv],...(targetPoint?[['target',targetPoint]]:[]),['current',current]],groups=[];for(const item of main){const group=groups.find(g=>U.same(g[0][1],item[1]));if(group)group.push(item);else groups.push([item]);}
for(const group of groups){const keys=group.map(x=>x[0]),q=group[0][1],key=keys.includes('current')?'current':keys[0],x=X(q.sd),y=Y(q.mean),r=keys.length>1?11:8;html+=`<g data-multi-point="${key}" data-identities="${keys.join(',')}" tabindex="0" role="button" aria-label="${keys.join('与')}组合详情"><circle cx="${x}" cy="${y}" r="${r+4}" fill="transparent"/>`;if(keys.includes('gmv'))html+=`<path class="multi-gmv-diamond" d="M${x} ${y-r} L${x+r} ${y} L${x} ${y+r} L${x-r} ${y} Z" fill="white" stroke="#39856b" stroke-width="2"/>`;if(keys.includes('target'))html+=`<circle cx="${x}" cy="${y}" r="${keys.includes('current')?7.5:5.5}" fill="${keys.includes('current')?'none':'#b18844'}" stroke="#b18844" stroke-width="2"/>`;if(keys.includes('current'))html+=`<circle cx="${x}" cy="${y}" r="5" fill="#497aa0" stroke="white" stroke-width="1.5"/>`;if(keys.length>1){const labels=keys.map(k=>({current:'当前',gmv:'GMV',target:'目标'}[k])).join(' = '),rightSide=x+labels.length*7+16<right;html+=`<text class="multi-merged-label" x="${x+(rightSide?15:-15)}" y="${Math.max(top+12,y-13)}" text-anchor="${rightSide?'start':'end'}">${labels}</text>`;}html+='</g>';}
svg.innerHTML=html;svg.querySelectorAll('[data-multi-point]').forEach(x=>tip.bind(x,x.dataset.multiPoint));svg.onpointerleave=()=>{if(tip.state.hoveredItem)tip.leave(tip.state.hoveredItem);};svg.onclick=e=>{if(!e.target.closest('[data-multi-point]'))tip.clear();};}
function apply(q,label){if(!valid||dirtyWeights.size||!q)return;const before=M.point(model,committedWeights),constraints={budget:1,longOnly:true,riskFree:false,lambda:model.lambda,unit:el('multiUnit').dataset.zh||el('multiUnit').textContent,mu:model.mu.slice(),Sigma:model.S.map(r=>r.slice())};lastApplied=U.comparison(before,q,constraints,label);committedWeights=q.w.slice();syncWeights();recalculate({keepComparison:true});el('multiChange').textContent='已应用模型权重；这是模拟资产配置调整，不是真实金融交易。';}
function mode(on){ChartInteraction.clear();active=on;el('workspace').hidden=on;panel.hidden=!on;el('multiMode').setAttribute('aria-pressed',String(on));el('dualMode').setAttribute('aria-pressed',String(!on));document.body.classList.toggle('portfolio-multi-active',on);if(on)recalculate();else {drawDual();} }
const originalClassroom=el('classroomTools').onclick;el('classroomTools').onclick=()=>{if(!active){originalClassroom();return;}const challenge=panel.querySelector('.multi-challenge');challenge.open=true;challenge.scrollIntoView({block:'nearest'});};
const drawDual=()=>{if(typeof window.draw==='function')window.draw();};
el('dualMode').onclick=()=>mode(false);el('multiMode').onclick=()=>mode(true);
el('multiN').onchange=()=>{controls(+el('multiN').value);recalculate();};
el('multiRidge').onchange=recalculate;el('multiTarget').oninput=recalculate;
el('multiFull').onclick=()=>{full=true;renderCode();};el('multiBasic').onclick=()=>{full=false;renderCode();};
el('multiCopy').onclick=async()=>{if(!valid)return;try{await navigator.clipboard.writeText(code);toast('已复制包含当前数据的完整独立R脚本');}catch{download(code,'portfolio-multi.R');toast('剪贴板不可用，已下载完整脚本');}};
el('multiApplyGMV').onclick=()=>apply(result.gmv,'应用GMV');el('multiApplyTarget').onclick=()=>apply(targetPoint,'应用目标收益最小方差组合');
el('multiNormalize').onclick=()=>{try{committedWeights=U.normalize(U.values(weightDrafts));syncWeights();recalculate();el('multiChange').textContent='已对全部草稿权重按比例归一化，计算使用完整精度，显示为两位小数。';}catch(e){el('multiError').textContent=e.message+' 草稿尚未应用。';pendingState();}};
el('multiEasy').onclick=()=>{if(dirtyWeights.size){el('multiError').textContent='请先应用或归一化草稿，或点击“放弃草稿”，再切换便捷调整。';return;}weightMode='easy';weightModeUI();};el('multiExact').onclick=()=>{weightMode='exact';weightModeUI();};el('multiCommitWeights').onclick=()=>commitWeight([...dirtyWeights][0]??0);el('multiDiscardDraft').onclick=discardDraft;
for(const [id,key]of [['multiShowCurrent','current'],['multiShowGMV','gmv'],['multiShowTarget','target'],['multiShowBefore','before']])tip.bind(el(id),key);
el('multiReset').onclick=()=>{data=null;table=null;el('multiFile').value='';el('multiImportOptions').hidden=true;el('multiDataAnalysis').hidden=true;el('multiDataInfo').textContent='';el('multiScenario').value='full';el('multiDisplayUnit').value='annual';el('multiRidge').checked=false;el('multiTarget').value='12';weightMode='easy';selectedCodeLine=null;selectedCodeSection=null;selectedCodeKey=null;full=true;el('multiExplanation').textContent='';panel.querySelectorAll('details').forEach(x=>x.open=false);controls(3);el('multiControls')?.scrollTo(0,0);panel.querySelector('.multi-controls').scrollTop=0;el('multiCode').scrollTop=0;recalculate();};
el('multiPractice').onclick=()=>{el('portfolioRTask').textContent='新建RStudio脚本，在全新R会话粘贴“复制完整R代码”的全部内容并运行。不需要额外包或联网。当前'+(el('multiUnit').dataset.zh||el('multiUnit').textContent)+'：μ='+pct(current.mean)+'，σ='+pct(current.sd)+'；对照gmv$w、Sigma_raw与frontier。CSV样本已直接嵌入observations，亦可本地导出清洗后收益CSV。挑战：先手算wᵀΣw，再改A的均值或使用前/后半样本，解释最优权重变化。';ModalUI.open(el('portfolioRDialog'));};
el('multiTemplate').onclick=()=>download(C.template(),'synthetic-prices-not-market.csv');
el('multiFile').onchange=async()=>{el('multiImportOptions').hidden=true;table=null;const file=el('multiFile').files[0];if(!file)return;if(file.size>2*1024*1024){el('multiDataInfo').textContent='文件超过2MB，请先缩小数据范围。';return;}try{table=C.parse(await file.text());el('multiDateColumn').innerHTML=table.headers.map(h=>'<option>'+safe(h)+'</option>').join('');const likely=table.headers.findIndex(h=>/date|日期|时间/i.test(h));el('multiDateColumn').selectedIndex=Math.max(0,likely);el('multiAssetColumns').innerHTML=table.headers.map((h,i)=>`<label><input type="checkbox" value="${i}" ${i!==Math.max(0,likely)&&i<4?'checked':''}>${safe(h)}</label>`).join('');el('multiImportOptions').hidden=false;el('multiDataInfo').textContent='已在本地读取 '+table.rows.length+' 行。选择日期与资产列，确认频率/复权口径后应用；尚未改变模型。';}catch(e){el('multiDataInfo').textContent=e.message;}};
el('multiFrequency').onchange=()=>el('multiFactor').value=el('multiFrequency').value;
el('multiImport').onclick=()=>{try{const selected=[...el('multiAssetColumns').querySelectorAll('input:checked')].map(x=>table.headers[+x.value]);const candidate=C.ingest(table,{date:el('multiDateColumn').value,assets:selected,kind:el('multiKind').value,method:el('multiMethod').value,missing:el('multiMissing').value,sort:el('multiSort').checked,factor:num('multiFactor')});data=candidate;el('multiScenario').value='full';el('multiDisplayUnit').value='annual';controls(data.names.length);el('multiDataAnalysis').hidden=false;el('multiDataInfo').textContent=`${data.from}—${data.to}；${data.returns.length}行收益；删除${data.dropped}行，${data.sorted?'已显式排序':'原日期升序'}；日期间隔中位数${data.medianGap}天，最大${data.maxGap}天。选定年化因子${data.factor}。缺失后的价格跨期收益可能跨越多天，请核实频率；未自动补价、填补交易日或确认复权。来源与许可由导入者确认。`;el('multiTarget').value=String(C.estimate(data).mu.reduce((a,b)=>a+b,0)/data.names.length*100);recalculate();}catch(e){el('multiDataInfo').textContent='未应用：'+e.message;}};
for(const id of ['multiDisplayUnit','multiScenario'])el(id).onchange=()=>{if(data){try{let rows=data.returns,scenario=el('multiScenario').value;if(scenario==='first')rows=rows.slice(0,Math.floor(rows.length/2));if(scenario==='second')rows=rows.slice(Math.floor(rows.length/2));const e=C.estimate(data,el('multiDisplayUnit').value==='annual'?data.factor:1,rows);el('multiTarget').value=M.sum(e.mu)/n*100;}catch{}recalculate();}};
el('multiExportData').onclick=()=>{if(!data)return;const quote=s=>'"'+s.replace(/"/g,'""')+'"';download('date,'+data.names.map(quote).join(',')+'\n'+data.returns.map((r,i)=>data.dates[i]+','+r.join(',')).join('\n'),'cleaned-'+data.method+'-returns.csv');};
el('multiManual').onclick=()=>{data=null;el('multiDataAnalysis').hidden=true;el('multiDataInfo').textContent='已返回教学假设；导入数据不再用于计算。';el('multiTarget').value='12';controls(n);recalculate();};
window.addEventListener('resize',()=>{if(active)draw();});let resizeFrame;new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(active)draw();});}).observe(el('multiChart').parentElement);controls(3);
// Read-only diagnostics for tests and transparent classroom inspection.
window.PortfolioMultiLab={getState:()=>({active,valid,n,names,data,model,result,current,targetPoint,code,lastApplied,weightMode,committedWeights:committedWeights.slice(),weightDrafts:weightDrafts.slice(),pending:dirtyWeights.size>0}),recalculate};
})();

;