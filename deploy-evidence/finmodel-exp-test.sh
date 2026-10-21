#!/usr/bin/env bash
# FinModel Lab 公网六实验验收：逐个打开深链接，检查渲染/错误/图表
export PATH="$HOME/.workbuddy/binaries/node/workspace/node_modules/.bin:$PATH"
BASE="https://finmodel-lab.app.workbuddy.host"
SC="PLWKCGJYNW"
OUT=/tmp/finmodel-exp
mkdir -p "$OUT"

declare -a MODELS=(regression garch var portfolio capm bs)
declare -a NAMES=("04-多元回归与逐步回归" "06-GARCH波动率" "07-VaR与ES" "08-均值方差组合" "09-CAPM" "11-BlackScholes期权")

for i in "${!MODELS[@]}"; do
  m="${MODELS[$i]}"; n="${NAMES[$i]}"
  url="$BASE/experiments.html?sharecode=$SC&model=$m"
  [ "$m" = "portfolio" ] && url="$BASE/index.html?sharecode=$SC"
  echo "############################################################"
  echo "### $n  (model=$m)"
  echo "### $url"
  echo "############################################################"
  agent-browser open "$url" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  sleep 2
  printf '  title  : '; agent-browser get title 2>&1
  printf '  h1     : '; agent-browser eval "document.querySelector('h1')?.textContent?.trim()||'(none)'" 2>&1
  printf '  url    : '; agent-browser get url 2>&1
  printf '  控制台错误: '; agent-browser errors 2>&1 | head -5 | tr '\n' '|'; echo
  printf '  console(非info): '; agent-browser console 2>&1 | grep -viE '^\[info\]' | head -5 | tr '\n' '|'; echo
  printf '  图表元素 : canvas=%s svg=%s table=%s\n' \
    "$(agent-browser eval "document.querySelectorAll('canvas').length" 2>&1)" \
    "$(agent-browser eval "document.querySelectorAll('svg').length" 2>&1)" \
    "$(agent-browser eval "document.querySelectorAll('table').length" 2>&1)"
  printf '  可见文本长度: %s\n' "$(agent-browser eval "document.body.innerText.length" 2>&1)"
  printf '  按钮数  : %s\n' "$(agent-browser eval "document.querySelectorAll('button').length" 2>&1)"
  printf '  KaTeX渲染: %s 个公式\n' "$(agent-browser eval "document.querySelectorAll('.katex').length" 2>&1)"
  printf '  样式生效( Computed bg of body ): %s\n' "$(agent-browser eval "getComputedStyle(document.body).backgroundColor" 2>&1)"
  agent-browser screenshot "$OUT/$m.png" >/dev/null 2>&1
  echo "  截图: $OUT/$m.png"
  echo
done
