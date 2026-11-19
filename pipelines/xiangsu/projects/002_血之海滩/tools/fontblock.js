// ---------------------------------------------------------------- pixel font（12px 原生渲染 → 二值化，笔画不断）
const TC = new Map();
const _tc = document.createElement('canvas');
_tc.width = 640; _tc.height = 24;
const _tx = _tc.getContext('2d', { willReadFrequently: true });
const FS = 12;
function bmp(str) {
  let o = TC.get(str);
  if (o) return o;
  _tx.font = `${FS}px "Fusion Pixel 12"`;
  const mw = Math.max(1, Math.min(640, Math.ceil(_tx.measureText(str).width) + 4));
  _tc.width = mw; _tc.height = 24;
  _tx.font = `${FS}px "Fusion Pixel 12"`;
  _tx.textBaseline = 'top';
  _tx.fillStyle = '#fff';
  _tx.clearRect(0, 0, mw, 24);
  _tx.fillText(str, 1, 1);
  const d = _tx.getImageData(0, 0, mw, 24).data;
  const m = new Uint8Array(mw * 24);
  for (let i = 0; i < mw * 24; i++) m[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
  o = { w: mw, h: 24, m };
  TC.set(str, o);
  return o;
}
function textW(str) { return Math.ceil(_tx.measureText(str).width) + 1; }
function text(str, x, y, c, scale = 1) {
  const b = bmp(str);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i]) {
    if (scale === 1) px(x + i, y + j, c);
    else for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) px(x + i * scale + sx, y + j * scale + sy, c);
  }
  return textW(str) * scale;
}
function textC(str, cx, y, c, scale = 1) { return text(str, Math.round(cx - textW(str) * scale / 2), y, c, scale); }
function textSC(str, cx, y, c, sc = 2, shadow = 0, shc = P.ink) {
  const b = bmp(str), w = textW(str);
  const x0 = Math.round(cx - w * sc / 2);
  if (shadow) for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i])
    for (let sy = 0; sy < sc; sy++) for (let sx = 0; sx < sc; sx++) px(x0 + i * sc + sx + sc, y + j * sc + sy + sc, shc);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i])
    for (let sy = 0; sy < sc; sy++) for (let sx = 0; sx < sc; sx++) px(x0 + i * sc + sx, y + j * sc + sy, c);
  return w * sc;
}
function chipZh(zh, x, y, fg = P.cream, bg = P.ink, bd = P.gold) {
  const w = textW(zh) + 12, h = 20;
  rect(x + 2, y + 2, w, h, P.ink);
  rect(x, y, w, h, bg);
  hline(x, y, w, bd); hline(x, y + h - 1, w, bd);
  vline(x, y, h, bd); vline(x + w - 1, y, h, bd);
  text(zh, x + 6, y + 3, fg, 1);
  return w;
}

