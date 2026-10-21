pdf('tests/ui-refinement/garch-basic-36.R.pdf')
# 固定合成冲击；无估计、无需包
omega <- 0.00001
alpha <- 0.12
beta <- 0
shock <- 4
n <- 160
z <- sin(seq_len(n)*2.4)*0.85
z[41] <- shock
h <- epsilon <- numeric(n)
h[1] <- omega/(1-alpha-beta)
epsilon[1] <- sqrt(h[1])*z[1]
for(t in 2:n) {
  h[t] <- omega+alpha*epsilon[t-1]^2+
  beta*h[t-1]
  epsilon[t] <- sqrt(h[t])*z[t]
}
print(c(long_variance=h[1],h41=h[41],
  h42=h[42]))
par(mfrow=c(2,1))
plot(sqrt(h)*100,type="l",
  ylab="Conditional volatility (%)",xlab="t")
abline(v=42,lty=2)
plot(epsilon*100,type="h",
  ylab="Synthetic shock (%)",xlab="t")
abline(v=41,lty=2)
cat('CHECK',paste(sprintf('%.17g',c(h[1],h[41],h[42],epsilon[41])),collapse=' '),'\n')
dev.off()
