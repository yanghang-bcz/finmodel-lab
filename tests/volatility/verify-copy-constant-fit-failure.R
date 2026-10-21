# 用户导入数据; source is not independently verified
# Simple returns, decimal; one observation period, no automatic annualization.
R <- c(0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001,
 0.001)
B <- NULL
dates <- as.Date(c("2021-01-01","2021-01-02","2021-01-03","2021-01-04","2021-01-05","2021-01-06","2021-01-07","2021-01-08","2021-01-09","2021-01-10","2021-01-11","2021-01-12","2021-01-13","2021-01-14","2021-01-15","2021-01-16","2021-01-17","2021-01-18","2021-01-19","2021-01-20","2021-01-21","2021-01-22","2021-01-23","2021-01-24","2021-01-25","2021-01-26","2021-01-27","2021-01-28","2021-01-29","2021-01-30","2021-01-31","2021-02-01","2021-02-02","2021-02-03","2021-02-04","2021-02-05","2021-02-06","2021-02-07","2021-02-08","2021-02-09","2021-02-10","2021-02-11","2021-02-12","2021-02-13","2021-02-14","2021-02-15","2021-02-16","2021-02-17","2021-02-18","2021-02-19","2021-02-20","2021-02-21","2021-02-22","2021-02-23","2021-02-24","2021-02-25","2021-02-26","2021-02-27","2021-02-28","2021-03-01","2021-03-02","2021-03-03","2021-03-04","2021-03-05","2021-03-06","2021-03-07","2021-03-08","2021-03-09","2021-03-10","2021-03-11","2021-03-12","2021-03-13","2021-03-14","2021-03-15","2021-03-16","2021-03-17","2021-03-18","2021-03-19","2021-03-20","2021-03-21","2021-03-22","2021-03-23","2021-03-24","2021-03-25","2021-03-26","2021-03-27","2021-03-28","2021-03-29","2021-03-30","2021-03-31","2021-04-01","2021-04-02","2021-04-03","2021-04-04","2021-04-05","2021-04-06","2021-04-07","2021-04-08","2021-04-09","2021-04-10","2021-04-11","2021-04-12","2021-04-13","2021-04-14","2021-04-15","2021-04-16","2021-04-17","2021-04-18","2021-04-19","2021-04-20","2021-04-21","2021-04-22","2021-04-23","2021-04-24","2021-04-25","2021-04-26","2021-04-27","2021-04-28","2021-04-29","2021-04-30","2021-05-01","2021-05-02","2021-05-03","2021-05-04","2021-05-05","2021-05-06","2021-05-07","2021-05-08","2021-05-09","2021-05-10","2021-05-11","2021-05-12","2021-05-13","2021-05-14","2021-05-15","2021-05-16","2021-05-17","2021-05-18","2021-05-19","2021-05-20","2021-05-21","2021-05-22","2021-05-23","2021-05-24","2021-05-25","2021-05-26","2021-05-27","2021-05-28","2021-05-29","2021-05-30","2021-05-31","2021-06-01","2021-06-02","2021-06-03","2021-06-04","2021-06-05","2021-06-06","2021-06-07","2021-06-08","2021-06-09"))
p <- list(omega=0.00001,
 a=0.12,
 b=0.82,
 gamma=0.08,
 kappa=-0.3,
 mu=0,
 n=160,
 shock=4,
 lag=5,
 level=0.05,
 horizon=30,
 impact=0.04,
 weight=0.5,
 rho=0.3 )
n <- length(R)
stopifnot(n>=2,all(is.finite(R)),all(R>=-1))

# Browser-local source text, embedded for an independent Base R audit.
raw_A <- "date,return\n2021-06-09,0.001\n2021-06-08,0.001\n2021-06-07,0.001\n2021-06-06,0.001\n2021-06-05,0.001\n2021-06-04,0.001\n2021-06-03,0.001\n2021-06-02,0.001\n2021-06-01,0.001\n2021-05-31,0.001\n2021-05-30,0.001\n2021-05-29,0.001\n2021-05-28,0.001\n2021-05-27,0.001\n2021-05-26,0.001\n2021-05-25,0.001\n2021-05-24,0.001\n2021-05-23,0.001\n2021-05-22,0.001\n2021-05-21,0.001\n2021-05-20,0.001\n2021-05-19,0.001\n2021-05-18,0.001\n2021-05-17,0.001\n2021-05-16,0.001\n2021-05-15,0.001\n2021-05-14,0.001\n2021-05-13,0.001\n2021-05-12,0.001\n2021-05-11,0.001\n2021-05-10,0.001\n2021-05-09,0.001\n2021-05-08,0.001\n2021-05-07,0.001\n2021-05-06,0.001\n2021-05-05,0.001\n2021-05-04,0.001\n2021-05-03,0.001\n2021-05-02,0.001\n2021-05-01,0.001\n2021-04-30,0.001\n2021-04-29,0.001\n2021-04-28,0.001\n2021-04-27,0.001\n2021-04-26,0.001\n2021-04-25,0.001\n2021-04-24,0.001\n2021-04-23,0.001\n2021-04-22,0.001\n2021-04-21,0.001\n2021-04-20,0.001\n2021-04-19,0.001\n2021-04-18,0.001\n2021-04-17,0.001\n2021-04-16,0.001\n2021-04-15,0.001\n2021-04-14,0.001\n2021-04-13,0.001\n2021-04-12,0.001\n2021-04-11,0.001\n2021-04-10,0.001\n2021-04-09,0.001\n2021-04-08,0.001\n2021-04-07,0.001\n2021-04-06,0.001\n2021-04-05,0.001\n2021-04-04,0.001\n2021-04-03,0.001\n2021-04-02,0.001\n2021-04-01,0.001\n2021-03-31,0.001\n2021-03-30,0.001\n2021-03-29,0.001\n2021-03-28,0.001\n2021-03-27,0.001\n2021-03-26,0.001\n2021-03-25,0.001\n2021-03-24,0.001\n2021-03-23,0.001\n2021-03-22,0.001\n2021-03-21,0.001\n2021-03-20,0.001\n2021-03-19,0.001\n2021-03-18,0.001\n2021-03-17,0.001\n2021-03-16,0.001\n2021-03-15,0.001\n2021-03-14,0.001\n2021-03-13,0.001\n2021-03-12,0.001\n2021-03-11,0.001\n2021-03-10,0.001\n2021-03-09,0.001\n2021-03-08,0.001\n2021-03-07,0.001\n2021-03-06,0.001\n2021-03-05,0.001\n2021-03-04,0.001\n2021-03-03,0.001\n2021-03-02,0.001\n2021-03-01,0.001\n2021-02-28,0.001\n2021-02-27,0.001\n2021-02-26,0.001\n2021-02-25,0.001\n2021-02-24,0.001\n2021-02-23,0.001\n2021-02-22,0.001\n2021-02-21,0.001\n2021-02-20,0.001\n2021-02-19,0.001\n2021-02-18,0.001\n2021-02-17,0.001\n2021-02-16,0.001\n2021-02-15,0.001\n2021-02-14,0.001\n2021-02-13,0.001\n2021-02-12,0.001\n2021-02-11,0.001\n2021-02-10,0.001\n2021-02-09,0.001\n2021-02-08,0.001\n2021-02-07,0.001\n2021-02-06,0.001\n2021-02-05,0.001\n2021-02-04,0.001\n2021-02-03,0.001\n2021-02-02,0.001\n2021-02-01,0.001\n2021-01-31,0.001\n2021-01-30,0.001\n2021-01-29,0.001\n2021-01-28,0.001\n2021-01-27,0.001\n2021-01-26,0.001\n2021-01-25,0.001\n2021-01-24,0.001\n2021-01-23,0.001\n2021-01-22,0.001\n2021-01-21,0.001\n2021-01-20,0.001\n2021-01-19,0.001\n2021-01-18,0.001\n2021-01-17,0.001\n2021-01-16,0.001\n2021-01-15,0.001\n2021-01-14,0.001\n2021-01-13,0.001\n2021-01-12,0.001\n2021-01-11,0.001\n2021-01-10,0.001\n2021-01-09,0.001\n2021-01-08,0.001\n2021-01-07,0.001\n2021-01-06,0.001\n2021-01-05,0.001\n2021-01-04,0.001\n2021-01-03,0.001\n2021-01-02,0.001\n2021-01-01,0.001"
raw_B <- NULL
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
kind<-"simple";unit<-"decimal"
convert <- function(x){if(unit=="percent")x<-x/100;if(kind=="log")expm1(x)else x}
if(kind=="price") {
 stopifnot(all(levels$A>0),if("B"%in%names(levels))all(levels$B>0)else TRUE)
 raw_R<-levels$A[-1]/head(levels$A,-1)-1
 raw_B_returns<-if("B"%in%names(levels))levels$B[-1]/head(levels$B,-1)-1 else NULL
 raw_dates<-levels$date[-1]
}else{raw_R<-convert(levels$A);raw_B_returns<-if("B"%in%names(levels))convert(levels$B)else NULL;raw_dates<-levels$date}
stopifnot(length(raw_R)==length(R),max(abs(raw_R-R))<1e-12,identical(as.character(raw_dates),as.character(dates)))
# Current view uses asset A; the confirmed paired date subset is preserved.
# Use the explicit confirmed vectors R/B above to keep optimization inputs identical.


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

vpath <- function(R,p,type="garch",initial=NULL) {
  if(type=="arch")p$b<-0
  if(type!="gjr")p$gamma<-0
  if(type!="m")p$kappa<-0
  persistence<-p$a+p$b+p$gamma/2
  stopifnot(p$omega>0,p$a>=0,p$b>=0,p$a+p$gamma>=0,persistence<1)
  n<-length(R);h<-numeric(n+1);h[1]<-if(is.null(initial))p$omega/(1-persistence)else initial
  stopifnot(is.finite(h[1]),h[1]>0)
  eps<-z<-condMean<-numeric(n);ll<-0
  for(t in seq_len(n)) {
    condMean[t]<-p$mu+p$kappa*sqrt(h[t]);eps[t]<-R[t]-condMean[t];z[t]<-eps[t]/sqrt(h[t])
    ll<-ll-.5*(log(2*pi)+log(h[t])+eps[t]^2/h[t])
    h[t+1]<-p$omega+(p$a+if(eps[t]<0)p$gamma else 0)*eps[t]^2+p$b*h[t]
  }
  stopifnot(all(is.finite(h)),all(h>0))
  p<-p[c("omega","a","b","gamma","mu","kappa")]
  c(p,list(h=h,eps=eps,z=z,condMean=condMean,logLikelihood=ll,persistence=persistence,n=n))
}
vdecode <- function(t,type) {
  if(type=="arch")return(list(omega=exp(t[1]),a=plogis(t[2]),b=0,gamma=0,mu=0,kappa=0))
  if(type=="gjr") {u<-exp(t[2:4]);d<-1+sum(u);a<-2*u[1]/d
    return(list(omega=exp(t[1]),a=unname(a),b=unname(u[3]/d),gamma=unname(2*u[2]/d-a),mu=0,kappa=0))}
  p<-gdecode(t);list(omega=unname(p[1]),a=unname(p[2]),b=unname(p[3]),gamma=0,
    mu=if(type=="m")t[4]else 0,kappa=if(type=="m")t[5]else 0)
}
vfit <- function(R,type="garch",maxIter=2600) {
  n<-length(R);if(n<60)stop("At least 60 observations required")
  baseMu<-mean(R);s2<-var(R);scale<-sqrt(s2)
  if(!is.finite(scale)||scale<=1e-12*max(1,abs(baseMu)))stop("Near-constant returns")
  if(type=="garch") {
    f<-fit_garch(R);p<-list(omega=f$omega,a=f$a,b=f$b,gamma=0,kappa=0,mu=f$mu)
    q<-vpath(R,p,type,s2);k<-4
  }else{
    y<-(R-baseMu)/scale
    if(type=="arch")starts<-rbind(c(-2,-2),c(-1,0),c(0,-3)) else if(type=="gjr")
      starts<-rbind(c(-3,log(2),log(4),log(40)),c(-1,-1,-1,1),c(-2,0,0,2),c(-1,1,0,1)) else {
      original<-rbind(c(.05,.08,.87),c(.1,.15,.75),c(.5,.1,.4),c(.9,.05,.05))
      starts<-do.call(rbind,lapply(seq_len(4),function(i){p<-original[i,];t<-c(log(p[1]),log(p[2]/(1-p[2]-p[3])),log(p[3]/(1-p[2]-p[3])))
        rbind(c(t,0,0),c(t,-.1,.2),c(t,.1,-.2))}))
    }
    fn<-function(t){if(any(!is.finite(t))||any(abs(t)>20))return(1e100)
      tryCatch(-vpath(y,vdecode(t,type),type,1)$logLikelihood,error=function(e)1e100)}
    attempts<-lapply(seq_len(nrow(starts)),function(i){v<-gsimplex(fn,starts[i,],maxIter)
      local<-v$converged&&all(sapply(seq_along(v$par),function(j)all(sapply(c(-1,1),function(sign){
        t<-v$par;t[j]<-t[j]+sign*1e-4;fn(t)>=v$value-1e-6}))))
      v$accepted<-v$converged&&v$value<1e99&&local;v})
    valid<-Filter(function(x)x$accepted,attempts)
    if(!length(valid))stop("Optimization failed; no parameter fallback")
    best<-valid[[which.min(sapply(valid,function(x)x$value))]]
    p<-vdecode(best$par,type);p$omega<-p$omega*s2;p$mu<-baseMu+p$mu*scale
    q<-vpath(R,p,type,s2);k<-if(type=="arch")3 else 5
    q$theta<-best$par;q$attempts<-attempts
  }
  q$converged<-TRUE;q$parameters<-k;q$aic<- -2*q$logLikelihood+2*k
  q$bic<- -2*q$logLikelihood+log(n)*k;q
}
varch <- function(e,lag) {
  n<-length(e);stopifnot(lag>=1,lag<=20,lag==floor(lag),n-lag>lag+2)
  scale<-mean(e^2);if(scale<=1e-24)stop("Degenerate residual variance")
  q<-e^2/scale;ids<-seq.int(lag+1,n);y<-q[ids]
  X<-cbind(1,sapply(seq_len(lag),function(j)q[ids-j]))
  if(qr(X,tol=1e-10)$rank<ncol(X)||sum((y-mean(y))^2)<1e-16*length(y))stop("Auxiliary regression rank deficient")
  fit<-lm.fit(X,y);r2<-max(0,min(1,1-sum(fit$residuals^2)/sum((y-mean(y))^2)))
  stat<-length(y)*r2;c(stat=stat,p=pchisq(stat,lag,lower.tail=FALSE),df=lag,n=length(y),r2=r2)
}
vljung <- function(e,lag) {
  stopifnot(length(e)>lag+2,lag>=1)
  if(sum((e-mean(e))^2)<1e-24)stop("Degenerate series")
  t<-Box.test(e,lag=lag,type="Ljung-Box",fitdf=0)
  c(stat=unname(t$statistic),p=t$p.value,df=lag,n=length(e))
}
vforecast <- function(q,H) {
  stopifnot(H>=1,H<=100,H==floor(H))
  long<-q$omega/(1-q$persistence)
  h<-numeric(H);h[1]<-tail(q$h,1)
  if(H>1)for(k in 2:H)h[k]<-q$omega+q$persistence*h[k-1]
  list(h=h,sigma=sqrt(h),long=long)
}
vccc <- function(A,B,p,mode="estimate",rhoMode="estimated") {
  stopifnot(length(A)==length(B))
  qa<-if(mode=="estimate")vfit(A)else vpath(A,p)
  qb<-if(mode=="estimate")vfit(B)else vpath(B,p)
  estimatedRho<-cor(qa$z,qb$z);rho<-if(rhoMode=="manual")p$rho else estimatedRho
  stopifnot(is.finite(rho),abs(rho)<1)
  covariance<-rho*sqrt(qa$h*qb$h)
  determinant<-qa$h*qb$h-covariance^2
  hp<-p$weight^2*qa$h+(1-p$weight)^2*qb$h+2*p$weight*(1-p$weight)*covariance
  stopifnot(all(determinant>0),all(hp>=0))
  list(a=qa,b=qb,rho=rho,estimatedRho=estimatedRho,covariance=covariance,hp=hp,det=determinant)
}


model <- "garch"
mode <- "estimate"
q <- tryCatch(if(mode=="estimate")vfit(R,model)else vpath(R,p,model),error=function(e)list(error=conditionMessage(e)))
if(!is.null(q$error))message(q$error)else {
 print(unlist(q[c("omega","a","b","gamma","mu","kappa","logLikelihood","parameters","aic","bic")]))
 print(c(n=length(R),converged=if(mode=="estimate")q$converged else NA,current_SD=sqrt(q$h[n]),next_SD=sqrt(tail(q$h,1))))
 if(mode=="estimate"&&(q$persistence>.9999||q$a<1e-5||q$b<1e-5))message("Near parameter boundary: numerical convergence does not prove reliable identification")
 print(tail(data.frame(h=q$h,sigma=sqrt(q$h),actual=c(R,NA_real_)),6))
}

if(is.null(q$error)) {
 diagnostics <- list(z=tryCatch(vljung(q$z,p$lag),error=function(e)conditionMessage(e)),
 z2=tryCatch(vljung(q$z^2,p$lag),error=function(e)conditionMessage(e)),
 arch=tryCatch(varch(q$z,p$lag),error=function(e)conditionMessage(e)))
 print(diagnostics)
 forecast <- vforecast(q,p$horizon)
 print(data.frame(k=seq_len(p$horizon),variance=forecast$h,sd=sqrt(forecast$h)))
}

comparison <- lapply(c("arch","garch","gjr"),function(type){
 tryCatch({f<-vfit(R,type);c(LL=f$logLikelihood,k=f$parameters,AIC=f$aic,BIC=f$bic)},error=function(e)conditionMessage(e))})
names(comparison)<-c("ARCH","GARCH","GJR");print(comparison)

if(is.null(q$error)) {
 y <- forecast$sigma*100
 plot(seq_along(y),y,type="l",xlab="Forecast horizon k",ylab="Conditional / forecast SD (%)")
 abline(h=sqrt(forecast$long)*100,lty=3)
}
cat("CHECK",paste(format(numeric(0),digits=17,scientific=TRUE),collapse=","),"\n")