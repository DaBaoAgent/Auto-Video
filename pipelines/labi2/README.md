# labi2 —— 蜡笔立体世界（Crayon World 3D）

第一人称飞过蜡笔画的村子，落在老人花园里的一朵花上；最后换成他的眼睛，和他说的一句话。

| 项 | 值 |
| --- | --- |
| 工位 | 07 三维推演 |
| 上游 | lemo-opuscar `styles/crayon-world`（蜡笔立体世界） |
| 样片 | 《蝴蝶》64.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/labi2/scripts/labi2.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/labi2/scripts/labi2.py --check   # 体检
python pipelines/labi2/scripts/labi2.py --plan    # 看步骤
python pipelines/labi2/scripts/labi2.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/crayon-world/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
