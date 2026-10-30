#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""009 全片分镜表：章节 + 64 镜。时间与 captions_full.json 同源。"""
import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parents[1]
PROJ = ROOT / 'projects' / '009_prion_full'

CHAPTERS = [
    (1, 0.00, 22.82, '钩子', '全世界的僵尸，同一个模子', 'magenta'),
    (2, 22.82, 37.98, '死亡名单', '五十万与一百七十八', 'cyan'),
    (3, 37.98, 78.17, '阑尾', '被切下来的三万二千四百四十一个', 'acid'),
    (4, 78.17, 139.06, '会笑的病', '库鲁与弗雷人', 'magenta'),
    (5, 139.06, 188.21, '人相食', '写进正史的三个字', 'yellow'),
    (6, 188.21, 235.65, '头骨杯', '一万五千年前的仪式', 'cyan'),
    (7, 235.65, 280.17, '蛋白质', '一个被学术界开除的人', 'magenta'),
    (8, 280.17, 353.18, '牛吃牛', '疯牛病的起点', 'acid'),
    (9, 353.18, 399.36, '一滑', '几十个病毒进血', 'yellow'),
    (10, 399.36, 443.93, '五十万年', '刻进基因的铠甲', 'cyan'),
    (11, 443.93, 501.67, '还没完', '二零二四年的雷', 'magenta'),
    (12, 501.67, 534.50, '尾声', '你脑子里那场战争', 'acid'),
]

MYTHS4 = [
    {'i': '01', 'cn': '僵尸', 'en': 'JIANG SHI', 'where': '中国', 'tag': 'CN'},
    {'i': '02', 'cn': '吸血鬼', 'en': 'VAMPIRE', 'where': '欧洲', 'tag': 'EU'},
    {'i': '03', 'cn': '食尸鬼', 'en': 'GHOUL', 'where': '阿拉伯', 'tag': 'AR'},
    {'i': '04', 'cn': '活死人', 'en': 'UNDEAD', 'where': '非洲', 'tag': 'AF'},
]
MYTHS3 = MYTHS4[:3]


def S(t0, t1, ch, mod, **kw):
    d = {'t0': t0, 't1': t1, 'ch': ch, 'mod': mod}
    d.update(kw)
    return d


SHOTS = [
    # ---------------- CH1 钩子 0–22.82
    S(0.00, 7.70, 1, 'myth', title='同一个模子', sub='SAME TEMPLATE', myths=MYTHS4),
    S(7.70, 12.90, 1, 'merge', title='同一个模子', sub='SAME TEMPLATE // SAME SOURCE'),
    S(12.90, 16.46, 1, 'skull', top='活人 吃 死人', bottom='死人 吃 活人', sub='THE LIVING EAT THE DEAD'),
    S(16.46, 21.10, 1, 'dna', title='基因记忆', sub='GENETIC MEMORY', labels=[{'text': 'CHR 20 · LOCUS 129', 'x': 1430, 'y': 300}]),
    S(21.10, 22.82, 1, 'title', title='记忆的原件', sub='THE ORIGINAL'),

    # ---------------- CH2 死亡名单 22.82–37.98
    S(22.82, 28.61, 2, 'stat', title='PROJECTION', stats=[{'v': '500,000–1,000,000', 'label': '预测死亡', 'sub': '1990s UK'}], foot='BSE // PROJECTED CASES'),
    S(28.61, 34.82, 2, 'stat', title='ACTUAL', stats=[{'v': '178', 'label': '实际确诊死亡', 'sub': 'vCJD'}], foot='REDACTED // CONFIRMED'),
    S(34.82, 37.98, 2, 'compare', title='剩下的人，怎么没事？', left={'h': '预测', 'v': '500,000+', 't': '按传播规模'}, right={'h': '实际', 'v': '178', 't': '确诊死亡'}),

    # ---------------- CH3 阑尾 37.98–78.17
    S(37.98, 43.10, 3, 'person', name='布兰德尔', role='UCL 流行病学教授', years='2000–2012', quote='阑尾，一个所有人都觉得没用的东西'),
    S(43.10, 49.82, 3, 'stat', title='APPENDIX ARCHIVE', stats=[{'v': '32,441', 'label': '阑尾样本', 'sub': '41 家医院'}, {'v': '2000–2012', 'label': '取样年份', 'sub': '全英国'}], foot='EVERY ONE, TESTED'),
    S(49.82, 54.48, 3, 'stat', title='CARRIER RATE', stats=[{'v': '1 / 2,000', 'label': '携带者', 'sub': '却活得好好的'}], foot='ASymptomatic'),
    S(54.48, 59.67, 3, 'dna', title='第二十号染色体', sub='CHR 20 · LOCUS 129', labels=[{'text': '第一百二十九位', 'x': 1430, 'y': 300}]),
    S(59.67, 69.88, 3, 'dna', title='三种人', sub='METHIONINE / VALINE', genotypes=[{'k': 'MM', 't': '快速死亡', 'c': '#FF2E88'}, {'k': 'MV', 't': '潜伏几十年', 'c': '#FFD34D'}, {'k': 'VV', 't': '一辈子没事', 'c': '#21E6FF'}]),
    S(69.88, 75.53, 3, 'stat', title='PRION DEFENSE GENE', stats=[{'v': '13%', 'label': '纯缬氨酸型', 'sub': '全球比例'}], foot='PURE RESISTANCE'),
    S(75.53, 78.17, 3, 'title', title='这套铠甲', sub='到底在防什么？'),

    # ---------------- CH4 会笑的病 78.17–139.06
    S(78.17, 90.00, 4, 'map', title='巴布亚新几内亚', sub='1950s · 弗雷部落', pins=[{'label': 'NEW GUINEA', 'x': 0.62, 'y': 0.42}, {'label': 'FORE', 'x': 0.58, 'y': 0.48}]),
    S(90.00, 99.30, 4, 'skull', top='库鲁', bottom='控制不住地笑', sub='KURU // 因害怕而颤抖'),
    S(99.30, 108.00, 4, 'skull', top='分食亲人', bottom='脑髓归妇女和孩子', sub='FUNERAL // 让灵魂活在心里'),
    S(108.00, 117.56, 4, 'skull', top='妇女儿童', bottom='发病率最高', sub='严丝合缝'),
    S(117.56, 128.00, 4, 'person', name='盖达塞克', role='美国医生', years='1976 诺贝尔奖', quote='把病死弗雷人的脑组织，注射进黑猩猩的脑子'),
    S(128.00, 139.06, 4, 'title', title='传了多少代？', sub='THE QUESTION NO ONE DARED ASK'),

    # ---------------- CH5 人相食 139.06–188.21
    S(139.06, 150.00, 5, 'window', skin='history', wtitle='二十四史 // 检索', rows=[{'k': '资治通鉴', 'v': '人相食'}, {'k': '明史', 'v': '人相食'}, {'k': '……', 'v': '人相食'}], stamp='3 字'),
    S(150.00, 160.77, 5, 'window', skin='history', wtitle='唐 · 朱粲 // 五胡', rows=[{'k': '捣磨寨', 'v': '人当军粮'}, {'k': '两脚羊', 'v': '掳来的女子'}, {'k': '夜', 'v': '糟蹋'}, {'k': '日', 'v': '宰杀'}], stamp='两脚羊'),
    S(160.77, 168.15, 5, 'window', skin='history', wtitle='明史 · 五行志', rows=[{'k': '崇祯', 'v': '陕西 / 山西大旱'}, {'k': '交换', 'v': '吃自己的孩子'}], stamp='白纸黑字'),
    S(168.15, 178.00, 5, 'stat', title='NOT A JOKE', stats=[{'v': '24', 'label': '部正史', 'sub': '反复出现'}, {'v': '0', 'label': '例外', 'sub': '每一个崩盘的王朝'}], foot='WRITTEN INTO HISTORY'),
    S(178.00, 188.21, 5, 'title', title='更早的铁证', sub='一万五千年前的英国山洞'),

    # ---------------- CH6 头骨杯 188.21–235.65
    S(188.21, 197.96, 6, 'map', title='切达峡谷 · 高夫洞穴', sub='GOUGH\'S CAVE // 2017', pins=[{'label': 'CHEDDAR', 'x': 0.44, 'y': 0.40}, {'label': 'GOUGH\'S', 'x': 0.50, 'y': 0.47}]),
    S(197.96, 206.86, 6, 'stat', title='CUT MARKS', stats=[{'v': '600+', 'label': '人骨标本', 'sub': '成人 / 孩子'}, {'v': '65%', 'label': '带刀砍痕', 'sub': '和宰牛羊一样'}], foot='BUTCHERED'),
    S(206.86, 214.44, 6, 'skull', top='颅骨杯', bottom='手臂骨上的锯齿纹', sub='SKULL CUPS // 15000 BP'),
    S(214.44, 224.00, 6, 'compare', title='这不是饥饿', left={'h': '饿疯了', 'v': '不会', 't': '磨杯子 / 雕花'}, right={'h': '仪式', 'v': '才会', 't': '同一件事'}),
    S(224.00, 235.65, 6, 'map', title='同一条河', sub='15000 年 / 半个地球', pins=[{'label': 'BRITAIN', 'x': 0.35, 'y': 0.38}, {'label': 'NEW GUINEA', 'x': 0.66, 'y': 0.55}, {'label': 'CHINA', 'x': 0.72, 'y': 0.34}]),

    # ---------------- CH7 蛋白质 235.65–280.17
    S(235.65, 246.00, 7, 'person', name='普鲁西纳', role='加州大学助理教授', years='1970s', quote='不是病毒，不是细菌，是一种蛋白质在传染'),
    S(246.00, 255.50, 7, 'protein', title='没有 DNA', sub='没有 RNA —— 一个蛋白质，像活物一样复制', state='normal'),
    S(255.50, 266.00, 7, 'protein', title='错误折叠', sub='像过冷水，碰一下就整杯结冰', state='seed'),
    S(266.00, 276.24, 7, 'stat', title='PRUSINER', stats=[{'v': '1997', 'label': '诺贝尔奖', 'sub': '被解雇 / 经费被砍'}], foot='THE PROTEIN THAT REPLICATES'),
    S(276.24, 280.17, 7, 'title', title='人类自己喂出来的', sub='THE DISASTER WE FED'),

    # ---------------- CH8 牛吃牛 280.17–353.18
    S(280.17, 290.00, 8, 'cows', title='133 号母牛', sub='1984 / 温顺的牛突然撞人、瘫软、抽搐', mode='origin'),
    S(290.00, 302.38, 8, 'cows', title='客厅里的蛋糕', sub='肉骨粉：把死掉的牛羊磨碎，喂给活着的牛', mode='loop'),
    S(302.38, 312.33, 8, 'cows', title='牛吃牛', sub='一磅半的汉堡，送进英国学校食堂', mode='burger'),
    S(312.33, 322.00, 8, 'person', name='斯蒂芬', role='19 岁英国男孩', years='1995', quote='大脑里的空洞，像一朵朵向日葵'),
    S(322.00, 331.19, 8, 'stat', title='CULL', stats=[{'v': '4,400,000', 'label': '扑杀牛', 'sub': '英国政府承认'}, {'v': '1995', 'label': '承认年份', 'sub': ''}], foot='FOUR POINT FOUR MILLION'),
    S(331.19, 342.00, 8, 'cows', title='十三座空军基地', sub='三十米高的骨粉沙丘，露着没磨干净的牙', mode='ash'),
    S(342.00, 353.18, 8, 'timeline', title='烧到二零零八年', events=[{'t': '1984', 'label': '133 号母牛'}, {'t': '1995', 'label': '斯蒂芬'}, {'t': '2008', 'label': '清完'}]),

    # ---------------- CH9 一滑 353.18–399.36
    S(353.18, 364.00, 9, 'person', name='埃米莉', role='24 岁研究员', years='2010', quote='镊子一滑，穿透两层手套，在拇指上轻轻扎了一下'),
    S(364.00, 375.64, 9, 'protein', title='七年半', sub='左侧身体麻木、失控，三十三岁死去', state='misfold'),
    S(375.64, 378.36, 9, 'stat', title='NO CURE', stats=[{'v': '100%', 'label': '死亡', 'sub': '几十个病毒进血'}], foot='A FEW PRIONS'),
    S(378.36, 389.00, 9, 'compare', title='同样的病毒，不同的结局', left={'h': '52 年', 'v': '潜伏', 't': '生长激素'}, right={'h': '1 个月', 'v': '暴毙', 't': '另一种人'}),
    S(389.00, 399.36, 9, 'dna', title='五十万年', sub='选择压力不是几百年，是五十万年', labels=[{'text': 'THREE GENOTYPES', 'x': 1430, 'y': 300}]),

    # ---------------- CH10 五十万年 399.36–443.93
    S(399.36, 410.00, 10, 'map', title='非洲草原', sub='50 万年前 · 没有农业，没有冰箱', pins=[{'label': 'AFRICA', 'x': 0.55, 'y': 0.52}]),
    S(410.00, 420.48, 10, 'cave', title='人骨上的砍痕', sub='和猎物骨头一模一样', mode='bones'),
    S(420.48, 424.39, 10, 'dna', title='铠甲', sub='一代一代，刻进大多数人的基因组'),
    S(424.39, 434.00, 10, 'myth', title='不是想象力', sub='僵尸 / 吸血鬼 / 活死人', myths=MYTHS3),
    S(434.00, 443.93, 10, 'title', title='活下来的那一批', sub='WE ARE THE ONES WHO SURVIVED'),

    # ---------------- CH11 还没完 443.93–501.67
    S(443.93, 453.00, 11, 'window', skin='news', wtitle='BBC // 2024', rows=[{'k': '5 个病人', 'v': '早老性痴呆'}, {'k': '生长激素', 'v': '尸体提取'}, {'k': 'β淀粉样蛋白', 'v': '人传人'}], stamp='2024'),
    S(453.00, 462.26, 11, 'brain', title='β淀粉样蛋白', sub='第一次被证明：能像朊病毒一样人传人', spread=0.35),
    S(462.26, 473.32, 11, 'brain', title='tau 蛋白', sub='注射进猕猴内嗅皮层，18 个月扩散到海马', spread=0.75),
    S(473.32, 483.00, 11, 'protein', title='同一类折叠错误', sub='牛 / 鹿 / 弗雷人 / 阿尔茨海默', state='seed'),
    S(483.00, 489.80, 11, 'brain', title='三磅重的脑壳', sub='你的细胞每天都在清理', spread=1.0),
    S(489.80, 501.67, 11, 'title', title='预装五十万年的杀毒软件', sub='那两个缬氨酸'),

    # ---------------- CH12 尾声 501.67–534.50
    S(501.67, 512.00, 12, 'window', skin='blood', wtitle='献血规定 // 永久', rows=[{'k': '1980–1996', 'v': '在英国待过 3 个月'}, {'k': '永久', 'v': '不能献血'}, {'k': '检测', 'v': '查不出来'}], stamp='NO TEST'),
    S(512.00, 522.95, 12, 'stat', title='THE NEXT FOLD', stats=[{'v': '50 年', 'label': '留下的防线', 'sub': '顶不顶得住？'}, {'v': '?', 'label': '没人敢打包票', 'sub': ''}], foot='NO GUARANTEE'),
    S(522.95, 529.39, 12, 'title', title='今天还在打', sub='你是唯一还站着的那一个'),
    S(529.39, 531.50, 12, 'end', title='我是艾伦', sub='遛狗去了，白了个白。'),
    S(531.50, 534.50, 12, 'end', title='朊病毒 · 同类相食', sub='EP.009 // XUNI // SYNTHWAVE'),
]


def main():
    caps = json.loads((PROJ / 'captions_full.json').read_text(encoding='utf-8'))
    # validate coverage
    shots = sorted(SHOTS, key=lambda x: x['t0'])
    # snap interior cuts to caption boundaries so no line straddles a visual cut
    for i in range(len(shots) - 1):
        b = shots[i]['t1']
        for c in caps:
            if c['t0'] < b < c['t1'] and abs(c['t1'] - b) < 1.2:
                b = c['t1']; break
        shots[i]['t1'] = round(b, 3); shots[i + 1]['t0'] = round(b, 3)
    for i in range(len(shots) - 1):
        if abs(shots[i]['t1'] - shots[i + 1]['t0']) > 1e-6:
            print('GAP/OVERLAP', shots[i]['t1'], shots[i + 1]['t0'], shots[i]['title'], shots[i + 1]['title'])
    chs = [{'id': i, 't0': a, 't1': b, 'name': n, 'deck': d, 'accent': acc} for i, a, b, n, d, acc in CHAPTERS]
    # attach chapter card start times
    for c in chs: c['card'] = (0.0 if c['id'] == 1 else c['t0']) + 0.0
    hits = [c['t0'] for c in chs if c['id'] > 1] + [7.7, 21.1, 75.53, 139.06, 188.21, 235.65, 280.17, 353.18, 399.36, 443.93, 501.67, 522.95, 531.5]
    hits = sorted(set(round(x, 3) for x in hits))
    ep = {'slug': '009_prion_full', 'title': '朊病毒·同类相食', 'episode': 'EP.009',
          'duration': 534.5, 'source': '出稿/009_朊病毒同类相食/配音.wav',
          'chapters': chs, 'shots': shots, 'hits': hits,
          'captions': 'captions_full.json'}
    (PROJ / 'episode_full.json').write_text(json.dumps(ep, ensure_ascii=False, indent=1), encoding='utf-8')
    print('chapters', len(chs), 'shots', len(shots), 'captions', len(caps))
    for s in shots[:8]: print(f"  {s['t0']:7.2f}-{s['t1']:7.2f} CH{s['ch']:02d} {s['mod']:8s} {s.get('title','')}")
    # every caption inside a shot
    bad = [c for c in caps if not any(s['t0'] - 1e-6 <= c['t0'] and c['t1'] <= s['t1'] + 1e-6 for s in shots)]
    print('captions outside shots', len(bad))
    for c in bad[:5]: print('  !', c['t0'], c['t1'], c['text'])


if __name__ == '__main__':
    main()
