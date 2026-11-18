# -*- coding: utf-8 -*-
"""第二批 5 条样片的 ASS 字幕：三条带字幕，两条纯材质留空。"""
import json, pathlib

ROOT = pathlib.Path(__file__).parent
DUR = json.loads((ROOT / "audio" / "durations.json").read_text(encoding="utf-8"))

CLIPS = {
    "laolang": ["四比三的圆角片门，一九八〇年的手。", "人是画的，世界更像一幅画。"],
    "goldenage": ["手绘的城市，墨线的角色，一秒十五张的抖。", "片门一晃，一九四八年的印片。"],
    "manga": ["分格、网点、速度线。", "一格一个 beat，从右往左，一页一页翻。"],
}

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: S,Microsoft YaHei,58,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,3,1,2,60,60,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def build(cid, lines):
    total = DUR[cid]["seconds"]
    t0 = 0.55
    weights = [len(x) for x in lines]
    out = [HEAD]
    acc = 0
    for i, ln in enumerate(lines):
        share = total * weights[i] / sum(weights)
        a = t0 + acc
        acc += share
        b = min(t0 + acc, 9.4)
        out.append(f"Dialogue: 0,{ts(a)},{ts(b)},S,,0,0,0,,{ln}\r\n")
    (ROOT / f"sub-{cid}.ass").write_text("".join(out), encoding="utf-8")
    print(cid, "ok", round(total, 3))


for cid, lines in CLIPS.items():
    build(cid, lines)
