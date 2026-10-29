// 炎帝样片音效合成：whoosh/pop/thud/shimmer 点缀 + 配音混音
const fs = require('fs');
const path = require('path');
const SR = 44100;
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'yandi_sb.json'), 'utf8'));
const DUR = SB.total + 0.2;
const N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
function add(i, v, pan) { if (i >= 0 && i < N) { L[i] += v * (1 - Math.max(0, pan)); R[i] += v * (1 + Math.min(0, pan)); } }
function noise() { return Math.random() * 2 - 1; }

function whoosh(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.32); let lp = 0;
  for (let i = 0; i < len; i++) { const tt = i / SR, p = tt / 0.32, x = noise();
    lp += (0.65 - 0.55 * p) * (x - lp);
    const v = lp * Math.sin(Math.PI * Math.min(1, p)) ** 2 * amp * 0.42;
    add(st + i, v, 0); }
}
function thud(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.4); let ph = 0;
  for (let i = 0; i < len; i++) { const tt = i / SR, f = 150 * Math.exp(-tt * 9) + 42;
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-tt * 8) * amp * 0.5;
    add(st + i, v, 0); }
}
function pop(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.12);
  for (let i = 0; i < len; i++) { const tt = i / SR;
    const w = Math.sin(2 * Math.PI * (620 + 500 * Math.exp(-tt * 30)) * tt);
    const v = w * Math.exp(-tt * 26) * amp * 0.34;
    add(st + i, v, 0); }
}
function shimmer(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.9);
  for (let i = 0; i < len; i++) { const tt = i / SR;
    const w = Math.sin(2 * Math.PI * 880 * tt) * 0.5 + Math.sin(2 * Math.PI * 1320 * tt) * 0.3 + Math.sin(2 * Math.PI * 1760 * tt) * 0.2;
    const v = w * Math.exp(-tt * 3.2) * amp * 0.16;
    add(st + i, v, 0); }
}
const FX = { whoosh, thud, pop, shimmer };
for (const e of SB.events) { if (FX[e.k]) FX[e.k](e.t, 0.9); }

// 读取配音并混入
function readWav(p) {
  const b = fs.readFileSync(p);
  const dataOff = 44;
  const n = Math.floor((b.length - dataOff) / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(dataOff + i * 2) / 32768;
  return out;
}
const nar = readWav(path.join(__dirname, 'sample_narration_yandi.wav'));
const NL = Math.min(nar.length, N);
for (let i = 0; i < NL; i++) { L[i] += nar[i] * 0.92; R[i] += nar[i] * 0.92; }

for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1) * 0.92;
  R[i] = Math.tanh(R[i] * 1.1) * 0.92;
}
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4 + 2);
}
fs.writeFileSync(path.join(__dirname, 'sample_mix_yandi.wav'), buf);
console.log('mix written, dur', DUR.toFixed(2), 'events', SB.events.length);
