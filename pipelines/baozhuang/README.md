# baozhuang —— 电视新闻包装（Broadcast News Package）

一周四条 AI 新闻，一整套电视台包装：串联单、标题条、翻牌价格表、规格卡。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/news-package`（电视新闻包装） |
| 样片 | 《本周 AI 四件事》53.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/baozhuang/scripts/baozhuang.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/baozhuang/scripts/baozhuang.py --check   # 体检
python pipelines/baozhuang/scripts/baozhuang.py --plan    # 看步骤
python pipelines/baozhuang/scripts/baozhuang.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/news-package/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
