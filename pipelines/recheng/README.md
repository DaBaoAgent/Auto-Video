# recheng —— 热成像（Thermal Camera）

雪夜里，一台热像仪绕着一栋老居民楼转：漏风的窗、墙里的暖气管、睡在热车盖上的猫，还有一年后改造完的同一栋楼。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/thermal-camera`（热成像） |
| 样片 | 《冬夜，一栋楼的体温》49.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/recheng/scripts/recheng.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/recheng/scripts/recheng.py --check   # 体检
python pipelines/recheng/scripts/recheng.py --plan    # 看步骤
python pipelines/recheng/scripts/recheng.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/thermal-camera/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
