/* Experiment01 R script builder. Every view produces one standalone base-R
   script that runs in a fresh session; comments follow the active UI language. */
(function(root,factory){const api=factory(typeof module==='object'?require('./rbasic-math'):root.RBasicMath);if(typeof module==='object')module.exports=api;else root.RBasicCode=api;})(this,M=>{
'use strict';
const num=v=>{const s=String(Number(v));return /e/i.test(s)?Number(v).toPrecision(12).replace(/0+e/,'e'):s;};
function vec(values,per=8){
  const parts=values.map(v=>v===null?'NA_real_':num(v));
  const lines=[];for(let i=0;i<parts.length;i+=per)lines.push('  '+parts.slice(i,i+per).join(', '));
  return 'c(\n'+lines.join(',\n')+'\n)';
}
function build(p,view='struct',mode='full',lang='zh'){
  const T=(zh,en)=>lang==='en'?en:zh;
  const blocks=[];
  const add=(key,title,action,econ,lines,extra={})=>{const b={key,title,action,economic:econ,lines,core:extra.core!==false,...extra};blocks.push(b);return b;};
  const header=T('# 实验01 · 基础 R 完整脚本：只需 base R，无需额外程序包','# Experiment 01 · complete base-R script: no extra packages required');

  if(view==='env'){
    const w=M.workspace(p);
    add('checks',[ '运行环境自检','Environment check'],
      ['先确认工作目录、R 版本与已加载的包，再开始计算。','Confirm the working directory, R version and loaded packages before computing.'],
      ['这一切是后续所有复现的前提。','This is the precondition for every later reproduction.'],
      [`${header}`,T('getwd()','getwd()'),T('# 当前工作目录：脚本里的相对路径都从它开始','# Current working directory: relative paths start here'),
       'sessionInfo()',T('# R 版本、平台和已加载的包；把这段输出保存到实验报告','# R version, platform and loaded packages; keep this output in the report')]);
    add('dirs',['目录与文件约定','Folders and file conventions'],
      ['把数据、脚本、结果、图片分目录存放，用相对路径引用。','Keep data, scripts, results and figures in separate folders and use relative paths.'],
      ['可重复的研究结构比"能跑一次"更重要。','A reproducible project structure matters more than a one-off run.'],
      [`dirs <- c(${w.dirs.map(d=>'"'+d+'"').join(', ')})`,
       T('# 只创建缺失的目录，重复运行安全','# Create only missing folders; safe to rerun'),
       'for (d in dirs) if (!dir.exists(d)) dir.create(d, showWarnings = FALSE)',
       'list.files()',T('# 核对四个目录都已存在','# Check that all four folders exist')]);
    add('seed',['随机种子与命名','Seeding and naming'],
      ['固定 seed，并用前缀区分数据对象与模型对象。','Fix the seed and use prefixes to separate data objects from model objects.'],
      ['同一 seed、同一版本 R 才可复现；换机器或换版本仍可能有细小差异。','Reproducibility holds for the same seed and the same R version; another machine or version may still differ.'],
      [`set.seed(${w.seed})`,T('# 与网页相同的种子；改种子会改变所有模拟结果','# Same seed as the page; changing it changes every simulation'),
       'd_demo <- data.frame(id = 1:5, y = c(2.1, 2.4, 3.0, 3.1, 3.6))',
       T('str(d_demo)                # 结构：5 行 2 列，两列都是数值','str(d_demo)                # Structure: 5 rows, 2 numeric columns')]);
    add('guard',['先检查，再计算','Check first, compute second'],
      ['用 stopifnot() 把前提写成可执行断言。','Turn assumptions into executable assertions with stopifnot().'],
      ['断言失败会立即停下，避免把错误结果当成结论。','A failed assertion stops the script instead of turning a wrong result into a conclusion.'],
      ['stopifnot(is.data.frame(d_demo), nrow(d_demo) == 5)',
       T('mean(d_demo$y)             # 2.84','mean(d_demo$y)             # 2.84'),
       T('# 若写成 mean(d_demo$z)，R 会报"对象不存在"，先用 names() 确认列名','# mean(d_demo$z) errors with "object not found"; check names() first'),
       'names(d_demo)']);
    add('flow',['会话流程','Session workflow'],
      ['六个步骤对应本实验的目录结构与后续每个实验。','Six steps map onto the folder layout and every later experiment.'],
      ['脚本按步骤拆文件，比一个巨型脚本更容易查错。','Splitting the script by step is easier to debug than one giant file.'],
      [T('# 步骤与文件一一对应','# One file per step'),...w.files.map((f,i)=>`# ${i+1}. ${f}`)]);
    if(mode==='full'){
      add('out',['结果落地','Persist the results'],
        ['表格写 CSV、图形写图片，文件名带日期或版本号。','Write tables to CSV and figures to image files, named with a date or version.'],
        ['只有落地的结果才能被复核。','Only persisted results can be re-checked.'],
        ['write.csv(d_demo, "output/demo.csv", row.names = FALSE)',
         T('# 图形设备：先打开再画，最后务必 dev.off()','# Graphics device: open, draw, then always dev.off()'),
         'png("figures/demo-scatter.png", width = 800, height = 600)',
         'plot(d_demo$id, d_demo$y, xlab = "id", ylab = "y", main = "Demo")',
         'dev.off()'],{core:false});
    }
  }

  if(view==='struct'){
    const s=M.structures(p);
    add('vector',['向量','Vector'],
      ['c() 把数值合并成一个向量；length/typeof 回答"多长、什么类型"。','c() combines values into one vector; length/typeof answer "how long, what type".'],
      ['向量是最小单位，矩阵、列表、数据框都建立在它之上。','The vector is the primitive; matrices, lists and data frames build on it.'],
      [`v <- ${vec(s.vector,6)}`,'length(v)',T('typeof(v)                  # "double"','typeof(v)                  # "double"'),'v[c(1, 3)]',T('v[v > 3]                   # 逻辑索引','v[v > 3]                   # Logical indexing')]).value=[`长度 ${s.vector.length} 的数值向量。`,`A numeric vector of length ${s.vector.length}.`];
    add('matrix',['矩阵','Matrix'],
      ['matrix() 用同一个向量按列或按行填充，dim 描述行列数。','matrix() recycles one vector by column or by row; dim gives the shape.'],
      ['矩阵运算（乘法、转置、求解）是投资组合与回归的底层工具。','Matrix algebra (product, transpose, solve) underlies portfolios and regression.'],
      [`m <- matrix(v, nrow = ${s.rows}, byrow = ${s.rows===1?'TRUE':'FALSE'})`,'dim(m)','m[1, ]',T('m[, 1]                     # 列索引','m[, 1]                     # Column index'),'t(m)']).value=[`${s.rows} × ${s.cols} 矩阵，元素个数 ${s.rows*s.cols}。`,`A ${s.rows} × ${s.cols} matrix holding ${s.rows*s.cols} cells.`];
    add('list',['列表','List'],
      ['list() 可以装不同类型、不同长度的对象，用 $ 或 [[ ]] 取。','list() holds objects of different types and lengths; extract with $ or [[ ]].'],
      ['模型输出（系数、残差、诊断）通常就是列表。','Model output (coefficients, residuals, diagnostics) is usually a list.'],
      [`l <- list(name = "${T('股票A','Asset A')}", ret = v, meta = list(n = ${s.vector.length}, src = "synthetic"))`,'str(l)','l$ret','l[["ret"]]',T('l[1]                       # 单方括号仍是列表','l[1]                       # Single bracket keeps a list')]).value=[`3 个元素：字符、数值向量、嵌套列表。`,`Three elements: character, numeric vector, nested list.`];
    add('frame',['数据框','Data frame'],
      ['data.frame() 是等长的"列"，每列可不同类型；这是金融数据最常见的形式。','data.frame() is a set of equal-length columns, each with its own type — the usual shape of financial data.'],
      ['列名、行数、类型都要在建模前确认。','Confirm column names, row count and types before modelling.'],
      [`df <- data.frame(date = as.Date(c(${s.df.map(d=>'"'+d.date+'"').join(', ')})),`,
       `  ret = c(${s.df.map(d=>num(d.ret)).join(', ')}),`,
       `  price = c(${s.df.map(d=>num(d.price)).join(', ')}))`,
       'str(df)','class(df)','names(df)',T('df$ret * 100                # 列向量运算','df$ret * 100                # Column arithmetic'),
       T('as.matrix(df["ret"])       # 只取数值列转矩阵','as.matrix(df["ret"])       # Numeric column to matrix')]).value=[`${s.df.length} 行 × 3 列：Date、numeric、numeric。`,`${s.df.length} rows × 3 columns: Date, numeric, numeric.`];
    add('print',['打印与检查','Printing and inspection'],
      ['head/str/summary 是快速体检；str 在类型错误时最先暴露问题。','head/str/summary are quick health checks; str exposes type mistakes first.'],
      ['不要只看第一位小数，先看结构和量纲。','Do not stare at the third decimal before checking structure and units.'],
      ['head(df, 2)','summary(df)','sapply(df, class)']);
  }

  if(view==='index'){
    const ix=M.indexing(p);
    add('build',['构造含缺失的向量','Build a vector with missing values'],
      ['NA 表示"不知道"，不是 0；它会在运算中传播。','NA means "unknown", not zero, and it propagates through arithmetic.'],
      ['把 NA 当 0 会系统性低估风险。','Treating NA as zero systematically understates risk.'],
      [`x <- ${vec(ix.vector,7)}`,'length(x)','sum(is.na(x))',T('# 缺失位置由参数决定；R 中 NA 的类型是 logical，可放进数值向量','# Positions follow the parameters; NA is logical but fits a numeric vector')]).value=[`${ix.naCount} 个缺失值，位置 ${ix.naIdx.join('、')}。`,`${ix.naCount} missing value(s) at position(s) ${ix.naIdx.join(', ')}.`];
    add('subset',['索引三件事','Three ways to index'],
      ['位置、负位置、逻辑向量是最常用的三种索引。','Position, negative position and logical vectors are the three common forms.'],
      ['逻辑索引会自动丢弃 NA，需单独检查。','Logical indexing silently drops NA, so check for it separately.'],
      ['x[2]',T('x[-2]                      # 删除第 2 个元素','x[-2]                      # Drop element 2'),`x[x > ${num(ix.threshold)}]`,
       'which(is.na(x))',T('# 逻辑索引返回 TRUE 的元素；which 返回位置','# Logical indexing returns the TRUE elements; which returns positions')]).value=[`大于 ${ix.threshold} 的元素有 ${ix.above} 个。`,`${ix.above} elements exceed ${ix.threshold}.`];
    add('mean',['缺失如何影响均值','How NA changes the mean'],
      ['mean(x) 遇到 NA 直接返回 NA，这是"不假装知道"的正确行为。','mean(x) returns NA, which is the correct "do not pretend to know" behaviour.'],
      ['na.rm = TRUE 是显式删除，必须在报告中写明。','na.rm = TRUE is an explicit deletion that must be stated in the report.'],
      ['mean(x)',T('# [1] NA','# [1] NA'),'mean(x, na.rm = TRUE)',`median(x, na.rm = TRUE)`]).value=[`mean(x) = NA；mean(x, na.rm = TRUE) = ${ix.meanNaRm.toFixed(6)}。`,`mean(x) = NA; mean(x, na.rm = TRUE) = ${ix.meanNaRm.toFixed(6)}.`];
    add('fill',['填补与其代价','Filling and its cost'],
      ['只有确认缺失机制可接受时才填补；填补前保留原始副本。','Fill only when the missingness mechanism allows it, and keep the original copy.'],
      ['用中位数填补会压低方差，必须同时报告填补比例。','Median imputation shrinks variance; always report the imputed share.'],
      ['x_original <- x',`x[is.na(x)] <- median(x, na.rm = TRUE)`,'mean(x)',T('# 填补后均值与删除缺失不同：填补保留了样本量，也引入了人为的集中','# The filled mean differs from the deletion mean: filling keeps n and injects artificial clustering')]).value=[`中位数 ${ix.median}，填补后均值 ${((ix.meanNaRm*ix.clean.length+ix.median*ix.naCount)/p.length).toFixed(6)}。`,`Median ${ix.median}; filled mean ${((ix.meanNaRm*ix.clean.length+ix.median*ix.naCount)/p.length).toFixed(6)}.`];
  }

  if(view==='func'){
    const mc=M.monteCarlo(p);
    add('params',['参数','Parameters'],
      ['把参数集中写在开头，改一处就能重跑全部。','Keep parameters at the top so one edit reruns everything.'],
      ['参数写死在函数体里，复用时会改错。','Hard-coded parameters get changed wrongly when the script is reused.'],
      [`mu <- ${num(p.mu)}`, `sigma <- ${num(p.sigma)}`, `n <- ${p.n}`, `B <- ${p.draws}`, `seed <- ${p.seed}`]).value=[`μ = ${p.mu}，σ = ${p.sigma}，n = ${p.n}，B = ${p.draws}。`,`μ = ${p.mu}, σ = ${p.sigma}, n = ${p.n}, B = ${p.draws}.`];
    add('fn',['函数','Functions'],
      ['函数把"输入—计算—输出"封装起来，参数有默认值。','A function wraps input → computation → output, with default arguments.'],
      ['可复用的函数比复制粘贴的代码更容易检查。','A reusable function is easier to check than copy-pasted code.'],
      [`sim_mean <- function(n, mu, sigma) {`,
       T('  total <- 0                    # 循环累加','  total <- 0                    # Accumulate in a loop'),
       '  for (i in 1:n) total <- total + rnorm(1, mu, sigma)',
       '  total / n',
       '}',
       `sim_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`]);
    add('vec',['循环与向量化','Loop versus vectorised code'],
      ['同一个估计量可以写成循环，也可以写成一次向量运算。','The same estimator can be a loop or a single vectorised call.'],
      ['两种写法结果相同，速度与可读性不同；向量化通常更快。','Both give the same number; they differ in speed and readability — vectorised is usually faster.'],
      ['vec_mean <- function(n, mu, sigma) mean(rnorm(n, mu, sigma))',
       `set.seed(${p.seed}); a <- sim_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`,
       `set.seed(${p.seed}); b <- vec_mean(${p.n}, ${num(p.mu)}, ${num(p.sigma)})`,
       T('identical(round(a, 12), round(b, 12))   # TRUE：同一随机流','identical(round(a, 12), round(b, 12))   # TRUE: same random stream')]);
    add('mc',['蒙特卡洛与收敛','Monte Carlo and convergence'],
      [`重复 ${p.draws} 次，观察累计均值如何逼近真值。`,`Repeat ${p.draws} times and watch the running mean approach the truth.`],
      ['单次估计会波动；累计均值随次数增加而收敛，但不会单调贴近真值。','One estimate fluctuates; the running mean converges but is not monotone.'],
      [T('# 与网页逐项一致的确定性样本（由固定种子生成）','# Deterministic sample identical to the page (fixed seed)'),
       `est <- ${vec(mc.draws,7)}`,
       'running <- cumsum(est) / seq_along(est)',
       `band <- 1.96 * ${num(p.sigma)} / sqrt(seq_along(est) * ${p.n})`,
       'tail(data.frame(b = seq_along(est), est = est, running = running), 3)']).value=[`累计均值终点 ${mc.final.toFixed(6)}，真值 μ = ${p.mu}。`,`Final running mean ${mc.final.toFixed(6)} against μ = ${p.mu}.`];
    if(mode==='full'){
      add('plot',['绘制收敛路径','Draw the convergence path'],
        ['用 type = "l" 画线，abline 加参考线。','Use type = "l" for a line and abline() for reference lines.'],
        ['图只表达一件事：累计均值围绕真值收窄。','The figure says one thing: the running mean narrows around the truth.'],
        ['plot(seq_along(est), running, type = "l", ylim = range(c(running, mu)),',
         '     xlab = "b", ylab = "running mean", main = "Monte Carlo convergence")',
         'abline(h = mu, lty = 2)',
         'lines(seq_along(est), mu + band, lty = 3)',
         'lines(seq_along(est), mu - band, lty = 3)'],{core:false});
    }
  }

  if(view==='plot'){
    const g=M.graphicsData(p);
    add('data',['固定合成收益序列','A fixed synthetic return series'],
      ['先画时间序列，看水平、波动与异常。','Plot the series first to see level, volatility and outliers.'],
      ['合成数据只用于教学，不代表任何真实行情。','Synthetic data is for teaching only and is not a market quote.'],
      [`r <- ${vec(g.returns.map(v=>Number(v.toPrecision(10))),6)}`,T('# 120 个月度简单收益，固定种子生成','# 120 monthly simple returns from a fixed seed'),'summary(r)']).value=[`均值 ${g.mean.toFixed(6)}，标准差 ${g.sd.toFixed(6)}。`,`Mean ${g.mean.toFixed(6)}, standard deviation ${g.sd.toFixed(6)}.`];
    add('stats',['描述统计','Descriptive statistics'],
      ['手写偏度与峰度，避免依赖额外程序包。','Compute skewness and kurtosis by hand to avoid extra packages.'],
      ['正态的偏度为 0、超额峰度为 0；金融收益常见尖峰厚尾。','A normal has zero skew and zero excess kurtosis; financial returns are usually leptokurtic.'],
      ['skew <- function(x) { n <- length(x); z <- (x - mean(x)) / sd(x)',
       '  n / ((n - 1) * (n - 2)) * sum(z^3) }',
       'kurt <- function(x) { n <- length(x); z <- (x - mean(x)) / sd(x)',
       '  n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * sum(z^4) - 3 * (n - 1) / (n - 2) }',
       'c(mean = mean(r), sd = sd(r), skew = skew(r), kurt = kurt(r))']).value=[`偏度 ${g.skew.toFixed(4)}，超额峰度 ${g.kurt.toFixed(4)}。`,`Skewness ${g.skew.toFixed(4)}, excess kurtosis ${g.kurt.toFixed(4)}.`];
    add('hist',['直方图','Histogram'],
      [`按 ${p.bins} 组画频率直方图，再叠加正态密度。`,`Bin into ${p.bins} groups and overlay the matching normal density.`],
      ['密度曲线用的是同样的均值与标准差，所以差异只来自形状。','The curve uses the same mean and standard deviation, so any gap comes from shape alone.'],
      [`hist(r, breaks = ${p.bins}, probability = TRUE,`,
       '     xlab = "return", ylab = "density", main = "Synthetic monthly returns")',
       'curve(dnorm(x, mean(r), sd(r)), add = TRUE, lty = 2)',
       T('# probability = TRUE 才是密度；否则纵轴是频数','# probability = TRUE gives density; otherwise the axis is counts')],{core:false});
    add('qq',['QQ 图与箱线图','QQ plot and box plot'],
      ['QQ 图把分位数与正态比较，两端偏离说明厚尾。','A QQ plot compares quantiles with the normal; tail departures mean fat tails.'],
      ['箱线图用 1.5 IQR 规则标出异常，这只是规则，不是错误。','The box plot flags points beyond 1.5 IQR — a convention, not an error.'],
      ['qqnorm(r); qqline(r)',T('boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")','boxplot(r, horizontal = TRUE, main = "1.5 IQR rule")'),
       T(`# 本样本有 ${g.outliers} 个点超出 1.5 IQR 围栏`,'# '+g.outliers+' point(s) fall outside the 1.5 IQR fences')],{core:false});
  }

  if(view==='pkg'){
    add('declare',['先声明依赖','Declare dependencies first'],
      ['把需要的包写在脚本开头，并检查是否可用。','List required packages at the top and check availability.'],
      ['基础包随 R 安装，额外包需要单独安装。','Base packages ship with R; extra packages must be installed separately.'],
      ['needed <- c("stats", "graphics", "utils")',
       'installed <- vapply(needed, requireNamespace, logical(1), quietly = TRUE)',
       'installed',
       T('# vapply 对每个包返回 TRUE/FALSE，不加载也不报错','# vapply returns TRUE/FALSE per package without loading or erroring')]);
    add('extra',['额外包只检查不安装','Check extras without installing'],
      ['课堂上先确认镜像与版本，不要让脚本自动联网安装。','Confirm the mirror and version first; never let a teaching script install packages silently.'],
      ['依赖失败应当明确报错或明确降级，而不是继续算出错误结果。','A missing dependency should fail loudly or degrade explicitly — never compute a wrong number.'],
      ['extra <- c("zoo", "PerformanceAnalytics")',
       'has_extra <- vapply(extra, requireNamespace, logical(1), quietly = TRUE)',
       'has_extra',
       T('# 需要时再手动执行（示例）：','# Install manually when needed (example):'),
       '# install.packages("zoo")']);
    add('record',['记录环境','Record the environment'],
      ['packageVersion 与 sessionInfo 是复现实验的凭据。','packageVersion and sessionInfo are the receipts of a reproducible run.'],
      ['只写"已安装某包"不足以复现，版本同样重要。','"The package was installed" is not enough; the version matters too.'],
      ['packageVersion("stats")','search()','sessionInfo()',
       T('# 把这段输出附在实验报告里','# Attach this output to the lab report')]);
  }

  if(view==='ai'){
    const a=M.ai(p);
    add('draft',['AI 生成的草稿','The AI-generated draft'],
      ['生成代码看起来能跑，但有三处会误导结论。','The generated code runs, yet three things would mislead the conclusion.'],
      ['把 AI 输出当"待审查草稿"，不是最终答案。','Treat AI output as a draft to review, never as the final answer.'],
      [T('# 草稿原文（保持原样，便于逐条比对）','# The draft, verbatim, for item-by-item review'),
       ...a.draft.slice(0,4).map(([zh,en])=>'# '+T(zh,en).replace(/^# /,'')),
       T('# 直接运行会在第 2 行失败：绝对路径只对生成者的电脑有效','# Running it as-is fails on line 2: the absolute path only exists on the generator machine'),
       T('# 下面用同结构的数据复现三处问题','# The same three problems, reproduced on a small in-line vector'),
       'ann_return <- function(r) mean(r) * 252',
       'r <- c(0.012, NA, -0.004, 0.021)',
       T('ann_return(r)                     # NA：缺失值没有被处理','ann_return(r)                     # NA: the missing value was not handled'),
       T('# T <- ann_return(r) 会覆盖 TRUE，不推荐；仅演示为什么不能用 T 命名','# T <- ann_return(r) overwrites TRUE; shown only to explain why T is a bad name')]
      ).value=[T('返回 NA：缺失值没有被处理。','Returns NA: the missing value was never handled.')];
    add('fixed',['审查后的版本','The reviewed version'],
      ['显式处理缺失、显式声明年化口径、显式检查输入。','Handle missing values, declare the annualisation basis and validate the input explicitly.'],
      ['每一步审查都要能说出"为什么"，并写进报告留痕。','Every review step needs a stated reason, recorded in the report.'],
      [...a.fixed.map(([zh,en])=>T(zh,en))]).value=[`年化 ${a.annual.toFixed(4)}；按月 ${a.monthly.toFixed(4)}。`,`Annualised ${a.annual.toFixed(4)}; monthly ${a.monthly.toFixed(4)}.`];
    add('checklist',['审查清单','Review checklist'],
      ['五条检查对应五类常见错误，逐条核对。','Five checks cover the five common failure modes.'],
      ['审查记录本身就是实验的一部分。','The review record is itself part of the experiment.'],
      [`checks <- c(${a.review.map(r=>'"'+T(r.zh,r.en).replace(/"/g,'\\"')+'"').join(',\n  ')})`,
       'length(checks)',T('# 逐条核对并在报告中写明结论','# Verify each item and record the verdict in the report')]);
  }

  const basic=blocks.filter(b=>b.core!==false);
  const chosen=mode==='basic'?basic:blocks;
  return{blocks:chosen,code:chosen.map(b=>b.lines.join('\n')).join('\n\n'),mode,view,lang};
}
return{build,vec};
});
