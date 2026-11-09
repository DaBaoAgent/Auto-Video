# 鸣谢与许可

## 运行时代码

- **BB-Video** — `runtime/core.js`、`runtime/promo.js`、`runtime/map.js` 及渲染链（`render.mjs`、`music.mjs`、`bgm.mjs`、`sound.mjs`、`lang.mjs`、`net.mjs`、`scores/`）来自 [BubbleBrainBB/BB-Video](https://github.com/BubbleBrainBB/BB-Video)，MIT License，许可见 `runtime/LICENSE.BB-Video`。
- **stickers.js** — 本管线新增的贴纸层，MIT（与 Auto-Video 同许可）。

## 地图数据与库

- **Natural Earth** 1:50m / 1:110m（经 world-atlas@2.0.2 打包）— public domain，https://www.naturalearthdata.com/
- **d3** v7.9.0 — ISC License，https://d3js.org
- **topojson-client** v3.1.0 — ISC License，https://github.com/topojson/topojson-client

页面运行时从 jsDelivr 固定版本加载 d3 / topojson-client / world-atlas；渲染器会缓存网页字体到 `~/.cache/bubble-video/fonts`。

## 字体（OFL 1.1）

- Barlow Semi Condensed — SIL OFL
- Crimson Pro — SIL OFL
- Noto Sans SC / Noto Serif SC — SIL OFL

## 实例：张骞全片

- 口播稿、配音与 44 张 SVG 贴纸：本项目原创。
- 历史叙述已发布视频《张骞寻路》；屏幕文字取自 `projects/zhangqian/brief.md` 的旁白原文。
- 路线为方向示意，非实测古道；底图使用今天坐标，不代表汉代疆界。

## 参考

- 地图编排与镜头语法参考了公开的地图动画作品与制图学惯例（GEOlayers / Vox Borders、Imhof 标签规范、老城市地图的水线画法）；未使用其源码或素材。
