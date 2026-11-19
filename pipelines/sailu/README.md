# sailu —— 80 年代赛璐璐动画（80s Cel Anime）

快递少女骑车穿过雨后霓虹都市，赶在黎明发射前送到一盘磁带。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/cel-anime-80s`（80 年代赛璐璐动画） |
| 样片 | 《城市灯火，1987》59.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/sailu/scripts/sailu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/sailu/scripts/sailu.py --check   # 体检
python pipelines/sailu/scripts/sailu.py --plan    # 看步骤
python pipelines/sailu/scripts/sailu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/cel-anime-80s/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
