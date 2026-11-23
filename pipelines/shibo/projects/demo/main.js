// shibo · 示波器 · 方波的角
// 一台老式示波器正对着镜头。绿荧光屏上一条方波，上升沿带着 9% 的过冲和一点振铃。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

// 屏幕区域（1920×1080 坐标）
const S = { x: 300, y: 176, w: 1180, h: 640 };

function panel(c) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b2a26'); g.addColorStop(.5, '#1e1d1a'); g.addColorStop(1, '#141310');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,240,210,.03)';
  for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
  c.fillStyle = '#0d0c0a';
  c.fill(FILM.rect(S.x - 46, S.y - 46, S.w + 92, S.h + 92, 26));
  c.strokeStyle = 'rgba(255,240,210,.10)'; c.lineWidth = 2;
  c.stroke(FILM.rect(S.x - 46, S.y - 46, S.w + 92, S.h + 92, 26));
  [[S.x - 26, S.y - 26], [S.x + S.w + 26, S.y - 26], [S.x - 26, S.y + S.h + 26], [S.x + S.w + 26, S.y + S.h + 26]].forEach(([x, y]) => {
    c.fillStyle = '#3a3733'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.stroke();
  });
}

function screenBg(c) {
  const g = c.createRadialGradient(S.x + S.w / 2, S.y + S.h / 2, 40, S.x + S.w / 2, S.y + S.h / 2, S.w * .72);
  g.addColorStop(0, '#0b2a22'); g.addColorStop(.6, '#07180f'); g.addColorStop(1, '#020806');
  c.fillStyle = g; c.fillRect(S.x, S.y, S.w, S.h);
  c.strokeStyle = 'rgba(90,255,210,.20)'; c.lineWidth = 1;
  for (let i = 1; i < 10; i++) { const x = S.x + i * S.w / 10; c.beginPath(); c.moveTo(x, S.y); c.lineTo(x, S.y + S.h); c.stroke(); }
  for (let j = 1; j < 8; j++) { const y = S.y + j * S.h / 8; c.beginPath(); c.moveTo(S.x, y); c.lineTo(S.x + S.w, y); c.stroke(); }
  c.strokeStyle = 'rgba(90,255,200,.30)';
  for (let i = 0; i <= 10; i++) { const x = S.x + i * S.w / 10; c.beginPath(); c.moveTo(x, S.y + S.h / 2 - 6); c.lineTo(x, S.y + S.h / 2 + 6); c.stroke(); }
}

function wave(c, t, amp, col) {
  const cy = S.y + S.h * .56;
  const per = S.w / 3.4;
  const hi = cy - amp * S.h * .30;
  const lo = cy + amp * S.h * .14;
  const over = hi - amp * S.h * .30 * .09;
  const rise = per * .10;
  const pts = [];
  for (let k = 0; k <= 4; k++) {
    const x0 = S.x - per * .35 + k * per;
    pts.push([x0, lo], [x0 + per * .5, lo]);
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = x0 + per * .5 + u * rise * 2.8;
      let y;
      if (u < .28) {
        const q = u / .28;
        y = lerp(lo, hi, q) - (hi - over) * Math.sin(q * Math.PI) * .55;
      } else {
        const d = (u - .28) / .72;
        y = hi - (hi - over) * Math.exp(-d * 3.6) * Math.cos(d * Math.PI * 3.2);
      }
      pts.push([x, y]);
    }
    pts.push([x0 + per * .99, hi]);
  }
  c.strokeStyle = col;
  c.lineWidth = 3.2;
  c.beginPath();
  pts.forEach((p, i) => { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
  c.stroke();
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = 'rgba(90,255,190,.20)'; c.lineWidth = 10;
  c.beginPath(); pts.forEach((p, i) => { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.stroke();
  c.restore();
  return { cy, hi, lo, per, over };
}

function knob(c, x, y, r, ang) {
  c.fillStyle = '#171613'; c.beginPath(); c.arc(x, y, r + 8, 0, 7); c.fill();
  const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, '#3d3a34'); g.addColorStop(1, '#1b1a17');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,240,210,.16)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x + Math.cos(a) * r * .96, y + Math.sin(a) * r * .96); c.lineTo(x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86); c.stroke();
  }
  c.strokeStyle = 'rgba(255,244,220,.85)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * r * .82, y + Math.sin(ang) * r * .82); c.stroke();
  c.fillStyle = 'rgba(255,244,220,.14)'; c.beginPath(); c.arc(x, y, r * .18, 0, 7); c.fill();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#0b0a08');
  panel(c);

  c.save();
  c.globalCompositeOperation = 'lighter';
  FILM.glow(c, S.x + S.w / 2, S.y + S.h / 2, S.w * .8, '#3affc0', .07);
  c.restore();

  screenBg(c);

  const on = soft((t - .2) / .8);
  const flick = t < 1.6 ? (1 - soft((t - .2) / 1.3)) : 0;
  const gain = on * (1 - .10 * Math.sin(t * 62) * flick);
  c.save();
  c.globalAlpha = clamp(on, 0, 1);
  c.strokeStyle = 'rgba(90,255,190,.22)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(S.x, S.y + S.h * .56); c.lineTo(S.x + S.w, S.y + S.h * .56); c.stroke();

  const amp = clamp(gain, 0, 1) * (1 + .003 * Math.sin(t * 90));
  c.save(); c.beginPath(); c.rect(S.x + 2, S.y + 2, S.w - 4, S.h - 4); c.clip();
  const info = wave(c, t, amp, 'rgba(120,255,196,.95)');

  c.restore();
  const show = soft((t - 3.1) / .9);
  if (show > 0) {
    c.save(); c.globalAlpha = show;
    const px = S.x + S.w * .44;
    c.strokeStyle = 'rgba(255,220,120,.75)'; c.lineWidth = 2;
    c.setLineDash([6, 5]);
    c.beginPath(); c.moveTo(px - 200, info.over - 22); c.lineTo(S.x + S.w - 20, info.over - 22); c.stroke();
    c.beginPath(); c.moveTo(px - 200, info.hi); c.lineTo(S.x + S.w - 20, info.hi); c.stroke();
    c.setLineDash([]);
    const ay = (info.over - 22 + info.hi) / 2;
    c.beginPath(); c.moveTo(S.x + S.w - 46, info.hi); c.lineTo(S.x + S.w - 46, info.over - 22); c.stroke();
    c.beginPath(); c.moveTo(S.x + S.w - 52, info.hi - 12); c.lineTo(S.x + S.w - 46, info.hi); c.lineTo(S.x + S.w - 40, info.hi - 12); c.stroke();
    FILM.text(c, 'OVERSHOOT 9.2%', { x: S.x + 30, y: ay - 2, size: 22, align: 'left', color: '#ffe9a8', weight: 600, tracking: 3 });
    c.restore();
  }

  const rd = soft((t - 4.6) / .8);
  if (rd > 0) {
    c.save(); c.globalAlpha = rd;
    FILM.text(c, 'CH1  2.00 V/div', { x: S.x + S.w - 26, y: S.y + S.h - 54, size: 18, align: 'right', color: 'rgba(120,255,196,.55)', tracking: 2 });
    FILM.text(c, 'TRIG RISING 0.00V', { x: S.x + S.w - 26, y: S.y + S.h - 26, size: 18, align: 'right', color: 'rgba(120,255,196,.4)', tracking: 2 });
    c.restore();
  }
  c.restore();

  const gg = c.createLinearGradient(S.x, S.y, S.x + S.w * .7, S.y + S.h);
  gg.addColorStop(0, 'rgba(255,255,255,.10)'); gg.addColorStop(.4, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gg; c.fillRect(S.x, S.y, S.w, S.h);

  knob(c, 1420, 900, 54, lerp(-1.9, -1.1, soft((t - 4.5) / 3.5)));
  knob(c, 1590, 900, 42, lerp(-1.2, -.5, soft((t - 2.5) / 4)));
  knob(c, 1726, 900, 33, .7);
  FILM.text(c, 'HITACHI  V-152', { x: 300, y: 890, size: 30, color: 'rgba(240,232,214,.5)', weight: 600, tracking: 5 });
  FILM.text(c, 'OSCILLOSCOPE  20MHz', { x: 300, y: 926, size: 16, color: 'rgba(240,232,214,.26)', tracking: 7 });
  FILM.glow(c, 470, 1004, 42, '#ff5a3c', .5);
  c.fillStyle = '#ff6a4a'; c.beginPath(); c.arc(470, 1004, 5, 0, 7); c.fill();

  FILM.scanlines(c, 4, .10);
  FILM.vignette(c, { inner: .5, outer: 1, a: .55 });
  FILM.grain(c, .07, 33);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });




