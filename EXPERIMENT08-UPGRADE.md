# 实验08升级：多资产均值—方差决策

已在原 FinModel Lab 项目直接实现可运行代码；没有另建副本或静态原型。保留双资产直觉与教育诊断，新增3～5资产的约束优化、本地CSV估计和独立R复现。默认自由探索，不要求先完成挑战。

## 服务与版本

- 唯一项目：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`
- 页面：http://127.0.0.1:8765/index.html ，点击“多资产组合”。双资产仍为默认入口。
- 最终构建：`2.3.0-portfolio.1973647664e77e3b`
- 最终服务PID：30121；文档根为原项目 `dist`。
- 服务身份：http://127.0.0.1:8765/__finmodel__/status
- 启动（当前已运行，不需重复启动）：

```sh
cd /Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab
python3 tools/serve.py
```

开发前实际确认原PID20457、`2.2.1-code-ux.3fcc8ca14b0b3b0f`、原目录与8项HTTP资源哈希相符；不是仅根据旧文档推测。最终服务身份、manifest及12项HTTP资源SHA256相符。证据为 `tests/portfolio-upgrade/identity-before.json`、`identity-after.json`。

## 保留与复用

实验11的金融计算、R代码、四模块界面和交互源文件全部保持原哈希；06/07/09源文件、双资产的 `app.js`、`math.js`、`lessons.js`、诊断与探索模块、原CSS和 `experiments-bundle.js` 均保持原哈希。复用了原三栏视觉、字体、代码行样式、ModalUI、ChartInteraction和课程目录。

所有已有源文件中，只有 `index.html` 增加实验08独立CSS引用；构建工具增加实验08模块并更新版本。`experiments.html` 仅有生成的构建身份与build-info引用变化。没有改写其他模型公式，也没有把整个旧实验08重做。对照清单见 `source-integrity.json`，开发前源快照在 `before/`，新模块与入口差异在 `source-changes.patch`。

## 已实现行为

### 从双资产到3～5资产

两模式轻量切换，双资产参数、相关性图、可行集/有效部分、GMV、非有效组合改进、撤销、课堂工具与逐行解释保留。多资产先看到一个问题、一张风险收益图和两项当前指标；矩阵、数据实践、原理与挑战按需展开。

多资产输入同一年度假设的μ、σ与完整相关矩阵ρ。上下三角分别输入且必须一致；Σ=diag(σ)ρdiag(σ)。矩阵须有限、对称、对角线为1、相关性位于[-1,1]且PSD，非法矩阵不生效。禁止卖空、权重合计1；修改一项不会悄悄修改其他项，合计错误会停算并禁用复制/应用。用户可以主动“按比例归一全部权重”，界面逐项列出变动。

GMV和目标收益组合可以主动应用；显示全部权重的前后变化，明确仅改变模型配置，不执行交易。目标不可行时禁用该目标的应用，仍可计算当前合法组合与GMV；复制脚本会注明未生成无效目标解。低于GMV收益的等收益最小方差解明确提示可能非有效。

### 优化与数值边界

标准目标 `min wᵀΣw`，约束 `1ᵀw=1, w>=0`；目标收益解另有 `μᵀw=r`。n≤5时枚举最多31个非空活跃面，在每个面解带等式约束的拉格朗日方程，排除负权重解，比较最小方差。正定凸目标使全局最优可由这种方法取得；这是数值线性代数优化，不是随机云图上包络。

绿色前沿从GMV收益到最高资产收益，逐一求61个目标收益的优化解；线段是这些解的绘图插值。等收益资产场景退化为一个最小风险位置。灰点为固定种子的可行样本，明确标记“采样可行点≠精确边界”，不参与求解。当前、GMV、目标解与前沿点可查看权重；密集前沿点击可能选中邻近点，键盘聚焦可精确选定特定点。灰色云点本身未开放逐点选择。

协方差经对角尺度归一后检查特征值；最小归一特征值≤1e-10视作奇异/近奇异并停止。非PSD不能靠正则掩盖。用户主动勾选时，使用 `Σ_used=Σ_raw+λI`，`λ=max(diag Σ_raw)*1e-6`；展示λ和原始Σ，明确优化问题发生改变，R与图表均使用同一处理。全部零波动输入不支持。未使用静默补矩阵、截断负特征值或隐藏填值。

功能边界：仅支持3～5资产、全额投资、long-only、预算与单目标收益约束。不支持卖空、杠杆、无风险资产、权重上限、交易成本、融资费用或整数手数。正则场景的风险是正则模型风险，不能当作原始历史方差。

### 本地CSV工作流与来源

用户文件通过 `File.text()` 在浏览器内读取，清洗、估计、优化与导出均在本机；无上传API、第三方数据请求、自动保存或行为记录。刷新清空。实际浏览器请求记录只出现本地GET，没有POST或外部请求。剪贴板R代码包含用户清洗后的收益数据，界面对此明确告知。

CSV支持UTF-8/BOM、逗号、引号字段、转义引号、CRLF。首行列名必须唯一；选择日期列和3～5资产列。日期严格为YYYY-MM-DD，检查真实日期、空日期、重复日期和升序；只有主动勾选才排序，不自动合并重复日期。

支持正价格或小数形式的简单收益输入，选择简单/对数计算。拒绝零/负价格、非数值、非法收益、列数不一致、重复列、未闭合引号。缺失默认拒绝，可主动选择完整行删除并报告数量；按宽表共同日期对齐，不默认补价。价格在删除缺失行后跨期计算，因此实际区间可能变长，界面显示日期间隔中位数与最大值并提示核实频率。有效收益样本至少为资产数+2，明确建议更长样本。

日/月/年/含周末每日频率与年化因子由用户确认，可自定义；界面展示间隔供核对，不声称自动识别交易日历。样本均值用 `colMeans(R)*factor`，样本协方差用 `cov(R)*factor`（分母T-1），标准差开平方；每期/年化切换同步结果、图与R。简单均值线性年化不是复利收益预测；对数均值不是简单收益。价格复权口径、拆分、分红、币种与来源许可由用户核实。

**没有内置声称为真实历史行情的数据。** 随仓库的 `dist/data/synthetic-prices.csv` 是原创确定性合成示例：5项虚拟资产，2025-01-01至2025-03-06、65个含周末日历日、无真实资产/复权含义，按CC0-1.0提供。生成公式位于 `PortfolioCSV.template()`，页面下载与文件相同。不能用此示例得出真实投资实证结论。本轮未取得并核实可再分发的真实价格、复权口径与许可，因此采用用户明确允许的导入优先路线，没有伪称完成真实行情案例。

局限：单一宽表共同日期，尚未支持多个文件合并、长表、时区时间戳、交易日历自动对齐；文件上限2MB；不支持Excel格式。导出的文件名区分simple/log收益；输入收益类型目前为简单收益，不应把已导出的log收益再作为simple导入。

### R与可选教学探索

默认完整R代码，关键逻辑仅改变阅读范围，主复制始终完整。新左栏独立滚动，显示折行不改变复制源码；点击代码行显示公式/金融含义。假设模式的μ、σ与ρ直接嵌入R，并显式计算diag(σ)ρdiag(σ)；CSV模式将清洗后的收益矩阵嵌入R，不依赖CSV文件路径、JS、网络或额外包。脚本自己计算当前收益、方差、标准差、样本Σ、GMV、全部前沿解、可行样本与图；有效目标另有目标组合输出。

CSV模式可切换前/后半段重新估计μ与Σ，或只给A均值±1个标准误；参数、图、优化权重和复制脚本同步。均值标准误为独立同分布近似，年化SE为每期SE乘factor；忽略自相关和结构变化，不能当作置信保证。半样本不足时明确报错。

保留双资产可选相关性挑战：固定波动与权重，ρ降低时方差不增；正权重、正波动时才严格下降。多资产提醒任意改变成对相关性仍须整体PSD。挑战不锁定默认工作台，不是完成主实验的门槛。

RStudio实践入口提供当前核对数值与练习：粘贴完整代码在新R会话整体运行，核对Σ、当前μ/σ、GMV权重与前沿；切换样本或均值扰动重复观察。**真实执行的是Rscript --vanilla，并非RStudio GUI。**

## RStudio导入原CSV练习

复制页面完整R脚本后，可以先用内嵌样本核对。若要在R里自行读取原始价格CSV，可用下段替代脚本的输入数据块，再运行其已有的优化函数与绘图段。此例要求第一列为日期、其余3～5列为所选价格，严格拒绝缺失；需要复权时应先取得同口径价格。

```r
raw <- read.csv(file.choose(), check.names=FALSE,
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
```

浏览器与R完整脚本之间已逐值验证；这段手工导入练习需由使用者按自己的列顺序和数据频率调整，不能把它当作自动识别所有金融文件的读取器。

## 实际测试与命令

在上述原项目目录执行：

```sh
node tests/run-regression.cjs
node tests/portfolio-multi.test.cjs
node tests/portfolio-multi-browser.cjs
FINMODEL_TEST_OUT=tests/portfolio-upgrade/legacy node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/portfolio-upgrade/extras node tests/interaction191.test.cjs --extras
node tests/code-ux-221-browser.cjs
node tests/portfolio-smoke.cjs
node tests/portfolio-rstudio-import.test.cjs
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

需要本机Node、Rscript、Playwright及实际安装Chrome；沿用仓库现有依赖路径。网页运行本身只需静态资源，服务启动时用Node构建。

| 检查 | 本轮真实结果 | 证据 |
|---|---|---|
| 新旧统一数学/教学/R回归 | 16套通过，0失败 | `regression-final.log`；原机制`tests/v1.9/regression-results.json` |
| 新多资产数值与R | 17,083项，24次干净R会话通过；最大绝对差8.9435e-12 | `math-results.json`、24组`.R`及日志 |
| 新实验08真实Chrome | 120项通过，12份页面实际复制R脚本执行与核对通过 | `browser-results.json`、`copied-*.R.log` |
| 文档原始价格CSV导入练习 | R实际执行，30项均值/协方差值与JS一致 | `rstudio-import-exercise.R.log` |
| 原五模型完整交互 | 355项通过 | `legacy/chrome-results.json` |
| 原诊断/Tooltip补充交互 | 22项通过 | `extras/extra-results.json` |
| 原v2.2.1完整代码/实验11界面 | 273项通过，19份实际复制R通过 | 原`tests/code-ux-221/browser-results.json`与R日志 |
| 构建一致与陈旧产物拒绝 | 通过 | 构建检查输出；`build-integrity.test.cjs` |
| 最终干净截图 | 无页面错误、模型有效 | `final-*.png` |
| 原模型源码冻结 | 已有金融/UI源保持原哈希，原experiments-bundle逐字节不变 | `source-integrity.json` |
| 原目录服务 | 最终buildId一致，12项HTTP资源哈希一致 | `identity-after.json` |

数值覆盖手算wᵀΣw、二维闭式GMV与旧引擎对照、3/4/5资产、负/零/正/近1相关性、GMV及目标收益KKT、非负权重与预算、等收益、不可行目标与端点、奇异与显式正则、非法PSD和非对称、年化、缺失、排序、重复列/日期、日期不存在、简单/对数收益。R逐值核对原始Σ、当前值、GMV及全部前沿点的权重/收益/方差/风险；不是只检查脚本文字。

浏览器覆盖默认完整代码、任意阅读模式实际复制、3/4/5资产、权重不自动改写、显式归一、应用前后、目标边界、矩阵错误、CSV上传/转换/删除缺失/排序/导出、样本扰动、重置、双资产往返、hover离开关闭、点击固定、Esc、前沿选择、目录01～12顺序、五模型跳转、无上传请求。尺寸为1440×900、1366×768、1920×1080、1152×720和375×812；窄屏按原设计纵向滚动。

另用临时Chrome配置把真实浏览器缩放设为125%，并记录DPR=1.25、CSS zoom=1、CSS视口1152×720；代码区可滚动、复制可见、三栏在视口内。没有用CSS zoom伪装浏览器缩放，也没有修改用户日常Chrome配置。证据`zoom125.json`与`multi-real125.png`。

这些数字是自动化断言/输出字段，不是学生人数或学习效果，重叠套件不能相加作为教学成效。

## 真实截图

以下均为本轮HTTP页面实际截图：

- [双资产保留](tests/portfolio-upgrade/final-dual-1440.png)
- [多资产默认完整代码](tests/portfolio-upgrade/final-multi-1440.png)
- [GMV权重详情](tests/portfolio-upgrade/final-weights-1440.png)
- [本地CSV实践](tests/portfolio-upgrade/final-csv-1440.png)
- [5资产](tests/portfolio-upgrade/multi5-1440.png)
- [真实125%浏览器缩放](tests/portfolio-upgrade/multi-real125.png)
- 其他尺寸：`multi-1366.png`、`multi-1920.png`、`multi-1152.png`、`multi-375.png`。

## 课程大纲完成度评估

以可检查的实现与证据评价，不虚报经课堂验收的95分。

| 大纲/教学目标 | 状态 | 已有证据与剩余边界 |
|---|---|---|
| Markowitz现代组合理论 | 已实现 | μ、Σ、w、预算、协方差、收益/风险公式与代码解释；没有收益预测保证 |
| 资产组合可行集 | 已实现 | 双资产原曲线、多资产采样区域；明确采样不是精确边界 |
| 有效边界与有效组合 | 已实现 | 61个目标收益的真实优化解、支配解释、GMV以上有效段、等收益退化 |
| 标准均值方差模型求解 | 已实现 | 活跃面QP，GMV/目标约束、KKT和R对照 |
| 全局最小方差 | 已实现 | 双资产闭式一致、多资产精确解与一键应用 |
| 约束条件优化 | 已实现所公开范围 | long-only与预算/目标收益；不支持的卖空、无风险资产等明确说明 |
| 有效前沿绘制 | 已实现 | 浏览器和R各自计算并绘图，非抽样上包络 |
| 策略开发/组合优化能力 | 已实现实践工具，效果待验证 | 用户配置、目标优化、前后权重、CSV/R复现；未做真实学生考核 |
| 收益—风险权衡 | 已实现 | 同图比较、非有效诊断、可选挑战；课堂理解程度待测 |
| 真实金融数据实践 | 导入路线已实现；内置真实案例未完成 | 用户CSV可复现；合成例不冒充行情，来源/复权/许可需补齐 |
| 样本估计局限 | 已实现 | 半样本与±标准误可操作示例、频率/缺失区间提示；未实现bootstrap或稳健优化 |
| RStudio实践 | R代码与任务已实现；GUI未验收 | 干净Rscript实际执行；未自动操作RStudio GUI |
| 零基础可用性 | 设计与自动化已验收，课堂效果未验收 | 自由探索、折叠复杂内容、三栏/缩放/错误提示；没有真实教师/学生测试 |

本轮已完成用户要求的可运行多资产优化与本地CSV垂直链路。是否达到实际教学95+，仍需要真实数据案例审查与课堂使用证据；本报告不以自动化测试数量给出虚构教学分数。

## 修改文件

新增产品源：

- `dist/portfolio-multi-math.js`：矩阵校验、特征值、线性求解、活跃面QP、GMV/目标/前沿、确定性可行样本。
- `dist/portfolio-csv.js`：本地CSV解析、日期/列/样本检查、收益转换、估计、合成数据生成。
- `dist/portfolio-multi-code.js`：内嵌当前参数/样本的独立基础R脚本。
- `dist/portfolio-multi-ui.js`：三栏多资产工作台、模式切换、联动、权重、图表、数据、实践与挑战。
- `dist/portfolio-multi.css`：仅实验08的新布局与样式。
- `dist/data/synthetic-prices.csv`、`dist/data/README.md`：明示合成的数据与使用边界。

修改入口/构建：`dist/index.html`、`tools/build-workbench.cjs`。生成变化：`portfolio-bundle.js`、`build-info.js`、`build-manifest.json`、两HTML的资源身份。`experiments-bundle.js`不变。

测试/文档：新增 `tests/portfolio-multi.test.cjs`、`tests/portfolio-multi-browser.cjs`、`tests/portfolio-smoke.cjs`、`tests/portfolio-rstudio-import.test.cjs`、`tests/portfolio-upgrade/`证据；`tests/run-regression.cjs`加入新套件；更新README与本文。既有测试依原机制刷新输出。项目原无已跟踪Git源码基线，未重置用户文件、未做Git提交；只读`sources/`未改动。

## 开发中实际发现与修复

1. 初次Chrome在沙箱内启动失败；在获准的正常浏览器测试执行环境重跑，没有把启动失败算通过。
2. 新面板最初插入旧面板之前，影响旧代码按第一个`.plot-area`定位，导致双资产图空白；真实355项回归发现后调整挂载顺序，旧源不改，完整回归通过。
3. 密集前沿的相邻命中区重叠，初始测试强求指定像素点编号而超时；测试改为实际坐标点击并检查实际选中点，也保留键盘可达。没有使用强制点击掩盖覆盖。
4. 文件读取是异步的，初始上传错误测试在读取结束前检查而失败；改为等待实际解析状态，重复列/日期/缺失与排序均通过。
5. 新代码区长行最初只横向显示，后改为左栏内折行且保持原字号；重置还会关闭详情、恢复完整代码和右栏滚动位置。

早期`browser-failure.json`、`browser-failure.png`、`first-multi.png`等可能保留，属于修复过程。最终结论以`browser-results.json`、`regression-final.log`、`identity-after.json`与`final-*.png`为准。

## 尚未完成或验收

没有随附经核实许可与复权口径的真实历史行情；没有真实学生课堂试用、前后测、RStudio GUI、Safari/Firefox、真实触屏/投影设备、弱网或多人并发测试。没有改变其他模型或远程发布。浏览器不执行R；前沿图为61个优化点连线，非连续解析绘图；所有样本估计与优化均服务于教学，不能视为未来表现保证。
