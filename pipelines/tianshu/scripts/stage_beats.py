# -*- coding: utf-8 -*-
"""tianshu · 配音 → 逐句时码

没有 ASR 也能定字幕：用 20ms RMS 包找到语音块与静音窗，把口播稿按字数比例
铺在语音跨度上，再把每个句子的接缝吸附到最近的「真静音」上。
这是 dengju / laolang 一路用的办法，tianshu 沿用同一套，省一次 ASR 调用。

产出 work/narration_beats.json：
  {total, speech_spans, sentences:[{idx, para, start, end, dur, chars, text}]}
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

import tcfg

HOP = 0.02          # 帧移 20ms
MERGE_GAP = 0.06    # 小于 60ms 的缝不算断句
MIN_SEG = 0.05      # 小于 50ms 的碎块丢掉


def decode_mono(wav: Path, dst: Path) -> Path:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav),
                    "-ac", "1", "-ar", "16000", "-sample_fmt", "s16", str(dst)], check=True)
    return dst


def envelope(wav16: Path) -> tuple[np.ndarray, float]:
    with wave.open(str(wav16)) as w:
        sr = w.getframerate()
        n = w.getnframes()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    step = max(1, int(round(sr * HOP)))
    frames = len(a) // step
    a = a[: frames * step].reshape(frames, step)
    env = np.sqrt((a ** 2).mean(axis=1))
    return env, HOP


def speech_spans(env: np.ndarray) -> list[tuple[float, float]]:
    # 自适应阈值：峰值的一半偏保守，再与 95 分位挂钩，避免整条片被当成静音
    thr = max(0.35 * float(np.percentile(env, 95)), 0.004)
    mask = env > thr
    runs, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            if (j - i) * HOP >= MIN_SEG:
                runs.append([i * HOP, j * HOP])
            i = j
        else:
            i += 1
    merged: list[list[float]] = []
    for s, e in runs:
        if merged and s - merged[-1][1] < MERGE_GAP:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    return [(s, e) for s, e in merged]


def sentences_of(txt: Path) -> list[tuple[int, str]]:
    paras = [p.strip() for p in txt.read_text(encoding="utf-8").splitlines() if p.strip()]
    out: list[tuple[int, str]] = []
    for pi, para in enumerate(paras):
        for s in re.findall(r"[^。！？]+[。！？]?", para):
            s = s.strip()
            if s:
                out.append((pi + 1, s))
    return out


def build(bounds: list[float], total: float, sents: list[tuple[int, str]]) -> list[dict]:
    rows = []
    chars = [len(re.findall(r"[\u4e00-\u9fff]", t)) or len(t) for _, t in sents]
    for i, (pi, s) in enumerate(sents):
        a = 0.0 if i == 0 else bounds[i - 1]
        b = total if i == len(sents) - 1 else bounds[i]
        rows.append({"idx": i, "para": pi, "start": round(a, 2), "end": round(b, 2),
                     "dur": round(b - a, 2), "chars": chars[i], "text": s})
    return rows


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py beats")
    ap.add_argument("name")
    ap.add_argument("--wav", default="")
    ap.add_argument("--txt", default="")
    ap.add_argument("--to", type=float, default=None, help="只用到第 N 秒（做样片时用）")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    wav = Path(a.wav) if a.wav else pd / "source" / "配音.wav"
    txt = Path(a.txt) if a.txt else pd / "source" / "口播稿_定稿.txt"
    for p, label in ((wav, "配音.wav"), (txt, "口播稿_定稿.txt")):
        if not p.exists():
            print(f"缺 {label}：{p}")
            return 1

    with tempfile.TemporaryDirectory() as td:
        w16 = decode_mono(wav, Path(td) / "m.wav")
        env, hop = envelope(w16)
    if a.to:
        env = env[: int(a.to / hop)]

    spans = speech_spans(env)
    if not spans:
        print("没测到语音块，检查配音是否为空")
        return 1
    t0, t1 = spans[0][0], spans[-1][1]
    if a.to:
        t1 = min(t1, a.to)
    total = round(t1 - t0, 2)

    gaps = [((spans[i][0] + spans[i + 1][1]) / 2, spans[i + 1][0] - spans[i][1])
            for i in range(len(spans) - 1)]
    print(f"语音块 {len(spans)}  跨度 {t0:.2f}–{t1:.2f}  {total:.2f}s  "
          f"静音窗≥0.12s {sum(1 for _, g in gaps if g >= 0.12)}")

    sents = sentences_of(txt)
    chars = [len(re.findall(r"[\u4e00-\u9fff]", t)) or len(t) for _, t in sents]
    tot = sum(chars)
    print(f"段落 {len({p for p, _ in sents})}  句子 {len(sents)}  汉字 {tot}")

    # 字数比例铺时间轴，再把每个接缝吸附到最近的真空隙
    cum, bounds, prev = np.cumsum(chars), [], t0
    for k in range(len(sents) - 1):
        target = t0 + (t1 - t0) * cum[k] / tot
        cand = [g for g, w in gaps if w >= 0.10 and g > prev + 0.8]
        if cand:
            best = min(cand, key=lambda g: abs(g - target))
            if abs(best - target) < 1.2:
                target = best
        target = max(target, prev + 0.6)
        bounds.append(target)
        prev = target

    rows = build(bounds, t1, sents)
    out = pd / "work" / "narration_beats.json"
    tcfg.save_json(out, {"total": total, "speech_spans": len(spans),
                         "t0": round(t0, 2), "sentences": rows})
    print(f"-> {out}")
    for r in rows[:6]:
        print("  %3d p%02d %7.2f-%7.2f %5.2fs %3d %s"
              % (r["idx"], r["para"], r["start"], r["end"], r["dur"], r["chars"], r["text"][:24]))
    if len(rows) > 6:
        print(f"  … 共 {len(rows)} 句")
    return 0
