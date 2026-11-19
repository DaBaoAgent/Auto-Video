---
name: lvdong
description: 用「剪影律动」（Silhouette Rhythm）把一段口播稿做成 16:9 剪影短片：纯黑剪影站在落日与水面前、姿势落在拍上、关键一拍拍冻结；画面全部由代码绘制（不用 AI 生图、不用素材），配乐与 foley 由 score.json 声明、sound.py 合成。当用户说「剪影律动」「剪影短片」「Silhouette Rhythm」「黑色剪影配落日」「用 lvdong 做一支」时使用。
---

# lvdong：剪影律动短片

一支片子的形态是：**一段中文旁白 + 一片会落日的天空 + 一群黑色剪影在水面上按拍子换姿势 + 一行一行跟语音走的奶油色字幕**，1920×1080。

这条管线不画新东西，它**固化的是一套能反复走的顺序**：先把声音（旁白切片 → 转写 → 对齐 → 字幕）钉死，再用 `score.json` 把音乐和 foley 摆到拍点上，最后用一份 `film.js` 时间轴把每一镜画出来。三样东西（时间、拍点、剪影）一旦分开管，返工就不会相互踩。

首个实例：`projects/004_玛雅巨人文明/` —— 玛雅巨人文明口播稿第 1–3 段，58.0 s / 19 条字幕 / 12 段 15 镜 / 90 BPM。音频、成片、字体不入库，见 `MIGRATION.md`。

## 一分钟判断

- 适合：有中文旁白（或能写一段）、题材讲得清"一群人/一排人/七个符号"这类**集体动作与清点**、想要纯粹的形式美与节奏感、16:9 横屏、知识类/悬案类口播。
- 不适合：需要精确图解与标注（`blueprint` / `swiss`）；需要真实影像（`shipai` / `jilupian`）；需要手绘叙事（`laolang`）；竖屏信息流（`shadow` / `shipai`）；人物要有表情与细节（剪影里没有脸）。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| 旁白 `voice/source_full.wav` | 是 | 现成的配音，整条给进来；管线自己切到 `voice_seconds`，不重录不变声 |
| 口播稿（`--script`） | 是 | 空行分段；`project.json` 的 `paras` 决定片子用前几段 |
| 剪影演员表 `cast.js` | 是 | 从 `template/cast.js` 起手，按题材加演员（碑、仓库、金字塔、巨人…） |
| 时间轴 `film.js` | 是 | 从 `template/film.js` 起手；`SEC` 段表按拍界切 |
| 谱 `score.json` | 是 | 从 `projects/004_玛雅巨人文明/score.json` 复制后重写 |
| `vendor/runtime/style-frames.mjs` | 是 | 仓库内抓帧：puppeteer-core + 本机 Edge/Chrome，页面协议 `__ready` / `renderAt` |
| 字体 | 是 | `NotoSansSC.ttf` + `Anton-Regular.ttf` 放 `lvdong/assets/fonts/`（OFL，不入库） |
| ffmpeg / node / python+numpy+scipy+soundfile | 是 | `LVDONG_FFMPEG` / `LVDONG_PY` 可指定；默认当前 python（需 numpy/scipy/soundfile），或用 `LVDONG_PY` 指定 |
| AI 生图 | 否 | **完全不用**。天空、水面、剪影、涟漪、水珠、石碑、仓库全由代码画 |

## 目录

```text
lvdong/
├── SKILL.md                 本文档：流程与判据
├── README.md                快速开始（照抄即可跑）
├── MIGRATION.md             从 films/004_maya_part1 迁过来的账
├── CREDITS.md               许可与来源
├── pipeline.json            定版参数（画幅 / 拍 / 调色 / 声音 / 校验）
├── scripts/
│   ├── lvdong.py            编排：new / transcribe / align / cues / sound / stage / still / video / mux / srt / poster / check / beats / make
│   ├── transcribe.py        逐词转写（faster-whisper，默认 small/CPU int8）
│   ├── align.py             口播稿 ↔ 转写 逐字符对齐（difflib），出段落边界 + 每字时间
│   ├── make_cues.py         切字幕行（11–16 字、贴句读、不短于 1.6 s）
│   └── sound.py             乐器引擎 + 读 score.json 出 mix.wav 与三条 stem
├── template/
│   ├── index.html           正片页（三层 canvas + 字体 + 脚本）
│   ├── cast.js              演员表（人 / 巨人 / 帽子 / 碑 / 仓库 / 金字塔 / 工具）
│   └── film.js              时间轴骨架（缓动、相机、both/solo、SEC、type、render）
├── references/
│   ├── style.md             画风判据与本片定下的数值
│   ├── score.md             score.json 每个键怎么填、拍点怎么摆
│   ├── pitfalls.md          19 条实撞过的坑
│   └── delivery.md          验收清单与交付物规格
├── assets/fonts/            字体（gitignore）
└── projects/
    └── 004_玛雅巨人文明/      首个实例（参数 + 谱 + 演员表 + 时间轴 + 处理方案）
```

## 流程

### 0 准备（一次）

```powershell
$env:LVDONG_FFMPEG = "ffmpeg"
# 字体（OFL，不入库）：从任意一支已做好的片子，或自己下载
New-Item -ItemType Directory -Force -Path D:\@kaifa\Auto-Video\lvdong\assets\fonts
Copy-Item <字体目录>\*.ttf pipelines\lvdong\assets\fonts\
```

### 1 建工程

```powershell
cd D:\@kaifa\Auto-Video\lvdong
python scripts\lvdong.py new 005_你的题目 `
    --script "D:\@kaifa\@\出稿\005_你的题目\口播稿.md" --paras 3 --duration 58
```

把旁白整条放到 `projects/005_你的题目/voice/source_full.wav`。

### 2 声音先行：转写 → 对齐 → 字幕

```powershell
python scripts\lvdong.py transcribe 005_你的题目
python scripts\lvdong.py align      005_你的题目
python scripts\lvdong.py cues       005_你的题目
```

- `align` 打印 `char match rate`：**低于 75% 一定有问题**（转写吃了幻觉，或 `paras`/`drop` 不对）。
- 配音漏说了某句：写进 `project.json` 的 `drop`，`align.py` 会把句子连同前面那个逗号一起改成句号；这句只在画面上做字。
- `cues` 打印每一行的字与时长；`section_end` 之外的句子留在 next film 里。

### 3 谱：把音乐与 foley 摆到拍点上

```powershell
python scripts\lvdong.py beats 005_你的题目       # 每小节四个拍的时间
python scripts\lvdong.py sound 005_你的题目       # 出 mix.wav + 3 stem
```

谱怎么填见 `references/score.md`。原则：**没有画面依据的声音不要写**；静默比配乐有用；foley 只放观众能看见的那一下。

### 4 画：演员表 + 时间轴

1. `film.js` 里先定 `DUR` / `B` / 天空曲线（`skyPh` / `sunV` / `sunU`）。
2. `SEC` 段表的每一段边界取拍界，段内用一个 `shot*` 函数；段与段之间的换法只用黑幕擦、匹配剪、甩镜、直切冻结。
3. 演员从 `template/cast.js` 里挑；新演员用 `both(cam, x, y, z, s, face, fn)` 画，**不要让两个黑剪影的轮廓相接**。
4. 抽查：`python scripts\lvdong.py still 005_你的题目 0 12 23.2 53.5 57.9`

### 5 出片

```powershell
python scripts\lvdong.py stage  005_你的题目
python scripts\lvdong.py video  005_你的题目 --workers 3     # 1740 帧约 70 s
python scripts\lvdong.py mux    005_你的题目                # 两遍 loudnorm → −14 LUFS
python scripts\lvdong.py srt    005_你的题目
python scripts\lvdong.py poster 005_你的题目 --at 23.2      # 无字幕帧
python scripts\lvdong.py check  005_你的题目
```

`make` 会把 align → cues → sound → stage → video → mux → srt → poster → check 一次跑完。

### 6 交付

成片、`.srt`、`poster.jpg`、`mix.wav` 四样，别把 `stills/`、测试片、参照帧留在交付目录。清单见 `references/delivery.md`。

## 已知坑（全表见 `references/pitfalls.md`）

- 石碑/板材一旦有圆角就像手机；所有石头用直边 `lineTo`。
- 多个 `rect` 分开 `fill` 会留 0.5 px 亮缝，整块读成"石桌子"；必须一笔外轮廓 + `evenodd` 挖洞。
- 黑剪影只要轮廓相接就并团；站位要留空气。
- 人物脚下必须落地，脚不能只在画面里露一截。
- 「走进日轮」要换算屏幕坐标，不是凭感觉给 x。
- 冻结要停主体时间、不停天空；手要「落定即回撤、冻结中挂着、解冻后再升走」。
- 字幕跟音频不跟文稿；漏句用 `drop` 剔掉，只做画面字。
- `large-v3-turbo` 会重复幻觉，默认 `small`。
- 这台机器不要用 `sh`/`bash`；本管线不依赖 bash。
- 字体不跟着工程进 `films/<slug>/` 就 404 退出。

## 不封装的部分

- **不封装题材与故事**：结构、镜头、演员、道具都由你做，`template/film.js` 里只有一个占位剪影。
- **渲染在仓库内**：抓帧走 `vendor/runtime/style-frames.mjs`，`styles/sky.js` 随工程复制，不读任何外部目录。
- **不封装配音**：旁白是喂进来的；这条管线不合成音色（要合成走 `peiyin` / `lishi`）。
- **不封装 AI 生图**：这支风格不需要，管线里也没有这条分支。
- **不封装平台发布**：只出 mp4/srt/poster。
