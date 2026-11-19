// cast-lite.js — the parts of claude-animated-shorts/templates/bridge/cast.ts that apply to a
// Canvas2D billboard: the blink clock and the side/front drawing wrapper. The 3D billboard,
// pool and card-shading are omitted (our scene draws 2D characters into the laolang camera).
// Source: cast.ts lidAt() (FPS 30, LID [0.5,1,1,0.5], LEAD 2 frames, gaps 0.5-2.3 s).
(function () {
  const FPS = 30;
  const LEAD = 2 / FPS;
  const LID = [0.5, 1, 1, 0.5];
  const hh = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  // eyelid 0 open .. 1 shut; a blink across every expression swap hides the swap
  function lidAt(t, i, swaps = []) {
    const f = Math.round(t * FPS);
    for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
    let s = Math.round(-60 * hh(i, 9));
    for (let n = 0; s <= f && n < 400; n++) {
      const k = f - s;
      if (k >= 0 && k < 4) return LID[k];
      s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
    }
    return 0;
  }
  // one 600x1000 design canvas per actor; caller clears and supplies the pose
  const pool = [];
  function canvas(i) {
    let c = pool[i];
    if (!c) { c = document.createElement('canvas'); c.width = 600; c.height = 1000; pool[i] = c; }
    const g = c.getContext('2d'); g.clearRect(0, 0, 600, 1000);
    return { c, g };
  }
  function draw(i, out, opts, side = true) {
    const { c, g } = canvas(i);
    const p = new TOON.Pen(g);
    if (side) TOON.bodySide(p, out, opts); else TOON.bodyFront(p, out, opts);
    return c;
  }
  window.CAST = { FPS, LEAD, LID, lidAt, draw };
})();
