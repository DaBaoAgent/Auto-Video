# xiangsu 管线（像素风视频）

> 管线代号：**xiangsu**（像素风 / 8-bit）。2026-10-28 用户命名并固化。

## 定位

第三条渲染管线，与 `render/piying/`（炎帝·剪影卡片风 Canvas 逐帧）、`render/nuwa/`（女娲）、`render/posiwan/` 并列。
区别：**先画 640×360 索引色帧缓冲，再 ×3 最近邻放大到 1920×1080**，最后 CRT 后处理；
不依赖任何文生图/图生视频模型，全部图形由代码在索引色栅格上逐像素生成。

## 成片规格（硬规格，不许改）

| 项 | 值 |
|---|---|
| 输出分辨率 | **1920×1080** |
| 像素栅格 | **640×360**（索引色帧缓冲，1 逻辑像素 = 3 屏幕像素） |
| 放大方式 | **×3 最近邻**（不插值、不做抗锯齿） |
| 帧率 | 30 fps |
| 编码 | H.264 / yuv420p / CRF 14 |
| 音频 | AAC 192 kbps / 48 kHz / 立体声 |
| 响度 | **−16 LUFS / ≤ −1.5 dBTP**（本系列口径；20-pixel 支线是 −14，别混） |

代码里对应两处，含义不同、不能混改：

```
film.js:10        const W = 640, H = 360          // 栅格：决定"像素有多粗"
film.js:12        window.DEMO = { width: 1920, height: 1080 }   // 成片：决定"画布有多大"
```

- 把栅格改成 320×180 会让像素粗一倍（那是 20-pixel 支线的密度，不属于本管线）
- 把 DEMO 改成 640×360 则成片不到 1080p，平台会二次拉伸、像素格被破坏

验收两条都要过（以下命令在**项目根**执行）：

```bash
F="out/6 仁德天皇陵/仁德天皇陵_像素风样片_前10秒.mp4"
ffmpeg -v error -i "$F" -vf "select=eq(n\,120)" -vsync 0 -frames:v 1 /tmp/a.png -y
ffmpeg -v error -i /tmp/a.png -vf "scale=640:360:flags=area,scale=1920:1080:flags=neighbor" /tmp/b.png -y
ffmpeg -hide_banner -nostats -i /tmp/a.png -i /tmp/b.png -filter_complex "[0][1]psnr" -f null -
```

1. `ffprobe` 出 `width=1920 height=1080`
2. 把一帧降采样回 640×360 再 ×3 最近邻放大，与原帧 PSNR **≥40 dB**（本片实测 **41.8 dB**，差值只来自 H.264）。
   若密度实际是 320×180，同法只有 **24.4 dB** —— 这条能直接抓出"栅格被改粗"，比只看分辨率可靠。

## 代码位置

管线代码必须留在克隆的渲染仓库内（harness 自带无头 Chrome + ffmpeg 逐帧合成）：

```
vendor/mg-styles-15/demos/xiangsu/
├── index.html      入口（预加载像素字体后 import film.js，置 window.__ready）
├── film.js         主渲染器：色板/LUT、图元、像素字体、六镜头、转场、CRT
├── sprites.js      逐像素 sprite 表（ASCII 字符网格，每字符 = 1 px）
├── cues.json       声画共用 cue sheet（cuts / subs / hits）
├── audio.py        chiptune + SFX 合成与配音混音
└── out/            中间产物（未归一化视频、music.wav、mix_raw.wav、备份）
```

## 字幕时间轴（词级强制对齐，2026-10-28 起为主路径）

字幕文本**不含标点**，一条里多个小句之间**空一格**。时间轴不用字数比例推，走词级对齐：

```bash
# 1) 词级转写（faster-whisper-small）
vendor/gpt-sovits/.venv/Scripts/python.exe tools/transcribe_faster.py -a output/002_仁德天皇陵/配音.wav
# 2) 繁转简（whisper 中文默认输出繁体，不转会掉 10 个点命中率）
vendor/gpt-sovits/.venv/Scripts/python.exe -c "import json,opencc;cc=opencc.OpenCC('t2s');p=r'...配音.wav.transcript.json';d=json.load(open(p,encoding='utf-8'));json.dump([{'id':w.get('id'),'text':cc.convert(w['text']),'start':w['start'],'end':w['end']} for w in d],open(p.replace('.transcript.json','.transcript.simp.json'),'w',encoding='utf-8'),ensure_ascii=False)"
# 3) 字符级 LCS 对齐 + 打包
node tools/build_cues_asr.js
```

验收口径：字符命中率 ≥85%、字幕窗静音占比 >35% 的条数 = 0、无超长（≤17 字）无过短（≥0.45 s）。
`tools/build_cues.js`（字数比例 + 停顿吸附版）保留为无转写时的兜底。

### 同步校验（每次改字幕或换配音后必跑）

```bash
cd vendor/mg-styles-15
node tools/check_sync.mjs --cues demos/xiangsu/cues_full.json \
  --audio demos/xiangsu/out/full48.mp4 \
  --asr "D:/@kaifa/yandi/output/002_仁德天皇陵/配音.wav.transcript.simp.json"
```

**必须带 `--asr`。** 本片配音几乎连续（最大停顿 0.11 s），任何 1–2 秒窗口都落在有声段，
所以"窗内有声占比"这一项抓不出整段漂移：比例法时间轴实际偏差 p50 13.3 s 时，它仍报 **87.9% 通过**。
只有内容级比对（字幕文字 vs 该时段实际念的字）才抓得出来——词级对齐 **90.1%** vs 比例法 **13.9%**。

本片基线（`full48.mp4`，102 条）：

```
窗内有声均值      87.1%
间隙有声均值      29.5%
起点对准语音起始  99/102 条找到跳变，平均绝对偏移 109 ms
字符重合率均值    90.1%
弱条（<50%）      0 / 102
```

判据：窗内有声均值 ≥80%、字符重合均值 ≥80%、弱条 ≤8%，三项同时满足才算通过。
中文数字要先归一化才能比（字幕「二零一八」↔ ASR「2018」，不归一化会误报 4 条；脚本已内置）。

## sprite 表使用边界（硬规则，见 SKILL.md 2.9）

- **要帧表**（逐帧变性）：人群骚动、挖掘机臂组作业、棺盖开启显文物、工匠造船出海、人物情绪微动作
- **单张图**（静态）：全景、标题、文物本体、背景建筑、机械机身与履带
- 臂组等多角度部件用 `rotSpr()` 生成 5° 档旋转帧缓存，不在 1080p 上临时画线

## sprite 表四条铁律（2026-10-28 v2 逐条踩过）

1. `CHR` 里 `'.'` 必须是 `-1`（透明）、`k` 必须是 `0`（不透明黑）。写成同一个 0 会让轮廓全透明，整张图只剩高光点。
2. 关节链的 `L1/L2` **必须等于 sprite 实际长度**（大臂 61 宽锚点 2 → 56；小臂 44 宽锚点 1 → 40）。给"看着差不多"的值（40/23），画出来的臂尖会比销轴远 18–19 px，铲斗悬空。
3. 两块旋转矩形相接必定漏出三角空洞 → 用 `boss(x,y,r,rim)` 铰点盘盖住；rim 只亮一档（`M(2)`），`M(6)` 夜里会变白环。
4. 液压缸/连杆端点要吸附到臂的上下缘（大臂轴线到表缘仅 5–6 px），按轴线 +n*7 算就悬空成"细铁丝"。

颜色：机械走 `MAP_MACH`（否则夜色里全黑）、石材与铜活走 `MAP_STONE`（门环走 `MAP_PAL` 会变钢蓝"胶囊"）、纯色人物走 `MAP_PAL`。
手写表右边缘常漏 1–2 格透明列 → `sprites.js` 尾部统一补 `.` 到本表最大宽度（w 不变、像素零变化，但消掉整屏告警）。

## 复现

```bash
cd vendor/mg-styles-15
# 1) 音轨（chiptune + 配音）
vendor/gpt-sovits/.venv/Scripts/python.exe demos/xiangsu/audio.py
# 2) sprite 自查图（必须 0 告警）
node tools/sheet.mjs tools/sheet.png 6
# 3) 关键帧
MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu --stills 0.5,1.8,3.2,4.6,6.0,7.4,8.6,9.6
# 4) 全片（音轨用 loudnorm 之后的 audio.wav，不是 mix_raw.wav）
#    注意：产物文件名里的 640 指"栅格"，成片实际是 1920×1080（DEMO 决定）
MG_CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  node harness/render.mjs demos/xiangsu --audio demos/xiangsu/out/audio.wav \
  --crf 14 --out demos/xiangsu/out/video640.mp4
# 5) 密度度量（口径唯一，别手打 node -e）
node tools/density.mjs demos/xiangsu/out/video640.mp4
# 6) 字幕同步（改字幕或换配音后必跑，必须带 --asr）
#    仅全片适用：样片没有旁白；全片用 film_full.js + index_full.html + cues_full.json 渲出 full48.mp4
node tools/check_sync.mjs --cues demos/xiangsu/cues_full.json \
  --audio demos/xiangsu/out/full48.mp4 \
  --asr "D:/@kaifa/yandi/output/002_仁德天皇陵/配音.wav.transcript.simp.json"
```

`tools/density.mjs` 的口径：192×108 灰度、帧间差 `|Δ|>8`、按 2 s 窗口统计"变动像素占比"超过 0.5% / 1% / 3% 的帧数，并给出最长无有效变化段。换采样尺寸或阈值必须在报告里写明，否则与历史片不可比。

### 旁白 + 底乐混音（改用项目 BGM 库时）

`audio.py` 会把 chiptune 与配音在内部混好并归一化，正常流程不用额外处理。
若要换成项目 BGM 库的曲子（不用 chiptune），走 `tools/mix_voice.mjs`，不要手抄 ffmpeg：

```bash
node tools/mix_voice.mjs --voice "output/002_仁德天皇陵/配音.wav" \
  --bed "<BGM 已循环铺满到片长>.wav" --out demos/xiangsu/out/mix_final.wav \
  --dur 192.74 --bed-gain -19 --lufs -16
```

- 人声先归一化到 −16 LUFS，底乐按 `--bed-gain` 衰减（BGM 库曲子按项目工艺取 −19 dB）
- 两遍法 loudnorm 到 `--lufs`（本管线 −16），复测偏差 ≤0.5 LU 且真峰值 ≤ −1.5 dBTP 才算通过
- 封装进视频必须显式 `-map 0:v:0 -map 1:a:0`，否则 ffmpeg 会选到原视频自带的旧音轨

## 交付

成片与封面、发布信息按 `out/<序号> <标题>/` 契约落盘（顶层 4 项 + `源文件/`）。
