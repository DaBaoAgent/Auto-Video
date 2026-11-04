// ---------------------------------------------------------------- transitions / subtitle / CRT
// 全片：cuts.json 的 cuts 含首帧 0，播放器用的切点表去掉它（57 个切点 / 58 个镜头）
const CUTS = cues.cuts.slice(1);
const SHOTS = [
  bayShotA, bayShotB, bayShotC, bayShotD, bayShotE, bayShotF, bayShotG,
  shot08, shot09, shot10, shot11, shot12, shot13, shot14, shot15, shot16,
  shot17, shot18, shot19, shot20, shot21, shot22, shot23, shot24, shot25,
  shot26, shot27, shot28, shot29, shot30, shot31, shot32, shot33, shot34, shot35,
  shot36, shot37, shot38, shot39, shot40, shot41, shot42, shot43, shot44, shot45,
  shot46, shot47, shot48, shot49, shot50, shot51, shot52, shot53, shot54, shot55,
  shot56, shot57, shot58,
];
function shotIndex(t) { for (let i = 0; i < CUTS.length; i++) if (t < CUTS[i]) return i; return CUTS.length; }
function transAt(t) {
  for (let i = 0; i < CUTS.length; i++) {
    const age = t - CUTS[i];
    if (age >= 0 && age < 4 / FPS) return { prev: i, p: (age * FPS + 1) / 4 };
  }
  return null;
}
function mixCols(a, b, p) {
  const g = 12, n = Math.ceil(W / g);
  for (let k = 0; k < n; k++) {
    if (p <= ((k * 5) % n) / n) continue;
    const x0 = k * g, x1 = Math.min(W, x0 + g);
    for (let y = 0; y < H; y++) { const o = y * W; for (let x = x0; x < x1; x++) a[o + x] = b[o + x]; }
  }
}
function padEdges() {
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < 10; x++) { IB[o + x] = IB[o + 10]; IB[o + W - 1 - x] = IB[o + W - 11]; }
  }
}
const SUB_CACHE = new Map();
function layoutW(str, sc) {
  let w = 0;
  for (const ch of str) w += textW(ch) * sc;
  return w;
}
function subtitle(t) {
  const s = cues.subs.find(s => t >= s.t0 - 0.02 && t < s.t1 + 0.10);
  if (!s) return;
  const SC = 2, bandY = 304, TEXTY = 316;
  rect(0, bandY, W, H - bandY, M(0));
  for (let y = bandY + 2; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) & 1) px(x, y, M(31));
  hline(0, bandY, W, M(29));
  hline(0, bandY + 1, W, M(0));
  const full = s.text;
  let fullW = SUB_CACHE.get(full);
  if (fullW === undefined) { fullW = layoutW(full, SC); SUB_CACHE.set(full, fullW); }
  const shown = Math.min(full.length, Math.max(1, Math.floor((t - s.t0) / 0.026) + 1));
  const vis = full.slice(0, shown);
  // 以整条文字的宽度居中：打字机从左往右长，不左右晃
  let x = Math.round((W - fullW) / 2);
  const hl = s.hl || '', hi = hl ? full.indexOf(hl) : -1;
  for (let i = 0; i < vis.length; i++) {
    const gold = hi >= 0 && i >= hi && i < hi + hl.length;
    text(vis[i], x + 2, TEXTY + 2, M(0), SC);
    text(vis[i], x, TEXTY, gold ? M(15) : M(8), SC);
    x += textW(vis[i]) * SC;
  }
  // 高亮后的小三角指示
  if (hi >= 0 && shown > hi) {
    const gx = Math.round((W - fullW) / 2 + layoutW(full.slice(0, hi), SC) + layoutW(full.slice(hi, hi + hl.length), SC) / 2);
    const by = bandY + 1 + Math.round((Math.sin(t * 6) + 1) * 1.5);
    px(gx, by, M(15)); px(gx - 1, by - 2, M(15)); px(gx + 1, by - 2, M(15));
  }
}
function shakeXY(t) {
  let amp = 0, age0 = 0;
  for (const h of cues.hits) {
    if (h.t > t) break;
    const age = t - h.t;
    if (age > 0.24) continue;
    const a = h.kind === 'cut' ? 1.0 : 2.0;
    const v = Math.round(a * (1 - age / 0.24));
    if (v > amp) { amp = v; age0 = age; }
  }
  if (!amp) return [0, 0];
  const f = Math.round(t * FPS);
  return [Math.round(Math.sin(f * 2.7) * amp), Math.round(Math.cos(f * 3.1) * amp)];
}
function fadeEdges(t) {
  let k = 0;
  if (t < 0.36) k = 1 - t / 0.36;
  if (t > cues.duration - 0.45) k = Math.max(k, (t - (cues.duration - 0.45)) / 0.45);
  if (k <= 0.001) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ((bay(x, y) * 0.7 + hash(x, y) * 0.3) < k) IB[y * W + x] = 0;
  }
}

// ---------------------------------------------------------------- 全片环境动效
// 一层缓慢横向漂移的微尘：亮底描暗、暗底描亮，叠在每帧画面上（字幕带除外）。
// 只做微尘，不铺任何扫描纹/光带；镜头本身静止时由它保证画面上始终有可测的运动。
const LUM = new Uint8Array(32);
for (let i = 0; i < 32; i++) LUM[i] = (0.2126 * MP[i][0] + 0.7152 * MP[i][1] + 0.0722 * MP[i][2]) | 0;
function ambientAt(t) {
  const lut = makeLUT(Math.round(t * FPS));
  for (let i = 0; i < 40; i++) {
    const dir = hash(i, 811) < 0.22 ? -1 : 1;
    const spd = 14 + hash(i, 801) * 15;
    const x = Math.floor(((hash(i, 803) * W + t * spd * dir) % W + W) % W);
    const y = Math.floor(14 + (hash(i, 805) * 272 + Math.sin(t * (0.16 + hash(i, 807) * 0.22) + i * 2.1) * 5 + 272) % 272);
    const sz = 1;
    const darkHere = LUM[lut[IB[y * W + x]]] >= 128;
    const c = darkHere ? M(0) : M(8);
    for (let j = 0; j < sz; j++) for (let k = 0; k < sz; k++) px(x + k, y + j, c);
  }
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const small = document.createElement('canvas'); small.width = W; small.height = H;
const sctx = small.getContext('2d');
const simg = sctx.createImageData(W, H);
const FW = 640, FH = 360, UP = 3;
const OUTW = FW * UP, OUTH = FH * UP;
const scan = document.createElement('canvas'); scan.width = OUTW; scan.height = 3;
{ const c = scan.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 1, OUTW, 1); }
const vign = document.createElement('canvas'); vign.width = OUTW; vign.height = OUTH;
{
  const c = vign.getContext('2d');
  const g = c.createRadialGradient(OUTW / 2, OUTH / 2, OUTH * 0.38, OUTW / 2, OUTH / 2, OUTH * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.48)');
  c.fillStyle = g; c.fillRect(0, 0, OUTW, OUTH);
}
const scanPat = ctx.createPattern(scan, 'repeat');
function composite(f) {
  const lut = makeLUT(f), d = simg.data;
  for (let i = 0; i < W * H; i++) {
    const p = MP[lut[IB[i]]];
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  sctx.putImageData(simg, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, OUTW, OUTH);
  ctx.drawImage(vign, 0, 0);
  ctx.fillStyle = scanPat; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(120,255,200,0.02)'; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'source-over';
}
// 机位微呼吸：整数像素的三角度慢漂（栅格不变），代替原先靠快尘提供的画面动感。
// 三角波速度恒定 → 每 0.4 s 必有一像素位移，静置镜头也不会长时间完全定格；
// 幅度 ±2~3 px、周期 3~4 s，字幕与微尘不参与位移。
function triWave(t, period) {
  const p = ((t % period) + period) % period / period;
  return p < 0.5 ? p * 4 - 1 : 3 - p * 4;
}
function driftAt(t) {
  // 片头七个海湾镜头本来就带手持抖动+推轨，再叠漂移会加重压缩噪点，直接跳过。
  if (t < CUTS[6]) return [0, 0];
  const dx = Math.round(2.5 * triWave(t + 0.30, 4.0));
  const dy = Math.round(2.0 * triWave(t + 1.70, 3.0));
  return [dx, dy];
}
window.renderAt = (t) => {
  const tt = Math.min(cues.duration - 1e-4, Math.max(0, t));
  const f = Math.round(tt * FPS);
  const [dx, dy] = driftAt(tt);
  const [sx, sy] = shakeXY(tt);
  GX = dx + sx; GY = dy + sy;
  IB.fill(0);
  SHOTS[shotIndex(tt)](tt, f);
  const tr = transAt(tt);
  if (tr) {
    JB.set(IB);
    GX = dx; GY = dy;
    SHOTS[tr.prev](Math.max(0, CUTS[tr.prev] - 1 / FPS), f);
    mixCols(IB, JB, tr.p);
  }
  GX = 0; GY = 0;
  subtitle(tt);
  ambientAt(tt);
  padEdges();
  fadeEdges(tt);
  composite(f);
};
window.__stats = () => ({
  cuts: CUTS.length, shots: SHOTS.length, subs: cues.subs.length, hits: cues.hits.length,
  duration: cues.duration, missing: SHOTS.map((s, i) => (typeof s === 'function' ? null : i)).filter(x => x !== null),
});
