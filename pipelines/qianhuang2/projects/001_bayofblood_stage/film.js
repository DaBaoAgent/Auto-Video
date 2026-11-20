// 铅黄剪影 · qianhuang2 —— film：时间轴与逐帧入口
// 页面契约：window.READY / window.DUR / window.render(t)，render 必须幂等（同一 t 同一像素）。
// 改片子只动这里的两张表：DUR 与 SHOTS；画面内容去 world.js，人形去 cast.js。

const DUR = 21.462;

// 镜头表：左开右闭 [t0, t1)。时间码贴着配音走，改表等于改片子。
// card=true 的那一段在 post 之后压一张台标（1971 · 意大利 / G I A L L O）。
const SHOTS = [
  { name: 'mask',    t0: 0.00,  t1: 1.89,  draw: drawMask },
  { name: 'camp',    t0: 1.89,  t1: 6.68,  draw: drawCamp },      // 三人侧倒 2.35 / 3.55 / 4.45，各带一道血色扫光
  { name: 'rift',    t0: 6.68,  t1: 9.20,  draw: drawRift },      // 裂口两次跳动涨到六成
  { name: 'bay',     t0: 9.20,  t1: 11.80, draw: drawBayStatic }, // 1971 海湾：落日核 58px + 三层光晕 190/430/780
  { name: 'baycard', t0: 11.80, t1: 13.20, draw: drawBayStatic, card: true },
  { name: 'title',   t0: 13.20, t1: 15.09, draw: drawTitle },     // 拱门 + 片名 116px
  { name: 'reel',    t0: 15.09, t1: DUR,   draw: drawReel }       // 三条 35mm 胶片带 → 收拢 → 小片名 76px
];

function shotAt(t) {
  for (const s of SHOTS) if (t >= s.t0 && t < s.t1) return s;
  return SHOTS[SHOTS.length - 1];
}

function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  shotAt(t).draw(t);

  post(t);

  const shot = shotAt(t);
  if (shot.card || (t >= 11.8 && t < 13.2)) tagCard(t);
}

// —— 页面契约 ——
window.DUR = DUR;
window.render = render;   // 直接交函数引用；写成 t => render(t) 会因 function 声明本身就是 window.render 而自我递归
window.__seek = t => render(t);
window.__shots = SHOTS;
render(0);
window.READY = true;
window.__ready = true;
