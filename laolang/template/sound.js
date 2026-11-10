// 洞窟门口的声音：砂石上的脚步、一扇旧木门的吱呀、门轴停住、洞里很空的风声、
// 火苗的轻响、壁画上金环的一声细响、题字落下的印章声。都是小东西，不抢人声。
// 门轴的吱呀是现场合成的：一段窄带噪声沿着共振频率慢慢升上去，再落下来。

export default {
  name: '一扇旧木门、砂石脚步与洞里很空的风；最后一声小锣留给题字',
  space: { size: 0.52, damp: 0.5, mix: 0.38 },
  vary: 0.08,
  sounds: {
    step: {
      variants: [
        { layers: [{ use: 'thud', freq: 96, decay: 30, felt: 1100, body: 0.45, gain: 0.42 }, { use: 'paper', bright: 1500, grain: 0.75, shape: 'down', gain: 0.28 }] },
        { layers: [{ use: 'thud', freq: 84, decay: 32, felt: 900, body: 0.4, gain: 0.4 }, { use: 'paper', bright: 1200, grain: 0.8, shape: 'down', gain: 0.3 }] },
        { layers: [{ use: 'thud', freq: 108, decay: 28, felt: 1300, body: 0.5, gain: 0.38 }, { use: 'paper', bright: 1800, grain: 0.7, shape: 'down', gain: 0.24 }] },
      ],
    },
    door: {
      use: (p, r, { LIB }) => {
        const SR = 44100, d = p.dur ?? 1.0, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        // a narrow resonant band creeping up and sagging back: old hinge
        const f = LIB.svf(nz, (t) => 170 + 520 * Math.sin(Math.PI * Math.min(1, t / d)) + 90 * Math.sin(t * 31), 7.5, 'bp');
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          const grind = (0.45 + 0.55 * Math.sin(Math.PI * q)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 17 * t));
          o[i] = f[i] * grind * 1.5;
        }
        // the first wooden complaint and the final settle
        const k = LIB.RECIPES.knock({ freq: 150, decay: 42 }, r);
        for (let i = 0; i < k.length && i < n; i++) o[i] += k[i] * 0.55;
        const k2 = LIB.RECIPES.knock({ freq: 92, decay: 26 }, r), s0 = Math.max(0, n - Math.round(0.12 * SR));
        for (let i = 0; i < k2.length && s0 + i < n; i++) o[s0 + i] += k2[i] * 0.45;
        return o;
      },
    },
    doorStop: { layers: [{ use: 'thud', freq: 62, decay: 12, felt: 700, body: 0.9, gain: 0.7 }, { use: 'knock', freq: 120, decay: 22, gain: 0.5 }, { use: 'glass', note: 'G3', dur: 0.5, decay: 6, gain: 0.08 }] },
    dust: { use: 'rustle', air: 0.8, crinkle: 0.55, bright: 2200, gain: 0.45 },
    wind: { use: 'swish', color: 'air', from: 140, to: 620, shape: 'arc', q: 0.5, gain: 0.55 },
    room: { use: 'roomtone', bright: 330, gain: 0.9 },
    drip: { variants: [{ use: 'drop', freq: 'A5', to: 'E6', gain: 0.5 }, { use: 'drop', freq: 'G5', to: 'D6', gain: 0.42 }] },
    flame: { use: 'swish', color: 'air', from: 420, to: 1100, shape: 'arc', q: 0.8, gain: 0.22 },
    whoosh: { use: 'swish', color: 'cloth', from: 320, to: 1900, shape: 'arc', q: 0.45, gain: 0.4 },
    glint: { use: 'glint', note: 'E6', count: 4, dur: 0.8, gain: 0.42 },
    stamp: { layers: [{ use: 'stamp', freq: 86, gain: 0.7 }, { use: 'knock', freq: 190, decay: 30, gain: 0.3 }, { use: 'glass', note: 'G4', dur: 1.1, decay: 3.2, gain: 0.12 }] },
  },
  ambience: { use: 'roomtone', bright: 300, gain: 0.05 },
};
