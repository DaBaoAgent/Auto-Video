# zhuomian —— 桌面卡片穿梭（Tabletop App Flythrough）

一张猫照片跳过桌上的应用卡片，从一台手机飞到朋友手机里，一镜跟到底。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | lemo-opuscar `styles/desktop-flythrough`（桌面卡片穿梭） |
| 样片 | 《叮之前》60.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/zhuomian/scripts/zhuomian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/zhuomian/scripts/zhuomian.py --check   # 体检
python pipelines/zhuomian/scripts/zhuomian.py --plan    # 看步骤
python pipelines/zhuomian/scripts/zhuomian.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/desktop-flythrough/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
