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
