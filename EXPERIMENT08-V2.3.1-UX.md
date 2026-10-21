# FinModel Lab v2.3.1｜实验08多资产交互与教学体验精修

已在原项目完成本轮全部P0/P1代码改动与真实验证：权重便捷调整/精确输入、组合身份与重合处理、真实优化对比、完整R代码导航、图表空间与视觉层级。未另建项目、未增加金融模型、未恢复学习门槛。

## 运行身份与冻结范围

- 项目：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`
- 页面：http://127.0.0.1:8765/index.html ，选择“多资产组合”。用户原内置浏览器标签页已刷新并确认新入口。
- 最终构建：`2.3.1-portfolio-ux.7854bf7d1bee3f9e`
- 当前服务PID：36377；实际文档根：原项目 `dist`。
- 身份：http://127.0.0.1:8765/__finmodel__/status

```sh
cd /Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab
python3 tools/serve.py
```

当前已经运行，毋须再启动第二个8765服务。修改源文件后用 `node tools/build-workbench.cjs` 构建；服务版本身份需要重启后与最终构建一致。

开发前已核实v2.3.0构建 `2.3.0-portfolio.1973647664e77e3b`、原PID30121、运行目录、磁盘/HTTP资源以及真实Chrome加载的DOM与脚本哈希一致。开发前证据在 `tests/portfolio-231/identity-before.json`、`browser-identity-before.json` 和 `before/`。已阅读实验08源码、测试和前轮交付记录，沿用现有组件。

最终服务、manifest、DOM与实际脚本一致；12项HTTP资源SHA256及12项版本响应头全部一致，见 `identity-after.json`、`browser-identity-after.json`。

`portfolio-multi-math.js`、`portfolio-csv.js`、双资产 `math.js/app.js/lessons.js` 和原有金融/探索模块保持开发前哈希。实验11及06/07/09源文件、原共享CSS/字体、`experiments-bundle.js` 均未改动。明确的哈希清单见 `source-integrity.json`。R生成器仅把GMV绘图符号改为空心菱形；目标点绘图由展示层补充，没有改写优化算法。

## P0-1：权重输入与完整精度

权重现在有三个不同层次：

1. **已应用状态**：`committedWeights`，完整精度，用于收益、方差、标准差、图表与R脚本。
2. **编辑草稿**：`weightDrafts`，保留原始输入文字，允许暂时为空、选中、高精度粘贴及连续输入。
3. **两位小数显示**：只影响输入框失焦后的显示，不会反向覆盖已应用状态或原始草稿。

聚焦时展示完整精度并选中文本；失焦、Enter或精确模式的“应用权重草稿”才提交。单纯聚焦/失焦不会重算或改变R脚本。输入框加宽、数值右对齐、百分号独立、字段高度一致，字号没有缩小；右侧面板的全局列宽保持不变。各项显示值可能因独立舍入出现0.01个百分点的合计差；合计与金融计算均使用完整精度。

### 默认：便捷调整

界面明示：“修改一个资产权重时，其余资产按原有比例自动调整，确保合计100%。”

提交第i项的新权重u后，将剩余资产按原有相对比例分配剩余预算。实现用其余权重的实际和作为分母，等价于 `w'_j=w_j(1-u)/(1-w_i)`，并仅作浮点尾差补足，避免预算漂移。原有其余资产之和为0且需要正的剩余预算时，平均分配，并在界面说明。若剩余预算为0，其余权重全部为0。

实际手算例已在浏览器验证：`20%/30%/50% → 修改A为40% → 40%/22.5%/37.5%`。

负数、超过100%、非数字、非有限值、空草稿不会进入正式计算。3/4/5资产均实际测试0%、100%、从100%恢复、原其余资产全为0、高精度以及快速连续编辑，未产生NaN、Infinity或非法预算。

### 精确输入

各项独立填写，其余项不自动改写。只有各项非负、单项不超过100%、预算误差不超过1e-10时才应用；不合法时显示实际草稿合计和“尚未应用”。草稿与上一组有效权重分开保存，图表保留，并明确说明显示的是上一组有效组合；复制和优化应用暂停，避免把旧结果误认为非法草稿的结果。

“按比例归一化”使用所有非负、合计大于0的原始草稿数值计算，不使用两位显示数值。合计为0、含负数或未完成输入时给出明确提示。用户可以主动放弃草稿。未应用的非法草稿存在时，切换便捷模式会要求先应用/归一化或主动放弃；不会无声丢弃草稿或自动归一化。

输入开始时立即结束旧优化对比，包括移除图中的调整前标记与连接线；没有清空整张可行集图。

## P0-2：当前、GMV与目标收益组合

| 身份 | 固定符号 | 含义与状态 |
|---|---|---|
| 当前组合 | 蓝色圆点 | 已应用权重对应的收益、风险和权重；不一定最优；未应用草稿不会移动它 |
| GMV | 绿色空心菱形 | 当前约束下全局方差最低的组合，不一定收益最高 |
| 目标收益组合 | 橙色点 | 指定收益等式约束下的最低方差解；应用前不改变当前模型权重 |
| 调整前 | 灰色空心圆与虚线 | 最近一次模拟调整的有效组合，非永久历史轨迹 |
| 可行点/前沿 | 浅灰点/绿色实线 | 前者为采样，后者连接真实优化解，采样不参与求解 |

图例、主图、Tooltip以及R中GMV符号保持对应。详情展示组合名称、μ、σ、方差与全部资产权重；目标详情另列目标要求和实际结果。目标不可行时不显示虚假解，禁止应用，原矩阵/PSD/奇异与显式正则提示保留。

当前=GMV、当前=目标或三者重合时，生成单个组合标记，组合使用空心菱形、蓝色中心和/或橙色环，并加“GMV = 当前”等标签；Tooltip明确说明哪些身份重合。图例仍允许独立选择每种身份。没有为了区分而移动点的真实金融坐标。

临时悬停详情在离开后消失，主动点击才固定；Esc和关闭按钮可关闭。浮层约束在主图容器内；短屏详情可在浮层内滚动。

动态解释来自实际优化：比较当前收益下的最小方差解，以及从当前收益/GMV收益较高者求得的支配见证。对方差采用绝对加尺度相对容差，对收益/风险重合采用 `1e-9+1e-8*scale`，避免浮点扰动造成结论闪变。解释分别区分“同收益更低风险”“同风险更高收益”与“前沿附近无明显改进”，不看图猜结论。

## P1-1：真实优化前后对比

点击应用时先复制当前有效组合的完整权重、收益、方差、标准差；同时保存预算、long-only、无无风险资产、正则λ、单位、μ和Σ等约束/模型快照，再应用优化解。

对比区显示两项指标的前/后值，以及完整精度差值转换的百分点：`Δμ=(μafter-μbefore)*100`、`Δσ=(σafter-σbefore)*100`。方向用真实差值判断，允许收益和风险同时下降，或目标收益提高同时风险增加；最优附近则明确“没有产生明显变化”。权重与约束快照按需展开。

下表取自本轮实际浏览器结果 `browser-results.json`，不是固定写入产品的改善幅度：

| 实际操作 | μ调整前→后 | σ调整前→后 | Δμ（百分点） | Δσ（百分点） |
|---|---:|---:|---:|---:|
| 默认3资产应用GMV | 10.970000% → 9.442810% | 11.752505% → 10.367792% | −1.527190 | −1.384714 |
| 已在GMV，再次应用GMV | 9.442810% → 9.442810% | 10.367792% → 10.367792% | 0 | 0 |
| 从GMV应用14%收益目标 | 9.442810% → 14.000000% | 10.367792% → 22.000000% | +4.557190 | +11.632208 |

第三例的最优权重为B=100%，其余为0。它清楚说明提高目标收益可能需要承担更多风险。

图中只保留最近一次调整前空心参考点、调整后当前点和连接线；新优化覆盖前次快照。编辑权重、改资产假设、目标、数据窗口、单位、导入数据或重置会结束旧对比，防止不同条件的快照混用。复制代码/R输出对应当前配置，而非把历史快照冒充现配置。

对比标题明示“模拟配置调整（非真实交易）”；应用从不执行真实持仓或金融交易。

## P1-2：完整R代码段导航

新增“参数｜协方差｜组合风险｜GMV｜有效前沿”五个紧凑跳转按钮，默认仍为完整代码。

导航根据当前R脚本的真实语义定位：参数章节、`Sigma_raw`构造、`portfolio()`、`optimize_portfolio()`、前沿目标生成章节。CSV与假设脚本分别定位其实际协方差语句，不依赖固定行号。点击仅改变左栏内部滚动、代码高亮、焦点和解释，不滚动整页，不改变代码内容，不按顺序解锁。

参数或CSV重算后，按语义重新定位高亮，并更新解释中的当前数值；不把原行号继续套在已经变化的脚本上。监听采用单次委托，重绘不重复注册。

行号、R语法高亮、点击行解释、当前参数、公式、完整复制和RStudio实践入口保留。关键逻辑仍可选，切换只改变阅读范围；主复制始终使用完整脚本。CSV收益样本继续直接内嵌，无额外包、网络或丢失文件路径依赖。R生成器的优化函数未改动。

## P1-3：图表尺寸与层级

中间顺序调整为问题、当前组合μ/σ、主图、图例、动态诊断、应用按钮、最近一次对比、折叠原理。默认不增加矩阵卡片或复杂向导。

SVG改为按实际容器像素生成viewBox，横纵轴字体、边距与绘图区相匹配，不再依赖固定600宽并给高宽比设置过大的下限。ResizeObserver跟随容器、对比区和窗口变化；图域包含当前、GMV、目标与最近调整前点，避免标记被裁切。点云降低视觉权重，精确前沿和三类标记突出；坐标单位仍与参数/数据口径同步。

桌面图例与按钮按正常文档流排列，换行不会覆盖操作；Tooltip、刻度与轴标题边界有实际浏览器检查。对比区采用受限高度并支持内部滚动，避免短屏无限挤压主图。125%时仍为真实浏览器缩放，不使用CSS zoom模拟。

双资产仅在实验08独立CSS中减少默认指标区空白，把约40px空间还给主图；有比较基准时恢复所需空间。`app.js`、计算、相关系数、资产端点、诊断与探索未改动，原355项交互及22项补充回归通过。

## 测试命令与实际结果

在原项目目录执行（本机需有Node、基础R、Playwright和已安装Chrome）：

```sh
node tests/run-regression.cjs
node tests/portfolio-ux231.test.cjs
node tests/portfolio-multi.test.cjs
node tests/portfolio-231-browser.cjs
node tests/portfolio-multi-browser.cjs
FINMODEL_TEST_OUT=tests/portfolio-231/legacy node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/portfolio-231/extras node tests/interaction191.test.cjs --extras
node tests/code-ux-221-browser.cjs
node tests/portfolio-231-gallery.cjs
node tests/portfolio-231-identity.cjs after
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

| 检查 | 本轮真实结果 | 证据 |
|---|---|---|
| 统一数学/教学/R回归 | 17套通过、0失败 | `regression-final.log`、`regression-results.json` |
| 新权重/快照/容差计算 | 5,455项通过 | `interaction-math-results.json` |
| 原多资产优化与R | 17,083项、24次干净R会话通过，最大检查差约8.94e-12 | `engine-r.log`、`optimization-r-results.json`及原R日志 |
| v2.3.1真实Chrome专项 | 291项通过，11份页面实际复制R执行与逐值核对通过 | `browser-final.log`、`browser-results.json`、`copied-*.R.log` |
| 原多资产/CSV浏览器回归 | 120项通过，12份实际复制R通过 | `csv-regression-results.json`；原`tests/portfolio-upgrade/`执行证据 |
| 原五模型交互 | 355项通过 | `legacy/chrome-results.json` |
| 双资产诊断/撤销/Tooltip补充 | 22项通过 | `extras/extra-results.json` |
| 原v2.2.1完整代码/实验11四模块 | 273项通过，19份实际复制R通过 | `code-ux-final.log`、`full-code-regression-results.json`及原输出 |
| 构建一致及陈旧产物拒绝 | 通过 | `--check`和`build-integrity.test.cjs`实际输出 |
| 服务与浏览器版本/资源 | 原目录；12项HTTP哈希与版本头一致；DOM及脚本一致 | `identity-after.json`、`browser-identity-after.json` |
| 最终截图集 | 无页面异常 | `final-*.png`、`portfolio-231-gallery.cjs` |

所有复制R均通过真正剪贴板读取，再由 `Rscript --vanilla` 在独立会话执行，不是只检查生成器字符串。核对包括完整精度当前权重、当前收益/方差/标准差、GMV、全部前沿点权重/风险/收益和有效目标解；CSV包括导入、权重调整、GMV/目标、归一化、半样本与每期单位。

291项专项覆盖用户Test A—F；Test G由355项五模型、22项补充与273项完整代码回归共同覆盖。目录01～12排序、五模型跳转、五模型默认完整代码及Tooltip行为均重新验证。测试计数是程序断言/输出检查，不是学生数量；套件重叠，不把它们相加作为教学效果。

### 权重边界覆盖

- 3/4/5资产：正常比例调整、0%、100%、从100%恢复、其余资产全0时平均分配、保持非负与预算、当前值/图/R同步。
- 精度：高精度提交和粘贴、显示两位、聚焦完整值、未编辑聚焦/失焦不改变权重或R、快速连续输入不被重绘覆盖。
- 非法输入：负数、>100%、字母、空值、多小数点；保留草稿与旧组合，禁用非法复制/应用，不产生非法值。
- 精确输入：超过/不足预算、全0、原始草稿归一化、主动放弃、切回便捷模式不静默丢弃。
- 比较/识别：当前不在前沿、位于GMV/目标、三重重合、0权重、不可行目标、无变化、风险收益同时下降及同时上升；新输入立即清理旧对比标记。

### CSV保护

`portfolio-csv.js`保持原哈希；没有删除或替换导入流程。原解析/排序、重复日期/列、缺失拒绝/完整行删除、价格正值、样本数、简单/对数口径、年化/每期、导出、样本扰动与R嵌入均回归通过。

本轮浏览器请求记录仅包含本地GET，没有数据上传或第三方请求。随附样例仍是明确标识的合成数据，未增加行情服务，未将它标成真实市场数据。

## 真实截图

全部来自实际HTTP页面，没有截图替换界面或静态原型。

| 场景 | 截图 |
|---|---|
| 默认多资产、完整代码与便捷调整 | [final-multi.png](tests/portfolio-231/final-multi.png) |
| 4资产两位显示，内部保留精度 | [final-weights-4.png](tests/portfolio-231/final-weights-4.png) |
| 5资产权重 | [final-weights-5.png](tests/portfolio-231/final-weights-5.png) |
| 当前=GMV，含权重详情 | [final-gmv-details.png](tests/portfolio-231/final-gmv-details.png) |
| 目标=当前，含目标要求/权重 | [final-target-details.png](tests/portfolio-231/final-target-details.png) |
| GMV真实前后对比 | [final-gmv-comparison.png](tests/portfolio-231/final-gmv-comparison.png) |
| 提高目标、风险上升的真实对比 | [final-target-comparison.png](tests/portfolio-231/final-target-comparison.png) |
| 三类组合同时重合 | [triple-overlap.png](tests/portfolio-231/triple-overlap.png) |
| GMV代码导航 | [final-code-navigation.png](tests/portfolio-231/final-code-navigation.png) |
| CSV实践 | [csv-practice.png](tests/portfolio-231/csv-practice.png) |
| 双资产布局微调 | [final-dual.png](tests/portfolio-231/final-dual.png) |
| 1920×1080 | [default-1920.png](tests/portfolio-231/default-1920.png)、[comparison-1920.png](tests/portfolio-231/comparison-1920.png) |
| 1440×900 | [default-1440.png](tests/portfolio-231/default-1440.png)、[comparison-1440.png](tests/portfolio-231/comparison-1440.png) |
| 1366×768 | [default-1366.png](tests/portfolio-231/default-1366.png)、[comparison-1366.png](tests/portfolio-231/comparison-1366.png) |
| 真实125%缩放 | [real125-comparison.png](tests/portfolio-231/real125-comparison.png)、`zoom125.json` |

125%使用独立临时Chrome配置，DPR=1.25、CSS zoom=1，CSS视口1152×720。未修改用户日常Chrome配置。布局、输入、导航、viewBox与容器一致、刻度/标题、当前点和Tooltip边界均检查。

## 修改文件清单

产品源：

- 新增 `dist/portfolio-ux.js`：比例调整、显式归一化、草稿数值校验、数值近似判断、实际支配诊断与深拷贝比较快照。不替代优化引擎。
- 修改 `dist/portfolio-multi-ui.js`：已应用/草稿/显示状态分离、提交生命周期、两种模式、当前/GMV/目标身份、重合图形、动态解释、真实对比与参考点、语义代码导航、容器尺寸联动。
- 修改 `dist/portfolio-multi.css`：权重字段、导航、图表层级、紧凑对比、短屏适配；双资产仅局部减少指标区空白。
- 修改 `dist/portfolio-multi-code.js`：R中GMV绘图符号与图例由实心改为空心菱形。目标点绘图由UI脚本尾部添加；金融计算函数不变。
- 修改 `tools/build-workbench.cjs`：新增交互辅助模块打包、版本改为v2.3.1。

生成产物：`portfolio-bundle.js`、`build-info.js`、`build-manifest.json`、`index.html/experiments.html`的资源与版本引用。`experiments-bundle.js`逐字节不变。

测试与文档：新增 `portfolio-ux231.test.cjs`、`portfolio-231-browser.cjs`、`portfolio-231-gallery.cjs`、`portfolio-231-identity.cjs`、开发诊断用 `portfolio-231-smoke.cjs` 和 `tests/portfolio-231/`证据；统一回归加入新权重套件。旧 `portfolio-multi-browser.cjs` 将旧“禁止自动分配”场景显式置于精确模式，改用pending判断草稿与新对比区位置，保留其CSV/矩阵/R/目录/缩放断言；原脚本保存在 `before/`。新增本文和README索引。

源码差异见 `source-changes.patch`；项目原无已跟踪源码Git基线，未重置、提交或删除用户原文件；只读`sources/`未改动。

## 开发中发现与修正

1. 聚焦时从两位显示切换完整值，初次自动化填入曾接在原数字后；焦点处理增加文本选择后，真实连续输入、高精度粘贴与Enter/失焦均通过。
2. 首版清理了比较数据但没同步移除旧参考点；补充清除SVG参考点/连接线，并增加“刚开始编辑就立即清除”断言。
3. 原来按行号维持选择会在CSV脚本结构变化后错位；改为语义锚点，并测试CSV与重新估计后高亮仍指向同一金融逻辑。
4. 开发中运行原v2.2.1验收曾因服务器仍报告旧buildId失败；最终从原目录重启后，DOM/服务/manifest统一，并完整重跑通过。没有将这次失败标为通过。
5. 对比区域出现后原图高度会缩小；最终移除重复交易说明，把“非真实交易”合并到对比标题，保留短屏的内部滚动与主图最小可用面积。

开发诊断截图/日志可能保留，最终以 `browser-final.log`、`browser-results.json`、`code-ux-final.log`、`regression-final.log`、`identity-after.json`与本节最终截图为准。

## 验收结论与已知限制

| 本轮任务 | 结果 |
|---|---|
| P0-1 权重输入与归一化 | 已完成，两模式、完整精度/草稿分离及边界验证 |
| P0-2 三类组合教学表达 | 已完成，固定符号、实际诊断、重合说明与独立详情 |
| P1-1 优化前后对比 | 已完成，实际快照/百分点、参考点、无变化与风险收益权衡 |
| P1-2 完整R段落导航 | 已完成，语义定位、内部滚动/高亮、当前值解释、复制完整 |
| P1-3 图表尺寸/层级 | 已完成，实测容器viewBox、多尺寸、真实125%、双资产小幅调整 |

没有本轮P0/P1占位按钮或未接通功能。仍有以下边界：

- 尚未进行真实学生课堂试用、学习效果前后测或RStudio GUI操作；实际R执行是干净Rscript会话。
- 验证浏览器为实际安装Chrome及用户当前内置浏览器。未宣称Safari/Firefox、触屏/投影硬件、弱网/多人并发全部通过。
- 短屏或125%且显示优化对比时，主图面积比默认状态小，右侧参数、对比快照和长详情在各自区域内滚动；没有隐藏金融异常或裁切坐标以换取布局。
- 前沿仍为61个真实优化点连线，点间是绘图插值；密集前沿可用键盘精确选点。灰色采样点不逐点交互，也不用于推定精确前沿。
- 支持的优化约束与CSV边界沿用v2.3.0：3～5资产、long-only、全额投资、目标收益等式，无卖空/无风险资产/交易成本；单个宽表CSV本地处理。真实历史行情与来源许可不在本轮新增范围。
