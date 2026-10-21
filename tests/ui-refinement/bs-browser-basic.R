# 欧式无分红；T>0且sigma>0
# 边界参数请使用完整代码
S <- 100
K <- 100
T <- 1
r <- 0.05
sigma <- 0.2
D <- K * exp(-r * T)
d1 <- (log(S / K) +
  (r + sigma^2 / 2) * T) /
  (sigma * sqrt(T))
d2 <- d1 - sigma * sqrt(T)
C <- S * pnorm(d1) - D * pnorm(d2)
P <- D * pnorm(-d2) - S * pnorm(-d1)
deltaC <- pnorm(d1)
deltaP <- pnorm(d1) - 1
gamma <- dnorm(d1) /
  (S * sigma * sqrt(T))
vega <- S * dnorm(d1) * sqrt(T) / 100
base <- -S * dnorm(d1) * sigma /
  (2 * sqrt(T))
thetaC <- (base - r * D * pnorm(d2)) /
  365
thetaP <- (base + r * D * pnorm(-
  d2)) / 365
result <- c(C=C, P=P, d1=d1, d2=d2,
  deltaC=deltaC, deltaP=deltaP,
  gamma=gamma, vega=vega,
  thetaC=thetaC, thetaP=thetaP)
print(result)
spot <- seq(max(0.01,min(S,K)*0.4),
  min(100000,max(S,K)*1.6),
  length.out=121)
u <- (log(spot/K)+(r+sigma^2/2)*T) /
  (sigma*sqrt(T))
v <- u-sigma*sqrt(T)
call <- spot*pnorm(u)-D*pnorm(v)
put <- D*pnorm(-v)-spot*pnorm(-u)
matplot(spot,cbind(call,put),type="l",
  lty=1,xlab="Spot",ylab="Option price")
abline(v=c(S,K),lty=c(2,4))