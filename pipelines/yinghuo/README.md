# yinghuo —— 萤火光点（Firefly Pointillism）

萤火虫闪一下就是在发问：女孩得到的回答是一只鹿，暴风雨吹灭了所有的光，她用最后一只问遍了整片黑夜。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/firefly-pointillism`（萤火光点） |
| 样片 | 《你亮，我就亮》50.6 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/yinghuo/scripts/yinghuo.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/yinghuo/scripts/yinghuo.py --check   # 体检
python pipelines/yinghuo/scripts/yinghuo.py --plan    # 看步骤
python pipelines/yinghuo/scripts/yinghuo.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/firefly-pointillism/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
