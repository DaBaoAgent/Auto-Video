// puguang · 双重曝光
// 鹿的体内是月下的松林，狼的体内是雪线的山脊，鹰的体内是河谷，
// 鲑的体内是它洄游的那条河，鲸的体内是一座海港 —— 最后鲸化了，海港露出来。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, rng } = FILM;
const W = 1920, H = 1080, CX = 950, CY = 530;

const SHOTS = [
  { t0: 0.0, t1: 1.95, kind: 'deer', scene: 'forest', scale: 1.02, x: 820, y: 566 },
  { t0: 1.95, t1: 3.6, kind: 'wolf', scene: 'ridge', scale: 1.0, x: 1150, y: 580 },
  { t0: 3.6, t1: 5.3, kind: 'eagle', scene: 'valley', scale: 1.15, x: 1020, y: 420 },
  { t0: 5.3, t1: 7.0, kind: 'salmon', scene: 'river', scale: 1.2, x: 1010, y: 700 },
  { t0: 7.0, t1: 10.0, kind: 'whale', scene: 'harbor', scale: 1.18, x: 900, y: 700 },
];

function animalPath(kind) {
  const p = new Path2D();
  const add = (q) => p.addPath(q);
  if (kind === 'deer') {
    add(FILM.smooth([[-190, 30], [-160, -46], [-40, -84], [90, -76], [156, -22], [146, 34], [40, 62], [-70, 64], [-158, 62]]));
    // 四条腿
    add(FILM.taper([-126, 34], [-152, 168], 27, 15));
    add(FILM.taper([-152, 168], [-160, 258], 15, 11));
    add(FILM.taper([-44, 46], [-62, 172], 24, 14));
    add(FILM.taper([-62, 172], [-68, 256], 14, 10));
    add(FILM.taper([92, 30], [106, 164], 24, 14));
    add(FILM.taper([106, 164], [98, 252], 14, 10));
    add(FILM.taper([150, 10], [178, 148], 22, 13));
    add(FILM.taper([178, 148], [170, 250], 13, 9));
    // 脖子、胸、头
    add(FILM.taper([44, -72], [100, -196], 58, 36));
    add(FILM.smooth([[74, -214], [148, -224], [210, -204], [214, -178], [152, -168], [98, -176]]));
    add(FILM.poly([[126, -214], [150, -256], [168, -212]]));
    // 鹿角
    add(FILM.taper([140, -220], [136, -330], 9, 4));
    add(FILM.taper([140, -272], [96, -316], 7, 3));
    add(FILM.taper([140, -300], [186, -344], 6, 3));
    add(FILM.taper([138, -250], [104, -262], 6, 3));
    add(FILM.taper([136, -330], [110, -378], 5, 2));
  }
  if (kind === 'wolf') {
    add(FILM.smooth([[-215, 14], [-172, -52], [-40, -74], [112, -58], [196, -12], [202, 42], [92, 70], [-60, 66], [-172, 56]]));
    add(FILM.taper([-142, 24], [-168, 154], 25, 15));
    add(FILM.taper([-168, 154], [-172, 246], 15, 11));
    add(FILM.taper([-22, 42], [-32, 162], 21, 12));
    add(FILM.taper([-32, 162], [-38, 248], 12, 9));
    add(FILM.taper([122, 26], [132, 156], 21, 12));
    add(FILM.taper([132, 156], [128, 246], 12, 9));
    add(FILM.taper([190, 10], [204, 140], 19, 11));
    add(FILM.taper([204, 140], [200, 246], 11, 9));
    // 胸、颈、头
    add(FILM.taper([152, -52], [214, -124], 44, 31));
    add(FILM.smooth([[194, -150], [272, -160], [322, -138], [320, -112], [260, -100], [208, -112]]));
    add(FILM.poly([[234, -154], [248, -202], [266, -152]]));
    add(FILM.poly([[272, -150], [296, -188], [300, -144]]));
    // 尾巴
    add(FILM.taper([-202, -32], [-296, -74], 36, 20));
    add(FILM.taper([-296, -74], [-340, -12], 20, 12));
  }
  if (kind === 'eagle') {
    // 身体
    add(FILM.smooth([[0, -34], [24, 6], [18, 62], [0, 76], [-18, 62], [-24, 6]]));
    // 尾羽
    add(FILM.poly([[-16, 56], [0, 132], [16, 56]]));
    // 左翼（后掠）
    add(FILM.smooth([[-16, -4], [-130, -54], [-320, -92], [-276, -34], [-152, 16], [-22, 30]]));
    // 右翼
    add(FILM.smooth([[16, -4], [130, -54], [320, -92], [276, -34], [152, 16], [22, 30]]));
    // 翼尖羽指
    add(FILM.poly([[-320, -92], [-352, -104], [-330, -70]]));
    add(FILM.poly([[-286, -80], [-322, -90], [-296, -52]]));
    add(FILM.poly([[320, -92], [352, -104], [330, -70]]));
    add(FILM.poly([[286, -80], [322, -90], [296, -52]]));
    // 头与喙
    add(FILM.smooth([[-18, -40], [0, -62], [18, -40], [8, -28], [-8, -28]]));
    add(FILM.poly([[14, -50], [44, -44], [12, -34]]));
  }  if (kind === 'salmon') {
    add(FILM.smooth([[-260, -8], [-166, -100], [0, -134], [166, -108], [258, -36], [246, 44], [124, 88], [-60, 90], [-202, 58]]));
    add(FILM.poly([[-240, -20], [-358, -96], [-342, 0], [-360, 96], [-234, 28]]));
    add(FILM.poly([[-46, -116], [22, -204], [84, -112]]));
    add(FILM.smooth([[84, 64], [158, 168], [90, 138], [38, 74]]));
    add(FILM.smooth([[236, -26], [312, -6], [296, 32], [224, 26]]));
    add(FILM.smooth([[0, -130], [30, -160], [56, -126], [24, -110]]));
  }
  if (kind === 'whale') {
    add(FILM.smooth([[-360, 24], [-256, -124], [0, -186], [280, -154], [424, -40], [424, 82], [242, 152], [-40, 164], [-264, 124]]));
    add(FILM.poly([[-332, 24], [-524, -82], [-472, 22], [-518, 122], [-322, 62]]));
    add(FILM.smooth([[58, 100], [188, 268], [50, 206], [-44, 114]]));
    add(FILM.smooth([[296, -86], [372, -148], [456, -134], [404, -66], [318, -50]]));
  }
  return p;
}

// —— 五片地景（每片都按「填进动物身体」的尺寸画）——
function drawForest(c, x, y, w, h, t) {
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#252c2f'); g.addColorStop(.5, '#5c6669'); g.addColorStop(.86, '#a3adae'); g.addColorStop(1, '#7d8788');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = 'rgba(246,246,238,.94)'; c.beginPath(); c.arc(x + w * .16, y - h * .12, Math.min(w, h) * .085, 0, 7); c.fill();
  FILM.mist(c, x + w * .16, y - h * .12, Math.min(w, h) * .2, Math.min(w, h) * .2, '#f0f2ec', .28);
  const rr = rng('stars-f');
  c.fillStyle = 'rgba(238,242,238,.75)';
  for (let i = 0; i < 34; i++) {
    const px = x - w / 2 + rr() * w, py = y - h / 2 + rr() * h * .3;
    c.globalAlpha = .3 + rr() * .6;
    c.beginPath(); c.arc(px, py, .8 + rr() * 1.4, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = 'rgba(48,56,58,.72)';
  c.beginPath(); c.moveTo(x - w / 2, y + h * .1); c.lineTo(x - w * .18, y - h * .12); c.lineTo(x + w * .06, y + h * .08); c.lineTo(x + w * .28, y - h * .06); c.lineTo(x + w / 2, y + h * .1); c.lineTo(x + w / 2, y + h / 2); c.lineTo(x - w / 2, y + h / 2); c.fill();
  const r = rng('pine');
  for (let i = 0; i < 15; i++) {
    const px = x - w / 2 + r() * w, py = y + h * .3 + r() * h * .18, ph = h * (.12 + r() * .2);
    c.fillStyle = `rgba(9,13,13,${.55 + r() * .35})`;
    c.beginPath(); c.moveTo(px, py - ph); c.lineTo(px + ph * .26, py); c.lineTo(px - ph * .26, py); c.fill();
  }
  FILM.mist(c, x, y + h * .18, w * .62, h * .1, '#d4dcdc', .26);
}

function drawRidge(c, x, y, w, h, t) {
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#20262a'); g.addColorStop(.46, '#6b7578'); g.addColorStop(1, '#bcc4c4');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  FILM.mist(c, x, y + h * .14, w * .56, h * .15, '#ecf0ee', .36);
  FILM.mist(c, x - w * .22, y + h * .24, w * .3, h * .1, '#f6f8f4', .30);
  c.fillStyle = '#1c2224';
  c.beginPath(); c.moveTo(x - w / 2, y + h * .12); c.lineTo(x - w * .26, y - h * .2); c.lineTo(x - w * .04, y + h * .04); c.lineTo(x + w * .12, y - h * .26); c.lineTo(x + w * .3, y + h * .06); c.lineTo(x + w / 2, y + h * .14); c.lineTo(x + w / 2, y + h / 2); c.lineTo(x - w / 2, y + h / 2); c.fill();
  c.strokeStyle = 'rgba(242,244,240,.62)'; c.lineWidth = Math.max(2.5, h * .008);
  c.beginPath(); c.moveTo(x - w * .26, y - h * .2); c.lineTo(x - w * .13, y - h * .04); c.stroke();
  c.beginPath(); c.moveTo(x + w * .12, y - h * .26); c.lineTo(x + w * .25, y - h * .04); c.stroke();
}

function drawValley(c, x, y, w, h, t) {
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#1f2528'); g.addColorStop(.42, '#7a8486'); g.addColorStop(1, '#d0d6d3');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  FILM.mist(c, x + w * .1, y - h * .1, w * .5, h * .17, '#f6f8f4', .34);
  c.fillStyle = 'rgba(36,42,42,.6)';
  c.beginPath(); c.moveTo(x - w / 2, y + h * .02); c.bezierCurveTo(x - w * .2, y - h * .12, x + w * .1, y + h * .0, x + w / 2, y - h * .08);
  c.lineTo(x + w / 2, y + h / 2); c.lineTo(x - w / 2, y + h / 2); c.fill();
  c.strokeStyle = 'rgba(228,236,234,.46)'; c.lineWidth = Math.max(5, h * .024);
  c.beginPath(); c.moveTo(x - w * .12, y - h * .06); c.bezierCurveTo(x + w * .04, y + h * .06, x + w * .2, y + h * .0, x + w * .36, y + h * .18); c.stroke();
  const r = rng('field');
  c.strokeStyle = 'rgba(28,34,34,.22)'; c.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) { const yy = y + h * .1 + i * h * .04; c.beginPath(); c.moveTo(x - w * .3, yy); c.lineTo(x + w * .3, yy + r() * 8); c.stroke(); }
}

function drawRiver(c, x, y, w, h, t) {
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#48585a'); g.addColorStop(.38, '#2c3836'); g.addColorStop(1, '#101716');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  FILM.mist(c, x, y - h * .32, w * .54, h * .13, '#d8e4e0', .34);
  const r = rng('river');
  for (let i = 0; i < 20; i++) {
    const px = x - w / 2 + r() * w, py = y - h * .32 + r() * h * .6;
    c.strokeStyle = `rgba(228,240,236,${.08 + r() * .18})`; c.lineWidth = 1.5 + r() * 3;
    c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 34, py - 9, px + 78, py); c.stroke();
  }
  c.strokeStyle = 'rgba(12,18,16,.62)'; c.lineWidth = 7;
  for (let i = 0; i < 13; i++) {
    const px = x - w / 2 + r() * w;
    c.beginPath(); c.moveTo(px, y + h * .5);
    c.quadraticCurveTo(px + Math.sin(t + i) * 22, y + h * .2, px + Math.sin(t * 1.4 + i) * 44, y - h * .12); c.stroke();
  }
  c.fillStyle = 'rgba(210,224,220,.10)';
  for (let i = 0; i < 26; i++) { const px = x - w / 2 + r() * w, py = y - h / 2 + r() * h; c.beginPath(); c.arc(px, py, 1 + r() * 2.5, 0, 7); c.fill(); }
}

function drawHarbor(c, x, y, w, h, t) {
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, '#1b2124'); g.addColorStop(.44, '#5b6668'); g.addColorStop(.76, '#a9b3b1'); g.addColorStop(1, '#616b6b');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  c.fillStyle = 'rgba(22,28,28,.58)'; c.fillRect(x - w / 2, y + h * .1, w, h * .4);
  c.strokeStyle = 'rgba(230,240,238,.2)'; c.lineWidth = 2.5;
  for (let i = 0; i < 9; i++) {
    const yy = y + h * .12 + i * h * .042;
    c.beginPath(); c.moveTo(x - w / 2, yy); c.bezierCurveTo(x - w * .1, yy - 5, x + w * .1, yy + 5, x + w / 2, yy); c.stroke();
  }
  const lx = x - w * .27, ly = y + h * .16, lh = h * .30;
  c.fillStyle = '#232b2d';
  c.beginPath(); c.moveTo(lx - lh * .1, ly); c.lineTo(lx - lh * .055, ly - lh); c.lineTo(lx + lh * .055, ly - lh); c.lineTo(lx + lh * .1, ly); c.closePath(); c.fill();
  c.fillStyle = '#eef2ec'; c.fillRect(lx - lh * .07, ly - lh * .72, lh * .14, lh * .13);
  FILM.glow(c, lx, ly - lh * 1.02, lh * .38, '#faf6e4', .6);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(lx, ly - lh * 1.02, lh * .045, 0, 7); c.fill();
  // 防波堤
  c.fillStyle = '#141b1c';
  c.beginPath(); c.moveTo(x + w * .04, y + h * .21); c.lineTo(x + w * .47, y + h * .17); c.lineTo(x + w * .47, y + h * .235); c.lineTo(x + w * .04, y + h * .275); c.fill();
  // 渔船
  for (let i = 0; i < 3; i++) {
    const bx = x + w * .14 + i * w * .12, by = y + h * .12 - i * h * .012;
    c.fillStyle = '#0d1314';
    c.beginPath(); c.moveTo(bx - h * .055, by); c.lineTo(bx + h * .055, by); c.lineTo(bx + h * .036, by + h * .028); c.lineTo(bx - h * .036, by + h * .028); c.fill();
    c.fillRect(bx - h * .007, by - h * .075, h * .014, h * .075);
    c.strokeStyle = 'rgba(230,236,230,.35)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(bx, by - h * .075); c.lineTo(bx + h * .03, by + h * .026); c.stroke();
  }
  // 港口灯
  const r = rng('town');
  for (let i = 0; i < 30; i++) {
    const px = x - w * .5 + r() * w * .36, py = y + h * .2 + r() * h * .09;
    c.fillStyle = `rgba(248,242,214,${.3 + r() * .55})`;
    c.fillRect(px, py, 4, 4);
  }
  c.fillStyle = '#0f1516';
  c.beginPath(); c.moveTo(x + w * .3, y + h * .31); c.lineTo(x + w * .3, y + h * .47); c.lineTo(x + w * .55, y + h * .47); c.lineTo(x + w * .53, y + h * .31); c.fill();
}

const TINT = { forest: 'rgba(46,120,130,.48)', ridge: 'rgba(92,96,168,.46)', valley: 'rgba(186,116,46,.48)', river: 'rgba(42,126,102,.46)', harbor: 'rgba(206,124,66,.48)' };
const SCENES = { forest: drawForest, ridge: drawRidge, valley: drawValley, river: drawRiver, harbor: drawHarbor };

// 剪影：白版与暗版各一张，轮廓只填一次（没有内部接缝）
const maskC = document.createElement('canvas'); maskC.width = W; maskC.height = H;
const mx = maskC.getContext('2d');
const darkC = document.createElement('canvas'); darkC.width = W; darkC.height = H;
const dx2 = darkC.getContext('2d');
const LAND = { x: 960, y: 640, w: 2500, h: 1560 };
let maskKey = null;

function buildMask(shot) {
  const key = shot.kind + '_' + shot.scale + '_' + shot.x + '_' + shot.y;
  if (maskKey === key) return;
  for (const [cv, col] of [[mx, '#fff'], [dx2, '#0a0e0e']]) {
    cv.setTransform(1, 0, 0, 1, 0, 0); cv.clearRect(0, 0, W, H);
    cv.fillStyle = col;
    cv.save(); cv.translate(shot.x, shot.y); cv.scale(shot.scale, shot.scale);
    cv.fill(animalPath(shot.kind));
    cv.restore();
  }
  maskKey = key;
}

const innerC = document.createElement('canvas'); innerC.width = W; innerC.height = H;
const ix = innerC.getContext('2d');

// 轮廓里：一条被装进动物身体的地平线（天、月、山脊、水面）
const INNER = {
  forest: ['#16303a', '#2d6a66', '#8fb9a8', '#0f2226'],
  ridge: ['#141a30', '#3c4a86', '#c9c6e2', '#0e1222'],
  valley: ['#2a1508', '#8a4a18', '#e8c188', '#1a0d05'],
  river: ['#0d2420', '#1f6a58', '#a8dcc8', '#08120f'],
  harbor: ['#1a1218', '#7a3a26', '#f0c08a', '#120a08'],
};

function innerLayer(shot, t, dx, dy) {
  ix.setTransform(1, 0, 0, 1, 0, 0); ix.globalCompositeOperation = 'source-over';
  ix.clearRect(0, 0, W, H);
  // 先在整幅上画一条地平线，再按轮廓裁掉（比例按动物的外框来）
  const bx = shot.x + dx, by = shot.y + dy, sc = shot.scale;
  const bw = 760 * sc, bh = 300 * sc, top = by - 150 * sc;
  const pal = INNER[shot.scene];
  const g = ix.createLinearGradient(0, top, 0, top + bh);
  g.addColorStop(0, pal[0]); g.addColorStop(.45, pal[1]); g.addColorStop(.62, pal[2]); g.addColorStop(1, pal[3]);
  ix.fillStyle = g; ix.fillRect(bx - bw / 2, top, bw, bh);
  // 月 / 低光
  const mx2 = bx - bw * .22, my2 = top + bh * .3, mr = bh * .13;
  ix.fillStyle = 'rgba(255,250,230,.95)';
  ix.beginPath(); ix.arc(mx2, my2, mr, 0, 7); ix.fill();
  // 山脊三条
  for (let k = 0; k < 3; k++) {
    const yy = top + bh * (.55 + k * .12);
    ix.fillStyle = `rgba(${k === 0 ? '18,24,30' : k === 1 ? '30,40,48' : '44,56,62'},${.75 - k * .12})`;
    ix.beginPath();
    ix.moveTo(bx - bw / 2, yy + bh * .3);
    for (let i = 0; i <= 8; i++) {
      const px = bx - bw / 2 + bw * i / 8;
      ix.lineTo(px, yy - Math.abs(Math.sin(i * 1.7 + k * 2.1)) * bh * (.16 + k * .03));
    }
    ix.lineTo(bx + bw / 2, yy + bh * .3);
    ix.closePath(); ix.fill();
  }
  // 水面反光
  ix.fillStyle = 'rgba(255,246,226,.16)';
  for (let i = 0; i < 7; i++) ix.fillRect(bx - bw * .3 + i * bw * .1, top + bh * .86, bw * .05, bh * .012);

  ix.globalCompositeOperation = 'destination-in';
  ix.save(); ix.translate(shot.x + dx, shot.y + dy); ix.scale(shot.scale, shot.scale);
  ix.fillStyle = '#fff'; ix.fill(animalPath(shot.kind));
  ix.restore();
  ix.globalCompositeOperation = 'source-atop';
  ix.fillStyle = TINT[shot.scene]; ix.fillRect(0, 0, W, H);
  ix.fillStyle = 'rgba(255,242,214,.10)'; ix.fillRect(0, 0, W, H);
  ix.globalCompositeOperation = 'source-over';
  return innerC;
}

function drawShot(c, shot, t, alpha) {
  if (alpha <= 0) return;
  const push = soft((t - shot.t0) / (shot.t1 - shot.t0));
  const dx = -push * 6;
  // 1) 地景
  c.save(); c.globalAlpha = alpha;
  SCENES[shot.scene](c, LAND.x, LAND.y, LAND.w - push * 80, LAND.h - push * 50, t);
  c.restore();
  // 2) 第二层地景：放大错位，screen 淡淡叠在天空里
  c.save();
  c.globalAlpha = alpha * .12;
  c.globalCompositeOperation = 'screen';
  SCENES[shot.scene](c, LAND.x - 90 + push * 50, LAND.y - 50, LAND.w * 1.4, LAND.h * 1.4, t);
  c.restore();
  // 3) 动物轮廓压暗成影
  buildMask(shot);
  c.save(); c.globalAlpha = alpha * .95; c.drawImage(darkC, dx, 0); c.restore();
  // 4) 轮廓里再曝一次地景
  c.save();
  c.globalAlpha = alpha * .72;
  c.globalCompositeOperation = 'screen';
  c.drawImage(innerLayer(shot, t, dx, 0), 0, 0);
  c.restore();
}
function drawCaption(c, t) {
  const k = soft((t - 9.0) / .6);
  if (k <= 0) return;
  c.save(); c.globalAlpha = k * .78;
  FILM.text(c, 'ONE COAST · FIVE LIVES', { x: 1840, y: 1004, align: 'right', size: 22, color: 'rgba(230,236,236,.78)', weight: 500, tracking: 5 });
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#0b0e0e');
  const camZ = 1.03 + soft(t / 10) * .09;
  c.save();
  c.translate(960, 520); c.scale(camZ, camZ); c.translate(-960, -520);
  for (const s of SHOTS) {
    const inA = s.t0 <= 0 ? 1 : soft((t - s.t0) / .5);
    const outA = s.t1 >= 10 ? 0 : soft((t - (s.t1 - .5)) / .5);
    const a = Math.max(0, Math.min(inA, 1 - outA));
    drawShot(c, s, t, a);
  }
  c.restore();
  // 结尾：鲸化成了真的海港
  const fin = soft((t - 8.35) / 1.1);
  if (fin > 0) {
    c.save(); c.globalAlpha = fin * .92;
    drawHarbor(c, 960, 530, 2200, 1420, t);
    c.fillStyle = 'rgba(8,10,10,.12)'; c.fillRect(-80, -80, 2200, 1300);
    c.restore();
  }
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(150,178,196,.22)'; c.fillRect(-100, -100, 2200, 1300);
  c.restore();
  FILM.grain(c, .18, 7);
  FILM.vignette(c, { inner: .30, outer: .94, a: .52 });
  FILM.letterbox(c, .045, '#000');
  drawCaption(c, t);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });











