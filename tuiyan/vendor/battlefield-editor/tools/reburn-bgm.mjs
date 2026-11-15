// 免重渲换 BGM:拿一条已渲染好的成片,按战役包的 audio.json(music.scenes + 逐幕配音)
// 重做音轨,再以 `-c:v copy` 把新音轨 remux 回原画面 —— 画面一帧不动,只换配乐/混音。
// 用途:成片已出、只想换配乐(如从 CC0 库存曲换成 OST)、调 BGM 音量或改逐幕选曲。
//
// 用法(在 repo 根执行):
//   node tools/reburn-bgm.mjs --pkg packages/chibi-full/battlefield.json \
//     --video <原成片.mp4> --out <输出目录> [--suffix OST版] [--volume 0.16] [--title 赤壁之战]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {
  DEFAULT_FFMPEG, DEFAULT_FFPROBE, quantizeDurations,
  makeRunner, buildActAudio, writeConcatList, muxFilm,
} from './lib/film-audio.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const PKG = arg('pkg', 'packages/chibi-full/battlefield.json');
if (!/^packages\/[a-z][a-z0-9_-]*\/battlefield\.json$/.test(PKG)) throw new Error('无效战役包路径');
const dir = path.dirname(path.join(ROOT, PKG));
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const bf = read(path.join(ROOT, PKG));
const scene = read(path.join(dir, bf.data.scene));
const audio = read(path.join(dir, bf.data.audio));

const video = arg('video');
if (!video) throw new Error('缺少 --video <已渲染成片.mp4>');
if (!fs.existsSync(video)) throw new Error('成片不存在: ' + video);
const out = path.resolve(arg('out', path.join(ROOT, '../../content', String(bf.meta.title).replace(/[<>:"/\\|?*]/g, ''), '视频输出')));
fs.mkdirSync(out, {recursive: true});

const volume = Number(arg('volume', '0.16'));
const suffix = arg('suffix', 'OST版');
const title = String(arg('title', bf.meta.title)).replace(/[<>:"/\\|?*]/g, '');
const RUN = new Date().toISOString().replace(/[:.]/g, '-');
const final = path.join(out, `${title}_完整版_稳帧1080p_${suffix}_${RUN}.mp4`);
const scratch = path.join(out, '.reburn-' + RUN);
const concat = path.join(scratch, 'audio-list.txt');
const log = s => console.log('[重烧] ' + s);

const run = makeRunner(arg('ffmpeg', DEFAULT_FFMPEG));
const probe = arg('ffprobe', DEFAULT_FFPROBE);

function durationsOf() {
  const durations = quantizeDurations(scene.acts);
  const segments = durations.map((duration, act) => ({act, duration}));
  const seconds = durations.reduce((s, d) => s + d, 0);
  const frames = Math.ceil(seconds * 30);
  return {durations, segments, seconds, frames};
}

async function probeFilm(file) {
  const child = spawn(probe, ['-v', 'error', '-count_frames', '-show_entries',
    'stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames:format=duration', '-of', 'json', file]);
  let data = ''; child.stdout.on('data', d => data += d);
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error('成片探测失败');
  return JSON.parse(data);
}

async function main() {
  const {seconds, frames, segments} = durationsOf();
  if (!audio.music?.scenes?.length) throw new Error('audio.json 无 music.scenes,无从配乐');
  if (audio.music.scenes.length !== scene.acts.length) throw new Error(`music.scenes 长度 ${audio.music.scenes.length} ≠ 幕数 ${scene.acts.length}`);
  const missing = [...new Set(audio.music.scenes)].filter(p => !fs.existsSync(path.resolve(dir, p)));
  if (missing.length) throw new Error('配乐档缺失: ' + missing.join(', '));

  log(`成片 ${path.basename(video)}`);
  log(`战役包 ${PKG} — ${scene.acts.length} 幕 / ${seconds.toFixed(2)}s,配乐音量 ${volume}`);
  fs.mkdirSync(scratch, {recursive: true});

  log('逐幕合成配音与新配乐');
  const audioPaths = await buildActAudio({dir, audio, segments, scratchDir: scratch, volume, run, log});
  writeConcatList(audioPaths, concat);

  log('remux(画面 copy,不重渲)');
  await muxFilm({video, audioArgs: ['-f', 'concat', '-safe', '0', '-i', concat], out: final, duration: frames / 30, copyVideo: true, run});

  const info = await probeFilm(final);
  const v = info.streams.find(s => s.codec_type === 'video');
  const a = info.streams.find(s => s.codec_type === 'audio');
  if (!v || !a) throw new Error('成片缺视频或音频流');
  if (Number(v.nb_read_frames) !== frames) throw new Error(`画面帧数不符: ${v.nb_read_frames} ≠ ${frames}`);
  fs.writeFileSync(final.replace(/\.mp4$/, '.json'), JSON.stringify({
    file: final, mode: 'reburn-bgm(copy-video)', narrated: true, remuxedFrom: path.resolve(video),
    pkg: PKG, volume, frames, seconds: frames / 30, info,
  }, null, 2));
  await run(['-ss', String(Math.min(8, seconds / 2)), '-i', final, '-frames:v', '1', '-q:v', '3', final.replace(/\.mp4$/, '.jpg')]);
  log(`完成 ${final}`);
  log(`  视频 ${v.codec_name} ${v.width}x${v.height}@${v.avg_frame_rate} 帧 ${v.nb_read_frames}(copy 未变)`);
  log(`  音频 ${a.codec_name} ${a.sample_rate || ''}Hz`);
}

main().catch(e => { console.error('[重烧] 失败', e.message); process.exitCode = 1; });
