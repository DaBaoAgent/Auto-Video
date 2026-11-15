---
name: tianshu
description: 用「本地大模型出图 + 本地大模型出视频」做 4:3 上美影《天书奇谭》一路的手绘赛璐璐成片。口播稿 + 配音进，逐镜出定帧（Qwen-Image 2.1，本地 ComfyUI）→ 统一后期逐镜锚定原片亮度/饱和 → Wan2.2 TI2V-5B 只出氛围动态 → 逐帧色彩锚定 → 后期 2D 运镜 → 拼接/合成/质检/交付。当用户说「用 tianshu 出一版」「照镇魔塔那条线再来一支」「本地生图生视频出片」时使用。
---

# tianshu：本地大模型赛璐璐管线

画面不是代码画的，是**本机两张模型出的**：Qwen-Image 2.1 Q4 出定帧，Wan2.2 TI2V-5B Q4
出氛围动态。两条都跑在本机 ComfyUI 里，**不碰任何云端 API**，一次出片 0 元，
代价是显存（12 GB 起）和算力时间（定帧 80 s/张、视频 275 s/条）。

代码只负责三件事：**把风格钉住**（提示词骨架 + 逐镜对位取色）、
**把数值钉住**（统一后期、色彩锚定、响度），**把相机拿回来**（运镜在后期做）。
凡是能让模型自由发挥的地方，最后都会漂。

首个实例：`projects/026_zhenmota/`（026《镇魔塔》前 10 镜里的 6 镜，真实 prompt / 运镜 / 取色目标）。

## 和别的管线的分工

| | 画面从哪来 | 确定性 | 适合 |
|---|---|---|---|
| `laolang` | 代码画的矢量赛璐璐 | 完全确定 | 人物动作多、要精确口型与表演 |
| `tianshu` | 本机大模型出图出视频 | 参数确定、画面非确定 | 山水/建筑/氛围/志怪场景，人物只要剪影或背影 |

人物正脸近景、手指动作、精确动作时序 → 仍走 `laolang`。
`tianshu` 的强项是**景**：塔、湖、雾、石阶、铁函、殿宇、山林。

## 三个阶段可以分开重跑

| 想要什么 | 重跑哪些 | 不会动到 |
|---|---|---|
| 换一版画面 | `stills` → `post` →（`i2v`）→ `anchor` → `cam` → `concat` → `mux` | 分镜、字幕、配音 |
| 只改运镜 | `cam` → `concat` → `mux`（**不用重跑视频**） | 底图、I2V、分镜 |
| 只改色调 | `post` →（`i2v` 要重跑才跟得上）→ `anchor` → `cam` | 分镜、运镜参数 |
| 只改文案 | `beats` → `plan` → `scaffold`（时码变了再跑 `cam`） | 已出的底图 |

运镜放在后期就是为了这一条：**改相机不该重烧 GPU**。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `source/配音.wav` | 是 | 任意采样率，脚本内部统一转 16k 单声道测包 |
| `source/口播稿_定稿.txt` | 是 | 一行一段；句子按 `。！？` 切 |
| `work/shots.json` | 是 | **唯一画面来源**：每镜 subject / scene / motion / palette / move / target_val / target_sat |
| `work/refstats.json` | 否 | 跑 `refstats` 得到；给 `shots.json` 填 `ref` 就能自动带出色板与目标 |
| 原片对位帧 | 否 | 默认 `pipeline.json → paths.film_frames`（`参考帧_init` 按镜头取名，`参考帧_pd` 是纹理帧库） |
| ComfyUI + 4 个模型 | 是 | 见下节；`tianshu.py doctor` 一次点清 |

`shots.json` 里 `ref` 可以是 `c15` 这样的对位帧名，也可以是 `ref_image`（同场已过审底图）。
**纯文字镜（既没 ref 也没 ref_image）只能出 1024×1024 方图** —— Qwen 的 latent 尺寸来自
第一张参考图，没图就退回 `resolution` 的正方形。要 4:3 就必须给一张参考图。

## 环境

| 项 | 要求 |
|---|---|
| ComfyUI | 本机 `http://127.0.0.1:8188`；`doctor` 会探一次 |
| 出图模型 | `qwen-image-2.1-Q4_K_M.gguf` + `qwen3vl_8b_w4a8.safetensors` + `qwen_image_2.1_vae_bf16.safetensors` |
| 出视频模型 | `Wan2.2-TI2V-5B-Q4_K_M.gguf` + `umt5_xxl_fp8_e4m3fn_scaled.safetensors` + `wan2.2_vae.safetensors` |
| Python | 需要 numpy + Pillow；`tianshu.py` 会按 `paths.python_candidates` 自动换到能跑的解释器 |
| ffmpeg | 在 PATH；后期/锚定/拼接/合流全靠它 |

模型路径在 `pipeline.json → paths`，可用 `TIANSHU_COMFY_ROOT` / `TIANSHU_COMFY_SERVER` 覆盖。

## 生产链

```
配音.wav + 口播稿 ─beats─> work/narration_beats.json（20ms RMS 包 + 字数比例 + 吸附真静音）
                ─plan──> work/shot_plan.json（语义切分，单镜 3–6s）+ out/<名>.srt
                ─scaffold> work/shots.json 补齐 + jobs_stills/post/i2v/cam 四张作业单
jobs_stills ─stills─> plates/     Qwen-Image 2.1 Q4， 1024×768， 25 步， cfg 1.5， shift 3.1
             ─post──> post/       逐镜亮度/饱和锚定 + 原片颗粒纸纹
             ─i2v───> i2v/        Wan2.2 TI2V-5B Q4， 960×720， 121 帧， 20 步， cfg 5.0， shift 8
             ─anchor> anchored/   逐帧向 post 底图拉 85%（参照底图，不是首帧）
             ─cam───> cam/        后期 2D 运镜：推/拉/横移/升降/跟拍/漂移
             ─concat> out/<名>_video.mp4（流拷贝 + 时长对账 + 黑帧检测）
             ─mux───> out/<名>.mp4（配音 + 两遍 loudnorm）
             ─qa────> out/qa.json（逐镜数字对账 + 响度实测）
             ─sheet─> out/<名>_sheet.jpg（审片联系表）
             ─publish> 出稿/<编号>_<选题>/（mp4 + srt + 海报 + 说明）
```

命令（`python` 会被自动替换成带 numpy 的解释器）：

```powershell
python tianshu/scripts/tianshu.py doctor
python tianshu/scripts/tianshu.py new zhenmota --episode 026 --title 镇魔塔 --src "D:/.../026_镇魔塔_水墨S级"
python tianshu/scripts/tianshu.py refstats zhenmota        # 原片抽帧 -> 逐帧色板/基线
python tianshu/scripts/tianshu.py beats zhenmota
python tianshu/scripts/tianshu.py plan zhenmota
python tianshu/scripts/tianshu.py scaffold zhenmota        # -> shots.json + 四张作业单
python tianshu/scripts/tianshu.py stills zhenmota --only S001,S002
python tianshu/scripts/tianshu.py post zhenmota
python tianshu/scripts/tianshu.py i2v zhenmota --tier big
python tianshu/scripts/tianshu.py anchor zhenmota
python tianshu/scripts/tianshu.py cam zhenmota
python tianshu/scripts/tianshu.py concat zhenmota
python tianshu/scripts/tianshu.py mux zhenmota
python tianshu/scripts/tianshu.py qa zhenmota
python tianshu/scripts/tianshu.py publish zhenmota --sample
# 或整条链：
python tianshu/scripts/tianshu.py all zhenmota --skip i2v
```

每个阶段都支持 `--only S001,S002`；`stills`/`i2v` 支持 `--dry-run`（只落工作流 JSON，不提交 GPU）；
`i2v` 支持 `--tier big`（大横移/长镜用 1152×864，后期才有裁切余量）。

## 定版参数

参数只有一处来源：`pipeline.json`。脚本里不散写数字。

| 环节 | 定版值 | 为什么 |
|---|---|---|
| 定帧 | 1024×768 · euler/simple · 25 步 · **cfg 1.5** · shift 3.1 · resolution 0 | cfg 1.0 时 guidance-distilled 跳过负词分支，参考图的雾与锯齿石柱会被照抄 |
| 后期 | LVL 0.94 · 对比 0.94 · 黑位 `x0.94+7` · 饱和增益 0.75–1.85 · gamma 0.55–1.85 · 颗粒 2.4 · 纸纹 0.8 | 亮度留 6% 余量防过曝；饱和锚定放处理链最后 |
| 出视频 | 960×720（std）/ 1152×864（big）· 121 帧 · 24 fps · 20 步 · cfg 5.0 · uni_pc/simple · shift 8 | 相机不动，动态只给氛围；母版大 20% 给裁切 |
| 色彩锚定 | 向 post 底图拉 **0.85** | 5 秒内亮度爬升/饱和衰减；拿片段首帧当参照会把偏色锁死 |
| 运镜 | cosine 缓动 · 横移 0.14 · 升降 0.08 · 推拉 0.08 · 跟拍 0.10/0.045 · 漂移 0.03 | 两端速度为零 → 切点不顿；采样窗越界直接报错 |
| 音频 | −14 LUFS · TP −1.5 · AAC 回削 0.2 dB · 48 kHz | 两遍 loudnorm，单遍动态会压平呼吸感 |

## 逐镜对位取色（这条线的风格地基）

风格在数值上只有两件事：亮度/饱和落在哪个区间，色板是哪几个 hex。
凭眼睛抄色板是猜，实测出来的可复现、可复核。三条硬规则：

1. **统计前裁掉底部字幕带**（默认 18%）：烧入字幕接近纯黑，会把色板暗端整体带偏；
2. **不要用缩略图算基线**：240×135 的 JPEG 会把饱和、亮度、梯度全带偏。
   `refstats` 同时给「原尺寸」和「1024×768」两列，**跨镜头只比同尺寸那一列**；
3. **角色固有色不从全片统计里取**：全片大部分是雾和夜，统计会把一身洋红袍压成灰。
   用 `--character <单张平背景设定图>` 单独量。

`shots.json` 里写了 `ref` 就跑 `refstats` 后重跑 `scaffold`，色板自动进提示词、目标自动进后期。
026 的实测基线（852×480 真实帧 80 张）：亮度中位 36.65 / 饱和中位 25.78 / 高饱和 11.46。

## 已知坑（都是付过代价的，14 条）

1. **cfg 不能落回 1.0** —— 负词整条分支被跳过，雾、锯齿、多塔全回来。
2. **参考图只给一张** —— 两张图色板打架，出来是拼贴感。
3. **有手的镜头不要进 I2V** —— 5 秒内手指必然崩；这类镜头用静帧 + 后期推镜。
4. **不要让模型运镜** —— 5B 不会运镜，要求它运只会毁掉这一镜；提示词尾巴永远
   `The camera holds perfectly still.`。
5. **不要自动天际线视差** —— 实测会把塔的轮廓当天空边界，把塔切成两半。
   要视差就手绘深度图。
6. **长镜不能补帧** —— I2V 只有 121 帧（5.04 s），长镜靠 `cam` 把氛围层重定时放慢，
   补帧会出鬼影。
7. **纯文字镜出方图** —— 见输入契约；要 4:3 必须给参考图。
8. **锚定参照底图不是首帧** —— 模型常回偏冷偏绿的头帧，拿它当参照等于锁死偏色。
9. **纹理层必须是原片残差** —— 随机噪声一发就塑料；`post` 从 852×480 原片帧提高频/低频。
10. **饱和锚定必须在最后** —— 放中间会被后面的对比/黑位改掉，target_sat 就不是最终值。
11. **cfg/步数的改动要整片一起改** —— 单镜改参数会和邻居跳色，改完必须重跑 `post` 之后全链。
12. **模型权重一律不入库** —— 12 GB 权重在 `pipeline.json → models` 里写文件名，`doctor` 校验存在性。
13. **后期有上限，压不上去就回提示词改，不要硬拉参数** —— 饱和增益夹在 0.75–1.85、gamma 夹在
    0.55–1.85，触顶后 `qa` 一定报「饱和差 −3」这类偏差。此时改后期参数只会把别的镜带崩，
    正确做法是回 `stills`：把该镜色板换成更饱和的 hex 重出，或者换一张参考图。
14. **响度必须闭环** —— 拿整条配音的 loudnorm 实测值去归一前 56 秒，会整体欠 2 LU；
    `audio_mux` 现在只在成片实际用到的那一段上量，编完再量成片、差多少补多少（最多 3 轮）。
    单靠 `loudnorm linear=true` 压不动高波峰因子的口播，实测只到 −15.9。
15. **12 GB 卡跑 121 帧会把显存挤满** —— 2026-11-15 本机（4070 SUPER 12 GB）实测：
    960×720/121 帧吃满 11.5/12.3 GB，GPU 100% 但功耗只有 66 W，`176 s/步`，单条一条 5 秒片段
    **约 39 分钟**（026 记录里的 275 s 是显存更宽裕的机器）。显存不够时把单镜 `length` 降到
    81（3.4 s，注意力成本约降一半以上），长镜交给 `cam` 重定时放慢；不要靠降步数提速，
    步数一改就和邻居跳质。

## 验收条件

`qa` 会逐项打表，`verdict != PASS` 不许交付：

- 逐镜：时长与分镜差 ≤ 2 帧；post 底图亮度落在 `target*0.94 ±3`、饱和落在 `target ±3`；
- 拼接：黑帧 0 段；缺镜为 0（缺了就 `concat` 退出码 2）；
- 成片：−14 LUFS ±1 LU，尺寸 960×720@24 fps，时长与配音对齐；
- 联系表：每格有画面、有镜头号与时长 —— 缺图一眼能看出来。

## 交付

```
出稿/<编号>_<选题>/
├── <编号>_<选题>_tianshu成片.mp4      # 成片
├── <编号>_<选题>_tianshu42秒.mp4      # 样片（--sample）
├── 同名.srt / 同名.jpg / 同名_说明.md
```

`_说明.md` 写死这次用的全部定版参数与 QA 结论，含未通过项 —— 不装作没发生。

## 示范工程

`projects/026_zhenmota/`：6 镜，全部取自 026 前 10 镜的真实运行记录
（画面 prompt 来自 `i2v_jobs_01_10_v2.json`，运镜与时长来自 `cam_jobs_01_10.json`，
取色目标来自 `jobs_post_01_10.json`）。`work/jobs_*.json` 已生成好，可直接：
`post → i2v --only S001 → anchor → cam → concat → mux → qa`。
它的 6 镜里 S004 是 2.22 s 的短镜 —— 那是原片真实节奏，不是 bug。
