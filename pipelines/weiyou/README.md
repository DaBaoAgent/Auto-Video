# weiyou —— 微游戏快闪（Microgame Frenzy）

见习宇航员闯五秒训练营，越来越快，Boss 关亲手降落回地球。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/microgame`（微游戏快闪） |
| 样片 | 《五秒宇航员》59.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/weiyou/scripts/weiyou.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/weiyou/scripts/weiyou.py --check   # 体检
python pipelines/weiyou/scripts/weiyou.py --plan    # 看步骤
python pipelines/weiyou/scripts/weiyou.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/microgame/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
