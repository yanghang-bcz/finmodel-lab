pdf('tests/bs-round1/case-18.R.pdf')
# 欧式期权；连续复利；q为连续股息收益率
# 基础R，无需额外包；价格单位：元/股
S <- 130
K <- 100
T <- 1
r <- 0.05
sigma <- 0
q <- 0.02
bs <- function(S,K,T,r,sigma,q=0) {
  x <- c(S,K,T,r,sigma,q)
  if (length(x)!=6 || any(!is.finite(x)) ||
      any(x < c(.01,.01,0,-.1,0,0)) ||
      any(x > c(1e5,1e5,10,.3,2,1)))
    stop("Invalid BS input")
  E <- exp(-q*T)
  A <- S*E; D <- K*exp(-r*T)
  if (T==0 || sigma==0) {
    dc <- if (T==0 || A==D) NA_real_ else as.numeric(A>D)
    ok <- !is.na(dc)
    return(c(C=max(A-D,0),P=max(D-A,0),d1=NA,d2=NA,
      deltaC=E*dc,deltaP=E*(dc-1),
      gamma=if(ok) 0 else NA,vega=if(ok) 0 else NA,
      thetaC=if(ok) dc*(q*A-r*D)/365 else NA,
      thetaP=if(ok) (1-dc)*(r*D-q*A)/365 else NA))
  }
  E <- exp(-q*T)
  A <- S*E
  D <- K*exp(-r*T)
  d1 <- (log(S/K)+(r-q+sigma^2/2)*T)/
    (sigma*sqrt(T))
  d2 <- d1-sigma*sqrt(T)
  N1 <- pnorm(d1)
  N2 <- pnorm(d2)
  C <- max(0,A-D,A*N1-D*N2)
  P <- max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))
  deltaC <- E*N1
  deltaP <- -E*pnorm(-d1)
  gamma <- E*dnorm(d1)/(S*sigma*sqrt(T))
  vega <- A*dnorm(d1)*sqrt(T)/100
  base <- -A*dnorm(d1)*sigma/(2*sqrt(T))
  thetaC <- (base-r*D*N2+q*A*N1)/365
  thetaP <- (base+r*D*pnorm(-d2)-q*A*pnorm(-d1))/365
  result <- c(C=C,P=P,d1=d1,d2=d2,
    deltaC=deltaC,deltaP=deltaP,gamma=gamma,vega=vega,
    thetaC=thetaC,thetaP=thetaP)
  return(result)
}
result <- bs(S,K,T,r,sigma,q)
print(result)
spot <- seq(max(.01,min(S,K)*.4),
  min(100000,max(S,K)*1.6),length.out=121)
prices <- vapply(spot,function(s)
  bs(s,K,T,r,sigma,q)[c("C","P")],numeric(2))
matplot(spot,t(prices),type="l",lty=1,
  xlab="Spot S",ylab="Option price")
abline(v=c(S,K),lty=c(2,4))
cat('CHECK',paste(sprintf('%.17g',result),collapse=' '),'\n')
stopifnot(inherits(try(bs(0,K,T,r,sigma,q),silent=TRUE),'try-error'))
stopifnot(inherits(try(bs(S,K,T,r,sigma,-.01),silent=TRUE),'try-error'))
dev.off()
