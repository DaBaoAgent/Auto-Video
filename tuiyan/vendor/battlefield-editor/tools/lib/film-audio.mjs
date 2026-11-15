// 共享:逐幕「配乐 + 配音」混音 → concat → 与画面 remux。
// render-film.mjs(稳帧渲染) 与 reburn-bgm.mjs(免重渲换 BGM) 共用同一套音轨逻辑,
// 避免「渲染」与「重烧」两处漂移。混音公式与历史版本 render-film.mjs 完全一致:
//   配乐 volume=V + afade(0.7/0.8) → 循环铺满本幕;配音 apad/atrim 到幕长;
//   amix(normalize=0) → alimiter,避免削顶。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const HOME = os.homedir().replaceAll('\\', '/');
export const DEFAULT_FFMPEG = process.env.FFMPEG || HOME + '/bin/ffmpeg.exe';
export const DEFAULT_FFPROBE = process.env.FFPROBE || HOME + '/bin/ffprobe.exe';

// 幕时长量化:每幕边界对齐到 1/30 秒,音频与画面的累计误差不超过一帧。
export const quantizeDurations = acts => acts.map(a => Math.ceil(a.dur * 30) / 30);

export function makeRunner(ffmpeg = DEFAULT_FFMPEG) {
  return async function run(args) {
    const child = spawn(ffmpeg, ['-y', '-v', 'error', ...args], {stdio: ['ignore', 'ignore', 'pipe']});
    let err = ''; child.stderr.on('data', d => err += d);
    const [code] = await once(child, 'exit');
    if (code !== 0) throw new Error('ffmpeg ' + err.slice(0, 400));
  };
}

const quote = p => p.replaceAll('\\', '/').replaceAll("'", "'\\''");

// 逐幕合成 [循环配乐 × volume + 该幕配音 + 场景化音效] → act{N}.m4a,返回音频档路径数组(依幕序)。
// segments: [{act, duration}];audio/scene 路径皆相对 dir 解析。
// 音效取自 audio.sfxPlan[幕索引0-based],条目两种:
//   {t, f, v}               一次性:第 t 秒落点,f=素材名(有 .mp3 优先,否则 .wav),v=音量
//   {bed:1, f, v, fi, fo}   铺底:整幕循环,f=同上,fi/fo=淡入淡出秒
// 每个输入都补齐到幕长,故 amix duration=shortest 不会因某条音效短而被截断。
export async function buildActAudio({dir, audio, segments, scratchDir, volume = 0.16, run, log = () => {}}) {
  fs.mkdirSync(scratchDir, {recursive: true});
  const paths = [];
  const plan = audio.sfxPlan || {};
  const sfxDir = audio.sfx?.dir ? path.resolve(dir, audio.sfx.dir) : null;
  const resolveSfx = name => {
    if (!sfxDir) return null;
    for (const ext of ['.mp3', '.wav', '.ogg']) {
      const p = path.resolve(sfxDir, name + ext);
      if (fs.existsSync(p)) return p;
    }
    return null;
  };
  for (const s of segments) {
    const dest = path.join(scratchDir, `act${s.act + 1}.m4a`);
    const bgm = path.resolve(dir, audio.music.scenes[s.act]);
    const voice = audio.narration.default;
    const narration = voice && path.resolve(dir, audio.narration.pathPattern.replace('{voice}', voice).replace('{n}', s.act + 1));
    const inputs = ['-stream_loop', '-1', '-i', bgm];
    if (narration && fs.existsSync(narration)) inputs.push('-i', narration);
    else inputs.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
    const cues = (plan[s.act] || plan[String(s.act)] || []);
    const sfx = [];
    for (const c of cues) {
      if (!c || !c.f) continue;
      const p = resolveSfx(c.f);
      if (!p) { log(`  音效缺素材 ${c.f} → 第${s.act + 1}幕 跳过`); continue; }
      // 一次性音效晚于幕尾 0.05s 的不排,避免空跑输入。
      if (!c.bed && Number(c.t) >= s.duration - 0.05) continue;
      if (c.bed) { inputs.push('-stream_loop', '-1', '-i', p); sfx.push({bed: true, c}); }
      else { inputs.push('-i', p); sfx.push({bed: false, c}); }
    }
    const fadeOut = Math.max(0, s.duration - 0.8);
    const parts = [`[0:a]atrim=duration=${s.duration},volume=${volume},afade=t=in:d=0.7,afade=t=out:st=${fadeOut}:d=0.8[bg]`,
                   `[1:a]apad,atrim=duration=${s.duration}[voice]`];
    let mix = '[bg][voice]';
    let idx = 2, n = 0;
    for (const e of sfx) {
      const v = Number.isFinite(e.c.v) ? e.c.v : 0.4;
      if (e.bed) {
        const fi = Number.isFinite(e.c.fi) ? e.c.fi : 0.8;
        const fo = Number.isFinite(e.c.fo) ? e.c.fo : 1.0;
        const st = Math.max(0, s.duration - fo);
        parts.push(`[${idx}:a]atrim=duration=${s.duration},volume=${v},` +
                   `afade=t=in:d=${fi},afade=t=out:st=${st}:d=${fo}[x${n}]`);
      } else {
        // 一次性音效只在落点播 2 秒(1.6s 起淡出、2.0s 收)后静音至幕尾,与 play.html 的 playFile 一致;
        // 否则长素材(gallop 36.5s / fire-big 28s / battlecry 18.5s …)会整幕拖尾成嗡鸣。
        const tSec = Number(e.c.t) || 0;
        const ms = Math.max(0, Math.round(tSec * 1000));
        const cap = Math.min(2.0, Math.max(0.2, s.duration - tSec));
        const fo = Math.min(0.4, cap * 0.25);
        parts.push(`[${idx}:a]volume=${v},atrim=duration=${cap.toFixed(3)},` +
                   `afade=t=out:st=${(cap - fo).toFixed(3)}:d=${fo.toFixed(3)},adelay=${ms}:all=1,apad,atrim=duration=${s.duration}[x${n}]`);
      }
      mix += `[x${n}]`;
      idx++; n++;
    }
    const filters = parts.join(';') +
      `;${mix}amix=inputs=${2 + n}:duration=shortest:normalize=0,alimiter=limit=0.95:latency=1[mix]`;
    await run([...inputs, '-filter_complex', filters, '-map', '[mix]', '-t', String(s.duration), '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', dest]);
    paths.push(dest);
    log(`  音轨 ${s.act + 1} ${path.basename(bgm)} + 配音 + ${n} 音效 → 第${s.act + 1}幕 ${s.duration.toFixed(2)}s`);
  }
  return paths;
}

// 把逐幕音频拼成一条 concat 清单档,回传其路径(供与画面 mux 时作输入)。
export function writeConcatList(list, file) {
  fs.writeFileSync(file, list.map(p => `file '${quote(p)}'`).join('\n'));
  return file;
}

// 与画面成片 remux。copyVideo=true → -c:v copy(重烧:画面一帧不动);
// false → 与 render-film 一致重新编码(稳帧成片)。
// audioArgs 是音频输入参数,例如 ['-f','concat','-safe','0','-i',listFile]。
export async function muxFilm({video, audioArgs, out, duration, copyVideo = false, run}) {
  const vargs = copyVideo ? ['-c:v', 'copy'] : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19'];
  await run(['-i', video, ...audioArgs, '-map', '0:v:0', '-map', '1:a:0', ...vargs,
    '-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-movflags', '+faststart', out]);
  return out;
}
