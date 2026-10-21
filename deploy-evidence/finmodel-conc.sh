#!/usr/bin/env bash
# FinModel Lab 并发与稳定性测试：30 个独立会话并发加载首页 + 关键子资源
set -u
set -f            # 关键：禁止 glob 展开，否则 $C 里的 * 会被展开成文件名
BASE="https://finmodel-lab.app.workbuddy.host"
SC="PLWKCGJYNW"
N="${N:-30}"
OUT=/tmp/finmodel-conc
rm -rf "$OUT"; mkdir -p "$OUT"

C="curl --noproxy * --silent --max-time 60 --connect-timeout 10"

echo "=== 0) 获取访问 cookie（模拟首次通过分享链接进入）==="
$C -c "$OUT/jar.txt" -o /dev/null -w '  bootstrap HTTP %{http_code} in %{time_total}s\n' "$BASE/?sharecode=$SC"

echo
echo "=== 1) 冷启动单请求耗时（无缓存）==="
$C -H 'Cache-Control: no-cache' -o /dev/null -w '  index.html  : HTTP %{http_code}  %{size_download}B  %{time_total}s\n' "$BASE/index.html"
$C -H 'Cache-Control: no-cache' -o /dev/null -w '  bundle(407K): HTTP %{http_code}  %{size_download}B  %{time_total}s\n' "$BASE/portfolio-bundle.js"

echo
echo "=== 2) $N 个独立会话并发（各自独立 cookie jar，模拟 30 台学生机）==="
start=$(date +%s.%N)
for i in $(seq 1 "$N"); do
  (
    j="$OUT/jar-$i.txt"
    # 每个会话先通过分享链接拿到 cookie，再加载页面与全部关键资源
    $C -c "$j" -o /dev/null "$BASE/?sharecode=$SC" 2>/dev/null
    t0=$(date +%s.%N)
    code=$($C -b "$j" -o "$OUT/p-$i.html" -w '%{http_code}' "$BASE/index.html")
    t1=$(date +%s.%N)
    # 首页 + 5 个关键子资源
    ok=0; tot=0
    for r in "style.css" "portfolio-bundle.js" "build-info.js" "assets/fonts/glow-normal-400-core.woff2" "experiments.html?model=regression"; do
      tot=$((tot+1))
      c2=$($C -b "$j" -o /dev/null -w '%{http_code}' "$BASE/$r")
      [ "$c2" = "200" ] && ok=$((ok+1))
    done
    t2=$(date +%s.%N)
    echo "$i $code $ok/$tot $(echo "$t1-$t0"|bc) $(echo "$t2-$t0"|bc)" >> "$OUT/raw.txt"
  ) &
done
wait
end=$(date +%s.%N)
echo "  总墙钟时间: $(echo "$end-$start"|bc)s"

echo
echo "=== 3) 结果汇总 ==="
awk '{print $1, $2, $3, $4, $5}' "$OUT/raw.txt" | sort -n > "$OUT/sorted.txt"
total=$(wc -l < "$OUT/sorted.txt")
ok200=$(awk '$2==200' "$OUT/sorted.txt" | wc -l | tr -d ' ')
allsub=$(awk '$3=="6/6"' "$OUT/sorted.txt" | wc -l | tr -d ' ')
echo "  会话数            : $total"
echo "  首页 200          : $ok200 / $total"
echo "  6 资源全 200      : $allsub / $total"
echo "  首页加载耗时      : p50=$(awk '{print $4}' "$OUT/sorted.txt"|sort -n|awk -v n=$total 'NR==int(n/2){print $1"s") p95=$(awk '{print $4}' "$OUT/sorted.txt"|sort -n|awk -v n=$total 'NR==int(n*0.95){print $1"s") max=$(awk '{print $4}' "$OUT/sorted.txt"|sort -n|tail -1)s"
echo "  整会话耗时        : p50=$(awk '{print $5}' "$OUT/sorted.txt"|sort -n|awk -v n=$total 'NR==int(n/2){print $1"s") p95=$(awk '{print $5}' "$OUT/sorted.txt"|sort -n|awk -v n=$total 'NR==int(n*0.95){print $1"s") max=$(awk '{print $5}' "$OUT/sorted.txt"|sort -n|tail -1)s"
echo "  失败/非200明细    :"
awk '$2!=200 || $3!="6/6"' "$OUT/sorted.txt" | sed 's/^/    /' || true
echo "  （无输出即全部成功）"
echo
echo "=== 4) 并发期间是否触发限流（连续 429/503）==="
for i in $(seq 1 20); do
  $C -b "$OUT/jar.txt" -o /dev/null -w '%{http_code} ' "$BASE/index.html"
done; echo
