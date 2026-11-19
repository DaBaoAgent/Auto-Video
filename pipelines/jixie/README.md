# jixie —— 分色机械图解（Color-Coded Mechanism）

剖开一块不用电的表：三套系统按能量流向逐一染色，抽走擒纵后齿轮疯转，最后放慢到 1/40 等那一声滴答。

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游 | lemo-opuscar `styles/precise-mechanism`（分色机械图解） |
| 样片 | 《三套系统走时》52.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/jixie/scripts/jixie.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/jixie/scripts/jixie.py --check   # 体检
python pipelines/jixie/scripts/jixie.py --plan    # 看步骤
python pipelines/jixie/scripts/jixie.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/precise-mechanism/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
