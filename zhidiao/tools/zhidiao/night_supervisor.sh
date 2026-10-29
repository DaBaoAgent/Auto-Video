#!/bin/bash
# 通宵监管器：直到明早 10:00（默认）
# 职责（互斥调度，绝不并发跑两个 agnes 进程）：
#   1. 智谱赛道死了 -> 用剩余时长重启（每轮都查）
#   2. 有图没跑完   -> 跑 agnes images（--jobs 2）
#   3. 图齐了       -> 跑 agnes videos（自动续跑 pending、跳过 done）
# 单实例保护：logs/agnes/supervisor.lock
# 用法: bash night_supervisor.sh [截止时间 默认 "明天10:00"]
cd "$(dirname "$0")/../.." || exit 1
PY=vendor/gpt-sovits/.venv/Scripts/python.exe
DEADLINE_STR="${1:-明天10:00}"
DEADLINE_TS=$(date -d "$DEADLINE_STR" +%s 2>/dev/null)
[ -z "$DEADLINE_TS" ] && DEADLINE_TS=$(date -d "$(date -d tomorrow +%Y-%m-%d) 10:00" +%s)
LOG=logs/agnes/supervisor.log
LOCK=logs/agnes/supervisor.lock
mkdir -p logs/agnes logs/zhipu

# ---- 单实例保护 ----
if [ -f "$LOCK" ]; then
  OLD=$(cat "$LOCK" 2>/dev/null)
  if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
    echo "another supervisor ($OLD) is running, exit"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

log(){ echo "[$(date '+%m-%d %H:%M:%S')] $1" >> "$LOG"; }
alive(){ ps -ef 2>/dev/null | grep "$1" | grep -v grep >/dev/null 2>&1; }
stats(){ "$PY" tools/zhidiao/pending_stats.py 2>/dev/null | tr '\n' ' '; }

log "===== supervisor start (pid $$), deadline $(date -d @"$DEADLINE_TS" '+%m-%d %H:%M'), $(stats)"

while [ "$(date +%s)" -lt "$DEADLINE_TS" ]; do
  # 1) 智谱赛道续命（只读查重、独立产出，绝不写 assets.json）
  if ! alive "[z]hipu_video_lane\.py"; then
    H=$(( (DEADLINE_TS - $(date +%s)) / 3600 ))
    if [ "$H" -gt 0 ]; then
      log "relaunch zhipu lane with ${H}h"
      nohup "$PY" -u tools/zhidiao/zhipu_video_lane.py "$H" >> logs/zhipu/lane-supervisor.log 2>&1 &
    fi
  fi
  # 2) agnes images 在跑就等
  if alive "[a]gnes_shots\.py images"; then
    sleep 300; continue
  fi
  # 3) agnes videos 在跑就等
  if alive "[a]gnes_shots\.py videos"; then
    sleep 300; continue
  fi
  # 4) 两条 agnes 都没跑：图没齐先跑图
  MISSING=$("$PY" tools/zhidiao/pending_stats.py 2>/dev/null | grep IMG_MISSING | cut -d= -f2)
  if [ -n "$MISSING" ] && [ "$MISSING" != "0" ]; then
    log "images pending=$MISSING -> launch images --jobs 2"
    "$PY" -u tools/zhidiao/agnes_shots.py images --slug warring-states-20min --jobs 2 --max-wait 21600 >> logs/agnes/supervisor-images.log 2>&1
    log "images exited code $? ($(stats))"
    sleep 30
    continue
  fi
  # 5) 图齐，跑视频（resume：续 pending、跳过 done）
  VLEFT=$("$PY" tools/zhidiao/pending_stats.py 2>/dev/null | grep VID_LEFT | cut -d= -f2)
  if [ "$VLEFT" = "0" ]; then
    log "all videos done. $(stats)"
    break
  fi
  log "videos left=$VLEFT -> launch videos"
  "$PY" -u tools/zhidiao/agnes_shots.py videos --slug warring-states-20min --max-wait 28800 >> logs/agnes/supervisor-videos.log 2>&1
  log "videos exited code $? ($(stats))"
  sleep 30
done

log "===== supervisor end $(stats)"
