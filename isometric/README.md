# isometric · 等距微缩世界管线

一帧是一个从固定 45° 看下去的小世界：方形地块坐在厚底座上，块与块之间有缝；低多边形、圆角、平涂友好色、浅色背景、软太阳和接触阴影。信息由世界本身讲：路线画在地上、包裹在流、数字长在堆上、钟立在杆上。

首个实例：`template/`（044《阿努纳奇》第一段，30.4 s / 1920×1080 / 30 fps）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/isometric.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/isometric.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/isometric.py check  projects/<名字>
python scripts/isometric.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/isometric.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/isometric.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "isometric_片名_样片_1080p"
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

- **世界就是论证**：每个阶段一块地，流程是地上能看见的路线/传送带/车流，数字长在发生的地方（杆上的卡片、堆上的计数器、阶段钟）。
- **地块先建，路线后画**：`W.tile({x,z,w,d,top,at})` 建地；`W.route(pts, {at,dur})` 画路线（路线会找脚下的地块，跟着抬升）。
- **四块地按之字形排**：样片 `hall(-13,0) → mine(-3,2) → lab(7,-1) → town(17,2)`，在 16:9 里从左到右读；直线排会斜着跑出画。
- **镜头一条连续**：`W.camera([{ at, fit:[...], dur, room:{top,bottom}, min, drift }])`，默认 1.4 s 缓入缓出；拉远看系统、横移跟流程、推近讲细节；只在万不得已时 `cut:true`。
- **聚焦抬升**：`W.focus([tiles|parts|movers], a, b, { dim, lift })` 把正在讲的地块抬起、其余变灰；和时间点对齐。
- **信息卡**：`W.label(anchor,{text,sub})`、`W.counter`、`W.timer`、`W.title`；卡是 48 px、标题 92 px，杆子会自动缩短避免出画。
- **时间**：`W.sky([[t,'day'],[t2,'dusk'],[t3,'night']])`，夜段窗户和路灯自己亮。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
