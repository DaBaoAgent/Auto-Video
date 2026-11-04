#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""yuren30 深色底图生成器：程序化合成 1920x1080，低对比、可直接承托信息图层。
两种风格：A 深空星尘 / B 暗室档案纸纹。"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")


def vgrad(c0, c1, diag=0.0):
    """垂直线性渐变，diag 给一点对角偏移"""
    y = np.linspace(0, 1, H)[:, None]
    x = np.linspace(0, 1, W)[None, :]
    t = np.clip(y * (1 - diag) + x * diag, 0, 1)
    c0, c1 = np.array(c0, float), np.array(c1, float)
    img = c0[None, None, :] * (1 - t[..., None]) + c1[None, None, :] * t[..., None]
    return img


def radial_glow(cx, cy, r, color, strength):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - cx) / r) ** 2 + ((yy - cy) / r) ** 2)
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    g = np.zeros((H, W, 3), float)
    g += np.array(color, float)[None, None, :] * a[..., None]
    return g


def vignette(img, k=0.55, power=2.2):
    yy, xx = np.mgrid[0:H, 0:W]
    nx = (xx - W / 2) / (W / 2)
    ny = (yy - H / 2) / (H / 2)
    d = np.sqrt(nx ** 2 + ny ** 2) / math.sqrt(2)
    v = 1 - k * (d ** power)
    return img * v[..., None]


def grain(img, amp=3.0, seed=7):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, amp, (H, W, 1))
    return img + n


def dot_grid(img, step=26, alpha=0.05, color=(190, 210, 230)):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = tuple(color) + (int(255 * alpha),)
    for y in range(step, H, step):
        for x in range(step, W, step):
            d.ellipse((x - 1.1, y - 1.1, x + 1.1, y + 1.1), fill=c)
    return np.array(layer, float)


def add_rgba(img, layer, strength=1.0):
    """RGBA 图层按 alpha 加权后叠加（加法光）"""
    a = np.array(layer, float)
    return img + a[:, :, :3] * (a[:, :, 3:4] / 255.0) * strength


def finish(img, path):
    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img, "RGB").save(path, optimize=True)
    print(path, Image.open(path).size)


# ---------------- A · 深空星尘 ----------------
def bg_space():
    img = vgrad((9, 13, 21), (5, 7, 12), 0.18)
    img += radial_glow(1500, 300, 1000, (26, 44, 70), 0.75)
    img += radial_glow(420, 820, 820, (18, 38, 46), 0.55)

    rng = random.Random(11)
    stars = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(stars)
    for _ in range(820):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.choice([0.6, 0.7, 0.8, 0.9, 1.1, 1.4])
        a = int(rng.uniform(18, 120))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(214, 228, 245, a))
    img = add_rgba(img, stars.filter(ImageFilter.GaussianBlur(0.5)))

    # 少量亮星带柔光
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    for _ in range(16):
        x, y = rng.uniform(80, W - 80), rng.uniform(60, H - 60)
        r = rng.uniform(1.8, 3.2)
        dg.ellipse((x - r, y - r, x + r, y + r), fill=(230, 240, 255, 190))
    img = add_rgba(img, glow.filter(ImageFilter.GaussianBlur(3.2)), 1.6)

    # 极淡星云
    neb = Image.new("RGB", (W // 4, H // 4), (0, 0, 0))
    dn = ImageDraw.Draw(neb)
    for _ in range(40):
        x, y = rng.uniform(0, W // 4), rng.uniform(0, H // 4)
        r = rng.uniform(30, 110)
        dn.ellipse((x - r, y - r, x + r, y + r), fill=(16, 34, 52))
    neb = neb.filter(ImageFilter.GaussianBlur(38)).resize((W, H), Image.BILINEAR)
    img += np.array(neb, float) * 0.35

    img = vignette(img, 0.58, 2.0)
    img = add_rgba(img, Image.fromarray(dot_grid(img, 26, 0.045).astype(np.uint8), "RGBA"), 1.0)
    img = grain(img, 2.6, 3)
    finish(img, os.path.join(OUT, "bg_dark_space.png"))


# ---------------- B · 暗室档案 ----------------
def bg_archive():
    # 冷炭底 + 左上灯下暖调，靠近档案室/展柜的味道
    img = vgrad((22, 24, 28), (8, 9, 12), 0.34)
    img += radial_glow(560, 180, 1250, (52, 44, 34), 0.85)
    img += radial_glow(1520, 900, 900, (20, 28, 40), 0.55)

    # 纸纤维（粗糙度）
    rng = np.random.default_rng(23)
    fib = Image.fromarray((rng.normal(0, 1, (H, W)) * 255).clip(0, 255).astype(np.uint8))
    fib = fib.filter(ImageFilter.GaussianBlur(0.9))
    img += ((np.array(fib, float) - 128) * 0.22)[:, :, None]

    # 大尺度斑驳
    blot = Image.new("L", (W // 6, H // 6), 128)
    db = ImageDraw.Draw(blot)
    for _ in range(60):
        x, y = rng.uniform(0, W // 6), rng.uniform(0, H // 6)
        r = rng.uniform(10, 46)
        db.ellipse((x - r, y - r, x + r, y + r), fill=int(rng.uniform(96, 160)))
    blot = blot.filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
    img += ((np.array(blot, float) - 128) * 0.42)[:, :, None]

    # 划痕
    sc = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(sc)
    r = random.Random(5)
    for _ in range(34):
        x0, y0 = r.uniform(-120, W), r.uniform(-80, H)
        L = r.uniform(140, 700)
        ang = r.uniform(-0.38, 0.38)
        x1, y1 = x0 + L * math.cos(ang), y0 + L * math.sin(ang)
        d.line((x0, y0, x1, y1), fill=(198, 208, 222, r.randint(14, 34)), width=r.choice([1, 1, 2]))
    img = add_rgba(img, sc, 1.0)

    # 等高线（勘探 / 档案感）
    ct = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dc = ImageDraw.Draw(ct)
    cx, cy = 1290, 500
    for i in range(10):
        rr = 120 + i * 74
        pts = []
        for k in range(97):
            a = k / 96 * math.tau
            wob = 1 + 0.085 * math.sin(a * 3 + i * 0.7) + 0.045 * math.sin(a * 5 - i * 0.4)
            pts.append((cx + math.cos(a) * rr * wob * 1.62, cy + math.sin(a) * rr * wob * 0.74))
        dc.line(pts + [pts[0]], fill=(146, 168, 196, 34), width=1)
    img = add_rgba(img, ct, 1.0)

    img = vignette(img, 0.66, 1.8)
    img = add_rgba(img, Image.fromarray(dot_grid(img, 26, 0.03).astype(np.uint8), "RGBA"), 1.0)
    img = grain(img, 3.4, 9)
    finish(img, os.path.join(OUT, "bg_dark_archive.png"))


if __name__ == "__main__":
    bg_space()
    bg_archive()
