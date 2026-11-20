---
name: zhidiao
description: 纸雕剪影风格历史解说视频的固定制作管线（定稿参数）。当用户要求制作/修改"图说历史"类纸雕剪影视频——口播配音、分镜 fragment、组装 composition、hyperframes 渲染、抽帧质检、拼接全片、50MB 压缩交付——时使用本 skill。触发词：纸雕、剪影动画、图说历史、分镜渲染、配音对齐、成片管线、zhidiao。
agent_created: true
---

# zhidiao · 纸雕剪影视频固定管线

## Overview

将「口播文本 → 配音 + 词级对齐 → 分镜 fragment → 组装 composition → 浏览器渲染 → 质检 → 拼接压缩」封装为固定管线。所有参数均为《图说历史 · 二十分钟中国史》项目多轮迭代后**定稿**的值，直接沿用，不要重新发明。

参考交付：`out/2 170万年的中国历史/`（成片 + 封面 + 发布信息）与
`output/china-history-20min/`（母文件、50MB 版、delivery 数据）。本机没有保留
`films/china-history-20min` 的 composition 源，新片按本 skill 的目录契约重新建。

## 管线总览（七阶段）

1. **配音对齐** — `scripts/zhidiao_make_audio.py`：dabao TTS → faster-whisper 词级转写 → 拼音 DP 对齐，产出 `manifest.json`（scenes/captions 时间轴）+ `narration.mp3`
2. **编写 fragment** — 每分部一个 `pXX-scenes.html`（场景 `<section>` + 尾部 `<script>` 设 PART_* 常量与 PART_TIMELINE）
2.5 **分镜素材（可选）** — `tools/zhidiao/agnes_shots.py`：按 `content/<slug>/shots.json` 用 Agnes 生图 / 首帧图生视频，失败自动退避重试，产出 `shots/assets.json`（详见 pipeline.md §2.5）
3. **组装** — `scripts/zhidiao_assemble.py`：fragment + manifest → 完整 `index.html` composition；自动把 `shotslot` 占位符替换成素材层
4. **渲染** — hyperframes 定稿参数（见 references/pipeline.md §渲染）
5. **质检** — 审计补间 + 字幕重叠 + 成品抽帧（三道检查缺一不可）
6. **拼接交付** — ffmpeg concat 无重编码 → x264 两遍压缩 50MB 版
7. **封面与发布信息** — 按统一交付口径：Seedream 两张封面（4:3 2048×1536 / 3:4 1536×2048，恰好 6 个汉字金色毛笔标题直接画入）+ `发布信息.txt`（**5 条候选标题 + 1 行 4 个话题**；每条标题 **≤25 字、两段式强钩子**、含阿拉伯数字），再用 `tools/zhidiao/package_delivery.py` 打包成 `out/<NN 主题>/`（顶层 4 文件 + `源文件/`）

开始前**必读** `references/pipeline.md`：包含全部定稿参数、目录契约、GSAP 动画铁律（绝对 x/y 会摧毁 SVG 基位）、封面/发布口径、以及已踩过的坑。

## 硬性契约（违反即返工）

- fragment `<section>` 数量 **必须等于** manifest scenes 数量，场景 id 从 `s1` 连续编号
- Agnes 分镜素材只在 fragment 里写 `<div class="shotslot" data-shot="sNNN"></div>`，由 assembler 复制并在组装时替换；fragment 不要手写图片/视频路径
- GSAP 对 SVG 元素的 x/y 一律用相对值 `"+=N"`/`"-=N"`，**禁止**在 fromTo 里写绝对 x/y
- 字幕样式唯一来源：`lib/common.css` 的 `.cap`（ch01 式内联副本须同步）；定稿 = 无底板 + 白色加粗 + 2px 黑描边 + 微软雅黑
- 出字幕静帧必须「渲染成品 → ffmpeg 抽帧」——hyperframes snapshot 通道不烧录字幕层
- 交付前必须补齐封面与发布信息（统一交付口径）：两张封面 2048×1536 / 1536×2048，主标题**恰好 6 个汉字**、金色毛笔、由模型直接画入；`发布信息.txt` 固定 **5 条候选标题 + 1 行 4 个 `#话题`**（每条标题 **≤25 字、两段式强钩子**、含阿拉伯数字）；打包后 `out/<NN 主题>/` 顶层只有 4 个文件 + `源文件/`

## 附：一页纸雕短片（横屏竖屏都出，2026-11-20 定版）

除了上面的长片七阶段，`projects/` 里也放得下「一页纸雕短片」：工程自带 `index.html` / `main.js` / `scene.js`，
`main.js` 建一块整页 canvas 直接 2D 绘制（不走 stylekit、不走 hyperframes），渲染仍用共享运行时，**只改宽高**：

```bash
# 竖屏
node vendor/runtime/render-legacy.mjs pipelines/zhidiao/projects/<工程> --width 1080 --height 1920 --fps 30 --out .../out/video-9x16.mp4
# 横屏
node vendor/runtime/render-legacy.mjs pipelines/zhidiao/projects/<工程> --width 1920 --height 1080 --fps 30 --out .../out/video-16x9.mp4
```

竖屏参考工程：`projects/ep24v4_uncleworkshop/`（《叔叔的作坊》，1080×1920 / 10 s / 30 fps，已验收）。
`scene.js` 里所有尺寸都写成 `W`/`H` 的比例或 `K = W/1080` 的倍数，换宽高不用改代码；横屏时把机位抬高一点
（`camY` 收 0.04）就能让桌面与人物都进画。

### 画纸的六条

1. **一层一张纸**：每块形状 = 阴影（3 层 30% / 23% / 16%，向下 5–10px）+ 纸色填充 + 1.5px 暖色切边。纸叠纸的厚度靠这个，不要用模糊。
2. **光源只留一个洞**：窗/灯是背后透光的暖块（`#f4b962`），外面再放一层深纸把洞挖出来；光柱用低透明多边形铺到地面。整帧只此一处暖色，**第 0 帧就要亮**（`winA` 用 0–0.4 s，不要拖到 1.2 s）。
3. **人靠剪影，别硬画手脚**：手就是一块带拇指豁口的纸，压在哪就贴在哪，不要画五指。
4. **手臂的层级**：胳膊先画（在负载后面），载荷再画，手掌最后压在上沿——顺序错了会像胳膊穿过铁皮。
5. **动作要有因果**：抬、喘、落、抹汗，每一步 1.5 s 左右；`lerp(A, B, ss(seg(t,t0,t1)))` 驱动，别让整体横向平移（截腰取景下平移会像滑行）。

### 竖屏·站在案前只露上半身（EP24《叔叔的作坊》验收）

- 视平线放在案沿：人物脚线 `H*.885`、案面 `H*.628`，`c.rect(0,0,W,tableY)` 裁掉腰以下——**腿脚一律不画**，比硬画假腿可信得多。
- 人物比例：`s=1.75`（约 800px 高），`hip = footY-262s`、`sh = hip-172s`、头 `r=33s` 在 `sh-42s`，头肩比约 1:7。
- 侧脸路径按比例点写死（额、眉、鼻尖、人中、下唇、下巴、颌、耳），头发是盖上来的纸块 + 一道发际线细口；眼一道短弧、嘴一道短线，**别加眉弓线/高光**，一加就变涂鸦。
- 肩线从脖子往外**下斜**、背往前弓（`shX` 左移 14s），比直角肩像干活的人。
- 侧逆光只描左边缘：`rim()` 2.4px `rgba(244,185,98,.30)` 沿着脸-颈-肩画。

### 竖屏·压机的力学（同一个验收工程）

- 轮子 `t*.42` 转，连杆从曲柄销连到滑块顶，滑块 `ramTop = H*.470 + 96K*u`，`u = .5-.5cos(2π(t-.6)/1.2)`。
- **冲击时刻 = `t = 1.2 + 1.2k`**（u 的峰在 `q=.5`，不是 `q=0`——这里踩过，火花一直不出现）。
- 冲击后 0.42 s 内出火花：暖色径向光斑 + 14 条放射线 + 10 颗飞屑，全部 `globalCompositeOperation='lighter'`，随 `age` 淡出；铁皮同时压薄 4px。
- 滑块用比机架深一档的纸色（`#202a3c`）加暖边，纯黑会糊进机架、纯机架色会消失。

### 竖屏·抬铁皮的节拍（EP24-11，10 s）

| 时间 | 动作 |
| --- | --- |
| 0–1.8 | 站在案前，手垂到案沿以下（铁皮还在台下），压机砸 |
| 1.8–5.9 | 抬臂把整摞铁皮从台下搬上来，中途晃一下（`wob`） |
| 5.9–8.0 | 落到案面，手指扣住两沿，压机继续砸 |
| 8.0–9.4 | 抬手抹额头（`wipe`），手掌带暖边才不糊进脸 |


