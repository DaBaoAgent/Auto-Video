# -*- coding: utf-8 -*-
"""001_血之海滩 第一大段（0–21.46 s）音床：低频 drone + 雨 + 心跳 + 磁带 wow + sting。
输出 out/audio_raw.wav（44.1k / mono / s16），响度在 ffmpeg 端用 loudnorm 归一。
"""
import json, math, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SR = 44100
cues = json.load(open(os.path.join(PROJ, "cues.json"), encoding="utf-8"))
DUR = float(cues["duration"])
N = int(DUR * SR)
rng = np.random.default_rng(20261118)
t = np.arange(N) / SR

def env(a, d, s_=0.0, r=0.4, atk=0.01):
    """简易 ADSR 包络"""
    e = np.zeros_like(t)
    a_n, r_n = int(atk * SR), int(r * SR)
    e[:a_n] = np.linspace(0, 1, a_n)
    e[a_n:] = np.exp(-(t[a_n:] - t[a_n]) / max(1e-3, d))
    return e

mix = np.zeros(N)

# ---------------- 低频 drone：两个相差五度的正弦 + 极低频 LFO
f0 = 55.0
drone = 0.55 * np.sin(2 * np.pi * f0 * t) + 0.3 * np.sin(2 * np.pi * f0 * 1.5 * t + 0.4)
drone += 0.18 * np.sin(2 * np.pi * f0 * 2.01 * t)
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t - 1.2)
drone *= 0.10 * (0.55 + 0.45 * lfo)
drone[: int(1.4 * SR)] *= np.linspace(0, 1, int(1.4 * SR))
drone[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))
mix += drone

# ---------------- 雨：带限噪声（一阶高通 + 一阶低通）
nz = rng.standard_normal(N)
hp = np.zeros(N); a_hp = 0.86
for i in range(1, N):
    hp[i] = a_hp * (hp[i - 1] + nz[i] - nz[i - 1])
lp = np.zeros(N); a_lp = 0.55
for i in range(1, N):
    lp[i] = lp[i - 1] + a_lp * (hp[i] - lp[i - 1])
rain = lp * 0.05
rain *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.23 * t)
mix += rain

# ---------------- 心跳：两下为一组，越往后略快
hb = np.zeros(N)
for k in range(9):
    t0 = 2.0 + k * 2.15
    for j, off in enumerate((0.0, 0.30)):
        i0 = int((t0 + off) * SR)
        if i0 >= N:
            continue
        n = int(0.16 * SR)
        seg = np.arange(n) / SR
        thump = np.sin(2 * np.pi * (52 - 30 * seg) * seg) * np.exp(-seg / 0.045)
        end = min(N, i0 + n)
        hb[i0:end] += thump[: end - i0] * (0.85 if j == 0 else 0.5)
mix += hb * 0.085

# ---------------- 磁带 wow / 倒带：每个切点前后一段下滑音
cuts = [float(c) for c in cues["cuts"]]
for c in cuts[1:]:
    i0 = int((c - 0.34) * SR)
    if i0 < 0:
        continue
    n = int(0.62 * SR)
    seg = np.arange(min(n, N - i0)) / SR
    f = 420 * np.exp(-seg / 0.16) + 70
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) * np.exp(-seg / 0.22) * 0.16
    mix[i0: i0 + len(tone)] += tone

# ---------------- sting：开场一记低频砸 + 12.6 片名处一记金属刀锋
def boom(at, amp=0.5, freq=44, decay=0.55):
    i0 = int(at * SR)
    n = min(int(1.6 * SR), N - i0)
    if n <= 0:
        return
    seg = np.arange(n) / SR
    s = np.sin(2 * np.pi * (freq * np.exp(-seg / 0.5)) * seg) * np.exp(-seg / decay)
    mix[i0: i0 + n] += s * amp

def sting(at, amp=0.3):
    i0 = int(at * SR)
    n = min(int(0.9 * SR), N - i0)
    if n <= 0:
        return
    seg = np.arange(n) / SR
    partials = [(1860, 0.5), (2790, 0.28), (4180, 0.16), (960, 0.12)]
    s = sum(a * np.sin(2 * np.pi * f * seg * (1 + 0.004 * np.sin(2 * np.pi * 6 * seg))) for f, a in partials)
    s *= np.exp(-seg / 0.28) * (1 - np.exp(-seg / 0.004))
    mix[i0: i0 + n] += s * amp

boom(0.0, 0.5)
boom(6.35, 0.22, 48, 0.5)
sting(12.55, 0.26)
boom(18.34, 0.3, 46, 0.6)

# ---------------- 总限幅 + 归一
peak = float(np.max(np.abs(mix)))
if peak > 0:
    mix *= min(1.0, 0.72 / peak)
mix = np.tanh(mix * 1.05) * 0.82

out = os.path.join(PROJ, "out", "audio_raw.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
pcm = (mix * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, len(pcm) / SR, "s", "peak", float(np.max(np.abs(mix))))
