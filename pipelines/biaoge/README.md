# biaoge —— 表格动画（Spreadsheet Film）

总数说 B 更好；把藏起来的结石大小列打开，A 在每一组都赢。一张表讲清辛普森悖论，一格就是一位病人。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/spreadsheet`（表格动画） |
| 样片 | 《藏起来的那一列》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/biaoge/scripts/biaoge.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/biaoge/scripts/biaoge.py --check   # 体检
python pipelines/biaoge/scripts/biaoge.py --plan    # 看步骤
python pipelines/biaoge/scripts/biaoge.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/spreadsheet/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
