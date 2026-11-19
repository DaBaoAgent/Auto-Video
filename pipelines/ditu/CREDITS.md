# ditu —— 来源与许可

## 数据

| 层 | 来源 | 许可 |
|---|---|---|
| 高程 | AWS Terrain Tiles（Mapzen / Tilezen terrarium，zoom 13 + zoom 11 兜底） | Open data |
| 卫星影像 | Sentinel-2 cloudless 2016 by EOX — <https://s2maps.eu> | **CC BY 4.0**（片尾必须署名） |
| 河道控制点 | 本仓库 `tools/prep_river.py` 手修 11 点 | 本仓库 |

> 片尾固定字幕：`ELEVATION AWS TERRAIN TILES · IMAGERY SENTINEL-2 CLOUDLESS 2016 BY EOX (CC BY 4.0) · VERTICAL ×5 · CITIES AND CAMP SCHEMATIC`
> 垂直夸张倍数以工程实际为准（`pipeline.json` 的 `terrain.vertical_exaggeration`）。

## 代码

| 组件 | 来源 | 许可 |
|---|---|---|
| three.js（`lib/three.module.js`、`lib/addons/**`） | three.js 官方发行包 | MIT |
| `lib/lib.js`（缓动/分段/平滑工具） | 公开样片库/开源风格库 `core/lib.js` | MIT |
| `index.html` / `post.js` / `tools/*.py` | 本项目（原 films/guanyu-fancheng） | 与本项目一致 |
| `scripts/render.mjs` / `scripts/ditu.py` | 本项目新写 | 与本项目一致 |

## 字体

Barlow Condensed、Noto Sans SC —— SIL Open Font License 1.1，只打包本片用到的子集（`tools/fonts_gf.py` 生成）。

## 声音

示例工程只提交字幕切点 `voice/cues.json`；配音为作者本人录制（`038_关羽襄樊之战` 第 4 段，69.39–108.03 s），不入库、不转载。

## 说明

城池、城墙、营地、船只是**按真实地形做的示意落位**；船体尺寸为可读性做了放大。
