#!/usr/bin/env python3
# 宣传片品牌素材产生器:依 og.png 的视觉语汇(金框印章方块 + 字标 + URL),
# 产出「常驻品牌条」与「六印章尾卡」PNG,供 compose.sh 叠上/当尾卡。
# 需求:pillow。字型:Noto Sans TC(字标)+ Noto Serif CJK(印章)。
#
# 用法:python3 tools/trailer/brand.py            # 产出到 tools/trailer/brand-out/
#
# ── 每项目要换的旋钮 ──────────────────────────────
WORDMARK = "AI 战场编辑器"
KICKER   = "资料驱动 · 3D 历史战场引擎"
URL      = "yazelin.github.io/battlefield-editor"
SEALS    = ["赤", "官", "楚", "晋", "水", "邳"]   # 六场战役印章(各 package 的 seal)
BANNER_SEAL = "战"                                # 品牌条上的单一印章字
BADGE    = "线上可看　·　开源可编"
# 产出比例:(key, W, H, centered_banner)。social 版都置中。
ASPECTS  = [("h", 1280, 720, False), ("v", 1080, 1920, True), ("45", 1080, 1350, True)]
# ─────────────────────────────────────────────────

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "brand-out"); os.makedirs(OUT, exist_ok=True)
SERIF = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
BLACK = os.path.expanduser("~/.local/share/fonts/1NotoSansTC-Black.ttf")
BOLD  = os.path.expanduser("~/.local/share/fonts/NotoSansTC-Bold.ttf")
GOLD=(217,178,90); PAPER=(243,228,207); BG=(10,10,12); LINE=(90,80,60)

def F(p, s, i=0): return ImageFont.truetype(p, s, index=i)
def rrect(d, xy, r, **k): d.rounded_rectangle(xy, radius=r, **k)
def spaced(d, x, y, f, text, fill, ls):
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill); x += d.textlength(ch, font=f) + ls
    return x
def seal_chip(d, x, y, size, char, fsize):
    rrect(d, [x, y, x+size, y+size], 6, outline=GOLD, width=3)
    f = F(SERIF, fsize); bb = d.textbbox((0,0), char, font=f)
    w, h = bb[2]-bb[0], bb[3]-bb[1]
    d.text((x+(size-w)/2-bb[0], y+(size-h)/2-bb[1]), char, font=f, fill=GOLD)

def banner(W, H, centered):
    img = Image.new("RGBA", (W, H), (0,0,0,0)); d = ImageDraw.Draw(img)
    sH = 96 if centered else 68
    grad = Image.new("L", (1, sH))
    for yy in range(sH): grad.putpixel((0, yy), int(150*(1-yy/sH)))
    grad = grad.resize((W, sH)); sh = Image.new("RGBA", (W, sH), (0,0,0,255)); sh.putalpha(grad)
    img.alpha_composite(sh, (0, 0))
    if centered:
        seal, wf, sy = 44, F(BLACK, 34), 14
        ww = d.textlength(WORDMARK, font=wf); total = seal+12+ww; sx = int((W-total)/2)
        seal_chip(d, sx, sy, seal, BANNER_SEAL, 30)
        d.text((sx+seal+12, sy+2), WORDMARK, font=wf, fill=PAPER)
        uf = F(BOLD, 22); uw = sum(d.textlength(c, font=uf)+2 for c in URL)-2
        spaced(d, int((W-uw)/2), sy+seal+8, uf, URL, GOLD, 2)
    else:
        seal, wf, sx, sy = 40, F(BLACK, 26), 30, 14
        seal_chip(d, sx, sy, seal, BANNER_SEAL, 28)
        d.text((sx+seal+12, sy+3), WORDMARK, font=wf, fill=PAPER)
        uf = F(BOLD, 21); uw = sum(d.textlength(c, font=uf)+2 for c in URL)-2
        spaced(d, W-30-int(uw), sy+8, uf, URL, GOLD, 2)
    return img

def endcard(W, H):
    img = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(img); cx = W//2
    landscape = W > H
    chip, gap = (84 if landscape else 92), 18
    row_w = len(SEALS)*chip + (len(SEALS)-1)*gap
    x0 = int(cx-row_w/2); y_ch = int(H*0.30) if landscape else int(H*0.24)
    for i, ch in enumerate(SEALS): seal_chip(d, x0+i*(chip+gap), y_ch, chip, ch, int(chip*0.62))
    wf = F(BLACK, 72 if landscape else 88); ww = d.textlength(WORDMARK, font=wf)
    yw = y_ch+chip+(46 if landscape else 66); d.text((cx-ww/2, yw), WORDMARK, font=wf, fill=PAPER)
    kf = F(BOLD, 26 if landscape else 30); kw = sum(d.textlength(c, font=kf)+3 for c in KICKER)-3
    yk = yw+(96 if landscape else 118); spaced(d, int(cx-kw/2), yk, kf, KICKER, GOLD, 3)
    uf = F(BOLD, 34 if landscape else 38); uw = sum(d.textlength(c, font=uf)+2 for c in URL)-2
    yu = yk+(70 if landscape else 86); spaced(d, int(cx-uw/2), yu, uf, URL, PAPER, 2)
    bf = F(BOLD, 22 if landscape else 26); bw = d.textlength(BADGE, font=bf)
    yb = yu+(64 if landscape else 78)
    rrect(d, [cx-bw/2-16, yb-6, cx+bw/2+16, yb+bf.size+10], 4, outline=LINE, width=2)
    d.text((cx-bw/2, yb), BADGE, font=bf, fill=GOLD)
    return img

for key, W, H, centered in ASPECTS:
    banner(W, H, centered).save(f"{OUT}/banner_{key}.png")
    endcard(W, H).save(f"{OUT}/end_{key}.png")
    print(f"generated banner_{key}.png + end_{key}.png ({W}x{H})")
