#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""make_vo.py — 配音 + 口播稿 → timeline / paragraphs / script.json（Auto-Video 通用）

用法：
  python scripts/make_vo.py --src 配音.wav --text 口播稿.txt --out projects/xxx [--lead 0.7] [--cut 秒]

输入约定：
  --text  纯文本，每行一个自然段（空行忽略）；
  --src   人声 wav（也可 m4a/mp3，ffmpeg 会解码）；
  --fixed 可选：已知的段落边界（逗号分隔秒数或 para_bounds.json），前 N 个直接采用，
          其余段落用「静音候选 + 字数/时长一致」DP 对齐。

输出（写到 --out）：
  audio/narration.m4a, audio/narration.wav
  timeline.json / timeline.js（句级时间轴，字级 words）
  paragraphs.js（自然段起止）
  script.json（bgm: false，供页面与渲染器读取）

已知坑（来自实战管线）：
  * ffmpeg 的 -t 必须放在 -i 之前（输入截断），否则尾部会被削掉；
  * 本机 ffmpeg 的 44.1k 单声道 AAC 会卡住：先 -ar 48000 -ac 2 再编码；
  * 段落之间停顿有时 < 0.22 s，不能只靠 silencedetect 切段，必须做 DP 对齐。
"""
import argparse
import array
import json
import math
import os
import re
import subprocess
import sys

SR = 16000          # 能量包络采样率
HOP = int(SR * 0.02)  # 20 ms 一帧


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def ffmpeg(args):
    return run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-y"] + args)


def probe_duration(path):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
              text=True, encoding="utf-8", errors="replace").stdout
    return float(out.strip())


def silence_candidates(src, total, noise="-38dB", dur=0.22):
    p = run(["ffmpeg", "-hide_banner", "-nostdin", "-i", src,
             "-af", "silencedetect=noise=%s:d=%s" % (noise, dur), "-f", "null", "-"],
            text=True, encoding="utf-8", errors="replace")
    starts, ends = [], []
    for line in p.stderr.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", line)
        if m:
            starts.append(float(m.group(1)))
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m:
            ends.append(float(m.group(1)))
    cand = {0.0, round(total, 3)}
    for a, b in zip(starts, ends):
        mid = (a + b) / 2
        if 0.1 < mid < total - 0.1:
            cand.add(round(mid, 3))
    return sorted(cand)


def envelope(src, cut):
    """20 ms 短时 RMS，用于句边界找最低能量点。"""
    pcm = run(["ffmpeg", "-v", "error", "-t", str(cut), "-i", src,
               "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]).stdout
    a = array.array("h")
    a.frombytes(pcm)
    rms = []
    for i in range(0, len(a) - HOP, HOP):
        s = 0
        for v in a[i:i + HOP]:
            s += v * v
        rms.append(math.sqrt(s / HOP))
    return rms


def quiet_near(rms, pred, lo, hi):
    f0, f1 = max(0, int(lo / 0.02)), min(len(rms) - 6, int(hi / 0.02))
    if f1 <= f0:
        return pred
    best, score = pred, float("inf")
    for f in range(f0, f1):
        e = sum(rms[f:f + 5]) / 5 + abs(f * 0.02 - pred) * 0.0006
        if e < score:
            score, best = e, f * 0.02 + 0.05
    return best


def split_sentences(text):
    return [x.strip() for x in re.findall(r"[^。？！!?]*[。？！!?]", text) if x.strip()]


def dp_align(cands, lengths, fixed_end=None, rate_lo=3.8, rate_hi=5.2):
    """把 cands 里的一部分选成 N+1 个段落边界；代价 = 每段时长与「字数/语速」的偏离。

    返回 (bounds, rate) 或 (None, None)。fixed_end 给定时，第一个边界固定为它。
    """
    n = len(lengths)
    if n == 0:
        return [0.0], None
    # 只在 fixed_end 之后用候选
    sub = [c for c in cands if fixed_end is None or c > fixed_end + 0.05]
    if fixed_end is None:
        if len(sub) < 2:
            return None, None
        sub = [sub[0]] + sub[1:]
    else:
        sub = [fixed_end] + sub
    if len(sub) < n + 1:
        return None, None
    target = lengths if fixed_end is None else lengths
    best_all = None
    for k in range(int(rate_lo * 100), int(rate_hi * 100) + 1, 5):
        rate = k / 100.0
        INF = 1e18
        dp = [[INF] * len(sub) for _ in range(n + 1)]
        bk = [[-1] * len(sub) for _ in range(n + 1)]
        for j in range(len(sub)):
            dp[0][j] = 0
        for i in range(1, n + 1):
            for j in range(i, len(sub)):
                for k2 in range(i - 1, j):
                    if dp[i - 1][k2] >= INF:
                        continue
                    d = sub[j] - sub[k2]
                    ideal = target[i - 1] / rate
                    c = (d - ideal) ** 2 / max(ideal, 1.0)
                    if c < dp[i][j]:
                        dp[i][j] = c
                        bk[i][j] = k2
        j = len(sub) - 1
        if dp[n][j] >= INF:
            continue
        bounds = [sub[j]]
        jj = j
        for i in range(n, 0, -1):
            jj = bk[i][jj]
            if jj < 0:
                break
            bounds.append(sub[jj])
        if len(bounds) != n + 1:
            continue
        bounds.reverse()
        ok = all(1.0 <= bounds[i + 1] - bounds[i] <= max(6.0, target[i] * 0.7) for i in range(n))
        if not ok:
            continue
        cost = dp[n][len(sub) - 1]
        if best_all is None or cost < best_all[0]:
            best_all = (cost, bounds, rate)
    if not best_all:
        return None, None
    return best_all[1], best_all[2]


def proportional_bounds(total, lengths):
    s = sum(lengths) or 1
    acc, bounds = 0, [0.0]
    for n in lengths[:-1]:
        acc += n
        bounds.append(total * acc / s)
    bounds.append(total)
    return bounds


def main():
    ap = argparse.ArgumentParser(description="配音 + 口播稿 → 管线时间轴")
    ap.add_argument("--src", required=True, help="人声 wav/m4a/mp3")
    ap.add_argument("--text", required=True, help="口播稿 txt，每行一段")
    ap.add_argument("--out", required=True, help="工程目录")
    ap.add_argument("--lead", type=float, default=0.7, help="片头留白秒数（默认 0.7）")
    ap.add_argument("--cut", type=float, default=None, help="只取前 N 秒人声（默认音频全长）")
    ap.add_argument("--fixed", default=None, help="已知前 K 段边界：逗号分隔秒数，或 para_bounds.json")
    ap.add_argument("--voice", default="zh-CN-YunxiNeural", help="script.json 里记录的音色（仅元数据）")
    args = ap.parse_args()

    paras = [l.strip() for l in open(args.text, encoding="utf-8-sig").read().splitlines() if l.strip()]
    if not paras:
        sys.exit("口播稿为空：%s" % args.text)
    total = probe_duration(args.src)
    cut = args.cut if args.cut else total
    if cut > total + 0.05:
        sys.exit("--cut %.2f 超过音频长度 %.2f" % (cut, total))
    os.makedirs(os.path.join(args.out, "audio"), exist_ok=True)

    fixed_bounds = []
    if args.fixed:
        if os.path.isfile(args.fixed):
            d = json.load(open(args.fixed, encoding="utf-8"))
            fixed_bounds = [float(x) for x in d.get("bounds", d)]
        else:
            fixed_bounds = [float(x) for x in args.fixed.split(",") if x.strip()]
        fixed_bounds = [x for x in fixed_bounds if x <= cut]
    known = max(0, len(fixed_bounds) - 1)
    if known >= len(paras):
        known = len(paras) - 1

    cands = silence_candidates(args.src, cut)
    lengths = [len(p) for p in paras]
    if known:
        rest_bounds, rate = dp_align([c for c in cands if c >= fixed_bounds[-1]],
                                     lengths[known:], fixed_end=fixed_bounds[-1])
        if rest_bounds:
            bounds = fixed_bounds[:-1] + rest_bounds
        else:
            tail = proportional_bounds(cut - fixed_bounds[-1], lengths[known:])
            bounds = fixed_bounds[:-1] + [fixed_bounds[-1] + t for t in tail]
            rate = None
    else:
        bounds, rate = dp_align(cands, lengths)
        if not bounds:
            bounds = proportional_bounds(cut, lengths)
            rate = None
    if len(bounds) != len(paras) + 1:
        sys.exit("段落边界数量不匹配：%d 段，%d 个边界" % (len(paras), len(bounds)))
    bounds[-1] = min(bounds[-1], cut)

    rms = envelope(args.src, cut)
    para_bounds, para_sents = [], []
    for i, text in enumerate(paras):
        s, e = bounds[i], bounds[i + 1]
        sents = split_sentences(text) or [text]
        lens = [len(x) for x in sents]
        tot = sum(lens) or 1
        acc, b = 0, [s]
        for n in lens[:-1]:
            acc += n
            pred = s + (e - s) * acc / tot
            b.append(quiet_near(rms, pred, pred - 0.8, pred + 0.8))
        b.append(e)
        for k in range(1, len(b) - 1):
            b[k] = max(b[k], b[k - 1] + 0.5)
            b[k] = min(b[k], b[k + 1] - 0.5)
            b[k] = max(b[k], s + 0.1)
        para_bounds.append(b)
        para_sents.append(sents)

    # 旁白音频：-t 在 -i 之前；先 48k 立体声再 AAC（44.1k mono 会卡）
    wav = os.path.join(args.out, "audio", "narration.wav")
    ffmpeg(["-t", "%.3f" % cut, "-i", args.src,
            "-af", "adelay=%d:all=1,aresample=44100" % int(args.lead * 1000), "-ac", "1", wav])
    m4a = os.path.join(args.out, "audio", "narration.m4a")
    ffmpeg(["-i", wav, "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", "192k", m4a])

    def words_for(text, s, e):
        n = max(1, len(text))
        return [{"text": ch,
                 "start": round(s + (e - s) * i / n, 3),
                 "end": round(s + (e - s) * (i + 1) / n, 3)} for i, ch in enumerate(text)]

    lines = []
    for b, sents in zip(para_bounds, para_sents):
        for j, text in enumerate(sents):
            s, e = b[j] + args.lead, b[j + 1] + args.lead
            lines.append({"id": "l%d" % (len(lines) + 1), "text": text,
                          "start": round(s, 3), "end": round(e, 3), "words": words_for(text, s, e)})
    dur = round(cut + args.lead, 3)
    tl = {"duration": dur, "lines": lines}
    with open(os.path.join(args.out, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(tl, f, ensure_ascii=False, indent=1)
    with open(os.path.join(args.out, "timeline.js"), "w", encoding="utf-8") as f:
        f.write("window.TIMELINE = " + json.dumps(tl, ensure_ascii=False) + ";\n")

    idx, P = 1, []
    for i, (b, sents) in enumerate(zip(para_bounds, para_sents), start=1):
        P.append({"i": i, "start": round(b[0] + args.lead, 3), "end": round(b[-1] + args.lead, 3),
                  "lines": list(range(idx, idx + len(sents)))})
        idx += len(sents)
    with open(os.path.join(args.out, "paragraphs.js"), "w", encoding="utf-8") as f:
        f.write("window.PARAGRAPHS = " + json.dumps(P, ensure_ascii=False) + ";\n")

    script = {"voice": args.voice, "rate": "+0%", "lead_in": args.lead,
              "gap": 0.35, "tail": 1.2, "bgm": True,
              "lines": [{"id": l["id"], "text": l["text"]} for l in lines]}
    with open(os.path.join(args.out, "script.json"), "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print("segments=%d lines=%d duration=%.2fs%s" % (
        len(paras), len(lines), dur, "" if rate is None else "  (rate %.2f 字/s)" % rate))
    print("段落边界：" + ", ".join("%.2f" % x for x in bounds))


if __name__ == "__main__":
    main()
