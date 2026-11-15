#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""dengju · isometric bright-pluck score + SFX synthesizer (stdlib only, deterministic).

Reads cues.json, writes audio/score.wav (48 kHz stereo, duration seconds).
112 BPM, F major, FM marimba / pluck motif, soft four-on-the-floor, 8th hats,
bell arps, warm pad, sidechain off the kick. Tile/building clicks and pan
whooshes are locked to cues.json. Same cues -> same WAV, byte for byte.

Usage:
  python dengju/scripts/make_score.py dengju/projects/yuren30/cues.json \
      dengju/projects/yuren30/audio/score.wav
"""
import json, math, os, random, struct, sys, wave
from array import array

SR = 48000

# ---------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def db(x): return 10.0 ** (x / 20.0)
def saw(ph): return 2.0 * (ph - math.floor(ph)) - 1.0
def tri(ph): return 4.0 * abs(ph - math.floor(ph) - 0.5) - 1.0

def env_ad(n, atk, dec, curve=1.0):
    a = max(1, int(atk * SR)); d = max(1, n - a)
    out = [0.0] * n
    for i in range(a): out[i] = i / a
    for i in range(d): out[a + i] = math.exp(-(i / d) * 6.0 * curve) * (1.0 - i / d)
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

# ---------------------------------------------------------------- score
class Score:
    def __init__(self, dur):
        self.n = int(round(dur * SR))
        self.musicL = [0.0] * self.n; self.musicR = [0.0] * self.n
        self.drumL = [0.0] * self.n; self.drumR = [0.0] * self.n
        self.sfxL = [0.0] * self.n; self.sfxR = [0.0] * self.n
        self.kicks = []

    def pad(self, t0, dur, freqs, gain=0.10, cutoff=1700.0, atk=0.16, rel=0.35):
        n = int(dur * SR); a = max(1, int(atk * SR)); r = max(1, int(rel * SR))
        L = [0.0] * n; R = [0.0] * n
        for k, f in enumerate(freqs):
            phL = (k * 0.17) % 1.0; phR = (k * 0.31 + 0.5) % 1.0
            dL = f * (1.0 + 0.0016 * (k - 1.5)); dR = f * (1.0 - 0.0016 * (k - 1.5))
            incL = dL / SR; incR = dR / SR
            for i in range(n):
                L[i] += tri(phL); R[i] += tri(phR)
                phL += incL; phR += incR
        L = lp1(L, cutoff); R = lp1(R, cutoff)
        for i in range(n):
            e = 1.0
            if i < a: e = i / a
            if i > n - r: e = min(e, (n - i) / r)
            L[i] *= e * gain; R[i] *= e * gain
        add(self.musicL, t0, L); add(self.musicR, t0, R)

    def bass(self, t0, dur, f, gain=0.17, cutoff=440.0):
        n = int(dur * SR); ph = 0.0; ph2 = 0.0; inc = f / SR
        out = []
        for i in range(n):
            out.append(0.80 * math.sin(2 * math.pi * ph) + 0.20 * saw(ph2))
            ph += inc; ph2 += inc
        out = lp1(out, cutoff)
        e = env_ad(n, 0.004, max(0.02, dur - 0.004), 1.4)
        add(self.musicL, t0, [out[i] * e[i] * gain for i in range(n)])
        add(self.musicR, t0, [out[i] * e[i] * gain for i in range(n)])

    def mallet(self, t0, dur, f, gain=0.10, pan=0.0):
        # FM marimba: carrier + fast 4th + woody 10th
        n = max(1, int(min(dur, 0.9) * SR)); tau = 0.26
        out = [0.0] * n
        p1 = p2 = p3 = 0.0
        for i in range(n):
            u = i / SR
            out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / tau)
                      + 0.28 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.055)
                      + 0.10 * math.sin(2 * math.pi * p3) * math.exp(-u / 0.016))
            p1 += f / SR; p2 += f * 4.01 / SR; p3 += f * 10.1 / SR
        atk = max(1, int(0.003 * SR))
        for i in range(min(atk, n)): out[i] *= i / atk
        add_st(self.musicL, self.musicR, t0, out, gain, pan)

    def pluck(self, t0, dur, f, gain=0.075, pan=0.0):
        # FM pluck: bright attack, quick decay
        n = max(1, int(min(dur, 0.6) * SR))
        out = [0.0] * n
        ph = 0.0; mod = 0.0
        inc = f / SR
        for i in range(n):
            u = i / SR
            mod += f * 2.0 * inc
            v = math.sin(2 * math.pi * ph + 1.4 * math.exp(-u / 0.05) * math.sin(2 * math.pi * mod))
            out[i] = v * math.exp(-u / 0.18)
            ph += inc
        add_st(self.musicL, self.musicR, t0, out, gain, pan)

    def bell(self, t0, f, gain=0.07, pan=0.0):
        n = int(0.85 * SR); out = [0.0] * n
        p1 = p2 = p3 = 0.0
        for i in range(n):
            u = i / SR
            out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / 0.48)
                      + 0.42 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.28)
                      + 0.18 * math.sin(2 * math.pi * p3) * math.exp(-u / 0.14))
            p1 += f / SR; p2 += f * 2.76 / SR; p3 += f * 5.40 / SR
        add_st(self.musicL, self.musicR, t0, out, gain, pan)

    def kick(self, t0, gain=0.62, soft=False):
        n = int(0.30 * SR); ph = 0.0; out = [0.0] * n
        for i in range(n):
            u = i / n
            f = (130.0 if soft else 145.0) * math.exp(-u * 8.0) + 44.0
            ph += f / SR
            out[i] = math.sin(2 * math.pi * ph) * math.exp(-u * (6.0 if soft else 7.2))
        click = noise(int(0.005 * SR), 11 + int(t0 * 97))
        for i in range(min(n, len(click))):
            out[i] += click[i] * math.exp(-i / (0.0012 * SR)) * 0.22
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)
        self.kicks.append(t0)

    def clap(self, t0, gain=0.20):
        n = int(0.18 * SR)
        nz = hp1(noise(n, 21 + int(t0 * 131)), 1100.0)
        nz = lp1(nz, 7200.0)
        out = [nz[i] * math.exp(-i / (0.05 * SR)) for i in range(n)]
        for i in range(n):
            out[i] += math.sin(2 * math.pi * 196.0 * i / SR) * math.exp(-i / (0.04 * SR)) * 0.22
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def hat(self, t0, gain=0.055, open_=False, pan=0.18):
        n = int((0.14 if open_ else 0.04) * SR)
        nz = hp1(noise(n, 31 + int(t0 * 173)), 7000.0)
        tau = 0.05 if open_ else 0.011
        out = [nz[i] * math.exp(-i / (tau * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, pan)

    def crash(self, t0, gain=0.22):
        n = int(1.3 * SR)
        nz = hp1(noise(n, 41 + int(t0 * 197)), 3200.0)
        nz = lp1(nz, 14000.0)
        out = [nz[i] * math.exp(-i / (0.40 * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def sub(self, t0, dur, f, gain=0.18):
        n = int(dur * SR); ph = 0.0; out = []
        for i in range(n):
            out.append(math.sin(2 * math.pi * ph)); ph += f / SR
        e = env_ad(n, 0.01, max(0.02, dur - 0.01), 0.7)
        add_st(self.musicL, self.musicR, t0, [out[i] * e[i] * gain for i in range(n)], 1.0, 0.0)

# ---------------------------------------------------------------- sfx
def sfx_click(seed=57):
    n = int(0.08 * SR); out = [0.0] * n
    nz = hp1(noise(n, seed), 3200.0)
    for i in range(n):
        u = i / n
        out[i] = nz[i] * math.exp(-u * 28) * 0.6 + math.sin(2 * math.pi * 1250 * i / SR) * math.exp(-u * 32) * 0.4
    return out

def sfx_pop(pitch=1.0, dur=0.14):
    n = int(dur * SR); out = []
    for i in range(n):
        u = i / n; f = 560 * pitch * (1 + 1.15 * u)
        out.append(math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 9))
    return out

def sfx_impact(variant=0, soft=False):
    n = int(1.0 * SR); out = [0.0] * n
    nz = lp1(noise(n, 111 + variant), 190.0 if not soft else 260.0)
    for i in range(n):
        u = i / n
        f = 60 * math.exp(-u * 5) + 30
        out[i] = (math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 3.4) * (0.8 if soft else 1.0)
                  + nz[i] * math.exp(-u * 4.6) * (0.5 if soft else 0.7))
    m = int(0.05 * SR); nz2 = hp1(noise(m, 121 + variant), 2400.0)
    for i in range(m):
        out[i] += nz2[i] * math.exp(-i / (0.008 * SR)) * (0.45 if soft else 0.75)
    return out

def sfx_whoosh(dur=0.5, seed=9, reverse=False):
    n = int(dur * SR); nz = noise(n, seed) if not reverse else noise(n, seed)[::-1]
    out = []; y = 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.26 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        out.append(y * math.sin(math.pi * u) ** 1.25)
    return out

def sfx_riser(dur, seed=7):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    for i in range(n):
        u = i / n
        f = 180 + 2800 * u ** 2
        out.append((nz[i] * 0.5 + math.sin(2 * math.pi * f * i / SR) * 0.5) * (u ** 1.35))
    return out

def sfx_sparkle(seed=13):
    n = int(0.85 * SR); out = [0.0] * n
    r = random.Random(seed)
    for k in range(10):
        st = int(r.uniform(0.0, 0.3) * SR)
        f = r.uniform(2300, 6500)
        m = int(0.16 * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.03 * SR)) * 0.14
    return out

def sfx_ding(f, gain=1.0):
    n = int(1.1 * SR); out = [0.0] * n
    p1 = p2 = p3 = 0.0
    for i in range(n):
        u = i / SR
        out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / 0.45)
                  + 0.4 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.28)
                  + 0.16 * math.sin(2 * math.pi * p3) * math.exp(-u / 0.15))
        p1 += f / SR; p2 += f * 2.01 / SR; p3 += f * 3.02 / SR
    return out

def sfx_tick():
    n = int(0.05 * SR)
    return [math.sin(2 * math.pi * 2300 * i / SR) * math.exp(-i / (0.006 * SR)) for i in range(n)]

def sfx_slab():
    n = int(0.3 * SR); out = [0.0] * n
    nz = hp1(noise(n, 77), 900.0)
    nz = lp1(nz, 5200.0)
    for i in range(n):
        u = i / n
        out[i] = nz[i] * math.exp(-u * 16) * 0.8 + math.sin(2 * math.pi * 150 * i / SR) * math.exp(-u * 22) * 0.35
    return out

def sfx_icehit():
    n = int(1.4 * SR); out = [0.0] * n
    r = random.Random(88)
    for k in range(7):
        f = r.uniform(900, 4200); st = int(r.uniform(0, 0.05) * SR)
        m = int(1.0 * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.24 * SR)) * (0.16 - k * 0.015)
    nz = hp1(noise(n, 91), 2600.0)
    for i in range(n): out[i] += nz[i] * math.exp(-i / (0.09 * SR)) * 0.25
    return out

def sfx_shimmer(dur=1.2, seed=31):
    n = int(dur * SR); out = []
    for i in range(n):
        u = i / n
        f = 2600 + 500 * math.sin(u * 9.0) + 900 * u
        out.append(math.sin(2 * math.pi * f * i / SR) * math.sin(math.pi * u) * 0.22)
    return lp1(out, 7000.0)

def sfx_rumble(dur=1.6, seed=41):
    n = int(dur * SR); nz = lp1(noise(n, seed), 90.0)
    out = []
    for i in range(n):
        u = i / n
        out.append(nz[i] * (math.sin(math.pi * u) ** 0.7) * 1.4)
    return out

def sfx_lid():
    a = sfx_slab()
    b = sfx_pop(0.55, 0.3)
    n = max(len(a), len(b)); out = [0.0] * n
    for i in range(n):
        out[i] = (a[i] if i < len(a) else 0.0) * 0.7 + (b[i] if i < len(b) else 0.0) * 0.35
    return out

def sfx_air(dur=0.5, seed=61):
    n = int(dur * SR); nz = lp1(noise(n, seed), 1800.0)
    return [nz[i] * math.sin(math.pi * i / n) * 0.5 for i in range(n)]

# ---------------------------------------------------------------- arrangement
def build(cues):
    dur = float(cues.get("duration", 30.0))
    bpm = float(cues.get("bpm", 112))
    beat = 60.0 / bpm
    bar = beat * 4
    sc = Score(dur)

    # F major: F - Dm - Bb - C
    prog = [
        ([53, 57, 60, 65, 69], 41),
        ([50, 53, 57, 62, 65], 38),
        ([46, 50, 53, 58, 62], 34),
        ([48, 52, 55, 60, 64], 36),
    ]
    bass_of = {41: 29, 38: 26, 34: 22, 36: 24}
    MOTIF = ['F5', 'A5', 'C6', 'A5']

    def sect(t):
        if t < 2.20: return 'intro'
        if t < 8.83: return 'groove'
        if t < 10.35: return 'route'
        if t < 13.30: return 'ice'
        if t < 14.00: return 'whip'
        if t < 18.30: return 'groove2'
        if t < 24.30: return 'tense'
        if t < 25.40: return 'build'
        if t < 29.30: return 'climax'
        return 'tail'

    n_bars = int(math.ceil(dur / bar))
    for b in range(n_bars):
        t0 = b * bar
        if t0 >= dur: break
        idx = b % 4
        notes, root = prog[idx]
        se = sect(t0)
        # pad
        pg = {'intro': 0.070, 'groove': 0.062, 'route': 0.090, 'ice': 0.090, 'whip': 0.070,
              'groove2': 0.064, 'tense': 0.082, 'build': 0.095, 'climax': 0.085, 'tail': 0.070}[se]
        cutoff = 1200 if se in ('intro', 'tense') else 1750
        sc.pad(t0, min(bar + 0.35, dur - t0), [hz(m) for m in notes], gain=pg, cutoff=cutoff, atk=0.12, rel=0.30)

        # bass
        if se in ('groove', 'groove2', 'climax', 'build'):
            br = bass_of[root]
            for e in range(8):
                tt = t0 + e * beat / 2
                if tt >= dur: break
                g = 0.15 if se != 'climax' else 0.17
                sc.bass(tt, beat / 2 * 0.86, hz(br), gain=g, cutoff=360 + (160 if se == 'climax' else 0))
        elif se in ('ice', 'tense'):
            br = bass_of[root]
            sc.bass(t0, min(bar * 0.95, dur - t0), hz(br), gain=0.13, cutoff=280)

        # arp / bells
        if se in ('groove', 'groove2', 'climax'):
            tones = [hz(m + 12) for m in notes[1:]]
            order = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 1, 2, 3, 1]
            for k in range(16):
                tt = t0 + k * beat / 4
                if tt >= dur: break
                if se == 'climax' and k % 4 == 0: continue
                f = tones[order[k] % len(tones)]
                sc.pluck(tt, beat / 4 * 0.9, f, gain=0.040 if se != 'climax' else 0.050, pan=-0.3 if k % 2 else 0.3)
        if se in ('ice', 'route'):
            tones = [hz(m + 24) for m in notes[1:]]
            for k in range(8):
                tt = t0 + k * beat / 2
                if tt >= dur: break
                sc.bell(tt, tones[k % len(tones)], gain=0.045, pan=0.25 if k % 2 else -0.25)
        if se == 'tense':
            for k in range(4):
                tt = t0 + k * beat
                if tt >= dur: break
                if k in (0, 2): sc.mallet(tt, 0.5, hz(prog[idx][0][0] + 24), gain=0.028, pan=-0.2)
        # motif
        if se in ('groove', 'groove2', 'climax'):
            for k, nn in enumerate(MOTIF):
                tt = t0 + k * beat
                if tt >= dur: break
                sc.mallet(tt, 0.5, hz(midi_of(nn)), gain=0.055, pan=0.12 if k % 2 else -0.12)
        if se == 'climax':
            sc.bell(t0, hz(midi_of('C7')), gain=0.03, pan=0.3)
            sc.bell(t0 + 2 * beat, hz(midi_of('A6')), gain=0.025, pan=-0.3)

    # drums
    t = float(cues.get("beat0", 0.28)); i = 0
    while t < dur - 0.28:
        se = sect(t)
        if se == 'groove' or se == 'groove2' or se == 'climax':
            sc.kick(t, 0.60 if se != 'climax' else 0.72)
            if i % 2 == 1: sc.clap(t, 0.16 if se != 'climax' else 0.20)
            for h in (0, 0.5):
                ht = t + h * beat
                if ht < dur: sc.hat(ht, 0.050 if h == 0 else 0.034, open_=(h == 0.5 and i % 4 == 3), pan=0.22 if h else -0.18)
        elif se == 'build':
            sc.kick(t, 0.52 + 0.12 * (t - 24.3) / 1.1)
            sc.hat(t, 0.035, pan=-0.2)
        elif se == 'ice':
            if i % 4 == 0: sc.kick(t, 0.45, soft=True)
            if i % 2 == 1: sc.hat(t, 0.028, pan=0.2)
        elif se == 'tense':
            if i % 4 == 0: sc.kick(t, 0.38, soft=True)
        elif se in ('route', 'whip'):
            if i % 2 == 0: sc.hat(t, 0.022, pan=-0.2)
        t += beat; i += 1
    # 16th shaker in tense/build
    tt = 18.3
    while tt < 25.35:
        k = clamp((tt - 18.3) / 7.0)
        sc.hat(tt, 0.010 + 0.018 * k, pan=0.26)
        tt += beat / 4
    # snare roll into the chamber reveal
    tt = 24.55
    while tt < 25.36:
        k = (tt - 24.55) / 0.81
        sc.clap(tt, 0.04 + 0.16 * k)
        tt += 0.075 * (1 - 0.45 * k)
    # structural hits
    for tt, g in [(2.25, 0.18), (3.59, 0.16), (9.84, 0.18), (25.41, 0.34), (29.38, 0.14)]:
        sc.crash(tt, g)
    for tt, g in [(2.25, 0.20), (25.41, 0.26)]:
        sc.sub(tt, 1.0, 43.65, g)

    # sidechain off kicks
    duck = [1.0] * sc.n
    for kt in sc.kicks:
        i0 = int(kt * SR)
        for j in range(i0, min(sc.n, i0 + int(0.26 * SR))):
            u = (j - i0) / (0.26 * SR)
            g = 1.0 - 0.42 * math.exp(-u * 9.5) * (1.0 - math.exp(-(j - i0) / (0.004 * SR)))
            if g < duck[j]: duck[j] = g
    for i in range(sc.n):
        sc.musicL[i] *= duck[i]; sc.musicR[i] *= duck[i]

    # SFX
    rnd = random.Random(20261030)
    for c in cues.get("sfx", []):
        t0 = float(c["t"]); typ = c["type"]; g = db(float(c.get("gain", -12)))
        pan = float(c.get("pan", 0.0)); dur_s = float(c.get("dur", 0.0))
        if typ == "click": sig = sfx_click(rnd.randint(0, 9999))
        elif typ == "pop": sig = sfx_pop(float(c.get("pitch", 1.0)))
        elif typ == "sparkle": sig = sfx_sparkle(rnd.randint(0, 9999))
        elif typ == "whoosh": sig = sfx_whoosh(dur_s or 0.5, rnd.randint(0, 9999))
        elif typ == "riser": sig = sfx_riser(dur_s or 1.0, rnd.randint(0, 9999))
        elif typ == "ding": sig = sfx_ding(hz(midi_of('F6')))
        elif typ == "tick": sig = sfx_tick()
        elif typ == "slab": sig = sfx_slab()
        elif typ == "icehit": sig = sfx_icehit()
        elif typ == "shimmer": sig = sfx_shimmer(dur_s or 1.2, rnd.randint(0, 9999))
        elif typ == "rumble": sig = sfx_rumble(dur_s or 1.6, rnd.randint(0, 9999))
        elif typ == "lid": sig = sfx_lid()
        elif typ == "air": sig = sfx_air(dur_s or 0.5, rnd.randint(0, 9999))
        elif typ == "impact": sig = sfx_impact(rnd.randint(0, 5))
        elif typ == "sub": sig = sfx_impact(9, soft=True); add_st(sc.sfxL, sc.sfxR, t0, sfx_rumble(dur_s or 1.0, 71), g * 0.8, pan)
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
        mixL[i] = sc.musicL[i] * 0.92 + sc.drumL[i] + sc.sfxL[i]
        mixR[i] = sc.musicR[i] * 0.92 + sc.drumR[i] + sc.sfxR[i]
    # final 0.45 s fade so the 30.000 cut never clicks
    fd = int(0.45 * SR)
    for i in range(max(0, n - fd), n):
        g = (n - i) / fd
        mixL[i] *= g; mixR[i] *= g
    pk = max(1e-9, max(max(abs(v) for v in mixL), max(abs(v) for v in mixR)))
    g = 0.70 / pk
    for i in range(n):
        mixL[i] = math.tanh(mixL[i] * g * 1.12) * 0.92
        mixR[i] = math.tanh(mixR[i] * g * 1.12) * 0.92
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
