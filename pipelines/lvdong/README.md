# lvdong · 剪影律动短片

**一段旁白，一片落日，一群按拍子动的黑剪影。** 画面全部由代码画：不生成图、不下载素材、不用照片。

```text
口播稿 ──┬─ 旁白切片 ─ 转写 ─ 对齐 ─ 字幕行 ─┐
         │                                ├─ film.js（每镜的剪影与相机）
         └─ treatment（结构方案）           │
                                          sky.js（天空/日轮/水面/倒影）
score.json（谱）─ sound.py ─ mix.wav ───────┴─ mux（两遍 loudnorm）→ 成片
```

## 快速开始

```powershell
$env:LVDONG_LIB = "D:\@kaifa\lemo-opuscar"
cd D:\@kaifa\Auto-Video\lvdong

# 1 建工程（口播稿里取前 3 段）
& "$env:LVDONG_LIB\.venv\Scripts\python.exe" scripts\lvdong.py new 005_新题目 `
    --script "D:\path\口播稿.md" --paras 3 --duration 58
# 2 把旁白整条放到 projects\005_新题目\voice\source_full.wav

# 3 声音先行
python scripts\lvdong.py transcribe 005_新题目
python scripts\lvdong.py align      005_新题目     # 看 match rate（<75% 回来查）
python scripts\lvdong.py cues       005_新题目

# 4 谱（照 projects\004_玛雅巨人文明\score.json 改）
python scripts\lvdong.py beats 005_新题目
python scripts\lvdong.py sound 005_新题目

# 5 画（改 film.js / cast.js），抽查几帧
python scripts\lvdong.py stage 005_新题目
python scripts\lvdong.py still 005_新题目 0 12 23.2 53.5 57.9

# 6 出片
python scripts\lvdong.py video 005_新题目 --workers 3
python scripts\lvdong.py mux   005_新题目
python scripts\lvdong.py srt   005_新题目
python scripts\lvdong.py poster 005_新题目 --at 23.2
python scripts\lvdong.py check 005_新题目
```

或者一条 `python scripts\lvdong.py make 005_新题目` 跑完 3–6 步。

## 环境

| 依赖 | 版本/位置 | 用途 |
|---|---|---|
| node | v22+ | 渲染（`core/render/still.mjs` / `video.mjs`） |
| python + numpy / scipy / soundfile | `$LVDONG_LIB\.venv\Scripts\python.exe` | 转写、对齐、合成、混音 |
| faster-whisper | 同上 venv | 逐词转写（`small` int8 CPU） |
| ffmpeg / ffprobe | 8.x，PATH 上（或 `LVDONG_FFMPEG`） | 混流、两遍 loudnorm、封面、探测 |
| lemo-opuscar | `LVDONG_LIB`（默认 `D:\@kaifa\lemo-opuscar`） | 皮肤/天空引擎与渲染器 |
| 字体 | `assets/fonts/`：NotoSansSC + Anton（OFL，不入库） | 字幕与画面字 |

**不需要 bash**：混流的两遍 loudnorm 直接写在 `lvdong.py` 里。

## 目录

| 路径 | 内容 |
|---|---|
| `SKILL.md` | 完整流程与判据（先读这个） |
| `scripts/lvdong.py` | 编排器：14 个子命令 |
| `scripts/{transcribe,align,make_cues,sound}.py` | 转写 / 对齐 / 切字幕 / 合成混音 |
| `template/` | 起手工程：`index.html` + `cast.js` + `film.js` 骨架 |
| `references/` | `style.md` 画风 · `score.md` 谱 · `pitfalls.md` 坑 · `delivery.md` 验收 |
| `projects/004_玛雅巨人文明/` | 首个实例（已出片，参数与谱都在） |
| `pipeline.json` | 定版参数 |

## 这条管线不做的事

- 不做竖屏，不做两版同出；画幅就是 1920×1080 / 30 fps。
- 不用 AI 生图、不用实拍素材、不用照片。
- 不做片名卡、不做分镜预览页（要故事板另说）。
- 不合成音色（旁白是你给的；要 TTS 走 `peiyin`）。
- 不复制 lemo-opuscar 的引擎源码，只用它；引擎更新了就跟着更新。

## 首个实例

`projects/004_玛雅巨人文明/` 是《玛雅巨人文明》口播稿第 1–3 段的完整实现：58.0 s、12 段 15 镜、19 条字幕、90 BPM、−14.0 LUFS。它同时是一份"怎么用这套 API 写一支片子"的答案——`film.js` 里每个 `shot*` 都是可抄的写法，`score.json` 是一份完整的谱。

## 许可

MIT（与仓库根 `LICENSE` 一致）。第三方与字体见 `CREDITS.md`。
