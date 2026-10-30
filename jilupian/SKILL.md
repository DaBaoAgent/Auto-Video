---
name: jilupian
description: 纪录片解说全自动流水线（jilupian = 纪录片拼音缩写）：给一份片源 URL 清单，自动产出纪录片解说成片。核验片源 → 下载高清素材 → 中文口播 → 配音 → 影子匹配 → 自动剪辑 → 字幕+BGM → 发布资料 → 三比例封面 → 自动验收。当用户要做纪录片解说视频、或说"用 jilupian 出片"时使用。
---

# jilupian —— 纪录片解说全自动流水线

来源：从 `DaBaoAgent/AutoUP` 克隆的干净管线（MIT 许可）。**配音模块、模型、大文件一律不入仓库**，按 [MIGRATION.md](MIGRATION.md) 引导下载/自备。

## 管线（S1–S9）

| 阶段 | 环节 | 落点 |
| --- | --- | --- |
| S1 | 片源核验：时长 / 最高分辨率 / 英文字幕，不达标拒单 | `autoup/stages/validate.py` |
| S2 | 下载/remux 视频 + 字幕规范为 SRT | `autoup/stages/download.py` |
| S3 | 按字幕时间窗生成中文口播（以字幕为事实边界） | `autoup/stages/script.py` |
| S4 | 逐句 TTS 配音（指纹缓存复用） | `autoup/stages/dub.py` + `autoup/tts/` |
| S5 | 影子匹配：逐句映射到真实画面 | `autoup/stages/match.py` |
| S6 | 渲染成片：画面 + 配音 + ASS 字幕 + BGM | `autoup/stages/render.py` |
| S7 | 国内/海外发布资料 | `autoup/stages/publish.py` |
| S8 | 9:16 / 16:9 / 1:1 三比例封面 | `autoup/stages/cover.py` |
| S9 | 交付前自动验收（门禁） | `autoup/stages/validate.py` |

## 目录结构

```text
jilupian/
├── SKILL.md                 # 本文件（管线入口）
├── README.md                # 快速开始与说明
├── MIGRATION.md             # 外部依赖引导下载（配音/模型/字体）
├── autoup/                  # 主包：run.py + stages/ + tts/ + config
├── references/              # 内容风格、下载规则、环境事实、工具地图、流程规格
├── docs/                    # 产品规则、剪辑策略、开发记录（covers 示例图已剔除）
├── tests/                   # 8 个测试文件（无联网无付费）
├── agents/                  # agent 配置（openai.yaml）
├── .github/workflows/       # CI 门禁（Linux lint/test、Windows smoke）
└── vendor/blader-humanizer/ # 去 AI 味工具
```

## 快速开始

```bash
# 依赖：Python 3.11+、uv、ffmpeg/ffprobe（见 MIGRATION.md 引导下载）
uv sync --all-extras --locked

# 模型 Key（文案与画面匹配需要 OpenAI 兼容服务，默认智谱 glm-4.6）
$env:GLM_API_KEY = "你的 API Key"

# 一条命令出片：URL 清单 → 完整交付包
python -m autoup.run --manifest urls.txt --batch 202611-A

# 只重跑部分阶段 / 强制重跑
python -m autoup.run --batch 202611-A --only s4,s5,s6
python -m autoup.run --batch 202611-A --only s8 --force
```

- 本机配置：复制 `autoup/config.example.yaml` 为 `autoup/config.local.yaml` 修改（已 gitignore）
- 不想配 GPT-SoVITS 时用免费 Edge TTS：`--set voice.engine=edge_tts`
- 同一批次再次运行读 `state.json`，阶段 fingerprint 匹配才复用产物

## 交付包（每个通过验收的选题）

```text
01-<选题名>/
├── 成片.mp4              # 1080p：硬字幕 + BGM + 配音
├── 封面/                  # 9:16 / 16:9 / 1:1
├── 发布/                  # 国内与海外发布资料
├── 素材/ 字幕/ 文案/ 配音/  # 可检查、可替换、可从中间阶段重跑
├── edit_decision.json     # 逐句画面匹配结果
├── state.json             # 断点状态
└── 验收报告.json           # S9 交付前检查结果
```

## 硬质量规则（不可绕过）

- 文案必须落在字幕事实窗口内，禁止凭空补写人名/数字/事件
- S5 禁止为缺失匹配乱分配空闲时间段
- TTS 不得只因编号 WAV 存在就复用（须指纹一致）
- 禁止改容器名冒充 `.mp4`（必须真实 remux/转码）
- 发布资料修复耗尽后仍畸形则拒绝交付；完整交付必须过 S9
- `--allow-partial` 是批次部分选题失败时不返回非零的显式选择

## 开发与质量门禁

```bash
uv run python -m compileall -q autoup tests
uv run ruff check autoup tests
uv run pytest -q --cov=autoup --cov-report=term-missing
```

## 外部依赖

配音（GPT-SoVITS 本地服务 / Edge TTS 免费）、LLM Key、字体等均不入仓库，见 [MIGRATION.md](MIGRATION.md)。
