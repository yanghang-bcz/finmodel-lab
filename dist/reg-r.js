(function(root,f){const a=f();if(typeof module==='object')module.exports=a;else root.RegR=a;})(this,()=>String.raw`
# Base R implementation. No package installation or network access.
rscale <- function(X){m<-colMeans(X);s<-sqrt(colMeans(sweep(X,2,m)^2));Z<-sweep(X,2,m);for(j in seq_len(ncol(X)))Z[,j]<-if(s[j]>1e-14)Z[,j]/s[j] else 0;list(m=m,s=s,Z=Z)}
rfit <- function(X,y,lambda,type,tol=1e-9,maxit=20000){
 n<-length(y);p<-ncol(X);st<-rscale(X);Z<-st$Z;my<-mean(y);yc<-y-my;b<-rep(0,p);G<-crossprod(Z)/n;iter<-0;kkt<-0
 if(type=="ridge"){
  if(lambda==0){if(qr(cbind(1,X),tol=1e-10)$rank<p+1)stop("lambda=0 rank deficient");b<-coef(lm(y~X))[-1]*st$s;edf<-p+1
  }else{active<-which(st$s>1e-14);if(length(active)){inv<-solve(G[active,active,drop=FALSE]+diag(lambda,length(active)));b[active]<-as.vector(inv%*%crossprod(Z[,active,drop=FALSE],yc)/n);edf<-1+sum(diag(inv%*%G[active,active,drop=FALSE]))}else edf<-1};iter<-1
 }else{
  if(lambda==0&&qr(cbind(1,X),tol=1e-10)$rank<p+1)stop("lambda=0 rank deficient")
  r<-yc;converged<-FALSE
  for(iter in seq_len(maxit)){
   change<-0
   for(j in seq_len(p)){if(st$s[j]<=1e-14)next;old<-b[j];v<-sum(Z[,j]*r)/n+G[j,j]*old;b[j]<-sign(v)*max(0,abs(v)-lambda)/G[j,j];delta<-b[j]-old;change<-max(change,abs(delta));r<-r-delta*Z[,j]}
   grad<-as.vector(crossprod(Z,r)/n);kkt<-max(ifelse(st$s<=1e-14,0,ifelse(b==0,pmax(0,abs(grad)-lambda),abs(grad-lambda*sign(b)))))
   if(change<=tol&&kkt<=5*tol){converged<-TRUE;break}
  }
  if(!converged)stop("Lasso did not converge / KKT failed; no valid result")
  edf<-1+sum(abs(b)>1e-10)
 }
 slopes<-ifelse(st$s>1e-14,b/st$s,0);co<-c(my-sum(slopes*st$m),slopes);pred<-as.vector(cbind(1,X)%*%co);r<-y-pred
 if(type=="ridge")kkt<-max(abs(as.vector(crossprod(Z,yc-Z%*%b)/n)-lambda*b))
 list(coef=co,standardCoef=b,mean=st$m,scale=st$s,lambda=lambda,type=type,iter=iter,kkt=kkt,edf=edf,nonzero=sum(abs(b)>1e-10),fitted=pred,residual=r,rss=sum(r^2),objective=sum(r^2)/(2*n)+lambda*if(type=="ridge")sum(b^2)/2 else sum(abs(b)))
}
rpredict <- function(q,X)as.vector(cbind(1,X)%*%q$coef)
rmetric <- function(y,p)c(RMSE=sqrt(mean((y-p)^2)),MAE=mean(abs(y-p)))
rcv <- function(X,y,lambdas,type,tol,maxit){
 n<-length(y);first<-floor(n*.5);width<-floor((n-first)/3)
 ranges<-lapply(0:2,function(i)c(train=first+i*width,start=first+i*width+1,end=if(i==2)n else first+(i+1)*width))
 loss<-sapply(lambdas,function(lambda){err<-c();for(f in ranges){a<-seq_len(f['train']);b<-seq.int(f['start'],f['end']);q<-rfit(X[a,,drop=FALSE],y[a],lambda,type,tol,maxit);err<-c(err,y[b]-rpredict(q,X[b,,drop=FALSE]))};sqrt(mean(err^2))})
 best<-1;for(i in seq_along(loss))if(loss[i]<loss[best]-1e-12||(abs(loss[i]-loss[best])<=1e-12&&lambdas[i]>lambdas[best]))best<-i
 list(lambda=lambdas[best],loss=loss,best=best,ranges=ranges)
}
# Deterministic extractAIC-compatible selection, candidate ties ordered by source column.
rstep <- function(X,y,direction){
 p<-ncol(X);n<-length(y);df<-data.frame(y=y,X);names(df)<-c('y',paste0('x',seq_len(p)))
 fitids<-function(ids){f<-lm(reformulate(if(length(ids))paste0('x',ids) else '1',response='y'),data=df,tol=1e-10);list(fit=f,aic=extractAIC(f)[2])}
 ids<-if(direction=='forward')integer(0)else seq_len(p);q<-fitids(ids)
 full<-fitids(seq_len(p))$fit;if(full$rank<p+1||df.residual(full)<2||sum(resid(full)^2)<=1e-24)stop('Stepwise needs full rank and residual degrees of freedom')
 path<-list(list(ids=ids,aic=q$aic,operation='initial'));rounds<-list()
 for(it in 1:100){cand<-list();if(direction!='forward')for(j in ids){v<-setdiff(ids,j);z<-fitids(v);cand[[length(cand)+1]]<-list(ids=v,aic=z$aic,variable=j,action='drop',q=z)}
 if(direction!='backward')for(j in setdiff(seq_len(p),ids)){v<-sort(c(ids,j));z<-fitids(v);cand[[length(cand)+1]]<-list(ids=v,aic=z$aic,variable=j,action='add',q=z)}
 if(!length(cand))break
 ord<-order(vapply(cand,function(x)x$aic,0.),vapply(cand,function(x)x$variable,0L),vapply(cand,function(x)x$action,''));best<-cand[[ord[1]]];accepted<-best$aic<q$aic-1e-7
 rounds[[length(rounds)+1]]<-list(ids=ids,aic=q$aic,candidates=cand,accepted=accepted)
 if(!accepted)break
 ids<-best$ids;q<-best$q;path[[length(path)+1]]<-list(ids=ids,aic=q$aic,operation=paste(best$action,best$variable))
 }
 # Also run the standard R step() against the identical candidate scope.
 initial<-fitids(if(direction=='forward')integer(0)else seq_len(p))$fit
 reference<-stats::step(initial,scope=list(lower=y~1,upper=reformulate(paste0('x',seq_len(p)),response='y')),direction=direction,trace=0)
 list(ids=ids,fit=q$fit,path=path,rounds=rounds,reference=reference)
}
`);
