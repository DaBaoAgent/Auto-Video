# dangan —— 档案看片台（Archive Light Table）

电报说最长飞了 57 秒；放大镜下，莱特兄弟的底片和档案说是 59 秒。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/archive-lighttable`（档案看片台） |
| 样片 | 《差两秒》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/dangan/scripts/dangan.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/dangan/scripts/dangan.py --check   # 体检
python pipelines/dangan/scripts/dangan.py --plan    # 看步骤
python pipelines/dangan/scripts/dangan.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/archive-lighttable/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
