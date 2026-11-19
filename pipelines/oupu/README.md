# oupu · 欧普艺术管线

一帧是一套欧普艺术的画法：黑白条纹、同心环与棋盘在透镜里鼓起来，百叶窗式揭开产品。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（24 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/oupu.py new projects/<名字> --title "片名"
python scripts/oupu.py check projects/<名字>
python scripts/oupu.py stills projects/<名字> --times 2,5,8
python scripts/oupu.py render projects/<名字> --scale 0.6667
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

- **场是条纹/环/棋盘**：`Q.field()` 定图案与速度，`f.lens()` 在场上鼓出透镜；字和卡都放在透镜里。
- **变形即换场**：`f.morph(t, dur, 'rings'|'checker'|'spiral')` 做章节切换，不要用淡入淡出。
- **只有黑白 + 一个强调色**：红只用在关键词或一个标记上。
- **安全第一**：高频条纹可能引发不适，闪烁频率与对比度按 `STYLE.md` 第 0 节执行。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
