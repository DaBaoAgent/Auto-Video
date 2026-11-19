# fabu —— 暗色科技发布（Dark Tech Keynote）

虚构 app Tidy 的发布片：被埋掉的光标一键把几百个窗口归位。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/dark-keynote`（暗色科技发布） |
| 样片 | 《思考的空间》42.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/fabu/scripts/fabu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/fabu/scripts/fabu.py --check   # 体检
python pipelines/fabu/scripts/fabu.py --plan    # 看步骤
python pipelines/fabu/scripts/fabu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/dark-keynote/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
