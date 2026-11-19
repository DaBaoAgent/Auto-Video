# heiban —— 黑板粉笔（Chalkboard）

粉笔写下网上的说法，再一擦，把「射」写回三千年前。

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游 | lemo-opuscar `styles/chalkboard`（黑板粉笔） |
| 样片 | 《汉字的故事》49.3 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/heiban/scripts/heiban.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/heiban/scripts/heiban.py --check   # 体检
python pipelines/heiban/scripts/heiban.py --plan    # 看步骤
python pipelines/heiban/scripts/heiban.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/chalkboard/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
