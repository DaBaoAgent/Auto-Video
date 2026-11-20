/* Drawing helpers for cel contours, graphite and ink-and-wash artwork. */
window.Hand = (() => {
  const { line, circle, rect, path, rng } = Paper;
  const tau = Math.PI * 2;
  const clamp = Paper.clamp;

  function polygon(c, pts, fill = null, stroke = null, width = 1) {
    c.beginPath();
    c.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  function ellipse(c, x, y, rx, ry, angle, fill, stroke = null, width = 1) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, angle, 0, tau);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  function loop(x, y, rx, ry, start = 0, end = tau, n = 32) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const theta = start + (end - start) * i / n;
      return [x + rx * Math.cos(theta), y + ry * Math.sin(theta)];
    });
  }

  function stroke(c, pts, end, color, width = 1.5, rough = 0, seed = 22) {
    const random = rng(seed);
    const length = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    let left = length.reduce((a, b) => a + b, 0) * clamp(end);
    const jitter = ([x, y]) => [x + (random() - .5) * rough, y + (random() - .5) * rough];
    let previous = jitter(pts[0]), tip = previous;
    c.beginPath();
    c.moveTo(...previous);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const next = jitter(pts[i]);
      const p = Math.min(1, left / (length[i - 1] || 1));
      tip = [Paper.mix(previous[0], next[0], p), Paper.mix(previous[1], next[1], p)];
      c.lineTo(...tip);
      left -= length[i - 1];
      previous = next;
    }
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
    return tip;
  }

  function hatching(c, mask, bounds, color, seed, spacing = 8, incline = -.55) {
    c.save();
    c.clip(mask);
    const [x, y, w, h] = bounds, random = rng(seed);
    for (let j = 0; j < h + w * Math.abs(incline); j += spacing) {
      for (let i = 0; i < w + 20; i += 17 + random() * 35) {
        const yy = y + j + i * incline + (random() - .5) * 6;
        const len = 10 + random() * 33;
        line(c, [[x + i, yy], [x + i + len * .5, yy + len * incline * .4],
          [x + i + len, yy + len * incline]], color, .5 + random() * 1.4);
      }
    }
    c.restore();
  }

  function water(c, cx, cy, rx, ry, t, color, strength = 1) {
    c.save();
    c.globalAlpha *= strength;
    for (let i = 0; i < 6; i++) {
      const age = (t * .43 + i / 6) % 1;
      c.globalAlpha = strength * (1 - age);
      stroke(c, loop(cx + 7 * age, cy, rx * (.72 + .50 * age), ry * (.72 + age),
        (i % 3) * .82, (i % 3) * .82 + 2.9), 1, color, 1.4);
    }
    c.restore();
  }

  // Closed tapered outline for a limb; the underlying joints can use IK or pose keys.
  function limb(c, a, b, r0, r1, fill, edge, lw = 1.45) {
    const theta = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const q = [Math.sin(theta), -Math.cos(theta)];
    c.beginPath();
    c.moveTo(a[0] + q[0] * r0, a[1] + q[1] * r0);
    c.lineTo(b[0] + q[0] * r1, b[1] + q[1] * r1);
    c.arc(b[0], b[1], r1, theta - Math.PI / 2, theta + Math.PI / 2);
    c.lineTo(a[0] - q[0] * r0, a[1] - q[1] * r0);
    c.arc(a[0], a[1], r0, theta + Math.PI / 2, theta + 1.5 * Math.PI);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (edge) { c.strokeStyle = edge; c.lineWidth = lw; c.stroke(); }
  }

  function joint(a, b, upper, lower, bend) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const raw = Math.max(Math.hypot(dx, dy), .01);
    const len = Math.max(Math.abs(upper - lower) + .01, Math.min(raw, upper + lower - .01));
    const u = (upper ** 2 - lower ** 2 + len ** 2) / (2 * len);
    const n = Math.sqrt(Math.max(0, upper ** 2 - u ** 2)) * bend;
    return [a[0] + (u * dx - n * dy) / raw, a[1] + (u * dy + n * dx) / raw];
  }

  function paper(c, color, vignette = "#8e795840") {
    rect(c, 0, 0, 1280, 720, color);
    const shade = c.createRadialGradient(640, 355, 240, 640, 355, 749);
    shade.addColorStop(0, "#99744d00");
    shade.addColorStop(1, vignette);
    rect(c, 0, 0, 1280, 720, shade);
  }

  function wash(c, d, color, bounds, seed, strength = .72) {
    c.save();
    c.globalAlpha *= strength;
    c.globalCompositeOperation = "multiply";
    c.translate(1.8, 1.1);
    c.fillStyle = color;
    const mask = path(d);
    c.fill(mask);
    c.strokeStyle = color;
    c.lineWidth = 1.8;
    c.globalAlpha *= .62;
    c.stroke(mask);
    c.clip(mask);
    const [x, y, w, h] = bounds, random = rng(seed);
    const clouds = Math.round(16 + w * h / 1450);
    for (let i = 0; i < clouds; i++) {
      const dx = x + random() * w, dy = y + random() * h, r = 2 + random() * 19;
      circle(c, dx, dy, r, i % 3 ? "#8e705b12" : "#fff7df4e", r * (.3 + random() * .64));
    }
    c.restore();
  }

  return { tau, polygon, ellipse, loop, stroke, hatching, water, limb, joint, paper, wash };
})();
