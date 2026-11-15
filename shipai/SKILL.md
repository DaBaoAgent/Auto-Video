---
name: shipai
description: 用现成配音 + Pixabay 实拍素材做口播竖屏短片：配音切段与字级时间对齐、素材按 id 下载后固定顺序拼接、MoneyPrinterTurbo CLI 出无字幕底片、一行式字幕烧录。当用户说「实拍素材」「混剪口播」「竖屏短片」「用 MoneyPrinterTurbo 出片」「拿我的配音配实拍画面」时使用。
---

# shipai：实拍素材口播竖屏短片

一支片子的形态是：**一个人的声音 + 一堆真实拍到的画面 + 一行一行跟着语音出现的字幕**，1080×1920 竖屏。

画面不生成、不绘制，只从素材库里挑实拍——所以这条管线的价值不在「画风」，在**把声音、素材、顺序和字幕这四件容易互相打架的事接顺**：声音按段切准、素材按镜头语言排队、字幕按真实字时间走、成片一次校验。

首个实例：`projects/004_玛雅巨人文明/` —— 玛雅巨人文明口播稿第一大段（17.86 s，12 条字幕，5 段 Pixabay 实拍：危地马拉丛林金字塔、特奥蒂瓦坎太阳金字塔）。音频与成片不入库，见 `MIGRATION.md`。

## 一分钟判断

- 适合：已有配音的口播稿、要真实画面而不是画的、题材有现成素材（遗迹/城市/自然/工艺/人文）、竖屏信息流。
- 不适合：需要精确图解和标注（用 `blueprint` / `swiss`）；纯虚构或史前无实拍可用的题材；要求统一画风的手绘/动画（用 `laolang` / `goldenage` 等）。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 现成配音，单/双声道都行，脚本只截取、转 44.1 kHz 单声道，不重录不变声 |
| `口播稿.md` / `.txt` | 是 | 空行分段；脚本按「第 N 段」切，段落内按标点切字幕 |
| Pixabay key | 是 | 环境变量 `PIXABAY_KEY` 或 `--key`；无 key 时可用自己下载好的本地素材 |
| MoneyPrinterTurbo | 是 | 本地已部署（默认 `D:/@kaifa/MoneyPrinterTurbo`），`SHIPAI_MPT` 可改 |

## 目录

```text
shipai/
├── SKILL.md                本文档
├── README.md               快速开始
├── MIGRATION.md            来源、入库范围、不入库清单
├── CREDITS.md              许可与来源
├── pipeline.json           定版参数（画幅 / 引擎 / 字幕 / 素材 / 校验）
├── scripts/
│   ├── shipai.py           编排：new / vo / terms / material / base / caption / probe / make
│   ├── vo_segment.py       配音 → 段落边界 + 字级时间轴（whisper + 编辑距离对齐）
│   ├── pixabay.py          素材检索与按 id 下载
│   └── captions.py         一行式字幕渲染 + 烧录
├── references/
│   ├── moneyprinter.md     MoneyPrinterTurbo CLI 契约与已知坑
│   ├── materials.md        素材检索、挑选与排序规则
│   ├── captions.md         字幕版式与时间来源
│   └── delivery.md         交付与归档
└── projects/
    └── 004_玛雅巨人文明/    首个实例（口播稿 / timeline / 素材 id 清单，无音频与成片）
```

## 流程

### 1. 建工程

```powershell
$py = "D:\@kaifa\MoneyPrinterTurbo\.venv\Scripts\python.exe"
& $py scripts\shipai.py new 004_玛雅巨人文明 `
    --text "出稿\004_玛雅巨人文明\口播稿.md" `
    --wav  "出稿\004_玛雅巨人文明\配音.wav" `
    --title "玛雅巨人文明·第一大段" `
    --paragraph 1
```

产出 `projects/<名字>/`：`project.json`、`script.txt`、`voice.wav`。

### 2. 切段与时间轴

```powershell
& $py scripts\shipai.py vo 004_玛雅巨人文明 --paragraph 1
```

三件事一起做：

1. faster-whisper（默认 `large-v3-turbo` + CPU int8）转写整条配音，取词级时间；
2. 口播稿的每个字与转写的每个字做**编辑距离对齐**——配音漏读一句、多读一个字，对齐自己会跳过，不影响段落边界；
3. 按「第 N 段」切音频，并按标点把这一段切成短句，每条短句继承字的起止时间。

产出 `audio/seg-01.wav` 与 `timeline.json`（段落边界、逐句时间）。段落切点：段首前 0.05 s，段尾补 0.30 s，且不越过下一段起点前 0.08 s。

> `--paragraph list` 只看段落表，不转写。

### 3. 挑素材

```powershell
# 先看候选（id / 时长 / 尺寸 / 标签）
& $py scripts\shipai.py terms 004_玛雅巨人文明 --terms "mayan ruins|mayan pyramid|jungle temple"

# 按 id 下载，给的顺序就是拼接顺序
& $py scripts\shipai.py material 004_玛雅巨人文明 --ids 35423,144043,144042,22200,281134
```

`terms` 写 `materials/candidates.json`，`material` 写 `materials/materials.json`（`files` 数组即拼接顺序）。

### 4. 出一版无字幕底片

```powershell
& $py scripts\shipai.py base 004_玛雅巨人文明
```

调 MoneyPrinterTurbo CLI：`--video-source local` + `--video-concat-mode sequential` + `--video-clip-duration 4` + `--video-aspect 9:16` + `--bgm-type none` + `--no-subtitle-enabled`，拿现成段音频当 `--custom-audio-file`，按 `materials.json` 顺序拼。产出 `base-9x16.mp4`，原始 CLI 输出在 `logs/base.log`。

### 5. 烧字幕

```powershell
& $py scripts\shipai.py caption 004_玛雅巨人文明
```

读 `timeline.json` 的短句，一条短句一张透明 PNG（单行、去标点、2px 黑描边 + 0.15 阴影、画面 73% 高处），ffmpeg overlay 烧进画面 → `final-9x16.mp4`。

### 6. 校验

```powershell
& $py scripts\shipai.py probe 004_玛雅巨人文明
```

四项：1080×1920 / 有音轨 / 时长≈切段（±1 s）/ 字幕时间轴单调。人工再抽四帧（0.8 / 3.6 / 10.5 / 13.2 s）看字幕位置。

### 一键

```powershell
& $py scripts\shipai.py make 004_玛雅巨人文明 --paragraph 1 --ids 35423,144043,144042,22200,281134
```

`make` = `vo` → `terms`（给了 `--terms` 才跑）→ `material` → `base` → `caption` → `probe`。

## 已知坑

- **CLI 的 `--video-source` 默认是 pexels**，会盖掉 `config.toml`。不显式传 `local` 就在素材阶段挂掉；`config.toml` 里的 `video_source` 只对 API/WebUI 生效。见 `references/moneyprinter.md`。
- **拼接默认随机**：MPT 内部 `random.shuffle`，必带 `--video-concat-mode sequential`，否则镜头顺序不可复现。
- **自定义音频下字幕交给外面**：`--custom-audio-file` + `--no-subtitle-enabled` 时 MPT 跳过自己的字幕链（TTS 时间轴对它不存在），字幕由 `captions.py` 烧。
- **Pixabay 必须带 UA**：不带浏览器 User-Agent 直接 403；国内网络还要代理（`SHIPAI_PROXY`）。
- **关键词别让模型自己生成**：自动关键词常常命中雪山瀑布、海滩这类无关画面。先 `terms` 看命中量，心里有数再挑 id。小地名常常 0 命中（`tikal`、`chichen itza` 实测为 0），用 `mayan ruins` / `jungle temple` 这类通名。
- **字幕时间不能按字数均分**：`timeline.json` 的短句时间来自真实字时间；配音漏读句子时，那条字幕自然落在它实际被念到的位置。
- **竖屏裁切是 cover**：横屏素材进 1080×1920 会裁掉左右，构图先看抽帧再定序。
- **MPT 会复制素材到自己 storage**：`storage/local_videos/cli-material-*.mp4`，删工程别误删素材原文件。

## 不封装的部分

这条管线只封本次真正用到的东西，以下一律不做（用户 2026-11-15 定）：

WebUI / Streamlit、API 服务与 `start.bat`、Edge TTS 合成、LLM 生成口播稿、Pexels 分支、MPT 自带字幕链、BGM/音效、fengmian 封面与发布信息。要其中任何一项，去 `peiyin`（出稿配音）或 `laolang`（交付封面）那条链路。
