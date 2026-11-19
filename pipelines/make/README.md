# make —— 马克笔白纸速写（Marker on Paper）

一支马克笔在白纸上算出海边能看多远，再告诉你：爬高 100 倍，只能多看远 10 倍。

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游 | lemo-opuscar `styles/marker-paper`（马克笔白纸速写） |
| 样片 | 《你能看多远？》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/make/scripts/make.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/make/scripts/make.py --check   # 体检
python pipelines/make/scripts/make.py --plan    # 看步骤
python pipelines/make/scripts/make.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/marker-paper/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
