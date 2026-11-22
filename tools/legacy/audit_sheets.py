# -*- coding: utf-8 -*-
"""Contact sheets: all current posters + candidate comparisons."""
import json, os, math
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
OUT = os.path.join(ROOT, "review", "audit")
THUMB = os.path.join(OUT, "thumbs")
FONT = "C:/Windows/Fonts/arial.ttf"
font = ImageFont.truetype(FONT, 13)


def fit(path, w, h):
    im = Image.open(path).convert("RGB")
    r = im.width / im.height
    if r > w / h:
        nw, nh = w, int(w / r)
    else:
        nh, nw = h, int(h * r)
    im = im.resize((nw, nh), Image.LANCZOS)
    bg = Image.new("RGB", (w, h), (20, 20, 22))
    bg.paste(im, ((w - nw) // 2, (h - nh) // 2))
    return bg


def sheet(items, name, cols=6, w=300, h=170):
    rows = math.ceil(len(items) / cols)
    card_w, card_h = w, h + 20
    sh = Image.new("RGB", (cols * card_w, rows * card_h), (28, 28, 32))
    d = ImageDraw.Draw(sh)
    for i, it in enumerate(items):
        x, y = (i % cols) * card_w, (i // cols) * card_h
        p = os.path.join(SITE, (it.get("poster") or "").replace("/", os.sep))
        if os.path.exists(p):
            sh.paste(fit(p, w, h), (x, y))
        else:
            d.rectangle([x, y, x + w, y + h], fill=(60, 0, 0))
        d.text((x + 4, y + h + 3), it["key"], fill=(210, 210, 210), font=font)
    path = os.path.join(OUT, name)
    sh.save(path, quality=90)
    return path


def main():
    items = json.load(open(os.path.join(SITE, "assets", "samples.json"), encoding="utf-8"))["items"]
    items = [i for i in items if i.get("poster")]
    parts = [items[i::4] for i in range(4)]
    for i, p in enumerate(parts, 1):
        print(sheet(p, f"posters_all_{i}.jpg"))


if __name__ == "__main__":
    main()
