# peiyin —— 选题 · 出稿 · 配音（GPT-SoVITS 配音前端）

> **peiyin** = 配音（pèi yīn）拼音。Auto-Video 的**前端三模块**：选题（选题与对标分析）→ 出稿（口播稿写作与机械审计）→ 配音（GPT-SoVITS 克隆音色批量合成与审查门禁）。本管线只保留干净的代码与规约，**权重、音色、口播成品、运行时一律不入仓库**，全部引导下载，见 [MIGRATION.md](MIGRATION.md)。

## 三模块闭环

```text
选题 ──> 出稿 ──> 配音 ──> 审查门禁 ──> 可交付口播音频
 │         │         │           │
 选题规约   口播稿规范   GPT-SoVITS   门禁报告
 对标拆解   AI味审核    批量合成       配音审查报告.md
 逐字稿库   gate-check  长稿分段      配音审查.json
```

| 模块 | 输入 | 产出 | 通过条件 |
| --- | --- | --- | --- |
| 选题 | 赛道方向、对标账号 | 选题方向、逐字稿拆解 | 主题有爆款依据、历史/事实边界清晰 |
| 出稿 | 选题、源字幕/资料 | 口播稿定稿 | 口播稿规范 + AI 味审核 + gate-check 机械审计通过 |
| 配音 | 口播稿定稿、dabao 音色 | 配音.wav + 时间轴 | 审查门禁：规格、ASR 覆盖、固定收尾全通过 |

## 目录

| 路径 | 内容 |
| --- | --- |
| `docs/` | 11 份规约：管线说明、口播稿规范、配音审查门禁、AI 味审核清单、配音参数与音色、音色配置、多音字易错读音表、钩子方案库、对标爆款拆解报告、参考-旧号风格分析 + `对标逐字稿/` 参考库 |
| `scripts/` | 初始化（`setup.ps1` 引导下载权重/音色、建 venv）、批量配音（`run_dabao_batch.ps1` 模板）、长稿合成（`synthesize_dabao_paragraphs.py`）、门禁校验（`validate_dabao_audio.py` / `check_dabao_audio.ps1`）、气声清理、时间轴重建、文本修复、口播稿机械审计（`gate-check.ps1`）、SRT 清洗（`clean-srt.ps1`） |
| `GPT-SoVITS/` | 配音引擎干净代码：推理服务（`tts_server.py` / `api.py` / `api_v2.py` / `webui.py`）、dabao 一键入口（`dabao_tts.py` / `dabao_tts.cmd`）、`GPT_SoVITS/` 模型代码（AR / BigVGAN / TTS_infer_pack / text 等） |

## 快速开始

```powershell
# 1. 一键初始化：校验/拉取权重（约 2.4GB）、建 venv、装 torch、健康检查
pwsh -File .\scripts\setup.ps1
# 已有 GPT-SoVITS 安装时可直接复制缺失资源：
pwsh -File .\scripts\setup.ps1 -WeightsFrom <旧 GPT-SoVITS 安装目录>

# 2. 批量配音（自然段合成，默认 dabao 音色）
& '.\GPT-SoVITS\.venv\Scripts\python.exe' `
  '.\scripts\synthesize_dabao_paragraphs.py' `
  --text-file <口播稿定稿.txt> `
  --out <输出目录\配音.wav> `
  --paragraph-gap-ms 200

# 3. 审查门禁（small 全片回听，疑似漏点用 medium 回到对应自然段复听）
.\scripts\check_dabao_audio.ps1 `
  -TopicDir <输出目录> `
  -ExpectedParagraphGapMs 220
```

门禁产物为 `配音审查报告.md`（人工复核）与 `配音审查.json`（机器结果）；规格、全文覆盖或收尾任一失败均不得交付。

## 约定

- 每个内容目录只保留**定稿口播、最终音频和必要元数据**；`narration-chunks/` 是临时分段，不作为交付内容。
- 新配音统一使用 `dabao` 音色，不创建分块音色或临时克隆。
- 幕间停顿按 220ms 处理；`X 光 / X 射线 / M 七二 / CNN / NPC` 等英文缩写或符号易触发 TTS 崩溃，改为中文朗读（详见 [SKILL.md](SKILL.md)）。
- 本地源字幕归档等固定约定见 [AGENTS.md](AGENTS.md)。

## 许可

GPT-SoVITS 为 MIT License（见 `GPT-SoVITS/LICENSE`）；docs 与 scripts 为 Auto-Video 自有。开发与质量门禁见 [SKILL.md](SKILL.md)。
