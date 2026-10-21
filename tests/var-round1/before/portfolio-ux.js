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
