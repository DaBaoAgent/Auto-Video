# zimu —— 字幕新闻（Caption News）

美国一年死掉 130 万箱蜜蜂，总数却涨了 6%：静音也能看懂的新闻。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/caption-news`（字幕新闻） |
| 样片 | 《蜜蜂账本》59.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/zimu/scripts/zimu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/zimu/scripts/zimu.py --check   # 体检
python pipelines/zimu/scripts/zimu.py --plan    # 看步骤
python pipelines/zimu/scripts/zimu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/caption-news/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
