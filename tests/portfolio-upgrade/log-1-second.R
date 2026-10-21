# 实验08：Markowitz 均值-方差决策；基础R，无额外包
# 约束：sum(w)=1, w>=0；不支持卖空、杠杆、无风险资产或交易成本
# 1. 当前参数与可复现数据
# 用户本地CSV的清洗后收益样本；不依赖外部文件或网络
# 已按日期对齐；对数收益；原输入价格
# 样本范围 2025-01-01 至 2025-03-06；删除缺失行 0
observations <- matrix(c(0.00616645223010645, 0.004730545870276295, -0.001981226272311103, 0.006517660846585703, -0.0015642144501221745, -0.003563622036415424, 0.005533731030904341, -0.00625949476760023, 0.007321123197287297, 0.004478445669135828, -0.0039192002204967895, 0.008498294776179579, 0.0035847826551902184, 0.0036217915018317707, -0.005047459847794743, 0.0020304205546080468, 0.008756767482292293, -0.008981753733767753, -0.0010181403300122986, 0.005854907304271088, 0.003411547015106867, -0.005208471331459994, -0.0028141217224121923, 0.008385813173667022, -0.008713774704276707, -0.008786239889048447, -0.000840917617111477, -0.009243897809848963, -0.005686055673871083, -0.0030269335779938918, -0.005719747133204357, 0.003887905610773316, 0.0060425926818686694, 0.0006871700632605334, 0.010671150220026255, 0.0050928028957418605, 0.007059783637290136, 0.007879161066931338, -0.007126215593933913, 0.010458402324364869, -0.0021564861337789974, -0.0067909710643907556, 0.009621091595661919, -0.009876567075693711, 0.007220752997520653, 0.0055365429004338345, -0.007618640392371513, 0.009655145101297669, 0.0006082485813176249, 0.0025240025819491503, -0.002147632530781481, -0.002971815294914696, 0.010758326151776815, -0.0047061296878061695, -0.004487339416456263, 0.009286735359239432, 0.004304134370163286, -0.004704193387084758, -0.0004030524755376295, 0.0034561805605591352, -0.00474021757928623, -0.008987139409466098, -0.006347074744398418, -0.004840636968516917, -0.00824201997642263, -0.0030477596211998473, -0.004112434256619146, 0.0007855219635553552, 0.00990851378588365, -0.0014426302442955925, 0.009105671172232311, 0.008181602066616259, 0.00317097458514994, 0.008936800919380133, -0.005567375568412936, 0.008056283620144995, 0.0009377559387225192, -0.006363971192808795, 0.010661166726798317, -0.0068219137674558296, 0.004516577332596368, 0.009182748791739066, -0.006896198154978362, 0.004362048366753688, 0.0038703077685378097, 0.0001674764770058398, -0.004225075831622193, -0.0029162746763093123, 0.006881622004938124, -0.00040680444937773595, -0.008013129650103023, 0.006785952421719955, 0.009790463468753414, -0.009330087987399394, 0.0006326374810803915, 0.004515202836377652, -0.0069951260015043626, -0.004872097585269053, -0.008720340634091361, -0.0029387608716731368, -0.0041678757241193085, -0.005654782952164069, 0.0006607944889342237, 0.0014409213316845127, 0.007184408051101043, 0.002797718143264366, 0.005597323061640918, 0.0061342620717308475, 0.003912269669955428, 0.003917867946803652, -0.0033751584032403444, 0.004976021323484138, -0.0014940861758630305, -0.00039314319750879874, 0.006244925477799946, -0.004454820178498632, 0.007607222147832853, 0.0067713756481168515, -0.0015078789025664546, 0.0011046421295589834, 0.005128090797015837, 0.004149060580009416, -0.009322256228170199, 0.0007768363573556483, 0.006136347039124206, -0.0023040932410281685, -0.005026699325653377, 0.0018626761785171502, 0.010424541511298641, -0.009601541714977627, -0.004446921690671045, 0.006214059943646089, -0.01040644495562445, -0.005878587745900844, -0.005105538112039018, -0.006763857166296037, -0.0002962877369195597, -0.002051344294583575, -0.0004147099966756757, 0.006904798223515851, 0.005841374114110419, 0.005568010564578826, 0.008179116190983734, 0.00009645370473023759, 0.008667697455613911, 0.001618400286372234, -0.007279473627622303, 0.008259859946253124, -0.00668289449527207, 0.0016185089446739988, 0.0055943225880199406, -0.008249537508123572, 0.011695060203626796, 0.0025950484068831604, -0.0009696904696709846, 0.0035148757393155825, 0.00042181826242417025, 0.008285457953726852, -0.008223376640371753, -0.0011189900696938655, 0.010411666012660305, -0.002832879163009173, -0.0029173938720424633, 0.003002627988431991, 0.006448975279078172, -0.005300108760192882, -0.00709652202519377, 0.0013745525048093341, -0.007301094575657502, -0.01003357963010089, -0.004767288257638297, -0.007159775102357624, -0.0027506313340885176, 0.0035914203458788986, -0.0037510287866340843, 0.007733775479683461, 0.010097702862014678, 0.0021883771493482547, 0.01137581367531303, -0.0005719472253410675, 0.008124986893730392, 0.004772583830579303, -0.010098651878083877, 0.01114867432389732, -0.005737432216598427, -0.0009443664134370157, 0.009740573081207921, -0.010036311487089961, 0.009046999223341297, 0.004689882629017747, -0.004139207542415129, 0.0026874620970722056), nrow=64, byrow=TRUE)
factor <- 1
scenario <- "second"
if (scenario == "first") observations <- observations[seq_len(floor(nrow(observations)/2)), , drop=FALSE]
if (scenario == "second") observations <- observations[(floor(nrow(observations)/2)+1):nrow(observations), , drop=FALSE]
mu <- colMeans(observations) * factor
Sigma_raw <- cov(observations) * factor
se <- sqrt(diag(Sigma_raw) / nrow(observations) * factor)
if (scenario == "up") mu[1] <- mu[1] + se[1]
if (scenario == "down") mu[1] <- mu[1] - se[1]
asset_names <- c("示例A","示例B","示例C")
w <- c(0.2, 0.3, 0.5)
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

cat("CHECK ",paste(c(current$mean,current$variance,current$sd,gmv$w,gmv$mean,gmv$variance,gmv$sd,as.vector(t(Sigma_raw)),unlist(lapply(frontier,function(q)c(q$w,q$mean,q$variance,q$sd)))),collapse=" "),"\n")
dev.off()
