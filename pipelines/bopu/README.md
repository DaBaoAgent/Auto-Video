# bopu —— 波普艺术（Pop Art）

超市里几乎每根香蕉都是同一株植物的复制：一面一模一样的版画墙，一根被网点吃黑的老香蕉，最后一波换色翻出上千种香蕉。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/pop-art`（波普艺术） |
| 样片 | 《同一根香蕉》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/bopu/scripts/bopu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/bopu/scripts/bopu.py --check   # 体检
python pipelines/bopu/scripts/bopu.py --plan    # 看步骤
python pipelines/bopu/scripts/bopu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/pop-art/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
