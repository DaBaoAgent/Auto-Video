# shibo —— 示波器数学（Oscilloscope Math）

方方正正的波，怎么由圆滚出来？一个个圆叠成方波，直到镜头扎进一个角：那里有一个永远消不掉的 9% 尖角。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/oscilloscope-math`（示波器数学） |
| 样片 | 《吉布斯现象》51.1 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/shibo/scripts/shibo.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/shibo/scripts/shibo.py --check   # 体检
python pipelines/shibo/scripts/shibo.py --plan    # 看步骤
python pipelines/shibo/scripts/shibo.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/oscilloscope-math/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
