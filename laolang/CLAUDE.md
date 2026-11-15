# laolang 管线 · 新窗口先读

工作目录应是 `D:\@kaifa\Auto-Video\laolang`；命令都在这里执行。完整流程见 `SKILL.md`，
强制规则见 `references/sync.md` 与 `references/delivery.md`。

## 交付契约（2026-11-11 宝哥定，硬规则）

**所有成片统一交到 `D:\@kaifa\Auto-Video\laolang\out\<三位序号> <片名>\`**，不再放各工程 `交付/`。
laolang 只负责移动成片、建子目录；**封面与发布信息一律调用 `D:\@kaifa\fengmian`**：

- `fengmian build` → `发布信息.txt`（两行制：标题 ≤25 字含阿拉伯数字 + 4 个话题）+ `源文件/封面提示词-4比3|3比4.txt` + `封面元信息.json`
- `fengmian covers` → `封面-4比3.png`（2048×1536）/ `封面-3比4.png`（1536×2048），需要 `ARK_API_KEY`
- `fengmian gate` → 根目录门禁（只许成片 / 两张封面 / 发布信息 / 子目录）

工程侧只需一份 `delivery.json`（6 字主标、8 字副标、两行制标题、4 话题、两张画面描述）。
顶层：成片 + 两张封面 + `发布信息.txt` + `源文件/`；序号自动 +1，已发布归档 `out/@已发/`。
详见 `references/delivery.md`，一键交付：

```bash
python scripts/laolang.py deliver projects/<工程> --name "片名" --title "片名"
```

## 新片必做顺序

1. `vo`：现成配音 + 口播稿 → 初步时间轴。
2. `asr` + `rebuild`：用真实口播词时间校准时间轴（字幕对不上就先做这步）。
3. **按口播切分镜：每镜 2.0–4.0 秒**，切点只落在句首/词首（±0.35 s）或 ≥0.12 s 停顿。
   长片用 `python scripts/plan_shots.py <工程> [--fixed 已验收切点]` 生成 `review/shotplan.*`，
   页面按这份镜头表写 `G.shot(a, b)`，别手工估时间。
4. `render` 后跑 `shots` + `sync --ocr`；退出码 0 才算过，完整报告在 `review/sync_qa.json`
   （单项命令写 `review/sync_qa_<cmd>.json`，不会覆盖它）。没有 `sample.html` 的工程用 `index.html`。

```bash
python scripts/laolang.py asr <工程>/audio/narration.wav --out <工程>/review/asr_a.json --start 0 --dur 180
python scripts/laolang.py rebuild <工程> --asr review/asr_a.json ... --full-before 180 [--sample-end 20.12]
python scripts/laolang.py shots <工程>/sample.html --video <工程>/out/video-16x9.mp4
python scripts/laolang.py sync  <工程> --html sample.html --video out/video-16x9.mp4 --ocr
```

## 硬规则

- **字幕只能由 `EV.captionSegments` 从时间轴词级时间生成**；禁止按字数均分、禁止手写时间。
- **分镜 2–4 秒**，切点跟口播；`shots` 不过不要渲染。
- **口播同步验收口径**：`sync` 音频滞后 ≤40 ms；逐句起点中位偏差 ≤0.30 s **且超差句数 ≤20%**。
- **`toon-cast/` 冻结**：人物比例/发型/脸型/手臂结构改动必须先出新设定图并让宝哥确认。
- 屏幕文字只从各项目 `brief.md` 的表来；不虚构史实。
- 本机 ASR：faster-whisper 用 ffmpeg 解码成 ndarray（PyAV 会报 `metadata_errors`）；
  OCR 只用 Dabao-OCR（`127.0.0.1:18224`，Windows 绝对路径）。

## 当前项目

`projects/022_澳洲土著/`：**全片 195 镜 / 537.43 s 已完成并渲染**
（`out/video-16x9.mp4`，30 fps，含 `score.js` 配乐；20 秒 8 镜样片见旧记录 `review/sync_qa_sample8.json`）。

- `scripts/plan_shots.py`：按词级时间 + `storyboard.md` 幕块表自动切镜，
  产出 **`review/shotplan.json` / `.md`（195 镜 / 537.43 s）**，切点全在词界或 ≥0.12 s 停顿，
  样片 7 个切点用 `--fixed` 锁死。
- `index.html`（原文件是玄奘模板，已备份到 `review/_index_xuanzang-template-62s.html`）
  由 `sample.html` 派生，**第一至九幕 0–537.43 s / 195 镜全部实现**。
  分段成片 `out/video-16x9-act1/2/3/4/5/5b/6/7/8.mp4` 的 `shots` + `sync --start --ocr` 全部 PASS。
- 全片 `sync --ocr` 与 `qa` / `short-qa` / `deliver` 的结论见
  `projects/022_澳洲土著/CLAUDE.md`（含 489.60 拉杆箱横把、524.40 鼓面四指两处返修的做法）。
详细交接见 `projects/022_澳洲土著/CLAUDE.md`。
