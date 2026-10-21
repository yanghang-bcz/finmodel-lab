# FinModel Lab v1.9.1 · 交互稳定性与实验目录统一

2026-10-19。在原有静态项目中修改，保留五模型、三栏、字体、R教学代码、探索、诊断和课堂资料。没有新增金融模型。

## 实际根因与修复

### Tooltip

修复前 `dist/financial-charts.js` 的 `tip(key)` 无条件写入 `selectedTooltip`。`pointerenter`、`focus`、`click` 共用该函数，没有对应的 `pointerleave`，而 `draw()` 末尾又根据 `selectedTooltip` 恢复详情。因此悬停会进入与点击相同的持久状态，重绘也会恢复它。预览始终可接收鼠标事件，进一步增加遮挡问题。

真实Chrome复现：07历史ES、11默认S=K标记，鼠标经过后移到页头，浮层仍可见。见 `tests/v1.9.1/baseline.json` 及 `before-*-hover/leave.png`。

现在五模型共用 `dist/chart-interaction.js`：

| 操作 | 结果 |
|---|---|
| 鼠标进入、键盘聚焦 | 只更新 hoveredItem；临时预览 |
| 离开目标、离开图表、失焦 | 清除相应临时状态 |
| 点击、Enter/Space | 切换 selectedItem；同目标再次操作取消 |
| 已固定时经过另一个目标 | 固定内容优先，直到主动切换 |
| 关闭按钮、图表空白、Escape | 清空详情 |
| 参数编辑、重置、打开模态、页面离开/恢复 | 清除旧详情 |
| 重绘 | 清除悬停；仅保留仍存在的主动选择 |

预览 `pointer-events:none`，固定详情可交互。没有延迟关闭计时器；每个目标只赋一套事件处理器，不累积监听。重绘记录鼠标实际移动序号，防止SVG节点替换后在静止鼠标下重新产生预览。GARCH只有固定操作需要时才定位递推代码，取消固定不会额外重绘。CAPM靠近图顶的点将详情放到图底，避免遮住当前点击目标。观察器在图表宿主替换时断开。

实验08原来的诊断、比较详情保留，通过同一控制器驱动；参数变化清除旧详情。新增资产端点查看入口；组合/最小方差/资产身份重合时可从图例独立选择。Escape优先关闭当前模态或详情，避免同时退出背后的教学探索。

### 实验目录

原来的 `experiments.html` 硬编码07→08→11→06→09→01→04，`index.html` 另有08→01→04→07→11→06→09，两者都只有7项，且含错误课程名称。实际复现中07与11顺序相同，08使用另一套顺序；没有把原因猜成“每个模型都会自动把当前项移到顶部”。

现在唯一配置为 `dist/experiments-config.js`，含12项正式名称、简称、number、modelId、id、URL、online、order、description。按数值编号排序并冻结。两个HTML的旧目录全部移除；四模型教学元数据不再保留另一套页面标题。`CourseExperiments.mount()` 统一页面标题、当前编号、主导航路由、目录行与上线状态。教师工具现有选择器选择的是实验08教学示例，没有另一套课程列表。

本次检查项目 `sources/` 为空，仓库没有可核对的老师正式课程文件，因此采用本次用户明确给出的12实验目录。未修改任何同步参考文件。01、04旧错误名称已从运行页面删除；历史交付报告保留原记录。

目录为统一“编号｜正式名称｜状态”行，宽度600px、最大可视高度、标题固定、内容内部滚动。当前实验只高亮。未上线行禁用且无URL。07、11、06、09、08之间使用真实链接导航。投屏模式补上可见目录入口。

`dist/modal-ui.js` 统一原生dialog打开、背景滚动锁定、关闭/遮罩/Escape和触发按钮焦点恢复；浏览器原生模态负责焦点约束。所有现有 `showModal()` 调用改由它打开。

## 修改文件清单

| 文件 | 修改内容 |
|---|---|
| `dist/chart-interaction.js`（新增） | 五模型共享悬停/固定状态机及生命周期 |
| `dist/experiments-config.js`（新增） | 唯一12课程配置、标题、目录和导航 |
| `dist/modal-ui.js`（新增） | 共享模态生命周期和焦点 |
| `dist/financial-charts.js` | 四模型接入共享控制器；尾部、曲线、分隔的代表时期波动率点、回归样本交互 |
| `dist/app.js` | 实验08接入控制器；端点选择；保留诊断/比较/探索 |
| `dist/experiments.js` | 配置驱动路由标题、清理参数状态、图例入口、统一模态 |
| `dist/classroom-ui.js` | 原课堂工具接入模态管理 |
| `dist/experiment-lessons.js` | 删除四个重复标题字段；计算、R生成、课程内容不变 |
| `dist/index.html`、`dist/experiments.html` | 删除硬编码目录、更新资源版本 |
| `dist/workbench-system.css` | 预览/固定事件策略、统一目录、投屏入口、无视觉干扰的点命中区 |
| `tools/build-workbench.cjs` | 共享模块按序进入两个静态包 |
| `dist/portfolio-bundle.js`、`dist/experiments-bundle.js` | 重新生成的运行包 |
| `tools/package-v191.py`（新增） | 打包及CRC/SHA-256逐文件核验 |
| `tools/serve.py`（新增） | 无依赖标准库预览，大连接队列，仍只绑定本机 |
| `tests/interaction191.test.cjs`（新增） | 实际Chrome复现及A–H交互回归 |
| `tests/ui-refinement.test.cjs` | 原固定详情检查改用点击，吻合新规范 |
| `README.md`、`DESIGN-SYSTEM.md` | 启动与共享规范更新 |
| `tests/v1.9.1/` | 实际结果、原始证据、截图与画廊 |
| `CHANGES-v1.9.1.md`、`PACKAGE-MANIFEST-v1.9.1.json` | 本报告及交付校验清单 |

两份数学引擎 `dist/math.js`、`dist/experiment-math.js` 及原组合代码课程、TeachingCode生成器的SHA-256与修复前完全一致。`experiment-lessons.js` 的变化仅为删除重复的四个标题字段。

## 实际自动化验收

本轮使用已安装的Google Chrome channel，真实页面、SVG坐标命中、鼠标移动/点击与可见DOM断言。不是只检查状态变量。

| 检查 | 结果及证据 |
|---|---|
| 新增交互A–H | **355项通过**；`tests/v1.9.1/chrome-results.json`，页面未捕获异常0 |
| A：五模型悬停 | 出现/离开关闭、预览不拦截、焦点预览与Enter固定 |
| B：快速划过 | 每模型15次往返，无残留、无重复浮层 |
| C：主动固定 | 离开保持、同目标取消、其他目标切换、固定优先、关闭/空白/Escape |
| D：重合与补充目标 | BS合并S=K及两条价格曲线；VaR n=50/α=.999的四指标与尾部；08重合身份/资产端点；CAPM SCL与散点 |
| E：12项目录 | 从五模型逐项核对编号、正式名称、顺序、online、当前状态、链接/禁用 |
| F：导航 | 07→11→06→09→08，URL、默认参数、标题、刷新、返回、直接URL与详情清理 |
| G：模态 | 打开、Escape、遮罩、焦点进入/约束/返回、未上线不可导航；1100×550真实滚轮滚动列表且背景不动 |
| H：尺寸 | 五模型×1920×1080/1440×900/1366×768×普通/投屏；详情范围、目录范围与末项可达 |
| 补充定向交互 | **22项通过**；四条VaR参考线分别Hover/Leave、长时间悬停与进入预览区不固定、GARCH第61期点、08应用/撤销、Escape不退出背后探索、课堂/教师模态清理和焦点恢复；`tests/v1.9.1/extra-results.json` |
| 既有教学/视觉回归 | **254项通过**；`tests/v1.9.1/teaching-browser-results.json`，包括R复制、逐语句高亮、基本/完整代码、教学探索、边界与08诊断/比较/课堂工具 |
| 原有数学/教学套件 | **9套全部通过**；`tests/v1.9.1/regression-results.json`与逐套日志 |
| 实验08数学 | 54,159个可行点对照Pareto支配关系；17组生成R实际执行 |
| 四模型数学 | 1,948项数学检查、45组R实际执行；VaR尾部权重、BS平价与Greeks/边界、GARCH递推、CAPM理论与回归 |
| 基础/完整教学R | 50组R实际执行，312次数值比较；`tests/v1.9.1/presentation-results.json` |

没有将数学检查数或R案例重复累加为浏览器检查数。最终浏览器主检查分别打印355、254通过，补充定向检查打印22通过。`development-failure.*` 是修复中途的历史失败证据，不是最终结果。

## Safari与缩放的实际覆盖

使用真正的macOS Safari，07点击固定ES与Escape关闭、12项目录和当前07；11默认S=K合并详情、Escape与当前11目录；通过Safari原生页面菜单选择125%并保存菜单文本与截图。共**7项原生UI抽查记录通过**，见 `safari-results.json`。

125%下窄窗口沿用原来的纵向响应式布局，不把它描述为1440×900三栏桌面验证。截图见 `safari125-catalog.png`、`safari11-125-pinned.png`；原生125%菜单记录见 `safari125-menu-proof.txt`。

也尝试了Chrome原生125%：先前窗口抽查实际仍为100%，随后虽显示125%控件，原生截图返回空白、页面可访问性内容不可用，未完成有效页面验证。该尝试记为**未完成，不计入通过**，见 `chrome-native-zoom-results.json`。名称含 `chrome-native-100-*` 的图片仅为100%原生操作诊断。不能把CSS zoom、设备像素比或缩放菜单本身当作完整浏览器125%验收。

## 已知限制

- Safari原生控制接口没有鼠标移动/悬停操作，因此没有完成Safari的五模型快速划过压力矩阵；鼠标压力在实际Chrome自动化中完成。Safari不是与Chrome相同覆盖度。
- Chrome原生125%页面验收未完成；125%的有效实际抽查来自Safari。未测试Firefox、Windows、触摸屏完整矩阵。
- 本轮未测全班服务器容量或真实学生使用效果。原始Python预览在并行加载时曾出现单次脚本连接重置；新增标准库预览将接受队列设为128，最终页面验收无未捕获异常，但不能据此宣称正式部署并发已验收。
- 使用浏览器缓存过旧HTML时，首次更新可强制刷新，或访问带版本参数的本地链接。运行包已更新版本。

## 启动、复测与截图

在项目目录运行（不安装任何前端依赖）：

```sh
python3 tools/serve.py
```

打开 <http://127.0.0.1:8765/?v=1.9.1>。原命令仍可用：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

同一端口只运行一个服务。后续修改源JS后执行 `node tools/build-workbench.cjs`。交付的 `dist/` 已生成，可直接静态运行。

```sh
node tests/interaction191.test.cjs
node tests/interaction191.test.cjs --extras
node tests/ui-refinement.test.cjs
node tests/run-regression.cjs
node tests/presentation.test.cjs
```

浏览器测试需要Playwright及已安装Chrome；支持 `PLAYWRIGHT_MODULE` 覆盖模块路径、`FINMODEL_URL` 覆盖服务地址。数学和真实R测试需要Node、Rscript。

[实际截图画廊](tests/v1.9.1/gallery.html) 包含07/11悬停与离开、五页面目录高亮、短屏内部滚动、Safari125%及五模型1440×900首屏。所有图片来自实际浏览器，没有用设计稿代替。

交付包：`FinModel-Lab-v1.9.1.zip`。旧版本ZIP与原课堂使用资料均保留。
