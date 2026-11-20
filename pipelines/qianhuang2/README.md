# qianhuang2 · 铅黄剪影（Giallo Silhouette Stage）

不画颜料，只画**全黑剪影 + 双缘光 + 一池压在地上的舞台光**。
角色回头靠发丝晚两帧、抬手别发与一道月白弧；结尾三条 35 mm 胶片带收拢，片名落在她头顶。

- 入口：`python qianhuang2/scripts/qianhuang2.py render 001_bayofblood_stage`
- 完整流程、参数、验收、已知坑：见 [SKILL.md](SKILL.md)
- 参数快照（色板 / 舞台常数 / 姿势表 / 时间轴 / 音频目标）：见 [pipeline.json](pipeline.json) 的 `spec`
- 与 `qianhuang`（浓彩手绘页 + 色片灯）同一世界观、两种画法：那条线靠颜料和色片，这条线靠剪影和光池

示例工程 `projects/001_bayofblood_stage/`：《血之海滩》第一段，21.462 s / 1920×1080 / 30 fps。

```
index.html   装配（engine → cast → world → film）
film.js      DUR + SHOTS 镜头表 + render(t)
world.js     面具 / 营地 / 裂口 / 海湾 / 片名 / 胶片收束
cast.js      POSES + woman / figure / lying + STAGE_Y / HEAD_Y
engine.js    色板、光池、火盆、投影、后处理
```
