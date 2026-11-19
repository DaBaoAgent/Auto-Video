# cehui —— 点云测绘（LiDAR Survey）

激光点云剥掉一片森林的树冠，露出当年农田的石墙：3.4 公里。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/lidar-survey`（点云测绘） |
| 样片 | 《林下的田》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/cehui/scripts/cehui.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/cehui/scripts/cehui.py --check   # 体检
python pipelines/cehui/scripts/cehui.py --plan    # 看步骤
python pipelines/cehui/scripts/cehui.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/lidar-survey/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
