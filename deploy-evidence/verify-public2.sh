#!/usr/bin/env bash
# FinModel Lab 公网全量文件校验（修正版：先取 cookie，再逐文件比对 sha256）
set -u
set -f
BASE="https://finmodel-lab.app.workbuddy.host"
SC="PLWKCGJYNW"
PUB="/Users/emobcccz/.codex/.chatgpt-projects/g-p-69aed7ee2424819192fda2d3828aa78d/finmodel-lab-publish"
OUT=/tmp/finmodel-public
rm -rf "$OUT"; mkdir -p "$OUT"
C="curl --noproxy * --silent --show-error --max-time 60 --connect-timeout 10"

echo "=== 0) 通过分享链接取得访问 cookie ==="
$C -c "$OUT/jar.txt" -o /dev/null -w '  bootstrap HTTP %{http_code} %{time_total}s\n' "$BASE/?sharecode=$SC"
grep -c '__wb_rsc' "$OUT/jar.txt" | sed 's/^/  cookie __wb_rsc: /'

echo
echo "=== 1) 全部 $(find "$PUB" -type f | wc -l | tr -d ' ') 个文件：HTTP 状态 + sha256 逐文件比对 ==="
ok=0; bad=0; mism=0
: > "$OUT/files.tsv"
while IFS= read -r rel; do
  code=$($C -b "$OUT/jar.txt" -o "$OUT/dl.bin" -w '%{http_code}' "$BASE/$rel")
  if [ "$code" != "200" ]; then bad=$((bad+1)); printf '  [FAIL %s] %s\n' "$code" "$rel"; continue; fi
  l=$(shasum -a 256 "$PUB/$rel" | awk '{print $1}')
  r=$(shasum -a 256 "$OUT/dl.bin" | awk '{print $1}')
  if [ "$l" != "$r" ]; then mism=$((mism+1)); printf '  [MISMATCH] %s\n' "$rel"; else ok=$((ok+1)); fi
  printf '%s\t%s\t%s\n' "$rel" "$code" "$r" >> "$OUT/files.tsv"
done < <(cd "$PUB" && find . -type f | sed 's|^\./||' | sort)
echo "  → 200 且 sha256 与本地发布目录一致: $ok"
echo "  → HTTP 非 200: $bad"
echo "  → sha256 不一致: $mism"

echo
echo "=== 2) 内容类型抽查 ==="
for r in "index.html" "experiments.html" "style.css" "portfolio-bundle.js" "assets/fonts/glow-normal-400-core.woff2" "build-manifest.json" "experiments-config.js"; do
  printf '  %-46s ' "$r"
  $C -b "$OUT/jar.txt" -o /dev/null -w 'HTTP %{http_code}  %{content_type}\n' "$BASE/$r"
done

echo
echo "=== 3) 深链接（新标签直开）==="
for u in "index.html" "experiments.html" \
         "experiments.html?model=regression" "experiments.html?model=garch" \
         "experiments.html?model=var" "experiments.html?model=capm" \
         "experiments.html?model=bs" ; do
  printf '  %-42s ' "$u"
  $C -b "$OUT/jar.txt" -o /dev/null -w 'HTTP %{http_code}  %{size_download}B\n' "$BASE/$u"
done

echo
echo "=== 4) 无效 / 离线 model 参数 ==="
for u in "experiments.html?model=bogus" "experiments.html?model=portfolio" "experiments.html?model=experiment-1" "experiments.html?model=" "experiments.html?model=REGRESSION"; do
  printf '  %-42s ' "$u"
  $C -b "$OUT/jar.txt" -o /dev/null -w 'HTTP %{http_code}  %{size_download}B\n' "$BASE/$u"
done

echo
echo "=== 5) 构建指纹 ==="
$C -b "$OUT/jar.txt" "$BASE/index.html" -o "$OUT/index.html"
grep -o 'finmodel-build[^>]*' "$OUT/index.html" | head -1 | sed 's/^/  /'
grep -o '<title>[^<]*</title>' "$OUT/index.html" | sed 's/^/  /'
echo "  --- 线上 experiments-config.js 的 12 个实验 ---"
$C -b "$OUT/jar.txt" "$BASE/experiments-config.js" -o "$OUT/cfg.js"
python3 - "$OUT/cfg.js" <<'PY'
import re,sys
s=open(sys.argv[1],encoding='utf-8',errors='replace').read()
for m in re.finditer(r"\{[^{}]*?(?:id|modelId)\s*:\s*['\"]([^'\"]+)['\"][^{}]*?\}", s):
    blk=m.group(0)
    def g(k):
        mm=re.search(k+r"\s*:\s*['\"]([^'\"]*)['\"]", blk)
        return mm.group(1) if mm else ''
    print(f"    {g('id'):<14} online={str(g('online')):<6} model={g('modelId') or '-'}")
PY

echo
echo "=== 6) 外部依赖（绝对 URL）==="
ext=$(grep -ohE '(src|href)="https?://[^"]+"' "$OUT/index.html" | sort -u)
[ -z "$ext" ] && echo "  （首页无任何绝对 URL 外部资源引用）" || echo "$ext" | sed 's/^/  /'

echo
echo "=== 7) 首访（无 cookie）裸域名行为 ==="
$C -o /dev/null -w '  https://finmodel-lab.app.workbuddy.host/            → HTTP %{http_code}\n' "$BASE/"
$C -o /dev/null -w '  https://finmodel-lab.app.workbuddy.host/?sharecode=…  → HTTP %{http_code}\n' "$BASE/?sharecode=$SC"
