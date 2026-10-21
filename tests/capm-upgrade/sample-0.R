# 实验09：基础R完整脚本，无需额外包
# 理论定价使用年度简单收益；样本单独按其频率回归
rf <- 0.04
rm <- -0.02
beta <- -3
sigma_m <- 0.18
w <- 2
stopifnot(all(is.finite(c(rf,rm,beta,sigma_m,w))),
  rf >= -1, rm >= -1, sigma_m > 0, w >= 0, w <= 3)

expected <- rf + beta * (rm - rf)
betas <- seq(min(-2,beta),max(3,beta),length.out=101)
sml <- rf + betas * (rm-rf)

sigma_p <- w * sigma_m
return_p <- rf + w * (rm-rf)
cml <- function(sigma) rf + (rm-rf)*sigma/sigma_m

# 数据来源以网页当前标注为准：test CSV
# monthly; simple returns; decimal units
# 不进行价格转换、跨列错位匹配或自动删异常
dates <- c("2019-01-01",
  "2019-02-01",
  "2019-03-01",
  "2019-04-01",
  "2019-05-01")
d <- data.frame(date=as.Date(dates),
  ri=c(0.07654674605352188,
  -0.03034027768827055,
  -0.03171250199280331,
  0.06236507859982786,
  -0.06533857488089174),
  rm=c(-0.027927174037754153,
  0.010954522032269515,
  0.013342244608487118,
  -0.012054524062692428,
  0.0256918690245095),
  rf=c(7.513314489048587e-7,
  0.00003041266465113157,
  0.0005162831565906681,
  0.0017305180103194518,
  0.0017726732267870908))
stopifnot(nrow(d)>=5, !anyDuplicated(d$date),
  all(complete.cases(d)), all(diff(d$date)>0),
  all(is.finite(as.matrix(d[,2:4]))),
  all(as.matrix(d[,2:4]) >= -1))

x <- d$rm - d$rf
y <- d$ri - d$rf
stopifnot(var(x)>1e-24, var(y)>1e-24)
fit <- lm(y ~ x)
s <- summary(fit)
# 近乎完全拟合时不作常规SE/t/p推断，与网页边界一致
if (sum(residuals(fit)^2) <= 1e-24) {
  s$coefficients[,2:4] <- NA_real_
}
beta_cov <- cov(x,y)/var(x)

# 经典同方差OLS：条件均值正确、误差独立同方差；精确t检验另需正态误差
# alpha H0: alpha=0; beta H0: beta=0
print(s$coefficients)
print(c(expected=expected, sigma_p=sigma_p, return_p=return_p,
  beta_cov=beta_cov, R_squared=s$r.squared, n=nrow(d)))
# alpha非显著不证明CAPM成立；beta显著也不是完整CAPM检验
# 合成样本的p值只演示计算，统计显著不等于因果
# 可选稳健推断（需自行安装sandwich和lmtest，不在本脚本自动安装）：
# lmtest::coeftest(fit, vcov.=sandwich::NeweyWest(fit))

plot(x,y,xlab="Market excess return (monthly decimal)",
  ylab="Asset excess return (monthly decimal)",main="SCL: paired sample")
abline(fit,col="steelblue")
# 保留全部拟合/残差供核对，不把多图塞进当前画面
result <- data.frame(d, x=x, y=y, fitted=fitted(fit),
  residual=residuals(fit))
print(head(result))
# 如需保存：write.csv(result,"capm-results.csv",row.names=FALSE)
cat("\nCHECK:",paste(format(c(coef(fit),as.vector(s$coefficients[,2:4]),s$r.squared,beta_cov,expected,sigma_p,return_p,x,y,fitted(fit),residuals(fit)),digits=17,scientific=TRUE),collapse=","),"\n")
