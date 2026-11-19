# bishi —— 笔式绘图仪（Pen Plotter）

深夜台灯下，一台笔式绘图仪用四支笔按真实高程画出珠穆朗玛峰，最后一笔写下它的高度。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/pen-plotter`（笔式绘图仪） |
| 样片 | 《8848.86》49.9 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/bishi/scripts/bishi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/bishi/scripts/bishi.py --check   # 体检
python pipelines/bishi/scripts/bishi.py --plan    # 看步骤
python pipelines/bishi/scripts/bishi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/pen-plotter/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
