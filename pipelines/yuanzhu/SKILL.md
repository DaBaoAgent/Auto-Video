---
name: yuanzhu
description: 圆珠笔（Ballpoint Sketch）：一支蓝圆珠笔，线宽不变，明暗全靠排线，收笔处积一点墨。 管线自带 runtime 与画法脚本，入口只调本目录画帧器，不依赖外部仓库。
---

# yuanzhu：圆珠笔（Ballpoint Sketch）

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按圆珠笔的媒介原理重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/yuanzhu.py` |

## 这条管线交什么

一支蓝圆珠笔，线宽不变，明暗全靠排线，收笔处积一点墨。

这是一条**自包含的单风格渲染线**：运行时、舞台、画法脚本、入口全在 `pipelines/yuanzhu/runtime/` 里，仓库外不留任何依赖。交付的是风格段 / 风格短片，默认不配旁白。

## 入口命令

```bash
# 抽两帧看画（没装 playwright 时用 uv 带一次）
python pipelines/yuanzhu/scripts/yuanzhu.py --stills 0.5,2.5 --out review/yuanzhu

# 出 7 秒风格段
python pipelines/yuanzhu/scripts/yuanzhu.py --out out/yuanzhu_试片.mp4 --seconds 7
```

## 写法要点

- **先读 `references/style.md`**：那份卡写的是这套圆珠笔的笔触、色光、空间和母题动法；`runtime/scene.js` 是它的实现。
- **画面是代码画的**：`runtime/scene.js` 不加载外部图片、不引用外部库；换题材要重新构图。
- **时间轴按秒算**：`--seconds` 出风格段长度；镜头内动作仍按这套画法的工序走。
- **换题材时保留工序**：先两遍轮廓再细节，最后补投影；收笔处点一粒墨。。

## 自研边界

- 自研：`runtime/render.py`（静态服务、逐帧抓取、ffmpeg 管道）、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/yuanzhu.py`、参数与验收。
- 只参考：上游 anidoodle（Apache-2.0）对这套媒介的描述与工序，见 [CREDITS.md](CREDITS.md)、[MIGRATION.md](MIGRATION.md)；未复制其源码或素材。
- 运行时不读 `vendor/`、不读上游仓库、不调外部渲染脚本。
