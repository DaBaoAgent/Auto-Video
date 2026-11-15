---
name: shuimo
description: 用「纸本水墨山水」做科普口播样片与短片。口播稿 + 已录配音进，30–60 秒宣纸底、生成式 SVG 山水、墨渗/画卷转场、竖排题记、朱砂印、古琴拨弦配乐出：1920×1080 / 30fps / −14 LUFS。当用户说「用水墨风出一版」「照 kalpa-shan 那种 SVG 山水再来一支」「要 InkField 那种墨渗感」「shuimo 出片」时使用。
---

# shuimo：纸本水墨山水管线

风格底座是 **kalpa-shan**——本管线自带的 约 15KB（gzip ≈ 5KB）、零依赖生成式 SVG 山水：
fbm 脊线、飞白/皴笔、点叶松、雾带、海天、冰原裂线，一个 seed 一张画。
动态层在 Canvas2D：宣纸纤维、纸齿、墨团遮罩、飞白横扫、朱砂印、竖排题记。
转场语法参考了 InkField（WebGL 墨扩散）的公开技术文档，但**没有使用其源码**，
墨渗用确定性的 Canvas 遮罩实现。

一句话原则：**画面是 t 的纯函数，墨色是纸的函数，镜头是卷轴的函数。**

首个实例：`projects/yuren30/`（013《羽人》前 30 秒样片）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新样片** | 有 `出稿/<编号>_<选题>/配音.wav`，要 30 秒风格测试 | `shuimo.py new` → 改 `cues.json` 与 `js/scene.js` → `shuimo.py all` |
| **B. 中途换段** | 只改某一段的文案/时码 | 改 `cues.json` 的 `captions`/`scenes`/`sfx`，重跑 `audio` → `render` → `mux` |
| **C. 复用视觉** | 只要某类山水/墨渗/印章 | 抄 `js/kalpa-shan.js` 的 preset 与 `js/ink.js` 的 `inkMask / sealSprite / drawMasked` |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `出稿/<编号>_<选题>/配音.wav` | 是 | 44.1k/48k 单声道或立体声；切 0–N 秒 |
| `配音审查.json` | 否 | `asr.records` 提供每句 start/end；`shuimo.py cues` 用它建字幕 |
| `huixingzhen/.../cues_words.json` | 否 | 羽人实例直接沿用其 376 条从句时码 |
| `cues.json` | 是 | **唯一数据源**：标题/集号/字幕/场景节拍/音效点 |
| `index.html` + `js/scene.js` | 是 | 页面协议：`window.DEMO` + `window.renderAt(t)` + `window.__ready` |

## 目录

```
shuimo/
├── SKILL.md                    本文档
├── README.md                   快速开始
├── CREDITS.md                  风格来源与许可
├── pipeline.json               定版参数（画幅/色板/渲染/音频）
├── scripts/
│   ├── shuimo.py               编排 CLI：new/cues/audio/stills/render/sheet/mux/qa/publish/probe/all
│   ├── analyze_voice.py        无 ASR 时从音频测语音块与静音窗（纯标准库）
│   ├── render_frames.mjs       确定性渲染器（spawn Edge + connect，逐帧 JPEG）
│   ├── make_score.py           72 BPM 水墨配乐 + 音效（纯标准库）
│   └── mix_audio.py            人声 + 配乐混音，片尾淡出
└── projects/
    └── yuren30/
        ├── cues.json           字幕 26 条 / 场景节拍 / 音效点
        ├── index.html          页面协议 + 字体
        ├── js/kalpa-shan.js    生成式 SVG 山水（零依赖，~15KB）
        ├── js/ink.js           宣纸 / 墨粒 / 印章 / 竖排 / 墨渗遮罩
        ├── js/scene.js         六场分镜、运镜、转场、字幕
        ├── assets/font/        LongCang / KaiTi
        ├── audio/              narration30 / score / fullmix
        ├── frames/             渲染帧（可删）
        └── out/                成片、静帧、拼图、QA、交付说明
```

`node_modules` 是目录联接，指向 `vendor/mg-styles-15/node_modules`（只用到 puppeteer-core）。

## 常用命令

```bash
cd D:/@kaifa/Auto-Video

# 建工程（复制参考页面、js/ 与字体；新选题必须改 js/scene.js 的场景与文案）
python shuimo/scripts/shuimo.py new myfilm --title "标题" --episode 013 --src 出稿/羽人

# 从从句 JSON / 配音审查.json 建字幕
python shuimo/scripts/shuimo.py cues myfilm --src 出稿/羽人 --to 30

# 音频：切配音 → 合成配乐 → 混音 → loudnorm
python shuimo/scripts/shuimo.py audio myfilm

# 静帧（秒，逗号分隔）；先静帧后整片
python shuimo/scripts/shuimo.py stills myfilm --times 0.6,3.0,5.4,10.8,20.5,29.2

# 全片 900 帧 + 编码（约 46 秒）
python shuimo/scripts/shuimo.py render myfilm

# 拼图 / 封装 / QA
python shuimo/scripts/shuimo.py sheet myfilm
python shuimo/scripts/shuimo.py mux myfilm
python shuimo/scripts/shuimo.py qa myfilm

# 交付到 出稿/<编号>_<选题>/
python shuimo/scripts/shuimo.py publish myfilm
```

## 画面五层

```
Layer 5  字幕（KaiTi 46px + 常驻纸色渐变衬底）与顶部集号
Layer 4  屏幕空间题记：竖排地名 / 年月 / 印章 / 松枝前景
Layer 3  动态墨层：人物、黑匣、四物证、航线、手电、刻度、七室平面
Layer 2  生成式 SVG 山水：远/中/近山脊、江海、冰原、雾带、日轮
Layer 1  宣纸：底色渐变 + 纸纤维 + 纸齿 + 暗角
```

- **山水是 SVG**：`buildSVG(kind,w,h,seed)`，preset 有 site/objects/coast/ice/cut/pit。
  所有山脊、皴笔、树、浪都是 seed 的纯函数；静态层在 init 时一次性光栅化。
- **动态层是 Canvas2D**：每帧全量重绘，但只画变化的元素；静态山水走 `drawImage`。
- **转场是墨**：`inkMask`（墨团生长 + 墨须）、`swipeMask`（飞白横扫）、
  画卷平移；墨渗边缘用 `maskEdge()` 补一圈湿墨，避免白团感。
- **印章是精灵**：`sealSprite` 生成带侵蚀的朱砂印，落印时 2.2→1 缩放 + 墨点飞溅。

## 时间语法

- 字幕取自配音的从句边界，每条 ≤14 汉字；标点去掉。
- `cues.json` 的 `scenes` 是唯一节拍表；`scene.js` 里的 CUTS 与场景函数读同一套时码。
- 五处转场：3.59 墨渗 / 8.83 画卷 / 13.16 飞白回抽 / 17.18 削山（场景内）/
  18.32 墨渗 / 24.35 黑场墨渗。
- 30 秒样片在 30.000s 硬切；配乐 0.55s 淡出、人声 0.55s 淡出。

## 音频

- 配乐 `make_score.py`：72 BPM，D 羽调；Karplus-Strong 古琴拨弦、低频 drone、
  木鱼、鼓、落印、水滴、毛笔擦纸；段落换根音。
- 混音 `mix_audio.py`：人声 1.0，配乐默认 0.52；29.55–30.00 同时淡出；
  最后 `loudnorm I=-14:TP=-1.5`。
- AAC 封装会把真峰值抬高约 0.1 dB：`mux` 里加 `volume=-0.2dB`，实测 −1.6 dBTP。

## 渲染与 QA

```bash
node shuimo/scripts/render_frames.mjs yuren30 --stills 0.6,3.0,10.8
PC_FMT=jpeg PC_Q=94 node shuimo/scripts/render_frames.mjs yuren30 --dur 30 --from 0 --to 30
```

- 900 帧 JPEG 约 46 秒；静帧约 0.3–0.6 秒/张。
- Edge 154 上 `puppeteer.launch` 会静默退出：必须 `spawn` + `connect`（脚本已处理）。
- QA：30.000s / 1920×1080 / 30fps / 900 帧 / AAC 48k / −14.3 LUFS / −1.6 dBTP / 0 黑帧。
- 确定性：同一帧两次渲染 MD5 相同；禁 `Date.now()` / `Math.random()`。
- 零频闪：纸纹/墨粒屏幕空间常驻，不逐帧位移；字幕衬底常驻。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| SVG 里 `<defs>` 写在每个山体 `<g>` 内 | 多山叠加时渐变更容易读错；调试时别用窗口截图判断 | 用 `svgToCanvas` 光栅化后再看整帧；直接开 SVG 只截左上角 |
| 山水渐变的 `objectBoundingBox` | 山体被画面裁掉一半时看不出填充 | 先看整张 SVG，再调相机 |
| 墨渗遮罩没有湿边 | 转场像白色气泡 | `maskEdge()` 补 6–8px 湿墨边 |
| 海面用整块纸色矩形 | 出现硬边白框 | 用海岸线裁剪 + 横波，或让 SVG 山体带 `xmax` 斜坡 |
| 字幕衬底过重 | 底部山体被冲淡 | 918–1080 渐变，最大 0.62；靠文字 glow 保可读 |
| 七室平面直接用 3×3 网格 | 读不出「士」字 | 外墙 + 前室凸出 + 七间标注；必要时只保标签 |
| 4 字朱砂印 | 印文溢出印面 | 4 字竖排 fs=0.205×size、gap=0.165×size |
| 前景松枝用屏幕空间 | 镜头一动就“贴”在画面上 | 只做很淡的角饰，或改图层空间 |
| 场景全静态 | 像 PPT | 每场至少一个活体：雾带、飞鸟、浮尘、工人、水滴、刻度 |
| 中文标点进字幕 | 字体缺字形出豆腐块 | captions 里去掉标点 |

## 交付

**2026-10-30 用户定稿：样片与阶段成果放回 `出稿/<编号>_<选题>/`，不要只留在工程目录。**
`shuimo.py publish` 默认按 `cues.json.source` 找到出稿目录，文件名
`shuimo <集号>_<选题>_水墨<N>秒样片.mp4`，并附一张 `_预览.jpg`（9 帧拼图）与 `_说明.md`。

全片定稿仍按根目录 `references/publish.md` 归到 `out/<编号>_<人物>/`（成片 + 两张封面 + 发布信息）。

## 资产与许可

- `js/kalpa-shan.js` 为独立实现，语法灵感来自 LingDong-/shan-shui-inf（MIT），未复制其代码。
- 墨扩散的视觉语法参考 InkField（ileivoivm）的公开技术文档；其源码未公开，本管线未使用其代码。
- 字体 LongCang / NotoSerifSC（SIL OFL）、KaiTi（本机 Windows 字体，仅本地渲染用）。
- 管线代码为本项目原创；生成式山水与 Canvas 墨层可商用。
