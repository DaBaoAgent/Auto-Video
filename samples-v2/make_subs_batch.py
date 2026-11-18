# -*- coding: utf-8 -*-
import json, pathlib, re
ROOT = pathlib.Path("samples-v2")
DUR = json.loads((ROOT/"audio"/"durations.json").read_text(encoding="utf-8"))
MAN = json.loads((ROOT/"manifest.json").read_text(encoding="utf-8"))
import sys
IDS = sys.argv[1:] or ["pingban","labi","gangbi","weisuo","zhuangshi","ditu","shuimo","shiliang","xianshiqi","xuni","dengju"]
HEAD = open(ROOT/"sub-laolang.ass", encoding="utf-8").read().split("Dialogue:")[0]
def ts(t):
    h=int(t//3600); m=int(t%3600//60); s=t%60
    return f"{h}:{m:02d}:{s:05.2f}"
def split2(text):
    seg=[p for p in text.split("。") if p.strip()]
    if len(seg)>=2:
        best=None
        for i in range(1,len(seg)):
            a=sum(len(x)+1 for x in seg[:i])
            if best is None or abs(a-len(text)/2)<abs(best-len(text)/2): best=a; bi=i
        return ["。".join(seg[:bi])+"。", "。".join(seg[bi:])]
    seg=[p for p in re.split(r"[，、；]", text) if p.strip()]
    best=None
    for i in range(1,len(seg)):
        a=sum(len(x)+1 for x in seg[:i])
        if best is None or abs(a-len(text)/2)<abs(best-len(text)/2): best=a; bi=i
    return ["，".join(seg[:bi])+"，", "，".join(seg[bi:])]
for cid in IDS:
    total=DUR[cid]["seconds"]
    text=next(s["narration"] for s in MAN["samples"] if s["id"]==cid)
    lines=split2(text); w=[len(x) for x in lines]
    out=[HEAD+"Dialogue: 0,0:00:00.00,0:00:00.00,S,,0,0,0,,占位\r\n"]
    out=out[:0]+[HEAD]
    t0=0.55; acc=0
    for i,ln in enumerate(lines):
        share=total*w[i]/sum(w); a=t0+acc; acc+=share; b=min(t0+acc,9.4)
        out.append(f"Dialogue: 0,{ts(a)},{ts(b)},S,,0,0,0,,{ln}\r\n")
    (ROOT/f"sub-{cid}.ass").write_text("".join(out),encoding="utf-8")
    print(cid,"|"," / ".join(lines))

