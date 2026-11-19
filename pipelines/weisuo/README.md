# weisuo · 孟菲斯微缩（Memphis Diorama）

一座 2D 形状搭起来的 3D 微缩小镇，一年四季在框里转，人在一格一格走。

示例工程 `projects/012_pomelo/`：《柚子镇四季》，45.0 s / 1920×1080 / 24 fps。

## 结构

```
weisuo/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 开源风格库 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── weisuo.py      单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_pomelo/
| `index.html` | importmap 指 ./lib/three.module.js；两个 canvas（#gl 离屏、#c 上屏） |
| `main.js` | 时间轴（DUR 45）、一年的四段、镜头、字幕三行、TEXTS |
| `memphis.js` | 微缩世界的搭建与材质：Diorama、setNight/setLamp/setWave/setZone/setDusk/setSeason、flat/mesh/box |
| `people.js` | 小人（person/walk/limb），12 fps 步进 |
| `fonts/fonts.css` | SC（思源黑体子集）、IT（Inter Tight）、PM（IBM Plex Mono） |
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `weisuo.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | 无头浏览器 |

字体：`python tools/sync_fonts.py --fetch` 现取（`assets/fonts/fonts.json` 里记着地址与指纹）。
本工程渲染时的字体落点由 `sync_fonts.py --pipeline weisuo` 负责。

## 跑一条

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline weisuo
python weisuo/scripts/weisuo.py probe  012_pomelo
python weisuo/scripts/weisuo.py stills 012_pomelo --times 3,12,28
python weisuo/scripts/weisuo.py render 012_pomelo
python weisuo/scripts/weisuo.py qa     012_pomelo
```

## 新建一条片子

```bash
python weisuo/scripts/weisuo.py new 013_xxx
```

复制后改这一页的世界、时间轴与字幕文本，再 `sync_fonts.py --pipeline weisuo` 补字体。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由本仓库代码生成，无生成图、无第三方素材 |
| 字体 | 见 `CREDITS.md`（均 SIL OFL 1.1） |
| 技法 | 开源风格库 `styles/memphis-diorama/demo`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
