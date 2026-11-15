---
name: pingban
description: 用「平板手写速写」做讲解短片：整页六格手卷，铅笔一笔一笔现场画、镜头跟着笔尖走、字幕像手写在纸上揭出来。口播稿 + 成品配音进，1920×1080 / 24 fps / −14 LUFS。当用户说「平板速写讲解」「手写手卷式讲解」「照关羽那张速写再来一支」「要现场画出来的感觉」时使用。
---

# pingban：平板速写讲解管线

一支片子就是**一张正在被画出来的纸**：六格手卷铺在纸上，镜头跟着笔尖移，说的每件事都有笔画落在那儿。
没有素材图、没有 AI 生图、没有贴纸——所有线条、色块、字、箭雨、水纹都是 2D canvas 一笔一笔画出来的。

首个实例：`projects/038_guanyu_sketch/`（关羽水淹七军，39.42 s，1920×1080 / 24 fps）。

## 一句话原则

1. **画面是"画"的，不是"显示"的。** 每个元素带 `t0`（起笔）和 `d`（笔画时长），`t < t0` 就不存在，`t0 < t < t0+d` 只画到进度那一截。
2. **笔尖是有位置的。** `cam(t)` 跟着当前正在画的笔位走，一格画完才移镜，移镜 0.62 s。
3. **一格一基线。** 六格 620×400 各自一条贯通基线，格内元素只准在格坐标里长，不准跨格。
4. **纸纹先于颜色。** `composite(c)` 把 paper / colour / 铅笔三层 grain 逐像素取阈值，色块才有颗粒感；纯填充一眼数码。
5. **一切是 t 的纯函数。** 随机走 `mulberry` / `h2` 哈希，禁 `Math.random()`；同一帧永远同一像素。
6. **先静帧，后整片。** 改一个节拍先 `stills` 看 1 帧，别直接跑 946 帧。

## 目录

```
pingban/
├── SKILL.md                    本文档
├── README.md                   环境、依赖、快速开始
├── MIGRATION.md                从 lemo-opuscar 迁入的来源与差异
├── pipeline.json               定版参数（画幅/纸域/色板/笔触/相机/字幕/音频）
├── scripts/
│   ├── pingban.py              编排 CLI：new / stills / render / mux / qa / probe
│   └── render.mjs              逐帧渲染器（playwright-core + ffmpeg，与 ditu 共用）
└── projects/
    └── 038_guanyu_sketch/
        ├── index.html          全部画面逻辑（自包含 2D canvas 引擎，零外部依赖）
        ├── fonts/              Caveat-Bold/Medium.ttf、LongCang-sub.woff2、NotoSerifSC-500/700-sub.woff2
        ├── voice/              cues.json（14 条中英双行字幕）
        └── out/                静帧与成片（不入库）
```

## 常用命令

```bash
python pingban/scripts/pingban.py stills 038_guanyu_sketch --times 3.4,6.6,15.0,34.6
python pingban/scripts/pingban.py render 038_guanyu_sketch
python pingban/scripts/pingban.py mux 038_guanyu_sketch
python pingban/scripts/pingban.py qa 038_guanyu_sketch
python pingban/scripts/pingban.py new my_sketch --title "标题"
```

## 引擎 API（都在 `index.html` 一个文件里）

| 名字 | 干什么 |
|---|---|
| `PEN(pts, opts)` | 笔画：0.55 步长点阵 + 压力扰动 + 纸纹阈值，`t0`/`d` 控制出笔节奏 |
| `BLOB(path, color, opts)` | 色块：dx/dy 偏移 + boustrophedon 上色，支持 `stop`/`holes`/`cuts`/`replace` |
| `TXT(str, x, y, ...)` | 写字：canvas `fillText` + 逐字裁剪扫出，**返回 `t0+d` 数值** |
| `spline/resample/ell/bez/rotP/bbox/roughen/plen/along/polyPath` | 几何库 |
| `cam(t)` / `toScreen` / `toWorld` | 手势相机与坐标换算 |
| `drawStylus` / `drawSubs` | 笔尖光斑 / 字幕 chip |
| `window.DUR` `render(t)` `TEXTS` `EV` `CUE` `READY` | 给渲染器的契约 |

## 六格布局（038 实例）

| 格 | 讲什么 | 画什么 |
|---|---|---|
| G1 (60,240) | 七月北上打樊城 | 汉水河道 + 樊城/襄阳城墙 + 北上门道 |
| G2 (750,240) | 七军三万、于禁庞德 | `30000` 大字 + 六个小人 + 七面旗 + 两个人物条目 |
| G3 (1440,240) | 营扎低洼 | 剖面：地形线 + 江面 + 水位虚线 + 双向落差箭头 |
| G4 (60,720) | 水军贴水而来 | 船 + 桨 + 帆 + 水带 + 箭雨 |
| G5 (750,720) | 庞德必死之心 | 台词框（中文引文 + `pang de / 219`） |
| G6 (1440,720) | 淹营、收编 | 营帐 + 粮车 + 兵器 + 水膜 + 白旗 + 收编数字 |

## 已知坑

1. **`TXT()` 必须返回时间戳，不是元素对象。** 曾经 `addEl(e); return e;`，于是所有 `tb = TXT(...)` 之后用 `tb` 当 `t0` 的调用（小人、英文行）全拿到对象 → `t0+d` 是 `NaN` → 前缀扫描判 `false` → **元素存在但永不绘制**。改成 `return addEl(e)` 才对。症状：数字/旗/标签都正常，唯"小人"全灭。
2. **`DYN` 的顺序是图层顺序。** 当初 `rain` 写在 `water` 前面，雨丝被水膜盖住；必须 `water → rain → arrows → surrender`。
3. **字幕 chip 的 `clip()` 要画在阴影之前。** 阴影画在 clip 外面，揭开动画时右缘会露一块灰。
4. **小人与大数字抢位**：`30000` 92 px 基线 380、`seven armies` 26 px 基线 414，小人必须从 574 起画。
5. **相机会露邻格**：视野 850 px 宽、格距 690 px，相机 x 一旦 > 1022，右缘就把 G3 剖面格的"江面"露出来。
6. **船体要是 6 点闭合梯形**，4 点会像信封。
7. **dw 底边不拉到底**（1152 → 1270）会留下一条硬直下沿；左缘要用 `createLinearGradient` 渐隐。
8. **中文 33 px / 英文 29 px 是 1080p 双行字幕的稳定配比**，再大就压画面。

## 验收

- [ ] `stills` 抽 5–10 帧：每个元素都在"该出现的时刻"出现，没有提前也不要迟到
- [ ] 移镜不越过邻格（尤其 G2 → 结果格）
- [ ] 字幕中英双行、与配音逐句对齐、无灰块遮字
- [ ] `qa` 通过：1920×1080 / 24 fps / 946 帧 / 39.42 s / 有音轨 / −14 LUFS
- [ ] 全片无一处"元素存在但没画出来"（对照 `EV` 事件表逐条抽查）
