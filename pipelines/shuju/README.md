# shuju —— 数据叙事（Data Storytelling）

一百年的夏季气温，图表本身就是故事。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/dataviz`（数据叙事） |
| 样片 | 《一百个夏天》50.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/shuju/scripts/shuju.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/shuju/scripts/shuju.py --check   # 体检
python pipelines/shuju/scripts/shuju.py --plan    # 看步骤
python pipelines/shuju/scripts/shuju.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/dataviz/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
