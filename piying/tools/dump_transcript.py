import os
YANDI = os.environ.get("YANDI_DIR", "")   # 设 YANDI_DIR 指向 yandi 项目根
# -*- coding: utf-8 -*-
import json, sys
c = json.load(open(rf'{YANDI}\output\001_波斯湾伊甸园_口播稿+配音\配音.transcript.json', encoding='utf-8'))
end = float(sys.argv[1]) if len(sys.argv) > 1 else 12
for w in c:
    if w['start'] < end:
        print(f"{w['start']:.2f}-{w['end']:.2f} {w['text']}")
    else:
        break
