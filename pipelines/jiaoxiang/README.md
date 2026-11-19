# jiaoxiang —— 城市交响曲（City Symphony）

纽约的一天：延时光河、踩着十六分音符的网格，1899 年和今天并排。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/city-symphony`（城市交响曲） |
| 样片 | 《纽约的一天》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jiaoxiang/scripts/jiaoxiang.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jiaoxiang/scripts/jiaoxiang.py --check   # 体检
python pipelines/jiaoxiang/scripts/jiaoxiang.py --plan    # 看步骤
python pipelines/jiaoxiang/scripts/jiaoxiang.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/city-symphony/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
