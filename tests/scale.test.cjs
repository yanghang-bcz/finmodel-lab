const assert=require('node:assert/strict'),M=require('../dist/math.js'),S=require('../dist/chart-scale.js');
const p={w:.5,mu1:.08,mu2:.14,s1:.12,s2:.22,rho:.2},points=M.model(p).points,initial=S.range(points);
assert(initial.xmin>0,'Auto fit avoids unnecessary zero origin');assert(S.contains(initial,points));assert.deepEqual(initial,S.range(M.model({...p,w:0}).points));
let fixed={...initial};for(const change of [{rho:-.5},{s1:.8},{mu1:-.7},{s1:0,s2:0},{mu1:.14}]){const pp={...p,...change},other=M.model(pp).points;fixed=S.union(fixed,S.range(other));assert(S.contains(fixed,points)&&S.contains(fixed,other));}assert(S.contains(S.range(M.model({...p,s1:0,s2:0}).points),M.model({...p,s1:0,s2:0}).points));
console.log('PASS automatic tight ranges, weight invariance, fixed union and zero-volatility ranges.');
