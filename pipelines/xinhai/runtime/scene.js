/* 画法脚本：2016 新海诚光影 —— 纯代码，闭环在本管线 runtime/ 内
   《黄昏的河堤》——低日、长云、河面碎金、堤上两个看日落的人、电线与飞鸟。
   管线：①天空渐变 + 三层云（暗底椭团 + 偏太阳的受光核 + 整层糊后回叠，只做横向呼吸位移）
        → ②远岸剪影与窗灯 → ③河面倒影 + 太阳碎金列 + 波纹
        → ④堤与栏杆草（逆光）→ ⑤人物：扁平剪影 + 贴着剪影内沿的暖色逆光边
        → ⑥空气颗粒 → ⑦镜头光晕（弱核）＋泛光 → ⑧冷暖分离 */
SCENES['35_shinkai'] = (() => {
  const W = 1920, H = 1080, { clamp, rng } = U, P = PAINT, TAU = Math.PI * 2;
  const SUN = [1436, 566], HY = 616;
  const SIL = '#1c2740', SIL2 = '#101828', RIM = 'rgba(255,206,148,0.9)';

  // ---------- 云 ----------
  const cloudSet = (key, seed, o) => P.cached('sk2_' + key, W, H, (g) => {
    const r = rng(seed), blobs = [], tc = P.canvas(W, H), tg = tc.getContext('2d');
    for (let i = 0; i < o.n; i++) {
      const lane = o.lanes[i % o.lanes.length];
      const x = 220 + r() * (W - 440), y = lane + (r() - .5) * o.jit;
      blobs.push([x, y, o.r * (0.5 + r() * 0.9), o.stretch * (0.7 + r() * 0.6)]);
    }
    // 暗底
    blobs.forEach(([x, y, rr, st]) => {
      const gr = tg.createLinearGradient(0, y - rr * 0.7, 0, y + rr * 0.7);
      gr.addColorStop(0, o.dark0); gr.addColorStop(1, o.dark1);
      tg.fillStyle = gr;
      tg.beginPath(); tg.ellipse(x, y, rr * st, rr * 0.6, 0, 0, TAU); tg.fill();
    });
    // 受光：整块偏右上方的线性光（不用圆形核，免得读成一排光斑）
    tg.globalCompositeOperation = 'lighter';
    blobs.forEach(([x, y, rr, st]) => {
      const wHar = rr * st, hHar = rr * 0.6;
      const gr = tg.createLinearGradient(x - wHar * 0.2, y - hHar, x + wHar * 0.5, y + hHar);
      gr.addColorStop(0, o.lit0); gr.addColorStop(0.55, o.lit1); gr.addColorStop(1, 'rgba(255,255,255,0)');
      tg.fillStyle = gr;
      tg.beginPath(); tg.ellipse(x + wHar * 0.06, y - hHar * 0.16, wHar, hHar * 0.92, 0, 0, TAU); tg.fill();
    });
    tg.globalCompositeOperation = 'source-over';
    // 糊一层软影 + 叠回清晰层
    g.save(); g.filter = 'blur(7px)'; g.globalAlpha = 0.55; g.drawImage(tc, 0, 0); g.restore();
    g.globalAlpha = 0.62; g.drawImage(tc, 0, 0); g.globalAlpha = 1;
  });

  // ---------- 人物：剪影 + 内沿暖边 ----------
  const sil = (c, p, warm = true) => {
    c.fillStyle = SIL; c.fill(p);
    if (!warm) return;
    c.save(); c.clip(p); c.translate(-2.4, -1.2);
    c.strokeStyle = RIM; c.lineWidth = 2.6; c.lineJoin = 'round'; c.stroke(p);
    c.restore();
  };
  function person(c, t, x, y, s, kind, ph) {
    const br = Math.sin(t * 1.6 + ph) * 1.2;
    const breeze = Math.sin(t * 1.9 + ph) * 0.16 + Math.sin(t * 4.3 + ph) * 0.06;
    c.save(); c.translate(x, y + br); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    if (kind === 'girl') {
      const skirt = new Path2D();
      skirt.moveTo(-15, -96); skirt.lineTo(15, -96);
      skirt.quadraticCurveTo(27 + breeze * 30, -56, 32 + breeze * 46, -18);
      skirt.lineTo(-36 - breeze * 26, -18);
      skirt.quadraticCurveTo(-25, -58, -15, -96); skirt.closePath();
      sil(c, skirt);
      const torso = new Path2D();
      torso.moveTo(-13, -154); torso.lineTo(13, -154);
      torso.quadraticCurveTo(19, -122, 17, -92); torso.lineTo(-18, -92);
      torso.quadraticCurveTo(-20, -124, -13, -154); torso.closePath();
      sil(c, torso);
      c.strokeStyle = SIL; c.lineWidth = 8;
      c.beginPath(); c.moveTo(-6, -20); c.lineTo(-9, 3); c.stroke();
      c.beginPath(); c.moveTo(6, -20); c.lineTo(9, 3); c.stroke();
      // 头＋短发
      const head = new Path2D(); head.ellipse(0, -172, 16, 18, 0, 0, TAU);
      sil(c, head);
      c.fillStyle = SIL2;
      c.beginPath(); c.moveTo(-17, -178); c.quadraticCurveTo(-15, -199, 4, -199);
      c.quadraticCurveTo(19, -199, 17, -178);
      c.quadraticCurveTo(6, -188, -3, -186); c.quadraticCurveTo(-11, -186, -17, -178); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-16, -180); c.quadraticCurveTo(-28 - breeze * 12, -168, -24 - breeze * 16, -152);
      c.lineTo(-15, -157); c.quadraticCurveTo(-18, -170, -13, -178); c.closePath(); c.fill();
      // 手臂：一只抬起指太阳
      c.strokeStyle = SIL; c.lineWidth = 7;
      c.beginPath(); c.moveTo(-15, -144); c.lineTo(-25, -112); c.stroke();
      const ax = 48 + Math.sin(t * 2 + ph) * 5, ay = -198 + Math.cos(t * 2 + ph) * 7;
      c.beginPath(); c.moveTo(13, -146); c.lineTo(ax, ay); c.stroke();
    } else {
      const torso = new Path2D();
      torso.moveTo(-19, -172); torso.lineTo(17, -172);
      torso.quadraticCurveTo(25, -132, 23, -96); torso.lineTo(-25, -96);
      torso.quadraticCurveTo(-27, -136, -19, -172); torso.closePath();
      sil(c, torso);
      c.fillStyle = SIL; c.fillRect(-23, -102, 46, 86);
      c.strokeStyle = SIL; c.lineWidth = 9;
      c.beginPath(); c.moveTo(-9, -18); c.lineTo(-11, 3); c.stroke();
      c.beginPath(); c.moveTo(9, -18); c.lineTo(11, 3); c.stroke();
      const head = new Path2D(); head.ellipse(0, -188, 17, 19, 0, 0, TAU);
      sil(c, head);
      c.fillStyle = SIL2;
      c.beginPath(); c.ellipse(0, -199, 18, 13, 0, Math.PI, TAU); c.fill();
      c.strokeStyle = SIL; c.lineWidth = 7;
      c.beginPath(); c.moveTo(-20, -162); c.lineTo(-27, -112); c.stroke();
      c.beginPath(); c.moveTo(19, -162); c.lineTo(27, -112); c.stroke();
    }
    c.restore();
  }

  return {
    draw(c, lt, t) {
      // ① 天空
      const sg = c.createLinearGradient(0, 0, 0, HY + 10);
      sg.addColorStop(0, '#123f8e'); sg.addColorStop(0.34, '#2f7ec8'); sg.addColorStop(0.64, '#74b6dd');
      sg.addColorStop(0.87, '#ffd9a6'); sg.addColorStop(1, '#ffe9c0');
      c.fillStyle = sg; c.fillRect(0, 0, W, HY + 12);

      // 云（只做横向呼吸）
      c.drawImage(cloudSet('hi', 501, {
        n: 22, lanes: [92, 132, 172], jit: 26, r: 74, stretch: 2.9,
        dark0: '#aabfdd', dark1: '#8fa8cf', lit0: 'rgba(255,244,222,0.55)', lit1: 'rgba(226,236,250,0.2)',
      }), Math.sin(t * 0.5) * 26, 0);
      c.drawImage(cloudSet('mid', 733, {
        n: 16, lanes: [318, 366, 408], jit: 30, r: 96, stretch: 2.3,
        dark0: '#8ea7ce', dark1: '#6d87b6', lit0: 'rgba(255,240,214,0.55)', lit1: 'rgba(214,228,248,0.2)',
      }), Math.sin(t * 0.42 + 1) * 34, 24);
      c.drawImage(cloudSet('low', 917, {
        n: 12, lanes: [482, 522], jit: 22, r: 84, stretch: 2.6,
        dark0: '#7f97c2', dark1: '#5b73a5', lit0: 'rgba(255,236,204,0.55)', lit1: 'rgba(206,222,246,0.18)',
      }), Math.sin(t * 0.36 + 2) * 30, 52);

      // 太阳暖晕
      c.save(); c.globalCompositeOperation = 'screen';
      const halo = c.createRadialGradient(SUN[0], SUN[1], 10, SUN[0], SUN[1], 860);
      halo.addColorStop(0, 'rgba(255,250,226,0.85)'); halo.addColorStop(0.16, 'rgba(255,226,168,0.5)');
      halo.addColorStop(0.46, 'rgba(255,192,142,0.22)'); halo.addColorStop(1, 'rgba(255,170,140,0)');
      c.fillStyle = halo; c.fillRect(0, 0, W, H); c.restore();

      // ② 远岸：阶梯状楼群（矩形，别画成锯齿山）
      const far = new Path2D(); far.moveTo(0, HY + 4);
      const r1 = rng(1203);
      let bx = 0;
      while (bx < W) {
        const bw = 26 + r1() * 86, bh = 14 + r1() * 72;
        far.lineTo(bx, HY + 4 - bh); far.lineTo(bx + bw, HY + 4 - bh);
        far.lineTo(bx + bw, HY + 4 - bh * 0.66);
        bx += bw;
      }
      far.lineTo(W, HY + 4); far.closePath();
      c.fillStyle = '#3b4d73'; c.fill(far);
      c.save(); c.globalCompositeOperation = 'screen';
      const r2 = rng(77);
      for (let i = 0; i < 90; i++) {
        c.globalAlpha = 0.22 + r2() * 0.5; c.fillStyle = '#ffe2a8';
        c.fillRect(r2() * W, HY - 8 - r2() * 54, 2.4, 2.4);
      }
      c.restore();

      // ③ 河面
      const rg = c.createLinearGradient(0, HY, 0, 950);
      rg.addColorStop(0, '#b7cdde'); rg.addColorStop(0.3, '#7e98b7');
      rg.addColorStop(0.66, '#496084'); rg.addColorStop(1, '#2a3a52');
      c.fillStyle = rg; c.fillRect(0, HY, W, 950 - HY);
      // 天空在水里的暖色倒影（靠太阳一侧）
      c.save(); c.globalCompositeOperation = 'screen';
      const wr = c.createRadialGradient(SUN[0], HY + 40, 20, SUN[0], HY + 120, 420);
      wr.addColorStop(0, 'rgba(255,214,158,0.5)'); wr.addColorStop(1, 'rgba(255,214,158,0)');
      c.fillStyle = wr; c.fillRect(0, HY, W, 380); c.restore();
      // 碎金
      { const r = rng(4242);
        for (let i = 0; i < 54; i++) {
          const q = i / 54, y = HY + 6 + q * q * 300;
          const wHar = 14 + q * 74, x = SUN[0] + (r() - .5) * (16 + q * 96);
          const a = (0.62 - q * 0.42) * (0.45 + 0.55 * Math.sin(t * 3.1 + i * 1.7));
          c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = clamp(a, 0, 1);
          c.fillStyle = i % 3 ? '#fff2c8' : '#ffdfa6';
          c.fillRect(x - wHar / 2, y, wHar, 2 + q * 2.4);
          c.restore();
        }
      }
      // 波纹
      for (let i = 0; i < 15; i++) {
        const y = HY + 22 + i * 22;
        c.save(); c.globalAlpha = 0.09 + (i % 3) * 0.035; c.strokeStyle = '#e2f2ff'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(-20, y);
        for (let x = 0; x <= W; x += 110) c.lineTo(x, y + Math.sin(x / 110 + t * 1.1 + i) * 4);
        c.stroke(); c.restore();
      }

      // ④ 堤与栏杆
      const ledge = new Path2D();
      ledge.moveTo(-20, 902); ledge.quadraticCurveTo(700, 872, 1240, 856); ledge.lineTo(W + 20, 838);
      ledge.lineTo(W + 20, H + 20); ledge.lineTo(-20, H + 20); ledge.closePath();
      c.fillStyle = SIL; c.fill(ledge);
      const lit = new Path2D();
      lit.moveTo(-20, 900); lit.quadraticCurveTo(700, 870, 1240, 854); lit.lineTo(W + 20, 836);
      lit.lineTo(W + 20, 844); lit.lineTo(1240, 862); lit.quadraticCurveTo(700, 878, -20, 908); lit.closePath();
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,206,150,0.5)'; c.fill(lit); c.restore();
      c.strokeStyle = '#141e33'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-10, 806); c.quadraticCurveTo(700, 780, 1240, 762); c.lineTo(W + 20, 744); c.stroke();
      for (let x = -10; x < W + 20; x += 96) {
        const top = 806 - (x / W) * 62, bot = 902 - (x / W) * 62;
        c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot); c.stroke();
      }
      { const r = rng(31);
        for (let i = 0; i < 90; i++) {
          const x = r() * W, y = 900 - (x / W) * 62 + r() * 22, h = 20 + r() * 36;
          const sw = Math.sin(t * 2.4 + i * 0.6) * 8;
          c.strokeStyle = i % 3 ? '#16203a' : '#28374f'; c.lineWidth = 2 + (i % 2);
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sw * 0.4, y - h * 0.6, x + sw, y - h); c.stroke();
        }
      }

      // ⑤ 人
      person(c, t, 758, 874, 1.16, 'girl', 0.4);
      person(c, t, 968, 868, 1.3, 'boy', 2.1);

      // 电线杆与电线
      c.strokeStyle = '#141e33'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(1752, 96); c.lineTo(1760, 812); c.stroke();
      c.lineWidth = 12; c.beginPath(); c.moveTo(1712, 206); c.lineTo(1800, 202); c.stroke();
      c.lineWidth = 8; c.beginPath(); c.moveTo(1706, 262); c.lineTo(1806, 258); c.stroke();
      for (let k = 0; k < 3; k++) {
        const y0 = 196 + k * 22, sw = Math.sin(t * 1.1 + k) * 5;
        c.strokeStyle = 'rgba(20,30,52,0.9)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-20, y0 + 300 + k * 40);
        c.quadraticCurveTo(880, y0 + 240 + sw, 1752, y0); c.stroke();
      }
      for (let k = 0; k < 3; k++) {
        const bxx = 360 + t * 120 + k * 46, byy = 300 + k * 18 + Math.sin(t * 3 + k) * 8, f = Math.sin(t * 15 + k * 2) * 7;
        c.strokeStyle = '#16203a'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(bxx - 11, byy - f); c.lineTo(bxx, byy); c.lineTo(bxx + 11, byy - f); c.stroke();
      }

      // ⑥ 空气颗粒
      c.save(); c.globalCompositeOperation = 'screen';
      const motes = P.particles(46, 913, t * 0.6, { x0: 940, x1: 1720, y0: 900, y1: 250, speed: 20, drift: 30, life: 9 });
      motes.forEach((m, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 4.2 + i * 1.2)), rr = 1.4 + m.s * 2.4;
        const g2 = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, rr * 2.6);
        g2.addColorStop(0, `rgba(255,246,214,${0.7 * tw})`); g2.addColorStop(1, 'rgba(255,246,214,0)');
        c.fillStyle = g2; c.beginPath(); c.arc(m.x, m.y, rr * 2.6, 0, TAU); c.fill();
      });
      c.restore();

      // ⑦ 光晕（弱核）＋泛光
      P.lensFlare(c, SUN, t, { core: 64, rays: 0, streak: 420, ghosts: [[0.5, 26, '150,240,210', 0.05], [0.9, 16, '255,190,140', 0.07]] });
      P.bloom(c, { key: 'sk2Bloom', alpha: 0.22, brightness: 1.05 });

      // ⑧ 冷暖分离
      c.save(); c.globalCompositeOperation = 'soft-light';
      const tg = c.createLinearGradient(0, 0, W * 0.7, H);
      tg.addColorStop(0, 'rgba(120,170,255,.26)'); tg.addColorStop(0.55, 'rgba(255,214,180,.2)'); tg.addColorStop(1, 'rgba(255,180,120,.28)');
      c.fillStyle = tg; c.fillRect(0, 0, W, H); c.restore();
      const vg = c.createRadialGradient(W * 0.6, H * 0.5, 520, W * 0.6, H * 0.5, 1250);
      vg.addColorStop(0, 'rgba(10,20,40,0)'); vg.addColorStop(1, 'rgba(10,20,40,0.2)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
