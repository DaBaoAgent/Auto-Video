# 封装说明 · muxia（慕夏新艺术）

## 结构

`pipelines/muxia/runtime/` 是一个完整可跑的画布舞台：

- `render.py`：自研画帧器。起本地静态服务 → 打开 `stage.html` → 逐帧 `renderAt(t)` → canvas PNG 走 image2pipe 进 ffmpeg。
- `stage.html` / `player.js`：自研舞台与协议，负责尺寸、字体加载、场景初始化与逐帧清屏。
- `scene.js`：画法脚本，文件头保留 MIT 来源说明。
- `lib/`：该场景真正用到的绘制库（约 230 KB）与按需字体子集，`lib/fonts/LICENSES.md` 记 OFL 清单。
- `scripts/muxia.py`：只拼参数并调用本地 `runtime/render.py`。

## 自研边界

| 部分 | 归属 | 说明 |
| --- | --- | --- |
| 画帧器 / 舞台 / 播放协议 / 入口 / 参数 / 文档 | 本仓库自研 | 不复制上游 render 管线 |
| 画法脚本 `scene.js` | MIT 移植 | 来源 huashu-art-motion v1.3.1 `10_nouveau`，文件头注明 |
| 绘制库 `lib/` | MIT 移植 | 只带该场景用到的模块 |
| 字体 `lib/fonts/` | SIL OFL 1.1 | 按场景裁剪，不全量随仓库 |

## 不依赖上游

- 入口只调 `runtime/render.py`，路径相对本管线解析；删掉仓库外任何目录也能跑。
- 不读 `vendor/`、不读 `~/huashu-art-motion`、不调外部 `render.py`。
- 字体、库、场景全部在 `runtime/` 内，离线可渲染。

## 更新画法

改 `runtime/scene.js` 即可；舞台与画帧器不用动。改了场景后至少抽一帧验收：

```bash
python pipelines/muxia/scripts/muxia.py --stills 0.5,2.5 --out review/muxia
```
