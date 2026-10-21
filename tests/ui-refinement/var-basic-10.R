pdf('tests/ui-refinement/var-basic-10.R.pdf')
# 合成情景，1个交易日，基础R，无需额外包
n <- 250
alpha <- 0.95
N <- 1000000
mu <- 0.02
scale <- 0.001
i <- seq_len(n)
R <- mu + scale * (((i * 73) %% 251 -
  125) / 72 -
  ifelse(i %% 37 == 0, 4, 0))
L <- -N * R
x <- sort(L)
hVaR <- unname(quantile(L, alpha,
  type = 1))
j <- seq_len(n)
tail_mass <- pmax(0, pmin(j / n -
  alpha, 1 / n))
hES <- sum(x * tail_mass) / (1 -
  alpha)
m <- mean(L)
s <- sd(L)
z <- qnorm(alpha)
nVaR <- m + s * z
nES <- m + s * dnorm(z) / (1 - alpha)
print(c(Historical_VaR=hVaR,
  Historical_ES=hES,
  Normal_VaR=nVaR, Normal_ES=nES))
loss_wan <- L / 10000
hist(loss_wan,breaks=25,
  probability=TRUE,
  main="Synthetic loss",xlab="Loss (10,000 yuan)")
curve(dnorm(x,m/10000,s/10000),
  add=TRUE,
  col="thistle4")
abline(v=c(hVaR,hES,nVaR,nES)/10000,
  col=c(3,3,4,4),lty=c(1,2,1,2))
cat('CHECK',paste(sprintf('%.17g',c(hVaR,hES,nVaR,nES)),collapse=' '),'\n')
dev.off()
