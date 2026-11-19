---
name: moni
description: 用「小人模拟实验」做map短片，场值成色，高斯斑叠成热场，按色阶上色，再压等温线。
---

# moni：小人模拟实验

场值成色：高斯斑叠成热场，按色阶上色，再压等温线。

## 一句话原则

1. **画面自己画。** 没有上游脚本可调，场族的绘制代码在 `vendor/runtime/stylekit.js`，
   这条管线的形状坐标、色板、节拍写在 `projects/demo/main.js` 的 `SPEC` 里，生成时按 id 播种定死。
2. **确定性。** 只用 seeded RNG；不用 `Math.random`、不用 `Date.now`，同一秒数永远同一帧。
3. **一帧一画。** `renderAt(t)` 从空白重画，不叠上一帧，抽帧和整片完全一致。
4. **只出画面。** 配音、字幕、配乐由外层工序接，管线本身不掺。

## 目录

```
moni/
├── SKILL.md
├── pipeline.json         定版参数（画幅/风格族/节拍）
├── scripts/moni.py      入口：--check / --plan / --stills / --render / --mp4
└── projects/demo/
    ├── index.html        画布壳（字体走 assets/fonts）
    ├── main.js           SPEC + 版式牌 + renderAt
    ├── frames/           抓下来的帧（不入库）
    └── out/              静帧与成片（不入库）
```

## 常用命令

```bash
python pipelines/moni/scripts/moni.py --check
python pipelines/moni/scripts/moni.py --stills 0.6,2.0,5.0
python pipelines/moni/scripts/moni.py --render
```

## 验收

- `--check` 全 OK 才动手；缺 puppeteer-core / 浏览器 / ffmpeg 会直接报出来，不假装成功。
- 静帧看三件事：形状对不对、色板是不是这一族的气质、字有没有压到主体。
- 出片后 `ffprobe` 核时长与画幅，与 `pipeline.json` 的 `meta` 对齐。
