# jilupian 迁移与外部依赖说明（MIGRATION）

本文件说明 jilupian 管线从何处迁移、哪些内容刻意**不入仓库**、以及运行时需要**自行下载/自备**的外部依赖。遵循原则：**配音模块、模型、大文件一律不进入仓库，只引导下载**。

## 一、迁移来源

- 来源仓库：`github.com/DaBaoAgent/AutoUP`（MIT License）
- 迁移基线：`01a1cc353953299e6a3d6f04dcc119c13d655043`
- 迁移方式：git 稀疏克隆（`--filter=blob:none --sparse`），仅取代码与文档
- 迁移日期：2026-10-30；本地保留路径：`D:\@kaifa\Auto-Video\jilupian\`

## 二、刻意不入仓库的内容（已在 jilupian 中剔除）

| 类别 | 原路径 | 说明 |
| --- | --- | --- |
| 样片成片（大文件） | `assets/demos/demo-ww2.mp4`、`demo-prison.mp4`、`demo-nature.mp4` | 演示用 MP4，总约 200MB+，不入仓库 |
| README 图片 | `assets/readme/*.webp`、`assets/contact/*.jpg` | 仅上游 README 装饰 |
| 宣传图 | `github/` 三张 PNG（Hero/Pipeline/One Command，各 1.1–1.6MB） | 上游仓库主视觉 |
| 封面示例图 | `docs/covers/*.jpg`（91 张，约 30MB） | 历史生产示例 |
| 配音模型/运行时 | GPT-SoVITS 模型权重、dabao 音色 | 见下"引导下载" |

如需样片预览，可访问上游 raw 直链：`https://raw.githubusercontent.com/DaBaoAgent/AutoUP/main/assets/demos/demo-ww2.mp4`（其余同理，仅作效果参考）。

## 三、外部依赖引导下载（运行前必读）

### 1. Python 3.11+ 与 uv

```powershell
# 安装 uv（包管理，负责按 uv.lock 精确复现依赖）
winget install astral-sh.uv
# 或：pip install uv

# 在 jilupian 目录内安装全部依赖
uv sync --all-extras --locked
```

### 2. FFmpeg / ffprobe（S2 下载、S6 渲染必需）

```powershell
winget install Gyan.FFmpeg
# 或 scoop: scoop install ffmpeg
```

确认 `ffmpeg` 与 `ffprobe` 在 PATH 中；也可在 `autoup/config.local.yaml` 的 `paths.ffmpeg` / `paths.ffprobe` 写绝对路径。

### 3. 配音模块（S4 必需，二选一）

**方案 A（推荐，免费免部署）：Edge TTS**

运行任一命令时追加 `--set voice.engine=edge_tts`，或在本机配置里 `voice.engine: edge_tts`。无需任何模型，联网即可，默认音色 `zh-CN-YunjianNeural`。

**方案 B（自备 GPT-SoVITS 本地服务，克隆音色）**

配音不是仓库内模块，而是本地运行的 GPT-SoVITS 服务。jilupian 只含调用它的适配器（`autoup/tts/gpt_sovits.py`），服务与模型自行准备：

1. 克隆 GPT-SoVITS 运行时（独立仓库，含 dabao 音色模型引导）：`git clone https://github.com/DaBaoAgent/gpt-sovits.git`
2. 按该仓库说明启动服务，默认监听 `http://127.0.0.1:9880`（jilupian 默认 `voice.gpt_sovits.api`）
3. 在 `autoup/config.local.yaml` 配置 `paths.gpt_sovits_root` 与 `voice.gpt_sovits.voices.default.ref_audio_path`（参考音频绝对路径）
4. `config.yaml` 默认 `voice.engine: gpt_sovits`，`fallback_engine: edge_tts`

### 4. 文案与画面匹配模型 Key（S3/S5 必需）

需要兼容 OpenAI 格式的模型服务，默认智谱 GLM：

```powershell
$env:GLM_API_KEY = "你的 API Key"
```

如需更换服务，修改 `llm.base_url` 与 `llm.model`（`autoup/config.local.yaml` 或 `--set`）。

### 5. 字幕/封面字体（S6/S8 必需）

`autoup/config.yaml` 引用 `assets/fonts/05_江西拙楷.ttf`（字体文件不在仓库）。二选一：

- 自备中文字体（推荐：思源黑体/阿里普惠体等），把路径写进 `subtitle.font_path` 与 `cover.font_path`
- 或从上游下载原字体：`https://raw.githubusercontent.com/DaBaoAgent/AutoUP/main/assets/fonts/05_江西拙楷.ttf`，放到 `assets/fonts/` 并保持配置不变

### 6. 可选：BGM 音乐

`bgm.directory` 默认 `null`（不配乐）。如需配乐，把本地音乐目录路径写入本机配置；`bgm.pick: random` 随机选曲。

## 四、本机配置规范

- 可移植默认值：`autoup/config.yaml`（可随仓库提交）
- 本机覆盖：复制 `autoup/config.example.yaml` → `autoup/config.local.yaml` 修改（已被 `.gitignore` 忽略，不会误提交）
- 运行时单次覆盖：`python -m autoup.run --set key=value`，不写回文件

## 五、运行验证

```bash
# 语法与测试门禁
uv run python -m compileall -q autoup tests
uv run ruff check autoup tests
uv run pytest -q --cov=autoup --cov-report=term-missing
```

CI 门禁（Linux lint/test、Windows smoke）定义在 `.github/workflows/ci.yml`。完整交付以 S9 验收与 CI 同时通过为准。

## 六、已知边界

- 上游 README/SKILL 中的图片与样片链接指向 `DaBaoAgent/AutoUP`，本仓库不复制这些资源
- 需要成片效果参考时，访问上游样片直链或本地自有历史成片
