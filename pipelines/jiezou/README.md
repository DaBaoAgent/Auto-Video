# jiezou —— 节奏综艺（Rhythm Game Show）

把 AI 发展史做成一局节奏游戏，模型踩着拍登场，最后发成绩单。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/game-show`（节奏综艺） |
| 样片 | 《AI 进化节拍》148.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jiezou/scripts/jiezou.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jiezou/scripts/jiezou.py --check   # 体检
python pipelines/jiezou/scripts/jiezou.py --plan    # 看步骤
python pipelines/jiezou/scripts/jiezou.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/game-show/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
