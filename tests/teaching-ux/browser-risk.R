pdf('tests/teaching-ux/browser-risk.R.pdf')
ST <- 120; K <- 100
premium <- 10.450583572185565
ST <- 120; K <- 100
payoff <- max(ST-K,0)
simple <- premium-payoff
print(c(payoff=payoff,simple=simple))
# 忽略资金时间价值及其他现金流，不是完整自融资终值

cat('EXECUTED','\n')
dev.off()
