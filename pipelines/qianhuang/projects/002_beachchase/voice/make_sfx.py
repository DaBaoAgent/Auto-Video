# -*- coding: utf-8 -*-
"""铅黄音效：刀锋（whoosh+shing+thud）、硬转场（胶片接片咔哒+闷雷）、落字（粉笔/笔尖刮纸）、底噪。
纯 Python 合成，不依赖 numpy。输出 voice/sfx.wav（48k 双声道，与成片等长）。"""
import math, os, random, wave, struct

# 音效永远写回本工程自己的 voice/sfx.wav（脚本可以被任何管线复制走）
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx.wav')

SR = 48000
DUR = 21.46
N = int(SR * DUR)
buf = [0.0] * N
rng = random.Random(20261118)


def add(t0, sig, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), N - i0)
    for k in range(n):
        buf[i0 + k] += sig[k] * gain


def nz():
    return rng.uniform(-1.0, 1.0)


# —— 刀锋挥砍：气流声 + 钢音 + 落刀闷响
def whoosh(dur=0.34):
    n = int(dur * SR)
    out = [0.0] * n
    y = 0.0
    for k in range(n):
        u = k / n
        a = 0.93 - 0.86 * u                     # 亮 → 暗：像刀刃从耳边掠过去
        y += a * (nz() - y)
        env = (math.sin(math.pi * u) ** 1.15) * (1.0 - 0.45 * u)
        out[k] = y * env
    return out


def shing(dur=0.55):
    n = int(dur * SR)
    out = [0.0] * n
    parts = [(2380, 15.0, 0.62), (3260, 19.0, 0.44), (4310, 24.0, 0.3), (6180, 33.0, 0.16)]
    for k in range(n):
        t = k / SR
        v = 0.0
        for f, d, a in parts:
            v += a * math.sin(2 * math.pi * f * t) * math.exp(-t * d)
        # 起手的一下“脆”：极短的宽带
        v += nz() * 0.35 * math.exp(-t * 160)
        out[k] = v
    return out


def thud(dur=0.28):
    n = int(dur * SR)
    out = [0.0] * n
    for k in range(n):
        t = k / SR
        v = math.sin(2 * math.pi * 66 * t) * math.exp(-t * 24)
        v += 0.4 * math.sin(2 * math.pi * 132 * t) * math.exp(-t * 34)
        v += nz() * 0.5 * math.exp(-t * 90)
        out[k] = v
    return out


# —— 硬转场：接片器咔哒，接一记闷雷
def splice():
    n = int(0.20 * SR)
    out = [0.0] * n
    for k in range(n):
        t = k / SR
        v = nz() * math.exp(-t * 220) * 1.1
        v += 0.5 * math.sin(2 * math.pi * 210 * t) * math.exp(-t * 55)
        v += 0.35 * math.sin(2 * math.pi * 78 * t) * math.exp(-t * 30)
        out[k] = v
    return out


# —— 落字：笔尖/粉笔刮纸
def tick(dur=0.08, f=1350):
    n = int(dur * SR)
    out = [0.0] * n
    prev = 0.0
    for k in range(n):
        t = k / SR
        x = nz()
        hp = x - prev; prev = x                    # 一阶高通，去低频，只剩刮擦
        out[k] = hp * 0.8 * math.exp(-t * 55) + 0.35 * math.sin(2 * math.pi * f * t) * math.exp(-t * 70)
    return out


def brush(dur=0.26):
    n = int(dur * SR)
    out = [0.0] * n
    y = 0.0
    for k in range(n):
        u = k / n
        y += 0.28 * (nz() - y)
        out[k] = y * (math.sin(math.pi * u) ** 1.5)
    return out


# —— 片名压下来的低频轰鸣
def boom(dur=1.0):
    n = int(dur * SR)
    out = [0.0] * n
    y = 0.0
    for k in range(n):
        t = k / SR
        v = math.sin(2 * math.pi * 48 * t) * math.exp(-t * 5.5)
        v += 0.5 * math.sin(2 * math.pi * 96 * t) * math.exp(-t * 8)
        v += 0.3 * math.sin(2 * math.pi * 151 * t) * math.exp(-t * 12)
        y += 0.06 * (nz() - y)
        v += y * 1.6 * math.exp(-t * 4)
        out[k] = v
    return out


def sandstep():
    n = int(0.12 * SR)
    out = [0.0] * n
    y = 0.0
    for k in range(n):
        t = k / SR
        y += 0.35 * (nz() - y)                      # 沙砾：压暗的噪声
        out[k] = y * math.exp(-t * 42)
    return out


# ---------------- 摆位 ----------------
CHOP = [5.17, 6.17, 18.12, 19.12]                  # 杰森落刀的时刻（2.25/4.35/17.30 起，cyc 1.00）
CUTS = [2.25, 4.35, 6.42, 8.45, 10.60, 12.80, 15.00, 17.30, 19.40]
CUE = [0.14, 1.59, 2.25, 3.23, 5.04, 6.35, 7.71, 9.06, 10.05, 11.33,
       12.03, 12.60, 14.20, 14.73, 15.93, 17.31, 18.34, 19.16, 20.15]
WORDS = [8.62, 9.04, 9.62, 10.06, 13.30, 14.12, 20.26]      # 手写标注
TITLE = [12.92, 13.05, 13.18, 13.31]                        # 片名四个字

for t in CHOP:
    add(t - 0.30, whoosh(), 0.85)
    add(t - 0.02, shing(0.55), 0.5)
    add(t + 0.01, thud(), 0.55)

for t in CUTS:
    add(t, splice(), 0.62)

for t in TITLE:
    add(t, tick(0.1, 1150), 0.5)
add(13.34, brush(0.22), 0.30)          # BAY OF BLOOD
add(13.82, brush(0.3), 0.55)           # 血杠那一道
add(13.82, thud(0.3), 0.3)
for t in WORDS:
    add(t, tick(0.07, 1450), 0.26)
for t in CUE:
    add(t, tick(0.045, 1700), 0.10)    # 字幕落字：很轻，只是纸的一声

# 开场：一记低频，纸还没上色
add(0.0, boom(1.4), 0.5)

# 杰森在沙上走（2.25–4.30）
t = 2.36
while t < 4.28:
    add(t, sandstep(), 0.12)
    t += 0.46

# —— 底噪：极低的房间音，把一堆碎声音黏在一起
for k in range(N):
    t = k / SR
    v = 0.02 * math.sin(2 * math.pi * 47.5 * t) * (0.85 + 0.15 * math.sin(2 * math.pi * 0.23 * t))
    v += 0.008 * math.sin(2 * math.pi * 95 * t + 1.2)
    buf[k] += v

peak = max(max(buf), -min(buf))
scale = 0.90 / peak if peak > 0 else 1.0
data = b''.join(struct.pack('<hh', int(buf[k] * scale * 32767), int(buf[k] * scale * 32767)) for k in range(N))
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data)
print('ok', DUR, 'peak', round(peak, 3))
