#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""shouhui · 音效床合成器（纯标准库，无 numpy 依赖）

输入：cues.json —— 每个 cue = {type, t, ...}
输出：sfx.wav（48k 单声道浮点量化的 16bit PCM）

设计原则（沿用 mg-styles-15 的做法）：
  1. 一切由代码合成，随机数带种子，同一 cue 永远同一波形；
  2. 音效是「点」，BGM 是「面」，人声是主 —— 三层分开给增益，最后统一归一到 -14 LUFS；
  3. 每个 cue 必须落在画面动作的帧上（本片 24fps，误差 < 1 帧 = 41.7ms）。
"""
import json, math, random, struct, sys, wave

SR = 48000


def env_exp(n, tau):
    return [math.exp(-i / (SR * tau)) for i in range(n)]


def noise(n, seed):
    r = random.Random(seed)
    return [r.uniform(-1, 1) for _ in range(n)]


def onepole_lp(x, a):
    y, out = 0.0, []
    for v in x:
        y += (v - y) * a
        out.append(y)
    return out


def onepole_hp(x, a):
    y, prev, out = 0.0, 0.0, []
    for v in x:
        y += (v - y) * a
        out.append(v - y)
        prev = v
    return out


def add(buf, start, sig, gain=1.0):
    i0 = int(start * SR)
    for i, v in enumerate(sig):
        j = i0 + i
        if 0 <= j < len(buf):
            buf[j] += v * gain


def thud(seed=1, f=88.0, dur=0.28):
    n = int(SR * dur)
    nz = onepole_lp(noise(n, seed), 0.02)
    e = env_exp(n, dur * 0.22)
    return [(math.sin(2 * math.pi * f * i / SR) * 0.9 + nz[i] * 2.2) * e[i] for i in range(n)]


def brush(seed=2, dur=1.0, rate=0.55):
    n = int(SR * dur)
    nz = onepole_hp(onepole_lp(noise(n, seed), 0.55), 0.03)
    out = []
    for i in range(n):
        u = i / n
        mod = 0.55 + 0.45 * math.sin(2 * math.pi * rate * u + 0.7) * math.sin(2 * math.pi * 3.1 * u)
        out.append(nz[i] * mod * (0.4 if u > 0.94 else 1.0))
    return out


def pop(seed=3, f=760.0, dur=0.13):
    n = int(SR * dur)
    e = env_exp(n, dur * 0.3)
    return [math.sin(2 * math.pi * f * i / SR * (1 + 0.9 * i / n)) * e[i] for i in range(n)]


def whoosh(seed=4, dur=0.55):
    n = int(SR * dur)
    nz = noise(n, seed)
    out, y = [], 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.5 * u * u          # 带通中心随包络上扫：从闷到亮
        y += (nz[i] - y) * a
        out.append((nz[i] - y) * math.sin(math.pi * u) ** 1.4)
    return out


def crackle(seed=5, dur=1.0, density=26):
    n = int(SR * dur)
    out = [0.0] * n
    r = random.Random(seed)
    for _ in range(int(density * dur)):
        t0 = r.uniform(0, dur)
        f = r.uniform(900, 2600)
        ln = int(SR * 0.012)
        e = env_exp(ln, 0.004)
        add(out, t0, [math.sin(2 * math.pi * f * i / SR) * e[i] * r.uniform(0.25, 1.0) for i in range(ln)])
    body = onepole_lp(noise(n, seed + 1), 0.08)
    return [out[i] * 0.9 + body[i] * 0.25 for i in range(n)]


def flutter(seed=6, dur=1.0):
    n = int(SR * dur)
    nz = onepole_hp(noise(n, seed), 0.12)
    r = random.Random(seed)
    out = []
    for i in range(n):
        u = i / n
        g = (1 - u) * (0.35 + 0.65 * abs(math.sin(2 * math.pi * r.uniform(4, 9) * u)))
        out.append(nz[i] * g)
    return out


def stamp(seed=7):
    a = thud(seed, 62.0, 0.20)
    b = onepole_lp(noise(int(SR * 0.05), seed + 3), 0.4)
    b = [v * math.exp(-i / (SR * 0.012)) for i, v in enumerate(b)]
    out = [v * 1.2 for v in a]
    add(out, 0.004, [v * 1.6 for v in b])
    return out


RECIPE = {
    "thud": thud, "brush": brush, "pop": pop, "whoosh": whoosh,
    "crackle": crackle, "flutter": flutter, "stamp": stamp,
}


def main():
    cues_path, out_path = sys.argv[1], sys.argv[2]
    dur = float(sys.argv[3]) if len(sys.argv) > 3 else 10.0
    data = json.load(open(cues_path, encoding="utf-8"))
    cues = data["cues"] if isinstance(data, dict) else data
    buf = [0.0] * int(SR * dur)
    for i, c in enumerate(cues):
        fn = RECIPE[c["type"]]
        kw = {k: v for k, v in c.items() if k not in ("type", "t", "gain")}
        sig = fn(seed=100 + i * 7, **kw)
        add(buf, float(c["t"]), sig, float(c.get("gain", 1.0)))
    peak = max(1e-9, max(abs(v) for v in buf))
    norm = 0.72 / peak
    frames = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v * norm)) * 32767)) for v in buf)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(frames)
    print(f"sfx: {out_path}  {dur}s  {len(cues)} cues  peak->{20*math.log10(0.72):.1f} dBFS")


if __name__ == "__main__":
    main()
