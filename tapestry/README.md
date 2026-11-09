# tapestry · 贝叶挂毯 · 刺绣长卷管线

一帧是一扇看向一条长亚麻布卷的窗：布上的一切都用羊毛绣成，轮廓是茎针绣、填色是铺线压绣，脸和手留白亚麻；上下花边是鸟兽格，人物侧身、大头大鼻、大动作，树把场景隔开，题词是绣出来的「此处，…」。

首个实例：`template/`（044《阿努纳奇》第一段，30.5 s / 1920×1080 / 30 fps）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/tapestry.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/tapestry.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/tapestry.py check  projects/<名字>
python scripts/tapestry.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/tapestry.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/tapestry.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "tapestry_片名_样片_1080p"
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

- **一条布，一条镜头轨**：场景沿 x 排开（每场 1200–1500 单位），`B.scroll([[t,x],…])` 给镜头一条单调向前、起停平缓的轨道；全片不切，场景之间用树隔开。
- **先起草，再绣**：每个东西默认先以铅笔底稿出现在右缘（`sketch` 1.1 s），然后 `stitch`：针沿轮廓走 → 铺线 → 压绣；大树/拱门用 `grow`，大平面用 `lay`。
- **人是侧身挂毯人**：`B.figure('名字', { x, h, pose })`，用衣服/头饰/胡子区分身份；`c.pose`、`c.go`、`c.turn`、`c.nod`，人物不能站桩超过 9 s。
- **题词是绣出来的**：`B.caption('此处，…', { x, sub })`，主句 54、小字 34；一幕只留一条说明，别让两条说明在滚动时叠在一起。
- **推近看针脚**：`B.push(a, b, { on: node, pad }, { back, backDur })`，最多推到 3.4；用在齿轮、书页、日期、剪刀、细菌上。
- **信息用挂毯的装置**：数量用 `B.tally` 一颗一颗绣；年份绣在下花边 `B.margin`；机制用 `B.gear`/`B.wheel`；对比是两场并排，中间一棵树。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
