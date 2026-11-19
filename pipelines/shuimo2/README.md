# shuimo2 · 中国水墨（Chinese Ink Wash）

一张宣纸：墨分五色，一笔下去有骨有肉，朱砂只在印章和一个点上。

示例工程 `projects/012_river/`：《剑客与河》，48.0 s / 1920×1080 / 24 fps。

## 结构

```
shuimo2/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 开源风格库 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── shuimo2.py      单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_river/
| `index.html` | module 入口 |
| `main.js` | 入口：挂 DUR / render / READY |
| `story.js` | DUR 48、时间表 T |
| `ink.js` | 墨：mk/draw/blot/mass、TONE（墨分五色） |
| `hero.js` | 主角（骨架 + 姿势 POSE / mixPose） |
| `land.js` | 山、水纹、芦苇 |
| `wave.js` | 浪 |
| `glyph.js` | 笔痕与飞白（shuiStrokes / cutStroke / tipAt） |
| `climax.js` | 高潮段（泼墨） |
| `cross.js` | 渡河段 |
| `face.js` | 脸的几笔 |
| `frames.js` | 画幅与装裱 |
| `passage.js` | 过场 |
| `seal.js` | 印章（朱砂） |
| `world.js` | 世界 |
| `comp.js` | 合成器（宣纸 + 墨） |
| `lib.js` | 数学工具（原库 core/lib.js 的工程内副本） |
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `shuimo2.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | 无头浏览器 |

字体：`python tools/sync_fonts.py --fetch` 现取（`assets/fonts/fonts.json` 里记着地址与指纹）。
本工程渲染时的字体落点由 `sync_fonts.py --pipeline shuimo2` 负责。

## 跑一条

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline shuimo2
python shuimo2/scripts/shuimo2.py probe  012_river
python shuimo2/scripts/shuimo2.py stills 012_river --times 3,12,28
python shuimo2/scripts/shuimo2.py render 012_river
python shuimo2/scripts/shuimo2.py qa     012_river
```

## 新建一条片子

```bash
python shuimo2/scripts/shuimo2.py new 013_xxx
```

复制后改这一页的世界、时间轴与字幕文本，再 `sync_fonts.py --pipeline shuimo2` 补字体。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由本仓库代码生成，无生成图、无第三方素材 |
| 字体 | 见 `CREDITS.md`（均 SIL OFL 1.1） |
| 技法 | 开源风格库 `styles/ink-wash/demo`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
