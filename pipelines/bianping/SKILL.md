---
name: bianping
description: 扁平尺度漫游（Scale Zoom Explainer）——深夜空蓝底色上的几何科普动画：从彗星撞击到黑洞事件视界，镜头在尺度之间连续推拉，Orbi 小眼睛角色做引导。全部代码画 SVG，不用 AI 生图。当用户说「扁平尺度漫游」「scale zoom」「科普动画」「几何讲科学」「从X到Y有多大」时使用。
---

# bianping：扁平尺度漫游管线

深夜空蓝 (#1D2052) 底色上，用几何形状和动态排版讲科学：一颗彗星砸向木星，镜头从宇宙尺度连续推到西柚大小的黑洞。Orbi 是一个会眨眼、会惊讶的小眼睛角色，蹲在左下角当观众的向导。**所有画面都是代码画的 SVG，不用 AI 生图。**

首个实例：`template/` 是「僵尸地球第一段 · 彗星撞木星与九号行星黑洞假说」35.7 秒样片（1920×1080 / 24fps / 857帧）。

- 依赖库：lemo-opuscar（`D:\@kaifa\lemo-opuscar`），风格来自 `styles/flat-space-explainer`
- 风格规范：[`references/style.md`](references/style.md)
- ASR 对齐方法：[`references/sync.md`](references/sync.md)
- 配乐与音效：[`references/audio.md`](references/audio.md)

## 一分钟判断

- 适合：宇宙尺度、数量级对比、科普讲解、历史事件的可视化、「从A到B有多远/多大」类问题。
- 不适合：人物驱动的故事（用 `laolang`）、实拍素材新闻、快速促销。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户现成配音（单声道 44.1kHz WAV）。按段落切出对应片段 |
| `口播稿_定稿.txt` | 是 | 每段一行；ASR 会校正实际文字与时间 |
| 主题与段落 | 是 | 哪段讲什么、场景切换点在哪 |

## 目录

```text
bianping/
├── SKILL.md
├── pipeline.json           定版参数（配色/字体/帧率/音量比）
├── scripts/
│   └── bianping.py         编排：new / asr / music / render / mux
├── references/
│   ├── style.md            视觉规范（Orbi 行为、转场、碎片动画）
│   ├── sync.md             ASR 对齐（faster-whisper + 16kHz）
│   └── audio.md            pluck.py 配乐 + sfx.py 音效
└── template/               僵尸地球第一段 35.7s 样片工程
    ├── index.html
    ├── film.js             6 个场景 + VO 字幕数组
    ├── flat.js             调色板 + 绘制工具（从 lemo-opuscar 复制）
    ├── heroes.js           tear/capsule（从 lemo-opuscar 复制）
    ├── orbi.js             Orbi 眼睛角色（从 lemo-opuscar 复制）
    ├── fonts/Jost.ttf
    ├── fonts/NotoSansSC-Bold-sub.woff2
    └── out/                （不入库：video.mp4, vo1.wav, music.wav, amix.wav）
```

## 流程

### 1. 建工程

从 `template/` 复制整个目录到你的项目 `film/` 下，改 `film.js` 里的场景和 VO 数组。
同时从 lemo-opuscar `styles/flat-space-explainer/` 复制 `flat.js`、`heroes.js`、`orbi.js` 和字体文件。

### 2. 切配音

```bash
ffmpeg -i 配音.wav -t 37 -c copy film/out/vo1.wav
ffmpeg -i film/out/vo1.wav -ar 16000 -ac 1 film/out/vo1_16k.wav
```

### 3. ASR 逐词对齐（强制）

**不要手动估时间戳。** 用 faster-whisper 转写真实配音，拿到逐词时间：

```bash
C:\Users\20200\AppData\Local\Programs\Python\Python312\python.exe asr.py
```

**关键坑**：
- faster-whisper 直接传文件路径会触发 PyAV `metadata_errors` bug，必须用 `wave` 模块读成 numpy float32 传入
- 必须先转 16kHz mono，44.1kHz numpy 输入会识别成乱码
- `vad_filter=False`（True 会吞掉所有语音）

拿到 ASR 结果后，把 `film.js` 里的 `VO` 数组时间和文字改成 ASR 实际值。场景切换点 (`CUTS`) 也跟着 ASR 的句子边界走。

### 4. 写场景

`film.js` 里每个场景是一个 `if (t >= a && t < b)` 块。核心工具：

- `r1(px)` / `r2(px)`：按比例缩放
- `eio(x)` / `seg(t,a,b)` / `spr(t,t0,dur,y)` / `ebump(...)`：缓动
- `drawEarth` / `drawJupiter` / `drawBlackHole` / `drawGrapefruit`：预定义绘制
- Orbi 微动作：眨眼、跳跃、瞪大眼
- 圆环转场：场景切换时黑圆从中心扩到全屏再缩回

**场景节奏**：每个场景 3–8 秒，切点落在 ASR 句首/词首。

### 5. 配乐

```bash
D:\@kaifa\lemo-opuscar\.venv\Scripts\python.exe music.py
```

`music.py` 调用 lemo-opuscar 的 `pluck.py`（music_box 琶音 + kalimba 点缀）和 `sfx.py`（thump/crash/whoosh/ding），输出 `out/music.wav`。

### 6. 混音

```bash
ffmpeg -i out/vo1.wav -i out/music.wav -filter_complex "[1:a]volume=0.35[bg];[0:a][bg]amix=inputs=2:duration=first" out/amix.wav
```

### 7. 渲染

```bash
cd D:\@kaifa\lemo-opuscar
node core/render/video.mjs "<film目录>" --fps 24 --workers 3 --out "<film目录>\out\video.mp4"
```

### 8. 合成

```bash
ffmpeg -i out/video.mp4 -i out/amix.wav -c:v copy -c:a aac -b:a 192k -shortest "<最终交付>.mp4"
```

## 已知坑

- **字幕不许手动估时间**：必须用 ASR。手动估的结果永远对不上口播。
- **ASR 文字可能有错**：对照口播稿修正 ASR 的识别错误，但**时间戳必须用 ASR 的**。
- **所有画面代码画**：不用 AI 生图。星球、碎片、黑洞、西柚全是 SVG 几何。
- **drawEarth 坐标别多乘 R**：陆地坐标是相对于地球中心的偏移，不要再乘一次 R。
- **Orbi 别遮挡标签**：Orbi 在左下角，文字标签避开那个区域。
- **渲染前改 window.DUR**：`index.html` 里 `window.DUR` 必须等于成片秒数。
- **交付目录根只放最终成片**：中间产物在 `film/out/` 里。
