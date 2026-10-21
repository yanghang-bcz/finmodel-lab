# 实验11第三轮：Delta Hedging 开发与教学验收记录

日期：2026-10-20。已直接修改原 FinModel Lab，第四模块已上线，前两轮完整保留。本轮不继续开发实验08；等待实验11完整教学验收。

## 1. 项目、服务与构建

绝对项目目录：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`

页面：[实验11](http://127.0.0.1:8765/experiments.html?model=bs)，进入“Delta 风险对冲”。

身份：[服务身份](http://127.0.0.1:8765/__finmodel__/status)。在上述目录启动：

```sh
python3 tools/serve.py
```

也可在任意目录执行：

```sh
python3 "/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/tools/serve.py"
```

已有8765服务时不要重复启动。服务只监听本机，不代表学生设备可联网访问。

本轮开始时8765实际无监听，访问被拒绝；没有把旧Chrome标签当作活跃服务。阅读前两轮文档、源码、测试后，从此绝对路径启动原第二轮构建，PID 89367、build `1.9.1-audit.46e712b8e8450dd6`，核对服务路径和五项HTTP资源SHA256全部一致，并先通过22项目录/Tooltip定向回归。证据：`tests/bs-round3/identity-before.json`、`identity-started.json`、`before-browser/`。

最终服务PID **91687**，构建 **`1.9.1-audit.d0dd70d7f074538d`**。DOM、manifest和服务身份一致；HTML、bundle、CSS、三个对冲模块与共用Tooltip脚本共七项HTTP资源与磁盘SHA256匹配。证据：`identity-after.json`、`build-check.log`、`build-integrity.log`。服务继续运行，缓存策略仍为no-store，页面资源URL含内容哈希。

## 2. 四个模块状态与实际修改

| 模块 | 当前状态 |
|---|---|
| 定价基础 | 保留并回归：欧式Call/Put、含q的BS、公式与参数联动、R逐句解释 |
| 红利与敏感性 | 保留并回归：q实验、Greeks、预测→实验→解释、RStudio实践 |
| 隐含波动率求解 | 保留并回归：二分法、纯Newton、迭代图、失败状态、可运行R |
| Delta风险对冲 | 新增：初始中性、100→105预测实验、可复现路径、动态调仓、三策略比较、自融资对账、到期清算、基础/完整R |

仍使用 R Code｜Model Visualization｜Parameters。没有替换字体或改其他金融模型。新R语法高亮直接复用现有函数与样式；新图表使用现有ChartInteraction状态机，悬停为临时预览、点击固定、关闭按钮或Escape取消。触控、连续键盘Enter、进度滑块均验证；播放800ms一步，减少动态偏好下改为手动。切换、改参、后台隐藏和离开页面清理定时器与Tooltip。

新增源文件：
- `dist/hedge-math.js`：验证、可复现GBM、同源BS调用、三策略账户与清算。
- `dist/hedge-code.js`：真实可运行的基础/完整R生成器。
- `dist/hedge-workbench.js`：第四模块三栏、预测门槛、图表与代码联动。
- `tests/bs-round3.test.cjs`、`tests/bs-round3-browser.cjs`。
- 本文档与 `tests/bs-round3/` 下的快照、真实R、逐期CSV、日志和截图。

修改源文件：
- `dist/experiments.js`：第四模块按钮、模块切换、公开原语法高亮函数。
- `dist/experiments.css`：仅第四模块作用域内布局与图表样式。
- `dist/bs-lesson.js`、`dist/iv-workbench.js`：纠正“动态对冲尚未上线”的旧状态文字。
- `tools/build-workbench.cjs`：加入三个对冲源文件。
- `tests/run-regression.cjs`：将第三轮数学/R套件加入完整回归。
- `README.md`：第三轮交付索引。

生成产物：`dist/experiments-bundle.js`、`dist/build-info.js`、`dist/build-manifest.json`、`dist/index.html`、`dist/experiments.html`。原测试机制也更新其既定输出目录。`tests/bs-round3/before/`和`source-changes.patch`保存实际源文件差异；项目没有可用的已跟踪Git基线（原文件均为untracked），未重置、提交或覆盖历史ZIP。`sources/`只读且未改动。实验08源代码未开发或修改。

## 3. 自融资账户：口径、顺序与边界

**单位：卖出一份教学期权对应一单位标的。** 股价、期权价值、现金与净值均为元；h为标的数量。没有真实交易所合约乘数或保证金规则。

调用原 `ExperimentMath.bs` 得到V与含股息Delta；卖方Delta为−Δ。Call的Δ为exp(−qτ)Φ(d1)，Put为exp(−qτ)(Φ(d1)−1)。初始对冲持仓h0=Δ0；不对冲h0=0。所有策略收到同一V0：

```
B0 = V0 - h0*S0
Π0 = h0*S0 + B0 - V0 ≈ 0
```

每个观察步Δt=T/N，按以下顺序更新：

```
I_i = B_(i-1) * expm1(r*Δt)
D_i ≈ h_(i-1) * q * S_(i-1) * Δt
B_before = B_(i-1) + I_i + D_i
h_i = 新Delta（仅动态策略且 i<N、i %% interval == 0）
Q_i = h_i - h_(i-1)
tradeCash_i = -Q_i*S_i
B_i = B_before + tradeCash_i
Π_i = h_i*S_i + B_i - V_i
```

负现金按同一r借款计息；Put对冲空头股票的股息为负支出。股息使用**左端点矩形近似、期末入账、不另计期内股息利息**，不是连续积分精确值。持仓在每个区间内保持不变，不根据未来价格选择头寸。每次交易只在股票和现金间转换，不注入外部资金。

自融资验证独立检查：

```
(h_i*S_i+B_i) - (h_(i-1)*S_(i-1)+B_(i-1))
 = h_(i-1)*(S_i-S_(i-1)) + I_i + D_i
```

到期行不再计算或交易Delta，Delta/Gamma为“—”，V_N直接取max(S_N−K,0)或max(K−S_N,0)。**终点表格是清算前账户**，随后股票全部变现并支付期权：

```
最终现金 = B_N + h_N*S_N - payoff(S_N) = Π_N
清算后股票 = 0
```

这样既不重复扣除到期支付，也不把付款后的现金再减一次V。正终值为卖方账户剩余、负终值为缺口；这是单条路径的净值/复制误差，不是收益率或保证盈利的证据。

连续股息的自融资分解可参阅 [Pricing and Hedging Derivative Securities §9.3](https://book.derivative-securities.org/Chapter_BlackScholes.html#replication-and-delta-hedging)，连续与离散对冲的区别亦见 [Columbia课程作者讲义](https://martin-haugh.github.io/files/ContinuousFE/BlackScholesCtsTime.pdf)。本项目的具体股息离散近似和终点记账口径以上述实现为准。

输入沿用原BS域：S,K∈[.01,100000]、T∈[0,10]、r∈[−.1,.3]、q∈[0,1]、σ∈[0,2]；N与interval为[1,504]整数，seed为[0,2147483646]整数。

- T=0说明已经到期，不伪造到期前对冲过程。
- σ=0可模拟确定性非折点案例；若Delta不唯一，停止并说明，绝不补造0或0.5。
- 模拟价格若超出原BS教学域，明确报错并清空轨迹，不截断、不重抽路径。
- interval≥N时动态策略没有中间调仓，结果与静态策略一致；到期清算不视为重新Delta中性。

## 4. 路径、默认答案和R执行

风险中性GBM：S_(i+1)=S_i exp[(r−q−σ²/2)Δt+σsqrt(Δt)Z_i]。同一seed、N和金融参数复现同一路径；**仅改变interval不改变路径**。

网页与R均采用Park–Miller（状态seed %% 2147483646+1，模2147483647，乘数16807）及Box–Muller。它用于教学复现，并非密码学随机数。测试还提供固定价格向量跨语言逐期对照，不依赖语言默认随机发生器。

默认S=K=100、T=1、r=.05、q=0、σ=.2、N=60、seed=2027、interval=1、Call：

| 项目 | 结果 |
|---|---:|
| 权利金V0 | 10.450583572186元 |
| 初始Delta/股票h0 | 0.636830651176单位 |
| 初始现金B0 | −53.232481545376元 |
| 初始净值/净Delta | 约0 / 0 |
| 最终S | 100.018173772782元（显示按当前引擎浮点值舍入） |
| 不对冲终值 | 10.968222676919元 |
| 静态Delta终值 | 7.714695723311元 |
| 动态Delta终值 | −0.179012508069元 |

100→105短实验仅改变股价，剩余期限固定1年：新Call价格13.857906267073元，Delta从.636830651176到.723727496763，需买入.086896845587单位股票。旧Gamma×5≈.093810086729，仅为局部近似，不等于有限变化的精确Delta增量。预测提交前隐藏新值、图表、代码与结论；实验执行后才可进入解释。

RStudio：复制左栏基础版或完整版，在新R Script中整段运行；网页不执行R。两版均含路径、价格/Delta、三策略、利息/股息、逐期账户、净值和清算。完整版另外逐期对账并绘图。实际使用 **Rscript** 运行，不把“目视像R”当作验证；RStudio图形界面未自动操作。

默认保持seed与N不变，修改interval后重跑可核对：

| interval | 动态终值（元） |
|---:|---:|
| 1 | −0.179012508069 |
| 5 | 1.188629902373 |
| 10 | 2.507857413968 |
| 20 | 4.203853443509 |
| 60 | 7.714695723311 |

这些数值只属于默认路径，不能据此断言任意路径误差必然单调。

## 5. 实际测试与复跑命令

在项目目录运行：

```sh
node tests/bs-round3.test.cjs
node tests/bs-round3-browser.cjs
node tests/run-regression.cjs
node tests/bs-round1-browser.cjs
node tests/bs-round2-browser.cjs
FINMODEL_TEST_OUT=tests/bs-round3/regression-final-browser node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/bs-round3/regression-final-browser node tests/interaction191.test.cjs --extras
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

| 检查 | 通过/失败 | 证据 |
|---|---|---|
| 本轮账户与跨语言检查 | 362,576断言通过，0失败；154组账户情景；36份真实R脚本 | `math-results.json`、`case-*.R`、对应log/逐期CSV |
| 本轮最终浏览器 | 78检查通过，0失败；复制出的两版R再实际执行并核对终值 | `browser-results.json`、`browser-basic.R.log`、`browser-full.R.log` |
| 数学/教学全回归 | 12套全部通过，0失败（含前两轮及本轮） | `regression-final.log` |
| 第一轮浏览器 | 93通过，0失败 | 原套件输出`tests/bs-round1/browser-results.json` |
| 第二轮浏览器 | 51通过，0失败 | 原套件输出`tests/bs-round2/browser-results.json` |
| 五模型完整浏览器 | 355通过，0失败 | `regression-final-browser/chrome-results.json` |
| 目录/Tooltip定向回归 | 22通过，0失败 | `regression-final-browser/extra-results.json` |
| 构建与陈旧源拒绝 | 通过 | `build-check.log`、`build-integrity.log` |

除特别注明外证据均位于 `tests/bs-round3/`。断言计数包括同一路径每期的多字段核对，**不等于独立实验数量，更不等于教学效果**。

数学覆盖：Call/Put与Delta正负号；q=0/.03/.15；负r；零/高σ；短T；价格教学域边界；无效输入；T=0与零波动折点拒绝；三策略共享路径和权利金；初始零净值；逐期持仓、利息、股息、现金、交易量、净Delta；自融资财富增量；终点真实支付与清算；多interval、静态等价、种子重现；120组固定种子随机参数。36份R包括基础/完整两版、固定路径和独立生成路径，逐期比较17个数值字段及调仓标记，混合容差2e−8。闭式未对冲与静态现金累计还作独立验证。

浏览器覆盖：四模块切换，预测门槛及错误答案反馈，播放暂停恢复，改参取消播放，单步与重复键盘操作，reset与滑块，三账户选择、策略视图，基础/完整代码高亮复制及实际R执行，Tooltip离开/固定/关闭/Escape，触屏步骤及详情，Put股息为负、T=0与空seed拒绝，重载与内容哈希；1440×900、1366×768、1920×1080、375×812和1366投屏模式。

开发中的一次浏览器失败来自新增“连续两次Enter前进”测试后，旧断言仍期待只退一步就回到0。修正测试为先回1、再回0后，最终78项全部通过；没有把该次失败计为通过。原失败记录为`keyboard-test-expectation-failure.json`。没有隐藏功能性失败或把尚未执行的检查算作成功。

## 6. 浏览器会话、截图与限制

新Chrome自动化会话是实际安装Chrome，已验证最终构建。原生Chrome已有标签在刷新前仍显示第二轮DOM；刷新后工具只能读到浏览器栏，网页树为空，**原Chrome标签的迁移验收仍未确认**，不把新会话的成功当作所有旧标签均成功。记录见`original-chrome-verification.txt`。

另在用户可见内置浏览器实际打开最终页面、切换第四模块并核对初始中性和动态调仓，作为保留的交付页面。

真实截图：
- `initial-1440.png`：初始卖方/股票Delta抵消与现金。
- `prediction-explain.png`：实际100→105实验及解释。
- `path-1440.png`、`path-1366.png`、`path-1920.png`、`path-375.png`：逐步股价与调仓。
- `performance-final-1440.png`：完整三策略净值曲线。
- `terminal-ledger-1440.png`：终点清算与最终误差。
- `put-dividend-ledger.png`：Put负持仓及股息支出。
- `projector-1366.png`：投屏模式。

页面没有横向溢出；较低屏幕中当前账户与比较表需要在中栏局部滚动，不覆盖图线。长R行保持局部横向滚动。已做本机触控模拟和键盘验证，尚未做真实触控设备、Safari/Firefox、真实课堂投影机、跨设备、弱网与多人并发验收。

金融限制：单条GBM路径，无跳跃、随机波动、独立定价/模拟波动率、交易成本、借贷利差、股票借券费或保证金；股息是显式离散近似；没有多路径误差分布面板。网页不执行R；没有实际操作RStudio GUI。σ=0确定性折点和超出教学域的路径明确不支持。以上均未被冒充为已实现。

## 7. 课程目标逐项核对

本表依据本轮用户列出的实验11目标、已知前两轮目标和此前“R”会话可读取内容。当前`sources/`为空，原始教师大纲附件没有在可访问上下文中出现，因此**这是已知实验11目标的逐项核对，不声称已逐字审查完整原始教学大纲**。

| 已知教学要求 | 功能/技术状态 | 学习表现验收方式（待教师/学生实际完成） |
|---|---|---|
| 理解欧式Call/Put与BS公式 | 已实现并回归 | 独立解释S、K、T、r、q、σ及支付函数 |
| R计算期权价格 | 两版真实R运行通过 | 学生在RStudio重现默认结果并改参 |
| 连续股息影响 | q、含股息价格/平价/图与探索保留 | 固定其他参数，预测并解释Call/Put随q变化 |
| Greeks | Delta/Gamma/Vega/Theta与量纲保留 | 区分Vega每百分点与原始导数，解释Delta/Gamma |
| 二分法IV | 区间扩展与逐步轨迹保留 | 手动解释一轮保留哪一半区间 |
| Newton IV | 切线、raw Vega、失败状态保留 | 解释低Vega或越界失败，不能只报20% |
| 初始卖方Delta对冲 | Call正股票/Put空股票与现金已实现 | 算出h0、B0、净Delta与Π0 |
| 股价变化与Gamma | 严格预测→实验→解释已实现 | 解释100→105后为什么要改仓，以及Gamma的局部性 |
| R动态Delta对冲 | 可复现路径、调仓间隔、逐期账户已实现 | 保持seed/N不变，改interval并核对R终值 |
| 不对冲/静态/动态比较 | 同路径、同权利金、同融资假设 | 比较全过程净值与终值，避免“某策略必然最好” |
| 自融资与到期支付 | 逐期对账及真实支付/清算通过 | 独立说明利息、股息、股票交易和期权负债分别在哪入账 |
| 模型假设和局限 | 页面与R均明确 | 区分连续复制理论与离散模拟，提出真实市场额外误差 |

所有“已实现”均指功能和技术验证，**不等于学生已学会**。本轮没有真实学生课堂测试、前后测、完成率、学习用时或访谈数据。

## 8. 100分制初步教学评价：91/100

这是本次明确列出的**开发者教学设计预评量表**，并非教师正式评分、学生学习效果分数或用户曾提供的官方量表；没有用自动测试数量加教学分。

| 维度 | 得分 | 依据与扣分 |
|---|---:|---|
| 已知课程目标覆盖（30） | 29 | 定价→股息/Greeks→IV→对冲形成闭环；原始教师大纲附件未逐字核对，完整覆盖仍需教师确认 |
| 金融数学与账务解释（25） | 25 | 同路径公平比较，自融资顺序、股息近似、单位、期限与清算明确；未将单路径胜负泛化 |
| 可独立运行的R实践（20） | 19 | 基础/完整脚本及可核对任务齐全；初学者代码理解与RStudio实际操作仍需观察 |
| 可视化与可操作性（15） | 13 | 逐步/播放/比较/代码联动可用；1366中栏需局部滚动，长R行的课堂阅读负担仍应实测 |
| 教学验证（10） | 5 | 预测门槛与讲解流程已走通（5/5）；真实教师/学生课堂效果尚无证据（0/5） |
| 合计 | **91** | 具备完整教学验收候选条件，尚不能宣布达到95分课堂效果 |

建议本次验收实际检查四件事：学生能否独立算出初始现金；能否在预测实验中说明Gamma；能否在R中只改变interval保持同路径比较；能否解释某条路径更频繁调仓也未必误差更小。由教师审查原始大纲，并在自愿小范围课堂中观察后再评分。**本轮到此停止，不自动开发实验08。**
