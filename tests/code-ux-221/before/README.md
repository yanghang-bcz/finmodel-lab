# 实验11第一轮：定价基础与连续股息

当前版本已实际实现并通过本轮测试；唯一项目路径、启动方式、修改文件、截图、真实通过/失败记录和未实现范围见 [本轮交付记录](EXPERIMENT11-ROUND1.md)。当前构建：`1.9.1-audit.1eea1f2b6fd71b97`。历史说明中的验收数字不作为本轮结果。

# FinModel Lab · 失败修复专项审计版

本次修复已在用户可见 Chrome 和真实服务验收。构建：`1.9.1-audit.829515775e3098be`。五模型与视觉设计保持现有内容，未修改金融计算。

根因：用户原标签页与历史文档仍在运行早期版本，出现07→08→11→06→09→01→04目录和悬停常驻；磁盘新版与新测试会话的通过没有覆盖原会话迁移。详见 [完整审计报告](AUDIT-20261019.md) 和 [前后截图／运行结果](tests/audit-1912/gallery.html)。

本轮新验收：2050项双缓存Chrome断言、355项既有交互检查、22项定向检查、9套数学／教学回归通过。Safari自动化未开启，本轮完整Safari矩阵未通过验收。历史报告数字不作为本轮结果。

## 当前唯一推荐启动

当前8765服务已在运行。今后从任意目录启动，使用固定项目绝对路径：

```sh
python3 "/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab/tools/serve.py"
```

打开 http://127.0.0.1:8765/experiments.html?model=garch 。身份核验：http://127.0.0.1:8765/__finmodel__/status 。启动会先构建；端口占用会明确报错，不会再开一个不同目录服务。JS/CSS采用内容哈希，页面与脚本禁用陈旧缓存；控制台及DOM有不可见版本标识。

修改源模块后可用 `node tools/build-workbench.cjs --check` 检测未构建产物。不要用旧ZIP替换当前dist；`FinModel-Lab.zip`及带1.2–1.9.1的包均为历史档案，本轮以当前dist和本审计报告为准。新的交付包为 `FinModel-Lab-audit-20261019.zip`。

## 实验08原有操作

- 右侧调参，代码、曲线、收益、方差和风险同步。“设为比较基准”后再编辑；“查看变化”展示完整快照；“结束比较”清空差异与图表比较基准。
- 点击“有效/非有效组合”查看数学证据。非有效时展示可行支配配置，主动应用后可撤销；不自动修改输入。
- 高收益等合法极端假设只提示，不改写；同一分析期口径。非法输入保留上次有效结果。
- 下拉选择相关系数或有效前沿探索。先预测再确认，前者只开放ρ，后者只开放权重，再查看解释。退出可恢复或保留参数。
- 点R行查看作用、公式、代入和金融含义。代码/解释局部滚动，分隔条可拖动/按键调整；复制的基础R可整体运行。
- “课堂工具”包含A/B/C示例、4道理解题和教师同意后主动本地导出的匿名反馈。加载示例明确重置参数/比较/探索。无自动上传、无行为跟踪、无登录。
- 刷新回默认且清空实验状态；不同标签页独立。

## v1.8保留资料

- CHANGES-v1.8.md：修改清单、完成/部分/未完成、数学报告与实际测试。
- CLASSROOM-GUIDE.md：教师演示与学生练习。
- EVALUATION-PLAN.md：平行前后测、答案、评分、真实反馈口径。
- DEPLOYMENT.md：部署方式及待补测项目。
- tests/v1.8/gallery.html：截图；checks.json：实际浏览器断言；unit-results.json：命令结果。
- FONTS.md：字体与许可。dist/是完整可部署静态文件。
- FinModel-Lab-v1.8.zip：原历史包保留；历史交付包为FinModel-Lab-v1.9.zip。

## 复核测试

新旧套件统一复核：`node tests/run-regression.cjs`。修改工作台/新实验源模块后需执行`node tools/build-workbench.cjs`，已交付静态文件无需构建。

```sh
node tests/math.test.cjs
node tests/learning.test.cjs
node tests/numerics.test.cjs
node tests/scale.test.cjs
node tests/r-code.test.cjs
node tests/typography.test.cjs
node tests/exploration.test.cjs
node tests/teaching.test.cjs
```

本轮9套回归全部实际通过。交互浏览器验收使用 `tests/interaction191.test.cjs`，既有教学/布局使用 `tests/ui-refinement.test.cjs`（需要Playwright和已安装Chrome）；`tests/presentation.test.cjs` 以Rscript执行基础/完整教学代码。测试结果按版本存档，历史报告中的数字不视为本轮新检查。

历史v1.9.1曾记录本地HTTP连接重置。本轮已完成直接HTTP资源哈希、响应头和真实Chrome测试，但没有重新验收并发负载、弱网、目标部署容量或跨设备课堂。尚无真实教师或学生试用及效果数据。本版是课堂试用候选，不宣称正式全班可用；未远程发布。

实验11第二轮已加入隐含波动率二分法与纯Newton可视化；启动、数学边界、实际测试及截图见 [EXPERIMENT11-ROUND2.md](EXPERIMENT11-ROUND2.md)。动态Delta对冲仍属第三轮。

实验11第三轮已加入 Delta 风险对冲：初始中性、股价变化预测、动态调仓与同路径三策略比较。自融资口径、真实R执行、完整测试、截图和教学预评见 [EXPERIMENT11-ROUND3.md](EXPERIMENT11-ROUND3.md)。本轮结束等待实验11教学验收，不继续开发实验08。

FinModel Lab v2.1 已将实验11默认入口重构为零基础分步学习，保留四模块完整实验。四步Delta对冲、渐进参数、本步/完整R代码、截图和实际回归见 [EXPERIMENT11-TEACHING-UX.md](EXPERIMENT11-TEACHING-UX.md)。真实学生“60秒理解”等教学效果仍待课堂验证。

### 实验11 v2.2：打开即实验

四模块默认自由探索，取消强制步骤与预测门槛；Delta实时目标持仓与初始未调仓持仓明确区分，动态模拟可直接进入。金融引擎和R核心未修改。实现、截图、真实R与浏览器验收见 [EXPERIMENT11-ZERO-FRICTION-UX.md](EXPERIMENT11-ZERO-FRICTION-UX.md)。
