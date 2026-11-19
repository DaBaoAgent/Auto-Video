#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""rebuild_timeline.py — 用真实 ASR 词时间重建 timeline / paragraphs（不按字数均分）

用法：
  python scripts/rebuild_timeline.py --project projects/022_澳洲土著 \
      --asr projects/022_澳洲土著/review/asr_a.json \
            projects/022_澳洲土著/review/asr_b.json \
            projects/022_澳洲土著/review/asr_c.json \
      [--full-before 178 --b-before 362] [--sample-end 20.12]

  --sample-end 只在样片阶段用：写了才导出 sample_timeline.js（并作为页面时间轴）。

做法：
  1. 以现有 timeline.js 的句子切分为准（口播稿的句子切分）；
  2. 把 ASR 词按时间摊成「字 + 起止」序列；
  3. difflib 字符级比对，取匹配锚点；ASR 听错的同音字当作未匹配，用相邻锚点插值；
  4. 写回 timeline.json / timeline.js / paragraphs.js，并可选导出 sample_timeline.js。
"""
import argparse, difflib, json, re, sys

CJK = re.compile(r"[\u3400-\u9fff0-9A-Za-z]")


def norm(s):
    return "".join(CJK.findall(s))


def load_js(path, var):
    s = open(path, encoding="utf-8").read()
    m = re.search(r"window\.%s\s*=\s*(\{.*\}|\[.*\])\s*;?\s*$" % var, s, re.S)
    if not m:
        sys.exit("cannot parse %s" % path)
    return json.loads(m.group(1))


def load_asr(ranges):
    """ranges: list of (path, lo, hi) — keep words whose start is in [lo, hi)."""
    words = []
    for path, lo, hi in ranges:
        d = json.load(open(path, encoding="utf-8"))
        for seg in d["segments"]:
            for w in seg.get("words") or []:
                s = float(w["s"])
                if lo <= s < hi:
                    words.append((s, float(w["e"]), w["w"]))
    words.sort(key=lambda x: (x[0], x[1]))
    return words


def asr_chars(words):
    out = []
    for s, e, text in words:
        t = norm(text)
        if not t:
            continue
        n = len(t)
        e = max(e, s + 0.02)
        for i, ch in enumerate(t):
            out.append((ch, s + (e - s) * i / n, s + (e - s) * (i + 1) / n))
    return out


def align(timeline, words, verbose=True):
    lines = timeline["lines"]
    script, meta = [], []
    for li, line in enumerate(lines):
        for ci, ch in enumerate(line["text"]):
            c = norm(ch)
            if c:
                script.append(c)
                meta.append((li, ci))
    script = "".join(script)
    achars = asr_chars(words)
    asr = "".join(c for c, _, _ in achars)
    if not asr:
        sys.exit("ASR is empty")

    sm = difflib.SequenceMatcher(None, script, asr, autojunk=False)
    times = [None] * len(script)
    matched = 0
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            times[a + k] = (achars[b + k][1], achars[b + k][2])
        matched += size
    ratio = matched / max(1, len(script))
    if verbose:
        print("script chars=%d asr chars=%d matched=%d (%.1f%%)" % (len(script), len(asr), matched, ratio * 100))

    # fill gaps between anchors by linear interpolation
    known = [i for i, x in enumerate(times) if x]
    if not known:
        sys.exit("no anchors — ASR and script do not match at all")
    first, last = known[0], known[-1]
    step = max(0.05, (times[first][0] - 0.0) / max(1, first + 1))
    for j in range(first - 1, -1, -1):
        times[j] = (max(0.0, times[first][0] - step * (first - j) - 0.12), times[first][0] - step * (first - j))
    step = max(0.05, (timeline["duration"] - times[last][1]) / max(1, len(script) - last))
    step = min(step, 0.4)
    for j in range(last + 1, len(script)):
        st = times[last][1] + step * (j - last)
        times[j] = (st, st + min(step, 0.18))

    for A, B in zip(known, known[1:]):
        if B == A + 1:
            continue
        t0, t1 = times[A][1], times[B][0]
        n = B - A
        span = max(0.02 * n, t1 - t0)
        for k in range(1, n):
            st = t0 + span * k / n
            times[A + k] = (st, t0 + span * (k + 1) / n)

    # enforce monotonic
    prev_end = 0.0
    for j, (st, en) in enumerate(times):
        st = max(st, prev_end)
        en = max(en, st + 0.02)
        times[j] = (st, en)
        prev_end = en

    # assign back to per-line characters
    ti = 0
    for li, line in enumerate(lines):
        text = line["text"]
        ws = []
        cur = None
        for ch in text:
            if norm(ch):
                st, en = times[ti]
                ti += 1
                cur = en
            else:
                st = en = cur if cur is not None else (ws[-1]["end"] if ws else 0.0)
                cur = en
            ws.append({"text": ch, "start": round(st, 3), "end": round(en, 3)})
        line["start"] = ws[0]["start"]
        line["end"] = ws[-1]["end"]
        line["words"] = ws
    return ratio


def fix_bounds(lines):
    """make line bounds non-overlapping and non-degenerate"""
    for i, line in enumerate(lines):
        if line["end"] <= line["start"]:
            line["end"] = line["start"] + 0.05
        if i + 1 < len(lines):
            nxt = lines[i + 1]["start"]
            if line["end"] > nxt:
                cut = max(line["start"] + 0.05, nxt - 0.01)
                line["end"] = round(cut, 3)
                line["words"][-1]["end"] = round(cut, 3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--asr", nargs="+", required=True)
    ap.add_argument("--full-before", type=float, default=178.0)
    ap.add_argument("--b-before", type=float, default=362.0)
    ap.add_argument("--sample-end", type=float, default=None,
                    help="样片结束秒数；给了才导出 sample_timeline.js")
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    tl_path = args.project + "/timeline.js"
    timeline = load_js(tl_path, "TIMELINE")
    ranges = []
    full, b, c = args.asr[0], (args.asr[1] if len(args.asr) > 1 else None), (args.asr[2] if len(args.asr) > 2 else None)
    ranges.append((full, 0.0, args.full_before))
    if b:
        ranges.append((b, args.full_before, args.b_before))
    if c:
        ranges.append((c, args.b_before, 1e9))
    if len(args.asr) == 1:
        ranges = [(full, 0.0, 1e9)]
    words = load_asr(ranges)
    print("asr words=%d span=%.2f..%.2f" % (len(words), words[0][0], words[-1][1]))

    ratio = align(timeline, words)
    fix_bounds(timeline["lines"])

    # paragraphs keep the existing grouping (verified against the script paragraphs)
    P = load_js(args.project + "/paragraphs.js", "PARAGRAPHS")
    for p in P:
        ls = [timeline["lines"][i - 1] for i in p["lines"]]
        p["start"] = round(ls[0]["start"], 3)
        p["end"] = round(ls[-1]["end"], 3)

    # report
    rates = []
    for line in timeline["lines"]:
        d = line["end"] - line["start"]
        rates.append(len(norm(line["text"])) / max(0.05, d))
    rates.sort()
    print("cps median=%.2f p10=%.2f p90=%.2f" % (rates[len(rates) // 2], rates[len(rates) // 10], rates[len(rates) * 9 // 10]))
    for p in P:
        print("P%d %.2f - %.2f  (%.1fs)" % (p["i"], p["start"], p["end"], p["end"] - p["start"]))
    for line in timeline["lines"][:10]:
        print("%s %.2f-%.2f  %s" % (line["id"], line["start"], line["end"], line["text"][:32]))

    if args.dry:
        return

    with open(args.project + "/timeline.json", "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=1)
    with open(tl_path, "w", encoding="utf-8") as f:
        f.write("window.TIMELINE = " + json.dumps(timeline, ensure_ascii=False) + ";\n")
    with open(args.project + "/paragraphs.js", "w", encoding="utf-8") as f:
        f.write("window.PARAGRAPHS = " + json.dumps(P, ensure_ascii=False) + ";\n")

    # sample: lines that begin before sample_end（只有显式给了才导出）
    if args.sample_end is not None:
        sample_lines = []
        for line in timeline["lines"]:
            if line["start"] >= args.sample_end:
                break
            sample_lines.append(json.loads(json.dumps(line)))
        if sample_lines:
            end = args.sample_end
            sample_lines[-1]["end"] = round(min(sample_lines[-1]["end"], end), 3)
            sample_lines[-1]["words"][-1]["end"] = sample_lines[-1]["end"]
            sample = {"duration": round(end, 3), "lines": sample_lines}
            with open(args.project + "/sample_timeline.js", "w", encoding="utf-8") as f:
                f.write("window.TIMELINE = " + json.dumps(sample, ensure_ascii=False) + ";\n")
            print("sample lines=%d duration=%.2f last_end=%.2f" % (len(sample_lines), end, sample_lines[-1]["end"]))


if __name__ == "__main__":
    main()
