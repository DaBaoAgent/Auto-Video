# zhike —— 胶片直刻（Scratch Film）

一条手指长的灯笼鱼摸黑往上游半公里，用自己的光藏起影子；镜头拉远，原来每晚有无数动物和它一起升起。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/scratch-film`（胶片直刻） |
| 样片 | 《夜里往上游》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/zhike/scripts/zhike.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/zhike/scripts/zhike.py --check   # 体检
python pipelines/zhike/scripts/zhike.py --plan    # 看步骤
python pipelines/zhike/scripts/zhike.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/scratch-film/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
