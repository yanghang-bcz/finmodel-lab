const assert=require('node:assert/strict'),M=require('../dist/math.js'),L=require('../dist/lessons.js');
const base={w:.5,mu1:.08,mu2:.14,s1:.12,s2:.22,rho:.2};
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
for(const [key,value] of [['w',-.01],['w',1.01],['rho',-1.01],['rho',1.01],['s1',-.1],['s2',Infinity],['mu1',NaN],['mu2',2]]){const p={...base,[key]:value};assert(M.validate(p).includes(key));assert.throws(()=>M.model(p),RangeError);assert.throws(()=>M.portfolio(p),RangeError);}
const raw={w:'50',mu1:'8',mu2:'14',s1:'12',s2:'22',rho:'.2'};assert.deepEqual(M.parseInputs(raw).p,base);
for(const value of ['', ' ', 'NaN','Infinity',null,undefined,[]])assert(M.parseInputs({...raw,rho:value}).invalid.includes('rho'));
assert(M.parseInputs({...raw,w:'101'}).invalid.includes('w'));assert(M.parseInputs({...raw,s1:'-1'}).invalid.includes('s1'));assert.equal(M.parseInputs({...raw,mu1:'-15'}).p.mu1,-.15);
let p={...base,s1:.12,s2:.12,rho:1},m=M.model(p);assert(m.flat);for(const w of [0,.1,.5,.9,1])near(M.portfolio(p,w).variance,.0144);assert.equal(m.points.filter(q=>q.efficient).length,1);
p={...p,mu1:.14};m=M.model(p);assert(m.flat&&m.equal);assert(m.points.every(q=>q.efficient));assert(L.build(p,m).find(s=>s.id==='minimum').summary.includes('不是唯一解'));
p={...base,s1:1e-9,s2:2e-9};m=M.model(p);assert(!m.flat);near(m.mv,(4-.4)/(1+4-.8));
p={...base,rho:-1,w:.22/.34};near(M.portfolio(p).variance,0);near(M.portfolio(p).sd,0);
for(const pp of [base,{...base,mu1:.14},{...base,s1:0},{...base,s1:0,s2:0}]){const mm=M.model(pp),steps=L.build(pp,mm),risk=steps.find(s=>s.id==='variance');assert.equal(risk.lines.length,3);near(risk.terms.reduce((a,b)=>a+b,0),mm.current.variance);assert(risk.formula.includes('2w₁w₂'));assert(risk.result.includes(L.pct(mm.current.sd)));assert.equal(L.code(steps).split('\n').length,steps.flatMap(s=>s.lines).length);assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);}
const down=M.compareCorrelation(base,{...base,rho:-1});assert.equal(down.direction,'down');assert.equal(down.status,'lowered');near(down.before,Math.sqrt(.01834));near(down.after,.05);near(down.varianceDelta,.0025-.01834);
for(const pp of [{...base,w:0},{...base,w:1},{...base,s1:0},{...base,s2:0}]){const result=M.compareCorrelation(pp,{...pp,rho:-1});assert.equal(result.direction,'same');near(result.varianceDelta,0);}
assert.equal(M.compareCorrelation(base,{...base,s1:.2,rho:-1}).status,'changed');assert.equal(M.compareCorrelation(base,base).status,'waiting');assert.equal(M.compareCorrelation(base,{...base,rho:1}).status,'raised');
console.log('PASS input validation, degenerate/nonunique minima, tiny volatility, lesson groups/contributions, live exploration and zero-exposure cases.');
