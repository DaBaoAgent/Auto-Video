# wenzi —— 文字闪切（Text Flash Cuts）

一封信、一通电话、一面窗墙、十三级台阶：叫他别回头的她每一话都更近一步，直到她自己猛地回头。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/text-flash-cuts`（文字闪切） |
| 样片 | 《身后》46.2 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/wenzi/scripts/wenzi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/wenzi/scripts/wenzi.py --check   # 体检
python pipelines/wenzi/scripts/wenzi.py --plan    # 看步骤
python pipelines/wenzi/scripts/wenzi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/text-flash-cuts/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
