/* Teaching presentation only. The financial engines remain unchanged. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-lessons.js'):root.ExperimentLessons);if(typeof module==='object')module.exports=api;else root.TeachingCode=api;})(this,L=>{
function wrap(line,limit=38){const result=[];let rest=line;while(rest.length>limit){let quote='',depth=0,last=-1;for(let i=0;i<Math.min(rest.length,limit);i++){const c=rest[i];if(quote){if(c===quote&&rest[i-1]!=='\\')quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if('([{'.includes(c))depth++;if(')]}'.includes(c))depth--;if((c===','&&depth>0)||c==='('||(['+','*','/','-','^'].includes(c)&&rest[i-1]!=='<'&&!/[eE]/.test(rest[i-1]||'')&&rest[i+1]!=='>'))last=i+1;}if(last<8)break;result.push(rest.slice(0,last));rest='  '+rest.slice(last).trimStart();}result.push(rest);return result;}
function entry(base,lines,title,links,mark){return{...base,title:title||base.title,lines:lines.split('\n').flatMap(x=>wrap(x)),links:links||[],mark:mark||''};}
function build(id,p,mode='basic'){const full=L.build(id,p),q=full.q;let blocks=full.blocks.map(b=>({...b,lines:b.lines.flatMap(x=>wrap(x))}));let boundary=id==='bs'&&(p.T===0||p.sigma===0);if(boundary)mode='full';
// Split parameter definitions into independent teaching objects in both views.
let first=full.blocks[0],params=first.lines.filter(x=>/^[A-Za-z]+ <- /.test(x));const keymap={alpha:id==='garch'?'a':'alpha',beta:id==='garch'?'b':'beta'};const parameterBlocks=params.filter(x=>!x.startsWith('expected')).map(line=>{const key=keymap[line.split(' ')[0]]||line.split(' ')[0];return entry(first,line,'参数 · '+line.split(' <- ')[0],[key],id==='bs'&&['S','K'].includes(key)?key:id==='capm'?'sml':'');});
blocks.splice(0,1,entry(first,first.lines.filter(x=>x.startsWith('#')).join('\n'),'模型与口径'),...parameterBlocks);
if(id==='capm')blocks.splice(1+parameterBlocks.length,0,entry(first,'expected <- rf + beta * (rm - rf)','理论 CAPM · 预期收益',['rf','rm','beta'],'sml'));
if(id==='garch'&&mode==='full')blocks.splice(1+parameterBlocks.length,0,entry(first,'stopifnot(omega > 0, alpha >= 0,\n  beta >= 0, alpha + beta < 1)','参数约束与校验',['omega','a','b']));
if(id==='bs'&&mode==='basic'){
const b=full.blocks;blocks=[entry(first,'# 欧式无分红；T>0且sigma>0\n# 边界参数请使用完整代码','模型与口径'),...parameterBlocks,
entry(b[0],'D <- K * exp(-r * T)','行权价现值',['K','r','T'],'K'),
entry(b[2],'d1 <- (log(S / K) +\n  (r + sigma^2 / 2) * T) /\n  (sigma * sqrt(T))\nd2 <- d1 - sigma * sqrt(T)','标准化距离 d₁、d₂',['S','K','r','sigma','T']),
entry(b[3],'C <- S * pnorm(d1) - D * pnorm(d2)','看涨价格 Call',['S','K'],'call'),
entry(b[3],'P <- D * pnorm(-d2) - S * pnorm(-d1)','看跌价格 Put',['S','K'],'put'),
entry(b[4],'deltaC <- pnorm(d1)\ndeltaP <- pnorm(d1) - 1','Delta · 价格一阶敏感度',['S'],'delta'),
entry(b[4],'gamma <- dnorm(d1) /\n  (S * sigma * sqrt(T))','Gamma · 价格二阶敏感度',['S','sigma','T'],'gamma'),
entry(b[4],'vega <- S * dnorm(d1) * sqrt(T) / 100','Vega · 每1个百分点',['sigma'],'vega'),
entry(b[4],'base <- -S * dnorm(d1) * sigma /\n  (2 * sqrt(T))\nthetaC <- (base - r * D * pnorm(d2)) / 365\nthetaP <- (base + r * D * pnorm(-d2)) / 365','Theta · 每日历天',['T'],'theta'),
entry(b[5],'result <- c(C=C, P=P, d1=d1, d2=d2,\n  deltaC=deltaC, deltaP=deltaP,\n  gamma=gamma, vega=vega,\n  thetaC=thetaC, thetaP=thetaP)\nprint(result)','输出价格与Greeks',[],'price'),
entry(b[5],'spot <- seq(max(0.01,min(S,K)*0.4),\n  min(100000,max(S,K)*1.6),\n  length.out=121)\nu <- (log(spot/K)+(r+sigma^2/2)*T) /\n  (sigma*sqrt(T))\nv <- u-sigma*sqrt(T)\ncall <- spot*pnorm(u)-D*pnorm(v)\nput <- D*pnorm(-v)-spot*pnorm(-u)\nmatplot(spot,cbind(call,put),type="l",\n  lty=1,xlab="Spot",ylab="Option price")\nabline(v=c(S,K),lty=c(2,4))','绘制价格与S/K参考线',[],'price')];
}
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
if(id==='bs'&&mode==='full'){
 const graph=blocks.at(-1);graph.lines=full.blocks.at(-1).lines.flatMap(line=>wrap(line.startsWith('spot <- seq')?'spot <- seq(max(0.01,min(S,K)*0.4), min(100000,max(S,K)*1.6), length.out=121)':line.startsWith('abline(v=S')?'abline(v=c(S,K), lty=c(2,4))':line));
}
for(const b of blocks){
 if(id==='bs'&&b.title.startsWith('参数')){const key=b.links[0];const data={
 S:['标的当前每股价格；改变S可观察两类期权价格。','S_0',`S = ${L.f(p.S)} 元／股`,'S是当前价格，不是执行价格，也不是未来价格预测。'],
 K:['设置到期执行价格，并计算其现值。','D=Ke^{-rT}',`K = ${L.f(p.K)}；D = ${L.f(q.D)} 元／股`,'K由合约约定，S=K时两条参考线合并显示。'],
 T:['使用剩余期限（年），到期T=0采用边界实现。','T\\geq 0',`T = ${L.f(p.T)} 年`,'Theta按日历时间流逝计算，不能将期限直接当作天数。'],
 r:['输入连续复利无风险年利率的小数。','D=Ke^{-rT}',`r = ${L.pct(p.r)}；D = ${L.f(q.D)}`,'连续复利贴现与简单利率贴现不能混用。'],
 sigma:['设置年化波动率的小数，例如0.2代表20%。','\\sigma\\geq0',`σ = ${L.pct(p.sigma)}；Vega = ${L.f(q.vega)}`,'其他条件固定且T>0时，两类期权均有正Vega；零波动单独处理。']
 }[key];if(data)[b.action,b.formula,b.value,b.economic]=data;}
 if(id==='bs'&&['delta','gamma','vega','theta'].includes(b.mark)){
 const values={delta:[String.raw`\Delta_C=\Phi(d_1),\quad\Delta_P=\Phi(d_1)-1`,`Delta Call=${L.f(q.deltaC)}，Put=${L.f(q.deltaP)}（元／元）`],gamma:[String.raw`\Gamma=\frac{\phi(d_1)}{S\sigma\sqrt T}`,`Gamma=${L.f(q.gamma)}（1／元）`],vega:[String.raw`Vega_{1pp}=\frac{S\phi(d_1)\sqrt T}{100}`,`Vega=${L.f(q.vega)} 元／1个百分点`],theta:[String.raw`\Theta_{day}=-\frac{1}{365}\frac{\partial V}{\partial T}`,`Theta Call=${L.f(q.thetaC)}，Put=${L.f(q.thetaP)} 元／日历天`]};[b.formula,b.value]=values[b.mark];
 }
 if(id==='bs'&&mode==='full'&&b.title.includes('Greeks'))b.mark='greeks';
}
if(id==='garch'){const b=blocks.find(b=>b.lines.some(line=>line.includes('for(t')));if(b){const n=x=>Number(x.toPrecision(6)).toString();b.value=`h₄₂ = ${n(p.omega)} + ${n(p.a*q.eps[40]**2)} + ${n(p.b*q.h[40])} = ${n(q.h[41])}；ε₄₁ = ${n(q.eps[40])}`;}}
// Link text and parameters precisely, never a whole input card.
for(const b of blocks){if(id==='garch'&&b.title.startsWith('参数')){const k=b.links[0];b.formula={omega:String.raw`\omega>0`,a:String.raw`\alpha\varepsilon_{t-1}^2`,b:String.raw`\beta h_{t-1}`,shock:String.raw`\varepsilon_{41}=\sqrt{h_{41}}z_{41}`}[k]||b.formula;b.value={omega:`ω=${L.f(p.omega)}`,a:`α ε₄₁² = ${L.f(p.a*q.eps[40]**2)}`,b:`β h₄₁ = ${L.f(p.b*q.h[40])}`,shock:`z₄₁=${L.f(p.shock)}；ε₄₁=${L.f(q.eps[40])}`}[k];b.economic={omega:'每期加入的基础方差水平。',a:'上一期冲击平方越大，下一期方差贡献越大；α=0时无此影响。',b:'上一期已确定的条件方差通过β延续至下一期。',shock:'当期冲击先改变ε₄₁，随后进入h₄₂；不是影响已确定的h₄₁。'}[k];}}
return{q,blocks,code:blocks.flatMap(b=>b.lines).join('\n'),mode,boundary};}
return{build,wrap};});
