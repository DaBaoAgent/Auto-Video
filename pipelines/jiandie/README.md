# jiandie —— 60s 间谍片头（60s Spy Title Sequence）

虚构 1964 年间谍片的片头：追一把被偷的钥匙，几何碎片最后拼成片名。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/spy-titles`（60s 间谍片头） |
| 样片 | 《天鹅绒密码》44.1 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jiandie/scripts/jiandie.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jiandie/scripts/jiandie.py --check   # 体检
python pipelines/jiandie/scripts/jiandie.py --plan    # 看步骤
python pipelines/jiandie/scripts/jiandie.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/spy-titles/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
