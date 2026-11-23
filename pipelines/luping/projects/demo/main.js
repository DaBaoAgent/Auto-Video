// luping · 像素小人搬家
// 一个八位机的小人，拖着一只箱子，从桌面的草坡走进那个白色的对话窗口。
// 最后他在窗口里挥手，对话框里打出一行 hello。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp } = FILM;
const W = 1920, H = 1080;
const S = 4;          // 一个像素 = 4 个屏幕像素
const BW = W / S, BH = H / S;

const low = document.createElement('canvas'); low.width = BW; low.height = BH;
const lx = low.getContext('2d');

const PAL = {
  sky0: '#7ec8e3', sky1: '#a9e0ee', cloud: '#ffffff', hill: '#7fbf7f', hill2: '#5aa35a',
  soil: '#8b6b3f', soil2: '#6d5230', grass: '#4f9b4f',
  skin: '#f2c79b', hair: '#3b2a1a', shirt: '#e8563f', pants: '#2f4f7f', shoe: '#20202a',
  case: '#c8862f', case2: '#8a5a1c',
  win: '#fbfbf8', side: '#ececea', ink: '#2b2b2b', sub: '#8a8a8a', accent: '#d97757', bubble: '#f1efea',
};

function px(x, y, w, h, col) { lx.fillStyle = col; lx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

function personWalk(x, y, frame, carry) {
  const bob = frame % 2 ? 0 : 1;
  const yy = y - bob;
  // 腿
  px(x + 2, yy, 3, 6, PAL.pants);
  px(x + 7, yy, 3, 6, PAL.pants);
  if (frame % 2) { px(x + 1, yy + 6, 4, 2, PAL.shoe); px(x + 7, yy + 6, 4, 2, PAL.shoe); }
  else { px(x + 3, yy + 6, 4, 2, PAL.shoe); px(x + 9, yy + 6, 4, 2, PAL.shoe); }
  // 身体
  px(x + 1, yy - 7, 10, 8, PAL.shirt);
  px(x + 1, yy - 7, 10, 2, '#f47a63');
  // 头
  px(x + 2, yy - 14, 8, 7, PAL.skin);
  px(x + 2, yy - 15, 8, 3, PAL.hair);
  px(x + 3, yy - 12, 2, 2, PAL.ink);
  // 手臂
  if (carry) { px(x - 2, yy - 6, 4, 3, PAL.skin); px(x + 9, yy - 6, 3, 3, PAL.skin); }
  else { px(x + 10, yy - 5, 3, 5, PAL.skin); px(x - 1, yy - 5, 3, 5, PAL.skin); }
}

function personWave(x, y, t) {
  px(x + 2, y, 3, 6, PAL.pants); px(x + 7, y, 3, 6, PAL.pants);
  px(x + 1, y + 6, 4, 2, PAL.shoe); px(x + 8, y + 6, 4, 2, PAL.shoe);
  px(x + 1, y - 7, 10, 8, PAL.shirt);
  px(x + 2, y - 14, 8, 7, PAL.skin);
  px(x + 2, y - 15, 8, 3, PAL.hair);
  px(x + 3, y - 12, 2, 2, PAL.ink);
  const up = Math.sin(t * 6) > 0 ? 0 : 2;
  px(x + 11, y - 10 + up, 3, 8, PAL.skin);
}

function suitcase(x, y) {
  px(x, y, 12, 9, PAL.case);
  px(x, y, 12, 2, PAL.case2);
  px(x + 4, y - 2, 4, 2, PAL.case2);
}

function drawWorld(t) {
  // 天空（色带）
  px(0, 0, BW, 60, PAL.sky0);
  px(0, 60, BW, 60, PAL.sky1);
  px(0, 120, BW, 50, '#c4ebf1');
  // 云
  const cl = [[30, 22], [140, 40], [260, 18], [400, 34]];
  cl.forEach(([cx, cy], i) => {
    const dx = (t * 4 + i * 30) % (BW + 120) - 60;
    px(dx, cy, 26, 6, PAL.cloud); px(dx + 6, cy - 5, 16, 5, PAL.cloud);
    px(dx + 30, cy + 2, 12, 4, PAL.cloud);
  });
  // 远山
  px(0, 168, BW, 60, PAL.hill2);
  for (let i = 0; i < 9; i++) { px(i * 60 - 10, 168 - (i % 2 ? 8 : 14), 44, 10, PAL.hill2); }
  px(0, 186, BW, 42, PAL.hill);
  // 地面
  px(0, 214, BW, 56, PAL.soil);
  px(0, 214, BW, 6, PAL.grass);
  for (let i = 0; i < 40; i++) px(i * 12 + (i % 3) * 3, 220 + (i % 4) * 8, 3, 2, PAL.soil2);
  // 草
  for (let i = 0; i < 26; i++) px(8 + i * 18, 208 - (i % 3), 2, 6, PAL.grass);
}

function drawWindow(t, charInside) {
  const x = 236, y = 18, w = 236, h = 250;
  // 窗口
  px(x, y, w, h, PAL.win);
  px(x, y, w, 1, '#dcdcd8');
  px(x + w - 1, y, 1, h, '#dcdcd8');
  px(x, y + h - 1, w, 1, '#dcdcd8');
  // 侧栏
  px(x, y, 52, h, PAL.side);
  px(x + 52, y, 1, h, '#d8d8d4');
  px(x + 8, y + 10, 16, 16, PAL.accent);
  for (let i = 0; i < 5; i++) px(x + 8, y + 40 + i * 14, 34, 5, '#cfcfcb');
  // 标题
  px(x + 66, y + 12, 60, 7, PAL.ink);
  px(x + 66, y + 22, 30, 4, PAL.sub);
  // 对话气泡
  px(x + 66, y + 40, 150, 34, PAL.bubble);
  px(x + 72, y + 47, 118, 4, '#bdbdb8');
  px(x + 72, y + 55, 92, 4, '#bdbdb8');
  px(x + 72, y + 63, 60, 4, '#bdbdb8');
  // 回复气泡（打字）
  const typing = soft((t - 7.8) / 1.2);
  if (typing > 0) {
    px(x + 66, y + 82, 150, 30, '#ffffff');
    const txt = 'hello, world';
    const n = Math.floor(txt.length * clamp(typing * 1.6));
    lx.save();
    lx.font = 'bold 9px monospace';
    lx.fillStyle = PAL.ink;
    lx.fillText(txt.slice(0, n), x + 72, y + 100);
    if (n < txt.length && Math.floor(t / .4) % 2) px(x + 72 + lx.measureText(txt.slice(0, n)).width, y + 92, 4, 10, PAL.ink);
    lx.restore();
  }
  // 输入框
  px(x + 66, y + 200, 150, 22, '#ffffff');
  px(x + 66, y + 200, 150, 1, '#dcdcd8');
  px(x + 66, y + 221, 150, 1, '#dcdcd8');
  px(x + 66, y + 200, 1, 22, '#dcdcd8');
  px(x + 215, y + 200, 1, 22, '#dcdcd8');
  px(x + 72, y + 207, 26, 5, '#c8c8c3');
  px(x + 196, y + 204, 12, 12, PAL.accent);
  if (charInside) personWave(x + 78, y + 160, t);
}

function frame(t) {
  // 低分辨率世界
  lx.imageSmoothingEnabled = false;
  drawWorld(t);
  drawWindow(t, t > 7.4);
  const walk = soft((t - .5) / 5.6);
  if (t < 7.4) {
    const cx = lerp(16, 200, walk);
    const yy = 208 - (Math.floor(t * 6) % 2 ? 0 : 1);
    suitcase(cx - 13, yy - 4);
    personWalk(cx, yy, Math.floor(t * 6), true);
  }
  // 扫过画面的暗角/扫描线只在低分辨率下画一点
  lx.globalAlpha = .10; lx.fillStyle = '#000';
  for (let y = 0; y < BH; y += 3) lx.fillRect(0, y, BW, 1);
  lx.globalAlpha = 1;

  const c = ENV.ctx;
  ENV.reset('#0b0f10');
  const camZ = 1.0 + soft(t / 10) * .06;
  c.save();
  c.imageSmoothingEnabled = false;
  c.translate(960, 540); c.scale(camZ * S, camZ * S); c.translate(-BW / 2, -BH / 2);
  c.drawImage(low, 0, 0);
  c.restore();
  // 轻微噪点，让像素更像屏幕
  FILM.grain(c, .06, 51);
  FILM.vignette(c, { inner: .42, outer: .96, a: .40 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });

