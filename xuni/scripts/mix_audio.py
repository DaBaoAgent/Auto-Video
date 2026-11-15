#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xuni · narration + score mixer (stdlib only).

  python xuni/scripts/mix_audio.py <project_dir> [--score-gain 0.45] [--voice-gain 1.0]

Reads  audio/narration30.wav (48k stereo) and audio/score.wav (48k stereo),
applies the same tape-stop to the voice at cues.scenes.tape_stop, mixes,
writes audio/fullmix_raw.wav. Then the caller runs ffmpeg loudnorm.
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

def tape_stop_apply(buf, stop_t, dur=0.6, sr=SR):
    n = len(buf); i0 = int(stop_t * sr); i1 = min(n, int((stop_t + dur) * sr))
    if i0 >= n: return buf
    pos = float(i0); out = buf[:]
    for j in range(i0, i1):
        u = (j - i0) / max(1, (i1 - i0))
        pos += (1.0 - u) ** 1.5
        k = int(pos)
        if k >= n: break
        frac = pos - k
        v = buf[k] * (1 - frac) + (buf[k + 1] if k + 1 < n else buf[k]) * frac
        out[j] = v * (1.0 - 0.55 * u)
    for j in range(i1, n): out[j] = 0.0
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
    score_gain = 0.45
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
    stop_t = float(cues.get('scenes', {}).get('tape_stop', 29.4))
    vL = tape_stop_apply(vL[:n], stop_t); vR = tape_stop_apply(vR[:n], stop_t)
    L = [vL[i] * voice_gain + sL[i] * score_gain for i in range(n)]
    R = [vR[i] * voice_gain + sR[i] * score_gain for i in range(n)]
    pk = max(1e-9, max(max(abs(x) for x in L), max(abs(x) for x in R)))
    if pk > 0.98:
        g = 0.98 / pk
        L = [x * g for x in L]; R = [x * g for x in R]
    out = os.path.join(proj, 'audio', 'fullmix_raw.wav')
    write_wav(out, L, R)
    def rms(t, d=0.3, a=None):
        a = int(t * SR); b = min(n, a + int(d * SR))
        if a >= n: return -99.0
        s = sum(L[i] * L[i] for i in range(a, b)) / max(1, b - a)
        return 10 * math.log10(max(1e-12, s))
    print(f'wrote {out}  {n/SR:.3f}s  peak={pk:.3f}  score_gain={score_gain}')
    for t in [0.3, 2.0, 4.0, 7.7, 9.8, 13.0, 15.6, 18.0, 21.2, 24.0, 27.5, 29.5]:
        print(f'  mix RMS {t:5.1f}s: {rms(t):6.1f} dBFS')

if __name__ == '__main__':
    main()
