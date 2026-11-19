# fugu —— 复古版画拼贴（Vintage Engraving Collage）

1918 年一整版印反了的航空邮票：24 美元买下、剪开散落，66 号至今下落不明。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/vintage-collage`（复古版画拼贴） |
| 样片 | 《倒置的珍妮》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/fugu/scripts/fugu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/fugu/scripts/fugu.py --check   # 体检
python pipelines/fugu/scripts/fugu.py --plan    # 看步骤
python pipelines/fugu/scripts/fugu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/vintage-collage/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
