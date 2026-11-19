# yugao —— 电影预告（Movie Trailer）

2.39:1 遮幅的好莱坞预告：青橙调、黑底金属字卡、钢琴一记、BRAAM 与标题砸屏。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | BB-Video `skills/bb-video/styles/trailer`（电影预告） |
| 样片 | 《Deep Space Echo · 预告》83.2 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/yugao/scripts/yugao.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/yugao/scripts/yugao.py --check   # 体检
python pipelines/yugao/scripts/yugao.py --plan    # 看步骤
python pipelines/yugao/scripts/yugao.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/trailer/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
