function figureMasked(cx, gy, h, coat, rim) {
  const q = Math.round;
  const hip = gy - q(h * 0.26);
  const sh = gy - q(h * 0.86);
  // 腿
  rect(cx - q(h * 0.09), hip, Math.max(3, q(h * 0.07)), q(h * 0.26), P.ink);
  rect(cx + q(h * 0.02), hip, Math.max(3, q(h * 0.07)), q(h * 0.26), P.ink);
  // 大衣
  poly([[cx - q(h * 0.16), hip + 2], [cx + q(h * 0.16), hip + 2],
    [cx + q(h * 0.13), sh + q(h * 0.10)], [cx + q(h * 0.15), sh],
    [cx - q(h * 0.15), sh], [cx - q(h * 0.13), sh + q(h * 0.10)]], coat);
  // 双臂
  poly([[cx - q(h * 0.15), sh + 2], [cx - q(h * 0.10), sh + 2],
    [cx - q(h * 0.08), hip - q(h * 0.02)], [cx - q(h * 0.14), hip - q(h * 0.02)]], coat);
  poly([[cx + q(h * 0.10), sh + 2], [cx + q(h * 0.15), sh + 2],
    [cx + q(h * 0.15), hip - q(h * 0.02)], [cx + q(h * 0.09), hip - q(h * 0.02)]], coat);
  // 右侧月光轮廓
  for (let y = sh; y < hip; y++) {
    const u = (y - sh) / Math.max(1, hip - sh);
    const w = q(h * 0.15) - Math.round(u * h * 0.02);
    px(cx + w, y, rim);
    if (u < 0.4) px(cx + w - 1, y, rim);
    if (u > 0.72) px(cx + w - 2, y, rim);
  }
  // 领口
  hline(cx - q(h * 0.06), sh + 1, q(h * 0.12), P.ink);
  // 头 + 麻布面具
  const hy = gy - q(h * 0.99);
  const rx = Math.max(6, q(h * 0.082)), ry = Math.max(8, q(h * 0.108));
  ellipseFill(cx, hy, rx, ry, P.g1);
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    if ((i * i) / (rx * rx) + (j * j) / (ry * ry) > 1) continue;
    const n = hash(cx + i * 5, hy + j * 5);
    if (n < 0.16) px(cx + i, hy + j, P.g0);
    else if (n > 0.92) px(cx + i, hy + j, P.cream);
  }
  for (let j = -ry; j <= ry; j++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))));
    px(cx + w, hy + j, P.cream);
  }
  // 眼窝（黑孔 + 一颗红光）
  const ex = Math.max(2, Math.round(rx * 0.34)), ey = Math.max(2, Math.round(ry * 0.20));
  ellipseFill(cx - Math.round(rx * 0.40), hy - Math.round(ry * 0.14), ex, ey, P.ink);
  ellipseFill(cx + Math.round(rx * 0.40), hy - Math.round(ry * 0.14), ex, ey, P.ink);
  // 缝线
  for (let j = -ry + 2; j < ry - 1; j += 3) px(cx, hy + j, P.ink);
  hline(cx - rx + 2, hy + Math.round(ry * 0.42), rx * 2 - 4, P.ink);
  hline(cx - rx + 2, hy - Math.round(ry * 0.54), rx * 2 - 4, P.ink);
}
function silhouetteFall(cx, gy, h, k, c, rim) {
  const q = Math.round, ang = k * Math.PI / 2;
  const s = Math.sin(ang), co = Math.cos(ang);
  const PT = (x, y) => [q(cx + x * co - y * s), q(gy + x * s + y * co)];
  const hipL = PT(-h * 0.09, -h * 0.30), hipR = PT(h * 0.09, -h * 0.30);
  const shL = PT(-h * 0.14, -h * 0.82), shR = PT(h * 0.14, -h * 0.82);
  const ftL = PT(-h * 0.07, 0), ftR = PT(h * 0.07, 0);
  poly([hipL, hipR, shR, shL], c);
  line(ftL[0], ftL[1], hipL[0], hipL[1], c);
  line(ftR[0], ftR[1], hipR[0], hipR[1], c);
  const hd = PT(0, -h * 0.95);
  disc(hd[0], hd[1], Math.max(3, q(h * 0.075)), c);
  const arL = PT(-h * 0.20, -h * 0.55), arR = PT(h * 0.20, -h * 0.55);
  line(shL[0], shL[1], arL[0], arL[1], c);
  line(shR[0], shR[1], arR[0], arR[1], c);
  // 受光侧
  for (let i = 0; i < 4; i++) px(shR[0] + i, shR[1] + i, rim);
  px(hd[0] + Math.max(2, q(h * 0.06)), hd[1] - 1, rim);
}
function bloodPool(cx, cy, r, k) {
