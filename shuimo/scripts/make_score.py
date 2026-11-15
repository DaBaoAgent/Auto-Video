#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""shuimo · 水墨配乐 + 音效合成（纯标准库，确定性）。

读 cues.json，写 audio/score.wav（48 kHz 立体声，duration 秒）。
72 BPM，D 羽调五声；Karplus-Strong 古琴拨弦、低频气声 drone、木鱼/鼓点、
水滴滴答、毛笔擦纸、落印闷响。所有事件锁在 cues.json 的 scenes/sfx 上。
同一份 cues -> 同一个 WAV，逐字节一致。

用法：
  python shuimo/scripts/make_score.py shuimo/projects/yuren30/cues.json \
      shuimo/projects/yuren30/audio/score.wav
"""
import json, math, os, random, struct, sys, wave
from array import array

SR = 48000

# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def db(x): return 10.0 ** (x / 20.0)
def saw(ph): return 2.0 * (ph - math.floor(ph)) - 1.0
def tri(ph): return 4.0 * abs(ph - math.floor(ph) - 0.5) - 1.0

def noise(n, seed):
    r = random.Random(seed)
    return [r.uniform(-1.0, 1.0) for _ in range(n)]

def lp1(x, hz):
    a = 1.0 - math.exp(-2.0 * math.pi * hz / SR)
    y = 0.0; out = []
    for v in x:
        y += (v - y) * a
        out.append(y)
    return out

def hp1(x, hz):
    a = 1.0 - math.exp(-2.0 * math.pi * hz / SR)
    y = 0.0; out = []
    for v in x:
        y += (v - y) * a
        out.append(v - y)
    return out

def add(buf, t, sig, gain=1.0):
    i0 = int(round(t * SR)); n = len(buf)
    for i, v in enumerate(sig):
        j = i0 + i
        if 0 <= j < n: buf[j] += v * gain

def add_st(L, R, t, sig, gain=1.0, pan=0.0):
    g = clamp(abs(pan), 0.0, 0.95)
    if pan > 0: gl, gr = gain * math.sqrt(0.5 * (1 - g)), gain * math.sqrt(0.5 * (1 + g))
    elif pan < 0: gl, gr = gain * math.sqrt(0.5 * (1 + g)), gain * math.sqrt(0.5 * (1 - g))
    else: gl = gr = gain * 0.7071
    add(L, t, sig, gl); add(R, t, sig, gr)

def hz(midi): return 440.0 * 2 ** ((midi - 69) / 12.0)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def midi_of(name):
    n = NOTE[name[:-1]]; o = int(name[-1]); return 12 * (o + 1) + n

# D 羽调（D 小调五声）
D2, A2, D3, F3, G3, A3, C4, D4, F4, G4, A4, C5, D5, F5, A5 = (
    hz(midi_of(x)) for x in ['D2', 'A2', 'D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'A5'])

# ---------------------------------------------------------------- instruments
def pluck(f, dur=2.6, seed=1, bright=0.5, damp=0.9975):
    """Karplus-Strong 拨弦：古琴/古筝的短促起音 + 长余韵。"""
    n = int(dur * SR); N = max(2, int(SR / f))
    rnd = random.Random(seed)
    buf = [rnd.uniform(-1.0, 1.0) for _ in range(N)]
    # 拨片位置（comb）让起音更亮
    pos = max(1, int(N * (0.12 + 0.1 * bright)))
    out = [0.0] * n
    prev = 0.0
    for i in range(n):
        idx = i % N
        v = buf[idx]
        out[i] = v
        nxt = 0.5 * (v + buf[(idx + 1) % N]) * damp
        buf[idx] = nxt
    # 起音瞬间的高频噪声
    m = min(n, int(0.012 * SR))
    nz = noise(m, seed + 7)
    for i in range(m):
        out[i] += nz[i] * 0.18 * (1 - i / m)
    # 琴身低频共鸣
    body = lp1(out, 240.0)
    for i in range(n):
        out[i] = out[i] * 0.82 + body[i] * 0.30
    # 尾音缓出
    fd = min(n, int(0.25 * SR))
    for i in range(fd):
        out[n - fd + i] *= (fd - i) / fd
    return out

def bell(f, dur=3.6, gain=1.0):
    n = int(dur * SR); out = [0.0] * n
    parts = [(1.0, 1.0, 3.0), (2.01, 0.42, 2.2), (2.98, 0.28, 1.6), (4.16, 0.16, 1.1), (5.43, 0.09, 0.7)]
    for mul, g, tau in parts:
        ph = 0.0; inc = f * mul / SR
        for i in range(n):
            out[i] += math.sin(2 * math.pi * ph) * math.exp(-i / (tau * SR)) * g
            ph += inc
    return out

def drum(f0=92.0, dur=1.2, gain=1.0, soft=False):
    n = int(dur * SR); ph = 0.0; out = [0.0] * n
    for i in range(n):
        u = i / n
        f = (f0 * (0.55 if soft else 0.75)) * math.exp(-u * 6.0) + 34.0
        ph += f / SR
        out[i] = math.sin(2 * math.pi * ph) * math.exp(-u * (3.2 if soft else 4.0))
    nz = lp1(noise(min(n, int(0.25 * SR)), 301), 260.0 if soft else 420.0)
    for i in range(len(nz)):
        out[i] += nz[i] * math.exp(-i / (0.06 * SR)) * (0.22 if soft else 0.34)
    return out

def woodblock(f=1180.0, dur=0.12):
    n = int(dur * SR); out = [0.0] * n
    nz = hp1(noise(n, int(f)), f * 0.8)
    for i in range(n):
        u = i / n
        out[i] = (math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 26) * 0.7
                  + nz[i] * math.exp(-u * 40) * 0.35)
    return out

def brush(dur=0.7, seed=1, bright=0.5):
    n = int(dur * SR); nz = noise(n, seed)
    a0 = 900.0 + 1500.0 * bright
    out = []; y = 0.0; z = 0.0
    aa = 1.0 - math.exp(-2.0 * math.pi * a0 / SR)
    for i in range(n):
        u = i / n
        y += (nz[i] - y) * aa
        z += (y - z) * 0.25
        out.append((y - z * 0.6) * math.sin(math.pi * u) ** 1.4)
    return out

def drip(f0=1500.0, dur=0.5, seed=3):
    n = int(dur * SR); out = [0.0] * n
    ph = 0.0
    for i in range(n):
        u = i / n
        f = f0 * (1.0 - 0.55 * min(1.0, u * 6.0))
        ph += f / SR
        out[i] = math.sin(2 * math.pi * ph) * math.exp(-u * 14.0)
    # 两次延迟反射
    for d, g in [(0.075, 0.28), (0.145, 0.14)]:
        k = int(d * SR)
        for i in range(n - k):
            out[i + k] += out[i] * g
    return out

def stamp():
    a = drum(70.0, 0.9, soft=True)
    b = brush(0.22, 771, bright=0.3)
    n = max(len(a), len(b)); out = [0.0] * n
    for i in range(n):
        out[i] = (a[i] if i < len(a) else 0.0) * 0.8 + (b[i] if i < len(b) else 0.0) * 0.35
    return out

def slice_swish(dur=0.6, seed=5):
    n = int(dur * SR); nz = noise(n, seed)
    out = []; y = 0.0
    for i in range(n):
        u = i / n
        a = 0.03 + 0.30 * u
        y += (nz[i] - y) * a
        out.append(y * (u ** 0.6) * (1.0 - u) * 1.6)
    return out

def ink_plop(seed=9, dur=0.4):
    n = int(dur * SR); out = [0.0] * n
    nz = lp1(noise(n, seed), 900.0)
    for i in range(n):
        u = i / n
        out[i] = nz[i] * math.exp(-u * 12.0) * 0.7 + math.sin(2 * math.pi * (180 - 90 * u) * i / SR) * math.exp(-u * 10.0) * 0.5
    return out

def droplet_arp(f, seed=1, dur=0.7):
    return drip(f, dur, seed)

# ---------------------------------------------------------------- score
class Score:
    def __init__(self, dur):
        self.n = int(round(dur * SR))
        self.musicL = [0.0] * self.n; self.musicR = [0.0] * self.n
        self.sfxL = [0.0] * self.n; self.sfxR = [0.0] * self.n

    def drone(self, t0, dur, roots, gain=0.10, air=0.06, seed=11):
        n = int(dur * SR); a = max(1, int(1.4 * SR)); r = max(1, int(1.2 * SR))
        L = [0.0] * n; R = [0.0] * n
        rnd = random.Random(seed)
        nzL = lp1(noise(n, seed), 140.0); nzR = lp1(noise(n, seed + 1), 140.0)
        for k, f in enumerate(roots):
            phL = rnd.random(); phR = rnd.random()
            dL = f * (1.0 + 0.0012 * (k + 1)); dR = f * (1.0 - 0.0011 * (k + 1))
            for i in range(n):
                L[i] += math.sin(2 * math.pi * phL) * (0.7 if k else 1.0)
                R[i] += math.sin(2 * math.pi * phR) * (0.7 if k else 1.0)
                phL += dL / SR; phR += dR / SR
        for i in range(n):
            L[i] = L[i] * gain + nzL[i] * air
            R[i] = R[i] * gain + nzR[i] * air
            e = 1.0
            if i < a: e = i / a
            if i > n - r: e = min(e, (n - i) / r)
            L[i] *= e; R[i] *= e
        add(self.musicL, t0, L); add(self.musicR, t0, R)

    def note(self, t0, f, gain=0.08, pan=0.0, dur=2.6, seed=1, bright=0.5):
        sig = pluck(f, dur, seed, bright)
        add_st(self.musicL, self.musicR, t0, sig, gain, pan)

    def bowl(self, t0, f, gain=0.06, pan=0.0, dur=3.6):
        add_st(self.musicL, self.musicR, t0, bell(f, dur), gain, pan)


def build(cues):
    dur = float(cues.get("duration", 30.0))
    sc = Score(dur)

    # ---- 低频底：整段两层 drone，段落换根音
    sc.drone(0.0, 13.4, [D2, A2, D3], gain=0.085, air=0.045, seed=11)
    sc.drone(13.2, 6.4, [D2, A2, F3], gain=0.075, air=0.045, seed=12)
    sc.drone(19.2, 5.4, [A2 * 0.5, A2, D3], gain=0.070, air=0.040, seed=13)
    sc.drone(24.3, 5.8, [D2, A2, D3, A3], gain=0.080, air=0.040, seed=14)

    # ---- 拨弦：每个叙事节点一颗音
    notes = [
        (0.18, D3, 0.075, -0.18), (1.62, A3, 0.060, 0.20), (2.26, D3, 0.080, 0.0),
        (3.30, F3, 0.065, -0.10), (3.64, D4, 0.080, 0.10), (4.92, F4, 0.070, -0.16),
        (5.74, G4, 0.068, 0.18), (6.76, A4, 0.075, 0.0), (8.86, A3, 0.060, 0.22),
        (9.90, C4, 0.070, -0.18), (10.60, D4, 0.060, 0.25), (11.60, F4, 0.062, -0.20),
        (12.60, A4, 0.070, 0.0), (13.42, F4, 0.075, -0.22), (14.00, D4, 0.070, 0.16),
        (15.90, C4, 0.068, -0.12), (17.20, A3, 0.070, 0.18), (18.36, D4, 0.060, 0.0),
        (19.96, F4, 0.058, -0.20), (21.20, D4, 0.052, 0.20), (22.34, A3, 0.060, 0.0),
        (23.50, D3, 0.070, 0.0), (24.40, A3, 0.055, -0.25), (25.00, C4, 0.060, 0.25),
        (25.44, D4, 0.090, 0.0), (26.40, F4, 0.070, -0.20), (27.10, G4, 0.065, 0.20),
        (27.80, A4, 0.068, -0.15), (28.55, C5, 0.062, 0.15), (29.38, D5, 0.075, 0.0),
    ]
    for i, (t, f, g, p) in enumerate(notes):
        sc.note(t, f, g, p, dur=2.2 + 0.6 * (i % 3), seed=100 + i, bright=0.45 + 0.2 * (i % 2))
    # 冰下河：高音泛音
    for i, (t, f) in enumerate([(10.1, A4 * 2), (11.0, C5 * 2), (12.0, D5 * 2), (12.9, A5)]):
        sc.bowl(t, f, 0.030, pan=0.25 if i % 2 else -0.25, dur=2.8)

    # ---- 鼓 / 木鱼 / 落印
    for t, g, soft in [(2.26, 0.42, False), (3.30, 0.30, True), (13.42, 0.34, False),
                       (15.90, 0.26, True), (19.96, 0.30, False), (22.34, 0.22, True),
                       (25.44, 0.52, False)]:
        add_st(sc.sfxL, sc.sfxR, t, drum(92.0, 1.2, soft=soft), g, 0.0)
    add_st(sc.sfxL, sc.sfxR, 25.50, stamp(), 0.55, 0.0)
    add_st(sc.sfxL, sc.sfxR, 29.38, bell(D5, 4.2), 0.10, 0.0)

    # 43 天：加速木鱼
    t = 24.40
    k = 0
    while t < 25.36:
        add_st(sc.sfxL, sc.sfxR, t, woodblock(1050 + 180 * (k % 3), 0.10),
               0.030 + 0.060 * clamp((t - 24.4) / 0.96), -0.2 if k % 2 else 0.2)
        k += 1
        t += 0.115 * (1.0 - 0.45 * clamp((t - 24.4) / 0.96))

    # ---- 段落音效
    rnd = random.Random(20261030)
    for c in cues.get("sfx", []):
        t0 = float(c["t"]); typ = c["type"]; g = db(float(c.get("gain", -12)))
        pan = float(c.get("pan", 0.0)); dur_s = float(c.get("dur", 0.0))
        if typ == "brush": sig = brush(dur_s or 0.7, rnd.randint(0, 9999), 0.55)
        elif typ == "brush_soft": sig = brush(dur_s or 0.5, rnd.randint(0, 9999), 0.25)
        elif typ == "drip": sig = drip(float(c.get("f", 1400 + 400 * rnd.random())), dur_s or 0.5, rnd.randint(0, 9999))
        elif typ == "stamp": sig = stamp()
        elif typ == "ink": sig = ink_plop(rnd.randint(0, 9999), dur_s or 0.4)
        elif typ == "slice": sig = slice_swish(dur_s or 0.6, rnd.randint(0, 9999))
        elif typ == "wood": sig = woodblock(float(c.get("f", 1180)), 0.12)
        elif typ == "bell": sig = bell(float(c.get("f", D5)), dur_s or 3.0)
        elif typ == "drum": sig = drum(92.0, 1.2, soft=bool(c.get("soft")))
        else: continue
        add_st(sc.sfxL, sc.sfxR, t0, sig, g, pan)

    return sc

# ---------------------------------------------------------------- master
def write_wav(path, L, R):
    data = array('h')
    for i in range(len(L)):
        data.append(int(clamp(L[i], -1.0, 1.0) * 32767))
        data.append(int(clamp(R[i], -1.0, 1.0) * 32767))
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data.tobytes())

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    cues_path, out_path = sys.argv[1], sys.argv[2]
    cues = json.load(open(cues_path, encoding='utf-8'))
    sc = build(cues)
    n = sc.n
    mixL = [0.0] * n; mixR = [0.0] * n
    for i in range(n):
        mixL[i] = sc.musicL[i] * 0.95 + sc.sfxL[i]
        mixR[i] = sc.musicR[i] * 0.95 + sc.sfxR[i]
    # 结尾 0.55s 淡出，30.000 硬切不爆音
    fd = int(0.55 * SR)
    for i in range(max(0, n - fd), n):
        g = (n - i) / fd
        mixL[i] *= g; mixR[i] *= g
    pk = max(1e-9, max(max(abs(v) for v in mixL), max(abs(v) for v in mixR)))
    g = 0.72 / pk
    for i in range(n):
        mixL[i] = math.tanh(mixL[i] * g * 1.1) * 0.92
        mixR[i] = math.tanh(mixR[i] * g * 1.1) * 0.92
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    write_wav(out_path, mixL, mixR)
    def rms_at(t, d=0.2):
        a = int(t * SR); b = min(n, a + int(d * SR))
        if a >= n: return -99.0
        s = 0.0
        for i in range(a, b): s += mixL[i] * mixL[i]
        return 10 * math.log10(max(1e-12, s / max(1, b - a)))
    print(f"score: {out_path}  {n/SR:.3f}s  peak={pk:.3f}")
    for t in [0.3, 2.3, 3.6, 6.8, 9.0, 10.2, 12.0, 14.5, 19.5, 22.3, 24.8, 25.5, 28.0, 29.5]:
        print(f"  RMS {t:5.1f}s: {rms_at(t):6.1f} dBFS")

if __name__ == '__main__':
    main()
