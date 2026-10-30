---
name: xianshiqi
description: 用「赛博朋克 HUD / FUI 虚构界面」做口播样片与短片。口播稿 + 已录配音进，30–60 秒深青黑底、青色霓虹线框、雷达扫掠、目标锁定、数据流小字出：Three.js 线框全息体 + Canvas FUI 覆盖层 + HUD 后处理，逐帧确定性渲染，darksynth 脉冲配乐与 HUD 音效。当用户说「用 HUD 风出一版」「照 22-hud 那个样片再来一支」「xianshiqi 出片」时使用。
---

# xianshiqi：赛博朋克 HUD / FUI 短片管线

风格内核来自 `mg-styles-15` 的 **22-hud**（MIT）：
深青黑底 + 青色 `#00E5FF` 线稿 + 橙红 `#FF6A00` 告警态、六边形网格、
带刻度的同心旋转环、雷达扫掠、数据列滚动、打字机状态行、sparkline、
中央 Three.js 线框全息体、四角收缩的锁定框、辉光／扫描线／轻微色差／克制 glitch。
本管线把那套视觉语法收成「一条口播驱动一条片」的工程：**画面是时间的纯函数，
字幕与事件落在配音的真实时码上，音频最后统一到 −14 LUFS / ≤ −1.5 dBTP。**

首个实例：`projects/UAP30/`（UAP《不明异常现象》前 30 秒样片）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新样片** | 有 `出稿/<编号>_<选题>/配音.wav`，要 30 秒风格测试 | `xianshiqi.py new` → 改 cues.json 与 index.html → `xianshiqi.py all` |
| **B. 中途换段** | 只改某一段的文案/时码 | 改 `cues.json` 的 `captions`/`scenes`/`sfx`，重跑 `audio` → `render` → `mux` |
| **C. 复用视觉** | 只要某个面板/后处理 | 抄 `projects/UAP30/index.html` 的 `drawRings` / `drawLock` / `drawVids` / HUD pass |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `出稿/<编号>_<选题>/配音.wav` | 是 | 44.1k/48k 单声道或立体声；切 0–N 秒 |
| `配音审查.json` | 否 | `asr.records` 提供每句 start/end；`xianshiqi.py cues` 用它建字幕 |
| `口播稿_定稿.txt` | 否 | 校正 ASR 同音字 / 无 ASR 时手工定 caption 的依据 |
| `cues.json` | 是 | **唯一数据源**：标题/集号/字幕/场景节拍/音效点 |
| `index.html` | 是 | 页面协议：`window.DEMO` + `window.renderAt(t)` + `window.__ready` |

**没有 ASR 时**：跑 `analyze_voice.py` 测语音块（20ms RMS，阈值＝峰值 −28dB，
静音 ≥0.06s 切块），按「全片字数 ÷ 配音总时长」得到字/秒，再按句号处 ≥0.16s 的
长静音把块归到句子，逐条写进 `cues.json`。UAP 实例：3488 字 / 588.21s = 5.93 字/s，
第一段 115 字实测 19.08s 收口，块边界与稿子短语一一对应。

## 目录

```
xianshiqi/
├── SKILL.md                    本文档
├── README.md                   快速开始
├── CREDITS.md                  风格来源与许可
├── pipeline.json               定版参数（色板/字体/后处理/响度/渲染）
├── scripts/
│   ├── xianshiqi.py            编排 CLI：new/cues/audio/stills/render/sheet/mux/qa/publish/probe/all
│   ├── analyze_voice.py        无 ASR 时从音频测语音块与静音窗（纯标准库）
│   ├── render_frames.mjs       确定性渲染器（spawn Edge + connect，逐帧 JPEG）
│   ├── make_score.py           darksynth 配乐 + HUD 音效（96 BPM，D 小调，纯标准库）
│   └── mix_audio.py            人声 + 配乐混音，片尾淡出
└── projects/
    └── UAP30/
        ├── cues.json           字幕 23 条 / 场景节拍 / 29 个音效点
        ├── index.html          视觉页（Three.js 全息球 + Canvas FUI + HUD 后处理）
        ├── assets/font/        AlibabaPuHuiTi-3-85-Bold.ttf
        ├── audio/              narration30 / score / fullmix
        ├── frames/             渲染帧（可删）
        └── out/                成片、静帧、拼图、QA
```

`node_modules` 是目录联接，指向 `vendor/mg-styles-15/node_modules`（three / puppeteer-core）。

## 常用命令

```bash
cd D:/@kaifa/Auto-Video

# 建工程（复制参考页与字体；新选题要改 index.html 里面板文案）
python xianshiqi/scripts/xianshiqi.py new myfilm --title "标题" --episode EP.011 --src 出稿/011_xxx

# 测语音块（无 ASR 时定字幕用）
python xianshiqi/scripts/analyze_voice.py --src 出稿/011_xxx/配音.wav --to 35

# 从 ASR 建字幕（有 配音审查.json 时）
python xianshiqi/scripts/xianshiqi.py cues myfilm --src 出稿/011_xxx --to 30

# 音频：切配音 → 合成配乐 → 混音 → loudnorm
python xianshiqi/scripts/xianshiqi.py audio myfilm

# 静帧（秒，逗号分隔）；先静帧后整片
python xianshiqi/scripts/xianshiqi.py stills myfilm --times 0.3,2.6,6.4,13.1,27.6

# 全片 900 帧 + 编码
python xianshiqi/scripts/xianshiqi.py render myfilm

# 3×3 静帧拼图
python xianshiqi/scripts/xianshiqi.py sheet myfilm

# 封装 + QA（七项门禁）
python xianshiqi/scripts/xianshiqi.py mux myfilm
python xianshiqi/scripts/xianshiqi.py qa myfilm

# 交付到 出稿/<编号>_<选题>/
python xianshiqi/scripts/xianshiqi.py publish myfilm
```

## 画面五层

```
Layer 5  OSD / 字幕（HUD 后处理之后合成，保持清晰；衬底常驻）
Layer 4  Canvas FUI 覆盖层：环/雷达/数据列/sparkline/视频窗/事件面板/锁定框
Layer 3  3D 全息体：内球 wireframe + 外球 + 8 经线 + 2 纬线 + 170 粒子 + 扫描环 + 3 目标点
Layer 2  静态背景：径向渐变 + 六边形网格（边缘淡出）+ 240 点尘
Layer 1  —— 无（HUD 不需要纸底；背景即 Layer 2）
```

- **渲染顺序是坑**：3D 场景 → 覆盖层（第二个 RenderPass，`clear=false`）→ sanitize →
  UnrealBloom → HUD pass（色差/扫描线/暗角/glitch/fade）→ OSD 在 HUD pass 内混合。
- **覆盖层相机**用居中正交 `(-W/2, W/2, H/2, -H/2, -10, 10)`；用 `(0,W,0,H)` 会 Y 翻转整层不可见。
- 全息球放在 `z=-6.2`、FOV 35；球径 2.56 在屏高约占 60%，画面中心偏上，给字幕留白。
- 字幕衬底（底部 300px 渐变）**常驻**，不随字幕开关，否则字幕间隙底部跳灰阶。

## 时间语法

- 字幕取自配音的从句边界，每条 ≤14 汉字；标点去掉，中英之间留空格（`三段网传的 UFO 视频是真的`）。
- 镜界/事件/砸音落在口播的静音窗或句首：UAP 实例的 20 个 `scenes` 点全部落在
  0.625s 拍网格上（96 BPM，beat0=0.55），锤点即节拍点：13.05 命中、19.28 回拨、25.38 雷达、27.50 锁定。
- 30 秒样片结尾用「目标锁定 → 信号丢失」收在 30.000s；口播若没说完，这是刻意收尾。
- 一条片 = 一条节拍表：`cues.json` 的 `scenes`（boot/vids/conflict/verified/jump/hearing/
  missile/hit/anomaly/check/rewind/carrier/radar/descend/end_fade）+ `sfx` 点表，画面与配乐都从它读。

## 音频

- 配乐 `make_score.py`：96 BPM，Dm–Bb–Gm–A 四和弦循环，8 分贝斯脉冲、16 分数据琶音、
  四拍底鼓、2/4 门限军鼓、8 分踩镲、13.05–14.42 命中后留白、雷达段 16 分金属 tick、侧链压缩。
  全部纯标准库、种子确定性。
- 混音 `mix_audio.py`：人声 1.0，配乐默认 0.42（−7.5 dB）；人声与配乐在 29.30–30.00
  同时淡出；最后 `loudnorm I=-14:TP=-1.5`。
- AAC 封装会把真峰值抬高约 0.1 dB：`mux` 里加 `volume=-0.2dB`，实测 −1.6 dBTP。
- HUD 音效 20 种：`crt_on / static / boot_beep / ui_blip / servo / vid_pop / ui_error /
  stamp / type / whoosh / impact / alarm / scan / radar_ping / radar_sweep / multi_blip /
  target_lock / riser / power_down / crt_off`，只挂在事件点。

## 渲染与 QA

```bash
node xianshiqi/scripts/render_frames.mjs UAP30 --stills 0.3,2.6,13.1,27.6
node xianshiqi/scripts/render_frames.mjs UAP30 --dur 30 --from 0 --to 30
```

- 900 帧 JPEG（`PC_FMT=jpeg PC_Q=92`）。
- Edge 154 上 `puppeteer.launch` 会静默退出：必须 `spawn` + `connect`（脚本已处理）。
- QA：时长 30.000 / 1920×1080 / 30fps / 900 帧 / AAC 48k / −14±0.5 LUFS / ≤ −1.4 dBTP /
  除片尾 0.35s 外无黑帧。
- 确定性：同一帧两次渲染 MD5 相同；禁 `Date.now()` / `Math.random()`，
  随机全走 `mulberry32` / `hash1`。
- 零频闪：扫描线、六边形网格、尘点全部静止；数据列跳动锁 3 帧一档，不逐帧重抽。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 覆盖层相机用 `(0,W,0,H)` | 整层 FUI 不显示 | 居中正交相机，平面放原点 |
| 字幕衬底画进 Caption 逻辑 | 字幕间隙底部跳灰阶 | 衬底常驻，alpha 恒定 0.62 |
| 逐帧重抽噪点 | 画面 10Hz 频闪，手机更明显 | 视频窗噪点按 10Hz 档 + 种子，数据列 3 帧一档 |
| 环刻度每帧新随机 | 刻度抖动像故障 | 旋转角度只由 `t` 决定，无随机 |
| glitch 常开 | 廉价模板感 | 只在 8.62 / 19.28 / 13.05 各 3 帧 |
| 锁定框从 0 长大 | 没有「吸附」感 | scale 1.4→1.0 + eOutCubic，颜色到 1.0 才转绿 |
| HUD 字全用中文 | 不像 FUI | 界面文案用等宽英文，中文只进字幕与面板标题 |
| 全息球占满画幅 | 字幕压球、无负空间 | 球径 2.56 @ z=−6.2，中心偏上；字幕带 300px 留白 |
| 数字滚动用 `Math.random` | 不可复现 | `hash1(seed + frameIndex)` |
| 片尾直接硬切 | 30s 处爆音 | 人声与配乐同时 0.7s 淡出 + 画面 dim 到 0.62 |
| 页面引用 `/node_modules` | 404，three 加载失败 | `xianshiqi/node_modules` 目录联接 + 服务器根指 xianshiqi/ |
| 中文标点进字幕 | 字体缺字形出豆腐块 | captions 里去掉标点，中英之间加空格 |

## 交付

**2026-10-30 用户定稿：样片与阶段成果放回 `出稿/<编号>_<选题>/`，不要只留在工程目录。**
`xianshiqi.py publish` 默认按 `cues.json.source` 找到出稿目录，文件名 `<集号>_赛博HUD<N>秒样片.mp4`，
并附一张 `_预览.jpg` 与 `_说明.md`。

全片定稿仍按根目录 `references/publish.md` 归到 `out/<编号>_<人物>/`（成片 + 两张封面 + 发布信息）。

## 资产与许可

- 视觉语法来自 `mg-styles-15` #22（MIT，Vincentwei1021）；二次分发保留上游许可。
- 字体 Alibaba PuHuiTi 3.0 85-Bold（免费商用）；Chromium/Edge 渲染。
- 不使用真实品牌商标；片中出现的 `UAP // FUSION CENTER`、`SENSOR FUSION DESK`、
  `TACTICAL // PACIFIC TEST RANGE` 均为虚构界面文案。
