# liushui —— 流水线图解（Assembly-Line Diagram）

把人体剖成一座倒着开的工厂：12:30 的一份三明治被一站一站拆开，六小时后变成追公交车的力气。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/assembly-line-diagram`（流水线图解） |
| 样片 | 《拆解流水线》54.9 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/liushui/scripts/liushui.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/liushui/scripts/liushui.py --check   # 体检
python pipelines/liushui/scripts/liushui.py --plan    # 看步骤
python pipelines/liushui/scripts/liushui.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/assembly-line-diagram/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
