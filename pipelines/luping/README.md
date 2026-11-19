# luping —— 像素小人录屏（Mascot Screencast）

像素小人 Clawd 搬进 Claude 应用，一镜到底演示 Plan 模式和自检。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/living-screencast`（像素小人录屏） |
| 样片 | 《Clawd 搬进来了》59.4 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/luping/scripts/luping.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/luping/scripts/luping.py --check   # 体检
python pipelines/luping/scripts/luping.py --plan    # 看步骤
python pipelines/luping/scripts/luping.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/living-screencast/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
