# andiao —— 暗调励志（Dark Motivational）

几乎全黑的房间只留一盏动机光，方形头小人用眉眼演完熬夜、拖延与那个决定。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | BB-Video `skills/bb-video/styles/lumen`（暗调励志） |
| 样片 | 《再刷五分钟 · 报复性熬夜》165.3 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/andiao/scripts/andiao.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/andiao/scripts/andiao.py --check   # 体检
python pipelines/andiao/scripts/andiao.py --plan    # 看步骤
python pipelines/andiao/scripts/andiao.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/lumen/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
