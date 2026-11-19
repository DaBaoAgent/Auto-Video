# diaocha —— 视觉调查（Visual Investigation）

新闻片、照片、证词和调查报告排上同一条时间轴，五路来源指向一处。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/visual-investigation`（视觉调查） |
| 样片 | 《兴登堡号：四分钟与三十二秒》60.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/diaocha/scripts/diaocha.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/diaocha/scripts/diaocha.py --check   # 体检
python pipelines/diaocha/scripts/diaocha.py --plan    # 看步骤
python pipelines/diaocha/scripts/diaocha.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/visual-investigation/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
