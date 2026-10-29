# -*- coding: utf-8 -*-
"""句级对齐：把「段落级配音」还原成「从句级时码」

003 的配音是按段落生成的（16 个块），没有句级时码，所以字幕只能猜 —— 这就是
"字幕慢半拍 / 对不上"的根因。刘秀那集之所以准，是因为它的 TTS 本身按从句生成。

本脚本不重新配音，改为从音频里**测**出从句边界：
  1 每个段落块单独测语音段（20ms 帧 RMS，阈值 = 峰值 -28dB，最短 60ms）
  2 段落文本按标点切成从句
  3 若「语音段数 == 从句数」→ 一一对应（这是最准的情况）
     否则 → 按字数比例落到段落内，再吸附到最近的语音段起点
  4 长从句按 14 字上限拆条，在该从句时长内按字数分配

产出：narration/narration.json（与刘秀同构：audio / duration / chunks[{text,start,end}]）
"""
from __future__ import annotations

import argparse
import json
import re
import wave
from pathlib import Path

import numpy as np

FPS = 30
MAX_CHARS = 14

# 用法：
#   python scripts/align_captions.py --src "出稿/<编号>_<选题>" --out projects/<slug>/work
# 输入：<src>/配音.json（段落级 chunks，含 text/start/duration/file）+ <src>/narration-chunks/
# 输出：<out>/narration/narration.json + <out>/data/captions.json


def read_mono(p: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(p), "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if sw != 2:
        raise SystemExit(f"{p} 非 16bit")
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    return x, sr


def voiced_segments(x: np.ndarray, sr: int) -> list[tuple[float, float]]:
    """返回 [(start, end)] 语音段"""
    hop = int(0.02 * sr)
    n = len(x) // hop
    if n < 2:
        return []
    frames = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    db = 20 * np.log10(rms + 1e-9)
    th = float(db.max()) - 28.0
    voiced = db > th
    segs: list[tuple[int, int]] = []
    i = 0
    while i < n:
        if voiced[i]:
            j = i
            while j < n and voiced[j]:
                j += 1
            if (j - i) * 0.02 >= 0.06:
                segs.append((i, j))
            i = j
        else:
            i += 1
    # 段间小于 60ms 的缝隙合并
    merged: list[list[int]] = []
    for a, b in segs:
        if merged and (a - merged[-1][1]) * 0.02 < 0.06:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(a * 0.02, b * 0.02) for a, b in merged]


def clauses_of(text: str) -> list[str]:
    parts = [p for p in re.split(r"[，。：；、？！]", text) if p.strip()]
    return parts


def main() -> None:
    ap = argparse.ArgumentParser(description="把段落级配音还原成从句级时码")
    ap.add_argument("--src", required=True, help="出稿目录（含 配音.json 与 narration-chunks/）")
    ap.add_argument("--out", default=".", help="工程目录，默认当前目录")
    ap.add_argument("--max-chars", type=int, default=14, help="单条字幕字数上限")
    args = ap.parse_args()
    SRC = Path(args.src)
    ROOT = Path(args.out)
    max_chars = args.max_chars

    meta = json.loads((SRC / "配音.json").read_text(encoding="utf-8-sig"))
    out_chunks = []
    idx = 0
    for ch in meta["chunks"]:
        wav = SRC / "narration-chunks" / Path(ch["file"]).name
        x, sr = read_mono(wav)
        segs = voiced_segments(x, sr)
        cl = clauses_of(ch["text"])
        t0 = float(ch["start"])
        span = float(ch["duration"])

        if segs and len(segs) == len(cl):
            bounds = [(t0 + a, t0 + b) for a, b in segs]
        elif segs:
            # 数量不等：按字数比例落到段落内，再吸附到最近语音段起点
            total = sum(len(c) for c in cl) or 1
            starts = [t0 + a for a, _ in segs]
            bounds = []
            acc = 0
            for i, c in enumerate(cl):
                t = t0 + span * acc / total
                snapped = min(starts, key=lambda s: abs(s - t))
                bounds.append((snapped, snapped))
                acc += len(c)
            # 每条止点 = 下一条起点，末条到段落尾
            bounds = [(bounds[i][0], bounds[i + 1][0] if i + 1 < len(bounds) else t0 + span)
                      for i in range(len(bounds))]
        else:
            total = sum(len(c) for c in cl) or 1
            bounds, acc = [], 0
            for c in cl:
                bounds.append((t0 + span * acc / total, t0 + span * (acc + len(c)) / total))
                acc += len(c)

        for c, (a, b) in zip(cl, bounds):
            idx += 1
            out_chunks.append({"index": idx, "text": c, "start": round(a, 3), "end": round(b, 3)})

    # 长从句拆条：≤14 字，时间按字数在该从句内分配
    caps = []
    for c in out_chunks:
        text, a, b = c["text"], c["start"], c["end"]
        if len(text) <= max_chars:
            caps.append({"text": text, "t0": a, "t1": b})
            continue
        # 在虚词处断，尽量均分
        pieces, rest = [], text
        while len(rest) > max_chars:
            cut = -1
            for i in range(max_chars, 5, -1):
                if rest[i - 1] in "的了是在和与就都也":
                    cut = i
                    break
            if cut < 0:
                cut = max_chars
            pieces.append(rest[:cut])
            rest = rest[cut:]
        if rest:
            pieces.append(rest)
        tot = sum(len(p) for p in pieces) or 1
        t, acc = a, 0
        for p in pieces:
            d = (b - a) * len(p) / tot
            caps.append({"text": p, "t0": t, "t1": t + d})
            t += d
            acc += len(p)

    # 写 narration.json（刘秀同构）
    nj = {
        "audio": "narration.wav",
        "duration": round(float(meta["duration"]), 3),
        "chunks": out_chunks,
    }
    (ROOT / "narration").mkdir(parents=True, exist_ok=True)
    (ROOT / "narration" / "narration.json").write_text(
        json.dumps(nj, ensure_ascii=False, indent=2), encoding="utf-8")

    # 写 captions 片段（对齐产出的字幕条，供 build_shots 合并）
    payload = [{"text": c["text"], "t0": round(c["t0"], 3), "t1": round(c["t1"], 3)} for c in caps]
    (ROOT / "data" / "captions.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"从句 {len(out_chunks)} 条 → 字幕 {len(caps)} 条（上限 {max_chars} 字）")
    for c in caps[:12]:
        print(f'  {c["t0"]:6.2f}-{c["t1"]:6.2f}  {c["text"]}')


if __name__ == "__main__":
    main()
