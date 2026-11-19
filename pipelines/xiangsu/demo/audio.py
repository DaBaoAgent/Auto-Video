"""audio.py — 10 s score + cue-aligned SFX for the Persian Gulf Eden pixel sample.

Deterministic: fixed seed. Writes out/music.wav and out/mix_raw.wav (music + voice).
Loudness pass afterwards with ffmpeg loudnorm (two-pass) in make_audio.sh.
"""
import json, os, wave
import numpy as np

SR = 48000
DUR = 10.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get('XIANGSU_VOICE', 'D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/配音.wav')

CUE = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
rng = np.random.default_rng(20261028)
tt = np.arange(N) / SR


# ------------------------------------------------------------------ helpers
def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def adsr(n, a=0.004, d=0.06, s=0.0, r=0.03, sustain_level=0.0):
    a_n = max(1, int(a * SR)); d_n = max(1, int(d * SR)); r_n = max(1, int(r * SR))
    e = np.zeros(n)
    a_n = min(a_n, n)
    e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    rest = n - a_n
    if rest > 0:
        d_n2 = min(d_n, rest)
        e[a_n:a_n + d_n2] = np.linspace(1, sustain_level, d_n2, endpoint=False)
        if rest > d_n2:
            e[a_n + d_n2:] = sustain_level
    if r_n < n:
        e[-r_n:] *= np.linspace(1, 0, r_n)
    return e


def square(freq, dur, duty=0.5, detune=0.0):
    n = int(dur * SR)
    ph = (np.arange(n) * freq * (1 + detune) / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def tri(freq, dur):
    n = int(dur * SR)
    ph = (np.arange(n) * freq / SR) % 1.0
    return 4 * np.abs(ph - 0.5) - 1


def noise(dur, seed=0):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    return r.uniform(-1, 1, n)


def lowpass_fast(x, cut):
    n = len(x)
    if n < 8:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    X = X / (1.0 + (f / cut) ** 4)
    return np.fft.irfft(X, n)


def highpass_fast(x, cut):
    return x - lowpass_fast(x, cut)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig = sig[-i:]
        i = 0
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[:j - i] * gain


# ------------------------------------------------------------------ instruments
def pluck(midi, dur, gain=1.0, duty=0.25):
    f = note_hz(midi)
    n = int(dur * SR)
    s = square(f, dur, duty) * 0.6 + tri(f * 2, dur) * 0.25
    e = adsr(n, 0.002, 0.05, 0, 0.02, 0.25)
    e *= np.exp(-np.arange(n) / SR * 7.0)
    return s * e * gain


def bass(midi, dur, gain=1.0):
    f = note_hz(midi)
    n = int(dur * SR)
    s = tri(f, dur) * 0.8 + np.sin(2 * np.pi * f * tt[:n]) * 0.2
    e = adsr(n, 0.004, 0.05, 0, 0.02, 0.55)
    return np.tanh(s * 1.6) * e * gain


def bell(midi, dur, gain=1.0):
    f = note_hz(midi)
    n = int(dur * SR)
    x = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * x) * 0.6 + np.sin(2 * np.pi * f * 2.01 * x) * 0.25
         + np.sin(2 * np.pi * f * 3.02 * x) * 0.12)
    return s * np.exp(-x * 5.5) * gain


def kick(gain=1.0):
    n = int(0.16 * SR)
    x = np.arange(n) / SR
    f = 150 * np.exp(-x * 26) + 46
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return s * np.exp(-x * 22) * gain


def snare(seed=1, gain=1.0):
    n = int(0.12 * SR)
    x = np.arange(n) / SR
    s = noise(0.12, seed) * np.exp(-x * 34)
    s += np.sin(2 * np.pi * 190 * x) * np.exp(-x * 40) * 0.4
    return highpass_fast(s, 900) * gain


def hat(seed=2, gain=1.0):
    n = int(0.05 * SR)
    x = np.arange(n) / SR
    return highpass_fast(noise(0.05, seed), 5200) * np.exp(-x * 90) * gain


def pad(midis, dur, gain=1.0, cut=1600):
    n = int(dur * SR)
    out = np.zeros(n)
    for m in midis:
        f = note_hz(m)
        out += square(f, dur, 0.5, -0.004) * 0.22 + square(f, dur, 0.5, 0.004) * 0.22
    out = lowpass_fast(out, cut)
    return out * adsr(n, 0.55, 0.5, 0, 0.45, 0.55) * gain


# ------------------------------------------------------------------ score (D Phrygian — ancient, unresolved)
def build_music():
    M = np.zeros(N)
    D2, Eb2, F2, G2, A2 = 38, 39, 41, 43, 45
    D3, Eb3, F3, G3, A3, Bb3 = 50, 51, 53, 55, 57, 58
    D4, Eb4, F4, G4, A4, Bb4, C5, D5, Eb5 = 62, 63, 65, 67, 69, 70, 72, 74, 75

    # 0.00-1.32 excavation: low drone, sparse bells
    place(M, bass(D2, 1.40, 0.30), 0.0)
    place(M, pad([D3, A3], 1.30, 0.10, 900), 0.0)
    for i, at in enumerate([0.14, 0.52, 0.88, 1.16]):
        place(M, bell([D5, Bb4, A4, G4][i], 0.85, 0.075), at)

    # 1.32-2.56 robe / tiara: calm theme
    place(M, bass(D2, 1.30, 0.28), 1.32)
    place(M, bell(D5, 0.9, 0.06), 1.32)
    for i, at in enumerate([1.36, 1.66, 1.96, 2.26]):
        place(M, pluck([D4, F4, Eb4, D4][i], 0.22, 0.11), at)

    # 2.56-3.66 fish skin: rising arpeggio + high shimmer
    place(M, bass(D2, 1.10, 0.24), 2.56)
    for i, m in enumerate([D4, F4, A4, Bb4, D5, Eb5]):
        place(M, pluck(m, 0.16, 0.10), 2.56 + i * 0.11)
    for i, at in enumerate([2.60, 2.86, 3.12, 3.38]):
        place(M, bell([84, 88, 91, 88][i], 0.5, 0.035), at)

    # 3.66-4.96 Sumer city: frame drums + ostinato
    for i, at in enumerate([3.66, 3.96, 4.26, 4.56, 4.86]):
        place(M, kick(0.42 if i % 2 == 0 else 0.30), at)
        place(M, bass([D2, D2, F2, Eb2, D2][i], 0.22, 0.30), at)
    for i, at in enumerate([3.80, 4.10, 4.40, 4.70]):
        place(M, snare(160 + i, 0.10), at)
    for i, at in enumerate([3.75, 4.05, 4.35, 4.65]):
        place(M, pluck([D5, C5, Bb4, A4][i], 0.20, 0.10), at)
    place(M, bell(D5, 0.8, 0.05), 3.66)
    place(M, bell(A4, 0.8, 0.05), 4.66)

    # 4.96-6.96 temple: slow drums + choir pad + god theme
    place(M, pad([D3, A3, D4], 2.0, 0.16, 1400), 4.96)
    place(M, bass(D2, 1.90, 0.26), 4.96)
    for i in range(8):
        at = 4.96 + i * 0.25
        if i % 2 == 0:
            place(M, kick(0.34), at)
        else:
            place(M, snare(200 + i, 0.10), at)
    for i, at in enumerate([5.10, 5.48, 5.80, 6.10, 6.42, 6.70]):
        place(M, bell([D5, D5, Bb4, A4, G4, A4][i], 0.7, 0.055), at)
    for i, at in enumerate([5.20, 5.70, 6.20, 6.70]):
        place(M, pluck([A4, Bb4, A4, G4][i], 0.22, 0.08), at)

    # 6.96-8.60 sea + constellation: strip back, stars as bells
    place(M, bass(D2, 1.70, 0.22), 6.96)
    for i, at in enumerate([7.12, 7.52, 7.92, 8.28]):
        place(M, bell([74, 77, 81, 84][i], 1.0, 0.055), at)
    for i, at in enumerate([7.30, 7.90]):
        place(M, pluck([D5, Eb5][i], 0.5, 0.06), at)

    # 8.60-10.0 emergence: riser, burst, unresolved Eb
    for i, midi in enumerate([62, 63, 65, 67, 69, 70, 72, 74]):
        place(M, pluck(midi, 0.10, 0.10), 8.30 + i * 0.05)
    place(M, pad([D3, Eb3, A3], 1.40, 0.14, 1200), 8.66)
    place(M, bass(D2, 1.30, 0.34), 8.66)
    place(M, kick(0.50), 8.66)
    for i, midi in enumerate([86, 89, 93, 98]):
        place(M, bell(midi, 0.9, 0.05), 8.70 + i * 0.06)
    return M


# ------------------------------------------------------------------ sfx
def build_sfx():
    S = np.zeros(N)
    h = CUE['hits']

    # wind over the dig, opening only
    wind = lowpass_fast(noise(DUR, 12), 700) * 0.030
    envw = np.minimum(1, np.minimum(tt / 0.4, np.maximum(0, (1.7 - tt) / 0.7)))
    S += wind * envw

    # trowel scrapes in shot A
    for i, at in enumerate([0.30, 0.72]):
        n = int(0.30 * SR); x = np.arange(n) / SR
        s = lowpass_fast(noise(0.30, 30 + i), 2200) * np.exp(-x * 10) * 0.14
        place(S, s, at)
    n = int(0.10 * SR); x = np.arange(n) / SR
    place(S, (highpass_fast(noise(0.10, 33), 2600) * np.exp(-x * 60) * 0.12
              + np.sin(2 * np.pi * 2100 * x) * np.exp(-x * 90) * 0.06), 0.95)

    # stone dust slides as the robe is framed
    n = int(0.42 * SR); x = np.arange(n) / SR
    place(S, lowpass_fast(noise(0.42, 41), 1000) * np.exp(-x * 9) * 0.16, h['robe'])

    # scales sweeping under the light
    n = int(0.55 * SR); x = np.arange(n) / SR
    brush = highpass_fast(noise(0.55, 44), 2200) * (0.5 + 0.5 * np.sin(2 * np.pi * 26 * x)) * 0.10
    brush *= np.minimum(1, x / 0.08) * np.exp(-np.maximum(0, x - 0.35) * 6)
    place(S, brush, h['scales'])

    # city: distant drum + birds
    place(S, kick(0.30), h['city'])
    for k in range(3):
        n = int(0.16 * SR); x = np.arange(n) / SR
        chirp = np.sin(2 * np.pi * (1800 + 900 * np.sin(x * 40)) * x) * np.exp(-x * 18) * 0.020
        place(S, highpass_fast(chirp, 1500), 4.10 + k * 0.19)

    # temple: low gong + brazier crackle + lamp wick
    place(S, bell(50, 1.2, 0.12), h['temple'])
    place(S, bell(57, 0.9, 0.06), h['temple'] + 0.02)
    for i in range(26):
        at = 4.98 + rng.random() * 1.95
        n = int(0.02 * SR); x = np.arange(n) / SR
        place(S, highpass_fast(noise(0.02, 300 + i), 2400) * np.exp(-x * 160) * 0.05, at)
    n = int(0.10 * SR); x = np.arange(n) / SR
    place(S, highpass_fast(noise(0.10, 77), 1800) * np.exp(-x * 40) * 0.05, h['lamp'])

    # sea wash
    n = int(0.90 * SR); x = np.arange(n) / SR
    wave = lowpass_fast(noise(0.90, 88), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.4 * x)) * 0.10
    wave *= np.minimum(1, x / 0.25) * np.exp(-np.maximum(0, x - 0.6) * 5)
    place(S, wave, h['sea'])

    # constellation chimes
    for i, at in enumerate([7.10, 7.38, 7.66, 7.94, 8.22]):
        place(S, bell([93, 98, 96, 100, 98][i], 0.6, 0.035), at)

    # riser into the breach
    n = int(0.32 * SR); x = np.arange(n) / SR
    riser = highpass_fast(noise(0.32, 99), 900) * (x / 0.32) ** 2 * 0.26
    place(S, riser, 8.30)

    # breach: boom + splash + spray + drips
    n = int(1.40 * SR); x = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(64 * np.exp(-x * 4) + 30) / SR) * np.exp(-x * 3.0) * 0.55
    place(S, boom, h['burst'])
    n = int(1.10 * SR); x = np.arange(n) / SR
    splash = highpass_fast(noise(1.10, 101), 800) * np.exp(-x * 4.2) * 0.30
    splash *= np.minimum(1, x / 0.02)
    place(S, splash, h['burst'])
    for i in range(24):
        at = 8.70 + rng.random() * 0.80
        n = int(0.03 * SR); x = np.arange(n) / SR
        place(S, np.sin(2 * np.pi * (2400 + rng.random() * 900) * x) * np.exp(-x * 120) * 0.020, at)

    # typewriter ticks under each subtitle line
    for s in CUE['subs']:
        for k in range(len(s['text'])):
            at = s['t0'] + k * 0.024
            if at > 9.9:
                break
            n = int(0.02 * SR); x = np.arange(n) / SR
            place(S, highpass_fast(noise(0.02, 300 + k), 2600) * np.exp(-x * 140) * 0.05, at)
    return S


def load_voice():
    with wave.open(VOICE, 'rb') as w:
        sr = w.getframerate(); ch = w.getnchannels(); sw = w.getsampwidth()
        raw = w.readframes(w.getnframes())
    assert sw == 2
    x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    want = int(DUR * sr)
    x = x[:want]
    idx = np.arange(int(DUR * SR)) * (sr / SR)
    y = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    if len(y) < N:
        y = np.pad(y, (0, N - len(y)))
    y = highpass_fast(y, 70)
    # The 10.0 s cut lands inside the final word (物 ends at 10.10). 60 ms tail fade, 40 ms head fade.
    fade = int(0.06 * SR)
    y[-fade:] *= np.linspace(1, 0, fade)
    head = int(0.04 * SR)
    y[:head] *= np.linspace(0, 1, head)
    return y


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    stereo = np.stack([x, x], axis=1)
    data = (stereo * 32767).astype('<i2').tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(data)


if __name__ == '__main__':
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    music = build_music() * 0.8
    sfx = build_sfx()
    bed = music + sfx
    peak = np.max(np.abs(bed)) or 1
    bed = bed / peak * 0.62
    write_wav(os.path.join(HERE, 'out', 'music.wav'), bed)

    voice = load_voice()
    vp = np.max(np.abs(voice)) or 1
    voice = voice / vp * 0.86
    mix = voice * 1.0 + bed * 0.13
    write_wav(os.path.join(HERE, 'out', 'mix_raw.wav'), mix)
    print('music.wav + mix_raw.wav written')
