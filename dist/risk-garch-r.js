(function(root){const code=String.raw`
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
`;if(typeof module==='object')module.exports=code;else root.RiskGarchR=code;})(this);
