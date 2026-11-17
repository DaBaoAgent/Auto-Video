# -*- coding: utf-8 -*-
"""captions.py · 一行式字幕烧录

读 timeline.json 的 clauses（按标点断开的短句，时间来自真实配音），
每条短句渲染成一张 1080×1920 透明 PNG，再用 ffmpeg overlay 烧进画面。

版式（定版，见 ../pipeline.json）：
- 一次只显示一行，不折行；放不下就缩字号
- 不显示标点
- 位于画面下方（默认 73% 高处，即 y≈1402）
- 2px 黑描边 + 0.15 透明度黑色的 2px 偏移阴影

用法：
    python captions.py --video 底片.mp4 --timeline timeline.json --out 成片.mp4
"""
from __future__ import annotations

import argparse
import json
import os
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "tools"))
from platform_paths import font_candidates  # noqa: E402
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

PUNCT = "，。、；：？！…—·「」『』（）()《》〈〉【】\"'“”‘’,.!?;:-~～"
DEFAULT_FONTS = font_candidates(["msyhbd.ttc", "msyh.ttc"])


def strip_punct(text):
    out = "".join(c for c in text if c not in PUNCT)
    return re.sub(r"\s+", "", out)


def resolve_font(explicit, mpt_dir):
    if explicit and os.path.isfile(explicit):
        return explicit
    if mpt_dir:
        p = os.path.join(mpt_dir, "resource", "fonts", "MicrosoftYaHeiBold.ttc")
        if os.path.isfile(p):
            return p
    for p in DEFAULT_FONTS:
        if os.path.isabs(p) and os.path.isfile(p):
            return p
    raise SystemExit("找不到字幕字体，用 --font 指定一个 .ttc/.ttf")


def render_line(draw, img, text, font_path, size, max_w, center_y, cfg):
    while size > cfg["min_size"]:
        font = ImageFont.truetype(font_path, size, index=0)
        bbox = font.getbbox(text)
        if bbox[2] - bbox[0] <= max_w:
            break
        size -= 2
    font = ImageFont.truetype(font_path, size, index=0)
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (img.width - tw) / 2 - bbox[0]
    y = center_y - th / 2 - bbox[1]

    if cfg["shadow_alpha"] > 0:
        a = int(255 * cfg["shadow_alpha"])
        draw.text((x + cfg["shadow_offset"], y + cfg["shadow_offset"]), text,
                  font=font, fill=(0, 0, 0, a))
    draw.text((x, y), text, font=font, fill=cfg["fill"], stroke_width=cfg["stroke"],
              stroke_fill=cfg["stroke_color"])
    return tw, size


def main():
    ap = argparse.ArgumentParser(description="一行式字幕烧录")
    ap.add_argument("--video", required=True)
    ap.add_argument("--timeline", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--font", default=None)
    ap.add_argument("--mpt", default=os.environ.get("SHIPAI_MPT", ""))
    ap.add_argument("--size", type=int, default=60)
    ap.add_argument("--min-size", type=int, default=44)
    ap.add_argument("--stroke", type=int, default=2)
    ap.add_argument("--stroke-color", default="#000000")
    ap.add_argument("--fill", default="#FFFFFF")
    ap.add_argument("--shadow-alpha", type=float, default=0.15)
    ap.add_argument("--shadow-offset", type=int, default=2)
    ap.add_argument("--y-ratio", type=float, default=0.73, help="字幕中心位置（画面高度比例）")
    ap.add_argument("--max-width", type=float, default=0.91, help="占画面宽度上限")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--keep-pngs", action="store_true")
    args = ap.parse_args()

    tl = json.load(open(args.timeline, encoding="utf-8"))
    clauses = tl["clauses"]
    if not clauses:
        raise SystemExit("timeline 里没有 clauses")

    font_path = resolve_font(args.font, args.mpt)
    png_dir = os.path.join(os.path.dirname(os.path.abspath(args.out)), "subs")
    os.makedirs(png_dir, exist_ok=True)

    cfg = {
        "min_size": args.min_size,
        "stroke": args.stroke,
        "stroke_color": args.stroke_color,
        "shadow_alpha": args.shadow_alpha,
        "shadow_offset": args.shadow_offset,
        "fill": args.fill,
    }
    center_y = int(args.height * args.y_ratio)

    pngs = []
    for i, c in enumerate(clauses, 1):
        text = strip_punct(c["text"])
        if not text:
            pngs.append(None)
            continue
        img = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        tw, size = render_line(draw, img, text, font_path, args.size,
                               args.width * args.max_width, center_y, cfg)
        p = os.path.join(png_dir, f"c{i:02d}.png")
        img.save(p)
        pngs.append(p)
        print(f"{i:02d} {c['start']:6.2f}-{c['end']:6.2f} {size}px w={int(tw):4d}  {text}")

    cmd = [shutil.which("ffmpeg") or "ffmpeg", "-y", "-i", args.video]
    valid = [p for p in pngs if p]
    for p in valid:
        cmd += ["-i", p]

    fc, prev, k = [], "0", 0
    for c, p in zip(clauses, pngs):
        if not p:
            continue
        k += 1
        label = f"s{k}"
        fc.append(f"[{prev}][{k}]overlay=enable='between(t,{c['start']:.3f},{c['end']:.3f})'[{label}]")
        prev = label
    fc.append(f"[{prev}]format=yuv420p[v]")
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "0:a?",
            "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf),
            "-c:a", "copy", "-movflags", "+faststart", args.out]

    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(r.stderr[-1500:], file=sys.stderr)
        raise SystemExit(1)
    print(f"[captions] 成片 → {args.out}")
    if not args.keep_pngs:
        shutil.rmtree(png_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
