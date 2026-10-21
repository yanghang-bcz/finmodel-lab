raw <- read.csv(commandArgs(trailingOnly=TRUE)[1], check.names=FALSE,
                colClasses="character", na.strings=c("", "NA", "N/A"))
stopifnot(!anyDuplicated(names(raw)), ncol(raw) >= 4, ncol(raw) <= 6)
date <- as.Date(raw[[1]], format="%Y-%m-%d")
stopifnot(!anyNA(date), !anyDuplicated(date),
          all(format(date, "%Y-%m-%d") == raw[[1]]))
# 这是主动选择的排序；若不希望排序，先检查 all(diff(date)>0)
raw <- raw[order(date), , drop=FALSE]
P <- sapply(raw[-1], as.numeric)
stopifnot(all(is.finite(P)), all(P > 0))
observations <- P[-1,,drop=FALSE] / P[-nrow(P),,drop=FALSE] - 1
# 对数收益可改为 diff(log(P))，两者不要混用
factor <- 252  # 按自己的数据频率确认
stopifnot(nrow(observations) >= ncol(observations)+2)
asset_names <- colnames(P)
mu <- colMeans(observations)*factor
Sigma_raw <- cov(observations)*factor
lambda <- 0   # 奇异时不要静默修复，先检查数据
Sigma <- Sigma_raw + diag(lambda,length(mu))
w <- rep(1/length(mu), length(mu))

cat("CHECK ",paste(c(mu,as.vector(t(Sigma_raw))),collapse=" "),"\n")
