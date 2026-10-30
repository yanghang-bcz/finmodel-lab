(function(root){const s=String.raw`
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
`;if(typeof module==='object')module.exports=s;else root.VolR=s;})(this);
