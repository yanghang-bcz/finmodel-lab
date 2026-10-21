# 实验06：GARCH类波动率模型完整教学升级

版本v2.8.0；日期2026-10-21。课程《基于R语言的投资与实验》，正式实验“基于GARCH类模型的波动率模型的R语言实验”。

**开发状态：核心课程链条已实现，软件与数学验收通过。内部开发质量95/100，低于96目标；不是学生课堂学习效果评分。软件与数学验收完成，真实课堂学习效果待验证。**

## 1. 仓库与原有功能审计

实际唯一项目：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`。未创建副本，未修改`sources/`。修改前服务为v2.7.2 `2.7.2-risk-validation.ed43caada65d26a6`，PID10757，实际工作目录正确；真实Chrome的11项加载响应与磁盘相同。重新运行实验07估计基线6734项、9次R通过，输出`/tmp/vol-baseline-identity.log`、`/tmp/vol-baseline-math.log`；服务及manifest基线保存于`tests/volatility/identity-before.json`、`manifest-before.json`。

已阅读原实验06 `experiment-math.js`、`experiment-lessons.js`、`experiments.js`、图表与完整R规范，以及实验07估计、R源码、测试和`EXPERIMENT07-V2.7.2-FINAL-VALIDATION.md`。

原06只有160期给定参数递推、双图及第41期冲击／第42期响应，没有ARCH-LM、真实估计、诊断、扩展或多元GARCH。现在改为四主题自由工作台，一次一张主图。

| 原有功能 | 本次状态 |
|---|---|
| 默认ω=.00001、α=.12、β=.82、冲击4、160期 | 保留默认数值；原ε和h逐期一致性测试通过 |
| 第41期固定标准化冲击 | 保留；冲击首先更新第42期方差，不提前进入第41期 |
| 实时参数与R解释、投屏、目录 | 保留并扩展；无强制学习步骤 |
| 仅教学递推 | 增加真实ARCH/GARCH/GJR/GARCH-M估计、诊断、预测和CCC |

合成数据生成参数固定为原默认；修改模型参数不会另造一组收益。n与生成冲击可在ARCH页直接改变。冲击“4倍z”指生成数据的标准化创新，不是400%收益；当前拟合的标准化残差不必仍等于4。

## 2. 实际源码与文件清单

新增：

| 文件 | 责任 |
|---|---|
| `dist/vol-math.js` | ARCH-LM、QR辅助回归、卡方尾概率、Ljung-Box、模型路径／估计、预测、CCC、日期对齐 |
| `dist/vol-r.js` | 对应Base R统计检验、优化、模型、预测和CCC |
| `dist/vol-code.js` | 当前视图完整R、数据及原始CSV转换、代码金融解释 |
| `dist/vol-charts.js` | 单主题SVG、残差／预测／新闻冲击／均值／双资产风险及提示 |
| `dist/vol-workbench.js` | 四视图、直接交互、数据、代码导航／复制及错误状态 |
| `dist/vol.css` | 仅作用于实验06的布局与可读性样式 |
| `tests/volatility.test.cjs` | 金融统计与跨语言核验 |
| `tests/volatility-browser.cjs` | 真实Chrome交互、CSV、复制R与投屏 |
| `tests/volatility-identity.cjs` | 实际加载资源与DOM版本 |
| `tests/nonvol-regression-browser.cjs` | 保留08/11原公共断言，旧06 DOM检查由新专项替代 |
| `EXPERIMENT06-FINAL.md` | 本报告 |

修改：`dist/experiments.js`仅新增garch分发入口；`experiments.html`加载vol.css；`tools/build-workbench.cjs`纳入新模块与版本；`tests/run-regression.cjs`加入专项。构建生成更新bundle、build-info、manifest及HTML版本。

**实验07的risk模块、实验08/09/11的引擎和业务工作台均未改。** 原61项资产中56项内容一致，变更5项为实验路由与构建引用；新增6项07之外的06资产。31项受保护模块哈希全部一致，见`source-freeze.json`。共享估计只调用原`RiskGarchFit`与原R定义，没有为06调整其算法。

## 3. 四视图与学习链条

ARCH效应：收益率／平方残差／绝对残差聚集代理、滞后阶数、显著性与真实LM。

GARCH建模：ARCH(1)／GARCH(1,1)，参数探索／数据估计，条件波动率、标准化残差／平方、一期／多期预测、诊断与比较。

模型扩展：GJR正负新闻冲击、GARCH-M标准差进入均值；两者均支持给定参数及真实估计。

多资产波动：两资产分别GARCH，再标准化残差相关，两阶段CCC；可选手动相关情景、权重及A/B/组合图。

没有第五主视图、强制选择题、解锁或AI聊天。公式和统计细节按需展开。实验06研究波动率结构，实验07研究风险阈值与回测；链接真实导航，但不传递当前参数或数据。

## 4. ARCH-LM方法、有效样本与边界

常数均值模型残差`e=R−mean(R)`；辅助回归为平方残差对常数及1..lag阶平方残差。先按平均平方残差缩放以改善数值条件，不改变R²；QR正交投影计算拟合，检查秩及退化平方序列。

有效n_eff=n−lag，LM=n_eff×R²，渐近卡方自由度lag。lag支持1–20，要求n_eff>lag+2；方差过小、秩不足、自由度不足明确报不可用，不能输出NaN或“证明没有ARCH”。

默认160期、lag5的实际结果：LM≈2.148180747201，p≈0.828284745889，n_eff=155。**默认固定正弦／单冲击不是iid随机样本，当前不显著如实保留，不改数据迎合检验。**

另有明确ARCH结构与恒定方差正态的固定合成fixture（800期）独立检验并与R核对。它们是固定样本结果，不是所有重复实验都保证某个p值。`arch-structure.csv`与`iid-normal.csv`均为合成，生成器与确定性样本在测试中公开。

## 5. ARCH/GARCH递推与数值估计

ARCH(1)使用β=0。标准GARCH：R=μ+ε，h[t+1]=ω+αε[t]²+βh[t]。ω>0、α/β非负、α+β<1。教学h1取模型长期方差；数据估计h1取样本方差，固定样本均值，全部观测进入条件高斯似然，不把拟合曲线说成过去事前预测。

GARCH真实估计直接复用实验07原模块，收益以样本标准差归一，ω还原为原单位；正值和softmax参数变换，六起点Nelder–Mead，有限目标之外检查单纯形直径、目标差、局部扰动、合法方差。样本至少60、近常数和不收敛拒绝，绝不教学参数回退。

ARCH采用logω与logistic α的真实条件似然优化；初始方差和固定均值与GARCH相同。数值搜索|θ|≤20，给边界警示，不宣称无约束全局MLE或可靠识别。未计算参数标准误／置信区间。

## 6. 一期、多期预测及单位

一期保存T期已观察残差后得到h[T+1]；主图最后一点没有已实现收益。条件方差单位为小数收益²，图中取平方根乘100为单期条件标准差%，不会把方差直接标成波动率。

长期方差`bar_h=ω/(1−persistence)`与当前预测不同。标准GARCH多期理论公式为`bar_h+(α+β)^(k−1)*(h[T+1]−bar_h)`。实现采用等价递推`h[k+1]=ω+persistence*h[k]`，首值精确取一期预测，以减少近单位根时大数相减的数值消减。GJR在对称标准正态创新假设下persistence=α+β+γ/2。

预测图的标准差为`√E[h]`，不是`E[σ]`；模型假设的均值回复不保证真实市场或确定性正弦数据未来必然这样发展，更不预测收益方向。

## 7. 标准化残差与模型诊断

z=e/√h，检验z与z²的Ljung-Box，并在z上做剩余ARCH-LM。Ljung-Box为`Q=n(n+2)Σ rho_k²/(n−k)`，与R `Box.test(type="Ljung-Box",fitdf=0)`核对；自由度lag，ARCH辅助回归另扣其滞后损失。

这是常规未Bootstrap校准的渐近参考，拟合参数会影响精确参考分布；不能任意机械减去GARCH参数数目，也不把p>.05当作模型正确或残差正态的证明。默认一条动态结论，统计量和p值展开查看；不可用检验保留明确原因。

## 8. GJR-GARCH计算、估计与正负冲击

h[t+1]=ω+(α+γ I(e[t]<0))e[t]²+βh[t]。约束α>=0、α+γ>=0、β>=0；标准对称创新下α+β+γ/2<1。γ可以负，正负同幅冲击的下一期方差差额为γ×冲击²。

真实估计用四维数值变换：softmax的两个非负份额分别对应正／负冲击系数的一半，另一个对应β，剩余份额保证平稳；因此不是预先指定γ。四起点条件高斯优化，固定样本均值、h1样本方差，多起点接受／失败检查与代码公开。

主图是同一当前方差下的新闻冲击曲线与±给定残差，R画同一曲线。γ=0退化为标准GARCH逐期一致，γ>0负冲击更强的数学性质、非法约束及优化失败均检验。默认合成拟合γ≈-0.678628710，**这个样本给出负γ，不隐藏、不改成金融市场普遍规律**。

## 9. GARCH-M风险溢价：真实联合处理

采用标准差进入均值：`R[t]=μ+κ√h[t]+ε[t]`，并用该残差更新GARCH方差，不能直接用另一条GARCH曲线乘κ冒称拟合。

教学模式直接给定μ/κ和方差参数并联合递推。数据模式真实联合优化μ、κ、ω、α、β：标准化收益中的均值偏移和κ与方差参数同入条件高斯目标，多起点（三个均值／κ初值组合×四个方差初值，共12起点）优化；μ和ω最终正确还原单位。失败／近边界有警示，无隐藏回退。

κ=0在同初值退化为相应GARCH；κ正负均测试，逐期检查条件均值、残差与下一期方差反馈。默认合成估计μ≈-0.0021343429、κ≈0.399449958。没有标准误，不声称κ显著；κ是指定模型内参数关系，非因果，也不意味着所有风险溢价都存在或不存在。

## 10. 双资产CCC：两阶段与合法矩阵

两资产在共同有效日期分别拟合单变量GARCH，计算z_A、z_B，再取其样本相关ρ。明确是两阶段估计，不是联合多元MLE。可改手动ρ作为教学情景，与估计结果区分。

`H_t=[[h_A,cov],[cov,h_B]]`，cov=ρ√(h_A h_B)；严格−1<ρ<1，逐期检查对称与正定（正对角及行列式>0）。JS显式保留H；R函数输出同样的h_A/h_B、cov和det四分量并以等价二次型计算组合方差。

w_B=1−w_A，范围0–1，合计100%。`h_p=w_A²h_A+w_B²h_B+2w_Aw_Bcov`；百分比波动率取√h_p×100。测试100%A、100%B、50/50、ρ=0／正／负、非法ρ、完全相关退化及单资产拟合失败。

默认估计ρ≈0.438020186，50/50下一期组合方差≈1.73618379539e-05，标准差约0.416675%。CCC只让各资产方差与协方差变动，相关系数本身恒定；没有DCC宣称。

## 11. 模型比较口径

同一收益窗口、同一固定样本均值、同一样本方差h1，比较ARCH、GARCH、GJR的LL、参数数、AIC与BIC。参数数分别3/4/5，均把估计过的样本均值算1项。

这是固定插件均值的条件似然比较，不冒充每个模型都联合均值MLE；GARCH-M因为均值方程改变，留在独立风险溢价主题。表不按复杂程度颁优胜，训练拟合改善不保证样本外预测；未实现样本外波动率QLIKE/MSE排名，不虚报。

## 12. CSV格式、单位与共同日期

浏览器本地处理，无第三方上传。单资产`date,return`或`date,price`；双资产宽表`date,A,B`；也可A/B两份单资产文件。宽表与额外B文件同时选时拒绝，避免来源歧义。

日期严格YYYY-MM-DD、真实日历日期，自动升序；重复日期、缺失、非数字、非正价格、收益低于−100%、非法列名和过短样本拒绝，不悄悄大量删除。小数与百分数数值明确选择；对数用expm1转简单收益，损失／波动全程口径一致。基础导入范围50–2000条收益，模型估计至少60；合成n支持60–1500。2MB文件限制，简单两／三列CSV，不是完整多行RFC4180解析器。

**收益文件按共同结束日期交集配对；价格文件必须先取共同价格日期，再算两边同一持有区间收益。** 例如B缺中间价格日时，不能把A的一期与B的两期收益按相同结束日期混合。本轮已实际测试该边界，报告各资产原价格／收益数、交集和排除数；不按行拼接、不前向填充。

未知频率或不规则间隔给提示，模型按可比单期使用；不自动年化，不掌握交易所日历，不替来源保证没有缺失交易期。用户导入只标未核实的用户数据。测试CSV与默认数据均是合成，不冒充公开行情。

## 13. 数据到R的完整复现

完整脚本内嵌当前确认后的R/B、日期、参数和函数；导入后还内嵌原始CSV文本。Base R用read.csv、Date排序和merge交集重现转换，价格先对齐后转收益，对数／百分数同口径，检查重建收益与确认向量差<1e−12及日期完全一致。

模型优化仍使用显式确认向量，避免不同解析舍入造成输入差异。没有未知本地路径或隐藏JS变量。原始CSV只在浏览器内存及用户主动复制的脚本中出现；Chrome测试没有非GET数据上传请求。

所有主视图默认完整代码；“关键逻辑”可选隐藏数据／函数阅读，保留原脚本行号，复制永远完整。导航只滚左栏，点击对应金融解释与公式，未缩小代码字体。ARCH脚本只包含其需要的统计函数，不把全部模型强塞其中；其他视图完整但函数与数据仍较长。

## 14. 实际R脚本与例程

数学专项16次干净R执行；Chrome实际复制20份，全部退出0并核对当前页面数值。覆盖ARCH效应／ARCH模型、GARCH给定／估计／诊断／一期／多期、GJR给定／估计、GARCH-M给定／联合估计、CCC估计／手动ρ、单资产、配对收益、双资产价格及不同价格日期、失败拒绝。

复制文本在`copy-*.R`，验证版仅在原脚本末尾读取结果，无新增隐藏金融变量；`copy-*.log`保留实际输出。原始收益和固定样本一致，不用相同种子冒称不同R/JS生成器结果一致。

10份完整例程直接执行成功：

- `examples/experiment06-arch-lm.R`
- `experiment06-arch-parameters.R`
- `experiment06-garch-parameters.R`、`experiment06-garch-estimated.R`
- `experiment06-gjr-parameters.R`、`experiment06-gjr-estimated.R`
- `experiment06-garchm-parameters.R`、`experiment06-garchm-estimated.R`
- `experiment06-ccc-parameters.R`、`experiment06-ccc-estimated.R`

仅需Base R，本机实际Rscript4.6.1；未依赖未安装rugarch等包。`examples.json`记录各退出码。

## 15. 金融数学与跨语言验收

| 项目 | 最终实际结果 |
|---|---|
| 实验06数学／统计 | 15602通过，0失败，0跳过 |
| 干净R跨语言 | 16次成功 |
| Chrome专项 | 1160通过，0失败，0跳过，0页面错误 |
| 实际复制R | 20份成功且核对数值 |
| 直接R例程 | 10份成功 |
| 全站数学与代码 | 23套通过 |

测试包括原默认160期精确保真、QR/有效样本、不同lag、零方差／秩不足、ARCH／iid固定DGP；ω/α/β边界、近单位根、一期与稳定多期递推、无提前冲击；z/z²、R lm/Box.test/pchisq；GJR退化、正负效应、约束及失败；GARCH-Mκ=0/正/负与联合残差反馈；CCC矩阵／权重／ρ／日期／失败；导入清洗与同区间价格转换。

预定容差按量纲：纯解析`1e−11+1e−8相对`；优化ω绝对1e−10、方差/协方差1e−9、行列式1e−13、收益/均值/标准差1e−7、无量纲系数2e−5，另加5e−4相对；似然绝对0.002。最初宽泛小方差容差在验收前收紧，未用金额／显示舍入核对。

新增最大绝对差约8.476746018e-06，跨不同量纲的数值集合，**不是金额误差**；实际逐项在对应严格容差内。不同局部优化路径看似然、参数、方差和预测，不要求所有估计参数机器精度相等，也不靠放宽误差掩盖差异。

## 16. 真实Chrome、投屏与截图

Installed Chrome `155.0.8059.85`，headless真实页面自动化；1440×900、1366×768、1920×1080逐一进入四主题，检查主要参数、图、代码和解释。隔离profile设置真实125%页面缩放，devicePixelRatio=1.25，非CSS zoom；没有修改用户浏览器配置。

Hover退出自动消失，Click才固定，Esc／关闭／参数或模型变更清理。代码与参数可独立滚动；投屏字体保留；短视口部分详情需在模型栏滚动。标准差轴不显示负风险刻度，方差与标准差分清。

最终实际截图：

- `tests/volatility/arch-effect.png`
- `garch-estimated.png`、`forecast.png`
- `gjr-impact.png`、`garchm-estimated.png`
- `ccc-portfolio.png`、`csv-paired.png`
- `arch/model/extension/multi-1440x900.png`、`*-1366x768.png`、`*-1920x1080.png`
- `zoom125-arch.png`、`zoom125-model.png`、`zoom125-extension.png`、`zoom125-multi.png`

实际参数以画面为准，不把交互后画面冒称全为默认值。早期smoke截图仅开发参考，最终证据取browser-results列出的文件。

## 17. 五模型全站回归与保护

| 范围 | 本轮实测 |
|---|---|
| 实验06 | 本报告全部专项 |
| 实验07估计／回测 | 975项、12份复制R通过 |
| 实验07原链条 | 1543项、17份复制R通过 |
| 08/11公共导航／Tooltip | 176项及额外9项通过 |
| 实验08详细功能 | 291项／11份R；另120项／12份R |
| 实验09 | 1756项／19份R，0页面错误 |
| 实验11 BS／IV／对冲 | 93／51／78项通过 |

五模型正常打开、默认完整R；目录01–12排序、参数不互相污染。旧06双图DOM的公共断言已明确由新06专项替代，没有冒称旧DOM测试仍适用。其他断言保留；因资产增加，一部分检查数量增加来自资源身份，不是金融功能数量增加。

23套回归包含各历史数学套件，不把它们重复相加为独立覆盖。实验07模块原源码哈希及共享GARCH估计结果保持一致。

## 18. 服务身份与资源一致性

页面：[实验06](http://127.0.0.1:8765/experiments.html?model=garch)。启动：在项目目录执行`python3 tools/serve.py`，当前已独立运行，避免重复占用端口。

- 构建：`2.8.0-volatility.a2b8b2497d4416a1`。
- PID：18656；lsof实际工作目录为`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`。
- 文档根：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/dist`。
- 全部67项HTTP资源SHA256与manifest、本地文件一致；Chrome实际加载12项HTML/JS/CSS响应也一致，DOM及服务版本相同。
- `--check`无陈旧产物；隔离陈旧构建拒绝测试通过，未改在线目录。

证据：`service-identity.json`、`identity-after.json`、`browser-loaded-identity.json`、`source-freeze.json`、`build-check.log`、`build-integrity.log`、`acceptance-summary.json`。

## 19. 真实执行命令

在仓库目录运行：

```sh
node tests/volatility.test.cjs
node tests/volatility-browser.cjs
node tests/volatility-identity.cjs
node tests/run-regression.cjs
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
node tests/risk-272-browser.cjs
node tests/risk-272-legacy-browser.cjs
node tests/nonvol-regression-browser.cjs
FINMODEL_TEST_OUT=tests/volatility/nonvol-extra node tests/nonvol-regression-browser.cjs --extras
node tests/capm-241-browser.cjs
node tests/portfolio-231-browser.cjs
node tests/portfolio-multi-browser.cjs
node tests/bs-round1-browser.cjs
node tests/bs-round2-browser.cjs
node tests/bs-round3-browser.cjs
Rscript --vanilla examples/experiment06-garch-estimated.R
Rscript --vanilla examples/experiment06-gjr-estimated.R
Rscript --vanilla examples/experiment06-garchm-estimated.R
Rscript --vanilla examples/experiment06-ccc-estimated.R
```

另6份例程同样直接执行，见examples.json。数学最终输出亦在`tests/v1.9/regression-volatility.log`；site-regression记录23套退出状态，browser.log记录最终成功运行。开发中的早期运行不计入最终数量，也不宣称开发全程零失败。价位先对齐后转收益等边界是最终验收补强，不是界面占位。

## 20. 教学大纲覆盖矩阵与内部评分

| 正式内容／能力 | 实际实现 | 限定 |
|---|---|---|
| ARCH模型与ARCH效应 | ARCH(1)真实估计／递推、LM与波动代理 | 常数均值，非任意阶ARCH选择 |
| GARCH模型 | 参数探索、真实估计、标准化诊断、一期／多期 | 条件正态、局部优化，非收益方向保证 |
| GARCH扩展 | GJR估计与正负冲击；GARCH-M联合均值／方差估计 | 无参数SE／显著性结论 |
| 多元GARCH | 双资产两阶段CCC与H、组合方差 | 不是联合MLE／DCC |
| 模型诊断 | z/z² Ljung-Box、剩余ARCH-LM | 渐近参考，未Bootstrap |
| 风险溢价 | κ可正负、标准差进入均值、反馈方差 | 不解释为因果，未做κ显著性推断 |
| R金融实践 | 全路径及本地价格／收益／双资产配对 | 同频率和来源需核实 |

| 维度 | 满分 | 内部评价 | 依据 |
|---|---:|---:|---|
| 大纲覆盖 | 30 | 29 | 核心链完成，模型阶数／多元范围有明确限定 |
| 金融数学统计 | 20 | 19 | 已实现计算与R通过；估计后检验近似、边界弱识别未进一步量化 |
| R实践 | 20 | 19 | 16次跨语言、20份实复制、10例程；长函数／数据仍有阅读负担 |
| 可视化交互 | 15 | 14 | 四主题单图、自由探索、投屏通过；短视口需滚动 |
| 金融数据应用 | 10 | 9 | 正确双资产价格区间与日期；频率／日历依赖来源 |
| UI稳定性 | 5 | 5 | 五模型与哈希保护回归通过 |
| 合计 | 100 | **95** | 内部软件／数学评价，未直接抄96目标，不是学生教学效果评分 |

## 21. 未完成项、已知限制与课堂待验证

未实现ARMA均值选择、高阶ARCH/GARCH自动选阶、Student-t创新、参数Hessian／置信区间、Bootstrap诊断校准、全局最优证明、滚动样本外波动率QLIKE/MSE、多元联合MLE或DCC。上述未作为界面占位功能，也未声称完成。

默认固定正弦样本不符合iid正态假设，可能不显著或产生边界／负γ；如实保留。数值收敛不证明模型有效，统计不显著不证明没有ARCH或模型正确，κ不证明经济因果。多期√E[h]与E[σ]区分，CCC不能描述相关性动态。原始价格日期有缺失时使用共同区间，间隔可能不规则，仍需来源确认可比性。

真实学生试用未开展，不等待实验07/08/09/11的课堂反馈。本轮完成后停止新增功能。后续教学验证独立安排：识别收益与波动区别、调整冲击／lag解释LM、估计与诊断GARCH、说明T与T+1时序、多期预测均值回复、GJR正负与κ非因果、相关和权重对组合风险、导入双资产CSV并在RStudio复现。记录是否独立完成、时间与主要困惑，不能用软件检查数量代替学习效果。

**软件与数学验收完成，真实课堂学习效果待验证。**
