#!/usr/bin/env bash
# xiangsu · 确定性音轨（chiptune + SFX + 配音 → 两遍 loudnorm）
# 用法: bash make_audio.sh [demo目录]       默认 demo 目录 = 本包 demo/
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DEMO="${1:-$HERE/demo}"
PY="${XIANGSU_PY:-${XIANGSU2_PY:-D:/@kaifa/openviking/.venv/Scripts/python.exe}}"
VOICE="${XIANGSU_VOICE:-${XIANGSU2_VOICE:-D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/配音.wav}}"

cd "$DEMO"
mkdir -p out
XIANGSU_VOICE="$VOICE" "$PY" audio.py

# 两遍 loudnorm：-16 LUFS / TP -1.5（先量，再线性校正）
ffmpeg -hide_banner -nostats -y -i out/mix_raw.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2> out/_loudnorm_pass1.json

measure() {
  "$PY" - out/_loudnorm_pass1.json "$1" <<'PYEOF'
import json, re, sys
txt = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', txt, re.S)
if not m:
    sys.exit('loudnorm 第一遍没有输出 JSON')
print(json.loads(m.group(0))[sys.argv[2]])
PYEOF
}
I="$(measure input_i)"; TP="$(measure input_tp)"; LRA="$(measure input_lra)"
TH="$(measure input_thresh)"; OFF="$(measure target_offset)"

ffmpeg -hide_banner -nostats -y -i out/mix_raw.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true:print_format=summary" \
  -ar 44100 -ac 2 out/audio.wav

echo "audio.wav written → $DEMO/out/audio.wav"
