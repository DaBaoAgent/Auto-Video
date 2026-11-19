# xiangsu2 —— 2.5D 像素（2.5D Pixel Art）

灯塔熄灭，孙女提着最后一簇火穿过夜林、爬上风暴悬崖。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/hd-2d`（2.5D 像素） |
| 样片 | 《守灯人》76.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/xiangsu2/scripts/xiangsu2.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/xiangsu2/scripts/xiangsu2.py --check   # 体检
python pipelines/xiangsu2/scripts/xiangsu2.py --plan    # 看步骤
python pipelines/xiangsu2/scripts/xiangsu2.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/hd-2d/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
