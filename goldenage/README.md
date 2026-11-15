# goldenage · 美式黄金卡通管线

一帧就是一张 40–50 年代美国院线短片的印片：深蓝夜景、暖黄窗光、Art Deco 高楼和能读出砖缝的墙面，前面是带硬边阴影的墨线角色；画面有轻微片门晃动、彩色颗粒和圆角片门。

首个实例：`template/`（044《阿努纳奇》第一段，30.3 s / 1920×1080 / 30 fps）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/goldenage.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/goldenage.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/goldenage.py check  projects/<名字>
python scripts/goldenage.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/goldenage.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/goldenage.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "goldenage_片名_样片_1080p"
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器（BB-Video MIT） |
| `scripts/` | 建工程、配音对齐、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 阿努纳奇样片完整工程（无音频与成片） |

## 风格要点

- **先定因果链，再定镜头**：8 句旁白 = 8 个镜头，每个镜头只做一件事；上一镜的落点就是下一镜的起点（书砸楼 → 楼顶打开 → 基因罐 → 人 → 书堆 → 泥板 → 剪刀 → 细菌）。
- **背景是画，角色是赛璐璐**：`skyline`、`drawTower`、`bg` 画背景；`wk`（工人）、`moon`（月亮）、`cel`/`tube`/`limb` 画角色。两种质感故意不统一，这是风格本身。
- **只在动作上切**：`G.shot(a, b, fn, { cut: true })` 默认硬切；大转场用 `G.iris` 收/开，不要用叠化。
- **每个大动作三拍**：预备（反方向）→ 冲击帧 → 弹性恢复。楼用 `drawTower` 的 `sq/sk/bul/bend/rattle`，球用 `moon` 的 `sx/sy/sa`，人用 `wp()` 姿态 + `K()` 关键帧。
- **声音是动作的一部分**：`G.bonk(at, gain)` 是「whack + boing」；`G.pause` 把音乐抽空，但音效还能落。最大的笑点是安静。
- **字是画上去的**：`G.write(text, { size, at, until, color, pop })`，标题 96–170、关键词 60–90、标签 26–44；字可以 `sag` 下垂、`tilt` 歪、`pop` 逐字弹。
- **信息用风格自己的装置**：步骤 `G.steps`、对比 `G.versus`、数字 `G.towers`（摩天楼柱状图）、单卡 `G.card`；最好的形式永远是一个 gag。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
