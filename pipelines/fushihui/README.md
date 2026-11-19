# fushihui · 浮世绘（Ukiyo-e）

一张木版画：墨线、几个色块各自错开半格印上去，纸在吃墨。

示例工程 `projects/012_toward/`：《向山》，44.0 s / 1920×1080 / 24 fps。

## 结构

```
fushihui/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 开源风格库 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── fushihui.py      单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_toward/
| `index.html` | module 入口 |
| `main.js` | 时间轴与合成：分色块、错版、印刷揭示、字幕题签 |
| `print.js` | 印刷层：分块画布、错版偏移、bokashi 渐变、线、印章 |
| `views.js` | 每一景（画面构图） |
| `traveler.js` | 旅人 |
| `nature.js` | 山、松、石、雨、雁 |
| `wave.js` | 浪与爪 |
| `story.js` | DUR 44 与镜头表 T / REVEAL_DUR |
| `lib.js` | 数学工具（原库 core/lib.js 的工程内副本） |
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `fushihui.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | 无头浏览器 |

字体：`python tools/sync_fonts.py --fetch` 现取（`assets/fonts/fonts.json` 里记着地址与指纹）。
本工程渲染时的字体落点由 `sync_fonts.py --pipeline fushihui` 负责。

## 跑一条

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline fushihui
python fushihui/scripts/fushihui.py probe  012_toward
python fushihui/scripts/fushihui.py stills 012_toward --times 3,12,28
python fushihui/scripts/fushihui.py render 012_toward
python fushihui/scripts/fushihui.py qa     012_toward
```

## 新建一条片子

```bash
python fushihui/scripts/fushihui.py new 013_xxx
```

复制后改这一页的世界、时间轴与字幕文本，再 `sync_fonts.py --pipeline fushihui` 补字体。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由本仓库代码生成，无生成图、无第三方素材 |
| 字体 | 见 `CREDITS.md`（均 SIL OFL 1.1） |
| 技法 | 开源风格库 `styles/ukiyoe/demo`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
