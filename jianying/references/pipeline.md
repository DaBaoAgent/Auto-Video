# 七阶段流水线

每个阶段都只读 `projects/<slug>/film.json` 和上一阶段的产物。不存在「脚本里改一行」
才能跑的情况——所有可变项都在 film.json。

产物布局：

```
projects/<slug>/
├── film.json              选题清单（唯一数据源）
├── 口播稿.txt              一行一镜，句末带标点
├── narration/             S1：01.wav…narration.wav/mp3/narration.json
├── data/shots.json        S2：分镜表（Remotion 直接 import）
├── audio/                 S4：sfx-bed.wav → final-audio.wav/json
├── work/                  S3/S5：Remotion 工程（template 的副本）
└── out/                   S5/S7：<标题>.mp4 + 字幕.srt
```

---

## S1 配音（`tts`）

**输入** 口播稿。**输出** `narration/narration.json`，每行 `text / spoken / start / end / duration / chars_per_sec`。

```bash
python scripts/jianying_shotcraft.py tts --project <slug>
```

逐行 POST 到 `127.0.0.1:9880/tts`，每行独立缓存 `narration/narration-lines/NN.wav`，
改稿只重配变动的行（加 `--force` 才全部重来）。

处理链：去首尾静音 → 压缩内部停顿（`trim_and_tighten`）→ 按 `gap_ms` 拼接 →
峰值归一到 0.89 → 出 wav + mp3。

**判据**：`chars_per_sec ≤ max_cps（默认 6.4）`。超了判定截断，自动重配，连续 3 次
不合格就停下报错——这时要改稿（缩短句子），不是调参。

**失败处理**：
- `GPT-SoVITS 服务未就绪` → 先起 `D:\GPT-SoVITS\api_v2.py`。
- 某行一直截断 → 该行太长，拆成两句（拆完 film.json 的 shots 也要同步加一镜）。
- 音色不对 → 改 `modules/narration/preset.json`（采样参数锁在 `synthesis` 段），
  不要改脚本。

---

## S1.5 对齐（`align`）—— 配音不是逐行生成时必跑

```bash
python scripts/jianying_shotcraft.py align --project myfilm --src "出稿/004_xxx"
```

输入：`<src>/配音.json`（段落级 chunks：`text` / `start` / `duration` / `file`）
+ `<src>/narration-chunks/*.wav`

做法：**不重新配音**，从音频里测从句边界。

1. 每个段落块单独测语音段（20 ms 帧 RMS，阈值 = 峰值 −28 dB，最短 60 ms，
   段间 < 60 ms 的缝隙合并）
2. 段落文本按标点切成从句
3. 「语音段数 == 从句数」→ 一一对应（最准的情况，E3 第一段 6 对 6 完全吻合）
4. 不相等 → 按字数比例落到段落内，再吸附到最近的语音段起点
5. 超过 `--max-chars`（默认 14）的从句拆条，在该从句时长内按字数分配

产出：`narration/narration.json`（`audio` / `duration` / `chunks[{text,start,end}]`，
与刘秀那集同构）+ `data/captions.json`（字幕条）。

**不要用字数比例外推时码**——E3 一开始就是这么做的，整条字幕轨整体错位，
而且会让人误以为是「字幕显示慢半拍」。

## S2 分镜（`shots`）

**输入** `narration.json` + `film.json` 的 shots。**输出** `data/shots.json`。

```bash
python scripts/jianying_shotcraft.py shots --project <slug>
```

镜界算法：

```
默认界 = 下一行起点
允许区间 = [本行 end + 0.06, 下一行 start − 0.06]
实际界 = clamp(默认界, 区间)
```

超出 `max_shot`（3.0s）时把出点提前到本行静音窗最早处；仍越界就告警。
帧号取整后**再做一次连续性校正**：前一镜的 `frames = 后一镜 from − 前一镜 from`，
末镜补到总帧数。不做这一步，整片会累积半帧错位。

**判据**：每镜 2.0–3.0s；行数 == 镜数。

**失败处理**：
- `行数 vs 镜数不一致` → 改稿或改 shots，一行一镜是硬约定。
- 某镜 1.8s / 3.2s → 改这一句的字数（中文语速约 5.3 字/秒，2–3 秒 = 11–16 字）。
  不要为了凑时长把镜界挪到语音中间。

---

**时码铺排的硬规则**：每镜的 `from` 取该组首句的开口帧，`frames` 取
「下一镜 from − 本镜 from」，最后一镜止于总帧数。句间静音并入前一镜，
**不留空隙**。按句累加会丢掉静音（E3 曾短 96 帧 / 3.2 秒，越到后面偏得越多）。

## S3 画面（`render` 的静帧子步）

**输入** `data/shots.json`。**输出** 静帧 PNG。

先静帧，别整片：

```bash
cd projects/<slug>/work
npx remotion still src/index.ts Film out/qa/f-420.png --frame=420 \
  --browser-executable="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

取帧位置：每镜中点（`from + frames/2`）看构图，每镜末帧（`from + frames - 2`）看收束。
末帧最容易暴露问题：元素出画、字幕压画面、光效没落定。

**改镜头时的红线**见各 `cards/*.md` 的「已知坑」。

---

## S4 音轨（`audio`，旧路径 `sfx` → `mix`）

**audio（推荐）**：`scripts/make_audio.py` 一步做完音效床 + 混音 + BGM 闪避。

```bash
python scripts/jianying_shotcraft.py audio --project myfilm
```

- 28 个程序化音色（numpy + 标准库 `wave`，**不依赖 scipy/soundfile**）
- 按 `data/audio-plan.json` 的关键镜表选点；缺省自动推导
- `--mode key`（默认，只在关键镜挂，每镜 2 点上限）/ `--mode shot`（每镜 2 点）
- BGM：循环补齐 → 首尾 1.6 s 淡化 → 底值 −8.5 dB，人声触发再压 4.4 dB

参数与音色表见 `sound-design.md`。

**sfx + mix（旧路径）**：

**sfx**：按 `film.json` 每镜的 `sfx` 数组在时间线上铺音效，程序化合成（numpy + scipy），
固定 seed，无版权素材依赖。密度原则：**只给 6–7 个镜头配，不是每镜都响**。

**mix**：

1. 旁白 + SFX（`sfx_gain_db` 默认 -4）相加；
2. 迭代增益对齐 `target_lufs`（-16.3），每次用 ffmpeg ebur128 实测后回调；
3. 二分拟合限幅上限，把真峰值钉到 `target_peak`（-1.1）；
4. 写**双声道母版**（两声道同一信号、单位增益）。

**为什么必须自己写双声道**：ffmpeg 从 mono 升 stereo 会按 1/√2 衰减每声道，
而同相双声道测响度时又把这 3 dB 加回来 → 响度不变、真峰值凭空少 3 dB，
直接掉出 `-3.0 ~ -0.3` 门禁。

**为什么响度和峰值会打架**：软限幅压太狠，PLR 只剩 12.9，响度达标时峰值也偏低。
所以先定响度，再拟合限幅上限，两个门禁才同时成立。

---

## S5 合成（`render` → `mux`）

`render` 把 `data/shots.json` 与 `narration.mp3` 复制进工程，跑
`npx remotion render src/index.ts Film out/<slug>.mp4`。

`mux` 用 `-c:v copy` 直接封装终混音频（AAC 192k / 48kHz / 双声道），
音频侧加 `aresample=resampler=soxr:precision=28,apad` 再 `-shortest`——
不加 `apad` 会因音频短 0.05s 把 940 帧削成 936 帧。

**判据**：`帧数 = round(duration × fps)`，且容器时长误差 < 0.1s。

---

## S6 质检（`qa`）

五项：规格（编码/分辨率/帧率/时长/帧数/音频/采样率/声道）、全片解码、无黑帧、
积分响度、真峰值。

```bash
python scripts/jianying_shotcraft.py qa --project <slug>
```

阈值来自 `film.json` 的 `rules`：`lufs_range [-17.5, -15.0]`、
`true_peak_range [-3.0, -0.3]`。

---

## S7 交付

- 成片 `out/<标题>.mp4`；
- 字幕 `out/字幕.srt`（≤16 字/条，本管线按字符数分配时长，不逐字对齐）；
- 抽 10–14 帧看一遍：字幕与画面有没有重叠、红底镜字幕是否读得出来、
  镜界处有没有跳变。

抽帧联系表（Windows 下 ffmpeg 的 `tile` 滤镜在中文路径上不稳，用 PIL 拼）：

```python
from PIL import Image
# 每行 3 张，宽 620，按帧号标注
```
