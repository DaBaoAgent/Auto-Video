# liuchang —— 流场风线（Flow-field Wind Lines）

几千条从最佳路径算出来的墨色风线，画出超强台风摩羯的一生：在南海睁开风眼，在文昌登陆，在越南散开，一整周最后收成一条线。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/flow-field`（流场风线） |
| 样片 | 《摩羯过琼州》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/liuchang/scripts/liuchang.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/liuchang/scripts/liuchang.py --check   # 体检
python pipelines/liuchang/scripts/liuchang.py --plan    # 看步骤
python pipelines/liuchang/scripts/liuchang.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/flow-field/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
