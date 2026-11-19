# MIGRATION · shuimo2

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `lemomo-ai/lemo-opuscar`（本地 `D:\@kaifa\lemo-opuscar`） |
| 上游位置 | `styles/ink-wash/demo` |
| 上游样片 | 《剑客与河》The Swordsman and the River，48.0 s |
| 迁入日期 | 2026-11-18 |

## 迁入内容

- `index.html`：module 入口
- `main.js`：入口：挂 DUR / render / READY
- `story.js`：DUR 48、时间表 T
- `ink.js`：墨：mk/draw/blot/mass、TONE（墨分五色）
- `hero.js`：主角（骨架 + 姿势 POSE / mixPose）
- `land.js`：山、水纹、芦苇
- `wave.js`：浪
- `glyph.js`：笔痕与飞白（shuiStrokes / cutStroke / tipAt）
- `climax.js`：高潮段（泼墨）
- `cross.js`：渡河段
- `face.js`：脸的几笔
- `frames.js`：画幅与装裱
- `passage.js`：过场
- `seal.js`：印章（朱砂）
- `world.js`：世界
- `comp.js`：合成器（宣纸 + 墨）
- `lib.js`：数学工具（原库 core/lib.js 的工程内副本）

## 与原工程的差异

| 上游 | 这里 | 为什么 |
|---|---|---|
| 自带渲染（`core/render/video.mjs` / `build.sh`） | 共享运行时 `vendor/runtime/render-legacy.mjs` | 仓库硬规矩「共享运行时只有一个源」 |
| 字体由各自 `tools/fonts.sh` / `fetch_fonts.mjs` 现取 | `assets/fonts/fonts.json` 登记地址与 SHA256，`sync_fonts.py` 落地 | 字体不进仓库 |
| 上游配乐（`music/`）与拟音 | 不迁 | 依赖库内 Python 音频栈；本管线只管画面与合片 |
| 上游 `voices/`、`tts/`、`events.json` 等导出物 | 不入库 | 可由脚本重出 |

## 新增

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 入口命令、参数、画面语法、已知坑、验收 |
| `README.md` | 环境、跑一条、新建一条、数据来源 |
| `CREDITS.md` | 字体与技法许可 |
| `pipeline.json` | 契约：材料、调色板、运动、字体、镜头、音频、渲染、交付 |
| `scripts/shuimo2.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: craft`，`entry: scripts/shuimo2.py` |
| `tools/sync_fonts.py` | `MANIFEST` 补 `shuimo2` 的落点 |
| `.gitignore` | `shuimo2/projects/*/out/`、`voice/*.wav` |

## 运行环境

Windows / Linux / macOS 均可。实测：Windows 11 + Node 20 + ffmpeg 7.x
+ `D:/@kaifa/lemo-opuscar/node_modules/playwright-core`（按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。
