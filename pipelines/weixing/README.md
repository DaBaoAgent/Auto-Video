# weixing —— 卫星简报（Satellite Briefing）

卫星照着地图去找咸海，找到的是沙漠；只有筑了坝的那一块回来了。

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游 | lemo-opuscar `styles/satellite-briefing`（卫星简报） |
| 样片 | 《地图上还写着海》37.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/weixing/scripts/weixing.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/weixing/scripts/weixing.py --check   # 体检
python pipelines/weixing/scripts/weixing.py --plan    # 看步骤
python pipelines/weixing/scripts/weixing.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/satellite-briefing/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
