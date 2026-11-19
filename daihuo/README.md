# daihuo · 价签货架（本地生活带货）

纯代码绘制的竖屏团购片：1080×1920 / 30fps / 15s，1 秒内出钩子，文案与音色自动化。
所有画面由 HTML/CSS/SVG + Playwright 逐帧渲染，不采样实拍、不调用生图/生视频 API。

**当前状态：P0 冒烟完成**（技术链路跑通，一条真实商品样片已出片并通过机械门禁；尚未接发布队列）。

## 一条片的生成顺序

```powershell
# 1 配音（GPT-SoVITS 克隆音色；首次调用要等模型加载）
D:\GPT-SoVITS\.venv\Scripts\python.exe D:\GPT-SoVITS\dabao_tts.py `
  -f projects\000_p0_smoke\script.txt -o projects\000_p0_smoke\narration.wav `
  --speed 1.15 --keep-gap-ms 140 --force

# 2 句级时间轴（按字数比例取最近静音，容错比"取最长静音"高）
D:\GPT-SoVITS\.venv\Scripts\python.exe scripts\split_lines.py `
  --wav projects\000_p0_smoke\narration.wav --text projects\000_p0_smoke\script.txt `
  --out projects\000_p0_smoke\lines.json

# 3 渲染 450 帧
node scripts\render_frames.cjs --page=templates\p0.html `
  --cues=projects\000_p0_smoke\cues.json --out=projects\000_p0_smoke\frames

# 4 音频（人声 + BGM + 代码音效，两遍 loudnorm 到 -14 LUFS）
D:\GPT-SoVITS\.venv\Scripts\python.exe scripts\make_audio.py `
  --narration projects\000_p0_smoke\narration.wav --cues projects\000_p0_smoke\cues.json `
  --bgm D:\@kaifa\tuangou\runtime\bgm\轻快活泼愉快口哨.mp3 `
  --sfxdir assets\sfx --out projects\000_p0_smoke\mix.wav

# 5 合流 + 门禁
ffmpeg -framerate 30 -i projects\000_p0_smoke\frames\f%05d.jpg -i projects\000_p0_smoke\mix.wav `
  -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 -c:a aac -b:a 192k -ar 48000 -shortest `
  projects\000_p0_smoke\out\华莱士-双拼6块-CV-01.mp4
D:\GPT-SoVITS\.venv\Scripts\python.exe scripts\qa.py `
  --video projects\000_p0_smoke\out\华莱士-双拼6块-CV-01.mp4 `
  --cues projects\000_p0_smoke\cues.json --out projects\000_p0_smoke\out\_qa.json
```

## 目录

```
daihuo/
├── templates/p0.html        # 画面与 renderAt(t) 协议（六段场景 + 字幕层 + 移动光斑）
├── assets/fonts/            # NotoSansSC-Bold（随管线走，不依赖系统字体）
├── assets/sfx/              # hit / coin / stamp（make_sfx.py 纯代码合成）
├── scripts/render_frames.cjs# Playwright 逐帧
├── scripts/split_lines.py   # 句级时间轴
├── scripts/make_audio.py    # 混音 + 两遍 loudnorm
├── scripts/make_sfx.py      # 代码音效
├── scripts/qa.py            # 机械门禁
└── projects/000_p0_smoke/   # 首条样片工程（script / narration / lines / cues / meta / out）
```

## P0 实测（2026-11-17，本机）

| 项 | 结果 |
|---|---|
| 配音 | 8 句 / 85 字 / 12.68s（speed 1.15、句间 140ms），GPT-SoVITS v3 + dabao |
| 渲染 | 450 帧 34–36s，**80ms/帧**（chromium-1243） |
| 音频 | 15.000s，−14.47 LUFS，TP −1.40，无削波 |
| 成片 | 1080×1920 / 30fps / 450 帧 / 15.00s / h264 CRF18 / AAC 48k |
| 门禁 | `_qa.json` 全绿：无黑帧、无 >0.5s 冻帧、首帧钩子色块 3.49% |

## 已知坑（都是实测踩出来的）

1. **Playwright 默认找不到浏览器**：会去找 `chromium_headless_shell-1187`，本机只有 1243。`render_frames.cjs` 里写死 `executablePath=…/chromium-1243/chrome-win64/chrome.exe`。
2. **中文不能照搬描边**：`-webkit-text-stroke` 会把细笔吃空，改用 8 方向 `text-shadow`（`[data-stroke]` + `--sw`）。
3. **静止帧会被平台式节奏判死**：只做入场动画，3 秒长的段落会整段不动。补两层连续运动——全场缓慢推近（scale +3.8%/段）+ 背景光斑游走，`freezedetect` 才干净。
4. **TTS 每次调用都重启服务**，模型加载约 60–90s。批量生产必须 `--keep-server` 或常驻服务，否则每条片白等一分半。
5. **句边界不能"取最长静音"**：句间停顿统一 140ms 时长度排序无意义，会切错并让某句占 5 秒。改成按字数比例算期望位置、取最近静音。
6. **单遍 loudnorm 会落在 −15**，必须两遍（先测量再 linear 归一）。
7. **入场放大用 `transform-origin` 左侧**，否则首帧大价格会把自己裁出画面外。

## 下一步（P1）

- 建 `pipeline.json` / `SKILL.md`，登记 catalog 与 12 号工位 `local`，`tools/validate.py` 过 0 error
- 把 `templates/p0.html` 拆成「版式 + 道具库」（12 个 SVG 道具、6 个品类色板），场景由 cues 驱动而非写死
- 文案槽位引擎（钩子 8 型 + 数字白名单 + 禁词表），替换现在手写的 script.txt
