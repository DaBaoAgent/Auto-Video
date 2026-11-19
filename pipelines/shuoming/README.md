# shuoming —— 说明书插画（Instruction Manual Art）

两个从没装过家具的新手照说明书装婴儿床，十步排在同一张 45° 说明书上；第十步，说明书里没有。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/instruction-manual`（说明书插画） |
| 样片 | 《第十步》50.6 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/shuoming/scripts/shuoming.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/shuoming/scripts/shuoming.py --check   # 体检
python pipelines/shuoming/scripts/shuoming.py --plan    # 看步骤
python pipelines/shuoming/scripts/shuoming.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/instruction-manual/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
