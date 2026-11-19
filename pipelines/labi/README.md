# labi · 蜡笔儿童绘本（Crayon Picture Book）

一页绘本当着你的面画出来：蜡笔在带齿的暖白纸上走，水彩最后洗过，把白蜡笔藏起来的星星露出来。

示例工程 `projects/012_moon/`：《月亮睡不着》The Moon Can't Sleep，52 s / 1248 帧 / 1920×1080 / 24 fps。

## 结构

```
labi/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 开源风格库 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── labi.py           单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_moon/
    ├── index.html        canvas#gl（WebGL2）+ fonts/fonts.css
    ├── main.js           等字体加载 → 挂 window.DUR / EV / SUBS / render / READY
    ├── gl.js             WebGL2 合成器（纸齿、蜡附着、knock-out、水彩、浮雕）
    ├── crayon.js         画笔（带收尖的线、锯齿排线、手写字）
    ├── rig.js            部件遮挡与 knock-out、肢体管
    ├── chars.js          女孩 / 羊 / 月亮 / 星星
    ├── world.js          这一页：房子、树、草坡、梯子、白蜡星、水彩带
    ├── film.js           时间轴、一次性镜头、事件、字幕
    ├── end.js            桌上的书、翻页、The End
    ├── pal.js            调色板常量
    ├── lib.js            数学工具（原库 core/lib.js 的工程内副本）
    ├── sheet.js / test.js 模型表与试画页（?test=model&page=girl）
    ├── subs.json         字幕行（SRT 从这里导出）
    └── fonts/            渲染前由 tools/sync_fonts.py 落位（7 款 ttf，不进仓库）
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `labi.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | `node node_modules/playwright-core/cli.js install chromium-headless-shell` |
| WebGL2 | SwiftShader 即可 | 无头默认软渲染；出现全黑帧用 `LEMO_ANGLE=swiftshader` |
| 7 款手写体 | OFL 1.1 | `python tools/sync_fonts.py --fetch` 现取 |

**不依赖 three**：合成器是手写 WebGL2，画笔是 Canvas 2D。

## 跑一条

```bash
python tools/sync_fonts.py --fetch
python tools/sync_fonts.py --pipeline labi        # 7 处落点
python labi/scripts/labi.py probe  012_moon
python labi/scripts/labi.py stills 012_moon --times 0.5,12,40,49
python labi/scripts/labi.py render 012_moon       # 1248 帧
python labi/scripts/labi.py srt    012_moon
python labi/scripts/labi.py mux    012_moon       # 需要项目自带 voice/voice.wav
python labi/scripts/labi.py qa     012_moon
```

这条线可以纯默片：没有旁白时只跑 `render` + `srt`，音乐与拟音由你自己的素材补。

## 新建一条片子

```bash
python labi/scripts/labi.py new 013_xxx
```

复制后改五处：`film.js` 的 `DUR` / `LINES` / 事件、`world.js` 的这一页、`chars.js` 的角色、
`subs.json` 的字幕、`end.js` 的结尾字。配色在 `pal.js`，12 支蜡笔与那支水彩的选择写进 `pipeline.json` 的 `spec.palette`。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由 `gl.js` / `crayon.js` / `world.js` / `film.js` 代码生成，无生成图、无第三方素材 |
| 字体 | Patrick Hand（Patrick W. G.）、Gaegu（Kwon/Google）、Short Stack、Gochi Hand、Caveat Brush、Sniglet，均 SIL OFL 1.1 |
| 技法 | 开源风格库 `styles/crayon-book`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
