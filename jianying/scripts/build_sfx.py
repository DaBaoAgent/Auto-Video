# -*- coding: utf-8 -*-
"""S4 音效床：按分镜表在时间线上铺 SFX（程序化合成，无版权素材依赖）。

素材池暂用确定性合成音（whoosh / 石门 / 点火 / 火起 / 印章），
全部由 numpy + scipy 生成，参数固定 → 每次渲染结果一致。
接入真实素材池（shotcraft 149 音效 / tushuo 音效）时，
只需把 synth() 换成读取文件，时间线逻辑不动。

cue 表不再写死在脚本里，而是从 film.json 每镜的 sfx 数组读：
  "sfx": [{"name": "whoosh", "offset": 0.02, "gain": -20}]

用法：
  python jianying/scripts/build_sfx.py --project chibi
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, lfilter

SR = 44100


def rng(seed: int = 7) -> np.random.Generator:
    return np.random.default_rng(seed)


def lp(x: np.ndarray, fc: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, min(fc / (SR / 2), 0.98), btype="low")
    return lfilter(b, a, x)


def hp(x: np.ndarray, fc: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, max(fc / (SR / 2), 0.001), btype="high")
    return lfilter(b, a, x)


def bp(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    b, a = butter(order, [max(lo / (SR / 2), 0.001), min(hi / (SR / 2), 0.98)], btype="band")
    return lfilter(b, a, x)


def fade(x: np.ndarray, ms: int = 6) -> np.ndarray:
    n = int(SR * ms / 1000)
    if len(x) > 2 * n > 0:
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


def norm(x: np.ndarray, peak: float = 0.9) -> np.ndarray:
    m = float(np.abs(x).max())
    return x / m * peak if m > 1e-9 else x


def whoosh(dur: float = 0.85, lo: float = 320, hi: float = 2600, seed: int = 11) -> np.ndarray:
    n = int(SR * dur)
    noise = rng(seed).normal(0, 1, n)
    out = np.zeros(n)
    # 噪声扫频：分段带通后按三段交叉淡化，近似移动带通
    steps = 6
    for i in range(steps):
        f = lo + (hi - lo) * (i / (steps - 1))
        seg = bp(noise, f * 0.7, f * 1.5)
        w = np.hanning(n)
        out += seg * np.roll(w, int(n * i / steps)) / steps * 2.4
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return norm(fade(out * env * 0.6), 0.55)


def stone(dur: float = 1.7, seed: int = 23) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    f0 = 62 * np.exp(-t * 0.8) + 34
    body = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-t * 2.4)
    grit = lp(rng(seed).normal(0, 1, n), 420) * np.exp(-t * 7.5)
    slam = hp(rng(seed + 1).normal(0, 1, n), 1800) * np.exp(-t * 40) * 0.35
    return norm(fade(body * 0.9 + grit * 0.5 + slam, 8), 0.86)


def ignite(dur: float = 1.05, seed: int = 31) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    hiss = hp(rng(seed).normal(0, 1, n), 2200) * np.exp(-t * 5.5)
    crack = np.zeros(n)
    for i in rng(seed + 2).integers(0, n - 400, 26):
        crack[i : i + 120] += rng(seed + i).normal(0, 1, 120) * 0.5
    crack = bp(crack, 900, 6000) * 0.55
    swell = lp(rng(seed + 3).normal(0, 1, n), 700) * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.6
    return norm(fade(hiss * 0.8 + crack + swell, 5), 0.8)


def fire(dur: float = 2.3, seed: int = 43) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    f0 = 70 * np.exp(-t * 0.9) + 32
    boom = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-t * 1.6)
    roar = lp(rng(seed).normal(0, 1, n), 900) * (1 - np.exp(-t * 12)) * np.exp(-t * 0.75)
    crack = np.zeros(n)
    for i in rng(seed + 1).integers(0, n - 300, 90):
        a = rng(seed + i).normal(0, 1, 180) * np.exp(-np.arange(180) / 55)
        crack[i : i + 180] += bp(a, 1200, 7000)
    return norm(fade(boom * 0.95 + roar * 0.55 + crack * 0.3, 10), 0.92)


def paper(dur: float = 0.45, seed: int = 57) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = bp(rng(seed).normal(0, 1, n), 1400, 7000) * np.exp(-t * 18)
    return norm(fade(x, 4), 0.4)


def seal(dur: float = 0.6, seed: int = 71) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * 120 * t) * np.exp(-t * 26)
    tap = lp(rng(seed).normal(0, 1, n), 700) * np.exp(-t * 46)
    tail = hp(rng(seed + 1).normal(0, 1, n), 2600) * np.exp(-t * 9) * 0.18
    return norm(fade(thud * 0.9 + tap * 0.8 + tail, 5), 0.82)


SYNTH = {
    "whoosh": lambda: whoosh(),
    "whoosh_low": lambda: whoosh(1.1, 180, 1200, seed=17),
    "stone": stone,
    "ignite": ignite,
    "fire": fire,
    "paper": paper,
    "seal": seal,
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, help="选题 slug")
    ap.add_argument("--out", type=Path, default=None, help="默认 <project>/audio/sfx-bed.wav")
    ap.add_argument("--duration", type=float, default=None, help="默认取 shots.json 的 meta")
    args = ap.parse_args()

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from common import Paths, require

    P = Paths(args.project)
    shots_data = json.loads(
        require(P.shots, f"jianying_shotcraft.py shots --project {args.project}").read_text(encoding="utf-8")
    )
    shots = shots_data["shots"]
    out = args.out or P.sfx_bed
    duration = args.duration or float(shots_data["meta"]["duration"])

    # cues 来自 film.json：每镜的 sfx 数组（可多条），name 必须是 SYNTH 里的键
    cues: dict[str, list[tuple[str, float, float]]] = {}
    for spec in P.film["shots"]:
        if spec.get("sfx"):
            cues[spec["scene"]] = [
                (c["name"], float(c.get("offset", 0.0)), float(c.get("gain", -20.0)))
                for c in spec["sfx"]
            ]

    total = int(SR * duration) + SR
    bed = np.zeros(total, np.float32)
    used = 0
    for s in shots:
        for name, offset, gain_db in cues.get(s["id"], []):
            if name not in SYNTH:
                raise SystemExit(f"未知音效 {name!r}，可选：{', '.join(sorted(SYNTH))}")
            clip = SYNTH[name]().astype(np.float32) * (10 ** (gain_db / 20))
            start = int(max(0.0, s["t0"] + offset) * SR)
            end = min(total, start + len(clip))
            bed[start:end] += clip[: end - start]
            used += 1

    bed = bed[: int(SR * duration)]
    peak = float(np.abs(bed).max()) or 1.0
    bed = (bed / peak * 0.5).astype(np.float32)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, bed, SR, subtype="PCM_16")
    print(f"SFX {used} 条 → {out}（{duration:.2f}s，峰值归一 0.5）")



if __name__ == "__main__":
    main()
