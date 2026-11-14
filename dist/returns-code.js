/* Experiment03 · R script builder: stock returns, bond analytics and the
   distribution of returns. Base R only, comments follow the UI language. */
(function(root,factory){const api=factory(typeof module==='object'?require('./returns-math'):root.ReturnsMath);if(typeof module==='object')module.exports=api;else root.ReturnsCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(15).replace(/0+e/,'e'):s;};
const rv=(r)=>'c('+r.map(v=>num(Number(v.toFixed(12)))).join(', ')+')';
function build(p,view='stock',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];const add=(key,title,lines,explain,formula='')=>blocks.push({key,title,lines,explain,formula});
  const s=M.stock(p),b=M.bond(p),d=M.distribution(p);
  if(view==='stock'){
    add('simple',T('简单收益与对数收益','Simple and log returns'),
      ['# Experiment 03 | returns | stocks and bonds | base R',
       T('# 参数：期初价格、期末价格、期间股息','# Parameters: initial price, terminal price, dividends received'),
       `p0 <- ${num(p.p0)}`, `p1 <- ${num(p.p1)}`, `div <- ${num(p.dividend)}`, `periods <- ${p.periods}L`,
       'simple <- p1 / p0 - 1', 'logret <- log(p1 / p0)',
       'print(c(simple = simple, log = logret))',
       T('# 简单收益可跨期相加近似；对数收益可加，但单位不是金额','# Simple returns add across assets; log returns add over time but are not currency amounts'),
       'cat("simple * 100 =", simple * 100, "\\n")'],
      T('简单收益回答"赚了多少比例"，对数收益回答"连续复利下的增长率"。两者只在收益率较小时接近。','A simple return answers "what fraction was gained"; a log return answers "the continuously compounded growth rate". They only agree for small returns.'));
    add('total',T('股息调整总收益','Dividend-adjusted total return'),
      [T('# 总收益必须包含现金股息，否则会低估长期回报','# Total return must include cash dividends, otherwise long-run performance is understated'),
       'total <- (p1 + div) / p0 - 1',
       'div_yield <- div / p0',
       'print(c(total = total, price_only = simple, dividend_yield = div_yield))',
       T('# 多期年化：几何年化用复合，算术年化会高估长期回报','# Multi-period annualisation: geometric compounds, arithmetic overstates long-run growth'),
       'geo_annual <- (1 + total)^(1 / periods) - 1',
       'print(c(geometric_annual = geo_annual))'],
      T('总收益把价格变动与股息都算进来；年化必须用几何平均，算术平均只适合描述单期。','Total return combines price change and dividends; annualising must use the geometric mean, while the arithmetic mean only describes one period.'));
    add('compare',T('三种口径对照','Three conventions compared'),
      [T('# 同一笔投资在三种口径下的结果','# The same investment under three conventions'),
       `out <- data.frame(convention = c("price only", "log", "total"),`,
       '  value = c(simple, logret, total),',
       '  annualised = c((1 + simple)^(1 / periods) - 1, logret / periods, (1 + total)^(1 / periods) - 1))',
       'print(out)'],
      T('三种口径不能混用：报告"年化收益"时必须说明是价格收益还是总收益、几何还是算术。','The three conventions cannot be mixed: an annualised figure must state price versus total return and geometric versus arithmetic.'));
  }
  if(view==='bond'){
    add('price',T('债券价格、应计利息与全价','Bond price, accrued interest and dirty price'),
      [T('# 现金流贴现：每期票息加到期面值，按 y/f 贴现','# Discount each coupon and the face value at y/f'),
       `face <- ${num(p.face)}; coupon <- ${num(p.coupon)}; freq <- ${p.freq}L`,
       `maturity <- ${num(p.maturity)}; ytm <- ${num(p.ytm)}; t_since <- ${num(p.tSince)}`,
       'cpn <- face * coupon / freq',
       'left <- 1 - t_since',
       'n <- round(maturity * freq)',
       'idx <- 0:(n - 1)',
       'amount <- rep(cpn, n); amount[n] <- amount[n] + face',
       'pv <- amount / (1 + ytm / freq)^(idx + left)',
       'dirty <- sum(pv)',
       'accrued <- cpn * t_since',
       'clean <- dirty - accrued',
       'print(c(clean = clean, accrued = accrued, dirty = dirty))'],
      T('全价＝净价＋应计利息；报价通常用净价，结算用全价。','Dirty price = clean price + accrued interest. Quotes usually use the clean price while settlement uses the dirty price.'),
      String.raw`P=\sum_{k=0}^{n-1}\frac{c+F\mathbf{1}_{k=n-1}}{(1+y/f)^{k+1-w}}+`);
    add('duration',T('久期与凸性','Duration and convexity'),
      [T('# 麦考利久期是现金流时间的现值加权平均','# Macaulay duration is the present-value-weighted average time'),
       'w <- pv / dirty',
       't_k <- (idx + left) / freq',
       'macaulay <- sum(t_k * w)',
       'modified <- macaulay / (1 + ytm / freq)',
       'convexity <- sum(t_k * (t_k + 1 / freq) * w) / (1 + ytm / freq)^2',
       'print(c(macaulay = macaulay, modified = modified, convexity = convexity))',
       'dv01 <- -modified * dirty * 1e-4',
       'cat("DV01 (per 1bp):", dv01, "\\n")'],
      T('修正久期给出收益率变动 1% 时价格的近似百分比变化；凸性修正大幅变动时的非线性。','Modified duration gives the approximate percentage price change for a one-percent yield move; convexity corrects the curvature for large moves.'),
      String.raw`D_{mod}=\frac{D_{mac}}{1+y/f},\quad \Delta P\approx -D_{mod}P\Delta y+\tfrac12 C P(\Delta y)^2`);
    add('hpr',T('持有期收益','Holding-period return'),
      [T('# 持有期内收到票息，到期前按新收益率卖出','# Coupons are received and the bond is sold at a new yield'),
       `exit_ytm <- ${num(p.exitYtm)}; hold <- ${num(p.holdYears)}`,
       'remain <- round((maturity - hold) * freq)',
       'k <- 0:(remain - 1)',
       'cash <- rep(cpn, remain); cash[remain] <- cash[remain] + face',
       'exit_price <- sum(cash / (1 + exit_ytm / freq)^(k + 1))',
       'coupons <- cpn * round(hold * freq)',
       'hpr <- (exit_price + coupons - dirty) / dirty',
       'print(c(exit_price = exit_price, coupons = coupons, hpr = hpr))',
       T('# 分解：票息收益 + 资本利得（含收益率变动）','# Decompose into coupon income and capital gain including the yield change'),
       'print(c(coupon_part = coupons / dirty, capital_part = (exit_price - dirty) / dirty))'],
      T('持有期收益把票息与卖出价差放在一起；它依赖假设的卖出收益率，不是承诺收益。','Holding-period return combines coupons and the sale price difference; it depends on the assumed exit yield and is not a promised return.'));
  }
  if(view==='dist'||view==='qq'){
    add('dist',T('收益分布的四阶矩','Four moments of the return distribution'),
      [T('# 固定种子生成的合成日收益：偶发跳跃制造厚尾','# Synthetic daily returns from a fixed seed: jumps create fat tails'),
       T('# 与网页逐项一致的确定性样本（固定种子，非真实行情）','# Deterministic sample identical to the page (fixed seed, not a market quote)'),
       `r <- ${rv(d.r)}`,
       'center <- mean(r); spread <- sd(r); n <- length(r)',
       'z <- (r - center) / spread',
       'skew <- length(r) / ((length(r) - 1) * (length(r) - 2)) * sum(z^3)',
       'kurt <- length(r) * (length(r) + 1) / ((length(r) - 1) * (length(r) - 2) * (length(r) - 3)) * sum(z^4) - 3 * (length(r) - 1) / (length(r) - 2)',
       'jb <- length(r) / 6 * (skew^2 + kurt^2 / 4)',
       'print(c(mean = center, sd = spread, skew = skew, kurt = kurt, jb = jb))',
       'cat("JB p-value:", pchisq(jb, 2L, lower.tail = FALSE), "\\n")'],
      T('均值与标准差描述位置和尺度，偏度与峰度描述形状；Jarque–Bera 把后两者合成一个正态性检验。','Mean and standard deviation describe location and scale; skewness and kurtosis describe shape; Jarque–Bera combines the two into a normality test.'),
      String.raw`JB=\frac{n}{6}\left(S^2+\frac{(K-3)^2}{4}\right)\sim\chi^2_2`);
    add('annual',T('年化的口径陷阱','The annualisation trap'),
      [T('# 均值与波动率可以乘 252 / √252，高阶矩不能这样缩放','# Mean and volatility scale by 252 and √252; higher moments do not'),
       'print(c(annual_arith = center * 252, annual_compound = (1 + center)^252 - 1, annual_vol = spread * sqrt(252)))',
       T('# 复合年化必须用实际路径，不能用均值乘 252','# Compounding must use the realised path, not the mean times 252'),
       `level <- 100 * exp(sum(log1p(r)))`,
       'print(c(level = level, compound_from_path = (level / 100)^(1 / (n / 252)) - 1))'],
      T('"年化收益"必须说明是算术还是复合、是否含股息、用多少天；年化偏度没有意义。','An annualised figure must state arithmetic versus compound, whether dividends are included and the day count; annualising skewness is meaningless.'));
    if(mode==='full'){
      add('plot',T('直方图与正态参照','Histogram and the normal reference'),
        [T('# 同一均值与标准差的正态曲线只作为形状参照','# A normal curve with the same mean and standard deviation is only a shape reference'),
         'hist(r, breaks = "FD", probability = TRUE, xlab = "daily simple return", main = "Synthetic daily returns")',
         'curve(dnorm(x, center, spread), add = TRUE, lty = 2)',
         'qqnorm(r); qqline(r)',
         'boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")'],
        T('直方图看整体形状，QQ 图看两端偏离，箱线图看单点异常；三者不能互相替代。','The histogram shows overall shape, the QQ plot shows tail departures and the box plot shows single observations; none replaces the others.'));
    }
  }
  const chosen=mode==='basic'?blocks.slice(0,2):blocks;
  return{blocks:chosen,code:'# FinModel Lab | Experiment 03 | asset returns\n\n'+chosen.map(b=>b.lines.join('\n')).join('\n\n')+'\n'};
}
return{build};
});
