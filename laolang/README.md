# laolang · 上海美影手绘赛璐璐管线

一帧是一幅青绿、橄榄、赭黄、锈红的手绘装饰绘景，前面站着平涂的赛璐璐角色：细而活的深褐勾线、硬边阴影、长鼻子大眼睛；4:3 圆角片门，30 fps 稳定版，每镜不同运镜。只学 1980 年上海美术电影制片厂《老狼请客》的**工艺与画面语言**，不复制角色、造型、题字、笑点、镜头或旋律。

首个实例：`template/` 是 **玄奘 60 秒样片**（62.200 s / 1920×1080 / 30 fps / 1866 帧）的完整工程。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，人物定稿见 [references/characters.md](references/characters.md)，24 动作见 [references/actions.md](references/actions.md)，口播同步与分镜节奏见 [references/sync.md](references/sync.md)，样片方法见 [references/production.md](references/production.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/laolang.py new projects/<名字> --title "片名"

# 2. 现成配音 + 口播稿 → 词级时间轴
python scripts/laolang.py vo projects/<名字> --src 配音.wav --text 口播稿.txt --lead 0 --cut 62.16

# 2.5 口播校准（字幕和口播对不上就先做；见 references/sync.md）
python scripts/laolang.py asr projects/<名字>/audio/narration.wav --out projects/<名字>/review/asr_a.json --start 0 --dur 180
python scripts/laolang.py asr projects/<名字>/audio/narration.wav --out projects/<名字>/review/asr_b.json --start 180
python scripts/laolang.py rebuild projects/<名字> --asr review/asr_a.json review/asr_b.json --full-before 180 --sample-end 20.12

# 3. 改 brief.md / storyboard.md / index.html / sound.js（score.js 可选，默认无 BGM）
#    分镜按口播切：每镜 2–4 秒，切点在句首/词首或 ≥0.12 s 停顿

# 4. 自检与抽帧（没有 sample.html 的工程先验 index.html，见下方说明）
python scripts/laolang.py shots  projects/<名字>/sample.html
python scripts/laolang.py check  projects/<名字>
python scripts/laolang.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（整片；长片可 --from/--to 分段）
python scripts/laolang.py render projects/<名字> --fps 30

# 6. QA 与交付
python scripts/laolang.py sync  projects/<名字> --html sample.html --video out/video-16x9.mp4 --ocr
python scripts/laolang.py qa projects/<名字>
python scripts/laolang.py short-qa out/video-16x9.mp4 review/shortqa
python scripts/laolang.py deliver projects/<名字> --name "片名" --title "片名"
```

交付统一到 `out/<序号> <片名>/`：成片 + `封面-4比3.png`（2048×1536）+ `封面-3比4.png`
（1536×2048）+ `发布信息.txt`（两行制：标题 + 4 话题），其余进 `源文件/`。
封面与发布信息一律由 `D:\@kaifa\fengmian` 生成（工程根放 `delivery.json`）。见 `references/delivery.md`。

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（主脚本只用标准库；`short-qa` 需 numpy + Pillow；`asr` / `sync` 需 faster-whisper + numpy；
  本机用 `D:\@kaifa\tools\python-media\Scripts\python.exe`）
- Dabao-OCR 常驻服务（`127.0.0.1:18224`），`sync --ocr` 用；没起就跳过 `--ocr`

`sync` 默认包含音频滞后与成片 ASR 复核；暂时不想跑 ASR（比如没有 faster-whisper）时加 `--no-audio`，
只查分镜和字幕。单独跑 `shots` / `captions` / `audio` / `ocr` 会把报告写到
`review/sync_qa_<cmd>.json`，完整 `sync` 才写 `review/sync_qa.json`，单项检查不会覆盖验收报告。

`new` 从 `template/` 复制，只有 `index.html`，**没有 `sample.html`**。还没做样片的工程直接把
`index.html` 传给 `shots` / `sync`（`--html index.html`）；只有做了 20 秒样片、有了
`sample.html` + `sample_timeline.js` 才用样片页校验。

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时（core/promo/goldenage/laolang/act/toon/cast-lite）+ 渲染器 + 合成音效/配乐（BB-Video MIT） |
| `toon-cast/` | 人物/动作源码、构建脚本与 60 秒样片冻结快照 |
| `scripts/` | 建工程、配音对齐、ASR 重建时间轴、分镜/同步校验、渲染、QA、交付 |
| `references/` | 风格、人物、动作、口播同步与分镜节奏、制作方法、分镜模板、验收清单 |
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
