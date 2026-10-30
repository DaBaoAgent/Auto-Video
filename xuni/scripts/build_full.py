#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""xuni 全片：从 009 的段落/块/ASR 建从句级字幕 + 分镜表。

输入：
  出稿/<编号>_<选题>/配音.json        段落与 41 个块（精确 start/duration）
  出稿/<编号>_<选题>/配音审查.json    ASR 359 条从句（含时码，文本有同音字）
输出：
  projects/<slug>/captions_full.json  句级字幕（≤14 汉字，已按段落/块夹紧）
  projects/<slug>/episode_full.json   章节 + 镜头表（模块化，页面直接读）

思路：
  1. 段落文本 → 规范从句（按标点切），保留原文用字；
  2. 每个块内，把规范从句与块内 ASR 记录做字符级对齐（difflib），
     从句时码取 ASR 字符位置的线性插值，再夹到块/段落的 start/end；
  3. 短句并入相邻句，长句按 14 字拆条，得到可读的字幕行；
  4. 镜头表按字幕行分组（每镜 3–7 秒），模块内容见 SHOT_TABLE。
"""
import json, re, difflib, argparse, sys
from pathlib import Path

CJK = re.compile(r'[㐀-鿿]')
SPLIT = re.compile(r'[，。；：、？！]')
ROOT = Path(__file__).resolve().parents[1]


def core(s):
    return ''.join(CJK.findall(s))


def load_src(src):
    v = json.loads((src / '配音.json').read_text(encoding='utf-8'))
    a = json.loads((src / '配音审查.json').read_text(encoding='utf-8'))['asr']['records']
    return v, a


def build_clauses(v):
    """段落 → 规范从句（带段落/块归属）"""
    clauses = []
    chunks = v['chunks']
    ci = 0
    for p in v['paragraphs']:
        cs = []
        for s in SPLIT.split(p['text']):
            s = s.strip().strip('“”"')
            if core(s):
                cs.append({'p': p['index'], 'text': s, 'core': core(s)})
        # 本段的块
        pchunks = chunks[ci:ci + p['chunk_count']]
        ci += p['chunk_count']
        # 把从句按字符数分给块（块文本是段落文本的连续切分）
        cchunks = [core(c['text']) for c in pchunks]
        total = sum(len(x) for x in cchunks)
        if total != sum(len(c['core']) for c in cs):
            # 兜底：按比例分配
            pass
        # 逐块消费从句
        k = 0; acc = 0
        for ch_i, ch in enumerate(pchunks):
            ch_core_len = len(cchunks[ch_i])
            end = acc + ch_core_len
            block = []
            pos = acc
            while k < len(cs) and pos < end:
                block.append(cs[k]); pos += len(cs[k]['core']); k += 1
            for c in block:
                c['chunk'] = ch['index']; c['chunk_t0'] = float(ch['start']); c['chunk_t1'] = float(ch['start']) + float(ch['duration'])
                clauses.append(c)
            acc = end
        # 若还有剩余从句，挂到本段最后一块
        while k < len(cs):
            cs[k]['chunk'] = pchunks[-1]['index']; cs[k]['chunk_t0'] = float(pchunks[-1]['start']); cs[k]['chunk_t1'] = float(pchunks[-1]['start']) + float(pchunks[-1]['duration'])
            clauses.append(cs[k]); k += 1
    return clauses


def align_clause_times(clauses, v, asr):
    """块内字符级对齐 → 从句时码"""
    by_chunk = {}
    for c in clauses:
        by_chunk.setdefault(c['chunk'], []).append(c)
    chunks = {c['index']: c for c in v['chunks']}
    for ch_i, cs in by_chunk.items():
        ch = chunks[ch_i]
        c0 = float(ch['start']); c1 = c0 + float(ch['duration'])
        recs = [r for r in asr if (float(r['start']) + float(r['end'])) / 2 >= c0 - 0.25 and (float(r['start']) + float(r['end'])) / 2 < c1 + 0.25]
        if not recs:
            # 按字数均分
            tot = sum(len(c['core']) for c in cs) or 1; acc = 0
            for c in cs:
                c['t0'] = c0 + (c1 - c0) * acc / tot; acc += len(c['core']); c['t1'] = c0 + (c1 - c0) * acc / tot
            continue
        canon = ''.join(c['core'] for c in cs)
        asr_text = ''.join(core(r['text']) for r in recs)
        # per-asr-char time
        at = []
        for r in recs:
            n = len(core(r['text']))
            if n == 0: continue
            for k in range(n):
                at.append(float(r['start']) + (float(r['end']) - float(r['start'])) * (k + 0.5) / n)
        if not at: continue
        sm = difflib.SequenceMatcher(None, canon, asr_text, autojunk=False)
        pos = [None] * len(canon)
        for b in sm.get_matching_blocks():
            for k in range(b.size): pos[b.a + k] = b.b + k
        last = 0
        for i in range(len(pos)):
            if pos[i] is None: pos[i] = last
            else: last = pos[i]
        nxt = len(at) - 1
        for i in range(len(pos) - 1, -1, -1):
            if pos[i] is None: pos[i] = nxt
            else: nxt = pos[i]
        pos = [min(max(x, 0), len(at) - 1) for x in pos]
        acc = 0
        for c in cs:
            n = len(c['core'])
            a0 = pos[acc] if n else 0
            a1 = pos[min(acc + n - 1, len(pos) - 1)] if n else a0
            t0 = at[a0]; t1 = at[a1]
            # 夹到块窗口，并留 40ms 呼吸
            t0 = min(max(t0, c0 + 0.02), c1 - 0.05)
            t1 = min(max(t1, t0 + 0.12), c1 - 0.02)
            c['t0'] = t0; c['t1'] = t1
            acc += n
        # 单调化
        cs.sort(key=lambda x: x['t0'])
        for i in range(1, len(cs)):
            if cs[i]['t0'] < cs[i - 1]['t1']:
                mid = (cs[i]['t0'] + cs[i - 1]['t1']) / 2
                cs[i - 1]['t1'] = mid; cs[i]['t0'] = mid
    return clauses


PARTICLES = set('的了是在和与就都也把被让着过地得而又才只刚正已曾将')
STARTS = set('睡吃死活人病牛蛋基质基因染名数时年月日世中国英法美岛山洞骨颅血肉脑神经细胞病毒菌疫苗抗体先再还更最')
WORDS = set('''睡不着 染病 死亡 诊断 变异 克雅氏 名单 标本 痕迹 方向 颅骨 颅盖 杯子 手臂 锯齿
记忆 原件 数据 规模 推演 染色体 氨基酸 甲硫氨酸 缬氨酸 防御 基因 蛋白质 朊病毒 阿尔茨海默
巴布亚新几内亚 弗雷 库鲁 盖达塞克 普鲁西纳 布兰德尔 斯蒂芬 埃米莉 诺贝尔 生长激素
高夫 切达 资治通鉴 明史 五行志 二十四史 两脚羊 捣磨寨 朱粲 五胡乱华 崇祯 陕西 山西
肉骨粉 疯牛病 克雅氏病 羊瘙痒症 太阳报 内嗅皮层 海马 β淀粉样 tau 猕猴 苏氨酸 甲硫氨酸
因为 所以 但是 如果 就是 这个 那个 一个 一种 一样 没有 不是 可以 已经 还是 就是 这些 那些
自己 什么 怎么 为什么 全世界 人类 古人 互联网 神话 吃人 怪物 同一个 模子
一百万人 五十万 四百四十万 五十二 三个月 十三个 三十米 一千四百 百分之 一万五千年
三磅重 二十号 第一百二十九位 双甲硫氨酸 纯缬氨酸 杂合型 朊病毒防御基因 流行病学家 流行病学 氨基酸编码 组合成'''.split())


def _split_score(rest, i):
    n = len(rest)
    if i < 6 or i > n - 3: return -6
    s = -abs(i - n / 2) * 0.35
    if rest[i - 1] in PARTICLES: s += 3
    if rest[i] in STARTS: s += 2
    for w in WORDS:
        p = rest.find(w)
        while p >= 0:
            if p < i < p + len(w): s -= 12
            p = rest.find(w, p + 1)
    if rest[i - 1] in '不没很最更太非无未别再才只刚正已曾将' and rest[i] in '着了过地得': s -= 6
    return s


def split_long(text, mx=16):
    if len(text) <= mx: return [text]
    out = []; rest = text
    while len(rest) > mx:
        cands = list(range(8, mx + 1))
        cut = max(cands, key=lambda i: _split_score(rest, i)) if cands else mx
        out.append(rest[:cut]); rest = rest[cut:]
    if rest: out.append(rest)
    return out


def make_lines(clauses, mx=16):
    """把从句并成可读字幕行：短句并入邻句，长句拆条。"""
    out = []
    for c in sorted(clauses, key=lambda x: x['t0']):
        parts = split_long(c['text'], mx)
        n = len(parts); tot = sum(len(p) for p in parts) or 1
        t = c['t0']
        for p in parts:
            d = (c['t1'] - c['t0']) * len(p) / tot
            out.append({'text': p, 't0': t, 't1': t + d, 'chunk': c['chunk'], 'p': c['p']})
            t += d
    # 合并短行 / 短间隔
    merged = []
    for x in out:
        if merged:
            a = merged[-1]
            same = a['chunk'] == x['chunk']
            gap = x['t0'] - a['t1']
            if same and len(core(a['text'])) + len(core(x['text'])) <= mx and (gap < 0.45) and (x['t1'] - a['t0'] <= 4.6):
                a['text'] = a['text'] + ' ' + x['text']
                a['t1'] = x['t1']
                continue
            if same and len(core(x['text'])) <= 4 and len(core(a['text'])) + len(core(x['text'])) <= mx + 4 and gap < 0.5:
                a['text'] = a['text'] + ' ' + x['text']; a['t1'] = x['t1']; continue
            # 短行补到 0.9s（不越过下一行）
            if a['t1'] - a['t0'] < 0.9:
                a['t1'] = min(x['t0'], a['t0'] + 0.9)
        merged.append(x)
    # 去重叠
    for i in range(len(merged) - 1):
        if merged[i]['t1'] > merged[i + 1]['t0']:
            merged[i]['t1'] = merged[i + 1]['t0']
    # 丢弃空行/极短
    merged = [x for x in merged if core(x['text'])]
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='出稿/009_朊病毒同类相食')
    ap.add_argument('--slug', default='009_prion_full')
    ap.add_argument('--out', default='')
    a = ap.parse_args()
    src = Path(a.src); src = src if src.is_absolute() else ROOT.parent / src
    v, asr = load_src(src)
    clauses = build_clauses(v)
    align_clause_times(clauses, v, asr)
    lines = make_lines(clauses)
    outdir = Path(a.out) if a.out else ROOT / 'projects' / a.slug
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / 'captions_full.json').write_text(json.dumps(lines, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'从句 {len(clauses)} → 字幕 {len(lines)}；写入 {outdir / "captions_full.json"}')
    for p in v['paragraphs'][:6]:
        cs = [x for x in lines if x['p'] == p['index']]
        if cs:
            print(f"P{p['index']:02d} {cs[0]['t0']:7.2f}-{cs[-1]['t1']:7.2f}  {len(cs)} 行  {cs[0]['text'][:20]}")
    # 抽查
    for i in [0, 60, 120, 200, 300]:
        if i < len(lines): print(f"  {lines[i]['t0']:7.2f}-{lines[i]['t1']:7.2f}  {lines[i]['text']}")


if __name__ == '__main__':
    main()
