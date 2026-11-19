# keli · 扁平颗粒插画管线

一帧是一套扁平颗粒插画的画法：两种专色印在暖纸上，体积与光全靠点状颗粒；一条地平线把时代一段段长出来。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（16 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/keli.py new projects/<名字> --title "片名"
python scripts/keli.py check projects/<名字>
python scripts/keli.py stills projects/<名字> --times 2,5,8
python scripts/keli.py render projects/<名字> --scale 0.6667
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器（BB-Video MIT） |
| `scripts/` | 建工程、自检、抽帧、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 起步工程（无音频与成片） |

## 风格要点

- **一条地平线**：所有东西站在同一条 `G.ground()` 上，高度用 `L()` 换算；不要悬浮。
- **两专色 + 纸色**：主色、辅色、纸色；体积与光只用 `G.grain()` 点状颗粒，不用渐变。
- **一章一个舞台**：每个时代/阶段在原地长出来，用 `G.iris()` 从细节开章，不要硬切。
- **数字进画面**：价格牌、表盘、时间尺、成排的物件都是信息，不要只放一句字。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
