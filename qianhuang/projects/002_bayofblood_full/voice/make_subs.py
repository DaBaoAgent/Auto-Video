# -*- coding: utf-8 -*-
"""把配音.json 的十三段切成全片字幕（不删行），并输出镜头时间骨架。

  python voice/make_subs.py            # 写 subs.json + cues.js + shots.txt

切句只发生在标点上：先按句号/问号/叹号/分号断句，超过 15 字再按逗号断，
一个字都不删（"剪辑字幕不删行"）。时间按字数比例落在该自然段自己的时长里。
第 1 段（0–21.46 s）的 19 条字幕已在样片里定版，这里原样保留。
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SRC = r'D:\@kaifa\出稿\001_血之海滩\配音.json'

# 第 1 段：样片定版的 19 条（与 001_bayofblood/film.js 的 CUES 一致）
SEG1 = [
    (0.14, 1.55, '你看过《十三号星期五》吗'),
    (1.59, 2.21, '湖边营地'),
    (2.25, 3.19, '戴面具的杰森'),
    (3.23, 5.00, '一个接一个倒下的年轻人'),
    (5.04, 6.31, '多少人童年的阴影'),
    (6.35, 7.67, '但你不知道的是'),
    (7.71, 9.02, '这部片子是抄的'),
    (9.06, 10.01, '它抄的那部原版'),
    (10.05, 11.29, '是一部一九七一年的'),
    (11.33, 11.99, '意大利老片'),
    (12.03, 12.56, '《血之海滩》'),
    (12.60, 14.16, '铅黄名导马里奥·巴瓦'),
    (14.20, 14.69, '的名作'),
    (14.73, 15.89, '我为了做这一期'),
    (15.93, 17.27, '把这部老片翻出来'),
    (17.31, 18.30, '又盘了好几遍'),
    (18.34, 19.12, '越盘越觉得'),
    (19.16, 20.11, '后来的恐怖片'),
    (20.15, 21.42, '全都欠它一句谢谢'),
]

SENT_END = '。？！；'
DROP = '，。？！；：、…—「」“”‘’'


def pieces(text):
    """先断句，再断长句；返回去标点的块（不删字）。"""
    raw = [s for s in re.split('[。？！；]', text) if s.strip()]
    out = []
    for s in raw:
        s = s.strip()
        if len(re.sub('[' + DROP + ']', '', s)) <= 15:
            out.append(s)
            continue
        # 按逗号切，贪心塞到 15 字以内
        parts = [p for p in re.split('，', s) if p.strip()]
        buf = ''
        for p in parts:
            cand = (buf + '，' + p) if buf else p
            if buf and len(re.sub('[' + DROP + ']', '', cand)) > 15:
                out.append(buf)
                buf = p
            else:
                buf = cand
        if buf:
            out.append(buf)
    return out


def clean(s):
    return re.sub('[' + DROP + ']', '', s).strip()


def main():
    d = json.load(open(SRC, encoding='utf-8'))
    chunks = d['chunks']
    cues = list(SEG1)
    segs = [{'i': 1, 't0': 0.0, 't1': 21.46, 'cues': len(SEG1)}]

    for k, c in enumerate(chunks):
        if k == 0:
            continue
        ps = pieces(c['text'])
        nchar = sum(len(clean(p)) for p in ps) or 1
        start, dur = c['start'], c['duration']
        gap = 0.04
        acc = 0.0
        seg_first = None
        for i, p in enumerate(ps):
            share = len(clean(p)) / nchar * (dur - gap * (len(ps) - 1))
            t0 = start + acc
            t1 = t0 + share
            acc += share + gap
            if seg_first is None:
                seg_first = len(cues)
            cues.append((round(t0, 2), round(t1, 2), clean(p)))
        segs.append({'i': k + 1, 't0': round(start, 2), 't1': round(start + dur, 2),
                     'cues': len(cues) - seg_first})

    subs = [{'t0': a, 't1': b, 'text': x} for a, b, x in cues]
    json.dump(subs, open(os.path.join(PROJ, 'subs.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

    with open(os.path.join(HERE, 'cues.js'), 'w', encoding='utf-8') as f:
        f.write('const CUES = [\n')
        for a, b, x in cues:
            f.write("  [%.2f, %.2f, '%s'],\n" % (a, b, x))
        f.write('];\n')

    # 镜头骨架：每段按 3.2 s 一镜均分（第 1 段沿用样片定版的 10 镜）
    lines = []
    plan = []
    for s in segs:
        span = s['t1'] - s['t0']
        if s['i'] == 1:
            n = 10
            lines.append('# 段1 %d–%d：沿用样片 10 镜（0.00/2.25/4.35/6.42/8.45/10.60/12.80/15.00/17.30/19.40）'
                         % (s['i'], int(s['t1'])))
            plan.append({'i': 1, 'n': 10})
            continue
        n = max(2, int(round(span / 3.2)))
        cuts = [round(s['t0'] + span * i / n, 2) for i in range(n + 1)]
        lines.append('# 段%d  %.2f–%.2f  %d 镜' % (s['i'], s['t0'], s['t1'], n))
        for i in range(n):
            lines.append('  %.2f–%.2f  (%.2fs)' % (cuts[i], cuts[i + 1], cuts[i + 1] - cuts[i]))
        plan.append({'i': s['i'], 'n': n, 'cuts': cuts})
    open(os.path.join(HERE, 'shots.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

    print('字幕 %d 条，末条 %.2f–%.2f「%s」' % (len(subs), subs[-1]['t0'], subs[-1]['t1'], subs[-1]['text']))
    print('镜头 %d 个（10 + %d）' % (sum(p['n'] for p in plan), sum(p['n'] for p in plan) - 10))
    for s in segs:
        print('  段%-2d %6.2f–%6.2f  %5.2fs  %2d 字  %2d 条' %
              (s['i'], s['t0'], s['t1'], s['t1'] - s['t0'], 0, s['cues']))


if __name__ == '__main__':
    main()
