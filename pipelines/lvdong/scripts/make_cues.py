# -*- coding: utf-8 -*-
"""Subtitle lines from the per-character timeline.

    python make_cues.py <project> --end 53.40 [--want 16] [--hard 20] [--min-hold 1.6] [--tail .45] [--labels "17′28″雏形成熟玛雅文"]

Reads  <project>/voice/chars.json      (align.py)
Writes <project>/out/cues.json         [{t0,t1,text}] — what film.js burns and srt.py exports
       <project>/out/subchars.txt      every glyph the film needs (subset the font with this)

Rules: 11–WANT characters per line, break at a clause mark when one is near, never inside
a number or before a particle (的/了/是/就/和/跟/在/把/被/只), lines touch (no gap), and
a line shorter than MIN_HOLD gets a little pre-roll instead of being stretched.

The end is the section the film speaks (`--end`): characters after it are left for the
next film, and the last line is allowed to run past it by TAIL only.
"""
import argparse, io, json, os, re

ap = argparse.ArgumentParser()
ap.add_argument("project")
ap.add_argument("--end", type=float, required=True, help="last second of spoken narration")
ap.add_argument("--want", type=int, default=16)
ap.add_argument("--hard", type=int, default=20)
ap.add_argument("--min-hold", type=float, default=1.60)
ap.add_argument("--tail", type=float, default=0.45)
ap.add_argument("--labels", default="0123456789′″·C")
a = ap.parse_args()

P = a.project
SECTION_END, WANT, HARD, MIN_HOLD, TAIL = a.end, a.want, a.hard, a.min_hold, a.tail
NO_LINE_START = "的了是就都也还和跟与在被把让给而而且其之所"
NO_BREAK_AFTER = "三几第"
NO_BREAK_BEFORE = "型式法性子门化者"
PUNCT = "，。；、！？："

chars = json.load(io.open(os.path.join(P, "voice", "chars.json"), encoding="utf-8"))
stream = []
for ch, t0, t1 in chars:
    if t0 >= SECTION_END:
        break
    stream.append([ch, t0, t1])


def is_cjk(c):
    return bool(re.match(r"[\u4e00-\u9fff0-9A-Za-z]", c))


items = [(i, c) for i, (c, _, _) in enumerate(stream) if is_cjk(c)]
lines, start = [], 0
while start < len(items):
    n, best, i = 0, None, start
    while i < len(items):
        n += 1
        c = items[i][1]
        nxt = items[i + 1][1] if i + 1 < len(items) else ""
        raw_next = stream[items[i][0] + 1][0] if items[i][0] + 1 < len(stream) else ""
        if n >= 11 and raw_next in PUNCT:
            best = i
        if n >= WANT and best is None and nxt not in NO_LINE_START and nxt not in "0123456789" \
                and nxt not in NO_BREAK_BEFORE and c not in NO_BREAK_AFTER:
            best = i
        if n >= HARD:
            break
        i += 1
    if i >= len(items) or best is None or best < start + 8:
        best = len(items) - 1
    lines.append((start, best))
    start = best + 1

cues = []
for (a0, b0) in lines:
    ca, cb = items[a0][0], items[b0][0]
    text = "".join(stream[j][0] for j in range(ca, cb + 1)).strip()
    text = re.sub(r"[，、；]$", "", text)
    text = re.sub(r"([，。；、！？：])\1+", r"\1", text)
    text = re.sub(r"[，、；]([。；])", r"\1", text)
    cues.append([round(stream[ca][1], 2), round(stream[cb][2], 2), text])

for i, c in enumerate(cues):
    nxt = cues[i + 1][0] if i + 1 < len(cues) else SECTION_END + 1.0
    c[1] = min(nxt, max(c[1] + TAIL, c[1]))

for i, c in enumerate(cues):
    if c[1] - c[0] < MIN_HOLD:
        need = min(MIN_HOLD - (c[1] - c[0]), 0.6)
        lo = cues[i - 1][1] + 0.05 if i > 0 else 0.0
        c[0] = max(lo, c[0] - need)
        if i > 0 and cues[i - 1][1] > c[0]:
            cues[i - 1][1] = max(cues[i - 1][0] + 0.4, c[0] - 0.03)

out = [{"t0": c[0], "t1": round(c[1], 2), "text": c[2]} for c in cues]
os.makedirs(os.path.join(P, "out"), exist_ok=True)
io.open(os.path.join(P, "out", "cues.json"), "w", encoding="utf-8").write(
    json.dumps(out, ensure_ascii=False, indent=1))
io.open(os.path.join(P, "out", "subchars.txt"), "w", encoding="utf-8").write(
    "".join(sorted(set("".join(c["text"] for c in out) + a.labels))))

print("cues %d" % len(out))
short = 0
for c in out:
    h = c["t1"] - c["t0"]
    short += h < MIN_HOLD
    print("%6.2f %6.2f  %5.2f  %-3d %s" % (c["t0"], c["t1"], h, len(c["text"]), c["text"]))
print("lines under %.1fs: %d" % (MIN_HOLD, short))
