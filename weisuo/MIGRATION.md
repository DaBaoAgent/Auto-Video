# MIGRATION · weisuo

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `lemomo-ai/lemo-opuscar`（本地 `D:\@kaifa\lemo-opuscar`） |
| 上游位置 | `styles/memphis-diorama/demo` |
| 上游样片 | 《柚子镇四季》Four Seasons in Pomelo Town，45.0 s |
| 迁入日期 | 2026-11-18 |

## 迁入内容

- `index.html`：importmap 指 ./lib/three.module.js；两个 canvas（#gl 离屏、#c 上屏）
- `main.js`：时间轴（DUR 45）、一年的四段、镜头、字幕三行、TEXTS
- `memphis.js`：微缩世界的搭建与材质：Diorama、setNight/setLamp/setWave/setZone/setDusk/setSeason、flat/mesh/box
- `people.js`：小人（person/walk/limb），12 fps 步进
- `fonts/fonts.css`：SC（思源黑体子集）、IT（Inter Tight）、PM（IBM Plex Mono）

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
| `scripts/weisuo.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: d3`，`entry: scripts/weisuo.py` |
| `tools/sync_fonts.py` | `MANIFEST` 补 `weisuo` 的落点 |
| `.gitignore` | `weisuo/projects/*/out/`、`voice/*.wav` |

## 运行环境

Windows / Linux / macOS 均可。实测：Windows 11 + Node 20 + ffmpeg 7.x
+ `D:/@kaifa/lemo-opuscar/node_modules/playwright-core`（按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。
