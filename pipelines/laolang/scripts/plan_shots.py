#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""plan_shots.py — 按口播词级时间把 storyboard 的幕块切成 2.0–4.0 s 的镜头。

用法：
    python scripts/plan_shots.py projects/022_澳洲土著            # 打印统计 + 写 review/shotplan.*
    python scripts/plan_shots.py projects/022_澳洲土著 --target 2.8 --min 2.0 --max 4.0
    python scripts/plan_shots.py projects/022_澳洲土著 --check    # 只校验已有 shotplan.json

输入：
    <proj>/timeline.json      132 句 / 词级时间
    <proj>/storyboard.md      「逐镜画面」表：| Sxx | l1–l3 | ... |

输出：
    <proj>/review/shotplan.json
    <proj>/review/shotplan.md
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

MIN_DUR = 2.0
MAX_DUR = 4.0
TARGET = 2.8
SLACK = 0.12        # 幕块切不开时允许略微超长（避免硬造一个不在词界的切点）
CUT_WINDOW = 0.60   # 切点在理想位置附近的搜索半径
STRONG = 0         # 句首 / 长停顿后的词首
WEAK = 1           # 普通词首
PAUSE = 0.12        # ≥0.12 s 视为可切停顿


# ---------- 读 storyboard 幕块 ----------

def parse_storyboard(md_path):
    """返回 [{'scene':'S01','lines':[1],'raw':...}]，按表内顺序。"""
    text = md_path.read_text(encoding='utf-8')
    blocks = []
    row = re.compile(r'^\|\s*(S\d{2})\s*\|\s*l(\d+)(?:\s*[–\-—]\s*l(\d+))?\s*\|')
    for line in text.splitlines():
        m = row.match(line.strip())
        if not m:
            continue
        a = int(m.group(2))
        b = int(m.group(3)) if m.group(3) else a
        blocks.append({'scene': m.group(1), 'lines': list(range(a, b + 1))})
    return blocks


# ---------- 候选切点 ----------

PUNCT = '，。？！；、：'


def pauses(timeline, min_gap=PAUSE):
    """返回所有 ≥min_gap 的静音区间 [(start,end)]，切点落在其中也算合法。"""
    out = []
    for L in timeline['lines']:
        ws = [w for w in L['words'] if w['text'].strip() and w['text'].strip() not in PUNCT]
        for p, q in zip(ws, ws[1:]):
            if q['start'] - p['end'] >= min_gap:
                out.append((p['end'], q['start']))
    for p_line, q_line in zip(timeline['lines'], timeline['lines'][1:]):
        pw = [w for w in p_line['words'] if w['text'].strip() and w['text'].strip() not in PUNCT]
        qw = [w for w in q_line['words'] if w['text'].strip() and w['text'].strip() not in PUNCT]
        if pw and qw and qw[0]['start'] - pw[-1]['end'] >= min_gap:
            out.append((pw[-1]['end'], qw[0]['start']))
    return out


def in_pause(t, gaps, eps=1e-6):
    return any(g0 + eps < t < g1 - eps for g0, g1 in gaps)


def word_marks(timeline):
    """把整片词级时间摊平成带标记的候选点。

    返回 cand: {time: {'strength': 0/1, 'kind': 'line'|'pause'|'punct'|'word', 'line': id, 'text': str}}
    """
    cand = {}
    tails = {}
    lines = timeline['lines']
    for L in lines:
        words = [w for w in L['words'] if w['text'].strip() and w['text'].strip() not in PUNCT]
        raw = L['words']
        for j, w in enumerate(words):
            t = round(w['start'], 3)
            strength = WEAK
            kind = 'word'
            if j == 0:
                strength, kind = STRONG, 'line'
            else:
                gap = w['start'] - words[j - 1]['end']
                if gap >= PAUSE:
                    strength, kind = STRONG, 'pause'
            old = cand.get(t)
            if old is None or strength < old['strength']:
                cand[t] = {'strength': strength, 'kind': kind, 'line': L['id'], 'text': w['text']}

            # 词尾切点：后面紧跟标点，或下一个词离得 ≥0.12 s
            nxt = words[j + 1]['start'] if j + 1 < len(words) else 1e9
            had_punct = any(p['text'].strip() in PUNCT and w['end'] - 0.001 <= p['start'] <= nxt + 0.001
                            for p in raw)
            if nxt - w['end'] >= PAUSE or had_punct:
                e = round(w['end'], 3)
                if e not in cand and e > 0:
                    tails[e] = {'strength': STRONG, 'kind': 'punct', 'line': L['id'], 'text': w['text']}
    for t, v in tails.items():
        cand.setdefault(t, v)
    return cand


# ---------- 切分 ----------

def split_block(a, b, cand, target=TARGET):
    """在 [a,b) 内切出 n 段，返回切点列表（含 a、b）。"""
    length = b - a
    k_min = max(1, math.ceil(length / (MAX_DUR + SLACK) - 1e-9))
    k_max = max(k_min, math.floor(length / MIN_DUR + 1e-9))
    if k_max < k_min:
        k_max = k_min
    k = min(max(1, round(length / target)), k_max)
    k = max(k, k_min)
    if k <= 1:
        return [a, b]

    inner = sorted(t for t in cand if a + MIN_DUR < t < b - MIN_DUR)
    cuts = [a]
    last = a
    for j in range(1, k):
        ideal = a + length * j / k
        best = None
        for t in inner:
            if t <= last + MIN_DUR - 1e-6 or t >= b - MIN_DUR * (k - j) + 1e-6:
                continue
            score = abs(t - ideal) + (0.0 if cand[t]['strength'] == STRONG else 0.45)
            if best is None or score < best[0]:
                best = (score, t)
        if best is None:
            cuts.append(round(ideal, 3))
        else:
            cuts.append(best[1])
        last = cuts[-1]
    cuts.append(b)

    # 兜底：任何一段超出 4 s 就在段内再找一个强切点劈开
    out = [cuts[0]]
    for nxt in cuts[1:]:
        prev = out[-1]
        while nxt - prev > MAX_DUR + SLACK + 1e-6:
            mid = prev + (nxt - prev) / 2
            pool = [t for t in inner if prev + MIN_DUR < t < nxt - MIN_DUR]
            pick = min(pool, key=lambda t: abs(t - mid) + (0 if cand[t]['strength'] == STRONG else 0.45)) if pool else mid
            out.append(pick)
            prev = pick
        out.append(nxt)
    return out


def cut_kind(t, cand, gaps):
    t = round(t, 3)
    if t == 0.0:
        return 'film-start'
    if t in cand:
        return cand[t]['kind']
    if in_pause(t, gaps):
        return 'gap'
    return 'derived'


def build(proj, target=TARGET, min_dur=MIN_DUR, max_dur=MAX_DUR, fixed=()):
    timeline = json.loads((proj / 'timeline.json').read_text(encoding='utf-8'))
    lines = {L['id']: L for L in timeline['lines']}
    blocks = parse_storyboard(proj / 'storyboard.md')
    if not blocks:
        raise SystemExit('storyboard.md 里没找到「逐镜画面」表')
    cand = word_marks(timeline)
    gaps = pauses(timeline)

    # 幕块边界 = 每个幕第一句的起点；最后一块到片尾
    starts = []
    for blk in blocks:
        first = lines['l%d' % blk['lines'][0]]
        starts.append(round(first['start'], 3))
    if starts[0] > 0:
        starts[0] = 0.0
    ends = starts[1:] + [round(timeline['duration'], 3)]

    shots = []
    fixed = sorted(round(float(x), 3) for x in fixed)
    for blk, a, b in zip(blocks, starts, ends):
        if b <= a:
            continue
        # 已验收样片的切点作为硬边界保留，其余空间再按算法细分
        inner_fixed = [t for t in fixed if a + 1e-6 < t < b - 1e-6]
        seg_bounds = [a] + inner_fixed + [b]
        cuts = [a]
        for s0, s1 in zip(seg_bounds, seg_bounds[1:]):
            sub = split_block(s0, s1, cand, target)
            cuts.extend(sub[1:])
        for i, (s, e) in enumerate(zip(cuts, cuts[1:])):
            inside = [lid for lid in blk['lines']
                      if lines['l%d' % lid]['end'] > s + 1e-6 and lines['l%d' % lid]['start'] < e - 1e-6]
            text = ''.join(lines['l%d' % lid]['text'] for lid in inside)
            shots.append({
                'n': len(shots) + 1,
                'scene': blk['scene'],
                'scene_part': i + 1,
                'start': round(s, 3),
                'end': round(e, 3),
                'dur': round(e - s, 3),
                'cut': cut_kind(s, cand, gaps),
                'lines': inside,
                'text': text,
            })
    for s in shots:
        s['id'] = '%s.%d' % (s['scene'], s['scene_part'])
    return {'duration': round(timeline['duration'], 3), 'shots': shots,
            'params': {'target': target, 'min': min_dur, 'max': max_dur, 'fixed': fixed}}


# ---------- 校验 ----------

def check(plan, min_dur=MIN_DUR, max_dur=MAX_DUR, gaps=()):
    shots = plan['shots']
    problems = []
    if abs(shots[0]['start']) > 1e-6:
        problems.append('首镜不从 0 开始：%s' % shots[0]['start'])
    if abs(shots[-1]['end'] - plan['duration']) > 1e-6:
        problems.append('末镜不到片尾：%s != %s' % (shots[-1]['end'], plan['duration']))
    for p, q in zip(shots, shots[1:]):
        if abs(p['end'] - q['start']) > 1e-6:
            problems.append('间隙/重叠：%s 结束 %.3f，%s 开始 %.3f' % (p['id'], p['end'], q['id'], q['start']))
    for s in shots:
        if s['dur'] < min_dur - 1e-6 or s['dur'] > max_dur + SLACK + 1e-6:
            problems.append('时长越界：%s %.3f s' % (s['id'], s['dur']))
        if s['cut'] == 'derived':
            problems.append('切点不在词界、也不在 ≥%.2f s 停顿里：%s @ %.3f' % (PAUSE, s['id'], s['start']))
    return problems


# ---------- 输出 ----------

def write_md(plan, path):
    shots = plan['shots']
    out = ['# 全片分镜计划（自动生成）', '',
           '> `scripts/plan_shots.py` 从 `timeline.json` 词级时间 + `storyboard.md` 幕块表生成。',
           '> 每镜 %.1f–%.1f s，目标 %.1f s；切点全部取词首（句首 / 长停顿后优先）。' %
           (plan['params']['min'], plan['params']['max'], plan['params']['target']),
           '', '| 镜 | 幕镜 | 时间 (s) | 时长 | 切点 | 句 | 旁白 |', '|---|---|---|---|---|---|---|']
    for s in shots:
        out.append('| %d | %s | %.2f–%.2f | %.2f | %s | %s | %s |' % (
            s['n'], s['id'], s['start'], s['end'], s['dur'], s['cut'],
            ','.join('l%d' % x for x in s['lines']), s['text']))
    path.write_text('\n'.join(out) + '\n', encoding='utf-8')


def report(plan):
    shots = plan['shots']
    durs = [s['dur'] for s in shots]
    scenes = {}
    for s in shots:
        scenes.setdefault(s['scene'], []).append(s)
    print('总镜数 %d，总时长 %.2f s' % (len(shots), sum(durs)))
    print('时长: min %.2f / 中位 %.2f / max %.2f / 均值 %.2f' % (
        min(durs), sorted(durs)[len(durs) // 2], max(durs), sum(durs) / len(durs)))
    print('每幕镜数: ' + '  '.join('%s=%d' % (k, len(v)) for k, v in scenes.items()))
    kinds = {}
    for s in shots:
        kinds[s['cut']] = kinds.get(s['cut'], 0) + 1
    print('切点类型: ' + '  '.join('%s=%d' % kv for kv in sorted(kinds.items())))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('proj')
    ap.add_argument('--target', type=float, default=TARGET)
    ap.add_argument('--min', dest='min_dur', type=float, default=MIN_DUR)
    ap.add_argument('--max', dest='max_dur', type=float, default=MAX_DUR)
    ap.add_argument('--fixed', default='', help='硬切点（逗号分隔秒数），已验收样片的切点用这个保留')
    ap.add_argument('--check', action='store_true', help='只校验已有 shotplan.json')
    args = ap.parse_args()
    proj = Path(args.proj).resolve()
    review = proj / 'review'
    review.mkdir(exist_ok=True)
    jpath = review / 'shotplan.json'

    timeline = json.loads((proj / 'timeline.json').read_text(encoding='utf-8'))
    gaps = pauses(timeline)

    if args.check:
        plan = json.loads(jpath.read_text(encoding='utf-8'))
    else:
        fixed = [x for x in args.fixed.replace('，', ',').split(',') if x.strip()]
        plan = build(proj, args.target, args.min_dur, args.max_dur, fixed)
        jpath.write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding='utf-8')
        write_md(plan, review / 'shotplan.md')
    report(plan)
    problems = check(plan, args.min_dur, args.max_dur, gaps)
    if problems:
        print('\nFAIL %d 项：' % len(problems))
        for p in problems[:40]:
            print('  - ' + p)
        return 1
    print('\nPASS 覆盖完整、无间隙、时长全部在 %.1f–%.1f s、切点全在词界' % (args.min_dur, args.max_dur))
    return 0


if __name__ == '__main__':
    sys.exit(main())
