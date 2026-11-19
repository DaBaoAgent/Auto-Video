# jianzhi —— 红色窗花剪纸（Red Paper-cut）

除夕年兽进村，小女孩剪出的大窗花照亮全村，把它吓跑。

| 项 | 值 |
| --- | --- |
| 工位 | 03 传统工艺 |
| 上游 | lemo-opuscar `styles/papercut-red`（红色窗花剪纸） |
| 样片 | 《年兽进村》49.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jianzhi/scripts/jianzhi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jianzhi/scripts/jianzhi.py --check   # 体检
python pipelines/jianzhi/scripts/jianzhi.py --plan    # 看步骤
python pipelines/jianzhi/scripts/jianzhi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/papercut-red/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
