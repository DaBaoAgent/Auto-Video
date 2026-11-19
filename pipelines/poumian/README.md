# poumian —— 线稿剖面图解（Line-Art Cutaway）

一部手机握住底角就掉信号；拆开才发现金属边框就是天线，被切成几段，手一握就把缝连上了。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/hardcore-info`（线稿剖面图解） |
| 样片 | 《你手机的天线在哪》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/poumian/scripts/poumian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/poumian/scripts/poumian.py --check   # 体检
python pipelines/poumian/scripts/poumian.py --plan    # 看步骤
python pipelines/poumian/scripts/poumian.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/hardcore-info/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
