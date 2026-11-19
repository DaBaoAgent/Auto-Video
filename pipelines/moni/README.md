# moni —— 小人模拟实验（Blob Simulation）

160 只植绒小人抢豆子：快的先抢到也先跑不动，跑完 20 代，整块台面都变蓝了。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/pip-simulation`（小人模拟实验） |
| 样片 | 《跑得快，就更好吗？》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/moni/scripts/moni.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/moni/scripts/moni.py --check   # 体检
python pipelines/moni/scripts/moni.py --plan    # 看步骤
python pipelines/moni/scripts/moni.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/pip-simulation/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
