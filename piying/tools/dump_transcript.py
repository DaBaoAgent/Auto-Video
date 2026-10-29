# -*- coding: utf-8 -*-
import json, sys
c = json.load(open(r'D:\@kaifa\yandi\output\001_波斯湾伊甸园_口播稿+配音\配音.transcript.json', encoding='utf-8'))
end = float(sys.argv[1]) if len(sys.argv) > 1 else 12
for w in c:
    if w['start'] < end:
        print(f"{w['start']:.2f}-{w['end']:.2f} {w['text']}")
    else:
        break
