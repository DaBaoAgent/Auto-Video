// 洞窟门口的声音：砂石上的脚步、一扇旧木门的吱呀、门轴停住、洞里很空的风声、
// 火苗的轻响、壁画上金环的一声细响、题字落下的印章声。都是小东西，不抢人声。
// 门轴的吱呀是现场合成的：一段窄带噪声沿着共振频率慢慢升上去，再落下来。

export default {
  name: '酒馆的木桌与杯碗、后厨的刀砧、阁楼的纸页；一记拍桌定住整段戏',
  space: { size: 0.46, damp: 0.52, mix: 0.26 },
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
    pour: {
      use: (p, r, { LIB }) => {
        const SR = 44100, d = p.dur ?? 1.2, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        const f = LIB.svf(nz, (t) => 620 + 780 * Math.sin(Math.PI * Math.min(1, t / d)) + 90 * Math.sin(t * 48), 3.2, 'bp');
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          o[i] = f[i] * Math.sin(Math.PI * q) ** 0.7 * 0.9;
        }
        const b = LIB.RECIPES.bubble({ dur: d * 0.8, count: Math.max(3, Math.round(d * 8)), freq: 520 }, r);
        const s0 = Math.round(d * 0.12 * SR);
        for (let i = 0; i < b.length && s0 + i < n; i++) o[s0 + i] += b[i] * 0.32;
        return o;
      },
    },
    cup: { layers: [{ use: 'knock', freq: 540, decay: 34, gain: 0.5 }, { use: 'glass', note: 'C5', dur: 0.28, decay: 8, gain: 0.1 }] },
    slam: { layers: [{ use: 'impact', freq: 58, bright: 900, crack: 0.5, body: 1.0, gain: 0.9 }, { use: 'knock', freq: 150, decay: 16, gain: 0.55 }, { use: 'glass', note: 'C4', dur: 0.8, decay: 4, gain: 0.12 }] },
    // 1930 年代街头手枪：一记脆的爆响 + 短尾，不拖长
    gun: {
      layers: [
        { use: 'impact', freq: 74, bright: 6400, crack: 1.4, body: 0.7, gain: 0.85 },
        { use: 'swish', color: 'cloth', from: 2400, to: 5200, shape: 'down', dur: 0.16, q: 0.35, gain: 0.4 },
      ],
    },
    chop: { layers: [{ use: 'knock', freq: 250, decay: 55, gain: 0.85 }, { use: 'paper', bright: 2600, grain: 0.85, shape: 'down', dur: 0.16, gain: 0.45 }, { use: 'thud', freq: 108, decay: 40, felt: 900, body: 0.4, gain: 0.35 }] },
    splash: { layers: [{ use: 'swish', color: 'air', from: 900, to: 2600, shape: 'down', dur: 0.4, q: 0.6, gain: 0.35 }, { use: 'bubble', freq: 700, count: 5, dur: 0.35, gain: 0.3 }] },
    paperTurn: { layers: [{ use: 'paper', bright: 2800, grain: 0.8, flap: 11, dur: 0.32, gain: 0.5 }, { use: 'rustle', air: 0.4, crinkle: 0.5, bright: 2600, dur: 0.3, gain: 0.2 }] },
    engine: {
      use: (p, r, { LIB }) => {
        // a small 1930s radial engine: a low roar chopped by the cylinder firing rate
        const SR = 44100, d = p.dur ?? 1.5, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        const low = LIB.svf(nz, (t) => 110 + 24 * Math.sin(Math.PI * 1.1 * t), 1.2, 'lp');
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          const am = 0.62 + 0.38 * Math.sin(2 * Math.PI * 24 * t + Math.sin(2 * Math.PI * 3.1 * t) * 0.5);
          const env = Math.pow(Math.sin(Math.PI * Math.min(1, q)), 0.35);
          o[i] = (low[i] * 2.0 + Math.sin(2 * Math.PI * 55 * t) * 0.14 + Math.sin(2 * Math.PI * 110 * t + 1) * 0.05) * am * env;
        }
        return o;
      },
    },
    low: { use: 'boom', freq: 40, dur: 2.2, noise: 0.5, gain: 0.5 },
    // 第二幕：火车汽笛、站台人声、蒸汽
    whistle: {
      use: (p, r, { LIB }) => {
        // 1930 年代的蒸汽汽笛：一根基音加两个泛音，起音带一点气声
        const SR = 44100, d = p.dur ?? 0.9, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        const air = LIB.svf(nz, (t) => 2400 + 320 * Math.sin(2 * Math.PI * 5 * t), 2.4, 'bp');
        const f0 = p.freq ?? 392;
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          const env = Math.min(1, q / 0.09) * Math.pow(1 - q, 0.55);
          const drift = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t);
          const tone = Math.sin(2 * Math.PI * f0 * drift * t) + 0.55 * Math.sin(2 * Math.PI * f0 * 1.5 * drift * t) + 0.3 * Math.sin(2 * Math.PI * f0 * 2.02 * drift * t);
          o[i] = (tone * 0.16 + air[i] * 0.5) * env;
        }
        return o;
      },
    },
    crowd: {
      use: (p, r, { LIB }) => {
        // 一片人声：带通噪声慢慢起伏，不出现具体词句
        const SR = 44100, d = p.dur ?? 2.4, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        const mur = LIB.svf(nz, (t) => 420 + 180 * Math.sin(2 * Math.PI * 0.7 * t) + 90 * Math.sin(2 * Math.PI * 1.9 * t), 1.4, 'bp');
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          const env = Math.min(1, q / 0.25) * Math.min(1, (1 - q) / 0.35);
          const wob = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.9 * t + Math.sin(2 * Math.PI * 0.31 * t) * 2.2);
          o[i] = mur[i] * env * wob * 1.6;
        }
        return o;
      },
    },
    steam: {
      use: (p, r, { LIB }) => {
        const SR = 44100, d = p.dur ?? 1.2, n = Math.ceil(d * SR), o = new Float32Array(n), nz = LIB.noise(n, r);
        const hi = LIB.svf(nz, (t) => 3200 - 1400 * Math.min(1, t / d), 0.9, 'bp');
        for (let i = 0; i < n; i++) {
          const t = i / SR, q = t / d;
          const env = Math.min(1, q / 0.05) * Math.pow(1 - q, 1.6);
          o[i] = hi[i] * env * 1.2 + Math.sin(2 * Math.PI * 5200 * t) * 0.02 * env;
        }
        return o;
      },
    },
  },
  ambience: { use: 'roomtone', bright: 300, gain: 0.05 },
};
