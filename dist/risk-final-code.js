(function(root,factory){const api=factory(typeof module==='object'?require('./risk-math'):root.RiskMath,typeof module==='object'?require('./risk-extended'):root.RiskExtended,typeof module==='object'?require('./risk-code'):root.RiskCode,typeof module==='object'?require('./risk-garch-fit'):root.RiskGarchFit,typeof module==='object'?require('./risk-garch-r'):root.RiskGarchR);if(typeof module==='object')module.exports=api;else root.RiskFinalCode=api;})(this,(M,X,C,G,GR)=>{
const runtime=String.raw`risk <- function(r, gamma, N) {
  L <- -N*r; x <- sort(L); n <- length(L); j <- seq_len(n)
  w <- pmax(0,pmin(j/n-gamma,1/n)); z <- qnorm(gamma)
  c(hVaR=unname(quantile(L,gamma,type=1)),hES=sum(x*w)/(1-gamma),
    nVaR=mean(L)+sd(L)*z,nES=mean(L)+sd(L)*dnorm(z)/(1-gamma))
}
dynamic <- function(R,gamma,N,k,lambda,omega,a,b,model,h0=NULL) {
  stopifnot(k>=2,k<length(R),k==floor(k),lambda>0,lambda<1)
  if(model=="garch")stopifnot(omega>0,a>=0,b>=0,a+b<1)
  n <- length(R); mu <- mean(R[seq_len(k)]); h <- rep(NA_real_,n+1)
  h[k+1] <- if(is.null(h0))var(R[seq_len(k)])else h0
  stopifnot(is.finite(h[k+1]),h[k+1]>=0)
  for(t in seq.int(k+1,n)) {
    # h[t] is predicted before observing R[t]; update only h[t+1]
    h[t+1] <- if(model=="ewma") lambda*h[t]+(1-lambda)*(R[t]-mu)^2 else
      omega+a*(R[t]-mu)^2+b*h[t]
  }
  sigma <- sqrt(h); z <- qnorm(gamma)
  list(h=h,sigma=sigma,VaR=N*(-mu+sigma*z),
    ES=N*(-mu+sigma*dnorm(z)/(1-gamma)),mu=mu)
}
# Deterministic Nelder-Mead, same objective and stopping rule as browser.
nm <- function(fn,start) {
  v <- rbind(start,start+c(.12,0),start+c(0,.18)); f <- apply(v,1,fn)
  for(iter in 0:1999) {
    ord <- order(f); v <- v[ord,,drop=FALSE]; f <- f[ord]
    spread <- max(abs(sweep(v[-1,,drop=FALSE],2,v[1,],"-")))
    if(spread<1e-8 && abs(f[3]-f[1])<1e-9)
      return(list(par=v[1,],value=f[1],converged=is.finite(f[1]),iter=iter))
    cent <- (v[1,]+v[2,])/2; r <- cent+(cent-v[3,]); fr <- fn(r)
    if(fr<f[1]) {
      e <- cent+2*(cent-v[3,]); fe <- fn(e)
      if(fe<fr){v[3,]<-e;f[3]<-fe}else{v[3,]<-r;f[3]<-fr}
    } else if(fr<f[2]) {v[3,]<-r;f[3]<-fr} else {
      outside <- fr<f[3]; cx <- cent+.5*((if(outside) r else v[3,])-cent)
      fc <- fn(cx)
      if(fc<(if(outside) fr else f[3])){v[3,]<-cx;f[3]<-fc}else{
        for(j in 2:3){v[j,]<-(v[j,]+v[1,])/2;f[j]<-fn(v[j,])}
      }
    }
  }
  list(par=v[which.min(f),],value=min(f),converged=FALSE,iter=2000)
}
gpd_risk <- function(u,pu,xi,b,gamma) {
  stopifnot(b>0,pu>0,pu<=1,gamma>0,gamma<1)
  if(1-gamma>=pu) stop("Target quantile must exceed threshold")
  lr <- log(pu/(1-gamma))
  VaR <- u+b*if(abs(xi)<1e-8) lr else expm1(xi*lr)/xi
  ES <- if(xi>=1) Inf else VaR+(b+xi*(VaR-u))/(1-xi)
  c(VaR=VaR,ES=ES)
}
fit_gpd <- function(R,gamma,N,threshold) {
  L <- -N*R; u <- unname(quantile(L,threshold,type=1)); Y <- L[L>u]-u
  nu <- length(Y); pu <- nu/length(L)
  if(nu<20) stop("Fewer than 20 strict threshold exceedances")
  scale <- mean(Y); if(!is.finite(scale)||scale<=0)stop("Degenerate tail")
  y <- Y/scale
  fn <- function(par) {
    xi<-par[1];lb<-par[2]
    if(xi<=-.49||xi>=5||lb< -20||lb>20)return(1e100)
    b<-exp(lb); if(any(1+xi*y/b<=0))return(1e100)
    length(y)*lb+if(abs(xi)<1e-8)sum(y/b) else (1+1/xi)*sum(log1p(xi*y/b))
  }
  fits <- lapply(c(-.2,.1,.6,1.2),function(x)nm(fn,c(x,0)))
  fits <- Filter(function(x)x$converged&&x$value<1e99,fits)
  if(!length(fits))stop("GPD optimization failed")
  fit<-fits[[which.min(sapply(fits,function(x)x$value))]]
  xi<-fit$par[1];b<-exp(fit$par[2])*scale
  if(xi < -.4899||xi>4.9999)stop("GPD shape search boundary: unstable fit")
  est<-gpd_risk(u,pu,xi,b,gamma)
  list(u=u,Y=Y,nu=nu,pu=pu,xi=xi,b=b,VaR=est[[1]],ES=est[[2]],
    logLikelihood=-fit$value-nu*log(scale),converged=TRUE)
}
kupiec <- function(n,x,p0) {
  stopifnot(n>=1,x>=0,x<=n,p0>0,p0<1)
  term <- function(count,p)if(count==0)0 else count*log(p)
  phat<-x/n;ll0<-term(x,p0)+term(n-x,1-p0)
  ll1<-term(x,phat)+term(n-x,1-phat)
  LR<-max(0,2*(ll1-ll0))
  c(n=n,x=x,rate=phat,p0=p0,LR=LR,p=pchisq(LR,df=1,lower.tail=FALSE))
}
backtest <- function(R,gamma,N,train,lambda,omega,a,b) {
  stopifnot(train>=30,length(R)-train>=20)
  n<-length(R); ids<-seq.int(train+1,n); L<- -N*R[ids]
  static<-risk(R[seq_len(train)],gamma,N)
  ew<-dynamic(R,gamma,N,train,lambda,omega,a,b,"ewma")
  ga<-tryCatch(dynamic(R,gamma,N,train,lambda,omega,a,b,"garch"),error=function(e)list(error=conditionMessage(e)))
  predictions<-list(historical=list(VaR=rep(static[1],length(ids)),ES=rep(static[2],length(ids))),
    normal=list(VaR=rep(static[3],length(ids)),ES=rep(static[4],length(ids))),
    ewma=list(VaR=ew$VaR[ids],ES=ew$ES[ids]),garch=if(is.null(ga$error))list(VaR=ga$VaR[ids],ES=ga$ES[ids])else ga)
  models<-lapply(predictions,function(p){
    if(!is.null(p$error))return(p)
    valid<-is.finite(L)&is.finite(p$VaR);hit<-valid&L>p$VaR
    es_ids<-hit&is.finite(p$ES)
    actual<-if(any(es_ids))mean(L[es_ids])else NA_real_
    predicted<-if(any(es_ids))mean(p$ES[es_ids])else NA_real_
    list(VaR=p$VaR,ES=p$ES,hits=which(hit),
      test=kupiec(sum(valid),sum(hit),1-gamma),
      meanActual=actual,meanES=predicted,bias=actual-predicted)
  })
  list(L=L,ids=ids,models=models)
}`;
function build(p,view='basic',method='historical',chart='var',mode='full',provided,options={}){
const R=provided||M.generate(p);if(view==='basic'){const basic=C.build(p,view,method,chart,mode,provided);if(options.source)basic.code='# 用户填写来源（未核实）：'+String(options.source).replace(/[\r\n]/g,' ')+'\n'+basic.code;return basic;}
const cfg={...X.defaults,...p},estimated=options.garchMode==='estimate'&&view==='dynamic'&&options.dynamic!=='ewma',train=cfg.train;const q=M.risk(R,p.alpha,p.N);let e=M.ewma(R,p.alpha,p.N,p.lambda,estimated?train:p.window),g=null,fit=null,fitError=null,ev=null,bt=null,error=null;try{if(estimated){const result=G.estimated(R,p.alpha,p.N,train);g=result.prediction;fit=result.fit;}else g=X.garch(R,p.alpha,p.N,cfg.omega,cfg.a,cfg.b,p.window,options.initialMode==='custom'?p.h0:undefined);}catch(err){if(!estimated&&view==='dynamic'&&options.dynamic!=='ewma')throw err;if(estimated)fitError=err.message;}try{if(view==='evt')ev=X.evt(R,p.alpha,p.N,cfg.threshold);if(view==='backtest')bt=G.backtest(R,cfg,{includeFit:options.backModel==='garchFit'});}catch(err){error=err.message;}
const blocks=[],add=(key,title,code,explain,formula='')=>blocks.push({key,title,lines:code.split('\n'),explain,formula});
add('data','数据与参数',`# 用户填写来源（未核实）：${String(options.source||'未提供').replace(/[\r\n]/g,' ')}\n# ${provided?'用户导入数据；当前简单收益已内嵌，无外部文件依赖':'合成教学数据，非真实市场行情'}\n# 单期简单收益，小数；不进行年化或多日缩放\nR <- c(${R.join(',\n  ')})\nn <- length(R)\nN <- ${p.N}\ngamma <- ${p.alpha}\nk <- ${p.window}\nlambda <- ${p.lambda}\nomega <- ${cfg.omega}\na <- ${cfg.a}\nb <- ${cfg.b}\nthreshold <- ${cfg.threshold}\ntrain <- ${cfg.train}\nL <- -N*R\n${options.dates?'dates <- as.Date(c('+options.dates.map(x=>'"'+x+'"').join(',')+'))':'dates <- seq_len(n)'}\nstopifnot(n>=2,all(is.finite(R)),all(R>=-1),N>0,gamma>0,gamma<1)`, '收益统一为小数简单收益；损失正数为亏损。日期已对齐至该期收益结束日；下一预测期没有实际损失。');
add('functions','数学函数与模型估计',runtime+GR,'Base R定义精确历史ES、条件方差、真实GPD似然优化和Kupiec检验。GPD采用正则搜索域−0.49<ξ<5，边界拟合拒绝报告；不是全实数形状参数的无约束MLE。GARCH可选择给定参数或训练期条件高斯样本估计；均值固定为训练均值，估计初始化h1为训练样本方差。');
if(view==='dynamic'){
if(estimated){add('fit','GARCH训练期样本估计',`# Only the first train observations enter the likelihood; no test returns.
fit_attempt <- tryCatch(fit_garch(R[seq_len(train)]),error=function(e)list(error=conditionMessage(e)))
fit <- if(is.null(fit_attempt$error))fit_attempt else NULL
if(is.null(fit))message(fit_attempt$error)else print(unlist(fit[c("omega","a","b","mu","initial","logLikelihood","n","iterations")]))`, '前train期固定样本均值、h1为训练样本方差；全部训练收益进入高斯条件似然。六起点优化，参数变换保证正方差与平稳，检查单纯形收敛和局部扰动；训练期拟合路径不冒充事前预测。',String.raw`-\ell=\frac12\sum_t[\log(2\pi)+\log h_t+(R_t-\mu)^2/h_t]`);
add('ewma','对齐的样本外顺序预测',`ew <- dynamic(R,gamma,N,train,lambda,omega,a,b,"ewma")
ga <- if(is.null(fit))NULL else garch_forecast(R,gamma,N,train,fit)
if(!is.null(ga))print(tail(data.frame(ewma_h=ew$h,garch_h=ga$h,VaR=ga$VaR,ES=ga$ES),6))`, 'GARCH先在训练期末保留方差状态；第train+1期开始有效预测，EWMA也对齐到同一训练终点。检验期固定估计参数与均值，仅更新方差，不每日重新拟合。');
}else{
add('ewma','条件方差与事前风险',`ew <- dynamic(R,gamma,N,k,lambda,omega,a,b,"ewma")\nga <- tryCatch(dynamic(R,gamma,N,k,lambda,omega,a,b,"garch",${options.initialMode==='custom'?p.h0:'NULL'}),error=function(e){message(conditionMessage(e));list(h=rep(NA_real_,n+1),sigma=rep(NA_real_,n+1),VaR=rep(NA_real_,n+1),ES=rep(NA_real_,n+1))})\nresult <- data.frame(day=seq_len(n+1),actual_loss=c(L,NA_real_),\n  ewma_h=ew$h,garch_h=ga$h,ewma_VaR=ew$VaR,garch_VaR=ga$VaR,\n  ewma_ES=ew$ES,garch_ES=ga$ES)\nprint(tail(result,6))\nprint(c(mu=ew$mu,h0_ewma=ew$h[k+1],h0_garch=ga$h[k+1],long_run=omega/(1-a-b)))`, '共用前k期训练均值；EWMA从训练样本方差开始，GARCH按所选样本方差或指定h0初始化。第t期收益只更新t+1期；长期方差不是本轮初始方差。',String.raw`h_{t+1}=\omega+a(R_t-\mu)^2+b h_t`);
}
if(mode==='full')add('plot','同一时间轴绘图',`if("${options.dynamic||'ewma'}"=="garch" && is.null(ga)) { message("GARCH unavailable; no substituted prediction") } else {\nfield <- "${chart==='es'?'ES':chart==='volatility'?'sigma':'VaR'}"\nfactor <- ${chart==='volatility'?'100':'1/10000'}\nselected <- "${options.dynamic||'ewma'}"\ncur <- if(selected=="garch")ga[[field]] else ew[[field]]\ny <- cur*factor\nyr <- range(c(y,${chart==='volatility'?'numeric(0)':'L/10000'},if(selected=="compare"&&!is.null(ga))ga[[field]]*factor),na.rm=TRUE)\nif(diff(yr)==0)yr<-yr+c(-1,1)\nplot(seq_len(n+1),y,type="l",col="steelblue",ylim=yr,\n xlab="Observation period (last = next forecast)",ylab="${chart==='volatility'?'One-period SD (%)':'Loss / risk (10,000 yuan)'}")\n${chart==='volatility'?'':'lines(seq_len(n),L/10000,col="grey70")'}\nif(selected=="compare"&&!is.null(ga))lines(seq_len(n+1),ga[[field]]*factor,col="thistle4",lty=2)\nabline(v=n+.5,lty=3)\npoints(n+1,tail(y,1),pch=19)\n}`, '末点为下一观测期；没有伪造其已实现损失。比较曲线使用同一训练数据、均值、条件正态假设及共同有效日期；各模型初始化规则见计算段，不能据此声称初始方差状态相同。');
}else if(view==='evt'){
add('estimate','POT-GPD拟合与风险',`ev <- tryCatch(fit_gpd(R,gamma,N,threshold),error=function(e)list(error=conditionMessage(e)))\nif(!is.null(ev$error))message(ev$error) else {\n  print(unlist(ev[c("u","nu","pu","xi","b","VaR","ES","logLikelihood")]))\n  if(ev$xi>=1)message("xi >= 1: theoretical ES is infinite")\n}`, '只拟合严格大于阈值的损失；多起点数值优化真实GPD负对数似然。ξ≥1时ES不有限；失败时不产生虚假结果。',String.raw`VaR=u+\frac{b}{\xi}[(p_u/(1-\gamma))^\xi-1]`);
if(mode==='full')add('plot','尾部经验生存率与拟合',`if(is.null(ev$error)) {\n  losses<-sort(L[L>ev$u]); survival<-sapply(losses,function(x)mean(L>x))\n  grid<-seq(ev$u,max(c(losses,ev$VaR,if(is.finite(ev$ES))ev$ES)),length.out=200)\n  support<-1+ev$xi*(grid-ev$u)/ev$b\n  fit<-if(abs(ev$xi)<1e-8)ev$pu*exp(-(grid-ev$u)/ev$b) else\n    ifelse(support>0,ev$pu*pmax(support,1e-300)^(-1/ev$xi),0)\n  plot(losses/10000,survival,pch=16,xlim=range(grid)/10000,\n    xlab="Tail loss (10,000 yuan)",ylab="Survival probability",main="POT-GPD: static tail")\n  lines(grid/10000,fit,col="thistle4");abline(v=c(ev$u,ev$VaR)/10000,lty=c(3,1))\n  if(is.finite(ev$ES))abline(v=ev$ES/10000,lty=2)\n}`, '经验生存率与GPD尾部生存概率使用同一无条件概率尺度；这是静态EVT，不是逐期条件EVT预测。');
}else{
add('predict','训练与顺序预测',`bt <- backtest(R,gamma,N,train,lambda,omega,a,b)\n${options.backModel==='garchFit'?'bt <- garch_estimated_backtest(bt,R,gamma,N,train)\n':''}selected <- "${options.backModel||'ewma'}"\ncurrent <- bt$models[[selected]]\nif(!is.null(current$error))message(current$error)`, '前train期训练静态分布和固定条件均值；此后静态参数固定，EWMA/GARCH逐期只用过去收益更新。GARCH教学参数与训练期估计明确区分；估计参数模式仅训练一次，随后逐期更新。');
add('test','超限、Kupiec与ES诊断',`if(is.null(current$error)) {\nprint(current$test)\nprint(c(mean_actual_tail=current$meanActual,mean_predicted_ES=current$meanES,\n  descriptive_bias=current$bias))\nprint(data.frame(date=dates[bt$ids],actual=bt$L,VaR=current$VaR,ES=current$ES,\n  exceed=bt$L>current$VaR))\n}`, '严格L>VaR才算超限。Kupiec只检验无条件超限比例，不能证明模型准确或超限独立；ES均值差仅为描述性诊断。',String.raw`LR=-2[\ell(p_0)-\ell(x/n)]\;\sim\chi^2_1`);
if(mode==='full')add('plot','样本外预测与后来损失',`if(is.null(current$error)) {\nplot(bt$ids,bt$L/10000,type="l",col="grey60",\n ylim=range(c(bt$L,current$VaR))/10000,\n xlab="Out-of-sample observation",ylab="One-period loss (10,000 yuan)")\nlines(bt$ids,current$VaR/10000,col="steelblue",lwd=2)\nif(length(current$hits))points(bt$ids[current$hits],bt$L[current$hits]/10000,col="firebrick",pch=19)\n}`, '图中只有检验期，训练期不计入超限分母。检验期第t个风险预测在观察该期损失之前产生。');
}
return{blocks,fit,fitError,estimated,code:blocks.map(b=>b.lines.join('\n')).join('\n\n'),q,e,g,ev,bt,error};}
return{build,runtime};});
