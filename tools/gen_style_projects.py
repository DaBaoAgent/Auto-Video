"""把 77 条 lemo 登记管线改成「自研渲染」：写各自的 demo 项目与入口脚本。

生成物（每条管线）：
  projects/demo/index.html     画布壳 + 字体
  projects/demo/main.js        SPEC（形状坐标/色板/节拍，按 id 播种算出）+ 版式牌
  scripts/<id>.py              入口，转调 tools/av_style.py
  SKILL.md / README.md         重写成"自己画"的说法

形状坐标在生成时就定死（seed=id），不靠运行时随机；
因此同一 id 每次重生成都得到同一份画面。
"""

from __future__ import annotations

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 每条管线挑一族 + 一套色板。族决定画法，色板决定气质。
# family: hatch 刻印 / halftone 网点 / neon 霓虹 / screen 屏幕 / pixel 像素 /
#         iso 立体 / plan 图纸 / map 地图 / photo 摄影 / paper 纸艺 /
#         board 板写 / flat 平面 / cel 赛璐珞 / field 场
TABLE: dict[str, tuple[str, str]] = {
    # 10 实拍混剪
    "zimu": ("screen", "news"),
    "xinwen": ("photo", "mono"),
    "daoshu": ("flat", "chrome"),
    "jiaoxiang": ("photo", "night"),
    "diaocha": ("map", "crimson"),
    "mengtai": ("photo", "film"),
    "zhanshu": ("plan", "blueprint"),
    "baozhuang": ("flat", "news"),
    "dangan": ("photo", "amber"),
    # 02 手绘笔触
    "youhua": ("board", "oil"),
    "yibi": ("board", "ink"),
    "baiban": ("board", "whiteboard"),
    "heiban": ("board", "chalk"),
    "biji": ("board", "sketch"),
    "make": ("board", "marker"),
    # 03 传统工艺
    "jianzhi": ("paper", "crimson"),
    "boli": ("paper", "glass"),
    "jinbo": ("paper", "illum"),
    # 05 平面图形
    "kongban": ("halftone", "riso"),
    "wangdian": ("halftone", "mono"),
    "muke": ("hatch", "ink"),
    "tongban": ("hatch", "engrave"),
    "siyin": ("halftone", "chrome"),
    "guaban": ("hatch", "ochre"),
    "bopu": ("flat", "pop"),
    "fugu": ("flat", "collage"),
    "ruishi": ("flat", "swiss"),
    "jiandie": ("flat", "spy"),
    "xiangxing": ("flat", "graphic"),
    "baohao": ("flat", "bauhaus"),
    "wenzi": ("flat", "typeflash"),
    # 09 图纸说明
    "xinxi": ("plan", "light"),
    "chaijie": ("plan", "blueprint"),
    "poumian": ("plan", "cutaway"),
    "jixie": ("plan", "mechan"),
    "shuoming": ("plan", "light"),
    "bishi": ("plan", "plotter"),
    "liushui": ("plan", "blueprint"),
    "xianwei": ("plan", "micro"),
    "jianbao": ("plan", "brief"),
    "anjian": ("plan", "xray"),
    # 04 卡通动画
    "sailu": ("cel", "anime80"),
    "kehuan": ("cel", "scifi"),
    "wushi": ("cel", "midcentury"),
    "gaoxiao": ("cel", "comic"),
    "xiangsu2": ("pixel", "hd2d"),
    "weiyou": ("pixel", "micro"),
    "jiezou": ("cel", "gameshow"),
    # 06 屏幕赛博
    "zifu": ("screen", "crt"),
    "mopian": ("photo", "silent"),
    "houshi": ("screen", "backroom"),
    "zhike": ("photo", "scratch"),
    "puguang": ("photo", "double"),
    "fabu": ("flat", "keynote"),
    "luping": ("screen", "cast"),
    "zhuomian": ("screen", "desktop"),
    "biaoge": ("screen", "sheet"),
    "dianzhen": ("pixel", "dither1"),
    "dianlu": ("plan", "pcb"),
    "yinghuo": ("neon", "firefly"),
    "liuchang": ("neon", "flow"),
    "shibo": ("neon", "scope"),
    "nihong": ("neon", "neon"),
    "leida": ("photo", "doc"),
    # 07 三维推演
    "jimu": ("iso", "toy"),
    "liti": ("iso", "popup"),
    "yizhou": ("iso", "tilt"),
    "chanpin": ("iso", "glass"),
    "labi2": ("board", "crayon"),
    # 08 地图地理
    "weixing": ("map", "sat"),
    "cehui": ("map", "lidar"),
    "recheng": ("field", "thermal"),
    "shuju": ("map", "dataviz"),
    "baimo": ("iso", "white"),
    "shiwu": ("map", "physical"),
    "dietie": ("map", "transit"),
    "moni": ("field", "sim"),
}

# 色板：正文色 / 纸色 / 强调色。同族不同色板，一眼能分开。
PALETTES: dict[str, dict] = {
    "news":        dict(bg="#101215", ink="#f4f4f2", accent="#e8402b"),
    "mono":        dict(bg="#0b0b0b", ink="#e8e6e1", accent="#9a9a96", tone1="#1a1a1a", tone2="#8a8a86", tone3="#efefec"),
    "chrome":      dict(bg="#f2f3f5", ink="#111417", accent="#1f6ecb"),
    "night":       dict(bg="#06070c", ink="#dfe6f2", accent="#ff8f4d", tone1="#101826", tone2="#2c4260", tone3="#05070b"),
    "crimson":     dict(bg="#120a0a", ink="#f3ddd0", accent="#d4382f"),
    "film":        dict(bg="#080808", ink="#efe9dc", accent="#d8b25a", tone1="#20201c", tone2="#9a9484", tone3="#0c0c0a"),
    "amber":       dict(bg="#0a0806", ink="#f0e2c8", accent="#e0a54a", tone1="#241c12", tone2="#8d7452", tone3="#0a0806"),
    "blueprint":   dict(bg="#0c2033", ink="#d6e9ff", accent="#ffb36b", grid="#8fb6d8"),
    "light":       dict(bg="#f4f2ec", ink="#1b2a35", accent="#d8422f", paperMode=True),
    "oil":         dict(bg="#efe7d6", ink="#2a221c", accent="#b4552f"),
    "ink":         dict(bg="#f1ece0", ink="#141414", accent="#a32d22"),
    "whiteboard":  dict(bg="#fcfcf8", ink="#1f2a33", accent="#2f7fd1", gridBoard=True),
    "chalk":       dict(bg="#1c2420", ink="#f2f3ea", accent="#e6d06a", chalk=True),
    "sketch":      dict(bg="#fdfbf3", ink="#232323", accent="#37a06b", gridBoard=True),
    "marker":      dict(bg="#fbf9f2", ink="#1c2b3a", accent="#ff5a36"),
    "crayon":      dict(bg="#f7f0df", ink="#2b241d", accent="#e07a3c"),
    "riso":        dict(bg="#f3eee3", ink="#16264a", accent="#ef5b3f"),
    "engrave":     dict(bg="#efeade", ink="#14120f", accent="#5d5a52"),
    "ochre":       dict(bg="#f2e6cd", ink="#3a2413", accent="#b06a22"),
    "pop":         dict(bg="#ffd84d", ink="#111111", accent="#e2372c"),
    "collage":     dict(bg="#e9e2d2", ink="#1c1a17", accent="#c0492f"),
    "swiss":       dict(bg="#f4f2ed", ink="#141414", accent="#e2372c"),
    "spy":         dict(bg="#0d1014", ink="#e8e3d6", accent="#c8a35a"),
    "graphic":     dict(bg="#f2efe6", ink="#12304a", accent="#e07a2c"),
    "bauhaus":     dict(bg="#f2ece0", ink="#121212", accent="#2f6ecf"),
    "typeflash":   dict(bg="#0d0d0f", ink="#f5f2ea", accent="#ff3b6b"),
    "cutaway":     dict(bg="#f1efe8", ink="#22303c", accent="#c2563a", paperMode=True),
    "mechan":      dict(bg="#0e2436", ink="#d8ecff", accent="#9be8a0"),
    "plotter":     dict(bg="#f7f4ea", ink="#1b2a3a", accent="#2f6ecf", paperMode=True),
    "micro":       dict(bg="#0b1410", ink="#d9f4e4", accent="#61e0a0"),
    "brief":       dict(bg="#f3f0e6", ink="#17212b", accent="#1f6ecb", paperMode=True),
    "xray":        dict(bg="#050a10", ink="#bfe4ff", accent="#ff8a5c"),
    "pcb":         dict(bg="#08160f", ink="#9cf0b4", accent="#ffd166"),
    "anime80":     dict(bg="#1b2450", ink="#f6e9c9", accent="#f2603c"),
    "scifi":       dict(bg="#0b1226", ink="#d6ecff", accent="#4fe0d6"),
    "midcentury":  dict(bg="#1f6b63", ink="#f6efd8", accent="#e8804a"),
    "comic":       dict(bg="#f7f0dc", ink="#151515", accent="#d63b2f"),
    "gameshow":    dict(bg="#1a1030", ink="#fbe8a6", accent="#ff4f9a"),
    "hd2d":        dict(bg="#122039", ink="#dbe9ff", accent="#f2c14e"),
    "micro":       dict(bg="#101426", ink="#e6ecff", accent="#f2c14e"),
    "dither1":     dict(bg="#0c0c0c", ink="#e7e7e2", accent="#e7e7e2"),
    "firefly":     dict(bg="#05090a", ink="#d8fff6", accent="#8fffe0"),
    "flow":        dict(bg="#060812", ink="#dce8ff", accent="#7ab8ff"),
    "scope":       dict(bg="#04110b", ink="#c8ffe6", accent="#56ffa8"),
    "neon":        dict(bg="#07070c", ink="#ffe9f6", accent="#ff3ea5"),
    "doc":         dict(bg="#0a0a0a", ink="#e4ded2", accent="#c9a45c"),
    "toy":         dict(bg="#eae4d6", ink="#2a241c", accent="#e2574c"),
    "popup":       dict(bg="#f4eedf", ink="#332b22", accent="#c0562f"),
    "tilt":        dict(bg="#dfe6e2", ink="#22303a", accent="#3f8f76", blurTop=True),
    "glass":       dict(bg="#e8eef3", ink="#1e2a34", accent="#4aa3c8", blurTop=True),
    "white":       dict(bg="#f1f1ee", ink="#2a2a28", accent="#8a8a86"),
    "sat":         dict(bg="#061019", ink="#dceeff", accent="#31c8b6", graticule=True),
    "lidar":       dict(bg="#07120e", ink="#d7f7e4", accent="#8ef0b6"),
    "dataviz":     dict(bg="#0a0d14", ink="#e6ecf5", accent="#ffb84d", graticule=True),
    "physical":    dict(bg="#0d1216", ink="#e2e6e8", accent="#d98b4a"),
    "transit":     dict(bg="#12141a", ink="#eef1f5", accent="#ff8a5c", graticule=True),
    "thermal":     dict(bg="#050608", ink="#ffffff", accent="#ff5b2e"),
    "sim":         dict(bg="#050a12", ink="#d9ecff", accent="#5ad0ff"),
    "silent":      dict(bg="#100e0a", ink="#e6ddcb", accent="#c9a45c", tone1="#2a251c", tone2="#9c9180", tone3="#0e0c09"),
    "scratch":     dict(bg="#0d0b09", ink="#efe6d2", accent="#d9a441", tone1="#221d16", tone2="#a4967d", tone3="#0b0a08"),
    "double":      dict(bg="#07080c", ink="#e9e6dd", accent="#7fc9ff", tone1="#141b2a", tone2="#6f88a8", tone3="#040608"),
    "cast":        dict(bg="#0b1016", ink="#e9f2ff", accent="#5ad0ff"),
    "desktop":     dict(bg="#081221", ink="#dbeeff", accent="#4fa8ff"),
    "sheet":       dict(bg="#0d1116", ink="#e6ecf2", accent="#7ad2a0"),
    "backroom":    dict(bg="#0a0906", ink="#e8dfae", accent="#d9cf7a"),
    "crt":         dict(bg="#050a07", ink="#9cf5b4", accent="#9cf5b4"),
    "illum":       dict(bg="#1a1206", ink="#f5e3b4", accent="#e0a54a", backlight="#f8e7b6", gold=True),
    "glass":       dict(bg="#e8eef3", ink="#1e2a34", accent="#4aa3c8", blurTop=True),
    "keynote":     dict(bg="#08090d", ink="#f2f4f8", accent="#4f9dff"),
}

# 纸艺那族要背光色；彩玻要金线
PAPER_EXTRA = {
    "jianzhi": dict(backlight="#fff1cf", ink="#a8272a", leading=None, holes=True),
    "boli": dict(backlight="#e9f6ff", ink="#2f6ecf", leading="#c8a35a", holes=False),
    "jinbo": dict(backlight="#ffe9b8", ink="#7a3f12", leading="#d9a441", holes=True, gold=True),
}


def rng_for(pid: str) -> random.Random:
    return random.Random(f"style:{pid}")


# ---------- 各族的形状表 ----------

def geo_hatch(pid: str, pal: dict) -> dict:
    """刻印：地平线构图——远山、一个主体（日轮/塔/屋）、三层地，靠排线分深浅。"""
    r = rng_for(pid)
    W, H = 1920, 1080
    hz = H * r.uniform(0.56, 0.66)
    forms = []

    # 远山：2–3 座，相互压住
    x = -W * r.uniform(0.02, 0.08)
    for i in range(2 + r.randrange(2)):
        w = W * r.uniform(0.30, 0.48)
        hh = H * r.uniform(0.16, 0.30)
        forms.append({"kind": r.choice(["tri", "arc"]), "x": round(x, 1), "y": round(hz - hh, 1),
                      "w": round(w, 1), "h": round(hh, 1), "angle": r.choice([20, 30, 40]),
                      "tone": round(r.uniform(0.45, 0.75), 2)})
        x += w * r.uniform(0.55, 0.82)

    # 主体：日轮 / 塔 / 屋，三者挑一个立在线上
    kind = r.choice(["sun", "tower", "house"])
    if kind == "sun":
        d = 1080 * r.uniform(0.20, 0.28)
        forms.append({"kind": "circle", "x": round(W * r.uniform(0.58, 0.74), 1),
                      "y": round(hz - d * 0.92, 1), "w": round(d, 1), "h": round(d, 1),
                      "angle": 0, "tone": 0.9})
    elif kind == "tower":
        w = W * r.uniform(0.10, 0.15)
        hh = H * r.uniform(0.30, 0.44)
        bx = W * r.uniform(0.30, 0.44)
        forms.append({"kind": "rect", "x": round(bx, 1), "y": round(hz - hh, 1),
                      "w": round(w, 1), "h": round(hh, 1), "angle": 90, "tone": 0.25})
        forms.append({"kind": "tri", "x": round(bx - w * 0.12, 1), "y": round(hz - hh - H * 0.10, 1),
                      "w": round(w * 1.24, 1), "h": round(H * 0.10, 1), "angle": 0, "tone": 0.95})
    else:
        w = W * r.uniform(0.16, 0.22)
        hh = H * r.uniform(0.16, 0.24)
        bx = W * r.uniform(0.26, 0.40)
        forms.append({"kind": "rect", "x": round(bx, 1), "y": round(hz - hh, 1),
                      "w": round(w, 1), "h": round(hh, 1), "angle": 20, "tone": 0.3})
        forms.append({"kind": "tri", "x": round(bx - w * 0.10, 1), "y": round(hz - hh - H * 0.12, 1),
                      "w": round(w * 1.2, 1), "h": round(H * 0.12, 1), "angle": 20, "tone": 0.85})

    # 地：三层，越近越深
    for i in range(3):
        forms.append({"kind": "arc", "x": -40, "y": round(hz + H * 0.02 + H * 0.075 * i, 1),
                      "w": W + 80, "h": round(H * (0.34 + 0.10 * i), 1),
                      "angle": r.choice([8, 18, -12]), "tone": round(0.30 + 0.16 * i, 2)})

    return dict(forms=forms, angle=r.choice([34, 40, 46]), density=r.choice([12, 14, 18]),
                lineWidth=round(r.uniform(1.8, 3.0), 1), cross=r.random() < 0.6)


def geo_halftone(pid: str, pal: dict) -> dict:
    """网点：海报构图——一个大圆压主视觉，一条弧带托底，两个方框做版面。"""
    r = rng_for(pid)
    W, H = 1920, 1080
    forms = []
    d = 1080 * r.uniform(0.34, 0.46)
    forms.append({"kind": "circle", "x": round(W * r.uniform(0.10, 0.24), 1),
                  "y": round(H * r.uniform(0.14, 0.26), 1), "w": round(d, 1), "h": round(d, 1),
                  "tone": round(r.uniform(0.55, 0.8), 2), "cell": r.choice([10, 13, 16])})
    forms.append({"kind": "arc", "x": round(W * r.uniform(0.30, 0.42), 1),
                  "y": round(H * r.uniform(0.42, 0.52), 1), "w": round(W * r.uniform(0.42, 0.58), 1),
                  "h": round(H * r.uniform(0.30, 0.42), 1),
                  "tone": round(r.uniform(0.5, 0.75), 2), "cell": r.choice([9, 11, 14])})
    for i in range(2):
        forms.append({"kind": "rect", "x": round(W * r.uniform(0.48, 0.70), 1),
                      "y": round(H * r.uniform(0.10, 0.30) + i * H * 0.14, 1),
                      "w": round(W * r.uniform(0.20, 0.34), 1), "h": round(H * r.uniform(0.10, 0.16), 1),
                      "tone": round(r.uniform(0.3, 0.6), 2), "cell": r.choice([8, 12])})
    return dict(forms=forms, cell=r.choice([11, 13, 16]), angle=r.choice([15, 30, 45, 60]),
                deep=r.random() < 0.7, grain=round(r.uniform(0.1, 0.25), 2))


def geo_neon(pid: str, pal: dict) -> dict:
    """霓虹：长曲线——螺旋、正弦带、环、折线，一笔到底才像灯管。"""
    r = rng_for(pid)
    W, H = 1920, 1080
    import math
    colors = [pal["accent"], "#4ff0e0", "#ffd166", "#8a7bff", "#ff6b6b"]
    paths = []
    kinds = ["spiral", "wave", "ring", "zig"]
    for i in range(3 + r.randrange(2)):
        kind = kinds[(i + r.randrange(4)) % 4]
        pts = []
        if kind == "spiral":
            cx, cy = W * r.uniform(0.35, 0.6), H * r.uniform(0.4, 0.6)
            rr, turns = 1080 * r.uniform(0.16, 0.26), r.uniform(1.4, 2.2)
            for k in range(34):
                a = (k / 33) * math.pi * 2 * turns
                cur = rr * (0.35 + 0.65 * k / 33)
                pts.append([round(cx + math.cos(a) * cur * 1.5, 1), round(cy + math.sin(a) * cur, 1)])
        elif kind == "wave":
            y0, amp = H * r.uniform(0.35, 0.65), H * r.uniform(0.08, 0.18)
            ph = r.uniform(0, 6.28)
            for k in range(30):
                u = k / 29
                pts.append([round(W * (0.06 + 0.88 * u), 1),
                            round(y0 + math.sin(u * math.pi * r.uniform(1.6, 3.2) + ph) * amp, 1)])
        elif kind == "ring":
            cx, cy = W * r.uniform(0.3, 0.7), H * r.uniform(0.3, 0.65)
            rx, ry = 1080 * r.uniform(0.16, 0.30), 1080 * r.uniform(0.12, 0.22)
            for k in range(36):
                a = (k / 35) * math.pi * 2
                pts.append([round(cx + math.cos(a) * rx, 1), round(cy + math.sin(a) * ry, 1)])
        else:
            y = H * r.uniform(0.2, 0.55)
            for k in range(9):
                pts.append([round(W * (0.10 + 0.11 * k) , 1), round(y, 1)])
                y += H * r.uniform(-0.18, 0.18)
        paths.append({"pts": pts, "color": colors[i % len(colors)],
                      "width": round(r.uniform(3, 6), 1), "blur": r.choice([14, 20, 28])})
    return dict(paths=paths, dust=300 + r.randrange(200), scan=r.choice([0, 0, 4]))


def geo_screen(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    charset = r.choice([" .:-=+*#%@", " .'`^\",:;Il!i><~+_-?][}{1)(|/", " ░▒▓█", " 0123456789"])
    return dict(cols=r.choice([56, 64, 72, 80]), rows=r.choice([26, 30, 34]),
                chars=charset, speed=round(r.uniform(0.8, 1.8), 2),
                margin=r.choice([0.045, 0.06, 0.075]), scanGap=r.choice([3, 4]),
                scanAlpha=round(r.uniform(0.22, 0.38), 2), chroma=r.random() < 0.7,
                scratch=r.random() < 0.4)


def geo_pixel(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    layers = []
    for i in range(2 + r.randrange(2)):
        layers.append({"base": round(1080 * r.uniform(0.10, 0.30), 1),
                       "amp": round(1080 * r.uniform(0.03, 0.12), 1),
                       "wave": r.choice([140, 180, 220, 260]),
                       "color": r.choice([pal["bg"], pal["ink"], pal["accent"]]),
                       "speed": round(r.uniform(4, 14), 1)})
    return dict(layers=layers, px=r.choice([11, 13, 15, 17]), heroX=round(r.uniform(0.42, 0.58), 2),
                ground=pal["accent"], levels=r.choice([8, 10, 12, 14]))


def geo_iso(pid: str, pal: dict) -> dict:
    """立体：一个收拢的体块群——中间一块主体，四周三四个配角，不散不撞。"""
    r = rng_for(pid)
    boxes = []
    hw = round(r.uniform(1.6, 2.4), 1)
    hd = round(r.uniform(1.6, 2.4), 1)
    boxes.append({"x": round(-hw / 2, 1), "y": round(-hd / 2, 1), "w": hw, "d": hd,
                  "h": round(r.uniform(2.4, 4.2), 2),
                  "color": r.choice([pal["ink"], pal["accent"]])})
    slots = [(-3.4, -2.6), (0.9, -3.0), (-3.2, 1.4), (1.2, 1.2), (-0.4, 2.6), (2.6, -0.4), (-4.2, -0.2)]
    r.shuffle(slots)
    for i in range(4 + r.randrange(3)):
        w = round(r.uniform(1.0, 1.8), 1)
        d = round(r.uniform(1.0, 1.8), 1)
        x, y = slots[i]
        x += r.uniform(-0.3, 0.3)
        y += r.uniform(-0.3, 0.3)
        boxes.append({"x": round(x, 1), "y": round(y, 1), "w": w, "d": d,
                      "h": round(r.uniform(0.5, 2.0), 2),
                      "color": r.choice([pal["ink"], pal["accent"], "#cfd6e0", "#e8d9c3", "#9fb4c7"])})
    boxes.sort(key=lambda b: (b["x"] + b["y"]))
    return dict(boxes=boxes, cx=round(r.uniform(0.44, 0.56), 2), cy=round(r.uniform(0.54, 0.62), 2),
                fitPad=0.08, blurTop=bool(pal.get("blurTop")))


def geo_plan(pid: str, pal: dict) -> dict:
    """图纸：三视图式的排版——左边主视图（外框 + 主体），右上剖切/细节，右下标注表，底边尺寸链。"""
    r = rng_for(pid)
    W, H = 1920, 1080
    parts = []

    # 主视图外框
    vx, vy, vw, vh = W * 0.07, H * 0.11, W * 0.46, H * 0.56
    parts.append({"kind": "rect", "x": round(vx, 1), "y": round(vy, 1), "w": round(vw, 1),
                  "h": round(vh, 1), "lw": 2.4, "fill": False})

    # 主视图里：底座 + 主体 + 一个圆/齿轮
    baseY = vy + vh * 0.78
    bw = vw * r.uniform(0.52, 0.68)
    parts.append({"kind": "rect", "x": round(vx + (vw - bw) / 2, 1), "y": round(baseY, 1),
                  "w": round(bw, 1), "h": round(vh * 0.14, 1), "fill": True, "lw": 2})
    bodyW = vw * r.uniform(0.24, 0.34)
    bodyH = vh * r.uniform(0.34, 0.46)
    parts.append({"kind": "rect", "x": round(vx + (vw - bodyW) / 2, 1), "y": round(baseY - bodyH, 1),
                  "w": round(bodyW, 1), "h": round(bodyH, 1), "fill": False, "lw": 2.6})
    head = min(bodyW, bodyH) * r.uniform(0.55, 0.8)
    parts.append({"kind": "circle", "x": round(vx + (vw - head) / 2, 1), "y": round(baseY - bodyH - head * 1.15, 1),
                  "w": round(head, 1), "h": round(head, 1), "fill": False, "lw": 2})

    # 右上：细节放大图，带引线
    dx, dy = W * 0.62, H * 0.10
    dd = 1080 * r.uniform(0.20, 0.26)
    parts.append({"kind": "circle", "x": round(dx, 1), "y": round(dy, 1), "w": round(dd, 1),
                  "h": round(dd, 1), "fill": False, "lw": 2})
    parts.append({"kind": "gear", "x": round(dx + dd / 2, 1), "y": round(dy + dd / 2, 1),
                  "r": round(dd / 2 * 0.46, 1)})
    parts.append({"kind": "trace", "pts": [[round(dx - dd * 0.1, 1), round(dy + dd * 0.62, 1)],
                                          [round(dx - dd * 0.42, 1), round(dy + dd * 0.92, 1)],
                                          [round(vx + vw * 0.9, 1), round(baseY - bodyH * 0.55, 1)]],
                  "color": pal["accent"], "lw": 1.8})

    # 右下：标注表（三条横线 + 标签）
    tx, ty = W * 0.62, H * 0.50
    for i in range(3):
        parts.append({"kind": "rect", "x": round(tx, 1), "y": round(ty + i * H * 0.085, 1),
                      "w": round(W * 0.30, 1), "h": round(H * 0.085, 1), "lw": 1.2, "fill": i == 0})
    for i in range(3):
        parts.append({"kind": "label", "x": round(tx + 14, 1), "y": round(ty + i * H * 0.085 + H * 0.055, 1),
                      "text": [r.choice(["MAT", "SCALE 1:12", "TOL ±0.2"]), r.choice(["A-01", "B-02", "C-03"]),
                               r.choice(["REF 04", "REF 07", "REF 11"])][i],
                      "size": 20, "color": pal["ink"]})

    # 底边：尺寸链 + 图号
    parts.append({"kind": "dim", "x": round(vx, 1), "y": round(vy + vh + H * 0.07, 1),
                  "w": round(vw, 1), "h": 0, "text": f"{r.randrange(240, 900)} mm"})
    parts.append({"kind": "label", "x": round(vx, 1), "y": round(H * 0.95, 1),
                  "text": r.choice(["VIEW A-A", "SECTION B-B", "DETAIL C", "PLAN 01"]), "size": 22})
    return dict(parts=parts, gridGap=r.choice([80, 90, 110]),
                sheet=r.choice(["AV·DWG 01", "AV·DWG 02", "AV·DWG 03"]),
                paperMode=bool(pal.get("paperMode")), scan=r.random() < 0.3)


def geo_map(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    blobs = []
    for i in range(2 + r.randrange(3)):
        blobs.append({"x": round(1920 * r.uniform(0.15, 0.8), 1), "y": round(1080 * r.uniform(0.15, 0.8), 1),
                      "r": round(1080 * r.uniform(0.12, 0.34), 1), "color": r.choice([pal["accent"], "#31c8b6", "#8a7bff"])})
    routes = []
    for i in range(2):
        pts = [[round(1920 * r.uniform(0.08, 0.3), 1), round(1080 * r.uniform(0.2, 0.8), 1)]]
        for s in range(3):
            pts.append([round(max(60, min(1860, pts[-1][0] + 1920 * r.uniform(-0.05, 0.16))), 1),
                        round(max(60, min(1020, pts[-1][1] + 1080 * r.uniform(-0.14, 0.14))), 1)])
        routes.append({"pts": pts, "color": r.choice([pal["accent"], "#ffd166", "#7ef0ff"]),
                       "width": r.choice([3, 4, 5])})
    return dict(blobs=blobs, routes=routes,
                contours=dict(x=blobs[0]["x"], y=blobs[0]["y"], r0=round(1080 * r.uniform(0.1, 0.18), 1),
                              step=r.choice([36, 42, 50]), rings=r.choice([4, 5, 6]), wave=r.choice([2, 3, 4])) if r.random() < 0.7 else None,
                points=dict(n=r.choice([300, 420, 560]), color=pal["ink"], size=r.choice([2, 3])),
                graticule=bool(pal.get("graticule")), vignette=0.28)


def geo_photo(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    return dict(tone1=pal.get("tone1", "#20201c"), tone2=pal.get("tone2", "#8a8a86"),
                tone3=pal.get("tone3", "#0c0c0a"),
                subject=r.choice(["city", "figure", "tree", "room", "machine", "ring"]),
                subjectX=round(r.uniform(0.40, 0.68), 2),
                horizon=round(r.uniform(0.58, 0.72), 2),
                subjectS=round(r.uniform(0.14, 0.20), 2),
                grain=round(r.uniform(0.4, 0.7), 2),
                sprocket=r.random() < 0.5, flare=r.random() < 0.5, frame=r.random() < 0.8)


def geo_paper(pid: str, pal: dict) -> dict:
    """纸艺：分层剪纸场景——地、日轮、树、屋、飞鸟，孔洞透背光。"""
    r = rng_for(pid)
    W, H = 1920, 1080
    gY = H * r.uniform(0.70, 0.78)
    forms = []

    # 地
    forms.append({"kind": "rect", "x": -30, "y": round(gY, 1), "w": W + 60,
                  "h": round(H - gY + 30, 1), "holes": 4})
    # 日轮
    d = H * r.uniform(0.22, 0.30)
    forms.append({"kind": "circle", "x": round(W * r.uniform(0.56, 0.76), 1),
                  "y": round(gY - d * 0.92, 1), "w": round(d, 1), "h": round(d, 1), "holes": 6})
    # 远山
    forms.append({"kind": "arc", "x": round(-20, 1), "y": round(gY - H * 0.22, 1),
                  "w": round(W * 0.62, 1), "h": round(H * 0.24, 1), "holes": 0})
    # 树：干 + 冠
    tw = W * r.uniform(0.035, 0.055)
    tx = W * r.uniform(0.16, 0.28)
    forms.append({"kind": "rect", "x": round(tx, 1), "y": round(gY - H * 0.30, 1),
                  "w": round(tw, 1), "h": round(H * 0.30, 1), "holes": 0})
    forms.append({"kind": "circle", "x": round(tx - tw * 2.2, 1), "y": round(gY - H * 0.44, 1),
                  "w": round(tw * 5.4, 1), "h": round(H * 0.20, 1), "holes": 7})
    # 屋：墙 + 顶
    hw = W * r.uniform(0.14, 0.20)
    hx = W * r.uniform(0.42, 0.54)
    forms.append({"kind": "rect", "x": round(hx, 1), "y": round(gY - H * 0.16, 1),
                  "w": round(hw, 1), "h": round(H * 0.16, 1), "holes": 3})
    forms.append({"kind": "tri", "x": round(hx - hw * 0.10, 1), "y": round(gY - H * 0.27, 1),
                  "w": round(hw * 1.2, 1), "h": round(H * 0.11, 1), "holes": 0})
    # 飞鸟：两只小的
    for i in range(2):
        bw = W * r.uniform(0.05, 0.075)
        forms.append({"kind": "arc", "x": round(W * r.uniform(0.30, 0.72), 1),
                      "y": round(H * r.uniform(0.12, 0.26), 1), "w": round(bw, 1),
                      "h": round(bw * 0.42, 1), "holes": 0})
    return dict(forms=forms)


def geo_board(pid: str, pal: dict) -> dict:
    """板写：真的"画一张"——桌线 + 主体轮廓 + 明暗短笔 + 强调圈 + 箭头。

    油彩/马克笔会把色块先铺成 washes，再压线；一笔画只有一根连续线；
    黑板/白板更像板书示意，多几条箭头与圈。
    """
    import math
    r = rng_for(pid)
    W, H = 1920, 1080
    ink, accent = pal["ink"], pal["accent"]
    tableY = H * r.uniform(0.66, 0.74)
    strokes, washes = [], []

    def stroke(pts, w=None, color=None, t0=None, dur=None, jitter=None, alpha=None):
        strokes.append({"pts": [[round(x, 1), round(y, 1)] for x, y in pts],
                        "w": round(w if w is not None else r.uniform(4, 11), 1),
                        "color": color or ink,
                        "alpha": round(alpha if alpha is not None else r.uniform(0.72, 0.95), 2),
                        "t0": round(t0 if t0 is not None else r.uniform(0.1, 1.4), 2),
                        "dur": round(dur if dur is not None else r.uniform(0.35, 0.8), 2),
                        "jitter": round(jitter if jitter is not None else r.uniform(0.8, 2.4), 1)})

    # 桌线
    stroke([[W * 0.05, tableY], [W * 0.66, tableY + H * 0.012]], w=r.uniform(5, 9), t0=0.1)

    # 主体：瓶/罐（多边形轮廓 + 口沿椭圆）
    cx = W * r.uniform(0.24, 0.36)
    bw = W * r.uniform(0.09, 0.13)
    bh = H * r.uniform(0.24, 0.34)
    neck = bw * 0.46
    body = [[cx - bw / 2, tableY],
            [cx - bw / 2, tableY - bh * 0.62],
            [cx - neck / 2, tableY - bh * 0.72],
            [cx - neck / 2, tableY - bh * 0.94],
            [cx + neck / 2, tableY - bh * 0.94],
            [cx + neck / 2, tableY - bh * 0.72],
            [cx + bw / 2, tableY - bh * 0.62],
            [cx + bw / 2, tableY]]
    stroke(body + [body[0]], w=r.uniform(4, 7), t0=0.3, dur=0.9)
    rim = [[cx - neck / 2 + neck * k / 8, tableY - bh * 0.94 - math.sin(k / 8 * math.pi) * neck * 0.22] for k in range(9)]
    stroke(rim, w=r.uniform(3, 5), t0=1.1)

    # 旁边两只果子（圆），底下一道影线
    for i in range(2):
        fx = cx + bw * r.uniform(0.9, 1.9) + i * bw * 0.7
        fy = tableY - bw * r.uniform(0.24, 0.34)
        rr = bw * r.uniform(0.22, 0.30)
        circle = [[fx + math.cos(k / 18 * 2 * math.pi) * rr, fy + math.sin(k / 18 * 2 * math.pi) * rr * 0.92] for k in range(19)]
        stroke(circle, w=r.uniform(3, 6), t0=1.3 + i * 0.3, dur=0.6)
        stroke([[fx - rr * 1.3, fy + rr * 1.15], [fx + rr * 1.2, fy + rr * 1.05]], w=r.uniform(2, 4), alpha=0.5, t0=1.9)

    # 排线：主体暗部几道短笔
    for i in range(r.randrange(4, 9)):
        x = cx + bw * r.uniform(-0.55, 0.5)
        y0 = tableY - bh * r.uniform(0.1, 0.55)
        stroke([[x, y0], [x + bw * 0.16, y0 - bh * 0.12]], w=r.uniform(2, 4.5), alpha=r.uniform(0.35, 0.7), t0=r.uniform(1.6, 2.6), dur=0.3)

    # 强调圈 + 箭头（示意板书）
    ex, ey = W * r.uniform(0.52, 0.62), H * r.uniform(0.36, 0.52)
    er = H * r.uniform(0.09, 0.14)
    ellipse = [[ex + math.cos(k / 22 * 2 * math.pi) * er * 1.25, ey + math.sin(k / 22 * 2 * math.pi) * er * 0.78] for k in range(23)]
    stroke(ellipse, w=r.uniform(3, 6), color=accent, t0=r.uniform(2.0, 2.8), dur=0.7)
    ax0, ay0 = cx + bw * 0.8, tableY - bh * 0.5
    stroke([[ax0, ay0], [ex - er, ey + er * 0.2]], w=r.uniform(2.5, 4.5), color=accent, t0=2.6, dur=0.4)
    stroke([[ex - er, ey + er * 0.2], [ex - er * 1.18, ey - er * 0.1]], w=3, color=accent, t0=2.9, dur=0.2)
    stroke([[ex - er, ey + er * 0.2], [ex - er * 1.05, ey + er * 0.42]], w=3, color=accent, t0=2.9, dur=0.2)

    # 油彩/马克笔：先铺底色块
    if pal.get("oil") or pal["bg"] == "#fbf9f2":
        washes.append({"pts": [[cx - bw * 0.8, tableY - bh * 0.9], [cx + bw * 0.8, tableY - bh * 0.85],
                               [cx + bw * 1.1, tableY], [cx - bw * 1.0, tableY]],
                       "color": accent, "alpha": 0.28, "t0": 0.2})
        washes.append({"pts": [[W * 0.05, tableY], [W * 0.66, tableY + H * 0.012],
                               [W * 0.66, H * 0.92], [W * 0.05, H * 0.92]],
                       "color": ink, "alpha": 0.10, "t0": 0.4})

    return dict(strokes=merged_yibi(strokes, ink, pid), washes=washes, gridBoard=bool(pal.get("gridBoard")),
                chalk=bool(pal.get("chalk")),
                highlights=[{"x": round(W * r.uniform(0.10, 0.30), 1), "y": round(tableY + H * 0.02, 1),
                             "w": round(W * r.uniform(0.14, 0.22), 1), "h": round(H * 0.018, 1),
                             "color": accent, "t0": round(r.uniform(2.4, 3.2), 2)}])


def random_cos(a): return __import__("math").cos(a)
def random_sin(a): return __import__("math").sin(a)


def geo_flat(pid: str, pal: dict, name_zh: str, name_en: str) -> dict:
    r = rng_for(pid)
    bgforms = []
    for i in range(2 + r.randrange(3)):
        bgforms.append({"kind": r.choice(["rect", "circle", "tri", "arc"]),
                        "x": round(1920 * r.uniform(-0.05, 0.65), 1), "y": round(1080 * r.uniform(-0.05, 0.6), 1),
                        "w": round(1920 * r.uniform(0.18, 0.5), 1), "h": round(1080 * r.uniform(0.12, 0.45), 1),
                        "color": r.choice([pal["accent"], "#111111", "#f4f2ed"]), "alpha": round(r.uniform(0.5, 1), 2)})
    bars = [{"x": round(1920 * r.uniform(0.05, 0.12), 1), "y": round(1080 * r.uniform(0.52, 0.62), 1),
             "w": round(1920 * r.uniform(0.12, 0.22), 1), "h": r.choice([10, 14, 18]), "color": pal["accent"]}]
    return dict(bgForms=bgforms, bars=bars, dots=r.random() < 0.5,
                lines=[{"text": name_zh, "size": round(1080 * r.uniform(0.13, 0.19), 1),
                        "x": round(1920 * r.uniform(0.06, 0.10), 1), "y": round(1080 * r.uniform(0.34, 0.44), 1),
                        "color": pal["ink"], "weight": 800, "letter": r.choice([0, 2, 4])},
                       {"text": name_en, "size": round(1080 * r.uniform(0.035, 0.05), 1),
                        "x": round(1920 * r.uniform(0.06, 0.10), 1), "y": round(1080 * r.uniform(0.50, 0.58), 1),
                        "color": pal["ink"], "weight": 500, "letter": 6}])


def merged_yibi(strokes, ink, pid):
    """一笔画：把所有笔画首尾接成一根连续线，否则就不叫一笔画了。"""
    if pid != "yibi" or not strokes:
        return strokes
    pts = []
    for s in strokes:
        pts += s["pts"]
    return [{"pts": pts, "w": 5, "color": ink, "alpha": 0.94, "t0": 0.15, "dur": 1.8, "jitter": 1.6}]


def geo_cel(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    return dict(sky1=r.choice([pal["bg"], "#0d1533", "#251a45"]), sky2=r.choice([pal["accent"], "#f2603c", "#e05a8a"]),
                hero=r.choice([pal["ink"], "#f4d35e", "#ffe0a3"]),
                heroKind=r.choice(["figure", "robot", "cart"]),
                heroX=round(r.uniform(0.36, 0.58), 2), heroY=round(r.uniform(0.58, 0.70), 2),
                heroS=round(r.uniform(0.14, 0.19), 2),
                sun=r.choice(["#ffe9a8", "#ffd166", pal["accent"]]),
                sunX=round(r.uniform(0.66, 0.84), 2), sunS=round(r.uniform(0.08, 0.13), 2),
                horizon=round(r.uniform(0.74, 0.82), 2),
                speed=r.random() < 0.6, ground=r.choice(["#0e1220", "#1b1226"]), celGrain=r.random() < 0.5)


def geo_field(pid: str, pal: dict) -> dict:
    r = rng_for(pid)
    blobs = [{"x": round(1920 * r.uniform(0.2, 0.8), 1), "y": round(1080 * r.uniform(0.2, 0.75), 1),
              "r": round(1080 * r.uniform(0.15, 0.35), 1), "a": round(r.uniform(0.6, 1.2), 2)}
             for _ in range(2 + r.randrange(3))]
    ramp = ([[0, "#04121f"], [0.25, "#0b5a8a"], [0.5, "#31c8b6"], [0.72, "#ffd166"], [1, "#ff4b2b"]]
            if pal["bg"] != "#050608" else [[0, "#05060a"], [0.3, "#3a0d5a"], [0.6, "#ff2d55"], [0.85, "#ffb84d"], [1, "#fff6d6"]])
    return dict(blobs=blobs, ramp=ramp, iso=True, step=r.choice([10, 12, 14]),
                wave=r.choice([3, 4, 5]), readout=r.choice(["T 34.6°C", "S/N 0.92", "Δ 12.4", "FIELD 07"]))


# ---------- 生成 main.js ----------

def spec_for(pid: str, pipe: dict) -> dict:
    family, pal_key = TABLE[pid]
    pal = dict(PALETTES[pal_key])
    name_zh = pipe["name_zh"]
    name_en = pipe["name_en"]

    spec = {
        "id": pid,
        "seed": f"av:{pid}",
        "family": family,
        "w": 1920,
        "h": 1080,
        "bg": pal["bg"],
        "ink": pal["ink"],
        "accent": pal["accent"],
    }
    if family == "hatch":
        spec.update(inks=[pal["ink"], pal["accent"]], hatchColor=pal["bg"], **geo_hatch(pid, pal))
    elif family == "halftone":
        spec.update(inks=[pal["ink"], pal["accent"], "#1f6ecb" if pal_key != "chrome" else "#e2372c"], **geo_halftone(pid, pal))
    elif family == "neon":
        spec.update(**geo_neon(pid, pal))
    elif family == "screen":
        spec.update(fg=pal["ink"], screen=pal["bg"], **geo_screen(pid, pal))
        # 桌面 / 录屏 / 表格三条不用字符阵，改画界面，免得五条屏幕都长一个样
        mode = {"zhuomian": "ui", "luping": "ui", "biaoge": "sheet"}.get(pid)
        if mode:
            spec["mode"] = mode
        if pid == "luping":
            spec["record"] = True
    elif family == "pixel":
        spec.update(hero=pal["accent"], **geo_pixel(pid, pal))
    elif family == "iso":
        spec.update(**geo_iso(pid, pal))
    elif family == "plan":
        spec.update(ink=pal["ink"], accent=pal["accent"], grid=pal.get("grid", "#8fb6d8"), **geo_plan(pid, pal))
    elif family == "map":
        spec.update(**geo_map(pid, pal))
    elif family == "photo":
        spec.update(**geo_photo(pid, pal))
    elif family == "paper":
        spec.update(**PAPER_EXTRA.get(pid, {}), **geo_paper(pid, pal))
        spec["ink"] = PAPER_EXTRA.get(pid, {}).get("ink", pal["ink"])
    elif family == "board":
        spec.update(board=pal["bg"], ink=pal["ink"], **geo_board(pid, pal))
    elif family == "flat":
        spec.update(**geo_flat(pid, pal, name_zh, name_en))
    elif family == "cel":
        spec.update(**geo_cel(pid, pal))
    elif family == "field":
        spec.update(**geo_field(pid, pal))

    # 版式牌：左下角的名字条
    spec["label"] = {
        "zh": name_zh, "en": name_en,
        "station": f"{pipe['station_no']:02d} · {pipe['station']}" if isinstance(pipe.get("station_no"), int) else str(pipe.get("station")),
        "ink": "#ffffff" if _is_dark(pal["bg"]) else "#141414",
        "sub": "#ffffff" if _is_dark(pal["bg"]) else "#4a4a46",
    }
    return spec


def _is_dark(hex_color: str) -> bool:
    s = hex_color.lstrip("#")
    r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 110


MAIN_JS = """// {pid} · {name_zh}
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（{family} 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {spec_json};

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, {{ w: SPEC.w, h: SPEC.h, seed: SPEC.seed }});

// 左下角的版式牌：哪条管线、哪个工位
function plate(t) {{
  const L = SPEC.label;
  const k = STYLEKIT.ease(STYLEKIT.clamp((t - 0.15) / 0.8));
  if (k <= 0) return;
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const m = Math.round(Math.min(W, H) * 0.035);
  ctx.save();
  ctx.globalAlpha = 0.92 * k;
  // 一块极淡的衬底，保证字在任何画面上都读得出
  const panelW = Math.round(Math.min(W, H) * 0.40);
  const panelH = Math.round(Math.min(W, H) * 0.145);
  ctx.fillStyle = SPEC.label.ink === '#ffffff' ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.55)';
  ctx.fillRect(m - 14, H - m - panelH, panelW, panelH);
  ctx.strokeStyle = SPEC.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m - 14, H - m - panelH);
  ctx.lineTo(m - 14 + panelW * k, H - m - panelH);
  ctx.stroke();

  // 三行分开：工位 → 中文名 → 英文名，避免长名字和工位号撞车
  STYLEKIT.type(ENV, L.station, {{ x: m, y: H - m - panelH + Math.round(panelH * 0.22),
                                 size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 }});
  STYLEKIT.type(ENV, L.zh, {{ x: m, y: H - m - panelH + Math.round(panelH * 0.66),
                             size: Math.round(Math.min(W, H) * 0.044), color: L.ink, weight: 800 }});
  STYLEKIT.type(ENV, L.en, {{ x: m, y: H - m - panelH + Math.round(panelH * 0.92),
                            size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 }});
  ctx.restore();
}}

window.renderAt = (t) => {{
  STYLEKIT.scene(ENV, SPEC, t);
  plate(t);
}};

// 先画第 0 秒，等字体就绪再宣布 ready
STYLEKIT.scene(ENV, SPEC, 0);
plate(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {{
  window.renderAt(0);
  window.__ready = true;
}});
"""

INDEX_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{pid} · {name_zh}</title>
<style>
  @font-face {{
    font-family: "AlibabaPuHuiTi";
    src: url("../../../../assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf") format("truetype");
    font-weight: 400 900;
    font-display: block;
  }}
  html, body {{ margin: 0; background: {bg}; }}
  #c {{ display: block; width: 100vw; height: 100vh; object-fit: contain; }}
</style>
</head>
<body>
<canvas id="c" width="{w}" height="{h}"></canvas>
<script src="../../../../vendor/runtime/stylekit.js"></script>
<script src="./main.js"></script>
</body>
</html>
"""

SCRIPT_PY = '''""" {name_zh}（{pid}）：自研渲染入口。

画面由仓库自己的 vendor/runtime/stylekit.js 画，帧由 style-frames.mjs 抓，
不调用任何外部仓库的脚本。
"""

import sys
from pathlib import Path

for up in Path(__file__).resolve().parents:
    if (up / "tools" / "av_style.py").exists():
        sys.path.insert(0, str(up / "tools"))
        break

from av_style import main  # noqa: E402

raise SystemExit(main("{pid}"))
'''

SKILL_MD = """---
name: {pid}
description: {desc}
---

# {pid}：{name_zh}

{lead}

## 一句话原则

1. **画面自己画。** 没有上游脚本可调，{family_zh}族的绘制代码在 `vendor/runtime/stylekit.js`，
   这条管线的形状坐标、色板、节拍写在 `projects/demo/main.js` 的 `SPEC` 里，生成时按 id 播种定死。
2. **确定性。** 只用 seeded RNG；不用 `Math.random`、不用 `Date.now`，同一秒数永远同一帧。
3. **一帧一画。** `renderAt(t)` 从空白重画，不叠上一帧，抽帧和整片完全一致。
4. **只出画面。** 配音、字幕、配乐由外层工序接，管线本身不掺。

## 目录

```
{pid}/
├── SKILL.md
├── pipeline.json         定版参数（画幅/风格族/节拍）
├── scripts/{pid}.py      入口：--check / --plan / --stills / --render / --mp4
└── projects/demo/
    ├── index.html        画布壳（字体走 assets/fonts）
    ├── main.js           SPEC + 版式牌 + renderAt
    ├── frames/           抓下来的帧（不入库）
    └── out/              静帧与成片（不入库）
```

## 常用命令

```bash
python pipelines/{pid}/scripts/{pid}.py --check
python pipelines/{pid}/scripts/{pid}.py --stills 0.6,2.0,5.0
python pipelines/{pid}/scripts/{pid}.py --render
```

## 验收

- `--check` 全 OK 才动手；缺 puppeteer-core / 浏览器 / ffmpeg 会直接报出来，不假装成功。
- 静帧看三件事：形状对不对、色板是不是这一族的气质、字有没有压到主体。
- 出片后 `ffprobe` 核时长与画幅，与 `pipeline.json` 的 `meta` 对齐。
"""

README_MD = """# {pid} · {name_zh}

{lead}

## 环境

- Node ≥ 18，puppeteer-core（仓库内任意带它的管线即可，默认找 `dengju/node_modules`）
- Edge 或 Chrome（`STYLE_EDGE` 可指定）
- ffmpeg 在 PATH 里
- 字体：`assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf`（仓库自带，OFL）

## 快速开始

```bash
python pipelines/{pid}/scripts/{pid}.py --check
python pipelines/{pid}/scripts/{pid}.py --stills 1.2,3.4
python pipelines/{pid}/scripts/{pid}.py --render
```

产物：`projects/demo/out/{pid}.mp4`（{w}×{h} / {fps} fps）。

## 画面是怎么来的

`vendor/runtime/stylekit.js` 里 {family_zh}族的绘制原语 + 本管线 `SPEC` 的几何与色板。
所有坐标在生成时就写死，运行时不掷骰子。
"""

FAMILY_ZH = {
    "hatch": "刻印", "halftone": "网点", "neon": "霓虹", "screen": "屏幕", "pixel": "像素",
    "iso": "立体", "plan": "图纸", "map": "地图", "photo": "摄影", "paper": "纸艺",
    "board": "板写", "flat": "平面", "cel": "赛璐珞", "field": "场",
}
FAMILY_LEAD = {
    "hatch": "一刀一色：形状先定，再用排线造明暗，浅线压在深块上。",
    "halftone": "网点分色：同形状叠两三版网，套色故意偏 2–3 px，出印刷的错位感。",
    "neon": "黑底加色：描线分多遍叠加，亮芯压在光晕上，暗角收边。",
    "screen": "屏幕里的一帧：字符阵、扫描线、横向亮带，外框压住四边。",
    "pixel": "限定色板：大像素块拼前景远景，整帧量化到 8–14 级。",
    "iso": "等轴测：体块按 x/y/z 投影，顶面提亮、左面中间调、右面压暗，落地投影跟着走。",
    "plan": "先画线再标尺寸：主体、引线、图号分层出现，像一张正在被画完的图纸。",
    "map": "场 + 等值线 + 站点：先铺色斑，再压等高圈，最后点数据与线路。",
    "photo": "灰阶构图：亮块、剪影、胶片颗粒与齿孔，暗角压住边缘。",
    "paper": "背光镂空：纸色分层叠上，孔洞透出背光，金线勾边。",
    "board": "逐笔写出来：每一笔有起笔时间，高亮带压在关键笔画上。",
    "flat": "大色块 + 大字：几何压底，字按行进场，横线随进度长出来。",
    "cel": "平涂加描边：天空渐变、角色几何化剪影、速度线与地平线。",
    "field": "场值成色：高斯斑叠成热场，按色阶上色，再压等温线。",
}


def main() -> int:
    cat = json.loads((ROOT / "catalog" / "pipelines.json").read_text(encoding="utf-8"))["pipelines"]
    smap = json.loads((ROOT / "tools" / "lemo_style_map.json").read_text(encoding="utf-8"))["styles"]
    stmap = {s["id"]: s for s in json.loads((ROOT / "catalog" / "stations.json").read_text(encoding="utf-8"))["stations"]}
    by_id = {p["id"]: p for p in cat}

    made = 0
    for slug, info in smap.items():
        pid = info["id"]
        pipe = by_id.get(pid)
        if not pipe:
            print("目录里没有这条管线：", pid)
            continue
        if pid not in TABLE:
            print("没有风格定义：", pid)
            continue

        family, pal_key = TABLE[pid]
        spec = spec_for(pid, pipe)
        st = stmap.get(pipe.get("station"))
        if st:
            spec["label"]["station"] = f"{st['no']} · {st['name_zh']}"
        w, h = 1920, 1080
        aspect = (pipe.get("meta") or {}).get("aspect") or "16:9"
        w, h = {"16:9": (1920, 1080), "4:3": (1440, 1080), "1:1": (1080, 1080),
                "9:16": (1080, 1920), "3:4": (1080, 1440), "2.35:1": (1920, 817),
                "2.39:1": (1920, 804)}.get(aspect, (1920, 1080))
        spec["w"], spec["h"] = w, h
        # 形状表是按 1920×1080 算的，画幅不同就等比缩放
        if (w, h) != (1920, 1080):
            sx, sy = w / 1920, h / 1080
            for key in ("forms", "parts", "paths", "routes", "boxes", "strokes", "blobs", "lines", "bgForms", "bars"):
                for item in spec.get(key) or []:
                    for kx in ("x", "w"):
                        if kx in item:
                            item[kx] = round(item[kx] * sx, 1)
                    for ky in ("y", "h", "r", "base", "amp", "cy", "cx"):
                        if ky in item:
                            item[ky] = round(item[ky] * sy, 1)
                    if "pts" in item:
                        item["pts"] = [[round(x * sx, 1), round(y * sy, 1)] for x, y in item["pts"]]

        proj = ROOT / "pipelines" / pid / "projects" / "demo"
        proj.mkdir(parents=True, exist_ok=True)
        (proj / "index.html").write_text(
            INDEX_HTML.format(pid=pid, name_zh=pipe["name_zh"], bg=spec["bg"], w=w, h=h),
            encoding="utf-8", newline="\n")
        spec_json = json.dumps(spec, ensure_ascii=False, indent=2)
        (proj / "main.js").write_text(
            MAIN_JS.format(pid=pid, name_zh=pipe["name_zh"], family=family, spec_json=spec_json),
            encoding="utf-8", newline="\n")

        (ROOT / "pipelines" / pid / "scripts" / f"{pid}.py").write_text(
            SCRIPT_PY.format(pid=pid, name_zh=pipe["name_zh"]), encoding="utf-8", newline="\n")

        # 文档重写成"自己画"
        desc = f"用「{pipe['name_zh']}」做{pipe['station']}短片：{FAMILY_LEAD[family]}"
        desc = desc.replace("：", "，")[:180]
        (ROOT / "pipelines" / pid / "SKILL.md").write_text(
            SKILL_MD.format(pid=pid, name_zh=pipe["name_zh"], desc=desc, lead=FAMILY_LEAD[family],
                            family_zh=FAMILY_ZH[family]),
            encoding="utf-8", newline="\n")
        (ROOT / "pipelines" / pid / "README.md").write_text(
            README_MD.format(pid=pid, name_zh=pipe["name_zh"], lead=FAMILY_LEAD[family],
                             w=w, h=h, fps=(pipe.get("meta") or {}).get("fps") or 30,
                             family_zh=FAMILY_ZH[family]),
            encoding="utf-8", newline="\n")

        # pipeline.json 补上风格族与渲染口径
        pj = ROOT / "pipelines" / pid / "pipeline.json"
        data = json.loads(pj.read_text(encoding="utf-8"))
        data.setdefault("spec", {})
        data["spec"]["style"] = {
            "family": family,
            "palette": pal_key,
            "kit": "vendor/runtime/stylekit.js",
            "harness": "vendor/runtime/style-frames.mjs",
            "project": f"pipelines/{pid}/projects/demo",
        }
        data["spec"]["engine_note"] = FAMILY_LEAD[family]
        pj.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        made += 1

    print(f"已生成/重写 {made} 条管线项目")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
