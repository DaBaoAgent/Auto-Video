// 战场 package scaffold:长出一份最小、validator 过、render-check 过的骨架包,
// 让 AI/人从绿灯状态开始编写(依 docs/authoring/ 逐层填)。
//
// 用法: node tools/new-package.mjs <slug> [显示名]
//   node tools/new-package.mjs feishui 淝水之战
// 产出 packages/<slug>/ 的六层 JSON + battlefield.json + audio 空壳 + assets/ +
// narration/script.json + narration/generate.py(edge-tts 旁白范本)。不覆盖既有 package。

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
const title = process.argv[3] || '新战役';
if (!slug || !/^[a-z][a-z0-9_-]*$/.test(slug)) {
  console.error('用法: node tools/new-package.mjs <slug(小写英数)> [显示名]'); process.exit(1);
}
const dir = join(ROOT, 'packages', slug);
try { await access(dir); console.error(`FAIL: packages/${slug} 已存在,不覆盖`); process.exit(1); } catch {}

const J = o => JSON.stringify(o, null, 2) + '\n';

const battlefield = {
  name: `${title} 000`, era: '朝代年号(000)',
  description: '一句话描述这场战役的关键 — 谁、在哪、为何而战、胜负手。',
  engine: 'battlefield-editor',
  data: { factions: 'factions.json', terrain: 'terrain.json', structures: 'structures.json', scene: 'scene.json', audio: 'audio.json', units: 'units.json' },
  pending: [],
  meta: {
    title, subtitle: '年号・公元○○○', docTitle: `${title} — 全 3D 战场重现｜历史特别节目`,
    seal: title.slice(0, 1), broadcastTag: '历史特别节目・全 3D 战场重现',
    era: '年号', eraYear: '公元 ○○○ 年・地点',
    intro: { tag: '历史特别节目・3D 战场重现', bodyHtml: '开场叙事(可含 &lt;br&gt;)。', footHtml: '兵力为史学估计・标注「史」者见于正史,「演义」者出自演义' },
    finale: { title: '终局标题', subtitle: '终局副标' },
    timeline: { start: '起始年号', mid: '战 役 时 间 轴', end: '结束年号' },
  },
};

const factions = {
  red:  { name: '红军', flag: '红', css: 'red',  col: '#c0392b', dark: '#7d2018', light: '#e88a7a', panel: '红军', legend: '红方' },
  blue: { name: '蓝军', flag: '蓝', css: 'blue', col: '#2e6da4', dark: '#1a4060', light: '#7fb0d8', panel: '蓝军', legend: '蓝方' },
};

const terrain = {
  world: { W: 600, H: 400, segX: 180, segZ: 120 },
  colorRamp: [
    { maxH: 0, color: '#2c3b3f' }, { maxH: 1.2, color: '#8a7a4e' },
    { maxH: 7, color: '#7d7448', lerpTo: '#90854f', by: 'fbm' },
    { maxH: null, color: '#9a8c5d', lerpTo: '#b3a987', by: 'ramp', from: 7, span: 12 },
  ],
  rivers: [{ id: 'river1', centerline: [[-300, -60], [0, -40], [300, -70]], halfWidth: 26, depth: -8, bankSlope: 0.2, bankCap: 5, bankFbm: { scale: 0.012, xOff: 7, ampRate: 0.13, ampCap: 14 } }],
  bumps: [],
  bands: [{ axis: 'z', beyond: 120, slope: 0.18, fbm: { scale: 0.02, base: 0.4, offset: 6 } }],
  regions: [{ id: 'plain', center: [0, 60], radius: [140, 80], tint: { color: '#857a45', threshold: 0.25, gain: 1.4, max: 0.5, minH: 0.5, maxH: 9 } }],
};

const structures = {
  structures: [
    { id: 'redBase',  type: 'city', x: -120, z: -150, label: '红方城', labelPos: [-120, -138], labelClass: 'big' },
    { id: 'blueBase', type: 'city', x: 0,    z: 150,  label: '蓝方城', labelPos: [0, 162],     labelClass: 'big' },
    { type: 'marker', label: '河', x: 120, z: -64, labelClass: 'water' },
  ],
};

const units = {
  units: [
    { id: 'redArmy',  kind: 'army', faction: 'red',  n: 40, name: '红军本队', generals: '主将・副将', gait: 'foot', start: { x: -120, z: -145, visible: true }, info: ['红方主力', '一两句单位背景。'] },
    { id: 'blueArmy', kind: 'army', faction: 'blue', n: 40, name: '蓝军本队', generals: '主将・副将', gait: 'foot', start: { x: 0, z: 140, visible: true }, info: ['蓝方主力', '一两句单位背景。'] },
  ],
};

const scene = {
  acts: [{
    key: '第一幕', era: '年号', title: '序战', dur: 22, env: 'day',
    narr: '这一幕的旁白(会显示在情报面板;若有旁白语音,也用这段文字产字幕)。',
    power: { red: ['约 40,000', 100, '状态说明'], blue: ['约 40,000', 100, '状态说明'] },
    shots: [
      { kind: 'line', a: [-200, 160, -220], b: [-60, 100, -120], look: [-30, 2, -20], dur: 11 },
      { kind: 'orbit', c: [-20, 4, 0], r: 90, h: 44, a0: 0.6, a1: 2.4, dur: 11 },
    ],
    march: [{ pts: [[-120, -145], [-60, -80], [-30, -20]], fac: 'red' }, { pts: [[0, 140], [-10, 60], [-20, 10]], fac: 'blue' }],
    set: { redArmy: { path: [[-120, -145], [-60, -80], [-30, -20]], dur: 12 }, blueArmy: { path: [[0, 140], [-10, 60], [-20, 10]], dur: 12 } },
    events: [{ at: 6, x: -30, z: -10, t: '事件卡(史/演义)', tag: '史' }],
  }],
};

const audio = { music: { scenes: [], theme: '' }, narration: { voices: [], default: '', voiceLabels: {}, pathPattern: 'assets/narration/{voice}/scene{n}.mp3', cues: '' }, sfx: { dir: 'assets/sfx', files: [] }, cues: {} };

// 旁白生成脚本范本(edge-tts 双声)。scaffold 一并产出,SKILL 步骤 3 直接用,不必再从别包复制。
// ROOT 用 __file__ 自动指向本 package;唯一要动的是 SUBS(本战役破音字/罕用字替身)。
const GENERATE_PY = `#!/usr/bin/env python3
"""旁白生成:edge-tts 双声 mp3 + 句级字幕 cue(SentenceBoundary 聚行)。
环境前置(本机/CI 都要先备齐,缺则旁白整条跑不起来):
    python3 -m venv /tmp/ttsenv && /tmp/ttsenv/bin/pip install edge-tts   # edge-tts
    需有 ffprobe(ffmpeg 内含)在 PATH                                     # 量音长
用法(在 repo 根执行;edge-tts 走 wss,本机需停用 sandbox 才连得上):
    /tmp/ttsenv/bin/python3 packages/<slug>/narration/generate.py        # 全部
    /tmp/ttsenv/bin/python3 packages/<slug>/narration/generate.py 7      # 只第 7 幕
输出:packages/<slug>/assets/narration/<voice>/scene<N>.mp3 + cues.json
"""
import asyncio, json, pathlib, subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent   # 自动指向本 package
VOICES = {"yunjhe": "zh-TW-YunJheNeural", "hsiaochen": "zh-TW-HsiaoChenNeural"}
RATE = "-8%"  # 纪录片腔放慢

# 破音字 / 罕用字 TTS 替身:喂 TTS 用右边(目标读音的同音字),字幕由 to_display 还原左边原字。
# 台湾读音为准。罕用字(会吐空音)优先在 script.json 改白话避开;非用不可才在此加替身。
# 例(垓下):{"骓": "锥"}  例(官渡):{"彧": "郁", "郃": "合", "降": "祥"}
SUBS = {
}
# 编辑器/外部可在 narration/subs.json 增补替换(会 merge 进上面 SUBS)
_subs = ROOT / "narration" / "subs.json"
if _subs.exists():
    SUBS.update(json.loads(_subs.read_text()))


def to_tts(text):
    for k, v in SUBS.items():
        text = text.replace(k, v)
    return text
def to_display(text):
    for k, v in SUBS.items():
        text = text.replace(v, k)
    return text


def probe_dur(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)]))


def words_to_lines(words, text):
    lines = []
    for w in words:
        txt = w["w"].strip("。;")
        if len(txt) > 26:
            mid = len(txt) // 2
            cut = max((txt.rfind(c, 0, mid + 6) for c in ",、;——"), default=-1)
            if cut > 4:
                est = w.get("d", 4.0) * (cut / len(txt))
                lines.append({"t": round(w["t"], 2), "text": txt[:cut]})
                lines.append({"t": round(w["t"] + est, 2), "text": txt[cut + 1:]})
                continue
        lines.append({"t": round(w["t"], 2), "text": txt})
    for l in lines:
        l["text"] = to_display(l["text"])
    return lines


async def gen(scene, vkey, vname):
    out = ROOT / "assets" / "narration" / vkey / f"scene{scene['scene']}.mp3"
    out.parent.mkdir(parents=True, exist_ok=True)
    words = []
    cm = edge_tts.Communicate(to_tts(scene["text"]), vname, rate=RATE)
    with open(out, "wb") as f:
        async for chunk in cm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"].endswith("Boundary"):
                words.append({"t": chunk["offset"] / 1e7, "w": chunk["text"],
                              "d": chunk.get("duration", 4e7) / 1e7})
    dur = probe_dur(out)
    print(f"  scene{scene['scene']} {vkey}: {dur:.1f}s, {len(words)} words")
    return {"dur": round(dur, 2), "lines": words_to_lines(words, scene["text"])}


async def gen_retry(sc, vkey, vname, tries=4):
    for i in range(tries):
        try:
            return await gen(sc, vkey, vname)
        except Exception as e:
            print(f"  scene{sc['scene']} {vkey} retry {i+1}: {str(e)[:60]}")
            await asyncio.sleep(10 * (i + 1))
    raise RuntimeError(f"scene{sc['scene']} {vkey} failed after {tries} tries")


async def main():
    import sys
    only = {int(a) for a in sys.argv[1:]} if len(sys.argv) > 1 else None
    script = json.loads((ROOT / "narration" / "script.json").read_text())
    out = ROOT / "assets" / "narration" / "cues.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    cues = json.loads(out.read_text()) if out.exists() else {}
    for sc in script:
        if only and sc["scene"] not in only:
            continue
        entry = {"title": sc["title"], "text": sc["text"]}
        for vkey, vname in VOICES.items():
            entry[vkey] = await gen_retry(sc, vkey, vname)
        cues[str(sc["scene"])] = entry
        out.write_text(json.dumps(cues, ensure_ascii=False, indent=1))
    print("wrote", out)

asyncio.run(main())
`;

await mkdir(dir, { recursive: true });
for (const sub of ['assets/narration', 'assets/music', 'assets/sfx', 'narration']) await mkdir(join(dir, sub), { recursive: true });
await Promise.all([
  writeFile(join(dir, 'battlefield.json'), J(battlefield)),
  writeFile(join(dir, 'factions.json'), J(factions)),
  writeFile(join(dir, 'terrain.json'), J(terrain)),
  writeFile(join(dir, 'structures.json'), J(structures)),
  writeFile(join(dir, 'units.json'), J(units)),
  writeFile(join(dir, 'scene.json'), J(scene)),
  writeFile(join(dir, 'audio.json'), J(audio)),
  writeFile(join(dir, 'narration', 'script.json'), '[]\n'),
  writeFile(join(dir, 'narration', 'generate.py'), GENERATE_PY),
  ...['assets/narration', 'assets/music', 'assets/sfx'].map(s => writeFile(join(dir, s, '.gitkeep'), '')),
]);

// 登录进首页 gallery 列表(packages/index.json),index.html 就会列出这场新战场
try {
  const idxPath = join(ROOT, 'packages', 'index.json');
  const idx = JSON.parse(await readFile(idxPath, 'utf8').catch(() => '[]'));
  if (!idx.includes(slug)) { idx.push(slug); await writeFile(idxPath, JSON.stringify(idx) + '\n'); }
} catch { /* 没有 index.json 不挡 scaffold */ }

console.log(`OK 已建 packages/${slug}/(最小骨架,绿灯起步;红/蓝 placeholder 待改)`);
console.log(`  验证:   node tools/validate-data.mjs --pkg packages/${slug}/battlefield.json`);
console.log(`  残留检:  node tools/residue-scan.mjs  --pkg packages/${slug}/battlefield.json`);
console.log(`  渲染检:  node tools/render-check.mjs   --pkg packages/${slug}/battlefield.json`);
console.log(`  音频检:  node tools/audio-check.mjs    --pkg packages/${slug}/battlefield.json`);
console.log(`  浏览器:  play.html?pkg=packages/${slug}/battlefield.json(首页 index.html 会自动列出)`);
console.log(`  接着依 docs/authoring/ 逐层编(factions→terrain→structures→units→scene→audio);`);
console.log(`  旁白用 narration/generate.py(已备范本,改 SUBS 即可)。`);
