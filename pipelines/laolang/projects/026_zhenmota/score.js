// 一件旧壁画前面的小乐队：竹笛、琵琶、低音拨弦、木鱼与一面小锣。
// 结构：洞外（笛子与琵琶，走路的速度）→ 壁画（慢下来，只留低音与零星的拨弦）→
// 考古队愣住（全停）→ 题字（一声小锣与高音笛）。人声说话时笛子与铺底自动退后，琵琶与低音留一点脉搏。
// 五声音阶 G 宫，84 BPM；不引用任何原片旋律。

// A bamboo flute: a sine with a breathy edge, a soft attack and a slight vibrato.
// The engine passes MIDI notes (one at a time for a motif), a length in seconds and a seeded random.
function dizi(notes, len, r) {
  const SR = 44100, n = Math.ceil((len + 0.35) * SR), out = new Float32Array(n);
  for (const m of notes) {
    const f = 440 * Math.pow(2, (m - 69) / 12);
    let ph = 0, air = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const vib = 1 + 0.006 * Math.sin(2 * Math.PI * 5.1 * t) * Math.min(1, t / 0.28);
      const attack = Math.min(1, t / 0.05);
      const rel = t > len ? Math.max(0, 1 - (t - len) / 0.3) : 1;
      ph = (ph + (f * vib) / SR) % 1;
      // a little second harmonic makes it read as a flute rather than a pure sine
      const tone = Math.sin(2 * Math.PI * ph) + 0.16 * Math.sin(4 * Math.PI * ph) + 0.05 * Math.sin(6 * Math.PI * ph);
      air = air * 0.93 + (r() * 2 - 1) * 0.07;
      out[i] += (tone * 0.72 + air * 0.10) * attack * rel / Math.sqrt(notes.length);
    }
  }
  return out;
}

export default {
  name: '旧壁画前的一支竹笛：五声音阶、琵琶拨弦、木鱼与一声小锣；不追求热闹，让画面自己说话',
  key: 'G major',
  human: 0.72,
  sidechain: false,
  space: { size: 0.5, damp: 0.55, mix: 0.32 },
  chords: {
    story: ['G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G'],
    quiet: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'G'],
    resolve: ['C', 'G', 'D', 'G'],
  },
  motif: 'D5:.5 E5:.5 G5:1 A5:.5 G5:.5 E5:1 | D5:.5 E5:.5 G5:1 A5:1 G5:2',
  parts: [
    { name: '低音拨弦', synth: 'pluck', play: 'bass', pattern: 'x...x...', octave: 2, bright: 0.4, gain: 0.075, underVoice: 'keep' },
    { name: '琵琶', synth: 'pluck', play: 'arp', pattern: { story: 'x.x.x.x.', quiet: 'x...x...', resolve: 'x.......' }, octave: 4, bright: 0.7, spread: 0.45, gain: 0.085, underVoice: 'keep' },
    { name: '弦乐铺底', synth: 'strings', play: 'chord', pattern: 'x-------', octave: 3, cut: 1250, attack: 0.5, gain: 0.05, in: ['story', 'quiet', 'resolve'] },
    { name: '竹笛', synth: dizi, play: 'motif', gain: 0.13, in: ['story', 'quiet', 'resolve'] },
    { name: '木鱼', synth: 'woodblock', pattern: { story: '..x...x.', quiet: '........', resolve: '........' }, gain: 0.075, pan: 0.25, in: ['story'] },
    { name: '小锣', synth: 'gong', play: 'drum', pattern: { resolve: 'x...............' }, note: 50, gain: 0.13, in: ['resolve'] },
  ],
};
