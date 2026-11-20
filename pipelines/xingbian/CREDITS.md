# 来源与自研边界

| 项 | 说明 |
| --- | --- |
| 风格来源 | mg-styles-15（https://github.com/vincentwei1021/mg-styles-15，MIT，2026-10 快照（MIT））中的 `08-morph` |
| 参考了什么 | 这种风格的公开说明、工序与风格特征清单 |
| 没有用什么 | 上游 demo 源码、字体、图片与音频素材 |
| 本管线自研 | `runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/xingbian.py` |
| 运行时依赖 | 本目录内文件 + playwright + ffmpeg |

上游 MIT，但这里只读风格描述、重写实现：画法脚本按风格原理逐条实现，代码结构与上游不同。
