---
name: xiangsu
description: 像素风历史/科普短片管线。640×360 索引色帧缓冲逐像素绘制，×3 整数最近邻放大到 1920×1080 并在输出分辨率做 CRT，Puppeteer 逐帧捕获、ffmpeg 合成；含 10 秒样片与 272 秒全片两级链路、冻结参数与 4 项自动验收。
---

# xiangsu · 像素风管线

`xiangsu` 是一条**像素密度与输出分辨率解耦**的代码动画管线：画面在 640×360 索引色帧缓冲里逐像素决定，再按 ×3 整数最近邻放大到 1920×1080，CRT 扫描线/暗角/磷光在输出分辨率上做。全流程不依赖任何文生图、图生视频模型。

一个逻辑像素 = 输出上的 3×3 方块，密度与 640×360 版一致；扫描线是 1 px 细线，而不是放大后的 3 px 粗带。

## 目录

```text
xiangsu/
├── SKILL.md                      # 本文件：管线入口
├── MIGRATION.md                  # 从 DaBaoAgent/yandi 落地的来源、哈希校验与路径说明
├── README.md                     # 完整参数、复现、验收与历史记录（权威细节）
├── README_workbuddy_2026-10-28.md # 旧 workbuddy 像素线文档（存档，不再更新）
├── FREEZE.json                   # 2026-10-28 前 10 秒样片冻结基线
├── FREEZE_PIPELINE.json          # 现行身份：目录、环境变量、逐文件 SHA-256
├── build.sh                      # 一键：同步源文件 → 音轨 → 渲染 1920×1080 → 验收
├── make_audio.sh                 # 确定性音轨：demo/audio.py + 两遍 loudnorm
├── verify.mjs                    # 10 秒样片验收（规格/响度/动效密度/像素密度）
├── build_cues.mjs                # cue sheet 构建（切点/字幕/节拍）
├── demo/                         # 前 10 秒源文件真身
│   ├── index.html                # 入口（预加载 Fusion Pixel 12 后 import film.js）
│   ├── film.js                   # 主渲染器：色板/LUT/图元/像素字体/七镜头/转场/CRT
│   ├── sprites.js                # 逐像素 sprite 表（ASCII 字符网格，每字符 = 1 px）
│   ├── cues.json                 # 声画共用 cue sheet（cuts / subs / hits）
│   └── audio.py                  # chiptune + SFX 合成与配音混音（numpy，种子固定）
└── full/                         # 全片链路（272.05 s / 58 镜 / 195 条字幕 / 116 节拍）
    ├── assemble.mjs              # 把 demo/film.js 片头 + parts/*.js 拼成 demos/xiangsu-eden-full/film.js
    ├── parts/                    # 8 个分片（util / spr / 5 组镜头 / tail）
    ├── cues.json · cues.sentences.json · beats.json · sfx_cues.json
    ├── build_full.sh             # 音轨 → 渲染 → 验收（片级参数必填）
    ├── make_audio.sh · audio.py · sfx_prep.py
    ├── make_covers.mjs           # 4:3 / 3:4 双封面（复用成片场景，关字幕关 HUD）
    ├── verify_full.mjs           # 全片验收
    ├── send_film_mail.py         # 分享版邮件投递
    ├── tools/                    # 非目检工具（ascii.mjs / grid.mjs）
    └── FREEZE_*.json             # rev2 / rev3 / rev4 / sample60 / 清理记录
```

## 冻结规格（管线身份，改动 = 新管线）

| 项 | 值 |
| --- | --- |
| 原生栅格 | 640×360，32 色索引色板 + 128 槽环境 LUT（`stageOf` 三段调色，T_HAZE=1.86 s / T_GOLD=6.88 s） |
| 放大 | ×3 整数最近邻，`imageSmoothingEnabled=false` → 1920×1080 |
| 成片 | 1920×1080 · 30 fps · h264 High / yuv420p / bt709 tv |
| CRT 扫描线 | `rgba(0,0,0,0.12)`，1 px 暗线 / 3 px 周期，输出分辨率上生成 |
| CRT 暗角 | 径向 0→0.48，内半径 0.38×1080，外半径 0.95×1080 |
| CRT 磷光 | overlay `rgba(120,255,200,0.02)` |
| 像素字体 | Fusion Pixel 12；字幕带 y=304，SC=2，文字 y=316，打字 0.026 s/字，高亮金 M(15) |
| 音轨 | numpy，种子 20261028；44.1 kHz 双声道；两遍 loudnorm → −16 LUFS / TP −1.5；头 40 ms / 尾 60 ms 淡出 |
| 编码 | libx264 CRF 14 / preset slow / profile high / aq-mode=3；AAC `-b:a 320k`（实测 ≈257 kbps）/ 48 kHz |
| 动效密度口径 | 192×108 灰度、帧间差 >8；2 s 窗口内动效点 >1% 每窗 ≥1；最长静止 <0.6 s |

样片（10 s）与全片（272.05 s）具体帧数、切点、字幕条数与哈希见 `README.md` 与 `FREEZE*.json`。

## 前置依赖

| 依赖 | 说明 |
| --- | --- |
| `mg-styles-15` 渲染仓库 | harness 所在：`harness/render.mjs`、`tools/density.mjs`、像素字体 `assets/fonts/fonts.css`。**不随本仓库提交**，安装见项目 README 的 MG 段落（`git clone --depth 1` 后 `npm install`） |
| Chrome | 无头逐帧渲染，`MG_CHROME` 指向可执行文件 |
| ffmpeg / ffprobe | 音轨合成、成片封装、验收探测，需在 PATH |
| Python + numpy | `demo/audio.py`、`full/audio.py`、`sfx_prep.py` 合成音轨 |
| bash | `build.sh` / `make_audio.sh` / `build_full.sh` 是 bash 脚本，Windows 用 Git Bash 或 WSL |

本目录**没有** `npm install` 步骤：渲染发生在 `mg-styles-15` 仓库内，`build.sh` 会把 `demo/` 同步进 `<repo>/demos/xiangsu-eden/`。

## 快速开始

10 秒样片（伊甸园前 10 秒）：

```powershell
$env:XIANGSU_REPO = "D:/@kaifa/Auto-Video/vendor/mg-styles-15"
$env:XIANGSU_PROJ = "D:/@kaifa/Auto-Video/xiangsu/projects/001_波斯湾伊甸园"
$env:XIANGSU_PY   = "<本机 python.exe，需 numpy>"
$env:MG_CHROME    = "C:/Program Files/Google/Chrome/Application/chrome.exe"
cd D:/@kaifa/Auto-Video/xiangsu
bash build.sh                 # 重做音轨 + 渲染 + 验收
bash build.sh --no-audio      # 复用已生成的 audio.wav，只重渲画面
```

全片（新片参数必填，缺省直接报错，不会静默沿用上一部片）：

```powershell
$env:XIANGSU_PROJ        = "D:/@kaifa/Auto-Video/xiangsu/projects/<新片目录>"
$env:XIANGSU_FILM        = "<新片名>"
$env:XIANGSU_DUR         = "<与 full/cues.json 的 duration 一致>"
$env:XIANGSU_VOICE       = "$env:XIANGSU_PROJ/配音.wav"   # 不设则 build_full.sh 取这个路径
$env:XIANGSU_COVER_OUT   = "<交付目录>"
$env:XIANGSU_COVER_TITLE = "<封面标题，可留空由 XIANGSU_FILM 兜底>"
cd D:/@kaifa/Auto-Video/xiangsu/full
node assemble.mjs             # 改过 demo/ 或 parts/ 后必跑
bash build_full.sh            # 音轨 → 渲染 → 验收
node make_covers.mjs --final --t43 <取帧秒> --t34 <取帧秒>   # 取帧/裁切默认值仍是 001 的，换片必须改
```

## 环境变量

| 变量 | 用在哪 | 默认值（原始仓库值，**必须按本机覆盖**） |
| --- | --- | --- |
| `XIANGSU_REPO` | 渲染仓库 | `D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15` |
| `XIANGSU_PROJ` | 成片落盘目录 | `D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音` |
| `XIANGSU_PY` | 音轨脚本 python | `D:/@kaifa/openviking/.venv/Scripts/python.exe` |
| `XIANGSU_VOICE` | 样片旁白 | `<XIANGSU_PROJ>/配音.wav` |
| `XIANGSU_WORKERS` | 渲染并发 | `4` |
| `MG_CHROME` | 浏览器 | `C:/Program Files/Google/Chrome/Application/chrome.exe` |
| `XIANGSU_FILM` · `XIANGSU_DUR` · `XIANGSU_COVER_OUT` · `XIANGSU_COVER_TITLE` | 全片链路 | 无默认，不设报错 |

旧名 `XIANGSU2_*` 在脚本里仍作 fallback，新名优先。默认值里的 `D:/@kaifa/yandi/...` 是迁移前的历史路径，落地时未改动（保持逐字节冻结），运行前必须覆盖。

## 验收

`verify.mjs`（10 秒样片）与 `verify_full.mjs`（全片）各判 4 项：

1. **规格**：1920×1080 / 30 fps / 帧数与时长 / h264 yuv420p / AAC 48 kHz 双声道。
2. **响度**：−17.5 ≤ I ≤ −15.0 LUFS，TP ≤ −1.0 dBTP。
3. **动效密度**：`tools/density.mjs --win 2 --th 0.005,0.01,0.03 --gw 192 --gh 108 --delta 8`，全部 2 s 窗口通过 + 最长静止 <0.6 s。
4. **像素密度 = 640×360 栅格 ×3**：抽 3 帧（2.30 / 4.60 / 7.30 s）解码后逐像素比对——块内相邻列平均差 <2.5 级、跨块列差更大；左上角像素 ×3 上采样还原，除 `y%3==1` 扫描线行外平均差 <2.0 级、差值 >12 级的像素占比 <1%。

判定基准（无损静止 PNG）与成片容差见 `README.md`「验收」一节；最后打印字节数与 SHA-256（落盘信息，不参与判定）。

## 已知坑

- **动效密度需要全片环境层**：静止镜头（深底 + 字幕打完）会让 2 s 窗口低于 1%，未加环境层实测最长静止 2.57 s。修法是 tail 里加 `ambientAt` 层（rev2 起改为 100 → 40 颗 1–2 px 漂移微尘），微尘必须**反向描点**（亮底描暗、暗底描亮）才有足够对比，否则低于 8 级阈值抓不到。
- **像素密度要在 Y 平面判**：交付 yuv420p 的色度是 4:2:0 抽样，RGB 逐像素比必然出现约 2% 的 >12 级差（与 CRF 无关，无损 4:2:0 也是 2.127%）。栅格结构由亮度平面承载，`verify_full.mjs` 保留 RGB 列差作参考。
- **音效响度必须在下混 mono 之后测**：`aformat=channel_layouts=mono` 与输出端 `-ac 1` 的下混矩阵差 3 dB，用错会让全部音效整体轻 3 dB；`sfx_prep.py` 的测量与渲染已统一到同一条链。
- **片级参数不给默认值**：`full/build_full.sh`、`full/make_audio.sh`、`full/make_covers.mjs --final` 缺 `XIANGSU_PROJ/FILM/DUR/COVER_OUT` 直接报错，避免下一部片写进上一部的目录。
- **封面取帧仍是 001 的默认值**：`--t43/--t34/--up43/--up34/--crop43/--crop34` 换片必须按新片画面重新给。
- **`demo/film.js` 的记录哈希与实际文件不一致**：`FREEZE.json` / `FREEZE_PIPELINE.json` 记 `0a6d7f58…`，实际入库（自 2026-10-29 首次提交起）一直是 `7a929363…`，属原仓库记录漂移，详见 `MIGRATION.md`。

## 修改纪律

- 内容或参数一改，**不要覆盖基线 hash**：先在 `FREEZE*.json` 记新版本条目，再重跑验收。
- 放大倍数、CRT 参数、编码参数属于管线身份，改动 = 新管线，不要在本管线上静默漂移。
- `demos/xiangsu/`（workbuddy 旧像素线）、`demos/xiangsu-bay/`、`demos/xiangsu-eden/` 在渲染仓库里只读，不要改。

完整细节（逐版成片哈希、rev2/rev3/rev4 改动、音效做法、封面与归档、清理记录）以 [README.md](README.md) 为准。
