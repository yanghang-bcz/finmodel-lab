# FinModel Lab 公网部署交付报告

> 高校《基于 R 语言的投资与实验》课程教学平台
> 部署日期：2026-10-21 ｜ 构建版本：`2.9.0-regression.a8a2cd0a020ac777`

---

## 0. 一句话结论

FinModel Lab 已作为**纯静态站点**部署到 WorkBuddy 公网域名，六个已上线实验（04 回归 / 06 GARCH / 07 VaR / 08 组合 / 09 CAPM / 11 BS）全部从真实公网地址逐项验证通过，116 个生产文件与本地构建产物**逐字节一致（sha256 全对）**。

**唯一需要向学生说明的限制**：平台为每个应用签发了一个分享码（sharecode），**首次必须从带 `?sharecode=` 的完整链接进入**。直接手输裸域名 `https://finmodel-lab.app.workbuddy.host/` 会看到「链接不完整」提示页。学生点过一次链接后，浏览器会留下 30 天有效期的访问凭证，之后裸域名和所有深链接都能直接打开。

---

## 1. 托管平台

| 项 | 值 |
|---|---|
| 平台 | WorkBuddy 应用发布（App Publishing / sites） |
| 部署形态 | `web-page`（纯静态托管，单端口 HTTP 服务反代） |
| 应用 ID | `wbapp_r9asGdJJHg3EFEFalQERMv` |
| 应用名称 | FinModel Lab |
| 沙箱 ID | `c3bb5f0b6dd447e4a51081d47bf02d1b` |
| 边缘 | CloudStudio Gateway + EdgeOne CDN（`eo-cache-status` 响应头） |
| 源站 | 腾讯云北京 CLB（CNAME `lb-286wnxnl-1ywcvlxohf2e347r.clb.bj-tencentclb.cloud.`，A `49.233.240.214`） |

**没有引入任何云函数、数据库、缓存或常驻服务。** 沙箱内只跑一个静态文件服务器，没有后端逻辑，没有模型 API 调用。

## 2. 真实域名与访问地址

| 用途 | 地址 |
|---|---|
| **学生入口（必须发这个）** | `https://finmodel-lab.app.workbuddy.host/?sharecode=PLWKCGJYNW` |
| 裸域名（**首访会 403**，见 §19） | `https://finmodel-lab.app.workbuddy.host/` |
| 实验04（多元回归） | `https://finmodel-lab.app.workbuddy.host/experiments.html?sharecode=PLWKCGJYNW&model=regression` |
| 实验06（GARCH） | `https://finmodel-lab.app.workbuddy.host/experiments.html?sharecode=PLWKCGJYNW&model=garch` |
| 实验07（VaR/ES） | `https://finmodel-lab.app.workbuddy.host/experiments.html?sharecode=PLWKCGJYNW&model=var` |
| 实验08（均值-方差组合，即首页） | `https://finmodel-lab.app.workbuddy.host/index.html?sharecode=PLWKCGJYNW` |
| 实验09（CAPM） | `https://finmodel-lab.app.workbuddy.host/experiments.html?sharecode=PLWKCGJYNW&model=capm` |
| 实验11（BS 期权） | `https://finmodel-lab.app.workbuddy.host/experiments.html?sharecode=PLWKCGJYNW&model=bs` |

**深链接的 sharecode 必须是第一个查询参数**（`?sharecode=…&model=…`）。写成 `?model=…&sharecode=…` 会被 403 拒绝——这是边缘网关的判定规则，与项目代码无关。

域名不是临时隧道，不是本地穿透，是平台正式签发的子域。**本报告中的所有数字均从该公网地址实测得到，未使用 `127.0.0.1`。**

## 3. 部署方式

```
本地源码项目（只读，未改动）
  /Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/
    └─ tools/build-workbench.cjs  ── 确定性构建 ──▶  dist/
                                                    │ cp -R
                                                    ▼
独立发布目录（与原开发目录同级，未污染源码）
  …/finmodel-lab-publish/   116 个文件
    └─ workbuddy_sites_deploy(directory=…, domainPrefix="finmodel-lab",
                              appName="FinModel Lab", language="static")
         └─▶ https://finmodel-lab.app.workbuddy.host/?sharecode=PLWKCGJYNW
```

- **源码项目零改动**：本次部署没有修改 `finmodel-lab/` 里的任何文件，只在其同级新建了 `finmodel-lab-publish/` 作为上传源。
- 上传的是 `dist/` 的成品（已构建产物），沙箱内**不需要执行构建**，因此不存在"沙箱里 Node 版本不同导致构建结果不同"的风险。
- 部署前做过构建新鲜度校验：`2.9.0-regression.a8a2cd0a020ac777 verified; changed: none`，即发布目录就是当时最新的构建产物。

## 4. 源码版本与构建指纹

| 项 | 值 |
|---|---|
| 构建 ID | `2.9.0-regression.a8a2cd0a020ac777` |
| 指纹载体 | `index.html` / `experiments.html` 的 `<meta name="finmodel-build" content="…">` |
| 线上实测 | `finmodel-build" content="2.9.0-regression.a8a2cd0a020ac777"` ✅ 与本地一致 |
| 资产清单 | `build-manifest.json`（线上 200，`application/json`，6713 B） |
| 缓存击穿 | 所有 CSS/JS 带 `?v=<sha256 前 16 位>`，改内容即换 URL |

浏览器控制台实测输出：`[FinModel build] 2.9.0-regression.a8a2cd0a020ac777`，与线上 meta 标签互相印证。

## 5. 生产文件列表

发布目录共 **116 个文件**，磁盘占用 8.0 MB，内容合计 6,172,172 字节：

| 目录 | 文件数 | 内容 |
|---|---|---|
| 根目录 | 75 | `index.html`（实验08入口）、`experiments.html`、`experiments-config.js`、`experiments.css`、`app.js`、`portfolio-bundle.js`（407 KB）、`experiments-bundle.js`（709 KB）、`style.css`、`build-info.js`、`build-manifest.json`、`font-specimen.html` 等 |
| `vendor/` | 22 | KaTeX 本地副本（JS + 字体），**不是 CDN** |
| `assets/` | 17 | 本地 woff2 字体（glow / argon / bricolage / neon 等）+ `assets/licenses/` 许可证 |
| `data/` | 2 | 教学用静态数据 |

**116/116 个文件从公网逐一请求，全部 HTTP 200，且 sha256 与本地发布目录逐字节一致（0 个不一致，0 个非 200）。**

内容类型抽查全部正确：`text/html` / `text/css` / `text/javascript` / `font/woff2` / `application/json`。

## 6. CDN / 外部依赖检查

| 检查项 | 结果 |
|---|---|
| 首页 HTML 中绝对 URL 外部资源引用 | **0 处** |
| Google Fonts / jsDelivr / unpkg / GitHub Raw | **无任何引用** |
| 运行时发起的网络请求 | 仅 `fetch('build-manifest.json')`（同源相对路径） |
| 字体 | 全部本地 woff2，`assets/licenses/` 已带许可证 |
| KaTeX | 本地 `vendor/katex/`，非 CDN |
| 浏览器实测请求清单 | 全部为 `https://finmodel-lab.app.workbuddy.host/…` 同源请求，200 |
| 混合内容（HTTPS 页混 HTTP 资源） | 无 |

**结论：站点在中国大陆网络下不依赖任何境外 CDN 或字体服务。** 这是本次部署前专项治理的结果，不是偶然。

## 7. 中国大陆机房兼容性

| 检查项 | 结果 |
|---|---|
| DNS（AliDNS 223.5.5.5） | ✅ 解析到 `…bj-tencentclb.cloud.` / `49.233.240.214` |
| DNS（DNSPod 119.29.29.29，大陆公共 DNS） | ✅ 同一结果 |
| DNS（Google 8.8.8.8） | ✅ 同一结果 |
| 源站位置 | 腾讯云**北京** CLB，境内节点 |
| 边缘 CDN | EdgeOne（`eo-cache-status` 响应头），境内有节点 |
| 风险提醒 / 拦截页 | **0 次命中**（关键词扫描：风险提醒/域名过期/已被拦截/blocked/intercept） |
| 建连耗时（本机直连） | 0.037–0.095 s |
| TTFB（本机直连） | 0.508–0.592 s |
| HTTPS 证书 | DigiCert 签发的 `*.workbuddy.host` 通配符证书，浏览器直开即信任 |
| 是否需要 VPN | 否 |
| 是否需要登录 | 否 |
| 是否需要安装 | 否 |

> ⚠️ 本机在中国大陆之外，无法从真实校园网出口复测。上表是"境内节点 + 境内 DNS + 无境外依赖 + 无拦截页"的结构性证据，**不是**从校园机房实测的结论。建议首次上课前用一台教室机器点一次链接确认。

## 8. HTTPS 状态

| 项 | 值 |
|---|---|
| 协议 | HTTP/2（`HTTP/2 200`） |
| 证书主体 | `/C=CN/ST=Guangdong Province/L=Shenzhen/O=Tencent Technology (Shenzhen) Company Limited/CN=*.workbuddy.host` |
| 签发者 | DigiCert Secure Site OV G2 TLS CN RSA4096 SHA256 2022 CA1 |
| 有效期 | 2026-09-10 → **2027-03-27** |
| 覆盖 | 通配符 `*.workbuddy.host`，含 `finmodel-lab.app.workbuddy.host` |
| HSTS 头 | 未设置（平台未下发 `Strict-Transport-Security`） |
| 访问凭证 cookie | `__wb_rsc`，`HttpOnly; Secure; SameSite=None; Max-Age=2592000`（30 天） |

## 9. 六个上线实验的公网测试

全部从 `https://finmodel-lab.app.workbuddy.host/` 打开，非本地地址。

| # | 实验 | 深链接 | 标题实测 | 控制台错误 | 页面错误 | 图表( SVG ) | 公式(KaTeX) | 样式 |
|---|---|---|---|---|---|---|---|---|
| 04 | 多元回归与逐步回归 | `?model=regression` | 实验04 · 多元回归与逐步回归分析 | 0 | 0 | 1 | 1 | ✅ |
| 06 | GARCH 类波动率模型 | `?model=garch` | 实验06 · GARCH类波动率模型 | 0 | 0 | 1 | 1 | ✅ |
| 07 | VaR 与 ES 投资风险计算 | `?model=var` | 实验07 · VaR与ES投资风险计算 | 0 | 0 | 1 | 1 | ✅ |
| 08 | 均值-方差投资组合决策分析 | `index.html` | 实验08 · 均值-方差投资组合决策分析 | 0 | 0 | 2 | 2 | ✅ |
| 09 | 资本资产定价模型的 R 语言实验 | `?model=capm` | 实验09 · 资本资产定价模型的R语言实验 | 0 | 0 | 1 | 0 | ✅ |
| 11 | Black-Scholes 期权定价 | `?model=bs` | 实验11 · Black-Scholes期权定价 | 0 | 0 | 2 | 2 | ✅ |

实验目录（首页「实验目录」抽屉）实测为 **12 个实验按 01–12 数字序排列**，其中 6 个可进入（04/06/07/08/09/11），另 6 个按钮置灰并标注「暂未上线」（01/02/03/05/10/12）。线上 `experiments-config.js` 的 `online: !!modelId` 逻辑与之一致。

**其他路由测试**

| 场景 | 结果 |
|---|---|
| 首页 `/`、`/index.html` | 200 |
| `/experiments.html`（无参数） | 200，回落到默认实验（07 VaR） |
| `?model=bogus` / `?model=portfolio` / `?model=experiment-1` / `?model=` / `?model=REGRESSION` | 全部 200，**无 404、无空白页、无 JS 崩溃** |
| 后退 / 前进 | URL 与页面状态完整保留 |
| 硬刷新（F5） | 正常重载，无错误 |
| 相对路径资源 | 全部 200，无拼错路径 |

## 10. 实验04 课堂功能专项测试（最详细的一项）

实验04是六个实验里功能最重的，逐项实测：

### 10.1 OLS 传统回归

| 检查项 | 实测值 |
|---|---|
| 回归结果（5 个特征系数 + 95% CI） | `market_lag1` 0.51344 CI [0.36547, 0.66142]；`industry_lag1` −0.39997 CI [−0.54910, −0.25084]；`vol_change_lag1` 0.20192 CI [0.08660, 0.31724]；`related_lag1` 0.0036034 CI [−0.08485, 0.09205]；`noise_lag1` 0.083154 CI [−0.03050, 0.19681] |
| 训练 R² | 0.27236 |
| 测试 RMSE | 0.8852% |
| 最大 VIF | 4.001 |
| 推断汇总 | 截距 0.0005243；调整 R² 0.2528；残差 SE 0.0081451；残差 df 186；F 13.924 / p 1.4697e−11 |
| 视图 | 系数与区间 / 实际与预测 / 残差诊断 / 正态 Q-Q |

### 10.2 特征相关性实时更新 ✅

拖动「合成特征相关程度」滑块，**所有指标实时重算**：

| ρ | 训练 R² | 调整 R² | F | p | 最大 VIF | 系数 CI 跨度 |
|---|---|---|---|---|---|---|
| 0.85 | 0.27236 | 0.2528 | 13.924 | 1.47e−11 | 4.001 | −0.694 … 0.807 |
| 0.20 | 0.5156 | 0.50258 | 39.596 | 1.37e−27 | 1.0715 | −0.548 … 0.630 |

（同时 `market_lag1` / `industry_lag1` 系数与内嵌 R 代码的数据向量都随之改变。）

### 10.3 Stepwise AIC

| 检查项 | 实测 |
|---|---|
| 方向选择 | 前向加入 / 后向剔除 / 双向（完整起点），三向均可切换 |
| AIC 过程图 | 「AIC 逐步选择 · 每次变化来自真实重估」，横轴为已采纳步骤，纵轴 extractAIC（越小越好） |
| 方向改变后过程不同 | 双向：步骤轴 −0.120…1.12；前向：−0.480…4.48（曲线确实重算） |
| 保留解释变量 | 4 |
| 最终 AIC* | −1843.3 |
| 最终变量集合 | `market_lag1`、`industry_lag1`、`vol_change_lag1`、`noise_lag1` |
| 测试 RMSE | 0.88547% |
| 诚实的局限说明 | 「贪心不保证全局最优…筛选后常规 p 值未校正选择偏差，剔除不代表无经济意义」 |

### 10.4 Ridge / Lasso

| 检查项 | 实测 |
|---|---|
| 模型切换 | Ridge L2 ⇄ Lasso L1（面板标题随之变为「Lasso L1 · 真实优化的系数路径」） |
| λ 调整 | 对数滑块 `log10(λ) ∈ [−6, 0]`，另有搜索上下限、收敛容差、迭代上限 |
| 视图 | 系数路径 / 验证误差 / 当前系数 |
| **活跃变量数（不含截距）** | 有独立读数 ✅ |
| **当前 λ 与验证最优 λ 的区分** | 面板明写：「手动 λ 为探索，不能称为最佳预测模型。**验证最优 λ 0.00015849**，合并 RMSE 0.84644%」✅ |
| 系数收缩为 0 | 系数路径图随 λ 连续变化，Lasso 路径呈现收缩 |
| 时间验证切分 | 「验证训练终点→验证区间：96→97–128；128→129–160；160→161–192」，三段滚动 |

### 10.5 四模型比较

| 模型 | 训练 RMSE | 测试 RMSE | 测试 MAE | 复杂度 |
|---|---|---|---|---|
| OLS | 0.80168% | 0.8852% | 0.68933% | 5 |
| Stepwise | 0.8017% | 0.88547% | 0.68899% | 4 |
| Ridge | 0.80263% | 0.88654% | 0.69212% | 5.8386 |
| Lasso | 0.80423% | 0.88951% | 0.69943% |

- **共同训练/测试划分 = 192 / 48**，四个模型用同一划分 ✅
- **有效模型 4 / 4**
- 复杂度口径有明确定义：OLS/Stepwise = 可估计斜率数；Ridge = 有效自由度（含截距）；Lasso = 活跃斜率数
- 局限说明：「这仅是当前样本划分的结果，不能推广为某模型普遍更优」

### 10.6 CSV 导入 ✅

上传了一份自造的 260 行 CSV（`date, close, volume, sentiment, rate`）：

| 步骤 | 结果 |
|---|--- |
| 文件选择 | `input[type=file]` 正常接收 |
| 列识别 | 出现 `regDate`（日期列）、`regTarget`（目标列）下拉 + `regFeature` 复选框组 |
| 口径选项 | `regKind`（简单收益/价格→收益/数值特征）、`regUnit`（小数/百分数）、`regTiming`（自动滞后/已对齐/同期解释）、`regMissing`（拒绝/删行并报告） |
| 确认导入 | 面板标题变为「**用户导入数据（来源未独立核实）**」 |
| 回归重算 | 训练 R² 0.072296；VIF 1.0132；截距 −214.43；调整 R² 0.058587；残差 SE 145.66；残差 df 203；F 5.2733 / p 0.0015992 |
| 控制台/页面错误 | 0 |

（测试 RMSE 显示为 16237% 是因为我把目标列设成了价格 `close` 本身而非收益率——在「数值特征（目标为收益）」口径下这是正确行为；课堂应选「全部列为价格→简单收益」。）

### 10.7 复制完整 R 代码 ✅

用挂钩 `navigator.clipboard.writeText` 的方式捕获了真实复制内容（浏览器安全策略禁止直接读剪贴板，故用注入探针捕获）：

| 指标 | 值 |
|---|---|
| 字符数 | 25,123 |
| 行数 | 1,643 |
| 换行符 | 纯 `\n`，**CR 数量 = 0**（不会丢换行、不会变成一行） |
| 制表符 | 0 |
| 空行 | 5（有意分段） |
| 最长行 | 275 字符 |
| 头部 | `# Experiment04 \| 用户导入数据（来源未独立核实）` + `# 原始260行；缺失整行删除0行；9处非连续日历间隔…` |
| 尾部 | 绘图代码 `…axis(2,at=keep,labels=feature_names);segments(…)` |

**导入 CSV 后复制的 R 代码会带上数据来源与缺失处理的真实说明，不是写死的脚本。**

## 11. 其他五个实验的回归验证

生产构建未改变任何金融计算行为——以下数字全部从公网实时读取：

### 实验06 GARCH

| 功能 | 实测 |
|---|---|
| ARCH 效应检验 | ARCH-LM 统计量 **2.1482**，p 值 **0.828825** |
| 参数 | 检验滞后阶数 5、显著性水平 0.05、合成样本量 160、第 41 期标准化冲击 4 |
| 视图 | 收益率 / 平方残差 / 波动率聚集 |
| 诚实说明 | 「先带常数均值模型残差，再回归平方残差…有效样本数 n−lag，LM<(n−lag)R²，卡方自由」 |

### 实验07 VaR / ES

| 功能 | 实测 |
|---|---|
| 历史模拟法 | VaR **15,988.89 元**，ES **27,577.78 元** |
| 正态参数法 | VaR **19,863.78 元**，ES **24,785.36 元** |
| 方法比较表 | 两法并列，另给「最坏 5% 尾部质量等效 12.500 个观测」 |
| EWMA | 下一期 VaR **16,654.31 元**，ES **21,075 元**；λ ∈ {0.90, 0.94, 0.98}；前 30 日初始化无预测 |
| GARCH(1,1) | 下一期 VaR **15,665.6 元**，ES **19,835.12 元**；ω=0.000002, a=0.08, b=0.9；明写「使用指定教学参数递推，并非对数据进行统计拟合」 |
| EVT（POT-GPD） | VaR **17,918.91 元**，ES **27,877.95 元**；阈值 10,572.22 元，250 个观测中 50 个超阈值（20%），拟合 ξ=0.334843、b=4,164.34 元 |
| Kupiec 回测 | 样本外超限 **2 / 100**，LR=2.428592，参考 p=0.1191；「没有足够证据拒绝目标超限比例；不等于模型被证明准确」 |
| 其他 | 导出当前收益 CSV、恢复合成教学数据 |

### 实验08 均值-方差组合

| 功能 | 实测 |
|---|---|
| 默认 | Expected Return **11.00%**，Portfolio Risk **13.54%**，权重 50/50 |
| 权重滑块实时更新 | 权重改 0.7 → Expected Return **13.96%**，Portfolio Risk **21.86%** |
| 双资产直觉 / 多资产组合 | 双模式可切换；多资产模式有有效前沿 + 当前组合/最小方差/资产 A 端点/资产 B 端点/比较基准/有效部分 |
| 图表 | SVG 可行集 + 有效部分，可点击组合点查看详情 |
| R 代码 | 与当前参数联动，逐行中文解析 |

### 实验09 CAPM

| 功能 | 实测 |
|---|---|
| 理论定价 | 理论必要收益率 **10.20%/年**，理论 Beta **1.200**，SML 图 |
| CML 与 SML | 组合预期收益率 **9.00%**，组合总风险 σ **18.00%**，CML 图；并说明 SML（系统性风险/Beta）与 CML（总风险/有效配置）的区别 |
| 实证检验 | 样本 Beta **1.1950**，样本 Alpha **0.10%/月**，样本 R² **94.15%**，SCL 拟合线，n=60、df=58 |
| 诚实说明 | 「Alpha 不显著，不代表 CAPM 已被证明成立。单资产时间序列回归不足以检验整个 CAPM」 |
| 其他 | 下载 CSV 模板、导出当前样本 CSV、恢复合成样本 |

### 实验11 Black-Scholes

| 功能 | 实测 |
|---|---|
| 定价基础 | Call **10.4506 元**，Put **5.5735 元**；股价-价格曲线 + 到期支付 |
| 红利与敏感性（Greeks） | q 与 σ 滑块实时改价；「提高 q 令 Call 非增、Put 非减；提高波动率通常提高两类欧式期权价格」 |
| 隐含波动率求解 | 二分法 / 牛顿法 / 算法比较；假设报价 10.4506 → 隐含波动率 **20.00%**，共 28 次迭代，价格误差 < 0.0001 元；当前区间与迭代估计实时显示 |
| Delta 风险对冲 | 期权 Delta **0.6368**，卖出期权 −0.6368，**净 Delta = 0.0000**；「Delta 中性不代表完全无风险」 |
| 其他 | 课堂挑战（预测→实验→解释）、模型假设与完整工作台 |

## 12. 并发与稳定性测试

**30 个独立会话并发**（每个会话独立 cookie jar，各自先通过分享链接取得凭证，再加载首页 + 5 个关键子资源，共 30 × 7 = 210 个请求同时进行）：

| 指标 | 结果 |
|---|---|
| 会话数 | 30 |
| 首页 HTTP 200 | **30 / 30** |
| 关键子资源全 200 | **30 / 30** |
| 首页加载耗时 | min 0.302 s / **p50 0.496 s** / p90 0.658 s / p95 0.660 s / max 0.678 s |
| 整会话耗时（含取凭证 + 6 资源串行） | min 3.664 s / **p50 4.210 s** / p90 4.565 s / max 4.802 s |
| 页面一致性 | 三个抽样会话的 `index.html` 均为 17,947 字节、sha256 相同 |
| 限流（429 / 503） | **0 次**；并发后再连续打 20 次全部 200 |

> 说明：curl 每请求新建连接，而真实浏览器复用同一条连接并行取资源，所以**学生机的实际首屏时间会明显好于上表的「整会话耗时」**。单请求直连 TTFB 为 0.51–0.59 s（见 §7）。

**结论：以 30 台学生机为目标规模的并发下，站点无失败、无限流、无降级，响应时间稳定。**

## 13. 浏览器测试环境

| 项 | 值 |
|---|---|
| 工具 | agent-browser（Chromium via CDP） |
| 测试的 URL | 全部为 `https://finmodel-lab.app.workbuddy.host/…` 公网地址 |
| 网络路径 | 本机系统代理（`127.0.0.1:7897`）出站；对照组用 `curl --noproxy '*'` 直连 |
| 检查项 | 标题 / h1 / 控制台错误 / 页面异常 / 网络请求状态码 / 计算样式 / SVG 与 KaTeX 数量 / 截图 |
| 截图 | `/tmp/finmodel-exp/{regression,garch,var,portfolio,capm,bs}.png` |

未在真实教室的低配 Windows 机器 + 旧版浏览器上实测。项目字体为本地 woff2、KaTeX 为本地副本，无需要 WebGL 的特性（图表全部是 SVG），对老旧浏览器友好。

## 14. 安全与隐私审查

| 检查项 | 结果 |
|---|---|
| `.env` / 密钥 / 令牌 | 发布目录中 **0 个** |
| `.git/` | 未上传（平台上传时排除 `node_modules` / `.git` / 构建输出） |
| 日志 / 备份 / `.DS_Store` | 发布目录中 **0 个** |
| 后端 / 数据库 / API 密钥 | 无——纯静态站点，没有服务端 |
| 用户数据收集 | 无。课堂工具的「试用反馈」明确写了「不记录鼠标行为，不自动上传或保存个人信息」，且导出的是本地 JSON |
| 第三方统计 / 埋点 / 广告 | **0 个**（外部依赖扫描见 §6） |
| 数据出境 | 无外部请求，无数据出境 |
| 教学数据性质 | 全部为**合成教学数据**，界面多处标注「非真实市场行情」「来源未独立核实」 |
| 敏感词 / 拦截 | 无 |

**这是一份可以放心发给全班学生的发布物。**

## 15. 与 Campus Pulse 的隔离

| 项 | 状态 |
|---|---|
| Campus Pulse 地址 | `https://campus-pulse.app.workbuddy.host/` |
| 是否被覆盖 | **否**。本次实测 Campus Pulse 仍返回 200 与原有内容（`<title>Campus Pulse · 校园脉冲</title>`） |
| 隔离机制 | 平台按 `directory` 决定应用归属，两个项目在不同目录 → 不同 app → 不同沙箱与链接 |
| 域名 | `finmodel-lab.app.workbuddy.host` 与 `campus-pulse.app.workbuddy.host` 相互独立 |
| 共享的底层 | 只有平台边缘网关，无共享数据 |

## 16. 后续更新流程

源码项目 `finmodel-lab/` **保持只读**，不要直接改它。更新走这条链：

```bash
# 1. 在开发项目里改代码 + 重新构建
cd /Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab
node tools/build-workbench.cjs            # 产出到 dist/

# 2. 同步到独立发布目录（先清空再拷，避免残留旧文件）
rsync -a --delete dist/ ../finmodel-lab-publish/

# 3. 让 WorkBuddy 重新部署（会对你说「线上现有内容会被覆盖」，确认后再执行）
#    部署后分享链接不变，学生手里的链接继续有效
```

**部署顺序注意**：纯静态站只有一层，不存在"先后端再前端"的问题；一次部署即整体替换。

每次更新后必须复测：`?health=1` 之类的探针对静态站不适用，改用「线上 `finmodel-build` meta 是否等于新构建 ID」+「抽查 3~5 个深链接 200」。

## 17. 回滚方法

平台本身不提供版本回滚按钮，回滚 = 用旧构建重新覆盖：

1. **重新构建旧版本**：若源码仓库有历史构建 ID，`node tools/build-workbench.cjs` 在相同源码下产出相同 ID（构建是确定性的，`buildId = '2.9.0-regression.' + sha(assets).slice(0,16)`）。
2. **保留上一版成品**：更新前先把 `finmodel-lab-publish/` 整目录复制一份成 `finmodel-lab-publish.bak-<日期>/`，出事时直接把备份内容同步回去再部署一次。
3. **最坏情况止血**：在 WorkBuddy「设置—数据管理—应用」里对 FinModel Lab 执行**下线**，链接立即停止服务（应用与数据保留），修复后再重新发布。

当前线上版本 = `2.9.0-regression.a8a2cd0a020ac777`，这就是回滚的目标指纹。

## 18. 平台限制与费用

| 项 | 说明 |
|---|---|
| 运行环境 | 单端口 HTTP 服务；**无数据库、无缓存、无消息队列** |
| 适用项目 | 静态站点 / Node / Python / Go 单端口应用；FinModel Lab 是静态站点，完全在能力范围内 |
| 不适用 | Java/Maven/Gradle；需要 MySQL/PostgreSQL/Redis/MongoDB/Kafka 的项目 |
| 常驻性 | 由平台托管，**不依赖你的 Mac 开机** |
| 分享码 | 平台为每个应用签发，见 §19 |
| 费用 | 本次部署由 WorkBuddy 应用发布能力完成，未产生额外云资源采购；具体配额与计费以 WorkBuddy 应用管理页显示为准 |
| 证书 | 平台统一管理，2027-03-27 到期，到期前由平台侧续期 |

## 19. 未完成事项 / 已知问题（重要）

### 19.1 裸域名首访 403「链接不完整」——**必须向学生说明**

- **现象**：全新浏览器（无 cookie）直接打开 `https://finmodel-lab.app.workbuddy.host/` 或任何不带 `?sharecode=` 的深链接，会看到平台下发的「链接不完整」提示页（HTTP 403）。
- **机制**：平台为应用签发 sharecode；带码访问时边缘网关下发 `__wb_rsc` cookie（HttpOnly、30 天）。之后的请求凭 cookie 放行。
- **已实测确认**：
  - 裸域名 + 无 cookie → 403（curl 与全新浏览器实例两种方式都复现）
  - `?sharecode=PLWKCGJYNW` → 200
  - 取到 cookie 后，`experiments.html?model=regression` 等裸深链接 → 200
  - cookie 满 30 天后过期，需重新走一次带码链接
- **影响面**：只要学生**第一次**是从你发的完整链接进来的，后续一切正常。风险只在于"学生手动敲裸域名"或"同学之间转发被截断的链接"。
- **缓解措施**：
  1. 课程页 / 微信群 / 二维码一律放**完整链接** `https://finmodel-lab.app.workbuddy.host/?sharecode=PLWKCGJYNW`
  2. 深链接写成 `?sharecode=PLWKCGJYNW&model=…`（sharecode 放第一个参数）
  3. 若发现平台应用管理页有「关闭分享码/公开访问」类开关，可尝试关闭；本次未找到该开关，部署工具也没有对应参数
- **无法自行消除的原因**：403 由边缘网关在返回任何 HTML/JS 之前判定，项目内部无法通过改代码绕过。

### 19.2 实验04 的两个读数在改 ρ 时不变（待项目作者确认）

- **现象**：拖动「合成特征相关程度」ρ 时，训练 R²、调整 R²、F、p、最大 VIF、相关系数、CI 跨度、内嵌 R 代码的数据向量都正确变化，但同一句汇总里的「截距」和「残差 SE」在两个 ρ 取值下读数完全相同（截距 0.0005243、残差 SE 0.0081451）。
- **数学上**：R² 变化意味着 RSS 变化，残差 SE = √(RSS/df) 理应随之变化。因此这两个读数要么是显示层未刷新，要么取自另一处。
- **影响**：不影响课堂主流程（学生看的是 R²/RMSE/系数），但讲课讲到「共线性如何影响标准误」时可能被学生抓住。
- **状态**：**未修改任何代码**（本次任务是部署，不是改算法）。建议转告项目作者复核。

### 19.3 未从真实校园网实测

本机在中国大陆之外，DNS/延迟/拦截页都是结构性证据（境内 CLB + 境内公共 DNS + 无境外依赖 + 无拦截页），**不是**从教室机器实测。建议开课前在一台教室电脑上点一次链接。

### 19.4 其他

- `http://`（非 HTTPS）访问是否会 301 跳转未专门验证；课程材料请一律写 `https://`。
- 平台未下发 HSTS 头。
- 未做 30 并发以上的压力测试；若一个班超过 30 人同时首次进入，建议先让 5~10 人试点。

## 20. 课堂注意事项

1. **只发完整链接**：`https://finmodel-lab.app.workbuddy.host/?sharecode=PLWKCGJYNW`。把它贴到课程页、学习通、微信群、课件首页，并生成二维码。**不要**只写 `finmodel-lab.app.workbuddy.host`。
2. **深链接格式**：`experiments.html?sharecode=PLWKCGJYNW&model=regression`（sharecode 必须在最前）。
3. **首次进入**：让学生进教室后第一件事就是点一次入口链接，把 30 天凭证拿到手，之后再怎么点都不受影响。
4. **30 人并发无压力**：实测 30 会话并发零失败；若班级更大，可分批进入。
5. **投屏模式**：每个实验右上角有「投屏模式」（隐藏侧栏、放大代码，Esc 退出）和「课堂工具」（教学示例 / 理解检验 / 试用反馈）。
6. **数据性质**：全部是合成教学数据。实验04 支持导入本地 CSV，面板会标注「用户导入数据（来源未独立核实）」；实验07/09 也能导出当前收益 CSV 和 CSV 模板。
7. **R 代码**：「复制完整 R 代码」生成的是**当前参数下**可运行的基础 R 脚本，粘进 RStudio 直接跑；剪贴板不可用时会自动下载 `.R` 文件。
8. **不要把学生成绩/个人信息写进反馈框**：课堂工具的反馈明确要求「仅写知识点，请勿填写姓名或学号」，且导出的是匿名 JSON、不上传。
9. **回滚准备**：每次更新发布目录前先备份一份（见 §17），指当前线上指纹是 `2.9.0-regression.a8a2cd0a020ac777`。
10. **证书 2027-03-27 到期**，临近时确认平台已续期。

---

## 附：本次实测命令索引

| 目的 | 命令 |
|---|---|
| 全量文件 + sha256 校验 | `bash /tmp/verify-public2.sh` |
| 30 并发 | `bash /tmp/finmodel-conc.sh` |
| 六实验快照 | `bash /tmp/finmodel-exp-test.sh` |
| DNS | `dig +short @223.5.5.5 finmodel-lab.app.workbuddy.host` |
| 证书 | `openssl s_client -connect finmodel-lab.app.workbuddy.host:443 -servername finmodel-lab.app.workbuddy.host` |
| 首访行为 | `curl --noproxy '*' -o /dev/null -w '%{http_code}' 'https://finmodel-lab.app.workbuddy.host/'` |

> 所有 curl 均加 `--noproxy '*'` 与 `--connect-timeout`，避开本机系统代理并防止挂起。
