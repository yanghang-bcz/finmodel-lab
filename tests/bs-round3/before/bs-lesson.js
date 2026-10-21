/* Experiment 11: one source for executable R, formulas and teaching explanations. */
(function(root,factory){const api=factory(typeof module==='object'?require('./experiment-math.js'):root.ExperimentMath);if(typeof module==='object')module.exports=api;else root.BSLesson=api;})(this,M=>{
const f=x=>x===null?'未定义':Number(x.toPrecision(8)).toString(),pct=x=>f(x*100)+'%';
const config={defaults:{S:100,K:100,T:1,r:.05,sigma:.2,q:0},inputs:[['S','标的现价 S（元／股）',.01,1e5,1],['K','行权价 K（元／股）',.01,1e5,1],['T','剩余期限 T（年）',0,10,.01],['r','连续复利年利率 r（小数）',-.1,.3,.001],['sigma','年化波动率 σ（0.20 = 20%）',0,2,.01],['q','连续股息收益率 q（0.05 = 5%）',0,1,.001]],assumptions:'欧式，仅到期行权；恒定连续复利利率、非负连续股息收益率与波动率，对数正态股价、无摩擦市场。q为连续比例股息，不是离散现金分红；q=0回到无分红。教学输入范围 S,K∈[0.01,100000]，T∈[0,10]年，r∈[−0.1,0.3]，σ∈[0,2]，q∈[0,1]，均需为有限数。T=0按到期收益，全部Greeks留空；σ=0按确定性贴现收益，折点处Greeks留空（Vega右导数在折点可能非零，故不填0），其余按确定性分支。Vega=∂V/∂σ÷100，为每1个百分点；Theta=−∂V/∂T÷365，为每自然日局部敏感度。',question:'可复现案例 S=K=100、T=1、r=5%、σ=20%。只把连续股息收益率 q 从0%调到5%，Call与Put如何变化？',choices:['看涨非增、看跌非减','看涨非减、看跌非增','两者都不变'],correct:0,exploreKey:'q',start:0,target:.05,answer:'固定其余参数且T>0、σ>0时，∂C/∂q=−T S e^(−qT)Φ(d₁)<0，∂P/∂q=T S e^(−qT)Φ(−d₁)>0。零波动时仅保证非增/非减（可能局部不变）；T=0时q没有影响。',teacher:'采用12实验教学大纲。本轮覆盖欧式BS看涨看跌R函数、连续股息与四项Greeks。默认q=0核对10.450584/5.573526；先预测再实验，只开放q，比较0%与5%。隐含波动率二分法、牛顿法可切换至独立教学模块；动态对冲第三轮尚未实现。Φ(d₂)是风险中性测度下S_T>K的概率，Φ(d₁)不是实际获利概率。'};
function build(input,mode='basic'){
 const p={q:0,...input},v=M.bs(p),boundary=p.T===0||p.sigma===0;if(boundary)mode='full';const full=mode==='full',blocks=[];
 const add=(title,code,action,formula,value,economic,links=[],mark='')=>blocks.push({title,lines:code.split('\n'),action,formula,value,economic,links,mark});
 add('模型与口径','# 欧式期权；连续复利；q为连续股息收益率\n# 基础R，无需额外包；价格单位：元/股','用同一套连续股息模型计算价格、Greeks与曲线。',String.raw`C-P=Se^{-qT}-Ke^{-rT}`,`q=${pct(p.q)}；${boundary?'边界使用完整函数':'T>0、σ>0'}`,'此模块包含定价、连续股息与静态敏感度；隐含波动率求根请切换模块，动态对冲第三轮尚未上线。');
 const parameters={S:['标的当前每股现价。','S_0',`${f(p.S)} 元／股`,'改变当前股价，不代表预测未来价格。','S'],K:['合约约定的到期执行价。','K',`${f(p.K)} 元／股`,'与现价S采用相同货币单位。','K'],T:['输入剩余期限，单位年。','T',`${f(p.T)} 年`,'T=0时价格为到期收益，不扣买入期权成本。',''],r:['连续复利无风险年利率，使用小数。','e^{-rT}',pct(p.r),'利率贴现与股息贴现分别作用于执行价和标的。',''],sigma:['输入年化波动率，使用小数。',String.raw`\sigma`,pct(p.sigma),'σ=0是确定性边界；不将除以零传入d₁/d₂。',''],q:['输入非负连续股息收益率，0.05表示5%。','e^{-qT}',pct(p.q),'q是连续比例分红假设，与离散现金股息不同。','']};
 for(const[k,d]of Object.entries(parameters))add('参数 · '+k,`${k} <- ${p[k]}`,d[0],d[1],d[2],d[3],[k],d[4]);
 if(full)add('价格函数与边界',`bs <- function(S,K,T,r,sigma,q=0) {
  x <- c(S,K,T,r,sigma,q)
  if (length(x)!=6 || any(!is.finite(x)) ||
      any(x < c(.01,.01,0,-.1,0,0)) ||
      any(x > c(1e5,1e5,10,.3,2,1)))
    stop("Invalid BS input")
  E <- exp(-q*T)
  A <- S*E; D <- K*exp(-r*T)
  if (T==0 || sigma==0) {
    dc <- if (T==0 || A==D) NA_real_ else as.numeric(A>D)
    ok <- !is.na(dc)
    return(c(C=max(A-D,0),P=max(D-A,0),d1=NA,d2=NA,
      deltaC=E*dc,deltaP=E*(dc-1),
      gamma=if(ok) 0 else NA,vega=if(ok) 0 else NA,
      thetaC=if(ok) dc*(q*A-r*D)/365 else NA,
      thetaP=if(ok) (1-dc)*(r*D-q*A)/365 else NA))
  }`,'先验证有效域，再处理到期和零波动；避免除以零。',String.raw`A=Se^{-qT},\quad D=Ke^{-rT},\quad C=\max(A-D,0),\ P=\max(D-A,0)`,`T=${f(p.T)}，σ=${f(p.sigma)}；${boundary?'进入边界分支':'进入常规分支'}`,'到期全部Greeks未定义。零波动且A≠D时Delta为E或0（Put为0或−E），Gamma/Vega为0；折点留空。',['T','sigma','q'],'price');
 const prefix=full?'  ':'';
 const line=(title,code,action,formula,value,economic,links=[],mark='')=>add(title,code.split('\n').map(x=>prefix+x).join('\n'),action,formula,value,economic,links,mark);
 line('股息贴现因子 E','E <- exp(-q*T)','连续股息在剩余期限内的贴现因子。','E=e^{-qT}',`E=${f(v.E)}`,'q=0时E=1；它同时进入价格和Delta/Gamma。',['q','T']);
 line('标的贴现值 A','A <- S*E','计算定价中的股息调整标的项。','A=Se^{-qT}',`A=${f(v.A)} 元`,'它是公式中的现值项，不是对未来股价的现实预测。',['S','q','T'],'S');
 line('行权价现值 D','D <- K*exp(-r*T)','按连续复利贴现执行价。','D=Ke^{-rT}',`D=${f(v.D)} 元`,'到期支付的行权价与当前支付金额需在同一时点比较。',['K','r','T'],'K');
 line('标准化距离 d₁','d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/\n  (sigma*sqrt(T))','标准化对数价差与风险中性漂移。',String.raw`d_1=\frac{\ln(S/K)+(r-q+\sigma^2/2)T}{\sigma\sqrt T}`,`d₁=${f(v.d1)}`,'公式适用于T>0且σ>0；风险中性含股息漂移为r−q。',['S','K','r','q','sigma','T']);
 line('标准化距离 d₂','d2 <- d1-sigma*sqrt(T)','从d₁减去年化波动率乘期限平方根。',String.raw`d_2=d_1-\sigma\sqrt T`,`d₂=${f(v.d2)}`,'d₂用于风险中性测度下到期价内事件的概率。',['sigma','T']);
 line('正态权重 Φ(d₁)','N1 <- pnorm(d1)','pnorm是标准正态累积分布函数。',String.raw`N_1=\Phi(d_1)`,`Φ(d₁)=${v.d1===null?'未定义':f(M.cdf(v.d1))}`,'Φ(d₁)是标的项的定价权重；可解释为股票计价测度下S_T>K的概率，不能简单称为真实获利概率。',['S','q']);
 line('风险中性概率 Φ(d₂)','N2 <- pnorm(d2)','计算风险中性测度下到期S_T>K的概率。',String.raw`N_2=\Phi(d_2)=\mathbb Q(S_T>K)`,`Φ(d₂)=${v.d2===null?'未定义':f(M.cdf(v.d2))}`,'仅在当前BS假设且T>0、σ>0下成立；到期价内不等于扣除期权成本后的净盈利。',['S','K','q']);
 line('看涨价格 Call','C <- max(0,A-D,A*N1-D*N2)','标的加权项减去执行价加权项；max只抵御浮点舍入。',String.raw`C=A\Phi(d_1)-D\Phi(d_2)`,`Call=${f(v.C)} 元`,'非负且不低于A−D，不高于A。',['S','K','q'],'call');
 line('看跌价格 Put','P <- max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))','用负d值计算看跌的正态权重。',String.raw`P=D\Phi(-d_2)-A\Phi(-d_1)`,`Put=${f(v.P)} 元`,'非负且不低于D−A，不高于D。',['S','K','q'],'put');
 line('Delta · 价格一阶敏感度','deltaC <- E*N1\ndeltaP <- -E*pnorm(-d1)','Delta=∂V/∂S（元/元）。',String.raw`\Delta_C=e^{-qT}\Phi(d_1),\quad\Delta_P=-e^{-qT}\Phi(-d_1)`,`Call=${f(v.deltaC)}，Put=${f(v.deltaP)}`,'局部价格敏感度；Call非负、Put非正，二者之差为e^(−qT)。',['S','q'],'delta');
 line('Gamma · 价格二阶敏感度','gamma <- E*dnorm(d1)/(S*sigma*sqrt(T))','Gamma=∂²V/∂S²（1/元）；dnorm为正态密度。',String.raw`\Gamma=\frac{e^{-qT}\phi(d_1)}{S\sigma\sqrt T}`,`Gamma=${f(v.gamma)}`,'Call和Put的Gamma相同，常规分支为正。',['S','sigma','T','q'],'gamma');
 line('Vega · 每1个百分点','vega <- A*dnorm(d1)*sqrt(T)/100','标准导数∂V/∂σ的单位为元/1.0波动率；显示值除以100。',String.raw`Vega_{1pp}=\frac{A\phi(d_1)\sqrt T}{100}`,`Vega=${f(v.vega)} 元／1百分点`,'例如从20%到21%是1个百分点，小变化近似用当前Vega。',['sigma','q'],'vega');
 line('Theta · 每自然日',`base <- -A*dnorm(d1)*sigma/(2*sqrt(T))
thetaC <- (base-r*D*N2+q*A*N1)/365
thetaP <- (base+r*D*pnorm(-d2)-q*A*pnorm(-d1))/365`,'Theta=−∂V/∂T，标准单位元/年；显示值再除365。',String.raw`365\Theta_C=-\frac{A\phi(d_1)\sigma}{2\sqrt T}-rD\Phi(d_2)+qA\Phi(d_1)`,`Call=${f(v.thetaC)}，Put=${f(v.thetaP)} 元／自然日`,'是时间流逝的局部敏感度；正负取决于参数，不能一概称为负值，也不是实际隔夜盈亏。',['T','r','q'],'theta');
 add('输出价格与Greeks',`${prefix}result <- c(C=C,P=P,d1=d1,d2=d2,
${prefix}  deltaC=deltaC,deltaP=deltaP,gamma=gamma,vega=vega,
${prefix}  thetaC=thetaC,thetaP=thetaP)${full?'\n  return(result)\n}\nresult <- bs(S,K,T,r,sigma,q)':''}
print(result)`,'输出网页使用的同一组价格与Greeks。',String.raw`C-P=A-D`, `C−P=${f(v.C-v.P)}；A−D=${f(v.A-v.D)}`,'网页边界空值对应R的NA；不伪造边界敏感度。',[],'greeks');
 const spots='spot <- seq(max(.01,min(S,K)*.4),\n  min(100000,max(S,K)*1.6),length.out=121)';
 const curves=full?'prices <- vapply(spot,function(s)\n  bs(s,K,T,r,sigma,q)[c("C","P")],numeric(2))\nmatplot(spot,t(prices),type="l",lty=1,\n  xlab="Spot S",ylab="Option price")':`u <- (log(spot/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))
v <- u-sigma*sqrt(T)
call <- pmax(0,spot*E-D,spot*E*pnorm(u)-D*pnorm(v))
put <- pmax(0,D-spot*E,D*pnorm(-v)-spot*E*pnorm(-u))
matplot(spot,cbind(call,put),type="l",lty=1,
  xlab="Spot S",ylab="Option price")`;
 add('绘制价格与S/K参考线',spots+'\n'+curves+'\nabline(v=c(S,K),lty=c(2,4))','只改变横轴现价S；固定K、T、r、σ、q。',String.raw`C(S;q),\quad P(S;q)`,`当前q=${pct(p.q)}`,'这是当前理论价格随现价的曲线，不是未来价格路径，也不是净利润。',['q'],'price');
 return{q:v,blocks,code:blocks.flatMap(b=>b.lines).join('\n'),mode,boundary};
}
return{config,build};});
