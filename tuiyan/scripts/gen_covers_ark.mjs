#!/usr/bin/env node
// 火山方舟 (Ark) 文生图封面：按 AutoYY 封面规则生成 4:3 与 3:4 两张高清封面。
// 规则：6 字金黄色粗毛笔主标题 + 8 字白色毛笔副标题，上三分之一/上部居中两行；
//       除两行文字外无其他文字/英文/logo/水印。
// 用法:
//   ARK_API_KEY=<key> node scripts/gen_covers_ark.mjs \
//     --out <目录> --main 六字主标 --sub 八字副标 \
//     --scene43 <横版画面描述> --scene34 <竖版画面描述>
import fs from "node:fs";
import path from "node:path";

const API = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const MODEL = process.env.ARK_MODEL || "doubao-seedream-4-0-250828";

function arg(name, def) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const HEAD_3X4 = "电影级写实纪录片封面，3:4竖版构图。画面：";
const HEAD_4X3 = "电影级写实纪录片封面，4:3横版构图。画面：";

const TEXT_3X4 = (m, s) =>
  "画面正上方约三分之一处居中排列两行书法大字，文字醒目、笔画清晰、无变形无错字：" +
  `第一行主标题「${m}」——特大号金黄色粗毛笔书法字，刚劲有力，黑色细描边，柔和黑色投影，几乎横贯版面宽度；` +
  `第二行副标题「${s}」——中号白色毛笔书法字，与主标题同风格描边和投影，宽度约为主标题三分之二，紧贴主标题下方居中。` +
  "文字有安全边距，笔画不裁切。除这两行文字外画面无其他文字、无英文、无logo、无水印。" +
  "背景高清写实、细节丰富、景深自然，纪录片封面质感，主体突出，构图平衡，色彩高级。";

const TEXT_4X3 = (m, s) =>
  "画面上部居中排列两行书法大字，文字醒目、笔画清晰、无变形无错字：" +
  `第一行主标题「${m}」——特大号金黄色粗毛笔书法字，刚劲有力，黑色细描边，柔和黑色投影，几乎横贯版面宽度；` +
  `第二行副标题「${s}」——中号白色毛笔书法字，与主标题同风格描边和投影，宽度约为主标题三分之二，紧贴主标题下方居中。` +
  "文字有安全边距，笔画不裁切。除这两行文字外画面无其他文字、无英文、无logo、无水印。" +
  "背景高清写实、细节丰富、景深自然，纪录片封面质感，主体突出，构图平衡，色彩高级。";

async function gen(prompt, size, key) {
  const r = await fetch(API, {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, size, response_format: "url", watermark: false }),
  });
  const j = await r.json();
  if (!r.ok || !j.data?.[0]?.url) throw new Error("Ark 返回异常: " + JSON.stringify(j).slice(0, 400));
  return j.data[0].url;
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("下载失败 " + r.status);
  const ct = r.headers.get("content-type") || "";
  const ext = ct.includes("png") ? ".png" : ct.includes("webp") ? ".webp" : ".jpg";
  const buf = Buffer.from(await r.arrayBuffer());
  const final = dest + ext;
  fs.writeFileSync(final, buf);
  return { final, bytes: buf.length };
}

async function main() {
  const key = process.env.ARK_API_KEY;
  if (!key) throw new Error("缺少 ARK_API_KEY 环境变量");
  const out = arg("out");
  const main6 = arg("main");
  const sub8 = arg("sub");
  const s43 = arg("scene43");
  const s34 = arg("scene34");
  if (!out || !main6 || !sub8 || !s43 || !s34) {
    console.error("用法: ARK_API_KEY=.. node gen_covers_ark.mjs --out <dir> --main <6字> --sub <8字> --scene43 <..> --scene34 <..>");
    process.exit(1);
  }
  if (main6.length !== 6) console.warn("⚠ 主标题应为 6 字，实际 " + main6.length);
  if (sub8.length !== 8) console.warn("⚠ 副标题应为 8 字，实际 " + sub8.length);
  fs.mkdirSync(out, { recursive: true });

  console.log("生成 4:3 (2048x1536) ...");
  const u43 = await gen(HEAD_4X3 + s43 + TEXT_4X3(main6, sub8), "2048x1536", key);
  const f43 = await download(u43, path.join(out, "封面-4比3"));
  console.log("  ✓", f43.final, Math.round(f43.bytes / 1024) + " KB");

  console.log("生成 3:4 (1536x2048) ...");
  const u34 = await gen(HEAD_3X4 + s34 + TEXT_3X4(main6, sub8), "1536x2048", key);
  const f34 = await download(u34, path.join(out, "封面-3比4"));
  console.log("  ✓", f34.final, Math.round(f34.bytes / 1024) + " KB");
  console.log("DONE");
}

main().catch((e) => { console.error("失败:", e.message); process.exit(1); });
