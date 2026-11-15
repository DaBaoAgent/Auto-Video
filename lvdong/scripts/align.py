# -*- coding: utf-8 -*-
"""Align the script to the transcript, paragraph by paragraph.

    python align.py <project> <script.md> [--paras 3] [--limit 56.0] [--drop "一句|另一句"]

Reads  <project>/voice/words_full.json   (transcribe.py)
Writes <project>/voice/align.json        paragraphs + sentence cues
       <project>/voice/chars.json        per-character [char, t0, t1] for cue cutting

How it works: every character of the script (the first N paragraphs) and every character
of the transcript are compared with difflib; matched characters take the transcript's
time, unmatched ones are interpolated between their neighbours. A line the narrator never
said simply gets no matches — that is why --drop exists: removing it from the script first
keeps the alignment honest instead of stretching a phantom line across real speech.

A subtitle says what is heard. If the take omits a sentence, drop it here and let the line
survive as on-screen type in film.js, not as a spoken line.
"""
import argparse, difflib, io, json, os, re

ap = argparse.ArgumentParser()
ap.add_argument("project")
ap.add_argument("script")
ap.add_argument("--paras", type=int, default=3)
ap.add_argument("--limit", type=float, default=0.0, help="ignore transcript after this second")
ap.add_argument("--drop", default="", help="sentences the take never says, separated by |")
a = ap.parse_args()

P = a.project
WORDS = os.path.join(P, "voice", "words_full.json")
DROP = [s for s in a.drop.split("|") if s.strip()]


def clean(s):
    return re.sub(r"[^\u4e00-\u9fff0-9A-Za-z]", "", s)


words = json.load(io.open(WORDS, encoding="utf-8"))["words"]
limit = a.limit if a.limit > 0 else 1e9

asr_chars, asr_t0, asr_t1 = [], [], []
for w in words:
    if w["t0"] >= limit:
        continue
    cs = clean(w["w"])
    if not cs:
        continue
    n = len(cs)
    for j, c in enumerate(cs):
        asr_chars.append(c)
        asr_t0.append(w["t0"] + (w["t1"] - w["t0"]) * j / n)
        asr_t1.append(w["t0"] + (w["t1"] - w["t0"]) * (j + 1) / n)

allparas = [l.strip() for l in io.open(a.script, encoding="utf-8").read().split("\n") if l.strip()]
paras = [p for p in allparas[:a.paras]]
for d in DROP:
    # 删掉整句，把它前面那个逗号改成句号，否则会留下「…多一点点，可它的…」这种半句
    paras = [p.replace("，" + d, "。").replace("、" + d, "。").replace(d, "") for p in paras]

scr_chars, scr_idx = [], []
for pi, p in enumerate(paras):
    for j, c in enumerate(clean(p)):
        scr_chars.append(c)
        scr_idx.append((pi, j))

sm = difflib.SequenceMatcher(a=scr_chars, b=asr_chars, autojunk=False)
cmap = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        cmap[blk.a + k] = (asr_t0[blk.b + k], asr_t1[blk.b + k])

anchors = sorted(cmap.keys())
times = [None] * len(scr_chars)
for k in anchors:
    times[k] = cmap[k]
for idx in range(len(scr_chars)):
    if times[idx] is not None:
        continue
    lo = max([x for x in anchors if x < idx], default=None)
    hi = min([x for x in anchors if x > idx], default=None)
    if lo is None and hi is None:
        times[idx] = (0.0, 0.0)
    elif lo is None:
        times[idx] = (times[hi][0], times[hi][0])
    elif hi is None:
        times[idx] = (times[lo][1], times[lo][1])
    else:
        f = (idx - lo) / (hi - lo)
        m = times[lo][1] + (times[hi][0] - times[lo][1]) * f
        times[idx] = (m, m)

matched = sum(b.size for b in sm.get_matching_blocks())
rate = matched / max(1, len(scr_chars))
print("char match rate %.1f%%  (%d script chars, %d asr chars)" % (100 * rate, len(scr_chars), len(asr_chars)))
if rate < 0.75:
    print("WARNING: below 75%% — read the transcript tail, a repeated-phrase loop probably ate the take")

out = {"paras": [], "cues": [], "match_rate": round(rate, 3)}
pos = 0
for pi, p in enumerate(paras):
    n = len(clean(p))
    out["paras"].append({"i": pi + 1, "t0": round(times[pos][0], 3), "t1": round(times[pos + n - 1][1], 3),
                         "chars": n, "text": p})
    pos += n

for pi, p in enumerate(paras):
    base = sum(len(clean(q)) for q in paras[:pi])
    cursor = 0
    for s in [x for x in re.findall(r"[^。；！？]*[。；！？]?", p) if x.strip()]:
        cs = clean(s)
        if not cs:
            continue
        a0, b0 = base + cursor, base + cursor + len(cs) - 1
        out["cues"].append({"t0": round(times[a0][0], 3), "t1": round(times[b0][1], 3), "text": s.strip()})
        cursor += len(cs)

io.open(os.path.join(P, "voice", "align.json"), "w", encoding="utf-8").write(
    json.dumps(out, ensure_ascii=False, indent=1))

chars, gi = [], 0
for p in paras:
    for ch in p:
        if re.match(r"[\u4e00-\u9fff0-9A-Za-z]", ch):
            t0, t1 = times[gi]
            chars.append([ch, round(t0, 3), round(t1, 3)])
            gi += 1
        else:
            a0 = chars[-1][2] if chars else 0.0
            b0 = times[gi][0] if gi < len(times) and times[gi] else a0
            chars.append([ch, round(a0, 3), round(max(a0, b0), 3)])
io.open(os.path.join(P, "voice", "chars.json"), "w", encoding="utf-8").write(
    json.dumps(chars, ensure_ascii=False))

print("\n== paragraphs ==")
for p in out["paras"]:
    print("%d  %7.2f %7.2f  %5.2f s  %3d 字  %s" % (p["i"], p["t0"], p["t1"], p["t1"] - p["t0"], p["chars"], p["text"][:26]))
print("\n== sentences ==")
for c in out["cues"]:
    print("%7.2f %7.2f  %5.2f  %s" % (c["t0"], c["t1"], c["t1"] - c["t0"], c["text"]))
