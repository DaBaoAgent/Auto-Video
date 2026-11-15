# shadow · 皮影戏管线

一帧是一块打在木质台框里的素白幕：透光牛皮影人、操纵杆、红纸签、灯暗换场。首个实例：`template/`（044《阿努纳奇》第一段，30.3 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/，含 rods.js）
python scripts/shadow.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/shadow.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/shadow.py check  projects/<名字>
python scripts/shadow.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/shadow.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/shadow.py deliver projects/<名字> \
  --chugao 出稿/<编号>_<选题> --name "shadow_片名_样片_1080p"
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器 + `rods.js` 控制杆 helper（BB-Video MIT） |
| `scripts/` | 建工程、配音对齐、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 阿努纳奇样片完整工程（无音频与成片） |

## 风格要点

- **一物一杆**：皮影不是贴在幕布上的剪纸，而是插着签子的舞台道具。每个有意义的道具都用 `rp()` / `SHADOW_RODS.mount()`：先画从道具底部延伸到台框下的深棕操纵杆（`#2A1A10`，约 4 px），再画道具，整组以下端为轴 `rotate`，加 0.5–2° 的慢摆和小幅上下浮动。样片里的山、草、月亮、书、猿、罐子、双螺旋、泥板、剪刀、细菌全部带杆。
- **每件道具自己会动**：书页开合、罐盖跳、螺旋脉动、泥板抖、剪刀开合、菌毛摆、草叶一根根弯。`frame(t, g, o)` 里给每件道具一个自己的小动作；不动就会读成贴纸。
- **场景至少两件活的边缘道具**：左右草、山、月亮、云放在边缘，中间留给演员；讲台词时再让一件道具跟着动。
- **人物先定妆，再逐场调用**：`Y.cast({ 作者: { kind, look, colors }, … })` 定脸型/胡子/帽子/袍色，之后每场 `Y.puppet(sc, { who: '作者', … })`。同场两个人至少两处不同（脸谱、胡子、帽子、袍色、胖瘦、高矮）。
- **动作密度 1.2–1.5 秒一个**：`walk / talk / point / bow / fight / fall / lie / rise / sink / sway / weep / turn / exit / dance / ride` 串起来；一个人物整句站着不动就是死气。
- **换场就是灯暗灯亮**：`Y.change(at, dur, { to, color })`，在灯最暗的一刻换景；最多每 4 秒一次。灯色 `warm` / `red`（战火）/ `cold`（夜、逃亡、悲伤）承载情绪，不要靠花哨转场。
- **字是幕上的字**：`Y.placard` 红纸签挂名字/地点/年份（≤6 字可竖排，`over: figure` 自动挂在人物头顶）；`Y.title` 大字楷书；`Y.endcard` 收尾（`seal` 不给就不盖章）。
- **样片的五场戏**：`scene(a, z, o)` 用 `F.layer` 叠层，`Y.lamp(0.9, { to: 1, dur: 1.2 })` 从暗到亮开场；第 3 场用 `Y.map` + `Y.route` 把「二十多种语言」画成地图路线；第 5 场用自定义 `scissors` / `bacteria` 带杆道具完成反转。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
