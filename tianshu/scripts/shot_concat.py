# -*- coding: utf-8 -*-
"""tianshu · 拼接 + 时长对账 + 黑帧检测

按分镜顺序把 cam/ 里的片段拼起来。同一套 x264 参数出的片，流拷贝即可，不二次编码。
时长以实际文件为准逐镜对账：分镜表是设计值，帧数是落地的值，差在 ±1 帧内属正常。
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

import tcfg


def blackdetect(path: Path, min_dur: float = 0.08) -> list[tuple[float, float]]:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", str(path), "-vf",
         f"blackdetect=d={min_dur}:pic_th=0.98", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    return [(float(a), float(b)) for a, b in
            re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", out)]


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py concat")
    ap.add_argument("name")
    ap.add_argument("--out", default="")
    ap.add_argument("--from", dest="frm", type=int, default=0, help="从第几镜开始（1 起）")
    ap.add_argument("--to", type=int, default=0)
    ap.add_argument("--no-black-check", action="store_true")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    shots = tcfg.shots_of(a.name)
    if a.frm or a.to:
        shots = shots[(a.frm - 1 if a.frm else 0):(a.to or len(shots))]

    cam_dir = pd / "cam"
    items, expect, missing, drift = [], [], [], []
    for s in shots:
        sid = s.get("shot_id") or s.get("id")
        f = cam_dir / f"{sid}.mp4"
        if not f.exists():
            missing.append(sid)
            continue
        pr = tcfg.probe(f)
        if not pr:
            missing.append(sid)
            continue
        items.append(f)
        want = float(s.get("dur") or 0)
        expect.append(want)
        if want and abs(pr["dur"] - want) > 0.05:
            drift.append((sid, want, pr["dur"]))

    if not items:
        print("cam/ 里没有可用片段（先跑 cam）")
        return 1
    if missing:
        print(f"缺片段 {len(missing)} 镜：{missing[:12]}"
              + ("（可以先拼已有的，或补跑 cam --only）" if len(missing) < len(shots) else ""))

    out = Path(a.out) if a.out else pd / "out" / f"{a.name}_video.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        lst = Path(td) / "list.txt"
        lst.write_text("\n".join(f"file '{f.as_posix()}'" for f in items), encoding="utf-8")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
                        "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(out)], check=True)

    total = sum(tcfg.probe(f).get("dur", 0) for f in items)
    print(f"拼接 {len(items)} 镜 -> {out}")
    print(f"设计时长 {sum(expect):.2f}s   实际 {total:.2f}s   差 {total - sum(expect):+.2f}s")
    if drift:
        print("  逐镜偏差 >50ms：")
        for sid, want, got in drift:
            print(f"    {sid}  设计 {want:.2f}s  实际 {got:.2f}s  {got - want:+.2f}s")

    if not a.no_black_check:
        bl = blackdetect(out)
        if bl:
            print(f"  黑帧 {len(bl)} 段：")
            for s, e in bl[:10]:
                print(f"    {s:.2f}–{e:.2f}s")
        else:
            print("  黑帧：无")
    report = {"out": str(out), "shots": len(items), "dur": round(total, 3),
              "expect": round(sum(expect), 3), "missing": missing,
              "drift": [{"id": i, "expect": w, "got": g} for i, w, g in drift]}
    tcfg.save_json(pd / "out" / "concat_report.json", report)
    return 0 if not missing else 2
