# daihuo · 句级时间轴：从整段配音里按静音切出每句起止
# 用法：python split_lines.py --wav=<narration.wav> --text=<script.txt> --out=<lines.json>
# 文本按行读，一行一句（P0 用；P2 接 copy_engine 的 lines 结构）。
import argparse
import json
import math
import wave

import numpy as np


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        ch = w.getnchannels()
        width = w.getsampwidth()
        raw = w.readframes(n)
    if width == 2:
        data = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    elif width == 4:
        data = np.frombuffer(raw, dtype="<i4").astype(np.float32) / 2147483648.0
    elif width == 1:
        data = (np.frombuffer(raw, dtype="<u1").astype(np.float32) - 128) / 128.0
    else:
        raise SystemExit(f"unsupported sample width {width}")
    if ch > 1:
        data = data.reshape(-1, ch).mean(axis=1)
    return sr, data


def envelope(data, sr, hop_ms=20):
    hop = max(1, int(sr * hop_ms / 1000))
    usable = len(data) // hop * hop
    frames = data[:usable].reshape(-1, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    return rms, hop / sr


def speech_span(rms, dt, thresh):
    idx = np.where(rms > thresh)[0]
    if len(idx) == 0:
        return 0.0, len(rms) * dt
    return idx[0] * dt, (idx[-1] + 1) * dt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wav", required=True)
    ap.add_argument("--text", required=True, help="UTF-8 文本，一行一句")
    ap.add_argument("--out", required=True)
    ap.add_argument("--min-sil-ms", type=int, default=70)
    ap.add_argument("--pad-ms", type=int, default=40)
    args = ap.parse_args()

    lines = [l.strip() for l in open(args.text, encoding="utf-8").read().splitlines() if l.strip()]
    sr, data = read_wav(args.wav)
    total = len(data) / sr

    rms, dt = envelope(data, sr)
    db = 20 * np.log10(rms + 1e-9)
    floor = np.percentile(db, 20)
    thresh_db = max(-40.0, floor + 10.0)
    thresh = 10 ** (thresh_db / 20)

    # 静音区段
    sil = rms <= thresh
    runs = []
    i = 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]:
                j += 1
            if (j - i) * dt * 1000 >= args.min_sil_ms:
                runs.append((i * dt, j * dt))
            i = j
        else:
            i += 1

    need = len(lines) - 1
    if need <= 0:
        spans = [(0.0, total)]
    else:
        # 按字数比例算出每个句边界的期望位置，再取最近的静音中心
        clean = [sum(1 for ch in l if ch not in "，。！？、,.!? ") for l in lines]
        cum = np.cumsum(clean).astype(float)
        expected = [total * c / cum[-1] for c in cum[:-1]]

        internal = [(a, b) for (a, b) in runs if a > 0.12 and b < total - 0.12]
        centers = [(a + b) / 2 for (a, b) in internal]
        chosen = []
        last = -1e9
        for e in expected:
            cands = [c for c in centers if c > last + 0.25 and c not in chosen]
            if not cands:
                raise SystemExit("句边界静音不足，改用逐句合成")
            pick = min(cands, key=lambda c: abs(c - e))
            chosen.append(pick)
            last = pick

        bounds = [0.0] + sorted(chosen) + [total]
        spans = []
        for (a, b) in zip(bounds[:-1], bounds[1:]):
            i0, i1 = int(a / dt), int(b / dt)
            sa, eb = speech_span(rms[i0:i1], dt, thresh)
            spans.append((max(0.0, a + sa - args.pad_ms / 1000), min(b, a + eb + args.pad_ms / 1000)))

    out = {
        "wav": args.wav,
        "duration": round(total, 3),
        "threshold_db": round(float(thresh_db), 1),
        "lines": [
            {"text": t, "start": round(max(0.0, a), 3), "end": round(min(total, b), 3)}
            for t, (a, b) in zip(lines, spans)
        ],
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
