// 剪影律动 — film.js 骨架。这是一部片子的整条时间轴：一个 DUR、一个 B（一拍）、若干 SEC 段、
// 一个 render(t)。开局先照 references/style.md 定下天空/日轮/水平线的走向，再照 references/score.md
// 把拍点排进 SEC；完整的工作片见 projects/004_玛雅巨人文明/film.js（58.0 s / 12 段 / 15 镜）。
//
// 三层：LF 剪影、LR 倒影、LX 水面光，由 sky.js（本仓库 styles/demo）合成。
window.DUR = 30.0;
const DUR = 30.0, B = 2 / 3, PI = Math.PI, TAU = PI * 2;   // 90 BPM：一拍 0.6667 s
const W = innerWidth, H = innerHeight, K = H / 1080;
const G = document.getElementById('g'); G.width = W; G.height = H;
const O = document.getElementById('o'); O.width = W; O.height = H;
const octx = O.getContext('2d');
const draw = SKY.make(G);
function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
const LF = layer(), LR = layer(), LX = layer();
const fctx = LF.getContext('2d'), rctx = LR.getContext('2d'), xctx = LX.getContext('2d');
const INK = '#05020A', LIGHT = '#FFF2D0';

// ---------------------------------------------------------------- 缓动与段
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const env = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
function seg(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t <= keys[i + 1][0]) {
      const [t0, v0, e] = keys[i], [t1, v1] = keys[i + 1], u = (t - t0) / (t1 - t0);
      return lerp(v0, v1, e === 'lin' ? u : (e === 'eio' ? eio(u) : ss(u)));
    }
  }
  return keys[keys.length - 1][1];
}
const beatOf = t => Math.floor(t / B + 1e-6);
const beatT = n => n * B;

// ---------------------------------------------------------------- 相机
function project(cam, x, y, z) {
  const zz = Math.max(.05, z - (cam.cz || 0)), fpx = cam.f * H;
  return [W / 2 + ((x - cam.cx) / zz - cam.yaw) * fpx, cam.hor * H + ((cam.ch - y) / zz) * fpx, fpx / zz];
}
function place(ctx, cam, x, y, z, s, face, refl, rot) {
  const p = project(cam, x, refl ? -y : y, z), sc = p[2] * s;
  const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), ys = refl ? sc : -sc;
  ctx.setTransform(sc * face * c, ys * sn, -sc * face * sn, ys * c, p[0], p[1]);
}
// 同一个形状：既进剪影层，也镜像后裁在水线以下进倒影层
function both(cam, x, y, z, s, face, fn, rot, noRefl) {
  const wl = project(cam, x, 0, z)[1];
  for (const refl of (noRefl ? [false] : [false, true])) {
    const ctx = refl ? rctx : fctx;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
    if (refl) ctx.rect(-10, wl, W + 20, H - wl + 20); else ctx.rect(-10, -10, W + 20, wl + 10);
    ctx.clip(); ctx.globalAlpha = refl ? .52 : 1;
    place(ctx, cam, x, y, z, s, face, refl, rot); fn(ctx); ctx.restore();
  }
}

// ---------------------------------------------------------------- 天空与日轮（整片一条曲线）
const skyPh = t => seg(t, [[0, .02], [DUR * .5, .45], [DUR, 1.0]]);
const sunV = t => seg(t, [[0, .050], [DUR * .55, .010], [DUR, -.004]]);
const sunU = t => seg(t, [[0, .02], [DUR * .5, .03], [DUR, .0]]);
const pulseAt = t => Math.exp(-((((t % B) + B) % B)) / .15);

// ---------------------------------------------------------------- 台口：一个立着的剪影（换成 CAST 里的演员）
function silhouette(ctx) {
  ctx.beginPath();
  ctx.moveTo(-.10, 0); ctx.lineTo(-.07, -.52); ctx.lineTo(-.14, -.60); ctx.lineTo(-.06, -.64);
  ctx.lineTo(-.05, -.80); ctx.lineTo(.05, -.80); ctx.lineTo(.06, -.64); ctx.lineTo(.14, -.60);
  ctx.lineTo(.07, -.52); ctx.lineTo(.10, 0); ctx.closePath(); ctx.fill();
}

// ================================================================ 镜头
// 每一段返回 { cam, sun, sunR }，也可以带 labels 交给 type() 画标签。
function shotA(t, s) {
  const cam = { f: 5.2, hor: .615, ch: .80, cx: 0, cz: 0, yaw: 0 };
  const breathe = .012 * Math.sin(TAU * (s > 4 ? .5 : 1) * (s % B) / B);
  both(cam, 0, 0, 44, 1, 1, silhouette);
  if (breathe) cam.ch += breathe;
  return { cam, sun: [sunU(t), sunV(t)], sunR: .045 };
}
function shotB(t, s) {
  const cam = { f: 5.6, hor: .60, ch: .85, cx: lerp(0, .6, eio(env(s, 0, 3.0))), cz: 0, yaw: 0 };
  both(cam, -1.4, 0, 44, 1, 1, silhouette);
  both(cam, 1.4, 0, 46, 1, -1, silhouette);
  return { cam, sun: [sunU(t), sunV(t)], sunR: .045 };
}
function shotC(t, s) {
  const cam = { f: lerp(5.6, 4.8, eio(env(s, 0, 4.0))), hor: .60, ch: .80, cx: .6, cz: 0, yaw: 0 };
  both(cam, 0, 0, 40, 1.3, 1, silhouette);
  return { cam, sun: [sunU(t), sunV(t)], sunR: .042, labels: [{ text: '标签', x: 1560 * K, y: 300 * K }] };
}

// ================================================================ 段表：段界即拍界的取整（见 references/score.md）
const SEC = [
  [0.000, 10.000, shotA], [10.000, 20.000, shotB], [20.000, 30.000, shotC],
];

// ---------------------------------------------------------------- 字幕
const CREAM = '#FFF6DC';
const NOSUB = /subs=0/.test(location.search);   // 封面静帧：--q "subs=0"
let CUES = [];
fetch('out/cues.json').then(r => r.json()).then(j => { CUES = j; }).catch(() => { });

function type(t, r) {
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
  const cue = NOSUB ? null : CUES.find(c => t >= c.t0 && t < c.t1);
  if (cue) {
    octx.font = `700 ${Math.round(46 * K)}px SCBold`;
    octx.fillStyle = CREAM; octx.textBaseline = 'alphabetic'; octx.globalAlpha = .96;
    octx.fillText(cue.text, 118 * K, H - 92 * K);
    octx.globalAlpha = 1;
  }
  if (r && r.labels) {
    octx.font = `700 ${Math.round(34 * K)}px SCBold`;
    octx.fillStyle = CREAM; octx.textAlign = 'center'; octx.globalAlpha = .92;
    for (const L of r.labels) octx.fillText(L.text, L.x, L.y);
    octx.textAlign = 'left'; octx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- 渲染
function clearAll() {
  for (const x of [fctx, rctx, xctx]) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.fillStyle = INK;
  }
  xctx.strokeStyle = LIGHT; xctx.fillStyle = LIGHT;
}
window.render = t => {
  t = cl(t, 0, DUR - 1e-4);
  clearAll();
  const sec = SEC.find(s => t >= s[0] && t < s[1]) || SEC[SEC.length - 1];
  const r = sec[2](t, t);
  draw({
    T: t, hor: r.cam.hor * H, fpx: r.cam.f * H, yaw: r.cam.yaw, cx: r.cam.cx, ch: r.cam.ch,
    sun: r.sun, sunR: r.sunR, ph: skyPh(t), pulse: pulseAt(t), flash: 0,
    rays: 1, vs: 1 + (r.cam.f - 3) / 5,
  }, [LF, LR, LX]);
  type(t, r);
};
window.TEXTS = t => [];                          // 画面上出现的字，供 readcheck 用
window.EV = [];                                  // 声音事件，交给 references/score.md（也可直接手写进 score.json）
window.READY = false;
document.fonts.ready.then(() => { window.READY = true; });
