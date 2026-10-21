pdf('tests/ui-refinement/capm-full-45.R.pdf')
# 理论参数：相同年度，小数收益
rf <- 0.03
rm <- 0.09
beta <- -2
expected <- rf + beta * (rm - rf)
betas <- seq(-2,3,length.out=101)
plot(betas,rf+betas*(rm-rf),type="l",
  xlab="Beta",ylab="Annual expected return")
points(beta,expected,pch=19)
# 以下为固定60个月合成超额收益，与上述理论输入独立
i <- seq_len(60)
x <- 0.04*sin(i*1.7)
y <- 0.001+1.2*x+0.012*cos(i*2.3)
fit <- lm(y~x)
print(c(theoretical=expected,
  alpha_month=coef(
  fit)[1],beta_sample=coef(fit)[2]))
plot(x,y,
  xlab="Monthly market excess return",ylab="Monthly security excess return")
abline(fit,col="steelblue")
cat('CHECK',paste(sprintf('%.17g',c(expected,coef(fit))),collapse=' '),'\n')
dev.off()
