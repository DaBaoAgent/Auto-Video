# -*- coding: utf-8 -*-
"""tianshu · 后期 2D 运镜（摄像机归后期，不归模型）

I2V 只负责氛围动态（雾、云、水、火、尘），运镜全部在这里做：
确定性、不抖、逐镜可调，比让视频模型自己编运镜更像 1983 年那种「搬动摄影台」。

三种保证：
  * cosine 缓动（两端速度为零）→ 切点不顿
  * 双线性采样 → 不会逐像素跳格
  * 采样窗每帧都验过在源图内（越界直接报错）→ 永远不会出黑边

视差：默认整张画布一起走（原片的长背景横移就是这么做的）。
      --depth-map 可以给一张手绘深度图（白=近），但不要用自动天际线检测 ——
      实测它会把塔的轮廓当成天空边界，把塔切成两半。
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

import tcfg

MOVES = tcfg.DEFAULT_MOVES


def read_frames(src: Path, tmp: Path) -> list[Path]:
    if src.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
        return []
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src),
                    str(tmp / "s_%04d.png")], check=True)
    return sorted(tmp.glob("s_*.png"))


def load(p: Path) -> np.ndarray:
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)


def ease_cosine(t: np.ndarray) -> np.ndarray:
    return 0.5 - 0.5 * np.cos(np.pi * np.clip(t, 0.0, 1.0))


def ease_linear(t: np.ndarray) -> np.ndarray:
    return np.clip(t, 0.0, 1.0)


def ease_out(t: np.ndarray) -> np.ndarray:
    t = np.clip(t, 0.0, 1.0)
    return 1.0 - (1.0 - t) ** 2.5


EASES = {"cosine": ease_cosine, "linear": ease_linear, "ease_out": ease_out}


def load_depth(path: str, sw: int, sh: int, far: float) -> np.ndarray:
    im = Image.open(path).convert("L").resize((sw, sh), Image.LANCZOS)
    d = np.asarray(im, dtype=np.float32) / 255.0
    return (far + (1.0 - far) * d).astype(np.float32)


def sample_bilinear(img: np.ndarray, us: np.ndarray, vs: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    u0 = np.floor(us).astype(np.int32)
    v0 = np.floor(vs).astype(np.int32)
    wu = (us - u0).astype(np.float32)[..., None]
    wv = (vs - v0).astype(np.float32)[..., None]
    u0c, v0c = np.clip(u0, 0, w - 1), np.clip(v0, 0, h - 1)
    u1c, v1c = np.clip(u0 + 1, 0, w - 1), np.clip(v0 + 1, 0, h - 1)
    a, b = img[v0c, u0c], img[v0c, u1c]
    c, d = img[v1c, u0c], img[v1c, u1c]
    return (a * (1 - wu) * (1 - wv) + b * wu * (1 - wv)
            + c * (1 - wu) * wv + d * wu * wv)


def plan(src_wh, out_wh, move, amount, zoom_amt, rise_amt) -> dict:
    sw, sh = src_wh
    ow, oh = out_wh
    preset = MOVES.get(move, MOVES["hold"])
    A = preset["amount"] if amount is None else amount
    Z = preset["zoom"] if zoom_amt is None else zoom_amt
    R = preset["rise"] if rise_amt is None else rise_amt
    aspect = ow / oh
    travel_frac = A + abs(Z) + abs(R) * aspect
    zoom_base = 1.0 + travel_frac + 0.02
    s0 = max(ow / sw, oh / sh)
    return {"amount": A, "zoom": Z, "rise": R, "zoom_base": zoom_base, "s0": s0}


def compile_frames(src, files, out_wh, move, pl, ease, depth_map, far,
                   dur, fps, trim=None) -> list[np.ndarray]:
    ow, oh = out_wh
    if files:
        if trim:
            files = files[:max(2, int(round(trim * fps)))]
        imgs = [load(p) for p in files]
        src_n = len(imgs)
        # 把源重定时到镜头真实时长：I2V 只有 121 帧（5.04s），大部分镜头更长，
        # 长镜就放慢氛围层 —— 雾和云本来就该慢，也不会有循环接缝
        n = max(1, int(round(dur * fps))) if dur else src_n
    else:
        imgs = [load(src)]
        src_n = 1
        n = max(1, int(round((dur or 5.04) * fps)))
    sh, sw = imgs[0].shape[:2]

    A, Z, R = pl["amount"], pl["zoom"], pl["rise"]
    s0, zb = pl["s0"], pl["zoom_base"]
    depth = load_depth(depth_map, sw, sh, far) if depth_map else None

    xs = (np.arange(ow, dtype=np.float32) - (ow - 1) / 2.0)
    ys = (np.arange(oh, dtype=np.float32) - (oh - 1) / 2.0)
    sgn = -1.0 if move.endswith("_left") else 1.0
    cam_max = A * ow
    rise_max = R * ow

    out_frames = []
    for i in range(n):
        t = 0.0 if n == 1 else i / (n - 1)
        e = float(ease(np.array([t]))[0])
        s = s0 * (zb + Z * e)
        px = sgn * (e - 0.5) * cam_max / s
        py = (e - 0.5) * rise_max / s

        half_w, half_h = ow / (2.0 * s), oh / (2.0 * s)
        if (abs(px) + half_w > sw / 2 + 1e-6) or (abs(py) + half_h > sh / 2 + 1e-6):
            raise RuntimeError(f"第 {i} 帧采样窗出源图：需要 zoom>={zb:.3f}，"
                               f"请给更小的 amount 或更大的图")

        base_u = sw / 2.0 + px + xs / s
        base_v = sh / 2.0 + py + ys / s
        if depth is None:
            uu = np.broadcast_to(base_u[None, :], (oh, ow))
            vv = np.broadcast_to(base_v[:, None], (oh, ow))
        else:
            uu0 = np.broadcast_to(base_u[None, :], (oh, ow))
            vv0 = np.broadcast_to(base_v[:, None], (oh, ow))
            iu = np.clip(np.rint(uu0).astype(np.int32), 0, sw - 1)
            iv = np.clip(np.rint(vv0).astype(np.int32), 0, sh - 1)
            f = depth[iv, iu]
            uu = sw / 2.0 + (xs[None, :] / s) + px * f
            vv = vv0
        si = min(int(round(t * (src_n - 1))), src_n - 1)
        out_frames.append(np.clip(sample_bilinear(imgs[si], uu, vv), 0, 255).astype(np.uint8))
    return out_frames


def render_one(src: Path, dst: Path, out_wh, move, amount, zoom_amt, rise_amt,
               ease, depth_map, far, dur, fps, trim, qa=None) -> None:
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        files = read_frames(src, td)
        first = load(files[0]) if files else load(src)
        sh, sw = first.shape[:2]
        pl = plan((sw, sh), out_wh, move, amount, zoom_amt, rise_amt)
        frames = compile_frames(src, files, out_wh, move, pl, EASES[ease],
                                depth_map, far, dur, fps, trim)
        od = td / "out"
        od.mkdir()
        for i, f in enumerate(frames):
            Image.fromarray(f).save(od / f"o_{i:04d}.png")
        dst.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(fps),
                        "-i", str(od / "o_%04d.png"),
                        "-c:v", "libx264", "-crf", "15", "-preset", "slow",
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)], check=True)
        if qa:
            idx = [0, len(frames) // 2, len(frames) - 1]
            tiles = [Image.fromarray(frames[i]).resize((480, 360), Image.LANCZOS) for i in idx]
            sheet = Image.new("RGB", (480 * 3 + 16 * 4, 360 + 16 * 2), (18, 18, 20))
            for k, t in enumerate(tiles):
                sheet.paste(t, (16 + k * (480 + 16), 16))
            sheet.save(qa)


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py cam")
    ap.add_argument("name")
    ap.add_argument("--jobs", default="")
    ap.add_argument("--only", default="")
    ap.add_argument("--size", default="")
    ap.add_argument("--rebuild", action="store_true")
    ap.add_argument("--qa", action="store_true", help="每镜写一张三帧对位图")
    a = ap.parse_args(argv)

    cfg = tcfg.cfg()["cam"]
    pd = tcfg.project_dir(a.name)
    proj = tcfg.load_project(a.name)
    jobs_path = Path(a.jobs) if a.jobs else pd / "work" / "jobs_cam.json"
    raw = tcfg.load_json(jobs_path)
    if not raw:
        print(f"缺 {jobs_path}，先跑 scaffold")
        return 1
    jobs = raw["jobs"] if isinstance(raw, dict) else raw
    if a.only:
        ids = {s.strip() for s in a.only.split(",") if s.strip()}
        jobs = [j for j in jobs if j["id"] in ids]

    if a.size:
        ow, oh = (int(v) for v in a.size.lower().split("x"))
    else:
        ow, oh = tcfg.ratio_res(proj.get("ratio", "4:3"), "i2v_std")
    fps = int(proj.get("fps", cfg["fps"]))
    out_dir = tcfg.pdir(a.name, "cam")
    qa_dir = tcfg.pdir(a.name, "out", "cam_qa") if a.qa else None

    for j in jobs:
        jid = j["id"]
        dst = out_dir / f"{jid}.mp4"
        if dst.exists() and not a.rebuild:
            print(f"[{jid}] 已有运镜，跳过")
            continue
        cand = [pd / j["src"], pd / j.get("fallback", "")]
        src = next((c for c in cand if c and c.exists() and c.is_file()), None)
        if src is None:
            print(f"[{jid}] 找不到源：{cand}")
            continue
        move = j.get("move", "drift")
        print(f"[{jid}] {move:<11} {src.name}  {j.get('dur', 0):.2f}s", flush=True)
        try:
            render_one(src, dst, (ow, oh), move, j.get("amount"), j.get("zoom"),
                       j.get("rise"), cfg["ease"], j.get("depth_map"), float(j.get("far", 0.35)),
                       j.get("dur"), fps, j.get("trim"),
                       qa_dir / f"{jid}.jpg" if qa_dir else None)
        except RuntimeError as e:
            print(f"[{jid}] 运镜失败：{e}")
            continue
        print(f"[{jid}] -> {dst}")
    return 0
