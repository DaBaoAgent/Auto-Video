# -*- coding: utf-8 -*-
"""按句权重建 cue sheet：切点 / 字幕 / 节拍，句界就近吸附到配音静音谷。"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "cues.json")
PAL = ['08070f', '12122a', '1c2040', '2a3459', '3f4a72', '5c6a92', '8393b8', 'b9c9e0', 'eef4ff',
       '241810', '3b2a1c', '5c3f26', '7d5733', 'a37648', 'c99a63', 'ffcf5c', 'ffe89a',
       '4d1119', '92202a', 'd13a33', '0b2422', '123a35', '1d5a4b', '359072',
       '332046', '5c356e', '4c5266', '7d8698', 'e2d8c4', '6b4c18', '7fc95a', '15101f']

SPEECH_T0 = 0.14
SPEECH_T1 = 21.46
DUR = 21.46

# 每句：(句子权重 = 字数 + 标点停顿), 分句列表 [(字幕文本, 高亮)]
SENT = [
    ("你看过十三号星期五吗？", [("你看过十三号星期五吗", "十三号星期五")]),
    ("湖边营地、戴面具的杰森、一个接一个倒下的年轻人，多少人童年的阴影。",
     [("湖边营地", "湖边营地"), ("戴面具的杰森", "杰森"), ("一个接一个倒下的年轻人", "倒下"), ("多少人童年的阴影", "童年")]),
    ("但你不知道的是，这部片子是抄的，",
     [("但你不知道的是", "不知道"), ("这部片子是抄的", "抄")]),
    ("它抄的那部原版，是一部一九七一年的意大利老片《血之海滩》，",
     [("它抄的那部原版", "原版"), ("是一部一九七一年的", "一九七一年"), ("意大利老片", "意大利"), ("血之海滩", "血之海滩")]),
    ("铅黄名导马里奥·巴瓦的名作。", [("铅黄名导马里奥巴瓦", "马里奥巴瓦"), ("的名作", "名作")]),
    ("我为了做这一期，把这部老片翻出来又盘了好几遍，",
     [("我为了做这一期", "这一期"), ("把这部老片翻出来", "翻出来"), ("又盘了好几遍", "好几遍")]),
    ("越盘越觉得，后来的恐怖片全都欠它一句谢谢。",
     [("越盘越觉得", "越盘"), ("后来的恐怖片", "恐怖片"), ("全都欠它一句谢谢", "谢谢")]),
]

PUNCT_W = {"，": 2.2, "、": 1.6, "。": 2.6, "？": 2.6, "《": 0.2, "》": 0.2}


def weight(text):
    w = 0.0
    for ch in text:
        w += PUNCT_W.get(ch, 1.0)
    return w


def main():
    gaps = json.load(open(os.path.join(HERE, "gaps.json"), encoding="utf-8"))["gaps"]
    centers = [(g[0] + g[1]) / 2 for g in gaps if g[1] - g[0] >= 0.18]
    w_tot = sum(weight(s[0]) for s in SENT)
    span = SPEECH_T1 - SPEECH_T0
    bounds, acc = [], 0.0
    for s in SENT[:-1]:
        acc += weight(s[0])
        raw = SPEECH_T0 + span * acc / w_tot
        near = min(centers, key=lambda c: abs(c - raw)) if centers else raw
        snapped = near if abs(near - raw) <= 0.40 else raw
        bounds.append(round(snapped, 2))
    bounds.append(SPEECH_T1)
    print("sentence bounds:", [SPEECH_T0] + bounds)

    # 句内按分句权重分配
    subs = []
    t = SPEECH_T0
    for i, (sent, phrases) in enumerate(SENT):
        end = bounds[i]
        pw = sum(weight(p[0]) for p in phrases)
        tt = t
        for (zh, hl) in phrases:
            d = (end - t) * weight(zh) / pw
            subs.append({"t0": round(tt, 2), "t1": round(min(end, tt + d) - 0.04, 2), "text": zh, "hl": hl})
            tt += d
        t = end

    cuts = [0.0] + bounds[:-1]
    # 视觉切点：面具人之后接「一个接一个倒下」，不等句界
    cuts = sorted(set([round(c, 2) for c in cuts] + [3.90]))
    hits = [{"t": c, "kind": "cut"} for c in cuts[1:]]
    hits += [{"t": 2.35, "kind": "hit"}, {"t": 3.98, "kind": "hit"},
             {"t": 4.40, "kind": "hit"}, {"t": 4.82, "kind": "hit"},
             {"t": 7.40, "kind": "hit"}]
    hits.sort(key=lambda h: h["t"])

    data = {"fps": 30, "duration": DUR, "pal": PAL, "cuts": [round(c, 2) for c in cuts],
            "subs": subs, "hits": hits}
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("cuts:", data["cuts"])
    print("subs:")
    for s in subs:
        print("  %5.2f-%5.2f  %s" % (s["t0"], s["t1"], s["text"]))
    print("duration", DUR)


if __name__ == "__main__":
    main()
