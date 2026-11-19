# 026 镇魔塔 · tianshu 示范工程

这是 tianshu 管线**从真实运行记录反向固化**出来的示范工程：不是新造的样例，
是把 2026-11-13 那次 026《镇魔塔》前 10 镜的实际参数，挑出 6 个有完整画面 prompt 的镜头装进来。

## 这 6 镜的数据从哪来

| 字段 | 来源 |
|---|---|
| `subject` / `scene` / `motion` | `i2v_jobs_01_10_v2.json` 里的实际 I2V 提示词（同一条提示词的前半段就是画面描述） |
| `move` / `amount` / `zoom` / `rise` / `dur` | `cam_jobs_01_10.json` 的前 10 镜运镜表 |
| `target_val` / `target_sat` | `jobs_post_01_10.json` 里逐镜取色目标，来自各自对位原片帧实测 |
| `ref` | 原工程注释里写明的对位帧（c15 / c65 / c66） |
| `warm` / `extra_gamma` | 原工程 S006（铁函镜）的暖灰修正 |

`work/shot_plan.json` 的时码由上述 `dur` 累加而来（总 40.66 s）；
`narration` 留空 —— 原 026 的分镜表没有入库，不臆造旁白。
换成自己的新片时，这一步交给 `beats` + `plan` 自动填。

## 直接跑

```powershell
python tianshu/scripts/tianshu.py post   026_zhenmota   # 需要先有 plates/（见下）
python tianshu/scripts/tianshu.py i2v    026_zhenmota --only S001
python tianshu/scripts/tianshu.py anchor 026_zhenmota
python tianshu/scripts/tianshu.py cam    026_zhenmota
python tianshu/scripts/tianshu.py concat 026_zhenmota
```

`work/jobs_*.json` 已经由 `scaffold` 生成好，不用重跑。
`plates/` 是空的（约 8 MB 底图不入库）：把 026 的原图按 `S001.png … S006.png` 放进 `plates/`，
或者重新出图 —— 但**直接跑 `stills` 会出 1024×1024 方图**：这 6 个作业单没带参考图，
Qwen 的 latent 尺寸来自第一张参考图，没图就退回正方形。要 1024×768，先在 `work/shots.json`
给对应镜头加一行 `"ref_image": "<同场已过审底图.png>"`（相对工程目录或绝对路径），再跑 `scaffold`。
026 原工程就是给一张已过审的 `sb2` 底图当参考图出下一镜的。

## 两个值得注意的地方

- **S004 只有 2.22 s** —— 这是原片的真实节奏（一个下台阶的短镜），
  分镜规则允许保留「合并不进去的独句短镜」，不要看它短就去拉长。
- **S006 带了 `warm` / `extra_gamma`** —— 因为它的对位帧 c65 本身偏冷，
  生成结果跟着偏蓝，需要单独走暖灰。这类「某镜整体偏一个颜色」的修正，
  只能一镜一策，不能拉全片色温。

## 和 `projects/_smoke/` 的区别

`_smoke` 是本地验证用的临时工程（真底图 + 真片段，跑通脚本链），**不入库**；
本工程只入库参数与作业单，底图与片段同样不入库。
