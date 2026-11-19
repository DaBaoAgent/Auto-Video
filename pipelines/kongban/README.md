# kongban —— 孔版印刷（Risograph Print）

周日早晨骑车穿过城市：面包店、公园、河边，每到一处加一版油墨，最后三版套印。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/risograph`（孔版印刷） |
| 样片 | 《周日骑行》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/kongban/scripts/kongban.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/kongban/scripts/kongban.py --check   # 体检
python pipelines/kongban/scripts/kongban.py --plan    # 看步骤
python pipelines/kongban/scripts/kongban.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/risograph/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
