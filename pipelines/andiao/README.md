# andiao · 暗调励志管线

一帧是一套暗调励志的画法：几乎全黑的房间里只有一盏有动机的灯；一个角色用眼睛和眉毛演完整个故事。 运行时已完整入库，`new` 复制 `template/` 与 `runtime/` 到工程 `lib/`，`render` 直接调本地 `runtime/render.mjs`，不再需要上游 checkout。

首个实例就是 `template/` 的起步工程（25 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
python scripts/andiao.py new projects/<名字> --title "片名"
python scripts/andiao.py check projects/<名字>
python scripts/andiao.py stills projects/<名字> --times 2,5,8
python scripts/andiao.py render projects/<名字> --scale 0.6667
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

- **一盏有动机的灯**：每个镜头只留一个光源（手机屏、闹钟、台灯、月光、黎明），其余压到近黑。
- **一个角色**：`L.cast()` 固定一个人，情绪只用眼睛和眉毛；不要加配角。
- **动作要具体**：躺床上滑手机、被闹钟拽起来、把手机放到门外，一个镜头一个动作。
- **光写事实**：时钟、仪表、一夜的线、头部 X 光，数字与刻度都要有 brief 来源。

## 许可

运行时代码来自 [开源风格包](https://github.com/开源风格包)（MIT），见 `runtime/LICENSE` 与 [CREDITS.md](CREDITS.md)。
