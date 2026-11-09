# parable · 3D 火柴人寓言管线

一帧是纯黑虚空 + 会反光的地面：两个粗白火柴人，圆头悬在肩上，圆角四肢、深色描边、头顶一块等宽大写小标签；同样的道具随时间生长（砖、台阶、堆、硬币），只有一个红色东西承载意义；固定广角，最后淡出。

首个实例：`template/`（044《阿努纳奇》第一段，3 分钟样片 178.3 s / 1280×720 / 30 fps；短寓言 15–45 s）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/parable.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/parable.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/parable.py check  projects/<名字>
python scripts/parable.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/parable.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/parable.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "parable_片名_样片_1080p"
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

- **一个对比，两个角色，一堆材料**：先写清「两人做同一件事的不同做法 → 可见后果」；第三个角色只当过路人。样片用左/中/右三个身份位，但每幕只让一个对比成立。
- **固定广角，不切**：`P.figure` 摆位，`P.onFrame` 只做轻微相机呼吸（样片 3 分钟版用一条相机关键帧轨道，短版完全固定）；时间靠计数器和道具生长表示。
- **动作是叙事**：`a.pose`、`a.walk`、`a.climb`、`a.sit`、`a.lie`、`a.lay(stack)`、`a.inspect`、`a.tend`、`a.look`；重叠动作（hips → torso → arms → head）让火柴人活。
- **道具会生长**：`P.wall({ cols, rows, times | count, ghost:true })`、`P.steps`、`P.pile`、`P.coins`；红 ghost 砖表示「已经赚到的那一块」。
- **一个红色**：`P.item(kind, { accent:true })` 或 stack 的 `ghostColor:'accent'`；全片只能有一个红东西。
- **字极少**：标签是角色（2–6 字），`P.counter` 是时间，`P.title` 是收尾一句；屏幕字全部来自 `brief.md`，数字要真算。
- **声音是道具**：砖落一声干土响，计数滴答，揭示时一声玻璃钟；音乐是叙述者。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
