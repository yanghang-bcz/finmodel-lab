# 实验11 第二轮：隐含波动率求解交付

已在原 FinModel Lab 内实现，与“定价基础”“红利与敏感性”并列；三栏与原字体保留。第三轮动态 Delta 对冲未实现。所有报价明确为假设报价，未接入市场数据。

## 项目与服务

绝对项目路径：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`

页面：http://127.0.0.1:8765/experiments.html?model=bs ，进入“隐含波动率求解”。

服务身份：http://127.0.0.1:8765/__finmodel__/status

启动命令（已有服务时请勿重复启动）：

```sh
python3 "/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/tools/serve.py"
```

开始时真实监听PID 78463，构建 `1.9.1-audit.1eea1f2b6fd71b97`；身份路径与四项HTTP资源SHA256均匹配。已正常重启本项目服务，最终PID 82816，构建 `1.9.1-audit.46e712b8e8450dd6`。最终DOM、服务身份、manifest一致，六项HTTP资源与磁盘SHA256匹配。证据见 `tests/bs-round2/identity-before.json`、`identity-after.json`。服务继续运行。

## 实现

- Call/Put、S、K、T、r、q、假设报价、Newton初值、价格容差和最大迭代次数可调。输入改变停止播放、清除旧步数、重新计算；无效输入清除轨迹并禁止复制。
- 调用第一轮同一 `ExperimentMath.bs` 价格与Vega实现。IV内部搜索允许σ至1e6；原定价模块输入域仍为σ≤2。Vega明确使用原显示Vega×100，为对小数波动率的导数。
- 二分从[0,0.25]开始自动倍增包围区间，最多24次且σ≤1e6；保留每步区间、中点、理论价、残差、下一包围区间和停止原因。收敛时不再更改包围区间。
- Newton为纯Newton，无混合求根或隐藏二分回退；保留每步σ、理论价、残差、raw Vega、下一σ、停止原因。两法比较明确展示状态、估计值、步数、最终残差与区间扩展次数。
- 图为σ对理论价格，报价虚线；二分阴影显示当前区间，Newton只显示当前切线与下一报价交点。轴包括当前已观察范围及下一有效交点，极端范围采用明确标记的log(1+σ/0.01)坐标。
- 支持逐步、点选步骤、播放/暂停、重置；切换、输入、离开页面、隐藏页面均清理计时器。减少动态偏好下使用手动步骤。原有SVG Tooltip机制未替换。
- 左侧为可整段运行的基础R脚本，含 `bisection()`、`newton()` 和逐步 `rows`；点击逻辑语句显示关联输入、公式与当前步数值代入。网页不假称运行R。RStudio入口提供真实运行说明；基础/完整切换在该模块隐藏，只呈现一份完整可运行教学脚本。
- 预测阶段隐藏代码、曲线、比较与答案并锁定输入；提交后观察迭代，到末步才开放解释。默认案例讨论Newton步数优势并限定初值与容差，不推断其普遍优越。

## 默认数值与边界

默认S=K=100、T=1、r=.05、q=0，Call假设报价由σ=.2产生，为10.450583572185565元；价格容差1e-8，Newton初值.3：

| 算法 | IV | 步数 | 最终价格残差 |
|---|---:|---:|---:|
| 二分法 | 约20% | 28 | 6.98938862e-9元 |
| 纯Newton | 约20% | 4 | -7.10542736e-15元 |

沿用第一轮域：S,K∈[.01,100000]、T∈[0,10]、r∈[-.1,.3]、q∈[0,1]，不接受负q。容差[1e-12,.01]元，迭代上限整数[1,200]，Newton初值(0,1e6]。原定价输入σ上限不限制IV自动扩展。

令A=S exp(-qT)、D=K exp(-rT)。T>0时，Call下界max(A-D,0)、上界A；Put下界max(D-A,0)、上界D。等于下界显示σ=0边界；等于上界无有限解；超出界限拒绝。T=0明确非唯一，不虚构IV。距离边界小于等于32×机器epsilon×max(1,upper)时报告浮点精度不足。不能以用户价格容差将邻近下界报价直接判为σ=0。

Newton低Vega（<1e-12）、非正/非有限/超出1e6的下一步、浮点停滞或达到迭代上限均明确失败；未收敛值标为当前估计。定价误差小不代表在极平坦区域中σ也精确。σ=20等极高波动率生成的报价可能在双精度下舍入为上界，此时正确报告无有限可辨识解，而非声称还原原始σ。

## 实际测试与复跑

在上述项目目录执行；浏览器套件需要本机Chrome和现有Playwright，数学套件需要真实Rscript，无新增依赖。

```sh
node tests/bs-round2.test.cjs
node tests/bs-round2-browser.cjs
node tests/run-regression.cjs
node tests/bs-round1-browser.cjs
FINMODEL_TEST_OUT=tests/bs-round2/regression-final-browser node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/bs-round2/regression-final-browser node tests/interaction191.test.cjs --extras
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

| 检查 | 实际结果 |
|---|---|
| IV数学与R逐步对照 | 76,909断言通过、0失败；29份真实R脚本 |
| 新IV浏览器 | 51检查通过、0失败，包含复制出的脚本再实际运行R |
| 全部数学/教学回归 | 11套全部通过，包含第一轮13,514数学断言与28份R案例 |
| 第一轮专项浏览器 | 93检查通过、0失败 |
| 五模型完整交互 | 355检查通过 |
| 目录与Tooltip等定向回归 | 22检查通过；开发前也先通过22项 |
| 最终构建一致性、陈旧构建拒绝 | 通过 |

数学覆盖700组固定种子随机Call/Put含股息参数、合理初值Newton、低/高σ、负r、接近价值边界、上下界错误报价、T=0、极小Vega、Newton越界、最大迭代与区间扩展。平坦边界随机案例按明确阈值不作σ高精度断言；独立边界案例仍验证分类。R对照检查所有记录列、步数、停止原因，轨迹使用2e-6混合数值容差；默认报价核对更精确。测试计数包含每一步的多字段断言，不等同于独立参数案例数量。

证据：`tests/bs-round2/math-results.json`、`browser-results.json`、`case-*.R`及运行日志/CSV、`browser-copy.R.log`、`regression-final.log`、`build-integrity.log`、`regression-final-browser/`；第一轮浏览器输出仍按原套件保存在 `tests/bs-round1/`。

中途曾出现一项R轨迹核对失败：在正好收敛的中点，JS与R残差末位异号，导致本来不会执行的“下一包围区间”不同。已修正为达到容差即保留当前区间，并全量重跑通过。初次浏览器运行在沙箱中被系统权限阻止，采用获准的本机测试运行后成功；不把未运行的首次尝试算作通过。

## 浏览器会话与截图

自动化验收来自实际安装Chrome的新测试会话，并非用户原标签。原Chrome旧页读取时仍显示第一轮版本；刷新后原生自动化只能读取浏览器工具栏、无法读回网页内容，截图亦无法提供有效画面。因此原Chrome会话更新验收未通过，原因未确定，不能声称全部会话成功。

另外已在用户可见内置浏览器打开同一最终服务，实际切换“隐含波动率求解”，读到二分28步、Newton4步与20%结果，保留为交付标签。

实际页面截图：
- `tests/bs-round2/bisection-1440.png`
- `tests/bs-round2/iv-1440.png`（Newton）
- `tests/bs-round2/iv-1366.png`
- `tests/bs-round2/iv-1920.png`
- `tests/bs-round2/iv-375.png`
- `tests/bs-round2/exploration.png`

1440×900、1366×768、1920×1080及375px移动视口无横向页面溢出，曲线有实际尺寸，局部面板可滚动；另验证触屏点选和键盘Enter操作。未进行跨设备或课堂并发负载验收。

## 真实文件清单

新增：`dist/iv-math.js`、`dist/iv-code.js`、`dist/iv-workbench.js`、`tests/bs-round2.test.cjs`、`tests/bs-round2-browser.cjs`、本文档及 `tests/bs-round2/`证据。

修改：`dist/experiment-math.js`（同源BS内部IV搜索域）、`dist/experiments.js`（模块入口）、`dist/experiments.css`（仅IV作用域样式）、`dist/bs-lesson.js`（纠正已上线状态文字）、`tools/build-workbench.cjs`（接入模块）、`tests/run-regression.cjs`（接入测试）、`README.md`（交付索引）。

构建产物：`dist/experiments-bundle.js`、`build-info.js`、`build-manifest.json`、`index.html`、`experiments.html`。既有测试输出也按原机制更新。本项目没有已跟踪Git基线（文件均为untracked）；未创建提交或重置用户文件。`sources/`未修改。

## 尚未实现

第三轮动态Delta对冲未开发。没有接入真实市场报价、网页R执行器、混合Newton或新增其他金融模型。
