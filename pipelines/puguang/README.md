# puguang —— 双重曝光（Double Exposure）

天黑下来的这一路，从山到海：鹿、狼、鹰、鲑鱼、鲸，每只动物的剪影里装着它的那片天地；最后鲸身体里的港湾落在真的海岸上。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/double-exposure`（双重曝光） |
| 样片 | 《山海》50.5 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/puguang/scripts/puguang.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/puguang/scripts/puguang.py --check   # 体检
python pipelines/puguang/scripts/puguang.py --plan    # 看步骤
python pipelines/puguang/scripts/puguang.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/double-exposure/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
