# 迁移说明 · shipai

## 来源

这条管线没有迁自别的仓库，它是**一次实操的固化**：2026-11-15 用 MoneyPrinterTurbo CLI 做《玛雅巨人文明》第一大段竖屏短片，整个过程在本地跑通后，把真正用到的那几件事抽成脚本。

原始路径（本地，不入库）：

| 资产 | 路径 |
|---|---|
| 口播稿 | `D:\@kaifa\@\出稿\004_玛雅巨人文明\口播稿.md`（24 段，第 1 段为本次素材） |
| 原配音 | `D:\@kaifa\@\出稿\004_玛雅巨人文明\配音.wav`（296.27 s / 44.1 kHz / 单声道） |
| MoneyPrinterTurbo | `D:\@kaifa\MoneyPrinterTurbo`（v1.3.10，已部署） |
| 字幕脚本三版 | agent workspace 的 `maya_subs.py` / `v2` / `v3`，v3 即本管线 `captions.py` 的定版样式 |

## 固化了什么

| 环节 | 原始做法 | 管线化后 |
|---|---|---|
| 找段落边界 | 人工看 whisper 时间戳定出 0–17.86 s | `vo_segment.py`：口播稿 ↔ 转写字编辑距离对齐，按「第 N 段」自动切 |
| 段落收尾 | 手工减 0.08 s | 在末字与下段首字之间找真实静音，切在静音中点（whisper 词边界会吃进下一词起音，实测早 0.2 s） |
| 字幕时间 | 手抄 12 条时间 | 由对齐结果自动生成 `timeline.json`，按标点断句、首尾相接 |
| 素材 | 手查 Pixabay、手写 id、手排顺序 | `pixabay.py` 搜候选 + 按 id 下载；`materials.json` 的 `files` 数组即拼接顺序 |
| 出片 | 手拼一长串 CLI 参数 | `shipai base`：参数全部来自 `pipeline.json`，顺序固定 |
| 字幕烧录 | 三个版本的 PIL 脚本 | `captions.py`：单行 / 去标点 / 73% 高 / 2px 描边 / 0.15 阴影 |
| 校验 | 手抽帧看 | `probe`：分辨率 / 音轨 / 时长 / 时间轴单调，四项一次过 |

## 入库内容

- `scripts/`：`shipai.py`（编排）、`vo_segment.py`（切段与对齐）、`pixabay.py`（素材）、`captions.py`（字幕）
- `references/`：MoneyPrinterTurbo CLI 契约与已知坑、素材规则、字幕规范、交付
- `projects/004_玛雅巨人文明/`：`project.json`、`script.txt`、`timeline.json`、`materials/materials.json`、`materials/candidates.json`

## 不入库

- `voice.wav`、`audio/*.wav`、`materials/*.mp4`、`base-9x16.mp4`、`final-9x16.mp4`、`logs/`、`subs/`（见根 `.gitignore`）
- MoneyPrinterTurbo 本体（外部依赖，按 README 自行部署）
- faster-whisper 模型权重（约 1.5 GB，走 HF 缓存或首次联网下载）

## 依赖与版本

- Python 3.11（本机直接用 MPT 的 `.venv`，`faster-whisper` 与 `Pillow` 都在里面）
- MoneyPrinterTurbo 1.3.10（MIT），`cli.py` 的参数名以该版本为准
- faster-whisper（MIT），默认 `large-v3-turbo` / CPU / int8
- Pixabay 视频 API（需 key；不带浏览器 UA 会 403）
- ffmpeg 8.x（PATH）

## 已知取舍

- **不封 WebUI / API / Streamlit**：本次全程 CLI，界面一次没用。
- **不封 Edge TTS**：配音是用户现成的，不做合成。
- **不封 LLM 出稿**：口播稿由 `peiyin` 或人负责，shipai 只吃最终稿。
- **不封 MPT 自带字幕链**：自定义音频下它拿不到时间轴，字幕另行烧录更可控。
- **不封 BGM、封面、发布信息**：本次都没用。
