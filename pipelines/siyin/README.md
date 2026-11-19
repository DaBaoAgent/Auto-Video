# siyin —— 丝印旅行海报（Silkscreen Travel Poster）

一张满屏丝印海报一座城，票根数着离家的公里数，走到世界的另一头，才发现那是回家的路。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/silkscreen-poster`（丝印旅行海报） |
| 样片 | 《绕远路回家》50.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/siyin/scripts/siyin.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/siyin/scripts/siyin.py --check   # 体检
python pipelines/siyin/scripts/siyin.py --plan    # 看步骤
python pipelines/siyin/scripts/siyin.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/silkscreen-poster/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
