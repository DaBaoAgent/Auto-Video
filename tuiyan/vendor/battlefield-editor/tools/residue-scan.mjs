// 残留扫描 gate:抓「从 chibi(赤壁)复制后忘了改」的漏网字 —— 赤壁专属的 unit/structure id
// 与地名/典故字串,出现在非赤壁包里就是 copy-paste 残留(validator 抓不到字面残留)。
//
// 用法(在 repo 根执行): node tools/residue-scan.mjs --pkg packages/<slug>/battlefield.json
// 有赤壁残留 → 列出文件+字+前后文,退出码 1;干净 → PASS。chibi 本身自动跳过。
// 另对未改的 scaffold placeholder(red/blue/红方城…)印 WARN(不致命,提醒交付前换掉)。
// 扫描范围含 narration/(script.json / generate.py),抓藏在旁白档的复制残留。

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ai = process.argv.indexOf('--pkg');
const MANIFEST = ai >= 0 ? resolve(process.cwd(), process.argv[ai + 1]) : resolve(ROOT, 'packages/chibi-full/battlefield.json');
const dir = dirname(MANIFEST);
const slug = basename(dir);

// 赤壁(chibi)专属、高辨识度的残留字:出现在别包 = 没改干净
const RESIDUE = [
  // 单位 id(只列赤壁专属水师/陆军名;`liuArmy` 是刘备通用陆军、跨战役共用,不列,否则刘备参战的别场会误判)
  'caoNavy', 'caoRen', 'caoMain', 'sunFleet', 'hgFleet', 'liuFleet',
  // 结构 id(只列赤壁专属;襄阳/江陵/夏口/柴桑等是跨战役共用大城,不列,否则像水淹七军会误判)
  'campWulin', 'campChibi', 'huarongPass',
  // 地名 / 典故字串(只列赤壁专属;像「长江」「襄阳」这种跨战役共用的地理不列,会误判)
  '赤壁', '乌林', '华容', '连环计', '铁索连环', '八十万', '东风', '黄盖', '周瑜',
  // 赤壁专属页连结(red-cliffs-3d 才有的页;复制到别包 = 死连结)
  'classic.html', 'audition.html', '无声原版', '选曲记录',
];

if (slug === 'chibi') { console.log('SKIP — chibi(赤壁)本身,残留字属合法'); process.exit(0); }

// scaffold placeholder:不算复制残留(不致命),但交付前该全部改掉 → WARN 提醒。
const PLACEHOLDER = [
  'redBase', 'blueBase', 'redArmy', 'blueArmy', '红方城', '蓝方城', '红军本队', '蓝军本队',
  '朝代年号', '主将・副将', '一句话描述', '一两句单位背景', '终局标题', '终局副标',
  '状态说明', '事件卡(史/演义)', '年号・公元○○○',
];

// 扫 manifest 同目录的 *.json,外加 narration/ 的 script.json / generate.py(复制残留常藏这)。
const targets = [];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) targets.push([f, resolve(dir, f)]);
const ndir = resolve(dir, 'narration');
if (existsSync(ndir)) for (const f of readdirSync(ndir).filter(f => /\.(json|py)$/.test(f))) targets.push([`narration/${f}`, resolve(ndir, f)]);

const hits = [], phits = [];
for (const [f, fp] of targets) {
  readFileSync(fp, 'utf8').split('\n').forEach((ln, i) => {
    for (const tok of RESIDUE) if (ln.includes(tok)) hits.push({ f, line: i + 1, tok, ctx: ln.trim().slice(0, 60) });
    for (const tok of PLACEHOLDER) if (ln.includes(tok)) phits.push({ f, line: i + 1, tok });
  });
}

if (phits.length) {
  console.log(`WARN [${slug}] — ${phits.length} 处未改的 scaffold placeholder(交付前该换掉;此项不致命):`);
  for (const h of phits.slice(0, 12)) console.log(`  ${h.f}:${h.line}  「${h.tok}」`);
}
if (hits.length) {
  console.error(`FAIL [${slug}] — ${hits.length} 处赤壁残留(复制后没改干净):`);
  for (const h of hits.slice(0, 20)) console.error(`  ${h.f}:${h.line}  「${h.tok}」  ${h.ctx}`);
  process.exit(1);
}
console.log(`PASS [${slug}] — 无赤壁残留字${phits.length ? `(但有 ${phits.length} 处 placeholder 待改,见上)` : ''}`);
