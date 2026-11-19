# -*- coding: utf-8 -*-
"""001_血之海滩 第一大段 四项验收。"""
import json, os, re, subprocess
import numpy as np

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4 = os.path.join(PROJ, "out", "001_血之海滩_第一大段_1080p.mp4")
FF = r"D:\@kaifa\tools\ffmpeg\bin\ffmpeg.exe"

def raw(args, w, h):
    p = subprocess.run([FF, "-v", "quiet"] + args + ["-pix_fmt", "gray", "-f", "rawvideo", "-"],
                       stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    a = np.frombuffer(p.stdout, np.uint8)
    n = len(a) // (w * h)
    return a[: n * w * h].reshape(n, h, w)

# 1) 像素密度：抽 12 帧全分辨率
data = raw(["-i", MP4, "-vf", "scale=1920:1080:flags=neighbor", "-frames:v", "12"], 1920, 1080)
h3, w3 = 1080 // 3, 1920 // 3
crop = data[:, : h3 * 3, : w3 * 3]
blocks = crop.reshape(len(crop), h3, 3, w3, 3).transpose(0, 1, 3, 2, 4).reshape(len(crop), h3, w3, 9)
mx = blocks.max(axis=3).astype(np.int16); mn = blocks.min(axis=3).astype(np.int16)
nonflat = float((mx - mn > 12).mean()) if mx.size else float("nan")
print(f"[1] 像素密度：{len(data)} 帧，非纯净 3×3 块占比 {nonflat*100:.3f}%（阈值 <1%）  →  {'PASS' if nonflat < 0.01 else 'FAIL'}")

# 2) 动效密度
fr = raw(["-i", MP4, "-vf", "scale=192:108:flags=area"], 192, 108).astype(np.int16)
d = np.abs(np.diff(fr, axis=0))
move = (d > 8).mean(axis=(1, 2))
fps, win = 30, 60
series = np.convolve(move, np.ones(win) / win, mode="valid")
worst = float(series.min()) if len(series) else 0.0
run = longest = 0
for m in move:
    run = run + 1 if m < 0.002 else 0
    longest = max(longest, run)
print(f"[2] 动效密度：{len(move)} 对帧差，最小 2s 窗口 {worst*100:.2f}%（>1%），最长静止 {longest/fps:.2f}s（<0.6s）  →  "
      f"{'PASS' if worst > 0.01 and longest / fps < 0.6 else 'FAIL'}")

# 3) 响度
p = subprocess.run([FF, "-hide_banner", "-i", MP4, "-af", "ebur128=peak=true", "-f", "null", "-"],
                   stderr=subprocess.PIPE, universal_newlines=True, errors="ignore")
mi = re.findall(r"I:\s*([-\d.]+)\s*LUFS", p.stderr)
mt = re.findall(r"Peak:\s*([-\d.]+)\s*dBFS", p.stderr)
I = float(mi[-1]) if mi else float("nan")
TP = float(mt[-1]) if mt else float("nan")
print(f"[3] 响度：I={I} LUFS（目标 -16±1），TP={TP} dBFS（≤-1.5）  →  {'PASS' if abs(I + 16) <= 1 and TP <= -1.5 else 'FAIL'}")

# 4) 字幕
cues = json.load(open(os.path.join(PROJ, "cues.json"), encoding="utf-8"))
dur = float(cues["duration"])
bad = [s for s in cues["subs"] if not (0 <= s["t0"] < dur and s["t1"] > s["t0"])]
print(f"[4] 字幕：{len(cues['subs'])} 条，越界 {len(bad)} 条，末条止于 {cues['subs'][-1]['t1']:.2f}s / 片长 {dur:.2f}s  →  "
      f"{'PASS' if not bad and cues['subs'][-1]['t1'] <= dur + 0.2 else 'FAIL'}")
