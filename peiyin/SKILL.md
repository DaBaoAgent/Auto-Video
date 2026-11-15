# peiyin SKILL.md —— 选题 · 出稿 · 配音 使用流程

## 何时使用本管线

需要把一篇口播稿批量合成为克隆音色配音、或对口播稿做机械审计时。覆盖 Auto-Video 流程的**选题与口播稿**、**配音与时间轴**两个前端阶段。

## 流程

### 1. 选题

- 阅读 `docs/管线说明.md` 确定赛道与主题边界。
- 参考 `docs/对标爆款拆解报告.md`、`docs/参考-旧号风格分析.md` 与 `docs/对标逐字稿/`（11 篇逐字稿）拆解爆款结构。
- 选题须有爆款依据，历史/事实边界清晰（数字、人名、事件不得凭印象补写）。

### 2. 出稿（口播稿）

- 按 `docs/口播稿规范.md` 写作：普通话口语表达，禁用东北口音词；多音字、外文人名对照 `docs/多音字易错读音表.md`。
- 用 `docs/AI味审核清单.md` 自查去 AI 味；钩子参考 `docs/钩子方案库.md`。
- 机械审计：

```powershell
pwsh -File .\scripts\gate-check.ps1 -TxtPath .\口播稿.txt
# 输出 han / nonws / dash_pairs / bushi_ershi / arabic_digits / paragraphs / has_ending
```

### 3. 配音

```powershell
# 3.1 初始化（首次）：引导下载权重与 dabao 音色参考、建 venv、装 torch
pwsh -File .\scripts\setup.ps1

# 3.2 批量合成（自然段，默认 dabao 音色）
& '.\GPT-SoVITS\.venv\Scripts\python.exe' `
  '.\scripts\synthesize_dabao_paragraphs.py' `
  --text-file .\口播稿.txt --out .\out\narration.wav --paragraph-gap-ms 200

# 3.3 审查门禁
.\scripts\check_dabao_audio.ps1 -TopicDir .\out -ExpectedParagraphGapMs 220
```

门禁约定：`small` 全片回听，疑似漏点用 `medium` 回到对应自然段复听；规格、ASR 全文覆盖或固定收尾任一失败不得交付。产物：`配音审查报告.md` + `配音审查.json`。

## 已知坑

- **TTS 崩溃触发词**：`X 光`、`X 射线`、`M 七二`、`CNN`、`NPC` 等英文缩写/符号，一律改为中文朗读（"X 光"→"艾克斯光"等按上下文处理）。
- **ASR 误报**：固定收尾有时被 ASR 误报为漏读；复核以实际音频为准（如 011/017、023/024/025 先例）。
- **音色 dabao**：来自 `voices/dabao/ref_dabao3-1.wav`（1.5MB 参考音频），**不入仓库**；由 `setup.ps1` 引导放置/从旧安装复制。
- **幕间停顿**：固化 220ms；`synthesize_dabao_paragraphs.py` 的 `--paragraph-gap-ms` 与门禁 `-ExpectedParagraphGapMs` 需保持一致（例：合成 200 / 门禁 220 按定版参数核对）。
- **venv 污染**：脚本会主动清除全局 `PYTHONPATH/PYTHONHOME`，避免 agent/插件注入破坏引擎环境。
- **批量模板**：`scripts/run_dabao_batch.ps1` 是内容线模板（内置 lishi 路径示例），迁移到其他内容线时改「配置区」路径即可。

## 质量验收

| 检查 | 方法 |
| --- | --- |
| 口播稿机械指标 | `gate-check.ps1`：汉字占比、破折号成对、无"不是…而是"残留、无阿拉伯数字、段落数与定稿一致、固定收尾存在 |
| 配音覆盖 | 门禁 ASR 覆盖检查 0 处漏读（`small`/`medium` 复核） |
| 交付物 | 定稿口播 + 最终音频 + `配音审查报告.md` + `配音审查.json` |

完整规则见 `docs/配音审查门禁.md`。
