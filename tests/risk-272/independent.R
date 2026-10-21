
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

R<-c(-0.006822222222222222,0.003316666666666667,0.013455555555555556,-0.011266666666666668,-0.001127777777777778,0.00901111111111111,-0.01571111111111111,-0.005572222222222222,0.004566666666666667,0.014705555555555555,-0.010016666666666669,0.00012222222222222224,0.010261111111111111,-0.014461111111111112,-0.004322222222222222,0.005816666666666666,0.015955555555555556,-0.008766666666666667,0.0013722222222222224,0.01151111111111111,-0.013211111111111113,-0.003072222222222222,0.007066666666666666,0.017205555555555557,-0.007516666666666665,0.0026222222222222224,0.012761111111111112,-0.011961111111111113,-0.0018222222222222223,0.008316666666666665,-0.016405555555555555,-0.006266666666666666,0.003872222222222222,0.014011111111111111,-0.010711111111111112,-0.0005722222222222222,-0.030433333333333333,-0.015155555555555558,-0.005016666666666666,0.0051222222222222225,0.01526111111111111,-0.009461111111111113,0.0006777777777777778,0.010816666666666667,-0.013905555555555556,-0.0037666666666666664,0.006372222222222223,0.016511111111111112,-0.008211111111111112,0.0019277777777777778,0.012066666666666667,-0.012655555555555557,-0.0025166666666666666,0.007622222222222222,0.017761111111111113,-0.0069611111111111115,0.003177777777777778,0.013316666666666668,-0.011405555555555556,-0.0012666666666666666,0.008872222222222222,-0.01585,-0.005711111111111111,0.004427777777777778,0.014566666666666667,-0.010155555555555557,-0.00001666666666666662,0.010122222222222222,-0.0146,-0.004461111111111111,0.005677777777777778,0.015816666666666666,-0.008905555555555557,-0.03876666666666667,0.011372222222222223,-0.01335,-0.0032111111111111108,0.006927777777777778,0.017066666666666667,-0.007655555555555555,0.0024833333333333335,0.012622222222222222,-0.012100000000000001,-0.001961111111111111,0.008177777777777779,-0.016544444444444445,-0.006405555555555556,0.0037333333333333333,0.013872222222222223,-0.01085,-0.0007111111111111111,0.009427777777777778,-0.015294444444444446,-0.005155555555555556,0.0049833333333333335,0.015122222222222223,-0.009600000000000001,0.0005388888888888889,0.010677777777777776,-0.014044444444444444,-0.0039055555555555553,0.006233333333333334,0.016372222222222226,-0.008350000000000002,0.001788888888888889,0.011927777777777777,-0.012794444444444445,-0.0026555555555555555,0.007483333333333334,0.017622222222222223,-0.0471,0.003038888888888889,0.013177777777777776,-0.011544444444444446,-0.0014055555555555555,0.008733333333333333,-0.01598888888888889,-0.00585,0.004288888888888889,0.014427777777777777,-0.010294444444444445,-0.00015555555555555554,0.009983333333333334,-0.01473888888888889,-0.0046,0.005538888888888888,0.015677777777777777,-0.009044444444444445,0.0010944444444444445,0.011233333333333331,-0.013488888888888889,-0.0033499999999999997,0.006788888888888889,0.016927777777777778,-0.007794444444444445,0.0023444444444444446,0.012483333333333332,-0.01223888888888889,-0.0021,0.008038888888888889,-0.01668333333333333,-0.006544444444444444,0.0035944444444444444,0.013733333333333332,-0.01098888888888889,-0.0008500000000000001,0.009288888888888888,-0.055433333333333334,-0.0052944444444444445,0.004844444444444445);fit<-fit_garch(R);eps<-(R-fit$mu)/fit$scale;fn<-function(t)garch_objective(eps,t);ref<-optim(fit$theta,fn,method="Nelder-Mead",control=list(maxit=5000,reltol=1e-12));stopifnot(ref$convergence==0,fn(fit$theta)-ref$value<1e-5);cat("independent objective confirmed\n")