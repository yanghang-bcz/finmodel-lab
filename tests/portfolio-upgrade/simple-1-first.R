# 实验08：Markowitz 均值-方差决策；基础R，无额外包
# 约束：sum(w)=1, w>=0；不支持卖空、杠杆、无风险资产或交易成本
# 1. 当前参数与可复现数据
# 用户本地CSV的清洗后收益样本；不依赖外部文件或网络
# 已按日期对齐；简单收益；原输入价格
# 样本范围 2025-01-01 至 2025-03-06；删除缺失行 0
observations <- matrix(c(0.006185503937008008, 0.004741752566687074, -0.001979264939035552, 0.006538947018261965, -0.0015629917043278319, -0.0035572798713360276, 0.0055490704020642045, -0.006239944942172615, 0.007347988140223638, 0.004488488894023535, -0.003911530178727474, 0.00853450779350684, 0.003591215673226289, 0.003628358113913155, -0.0050347428275502315, 0.002032483254235329, 0.008795220129004244, -0.008941538275545668, -0.001017622201004098, 0.005872080774040445, 0.003417372964908294, -0.0051949307634082675, -0.002810165793569741, 0.00842107259568703, -0.00867591980230309, -0.008747753682184167, -0.00084056414497935, -0.009201304330783033, -0.005669920655331007, -0.0030223570333478555, -0.005703420522430225, 0.003895473320127296, 0.006060885972768659, 0.0006874062186983387, 0.010728290011765562, 0.005105793259501112, 0.007084762657353139, 0.007910283341932, -0.007100884327326917, 0.010513282566981808, -0.002154162588087871, -0.006767964528756831, 0.0096675230851484, -0.009827953962288416, 0.007246885495350686, 0.005551897878830925, -0.007589692113815771, 0.00970190638926871, 0.0006084336019969161, 0.002527190558055059, -0.0021453280180818712, -0.002967403822949799, 0.010816405032892717, -0.004695073210691958, -0.004477286351729615, 0.009329990883234496, 0.004313410460239364, -0.004693145999178361, -0.0004029712608002445, 0.003462160039327644, -0.0047290004787681195, -0.008946875780645569, -0.006326974613653613, -0.004828939966643908, -0.008208147652447928, -0.0030431199166105483, -0.004103989778614481, 0.0007858305667325372, 0.009957765645107308, -0.0014415901535003162, 0.009147253913073028, 0.008215162837324375, 0.0031760074433422325, 0.008976853349337732, -0.005551906453823752, 0.00808882279594303, 0.0009381957692966569, -0.006343764016822795, 0.01071819946309649, -0.006798697337224602, 0.004526792441316374, 0.009225039578864891, -0.00687247394742041, 0.004371575947950124, 0.0038778070814111665, 0.00016749050197395476, -0.004216162755956043, -0.0029120264779566307, 0.006905354774396466, -0.0004067217156669134, -0.00798111010936553, 0.006809029166553904, 0.009838546847631635, -0.009286697766188956, 0.0006328376383784029, 0.00452541172398746, -0.006970717055328812, -0.004860248169476167, -0.008682428745268589, -0.002934446940847768, -0.00415920218435617, -0.00563882476125066, 0.00066101286170972, 0.0014419599576260822, 0.007210277826521949, 0.0028016354089521744, 0.0056130173426927055, 0.0061531151875833245, 0.003919932586814223, 0.003925552824262102, -0.003369468958842159, 0.004988422278196181, -0.0014929705847781527, -0.0003930659268484016, 0.006264465679435727, -0.004444912185323502, 0.007636230573427438, 0.006794353246238227, -0.0015067426243691173, 0.0011052524713919265, 0.0051412619593078634, 0.004157679848357132, -0.0092789387077572, 0.0007771381728673976, 0.006155212986208136, -0.0023014408557019417, -0.0050140866148826735, 0.0018644120374038398, 0.010479066344917687, -0.009555594086936181, -0.00443704877452622, 0.006233407268522173, -0.01035248524577459, -0.00586134265776006, -0.00509252700465157, -0.006741033771465399, -0.00029624384804272097, -0.0020492417258193285, -0.00041462401637104573, 0.006928691303411005, 0.005858468208004952, 0.005583540746094684, 0.008212656542933905, 0.00009645835653837587, 0.008705370713338656, 0.0016197106028925656, -0.007253042433421952, 0.008294066705570202, -0.0066606136170697106, 0.0016198194371952468, 0.005610000031887941, -0.00821560345111405, 0.0117637147990437, 0.0025984184595195803, -0.0009692204717972608, 0.003521060158746092, 0.0004219072402578128, 0.008319877354974636, -0.008189657171290499, -0.0011183642337623256, 0.01046605600683237, -0.0028288703472234555, -0.002913142413937697, 0.0030071403910756356, 0.006469814693691234, -0.005286087965273967, -0.007071401171455771, 0.0013754976350977, -0.007274506331767849, -0.009983411199851022, -0.004755942775194533, -0.007134204974447833, -0.0027468518138702436, 0.0035978772234024348, -0.0037440024662105387, 0.007763758365063156, 0.010148856697320907, 0.002190773394265877, 0.011440764298776163, -0.0005717836947052302, 0.008158084177348535, 0.0047839907483935296, -0.010047831708808297, 0.011211052388872655, -0.005721004584868461, -0.000943920639811191, 0.009788166867919834, -0.009986115779894167, 0.009088047013876999, 0.0047008973410584964, -0.0041306528301888745, 0.0026910765605197007), nrow=64, byrow=TRUE)
factor <- 1
scenario <- "first"
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
