import {useMemo} from 'react';
import * as THREE from 'three';
import type {Ring, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {clamp, smoothstep} from '../theme';

const TAU = Math.PI * 2;
const GOLD = '#ffcf7a';
const GOLD_HOT = '#ffe9bb';
const GOLD_DEEP = '#ffb257';

type V2 = {x: number; y: number};

const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const makeCanvas = (size: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return {canvas, ctx};
};

const toTexture = (canvas: HTMLCanvasElement) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const circleStroke = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  w: number,
  color: string,
  alpha: number,
) => {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const dot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
};

/** 变宽度缎带：沿折线两侧偏移后填充，用来画有起收锋的鸟身/尾羽/漩涡 Rays */
const ribbon = (
  ctx: CanvasRenderingContext2D,
  pts: V2[],
  width: (u: number) => number,
  color: string,
  alpha: number,
) => {
  if (pts.length < 2) return;
  const left: V2[] = [];
  const right: V2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    const w = width(i / (pts.length - 1)) * 0.5;
    left.push({x: p.x + nx * w, y: p.y + ny * w});
    right.push({x: p.x - nx * w, y: p.y - ny * w});
  }
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
};

/** 外环：柔光 + 双细环。生长动画里单独一层，由光笔沿圆周描出来 */
const paintRim = (ctx: CanvasRenderingContext2D, size: number) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.465;

  ctx.lineCap = 'round';

  // 外圈柔光
  ctx.save();
  ctx.filter = `blur(${Math.round(size * 0.01)}px)`;
  circleStroke(ctx, cx, cy, 0.952 * R, size * 0.016, GOLD_DEEP, 0.34);
  ctx.restore();

  // 双细环
  circleStroke(ctx, cx, cy, 0.954 * R, size * 0.0032, GOLD_HOT, 0.88);
  circleStroke(ctx, cx, cy, 0.928 * R, size * 0.0017, GOLD, 0.5);
  circleStroke(ctx, cx, cy, 0.842 * R, size * 0.0014, GOLD, 0.3);
};

/** 环内纹样：四象限点、年轮断弧、放射线、四只旋鸟、金星 */
const paintBody = (ctx: CanvasRenderingContext2D, size: number) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.465;
  const P = (r: number, a: number): V2 => ({x: cx + Math.cos(a) * r * R, y: cy + Math.sin(a) * r * R});

  ctx.lineCap = 'round';

  // 四象限小点
  for (let i = 0; i < 4; i++) {
    const p = P(0.72, (i * TAU) / 4 + Math.PI / 4);
    dot(ctx, p.x, p.y, size * 0.0042, GOLD_HOT, 0.8);
  }

  // 年轮细环（断弧，像树的年轮也像镜片结构）
  const rings = [0.395, 0.442, 0.489, 0.536, 0.583, 0.63, 0.677];
  rings.forEach((r, i) => {
    const start = hash01(i + 11) * TAU;
    const span = TAU * (0.78 + 0.18 * hash01(i + 23));
    ctx.beginPath();
    ctx.arc(cx, cy, r * R, start, start + span);
    ctx.lineWidth = size * 0.0012;
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.08 + 0.05 * hash01(i + 5);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // 放射细线
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.19;
    const p0 = P(0.3, a);
    const p1 = P(0.615, a);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineWidth = size * 0.0011;
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.12;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 四只旋鸟：身、翼、尾、头喙，四重旋转对称
  for (let k = 0; k < 4; k++) {
    const rot = (k * TAU) / 4 + 0.38;

    const body: V2[] = [];
    for (let i = 0; i <= 64; i++) {
      const u = i / 64;
      const th = rot + 0.06 + 1.02 * u;
      const rr = 0.792 - 0.175 * u + 0.05 * Math.sin(Math.PI * u);
      body.push(P(rr, th));
    }
    // 身体中段最厚、尾端收锋、颈端留出接头的宽度，避免头变成浮珠
    const bodyW = (u: number) =>
      (0.004 + 0.048 * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - 0.3 * u) + 0.012 * u * u) * R;
    ribbon(ctx, body, (u) => bodyW(u) * 1.9, GOLD_DEEP, 0.08);
    ribbon(ctx, body, bodyW, GOLD, 0.85);
    ribbon(ctx, body, (u) => bodyW(u) * 0.34, GOLD_HOT, 0.92);

    // 翼：从背部向外扫出的细带
    const wing: V2[] = [];
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      const th = rot + 0.55 + 0.5 * u;
      const rr = 0.655 + 0.115 * Math.sin(Math.PI * u * 0.88);
      wing.push(P(rr, th));
    }
    ribbon(ctx, wing, (u) => (0.0012 + 0.012 * Math.sin(Math.PI * u)) * R, GOLD, 0.5);
    ribbon(ctx, wing, (u) => (0.0006 + 0.004 * Math.sin(Math.PI * u)) * R, GOLD_HOT, 0.55);

    // 翼羽：三根平行细线，让外形从“弯刀”变成“有羽的鸟”
    for (let f = 0; f < 3; f++) {
      const feather: V2[] = [];
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const th = rot + 0.58 + 0.46 * u;
        const rr = 0.675 + f * 0.016 + (0.105 - f * 0.02) * Math.sin(Math.PI * u * 0.88);
        feather.push(P(rr, th));
      }
      ribbon(ctx, feather, (u) => (0.0008 + 0.004 * Math.sin(Math.PI * u)) * R, GOLD, 0.34 - f * 0.07);
    }

    // 尾羽：三根向后散开的细锋
    for (let f = 0; f < 3; f++) {
      const tail: V2[] = [];
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const th = rot + 0.06 - 0.13 * u - f * 0.03 * u;
        const rr = 0.792 - 0.02 * u + f * 0.012 * u;
        tail.push(P(rr, th));
      }
      ribbon(ctx, tail, (u) => (0.0009 + 0.0055 * Math.sin(Math.PI * u)) * R, GOLD, 0.5);
    }

    // 颈：从身体末端往内钩，头才不会像浮珠
    const neck: V2[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const th = rot + 1.08 + 0.07 * u;
      const rr = 0.617 - 0.032 * u;
      neck.push(P(rr, th));
    }
    ribbon(ctx, neck, (u) => (0.012 - 0.004 * u) * R, GOLD, 0.9);

    // 头部与喙：头略大于颈，喙顺着飞行方向收尖
    const head = P(0.585, rot + 1.15);
    dot(ctx, head.x, head.y, 0.0105 * R, GOLD, 0.9);
    dot(ctx, head.x, head.y, 0.0045 * R, GOLD_HOT, 0.85);
    const beak: V2[] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const th = rot + 1.15 + 0.1 * u;
      const rr = 0.585 - 0.006 * u;
      beak.push(P(rr, th));
    }
    ribbon(ctx, beak, (u) => (0.0062 - 0.0054 * u) * R, GOLD, 0.85);
    ribbon(ctx, beak, (u) => (0.0022 - 0.0018 * u) * R, GOLD_HOT, 0.8);
  }

  // 环内金星
  for (let i = 0; i < 140; i++) {
    const a = hash01(i * 3 + 1) * TAU;
    const r = 0.66 + hash01(i * 3 + 2) * 0.22;
    const p = P(r, a);
    const s = 0.5 + hash01(i * 3 + 3) * 1.8;
    dot(ctx, p.x, p.y, s, GOLD_HOT, 0.06 + 0.22 * hash01(i * 3 + 4));
  }
};

/** 静态主纹样：外环 + 环内纹样合成一张 */
const drawEmblem = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  paintRim(ctx, size);
  paintBody(ctx, size);
  return canvas;
};

/** 生长动画：外环与环内纹样分两张，分别做「描环」与「由内向外点亮」 */
const drawRim = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  paintRim(ctx, size);
  return canvas;
};

const drawBody = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  paintBody(ctx, size);
  return canvas;
};

/** 光笔笔尖：中心炽白，向外暖金收尽 */
const drawPen = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  const c = size / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255,255,246,1)');
  g.addColorStop(0.12, 'rgba(255,241,200,0.98)');
  g.addColorStop(0.34, 'rgba(255,207,122,0.55)');
  g.addColorStop(0.68, 'rgba(255,178,87,0.14)');
  g.addColorStop(1, 'rgba(255,178,87,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // 十字拉丝，像笔尖的闪光
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(${Math.round(size * 0.012)}px)`;
  ctx.strokeStyle = 'rgba(255,240,196,0.75)';
  ctx.lineWidth = size * 0.018;
  ctx.beginPath();
  ctx.moveTo(c, size * 0.12);
  ctx.lineTo(c, size * 0.88);
  ctx.moveTo(size * 0.12, c);
  ctx.lineTo(size * 0.88, c);
  ctx.stroke();
  ctx.restore();
  return canvas;
};

/** 刻度环单独一层，慢慢转动 */
const drawTicks = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.465;
  ctx.lineCap = 'round';

  const ticks = 96;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * TAU;
    const long = i % 8 === 0;
    const r0 = 0.874;
    const r1 = long ? 0.916 : 0.898;
    const x0 = cx + Math.cos(a) * r0 * R;
    const y0 = cy + Math.sin(a) * r0 * R;
    const x1 = cx + Math.cos(a) * r1 * R;
    const y1 = cy + Math.sin(a) * r1 * R;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = long ? size * 0.0038 : size * 0.0019;
    ctx.strokeStyle = long ? GOLD_HOT : GOLD;
    ctx.globalAlpha = long ? 1 : 0.62;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 虚线环，转起来能看出方向
  ctx.beginPath();
  ctx.arc(cx, cy, 0.888 * R, 0, TAU);
  ctx.setLineDash([size * 0.011, size * 0.017]);
  ctx.lineWidth = size * 0.0022;
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  return canvas;
};

/** 中心十二芒漩涡，转得比刻度环快一点 */
const drawSwirl = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.465;
  const P = (r: number, a: number): V2 => ({x: cx + Math.cos(a) * r * R, y: cy + Math.sin(a) * r * R});

  ctx.lineCap = 'round';

  for (let k = 0; k < 12; k++) {
    const base = (k * TAU) / 12;
    const pts: V2[] = [];
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      const r = 0.06 + 0.9 * u;
      const a = base + 0.72 * u;
      pts.push(P(r, a));
    }
    const w = (u: number) => (0.002 + 0.075 * Math.sin(Math.PI * Math.pow(u, 0.75))) * R;
    ribbon(ctx, pts, (u) => w(u) * 1.8, GOLD_DEEP, 0.08);
    ribbon(ctx, pts, w, GOLD, 0.8);
    ribbon(ctx, pts, (u) => w(u) * 0.32, GOLD_HOT, 0.92);
  }

  // 内环与外环细线
  circleStroke(ctx, cx, cy, 0.18 * R, size * 0.0022, GOLD_HOT, 0.5);
  circleStroke(ctx, cx, cy, 0.94 * R, size * 0.0018, GOLD, 0.25);
  dot(ctx, cx, cy, 0.05 * R, GOLD_HOT, 0.9);

  // 芒尖小点
  for (let k = 0; k < 12; k++) {
    const a = (k * TAU) / 12 + 0.72;
    const p = P(0.96, a);
    dot(ctx, p.x, p.y, 0.009 * R, GOLD_HOT, 0.8);
  }

  return canvas;
};

/** 地面辉光：中心大范围暖光 + 外环柔晕 */
const drawGlow = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  const cx = size / 2;
  const cy = size / 2;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
  g.addColorStop(0, 'rgba(255, 207, 122, 0.26)');
  g.addColorStop(0.32, 'rgba(255, 196, 102, 0.1)');
  g.addColorStop(0.7, 'rgba(255, 180, 80, 0.035)');
  g.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.filter = `blur(${Math.round(size * 0.018)}px)`;
  circleStroke(ctx, cx, cy, size * 0.465 * 0.952, size * 0.024, GOLD_DEEP, 0.35);
  ctx.restore();

  return canvas;
};

/** 贴地投影：把环与旋鸟压暗一点，金印才像“落”在平原上 */
const drawShadow = (size: number) => {
  const {canvas, ctx} = makeCanvas(size);
  const cx = size / 2 + size * 0.012;
  const cy = size / 2 + size * 0.02;
  const R = size * 0.465;

  ctx.save();
  ctx.filter = `blur(${Math.round(size * 0.012)}px)`;
  circleStroke(ctx, cx, cy, 0.952 * R, size * 0.03, '#000000', 0.55);
  for (let k = 0; k < 4; k++) {
    const rot = (k * TAU) / 4 + 0.38;
    ctx.beginPath();
    ctx.arc(cx, cy, 0.69 * R, rot + 0.1, rot + 1.0);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = '#000000';
    ctx.globalAlpha = 0.4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  return canvas;
};

/**
 * 「这里就是苏州」镜头光圈。
 * 参考成都版开篇的金沙金印：双细环、旋转刻度、四只旋鸟、中心十二芒漩涡、
 * 年轮细环与地面辉光。分层贴地，刻度环与中心漩涡随时间慢转。
 * 前 514 年筑城之前用它点出未来城址，城建后到前 221 年之间淡出。
 */
const easeOutBack = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

/**
 * 生长动画时间表（秒）：
 * 光笔先描外环，再由中心向外点亮年轮/旋鸟，最后刻度环与漩涡成形。
 * 起点放在开场 1.4 s 黑场之后，4.2 s 左右长满，正好接住样片 4.3 s 的机位落定。
 */
const GROW = {
  pen: 1.5,
  penDur: 1.35,
  body: 2.2,
  bodyDur: 2.0,
  ticks: 2.6,
  ticksDur: 0.9,
  swirl: 2.7,
  swirlDur: 1.2,
  glow: 1.5,
  glowDur: 2.3,
  shadow: 2.3,
  shadowDur: 2.2,
};

/** 外环描边着色器：按圆周角度逐步显形，笔尖附近额外发光 */
const makeRimMaterial = (map: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uMap: {value: map},
      uOpacity: {value: 0},
      uArc: {value: 0},
      uPen: {value: 0},
    },
    vertexShader: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; uniform float uArc; uniform float uPen;
      varying vec2 vUv;
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        vec2 p = vUv - 0.5;
        float ang = atan(p.x, p.y);
        if (ang < 0.0) ang += 6.2831853;
        float edge = uArc * 6.2831853;
        float drawn = 1.0 - smoothstep(edge - 0.05, edge, ang);
        float d = abs(ang - edge);
        d = min(d, 6.2831853 - d);
        float r = length(p) * 2.0;
        // 外环贴图半径 = 0.954 * 0.465 * 2 ≈ 0.887
        float rimMask = exp(-pow((r - 0.887) / 0.055, 2.0));
        float head = exp(-d * d / 0.004) * rimMask * uPen;
        vec3 col = tex.rgb + head * vec3(1.0, 0.82, 0.46);
        float a = max(tex.a * drawn, head * 0.85) * uOpacity;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

/** 环内点亮着色器：显示半径由中心向外推进，光锋扫过处发亮 */
const makeBodyMaterial = (map: THREE.Texture) =>
  new THREE.ShaderMaterial({
    uniforms: {
      uMap: {value: map},
      uOpacity: {value: 0},
      uReveal: {value: 0},
      uFront: {value: 0},
    },
    vertexShader: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; uniform float uReveal; uniform float uFront;
      varying vec2 vUv;
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float reveal = uReveal * 0.95;
        float vis = 1.0 - smoothstep(reveal - 0.06, reveal, r);
        float front = exp(-pow((r - reveal) / 0.028, 2.0)) * uFront;
        vec3 col = tex.rgb + front * vec3(1.0, 0.78, 0.42) * 0.7;
        float a = max(tex.a * vis, front * 0.5) * uOpacity;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

export const Aperture: React.FC<{
  ring?: Ring;
  terrain: Terrain;
  year: number;
  t: number;
  /** 样片：光圈从无到有，光笔描外环 + 由中心向外点亮 */
  grow?: boolean;
}> = ({ring, terrain, year, t, grow}) => {
  const geo = useMemo(() => {
    if (!ring || ring.polygon.length < 3) return null;
    let cx = 0;
    let cz = 0;
    for (const [x, z] of ring.polygon) {
      cx += x;
      cz += z;
    }
    cx /= ring.polygon.length;
    cz /= ring.polygon.length;
    let maxR = 0;
    for (const [x, z] of ring.polygon) maxR = Math.max(maxR, Math.hypot(x - cx, z - cz));
    // 光圈略小于城墙轮廓：从高空看是一枚落在平原上的印章，而不是又一个城墙圈
    const radius = Math.max(900, maxR * 0.56);
    return {cx, cz, radius, y: sampleHeight(terrain, cx, cz) + 18};
  }, [ring, terrain]);

  const art = useMemo(() => {
    if (!geo || typeof document === 'undefined') return null;
    return {
      emblem: toTexture(drawEmblem(2048)),
      ticks: toTexture(drawTicks(2048)),
      swirl: toTexture(drawSwirl(1024)),
      glow: toTexture(drawGlow(1024)),
      shadow: toTexture(drawShadow(1024)),
      rim: grow ? toTexture(drawRim(2048)) : null,
      body: grow ? toTexture(drawBody(2048)) : null,
      pen: grow ? toTexture(drawPen(256)) : null,
    };
  }, [geo, grow]);

  const mats = useMemo(() => {
    if (!art?.rim || !art?.body) return null;
    return {rim: makeRimMaterial(art.rim), body: makeBodyMaterial(art.body)};
  }, [art]);

  const alpha = year <= -514 ? 0.95 : clamp(1 - (year + 514) / 293, 0, 1);
  const pulse = 0.88 + 0.12 * Math.sin(t * 1.7);

  if (!geo || !art || alpha <= 0.002) return null;

  const size = geo.radius * 2;
  const layer = 0.6;

  const grows = grow === true;

  // 样片两次「从无到有」，样子不同：
  //   ① 1.5–4.2 s 光笔描外环 + 环内由中心向外点亮；
  //   ② 11.55 s 整枚收束湮灭，12.0 s 环形先立起、环内快速爆开，同时旋入归位。
  const COLLAPSE_T0 = 11.55;
  const COLLAPSE_T1 = 12.0;

  let arc = 1;
  let bodyU = 1;
  let reveal = 1;
  let ticksI = 1;
  let swirlI = 1;
  let swirlS = 1;
  let glowI = 1;
  let shadowI = 1;
  let penVis = 0;
  let frontI = 0;
  let growScale = 1;
  let growOpacity = 1;
  let bloomSpin = 0;

  if (grows) {
    if (t < COLLAPSE_T0) {
      arc = clamp((t - GROW.pen) / GROW.penDur, 0, 1);
      bodyU = clamp((t - GROW.body) / GROW.bodyDur, 0, 1);
      reveal = bodyU * bodyU * (3 - 2 * bodyU);
      ticksI = clamp((t - GROW.ticks) / GROW.ticksDur, 0, 1);
      const swirlU = clamp((t - GROW.swirl) / GROW.swirlDur, 0, 1);
      swirlS = Math.max(0.0001, easeOutBack(swirlU));
      swirlI = clamp((t - GROW.swirl) / 0.45, 0, 1);
      glowI = clamp((t - GROW.glow) / GROW.glowDur, 0, 1);
      shadowI = clamp((t - GROW.shadow) / GROW.shadowDur, 0, 1);
      penVis = Math.min(1, clamp((t - GROW.pen) / 0.18, 0, 1)) * (1 - clamp((arc - 0.94) / 0.06, 0, 1));
      frontI = 1 - clamp((bodyU - 0.7) / 0.3, 0, 1);
    } else if (t < COLLAPSE_T1) {
      // 收束：整体缩成一点再淡出，后面才有真正的「无」
      const u = clamp((t - COLLAPSE_T0) / (COLLAPSE_T1 - COLLAPSE_T0), 0, 1);
      growScale = 1 - 0.99 * u * u;
      growOpacity = 1 - smoothstep(0.35, 1, u);
      bloomSpin = -0.9 * u * u;
    } else {
      // 第二次生长：与光笔描环完全不同——外环整圈先立住，环内由中心爆开，
      // 整体带一点回弹放大和反向旋入，落定时归位。
      const lt = t - COLLAPSE_T1;
      const bu = clamp(lt / 0.7, 0, 1);
      reveal = bu * bu * (3 - 2 * bu);
      bodyU = bu;
      const su = clamp(lt / 1.0, 0, 1);
      growScale = 0.05 + 0.95 * Math.max(0.0001, easeOutBack(su));
      growScale *= 1 + 0.05 * Math.exp(-lt * 3.0) * Math.sin(lt * 9);
      growOpacity = clamp(lt / 0.18, 0, 1);
      ticksI = clamp((lt - 0.3) / 0.65, 0, 1);
      const wu = clamp((lt - 0.42) / 0.7, 0, 1);
      swirlS = Math.max(0.0001, easeOutBack(wu));
      swirlI = clamp((lt - 0.42) / 0.36, 0, 1);
      glowI = clamp(lt / 0.55, 0, 1) * (1 + 0.35 * Math.exp(-lt * 2.2));
      shadowI = clamp((lt - 0.2) / 0.8, 0, 1);
      frontI = (1 - clamp((bu - 0.5) / 0.5, 0, 1)) * clamp(lt / 0.06, 0, 1);
      bloomSpin = -0.62 * (1 - smoothstep(0, 1.4, lt));
    }
  }

  // 样片实时抖动：位置轻漂、整体微旋、呼吸缩放、亮度微闪；正片保持完全静止。
  const op = alpha * growOpacity * (grows ? 0.95 + 0.05 * Math.sin(3.1 * t) : 1);
  const breath = grows ? 1 + 0.004 * Math.sin(2.9 * t) : 1;
  const jx = grows ? 18 * Math.sin(1.13 * t) + 6 * Math.sin(2.71 * t + 1.3) : 0;
  const jz = grows ? 18 * Math.cos(0.97 * t + 0.5) + 6 * Math.cos(2.33 * t + 2.1) : 0;
  const jy = grows ? 4 * Math.sin(1.61 * t + 0.7) : 0;
  const jrot = grows ? 0.005 * Math.sin(0.87 * t) + 0.002 * Math.sin(2.17 * t + 1.1) : 0;

  if (grows && mats) {
    mats.rim.uniforms.uOpacity.value = op;
    mats.rim.uniforms.uArc.value = arc;
    mats.rim.uniforms.uPen.value = penVis;
    mats.body.uniforms.uOpacity.value = op;
    mats.body.uniforms.uReveal.value = reveal;
    mats.body.uniforms.uFront.value = frontI;
  }

  // 外环/环内贴图额外转了 0.38 rad，笔尖跟着转同一角度才落在描边的锋口上
  const penR = geo.radius * 0.887;
  const penAng = arc * TAU - 0.38 + jrot;
  const penX = Math.sin(penAng) * penR;
  const penY = Math.cos(penAng) * penR;

  return (
    <group
      position={[geo.cx + jx, geo.y + jy, geo.cz + jz]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <group scale={growScale * breath}>
        <mesh renderOrder={5} position={[0, 0, 0]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={art.shadow}
            transparent
            opacity={0.5 * op * shadowI}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh renderOrder={6} position={[0, 0, layer]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={art.glow}
            transparent
            opacity={op * pulse * glowI}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {grows && mats ? (
          <>
            <mesh renderOrder={7} position={[0, 0, layer * 2]} rotation={[0, 0, 0.38 + jrot]}>
              <planeGeometry args={[size, size]} />
              <primitive object={mats.rim} attach="material" />
            </mesh>
            <mesh
              renderOrder={7}
              position={[0, 0, layer * 2 + 0.02]}
              rotation={[0, 0, 0.38 + jrot]}
            >
              <planeGeometry args={[size, size]} />
              <primitive object={mats.body} attach="material" />
            </mesh>
            {art.pen && penVis > 0.001 && (
              <mesh
                renderOrder={10}
                position={[penX, penY, layer * 4.6]}
                scale={penVis}
              >
                <planeGeometry args={[geo.radius * 0.13, geo.radius * 0.13]} />
                <meshBasicMaterial
                  map={art.pen}
                  transparent
                  opacity={op}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            )}
          </>
        ) : (
          <mesh renderOrder={7} position={[0, 0, layer * 2]} rotation={[0, 0, 0.38]}>
            <planeGeometry args={[size, size]} />
            <meshBasicMaterial
              map={art.emblem}
              transparent
              opacity={op}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}
        <mesh
          renderOrder={8}
          position={[0, 0, layer * 3]}
          rotation={[0, 0, -t * 0.028 + bloomSpin + jrot]}
        >
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            map={art.ticks}
            transparent
            opacity={op * 0.92 * ticksI}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh
          renderOrder={9}
          position={[0, 0, layer * 4]}
          rotation={[0, 0, t * 0.075 + bloomSpin * 1.6 + jrot]}
          scale={swirlS}
        >
          <planeGeometry args={[geo.radius * 0.72, geo.radius * 0.72]} />
          <meshBasicMaterial
            map={art.swirl}
            transparent
            opacity={op * swirlI}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};
