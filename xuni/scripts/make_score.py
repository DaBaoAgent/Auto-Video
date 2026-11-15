#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xuni · synthwave score + SFX synthesizer (stdlib only, deterministic).

Reads cues.json, writes audio/score.wav (48 kHz stereo, 30 s).
No numpy: the whole track is built from one-pole filters, saws and noise.
Every random draw comes from random.Random(seed); the same cues always give
the same WAV, byte for byte.

Usage:
  python xuni/scripts/make_score.py xuni/projects/009_prion30/cues.json \
      xuni/projects/009_prion30/audio/score.wav [--vo <narration.wav>]
"""
import json, math, os, random, struct, sys, wave
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

def env_exp(n, tau):
    return [math.exp(-i / (SR * tau)) for i in range(n)]

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
    gl = gain * math.sqrt(0.5 * (1.0 - g)) if pan > 0 else gain * math.sqrt(0.5 * (1.0 + g))
    gr = gain * math.sqrt(0.5 * (1.0 + g)) if pan > 0 else gain * math.sqrt(0.5 * (1.0 - g))
    if pan == 0.0:
        gl = gr = gain * 0.7071
    add(bufL, t, sig, gl); add(bufR, t, sig, gr)

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
    def pad(self, t0, dur, freqs, gain=0.16, cutoff=1500.0, atk=0.25, rel=0.5):
        n = int(dur * SR); a = int(atk * SR); r = int(rel * SR)
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

    def bass(self, t0, dur, f, gain=0.30, cutoff=520.0):
        n = int(dur * SR)
        ph = 0.0; inc = f / SR
        out = []
        for i in range(n):
            v = 0.65 * saw(ph) + 0.35 * saw(ph * 0.5)
            out.append(v); ph += inc
        out = lp1(out, cutoff)
        e = env_ad(n, 0.006, max(0.02, dur - 0.006), 1.2)
        add(self.musicL, t0, [out[i] * e[i] * gain for i in range(n)])
        add(self.musicR, t0, [out[i] * e[i] * gain for i in range(n)])

    def arp(self, t0, dur, f, gain=0.10, pan=-0.25):
        n = int(dur * SR)
        ph = 0.0; inc = f / SR
        out = []
        for i in range(n):
            out.append(sqr(ph)); ph += inc
        out = lp1(out, 3600.0)
        e = env_ad(n, 0.002, max(0.02, dur - 0.002), 2.2)
        sig = [out[i] * e[i] * gain for i in range(n)]
        add_st(self.musicL, self.musicR, t0, sig, 1.0, pan)
        # dotted-8th echo
        add_st(self.musicL, self.musicR, t0 + 0.45, sig, 0.32, -pan)

    def kick(self, t0, gain=0.85):
        n = int(0.34 * SR)
        ph = 0.0; out = [0.0] * n
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

    def snare(self, t0, gain=0.42, gated=True):
        n = int(0.22 * SR)
        nz = hp1(noise(n, 21 + int(t0 * 131)), 900.0)
        nz = lp1(nz, 7200.0)
        out = [nz[i] * math.exp(-i / (0.055 * SR)) for i in range(n)]
        for i in range(n):
            u = i / n
            out[i] += math.sin(2 * math.pi * 182.0 * i / SR) * math.exp(-i / (0.045 * SR)) * 0.35
        if gated:
            g = int(0.13 * SR)
            for i in range(n):
                if i < g: out[i] *= 1.25
                else: out[i] *= math.exp(-(i - g) / (0.012 * SR))
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def hat(self, t0, gain=0.10, open_=False, pan=0.18):
        n = int((0.16 if open_ else 0.045) * SR)
        nz = hp1(noise(n, 31 + int(t0 * 173)), 6200.0)
        tau = 0.055 if open_ else 0.012
        out = [nz[i] * math.exp(-i / (tau * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, pan)

    def crash(self, t0, gain=0.30):
        n = int(1.4 * SR)
        nz = hp1(noise(n, 41 + int(t0 * 197)), 3200.0)
        nz = lp1(nz, 14000.0)
        out = [nz[i] * math.exp(-i / (0.42 * SR)) for i in range(n)]
        add_st(self.drumL, self.drumR, t0, out, gain, 0.0)

    def sub(self, t0, dur, f, gain=0.25):
        n = int(dur * SR); ph = 0.0; inc = f / SR; out = []
        for i in range(n):
            out.append(math.sin(2 * math.pi * ph)); ph += inc
        e = env_ad(n, 0.01, max(0.02, dur - 0.01), 0.7)
        add_st(self.musicL, self.musicR, t0, [out[i] * e[i] * gain for i in range(n)], 1.0, 0.0)

# ---------------------------------------------------------------- sfx
def sfx_static(dur, seed=1):
    n = int(dur * SR); nz = noise(n, seed)
    out = [nz[i] * (0.6 + 0.4 * math.sin(i * 0.0007)) for i in range(n)]
    for i in range(n):
        u = i / n
        out[i] *= (1 - u) ** 0.4
    return out

def sfx_crt_on():
    n = int(0.7 * SR)
    nz = noise(n, 77)
    out = []
    for i in range(n):
        u = i / n
        f = 9000 * math.exp(-u * 6) + 120
        out.append((nz[i] * 0.4 + math.sin(2 * math.pi * f * i / SR) * 0.6) * math.exp(-u * 4))
    return out

def sfx_head_switch():
    n = int(0.18 * SR); out = [0.0] * n
    for k, (t, g) in enumerate([(0.0, 0.9), (0.045, 0.55)]):
        m = int(0.012 * SR)
        for i in range(m):
            out[int(t * SR) + i] += noise(m, 90 + k)[i] * math.exp(-i / (0.002 * SR)) * g
    return out

def sfx_pop():
    n = int(0.13 * SR); out = []
    for i in range(n):
        u = i / n; f = 620 * (1 + 1.1 * u)
        out.append(math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 9))
    return out

def sfx_impact(variant=0):
    n = int(1.5 * SR); out = [0.0] * n
    nz = lp1(noise(n, 111 + variant), 180.0)
    for i in range(n):
        u = i / n
        f = 62 * math.exp(-u * 5) + 32
        out[i] = (math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 3.2) * 1.1
                  + nz[i] * math.exp(-u * 5) * 0.7)
    # bright transient
    m = int(0.05 * SR); nz2 = hp1(noise(m, 121 + variant), 2400.0)
    for i in range(m):
        out[i] += nz2[i] * math.exp(-i / (0.008 * SR)) * 0.8
    return out

def sfx_riser(dur, seed=7):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    for i in range(n):
        u = i / n
        f = 180 + 2600 * u ** 2
        out.append((nz[i] * 0.55 + math.sin(2 * math.pi * f * i / SR) * 0.45) * (u ** 1.4))
    return out

def sfx_whoosh(dur=0.5, seed=9):
    n = int(dur * SR); nz = noise(n, seed)
    out = []
    y = 0.0
    for i in range(n):
        u = i / n
        a = 0.02 + 0.25 * math.sin(math.pi * u)
        y += (nz[i] - y) * a
        out.append(y * math.sin(math.pi * u) ** 1.2)
    return out

def sfx_ui_open():
    n = int(0.22 * SR); out = [0.0] * n
    for k, f in enumerate([880, 1320]):
        for i in range(n):
            u = i / n
            out[i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-u * 10) * (0.5 if k else 0.7)
    return out

def sfx_ui_error():
    n = int(0.42 * SR); out = [0.0] * n
    for k, f in enumerate([220, 196]):
        st = int(k * 0.16 * SR)
        for i in range(n - st):
            out[st + i] += math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (0.09 * SR)) * 0.6
    return out

def sfx_type(dur, seed=13):
    n = int(dur * SR); out = [0.0] * n; r = random.Random(seed)
    t = 0.0
    while t < dur:
        m = int(0.008 * SR); st = int(t * SR)
        for i in range(m):
            if st + i < n:
                out[st + i] += noise(m, r.randint(0, 9999))[i] * math.exp(-i / (0.0015 * SR)) * 0.45
        t += r.uniform(0.035, 0.075)
    return out

def sfx_stamp():
    n = int(0.5 * SR); out = [0.0] * n
    for i in range(n):
        u = i / n
        out[i] = (math.sin(2 * math.pi * (95 * math.exp(-u * 4) + 48) * i / SR) * math.exp(-u * 5) * 0.9
                  + noise(n, 141)[i] * math.exp(-u * 30) * 0.4)
    return out

def sfx_heart():
    n = int(0.45 * SR); out = [0.0] * n
    for k, (t, g) in enumerate([(0.0, 1.0), (0.18, 0.55)]):
        st = int(t * SR); m = int(0.18 * SR)
        for i in range(m):
            if st + i < n:
                u = i / m
                out[st + i] += math.sin(2 * math.pi * (70 * math.exp(-u * 3) + 38) * i / SR) * math.exp(-u * 7) * g
    return out

def sfx_glitch():
    n = int(0.55 * SR); out = [0.0] * n; r = random.Random(151)
    t = 0.0
    while t < 0.5:
        m = int(r.uniform(0.012, 0.035) * SR); st = int(t * SR)
        f = r.choice([87, 117, 233, 466, 932, 1864])
        for i in range(m):
            if st + i < n:
                out[st + i] += (math.sin(2 * math.pi * f * i / SR) * 0.5 + r.uniform(-0.5, 0.5)) * 0.7
        t += m / SR + r.uniform(0.01, 0.05)
    return out

def sfx_rise(dur, seed=17):
    n = int(dur * SR); out = []
    for i in range(n):
        u = i / n
        f = 110 * (2 ** (u * 3))
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.5 + math.sin(2 * math.pi * f * 1.5 * i / SR) * 0.25) * (u ** 1.6))
    return out

def sfx_charge(dur):
    n = int(dur * SR); nz = noise(n, 181); out = []
    for i in range(n):
        u = i / n
        f = 60 + 300 * u ** 3
        out.append((math.sin(2 * math.pi * f * i / SR) * 0.5 + nz[i] * 0.35) * (u ** 2.2))
    return out

def sfx_tick():
    n = int(0.05 * SR)
    return [math.sin(2 * math.pi * 2400 * i / SR) * math.exp(-i / (0.006 * SR)) for i in range(n)]

def sfx_alarm():
    n = int(0.8 * SR); out = [0.0] * n
    for k in range(2):
        st = int(k * 0.34 * SR)
        for i in range(n - st):
            u = i / (0.34 * SR)
            if u > 1: break
            out[st + i] = math.sin(2 * math.pi * (740 if k == 0 else 620) * i / SR) * math.sin(math.pi * u) * 0.5
    return out

def sfx_tape_stop():
    n = int(0.5 * SR); out = [0.0] * n
    nz = noise(n, 191)
    for i in range(n):
        u = i / n
        out[i] = nz[i] * (1 - u) * 0.5 + math.sin(2 * math.pi * (900 * (1 - u) ** 3 + 30) * i / SR) * 0.2 * (1 - u)
    return out

def sfx_crt_off():
    n = int(0.42 * SR); out = [0.0] * n
    for i in range(n):
        u = i / n
        out[i] = (math.sin(2 * math.pi * (2000 * (1 - u) ** 4 + 40) * i / SR) * 0.5
                  + noise(n, 201)[i] * 0.25) * (1 - u) ** 2
    return out

# ---------------------------------------------------------------- arrangement
def hz(midi): return 440.0 * 2 ** ((midi - 69) / 12.0)

def build(cues):
    dur = float(cues.get("duration", 30.0))
    bpm = float(cues.get("bpm", 100))
    beat = 60.0 / bpm
    beat0 = float(cues.get("beat0", 1.1))
    sc = Score(dur)

    # chord voicings (MIDI)
    prog = [
        ([45, 57, 60, 64, 69], 33),   # Am
        ([41, 53, 57, 60, 65], None), # F (bass F1=29 -> use 29)
        ([48, 60, 64, 67, 72], 36),   # C
        ([43, 55, 59, 62, 67], 31),   # G
    ]
    bass_midi = [33, 29, 36, 31]

    # pad + bass: one bar per chord, 4-bar loop
    for bar in range(0, int(dur / (beat * 4)) + 1):
        t0 = bar * beat * 4
        if t0 >= dur: break
        idx = bar % 4
        notes, _ = prog[idx]
        pad_cut = 1200.0
        if 12.82 <= t0 < 15.58: pad_cut = 2400.0
        if t0 >= 27.0: pad_cut = 2800.0
        sc.pad(t0, min(beat * 4 + 0.6, dur - t0), [hz(m) for m in notes], gain=0.075, cutoff=pad_cut, atk=0.18, rel=0.45)
        # bass 8ths
        root = hz(bass_midi[idx])
        for e in range(8):
            tt = t0 + e * beat / 2
            if tt >= dur: break
            if 12.82 <= tt < 15.58 and e % 2 == 1:
                continue
            f = root * (2.0 if e % 4 == 3 else 1.0)
            sc.bass(tt, beat / 2 * 0.92, f, gain=0.17, cutoff=380.0 + 260.0 * (1 if tt > 7.7 else 0))
        # arp 16ths
        if t0 >= 1.7:
            tones = [hz(m + 12) for m in notes[1:]]
            seq = [tones[0], tones[1], tones[2], tones[1], tones[3 % len(tones)], tones[2], tones[1], tones[0]]
            for s in range(16):
                tt = t0 + s * beat / 4
                if tt >= dur: break
                if 15.58 <= tt < 16.46: continue
                if 12.82 <= tt < 15.58 and s % 2: continue
                f = seq[s % len(seq)]
                sc.arp(tt, beat / 4 * 0.85, f, gain=0.055, pan=-0.3 if s % 2 else 0.3)

    # drums
    beats = []
    t = beat0
    while t < dur - 0.35:
        beats.append(t); t += beat
    for i, tt in enumerate(beats):
        in_break = 12.82 <= tt < 15.58
        in_glitch = 15.58 <= tt < 16.46
        if in_glitch: continue
        if in_break and i % 2: continue
        sc.kick(tt, 0.85 if tt >= 1.1 else 0.55)
        if i % 2 == 1 and not in_break:
            sc.snare(tt, 0.34)
        # hats 8ths
        for h in (0, 0.5):
            ht = tt + h * beat
            if ht < dur and not (in_break and h == 0.5):
                sc.hat(ht, 0.075 if h == 0 else 0.05, open_=(h == 0.5 and i % 4 == 3), pan=0.22 if h else -0.18)
    # snare roll builds
    for (a, b, step) in [(19.6, 21.2, 0.075), (27.0, 29.4, 0.075)]:
        t = a
        while t < b:
            k = (t - a) / (b - a)
            sc.snare(t, 0.06 + 0.18 * k, gated=False)
            t += step * (1.0 - 0.45 * k)
    # crashes on hits
    for tt, g in [(1.1, 0.20), (7.7, 0.40), (15.58, 0.25), (21.2, 0.34), (27.5, 0.38)]:
        sc.crash(tt, g)
    # sub hits
    for tt in [7.7, 15.58, 21.2, 27.5]:
        sc.sub(tt, 1.4, 36.7, 0.28)

    # sidechain the music bus off every kick
    duck = [1.0] * sc.n
    for kt in sc.kicks:
        i0 = int(kt * SR)
        for i in range(int(0.30 * SR)):
            j = i0 + i
            if j >= sc.n: break
            u = i / (0.30 * SR)
            g = 1.0 - 0.55 * math.exp(-u * 9.0) * (1.0 - math.exp(-i / (0.004 * SR)))
            if g < duck[j]: duck[j] = g
    for i in range(sc.n):
        sc.musicL[i] *= duck[i]; sc.musicR[i] *= duck[i]

    # SFX
    rnd = random.Random(20261030)
    for c in cues.get("sfx", []):
        t0 = float(c["t"]); typ = c["type"]; g = db(float(c.get("gain", -12)))
        pan = float(c.get("pan", 0.0))
        dur = float(c.get("dur", 0.0))
        if typ == "static": sig = sfx_static(dur or 1.0, rnd.randint(0, 9999))
        elif typ == "crt_on": sig = sfx_crt_on()
        elif typ == "head_switch": sig = sfx_head_switch()
        elif typ == "pop": sig = sfx_pop()
        elif typ == "impact": sig = sfx_impact(rnd.randint(0, 5))
        elif typ == "riser": sig = sfx_riser(dur or 1.0, rnd.randint(0, 9999))
        elif typ == "whoosh": sig = sfx_whoosh(dur or 0.5, rnd.randint(0, 9999))
        elif typ == "ui_open": sig = sfx_ui_open()
        elif typ == "ui_error": sig = sfx_ui_error()
        elif typ == "type": sig = sfx_type(dur or 1.0, rnd.randint(0, 9999))
        elif typ == "stamp": sig = sfx_stamp()
        elif typ == "heart": sig = sfx_heart()
        elif typ == "glitch": sig = sfx_glitch()
        elif typ == "rise": sig = sfx_rise(dur or 1.0, rnd.randint(0, 9999))
        elif typ == "charge": sig = sfx_charge(dur or 2.0)
        elif typ == "tick": sig = sfx_tick()
        elif typ == "alarm": sig = sfx_alarm()
        elif typ == "tape_stop": sig = sfx_tape_stop()
        elif typ == "crt_off": sig = sfx_crt_off()
        else: continue
        add_st(sc.sfxL, sc.sfxR, t0, sig, g, pan)

    return sc

# ---------------------------------------------------------------- tape stop + master
def tape_stop_apply(buf, stop_t, dur=0.6):
    """Read the bus with a speed curve that falls 1→0 across [stop_t, stop_t+dur]."""
    n = len(buf); i0 = int(stop_t * SR); i1 = min(n, int((stop_t + dur) * SR))
    if i0 >= n: return buf
    pos = float(i0)
    out = buf[:]
    for j in range(i0, i1):
        u = (j - i0) / max(1, (i1 - i0))
        speed = (1.0 - u) ** 1.5
        pos += speed
        k = int(pos)
        if k >= n: break
        frac = pos - k
        v = buf[k] * (1 - frac) + (buf[k + 1] if k + 1 < n else buf[k]) * frac
        out[j] = v * (1.0 - u * 0.55)
    for j in range(i1, n):
        out[j] = 0.0
    return out

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
    # sum buses, soft-clip
    mixL = [0.0] * n; mixR = [0.0] * n
    for i in range(n):
        mixL[i] = sc.musicL[i] * 0.9 + sc.drumL[i] + sc.sfxL[i]
        mixR[i] = sc.musicR[i] * 0.9 + sc.drumR[i] + sc.sfxR[i]
    # tape stop on the score at the cue
    stop_t = float(cues.get("scenes", {}).get("tape_stop", 29.4))
    mixL = tape_stop_apply(mixL, stop_t, 0.6)
    mixR = tape_stop_apply(mixR, stop_t, 0.6)
    pk = max(1e-9, max(max(abs(v) for v in mixL), max(abs(v) for v in mixR)))
    g = 0.72 / pk
    for i in range(n):
        mixL[i] = math.tanh(mixL[i] * g * 1.15) * 0.92
        mixR[i] = math.tanh(mixR[i] * g * 1.15) * 0.92
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    write_wav(out_path, mixL, mixR)
    # report
    def rms_at(t, d=0.2):
        a = int(t * SR); b = min(n, a + int(d * SR))
        if a >= n: return -99.0
        s = 0.0
        for i in range(a, b): s += mixL[i] * mixL[i]
        return 10 * math.log10(max(1e-12, s / max(1, b - a)))
    print(f"score: {out_path}  {n/SR:.3f}s  peak={pk:.3f}")
    for t in [0.2, 1.1, 3.4, 7.7, 9.8, 12.9, 15.6, 17.5, 21.2, 23.0, 26.1, 27.5, 29.5]:
        print(f"  RMS {t:5.1f}s: {rms_at(t):6.1f} dBFS")

if __name__ == '__main__':
    main()
