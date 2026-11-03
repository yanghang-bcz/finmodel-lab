/* ============================================================
   FinModel Lab — 中英文切换（i18n）
   ------------------------------------------------------------
   设计要点：
   1. 精确整串匹配。短词不参与子串替换 —— 否则「无风险资产」会被
      「无→None」切成「None风险资产」这类半英半中的怪物。
   2. 拼接串（第N行：…、问题N、结果：xx%）交给 PATTERNS 正则规则。
   3. MutationObserver 接管动态渲染（切实验、点代码行、改参数都会触发）。
   4. 节点原文快照，切回中文精确还原，不依赖反向字典。
   5. 语言写入 localStorage，跨页面、跨刷新保持。
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'finmodel-lang';
  var ATTRS = ['aria-label', 'title', 'placeholder', 'alt', 'aria-valuetext'];
  var zhRe = /[\u4e00-\u9fa5]/;

  /* ---------- 字典：中文 → English（整串精确匹配） ---------- */
  var DICT = {
    /* —— 单字 / 短标签 —— */
    '无': 'None',
    '菜单': 'Menu',
    '预测': 'Predict',
    '实验': 'Experiment',
    '解释': 'Explain',
    '存在': 'Yes',
    '下降': 'Decrease',
    '不变': 'Unchanged',
    '上升': 'Increase',
    '参数': 'Parameters',
    '年化': 'Annualised',
    '资产': 'Asset',
    '每期': 'Per period',
    '完成': 'Completed',
    '愿意': 'Yes',
    '可行集': 'Feasible set',
    '标准差': 'Std. dev.',
    '正相关': 'Positive',
    '不存在': 'No',
    '协方差': 'Covariance',
    '调整前': 'Before',
    '资产A': 'Asset A',
    '资产B': 'Asset B',
    '资产C': 'Asset C',
    '日期列': 'Date column',
    '请选择': 'Please select',
    '未完成': 'Not completed',
    '不确定': 'Not sure',
    '模型设定': 'Model setup',
    '组合风险': 'Portfolio risk',
    '简单收益': 'Simple returns',

    /* —— 导航与页头 —— */
    '模型实验室': 'Model Lab',
    '实验目录': 'Experiment Catalog',
    '帮助与资源': 'Help & Resources',
    '课堂工具': 'Classroom Tools',
    '投屏模式': 'Projector Mode',
    '实验工作台': 'Workbench',
    '当前实验': 'Current experiment',
    '实验八工作台': 'Experiment 8 workbench',
    '主要导航': 'Main navigation',
    '手机导航': 'Mobile navigation',
    'FinModel Lab 实验工作台': 'FinModel Lab workbench',
    '课程实验列表': 'Course experiment list',
    '进入 →': 'Enter →',
    '暂未上线': 'Coming soon',
    '投资组合工作台模式': 'Portfolio workbench mode',

    /* —— 代码面板 —— */
    '复制完整 R 代码': 'Copy full R code',
    '完整代码': 'Full code',
    '关键逻辑': 'Key logic',
    'RStudio 实践': 'RStudio practice',
    'R 代码与步骤解析': 'R code and step breakdown',
    '点击 R 代码查看逻辑语句解析': 'Click R code to see the statement breakdown',
    '点击代码行查看解释': 'Click a code line for the explanation',
    '调整代码与解析比例，上下方向键调整，Home与End设为边界': 'Adjust the code/explanation ratio with the arrow keys; Home and End set the bounds',
    '拖动调整代码与解析；也可使用上下方向键': 'Drag to resize code and explanation; arrow keys also work',
    '当前步骤解析': 'Current step explanation',
    '基础R，无额外包；主复制始终包含完整脚本': 'Base R only, no packages; the main copy always includes the full script',
    '完整R代码段落导航': 'Full R script navigation',
    '展开解析 ↗': 'Expand explanation ↗',
    '运行 R 代码': 'Run the R code',
    '金融意义': 'Financial meaning',
    '关闭RStudio 实践': 'Close RStudio practice',
    '关闭R实践': 'Close R practice',

    /* —— 模型面板 —— */
    '投资组合风险收益模型': 'Portfolio risk-return model',
    '自动适配 ⇄': 'Auto-fit ⇄',
    '当前自动适配；点击切换固定比较': 'Auto-fit is on; click to switch to fixed comparison',
    '自动适配当前曲线；点击切换固定比较': 'Auto-fitting the current curve; click to switch to fixed comparison',
    '自动适配当前可行集': 'Auto-fitting the current feasible set',
    '试试看：降低相关系数，组合风险会如何变化？': 'Try it: what happens to portfolio risk if you lower the correlation?',
    '选择探索任务': 'Choose exploration task',
    '相关系数': 'Correlation',
    '有效前沿': 'Efficient frontier',
    '开始探索 →': 'Start exploring →',
    '结束比较': 'End comparison',
    '设为比较基准': 'Set as baseline',
    '查看变化': 'View change',
    '调整参数，观察代码与曲线的对应关系。': 'Adjust parameters to see how the code maps onto the curve.',
    '组合预期收益率': 'Expected portfolio return',
    '组合风险（标准差） →': 'Portfolio risk (std. dev.) →',
    '风险收益图：灰色可行集，绿色有效部分；可点击组合点查看详情': 'Risk-return chart: grey feasible set, green efficient set; click a portfolio point for details',
    '查看最小方差组合详情': 'View minimum-variance portfolio details',
    '查看当前组合详情': 'View current portfolio details',
    '关闭组合详情': 'Close portfolio details',
    '选择组合身份': 'Choose portfolio identity',
    '当前组合': 'Current portfolio',
    '最小方差': 'Minimum variance',
    '比较基准': 'Baseline',
    '有效部分': 'Efficient set',
    '查看组合有效性': 'Check portfolio efficiency',
    '撤销配置': 'Undo allocation',
    '资产A端点': 'Asset A endpoint',
    '资产B端点': 'Asset B endpoint',
    '查看资产A端点': 'View asset A endpoint',
    '查看资产B端点': 'View asset B endpoint',
    '有效组合 · 查看原因': 'Efficient portfolio · why',
    '多资产风险收益平面': 'Multi-asset risk-return plane',
    '当前组合收益 μ': 'Current portfolio return μ',
    '当前组合风险 σ': 'Current portfolio risk σ',
    '采样可行点 ≠ 精确边界': 'Sampled feasible points ≠ exact frontier',
    '精确优化前沿': 'Exact optimised frontier',
    '目标收益组合': 'Target-return portfolio',
    '提交预测后可查看组合诊断': 'Portfolio diagnosis unlocks after you submit a prediction',
    '最近一次模拟配置调整前后对比': 'Last simulated change, before vs after',
    '基准：进入本轮时的当前参数。': 'Baseline: the current parameters when this round began.',

    /* —— 参数面板 —— */
    '参数调节': 'Parameter controls',
    '恢复默认': 'Reset',
    '组合权重': 'Portfolio weights',
    '资产 A 权重': 'Asset A weight',
    '资产假设': 'Asset assumptions',
    '资产数量': 'Number of assets',
    '同一分析期的预期收益率与标准差': 'Expected return and standard deviation over the same horizon',
    '预期收益率': 'Expected return',
    '资产 A 预期收益率（%）': 'Asset A expected return (%)',
    '资产 B 预期收益率（%）': 'Asset B expected return (%)',
    '资产 A 标准差（%）': 'Asset A standard deviation (%)',
    '资产 B 标准差（%）': 'Asset B standard deviation (%)',
    '资产A预期收益率': 'Asset A expected return',
    '资产B预期收益率': 'Asset B expected return',
    '资产C预期收益率': 'Asset C expected return',
    '资产A波动率': 'Asset A volatility',
    '资产B波动率': 'Asset B volatility',
    '资产C波动率': 'Asset C volatility',
    '资产A权重百分比': 'Asset A weight (%)',
    '资产B权重百分比': 'Asset B weight (%)',
    '资产C权重百分比': 'Asset C weight (%)',
    '教学假设提示（不阻断计算）': 'Teaching assumption notice (computation continues)',
    '相关系数 ρ': 'Correlation ρ',
    '相关系数精确数值': 'Exact correlation value',
    '相关系数滑块': 'Correlation slider',
    '目标收益（%）': 'Target return (%)',
    '当前权重': 'Current weights',
    '便捷调整': 'Quick adjust',
    '精确输入': 'Exact input',
    '权重调整方式': 'Weight adjustment',
    '按比例归一化': 'Normalise proportionally',
    '应用权重草稿': 'Apply weight draft',
    '放弃草稿': 'Discard draft',
    '应用 GMV 权重': 'Apply GMV weights',
    '应用目标收益组合': 'Apply target-return portfolio',
    '完整相关矩阵 ρ 与协方差 Σ': 'Full correlation matrix ρ and covariance Σ',
    '主动使用岭正则 λ=max(diag Σ)×10⁻⁶': 'Ridge regularisation on request, λ = max(diag Σ)×10⁻⁶',
    '禁止卖空 · 全额投资 · 无无风险资产': 'No short selling · fully invested · no risk-free asset',
    '不允许卖空；金额占比合计 100%。': 'No short selling; allocations sum to 100%.',
    '看懂有效性与约束': 'Read efficiency and constraints',
    '不允许卖空；金额占比合计 100%。': 'No short selling; allocations sum to 100%.',

    /* —— 探索流程 —— */
    '探索问题': 'Exploration question',
    '探索进度': 'Exploration progress',
    '01 / 预测': '01 / Predict',
    '重新开始': 'Restart',
    '当前相关系数已经达到最低值，无法继续降低。': 'Correlation is already at its minimum and cannot drop further.',
    '使用默认参数开始探索': 'Start with default parameters',
    '保持权重、收益率和标准差不变，只降低相关系数，组合风险会如何变化？': 'With weights, returns and volatilities held fixed, how does portfolio risk change when the correlation is lowered?',
    '预测是否存在改进': 'Predict whether an improvement exists',
    '先预测风险变化': 'Predict the change in risk first',
    '确认预测，开始实验 →': 'Confirm prediction and run the experiment →',
    '查看实验解释 →': 'View the explanation →',
    '重新实验': 'Run again',
    '退出并恢复实验前参数': 'Exit and restore pre-experiment parameters',
    '退出并恢复': 'Exit and restore',
    '保留当前参数并退出': 'Keep current parameters and exit',
    '观察权重如何影响收益与风险': 'Watch how weights move return and risk',
    '相同的收益目标，怎样承担更少风险？': 'Same return target — how can you carry less risk?',
    '一定严格下降': 'Always strictly decreases',
    '收益率也一定下降': 'Returns also strictly decrease',
    '不会增加；正权重且正波动时严格下降': 'Never increases; strictly decreases with positive weights and volatilities',

    /* —— 帮助对话框 —— */
    '从代码出发': 'Start from the code',
    '点击任一代码行，查看整个逻辑语句、公式与当前计算。选中权重或相关系数定义时，右侧对应控件会高亮。': 'Click any code line to see the full statement, formula and current value. Selecting a weight or correlation definition highlights the matching control on the right.',
    '探索图表': 'Explore the chart',
    '模型约束': 'Model constraints',
    '进阶知识：数值稳定性': 'Advanced: numerical stability',
    '解析与坐标': 'Layout and axes',
    '关闭帮助与资源': 'Close help',
    '关闭实验目录': 'Close experiment catalog',
    '关闭课堂工具': 'Close classroom tools',
    '标准模型：min wᵀΣw，约束 1ᵀw=1，w≥0；目标收益解另加 μᵀw=r。最多5资产，枚举所有非空活跃面求精确凸二次优化；曲线连接61个优化解，点间显示是插值。灰点仅为采样展示。': 'Standard model: min wᵀΣw subject to 1ᵀw = 1 and w ≥ 0; the target-return solution adds μᵀw = r. With up to 5 assets every non-empty active set is enumerated for an exact convex quadratic solution; the curve joins 61 optimal solutions and is interpolated between them. Grey dots are sampling only.',
    'ρ上下三角需一致；Σ=diag(σ)ρdiag(σ)。输入只在合法且PSD时生效。': 'ρ must be symmetric; Σ = diag(σ)ρdiag(σ). Inputs only apply when valid and positive semi-definite.',
    '本版禁止卖空、不含无风险资产、不含交易成本。样本期望与协方差不等于未来真值；简单收益均值线性年化不等于复利预测，对数收益也不等于简单收益。': 'This version has no short selling, no risk-free asset and no transaction costs. Sample means and covariances are not future truth; annualising a mean simple return linearly is not a compounded forecast, and log returns are not simple returns.',
    '有效组合不存在风险不更高、收益不更低且至少一项严格改善的可行配置。绿色前沿只取GMV到最高收益的一段；低于GMV收益的最小方差解仍可能非有效。': 'An efficient portfolio has no feasible alternative with no higher risk, no lower return and at least one strictly better. The green frontier only spans GMV to the highest-return point; minimum-variance solutions below GMV return may still be inefficient.',
    '当前组合来自已应用权重，不一定最优。GMV是在当前约束下风险最低的组合，但不一定是收益最高的组合。目标收益组合是指定收益下方差最低的优化结果，点击应用前不会改变当前模型权重。': 'The current portfolio reflects the applied weights and need not be optimal. GMV is the lowest-risk portfolio under the current constraints, not necessarily the highest-return one. The target-return portfolio is the minimum-variance solution at a specified return and does not change the model weights until applied.',
    '便捷调整会按明示规则分配其余权重；应用只改变模型配置，不是真实交易。': 'Quick adjust redistributes the remaining weights by the stated rule; applying only changes the model configuration, not a real trade.',
    '修改一个资产权重时，其余资产按原有比例自动调整，确保合计100%。失焦或Enter提交；其余原权重全为0时平均分配。': 'Changing one weight rescales the others proportionally so the total stays at 100%. Commit on blur or Enter; if the others are all zero they split evenly.',
    '双资产：固定σ与权重降低ρ，风险一定严格下降吗？尝试零权重，解释2w₁w₂σ₁σ₂Δρ的符号。多资产：只改一对相关性时仍须整体PSD，不能任意拼接。': 'Two assets: with σ and weights fixed, does lowering ρ always strictly cut risk? Try zero weights and explain the sign of 2w₁w₂σ₁σ₂Δρ. Multi-asset: changing one pair still requires the whole matrix to remain PSD — pairs cannot be patched independently.',
    '数据实践：导入自己的CSV，切换前/后半段，记录GMV与前沿变化；再对A收益加减1标准误，观察权重敏感性。标准误使用独立同分布近似，忽略自相关与结构变化，不能作为收益保证。': 'Data practice: import your own CSV, switch between first and second half, and record how GMV and the frontier move; then shift asset A by ±1 SE to see weight sensitivity. The standard error uses an iid approximation that ignores autocorrelation and structural change, and is no guarantee of returns.',
    '可配置示例范围：收益绝对值≤30.00%，波动率≤60.00%；高收益/低波动提示阈值为20.00%与5.00%。并非市场通用正常范围。': 'Configurable example ranges: |return| ≤ 30.00%, volatility ≤ 60.00%; high-return and low-volatility hints trigger at 20.00% and 5.00%. These are not universal market norms.',

    /* —— 课堂工具 —— */
    '教学示例': 'Teaching presets',
    '理解检验': 'Comprehension check',
    '试用反馈': 'Trial feedback',
    '三个示例均为教学假设，使用同一分析期口径。': 'All three presets are teaching assumptions using the same analysis horizon.',
    '加载将重置当前参数、比较与探索过程。': 'Loading resets the current parameters, comparison and exploration.',
    '确认重置并加载示例': 'Confirm reset and load preset',
    '选择教学示例': 'Choose a teaching preset',
    '选择知识点': 'Choose a concept',
    '提交答案': 'Submit answer',
    '定位相关 R 代码 →': 'Locate the relevant R code →',
    '指定任务完成情况': 'Task completion',
    '部分完成': 'Partially completed',
    '最难理解的 R 知识点': 'Hardest R concept',
    '向量与下标': 'Vectors and indexing',
    '权重与加权求和': 'Weights and weighted sums',
    '方差与开平方': 'Variance and square roots',
    '最小方差与有效前沿': 'Minimum variance and the efficient frontier',
    '仍困惑的金融概念': 'Still-confusing finance concept',
    '最有帮助的可视化': 'Most helpful visualisation',
    '风险收益曲线': 'Risk-return curve',
    '方差分项': 'Variance decomposition',
    '代码联动': 'Code linkage',
    '有效性比较': 'Efficiency comparison',
    '尚不明确': 'Not sure yet',
    '愿意课后使用吗': 'Would you use it after class?',
    '暂不愿意': 'Not yet',
    '导出匿名反馈 JSON（不上传）': 'Export anonymous feedback JSON (not uploaded)',
    '仅写知识点，请勿填写姓名或学号': 'Concepts only; do not enter your name or student ID',
    '经教师同意，在本设备填写匿名反馈': 'With teacher approval, submit anonymous feedback on this device',
    '仅用于经教师同意的课堂试用。不记录鼠标行为，不自动上传或保存个人信息。': 'For teacher-approved classroom trials only. No mouse behaviour is recorded, and no personal data is uploaded or stored automatically.',
    '尚无真实使用人数或学习效果数据。教师可用导出的匿名反馈配合前后测评价。': 'There is no real usage or learning-outcome data yet. Teachers can pair the exported anonymous feedback with pre/post tests.',
    '示例A：基础组合': 'Preset A: baseline portfolio',
    '示例B：相关性实验': 'Preset B: correlation experiment',
    '示例C：非有效组合': 'Preset C: inefficient portfolio',

    /* —— 本地 CSV —— */
    '本地 CSV 数据实践': 'Local CSV practice',
    '上传本地CSV': 'Upload local CSV',
    '只在浏览器内读取，不上传服务器或第三方；刷新即清空。复制脚本会包含清洗后收益数据，请按需保存。': 'Read in the browser only; nothing is uploaded to a server or third party and it clears on refresh. The copied script includes the cleaned return data, so save it if you need it.',
    '下载合成价格示例': 'Download synthetic price sample',
    '示例由确定性公式生成，非真实市场数据。未内置来源与再分发许可均已核实的历史行情。': 'The sample is generated by a deterministic formula, not real market data. No historical prices with verified provenance and redistribution rights are bundled.',
    '输入类型': 'Input type',
    '价格（须自行确认复权口径）': 'Prices (confirm the adjustment convention yourself)',
    '简单收益率（小数）': 'Simple returns (decimal)',
    '收益口径': 'Return basis',
    '对数收益 / log1p转换': 'Log returns / log1p transform',
    '缺失处理': 'Missing data',
    '拒绝并提示': 'Reject with a notice',
    '删除任一资产缺失的整行': 'Drop rows with any missing asset',
    '显式按日期升序排列': 'Sort explicitly by date ascending',
    '数据频率': 'Data frequency',
    '日度（252）': 'Daily (252)',
    '月度（12）': 'Monthly (12)',
    '年度（1）': 'Annual (1)',
    '每日含周末（365）': 'Daily incl. weekends (365)',
    '年化因子': 'Annualisation factor',
    '使用所选数据': 'Use selected data',
    '显示单位': 'Display unit',
    '每期': 'Per period',
    '完整样本': 'Full sample',
    '前半段估计 μ 与 Σ': 'Estimate μ and Σ on the first half',
    '后半段估计 μ 与 Σ': 'Estimate μ and Σ on the second half',
    '资产A均值 +1标准误': 'Asset A mean +1 SE',
    '资产A均值 −1标准误': 'Asset A mean −1 SE',
    '估计不确定性实验': 'Estimation uncertainty',
    '导出清洗后收益CSV': 'Export cleaned return CSV',
    '返回教学假设': 'Back to teaching assumptions',
    '选择3至5个资产列': 'Select 3–5 asset columns',

    /* —— 实验目录条目 —— */
    'R软件基础实验': 'R Basics',
    '金融市场数据整理与预处理': 'Financial data preparation',
    '资产收益率计算': 'Asset return calculation',
    '多元回归与逐步回归分析': 'Multiple and stepwise regression',
    'ARMA与VAR模型': 'ARMA and VAR models',
    'GARCH类波动率模型': 'GARCH volatility models',
    'VaR与ES投资风险计算': 'VaR and ES risk measurement',
    '均值-方差投资组合决策分析': 'Mean-variance portfolio decisions',
    '资本资产定价模型的R语言实验': 'CAPM in R',
    '因子模型与APT模型': 'Factor models and APT',
    'Black-Scholes期权定价': 'Black-Scholes option pricing',
    '证券投资基金绩效评价': 'Fund performance evaluation',
    '实验08 · 均值-方差投资组合决策分析': 'Experiment 08 · Mean-variance portfolio decisions',
    '双资产直觉': 'Two-asset intuition',
    '多资产组合': 'Multi-asset',
    '从共同波动，到约束优化': 'From shared volatility to constrained optimisation',
    '可选课堂挑战': 'Optional classroom challenge',

    /* —— R 脚本注释 —— */
    '# 实验08：两资产均值—方差组合': '# Experiment 08: two-asset mean-variance portfolio',
    '# 1. 参数：同一期限，小数单位': '# 1. Parameters: same horizon, decimal units',
    '# 2. 当前组合风险收益': '# 2. Current portfolio risk-return',
    '# 3. 最小方差优化（禁止卖空）': '# 3. Minimum variance (no short selling)',
    '# 4. 可行集与有效前沿': '# 4. Feasible set and efficient frontier',
    '# 5. 图表': '# 5. Chart',
    '# 6. 输出': '# 6. Output',

    /* —— R 代码行标签（与「第N行：」拼接规则配合） —— */
    '定义两资产预期收益率': 'Define two-asset expected returns',
    '定义两资产标准差': 'Define two-asset std. dev.',
    '定义相关系数': 'Define correlation',
    '分配投资组合权重': 'Allocate portfolio weights',
    '计算投资组合预期收益率': 'Compute expected portfolio return',
    '计算投资组合方差': 'Compute portfolio variance',
    '由方差得到组合标准差': 'Portfolio std. dev. from variance',
    '判断风险是否随权重变化': 'Check whether risk varies with weights',
    '求最小方差组合': 'Solve minimum-variance portfolio',
    '枚举可行组合': 'Enumerate feasible portfolios',
    '计算曲线的收益坐标': 'Return coordinate of the curve',
    '计算曲线的风险坐标': 'Risk coordinate of the curve',
    '识别有效部分': 'Identify the efficient set',
    '绘制全部可行组合': 'Draw all feasible portfolios',
    '绘制有效部分': 'Draw the efficient set',
    '标记当前投资组合': 'Mark the current portfolio',
    '输出当前计算结果': 'Output the current result',

    /* —— BS 实验的代码行标签 —— */
    '参数 · S': 'Parameters · S',
    '参数 · K': 'Parameters · K',
    '参数 · T': 'Parameters · T',
    '参数 · r': 'Parameters · r',
    '参数 · sigma': 'Parameters · sigma',
    '参数 · q': 'Parameters · q',
    '价格函数与边界': 'Price function and boundaries',
    '股息贴现因子 E': 'Dividend discount factor E',
    '标的贴现值 A': 'Discounted spot A',
    '行权价现值 D': 'Discounted strike D',
    '标准化距离 d₁': 'Standardised distance d₁',
    '标准化距离 d₂': 'Standardised distance d₂',
    '正态权重 Φ(d₁)': 'Normal weight Φ(d₁)',
    '风险中性概率 Φ(d₂)': 'Risk-neutral probability Φ(d₂)',
    '看涨价格 Call': 'Call price',
    '看跌价格 Put': 'Put price',
    'Delta · 价格一阶敏感度': 'Delta · first-order price sensitivity',
    'Gamma · 价格二阶敏感度': 'Gamma · second-order price sensitivity',
    'Vega · 每1个百分点': 'Vega · per 1 percentage point',
    'Theta · 每自然日': 'Theta · per calendar day',
    '输出价格与Greeks': 'Output prices and Greeks',
    '绘制价格与S/K参考线': 'Plot prices against the S/K reference',

    /* —— 交互产生的状态文本 —— */
    '收起完整模型假设': 'Hide full model assumptions',
    '查看完整模型假设': 'View full model assumptions',
    '当前输入无法生成有效结果': 'The current inputs cannot produce a valid result',
    'lag超出支持范围。': 'Lag exceeds the supported range.',
    '超出支持范围。': 'Out of the supported range.',
    '输入无效。': 'Invalid input.',

    /* —— 长段说明 —— */
    '用同一期限的收益率与标准差，比较两资产组合；参数是教学假设。': 'Compare two-asset portfolios with returns and volatilities over the same horizon; the parameters are teaching assumptions.',
    '收益由资产预期收益和投资比例决定；相关系数不直接进入这条收益公式。': 'Return is set by expected returns and allocations; correlation does not enter this formula directly.',
    '按投资权重对两只资产的预期收益率加权平均。': 'Weight each asset expected return by its portfolio weight.',
    '其他参数固定、禁止卖空时，降低相关系数对组合方差的作用是？': 'With other parameters fixed and no short selling, what does lowering correlation do to portfolio variance?',
    '相同收益仅最小风险有效；风险恒定时仅最高收益有效；风险收益完全相同的组合等价。': 'At equal return only the lowest risk is efficient; at constant risk only the highest return; portfolios with identical risk and return are equivalent.',
    '有效组合不被其他组合支配：不存在风险不高且收益不低、至少一项严格更优的组合。相同收益仅最小风险有效；风险恒定时仅最高收益有效；风险收益完全相同的组合等价。': 'An efficient portfolio is not dominated by any other: no portfolio has both no higher risk and no lower return with at least one strictly better. At equal return only the lowest risk is efficient; at constant risk only the highest return; portfolios with identical risk and return are equivalent.',
    '所有数值为教学假设，不读取市场行情。资产权重非负、之和为 1，不允许卖空。两只资产的收益率与标准差必须使用同一时间尺度。收益率输入范围 −100%～100%，标准差 0%～100%，相关系数 −1～1。': 'All values are teaching assumptions and no market data is read. Asset weights are non-negative and sum to 1, so short selling is not allowed. Returns and volatilities of both assets must share the same horizon. Return inputs range from −100% to 100%, volatility from 0% to 100%, correlation from −1 to 1.',
    '当前参数偏离预设教学示例范围，仍可正常计算；结果是假设情景，不代表真实市场收益预测。': 'These parameters fall outside the preset teaching example but still compute. Results are hypothetical scenarios, not market forecasts.',
    '灰线表示全部可行组合，绿线表示有效部分。点击、轻触或键盘选中“当前组合”和“Minimum Variance”，查看权重与风险收益。极端情形下多个点可能重合，可用底部图例分别查看。': 'The grey line marks all feasible portfolios and the green line the efficient set. Click, tap or keyboard-select “Current portfolio” and “Minimum variance” to inspect weights and risk-return. In edge cases points may overlap; use the legend at the bottom to select them individually.',
    '“复制代码”生成当前有效参数的基础 R 脚本，粘贴到 RStudio 整体运行即可；浏览器不执行任意 R 输入。剪贴板不可用时自动下载 portfolio.R。投屏模式隐藏侧栏并放大代码，按 Escape 退出。': '“Copy code” produces a base R script for the current valid parameters; paste it into RStudio and run it all at once. The browser never executes arbitrary R input. If the clipboard is unavailable, portfolio.R is downloaded instead. Projector mode hides the sidebar and enlarges the code; press Escape to exit.',
    '网页内部用数学等价的非负形式计算方差；测试代码按机器精度和资产波动尺度检查两种表达式的一致性。默认教学脚本不包含机器精度、容差或断言。若当前参数完全负相关或接近风险抵消，脚本会补充一条有中文解析的等价方差公式，保证复制后也能正确计算该边界情形。它仍使用基础 R，无需额外安装包。': 'Internally the page computes variance with a mathematically equivalent non-negative form; the test suite checks both expressions against machine precision and the scale of asset volatility. The default teaching script contains no machine-precision, tolerance or assertion code. If the parameters are perfectly negatively correlated or nearly risk-offsetting, the script appends an equivalent variance formula so the copied code still handles that boundary case. It still uses base R and needs no extra packages.',
    '拖动代码与解析之间的分隔条，或聚焦后用上下方向键调整；Home/End切换到40%/80%。展开解析将代码保留40%，收起时恢复原比例。自动适配充分显示当前曲线；固定比较保留基准虚线与共同坐标，超范围时明确扩展。预测阶段冻结所有参数且隐藏比较；确认预测后只开放相关系数，且不能高于起点。查看解释后再次锁定参数；重新实验会回到同一起点。重新开始使用当前参数建立新预测基准。退出可选择恢复首次实验前参数或明确保留当前参数。': 'Drag the divider between code and explanation, or focus it and use the arrow keys; Home and End snap to 40% and 80%. Expanding the explanation keeps the code at 40%; collapsing restores the previous ratio. Auto-fit shows the current curve fully; fixed comparison keeps the baseline dashed line and shared axes, extending them explicitly when out of range. During prediction all parameters are frozen and comparison is hidden; after confirming, only correlation opens up and cannot exceed its starting value. Viewing the explanation locks parameters again; running again returns to the same starting point. Restart builds a new prediction baseline from the current parameters. On exit you can restore the parameters from before the first run or keep the current ones.',

    /* —— 文档级 —— */
    '通过 R 代码、实时计算和风险收益图，理解两资产均值—方差投资组合。': 'Understand the two-asset mean-variance portfolio through R code, live computation and risk-return charts.'
  };

  /* ---------- 拼接串规则：整串无法靠字典命中的动态文本 ---------- */
  var CN_NUM = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
  var NUM_TO_CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  var PATTERNS = [
    /* 第N行：模型设定 */
    [/^第(\d+)行[：:]\s*(.+)$/, function (m, n, label) {
      return 'Line ' + n + ': ' + (DICT[label] || label);
    }],
    /* 第N期：当前样本 0.7412163。单位见纵轴。 */
    [/^第(\d+)期[：:]\s*当前样本\s*(-?[\d.]+)\s*。\s*单位见纵轴。$/, function (m, n, v) {
      return 'Period ' + n + ': current sample ' + v + '. Units on the y-axis.';
    }],
    /* 问题1 / 问题2 */
    [/^问题\s*(\d+)$/, function (m, n) { return 'Question ' + n; }],
    /* 精确前沿第3点（图表点位的 aria-label） */
    [/^精确前沿第(\d+)点$/, function (m, n) { return 'Exact frontier point ' + n; }],
    /* 第N类 / 第N组 */
    [/^第(\d+)类$/, function (m, n) { return 'Category ' + n; }],
    /* 相关系数1,2 → ρ1,2 */
    [/^相关系数(\d+)[,，](\d+)$/, function (m, a, b) { return 'ρ' + a + ',' + b; }],
    /* 结果：11.00% */
    [/^结果[：:]\s*(.+)$/, function (m, v) { return 'Result: ' + v; }],
    /* 当前合计：100.00% */
    [/^当前合计[：:]\s*(.+)$/, function (m, v) { return 'Total now: ' + v; }],
    /* 草稿合计：1065.00% */
    [/^草稿合计[：:]\s*(.+)$/, function (m, v) { return 'Draft total: ' + v; }],
    /* 资产A权重：xx% */
    [/^(\S+?)[：:]\s*([-\d.,]+\s*%?)$/, function (m, k, v) {
      return (DICT[k] || k) + ': ' + v;
    }],
    /* 代码 68%，解析 32%（分隔条 aria-valuetext） */
    [/^代码\s*(\d+)\s*%，\s*解析\s*(\d+)\s*%$/, function (m, a, b) {
      return 'Code ' + a + '%, explanation ' + b + '%';
    }],
    /* Δμ +0.019 个百分点；Δσ -0.029 个百分点 */
    [/^Δμ\s*([+-]?[\d.,]+)\s*个百分点；\s*Δσ\s*([+-]?[\d.,]+)\s*个百分点$/, function (m, a, b) {
      return 'Δμ ' + a + ' pp; Δσ ' + b + ' pp';
    }],
    /* Σ 原始（小数平方）\n<矩阵> */
    [/^Σ 原始（小数平方）/, function () { return 'Σ raw (decimal squared)'; }],
    /* 风险下降，预期收益提高；这是当前约束下的收益—风险权衡。 */
    [/^风险(增加|下降|基本不变)，预期收益(提高|降低|基本不变)；这是当前约束下的收益—风险权衡。$/, function (m, a, b) {
      var risk = { '增加': 'Risk increases', '下降': 'Risk decreases', '基本不变': 'Risk is essentially unchanged' }[a];
      var ret = { '提高': 'expected return increases', '降低': 'expected return decreases', '基本不变': 'expected return is essentially unchanged' }[b];
      return risk + ' and ' + ret + '; this is the return–risk trade-off under the current constraints.';
    }],
    /* A预期收益率 / A波动率 / A权重百分比（动态生成的 aria-label） */
    [/^(.+?)预期收益率$/, function (m, k) { return k + ' expected return'; }],
    [/^(.+?)权重百分比$/, function (m, k) { return k + ' weight (%)'; }],
    [/^(.+?)波动率$/, function (m, k) { return k + ' volatility'; }]
  ];

  /* ---------- 翻译 ---------- */
  /* 数字归一化：含数字的长句（模板字符串渲染出来的结果说明）无法整串匹配，
     把数字抽象成占位符再查表，命中后按序填回。 */
  var NUM_TOKEN = '\u0001';
  var NUM_RE = /\d{4}-\d{2}-\d{2}|-?\d[\d,]*(?:\.\d+)?/g;
  var numDict = {};

  /* 内置数字模板：含动态数值的说明句，数字以 \u0001 占位 */
  var BUILTIN_NUM = {
    'S：\u0001→\u0001，Call \u0001→\u0001，Put \u0001→\u0001。股价更高使按执行价买入的权利更值钱，Call通常变贵；Put通常变便宜。':
      'S: \u0001 → \u0001, Call \u0001 → \u0001, Put \u0001 → \u0001. A higher share price makes the right to buy at the strike worth more, so the Call usually gets dearer and the Put cheaper.',
    '采用\u0001实验教学大纲。本轮覆盖欧式BS看涨看跌R函数、连续股息与四项Greeks。默认q=\u0001核对\u0001/\u0001；先预测再实验，只开放q，比较\u0001%与\u0001%。隐含波动率二分法、牛顿法可切换至独立教学模块；动态Delta对冲可在第四模块模拟。Φ(d₂)是风险中性测度下S_T>K的概率，Φ(d₁)不是实际获利概率。':
      'Follows the \u0001-experiment teaching syllabus. This round covers European BS call/put R functions, continuous dividends and four Greeks. With the default q=\u0001 verify \u0001/\u0001; predict first, then experiment with only q open, comparing \u0001% and \u0001%. Implied-volatility bisection and Newton methods move to a separate teaching module; dynamic Delta hedging can be simulated in the fourth module. Φ(d₂) is the probability that S_T>K under the risk-neutral measure; Φ(d₁) is not the probability of profit.'
  };

  function normNums(s) {
    var nums = [];
    var norm = s.replace(NUM_RE, function (m) { nums.push(m); return NUM_TOKEN; });
    return { norm: norm, nums: nums };
  }

  function fillNums(tpl, nums) {
    var i = 0;
    return tpl.replace(/\u0001/g, function () {
      return i < nums.length ? nums[i++] : '';
    });
  }

  var cache = new Map();
  var numSkeleton = null;

  function translate(text) {
    if (!text || !zhRe.test(text)) return text;
    if (DICT[text] !== undefined) return DICT[text];
    if (cache.has(text)) return cache.get(text);

    var out = text;

    /* 1. 拼接串模式 */
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(text)) {
        out = text.replace(PATTERNS[i][0], PATTERNS[i][1]);
        break;
      }
    }

    /* 2. 数字归一化匹配（含动态数值的说明句） */
    if (out === text && Object.keys(numDict).length) {
      var n = normNums(text);
      if (numDict[n.norm] !== undefined) out = fillNums(numDict[n.norm], n.nums);
      else {
        /* 兜底：把数字整体剥掉再比骨架。位数、正负号、指数写法变化时仍能命中。 */
        if (!numSkeleton) {
          numSkeleton = {};
          for (var k in numDict) {
            var sk = k.replace(/\u0001/g, '');
            if (numSkeleton[sk] === undefined) numSkeleton[sk] = k;
          }
        }
        var bare = text.replace(NUM_RE, '');
        var hit = numSkeleton[bare];
        if (hit !== undefined) out = fillNums(numDict[hit], n.nums);
      }
    }

    cache.set(text, out);
    return out;
  }

  /* ---------- 原文快照 ---------- */
  var textStore = new Map();
  var attrStore = new Map();
  var lang = 'zh';

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return true;
    if (el.hasAttribute && el.hasAttribute('data-fml-skip')) return true;
    return false;
  }

  function translateTextNode(node) {
    var raw = node.nodeValue;
    if (!raw || !zhRe.test(raw)) return;
    var lead = raw.match(/^\s*/)[0];
    var tail = raw.match(/\s*$/)[0];
    var core = raw.slice(lead.length, raw.length - tail.length);
    if (!core) return;
    var out = translate(core);
    if (out === core) return;
    if (!textStore.has(node)) textStore.set(node, raw);
    node.nodeValue = lead + out + tail;
  }

  function translateAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var name = ATTRS[i];
      if (!el.hasAttribute(name)) continue;
      var val = el.getAttribute(name);
      if (!val || !zhRe.test(val)) continue;
      var out = translate(val);
      if (out === val) continue;
      if (!attrStore.has(el)) attrStore.set(el, {});
      var bag = attrStore.get(el);
      if (bag[name] === undefined) bag[name] = val;
      el.setAttribute(name, out);
    }
  }

  function walk(node) {
    if (node.nodeType === 3) { translateTextNode(node); return; }
    if (node.nodeType !== 1) return;
    if (shouldSkip(node)) return;
    translateAttrs(node);
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  /* ---------- head：文档标题与元信息（不在 body 内，walk 覆盖不到） ---------- */
  var headStore = null;   /* [[meta, 原文], …] */
  var titleSrc = null;    /* 中文原标题 */
  var titleOut = null;    /* 上一次我们自己写进去的英文标题 */

  function translateTitle(text) {
    var m = /^(FinModel Lab)\s·\s(.+)$/.exec(text);
    return m ? m[1] + ' · ' + translate(m[2]) : translate(text);
  }

  function snapshotHead() {
    if (headStore) return;
    headStore = [];
    var list = document.querySelectorAll('meta[name="description"],meta[name="twitter:description"],meta[property]');
    for (var i = 0; i < list.length; i++) {
      var c = list[i].getAttribute('content');
      if (c && zhRe.test(c)) headStore.push([list[i], c]);
    }
  }

  function applyTitle() {
    var cur = document.title;
    if (cur === titleOut) return;          /* 是我们自己写的，不再处理 */
    titleSrc = cur;
    var out = translateTitle(cur);
    if (out !== cur) { titleOut = out; document.title = out; }
  }

  function applyHead(toEn) {
    snapshotHead();
    if (toEn) applyTitle();
    else if (titleSrc !== null && document.title !== titleSrc) {
      document.title = titleSrc;
      titleOut = null;
    }
    for (var i = 0; i < headStore.length; i++) {
      headStore[i][0].setAttribute('content', toEn ? translate(headStore[i][1]) : headStore[i][1]);
    }
  }

  var headObserver = null;

  function startHeadObserver() {
    if (headObserver || !document.head) return;
    headObserver = new MutationObserver(function () {
      if (lang !== 'en') return;
      applyTitle();
    });
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
  }

  function stopHeadObserver() {
    if (headObserver) { headObserver.disconnect(); headObserver = null; }
  }

  function restoreAll() {
    textStore.forEach(function (raw, node) {
      if (node.isConnected) node.nodeValue = raw;
    });
    attrStore.forEach(function (bag, el) {
      if (!el.isConnected) return;
      for (var name in bag) el.setAttribute(name, bag[name]);
    });
    textStore.clear();
    attrStore.clear();
    cache.clear();
  }

  /* ---------- 观察动态内容 ---------- */
  var observer = null;

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (records) {
      if (lang !== 'en') return;
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'characterData') { translateTextNode(r.target); }
        else if (r.type === 'childList') {
          for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
        } else if (r.type === 'attributes' && r.attributeName) {
          translateAttrs(r.target);
        }
      }
    });
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  /* ---------- 语言设置 ---------- */
  function apply(next) {
    var desired = next === 'en' ? 'en' : 'zh';
    stopObserver();
    if (desired === 'en') {
      lang = 'en';
      restoreAll();
      walk(document.body);
      applyHead(true);
      startObserver();
      startHeadObserver();
    } else {
      stopHeadObserver();
      restoreAll();
      applyHead(false);
      lang = 'zh';
    }
    document.documentElement.lang = desired === 'en' ? 'en' : 'zh-CN';
    document.documentElement.setAttribute('data-lang', desired);
    try { localStorage.setItem(STORAGE_KEY, desired); } catch (e) {}
    syncButtons();
    document.dispatchEvent(new CustomEvent('finmodel:langchange', { detail: { lang: desired } }));
  }

  /* ---------- 切换键 ---------- */
  var switchEl = null;

  function syncButtons() {
    if (!switchEl) return;
    var btns = switchEl.querySelectorAll('button[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-lang') === lang;
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      btns[i].classList.toggle('is-active', on);
    }
  }

  function mountSwitch() {
    if (document.querySelector('.fml-lang')) return;

    switchEl = document.createElement('div');
    switchEl.className = 'fml-lang';
    switchEl.setAttribute('data-fml-skip', '');
    switchEl.setAttribute('role', 'group');
    switchEl.setAttribute('aria-label', 'Language');

    var zh = document.createElement('button');
    zh.type = 'button';
    zh.setAttribute('data-lang', 'zh');
    zh.textContent = '中文';

    var en = document.createElement('button');
    en.type = 'button';
    en.setAttribute('data-lang', 'en');
    en.textContent = 'EN';

    zh.addEventListener('click', function () { apply('zh'); });
    en.addEventListener('click', function () { apply('en'); });

    switchEl.appendChild(zh);
    switchEl.appendChild(en);
    document.body.appendChild(switchEl);
    syncButtons();
  }

  /* ---------- 启动 ---------- */
  function boot() {
    /* 合并扩展字典（i18n-exp.js 需在本文件之前加载） */
    if (window.FML_DICT_EXT) {
      for (var k in window.FML_DICT_EXT) {
        if (!(k in DICT)) DICT[k] = window.FML_DICT_EXT[k];
      }
    }
    if (window.FML_DICT_NUM) {
      for (var n in window.FML_DICT_NUM) {
        if (!(n in numDict)) numDict[n] = window.FML_DICT_NUM[n];
      }
    }
    for (var b in BUILTIN_NUM) {
      if (!(b in numDict)) numDict[b] = BUILTIN_NUM[b];
    }
    cache.clear();

    var saved = 'zh';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'zh'; } catch (e) {}
    lang = saved === 'en' ? 'en' : 'zh';
    mountSwitch();
    if (lang === 'en') { apply('en'); }
    else {
      document.documentElement.lang = 'zh-CN';
      document.documentElement.setAttribute('data-lang', 'zh');
      syncButtons();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FinModelI18n = {
    set: apply,
    get: function () { return lang; },
    t: translate,
    dict: DICT,
    patterns: PATTERNS
  };
})();
