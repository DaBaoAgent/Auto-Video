# laolang · 口播同步与分镜节奏（2026-11-10 起强制）

> 本文件解决两件事：**字幕和口播对不上**、**分镜没有跟口播稿走**。
> 从 2026-11-10 起，新片一律按这里的规则做；玄奘 60 秒样片是此前的冻结版，不作为节奏模板。

## 1. 为什么会错

`make_vo.py` 用「静音候选 + 字数/时长一致」的 DP 对齐，得到的是**估计时间**。而画面里的字幕由
`EV.captionSegments(window.TIMELINE, max)` 从 `lines[].words[]` 的**词级时间**生成——只要估计时间偏了一点，
整段字幕就会跟着漂。把字幕改成按字数均分只会更错。

正确做法：**用真实口播的 ASR 词时间把时间轴校准一遍**，再让字幕、分镜、音效全部挂在这套时间上。

## 2. 硬规则

1. **分镜 2.0–4.0 秒一个**（30 fps 容差 1 帧）。不许出现 0.8 秒的闪镜，也不许 5–6 秒一个镜头。
2. **切点只落在口播边界**：句首 / 词首（±0.35 s），或两个词之间 ≥ 0.12 s 的停顿里。
3. **字幕只能从时间轴词级时间生成**，使用 `EV.captionSegments`，单行 ≤ 18 字；禁止按字数均分、禁止手写时间。
4. **每条字幕的起点**必须落在某个词的首字上（容差 0.30 s）。
5. **成片音轨与旁白**包络互相关滞后 ≤ 40 ms；逐句起点**中位偏差 ≤ 0.30 s，且超差句数 ≤ 20%**。
6. 屏幕文字仍只允许来自 `brief.md` 的表，不因分镜重切而增加。

## 3. 标准流程

### 3.1 先出初步时间轴

```bash
python scripts/laolang.py vo projects/<工程> --src 配音.wav --text 口播稿.txt --lead 0
```

`vo` 之后先跑一次 `--captions` 看字幕是否明显漂移：

```bash
node runtime/render.mjs projects/<工程> --captions
```

漂移 > 0.3 s，或者台词和字幕不共时，进入 3.2。

### 3.2 ASR 真实时间

长音频一次转写容易在段落间漂；按 2–4 分钟分段，分界点放在句间停顿上，再拼起来。

```bash
# 全片第一段（绝对时间 0 起）
python scripts/laolang.py asr projects/<工程>/audio/narration.wav --out projects/<工程>/review/asr_a.json --start 0 --dur 180 --model small

# 后续段：--start 是绝对时间，asr_probe 会把该偏移加回每个词
python scripts/laolang.py asr projects/<工程>/audio/narration.wav --out projects/<工程>/review/asr_b.json --start 180 --dur 180 --model small
python scripts/laolang.py asr projects/<工程>/audio/narration.wav --out projects/<工程>/review/asr_c.json --start 360 --model small
```

`--model small` 是默认值；`medium` 更准但慢很多，一般不需要。

### 3.3 用 ASR 重建时间轴

```bash
python scripts/laolang.py rebuild projects/<工程> \
  --asr review/asr_a.json review/asr_b.json review/asr_c.json \
  --full-before 180 --b-before 360 \
  [--sample-end 20.12]
```

- `--full-before` / `--b-before` 是相邻 ASR 文件的分界秒数，必须与 3.2 的 `--start` 对应。
- 只有做样片时给 `--sample-end`；给了才会导出 `sample_timeline.js`，`sample.html` 读的是它。
- 脚本用现有 `timeline.js` 的句子切分 + difflib 字符级锚点；ASR 同音字当作未匹配，用相邻锚点插值。
- 匹配率会打印出来；低于 85% 说明 ASR 和稿子不是同一段，先查音频/稿子，不要硬写。

### 3.4 按口播重切分镜

先拿字幕时间当切点候选（字幕起点就是词首时间）：

```bash
node runtime/render.mjs projects/<工程> --html sample.html --captions
```

规则：

- 每 2–4 秒安排一镜；一个长句可以拆成 2–3 镜，短句可以和相邻短句合到一镜。
- 切点优先取字幕段的起点；同一句内也可以切在词首或 ≥0.12 s 的停顿里。
- 不要为了凑时长切在字中间；不要在词说到一半时换镜。
- 每镜仍要有自己的运镜，镜头表同步写进 `storyboard.md`。

页面里写成：

```js
G.shot(0, 2.98, (u, t) => { ... });
G.shot(2.98, 5.82, (u, t) => { ... });
```

### 3.5 校验

```bash
# 只看分镜（快）
python scripts/laolang.py shots projects/<工程>/sample.html

# 分镜 + 成片真实切点
python scripts/laolang.py shots projects/<工程>/sample.html --video projects/<工程>/out/video-16x9.mp4

# 全部：分镜 + 字幕 + 音频滞后 + 成片 ASR
python scripts/laolang.py sync projects/<工程> --html sample.html --video projects/<工程>/out/video-16x9.mp4

# 再加烧录字幕 OCR（Dabao-OCR，需 127.0.0.1:18224 在线）
python scripts/laolang.py sync projects/<工程> --html sample.html --video projects/<工程>/out/video-16x9.mp4 --ocr
```

完整 `sync` 写 `projects/<工程>/review/sync_qa.json`；单独跑 `shots` / `captions` / `audio` / `ocr`
写 `review/sync_qa_<cmd>.json`，不会覆盖完整报告。退出码 0 = PASS，1 = 有不合格项。
还没做样片的工程没有 `sample.html`：把 `index.html` 传给 `shots` / `sync`（`--html index.html`），
或者不传 `--html`，脚本会按 `sample.html` → `index.html` 的顺序自动找。

各部分查什么：

| 部分 | 检查 |
|---|---|
| shots | 每镜 2–4 s；首尾相接；切点在句首/词首/停顿；末镜不超时间轴 |
| cuts | ffmpeg 场景检测到的真实切点 vs 声明切点（启发式，只报警告） |
| captions | `--captions` 的每条字幕：文字属于时间轴原文、起点落在词首 |
| audio | 成片音轨 vs 旁白包络滞后（≤40 ms）；faster-whisper 重转写；逐句起点中位 ≤0.30 s 且超差句数 ≤20% |
| ocr | 成片字幕逐段抽帧（y≈930–1080）→ Dabao-OCR → 与字幕文本比对 |

## 4. 判读标准（022 样片实测）

`项目：projects/022_澳洲土著/sample.html`，20.12 秒：

| 项 | 结果 |
|---|---|
| 分镜 | 7 个，2.02–3.78 s（平均 2.87），切点全部在词首或句间停顿 |
| 字幕 | 11 条，起点全部落在词首；OCR 11/11 与画面一致 |
| 音频滞后 | 0.0 ms，包络相关 r = 0.9992 |
| 成片 ASR | 逐句起点中位偏 0.033 s / 最大 0.200 s / 超差 0 句；文本相似度 74.5% |

**文本相似度 65–80% 是正常的**：small 模型会把「驴友→旅游、巷→相、九十→90」听成同音字。同步看的是
**句起点**和**音频滞后**，不是转写准确率；低于 65% 才怀疑音轨放错。

场景检测可能把片尾圈出（iris）识别成“未声明的切点”，这是正常的；声明的切点应全部检出。

## 5. 常见坑

- **PyAV 打不开 wav**（`metadata_errors`）：本机 faster-whisper 必须用 ffmpeg 解码成 ndarray 再喂，
  `asr_probe.py` 与 `sync_qa.py` 已经这样做了；不要改回直接传文件路径。
- **采样率**：`vo` 的旁白常是 44.1 kHz / 48 kHz。算包络前一律 ffmpeg 重采到 16 kHz 单声道，否则会出现
  假的数百毫秒滞后。
- **Dabao-OCR 路径**：HTTP 服务只认 Windows 绝对路径（`D:\...`），不要传 Git-Bash 的 `/tmp/...`。
- **分界点**：多段 ASR 的 `--start`、`--dur` 与 `rebuild` 的 `--full-before` / `--b-before` 必须一致；
  不一致会把两段之间的词插错位置。
- **字幕尾巴**：`captionSegments` 有 0.25 s 尾巴，最后一条可能超出片长 0.2 s，被片尾裁掉，属正常。
- **样片 vs 全片**：`sample.html` 读 `sample_timeline.js`（20.12 s），`index.html` 读 `timeline.js`
  （全片 537 s）。校验时 `sync_qa.py` 从页面的 `<script src>` 自动判断，不要手工指错。
- **别按字数均分**：这是本次问题的根因，任何“总时长 ÷ 字数”的算法都会让字幕和口播错位。

## 6. 什么时候必须跑

- `vo` 之后、改口播稿之后；
- 每次重切分镜之后（`shots`）；
- 每次最终渲染之后（`sync --ocr`）；
- 交付前把 `review/sync_qa.json` 的 `ok: true` 作为验收项之一。
