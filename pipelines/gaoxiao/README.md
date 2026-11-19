# gaoxiao —— 搞笑历史卡通（Comic History Cartoon）

阿尔萨斯-洛林在 1871 到 1945 年间四次换主人：每次都有人撕下那块纸、贴上新的，住在上面的她一步没挪。

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游 | lemo-opuscar `styles/comic-history`（搞笑历史卡通） |
| 样片 | 《一块纸》51.0 s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `pipelines/gaoxiao/scripts/gaoxiao.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/gaoxiao/scripts/gaoxiao.py --check   # 体检
python pipelines/gaoxiao/scripts/gaoxiao.py --plan    # 看步骤
python pipelines/gaoxiao/scripts/gaoxiao.py           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/comic-history/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
