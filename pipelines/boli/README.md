# boli —— 彩色玻璃窗（Stained Glass）

阳光从清晨移到黄昏，照到哪一格花窗，哪一格的故事就动起来。

| 项 | 值 |
| --- | --- |
| 工位 | 03 传统工艺 |
| 上游 | lemo-opuscar `styles/stained-glass`（彩色玻璃窗） |
| 样片 | 《东窗之龙》56.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/boli/scripts/boli.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/boli/scripts/boli.py --check   # 体检
python pipelines/boli/scripts/boli.py --plan    # 看步骤
python pipelines/boli/scripts/boli.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/stained-glass/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
