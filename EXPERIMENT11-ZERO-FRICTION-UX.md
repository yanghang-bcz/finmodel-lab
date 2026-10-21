# 实验11 v2.2 · Zero-Friction Learning 实施与验收

## 交付状态与运行身份

已直接修改现有 FinModel Lab，四个模块默认均为自由探索，无学习步骤或预测解锁门槛。保留三栏、字体、品牌、投屏入口、五个已上线模型与12项实验目录。本轮没有开发实验08或增加金融模型。

- 项目绝对路径：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`
- 运行页面：http://127.0.0.1:8765/experiments.html?model=bs
- Delta直接入口：http://127.0.0.1:8765/experiments.html?model=bs&lesson=hedge
- 最终构建：`2.2.0-zero-friction.b79a33bbaffc234f`
- 最终服务PID：10410；文档根为项目下`dist`。
- 启动：在上述项目目录执行`python3 tools/serve.py`。已有服务正在运行，不要重复占用端口。
- 身份接口：http://127.0.0.1:8765/__finmodel__/status

开始时先读取前三轮交付记录、v2.1教学UX记录及源码。服务PID2083确实来自该项目，v2.1构建`2.1.0-teaching.dd1f92c76de51c69`的页面、bundle、样式、manifest均与本地字节一致。修改后重启该项目服务，最终浏览器DOM、服务身份、构建清单一致，7项HTTP资源与源码SHA256一致。证据：`tests/zero-friction/identity-before.json`、`identity-after.json`。

6项核心源码与v2.1交付哈希完全一致：`experiment-math.js`、`bs-lesson.js`、`iv-math.js`、`iv-code.js`、`hedge-math.js`、`hedge-code.js`。证据：`engine-integrity.json`。本轮没有重写金融或R核心算法。

## 移除的阻力与保留内容

默认页面已取消进度条、步骤跳转、前置概念页、强制下一步、强制提交预测、预测前隐藏图表/代码、参数锁定、动态A/B/C教学阶段。用户进入任何模块即可改参数和查看结果。

v2.1通俗说明按需组织为“一句话 → 为什么？ → 数学/实现”，高级参数、资金账户与模型假设折叠。课堂挑战是独立可关闭的`details`区域，有预测选项与解释；主模型从不被锁定。保留默认Call 100→105、卖方到期120的义务、q变化、σ变化和两种算法快慢等课堂情景。旧19步数据和示例仍保留供既有数据/R回归；默认控制器已经完全替换，没有把19步拼成超长正文。

原完整工作台仍可从“模型假设与完整工作台”进入，旧计算、图表和教学探索继续可访问。它与自由探索各自保存参数，页面明确提示；返回自由探索保持原条件。

| 模块 | 打开即显示的主要内容 | 直接探索与进阶入口 |
|---|---|---|
| 定价基础 | 问题、Call/Put两曲线与价格、核心S/K/T/r/σ、核心R | 改参即算；理论价/到期支付；q、d1/d2、正态函数、贴现、平价、完整R按需查看 |
| 红利与敏感性 | q/σ控制、两类价格随q变化、一句话解释 | q与σ立即联动；一次查看一个Greek；Vega每1百分点，Theta每日；其余参数可展开 |
| 隐含波动率 | 假设报价、价格-σ曲线、当前估计、二分法入口 | 直接下一次迭代或播放求解；Newton切线、算法比较、可点选日志、误差与停止诊断 |
| Delta风险对冲 | 零中心符号条、当前Delta/目标股票/净Delta、S滑块、初始持仓对比 | 风险抵消/动态调仓自由切换；资金、Gamma原理、精确计算、完整账户与三策略结果可展开 |

没有引入大语言模型或聊天窗口。解释使用明确规则与当前引擎数值生成。

## Delta自由探索演示与金融口径

默认S=K=100，T=1年，r=.05，q=0，σ=.2，Call，一份教学期权对应一单位标的：

| 同一剩余期限的情景 | S100 | S105 |
|---|---:|---:|
| 期权Delta | .636830651176 | .723727496763 |
| 卖出期权Delta | −.636830651176 | −.723727496763 |
| 当前中性所需股票 | .636830651176 | .723727496763 |
| 原持仓（没有交易） | .636830651176 | .636830651176 |
| 原持仓未调时净Delta | 0 | −.086896845587 |
| 若重新调整需交易 | 0 | +.086896845587 |

拖动或输入105后，目标、条形、R上下文与解释立即同步；没有提交按钮。连续拖动保持原滑块节点，不因重绘中断拖动。Put用负股票持仓/卖空，卖方期权条的方向正确反转。点击Delta、shares、net_delta代码分别强调对应图形关系。

修改S时保留初始持仓；修改K/T/r/q/σ/期权类型时，按当前S建立新合约的初始参照，展开解释中明确说明。风险抵消图只表示当前重新建立/调整所需目标，**没有执行交易**；净Delta零仅抵消局部一阶风险，不是永久无风险，也不是上涨概率。

资金折叠区展示当前新建账户：`B0=V0−hS`，`hS+B0−V0=0`。负现金表示借款，而非已发生亏损。它与真实逐期自融资动态账户分开标注。

动态模式直接显示可复现路径、三策略选择、股价/净值视图、期数、播放、暂停、上一期、下一期、重置和结果。间隔、N、seed直接可见；仅改interval保留同一路径。参数变化清除旧播放、Tooltip、进度与高亮。减少动态偏好下不启动自动播放。

动态账户仍采用原引擎：期初现金计息，股息为`旧持仓*q*旧股价*dt`左端点矩形近似、期末入账；空头股息为支出。交易现金流为`−(新持仓−旧持仓)*本期股价`，净值为`hS+B−V`。到期用实际Call/Put支付，不再计算到期Delta或调仓；股票清算后的现金等于终点净值。默认seed2027、N60、interval1终值仍为不对冲10.968222677、静态7.714695723、动态−.179012508元。三策略使用同一期权、权利金与路径；不保证动态最好，也不保证调仓更频繁在单条路径误差单调改善。

## R展示与真实执行

基础视图突出当前逻辑片段，明确依赖上下文；复制基础脚本会补齐参数、同源价格函数或整个必要模拟/求根上下文。完整脚本保留原输入验证、定价、算法/账户、路径、结果与绘图。没有把片段冒充完整脚本，也没有宣称网页运行R。

Delta基础默认显示d1、含q的Delta、目标shares和net_delta。零波动边界改用同源BS边界结果，避免直接除零。完整对冲复制的是从当前条件重新初始化的模拟，不冒充已执行了目标图的历史交易。

实际运行：新增21份独立生成脚本通过；浏览器实际复制14份后在本机真实Rscript运行通过，覆盖四模块基础/完整版、动态基础/完整、Put、到期支付、Vega与Newton。日志在`tests/zero-friction/*.R.log`，脚本和PDF均留存。原三轮R数值/轨迹/停止条件/逐期账务对照继续通过。默认复制的Delta输出.6368307，净Delta0；定价输出Call10.450584、Put5.573526；默认IV结果约20%。

RStudio入口提供整段运行说明、当前核对值和只改一个参数的练习。动态练习要求保持seed/N，仅改interval解释误差；没有实际操作RStudio GUI。

## 实际测试

在项目根目录执行：

```sh
node tests/run-regression.cjs
node tests/zero-friction.test.cjs
node tests/zero-friction-browser.cjs
node tests/bs-round1-browser.cjs
node tests/bs-round2-browser.cjs
node tests/bs-round3-browser.cjs
FINMODEL_TEST_OUT=tests/zero-friction/full-final node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/zero-friction/full-extra node tests/interaction191.test.cjs --extras
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

| 检查 | 实际通过 / 失败 | 证据 |
|---|---|---|
| 总数学/教学/R回归 | 14套 / 0失败 | `regression-final.log`、`tests/v1.9/regression-results.json` |
| 第一轮数学与R | 13,514断言、28R / 0失败 | 原bs-round1结果、总回归日志 |
| 第二轮数学与R | 76,909断言、29R / 0失败 | 原bs-round2结果、总回归日志 |
| 第三轮数学与R | 362,576断言、154账户情景、36R / 0失败 | 原bs-round3结果、总回归日志 |
| v2.1保留的数据/R | 85检查、46R / 0失败 | 原teaching-ux数据套件、总回归日志 |
| 新适配层与R | 46检查、21R / 0失败 | `math-r-results.json`、`new-math-r.log` |
| v2.2浏览器 | 152检查、14份实际复制R / 0失败 | `browser-results.json`、`browser-run.log` |
| 原前三轮完整工作台浏览器 | 93+51+78 / 0失败 | `round1-browser.log`、`round2-browser.log`、`round3-browser.log` |
| 五模型完整交互 | 355 / 0失败 | `full-browser.log`、`full-final/chrome-results.json` |
| 目录与Tooltip定向回归 | 22 / 0失败 | `extra-browser.log`、`full-extra/extra-results.json` |
| 构建一致与陈旧构建拒绝 | 通过 | `build-check-final.log`、`build-integrity-final.log` |

数量包含多字段、多期数断言，不能当作独立学生或学习效果样本，也不能与彼此有重叠的R套件简单相加。

新增浏览器具体覆盖：四模块零操作可用；1440首屏问题/图表/参数/结果/代码都可见；100→105联动；连续拖动；初始与目标区分；Call/Put符号；代码三种关系高亮；可选挑战不锁参数；动态同路径间隔；播放/暂停/恢复/重置/离开取消；当前账户与策略视图；IV二分区间、Newton切线、报价非法、低Vega、T0、日志选择；无效输入清空与恢复；目录排序；Tooltip预览离开关闭、点击固定、Escape/按钮关闭；刷新与原完整工作台往返；键盘滑块、模拟触屏、减少动态偏好。

原数学套件继续覆盖q0/q>0、两类期权、随机roundtrip、边界报价、σ0/低高σ、T0、Vega→0、纯Newton失败、区间扩展/迭代上限，以及自融资逐期对账、持仓、到期支付、利息、股息、不同调仓间隔与固定seed。

输入域沿用原引擎：BS的S/K为[.01,100000]，T为[0,10]，r为[−.1,.3]，q为[0,1]，σ为[0,2]。IV保留自身搜索域、无套利边界、σ0下界、无限极限及浮点精度停止；不会伪造唯一到期IV或纯Newton收敛。对冲要求T>0，原确定性折点、非法路径域等错误仍直接报告，不静默截断路径或伪造结果。

开发中有两次新测试定位失败，分别将折叠详情中的重复`.tu-facts`和原工作台同名代码按钮误作唯一目标；收窄测试范围后完整重跑通过。125%最初的全页截图被Chrome/Playwright裁成CSS尺寸，审阅发现右边截断；实际布局参数在视口内，最终改用完整物理视口截图，并增加参数边界检查。历史`browser-failure.json`与`failure.png`保留作开发记录；最终通过以`browser-results.json`为准。

## 真实截图与浏览器范围

均来自真实HTTP页面，目录`tests/zero-friction/`：

- [定价基础](tests/zero-friction/pricing-entry.png)
- [红利与敏感性](tests/zero-friction/dividend-entry.png)
- [隐含波动率](tests/zero-friction/iv-entry.png)
- [Delta默认](tests/zero-friction/hedge-entry.png)
- [Delta股价105](tests/zero-friction/hedge-105.png)
- [直接动态调仓](tests/zero-friction/dynamic-entry.png)
- [三策略净值](tests/zero-friction/dynamic-performance.png)
- [1920](tests/zero-friction/hedge-1920.png)、[1440](tests/zero-friction/hedge-1440.png)、[1366](tests/zero-friction/hedge-1366.png)、[375窄屏](tests/zero-friction/hedge-375.png)
- [投屏模式](tests/zero-friction/projection.png)、[真实Chrome125%](tests/zero-friction/chrome125.png)

真实125%使用独立临时Chrome配置，在浏览器设置中设置1.25，DPR1.25、CSS viewport1093、根CSS zoom1。没有用CSS zoom或deviceScaleFactor冒充页面缩放，也没有修改用户日常Chrome设置。屏幕较低时使用面板内部滚动，窄屏按模型/参数/代码顺序访问。代码保留原字号并允许视觉折行。

自动化来自实际安装Chrome的新测试会话。另在可见内置浏览器刷新最终版本，真实输入105，读到目标.7237、初始.6368、差额.0869，并保留该页面供用户使用。

用户原Chrome旧标签此前无法通过原生工具读回网页正文，**本轮没有确认该旧会话迁移成功**；不把新Chrome与新内置浏览器验证等同于所有旧会话通过。当前HTTP资源与版本身份已独立核对。

## 实际文件清单

新增：

- `dist/zero-friction-data.js`：自由探索状态、核心片段、自足R上下文适配。
- `tests/zero-friction.test.cjs`：适配层与真实R运行。
- `tests/zero-friction-browser.cjs`：自由探索/复制R/响应式与交互专项。
- 本文档及`tests/zero-friction/`截图、日志、脚本、哈希证据、源码快照与差异。

修改：

- `dist/teaching-ux.js`：替换默认强制步骤控制器，四模块自由探索、参数组织、可选挑战、播放/取消与解释。
- `dist/teaching-ux-charts.js`：双价格曲线、目标Delta符号条、真实百分比IV轴、同路径完整预览与当前调仓点、策略Tooltip；价格非负曲线从非负轴域展示，轴末标签避裁切。
- `dist/experiments.css`：仅教学作用域的密度、结果优先级、代码折行、分屏/窄屏及高亮。
- `tools/build-workbench.cjs`：接入适配层，版本改为2.2.0-zero-friction。
- `tests/run-regression.cjs`：加入新套件。
- `tests/teaching-ux-browser.cjs`：原强制步骤契约已过时，旧脚本归档到before；保留原命令作为新自由探索浏览器套件入口。
- `README.md`：交付索引。

生成产物：`dist/experiments-bundle.js`、`build-info.js`、`build-manifest.json`、`experiments.html`、`index.html`。既有测试机制还会更新原测试输出。`tests/zero-friction/before/`与`source-changes.patch`保存实际差异。项目无已跟踪Git基线，未创建提交或重置用户文件；只读`sources/`未修改。

## 教学体验审核与限制

| 设计目标 | 可观察实现 | 教学效果证据 |
|---|---|---|
| 首次有效交互 | 四模块核心参数立即可改，无前置解锁 | 已浏览器验证；真实学生首次操作用时未测 |
| 初始理解 | 问题标题、短说明、一张主图、主要结果 | 已审阅截图；零基础理解正确率未测 |
| 自由探索 | 连续拖动即时更新，参数不要求提交，挑战可跳过 | 已交互验证；课堂自主探索行为未测 |
| 进阶可达 | 完整R、数学、现金账户、算法日志与动态模拟清晰可达 | 真实R和浏览器已测；学生独立R操作未测 |
| 教师演示 | 模块深链、投屏、可选挑战与自由切换 | 浏览器已测；真实投影设备与课堂试用未测 |

已知限制：

- 本页与原完整工作台参数各自保存，进入原工作台前需核对条件；不做隐式参数合并。
- 当前自由探索状态仅保存在当前页面内存，刷新恢复模块默认条件，无跨设备进度追踪。
- 默认动态预览会显示完整已生成教学路径与最终误差，播放用来观察当前持仓/现金演变；它不模拟隐藏未来信息的交易决策。
- 矮屏/125%时详情与部分说明需要中栏局部滚动；窄屏可访问全部操作，但不承诺三栏同屏。
- 实际Rscript已执行；没有验收RStudio GUI、Safari/Firefox、真实触屏硬件、原Chrome旧会话、多人并发与弱网。
- 连续时间完美对冲与有限调仓不同；仍为原模型的无交易成本、允许借贷/卖空/分数股票和股息离散近似，不含真实市场数据。

没有进行真实学生访谈、理解前后测、操作计时或课堂试用。以上是产品行为验收与开发者设计审核，不能据此声称教学效果已实证提高或给出可信的学生学习评分。下一步等待实验11教学验收，不自动开发实验08。
