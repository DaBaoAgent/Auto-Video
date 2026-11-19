#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""文物照片 → 圆角白框卡片（参照上游 demos/19-paperclip/tools/stickers.py 的 card()）
S=2（2x 资产像素 / 世界像素），页面按世界像素显示。"""
import os
from PIL import Image, ImageDraw

S = 2          # asset px per world px
BORDER = 9     # 白框宽（world px）
RADIUS = 6     # 圆角（world px）

def card(src, out, world_long, crop_frac=(0.02, 0.02, 0.98, 0.96)):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    im = im.crop((int(w * crop_frac[0]), int(h * crop_frac[1]), int(w * crop_frac[2]), int(h * crop_frac[3])))
    w, h = im.size
    sc = world_long * S / max(w, h)
    im = im.resize((int(w * sc), int(h * sc)), Image.LANCZOS)
    b, r = BORDER * S, RADIUS * S
    W, H = im.width + 2 * b, im.height + 2 * b
    msk = Image.new("L", (W * 4, H * 4), 0)
    ImageDraw.Draw(msk).rounded_rectangle((0, 0, W * 4 - 1, H * 4 - 1), r * 4, fill=255)
    msk = msk.resize((W, H), Image.LANCZOS)
    base = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    base.paste(im, (b, b))
    base.putalpha(msk)
    base.save(out, optimize=True)
    print(out, base.size, "world:", W / S, H / S)

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    A = os.path.join(here, "..", "assets")
    card(os.path.join(A, "relic_ding_src.jpg"), os.path.join(A, "relic_ding.png"), 430, (0.03, 0.06, 0.97, 0.97))
    card(os.path.join(A, "relic_jue_src.jpg"), os.path.join(A, "relic_jue.png"), 380, (0.03, 0.06, 0.97, 0.97))
    card(os.path.join(A, "relic_oracle_src.jpg"), os.path.join(A, "relic_oracle.png"), 400, (0.04, 0.03, 0.96, 0.95))
