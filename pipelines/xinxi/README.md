# xinxi —— 等距信息图（Isometric Infographic）

一杯咖啡从种植园到你手里的旅程。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/iso-infographic`（等距信息图） |
| 样片 | 《从豆到杯》58.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/xinxi/scripts/xinxi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/xinxi/scripts/xinxi.py --check   # 体检
python pipelines/xinxi/scripts/xinxi.py --plan    # 看步骤
python pipelines/xinxi/scripts/xinxi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/iso-infographic/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
