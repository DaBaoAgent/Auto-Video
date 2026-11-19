# fabu · 暗色科技发布

大色块 + 大字：几何压底，字按行进场，横线随进度长出来。

## 环境

- Node ≥ 18，puppeteer-core（仓库内任意带它的管线即可，默认找 `dengju/node_modules`）
- Edge 或 Chrome（`STYLE_EDGE` 可指定）
- ffmpeg 在 PATH 里
- 字体：`assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf`（仓库自带，OFL）

## 快速开始

```bash
python pipelines/fabu/scripts/fabu.py --check
python pipelines/fabu/scripts/fabu.py --stills 1.2,3.4
python pipelines/fabu/scripts/fabu.py --render
```

产物：`projects/demo/out/fabu.mp4`（1920×1080 / 30 fps）。

## 画面是怎么来的

`vendor/runtime/stylekit.js` 里 平面族的绘制原语 + 本管线 `SPEC` 的几何与色板。
所有坐标在生成时就写死，运行时不掷骰子。
