# dianlu —— 电路板（Circuit Board）

江河变成电路板上的走线，电流从水坝跑 2,080 公里进手机充电器。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/circuit-board`（电路板） |
| 样片 | 《七毫秒》60.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/dianlu/scripts/dianlu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/dianlu/scripts/dianlu.py --check   # 体检
python pipelines/dianlu/scripts/dianlu.py --plan    # 看步骤
python pipelines/dianlu/scripts/dianlu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/circuit-board/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
