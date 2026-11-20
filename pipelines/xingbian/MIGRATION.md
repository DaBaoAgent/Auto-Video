# 接入记录

## 判定

- 上游风格：`08-morph`（形变动画 / Shape Morph）
- 判定：**新接入**
- 理由：仓库里没有同族管线；wenzi 文字闪切 / xiangxing 象形运动图形解决的是别的风格，不能替代。

## 落成

| 项 | 值 |
| --- | --- |
| 管线 id | `xingbian`（双拼，按 Auto-Video 命名传统） |
| 工位 | 平面动效 |
| 画幅 | 16:9 · 24 fps |
| 默认时长 | 8 s |
| 入口 | `scripts/xingbian.py` |

## 自研清单

1. `runtime/render.py` 逐帧画器：本地静态服务 + Chromium 抓帧 + ffmpeg 管道。
2. `runtime/stage.html` / `runtime/player.js`：单场景舞台协议（`renderAt(t)`）。
3. `runtime/lib/util.js`：定种子随机、缓动、噪声。
4. `runtime/scene.js`：按形变动画的工序重写的画法脚本。
5. `scripts/xingbian.py`：CLI 入口，只调本目录画器。

## 没有搬的东西

- 上游的画法脚本、字体、图片、音频一概不取；演示站样片暂用上游公开成片，只作展示，不进管线运行路径。
