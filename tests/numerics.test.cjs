// Engineering checks deliberately live outside the teaching script.
const assert=require('node:assert/strict'),M=require('../dist/math.js'),L=require('../dist/lessons.js');
const base={w:.5,mu1:.08,mu2:.14,s1:.12,s2:.22,rho:.2};
let count=0;
for(const s1 of [0,1e-10,.12,1])for(const s2 of [0,1e-8,.22,1])for(const w of [0,.22/.34,.5,1])for(const rho of [-1,-1+Number.EPSILON,-.5,0,.2,1]){
 const p={...base,s1,s2,w,rho},q=M.portfolio(p),direct=q.terms.reduce((a,b)=>a+b,0),scale=(w*s1+(1-w)*s2)**2,tol=64*Number.EPSILON*scale;
 assert.ok(q.variance>=0&&Number.isFinite(q.sd));
 assert.ok(Math.abs(direct-q.variance)<=tol,`Variance identity exceeds rounding bound ${JSON.stringify(p)}`);
 const script=L.code(L.build(p,M.model(p)));
 assert.ok(!/vp_stable|stopifnot|double\.eps|\btol\b/.test(script));
 count++;
}
const steps=L.build(base,M.model(base));assert.ok(!steps.some(s=>s.id==='numerics'||s.id==='boundaryVariance'));
assert.equal(steps.find(s=>s.id==='variance').lines.length,3);
assert.equal(steps.find(s=>s.id==='sd').lines[0],'sp <- sqrt(vp)');
console.log(`PASS ${count} scale-aware numerical identities and clean teaching scripts.`);
