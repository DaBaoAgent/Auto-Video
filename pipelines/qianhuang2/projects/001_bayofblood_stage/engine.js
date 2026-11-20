// 铅黄剪影 · qianhuang2 —— engine：画布、色板、光池／火盆／细环、颗粒/划痕/暗角与合成后处理
// 全部随机走 hash(t) 这类确定性函数：同一 t 每帧像素一致，禁 Date.now / Math.random。

  const W = 1920, H = 1080;
  const cvs = document.getElementById('c');
  const ctx = cvs.getContext('2d');

  const C = {
    ink:'#050406', blood:'#B3121F', blood2:'#E3232C', teal:'#0F6F63',
    amber:'#D89B3C', amber2:'#F2B24A', magenta:'#7A1E4B', bone:'#EFE3C8',
    night0:'#04060A', night1:'#0A1420', night2:'#102331',
    lake0:'#061619', lake1:'#0C3030', sand0:'#0D0A08', sand1:'#050505'
  };

  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const easeOut = p => 1 - Math.pow(1 - p, 3);

  // ---------- 基础绘制 ----------
  function lg(x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    return g;
  }
  function soft(x, y, rx, ry, inner, outer) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function glow(x, y, r, rgb, a) {
    soft(x, y, r, r, `rgba(${rgb},${a})`, `rgba(${rgb},0)`);
    soft(x, y, r * 0.62, r * 0.62, `rgba(${rgb},${a * 0.55})`, `rgba(${rgb},0)`);
    soft(x, y, r * 0.34, r * 0.34, `rgba(${rgb},${a * 0.42})`, `rgba(${rgb},0)`);
  }

  function fogBand(y, thick, rgb, a, t, seed) {
    const drift = Math.sin(t * 0.32 + (seed || 0)) * thick * 0.22;
    const g = ctx.createLinearGradient(0, y - thick + drift, 0, y + thick + drift);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(0.45, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, y - thick + drift, W, thick * 2);
  }

  function airFog(t, y, h, dark, light) {
    const dy = Math.sin(t * 0.28) * 14;
    ctx.fillStyle = lg(0, y + dy - h * 0.1, 0, y + dy + h, [[0, 'rgba(10,20,20,0)'], [0.55, `rgba(10,20,20,${dark})`], [1, 'rgba(10,20,20,0)']]);
    ctx.fillRect(0, y + dy - h * 0.1, W, h * 1.1);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    fogBand(y + dy + h * 0.4, h * 0.55, '168,188,184', light, t, y);
    ctx.restore();
  }

  // ---------- 舞台：地面光池 / 火盆 / 暗红细环（P2） ----------
  function lightPool(cx, cy, rx, ry, rgb, a) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.42, `rgba(${rgb},${a * 0.52})`);
    g.addColorStop(0.72, `rgba(${rgb},${a * 0.18})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function fireBowl(x, base, h, t) {
    const topY = base - h * 0.62;
    // 三脚架
    ctx.save();
    ctx.strokeStyle = '#080604';
    ctx.lineWidth = h * 0.016;
    ctx.lineCap = 'round';
    ctx.lineWidth = h * 0.020;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.20, base); ctx.lineTo(x - h * 0.055, topY);
    ctx.moveTo(x + h * 0.20, base); ctx.lineTo(x + h * 0.055, topY);
    ctx.moveTo(x, base + h * 0.015); ctx.lineTo(x, topY);
    ctx.stroke();
    ctx.restore();
    // 铜碗：碗体吃一点暖色渐变，碗口内壁透出膛火
    const bowlG = ctx.createLinearGradient(x, topY - h * 0.02, x, topY + h * 0.09);
    bowlG.addColorStop(0, '#2A1A0C');
    bowlG.addColorStop(0.45, '#140D07');
    bowlG.addColorStop(1, '#070504');
    ctx.fillStyle = bowlG;
    ctx.beginPath();
    ctx.ellipse(x, topY, h * 0.21, h * 0.050, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - h * 0.21, topY); ctx.lineTo(x - h * 0.13, topY + h * 0.085);
    ctx.lineTo(x + h * 0.13, topY + h * 0.085); ctx.lineTo(x + h * 0.21, topY);
    ctx.closePath(); ctx.fill();
    // 碗口膛火 + 碗沿反光
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,150,60,0.40)';
    ctx.beginPath();
    ctx.ellipse(x, topY - h * 0.002, h * 0.165, h * 0.032, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,176,96,0.50)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, topY, h * 0.21, h * 0.050, 0, 0.06, Math.PI - 0.06);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(216,155,60,0.22)';
    ctx.lineWidth = h * 0.008;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.195, base); ctx.lineTo(x - h * 0.058, topY);
    ctx.stroke();
    ctx.restore();

    // 火光：地面光池 + 火苗 + 火星
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    lightPool(x, base + h * 0.02, h * 0.85, h * 0.26, '255,168,72', 0.16);
    const fl = h * 0.30 * (0.72 + 0.28 * Math.sin(t * 7.4 + x * 0.02));
    ctx.fillStyle = 'rgba(242,178,74,0.85)';
    ctx.beginPath();
    ctx.moveTo(x, topY - fl);
    ctx.quadraticCurveTo(x + h * 0.085, topY - fl * 0.42, x + h * 0.052, topY - h * 0.005);
    ctx.quadraticCurveTo(x, topY + h * 0.030, x - h * 0.052, topY - h * 0.005);
    ctx.quadraticCurveTo(x - h * 0.085, topY - fl * 0.42, x, topY - fl);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const a = hash(i * 3.7 + t * 2.1) * Math.PI * 2;
      const r = h * (0.10 + hash(i * 5.1 + t) * 0.30);
      ctx.fillStyle = `rgba(255,${150 + (hash(i) * 70 | 0)},90,${0.18 + hash(i * 2) * 0.35})`;
      ctx.fillRect(x + Math.cos(a) * r, topY - fl * 0.5 + Math.sin(a) * r * 0.7, 2, 2);
    }
    ctx.restore();
  }

  function ringEdge(cx, cy, rx, ry, a, lw) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(179,18,31,${a})`;
    ctx.lineWidth = lw || 1.6;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function groundShadow(cx, cy, rx, ry, a) {
    ctx.save();
    ctx.fillStyle = `rgba(1,3,3,${a})`;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }



  // ---------- 后处理 ----------
  const grain = (() => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 320;
    const g = c.getContext('2d');
    const img = g.createImageData(320, 320);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + Math.random() * 130;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  })();
  const vig = (() => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(960, 540, 380, 960, 540, 1280);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(0.5, 'rgba(0,0,0,0.14)');
    rg.addColorStop(1, 'rgba(0,0,0,0.86)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5200; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      g.fillRect(x, y, 2, 2);
    }

    const edge = c.getContext('2d');
    edge.fillStyle = 'rgba(6,6,8,0.55)';
    edge.fillRect(0, 0, W, 26); edge.fillRect(0, H - 26, W, 26);
    edge.fillRect(0, 0, 26, H); edge.fillRect(W - 26, 0, 26, H);
    return c;
  })();
  const dirt = (() => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.filter = 'blur(34px)';
    for (let i = 0; i < 9; i++) {
      const x = hash(i * 3.7) * W, y = hash(i * 6.1) * H;
      const r = 110 + hash(i * 8.3) * 380;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(8,8,10,${0.05 + hash(i) * 0.07})`);
      rg.addColorStop(1, 'rgba(8,8,10,0)');
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(x, y, r, r * 0.72, hash(i * 2) * 3, 0, Math.PI * 2); g.fill();
    }
    g.filter = 'none';
    return c;
  })();

  function post(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#D2D2DA';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(dirt, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.17;
    const ox = -Math.floor(hash(t * 7) * 320), oy = -Math.floor(hash(t * 11) * 320);
    for (let x = ox; x < W; x += 320) for (let y = oy; y < H; y += 320) ctx.drawImage(grain, x, y);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(hash(t * 3 + i * 17) * W);
      const w = 1 + Math.floor(hash(t * 5 + i) * 2);
      ctx.fillStyle = `rgba(255,248,236,${0.03 + hash(t * 9 + i) * 0.06})`;
      ctx.fillRect(x, 0, w, H);
    }
    if (hash(t * 13) > 0.7) {
      ctx.fillStyle = 'rgba(255,250,240,0.22)';
      ctx.fillRect(Math.floor(hash(t * 19) * W), Math.floor(hash(t * 23) * H), 3, 3);
    }
    ctx.restore();

    ctx.drawImage(vig, 0, 0);

    const flash = (t * 30 % 12) < 1 ? 1 : 0;
    if (flash) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(0, 0, W, H);
    }
  }
