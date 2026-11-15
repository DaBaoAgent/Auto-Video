// stickers.js: the map pipeline's comic-sticker layer (one of bb-video-map's rules, kept as a small module).
//
// Every person, prop and landform is a plain SVG sticker pinned to a real lon/lat, or carried along a
// route; the layer sits above routes and cities (z-index 5) and every character is lifted so its feet
// stand "above" the line it walks (translate moves the top-left corner — see references/asset-spec.md §3).
//
//   const arts = await MAP_STICKERS(G, [
//     { f: '01_zhangqian.svg', path: ROUTE, from: a1 + 1.8, to: a1 + 4.2, w: 240, at: a1 + 1.8, until: a1 + 4.7, dy: 20, lift: 200 },
//     { f: '02_wudi.svg',      ll: [108.94, 34.34], w: 260, at: a1 + 2.4, until: a2 + 0.3, dy: 22, lift: 215 },
//   ], { dir: 'assets/models/' });
//
// Fields: f file name · ll static anchor [lon, lat] · path + from + to moving along a polyline ·
//         w width px (1080 basis) · at / until appear / disappear · dy feet offset · lift character rise ·
//         ease optional easing for path progress (default smoothstep)
// Returns the defs with their <img> elements, so a page can keep fine control.
(function () {
  const smooth = (x) => x * x * (3 - 2 * x);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // Arc-length interpolation: pieces of different lengths must not change the speed.
  function pathAt(pts, u) {
    const p = clamp01(u), seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(len);
      total += len;
    }
    let d = p * total;
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const f = seg[i] ? clamp01(d / seg[i]) : 0;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  }

  window.MAP_STICKERS = async function (G, defs, opt = {}) {
    const dir = opt.dir || 'assets/models/';
    const fadeIn = opt.fadeIn ?? 0.5, fadeOut = opt.fadeOut ?? 0.45;
    const halo = opt.halo ?? '#FBF7EE';
    const stage = document.getElementById('stage');
    if (!stage) throw new Error('MAP_STICKERS: #stage not found');
    const mapRoot = stage.firstElementChild;
    let layer = document.getElementById('map-stickers');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'map-stickers';
      layer.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden';
      (mapRoot && mapRoot.style.zIndex === '1' ? mapRoot : stage).appendChild(layer);
    }
    const arts = defs.map((d) => {
      const img = document.createElement('img');
      img.src = dir + d.f;
      img.alt = '';
      img.style.cssText = 'position:absolute;left:0;top:0;width:' + d.w + 'px;height:auto;opacity:0;' +
        'filter:drop-shadow(0 0 6px ' + halo + ') drop-shadow(0 0 2px ' + halo + ');';
      img.style.transformOrigin = '50% 100%';
      layer.appendChild(img);
      return Object.assign({}, d, { el: img });
    });
    await Promise.all(arts.map((A) => A.el.decode().catch(() => {})));
    G.onFrame((t, g) => {
      for (const A of arts) {
        if (t < A.at || t >= A.until) {
          if (A.el.style.display !== 'none') A.el.style.display = 'none';
          continue;
        }
        if (A.el.style.display === 'none') A.el.style.display = '';
        // Soft in / out at the edges of the visible window.
        const q = Math.max(0, Math.min(1, (t - A.at) / fadeIn, (A.until - t) / fadeOut));
        let ll = A.ll;
        if (A.path) {
          const u = clamp01((t - A.from) / (A.to - A.from));
          ll = pathAt(A.path, (A.ease || smooth)(u));
        }
        const [x, y] = g.at(ll);
        const s = 0.88 + 0.12 * Math.min(1, (t - A.at) / fadeIn);
        A.el.style.opacity = q.toFixed(3);
        A.el.style.transform = 'translate(' + (x - A.w / 2).toFixed(1) + 'px,' + (y - A.dy - (A.lift || 0)).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      }
    });
    return arts;
  };
})();
