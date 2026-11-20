# 接入记录

## 判定

- 上游风格：`lowPoly`（低多边形 / Low-poly）
- 判定：**新接入**
- 理由：仓库里没有同族管线；现有的dengju 等轴世界 / jimu 积木玩具那一类解决的是别的媒介，不能替代。

## 落成

| 项 | 值 |
| --- | --- |
| 管线 id | `diduo`（双拼，按 Auto-Video 命名传统） |
| 工位 | 07 三维推演 |
| 画幅 | 16:9 · 24 fps |
| 默认时长 | 6 s |
| 入口 | `scripts/diduo.py` |

## 自研清单

1. `runtime/render.py` 逐帧画器：本地静态服务 + Chromium 抓帧 + ffmpeg 管道。
2. `runtime/stage.html` / `runtime/player.js`：单场景舞台协议（`renderAt(t)`）。
3. `runtime/lib/util.js`：定种子随机、缓动、纸纹、按比例揭示笔画。
4. `runtime/scene.js`：按低多边形的工序重写的画法脚本。
5. `scripts/diduo.py`：CLI 入口，只调本目录画器。

## 没有搬的东西

- 上游的画法脚本、引擎、字体与图片资源一概不取；样片只作为演示站封面素材（官方风格对照图裁切），
  不进管线运行路径。
