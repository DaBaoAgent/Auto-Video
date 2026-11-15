---
name: xuni
description: 用「80s Synthwave / VHS / Y2K」做口播样片与短片。口播稿 + 已录配音进，30–60 秒霓虹网格、日落、铬字、扫描线、Y2K 窗口出：Three.js 场景 + Canvas 内容层 + VHS 后处理，逐帧确定性渲染，带合成波配乐与关键帧音效。当用户说「用合成波风出一版」「照 10-synthwave 那个样片再来一支」「xuni 出片」时使用。
---

# xuni：合成波 / VHS 短片管线

风格内核来自 `mg-styles-15` 的 **10-synthwave**（MIT）：
透视网格 + 日落 + 线框山 + 棕榈 + 铬字 + VHS 做旧链。
本管线把那套视觉语法收成「一条口播驱动一条片」的工程：**画面是时间的纯函数，
字幕与镜头落在配音的真实时码上，音频最后统一到 −14 LUFS / ≤ −1.5 dBTP。**

首个实例：`projects/009_prion30/`（009《朊病毒·同类相食》前 30 秒样片）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新样片** | 有 `出稿/<编号>_<选题>/配音.wav`，要 30 秒风格测试 | `xuni.py new` → 改 cues.json → `xuni.py all` |
| **B. 中途换段** | 只改某一段的文案/时码 | 改 `cues.json` 的 `captions`/`scenes`，重跑 `audio` → `render` |
| **C. 复用视觉** | 只要某个页面/后处理 | 抄 `projects/009_prion30/index.html` 的 `chromeText` / `drawSun` / VHS shader |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `出稿/<编号>_<选题>/配音.wav` | 是 | 44.1k/48k 单声道或立体声；切 0–N 秒，句间静音保留 |
| `配音审查.json` | 否 | `asr.records` 提供每句 start/end；`xuni.py cues` 用它建字幕 |
| `口播稿_定稿.txt` | 否 | 校正 ASR 同音字的依据（人工写进 `cues-overrides.json`） |
| `cues.json` | 是 | **唯一数据源**：标题/集号/字幕/场景节拍/神话条目/音效点 |
| `index.html` | 是 | 页面协议：`window.DEMO` + `window.renderAt(t)` + `window.__ready` |

## 目录

```
xuni/
├── SKILL.md                    本文档
├── pipeline.json               定版参数（色板/时码/响度/渲染）
├── scripts/
│   ├── xuni.py                 编排 CLI：new/cues/audio/stills/render/mux/qa/publish/probe/all
│   ├── render_frames.mjs       确定性渲染器（spawn Edge + connect，逐帧 PNG/JPEG）
│   ├── make_score.py           纯标准库合成波配乐 + SFX（100 BPM，四和弦循环，侧链）
│   └── mix_audio.py            人声 + 配乐混音，磁带停转收尾
└── projects/
    └── 009_prion30/
        ├── cues.json           字幕/场景/神话条目/音效点
        ├── cues-overrides.json ASR 同音字校正表
        ├── index.html          视觉页（Three.js + Canvas 覆盖层 + VHS）
        ├── assets/font/        AlibabaPuHuiTi-3-85-Bold.ttf
        ├── audio/              narration30 / score / fullmix
        ├── frames/             渲染帧（可删）
        └── out/                成片、静帧、QA
```

`node_modules` 是目录联接，指向 `vendor/mg-styles-15/node_modules`（three / puppeteer-core）。

## 常用命令

```bash
cd D:/@kaifa/Auto-Video

# 建工程（复制参考页与字体；新选题要改 index.html 里的内容文案）
python xuni/scripts/xuni.py new myfilm --title "标题" --episode EP.010 --src 出稿/010_xxx/配音.wav

# 从 ASR 建字幕（可选；人工定稿仍以 cues.json 为准）
python xuni/scripts/xuni.py cues myfilm --src 出稿/010_xxx --to 30

# 音频：切配音 → 合成配乐 → 混音 → loudnorm
python xuni/scripts/xuni.py audio myfilm

# 静帧（秒，逗号分隔）；先静帧后整片
python xuni/scripts/xuni.py stills myfilm --times 0.3,7.7,13.5,27.8

# 全片 900 帧 + 编码（约 1 分钟，JPEG 截帧）
python xuni/scripts/xuni.py render myfilm

# 封装 + QA（五项门禁）
python xuni/scripts/xuni.py mux myfilm
python xuni/scripts/xuni.py qa myfilm

# 交付到出稿/<编号>_<选题>/
python xuni/scripts/xuni.py publish myfilm
```

## 画面五层

```
Layer 5  OSD / 字幕（VHS 后处理之后合成，保持清晰）
Layer 4  Canvas 覆盖层：神话窗口 / 浏览器 / 骷髅 / 数据终端 / 铬字
Layer 3  3D 前景：DNA 双螺旋 / 棕榈（Sprite）
Layer 2  地面网格（fwidth 线宽 + 纵深渐变）+ 线框山
Layer 1  天空渐变 + 星空 + 太阳（程序化贴图，带横向色带）
```

- **渲染顺序是坑**：太阳 `renderOrder 0`、网格 `1`、远山 `2`、近山 `3`、棕榈 `4`；
  地面必须是不透明 `PlaneGeometry` 且太阳开 `depthTest`，否则太阳会穿过地面浮在网格前。
- **覆盖层相机**用居中正交 `(-W/2, W/2, H/2, -H/2, -10, 10)`；用 `(0,W,0,H)` 会把
  Y 翻转导致背面剔除，整层不可见。
- 铬字：多段金属渐变 + 深色外描边 + 细白内描边 + 星芒扫光；**不要把大面积填成纯白**，
  否则 bloom 会把字糊成白块。

## 时间语法

- 字幕取自配音 ASR 的**从句边界**，每条 ≤14 汉字；标点去掉，逗号变空格。
- 镜界/砸字/砸音落在口播的静音窗或句首：007 实例的 drop 在 7.70s（“长得都差不多”），
  第二次砸字在 21.20s（“翻出了这份记忆的原件”），片名在 27.50s。
- 30 秒样片结尾用**磁带停转 + CRT 关机**收在 30.000s；口播若没说完，这是刻意收尾，
  不是漏帧。
- 一条片 = 一条节拍表：`cues.json` 的 `scenes`（boot/mask_open/drop/browser/loop/glitch/
  helix/chromo/data/final/tape_stop/crt_off）+ `sfx` 点表。画面与配乐都从它读。

## 音频

- 配乐 `make_score.py`：100 BPM，Am–F–C–G 四和弦循环，8 分贝斯、16 分琶音、
  四拍底鼓、2/4 军鼓（门限混响）、8 分踩镲、侧链压缩；全部纯标准库、种子确定性。
- 混音 `mix_audio.py`：人声 1.0，配乐默认 0.45（−6.9 dB）；人声与配乐同时做
  29.4s 起的磁带停转；最后 `loudnorm I=-14:TP=-1.5`。
- AAC 封装会把真峰值抬高约 0.1 dB：`mux` 里加 `volume=-0.2dB`，实测 −1.6 dBTP。
- 音效点只挂在关键帧：开机、四窗口弹出、merge、drop、SAME SOURCE、心跳、glitch、
  双螺旋升起、两次砸字、BSE 印章、片名、关机。

## 渲染与 QA

```bash
node xuni/scripts/render_frames.mjs <slug> --stills 0.3,7.7
node xuni/scripts/render_frames.mjs <slug> --dur 30 --from 0 --to 30
```

- 900 帧 JPEG（`PC_FMT=jpeg PC_Q=92`）约 63 秒；PNG 更慢但无损。
- Edge 154 上 `puppeteer.launch` 会静默退出：必须 `spawn` + `connect`（脚本已处理）。
- QA：时长 30.000 / 1920×1080 / 30fps / 900 帧 / AAC 48k / −14.5 LUFS / −1.6 dBTP /
  黑帧只允许 CRT 关机尾段。
- 确定性：同一帧两次渲染 MD5 相同；禁 `Date.now()` / `Math.random()`，随机全走
  `mulberry32`/`hash01`。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 太阳画在网格之后 | 太阳浮在地面/网格前面，像贴纸 | 太阳 `renderOrder 0` + 不透明地面 + `depthTest:true` |
| 覆盖层相机用 `(0,W,0,H)` | 整层覆盖内容不显示 | 用居中正交相机，平面放原点 |
| bloom 太强 / 铬字纯白 | 字糊成白块，太阳变白饼 | bloom 0.40/0.52/0.84；铬字保留深色金属带 |
| 神话窗口直接叠到同一点 | 四张窗文字糊在一起 | 收拢到 6.55s 后换成一张 `MYTH_DB // MERGE` 记录 |
| 片名早于音乐 hit | 砸字与 drop 差 0.1s | 片名 7.60s 起、7.70s 落定；scrim 在 7.60s 才起 |
| 数据终端与片名重叠 | 27.5s 片名压着 BSE 面板 | 面板 27.55s 前淡出，片名 27.50s 起 |
| 磁带停转只做在配乐 | 人声在 30s 处硬切爆音 | `mix_audio.py` 对人声和配乐同时做 tape stop |
| 黑帧门禁 | 29.77–29.97 被报黑帧 | CRT 关机是刻意收尾，QA 允许最后 0.35s |
| 页面引用 `/node_modules` | 404，three 加载失败 | `xuni/node_modules` 目录联接 + 服务器根指 xuni/ |

## 交付

**2026-10-30 用户定稿：样片与阶段成果放回 `出稿/<编号>_<选题>/`，不要只留在工程目录。**
`xuni.py publish` 默认按 `cues.json.source` 找到出稿目录，文件名 `<集号>_合成波<N>秒样片.mp4`，
并附一张 `_预览.jpg` 与 `_说明.md`（说明手写或从工程 out/ 复制）。

全片定稿仍按根目录 `references/publish.md` 归到 `out/<编号>_<人物>/`（成片 + 两张封面 + 发布信息）。

## 资产与许可

- 视觉语法来自 `mg-styles-15`（MIT，Vincentwei1021）；二次分发保留上游许可。
- 字体 Alibaba PuHuiTi 3.0 85-Bold（免费商用）；Chromium/Edge 渲染。
- 不使用真实品牌商标；片中出现的 `MYTHOS.EXE`、`MYTH_DB`、`BSE // SURVEILLANCE`
  均为虚构界面文案。
