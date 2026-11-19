# -*- coding: utf-8 -*-
"""tianshu · 统一后期（逐镜锚定亮度/饱和 + 原片颗粒纸纹）

核心不是「套一个滤镜」，而是把每张底图钉到它自己那张对位原片帧的亮度/饱和上。
026 的实测基线（852×480 真实帧，不是缩略图）：亮度中位 36.65、均饱和 25.78、
高饱和 11.46；梯度中位 2.98(852×480) / 2.13(1024×768)。

顺序不能动：亮度 → 对比 → 黑位 → 暖调 → 色温 → 饱和锚定 → 颗粒纸纹。
饱和锚定必须在最后，否则 target_sat 就不是成片的最终值。
颗粒/纸纹是从原片帧提的高频、低频残差，不是随机噪声 —— 随机噪声一看就假。
"""
from __future__ import annotations

import argparse
import glob
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

import tcfg


def gradf(g: np.ndarray) -> float:
    return float((np.abs(np.diff(g, axis=1)).mean() + np.abs(np.diff(g, axis=0)).mean()) / 2)


def stats(im: Image.Image) -> dict:
    hsv = np.asarray(im.convert("HSV"), dtype=np.float32)
    s, v = hsv[..., 1] / 255.0, hsv[..., 2] / 255.0
    g = np.asarray(im.convert("L"), dtype=np.float32)
    return {"high": float((s > 0.45).mean() * 100), "sat": float(s.mean() * 100),
            "val": float(v.mean() * 100), "grad": gradf(g)}


def build_textures(tex_dir: Path, ref_dirs: list[Path], ref_size: tuple[int, int],
                   n: int = 24, seed: int = 1983):
    files = []
    for d in ref_dirs:
        for f in sorted(glob.glob(str(Path(d) / "*.jpg"))):
            try:
                if Image.open(f).size == ref_size:
                    files.append(f)
            except Exception:
                pass
    if not files:
        raise RuntimeError(f"找不到 {ref_size[0]}×{ref_size[1]} 原片帧，无法提取纹理层：{ref_dirs}")
    random.seed(seed)
    sample = random.sample(files, min(n, len(files)))
    his, los = [], []
    for f in sample:
        im = Image.open(f).convert("L")
        g = np.asarray(im, dtype=np.float32)
        his.append(g - np.asarray(im.filter(ImageFilter.GaussianBlur(2.0)), dtype=np.float32))
        los.append(g - np.asarray(im.filter(ImageFilter.GaussianBlur(22.0)), dtype=np.float32))
    rng = np.random.default_rng(seed)
    amp = np.mean([np.abs(x) for x in his], axis=0)
    sign = rng.choice([-1.0, 1.0], size=amp.shape).astype(np.float32)
    G = amp * sign
    G -= G.mean()
    G /= max(G.std(), 1e-6)
    P = np.mean(los, axis=0)
    P -= P.mean()
    P /= max(P.std(), 1e-6)
    tex_dir.mkdir(parents=True, exist_ok=True)
    np.save(tex_dir / "grain.npy", G.astype(np.float32))
    np.save(tex_dir / "paper.npy", P.astype(np.float32))
    print(f"纹理层已重建：{len(sample)} 帧源 -> {tex_dir}")
    return G, P


def load_textures(tex_dir: Path, ref_dirs: list[Path], ref_size: tuple[int, int], rebuild=False):
    gp, pp = tex_dir / "grain.npy", tex_dir / "paper.npy"
    if rebuild or not (gp.exists() and pp.exists()):
        return build_textures(tex_dir, ref_dirs, ref_size)
    return np.load(gp), np.load(pp)


def place(layer: np.ndarray, w: int, h: int, seed: int) -> np.ndarray:
    img = Image.fromarray(((layer * 100) + 128).clip(0, 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    a = (np.asarray(img, dtype=np.float32) - 128) / 100.0
    rng = np.random.default_rng(seed)
    a = np.roll(a, int(rng.integers(0, h)), axis=0)
    a = np.roll(a, int(rng.integers(0, w)), axis=1)
    if rng.random() > 0.5:
        a = a[:, ::-1]
    if rng.random() > 0.5:
        a = a[::-1, :]
    return a


def process(path: Path, seed: int, target_val: float, target_sat: float,
            G: np.ndarray, P: np.ndarray, cfg: dict,
            warm=None, extra_gamma=None) -> tuple[Image.Image, float, float]:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    a = np.asarray(im, dtype=np.float32)

    v0 = (a.mean(axis=2) / 255.0).mean()
    gamma = float(np.clip(np.log((target_val * cfg["lvl"]) / 100.0) / np.log(max(v0, 1e-3)),
                          cfg["gamma_lo"], cfg["gamma_hi"]))
    a = 255.0 * np.power(np.clip(a / 255.0, 0, 1), gamma)

    a = 128.0 + (a - 128.0) * cfg["contrast"]
    a = np.clip(a * cfg["black_scale"] + cfg["black_lift"], 0, 255)

    a[..., 0] = a[..., 0] * cfg["warm_r"][0] + a[..., 1] * cfg["warm_r"][1]
    a[..., 2] = a[..., 2] * cfg["warm_b"]

    if warm is not None:
        wr, wg, wb = warm
        a[..., 0] *= wr
        a[..., 1] *= wg
        a[..., 2] *= wb
    if extra_gamma is not None:
        a = 255.0 * np.power(np.clip(a / 255.0, 0, 1), float(extra_gamma))

    tmp = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    hsv = np.asarray(tmp.convert("HSV"), dtype=np.float32).copy()
    s0 = hsv[..., 1].mean() / 255.0
    need = float(np.clip((target_sat / 100.0) / max(s0, 1e-3), cfg["sat_cap_lo"], cfg["sat_cap_hi"]))
    hsv[..., 1] = np.clip(hsv[..., 1] * need, 0, 255)
    a = np.asarray(Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB"), dtype=np.float32)

    gl = place(G, w, h, seed + 7)
    pl = place(P, w, h, seed + 13)
    a = np.clip(a + gl[..., None] * cfg["grain_sigma"] + pl[..., None] * cfg["paper_sigma"], 0, 255)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), gamma, need


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py post")
    ap.add_argument("name")
    ap.add_argument("--jobs", default="")
    ap.add_argument("--only", default="")
    ap.add_argument("--tex-dir", default="")
    ap.add_argument("--rebuild-tex", action="store_true")
    ap.add_argument("--ref-size", default="", help="提纹理用的原片帧尺寸，如 852x480")
    a = ap.parse_args(argv)

    cfg = tcfg.cfg()["post"]
    pd = tcfg.project_dir(a.name)
    jobs_path = Path(a.jobs) if a.jobs else pd / "work" / "jobs_post.json"
    raw = tcfg.load_json(jobs_path)
    if not raw:
        print(f"缺 {jobs_path}，先跑 scaffold")
        return 1
    jobs = raw["jobs"] if isinstance(raw, dict) else raw
    if a.only:
        ids = {s.strip() for s in a.only.split(",") if s.strip()}
        jobs = [j for j in jobs if j["id"] in ids]

    out_dir = tcfg.pdir(a.name, "post")
    tex_dir = Path(a.tex_dir) if a.tex_dir else tcfg.pdir(a.name, "work", "texture")
    ref_dirs = [Path(tcfg.cfg()["paths"]["film_frames"]),
                Path(str(tcfg.cfg()["paths"]["film_frames"]).replace("参考帧_init", "参考帧_pd"))]
    ref_size = tuple(int(v) for v in (a.ref_size or cfg["ref_size"]).lower().split("x"))
    G, P = load_textures(tex_dir, ref_dirs, ref_size, a.rebuild_tex)

    before, after, miss = [], [], []
    print("  id      gamma need | 亮度 前->后(目标) | 饱和 前->后(目标)")
    for j in jobs:
        src = pd / j["image"] if not Path(j["image"]).is_absolute() else Path(j["image"])
        if not src.exists():
            print(f"  [{j['id']}] 缺底图 {src}")
            miss.append(j["id"])
            continue
        out, gamma, need = process(src, int(j.get("seed", 5000)), float(j["target_val"]),
                                   float(j["target_sat"]), G, P, cfg,
                                   j.get("warm"), j.get("extra_gamma"))
        dst = out_dir / f"{j['id']}.png"
        out.save(dst)
        s0, s1 = stats(Image.open(src)), stats(out)
        before.append(s0)
        after.append(s1)
        print("  %-7s %.2f %.2f | %5.1f -> %5.1f (%.1f) | %5.1f -> %5.1f (%.1f)" % (
            j["id"], gamma, need, s0["val"], s1["val"], float(j["target_val"]) * cfg["lvl"],
            s0["sat"], s1["sat"], float(j["target_sat"])))

    if before:
        def avg(l, k):
            return sum(x[k] for x in l) / len(l)
        print("\n  亮度   %5.2f -> %5.2f" % (avg(before, "val"), avg(after, "val")))
        print("  饱和   %5.2f -> %5.2f" % (avg(before, "sat"), avg(after, "sat")))
        print("  输出   %s  (%d 张)" % (out_dir, len(after)))
    return 0 if not miss else 2


if __name__ == "__main__":
    import sys
    raise SystemExit(run(sys.argv[1:]))
