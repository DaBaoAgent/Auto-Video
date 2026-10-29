# -*- coding: utf-8 -*-
import json
d = json.load(open(r'D:\@kaifa\yandi\output\001_波斯湾伊甸园_口播稿+配音\配音.transcript.json', encoding='utf-8'))
lines = []
n = [w for w in d if w['start'] >= 188]
lines.append('count %d' % len(n))
for w in n:
    lines.append('%.2f %s' % (w['start'], w['text']))
open(r'D:\@kaifa\yandi\yandi-video\render\posiwan\dump188.txt','w',encoding='utf-8').write('\n'.join(lines))
print('done', len(n))
