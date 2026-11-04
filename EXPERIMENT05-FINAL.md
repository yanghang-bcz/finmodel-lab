# FinModel Lab v3.0 · 实验 05 开发与验收

验收日期为 2026 年 11 月 4 日。基线为 GitHub 仓库 `yanghang-bcz/finmodel-lab` 的 `main` 提交 `504cc08659b9323a0dd7e460a3475d1a14974271`。本轮沿用其现有静态站点、课程目录、三栏工作台、字体、KaTeX、独立滚动和教师投屏入口。其他六个实验的金融计算模块未改动。

## 交付范围

课程目录按 01 至 12 排列。当前构建的可进入实验为 04、05、06、07、08、09、11。实验 05 有「平稳性与数据」「ARMA 建模」「VAR 与 Granger」「预测模型比较」四个自由切换的视图。各视图默认显示当前完整 R 脚本，支持语句解释、代码段导航、关键逻辑和完整复制。

| 位置 | 改动 |
| --- | --- |
| `dist/timeseries-math.js` | 合成与 CSV 数据、平稳性、ARMA、VAR、Granger、滚动样本外预测 |
| `dist/timeseries-lstm.js`、`timeseries-worker.js`、`timeseries-weights.js` | 浏览器训练、取消、冻结权重及推断 |
| `dist/timeseries-r.js` | 生成各视图的独立 Base R 脚本 |
| `dist/timeseries-workbench.js`、`timeseries-chart.js`、`timeseries.css` | 教学界面、参数、图表、代码联动与提示 |
| `dist/experiments*.{js,html}`、`dist/i18n-exp.js`、构建产物 | 路由、课程目录、英文导航与主要控件、指纹 |
| `tools/build-workbench.cjs`、`serve.py`、`train-experiment05.cjs` | 静态构建、预览和默认权重复现 |
| `tests/experiment05-*.cjs`、`examples/experiment05-*.R`、本文及课堂指南 | 可重复验收、示例与课堂使用 |

## 数据与统计口径

**合成数据。** 默认种子 52027，丢弃初始 100 期。市场对数收益含 AR(1) 系数 0.42，行业含自身系数 0.24 及市场一期滞后系数 0.32，第三个金融因子含自身系数 0.55 和行业滞后系数 0.14。三个方程加入独立正态创新，默认标准差 0.012。将对数收益累乘得到 721 个合成价格，转换后有 720 期收益。时间标签使用模拟观测期。

**CSV。** 本地解析 2 MB 以内、40–2000 行的同频宽表。显式选择 ISO 日期列、目标、至多两个额外列、统一尺度与频率。拒绝重复或无效日期、同周期多行、非法数值、非正价格和小于 −100% 的简单收益。倒序或乱序整行排序，列仍按同一日期配对。缺失默认拒绝，也可明确选择删除整行。遇到不规则间隔需确认按相邻观测建模。异常观测保留并提示。价格转收益分别使用相邻比率减一或相邻对数之差，损失首期。VAR 和 LSTM 分别配置变量。文件、导入数值和浏览器训练权重均留在本机。

**平稳性。** ADF 回归含滞后水平项和可调滞后差分，支持无确定性项、截距、截距与趋势。单位根为原假设。网页与 R 共用按样本规模分档的 `ur.df` τ 专用 5% 临界值，报告 τ 与拒绝结果。KPSS 的原假设为水平或趋势平稳，使用 Bartlett 长期方差，带宽为 `floor(4*(n/100)^0.25)`，5% 临界值为 0.463 和 0.146。ACF 是样本自相关，PACF 由 Durbin–Levinson 递推，参考线是白噪声假设下的点态近似。 [urca ADF 实现](https://github.com/cran/urca/blob/master/R/ur-df.R) · [urca KPSS 实现](https://github.com/cran/urca/blob/master/R/ur-kpss.R)

**ARMA。** 含均值的条件高斯模型。有效样本排除前五个初始化创新，所有候选用同一口径。给定 AR 和 MA 系数时解析求均值，AR(1) 使用受约束最小二乘。其他非零阶动态参数通过两组初值的 BFGS 优化，反射系数将 AR 和 MA 分别约束在平稳与可逆区域。ARMA(0,0) 使用有效样本均值。手动阶数 0–5，自动比较 0–3 的 16 个候选，使用 AIC、AICc 或 BIC。信息准则计入方差参数，诊断报告有效残差的 ACF 和 Ljung–Box，自由度为 L−p−q。多步点预测递推，80% 和 95% 区间使用高斯创新的累计响应平方，条件于已估参数。 [R stats::arima 文档](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html)

**VAR 和 Granger。** 含截距的 2–3 变量 VAR 逐方程 OLS。自动比较 1–5 阶，固定候选的有效估计日期，使用 AIC、BIC 或 HQ，选定后按该阶数重估。界面可展开系数矩阵、残差协方差、伴随矩阵特征值、拟合值与残差示例及预测表。Granger 使用同一目标方程的受限与非受限 OLS，用 F 检验联合限制给定来源的全部滞后系数为零。它描述当前模型下的额外预测信息。默认样本市场 → 行业的 F(1, 716) 为 80.6115，p 约为 2.39×10⁻¹⁸，反方向 F 为 0.2188，p 为 0.6401。

## LSTM 与统一样本外评价

默认窗口 12 期、一个 8 单元 LSTM 层及线性读出，输入为市场与行业。对输入和目标用训练段中心和尺度标准化。使用四门递推、完整窗口反向传播和 Adam 小批量更新。批量 32、学习率 0.008、种子 731、最多 40 轮、早停耐心 6 轮。默认模型实跑 16 轮，恢复验证损失最低的第 10 轮。权重版本为 `exp05-lstm-1`，训练及验证数据指纹为 `9024ecbce5cdb9960d8148b49265dfe540318db8cbf22510519578de8281f27f`。使用 `node tools/train-experiment05.cjs --check` 可校验默认检查点。

默认训练 504 期、验证 108 期、测试 108 期。ARMA 和 VAR 参数在训练段拟合，LSTM 用随后验证段早停。滚动一期预测可使用已观察的测试段历史，预测目标当期及以后不进入该次预测。Naive 使用上一期值。任一模型失败时，其他模型在同一完整日期集继续评价，失败模型不参与排名。重复查看同一留出期后更改设定的结果应当作为探索性比较。

| 模型 | 一期 RMSE | 一期 MAE |
| --- | ---: | ---: |
| Naive | 0.01547340 | 0.01212124 |
| ARMA(1,1) | 0.01325070 | 0.01040152 |
| VAR(1) | 0.01317519 | 0.01034728 |
| LSTM | 0.01309963 | 0.01042582 |

LSTM 的 RMSE 最低，VAR 的 MAE 最低。表中单位为对数收益小数。模型可见的变量不同，结果适用于本次样本与配置。

## 真实 R 与数值核验

使用 R 4.6.1 与 `Rscript --vanilla`，执行 19 次独立交叉核验，另在 Chrome 中复制并执行四个视图和训练后的 CSV 比较脚本。测试样本覆盖随机游走、平稳 AR、趋势平稳、合成价格及两种收益转换、CSV、手动和自动定阶、近单位根 AR(1)、VAR 两列／三列与多阶、Granger、冻结 LSTM 及共同留出预测。

| 比较 | 所测最大绝对差 |
| --- | ---: |
| ADF τ 对独立 Base R 公式回归 | 5.33×10⁻¹⁴ |
| KPSS 对 Base R 协方差自相关实现 | 1.80×10⁻¹⁴ |
| ACF / PACF 对 `stats::acf` / `stats::pacf` | 2.13×10⁻¹⁵ / 7.77×10⁻¹⁴ |
| ARMA 系数与方差、条件似然及准则 | 1.09×10⁻⁵ / 6.28×10⁻¹⁰ |
| ARMA 预测及预测区间 | 2.34×10⁻⁹ |
| ARMA 创新对 `stats::arima(method="CSS", n.cond=5)` | 1.84×10⁻⁷ |
| VAR 系数、伴随根模 | 4.16×10⁻¹⁵ / 9.45×10⁻¹⁴ |
| Granger F、自由度与 p 值 | 8.82×10⁻¹³ |
| 冻结 LSTM 逐期预测、四模型误差 | 6.08×10⁻¹⁶ / 1.10×10⁻¹¹ |

LSTM 另通过梯度逐坐标有限差分、训练和验证误差、早停检查点、预测窗口以及更改测试观测对权重无影响的验证。

示例均为可独立运行的 Base R 脚本。 [ARMA](examples/experiment05-arma.R) · [VAR](examples/experiment05-var.R) · [Granger](examples/experiment05-granger.R) · [LSTM](examples/experiment05-lstm.R) · [四模型](examples/experiment05-comparison.R)

## 浏览器与六实验回归

使用真实 Chrome 156.0.8078.80，检查 1920×1080、1440×900、1366×768、原生 125% 缩放和投屏模式。验证数据与代码同步、图表悬停／固定／Esc、四个视图、目录导航、刷新和前进后退、CSV 错误与数据失效、真实训练和取消。试验过程中没有 CSV 上传、脚本报错或失败资源请求。 [浏览器测试记录](tests/experiment05/browser-results.json)

| 旧实验 | 原有数值与 R 回归 | 真实 Chrome 回归 |
| --- | --- | --- |
| 04 多元回归 | 通过 | 通过 |
| 06 GARCH | 通过 | 通过 |
| 07 VaR / ES | 通过 | 通过 |
| 08 组合优化 | 通过 | 通过 |
| 09 CAPM | 通过 | 通过 |
| 11 Black–Scholes | 通过 | 通过 |

实验 04 回归脚本的目录期望改为加入 05。完整 R、金融数值和交互仍按原有回归脚本验证。新实验的浏览器测试另外核对 01、02、03、10、12 仍未开放。

[平稳性与数据](deploy-evidence/experiment05/station-1440x900.png) · [ARMA](deploy-evidence/experiment05/arma-1440x900.png) · [双向 Granger](deploy-evidence/experiment05/03-var-granger-1440.png) · [四模型比较](deploy-evidence/experiment05/compare-1440x900.png) · [125% 缩放](deploy-evidence/experiment05/zoom125-compare.png)

## 本机与发布

构建指纹为 `3.0.0-timeseries.4e0fceafb8f27c44`。启动 `python3 tools/serve.py` 后，本机入口为 [实验 05](http://127.0.0.1:8765/experiments.html?model=timeseries)。执行 `node tools/build-workbench.cjs --check` 验证构建。按最后确认的交付方式，本机 GitHub 仓库提交至 `main`，远端推送由用户通过 GitHub Desktop 完成。WorkBuddy 和 Netlify 的发布由用户现有流程管理，本轮验收范围为本地构建。

## 课堂使用与限制

[课堂指南](CLASSROOM-EXPERIMENT05.md) 包含 12 分钟演示、四项自由探索、RStudio 操作及反馈问题。当前为软件内部验收，真实课堂理解和操作用时待学生试用验证。

- ARMA 当前不报告通用 Wald 显著性和系数区间。约束边界、弱识别和阶数选择会影响其解释。预测区间不计参数估计不确定性。
- 预测比较固定共同滚动一期。VAR 高级 IRF、稳健 Granger 检验和结构识别未纳入本轮。CSV 中不同类型或尺度的列应预先转换到同一声明口径。
- R 复现 LSTM 的冻结推断，训练和早停在 JavaScript。新 CSV 训练需要现代浏览器支持 Web Worker。英文模式覆盖新导航与主要控件，部分详细教学说明和校验消息仍使用中文。
- 通过内置时间戳表示的缺期处理可能形成长短不同的收益期间，模型按相邻观测索引解释。

内部验收为 **94/100**。课程覆盖 30/30，数学与统计 18/20，R 实践 19/20，交互教学 13/15，数据与样本外评价 9/10，稳定性 5/5。扣分主要来自系数推断、固定一期评价、CSV 统一尺度和详细文本的双语覆盖。该评分与真实课堂试用分开记录。
