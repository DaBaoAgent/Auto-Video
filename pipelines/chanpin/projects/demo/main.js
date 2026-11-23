// chanpin · 产品 · 光的形状
// 演棚里的玻璃耳机：开盖的充电盒、两颗悬在空中的耳塞，慢慢转。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

const CX = 960, CY = 470;
const FLOOR = 800;

function studio(c) {
  const g = c.createLinearGradient(0, 0, W * .8, H);
  g.addColorStop(0, '#243036'); g.addColorStop(.45, '#131b20'); g.addColorStop(1, '#080b0e');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const s = c.createRadialGradient(430, 80, 10, 520, 260, 1150);
  s.addColorStop(0, 'rgba(226,240,255,.42)'); s.addColorStop(.35, 'rgba(120,170,220,.12)'); s.addColorStop(1, 'rgba(120,170,220,0)');
  c.fillStyle = s; c.fillRect(0, 0, W, H);
  const h = c.createRadialGradient(CX, CY, 60, CX, CY, 640);
  h.addColorStop(0, 'rgba(240,250,255,.16)'); h.addColorStop(.5, 'rgba(140,200,255,.05)'); h.addColorStop(1, 'rgba(140,200,255,0)');
  c.fillStyle = h; c.fillRect(0, 0, W, H);
  const f = c.createLinearGradient(0, FLOOR, 0, H);
  f.addColorStop(0, '#141c22'); f.addColorStop(.4, '#0c1116'); f.addColorStop(1, '#060809');
  c.fillStyle = f; c.fillRect(0, FLOOR, W, H - FLOOR);
  c.strokeStyle = 'rgba(200,230,255,.16)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();
  FILM.glow(c, CX, FLOOR + 26, 560, '#a8d8ff', .16);
}

function bud(c, x, y, s, rot, tint) {
  c.save();
  c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const g2 = c.createLinearGradient(-22, 26, 22, 170);
  g2.addColorStop(0, 'rgba(255,255,255,.96)'); g2.addColorStop(.28, tint); g2.addColorStop(.7, 'rgba(150,175,198,.62)'); g2.addColorStop(1, 'rgba(238,244,250,.85)');
  c.fillStyle = g2;
  c.beginPath();
  c.moveTo(-17, 26); c.quadraticCurveTo(-26, 104, -15, 162);
  c.quadraticCurveTo(0, 172, 12, 160); c.quadraticCurveTo(19, 100, 11, 26);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-15, 40); c.quadraticCurveTo(-23, 104, -12, 152); c.stroke();
  const g = c.createLinearGradient(-58, -48, 52, 46);
  g.addColorStop(0, 'rgba(255,255,255,.97)'); g.addColorStop(.3, tint); g.addColorStop(.66, 'rgba(140,168,196,.60)'); g.addColorStop(1, 'rgba(250,252,255,.9)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(0, 0, 60, 50, -.3, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath(); c.ellipse(16, 8, 20, 24, .35, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3.5;
  c.beginPath(); c.ellipse(0, 0, 60, 50, -.3, Math.PI * 1.08, Math.PI * 1.5); c.stroke();
  c.fillStyle = 'rgba(70,82,94,.45)';
  c.beginPath(); c.ellipse(-26, 22, 12, 8, -.55, 0, 7); c.fill();
  c.restore();
}

function caseBox(c, x, y, s, lid) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const g = c.createLinearGradient(-180, -30, 150, 220);
  g.addColorStop(0, 'rgba(255,255,255,.88)'); g.addColorStop(.32, 'rgba(226,236,246,.56)'); g.addColorStop(.75, 'rgba(160,182,204,.42)'); g.addColorStop(1, 'rgba(246,250,255,.72)');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-180, 0); c.lineTo(180, 0); c.lineTo(180, 150);
  c.quadraticCurveTo(150, 210, 90, 214); c.lineTo(-90, 214);
  c.quadraticCurveTo(-150, 210, -180, 150);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(12,16,20,.55)';
  c.beginPath();
  c.moveTo(-166, 4); c.lineTo(166, 4); c.lineTo(166, 58);
  c.quadraticCurveTo(0, 86, -166, 58); c.closePath(); c.fill();
  c.fillStyle = 'rgba(6,8,10,.75)';
  c.beginPath(); c.ellipse(-76, 46, 40, 17, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(76, 46, 40, 17, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.28)';
  c.beginPath(); c.moveTo(-176, 12); c.lineTo(-186, 150); c.lineTo(-150, 150); c.lineTo(-140, 12); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.62)'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-180, 0); c.lineTo(-180, 150); c.quadraticCurveTo(-150, 210, -90, 214); c.lineTo(90, 214); c.quadraticCurveTo(150, 210, 180, 150); c.lineTo(180, 0); c.stroke();

  // 掀开的盖子
  const ly = -30 - lid;
  const lt = -.16 * lid / 40;
  c.save();
  c.translate(0, ly); c.rotate(lt);
  const lg = c.createLinearGradient(-170, -110, 170, 20);
  lg.addColorStop(0, 'rgba(255,255,255,.95)'); lg.addColorStop(.5, 'rgba(206,222,238,.6)'); lg.addColorStop(1, 'rgba(150,170,190,.45)');
  c.fillStyle = lg;
  c.beginPath();
  c.moveTo(-178, 0); c.lineTo(-176, -44); c.quadraticCurveTo(-166, -104, -110, -112);
  c.lineTo(110, -112); c.quadraticCurveTo(166, -104, 176, -44); c.lineTo(178, 0); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = 'rgba(16,20,26,.42)';
  c.beginPath(); c.moveTo(-172, -4); c.lineTo(-168, -46); c.quadraticCurveTo(-160, -96, -108, -104); c.lineTo(108, -104); c.quadraticCurveTo(160, -96, 168, -46); c.lineTo(172, -4); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath(); c.moveTo(-176, -8); c.lineTo(-120, -20); c.lineTo(-96, -104); c.lineTo(-150, -84); c.closePath(); c.fill();
  c.restore();
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#0b0908');
  const push = 1 + soft(t / 10) * .10;
  c.save();
  c.translate(W / 2, H * .52); c.scale(push, push); c.translate(-W / 2, -H * .52);
  studio(c);

  const open = 30 + soft(t / 6.5) * 20;
  caseBox(c, CX, FLOOR - 230, 1.0, open);

  const conv = soft((t - 5.4) / 3.2);
  const fl = Math.sin(t * 1.1) * 9;
  const bx = lerp(CX - 380, CX - 96, conv), by = lerp(300, FLOOR - 352, conv);
  const bx2 = lerp(CX + 420, CX + 96, conv), by2 = lerp(248, FLOOR - 352, conv);
  bud(c, bx, by + fl, 1.28, -.5 + conv * .18, 'rgba(208,230,248,.9)');
  bud(c, bx2, by2 - fl * 1.2, 1.18, .46 - conv * .2, 'rgba(232,238,246,.92)');

  if (conv > .6) {
    FILM.glow(c, CX, FLOOR - 190, 420, '#dff0ff', .16 * soft((conv - .6) / .4));
  }

  // 光带扫过
  const sw = soft((t - 3.6) / .9) - soft((t - 5.2) / .9);
  if (sw > 0) {
    const x = lerp(260, 1560, soft((t - 3.6) / 2.0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = .22 * sw;
    const bg = c.createLinearGradient(x - 90, 0, x + 90, 0);
    bg.addColorStop(0, 'rgba(240,250,255,0)'); bg.addColorStop(.5, 'rgba(230,246,255,.6)'); bg.addColorStop(1, 'rgba(240,250,255,0)');
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(x - 22, 0); c.lineTo(x + 22, 0); c.lineTo(x + 52, H); c.lineTo(x - 22, H); c.closePath(); c.fill();
    c.restore();
  }

  // 尘埃
  const rr = rng('dust');
  const pts = [];
  for (let i = 0; i < 90; i++) pts.push([rr(), rr(), rr()]);
  pts.forEach(([ux, uy, sp2]) => {
    const y = (uy * H + t * 14 * (0.4 + sp2)) % H;
    const x = ux * W + Math.sin(t * .5 + sp2 * 7) * 26;
    c.fillStyle = `rgba(255,244,226,${.05 + .16 * sp2})`;
    c.beginPath(); c.arc(x, y, .8 + sp2 * 2.2, 0, 7); c.fill();
  });

  const tt = soft((t - 7.2) / 1.2);
  if (tt > 0) {
    c.save(); c.globalAlpha = tt;
    FILM.text(c, 'AURA', { x: 108, y: 806, size: 96, color: 'rgba(255,248,236,.95)', weight: 700, tracking: 18 + (1 - tt) * 34 });
    FILM.text(c, '玻璃耳机 · 光的形状', { x: 116, y: 866, size: 24, color: 'rgba(206,232,255,.55)', tracking: 6 });
    c.restore();
  }

  c.restore();
  FILM.vignette(c, { inner: .42, outer: 1, a: .58 });
  FILM.grain(c, .05, 7);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });




