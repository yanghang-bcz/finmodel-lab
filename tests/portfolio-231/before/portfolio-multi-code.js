/* Self-contained base R. Uploaded observations are embedded, never file paths. */
(function(root){'use strict';
const vector=a=>'c('+a.map(x=>Number(x).toString()).join(', ')+')',matrix=a=>'matrix('+vector(a.flat())+', nrow='+a.length+', byrow=TRUE)';
function build(model,w,names,context={}){const {data,factor=1,scenario='full'}=context;const s=context.manual?.s||model.raw.map((r,i)=>Math.sqrt(r[i]));const rho=context.manual?.rho||model.raw.map((r,i)=>r.map((x,j)=>s[i]*s[j]>0?x/(s[i]*s[j]):+(i===j)));let input=data?`# 用户本地CSV的清洗后收益样本；不依赖外部文件或网络\n# 已按日期对齐；${data.method==='log'?'对数':'简单'}收益；原输入${data.kind==='price'?'价格':'简单收益率'}\n# 样本范围 ${data.from} 至 ${data.to}；删除缺失行 ${data.dropped}\nobservations <- ${matrix(data.returns)}\nfactor <- ${factor}\nscenario <- "${scenario}"\nif (scenario == "first") observations <- observations[seq_len(floor(nrow(observations)/2)), , drop=FALSE]\nif (scenario == "second") observations <- observations[(floor(nrow(observations)/2)+1):nrow(observations), , drop=FALSE]\nmu <- colMeans(observations) * factor\nSigma_raw <- cov(observations) * factor\nse <- sqrt(diag(Sigma_raw) / nrow(observations) * factor)\nif (scenario == "up") mu[1] <- mu[1] + se[1]\nif (scenario == "down") mu[1] <- mu[1] - se[1]`:`# 教学假设，非真实市场数据；同一期限的小数单位\nmu <- ${vector(model.mu)}\ns <- ${vector(s)}\nrho <- ${matrix(rho)}\nSigma_raw <- diag(s) %*% rho %*% diag(s)`;
return `# 实验08：Markowitz 均值-方差决策；基础R，无额外包
# 约束：sum(w)=1, w>=0；不支持卖空、杠杆、无风险资产或交易成本
# 1. 当前参数与可复现数据
${input}
asset_names <- ${JSON.stringify(names).replace(/^\[/,'c(').replace(/\]$/,')')}
w <- ${vector(w)}
lambda <- ${model.lambda}
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
points(gmv$sd,gmv$mean,col="seagreen",pch=18,cex=1.5)
points(current$sd,current$mean,col="steelblue",pch=19,cex=1.3)
legend("topleft",c("Sampled feasible points","Optimized frontier","GMV","Current"),
       col=c("grey75","seagreen","seagreen","steelblue"),pch=c(16,16,18,19),bty="n")
# 6. 核对网页；方差为小数平方，标准差使用小数
print(data.frame(asset=asset_names,current=w,gmv=gmv$w))
print(unlist(current[c("mean","variance","sd")]))
print(unlist(gmv[c("mean","variance","sd")]))
print(Sigma_raw)
# RStudio实践：改一个收益假设或权重后重跑，对比GMV与前沿。
# CSV原始价格可用 read.csv(file.choose(), check.names=FALSE) 读取；
# 确保按日期排序、完整行对齐，再按本文口径计算收益与cov()。
`;
}
root.PortfolioMultiCode={build};if(typeof module!=='undefined')module.exports=root.PortfolioMultiCode;
})(typeof window!=='undefined'?window:globalThis);
