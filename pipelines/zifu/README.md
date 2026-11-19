# zifu —— CRT 字符终端（CRT ASCII Terminal）

月球基地的 AI 沉睡 40 年后被唤醒，用字符画出“家”来回复。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/ascii-crt`（CRT 字符终端） |
| 样片 | 《静海日志》59.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/zifu/scripts/zifu.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/zifu/scripts/zifu.py --check   # 体检
python pipelines/zifu/scripts/zifu.py --plan    # 看步骤
python pipelines/zifu/scripts/zifu.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/ascii-crt/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
