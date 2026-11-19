# -*- coding: utf-8 -*-
"""S5 音频合成：旁白 + SFX 床 → 终混（目标积分响度 + 真峰值门禁）。

对齐 jianying 定稿口径（口播优先、限幅交付），并回避「旁白天然高波峰比」的坑：
不靠拉峰值，而是**迭代增益 + 软限幅**把积分响度推到平台交付区间（-17.5 ~ -15 LUFS）。

用法：
  python pipeline/mix_audio.py --narration output/sample-30s/narration.wav \
      --sfx output/sample-30s/sfx-bed.wav --out output/sample-30s/final-audio.wav
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 44100
# 限幅参数可由 CLI 覆盖：拐点越高、上限越宽，被压掉的波峰越少，
# 真峰值（peak）反而能顶到接近 0，同时积分响度几乎不变——这正是
# 「-17.5~-15 LUFS 且 -3.0~-0.3 dBFS」这两道门禁同时成立的关键。
KNEE = 0.70   # 限幅拐点 ≈ -3.1 dBFS
CEIL = 0.94   # 限幅上限 ≈ -0.55 dBFS


def load(path: Path) -> np.ndarray:
    x, s = sf.read(path, dtype="float32")
    if x.ndim > 1:
        x = x.mean(axis=1)
    if s != SR:
        raise SystemExit(f"{path.name} 采样率 {s} ≠ {SR}")
    return x


def limit(x: np.ndarray, knee: float = KNEE, ceil: float = CEIL) -> np.ndarray:
    a = np.abs(x)
    s = np.sign(x)
    y = np.where(a < knee, a, knee + (ceil - knee) * np.tanh((a - knee) / (ceil - knee)))
    return (s * y).astype(np.float32)


def measure(path: Path) -> tuple[float, float]:
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    ints = re.findall(r"I:\s*(-?\d+(?:\.\d+)?) LUFS", err)
    peaks = re.findall(r"Peak:\s*(-?\d+(?:\.\d+)?) dBFS", err)
    return (float(ints[-1]) if ints else float("nan"),
            float(peaks[-1]) if peaks else float("nan"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", help="选题 slug（给这个就不用再写三个路径）")
    ap.add_argument("--narration", type=Path)
    ap.add_argument("--sfx", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--sfx-gain-db", type=float, default=None)
    ap.add_argument("--target-lufs", type=float, default=None)
    ap.add_argument("--target-peak", type=float, default=None,
                    help="真峰值目标 dBFS；交付门禁是 -3.0 ~ -0.3，留 0.5 dB 给 AAC 过冲")
    ap.add_argument("--knee", type=float, default=0.86, help="限幅拐点（线性幅度）")
    ap.add_argument("--ceil", type=float, default=CEIL, help="限幅上限（线性幅度，会被自动拟合覆盖）")
    ap.add_argument("--iterations", type=int, default=6)
    args = ap.parse_args()

    if args.project:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import Paths
        P = Paths(args.project)
        mix = P.film.get("audio", {})
        args.narration = args.narration or P.narration_wav
        args.sfx = args.sfx or P.sfx_bed
        args.out = args.out or P.final_audio
        args.sfx_gain_db = mix.get("sfx_gain_db", -4.0) if args.sfx_gain_db is None else args.sfx_gain_db
        args.target_lufs = mix.get("target_lufs", -16.3) if args.target_lufs is None else args.target_lufs
        args.target_peak = mix.get("target_peak", -1.1) if args.target_peak is None else args.target_peak
    args.sfx_gain_db = -4.0 if args.sfx_gain_db is None else args.sfx_gain_db
    args.target_lufs = -16.3 if args.target_lufs is None else args.target_lufs
    args.target_peak = -1.1 if args.target_peak is None else args.target_peak
    if not (args.narration and args.sfx and args.out):
        raise SystemExit("要么给 --project，要么给 --narration/--sfx/--out")

    nar = load(args.narration)
    sfx = load(args.sfx) * (10 ** (args.sfx_gain_db / 20))
    n = max(len(nar), len(sfx))
    base = np.zeros(n, np.float32)
    base[: len(nar)] += nar
    base[: len(sfx)] += sfx[: n]

    tmp = args.out.with_name(args.out.stem + ".probe.wav")
    args.out.parent.mkdir(parents=True, exist_ok=True)

    def write(path: Path, mono: np.ndarray) -> None:
        """双声道母版：两声道取同一信号、单位增益。

        不能交给 ffmpeg 用 -ac 2 升混——它按 1/√2 衰减每声道（-3 dB），
        而 R128 对同相双声道会把这 3 dB 加回去，结果积分响度不变、
        真峰值却凭空低 3 dB，直接掉出门禁下限。
        """
        sf.write(path, np.stack([mono, mono], axis=1), SR, subtype="PCM_16")

    # 第 1 步：迭代增益对齐积分响度（此阶段限幅尽量少动，保住波峰动态）
    gain_db = 0.0
    ceil = 1.0
    lufs, peak = float("nan"), float("nan")
    for i in range(args.iterations):
        knee = min(args.knee, ceil * 0.9)
        y = limit(base * (10 ** (gain_db / 20)), knee, ceil)
        write(tmp, y)
        lufs, peak = measure(tmp)
        print(f"  响度迭代 {i + 1}: gain {gain_db:+.1f} dB → {lufs:.1f} LUFS / 峰值 {peak:.1f} dBFS")
        if abs(lufs - args.target_lufs) <= 0.2:
            break
        gain_db += args.target_lufs - lufs

    # 第 2 步：二分拟合限幅上限，把真峰值钉到目标（响度几乎不受影响）
    lo, hi = 0.30, 1.0
    best = (abs(peak - args.target_peak), ceil)
    for i in range(7):
        ceil = (lo + hi) / 2
        knee = min(args.knee, ceil * 0.9)
        y = limit(base * (10 ** (gain_db / 20)), knee, ceil)
        write(tmp, y)
        lufs, peak = measure(tmp)
        print(f"  峰值拟合 {i + 1}: ceil {ceil:.3f} → {lufs:.1f} LUFS / 峰值 {peak:.1f} dBFS")
        if abs(peak - args.target_peak) < abs(best[0]):
            best = (abs(peak - args.target_peak), ceil)
        if abs(peak - args.target_peak) <= 0.15 and args.target_lufs - 0.4 <= lufs <= args.target_lufs + 0.4:
            break
        # 峰值偏高（不够负）说明限幅太松 → 收上限；反之放开
        if peak > args.target_peak:
            hi = ceil
        else:
            lo = ceil

    ceil = best[1]
    knee = min(args.knee, ceil * 0.9)
    y = limit(base * (10 ** (gain_db / 20)), knee, ceil)
    write(args.out, y)
    tmp.unlink(missing_ok=True)
    lufs, peak = measure(args.out)
    rms_db = 20 * np.log10(np.sqrt((y.astype(np.float64) ** 2).mean()) + 1e-12)
    print(f"终混 {n / SR:.2f}s | {lufs:.1f} LUFS / 真峰值 {peak:.1f} dBFS / RMS {rms_db:.1f} dBFS "
          f"/ 双声道 / ceil {ceil:.3f}")
    print(f"→ {args.out}")
    args.out.with_suffix(".json").write_text(json.dumps(
        {"integrated_lufs": lufs, "true_peak_dbfs": peak, "rms_dbfs": round(rms_db, 2),
         "gain_db": round(gain_db, 2), "ceil": round(ceil, 3),
         "knee": round(knee, 3), "sfx_gain_db": args.sfx_gain_db,
         "channels": 2, "sample_rate": SR},
        ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
