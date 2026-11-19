# anjian —— 安检 X 光（Security X-ray）

机场安检机屏幕上的一个夜班：一个充电宝、一瓶水，还有在 CT 里动了一下腿的六只活蟹。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/security-xray`（安检 X 光） |
| 样片 | 《安检口的夜班》51.9 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/anjian/scripts/anjian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/anjian/scripts/anjian.py --check   # 体检
python pipelines/anjian/scripts/anjian.py --plan    # 看步骤
python pipelines/anjian/scripts/anjian.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/security-xray/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
