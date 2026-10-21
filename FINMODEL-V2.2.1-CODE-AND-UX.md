# FinModel Lab v2.2.1 · 完整R代码优先与实验11精修

## 运行身份与交付范围

已直接修改原项目，没有新建原型。五个已上线实验默认完整R代码；实验11保留四模块、自由改参、数值算法、Greeks和完整对冲账户。其他四模型只调整代码模式、复制、代码区域及实践入口；没有重构其金融教学界面。

- 项目绝对路径：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`
- 实验11：http://127.0.0.1:8765/experiments.html?model=bs
- Delta直接入口：http://127.0.0.1:8765/experiments.html?model=bs&lesson=hedge
- 服务身份：http://127.0.0.1:8765/__finmodel__/status
- 最终构建：`2.2.1-code-ux.3fcc8ca14b0b3b0f`
- 最终进程PID：20457，文档根为上述项目的`dist`。
- 启动：进入项目目录后执行`python3 tools/serve.py`。当前已运行，不要重复启动占用同一端口。

修改前验证了PID10410、原v2.2构建及5项HTTP资源与本地文件一致；源码快照和身份记录在`tests/code-ux-221/before/`、`identity-before.json`。修改后从同一绝对目录重启。最终DOM、manifest、服务身份相同，8项HTTP资源SHA256逐字节与本地一致，详见`identity-after.json`。

9项金融核心源与此前交付哈希一致：`experiment-math.js`、`bs-lesson.js`、`iv-math.js`、`iv-code.js`、`hedge-math.js`、`hedge-code.js`、`math.js`、`lessons.js`、`experiment-lessons.js`。证据`engine-integrity.json`。本轮没有无故重写定价、Greeks、求根、路径、账户或其他模型的金融计算。

## 完整R代码统一规则

五模型统一为“完整代码｜关键逻辑”。新页面、刷新或切换实验11金融模块默认完整代码；当前阅读中主动选择关键逻辑，修改参数仍保留阅读模式。没有使用旧缓存覆盖默认值。

主要复制按钮明确标为“复制完整 R 代码”，无论查看哪种模式都复制独立完整脚本。实验11删除重复的基础脚本复制按钮，保留单一主复制和RStudio实践。其他模型原复制入口改为明确的完整脚本；均值—方差增加相同的模式选择与实践说明。已有参数、函数、结果输出和边界处理均保留。

完整代码通过简短章节注释区分参数、金融计算、结果、图表。原有金融核心函数没有被重写；展示适配器只增加章节或当前实验输出。脚本全部仅需基础R，没有额外包。网页不执行R，不依赖JavaScript变量或其他页面环境。

| 实验 | 完整脚本内容 | 跨语言数据核对方式 |
|---|---|---|
| 06 GARCH | 参数、160期冲击、方差/残差递推、结果与图表、约束 | 同一显式sin冲击序列，第41期冲击可调；不是随机样本拟合 |
| 07 VaR/ES | 同一收益/损失数据、经验分位数、概率质量加权ES、正态法与输出 | 两端按相同整数公式构造等权合成情景；核对完整损失序列 |
| 08 均值—方差 | 资产参数、权重、协方差项、风险收益、约束最小方差、有效前沿、绘图输出 | 确定性参数与同一权重网格；核对当前值、最小权重和有效点数 |
| 09 CAPM | 年度理论CAPM、固定60个月合成超额收益、OLS、结果图表 | 同一sin/cos合成样本；核对全部x/y与回归系数，不声称真实市场拟合 |
| 11 BS四模块 | 含q的完整定价/Greeks；当前支付或敏感性；两种求根；风险目标或全路径账户 | 价格/Greeks用同源实现；动态使用相同Park–Miller和Box–Muller算法，逐点/逐期核对 |

实验11风险抵消完整脚本包括BS函数、当前目标、初始参照、需交易数量及当前新建账户资金；只有切换动态调仓时才显示完整路径和三策略模拟。当前目标没有冒充已执行交易。动态完整脚本保留利息、股息、逐期交易、自融资对账、到期支付与清算。

左栏控制区独立于代码滚动区，完整程序不会撑长桌面页面。代码维持原字号，优先在R合法语法位置换行，再允许显示折行/局部滚动。行号和语句均是界面元素，复制只取纯R源文本。均值—方差新增模式栏后单独适配其五行网格，避免代码区被误压成分隔条大小。

## 实验11的精修

### 定价基础

保留Call/Put两曲线、当前点、理论价格/到期支付切换。解释根据本次实际编辑的S、K、σ、q、r或T更新，结合前后Call/Put值说明权利、贴现或机会变化；不再无论修改什么都只重复股价规律。期限影响不笼统声称单调。

到期支付明确“未扣权利金，不等于净利润”，详情保留资金时间价值。完整代码包含六参数、函数、d1/d2、两类价格与输出；到期支付视图另输出当前支付。

### 红利与敏感性

入口改为“价格影响｜Greeks敏感性”。价格模式默认展示q与σ和两类价格；Greeks按Delta/Gamma/Vega/Theta更新研究问题、单位、当前值和底部代码解释。修改q或σ后，显示该指标在本次条件下的实际变化，不把方向推广到全部参数。

Delta坐标使用其准确理论范围：Call为[0,exp(−qT)]，Put为[−exp(−qT),0]；合法数据不裁切，不再随通用留白出现明显高于上界的刻度。其他Greek保持按实际数据自动取轴域。Vega为每1个百分点、Theta为每日（负期限导数÷365），Delta不是上涨概率。

完整代码保留含股息价格和全部Greeks，并输出同参数q0比较以及当前选中Greek。

### 隐含波动率

主图附近突出“该假设报价对应的隐含波动率约为…”，数值、迭代次数和误差结论全部取当前算法结果。中间紫点明确为当前迭代估计，另行显示当前区间或Newton信息。对比表用二分法/牛顿法、估计波动率、迭代次数、成功/失败；精确科学计数误差放在详情。只有实际误差满足条件时才显示“小于0.0001元”。

报价默认显示10.4506元，聚焦后暴露完整值10.450583572185565并选择文本供替换；仅失焦格式化不改变保存的数值。实际输入按新值计算、同步复制。真实复制R核对包括“仅聚焦/失焦不编辑”和“主动换成12.3456789012345”，防止四位显示反向覆盖计算精度。

纯二分与纯Newton算法身份、Vega小数单位、边界、低Vega、越界/上限及精度停止均保留。Newton失败时，头部直接给出失败原因，不保留旧20%成功结果，也不借用另一方法的结果冒充成功。对比视图头部明确为二分最终结果，表格分别列两方法状态。

### Delta风险抵消与动态调仓

默认仍为符号方向正确的风险抵消图。100→105同一剩余期限时，初始实际参照.636830651176不变，当前目标.723727496763，需进一步买入.086896845587。Put股票方向为卖空。仅重新计算目标没有自动执行交易。

“对冲策略表现”图例整合三策略的简短定义，不额外增加三张卡片。选择不对冲、静态或动态后，选中曲线加粗并保持不透明，其他曲线降低权重但仍可见。棕/蓝/绿含义和虚实线不随选择改变。

默认结果聚焦当前策略、当前组合净价值，解释这是期权空头与相应账户头寸的当前净值，未到期不是已实现利润。当前股价/Delta、股票、现金、利息、股息、本期交易和期末模拟误差移到“查看完整对冲账户”。图轴写“卖方组合净价值（元）”，不泛称收益。最终误差没有冒充尚未到期时已经实现的收益。

调仓间隔直接优先显示，其次N；seed进入更多参数。提示间隔越小调整越频繁，但单路径结果未必更好。只有interval变化时路径完全相同，改参停止播放并清除失效进度和Tooltip。

## 代码、数学、图表与参数联动

完整代码的选择不再按“第几行”猜金融含义。显示适配器给金融语句及其换行部分保留语义标记：d1、d2、股息/执行价贴现、Call、Put、Delta、Gamma、Vega、Theta、二分中点、残差、原始Vega、Newton更新、持仓、现金、调仓与净值。点击后底部给对应简短解释，详细公式和精确代入可展开。

Call/Put突出对应曲线、当前点和结果；风险抵消的Delta/股票/净Delta分别突出对应条形关系；Greek只突出当前指标；动态现金语句给出当前账户口径。输入验证、辅助循环和输出格式不强行绑定曲线。保留原其他模型的逐逻辑块解释与分隔器。

## 真实R与参数一致性

执行环境：本机Rscript 4.6.1，新增验收使用`Rscript --vanilla`独立会话，避免预先定义函数或变量。没有实际操作RStudio GUI；RStudio实践说明与其底层R执行分别表述。

新增生成脚本测试：**22份完整脚本、4,153个数值检查、0失败**。覆盖五模型默认与改参、四模块、四Greek、Call/Put、q>0和动态interval5。检查完整GARCH冲击/方差/残差、VaR损失序列、CAPM样本、IV两算法误差/步数，以及动态股票路径、持仓、现金、净值、利息、股息和交易现金流。

数值容差为`1e-8 + abs(expected)*1e-10`；该批最大绝对误差约`6.8394e-10`。前端显示精度未参与底层计算。证据：`math-r-results.json`、`generated-*.R`及日志。

浏览器从页面**实际复制19份完整脚本**，在相同干净R会话执行，核对**4,116个输出值**，全部通过。包括五模型默认、关键逻辑视图中改参后复制、默认报价不编辑、动态Call与Put/q/interval。不是仅调用生成函数或检查代码字符串。证据：`copied-r-results.json`、`copied-*.R.log`。

## 测试命令与结果

在原项目目录运行：

```sh
node tests/run-regression.cjs
node tests/code-ux-221.test.cjs
node tests/code-ux-221-browser.cjs
node tests/zero-friction-browser.cjs
node tests/bs-round1-browser.cjs
node tests/bs-round2-browser.cjs
node tests/bs-round3-browser.cjs
FINMODEL_TEST_OUT=tests/code-ux-221/full-final node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/code-ux-221/extras node tests/interaction191.test.cjs --extras
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

| 检查 | 实际结果 | 证据 |
|---|---|---|
| 总数学/教学/R回归 | 15套通过、0失败 | `regression-final.log`、`regression-results.json` |
| 原三轮BS数学与R | 13,514/76,909/362,576断言及28/29/36R通过；第三轮154账户情景 | 原测试结果及总回归日志 |
| 原v2.1/v2.2数据和R | 85检查/46R、46检查/21R通过 | 总回归中teaching-ux、zero-friction |
| 新完整代码与R | 4,153值、22脚本，0失败 | `math-r-results.json` |
| 新五模型/四模块浏览器 | 273检查、19份实际复制R，0失败 | `browser-results.json`、`browser-run.log` |
| 自由探索专项 | 152检查、14份实际复制R，0失败 | `free-browser-final.log`，原`tests/zero-friction/browser-results.json` |
| 原前三轮完整工作台浏览器 | 93+51+78通过、0失败 | `round1/2/3-browser.log` |
| 五模型原完整交互 | 355通过、0失败 | `full-browser-final.log`、`full-final/chrome-results.json` |
| 目录与Tooltip专项 | 22通过、0失败 | `extras-browser.log`、`extras/extra-results.json` |
| 构建、陈旧构建拒绝 | 通过 | `build-check-final.log`、`build-integrity-final.log` |

计数是自动化字段/行为断言，不是学生数量；套件与R脚本可能重叠，不能简单相加作为教学成效。15套中保留全部旧金融数学与R校验，新增套件只做必要适配层与代码执行对照。

新浏览器专项覆盖：五模型直达/刷新完整默认；关键模式改参后不丢阅读选择；任意模式主复制均完整；代码区域实际高度和独立滚动、复制常驻；四模块代码截图；d1/Call/Vega/股票/净Delta/现金语义高亮与校验行不误高亮；Greeks问题/范围/单位/改参解释；IV精度/最终与当前/失败；三策略颜色/突出/定义/账户；暂停、Tooltip离开隐藏和Esc、目录01至12、无强制步骤。

1920×1080、1440×900、1366×768和375×812均检查了五模型及实验11四模块。桌面页面不因长代码被拉长；窄屏允许按现有布局滚动访问。真实125%通过隔离临时Chrome配置的浏览器设置完成，DPR1.25、CSS viewport1093、根CSS zoom1。五模型均检查代码高度和复制位置；没有使用CSS zoom替代，也没改用户日常Chrome设置。

## 实际浏览器截图

均来自最终HTTP页面，目录`tests/code-ux-221/`：

| 内容 | 截图 |
|---|---|
| 定价基础完整代码 | [pricing-full.png](tests/code-ux-221/pricing-full.png) |
| 红利价格与完整代码 | [dividend-full.png](tests/code-ux-221/dividend-full.png) |
| IV完整代码与当前/最终解 | [iv-full.png](tests/code-ux-221/iv-full.png) |
| Delta完整代码默认 | [hedge-full.png](tests/code-ux-221/hedge-full.png) |
| Vega语句与曲线联动 | [greeks-vega-full.png](tests/code-ux-221/greeks-vega-full.png) |
| Put负Delta合法轴域 | [greeks-put-full.png](tests/code-ux-221/greeks-put-full.png) |
| 算法易读比较 | [iv-comparison-full.png](tests/code-ux-221/iv-comparison-full.png) |
| S105初始/目标区分 | [hedge-105-full.png](tests/code-ux-221/hedge-105-full.png) |
| 动态策略加粗和说明 | [dynamic-performance-full.png](tests/code-ux-221/dynamic-performance-full.png) |
| GARCH完整默认 | [garch-full.png](tests/code-ux-221/garch-full.png) |
| VaR/ES完整默认 | [var-full.png](tests/code-ux-221/var-full.png) |
| 均值—方差完整默认 | [portfolio-full.png](tests/code-ux-221/portfolio-full.png) |
| CAPM完整默认 | [capm-full.png](tests/code-ux-221/capm-full.png) |
| 125%与多尺寸 | `chrome125-full.png`、`chrome125-portfolio/var/garch/capm.png`及各模型`-1920/-1440/-1366/-375.png` |

另已在可见内置浏览器打开Delta，读到默认完整代码、章节、完整BS函数、复制完整R按钮和风险抵消结果，保留为交付页面。自动化使用新的真实安装Chrome测试会话；用户原Chrome旧标签迁移没有得到确认，不能把新会话成功当成所有旧会话成功。

## 开发中发现并修复

1. 新浏览器测试初次漏写`.cjs`后缀，未实际运行；修正后完整执行，不把初次失败算通过。
2. 报价聚焦显示全精度时，替换输入可能接在原文本后。实际复制R测试发现新报价没有如预期替换；修正聚焦后的文本选择，并以新报价和仅聚焦/失焦两种情况核对。
3. 均值—方差新增模式栏后，原四行代码网格没有容纳新节点，代码被压得过小。截图审阅发现，改为专门五行网格，增加实际代码区高度断言，并重跑五模型355项及跨屏专项。

开发失败记录可能保留在`browser-failure.json`、`failure.png`或初期日志中；最终验收以`browser-results.json`、`regression-results.json`、最终运行日志及最终截图为准。

## 修改文件清单

产品源文件：

- `dist/zero-friction-data.js`：默认完整状态、当前模块自足完整脚本、章节、语句语义标记。
- `dist/teaching-ux.js`：单一完整复制、模式生命周期、精度编辑、当前/最终结果、解释、账户和语义联动。
- `dist/teaching-ux-charts.js`：Delta合法轴域、曲线身份、策略加粗/透明度与稳定配色。
- `dist/experiments.js`：GARCH/VaR/CAPM默认完整、主复制始终完整、实践入口与原BS完整模块切换。
- `dist/lesson-presentation.js`：完整脚本金融逻辑章节注释；不改计算。
- `dist/hedge-workbench.js`：原对冲完整工作台默认完整、主复制完整。
- `dist/app.js`：均值—方差完整/关键阅读控制、章节与实践入口；主复制仍完整。
- `dist/index.html`、`dist/experiments.html`：代码控件、明确复制文案、均值—方差实践对话框，另随构建更新资源身份。
- `dist/experiments.css`、`dist/workbench-system.css`：代码滚动/高度、语义高亮、IV结果、策略说明与均值—方差代码网格。
- `tools/build-workbench.cjs`：版本标记改为2.2.1-code-ux。

测试和文档：

- 新增`tests/code-ux-221.test.cjs`、`tests/code-ux-221-browser.cjs`、本文档和`tests/code-ux-221/`证据。
- `tests/run-regression.cjs`加入新套件。
- `tests/zero-friction-browser.cjs`依据新要求更新复制/模式、语义定位、seed折叠及当前值显示契约；保留原功能断言。旧脚本保存于before，不是删除金融功能测试来凑通过。
- `README.md`增加交付索引。

生成产物：`dist/portfolio-bundle.js`、`experiments-bundle.js`、`build-info.js`、`build-manifest.json`及两HTML资源身份。既有测试输出按原机制更新。源码差异见`tests/code-ux-221/source-changes.patch`。项目无已跟踪Git基线，未重置或提交用户文件；只读`sources/`未改动。

## 限制与未测试项

- 真实执行的是干净Rscript，未自动操作RStudio GUI；实践入口提供粘贴整段运行说明。网页没有R执行器。
- 用户原Chrome旧会话的可读性/缓存迁移未确认；当前服务哈希、新Chrome和新内置浏览器独立验证通过。
- 完整代码默认较长，需要左栏内部滚动；核心金融语句可点击解释，关键逻辑仍可选。不是把整份脚本同时塞入首屏。
- 自由探索与原完整工作台参数仍各自保存，进入原工作台有明确提示；阅读模式不跨页面缓存，参数刷新恢复默认。
- 尚未测试Safari/Firefox、真实触屏/投影硬件、弱网和多人并发；没有声称全部设备或会话均通过。
- 原离散调仓、股息左端点近似、无交易成本、允许借贷/卖空/分数股票等假设保持；模拟不是市场预测或盈利保证。
- 未做真实学生访谈、课堂试用、用时测量或学习效果前后测；自动化与R数值正确性不能替代教学效果评价。

本轮完成后等待实验11教学验收，不自动扩展其他实验的金融内容。
