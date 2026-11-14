/* Experiment07 · R script for the AI risk view. Base R only: the bagged
   regression tree and the LSTM both train inside the script, and every number
   the page shows is printed again. Comments follow the active UI language.
   Indexing contract: R matrix D row j is 1-based day j+2, matching the page's
   design day (target = return of that day, features from earlier days). */
(function(root,factory){const api=factory(typeof module==='object'?require('./risk-ai-math'):root.RiskAIMath);if(typeof module==='object')module.exports=api;else root.RiskAICode=api;})(this,A=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
function vec(values,per=8){
  const parts=values.map(v=>num(v)),lines=[];
  for(let i=0;i<parts.length;i+=per)lines.push('  '+parts.slice(i,i+per).join(', '));
  return 'c(\n'+lines.join(',\n')+'\n)';
}
function lstmSource(){
  try{return (typeof module==='object'?require('./timeseries-r'):window.TimeSeriesR).source.lstmTrain;}catch{return '# LSTM source unavailable.';}
}
function build(p,q,mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];
  const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const R=q.R,N=p.N,alpha=p.alpha,nt=q.nt,k0=Math.max(20,Math.min(nt,120));
  add('data',T('数据、目标与 EWMA 基准','Data, target and EWMA baseline'),
    [`# Experiment 07 | AI risk forecasting | base R, no extra packages.`,
     T('# 固定种子生成的合成样本：GARCH(1,1) 波动聚集 + 偶发跳跃；非真实行情。','# Synthetic sample from a fixed seed: GARCH(1,1) clustering plus occasional jumps; not a market quote.'),
     `R <- ${vec(R)}`,
     `n <- length(R)`, `N <- ${num(N)}`, `alpha <- ${num(alpha)}`, `train_share <- ${num(p.aiTrain)}`,
     `k0 <- ${k0}L`,
     T('# EWMA（λ=0.94）：前 k0 日均值；h[k0+1] 取前 k0 日样本方差','# EWMA (λ=0.94): mean of the first k0 days; h[k0+1] is their sample variance'),
     'ewma_var <- function(R, k, lambda) {',
     '  mu <- mean(R[seq_len(k)]); h <- numeric(length(R) + 1L)',
     '  h[k + 1L] <- var(R[seq_len(k)])',
     '  for (i in seq.int(k + 1L, length(R))) h[i + 1L] <- lambda * h[i] + (1 - lambda) * (R[i] - mu)^2',
     '  list(mu = mu, sigma = sqrt(h))',
     '}',
     'lambda <- 0.94', 'ew <- ewma_var(R, k0, lambda)', 'z <- qnorm(alpha)',
     T('# 第 i 日的事前 VaR 只用第 i−1 日及更早的信息','# The one-day-ahead VaR for day i uses information through day i−1'),
     'VaR_ewma <- N * (-ew$mu + ew$sigma * z)',
     'ES_ewma <- N * (-ew$mu + ew$sigma * dnorm(z) / (1 - alpha))',
     'stopifnot(n >= 150)'],
    T('收益是小数简单收益，损失为正数。EWMA 与页面使用同一 λ、同一初始化窗口和同一分母。','Returns are decimal simple returns and losses are positive. EWMA uses the same λ, initialisation window and denominator as the page.'));
  add('features',T('五个滞后特征','Five lagged features'),
    [T('# 每个特征都只使用目标日之前的信息','# Every feature uses information strictly before the target day'),
     'design <- function(R) {',
     '  out <- list(); v <- NULL; lambda <- 0.94',
     '  for (i in seq.int(3L, length(R))) {',
     '    if (is.null(v)) v <- mean(R[seq_len(i - 1L)]^2) else v <- lambda * v + (1 - lambda) * R[i - 1L]^2',
     '    out[[length(out) + 1L]] <- c(R[i], R[i - 1L], R[i - 2L], abs(R[i - 1L]), R[i - 1L]^2, sqrt(v))',
     '  }',
     '  do.call(rbind, out)',
     '}',
     T('# 第 1 列是目标，第 2–6 列是特征；第 j 行对应第 j+2 日','# Column 1 is the target and columns 2-6 the features; row j is day j+2'),
     'D <- design(R); rownames(D) <- NULL',
     'nt <- floor(nrow(D) * train_share)',
     'train_rows <- seq_len(nt)', 'test_rows <- seq.int(nt + 1L, nrow(D))',
     'day <- test_rows + 2L',
     'X <- D[, 2:6, drop = FALSE]; y <- D[, 1]',
     'loss <- -N * y[test_rows]',
     'stopifnot(length(day) >= 40)'],
    T('特征的构造与页面逐列一致：滞后收益、绝对收益、平方收益和 EWMA 波动率。','The construction matches the page column by column: lagged returns, absolute and squared returns, and EWMA volatility.'));
  add('forest',T('随机森林（叶内分位数）','Random forest with leaf quantiles'),
    [T('# 逐样本 bootstrap 后递归二分；叶节点保存目标值，最后汇集取分位','# Per-tree bootstrap then recursive splits; leaves keep the targets and the quantile is pooled'),
     `set.seed(${p.aiSeed})`,
     `grow <- function(idx, depth, max_depth = ${p.aiDepth}L, leaf = ${p.aiLeaf}L) {`,
     '  if (depth >= max_depth || length(idx) < 2L * leaf) return(list(vals = y[idx]))',
     '  best <- NULL',
     '  for (f in sample(5L, min(3L, 5L))) {',
     '    cuts <- unique(quantile(X[idx, f], probs = seq(0.1, 0.9, length.out = 6), names = FALSE))',
     '    for (cut in cuts) {',
     '      left <- idx[X[idx, f] <= cut]; right <- idx[X[idx, f] > cut]',
     '      if (length(left) < leaf || length(right) < leaf) next',
     '      sse <- sum((y[left] - mean(y[left]))^2) + sum((y[right] - mean(y[right]))^2)',
     '      if (is.null(best) || sse < best$sse) best <- list(f = f, cut = cut, sse = sse, left = left, right = right)',
     '    }',
     '  }',
     '  if (is.null(best)) return(list(vals = y[idx]))',
     '  list(f = best$f, cut = best$cut, left = grow(best$left, depth + 1L), right = grow(best$right, depth + 1L))',
     '}',
     `trees <- vector("list", ${p.aiTrees}L)`,
     'for (b in seq_along(trees)) trees[[b]] <- grow(sample(train_rows, length(train_rows), replace = TRUE), 0L)',
     'leaf_of <- function(node, x) if (is.null(node$f)) node$vals else if (x[node$f] <= node$cut) leaf_of(node$left, x) else leaf_of(node$right, x)',
     T('# 汇集所有树的叶内样本再取分位，而不是把各树分位数取平均','# Pool the leaf samples of every tree, then take the quantile rather than averaging per-tree quantiles'),
     'rf_q <- function(row) {',
     '  pool <- unlist(lapply(trees, function(tr) leaf_of(tr, X[row, ])))',
     '  q <- quantile(pool, 1 - alpha, names = FALSE)',
     '  c(q = q, tail = mean(pool[pool <= q]))',
     '}',
     'rf <- t(vapply(test_rows, rf_q, numeric(2)))',
     'VaR_rf <- -N * rf[, "q"]; ES_rf <- -N * rf[, "tail"]'],
    T('叶节点直接给出条件分位，因此不需要正态假设；代价是尾部估计依赖叶内样本量与随机种子。','Leaves give a conditional quantile directly, so no normal assumption is needed; the cost is that the tail estimate depends on leaf sample size and the seed.'));
  if(mode==='full'){
    add('lstm',T('LSTM 训练与条件均值','LSTM training and conditional mean'),
      [T('# base R 教学规模 LSTM：完整 BPTT、逐样本 SGD','# Teaching-scale LSTM in base R: full BPTT, per-sample SGD'),
       lstmSource(),
       `window <- ${p.aiWindow}L`, `hidden <- ${p.aiHidden}L`, `epochs <- ${p.aiEpochs}L`, `seed <- ${p.aiSeed}L`,
       'start <- max(2L, window)',
       'train_t <- seq.int(max(start + 1L, k0 + 1L), nt + 2L)',
       'if (length(train_t) > 200L) train_t <- round(seq(min(train_t), nt + 2L, length.out = 200L))',
       'center <- mean(R[seq_len(nt + 2L)]); scale <- sd(R[seq_len(nt + 2L)])',
       'Z <- (R - center) / scale',
       'input_at <- function(t) matrix(Z[(t - window):(t - 1L)], ncol = 1)',
       'set.seed(seed)',
       'fit <- lstm_train(lapply(train_t, input_at), Z[train_t], hidden, epochs, 0.02, seed)',
       'mu_hat <- center + scale * vapply(day, function(t) lstm_forward(fit$weights, input_at(t), hidden)$value, numeric(1))',
       T('# 用 LSTM 残差除以 EWMA 尺度，再取标准化残差分位','# Divide the LSTM residual by the EWMA scale and take the standardised residual quantile'),
       'res <- (R[day] - mu_hat) / ew$sigma[day]',
       'res_train <- (R[train_t] - (center + scale * vapply(train_t, function(t) lstm_forward(fit$weights, input_at(t), hidden)$value, numeric(1)))) / ew$sigma[train_t]',
       'zq <- quantile(res_train, 1 - alpha, names = FALSE)',
       'ztail <- mean(res_train[res_train <= zq])',
       'VaR_lstm <- -N * (mu_hat + ew$sigma[day] * zq)',
       'ES_lstm <- -N * (mu_hat + ew$sigma[day] * ztail)'],
      T('LSTM 给出条件均值，尺度仍来自 EWMA；它与 EWMA 的差别只来自均值修正和残差分位，不能宣称它重新刻画了波动率。','The LSTM gives the conditional mean while the scale still comes from EWMA, so its difference from EWMA comes only from the mean correction and the residual quantile; it does not re-model volatility.'));
  }
  const rows=[`  summarise("EWMA-normal", VaR_ewma[day], ES_ewma[day])`,`  summarise("Random forest", VaR_rf, ES_rf)`];
  if(mode==='full')rows.push('  summarise("LSTM + EWMA scale", VaR_lstm, ES_lstm)');
  add('backtest',T('样本外检验与 Kupiec','Out-of-sample check and Kupiec'),
    ['kupiec <- function(x, n, p0) {',
     '  ph <- x / n',
     '  if (x == 0 || x == n) return(c(LR = NA_real_, p = NA_real_, x = x, n = n))',
     '  LR <- 2 * (x * log(ph / p0) + (n - x) * log((1 - ph) / (1 - p0)))',
     '  c(LR = LR, p = pchisq(LR, 1L, lower.tail = FALSE), x = x, n = n)',
     '}',
     'summarise <- function(name, VaR, ES) {',
     '  hit <- loss > VaR',
     '  k <- kupiec(sum(hit), length(loss), 1 - alpha)',
     '  data.frame(model = name, hits = sum(hit), n = length(loss), LR = unname(k["LR"]),',
     '    p = unname(k["p"]), meanVaR = mean(VaR), meanES = mean(ES),',
     '    esBias = if (any(hit)) mean((loss - ES)[hit]) else NA_real_)',
     '}',
     'table_out <- rbind(',
     ...rows.flatMap((r,i)=>i===rows.length-1?[r+')']:[r+',']),
     'print(table_out)', 'cat("target exceedance rate", 1 - alpha, "\\n")'],
    T('三个模型使用同一段样本外日期、同一置信水平和同一本金；Kupiec 只检验无条件覆盖，不检验超限独立性。','All three models use the same out-of-sample days, confidence level and notional; Kupiec only tests unconditional coverage, not exceedance independence.'),
    String.raw`LR_{uc}=2\left[x\log\frac{x/n}{p_0}+(n-x)\log\frac{1-x/n}{1-p_0}\right]`);
  if(mode==='full'){
    add('plot',T('当前主题绘图','Plot for the current view'),
      ['plot(day, loss, type = "l", col = "grey55", xlab = "Day", ylab = "Loss (CNY)",',
       '  main = "Out-of-sample loss and VaR")',
       'lines(day, VaR_ewma[day], lty = 2, col = "purple")',
       'lines(day, VaR_rf, col = "steelblue")',
       ...(mode==='full'?['lines(day, VaR_lstm, lty = 2, col = "darkgreen")']:[]),
       'legend("topright", c("Loss", "EWMA", "Forest", "LSTM"), lty = c(1, 2, 1, 2),',
       '  col = c("grey55", "purple", "steelblue", "darkgreen"), bty = "n")'],
      T('图只画当前 VaR 路径；完整表格在控制台输出，便于逐项核对。','The figure draws the current VaR paths; the full table is printed so every item can be checked.'));
  }
  const chosen=mode==='basic'?blocks.filter(b=>['data','backtest'].includes(b.key)):blocks;
  return{blocks:chosen,script:'# FinModel Lab | Experiment 07 AI risk forecasting\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n',mode,lang};
}
return{build,vec};
});
