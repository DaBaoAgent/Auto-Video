# tongban —— 铜版画（Copperplate Engraving）

一张博物志图版自己刻出来：雕刀推开铜版，蜜蜂一线线成形，最后手工水彩上色。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/engraving`（铜版画） |
| 样片 | 《蜜蜂，图版七》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/tongban/scripts/tongban.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/tongban/scripts/tongban.py --check   # 体检
python pipelines/tongban/scripts/tongban.py --plan    # 看步骤
python pipelines/tongban/scripts/tongban.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/engraving/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
