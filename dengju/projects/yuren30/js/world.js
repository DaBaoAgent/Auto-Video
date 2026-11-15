// 013 羽人 · 等距微缩世界
// 广州象岗山 1983 工地 → 黑匣子与四件物证 → 海上路线 → 南极冰下古河道
// → 削山 / 石板 / 43 天 → 揭盖露出七间石室。
// 所有动画都是 t 的闭式函数；随机数只来自 A.rng(seed)。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as A from './anim.js';
import { LAYER_GLOW, LAYER_BG } from './render.js';

export const PAL = {
  bgTop: '#F3EFFF', bgMid: '#DAD3F7', bgLow: '#C4BAEF', dot: '#A79EE2',
  grass: ['#94DFBD', '#8CDBB6', '#9DE3C4', '#86D6B0'], grassDeep: '#74CBA3',
  plaza: '#F4F1FD', road: '#8781D0', mark: '#FBFAFF', water: '#8CC6FF',
  white: '#FBFAFF', peach: '#FFC4AC', sky: '#A8D2FF', mint: '#B7ECD6', lilac: '#D9D1FA', butter: '#FFE6A1',
  coral: '#FF9E86', deepSky: '#74A9F2', soil1: '#FFFFFF', soil2: '#CBC3F3', soil3: '#B2A8EC', soil4: '#9F95E1',
  ink: '#2C2960', jade: '#CFEBDD', gold: '#FFD98A', silver: '#DCE3F0',
  sand: '#D9A38E', sandDark: '#C98D78', sandLight: '#E7B9A6',
};
const C = (h) => new THREE.Color(h);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- helpers
const gcache = new Map();
function rbox(w, h, d, r = 0.08, seg = 3) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const k = `rb${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${r.toFixed(3)}_${seg}`;
  if (!gcache.has(k)) { const g = new RoundedBoxGeometry(w, h, d, seg, r); g.translate(0, h / 2, 0); gcache.set(k, g); }
  return gcache.get(k);
}
function cyl(rt, rb, h, seg = 20) {
  const k = `cy${rt}_${rb}_${h}_${seg}`;
  if (!gcache.has(k)) { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g.translate(0, h / 2, 0); gcache.set(k, g); }
  return gcache.get(k);
}
const mcache = new Map();
function std(hex, o = {}) {
  const k = `${hex}_${o.rough ?? 0.72}_${o.env ?? 0.35}_${o.emissive ?? ''}_${o.ei ?? 1}_${o.metal ?? 0}_${o.op ?? 1}_${o.tr ?? 0}`;
  if (!mcache.has(k)) {
    const m = new THREE.MeshStandardMaterial({
      color: C(hex), roughness: o.rough ?? 0.72, metalness: o.metal ?? 0, envMapIntensity: o.env ?? 0.35,
      emissive: o.emissive ? C(o.emissive) : new THREE.Color(0), emissiveIntensity: o.ei ?? 1,
      transparent: (o.op ?? 1) < 1, opacity: o.op ?? 1, depthWrite: (o.op ?? 1) >= 1,
    });
    if (o.tr) m.transparent = true;
    mcache.set(k, m);
  }
  return mcache.get(k);
}
function mesh(geo, mat, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow; m.receiveShadow = true;
  return m;
}
function glow(m) { m.layers.set(LAYER_GLOW); m.castShadow = false; return m; }
function addTo(parent, ...kids) { for (const k of kids) parent.add(k); return parent; }

function roundedRectPoints(w, d, r, n) {
  const pts = [];
  const hw = w / 2 - r, hd = d / 2 - r;
  const corners = [[hw, hd, 0], [-hw, hd, Math.PI / 2], [-hw, -hd, Math.PI], [hw, -hd, -Math.PI / 2]];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI / 2;
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  }
  return pts;
}

// ---------------------------------------------------------------- world
export async function buildWorld(renderer, cues) {
  await document.fonts.load("700 100px 'PuHuiTi'", '南越王墓象岗山冰下古河道黑匣子');
  await document.fonts.load("700 100px 'PuHuiTi'", '非洲象牙波斯药盒五色药石丝缕玉衣七间石室十五殉人');
  await document.fonts.ready;

  const scene = new THREE.Scene();
  const U = { uTime: { value: 0 } };

  // environment / camera
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const VH = 18, aspect = 16 / 9;
  const camera = new THREE.OrthographicCamera(-VH * aspect / 2, VH * aspect / 2, VH / 2, -VH / 2, 1, 400);
  const DIR = V3(1, 1, 1).normalize();
  const camRight = V3(1, 0, -1).normalize();
  const camUp = V3(-1, 2, -1).normalize();

  // lights
  const hemi = new THREE.HemisphereLight(C('#F6F3FF'), C('#C9BFF0'), 0.78);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(C('#FFF3E6'), 2.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -19; sc.right = 19; sc.top = 19; sc.bottom = -19; sc.near = 1; sc.far = 100;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.018;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(C('#DCE4FF'), 0.32);
  fill.position.set(6, 3, -2); scene.add(fill);
  const sunDir0 = V3(-0.42, 1.0, 0.62).normalize();

  // ---------------------------------------------------------------- background quad
  const bgU = {
    uInvVP: { value: new THREE.Matrix4() }, uFwd: { value: DIR.clone().negate() },
    uTop: { value: C(PAL.bgTop) }, uMid: { value: C(PAL.bgMid) }, uLow: { value: C(PAL.bgLow) }, uDot: { value: C(PAL.dot) },
    uFloorY: { value: -7.5 }, uOff: { value: new THREE.Vector2() }, uZoom: { value: 1 },
    uShadowA: { value: new THREE.Vector2(0, 0) }, uShadowB: { value: new THREE.Vector2(24, -24) }, uShadowH: { value: new THREE.Vector2(7.6, 6.4) }, uShadow: { value: 1 },
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vNdc; void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: /* glsl */`
      uniform mat4 uInvVP; uniform vec3 uFwd; uniform vec3 uTop, uMid, uLow, uDot;
      uniform float uFloorY, uZoom, uShadow; uniform vec2 uOff, uShadowA, uShadowB, uShadowH;
      varying vec2 vNdc;
      float sdRoundBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec2 uv = vNdc * 0.5 + 0.5;
        vec3 col = mix(mix(uLow, uMid, smoothstep(0.0, 0.55, uv.y)), uTop, smoothstep(0.48, 1.0, uv.y));
        vec2 q = vNdc; q.x *= 1.7778;
        col = mix(col, uTop * 1.025, 0.30 * exp(-dot(q - vec2(0.10, 0.18), q - vec2(0.10, 0.18)) * 1.1));
        // iso dot floor
        vec4 p = uInvVP * vec4(vNdc, -1.0, 1.0); p.xyz /= p.w;
        float tt = (uFloorY - p.y) / uFwd.y; vec3 w = p.xyz + uFwd * tt;
        vec2 g = w.xz + uOff;
        vec2 cc = g - floor(g + 0.5);
        float dd = length(cc);
        float aa = fwidth(dd) * 1.1 + 0.003;
        float r = mix(0.034 / sqrt(max(uZoom, 0.5)), 2.2 / (60.0 * uZoom), 0.0);
        float dotm = 1.0 - smoothstep(r - aa, r + aa, dd);
        float fade = exp(-dot(w.xz, w.xz) * 0.0026);
        col = mix(col, uDot, dotm * 0.55 * fade);
        // soft floor shadows under the two islands (dot-space, fixed to the islands)
        vec2 sa = uShadowA - vec2(0.0);
        vec2 sb = uShadowB - vec2(0.0);
        float da = sdRoundBox(g - sa, uShadowH, 2.0);
        float db = sdRoundBox(g - sb, uShadowH, 2.0);
        float sh = (1.0 - smoothstep(-2.6, 3.0, min(da, db))) * 0.62 + (1.0 - smoothstep(-2.8, 1.0, min(da, db))) * 0.16;
        col = mix(col, col * vec3(0.72, 0.70, 0.89), sh * uShadow);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgQuad.frustumCulled = false; bgQuad.renderOrder = -1000; bgQuad.layers.set(LAYER_BG);
  scene.add(bgQuad);

  // ---------------------------------------------------------------- camera choreography (screen-space pan + zoom)
  const CAMX = [[0, 0.0], [3.59, 0.10], [6.74, 0.0], [8.83, 0.10], [9.20, 9.0], [9.60, 22.0], [10.05, 33.0], [10.45, 33.94], [13.16, 34.20], [13.45, 26.0], [13.75, 10.0], [13.95, 2.2], [15.90, 0.55], [18.32, -3.40], [20.0, -3.70], [22.31, -3.70], [23.48, -3.60], [24.35, -1.30], [25.35, -0.60], [26.40, 0.60], [28.20, 3.0], [29.20, 11.5], [30.0, 12.0]];
  const CAMY = [[0, -0.80], [3.59, -2.30], [6.74, -2.90], [8.83, -2.90], [9.20, -1.60], [9.60, -0.80], [10.05, -0.30], [10.45, -0.20], [13.16, -0.25], [13.45, -1.00], [13.75, -1.40], [13.95, -1.60], [15.90, -2.20], [18.32, -1.00], [20.0, -0.90], [22.31, -0.90], [23.48, -0.90], [24.35, -0.60], [25.35, -0.50], [26.40, -0.70], [28.20, -0.50], [29.20, -0.70], [30.0, -0.70]];
  const CAMZ = [[0, 1.00], [3.59, 1.22], [6.74, 1.75], [8.83, 1.60], [9.20, 1.15], [9.60, 0.95], [10.05, 0.95], [10.45, 1.08], [13.16, 1.14], [13.45, 1.00], [13.75, 0.95], [13.95, 1.12], [15.90, 1.40], [18.32, 1.95], [20.0, 2.05], [22.31, 2.10], [23.48, 2.10], [24.35, 1.80], [25.35, 1.70], [26.40, 1.30], [28.20, 0.95], [29.20, 0.66], [30.0, 0.63]];

  const pan = new THREE.Vector3();
  let target = new THREE.Vector3();
  function setCamera(sx, sy, zoom) {
    target.copy(camRight).multiplyScalar(sx).addScaledVector(camUp, sy);
    camera.position.copy(target).addScaledVector(DIR, 120);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // ---------------------------------------------------------------- shared groups
  const root = new THREE.Group(); scene.add(root);
  const tiles = [];

  // ================================================================= GUANGZHOU (A)
  const A0 = new THREE.Group(); root.add(A0);

  // platform frame around the tomb opening (10 x 9)
  const framePieces = [
    [-6.5, 0, 3.0, 14.0], [6.5, 0, 3.0, 14.0], [0, 5.75, 10.0, 2.5], [0, -5.75, 10.0, 2.5],
  ];
  for (const [x, z, w, d] of framePieces) {
    const m = mesh(rbox(w, 1.5, d, 0.22, 3), std(PAL.white, { rough: 0.55, env: 0.45 }));
    m.position.set(x, -1.5, z); A0.add(m);
    const top = mesh(rbox(w - 0.14, 0.12, d - 0.14, 0.16, 2), std(PAL.grass[1]));
    top.position.set(x, -0.06, z); top.receiveShadow = true; A0.add(top);
  }
  // outer soil bands
  for (const [y, hcol] of [[-0.45, PAL.soil2], [-0.95, PAL.soil3]]) {
    const b1 = mesh(rbox(16.06, 0.12, 14.06, 0.2, 2), std(hcol)); b1.position.set(0, y, 0); b1.receiveShadow = false; A0.add(b1);
  }
  // dark rim inside the opening
  const rimMat = std(PAL.ink, { rough: 0.9, env: 0.1 });
  for (const [x, z, w, d] of [[-5.05, 0, 0.16, 9.1], [5.05, 0, 0.16, 9.1], [0, 4.55, 10.1, 0.16], [0, -4.55, 10.1, 0.16]]) {
    const m = mesh(rbox(w, 1.55, d, 0.04, 1), rimMat); m.position.set(x, -1.55, z); A0.add(m);
  }
  // road on the front frame
  {
    const road = mesh(rbox(10.0, 0.08, 1.55, 0.06, 2), std(PAL.road, { rough: 0.8 }));
    road.position.set(0, 0.08, 5.35); road.receiveShadow = true; A0.add(road);
    for (let i = 0; i < 6; i++) {
      const dash = mesh(rbox(0.42, 0.02, 0.08, 0.01, 1), std(PAL.mark, { rough: 0.9 }), false);
      dash.position.set(-4.4 + i * 1.76, 0.17, 5.35); A0.add(dash);
    }
  }
  // dormitory + crane on the static west frame
  buildDorm(A0);
  const crane = buildCrane(A0);
  // signboard
  {
    const g = new THREE.Group(); g.position.set(-2.4, 0.06, 6.2); A0.add(g);
    const pole = mesh(cyl(0.04, 0.04, 0.9, 8), std(PAL.white)); pole.position.set(-0.5, 0, 0); g.add(pole);
    const board = mesh(rbox(1.1, 0.55, 0.07, 0.05, 2), std(PAL.butter)); board.position.set(-0.5, 0.52, 0); g.add(board);
    const strip = mesh(rbox(0.9, 0.07, 0.02, 0.01, 1), std(PAL.ink), false); strip.position.set(-0.5, 0.83, 0.04); g.add(strip);
    const strip2 = mesh(rbox(0.62, 0.05, 0.02, 0.01, 1), std(PAL.ink), false); strip2.position.set(-0.5, 0.70, 0.04); g.add(strip2);
  }
  // outer trees
  for (const [x, z, y, s] of [[-7.1, -4.6, 0.06, 1.0], [7.0, -5.6, 0.06, 0.85], [-7.15, 5.0, 0.06, 0.9], [6.9, 5.9, 0.06, 0.8]]) {
    A0.add(makeTree(x, y, z, s));
  }

  // ---------------------------------------------------------------- the liftable lid
  const lid = new THREE.Group(); A0.add(lid);
  const lidBase = mesh(rbox(10.0, 0.55, 9.0, 0.25, 3), std(PAL.white, { rough: 0.55, env: 0.45 }));
  lidBase.position.set(0, -0.55, 0); lid.add(lidBase);

  // tiles (9 x 8), drop-in wave
  const NX = 9, NZ = 8, TS = 1.0, TG = 0.085;
  const tGeo = rbox(TS, 0.16, TS, 0.08, 2);
  const tMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.74, metalness: 0, envMapIntensity: 0.35 });
  const tIM = new THREE.InstancedMesh(tGeo, tMat, NX * NZ);
  tIM.castShadow = true; tIM.receiveShadow = true; tIM.frustumCulled = false;
  tIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lid.add(tIM);
  const tileCols = ['#B7ECD6', '#AEE7CE', '#C0F0DB', '#A9E3C8'];
  const dummy = new THREE.Object3D();
  const R0 = A.rng(11);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = (i - (NX - 1) / 2) * (TS + TG);
    const z = (j - (NZ - 1) / 2) * (TS + TG);
    const ring = Math.max(Math.abs(i - (NX - 1) / 2), Math.abs(j - (NZ - 1) / 2));
    const ang = (Math.atan2(z, x) / (2 * Math.PI) + 1) % 1;
    const tDrop = 0.02 + ring * 0.085 + ang * 0.045 + (R0() - 0.5) * 0.035;
    const axis = (Math.abs(x) > Math.abs(z)) ? V3(0, 0, Math.sign(z) || 1) : V3(Math.sign(x) || 1, 0, 0);
    const idx = j * NX + i;
    tIM.setColorAt(idx, C(tileCols[(i + j * 2 + (i * j) % 3) % 4]));
    tiles.push({ idx, x, z, tDrop, axis });
  }
  tIM.instanceColor.needsUpdate = true;

  // hill (child of lid)
  const hill = new THREE.Group(); hill.position.set(-0.9, 0, -0.6); lid.add(hill);
  const layers = [];
  const HILL = [
    [6.6, 0.80, 5.6, 0.18, '#9DE3C4'],
    [5.4, 0.70, 4.6, 0.98, '#8CDBB6'],
    [4.2, 0.60, 3.6, 1.68, '#7FD3A6'],
    [2.9, 0.45, 2.4, 2.28, '#74CBA3'],
  ];
  for (const [w, h, d, y, col] of HILL) {
    const m = mesh(rbox(w, h, d, 0.16, 2), std(col, { rough: 0.78, env: 0.25 }));
    m.position.set(0, y, 0); hill.add(m); layers.push({ m, y0: y, h });
  }
  // ghost of the removed summit
  const ghost = new THREE.Group(); ghost.visible = false; lid.add(ghost);
  for (const [w, h, d, y, col] of HILL.slice(2)) {
    const m = new THREE.Mesh(rbox(w, h, d, 0.16, 2), new THREE.MeshStandardMaterial({
      color: C(col), roughness: 0.8, transparent: true, opacity: 0.24, depthWrite: false,
    }));
    m.position.set(-0.9, y + 0.6, -0.6); ghost.add(m);
  }
  // trees on the hill
  for (const [x, z, y, s] of [[-2.4, 0.5, 0.98, 0.95], [-0.4, -1.6, 1.68, 0.8], [1.1, -0.4, 2.28, 0.7], [-1.6, -1.8, 0.98, 1.05], [1.9, 0.9, 0.98, 0.85], [-2.8, -0.9, 0.98, 0.8]]) {
    hill.add(makeTree(x, y, z, s));
  }
  // terrace cut lines (fade in when the hill is sliced)
  const terraceMat = std(PAL.white, { rough: 0.9, opacity: 0.9 });
  const terraces = [];
  for (const [w, d, y] of [[5.6, 4.8, 1.28], [4.4, 3.8, 1.82]]) {
    const m = mesh(rbox(w, 0.06, d, 0.02, 1), terraceMat, false);
    m.position.set(-0.9, y, -0.6); m.visible = false; lid.add(m); terraces.push(m);
  }

  // ---------------------------------------------------------------- construction props on the lid
  // dirt piles
  for (const [x, z, r, col] of [[2.2, 2.1, 0.34, PAL.sand], [1.4, 4.5, 0.28, PAL.sandLight], [4.9, 3.0, 0.22, PAL.sand]]) {
    const m = mesh(new THREE.ConeGeometry(r, r * 1.15, 14), std(col, { rough: 0.95 }));
    m.position.set(x, 0.18, z); lid.add(m);
  }
  // fence posts around the dig
  for (const [x, z] of [[1.5, 1.6], [5.9, 1.6], [1.5, 5.2], [5.9, 5.2]]) {
    const p = mesh(rbox(0.07, 0.5, 0.07, 0.02, 1), std(PAL.white)); p.position.set(x, 0.18, z); lid.add(p);
  }
  for (const [x, z, w, d] of [[3.7, 1.6, 4.4, 0.025], [3.7, 5.2, 4.4, 0.025], [1.5, 3.4, 0.025, 3.6], [5.9, 3.4, 0.025, 3.6]]) {
    const tape = mesh(rbox(w, 0.03, d, 0.008, 1), std(PAL.butter, { rough: 0.8 }), false);
    tape.position.set(x, 0.6, z); lid.add(tape);
  }

  // workers
  const workers = [];
  const workerDefs = [
    [2.8, 3.55, 0.35, '#6FA8FF', '#FFE6A1', true],
    [4.95, 3.65, -2.0, '#FFB27A', '#FBFAFF', false],
    [3.35, 4.55, 2.4, '#8CDBB6', '#FFE6A1', false],
    [-4.3, 3.0, 1.2, '#6FA8FF', '#FBFAFF', false],
    [-2.3, 4.1, -0.6, '#FFC4AC', '#FFE6A1', false],
    [-4.15, 3.25, 0.9, '#FFB27A', '#FFE6A1', true],
  ];
  for (const [x, z, ry, col, hat, shovel] of workerDefs) {
    const w = makeWorker(col, hat, shovel);
    w.position.set(x, 0.18, z); w.rotation.y = ry; lid.add(w);
    workers.push({ g: w, shovel });
  }

  // black box + pedestals + finds
  const boxG = new THREE.Group(); boxG.position.set(3.7, 0.18, 3.5); lid.add(boxG);
  const boxBody = mesh(rbox(1.25, 0.72, 1.0, 0.08, 2), std(PAL.ink, { rough: 0.55, env: 0.5 }));
  boxG.add(boxBody);
  const band = mesh(rbox(1.29, 0.1, 1.04, 0.04, 1), std(PAL.gold, { rough: 0.35, metal: 0.35, emissive: PAL.gold, ei: 0.25 }), false);
  band.position.y = 0.34; boxG.add(band);
  const inner = mesh(rbox(1.08, 0.4, 0.84, 0.04, 2), std('#FFF3D2', { rough: 0.9, emissive: '#FFE6A1', ei: 1.1 }), false);
  inner.position.y = 0.1; boxG.add(inner);
  const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.8).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: C('#FFE9B0'), transparent: true, opacity: 0.9 }));
  glowPlane.position.y = 0.66; boxG.add(glow(glowPlane));
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.73, -0.5); boxG.add(lidPivot);
  const boxLid = mesh(rbox(1.28, 0.12, 1.02, 0.06, 2), std(PAL.ink, { rough: 0.5, env: 0.55 }));
  boxLid.position.set(0, 0, 0.5); lidPivot.add(boxLid);
  const lidBand = mesh(rbox(1.3, 0.03, 1.04, 0.01, 1), std(PAL.gold, { rough: 0.32, metal: 0.4, emissive: PAL.gold, ei: 0.3 }), false);
  lidBand.position.set(0, 0.065, 0.5); lidPivot.add(lidBand);
  // dirt mound hiding the box before it is unearthed
  const mound = mesh(new THREE.SphereGeometry(0.72, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(PAL.sand, { rough: 0.95 }));
  mound.position.set(3.7, 0.16, 3.5); mound.scale.set(1.15, 0.55, 1.0); lid.add(mound);

  // finds: 4 pedestals with mini objects
  const finds = {};
  finds.ivory = makePedestal(lid, 2.35, 0.18, 2.9, cues.scenes.ivory);
  finds.ivory.add(makeTusk());
  finds.persia = makePedestal(lid, 4.55, 0.18, 2.95, cues.scenes.persia);
  finds.persia.add(makePersianBox());
  finds.mineral = makePedestal(lid, 2.35, 0.18, 4.2, cues.scenes.mineral);
  finds.mineral.add(makeMinerals());
  finds.jade = makePedestal(lid, 4.55, 0.18, 4.2, cues.scenes.jade);
  finds.jade.add(makeJadeSuit());

  // dust puffs at the three hits
  const puffs = [];
  for (const [t0, x, z] of [[2.25, 3.0, 3.2], [3.34, 3.7, 3.5], [18.62, -3.9, 3.2], [19.22, -3.8, 3.3], [19.94, -3.5, 3.4]]) {
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({
        color: C('#F4EFE6'), roughness: 1, transparent: true, opacity: 0.0, depthWrite: false,
      }));
      m.position.set(x + (k - 1.5) * 0.16, 0.3, z + ((k % 2) - 0.5) * 0.14);
      lid.add(m); puffs.push({ m, t0, dx: (k - 1.5) * 0.35, dz: (k % 2 ? 0.3 : -0.25), s: 0.8 + k * 0.12 });
    }
  }

  // foundation trench + slabs + dark pit on the lid (act 4)
  const trench = mesh(rbox(3.0, 0.12, 1.9, 0.06, 1), std('#5B528F', { rough: 0.95 }));
  trench.position.set(-3.4, 0.20, 3.4); trench.visible = false; lid.add(trench);
  const trenchIn = mesh(rbox(2.2, 0.03, 1.2, 0.05, 1), std('#3F386E', { rough: 0.98 }), false);
  trenchIn.position.set(-3.4, 0.30, 3.4); trenchIn.visible = false; lid.add(trenchIn);
  const slabs = [];
  for (let i = 0; i < 5; i++) {
    const s = mesh(rbox(0.58, 0.12, 1.25, 0.03, 1), std('#E9E4F3', { rough: 0.8 }));
    s.position.set(-4.45 + i * 0.62, 0.24, 3.4); s.visible = false; lid.add(s); slabs.push(s);
  }
  const darkPit = mesh(rbox(1.4, 0.1, 1.0, 0.03, 1), std('#1A1738', { rough: 0.95 }));
  darkPit.position.set(-3.4, 0.30, 3.4); darkPit.visible = false; lid.add(darkPit);
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: C('#FFF2C0'), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  flash.position.set(-3.4, 1.0, 3.4); flash.rotation.z = 0.55; lid.add(glow(flash));

  // truck on the road (static platform)
  const truck = buildTruck(); truck.position.set(-6.2, 0.17, 5.35); A0.add(truck);

  // 43 ticks around the opening (static frame)
  const ticks = [];
  {
    const n = 43;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const m = mesh(rbox(0.12, 0.04, 0.3, 0.012, 1), new THREE.MeshStandardMaterial({
        color: C(PAL.lilac), roughness: 0.8, emissive: C(PAL.coral), emissiveIntensity: 0,
      }), false);
      m.position.set(-3.4 + Math.cos(a) * 1.35, 0.24, 3.4 + Math.sin(a) * 1.35);
      m.rotation.y = a + Math.PI / 2;
      lid.add(m); ticks.push(m);
    }
  }

  // ================================================================= TOMB (under the lid)
  const tombGround = mesh(rbox(10.0, 0.08, 9.0, 0.06, 1), std('#EFDCC6', { rough: 0.9, env: 0.2 }));
  tombGround.position.set(0, -0.06, 0); A0.add(tombGround);
  const tomb = new THREE.Group(); A0.add(tomb);
  const tombFloor = mesh(rbox(10.4, 0.25, 9.4, 0.12, 2), std(PAL.sandDark, { rough: 0.92, env: 0.15 }));
  tombFloor.position.set(0, -2.12, 0); tomb.add(tombFloor);
  const tombBase = mesh(rbox(10.9, 0.3, 9.9, 0.2, 2), std(PAL.ink, { rough: 0.9, env: 0.1 }));
  tombBase.position.set(0, -2.47, 0); tomb.add(tombBase);
  const roomMat = std('#EFDCC6', { rough: 0.85, emissive: '#FFD9A8', ei: 0.10 });
  const rooms = [[0, 2.85], [-3.0, 2.85], [3.0, 2.85], [0, 0], [-3.05, 0], [3.05, 0], [0, -2.85]];
  for (const [x, z] of rooms) {
    const f = mesh(rbox(2.35, 0.09, 1.7, 0.06, 1), roomMat);
    f.position.set(x, -1.9, z); tomb.add(f);
  }
  const walls = [];
  const wallMat = std(PAL.sand, { rough: 0.9, env: 0.15 });
  function wall(x, z, w, d, t0, h = 0.48) {
    const m = mesh(rbox(w, h, d, 0.05, 1), wallMat);
    m.position.set(x, -1.9, z); m.scale.y = 0.0001; tomb.add(m);
    const cap = mesh(rbox(w + 0.035, 0.05, d + 0.035, 0.02, 1), std(PAL.sandLight, { rough: 0.85 }), false);
    cap.position.y = h - 0.025; m.add(cap);
    walls.push({ m, t0, h });
    return m;
  }
  // outer perimeter
  wall(-5.1, 0, 0.28, 9.3, 25.42, 0.72); wall(5.1, 0, 0.28, 9.3, 25.46, 0.72);
  wall(0, 4.62, 10.1, 0.28, 25.50, 0.72); wall(0, -4.62, 10.1, 0.28, 25.54, 0.72);
  // partitions: 3 columns x 3 rows (rear-left / rear-right open), doors left in the row walls
  for (const x of [-1.6, 1.6]) wall(x, 1.5, 0.18, 6.0, 25.58);
  for (const x of [-1.6, 1.6]) wall(x, -3.0, 0.18, 3.0, 25.64);
  for (const z of [1.5, -1.5]) {
    wall(-2.75, z, 4.2, 0.18, 25.70);
    wall(2.75, z, 4.2, 0.18, 25.76);
  }
  // warm light strips
  for (const [x, z] of [[0, 2.85], [-3, 0], [3, 0], [0, -2.85]]) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.06).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: C('#FFE2B0'), transparent: true, opacity: 0.6 }));
    strip.position.set(x, -1.845, z); tomb.add(glow(strip));
  }
  const tombLight1 = new THREE.PointLight(C('#FFD9A2'), 0, 7, 2);
  tombLight1.position.set(-2.2, -0.6, 1.0); tomb.add(tombLight1);
  const tombLight2 = new THREE.PointLight(C('#FFD9A2'), 0, 7, 2);
  tombLight2.position.set(2.4, -0.6, -1.2); tomb.add(tombLight2);

  // coffin + bronze vessels
  const relics = [];
  {
    const coffin = new THREE.Group(); coffin.position.set(0, -1.86, 0); tomb.add(coffin);
    const cb = mesh(rbox(2.1, 0.5, 1.0, 0.08, 2), std('#7E3A3F', { rough: 0.5, env: 0.5 })); coffin.add(cb);
    for (const z of [-0.34, 0, 0.34]) {
      const band = mesh(rbox(2.14, 0.055, 0.065, 0.01, 1), std(PAL.gold, { rough: 0.3, metal: 0.5, emissive: PAL.gold, ei: 0.3 }), false);
      band.position.set(0, 0.25, z); coffin.add(band);
    }
    const ctop = mesh(rbox(2.05, 0.06, 0.95, 0.04, 1), std(PAL.gold, { rough: 0.35, metal: 0.45, emissive: PAL.gold, ei: 0.22 }), false);
    ctop.position.y = 0.5; coffin.add(ctop);
    const seal = mesh(rbox(0.18, 0.02, 0.18, 0.01, 1), std(PAL.gold, { rough: 0.28, metal: 0.55, emissive: PAL.gold, ei: 0.5 }), false);
    seal.position.set(0, 0.57, 0.1); coffin.add(seal);
    coffin.scale.setScalar(0.0001); relics.push({ m: coffin, t0: 25.88 });
    for (const [x, z, t0] of [[-3, 0, 25.95], [3, 0, 26.02], [-3, 2.85, 26.10], [3, 2.85, 26.18], [0, -2.85, 26.26]]) {
      const v = mesh(cyl(0.2, 0.25, 0.4, 16), std('#C07F68', { rough: 0.45, metal: 0.35 }));
      v.position.set(x, -1.9, z); v.scale.setScalar(0.0001); tomb.add(v);
      const rim = mesh(cyl(0.22, 0.22, 0.04, 16), std(PAL.gold, { rough: 0.35, metal: 0.5 }), false);
      rim.position.y = 0.4; v.add(rim);
      relics.push({ m: v, t0 });
    }
  }
  const relicCols = [PAL.gold, PAL.jade, PAL.coral, PAL.silver, PAL.butter];
  const R1 = A.rng(23);
  for (let k = 0; k < 34; k++) {
    const room = rooms[k % rooms.length];
    const x = room[0] + (R1() - 0.5) * 1.5, z = room[1] + (R1() - 0.5) * 1.0;
    const kind = k % 4;
    let m;
    if (kind === 0) m = mesh(rbox(0.16, 0.16, 0.16, 0.03, 1), std(relicCols[k % relicCols.length], { rough: 0.35, metal: 0.55, emissive: relicCols[k % relicCols.length], ei: 0.25 }));
    else if (kind === 1) m = mesh(cyl(0.09, 0.12, 0.2, 10), std(PAL.silver, { rough: 0.3, metal: 0.6 }));
    else if (kind === 2) m = mesh(rbox(0.1, 0.3, 0.1, 0.02, 1), std(PAL.jade, { rough: 0.4, emissive: PAL.jade, ei: 0.2 }));
    else m = mesh(new THREE.SphereGeometry(0.09, 10, 8), std(relicCols[k % relicCols.length], { rough: 0.4, metal: 0.3 }));
    m.position.set(x, -1.82, z); m.scale.setScalar(0.0001); tomb.add(m);
    relics.push({ m, t0: 25.80 + (k % 17) * 0.035 + R1() * 0.05 });
  }
  const retainers = [];
  const retDefs = [[-3.2, 3.1], [-2.77, 3.05], [3.05, 3.0], [3.3, 3.2], [-3.3, -2.9], [-2.85, -3.1], [3.15, -3.0], [3.35, -2.75], [-1.9, 0.6], [1.9, 0.6], [-1.9, -0.6], [1.9, -0.6], [0, 1.1], [0, -1.15], [0, -3.2]];
  for (let k = 0; k < retDefs.length; k++) {
    const [x, z] = retDefs[k];
    const g = new THREE.Group();
    const body = mesh(rbox(0.16, 0.3, 0.12, 0.04, 1), std(k % 3 === 0 ? PAL.jade : '#D9D1FA', { rough: 0.7 }));
    g.add(body);
    const head = mesh(new THREE.SphereGeometry(0.07, 10, 8), std('#F4EFE6', { rough: 0.8 }));
    head.position.y = 0.36; g.add(head);
    const hat = mesh(cyl(0.08, 0.08, 0.04, 10), std(PAL.ink, { rough: 0.8 }), false);
    hat.position.y = 0.41; g.add(hat);
    g.position.set(x, -1.84, z); g.scale.setScalar(0.0001); tomb.add(g);
    retainers.push({ g, t0: cues.scenes.retainers[0] + k * 0.095 });
  }

  // ================================================================= SOUTH ROUTE
  const routeStart = V3(8.2, 0, -8.2), routeEnd = V3(15.8, 0, -15.8);
  const routeDir = routeEnd.clone().sub(routeStart);
  const routeLen = routeDir.length();
  const routeN = 30;
  const dots = [];
  for (let i = 0; i < routeN; i++) {
    const p = routeStart.clone().addScaledVector(routeDir, (i + 0.5) / routeN);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.035, 12),
      new THREE.MeshStandardMaterial({ color: C(PAL.mark), roughness: 0.6, emissive: C(PAL.coral), emissiveIntensity: 0 }));
    m.position.set(p.x, 0.05, p.z); m.receiveShadow = true; root.add(m);
    dots.push({ m, p: i / (routeN - 1) });
  }
  // stepping-stone sea tiles
  const seaTiles = [];
  for (const [q, island] of [[0.18, false], [0.45, true], [0.70, false], [0.9, true]]) {
    const p = routeStart.clone().addScaledVector(routeDir, q);
    const g = new THREE.Group(); g.position.copy(p); root.add(g);
    const base = mesh(rbox(2.1, 0.5, 2.1, 0.3, 3), std(PAL.white, { rough: 0.6 }));
    base.position.y = -0.5; g.add(base);
    const water = mesh(rbox(1.94, 0.08, 1.94, 0.2, 2), std(PAL.water, { rough: 0.25, env: 0.6 }));
    water.position.y = 0.02; g.add(water);
    if (island) {
      const isl = mesh(rbox(1.2, 0.25, 1.1, 0.2, 2), std(PAL.mint, { rough: 0.75 }));
      isl.position.y = 0.08; g.add(isl);
      g.add(makeTree(0.15, 0.3, -0.1, 0.8));
    }
    seaTiles.push(g);
  }
  // boat
  const boat = makeBoat(); root.add(boat);
  // ice field B
  const ice = buildIce(); ice.g.position.set(24, 0, -24); root.add(ice.g);

  // ================================================================= foreground clouds / background cubes
  const fg = new THREE.Group(); scene.add(fg);
  const cloudGeo = (() => {
    const parts = [[0, 0, 0, 0.55], [0.55, -0.08, 0.1, 0.42], [-0.55, -0.1, -0.05, 0.4], [0.2, 0.25, -0.1, 0.42], [-0.25, 0.18, 0.15, 0.38], [0.9, -0.2, 0, 0.28], [-0.9, -0.22, 0.05, 0.26]];
    const gs = parts.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 4).translate(x, y, z));
    const g = mergeGeometries(gs);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -0.2) pos.setY(i, -0.2 + (pos.getY(i) + 0.2) * 0.35);
    g.computeVertexNormals();
    return g;
  })();
  const cloudMat = new THREE.MeshStandardMaterial({ color: C('#FFFFFF'), roughness: 0.96, envMapIntensity: 0.4, emissive: C('#F1EEFF'), emissiveIntensity: 0.22 });
  const clouds = [];
  for (const [sx, sy, s, v] of [[-11.5, 6.2, 1.55, 0.10], [10.5, 7.1, 1.15, 0.08], [-13.5, -5.7, 0.95, 0.12], [14.5, -5.0, 0.8, 0.09]]) {
    const m = new THREE.Mesh(cloudGeo, cloudMat); m.castShadow = false; m.receiveShadow = false;
    m.scale.setScalar(s); fg.add(m); clouds.push({ m, sx, sy, s, v });
  }
  const bgGroup = new THREE.Group(); scene.add(bgGroup);
  const bgCubes = [];
  const BR = A.rng(31);
  const bgCols = [PAL.lilac, PAL.white, PAL.sky, PAL.peach, PAL.mint];
  const bgSpots = [[-9, 4, -1.5, 0.7], [9, 3.2, -2.0, 0.6], [-7, -3.5, 1.2, 0.8], [8.5, -4.2, 0.4, 0.5], [-16, 1, 0.2, 0.9], [16, 1.5, -1.0, 0.7], [-2, -6, 1.8, 0.55], [4, 6, -2.4, 0.65]];
  for (let k = 0; k < bgSpots.length; k++) {
    const [sx, sy, y, s] = bgSpots[k];
    const m = mesh(rbox(s, s, s, s * 0.18, 2).translate(0, -s / 2, 0), std(bgCols[k % bgCols.length], { rough: 0.7 }), false);
    m.receiveShadow = false;
    m.userData = { sx, sy, y, s, ph: BR() * 6 };
    bgGroup.add(m); bgCubes.push(m);
  }

  // ================================================================= title plaque (end)
  const plaque = await buildPlaque();
  root.add(plaque.g);
  plaque.g.visible = false;

  // ---------------------------------------------------------------- update
  const tmpQ = new THREE.Quaternion();
  function update(t, sub = { u: 0, v: 0 }) {
    U.uTime.value = t;
    const zoom = A.track(CAMZ, t);
    const sx = A.track(CAMX, t), sy = A.track(CAMY, t);
    setCamera(sx, sy, zoom);

    // camera-following sun for crisp local shadows
    sun.target.position.set(target.x, 0, target.z);
    sun.position.copy(target).addScaledVector(sunDir0, 40);
    sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
    const j = V3(sub.u, 0, sub.v).multiplyScalar(0.045);
    sun.position.addScaledVector(camRight, j.x).addScaledVector(V3(0.62, 0.3, 0.42).normalize(), j.z);

    // tiles drop
    for (const q of tiles) {
      const d = A.drop(t - q.tDrop, 0.30, 1.2 + Math.max(0, Math.abs(q.x), Math.abs(q.z)) * 0.08, 1.25, 0.055);
      dummy.position.set(q.x, 0.02 + d.y, q.z);
      tmpQ.setFromAxisAngle(q.axis, d.rot); dummy.quaternion.copy(tmpQ);
      dummy.scale.set(d.sxz, d.sy, d.sxz);
      dummy.updateMatrix();
      tIM.setMatrixAt(q.idx, dummy.matrix);
    }
    tIM.instanceMatrix.needsUpdate = true;

    // hill cut (June 1983: 50 m -> 30 m)
    const cut = A.smooth(A.inv(13.97, 15.8, t));
    for (let i = 2; i < layers.length; i++) {
      const L = layers[i];
      const k = i === 2 ? 1 : 0.7;
      L.m.scale.y = 1 - 0.60 * cut * k;
      L.m.position.y = L.y0 - 0.55 * cut * k;
    }
    ghost.visible = cut > 0.001 && cut < 0.999;
    ghost.position.y = 0.9 * cut;
    ghost.children.forEach((m) => { m.material.opacity = 0.26 * Math.sin(Math.PI * Math.min(1, cut)) * (1 - cut * 0.4); });
    for (const [i, m] of terraces.entries()) { m.visible = cut > 0.04; m.position.y = (i ? 1.22 : 1.02) + 0.02; m.scale.set(1, 1, 1); }

    // lid lift + slide off (25.35)
    const lift = A.easeOutCubic(A.inv(25.35, 26.5, t));
    const bob = A.smooth(A.inv(26.4, 27.0, t)) * Math.sin((t - 26.4) * 1.7) * 0.05;
    lid.position.set(-2.2 * lift, 3.05 * lift + bob, 2.2 * lift);

    // box unearthed + lid opens
    const out = A.spring(t - cues.scenes.box_out, 18, 0.5, 3.2);
    boxG.visible = t >= cues.scenes.box_out - 0.4;
    boxG.position.y = 0.18 - 0.9 * (1 - Math.min(1, Math.max(0, A.inv(cues.scenes.box_out - 0.25, cues.scenes.box_out + 0.35, t))));
    boxG.scale.setScalar(0.0001 + 0.9999 * Math.max(0, Math.min(1.08, out)));
    mound.visible = t < cues.scenes.box_out + 0.15;
    mound.scale.y = 0.55 * (1 - A.smooth(A.inv(cues.scenes.box_out - 0.2, cues.scenes.box_out + 0.25, t)));
    lidPivot.rotation.x = -1.55 * A.easeOutCubic(A.inv(cues.scenes.box_open + 0.04, cues.scenes.box_open + 0.42, t));
    // finds pop
    for (const k of ['ivory', 'persia', 'mineral', 'jade']) {
      const f = finds[k];
      const p = A.pop(t - f.userData.t0, 0.38, 2.1);
      f.scale.setScalar(Math.max(0.0001, p * 1.35));
      f.visible = t >= f.userData.t0 - 0.02;
    }
    // worker shovel swing
    for (let wi = 0; wi < workers.length; wi++) {
      const w = workers[wi];
      if (w.shovel && w.g.shovelGroup) {
        if (wi === workers.length - 1) {
          const dig = A.smooth(A.inv(18.36, 18.55, t)) * (1 - A.smooth(A.inv(19.85, 20.0, t)));
          w.g.shovelGroup.rotation.z = -0.75 + Math.sin(t * 7.2) * 0.4 * dig;
        } else {
          const a = A.smooth(A.inv(2.06, 2.25, t));
          const b = A.smooth(A.inv(2.25, 2.5, t));
          w.g.shovelGroup.rotation.z = 0.55 - 1.2 * a + 0.9 * b;
        }
      }
    }
    // dust puffs
    for (const p of puffs) {
      const tau = t - p.t0;
      const on = tau > -0.02 && tau < 0.75;
      p.m.visible = on;
      if (on) {
        const u = A.clamp(tau / 0.75);
        p.m.position.set(p.m.position.x, 0.25 + u * 0.55, p.m.position.z);
        p.m.scale.setScalar(0.5 + u * 1.4 * p.s);
        p.m.material.opacity = 0.5 * (1 - u) * (u < 0.15 ? u / 0.15 : 1);
      }
    }
    // crane jib
    crane.jib.rotation.y = 0.35 + Math.sin(t * 0.5) * 0.12;
    // truck
    const truckX = A.track([[0, -6.4], [1.2, -6.2], [7.0, 3.1], [13.5, 3.1], [16.0, -6.6], [30, -6.6]], t);
    truck.position.x = truckX;
    truck.rotation.y = (t > 13.5 && t < 16.0) ? Math.PI : 0;
    // trench / slabs / dark pit / flashlight
    trench.visible = t > 18.32; trenchIn.visible = t > 18.32;
    const slabOn = A.easeOutBack(A.inv(19.94, 20.4, t));
    for (let i = 0; i < slabs.length; i++) {
      const q = A.easeOutBack(A.inv(19.94 + i * 0.035, 20.35 + i * 0.035, t));
      slabs[i].visible = t > 19.9; slabs[i].scale.set(1, Math.max(0.0001, q), 1);
    }
    darkPit.visible = t > 23.48; darkPit.scale.set(1, A.easeOutCubic(A.inv(23.48, 23.9, t)), 1);
    const fl = A.smooth(A.inv(22.31, 22.55, t)) * (1 - A.smooth(A.inv(23.3, 23.6, t)));
    flash.material.opacity = 0.32 * fl;
    // 43 ticks
    for (let i = 0; i < ticks.length; i++) {
      const on = A.smooth(A.inv(24.35 + i * (1.0 / 43), 24.35 + (i + 1) * (1.0 / 43) + 0.04, t));
      ticks[i].material.emissiveIntensity = on * 2.6;
      ticks[i].scale.y = 0.0001 + on;
    }
    // tomb reveal: the cutaway model lifts above the platform rim
    const rise = A.smooth(A.inv(25.36, 25.95, t));
    tomb.position.y = 1.95 * rise;
    const rev = A.smooth(A.inv(25.4, 25.7, t));
    tombLight1.intensity = 6 * rev; tombLight2.intensity = 5 * rev;
    for (const w of walls) {
      const u = A.easeOutCubic(A.inv(w.t0, w.t0 + 0.34, t));
      w.m.scale.y = Math.max(0.0001, u);
    }
    for (const r of relics) {
      const p = A.spring(t - r.t0, 20, 0.45, 8);
      r.m.scale.setScalar(Math.max(0.0001, p));
      r.m.visible = t >= r.t0 - 0.02;
    }
    for (const r of retainers) {
      const p = A.spring(t - r.t0, 22, 0.45, 9);
      r.g.scale.setScalar(Math.max(0.0001, p));
      r.g.visible = t >= r.t0 - 0.02;
    }

    // route pulse + boat
    const pulse = A.inv(8.85, 10.25, t);
    for (const d of dots) {
      const on = t > 8.8 ? Math.exp(-Math.pow((d.p - pulse) / 0.10, 2)) : 0;
      d.m.material.emissiveIntensity = on * 2.2;
      d.m.scale.setScalar(1 + on * 0.5);
    }
    const bp = 0.12 + 0.72 * A.smooth(A.inv(8.75, 13.0, t));
    const bpos = routeStart.clone().addScaledVector(routeDir, bp);
    boat.position.set(bpos.x, 0.34 + Math.sin(t * 2.2) * 0.05, bpos.z);
    boat.rotation.y = -Math.PI / 4 + Math.sin(t * 1.7) * 0.06;

    // ice reveal
    const rv = A.smooth(A.inv(9.84, 10.7, t));
    ice.iceMat.opacity = 0.72 - 0.57 * rv;
    ice.riverU.uProg.value = A.smooth(A.inv(9.84, 11.0, t));
    ice.riverU.uFlow.value = t;
    ice.scan.visible = t > 9.84 && t < 11.2;
    ice.scan.scale.setScalar(0.3 + 3.0 * A.easeOutCubic(A.inv(9.84, 10.9, t)));
    ice.scan.material.opacity = 0.9 * (1 - A.inv(10.0, 11.2, t));
    ice.radar.rotation.y = t * 0.9;
    ice.drone.position.y = 2.15 + Math.sin(t * 1.9) * 0.12;
    ice.drone.rotation.y = t * 0.7;
    for (const q of ice.snow) { q.m.position.y = q.y0 + Math.sin(t * 0.8 + q.ph) * 0.12; }

    // title plaque
    plaque.g.visible = t > cues.scenes.title - 0.05;
    const pp = A.spring(t - cues.scenes.title, 16, 0.52, 7);
    plaque.g.scale.setScalar(Math.max(0.0001, pp));
    plaque.g.position.y = plaque.y0 + Math.sin(Math.max(0, t - 29.5) * 1.8) * 0.03;

    // parallax groups
    pan.copy(target);
    fg.position.copy(pan).multiplyScalar(-0.25);
    bgGroup.position.copy(pan).multiplyScalar(0.25);
    for (const c of clouds) {
      const px = c.sx + t * c.v, py = c.sy + Math.sin(t * 0.55 + c.sx) * 0.05;
      c.m.position.copy(camRight).multiplyScalar(px).addScaledVector(camUp, py).addScaledVector(DIR, 18);
    }
    for (const m of bgCubes) {
      const { sx, sy, y, s, ph } = m.userData;
      const p = new THREE.Vector3().addScaledVector(camRight, sx).addScaledVector(camUp, sy).addScaledVector(DIR, 30);
      p.y += y;
      m.position.copy(p);
      m.rotation.y = ph + t * 0.12;
      m.scale.setScalar(1 + Math.sin(t * 0.9 + ph) * 0.03);
    }

    // bg shader
    const invVP = new THREE.Matrix4().multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    bgU.uInvVP.value.copy(invVP);
    bgU.uZoom.value = zoom;
    bgU.uOff.value.set(pan.x * 0.25, pan.z * 0.25);
  }

  return {
    scene, camera, update, U, bgU, PAL, root,
    anchors: {
      hill: V3(-0.9, 2.95, -0.6),
      ivory: V3(2.35, 1.40, 2.9),
      persia: V3(4.55, 1.40, 2.95),
      mineral: V3(2.35, 1.40, 4.2),
      jade: V3(4.55, 1.50, 4.2),
      ice: V3(24, 1.6, -24),
      chambers: V3(0, 1.0, 0),
      relics: V3(1.8, 1.35, -0.9),
      retainers: V3(3.2, 1.25, 1.7),
      tomb: V3(0, -0.8, 0),
    },
  };

  // ================================================================= builders
  function makeTree(x, y, z, s) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const trunk = mesh(cyl(0.045, 0.06, 0.34, 8), std('#C9A48F', { rough: 0.9 }));
    trunk.scale.setScalar(s); g.add(trunk);
    const crown = mesh(new THREE.IcosahedronGeometry(0.3, 1), std('#7FD3A6', { rough: 0.8, env: 0.2 }));
    crown.position.y = 0.46 * s; crown.scale.setScalar(s); g.add(crown);
    const crown2 = mesh(new THREE.IcosahedronGeometry(0.22, 1), std('#93DDB5', { rough: 0.8, env: 0.2 }));
    crown2.position.set(0.14 * s, 0.56 * s, 0.08 * s); crown2.scale.setScalar(s); g.add(crown2);
    return g;
  }

  function makeWorker(col, hat, shovel) {
    const g = new THREE.Group();
    const body = mesh(cyl(0.15, 0.19, 0.48, 12), std(col, { rough: 0.75 }));
    body.position.y = 0.02; g.add(body);
    const head = mesh(new THREE.SphereGeometry(0.12, 12, 10), std('#F2D3B8', { rough: 0.8 }));
    head.position.y = 0.6; g.add(head);
    const cap = mesh(cyl(0.135, 0.135, 0.07, 12), std(hat, { rough: 0.7 }), false);
    cap.position.y = 0.67; g.add(cap);
    const brim = mesh(rbox(0.24, 0.025, 0.14, 0.01, 1), std(hat, { rough: 0.7 }), false);
    brim.position.set(0.04, 0.65, 0.1); g.add(brim);
    for (const sx of [-1, 1]) {
      const leg = mesh(cyl(0.045, 0.05, 0.2, 8), std(PAL.ink, { rough: 0.9 }), false);
      leg.position.set(sx * 0.07, 0.0, 0); g.add(leg);
    }
    if (shovel) {
      const sg = new THREE.Group(); sg.position.set(0.18, 0.42, 0.08); sg.rotation.z = 0.55; g.add(sg);
      const handle = mesh(cyl(0.018, 0.018, 0.62, 6), std('#C9A48F', { rough: 0.8 }), false);
      handle.position.y = 0.1; sg.add(handle);
      const blade = mesh(rbox(0.12, 0.16, 0.025, 0.01, 1), std('#C9D2E4', { rough: 0.35, metal: 0.5 }), false);
      blade.position.y = -0.22; sg.add(blade);
      g.userData.shovel = sg;
      // return group but expose shovel via a property for the updater
      g.shovelGroup = sg;
    }
    return g;
  }

  function makeTusk() {
    const g = new THREE.Group(); g.position.y = 0.2;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push(V3(-0.42 + u * 0.84, 0.05 + Math.sin(u * Math.PI * 0.9) * 0.16, 0.06 * Math.sin(u * Math.PI)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let i = 0; i < 7; i++) {
      const p0 = curve.getPoint(i / 7), p1 = curve.getPoint((i + 1) / 7);
      const r0 = 0.075 * (1 - i / 9), r1 = 0.075 * (1 - (i + 1) / 9);
      const len = p0.distanceTo(p1);
      const seg = mesh(cyl(r1, r0, len, 10), std('#F7EEDC', { rough: 0.55, env: 0.4 }));
      seg.position.copy(p0);
      seg.quaternion.setFromUnitVectors(V3(0, 1, 0), p1.clone().sub(p0).normalize());
      g.add(seg);
    }
    return g;
  }

  function makePersianBox() {
    const g = new THREE.Group(); g.position.y = 0.2; g.scale.setScalar(1.0);
    const prof = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const r = 0.30 + 0.10 * Math.sin(u * Math.PI) * (1 - 0.25 * u);
      prof.push(new THREE.Vector2(Math.max(0.06, r), 0.38 * u));
    }
    prof.unshift(new THREE.Vector2(0.26, 0));
    const geo = new THREE.LatheGeometry(prof, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const k = 1 + 0.085 * Math.cos(6 * ang);
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
    geo.computeVertexNormals();
    const m = mesh(geo, std(PAL.silver, { rough: 0.28, metal: 0.65, env: 0.9 }));
    g.add(m);
    const foot = mesh(cyl(0.28, 0.3, 0.05, 32), std('#C9BDF6', { rough: 0.6 }), false);
    g.add(foot);
    const lid = mesh(cyl(0.3, 0.3, 0.04, 32), std(PAL.silver, { rough: 0.25, metal: 0.7, env: 0.9 }), false);
    lid.position.y = 0.4; g.add(lid);
    return g;
  }

  function makeMinerals() {
    const g = new THREE.Group(); g.position.y = 0.2;
    const tray = mesh(cyl(0.34, 0.34, 0.06, 24), std('#F4EFE6', { rough: 0.7 }));
    g.add(tray);
    const cols = ['#C9BDF6', '#8CDBB6', '#FFB27A', '#FFE6A1', '#FF9E86'];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const m = mesh(new THREE.IcosahedronGeometry(0.11, 0), std(cols[i], { rough: 0.35, emissive: cols[i], ei: 0.18 }), false);
      m.position.set(Math.cos(a) * 0.17, 0.1, Math.sin(a) * 0.17);
      m.scale.set(1, 1.3, 1); g.add(m);
    }
    return g;
  }

  function makeJadeSuit() {
    const g = new THREE.Group(); g.position.y = 0.2;
    const jm = std(PAL.jade, { rough: 0.4, env: 0.55, emissive: PAL.jade, ei: 0.12 });
    const body = mesh(rbox(0.34, 0.48, 0.18, 0.05, 2), jm); body.position.y = 0.22; g.add(body);
    const head = mesh(new THREE.SphereGeometry(0.14, 14, 12), jm); head.position.y = 0.72; g.add(head);
    const mask = mesh(rbox(0.2, 0.16, 0.04, 0.02, 1), std(PAL.gold, { rough: 0.35, metal: 0.5, emissive: PAL.gold, ei: 0.3 }), false);
    mask.position.set(0, 0.72, 0.12); g.add(mask);
    for (const sx of [-1, 1]) {
      const arm = mesh(rbox(0.1, 0.4, 0.12, 0.03, 1), jm); arm.position.set(sx * 0.24, 0.28, 0); arm.rotation.z = sx * 0.18; g.add(arm);
      const leg = mesh(rbox(0.11, 0.36, 0.13, 0.03, 1), jm); leg.position.set(sx * 0.1, 0.0, 0); g.add(leg);
    }
    // gold threads
    for (let i = 0; i < 5; i++) {
      const th = mesh(rbox(0.35, 0.012, 0.012, 0.005, 1), std(PAL.gold, { rough: 0.3, metal: 0.6, emissive: PAL.gold, ei: 0.25 }), false);
      th.position.set(0, 0.34 - i * 0.07, 0.095); g.add(th);
    }
    return g;
  }

  function makePedestal(parent, x, y, z, t0) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    const p = mesh(cyl(0.42, 0.46, 0.2, 24), std('#F4EFE6', { rough: 0.6, env: 0.4 }));
    g.add(p);
    const ring = mesh(cyl(0.44, 0.44, 0.02, 24), std(PAL.coral, { rough: 0.5 }), false);
    ring.position.y = 0.19; g.add(ring);
    g.userData.t0 = t0; g.scale.setScalar(0.0001); g.visible = false;
    return g;
  }

  function buildDorm(parent) {
    const g = new THREE.Group(); g.position.set(-6.3, 0.06, 2.55); parent.add(g);
    const b = mesh(rbox(2.2, 1.35, 1.5, 0.08, 2), std(PAL.white, { rough: 0.6, env: 0.4 }));
    g.add(b);
    const roof = mesh(rbox(2.34, 0.16, 1.64, 0.06, 2), std(PAL.lilac, { rough: 0.7 }));
    roof.position.y = 1.35; g.add(roof);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const win = mesh(rbox(0.3, 0.22, 0.03, 0.02, 1), std('#98ACEE', { rough: 0.4, emissive: PAL.butter, ei: 0.15 }), false);
      win.position.set(-0.62 + i * 0.62, 0.35 + j * 0.5, 0.77); g.add(win);
    }
    return g;
  }

  function buildCrane(parent) {
    const g = new THREE.Group(); g.position.set(-5.55, 0.06, 0.9); parent.add(g);
    const mast = mesh(rbox(0.16, 3.1, 0.16, 0.03, 1), std(PAL.butter, { rough: 0.6 }));
    g.add(mast);
    const jibPivot = new THREE.Group(); jibPivot.position.y = 3.05; g.add(jibPivot);
    const jib = mesh(rbox(3.0, 0.12, 0.12, 0.03, 1), std(PAL.butter, { rough: 0.6 }));
    jib.position.x = 1.1; jibPivot.add(jib);
    const counter = mesh(rbox(0.6, 0.2, 0.2, 0.03, 1), std(PAL.coral, { rough: 0.6 }));
    counter.position.x = -0.45; jibPivot.add(counter);
    const cable = mesh(rbox(0.015, 1.1, 0.015, 0.004, 1), std(PAL.ink, { rough: 0.8 }), false);
    cable.position.set(2.0, -0.55, 0); jibPivot.add(cable);
    const hook = mesh(rbox(0.1, 0.1, 0.1, 0.02, 1), std(PAL.ink, { rough: 0.7 }), false);
    hook.position.set(2.0, -1.1, 0); jibPivot.add(hook);
    return { g, jib: jibPivot };
  }

  function buildTruck() {
    const g = new THREE.Group();
    const bed = mesh(rbox(0.75, 0.28, 0.4, 0.05, 2), std(PAL.coral, { rough: 0.6 }));
    bed.position.y = 0.18; g.add(bed);
    const cab = mesh(rbox(0.28, 0.24, 0.38, 0.04, 2), std(PAL.white, { rough: 0.55 }));
    cab.position.set(-0.48, 0.18, 0); g.add(cab);
    for (const [x, z] of [[-0.36, 0.2], [-0.36, -0.2], [0.28, 0.2], [0.28, -0.2]]) {
      const w = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 12), std(PAL.ink, { rough: 0.8 }), false);
      w.rotation.x = Math.PI / 2; w.position.set(x, 0.075, z); g.add(w);
    }
    return g;
  }

  function makeBoat() {
    const g = new THREE.Group();
    const hull = mesh(rbox(0.62, 0.16, 0.26, 0.06, 2), std(PAL.white, { rough: 0.55 }));
    hull.position.y = 0.02; g.add(hull);
    const stripe = mesh(rbox(0.64, 0.035, 0.27, 0.01, 1), std(PAL.coral, { rough: 0.6 }), false);
    stripe.position.y = 0.1; g.add(stripe);
    const mast = mesh(cyl(0.012, 0.012, 0.55, 6), std(PAL.ink, { rough: 0.8 }), false);
    mast.position.set(0.03, 0.16, 0); g.add(mast);
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.03, 0.18, 0, 0.32, 0.66, 0, 0.03, 0.68, 0], 3));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: C(PAL.butter), roughness: 0.85, side: THREE.DoubleSide }));
    sail.castShadow = true; g.add(sail);
    return g;
  }

  function buildIce() {
    const g = new THREE.Group();
    // platform
    const base = mesh(rbox(16, 1.2, 14, 0.35, 3), std(PAL.white, { rough: 0.55, env: 0.45 }));
    base.position.y = -1.2; g.add(base);
    for (let i = 0; i < 3; i++) {
      const s = mesh(rbox(16.1, 0.16, 14.1, 0.2, 2), std(['#E6F3FF', '#CFE8FF', '#B7D9FF'][i], { rough: 0.5, env: 0.5 }), false);
      s.position.y = -0.3 - i * 0.32; s.receiveShadow = false; g.add(s);
    }
    const iceTop = mesh(rbox(15.7, 0.16, 13.7, 0.25, 3), std('#E8F5FF', { rough: 0.32, env: 0.65 }));
    iceTop.position.y = 0.0; g.add(iceTop);
    // rock inset + river
    const rock = mesh(rbox(12.6, 0.3, 9.8, 0.2, 2), std('#6F66AE', { rough: 0.9, env: 0.15 }));
    rock.position.y = 0.16; g.add(rock);
    const bank = mesh(rbox(12.0, 0.12, 9.2, 0.25, 2), std('#7D74B8', { rough: 0.85 }), false);
    bank.position.y = 0.44; g.add(bank);
    const riverU = { uProg: { value: 0 }, uFlow: { value: 0 } };
    const curve = new THREE.CatmullRomCurve3([
      V3(-5.6, 0.52, -2.6), V3(-3.4, 0.52, -1.4), V3(-1.6, 0.52, -2.0), V3(0.4, 0.52, -0.4),
      V3(2.2, 0.52, 1.2), V3(4.0, 0.52, 0.2), V3(5.6, 0.52, 2.6),
    ]);
    const riverGeo = new THREE.TubeGeometry(curve, 160, 0.27, 10, false);
    const riverMat = new THREE.MeshStandardMaterial({ color: C('#62F0F2'), emissive: C('#62F0F2'), emissiveIntensity: 3.6, roughness: 0.3, metalness: 0 });
    riverMat.onBeforeCompile = (sh) => {
      sh.uniforms.uProg = riverU.uProg; sh.uniforms.uFlow = riverU.uFlow;
      sh.vertexShader = 'varying vec2 vRUv;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRUv = uv;');
      sh.fragmentShader = 'varying vec2 vRUv; uniform float uProg, uFlow;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (vRUv.x > uProg) discard;\ntotalEmissiveRadiance *= 0.7 + 0.5 * (0.5 + 0.5 * sin(vRUv.x * 40.0 - uFlow * 3.0));');
    };
    riverMat.customProgramCacheKey = () => 'dengju-river-v1';
    const river = new THREE.Mesh(riverGeo, riverMat); river.layers.set(LAYER_GLOW); river.castShadow = false; g.add(river);
    // ice sheet over it
    const iceMat = new THREE.MeshStandardMaterial({ color: C('#D8EEFF'), roughness: 0.14, metalness: 0, envMapIntensity: 0.8, transparent: true, opacity: 0.72, depthWrite: false });
    const sheet = new THREE.Mesh(rbox(12.8, 0.3, 10.0, 0.18, 2), iceMat);
    sheet.position.y = 0.9; sheet.castShadow = false; sheet.receiveShadow = true; g.add(sheet);
    // crevasses
    for (let i = 0; i < 7; i++) {
      const cr = mesh(rbox(0.04, 0.012, 0.8 + (i % 3) * 0.4, 0.005, 1), std('#B7D9FF', { rough: 0.4 }), false);
      cr.position.set(-5.2 + i * 1.7, 1.21, -3.2 + (i % 4) * 1.7); cr.rotation.y = 0.5 + (i % 3) * 0.7; g.add(cr);
    }
    // ice cliff along the near rim
    const cliff = mesh(rbox(15.7, 1.05, 0.62, 0.14, 2), std('#E6F3FF', { rough: 0.4, env: 0.7 }));
    cliff.position.set(0, 0.0, 6.86); g.add(cliff);
    for (let i = 0; i < 9; i++) {
      const gr = mesh(rbox(0.055, 0.82, 0.03, 0.01, 1), std('#B7D9FF', { rough: 0.5 }), false);
      gr.position.set(-7.2 + i * 1.8, 0.66, 7.18); g.add(gr);
    }
    // field tent + flag
    const tent = new THREE.Group(); tent.position.set(6.1, 0.17, 4.2); g.add(tent);
    const tb = mesh(rbox(1.0, 0.4, 0.8, 0.06, 2), std(PAL.coral, { rough: 0.7 })); tent.add(tb);
    const troof = mesh(new THREE.ConeGeometry(0.72, 0.5, 4), std(PAL.white, { rough: 0.65 })); troof.position.y = 0.62; troof.rotation.y = Math.PI / 4; tent.add(troof);
    const fp = mesh(cyl(0.025, 0.025, 1.1, 6), std(PAL.white, { rough: 0.6 }), false); fp.position.set(-4.6, 0.2, 5.3); g.add(fp);
    const flag = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.55, 0.18, 0, 0, 0.36, 0], 3)), new THREE.MeshStandardMaterial({ color: C(PAL.coral), roughness: 0.8, side: THREE.DoubleSide }));
    flag.position.set(-4.57, 1.1, 5.3); flag.castShadow = true; g.add(flag);
    for (const [x, z, s2] of [[-7.0, -5.9, 0.55], [6.7, -5.5, 0.45], [6.9, 4.2, 0.6], [-7.1, -3.8, 0.4]]) {
      const blk = mesh(rbox(s2, s2 * 1.1, s2, 0.08, 2), std('#DFF2FF', { rough: 0.35, env: 0.7 }));
      blk.position.set(x, 0.16, z); g.add(blk);
    }
    // drifting snow sparkles
    const snow = [];
    const RS = A.rng(55);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: C('#FFFFFF'), roughness: 0.2, emissive: C('#DFF6FF'), emissiveIntensity: 1.4 }));
      m.position.set((RS() - 0.5) * 12, 1.3 + RS() * 1.4, (RS() - 0.5) * 9);
      g.add(m); snow.push({ m, ph: RS() * 6.28, y0: m.position.y });
    }
    // scan ring
    const scan = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), new THREE.MeshBasicMaterial({ color: C('#62F0F2'), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    scan.rotation.x = -Math.PI / 2; scan.position.y = 1.22; g.add(glow(scan));
    // radar station
    const station = new THREE.Group(); station.position.set(-5.9, 0.17, 4.5); g.add(station);
    const hut = mesh(rbox(1.0, 0.55, 0.8, 0.06, 2), std(PAL.coral, { rough: 0.65 })); station.add(hut);
    const roof = mesh(rbox(1.12, 0.1, 0.9, 0.04, 1), std(PAL.white, { rough: 0.6 })); roof.position.y = 0.55; station.add(roof);
    const mast = mesh(cyl(0.03, 0.03, 0.7, 6), std(PAL.white, { rough: 0.6 }), false); mast.position.set(0.55, 0.2, 0); station.add(mast);
    const radar = new THREE.Group(); radar.position.set(0.55, 1.0, 0); station.add(radar);
    const dish = mesh(new THREE.SphereGeometry(0.28, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(PAL.white, { rough: 0.4, env: 0.6 }), false);
    dish.rotation.x = Math.PI / 2; dish.rotation.z = 0.5; radar.add(dish);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({ color: C(PAL.coral) }));
    tip.position.set(0, 0.1, 0); radar.add(glow(tip));
    // drone
    const drone = new THREE.Group(); drone.position.set(0.5, 2.15, 0.5); g.add(drone);
    const db = mesh(rbox(0.22, 0.1, 0.22, 0.03, 1), std(PAL.ink, { rough: 0.6 })); drone.add(db);
    for (const [x, z] of [[-0.2, -0.2], [-0.2, 0.2], [0.2, -0.2], [0.2, 0.2]]) {
      const arm = mesh(rbox(0.04, 0.02, 0.3, 0.01, 1), std(PAL.ink, { rough: 0.7 }), false); arm.position.set(x, 0.03, z); drone.add(arm);
      const rotor = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 14), std(PAL.white, { rough: 0.5 }), false); rotor.position.set(x, 0.06, z); drone.add(rotor);
    }
    const parcel = mesh(rbox(0.12, 0.12, 0.12, 0.02, 1), std(PAL.butter, { rough: 0.6 }), false); parcel.position.y = -0.14; drone.add(parcel);
    return { g, iceMat, riverU, scan, radar, drone, snow };
  }

  async function buildPlaque() {
    const cw = 2048, ch = 660;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); };
    g.fillStyle = '#FBFAFF'; g.shadowColor = 'rgba(44,41,96,0.18)'; g.shadowBlur = 26; g.shadowOffsetY = 12;
    rr(60, 60, cw - 120, ch - 120, 42); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#FF9E86'; rr(60, 60, cw - 120, 26, 13); g.fill();
    g.fillStyle = '#2C2960';
    g.font = "700 250px 'PuHuiTi'";
    g.fillText('南越王墓', 130, 360);
    g.fillStyle = '#FF8E74';
    g.font = "700 74px 'PuHuiTi'";
    g.fillText('一九八三 · 广州 · 象岗山', 136, 476);
    g.fillStyle = '#6B64B8';
    g.font = "700 44px 'PuHuiTi'";
    g.fillText('NANYUE KING’S TOMB  ·  43 DAYS  ·  7 CHAMBERS', 138, 566);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    const w = 9.6, d = 3.1;
    const g3 = new THREE.Group();
    const slab = mesh(rbox(w, 0.16, d * 1.225, 0.12, 2), std('#FBFAFF', { rough: 0.68, env: 0.4 }));
    slab.position.y = -0.16; g3.add(slab);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d * 1.225).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    plane.position.y = 0.006; g3.add(plane);
    // lie on the floor plane, text running along screen-right (world +X,-Z)
    g3.rotation.y = Math.PI / 4;
    // solve a screen point at the end: sx 3.4, sy -4.6 on plane y = -1.7
    const endSx = 12.0, endSy = -0.7;
    const base = new THREE.Vector3().addScaledVector(camRight, 12.0).addScaledVector(camUp, -5.0);
    const y0 = -1.7;
    const k = (y0 - base.y) / DIR.y;
    base.addScaledVector(DIR, k);
    g3.position.set(base.x, y0, base.z);
    g3.visible = false;
    return { g: g3, y0 };
  }
}
