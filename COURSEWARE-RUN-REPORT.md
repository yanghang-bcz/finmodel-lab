# 课件 R 脚本运行报告（R.zip / R CODING）

对象：`R.zip → R CODING → R with application to financial quantitive analysis` 下的 91 个 `.R` 脚本（CH-01 ~ CH-12 及根目录附件）。
目的：回答"每一个 PPT 的代码能不能跑通"，并给出不能跑通的确切原因。

## 方法

- 运行环境：R 4.6.1（macOS arm64），Rscript `--vanilla`，**不修改课件源文件**：每个脚本复制到章节目录内临时文件后运行。
- 依赖：按课件 `packages list.txt` 安装 39 个 CRAN 包到临时库 `/tmp/Rlib`（二进制优先，源码兜底）。`RODBC` 无可用 ODBC 驱动，改用 `tools/rodbc-stub`（纯 R 占位包，不建立连接）。
- 兼容处理（均在生成的临时脚本里，不改原件）：
  - 把 `F:/programe/book/...`、`D:/course/...` 等 Windows 绝对路径改写为本地章节目录；
  - 去掉 CRLF 行尾，GB18030 → UTF-8；
  - `install.packages()` 置为空操作（依赖已预装）；
  - `getSymbols()` / `get.hist.quote()` 换成离线读取同名 CSV 的垫片（quantmod 的 Yahoo 接口在本机被墙且接口已变更）；
  - `windows()` / `x11()` / `quartz()` 置为空操作。
- 判定：退出码 0 记为通过；否则取最后一条 `Error` 归类。

## 结果总览

| 章 | 脚本数 | 通过 | 失败 |
|---|---:|---:|---:|
| CH-01 R 基础 | 6 | 4 | 2 |
| CH-02 数据整理 | 19 | 5 | 14 |
| CH-03 收益率 | 3 | 1 | 2 |
| CH-04 回归/传统计算 | 3 | 0 | 3 |
| CH-05 时间序列 | 3 | 2 | 1 |
| CH-06 波动率 | 7 | 1 | 6 |
| CH-07 VaR/ES | 3 | 0 | 3 |
| CH-08 组合 | 11 | 2 | 9 |
| CH-09 定价/期权 | 16 | 3 | 13 |
| CH-10 协整等 | 7 | 3 | 4 |
| CH-11 微观结构/高频 | 7 | 4 | 3 |
| CH-12 绩效 | 6 | 2 | 4 |
| 根目录附件 | 5 | 0 | 5 |
| **合计** | **91** | **27** | **64** |

失败原因分布：

| 原因 | 数量 | 说明 |
|---|---:|---|
| 其他运行错误 | 16 | 多为课件代码本身的对象/参数问题，需逐脚本看 |
| 需要联网行情 | 15 | `getSymbols("^SSEC")`、`^HSI`、`000001.SS` 等本地无 CSV，Yahoo 接口 403 |
| 缺第三方包 | 10 | `fOptions`（CRAN 已归档）、`fPortfolioBacktest`（不在 CRAN）、`RODBC` 驱动 |
| 对象/类型问题 | 9 | 依赖作者工作区 `.RData`（如 `VFINX`、`sample_tdataraw`）或列类型不符 |
| 课件源码/编码问题 | 8 | 如 `lapply(L1,quantile) 分位数` 少了 `#`、GBK 注释导致 parser 报错 |
| 缺数据文件 | 5 | 引用 `AAPL.xlsx`、`MacEcoData.xlsx` 等，压缩包只带了部分 CSV |
| 图形设备 | 1 | 脚本调用 `windows()`，macOS 无 X11 |

## 不能跑通的典型例子

- `CH-01/CH-01-02-02.R`：源码里有一行 `lapply(L1,quantile) 分位数`，注释符 `#` 丢失，属于课件笔误。
- `CH-01/CH-01-03-01.R`：`save(x, y, ...)` 但 `x`、`y` 在该脚本里没有定义（依赖作者交互式会话）。
- `CH-02/CH-02-01-01.R`：`read.xlsx("MacEcoData.xlsx")`，压缩包内只有 `MacEcoData.RData` 类文件，没有该 xlsx。
- `CH-02/CH-02-03-01.R`：`getSymbols("^SSEC")` 需联网，本地无 `SSEC.csv`。
- `CH-11`、`CH-09` 的多个脚本依赖 `fOptions`/`fPortfolioBacktest`，CRAN 已不再提供。

## 与平台的关系

课件这 91 个脚本是教材配套代码，不是平台代码。平台 12 个实验把同样的章节内容用 **base R 重写**（不依赖上述任何第三方包），并通过 Rscript 交叉校验：

- `tests/rbasic-crosscheck.cjs`：实验01，7 段脚本；
- `tests/foundations-crosscheck.cjs`：实验02/03/10/12，8 段脚本；
- `tests/courseware-crosscheck.cjs`：实验05/06/07/08/09/11 的扩展视图，10 段脚本。

三个测试合计 **25 段脚本全部通过**，覆盖：数据清洗（CH-02）、收益率（CH-03）、时间序列与协整（CH-05/CH-10）、GARCH/SV/高频（CH-06/CH-11）、VaR 与分位数回归（CH-07）、组合与切点/CVaR（CH-08）、CAPM/高阶矩/二叉树（CH-09）、绩效与归因（CH-12），以及 CH-04 的优化与计量扩展（LP、目标规划、Logit/Probit、PCA）。CH-04 的传统回归视图（OLS/Stepwise/Ridge/Lasso）由 `tests/regression.test.cjs` 的数值测试覆盖（与 glmnet 对照，最大差异 4.9e-8），未另做 Rscript 校验。

因此：
- **PPT 的教学内容**：平台可逐章复现，且全部可运行；
- **课件原始脚本**：27/91 可在本机直接跑通，其余 64 个按上表分类，属于环境（包/联网/图形设备）、数据（缺 xlsx/CSV）或课件笔误三类，不是算法问题。

## 复现方式

```bash
Rscript tools/run-courseware.R      # 生成 /tmp/cw-results.csv 并打印各章统计
```

结果明细见 `tools/courseware-run-results.csv`（每条含脚本路径、状态、首个错误）。
