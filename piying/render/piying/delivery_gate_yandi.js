// 炎帝交付总门禁（一条命令跑完）：四查(full+sample) + 密度三指标 + 成片响度
// 用法：node delivery_gate_yandi.js   —— 全部 PASS 才允许交付（exit 0）
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RUN = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 28 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const rows = [];
let fail = 0;

// 1) 四查门禁：全片 + 样片
for (const mode of ['full', 'sample']) {
  const r = RUN('node', ['audit_yandi.js', mode]);
  const pass = r.code === 0;
  if (!pass) fail++;
  const warn = (r.out.match(/WARN[^\n]*/g) || []).length;
  rows.push(['四查门禁(' + mode + ')', pass ? 'PASS' : 'FAIL', 'exit=' + r.code + ' warn=' + warn]);
}

// 2) 密度三指标（全片）
const qc = RUN('node', ['qc_full_yandi.js']);
const g = (re) => { const m = qc.out.match(re); return m ? m[1] : '?'; };
const covMax = g(/文字覆盖率: max ([\d.]+)%/);
const movMin = g(/同屏运动元素: min (\d+)/);
const motW = g(/2秒新动效点:\s+(\d+)\s*\/\s*(\d+)/);
const emptyW = (qc.out.match(/空窗:([\d.,]+)/) || [])[1];
const densOK = +covMax <= 30 && +movMin >= 5 && !emptyW;
if (!densOK) fail++;
rows.push(['密度三指标', densOK ? 'PASS' : 'FAIL', '文字max ' + covMax + '% / 运动min ' + movMin + ' / 窗口 ' + motW + (emptyW ? ' 空窗:' + emptyW : ' 无空窗')]);

// 3) 成片响度（存在才测）
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MP4 = path.join(PROJECT_ROOT, 'out', '1 炎帝', '炎帝_全片.mp4');
if (fs.existsSync(MP4)) {
  const r = RUN('ffmpeg', ['-hide_banner', '-nostats', '-i', MP4, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=summary', '-f', 'null', '-']);
  const I = (r.out.match(/Input Integrated:\s+(-?[\d.]+) LUFS/) || [])[1];
  const tp = (r.out.match(/Input True Peak:\s+(-?[\d.]+) dBTP/) || [])[1];
  const ok = I && Math.abs(+I + 16) <= 0.4 && +tp <= -1.4;
  if (!ok) fail++;
  rows.push(['成片响度', ok ? 'PASS' : 'FAIL', 'I=' + I + ' LUFS / TP=' + tp + ' dBTP']);
} else {
  rows.push(['成片响度', 'SKIP', '成片不存在']);
}

// 4) 交付目录合规（顶层只允许 4 项）
const OUTDIR = path.join(PROJECT_ROOT, 'out', '1 炎帝');
if (fs.existsSync(OUTDIR)) {
  const ALLOW = ['炎帝_全片.mp4', 'cover_4x3.png', 'cover_3x4.png', '发布信息.txt', '源文件'];
  const extra = fs.readdirSync(OUTDIR).filter(f => !ALLOW.includes(f));
  const ok = extra.length === 0;
  if (!ok) fail++;
  rows.push(['交付目录合规', ok ? 'PASS' : 'FAIL', ok ? '顶层 4 项+源文件' : '多余: ' + extra.join(',')]);
}

console.log('\n=== 炎帝交付总门禁 ===');
for (const [k, v, d] of rows) console.log(v.padEnd(5), k.padEnd(16), d);
console.log(fail ? '\n===== 门禁未通过：' + fail + ' 项，禁止交付 =====' : '\n===== 全部通过，允许交付 =====');
process.exit(fail ? 1 : 0);
