# shiwu —— 数据实物化（Data Physicalization）

十二年风电和太阳能装机叠成实物，绕表盘升成两条螺旋，2021 年太阳能反超。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/data-physical`（数据实物化） |
| 样片 | 《两条螺旋》39.4 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/shiwu/scripts/shiwu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/shiwu/scripts/shiwu.py --check   # 体检
python pipelines/shiwu/scripts/shiwu.py --plan    # 看步骤
python pipelines/shiwu/scripts/shiwu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/data-physical/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
