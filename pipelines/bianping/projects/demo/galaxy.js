// galaxy.js —— 远景的小星系（film.js 第 1–2 镜的背景元素）。
// 只画一组：亮核 + 两条由小圆点组成的旋臂，整体压扁成浅椭圆。
// 独立实现，不依赖任何外部文件；parent 是一个 SVG <g>，x/y 是它在当前层坐标系里的位置。
function tinyGalaxy(parent, x, y, r, rot) {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const grp = mk('g', { transform: `translate(${x} ${y}) rotate(${rot})` });

  // 核球：中心亮块 + 一层柔光
  grp.appendChild(mk('circle', { cx: 0, cy: 0, r: r * 0.34, fill: '#FFF4E2', opacity: 0.10 }));
  grp.appendChild(mk('circle', { cx: 0, cy: 0, r: r * 0.16, fill: '#FFF4E2', opacity: 0.85 }));

  // 旋臂：两条对数螺线，用点阵代替连续曲线
  const N = 28;
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const th = u * 2.1 * Math.PI + arm * Math.PI;
      const rr = r * (0.10 + 0.86 * u);
      const px = Math.cos(th) * rr;
      const py = Math.sin(th) * rr * 0.46;
      const rad = r * 0.085 * (1 - u * 0.55);
      const op = 0.62 * (1 - u * 0.35);
      grp.appendChild(mk('circle', {
        cx: +px.toFixed(2), cy: +py.toFixed(2), r: +rad.toFixed(2),
        fill: arm ? '#9FB4FF' : '#7D8CE8', opacity: +op.toFixed(2),
      }));
    }
  }

  // 外缘两粒逃逸的星点，避免边缘太整齐
  grp.appendChild(mk('circle', { cx: r * 0.95, cy: -r * 0.30, r: 1.6, fill: '#FFF4E2', opacity: 0.5 }));
  grp.appendChild(mk('circle', { cx: -r * 0.88, cy: r * 0.26, r: 1.2, fill: '#FFF4E2', opacity: 0.4 }));

  parent.appendChild(grp);
}

// galaxy.js —— 正片的星系本体：晕 + 盘 + 四条旋臂 + 核球。
// 调用：galaxy(parent, x, y, R, tiltDeg, squash, seed)
// 全部是确定性的（同 seed 同画面），只画圆与椭圆，不依赖外部文件。
function galaxy(parent, x, y, R, tiltDeg, sq, seed) {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  let s = seed >>> 0 || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0, s / 4294967296);

  const grp = mk('g', { transform: `translate(${x} ${y}) rotate(${tiltDeg})` });

  // 外晕：三层递减透明度的大椭圆
  [[1.55, 0.05], [1.25, 0.08], [1.0, 0.10]].forEach(([k, op]) => {
    grp.appendChild(mk('ellipse', {
      cx: 0, cy: 0, rx: +(R * k).toFixed(1), ry: +(R * k * sq).toFixed(1),
      fill: '#4C63C8', opacity: op,
    }));
  });

  // 盘：底色椭圆压出星系面
  grp.appendChild(mk('ellipse', { cx: 0, cy: 0, rx: R, ry: +(R * sq).toFixed(1), fill: '#232B63', opacity: 0.35 }));

  // 四条旋臂：对数螺线撒点，越靠外越稀越暗
  const ARMS = 4, DOTS = 190, b = 0.29, ph = 0;
  for (let arm = 0; arm < ARMS; arm++) {
    for (let i = 0; i < DOTS; i++) {
      const u = Math.pow(i / DOTS, 0.72);
      const th = u * 2.4 * Math.PI + (arm * 2 * Math.PI) / ARMS + ph;
      const rr = R * (0.06 + 0.94 * u);
      const wob = (rnd() - 0.5) * R * 0.10 * u;          // 臂宽
      const px = Math.cos(th) * rr + wob;
      const py = (Math.sin(th) * rr + wob * 0.6) * sq;
      const rad = R * (0.010 + 0.016 * (1 - u));
      const tone = u < 0.28 ? '#FFF0CE' : (u < 0.62 ? '#A9B6FF' : '#6E79D8');
      grp.appendChild(mk('circle', {
        cx: +px.toFixed(2), cy: +py.toFixed(2), r: +rad.toFixed(2),
        fill: tone, opacity: +(0.85 - 0.55 * u).toFixed(2),
      }));
    }
  }

  // 核球：亮核 + 十字亮瓣
  grp.appendChild(mk('ellipse', { cx: 0, cy: 0, rx: +(R * 0.20).toFixed(1), ry: +(R * 0.20 * sq).toFixed(1), fill: '#FFF6DE', opacity: 0.92 }));
  grp.appendChild(mk('ellipse', { cx: 0, cy: 0, rx: +(R * 0.34).toFixed(1), ry: +(R * 0.06 * sq).toFixed(1), fill: '#FFF6DE', opacity: 0.35 }));
  grp.appendChild(mk('ellipse', { cx: 0, cy: 0, rx: +(R * 0.06).toFixed(1), ry: +(R * 0.30 * sq).toFixed(1), fill: '#FFF6DE', opacity: 0.22 }));

  parent.appendChild(grp);
}
