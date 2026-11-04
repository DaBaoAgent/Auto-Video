"""audio.py — 272 秒全片配乐 + 音效 + 配音混音（确定性，固定种子）。

读同目录 cues.json（cuts / subs / hits），写 out/music.wav、out/mix_raw.wav。
响度归一化在 make_audio.sh 里用 ffmpeg loudnorm 两遍完成。

配乐：84 BPM，D 弗里几亚，按段落推进强度（0 静 → 3 洪水/溃坝最猛）。
音效：切点 whoosh、关键词铃、字幕打字机细响、段落环境声（海/风/雨）。
"""
import json, os, wave, zlib
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
DUR = float(CUE['duration'])
N = int(SR * DUR)
VOICE = os.environ.get('XIANGSU_VOICE') or ''
if not VOICE:
    raise SystemExit('未设置 XIANGSU_VOICE（旁白 wav 路径）；例 XIANGSU_VOICE=D:/@kaifa/yandi/output/002_xxx/配音.wav')
if not os.path.exists(VOICE):
    raise SystemExit('旁白不存在：%s' % VOICE)
rng = np.random.default_rng(20261029)

BPM = 84.0
BEAT = 60.0 / BPM
BAR = BEAT * 4

# ------------------------------------------------------------------ helpers
def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)

def adsr(n, a=0.004, d=0.05, r=0.02, sustain=0.5):
    e = np.ones(n, dtype=np.float32)
    a_n = min(n, max(1, int(a * SR)))
    e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    r_n = min(n, max(1, int(r * SR)))
    e[-r_n:] *= np.linspace(1, 0, r_n)
    return e

def square(freq, n, duty=0.5, detune=0.0):
    ph = (np.arange(n) * freq * (1 + detune) / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0).astype(np.float32)

def tri(freq, n):
    ph = (np.arange(n) * freq / SR) % 1.0
    return (4 * np.abs(ph - 0.5) - 1).astype(np.float32)

def noise(n, seed=0):
    r = np.random.default_rng(seed)
    return r.uniform(-1, 1, n).astype(np.float32)

def lowpass(x, cut, sr=SR):
    n = len(x)
    if n < 16:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / sr)
    X /= (1.0 + (f / cut) ** 4)
    return np.fft.irfft(X, n).astype(np.float32)

def highpass(x, cut, sr=SR):
    return x - lowpass(x, cut, sr)

def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += (sig[:j - i] * gain).astype(np.float32)

# ------------------------------------------------------------------ instruments
def pluck(midi, dur, gain=1.0, duty=0.25):
    n = int(dur * SR); f = hz(midi)
    s = square(f, n, duty) * 0.6 + tri(f * 2, n) * 0.25
    e = adsr(n, 0.002, 0.05, 0.02, 0.25) * np.exp(-np.arange(n) / SR * 7.0)
    return s * e * gain

def bass(midi, dur, gain=1.0):
    n = int(dur * SR); f = hz(midi)
    s = tri(f, n) * 0.8 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.2
    e = adsr(n, 0.004, 0.05, 0.02, 0.55)
    return np.tanh(s * 1.6) * e * gain

def bell(midi, dur, gain=1.0):
    n = int(dur * SR); x = np.arange(n) / SR; f = hz(midi)
    s = (np.sin(2 * np.pi * f * x) * 0.6 + np.sin(2 * np.pi * f * 2.01 * x) * 0.25
         + np.sin(2 * np.pi * f * 3.02 * x) * 0.12)
    return s * np.exp(-x * 5.5) * gain

def pad(midis, dur, gain=1.0, cut=1500):
    n = int(dur * SR)
    out = np.zeros(n, dtype=np.float32)
    for m in midis:
        f = hz(m)
        out += square(f, n, 0.5, -0.004) * 0.20 + square(f, n, 0.5, 0.004) * 0.20
    out = lowpass(out, cut)
    return out * adsr(n, 0.5, 0.4, 0.45, 0.55) * gain

def kick(gain=1.0):
    n = int(0.16 * SR); x = np.arange(n) / SR
    f = 150 * np.exp(-x * 26) + 46
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 22) * gain

def snare(seed=1, gain=1.0):
    n = int(0.12 * SR); x = np.arange(n) / SR
    s = noise(n, seed) * np.exp(-x * 34)
    s += np.sin(2 * np.pi * 190 * x) * np.exp(-x * 40) * 0.4
    return highpass(s, 900) * gain

def hat(seed=2, gain=1.0):
    n = int(0.05 * SR); x = np.arange(n) / SR
    return highpass(noise(n, seed), 5200) * np.exp(-x * 90) * gain

# ------------------------------------------------------------------ score
D2, Eb2, F2, G2, A2 = 38, 39, 41, 43, 45
D3, Eb3, F3, G3, A3, Bb3 = 50, 51, 53, 55, 57, 58
D4, Eb4, F4, G4, A4, Bb4, C5, D5, Eb5 = 62, 63, 65, 67, 69, 70, 72, 74, 75

# 段落：起, 止, 名称, 强度(0..3), 四小节和声（低音, 和弦两音）
SECTIONS = [
    (0.0, 10.1, 'open', 1, [(D2, [D3, A3]), (D2, [F3, A3]), (Eb2, [Eb3, Bb3]), (D2, [D3, A3])]),
    (10.1, 26.9, 'teaching', 1, [(D2, [D3, F3]), (F2, [F3, A3]), (Eb2, [Eb3, G3]), (D2, [D3, A3])]),
    (26.9, 37.0, 'investigate', 1, [(D2, [F3, A3]), (Bb3 - 12, [D4, F4]), (Eb2, [Eb3, Bb3]), (A2, [A3, D4])]),
    (37.0, 51.0, 'voyage', 2, [(D2, [D3, A3]), (A2, [A3, C5]), (Eb2, [G3, Bb3]), (F2, [F3, C5])]),
    (51.0, 60.9, 'flood', 3, [(D2, [D3, F3]), (D2, [Eb3, A3]), (Eb2, [Eb3, G3]), (D2, [D3, A3])]),
    (60.9, 80.7, 'evidence', 1, [(D2, [F3, A3]), (G2, [G3, Bb3]), (Eb2, [Eb3, G3]), (D2, [D3, A3])]),
    (80.7, 90.4, 'ghost', 1, [(Eb2, [Eb3, Bb3]), (D2, [D3, A3]), (Eb2, [F3, Bb3]), (D2, [D3, A3])]),
    (90.4, 103.7, 'deep', 1, [(D2, [D3, F3]), (Eb2, [Eb3, G3]), (D2, [F3, A3]), (A2, [A3, D4])]),
    (103.7, 113.2, 'scan', 2, [(D2, [D3, A3]), (D2, [F3, A3]), (Eb2, [Eb3, Bb3]), (F2, [F3, A3])]),
    (113.2, 145.9, 'ice', 1, [(D2, [D3, A3]), (Eb2, [Eb3, Bb3]), (F2, [F3, C5]), (D2, [D3, A3])]),
    (145.9, 156.3, 'oasis', 1, [(F2, [F3, A3]), (Eb2, [Eb3, G3]), (D2, [D3, F3]), (D2, [D3, A3])]),
    (156.3, 192.8, 'cataclysm', 3, [(D2, [D3, F3]), (Eb2, [Eb3, A3]), (D2, [F3, A3]), (Eb2, [Eb3, Bb3])]),
    (192.8, 217.3, 'myth', 1, [(D2, [F3, A3]), (Bb3 - 12, [D4, F4]), (Eb2, [Eb3, G3]), (D2, [D3, A3])]),
    (217.3, 245.6, 'rebirth', 2, [(D2, [D3, A3]), (F2, [F3, A3]), (Eb2, [Eb3, G3]), (D2, [D3, A3])]),
    (245.6, 265.5, 'decline', 1, [(D2, [D3, F3]), (Eb2, [Eb3, Bb3]), (D2, [D3, A3]), (A2, [A3, D4])]),
    (265.5, DUR + 1, 'coda', 1, [(D2, [D3, F3]), (D2, [D3, A3]), (Eb2, [Eb3, Bb3]), (D2, [D3, A3])]),
]

def section_at(t):
    for s in SECTIONS:
        if s[0] <= t < s[1]:
            return s
    return SECTIONS[-1]

def build_music():
    M = np.zeros(N, dtype=np.float32)
    b = 0
    while b * BAR < DUR:
        t0 = b * BAR
        _, _, name, inten, prog = section_at(t0)
        root, ch = prog[b % 4]
        # 低音
        if inten >= 3:
            for k in range(8):
                place(M, bass(root, BEAT * 0.45, 0.26), t0 + k * BEAT * 0.5)
        elif inten == 2:
            for k in range(4):
                place(M, bass(root, BEAT * 0.8, 0.24), t0 + k * BEAT)
        else:
            place(M, bass(root, BAR * 0.9, 0.22), t0)
        # 铺底和弦
        place(M, pad(ch, BAR * 0.95, 0.10 if inten < 3 else 0.13, 1200 + inten * 300), t0)
        # 琶音
        arp = [ch[0] + 12, ch[1] + 12, ch[0] + 19, ch[1] + 12]
        for k in range(4):
            if inten >= 3 or (inten == 2 and k % 2 == 0) or (inten <= 1 and k == 0):
                place(M, pluck(arp[(k + b) % 4], 0.22, 0.085 if inten < 2 else 0.10), t0 + k * BEAT)
        # 鼓
        if inten >= 2:
            place(M, kick(0.34), t0)
            place(M, kick(0.24), t0 + BEAT * 2)
            place(M, snare(100 + b, 0.09), t0 + BEAT)
            place(M, snare(200 + b, 0.09), t0 + BEAT * 3)
            for k in range(8):
                place(M, hat(300 + b * 8 + k, 0.030), t0 + k * BEAT * 0.5)
        if inten >= 3:
            place(M, kick(0.26), t0 + BEAT)
            place(M, kick(0.26), t0 + BEAT * 3)
        # 每两小节一块低铃
        if b % 2 == 0:
            place(M, bell(ch[1] + 12, 1.6, 0.030 if inten < 3 else 0.042), t0 + BEAT * 0.5)
        b += 1
    return M

# ------------------------------------------------------------------ sfx
AMB_BEDS = [
    # (起, 止, 类型, 增益)
    (10.1, 16.7, 'sea', 0.055), (33.9, 37.0, 'sea', 0.045), (40.9, 45.6, 'sea', 0.045),
    (51.0, 60.9, 'rain', 0.070), (80.7, 86.4, 'sea', 0.050), (150.3, 156.3, 'sea', 0.050),
    (165.4, 171.1, 'wind', 0.055), (186.2, 192.8, 'storm', 0.075), (217.3, 223.4, 'rain', 0.045),
    (223.4, 230.9, 'sea', 0.040), (251.3, 259.5, 'wind', 0.050), (259.5, 272.0, 'sea', 0.035),
]

def bed_noise(kind, dur, seed):
    n = int(dur * SR)
    x = noise(n, seed)
    if kind == 'sea':
        x = lowpass(x, 900) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.22 * np.arange(n) / SR))
    elif kind == 'rain':
        x = highpass(lowpass(x, 5200), 900)
    elif kind == 'storm':
        x = lowpass(x, 1400)
    else:  # wind
        x = lowpass(x, 600) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * np.arange(n) / SR + 0.7))
    e = np.minimum(1, np.arange(n) / (0.6 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.8 * SR))
    return x * e

def build_sfx():
    S = np.zeros(N, dtype=np.float32)
    # 环境声
    for i, (a, b2, kind, g) in enumerate(AMB_BEDS):
        if a >= DUR:
            continue
        dur = min(b2, DUR) - a
        place(S, bed_noise(kind, dur, 700 + i), a, g)
    # 切点 whoosh
    for hh in CUE['hits']:
        if hh.get('kind') != 'cut':
            continue
        at = hh['t']
        n = int(0.26 * SR); x = np.arange(n) / SR
        w = lowpass(noise(n, 900 + int(at * 10)), 2400) * (x / 0.26) ** 1.6 * np.exp(-x * 9)
        place(S, w, at, 0.16)
        place(S, kick(0.16), at)
    # 关键词：轻铃
    for hh in CUE['hits']:
        k = hh.get('kind')
        if not k or k == 'cut':
            continue
        midi = [74, 77, 81, 84, 86][zlib.crc32(k.encode('utf-8')) % 5]
        place(S, bell(midi, 0.7, 0.035), hh['t'])
    # 字幕打字机
    for s in CUE['subs']:
        for ci in range(len(s['text'])):
            at = s['t0'] + ci * 0.026
            if at >= DUR - 0.06:
                break
            n = int(0.016 * SR); x = np.arange(n) / SR
            place(S, highpass(noise(n, 300 + ci % 37), 2600) * np.exp(-x * 150), at, 0.022)
    return S

# ------------------------------------------------------------------ real sfx（音效库）
def build_real_sfx():
    plan = json.load(open(os.path.join(HERE, 'sfx_cues.json'), encoding='utf-8'))
    S = np.zeros(N, dtype=np.float32)
    for i, cue in enumerate(plan['cues']):
        p = os.path.join(HERE, 'out', 'sfx_prep', f'{i:02d}.wav')
        if not os.path.isfile(p):
            raise SystemExit('缺少 %s，先跑 sfx_prep.py' % p)
        with wave.open(p, 'rb') as w:
            assert w.getframerate() == SR and w.getnchannels() == 1, p
            raw = w.readframes(w.getnframes())
        x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
        place(S, x, float(cue['t']), 1.0)
    return S, float(plan.get('mix_gain', 0.55)), len(plan['cues'])

# ------------------------------------------------------------------ voice
def load_voice():
    with wave.open(VOICE, 'rb') as w:
        sr = w.getframerate(); ch = w.getnchannels(); sw = w.getsampwidth()
        raw = w.readframes(w.getnframes())
    assert sw == 2, sw
    x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    idx = np.arange(N) * (sr / SR)
    y = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    y -= np.mean(y)
    head = int(0.02 * SR); y[:head] *= np.linspace(0, 1, head)
    tail = int(0.30 * SR); y[-tail:] *= np.linspace(1, 0, tail)
    return y

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    stereo = np.stack([x, x], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((stereo * 32767).astype('<i2').tobytes())

if __name__ == '__main__':
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    print('music…')
    music = build_music() * 0.8
    print('sfx…')
    sfx = build_sfx()
    print('real sfx…')
    real, mg, nreal = build_real_sfx()
    bed = music + sfx
    peak = float(np.max(np.abs(bed))) or 1.0
    bed = bed / peak * 0.62
    write_wav(os.path.join(HERE, 'out', 'music.wav'), bed)
    print('voice…')
    voice = load_voice()
    vp = float(np.max(np.abs(voice))) or 1.0
    voice = voice / vp * 0.86
    mix = voice + bed * 0.20 + real * mg
    pk = float(np.max(np.abs(mix))) or 1.0
    if pk > 0.95:
        mix *= 0.95 / pk
        print('mix peak %.3f → scaled to 0.95' % pk)
    write_wav(os.path.join(HERE, 'out', 'mix_raw.wav'), mix)
    print('real sfx: %d 条, 素材峰值 %.3f, 混入增益 %.2f' % (nreal, float(np.max(np.abs(real))), mg))
    print('done: %.1f s, music.wav + mix_raw.wav' % DUR)
