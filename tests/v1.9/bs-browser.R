# 欧式、无分红；每股元；T以年计；r连续复利
S <- 100
K <- 100
T <- 1
r <- 0.05
sigma <- 0.2
bs <- function(S,K,T,r,sigma) {
  D <- K * exp(-r*T)
  if (T == 0 || sigma == 0) {
    C <- max(S-D,0); P <- max(D-S,0)
    dc <- if (T==0 || S==D) NA_real_ else as.numeric(S>D)
    ok <- !is.na(dc)
    return(c(C=C,P=P,d1=NA,d2=NA,deltaC=dc,
      deltaP=dc-1,gamma=if(ok) 0 else NA,vega=if(ok) 0 else NA,
      thetaC=if(ok) -r*D*dc/365 else NA,
      thetaP=if(ok) r*D*(1-dc)/365 else NA))
  }
  d1 <- (log(S/K)+(r+sigma^2/2)*T)/(sigma*sqrt(T))
  d2 <- d1-sigma*sqrt(T)
  C <- S*pnorm(d1)-D*pnorm(d2)
  P <- D*pnorm(-d2)-S*pnorm(-d1)
  base <- -S*dnorm(d1)*sigma/(2*sqrt(T))
  c(C=C,P=P,d1=d1,d2=d2,deltaC=pnorm(d1),
    deltaP=pnorm(d1)-1,
    gamma=dnorm(d1)/(S*sigma*sqrt(T)),
    vega=S*dnorm(d1)*sqrt(T)/100,
    thetaC=(base-r*D*pnorm(d2))/365,
    thetaP=(base+r*D*pnorm(-d2))/365)
}
result <- bs(S,K,T,r,sigma)
print(result)
spot <- seq(max(0.01,S*0.4), S*1.6, length.out=121)
prices <- vapply(spot, function(s) bs(s,K,T,r,sigma)[c("C","P")], numeric(2))
matplot(spot,t(prices),type="l",lty=1,col=c("steelblue","darkseagreen4"),
  xlab="Spot S",ylab="Option price")
abline(v=S,lty=2)
legend("topleft",c("Call","Put"),col=c("steelblue","darkseagreen4"),lty=1)