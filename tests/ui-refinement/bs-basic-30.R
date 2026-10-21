pdf('tests/ui-refinement/bs-basic-30.R.pdf')
# 欧式期权；连续复利；q为连续股息收益率
# 基础R，无需额外包；价格单位：元/股
S <- 100
K <- 100
T <- 10
r <- 0.05
sigma <- 2
q <- 0
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
print(result)
spot <- seq(max(.01,min(S,K)*.4),
  min(100000,max(S,K)*1.6),length.out=121)
u <- (log(spot/K)+(r-q+sigma^2/2)*T)/(sigma*sqrt(T))
v <- u-sigma*sqrt(T)
call <- pmax(0,spot*E-D,spot*E*pnorm(u)-D*pnorm(v))
put <- pmax(0,D-spot*E,D*pnorm(-v)-spot*E*pnorm(-u))
matplot(spot,cbind(call,put),type="l",lty=1,
  xlab="Spot S",ylab="Option price")
abline(v=c(S,K),lty=c(2,4))
cat('CHECK',paste(sprintf('%.17g',result),collapse=' '),'\n')
dev.off()
