# 合成情景，1个交易日，基础R，无需额外包
n <- 250
alpha <- 0.95
N <- 1000000
mu <- 0.0004
scale <- 0.01
i <- seq_len(n)
R <- mu + scale * (((i * 73) %% 251 - 125) / 72 -
  ifelse(i %% 37 == 0, 4, 0))
L <- -N * R
x <- sort(L)
hVaR <- unname(quantile(L, alpha, type = 1))
j <- seq_len(n)
tail_mass <- pmax(0, pmin(j / n - alpha, 1 / n))
hES <- sum(x * tail_mass) / (1 - alpha)
m <- mean(L)
s <- sd(L)
z <- qnorm(alpha)
nVaR <- m + s * z
nES <- m + s * dnorm(z) / (1 - alpha)
print(c(Historical_VaR=hVaR, Historical_ES=hES,
  Normal_VaR=nVaR, Normal_ES=nES))
hist(L, breaks=25, probability=TRUE, main="Synthetic 1-day loss", xlab="Loss")
curve(dnorm(x,m,s), add=TRUE, col="steelblue")
abline(v=c(hVaR,hES,nVaR,nES), col=c(3,4,5,6), lty=2)
