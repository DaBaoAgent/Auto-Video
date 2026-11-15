# -*- coding: utf-8 -*-
import json
d = json.load(open(r'D:\@kaifa\yandi\output\001_波斯湾伊甸园_口播稿+配音\配音.transcript.json', encoding='utf-8'))
words = [(w['start'], w['end'], w['text']) for w in d]

# 长停顿切语音段（gap>=0.18）
cuts = []
for i in range(1, len(words)):
    g = words[i][0] - words[i-1][1]
    if g >= 0.18:
        cuts.append((i, words[i-1][1], words[i][0], g))
bounds = [0] + [c[0] for c in cuts] + [len(words)]
times = [(words[0][0], words[cuts[0][0]-1][1] if cuts else words[-1][1])]
segs = []
for k in range(len(bounds)-1):
    a, b = bounds[k], bounds[k+1]
    seg_words = words[a:b]
    segs.append((round(seg_words[0][0], 2), round(seg_words[-1][1], 2),
                 round(seg_words[-1][1]-seg_words[0][0], 2), ''.join(w[2] for w in seg_words)))
for i, (s, e, dur, txt) in enumerate(segs):
    print(f"[{i:02d}] {s:7.2f}-{e:7.2f} ({dur:5.2f}s) {txt}")
