# 实验09：基础R完整脚本，无需额外包
# 理论定价使用年度简单收益；样本单独按其频率回归
rf <- 0.03
rm <- 0.09
beta <- 1.2
sigma_m <- 0.18
w <- 1
stopifnot(all(is.finite(c(rf,rm,beta,sigma_m,w))),
  rf >= -1, rm >= -1, sigma_m > 0, w >= 0, w <= 3)

expected <- rf + beta * (rm - rf)
betas <- seq(min(-2,beta),max(3,beta),length.out=101)
sml <- rf + betas * (rm-rf)

sigma_p <- w * sigma_m
return_p <- rf + w * (rm-rf)
cml <- function(sigma) rf + (rm-rf)*sigma/sigma_m

# 数据来源以网页当前标注为准：用户CSV：测试样本：合成数据变体
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
  "2020-06-01")
d <- data.frame(date=as.Date(dates),
  ri=c(0.03508367891708849,
  -0.007489442576406844,
  -0.024320322840181496,
  0.013015453918242582,
  0.038701630808770884,
  -0.02029936517528116,
  -0.029208139990604134,
  0.04503795934538322,
  0.015985073836220682,
  -0.0386328606833756,
  0.007144467784779219,
  0.03429326624814943,
  -0.00024515954572438886,
  -0.027119848818881045,
  0.007603717010943336,
  0.043138217793562514,
  -0.017465192172015583,
  -0.032706293033235835),
  rm=c(0.041666592418098745,
  -0.008221644081073249,
  -0.0350325872931093,
  0.021764534045544327,
  0.03393948450493961,
  -0.02599498750374169,
  -0.022725484489481335,
  0.03636647259425983,
  0.017869622925224544,
  -0.03645589967518227,
  -0.003959961032567952,
  0.041991716005706774,
  -0.002345463816963049,
  -0.03687193782975453,
  0.016362334160886734,
  0.037170922466028974,
  -0.021425493598971904,
  -0.027134430713263838),
  rf=c(0.001,
  0.00101,
  0.00102,
  0.00103,
  0.0010400000000000001,
  0.00105,
  0.00106,
  0.00107,
  0.00108,
  0.00109,
  0.0011,
  0.00111,
  0.0011200000000000001,
  0.00113,
  0.00114,
  0.00115,
  0.00116,
  0.00117))
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

plot(x,y,xlab="Market excess return (per period decimal)",
  ylab="Asset excess return (per period decimal)",main="SCL: paired sample")
abline(fit,col="steelblue")
# 保留全部拟合/残差供核对，不把多图塞进当前画面
result <- data.frame(d, x=x, y=y, fitted=fitted(fit),
  residual=residuals(fit))
print(head(result))
# 如需保存：write.csv(result,"capm-results.csv",row.names=FALSE)
cat("\nCHECK:",paste(format(c(coef(fit),s$coefficients[,2],s$coefficients[,3],s$coefficients[,4],s$r.squared,expected,sigma_p,return_p),digits=17),collapse=","))
