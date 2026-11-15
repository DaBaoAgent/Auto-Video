#!/usr/bin/env node
// xiangsu full · 全片成片验收（确定性口径，一条命令出结论）
//
//   node verify_full.mjs <video.mp4> [--duration 272.05] [--w 1920] [--h 1080] [--fps 30]
//
// 检查项：
//   1  容器/流规格：1920×1080 · 30 fps · round(dur*fps) 帧 · h264/yuv420p · AAC 48k 双声道
//   2  亮度：两遍 loudnorm 后 ≈ -16 LUFS，TP ≤ -1.0 dBTP
//   3  动效密度：tools/density.mjs 口径（2 s 窗口 · >1% 动效点 · 最长静止 <0.6 s）
//   4  像素密度：成片必须是 640×360 栅格的 3× 整数最近邻（列块一致 + 非扫描线行可无损还原）
//      还原在 Y 平面判：交付规格 yuv420p 的色度是 4:2:0 抽样，抖动色块的 RGB 逐像素差必然偏大，
//      且与编码质量无关（CRF 10 实测同值，无损 4:4:4 为 0.000%）；栅格结构由亮度平面承载。
//   5  落盘：字节数 + SHA-256
//
// 退出码 0 = 全部通过；1 = 有失败项。

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = process.env.XIANGSU_REPO || process.env.XIANGSU2_REPO || 'D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15';
const argv = process.argv.slice(2);
const FILE = argv[0];
if (!FILE) { console.error('用法: node verify_full.mjs <video.mp4> [--duration 272.05]'); process.exit(2); }
if (!fs.existsSync(FILE)) { console.error('文件不存在:', FILE); process.exit(2); }
const opt = { duration: 272.05, w: 1920, h: 1080, fps: 30 };
for (let i = 1; i < argv.length; i += 2) opt[argv[i].replace(/^--/, '')] = argv[i + 1];
const W = +opt.w, H = +opt.h, FPS = +opt.fps, DUR = +opt.duration;
const EXP_FRAMES = Math.round(DUR * FPS);

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      ${detail.replace(/\n/g, '\n      ')}`);
}

// ---------------------------------------------------------------- 1 规格
const pr = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', FILE], { encoding: 'utf8' });
if (pr.status !== 0) { console.error(pr.stderr); process.exit(1); }
const probe = JSON.parse(pr.stdout);
const v = probe.streams.find(s => s.codec_type === 'video');
const a = probe.streams.find(s => s.codec_type === 'audio');
const [num, den] = String(v.r_frame_rate).split('/').map(Number);
const fps = den ? num / den : +v.r_frame_rate;
const dur = +probe.format.duration;
const frames = +v.nb_frames;
const specOk = v.width === W && v.height === H && v.codec_name === 'h264' && v.pix_fmt === 'yuv420p'
  && Math.abs(fps - FPS) < 1e-6 && Math.abs(frames - EXP_FRAMES) <= 3 && Math.abs(dur - DUR) < 0.25
  && a && a.codec_name === 'aac' && +a.sample_rate === 48000 && a.channels === 2;
check(`规格 ${W}×${H} / ${FPS}fps / ≈${EXP_FRAMES} 帧 / ${DUR.toFixed(2)} s / h264 yuv420p / AAC 48k×2`,
  specOk,
  `${v.width}×${v.height} · ${v.codec_name}/${v.pix_fmt} · ${fps} fps · ${frames} 帧 · ${dur.toFixed(3)} s · ` +
  `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch · ${(+probe.format.size / 1048576).toFixed(2)} MB`);

// ---------------------------------------------------------------- 2 响度
const ln = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
const lm = String(ln.stderr).match(/\{[^{}]*"input_i"[^{}]*\}/s);
let loudOk = false, loudDetail = '未能解析 loudnorm 输出';
if (lm) {
  const d = JSON.parse(lm[0]);
  const I = +d.input_i, TP = +d.input_tp;
  loudOk = I >= -17.5 && I <= -15.0 && TP <= -1.0;
  loudDetail = `I=${d.input_i} LUFS · TP=${d.input_tp} dBTP · LRA=${d.input_lra} LU`;
}
check('响度 ≈ -16 LUFS / TP ≤ -1.0 dBTP', loudOk, loudDetail);

// ---------------------------------------------------------------- 3 动效密度
const dn = spawnSync('node', [path.join(REPO, 'tools', 'density.mjs'), FILE,
  '--win', '2', '--th', '0.005,0.01,0.03', '--gw', '192', '--gh', '108', '--delta', '8'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const dOut = dn.stdout || '';
const winOk = /每 2s 有 >1\.0% 动效点\s+全部窗口通过/.test(dOut);
const quietOk = /最长无变化段 < 0\.6 s\s+通过/.test(dOut);
const tail = dOut.split('\n').filter(l => /窗口|–|最长无有效变化段|全部窗口通过|未通过/.test(l)).slice(-8).join('\n');
check('动效密度（2 s 窗口 · >1% 动效点 · 最长静止 <0.6 s）', winOk && quietOk, tail || dOut.slice(0, 400));

// ---------------------------------------------------------------- 4 像素密度 3×
function grab(t) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', FILE,
    '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`抽帧失败 t=${t}: ${r.stderr}`);
  if (r.stdout.length !== W * H * 3) throw new Error(`帧尺寸异常 t=${t}: ${r.stdout.length}`);
  return r.stdout;
}
function grabY(t) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', FILE,
    '-frames:v', '1', '-vf', 'extractplanes=y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`抽帧失败 t=${t}: ${r.stderr}`);
  if (r.stdout.length !== W * H) throw new Error(`Y 平面尺寸异常 t=${t}: ${r.stdout.length}`);
  return r.stdout;
}
function analyzeY(b) {
  let sum = 0, cnt = 0, big = 0;
  for (let y = 0; y < H; y++) {
    if (y % 3 === 1) continue;
    const by = (y - (y % 3)) * W;
    for (let x = 0; x < W; x++) {
      const d = Math.abs(b[by + (x - (x % 3))] - b[y * W + x]);
      sum += d; cnt++; if (d > 12) big++;
    }
  }
  return { reconMean: sum / cnt, reconBig: big / cnt };
}
function analyze(buf) {
  const cls = [[0, 0], [0, 0], [0, 0]];
  for (let y = 0; y < H; y += 2) {
    const row = y * W * 3;
    for (let x = 1; x < W; x++) {
      const p = row + (x - 1) * 3, q = row + x * 3;
      const d = (Math.abs(buf[p] - buf[q]) + Math.abs(buf[p + 1] - buf[q + 1]) + Math.abs(buf[p + 2] - buf[q + 2])) / 3;
      cls[x % 3][0] += d; cls[x % 3][1]++;
    }
  }
  let sum = 0, cnt = 0, big = 0;
  for (let y = 0; y < H; y++) {
    if (y % 3 === 1) continue;
    const by = (y - (y % 3)) * W * 3;
    for (let x = 0; x < W; x++) {
      const s = by + (x - (x % 3)) * 3, d0 = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(buf[s + c] - buf[d0 + c]);
        sum += d; cnt++; if (d > 12) big++;
      }
    }
  }
  return { colMAD: cls.map(([s, n]) => s / n), reconMean: sum / cnt, reconBig: big / cnt };
}
const probes = [2.3, 45.0, 77.0, 120.0, 175.0, 220.0, 267.0].filter(t => t < DUR);
let pxOk = true;
const pxLines = [];
for (const t of probes) {
  const r = analyze(grab(t));
  const ry = analyzeY(grabY(t));
  const inner = Math.max(r.colMAD[1], r.colMAD[2]);
  const edge = r.colMAD[0];
  const frameOk = inner < 2.5 && edge > inner && ry.reconMean < 2.0 && ry.reconBig < 0.01;
  pxOk = pxOk && frameOk;
  pxLines.push(`t=${t.toFixed(2)}s  块内列差 ${inner.toFixed(2)} / 跨块列差 ${edge.toFixed(2)}  ` +
    `Y 还原差 ${ry.reconMean.toFixed(2)} / >12 级 ${(ry.reconBig * 100).toFixed(3)}%  ` +
    `RGB 还原差 ${r.reconMean.toFixed(2)}（4:2:0 色度抽样）  ${frameOk ? 'ok' : '✗'}`);
}
check('像素密度 = 640×360 栅格 ×3 整数最近邻', pxOk, pxLines.join('\n'));

// ---------------------------------------------------------------- 5 落盘
const h = crypto.createHash('sha256').update(fs.readFileSync(FILE)).digest('hex');
const size = fs.statSync(FILE).size;
console.log(`\n文件      ${FILE}\n字节      ${size}\nSHA-256   ${h}`);

const failed = results.filter(r => !r.ok);
console.log(`\n结论      ${failed.length ? 'FAIL：' + failed.map(r => r.name).join('；') : 'PASS（' + results.length + '/' + results.length + '）'}`);
process.exit(failed.length ? 1 : 0);
