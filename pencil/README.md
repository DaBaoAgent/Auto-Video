# pencil · 铅笔手绘动画管线

一帧是一张暖白动画纸：顶部三个定位孔、角落的 drawing 编号、柔和暗角；一切都用石墨画，先下浅蓝结构线，再压深勾线，排线/擦笔做阴影；角色是无脸的 gesture 小人，只在一个情绪峰值处晕开一点暖色。

首个实例：`template/`（044《阿努纳奇》第一段，30.4 s / 1920×1080 / 30 fps）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/pencil.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/pencil.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/pencil.py check  projects/<名字>
python scripts/pencil.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/pencil.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/pencil.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "pencil_片名_样片_1080p"
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

- **一镜到底，不切**：所有场景在一张长纸上沿 x 排开（样片 `X = { b:0, g:900, h:1500, m:2100, k:2850, cut:3600, bac:4350 }`），用 `D.move`/`D.follow` 走镜头。
- **画与画之间用 morph**：`D.morph(at, from, to)` 把两张画的线配对重画，球变地球、数字 8 变 24；不要硬切。
- **先结构后勾线**：`D.line/circle/ellipse/rect/poly/path` 默认 `construct:true` 先下蓝线，再压石墨；`clean:t` 让一组画在 t 之前保持蓝粗稿、t 之后才勾清。
- **人是无脸 gesture**：`D.figure({ x, y, height, face, look })`，用 `f.fig.walk/jump/sit/bow/cheer/look/gesture/reach`；人像用 `face:'back'` 或 `look:'silhouette'`，绝不画真人五官。
- **信息用铅笔的装置**：时间线 `D.timing`、序列 `D.onion`、对比 `D.versus`（赢的一边勾清+bloom，输的一边留蓝粗稿）、计数 `D.tally`、数字 `D.numeral`、标注 `D.note`/`D.ring`、光池 `D.light`、暖色 `D.bloom`。
- **只在峰值用颜色**：`D.bloom(at, { on, until })` 一两次；`--check` 超过 4 次或停留超过全片 1/3 会提醒。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
