#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""给透明底 PNG 加回形针式白描边（参照上游 mg-styles-15 demos/19-paperclip/tools/stickers.py 的做法）"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

S = 1          # asset px per world px
OUT = 8        # 白描边宽（world px），上游 19 号为 10，人物大图取 8 视觉相当

def outline(src_path, out_path, world_long=None):
    im = Image.open(src_path).convert("RGBA")
    a = np.array(im)[:, :, 3].astype(np.float32) / 255.0
    if world_long:
        sc = world_long * S / max(im.size)
        nh, nw = int(round(im.height * sc)), int(round(im.width * sc))
        im = im.resize((nw, nh), Image.LANCZOS)
        a = np.array(im)[:, :, 3].astype(np.float32) / 255.0
    rgb = np.array(im)[:, :, :3]
    h, w = a.shape
    P = OUT + 6
    A = np.zeros((h + 2 * P, w + 2 * P), np.float32)
    A[P:P + h, P:P + w] = a
    RGB = np.full((h + 2 * P, w + 2 * P, 3), 255, np.float32)
    RGB[P:P + h, P:P + w] = rgb
    hard = A > 0.5
    dist = ndi.distance_transform_edt(~hard)
    ol = np.clip(OUT + 0.75 - dist, 0, 1)          # 抗锯齿白边
    out = np.dstack([RGB, np.maximum(ol, A) * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_path, optimize=True)
    print(f"{os.path.basename(out_path)}: {out.shape[1]}x{out.shape[0]}")

if __name__ == "__main__":
    outline(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else None)
