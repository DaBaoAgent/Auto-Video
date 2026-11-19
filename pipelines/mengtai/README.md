# mengtai —— 构成主义蒙太奇（Constructivist Montage）

帝国大厦的小册子写着建造者，工地实拍和老照片给出答案：每天 2,500 人。

| 项 | 值 |
| --- | --- |
| 工位 | 10 实拍混剪 |
| 上游 | lemo-opuscar `styles/kino-montage`（构成主义蒙太奇） |
| 样片 | 《410 天》60.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/mengtai/scripts/mengtai.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/mengtai/scripts/mengtai.py --check   # 体检
python pipelines/mengtai/scripts/mengtai.py --plan    # 看步骤
python pipelines/mengtai/scripts/mengtai.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/kino-montage/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
