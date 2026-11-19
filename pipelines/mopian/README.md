# mopian —— 1920s 默片（1920s Silent Film）

面包店学徒追一个滚走的面包，最后掰成两半分给饿肚子的小女孩。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/silent-film`（1920s 默片） |
| 样片 | 《逃跑的面包》54.2 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/mopian/scripts/mopian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/mopian/scripts/mopian.py --check   # 体检
python pipelines/mopian/scripts/mopian.py --plan    # 看步骤
python pipelines/mopian/scripts/mopian.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/silent-film/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
