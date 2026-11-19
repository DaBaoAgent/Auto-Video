# houshi —— 后室录像带（Liminal Found Footage）

新夜班员工拍下入职第一晚：无尽的黄色办公空间，和墙上的员工守则。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/backrooms`（后室录像带） |
| 样片 | 《夜班入职培训》59.7 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/houshi/scripts/houshi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/houshi/scripts/houshi.py --check   # 体检
python pipelines/houshi/scripts/houshi.py --plan    # 看步骤
python pipelines/houshi/scripts/houshi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/backrooms/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
