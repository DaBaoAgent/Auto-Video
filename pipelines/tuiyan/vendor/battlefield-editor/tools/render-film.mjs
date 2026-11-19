// 核显稳帧录制：浏览器按 1/30 秒推进、逐帧截图编码，再按同一时间表合成配音与 BGM。
// 生成每个真实画面帧，允许渲染慢于播放；避免实时 CDP 采集的丢帧。
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {buildActAudio, writeConcatList, muxFilm} from './lib/film-audio.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const PREVIEW=process.argv.includes('--preview'),PKG=arg('pkg','packages/chibi-full/battlefield.json');
// 画质档:--ss=1.5/2 超采样(截图仍是 1920×1080,canvas 内部按倍率渲染再缩回);--noshadow 关阴影。
const ssRaw=Number(arg('ss','1.5'));
const SS=Math.max(.7,Math.min(2,Number.isFinite(ssRaw)?ssRaw:1.5)),SHADOW=!process.argv.includes('--noshadow');
// BGM 混音音量(默认 0.16,与历史成片一致);可由 --bgm-volume 覆盖。
const BGM_VOLUME=Number(arg('bgm-volume','0.16'));
if(!/^packages\/[a-z][a-z0-9_-]*\/battlefield\.json$/.test(PKG))throw new Error('无效战役包路径');
const dir=path.dirname(path.join(ROOT,PKG)),read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const bf=read(path.join(ROOT,PKG)),film=read(path.join(dir,'film.json'));
if(!film.audioReady&&!PREVIEW)throw new Error('完整配音尚未生成，不允许输出正式成片');
// 旁白复听门禁:凡有 narration/audit.json 的包,正式出片前必须 passed;预览不拦。
const auditPath=path.join(dir,'narration','audit.json');
if(!PREVIEW&&fs.existsSync(auditPath)){
  const g=read(auditPath);
  if(!g.passed)throw new Error(`旁白复听门禁未通过(失败幕 ${JSON.stringify(g.failed??[])}),修好发音再出片;报告 ${auditPath}`);
}
const scene=read(path.join(dir,bf.data.scene)),audio=read(path.join(dir,bf.data.audio));
const start=Number(arg('start-act','1'))-1,limit=Number(arg('seconds','0'));
if(!Number.isInteger(start)||start<0||start>=scene.acts.length||limit<0||!Number.isFinite(limit)||(!PREVIEW&&(start||limit)))throw new Error('片段参数仅供预览');
const title=String(bf.meta.title).replace(/[<>:"/\\|?*]/g,'');
const out=path.resolve(arg('out',path.join(ROOT,'../../content',title,'视频输出')));
fs.mkdirSync(out,{recursive:true});
const RUN=new Date().toISOString().replace(/[:.]/g,'-');
const final=path.join(out,`${title}_${PREVIEW?'预览':'完整版'}_稳帧1080p_${RUN}.mp4`);
const scratch=path.join(out,'.capture-'+RUN);fs.mkdirSync(scratch,{recursive:true});
const tmp=path.join(scratch,'video.mp4'),concat=path.join(scratch,'audio-list.txt');
const HOME=os.homedir().replaceAll('\\','/');
const FF=process.env.FFMPEG||HOME+'/bin/ffmpeg.exe';
const PROBE=process.env.FFPROBE||HOME+'/bin/ffprobe.exe';
const browserPath=process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const durations=scene.acts.map(a=>Math.ceil(a.dur*30)/30);
let remaining=limit||durations.slice(start).reduce((s,d)=>s+d,0),segments=[];
for(let i=start;i<scene.acts.length&&remaining>0;i++){
  const duration=Math.min(remaining,durations[i]);segments.push({act:i,duration});remaining-=duration;
}
const seconds=segments.reduce((s,a)=>s+a.duration,0),frames=Math.ceil(seconds*30);
const log=s=>console.log('[稳帧] '+s);
async function run(args){
  const child=spawn(FF,['-y','-v','error',...args],{stdio:['ignore','ignore','pipe']});
  let err='';child.stderr.on('data',d=>err+=d);const [code]=await once(child,'exit');
  if(code!==0)throw new Error('ffmpeg '+err.slice(0,400));
}
let browser,encoder;
try{
  browser=await puppeteer.launch({executablePath:browserPath,headless:'new',
    args:['--autoplay-policy=no-user-gesture-required','--use-angle=d3d11','--ignore-gpu-blocklist'],defaultViewport:{width:1920,height:1080}});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${arg('base','http://127.0.0.1:8125')}/play.html?pkg=${encodeURIComponent(PKG)}&record=1&offline=1&ss=${SS}&shadow=${SHADOW?1:0}`,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__eng&&document.getElementById('loadMsg').classList.contains('off'));
  await page.evaluate((start,ss)=>{document.getElementById('btnAuto').click();document.getElementById('intro').remove();
    document.getElementById('bMin').click();window.__eng.setRenderScale(ss);window.__eng.goTo(start);window.__eng.step(0);},start,SS);
  // 每幕边界量化至同一帧，音频与画面的累计误差不超过一帧。
  encoder=spawn(FF,['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','pipe:0',
    '-an','-c:v','libx264','-preset','ultrafast','-crf','15','-pix_fmt','yuv420p',tmp],{stdio:['pipe','ignore','pipe']});
  let err='';encoder.stderr.on('data',d=>err+=d);
  const encoded=once(encoder,'exit'),began=Date.now();
  let act=start,actFrames=0;
  for(let n=0;n<frames;n++){
    if(encoder.exitCode!==null)throw new Error('画面编码失败 '+err.slice(0,300));
    const buffer=await page.screenshot({type:'jpeg',quality:90,optimizeForSpeed:true});
    if(!encoder.stdin.write(buffer))await once(encoder.stdin,'drain');
    actFrames++;
    if(actFrames>=Math.round(durations[act]*30)&&act<scene.acts.length-1){act++;actFrames=0;await page.evaluate(i=>window.__eng.goTo(i),act);}
    // 截图已经完成当前帧，再推进下一帧；页面停在本幕末帧时由录制器统一切幕。
    await page.evaluate(()=>window.__eng.step(1/30));
    if(n%150===0)log(`${n+1}/${frames} 帧 第${act+1}幕 已用 ${Math.round((Date.now()-began)/1000)} 秒`);
    if(errors.length)throw new Error(errors.join('; '));
  }
  encoder.stdin.end();const [code]=await encoded;if(code!==0)throw new Error('画面编码失败 '+err);
  await browser.close();browser=null;
  log('逐幕合成配音与配乐');
  const audioPaths=await buildActAudio({dir,audio,segments,scratchDir:scratch,volume:BGM_VOLUME,run,log});
  writeConcatList(audioPaths,concat);
  await muxFilm({video:tmp,audioArgs:['-f','concat','-safe','0','-i',concat],out:final,duration:frames/30,copyVideo:false,run});
  const probe=spawn(PROBE,['-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames:format=duration','-of','json',final]);
  let data='';probe.stdout.on('data',d=>data+=d);const [pc]=await once(probe,'exit');if(pc!==0)throw new Error('成片探测失败');
  const info=JSON.parse(data),v=info.streams.find(s=>s.codec_type==='video');
  if(v.width!==1920||v.height!==1080||v.avg_frame_rate!=='30/1'||Number(v.nb_read_frames)!==frames)throw new Error('逐帧成片规格不符');
  fs.writeFileSync(final.replace(/\.mp4$/,'.json'),JSON.stringify({file:final,mode:'deterministic',preview:PREVIEW,
    narrated:film.audioReady,frames,seconds:frames/30,renderWallSeconds:(Date.now()-began)/1000,info},null,2));
  await run(['-ss',String(Math.min(8,seconds/2)),'-i',final,'-frames:v','1','-q:v','3',final.replace(/\.mp4$/,'.jpg')]);
  log('完成 '+final);
}catch(e){console.error('[稳帧] 失败',e.message);process.exitCode=1;}
finally{if(browser)await browser.close();if(encoder&&encoder.exitCode===null)encoder.kill();}
