X<-matrix(c(1,2,3,2,4,1,3,4,2),nrow=3,byrow=TRUE)
y<-c(1,2,3)
f<-lm(y~X,tol=1e-10)
cat("EDGE",paste(format(c(f$rank,fitted(f),resid(f)),digits=17),collapse=","),"\n")