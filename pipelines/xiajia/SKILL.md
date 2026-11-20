---
name: xiajia
description: 夏加尔记忆空间（Chagall Dream Space）：记忆空间与情感色彩：人和房子飘起来，颜色比透视更重要。 管线自带 runtime 与画法脚本，入口只调本目录画帧器，不依赖外部仓库。
---

# xiajia：夏加尔记忆空间（Chagall Dream Space）

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（MIT 移植，文件头注明来源） |
| 上游质量 | 研究配方 |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/xiajia.py` |

## 这条管线交什么

记忆空间与情感色彩：人和房子飘起来，颜色比透视更重要。

这是一条**自包含的单风格渲染线**：运行时、舞台、字体、画法脚本、入口全在 `pipelines/xiajia/runtime/` 里，仓库外不留任何依赖。交付的是风格段 / 风格短片，默认不配旁白。

## 入口命令

```bash
# 抽两帧看画（没装 playwright 时用 uv 带一次）
python pipelines/xiajia/scripts/xiajia.py --stills 0.5,2.5 --out review/xiajia

# 出 6 秒风格段
python pipelines/xiajia/scripts/xiajia.py --out out/xiajia_试片.mp4 --seconds 6
```

## 写法要点

- **先读 `references/style.md`**：配方卡写的是这套画法的笔触、色光、空间和母题动法；`runtime/scene.js` 是它的画法实现。
- **画面是代码画的**：`runtime/scene.js` 不加载外部图片；换题材要重新构图，别把上游的「少女＋猫＋桌子」搬过去。
- **时间轴按秒算**：`--seconds` 出风格段长度；镜头内动作仍按画法的节拍走。
- **上游自评 ★，角色还扁，先按 beta 用。**

## 自研边界

- 自研：`runtime/render.py`（静态服务、逐帧抓取、ffmpeg 管道）、`runtime/stage.html`、`runtime/player.js`、`scripts/xiajia.py`、参数与验收。
- 移植：`runtime/scene.js`（画法脚本）与 `runtime/lib/`（绘制库、字体）按 MIT 移植，来源与许可见 [CREDITS.md](CREDITS.md)、[MIGRATION.md](MIGRATION.md)。
- 运行时不读 `vendor/`、不读上游仓库、不调外部渲染脚本。
