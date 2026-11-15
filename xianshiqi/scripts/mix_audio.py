#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xianshiqi · narration + darksynth score mixer (stdlib only).

  python xianshiqi/scripts/mix_audio.py <project_dir> [--score-gain 0.42] [--voice-gain 1.0]

Reads audio/narration30.wav (48k stereo) and audio/score.wav (48k stereo),
applies a short voice fade inside the sample's end_fade window, mixes,
writes audio/fullmix_raw.wav. The caller then runs ffmpeg loudnorm.
"""
import json, math, os, struct, sys, wave
from array import array

SR = 48000


def read_wav(path):
    with wave.open(path, 'rb') as w:
        ch = w.getnchannels(); sw = w.getsampwidth(); sr = w.getframerate(); n = w.getnframes()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f'{path}: expected 16-bit PCM, got {sw*8}-bit')
    vals = struct.unpack('<' + 'h' * (len(raw) // 2), raw)
    if ch == 1:
        L = [v / 32768.0 for v in vals]; R = list(L)
    else:
        L = [vals[i] / 32768.0 for i in range(0, len(vals), 2)]
        R = [vals[i + 1] / 32768.0 for i in range(0, len(vals), 2)]
    return L, R, sr


def end_fade(buf, t0, t1, sr=SR):
    n = len(buf); i0 = int(t0 * sr); i1 = min(n, int(t1 * sr))
    if i0 >= n: return buf
    out = buf[:]
    for j in range(i0, n):
        u = min(1.0, (j - i0) / max(1, i1 - i0))
        out[j] *= 1.0 - u * u * (3 - 2 * u)
    return out


def write_wav(path, L, R, sr=SR):
    data = array('h')
    for i in range(len(L)):
        l = max(-32767, min(32767, int(L[i] * 32767)))
        r = max(-32767, min(32767, int(R[i] * 32767)))
        data.append(l); data.append(r)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(data.tobytes())


def main():
    proj = sys.argv[1] if len(sys.argv) > 1 else '.'
    score_gain = 0.42
    voice_gain = 1.0
    args = sys.argv[2:]
    for i, a in enumerate(args):
        if a == '--score-gain': score_gain = float(args[i + 1])
        if a == '--voice-gain': voice_gain = float(args[i + 1])
    cues = json.load(open(os.path.join(proj, 'cues.json'), encoding='utf-8'))
    vL, vR, sr = read_wav(os.path.join(proj, 'audio', 'narration30.wav'))
    sL, sR, sr2 = read_wav(os.path.join(proj, 'audio', 'score.wav'))
    if sr != sr2 or sr != SR:
        raise SystemExit(f'sample-rate mismatch: {sr} / {sr2}')
    n = min(len(vL), len(sL), int(cues['duration'] * SR))
    e0, e1 = cues.get('scenes', {}).get('end_fade', [29.3, 30.0])
    vL = end_fade(vL[:n], float(e0), float(e1)); vR = end_fade(vR[:n], float(e0), float(e1))
    L = [vL[i] * voice_gain + sL[i] * score_gain for i in range(n)]
    R = [vR[i] * voice_gain + sR[i] * score_gain for i in range(n)]
    pk = max(1e-9, max(max(abs(x) for x in L), max(abs(x) for x in R)))
    if pk > 0.98:
        g = 0.98 / pk
        L = [x * g for x in L]; R = [x * g for x in R]
        pk = 0.98
    out = os.path.join(proj, 'audio', 'fullmix_raw.wav')
    write_wav(out, L, R)

    def rms(t, d=0.3):
        a = int(t * SR); b = min(n, a + int(d * SR))
        if a >= n: return -99.0
        s = sum(L[i] * L[i] for i in range(a, b)) / max(1, b - a)
        return 10 * math.log10(max(1e-12, s))
    print(f'wrote {out}  {n/SR:.3f}s  peak={pk:.3f}  score_gain={score_gain}')
    for t in [0.3, 2.5, 4.7, 8.6, 13.1, 14.5, 19.3, 22.0, 25.4, 27.5, 29.4]:
        print(f'  mix RMS {t:5.1f}s: {rms(t):6.1f} dBFS')


if __name__ == '__main__':
    main()
