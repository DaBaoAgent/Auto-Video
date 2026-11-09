# blueprint · 蓝图工程图管线

一帧是一张蓝晒工程图纸：深蓝纸、白色细线、构造线先出、尺寸与 leader 标注、真实啮合的机构、红铅笔唯一强调。首个实例：`template/`（018《玄奘》前 10 秒，12.1 s / 1080p）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/blueprint.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴（默认 bgm:true，用内置配乐）
python scripts/blueprint.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/blueprint.py check  projects/<名字>
python scripts/blueprint.py stills projects/<名字> --times 2,5,7.5,10.2

# 5. 渲染（样片可 720p；默认内置配乐）
python scripts/blueprint.py render projects/<名字> --scale 0.6667

# 6. 交付
python scripts/blueprint.py deliver projects/<名字> \
  --chugao 出稿/<编号>_<选题> --name "blueprint_片名_样片_1080p"
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
| `template/` | 玄奘前 10 秒 blueprint 样片工程（无音频与成片） |

## 风格要点

- **一个主体一张图纸**：`B.sheet({ a, enter:'expose'|'slide'|'cut' })` 换主体；同 sheet 只允许推近/拉远（`S.cam` + `S.fit`），不要横移过纸去讲下一个主体——那会读成在滑动纸张。样片用两张 sheet：洞窟剖面（S）与壁画立面（S2，l2 曝光进来）。
- **先构造线，后终线，再标注**：`cons:true` 先下细构造线，终线用描图笔 `pen:true` 压上；`at` 是线画完的时刻，不是开始。尺寸/leader/文字在实体线之后落。
- **标题块与视图**：`B.block` 写图号/比例/张数/日期/作者；`B.view` 定局部坐标；`B.title` 是带粗细分隔线的视图标题（`SECTION A–A` / `ELEVATION B`）。
- **机构真的会动**：`B.clock` + `B.mech` 的齿轮/擒纵/凸轮/齿条按真实齿数、模数、中心距和转向啮合；`M.spin` 标出转向与转速。样片里门扇是 `B.group` 绕铰链 `G.to({ rot:78 })` 打开。
- **细节 = 推近 + focus**：先在平面上画 callout 圆和字母，再 `S.cam` 推近、`B.focus` 让其余线变暗；细节的 leader/尺寸画在第二个同位置 view 上（不被 focus 压暗），字号除以 zoom。
- **红笔是唯一强调色**：`B.pencil({ kind:'ring'|'underline'|'tick'|'cross'|'arrow' })`，一个想法最多一处；样片只在金箍上圈一次（8.15 s）。
- **信息密度**：图上每句至少一个新线/新标注/新尺寸；不要用「蓝纸上的幻灯片」——没有制图内容的字不算。
- **数字必须有来源**：齿数、比例、转速、尺寸、年代都写在 `brief.md`；没有公开数据就用内部自洽的示意值，并在图上标「示意 NTS」。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
