// 将定稿 + 分镜表 + 明确的视觉映射编译为独立战役包，原演示音轨保持不变。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i<0?d:process.argv[i+1];};
const mapFile=path.resolve(arg('map',path.join(ROOT,'tools/chibi-film-map.json')));
const map=JSON.parse(fs.readFileSync(mapFile,'utf8'));
const source=path.resolve(path.dirname(mapFile),arg('source',map.source));
const base=arg('base',map.base),slug=arg('slug',map.slug);
if(!/^[a-z][a-z0-9_-]*$/.test(slug)||! /^[a-z][a-z0-9_-]*$/.test(base)||slug===base)throw new Error('需独立的合法战役包名');
// 美术指导按 base 战役选择：官渡用 acts-artdir-guandu.mjs（袁/曹 + 黄河地标），其余沿用赤壁专用 acts-artdir.mjs。
const {artDirect}=await import(base==='guandu'?'./acts-artdir-guandu.mjs':'./acts-artdir.mjs');
const baseDir=path.join(ROOT,'packages',base),out=path.join(ROOT,'packages',slug);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const plan=read(path.join(source,'分镜表.json'));
const raw=fs.readFileSync(path.join(source,plan.script_file),'utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n');
const paragraphs=raw.trim().split(/\r?\n\s*\r?\n/).map(s=>s.trim());
if(map.acts.length!==plan.acts.length)throw new Error('视觉映射数与分镜数不同');
const scriptHash=createHash('sha256').update(raw).digest('hex');
const baseBF=read(path.join(baseDir,'battlefield.json'));
const baseScene=read(path.join(baseDir,baseBF.data.scene));
const baseAudio=read(path.join(baseDir,baseBF.data.audio));
const clean=s=>Array.from(s.replace(/[\p{P}\p{S}\s]/gu,''));
const rebase=o=>typeof o==='string'&&o.startsWith('assets/')?`../${base}/${o}`:
  Array.isArray(o)?o.map(rebase):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rebase(v)])):o;
const productionDefaults=read(path.join(ROOT,'tools/production-defaults.json'));
const voice=arg('voice',productionDefaults.narration.voice);
const existing=fs.existsSync(path.join(out,'film.json'))?read(path.join(out,'film.json')):null;
if(existing?.audioReady)throw new Error('此包已有完整配音，请在新包重新编译，避免覆盖对时');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'narration'),{recursive:true});
const write=(name,obj)=>fs.writeFileSync(path.join(out,name),JSON.stringify(obj,null,2)+'\n');
const used=new Set(),scripts=[],cues={},acts=[],music=[],musicLabels=[];
for(let i=0;i<plan.acts.length;i++){
  const p=plan.acts[i],[template,musicAct,summary]=map.acts[i];
  if(!baseScene.acts[template-1]||!baseAudio.music.scenes[musicAct-1])throw new Error(`第${i+1}幕映射不存在`);
  const [from,to]=p.paras;
  if(from<1||to>paragraphs.length||from>to)throw new Error(`第${i+1}幕段落范围错误`);
  for(let n=from;n<=to;n++){if(used.has(n))throw new Error(`第${n}段重复`);used.add(n);}
  const text=paragraphs.slice(from-1,to).join('\n\n');
  const content=clean(text),dur=p.est_sec||Math.round(content.length/plan.rate_chars_per_sec*100)/100;
  // 逐幕专属美术指导：由分镜表的 env/scene/engine 直接生成镜头/布署/卡片/特效，
  // 不再克隆 9 个模板幕（那会把 46 幕压成重复的 9 个舞台）。
  const art=artDirect(p,{dur:dur+1,index:i,total:plan.acts.length});
  const a={
    key:art.key,era:art.era,title:map.headlines?.[i]||p.shortTitle||art.title,summary,
    featured:art.featured,dur:dur+1,env:art.env,narr:text,power:art.power,shots:art.shots,
  };
  a.longTitle=p.title;a.hold=true;a.reset=true;a.baseline=[];
  if(art.set)a.set=art.set;
  if(art.march)a.march=art.march;
  if(art.combat)a.combat=art.combat;
  if(art.fx)a.fx=art.fx;
  a.events=art.events;
  if(art.cards&&art.cards.length)a.cards=art.cards;
  if(art.strat)a.strat=art.strat;
  a.sourceKind=p.tag==='演义'?'演义辨析':p.tag==='文化'?'历史文化':p.tag==='史'?'史载':'讲述';
  if(i===plan.acts.length-1)a.finale=dur+.5;
  scripts.push({scene:i+1,title:p.title,text,sourceParagraphs:p.paras,scriptHash});
  const lines=[];let charAt=0;
  for(const clause of text.split(/[，。；：！？…—、,.!?;:\n]/u)){
    const chars=clean(clause);
    for(let start=0;start<chars.length;start+=15){const tx=chars.slice(start,start+15).join('');
      lines.push({t:Math.round(charAt/content.length*dur*100)/100,text:tx});charAt+=Array.from(tx).length;}
  }
  cues[String(i+1)]={title:p.title,text,preview:{dur,lines}};
  acts.push(a);music.push(rebase(baseAudio.music.scenes[musicAct-1]));musicLabels.push(p.title);
}
if(used.size!==paragraphs.length)throw new Error('分镜未覆盖完整口播稿');
for(const key of ['factions','terrain','structures','units'])write(`${key}.json`,rebase(read(path.join(baseDir,baseBF.data[key]))));
const audio={music:{scenes:music,sceneLabels:musicLabels,theme:rebase(baseAudio.music.theme),bgm:[]},
  narration:{voices:[],default:'',voiceLabels:{},pathPattern:'assets/narration/{voice}/scene{n}.mp3',cues:'narration/cues.json'},
  sfx:rebase(baseAudio.sfx),cues:{}};
audio.music.autoDefault=true;
// SFX 随「模板」（base scene 原型）走：交战/铁索/火攻/败退四类原型各带一套音效床，不再按写死的幕号表。
const SFX_TEMPLATES=[3,4,7,8];
for(let i=0;i<acts.length;i++){const t=map.acts[i][0];if(SFX_TEMPLATES.includes(t))audio.cues[i]=structuredClone(baseAudio.cues[t-1]||[]);}
const bf=structuredClone(baseBF);bf.name=baseBF.name+' 完整口播版';bf.data=Object.fromEntries(Object.keys(baseBF.data).map(k=>[k,k+'.json']));
bf.meta.intro.bodyHtml=`完整版共 ${acts.length} 幕，按已定稿口播逐段推进。史载与演义分别说明。`;
bf.meta.intro.footHtml='当前为未配音画面预览，字幕时点为估算，完整配音生成后重新对时。';
bf.meta.timeline.mid='完整口播时间轴';bf.meta.timeline.start=plan.sections[0];bf.meta.timeline.end=plan.sections.at(-1);
write('battlefield.json',bf);write('scene.json',{acts});write('audio.json',audio);write('narration/script.json',scripts);write('narration/cues.json',cues);
write('film.json',{version:1,scriptHash,scriptFile:plan.script_file,source:path.relative(out,source).replaceAll('\\','/'),base,voice,
  audioReady:false,subtitleTiming:'estimated-preview',acts:acts.length,estimatedSeconds:acts.reduce((s,a)=>s+a.dur,0),
  render:{width:1920,height:1080,fps:30},music:'existing-scene-assets-with-CC0-source-records'});
const library=read(path.join(ROOT,'tools/music-library.json'));
const usedMusic=new Set(music.map(p=>path.resolve(out,p)));
const credits=library.tracks.filter(t=>t.local&&usedMusic.has(path.resolve(ROOT,t.local))).map(t=>
  `- ${t.credit.title} — ${t.credit.author} — ${t.credit.license} — ${t.credit.url}`);
fs.writeFileSync(path.join(out,'CREDITS.md'),`# 素材来源\n\n本包复用 ${base} 的本地模型、肖像、音效及配乐，原始来源记录见 ../${base}/assets/CREDITS.md。\n\n## 自动配乐\n\n${credits.join('\n')}\n\n## 配音\n\n用户指定 ${voice}。音频生成配置见 ../../tools/production-defaults.json；密钥留在本机安全存储。\n`);
console.log(`已编译 ${slug}：${acts.length} 幕 ${paragraphs.length} 段；${Math.round(acts.reduce((s,a)=>s+a.dur,0))} 秒。配音前字幕为估时预览。`);
