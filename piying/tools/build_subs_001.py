# -*- coding: utf-8 -*-
import json, re
d = json.load(open(r'D:\@kaifa\yandi\output\001_波斯湾伊甸园_口播稿+配音\配音.transcript.json', encoding='utf-8'))
words = [(w['start'], w['end'], w['text']) for w in d]
# 全文拼接
full = ''.join(w[2] for w in words)
print('总字数:', len(full), '词数:', len(words))
print('末尾5词:', words[-5:])
# 停顿点（词间 gap）
gaps = []
for i in range(1, len(words)):
    g = words[i][0] - words[i-1][1]
    if g >= 0.18:
        gaps.append((round(words[i-1][1], 2), round(words[i][0], 2), round(g, 2), i))
print('词间>=0.18s停顿数:', len(gaps))
# 输出完整文本，按长停顿插入换行
out = []
gi = 0
for i, (s, e, t) in enumerate(words):
    out.append(t)
    if gi < len(gaps) and gaps[gi][3] == i:
        out.append('\n')
        gi += 1
open(r'D:\@kaifa\yandi\yandi-video\render\posiwan\transcript_segments.txt', 'w', encoding='utf-8').write('\n'.join(''.join(out).split('\n')))
print('--- 全文（按停顿分行）---')
seg = ''.join(out)
for line in seg.split('\n'):
    print(line)
