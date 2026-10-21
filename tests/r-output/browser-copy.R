# 实验 8：两资产组合（教学假设）
mu <- c(A = 0.08, B = 0.14)
s <- c(A = 0.12, B = 0.22)
rho <- -0.5
w1 <- 0.5; w2 <- 1 - w1
rp <- w1 * mu[1] + w2 * mu[2]
vp <- w1^2*s[1]^2 + w2^2*s[2]^2 +
      2*w1*w2*s[1]*s[2]*rho
sp <- sqrt(max(0, vp))
d <- s[1]^2 + s[2]^2 - 2*s[1]*s[2]*rho
mv <- if (d < 1e-14) as.numeric(mu[1] >= mu[2]) else
  max(0, min(1, (s[2]^2-s[1]*s[2]*rho)/d))
w <- sort(unique(c(seq(0, 1, 0.0025),
  mv)))
ret <- w*mu[1] + (1-w)*mu[2]
vol <- sqrt(pmax(0, w^2*s[1]^2 +
  (1-w)^2*s[2]^2 +
  2*w*(1-w)*s[1]*s[2]*rho))
eff <- w <= mv + 1e-10
plot(vol, ret, type="l", col="grey70",
  xlab="Risk (SD)", ylab="Expected return")
lines(vol[eff], ret[eff], col="seagreen", lwd=3)
points(vol[eff], ret[eff], col="seagreen", pch=16, cex=.3)
points(sp, rp, pch=19, col="steelblue", cex=1.4)
print(c(return=rp, variance=vp, sd=sp))
