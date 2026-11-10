# laolang · 上海美影手绘赛璐璐管线

一帧是一幅青绿、橄榄、赭黄、锈红的手绘装饰绘景，前面站着平涂的赛璐璐角色：细而活的深褐勾线、硬边阴影、长鼻子大眼睛；4:3 圆角片门，30 fps 稳定版，每镜不同运镜。只学 1980 年上海美术电影制片厂《老狼请客》的**工艺与画面语言**，不复制角色、造型、题字、笑点、镜头或旋律。

首个实例：`template/` 是 **玄奘 60 秒样片**（62.200 s / 1920×1080 / 30 fps / 1866 帧）的完整工程。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，人物定稿见 [references/characters.md](references/characters.md)，24 动作见 [references/actions.md](references/actions.md)，样片方法见 [references/production.md](references/production.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/laolang.py new projects/<名字> --title "片名"

# 2. 现成配音 + 口播稿 → 词级时间轴
python scripts/laolang.py vo projects/<名字> --src 配音.wav --text 口播稿.txt --lead 0 --cut 62.16

# 3. 改 brief.md / storyboard.md / index.html / sound.js（score.js 可选，默认无 BGM）

# 4. 自检与抽帧
python scripts/laolang.py check  projects/<名字>
python scripts/laolang.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（整片；长片可 --from/--to 分段）
python scripts/laolang.py render projects/<名字> --fps 30

# 6. QA 与交付
python scripts/laolang.py qa projects/<名字>
python scripts/laolang.py short-qa out/video-16x9.mp4 review/shortqa
python scripts/laolang.py deliver projects/<名字> \
  --chugao 出稿/<编号>_<选题> --name "laolang_片名_样片_1080p"
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库；`short-qa` 另需 numpy + Pillow）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时（core/promo/goldenage/laolang/act/toon/cast-lite）+ 渲染器 + 合成音效/配乐（BB-Video MIT） |
| `toon-cast/` | 人物/动作源码、构建脚本与 60 秒样片冻结快照 |
| `scripts/` | 建工程、现成配音对齐、渲染、QA、交付 |
| `references/` | 风格、人物、动作、制作方法、分镜模板、验收清单 |
| `template/` | 玄奘 60 秒样片完整工程（无音频与成片） |

## 风格要点

- **4:3 片门**：960×720 逻辑页居中，左右留黑；圆角、颗粒、暗角；输出 1920×1080 / 30 fps。
- **稳定版**：`drawings: 30`、`boil: 0.04`；关闭片门晃动；灯光 0.008；颗粒静态；无逐帧灰尘。
- **人物景别**：全身 0.24–0.26；头靠横中线（720 高 y=360–430）；脚下留白 100–160 px；不切头脚。
- **运镜**：每镜不同（推/拉/横移/跟拍/升降）；转场就是切，收尾用暗场或圈入圈出。
- **动作**：24 个命名动作 + 22 个姿态；走路脚不滑、停步有下沉回弹；表情先停一拍再动。
- **声音**：旁白画外、人物不对口型；旁白 + 音效、无 BGM；音效现场合成；-16 LUFS / 真峰值 -1.5 dBTP。
- **原创**：不复制《老狼请客》的任何角色、造型、题字、笑点、镜头或旋律；真实人物不做漫画像。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
