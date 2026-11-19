# baimo —— 白模投影（Projection-Mapped Model）

投影机把数据一层层刷上鹿特丹白模：从 1940 年的空洞到今天的塔楼。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/white-model`（白模投影） |
| 样片 | 《被炸平的城市怎样长回来》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/baimo/scripts/baimo.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/baimo/scripts/baimo.py --check   # 体检
python pipelines/baimo/scripts/baimo.py --plan    # 看步骤
python pipelines/baimo/scripts/baimo.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/white-model/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
