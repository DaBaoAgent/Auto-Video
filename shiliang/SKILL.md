---
name: shiliang
description: 用「扁平矢量 2D Motion Graphics」做科普口播样片与短片。口播稿 + 已录配音进，30–60 秒纯色几何世界、弹性入场、元素驱动转场出：SVG 单页 + 逐帧确定性渲染 + 纯标准库 MG-pop 配乐。当用户说「用扁平矢量风出一版」「照 01-flat-vector 那个样片再来一支」「shiliang 出片」「做个 explainer 风格样片」时使用。
---

# shiliang：扁平矢量 / 2D MG 管线

风格内核来自 `mg-styles-15` 的 **01-flat-vector**（MIT）：
纯色大色块、几何化角色、无渐变、弹性缓动、错峰入场、由元素带动的转场。
本管线把它收成「一条口播驱动一条片」的工程：**画面是时间的纯函数，
字幕落在配音的真实时码上，音频最后统一到 −14 LUFS / ≤ −1.5 dBTP。**

首个实例：`projects/010_shengming30/`（010《生命 3.0》前 30 秒样片）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新样片** | 有 `出稿/<编号>_<选题>/配音.wav`，要 30 秒风格测试 | `shiliang.py new` → 改 `cues.json` 与 `index.html` → `shiliang.py all` |
| **B. 中途换段** | 只改某一段的文案/时码 | 改 `cues.json` 的 `captions`/`scenes`，重跑 `audio` → `render` → `mux` |
| **C. 复用视觉** | 只要某个页面/动作 | 抄 `projects/010_shengming30/index.html` 的 `pop/spring`、城市、角色 rig、邮件面板 |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `出稿/<编号>_<选题>/配音.wav` | 是 | 44.1k/48k 单声道或立体声；切 0–N 秒 |
| `配音审查.json` | 否 | `asr.records` 提供每句 start/end；`shiliang.py cues` 用它建字幕 |
| `口播稿_定稿.txt` | 否 | 校正 ASR 同音字的依据（写进 `cues-overrides.json`） |
| `cues.json` | 是 | **唯一数据源**：标题/集号/字幕/场景节拍/音效点 |
| `index.html` | 是 | 页面协议：`window.DEMO` + `window.renderAt(t)` + `window.__ready` |

## 目录

```
shiliang/
├── SKILL.md                    本文档
├── README.md                   快速开始
├── pipeline.json               定版参数（色板/时码/响度/渲染）
├── scripts/
│   ├── shiliang.py             编排 CLI：new/cues/audio/stills/render/sheet/mux/qa/publish/probe/all
│   ├── render_frames.mjs       确定性渲染器（spawn Edge + connect，逐帧 JPEG）
│   ├── make_score.py           120 BPM / F 大调 MG-pop 配乐 + SFX（纯标准库）
│   └── mix_audio.py            人声 + 配乐混音
└── projects/
    └── 010_shengming30/
        ├── cues.json           字幕/场景/音效点
        ├── cues-overrides.json ASR 同音字校正表（可选）
        ├── index.html          视觉页（SVG 单页）
        ├── assets/font/        AlibabaPuHuiTi-3-85-Bold.ttf
        ├── audio/              narration30 / score / fullmix
        ├── frames/             渲染帧（可删）
        └── out/                成片、静帧、拼图、QA、交付说明
```

`node_modules` 是目录联接，指向 `vendor/mg-styles-15/node_modules`（puppeteer-core）。

## 常用命令

```bash
cd D:/@kaifa/Auto-Video

# 建工程（复制参考页与字体；新选题必须改 index.html 的场景文案与坐标）
python shiliang/scripts/shiliang.py new myfilm --title "标题" --episode EP.011 --src 出稿/011_xxx/配音.wav

# 从 ASR 建字幕（可选；人工定稿仍以 cues.json 为准）
python shiliang/scripts/shiliang.py cues myfilm --src 出稿/011_xxx --to 30

# 音频：切配音 → 合成配乐 → 混音 → loudnorm
python shiliang/scripts/shiliang.py audio myfilm

# 静帧（秒，逗号分隔）；先静帧后整片
python shiliang/scripts/shiliang.py stills myfilm --times 0.35,6.8,12.8,18.3,27.6,29.5

# 全片 900 帧 + 编码（约 35 秒）
python shiliang/scripts/shiliang.py render myfilm

# 4×3 预览拼图 / 封装 / QA
python shiliang/scripts/shiliang.py sheet myfilm
python shiliang/scripts/shiliang.py mux myfilm
python shiliang/scripts/shiliang.py qa myfilm

# 交付到出稿/<编号>_<选题>/
python shiliang/scripts/shiliang.py publish myfilm
```

## 画面五层

```
Layer 6  字幕（墨蓝胶囊 + 奶油白字，底部 96px）
Layer 5  全屏色块层：邮件面板 / 测试阵列 / 55% 巨字
Layer 4  角色与室内道具（安全官、桌、笔记本、信封）
Layer 3  城市：楼、树、云、鸟、太阳
Layer 2  地面 / 道路 / 冲击波纹
Layer 1  群青底
```

- **世界只有一层变换**：`world.setAttribute('transform', translate(960 540) scale(s) translate(-cx -cy))`，
  相机推进/推近都只改 `s/cx/cy`。
- **室内必须用「精确填满窗口」的变换**：窗口的宽高比与 1920×1080 不同，
  用 `translate(窗口中心) scale(70/1920*1.25) translate(-860 -560)` 能让室内四边都盖出窗口；
  早期用 `translate(HL) scale(70/1920) translate(860 -153) scale(1.15) translate(-860 153)`
  会在窗口左上角漏出 1.5×1.3 世界单位的楼体黑块。
- **桌面、笔记本、杯子画在角色之后**，否则角色下半身会盖在桌面上。
- 全部元素启动时创建一次，`renderAt(t)` 只改属性，不重建节点。

## 时间语法

- 字幕取自配音 ASR 的**从句边界**，每条 ≤14 汉字；标点去掉，逗号变空格。
- `cues.json` 的 `scenes` 是唯一节拍表：`dot_bounce*` / `launch` / `sun_land` / `city_start` /
  `cam_push` / `mail_wipe` / `stamp_send` / `return_wipe` / `ai_face` / `test_wipe` /
  `lab_cards` / `result_merge` / `bars_grow` / `percent_drop` / `percent_land` / `logo_in`。
- 页面用 `T(k)` 读单点、`SC[k]` 读区间；**不要在页面里再硬编码一遍时间**。
- 结尾在 30.000s 硬切：配乐 0.45s 淡出、人声 0.45s 淡出，末尾 0.8–1.0s 保持数字微呼吸。
- 一条片 = 一条节拍表：画面与配乐都从 `cues.json` 读。

## 音频

- 配乐 `make_score.py`：120 BPM，F 大调 F–Dm–Bb–C 四小节循环；marimba 动机
  （C6 E6 G6 E6）、bell 16 分琶音、圆润 bass 8 分、四拍底鼓、2/4 门限军鼓、
  8/16 分踩镲、侧链压缩；全部纯标准库、种子确定性。
- 混音 `mix_audio.py`：人声 1.0，配乐默认 0.5（−6 dB）；最后 `loudnorm I=-14:TP=-1.5`。
- AAC 封装会把真峰值抬高约 0.1 dB：`mux` 里加 `volume=-0.2dB`，实测 −1.4 dBTP。
- 音效点只挂关键帧：三次落地、弹射、九栋楼、信封、推进、拆信、时钟、文件卡、
  发送、砸回、冷汗、AI 脸、测试卡、结果、55% 砸落。

## 渲染与 QA

```bash
node shiliang/scripts/render_frames.mjs <slug> --stills 0.3,6.8,27.6
node shiliang/scripts/render_frames.mjs <slug> --dur 30 --from 0 --to 30
```

- 900 帧 JPEG（`PC_FMT=jpeg PC_Q=92`）约 32 秒；PNG 更慢但无损。
- Edge 154 上 `puppeteer.launch` 会静默退出：必须 `spawn` + `connect`（脚本已处理）。
- QA：30.000s / 1920×1080 / 30fps / 900 帧 / AAC 48k / −14.2 LUFS / −1.4 dBTP / 0 黑帧。
- 确定性：同一帧两次渲染 MD5 相同；禁 `Date.now()` / `Math.random()`，随机全走 `rng(seed)`。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 室内缩放用 1.15 旧式变换 | 窗口左上角漏出 1.5×1.3 世界单位的楼体黑块 | 用 `translate(窗口中心) scale(70/1920*1.25) translate(-860 -560)`，数学上四边盖出窗口 |
| 桌面画在角色之前 | 角色下半身压在黄色桌面上 | 桌面/笔记本/杯子在角色之后创建 |
| 测试卡的 `gy` 当成左上角 | 第一行卡片顶部溢出屏幕、标题被盖 | 卡片坐标是**中心**；3 列中心 400/960/1520，2 行中心 310/710 |
| 结果面板数字和标题同一条带 | 55% 与「勒索成功率」叠字 | 标题 214、数字基线 350、柱顶 380、基线 780、标签 836 |
| 测试卡 pop 晚于世界隐藏 | 22.70–23.05 出现 0.35s 纯群青空帧 | `lab_cards` 提前到 22.72，第一张卡在擦除瞬间就飞出 |
| SEND 章放在媒体图标正上 | 圆章压住「媒体」标签 | 圆心放 (1480,845)，与图标底边留 14px |
| 字幕条与结果面板底边相接 | 面板 900、字幕顶 912，视觉上贴死 | 面板高度收到 750（150–900），或把字幕视为压边层 |
| 窗口 clip 与室内画面不同比例 | 任意一角漏底色 | 室内画面必须比窗口四周各大出 2–4 世界单位 |
| 页面里再写一遍时间 | 改 cues 后画面与配乐不同步 | 只用 `T(k)` / `SC[k]` 读 cues |
| 大面积纯白铬字/发光 | 扁平风格里会糊成块 | 本风格不用发光；对比靠色板与字重 |

## 交付

**2026-10-30 用户定稿：样片与阶段成果放回 `出稿/<编号>_<选题>/`，不要只留在工程目录。**
`shiliang.py publish` 默认按 `cues.json.source` 找到出稿目录，文件名
`<集号>_扁平矢量<N>秒样片.mp4`，并附一张 `_预览.jpg`（12 帧拼图）与 `_说明.md`。

全片定稿仍按根目录 `references/publish.md` 归到 `out/<编号>_<人物>/`（成片 + 两张封面 + 发布信息）。

## 资产与许可

- 视觉语法来自 `mg-styles-15` 的 `demos/01-flat-vector`（MIT，Vincentwei1021）；
  本管线为独立重写（SVG + 纯标准库配乐），未直接复制上游素材；二次分发保留上游许可。
- 字体 Alibaba PuHuiTi 3.0 85-Bold（免费商用）；数字/英文用系统 Arial Black。
- 不使用真实品牌商标；片中的 `SECURITY ALERT`、`LIFE 3.0` 等均为虚构界面文案。
