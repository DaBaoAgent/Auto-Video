/* Shared drawing primitives for the four original 10-second samples. */
window.Paper = (() => {
  const W = 1280, H = 720;
  const pathCache = new Map();
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = (p) => clamp(p) ** 2 * (3 - 2 * clamp(p));
  const progress = (t, start, duration) => smooth((t - start) / duration);

  function path(d) {
    if (!pathCache.has(d)) pathCache.set(d, new Path2D(d));
    return pathCache.get(d);
  }

  function shape(c, d, fill, stroke, width = 1) {
    const p = path(d);
    if (fill) {
      c.fillStyle = fill;
      c.fill(p, "evenodd");
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke(p);
    }
  }

  function line(c, points, color, width = 1) {
    c.beginPath();
    c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }

  function circle(c, x, y, r, color, ry = r) {
    c.beginPath();
    c.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }

  function text(c, value, x, y, size, color, font = "Kai", align = "left") {
    c.textAlign = align;
    c.textBaseline = "alphabetic";
    c.font = `${size}px ${font}, serif`;
    c.fillStyle = color;
    c.fillText(value, x, y);
  }

  function layer(draw) {
    const canvas = document.createElement("canvas");
    [canvas.width, canvas.height] = [W, H];
    draw(canvas.getContext("2d"));
    return canvas;
  }

  function rng(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  const grain = layer((c) => {
    const random = rng(516);
    for (let i = 0; i < 42000; i++) {
      const x = random() * W, y = random() * H;
      rect(c, x, y, 0.4 + random() * 2.6, 0.45 + random() * 1.1,
        random() > 0.45 ? "#fff6d91c" : "#271f1326");
    }
    for (let i = 0; i < 850; i++) {
      const x = random() * W, y = random() * H;
      line(c, [[x, y], [x + 4 + random() * 8, y + 1.2]], "#48331b20", 0.65);
    }
  });

  function silk(c, strength = 1) {
    c.save();
    c.globalAlpha = strength;
    c.drawImage(grain, 0, 0);
    c.restore();
  }

  function seal(c, x, y, characters, size = 55, color = "#9e3c29") {
    c.save();
    c.translate(x, y);
    c.rotate(-0.035);
    rect(c, 0, 0, size, size, color);
    c.strokeStyle = "#e2ae80";
    c.lineWidth = 1.3;
    c.strokeRect(4, 4, size - 8, size - 8);
    text(c, characters[0], size / 2, size * 0.46, size * 0.36, "#f1cf9f", "Kai", "center");
    text(c, characters[1], size / 2, size * 0.83, size * 0.36, "#f1cf9f", "Kai", "center");
    c.restore();
  }

  function caption(c, id, t, mode) {
    const cue = (window.VOICE_CUES[id] || []).find((item) => t >= item.start && t < item.end + 0.22);
    if (!cue) return;
    c.save();
    c.globalAlpha = Math.min(1, (t - cue.start + 0.03) / 0.13, (cue.end + 0.22 - t) / 0.17);
    if (mode === "words") {
      const spoken = cue.words.find((word) => t >= word.start && t < word.end);
      const parts = spoken ? [cue.text.slice(0, spoken.from), cue.text.slice(spoken.from, spoken.to),
        cue.text.slice(spoken.to)] : [cue.text];
      c.font = "36px Bold, sans-serif";
      const widths = parts.map((part) => c.measureText(part).width);
      let x = (W - widths.reduce((a, b) => a + b, 0)) / 2;
      c.textBaseline = "alphabetic";
      c.textAlign = "left";
      c.lineJoin = "round";
      c.lineWidth = 4.4;
      c.strokeStyle = "#17272c";
      parts.forEach((part, i) => {
        c.strokeText(part, x, 653);
        c.fillStyle = i === 1 ? "#ffe0a1" : "#fff5de";
        c.fillText(part, x, 653);
        x += widths[i];
      });
    } else {
      text(c, cue.text, W / 2, 658, 37, "#342922", "Serif", "center");
    }
    c.restore();
  }

  function camera(c, canvas, x, y, zoom, dx = 0, dy = 0) {
    c.save();
    c.translate(x + dx, y + dy);
    c.scale(zoom, zoom);
    c.drawImage(canvas, -x, -y);
    c.restore();
  }

  function register(id, render, init) {
    window.SCENES[id] = {
      init,
      draw(c, t) {
        c.save();
        c.setTransform(c.canvas.width / W, 0, 0, c.canvas.height / H, 0, 0);
        c.lineCap = "round";
        c.lineJoin = "round";
        render(c, t);
        c.restore();
      },
    };
  }

  return { W, H, clamp, mix, smooth, progress, path, shape, line, circle, rect, text,
    layer, rng, silk, seal, caption, camera, register };
})();
