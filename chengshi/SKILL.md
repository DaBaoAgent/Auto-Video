---
name: chengshi
description: 城市年轮短片管线（Esri 卫星 + SRTM 地形 + Remotion/three.js 白模 3D 城市，透视机位，OSM 数据驱动，年轮环 + 时间轴 + 中英字幕 + 口播/配乐）。当用户要做「一座城的年轮」这类城市生长/城市史代码短片，或说"用 chengshi 出片""把苏州那套改成成都"时使用。
---

# chengshi —— 城市年轮短片管线

**现行基准**：苏州《城长》160.7s / 4821 帧 / 30fps / 1920×1080 审片成片
（`projects/suzhou/work/out/full_160b_1080p.mp4`）。4K 母版用同一模板的 `Chengshi` 合成。

画面 = **Esri World Imagery 卫星底图 + SRTM 30m 地形 + OSM 白模/道路/水系/绿地 + 年轮环 +
顶部时间轴 + 中英字幕 + 地标光圈 + 口播/配乐**，全程代码渲染，零 AI 视频。

## 一条命令

```bash
cd "D:/@kaifa/Auto-Video"
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chengshi/scripts/make_city.py --project <slug>
```

顺序：OSM（缺层补抓）→ SRTM → Esri → 运行时贴图 → 白模 `city.json` → 逐句 TTS →
混音（口播 + BGM 闪避 + 环境声）→ `render_cut.py` 1080p 成片。
数据已存在默认跳过；`--skip-fetch / --skip-tts / --skip-audio / --skip-render` 可断点续跑。
4K：`--allow-4k`（需宝哥明确批准）。

## 输入（`projects/<slug>/`）

```
film.json                  画幅 / fps / 时长 / 标题 / bbox / origin / 配乐 / 响度 / 交付目录
data/
  rings.json               年轮环（lon/lat 多边形 + year + color + growth:[起,止]）
  timeline.json            时间轴刻度 + 章节（t0/t1/year/机位/高亮环）
  captions.json            双语字幕（秒级 t0/t1）
  landmarks.json           地标光圈与标签
  voiceover.json           逐句口播（id/t0/t1/cn/en；可加 speed/tail）
  tags.json                旧版屏幕标签（可选）
```

## 数据流

```
Overpass / OSM API ──► work/raw/{buildings,roads,water,landuse}.json
AWS Terrain Tiles ───► work/raw/dem.json          （SRTM terrarium, z13）
Esri World Imagery ──► work/raw/esri_z16.jpg/json （z16, pad 0.08°）
prep_satellite.py ───► work/public/data/satellite.jpg（长边 ≤8192）
build_city.py ───────► work/public/data/{city,rings,terrain}.json
                       建筑：多边形→PCA OBB；楼高 height / levels×3.2+1.5 / 9m
                       生长年份：按所在年轮圈的 growth 区间确定性铺开
TTS + mix_audio.py ──► work/public/audio/mix.m4a（-15 LUFS / TP -1.8）
render_cut.py ───────► bundle + Remotion + 真峰值限幅 + 重封装
```

坐标系：以 `film.data.origin` 为原点的米制局部坐标，x 向东、z 向南（北在上）。

## 画面五层

```
5  字幕 / 地标 / 章节卡 / 片尾卡（DOM + SVG）
4  时间轴（顶部刻度 + 年份指针 + 章节名）
3  年轮环（TubeGeometry 双环，按年份出现，加色发光）
2  白模城市（InstancedMesh 楼体 + 道路线 + 水面/河道 + 绿地 + 树）
1  卫星底图 + 地形 + 雾 + 暗角 + 静态噪点
```

## 参数

见 `chengshi/pipeline.json`。改相机/配色/生长节奏都要先渲 `still` 复验。

## 加一座新城市

1. `chengshi.py new --project <slug> --title ... --bbox 南,西,北,东`（同时锁 origin）。
2. 写 `rings / timeline / captions / landmarks / voiceover`；年轮与章节决定叙事。
3. 启动 GPT-SoVITS（API 9880），或把录音 `NN.wav` 放进 `work/audio/vo/`。
4. `make_city.py --project <slug>`，先 `--frames 0-90` 看构图，再全片。
5. `chengshi.py publish --project <slug>` 归交付目录。

## 本机部署

- Python：`D:/@kaifa/Auto-Video/.venv`（numpy + Pillow）。
- Node：Remotion 4.0.484 + @remotion/three + three；依赖装在渲染工程目录自己的 `node_modules`。
  （AutoJY 里 `chengshi/template/node_modules` 曾是指向仓库根 `template/node_modules` 的目录联接；
  本仓库未带这些依赖，`chengshi.py ensure_env()` 会先尝试建联接，基线不存在时回退 `npm install`。）
- 渲染浏览器：Edge + ANGLE（`remotion.config.ts`）。
- Windows 控制台 GBK：跑 Python 前设 `PYTHONIOENCODING=utf-8`。
- **本仓库只放代码与工程，不带运行时依赖**：`.venv/`、`node_modules` 均需本机自备；
  缺依赖时在 `chengshi/render`（或 `chengshi/template`）里 `npm install`。

## 常见坑

1. **OSM 没有建成年份**：生长年份是示意，片尾必须署名。
2. **bbox 太大**：Overpass 会 504；脚本按 0.05° 切片，失败自动切主 API 0.01° 瓦片。
3. **机位是透视相机**：fov 每镜 30–42°（`camera.ts` 的 `fovSkim/fovOrbit/fovPull`）；改机位先渲 still 复验。
4. **InstancedMesh 必须 `frustumCulled=false`**。
5. **生长动画必须确定性**：`tAtYear()` 反推，不能依赖帧游标。
6. **噪点/纸纹静态**：逐帧重抽会频闪。
7. **交付署名**：`© OpenStreetMap contributors（ODbL）` + Esri + SRTM。
8. **扩 bbox 锁原点**：`film.json → data.origin`，否则机位/标签整体漂移。

## 与 lishi 的关系

共用 `template/` 的 Remotion 依赖、`projects/` 与 `out/` 交付约定；渲染层独立：
lishi 是 2D SVG 纸本，chengshi 是 3D WebGL + 卫星地形。互不 import。
