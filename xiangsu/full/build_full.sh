#!/usr/bin/env bash
# xiangsu full · 一键构建全片 1920×1080（像素密度 640×360）
#
#   bash build_full.sh              # 拼装 film.js + 重做音轨 + 渲染 + 验收
#   bash build_full.sh --no-audio   # 复用 full/out/audio.wav，只重渲画面
#   bash build_full.sh --no-render  # 只拼装 + 音轨 + 验收（复用已有视频）
#
# 新片必填（未设置直接报错，不会静默套用上一部片的参数）：
#   XIANGSU_PROJ   成片落盘的项目目录（旁白默认取该目录下 配音.wav）
#   XIANGSU_FILM   片名，用于输出文件名（例：波斯湾伊甸园）
#   XIANGSU_DUR    全片秒数，须与 cues.json 的 duration 一致（例：272.05）
#   XIANGSU_VOICE  旁白 wav（不设则用 $XIANGSU_PROJ/配音.wav）
#
# 可选：XIANGSU_REPO（渲染仓库，默认 020 曹操的 mg-styles-15 克隆）
#       MG_CHROME、XIANGSU_WORKERS（并行渲染进程数，默认 4）
# XIANGSU2_* 为改名前的旧名，仍兼容。
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="${XIANGSU_REPO:-${XIANGSU2_REPO:-D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15}}"
PROJ="${XIANGSU_PROJ:-${XIANGSU2_PROJ:-}}"
: "${PROJ:?未设置 XIANGSU_PROJ（新片成片落盘目录，例 D:/@kaifa/yandi/output/002_xxx）}"
: "${XIANGSU_FILM:?未设置 XIANGSU_FILM（片名，用于输出文件名，例 波斯湾伊甸园）}"
: "${XIANGSU_DUR:?未设置 XIANGSU_DUR（全片秒数，须与 cues.json duration 一致，例 272.05）}"
DUR="$XIANGSU_DUR"
export XIANGSU_VOICE="${XIANGSU_VOICE:-${XIANGSU2_VOICE:-$PROJ/配音.wav}}"
[ -f "$XIANGSU_VOICE" ] || { echo "旁白不存在：$XIANGSU_VOICE（用 XIANGSU_VOICE 指定）" >&2; exit 1; }
CHROME="${MG_CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
DEMO="$REPO/demos/xiangsu-eden-full"
OUT="$PROJ/全片_${XIANGSU_FILM}_${DUR%.*}秒_1920x1080.mp4"

mkdir -p "$DEMO/out" "$PROJ" "$HERE/out"

# 1) 拼装 film.js：demo/film.js 前半段 + full/parts/*.js
node "$HERE/assemble.mjs"

# 2) 音轨（chiptune + SFX + 配音 → 两遍 loudnorm）
if [ "${1:-}" != "--no-audio" ]; then
  bash "$HERE/make_audio.sh"
fi
[ -f "$HERE/out/audio.wav" ] || { echo "缺少 $HERE/out/audio.wav，先跑 bash make_audio.sh"; exit 1; }
cp "$HERE/out/audio.wav" "$DEMO/out/audio.wav"

# 3) 渲染：1920×1080 @30fps，CRF 14，界面与 10 s 样片同一管线
if [ "${1:-}" != "--no-render" ]; then
  (cd "$REPO" && MG_CHROME="$CHROME" node harness/render.mjs demos/xiangsu-eden-full \
    --w 1920 --h 1080 --fps 30 --duration "$DUR" --crf 14 --workers "${XIANGSU_WORKERS:-4}" \
    --out "$DEMO/out/video_full.mp4")
fi
[ -f "$DEMO/out/video_full.mp4" ] || { echo "缺少 $DEMO/out/video_full.mp4，先跑完整渲染"; exit 1; }
cp "$DEMO/out/video_full.mp4" "$OUT"

# 4) 验收
node "$HERE/verify_full.mjs" "$OUT" --duration "$DUR"
