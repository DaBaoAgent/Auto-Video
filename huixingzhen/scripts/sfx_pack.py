#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""paperclip_zhou 扩展音效合成器 —— 33 种配方（纯标准库，种子确定性）。
沿用 shouhui sfx_build.py 的设计原则：音效是点/BGM 是面/人声为主；cue 落在动作帧 <1 帧误差。
用法：python sfx_pack.py cues.json out.wav [dur]"""
import json, math, random, struct, sys, wave

SR = 48000

def env_exp(n, tau):
    return [math.exp(-i / (SR * tau)) for i in range(n)]

def noise(n, seed):
    r = random.Random(seed)
    return [r.uniform(-1, 1) for _ in range(n)]

def lp(x, a):
    y, out = 0.0, []
    for v in x:
        y += (v - y) * a
        out.append(y)
    return out

def hp(x, a):
    y, out = 0.0, []
    for v in x:
        y2 = v - y
        y += (v - y) * a
        out.append(y2)
    return out

def bp(x, lo, hi):           # 简易带通
    return hp(lp(x, hi), lo)

def add(buf, start, sig, gain=1.0):
    i0 = int(start * SR)
    for i, v in enumerate(sig):
        j = i0 + i
        if 0 <= j < len(buf):
            buf[j] += v * gain

def sine(f, n, glide=0.0):
    ph = 0.0
    out = []
    for i in range(n):
        f2 = f * (1 + glide * i / n)
        ph += 2 * math.pi * f2 / SR
        out.append(math.sin(ph))
    return out

def env_ar(n, atk, rel):
    return [min(1.0, i / (SR * atk)) * math.exp(-i / (SR * rel)) for i in range(n)]

# ---------------- 基础素材 ----------------
def _thud(seed=1, f=88.0, dur=0.28, punch=2.2):
    n = int(SR * dur)
    nz = lp(noise(n, seed), 0.02)
    e = env_exp(n, dur * 0.22)
    return [(math.sin(2 * math.pi * f * i / SR) * 0.9 + nz[i] * punch) * e[i] for i in range(n)]

def _noise_burst(seed, dur, lo, hi, shape=1.3):
    n = int(SR * dur)
    nz = bp(noise(n, seed), lo, hi)
    return [nz[i] * math.sin(math.pi * i / n) ** shape for i in range(n)]

def _pop(seed=3, f=760.0, dur=0.13):
    n = int(SR * dur)
    e = env_exp(n, dur * 0.3)
    return [math.sin(2 * math.pi * f * i / SR * (1 + 0.9 * i / n)) * e[i] for i in range(n)]

def _brush(seed=2, dur=1.0, rate=0.55):
    n = int(SR * dur)
    nz = hp(lp(noise(n, seed), 0.55), 0.03)
    out = []
    for i in range(n):
        u = i / n
        mod = 0.55 + 0.45 * math.sin(2 * math.pi * rate * u + 0.7) * math.sin(2 * math.pi * 3.1 * u)
        out.append(nz[i] * mod * (0.4 if u > 0.94 else 1.0))
    return out

def _crackle(seed=5, dur=1.0, density=26, fmin=900, fmax=2600):
    n = int(SR * dur)
    out = [0.0] * n
    r = random.Random(seed)
    for _ in range(int(density * dur)):
        t0 = r.uniform(0, dur)
        f = r.uniform(fmin, fmax)
        ln = int(SR * 0.012)
        e = env_exp(ln, 0.004)
        add(out, t0, [math.sin(2 * math.pi * f * i / SR) * e[i] * r.uniform(0.25, 1.0) for i in range(ln)])
    body = lp(noise(n, seed + 1), 0.08)
    return [out[i] * 0.9 + body[i] * 0.25 for i in range(n)]

def _stamp(seed=7, f=62.0):
    a = _thud(seed, f, 0.20)
    b = lp(noise(int(SR * 0.05), seed + 3), 0.4)
    b = [v * math.exp(-i / (SR * 0.012)) for i, v in enumerate(b)]
    out = [v * 1.2 for v in a]
    add(out, 0.004, [v * 1.6 for v in b])
    return out

# ---------------- 33 种配方 ----------------
def r_thud(s=None, **k):        return _thud(s, k.get("f", 88.0), k.get("dur", 0.28))
def r_deep_boom(s=None, **k):   return _thud(s, k.get("f", 46.0), k.get("dur", 0.5), punch=3.0)
def r_step(s=None, **k):        return _thud(s, k.get("f", 96.0), k.get("dur", 0.22), punch=1.6)
def r_stamp(s=None, **k):       return _stamp(s, 62.0)
def r_stamp_deep(s=None, **k):  return _stamp(s, 48.0)
def r_axe_impact(s=None, **k):
    """斧/钺劈入地面：锐噪切 + 低闷 + 碎屑噼啪"""
    n = int(SR * 0.6)
    cut = hp(noise(n, s), 0.35)
    cut = [cut[i] * env_exp(n, 0.03)[i] for i in range(n)]
    low = _thud(s + 1, 55.0, 0.4, punch=2.6)
    deb = _crackle(s + 2, 0.45, density=60, fmin=1400, fmax=5200)
    out = [0.0] * n
    add(out, 0.0, cut, 0.9)
    add(out, 0.012, low, 1.0)
    add(out, 0.03, deb, 0.5)
    return out
def r_axe_swing(s=None, **k):
    """重武器挥动：宽频带通噪声，中心频率快速下扫，尾音急收"""
    n = int(SR * 0.42)
    nz = noise(n, s)
    out, y = [], 0.0
    for i in range(n):
        u = i / n
        a = 0.45 - 0.35 * u                     # 由亮转闷
        y += (nz[i] - y) * a
        out.append((nz[i] - y) * math.sin(math.pi * u) ** 0.8)
    return out
def r_slice(s=None, **k):
    n = int(SR * 0.22)
    nz = hp(noise(n, s), 0.25)
    return [nz[i] * math.exp(-i / (SR * 0.045)) for i in range(n)]
def r_whoosh(s=None, **k):
    n = int(SR * k.get("dur", 0.55))
    nz = noise(n, s)
    out, y = [], 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.5 * u * u
        y += (nz[i] - y) * a
        out.append((nz[i] - y) * math.sin(math.pi * u) ** 1.4)
    return out
def r_whoosh_low(s=None, **k):
    n = int(SR * k.get("dur", 0.6))
    nz = noise(n, s)
    out, y = [], 0.0
    for i in range(n):
        u = i / n
        a = 0.008 + 0.1 * u
        y += (nz[i] - y) * a
        out.append((nz[i] - y) * math.sin(math.pi * u) ** 1.2)
    return out
def r_swish(s=None, **k):
    return _noise_burst(s, k.get("dur", 0.18), 0.2, 0.5, 1.0)
def r_pop(s=None, **k):         return _pop(s, k.get("f", 760.0), k.get("dur", 0.13))
def r_blip(s=None, **k):
    n = int(SR * 0.09)
    e = env_ar(n, 0.004, 0.03)
    return [math.sin(2 * math.pi * k.get("f", 1200) * i / SR) * e[i] for i in range(n)]
def r_tick(s=None, **k):
    n = int(SR * 0.03)
    nz = hp(noise(n, s), 0.3)
    return [nz[i] * math.exp(-i / (SR * 0.006)) for i in range(n)]
def r_click(s=None, **k):
    n = int(SR * 0.05)
    a = _pop(s, 2400.0, 0.03)
    b = hp(noise(n, s + 1), 0.4)
    return [a[i] if i < len(a) else 0.0 for i in range(n)]
def r_chime(s=None, **k):
    n = int(SR * 0.9)
    f = k.get("f", 1320.0)
    e = env_exp(n, 0.28)
    return [(math.sin(2 * math.pi * f * i / SR) + 0.4 * math.sin(2 * math.pi * f * 2.76 * i / SR)) * e[i] * 0.6 for i in range(n)]
def r_ding(s=None, **k):
    n = int(SR * 0.5)
    f = k.get("f", 1760.0)
    e = env_exp(n, 0.12)
    return [math.sin(2 * math.pi * f * i / SR) * e[i] for i in range(n)]
def r_sparkle(s=None, **k):
    n = int(SR * 0.7)
    out = [0.0] * n
    r = random.Random(s)
    for _ in range(26):
        t0 = r.uniform(0, 0.5)
        f = r.uniform(2000, 5200)
        ln = int(SR * 0.06)
        e = env_exp(ln, 0.02)
        add(out, t0, [math.sin(2 * math.pi * f * i / SR) * e[i] for i in range(ln)], r.uniform(0.2, 0.5))
    return out
def r_shimmer(s=None, **k):
    n = int(SR * 0.9)
    out = []
    r = random.Random(s)
    for i in range(n):
        u = i / n
        f = 1800 + 900 * math.sin(2 * math.pi * 1.7 * u)
        g = math.sin(math.pi * u) ** 1.5
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.4 + (r.uniform(-1, 1) * 0.15)) * g)
    return out
def r_rise(s=None, **k):
    n = int(SR * 0.55)
    out = []
    for i in range(n):
        u = i / n
        f = 300 * (1 + 2.2 * u * u)
        out.append(math.sin(2 * math.pi * f * i / SR) * math.sin(math.pi * u) * 0.5)
    return out
def r_dive(s=None, **k):
    n = int(SR * 0.55)
    out = []
    for i in range(n):
        u = i / n
        f = 1400 * (1 - 0.7 * u)
        out.append(math.sin(2 * math.pi * f * i / SR) * math.sin(math.pi * u) * 0.5)
    return out
def r_pulse(s=None, **k):
    n = int(SR * 0.4)
    f = k.get("f", 220.0)
    out = []
    for i in range(n):
        u = i / n
        g = 0.5 * math.sin(math.pi * u)
        out.append((math.sin(2 * math.pi * f * i / SR) + 0.5 * math.sin(2 * math.pi * f * 1.5 * i / SR)) * g)
    return out
def r_bronze_ring(s=None, **k):
    """青铜器敲击鸣响：非谐泛音列慢衰减"""
    n = int(SR * 1.4)
    f = k.get("f", 320.0)
    parts = [(1.0, 1.0), (0.6, 1.52), (0.4, 2.31), (0.25, 3.17), (0.15, 4.36)]
    out = [0.0] * n
    for amp, mul in parts:
        e = env_exp(n, 0.55 / mul)
        tone = sine(f * mul, n)
        for i in range(n):
            out[i] += tone[i] * e[i] * amp * 0.35
    hit = hp(noise(int(SR * 0.02), s), 0.3)
    add(out, 0, [h * 0.8 * math.exp(-i / (SR * 0.008)) for i, h in enumerate(hit)])
    return out
def r_metal_clang(s=None, **k):
    n = int(SR * 0.35)
    f = k.get("f", 520.0)
    out = [0.0] * n
    for amp, mul in [(1.0, 1.0), (0.7, 2.0), (0.5, 2.9)]:
        e = env_exp(n, 0.07)
        tone = sine(f * mul, n)
        for i in range(n):
            out[i] += tone[i] * e[i] * amp * 0.4
    nz = hp(noise(n, s), 0.35)
    for i in range(n):
        out[i] += nz[i] * math.exp(-i / (SR * 0.01)) * 0.9
    return out
def r_stone_hit(s=None, **k):
    n = int(SR * 0.25)
    nz = lp(noise(n, s), 0.12)
    e = env_exp(n, 0.04)
    low = sine(k.get("f", 140.0), n)
    return [(nz[i] * 1.6 + low[i] * 0.5) * e[i] for i in range(n)]
def r_jade_tick(s=None, **k):
    n = int(SR * 0.14)
    f = k.get("f", 2100.0)
    e = env_exp(n, 0.035)
    return [(math.sin(2 * math.pi * f * i / SR) + 0.3 * math.sin(2 * math.pi * f * 2.4 * i / SR)) * e[i] for i in range(n)]
def r_paper_flip(s=None, **k):
    n = int(SR * 0.3)
    nz = bp(noise(n, s), 0.12, 0.6)
    out = []
    for i in range(n):
        u = i / n
        g = math.sin(math.pi * min(1.0, u * 1.4)) ** 0.7
        out.append(nz[i] * g * (0.4 + 0.6 * u))
    return out
def r_cloth(s=None, **k):
    return _brush(s, k.get("dur", 0.7), 0.7)
def r_fan_swish(s=None, **k):
    """团扇扇动：柔布气声，两次起伏"""
    n = int(SR * 0.8)
    nz = bp(noise(n, s), 0.06, 0.35)
    out = []
    for i in range(n):
        u = i / n
        g = abs(math.sin(2 * math.pi * 1.25 * u)) ** 1.3
        out.append(nz[i] * g)
    return out
def r_pen_draw(s=None, **k):
    """引线描画：细密高频沙沙，音量微起伏"""
    n = int(SR * 0.35)
    nz = hp(noise(n, s), 0.25)
    out = []
    for i in range(n):
        u = i / n
        g = 0.5 + 0.5 * math.sin(2 * math.pi * 6 * u)
        out.append(nz[i] * g * math.sin(math.pi * u))
    return out
def r_crackle(s=None, **k):     return _crackle(s, k.get("dur", 1.0), k.get("density", 26))
def r_cascade(s=None, **k):
    """连珠点亮：上行 crackle + 轻微 rise"""
    a = _crackle(s, k.get("dur", 0.7), 70, 1500, 4200)
    n = int(SR * 0.55)
    r_ = []
    for i in range(n):
        u = i / n
        f = 500 * (1 + 1.8 * u)
        r_.append(math.sin(2 * math.pi * f * i / SR) * math.sin(math.pi * u) * 0.22)
    out = [0.0] * max(len(a), len(r_))
    add(out, 0, a, 1.0)
    add(out, 0, r_, 1.0)
    return out
def r_flutter(s=None, **k):
    n = int(SR * 1.0)
    nz = hp(noise(n, s), 0.12)
    r = random.Random(s)
    out = []
    for i in range(n):
        u = i / n
        g = (1 - u) * (0.35 + 0.65 * abs(math.sin(2 * math.pi * r.uniform(4, 9) * u)))
        out.append(nz[i] * g)
    return out
def r_punch(s=None, **k):
    """挥拳命中：短 whoosh + 肉感 thud"""
    n = int(SR * 0.35)
    w = _noise_burst(s, 0.12, 0.1, 0.5, 0.9)
    t = _thud(s + 1, 82.0, 0.3, punch=2.4)
    out = [0.0] * n
    add(out, 0, w, 0.8)
    add(out, 0.05, t, 1.0)
    return out
def r_slap(s=None, **k):
    n = int(SR * 0.12)
    nz = bp(noise(n, s), 0.15, 0.7)
    return [nz[i] * math.exp(-i / (SR * 0.018)) for i in range(n)]
def r_swoosh_up(s=None, **k):
    n = int(SR * 0.4)
    nz = noise(n, s)
    out, y = [], 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.4 * u
        y += (nz[i] - y) * a
        out.append((nz[i] - y) * math.sin(math.pi * u) * (0.4 + 0.6 * u))
    return out
def r_hum_rise(s=None, **k):
    """低频渐强（相机大移前的蓄势）"""
    n = int(SR * 0.7)
    out = []
    for i in range(n):
        u = i / n
        f = 60 + 30 * u
        out.append(math.sin(2 * math.pi * f * i / SR) * (0.15 + 0.45 * u) * math.sin(math.pi * u) ** 0.5)
    return out

RECIPE = {
    "thud": r_thud, "deep_boom": r_deep_boom, "step": r_step,
    "stamp": r_stamp, "stamp_deep": r_stamp_deep,
    "axe_impact": r_axe_impact, "axe_swing": r_axe_swing, "slice": r_slice,
    "whoosh": r_whoosh, "whoosh_low": r_whoosh_low, "swish": r_swish, "swoosh_up": r_swoosh_up,
    "pop": r_pop, "blip": r_blip, "tick": r_tick, "click": r_click,
    "chime": r_chime, "ding": r_ding, "sparkle": r_sparkle, "shimmer": r_shimmer,
    "rise": r_rise, "dive": r_dive, "pulse": r_pulse, "hum_rise": r_hum_rise,
    "bronze_ring": r_bronze_ring, "metal_clang": r_metal_clang,
    "stone_hit": r_stone_hit, "jade_tick": r_jade_tick,
    "paper_flip": r_paper_flip, "cloth": r_cloth, "fan_swish": r_fan_swish,
    "pen_draw": r_pen_draw, "crackle": r_crackle, "cascade": r_cascade,
    "flutter": r_flutter, "punch": r_punch, "slap": r_slap,
}

def main():
    cues_path, out_path = sys.argv[1], sys.argv[2]
    dur = float(sys.argv[3]) if len(sys.argv) > 3 else 20.0
    data = json.load(open(cues_path, encoding="utf-8"))
    cues = data["cues"] if isinstance(data, dict) else data
    buf = [0.0] * int(SR * dur)
    for i, c in enumerate(cues):
        fn = RECIPE[c["type"]]
        kw = {k: v for k, v in c.items() if k not in ("type", "t", "gain")}
        sig = fn(100 + i * 7, **kw)
        add(buf, float(c["t"]), sig, float(c.get("gain", 1.0)))
    peak = max(1e-9, max(abs(v) for v in buf))
    norm = 0.72 / peak
    frames = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v * norm)) * 32767)) for v in buf)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(frames)
    kinds = sorted({c["type"] for c in cues})
    print(f"sfx: {out_path}  {dur}s  {len(cues)} cues  {len(kinds)} kinds  peak->-2.9 dBFS")
    print("kinds:", ", ".join(kinds))

if __name__ == "__main__":
    main()
