# MoneyPrinterTurbo CLI 契约（shipai 只用这一层）

shipai 不调用 MPT 的 WebUI / API / Streamlit，只用它的 `cli.py` 一条命令：**给文案、给现成配音、给本地素材，出一版无字幕竖屏底片**。本文是这个契约的全部内容，改参数前先看这里。

## 调用形态

```powershell
$env:PYTHONPATH = "D:\@kaifa\MoneyPrinterTurbo"
cd D:\@kaifa\MoneyPrinterTurbo
.\.venv\Scripts\python.exe cli.py `
  --video-subject "玛雅巨人文明·第一大段" `
  --video-script "<这一段的口播稿原文>" `
  --custom-audio-file "<工程>\audio\seg-01.wav" `
  --video-source local `
  --video-materials "<clip1>,<clip2>,<clip3>" `
  --video-concat-mode sequential `
  --video-clip-duration 4 `
  --video-aspect 9:16 `
  --video-count 1 `
  --bgm-type none `
  --no-subtitle-enabled `
  --n-threads 4
```

`PYTHONPATH` 必须指向 MPT 目录，否则 `app.config` 找不到。`shipai base` 已经替你做了这些。

## 只保留的参数

| 参数 | shipai 固定值 | 为什么 |
|---|---|---|
| `--video-source` | `local` | 素材是人挑的，不让模型按关键词自动拉；`pexels` 无 key |
| `--video-materials` | `materials.json` 里的文件（绝对路径） | 顺序即镜头顺序 |
| `--video-concat-mode` | `sequential` | 默认 `random` 会 shuffle 素材，出片不可复现 |
| `--video-clip-duration` | `4` | 4 s 一换镜头，17.9 s 正好 5 段 |
| `--video-aspect` | `9:16` | 竖屏；横屏素材按 cover 裁成 1080×1920 |
| `--video-count` | `1` | 单条成片 |
| `--bgm-type` | `none` | 本次无 BGM |
| `--no-subtitle-enabled` | 关 | 自定义音频下 MPT 的字幕链拿不到时间轴，字幕由 `captions.py` 烧 |
| `--custom-audio-file` | `audio/seg-NN.wav` | 用用户原声，不合成 |
| `--n-threads` | `4` | 本机实测稳定 |

用不到、因此不传：`--video-language`、`--paragraph-number`、`--stop-at`、`--voice-*`、`--subtitle-*`、`--bgm-*`、`--font-*`、`--video-script-prompt`、`--confirm-*-charge`。

## 输出

CLI 结束时会打印一行结果 JSON：

```json
{"task_id": "b7ae553d-...", "result": {"videos": ["D:\\...\\storage\\tasks\\<task_id>\\final-1.mp4"], "audio_duration": 17.86, ...}}
```

`shipai base` 从这一行里取 `videos[0]`，复制进工程成为 `base-9x16.mp4`，同时把完整 stdout 写进 `logs/base.log`。

## 已知坑（都复现过）

1. **`--video-source` 默认 `pexels`**，会盖掉 `config.toml` 的 `video_source`。不显式传 `local` 就在素材阶段直接失败（`pexels key 为空`）。`config.toml` 里的值只对 API/WebUI 生效。
2. **拼接默认随机**：MPT 内部 `random.shuffle`，同一批素材跑两次顺序不同。要锁顺序就 `--video-concat-mode sequential`。
3. **自定义音频 + 字幕**：`--custom-audio-file` 时 MPT 用不到 TTS 时间轴，`subtitle_provider=edge/whisper` 的默认链会跳过；强制开 `--subtitle-enabled` 只会得到空字幕或错位字幕。shipai 因此总是 `--no-subtitle-enabled`，字幕在外部烧。
4. **素材会被复制进 MPT 的 storage**：`storage/local_videos/cli-material-<hash>.mp4`，属于 MPT 的中间产物，删工程时不要连带删 `materials/` 里的原文件。
5. **CLI 首次加载 config**：如果 `config.toml` 不存在，MPT 会把 `config.example.toml` 改写成无注释的精简版再读。shipai 不改这个文件，只依赖 `llm_provider` 等与本链路无关的默认值。
6. **出片耗时**：17.9 s 的片子约 2 分钟（素材转码是主要成本，3840×2160 源裁成 1080×1920 时最慢）。别设短超时。
