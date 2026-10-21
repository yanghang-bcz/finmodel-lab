/* Teaching organization only: all values use the existing tested engines. */
(function(root,factory){const api=typeof module==='object'?factory(require('./experiment-math'),require('./bs-lesson'),require('./iv-math'),require('./iv-code'),require('./hedge-math'),require('./hedge-code')):factory(root.ExperimentMath,root.BSLesson,root.IVMath,root.IVCode,root.HedgeMath,root.HedgeCode);if(typeof module==='object')module.exports=api;else root.TeachingUXData=api;})(this,(M,BS,I,IC,H,HC)=>{
const steps={pricing:['认识看涨和看跌','到期支付怎么算','为什么现在也有价格','用 Black–Scholes 定价','在 R 中实现定价'],dividend:['哪些条件影响价格','波动率改变了什么','股息为什么影响价格','逐个认识风险指标','在 R 中做敏感性分析'],iv:['价格已知，波动率未知','为什么要反向求解','二分法：逐次缩小范围','牛顿法：沿切线逼近','比较方法与局限'],hedge:['为什么需要对冲','买多少股票才能抵消','股价变了，为什么要调仓','动态对冲与误差']};
const labels={pricing:'定价基础',dividend:'红利与敏感性',iv:'隐含波动率求解',hedge:'Delta 风险对冲'};
const base={...BS.config.defaults},iv={S:100,K:100,T:1,r:.05,q:0,type:'C',target:M.bs(base).C,tol:1e-8,maxIter:100,initial:.3};
function state(id){return{step:0,p:{...(id==='hedge'?H.defaults:id==='iv'?iv:base)},type:'C',expiry:120,newSpot:105,choice:null,phase:'predict',stage:'A',time:0,greek:'delta',ivMethod:'bisection',codeMode:'point',line:0,version:0};}
function effective(s,id){return id==='hedge'&&[0,2].includes(s.step)?{...H.defaults}:s.p;}
function evaluate(id,s){const p=effective(s,id);if(id==='hedge'){const sim=H.simulate(p);const a=H.option(H.defaults,100,1),b=H.option(H.defaults,s.newSpot,1);return{sim,a,b,r:sim.strategies.dynamic.rows[Math.min(s.time,p.N)],call:M.bs(base).C,payoff:Math.max(s.expiry-100,0)};}if(id==='iv')return{bisection:I.solve(p),newton:I.solve(p,'newton')};return{now:M.bs(p),zero:M.bs({...p,q:0}),vol:M.bs({...p,sigma:Math.min(2,p.sigma+.1)})};}
function bsCore(p){const code=BS.build(p,'full').code;return code.slice(code.indexOf('bs <- function'),code.indexOf('\nresult <- bs('))+'\n'+Object.entries(p).map(([k,v])=>`${k} <- ${v}`).join('\n')+'\n';}
function point(id,s){const p=effective(s,id),type=id==='hedge'?p.type:s.type,key=type==='P'?'P':'C';let lines,formula,links;
if(id==='hedge'){
 if(s.step===0){lines=['ST <- 120; K <- 100','payoff <- max(ST-K,0)','simple <- premium-payoff'];formula='\\text{简单结果}=\\text{权利金}-\\max(S_T-K,0)';links=[];}
 else if(s.step===1){lines=[`value <- bs(S,K,T,r,sigma,q)`,`delta <- value["${p.type==='P'?'deltaP':'deltaC'}"]`,'shares <- delta','net_delta <- -delta+shares'];formula='h=\\Delta,\\quad-\\Delta+h=0';links=['S','K','sigma','q','T'];}
 else if(s.step===2){lines=['old <- bs(100,K,T,r,sigma,q)',`new <- bs(${s.newSpot},K,T,r,sigma,q)`,'trade <- new["deltaC"]-old["deltaC"]'];formula='\\text{交易数量}=\\Delta_{new}-\\Delta_{old}';links=['newSpot'];}
 else if(s.stage==='A'){lines=['tau <- T*(N-i)/N','delta <- values[i+1,"delta"]','rebalance <- i<N && i %% interval==0','target <- if(rebalance) delta else old_holding','quantity <- target-old_holding','holding <- target'];formula='\\tau_i=T(N-i)/N,\\quad Q_i=h_i-h_{i-1}';links=['interval','N'];}
 else if(s.stage==='B'){lines=['interest <- cash*expm1(r*dt)','dividend <- old_holding*q*old_S*dt','before <- cash+interest+dividend','cash <- before-quantity*spot'];formula='B_i=B_{i-1}e^{r\\Delta t}+D_i-(h_i-h_{i-1})S_i';links=['r','q'];}
 else{lines=['net <- holding*spot+cash-option_value','errors <- vapply(results,function(x) {','  tail(x$net,1)','},numeric(1))'];formula='\\Pi_i=h_iS_i+B_i-V_i';links=['interval'];}
}else if(id==='iv'){
 const method=s.step===3?'newton':s.ivMethod;
 if(s.step===0||s.step===1){lines=[`quote <- ${p.target}`,'# sigma 是要寻找的未知数','f <- function(sigma) {','  bs(sigma)["price"]-quote','}'];formula='BS(\\sigma)=P_{quote}';links=['target'];}
 else if(s.step===2){lines=['mid <- a+(b-a)/2','error <- bs(mid)["price"]-target','if(error<0) a <- mid else b <- mid'];formula='m=(a+b)/2,\\quad f(m)=BS(m)-P_{quote}';links=['target','tol'];}
 else if(s.step===3){lines=['value <- bs(sigma)','error <- value["price"]-target','raw_vega <- value["vega"]','next_sigma <- sigma-error/raw_vega'];formula='\\sigma_{n+1}=\\sigma_n-\\frac{BS(\\sigma_n)-P_{quote}}{Vega_{raw}}';links=['initial','tol'];}
 else{lines=['b <- bisection()','n <- newton()','b$status; n$status','b$error; n$error'];formula='|BS(\\sigma)-P_{quote}|\\le\\varepsilon';links=['initial','tol','maxIter'];}
}else if(id==='pricing'){
 if(s.step<2){lines=[`ST <- ${s.expiry}; K <- ${p.K}`,'call_payoff <- max(ST-K,0)','put_payoff <- max(K-ST,0)'];formula='C_T=\\max(S_T-K,0),\\quad P_T=\\max(K-S_T,0)';links=['K','expiry'];}
 else{lines=['value <- bs(S,K,T,r,sigma,q)',`price <- value["${key}"]`,'print(price)'];formula=key==='C'?'C=Se^{-qT}\\Phi(d_1)-Ke^{-rT}\\Phi(d_2)':'P=Ke^{-rT}\\Phi(-d_2)-Se^{-qT}\\Phi(-d_1)';links=['S','K','T','r','q','sigma'];}
}else{
 if(s.step===1){lines=['before <- bs(S,K,T,r,sigma,q)',`after <- bs(S,K,T,r,${Math.min(2,p.sigma+.1)},q)`,'after[c("C","P")]-before[c("C","P")]'];formula='\\sigma\\uparrow\\quad\\text{比较同参数价格}';links=['sigma'];}
 else if(s.step===2){lines=['no_div <- bs(S,K,T,r,sigma,0)','with_div <- bs(S,K,T,r,sigma,q)','with_div[c("C","P")]-no_div[c("C","P")]'];formula='A=Se^{-qT}';links=['q'];}
 else if(s.step===3){const k={delta:type==='P'?'deltaP':'deltaC',gamma:'gamma',vega:'vega',theta:type==='P'?'thetaP':'thetaC'}[s.greek];lines=['value <- bs(S,K,T,r,sigma,q)',`sensitivity <- value["${k}"]`,'print(sensitivity)'];formula={delta:'\\Delta=\\partial V/\\partial S',gamma:'\\Gamma=\\partial\\Delta/\\partial S',vega:'Vega_{1pp}=(\\partial V/\\partial\\sigma)/100',theta:'\\Theta_{day}=-(\\partial V/\\partial T)/365'}[s.greek];links=s.greek==='theta'?['T']:s.greek==='vega'?['sigma']:['S'];}
 else{lines=['value <- bs(S,K,T,r,sigma,q)','prices <- value[c("C","P")]','print(prices)'];formula='V=BS(S,K,T,r,\\sigma,q)';links=['S','K','T','r','q','sigma'];}
}
return{lines,formula,links};}
function full(id,s){const p=effective(s,id);if(id==='hedge')return HC.script(p,'full');if(id==='iv')return IC.script(p);return BS.build(p,'full').code;}
function example(id,s){const p=effective(s,id),lines=point(id,s).lines.join('\n');if(id==='hedge'&&s.step===0)return 'ST <- 120; K <- 100\npremium <- '+M.bs(base).C+'\n'+lines+'\nprint(c(payoff=payoff,simple=simple))\n# 忽略资金时间价值及其他现金流，不是完整自融资终值\n';
 if(id==='hedge'&&s.step===1)return bsCore(Object.fromEntries(Object.keys(base).map(k=>[k,p[k]])))+lines+'\nprint(c(delta=delta,shares=shares,net_delta=net_delta))\n';
 if(id==='hedge'&&s.step===2)return bsCore(base)+lines+'\nprint(c(old=old["deltaC"],new=new["deltaC"],trade=trade))\n';
 if(id==='hedge'){return HC.script(p,'basic').split('\n').filter(l=>!l.startsWith('print(')).join('\n')+`\ni <- ${s.time}\ncurrent <- results$dynamic[i+1,]\nprint(current[,c(${(s.stage==='A'?['S','delta','holding','quantity']:s.stage==='B'?['cashBefore','interest','dividend','tradeCash','cash']:['S','price','holding','cash','net']).map(k=>`"${k}"`).join(',')})])\n`;}
 if(id==='iv')return IC.script(p)+'\n# 本步示例已包含所需价格函数与算法定义\n';
 return bsCore(p)+lines+'\n'+(s.step<2&&id==='pricing'?'print(c(call_payoff=call_payoff,put_payoff=put_payoff))':'')+'\n';}
function formatR(code,wrap){return code.split('\n').flatMap(line=>/^\s*#/.test(line)?[line]:wrap(line,46)).join('\n');}
return{steps,labels,base,iv,state,effective,evaluate,point,full,example,bsCore,formatR};});
