// lao_cast.js — FINAL cast presets for the laolang toon body (2026-11-09, user-approved).
// Use with lib/toon.js (lao_body.ts build) and CAST.draw(slot, LAO_CAST[slot], opts, side).
// Do not change these values without a new approval round: they are the frozen character bible.
window.LAO_CAST = [
  {
    // 领队：长脸 / 三七分 / 无帽 / 马灯 / 红围巾
    jacket: '#5d6b63', pants: '#3f3a32', boots: '#2f2721', hat: 'none',
    skin: '#d6ab7a', muzzle: '#e8c9a2', lao: true, head: 1.0, nose: 1.1,
    scarf: '#a94c35', lantern: true, build: 'adult',
    hair: '#2a211a', hairStyle: 'part', face: 'long',
  },
  {
    // 记录员：圆脸 / 秃顶 + 侧发 / 圆眼镜 / 挎包
    jacket: '#96672f', pants: '#39433d', boots: '#2b2822', hat: 'none',
    skin: '#dfb98a', muzzle: '#f0e3c4', lao: true, head: 1.03, nose: 0.9,
    glasses: true, satchel: '#6b4a2f', build: 'stout',
    hair: '#3a2a1c', hairStyle: 'bald', face: 'round',
  },
  {
    // 挖掘工：方脸 / 板寸 / 宽檐帽 / 镐
    jacket: '#6b4e3b', pants: '#46463a', boots: '#2d2a22', hat: 'cap',
    cap: '#3a352a', brim: '#8a6a44', skin: '#c99563', muzzle: '#d8c9a2',
    lao: true, head: 1.04, nose: 1.2, pickaxe: true, build: 'adult',
    hair: '#241c16', hairStyle: 'buzz', face: 'square',
  },
];
window.LAO_CAST_NAMES = [
  ['领队', '高瘦 · 马灯 · 红围巾'],
  ['记录员', '矮圆 · 圆眼镜 · 挎包'],
  ['挖掘工', '宽肩 · 宽檐帽 · 镐'],
];
