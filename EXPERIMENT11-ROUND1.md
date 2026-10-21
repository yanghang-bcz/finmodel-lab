# 实验11 第一轮交付与验收

已实际修改当前项目，完成“定价基础”和“红利与敏感性”第一阶段。原三栏、字体、低饱和视觉、五个已上线实验与12项正式教学目录保留。

## 唯一项目及启动

仓库：`/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab`

```sh
python3 "/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/tools/serve.py"
```

页面：http://127.0.0.1:8765/experiments.html?model=bs
身份：http://127.0.0.1:8765/__finmodel__/status

任务开始时，提权后再次核对也没有8765监听进程。用户Chrome留有旧实验11页面，不能当作当前服务仍在运行的证据。本次先从固定绝对路径启动现有829515775e3098be构建，核对HTTP页面、工作台bundle、共用目录、Tooltip脚本和首页均与当前dist字节一致，才开始编辑；没有寻找或覆盖其他项目副本，也没有解压历史ZIP。

最终构建 `1.9.1-audit.1eea1f2b6fd71b97`，任务启动的服务PID 78463。浏览器DOM、构建清单、服务身份与六项HTTP资源SHA256一致。证据：`tests/bs-round1/identity-before.json`、`identity-after.json`。原构建标识前缀沿用现有工具，末尾哈希已改变。

## 已完成

- 两个轻量模块入口；隐含波动率、风险对冲仅标注“未上线”。模块02增加0–5%的q滑块以及“同参数q=0”比较；数值框支持q∈[0,1]，滑块上限在输入超过5%后同步扩展。
- 连续股息JS引擎、基础R、完整R、曲线统一。d1漂移采用r−q；A=S exp(−qT)、D=K exp(−rT)，平价C−P=A−D。q默认0。
- 到期按到期收益，所有Greeks留空；零波动按确定性贴现收益，Delta/Theta包含股息项，折点Greeks留空。输入必须在公开教学有效域内且为有限数；网页无效输入保留上次有效结果并禁止复制。完整R函数同域校验；网页边界自动切换完整R。
- 含q的Delta、Gamma、Vega、Theta；Vega为标准波动率导数÷100，Theta为负期限导数÷365。逐句解释同时给出标准导数口径。未假定Theta总是负数。
- 六个参数、E、A、D、d1、d2、pnorm(d1)、pnorm(d2)、两类价格和四项Greeks可独立选择并联动公式、输入与图表。明确Φ(d2)是风险中性测度下S_T>K的概率，Φ(d1)不是实际获利概率。
- Predict→Experiment→Explain：打开探索即锁定输入并加载默认可复现场景；确认预测后仅开放q；达到5%才可进入解释；支持重新实验、重新预测、退出恢复原参数。预测阶段不显示答案或比较面板。
- “在RStudio实践”入口、实际可复制脚本；网页不假装执行R。复制出来的基础/完整脚本均已用真实Rscript运行。

默认S=K=100、T=1、r=.05、σ=.2：

| q | Call | Put |
|---|---:|---:|
| 0 | 10.45058357 | 5.57352602 |
| .05 | 7.57708215 | 7.57708215 |

## 实际文件

源文件：
- `dist/bs-lesson.js`（新增，BS教学配置、逐句解释与两种可执行R代码统一来源）
- `dist/experiment-math.js`（含q价格、Greeks、有效域校验）
- `dist/experiment-lessons.js`、`dist/lesson-presentation.js`（接入新BS教学来源，移除旧无分红BS生成逻辑）
- `dist/experiments.js`、`dist/experiments.css`（两模块、股息比较、探索与实践入口）
- `dist/financial-charts.js`（曲线使用同一引擎，更新Tooltip条件说明）
- `tools/build-workbench.cjs`（新教学源加入既有bundle）
- `tests/bs-round1.test.cjs`、`tests/bs-round1-browser.cjs`（新增）
- `tests/run-regression.cjs`（新增BS数学套件接入既有回归）

构建产物同步：`dist/experiments-bundle.js`、`build-info.js`、`build-manifest.json`、`index.html`、`experiments.html`。README新增本轮说明。其他既有测试的运行日志由原测试机制写入既定位置。

`tests/bs-round1/before/`保存修改前的八项源码/页面快照；`source-changes.patch`记录这些文件的真实差异。没有可用的已跟踪Git基线，项目原来所有文件均为untracked；没有创建提交或覆盖用户文件的Git操作。

## 实际测试结果

| 检查 | 结果与证据 |
|---|---|
| 既有9套 + 新BS数学套件 | 全通过，`regression-suite.log`；原9套包括真实R新模型核对 |
| 新BS网格与数值检查 | 13,514项断言，28个基础/完整R案例通过；`math-results.json` |
| Greeks有限差分 | q=0/.02/.05/.2，Call/Put Delta、Gamma、Vega、Theta均验证；含负利率 |
| 边界与无效输入 | T=0、σ=0、折点、极端S/K、接近到期、q上限、NaN/Infinity/缺失/越界均覆盖 |
| 原教学代码执行套件 | 50个R案例、312项数值比较通过（`tests/ui-refinement/presentation-results.json`） |
| 实验11真实Chrome专项 | 93项通过；含网页复制两种R脚本再实际执行逐项核对；`browser-results.json` |
| 原五模型完整交互回归 | 最终355项通过，`regression-final/chrome-results.json` |
| 原定向交互回归 | 22项通过，`regression-final/extra-results.json` |
| 构建一致性与隔离副本陈旧构建拒绝 | 通过；`build-check.log`、`build-integrity.log` |

金融数学新增网格覆盖2,880组参数组合，并断言：q>0单调性、含股息平价、价格界限；Greeks对Call和Put均用中心差分。误差按测试文件明确设置，价格/R比较约1e−9相对容差，Greeks有限差分约3e−8混合容差；不宣称穷尽任意IEEE浮点输入。

浏览器首次完整回归在实验11的恢复默认操作遇到RStudio说明弹窗拦截，超时失败，未改动功能后定向重放207项及完整原脚本355项均通过。首次失败及截图保存在 `regression/failure.json`、`regression/failure.png`；定向重放证据在 `debug/`。此偶发情况根因未确定，不把第一次运行算成通过。

用户原Chrome标签页刷新后，原生自动化未能读回页面内容，故不能宣称原会话迁移已通过。本次已经另外在实际安装Chrome的新自动化会话，以及用户可见的内置浏览器成功打开同一8765页面，后者人工流程式核验q=5%并保留为交付标签页。Safari原会话、跨设备与课堂负载本轮未验收。

## 截图与复跑

所有本轮截图均来自实际HTTP页面，不是设计稿：
- `tests/bs-round1/pricing-1440.png`
- `tests/bs-round1/dividend-5pct-1440.png`
- `tests/bs-round1/explore-explain.png`
- `tests/bs-round1/mobile.png`
- `tests/bs-round1/regression-final/catalog-*.png`

在仓库目录执行：

```sh
node tests/run-regression.cjs
node tests/presentation.test.cjs
node tests/bs-round1-browser.cjs
FINMODEL_TEST_OUT=tests/bs-round1/regression-final node tests/interaction191.test.cjs
FINMODEL_TEST_OUT=tests/bs-round1/regression-final node tests/interaction191.test.cjs --extras
node tools/build-workbench.cjs --check
node tests/build-integrity.test.cjs
```

浏览器测试使用本机已安装Chrome和原测试所用Playwright路径；数学交叉核对需要Rscript。没有下载依赖或引入浏览器R运行服务。

## 未实现范围

隐含波动率二分法、牛顿法、Delta动态对冲均未实现，没有增加其他模型。没有新增Greek选择器、到期收益图切换、离散现金股息或真实市场数据接入。现有四项Greeks维持紧凑表格。未将本轮交付假称为完整覆盖实验11教学大纲。
