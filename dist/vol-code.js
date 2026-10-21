(function(root,factory){const api=factory(typeof module==='object'?require('./vol-math'):root.VolMath,typeof module==='object'?require('./risk-garch-r'):root.RiskGarchR,typeof module==='object'?require('./vol-r'):root.VolR);if(typeof module==='object')module.exports=api;else root.VolCode=api;})(this,(V,GR,VR)=>{
function build(p,state,data){V.settings(p);const blocks=[],add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:code.split('\n'),explain,formula});
const type=state.view==='extension'?(state.extension==='asymmetry'?'gjr':'m'):state.model||'garch';let q=null,error=null,lm=V.safe(()=>V.archLM(data.A.map(x=>x-data.A.reduce((a,b)=>a+b,0)/data.A.length),p.lag)),diag=null,forecast=null,cc=null,comparison=null;
try{if(state.view==='multi')cc=V.ccc(data.A,data.B,p,state.mode,state.rhoMode);else if(state.view!=='arch'){q=state.mode==='estimate'?V.fit(data.A,type):V.path(data.A,p,type);diag=V.diagnostics(q,p.lag);forecast=V.forecast(q,p.horizon);if(state.compare)comparison=['arch','garch','gjr'].map(t=>({type:t,...V.safe(()=>V.fit(data.A,t))}));}}catch(e){error=e.message;}
add('data','数据与参数',`# ${data.source}; source is not independently verified\n# Simple returns, decimal; one observation period, no automatic annualization.\nR <- c(${data.A.join(',\n ')})\nB <- ${state.view==='multi'&&data.B?'c('+data.B.join(',\n ')+')':'NULL'}\ndates <- ${data.dates?'as.Date(c('+data.dates.map(x=>'"'+x+'"').join(',')+'))':'seq_along(R)'}\np <- list(${Object.entries(p).map(([k,v])=>k+'='+v).join(',\n ')} )\nn <- length(R)\nstopifnot(n>=2,all(is.finite(R)),all(R>=-1))`, '当前收益值完整内嵌，日期已排序配对。导入数据不需要未知本地文件路径；合成数据不是市场行情。');
if(data.raw){const raw=data.raw;add('preprocess','CSV转换与共同日期',`# Browser-local source text, embedded for an independent Base R audit.
raw_A <- ${JSON.stringify(raw.a)}
raw_B <- ${raw.b?JSON.stringify(raw.b):'NULL'}
read_local <- function(text) {
 d<-read.csv(text=text,stringsAsFactors=FALSE,check.names=FALSE,strip.white=TRUE)
 names(d)<-tolower(names(d));d$date<-as.Date(d$date)
 stopifnot(!anyNA(d$date),!anyDuplicated(d$date))
 d[order(d$date),,drop=FALSE]
}
da<-read_local(raw_A)
if(ncol(da)==3) { levels<-data.frame(date=da$date,A=da[[2]],B=da[[3]]) } else {
 levels<-data.frame(date=da$date,A=da[[2]])
 if(!is.null(raw_B)){db<-read_local(raw_B);levels<-merge(levels,data.frame(date=db$date,B=db[[2]]),by="date",all=FALSE)}
}
levels<-levels[order(levels$date),,drop=FALSE]
kind<-"${raw.kind}";unit<-"${raw.unit}"
convert <- function(x){if(unit=="percent")x<-x/100;if(kind=="log")expm1(x)else x}
if(kind=="price") {
 stopifnot(all(levels$A>0),if("B"%in%names(levels))all(levels$B>0)else TRUE)
 raw_R<-levels$A[-1]/head(levels$A,-1)-1
 raw_B_returns<-if("B"%in%names(levels))levels$B[-1]/head(levels$B,-1)-1 else NULL
 raw_dates<-levels$date[-1]
}else{raw_R<-convert(levels$A);raw_B_returns<-if("B"%in%names(levels))convert(levels$B)else NULL;raw_dates<-levels$date}
stopifnot(length(raw_R)==length(R),max(abs(raw_R-R))<1e-12,identical(as.character(raw_dates),as.character(dates)))
${state.view==='multi'&&data.B?'stopifnot(length(raw_B_returns)==length(B),max(abs(raw_B_returns-B))<1e-12)':'# Current view uses asset A; the confirmed paired date subset is preserved.'}
# Use the explicit confirmed vectors R/B above to keep optimization inputs identical.`, '价格先按共同日期对齐，再从相同起止价格计算简单收益；收益表按日期交集。对数收益用expm1；百分数除100。原始CSV仅内嵌在复制脚本，本地读取并核对，不上传。');}
add('functions','模型与统计函数',state.view==='arch'?VR.slice(VR.indexOf('varch <-'),VR.indexOf('vljung <-')):GR+VR,'Base R包含条件高斯似然、受约束优化、ARCH辅助回归、Ljung-Box、预测及CCC。GARCH复用实验07定义；检验为渐近参考，拟合后未用Bootstrap校准。');
if(state.view==='arch'){
add('lm','ARCH效应检验',`mu_hat <- mean(R)\ne <- R-mu_hat\ne2 <- e^2\nlm_result <- tryCatch(varch(e,p$lag),error=function(e)list(error=conditionMessage(e)))\nprint(lm_result)`, '先用常数均值模型残差，再回归平方残差对其滞后。有效样本数n−lag，LM=(n−lag)R²，卡方自由度lag。收益无明显线性相关不代表平方残差无相关。',String.raw`LM=(n-p)R^2\;\overset{a}{\sim}\chi^2_p`);
add('plot','当前观察图',`y <- ${state.archChart==='squared'?'e2*10000':state.archChart==='cluster'?'abs(e)*100':'R*100'}\nplot(dates,y,type="l",xlab="Observation period / date",ylab="${state.archChart==='squared'?'Squared residual (percentage points squared)':'Return / absolute residual (%)'}",main="${state.archChart==='squared'?'Squared residuals':state.archChart==='cluster'?'Volatility clustering proxy: absolute residuals':'Returns'}")`, '平方残差和绝对残差是可观察波动代理，不是直接观测到的真实条件方差。4倍标准化冲击不等于400%收益。');
}else if(state.view==='multi'){
add('ccc','双资产CCC',`mode <- "${state.mode}"\nrhoMode <- "${state.rhoMode}"\ncc <- tryCatch(vccc(R,B,p,mode,rhoMode),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(cc$error))message(cc$error)else {\n print(c(rho=cc$rho,estimated_rho=cc$estimatedRho,weightA=p$weight,weightB=1-p$weight))\n print(tail(data.frame(hA=cc$a$h,hB=cc$b$h,covariance=cc$covariance,portfolio_h=cc$hp,det=cc$det),6))\n}`, '两阶段：分别GARCH拟合，再用相同日期标准化残差相关构造H=D R D。不是联合极大似然；相关常数，不是DCC。',String.raw`h_{p,t}=w_A^2h_{A,t}+w_B^2h_{B,t}+2w_Aw_B\rho\sqrt{h_{A,t}h_{B,t}}`);
add('plot','双资产风险图',`if(is.null(cc$error)) {\n y<-${state.multiChart==='A'?'cc$a$h':state.multiChart==='B'?'cc$b$h':'cc$hp'}\n ${state.multiChart==='all'?'matplot(seq_along(y),sqrt(cbind(cc$a$h,cc$b$h,cc$hp))*100,type="l",lty=c(1,1,2),col=c("steelblue","seagreen","thistle4"),xlab=':'plot(seq_along(y),sqrt(y)*100,type="l",xlab='}"Observation (last = next forecast)",\n ylab="Conditional SD (%)",main="CCC-GARCH: ${state.multiChart||'portfolio'}")\n abline(v=n+.5,lty=3)\n}`, '方差单位为小数收益²，协方差也是小数收益²；图上取平方根乘100为单期标准差百分比。最后一点只为预测。');
}else{
add('fit',state.mode==='estimate'?'真实样本估计':'给定参数递推',`model <- "${type}"\nmode <- "${state.mode}"\nq <- tryCatch(if(mode=="estimate")vfit(R,model)else vpath(R,p,model),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(q$error))message(q$error)else {\n print(unlist(q[c("omega","a","b","gamma","mu","kappa","logLikelihood","parameters","aic","bic")]))\n print(c(n=length(R),converged=if(mode=="estimate")q$converged else NA,current_SD=sqrt(q$h[n]),next_SD=sqrt(tail(q$h,1))))\n if(mode=="estimate"&&(q$persistence>.9999||q$a<1e-5||q$b<1e-5))message("Near parameter boundary: numerical convergence does not prove reliable identification")\n print(tail(data.frame(h=q$h,sigma=sqrt(q$h),actual=c(R,NA_real_)),6))\n}`, type==='m'?'标准差进入均值：μ+κ√h，残差必须按该条件均值重新计算，并反馈到下一期方差。估计模式联合优化μ、κ及方差参数，不把σ乘系数冒充估计。':type==='gjr'?'负冲击系数a+γ，正冲击系数a；约束a≥0、a+γ≥0，且在对称标准正态创新假设下a+b+γ/2<1。估计γ可负，不能预认定为正。':'给定参数不是估计。数据估计固定样本均值，h1为样本方差，所有样本进入条件高斯拟合；拟合路径不冒充过去的事前预测。',type==='m'?String.raw`R_t=\mu+\kappa\sqrt{h_t}+\varepsilon_t`:type==='gjr'?String.raw`h_{t+1}=\omega+(a+\gamma I_{\varepsilon_t<0})\varepsilon_t^2+b h_t`:String.raw`h_{t+1}=\omega+a\varepsilon_t^2+b h_t`);
add('diagnosis','诊断与预测',`if(is.null(q$error)) {\n diagnostics <- list(z=tryCatch(vljung(q$z,p$lag),error=function(e)conditionMessage(e)),\n z2=tryCatch(vljung(q$z^2,p$lag),error=function(e)conditionMessage(e)),\n arch=tryCatch(varch(q$z,p$lag),error=function(e)conditionMessage(e)))\n print(diagnostics)\n forecast <- vforecast(q,p$horizon)\n print(data.frame(k=seq_len(p$horizon),variance=forecast$h,sd=sqrt(forecast$h)))\n}`, '标准化残差ε/√h；平方序列再检验剩余聚集。Ljung-Box采用lag自由度，拟合参数影响参考分布，p值仅渐近近似；不显著不证明模型正确。多期图为√E[h]，不是E[σ]。',String.raw`h_{T+k|T}=\bar h+(a+b+\gamma/2)^{k-1}(h_{T+1|T}-\bar h)`);
if(state.view==='extension'&&state.extension==='asymmetry')add('impact','同幅正负冲击',`if(is.null(q$error)){\n base_h <- tail(q$h,1)\n positive <- q$omega+q$a*p$impact^2+q$b*base_h\n negative <- q$omega+(q$a+q$gamma)*p$impact^2+q$b*base_h\n print(c(positive_variance=positive,negative_variance=negative))\n}`, '保持同一个当前方差状态，比较±相同简单收益残差；差额为γ×冲击²。不是比较不同日期的冲击。');
if(state.compare&&state.view==='model')add('compare','同口径模型比较',`comparison <- lapply(c("arch","garch","gjr"),function(type){\n tryCatch({f<-vfit(R,type);c(LL=f$logLikelihood,k=f$parameters,AIC=f$aic,BIC=f$bic)},error=function(e)conditionMessage(e))})\nnames(comparison)<-c("ARCH","GARCH","GJR");print(comparison)`, '同一收益窗口、同一固定样本均值和h1样本方差；参数数计入估计均值1项，属于插件均值的条件似然比较，不是所有模型联合均值MLE。训练拟合改善不保证样本外预测更好。');
const chart=state.modelChart||'volatility';
if(state.view==='extension'&&type==='gjr')add('plot','当前新闻冲击曲线',`if(is.null(q$error)) {
 shock_grid<-seq(-max(.01,p$impact*1.5),max(.01,p$impact*1.5),length.out=121)
 next_h<-q$omega+(q$a+ifelse(shock_grid<0,q$gamma,0))*shock_grid^2+q$b*tail(q$h,1)
 plot(shock_grid*100,sqrt(next_h)*100,type="l",xlab="Hypothetical residual shock (%)",ylab="Next-period conditional SD (%)")
 points(c(-p$impact,p$impact)*100,sqrt(c(negative,positive))*100,pch=19)
}`, '相同当前方差下的正负残差新闻冲击，不是不同日期的实际收益，也不预设γ为正。');
else add('plot','当前主题图',`if(is.null(q$error)) {\n y <- ${state.view==='extension'&&type==='m'?'q$condMean*100':chart==='residual'?'q$z':chart==='squared'?'q$z^2':chart==='forecast'?'forecast$sigma*100':'sqrt(q$h)*100'}\n plot(seq_along(y),y,type="l",xlab="${chart==='forecast'?'Forecast horizon k':'Observation period'}",ylab="${type==='m'&&state.view==='extension'?'Conditional mean (%)':chart==='residual'?'Standardized residual':chart==='squared'?'Squared standardized residual':'Conditional / forecast SD (%)'}")\n ${chart==='forecast'?'abline(h=sqrt(forecast$long)*100,lty=3)':'abline(v=n+.5,lty=3)'}\n}`, '一次只画当前主题。样本估计图是拟合条件波动率，末点为下一期预测；预测不保证收益方向。κ是模型内关系，不是因果或必然为正的风险补偿。');
}
return{blocks,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,lm,diag,forecast,cc,error,comparison,type};}
return{build};});
