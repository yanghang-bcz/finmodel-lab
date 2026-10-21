pdf('tests/bs-round3/case-4-basic.pdf')
# 一份教学欧式期权对应一单位标的；卖出一份，非真实市场预测
# [parameters] 定价与路径波动率一致；允许卖空、分数持仓，无交易成本
S0 <- 100; K <- 100; T <- 1; r <- 0.05; q <- 0.03; sigma <- 0.2
N <- 60; interval <- 1; seed <- 2027; type <- "P"
# [validation] 与网页使用同一教学域；不截断超域价格
stopifnot(all(is.finite(c(S0,K,T,r,q,sigma,N,interval,seed))), S0>=.01, S0<=1e5, K>=.01, K<=1e5,
          T>0, T<=10, r >= -0.1, r<=.3, q>=0, q<=1, sigma>=0, sigma<=2,
          N>=1, N<=504, N==floor(N), interval>=1, interval<=504, interval==floor(interval),
          seed>=0, seed<=2147483646, seed==floor(seed), type %in% c("C","P"))
# [delta] 带连续股息的 BS 价格、Delta；到期直接使用支付函数
option <- function(S, tau) {
  if(tau==0) return(c(price=if(type=="C") max(S-K,0) else max(K-S,0), delta=NA_real_, gamma=NA_real_))
  A <- S*exp(-q*tau); D <- K*exp(-r*tau)
  if(sigma==0) {
    if(A==D) stop("Zero volatility kink: Delta is not unique")
    d <- as.numeric(A>D)
    return(c(price=if(type=="C") max(A-D,0) else max(D-A,0), delta=exp(-q*tau)*(d-if(type=="P") 1 else 0), gamma=0))
  }
  d1 <- (log(S/K)+(r-q+sigma^2/2)*tau)/(sigma*sqrt(tau)); d2 <- d1-sigma*sqrt(tau)
  price <- if(type=="C") max(0,A-D,A*pnorm(d1)-D*pnorm(d2)) else max(0,D-A,D*pnorm(-d2)-A*pnorm(-d1))
  delta <- exp(-q*tau)*(pnorm(d1)-if(type=="P") 1 else 0)
  c(price=price, delta=delta, gamma=exp(-q*tau)*dnorm(d1)/(S*sigma*sqrt(tau)))
}
# [path] Park-Miller + Box-Muller，与网页相同的可复现教学随机数
normal_draws <- function(seed, n) {
  state <- seed %% 2147483646 + 1
  uniform <- function() { state <<- (state*16807) %% 2147483647; state/2147483647 }
  vapply(seq_len(n), function(i) sqrt(-2*log(uniform()))*cos(2*pi*uniform()), numeric(1))
}
dt <- T/N
spots <- c(100.00000000000000,100.40384042734026,102.72400026310278,105.95791762496448,105.67363458552650,103.17711196881201,101.72017205683976,105.38550483226327,105.79084396805318,101.32556575593851,98.742934369026983,99.107025860433282,102.05488784329748,96.768970473146354,98.536764714931550,100.93097952234956,100.52338083266862,100.30701259746736,99.309108749927006,99.654198378224763,100.99835619521018,100.79668538908948,101.76813236891479,98.329372855047154,98.630395429486228,104.71349476960607,106.55707792900884,101.79224057046812,100.59666448813330,98.372927985464614,98.969094838162775,100.11325457554069,106.88851211781385,107.14791029542025,109.30953164419937,103.40367510693663,106.79801708082240,106.99441093089567,110.32369558544555,106.43833344176610,110.43924508206150,110.54305823581431,112.59012229377787,112.16234284782037,116.73533111233567,118.10645095387413,118.33601090925630,119.81705766445137,118.54329592501374,116.32659011005325,111.51353228456043,113.99198462852115,111.85045268338914,110.95996011822025,115.53246103650753,116.94141030165400,113.39660670748715,111.26663227222426,108.41713197865519,100.36220764089720,97.062190011474357) # 固定核对路径
stopifnot(length(spots)==N+1, spots[1]==S0, all(is.finite(spots)), all(spots>=.01 & spots<=1e5))
# [time] 期末tau严格为0；三种策略共享同一条路径与同一权利金
values <- t(vapply(0:N,function(i) option(spots[i+1], T*(N-i)/N), numeric(3)))
premium <- values[1,"price"]
run_strategy <- function(strategy) {
  # [initial] 权利金支付股票成本，余款为现金；允许负现金（借款）
  holding <- if(strategy=="none") 0 else values[1,"delta"]
  cash <- premium-holding*S0
  rows <- data.frame(i=0,t=0,tau=T,S=S0,price=premium,delta=values[1,"delta"],gamma=values[1,"gamma"],
    oldHolding=0,holding=holding,quantity=holding,cashBefore=premium,interest=0,dividend=0,
    tradeCash=-holding*S0,cash=cash,net=holding*S0+cash-premium,netDelta=holding-values[1,"delta"],rebalance=FALSE,settlement=0)
  for(i in seq_len(N)) {
    # [interest] 先按连续复利更新现金账户，负现金承担利息
    oldHolding <- holding; interest <- cash*expm1(r*dt)
    # [dividend] 左端点矩形近似，股息期末入账；空头为支出，不额外复利
    dividend <- oldHolding*q*spots[i]*dt
    cashBefore <- cash+interest+dividend
    # [trade] 仅动态策略在约定时点调仓；到期不再构造Delta
    rebalance <- strategy=="dynamic" && i<N && i %% interval==0
    if(rebalance) holding <- values[i+1,"delta"]
    quantity <- holding-oldHolding
    tradeCash <- -quantity*spots[i+1]
    cash <- cashBefore+tradeCash
    # [net] 卖方组合：股票+现金-期权负债；终点price为真实支付
    net <- holding*spots[i+1]+cash-values[i+1,"price"]
    rows <- rbind(rows,data.frame(i=i,t=i*dt,tau=T*(N-i)/N,S=spots[i+1],price=values[i+1,"price"],
      delta=values[i+1,"delta"],gamma=values[i+1,"gamma"],oldHolding=oldHolding,holding=holding,quantity=quantity,
      cashBefore=cashBefore,interest=interest,dividend=dividend,tradeCash=tradeCash,cash=cash,net=net,
      netDelta=if(i==N) NA_real_ else holding-values[i+1,"delta"],rebalance=rebalance,settlement=0))
  }
  rows
}
results <- lapply(c("none","static","dynamic"),run_strategy)
names(results) <- c("none","static","dynamic")
errors <- vapply(results,function(x) tail(x$net,1),numeric(1))
# [settle] 终点表格为清算前账户；卖出所有股票并支付期权后，现金等于净误差
settlement <- lapply(results,function(x) {
  last <- x[nrow(x),]; c(stockLiquidation=last$holding*last$S, optionPayment=-last$price,
    cashBefore=last$cash, finalCash=last$cash+last$holding*last$S-last$price, finalHolding=0)
})
print(errors, digits=12)
print(tail(results$dynamic,3), digits=10)
# RStudio实践：保持N、seed与其他参数不变，只修改interval后整段重跑。
# 比较errors和逐期账户；更频繁调仓不保证本路径误差单调下降或盈利。

for(k in names(results)) write.table(results[[k]],file=paste0('tests/bs-round3/case-4-basic-',k,'.csv'),row.names=FALSE,quote=FALSE,sep=',',na='NA')
dev.off()
