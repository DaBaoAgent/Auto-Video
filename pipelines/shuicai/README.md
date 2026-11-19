# shuicai · 水彩笔刷（Watercolor Brush）

一笔一笔湿接湿的水彩，颜色在纸上自己走、自己干、自己留边。

示例工程 `projects/012_aus/`：《从旱到涝》，113.6 s / 1920×1080 / 24 fps。

## 结构

```
shuicai/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 lemo-opuscar 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── shuicai.py      单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_aus/
| `index.html` | 传统 script 顺序加载（非 module）：aus.js → engine.js → plants.js → scene.js → main.js |
| `engine.js` | 笔刷引擎：湿接湿、边缘积水、纸纹吸收 |
| `scene.js` | 这一页的世界与 DUR 113.6 |
| `plants.js` | 植物（叶子、茎、花） |
| `main.js` | 时间轴、镜头、字幕 |
| `aus.js` | 澳洲的旱涝事实层（FACTS.md 是它的出处） |
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `shuicai.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | 无头浏览器 |

字体：`python tools/sync_fonts.py --fetch` 现取（`assets/fonts/fonts.json` 里记着地址与指纹）。
本工程渲染时的字体落点由 `sync_fonts.py --pipeline shuicai` 负责。

## 跑一条

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline shuicai
python shuicai/scripts/shuicai.py probe  012_aus
python shuicai/scripts/shuicai.py stills 012_aus --times 3,12,28
python shuicai/scripts/shuicai.py render 012_aus
python shuicai/scripts/shuicai.py qa     012_aus
```

## 新建一条片子

```bash
python shuicai/scripts/shuicai.py new 013_xxx
```

复制后改这一页的世界、时间轴与字幕文本，再 `sync_fonts.py --pipeline shuicai` 补字体。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由本仓库代码生成，无生成图、无第三方素材 |
| 字体 | 见 `CREDITS.md`（均 SIL OFL 1.1） |
| 技法 | lemo-opuscar `styles/watercolor/demo`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
