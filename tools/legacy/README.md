# legacy —— 一次性脚本（存档，不再维护）

这些脚本都**完成过它那一次的任务**：把外部风格集导进来、重建过一版 samples.json、生成过模板目录、修过一批老卡片。
留着是为了下次遇到同类改造时能抄思路，**不要当成日常入口**。

注意两点：

1. 它们当初是从 `tools/` 直接运行的，里面的路径按 `tools/` 所在层级推导；挪到 `tools/legacy/` 后若还按相对层级找仓库，可能要多退一层。真要用就先读代码改路径，别盲跑。
2. 依赖可能已经变了（外部仓库路径、旧 samples.json 结构），跑之前先 `git status` 确认不会覆盖线上数据。

## 清单

| 文件 | 当初干什么 |
|---|---|
| `import_anidoodle_styles.py` / `anidoodle_samples.py` / `anidoodle_style_map.json` | 导入 anidoodle 风格集并生成样片 |
| `import_mg_styles.py` / `mg_styles_samples.py` / `mg_styles_selfsamples.py` / `mg_styles_map.json` | 导入 MG 风格集 |
| `gen_style_projects.py` / `av_style.py` / `regen_style_projects_v3.py` | 批量生成风格工程目录（v3 重生成） |
| `rebuild_samples_json.py` / `rebuild_templates.py` | 从旧目录重建 samples.json 与模板 |
| `add_old10s_cards.py` | 给老样片补 10 秒卡片 |
| `audit_sheets.py` | 体检用的联系表批量出图 |
| `package_huashu_runtimes.py` | 打包话术类 runtime |
| `build_samples_media.ps1` / `cut_old_samples_10s.ps1` | 早期 Windows 批处理版切样片 |
| `style_map.json` / `legacy_style_map.json` / `huashu_style_map.json` | 上面几个脚本的映射表 |
| `cover-peiyin.html` | 配音前端的临时封面页 |
