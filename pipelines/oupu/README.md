# oupu —— 欧普艺术（Op Art）

黑白条纹、同心环与棋盘在透镜里鼓起来，百叶窗式揭开产品。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | BB-Video `skills/bb-video/styles/op`（欧普艺术） |
| 样片 | 《Stripe · 官网》22.3 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/oupu/scripts/oupu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/oupu/scripts/oupu.py --check   # 体检
python pipelines/oupu/scripts/oupu.py --plan    # 看步骤
python pipelines/oupu/scripts/oupu.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/op/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
