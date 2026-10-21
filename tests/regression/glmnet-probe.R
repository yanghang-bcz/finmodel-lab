.libPaths(c('tests/regression/r-library',.libPaths()))
source('tests/regression/first.R')
sy<-sqrt(mean((ytr-mean(ytr))^2));Z<-rscale(Xtr)$Z
for(type in c('ridge','lasso')){l<-.001;q<-rfit(Xtr,ytr,l,type);g<-glmnet::glmnet(Z,(ytr-mean(ytr))/sy,alpha=if(type=='ridge')0 else 1,lambda=if(type=='ridge')l else l/sy,standardize=FALSE,intercept=FALSE,thresh=1e-15,maxit=100000);print(c(type,max(abs(as.vector(coef(g))[-1]*sy-q$standardCoef))));}
