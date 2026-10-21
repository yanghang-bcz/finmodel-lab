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
