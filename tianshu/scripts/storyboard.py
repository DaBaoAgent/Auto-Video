# -*- coding: utf-8 -*-
"""tianshu · 分镜联系表

一张图看完所有镜头的画面与时长，审片和自查都靠它。
每格标镜头号、时长、以及该镜第一句旁白 —— 看表就能发现「这一镜在讲什么但画面没接上」。
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import tcfg

FONTS = [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\simhei.ttf",
         r"C:\Windows\Fonts\simsun.ttc"]


def font(size: int) -> ImageFont.FreeTypeFont:
    for f in FONTS:
        if Path(f).exists():
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                continue
    return ImageFont.load_default()


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py sheet")
    ap.add_argument("name")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--thumb", default="480x360")
    ap.add_argument("--src", default="post", choices=["post", "plates", "cam"])
    ap.add_argument("--out", default="")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    shots = tcfg.shots_of(a.name)
    tw, th = (int(v) for v in a.thumb.lower().split("x"))
    pad, cap = 14, 58
    cols = max(1, a.cols)
    rows = math.ceil(len(shots) / cols)
    W = pad + cols * (tw + pad)
    H = pad + rows * (th + cap + pad)

    sheet = Image.new("RGB", (W, H), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    f_id, f_txt = font(26), font(18)

    for i, s in enumerate(shots):
        sid = s.get("shot_id") or s.get("id")
        p = pd / a.src / f"{sid}.{'png' if a.src != 'cam' else 'mp4'}"
        x = pad + (i % cols) * (tw + pad)
        y = pad + (i // cols) * (th + cap + pad)
        tile = None
        if p.exists() and p.suffix == ".mp4":
            import subprocess
            tmp = pd / "out" / "sheet_tmp.png"
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "0.3", "-i", str(p),
                            "-frames:v", "1", str(tmp)], capture_output=True)
            tile = Image.open(tmp) if tmp.exists() else None
        elif p.exists():
            tile = Image.open(p)
        if tile is not None:
            sheet.paste(tile.convert("RGB").resize((tw, th), Image.LANCZOS), (x, y))
        else:
            d.rectangle([x, y, x + tw, y + th], outline=(70, 70, 76))
            d.text((x + 12, y + th // 2 - 12), "缺图", fill=(120, 120, 126), font=f_txt)

        d.text((x + 4, y + th + 4), f"{sid}  {float(s.get('dur') or 0):.2f}s", fill=(235, 235, 235), font=f_id)
        line = (s.get("narration") or s.get("subject") or "")[:34]
        d.text((x + 4, y + th + 30), line, fill=(150, 150, 158), font=f_txt)

    out = Path(a.out) if a.out else pd / "out" / f"{a.name}_sheet.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)
    print(f"{len(shots)} 镜联系表 -> {out}  {W}x{H}")
    return 0
