---
name: muke
description: 用「木刻版画」做graphic短片，一刀一色，形状先定，再用排线造明暗，浅线压在深块上。
---

# muke：木刻版画

一刀一色：形状先定，再用排线造明暗，浅线压在深块上。

## 一句话原则

1. **画面自己画。** 没有上游脚本可调，刻印族的绘制代码在 `vendor/runtime/stylekit.js`，
   这条管线的形状坐标、色板、节拍写在 `projects/demo/main.js` 的 `SPEC` 里，生成时按 id 播种定死。
2. **确定性。** 只用 seeded RNG；不用 `Math.random`、不用 `Date.now`，同一秒数永远同一帧。
3. **一帧一画。** `renderAt(t)` 从空白重画，不叠上一帧，抽帧和整片完全一致。
4. **只出画面。** 配音、字幕、配乐由外层工序接，管线本身不掺。

## 目录

```
muke/
├── SKILL.md
├── pipeline.json         定版参数（画幅/风格族/节拍）
├── scripts/muke.py      入口：--check / --plan / --stills / --render / --mp4
└── projects/demo/
    ├── index.html        画布壳（字体走 assets/fonts）
    ├── main.js           SPEC + 版式牌 + renderAt
    ├── frames/           抓下来的帧（不入库）
    └── out/              静帧与成片（不入库）
```

## 常用命令

```bash
python pipelines/muke/scripts/muke.py --check
python pipelines/muke/scripts/muke.py --stills 0.6,2.0,5.0
python pipelines/muke/scripts/muke.py --render
```

## 画幅：横屏与竖屏（2026-11-20 起）

这条线现在两种画幅都出。渲染仍走 `vendor/runtime/render-legacy.mjs`：

```bash
node vendor/runtime/render-legacy.mjs pipelines/muke/projects/<工程> --width 1080 --height 1920 --fps 30 --out .../out/video-9x16.mp4
node vendor/runtime/render-legacy.mjs pipelines/muke/projects/<工程> --width 1920 --height 1080 --fps 30 --out .../out/video.mp4
```

竖屏参考工程：`projects/ep24v4_photostudio/`（《修照片》，1080×1920 / 10 s / 30 fps，2026-11-20 验收）。做法是工程内直接写 `scene.js`
画到宣纸合成器（`comp.js` 的 dry / col 两层），借 `shuimo2` 的 `comp.js` + `lib.js`，纸纹与墨齿免费拿到。

### 竖屏要记住的六条

1. **一块大画框压住画面**：主体（人像/照片/器物）装进一个占 60% 高度的框里，框外留纸；框自己带木纹，等于给木刻裱了个边。
2. **画框要真木头**：42K 宽黑带 + 木纹白刻（横带刻横纹、竖带刻竖纹、每条 20–40K）+ 四角斜榫 + 内侧一道刨边线；只用描边就不是框，是线。
3. **黑块要留白**：整片黑衣服是最容易糊的，用 `erasePoly` 在黑块里挖出白围裙/白领，再补两三道刻线，人形立刻读得出来。大黑块再撒 20–30 道錾刻短线，黑才透气。
4. **脸靠刀数**：眉两道、眼睑一道、眼球一小块、鼻梁一折 + 鼻翼一点、人中一竖、上下唇各一道、下颌连到耳根、耳内一道；头发上两笔白刻。少一道就成面具。
5. **红只给两处**：暗房安全灯的光晕 + 落款印章。别再加第三个红。
6. **手别硬画五指**：拳头剪影 + 白刻线（指缝）比五根手指可靠；真要伸手进画面就把手放在白纸上，别压在黑块上；手画不好就干脆不画，让框和放大镜说话。

### 竖屏机位与节拍（《修照片》定版）

- 机位只轻推：`s 1.035 → 1.085`、`camX .50 → .528`，推到把木框切出画外就散了。
- 节拍：主体 0–6.2 s（框、人、放大镜、三张小照片依次出现），6.2–6.9 s 白纸自下而上盖满整帧，6.95 s 起刻 `3`/`7`、7.45 s `拍`/`修`、7.5 s 起 30∶70 横线、8.35 s 题句、8.9 s 朱印。
- 换页靠「白纸上滑」，不是叠化；盖满之后再上字，否则字会浮在旧画上。


### 刻线方向的坑

`hatch(c, poly, ang, ...)` 的 `ang` 是**排线的法向**：`ang≈0` 出竖线、`ang≈1.57` 出横线（很容易记反，窗帘/门板别画成百叶窗）。
`clip` 的矩形要比边框多留一个 `lineWidth` 的余量，否则细边框会被切掉一条。

## 验收

- `--check` 全 OK 才动手；缺 puppeteer-core / 浏览器 / ffmpeg 会直接报出来，不假装成功。
- 静帧看三件事：形状对不对、色板是不是这一族的气质、字有没有压到主体。
- 出片后 `ffprobe` 核时长与画幅，与 `pipeline.json` 的 `meta` 对齐。
