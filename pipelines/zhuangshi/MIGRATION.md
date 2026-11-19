# MIGRATION · zhuangshi

## 来源

| 项 | 值 |
|---|---|
| 上游仓库 | `公开样片库/开源风格库`（本地 `开源风格库`） |
| 上游位置 | `styles/art-deco/demo` |
| 上游样片 | 《星光酒店午夜》Midnight at the Starlight Hotel，39.0 s |
| 迁入日期 | 2026-11-18 |

## 迁入内容

- `index.html`：module 入口
- `main.js`：入口：挂 DUR / render / READY
- `film.js`：时间轴（DUR = TL.DUR）
- `timeline.js / timeline.json`：时间表与场景切换
- `chars.js`：人物（12 fps 步进）
- `engine/deco.js`：几何与金线：gline（刻线 + 金色渐变 + 细高光）、扇、日芒、阶梯、光晕
- `engine/type.js`：装饰字体排版：从中心展开的标题条
- `engine/bulbs.js`：灯泡招牌（沿字形骨架排灯泡）
- `engine/cam.js`：相机与卡片变换
- `scenes/lobby.js · roof.js · stairs.js · tower.js`：四个场景：大堂、天台、楼梯、塔
- `shots_*.js`：各场景的镜头表

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
| `scripts/zhuangshi.py` | 单一入口：probe / stills / render / mux / srt / qa / new |
| `catalog/pipelines.json` 条目 | `station: graphic`，`entry: scripts/zhuangshi.py` |
| `tools/sync_fonts.py` | `MANIFEST` 补 `zhuangshi` 的落点 |
| `.gitignore` | `zhuangshi/projects/*/out/`、`voice/*.wav` |

## 运行环境

Windows / Linux / macOS 均可。实测：Windows 11 + Node 20 + ffmpeg 7.x
+ `开源风格库/node_modules/playwright-core`（按 `$PLAYWRIGHT_CORE` → 工程向上 → 全局的顺序找）。
