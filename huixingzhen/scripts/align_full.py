#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""全片从句级对齐（两级 DP）：先按段落字数把 28 段钉到停顿上，再在段内按从句字数钉从句。
输入：口播稿 + silencedetect；输出：cues_full.json"""
import re, json, os

P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT = r'D:/@kaifa/Auto-Video/出稿/羽人/口播稿_定稿.txt'
SIL = os.path.join(P, 'out', 'silence_full.txt')
OUT = os.path.join(P, 'cues_full.json')
TOTAL = 597.34


def parse():
    txt = open(TXT, encoding='utf-8').read()
    paras = [p.strip() for p in txt.split('\n') if p.strip()]
    out = []
    for i, p in enumerate(paras):
        cs = [{'p': i, 'text': s.strip()} for s in re.split(r'[，。；：、？！]', p) if s.strip()]
        out.append(cs)
    return paras, out


def pauses():
    ev = []
    for line in open(SIL, encoding='utf-8'):
        m = re.search(r'silence_(start|end):\s*([\d.]+)', line)
        if m:
            ev.append((m.group(1), float(m.group(2))))
    out, st = [], None
    for k, v in ev:
        if k == 'start':
            st = v
        elif st is not None:
            out.append((st, v))
            st = None
    return out


def dp_align(units, T, lo, hi, rate, minspan=None, maxgap=6):
    """units: 字数列表；T: 全局边界数组；在 [lo,hi] 槽区间内单调对齐。返回每 unit 的 (a,b) 槽下标。
    minspan[i]：第 i 个 unit 至少占多少槽（段落级用它保证"槽数≥从句数"）。"""
    idx = list(range(lo, hi + 1))
    n, m = len(units), len(idx) - 1
    INF = float('inf')
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    bk = [[0] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for i in range(1, n + 1):
        exp = rate * units[i - 1]
        for b in range(i, m + 1):
            best, arg = INF, -1
            g0 = minspan[i - 1] if minspan else 1
            for g in range(g0, min(maxgap, b) + 1):
                a = b - g
                if a < i - 1 or dp[i - 1][a] == INF:
                    continue
                dur = T[idx[b]] - T[idx[a]]
                r = dur / exp
                c = (r - 1) ** 2 + 0.004 * (g - 1)
                if r < 0.70:                       # 语速不允许被压到 0.7 倍以下
                    c += 60.0 * (0.70 - r) ** 2
                if r > 1.85:
                    c += 30.0 * (r - 1.85) ** 2
                if dp[i - 1][a] + c < best:
                    best, arg = dp[i - 1][a] + c, a
            dp[i][b] = best
            bk[i][b] = arg
    b = min(range(n, m + 1), key=lambda x: dp[n][x])
    spans = [None] * n
    for i in range(n, 0, -1):
        a = bk[i][b]
        spans[i - 1] = (idx[a], idx[b])
        b = a
    return spans


def main():
    paras, pcs = parse()
    ps = pauses()
    T = [0.0] + [(a + b) / 2 for a, b in ps] + [TOTAL]
    nslot = len(T) - 1
    rate = TOTAL / sum(len(c['text']) for cs in pcs for c in cs)

    plens = [sum(len(c['text']) for c in cs) for cs in pcs]
    pmin = [len(cs) for cs in pcs]                  # 每段至少占"从句数"个槽，保证段内可对齐
    pspans = dp_align(plens, T, 0, nslot, rate, minspan=pmin, maxgap=60)

    out = []
    for i, cs in enumerate(pcs):
        a, b = pspans[i]
        sub = [len(c['text']) for c in cs]
        spans = dp_align(sub, T, a, b, (T[b] - T[a]) / sum(sub))
        for c, (sa, sb) in zip(cs, spans):
            out.append({'p': i, 'text': c['text'], 't0': round(T[sa], 2), 't1': round(T[sb], 2)})

    bad = [o for o in out if o['t1'] - o['t0'] < 0.4]
    json.dump({'fps': 30, 'duration': TOTAL, 'clauses': out},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('从句', len(out), '段落', len(paras), '停顿', len(ps), '异常短句', len(bad))
    for o in bad[:6]:
        print('  !', o['text'][:16], round(o['t1'] - o['t0'], 2))
    for i in range(0, len(paras), 7):
        cs = [o for o in out if o['p'] == i]
        print(f"P{i:02d} {cs[0]['t0']:7.2f}-{cs[-1]['t1']:7.2f}  {cs[0]['text'][:22]}")


if __name__ == '__main__':
    main()
