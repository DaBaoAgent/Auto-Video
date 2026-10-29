---
name: shouhui
description: 用「逐帧手绘 / 线条沸腾（cel animation / line boil）」做历史科普短片。口播稿 + 成品配音进，10–60 秒手绘纸本成片出：纸纹、墨线 boil、墨字书写、cel 火焰/烟/火星、朱砂印，24fps / 1920×1080 / −14 LUFS。当用户说"用手绘风格做一支""照商纣王那个手绘样片再来一支""要 mg 那种线条会抖的手绘感"时使用。
---

# shouhui：逐帧手绘短片管线

风格内核来自 `Vincentwei1021/mg-styles-15` 的 **05-cel-boil**（MIT）：变宽笔触、每 2 帧换变体的 line boil、
一拍二节奏、smear 拖影、cel FX 点缀、纸纹 multiply。本管线把那套引擎（`engine.js` 原样复用）
和它"网页逐帧渲染"的方法（`harness/render.mjs` 改造版）收成本项目可用的一条链。

输入只有三样：**口播稿、成品配音、`film.json`**；画面写在 `js/scene.js`，音效点写在 `audio/cues.json`。

## 一句话原则

1. **一切是 t 的纯函数。** 禁 `Date.now()` / `Math.random()`，随机全走 `hs()` 哈希；同一帧永远同一像素。
2. **boil 是命门。** 线条每 2 帧换一次噪声变体（一拍二），纸齿也跟着换——"手作感"就靠这个。
3. **镜界/动作点落在配音的静音窗。** 本片 10s 从 0.15s 起切，收在 10.15s 的句间停顿上。
4. **音效是点，BGM 是面，人声是主。** 每个动作点一条 cue，最后统一 `loudnorm I=-14`。
5. **先静帧，后整片。** 一次静帧 5 秒，整片 240 帧要几分钟；改一个节拍先看帧。

## 目录

```
shouhui/
├── SKILL.md                       本文件
├── README.md                      环境与依赖
├── node_modules → vendor/mg-styles-15/node_modules （目录联接，供 node 解析）
├── scripts/
│   ├── shouhui.py                 编排 CLI：new/audio/stills/render/qa/probe/all
│   ├── render.mjs                 逐帧渲染器（改自 harness/render.mjs：站点根/依赖根分离、Edge 默认）
│   └── sfx_build.py               纯标准库音效合成（thud/brush/pop/whoosh/crackle/flutter/stamp）
└── projects/
    └── 012_shangzhouwang/
        ├── film.json              单一数据源：规格 / 音源 / 节拍 / 素材与色板
        ├── index.html             canvas + importmap（simplex-noise / opentype）
        ├── js/engine.js           手绘引擎（原样复制，MIT）
        ├── js/scene.js            本片画面（所有节拍都写在这里）
        ├── assets/                纸纹、墨尘、字体
        ├── audio/                 cues.json / narration.wav / sfx.wav / mix-final.wav
        └── out/                   成片 + stills
```

依赖仓库在 `../vendor/mg-styles-15`（完整克隆，含 15 支原片与 `harness/`）。

## 常用命令

```bash
# 建新片（复制 012 的骨架，改 scene.js 与 cues.json）
python shouhui/scripts/shouhui.py new myfilm --title "标题"

# 音频三段：切配音 → 合成音效 → 混音归一
python shouhui/scripts/shouhui.py audio 012_shangzhouwang

# 静帧（秒，逗号分隔）
python shouhui/scripts/shouhui.py stills 012_shangzhouwang --times 1,3,5,7,9

# 全片（渲染 240 帧 + 混入音轨）
python shouhui/scripts/shouhui.py render 012_shangzhouwang

# 质检：分辨率/帧率/时长/帧数/音轨/响度/黑帧
python shouhui/scripts/shouhui.py qa 012_shangzhouwang

# 看现状
python shouhui/scripts/shouhui.py probe 012_shangzhouwang
```

## 分镜结构（v2 起）

一条片子 = 若干「镜 + 转场」交替。镜长 3–5 秒，转场 0.2–0.35 秒，全部写在同一份 `scene.js` 里：

```
S = { A1: 3.20, T1a: 3.20, T1b: 3.50, B1: 6.70, T2a: 6.70, T2b: 7.00, C1: 10.00 }
```

- **每镜一个 `shotX(c, lt)`**：`lt` 是镜内时间（从 0 开始），镜内所有节拍都按 `lt` 写；
- **每镜一个机位** `CAM.X = {k0,k1,cx,cy}`：景别靠 `k` 拉开（全景 0.95 / 近景 1.19 / 回全景 1.03），别用同一个 k 换构图；
- **转场不是叠化**：T1 是斜墨刷（宽墨带扫过，A 保留在刷子一侧，B 在另一侧露出）；T2 是烧穿（焦黑撕边自下而上，B 被切掉、C 从下面露）；
- 转场里两张镜都要真实绘制（底画 B、上画 A + clip），不能只画一张再盖黑块。

改镜长＝改 `S` 与 `A/B/C` 内部的相对锚点 + `audio/cues.json` 同步改，三者必须一起动。

## 画面怎么写（js/scene.js）

`init(canvas, dpr)` 里加载纸纹、字体（opentype 解析 TTF → 字形轮廓），`render(t)` 里按时间画。
节拍锚点集中写在 `T = {...}`，字位写在 `POS`，改时间只改这两处。

引擎原语（`js/engine.js`）：

| 原语 | 用途 |
|---|---|
| `inkStroke(ctx, P, o)` | 变宽墨线（中心线 + 压感 → 轮廓多边形），自带 taper / 抖动 / 重压侧 |
| `inkLoop(ctx, dense, o)` | 闭合墨圈（分 1–2 笔、带收笔外冲） |
| `fillShape(ctx, dense, color, o)` | 独立 boil 的填充（会与描边错位，手绘感来源） |
| `boil(pts, seed, amp, scale)` | 噪声位移，seed 换一次 = 线条"呼吸"一次 |
| `prefix(pts, frac)` | 沿弧长取前段 → 写字/画线动画 |
| `hatch(ctx, poly, o)` | 手绘排线 |
| `K(t, keys)` / `E.*` | 分段缓动（`outBack` 弹入、`io2` 缓推） |

## 坑（都是踩过的）

1. **字形填充必须整字一条 path + `fill('nonzero')`。** 逐 contour 分别 fill 会把"日/口"的内白填死，
   字直接糊成黑块。
2. **大字号要换细笔字体。** LXGW Marker Gothic 是马克笔体，340px 下笔画会粘连；本片主字用
   Long Cang（OFL，细笔手写），印章小字才用 LXGW。
3. **火焰不要写成三角。** 底宽顶尖 + `pow(1-u,1.35)` 收束 + lobe 起伏 + 墨线勾边，
   才是 cel 火焰；纯多边形会像贴纸。焰底压到字基线以下，否则整字被吞。
   进阶：一簇火 = 主焰 + 两片侧舌 + 内黄 + **主焰上方的游离飘焰**；4–6 簇就够，簇间留空，
   高矮要刻意不齐（齐了就是栅栏）。
4. **焦痕不要用「一堆圆叠出来」**——那是水彩云。正确做法是极坐标半径噪声生成**一条连续撕边**
   （72 点、两轮平滑），再叠外晕 / 碳化主体 / 撕口墨线 / 烧穿孔 / 边缘灰片；孔边留一圈
   `PAL.red` 余烬，孔内用 `PAL.hi`（纸背光）。
5. **字要真的被烧掉一块。** 用 `clip()` 到几个不规则圆 → `drawPaper()` 重绘 → 字的下缘露出纸纹；
   只把字变黑不算烧。
6. **印章要按字形盒居中**：每个字用 `glyphBox` 算包围盒再摆，别用固定 `translate`（两字宽度不同会歪）；
   印面 210px 左右、白文占章宽 ~60%，缺角与斑驳各来几处，否则像贴纸。
7. **纸齿是 multiply 一层就够**，别叠纹理贴图，会脏。
8. **Windows 渲染三个必设**：`MG_CHROME` 指 Edge、`MG_GPU_ARGS="--disable-gpu --no-sandbox"`
   （带 `--use-angle` 会在本机挂住）、`MG_SITE` 指工程目录（URL 里别出现 `//`，否则相对路径会被当成协议相对地址）。
9. **node 找不到 puppeteer**：`shouhui/node_modules` 必须是指向 vendor 的目录联接（`New-Item -ItemType Junction`）。
10. **`audio.py` 不用。** 原片的配乐是它自己合成的；本管线要真人配音，音效走 `sfx_build.py` 的 cue 合成。

## 验收口径

| 项 | 目标 |
|---|---|
| 规格 | 1920×1080 / 24fps / 帧数 = 时长×24 / 有音轨 |
| 响度 | −14 LUFS ±0.7，真峰值 ≤ −1 dBTP |
| 黑帧 | 0 段（`blackdetect d=0.06`） |
| 画面 | 每个节拍至少一个可见变化；无连续静帧 > 0.5s |
| 音效 | 每个动作点都有 cue（落纸/书写×2/弹入×2/火起/火焰床/灰烬/印章） |
