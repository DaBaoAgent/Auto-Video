# xiangsu 管线（伊甸园 · 1920×1080 成片 / 640×360 像素密度）

> 管线代号：**xiangsu**（原名 xiangsu2）。2026-10-28 依宝哥要求，把《001 波斯湾伊甸园》前 10 秒的制作流程与参数单独固化；
> **2026-10-29 接管 `render/xiangsu/` 的名字并封装固化**，作为像素风管线的唯一现行版本。
> 旧 workbuddy 像素线文档存档为 `README_workbuddy_2026-10-28.md`，其代码在 `demos/xiangsu/`，与本管线互不调用、互不覆盖。

## 定位

上一代 workbuddy xiangsu 线的成片是 640×360；本管线要的是 **成片 1920×1080，但像素密度仍是 640×360**。
做法：

```
640×360 索引色帧缓冲（所有造型/抖动/描边逐像素决定）
  → ×3 整数最近邻放大（imageSmoothingEnabled = false）
  → 1920×1080 CRT 后处理（1 px 扫描线 / 3 px 周期 + 暗角 + 磷光）
  → x264 CRF 14
```

一个逻辑像素 = 输出上的 3×3 方块，密度与 640×360 版完全一致；CRT 在输出分辨率上做，扫描线是 1 px 细线而不是放大后的 3 px 粗带。
不依赖任何文生图/图生视频模型。

## 目录

```
yandi-video/render/xiangsu/
├── README.md          本文件（冻结参数 + 复现 + 验收）
├── README_workbuddy_2026-10-28.md  旧 workbuddy 像素线文档（存档，不再更新）
├── FREEZE.json        冻结基线：源文件/音轨/成片的 SHA-256
├── build.sh           一键构建：同步源文件 → 音轨 → 渲染 1920×1080 → 验收
├── make_audio.sh      确定性音轨：audio.py + 两遍 loudnorm
├── verify.mjs         成片验收（规格/响度/密度/像素密度/落盘）
└── demo/              源文件真身
    ├── index.html     入口（预加载像素字体后 import film.js）
    ├── film.js        主渲染器（色板/LUT/图元/像素字体/七镜头/转场/CRT）
    ├── sprites.js     逐像素 sprite 表（ASCII 字符网格，每字符 = 1 px）
    ├── cues.json      声画共用 cue sheet（cuts / subs / hits）
    └── audio.py       chiptune + SFX 合成与配音混音（numpy，种子固定）
```

构建落点：`<mg-styles-15 克隆>/demos/xiangsu-eden/`（harness 只能服务仓库内目录，`build.sh` 会把 `demo/` 同步进去）。
全片与封面分别落在 `demos/xiangsu-eden-full/`、`demos/xiangsu-cover/`（均可再生）。
`demos/xiangsu/`（workbuddy 的旧 xiangsu 线）与 `demos/xiangsu-bay/`（640×360 样片）都不参与本管线，不要改。

## 冻结参数（2026-10-28）

| 项 | 值 |
|---|---|
| 原生栅格 | 640×360，32 色索引色板 + 128 槽环境 LUT（`stageOf` 三段调色，T_HAZE=1.86 s / T_GOLD=6.88 s） |
| 放大 | ×3 整数最近邻，`ctx.imageSmoothingEnabled=false; ctx.drawImage(small,0,0,1920,1080)` |
| 成片 | 1920×1080 · 30 fps · 300 帧 · 10.000 s · h264 High / yuv420p / bt709 tv |
| CRT 扫描线 | `rgba(0,0,0,0.12)`，1 px 暗线 / 3 px 周期，输出分辨率上生成 |
| CRT 暗角 | 径向 0→0.48，内半径 0.38×1080，外半径 0.95×1080 |
| CRT 磷光 | overlay `rgba(120,255,200,0.02)` |
| 像素字体 | Fusion Pixel 12；字幕带 y=304，SC=2，文字 y=316，打字 0.026 s/字，高亮金 M(15) |
| 切点 | `1.32 / 2.56 / 3.66 / 4.96 / 6.96 / 8.60`（cues.json `cuts`） |
| 字幕 | 9 条，时间与 `配音.transcript.json` 字符级对齐（起点 Δ≤0.06 s，终点 Δ≤0.20 s） |
| 音轨 | numpy，种子 20261028；44.1 kHz 双声道；两遍 loudnorm → -16 LUFS / TP -1.5；60 ms 尾淡出、40 ms 头淡出 |
| 编码 | libx264 CRF 14 / preset slow / profile high / aq-mode=3；AAC `-b:a 320k`（ffmpeg 原生编码器实测 ≈257 kbps）/ 48 kHz |
| 动效密度口径 | 192×108 灰度，帧间差 >8；2 s 窗口内 >1% 动效点每窗 ≥1；最长静止 <0.6 s |

## 复现

前置：Chrome、ffmpeg 在 PATH；渲染仓库 `mg-styles-15` 已 `npm install`（puppeteer-core）；
Python 用 `D:/@kaifa/openviking/.venv/Scripts/python.exe`（numpy）。

```bash
cd D:/@kaifa/yandi/yandi-video/render/xiangsu

# 全量（重做音轨 + 渲染 + 验收）
bash build.sh

# 只重渲画面（复用已生成的 audio.wav）
bash build.sh --no-audio
```

环境变量（`build.sh` 样片构建的本机默认值）：

| 变量 | 默认 |
|---|---|
| `XIANGSU_REPO` | `D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15` |
| `XIANGSU_PROJ` | `D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音`（样片落点） |
| `XIANGSU_PY` | `D:/@kaifa/openviking/.venv/Scripts/python.exe` |
| `XIANGSU_VOICE` | `D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/配音.wav`（样片旁白） |
| `MG_CHROME` | `C:/Program Files/Google/Chrome/Application/chrome.exe` |

全片管线（`full/build_full.sh`、`full/make_audio.sh`、`full/make_covers.mjs --final`）的**片级参数没有默认值，未设置会直接报错**，见「新片参数（2026-10-30）」一节。旧名 `XIANGSU2_REPO` / `XIANGSU2_PROJ` / `XIANGSU2_PY` / `XIANGSU2_VOICE` / `XIANGSU2_COVER_OUT` 仍兼容（新名优先）。

分步等价命令：

```bash
# 1) 音轨
bash make_audio.sh "<repo>/demos/xiangsu-eden"
# 2) 关键帧（目检用）
cd "<repo>" && MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu-eden --stills 2.30,4.60,7.30
# 3) 全片
cd "<repo>" && MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu-eden --w 1920 --h 1080 --fps 30 --duration 10 \
  --audio demos/xiangsu-eden/out/audio.wav --crf 14 \
  --out "D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4"
# 4) 验收
node verify.mjs "D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4"
```

## 验收（verify.mjs：4 项判定 + 落盘信息）

1. **规格**：1920×1080 / 30 fps / 300 帧 / 10.000 s / h264 yuv420p / AAC 48 kHz 双声道。
2. **响度**：-17.5 ≤ I ≤ -15.0 LUFS，TP ≤ -1.0 dBTP。
3. **动效密度**：`tools/density.mjs --win 2 --th 0.005,0.01,0.03 --gw 192 --gh 108 --delta 8`，全部窗口通过 + 最长静止 <0.6 s。
4. **像素密度 = 640×360 栅格 ×3**（抽 t=2.30/4.60/7.30 三帧，解码为 rgb24 逐像素算）：
   - 块内相邻列平均差 <2.5 级（同一逻辑像素内），跨块列差必须更大（内容边）；
   - 取每块左上角像素 ×3 上采样回去，除扫描线行（`y%3==1`）外平均差 <2.0 级、差值 >12 级的像素占比 <1%。

最后打印字节数与 SHA-256（落盘信息，不参与判定）。

判定基准（无损静止 PNG）：块内列差 0.01–0.03、跨块 4.2–12.0、还原平均差 0.02–0.04、最大差 2（暗角渐变）；
成片经过 x264 后允许少量编码噪声，故第 4 项门槛放宽到上表的 2.5 / 2.0 / 1%。

## 冻结基线（2026-10-28）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_前10秒_1920x1080.mp4`
`10,433,009 B` · SHA-256 `9a63b49adca6c385b1b3ef69b6d4c199201c3d98caec83e1835761bc55127155`
验收：规格 / 响度 / 密度 / 像素密度 4/4 PASS（2026-10-28，详见 `FREEZE.json`）。
回归：与已验收的 640×360 样片对比，画面 SSIM All=0.9677（差异仅来自 CRT 在输出分辨率重做），AAC 音频包 MD5 逐字节相同。

源文件 SHA-256：

| 文件 | SHA-256 |
|---|---|
| demo/index.html | `825a72cff674b9d5b9273a66e027b7057ca5b5ce87f327d96f65f51f10d1e2ba` |
| demo/film.js | `0a6d7f5847822e6a336b676f046822fe21f7656ae845ba4007c8f4aee638ce64` |
| demo/sprites.js | `ef19041da186ff4bffcda46cc1d64fd63e343187f8a5218b1429ae32cbb4475f` |
| demo/cues.json | `568fd78aa9de32446c888f0361d8d6f2bdc185385599695d57fbe7bc2b661882` |
| demo/audio.py | `7a88275a85e6715350b4df0ddba0c63c9594044a00915e7a8e9c2b799ecc2c2f` |
| make_audio.sh | `3a7c3dffd9769d5298ace3ed601c3793e9ff0d8cabf9a83fbd923894ccd45236` |
| build.sh | `c0963d959c1a1101d5ee52a49511365baa3bc5fb0a0d046196e2542d71c277b6` |
| verify.mjs | `25adc08c914e5e6c389e1ce2ed3cdb3a12f369277b03c40cccdc41389d07305a` |

音轨：`audio.wav` = `2b6e5ca5e95eb985a9f575467e3770a9a40f85be005bbaad57c64f5006b1e6c8`
（与 640×360 样片音轨逐字节相同；`mix_raw.wav` 也可确定性复现，说明合成链路无随机漂移。）

## 修改纪律

- 内容或参数一改，**不要覆盖基线 hash**：先在 `FREEZE.json` 记新的版本条目，再重跑 `verify.mjs`。
- 只动本目录；`demos/xiangsu/`（workbuddy 旧线）、`demos/xiangsu-bay/` 只读。
- 放大倍数、CRT 参数、编码参数属于管线身份，改动 = 新管线，不要在本管线上静默漂移。

## 全片（2026-10-29 · rev2）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/全片_波斯湾伊甸园_272秒_1920x1080.mp4`
`136,567,179 B` · SHA-256 `5325721baa072ec1b3f4e24f776cac68e34e7e7a519aea1746fceb074454e857`
规格：1920×1080 / 30 fps / 8162 帧 / 272.05 s / h264 yuv420p CRF 14 / AAC 48 kHz 双声道；响度 -16.02 LUFS / TP -1.41 dBTP。
验收：`full/verify_full.mjs` 4/4 PASS（2026-10-29，详见 `full/FREEZE_full.json`）。

rev2 按宝哥复审修改：① 取消画面里自上而下的扫描光带（环境层只保留漂移微尘，CRT 静态扫描线属交付格式不变）；② 城市卡与农业词卡的中英文改为并排、无空格、全部收进卡片框内；③ BGM 相对人声提高 1.9 dB（voice + bed×0.20，两遍 loudnorm 仍 -16 LUFS）。

实现：`full/` 目录用 `assemble.mjs` 把 `demo/film.js` 的片头部分（前 10 秒样片代码，逐字节未改）与 `full/parts/*.js`（51 个镜头函数 + tail）拼成 `demos/xiangsu-eden-full/film.js`；数据来自 `full/cues.json`（58 镜切点 / 195 条字幕 / 116 个节拍点）。

两条量测口径说明：

1. **动效密度需要全片环境动效层**。静止镜头（尤其深色画面 + 字幕打字完毕后）会让局部 2 s 窗口低于 1% 动效点；未加环境层时实测最长静止 2.57 s，全片有 144 段 ≥0.5 s 的静止。修复没有改镜头，而是在 tail 里加了一层全片环境动效（`ambientAt`）：rev1 用扫描光带 + 浮尘（会被看成自上而下的横纹，已在 rev2 删除），rev2 改为 100 颗 1–2 px 漂移微尘——横向 52–98 px/s、正弦上下浮动，并按落点亮度反向描点（亮底描暗、暗底描亮）。rev2 全片最长静止 0.00 s，每个 2 s 窗口均通过。
   - 关键点：微尘必须与背景形成足够对比（反向描点）才能被 192×108 灰度降采样捕捉；缓慢柔和的低对比动效会低于 8 级阈值。
2. **像素密度改在 Y 平面判定**。交付规格 yuv420p 的色度是 4:2:0 抽样，抖动色块经 RGB 解码逐像素比必然出现 ~2% 的 >12 级差；实测与编码质量无关（CRF 14/12/10 同值，无损 4:4:4 为 0.000%，无损 4:2:0 为 2.127%）。栅格结构由亮度平面承载：Y 还原平均差 0.15–0.35 级、>12 级占比 ≤0.004%。`verify_full.mjs` 保留 RGB 列差（块内 <2.5、跨块更大）与 RGB 还原差作参考。

分享版（邮件附件，<50 MB）：`全片_波斯湾伊甸园_272秒_1280x720_分享版.mp4` `33,343,559 B` · SHA-256 `43f93d5433d7a5ce679da854aaec74550ebe2759e8aa2dc7756d6b00eed23a38`（CRF 24 / faststart；母版仍是 1080p 3× 栅格）。

## 第一分钟审核样片（2026-10-29 · rev3 基准，宝哥已确认）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/样片_第一分钟_1920x1080.mp4`
`52,794,270 B` · SHA-256 `1d727d50ca57e8260824354b0a493046fd0d7c0ff0cef248f5a1ad0b43c59c5e`
规格：1920×1080 / 30 fps / 1827 帧 / 60.9 s / h264 yuv420p CRF 14 / AAC 48 kHz 双声道；响度 -16.02 LUFS / TP -1.41 dBTP。音轨复用 rev2 `full/out/audio.wav`（`0f06c2bd…`，逐字节一致）。
验收：响度 PASS；动效密度 PASS（最长无有效变化段 0.37 s，全部 2 s 窗口通过）；像素栅格 PASS（探针 >12 级占比 0.718% / 0.834% / 0.896%）；规格项按 10 s / 300 帧口径判 FAIL 属预期，样片实际 60.9 s。
冻结：`full/FREEZE_sample60.json`（源文件/成片 SHA-256、逐窗口密度、漂移区对照量测）。

rev3 改动（相对 rev2）：① 微尘 100 颗快速 → 40 颗慢速（14–29 px/s）；② 连续动作元素全部改预烘焙帧表 blit（酒馆日冕 34 帧、天花板、陶罐组、陶罐鱼纹、船、磁石、鱼群等）；③ 静态元素像素细化（书脊、地层夹杂、雕像明暗、卡片边框）；④ 新增整数像素机位微呼吸（三角波 ±2~3 px，每 0.4 s 必走 1 px，仅 t ≥ 10.10 s，片头海湾镜头不叠加）；⑤ 新增内容动效：潜水涟漪与气泡、标题卡游动鱼群、油灯摆动。

## 全片（2026-10-29 · rev3，已通过验收）

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/全片_波斯湾伊甸园_272秒_1920x1080.mp4`
`195,901,830 B` · SHA-256 `aaeede5e49c6a2caa724c4f328078f19d0c315d03952486057654bf1062702b5`
规格：1920×1080 / 30 fps / 8162 帧 / 272.05 s / h264 yuv420p CRF 14 / AAC 48 kHz 双声道（约 5.76 Mbps；比 rev2 高，因机位微呼吸增加了全片运动量）；响度 -16.02 LUFS / TP -1.41 dBTP。音轨与 rev2 逐字节一致（`0f06c2bd…`）。
验收：`full/verify_full.mjs` 4/4 PASS（规格 / 响度 / 动效密度 / 像素栅格）。动效密度最长无有效变化段 0.37 s；像素栅格 7 个探针（2.3/45/77/120/175/220/267 s）Y 平面还原差 0.13–0.37 级、>12 级占比 ≤0.003%。
冻结：`full/FREEZE_full_rev3.json`。rev2 母版保留为 `全片_波斯湾伊甸园_272秒_1920x1080_rev2.mp4`（哈希见 `full/FREEZE_full.json`）。
分享版（邮件附件，<50 MB）：`全片_波斯湾伊甸园_272秒_1280x720_分享版_rev3.mp4` `28,771,095 B` · SHA-256 `b3795eed080f516d333175564eb82d9640a7b61734adf6b64d89dcd08fbc717f`（1280×720 最近邻降采样 / CRF 24 / faststart；SSIM 对 rev3 母版 0.944）。

## 全片（2026-10-29 · rev4 音效版）

在 rev3 成片上插入 58 条真实音效（音效库 `D:/@kaifa/@/音效`）。视频码流未重编码。

成片：`D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音/全片_波斯湾伊甸园_272秒_1920x1080.mp4`
`195,824,510 B` · SHA-256 `910d81c5fb70c9a250925d8b79e9d0b7b9a2953f3aa83c14ea847e3f5e808922`
规格：1920×1080 / 30 fps / 8162 帧 / 272.067 s / h264 yuv420p CRF 14 / AAC 48 kHz 双声道；响度 -16.00 LUFS / TP -1.46 dBTP。
视频码流与 rev3 逐字节相同（`-c:v copy`，码流 MD5 `668a59a9…`）；rev3 母版保留为 `全片_波斯湾伊甸园_272秒_1920x1080_rev3.mp4`（`195,901,830 B` · `aaeede5e…`）。
验收：`full/verify_full.mjs` 4/4 PASS（规格 / 响度 / 动效密度 / 像素栅格）。
冻结：`full/FREEZE_full_rev4.json`。

音效做法（`full/sfx_cues.json` → `sfx_prep.py` → `audio.py`，`make_audio.sh` 已串起预处理）：

- 58 条，平均 4.72 s 一条（最短 2.10 s、最长 6.90 s），落点对齐切点/关键词（水＝浪/划桨/冒泡，神庙＝排钟/钟声，冲突＝号角/金属碰撞，冰期＝风，结尾＝咚）。
- 每条切掉开头静音，最多只播 2 s（更短的按原长），常量增益精确统一到 -21 LUFS；仅 7 条为守住 -1.0 dBTP 加轻度限幅（最深约 2.6 dB）；58 条复测响度极差 0.42 LU。
- 关键坑：响度必须在**下混成单声道之后**测量——`aformat=channel_layouts=mono` 与输出端 `-ac 1` 的下混矩阵差 3 dB，用错会让所有音效整体轻 3 dB；`sfx_prep.py` 的测量与渲染已统一为同一条链。
- 混入 `voice + bed*0.20 + sfx*0.55`，两遍 loudnorm 仍 -16 LUFS；加入音效后混音真峰 -1.18 dBTP 使线性校正不可行，第二遍退回 dynamic——与纯线性相比中位差 0.04 dB、p99 0.18 dB，仅最响的几个窗口最多压低 1.51 dB。
- 客观校验：rev4 与 rev3 音轨对齐相减，音效窗口内差异 RMS -20.70 dBFS、窗口外 -37.93 dBFS（相差 17.2 dB），58 条全部可检出。

**定稿清理（2026-10-29）**：按宝哥要求，输出目录只保留 `全片_波斯湾伊甸园_272秒_1920x1080.mp4`。已删除 rev2/rev3 母版、两个 720p 分享版、10 秒样片（640×360 与 1920×1080）、1 分钟审核样片（合计约 460 MB）；删除前的字节数与 SHA-256 已记录在 `full/FREEZE_full_rev4.json` 的 `cleanup_2026-10-29` 与各自历史 FREEZE 中。口播稿、配音与源素材保留。今后如需分享版，从本母版按 `scale=1280:720:flags=neighbor` / CRF 24 / faststart 另出。

## 封面与归档（2026-10-29 · 定稿）

按 §4.4 代码合成备用方案出封面（本机无 ImageGen）。主体为**半人半鱼**：取成片 `t=42.4 s` 的「神吗」镜头（40.86–45.62，日出暖金逆光，鱼人居中），与成片同一套 640×360 像素场景，关字幕、关 HUD：

- 4:3：×4 取 360×270 窗口（cropx=52 / cropy=12）→ 最近邻 → 1440×1080；鱼人占高约 50%，右侧带日出光。
- 3:4：×5 取 216×288 窗口（cropx=124 / cropy=32）→ 1080×1440；鱼人占高约 47%。
- 标题区：顶部深色渐变（横版 0.30H、竖版 0.36H），鱼人头部落在标题区以下；标题「波斯湾伊甸园」6 字，华文行楷（STXingkai）金色渐变 + 深色描边；横版横排，竖版两列右起竖排。无副标题/字母数字/水印。

生成器：`full/make_covers.mjs`（把 assembled `film.js` 复制成 `demos/xiangsu-cover/coverfilm.js`，仅改倍率/横纵裁切/扫描线周期/关字幕/关 HUD，原成片管线不动）。初版绿洲镜头封面（t=113.8）已备份到 `源文件/封面_v1_绿洲版/`。

交付目录 `D:/@kaifa/yandi/out/3 波斯湾伊甸园/` 顶层恰 4 项：

| 项 | 尺寸 / 字节 | SHA-256 |
|---|---|---|
| `波斯湾伊甸园_全片.mp4` | 195,824,510 B | `910d81c5…`（与 rev4 母版逐字节一致，仅改名移动） |
| `cover_4x3.png` | 1440×1080 / 381,980 B | `5505ba97…` |
| `cover_3x4.png` | 1080×1440 / 256,906 B | `4fa267e2…` |
| `发布信息.txt` | 676 B | `6386b677…` |

`源文件/`：`核验报告.txt`（归档后 `verify_full.mjs` 复跑 PASS 4/4）、`FREEZE_full_rev4.json` 副本、`封面_v1_绿洲版/`（初版封面，t=113.8）、`旧版封面发布/`（2026-10-27 的封面与发布信息，已下架）。发布信息按 §5：5 条标题（均 ≤27 字）+ 推荐/次选 + 4 个话题。

## 管线清理与复用（2026-10-29 · 为下一条视频清场）

定稿后按宝哥要求「只留干净管线」：**源码、脚本、FREEZE 记录、交付目录、源资产全部保留；所有可再生的中间件与生成目录删除**（合计约 733 MB）。逐文件 SHA-256 与删除清单见 `full/FREEZE_pipeline_2026-10-29_cleanup.json`（历史记录，写于改名之前，文内 `xiangsu2` 为旧名）。**现行身份与逐文件哈希以根目录 `FREEZE_PIPELINE.json` 为准。**

保留的管线本体：

| 位置 | 内容 |
|---|---|
| `demo/` | 前 10 秒源文件真身（film.js / sprites.js / cues.json / audio.py / index.html） |
| `full/parts/` | 全片 8 个分片（util / spr / 5 组镜头 / tail，`assemble.mjs` 的拼装源） |
| `full/cues.json` · `cues.sentences.json` · `beats.json` · `sfx_cues.json` · `index.html` | 全片切点 / 字幕 / 节拍 / 音效编排 / 入口页 |
| `assemble.mjs` `build_full.sh` `make_audio.sh` `audio.py` `sfx_prep.py` `make_covers.mjs` `verify_full.mjs` `send_film_mail.py` · `build_cues.mjs` `build.sh` `verify.mjs` | 拼装 / 音轨 / 封面 / 验收 / 邮件脚本 |
| `full/tools/` | 非目检工具（`ascii.mjs` / `grid.mjs`） |
| `FREEZE.json` · `full/FREEZE_*.json` · `FREEZE_PIPELINE.json` · `README.md` | 冻结基线与说明（历史记录保留旧名 `xiangsu2`） |
| `D:/@kaifa/yandi/out/3 波斯湾伊甸园/` | 交付（成片 + 双封面 + 发布信息 + 源文件） |
| `D:/@kaifa/yandi/output/001_…/` | 口播稿 / 配音.wav / transcript / 素材与背景图 |

删除的可再生产物：

| 目标 | 字节 | 说明 |
|---|---|---|
| `full/out/`（171 文件） | 282,861,789 | audio.wav / mix_raw.wav / music.wav、响度与渲染中间件、封面候选帧（cover_cand/new/v2/v3/repro）、oldframes、sfx_prep、日志、一次性探针脚本与实验码流 |
| `full/__pycache__/` | 22,826 | Python 缓存 |
| `<repo>/demos/xiangsu2-cover/`（旧名） | 325,250 | `make_covers.mjs` 生成的封面场景副本 |
| `<repo>/demos/xiangsu2-eden-full/`（95 文件，旧名） | 449,550,347 | `assemble.mjs` 拼装副本 + 渲染中间件（rev3/rev2 中间视频合计 332,469,009 B、stills 68,767,745 B、audio.wav 47,989,698 B） |

开工命令（下一条视频照此）：

```bash
# 新片参数（必填；缺省直接报错，不会静默沿用上一部片的目录/旁白/标题）
export XIANGSU_PROJ="D:/@kaifa/yandi/output/002_xxx"   # 项目目录
export XIANGSU_FILM="新片名"                            # 输出文件名用
export XIANGSU_DUR=000.00                               # 与 full/cues.json 的 duration 一致
export XIANGSU_VOICE="$XIANGSU_PROJ/配音.wav"           # 不设则默认取这个路径
export XIANGSU_COVER_OUT="D:/@kaifa/yandi/out/<交付目录>"
export XIANGSU_COVER_TITLE="$XIANGSU_FILM"

cd D:/@kaifa/yandi/yandi-video/render/xiangsu/full
node assemble.mjs                # 生成 demos/xiangsu-eden-full（改过源码/parts 后必跑）
bash build_full.sh               # 音轨 → 渲染 → 验收（缺 full/out/audio.wav 会自动重建）
node make_covers.mjs --final --t43 <取帧秒> --t34 <取帧秒>   # 裁切/取帧默认值仍是 001 的，按新片改
```

- 清场后做过一次端到端复现：`assemble.mjs` + `make_covers.mjs --final`（输出改到临时目录）产出的双封面与交付文件逐字节一致（`5505ba97…` / `4fa267e2…`），证明删掉的只是可再生件。
- `build_full.sh` 的成片落点是 `$XIANGSU_PROJ/全片_${XIANGSU_FILM}_<秒>秒_1920x1080.mp4`，交付目录的归档是单独一步（改名移动 + 封面 + 发布信息），不要直接覆盖交付件。
- 受保护目录（`demos/xiangsu/`、`demos/xiangsu-bay/`，以及改名后的 `demos/xiangsu-eden/`）清理前后文件数与字节数未变。

## 新片参数（2026-10-30 · 片级参数必填）

2026-10-30 起，全片链路的片级参数不再给默认值：`full/build_full.sh`、`full/make_audio.sh`、`full/make_covers.mjs --final` 缺参数时**直接报错退出**，避免下一部片静默写进 001 的目录、复用 001 的旁白或封面标题。

| 变量 | 用在哪 | 不设时 |
|---|---|---|
| `XIANGSU_PROJ` | build_full | 报错；成片落盘的项目目录 |
| `XIANGSU_FILM` | build_full / 封面标题兜底 | 报错 |
| `XIANGSU_DUR` | build_full（渲染时长 + verify `--duration`） | 报错 |
| `XIANGSU_VOICE` | make_audio / audio.py | build_full 缺省取 `$XIANGSU_PROJ/配音.wav` 并校验存在；单独跑 make_audio 报错 |
| `XIANGSU_COVER_OUT` | make_covers --final | 报错 |
| `XIANGSU_COVER_TITLE` | make_covers --final | 可用 `XIANGSU_FILM` 兜底，都没有则报错 |

环境类参数仍有默认值：`XIANGSU_REPO`（渲染仓库）、`XIANGSU_PY`、`MG_CHROME`、`XIANGSU_WORKERS`。

001 按原参数复现：

```bash
export XIANGSU_PROJ="D:/@kaifa/yandi/output/001_波斯湾伊甸园_口播稿+配音"
export XIANGSU_FILM="波斯湾伊甸园"
export XIANGSU_DUR=272.05
export XIANGSU_VOICE="$XIANGSU_PROJ/配音.wav"
export XIANGSU_COVER_OUT="D:/@kaifa/yandi/out/3 波斯湾伊甸园"
export XIANGSU_COVER_TITLE="波斯湾伊甸园"
```

封面取帧与裁切（`--t43/--t34/--up43/--up34/--crop43/--crop34`）默认值仍是 001 的 t=42.4 与对应窗口，换片必须按新片画面重新给。

## 改名与封装（2026-10-29）

宝哥要求把这条管线改名封装成 `xiangsu` 并固化。`xiangsu` 原属 workbuddy 的像素线（文档 `render/xiangsu/README.md`、代码 `demos/xiangsu/`），处理方式：

- 旧文档存档为 `README_workbuddy_2026-10-28.md`（内容一字未改），新 `README.md` 由本管线接管；旧 `demos/xiangsu/` 代码与 workbuddy 的 `SKILL.md` 均未改动。
- `render/xiangsu2/` 整体并入 `render/xiangsu/`（旧目录已删除）；`demos/xiangsu2-eden/` 改名 `demos/xiangsu-eden/`（内容字节不变）。
- 全片/封面生成目录改为 `demos/xiangsu-eden-full/`、`demos/xiangsu-cover/`（避开旧线的 `demos/xiangsu/`）。
- 环境变量统一为 `XIANGSU_*`，旧名 `XIANGSU2_*` 保留兼容。
- `demo/film.js` 与所有历史 `FREEZE*.json` 内容未改（基线哈希继续有效）；文内 `xiangsu2` 字样属历史记录，不回写。
- 现行身份、逐文件 SHA-256、复现证据见 `FREEZE_PIPELINE.json`。

注：workbuddy 2026-10-29 改名为 `youxi` 的是 20-pixel 跑酷线（原 rinoku20），不是这条像素线；`demos/xiangsu/` 是旧像素线遗留代码，本管线不引用。
