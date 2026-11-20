// 铅黄剪影 · qianhuang2 —— world：面具 / 营地 / 裂口 / 海湾 / 片名 / 胶片与收束
// 每个场景只负责“这一屏画什么”，时间轴与镜头切分在 film.js。

  // ---------- 场景 1：面具 ----------
  function drawMask(t) {
    ctx.fillStyle = lg(0, 0, 0, H, [[0, '#04050A'], [0.45, '#070B12'], [1, '#020203']]);
    ctx.fillRect(0, 0, W, H);

    const p = clamp(t / 1.89, 0, 1);
    ctx.save();
    ctx.filter = 'blur(28px)';
    ctx.fillStyle = '#020304';
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 290 + Math.sin(i * 2.1) * 40;
      const h = 380 + hash(i * 4.2) * 260;
      ctx.beginPath();
      ctx.moveTo(x, H - 120); ctx.lineTo(x + 90, H - 120 - h); ctx.lineTo(x + 180, H - 120);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < 5; i++) {
      soft(320 + i * 380 + Math.sin(t * 0.4 + i) * 40, 520 + Math.sin(i * 1.7) * 80, 460, 300,
        'rgba(190,215,220,0.07)', 'rgba(190,215,220,0)');
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beam = lg(1700, -100, 500, 1100, [[0, 'rgba(150,205,215,0.16)'], [0.5, 'rgba(150,205,215,0.05)'], [1, 'rgba(150,205,215,0)']]);
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(1500, 0); ctx.lineTo(1920, 0); ctx.lineTo(700, 1080); ctx.lineTo(300, 1080); ctx.closePath(); ctx.fill();
    ctx.restore();

    const cx = 960, cy = 545 - (1 - easeOut(p)) * 30, s = (1 - 0.04 * (1 - p)) * 1.14;

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(-0.05); ctx.scale(s, s);

    ctx.shadowColor = 'rgba(150,18,24,0.20)'; ctx.shadowBlur = 150;
    ctx.save();
    ctx.filter = 'blur(24px)';
    ctx.fillStyle = 'rgba(8,9,12,0.88)';
    ctx.beginPath(); ctx.ellipse(0, 0, 180, 246, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    const mg = lg(-180, -230, 160, 220, [[0, '#EDE2CB'], [0.45, '#D6C8AB'], [1, '#96836A']]);
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(0, -244);
    ctx.bezierCurveTo(120, -244, 190, -140, 178, -18);
    ctx.bezierCurveTo(166, 120, 96, 244, 0, 244);
    ctx.bezierCurveTo(-96, 244, -166, 120, -178, -18);
    ctx.bezierCurveTo(-190, -140, -120, -244, 0, -244);
    ctx.closePath(); ctx.fill();

    ctx.globalCompositeOperation = 'multiply';
    const shade = lg(-190, -240, 130, 240, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(205,190,166,1)'], [1, 'rgba(108,94,78,1)']]);
    ctx.fillStyle = shade; ctx.fill();
    ctx.fillStyle = 'rgba(96,84,70,0.46)'; ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      soft(-150 + i * 12, -60 + i * 28, 26, 90, 'rgba(15,111,99,0.35)', 'rgba(15,111,99,0)');
    }
    for (let i = 0; i < 5; i++) {
      soft(170 - i * 10, -20 + i * 34, 18, 70, 'rgba(179,18,31,0.30)', 'rgba(179,18,31,0)');
    }
    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    soft(0, 20, 52, 150, 'rgba(126,106,84,0.42)', 'rgba(126,106,84,0)');
    soft(0, 44, 24, 78, 'rgba(96,80,64,0.52)', 'rgba(96,80,64,0)');
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(96,84,68,${0.07 + hash(i) * 0.09})`;
      const x = -108 + hash(i * 3.3) * 216, y = -180 + hash(i * 5.1) * 320;
      ctx.beginPath(); ctx.ellipse(x, y, 10 + hash(i * 7) * 20, 7 + hash(i * 2) * 13, hash(i) * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    soft(0, 50, 16, 26, 'rgba(250,238,214,0.30)', 'rgba(250,238,214,0)');
    ctx.restore();

    const eye = (sx, rot) => {
      ctx.save(); ctx.translate(sx, -58); ctx.rotate(rot);
      ctx.fillStyle = '#04050A';
      ctx.beginPath(); ctx.ellipse(0, 0, 47, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(92,8,12,0.42)';
      ctx.beginPath(); ctx.ellipse(0, 6, 30, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(236,222,196,0.20)';
      ctx.beginPath(); ctx.ellipse(0, -9, 40, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    eye(-68, 0.12); eye(68, -0.12);

    ctx.fillStyle = '#060708';
    ctx.fillRect(-35, 94, 70, 8);
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = 'rgba(152,134,110,0.5)';
      ctx.fillRect(i * 14, 89, 2, 18);
    }

    ctx.strokeStyle = 'rgba(70,58,44,0.45)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-124, -152); ctx.lineTo(-100, -110); ctx.lineTo(-112, -72); ctx.lineTo(-88, -26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(122, -100); ctx.lineTo(104, 38); ctx.lineTo(114, 98);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      const y = -196 + i * 122;
      ctx.fillStyle = 'rgba(90,74,58,0.10)';
      ctx.fillRect(-170 + Math.abs(i - 1) * 10, y, 340 - Math.abs(i - 1) * 20, 2);
    }

    // ---- 脏化：油污、霉斑、血痕、磨损、粗糙面 ----
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 12; i++) {
      const dx = -152 + hash(i * 2.7) * 304;
      const dy = -206 + hash(i * 4.3) * 402;
      const rr = 20 + hash(i * 6.1) * 68;
      soft(dx, dy, rr, rr * (0.62 + hash(i) * 0.6), 'rgba(72,62,50,0.55)', 'rgba(72,62,50,0)');
    }
    for (let i = 0; i < 4; i++) {
      const dx = -112 + hash(i * 9.1) * 224;
      soft(dx, 34, 10 + hash(i) * 16, 152, 'rgba(64,54,44,0.44)', 'rgba(64,54,44,0)');
    }
    soft(-128, -176, 74, 62, 'rgba(56,48,40,0.55)', 'rgba(56,48,40,0)');
    soft(96, 128, 92, 70, 'rgba(58,50,42,0.48)', 'rgba(58,50,42,0)');
    ctx.restore();

    ctx.fillStyle = 'rgba(74,6,10,0.42)';
    ctx.beginPath();
    ctx.moveTo(-73, -34); ctx.lineTo(-68, 34);
    ctx.quadraticCurveTo(-67, 74, -70, 104); ctx.lineTo(-64, 104);
    ctx.quadraticCurveTo(-62, 70, -63, 34); ctx.lineTo(-68, -34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(74,6,10,0.34)';
    ctx.beginPath();
    ctx.moveTo(65, -34); ctx.lineTo(60, 46);
    ctx.quadraticCurveTo(58, 96, 52, 136); ctx.lineTo(58, 137);
    ctx.quadraticCurveTo(64, 94, 66, 46); ctx.lineTo(70, -34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(60,6,10,0.22)';
    soft(-69, 112, 9, 14, 'rgba(60,6,10,0.5)', 'rgba(60,6,10,0)');
    soft(55, 146, 8, 12, 'rgba(60,6,10,0.45)', 'rgba(60,6,10,0)');

    for (let i = 0; i < 300; i++) {
      const sx = (hash(i * 1.7) - 0.5) * 348;
      const sy = (hash(i * 3.9) - 0.5) * 468;
      if ((sx / 180) * (sx / 180) + (sy / 240) * (sy / 240) > 1) continue;
      ctx.fillStyle = `rgba(54,46,38,${0.09 + hash(i * 5.3) * 0.22})`;
      ctx.fillRect(sx, sy, 1 + hash(i * 9.7) * 3, 1 + hash(i * 2.1) * 2);
    }

    for (let i = 0; i < 78; i++) {
      const yy = (hash(i * 4.7) - 0.5) * 466;
      const xx = Math.sqrt(Math.max(0, 1 - (yy / 241) * (yy / 241))) * 182 * (hash(i * 6.3) > 0.5 ? 1 : -1);
      ctx.fillStyle = `rgba(48,40,32,${0.20 + hash(i * 2.3) * 0.36})`;
      ctx.beginPath();
      ctx.ellipse(xx * (0.93 + hash(i * 9.1) * 0.09), yy, 2 + hash(i * 5.9) * 6, 2 + hash(i * 8.1) * 5, hash(i) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    glow(960, 545, 620, '10,20,26', 0.35);
  }

  // ---------- 场景 2：湖岸营地 ----------
  function drawCamp(t) {
    ctx.fillStyle = lg(0, 0, 0, 700, [[0, C.night0], [0.4, C.night1], [1, C.night2]]);
    ctx.fillRect(0, 0, W, 620);

    for (let i = 0; i < 40; i++) {
      const x = hash(i * 3.3) * W, y = hash(i * 7.7) * 420;
      if (hash(i * 11.1) > 0.5) {
        ctx.fillStyle = `rgba(200,225,235,${0.15 + hash(i) * 0.35})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    glow(1566, 152, 260, '170,210,220', 0.16);
    const moonG = ctx.createRadialGradient(1566, 152, 6, 1566, 152, 54);
    moonG.addColorStop(0, '#F2F7F0'); moonG.addColorStop(0.5, '#CFDEDD'); moonG.addColorStop(1, '#7F9397');
    ctx.fillStyle = moonG;
    ctx.beginPath(); ctx.arc(1566, 152, 54, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = lg(0, 540, 0, 640, [[0, '#070E16'], [1, '#020304']]);
    ctx.beginPath();
    ctx.moveTo(0, 640);
    for (let x = 0; x <= W; x += 10) {
      const y = 570 + Math.sin(x * 0.0038) * 24 + Math.sin(x * 0.0105 + 1.4) * 13 + Math.sin(x * 0.026 + 2.6) * 5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, 640); ctx.closePath(); ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(22px)';
    for (const [px, py, rot] of [[1520, 0, 0.30], [930, 0, 0.37]]) {
      ctx.save();
      ctx.translate(px, py); ctx.rotate(rot);
      const g = ctx.createLinearGradient(0, 0, 0, 1180);
      g.addColorStop(0, 'rgba(176,218,224,0.14)'); g.addColorStop(0.65, 'rgba(176,218,224,0.05)'); g.addColorStop(1, 'rgba(176,218,224,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-78, -120, 156, 1300);
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = lg(0, 620, 0, 905, [[0, C.lake0], [0.6, C.lake1], [1, '#04100F']]);
    ctx.fillRect(0, 620, W, 285);
    ctx.fillStyle = lg(0, 760, 0, 905, [[0, 'rgba(2,8,8,0)'], [1, 'rgba(2,8,8,0.72)']]);
    ctx.fillRect(0, 760, W, 145);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const w = 210 - i * 12;
      soft(1566, 656 + i * 18, w, 10, 'rgba(150,205,200,0.10)', 'rgba(150,205,200,0)');
    }
    for (let i = 0; i < 40; i++) {
      const y = 640 + i * 6.6, x = 120 + hash(i * 5.1 + t * 0.6) * 1680;
      ctx.fillStyle = `rgba(120,190,185,${0.04 + hash(i) * 0.09})`;
      ctx.fillRect(x, y, 30 + hash(i * 2) * 130, 2);
    }
    ctx.restore();

    ctx.fillStyle = lg(0, 900, 0, 1080, [[0, C.sand0], [1, C.sand1]]);
    ctx.fillRect(0, 900, W, 180);

    // 松林：分枝锯齿轮廓，不再用几何折线
    const pine = (x, base, h, w, seed, rimA) => {
      const tipY = base - h;
      const n = 8 + Math.floor(hash(seed * 1.3) * 5);
      const right = [];
      for (let k = 1; k <= n; k++) {
        const f = k / n;
        const yy = tipY + h * Math.pow(f, 0.90);
        const ww = w * 0.5 * Math.pow(f, 1.26) * (0.62 + hash(seed + k * 3.1) * 0.55);
        right.push([x + ww, yy + h * 0.012 * (hash(seed + k * 5.3) - 0.5)]);
        right.push([x + ww * (0.28 + hash(seed + k * 7.7) * 0.32), yy - h * 0.050 * (0.5 + hash(seed + k * 9.1))]);
      }
      const left = right.map(p => [2 * x - p[0], p[1]]);
      ctx.fillStyle = '#020304';
      ctx.beginPath();
      ctx.moveTo(x, tipY);
      for (const p of right) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(x + w * 0.10, base);
      ctx.lineTo(x - w * 0.10, base);
      for (let i = left.length - 1; i >= 0; i--) ctx.lineTo(left[i][0], left[i][1]);
      ctx.closePath();
      ctx.fill();
      if (rimA) {
        ctx.save();
        ctx.strokeStyle = `rgba(34,126,116,${rimA})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, tipY);
        for (const p of left) ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        ctx.restore();
      }
    };

    // 远岸林带：压在水面后，制造纵深
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = '#020305';
    let bx = -40;
    for (let i = 0; i < 22 && bx < W + 80; i++) {
      bx += 70 + hash(i * 2.3) * 90;
      const hh = 40 + hash(i * 3.7) * 110;
      pine(bx, 590 + hash(i * 5.1) * 14, hh, 26 + hash(i * 7.9) * 44, i * 11, 0);
    }
    ctx.restore();

    [[46, 908, 470, 86, 1], [210, 908, 356, 64, 2], [372, 906, 398, 72, 3],
     [1782, 908, 462, 84, 5], [1892, 906, 320, 58, 6]]
      .forEach(a => {
        ctx.save();
        ctx.shadowColor = 'rgba(15,111,99,0.45)'; ctx.shadowBlur = 16;
        pine(a[0], a[1], a[2], a[3], a[4] * 13.7, 0.26);
        ctx.restore();
      });

    // 篝火
    const fx = 430, fy = 856;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    soft(fx, fy, 150, 118, 'rgba(216,155,60,0.30)', 'rgba(216,155,60,0)');
    soft(fx, fy, 72, 62, 'rgba(242,178,74,0.35)', 'rgba(242,178,74,0)');
    for (let i = 0; i < 14; i++) {
      const a = hash(i * 3.1 + t * 2) * Math.PI * 2;
      const r = 20 + hash(i * 5.3 + t) * 70;
      ctx.fillStyle = `rgba(240,${150 + hash(i) * 60 | 0},70,${0.25 + hash(i * 2) * 0.4})`;
      ctx.fillRect(fx + Math.cos(a) * r, fy - 20 + Math.sin(a) * r * 0.6, 3, 3);
    }
    ctx.restore();
    const fl = 34 + Math.sin(t * 9) * 7;
    ctx.fillStyle = '#F2B24A';
    ctx.beginPath();
    ctx.moveTo(fx, fy - fl); ctx.quadraticCurveTo(fx + 16, fy - fl / 2, fx + 10, fy);
    ctx.quadraticCurveTo(fx, fy + 10, fx - 10, fy);
    ctx.quadraticCurveTo(fx - 16, fy - fl / 2, fx, fy - fl);
    ctx.fill();

    // 帐篷
    const tent = (cx, base, w, h) => {
      const g = ctx.createLinearGradient(cx - w, base, cx + w, base - h);
      g.addColorStop(0, '#0E0A05'); g.addColorStop(0.55, '#6B4620'); g.addColorStop(1, '#160E07');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx - w, base); ctx.lineTo(cx, base - h); ctx.lineTo(cx + w, base); ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      soft(cx, base - h * 0.32, w * 0.40, h * 0.40, 'rgba(238,160,64,0.18)', 'rgba(238,160,64,0)');
      ctx.restore();
      ctx.fillStyle = 'rgba(8,6,3,0.92)';
      ctx.beginPath(); ctx.moveTo(cx - w * 0.22, base); ctx.lineTo(cx, base - h * 0.52); ctx.lineTo(cx + w * 0.22, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(216,155,60,0.30)';
      ctx.beginPath(); ctx.moveTo(cx - w * 0.11, base); ctx.lineTo(cx, base - h * 0.40); ctx.lineTo(cx + w * 0.11, base); ctx.closePath(); ctx.fill();
    };
    tent(650, 880, 108, 146);
    tent(860, 868, 84, 104);

    // P2 舞台：月光池 + 两盏火盆 + 暗红细环，她站在光里
    lightPool(1604, 862, 292, 62, '150,205,200', 0.17);
    fireBowl(1456, 878, 130, t);
    fireBowl(1750, 876, 124, t);
    ringEdge(1604, 864, 208, 44, 0.15, 1.4);
    groundShadow(1604, 876, 96, 13, 0.55);

    // 她：营地前景，背对镜头望着湖面；3.5 s 起肩先动、头后到，4.2 s 完成半转回头
    const mBody = easeInOut(clamp((t - 3.50) / 0.62, 0, 1));
    const mHead = easeInOut(clamp((t - 3.76) / 0.52, 0, 1));
    const mHip = easeInOut(clamp((t - 3.64) / 0.58, 0, 1));
    const herPose = mixPose(POSES.back, POSES.glance, mBody);
    herPose.headYaw = POSES.back.headYaw + (POSES.glance.headYaw - POSES.back.headYaw) * mHead;
    const mHeadLag = easeInOut(clamp((t - 0.066 - 3.76) / 0.52, 0, 1));
    herPose.headYawLag = POSES.back.headYaw + (POSES.glance.headYaw - POSES.back.headYaw) * mHeadLag;
    herPose.hip = POSES.back.hip + (POSES.glance.hip - POSES.back.hip) * mHip;
    woman(1604, STAGE_Y, 372, { pose: herPose, t });
    // 营地群像：火边的第二个女人，侧身，裙摆被火光照到一点
    woman(548, STAGE_Y + 2, 324, { flip: true, rot: -0.03, belt: false, pose: 'back', t });

    const falls = [
      { x: 966, at: 2.35 },
      { x: 1218, at: 3.55 },
      { x: 1424, at: 4.45 }
    ];
    falls.forEach((f, i) => {
      const p = clamp((t - f.at) / 0.62, 0, 1);
      if (p > 0 && p < 1.4) {
        const q = p / 1.4;
        const wb = 290 + hash(i * 7.7) * 330;
        const a = (0.24 + hash(i * 3.3) * 0.12) * Math.pow(1 - q, 2);
        const sx = -300 + (W + 600) * easeOut(Math.min(1, p / 0.85));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(sx - wb, 0, sx + wb, 0);
        g.addColorStop(0, 'rgba(179,18,31,0)');
        g.addColorStop(0.42, `rgba(238,46,44,${a * 0.14})`);
        g.addColorStop(0.55, `rgba(238,46,44,${a})`);
        g.addColorStop(0.68, `rgba(238,46,44,${a * 0.12})`);
        g.addColorStop(1, 'rgba(179,18,31,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = `rgba(179,18,31,${a * 0.10})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      if (p < 0.46) {
        ctx.fillStyle = 'rgba(1,3,3,0.6)';
        ctx.beginPath(); ctx.ellipse(f.x - 128, 866, 134, 14, 0, 0, Math.PI * 2); ctx.fill();
        figure(f.x, STAGE_Y, 350, { rot: easeInOut(p / 0.46) * 1.30, rim: 'rgba(15,111,99,0.85)' });
      } else {
        ctx.fillStyle = 'rgba(1,3,3,0.5)';
        ctx.beginPath(); ctx.ellipse(f.x - 82, 868, 158, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(f.x - 52, 0); ctx.scale(0.84, 1); ctx.translate(-(f.x - 52), 0);
        lying(f.x - 52, STAGE_Y, 330, 'rgba(15,111,99,0.8)');
        ctx.restore();
      }
    });

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lg(0, 0, W, 0, [[0, 'rgba(120,180,190,0)'], [0.74, 'rgba(120,180,190,0.06)'], [1, 'rgba(120,180,190,0)']]);
    ctx.fillRect(0, 640, W, 300);
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      soft(300 + i * 500, 880 + Math.sin(i * 2 + t * 0.3) * 40, 620, 200, 'rgba(150,190,190,0.05)', 'rgba(150,190,190,0)');
    }
    airFog(t, 646, 210, 0.10, 0.05);
    airFog(t, 900, 130, 0.14, 0.03);
  }

  // ---------- 场景 3：裂口 ----------
  function riftPoints(t) {
    const p = clamp((t - 6.68) / 2.0, 0, 1);
    const R = 120 + easeInOut(p) * 690;
    const pts = [];
    const n = 110;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const wob = 1 + 0.20 * Math.sin(a * 3 + 1.1) + 0.13 * Math.sin(a * 7 - 2.3) + 0.09 * Math.sin(a * 13 + 0.6);
      const rr = R * Math.max(0.32, wob) * (0.92 + hash(i * 4.7) * 0.17);
      pts.push([960 + Math.cos(a) * rr * 1.42, 540 + Math.sin(a) * rr * 0.96]);
    }
    return pts;
  }
  function drawRift(t) {
    drawCamp(6.68);
    const pts = riftPoints(t);
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
    };

    // 底下那一层：先从她肩背的局部放大起，随裂口张开再退成整片海湾
    const pz = easeInOut(clamp((t - 6.68) / 1.55, 0, 1));
    const zs = 1.78 + (1.16 - 1.78) * (pz * pz);
    const zax = 1746 + (960 - 1746) * pz * pz;
    const zay = 706 + (540 - 706) * pz * pz;
    ctx.save();
    trace(); ctx.clip();
    ctx.translate(960, 540); ctx.scale(zs, zs); ctx.translate(-zax, -zay);
    drawBayStatic(6.68);
    ctx.restore();

    // 内缘：暗红向内渗，四角压暗
    ctx.save();
    trace(); ctx.clip();
    ctx.filter = 'blur(9px)';
    ctx.strokeStyle = 'rgba(56,4,8,0.62)';
    ctx.lineWidth = 54; ctx.stroke();
    ctx.filter = 'none';
    const inner = ctx.createRadialGradient(960, 540, 210, 960, 540, 880);
    inner.addColorStop(0, 'rgba(2,3,4,0)');
    inner.addColorStop(1, 'rgba(2,3,4,0.42)');
    ctx.fillStyle = inner; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 烧穿边：焦黑外沿（不连续）+ 熔橙内芯（断续、随火抖动）
    const emberPulse = 0.62 + 0.38 * Math.sin(t * 6.1);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (hash(i * 7.3) > 0.58) continue;
      // 外层焦炭：宽、哑、偏黑褐
      ctx.strokeStyle = `rgba(14,6,5,${0.55 + hash(i * 4.1) * 0.35})`;
      ctx.lineWidth = 2.0 + hash(i * 2.9) * 3.4;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      // 内芯熔橙：只在一部分段落出现，粗细不均
      if (hash(i * 5.9) > 0.34) {
        ctx.save();
        ctx.shadowColor = 'rgba(255,118,38,0.62)';
        ctx.shadowBlur = 12 + hash(i * 3.1) * 22;
        ctx.strokeStyle = `rgba(255,${150 + (hash(i * 8.2) * 60 | 0)},${44 + (hash(i) * 40 | 0)},${(0.20 + hash(i * 4.1) * 0.30) * emberPulse})`;
        ctx.lineWidth = 0.9 + hash(i * 4.7) * 2.2;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.restore();
      }
    }

    // 熔孔：边缘上几处正在烧的点，中心发白
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const k = Math.floor(hash(i * 4.3) * pts.length);
      const p0 = pts[k];
      const r = 4 + hash(i * 2.6) * 13;
      const g = ctx.createRadialGradient(p0[0], p0[1], 0.5, p0[0], p0[1], r);
      g.addColorStop(0, `rgba(255,238,196,${0.30 * emberPulse})`);
      g.addColorStop(0.35, `rgba(255,150,52,${0.26 * emberPulse})`);
      g.addColorStop(1, 'rgba(190,44,16,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p0[0], p0[1], r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // 血色渗出的几处亮斑
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const k = Math.floor(hash(i * 3.3) * pts.length);
      soft(pts[k][0], pts[k][1], 46 + hash(i) * 70, 26 + hash(i * 2) * 52,
        'rgba(196,28,30,0.26)', 'rgba(196,28,30,0)');
    }
    ctx.restore();

    // 焦卷：烧化的胶片边缘朝外卷起的小弧，偶尔拖着一点黑烟
    ctx.save();
    for (let i = 0; i < pts.length; i += 3) {
      const a = pts[i];
      const nx = a[0] - 960, ny = a[1] - 540;
      const L = Math.hypot(nx, ny) || 1;
      const ox = nx / L, oy = ny / L;
      const len = 10 + hash(i * 6.1) * 26;
      ctx.strokeStyle = `rgba(30,12,8,${0.42 + hash(i * 8.8) * 0.34})`;
      ctx.lineWidth = 1.2 + hash(i * 9.1) * 2.2;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(
        a[0] + ox * len * 0.7 - oy * len * 0.5, a[1] + oy * len * 0.7 + ox * len * 0.5,
        a[0] + ox * len + ox * len * 0.35, a[1] + oy * len + oy * len * 0.2
      );
      ctx.stroke();
    }
    // 黑烟：贴着边缘往上升，越远越淡
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) {
      const k = Math.floor(hash(i * 5.7) * pts.length);
      const a = pts[k];
      const rise = (Math.sin(t * 1.1 + i) + 1) * 16 + i * 5;
      ctx.filter = 'blur(14px)';
      ctx.fillStyle = `rgba(18,10,9,${0.16 + hash(i) * 0.10})`;
      ctx.beginPath();
      ctx.ellipse(a[0] + Math.sin(t * 0.8 + i * 2) * 12, a[1] - rise, 8 + hash(i * 3) * 10, 16 + rise * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = lg(0, 0, W, 0, [[0, 'rgba(179,18,31,0)'], [0.5, 'rgba(179,18,31,0.07)'], [1, 'rgba(179,18,31,0)']]);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    airFog(t, 660, 200, 0.24, 0.05);
  }

  // ---------- 场景 4：1971 海湾 ----------
  function drawBayStatic(t) {
    ctx.fillStyle = lg(0, 0, 0, 700, [
      [0, '#40190A'], [0.30, '#8A4515'], [0.56, '#D2771F'], [0.76, '#F2A23C'], [0.90, '#FFC772'], [0.97, '#FFE0A4'], [1, '#FFF6DC']
    ]);
    ctx.fillRect(0, 0, W, 700);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    fogBand(486, 210, '255,176,86', 0.055, t, 4);
    fogBand(268, 160, '220,126,44', 0.035, t, 5);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.55;
    fogBand(150, 78, '186,104,58', 0.16, t, 6);
    fogBand(280, 66, '206,126,66', 0.13, t, 7);
    fogBand(392, 58, '224,150,86', 0.11, t, 8);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(64px)';
    ctx.fillStyle = 'rgba(255,172,88,0.30)';
    ctx.beginPath(); ctx.ellipse(660, 700, 340, 250, 0, 0, Math.PI * 2); ctx.fill();
    ctx.filter = 'blur(38px)';
    ctx.fillStyle = 'rgba(255,242,206,0.34)';
    ctx.beginPath(); ctx.ellipse(660, 700, 116, 92, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const sg = ctx.createRadialGradient(660, 700, 4, 660, 700, 58);
    sg.addColorStop(0, '#FFFEFA'); sg.addColorStop(0.52, '#FFEEC0'); sg.addColorStop(1, '#FFC97E');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(660, 700, 58, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = lg(0, 700, 0, 1080, [[0, '#14433A'], [0.34, '#0A2C24'], [0.72, '#05140F'], [1, '#020807']]);
    ctx.fillRect(0, 700, W, 380);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const y = 706 + i * 12, w = 300 - i * 8;
      soft(660, y, w, 9, `rgba(255,200,120,${0.20 - i * 0.005})`, 'rgba(255,200,120,0)');
    }
    for (let i = 0; i < 24; i++) {
      const y = 714 + i * 14, x = 120 + hash(i * 6.2 + t * 0.4) * 1680;
      ctx.fillStyle = `rgba(200,230,200,${0.05 + hash(i) * 0.10})`;
      ctx.fillRect(x, y, 40 + hash(i * 3) * 150, 2);
    }
    for (let i = 0; i < 16; i++) {
      const y = 726 + i * 18, x = 300 + hash(i * 9.1) * 1160;
      ctx.fillStyle = `rgba(255,215,150,${0.05 + hash(i * 3) * 0.09})`;
      ctx.fillRect(x, y, 20 + hash(i) * 90, 2);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,236,196,0.55)';
    ctx.fillRect(0, 700, W, 2);

    // 帆船
    ctx.fillStyle = '#0A0D0C';
    ctx.beginPath(); ctx.moveTo(880, 730); ctx.lineTo(1030, 736); ctx.lineTo(1000, 762); ctx.lineTo(900, 758); ctx.closePath(); ctx.fill();
    ctx.fillRect(1006, 580, 4, 152);
    ctx.beginPath(); ctx.moveTo(1006, 584); ctx.lineTo(884, 726); ctx.lineTo(1006, 726); ctx.closePath();
    ctx.fillStyle = '#F1E6CC'; ctx.fill();
    ctx.fillStyle = '#0A0D0C';
    ctx.beginPath(); ctx.moveTo(1012, 596); ctx.lineTo(1080, 722); ctx.lineTo(1012, 722); ctx.closePath(); ctx.fill();

    // 白屋
    const bx = 1434, by = 742, bw = 196, bh = 168;
    ctx.fillStyle = '#050D0A';
    ctx.beginPath();
    ctx.moveTo(bx - 330, 1080);
    ctx.quadraticCurveTo(bx - 250, 936, bx - 150, 908);
    ctx.lineTo(bx + bw + 130, 904);
    ctx.quadraticCurveTo(bx + bw + 250, 946, bx + bw + 330, 1020);
    ctx.lineTo(bx + bw + 380, 1080);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(158,196,186,0.26)';
    ctx.fillRect(bx - 150, 906, bw + 280, 3);
    ctx.fillStyle = 'rgba(120,160,152,0.10)';
    ctx.fillRect(bx - 150, 909, bw + 280, 26);
    ctx.fillStyle = '#04090B';
    for (let i = 0; i < 5; i++) {
      const rx = bx - 210 + hash(i * 3.3) * 120;
      ctx.beginPath();
      ctx.moveTo(rx, 1000 + hash(i) * 60);
      ctx.lineTo(rx + 16 + hash(i * 2) * 30, 940 + hash(i * 5) * 40);
      ctx.lineTo(rx + 42 + hash(i * 7) * 30, 1010 + hash(i) * 60);
      ctx.closePath(); ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const rx = bx + bw + 60 + hash(i * 4.1) * 130;
      ctx.beginPath();
      ctx.moveTo(rx, 1010 + hash(i) * 60);
      ctx.lineTo(rx + 18 + hash(i * 2) * 26, 966 + hash(i * 5) * 34);
      ctx.lineTo(rx + 44 + hash(i * 7) * 26, 1014 + hash(i) * 60);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#0A0C0B';
    ctx.fillRect(bx - 12, by - 16, bw + 24, 16);
    ctx.fillStyle = '#8E101C';
    ctx.fillRect(bx - 8, by - 28, bw + 16, 16);
    ctx.fillStyle = '#520810';
    ctx.fillRect(bx - 8, by - 9, bw + 16, 7);
    const wallG = lg(bx, by, bx + bw, by + bh, [[0, '#F4EAD4'], [0.45, '#DCCDAE'], [1, '#6B5F4E']]);
    ctx.fillStyle = wallG;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = lg(bx + bw * 0.55, 0, bx + bw, 0, [[0, 'rgba(30,26,20,0)'], [1, 'rgba(30,26,20,0.55)']]);
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#080D14';
    [[24, 28, 44, 84], [86, 28, 44, 84], [148, 28, 44, 84]].forEach(([wx, wy, ww, wh]) => {
      ctx.fillRect(bx + wx, by + wy, ww, wh);
      ctx.fillStyle = 'rgba(246,214,168,0.20)';
      ctx.fillRect(bx + wx, by + wy, ww, 2);
      for (let k = 1; k < 7; k++) {
        ctx.fillStyle = 'rgba(120,96,72,0.22)';
        ctx.fillRect(bx + wx, by + wy + k * 12, ww, 2);
        ctx.fillStyle = '#080D14';
      }
    });
    ctx.fillStyle = 'rgba(179,18,31,0.42)';
    ctx.fillRect(bx, by + bh - 6, bw, 6);

    // 前景礁石（带虚化与湿面反光）
    ctx.save();
    ctx.filter = 'blur(7px)';
    ctx.fillStyle = '#020303';
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    for (let x = 0; x <= 540; x += 14) {
      const y = 952 - Math.sin(x * 0.0062 + 0.4) * 46 - Math.sin(x * 0.017 + 2.1) * 16 - hash(x * 1.3) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(540, 1080); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1200, 1080);
    for (let x = 1200; x <= 1920; x += 14) {
      const y = 966 - Math.sin(x * 0.0058 + 1.9) * 40 - Math.sin(x * 0.019 + 0.7) * 14 - hash(x * 1.7) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1920, 1080); ctx.closePath(); ctx.fill();
    ctx.restore();

    // 她：右前景礁石上，背对镜头对落日（与营地同一人、同一条红腰带）
    ctx.save();
    ctx.shadowColor = 'rgba(255,205,140,0.26)'; ctx.shadowBlur = 24;
    // 她脚下那块礁石：先给出承重面，否则人像浮在海上
    ctx.fillStyle = '#050A09';
    ctx.beginPath();
    ctx.moveTo(1650, 950); ctx.quadraticCurveTo(1666, 884, 1724, 876);
    ctx.quadraticCurveTo(1790, 872, 1836, 890);
    ctx.lineTo(1866, 952); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(158,196,186,0.16)';
    ctx.fillRect(1690, 878, 150, 2);

    lightPool(1756, 872, 292, 62, '255,190,110', 0.20);
    ringEdge(1756, 872, 198, 44, 0.18, 1.3);
    groundShadow(1756, 884, 94, 13, 0.42);
    // 第二次回头（11.05 s 起，与营地 3.50 s 同一套姿势、镜像）：两段呼应的落点
    const bmBody = easeInOut(clamp((t - 11.05) / 0.66, 0, 1));
    const bmHead = easeInOut(clamp((t - 11.30) / 0.52, 0, 1));
    const bayPose = mixPose(POSES.back, POSES.glance, bmBody);
    bayPose.headYaw = POSES.back.headYaw + (POSES.glance.headYaw - POSES.back.headYaw) * bmHead;
    const bmHeadLag = easeInOut(clamp((t - 0.066 - 11.30) / 0.52, 0, 1));
    bayPose.headYawLag = POSES.back.headYaw + (POSES.glance.headYaw - POSES.back.headYaw) * bmHeadLag;
    bayPose.hip = POSES.back.hip + (POSES.glance.hip - POSES.back.hip) * bmBody;
    woman(1756, 880, 372, { flip: true, pose: bayPose, t });
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      soft(60 + hash(i * 4.4) * 480, 1010 + hash(i * 2) * 60, 90 + hash(i) * 160, 8, 'rgba(150,190,190,0.10)', 'rgba(150,190,190,0)');
      soft(1300 + hash(i * 7.7) * 560, 1000 + hash(i * 5) * 70, 90 + hash(i * 3) * 150, 8, 'rgba(150,190,190,0.09)', 'rgba(150,190,190,0)');
    }
    soft(960, 700, 1240, 30, 'rgba(255,228,178,0.16)', 'rgba(255,228,178,0)');
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const w = 46 + i * 26, a = 0.20 * Math.pow(1 - i / 22, 1.5);
      soft(660, 706 + i * 17, w, 14, `rgba(255,214,150,${a})`, 'rgba(255,214,150,0)');
    }
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      soft(200 + i * 520, 720 + Math.sin(i * 2) * 26, 600, 110, 'rgba(255,225,180,0.07)', 'rgba(255,225,180,0)');
    }
    airFog(t, 676, 150, 0.18, 0.06);
    airFog(t, 900, 180, 0.22, 0.03);
  }

  // ---------- 场景 5：片名 ----------
  function drawTitle(t) {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);

    const p = clamp((t - 13.2) / 1.89, 0, 1);
    ctx.fillStyle = '#0C0A08';
    ctx.beginPath();
    ctx.moveTo(560, 1080); ctx.lineTo(560, 520);
    ctx.bezierCurveTo(560, 190, 1360, 190, 1360, 520);
    ctx.lineTo(1360, 1080); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#070605';
    ctx.beginPath();
    ctx.moveTo(680, 1080); ctx.lineTo(680, 560);
    ctx.bezierCurveTo(680, 300, 1240, 300, 1240, 560);
    ctx.lineTo(1240, 1080); ctx.closePath(); ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sweep = 140 + easeOut(p) * 1700;
    ctx.fillStyle = lg(sweep - 300, 0, sweep + 300, H, [[0, 'rgba(216,155,60,0)'], [0.5, 'rgba(216,155,60,0.12)'], [1, 'rgba(216,155,60,0)']]);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(760, 180, 520, '120,20,30', 0.22);
    glow(1200, 960, 460, '20,60,55', 0.18);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = easeOut(clamp((t - 13.35) / 1.1, 0, 1));
    ctx.strokeStyle = 'rgba(179,18,31,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(660, 612); ctx.lineTo(1300, 612); ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.letterSpacing = '12px';
    ctx.font = '900 116px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.shadowColor = 'rgba(190,16,26,0.34)'; ctx.shadowBlur = 22;
    ctx.fillStyle = lg(0, 646, 0, 768, [[0, '#EBD4A8'], [0.5, '#FFFBEE'], [1, '#D9B77A']]);
    ctx.fillText('血之海滩', 960, 702);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(130,8,16,0.8)'; ctx.lineWidth = 1.6;
    ctx.strokeText('血之海滩', 960, 702);

    ctx.font = '500 44px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.fillStyle = 'rgba(239,227,200,0.82)';
    ctx.fillText('1971 · 马里奥 · 巴瓦', 960, 812);
    ctx.font = '700 28px "Microsoft YaHei",sans-serif';
    ctx.fillStyle = 'rgba(216,155,60,0.8)';
    ctx.fillText('铅  黄    G I A L L O', 960, 878);
    ctx.restore();
    fogBand(720, 240, '120,46,34', 0.055, t, 1);
    fogBand(300, 200, '40,90,84', 0.035, t, 2);
  }

  // ---------- 画格：胶片里正在过的那几帧 ----------
  function drawReelFrame(x, y, w, h, kind, idx, t) {
    ctx.save();
    ctx.translate(x, y);

    if (kind === 0) {  // 海湾
      ctx.fillStyle = lg(0, 0, 0, h, [[0, '#3E1A08'], [0.40, '#B9611B'], [0.58, '#F2B05A'], [0.62, '#FFE7B8'], [1, '#2A1408']]);
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = lg(0, h * 0.62, 0, h, [[0, '#14453A'], [1, '#03100C']]);
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      soft(w * 0.34, h * 0.60, 40, 34, 'rgba(255,236,190,0.55)', 'rgba(255,190,110,0)');
      ctx.fillStyle = '#FFF6DA';
      ctx.beginPath(); ctx.arc(w * 0.34, h * 0.58, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,150,0.30)';
      ctx.fillRect(w * 0.30, h * 0.62, 7, h * 0.30);
      ctx.fillStyle = '#0A0D0C';
      ctx.beginPath();
      ctx.moveTo(w * 0.70, h * 0.55); ctx.lineTo(w * 0.88, h * 0.56);
      ctx.lineTo(w * 0.85, h * 0.66); ctx.lineTo(w * 0.71, h * 0.64);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(w * 0.86, h * 0.28, 2, h * 0.30);
      ctx.fillStyle = '#EFE3C8';
      ctx.beginPath(); ctx.moveTo(w * 0.87, h * 0.29); ctx.lineTo(w * 0.75, h * 0.56); ctx.lineTo(w * 0.87, h * 0.56); ctx.closePath(); ctx.fill();
      ctx.fillRect(w * 0.60, h * 0.44, 34, 26);
      ctx.fillStyle = '#8E101C';
      ctx.fillRect(w * 0.59, h * 0.42, 36, 6);
    } else if (kind === 1) {  // 面具
      ctx.fillStyle = lg(0, 0, 0, h, [[0, '#05070C'], [1, '#0B1318']]);
      ctx.fillRect(0, 0, w, h);
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = 'rgba(90,110,110,0.20)';
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.55, w * 0.22, h * 0.40, 0, 0, Math.PI * 2); ctx.fill();
      ctx.filter = 'none';
      // 面具：额头宽、颊部收、非椭圆
      ctx.fillStyle = lg(0, 0, 0, h, [[0, '#D9C9A8'], [0.6, '#B7A387'], [1, '#6E6050']]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.12);
      ctx.bezierCurveTo(w * 0.62, h * 0.13, w * 0.66, h * 0.36, w * 0.63, h * 0.60);
      ctx.bezierCurveTo(w * 0.61, h * 0.78, w * 0.55, h * 0.90, w * 0.5, h * 0.90);
      ctx.bezierCurveTo(w * 0.45, h * 0.90, w * 0.39, h * 0.78, w * 0.37, h * 0.60);
      ctx.bezierCurveTo(w * 0.34, h * 0.36, w * 0.38, h * 0.13, w * 0.5, h * 0.12);
      ctx.closePath(); ctx.fill();
      // 眼孔：细长斜缝，里面暗红
      ctx.fillStyle = '#04050A';
      ctx.beginPath(); ctx.ellipse(w * 0.435, h * 0.42, w * 0.055, h * 0.035, 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.565, h * 0.42, w * 0.055, h * 0.035, -0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,10,16,0.55)';
      ctx.beginPath(); ctx.ellipse(w * 0.435, h * 0.428, w * 0.040, h * 0.014, 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * 0.565, h * 0.428, w * 0.040, h * 0.014, -0.16, 0, Math.PI * 2); ctx.fill();
      // 鼻梁阴影、嘴缝（不是笑脸）
      ctx.fillStyle = 'rgba(76,64,52,0.55)';
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.56, w * 0.030, h * 0.10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#07070A';
      ctx.fillRect(w * 0.465, h * 0.70, w * 0.070, h * 0.016);
      ctx.fillStyle = 'rgba(70,58,46,0.5)';
      ctx.fillRect(w * 0.470, h * 0.726, w * 0.060, h * 0.010);
    } else if (kind === 2) {  // 营地
      ctx.fillStyle = lg(0, 0, 0, h, [[0, '#04070C'], [0.6, '#0D2330'], [1, '#123A34']]);
      ctx.fillRect(0, 0, w, h);
      soft(w * 0.82, h * 0.22, 20, 20, 'rgba(210,235,235,0.5)', 'rgba(210,235,235,0)');
      ctx.fillStyle = '#E6EFE8';
      ctx.beginPath(); ctx.arc(w * 0.82, h * 0.22, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#03100C';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.80);
      for (let xx = 0; xx <= w; xx += 9) ctx.lineTo(xx, h * 0.755 + Math.sin(xx * 0.03) * 5);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0B2A28';
      ctx.fillRect(0, h * 0.80, w, h * 0.20);
      ctx.fillStyle = 'rgba(120,80,40,0.8)';
      ctx.beginPath(); ctx.moveTo(w * 0.16, h * 0.94); ctx.lineTo(w * 0.26, h * 0.76); ctx.lineTo(w * 0.36, h * 0.94); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(230,160,70,0.5)';
      ctx.beginPath(); ctx.arc(w * 0.10, h * 0.93, 6, 0, Math.PI * 2); ctx.fill();
      // 她的迷你剪影：直接用同一副骨架，免得画格里的人和正片里的人不是一个人
      ctx.save();
      ctx.globalAlpha = 0.94;
      woman(w * 0.62, h * 0.94, h * 0.50, { pose: 'glance', t, belt: true });
      ctx.restore();
    } else if (kind === 3) {  // 她在海湾的背影
      ctx.fillStyle = lg(0, 0, 0, h, [[0, '#34170A'], [0.38, '#9C4E16'], [0.62, '#F0AE4E'], [0.70, '#FFE3AE'], [1, '#1B0F07']]);
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(22px)';
      ctx.fillStyle = 'rgba(255,178,92,0.32)';
      ctx.beginPath(); ctx.ellipse(w * 0.30, h * 0.66, 120, 62, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#FFF3D2';
      ctx.beginPath(); ctx.arc(w * 0.30, h * 0.655, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lg(0, h * 0.67, 0, h, [[0, '#24504A'], [0.5, '#0C2B24'], [1, '#03100C']]);
      ctx.fillRect(0, h * 0.67, w, h * 0.33);
      // 她的背影站在礁石上，脚下一点暖光
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pl = ctx.createRadialGradient(w * 0.74, h * 0.965, 2, w * 0.74, h * 0.965, w * 0.30);
      pl.addColorStop(0, 'rgba(255,186,104,0.22)');
      pl.addColorStop(1, 'rgba(255,186,104,0)');
      ctx.fillStyle = pl;
      ctx.beginPath(); ctx.ellipse(w * 0.74, h * 0.965, w * 0.30, h * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      woman(w * 0.74, h * 0.995, h * 0.60, { pose: 'back', t, belt: true });
    } else {  // kind 4：腰带特写
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      const bgG = ctx.createLinearGradient(0, 0, 0, h);
      bgG.addColorStop(0, '#100609');
      bgG.addColorStop(0.55, '#2C0A11');
      bgG.addColorStop(1, '#080405');
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bl = ctx.createRadialGradient(w * 0.5, h * 0.52, 4, w * 0.5, h * 0.52, w * 0.42);
      bl.addColorStop(0, 'rgba(179,18,31,0.26)');
      bl.addColorStop(0.55, 'rgba(140,14,26,0.10)');
      bl.addColorStop(1, 'rgba(120,10,22,0)');
      ctx.fillStyle = bl;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      ctx.translate(w * 0.5, h * 0.50);
      ctx.scale(4.6, 4.6);
      ctx.translate(-w * 0.56, -h * 0.566);
      woman(w * 0.56, h * 0.92, h * 0.52, { pose: 'glance', t, belt: true });
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

    if (hash(kind * 3.1 + idx * 7.7) > 0.66) {
      ctx.fillStyle = 'rgba(255,246,232,0.10)';
      ctx.fillRect(w * hash(idx * 2.3 + kind), 0, 1, h);
    }
    ctx.restore();
  }

  // ---------- 场景 6：胶片 → 收束 ----------
  function drawReel(t) {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    const ce = easeInOut(clamp((t - 18.2) / 1.35, 0, 1)) * 0.86;

    const strips = [{ y: 232, kind: 2 }, { y: 466, kind: 4 }, { y: 700, kind: 3 }];
    strips.forEach((s, i) => {
      const wob = Math.sin(t * 4.6 + i * 2.2) * 16;
      const ty = [486, 612, 738][i];
      const y = s.y + (ty - s.y) * ce + (1 - ce) * wob;
      const h = 212 * (1 - ce * 0.46);
      const x0 = 30, x1 = W - 30;
      const scroll = Math.round((t * 150 + i * 240) % 300);

      ctx.save();
      ctx.globalAlpha = (1 - ce * 0.52) * 0.95;

      const bg = ctx.createLinearGradient(0, y, 0, y + h);
      bg.addColorStop(0, '#191310'); bg.addColorStop(0.5, '#0F0A08'); bg.addColorStop(1, '#080606');
      ctx.fillStyle = bg;
      ctx.fillRect(x0, y, x1 - x0, h);

      // 齿孔：上下两排，滚动
      for (let x = x0 + 10 - scroll; x < x1; x += 34) {
        ctx.fillStyle = '#040403';
        ctx.beginPath(); ctx.roundRect(x, y + 7, 17, 12, 3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x, y + h - 19, 17, 12, 3); ctx.fill();
        ctx.fillStyle = 'rgba(214,190,160,0.10)';
        ctx.fillRect(x, y + 6.5, 17, 1);
        ctx.fillRect(x, y + h - 19.5, 17, 1);
      }

      // 画格
      const fh = h - 46;
      for (let k = -1; k < 7; k++) {
        const fx = x0 + 16 + k * 302 - scroll;
        if (fx > x1 - 30 || fx < x0 - 250) continue;
        drawReelFrame(fx, y + 23, 286, fh, s.kind, k + i * 3, t);
      }

      ctx.fillStyle = 'rgba(255,240,220,0.06)';
      ctx.fillRect(x0, y, x1 - x0, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x0, y + h - 2, x1 - x0, 2);
      ctx.restore();
    });

    if (ce > 0.4) {
      const a = (ce - 0.4) / 0.6;
      // 收束：她做底影，红光从她身后透出来，片名落在她头顶上方
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(960, 780, 240 + a * 360, '227,35,44', 0.20 * a);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.92 * a;
      woman(960, 1002, 524, { pose: 'glance', t, belt: true });
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(960, 560, 300 + a * 500, '227,35,44', 0.16 * a);
      glow(960, 560, 120 + a * 200, '255,210,160', 0.28 * a);
      ctx.fillStyle = lg(0, 0, W, 0, [[0, 'rgba(255,240,215,0)'], [0.5, `rgba(255,246,230,${0.5 * a})`], [1, 'rgba(255,240,215,0)']]);
      ctx.fillRect(0, 559, W, 2);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = easeOut(clamp((t - 18.9) / 1.0, 0, 1));
      ctx.fillStyle = lg(0, 300, 0, 560, [[0, 'rgba(140,14,26,0)'], [0.55, 'rgba(140,14,26,0.30)'], [1, 'rgba(140,14,26,0)']]);
      ctx.fillRect(0, 300, W, 260);
      ctx.fillStyle = lg(0, 580, 0, 860, [[0, 'rgba(120,10,22,0)'], [0.5, 'rgba(120,10,22,0.24)'], [1, 'rgba(120,10,22,0)']]);
      ctx.fillRect(0, 580, W, 280);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.letterSpacing = '10px';
      ctx.font = '900 76px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.shadowColor = 'rgba(190,16,26,0.32)'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#EFE3C8';
      ctx.fillText('血之海滩', 960, 300);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(130,8,16,0.75)'; ctx.lineWidth = 1.3;
      ctx.strokeText('血之海滩', 960, 300);
      ctx.letterSpacing = '2px';
      ctx.font = '500 30px "Microsoft YaHei",sans-serif';
      ctx.fillStyle = 'rgba(239,227,200,0.6)';
      ctx.fillText('1971 · 马里奥 · 巴瓦', 960, 362);
      ctx.restore();
    }
    fogBand(560, 320, '110,26,26', 0.05, t, 3);
  }

  // ---------- 字卡 ----------
  function tagCard(t) {
    const a = clamp((t - 11.8) / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(4,4,5,0.82)';
    ctx.fillRect(88, 78, 430, 78);
    ctx.strokeStyle = 'rgba(216,155,60,0.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(89, 79, 428, 76);
    ctx.fillStyle = '#EFE3C8';
    ctx.font = '700 40px "Microsoft YaHei",sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('1971 · 意大利', 116, 118);
    ctx.fillStyle = 'rgba(239,227,200,0.45)';
    ctx.font = '500 22px "Microsoft YaHei",sans-serif';
    ctx.fillText('G I A L L O', 392, 118);
    ctx.restore();
  }

