// vendor/runtime/board-draw.js
// 板写族（白板 / 黑板 / 视觉笔记 / 马克笔）的公共画笔：几何采样 + 笔序调度 + 手写文字。
// 只做纯计算，产出 stylekit.js 的 board 族能直接吃的 strokes / washes 数据，
// 不依赖任何第三方库，页面里用 <script> 引在 stylekit.js 之后、main.js 之前。
window.BOARD = (function () {
  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function rng(seed) {
    var s = 0;
    for (var i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // ---------- 几何：全部返回 [[x,y], ...] ----------
  function line(a, b, n) {
    n = n || 2;
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
    }
    return out;
  }

  function quad(p0, p1, p2, n) {
    n = n || 18;
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      ]);
    }
    return out;
  }

  function cubic(p0, p1, p2, p3, n) {
    n = n || 26;
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      var a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      out.push([
        a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
      ]);
    }
    return out;
  }

  // 连续贝塞尔链：chain([p0, c1, c2, p1, c1, c2, p2, ...])，首点单独给
  function chain(pts, n) {
    n = n || 22;
    var out = [pts[0]];
    var i = 1;
    while (i + 2 < pts.length) {
      var seg = cubic(out[out.length - 1], pts[i], pts[i + 1], pts[i + 2], n);
      for (var k = 1; k < seg.length; k++) out.push(seg[k]);
      i += 3;
    }
    if (i < pts.length) {
      var rest = line(out[out.length - 1], pts[pts.length - 1], 6);
      for (var j = 1; j < rest.length; j++) out.push(rest[j]);
    }
    return out;
  }

  function ellipse(cx, cy, rx, ry, a0, a1, n, rot) {
    a0 = a0 == null ? 0 : a0;
    a1 = a1 == null ? TAU : a1;
    n = n || 56;
    rot = rot || 0;
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = lerp(a0, a1, i / n);
      var x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return out;
  }

  function arc(cx, cy, r, a0, a1, n) { return ellipse(cx, cy, r, r, a0, a1, n); }

  function rect(x, y, w, h) {
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  }

  function roundRect(x, y, w, h, r, n) {
    n = n || 8;
    var out = [];
    var corners = [
      [x + w - r, y + r, -Math.PI / 2, 0],
      [x + w - r, y + h - r, 0, Math.PI / 2],
      [x + r, y + h - r, Math.PI / 2, Math.PI],
      [x + r, y + r, Math.PI, Math.PI * 1.5],
    ];
    out.push([x + r, y]);
    corners.forEach(function (c) {
      arc(c[0], c[1], r, c[2], c[3], n).forEach(function (p) { out.push(p); });
    });
    out.push([x + r, y]);
    return out;
  }

  function close(pts) {
    var out = pts.slice();
    var a = pts[0], b = pts[pts.length - 1];
    if (Math.abs(a[0] - b[0]) > 0.01 || Math.abs(a[1] - b[1]) > 0.01) out.push([a[0], a[1]]);
    return out;
  }

  function translate(pts, dx, dy) { return pts.map(function (p) { return [p[0] + dx, p[1] + dy]; }); }

  function rotate(pts, cx, cy, ang) {
    var c = Math.cos(ang), s = Math.sin(ang);
    return pts.map(function (p) {
      var x = p[0] - cx, y = p[1] - cy;
      return [cx + x * c - y * s, cy + x * s + y * c];
    });
  }

  function scale(pts, cx, cy, sx, sy) {
    sy = sy == null ? sx : sy;
    return pts.map(function (p) { return [cx + (p[0] - cx) * sx, cy + (p[1] - cy) * sy]; });
  }

  function offset(pts, d) {
    // 沿法线方向整体偏移（做“双线”粉笔/铅笔味）
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      out.push([pts[i][0] - dy / l * d, pts[i][1] + dx / l * d]);
    }
    return out;
  }

  function length(pts) {
    var s = 0;
    for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return s;
  }

  function dashed(pts, dash, gap) {
    dash = dash || 16; gap = gap || 12;
    var out = [], on = true, left = dash;
    out.push([pts[0][0], pts[0][1]]);
    for (var i = 1; i < pts.length; i++) {
      var ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
      var seg = Math.hypot(bx - ax, by - ay);
      var at = 0;
      while (at < seg) {
        var step = Math.min(seg - at, left);
        var t1 = (at + step) / seg;
        var px = lerp(ax, bx, t1), py = lerp(ay, by, t1);
        out.push([px, py]);
        at += step; left -= step;
        if (left <= 1e-6) {
          if (on) out.push([px, py]);
          on = !on;
          left = on ? dash : gap;
          if (on) out.push([px, py]);
        }
      }
    }
    return out;
  }

  // 箭头：返回 {shaft, h1, h2}
  // 把一条折线切成一段段（虚线必须画成多条独立笔画，否则缺口会被连起来）
  function dashes(pts, dash, gap) {
    dash = dash || 16; gap = gap || 12;
    var out = [], cur = [[pts[0][0], pts[0][1]]], left = dash, drawing = true;
    for (var i = 1; i < pts.length; i++) {
      var ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
      var seg = Math.hypot(bx - ax, by - ay);
      var at = 0;
      while (at < seg - 1e-6) {
        var step = Math.min(seg - at, left);
        var t1 = (at + step) / seg;
        var px = lerp(ax, bx, t1), py = lerp(ay, by, t1);
        if (drawing) cur.push([px, py]);
        at += step; left -= step;
        if (left <= 1e-6) {
          if (drawing && cur.length > 1) out.push(cur);
          drawing = !drawing;
          left = drawing ? dash : gap;
          cur = drawing ? [[px, py]] : [];
        }
      }
    }
    if (drawing && cur.length > 1) out.push(cur);
    return out;
  }

  function arrow(x1, y1, x2, y2, head) {
    head = head || 20;
    var a = Math.atan2(y2 - y1, x2 - x1);
    var h1 = [[x2, y2], [x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42)]];
    var h2 = [[x2, y2], [x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42)]];
    return { shaft: [[x1, y1], [x2, y2]], h1: h1, h2: h2 };
  }

  function curveArrow(pts, head, frac) {
    // 用折线末端方向生成箭头
    head = head || 18;
    var i = Math.max(1, Math.floor(pts.length * (frac == null ? 1 : frac)) - 1);
    var tip = pts[pts.length - 1];
    var prev = pts[i];
    var a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    return {
      h1: [[tip[0], tip[1]], [tip[0] - head * Math.cos(a - 0.42), tip[1] - head * Math.sin(a - 0.42)]],
      h2: [[tip[0], tip[1]], [tip[0] - head * Math.cos(a + 0.42), tip[1] - head * Math.sin(a + 0.42)]],
    };
  }

  function sign(x) { return x < 0 ? -1 : 1; }

  // 圆角矩形路径（没有 ctx.roundRect 的浏览器也能用）
  function rrect(ctx, x, y, w, h, r, fill) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  // 波浪线
  function wave(x0, x1, y, amp, cycles, n, tilt) {
    n = n || 40;
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, x = lerp(x0, x1, t);
      out.push([x, y + Math.sin(t * TAU * cycles) * amp + (tilt || 0) * t]);
    }
    return out;
  }

  // ---------- 排线（polygon 内的斜线，做阴影/瓦片） ----------
  function hatch(poly, angle, spacing, opt) {
    opt = opt || {};
    var rad = angle * Math.PI / 180;
    var c = Math.cos(-rad), s = Math.sin(-rad);
    var rp = poly.map(function (p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; });
    var minY = Math.min.apply(null, rp.map(function (p) { return p[1]; }));
    var maxY = Math.max.apply(null, rp.map(function (p) { return p[1]; }));
    var out = [], idx = 0;
    for (var y = minY + spacing * 0.5; y < maxY; y += spacing) {
      var xs = [];
      for (var i = 0; i < rp.length - 1; i++) {
        var a = rp[i], b = rp[i + 1];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          xs.push(lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])));
        }
      }
      xs.sort(function (p, q) { return p - q; });
      for (var k = 0; k + 1 < xs.length; k += 2) {
        var x1 = xs[k], x2 = xs[k + 1];
        if (x2 - x1 < 4) continue;
        if (opt.trim) { x1 += (x2 - x1) * opt.trim; x2 -= (x2 - x1) * opt.trim; }
        if (opt.skipIdx && idx % 2 !== opt.skipIdx) { idx++; continue; }
        idx++;
        var seg = [];
        var cnt = Math.max(2, Math.round((x2 - x1) / 26));
        for (var j = 0; j <= cnt; j++) {
          var xx = lerp(x1, x2, j / cnt), yy = y;
          seg.push([xx * c + yy * s, -xx * s + yy * c]); // 转回
        }
        out.push(seg);
      }
    }
    return out;
  }

  // ---------- 笔序调度 ----------
  function Pen(cfg) {
    cfg = cfg || {};
    var strokes = [];
    var cursor = cfg.t0 == null ? 0.06 : cfg.t0;
    var self = {
      strokes: strokes,
      add: function (pts, o) {
        o = o || {};
        var len = length(pts);
        var dur = o.dur != null ? o.dur : clamp(len / (o.speed || cfg.speed || 1250), 0.16, 0.85);
        var s = {
          pts: pts.map(function (p) { return [p[0], p[1]]; }),
          w: o.w != null ? o.w : cfg.w,
          color: o.color || cfg.color,
          alpha: o.alpha != null ? o.alpha : (cfg.alpha != null ? cfg.alpha : 0.92),
          jitter: o.jitter != null ? o.jitter : (cfg.jitter != null ? cfg.jitter : 1.3),
          t0: o.t0 != null ? o.t0 : cursor,
          dur: dur,
        };
        s._len = len;
        strokes.push(s);
        cursor = s.t0 + dur + (o.gap != null ? o.gap : (cfg.gap == null ? 0.05 : cfg.gap));
        return s;
      },
      // 多段一次画（虚线用）
      addEach: function (list, o) {
        o = o || {};
        list.forEach(function (seg) {
          self.add(seg, Object.assign({}, o, { dur: o.dur == null ? Math.max(0.08, length(seg) / (o.speed || cfg.speed || 1250)) : o.dur / list.length, gap: o.gap == null ? 0.02 : o.gap / list.length }));
        });
      },
      arrowTo: function (x1, y1, x2, y2, o) {        o = o || {};
        var head = o.head || 20;
        self.add([[x1, y1], [x2, y2]], Object.assign({ dur: 0.2 }, o));
        var a = Math.atan2(y2 - y1, x2 - x1);
        var h1 = [[x2, y2], [x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42)]];
        var h2 = [[x2, y2], [x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42)]];
        self.add(h1, Object.assign({}, o, { dur: 0.08, gap: 0.01 }));
        self.add(h2, Object.assign({}, o, { dur: 0.08 }));
      },
      pause: function (dt) { cursor += dt; },
      sync: function (t) { cursor = t; },
      at: function () { return cursor; },
    };
    return self;
  }

  // 把整条笔序压进 [start, end]
  function fit(bundle, start, end) {
    var strokes = bundle.strokes || [];
    var texts = bundle.texts || [];
    var washes = bundle.washes || [];
    var T = 0;
    strokes.forEach(function (s) { T = Math.max(T, s.t0 + s.dur); });
    texts.forEach(function (x) { T = Math.max(T, x.t0 + (x.dur || 0.8)); });
    if (T <= 0) T = 1;
    var span = end - start;
    var k = span / T;
    strokes.forEach(function (s) {
      s.t0 = start + s.t0 * k;
      s.dur = Math.max(0.1, s.dur * k);
    });
    texts.forEach(function (x) {
      x.t0 = start + x.t0 * k;
      if (x.dur != null) x.dur = Math.max(0.25, x.dur * k);
      if (x.step != null) x.step = Math.max(0.03, x.step * k);
    });
    washes.forEach(function (w) {
      if (w._after) w.t0 = w._after.t0 + w._after.dur * 0.86;
      else if (w.t0 != null) w.t0 = start + w.t0 * k;
      else w.t0 = start + 0.2;
      delete w._after;
    });
    return bundle;
  }

  // ---------- 手写文字（逐字擦出） ----------
  function drawText(ctx, texts, t) {
    for (var n = 0; n < texts.length; n++) {
      var X = texts[n];
      if (!X || !X.str) continue;
      var size = X.size || 60;
      var chars = Array.from(String(X.str));
      if (!chars.length) continue;
      var dur = X.dur == null ? 0.9 : X.dur;
      var step = X.step == null ? dur / chars.length : X.step;
      var per = X.per == null ? Math.max(step * 1.5, 0.05) : X.per;
      var fam = X.family || (X.chalk ? '"zhi"' : '"mk"');
      var weight = X.weight || 400;
      var jr = rng((X.seed || X.str) + ':chars');
      ctx.save();
      ctx.translate(X.x, X.y);
      if (X.rot) ctx.rotate(X.rot);
      ctx.font = weight + ' ' + size + 'px ' + fam;
      // 底色牌：压在流线/图形上也不糊（带一点投影的圆角卡）
      if (X.bg) {
        var k = clamp01((t - X.t0) / 0.3);
        if (k <= 0) { ctx.restore(); continue; }
        var padx = size * 0.34, pady = size * 0.2;
        var w0 = (X.bgW || ctx.measureText(String(X.str)).width) + padx * 2;
        var h0 = size * 1.02 + pady * 2;
        ctx.globalAlpha = (X.bgAlpha == null ? 0.96 : X.bgAlpha) * k;
        ctx.fillStyle = X.bgShadow || 'rgba(28,40,50,0.06)';
        rrect(ctx, -padx + 4, -size * 0.86 - pady + 4, w0, h0, 10, true);
        ctx.fillStyle = X.bgColor || '#fcfcf8';
        rrect(ctx, -padx, -size * 0.86 - pady, w0, h0, 10, true);
        if (X.bgBar) {
          ctx.fillStyle = X.bgBar;
          rrect(ctx, -padx, -size * 0.86 - pady, Math.max(3, size * 0.07), h0, 10, true);
        }
        ctx.globalAlpha = 1;
      }
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = X.color || '#1d1d1d';
      ctx.textAlign = 'left';
      if (X.blur) { ctx.shadowColor = X.color || '#ffffff'; ctx.shadowBlur = X.blur; }
      if (X.letter) ctx.letterSpacing = X.letter + 'px';
      var x = 0;
      for (var i = 0; i < chars.length; i++) {
        var w = ctx.measureText(chars[i]).width;
        var st = X.t0 + i * step;
        var p = clamp01((t - st) / per);
        if (p > 0) {
          ctx.save();
          var jx = (jr() - 0.5) * (X.jitter == null ? 1.6 : X.jitter);
          var jy = (jr() - 0.5) * (X.jitter == null ? 1.6 : X.jitter) * 0.6;
          var jrot = (jr() - 0.5) * (X.rok == null ? 0.03 : X.rok);
          ctx.translate(x + jx, jy);
          ctx.rotate(jrot);
          if (p < 1) {
            ctx.beginPath();
            ctx.rect(-size * 0.12, -size * 1.02, (w + size * 0.24) * p, size * 1.35);
            ctx.clip();
          }
          ctx.globalAlpha = (X.alpha == null ? 1 : X.alpha);
          if (X.bold) { ctx.lineWidth = X.bold; ctx.strokeStyle = X.color || '#1d1d1d'; ctx.lineJoin = 'round'; ctx.strokeText(chars[i], 0, 0); }
          ctx.fillText(chars[i], 0, 0);
          ctx.restore();
        }
        x += w;
      }
      ctx.restore();
    }
  }

  // ---------- 贴片（便利贴 / 卡片）：在笔画之上再压一层，保证不被线穿过去 ----------
  function drawCards(ctx, cards, t) {
    (cards || []).forEach(function (C) {
      var k = ease(clamp01((t - C.t0) / (C.dur || 0.42)));
      if (k <= 0) return;
      ctx.save();
      ctx.translate(C.x || 0, C.y || 0);
      ctx.rotate(C.rot || 0);
      ctx.globalAlpha = (C.alpha == null ? 1 : C.alpha) * k;
      var sx = lerp(0.94, 1, k), sy = lerp(0.94, 1, k);
      ctx.translate((C.w || 0) / 2, (C.h || 0) / 2);
      ctx.scale(sx, sy);
      ctx.translate(-(C.w || 0) / 2, -(C.h || 0) / 2);
      if (C.shadow) {
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.fillRect(6, 8, C.w, C.h);
      }
      ctx.fillStyle = C.color || '#fff2ae';
      ctx.fillRect(0, 0, C.w, C.h);
      if (C.border) {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = C.borderW || 2.4;
        ctx.strokeRect(0, 0, C.w, C.h);
      }
      if (C.fold) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, C.h * (C.fold || 0.72), C.w, Math.max(2, C.h * 0.03));
      }
      ctx.restore();
    });
  }

  return {
    clamp: clamp, clamp01: clamp01, lerp: lerp, ease: ease, rng: rng,
    line: line, quad: quad, cubic: cubic, chain: chain, ellipse: ellipse, arc: arc,
    rect: rect, roundRect: roundRect, close: close,
    translate: translate, rotate: rotate, scale: scale, offset: offset, length: length,
    dashed: dashed, dashes: dashes, arrow: arrow, curveArrow: curveArrow, wave: wave, hatch: hatch,
    Pen: Pen, fit: fit, drawText: drawText, drawCards: drawCards, sign: sign,
  };
})();
