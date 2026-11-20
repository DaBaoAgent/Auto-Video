# 来源与自研边界

| 项 | 说明 |
| --- | --- |
| 画法灵感 | anidoodle（https://github.com/alexgreensh/anidoodle，Apache-2.0，v0.9.x（2026-11 快照，Apache-2.0））中的 `dreamGlaze` 一种媒介 |
| 参考了什么 | 这种媒介的工序描述（先做什么、后做什么）、笔触/色光/空间的规矩 |
| 没有用什么 | 上游的 `scene`/`engine` 源码、字体、图片素材、样片 |
| 本管线自研 | `runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/youcai.py` |
| 运行时依赖 | 本目录内的文件 + playwright + ffmpeg，不读上游仓库、不读 `vendor/` |

上游是 Apache-2.0，但这里采用"只读描述、重写实现"的方式接入：
画法脚本逐条按媒介原理重新实现，代码结构与上游不同，因此不构成对其源码的复制或改编。
