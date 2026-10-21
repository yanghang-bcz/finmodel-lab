pdf('tests/code-ux-221/generated-var-changed.R.pdf')
# 合成情景，1个交易日，基础R，无需额外包
n <- 253
alpha <- 0.99
N <- 2000000
mu <- 0.0004
scale <- 0.01
# 02 · 可复现合成收益
i <- seq_len(n)
R <- mu + scale * (((i * 73) %% 251 -
  125) / 72 -
  ifelse(i %% 37 == 0, 4, 0))
# 03 · 收益转为损失
L <- -N * R
x <- sort(L)
# 04 · 历史 VaR
hVaR <- unname(quantile(L, alpha,
  type = 1))
# 05 · 同一经验分布的 ES
j <- seq_len(n)
tail_mass <- pmax(0, pmin(j / n -
  alpha, 1 / n))
hES <- sum(x * tail_mass) / (1 -
  alpha)
# 正态模型样本估计
m <- mean(L)
s <- sd(L)
z <- qnorm(alpha)
# 正态 VaR
nVaR <- m + s * z
# 正态 ES
nES <- m + s * dnorm(z) / (1 - alpha)
# 07 · 输出与可视化
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
cat('VERIFY ',paste(sprintf('%.17g',c(hVaR,hES,nVaR,nES,L)),collapse=' '),'\n')
dev.off()
