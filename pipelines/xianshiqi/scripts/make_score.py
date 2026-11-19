#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xianshiqi · cyberpunk-HUD darksynth score + SFX (stdlib only, deterministic).

Reads cues.json, writes a 48 kHz stereo score WAV.
Dark, cold, mechanical: D-minor drone, 8th-note bass pulses, 16th data arpeggio,
four-on-the-floor kick, gated snare on 2 & 4, HUD bleeps hard-locked to cues.
Every random draw comes from random.Random(seed) — same cues, same WAV, byte for byte.

Usage:
  python xianshiqi/scripts/make_score.py xianshiqi/projects/UAP30/cues.json \
      xianshiqi/projects/UAP30/audio/score.wav
"""
import json, math, os, random, sys, wave
from array import array

SR = 48000

# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x

def db(x): return 10.0 ** (x / 20.0)

def saw(ph): return 2.0 * (ph - math.floor(ph)) - 1.0
def sqr(ph): return 1.0 if (ph - math.floor(ph)) < 0.5 else -1.0

def env_ad(n, atk, dec, curve=1.0):
    a = max(1, int(atk * SR)); d = max(1, n - a)
    out = [0.0] * n
    for i in range(a):
        out[i] = i / a
    for i in range(d):
        out[a + i] = math.exp(-(i / d) * 6.0 * curve) * (1.0 - i / d)
    return out

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
    i0 = int(round(t * SR))
    n = len(buf)
    for i, v in enumerate(sig):
        j = i0 + i
        if 0 <= j < n:
            buf[j] += v * gain

def add_st(bufL, bufR, t, sig, gain=1.0, pan=0.0):
    g = clamp(abs(pan), 0.0, 0.95)
    if pan == 0.0:
        gl = gr = gain * 0.7071
    elif pan > 0:
        gl, gr = gain * math.sqrt(0.5 * (1.0 - g)), gain * math.sqrt(0.5 * (1.0 + g))
    else:
        gl, gr = gain * math.sqrt(0.5 * (1.0 + g)), gain * math.sqrt(0.5 * (1.0 - g))
    add(bufL, t, sig, gl); add(bufR, t, sig, gr)

def hz(midi): return 440.0 * 2 ** ((midi - 69) / 12.0)

# ---------------------------------------------------------------- score bus
class Score:
    def __init__(self, dur):
        self.n = int(round(dur * SR))
        self.musicL = [0.0] * self.n
        self.musicR = [0.0] * self.n
        self.drumL = [0.0] * self.n
        self.drumR = [0.0] * self.n
        self.sfxL = [0.0] * self.n
        self.sfxR = [0.0] * self.n
        self.kicks = []

    def pad(self, t0, dur, freqs, gain=0.10, cutoff=900.0, atk=0.3, rel=0.6):
        n = int(dur * SR); a = max(1, int(atk * SR)); r = max(1, int(rel * SR))
        L = [0.0] * n; R = [0.0] * n
        for k, f in enumerate(freqs):
            phL = (k * 0.13) % 1.0; phR = (k * 0.29 + 0.5) % 1.0
            dL = f * (1.0 + 0.0025 * (k - 1.5)); dR = f * (1.0 - 0.0025 * (k - 1.5))
            incL = dL / SR; incR = dR / SR
            for i in range(n):
                L[i] += saw(phL); R[i] += saw(phR)
                phL += incL; phR += incR
        L = lp1(L, cutoff); R = lp1(R, cutoff)
        for i in range(n):
            e = 1.0
            if i < a: e = i / a
            if i > n - r: e = min(e, (n - i) / r)
            L[i] *= e * gain; R[i] *= e * gain
        add(self.musicL, t0, L); add(self.musicR, t0, R)

    def bass(self, t0, dur, f, gain=0.24, cutoff=480.0):
        n = int(dur * SR)
        ph = 0.0; inc = f / SR
        out = []
        for i in range(n):
            v = 0.68 * saw(ph) + 0.32 * saw(ph * 0.5)
            out.append(v); ph += inc
        out = lp1(out, cutoff)
        e = env_ad(n, 0.005, max(0.02, dur - 0.005), 1.35)
        add(self.musicL, t0, [out[i] * e[i] * gain for i in range(n)])
        add(self.musicR, t0, [out[i] * e[i] * gain for i in range(n)])

    def arp(self, t0, dur, f, gain=0.055, pan=-0.25):
        n = int(dur * SR)
        ph = 0.0; inc = f / SR
        out = []
        for i in range(n):
            out.append(sqr(ph)); ph += inc
        out = lp1(out, 5200.0)
        e = env_ad(n, 0.002, max(0.02, dur - 0.002), 2.6)
        sig = [out[i] * e[i] * gain for i in range(n)]
        add_st(self.musicL, self.musicR, t0, sig, 1.0, pan)
        add_st(self.musicL, self.musicR, t0 + 0.31, sig, 0.22, -pan)

    def kick(self, t0, gain=0.82):
        n = int(0.30 * SR)
        ph = 0.0; out = [0.0] * n
        for i in range(n):
            u = i / n
            f = 140.0 * math.exp(-u * 10.0) + 44.0
            ph += f / SR
            out[i] = math.sin(2 * math.pi * ph) * math.exp(-u * 8.0)
        click = noise(int(0.005 * SR), 11 + int(t0 * 97))
        for i in range(min(n, len(click))):
            out[i] += click[i] * math.exp(-i / (0.0010 * SR)) * 0.30
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)
        self.kicks.append(t0)

    def snare(self, t0, gain=0.34, gated=True):
        n = int(0.20 * SR)
        nz = hp1(noise(n, 21 + int(t0 * 131)), 1100.0)
        nz = lp1(nz, 8000.0)
        out = [nz[i] * math.exp(-i / (0.045 * SR)) for i in range(n)]
        for i in range(n):
            out[i] += math.sin(2 * math.pi * 196.0 * i / SR) * math.exp(-i / (0.040 * SR)) * 0.32
        if gated:
            g = int(0.11 * SR)
            for i in range(n):
                out[i] *= 1.2 if i < g else math.exp(-(i - g) / (0.010 * SR))
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def hat(self, t0, gain=0.08, open_=False, pan=0.18):
        n = int((0.14 if open_ else 0.038) * SR)
        nz = hp1(noise(n, 31 + int(t0 * 173)), 7000.0)
        tau = 0.045 if open_ else 0.010
        out = [nz[i] * math.exp(-i / (tau * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, pan)

    def metallic(self, t0, gain=0.10):
        """Short inharmonic clank — HUD machinery tick."""
        n = int(0.09 * SR); out = [0.0] * n
        for f, a in [(1830, 0.5), (2710, 0.32), (3990, 0.18)]:
            for i in range(n):
                out[i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.020 * SR)) * a
        add_st(self.drumL, self.drumR, t0, out, gain, 0.25)

    def sub(self, t0, dur, f, gain=0.26):
        n = int(dur * SR); ph = 0.0; inc = f / SR; out = []
        for i in range(n):
            out.append(math.sin(2 * math.pi * ph)); ph += inc
        e = env_ad(n, 0.01, max(0.02, dur - 0.01), 0.6)
        add_st(self.musicL, self.musicR, t0, [out[i] * e[i] * gain for i in range(n)], 1.0, 0.0)

    def drone(self, t0, dur, f, gain=0.10):
        n = int(dur * SR); ph = 0.0; inc = f / SR; out = []
        for i in range(n):
            v = 0.6 * math.sin(2 * math.pi * ph) + 0.4 * saw(ph * 1.005)
            out.append(v); ph += inc
        out = lp1(out, 220.0)
        e = [min(1.0, i / (1.2 * SR)) * min(1.0, (n - i) / (0.8 * SR)) for i in range(n)]
        add_st(self.musicL, self.musicR, t0, [out[i] * e[i] * gain for i in range(n)], 1.0, 0.0)

# ---------------------------------------------------------------- sfx
def sfx_static(dur, seed=1):
    n = int(dur * SR); nz = noise(n, seed)
    out = [nz[i] * (0.6 + 0.4 * math.sin(i * 0.0007)) for i in range(n)]
    for i in range(n):
        out[i] *= (1 - i / n) ** 0.4
    return out

def sfx_crt_on():
    n = int(0.65 * SR)
    nz = noise(n, 77)
    out = []
    for i in range(n):
        u = i / n
        f = 9000 * math.exp(-u * 6) + 120
        out.append((nz[i] * 0.4 + math.sin(2 * math.pi * f * i / SR) * 0.6) * math.exp(-u * 4))
    return out

def sfx_boot_beep():
    n = int(0.5 * SR); out = [0.0] * n
    for k, (t0, f) in enumerate([(0.0, 880.0), (0.16, 1174.0)]):
        st = int(t0 * SR); m = int(0.12 * SR)
        for i in range(m):
            u = i / m
            out[st + i] += (sqr(f * i / SR) * 0.6 + math.sin(2 * math.pi * f * i / SR) * 0.4) * (1 - u) ** 1.5 * 0.55
    return out

def sfx_ui_blip():
    n = int(0.14 * SR); out = []
    for i in range(n):
        u = i / n; f = 1250 + 420 * u
        out.append(math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 11) * 0.8)
    return out

def sfx_vid_pop():
    n = int(0.16 * SR); out = []
    for i in range(n):
        u = i / n; f = 520 * (1 + 1.6 * u)
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.7 + sqr(f * 1.5 * i / SR) * 0.2) * math.exp(-u * 8))
    return out

def sfx_servo(dur=0.9):
    n = int(dur * SR); nz = noise(n, 203); out = []
    y = 0.0
    for i in range(n):
        u = i / n
        f = 90 + 40 * math.sin(u * math.pi * 3)
        a = 0.03 + 0.10 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.5 + y * 0.5) * math.sin(math.pi * u) ** 1.3)
    return out

def sfx_ui_error():
    n = int(0.40 * SR); out = [0.0] * n
    for k, f in enumerate([196, 174]):
        st = int(k * 0.15 * SR)
        for i in range(n - st):
            out[st + i] += (sqr(f * i / SR) * 0.35 + math.sin(2 * math.pi * f * i / SR) * 0.65) * math.exp(-i / (0.08 * SR)) * 0.5
    return out

def sfx_stamp():
    n = int(0.45 * SR); out = [0.0] * n
    for i in range(n):
        u = i / n
        out[i] = (math.sin(2 * math.pi * (110 * math.exp(-u * 4) + 52) * i / SR) * math.exp(-u * 5.5) * 0.9
                  + noise(n, 141)[i] * math.exp(-u * 30) * 0.35)
    return out

def sfx_type(dur, seed=13):
    n = int(dur * SR); out = [0.0] * n; r = random.Random(seed)
    t = 0.0
    while t < dur:
        m = int(0.007 * SR); st = int(t * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += noise(m, r.randint(0, 9999))[i] * math.exp(-i / (0.0014 * SR)) * 0.45
        t += r.uniform(0.030, 0.062)
    return out

def sfx_whoosh(dur=0.5, seed=9):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    y = 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.28 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        out.append(y * math.sin(math.pi * u) ** 1.2)
    return out

def sfx_impact(variant=0):
    n = int(1.4 * SR); out = [0.0] * n
    nz = lp1(noise(n, 111 + variant), 200.0)
    for i in range(n):
        u = i / n
        f = 68 * math.exp(-u * 5) + 34
        out[i] = (math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 3.0) * 1.05
                  + nz[i] * math.exp(-u * 5) * 0.6)
    m = int(0.05 * SR); nz2 = hp1(noise(m, 121 + variant), 2600.0)
    for i in range(m):
        out[i] += nz2[i] * math.exp(-i / (0.008 * SR)) * 0.75
    return out

def sfx_alarm():
    n = int(0.72 * SR); out = [0.0] * n
    for k in range(2):
        st = int(k * 0.31 * SR)
        for i in range(n - st):
            u = i / (0.31 * SR)
            if u > 1: break
            f = 760 if k == 0 else 640
            wave_ = sqr(f * i / SR) * 0.22 + math.sin(2 * math.pi * f * i / SR) * 0.5
            out[st + i] = wave_ * math.sin(math.pi * u) * 0.5
    return out

def sfx_scan(dur=1.5, seed=21):
    n = int(dur * SR); nz = noise(n, seed); out = []; y = 0.0
    for i in range(n):
        u = i / n
        a = 0.008 + 0.10 * u
        y += (nz[i] - y) * a
        out.append(y * math.sin(math.pi * u) ** 0.7 * 0.8)
    return out

def sfx_radar_ping():
    n = int(0.9 * SR); out = [0.0] * n
    for f, a, tau in [(1860, 0.55, 0.22), (2790, 0.28, 0.13), (5580, 0.12, 0.07)]:
        for i in range(n):
            out[i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (tau * SR)) * a
    # slap-back
    st = int(0.19 * SR)
    for i in range(n - st):
        out[st + i] += out[i] * 0.22
    return out

def sfx_radar_sweep(dur=0.9, seed=33):
    n = int(dur * SR); nz = noise(n, seed); out = []; y = 0.0
    for i in range(n):
        u = i / n
        a = 0.01 + 0.16 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        tone = math.sin(2 * math.pi * (900 + 900 * u) * i / SR) * 0.25 * math.sin(math.pi * u)
        out.append(y * 0.7 + tone)
    return out

def sfx_multi_blip(dur=1.2, seed=41):
    n = int(dur * SR); out = [0.0] * n; r = random.Random(seed)
    t = 0.0
    while t < dur:
        f = r.uniform(1500, 2300)
        m = int(0.05 * SR); st = int(t * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.010 * SR)) * 0.45
        t += r.uniform(0.11, 0.20)
    return out

def sfx_target_lock():
    n = int(1.1 * SR); out = [0.0] * n
    # rising two-step lock tone
    for k, f in enumerate([740, 988, 1480]):
        st = int(k * 0.10 * SR); m = int(0.30 * SR)
        for i in range(m):
            u = i / m
            if st + i < n:
                out[st + i] += (math.sin(2 * math.pi * f * i / SR) * 0.5 + sqr(f * 0.5 * i / SR) * 0.18) * math.exp(-u * 3.2) * 0.7
    # confirmation alarm tail
    for i in range(int(0.34 * SR)):
        j = int(0.36 * SR) + i
        if j < n:
            u = i / (0.34 * SR)
            out[j] += math.sin(2 * math.pi * 1220 * i / SR) * math.sin(math.pi * u) * 0.35
    return out

def sfx_riser(dur, seed=7):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    for i in range(n):
        u = i / n
        f = 180 + 2800 * u ** 2
        out.append((nz[i] * 0.5 + math.sin(2 * math.pi * f * i / SR) * 0.5) * (u ** 1.5))
    return out

def sfx_power_down():
    n = int(0.7 * SR); out = []
    for i in range(n):
        u = i / n
        f = 620 * (1 - u) ** 2.2 + 36
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.6 + noise(n, 221)[i] * 0.18 * (1 - u)) * (1 - u) ** 1.4)
    return out

def sfx_crt_off():
    n = int(0.40 * SR); out = [0.0] * n
    for i in range(n):
        u = i / n
        out[i] = (math.sin(2 * math.pi * (2200 * (1 - u) ** 4 + 42) * i / SR) * 0.5
                  + noise(n, 201)[i] * 0.24) * (1 - u) ** 2
    return out

# ---------------------------------------------------------------- arrangement
def build(cues):
    dur = float(cues.get("duration", 30.0))
    bpm = float(cues.get("bpm", 96))
    beat = 60.0 / bpm
    beat0 = float(cues.get("beat0", 0.55))
    sc = Score(dur)

    # D minor: Dm – Bb – Gm – A, one bar each, four-bar loop
    prog = [
        ([50, 62, 65, 69, 74], 38),   # Dm
        ([46, 58, 62, 65, 70], 34),   # Bb
        ([43, 55, 58, 62, 67], 31),   # Gm
        ([45, 57, 61, 64, 69], 33),   # A
    ]
    bar = beat * 4
    nbars = int(dur / bar) + 1
    for b in range(nbars):
        t0 = b * bar
        if t0 >= dur: break
        notes, bass_midi = prog[b % 4]
        root = hz(bass_midi)
        # pad always (it carries the break sections)
        cut = 900.0
        if t0 >= SC_HIT: cut = 1600.0
        if t0 >= 25.38: cut = 2000.0
        sc.pad(t0, min(bar + 0.5, dur - t0), [hz(m) for m in notes], gain=0.062, cutoff=cut, atk=0.25, rel=0.5)
        # bass pulses — 8ths, stop during the post-impact hole
        for e in range(8):
            tt = t0 + e * beat / 2
            if tt >= dur: break
            if BREAK0 <= tt < BREAK1:
                continue
            f = root * (2.0 if e % 4 == 3 else 1.0)
            sc.bass(tt, beat / 2 * 0.88, f, gain=0.16, cutoff=420.0 + 220.0 * (1 if tt > 2.4 else 0))
        # 16th data arpeggio
        if t0 >= 1.25:
            tones = [hz(m + 12) for m in notes[1:]]
            seq = [tones[0], tones[1], tones[2], tones[1], tones[3 % len(tones)], tones[2], tones[1], tones[0]]
            for s in range(16):
                tt = t0 + s * beat / 4
                if tt >= dur: break
                if BREAK0 <= tt < BREAK1: continue
                if 8.62 <= tt < 9.28: continue
                f = seq[s % len(seq)]
                sc.arp(tt, beat / 4 * 0.82, f, gain=0.040, pan=-0.35 if s % 2 else 0.35)

    # drums
    times = []
    t = beat0
    while t < dur - 0.30:
        times.append(t); t += beat
    for i, tt in enumerate(times):
        if BREAK0 <= tt < BREAK1: continue
        if 8.62 <= tt < 9.28 and i % 2: continue
        sc.kick(tt, 0.80 if tt >= 1.2 else 0.55)
        if i % 2 == 1:
            sc.snare(tt, 0.30)
        for h in (0.0, 0.5):
            ht = tt + h * beat
            if ht < dur:
                sc.hat(ht, 0.065 if h == 0 else 0.048, open_=(h == 0.5 and i % 4 == 3), pan=0.22 if h else -0.18)
    # extra machine ticks on 16ths after the radar reveal
    t = 25.38
    while t < 28.0:
        sc.metallic(t, 0.05)
        t += beat / 4
    # sub hits on structural moments
    for tt in [0.02, 13.05, 19.28, 25.38, 27.50]:
        sc.sub(tt, 1.3 if tt < 1 else 0.9, 36.7, 0.24)
    # low drone under the opening and the end
    sc.drone(0.0, 2.1, 36.7, 0.10)
    sc.drone(28.6, 1.4, 36.7, 0.08)

    # sidechain music bus off every kick
    duck = [1.0] * sc.n
    for kt in sc.kicks:
        i0 = int(kt * SR)
        for i in range(int(0.26 * SR)):
            j = i0 + i
            if j >= sc.n: break
            u = i / (0.26 * SR)
            g = 1.0 - 0.50 * math.exp(-u * 9.0) * (1.0 - math.exp(-i / (0.004 * SR)))
            if g < duck[j]: duck[j] = g
    for i in range(sc.n):
        sc.musicL[i] *= duck[i]; sc.musicR[i] *= duck[i]

    # SFX
    rnd = random.Random(20261030)
    table = {
        "static": lambda c: sfx_static(c.get("dur") or 1.0, rnd.randint(0, 9999)),
        "crt_on": lambda c: sfx_crt_on(),
        "boot_beep": lambda c: sfx_boot_beep(),
        "ui_blip": lambda c: sfx_ui_blip(),
        "vid_pop": lambda c: sfx_vid_pop(),
        "servo": lambda c: sfx_servo(c.get("dur") or 0.9),
        "ui_error": lambda c: sfx_ui_error(),
        "stamp": lambda c: sfx_stamp(),
        "type": lambda c: sfx_type(c.get("dur") or 1.0, rnd.randint(0, 9999)),
        "whoosh": lambda c: sfx_whoosh(c.get("dur") or 0.5, rnd.randint(0, 9999)),
        "impact": lambda c: sfx_impact(rnd.randint(0, 5)),
        "alarm": lambda c: sfx_alarm(),
        "scan": lambda c: sfx_scan(c.get("dur") or 1.5, rnd.randint(0, 9999)),
        "radar_ping": lambda c: sfx_radar_ping(),
        "radar_sweep": lambda c: sfx_radar_sweep(c.get("dur") or 0.9, rnd.randint(0, 9999)),
        "multi_blip": lambda c: sfx_multi_blip(c.get("dur") or 1.2, rnd.randint(0, 9999)),
        "target_lock": lambda c: sfx_target_lock(),
        "riser": lambda c: sfx_riser(c.get("dur") or 1.0, rnd.randint(0, 9999)),
        "power_down": lambda c: sfx_power_down(),
        "crt_off": lambda c: sfx_crt_off(),
    }
    for c in cues.get("sfx", []):
        fn = table.get(c.get("type"))
        if not fn: continue
        sig = fn(c)
        add_st(sc.sfxL, sc.sfxR, float(c["t"]), sig, db(float(c.get("gain", -12))), float(c.get("pan", 0.0)))

    return sc

# structural break after the missile impact
SC_HIT = 13.05
BREAK0, BREAK1 = 13.05, 14.42

# ---------------------------------------------------------------- master
def write_wav(path, L, R):
    n = len(L)
    data = array('h')
    for i in range(n):
        l = int(clamp(L[i], -1.0, 1.0) * 32767)
        r = int(clamp(R[i], -1.0, 1.0) * 32767)
        data.append(l); data.append(r)
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
        mixL[i] = sc.musicL[i] * 0.9 + sc.drumL[i] + sc.sfxL[i]
        mixR[i] = sc.musicR[i] * 0.9 + sc.drumR[i] + sc.sfxR[i]
    # global end fade (score only; the voice is faded by the pipeline)
    e0 = float(cues.get("scenes", {}).get("end_fade", [29.3, 30.0])[0])
    e1 = float(cues.get("scenes", {}).get("end_fade", [29.3, 30.0])[1])
    for i in range(int(e0 * SR), n):
        u = clamp((i / SR - e0) / max(1e-4, e1 - e0))
        g = 1.0 - u * u * (3 - 2 * u)
        mixL[i] *= g; mixR[i] *= g
    pk = max(1e-9, max(max(abs(v) for v in mixL), max(abs(v) for v in mixR)))
    g = 0.72 / pk
    for i in range(n):
        mixL[i] = math.tanh(mixL[i] * g * 1.15) * 0.92
        mixR[i] = math.tanh(mixR[i] * g * 1.15) * 0.92
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    write_wav(out_path, mixL, mixR)

    def rms_at(t, d=0.2):
        a = int(t * SR); b = min(n, a + int(d * SR))
        if a >= n: return -99.0
        s = 0.0
        for i in range(a, b): s += mixL[i] * mixL[i]
        return 10 * math.log10(max(1e-12, s / max(1, b - a)))
    print(f"score: {out_path}  {n/SR:.3f}s  peak={pk:.3f}")
    for t in [0.2, 1.2, 2.5, 4.7, 8.6, 13.1, 14.5, 19.3, 22.0, 25.4, 27.5, 29.4]:
        print(f"  RMS {t:5.1f}s: {rms_at(t):6.1f} dBFS")

if __name__ == '__main__':
    main()
