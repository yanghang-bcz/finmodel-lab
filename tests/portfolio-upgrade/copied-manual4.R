# 实验08：Markowitz 均值-方差决策；基础R，无额外包
# 约束：sum(w)=1, w>=0；不支持卖空、杠杆、无风险资产或交易成本
# 1. 当前参数与可复现数据
# 教学假设，非真实市场数据；同一期限的小数单位
mu <- c(0.08, 0.14, 0.11, 0.06)
s <- c(0.12, 0.22, 0.17, 0.09)
rho <- matrix(c(1, 0.2, 0.2, 0.2, 0.2, 1, 0.2, 0.2, 0.2, 0.2, 1, 0.2, 0.2, 0.2, 0.2, 1), nrow=4, byrow=TRUE)
Sigma_raw <- diag(s) %*% rho %*% diag(s)
asset_names <- c("资产A","资产B","资产C","资产D")
w <- c(0.25, 0.25, 0.25, 0.25)
lambda <- 0
# 主动选择岭正则时加 lambda*I，优化目标随之改变
Sigma <- Sigma_raw + diag(lambda, length(mu))
stopifnot(length(mu) >= 2, length(mu) <= 5,
          all(w >= 0), abs(sum(w)-1) < 1e-8,
          min(eigen(Sigma, symmetric=TRUE)$values) > 0)
# 2. 收益 w^T mu；方差 w^T Sigma w；风险为方差开根号
portfolio <- function(w) {
  v <- as.numeric(t(w) %*% Sigma %*% w)
  list(w=w, mean=sum(w*mu), variance=v, sd=sqrt(max(0,v)))
}
current <- portfolio(w)
# 3. 枚举非空活跃面，求解各面的拉格朗日方程，比较全局最小值
# n<=5最多31个面；凸正定目标保证最优；采样不参与优化
optimize_portfolio <- function(target=NULL) {
  n <- length(mu); low <- min(mu); high <- max(mu)
  span <- high-low; scale <- max(diag(Sigma)); best <- NULL
  if (!is.null(target) && (target < low-1e-11 || target > high+1e-11))
    stop("Target return infeasible under long-only constraints")
  for (mask in seq_len(2^n-1)) {
    ids <- which(as.logical(intToBits(mask)[seq_len(n)]))
    k <- length(ids); A <- matrix(1, nrow=1, ncol=k); b <- 1
    if (!is.null(target) && span > 1e-12) {
      A <- rbind(A, (mu[ids]-low)/span); b <- c(1,(target-low)/span)
    }
    nc <- nrow(A)
    if (k < nc) {
      if (k == 1 && !is.null(target) && abs(mu[ids]-target) < 1e-10) {
        ww <- numeric(n); ww[ids] <- 1; q <- portfolio(ww)
        if (is.null(best) || q$variance < best$variance-1e-14*scale) best <- q
      }
      next
    }
    K <- rbind(cbind(Sigma[ids,ids,drop=FALSE]/scale,t(A)),
               cbind(A,matrix(0,nc,nc)))
    x <- tryCatch(solve(K,c(rep(0,k),b),tol=1e-12), error=function(e) NULL)
    if (is.null(x) || any(x[seq_len(k)] < -1e-9)) next
    ww <- numeric(n); ww[ids] <- pmax(0,x[seq_len(k)]); ww <- ww/sum(ww)
    q <- portfolio(ww)
    if (!is.null(target) && abs(q$mean-target)>1e-8) next
    if (is.null(best) || q$variance < best$variance-1e-14*scale) best <- q
  }
  if (is.null(best)) stop("No feasible solution")
  best
}
gmv <- optimize_portfolio()
# 4. 从GMV到最高收益端点，逐个目标收益进行真正的约束优化
n_frontier <- if (max(mu)-gmv$mean < 1e-12) 1 else 61
targets <- seq(gmv$mean,max(mu),length.out=n_frontier)
frontier <- lapply(targets, optimize_portfolio)
frontier_risk <- vapply(frontier,function(q) q$sd,numeric(1))
# 5. 仅用于展示可行集的确定性采样；不是精确边界
seed <- 8128
uniform <- function() { seed <<- (seed*16807) %% 2147483647; seed/2147483647 }
sample_w <- diag(length(mu))
for (i in seq_len(360)) {
  ww <- -log(vapply(seq_along(mu),function(j) uniform(),numeric(1)))
  sample_w <- rbind(sample_w,ww/sum(ww))
}
cloud <- lapply(seq_len(nrow(sample_w)),function(i) portfolio(sample_w[i,]))
cloud_risk <- vapply(cloud,function(q) q$sd,numeric(1))
cloud_return <- vapply(cloud,function(q) q$mean,numeric(1))
plot(cloud_risk,cloud_return,col="grey75",pch=16,cex=.45,
     xlab="Risk (SD, decimal)",ylab="Expected return (decimal)",
     xlim=range(c(cloud_risk,frontier_risk,current$sd)),
     ylim=range(c(cloud_return,targets,current$mean)))
lines(frontier_risk,targets,col="seagreen",lwd=3)
points(frontier_risk,targets,col="seagreen",pch=16,cex=.4)
points(gmv$sd,gmv$mean,col="seagreen",pch=5,cex=1.5)
points(current$sd,current$mean,col="steelblue",pch=19,cex=1.3)
legend("topleft",c("Sampled feasible points","Optimized frontier","GMV","Current"),
       col=c("grey75","seagreen","seagreen","steelblue"),pch=c(16,16,5,19),bty="n")
# 6. 核对网页；方差为小数平方，标准差使用小数
print(data.frame(asset=asset_names,current=w,gmv=gmv$w))
print(unlist(current[c("mean","variance","sd")]))
print(unlist(gmv[c("mean","variance","sd")]))
print(Sigma_raw)
# RStudio实践：改一个收益假设或权重后重跑，对比GMV与前沿。
# CSV原始价格可用 read.csv(file.choose(), check.names=FALSE) 读取；
# 确保按日期排序、完整行对齐，再按本文口径计算收益与cov()。

# 当前目标收益组合（可能低于GMV收益）
target_return <- 0.11
target_portfolio <- optimize_portfolio(target_return)
print(target_portfolio)
points(target_portfolio$sd,target_portfolio$mean,col="#b18844",pch=19)

cat("CHECK ",paste(c(current$mean,current$variance,current$sd,gmv$w,gmv$sd),collapse=" "),"\n")
cat("TARGET ",paste(c(target_portfolio$w,target_portfolio$mean,target_portfolio$sd),collapse=" "),"\n")
dev.off()
