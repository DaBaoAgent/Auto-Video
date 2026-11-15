# jilupian —— 纪录片解说全自动流水线

> **jilupian** = 纪录片（jì lù piàn）拼音缩写。给一份片源 URL 清单，自动产出纪录片解说成片：核验 → 下载 → 口播 → 配音 → 影子匹配 → 剪辑 → 字幕+BGM → 发布资料 → 三比例封面 → 自动验收。**纯开源、本地运行、中间产物留档、失败可续跑。**

本管线克隆自 `DaBaoAgent/AutoUP`（MIT），已按 Auto-Video 规则收纳。**配音模块（GPT-SoVITS 服务）、模型、大文件一律不入仓库**，全部引导下载，见 [MIGRATION.md](MIGRATION.md)。

## 一条命令出片

```text
https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...
```

```bash
python -m autoup.run --manifest urls.txt --batch 202611-A
```

每个通过验收的选题都会留下完整交付包（成片/封面/发布资料/素材/字幕/文案/配音/edit_decision.json/state.json/验收报告.json）。

## 为什么是这套

- **片源先核验**：时长、最高分辨率、英文字幕不达标就拒单，避免下载后才发现无法生产。
- **文案以字幕为事实边界**：基于原片字幕生成中文解说，降低人名、数字和事件被凭空补写的风险。
- **影子匹配而非随机拼接**：逐句将解说与原片字幕时间轴关联，生成可审查的剪辑决策。
- **音画按实测时长对齐**：每句配音单独落盘，`timing.json` 记录真实时长，断点续跑可排查。
- **一次准备三种画幅**：9:16 / 16:9 / 1:1 封面同时生成。
- **S9 验收作为门禁**：分辨率、时长、音轨、字幕、配音、发布资料、封面逐项检查。

## 快速开始

```bash
# 1. 环境（Python 3.11+ / uv / ffmpeg，引导下载见 MIGRATION.md）
uv sync --all-extras --locked

# 2. 模型 Key（默认智谱 glm-4.6，也可改 llm.base_url / llm.model）
$env:GLM_API_KEY = "你的 API Key"

# 3. 生产（完整 / 部分阶段 / 强制重跑 / 只处理前 2 个选题）
python -m autoup.run --manifest urls.txt --batch 202611-A
python -m autoup.run --batch 202611-A --only s4,s5,s6
python -m autoup.run --batch 202611-A --only s8 --force
python -m autoup.run --manifest urls.txt --batch smoke --limit 2

# 不想配 GPT-SoVITS 时用免费 Edge TTS
python -m autoup.run --manifest urls.txt --batch demo --set voice.engine=edge_tts
```

同一批次再次运行读 `state.json`；阶段 fingerprint 与产物全匹配才复用，改配置后受影响阶段自动失效重跑。

## 配置

可移植默认值在 `autoup/config.yaml`，本机覆盖写 `autoup/config.local.yaml`（gitignore）：

| 配置 | 作用 |
| --- | --- |
| `paths` | ffmpeg/ffprobe、GPT-SoVITS 根、输出目录 |
| `video` | 分辨率、帧率、编码器、质量 |
| `voice` | 配音引擎（gpt_sovits / edge_tts）、音色、语速、停顿 |
| `subtitle` | 字体、字号、颜色、单行字数 |
| `script` | 文案目标字数、容差、分段长度 |
| `download` | 最低时长/分辨率、下载上限、代理 |

运行时 `--set key=value` 单次覆盖，不写回配置文件。

## 目录

| 路径 | 内容 |
| --- | --- |
| `autoup/` | 主包（S1–S9 阶段、tts 适配器、config/llm/state） |
| `references/` | 内容风格、下载规则、环境事实、工具地图、流程规格 |
| `docs/` | 产品规则、剪辑策略、开发记录 |
| `tests/` | 8 个测试（0 联网 0 付费） |
| `vendor/blader-humanizer/` | 去 AI 味工具 |

## 适用边界与合规

只处理你有权使用的片源、字幕、音乐和字体，遵守所在地法律及 YouTube/抖音/快手/B 站/视频号/TikTok/X 等平台条款。本管线不提供版权授权，也不保证第三方平台内容可下载、改编或发布。

## 许可

MIT License（见 `LICENSE`）。开发与质量门禁见 [SKILL.md](SKILL.md)。
