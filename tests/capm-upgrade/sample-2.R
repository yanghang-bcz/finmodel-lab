# 实验09：基础R完整脚本，无需额外包
# 理论定价使用年度简单收益；样本单独按其频率回归
rf <- 0.04
rm <- -0.02
beta <- -1
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
  "2019-12-01",
  "2020-01-01",
  "2020-02-01",
  "2020-03-01",
  "2020-04-01",
  "2020-05-01",
  "2020-06-01",
  "2020-07-01")
d <- data.frame(date=as.Date(dates),
  ri=c(0.004707460335319607,
  -0.0772490295945895,
  -0.0028398194349556344,
  0.05656242490073779,
  0.03223919098975099,
  0.02498038947953861,
  0.07054175292865454,
  -0.05477073355008416,
  0.04869238036390971,
  -0.057958150973058384,
  -0.055378194822174584,
  0.03919018329875086,
  -0.06139852667432209,
  -0.01418119934442508,
  0.026541076619895673,
  0.03677231262706794,
  -0.04130939347404492,
  -0.010244724646790292,
  0.004020835819198217),
  rm=c(-0.011161828071885661,
  0.07434128100487462,
  0.021473335344564796,
  -0.04158846097839459,
  -0.020549631119496016,
  -0.020173284169832842,
  -0.06882900628625835,
  0.05508543509900823,
  -0.04935753324458261,
  0.07157810580105432,
  0.03928252522567405,
  -0.04093566652756914,
  0.07273628059110432,
  0.030903892228335086,
  -0.01770793037801419,
  -0.014563641971705316,
  0.0454665071836051,
  0.010531855970403115,
  0.003200096268300005),
  rf=c(0.0018622494404494062,
  0.0004894380134015521,
  0.000175003509118689,
  0.0008466968642765176,
  0.0006271623515650455,
  0.0015498726933961143,
  0.0010799112203903082,
  0.0005998528276569456,
  0.0005867991953095417,
  0.0011053691697797594,
  0.00003507605755472372,
  0.0013517246485462992,
  0.0016395518507992624,
  0.00038670832961178777,
  0.0012742754152390526,
  0.0015597539728319989,
  0.001877883095237372,
  0.00157238766344841,
  0.0008788618402922815))
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
