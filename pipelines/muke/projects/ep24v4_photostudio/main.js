import { makeComp, layerSet } from './comp.js';

const cv = document.getElementById('c');
const W = cv.width = Math.max(320, Math.round(innerWidth));
const H = cv.height = Math.max(320, Math.round(innerHeight));

const comp = makeComp(cv);
const A = layerSet(W, H);

const fonts = [
  document.fonts.load('40px MaShanZheng', '水').catch(() => null),
  document.fonts.load('600 40px CormorantSC', 'A').catch(() => null),
  document.fonts.load('500 40px Cormorant', 'A').catch(() => null),
];
await Promise.race([Promise.all(fonts), new Promise(r => setTimeout(r, 2200))]);

const S = await import('./scene.js');
const DUR = 10;
window.DUR = DUR;
window.render = t => {
  A.clear();
  S.paint(A, t, W, H);
  comp(A, null, { vig: .10, warm: .10, bleed: 1.1, rim: .20, paper: [0, 0, 1], paperCol: [.958, .941, .900] });
};
window.READY = true;
