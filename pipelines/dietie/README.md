# dietie —— 地铁线路图（Transit Map）

一张纸上的线路图，从 1993 年的 6 公里长到 21 条线、906 公里。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/transit-map`（地铁线路图） |
| 样片 | 《6 公里》47.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/dietie/scripts/dietie.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/dietie/scripts/dietie.py --check   # 体检
python pipelines/dietie/scripts/dietie.py --plan    # 看步骤
python pipelines/dietie/scripts/dietie.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/transit-map/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
