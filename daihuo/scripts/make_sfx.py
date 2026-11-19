# daihuo · 纯代码音效（不采样、不下载）
# 用法：python make_sfx.py --out=<dir>
# 产出 hit.wav（价签砸落）/ coin.wav（价格到位）/ stamp.wav（信息章）
import argparse
import wave

import numpy as np

SR = 48000


def write(path, sig, sr=SR):
    sig = np.clip(sig, -1.0, 1.0)
    pcm = (sig * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def env(n, kind="exp", tau=0.08):
    t = np.arange(n) / SR
    if kind == "exp":
        return np.exp(-t / tau)
    return np.ones(n)


def hit(seconds=0.22):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 68 * t) * np.exp(-t / 0.055)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.03) * 0.45
    # 噪声劈啪：固定种子，保证可复现
    rng = np.random.default_rng(20261116)
    noise = rng.standard_normal(n) * np.exp(-t / 0.012) * 0.5
    sig = (low + body + noise) * env(n, tau=0.06)
    return sig * 0.9


def coin(seconds=0.55):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    a = np.sin(2 * np.pi * 1046 * t) * np.exp(-t / 0.16)
    b = np.sin(2 * np.pi * 1568 * t) * np.exp(-t / 0.12) * 0.8
    c = np.sin(2 * np.pi * 2093 * t) * np.exp(-t / 0.06) * 0.35
    return (a + b + c) * 0.55


def stamp(seconds=0.30):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n) * np.exp(-t / 0.02)
    thump = np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.05)
    return (noise * 0.35 + thump * 0.7) * 0.7


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    import os
    os.makedirs(args.out, exist_ok=True)
    write(os.path.join(args.out, "hit.wav"), hit())
    write(os.path.join(args.out, "coin.wav"), coin())
    write(os.path.join(args.out, "stamp.wav"), stamp())
    print("ok", args.out)


if __name__ == "__main__":
    main()
