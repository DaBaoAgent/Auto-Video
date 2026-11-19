# xinwen —— 1920s 新闻影片（1920s Newsreel）

1926 年报纸说查尔斯顿会跳坏膝盖，福特工人野餐会上的孩子照跳不误。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/newsreel`（1920s 新闻影片） |
| 样片 | 《膝盖警报》54.6 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/xinwen/scripts/xinwen.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/xinwen/scripts/xinwen.py --check   # 体检
python pipelines/xinwen/scripts/xinwen.py --plan    # 看步骤
python pipelines/xinwen/scripts/xinwen.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/newsreel/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
