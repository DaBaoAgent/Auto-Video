#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xianshiqi · 从配音里测语音块边界（纯标准库，不需要 ASR）。

有 配音审查.json（asr.records）时优先用 ASR 时码；没有时用本脚本测能量。
输出语音块与静音窗，供人工定 cues.json 的 captions / scenes。

  python xianshiqi/scripts/analyze_voice.py --src 出稿/UAP/配音.wav --to 35
  python xianshiqi/scripts/analyze_voice.py --src ... --to 35 --json blocks.json

原理：20ms 帧 RMS，阈值 = 峰值 RMS − 28dB；短于 --min-sil 的静音合并，
短于 --min-voice 的声块丢弃（气口/咔哒）。
"""
import argparse, json, math, struct, sys, wave

for _s in (sys.stdout, sys.stderr):
    try: _s.reconfigure(encoding='utf-8')
    except Exception: pass


def read_mono(path, t0=0.0, t1=None):
    with wave.open(path, 'rb') as w:
        sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        if sw != 2:
            raise SystemExit(f'{path}: 只支持 16-bit PCM，实际 {sw*8}-bit')
        f0 = int(t0 * sr); f1 = n if t1 is None else min(n, int(t1 * sr))
        w.setpos(f0)
        raw = w.readframes(f1 - f0)
    vals = struct.unpack('<' + 'h' * (len(raw) // 2), raw)
    if ch == 1:
        return [v / 32768.0 for v in vals], sr
    out = [0.0] * (len(vals) // ch)
    for i in range(len(out)):
        s = 0
        for c in range(ch):
            s += vals[i * ch + c]
        out[i] = s / (32768.0 * ch)
    return out, sr


def blocks(sig, sr, frame_ms=20, rel_db=-28.0, min_sil=0.12, min_voice=0.10):
    fl = max(1, int(sr * frame_ms / 1000))
    nf = len(sig) // fl
    rms = []
    for i in range(nf):
        a = i * fl
        s = 0.0
        for v in sig[a:a + fl]:
            s += v * v
        rms.append(math.sqrt(s / fl))
    peak = max(rms) if rms else 0.0
    thr = peak * (10 ** (rel_db / 20.0))
    voiced = [r >= thr for r in rms]
    # 语音块
    raw = []
    i = 0
    while i < nf:
        if voiced[i]:
            j = i
            while j < nf and voiced[j]:
                j += 1
            raw.append([i * frame_ms / 1000.0, j * frame_ms / 1000.0])
            i = j
        else:
            i += 1
    # 合并短静音
    merged = []
    for b in raw:
        if merged and b[0] - merged[-1][1] < min_sil:
            merged[-1][1] = b[1]
        else:
            merged.append(b)
    # 去短声块
    voiced_blocks = [b for b in merged if b[1] - b[0] >= min_voice]
    # 静音窗
    sil = []
    prev = 0.0
    for b in voiced_blocks:
        if b[0] - prev > 0.02:
            sil.append([round(prev, 2), round(b[0], 2)])
        prev = b[1]
    if nf * frame_ms / 1000.0 - prev > 0.02:
        sil.append([round(prev, 2), round(nf * frame_ms / 1000.0, 2)])
    return [[round(a, 2), round(b, 2)] for a, b in voiced_blocks], sil


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--from', dest='start', type=float, default=0.0)
    ap.add_argument('--to', dest='end', type=float, default=35.0)
    ap.add_argument('--rel-db', type=float, default=-28.0)
    ap.add_argument('--min-sil', type=float, default=0.12)
    ap.add_argument('--min-voice', type=float, default=0.10)
    ap.add_argument('--json', default='')
    a = ap.parse_args()
    sig, sr = read_mono(a.src, a.start, a.end)
    voice, sil = blocks(sig, sr, rel_db=a.rel_db, min_sil=a.min_sil, min_voice=a.min_voice)
    off = a.start
    voice = [[round(x + off, 2), round(y + off, 2)] for x, y in voice]
    sil = [[round(x + off, 2), round(y + off, 2)] for x, y in sil]
    print(f'sr={sr}  span={a.start:.2f}-{a.end:.2f}s  blocks={len(voice)}  silences={len(sil)}')
    print('voice blocks:')
    for x, y in voice:
        print(f'  {x:6.2f} - {y:6.2f}   ({y - x:4.2f}s)')
    print('silence windows:')
    for x, y in sil:
        print(f'  {x:6.2f} - {y:6.2f}   ({y - x:4.2f}s)')
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as f:
            json.dump({'src': a.src, 'from': a.start, 'to': a.end, 'voice': voice, 'silence': sil},
                      f, ensure_ascii=False, indent=2)
        print('wrote', a.json)


if __name__ == '__main__':
    main()
