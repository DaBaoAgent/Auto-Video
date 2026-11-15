// film.js: 扁平尺度漫游模板 — 僵尸地球第一段 (0–35.7s)
// 从苏梅克-列维9号撞木星，一路缩放/追溯到海王星外的西柚大黑洞。
// 改这个文件来做新片：替换 VO 数组和每个场景的 if 块。

const S0 = [W/2, H/2];

// ---------- easing ----------
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp = (a,b,k)=>a+(b-a)*k;
const seg = (t,a,b)=>clamp((t-a)/(b-a));
const eio = k=>{k=clamp(k);return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;};
const eo = k=>1-Math.pow(1-clamp(k),3);
const ei = k=>Math.pow(clamp(k),3);
const spr = (t,t0,w=16,d=8)=>{const x=t-t0;return x<=0?0:1-Math.exp(-d*x)*(Math.cos(w*x)+(d/w)*Math.sin(w*x));};
const ebump = (t,a,b,c,d)=>eio(seg(t,a,b))*(1-eio(seg(t,c,d)));
function kf(t,keys){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const[t0,v0]=keys[i-1],[t1,v1]=keys[i];return lerp(v0,v1,eio((t-t0)/(t1-t0)));}return keys[keys.length-1][1];}
const blink=(t,t0)=>eio(seg(t,t0,t0+0.07))*(1-eio(seg(t,t0+0.11,t0+0.22)));

// ---------- 文字辅助 ----------
const MEAS={};
function measure(str,a){const key=str+JSON.stringify(a);if(MEAS[key]==null){const tx=el('text',{x:0,y:-999,...a});tx.textContent=str;MEAS[key]=tx.getComputedTextLength();tx.remove();}return MEAS[key];}
function wipeText(p,x,y,str,a,k,h=60){if(k<=0)return;const w=measure(str,a),x0=a['text-anchor']==='end'?x-w:a['text-anchor']==='middle'?x-w/2:x;const G=g(p,{'clip-path':clipOf('rect',{x:r1(x0-8),y:r1(y-h),width:r1((w+16)*clamp(k)),height:r1(h*1.45)})});return text(G,x,y,str,a);}

// ============================================================
// 场景原语
// ============================================================
function drawJupiter(p, x, y, R, t) {
  halo(p, x, y, R+30, R+70);
  shaded(p, 'circle', {cx:x, cy:y, r:R}, C.cream, C.creamD, R*0.06, R*0.05);
  const G = g(p, {'clip-path':clipOf('circle',{cx:x,cy:y,r:R})});
  const bands = [
    [-0.55, 0.10, C.creamD], [-0.35, 0.14, C.cream],
    [-0.12, 0.18, C.creamD], [0.12, 0.12, C.cream],
    [0.32, 0.16, C.creamD], [0.55, 0.10, C.cream]
  ];
  for (const [dy, h, col] of bands) {
    el('rect', {x:r1(x-R), y:r1(y+dy*R-h*R/2), width:r1(2*R), height:r1(h*R), fill:col}, G);
  }
  el('ellipse', {cx:r1(x+R*0.32), cy:r1(y+R*0.22), rx:r1(R*0.18), ry:r1(R*0.10), fill:C.coral}, G);
  el('ellipse', {cx:r1(x+R*0.32), cy:r1(y+R*0.22), rx:r1(R*0.11), ry:r1(R*0.06), fill:C.coralD}, G);
}

function drawEarth(p, x, y, R, seed = 5) {
  const G = g(p, {'clip-path':clipOf('circle',{cx:x,cy:y,r:R})});
  el('circle', {cx:x, cy:y, r:R, fill:C.blue}, G);
  const Rr = rng(seed);
  const lands = [
    [-R*0.30, -R*0.25, R*0.22, 8],
    [R*0.20, -R*0.40, R*0.14, 6],
    [R*0.25, R*0.15, R*0.20, 7],
    [-R*0.35, R*0.30, R*0.13, 5],
    [R*0.05, R*0.45, R*0.11, 5]
  ];
  for (const [dx, dy, lr, n] of lands) {
    const pts = polar(x+dx, y+dy, n, a => lr*(0.75+0.4*Rr()));
    el('path', {d:blobPath(pts), fill:C.mint}, G);
  }
  el('circle', {cx:x+R*0.10, cy:y+R*0.10, r:R, fill:C.blueD, opacity:0.30}, G);
}

function drawSun(p, x, y, r) {
  halo(p, x, y, r*2.2, r*3.5);
  el('circle', {cx:x, cy:y, r:r, fill:C.sun}, p);
  el('circle', {cx:r1(x-r*0.15), cy:r1(y-r*0.15), r:r*0.6, fill:C.cream}, p);
}

function drawBlackHole(p, x, y, r) {
  el('circle', {cx:x, cy:y, r:r*2.4, fill:C.n2}, p);
  el('circle', {cx:x, cy:y, r:r*1.8, fill:C.n3}, p);
  el('circle', {cx:x, cy:y, r:r*1.4, fill:C.mint}, p);
  el('circle', {cx:x, cy:y, r:r*1.12, fill:C.night}, p);
  el('circle', {cx:x, cy:y, r:r, fill:'#080920'}, p);
}

function drawGrapefruit(p, x, y, r) {
  shaded(p, 'circle', {cx:x, cy:y, r:r}, C.coral, C.coralD, r*0.12, r*0.10);
  el('path', {d:`M${x},${y-r*0.3}L${x},${y+r*0.3}`, stroke:C.coralD, 'stroke-width':r*0.05}, p);
  el('path', {d:`M${x-r*0.7},${y-r*0.25}L${x+r*0.7},${y+r*0.25}`, stroke:C.coralD, 'stroke-width':r*0.05}, p);
  el('path', {d:`M${x-r*0.7},${y+r*0.25}L${x+r*0.7},${y-r*0.25}`, stroke:C.coralD, 'stroke-width':r*0.05}, p);
  el('rect', {x:r1(x-r*0.06), y:r1(y-r*1.15), width:r1(r*0.12), height:r1(r*0.22), rx:r1(r*0.05), fill:C.mintD}, p);
}

function mushroomCloud(p, x, y, s, col) {
  el('rect', {x:r1(x-s*0.10), y:r1(y-s*0.1), width:r1(s*0.20), height:r1(s*0.4), rx:r1(s*0.05), fill:col}, p);
  el('ellipse', {cx:x, cy:r1(y-s*0.2), rx:r1(s*0.45), ry:r1(s*0.30), fill:col}, p);
  el('circle', {cx:r1(x-s*0.22), cy:r1(y-s*0.32), r:r1(s*0.20), fill:col}, p);
  el('circle', {cx:r1(x+s*0.22), cy:r1(y-s*0.32), r:r1(s*0.18), fill:col}, p);
}

function starLayer(p, seed, n) {
  stars(p, seed, n);
  const R = rng(seed+100);
  for (let i=0;i<n*0.4;i++){
    const x=-200+R()*(W+400), y=-150+R()*(H+300), k=R();
    el('circle',{cx:r1(x),cy:r1(y),r:r1(1.2+R()*1.5),fill:k<0.5?C.mist:k<0.8?C.cream:C.sun},p);
  }
}

// ============================================================
// 字幕 — 改这里！用 ASR 实际时间戳
// ============================================================
const VO = [
  {t:0.0,  cn:'一九九四年七月，人类在望远镜里看着一颗彗星'},
  {t:3.44, cn:'被木星撕成二十一块，排成一行砸上去'},
  {t:6.18, cn:'最大一块的威力，等于地球上所有核武器一起炸掉'},
  {t:9.30, cn:'天文学家看完，后背全是汗'},
  {t:11.50,cn:'因为大家突然意识到一件事'},
  {t:13.18,cn:'这一枪如果打的是地球，就没有然后了'},
  {t:15.70,cn:'谁开的枪？顺着轨迹往上追'},
  {t:17.58,cn:'所有线索指向海王星轨道之外那片黑暗'},
  {t:22.20,cn:'二零一九年物理学家猜测：那个大家伙根本不是行星'},
  {t:28.38,cn:'它是个黑洞。质量是地球的十倍'},
  {t:30.54,cn:'体积压缩到只有一个西柚那么大'},
  {t:32.70,cn:'它不发光不发热，可它能牵动整个太阳系'},
];
VO.forEach((v,i)=>{v.t1 = VO[i+1] ? VO[i+1].t : 35.7;});
function subtitles(p, t) {
  const v = VO.find(q=>t>=q.t&&t<q.t1); if(!v) return;
  const k = eo(seg(t,v.t,v.t+0.16));
  const G = g(p,{'clip-path':clipOf('rect',{x:80,y:940,width:1200,height:130})});
  const dy = 12*(1-k);
  el('rect',{x:96,y:r1(975+dy),width:5,height:70,rx:2.5,fill:C.sun},G);
  text(G,122,r1(1015+dy),v.cn,{'data-noread':1,'font-size':36,'font-weight':700,fill:C.cream,'font-family':'Jost,NotoSC','letter-spacing':1});
}

// ============================================================
// 尺度条
// ============================================================
function ribbon(p, t, fovMeters) {
  if (t < 1.5) return;
  const kIn = eo(seg(t,1.5,2.0));
  const x0=1280, L=540, y=1000;
  const G = g(p);
  wipeText(G, x0, 870, 'FIELD OF VIEW', {'font-size':16,'font-weight':600,fill:C.mist,'letter-spacing':3}, kIn, 22);
  el('rect',{x:x0,y:y-5,width:L,height:10,rx:5,fill:C.n3},G);
  const e = Math.log10(Math.max(0.01,fovMeters));
  const pos = ee => x0 + (14 - ee)/28 * L;
  el('rect',{x:x0,y:y-5,width:r1(Math.max(10,pos(e)-x0)),height:10,rx:5,fill:C.sun},G);
  for (let ee=10; ee>=-10; ee-=5) {
    el('rect',{x:r1(pos(ee)-1.5),y:y+12,width:3,height:ee%10===0?12:7,rx:1.5,fill:C.n3},G);
  }
}

// ============================================================
// Orbi 微动作
// ============================================================
function orbiPose(t) {
  const P = {};
  P.look = [
    kf(t, [[0,0.3],[2,-0.2],[4,0.4],[7,-0.3],[9,0.2],[11,-0.5],[14,0.6],[17,0.3],[22,-0.4],[25,0.1],[28,0.6],[31,-0.2],[34,0]]),
    kf(t, [[0,0.1],[2,0.2],[4,-0.3],[7,0.1],[9,-0.2],[11,0.3],[14,-0.4],[17,0.2],[22,-0.1],[25,0.3],[28,-0.3],[31,0.1],[34,0]])
  ];
  P.lid = Math.max(blink(t,1.5),blink(t,5),blink(t,8.5),blink(t,13),blink(t,18),blink(t,24),blink(t,29),blink(t,33));
  P.wide = ebump(t,12.5,13,15,16)+ebump(t,28,28.5,31,32)+ebump(t,7.5,8,9,10);
  P.smile = eio(seg(t,1.5,3))*(1-eio(seg(t,7,9)))+eio(seg(t,34,35.5));
  P.zoom = spr(t,2,17,5)*(1-0.3*eio(seg(t,7,9)))+ebump(t,28,28.5,31,32)*0.5;
  let jump = 0;
  jump -= ebump(t,7.8,8,8.5,9)*30;
  jump -= ebump(t,28.2,28.4,29,29.5)*25;
  const x = 180+5*Math.sin(2*Math.PI*0.4*t);
  const y = 820+6*Math.sin(2*Math.PI*0.5*t+1)+jump;
  P.flame = 0.5+0.2*Math.sin(2*Math.PI*2*t);
  P.flick = t*2*Math.PI*7;
  P.rot = -4+3*Math.sin(2*Math.PI*0.3*t)+(jump>5?-8:0);
  P.tilt = 4; P.sq = 0;
  return {x, y, s:220, P};
}

// ============================================================
// 主时间线 — 改这里！替换成你的场景
// ============================================================
function film(t) {
  el('rect', {width:W, height:H, fill:C.night});
  starLayer(g(), 11, 200);
  let fov = 2e8;

  // SCENE 1: 木星+碎片 (0–6.18s)
  if (t < 6.18) {
    fov = 8e8;
    const jx = 1320, jy = 480, JR = 260;
    drawJupiter(g(), jx, jy, JR, t);
    const n = 21;
    for (let i=0;i<n;i++) {
      const startT = 0.5+i*0.2;
      const windupT = startT-0.2;
      const hitT = startT+0.6;
      const isBig = (i===n-1);
      const baseSz = isBig?22:7+(i%4)*2.5;
      const depth = 0.6+0.4*Math.sin(i*1.3);
      const sz = baseSz*depth;
      if (t>=windupT && t<startT) {
        const wp = seg(t,windupT,startT);
        el('ellipse',{cx:r1(-30-wp*15),cy:r1(280+i*14+Math.sin(i*0.9)*18),rx:r1(sz*1.4*depth),ry:r1(sz*0.85*depth),fill:isBig?C.coral:C.mint,opacity:0.5+0.3*wp},g());
      }
      const p = seg(t,startT,hitT);
      if (p<=0||p>=1) continue;
      const ease = eio(p);
      const sx = lerp(-40,jx-JR-10,ease);
      const arc = Math.sin(p*Math.PI)*25;
      const sy = 280+i*14+Math.sin(i*0.9)*18-arc;
      el('ellipse',{cx:r1(sx),cy:r1(sy),rx:r1(sz*1.4),ry:r1(sz*0.85),fill:isBig?C.coral:C.mint},g());
      el('ellipse',{cx:r1(sx+sz*0.2),cy:r1(sy+sz*0.1),rx:r1(sz*0.7),ry:r1(sz*0.4),fill:isBig?C.coralD:C.mintD},g());
    }
    for (let i=0;i<n;i++) {
      const hitT = 1.1+i*0.2;
      if (t>hitT && t<hitT+0.6) {
        const p = seg(t,hitT,hitT+0.6);
        el('circle',{cx:r1(jx-JR+20),cy:r1(280+i*14),r:r1(15+p*70),fill:'none',stroke:C.sun,'stroke-width':r1(4*(1-p))},g());
      }
    }
  }

  // SCENE 2: 核武器 (6.18–9.30s)
  if (t>=6.18 && t<9.30) {
    fov = 2e7;
    const p = eio(seg(t,6.18,7));
    drawJupiter(g(), lerp(1320,1650,p), lerp(480,250,p), lerp(260,110,p), t);
    drawEarth(g(), 480, 490, 100, 5);
    if (t>7.2) {
      const Rr = rng(77);
      for (let i=0;i<10;i++) mushroomCloud(g(), 320+Rr()*320, 380-Rr()*70, 25+Rr()*22, i%2?C.coral:C.sun);
    }
  }

  // SCENE 3: 地球特写 (9.30–15.70s)
  if (t>=9.30 && t<15.70) {
    fov = 1.5e4;
    const p = eio(seg(t,9.30,10.30));
    drawEarth(g(), 1000, 540, lerp(100,340,p), 5);
    if (t>13.0) {
      const flash = ebump(t,13.3,13.6,14.5,15.5);
      el('circle',{cx:r1(920),cy:r1(489),r:r1(18+flash*50),fill:C.coral},g());
      el('circle',{cx:r1(920),cy:r1(489),r:r1(9+flash*25),fill:C.sun},g());
    }
  }

  // SCENE 4: 太阳系追溯 (15.70–22.20s)
  if (t>=15.70 && t<22.20) {
    fov = 4.5e9;
    drawSun(g(), 960, 540, 40);
    for (const r of [80,140,260,420,560]) el('circle',{cx:960,cy:540,r:r1(r),fill:'none',stroke:C.blue,'stroke-width':2,opacity:0.5},g());
    if (t>16.5) {
      const dk = eio(seg(t,16.5,19.5));
      for (let i=0;i<Math.floor(25*dk);i++){
        el('circle',{cx:r1(lerp(960+260*Math.cos(4),960+750*Math.cos(3.5),i/25)),cy:r1(lerp(540+260*Math.sin(4),540+750*Math.sin(3.5),i/25)),r:3.5,fill:C.sun},g());
      }
    }
  }

  // SCENE 5: 黑洞 (22.20–30.54s)
  if (t>=22.20 && t<30.54) {
    fov = lerp(4.5e9,2e7,eio(seg(t,22.20,26)));
    const p = eio(seg(t,25.5,28.5));
    drawBlackHole(g(), 1000, 520, lerp(8,90,p));
  }

  // SCENE 6: 西柚对比 (30.54–35.70s)
  if (t>=30.54) {
    fov = 0.3;
    drawBlackHole(g(), 680, 430, 80);
    if (t>30.8) drawGrapefruit(g(), 1250, 430, 65*spr(t,30.8,14,7));
  }

  // Orbi
  const O = orbiPose(t);
  orbi(g(), O.x, O.y, O.s, O.P);
  ribbon(g(), t, fov);
  subtitles(g(), t);

  // 圆环转场
  const CUTS = [6.18, 9.30, 15.70, 22.20, 30.54];
  const R = Math.sqrt(W*W+H*H)/2;
  for (const cut of CUTS) {
    const half = 0.35;
    if (t>=cut-half && t<=cut+half) {
      let r = t<cut ? R*eio(seg(t,cut-half,cut)) : R*(1-eio(seg(t,cut,cut+half)));
      el('circle',{cx:r1(W/2),cy:r1(H/2),r:r1(r),fill:C.night},g());
    }
  }
}
