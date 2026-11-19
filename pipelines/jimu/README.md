# jimu —— 积木玩具（Brick Toy）

积木宇航员用零件拼出火箭，飞向积木月亮。

| 项 | 值 |
| --- | --- |
| 工位 | 07 三维推演 |
| 上游 | lemo-opuscar `styles/brick-toy`（积木玩具） |
| 样片 | 《零件拼出的火箭》54.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jimu/scripts/jimu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jimu/scripts/jimu.py --check   # 体检
python pipelines/jimu/scripts/jimu.py --plan    # 看步骤
python pipelines/jimu/scripts/jimu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/brick-toy/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
