# MIGRATION · caiqian

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `公开样片库/开源风格库`（本地 `开源风格库`） |
| 上游位置 | `styles/colored-pencil/demo/`（风格试片 s029） |
| 上游工程 | `films/s029_style_tests/colored-pencil/` |
| 成片参照 | `films/s029_style_tests/029_colored-pencil.mp4`（60.3 MB / 27.1 s） |
| 迁入日期 | 2026-11-15 |

上游这套代码原本是库内风格 demo（《树的另一半》，50.8 s 英文版，Kokoro `bf_emma` 配音 + `mix.py` 采样混音）。
这里迁入的是同一份渲染器的**鳕鱼段**：`main.js` 的 `FILM = 27.1`，`SUBS0` 是 17 句中英双语字幕，
题材为鳕鱼（侧视 extrude、背鳍三瓣、臀鳍分开、鱼群、产卵、体长）。

## 迁入内容

```
projects/029_jia_xueyu/
├── index.html                 壳（importmap 改为指向本地 lib/）
├── main.js                    画面全部逻辑，1142 行
├── glyphs.json                手写字形骨架（121 KB）
├── lib/three.module.js        three（1.25 MB，vendored）
├── fonts/LXGWWenKai-subset.ttf 字体子集（77 KB）
├── tools/{make_font.py, skeleton.py, subs.py, poster.py}
├── FACTS.md / CREDITS
└── voice/                     voice.wav 自备，不入库
```

## 与原工程的差异

| 上游 | 这里 | 为什么 |
|---|---|---|
| importmap 指向 `/node_modules/three/build/three.module.js` | 指向 `./lib/three.module.js` | 上游只在库根被服务时成立；迁出后离开库根就 404，页面全黑 |
| 依赖库的 `node_modules/three` | `lib/three.module.js` 随工程入库 | 克隆仓库即可渲染，不用 `npm install`；只 1.25 MB |
| `three/addons/` 映射 | 保留映射但**工程不 import addons** | 全部几何与后处理都是 `main.js` 里手写的，不需要 examples |
| `build.sh`（FROM=0 TO=50.8） | 不迁；改由 `scripts/caiqian.py` 编排 | 上游脚本绑死库根、Kokoro、`core/render/*`、FreePats/VSCO/VCSL 采样库，无法独立运行 |
| `mix.py` + 采样库配音混音 | `mux` 只做预母带 + 合流 | 采样与 foley 是库内音频体系；这里按本机 ffmpeg 做 −14 LUFS 定版 |
| `fonts/src/LXGWWenKai-Regular.ttf`（15.2 MB） | 不入库 | 按 开源风格库的做法由 `tools/make_font.py` 现取现子集（v1.245.1 固定版本） |
| `main_v1.js`（53 KB） | 不迁 | 旧版拆分，`main.js` 已内联全部逻辑 |
| `scene.js` / `shots.js` / `labels.js` | 不迁 | 旧拆分残留；`const SHOTS`、`buildLabels()`、`GLY` 都已在 `main.js` 内 |
| `events.json`（37.6 KB） | 不迁 | `core/render/events.mjs` 的导出物；渲染时 `main.js` 现算 `window.EV` |
| `out/video.mp4`（131.9 MB）、`out/stills/` | 不入库 | 测试产物，`.gitignore` 覆盖 |
| `FILM = 50.8`（demo） | `FILM = 27.1`（鳕鱼段） | 以 `main.js` 为准；`build.sh` 里的 `TO=50.8` 是 demo 遗留，不同步 |

## 新增

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 工序、画面语法、7 条已知坑、验收清单 |
| `README.md` | 环境表、跑一条、新建一条、数据来源、许可 |
| `CREDITS.md` | 字体 / 引擎 / 技法 / 配音许可 |
| `pipeline.json` | 定版参数：纸、铅笔四层、G-buffer、boil、锚定、色板、字体、相机、音频 |
| `scripts/caiqian.py` | new / stills / render / mux / srt / qa / probe（纯标准库） |
| `scripts/render.mjs` | 逐帧渲染器；与 `ditu/`、`pingban/` 同一份实现 |
| `.gitignore` 补充 | `caiqian/projects/*/out/`、`caiqian/projects/*/voice/*.wav` |

## 外部依赖

| 依赖 | 版本 | 用途 |
|---|---|---|
| three.js | vendored（`lib/three.module.js`） | 三维场景与 G-buffer |
| playwright-core | 本地已有即可 | 无头 Chromium 逐帧截图 |
| ffmpeg | 5.1+ / 建议 7.x | 编码、limiter、响度测量 |
| LXGW WenKai | v1.245.1 | 手写标签、字幕、字形骨架 |

## 运行环境

Windows / Linux / macOS 均可：渲染器只依赖 Node 20+ 与 ffmpeg，路径查找按平台回退。
实测机器：Windows 11 + Node 20 + ffmpeg 7.x + `开源风格库/node_modules/playwright-core`，
650 帧耗时约 1–2 分钟（6–10 fps），成片 1920×1080 / 24 fps / 27.10 s / −14.7 LUFS。
