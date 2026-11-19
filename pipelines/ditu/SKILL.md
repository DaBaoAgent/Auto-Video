---
name: ditu
description: 用「真实卫星地形 + 三维水面」做立体地图解说片。口播稿 + 成品配音进，1920×1080 / 24 fps / −14 LUFS：相机从 84 km 高度连续推到 26 km，汉水按真实高程涨水漫岸，营帐/粮车/船/标签钉在真实经纬度上。当用户说「做立体地图解说」「地图上做三维地形」「照关羽水淹七军那个地图再来一支」「要真实地形不要漫画贴纸」时使用。
---

# ditu：立体地图解说管线

地图不是背景板，是**论据本身**：河有多宽、洼地有多低、营地扎在哪、水涨多少能淹到营帐——全靠真实高程数据说话。
画面是 three.js 里的一颗地形球面片 + 一层按 `height.bin` 采样的水面，渲染是浏览器逐帧截 JPEG 交给 ffmpeg，画面是 `t` 的纯函数。

首个实例：`projects/038_guanyu_fancheng/`（关羽水淹七军，39.42 s，1920×1080 / 24 fps）。

## 一句话原则

1. **地形数据是唯一底稿。** 不打手绘山形，不摆贴纸假山：albedo 卫星图 + terrarium 高程 + 手工修过的河道，三者对齐才动手。
2. **水面只按高程画。** 水面出现在 `1 − smoothstep(uLevel−.18, uLevel+.30, ground)` 的位置——水淹到哪，是算出来的，不是画出来的。
3. **涨水是一条曲线。** `flood(t) = 10.4 × eio(seg(t, 21.4, 25.4))`，水位每帧重算；营帐被淹、粮车露出、土堆成岛，全是这条曲线的副产品。
4. **标签必须贴地。** 每个字用 `groundPt(lon, lat, lift)` 落到地形表面，再跑两遍碰撞避让；漂浮在屏幕坐标里的标签一眼假。
5. **一镜到底。** 全片一条连续相机（84 → 26 km），只靠推进速度与雾深讲紧张感，不切镜。
6. **一切是 t 的纯函数。** 禁 `Date.now()` / `Math.random()`；雨丝用哈希噪声，同一帧永远同一像素。

## 目录

```
ditu/
├── SKILL.md                    本文档
├── README.md                   环境、依赖、快速开始
├── MIGRATION.md                从 lemo-opuscar 迁入的来源与差异
├── pipeline.json               定版参数（画幅/地形/相机/色板/渲染/音频/交付）
├── scripts/
│   ├── ditu.py                 编排 CLI：new / stills / render / mux / qa / probe
│   └── render.mjs              逐帧渲染器（playwright-core + ffmpeg，两管线共用）
└── projects/
    └── 038_guanyu_fancheng/
        ├── index.html          全部画面逻辑（three.js + 自定义水面/标签/字幕层）
        ├── post.js             后期（bloom + GTAO + DOF + vignette）
        ├── lib/                随工程走的依赖：three.module.js、lib.js、addons/
        ├── tools/              数据管线：fetch_gf.py → prep_river.py → bake.py、fonts_gf.py
        ├── assets/             albedo.jpg / height.bin / water.png / shadow.png / meta.json / wide_*
        ├── fonts/              Barlow + Noto Sans SC 子集
        ├── voice/              cues.json（14 条字幕：t0 / t1 / zh / en）
        ├── FACTS.md            事实表：高程、河宽、营地坐标、兵力
        ├── CREDITS             数据与字体许可
        └── out/                静帧与成片（不入库）
```

## 常用命令

```bash
# 静帧核对（秒，逗号分隔）——改一个节拍先用它，别直接整片
python ditu/scripts/ditu.py stills 038_guanyu_fancheng --times 3.0,18.6,24.0,31.8

# 无声母版（946 帧约 45–60 s）
python ditu/scripts/ditu.py render 038_guanyu_fancheng

# 混音 + 归一 + 颗粒 → out/<名>_map.mp4
python ditu/scripts/ditu.py mux 038_guanyu_fancheng

# 质检：分辨率 / 帧率 / 帧数 / 时长 / 音轨 / 响度
python ditu/scripts/ditu.py qa 038_guanyu_fancheng

# 从 038 复制一份新工程
python ditu/scripts/ditu.py new my_map --title "标题"
```

## 工序

| 步 | 做什么 | 产出 |
|---|---|---|
| 1 地形 | `tools/fetch_gf.py` 拉 terrarium 高程 + EOX 卫星底图 → `prep_river.py` 手修河道控制点 → `bake.py` 烘 albedo / height.bin / meta.json / wide 层 | `assets/` |
| 2 事实 | 把口播稿里每个数字查实（江面高程、河宽、营地坐标、兵力），写进 `FACTS.md` | `FACTS.md` |
| 3 字幕 | 配音逐句切点写 `voice/cues.json`（`t0/t1/zh/en`），首句 0.09 起 | `voice/cues.json` |
| 4 场景 | `index.html` 里搭地形 / 水面 / 营帐 / 粮车 / 船 / 雨 / 标签 / 数据卡 / 字幕 | 页面可渲染 |
| 5 核对 | `stills` 抽 5–10 帧看标签不叠、水线不穿帮、字幕不出画 | 静帧 |
| 6 出片 | `render` → `mux` → `qa` | `out/<名>_map.mp4` |

## 画面语法

- **相机**：`d(t)` 从 84 km 推到 26 km，`eio` 缓动 + 轻微漂移；雾 `near = d*.55`、`far = d*1.9 + 8`，远处的山靠雾淡出，不靠透明度。
- **水面**：`waterY(t) = (59.4 + flood) / 1000 * 5 + .0035`（×5 垂直夸张）；三段波长 3.4 / 2.6 / 7.5 rad·km⁻¹ 叠出纹理。
- **营地**：46 顶帐篷 + 9 辆粮车 + 兵器堆，全部 `groundPt` 落位；涨水后只留土堆顶上的几顶。
- **船**：放大 3.4×，多 mesh 设 `transparent + depthWrite:false + renderOrder 6`，否则水面会把船切一半。
- **标签**：`营帐 / 扎营 / 粮车 / 兵器 / 樊城 / 襄阳 / 庞德 / 水军`，中英双行、白字 + 暗描边，贴地后再做两遍避让。
- **数据卡**：`汉水暴涨 +8.6 m`（右上角），数字 92 px，配一句白话脚注（"八月连雨 · 平地水数丈"）。
- **雨**：只在水涨起来之后加，方向略斜（风），密度随 `flood` 上升。

## 已知坑

1. **`await Promise.all([...].map(...))` 少一个右括号**，整个 module 静默不执行，页面全黑但 `READY` 不会为 true —— 渲染器会等 120 s 超时才报错。
2. **`const arc` 与 `function arc` 重名**：three.js 的 `ArcCurve` 一次都没被用上，改叫 `take`。
3. **WebGL 上下文丢失**：虚拟机/远程桌面里 Chrome 会建完就丢，出片全黑且 exit 0。先看 `window.__glLost`，必要时 `$env:LEMO_ANGLE="swiftshader"`（慢 6×）。
4. **水面与地形 z-fighting**：水面片必须比地形高 3.5 mm 以上（`+.0035`），再低就出现条带。
5. **标签被地形吃掉**：`lift` 给小了，标签一半埋进坡里；按相机高度给 0.6–1.2 km 的抬升。
6. **一遍避让不够**：46 个营地标签挤在同一个河谷，必须两遍（先按优先级占位，再把剩下的往空位挤）。
7. **字幕在 1080p 下 40 px 才稳**，30 px 在手机上糊成一片。

## 验收

- [ ] `stills` 抽的 5–10 帧里，每个标签都压在地形上、彼此不重叠、不出画
- [ ] 涨水段能看到"水先到、营帐后没"，而不是整片水面一起亮起来
- [ ] 船在水上，船底没被水面切开
- [ ] 14 条字幕与配音逐句对齐（首句 0.09 起，末句收在配音结束前）
- [ ] `qa` 全部通过：1920×1080 / 24 fps / 946 帧 / 39.42 s / 有音轨 / −14 LUFS
- [ ] `CREDITS` 与片尾署名一致（AWS Terrain / EOX CC BY 4.0 / 字体 OFL）
