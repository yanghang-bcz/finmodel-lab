# 合成教学数据，非真实市场行情; source is not independently verified
# Simple returns, decimal; one observation period, no automatic annualization.
R <- c(0.007412163339544217,
 -0.010482472146455321,
 0.008230851250901908,
 -0.0017544755294552758,
 -0.0051058979531225955,
 0.008836480819329084,
 -0.008069460912111217,
 0.003083159580684499,
 0.003283682466898781,
 -0.0075217265370117,
 0.007909726145666481,
 -0.004167708599150859,
 -0.001731318295021438,
 0.006388502107881307,
 -0.007733818897379609,
 0.005089088457663708,
 0.00031660889609970736,
 -0.005315970047409268,
 0.00749574337347355,
 -0.005864481814017135,
 0.0010212681270710146,
 0.004225548099663988,
 -0.007152192498396882,
 0.006481401262769117,
 -0.0022927510716643797,
 -0.003077880045171515,
 0.006674051240871524,
 -0.006920236601272181,
 0.003478987279705359,
 0.0018642368677680944,
 -0.006046998470411728,
 0.007165424552913003,
 -0.004548237896337581,
 -0.0005982444754874664,
 0.005268568505368928,
 -0.0072090948011840576,
 0.00546696573361081,
 -0.0006908037577509802,
 -0.004345435689627863,
 0.007050835956111483,
 0.03447608466288317,
 0.003301594174389433,
 0.005282395452769607,
 -0.010268848468377317,
 0.009932058247289648,
 -0.00450652991046329,
 -0.0029171279251399575,
 0.00814258032089669,
 -0.009079130905087508,
 0.00535382966147253,
 0.0010856325837020175,
 -0.006471637120770416,
 0.008378022193971628,
 -0.006010646691100449,
 0.00043942435901772196,
 0.0050603356148808554,
 -0.007762114248084521,
 0.006538947033129491,
 -0.0017889718539344764,
 -0.003762778766087461,
 0.007151322725917699,
 -0.00694076815747988,
 0.0030169107917315924,
 0.0024909111907596574,
 -0.006481107440425808,
 0.00719563687306754,
 -0.004127918570701305,
 -0.001206536196759826,
 0.005710719252532805,
 -0.007282237362592627,
 0.005102369570066203,
 -0.00009201976673746681,
 -0.004820937562954273,
 0.007186938964516124,
 -0.005913595604836681,
 0.0013824950407694218,
 0.0038094046683057768,
 -0.006904983937354061,
 0.006537770362466678,
 -0.0026289643002737288,
 -0.0026870279154288437,
 0.006438836835791205,
 -0.0069584014600299815,
 0.0037899877142431597,
 0.001475860979018049,
 -0.005796203922550201,
 0.007167389088249899,
 -0.0048249492290639425,
 -0.00020761066526904783,
 0.004988840263940824,
 -0.00716415273385324,
 0.005698646944657227,
 -0.0010782225839002417,
 -0.004032457300768834,
 0.00695390699982955,
 -0.006384106010432133,
 0.002337111711267952,
 0.002947548984118106,
 -0.006545864314732809,
 0.0068636946258373915,
 -0.0035231003641641658,
 -0.0017605931320347054,
 0.005951910846052656,
 -0.007128814405876396,
 0.0045926862609542264,
 0.000504867390092475,
 -0.005186088366495874,
 0.007178588130551282,
 -0.005508278686513892,
 0.0007798297945881697,
 0.00426499247500632,
 -0.007018039630858435,
 0.006240634280592247,
 -0.002048899445570233,
 -0.0032089442959864346,
 0.006656264321395065,
 -0.006769968710286935,
 0.003255925222913361,
 0.002043503676083573,
 -0.006105031251482009,
 0.007085774357063123,
 -0.004356305158781572,
 -0.0008006495539184436,
 0.005378136373773408,
 -0.007185631115096498,
 0.00531073881367242,
 -0.00048107655046283687,
 -0.004491651167385186,
 0.007073438798904378,
 -0.006087873333875894,
 0.0017578843783596738,
 0.0034649842949054047,
 -0.006757546217537926,
 0.006665699310064337,
 -0.0029834293192308073,
 -0.002322395839639031,
 0.006249223990400947,
 -0.007031636311538517,
 0.004112342018804895,
 0.0010943380582277922,
 -0.005561828929687306,
 0.007181536794691487,
 -0.005103807890430455,
 0.00018209779661739053,
 0.004710847441912495,
 -0.007118008987129756,
 0.005924452026342761,
 -0.0014641384521021266,
 -0.0037147929162654335,
 0.006848527625572845,
 -0.006550040666037566,
 0.0027057333940398776,
 0.0025966644742340776,
 -0.006383791460054556,
 0.006965858273499633,
 -0.003860954682430563,
 -0.001385394526064658,
 0.005736703957409584,
 -0.007165930834337918,
 0.004887636082955434)
B <- NULL
dates <- seq_along(R)
p <- list(omega=0.00001,
 a=0.12,
 b=0.82,
 gamma=0.06,
 kappa=0.2,
 mu=0,
 n=160,
 shock=4,
 lag=5,
 level=0.05,
 horizon=20,
 impact=0.03,
 weight=0.5,
 rho=0.3 )
n <- length(R)
stopifnot(n>=2,all(is.finite(R)),all(R>=-1))


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


model <- "gjr"
mode <- "teaching"
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

if(is.null(q$error)){
 base_h <- tail(q$h,1)
 positive <- q$omega+q$a*p$impact^2+q$b*base_h
 negative <- q$omega+(q$a+q$gamma)*p$impact^2+q$b*base_h
 print(c(positive_variance=positive,negative_variance=negative))
}

if(is.null(q$error)) {
 shock_grid<-seq(-max(.01,p$impact*1.5),max(.01,p$impact*1.5),length.out=121)
 next_h<-q$omega+(q$a+ifelse(shock_grid<0,q$gamma,0))*shock_grid^2+q$b*tail(q$h,1)
 plot(shock_grid*100,sqrt(next_h)*100,type="l",xlab="Hypothetical residual shock (%)",ylab="Next-period conditional SD (%)")
 points(c(-p$impact,p$impact)*100,sqrt(c(negative,positive))*100,pch=19)
}
cat("CHECK",paste(format(c(c(q$omega,q$a,q$b,q$gamma,q$mu,q$kappa,q$logLikelihood,q$h,q$eps,q$z,q$condMean,forecast$h,forecast$sigma),diagnostics$z[c(1,2)],diagnostics$z2[c(1,2)],diagnostics$arch[c(1,2)]),digits=17,scientific=TRUE),collapse=","),"\n")