# -*- coding: utf-8 -*-
"""用能量静音检测把 配音.wav 的句界切出来，用于字幕对齐。"""
import json
import sys
import wave

import numpy as np

SEG_START = 0.0
SEG_END = 21.60


def load(path):
    w = wave.open(path)
    sr = w.getframerate()
    n = w.getnframes()
    raw = w.readframes(n)
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return sr, data


def main():
    wav = sys.argv[1] if len(sys.argv) > 1 else r"D:\@kaifa\出稿\001_血之海滩\配音.wav"
    sr, data = load(wav)
    seg = data[int(SEG_START * sr):int(SEG_END * sr)]
    hop = int(0.01 * sr)  # 10 ms
    frames = len(seg) // hop
    rms = np.array([np.sqrt(np.mean(seg[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(frames)])
    db = 20 * np.log10(rms + 1e-12)
    # 噪声底：取最低的 20% 分位数
    floor = np.percentile(db, 20)
    thr = max(floor + 8.0, -55.0)
    active = db > thr
    # 找出静音段 >= 120 ms 的位置
    gaps = []
    run = None
    for i, a in enumerate(active):
        if not a:
            if run is None:
                run = i
        else:
            if run is not None:
                if (i - run) * 0.01 >= 0.12:
                    gaps.append((run * 0.01, i * 0.01))
                run = None
    print(f"sr={sr} dur={len(seg)/sr:.2f} floor={floor:.1f} dB thr={thr:.1f} dB gaps={len(gaps)}")
    for g in gaps:
        print("  gap %.2f - %.2f  (%.2f s)" % (g[0], g[1], g[1] - g[0]))
    json.dump({"floor_db": float(floor), "thr_db": float(thr), "gaps": gaps},
              open(r"D:\@kaifa\Auto-Video\xiangsu\projects\002_血之海滩\tools\gaps.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
