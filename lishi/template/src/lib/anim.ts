export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** 线性推进：从 from 帧开始，用 dur 帧走完 0→1 */
export const ramp = (frame: number, from: number, dur: number) =>
  clamp((frame - from) / Math.max(dur, 1e-6));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
export const easeInQuad = (t: number) => t * t;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** 确定性伪随机（禁 Math.random：Remotion 要求可复现） */
export const prng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 多段折线插值：pts = [[x,y],...]，t∈0..1 */
export const polyAt = (pts: [number, number][], t: number) => {
  if (pts.length < 2) return pts[0] ?? [0, 0];
  const segs = pts.length - 1;
  const x = clamp(t) * segs;
  const i = Math.min(Math.floor(x), segs - 1);
  const f = x - i;
  const [x0, y0] = pts[i];
  const [x1, y1] = pts[i + 1];
  return [mix(x0, x1, f), mix(y0, y1, f)] as [number, number];
};
