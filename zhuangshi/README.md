# zhuangshi · 装饰艺术（Art Deco）

金线、漆面黑、阶梯边：酒店大堂在午夜亮起来，一切都从中心展开。

示例工程 `projects/012_starlight/`：《星光酒店午夜》，39.0 s / 1920×1080 / 24 fps。

## 结构

```
zhuangshi/
├── SKILL.md              入口命令、画面语法、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 lemo-opuscar 迁入的来源与差异
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── zhuangshi.py      单一入口：probe / stills / render / mux / srt / qa / new
└── projects/012_starlight/
| `index.html` | module 入口 |
| `main.js` | 入口：挂 DUR / render / READY |
| `film.js` | 时间轴（DUR = TL.DUR） |
| `timeline.js / timeline.json` | 时间表与场景切换 |
| `chars.js` | 人物（12 fps 步进） |
| `engine/deco.js` | 几何与金线：gline（刻线 + 金色渐变 + 细高光）、扇、日芒、阶梯、光晕 |
| `engine/type.js` | 装饰字体排版：从中心展开的标题条 |
| `engine/bulbs.js` | 灯泡招牌（沿字形骨架排灯泡） |
| `engine/cam.js` | 相机与卡片变换 |
| `scenes/lobby.js · roof.js · stairs.js · tower.js` | 四个场景：大堂、天台、楼梯、塔 |
| `shots_*.js` | 各场景的镜头表 |
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度、质检 |
| Python | 3.11+ | 跑 `zhuangshi.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 |
| chromium-headless-shell | — | 无头浏览器 |

字体：`python tools/sync_fonts.py --fetch` 现取（`assets/fonts/fonts.json` 里记着地址与指纹）。
本工程渲染时的字体落点由 `sync_fonts.py --pipeline zhuangshi` 负责。

## 跑一条

```bash
python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline zhuangshi
python zhuangshi/scripts/zhuangshi.py probe  012_starlight
python zhuangshi/scripts/zhuangshi.py stills 012_starlight --times 3,12,28
python zhuangshi/scripts/zhuangshi.py render 012_starlight
python zhuangshi/scripts/zhuangshi.py qa     012_starlight
```

## 新建一条片子

```bash
python zhuangshi/scripts/zhuangshi.py new 013_xxx
```

复制后改这一页的世界、时间轴与字幕文本，再 `sync_fonts.py --pipeline zhuangshi` 补字体。

## 数据来源

| 东西 | 出处 |
|---|---|
| 画面 | 全部由本仓库代码生成，无生成图、无第三方素材 |
| 字体 | 见 `CREDITS.md`（均 SIL OFL 1.1） |
| 技法 | lemo-opuscar `styles/art-deco/demo`，见 `MIGRATION.md` |

## 许可

- 字体：SIL Open Font License 1.1
- 本管线代码：随 Auto-Video 仓库（MIT）
