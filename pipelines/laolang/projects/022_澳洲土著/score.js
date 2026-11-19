// 一个人的远行：木吉他似的拨弦走路的节奏，弦乐铺底，钟琴在段落之间点一下；
// 风沙段换小调与框鼓，片尾回到 D 大调收住。全片有旁白，配乐只做底，不抢话。
// 结构跟 index.html 的 F.section（酒馆 / 出发 / 少年 / 远行 / 风沙 / 欧洲 / 澳洲 / 归来 / 今天 / 片尾）。
// D 大调，84 BPM；不引用任何原片旋律。

export default {
  name: '一个人的远行：拨弦的走路节奏、弦乐铺底、钟琴点亮段落；给旁白让路',
  bpm: 84,
  key: 'D major',
  human: 0.72,
  sidechain: false,
  space: { size: 0.55, damp: 0.5, mix: 0.3 },

  chords: {
    酒馆: ['D', 'A', 'Bm', 'G'],
    出发: ['D', 'G', 'A', 'D'],
    少年: ['G', 'D', 'Bm', 'A'],
    远行: ['D', 'A', 'Bm', 'G'],
    风沙: ['Bm', 'G', 'D', 'A'],
    欧洲: ['G', 'Bm', 'A', 'D'],
    澳洲: ['D', 'G', 'A', 'Bm'],
    归来: ['Bm', 'G', 'D', 'A'],
    今天: ['D', 'A', 'G', 'A'],
    片尾: ['G', 'D', 'A', 'D'],
  },

  motif: 'A4:.75 B4:.25 D5:1 E5:.5 D5:.5 B4:1 | A4:.5 B4:.5 D5:1 F#5:1 E5:2',

  parts: [
    // 低音：一直走，说话时也留着，给画面一点脉搏
    { name: '低音拨弦', synth: 'pluck', play: 'bass', pattern: { 酒馆: 'x.......', 出发: 'x...x...', 少年: 'x...x...', 远行: 'x...x...', 风沙: 'x.x.x...', 欧洲: 'x...x...', 澳洲: 'x...x...', 归来: 'x.......', 今天: 'x...x...', 片尾: 'x...x...' }, octave: 2, bright: 0.35, gain: 0.075, underVoice: 'keep' },

    // 弦乐铺底：全片都在，只是厚薄随段落
    { name: '弦乐铺底', synth: 'strings', play: 'chord', pattern: 'x-------', octave: 3, cut: 1250, attack: 0.55, gain: 0.05, gainByEnergy: [0.6, 0.85, 1.15, 1.3], underVoice: 'keep' },

    // 拨弦的走路节奏：像鞋底打在土路上，说话时自动退开
    { name: '走路的拨弦', synth: 'pluck', play: 'arp', pattern: { 酒馆: 'x.x.x.x.', 出发: 'x.x.x.x.', 少年: 'x.xx.x.x', 远行: 'x.xx.x.x', 风沙: 'x.xx.xx.', 欧洲: 'x.x.x.x.', 澳洲: 'x.x.x.x.', 归来: 'x...x...', 今天: 'x.x.x.x.', 片尾: 'x.......' }, octave: 4, bright: 0.62, spread: 0.42, range: 2, gain: 0.075 },

    // 钟琴：只在几个需要点亮的地方出现
    { name: '钟琴', synth: 'bell', play: 'motif', gain: 0.10, in: ['少年', '远行', '澳洲', '片尾'] },

    // 走路的沙锤：远行之后才有，很轻
    { name: '沙锤', synth: 'shaker', pattern: '..x...x.', gain: 0.05, in: ['远行', '风沙', '澳洲', '片尾'] },

    // 风沙段的框鼓：苦地方的心跳，不铺满
    { name: '框鼓', synth: 'rim', pattern: 'x.......x.......', gain: 0.06, in: ['风沙'] },

    // 今天/片尾：电钢的几粒和弦，像旧照片上的反光
    { name: '电钢', synth: 'rhodes', play: 'chord', pattern: { 今天: 'x---x---', 片尾: 'x-------' }, octave: 4, cut: 1800, attack: 0.08, gain: 0.05, in: ['今天', '片尾'] },

    // 片尾一声小锣，收住
    { name: '小锣', synth: 'gong', play: 'drum', pattern: { 片尾: 'x...............' }, note: 50, gain: 0.12, in: ['片尾'] },
  ],
};
