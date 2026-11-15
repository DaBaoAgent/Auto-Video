# -*- coding: utf-8 -*-
"""最终对齐（v2）：以 配音.json 的 11 个段落 chunk 为精确锚框，逐 chunk 内对齐从句。

chunk 边界已验证：全部落在实测语音停顿内（-30dB），且 chunk2 起首 0.36s 单段=「纣」字。
方法（lishi align_captions 同构）：
  - 段数 == 从句数 → 1:1
  - 段数 >  从句数 → DP（从句占 1..3 段，rate=chunk 净语音语速自校准）
  - 段数 <  从句数 → 从句按字数份额分组到段，组内按字数比例分段时间
产出：
  audio/clauses-final.json   全部从句 {tx,t0,t1,disp_end,chunk}
  场景锚点表（stdout）
"""
import json, math, re
from pathlib import Path

D = Path(__file__).resolve().parent.parent
AUD = D / 'audio'
PY = Path(r'D:/@kaifa/AutoJY/出稿/012_商纣王')

hz = lambda s: len([c for c in s if '\u4e00' <= c <= '\u9fff'])
clauses_of = lambda t: [p for p in re.split(r'[，。：；、？！]', t) if p.strip()]

meta = json.loads((PY / '配音.json').read_text(encoding='utf-8-sig'))
chunks = meta['chunks']

# --- 语音段（-30dB/d=0.12 主检测；>2.5s 连续段用 -40dB/d=0.08 内部细分）---
sil = []
lines = [l.strip() for l in (AUD / 'sil_full.txt').read_text().splitlines() if l.strip()]
i = 0
while i < len(lines):
    if lines[i].startswith('silence_start'):
        s = float(lines[i].split(':')[1]); d = 0.12
        if i + 1 < len(lines) and lines[i + 1].startswith('silence_duration'):
            d = float(lines[i + 1].split(':')[1])
        sil.append((s, s + d))
    i += 1
SEGS, prev = [], 0.0
for s, e in sil:
    if s - prev >= 0.10:
        SEGS.append((prev, s))
    prev = max(prev, e)
SEGS = [(a, b) for a, b in SEGS if b - a >= 0.10]

# 细分：-40dB 静音切长段
sil40 = []
lines = [l.strip() for l in (AUD / 'sil_40.txt').read_text().splitlines() if l.strip()]
i = 0
while i < len(lines):
    if i + 1 < len(lines):
        sil40.append((float(lines[i]), float(lines[i]) + float(lines[i + 1])))
    i += 2
refined = []
for a, b in SEGS:
    if b - a <= 2.5:
        refined.append((a, b)); continue
    cuts = [a] + [s for s, e in sil40 if a + 0.3 < s < b - 0.3 and e - s >= 0.08] + [b]
    for x, y in zip(cuts, cuts[1:]):
        if y - x >= 0.10:
            refined.append((x, y))
SEGS = refined

def segs_in(w0, w1):
    return [(max(a, w0), min(b, w1)) for a, b in SEGS if b > w0 + 0.02 and a < w1 - 0.02]

def dp_align(cls, segs, rate):
    """从句 → 1..3 段；rate 为本 chunk 校准语速"""
    m, n = len(cls), len(segs)
    INF = float('inf')
    dp = [[INF] * (n + 1) for _ in range(m + 1)]
    bk = [[0] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = 0.0
    for i in range(1, m + 1):
        exp = max(hz(cls[i - 1]) / rate, 0.18)
        for j in range(i, n + 1):
            for a in range(i - 1, j):
                if dp[i - 1][a] == INF: continue
                dur = segs[j - 1][1] - segs[a][0]
                cost = abs(math.log(max(dur, 0.15) / exp))
                ne = j - a - 1
                if ne:
                    gp = sum(2.5 for k in range(a, j - 1) if segs[k + 1][0] - segs[k][1] > 0.45)
                    cost += 0.5 * ne + gp
                v = dp[i - 1][a] + cost
                if v < dp[i][j]: dp[i][j] = v; bk[i][j] = a
    j = n
    spans = [None] * m
    for i in range(m, 0, -1):
        a = bk[i][j]; spans[i - 1] = (segs[a][0], segs[j - 1][1]); j = a
    return spans

def share_align(cls, segs):
    """从句多于段：按语音时长份额把从句分给各段，段内按字数比例分时间"""
    m, n = len(cls), len(segs)
    chars = [hz(c) for c in cls]
    tot = sum(chars) or 1
    voiced = [b - a for a, b in segs]
    vtot = sum(voiced) or 1
    assign = [[] for _ in range(n)]
    cumv, k, cum = 0.0, 0, 0
    for j in range(n):
        lo, hi = cumv, cumv + voiced[j]
        while k < m and cum / tot < hi / vtot:
            assign[j].append(k); cum += chars[k]; k += 1
        cumv = hi
    while k < m:
        assign[n - 1].append(k); k += 1
    spans = [None] * m
    for j in range(n):
        ks = assign[j]
        if not ks: continue
        a, b = segs[j]
        cs = sum(chars[x] for x in ks) or 1
        t = a
        for x in ks:
            d = (b - a) * chars[x] / cs
            spans[x] = (t, t + d); t += d
    return spans

all_clauses = []   # (chunk_idx, tx, t0, t1)
anchors = {}       # 名字 → t
for ci, ch in enumerate(chunks):
    w0, w1 = float(ch['start']), float(ch['start']) + float(ch['duration'])
    text = ch['text']
    cls = clauses_of(text)
    segs = segs_in(w0, w1)
    m, n = len(cls), len(segs)
    voiced = sum(b - a for a, b in segs)
    rate = (sum(hz(c) for c in cls) or 1) / max(voiced, 0.5)
    if m == n:
        spans = [(s[0], s[1]) for s in segs]
        method = '1:1'
    elif n > m:
        spans = dp_align(cls, segs, rate)
        method = f'DP {n}>{m}'
    else:
        spans = share_align(cls, segs)
        method = f'share {n}<{m}'
    for k, (c, (a, b)) in enumerate(zip(cls, spans)):
        all_clauses.append({'chunk': ci + 1, 'tx': c, 't0': round(a, 3), 't1': round(b, 3)})
    print(f'chunk{ci+1:02d} [{w0:6.2f}-{w1:6.2f}] {m}从句/{n}段 rate={rate:.2f} ({method})')

# 显示止点 = 下一从句起点（末条 +0.6）
for k, c in enumerate(all_clauses):
    c['disp_end'] = round(all_clauses[k + 1]['t0'] if k + 1 < len(all_clauses) else c['t1'] + 0.6, 3)
(AUD / 'clauses-final.json').write_text(json.dumps(all_clauses, ensure_ascii=False, indent=1), encoding='utf-8')

# --- 场景锚点 ---
def find(sub, after=0.0):
    for c in all_clauses:
        if c['t0'] >= after - 0.01 and (sub in c['tx'] or c['tx'] in sub):
            return c['t0']
    return None

A = {
 's2_start':  find('三千年前的人'),
 's3_start':  find('不是没来得及写'),
 's4_start':  find('没长相'),
 's5_start':  find('你脑子里那个酒池肉林'),
 's6_start':  find('先说个更颠覆的'),
 'zhou_start': find('纣王的纣字') or find('纣王的「纣」字'),
 'cha_start':  find('压根不是他的名字'),
 'dixin_start': find('商朝人叫他帝辛'),
 'shi_start':  find('是周朝人打赢以后'),
 'canyi_start': find('意思是残义损善') or find('意思是「残义损善」'),
 's9_start':  find('也就是说', after=20),
 's10_start': find('赢了的人'),
 's11_start': find('第一件事'),
 'shiji_start': find('史记里怎么写') or find('《史记》里怎么写'),
 'dongyi_start': find('他这辈子干的最大的一件事'),
 'zigu_start':  find('孔子有个学生叫子贡'),
 'shijian_start': find('你再顺着时间线看'),
 'wangbao_start': find('这像不像今天的网络暴力') or find('一个人被贴上坏人的标签'),
 'disan_start': find('第三件事'),
 'junshi_start': find('商朝灭亡的真正原因'),
 'zhuli_start': find('帝辛的主力部队'),
 'muye_start': find('牧野之战'),
 'shouwei_start': find('跟你有什么关系') ,
 'p_start':   203.64,
}
print('\n=== 场景锚点 ===')
for k, v in A.items():
    print(f'  {k:16s} {v}')

# 字幕区（chunk1-3）从句打印
print('\n=== 字幕从句（0-59.62） ===')
for c in all_clauses:
    if c['t0'] < 59.7:
        print(f"  {c['t0']:6.2f}-{c['disp_end']:6.2f}  [{c['chunk']}] {c['tx']}")
