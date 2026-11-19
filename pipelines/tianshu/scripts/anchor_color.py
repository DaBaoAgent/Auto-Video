# -*- coding: utf-8 -*-
"""tianshu · I2V 片段色彩锚定（逐帧）

Wan2.2 5B 在 5 秒里会亮度爬升、饱和衰减、暖调流失，剪进片子就跳色。
这里把每帧的均值/标准差向「已过审的 post 底图」拉 85%，只动整体色，
不碰构图和动态 —— 静帧镜头与动态镜头之间因此不会出现色跳。

注意：参照系是 post 底图，不是片段自己的首帧。模型常回一个偏冷偏绿的头帧，
拿它当参照等于把偏色锁死。
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

import tcfg


def frames_from(path: Path, tmp: Path) -> list[Path]:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(path),
                    str(tmp / "f_%04d.png")], check=True)
    return sorted(tmp.glob("f_*.png"))


def anchor(files: list[Path], out_dir: Path, strength: float,
           ref_img: Path | None = None) -> int:
    arrs = [np.asarray(Image.open(f).convert("RGB"), dtype=np.float32) for f in files]
    if ref_img and Path(ref_img).exists():
        h, w = arrs[0].shape[:2]
        ref = np.asarray(Image.open(ref_img).convert("RGB").resize((w, h), Image.LANCZOS),
                         dtype=np.float32)
        print(f"  参照底图：{ref_img}")
    else:
        ref = arrs[0]
    rm = ref.reshape(-1, 3).mean(axis=0)
    rs = ref.reshape(-1, 3).std(axis=0) + 1e-6

    for i, a in enumerate(arrs):
        m = a.reshape(-1, 3).mean(axis=0)
        s = a.reshape(-1, 3).std(axis=0) + 1e-6
        target_m = rm * strength + m * (1 - strength)
        target_s = rs * strength + s * (1 - strength)
        out = (a - m) * (target_s / s) + target_m
        Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(out_dir / f"a_{i:04d}.png")
    return len(arrs)


def encode(out_dir: Path, dst: Path, fps: int) -> None:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(fps),
                    "-i", str(out_dir / "a_%04d.png"),
                    "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", str(dst)], check=True)


def one(src: Path, dst: Path, strength: float, fps: int, ref: Path | None) -> bool:
    with tempfile.TemporaryDirectory() as t:
        t = Path(t)
        raw, out = t / "raw", t / "out"
        raw.mkdir(); out.mkdir()
        files = frames_from(src, raw)
        if not files:
            print(f"  抽帧失败：{src}")
            return False
        n = anchor(files, out, strength, ref)
        encode(out, dst, fps)
        print(f"  {src.name} -> {dst.name}  已锚定 {n} 帧")
        return True


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py anchor")
    ap.add_argument("name")
    ap.add_argument("--only", default="")
    ap.add_argument("--strength", type=float, default=None)
    ap.add_argument("--no-ref", action="store_true", help="退回用片段首帧当参照（不推荐）")
    a = ap.parse_args(argv)

    cfg = tcfg.cfg()
    strength = a.strength if a.strength is not None else cfg["i2v"].get("anchor_strength", 0.85)
    fps = int(cfg["canvas"]["fps"])
    pd = tcfg.project_dir(a.name)
    src_dir = pd / "i2v"
    out_dir = tcfg.pdir(a.name, "anchored")
    post_dir = pd / "post"

    if not src_dir.exists():
        print("没有 i2v 片段（先跑 i2v；纯静帧镜头可以跳过 anchor）")
        return 0

    clips = sorted(src_dir.glob("*.mp4"))
    if a.only:
        ids = {s.strip() for s in a.only.split(",") if s.strip()}
        clips = [c for c in clips if c.stem in ids]
    done = 0
    for c in clips:
        dst = out_dir / f"{c.stem}.mp4"
        if dst.exists():
            print(f"[{c.stem}] 已锚定，跳过")
            done += 1
            continue
        ref = None if a.no_ref else (post_dir / f"{c.stem}.png")
        if one(c, dst, strength, fps, ref):
            done += 1
    print(f"锚定完成 {done}/{len(clips)}  强度 {strength}")
    return 0
