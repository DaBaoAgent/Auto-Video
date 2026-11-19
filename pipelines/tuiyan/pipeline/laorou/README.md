# laorou 文案管线（alannew 移植版）

- **来源**：`D:\@kaifa\AutoYY\laorou`（老肉杂谈风格管线）+ `D:\@kaifa\AutoYY\vendor\blader-humanizer`（去 AI 味技能，MIT）
- **移植日期**：2026-10-05 ｜ **移植人**：小宝总监（Hermes）
- **用途**：alannew（历史战争推演视频）项目「编剧层」的口播稿生产线

## 目录

| 文件 | 说明 |
|---|---|
| `SKILL.md` | 管线主文档：六要素 / 结构模板 / 纪律 / 流程 / 验证清单 |
| `references/laorou-style-guide.md` | 老肉风格深度蒸馏（5 篇原片转写稿提炼，原样复制） |
| `scripts/check_script.py` | 确定性机检：字数 / 纯中文 / 儿化音 / em dash / AI 套壳词 / 重复片段 / 旧签名残留提示 |
| `vendor/blader-humanizer/` | 去 AI 味技能（Embedded 模式用，原样复制 + LICENSE） |

## 快速使用

```bash
# 1) 起草：content/<NN-主题>/爆款口播稿.candidate.txt（照 SKILL.md 写）
# 2) 机检（全 PASS 才继续）
python pipeline/laorou/scripts/check_script.py "content/01-赤壁之战/爆款口播稿.candidate.txt" --min 5500 --max 6500
# 3) Humanizer 按 Embedded 模式过稿（流程见 SKILL.md）
# 4) 事实复核后定稿为 爆款口播稿.txt，删除 candidate
```

## 与上游差异（适配点）

| 项 | 上游（AutoYY） | 本移植版（alannew） |
|---|---|---|
| 素材来源 | 纪录片 SRT 转写 | 历史主题 + 史料调研（附 `事实底稿.md`） |
| 字数口径 | 4500-5500 | 5500-6500（20 分钟+） |
| 输出目录 | 项目/主题文件夹 | `content/<NN-主题>/` |
| 门禁 | autoyy 完整质量门禁（scaffold / promote / attestation） | 轻量 `check_script.py`；后续需要时可接线回完整门禁 |
| 增补纪律 | — | 史实/演义两口径分离、引文核验、事实底稿落档 |
| 开场/结尾 | 由头开场＋签名句收尾 | 直接入剧情（公元××××年式起稿）；结尾自然收束、无签名句（2026-10-05 起） |

## 同步说明

上游在 `DaBaoAgent/AutoYY` 仓库维护；本副本冻结于 2026-10-05 版本。上游更新时手动 diff 合并（重点：风格指南与 Humanizer）。
