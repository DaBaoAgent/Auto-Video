# MIGRATION · fushihui

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `公开样片库/开源风格库`（本地 `开源风格库`） |
| 上游位置 | `styles/ukiyoe/demo` |
| 上游样片 | 《向山》Toward the Mountain，44.0 s |
| 迁入日期 | 2026-11-18 |

## 迁入内容

- `index.html`：module 入口
- `main.js`：时间轴与合成：分色块、错版、印刷揭示、字幕题签
- `print.js`：印刷层：分块画布、错版偏移、bokashi 渐变、线、印章
- `views.js`：每一景（画面构图）
- `traveler.js`：旅人
- `nature.js`：山、松、石、雨、雁
- `wave.js`：浪与爪
- `story.js`：DUR 44 与镜头表 T / REVEAL_DUR
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
| `scripts/fushihui.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: craft`，`entry: scripts/fushihui.py` |
| `tools/sync_fonts.py` | `MANIFEST` 补 `fushihui` 的落点 |
| `.gitignore` | `fushihui/projects/*/out/`、`voice/*.wav` |

## 运行环境

Windows / Linux / macOS 均可。实测：Windows 11 + Node 20 + ffmpeg 7.x
+ `开源风格库/node_modules/playwright-core`（按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。
