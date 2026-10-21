pdf('tests/code-ux-221/generated-garch-default.R.pdf')
# 固定合成冲击；无估计、无需包
omega <- 0.00001
alpha <- 0.12
beta <- 0.82
shock <- 4
stopifnot(omega > 0, alpha >= 0,
  beta >= 0, alpha + beta < 1)
# 02 · 初始条件与冲击
n <- 160
z <- sin(seq_len(n)*2.4)*0.85
z[41] <- shock
h <- epsilon <- numeric(n)
h[1] <- omega/(1-alpha-beta)
epsilon[1] <- sqrt(h[1])*z[1]
# 03 · 条件方差递推
for(t in 2:n) {
  h[t] <- omega+alpha*epsilon[t-1]^2+
  beta*h[t-1]
  epsilon[t] <- sqrt(h[t])*z[t]
}
# 04 · 波动率与冲击
print(c(long_variance=h[1],h41=h[41],
  h42=h[42]))
par(mfrow=c(2,1))
plot(sqrt(h)*100,type="l",
  ylab="Conditional volatility (%)",xlab="t")
abline(v=42,lty=2)
plot(epsilon*100,type="h",
  ylab="Synthetic shock (%)",xlab="t")
abline(v=41,lty=2)
cat('VERIFY ',paste(sprintf('%.17g',c(h,epsilon,z)),collapse=' '),'\n')
dev.off()
