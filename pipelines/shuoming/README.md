# shuoming · 说明书插画

先画线再标尺寸：主体、引线、图号分层出现，像一张正在被画完的图纸。

## 环境

- Node ≥ 18，puppeteer-core（仓库内任意带它的管线即可，默认找 `dengju/node_modules`）
- Edge 或 Chrome（`STYLE_EDGE` 可指定）
- ffmpeg 在 PATH 里
- 字体：`assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf`（仓库自带，OFL）

## 快速开始

```bash
python pipelines/shuoming/scripts/shuoming.py --check
python pipelines/shuoming/scripts/shuoming.py --stills 1.2,3.4
python pipelines/shuoming/scripts/shuoming.py --render
```

产物：`projects/demo/out/shuoming.mp4`（1920×1080 / 30 fps）。

## 画面是怎么来的

`vendor/runtime/stylekit.js` 里 图纸族的绘制原语 + 本管线 `SPEC` 的几何与色板。
所有坐标在生成时就写死，运行时不掷骰子。
