# peiyin 迁移与外部依赖说明（MIGRATION）

本文件说明 peiyin 管线从何处迁移、哪些内容刻意**不入仓库**、以及运行时需要**自行下载/自备**的外部依赖。遵循原则：**配音模块、模型、大文件一律不进入仓库，只引导下载**。

## 一、迁移来源

- 来源仓库：本地 `D:\@kaifa\PeiYin`（统一 GPT-SoVITS 配音模块 + 四条内容管线：weijie / lishi / dianying / lunyi）
- 迁移方式：仅复制"选题-出稿-配音"通用部分；内容线成品（出稿、素材）不迁入
- 迁移日期：2026-10-31；仓库路径：`Auto-Video/peiyin/`

## 二、刻意不入仓库的内容（已在 peiyin 中剔除）

| 类别 | 原路径 | 说明 |
| --- | --- | --- |
| 引擎虚拟环境 | `GPT-SoVITS/.venv/` | 5.3GB，本地安装产物 |
| 引擎运行时 | `GPT-SoVITS/runtime/` | 315MB（ffmpeg 等），自行安装 |
| 训练/运行日志 | `GPT-SoVITS/logs/`、`tts_server.log` | 运行日志 |
| 音色与预设 | `GPT-SoVITS/voices/` | dabao 音色 preset + `ref_dabao3-1.wav` 参考音频，见下"引导下载" |
| 模型权重 | `GPT-SoVITS/GPT_SoVITS/pretrained_models/` | 1.86GB，见下"引导下载" |
| 注音模型 | `GPT-SoVITS/GPT_SoVITS/text/G2PWModel/` | `g2pW.onnx` 608MB，见下"引导下载" |
| 日文词典 | `GPT-SoVITS/GPT_SoVITS/text/ja_userdic/` | 16.5MB，中文管线用不到 |
| 内容线成品 | `weijie/出稿/`（1.25GB）、`weijie/素材/`（424MB）、`lishi/`、`dianying/`、`lunyi/` | 各赛道出稿与素材，不入通用管线 |
| 一次性修复脚本 | `weijie/fix*.ps1`、`batch_*.ps1`、`audit_all.ps1` | 011–029 期专用，不可泛化 |
| Python 缓存 | `**/__pycache__/`、`*.py[cod]` | 编译缓存 |

## 三、外部依赖引导下载（运行前必读）

### 1. 权重与音色（约 2.4GB，一键引导）

`scripts/setup.ps1` 内置 9 项资源的精确路径与最小字节数校验（缺失或疑似 LFS 指针会检测并拉取）：

| # | 相对路径（引擎根 `GPT-SoVITS/` 下） | 最小字节 |
| --- | --- | --- |
| 1 | `GPT_SoVITS/pretrained_models/s1v3.ckpt` | 155,284,856 |
| 2 | `GPT_SoVITS/pretrained_models/gsv-v5-pretrained/s2Gv5turbo.pth` | 766,406,144 |
| 3 | `GPT_SoVITS/pretrained_models/gsv-v5-pretrained/vocoder.pth` | 57,761,163 |
| 4 | `GPT_SoVITS/pretrained_models/chinese-hubert-base/pytorch_model.bin` | 188,811,417 |
| 5 | `GPT_SoVITS/pretrained_models/chinese-roberta-wwm-ext-large/pytorch_model.bin` | 651,225,145 |
| 6 | `GPT_SoVITS/pretrained_models/fast_langdetect/lid.176.bin` | 131,266,198 |
| 7 | `GPT_SoVITS/text/G2PWModel/g2pW.onnx` | 635,212,732 |
| 8 | `GPT_SoVITS/Accel/vendor/cuda/bin/cudart64_12.dll` | 500,000 |
| 9 | `voices/dabao/ref_dabao3-1.wav` | 1,500,000 |

运行方式：

```powershell
# 自动检测缺失并按 LFS 拉取（约 2.4GB，速度取决于网络）
pwsh -File .\scripts\setup.ps1

# 已有 GPT-SoVITS 安装（如旧 PeiYin）时，从本地目录按相同相对路径复制，省去下载
pwsh -File .\scripts\setup.ps1 -WeightsFrom D:\@kaifa\PeiYin\GPT-SoVITS
```

`ref_dabao3-1.wav` 是 dabao 音色的 1.5MB 参考音频（用户专属音色，不入仓库）；`setup.ps1` 校验其存在与大小，缺失时会提示放置。

### 2. Python 3.11 与 PyTorch（由 setup 自动完成）

`setup.ps1` 用 Python 3.11 创建 `GPT-SoVITS/.venv/`，安装 `torch 2.6 CPU` 与 `requirements-win-cpu.txt`；pip 源默认官方、失败自动回退华为云，torch 源默认交大镜像（国内可直接 `-PipIndexUrl https://repo.huaweicloud.com/repository/pypi/simple/`）。

### 3. FFmpeg / ffprobe（门禁与长稿合成依赖）

```powershell
winget install Gyan.FFmpeg
```

确认 `ffmpeg` 与 `ffprobe` 在 PATH 中。

## 四、运行验证

```powershell
# 1. 初始化 + 权重齐全 + 引擎健康检查通过（默认冒烟启动 tts_server）
pwsh -File .\scripts\setup.ps1

# 2. Python 脚本语法门禁
& '.\GPT-SoVITS\.venv\Scripts\python.exe' -m py_compile `
  .\scripts\synthesize_dabao_paragraphs.py `
  .\scripts\clean_dabao_breaths.py `
  .\scripts\rebuild_dabao_timeline.py `
  .\scripts\repair_dabao_paragraphs.py `
  .\scripts\validate_dabao_audio.py

# 3. 单篇冒烟：出稿机械审计 + 短文本合成 + 门禁
pwsh -File .\scripts\gate-check.ps1 -TxtPath .\口播稿.txt
```

## 五、已知边界

- 文档与脚本来自本地 PeiYin 工作仓库，路径约定（如 AGENTS.md 的源字幕归档路径 `D:\自动剪辑\自说自话的总裁`）为本地工作流约束，迁移到新机器时按需调整。
- `run_dabao_batch.ps1` 为内容线批量配音模板（示例路径指向 lishi），使用前需按内容线修改「配置区」。
- dabao 音色参数细节见 `docs/音色配置.md` 与 `docs/配音参数与音色.md`；预设 `preset.json` 不在仓库，由音色参考音频 + 文档参数在本地重建。
