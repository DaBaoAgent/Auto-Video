# zhanshu —— 体育战术板（Sports Telestrator）

半场 0–3，费内巴切 12 分钟连进三球：冻住画面、画线、分屏、射门图。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/telestrator`（体育战术板） |
| 样片 | 《定格》54.4 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/zhanshu/scripts/zhanshu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/zhanshu/scripts/zhanshu.py --check   # 体检
python pipelines/zhanshu/scripts/zhanshu.py --plan    # 看步骤
python pipelines/zhanshu/scripts/zhanshu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/telestrator/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
