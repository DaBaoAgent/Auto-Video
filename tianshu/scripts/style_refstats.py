# -*- coding: utf-8 -*-
"""tianshu · 原片对位取色与基线

为什么要有这一步：所谓「风格」在数值上就是两点 —— 亮度和饱和落在哪个区间、
色板是哪几个 hex。凭眼睛抄色板是猜，实测出来的可复现、可复核。

三条硬规则（都付过代价）：

* 统计前先裁掉字幕带 —— 烧入字幕接近纯黑，会把色板的暗端带偏；
* 不要用缩略图算基线 —— 240×135 的 JPEG 会把饱和、亮度、梯度全带偏；
  本脚本统一按原尺寸算一遍、再按 1024×768 算一遍，跨镜头比较只用同尺寸的那一列；
* 角色固有色不从全片统计里取（全片大部分是雾和夜，k-means 会把一身洋红袍压成灰）；
  用 --character 单张平背景设定图去量。

产出 work/refstats.json：
  {frames: {name: {val, sat, high, grad, palette:[hex...]}}, baseline: {...}}
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

import tcfg


def stats(im: Image.Image) -> dict:
    hsv = np.asarray(im.convert("HSV"), dtype=np.float32)
    s, v = hsv[..., 1] / 255.0, hsv[..., 2] / 255.0
    g = np.asarray(im.convert("L"), dtype=np.float32)
    grad = (np.abs(np.diff(g, axis=1)).mean() + np.abs(np.diff(g, axis=0)).mean()) / 2
    return {"val": round(float(v.mean() * 100), 2),
            "sat": round(float(s.mean() * 100), 2),
            "high": round(float((s > 0.45).mean() * 100), 2),
            "grad": round(float(grad), 2)}


def palette(im: Image.Image, k: int) -> list[str]:
    """PIL 中值切分（MEDIANCUT）取主色 —— 与原片色板逐镜对位用的就是这条。"""
    q = im.convert("RGB").quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette() or []
    counts = sorted(q.getcolors() or [], reverse=True)
    out = []
    for _, idx in counts:
        r, g, b = pal[idx * 3: idx * 3 + 3]
        out.append("#%02x%02x%02x" % (r, g, b))
    return out


def crop_sub(im: Image.Image, frac: float) -> Image.Image:
    if frac <= 0:
        return im
    w, h = im.size
    return im.crop((0, 0, w, int(h * (1 - frac))))


def run(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py refstats")
    ap.add_argument("name")
    ap.add_argument("--dir", default="", help="原片抽帧目录，默认用 pipeline.json 的 film_frames")
    ap.add_argument("--pattern", default="*.jpg")
    ap.add_argument("--crop-bottom", type=float, default=0.18, help="裁掉底部字幕带的比例")
    ap.add_argument("--colors", type=int, default=8)
    ap.add_argument("--character", default="", help="单张平背景设定图，只量固有色")
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    ref_dir = Path(a.dir or tcfg.cfg()["paths"]["film_frames"])

    if a.character:
        im = Image.open(a.character).convert("RGB")
        cols = palette(im, min(a.colors, 8))
        tcfg.save_json(pd / "work" / "refstats_character.json",
                       {"source": str(a.character), "colors": cols})
        print("角色固有色：" + "  ".join(cols))
        return 0

    if not ref_dir.exists():
        print(f"参考帧目录不存在：{ref_dir}")
        return 1
    files = sorted(ref_dir.glob(a.pattern))
    if a.limit:
        files = files[: a.limit]
    if not files:
        print(f"{ref_dir} 下没有匹配 {a.pattern} 的帧")
        return 1

    frames, native, resized = {}, [], []
    for f in files:
        im = Image.open(f).convert("RGB")
        im = crop_sub(im, a.crop_bottom)
        s = stats(im)
        s["palette"] = palette(im, a.colors)
        frames[f.stem] = s
        native.append(s)
        small = im.resize((1024, 768), Image.LANCZOS)
        resized.append(stats(small))

    def med(rows, key):
        return round(float(np.median([r[key] for r in rows])), 2)

    baseline = {
        "frames": len(files),
        "crop_bottom": a.crop_bottom,
        "median_native": {k: med(native, k) for k in ("val", "sat", "high", "grad")},
        "median_1024x768": {k: med(resized, k) for k in ("val", "sat", "high", "grad")},
        "p25_1024x768": {k: round(float(np.percentile([r[k] for r in resized], 25)), 2)
                         for k in ("val", "sat", "high", "grad")},
        "p75_1024x768": {k: round(float(np.percentile([r[k] for r in resized], 75)), 2)
                         for k in ("val", "sat", "high", "grad")},
        "note": "跨镜头比较只用 median_1024x768 这一列；不要用缩略图重算",
    }
    out = pd / "work" / "refstats.json"
    tcfg.save_json(out, {"source": str(ref_dir), "frames": frames, "baseline": baseline})

    print(f"{len(files)} 帧 -> {out}")
    print("基线（1024×768）： " + "  ".join(f"{k} {v}" for k, v in baseline["median_1024x768"].items()))
    print("基线（原尺寸）  ： " + "  ".join(f"{k} {v}" for k, v in baseline["median_native"].items()))
    print("\n逐帧（前 8）：")
    for name, s in list(frames.items())[:8]:
        print(f"  {name:<8} val {s['val']:5.1f}  sat {s['sat']:5.1f}  grad {s['grad']:5.2f}  "
              + " ".join(s["palette"][:4]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
