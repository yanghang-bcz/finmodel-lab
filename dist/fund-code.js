/* Experiment12 · R script builder: metrics, timing regressions, Treynor-Black
   and return-based attribution on the embedded synthetic fund series. */
(function(root,factory){const api=factory(typeof module==='object'?require('./fund-math'):root.FundMath);if(typeof module==='object')module.exports=api;else root.FundCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
const vec=a=>'c('+a.map(v=>num(Number(v.toFixed(10)))).join(', ')+')';
function build(p,view='metrics',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const d=M.sample(p);
  add('data',T('基金、基准与无风险利率','Fund, benchmark and risk-free rate'),
    ['# Experiment 12 | fund performance | base R only',
     T('# 合成月度序列：真实 alpha、beta 与择时能力已固定；非真实基金或指数','# Synthetic monthly series with documented alpha, beta and timing ability; not a real fund or index'),
     `fund <- ${vec(d.fund)}`, `mkt <- ${vec(d.mkt)}`, `rf <- ${vec(d.rf)}`,
     'x <- mkt - rf', 'y <- fund - rf',
     T('# 统一的年化与 CAPM 估计，后面每个口径都复用','# Shared annualisation and CAPM estimate, reused everywhere below'),
     'ann <- function(v) (1 + mean(v))^12 - 1',
     'fit <- lm(y ~ x)',
     'alpha <- unname(coef(fit)[1]); beta <- unname(coef(fit)[2])',
     'sharpe <- mean(y) / sd(y) * sqrt(12)',
     'stopifnot(length(fund) == length(mkt), all(is.finite(y)))'],
    T('所有指标都基于同一段月度超额收益；超额收益是相对无风险利率，不是相对基准。','Every metric uses the same monthly excess returns; excess means over the risk-free rate, not over the benchmark.'));
  if(view==='metrics'){
    add('metrics',T('单因素整体绩效','Single-factor performance'),
      [T('# 年化用复合，波动率乘 √12；Sharpe 与 Treynor 的分子相同、分母不同','# Annualise by compounding, scale volatility by sqrt(12); Sharpe and Treynor share a numerator but not a denominator'),
       'vol <- sd(fund) * sqrt(12)',
       'treynor <- mean(y) / beta',
       'tracking <- sd(resid(fit))',
       'ir <- mean(fund - mkt) / tracking',
       'dd <- cumprod(1 + fund); mdd <- min(dd / cummax(dd) - 1)',
       'print(c(ann = ann(fund), vol = vol, sharpe = sharpe, treynor = treynor,',
       '  alpha = alpha, ir = ir, mdd = mdd, calmar = ann(fund) / -mdd))'],
      T('Sharpe 用总风险，Treynor 用系统性风险，Jensen alpha 是回归截距；三者不能被单独引用为"业绩好"。','Sharpe uses total risk, Treynor systematic risk and Jensen alpha is the regression intercept; none alone proves good performance.'),
      String.raw`S=\frac{\bar r_p-r_f}{\sigma_p},\quad T=\frac{\bar r_p-r_f}{\beta_p},\quad \alpha_p=\bar r_p-r_f-\beta_p(\bar r_m-r_f)`);
  }
  if(view==='timing'){
    add('timing',T('选股与择时','Selection and market timing'),
      [T('# 择时模型在 CAPM 上加入"上涨期 beta 更高"的项','# The timing model adds a higher beta in up markets'),
       'tm <- lm(y ~ x + I(x^2))',
       'hm <- lm(y ~ x + I(pmax(x, 0)))',
       'print(summary(tm)$coefficients)',
       'print(summary(hm)$coefficients)',
       T('# 截距是选股能力，二次项/上行项系数是择时能力','# The intercept is selection and the quadratic or up-market term is timing'),
       'cat("HM timing coefficient:", coef(hm)[3], "\\n")'],
      T('Treynor–Mazuy 与 Henriksson–Merton 都在检验"beta 是否随市场状态变化"；截距与择时项高度相关，样本短时难以分离。','Treynor–Mazuy and Henriksson–Merton both test whether beta changes with the market state; the intercept and the timing term are correlated and hard to separate in short samples.'),
      String.raw`r_p-r_f=a+b(r_m-r_f)+c(r_m-r_f)^2+e`);
  }
  if(view==='tb'){
    add('tb',T('Treynor-Black 主动组合','The Treynor-Black active portfolio'),
      [T('# 主动组合权重 = (alpha/active variance) / (market price of risk)','# Active weight = (alpha / active variance) / market price of risk'),
       'sigma_e <- sd(resid(fit))',
       'sigma_a2 <- beta^2 * var(x) + sigma_e^2',
       'w_active <- (alpha / sigma_a2) / (mean(x) / var(x))',
       'w_star <- w_active / (1 + w_active)',
       'combo <- w_star * fund + (1 - w_star) * mkt',
       'print(c(w_active = w_active, w_star = w_star, sharpe_fund = sharpe,',
       '  sharpe_combo = mean(combo - rf) / sd(combo - rf) * sqrt(12)))'],
      T('Treynor-Black 用 alpha 与特质风险构造主动组合，再与市场组合混合；它依赖 alpha 估计的稳定性。','Treynor-Black builds an active portfolio from alpha and idiosyncratic risk, then blends it with the market portfolio; it depends on the stability of the alpha estimate.'),
      String.raw`w_A=\frac{\alpha_A/\sigma_A^2}{E(R_M)/\sigma_M^2},\quad w^*=\frac{w_A}{1+w_A}`);
  }
  if(view==='attr'){
    add('attr',T('收益归因','Return attribution'),
      [T('# 超额收益分解为市场暴露、选择能力与残差三部分','# Excess return splits into market exposure, selection and residual'),
       'total <- mean(y) * 12',
       'factor_part <- beta * mean(x) * 12',
       'alpha_part <- alpha * 12',
       'residual <- total - factor_part - alpha_part',
       'print(c(total = total, market = factor_part, selection = alpha_part, residual = residual))',
       T('# 三部分相加必须等于总额；不相等说明计算或口径有误','# The three parts must add to the total; otherwise the calculation or the convention is wrong'),
       'stopifnot(abs(total - (factor_part + alpha_part + residual)) < 1e-9)'],
      T('归因把"赚了多少"拆成"市场给的"和"经理创造的"；残差为零是恒等式，不代表模型完整。','Attribution splits the return into what the market paid and what the manager added; a zero residual is an identity, not evidence of a complete model.'),
      String.raw`\bar r_p-\bar r_f=\beta_p(\bar r_m-\bar r_f)+\alpha_p+\bar e_p`);
  }
  if(view==='ai'){
    add('review',T('AI 摘要里要核对的三句话','Three sentences in the AI summary that need checking'),
      [T('# 把 AI 摘要拆成可检验的断言，每条都指回具体表格','# Split the AI summary into testable claims, each pointing back to a table'),
       'sharpe_fund <- mean(y) / sd(y) * sqrt(12)',
       'sharpe_mkt <- mean(x) / sd(x) * sqrt(12)',
       'hm <- lm(y ~ x + I(pmax(x, 0)))',
       'print(c(sharpe_fund = sharpe_fund, sharpe_mkt = sharpe_mkt,',
       '  hm_timing = coef(hm)[3], hm_t = summary(hm)$coefficients[3, 3]))',
       T('# 断言 1：夏普高说明择时能力 → 错误；夏普不识别收益来源','# Claim 1: high Sharpe implies timing → wrong; Sharpe does not identify the source of returns'),
       'print(c(alpha_monthly = alpha, alpha_t = summary(fit)$coefficients[1, 3],',
       '  alpha_annual = (1 + alpha)^12 - 1))',
       T('# 断言 2：显著 α 可线性外推 → 过度外推；需区间与样本外','# Claim 2: significant alpha extrapolates → over-extrapolation; needs an interval and out-of-sample'),
       'total <- mean(y) * 12',
       'print(c(total, beta_part = beta * mean(x) * 12, alpha_part = alpha * 12,',
       '  residual = total - beta * mean(x) * 12 - alpha * 12))',
       T('# 断言 3：归因全部归功于经理 → 恒等式不等于因果','# Claim 3: attribution credits the manager → an identity is not causation')],
      T('AI 摘要必须先被拆成可检验断言；每条断言都要能指回一张表，否则不能写进报告。','An AI summary must first be split into testable claims; each claim must point back to a table, otherwise it cannot go into the report.'));
    add('checklist',T('审查清单','Review checklist'),
      ['checks <- c(',
       '  "先问指标能识别什么", "alpha 与择时系数一起看",',
       '  "样本内显著不等于样本外可用", "归因相加是恒等式",',
       '  "任何 AI 摘要都要能指回具体表格")',
       'print(checks)'],
      T('清单只记录"审查了什么"，不记录"AI 说得对不对"。','The checklist records what was reviewed, not whether the AI was right.'));
  }
  if(mode==='full'){
    add('plot',T('净值与回撤','Net asset value and drawdown'),
      [T('# 基金与基准的累计净值，以及基金的回撤路径','# Cumulative NAV for the fund and the benchmark, plus the fund drawdown'),
       'nav <- cumprod(1 + fund); nav_mkt <- cumprod(1 + mkt)',
       'dd <- nav / cummax(nav) - 1',
       'plot(nav, type = "l", ylim = range(c(nav, nav_mkt)), xlab = "Month", ylab = "NAV",',
       '  main = "Fund and benchmark")',
       'lines(nav_mkt, lty = 2)',
       'plot(dd, type = "l", xlab = "Month", ylab = "Drawdown", main = "Drawdown")'],
      T('净值曲线看累积结果，回撤曲线看路径风险；两条曲线都不能证明未来表现。','The NAV curve shows the cumulative outcome and the drawdown curve the path risk; neither proves future performance.'));
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 12 | fund performance\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});
