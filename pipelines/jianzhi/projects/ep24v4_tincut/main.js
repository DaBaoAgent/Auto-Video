import { init, paint } from './scene.js';

const cv = document.getElementById('c');
const W = cv.width = Math.max(320, Math.round(innerWidth));
const H = cv.height = Math.max(320, Math.round(innerHeight));
const ctx = cv.getContext('2d');

init(W, H);

window.DUR = 10;
window.render = t => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  paint(ctx, t, W, H);
};
window.READY = true;
