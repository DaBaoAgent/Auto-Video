# wangdian —— 网点档案（Halftone Dossier）

橘猫胖橘被立案审查：测试重力、凌晨跑酷，最后无罪释放。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/halftone-dossier`（网点档案） |
| 样片 | 《胖橘案卷》30.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/wangdian/scripts/wangdian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/wangdian/scripts/wangdian.py --check   # 体检
python pipelines/wangdian/scripts/wangdian.py --plan    # 看步骤
python pipelines/wangdian/scripts/wangdian.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/halftone-dossier/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
