# wushi —— 50s 扁平卡通（Mid-century Cartoon）

用 50 年代教育片的口吻，三步教你装好一台扫地机。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/midcentury-toon`（50s 扁平卡通） |
| 样片 | 《认识一下 Pip》40.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/wushi/scripts/wushi.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/wushi/scripts/wushi.py --check   # 体检
python pipelines/wushi/scripts/wushi.py --plan    # 看步骤
python pipelines/wushi/scripts/wushi.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/midcentury-toon/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
