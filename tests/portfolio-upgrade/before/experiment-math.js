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
