# baohao —— 包豪斯几何（Bauhaus Shapes）

一个点每十年翻一倍：七十年后是 128，不复利只有 6.02，最后十年抵得上之前的全部。

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游 | lemo-opuscar `styles/bauhaus-shapes`（包豪斯几何） |
| 样片 | 《复利是怎么滚起来的》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/baohao/scripts/baohao.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/baohao/scripts/baohao.py --check   # 体检
python pipelines/baohao/scripts/baohao.py --plan    # 看步骤
python pipelines/baohao/scripts/baohao.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/bauhaus-shapes/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
