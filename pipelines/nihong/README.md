# nihong —— 霓虹灯管（Neon Tubes）

一只霓虹猫去街尾招牌上偷金鱼当夜宵，一爪子拍漏了鱼缸，又叼着快灭的鱼冒雨跑回家，放进自家招牌上的冰饮杯。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/neon-tubes`（霓虹灯管） |
| 样片 | 《夜宵》48.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/nihong/scripts/nihong.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/nihong/scripts/nihong.py --check   # 体检
python pipelines/nihong/scripts/nihong.py --plan    # 看步骤
python pipelines/nihong/scripts/nihong.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/neon-tubes/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
