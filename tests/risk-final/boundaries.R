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
for(xi in c(-.3,0,1e-10,.4,1,1.2)){r<-gpd_risk(10,.2,xi,3,.99);cat("GPD",paste(format(r,digits=17),collapse=","),"\n")}
for(x in c(0,5,100)){cat("POF",paste(format(kupiec(100,x,.05),digits=17),collapse=","),"\n")}