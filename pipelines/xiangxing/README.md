# xiangxing —— 象形运动图形（Pictogram Motion）

一把被落在公交车上的黄伞，晴天里在失物招领的货架上等了一整天，暴雨回来时和另外 312 把一起撑开：物件、交通、天气和标识，都是卡着节拍的几何象形符号。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/pictogram-motion`（象形运动图形） |
| 样片 | 《被落下的伞》50.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/xiangxing/scripts/xiangxing.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/xiangxing/scripts/xiangxing.py --check   # 体检
python pipelines/xiangxing/scripts/xiangxing.py --plan    # 看步骤
python pipelines/xiangxing/scripts/xiangxing.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/pictogram-motion/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
