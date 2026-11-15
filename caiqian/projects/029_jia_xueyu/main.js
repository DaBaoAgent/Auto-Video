// The Other Half · Colored-Pencil Science Illustration 彩铅科普插画 — one timeline for the whole 50.8 s film.
// three.js builds the world (tree, ground, soil block, roots, worms, stones, mycelium);
// four G-buffer passes (albedo+id / light+depth+normal / hatch direction / anchor+reveal time) are re-drawn
// by a post shader as layered colored-pencil hatching on a paper tooth.
// Anti-swim rule: hatching, tooth-in-pigment and contour wobble are computed in "anchor" coordinates
// (each surface point projected through a fixed reference camera; the camera only translates inside a shot),
// so strokes stick to the things they draw. Only the contour wobble boils: a new drawing every 2 frames, 3 drawings cycled.
// Things are "drawn in" over time: every surface has a reveal time (arev); the post pass builds the four pencil
// layers up stroke by stroke after it, so the cutaway gets coloured in as the camera sinks.
import * as THREE from 'three';

const W = 1920, H = 1080, SS = 2, FPS = 24;  // post runs at 2x, then a 2x2 box downsample
const FILM = 27.1;                          // the whole film; ?from=&to= renders an excerpt (build.sh)
const QS = new URLSearchParams(location.search);
const FROM = +(QS.get('from') || 0), TO = +(QS.get('to') || FILM);
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.autoClear = false;

// ---------------------------------------------------------------- random & noise (JS)
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vn2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm1 = (x, s = 0) => { let r = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { r += a * (vn2(x * f, s + i * 7.3) - 0.5); f *= 2.1; a *= 0.5; } return r; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- geometry builder
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.t = []; this.ao = []; this.r = []; this.i = []; this.rv = -100; }
  get vc() { return this.p.length / 3; }
  v(p, n, c, t, ao = 1, rv = this.rv) { this.p.push(p.x, p.y, p.z); this.n.push(n.x, n.y, n.z); this.c.push(c[0], c[1], c[2]); this.t.push(t.x, t.y, t.z); this.ao.push(ao); this.r.push(rv); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('acol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('atan', new THREE.Float32BufferAttribute(this.t, 3));
    g.setAttribute('aao', new THREE.Float32BufferAttribute(this.ao, 1));
    g.setAttribute('arev', new THREE.Float32BufferAttribute(this.r, 1));
    g.setIndex(this.i);
    g.computeBoundingSphere();
    return g;
  }
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// tube with per-point radius; rfn(i, angle) optional radius multiplier; cfn(i, k) colour
function tube(b, pts, rad, sides, cfn, rfn, aofn, rvfn) {
  const n = pts.length; if (n < 2) return;
  const base = b.vc;
  let T = pts[1].clone().sub(pts[0]).normalize();
  let N = Math.abs(T.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
  N.sub(T.clone().multiplyScalar(N.dot(T))).normalize();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
    T = c.clone().sub(a).normalize();
    N.sub(T.clone().multiplyScalar(N.dot(T))).normalize();
    const B = T.clone().cross(N);
    for (let k = 0; k < sides; k++) {
      const ang = k / sides * Math.PI * 2;
      const d = N.clone().multiplyScalar(Math.cos(ang)).add(B.clone().multiplyScalar(Math.sin(ang)));
      const r = rad[i] * (rfn ? rfn(i, ang, d) : 1);
      b.v(pts[i].clone().add(d.clone().multiplyScalar(r)), d, cfn(i, k, d), T, aofn ? aofn(i, d) : 1, rvfn ? rvfn(i) : b.rv);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const k2 = (k + 1) % sides, a = base + i * sides + k, b1 = base + i * sides + k2, c = a + sides, d = b1 + sides;
    b.i.push(a, b1, c, b1, d, c);
  }
}
// append a three geometry with matrix + colour (fn of world pos & normal)
function append(b, geo, m, cfn, tan = UP, aofn) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pa = g.attributes.position, na = g.attributes.normal;
  const nm = new THREE.Matrix3().getNormalMatrix(m);
  const base = b.vc;
  for (let i = 0; i < pa.count; i++) {
    const p = V(pa.getX(i), pa.getY(i), pa.getZ(i)).applyMatrix4(m);
    const n = V(na.getX(i), na.getY(i), na.getZ(i)).applyMatrix3(nm).normalize();
    b.v(p, n, cfn(p, n), tan, aofn ? aofn(p, n) : 1);
    b.i.push(base + i);
  }
}
function chaikin(pts, rad, it = 1) {
  for (let r = 0; r < it; r++) {
    const P = [pts[0]], R = [rad[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      P.push(pts[i].clone().lerp(pts[i + 1], 0.25), pts[i].clone().lerp(pts[i + 1], 0.75));
      R.push(lerp(rad[i], rad[i + 1], 0.25), lerp(rad[i], rad[i + 1], 0.75));
    }
    P.push(pts[pts.length - 1]); R.push(rad[rad.length - 1]);
    pts = P; rad = R;
  }
  return [pts, rad];
}

// ---------------------------------------------------------------- materials
const SHARED = { uPass: { value: 0 }, uTime: { value: 0 }, uWindT: { value: 0 }, uRefVP: { value: new THREE.Matrix4() }, uOut: { value: new THREE.Vector2(W, H) } };
const VS = /* glsl */`
attribute vec3 acol; attribute vec3 atan; attribute float aao; attribute float arev;
uniform float uWind, uWindT;
varying vec3 vN, vW, vC, vT; varying float vZ, vAO, vRev;
void main(){
  vec4 wp = modelMatrix*vec4(position,1.0);
  if(uWind > 0.5 && wp.z > -9.0 && wp.y > 0.0){   // grass and flowers lean in the wind (time stepped at 12 drawings a second)
    float g = 0.7*sin(uWindT*1.7 + wp.x*0.9 + wp.z*0.6) + 0.3*sin(uWindT*2.9 + wp.x*2.3 - wp.z*1.1);
    wp.x += 0.10*wp.y*wp.y*(0.35 + g);
  }
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = acol; vT = normalize(mat3(modelMatrix)*atan); vAO = aao; vRev = arev;
  vec4 mv = viewMatrix*wp; vZ = -mv.z;
  gl_Position = projectionMatrix*mv;
}`;
const FS = /* glsl */`
uniform mat4 projectionMatrix;
uniform float uTip, uPass, uId, uKind, uDirMode, uAngle, uOutline, uDens, uAspect, uTime, uDisc, uRevMode, uRevT, uRevD;
uniform vec3 uColor; uniform mat4 uRefVP; uniform vec2 uOut;
varying vec3 vN, vW, vC, vT; varying float vZ, vAO, vRev;
float h31(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm3(vec3 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vn3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
vec2 vor3(vec3 p){ vec3 i=floor(p), f=fract(p); float d1=9.0, d2=9.0; float id=0.0;
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec3 g=vec3(x,y,z); vec3 o=vec3(h31(i+g), h31(i+g+11.3), h31(i+g+27.1));
    float d=length(g+o-f); if(d<d1){ d2=d1; d1=d; id=h31(i+g+5.7);} else if(d<d2) d2=d; }
  return vec2(d2-d1, id); }
vec3 albedo(){
  vec3 c = uColor*vC;
  if(uKind==1.0){            // soil: clods, grit, faint banding
    float n = fbm3(vW*vec3(2.2,3.5,2.2));
    c *= 0.78+0.44*n;
    // round grains (sand, dark crumbs, grey grit) on the cut face
    for(int k=0;k<2;k++){
      float sc = k==0 ? 26.0 : 11.0;
      vec2 q = vW.xy*sc + vec2(vW.z*7.0, float(k)*17.0);
      vec2 ci = floor(q), cf = fract(q);
      float hh = h31(vec3(ci, float(k)*3.1));
      vec2 o = 0.32 + 0.36*vec2(h31(vec3(ci,5.0+float(k))), h31(vec3(ci,9.0+float(k))));
      float rr = (0.10 + 0.17*h31(vec3(ci,13.0)))*(k==0?1.0:0.8);
      vec2 dd = (cf - o)*vec2(1.0, 1.25);
      float m = 1.0 - smoothstep(rr*0.75, rr, length(dd));
      if(k==0){ if(hh>0.90) c = mix(c, vec3(0.86,0.72,0.50), 0.75*m); else if(hh<0.08) c = mix(c, c*0.5, m); }
      else if(hh>0.93) c = mix(c, vec3(0.64,0.62,0.60), 0.8*m);
    }
    c *= 0.92+0.08*sin(vW.y*26.0+n*7.0);
  } else if(uKind==2.0){     // bark ridges + moss
    float s = fbm3(vec3(vW.x*7.0, vW.y*0.9, vW.z*7.0));
    c *= 0.72+0.56*s;
    float m = fbm3(vW*2.6+4.0);
    if(m>0.56 && vW.y<1.4) c = mix(c, vec3(0.46,0.56,0.22), smoothstep(0.56,0.64,m)*0.8);
  } else if(uKind==3.0){     // foliage: leaf cells
    vec2 v = vor3(vW*6.5);
    c *= 0.78+0.42*v.y;
    c = mix(c, c*vec3(1.15,1.12,0.7), step(0.82, v.y)*0.6);
    c *= mix(0.62, 1.0, smoothstep(0.02, 0.14, v.x));
  } else if(uKind==4.0){     // ground surface
    c *= 0.82+0.36*fbm3(vW*vec3(1.4,1.0,2.5));
  } else if(uKind==5.0){     // stone: mottling + speckle
    c *= 0.85+0.3*fbm3(vW*9.0);
    if(h31(floor(vW*60.0))>0.94) c*=0.75;
  }
  return clamp(c, 0.0, 1.0);
}
float revealTime(){
  if(uRevMode < 0.5) return vRev;
  // a sweep across the cut face, left to right, with a ragged front
  float x = clamp((vW.x + 6.0)/14.0, 0.0, 1.0);
  return uRevT + uRevD*x + 0.10*(fbm3(vec3(vW.x*1.3, vW.y*2.0, 0.0)) - 0.5);
}
void main(){
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  vec3 vn = normalize((viewMatrix*vec4(N,0.0)).xyz);
  float rt = revealTime() + uTip*length(vn.xy);    // uTip: the middle of a root leads its edges → a rounded growing tip
  if(uDisc > 0.5 && uTime < rt) discard;          // not drawn yet: leave what is behind
  if(uPass > 2.5){                                 // pass 3: anchor (reference-camera pixel) + reveal time
    vec4 c = uRefVP*vec4(vW,1.0);
    vec2 px = (c.xy/c.w*0.5 + 0.5)*uOut;
    gl_FragColor = vec4(px, rt, 1.0); return;
  }
  if(uPass < 0.5){ gl_FragColor = vec4(albedo(), uId/255.0); return; }
  if(uPass < 1.5){
    vec3 L = normalize(vec3(-0.5,0.78,0.45));
    float d = dot(N,L);
    float l = 0.30 + 0.12*N.y + 0.66*smoothstep(-0.15, 0.85, d);
    if(uKind==3.0) l *= mix(0.62, 1.0, smoothstep(1.3, 3.4, vW.y));
    if(uKind==6.0) l = 1.0;           // mycelium: never shaded
    l *= vAO;
    gl_FragColor = vec4(clamp(l,0.0,1.0), vZ, vn.xy*0.5+0.5); return;
  }
  // pass 2: hatch direction (doubled angle), outline weight, density
  vec2 fx = vec2(cos(2.0*uAngle), sin(2.0*uAngle));
  vec2 dv = fx;
  if(uDirMode > 0.5 && uDirMode < 1.5){
    vec4 a = projectionMatrix*viewMatrix*vec4(vW,1.0);
    vec4 b = projectionMatrix*viewMatrix*vec4(vW+vT*0.05,1.0);
    vec2 s = (b.xy/b.w - a.xy/a.w)*vec2(uAspect,1.0);
    if(length(s) > 1e-6){ float an = atan(s.y, s.x); dv = vec2(cos(2.0*an), sin(2.0*an)); }
  } else if(uDirMode > 1.5){
    float k = clamp(length(vn.xy)*1.3, 0.0, 1.0);
    float an = atan(vn.y, vn.x) + 1.5708;
    dv = normalize(mix(fx, vec2(cos(2.0*an), sin(2.0*an)), k*0.75) + 1e-4);
  }
  gl_FragColor = vec4(dv*0.5+0.5, uOutline, uDens);
}`;
function mat({ id, kind = 0, color = [1, 1, 1], dir = 0, angle = 0.8, outline = 1, dens = 1, side = THREE.FrontSide, disc = 0, wind = 0, rev = null, tip = 0 }) {
  return new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, side,
    uniforms: {
      uPass: SHARED.uPass, uTime: SHARED.uTime, uWindT: SHARED.uWindT, uRefVP: SHARED.uRefVP, uOut: SHARED.uOut,
      uDisc: { value: disc }, uWind: { value: wind }, uTip: { value: tip },
      uRevMode: { value: rev ? 1 : 0 }, uRevT: { value: rev ? rev[0] : 0 }, uRevD: { value: rev ? rev[1] : 0 },
      uId: { value: id }, uKind: { value: kind }, uDirMode: { value: dir },
      uAngle: { value: angle }, uOutline: { value: outline }, uDens: { value: dens },
      uAspect: { value: W / H }, uColor: { value: new THREE.Color(...color) },
    },
  });
}
// ids: 0 sky · 1 hills · 2 ground · 3 grass · 4 trunk · 5 foliage · 6 litter strip · 7 topsoil · 8 subsoil · 9 weathered · 10 bedrock matrix
//      11 roots · 12 worms · 13 stones · 14 bedrock rocks · 15 mycelium · 16 mushrooms · 17 flowers · 18 leaves · 19 far trees · 20 tunnels
const scene = new THREE.Scene();
const add = (geo, m) => { const o = new THREE.Mesh(geo, m); o.frustumCulled = false; scene.add(o); return o; };


// ================================================================ 029 · 假鳕鱼 · 彩铅科普插画测试段
// timeline (seconds)
// Sentence-by-sentence: every cue below is the word-level start of one sentence of the voice track
// (pencil_words.json, 150 words). Nothing on screen happens unless the voice is saying it.
const TL = {
  strata: [0.25, 1.0],         // S1 科学家推算，大约一亿两千万年前
  fish: [2.14, 1.6],           // S2 它就长成了今天的样子
  dorsal: 3.86,               // S3 背鳍分开两三瓣
  anal: 4.94,                 // S4 臀鳍也分开
  slow: 5.92,                 // S5 这种体型游不快
  tuna: [7.02, 1.32],         // S6 跟鱼雷似的金枪鱼比
  route: 8.34,                // S7 它走的是另一条路线
  stable: 9.88,               // S8 稳定
  school: [10.42, 2.4],       // S9 一大群鳕鱼在深海里像兵蚁一样推过去
  barren: 12.96,              // S10 经过的地方寸草不生
  mouth: 14.48,               // S11 那张嘴永远在嚼
  cannibal: 15.96,            // S12 连同类小鳕鱼都吃
  roe: [18.24, 1.8],          // S14 雌鱼一次产五百万枚卵
  grow: 19.92,                // S15 孵化七十天就能长大四十倍
  bar2: 22.26,                // S16 欧洲渔民曾捕到两米长的
  bar15: 24.20,               // S17 现在还能捞到一米五、八十多公斤的大家伙
  end: 26.94,
};

// ---------------------------------------------------------------- the seabed: strata of sediment (the cut face)
const TOP = -0.006, X0 = -20, X1 = 20, ZB = -7;
const bLit = x => -0.18 + 0.03 * fbm1(x * 1.2, 2);
const bTop = x => -1.42 + 0.20 * fbm1(x * 0.40, 5) + 0.05 * fbm1(x * 3, 6);
const bSub = x => -3.10 + 0.28 * fbm1(x * 0.34, 9) + 0.06 * fbm1(x * 2.4, 10);
const bWea = x => -3.95 + 0.18 * fbm1(x * 0.5, 13);
const REV = { lit: [0.26, 0.34], top: [0.56, 0.42], sub: [0.98, 0.46], wea: [1.44, 0.46], bed: [1.92, 0.42] };
const sweepX = x => clamp((x + 6) / 14, 0, 1);
function layer(upper, lower, id, color, rev) {
  const sh = new THREE.Shape();
  const N = 320;
  for (let i = 0; i <= N; i++) { const x = lerp(X0, X1, i / N); i ? sh.lineTo(x, upper(x)) : sh.moveTo(x, upper(x)); }
  for (let i = N; i >= 0; i--) { const x = lerp(X0, X1, i / N); sh.lineTo(x, lower(x)); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: -ZB, bevelEnabled: false, steps: 1, curveSegments: 1 });
  g.translate(0, 0, ZB);
  const b = new Builder();
  append(b, g, new THREE.Matrix4(), () => [1, 1, 1], V(1, 0, 0));
  add(b.geo(), mat({ id, kind: 1, color, dir: 0, angle: 0.62 + id * 0.11, outline: 0.55, dens: 1.0, rev }));
}
layer(() => TOP, bLit, 6, [0.30, 0.27, 0.24], REV.lit);
layer(bLit, bTop, 7, [0.44, 0.37, 0.30], REV.top);
layer(bTop, bSub, 8, [0.66, 0.55, 0.40], REV.sub);
layer(bSub, bWea, 9, [0.72, 0.63, 0.50], REV.wea);
layer(bWea, () => -14, 10, [0.42, 0.41, 0.40], REV.bed);

// ---------------------------------------------------------------- the water above the seabed + the far rise
{
  const g = new THREE.PlaneGeometry(120, 90, 60, 40); g.rotateX(-Math.PI / 2); g.translate(0, 0, -50);
  const b = new Builder();
  append(b, g, new THREE.Matrix4(), () => [0.50, 0.56, 0.64]);
  add(b.geo(), mat({ id: 2, kind: 4, color: [1, 1, 1], dir: 0, angle: 0.2, outline: 0.45, dens: 0.62 }));
}
{ // the far bottom: a slow ridge, only a wash of pencil
  const b = new Builder(), R = mulberry(29);
  for (const [x, y, z, sx, sy, sz, col] of [[-34, -3, -78, 40, 11, 14, [0.38, 0.43, 0.48]], [16, -4, -96, 52, 13, 16, [0.34, 0.40, 0.46]],
    [52, -2, -70, 30, 9, 12, [0.40, 0.45, 0.50]], [-8, -5, -58, 26, 8, 9, [0.44, 0.49, 0.53]]]) {
    append(b, new THREE.SphereGeometry(1, 48, 24), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(sx, sy, sz)), () => col);
  }
  add(b.geo(), mat({ id: 1, kind: 4, dir: 2, angle: 0.3, outline: 0.5, dens: 0.50 }));
}

// ---------------------------------------------------------------- the cod: a side view built from the real animal
// head left, tail right; the body spans 3.3 units = the two metres the voice talks about (S16)
const FX = 2.55, FY = 0.98, FZ = 2.35, FACE = FZ + 0.30, FINE = FZ + 0.34;
const codOutline = () => {
  const P = [[-1.66, 0.00], [-1.58, 0.12], [-1.38, 0.24], [-1.10, 0.30], [-0.78, 0.33],
    [-0.28, 0.33], [0.22, 0.30], [0.74, 0.23], [1.14, 0.15], [1.42, 0.09],
    [1.43, -0.02], [1.24, -0.10], [0.92, -0.19], [0.48, -0.27], [-0.04, -0.31],
    [-0.56, -0.30], [-1.02, -0.25], [-1.36, -0.15], [-1.56, -0.06], [-1.66, 0.00]];
  const s = new THREE.Shape(); s.moveTo(P[0][0], P[0][1]);
  s.splineThru(P.slice(1).map(q => new THREE.Vector2(q[0], q[1])));
  return s;
};
const FM = new THREE.Matrix4().makeTranslation(FX, FY, FZ);       // every cod part goes on this matrix
const FB = new Builder();
{ // body: olive-brown back fading to a white belly, soft mottling and pencil flecks
  const g = new THREE.ExtrudeGeometry(codOutline(), { depth: 0.46, bevelEnabled: true, bevelSize: 0.055, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 18 });
  g.translate(0, 0, -0.23); g.computeVertexNormals();
  append(FB, g, FM, (p, n) => {
    const t = clamp((p.y - FY) / 0.66 + 0.5, 0, 1);              // belly 0 → back 1
    const c = t < 0.5
      ? [lerp(0.90, 0.55, t / 0.5), lerp(0.88, 0.52, t / 0.5), lerp(0.79, 0.38, t / 0.5)]
      : [lerp(0.55, 0.31, (t - 0.5) / 0.5), lerp(0.52, 0.30, (t - 0.5) / 0.5), lerp(0.38, 0.26, (t - 0.5) / 0.5)];
    const patch = clamp(vn2(p.x * 4.4, p.y * 4.4 + p.z * 1.8) * 1.30 - 0.36, 0, 1) * (0.45 + 0.55 * t);
    const fl = vn2(p.x * 24, p.y * 28) > 0.72 ? 0.90 : 1.0;      // scale specks
    return [c[0] * (1 - 0.46 * patch) * fl, c[1] * (1 - 0.46 * patch) * fl, c[2] * (1 - 0.44 * patch) * fl];
  });
  const tail = new THREE.Shape();                              // caudal fin, faintly forked
  tail.moveTo(1.40, 0.06); tail.quadraticCurveTo(1.74, 0.36, 1.98, 0.44);
  tail.quadraticCurveTo(1.84, 0.12, 1.88, 0.00);
  tail.quadraticCurveTo(1.84, -0.12, 1.96, -0.40);
  tail.quadraticCurveTo(1.70, -0.32, 1.40, -0.07);
  const tg2 = new THREE.ExtrudeGeometry(tail, { depth: 0.10, bevelEnabled: false, curveSegments: 12 });
  tg2.translate(0, 0, 0.20);
  append(FB, tg2, FM, () => [0.42, 0.40, 0.33]);
  add(FB.geo(), mat({ id: 22, kind: 0, color: [1, 1, 1], dir: 1, angle: 0.35, outline: 0.95, dens: 1.0, rev: TL.fish }));
}
const lobe = (x0, x1, y0, h, dir) => {
  const s = new THREE.Shape();
  s.moveTo(x0, y0);
  s.quadraticCurveTo(x0 + (x1 - x0) * 0.22, y0 + dir * h * 1.08, x0 + (x1 - x0) * 0.70, y0 + dir * h * 0.74);
  s.lineTo(x1, y0 + dir * 0.01); s.lineTo(x0, y0);
  return s;
};
const finGeo = (s, d) => { const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 10 }); g.translate(0, 0, -d * 0.5); return g; };
const FDOR = new Builder();
{ // three dorsal lobes, the first one taller — the split the voice counts
  for (const [x0, x1, h] of [[-1.16, -0.78, 0.33], [-0.70, -0.32, 0.30], [-0.22, 0.26, 0.24]])
    append(FDOR, finGeo(lobe(x0, x1, 0.295, h, 1), 0.075), FM, () => [0.45, 0.46, 0.40]);
  add(FDOR.geo(), mat({ id: 25, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.9, outline: 0.8, dens: 1.0, rev: [TL.dorsal, 0.6] }));
}
const FAN = new Builder();
{ // two anal lobes, low on the belly line
  for (const [x0, x1, h] of [[0.44, 0.76, 0.19], [0.88, 1.14, 0.16]])
    append(FAN, finGeo(lobe(x0, x1, -0.265, h, -1), 0.07), FM, () => [0.34, 0.35, 0.31]);
  add(FAN.geo(), mat({ id: 26, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.9, outline: 0.8, dens: 1.0, rev: [TL.anal, 0.5] }));
}
const FPAIR = new Builder();
{ // pectoral (behind the gill, angled back) and pelvic, both thin blades in front of the flank
  const pec = new THREE.Shape(); pec.absellipse(-1.14, -0.14, 0.32, 0.095, 0, Math.PI * 2);
  const g1 = finGeo(pec, 0.06); g1.rotateZ(-0.62); g1.translate(0, 0, -0.02);
  append(FPAIR, g1, FM, () => [0.36, 0.38, 0.40]);
  const pel = new THREE.Shape(); pel.absellipse(0.30, -0.335, 0.14, 0.06, 0, Math.PI * 2);
  const g2 = finGeo(pel, 0.05); g2.rotateZ(0.30);
  append(FPAIR, g2, FM, () => [0.38, 0.40, 0.42]);
  add(FPAIR.geo(), mat({ id: 27, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.6, outline: 0.75, dens: 1.0, rev: [TL.fish[0] + 0.5, 0.7] }));
}
const FB2 = new Builder();
{ // eye, gill cover, mouth line, chin barbel, lateral line, scale rows — all pressed onto the flank
  const ZF = FINE;
  // eye: iris rim, dark pupil, one catchlight
  append(FB2, new THREE.SphereGeometry(1, 26, 18), new THREE.Matrix4().compose(V(FX - 1.34, FY + 0.10, ZF), new THREE.Quaternion(), V(0.095, 0.095, 0.04)), () => [0.74, 0.71, 0.62]);
  append(FB2, new THREE.SphereGeometry(1, 22, 14), new THREE.Matrix4().compose(V(FX - 1.345, FY + 0.10, ZF + 0.025), new THREE.Quaternion(), V(0.055, 0.055, 0.022)), () => [0.12, 0.11, 0.10]);
  append(FB2, new THREE.SphereGeometry(1, 12, 8), new THREE.Matrix4().compose(V(FX - 1.362, FY + 0.122, ZF + 0.04), new THREE.Quaternion(), V(0.014, 0.014, 0.008)), () => [0.94, 0.94, 0.90]);
  // gill cover: one sweeping arc, then two short ribs
  const gill = []; for (let i = 0; i <= 16; i++) { const u = i / 16; gill.push(V(FX - 1.10 + 0.22 * Math.sin(u * Math.PI * 0.92), FY + 0.27 - u * 0.42, ZF)); }
  tube(FB2, gill, gill.map(() => 0.011), 5, () => [0.26, 0.25, 0.23]);
  for (let r = 0; r < 2; r++) { const k = 0.30 + r * 0.24, p0 = V(FX - 1.14 + 0.20 * Math.sin(k * Math.PI * 0.92), FY + 0.30 - k * 0.60, ZF), p1 = p0.clone().add(V(-0.09, -0.04, 0)); tube(FB2, [p0, p1], [0.006, 0.005], 4, () => [0.33, 0.32, 0.30]); }
  // mouth: a long low jaw line, set under the snout where a cod's mouth actually sits
  tube(FB2, [V(FX - 1.655, FY - 0.075, ZF), V(FX - 1.50, FY - 0.115, ZF), V(FX - 1.33, FY - 0.135, ZF)], [0.008, 0.010, 0.007], 5, () => [0.15, 0.14, 0.13]);
  // chin barbel, hanging under the jaw
  tube(FB2, [V(FX - 1.47, FY - 0.135, ZF), V(FX - 1.42, FY - 0.30, ZF), V(FX - 1.36, FY - 0.37, ZF)], [0.012, 0.008, 0.004], 5, () => [0.34, 0.32, 0.28]);
  // lateral line: a dotted seam, pale, down the middle of the flank
  for (let i = 0; i < 16; i++) {
    const u = i / 15, x = lerp(-1.02, 1.20, u), y = 0.055 + 0.045 * Math.sin(u * 5.2) - 0.10 * u * u;
    append(FB2, new THREE.SphereGeometry(1, 8, 6), new THREE.Matrix4().compose(V(FX + x, FY + y, ZF), new THREE.Quaternion(), V(0.010, 0.007, 0.005)), () => [0.78, 0.76, 0.68]);
  }
  // scale rows: short, faint ticks along two bands — not spikes
  for (const [x0, x1, n, yy] of [[-0.92, 1.08, 9, 0.06], [-0.84, 1.00, 8, -0.10]]) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, i / (n - 1)), y = yy + 0.05 * Math.sin(i * 1.1);
      const s = V(FX + x, FY + y - 0.055, ZF);
      tube(FB2, [s, V(FX + x + 0.052, FY + y + 0.040, ZF)], [0.0026, 0.0021], 3, () => [0.58, 0.57, 0.53]);
    }
  }
  add(FB2.geo(), mat({ id: 23, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.5, outline: 0.7, dens: 1.0, rev: [TL.fish[0] + 0.75, 0.85] }));
}
const JAW = new Builder();
{ // the lower jaw, hinged at the mouth corner so it can chew (S11)
  const s = new THREE.Shape();
  s.moveTo(0.01, -0.005); s.quadraticCurveTo(-0.09, -0.048, -0.17, -0.030); s.lineTo(-0.165, -0.004); s.lineTo(0.01, 0.006);
  const g = finGeo(s, 0.055);
  append(JAW, g, new THREE.Matrix4(), () => [0.26, 0.25, 0.22]);
}
const JAW_M = new THREE.Mesh(JAW.geo(), mat({ id: 33, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.4, outline: 0.7, dens: 1.0, rev: [TL.fish[0] + 0.9, 0.8] }));
JAW_M.position.set(FX - 1.60, FY - 0.115, FACE + 0.045);
JAW_M.frustumCulled = false; scene.add(JAW_M);
// ---------------------------------------------------------------- five million eggs (S14): let go in the water, not buried
const ROE = [];
const ROE_M = (() => {
  const b = new Builder(), R = mulberry(41);
  for (let i = 0; i < 115; i++) {
    const u = R(), v = R(), w = Math.pow(R(), 0.55);
    const x = FX - 0.55 + u * 3.90, y = 0.56 - w * 0.56, z = FZ - 1.55 + v * 2.20;
    const r = 0.030 + R() * 0.020;
    append(b, new THREE.SphereGeometry(1, 10, 7), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(r, r, r)),
      () => { const t = R(); return [lerp(0.84, 0.95, t), lerp(0.66, 0.84, t), lerp(0.34, 0.52, t)]; });
    ROE.push(V(x, y, z));
  }
  return add(b.geo(), mat({ id: 13, kind: 0, color: [1, 1, 1], dir: 0, angle: -0.6, outline: 0.35, dens: 0.9, rev: TL.roe }));
})();
// ---------------------------------------------------------------- the juvenile of S15: grows forty times in seventy days
const JUV_M = (() => {
  const b = new Builder();
  const g = new THREE.ExtrudeGeometry(codOutline(), { depth: 0.30, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -0.15);
  append(b, g, new THREE.Matrix4(), (p, n) => {
    const t = clamp((p.y - FY) / 0.66 + 0.5, 0, 1);
    return [lerp(0.78, 0.36, t), lerp(0.76, 0.38, t), lerp(0.66, 0.34, t)];
  });
  const tg2 = new THREE.Shape();
  tg2.moveTo(1.40, 0.06); tg2.quadraticCurveTo(1.74, 0.36, 1.98, 0.44);
  tg2.quadraticCurveTo(1.84, 0.12, 1.88, 0.00); tg2.quadraticCurveTo(1.84, -0.12, 1.96, -0.40); tg2.quadraticCurveTo(1.70, -0.32, 1.40, -0.07);
  const gg = new THREE.ExtrudeGeometry(tg2, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }); gg.translate(0, 0, 0.10);
  append(b, gg, new THREE.Matrix4(), () => [0.52, 0.54, 0.56]);
  append(b, new THREE.SphereGeometry(1, 12, 8), new THREE.Matrix4().compose(V(-1.40, 0.135, 0.19), new THREE.Quaternion(), V(0.105, 0.105, 0.05)), () => [0.12, 0.12, 0.13]);
  append(b, finGeo(lobe(-0.86, -0.04, 0.32, 0.15, 1), 0.05), new THREE.Matrix4(), () => [0.44, 0.45, 0.40]);
  append(b, finGeo(lobe(-0.30, 0.34, -0.32, 0.12, -1), 0.05), new THREE.Matrix4(), () => [0.46, 0.47, 0.42]);
  const m = add(b.geo(), mat({ id: 31, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.6, outline: 0.9, dens: 1.0, rev: [TL.grow, 0.35] }));
  m.position.set(FX + 1.30, 0.18, FZ + 1.30); m.scale.set(0.30, 0.30, 0.30);
  return m;
})();
// ---------------------------------------------------------------- one young cod, taken (S12)
const PREY_M = (() => {
  const b = new Builder();
  const g = new THREE.ExtrudeGeometry(codOutline(), { depth: 0.30, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -0.15);
  append(b, g, new THREE.Matrix4(), (p, n) => {
    const t = clamp((p.y - FY) / 0.66 + 0.5, 0, 1);
    return [lerp(0.80, 0.34, t), lerp(0.78, 0.36, t), lerp(0.68, 0.32, t)];
  });
  const ts = new THREE.Shape();
  ts.moveTo(1.40, 0.06); ts.quadraticCurveTo(1.74, 0.36, 1.98, 0.44);
  ts.quadraticCurveTo(1.84, 0.12, 1.88, 0.00); ts.quadraticCurveTo(1.84, -0.12, 1.96, -0.40); ts.quadraticCurveTo(1.70, -0.32, 1.40, -0.07);
  const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }); tg.translate(0, 0, 0.08);
  append(b, tg, new THREE.Matrix4(), () => [0.46, 0.44, 0.36]);
  append(b, new THREE.SphereGeometry(1, 12, 8), new THREE.Matrix4().compose(V(-1.44, 0.135, 0.19), new THREE.Quaternion(), V(0.10, 0.10, 0.05)), () => [0.12, 0.12, 0.13]);
  const m = add(b.geo(), mat({ id: 35, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.6, outline: 0.85, dens: 1.0, rev: [TL.cannibal - 0.10, 0.45] }));
  m.position.set(FX + 0.66, FY - 0.56, FZ + 1.35); m.scale.set(0.20, 0.20, 0.20);
  return m;
})();
// ---------------------------------------------------------------- the bars: two metres (S16), then one metre fifty (S17)
const BAR2 = { a: V(FX - 1.65, FY + 1.42, FZ + 0.55), b: V(FX + 1.65, FY + 1.42, FZ + 0.55) };
const BAR15 = { a: V(FX - 1.2375, FY + 1.42, FZ + 0.55), b: V(FX + 1.2375, FY + 1.42, FZ + 0.55) };
const barMesh = (BARX, rev, id) => {
  const b = new Builder();
  tube(b, [BARX.a, BARX.b], [0.017, 0.017], 6, () => [0.18, 0.17, 0.16]);
  for (const e of [BARX.a, BARX.b]) tube(b, [V(e.x, e.y - 0.13, e.z), V(e.x, e.y + 0.13, e.z)], [0.015, 0.015], 6, () => [0.18, 0.17, 0.16]);
  for (let i = 1; i < 10; i++) { const x = lerp(BARX.a.x, BARX.b.x, i / 10); tube(b, [V(x, BARX.a.y - 0.045, BARX.a.z), V(x, BARX.a.y + 0.045, BARX.a.z)], [0.007, 0.007], 4, () => [0.34, 0.32, 0.30]); }
  return add(b.geo(), mat({ id, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.1, outline: 0.5, dens: 0.85, rev }));
};
barMesh(BAR2, [TL.bar2, 0.45], 32);
barMesh(BAR15, [TL.bar15, 0.45], 34);
// ---------------------------------------------------------------- the tuna of S6: torpedo body, lunate tail, one dash
const TUNA_M = (() => {
  const b = new Builder();
  const P = [[-1.62, 0.00], [-1.40, 0.11], [-0.95, 0.22], [-0.30, 0.27], [0.40, 0.23], [0.95, 0.12], [1.24, 0.04],
    [1.24, -0.045], [0.95, -0.13], [0.40, -0.25], [-0.30, -0.27], [-0.95, -0.19], [-1.40, -0.09], [-1.62, 0.00]];
  const s = new THREE.Shape(); s.moveTo(P[0][0], P[0][1]); s.splineThru(P.slice(1).map(q => new THREE.Vector2(q[0], q[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, 0, -0.21);
  append(b, g, new THREE.Matrix4(), (p, n) => {
    const t = clamp(p.y / 0.28 * 0.5 + 0.5, 0, 1);
    return [lerp(0.74, 0.14, t), lerp(0.78, 0.21, t), lerp(0.84, 0.33, t)];
  });
  append(b, new THREE.SphereGeometry(1, 14, 10), new THREE.Matrix4().compose(V(-1.46, 0.085, 0.21), new THREE.Quaternion(), V(0.080, 0.080, 0.045)), () => [0.13, 0.13, 0.14]);
  for (const [y0, y1, ln] of [[0.10, 0.13, 3.30], [-0.02, 0.00, 3.52], [-0.15, -0.21, 3.20]])
    tube(b, [V(1.85, y0, 0.04), V(ln * 0.70, (y0 + y1) / 2, 0.04), V(ln, y1, 0.04)], [0.011, 0.013, 0.007], 4, () => [0.64, 0.68, 0.74]);
  const ts = new THREE.Shape();
  ts.moveTo(1.22, 0.05); ts.quadraticCurveTo(1.58, 0.26, 1.86, 0.46); ts.quadraticCurveTo(1.66, 0.10, 1.68, 0.00);
  ts.quadraticCurveTo(1.66, -0.10, 1.86, -0.46); ts.quadraticCurveTo(1.58, -0.26, 1.22, -0.05);
  const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }); tg.translate(0, 0, -0.04);
  append(b, tg, new THREE.Matrix4(), () => [0.24, 0.29, 0.36]);
  for (const [x, y, h, dir] of [[-0.34, 0.29, 0.13, 1], [0.26, 0.24, 0.10, 1], [0.18, -0.27, 0.10, -1]])
    append(b, finGeo(lobe(x - 0.16, x + 0.16, y, h, dir), 0.06), new THREE.Matrix4(), () => [0.30, 0.35, 0.41]);
  const m = add(b.geo(), mat({ id: 28, kind: 0, color: [1, 1, 1], dir: 1, angle: 0.3, outline: 0.85, dens: 1.0, rev: [0.4, 0.5] }));
  m.position.set(8.6, FY + 1.62, FZ + 0.95);
  m.scale.set(0.74, 0.74, 0.74);
  return m;
})();
// ---------------------------------------------------------------- the school of S9: a dozen cod, pushed forward like columns of ants
const SCHOOL_M = (() => {
  const b = new Builder();
  const g = new THREE.ExtrudeGeometry(codOutline(), { depth: 0.28, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -0.14);
  const ts = new THREE.Shape();
  ts.moveTo(1.40, 0.06); ts.quadraticCurveTo(1.74, 0.36, 1.98, 0.44);
  ts.quadraticCurveTo(1.84, 0.12, 1.88, 0.00); ts.quadraticCurveTo(1.84, -0.12, 1.96, -0.40); ts.quadraticCurveTo(1.70, -0.32, 1.40, -0.07);
  const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.08, bevelEnabled: false, curveSegments: 8 }); tg.translate(0, 0, 0.08);
  const R = mulberry(57);
  for (let i = 0; i < 15; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    const x = 3.10 + col * 1.14 + row * 0.52 + (R() - 0.5) * 0.30;
    const y = FY + 1.02 - row * 0.34 + (R() - 0.5) * 0.20;
    const z = FZ + 0.35 - row * 0.42 + (R() - 0.5) * 0.38;
    const sc = 0.20 + R() * 0.07;
    const M = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (R() - 0.5) * 0.14)), V(sc, sc, sc));
    append(b, g, M, (p, n) => {
      const t = clamp((p.y - y) / 0.2 + 0.5, 0, 1);
      return [lerp(0.80, 0.28, t), lerp(0.78, 0.30, t), lerp(0.70, 0.28, t)];
    });
    append(b, tg, M, () => [0.44, 0.42, 0.34]);
  }
  return add(b.geo(), mat({ id: 29, kind: 0, color: [1, 1, 1], dir: 1, angle: 0.4, outline: 0.8, dens: 1.0, rev: [TL.school[0], 0.9] }));
})();
// ---------------------------------------------------------------- the floor cover of S10: what the school strips off
const WEED_M = (() => {
  const b = new Builder(), R = mulberry(63);
  for (let i = 0; i < 7; i++) {
    const x = -2.6 + i * 1.55 + (R() - 0.5) * 0.7, z = 0.95 + R() * 0.95;
    for (let k = 0; k < 4; k++) {
      const h = 0.20 + R() * 0.34, lean = (R() - 0.5) * 0.85, pts = [];
      for (let j = 0; j < 5; j++) { const u = j / 4; pts.push(V(x + lean * u * u, 0.02 + h * u, z + (R() - 0.5) * 0.05)); }
      tube(b, pts, pts.map((_, j) => 0.021 * (1 - j / 4 * 0.55)), 4, () => [0.33, 0.39, 0.27]);
    }
  }
  return add(b.geo(), mat({ id: 30, kind: 0, color: [1, 1, 1], dir: 0, angle: 0.2, outline: 0.6, dens: 0.95, rev: [1.2, 0.8] }));
})();
function placeGrains(t) {
  // S6: the tuna crosses once, at speed, then is gone
  const tk = clamp((t - TL.tuna[0]) / TL.tuna[1], 0, 1.18);
  TUNA_M.position.set(lerp(8.6, -1.4, tk), FY + 0.88 - 0.26 * tk, FZ + 1.25);
  // S9: the school pushes past from the right
  SCHOOL_M.position.set(-Math.max(0, t - TL.school[0]) * 0.60, 0, 0);
  // S10: the floor cover is scalped off as they pass
  const wk = clamp((t - TL.barren + 0.12) / 0.85, 0, 1);
  WEED_M.scale.y = Math.max(0.002, 1 - wk);
  // S11–S12: the jaw works while the voice says it never stops chewing
  const chew = (t >= TL.mouth - 0.03 && t <= TL.cannibal + 1.05) ? 0.5 + 0.5 * Math.sin((t - TL.mouth) * 8.4) : 0;
  JAW_M.rotation.z = -0.02 - 0.13 * chew;
  // S15: the juvenile lifts out of the roe cloud, seventy days, forty times bigger
  const gk = ss(clamp((t - TL.grow) / 1.9, 0, 1));
  JUV_M.position.set(FX + 1.30, 0.18 + 0.40 * gk, FZ + 1.30);
  const js = 0.30 + 0.22 * gk; JUV_M.scale.set(js, js, js);
  // S12: a young cod drifts up to the mouth and is taken
  const pw = clamp((t - TL.cannibal) / 1.15, 0, 1);
  PREY_M.position.set(FX + 0.66 - pw * 2.02, FY - 0.56 + pw * 0.40, FZ + 1.35);
  const ps = 0.20 - 0.06 * pw; PREY_M.scale.set(ps, ps, ps);
}

// ---------------------------------------------------------------- G-buffer targets
const IW = W * SS, IH = H * SS;
const mkRT = (type, filter) => new THREE.WebGLRenderTarget(IW, IH, { type, minFilter: filter, magFilter: filter, depthBuffer: true, generateMipmaps: false });
const rtA = mkRT(THREE.HalfFloatType, THREE.NearestFilter), rtL = mkRT(THREE.HalfFloatType, THREE.NearestFilter), rtD = mkRT(THREE.HalfFloatType, THREE.NearestFilter);
const rtR = mkRT(THREE.FloatType, THREE.NearestFilter);      // anchor pixel (full float: values up to ~3000 px) + reveal time
const rtP1 = mkRT(THREE.UnsignedByteType, THREE.LinearFilter), rtP2 = mkRT(THREE.UnsignedByteType, THREE.LinearFilter), rtC = mkRT(THREE.UnsignedByteType, THREE.LinearFilter);
const camera = new THREE.PerspectiveCamera(34, W / H, 0.02, 400);
const refCam = new THREE.PerspectiveCamera(34, W / H, 0.02, 400);
const PITCH = -0.06;                          // fixed orientation everywhere: inside a shot the camera only translates (strokes stay anchored)
const CQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(PITCH, 0, 0, 'YXZ'));
const TANP = Math.tan(-PITCH);

// ---------------------------------------------------------------- shots
const SHOTS = [
  [0.0, 'S1', 'the cut face, dates, the age of the shape'],
  [TL.fish[0], 'S2', 'the cod drawn: body, eye, gill'],
  [TL.dorsal, 'S3', 'the three dorsal lobes'],
  [TL.anal, 'S4', 'the two anal lobes'],
  [TL.slow, 'S5', 'slow — not built for speed'],
  [TL.tuna[0], 'S6', 'the tuna crosses: torpedo, speed lines'],
  [TL.route, 'S7', 'two routes: the tuna gone, the cod steady'],
  [TL.stable, 'S8', 'STABLE'],
  [TL.school[0], 'S9', 'the school pushes past like ants'],
  [TL.barren, 'S10', 'the floor stripped bare'],
  [TL.mouth, 'S11', 'the jaw, always chewing'],
  [TL.cannibal, 'S12', 'it eats its own young'],
  [TL.roe[0], 'S13', 'the roe cloud released'],
  [TL.grow, 'S14', 'seventy days, forty times'],
  [TL.bar2, 'S15', 'the two-metre bar'],
  [TL.bar15, 'S16', 'one metre fifty, eighty kilos'],
  [TL.end, 'end', ''],
];
const keys = (K, t) => {                      // [t, x, y, z, ease]
  if (t <= K[0][0]) return V(K[0][1], K[0][2], K[0][3]);
  for (let i = 1; i < K.length; i++) { const a = K[i - 1], b = K[i]; if (t <= b[0]) { let k = (t - a[0]) / (b[0] - a[0]); if (b[4]) k = ease5(k); return V(lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)); } }
  const l = K[K.length - 1]; return V(l[1], l[2], l[3]);
};
const KW = [
  [0.00, 1.05, 1.55, 15.60, 0],
  [1.20, 1.30, 1.50, 15.00, 0],
  [2.10, 1.62, 1.30, 12.40, 1],
  [3.80, 2.32, 1.12, 9.60, 0],
  [4.90, 2.48, 1.08, 9.10, 0],
  [6.90, 2.05, 1.30, 11.60, 1],
  [8.30, 2.32, 1.10, 9.40, 0],
  [9.85, 2.28, 1.05, 9.00, 0],
  [10.40, 1.75, 1.22, 12.20, 1],
  [12.90, 1.95, 1.25, 11.60, 0],
  [14.45, 1.32, 1.02, 6.90, 1],
  [15.95, 1.16, 1.02, 6.30, 0],
  [17.30, 1.62, 1.05, 7.80, 1],
  [18.20, 2.28, 0.95, 9.20, 0],
  [19.90, 2.10, -0.05, 6.90, 1],
  [22.20, 2.28, 0.85, 9.80, 0],
  [22.32, 2.38, 1.15, 11.40, 1],
  [24.15, 2.38, 1.10, 11.20, 0],
  [24.32, 2.30, 1.05, 11.60, 1],
  [27.10, 2.12, 1.20, 12.60, 0],
];const ease5 = k => k * k * k * (k * (k * 6 - 15) + 10);
const REF = V(1.2, 0.5, 8.0);
function views(t) {
  const hide = [];
  if (t < TL.roe[0] - 0.15) hide.push(13);
  if (t < TL.grow - 0.02) hide.push(31);
  if (t > TL.bar2 + 0.55) hide.push(31);
  if (t < TL.cannibal - 0.12 || t > TL.cannibal + 1.30) hide.push(35);
  if (t > TL.bar2 + 0.10) hide.push(13);
  if (t < TL.bar2 - 0.15) hide.push(32);
  if (t > TL.bar15 - 0.05) hide.push(32);
  if (t < TL.bar15 - 0.15) hide.push(34);
  if (t < TL.tuna[0] - 0.15 || t > TL.tuna[0] + TL.tuna[1] + 0.18) hide.push(28);
  if (t < TL.school[0] - 0.15 || t > TL.barren + 1.30) hide.push(29);
  return { main: { pos: keys(KW, t), ref: REF, focus: {}, hide } };
}

function setCamera(v) {
  camera.position.copy(v.pos); camera.quaternion.copy(CQ); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  refCam.position.copy(v.ref); refCam.quaternion.copy(CQ); refCam.updateMatrixWorld(); refCam.updateProjectionMatrix();
  SHARED.uRefVP.value.multiplyMatrices(refCam.projectionMatrix, refCam.matrixWorldInverse);
}
const proj = (v, cam = camera) => { const p = v.clone().project(cam); return [(p.x * 0.5 + 0.5) * W, (0.5 - p.y * 0.5) * H]; };
const camPos = t => views(t).main.pos;

// ---------------------------------------------------------------- overlay canvases: paper (tags, slips), graphite, coloured pencil
const tagC = document.createElement('canvas'), inkC = document.createElement('canvas'), colC = document.createElement('canvas'), OC = document.createElement('canvas');
for (const c of [tagC, inkC, colC, OC]) { c.width = W; c.height = H; }
const tg = tagC.getContext('2d'), ik = inkC.getContext('2d'), cl = colC.getContext('2d'), octx = OC.getContext('2d');
const tagT = new THREE.CanvasTexture(tagC), inkT = new THREE.CanvasTexture(inkC), colT = new THREE.CanvasTexture(colC);
const FONT = 'WK';
let GLY = null, BOIL = 0;
const hsh = (a, b = 0, c = 0) => h2(a * 1.731 + c * 0.377, b * 2.113 + c * 1.913);
const plen = P => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };
function textLayout(s, size, seed, o = {}) {
  const { jit = 1 } = o;
  ik.save(); ik.font = `${size}px ${FONT}`;
  const ch = [...s], ws = ch.map(c => ik.measureText(c).width); ik.restore();
  const R = mulberry(seed), rr = () => R() * 2 - 1;
  let cx = 0, L = 0; const chars = [], G = GLY.WK;
  ch.forEach((c, i) => {
    const dy = rr() * jit * size * 0.025, r = rr() * jit * 0.035;
    const sk = (G.g[c] || []).map(a => { const P = []; for (let j = 0; j < a.length; j += 2) P.push([a[j] * size, a[j + 1] * size]); return P; });
    const len = sk.map(plen).reduce((a, b) => a + b, 0) + sk.length * size * 0.12;
    chars.push({ c, ox: cx, dy, r, sk, len, L0: L }); L += len; cx += ws[i];
  });
  return { s, size, chars, L, hw: G.hw * size, tot: cx };
}
function textDraw(T, x, y, prog, alpha = 1) {   // write T at (x, y) (left, baseline) along its glyph skeletons up to prog
  const target = prog * T.L; if (target <= 0) return;
  ik.save(); ik.translate(x, y); ik.globalAlpha = alpha;
  ik.font = `${T.size}px ${FONT}`; ik.fillStyle = '#000'; ik.textBaseline = 'alphabetic';
  for (const C of T.chars) {
    if (C.L0 >= target) break;
    const part = target - C.L0;
    ik.save(); ik.translate(C.ox, C.dy); ik.rotate(C.r);
    if (part >= C.len || !C.sk.length) { ik.fillText(C.c, 0, 0); ik.restore(); continue; }
    const m = ik.getTransform();
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
    octx.setTransform(m); octx.font = ik.font; octx.fillStyle = '#000'; octx.textBaseline = 'alphabetic';
    octx.fillText(C.c, 0, 0);
    octx.globalCompositeOperation = 'destination-in'; octx.lineCap = 'round'; octx.lineJoin = 'round'; octx.lineWidth = T.hw * 2.9 + 1.5; octx.strokeStyle = '#000';
    let left = part; octx.beginPath();
    for (let k = 0; k < C.sk.length && left > 0; k++) {
      const P = C.sk[k]; octx.moveTo(P[0][0], P[0][1]); if (P.length === 1) octx.lineTo(P[0][0] + 0.1, P[0][1]);
      for (let j = 1; j < P.length && left > 0; j++) {
        const d = Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]);
        if (d <= left) { octx.lineTo(P[j][0], P[j][1]); left -= d; }
        else { const u = left / d; octx.lineTo(P[j - 1][0] + (P[j][0] - P[j - 1][0]) * u, P[j - 1][1] + (P[j][1] - P[j - 1][1]) * u); left = 0; }
      }
      left -= T.size * 0.12;
    }
    octx.stroke(); octx.globalCompositeOperation = 'source-over';
    ik.restore(); ik.save(); ik.setTransform(1, 0, 0, 1, 0, 0); ik.globalAlpha = alpha; ik.drawImage(OC, 0, 0); ik.restore();
  }
  ik.restore();
}
// a pencil line: fixed jitter per point (seeded) + a small boil (3 drawings); drawn up to prog of its length
function pline(c, pts, prog, w, seed, alpha = 1, col = '#000', dash = null) {
  if (prog <= 0 || pts.length < 2) return;
  const L = plen(pts);
  for (let pass = 0; pass < 2; pass++) {
    c.save(); c.globalAlpha = alpha * (pass ? 0.8 : 1); c.strokeStyle = col; c.lineWidth = w * (pass ? 0.65 : 1); c.lineCap = 'round'; c.lineJoin = 'round';
    if (dash) c.setLineDash(dash);
    c.beginPath(); let rem = prog * L;
    for (let i = 0; i < pts.length; i++) {
      const jx = (hsh(seed, i, pass) - 0.5) * 1.3 + (hsh(seed + 7, i, BOIL + 3 * pass) - 0.5) * 0.7;
      const jy = (hsh(seed + 3, i, pass) - 0.5) * 1.3 + (hsh(seed + 11, i, BOIL + 3 * pass) - 0.5) * 0.7;
      let [x, y] = pts[i];
      if (i) {
        const d = Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
        if (d > rem) { const u = rem / d; x = pts[i - 1][0] + (x - pts[i - 1][0]) * u; y = pts[i - 1][1] + (y - pts[i - 1][1]) * u; c.lineTo(x + jx, y + jy); break; }
        rem -= d; c.lineTo(x + jx, y + jy);
      } else c.moveTo(x + jx, y + jy);
    }
    c.stroke(); c.restore();
  }
}
const curve = (x0, y0, x1, y1, bend, n = 24) => {
  const pts = [], mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
  for (let i = 0; i <= n; i++) { const s = i / n, a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s; pts.push([a * x0 + b * mx + c * x1, a * y0 + b * my + c * y1]); }
  return pts;
};
const seg = (t, a, d) => clamp((t - a) / d, 0, 1);

// labels (few, on purpose): each knows its anchor, its times and how it leaves
const LAB = [], EVX = [], TXT = [];
function addTag({ id, en, zh, at, t0, t1, size = 30, align = 'left', seed }) {
  const TE = textLayout(en, size, seed), TZ = zh ? textLayout(zh, Math.round(size * 1.05), seed + 1) : null;
  const gap = 14, pad = 18, w = TE.tot + (TZ ? gap + TZ.tot + 44 : 0) + pad * 2, h = size + 24;
  const tLine = t0 + 0.06, dLine = 0.28, tEn = t0 + 0.2, dEn = 0.18 + en.length * 0.045, tZh = tEn + dEn + 0.04, dZh = zh ? 0.12 + [...zh].length * 0.13 : 0;
  const rot = (hsh(seed, 1) - 0.5) * 0.04;
  LAB.push({
    id, t0, t1, draw(t) {
      if (t < t0 || t > t1) return null;
      const [ax, ay] = at(t); const x = align === 'right' ? ax - w : ax, y = ay;
      const pop = seg(t, t0, 0.14) * (1 - seg(t, t1 - 0.25, 0.25)), sc = 0.9 + 0.1 * ease5(seg(t, t0, 0.14));
      for (const c of [tg, ik]) { c.save(); c.translate(x + w / 2, y); c.rotate(rot); c.scale(sc, sc); c.translate(-w / 2, 0); }
      tg.globalAlpha = pop; tg.fillStyle = '#fff'; tg.beginPath(); tg.roundRect(0, -h / 2, w, h, 6); tg.fill(); tg.globalAlpha = 1;
      pline(ik, [[0, -h / 2], [w, -h / 2 + 1], [w + 1, h / 2], [0, h / 2 - 1], [0, -h / 2]], seg(t, tLine, dLine), 1.5, seed + 5, 0.7 * pop);
      ik.restore(); tg.restore();
      ik.save(); ik.translate(x + w / 2, y); ik.rotate(rot); ik.translate(-w / 2, 0);
      textDraw(TE, pad, size * 0.36, seg(t, tEn, dEn), pop);
      if (TZ) textDraw(TZ, pad + TE.tot + gap, size * 0.38, seg(t, tZh, dZh), 0.85 * pop);
      ik.restore();
      return { x0: x, y0: y - h / 2, x1: x + w, y1: y + h / 2, text: en + (zh ? ' ' + zh : '') };
    },
  });
  EVX.push({ t: t0, type: 'tag', d: 0.05, at }, { t: tEn, type: 'write', d: dEn, at }, ...(TZ ? [{ t: tZh, type: 'write', d: dZh, at }] : []), { t: tLine, type: 'line', d: dLine, at });
}
function addLeader({ from, to, t0, t1, d = 0.3, bend = 0.25, seed, head = true }) {
  LAB.push({
    t0, t1, draw(t) {
      if (t < t0 || t > t1) return null;
      const a = 1 - seg(t, t1 - 0.25, 0.25);
      const [x0, y0] = from(t), [x1, y1] = to(t);
      const pts = curve(x0, y0, x1, y1, bend), k = seg(t, t0, d);
      tg.save(); tg.globalAlpha = 0.55 * a; pline(tg, pts, k, 9, seed + 1); tg.restore();
      pline(ik, pts, k, 2.8, seed, 0.9 * a);
      if (head && k >= 1) {
        const [ax, ay] = pts[pts.length - 4], an = Math.atan2(y1 - ay, x1 - ax), hl = seg(t, t0 + d, 0.08);
        pline(ik, [[x1 - Math.cos(an - 0.5) * 16, y1 - Math.sin(an - 0.5) * 16], [x1, y1], [x1 - Math.cos(an + 0.5) * 16, y1 - Math.sin(an + 0.5) * 16]], hl, 2.6, seed + 9, 0.9 * a);
      }
      return null;
    },
  });
  EVX.push({ t: t0, type: 'line', d: d + 0.08, at: to });
}
// subtitles: a paper slip, bottom left; Chinese line over the English one, both set straight (they are read, not drawn)
let SUBS = [];
function drawSubs(t) {
  for (const s of SUBS) {
    if (t < s.t0 || t > s.t1 + 0.2) continue;
    const a = seg(t, s.t0, 0.16) * (1 - seg(t, s.t1, 0.2)), wipe = ease5(seg(t, s.t0 + 0.05, 0.28));
    const x = 92, yb = H - 62;
    ik.save(); ik.font = `40px ${FONT}`; const wz = ik.measureText(s.zh).width; ik.font = `29px ${FONT}`; const we = ik.measureText(s.en).width; ik.restore();
    const w = Math.max(wz, we) + 52, h = 112, y = yb - h;
    tg.save(); tg.globalAlpha = 0.93 * a; tg.fillStyle = '#fff';
    tg.beginPath(); tg.moveTo(x, y + 4); tg.lineTo(x + w, y); tg.lineTo(x + w - 3, y + h); tg.lineTo(x + 3, y + h - 3); tg.closePath(); tg.fill(); tg.restore();
    pline(ik, [[x + 3, y + h - 3], [x + w - 3, y + h]], 1, 1.4, 900 + Math.round(s.t0 * 10), 0.5 * a);
    ik.save(); ik.beginPath(); ik.rect(x, y - 20, 26 + (w + 10) * wipe, h + 40); ik.clip();
    ik.globalAlpha = a; ik.fillStyle = '#000'; ik.textBaseline = 'alphabetic';
    ik.font = `40px ${FONT}`; ik.fillText(s.zh, x + 26, y + 50);
    ik.globalAlpha = 0.72 * a; ik.font = `29px ${FONT}`; ik.fillText(s.en, x + 26, y + 92);
    ik.restore();
  }
}

function buildLabels() {
  const P = (v, t) => { setCamera(views(t).main); return proj(v); };
  const L = (v, t) => P(v, t);
  // one label per sentence, timed to the voice, never two at once
  addTag({ id: 'age', en: '120 MILLION YEARS', zh: '一亿两千万年', at: () => [560, 150], t0: 0.18, t1: 2.30, size: 30, seed: 511 });
  addTag({ id: 'today', en: 'THE SAME SHAPE TODAY', zh: '长成今天的样子', at: () => [1010, 150], t0: 2.30, t1: 3.92, size: 29, seed: 515 });
  addTag({ id: 'dorsal', en: 'DORSAL FIN: 3 LOBES', zh: '背鳍 两三瓣', at: () => [1080, 268], t0: 3.92, t1: 4.96, size: 29, seed: 521 });
  addLeader({ from: () => [1080 + 24, 292], to: t => { const p = L(V(FX - 0.92, FY + 0.52, FACE), t); return [p[0] + 8, p[1] - 8]; }, t0: 4.06, t1: 4.96, bend: 0.16, seed: 522 });
  addTag({ id: 'anal', en: 'ANAL FIN: 2 LOBES', zh: '臀鳍 也分开', at: () => [1080, 396], t0: 4.96, t1: 5.94, size: 29, seed: 531 });
  addLeader({ from: () => [1080 + 22, 420], to: t => { const p = L(V(FX + 0.66, FY - 0.40, FACE), t); return [p[0] + 8, p[1] + 8]; }, t0: 5.10, t1: 5.94, bend: -0.16, seed: 532 });
  addTag({ id: 'slow', en: 'SLOW — NOT BUILT FOR SPEED', zh: '这种体型游不快', at: () => [150, 286], t0: 5.94, t1: 7.04, size: 29, seed: 541 });
  addLeader({ from: () => [150 + 22, 310], to: t => { const p = L(V(FX + 1.72, FY + 0.16, FACE), t); return [p[0] - 8, p[1] + 6]; }, t0: 6.08, t1: 7.04, bend: 0.2, seed: 542 });
  addTag({ id: 'tuna', en: 'TUNA: A TORPEDO', zh: '金枪鱼 跟鱼雷似的', at: () => [150, 232], t0: 7.04, t1: 8.36, size: 29, seed: 551 });
  addTag({ id: 'route', en: 'THE OTHER ROUTE', zh: '它走的是另一条路线', at: () => [150, 500], t0: 8.36, t1: 9.90, size: 29, seed: 561 });
  addTag({ id: 'school', en: 'IN COLUMNS, LIKE ANTS', zh: '兵蚁一样推过去', at: () => [1010, 190], t0: 10.46, t1: 12.98, size: 29, seed: 571 });
  addTag({ id: 'barren', en: 'NOTHING LEFT BEHIND', zh: '寸草不生', at: () => [1010, 300], t0: 12.98, t1: 14.50, size: 29, seed: 581 });
  addTag({ id: 'chew', en: 'ALWAYS CHEWING', zh: '那张嘴永远在嚼', at: () => [1150, 232], t0: 14.50, t1: 15.98, size: 29, seed: 591 });
  addLeader({ from: () => [1150 + 18, 256], to: t => { const p = L(V(FX - 1.50, FY - 0.10, FACE), t); return [p[0] + 10, p[1] - 6]; }, t0: 14.64, t1: 15.98, bend: -0.18, seed: 592 });
  addTag({ id: 'own', en: 'IT EATS ITS OWN YOUNG', zh: '连同类小鳕鱼都吃', at: () => [1150, 348], t0: 15.98, t1: 17.30, size: 29, seed: 601 });
  addTag({ id: 'odd', en: 'HOW ODD IS THAT', zh: '它有多变态', at: () => [150, 232], t0: 17.30, t1: 18.26, size: 29, seed: 611 });
  addTag({ id: 'roe', en: '5,000,000 EGGS AT ONCE', zh: '一次产五百万枚卵', at: () => [150, 320], t0: 18.26, t1: 19.94, size: 29, seed: 621 });
  addLeader({ from: () => [150 + 20, 344], to: t => { const p = L(V(FX + 1.6, FY - 1.3, FZ - 0.4), t); return [p[0] - 10, p[1] - 6]; }, t0: 18.40, t1: 19.94, bend: 0.2, seed: 622 });
  addTag({ id: 'grow', en: '70 DAYS · 40× BIGGER', zh: '七十天 长大四十倍', at: () => [1010, 400], t0: 19.94, t1: 22.28, size: 29, seed: 631 });
  addTag({ id: 'two', en: 'TWO METRES', zh: '两米长', at: t => { const p = L(BAR2.a, t); return [p[0] - 130, p[1] - 46]; }, t0: 22.32, t1: 24.20, size: 30, seed: 641 });
  // STABLE (S8): one word, drawn big
  {
    const TE = textLayout('STABLE', 96, 71, { jit: 0.5 }), TZ = textLayout('稳定', 54, 72, { jit: 0.5 });
    const t0 = 9.90, dEn = 0.55, tZh = t0 + 0.62;
    LAB.push({ id: 'stable', t0, t1: 10.46, draw(t) {
      if (t < t0 || t > 10.46) return null;
      textDraw(TE, 150, 300, seg(t, t0, dEn));
      textDraw(TZ, 156, 386, seg(t, tZh, 0.4), 0.82);
      return { x0: 150, y0: 220, x1: 150 + TE.tot, y1: 400, text: 'STABLE 稳定' };
    } });
    EVX.push({ t: t0, type: 'write', d: dEn, at: () => [300, 0] }, { t: tZh, type: 'write', d: 0.4, at: () => [300, 0] });
  }
  // S17 takes over the end card: the numbers the voice ends on
  {
    const TA = textLayout('1.5 M', 78, 81, { jit: 0.5 }), TB = textLayout('80 KG', 78, 82, { jit: 0.5 });
    const TZ = textLayout('一米五 八十多公斤', 40, 83, { jit: 0.5 });
    const t0 = TL.bar15 + 0.10;
    LAB.push({ id: 'end', t0, t1: FILM + 0.2, draw(t) {
      if (t < t0) return null;
      const x = 110, y = 470, a = 1;
      ik.save(); ik.globalAlpha = a;
      textDraw(TA, x, y, seg(t, t0, 0.5));
      textDraw(TB, x + TA.tot + 40, y, seg(t, t0 + 0.34, 0.5));
      textDraw(TZ, x + 4, y + 78, seg(t, t0 + 0.7, 0.6), 0.8);
      ik.restore();
      return { x0: x, y0: y - 80, x1: x + TA.tot + TB.tot + 40, y1: y + 110, text: '1.5 M 80 KG' };
    } });
    EVX.push({ t: t0, type: 'write', d: 0.5, at: () => [300, 0] }, { t: t0 + 0.34, type: 'write', d: 0.5, at: () => [500, 0] }, { t: t0 + 0.7, type: 'write', d: 0.6, at: () => [300, 0] });
  }
}
function drawRing(ir) {
  if (!ir || ir.ringA <= 0.01) return;
  const n = 140, pts = [], pts2 = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI * 0.6 + i / n * Math.PI * 2; pts.push([ir.cx + Math.cos(a) * ir.r, ir.cy + Math.sin(a) * ir.r]); pts2.push([ir.cx + Math.cos(a + 0.05) * (ir.r + 7), ir.cy + Math.sin(a + 0.05) * (ir.r + 7)]); }
  tg.save(); tg.globalAlpha = 0.5 * ir.ringA; pline(tg, pts, ir.ring, 12, 301); tg.restore();
  pline(ik, pts, ir.ring, 3.2, 311, 0.95 * ir.ringA);
  pline(ik, pts2, ir.ring, 1.6, 321, 0.55 * ir.ringA);
}
function drawOverlay(t, ir) {
  for (const c of [tg, ik, cl]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); }
  TXT.length = 0;
  for (const el of LAB) { const r = el.draw(t); if (r && r.x1 > 0 && r.x0 < W && r.y1 > 0 && r.y0 < H) TXT.push({ id: el.id || 'q', ...r }); }
  drawRing(ir);
  drawSubs(t);
  tagT.needsUpdate = true; inkT.needsUpdate = true; colT.needsUpdate = true;
}
const POST_FS = /* glsl */`
uniform sampler2D tA, tL, tD, tR, tFoc; uniform vec2 uRes, uRdC; uniform float uSS, uTime, uBoil, uRdT, uRdK;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n*17.31+3.7)); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=0.5; } return s; }
// paper tooth: fine grain + laid fibres + soft cockling
float tooth(vec2 p){
  float a = vn(p*0.68);
  vec2 q = mat2(0.94,-0.34,0.34,0.94)*p;
  float b = vn(q*vec2(0.11,0.85));
  float c = vn(p*0.23+3.1);
  return clamp(0.48*a + 0.3*b + 0.22*c, 0.0, 1.0);
}
float cov(float pr, float t){ return smoothstep(t-0.17, t+0.17, pr); }
float ramp(float e, float a, float b){ return clamp((e-a)/(b-a), 0.0, 1.0); }
// one pencil layer: patches of short parallel strokes, each patch slightly re-angled.
// amt (0..1) = how much of the layer has been drawn so far: each stroke has its own turn.
float hatch(vec2 p, float ang, float sp, float cs, float seed, float jit, float amt){
  if(amt <= 0.0) return 0.0;
  vec2 g = floor(p/cs); float acc = 0.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 c = g + vec2(float(i), float(j)); vec2 h = h22(c + seed*7.13);
    vec2 ctr = (c + 0.15 + 0.7*h)*cs;
    float a0 = ang + (h.x-0.5)*jit;
    vec2 d = vec2(cos(a0), sin(a0)), n = vec2(-d.y, d.x);
    vec2 q = p - ctr; float u = dot(q,d), v = dot(q,n);
    v += u*u*(h.y-0.5)*0.006;
    float w = 1.0 - smoothstep(cs*0.45, cs*0.92, length(q));
    float k = floor(v/sp), f = fract(v/sp);
    float r = h21(vec2(k, dot(c, vec2(7.0,13.0)) + seed));
    float r2 = h21(vec2(k*1.7 + seed, c.x - c.y*3.0));
    if(amt < 1.0){ float turn = h21(vec2(k*0.61 + seed*3.3, dot(c, vec2(3.1, 5.7)))); w *= step(turn, amt); }
    float L = cs*(0.75 + 0.7*r);
    float uu = u - (r2-0.5)*cs*0.7;
    float taper = smoothstep(-L*0.5, -L*0.5 + L*0.2, uu) * (1.0 - smoothstep(L*0.5 - L*0.3, L*0.5, uu));
    float hw = sp*(0.26 + 0.2*r2);
    float dd = abs(f-0.5)*sp;
    float prof = 1.0 - smoothstep(hw-0.55, hw+0.55, dd);
    float press = (0.72 + 0.28*r) * (0.85 + 0.15*sin(uu*0.08 + r*6.0));
    acc = max(acc, w*prof*taper*press);
  }
  return acc;
}
vec4 gA(vec2 uv){ return texture2D(tA, uv); }
void main(){
  vec2 p = gl_FragCoord.xy / uSS;              // output-pixel coordinates (y up), fixed to the screen
  vec4 A = gA(vUv), Lb = texture2D(tL, vUv), Db = texture2D(tD, vUv), Rb = texture2D(tR, vUv);
  float id = floor(A.a*255.0 + 0.5);
  vec3 alb = A.rgb; float light = Lb.r, vz = Lb.g;
  float ang = atan(Db.g*2.0-1.0, Db.r*2.0-1.0)*0.5;
  float ow = Db.b, dens = Db.a;
  float yN = vUv.y;
  vec2 pa = p; float ev = 100.0;                // anchor coords (strokes stick to surfaces) and time since this surface was drawn
  if(id > 0.5){ pa = Rb.rg; ev = uTime - Rb.b; }
  if(uRdT > -50.0) ev = min(ev, uTime - (uRdT + uRdK*length(p - uRdC)));   // a fresh drawing (the magnifier) spreads out from its centre
  float fo = texture2D(tFoc, vec2((id + 0.5)/32.0, 0.5)).r;            // focus: 1 = fully drawn, lower = a light wash behind
  // things that grow in (roots, worms, stones, hyphae, leaves) arrive already half coloured and finish fast,
  // so the growing tip never reads as a blank white stick on the soil
  if(id > 10.5 && id < 21.5 && id != 14.0 && id != 16.0 && id != 17.0 && id != 19.0) ev = ev*2.2 + 0.32;
  if(id < 0.5){                                 // sky: loose blue wash, clouds left as paper
    float cl = smoothstep(0.52, 0.72, fbm(p*vec2(0.0032, 0.008) + vec2(2.0, 5.0)));
    alb = mix(vec3(0.70,0.83,0.90), vec3(0.42,0.63,0.86), smoothstep(0.72, 1.0, yN));
    alb = mix(alb, vec3(0.97,0.96,0.93), cl*0.85);
    light = 0.93; ang = 0.32; ow = 0.0; dens = 0.85*(1.0 - cl*0.75); vz = 0.0;
  }
  float t = tooth(pa);
  alb = mix(mix(vec3(dot(alb, vec3(0.333))), alb, 0.6)*0.35 + vec3(0.62), alb, mix(0.25, 1.0, fo));
  dens *= mix(0.55, 1.0, fo);
  float lum = dot(alb, vec3(0.299, 0.587, 0.114));
  float dark = clamp(1.0 - light, 0.0, 1.0);
  float fog = smoothstep(22.0, 150.0, vz)*0.6;
  vec3 paper = vec3(0.972, 0.955, 0.918) * (0.965 + 0.035*fbm(p*0.006));
  alb = mix(alb, vec3(0.74, 0.82, 0.84), fog*0.35);
  dark *= 1.0 - fog*0.6;
  vec3 pig = clamp(sqrt(alb/paper), 0.0, 1.0);
  vec3 col = paper;
  float hi = smoothstep(0.78, 0.98, light);
  // how far each of the four layers has been drawn on this surface
  float r0 = ramp(ev, 0.0, 0.42), r1 = ramp(ev, 0.10, 0.62)*mix(0.6, 1.0, fo), r2 = ramp(ev, 0.30, 0.90)*fo, r3 = ramp(ev, 0.50, 1.15)*fo*fo;
  vec2 bq = mat2(0.8,-0.6,0.6,0.8)*pa;
  float g0 = smoothstep(0.0, 0.14, r0*1.2 - vn(bq*vec2(0.03, 0.11)));
  // L0 underlayer: soft side-of-the-lead fill
  float c0 = cov((0.52 + 0.28*(1.0-lum) - 0.22*hi) * dens * (1.0 - 0.25*fog), t) * g0;
  col *= mix(vec3(1.0), pig, c0);
  // L1 local colour, strokes along the hatch direction
  float h1 = hatch(pa, ang, 4.4, 40.0, 1.0, 0.55, r1);
  float c1 = cov(h1 * (0.82 + 0.4*(1.0-lum) - 0.25*hi) * dens * (1.0 - 0.35*fog), t*0.92);
  col *= mix(vec3(1.0), pig, c1);
  // L2 shading: cross strokes in a darker, cooler version of the colour
  vec3 sh = clamp(alb*alb*vec3(0.95, 0.92, 1.08) + vec3(0.0, 0.0, 0.03), 0.0, 1.0);
  float h2 = hatch(pa, ang + 1.0, 3.8, 34.0, 2.0, 0.6, r2);
  float c2 = cov(h2 * smoothstep(0.1, 0.6, dark) * 1.3 * dens, t);
  col *= mix(vec3(1.0), sqrt(sh), c2);
  // L3 deepest accents: sepia/indigo, a third angle
  float h3 = hatch(pa, ang - 0.55, 3.2, 26.0, 3.0, 0.4, r3);
  float c3 = cov(h3 * smoothstep(0.42, 0.85, dark) * 1.15 * dens, t*1.05);
  col *= mix(vec3(1.0), mix(vec3(0.46, 0.36, 0.34), vec3(0.36, 0.38, 0.5), 0.35), c3);

  // contour lines: id / depth / normal breaks, sampled through a wobble anchored to the surface,
  // plus a small boil (a new drawing every 2 frames, 3 drawings cycled)
  vec2 px = 1.0/uRes;
  vec2 bo = vec2(uBoil*3.7, uBoil*1.9);
  vec2 wob = (vec2(vn(pa*0.045), vn(pa*0.045 + 9.3)) - 0.5) * 2.0 + (vec2(vn(pa*0.07 + bo), vn(pa*0.07 + 5.1 + bo)) - 0.5) * 1.5;
  vec2 uv0 = vUv + wob*uSS*px;
  vec4 A0 = gA(uv0), L0 = texture2D(tL, uv0); float ow0 = texture2D(tD, uv0).b;
  float id0 = floor(A0.a*255.0 + 0.5);
  float e = 0.0;
  for(int k=0;k<4;k++){
    vec2 o = k==0 ? vec2(1,0) : k==1 ? vec2(-1,0) : k==2 ? vec2(0,1) : vec2(0,-1);
    vec2 uv1 = uv0 + o*1.25*uSS*px;
    vec4 A1 = gA(uv1), L1 = texture2D(tL, uv1); float ow1 = texture2D(tD, uv1).b;
    float id1 = floor(A1.a*255.0 + 0.5);
    float de = step(0.5, abs(id1 - id0));
    float z0 = max(L0.g, 1e-3), z1 = max(L1.g, 1e-3);
    if(id0 < 0.5) z0 = 400.0; if(id1 < 0.5) z1 = 400.0;
    de = max(de, smoothstep(0.012, 0.035, abs(z1 - z0)/min(z0, z1)));
    de = max(de, 0.6*smoothstep(0.35, 0.75, length(L1.ba - L0.ba)*2.0));
    float wgt = (z1 < z0) ? ow1 : ow0;     // the nearer surface owns the line
    e = max(e, de * wgt);
  }
  // lines appear with their surface; soil horizons are pencilled in faintly from the start
  float ev0 = id0 > 0.5 ? uTime - texture2D(tR, uv0).b : 100.0;
  if(uRdT > -50.0) ev0 = min(ev0, uTime - (uRdT + uRdK*length(p - uRdC)) + 0.1);
  float fo0 = texture2D(tFoc, vec2((id0 + 0.5)/32.0, 0.5)).r;
  float lg = smoothstep(0.0, 0.12, ramp(ev0, -0.05, 0.3)*1.15 - vn(pa*0.035 + 2.0));
  if(id0 > 5.5 && id0 < 10.5) lg = max(lg, 0.4);
  e *= lg * (1.0 - fog*0.55) * mix(0.3, 1.0, fo0);
  vec3 lineCol = mix(alb*0.32, vec3(0.20, 0.14, 0.11), 0.55);
  float lc = cov(e * (0.62 + 0.38*vn(pa*0.11 + 4.0)), t*0.72);
  col *= mix(vec3(1.0), lineCol, lc*0.82);

  float lu = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(lu), col, 1.12), 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
const COMP_FS = /* glsl */`
uniform sampler2D tV1, tV2, tTag, tInk, tCol; uniform vec4 uIris; uniform vec2 uLabOff; uniform float uSS, uLabS;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float tooth(vec2 p){
  float a = vn(p*0.68); vec2 q = mat2(0.94,-0.34,0.34,0.94)*p; float b = vn(q*vec2(0.11,0.85)); float c = vn(p*0.23+3.1);
  return clamp(0.48*a + 0.3*b + 0.22*c, 0.0, 1.0);
}
float cov(float pr, float t){ return smoothstep(t-0.17, t+0.17, pr); }
void main(){
  vec2 p = gl_FragCoord.xy / uSS;                         // output pixels, y up
  vec3 col = texture2D(tV1, vUv).rgb;
  if(uIris.w > 0.5){                                      // the magnifier: inside the ring, the other view
    vec2 c = vec2(uIris.x, ${H}.0 - uIris.y);
    float d = length(p - c);
    col = mix(texture2D(tV2, vUv).rgb, col, smoothstep(uIris.z - 0.8, uIris.z + 0.8, d));
  }
  vec2 pl = p*uLabS + uLabOff; float tl = tooth(pl);
  // coloured pencil (amber path), paper (tags, slips, halos), graphite (writing, lines)
  vec4 cc = texture2D(tCol, vUv);
  if(cc.a > 0.0) col *= mix(vec3(1.0), cc.rgb/max(cc.a, 1e-3), cc.a*(0.75 + 0.25*cov(0.85, tl)));
  float tag = texture2D(tTag, vUv).a, ink = texture2D(tInk, vUv).a;
  if(tag + ink > 0.0){
    vec3 tp = vec3(0.975, 0.95, 0.88) * (0.955 + 0.045*tl);
    col = mix(col, tp, tag);
    col *= mix(vec3(1.0), vec3(0.22, 0.17, 0.14), ink * (0.82 + 0.18*cov(0.8, tl*0.6)));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const qScene = new THREE.Scene(); qScene.add(quad);
const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const QVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const focData = new Float32Array(32 * 4), focTex = new THREE.DataTexture(focData, 32, 1, THREE.RGBAFormat, THREE.FloatType);
focTex.minFilter = focTex.magFilter = THREE.NearestFilter;
const postMat = new THREE.ShaderMaterial({
  vertexShader: QVS, fragmentShader: POST_FS,
  uniforms: { tA: { value: rtA.texture }, tL: { value: rtL.texture }, tD: { value: rtD.texture }, tR: { value: rtR.texture }, tFoc: { value: focTex },
    uRes: { value: new THREE.Vector2(IW, IH) }, uSS: { value: SS }, uTime: SHARED.uTime, uBoil: { value: 0 },
    uRdT: { value: -100 }, uRdC: { value: new THREE.Vector2() }, uRdK: { value: 0 } },
});
const compMat = new THREE.ShaderMaterial({
  vertexShader: QVS, fragmentShader: COMP_FS,
  uniforms: { tV1: { value: rtP1.texture }, tV2: { value: rtP2.texture }, tTag: { value: tagT }, tInk: { value: inkT }, tCol: { value: colT },
    uIris: { value: new THREE.Vector4() }, uLabOff: { value: new THREE.Vector2() }, uLabS: { value: 1 }, uSS: { value: SS } },
});
const downMat = new THREE.ShaderMaterial({
  vertexShader: QVS, uniforms: { tP: { value: rtC.texture }, uPx: { value: new THREE.Vector2(1 / IW, 1 / IH) } },
  fragmentShader: `uniform sampler2D tP; uniform vec2 uPx; varying vec2 vUv;
  void main(){ vec3 c = texture2D(tP, vUv).rgb*0.5 + 0.125*(texture2D(tP, vUv+vec2(uPx.x*1.5,0.)).rgb + texture2D(tP, vUv-vec2(uPx.x*1.5,0.)).rgb + texture2D(tP, vUv+vec2(0.,uPx.y*1.5)).rgb + texture2D(tP, vUv-vec2(0.,uPx.y*1.5)).rgb);
  gl_FragColor = vec4(c, 1.0); }`,
});

// ---------------------------------------------------------------- render
function pass(n, rt, clear) {
  SHARED.uPass.value = n;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(new THREE.Color(clear[0], clear[1], clear[2]), clear[3]);
  renderer.clear(true, true, true);
  renderer.render(scene, camera);
}
function renderView(v, out) {
  setCamera(v);
  const hide = v.hide || [];
  for (const o of scene.children) if (!o.userData.grain) o.visible = !hide.includes(o.material.uniforms.uId.value);
  focData.fill(1); for (const [k, f] of Object.entries(v.focus || {})) focData[+k * 4] = f;
  focTex.needsUpdate = true;
  const rd = v.redraw; postMat.uniforms.uRdT.value = rd ? rd.t : -100;
  if (rd) { postMat.uniforms.uRdC.value.set(rd.cx, H - rd.cy); postMat.uniforms.uRdK.value = rd.k; }
  pass(0, rtA, [0, 0, 0, 0]);
  pass(1, rtL, [1, 400, 0.5, 0.5]);
  pass(2, rtD, [Math.cos(0.64) * 0.5 + 0.5, Math.sin(0.64) * 0.5 + 0.5, 0, 0.6]);
  pass(3, rtR, [0, 0, -100, 0]);
  const dbg = QS.get('dbg');
  if (dbg) { quad.material = downMat; downMat.uniforms.tP.value = [rtA, rtL, rtD, rtR][+dbg].texture; renderer.setRenderTarget(out); renderer.render(qScene, qCam); downMat.uniforms.tP.value = rtC.texture; return; }
  quad.material = postMat; renderer.setRenderTarget(out); renderer.render(qScene, qCam);
}
function labelTooth(v) {                      // paper tooth for overlay marks: the page plane seen by the reference vs the current camera
  setCamera(v);
  const P0 = V(camera.position.x, camera.position.y, 0.3), P1 = P0.clone().add(V(1, 1, 0));
  const a0 = P0.clone().project(refCam), b0 = P0.clone().project(camera), a1 = P1.clone().project(refCam), b1 = P1.clone().project(camera);
  const sc = (a1.x - a0.x) / (b1.x - b0.x);
  compMat.uniforms.uLabS.value = sc;
  compMat.uniforms.uLabOff.value.set((a0.x * 0.5 + 0.5) * W - sc * (b0.x * 0.5 + 0.5) * W, (a0.y * 0.5 + 0.5) * H - sc * (b0.y * 0.5 + 0.5) * H);
}
function renderFilm(t) {
  const f = Math.round(t * FPS); BOIL = Math.floor(f / 2) % 3;
  postMat.uniforms.uBoil.value = BOIL;
  const only = QS.get('only'); if (only) scene.children.forEach(o => o.visible = only.split(',').includes(String(o.material.uniforms.uId.value)));
  const tt = QS.get('all') ? 100 : t;
  SHARED.uTime.value = tt;
  SHARED.uWindT.value = Math.floor(t * 12) / 12;
  placeGrains(t);
  const vs = views(t);
  renderView(vs.main, rtP1);
  if (vs.inset) renderView(vs.inset, rtP2);
  const ir = vs.iris;
  compMat.uniforms.uIris.value.set(ir ? ir.cx : 0, ir ? ir.cy : 0, ir ? ir.r : 0, ir && ir.inner && vs.inset ? 1 : 0);
  drawOverlay(tt, ir);
  labelTooth(ir && ir.inner && ir.r > 900 ? vs.inset : vs.main);
  quad.material = compMat; renderer.setRenderTarget(rtC); renderer.render(qScene, qCam);
  quad.material = downMat; downMat.uniforms.tP.value = rtC.texture; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  setCamera(vs.main);
}
window.DUR = TO - FROM;
window.render = (tl) => renderFilm(FROM + tl);
window.TEXTS = (tl) => { renderFilm(FROM + tl); return TXT.map(x => ({ id: x.id, text: x.text, x0: x.x0, y0: x.y0, x1: x.x1, y1: x.y1 })); };
window.SHOTS = SHOTS; window.LAB = LAB;
(async () => {
  try { await document.fonts.load(`40px ${FONT}`, '一亿两千万年'); } catch (e) { }
  GLY = await (await fetch('glyphs.json')).json();
  const SUBS0 = [
    { id: 'c1', t0: 0.00, t1: 2.14, zh: '科学家推算 大约一亿两千万年前', en: 'Palaeontologists date it to about 120 million years ago.', d: 2.14 },
    { id: 'c2', t0: 2.14, t1: 3.86, zh: '它就长成了今天的样子', en: 'It had already taken the shape it has today.', d: 1.72 },
    { id: 'c3', t0: 3.86, t1: 4.94, zh: '背鳍分开两三瓣', en: 'The dorsal fin splits into two or three lobes.', d: 1.08 },
    { id: 'c4', t0: 4.94, t1: 5.92, zh: '臀鳍也分开', en: 'So does the anal fin.', d: 0.98 },
    { id: 'c5', t0: 5.92, t1: 7.02, zh: '这种体型游不快', en: 'Built like this, it cannot swim fast.', d: 1.10 },
    { id: 'c6', t0: 7.02, t1: 8.34, zh: '跟鱼雷似的金枪鱼比', en: 'Next to a torpedo of a tuna —', d: 1.32 },
    { id: 'c7', t0: 8.34, t1: 9.88, zh: '它走的是另一条路线', en: 'it took a different route.', d: 1.54 },
    { id: 'c8', t0: 9.88, t1: 10.42, zh: '稳定', en: 'Stability.', d: 0.54 },
    { id: 'c9', t0: 10.42, t1: 12.96, zh: '一大群鳕鱼在深海里 像兵蚁一样推过去', en: 'In deep water a whole school ploughs on, like columns of ants.', d: 2.54 },
    { id: 'c10', t0: 12.96, t1: 14.48, zh: '经过的地方寸草不生', en: 'Nothing is left where it has been.', d: 1.52 },
    { id: 'c11', t0: 14.48, t1: 15.96, zh: '那张嘴永远在嚼', en: 'That mouth never stops chewing.', d: 1.48 },
    { id: 'c12', t0: 15.96, t1: 17.28, zh: '连同类小鳕鱼都吃', en: 'It eats even its own young.', d: 1.32 },
    { id: 'c13', t0: 17.28, t1: 18.24, zh: '它有多变态', en: 'How far does that go?', d: 0.96 },
    { id: 'c14', t0: 18.24, t1: 19.92, zh: '雌鱼一次产五百万枚卵', en: 'A female releases five million eggs at once.', d: 1.68 },
    { id: 'c15', t0: 19.92, t1: 22.26, zh: '孵化七十天 就能长大四十倍', en: 'Hatched in seventy days, they grow forty times bigger.', d: 2.34 },
    { id: 'c16', t0: 22.26, t1: 24.20, zh: '欧洲渔民曾捕到两米长的', en: 'European fishermen once took two-metre fish.', d: 1.94 },
    { id: 'c17', t0: 24.20, t1: 26.94, zh: '现在还能捞到一米五、八十多公斤的大家伙', en: 'Even now they land one-metre-fifty, eighty-kilo monsters.', d: 2.74 },
  ];
  SUBS = SUBS0;
  buildLabels();
  const EV = [];
  const panAt = (t, at) => { const x = at(t)[0]; return clamp(x / W * 2 - 1, -1, 1); };
  for (const e of EVX) EV.push({ t: e.t, type: e.type, d: e.d, pan: +panAt(e.t + e.d / 2, e.at).toFixed(3) });
  for (const [k, r] of Object.entries(REV)) for (let i = 0; i < 4; i++)
    EV.push({ t: +(r[0] + r[1] * i / 4).toFixed(3), type: 'color', d: +(r[1] / 4 + 0.45).toFixed(3), pan: +(-0.7 + 1.4 * (i + 0.5) / 4).toFixed(3), layer: k });
  EV.push({ t: TL.fish[0], type: 'line', d: 1.0, pan: 0.3 }, { t: TL.fish[0] + 0.55, type: 'color', d: 1.2, pan: 0.35 },
    { t: TL.dorsal, type: 'line', d: 0.5, pan: 0.32 }, { t: TL.anal, type: 'line', d: 0.4, pan: 0.32 },
    { t: TL.school[0], type: 'color', d: 0.9, pan: -0.5 }, { t: TL.roe[0], type: 'color', d: 1.2, pan: -0.1 },
    { t: TL.grow, type: 'line', d: 0.6, pan: 0.2 }, { t: TL.bar2, type: 'line', d: 0.4, pan: 0 }, { t: TL.bar15, type: 'write', d: 0.8, pan: -0.4 });
  for (const s of SUBS) EV.push({ t: s.t0, type: 'vo', id: s.id, d: s.d }, { t: s.t0, type: 'sub', t1: s.t1, zh: s.zh, en: s.en });
  for (const s of SHOTS) EV.push({ t: s[0], type: 'shot', id: s[1] });
  for (let t = 0; t <= FILM; t += 0.1) { const v = views(t); EV.push({ t: +t.toFixed(2), type: 'cam', y: +v.main.pos.y.toFixed(4), z: +v.main.pos.z.toFixed(3), close: v.main.pos.z < 3 ? 1 : 0 }); }
  EV.sort((a, b) => a.t - b.t);
  window.FILMEV = EV;
  window.EV = EV.filter(e => e.t >= FROM - 2 && e.t < TO).map(e => ({ ...e, t: +(e.t - FROM).toFixed(4), ...(e.t1 != null ? { t1: +(e.t1 - FROM).toFixed(4) } : {}) }));
  renderFilm(FROM);
  window.READY = true;
})();
