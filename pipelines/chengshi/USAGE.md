# chengshi 城市年轮管线 · 运行手册

> 2026-11-03 清理后固化。现行质量基准 = 苏州《城长》**160.7s / 30fps / 1920×1080 审片成片**，
> 画面为 **Esri 卫星影像 + SRTM 地形 + OSM 白模/道路/水系/绿地 + 年轮环 + 时间轴 + 中英字幕**。
> 4K 母版用同一个模板的 `Chengshi` 合成，必须显式加 `--allow-4k`。

## 0. 现行产物

| 件 | 路径 |
|---|---|
| 最新成片 | `projects/suzhou/work/out/full_160b_1080p.mp4` |
| 渲染入口 | `chengshi/scripts/render_cut.py` |
| 一键入口 | `chengshi/scripts/make_city.py` |
| 模板 | `chengshi/render`（苏州 v2 分镜，`render_cut_v2.py` 用）/ `chengshi/template`（通用 v1，`render_cut.py` 用） |

## 1. 环境

| 件 | 位置 |
|---|---|
| Python | `D:/@kaifa/Auto-Video/.venv/Scripts/python.exe`（numpy / Pillow） |
| Node | PATH 里的 node v24；Remotion 依赖需在渲染工程目录（`chengshi/render` 或 `chengshi/template`）`npm install`，仓库不带 `node_modules` |
| 渲染浏览器 | Edge + ANGLE（`remotion.config.ts` 已配） |
| ffmpeg | `C:/Users/20200/bin/ffmpeg.exe` |
| 配音 TTS | 本机 GPT-SoVITS，API `http://127.0.0.1:9880` |

Windows 控制台是 GBK：跑 Python 前加 `PYTHONIOENCODING=utf-8`。

## 2. 新建一座城

### 2.1 建骨架

```bash
cd "D:/@kaifa/Auto-Video"
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chengshi/scripts/chengshi.py new \
  --project <slug> --title "成都·一座城的年轮" --bbox 南,西,北,东
```

`--bbox` 是 **南,西,北,东**（纬度,经度）。骨架会同时锁死 `data.origin`（投影原点），
后续扩 bbox 时机位和标签坐标不会整体漂移。

### 2.2 写六个叙事文件（`projects/<slug>/data/`）

| 文件 | 作用 | 关键字段 |
|---|---|---|
| `rings.json` | 年轮环 | `id / polygon(lon,lat) / year / color / growth:[起,止] / assign_year` |
| `timeline.json` | 顶部时间轴 + 章节 | `ticks[]`；`eras[]` 每章 `t0 t1 year chapterName camera{x,z,dist,pitch,yaw} ring` |
| `captions.json` | 双语字幕 | `{t0,t1,cn,en}` |
| `landmarks.json` | 地标光圈 + 标签 | 见苏州实例；屏幕/世界坐标与年份 |
| `voiceover.json` | 逐句口播 | `lines[]: {id,chapter,t0,t1,cn,en}`；可加 `speed` / `tail` |
| `tags.json` | 旧版标签（可选） | `{t0,t1,cn,en,x,y,tx,ty}` |

年轮环决定建筑在哪一年长出来：圈内建筑按该圈 `growth` 区间确定性铺开；中环外读
`film.json → data.growth_outside`。OSM 没有建成年份，**生长年份是示意**，片尾必须署名。

### 2.3 配音

```bash
# 启动本机 GPT-SoVITS 后（API 9880），逐句生成
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chengshi/scripts/tts_voice.py --project <slug>

# 自备录音：把 NN.wav/mp3 放进 projects/<slug>/work/audio/vo/，NN = voiceover 的 id
```

### 2.4 一条命令出片

```bash
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe chengshi/scripts/make_city.py \
  --project <slug>
```

它按顺序做：抓 OSM（缺哪层补哪层）→ SRTM 地形 → Esri 卫星 → 运行时贴图 → 建白模 →
TTS → 混音（口播 + BGM 闪避 + 环境声，-15 LUFS）→ `render_cut.py` 1080p 审片成片。
已有数据默认跳过，断点续跑安全。

常用开关：

```bash
--skip-fetch      # 数据已抓过
--force-fetch     # 强制重抓（Overpass 失败后重试）
--skip-tts        # 已有人声
--skip-audio      # 沿用已有 mix.m4a
--skip-render     # 只准备数据与音轨
--out PATH        # 指定成片路径
--frames 0-90     # 先渲一小段看构图
--allow-4k        # 渲 4K 母版（需明确批准）
```

### 2.5 预览 / 交付

```bash
# 单帧（默认 1080p 审片合成 ChengshiReview）
python chengshi/scripts/chengshi.py still --project <slug> --frame 300

# 30 帧小样
python chengshi/scripts/make_city.py --project <slug> --skip-fetch --skip-tts \
  --frames 0-29 --out projects/<slug>/work/out/_preview.mp4

# 归到 out/<编号>_<题目>/（母版 + 封面 + 3:4 / 4:3 裁切 + 发布信息）
python chengshi/scripts/chengshi.py publish --project <slug>
```

## 3. 分阶段命令（排查用）

```bash
python chengshi/scripts/fetch_osm.py   --project <slug> --bbox 南,西,北,东 --layers buildings,roads,water,landuse
python chengshi/scripts/fetch_dem.py   --project <slug> --zoom 13
python chengshi/scripts/fetch_esri.py  --project <slug> --zoom 16
python chengshi/scripts/prep_satellite.py --project <slug> --zoom 16
python chengshi/scripts/build_city.py  --project <slug>
python chengshi/scripts/tts_voice.py   --project <slug>
python chengshi/scripts/mix_audio.py   --project <slug>
python chengshi/scripts/render_cut.py  --project <slug> --composition ChengshiReview
```

## 4. 质量硬约束

1. **投影原点锁死**：`film.json → data.origin=[lon,lat]`；改 bbox 不动机位/标签。
2. **bbox 不要太大**：Overpass 单次建议 ≤ 80 km²；`fetch_osm.py` 自动切片，失败会切 OSM 主 API。
3. **楼高**：OSM `height` 优先；否则 `building:levels × 3.2 + 1.5`；都没有按 9m。
4. **地形与卫星同 pad**：默认 0.08°，广角机位才看不到地形边缘。
5. **生长动画确定性**：`tAtYear()` 从时间轴反推，不依赖帧游标（多进程会乱序）。
6. **响度**：混音 `-15 LUFS / TP -1.8`；`render_cut.py` 出片前把真峰值限到 `film.audio.loudness.tp`（-1.5）。
7. **授权**：成片片尾必须保留 `© OpenStreetMap contributors（ODbL）` 与 Esri/SRTM 署名。

## 5. 常见坑

1. **画面全黑**：多半是年份没到 + 地面暗，先渲后期帧确认。
2. **相机方位错 90°**：`CameraRig` 朝向公式是 `(sin yaw·cos pitch, sin pitch, cos yaw·cos pitch)`。
3. **整城消失**：`InstancedMesh` 必须 `frustumCulled=false`。
4. **频闪**：噪点/纸纹是静态贴图，不要逐帧重抽。
5. **配音超槽位**：`mix_audio.py` 会提示；改 `voiceover.json` 的 `t0/t1` 或 TTS `speed`。
