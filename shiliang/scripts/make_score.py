#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""shiliang · flat-vector score + SFX synthesizer (stdlib only, deterministic).

Reads cues.json, writes audio/score.wav (48 kHz stereo, duration seconds).
MG-pop recipe at 120 BPM in F major: marimba motif, bell arp, round bass,
four-on-the-floor kick, gated snare, 8th hats, sidechain off the kick.
Every random draw comes from random.Random(seed): same cues -> same WAV.

Usage:
  python shiliang/scripts/make_score.py shiliang/projects/010_shengming30/cues.json \
      shiliang/projects/010_shengming30/audio/score.wav
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

# ---------------------------------------------------------------- score
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

    # ---- instruments
    def pad(self, t0, dur, freqs, gain=0.12, cutoff=1600.0, atk=0.18, rel=0.35):
        n = int(dur * SR); a = max(1, int(atk * SR)); r = max(1, int(rel * SR))
        L = [0.0] * n; R = [0.0] * n
        for k, f in enumerate(freqs):
            phL = (k * 0.17) % 1.0; phR = (k * 0.31 + 0.5) % 1.0
            dL = f * (1.0 + 0.0018 * (k - 1.5)); dR = f * (1.0 - 0.0018 * (k - 1.5))
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

    def bass(self, t0, dur, f, gain=0.22, cutoff=460.0):
        n = int(dur * SR); ph = 0.0; ph2 = 0.0; inc = f / SR
        out = []
        for i in range(n):
            out.append(0.78 * math.sin(2 * math.pi * ph) + 0.22 * saw(ph2))
            ph += inc; ph2 += inc
        out = lp1(out, cutoff)
        e = env_ad(n, 0.004, max(0.02, dur - 0.004), 1.4)
        add(self.musicL, t0, [out[i] * e[i] * gain for i in range(n)])
        add(self.musicR, t0, [out[i] * e[i] * gain for i in range(n)])

    def mallet(self, t0, dur, f, gain=0.14, pan=0.0):
        """Marimba-ish: sine fundamental + fast 4th partial + woody 10th tick."""
        n = max(1, int(min(dur, 0.9) * SR)); tau = 0.28
        out = [0.0] * n
        p1 = p2 = p3 = 0.0
        for i in range(n):
            u = i / SR
            out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / tau)
                      + 0.30 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.06)
                      + 0.12 * math.sin(2 * math.pi * p3) * math.exp(-u / 0.018))
            p1 += f / SR; p2 += f * 4.01 / SR; p3 += f * 10.1 / SR
        atk = max(1, int(0.003 * SR))
        for i in range(min(atk, n)): out[i] *= i / atk
        add_st(self.musicL, self.musicR, t0, out, gain, pan)

    def bell(self, t0, f, gain=0.10, pan=0.0):
        n = int(0.9 * SR); out = [0.0] * n
        p1 = p2 = p3 = 0.0
        for i in range(n):
            u = i / SR
            out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / 0.5)
                      + 0.45 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.3)
                      + 0.20 * math.sin(2 * math.pi * p3) * math.exp(-u / 0.16))
            p1 += f / SR; p2 += f * 2.76 / SR; p3 += f * 5.40 / SR
        add_st(self.musicL, self.musicR, t0, out, gain, pan)

    def kick(self, t0, gain=0.85):
        n = int(0.34 * SR); ph = 0.0; out = [0.0] * n
        for i in range(n):
            u = i / n
            f = 148.0 * math.exp(-u * 9.0) + 46.0
            ph += f / SR
            out[i] = math.sin(2 * math.pi * ph) * math.exp(-u * 7.0)
        click = noise(int(0.006 * SR), 11 + int(t0 * 97))
        for i in range(min(n, len(click))):
            out[i] += click[i] * math.exp(-i / (0.0012 * SR)) * 0.35
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)
        self.kicks.append(t0)

    def snare(self, t0, gain=0.38, gated=True):
        n = int(0.22 * SR)
        nz = hp1(noise(n, 21 + int(t0 * 131)), 900.0)
        nz = lp1(nz, 7600.0)
        out = [nz[i] * math.exp(-i / (0.055 * SR)) for i in range(n)]
        for i in range(n):
            out[i] += math.sin(2 * math.pi * 182.0 * i / SR) * math.exp(-i / (0.045 * SR)) * 0.35
        if gated:
            g = int(0.13 * SR)
            for i in range(n):
                out[i] *= 1.25 if i < g else math.exp(-(i - g) / (0.012 * SR))
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def hat(self, t0, gain=0.08, open_=False, pan=0.18):
        n = int((0.16 if open_ else 0.045) * SR)
        nz = hp1(noise(n, 31 + int(t0 * 173)), 6500.0)
        tau = 0.055 if open_ else 0.012
        out = [nz[i] * math.exp(-i / (tau * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, pan)

    def crash(self, t0, gain=0.28):
        n = int(1.4 * SR)
        nz = hp1(noise(n, 41 + int(t0 * 197)), 3200.0)
        nz = lp1(nz, 14000.0)
        out = [nz[i] * math.exp(-i / (0.42 * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def sub(self, t0, dur, f, gain=0.22):
        n = int(dur * SR); ph = 0.0; out = []
        for i in range(n):
            out.append(math.sin(2 * math.pi * ph)); ph += f / SR
        e = env_ad(n, 0.01, max(0.02, dur - 0.01), 0.7)
        add_st(self.musicL, self.musicR, t0, [out[i] * e[i] * gain for i in range(n)], 1.0, 0.0)

# ---------------------------------------------------------------- sfx
def sfx_pop(pitch=1.0, dur=0.13):
    n = int(dur * SR); out = []
    for i in range(n):
        u = i / n; f = 620 * pitch * (1 + 1.1 * u)
        out.append(math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 9))
    return out

def sfx_impact(variant=0):
    n = int(1.1 * SR); out = [0.0] * n
    nz = lp1(noise(n, 111 + variant), 180.0)
    for i in range(n):
        u = i / n
        f = 62 * math.exp(-u * 5) + 32
        out[i] = (math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 3.2) * 1.1
                  + nz[i] * math.exp(-u * 5) * 0.7)
    m = int(0.05 * SR); nz2 = hp1(noise(m, 121 + variant), 2400.0)
    for i in range(m):
        out[i] += nz2[i] * math.exp(-i / (0.008 * SR)) * 0.8
    return out

def sfx_whoosh(dur=0.5, seed=9):
    n = int(dur * SR); nz = noise(n, seed)
    out = []; y = 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.25 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        out.append(y * math.sin(math.pi * u) ** 1.2)
    return out

def sfx_riser(dur, seed=7):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    for i in range(n):
        u = i / n
        f = 180 + 2600 * u ** 2
        out.append((nz[i] * 0.55 + math.sin(2 * math.pi * f * i / SR) * 0.45) * (u ** 1.4))
    return out

def sfx_sparkle(seed=13):
    n = int(0.8 * SR); out = [0.0] * n
    r = random.Random(seed)
    for k in range(9):
        st = int(r.uniform(0.0, 0.28) * SR)
        f = r.uniform(2200, 6200)
        m = int(0.16 * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.03 * SR)) * 0.16
    return out

def sfx_ding(f, gain=1.0):
    n = int(1.1 * SR); out = [0.0] * n
    p1 = p2 = p3 = 0.0
    for i in range(n):
        u = i / SR
        out[i] = (math.sin(2 * math.pi * p1) * math.exp(-u / 0.45)
                  + 0.4 * math.sin(2 * math.pi * p2) * math.exp(-u / 0.28))
        p1 += f / SR; p2 += f * 2.01 / SR
    return out

def sfx_tick():
    n = int(0.05 * SR)
    return [math.sin(2 * math.pi * 2400 * i / SR) * math.exp(-i / (0.006 * SR)) for i in range(n)]

def sfx_click():
    n = int(0.09 * SR); out = [0.0] * n
    nz = hp1(noise(n, 57), 3000.0)
    for i in range(n):
        u = i / n
        out[i] = nz[i] * math.exp(-u * 26) * 0.8 + math.sin(2 * math.pi * 1180 * i / SR) * math.exp(-u * 30) * 0.5
    return out

# ---------------------------------------------------------------- arrangement
def hz(midi): return 440.0 * 2 ** ((midi - 69) / 12.0)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}

def midi_of(name):
    n = NOTE[name[:-1]]
    o = int(name[-1])
    return 12 * (o + 1) + n

def build(cues):
    dur = float(cues.get("duration", 30.0))
    bpm = float(cues.get("bpm", 120))
    beat = 60.0 / bpm
    bar = beat * 4
    sc = Score(dur)

    # F major: F - Dm - Bb - C (one bar each, 4-bar loop)
    prog = [
        ([53, 57, 60, 65, 69], 41),   # F
        ([50, 53, 57, 62, 65], 38),   # Dm
        ([46, 50, 53, 58, 62], 34),   # Bb
        ([48, 52, 55, 60, 64], 36),   # C
    ]
    bass_of = {41: 29, 38: 26, 34: 22, 36: 24}   # one octave down
    MOTIF = ['C6', 'E6', 'G6', 'E6']               # bright marimba cell (F major color)

    n_bars = int(math.ceil(dur / bar))
    for b in range(n_bars):
        t0 = b * bar
        if t0 >= dur: break
        idx = b % 4
        notes, root = prog[idx]
        sec = t0 / bar                       # bar index
        full = sec >= 1 and not (3 <= sec < 5) and not (9 <= sec < 10)
        pre_drop = 13 <= sec < 14
        # pad
        pad_gain = 0.055 if sec < 1 else 0.075
        if sec >= 9 and sec < 10: pad_gain = 0.10
        if pre_drop: pad_gain = 0.11
        sc.pad(t0, min(bar + 0.4, dur - t0), [hz(m) for m in notes],
               gain=pad_gain, cutoff=1300.0 + 500.0 * (1 if sec >= 5 else 0), atk=0.12, rel=0.30)
        # bass: 8ths
        if sec >= 0.5:
            br = bass_of[root]
            for e in range(8):
                tt = t0 + e * beat / 2
                if tt >= dur: break
                if sec >= 9 and sec < 10 and e % 2: continue
                g = 0.15 if sec < 1 else 0.19
                sc.bass(tt, beat / 2 * 0.88, hz(br), gain=g, cutoff=360.0 + 220.0 * (1 if sec >= 5 else 0))
        # arp / bells: 16ths from bar 1; sparse in the "mail" bars
        if sec >= 1:
            tones = [hz(m + 12) for m in notes[1:]]
            order = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 1, 2, 3, 1]
            for k in range(16):
                tt = t0 + k * beat / 4
                if tt >= dur: break
                if 3 <= sec < 5 and k % 2: continue
                if sec >= 9 and sec < 10: continue
                f = tones[order[k] % len(tones)] * (2.0 if pre_drop and k % 4 == 3 else 1.0)
                sc.mallet(tt, beat / 4 * 0.9, f, gain=0.035 if sec < 5 else 0.045, pan=-0.3 if k % 2 else 0.3)
        # motif bells on bar starts (the 4-note logo cell answers the dot)
        if sec >= 2 and sec < 14:
            for k, nname in enumerate(MOTIF):
                tt = t0 + k * beat
                if tt >= dur: break
                sc.mallet(tt, 0.5, hz(midi_of(nname)), gain=0.05, pan=0.12 if k % 2 else -0.12)

    # drums
    t = beat0 = float(cues.get("beat0", 0.0))
    i = 0
    while t < dur - 0.35:
        in_break = 18.0 <= t < 18.5
        pre_drop = 26.5 <= t
        if not in_break:
            sc.kick(t, 0.8 if t >= 1.0 else 0.5)
            if i % 2 == 1:
                sc.snare(t, 0.30 if not pre_drop else 0.40)
            for h in (0, 0.5):
                ht = t + h * beat
                if ht < dur:
                    sc.hat(ht, 0.062 if h == 0 else 0.042, open_=(h == 0.5 and i % 4 == 3), pan=0.22 if h else -0.18)
        t += beat; i += 1
    # extra 16th hats in the test-array + drop sections
    t = 24.0
    while t < dur - 0.05:
        sc.hat(t, 0.025, pan=-0.25)
        t += beat / 4
    # snare rolls into the big hits
    for (a, b, step) in [(16.8, 17.24, 0.07), (27.0, 28.68, 0.06)]:
        tt = a
        while tt < b:
            k = (tt - a) / (b - a)
            sc.snare(tt, 0.05 + 0.20 * k, gated=False)
            tt += step * (1.0 - 0.5 * k)
    # crashes on structural hits
    for tt, g in [(1.62, 0.20), (9.56, 0.24), (17.24, 0.34), (22.70, 0.26), (26.50, 0.22), (28.68, 0.38)]:
        sc.crash(tt, g)
    # sub hits
    for tt in [1.05, 6.30, 17.24, 22.70, 28.68]:
        sc.sub(tt, 1.2, 43.65, 0.26)

    # sidechain off every kick
    duck = [1.0] * sc.n
    for kt in sc.kicks:
        i0 = int(kt * SR)
        for j in range(i0, min(sc.n, i0 + int(0.30 * SR))):
            u = (j - i0) / (0.30 * SR)
            g = 1.0 - 0.5 * math.exp(-u * 9.0) * (1.0 - math.exp(-(j - i0) / (0.004 * SR)))
            if g < duck[j]: duck[j] = g
    for i in range(sc.n):
        sc.musicL[i] *= duck[i]; sc.musicR[i] *= duck[i]

    # SFX
    rnd = random.Random(20261030)
    for c in cues.get("sfx", []):
        t0 = float(c["t"]); typ = c["type"]; g = db(float(c.get("gain", -12)))
        pan = float(c.get("pan", 0.0)); dur_s = float(c.get("dur", 0.0))
        if typ == "pop": sig = sfx_pop(float(c.get("pitch", 1.0)))
        elif typ == "impact": sig = sfx_impact(rnd.randint(0, 5))
        elif typ == "whoosh": sig = sfx_whoosh(dur_s or 0.5, rnd.randint(0, 9999))
        elif typ == "riser": sig = sfx_riser(dur_s or 1.0, rnd.randint(0, 9999))
        elif typ == "sparkle": sig = sfx_sparkle(rnd.randint(0, 9999))
        elif typ == "ding": sig = sfx_ding(hz(midi_of('F6')) * (1.0 if pan >= 0 else 1.0))
        elif typ == "tick": sig = sfx_tick()
        elif typ == "click": sig = sfx_click()
        elif typ == "crash": sig = None
        else: continue
        if typ == "crash":
            sc.crash(t0, g)
        else:
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
        mixL[i] = sc.musicL[i] * 0.9 + sc.drumL[i] + sc.sfxL[i]
        mixR[i] = sc.musicR[i] * 0.9 + sc.drumR[i] + sc.sfxR[i]
    # final 0.45 s fade so the 30.000 cut never clicks
    fd = int(0.45 * SR)
    for i in range(max(0, n - fd), n):
        g = (n - i) / fd
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
    for t in [0.3, 1.0, 1.6, 3.0, 6.3, 9.6, 12.8, 17.2, 19.5, 22.7, 26.5, 28.7, 29.5]:
        print(f"  RMS {t:5.1f}s: {rms_at(t):6.1f} dBFS")

if __name__ == '__main__':
    main()
