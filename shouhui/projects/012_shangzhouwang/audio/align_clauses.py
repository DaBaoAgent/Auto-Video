# -*- coding: utf-8 -*-
"""把 16 句 / 46 从句用 DP 精确对齐到 配音.wav 实测语音段（-30dB/d=0.12）。

已验证：成片混音轨与 配音.wav 时基偏移 ≈ +0.015s（31 处静音配对），可直接用配音时基。
输出 audio/sentences-aligned.json：
  [{i, t0, t1, text, clauses: [{tx, t0, t1}]}]
从句时间 = 实测语音段；显示止点 = 下一从句起点（lishi 同规则，句间不留空窗）。
"""
import json, math, re
from pathlib import Path

D = Path(__file__).resolve().parent.parent
AUD = D / 'audio'

# 46 个从句（与 sceneFull.js buildSubs 的切分一致：按 ，。：；、？！ 切，去标点）
SENT_TEXTS = [
    '先问你个问题：妲己到底长什么样？',
    '三千年前的人，一个字都没写。',
    '不是没来得及写——先秦的记载里，提到她总共就两处。',
    '没长相，没出身，连她怎么死的都没写。',
    '你脑子里那个酒池肉林、炮烙之刑、狐狸精妲己的故事——其实是一个「攒」出来的故事。',
    '先说个更颠覆的：纣王的「纣」字，压根不是他的名字。',
    '他姓子，名受，商朝人叫他帝辛。',
    '「纣」，是周朝人打赢以后给他定的谥号，意思是「残义损善」——残害道义，损害善良。',
    '也就是说，我们骂了三千年的这个「纣王」，连名字都是他的敌人起的。',
    '赢了的人，给输了的人起名字。这事你品品。',
    '第一件事：真实的帝辛，强得离谱。',
    '《史记》里怎么写帝辛的？前半句八个字：资辨捷疾，闻见甚敏。',
    '反应快，口才好，脑子比身边所有大臣都好使，谁跟他辩论都辩不过。',
    '后半句更狠：材力过人，手格猛兽。',
    '赤手空拳，能跟野兽肉搏。',
    '这不是昏君的长相，这是雄主的长相。',
]

def clauses_of(text):
    return [p for p in re.split(r'[，。：；、？！]', text) if p.strip()]

# --- 解析 -30dB/d=0.12 静音（start + duration 对）→ 语音段 ---
sil = []
lines = [l.strip() for l in (AUD / 'sil_full.txt').read_text().splitlines() if l.strip()]
i = 0
while i < len(lines):
    if lines[i].startswith('silence_start'):
        s = float(lines[i].split(':')[1])
        d = 0.12
        if i + 1 < len(lines) and lines[i + 1].startswith('silence_duration'):
            d = float(lines[i + 1].split(':')[1])
        sil.append((s, s + d))
    i += 1
# 语音段 = 静音之间的空隙
segs = []
prev_end = 0.0
for s, e in sil:
    if s - prev_end >= 0.10:
        segs.append([prev_end, s])
    prev_end = max(prev_end, e)
segs = [(a, b) for a, b in segs if b - a >= 0.10]
print(f'语音段 {len(segs)} 个，前 5: {[(round(a,2), round(b,2)) for a, b in segs[:5]]}')

CL = []  # (句号, 从句文本, 字数)
for si, t in enumerate(SENT_TEXTS):
    for c in clauses_of(t):
        CL.append((si, c, len(c)))
N, M = len(CL), len(segs)
TOTAL_CHARS = sum(c[2] for c in CL)
print(f'从句 {N} 个 / {TOTAL_CHARS} 字')

def align(rate):
    INF = float('inf')
    # dp[i][j]：前 i 个从句用掉前 j 个语音段的最小代价；choice 记录第 i 个从句用的段区间
    dp = [[INF] * (M + 1) for _ in range(N + 1)]
    ch = [[0] * (M + 1) for _ in range(N + 1)]
    dp[0][0] = 0.0
    for i in range(1, N + 1):
        chars = CL[i - 1][2]
        exp = max(chars / rate, 0.22)
        for j in range(i, M + 1):
            best, bj = INF, -1
            # 第 i 个从句用段 a+1..j（a >= i-1）
            for a in range(i - 1, j):
                if dp[i - 1][a] == INF:
                    continue
                dur = segs[j - 1][1] - segs[a][0]
                cost = abs(math.log(max(dur, 0.15) / exp)) + 0.30 * (j - a - 1)
                # 段间大空隙（>1.2s）惩罚：从句不应横跨长停顿
                gap_pen = 0.0
                if j - a > 1:
                    for k in range(a, j - 1):
                        g = segs[k + 1][0] - segs[k][1]
                        if g > 1.0:
                            gap_pen += 1.5
                v = dp[i - 1][a] + cost + gap_pen
                if v < best:
                    best, bj = v, a
            dp[i][j] = best
            ch[i][j] = bj
    # 回溯（限制末端：后面的段留给后续台词）
    j = min(range(N, M + 1), key=lambda x: dp[N][x] + 0.05 * (x - N))
    spans = [None] * N
    for i in range(N, 0, -1):
        a = ch[i][j]
        spans[i - 1] = (segs[a][0], segs[j - 1][1])
        j = a
    return spans

rate = TOTAL_CHARS / 62.0  # 粗估：前 16 句约占 60-65s
for it in range(3):
    spans = align(rate)
    dur_used = spans[-1][1] - spans[0][0]
    rate2 = TOTAL_CHARS / dur_used
    print(f'迭代{it}: rate={rate:.2f} → 实际 {rate2:.2f} 字/s（末从句止 {spans[-1][1]:.2f}s）')
    if abs(rate2 - rate) < 0.02:
        break
    rate = rate2

out = []
idx = 0
for si, text in enumerate(SENT_TEXTS):
    cls = clauses_of(text)
    cs = []
    for k, c in enumerate(cls):
        a, b = spans[idx]
        idx += 1
        cs.append({'tx': c, 't0': round(a, 3), 't1': round(b, 3)})
    out.append({
        'i': si + 1,
        'text': text,
        't0': cs[0]['t0'],
        't1': cs[-1]['t1'],
        'clauses': cs,
    })
# 显示止点 = 下一从句起点（无空窗），末句 +0.5s 收尾
flat = [c for s in out for c in s['clauses']]
for k, c in enumerate(flat):
    c['disp_end'] = round(flat[k + 1]['t0'] if k + 1 < len(flat) else flat[k]['t1'] + 0.5, 3)

(AUD / 'sentences-aligned.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')

print('\n=== 从句级对齐结果 ===')
for s in out:
    print(f"s{s['i']:02d} {s['t0']:7.2f}-{s['t1']:7.2f}  {s['text'][:18]}")
    for c in s['clauses']:
        print(f"        {c['t0']:7.2f}-{c['t1']:7.2f}  {c['tx']}")
