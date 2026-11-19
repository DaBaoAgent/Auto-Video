# xuanyi —— 悬疑探秘（Suspense Mystery）

冷面伪科学电视：4:3 蓝屏、编号症状、橡皮管贴纸演一遍，最后切到测试卡。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | BB-Video `skills/bb-video/styles/mystery`（悬疑探秘） |
| 样片 | 《为什么你的朋友该叫你爸爸》44.4 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/xuanyi/scripts/xuanyi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/xuanyi/scripts/xuanyi.py --check   # 体检
python pipelines/xuanyi/scripts/xuanyi.py --plan    # 看步骤
python pipelines/xuanyi/scripts/xuanyi.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/mystery/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
