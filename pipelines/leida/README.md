# leida —— 雷达扫描纪录片（Radar Sweep Documentary）

1969 年 7 月 21 日帕克斯的风暴里，一面放倒到极限的 64 米天线顶住了风，替全世界接住了登月直播。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/dark-documentary`（雷达扫描纪录片） |
| 样片 | 《狂风里接住登月直播》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/leida/scripts/leida.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/leida/scripts/leida.py --check   # 体检
python pipelines/leida/scripts/leida.py --plan    # 看步骤
python pipelines/leida/scripts/leida.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/dark-documentary/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
