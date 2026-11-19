# boli · 彩色玻璃窗

背光镂空：纸色分层叠上，孔洞透出背光，金线勾边。

## 环境

- Node ≥ 18，puppeteer-core（仓库内任意带它的管线即可，默认找 `dengju/node_modules`）
- Edge 或 Chrome（`STYLE_EDGE` 可指定）
- ffmpeg 在 PATH 里
- 字体：`assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf`（仓库自带，OFL）

## 快速开始

```bash
python pipelines/boli/scripts/boli.py --check
python pipelines/boli/scripts/boli.py --stills 1.2,3.4
python pipelines/boli/scripts/boli.py --render
```

产物：`projects/demo/out/boli.mp4`（1920×1080 / 30 fps）。

## 画面是怎么来的

`vendor/runtime/stylekit.js` 里 纸艺族的绘制原语 + 本管线 `SPEC` 的几何与色板。
所有坐标在生成时就写死，运行时不掷骰子。
