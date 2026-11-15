# -*- coding: utf-8 -*-
"""vo_segment.py · 现成配音 + 口播稿 → 段落边界与字级时间轴

只做这一件事：把「配音.wav」里第 N 个自然段切出来，并给出这一段每个字的时间、
以及按标点断开的每个短句的时间（字幕直接用这份时间，不按字数均分）。

做法：
1. ffmpeg 解成 16 kHz 单声道（faster-whisper 要的格式）
2. faster-whisper 带词级时间戳转写（只取时间，文字以口播稿为准）
3. 口播稿的每个字 ↔ 转写的每个字，做一次编辑距离对齐（DP）
   —— 配音漏读/多读的字自动跳过或均摊，不影响后续段落时间
4. 段落边界 = 该段第一个字的时间 ~ 下一个段第一个字前 0.08 s
5. 按标点切短句，短句继承字的起止时间

用法：
    python vo_segment.py --wav 配音.wav --text 口播稿.txt --paragraph 1 --out ../projects/<名字>
    python vo_segment.py --wav 配音.wav --text 口播稿.txt --list        # 只看段落表
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import re
import subprocess
import sys
import tempfile

PUNCT = set("，。、；：？！…—·「」『』（）()《》〈〉【】\"'“”‘’,.!?;:-~～ \t\r\n")
SENT_END = set("。！？…")          # 段落/句子结束
CLAUSE_END = set("，。、；：？！…")  # 字幕断句点

MODEL_HINTS = [
    ("models--mobiuslabsgmbh--faster-whisper-large-v3-turbo", "large-v3-turbo"),
    ("models--Systran--faster-whisper-large-v3", "large-v3"),
    ("models--Systran--faster-whisper-medium", "medium"),
    ("models--Systran--faster-whisper-small", "small"),
]


# ---------------------------------------------------------------- 基础工具

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    if r.returncode != 0:
        raise RuntimeError(f"命令失败: {' '.join(map(str, cmd))}\n{r.stderr[-800:]}")
    return r.stdout


def ffprobe_duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", path])
    return float(out.strip())


def refine_boundary(wav, last_end, next_start, total, fallback):
    """在「本段最后一个字」与「下一段第一个字」之间找真实静音，切在静音中点。

    whisper 的词边界会吃进下一个词的起音（实测提前 0.2 s），直接按词边界切会削掉末字尾音。
    """
    import array
    import math

    win = 0.02
    lo, hi = max(0.0, last_end - 0.10), min(total, max(next_start + 0.40, last_end + 0.30))
    if hi <= lo:
        return fallback
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{lo:.3f}", "-to", f"{hi:.3f}",
                        "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                       capture_output=True)
    if r.returncode != 0 or not r.stdout:
        return fallback
    a = array.array("h", r.stdout)
    sr = 16000
    step = int(win * sr)
    frames = [a[i:i + step] for i in range(0, len(a) - step + 1, step)]
    if not frames:
        return fallback
    rms = [math.sqrt(sum(x * x for x in f) / len(f)) for f in frames]
    peak = max(rms) or 1.0
    thr = max(90.0, 0.028 * peak)

    # 连续低于阈值的帧 → 静音段
    gaps, run_start = [], None
    for i, v in enumerate(rms):
        if v < thr:
            if run_start is None:
                run_start = i
        else:
            if run_start is not None:
                gaps.append((run_start, i))
                run_start = None
    if run_start is not None:
        gaps.append((run_start, len(rms)))

    valid = [(s, e) for s, e in gaps if (e - s) * win >= 0.06]
    if not valid:
        return fallback
    # 选离「预计切点」最近的静音中点
    best = min(valid, key=lambda g: abs(lo + (g[0] + g[1]) / 2 * win - fallback))
    center = lo + (best[0] + best[1]) / 2 * win
    return max(last_end + 0.04, min(center, next_start + 0.25))


def load_paragraphs(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(paras) <= 1:
        paras = [ln.strip() for ln in text.split("\n") if ln.strip()]
    return paras


def find_model(explicit=None):
    """优先级：本地目录 → 环境变量 → HF 缓存里同名的快照 → 模型名（可能联网下载）。"""
    if explicit and os.path.isdir(explicit):
        return explicit
    want = explicit or os.environ.get("SHIPAI_WHISPER_MODEL")
    roots = []
    if os.environ.get("HF_HOME"):
        roots.append(os.path.join(os.environ["HF_HOME"], "hub"))
    roots += [
        os.path.expanduser("~/.cache/huggingface/hub"),
        r"D:\cache_backup\huggingface\hub",
    ]
    for root in roots:
        if not root or not os.path.isdir(root):
            continue
        for repo, name in MODEL_HINTS:
            if want and name != want:
                continue
            snaps = sorted(glob.glob(os.path.join(root, repo, "snapshots", "*")))
            if snaps:
                return snaps[-1]
    return want or "large-v3"


# ---------------------------------------------------------------- 转写

def transcribe(wav16k, model_path, device, compute_type, language):
    from faster_whisper import WhisperModel

    model = WhisperModel(model_path, device=device, compute_type=compute_type)
    segments, info = model.transcribe(
        wav16k, language=language, beam_size=5, vad_filter=False,
        word_timestamps=True, condition_on_previous_text=False,
    )
    words = []
    for seg in segments:
        for w in (seg.words or []):
            words.append((w.word, float(w.start), float(w.end)))
    return words, getattr(info, "duration", None)


def expand_chars(words):
    """转写的每个词摊成单字时间（中文一个词可能含多字，字时间按均分）。"""
    out = []
    for text, start, end in words:
        chars = [c for c in text if c not in PUNCT]
        if not chars:
            continue
        n = len(chars)
        span = max(end - start, 0.001)
        for k, c in enumerate(chars):
            out.append((c, start + span * k / n, start + span * (k + 1) / n))
    return out


# ---------------------------------------------------------------- 对齐

def align(script_chars, token_chars):
    """编辑距离对齐：返回每个稿字的 token 下标（-1 表示没对上）。"""
    n, m = len(script_chars), len(token_chars)
    if n == 0 or m == 0:
        return [-1] * n
    gap = 1.0
    sub = 1.2
    INF = float("inf")
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i * gap
    for j in range(m + 1):
        dp[0][j] = j * gap
    sc = script_chars
    tc = [t[0] for t in token_chars]
    for i in range(1, n + 1):
        si = sc[i - 1]
        row, prev = dp[i], dp[i - 1]
        for j in range(1, m + 1):
            diag = prev[j - 1] + (0.0 if si == tc[j - 1] else sub)
            up = prev[j] + gap        # 稿里有、音里没有（漏读）
            left = row[j - 1] + gap   # 音里有、稿里没有（多读/口误）
            row[j] = diag if diag <= up and diag <= left else (up if up <= left else left)

    mapping = [-1] * n
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            cost = 0.0 if sc[i - 1] == tc[j - 1] else sub
            if dp[i][j] == dp[i - 1][j - 1] + cost:
                mapping[i - 1] = j - 1
                i, j = i - 1, j - 1
                continue
        if i > 0 and dp[i][j] == dp[i - 1][j] + gap:
            i -= 1
            continue
        j -= 1
    return mapping


def assign_times(script_chars, token_chars, mapping):
    times = [None] * len(script_chars)
    for i, t in enumerate(mapping):
        if t >= 0:
            times[i] = (token_chars[t][1], token_chars[t][2])
    # 对不上（漏读）的字：在前一个和后一个已知时间之间均摊
    known = [i for i, t in enumerate(times) if t]
    if not known:
        return [(0.0, 0.0)] * len(times)
    for i in range(known[0]):
        times[i] = times[known[0]]
    for i in range(known[-1] + 1, len(times)):
        times[i] = times[known[-1]]
    for a, b in zip(known, known[1:]):
        if b - a == 1:
            continue
        t0, t1 = times[a][1], times[b][0]
        steps = b - a
        for k in range(1, steps):
            x = t0 + (t1 - t0) * k / steps
            times[a + k] = (x, x)
    return times


# ---------------------------------------------------------------- 主流程

def build(wav, text_path, paragraph, out_dir, args):
    paragraphs = load_paragraphs(open(text_path, encoding="utf-8").read())
    if paragraph == "list":
        for i, p in enumerate(paragraphs, 1):
            print(f"{i:02d}  {p[:60]}")
        return
    idx = int(paragraph) - 1
    if not 0 <= idx < len(paragraphs):
        raise SystemExit(f"段落号越界：共 {len(paragraphs)} 段")

    duration = ffprobe_duration(wav)
    tmpdir = tempfile.mkdtemp(prefix="shipai_vo_")
    wav16k = os.path.join(tmpdir, "16k.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", wav16k])

    model_path = find_model(args.model)
    print(f"[vo] 模型 {model_path}")
    words, audio_dur = transcribe(wav16k, model_path, args.device, args.compute_type, args.language)
    print(f"[vo] 转写 {len(words)} 个词 / 音频 {audio_dur or duration:.2f}s")

    # 稿子 → 可对齐字序列（保留原下标，标点不参与对齐但保留位置）
    script = [(pos, c) for pos, c in enumerate(
        "".join(paragraphs)) if c not in PUNCT]
    token_chars = expand_chars(words)
    mapping = align([c for _, c in script], token_chars)
    times = assign_times([c for _, c in script], token_chars, mapping)
    ok = sum(1 for i in mapping if i >= 0)
    print(f"[vo] 对齐命中 {ok}/{len(script)} 字")

    # 段落边界（段落文字在合并串里的偏移）
    offsets, cursor = [], 0
    for p in paragraphs:
        offsets.append(cursor)
        cursor += len(p)
    sent_times = {pos: t for (pos, _c), t in zip(script, times)}

    def char_time(pos):
        return sent_times.get(pos)

    para_bounds = []
    for i, (off, p) in enumerate(zip(offsets, paragraphs)):
        positions = [off + k for k, c in enumerate(p) if c not in PUNCT and char_time(off + k)]
        if not positions:
            raise SystemExit(f"第 {i + 1} 段没有对齐到时间")
        para_bounds.append((positions[0], positions[-1]))

    def t_start(i):
        return char_time(para_bounds[i][0])[0]

    def t_end(i):
        return char_time(para_bounds[i][1])[1]

    starts = [t_start(i) for i in range(len(paragraphs))]
    ends = [t_end(i) for i in range(len(paragraphs))]

    # 目标段：结尾优先切在「本段末字」与「下段首字」之间的真实静音中点
    cut_start = max(0.0, starts[idx] - args.lead)
    expected_end = ends[idx] + args.tail
    if idx + 1 < len(paragraphs):
        expected_end = min(expected_end, starts[idx + 1] - 0.08)
        cut_end = refine_boundary(wav, ends[idx], starts[idx + 1], duration, expected_end)
    else:
        cut_end = expected_end
    cut_end = min(cut_end, duration)
    if cut_end <= cut_start:
        raise SystemExit("算出来切点为空，检查段落号/配音")

    os.makedirs(os.path.join(out_dir, "audio"), exist_ok=True)
    seg = os.path.join(out_dir, "audio", f"seg-{paragraph:0>2}.wav")
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{cut_start:.3f}", "-to", f"{cut_end:.3f}",
         "-i", wav, "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", seg])

    # 短句（字幕单元）：段内按标点切，时间继承字时间，起点/终点对齐到切点
    para_text = paragraphs[idx]
    off = offsets[idx]
    clauses, cur_start, cur_end = [], None, None

    def flush():
        nonlocal cur_start, cur_end
        if cur_start is not None:
            clauses.append((cur_start, cur_end,
                            para_text[cur_start - off:cur_end - off + 1]))
        cur_start = cur_end = None

    for k, c in enumerate(para_text):
        gp = off + k
        if c in CLAUSE_END:
            flush()
        elif c.strip():
            if cur_start is None:
                cur_start = gp
            cur_end = gp
    flush()

    clause_items = []
    for a, b, txt in clauses:
        first = next((p for p in range(a, b + 1) if char_time(p)), None)
        last = next((p for p in range(b, a - 1, -1) if char_time(p)), None)
        if first is None:
            continue
        item = {"text": txt,
                "start": round(char_time(first)[0], 3),
                "end": round(char_time(last)[1], 3)}
        # 稿里有、配音没念的句子会算出零长度，直接丢掉（字幕只跟实际发音走）
        if item["end"] - item["start"] < 0.05:
            print(f"[vo] 跳过未发音的句子：{txt}")
            continue
        clause_items.append(item)
    # 首尾相接（字幕不闪、不空档）
    for i in range(len(clause_items) - 1):
        clause_items[i]["end"] = round(clause_items[i + 1]["start"], 3)
    if clause_items:
        clause_items[0]["start"] = round(cut_start, 3)
        clause_items[-1]["end"] = round(cut_end, 3)

    timeline = {
        "wav": os.path.basename(wav),
        "duration": round(duration, 3),
        "model": os.path.basename(str(model_path)),
        "paragraph": idx + 1,
        "segment": {
            "path": os.path.relpath(seg, out_dir).replace("\\", "/"),
            "start": round(cut_start, 3),
            "end": round(cut_end, 3),
            "seconds": round(cut_end - cut_start, 3),
        },
        "text": para_text,
        "clauses": clause_items,
        "paragraphs": [
            {"index": i + 1, "start": round(starts[i], 3), "end": round(ends[i], 3),
             "text": paragraphs[i]}
            for i in range(len(paragraphs))
        ],
    }
    tl_path = os.path.join(out_dir, "timeline.json")
    with open(tl_path, "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=2)

    print(f"[vo] 第 {idx + 1} 段 {cut_start:.2f}–{cut_end:.2f}s（{cut_end - cut_start:.2f}s）")
    print(f"[vo] 音频 → {seg}")
    print(f"[vo] 字幕 {len(clause_items)} 条 → {tl_path}")
    for c in clause_items:
        print(f"     {c['start']:6.2f}-{c['end']:6.2f}  {c['text']}")
    return timeline


def main():
    ap = argparse.ArgumentParser(description="配音 → 段落边界 + 字级时间轴")
    ap.add_argument("--wav", required=True)
    ap.add_argument("--text", required=True)
    ap.add_argument("--paragraph", default="1", help="第几段（1 起），或 list")
    ap.add_argument("--out", default=".", help="工程目录（写 audio/ 与 timeline.json）")
    ap.add_argument("--model", default=None, help="faster-whisper 模型目录或名称")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--compute-type", default="int8")
    ap.add_argument("--language", default="zh")
    ap.add_argument("--lead", type=float, default=0.05, help="段首前留白(秒)")
    ap.add_argument("--tail", type=float, default=0.30, help="段尾后留白(秒)")
    args = ap.parse_args()

    if args.paragraph == "list":
        paragraphs = load_paragraphs(open(args.text, encoding="utf-8").read())
        for i, p in enumerate(paragraphs, 1):
            print(f"{i:02d}  {p[:60]}")
        return
    build(args.wav, args.text, args.paragraph, args.out, args)


if __name__ == "__main__":
    sys.exit(main())
