# shipai · 实拍素材口播竖屏短片

一个人的声音，一堆真实拍到的画面，一行一行跟着语音出现的字幕。1080×1920 / 30 fps。

画面不生成、不绘制，全部来自实拍素材——所以这条管线不卖画风，卖的是**声音、素材、顺序、字幕**这四件的接线：

```
配音.wav ──► 切段与字级时间（whisper + 对齐）
                │
                ├──► Pixabay 实拍素材（先搜后挑，按 id 下载，顺序即镜头顺序）
                │            │
                └──► MoneyPrinterTurbo CLI ──► 无字幕底片 1080×1920
                                          │
                                     一行式字幕烧录 ──► 成片
```

首个实例：`projects/004_玛雅巨人文明/` —— 玛雅巨人文明口播稿第一大段，17.86 s，12 条字幕，5 段 Pixabay 实拍（危地马拉丛林金字塔、特奥蒂瓦坎太阳金字塔）。音频与成片不入库。

## 快速开始

```powershell
$py = "D:\@kaifa\MoneyPrinterTurbo\.venv\Scripts\python.exe"

# 1. 建工程（口播稿 + 现成配音）
& $py scripts\shipai.py new 004_玛雅巨人文明 `
    --text "出稿\004_玛雅巨人文明\口播稿.md" `
    --wav  "出稿\004_玛雅巨人文明\配音.wav" `
    --title "玛雅巨人文明·第一大段" --paragraph 1

# 2. 切段 + 生成逐句时间（timeline.json）
& $py scripts\shipai.py vo 004_玛雅巨人文明 --paragraph 1

# 3. 查素材候选 → 按 id 下载（顺序即拼接顺序）
& $py scripts\shipai.py terms    004_玛雅巨人文明 --terms "mayan ruins|mayan pyramid|jungle temple"
& $py scripts\shipai.py material 004_玛雅巨人文明 --ids 35423,144043,144042,22200,281134

# 4. 出无字幕底片 → 烧字幕 → 校验
& $py scripts\shipai.py base    004_玛雅巨人文明
& $py scripts\shipai.py caption 004_玛雅巨人文明
& $py scripts\shipai.py probe   004_玛雅巨人文明
```

一键：`& $py scripts\shipai.py make 004_玛雅巨人文明 --paragraph 1 --ids 35423,144043,144042,22200,281134`

## 环境

- Python 3.11（本机直接用 MoneyPrinterTurbo 的 `.venv`：`faster-whisper` + `Pillow` + MPT 全在里面）
- ffmpeg / ffprobe 在 PATH
- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) 本地已部署（`SHIPAI_MPT` 改路径）
- faster-whisper 模型：默认 `large-v3-turbo`，优先用 HF 缓存里已有快照（`HF_HOME` / `D:\cache_backup\huggingface\hub`），没有才联网下
- Pixabay API key（`PIXABAY_KEY`），国内网络设 `SHIPAI_PROXY`

## 目录

| 目录 | 内容 |
|---|---|
| `scripts/` | 编排（`shipai.py`）+ 切段对齐（`vo_segment.py`）+ 素材（`pixabay.py`）+ 字幕（`captions.py`） |
| `references/` | MPT CLI 契约与坑、素材规则、字幕规范、交付 |
| `projects/` | 每个片子一个目录：口播稿、timeline、素材清单（音频与成片不入库） |
| `pipeline.json` | 定版参数：画幅 / 引擎 / 素材 / 字幕 / 校验 |

## 这条管线不做的事

WebUI 与 API 服务、`start.bat`、Edge TTS 合成、LLM 写口播稿、Pexels 分支、MPT 自带字幕链、BGM 与音效、fengmian 封面与发布信息。**只封本次做实拍口播短片真正用到的能力**（用户 2026-11-15 定）。

## 许可

代码原创；画面素材来自 [Pixabay](https://pixabay.com/)（Pixabay License，可商用，不要求署名），渲染引擎为 [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)（MIT），语音转写为 [faster-whisper](https://github.com/SYSTRAN/faster-whisper)（MIT）。详见 [CREDITS.md](CREDITS.md)。
