# zhidiao 管线详细参数（定稿）

## 0. 目录契约

```
films/<项目名>/
├── lib/common.css        # 共享样式（@font-face 指 ../vendor/fonts/、.scene/.sky/.stage/.anno/.dark/.cap 等）
├── lib/fx.js             # window.PCFX = { sparks, sparkTweens, shake, cross }（SVG 必须用 createElementNS）
├── vendor/gsap.min.js    # GSAP 3.15.0
├── vendor/fonts/         # 内嵌字体
├── ch01|pXX/index.html   # 组装产物 composition（composition-id 唯一）
└── parts-src/pXX-scenes.html   # fragment 源
output/<项目名>/parts/
├── make_audio.py         # 配音管线（内含 PARTS 口播文本字典）
├── assemble.py           # 组装器
└── pXX/manifest.json     # {"part","duration","scenes":[{"text","start"}],"captions":[{"text","start","end"}]}
renders/                  # 渲染成品 pXX.mp4
```

## 1. 配音对齐（scripts/zhidiao_make_audio.py）

- TTS（本机入口，2026-10-22 适配）：`vendor/gpt-sovits/.venv/Scripts/python.exe tools/dabao_batch_tts.py --text-file X --out Y`
  服务为 `vendor/gpt-sovits/tts_server.py`（`127.0.0.1:9880`），采样参数锁定在 `LOCKED`，长句按 `--max-chars 78` 切分；不再需要 `--config`。
- **坑（另一台电脑的旧入口）**：那只 TTS 脚本的 preset `max_chars_per_second: 6.2` 会在 6.23 字/秒时误判截断并 SystemExit，需要复制 preset 改 7.0 并加 `--config`。本机入口无此阈值，此坑不适用。
- 转写：faster-whisper small / int8 / cpu，词级时间戳；需环境变量 `HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1`
- 对齐：pypinyin 拼音 DP 把原文对齐到 ASR 词级时间戳 → 幕边界 + 字幕时间。模型输出有同音错字，DP 对齐可容忍
- 每部约 40 秒产出；口播文本按幕分段写入 PARTS 字典，**每段对应一个场景**

## 2. fragment 编写规约

每部一个 `parts-src/pXX-scenes.html`：

- 若干 `<section id="sN" class="scene">`（N 从 1 连续）+ 尾部一个 `<script>`
- script 内设置：`window.PART_TITLE`、`window.PART_CHAPTER`、`window.PART_TOP`（逐幕顶栏色数组，长度=幕数）、`window.PART_TAG`（右上角章标签色）、`window.PART_TIMELINE = function(tl, T, DUR)`（T=各幕起点数组）
- 内部用 `cam(tl, sel, i, moves)` helper 做推拉交替运镜：`moves = [[scale, x, y, durFrac, ease], ...]`；**HTML 舞台容器**（`#sN-stage`）的 cam 用绝对值没问题，SVG 内部元素不行
- 幕内节奏 3–5 秒一个分镜；人物/器物必须有大幅动画（呼吸、摆动、位移）
- `<div class="anno">` 场景标签；暗色天空场景用 `.anno.dark` 浅色文字

### GSAP 铁律（实测 4 组对照用例确认）

SVG 元素带 `transform="translate(x,y)"` 属性时：

| 写法 | 结果 |
|---|---|
| `fromTo({y:30},{y:0})` | **基位被摧毁**，元素瞬移到画面顶部 ❌ |
| `fromTo({y:0},{y:-8,yoyo})` | 围绕 0 振荡，基位丢失 ❌ |
| `to({y:"-=6"})` | 基位保留 ✓ |
| `fromTo({y:"+=40"},{y:"-=40"})` | 相对值，基位保留 ✓ |

结论：对 SVG 元素，任何 x/y 都用相对值；群体选择器 `#id > g` 的子元素同样带 translate，一并遵守。运镜 scale ≥ 1.0 防露边（露边公式 |x| ≤ 960(s−1)）。

## 2.5 分镜素材（可选 · Agnes）

分镜静帧与「首帧图生视频」由 `tools/zhidiao/agnes_shots.py` 生成。Agnes 当前限时免费
（图 1K–4K、视频 720P 4–12 秒），配置在项目根 `.env`：
`AGNES_BASE_URL / AGNES_IMAGE_MODEL / AGNES_VIDEO_MODEL / AGNES_API_KEY`。

### 输入 `content/<slug>/shots.json`

```json
{
  "style": "纸雕剪影风格，层叠纸质山峦，暖金色调，纸张纹理与投影",
  "defaults": {
    "image": {"size": "2K", "ratio": "16:9"},
    "video": {"seconds": "5", "size": "720P", "aspect_ratio": "16:9"}
  },
  "shots": [
    {"id": "s001", "prompt": "洪水退去的黄河泥滩，远处群山，一束晨光"},
    {"id": "s002", "prompt": "首领站在泥脊上", "video": true,
     "reference": ["content/<slug>/shots/refs/角色定妆图.png"],
     "video_prompt": "镜头缓慢推近，风吹动衣摆，画面连贯"}
  ]
}
```

- `style` 会拼在每个 prompt 前面；`--no-style` 关闭。
- `reference`（或 `ref_images`）是参考图列表，可为本地路径（相对项目根）、公网 URL 或 base64；
  有值时按 img2img 生图，用于锁定角色定妆、画风与配色；`--no-reference` 可临时关闭。
  视频首帧仍取生成图的公网 URL，因此生图必须保留 `response_format=url`（默认即是）。
- `video: true`（或对象）才生成视频；`--all-videos` 强制全部。
- 图片默认 `2K` + `16:9`（2624×1472）；视频默认 720P（可按镜头/全局覆盖）。

### 命令

```bash
PY="D:/@kaifa/tushuo/vendor/gpt-sovits/.venv/Scripts/python.exe"
"$PY" tools/zhidiao/agnes_shots.py check
"$PY" tools/zhidiao/agnes_shots.py images --slug <slug>          # 生图
"$PY" tools/zhidiao/agnes_shots.py videos --slug <slug>          # 首帧图生视频
"$PY" tools/zhidiao/agnes_shots.py all    --slug <slug>          # 先图后视频
"$PY" tools/zhidiao/agnes_shots.py status --slug <slug>
```

- 输出 `content/<slug>/shots/`，状态写 `assets.json`；已完成自动跳过，`--force` 重出。
- 退出码：`0` 全部完成；`1` 有失败；`2` 视频队列未清空（已记 `queued/pending`，重跑自动续传）。
- 视频排队：`video_queue_full` 按 20s 起、1.6 倍、上限 180s 退避重试，直到 `--max-wait`
  （默认 3600s）。高峰期先跑 `images`，夜里再跑 `videos`。
- 并发：生图默认 2 路（`--jobs N`）；视频严格串行。
- 首帧视频要求源图是公网 URL；脚本会检查 URL，失效则自动重出图片再提交。

### fragment 占位符

```html
<div class="shotslot" data-shot="s001"></div>
<div class="shotslot" data-shot="s002" data-mode="video"></div>
```

- `data-mode`：`auto`（默认，有视频用视频）、`image`、`video`。
- `zhidiao_assemble.py --shot-mode image|video` 会**全局覆盖**占位符的 `data-mode`；
  默认 `auto` 时以占位符为准（渲染视频层不稳定时用 `--shot-mode image` 全局回落）。
- 组装时 `zhidiao_assemble.py` 读 `content/<slug>/shots/assets.json`，把文件复制到
  `films/<slug>/<part>/assets/shots/`，替换成 `.agh-shot` + `.agh-media` 层，并自动注入
  全幅 cover 样式；fragment **不要**手写素材路径。
- 素材层绝对定位铺满 section；需要局部画框时在 fragment 的 `<style>` 里覆盖 `.agh-media`。
- 渲染注意：`<video>` 层带 `muted/playsinline/loop`，不属于字幕层。若 hyperframes 对视频
  逐帧取帧不稳定，改用 `data-mode="image"`，或先抽帧后当图片序列使用。

## 3. 组装（scripts/zhidiao_assemble.py）

- 输入：`parts-src/pXX-scenes.html` + `pXX/manifest.json` → 输出 `films/<项目>/pXX/index.html`
- **尾余量定稿 0.15s**（TTS 首尾实测干净；0.6s 会造成段间停顿拖沓）：`dur = manifest.duration + 0.15`
- 模板自动处理：场景 z-index/初始 opacity、幕间 0.3s 叠化（无黑幕）、顶栏/章标签逐幕换色、字幕循环（nextStart 填充）、调用 `PART_TIMELINE(tl, T, DUR)`
- **组装后必须断言**：`<section>` 数 == manifest scenes 数，且 id 从 s1 连续（不匹配会导致叠化循环把最后场景提前隐藏 → 尾部黑屏）

## 4. 渲染（定稿参数）

```bash
export HYPERFRAMES_BROWSER_PATH="D:/tmp_dl/chrome-win64/chrome.exe"
npx hyperframes render films/<项目>/pXX -o renders/<项目>-pXX.mp4 \
  --quality looks --workers 1 --no-browser-gpu --low-memory-mode
```

- 系统 Chrome（155+）`--version` 会卡死，必须用 Chrome 131（`D:/tmp_dl/chrome-win64/chrome.exe`）
- 速度参考：54 秒成片约 3 分钟；26 部全量约 45–70 分钟
- **npm enoent 偶发故障**：批量渲染中可能 1–2 部随机失败，渲染结束后逐部核对日志，失败的单独补渲即可
- 渲染期间**禁止**改 `lib/common.css`（会造成批次样式混合）；要改先停批量任务

## 5. 质检（三道检查缺一不可）

1. **补间审计**：`scripts/zhidiao_audit_tweens.py` 扫描全部 fragment + ch01，检查 fromTo 显式 x/y 作用于带 translate 属性的 SVG 元素 → 必须为 0
2. **字幕重叠审计**：manifest 相邻 caption `b.start < a.end - 0.01` 即为重叠。修复两级策略：间隔足够 → `min(end, next_start)` 截断；间隔 <0.85s → 相邻两条合并。修复后必须 0 残留
3. **成品抽帧**：`scripts/zhidiao_qa_frames.py` 按 manifest 场景起点 +2s 抽帧目检（入场动画前 0.3–0.5s opacity 接近 0，抽帧要选中段）。**注意**：hyperframes snapshot 快照通道不烧录字幕层，出带字幕静帧必须渲染成品后 ffmpeg 抽帧

### 字幕样式（定稿，`.cap`，改两处：lib/common.css + ch01 式内联副本）

```css
.cap {
  position: absolute; bottom: 0;
  padding: 16px 36px;
  background: none; color: #ffffff; font-weight: 700;
  -webkit-text-stroke: 2px #000000;
  font-family: "Microsoft YaHei","MongolSans",sans-serif;
  font-size: 88px; line-height: 1.22; letter-spacing: .05em;
  white-space: nowrap; opacity: 0;
}
```

顶栏：`图说历史 · 徐艾伦`；字幕块切分 ≤16 字。

## 6. 拼接与压缩交付

```bash
# concat 列表内路径相对于列表文件所在目录解析
{ echo "file '<项目>-ch01-v3.mp4'"; for p in p02 ... p26; do echo "file '<项目>-$p.mp4'"; done; } > renders/concat-list.txt
ffmpeg -y -v error -f concat -safe 0 -i renders/concat-list.txt -c copy renders/<项目>-full.mp4

# 50MB 版（18 分钟 → 总码率约 354kbps：视频 258k + 音频 96k）
ffmpeg -y -v error -i in.mp4 -c:v libx264 -b:v 258k -preset medium -tune animation \
  -pass 1 -passlogfile out/prefix -an -f null NUL
ffmpeg -y -v error -i in.mp4 -c:v libx264 -b:v 258k -preset medium -tune animation \
  -pass 2 -passlogfile out/prefix -c:a aac -b:a 96k -movflags +faststart out-50m.mp4
```

- concat 前核对各部编码一致（h264/yuv420p/30fps + AAC 48kHz 立体声）
- 交付前抽帧（含浅色/深色背景字幕各一）+ volumedetect 音频抽查

## 7. 封面与发布信息（统一交付口径，2026-10-22 同步）

zhidiao 出片后必须补齐封面与发布信息，规则对项目内所有成片一致。基准实例：
`out/2 170万年的中国历史/`（2026-10-22）。

### 7.1 封面

- 模型：`doubao-seedream-5-0-flash-260915`（火山方舟）。用项目内脚本
  `tools/zhidiao/make_covers.py`（纯标准库），配置读项目根 `.env` 的
  `IMG_BASE_URL / IMG_MODEL / IMG_API_KEY`。
- 尺寸固定两张：4:3 = **2048×1536**，3:4 = **1536×2048**（JPG）。
  zhidiao 成片是 1920×1080 横版，但封面尺寸不随成片画幅变。
- **只有一个主标题，恰好 6 个汉字**，金色毛笔行楷，由模型直接画进画面；
  不加副标题、不本地叠字，画面内无其它文字/字母/数字/logo/水印。
- 提示词存 `content/<slug>/covers/prompt-4x3.txt` 与 `prompt-3x4.txt`；
  视觉风格跟随 zhidiao 的纸雕剪影（层叠纸雕山脉、暖金色调、纸张纹理与投影），
  不要改用写实/3D 风格。
- 出图后必须放大标题区逐字核对；错字/多字/少字/缺笔立即重出。
- 生成命令：

  ```bash
  PY="D:/@kaifa/tushuo/vendor/gpt-sovits/.venv/Scripts/python.exe"
  "$PY" tools/zhidiao/make_covers.py --prompt-file content/<slug>/covers/prompt-4x3.txt \
    --size 2048x1536 --out content/<slug>/covers/cover-4x3.jpg
  "$PY" tools/zhidiao/make_covers.py --prompt-file content/<slug>/covers/prompt-3x4.txt \
    --size 1536x2048 --out content/<slug>/covers/cover-3x4.jpg
  ```

  接口可能按返回 URL 存成 `.jpeg`，核对后改回 `.jpg` 即可。

### 7.2 发布信息

`发布信息.txt` 固定为 **5 条标题 + 1 行 4 个话题**（2026-10-24 宝哥改规则）：
前 5 行是可直接发布时挑选的候选标题，第 6 行是话题；发布时从 5 条里选 1 条使用。

1. 每条标题 **不超过 25 个字**（含标点），**两段式**（前半句钩子 + 后半句具体后果/承诺，
   用问号、冒号或感叹号分隔），要有抖音爆款逻辑（数字反差 / 悬念 / 情绪 / 反常识），
   夺人眼球、利于点击；兵力/数量/年份用**阿拉伯数字**；
2. 5 条要在角度上错开（数字对比、悬念、情绪、极限词等），不要同义改写；
3. 最后一行**恰好 4 个 `#话题`**，空格分隔。

示例（格式，非定稿）：

```text
42万打8千！刘秀3年当上皇帝
42万人围8千！他靠一颗流星翻盘
8千人打崩42万！刘秀开挂有多离谱
哥哥被杀他笑着喝酒！3年后刘秀当皇帝
中国最离谱皇帝！42万大军没打过8千
#历史 #中国历史 #历史科普 #图说历史
```

宝哥的偏好（按两次手改总结，5 条候选都按此写）：前半句用宏大陈述或刺眼数字，感叹号收束；
后半句必须给出**具体、惊人的后果**（如「有10次差点灭亡」），不要用抽象名词（「生死转身」）
代替结果；能删的修饰就删，18 字比 22 字更狠。**≤25 是上限，不是目标长度。**

## 8. 交付结构

- 母文件留在 `output/<slug>/`；交付目录用 `out/<NN 中文主题>/`，不覆盖旧片。
- 用打包器统一交付（会校验封面尺寸、成片存在，以及发布信息 5 标题 + 4 话题、
  每条标题 ≤25 字且两段式并含阿拉伯数字）：

  ```bash
  "$PY" tools/zhidiao/package_delivery.py --job output/<slug>/delivery.json
  ```

- 交付目录顶层只留 **4 个文件 + `源文件/`**：

  1. `tushuo-<slug>.mp4`
  2. `封面-4比3.jpg`
  3. `封面-3比4.jpg`
  4. `发布信息.txt`
  - `源文件/`：封面源图、封面提示词、封面说明、成片数据；zhidiao 若有口播稿、
    manifest、拼接清单等，一并放入。

## 9. 已踩坑速查

| 症状 | 根因 | 对策 |
|---|---|---|
| 人物/器物整体跑出画面顶部 | fromTo 绝对 x/y 覆盖 SVG translate 基位 | 全部改相对值，audit 脚本清零 |
| 某幕尾部黑屏 | fragment 场景数 < 口播段数，叠化循环提前隐藏末场景 | 组装后断言数量一致 |
| 重叠字幕 | DP 对齐 caption end 越界 | 截断 + 短间隔合并两级修复 |
| TTS 反复重试后退出 | preset max_chars_per_second=6.2 阈值误判 | 复制 preset 改 7.0 + --config |
| 抽帧看不到字幕 | snapshot 通道不烧录 .cap 层 | 渲染成品后 ffmpeg 抽帧 |
| 批量渲染个别失败 | npm enoent 偶发 | 核对日志后单独补渲 |
| 批次样式不一致 | 渲染中改共享 CSS | 改样式前先停批量任务 |
| 封面标题错字/多字/少字 | Seedream 偶尔画错汉字 | 放大标题区逐字核对，不合格立即重出 |
| 封面接口存成 .jpeg | 按返回 URL 后缀保存 | 核对尺寸后改名 .jpg，不影响交付 |
| 交付目录混入中间文件 | 手工拷贝导致顶层超过 4 个文件 | 统一用 `package_delivery.py`，顶层只 4 文件 + `源文件/` |
