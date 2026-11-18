# gangbi · 钢笔淡彩（Urban Sketch · Pen & Wash）

一页当场画的速写：深褐细线先走，水彩后落、跟线错位一两像素，颜色从一个源点长满整页。

示例工程 `projects/012_wind/`：《风去了哪里》Where the Wind Went，33.4 s / 1920×1080 / 24 fps。

## 结构

```
gangbi/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 lemo-opuscar 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── gangbi.py         单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_wind/
    ├── index.html        canvas#c + 两个 @font-face（相对 fonts/）
    ├── main.js           只做一件事：按查询参数决定加载哪个模块（默认 film.js）
    ├── film.js           时间轴、镜头、表演、颜色到达、结尾字
    ├── world.js          整页公园（5120×2880 纸面坐标）
    ├── poses.js          人物姿势库
    ├── engine.js         笔 / 洗 / 到达场 / 合成器 / 人物 / 手写
    ├── subs.json         字幕行（SRT 从这里导出）
    └── fonts/            渲染前由 tools/sync_fonts.py 落位（不进仓库）
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度测量、质检 |
| Python | 3.11+ | 跑 `gangbi.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 `node_modules` |
| chromium-headless-shell | — | `node node_modules/playwright-core/cli.js install chromium-headless-shell` |
| Caveat / Reenie Beanie | OFL 1.1 | 字体不进仓库，`python tools/sync_fonts.py --fetch` 现取 |

**不需要 npm install three**：这套引擎是纯 Canvas 2D，没有三维依赖。

## 跑一条

```bash
python tools/sync_fonts.py --fetch                  # 第一次：按 assets/fonts/fonts.json 下载字体
python gangbi/scripts/gangbi.py probe  012_wind     # 看工程现状
python gangbi/scripts/gangbi.py stills 012_wind --times 3,12,28
python gangbi/scripts/gangbi.py render 012_wind     # 802 帧，单 worker 约 1 分钟出头
python gangbi/scripts/gangbi.py srt    012_wind
python gangbi/scripts/gangbi.py mux     012_wind    # 需要项目自带 voice/voice.wav
python gangbi/scripts/gangbi.py qa      012_wind
```

这条线**可以完全没有配音**（风格定义里就是这么写的）。没有配音时只跑 `render` + `srt`，
把画面当默片用；要配音就把 `voice/voice.wav` 放进去再 `mux`。

## 新建一条片子

```bash
python gangbi/scripts/gangbi.py new 013_harbour
```

复制后改四处：`film.js` 的 `DUR` 与事件、`world.js` 的地点、`subs.json` 的字幕、`film.js` 的 `NOTE` 与结尾字。换地点时配色参考 `pipeline.json` 的 `spec.palette`（公园 / 港口清晨 / 冬日市集三套）。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由 `engine.js` / `world.js` / `film.js` 代码生成，无生成图、无第三方素材 |
| 字体 | Caveat（Impallari Type）、Reenie Beanie（James Grieshaber），SIL OFL 1.1 |
| 技法 | lemo-opuscar `styles/urban-sketch`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
