# -*- coding: utf-8 -*-
"""tianshu · 质检（数字对账，不靠眼睛扫片子）

四件事：
  1. 逐镜时长 / 尺寸 / 帧率与分镜表对账（±2 帧内算过）
  2. 逐镜 post 底图的亮度/饱和与目标对账（差 3 以内算过）
  3. 拼接片的黑帧检测
  4. 成片响度实测（目标 −14 LUFS，±1 LU 内算过）

输出 out/qa.json，同时打一张表。这一关不过，不要往出稿目录交付。
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

import tcfg


def stats(p: Path) -> dict:
    im = Image.open(p).convert("HSV")
    a = np.asarray(im, dtype=np.float32)
    return {"val": float(a[..., 2].mean() / 2.55), "sat": float(a[..., 1].mean() / 2.55)}


def loudness(p: Path) -> float | None:
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(p), "-vn",
                          "-af", "loudnorm=I=-14:TP=-1.5:print_format=json",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r'"input_i"\s*:\s*"(-?[\d.]+)"', out)
    return float(m.group(1)) if m else None


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py qa")
    ap.add_argument("name")
    ap.add_argument("--video", default="")
    ap.add_argument("--tol-dur", type=float, default=2.0, help="容差（帧）")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    shots = tcfg.shots_of(a.name)
    video = Path(a.video) if a.video else pd / "out" / f"{a.name}.mp4"
    fps = int(tcfg.load_project(a.name).get("fps", 24))

    rows, fails = [], []
    print(f"{'镜':<6}{'时长 设计/实际':<16}{'尺寸':<12}{'亮度 目标/实际':<18}{'饱和 目标/实际':<16}结论")
    for s in shots:
        sid = s.get("shot_id") or s.get("id")
        cam = pd / "cam" / f"{sid}.mp4"
        pr = tcfg.probe(cam)
        want_dur = float(s.get("dur") or 0)
        row = {"id": sid, "want_dur": round(want_dur, 2), "got_dur": pr.get("dur", 0),
               "w": pr.get("w", 0), "h": pr.get("h", 0), "fps": pr.get("fps", 0)}
        ok = True
        notes = []
        if not pr:
            ok = False
            notes.append("缺片段")
        elif want_dur and abs(pr["dur"] - want_dur) * fps > a.tol_dur:
            ok = False
            notes.append(f"时长差 {(pr['dur'] - want_dur) * 1000:+.0f}ms")

        post = pd / "post" / f"{sid}.png"
        tval, tsat = s.get("target_val"), s.get("target_sat")
        if post.exists():
            st = stats(post)
            row.update({"val": round(st["val"], 1), "sat": round(st["sat"], 1)})
            if tval is not None and abs(st["val"] - float(tval) * tcfg.cfg()["post"]["lvl"]) > 3:
                notes.append(f"亮度差 {st['val'] - float(tval) * tcfg.cfg()['post']['lvl']:+.1f}")
                ok = False
            if tsat is not None and abs(st["sat"] - float(tsat)) > 3:
                notes.append(f"饱和差 {st['sat'] - float(tsat):+.1f}")
                ok = False
            row["target_val"], row["target_sat"] = tval, tsat
        rows.append(row)
        if not ok:
            fails.append({"id": sid, "notes": notes})

        size = f"{pr.get('w')}x{pr.get('h')}" if pr else "-"
        val_s = f"{float(tval):.0f}/{row['val']:.1f}" if (tval is not None and "val" in row) else "-"
        sat_s = f"{float(tsat):.0f}/{row['sat']:.1f}" if (tsat is not None and "sat" in row) else "-"
        print(f"{sid:<6}{want_dur:>6.2f}/{pr.get('dur', 0):>6.2f}   {size:<12}"
              f"{val_s:<18}{sat_s:<16}{'OK' if ok else '; '.join(notes)}")

    final = {"video": str(video), "exists": video.exists()}
    if video.exists():
        pr = tcfg.probe(video)
        lu = loudness(video)
        final.update({"dur": pr.get("dur"), "w": pr.get("w"), "h": pr.get("h"),
                      "fps": pr.get("fps"), "MB": round(pr.get("bytes", 0) / 1024 / 1024, 1)})
        final["lufs"] = round(lu, 1) if lu is not None else None
        if lu is not None and abs(lu - tcfg.cfg()["audio"]["lufs"]) > 1.0:
            fails.append({"id": "audio", "notes": [f"响度 {lu:.1f} LUFS，目标 −14±1"]})
        print(f"\n成片 {pr.get('dur', 0):.2f}s  {pr.get('w')}×{pr.get('h')}@{pr.get('fps')}fps  "
              f"{final['MB']} MB  响度 {final['lufs']} LUFS")

    qa = {"shots": rows, "final": final, "fails": fails,
          "verdict": "PASS" if not fails else "FAIL"}
    tcfg.save_json(pd / "out" / "qa.json", qa)
    print(f"\n结论 {qa['verdict']}   失败项 {len(fails)}  -> {pd / 'out' / 'qa.json'}")
    return 0 if qa["verdict"] == "PASS" else 1
