# youhua —— 油画厚涂（Impasto Oil Painting）

灰色雨中广场，第一把红伞撑开，圆舞曲把整个广场刷上颜色。

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游 | lemo-opuscar `styles/impasto`（油画厚涂） |
| 样片 | 《雨的颜色》39.7 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/youhua/scripts/youhua.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/youhua/scripts/youhua.py --check   # 体检
python pipelines/youhua/scripts/youhua.py --plan    # 看步骤
python pipelines/youhua/scripts/youhua.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/impasto/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
