# -*- coding: utf-8 -*-
"""整段重配后的重新对齐：把一条连续的人声音频对齐到已知的从句文本序列。

场景：配音读错了几个字，重新整段录了一条 wav。文本没变，但
  · 没有段落级 chunks（配音.json）
  · 总时长变了（新旧差零点几秒到几秒）
  · 语音段数 ≠ 从句数（同一句里可能有换气停顿）
所以不能按字数比例外推，也不能一一对应——用 DP 把「语音段」分组成「从句」。

代价函数：|实际时长 × 全局语速 − 该句字数|²
  全局语速取「语音总时长 / 总字数」，用中位数稳健估计。

用法：
  python scripts/realign_voice.py \
      --voice "出稿/<编号>_<选题>/配音-新.wav" \
      --narration projects/<slug>/work/narration/narration.json \
      --out projects/<slug>/work

产出（覆盖 <out> 下）：
  narration/narration.json   从句级时码（填写填满，句尾接到下一句开头）
  narration/narration.wav    48k 单声道副本（供音轨与 Remotion 用）
  data/captions.json         字幕条（≤14 字拆条）
"""
from __future__ import annotations

import argparse
import json
import wave
from pathlib import Path

import numpy as np

MAX_CHARS = 14


def read_mono(p: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(p), "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if sw != 2:
        raise SystemExit(f"{p} 不是 16bit PCM")
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    return x, sr


def voiced_segments(x: np.ndarray, sr: int, thr_db: float = 28.0,
                    min_len: float = 0.06, merge_gap: float = 0.06) -> list[tuple[float, float]]:
    hop = int(0.02 * sr)
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    v = db > (db.max() - thr_db)
    segs: list[list[int]] = []
    i = 0
    while i < n:
        if v[i]:
            j = i
            while j < n and v[j]:
                j += 1
            if (j - i) * 0.02 >= min_len:
                if segs and (i - segs[-1][1]) * 0.02 < merge_gap:
                    segs[-1][1] = j
                else:
                    segs.append([i, j])
            i = j
        else:
            i += 1
    return [(a * 0.02, b * 0.02) for a, b in segs]


def aligned_bounds(x: np.ndarray, sr: int, chars: list[int],
                   thr_db: float = 28.0, inner_penalty: float = 0.10) -> list[tuple[float, float]]:
    """从句边界对齐：边界优先落在换气间隙（语音段之间），不够时才在段内切。

    为什么不能用「按语音时长比例分配」：比例分配只在句一级均匀，
    句内边界必然落在某个字中间。实测 233 个切换点里 105 个切在语音里，
    观众看到的就是「话说一半字幕跳了」。

    做法（简化强制对齐）：
      候选边界 = 每个段间中点（代价 0）+ 长段内部的能量低谷（代价按能量加权）
      DP 选 110 个边界，最小化 Σ(实际时长 − 按字数预测时长)² + 段内切分惩罚
    """
    hop = int(0.02 * sr)
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9)
    voiced = db > (db.max() - thr_db)
    segs: list[list[int]] = []
    i = 0
    while i < n:
        if voiced[i]:
            j = i
            while j < n and voiced[j]:
                j += 1
            segs.append([i, j])
            i = j
        else:
            i += 1
    # 合并极短间隙（<60ms 的换气不算句子边界）
    merged: list[list[int]] = []
    for a, b in segs:
        if merged and (a - merged[-1][1]) * 0.02 < 0.06:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    segs = merged

    # 候选边界：(时间, 惩罚)
    cands: list[tuple[float, float]] = []
    for k in range(len(segs) - 1):
        cands.append(((segs[k][1] + segs[k + 1][0]) / 2 * 0.02, 0.0))
    # 段内候选：不取固定的 1/3、2/3，而是取该段能量的局部低谷
    # （闭口音、字间过渡处），切在那里观众察觉不到「话说一半跳了」
    for a, b in segs:
        if (b - a) * 0.02 > 0.4:
            inner = db[a + 2:b - 2]
            if len(inner) > 6:
                low = np.argsort(inner)[:28]
                picked: list[float] = []
                for k in sorted(low):
                    t = (a + 2 + int(k)) * 0.02
                    if all(abs(t - c) > 0.10 for c in picked):
                        picked.append(t)
                # 惩罚按该点的能量加权：接近静音的切点几乎免费，
                # 切在语音中部则很贵（观众会看到「话说一半跳了」）
                span = float(db.max() - (db.max() - thr_db))
                for k in low:
                    t = (a + 2 + int(k)) * 0.02
                    if t not in picked:
                        continue
                    rel = max(0.0, (float(db[a + 2 + int(k)]) - (db.max() - thr_db)) / max(span, 1e-6))
                    cands.append((t, inner_penalty * (0.15 + 3.0 * rel)))
    cands.append((segs[-1][1] * 0.02, 0.0))
    cands.sort()

    start_t = segs[0][0] * 0.02
    nc, nj = len(cands), len(chars)
    if nc < nj:
        raise SystemExit(f"候选边界 {nc} 少于从句数 {nj}，语音段太少，检查 --thr")

    # 语速：字/秒（用总语音时长，不含停顿）
    speech = sum((b - a) for a, b in segs) * 0.02
    rate = sum(chars) / speech

    INF = float("inf")
    # dp[j][i]：前 j 句结束于候选 i
    dp = [[INF] * nc for _ in range(nj + 1)]
    back = [[-1] * nc for _ in range(nj + 1)]
    dp[0][0] = 0.0
    MIN_DUR = 0.28
    for j in range(1, nj + 1):
        pred = chars[j - 1] / rate
        for i in range(j, nc):
            ti, pen = cands[i]
            best, bi = INF, -1
            k = i - 1
            while k >= j - 1 and k >= i - 60:
                if dp[j - 1][k] != INF:
                    dur = ti - cands[k][0]
                    if dur >= MIN_DUR:
                        c = dp[j - 1][k] + (dur - pred) ** 2 + pen
                        if c < best:
                            best, bi = c, k
                k -= 1
            dp[j][i] = best
            back[j][i] = bi

    # 末句必须结束在最后一个候选
    if dp[nj][nc - 1] == INF:
        raise SystemExit("DP 无解，检查 --thr 或 --inner-penalty")
    edges: list[float] = []
    i = nc - 1
    for j in range(nj, 0, -1):
        edges.append(cands[i][0])
        i = back[j][i]
    edges.append(start_t)
    edges = list(reversed(edges))

    out = []
    for j in range(nj):
        out.append((edges[j], edges[j + 1]))
    return out


def split_long(text: str, max_chars: int) -> list[str]:
    pieces, rest = [], text
    while len(rest) > max_chars:
        cut = -1
        for k in range(max_chars, 5, -1):
            if rest[k - 1] in "的了是在和与就都也里上中后前时着过":
                cut = k
                break
        if cut < 0:
            cut = max_chars
        pieces.append(rest[:cut])
        rest = rest[cut:]
    if rest:
        pieces.append(rest)
    return pieces


def main() -> None:
    ap = argparse.ArgumentParser(description="整段重配后重新对齐到已知从句文本")
    ap.add_argument("--voice", required=True, help="新的整条人声 wav")
    ap.add_argument("--narration", required=True, help="旧 narration.json（提供从句文本序列）")
    ap.add_argument("--out", required=True, help="工程目录")
    ap.add_argument("--thr", type=float, default=28.0, help="静音阈值（峰值 -N dB）")
    ap.add_argument("--inner-penalty", type=float, default=0.10,
                    help="在语音段内部切分的惩罚（秒²），越大越倾向在换气处切")
    ap.add_argument("--max-chars", type=int, default=MAX_CHARS, help="字幕单条字数上限")
    args = ap.parse_args()

    x, sr = read_mono(Path(args.voice))
    dur = len(x) / sr
    segs = voiced_segments(x, sr, args.thr)
    old = json.loads(Path(args.narration).read_text(encoding="utf-8"))
    texts = [c["text"] for c in old["chunks"]]
    chars = [len(t) for t in texts]
    print(f"音频 {dur:.2f}s / 语音段 {len(segs)} / 从句 {len(texts)} / 总字 {sum(chars)}")

    raw = aligned_bounds(x, sr, chars, args.thr, args.inner_penalty)

    # 填满：每句止于下一句起点，最后一句到音频末尾（字幕不留空档）
    filled = []
    for i, (a, _b) in enumerate(raw):
        e = raw[i + 1][0] if i + 1 < len(raw) else dur
        filled.append((a, max(e, a + 0.05)))

    # 语速核对：任一句偏差超过 45% 就警告（说明 DP 分错了）
    bad = []
    for i, (a, b) in enumerate(filled):
        r = chars[i] / max(b - a, 1e-6)
        med = sum(chars) / sum(b - a for a, b in filled)
        if abs(r - med) / med > 0.45:
            bad.append((i + 1, texts[i], round(b - a, 2), chars[i]))
    print(f"语速均值 {sum(chars)/sum(b-a for a,b in filled):.2f} 字/秒；异常句 {len(bad)} 条")
    for b in bad[:10]:
        print(f"   ⚠ 第{b[0]}句 {b[2]}s / {b[3]}字  {b[1]}")

    chunks = []
    for i, (t, (a, b)) in enumerate(zip(texts, filled), 1):
        chunks.append({"index": i, "text": t, "start": round(a, 3), "end": round(b, 3)})
        if i > 1 and a < chunks[-2]["start"]:
            raise SystemExit(f"第 {i} 句起点早于上一句，对齐有问题")

    out = Path(args.out)
    (out / "narration").mkdir(parents=True, exist_ok=True)
    (out / "data").mkdir(parents=True, exist_ok=True)
    # 人声副本：44.1k 单声道，音轨与 Remotion 都从这里读
    target = 44100
    if sr != target:
        n_out = int(round(len(x) * target / sr))
        x = np.interp(np.linspace(0, len(x) - 1, n_out),
                      np.arange(len(x)), x).astype(np.float32)
    with wave.open(str(out / "narration" / "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(target)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())

    (out / "narration" / "narration.json").write_text(
        json.dumps({"audio": "narration.wav", "duration": round(dur, 3), "chunks": chunks},
                   ensure_ascii=False, indent=2), encoding="utf-8")

    # 长句拆条：在同一句的时长内按字数分配
    caps = []
    for c in chunks:
        pieces = split_long(c["text"], args.max_chars)
        tot = sum(len(p) for p in pieces)
        t = c["start"]
        for p in pieces:
            d = (c["end"] - c["start"]) * len(p) / tot
            caps.append({"text": p, "t0": round(t, 3), "t1": round(t + d, 3)})
            t += d
    (out / "data" / "captions.json").write_text(
        json.dumps(caps, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"写出 narration.json（{len(chunks)} 从句 / {dur:.2f}s）与 captions.json（{len(caps)} 条）")
    for c in chunks[:6]:
        print(f"  {c['start']:6.2f}-{c['end']:6.2f}  {c['text']}")


if __name__ == "__main__":
    main()
