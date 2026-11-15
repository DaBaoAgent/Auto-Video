# -*- coding: utf-8 -*-
"""tianshu · 配音合流 + 响度归一

响度做成闭环，不靠单次 loudnorm 蒙：
  1. 只在成片实际用到的那一段上量（拿整条配音的实测值去归一前 56 秒，会整体欠 2 LU；
     026 的 smoke 就是这么出过 −16.5）；
  2. loudnorm 走动态模式，把峰值压到 −2 dB（留 AAC 过冲余量）；
  3. 再叠一级固定增益把人声电平抬到 −14，用 alimiter 兜住峰值（单靠 loudnorm 的
     linear 模式压不动高波峰因子的口播，实测只到 −15.9）；
  4. 编完再量成片，差多少补多少，最多 3 轮 —— 达不到就打印实测值，让 qa 判不合格。
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import tcfg

LIMIT_TP = -2.0   # 归一阶段允许的峰值，留 AAC 过冲余量
MAX_ROUNDS = 3


def _loud_json(cmd: list[str]) -> dict:
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", out, re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def measure_input(audio: Path, dur: float) -> dict:
    cmd = ["ffmpeg", "-v", "info"]
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-i", str(audio), "-vn",
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
            "-f", "null", "-"]
    return _loud_json(cmd)


def measure_output(video: Path) -> dict:
    return _loud_json(["ffmpeg", "-v", "info", "-i", str(video), "-vn",
                       "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                       "-f", "null", "-"])


def build(video: Path, audio: Path, out: Path, cfg: dict, vdur: float,
          gain: float, offset: float) -> None:
    tp_lin = 10 ** (LIMIT_TP / 20)
    af = ",".join([
        f"loudnorm=I={cfg['lufs']}:TP={LIMIT_TP}:LRA=11",
        f"volume={gain:.2f}dB",
        f"alimiter=limit={tp_lin:.4f}:attack=1:release=50:level=false",
        f"volume={cfg['aac_trim_db']}dB",
    ])
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(video)]
    if offset:
        cmd += ["-itsoffset", f"{offset:.3f}"]
    cmd += ["-i", str(audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
            "-af", af, "-ar", str(cfg["sample_rate"]), "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", "-t", f"{vdur:.3f}", str(out)]
    subprocess.run(cmd, check=True)


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py mux")
    ap.add_argument("name")
    ap.add_argument("--video", default="")
    ap.add_argument("--audio", default="")
    ap.add_argument("--out", default="")
    ap.add_argument("--offset", type=float, default=0.0, help="音频整体延后 N 秒（负值提前）")
    ap.add_argument("--no-loudnorm", action="store_true")
    a = ap.parse_args(argv)

    cfg = tcfg.cfg()["audio"]
    pd = tcfg.project_dir(a.name)
    video = Path(a.video) if a.video else pd / "out" / f"{a.name}_video.mp4"
    audio = Path(a.audio) if a.audio else pd / "source" / "配音.wav"
    out = Path(a.out) if a.out else pd / "out" / f"{a.name}.mp4"

    for p, label in ((video, "拼接视频"), (audio, "配音")):
        if not p.exists():
            print(f"缺{label}：{p}")
            return 1

    vdur = tcfg.probe(video).get("dur", 0)
    target_i = float(cfg["lufs"])
    target_tp = float(cfg["true_peak"])

    if a.no_loudnorm:
        build(video, audio, out, cfg, vdur, 0.0, a.offset)
    else:
        meas = measure_input(audio, vdur)
        if not meas:
            print("  响度测量失败，退回单遍 loudnorm")
            build(video, audio, out, cfg, vdur, 0.0, a.offset)
        else:
            gain = max(0.0, min(9.0, target_i - float(meas["input_i"])))
            for rnd in range(1, MAX_ROUNDS + 1):
                build(video, audio, out, cfg, vdur, gain, a.offset)
                got = measure_output(out)
                if not got:
                    break
                got_i, got_tp = float(got["input_i"]), float(got["input_tp"])
                print(f"  响度第 {rnd} 轮：{got_i:.2f} LUFS / TP {got_tp:.2f}（增益 {gain:+.2f} dB）")
                if abs(got_i - target_i) <= 0.3 and got_tp <= target_tp:
                    break
                gain = max(0.0, min(10.0, gain + (target_i - got_i)))

    pr = tcfg.probe(out)
    print(f"成片 {out}  {pr.get('dur', 0):.2f}s  {pr.get('w')}×{pr.get('h')}@{pr.get('fps')}fps  "
          f"{pr.get('bytes', 0) / 1024 / 1024:.1f} MB")
    return 0
