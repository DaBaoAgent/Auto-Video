#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""从 shouhui 012 的人物视频重建干净贴纸帧：
   mp4 抽帧取完整 RGB（matte 输出的透明区 RGB 已被抹黑，不可用）
   + frames_* 的 alpha（fill_holes 修复误删洞）
   → 高 720 缩放 → 6px 白描边 → assets/vidsmall/<seg>/"""
import os, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

VIDDIR = r"D:/@kaifa/Auto-Video/shouhui/projects/012_shangzhouwang/assets/vid"
FFMPEG = r"D:/GPT-SoVITS/tools/ffmpeg/ffmpeg.exe"
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "vidsmall")
TMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_tmp")
H = 720
OUTLINE = 6

PLAN = {
    "daji_show":  ("vid0_静立扇扇.mp4", "frames_vid0", 40),
    "king_stand": ("vidZ_威严站立.mp4", "frames_vidZ", 30),
    "king_axe":   ("vidW_挥钺.mp4",     "frames_vidW", 40),
    "king_punch": ("vidZ2_挥拳.mp4",    "frames_vidZ2", 30),
}

def extract(mp4, out_dir, want=200):
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(f for f in os.listdir(out_dir) if f.endswith(".png"))
    if len(files) < want:
        subprocess.run([FFMPEG, "-y", "-i", mp4, "-fps_mode", "passthrough", os.path.join(out_dir, "%04d.png")],
                       check=True, capture_output=True)
        files = sorted(f for f in os.listdir(out_dir) if f.endswith(".png"))
    return files

def fix_alpha(a: np.ndarray) -> np.ndarray:
    """frames_* 的 alpha：内部洞 fill_holes 兜底（RGB 来自 mp4，无需色距恢复）。"""
    m = a > 127
    hole = ndi.binary_fill_holes(m) & ~m
    a = a.copy()
    a[hole] = 255
    return a

def white_outline(rgb: np.ndarray, a: np.ndarray) -> Image.Image:
    h, w = a.shape
    P = OUTLINE + 4
    A = np.zeros((h + 2 * P, w + 2 * P), np.float32); A[P:P + h, P:P + w] = a / 255.0
    RGB = np.zeros((h + 2 * P, w + 2 * P, 3), np.float32); RGB[P:P + h, P:P + w] = rgb
    hard = A > 0.5
    dist = ndi.distance_transform_edt(~hard)
    ol = np.clip(OUTLINE + 0.75 - dist, 0, 1)
    out = np.dstack([RGB, np.maximum(ol, A) * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

for seg, (mp4, fdir, n) in PLAN.items():
    raw_dir = os.path.join(TMP, "raw_" + seg)
    raws = extract(os.path.join(VIDDIR, mp4), raw_dir)
    mats = sorted(os.listdir(os.path.join(VIDDIR, fdir)))
    assert len(raws) >= len(mats), f"{seg}: raw {len(raws)} < matte {len(mats)}"
    idx = np.linspace(0, len(mats) - 1, n).round().astype(int)
    out_dir = os.path.join(DST, seg)
    os.makedirs(out_dir, exist_ok=True)
    for i, k in enumerate(idx):
        raw = Image.open(os.path.join(raw_dir, raws[k])).convert("RGB")
        mat = Image.open(os.path.join(VIDDIR, fdir, mats[k])).convert("RGBA")
        if raw.size != mat.size:
            raw = raw.resize(mat.size)
        a = fix_alpha(np.array(mat)[:, :, 3])
        rgb = np.array(raw)
        sc = H / mat.height
        nw, nh = int(round(mat.width * sc)), H
        a_s = np.array(Image.fromarray(a).resize((nw, nh), Image.LANCZOS))
        rgb_s = np.array(Image.fromarray(rgb).resize((nw, nh), Image.LANCZOS))
        white_outline(rgb_s, a_s).save(os.path.join(out_dir, f"f{i:02d}.png"), optimize=True)
    print(seg, n, "frames rebuilt")
