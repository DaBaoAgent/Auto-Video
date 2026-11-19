# jinbo —— 金箔彩绘（Gilded Illumination）

画里的世界只有金子会发光，可太阳熄了；一个女孩提着最后一盏灯上山，把光还给了太阳。

| 项 | 值 |
| --- | --- |
| 工位 | 03 传统工艺 |
| 上游 | lemo-opuscar `styles/gilded-illumination`（金箔彩绘） |
| 样片 | 《借来的光》46.8 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jinbo/scripts/jinbo.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jinbo/scripts/jinbo.py --check   # 体检
python pipelines/jinbo/scripts/jinbo.py --plan    # 看步骤
python pipelines/jinbo/scripts/jinbo.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/gilded-illumination/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
