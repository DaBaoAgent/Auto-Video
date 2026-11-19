# biji —— 视觉笔记（Sketchnote）

一只蜜蜂一辈子只酿 1/12 茶匙蜜；笔跟着一滴黄从花走到罐子，最后整页成了一张海报。

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游 | lemo-opuscar `styles/sketchnote`（视觉笔记） |
| 样片 | 《蜜蜂怎样酿蜜》51.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/biji/scripts/biji.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/biji/scripts/biji.py --check   # 体检
python pipelines/biji/scripts/biji.py --plan    # 看步骤
python pipelines/biji/scripts/biji.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/sketchnote/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
