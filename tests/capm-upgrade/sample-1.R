# 实验09：基础R完整脚本，无需额外包
# 理论定价使用年度简单收益；样本单独按其频率回归
rf <- 0.04
rm <- 0.04
beta <- -2
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
  "2019-05-01",
  "2019-06-01",
  "2019-07-01",
  "2019-08-01",
  "2019-09-01",
  "2019-10-01",
  "2019-11-01",
  "2019-12-01")
d <- data.frame(date=as.Date(dates),
  ri=c(0.08308060537328972,
  0.07185275316417811,
  0.07910459312568631,
  0.06203021450249023,
  -0.13132857693979916,
  -0.018351223908528332,
  0.06318716945647596,
  0.06321408504211068,
  -0.11779089072523215,
  0.0959670382328178,
  0.056075590969098546,
  -0.12047411104406887),
  rm=c(-0.041873216083679915,
  -0.04292798739388957,
  -0.03243799104422237,
  -0.029880779890753693,
  0.07097158970775623,
  0.014216685462378288,
  -0.02465383766947958,
  -0.028111198632564015,
  0.05475248871266492,
  -0.04946258964131706,
  -0.02625218490755753,
  0.06734227749721254),
  rf=c(0.0008512185601756063,
  0.0008079024724699103,
  0.0019301803866076193,
  0.0012320214888230066,
  0.0007762203806900514,
  0.0013907997270071878,
  0.0005565933159350387,
  0.0007333025172042207,
  0.0010725123896601202,
  0.0013753984744545999,
  0.000977844763071204,
  0.00018015680936172456))
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
