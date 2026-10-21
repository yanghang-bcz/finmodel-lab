# 合成教学数据，非真实市场；单日简单收益，小数
alpha <- 0.99
N <- 1000000
n <- 250
mu_gen <- 0.0004
scale_gen <- 0.01
i <- seq_len(n)
R <- mu_gen + scale_gen * (((i*73) %% 251 - 125)/72 -
  ifelse(i %% 37 == 0, 4, 0))
stopifnot(n>=2, all(is.finite(R)), all(R>=-1),
  is.finite(alpha), alpha>0, alpha<1, is.finite(N), N>0)

L <- -N * R
x <- sort(L)

lambda <- 0.98
k <- 30
stopifnot(is.finite(lambda),lambda>0,lambda<1,k>=2,k<n,k==floor(k))
mu_train <- mean(R[seq_len(k)])
h0 <- var(R[seq_len(k)])
h <- rep(NA_real_,n+1)
h[k+1] <- h0

# R索引t即第t日；前k日无预测，先存h[t]再观察R[t]
for(t in seq.int(k+1,n)) {
  epsilon_t <- R[t]-mu_train
  h[t+1] <- lambda*h[t]+(1-lambda)*epsilon_t^2
}
sigma_pred <- sqrt(h)

z <- qnorm(alpha)
VaR <- N*(-mu_train+sigma_pred*z)

ES <- N*(-mu_train+sigma_pred*dnorm(z)/(1-alpha))

result <- data.frame(day=seq_len(n+1),variance=h,
  sigma=sigma_pred,VaR=VaR,ES=ES,actual_loss=c(L,NA_real_))
print(tail(result,6))
print(c(mu_train=mu_train,h0=h0,latest_VaR=tail(VaR,1),
  latest_ES=tail(ES,1),latest_sigma=tail(sigma_pred,1)))

pred <- VaR
plot(seq_len(n),L/10000,type="l",col="grey60",
  xlim=c(1,n+1),ylim=range(c(L,pred),na.rm=TRUE)/10000,
  xlab="Sample trading day",ylab="One-day loss (10,000 yuan)",
  main="EWMA: actual loss and ex-ante VaR")
lines(seq_len(n+1),pred/10000,col="steelblue",lwd=2)
abline(v=k+.5,lty=3)
legend("topleft",c("Actual loss","Ex-ante VaR"),
  col=c("grey60","steelblue"),lty=1,bty="n")
cat("\nCHECK:",paste(format(c(mu_train,h0,h,sigma_pred,VaR,ES,L),digits=17,scientific=TRUE),collapse=","))
