// ---------------------------------------------------------------- pixel font（24px 光栅 → 2×2 抽样，字形成块不断）
const TC = new Map();
const _tc = document.createElement('canvas');
const FB = 2, FS = 12 * FB;
const CH = FS + 8;
_tc.width = 640; _tc.height = CH;
const _tx = _tc.getContext('2d', { willReadFrequently: true });
function _setFont() { _tx.font = `${FS}px "Fusion Pixel 12"`; }
function bmp(str) {
  let o = TC.get(str);
  if (o) return o;
  _setFont();
  const mw = Math.max(FB * 2, Math.min(640, Math.ceil(_tx.measureText(str).width) + FB * 2));
  _tc.width = mw; _tc.height = CH;
  _setFont();
  _tx.textBaseline = 'top';
  _tx.fillStyle = '#fff';
  _tx.clearRect(0, 0, mw, CH);
  _tx.fillText(str, FB, FB);
  const d = _tx.getImageData(0, 0, mw, CH).data;
  const w = Math.ceil(mw / FB), h = Math.ceil(CH / FB);
  const m = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let best = 0;
    for (let sj = 0; sj < FB; sj++) for (let si = 0; si < FB; si++) {
      const x = i * FB + si, y = j * FB + sj;
      if (x >= mw || y >= CH) continue;
      const a = d[(y * mw + x) * 4 + 3];
      if (a > best) best = a;
    }
    m[j * w + i] = best >= 90 ? 1 : 0;
  }
  o = { w, h, m };
  TC.set(str, o);
  return o;
}
function textW(str) { _setFont(); return Math.ceil(_tx.measureText(str).width / FB) + 1; }
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

