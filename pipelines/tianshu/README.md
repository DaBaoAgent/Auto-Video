# tianshu · 天书本地大模型出片

一条口播驱动的 4:3 上美影手绘赛璐璐成片管线：**本机 Qwen-Image 2.1 出定帧，
本机 Wan2.2 TI2V-5B 出氛围动态，代码管后期、运镜、拼接、质检、交付。**
不调任何云端 API，一次出片 0 元；代价是 12 GB 显存和算力时间。

首个实例：026《镇魔塔》。2026-11 那条线的参数、坑和验收都在
[SKILL.md](SKILL.md) 里，这里只讲怎么跑起来。

## 三分钟起步

```powershell
# 0. 自检：ComfyUI 是否在线、6 个模型是否齐、ffmpeg 是否在 PATH
python tianshu/scripts/tianshu.py doctor

# 1. 建工程（从出稿目录拷 配音.wav / 口播稿_定稿.txt）
python tianshu/scripts/tianshu.py new zhenmota --episode 026 --title 镇魔塔 `
  --src "D:/@kaifa/PeiYin/weijie/出稿/026_镇魔塔_水墨S级"

# 2. 原片抽帧取色（一次性；给 shots.json 填 ref 就能自动带色板）
python tianshu/scripts/tianshu.py refstats zhenmota

# 3. 配音 -> 逐句时码 -> 分镜 -> 四张作业单
python tianshu/scripts/tianshu.py beats zhenmota
python tianshu/scripts/tianshu.py plan zhenmota
python tianshu/scripts/tianshu.py scaffold zhenmota

# 4. 填 work/shots.json 的 subject（画面描述）、move（运镜），然后跑画面
python tianshu/scripts/tianshu.py stills zhenmota        # Qwen 出定帧，80 s/张
python tianshu/scripts/tianshu.py post zhenmota          # 逐镜锚定亮度/饱和 + 原片颗粒
python tianshu/scripts/tianshu.py i2v zhenmota --tier big # Wan 出动态，275 s/条
python tianshu/scripts/tianshu.py anchor zhenmota        # 逐帧色彩锚定
python tianshu/scripts/tianshu.py cam zhenmota           # 后期运镜（改运镜不用重跑视频）
python tianshu/scripts/tianshu.py concat zhenmota
python tianshu/scripts/tianshu.py mux zhenmota
python tianshu/scripts/tianshu.py qa zhenmota
python tianshu/scripts/tianshu.py publish zhenmota --sample
```

先出 2 镜试片：`stills zhenmota --only S001,S002`，看住了再整片铺。

## 目录

```
tianshu/
├── SKILL.md                  完整流程、定版参数、14 条已知坑、验收条件
├── README.md                 本文档
├── CREDITS.md                模型 / 引擎 / 技法来源与许可说明
├── pipeline.json             唯一参数来源（画布/模型/出图/后期/出视频/运镜/音频）
├── template/
│   ├── style_prompt.md       提示词三段骨架 + 负词 + 色板规则 + I2V 铁律
│   └── shots.example.json    空镜头表（new 会复制一份进 work/）
├── scripts/
│   ├── tianshu.py            编排 CLI（自动换解释器 / doctor / new / all）
│   ├── tcfg.py               配置加载、路径、提示词骨架、ffprobe
│   ├── stage_beats.py        配音 → 逐句时码（20 ms RMS + 吸附真静音）
│   ├── stage_plan.py         时码 → 分镜（语义切分，3–6 s 一镜）+ srt
│   ├── stage_scaffold.py     分镜 + 镜头表 → 四个阶段作业单
│   ├── style_refstats.py     原片抽帧 → 逐帧色板/亮度/饱和基线
│   ├── plate_stills.py       Qwen-Image 2.1 出定帧（ComfyUI HTTP）
│   ├── post_unify.py         统一后期（逐镜锚色 + 原片颗粒纸纹）
│   ├── i2v_wan.py            Wan2.2 TI2V-5B 图生视频（ComfyUI HTTP）
│   ├── anchor_color.py       逐帧色彩锚定
│   ├── cam2d.py              后期 2D 运镜（cosine 缓动 + 双线性）
│   ├── shot_concat.py        拼接 + 时长对账 + 黑帧检测
│   ├── audio_mux.py          配音合流 + 两遍 loudnorm
│   ├── qa_check.py           逐镜数字对账 + 成片响度
│   ├── storyboard.py         审片联系表
│   └── publish_pack.py       交付打包（mp4 + srt + 海报 + 说明）
└── projects/
    └── 026_zhenmota/         示范工程（6 镜真实 prompt / 运镜 / 取色目标）
```

## 工程产物长这样

```
projects/<名>/
├── project.json              编号/标题/画幅/fps/源目录
├── source/                   配音.wav · 口播稿_定稿.txt
├── work/                     narration_beats / shot_plan / shots / 四张 jobs / 纹理层
├── plates/                   Qwen 原图
├── post/                     统一后期后的定帧（I2V 与运镜的输入）
├── i2v/                      Wan 出片段（121 帧）
├── anchored/                 色彩锚定后
├── cam/                      运镜后（拼接用这个）
└── out/                      成片 / srt / qa.json / 联系表
```

## 一条片子要多久

2026-11-15 在本机（RTX 4070 SUPER 12 GB）实测：

| 环节 | 单镜实测 |
|---|---|
| 定帧（Qwen 2.1 Q4，1024×768，25 步） | 120 s/张（含模型首载） |
| 出视频（Wan2.2 5B Q4，960×720，121 帧） | **约 39 分钟/条**（176 s/步，显存吃满） |
| 后期 + 锚定 + 运镜（CPU） | 每镜 20–60 s |

`pipeline.json` 里记的 275 s/条是 026 原工程的记录值，那是显存更宽裕的机器。
**12 GB 卡是这条线的硬瓶颈**：960×720/121 帧会把显存挤到 11.5/12.3 GB，GPU 跑满但功耗只有 66 W
（在等显存换页），所以慢得不成比例。显存不够时把单镜 `length` 降到 81（3.4 s），
长镜交给 `cam` 重定时放慢 —— 注意力成本大约按帧数平方走，121→81 省的不止三分之一。

整片时间随镜数线性走。**运镜不烧 GPU**：改相机只要重跑 `cam` 之后的阶段。

## 本地验证记录（2026-11-15）

拿到这条线之后先做了一轮端到端实跑，结论写在下面，好的坏的都留着：

| 验证 | 做法 | 结果 |
|---|---|---|
| 纯脚本链 | 9 镜 `_smoke` 工程（026 真实底图 + 2 条真实片段）跑 post→anchor→cam→concat→mux→qa→sheet | 全部跑通：post 9 张、anchor 121 帧/条、cam 9 镜、concat 56.33 s 无黑帧、mux 960×720@24fps 17.4 MB |
| 真实出图 | ComfyUI 8188 在线，喂 026 真实 prompt + c15 参考帧 | 1024×768，120 s，画面干净（塔/湖/山层次正确，无字幕、无多塔） |
| 真实出视频 | 用上一张 post 底图跑 Wan2.2 5B | 960×720/24fps/121 帧，画面稳定，但耗时约 39 分钟（见上节显存瓶颈） |
| 色彩锚定 | 对真实片段逐帧向 post 底图拉 0.85 | 5 秒内亮度漂移从 1.4 压到 0.3，饱和稳定在 24.9 |
| 分镜链 | 026 真配音 543 s + 口播稿 → beats → plan → scaffold | 121 句 → 126 镜，均 4.31 s，3 镜 <3 s 会告警 |
| 交付打包 | `publish --sample` 到临时目录 | mp4 + srt + 海报 + 说明齐；说明里逐条列出未通过项 |

**QA 在 `_smoke` 上判 FAIL（6 项亮度/饱和偏差，最大 −7.8）**，原因不是脚本算错：
喂进去的 9 张底图**本身就是 026 已经做过后期处理过的成品图**，二次后期把
饱和增益顶到上限 1.85 也补不回来。这说明两个明确结论：

1. 后期只对**模型新出的原图**负责；拿成品图回炉，数值必然到不了目标；
2. 后期参数顶到上限时，`qa` 报偏差是对的 —— 该回 `stills` 改色板重出，而不是松容差。

所以容差保持严格（亮度/饱和 ±3、时长 ±2 帧、响度 ±1 LU）。要验证脚本本身，
请用**原始底图**重跑一次；用 026 的成品图跑，只能验证「链路通不通」。

## 什么时候不该用它

- 人物正脸近景、手指动作、精确表演时序 → `laolang` 或 `pingban`；
- 要严格可复现的矢量画面 → `dengju` / `xianshiqi` / `xiangsu`；
- 显卡小于 12 GB，或 ComfyUI 起不来 → 这条线跑不动，别硬上。

## 权重与片源

6 个模型文件（约 21 GB）与原片抽帧（约 130 张）**都不入库**，
路径写在 `pipeline.json → paths` / `models`，`doctor` 会逐项校验。
模型许可与商用条款见 [CREDITS.md](CREDITS.md)。
