# keli —— 扁平颗粒插画（Flat Grain Illustration）

两种专色印在暖纸上，体积与光全靠点状颗粒；一条地平线把时代一段段长出来。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | BB-Video `skills/bb-video/styles/grain`（扁平颗粒插画） |
| 样片 | 《人类如何照亮夜晚》92.6 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/keli/scripts/keli.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/keli/scripts/keli.py --check   # 体检
python pipelines/keli/scripts/keli.py --plan    # 看步骤
python pipelines/keli/scripts/keli.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/grain/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
