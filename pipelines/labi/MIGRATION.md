# MIGRATION · labi

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `公开样片库/开源风格库`（本地 `开源风格库`） |
| 上游位置 | `styles/crayon-book/demo/` |
| 上游风格页 | `styles/crayon-book/STYLE.md`（11.4 KB，不变量） |
| 上游样片 | 《The Moon Can't Sleep / 月亮睡不着》，52 s / 1248 帧 |
| 迁入日期 | 2026-11-18 |

上游引擎：`gl.js` 是手写 WebGL2 合成器（纸齿、蜡附着、knock-out、水彩 + 抗拒、浮雕），
`crayon.js` 是 Canvas 2D 画笔（带收尖与细纹的带状笔画、锯齿排线），两者叠成「蜡笔在纸上」的物理质感。
不依赖 three。

## 迁入内容

```
projects/012_moon/
├── index.html         canvas#gl 1920×1080 + fonts/fonts.css
├── main.js            await document.fonts.load(7 个 face) → window.DUR/EV/SUBS/render/READY
├── gl.js              12.6 KB：合成器（paper / wax / knockout / wash / emboss）
├── crayon.js          13.5 KB：line（收尖 + 细纹 + boil）/ fill（锯齿排线 + 越界）/ text
├── rig.js             2.9 KB：part / tube / curve / knock
├── chars.js           32.4 KB：女孩（视角 × 表情 × 姿势）、羊、月亮（表情 / 睡帽 / 毯子）
├── world.js           12.9 KB：房子、树、草坡、梯子、250 颗白蜡星、3 道水彩带
├── film.js            16.9 KB：DUR 52、LINES、SUBS、EV、一次性镜头
├── end.js             15.3 KB：桌上的书、翻页、The End
├── pal.js             压成常量表（K.ink 等 12 支蜡笔）
├── lib.js             原库 core/lib.js 的工程内副本（2.8 KB，纯数学）
├── sheet.js / test.js 模型表与试画页（?test=model&page=girl|moon），留着调角色
├── subs.json          7 条字幕
└── fonts/             7 款 OFL 字体（渲染前由 sync_fonts.py 放进来）
```

## 与原工程的差异

| 上游 | 这里 | 为什么 |
|---|---|---|
| 所有 js 从 `/core/lib.js` 绝对路径取工具函数 | 复制成工程内 `lib.js`，6 处 import 改为 `'./lib.js'` | 渲染服务器只服务工程目录一个根，不能吃库根绝对路径 |
| `build.sh` 串联 TTS → 分镜 → 配乐 → `core/render/video.mjs`（3 worker） | 交给仓库共享运行时 `vendor/runtime/render-legacy.mjs`；`scripts/labi.py` 分词编排 | 仓库硬规矩「共享运行时只有一个源」 |
| `fonts/` 里 7 款 ttf 由 `tools/fonts.sh` 从 google/fonts 固定 commit 拉 | 登记进 `assets/fonts/fonts.json`（地址 + SHA256 + jsdelivr 备用），`sync_fonts.py --fetch` 下载 | 字体不进仓库 |
| `music/score.py`、`mix.py`、`voices/`、`lines.json` 的 TTS 链 | 不迁（`lines.json` 留作旁白文本参考） | 依赖库内 Python 音频栈与 Kokoro；本管线只管画面与合片 |
| `events.json`（库内事件导出物） | 不迁 | `film.js` 运行时就有 `EV` |
| `stills/`、`crayon-book.srt`、`poster.jpg` | 不入库 | 产物可由 `render` / `srt` 重出 |
| 结尾卡署名 `Auto-Video 样片` | 改为 `Auto-Video · labi` | 上游 demo 的品牌署名不该出现在本仓库的样片里 |

## 新增

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 入口命令、参数、画面语法、9 条已知坑、验收清单 |
| `README.md` | 环境表、跑一条、新建一条、数据来源 |
| `CREDITS.md` | 7 款字体许可、技法与引擎出处 |
| `pipeline.json` | 契约：纸、蜡附着、笔画、涂色、水彩、调色板、人物、运动、镜头、字体、音频、渲染、交付 |
| `scripts/labi.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: hand`，`entry: scripts/labi.py` |
| `assets/fonts/fonts.json` 7 条 | 字体官方地址、SHA256、双源 URL |
| `tools/sync_fonts.py` | `CANON_FILES` 7 个键、`MANIFEST` 补 `labi` 的 7 处落点 |
| `.gitignore` | `labi/projects/*/out/`、`voice/*.wav`、`fonts/*.ttf` |

## 外部依赖

| 依赖 | 版本 | 用途 |
|---|---|---|
| WebGL2（SwiftShader 亦可） | 浏览器内置 | 纸齿、蜡附着、水彩合成 |
| Canvas 2D | 浏览器内置 | 笔画层 |
| playwright-core | 本地已有即可 | 无头 Chromium 逐帧截图 |
| ffmpeg | 5.1+ | 编码、limiter、响度测量 |
| Patrick Hand / Gaegu / Short Stack / Gochi Hand / Caveat Brush / Sniglet | OFL 1.1 | 字幕、标题、注记 |

## 运行环境

Windows / Linux / macOS 均可。实测：Windows 11 + Node 20 + ffmpeg 7.x
+ `开源风格库/node_modules/playwright-core`（按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。
