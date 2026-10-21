pdf('tests/code-ux-221/generated-portfolio-changed.R.pdf')
# 实验08：两资产均值—方差组合
mu <- c(A = 0.08, B = 0.14)
s <- c(A = 0.12, B = 0.22)
rho <- -0.6
w1 <- 0.35
w2 <- 1 - w1
rp <- w1*mu[1] + w2*mu[2]
vp <- w1^2*s[1]^2 +
      w2^2*s[2]^2 +
      2*w1*w2*s[1]*s[2]*rho
sp <- sqrt(vp)
d <- (s[1]-s[2])^2 +
     2*s[1]*s[2]*(1-rho)
mv <- if (d == 0) {
  as.numeric(mu[1] >= mu[2])
} else {
  max(0, min(1,
    (s[2]*(s[2]-s[1]) +
     s[1]*s[2]*(1-rho))/d))
}
w <- sort(unique(c(
  seq(0, 1, 0.0025), mv)))
ret <- w*mu[1] + (1-w)*mu[2]
vol <- sqrt(
  (w*s[1]-(1-w)*s[2])^2 +
  2*w*(1-w)*s[1]*s[2]*(1+rho))
eff <- w <= mv + 1e-10
plot(vol, ret, type="l",
  col="grey70", xlab="Risk (SD)",
  ylab="Expected return")
lines(vol[eff], ret[eff],
  col="seagreen", lwd=3)
points(vol[eff], ret[eff],
  col="seagreen", pch=16, cex=.3)
points(sp, rp, pch=19,
  col="steelblue", cex=1.4)
print(c(return=rp,
  variance=vp, sd=sp))
cat('VERIFY ',paste(sprintf('%.17g',c(rp,vp,sp,mv,sum(eff))),collapse=' '),'\n')
dev.off()
