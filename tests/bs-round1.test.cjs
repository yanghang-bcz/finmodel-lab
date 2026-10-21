const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),M=require('../dist/experiment-math.js'),L=require('../dist/bs-lesson.js');
const out='tests/bs-round1';fs.mkdirSync(out,{recursive:true});let checks=0,cases=0;const b=L.config.defaults;
const near=(a,c,t=1e-8)=>{checks++;assert(Math.abs(a-c)<=t*Math.max(1,Math.abs(a),Math.abs(c)),`${a} != ${c}`)};
near(M.bs(b).C,10.4505835721856);near(M.bs(b).P,5.573526022257);
for(const S of [.01,70,100,150,1e5])for(const K of [.01,100,1e5])for(const T of [0,1e-8,.5,10])for(const sigma of [0,1e-8,.2,2])for(const r of [-.1,0,.3])for(const q of [0,.02,.05,1]){
 const p={S,K,T,r,sigma,q},v=M.bs(p),up=M.bs({...p,q:Math.min(1,q+.01)});near(v.C-v.P,v.A-v.D,2e-10);assert(v.C>=Math.max(0,v.A-v.D)-1e-9&&v.C<=v.A+1e-9);assert(v.P>=Math.max(0,v.D-v.A)-1e-9&&v.P<=v.D+1e-9);assert(up.C<=v.C+1e-9&&up.P>=v.P-1e-9);checks+=3;
 for(const k of ['C','P','A','D','E'])assert(Number.isFinite(v[k]));if(T===0){for(const k of ['deltaC','deltaP','gamma','vega','thetaC','thetaP'])assert.equal(v[k],null);near(v.C,Math.max(S-K,0));near(v.P,Math.max(K-S,0));}
}
for(const S of [70,100,140])for(const q of [0,.02,.05,.2])for(const r of [-.05,.05]){
 const p={...b,S,q,r},v=M.bs(p),h=.01,z=.00001,pu=M.bs({...p,S:S+h}),pd=M.bs({...p,S:S-h}),vu=M.bs({...p,sigma:p.sigma+z}),vd=M.bs({...p,sigma:p.sigma-z}),tu=M.bs({...p,T:p.T+z}),td=M.bs({...p,T:p.T-z});
 near(v.deltaC,(pu.C-pd.C)/(2*h),3e-8);near(v.deltaP,(pu.P-pd.P)/(2*h),3e-8);for(const k of ['C','P']){near(v.gamma,(pu[k]-2*v[k]+pd[k])/h**2,3e-8);near(v.vega,(vu[k]-vd[k])/(2*z)/100,3e-8);near(v['theta'+k],-(tu[k]-td[k])/(2*z)/365,3e-8);}near(v.deltaC-v.deltaP,v.E);assert(v.deltaC>=0&&v.deltaP<=0&&v.gamma>=0&&v.vega>=0);checks++;
}
for(const k of ['S','K','T','r','sigma','q'])for(const val of [NaN,Infinity,-Infinity,undefined]){assert.throws(()=>M.bs({...b,[k]:val}));checks++;}
for(const p of [{S:0},{K:-1},{T:-.01},{sigma:-.1},{q:-.001},{q:1.01},{S:100001},{r:.31}]){assert.throws(()=>M.bs({...b,...p}));checks++;}
const scenarios=[b,{...b,q:.05},{...b,q:1},{...b,T:0,q:.05},{...b,T:0,q:.05,S:90},{...b,sigma:0,q:.05},{...b,sigma:0,q:.1},{...b,sigma:0,q:0,r:0},{...b,sigma:0,q:.02,S:80},{...b,sigma:0,q:.02,S:130},{...b,S:.01,K:1e5,q:.05},{...b,S:1e5,K:.01,q:.05},{...b,sigma:2,T:10,q:1,r:-.1},{...b,T:1e-8,q:.05}];
for(const p of scenarios)for(const mode of ['basic','full']){
 const built=L.build(p,mode),v=built.q,file=`${out}/case-${cases}.R`;fs.writeFileSync(file,`pdf('${file}.pdf')\n${built.code}\ncat('CHECK',paste(sprintf('%.17g',result),collapse=' '),'\\n')\n${built.mode==='full'?`stopifnot(inherits(try(bs(0,K,T,r,sigma,q),silent=TRUE),'try-error'))\nstopifnot(inherits(try(bs(S,K,T,r,sigma,-.01),silent=TRUE),'try-error'))\n`:''}dev.off()\n`);
 const log=cp.execFileSync('Rscript',[file],{encoding:'utf8'});fs.writeFileSync(file+'.log',log);const vals=log.match(/CHECK (.*)/)[1].trim().split(/\s+/).map(Number);const expected=['C','P','d1','d2','deltaC','deltaP','gamma','vega','thetaC','thetaP'];assert.equal(vals.length,10);expected.forEach((key,i)=>{if(v[key]===null){assert(Number.isNaN(vals[i]));checks++;}else near(v[key],vals[i],1e-9);});cases++;
}
const result={passed:true,checks,rCases:cases,scope:'q grid / parity / price bounds / monotonicity / Greeks central differences both call and put / invalid inputs / real R basic+full'};fs.writeFileSync(out+'/math-results.json',JSON.stringify(result,null,2));console.log(result);
