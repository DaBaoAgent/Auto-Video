// rods.js: rod-mounted props for shadow puppetry — the rule settled in the Anunnaki sample (work/anu-shadow/index.html).
// Load after shadow.js:  <script src="lib/shadow.js"></script> <script src="lib/rods.js"></script>
//
//   const R = SHADOW_RODS(F, Y, { H: F.H, L: (a, b) => F.portrait && b !== undefined ? b : a });
//   R.mount(screen, { x, y, at, until, draw(g, kit, o), frame(t, g, o), ... })
//     The rod runs from (x, y) to (hx, hy) under the stage edge; the whole piece pivots there and sways / bobs.
//     Options: hx, hy, rodDx, rodY, rodW, rodColor, sway, speed, bob, bobSpeed, phase,
//              lift(t), shift(t) => [dx, dy], depth, what.
//   R.mountain / R.grass / R.moon / R.book: the sample's environment props (x, y, at, until, and their own sizes).
// Everything else is carved with R.mount: draw the prop on the hide inside draw(); animate it in frame().
(function () {
  window.SHADOW_RODS = function (F, Y, o = {}) {
    const H = o.H ?? F.H;
    const L = o.L ?? ((a, b) => (F.portrait && b !== undefined ? b : a));
    const ROD = o.rod ?? '#2A1A10';

    // One prop on one rod. x,y = the prop's base; the rod's lower end is (hx,hy) and everything pivots there.
    function mount(sc, p) {
      let G = null, inner = null;
      const hx = p.hx ?? p.x, hy = p.hy ?? H + L(90, 70);
      Y.leather(sc, {
        at: p.at, until: p.until ?? 1e9, depth: p.depth ?? 0, what: p.what,
        draw: (g, k) => {
          G = k.sv('g', {}, g);
          k.line(G, `M${p.x + (p.rodDx ?? 0)} ${p.rodY ?? p.y} L${hx} ${hy}`, p.rodW ?? F.px(4.2), p.rodColor ?? ROD);
          inner = k.sv('g', {}, G);
          p.draw(inner, k, p);
        },
        frame: (t) => {
          if (!G) return;
          const a = (p.sway ?? 0.028) * Math.sin(t * (p.speed ?? 1.1) + (p.phase ?? 0));
          let dx = 0;
          let dy = (p.bob ?? 5) * Math.sin(t * (p.bobSpeed ?? 1.7) + (p.phase ?? 0)) + (p.lift ? p.lift(t) : 0);
          if (p.shift) { const s = p.shift(t); dx += s[0] || 0; dy += s[1] || 0; }
          G.setAttribute('transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${(a * 57.2958).toFixed(2)} ${hx} ${hy})`);
          if (p.frame) p.frame(t, inner, p);
        },
      });
      return { g: () => inner };
    }

    // Mountain: dyed green hide with a few carved ridge lines, breathing slowly.
    function mountain(sc, p) {
      return mount(sc, { ...p, what: '皮影 山', sway: 0.012, speed: 0.5, bob: 3,
        draw: (g, k, q) => {
          const x = q.x, y = q.y, wd = q.w ?? L(300, 250), hh = q.h ?? L(230, 190);
          k.plain(g, k.poly([[x - wd, y], [x - wd * 0.5, y - hh * 0.72], [x, y - hh], [x + wd * 0.38, y - hh * 0.58], [x + wd, y]]), k.colors.green);
          for (let i = 0; i < 4; i++) k.line(g, `M${x - wd * 0.55 + i * wd * 0.28} ${y - 26 - i * 30} q${wd * 0.1} -16 ${wd * 0.2} 0`, 2.6);
        } });
    }

    // Grass: each blade has its own little rod and bends on its own.
    function grass(sc, p) {
      return mount(sc, { ...p, what: '皮影 草', sway: 0.01, bob: 0,
        draw: (g, k, q) => {
          q.st = [];
          for (let i = 0; i < 5; i++) {
            const sg = k.sv('g', {}, g); q.st.push(sg);
            const bx = q.x + (i - 2) * L(20, 16), by = q.y, hgt = L(105, 90) + (i % 3) * 22;
            k.line(sg, `M${bx} ${by} Q${bx + (i % 2 ? 16 : -16)} ${by - hgt * 0.6} ${bx + (i % 2 ? 24 : -24)} ${by - hgt}`, F.px(4.4), k.colors.green);
            k.line(sg, `M${bx + (i % 2 ? 10 : -10)} ${by - hgt * 0.45} q${i % 2 ? 26 : -26} -8 ${i % 2 ? 38 : -38} -30`, F.px(3.2), k.colors.deep);
          }
        },
        frame: (t, g, q) => { q.st.forEach((sg, i) => sg.setAttribute('transform', `rotate(${(Math.sin(t * 1.9 + i * 0.8) * 5).toFixed(2)} ${q.x + (i - 2) * 20} ${q.y})`)); } });
    }

    // Moon: a pale yellow disc on a long rod, rising slowly.
    function moon(sc, p) {
      return mount(sc, { ...p, what: '皮影 月亮', sway: 0.02, speed: 0.6, bob: 0,
        draw: (g, k, q) => {
          const r = q.r ?? L(80, 66);
          k.plain(g, k.poly(k.ring(q.x, q.y, r, 40)), k.colors.yellow);
          k.plain(g, k.poly(k.ring(q.x - r * 0.2, q.y - r * 0.15, r * 0.62, 30)), '#F7E3A8');
          k.line(g, `M${q.x + r * 0.4} ${q.y - r * 0.45} q${r * 0.3} ${r * 0.24} 0 ${r * 0.5}`, 3);
        } });
    }

    // Book: two pages that open and close on their own.
    function book(sc, p) {
      return mount(sc, { ...p, what: '皮影 书', sway: 0.03, speed: 1.5, bob: 7,
        draw: (g, k, q) => {
          const x = q.x, y = q.y, wd = q.w ?? L(150, 130), hh = q.h ?? L(96, 84);
          k.plain(g, k.poly([[x - wd * 0.56, y], [x + wd * 0.56, y], [x + wd * 0.48, y - hh], [x - wd * 0.48, y - hh]]), k.colors.deep);
          q.pl = k.sv('g', {}, g); q.pr = k.sv('g', {}, g);
          k.plain(q.pl, k.poly([[x - 4, y - 6], [x - wd * 0.44, y - 14], [x - wd * 0.4, y - hh * 0.9], [x - 4, y - hh * 0.84]]), k.colors.skin);
          k.plain(q.pr, k.poly([[x + 4, y - 6], [x + wd * 0.44, y - 14], [x + wd * 0.4, y - hh * 0.9], [x + 4, y - hh * 0.84]]), k.colors.skin);
          for (let i = 0; i < 3; i++) {
            k.line(g, `M${x - wd * 0.34} ${y - hh * 0.24 - i * 18} L${x - 16} ${y - hh * 0.22 - i * 18}`, 2.2);
            k.line(g, `M${x + 16} ${y - hh * 0.22 - i * 18} L${x + wd * 0.34} ${y - hh * 0.24 - i * 18}`, 2.2);
          }
        },
        frame: (t, g, q) => {
          const v = q.open ? q.open(t) : 0.16 + 0.12 * Math.sin(t * 2.4);
          q.pl.setAttribute('transform', `translate(0 ${q.y}) skewY(${(-v * 18).toFixed(2)}) translate(0 ${-q.y})`);
          q.pr.setAttribute('transform', `translate(0 ${q.y}) skewY(${(v * 18).toFixed(2)}) translate(0 ${-q.y})`);
        } });
    }

    return { mount, mountain, grass, moon, book, ROD, H, L };
  };
})();
