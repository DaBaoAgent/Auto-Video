#!/bin/bash
# 成片验收：规格 + 跨时间轴抽帧
set -e
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
V="${1:-$SCRIPT_DIR/out/1 炎帝/炎帝_全片.mp4}"
Q="$SCRIPT_DIR/qc"
mkdir -p "$Q"
echo "== 规格 =="
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,bit_rate,codec_name -show_entries format=duration,size -of default=nw=1 "$V"
echo "== 音频 =="
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of default=nw=1 "$V"
echo "== 抽帧 =="
for t in 2 20 40 62 78 96 120 142 158 175 195 215 232 248 258 275 292 310 325 340 356 370 382; do
  ffmpeg -y -v error -ss $t -i "$V" -frames:v 1 -q:v 3 "$Q/q$t.jpg"
done
ls "$Q" | wc -l
