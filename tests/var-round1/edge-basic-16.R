# 合成教学数据，非真实市场；单期简单收益，小数
alpha <- 0.95
N <- 1000000
n <- 250
mu_gen <- 0
scale_gen <- 0.01
i <- seq_len(n)
R <- mu_gen + scale_gen * (((i*73) %% 251 - 125)/72 -
  ifelse(i %% 37 == 0, 4, 0))
stopifnot(n>=2, all(is.finite(R)), all(R>=-1),
  is.finite(alpha), alpha>0, alpha<1, is.finite(N), N>0)

L <- -N * R
x <- sort(L)

hVaR <- unname(quantile(L,alpha,type=1))
j <- seq_len(n)
tail_mass <- pmax(0,pmin(j/n-alpha,1/n))
hES <- sum(x*tail_mass)/(1-alpha)

m <- mean(L)
s <- sd(L)
z <- qnorm(alpha)
nVaR <- m+s*z
nES <- m+s*dnorm(z)/(1-alpha)

print(c(hVaR=hVaR,hES=hES,nVaR=nVaR,nES=nES))

loss_wan <- L/10000
span <- range(c(loss_wan,hVaR/10000,hES/10000,nVaR/10000,nES/10000))
if (diff(span)<1e-8*max(1,abs(span))) {
  span <- mean(span)+c(-.5,.5)*max(1,abs(mean(span))*.05)
}
breaks <- seq(span[1]-.08*diff(span),span[2]+.08*diff(span),length.out=26)
hist(loss_wan,breaks=breaks,probability=TRUE,right=FALSE,
  main="Synthetic one-period loss",xlab="One-period loss (10,000 yuan)",
  ylab="Density (per 10,000 yuan)")
if(s>0) curve(dnorm(x,m/10000,s/10000),add=TRUE,col="thistle4")
values <- c(hVaR,hES,nVaR,nES)
cols <- c("seagreen4","seagreen4","thistle4","thistle4")
# VaR: threshold line; ES: diamond denotes tail mean, not a quantile
abline(v=values[seq(1,length(values),by=2)]/10000,col=cols[seq(1,length(values),by=2)])
points(values[seq(2,length(values),by=2)]/10000,
  rep(0,length(values)/2),pch=18,col=cols[seq(2,length(values),by=2)])
cat("\nCHECK:",paste(format(c(hVaR,hES,nVaR,nES,R,L),digits=17,scientific=TRUE),collapse=","))
