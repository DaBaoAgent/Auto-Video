// 宣传片 capture 阶段:程式驱动浏览器自动播映各战役高潮幕,屏幕录成 webm。
// 「app 本身就是电影运镜引擎」→ 录它,不用生成影片。
//
// 需求:playwright(`npm i -D playwright`)+ ffmpeg。WebGL 要真 GL,务必跑在 xvfb 下:
//   xvfb-run -a --server-args="-screen 0 1280x720x24" node tools/trailer/capture.mjs
//   xvfb-run -a --server-args="-screen 0 720x1280x24"  node tools/trailer/capture.mjs --portrait
// 产出:tools/trailer/raw/<id>.webm(gitignored)。之后交给 compose.sh。
//
// 坑:① file:// 下 fetch(?pkg=) 被挡 → 本档内建 http server。② headless WebGL 掉
// swiftshader → 必须 xvfb-run headed。③ play.html 是 ES module,gotoPhase 不在 window
// 上 → 用「点时间轴节点」跳幕(nodes[i].click() 会触发 onclick 的 gotoPhase)。
//
// ── 每项目要换的旋钮 ─────────────────────────────
const PORT = 8199;
const PAGE = "play.html";               // 引擎页(?pkg= 加载战场)
const HIDE = "#topbar,#intel,#side,#deck,#subtitle,#labels,#eraBox,#powers,#legend,#hint,#unitCard,#ctrls,#lboxT,#lboxB{display:none!important}";
const BATTLES = [                        // phase = 要停的高潮幕 index;hold = 停留毫秒(火/水攻要长)
  { id: "chibi-full",    pkg: "packages/chibi-full/battlefield.json",  phase: 6, hold: 11000 },
];
// ────────────────────────────────────────────────

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");                 // repo root
const RAW = join(HERE, "raw"); mkdirSync(RAW, { recursive: true });
const portrait = process.argv.includes("--portrait");
const VIEW = portrait ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
const MIME = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript",
               ".mjs": "text/javascript", ".mp3": "audio/mpeg", ".png": "image/png", ".glb": "model/gltf-binary" };

const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" });
    res.end(await readFile(p));
  } catch { res.writeHead(404).end("404"); }
});
await new Promise(r => server.listen(PORT, "127.0.0.1", r));

const browser = await chromium.launch({ headless: false,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist", "--no-sandbox",
         "--autoplay-policy=no-user-gesture-required"] });

for (const b of BATTLES) {
  const vdir = join(RAW, b.id); mkdirSync(vdir, { recursive: true });
  const ctx = await browser.newContext({ viewport: VIEW, recordVideo: { dir: vdir, size: VIEW } });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}?pkg=${b.pkg}`, { waitUntil: "load" });
  await page.addStyleTag({ content: HIDE });
  for (let t = 0; t < 40; t++) {                                  // 等时间轴节点出现 = 加载完成
    if (await page.evaluate(() => document.querySelectorAll("#tlNodes .node").length) > 0) break;
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => document.getElementById("btnAuto")?.click());
  await page.addStyleTag({ content: HIDE }); await page.waitForTimeout(700);
  await page.evaluate(i => document.querySelectorAll("#tlNodes .node")[i]?.click(), b.phase);
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(b.hold);
  await ctx.close();
  const f = readdirSync(vdir).find(x => x.endsWith(".webm"));
  const out = join(RAW, `${b.id}${portrait ? "_v" : ""}.webm`);
  renameSync(join(vdir, f), out);
  console.log(`captured ${out}`);
}
await browser.close(); server.close();
console.log("capture done");
