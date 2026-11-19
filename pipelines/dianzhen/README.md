# dianzhen —— 1-bit 点阵（1-bit Dither）

1966 年 2 月，月面的第一张近照被英国一座射电望远镜当成报社传真收下，一行一行印出来：早了一天，比例却拉高了。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/one-bit-dither`（1-bit 点阵） |
| 样片 | 《月亮的传真》50.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/dianzhen/scripts/dianzhen.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/dianzhen/scripts/dianzhen.py --check   # 体检
python pipelines/dianzhen/scripts/dianzhen.py --plan    # 看步骤
python pipelines/dianzhen/scripts/dianzhen.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/one-bit-dither/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
