# yugao · 电影预告管线

一帧是一套电影预告的画法：2.39:1 遮幅的好莱坞预告：青橙调、黑底金属字卡、钢琴一记、BRAAM 与标题砸屏。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（34 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/yugao.py new projects/<名字> --title "片名"
python scripts/yugao.py check projects/<名字>
python scripts/yugao.py stills projects/<名字> --times 2,5,8
python scripts/yugao.py render projects/<名字> --scale 0.6667
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器（开源风格包 MIT） |
| `scripts/` | 建工程、自检、抽帧、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 起步工程（无音频与成片） |

## 风格要点

- **2.39:1 遮幅**：上下黑边是画框的一部分，字卡也只放在画框里。
- **段落按预告结构**：open / world / turn / rise / climax / title / tail，`F.section()` 的名字要和 `score.js` 对齐。
- **黑底字卡是一句话**：一句一张，金属字，不堆两句；每个字都要能回到 brief。
- **声音是叙事**：钢琴一记、时钟、BRAAM、太鼓，按 `sound.js` 的段落在关键切点落。

## 许可

运行时代码来自 [开源风格包](https://github.com/开源风格包)（MIT），见 `runtime/LICENSE` 与 [CREDITS.md](CREDITS.md)。
