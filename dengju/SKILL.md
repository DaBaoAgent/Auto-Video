---
name: dengju
description: 用「等轴 2.5D Isometric」做科普口播样片与短片。口播稿 + 已录配音进，30–60 秒粉彩微缩模型、真正等轴正交相机、地面瓦片波浪、建筑/墓室生长、平行滑轨运镜出：Three.js 正交场景 + 累积抗锯齿/SSAO 渲染 + 纯标准库明亮拨弦配乐。当用户说「用等距风出一版」「照 03-isometric 那个样片再来一支」「dengju 出片」时使用。
---

# dengju：等轴 2.5D / Isometric 管线

风格内核来自 `mg-styles-15` 的 **03-isometric**（MIT）：
真正的等轴正交相机（仰角 35.264°、方位角 45°）、粉彩摄影棚配色（薰衣草底、薄荷、蜜桃、天蓝、白）、
柔和阴影 + SSAO、地面瓦片波浪、建筑生长、平行滑轨运镜、漂浮岛拉远、标题直接铺在等轴平面上。
本管线把它收成「一条口播驱动一条片」的工程：**画面是时间的纯函数，
字幕落在配音的真实时码上，音频最后统一到 −14 LUFS / ≤ −1.5 dBTP。**

首个实例：`projects/yuren30/`（013《羽人》前 30 秒样片）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新样片** | 有 `出稿/<编号>_<选题>/配音.wav`，要 30 秒风格测试 | `dengju.py new` → 改 `cues.json` 与 `js/world.js` → `dengju.py all` |
| **B. 中途换段** | 只改某一段的文案/时码 | 改 `cues.json` 的 `captions`/`scenes`/`sfx`，重跑 `audio` → `render` → `mux` |
| **C. 复用视觉** | 只要某个微缩模块/动作 | 抄 `projects/yuren30/js/world.js` 的 `rbox/cyl/std`、瓦片波浪、黑匣子、冰下河道、墓室揭盖 |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `出稿/<编号>_<选题>/配音.wav` | 是 | 44.1k/48k 单声道或立体声；切 0–N 秒 |
| `配音审查.json` | 否 | `asr.records` 提供每句 start/end；`dengju.py cues` 用它建字幕 |
| `口播稿_定稿.txt` | 否 | 校正 ASR 同音字 / 无 ASR 时手工定 caption 的依据 |
| `cues.json` | 是 | **唯一数据源**：标题/集号/字幕/场景节拍/音效点 |
| `index.html` + `js/world.js` | 是 | 页面协议：`window.DEMO` + `window.renderAt(t)` + `window.__ready` |

**没有 ASR 时**：跑 `analyze_voice.py` 测语音块（20ms RMS，阈值＝峰值 −28dB，
静音 ≥0.12s 切块），按「全片字数 ÷ 配音总时长」得到字/秒，再按句号处 ≥0.16s 的
长静音把块归到句子，逐条写进 `cues.json`。
羽人实例直接沿用了 `huixingzhen/projects/yuren30/cues_words.json` 的 376 条从句时码。

## 目录

```
dengju/
├── SKILL.md                    本文档
├── README.md                   快速开始
├── CREDITS.md                  风格来源与许可
├── pipeline.json               定版参数（色板/相机/音频/渲染）
├── scripts/
│   ├── dengju.py               编排 CLI：new/cues/audio/stills/render/sheet/mux/qa/publish/probe/all
│   ├── analyze_voice.py        无 ASR 时从音频测语音块与静音窗（纯标准库）
│   ├── render_frames.mjs       确定性渲染器（spawn Edge + connect，逐帧 JPEG）
│   ├── make_score.py           112 BPM / F 大调明亮拨弦配乐 + 音效（纯标准库）
│   └── mix_audio.py            人声 + 配乐混音，片尾淡出
└── projects/
    └── yuren30/
        ├── cues.json           字幕 26 条 / 场景节拍 / 43 个音效点
        ├── index.html          页面协议 + 字幕 + 等距标签
        ├── js/world.js         微缩世界：象岗山工地 → 黑匣子四物证 → 南极冰下河 → 揭盖七室
        ├── js/render.js        累积渲染器（SSAO / 软阴影 / 颗粒），上游 MIT
        ├── js/anim.js          闭式动画工具（ease/spring/drop/pop/rng/track）
        ├── assets/font/        AlibabaPuHuiTi-3-85-Bold.ttf
        ├── audio/              narration30 / score / fullmix
        ├── frames/             渲染帧（可删）
        └── out/                成片、静帧、拼图、QA、交付说明
```

`node_modules` 是目录联接，指向 `vendor/mg-styles-15/node_modules`（three / puppeteer-core）。

## 常用命令

```bash
cd D:/@kaifa/Auto-Video

# 建工程（复制参考页、js/ 与字体；新选题必须改 js/world.js 的场景与文案）
python dengju/scripts/dengju.py new myfilm --title "标题" --episode 013 --src 出稿/013_xxx

# 测语音块（无 ASR 时定字幕用）
python dengju/scripts/analyze_voice.py --src 出稿/013_xxx/配音.wav --to 35

# 从 ASR 建字幕（有 配音审查.json 时）
python dengju/scripts/dengju.py cues myfilm --src 出稿/013_xxx --to 30

# 音频：切配音 → 合成配乐 → 混音 → loudnorm
python dengju/scripts/dengju.py audio myfilm

# 静帧（秒，逗号分隔）；先静帧后整片
python dengju/scripts/dengju.py stills myfilm --times 0.5,3.6,9.9,20.0,25.8,29.5

# 全片 900 帧 + 编码（约 45 秒）
python dengju/scripts/dengju.py render myfilm

# 3×3 静帧拼图 / 封装 / QA
python dengju/scripts/dengju.py sheet myfilm
python dengju/scripts/dengju.py mux myfilm
python dengju/scripts/dengju.py qa myfilm

# 交付到 出稿/<编号>_<选题>/
python dengju/scripts/dengju.py publish myfilm
```

## 画面五层

```
Layer 5  字幕（墨蓝 PuHuiTi 54px + 常驻奶油渐变衬底）与顶部集号
Layer 4  等距标签 DOM 层：锚点 + 引线 + SSR 斜切卡片（rotate ∓30° / skew ∓30° / scaleY .866）
Layer 3  发光层：黑匣子内光、冰下河道、扫描环、墓室灯带（不进 AO 法线 pass）
Layer 2  微缩世界：瓦片 / 山体 / 工地 / 黑匣子 / 四物证 / 海面路线 / 南极冰盖 / 墓室
Layer 1  屏幕空间背景：粉彩渐变 + 等距点阵地面 + 岛影
```

- **相机是真的等轴**：`OrthographicCamera`，`position = target + (1,1,1)×120`，`lookAt(target)`，
  仰角 35.264°、方位角 45°，没有透视。
- **相机只做平移 + 缩放**，不旋转；`camRight=(1,0,-1)/√2`、`camUp=(-1,2,-1)/√6`，
  `CAMX/CAMY/CAMZ` 三个 `track` 关键帧就是全部运镜。
- **标签是 DOM**：卡片用 SSR 矩阵贴在等距面上；卡片中心 = 锚点投影 + 屏幕偏移，
  注意 `translate` 在标签元素里是**相对锚点**的局部坐标（见已知坑）。
- **世界全部在 `js/world.js` 一次性建好**，`update(t)` 只改 transform / emissive / opacity。
- **渲染是累积的**：每帧 4 个子样本（亚像素抖动 + 太阳方向抖动 + 子帧时间），
  AO 用 16 核半球采样，最后 bloom + 中性色调映射 + 颗粒/暗角。

## 时间语法

- 字幕取自配音的从句边界，每条 ≤14 汉字；标点去掉。羽人 26 条覆盖 0–30s。
- `cues.json` 的 `scenes` 是唯一节拍表：`tiles/site/box_open/ivory/persia/mineral/jade/
  route/ice_in/river/whip_back/june/cut/dig2/slabs/flashlight/dark/days43/lift/chambers/
  relics/retainers/title/end_fade`。
- 页面用 `A.track` 读关键帧；**不要在页面里再硬编码一遍时间**。
- 30 秒样片结尾在 30.000s 硬切：配乐 0.45s 淡出、人声 0.45s 淡出，末尾标题保持微呼吸。

## 音频

- 配乐 `make_score.py`：112 BPM，F 大调 F–Dm–Bb–C 四小节循环；FM 马林巴动机、
  FM pluck 16 分琶音、圆润 bass、轻四拍底鼓、2/4 拍手、8 分踩镲、暖 pad、侧链压缩。
  冰段换高音铃；紧张段只留低音与时钟；25.41 揭盖用 crash + sub。
- 混音 `mix_audio.py`：人声 1.0，配乐默认 0.46（−6.7 dB）；29.30–30.00 同时淡出；
  最后 `loudnorm I=-14:TP=-1.5`。
- AAC 封装会把真峰值抬高约 0.1 dB：`mux` 里加 `volume=-0.2dB`，实测 −1.6 dBTP。
- 音效 15 种：`click / pop / sparkle / whoosh / riser / ding / tick / slab / icehit /
  shimmer / rumble / lid / air / impact / sub`，只挂在事件点。

## 渲染与 QA

```bash
node dengju/scripts/render_frames.mjs yuren30 --stills 6.9,10.4,26.2
PC_FMT=jpeg PC_Q=92 node dengju/scripts/render_frames.mjs yuren30 --dur 30 --from 0 --to 30
```

- 900 帧 JPEG（SPP=4）约 45 秒；静帧约 0.1–0.5 秒/张。`DJ_SPP` 可调 1–8。
- Edge 154 上 `puppeteer.launch` 会静默退出：必须 `spawn` + `connect`（脚本已处理）。
- QA：30.000s / 1920×1080 / 30fps / 900 帧 / AAC 48k / −14.2 LUFS / −1.6 dBTP / 0 黑帧。
- 确定性：同一帧两次渲染 MD5 相同；禁 `Date.now()` / `Math.random()`，随机全走 `A.rng(seed)`。
- 零频闪：背景点阵/六边形/云/尘全部只由 `t` 决定；字幕衬底常驻，不随字幕开关。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 标签卡片重复加锚点 | 卡片整片飞到画外/只看到引线 | 标签元素已经 `translate(anchor)`，卡片只用相对锚点的 `dx,dy` |
| 用闭合 Tube 做河道槽 | 灰色槽管把发光河完全包住，河看不见 | 河道只留发光管，或做开口槽；别用全包管 |
| 墓室地板被平台洞口的近边挡住 | 揭盖后只看到一块平地，七室不读 | 墓室整体随揭盖升起 1.95，墙高 0.48，低墙剖面 |
| 墓室地板在洞下看不见 | 洞里是薰衣草背景色 | 在洞口加静态奶油展台（`tombGround`），墓室从展台里升起 |
| 43 天刻度撒在整个平台 | 近景里只剩几根线 | 43 根刻度收在探方周围半径 1.35 的环上 |
| 冰面不透明 | 河道只看到一条暗线 | 冰盖 opacity 0.72→0.15，河道 emissive 3.6，扫描环 additive |
| 山体白色平台层 | 山像婚礼蛋糕，看不清植被 | 层间不要整片白顶板，只留低饱和绿层 |
| 画面是静态的 | 只有相机在动，像 PPT | 每个段落至少一个活体：瓦片/吊车/卡车/船/无人机/雪粒/刻度环 |
| 标签四张挤在物证上 | 物证全被卡片盖住 | 卡片扇形展开 ±260px、S=0.8，引线回锚点 |
| 页面引用 `/node_modules` | 404，three 加载失败 | `dengju/node_modules` 目录联接 + 服务器根指 dengju/ |
| 中文标点进字幕 | 字体缺字形出豆腐块 | captions 里去掉标点 |

## 交付

**2026-10-30 用户定稿：样片与阶段成果放回 `出稿/<编号>_<选题>/`，不要只留在工程目录。**
`dengju.py publish` 默认按 `cues.json.source` 找到出稿目录，文件名
`<集号>_等距<N>秒样片.mp4`，并附一张 `_预览.jpg`（9 帧拼图）与 `_说明.md`。

全片定稿仍按根目录 `references/publish.md` 归到 `out/<编号>_<人物>/`（成片 + 两张封面 + 发布信息）。

## 资产与许可

- 视觉语法来自 `mg-styles-15` #03（MIT，Vincentwei1021）；`js/render.js`、`js/anim.js`
  为上游源码的本地副本，二次分发保留上游许可。
- 字体 Alibaba PuHuiTi 3.0 85-Bold（免费商用）；Three.js（MIT）；Chromium/Edge 渲染。
