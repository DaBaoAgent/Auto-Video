#!/usr/bin/env bash
# xiangsu · 一键构建 1920×1080 成片（像素密度 640×360）
#
#   bash build.sh            # 重做音轨 + 渲染 + 验收
#   bash build.sh --no-audio # 复用仓库 demo/out/audio.wav，只重渲画面
#
# 环境变量（都有默认值；XIANGSU2_* 为旧名，仍兼容）：
#   XIANGSU_REPO  渲染仓库（harness 所在，必须是 mg-styles-15 克隆）
#   XIANGSU_PROJ  项目目录（成片落盘位置）
#   MG_CHROME      Chrome 可执行文件
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="${XIANGSU_REPO:-${XIANGSU2_REPO:-D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15}}"
PROJ="${XIANGSU_PROJ:-${XIANGSU2_PROJ:-D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音}}"
CHROME="${MG_CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
DEMO="$REPO/demos/xiangsu-eden"
OUT="$PROJ/样片_前10秒_1920x1080.mp4"

mkdir -p "$DEMO/out" "$PROJ"
cp "$HERE/demo/index.html" "$HERE/demo/film.js" "$HERE/demo/sprites.js" \
   "$HERE/demo/cues.json" "$HERE/demo/audio.py" "$DEMO/"

if [ "${1:-}" != "--no-audio" ]; then
  bash "$HERE/make_audio.sh" "$DEMO"
fi
[ -f "$DEMO/out/audio.wav" ] || { echo "缺少 $DEMO/out/audio.wav，先跑 bash make_audio.sh"; exit 1; }

# film.js 的 window.DEMO 已是 1920×1080；这里仍显式传参，防止将来改动漂移。
(cd "$REPO" && MG_CHROME="$CHROME" node harness/render.mjs demos/xiangsu-eden \
  --w 1920 --h 1080 --fps 30 --duration 10 \
  --audio demos/xiangsu-eden/out/audio.wav --crf 14 --out "$OUT")

node "$HERE/verify.mjs" "$OUT"
