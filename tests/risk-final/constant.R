# 用户填写来源（未核实）：未提供
# 合成教学数据，非真实市场行情
# 单期简单收益，小数；不进行年化或多日缩放
R <- c(0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004,
  0.0004)
n <- length(R)
N <- 1000000
gamma <- 0.95
k <- 30
lambda <- 0.94
omega <- 0.000002
a <- 0.08
b <- 0.9
threshold <- 0.8
train <- 150
L <- -N*R
dates <- seq_len(n)
stopifnot(n>=2,all(is.finite(R)),all(R>=-1),N>0,gamma>0,gamma<1)

risk <- function(r, gamma, N) {
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
}
# Conditional Gaussian GARCH fit: fixed training mean, h[1]=training sample variance.
# Scale residuals by training SD for optimization; transform variance back afterward.
gdecode <- function(t) {
  ea<-exp(t[2]);eb<-exp(t[3]);den<-1+ea+eb
  c(w=exp(t[1]),a=ea/den,b=eb/den)
}
gsimplex <- function(fn,start,maxIter=1800) {
  d<-length(start);v<-rbind(start,matrix(rep(start,d),nrow=d,byrow=TRUE)+diag(.25,d))
  f<-apply(v,1,fn)
  for(it in seq_len(maxIter)-1) {
    ord<-order(f);v<-v[ord,,drop=FALSE];f<-f[ord]
    spread<-max(abs(sweep(v[-1,,drop=FALSE],2,v[1,],"-")))
    if(spread<1e-6&&f[d+1]-f[1]<1e-8)
      return(list(par=v[1,],value=f[1],converged=TRUE,iterations=it))
    cent<-colMeans(v[seq_len(d),,drop=FALSE]);r<-2*cent-v[d+1,];fr<-fn(r)
    if(fr<f[1]){e<-cent+2*(r-cent);fe<-fn(e)
      if(fe<fr){v[d+1,]<-e;f[d+1]<-fe}else{v[d+1,]<-r;f[d+1]<-fr}
    }else if(fr<f[d]){v[d+1,]<-r;f[d+1]<-fr}else{
      outside<-fr<f[d+1];cx<-cent+.5*((if(outside)r else v[d+1,])-cent);fc<-fn(cx)
      if(fc<(if(outside)fr else f[d+1])){v[d+1,]<-cx;f[d+1]<-fc}else{
        for(j in 2:(d+1)){v[j,]<-(v[j,]+v[1,])/2;f[j]<-fn(v[j,])}
      }
    }
  }
  j<-which.min(f);list(par=v[j,],value=f[j],converged=FALSE,iterations=maxIter)
}
garch_objective <- function(eps,t) {
  if(any(!is.finite(t))||any(abs(t)>20))return(1e100)
  p<-gdecode(t);if(p[2]+p[3]>=1)return(1e100)
  h<-1;f<-0
  for(z in eps){
    if(!is.finite(h)||h<=0)return(1e100)
    f<-f+.5*(log(2*pi)+log(h)+z*z/h)
    h<-p[1]+p[2]*z*z+p[3]*h
  }
  if(is.finite(f))f else 1e100
}
fit_garch <- function(trainR,maxIter=1800) {
  stopifnot(all(is.finite(trainR)),all(trainR>=-1))
  n<-length(trainR);if(n<60)stop("GARCH needs at least 60 training observations")
  mu<-mean(trainR);s2<-var(trainR);scale<-sqrt(s2)
  if(!is.finite(scale)||scale<=1e-12*max(1,abs(mu)))stop("Near-constant training returns")
  eps<-(trainR-mu)/scale;fn<-function(t)garch_objective(eps,t)
  original<-rbind(c(.05,.08,.87),c(.1,.15,.75),c(.5,.1,.4),
    c(.9,.05,.05),c(.01,.12,.87),c(.2,.6,.2))
  starts<-t(apply(original,1,function(p)c(log(p[1]),log(p[2]/(1-p[2]-p[3])),log(p[3]/(1-p[2]-p[3])))))
  attempts<-lapply(seq_len(nrow(starts)),function(i){
    v<-gsimplex(fn,starts[i,],maxIter)
    local<-v$converged&&all(sapply(seq_along(v$par),function(j)all(sapply(c(-1,1),function(sign){
      t<-v$par;t[j]<-t[j]+sign*1e-4;fn(t)>=v$value-1e-6
    }))))
    v$accepted<-v$converged&&local&&v$value<1e99;v
  })
  valid<-Filter(function(v)v$accepted,attempts)
  if(!length(valid))stop("GARCH optimization failed: no teaching-parameter fallback")
  best<-valid[[which.min(sapply(valid,function(v)v$value))]]
  p<-gdecode(best$par);omega<-p[1]*s2;a<-p[2];b<-p[3];h<-numeric(n+1);h[1]<-s2
  for(t in seq_len(n))h[t+1]<-omega+a*(trainR[t]-mu)^2+b*h[t]
  stopifnot(omega>0,a>=0,b>=0,a+b<1,all(is.finite(h)),all(h>0))
  list(omega=unname(omega),a=unname(a),b=unname(b),mu=mu,initial=s2,
    scale=scale,n=n,h=h,theta=best$par,logLikelihood=-best$value-n*log(scale),
    converged=TRUE,iterations=best$iterations,attempts=attempts)
}
garch_forecast <- function(R,gamma,N,train,fit) {
  stopifnot(train==fit$n,train>=60,train<length(R))
  n<-length(R);h<-rep(NA_real_,n+1);h[train+1]<-fit$h[train+1]
  for(t in seq.int(train+1,n))h[t+1]<-fit$omega+fit$a*(R[t]-fit$mu)^2+fit$b*h[t]
  sigma<-sqrt(h);z<-qnorm(gamma)
  list(h=h,sigma=sigma,VaR=N*(-fit$mu+sigma*z),
    ES=N*(-fit$mu+sigma*dnorm(z)/(1-gamma)),mu=fit$mu)
}
# Fixed initial training estimation + sequential test variance updates; no daily refitting.
garch_estimated_backtest <- function(bt,R,gamma,N,train) {
  attempt<-tryCatch({f<-fit_garch(R[seq_len(train)]);g<-garch_forecast(R,gamma,N,train,f);
    ids<-bt$ids;V<-g$VaR[ids];E<-g$ES[ids];hit<-bt$L>V
    actual<-if(any(hit))mean(bt$L[hit])else NA_real_
    predicted<-if(any(hit))mean(E[hit])else NA_real_
    list(fit=f,model=list(VaR=V,ES=E,hits=which(hit),test=kupiec(length(ids),sum(hit),1-gamma),
      meanActual=actual,meanES=predicted,bias=actual-predicted))},error=function(e)list(error=conditionMessage(e)))
  bt$fit<-attempt$fit;bt$models$garchFit<-if(is.null(attempt$error))attempt$model else list(error=attempt$error)
  bt
}


ew <- dynamic(R,gamma,N,k,lambda,omega,a,b,"ewma")
ga <- tryCatch(dynamic(R,gamma,N,k,lambda,omega,a,b,"garch",NULL),error=function(e){message(conditionMessage(e));list(h=rep(NA_real_,n+1),sigma=rep(NA_real_,n+1),VaR=rep(NA_real_,n+1),ES=rep(NA_real_,n+1))})
result <- data.frame(day=seq_len(n+1),actual_loss=c(L,NA_real_),
  ewma_h=ew$h,garch_h=ga$h,ewma_VaR=ew$VaR,garch_VaR=ga$VaR,
  ewma_ES=ew$ES,garch_ES=ga$ES)
print(tail(result,6))
print(c(mu=ew$mu,h0_ewma=ew$h[k+1],h0_garch=ga$h[k+1],long_run=omega/(1-a-b)))

if("ewma"=="garch" && is.null(ga)) { message("GARCH unavailable; no substituted prediction") } else {
field <- "VaR"
factor <- 1/10000
selected <- "ewma"
cur <- if(selected=="garch")ga[[field]] else ew[[field]]
y <- cur*factor
yr <- range(c(y,L/10000,if(selected=="compare"&&!is.null(ga))ga[[field]]*factor),na.rm=TRUE)
if(diff(yr)==0)yr<-yr+c(-1,1)
plot(seq_len(n+1),y,type="l",col="steelblue",ylim=yr,
 xlab="Observation period (last = next forecast)",ylab="Loss / risk (10,000 yuan)")
lines(seq_len(n),L/10000,col="grey70")
if(selected=="compare"&&!is.null(ga))lines(seq_len(n+1),ga[[field]]*factor,col="thistle4",lty=2)
abline(v=n+.5,lty=3)
points(n+1,tail(y,1),pch=19)
}
cat("CHECK",paste(format(c(ew$h,ew$VaR,ew$ES,ga$h,ga$VaR,ga$ES),digits=17,scientific=TRUE),collapse=","),"\n")
