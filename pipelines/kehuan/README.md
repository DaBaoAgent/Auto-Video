# kehuan —— 科幻情景喜剧卡通（Sci-Fi Sitcom Toon）

厌世天才开传送门只想买杯咖啡，却穿过越来越离谱的平行宇宙。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/scifi-toon`（科幻情景喜剧卡通） |
| 样片 | 《跑腿买咖啡》57.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/kehuan/scripts/kehuan.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/kehuan/scripts/kehuan.py --check   # 体检
python pipelines/kehuan/scripts/kehuan.py --plan    # 看步骤
python pipelines/kehuan/scripts/kehuan.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/scifi-toon/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
