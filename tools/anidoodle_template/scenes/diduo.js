/* diduo · 低多边形（Auto-Video 自研画法脚本）
   媒介：手工投影的三角网格，每个面按法线与一束低光的夹角平涂；不用任何三维引擎。
   题材：湖与山，一束低阳压在山脊上，水面只剩倒影。
   实现：地形高度按"湖—坡—山"三段生成，透视投影、法线、远近排序都在本文件里算。 */
(() => {
  const W = 1920, H = 1080;
  const GX = 23, GY = 15;
  const X0 = -1500, X1 = 1500, Z0 = 90, Z1 = 1550;
  const YAW = 0.28;
  const CAM = { d: 1650, f: 1180, y: 210, oy: 0.45 };
  const SUN = (() => {
    const v = [-0.7, 0.5, -0.5];
    const n = Math.hypot(...v);
    return v.map(c => c / n);
  })();

  function heightAt(u, v) {
    if (v < 0.36) {
      return -46 + U.noise(u * 4.2, v * 3.1, 21) * 8;
    }
    const k = (v - 0.36) / 0.64;
    const ridge = 0.55 + 0.45 * U.noise(u * 2.6, v * 2.0, 4);
    const peak = Math.pow(k, 1.15) * 560 * ridge;
    const micro = U.noise(u * 9.5, v * 8.5, 9) * 92 * k;
    return peak + micro - 70;
  }

  const H_GRID = [];
  for (let j = 0; j < GY; j++) {
    H_GRID.push([]);
    for (let i = 0; i < GX; i++) H_GRID[j].push(heightAt(i / (GX - 1), j / (GY - 1)));
  }
  function world(i, j) {
    const x = U.lerp(X0, X1, i / (GX - 1));
    const z = U.lerp(Z0, Z1, Math.pow(j / (GY - 1), 0.82));
    return [x, H_GRID[Math.min(GY - 1, j)][Math.min(GX - 1, i)], z];
  }
  function project(p) {
    const cy = Math.cos(YAW), sy = Math.sin(YAW);
    const x = p[0] * cy - p[2] * sy;
    const z = p[0] * sy + p[2] * cy;
    const den = Math.max(320, CAM.d + z);
    const s = CAM.f / den;
    return [W / 2 + x * s, H * CAM.oy - (p[1] - CAM.y) * s, den, s];
  }
  function normalOf(a, b, c) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1;
    n = n.map(c2 => c2 / l);
    if (n[1] < 0) n = n.map(c2 => -c2);
    return n;
  }

  function build() {
    const tris = [];
    for (let j = 0; j < GY - 1; j++) {
      for (let i = 0; i < GX - 1; i++) {
        const a = world(i, j), b = world(i + 1, j), c = world(i, j + 1), d = world(i + 1, j + 1);
        [[a, b, c], [b, d, c]].forEach(tri => {
          const n = normalOf(tri[0], tri[1], tri[2]);
          const lit = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
          const pr = tri.map(project);
          const zAvg = (pr[0][2] + pr[1][2] + pr[2][2]) / 3;
          const hAvg = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
          tris.push({ pts: pr, lit, zAvg, hAvg, water: hAvg < -20 });
        });
      }
    }
    tris.sort((p, q) => q.zAvg - p.zAvg);
    return tris;
  }
  const TRIS = build();

  function colorFor(tr) {
    if (tr.water) {
      const k = U.clamp((tr.zAvg - 1100) / 900);
      const jitter = (U.hash(tr.lit * 97.3 + tr.hAvg * 3.1) - 0.5) * 16;
      return [U.lerp(34, 62, k) + jitter * 0.3, U.lerp(96, 138, k) + jitter * 0.55, U.lerp(122, 168, k) + jitter * 0.8];
    }
    const t = U.clamp(0.16 + tr.lit * 0.84);
    const g = U.clamp((tr.hAvg + 60) / 620);
    const lo = [64, 46, 70], midc = [150, 108, 104], hi = [236, 170, 118];
    // 明度 t 决定亮暗，海拔决定冷暖
    const base = [U.lerp(lo[0], midc[0], t), U.lerp(lo[1], midc[1], t), U.lerp(lo[2], midc[2], t)];
    return [
      U.lerp(base[0], hi[0], g * t * 0.9),
      U.lerp(base[1], hi[1], g * t * 0.7),
      U.lerp(base[2], hi[2], g * t * 0.35),
    ];
  }

  window.SCENES.diduo = {
    init: async () => {},
    draw(ctx, t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#241f3c');
      sky.addColorStop(0.38, '#54406a');
      sky.addColorStop(0.68, '#bd7468');
      sky.addColorStop(1, '#e9a97c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      const sunIn = U.easeOut(U.p(t, 0.1, 1.2));
      if (sunIn > 0) {
        ctx.save();
        ctx.globalAlpha = sunIn;
        const sx = W * 0.26, sy = H * 0.31;
        const halo = ctx.createRadialGradient(sx, sy, 8, sx, sy, 340);
        halo.addColorStop(0, 'rgba(255,236,196,0.5)');
        halo.addColorStop(1, 'rgba(255,204,138,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(sx - 360, sy - 360, 720, 720);
        ctx.fillStyle = '#ffeac6';
        ctx.beginPath();
        ctx.arc(sx, sy, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const grow = U.easeInOut(U.p(t, 0.45, 4.4));
      const n = Math.floor(TRIS.length * grow);
      ctx.save();
      ctx.lineJoin = 'round';
      for (let i = 0; i < n; i++) {
        const tr = TRIS[i];
        const p = tr.pts;
        const c = colorFor(tr);
        const col = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
        ctx.beginPath();
        ctx.moveTo(p[0][0], p[0][1]);
        ctx.lineTo(p[1][0], p[1][1]);
        ctx.lineTo(p[2][0], p[2][1]);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();

      // 倒影：太阳正下方的一串横向碎光，只在水面
      const refl = U.easeInOut(U.p(t, 3.9, 1.5));
      if (refl > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55 * refl;
        for (let i = 0; i < 22; i++) {
          const y = H * 0.63 + i * 15 + U.hash(i * 2.2) * 8;
          const w = 300 - i * 9 + U.hash(i * 5.5) * 60;
          if (w < 40) continue;
          const x = W * 0.26 + (U.hash(i * 3.1) - 0.5) * 60;
          ctx.fillStyle = i % 2 ? 'rgba(255,206,150,0.85)' : 'rgba(255,238,204,0.5)';
          ctx.beginPath();
          ctx.ellipse(x, y, w / 2, 5.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 水面：横向的细纹，近处松、远处密
      const waves = U.easeInOut(U.p(t, 4.4, 1.3));
      if (waves > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5 * waves;
        const r = U.rng(707);
        for (let i = 0; i < 60; i++) {
          const y = H * 0.56 + Math.pow(r(), 0.6) * H * 0.44;
          const len = 60 + r() * 190;
          const x = r() * W;
          ctx.strokeStyle = i % 3 ? 'rgba(255,222,176,0.16)' : 'rgba(58,96,124,0.18)';
          ctx.lineWidth = 1.4 + r() * 2.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len, y - 1 + r() * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      const vg = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.32, W * 0.5, H * 0.5, H * 1.0);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(18,12,26,0.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    },
  };
})();
