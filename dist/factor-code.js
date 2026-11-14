/* Experiment10 · R script builder for the factor lab. The synthetic panel is
   embedded so every beta, IC and quantile in R matches the page. */
(function(root,factory){const api=factory(typeof module==='object'?require('./factor-math'):root.FactorMath);if(typeof module==='object')module.exports=api;else root.FactorCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
function mat(rows,per=12){
  const lines=rows.map(r=>'  c('+r.map(v=>num(Number(v.toFixed(10)))).join(', ')+')');
  return 'rbind(\n'+lines.join(',\n')+'\n)';
}
function build(p,view='ff3',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const P=M.panel(p),names=M.setOf(p.factors),L=M.FACTOR_LABEL;
  const common=[
    '# Experiment 10 | factor models and APT | base R only',
    T('# 合成面板：24 只资产 × 60 个月，真实载荷与真实 alpha 已在网页标注；非真实行情','# Synthetic panel: 24 assets x 60 months with documented loadings and alphas; not a market quote'),
    `F <- cbind(mkt = ${'c('+P.f.mkt.map(v=>num(Number(v.toFixed(10)))).join(', ')+')'},`,
    `  smb = c(${P.f.smb.map(v=>num(Number(v.toFixed(10)))).join(', ')}),`,
    `  hml = c(${P.f.hml.map(v=>num(Number(v.toFixed(10)))).join(', ')}))`,
    `R <- ${mat(P.r)}`,
    `asset <- ${p.asset}L`,
    `cols <- c(${names.map(n=>'"'+n+'"').join(', ')})`,
    'stopifnot(ncol(R) == nrow(F), all(is.finite(R)))'
  ];
  add('data',T('因子与资产收益面板','Factor and asset return panel'),common,
    T('矩阵 R 的每一行是一张资产的时间序列，列是月份；因子矩阵 F 的行是月份。因子是教学假设，不是可交易指数。','Each row of R is one asset time series and each column a month; rows of F are months. The factors are teaching assumptions, not tradable indices.'));
  if(view==='ff3'){
    add('regression',T('时间序列回归与 alpha','Time-series regression and alpha'),
      [T('# 每张资产对所选因子集做一次 OLS','# One OLS per asset on the chosen factor set'),
       'y <- R[asset, ]',
       'fit <- lm(y ~ F[, cols, drop = FALSE])',
       's <- summary(fit)',
       'print(round(s$coefficients, 6))',
       'cat("R-squared:", s$r.squared, "\\n")',
       T('# alpha 是截距；对单张资产做多次检验时，显著性会被数据挖掘放大','# Alpha is the intercept; testing many assets inflates significance through data mining'),
       'print(round(coef(fit), 6))'],
      T('alpha 是因子无法解释的平均超额收益；单张资产的 alpha 显著不等于存在套利机会。','Alpha is the average excess return the factors cannot explain; a significant alpha for one asset is not an arbitrage opportunity.'),
      String.raw`r_{i,t}-r_f=\alpha_i+\beta_i'\lambda_t+\varepsilon_{i,t}`);
  }
  if(view==='ff3'){
    add('plot',T('因子与残差图','Factors and residual plots'),
      [T('# 先看收益与因子走势，再看拟合值与残差','# Look at the return and factor paths, then at fitted values and residuals'),
       'plot(y, type = "l", xlab = "month", ylab = "asset return", main = "Asset return")',
       'matplot(F[, cols, drop = FALSE], type = "l", lty = 1, xlab = "month", ylab = "factor return")',
       'plot(fitted(fit), resid(fit), xlab = "fitted", ylab = "residual", main = "Residuals vs fitted")',
       'abline(h = 0, lty = 2)'],
      T('残差图用于检查非线性、异方差与异常点；它不检验因子是否"正确"。','Residual plots check non-linearity, heteroskedasticity and outliers; they do not test whether the factors are "correct".'));
  }
  if(view==='ai'){
    const cands=M.aiCandidates(p);
    add('cands',T('候选因子','Candidate factors'),
      [T('# 三个候选：价值多空、纯噪声、HML 复制；协议先看先验与冗余，再看价差','# Three candidates: value spread, pure noise, HML copy; the protocol checks prior and redundancy before spreads'),
       ...cands.map((c,i)=>`cand${i+1} <- c(${c.series.map(v=>num(Number(v.toFixed(10)))).join(', ')})`),
       'cands <- list(value = cand1, sentiment = cand2, hmlcopy = cand3)',
       'stopifnot(length(cand1) == ncol(R))'],
      T('候选因子序列与资产收益面板按月份对齐；候选的经济含义写在页面表格里。','Candidate series are aligned by month with the return panel; each candidate rationale is printed on the page.'));
    add('screen',T('五步协议筛选','Five-step screening protocol'),
      [T('# 按载荷分组算多空价差；协议要求先验、覆盖、低冗余、样本内外价差同号','# Sort by loading and compute the spread; the protocol requires a prior, coverage, low redundancy and the same sign in and out of sample'),
       'half <- floor(ncol(R)/2)',
       'screen <- function(cand) {',
       '  spread <- function(from, to) {',
       '    load <- apply(R[, from:to, drop = FALSE], 1, function(y) coef(lm(y ~ cand[from:to]))[2])',
       '    o <- order(load); k <- max(2, floor(nrow(R) / 3))',
       '    low <- o[seq_len(k)]; high <- o[(length(o) - k + 1):length(o)]',
       '    mean(rowMeans(R[high, from:to, drop = FALSE]) - rowMeans(R[low, from:to, drop = FALSE]))',
       '  }',
       '  c(corr_hml = cor(cand, F[, "hml"]), in_sample = spread(1, half), out_sample = spread(half + 1, ncol(R)))',
       '}',
       'print(t(vapply(cands, screen, numeric(3))))'],
      T('价差为正只说明"高载荷组合跑赢低载荷组合"，不等于可交易；冗余检查先淘汰与 HML 重复的候选。','A positive spread only says high-loading assets beat low-loading ones; it is not tradability. The redundancy check removes candidates that duplicate HML.'));
  }
  if(view==='apt'){
    add('apt',T('两步法横截面检验','Two-pass cross-sectional test'),
      [T('# 第一步：每张资产估计 beta；第二步：横截面回归平均超额收益','# Step 1 estimates betas, step 2 regresses mean excess returns on them'),
       'betas <- t(vapply(seq_len(nrow(R)), function(i) {',
       '  coef(lm(R[i, ] ~ F[, cols, drop = FALSE]))[-1]',
       '}, numeric(length(cols))))',
       'mean_ex <- rowMeans(R)',
       'cs <- lm(mean_ex ~ betas)',
       'print(summary(cs)$coefficients)',
       T('# 横截面 R² 很高也不证明 APT 成立：beta 本身由同一份数据估计','# A high cross-sectional R2 does not prove APT: the betas are estimated from the same data'),
       'cat("cross-sectional R-squared:", summary(cs)$r.squared, "\\n")'],
      T('横截面回归的斜率是对因子风险价格的估计；样本内两步法存在生成回归量问题，标准误需要修正。','The cross-sectional slopes estimate factor risk prices; the in-sample two-pass estimator has a generated-regressor problem and its standard errors need correction.'),
      String.raw`\bar r_i=\gamma_0+\gamma_1\hat\beta_{i,mkt}+\gamma_2\hat\beta_{i,smb}+\gamma_3\hat\beta_{i,hml}+u_i`);
  }
  if(view==='ic'){
    add('ic',T('因子 IC 与 Rank IC','Factor IC and rank IC'),
      [T('# 每个月做一次横截面相关：特征 vs 当月收益','# Each month: cross-sectional correlation between the characteristic and that month return'),
       `char <- c(${P.chars[p.char].map(v=>num(Number(v.toFixed(10)))).join(', ')})`,
       `split <- ${p.split}`,
       T('# 只用样本内月份，与页面一致','# Use the in-sample months only, matching the page'),
       't_use <- seq.int(2L, floor(ncol(R) * split) + 1L)',
       'ic <- vapply(t_use, function(t) cor(char, R[, t], method = "pearson"), numeric(1))',
       'rank_ic <- vapply(t_use, function(t) cor(char, R[, t], method = "spearman"), numeric(1))',
       'print(c(mean_ic = mean(ic), mean_rank_ic = mean(rank_ic),',
       '  ir = mean(rank_ic) / sd(rank_ic), hit = mean(rank_ic > 0)))',
       T('# IC 的 t 值用月度序列的均值和标准差计算，不假设独立同分布','# The IC t statistic uses the monthly mean and standard deviation; independence is not assumed'),
       'cat("t:", mean(rank_ic) / (sd(rank_ic) / sqrt(length(rank_ic))), "\\n")'],
      T('IC 衡量特征与下一期收益的横截面排序关系；它只是候选证据，样本外与换手成本才决定能否使用。','IC measures the cross-sectional rank relation between a characteristic and next-period returns; it is only candidate evidence, and out-of-sample behaviour and turnover costs decide usability.'),
      String.raw`IC_t=\operatorname{corr}\left(z_{i,t},r_{i,t+1}\right),\quad IR=\frac{\overline{IC}}{\sigma(IC)}`);
  }
  if(view==='sort'){
    add('sort',T('分组回测与多空组合','Sorted portfolios and the long-short spread'),
      [T('# 按特征排序后五等分，等权持有，逐月计算收益','# Sort by the characteristic, split into quintiles, equal weight and compute monthly returns'),
       `char <- c(${P.chars[p.char].map(v=>num(Number(v.toFixed(10)))).join(', ')})`,
       T('# 与页面一致：排序后按 5,5,5,5,4 的分组大小切分','# Same as the page: sort then cut into groups of 5,5,5,5,4'),
       'ord <- order(char)',
       'grp <- integer(length(char)); grp[ord] <- rep(1:5, each = ceiling(length(char) / 5))[seq_along(char)]',
       'q <- grp',
       'means <- t(vapply(seq_len(5), function(g) colMeans(R[q == g, , drop = FALSE]), numeric(ncol(R))))',
       'print(round(rowMeans(means), 6))',
       'ls <- means[5, ] - means[1, ]',
       'print(c(long_short_mean = mean(ls), t = mean(ls) / (sd(ls) / sqrt(length(ls)))))',
       T('# 多空组合的收益是排序价差，不是可实现的套利收益','# The long-short return is a sorted spread, not a realisable arbitrage return'),
       'print(head(t(apply(means, 1, function(x) cumprod(1 + x))), 3))'],
      T('分组回测检验特征是否单调地对应收益；2–3 只资产一组时噪声很大，且未计交易成本。','The sorted backtest checks whether the characteristic maps monotonically into returns; with 2-3 assets per group the noise is large and trading costs are ignored.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 10 | factor models and APT\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});
