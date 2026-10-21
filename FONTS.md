# FinModel Lab v1.3 字体系统

本次字体均随静态页面自托管。没有以系统默认字体冒充指定字体；没有外部字体CDN依赖。

| 区域 | 字体与真实字重 | 普通模式 | 投屏模式 |
|---|---|---|---|
| fm文字标志 | Bricolage Grotesque，f 700 / m 400 | 32px，非斜体，收紧字距 | 同普通模式 |
| FinModel品牌 | Bricolage Grotesque 600 | 19px / 1.1，−0.035em | 同普通模式 |
| 英文标题/英文指标标签 | Bricolage Grotesque，可用400～700变量字重 | 面板16px、指标标签13px | 指标标签保持辅助层级 |
| 实验主标题（混排） | Bricolage拉丁字形 + Glow Sans SC 中文600 | 20px | 20px |
| 中文正文、导航、按钮、解释 | Glow Sans SC Normal Regular400 / Medium600 | 正文14px、导航14px、解释标题15px、按钮14px | 解释17px、参数17px |
| R代码 | Monaspace Argon Regular400；中文注释用Glow400 | 15px / 1.75 | 19px / 1.7；手机投屏18px |
| 行号 | Monaspace Neon400 | 11px | 11px辅助层级 |
| 主要金融指标 | Monaspace Neon500 | 30px / 1.1 | 36px |
| 参数与权重数字 | Monaspace Neon400 | 16px，选中关键权重18px | 18px |
| 数学核心公式 | KaTeX_Main / KaTeX_Math及需要的KaTeX字体 | 18px；分步计算16px | 核心及分步22px |
| 风险贡献行内式 | KaTeX数学字体 | 15px | 18px辅助标签 |
| 数学步骤的数值结果 | Monaspace Neon400/500 | 14px | 17px |
| SVG坐标刻度 | Monaspace Neon400 | 实际屏幕12.5px | 实际屏幕16px |
| SVG资产A/B标签 | Monaspace Neon400 | 实际屏幕13px | 实际屏幕16px |
| SVG轴名、当前组合标签 | Glow Sans SC400 | 实际屏幕14px / 13px | 实际屏幕16px |
| Minimum Variance英文标签 | Bricolage Grotesque | 实际屏幕13px | 实际屏幕16px |
| 图例 | Glow Sans SC400 | 13px | 16px |
| 点详情数值 | Monaspace Neon400 | 15px | 保留数字字体 |

## 字体文件与字重

- Bricolage：官方变量字体，固定正常宽度100、光学尺寸24，仅保留400～700字重轴；拉丁子集WOFF2为52,752字节。
- Glow Sans SC：只获取Normal Regular和Normal Medium两个OTF。字体元数据的真实字重是400、600，**Medium并不是500**；CSS按400/600映射，`font-synthesis:none` 禁止假粗体。
- Glow各字重拆成core/common两个WOFF2。core覆盖页面、动态教学语句、公式说明、参数和错误提示；common扩展覆盖GB2312常用汉字等，共7,123个码点。当前项目中文字符378个均由这两部分覆盖。common通过`unicode-range`按需加载，首屏没有请求它。
- Monaspace Argon400、Neon400和Neon500直接保留官方静态WOFF2字节。由于OFL保留字体名称，不对子集改造版本冒用Monaspace原名。
- KaTeX只部署WOFF2，不重复打包TTF或WOFF。数学主公式、贡献行内式、数值代入及展开的等价式均使用数学排版。
- 仅预加载Glow400核心、Argon400、Bricolage三个首屏关键文件；其余按需加载。所有字体使用swap策略。

## 统一Tokens与排版行为

`dist/typography.css`统一定义`--font-brand`、`--font-ui`、`--font-code`、`--font-number`及标题、正文、代码、指标、公式字号。

代码关闭`liga`、`calt`及默认连字，保持等宽字符与原始运算符；数字启用tabular-nums。权重和主指标预留与实际值长度相称的宽度，65.00%→66.00%→67.00%时标签、单位和周围内容位置相同。

SVG仍保持4:3和等比例缩放。使用容器真实缩放比例补偿字体的SVG设计单位，保证表中“实际屏幕字号”，而不是将标称13px进一步缩小到10px。标签框按实际字体文字宽度重新计算。

普通模式、1366窄桌面和手机的排版差异在`typography.css`末尾集中处理；代码字号不降到12px。长代码/长公式仅在各自容器内水平滚动。

## 来源与授权

- [Bricolage官方仓库](https://github.com/ateliertriay/bricolage)：OFL1.1。
- [Glow Sans官方仓库](https://github.com/welai/glow-sans)：字体为OFL1.1；仓库构建代码另为MIT，二者没有混淆。
- [Monaspace官方仓库](https://github.com/githubnext/monaspace)：OFL1.1，包含保留字体名称。
- [KaTeX官方字体说明](https://katex.org/docs/font)：引擎发行包v0.19.0；引擎MIT，原字体OFL版权与保留名称声明另行保留，字体二进制未修改。

对应许可证在`dist/assets/licenses/`。来源提交/版本在`dist/assets/font-sources.json`；文件体积、SHA256、原始文件SHA256、真实字重、处理方式在`dist/assets/fonts/manifest.json`。临时OTF、完整发行包和下载缓存均未打入交付包。

## 加载验证方式与边界

本次没有仅检查font-family名称。浏览器记录确认了字体资源请求和FontFaceSet的loaded状态；指定字体的实际字形像素指纹与回退字体不同；FontTools另验证了项目汉字覆盖、Neon等宽数字以及官方Monaspace文件未改动。数学渲染具有KaTeX HTML/MathML结构，无渲染错误。

当前界面、动态解释与常见汉字有字体覆盖；更罕见、超出子集的字符可显式回退Noto Sans CJK SC / PingFang SC / 系统sans-serif。回退只用于缺字应对，不是主要设计方案。没有进行每个平台、每个罕见汉字的穷举测试。

完整性能和回归结果见`CHANGES-v1.3.md`与`tests/v1.3/`。
