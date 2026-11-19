#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Score, foley and mix for a silhouette-rhythm film, driven by a declarative score.json.

    python sound.py <project> [--voice <path>] [--out <dir>]

<project>/score.json declares the whole soundtrack: bpm + duration, the chord plan, the
repeating patterns (bass / shaker / claps / melody / bursts), one-off hits, the water bed
and the foley cues, and where the music must be cut (silence as a tool). The engine below
synthesises every voice from code — nothing sampled, nothing downloaded — in the palette of
STYLE.md §7: tuned wood and metal percussion (kalimba, marimba, woodblock, log drum, chime),
plucked bass, dry kit, claps, shakers, a string pad only for held chords; all foley is water.

Reads  <project>/score.json
       <project>/voice/source_full.wav   (the narration, whole take; only the head is used)
Writes <out>/mix.wav + stem_music.wav + stem_foley.wav + stem_voice.wav   (44.1 kHz float)
       one JSON line with rms / peak so the caller can log the balance.
"""
import argparse, json, math, os
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, butter, lfilter, resample_poly

ap = argparse.ArgumentParser()
ap.add_argument("project")
ap.add_argument("--voice", default="")
ap.add_argument("--out", default="out")
a = ap.parse_args()

P = a.project
S = json.load(open(os.path.join(P, "score.json"), encoding="utf-8"))
OUT = os.path.join(P, a.out)
os.makedirs(OUT, exist_ok=True)
VOICE = a.voice or os.path.join(P, "voice", "source_full.wav")

SR = 44100
DUR = float(S["duration"])
N = int(DUR * SR)
B = 60.0 / float(S.get("bpm", 90))
rng = np.random.default_rng(int(S.get("seed", 1)))
LV = S.get("levels", {})
VOICE_RMS = float(LV.get("voice_rms", 0.115))
G_MUSIC = float(LV.get("music", 0.85))
G_FOLEY = float(LV.get("foley", 1.85))
DUCK_M, DUCK_F = float(LV.get("duck_music", 0.42)), float(LV.get("duck_foley", 0.30))


# ---------------------------------------------------------------- primitives
def buf():
    return np.zeros((N, 2), dtype=np.float64)


def env_ad(n, a0, d, curve=3.0):
    na = max(1, int(a0 * SR)); nd = max(1, int(d * SR))
    e = np.zeros(n)
    e[:na] = np.linspace(0, 1, na)
    k = min(n, na + nd)
    e[na:k] = np.exp(-curve * np.linspace(0, 1, k - na))
    return e


def filt(sig, kind, cut, order=2):
    wn = np.clip(np.array(cut, dtype=float) / (SR / 2), 1e-4, 0.999)
    b, a0 = butter(order, wn, btype=kind)
    return lfilter(b, a0, sig)


def tone(f, dur, a0=0.004, d=0.35, curve=3.0, part=0.0, part_amp=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t)
    if part_amp:
        s = s + part_amp * np.sin(2 * np.pi * f * part * t)
    return s * env_ad(n, a0, d, curve)


# ---------------------------------------------------------------- the palette
def kalimba(f, dur=0.9, amp=1.0):
    return (tone(f, dur, .002, .55, 4.2, 6.0, .22) + .5 * tone(f * 2, dur, .002, .30, 5.0, 3.0, .12)) * amp


def marimba(f, dur=0.55, amp=1.0):
    s = tone(f, dur, .003, .30, 4.6, 4.0, .30)
    p = tone(f * 4, dur, .002, .12, 6.0)
    s[:len(p)] += .35 * p
    return s * amp


def bass(f, dur=0.85, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + .28 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sin(2 * np.pi * 3 * f * t)
    return filt(s, 'low', 320, 2) * env_ad(n, .006, dur * .8, 2.4) * amp


def wood(f, dur=0.18, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 26) + .5 * np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t * 40)
    return (s + .35 * filt(rng.normal(0, 1, n), 'high', 2500, 2) * np.exp(-t * 60)) * amp


def shaker(dur=0.10, amp=1.0, bright=6000):
    n = int(dur * SR); t = np.arange(n) / SR
    return filt(rng.normal(0, 1, n), 'band', [bright - 1800, bright], 2) * np.exp(-t * 40) * amp


def clap(dur=0.22, amp=1.0):
    n = int(dur * SR); s = np.zeros(n)
    for k, off in enumerate([0.0, 0.011, 0.023]):
        m = n - int(off * SR); tt = np.arange(m) / SR
        s[int(off * SR):] += np.exp(-tt * (30 + 6 * k)) * rng.normal(0, 1, m)
    return filt(s, 'band', [900, 5200], 2) * amp


def pad(f, dur, amp=1.0, cut=2400, att=0.5, rel=0.9):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.006, 0.0, 0.007):
        s += np.sin(2 * np.pi * f * (1 + det) * t + rng.uniform(0, 6))
        s += .3 * np.sin(2 * np.pi * f * 2 * (1 + det) * t)
    s = filt(s / 6, 'low', cut, 2)
    e = np.ones(n)
    na, nr = int(att * SR), int(rel * SR)
    e[:na] = np.linspace(0, 1, na)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return s * e * amp


def noise_sweep(dur, f0, f1, amp=1.0, curve=2.0, band=1400):
    n = int(dur * SR); t = np.arange(n) / SR
    s = rng.normal(0, 1, n)
    out = np.zeros(n)
    for k, c in enumerate([f0, (f0 + f1) / 2, f1]):
        w = np.exp(-((t - k * dur / 2) ** 2) / (2 * (dur / 4) ** 2) + 1e-9)
        out += filt(s, 'band', [max(120, c - band / 2), min(16000, c + band / 2)], 2) * w
    return out * env_ad(n, .01, dur, curve) * amp


def splash(dur=0.5, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = filt(rng.normal(0, 1, n), 'band', [700, 7000], 2) * np.exp(-t * 8)
    s += .6 * np.sin(2 * np.pi * (240 * np.exp(-t * 5) + 90) * t) * np.exp(-t * 14)
    return s * amp


def thump(dur=0.7, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (52 * np.exp(-t * 2.2) + 34) * t) * np.exp(-t * 5.0)
    return (s + .4 * filt(rng.normal(0, 1, n), 'low', 260, 2) * np.exp(-t * 18)) * amp


def drip(dur=0.45, amp=1.0, f0=1100):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (1 - .45 * (1 - np.exp(-t * 9)))
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 12) * amp


def chime(f, dur=2.6, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for r, aa in ((1, 1), (2.01, .45), (3.02, .22), (4.97, .12), (6.8, .06)):
        s += aa * np.sin(2 * np.pi * f * r * t) * np.exp(-t * (1.4 + r * .5))
    return s * amp


def logdrum(f, dur=1.0, amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 4.2) + .5 * np.sin(2 * np.pi * f * 1.58 * t) * np.exp(-t * 7)
    return (s + .25 * filt(rng.normal(0, 1, n), 'low', 400, 2) * np.exp(-t * 10)) * amp


VOICES = {'kalimba': kalimba, 'marimba': marimba, 'bass': bass, 'wood': wood, 'shaker': shaker,
          'clap': clap, 'chime': chime, 'logdrum': logdrum, 'splash': splash, 'thump': thump,
          'drip': drip, 'sweep': noise_sweep}


# ---------------------------------------------------------------- the room
def reverb_ir(sec=2.2):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = rng.normal(0, 1, n) * np.exp(-t * 3.4)
    ir = filt(ir, 'low', 5200, 2) * np.exp(-t * 3.4)
    ir = np.repeat(ir[:, None], 2, axis=1)
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = reverb_ir()


def wet(sig, amount=0.30):
    out = np.zeros((len(sig), 2))
    for ch in range(2):
        out[:, ch] = fftconvolve(sig, IR[:, ch])[:len(sig)]
    return out * amount


def put(bus, sig, at, gain=1.0, pan=0.0, send=0.0):
    i0 = int(max(0, at * SR)); i1 = min(N, i0 + len(sig))
    if i1 <= i0:
        return
    if sig.ndim == 2:
        bus[i0:i1] += sig[:i1 - i0] * gain
        return
    lg = math.cos((pan + 1) * math.pi / 4); rg = math.sin((pan + 1) * math.pi / 4)
    bus[i0:i1, 0] += sig[:i1 - i0] * gain * lg
    bus[i0:i1, 1] += sig[:i1 - i0] * gain * rg
    if send:
        w = wet(sig, 1.0)
        bus[i0:i1] += w[:i1 - i0] * gain * send


NAMES = {'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.0, 'Bb1': 58.27, 'Bb2': 116.54,
         'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.0, 'A3': 220.0, 'Bb3': 233.08,
         'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.0, 'A4': 440.0,
         'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.26, 'F5': 698.46,
         'G5': 783.99, 'A5': 880.0}


def freq(name):
    return NAMES[name] if isinstance(name, str) else float(name)


# ---------------------------------------------------------------- score
music = buf()
chords = S.get("chords", [])
for c in chords:
    for k, n in enumerate(c["notes"][:3]):
        put(music, pad(freq(n), c["t1"] - c["t0"] + 0.9, c.get("amp", 1.0) * (.20 - .04 * k),
                       2200 - 300 * k, .45, .9), c["t0"], 1.0, (k - 1) * .3)

for pat in S.get("bass", []) if isinstance(S.get("bass"), list) else ([S["bass"]] if S.get("bass") else []):
    skip = pat.get("skip", [])
    root_g, fifth_g = pat.get("gains", [0.28, 0.15])
    for c in chords:
        if c["t0"] < pat.get("from", 0) - 1e-6 or c["t1"] > pat.get("to", DUR) + 1e-6:
            continue
        if any(a0 <= c["t0"] < b0 for a0, b0 in skip):
            continue
        root = freq(c["notes"][0]) * 2
        b = 0
        while True:
            bt = c["t0"] + b * 4 * B
            if bt >= c["t1"] - .05:
                break
            put(music, bass(root, .90, root_g), bt, 1.0, 0)
            put(music, bass(root * 1.5, .55, fifth_g), bt + 2 * B + B / 2, 1.0, .1)
            b += 1

for pat in S.get("shaker", []) if isinstance(S.get("shaker"), list) else ([S["shaker"]] if S.get("shaker") else []):
    t = pat.get("from", 0.0)
    while t < pat.get("to", DUR):
        g = pat.get("gain", 0.10)
        if t >= pat.get("gain_after", 1e9):
            g = pat.get("gain_late", g)
        put(music, shaker(.09, g), t, 1.0, pat.get("pan", -.35))
        t += B / 2

for pat in S.get("clap", []) if isinstance(S.get("clap"), list) else ([S["clap"]] if S.get("clap") else []):
    t = pat.get("from", 0.0)
    while t < pat.get("to", DUR):
        for k, beat in enumerate(pat.get("beats", [1, 3])):
            put(music, clap(.20, pat.get("gain", .16)), t + beat * B, 1.0, (.25 if k == 0 else -.25))
        t += 4 * B

for mel in S.get("melodies", []):
    step = B if mel.get("step") == "beat" else B / 2
    for i in range(int(mel["n"])):
        f = freq(mel["notes"][i % len(mel["notes"])]) * mel.get("octave", 1)
        put(music, VOICES[mel.get("voice", "kalimba")](f, mel.get("dur", .9), mel.get("gain", .30)),
            mel["from"] + i * step, 1.0, (i - (mel["n"] - 1) / 2) * mel.get("pan_fan", .12), mel.get("send", .45))

for bu in S.get("bursts", []):
    for j in range(int(bu.get("n", 3))):
        note = bu["notes"][min(len(bu["notes"]) - 1, j)]
        put(music, VOICES[bu.get("voice", "kalimba")](freq(note), .5, bu.get("gain", .22)),
            bu["at"] + j * bu.get("gap", .10), 1.0, .2 * (j - 1), bu.get("send", .5))

for h in S.get("hits", []):
    v = VOICES[h.get("voice", "chime")]
    sig = v(freq(h["note"]), h.get("dur", 2.6), h.get("gain", .32))
    put(music, sig, h["at"], 1.0, h.get("pan", 0), h.get("send", .55))

foley = buf()
bed = S.get("bed")
if bed:
    cut = bed.get("cut", [180, 1400])
    base = filt(rng.normal(0, 1, N), 'band', cut, 2)
    lap = (np.sin(2 * np.pi * bed.get("lap_hz", .19) * np.arange(N) / SR) * .5 + .6)
    base = base * lap * bed.get("gain", .035)
    foley[:, 0] += base
    foley[:, 1] += np.roll(base, 137)

for f in S.get("foley", []):
    kind = f["kind"]
    if kind == "sweep":
        sig = noise_sweep(f.get("dur", .55), f.get("f0", 3200), f.get("f1", 900), 1.0, f.get("curve", 2.6), f.get("band", 2200))
    elif kind == "wind":
        n = int(f.get("dur", 3.5) * SR)
        sig = filt(rng.normal(0, 1, n), 'band', f.get("cut", [300, 2600]), 2) * np.linspace(0, .5, n)
    else:
        args = {k: v for k, v in f.items() if k not in ("at", "gain", "pan", "send", "kind")}
        if kind == "wood":
            args.setdefault("f", 150.0)
        if kind in ("chime", "logdrum") and "f0" in args:
            args["f"] = args.pop("f0")
        sig = VOICES[kind](**args)
    put(foley, sig, f["at"], f.get("gain", 1.0), f.get("pan", 0), f.get("send", 0))

# ---------------------------------------------------------------- voice
vo, vsr = sf.read(VOICE, dtype='float64')
if vo.ndim > 1:
    vo = vo.mean(axis=1)
if vsr != SR:
    vo = resample_poly(vo, SR, vsr)
end = int(float(S.get("voice_seconds", DUR)) * SR)
vo = vo[:end].copy()
fade = int(S.get("voice_fade", .22) * SR)
if fade < len(vo):
    vo[-fade:] *= np.linspace(1, 0, fade)
vo = filt(filt(vo, 'high', 85, 2), 'low', 12000, 2)
vo = vo / max(np.sqrt((vo ** 2).mean()), 1e-9) * VOICE_RMS
vo = np.tanh(vo / 0.30) * 0.30 / np.tanh(1.0)

vobus = np.zeros((N, 2))
vobus[:len(vo), 0] = vo
vobus[:len(vo), 1] = vo

env = np.convolve(np.abs(vobus[:, 0]), np.ones(int(.05 * SR)) / int(.05 * SR), mode='same')
env = np.clip(env / (env.max() + 1e-9) * 3.2, 0, 1)
music *= (1.0 - DUCK_M * env)[:, None]
foley *= (1.0 - DUCK_F * env)[:, None]

for a0, b0 in S.get("silences", []):
    i0, i1 = int(a0 * SR), int(b0 * SR)
    music[i0:i1] *= np.linspace(1, 0, max(1, i1 - i0))[:, None]

mix = vobus + music * G_MUSIC + foley * G_FOLEY
mix = filt(mix.T, 'high', 32, 2).T
# level from the peak of |mix| (peak_ref 0.999 ignores one stray sample; the noise bursts
# move a few dB between takes, so a single spike can otherwise set the whole bed's gain)
pk = float(np.quantile(np.abs(mix), float(LV.get("peak_ref", 1.0))))
if pk > 0.95:
    mix *= 0.95 / pk
mix = np.tanh(mix * 1.10) / 1.10

sf.write(os.path.join(OUT, 'mix.wav'), mix.astype('float32'), SR, subtype='FLOAT')
sf.write(os.path.join(OUT, 'stem_music.wav'), (music * G_MUSIC).astype('float32'), SR, subtype='FLOAT')
sf.write(os.path.join(OUT, 'stem_foley.wav'), (foley * G_FOLEY).astype('float32'), SR, subtype='FLOAT')
sf.write(os.path.join(OUT, 'stem_voice.wav'), vobus.astype('float32'), SR, subtype='FLOAT')

print(json.dumps({'dur': DUR, 'rms': round(float(np.sqrt((mix ** 2).mean())), 4),
                  'peak': round(float(np.abs(mix).max()), 4),
                  'rms_db': round(20 * math.log10(max(1e-9, float(np.sqrt((mix ** 2).mean())))), 2),
                  'voice_db': round(20 * math.log10(max(1e-9, float(np.sqrt((vo ** 2).mean())))), 2),
                  'events': len(S.get("foley", [])), 'hits': len(S.get("hits", []))}, ensure_ascii=False))
