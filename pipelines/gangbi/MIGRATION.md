# MIGRATION · gangbi

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `公开样片库/开源风格库`（本地 `开源风格库`） |
| 上游位置 | `styles/urban-sketch/demo/` |
| 上游风格页 | `styles/urban-sketch/STYLE.md`（11.6 KB，风格不变量） |
| 上游样片 | 《Where the Wind Went / 风去了哪里》，33.4 s |
| 迁入日期 | 2026-11-18 |

上游这套代码是库内风格 demo：纯 Canvas 2D 引擎（无 three），人物是三维骨架打正交投影，
纸面 5120×2880，镜头在纸上走，颜色由「到达场」控制。配乐与拟音由 `audio/score.py`、`audio/foley.py` 现场合成。

## 迁入内容

```
projects/012_wind/
├── index.html             canvas#c 1920×1080 + 两个 @font-face（相对 fonts/）
├── main.js                按查询参数选模块（默认 film.js）
├── film.js                27.9 KB：DUR 33.4、镜头表、草帽与人物、颜色到达、结尾手写
├── world.js               35.4 KB：公园整页（树丛 / 桥 / 灯 / 远景 / 湖）
├── poses.js               4.8 KB：坐跑走站骑扑趴挥手的骨骼表
├── engine.js              49.2 KB：penStroke / drawPen / rasterPen / wash / reserve /
│                          dab / foliage / arrivalField / compositor / figure / handwrite /
│                          sketchShape
├── subs.json              2 条字幕（片头注记与片尾）
├── api.js / look.js / sheet.js   上游的三个小工具页（最小示例 / 取景预览 / 姿势表），留着便于调参
└── CREDITS                画面与字体许可说明
```

## 与原工程的差异

| 上游 | 这里 | 为什么 |
|---|---|---|
| 自带渲染：`core/render/video.mjs` + `build.sh`（绑库根、多 worker） | 交给仓库共享运行时 `vendor/runtime/render-legacy.mjs` | 仓库硬规矩「共享运行时只有一个源」；本管线不再自带一份，`tools/sync_runtime.py --check` 管一致性 |
| `fonts/Caveat.ttf`、`fonts/ReenieBeanie.ttf` 由 `tools/fonts.sh` 从 google/fonts 固定 commit 拉 | 登记到 `assets/fonts/fonts.json`（地址 + SHA256），由 `tools/sync_fonts.py --fetch` 下载并复制到工程 | 仓库硬规矩「字体不进仓库」；同一款字体只留一份源 |
| `audio/score.py` + `audio/foley.py` + `audio/cues.json`（采样配乐与拟音） | 不迁 | 依赖 VSCO/VCSL 采样库与 Python 音频栈；本管线只管画面与配音合流，音频用 `mux` 定版 |
| `demo/film.mp4`、`out/` | 不入库 | 产物一律可由 `render` 重出 |
| `demo/film.srt`（demo 自带） | 改为 `gangbi.py srt` 从 `subs.json` 现导出 | 字幕只有一个源，避免两份不一致 |
| `tools/export_cues.mjs` | 不迁 | 是库内事件导出脚本，本管线不用 `events.json` |
| `events.json`（1.2 KB） | 不迁（已复制到本地可选项之外） | `film.js` 运行时现算 `window.EV`，文件是导出物 |

## 新增

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 入口命令、参数、画面语法、8 条已知坑、验收清单 |
| `README.md` | 环境表、跑一条、新建一条、数据来源 |
| `CREDITS.md` | 字体 / 技法 / 引擎许可 |
| `pipeline.json` | 契约：`schema` + `meta` + `spec`（纸、墨、洗、到达场、调色板、人物、镜头、字体、音频、渲染、交付） |
| `scripts/gangbi.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: hand`，`entry: scripts/gangbi.py` |
| `assets/fonts/fonts.json` 两条 | Caveat / Reenie Beanie 的官方地址与 SHA256 |
| `tools/sync_fonts.py` | `CANON_FILES` 与 `MANIFEST` 增加 caveat / reenie 与 gangbi 的落点 |
| `.gitignore` | 工程内 `fonts/` 与 `out/`、`voice/*.wav` 忽略 |

## 外部依赖

| 依赖 | 版本 | 用途 |
|---|---|---|
| Canvas 2D | 浏览器内置 | 全部画面 |
| playwright-core | 本地已有即可 | 无头 Chromium 逐帧截图 |
| ffmpeg | 5.1+ | 编码、limiter、响度测量 |
| Caveat、Reenie Beanie | OFL 1.1 | 手写标题、注记、字幕 |

## 运行环境

Windows / Linux / macOS 均可。实测机器：Windows 11 + Node 20 + ffmpeg 7.x +
`开源风格库/node_modules/playwright-core`（渲染器按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。

实测：802 帧、33.4 s、1920×1080 / 24 fps；渲染速度与成片音量见 `SKILL.md` 验收一节的实际输出。
